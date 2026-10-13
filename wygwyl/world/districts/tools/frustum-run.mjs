// THE FRUSTUM SEARCH — for each of the 100 views, find the camera in a world whose frame CLIP reads as closest to the view.
// A cross-entropy search: 96 random frustums in the view's district, then three rounds of 48 drawn around the best 8,
// the spread shrinking each round. Each frame is scored by clip_server.py (the archive's CLIP): cosine to the view, and the
// view's rank among all 100 views (1 = CLIP would pick this view as the one the frame shows).
//   worlds:  mood  — the mood city (../../mood/index.html?harness=1), searched around the view's hero place
//            city  — the generic city as the movie map renders it (../../moviemap/tools/capture.html), searched in the
//                    district's site from the scene book, with the hour and weather searched too (its best chance)
//   PLAYWRIGHT=… CHROME=… node frustum-run.mjs <mood|city> <outDir> [--views 1,2,3] [--port 8185] [--clip 8231]
import {createRequire} from 'node:module'; import fs from 'node:fs'; import path from 'node:path';
const require = createRequire(import.meta.url); const {chromium} = require(process.env.PLAYWRIGHT || 'playwright');
const [world, out] = process.argv.slice(2), arg = k => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : null; };
const PORT = arg('port') || 8185, CLIP = arg('clip') || 8231, W = 448, H = 252;
fs.mkdirSync(out, {recursive: true});
const S = JSON.parse(fs.readFileSync(new URL('../scenes.json', import.meta.url)));
const VIEWS = (arg('views') ? arg('views').split(',').map(Number) : S.views.map(v => v.n));
const dist = Object.fromEntries(S.views.map(v => [v.n, v.d])), site = Object.fromEntries(S.districts.map(d => [d.id, d.site]));

// a seeded random, so a rerun searches the same frustums
let seed = 7; const R = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296), N = () => Math.sqrt(-2 * Math.log(R() + 1e-12)) * Math.cos(2 * Math.PI * R());
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const score = async (view, imgs) => (await fetch(`http://127.0.0.1:${CLIP}/score`, {method: 'POST', body: JSON.stringify({view, imgs})})).json();

const browser = await chromium.launch({executablePath: process.env.CHROME, headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist']});
const page = await browser.newPage({viewport: {width: W, height: H}}); page.on('pageerror', e => console.error('[pageerror]', e.message));
let places = null, stations = [];
const MODE = {mood: 'sets', mood2: 'sets', mood3: 'folds'}[world];
if (world.startsWith('mood')) { await page.goto(`http://127.0.0.1:${PORT}/wygwyl/world/mood/index.html?harness=1&mode=${MODE}`); await page.waitForFunction('window.__moodReady === true', null, {timeout: 120000}); places = await page.evaluate(() => window.__mood.places); stations = await page.evaluate(() => window.__mood.stations || []); }
else { await page.goto(`http://127.0.0.1:${PORT}/wygwyl/world/moviemap/tools/capture.html?w=${W}&h=${H}&shadows=0`); await page.waitForFunction('window.capReady === true', null, {timeout: 300000});
  await page.evaluate(() => { const e = window.cap.eng; e.setEra(5); e.setDoy(265); }); }

// a frustum's parameters → the camera each world wants. Mood: metres, y up, z south. City: plan x east, y south, z up.
const LIGHTS = [{hour: 1, weather: 'clear'}, {hour: 19.6, weather: 'clear'}, {hour: 13, weather: 'clear'}, {hour: 1, weather: 'rain'}, {hour: 19.6, weather: 'fog'}, {hour: 13, weather: 'fog'}];
function region(n) {
  if (world.startsWith('mood')) { const pid = (places.find(p => p.views.includes(n)) || places.find(p => p.district === dist[n]) || {}).id; const P = places.find(p => p.id === pid);
    const st = world === 'mood3' ? stations.find(x => x.n === n) : null;
    return P ? {cx: st ? st.p[0] : P.at[0], cz: st ? st.p[2] : P.at[1], r: st ? 60 : 170, hero: st ? {p: st.p, t: st.t, fov: st.fov} : P.views.includes(n) ? P.cam : null, place: P.id} : null; }
  const s = site[dist[n]]; return s && s.x != null ? {cx: s.x, cz: s.y, r: Math.min(s.r, 520), place: dist[n]} : null;
}
function sample(g) {           // g: a region, plus optional elite mean/sd for refinement
  const r = g.r * Math.sqrt(R()), a = R() * 2 * Math.PI;
  return {x: g.cx + r * Math.cos(a), z: g.cz + r * Math.sin(a), h: Math.exp(Math.log(1.6) + R() * (Math.log(world.startsWith('mood') ? 140 : 90) - Math.log(1.6))),
    yaw: world.startsWith('mood') ? Math.atan2(g.cz - (g.cz + r * Math.sin(a)), g.cx - (g.cx + r * Math.cos(a))) + N() * 0.7 : R() * 2 * Math.PI,
    pitch: -0.35 + R() * 1.15, fov: 30 + R() * 60, L: Math.floor(R() * LIGHTS.length)};
}
function perturb(e, s) {
  return {x: e.x + N() * 40 * s, z: e.z + N() * 40 * s, h: clamp(e.h * Math.exp(N() * 0.5 * s), 1.2, 160), yaw: e.yaw + N() * 0.5 * s, pitch: clamp(e.pitch + N() * 0.25 * s, -0.5, 1.2),
    fov: clamp(e.fov + N() * 12 * s, 24, 100), L: R() < 0.15 * s ? Math.floor(R() * LIGHTS.length) : e.L};
}
async function render(fs_) {
  if (world.startsWith('mood')) return page.evaluate(cs => window.__mood.render(cs), fs_.map(f => {
    const d = [Math.cos(f.yaw) * Math.cos(f.pitch), Math.sin(f.pitch), Math.sin(f.yaw) * Math.cos(f.pitch)];
    return {p: [f.x, f.h, f.z], t: [f.x + d[0] * 60, f.h + d[1] * 60, f.z + d[2] * 60], fov: f.fov}; }));
  // the city: group by light so the sky settles once per light
  const order = fs_.map((f, i) => i).sort((a, b) => fs_[a].L - fs_[b].L), res = new Array(fs_.length);
  const shots = await page.evaluate(({cs, LIGHTS}) => { const e = window.cap.eng, out = []; let L = -1;
    for (const c of cs) { if (c.L !== L) { L = c.L; e.setHour(LIGHTS[L].hour); e.setWeather(LIGHTS[L].weather); e.setWet(LIGHTS[L].weather === 'rain' ? 1 : 0); }
      e.setHfov(c.fov * 16 / 9 > 120 ? 120 : Math.min(120, 2 * Math.atan(Math.tan(c.fov * Math.PI / 360) * 16 / 9) * 180 / Math.PI));
      e.poseFree(c.x, c.z, e.groundY(c.x, c.z) + c.h, c.yaw, c.pitch); e.advance(0); e.render(); out.push(e.renderer.domElement.toDataURL('image/jpeg', 0.85)); }
    return out; }, {cs: order.map(i => fs_[i]), LIGHTS});
  order.forEach((i, k) => { res[i] = shots[k]; }); return res;
}
async function near(n, b) {
  seed = 1000 + n; const fs_ = Array.from({length: 12}, () => { const a = R() * 2 * Math.PI, d = 3 + R() * 5;
    return {...b, x: b.x + d * Math.cos(a), z: b.z + d * Math.sin(a), h: Math.max(1.2, b.h + N() * 0.8), yaw: b.yaw + N() * 0.3, pitch: clamp(b.pitch + N() * 0.1, -0.5, 1.2)}; });
  const sc = await score(n, await render(fs_)), med = a => [...a].sort((x, y) => x - y)[a.length >> 1];
  return {cos: med(sc.cos), rank: med(sc.rank), top5: sc.rank.filter(r => r <= 5).length / sc.rank.length};
}
const report = fs.existsSync(path.join(out, 'search.json')) ? JSON.parse(fs.readFileSync(path.join(out, 'search.json'))) : {};
const t0 = Date.now();
if (process.argv.includes('--near')) {
  for (const n of VIEWS) { const r = report[n]; if (!r || r.none || r.near) continue; r.near = await near(n, r.best); fs.writeFileSync(path.join(out, 'search.json'), JSON.stringify(report)); console.log(world, n, 'near', JSON.stringify(r.near)); }
  await browser.close(); process.exit(0);
}
for (const n of VIEWS) {
  if (report[n]) continue; const g = region(n); if (!g) { report[n] = {none: true, district: dist[n]}; continue; }
  let pop = Array.from({length: 96}, () => sample(g)), all = [];
  if (g.hero) { const p = g.hero.p, t = g.hero.t, dx = t[0] - p[0], dy = t[1] - p[1], dz = t[2] - p[2];
    pop[0] = {x: p[0], z: p[2], h: p[1], yaw: Math.atan2(dz, dx), pitch: Math.atan2(dy, Math.hypot(dx, dz)), fov: g.hero.fov, L: 0, hero: true}; }
  for (let round = 0; round < 4; round++) {
    const imgs = await render(pop), sc = await score(n, imgs);
    pop.forEach((f, i) => all.push({...f, cos: sc.cos[i], rank: sc.rank[i], img: imgs[i], round}));
    all.sort((a, b) => b.cos - a.cos); all = all.slice(0, 24);
    const el = all.slice(0, 8), s = [1, 0.6, 0.35][round] ?? 0.2; pop = Array.from({length: 48}, (_, i) => perturb(el[i % el.length], s));
  }
  const best = all[0], hero = g.hero ? all.find(a => a.hero) : null;
  fs.writeFileSync(path.join(out, `${String(n).padStart(3, '0')}.jpg`), Buffer.from(best.img.split(',')[1], 'base64'));
  const strip = ({img, ...f}) => ({...f, x: +f.x.toFixed(1), z: +f.z.toFixed(1), h: +f.h.toFixed(2), yaw: +f.yaw.toFixed(3), pitch: +f.pitch.toFixed(3), fov: +f.fov.toFixed(1)});
  report[n] = {district: dist[n], place: g.place, best: strip(best), light: world === 'city' ? LIGHTS[best.L] : null, top: all.slice(1, 6).map(strip)};
  report[n].near = await near(n, best);
  if (g.hero) { const hs = await score(n, await render([{...pop[0], ...{x: g.hero.p[0], z: g.hero.p[2], h: g.hero.p[1], yaw: Math.atan2(g.hero.t[2] - g.hero.p[2], g.hero.t[0] - g.hero.p[0]), pitch: Math.atan2(g.hero.t[1] - g.hero.p[1], Math.hypot(g.hero.t[0] - g.hero.p[0], g.hero.t[2] - g.hero.p[2])), fov: g.hero.fov}}]));
    report[n].hero = {cos: hs.cos[0], rank: hs.rank[0]}; }
  fs.writeFileSync(path.join(out, 'search.json'), JSON.stringify(report));
  console.log(world, n, dist[n], 'cos', best.cos, 'rank', best.rank, report[n].hero ? `hero ${report[n].hero.cos}/${report[n].hero.rank}` : '', `${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
await browser.close();
