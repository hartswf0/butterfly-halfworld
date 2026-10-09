// Drives moviemap/tools/posefind.html: index the whole city, then evolve each view's pose, check it, and shoot it.
//   PLAYWRIGHT=… CHROME=… node posefind-run.mjs <outDir> [--views 1,2] [--port 8185]
import {createRequire} from 'node:module'; import fs from 'node:fs'; import path from 'node:path';
const require = createRequire(import.meta.url); const {chromium} = require(process.env.PLAYWRIGHT || 'playwright');
const [out] = process.argv.slice(2), arg = k => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : null; };
const PORT = arg('port') || 8185; fs.mkdirSync(out, {recursive: true});
const S = JSON.parse(fs.readFileSync(new URL('../scenes.json', import.meta.url))), dist = Object.fromEntries(S.views.map(v => [v.n, v.d]));
const HOUR = {haze: 19.6, hive: 1, overseer: 1, bay: 13, ascent: 23, plaza: 0.5, naraka: 1.5, ankhu: 2.5, commons: 20, arcade: 3.5, cenotaph: 7, temple: 7.5};
const VIEWS = arg('views') ? arg('views').split(',').map(Number) : S.views.map(v => v.n);
const browser = await chromium.launch({executablePath: process.env.CHROME, headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist']});
const page = await browser.newPage({viewport: {width: 448, height: 252}}); page.on('pageerror', e => console.error('[pageerror]', e.message));
page.setDefaultTimeout(0);
await page.goto(`http://127.0.0.1:${PORT}/wygwyl/world/moviemap/tools/posefind.html`); await page.waitForFunction('window.pfReady === true', null, {timeout: 600000});
const t0 = Date.now(), IXF = path.join(out, 'index.json'); let ix;
if (process.argv.includes('--reuse') && fs.existsSync(IXF)) { const saved = JSON.parse(fs.readFileSync(IXF)); ix = saved.ix; await page.evaluate(b => PF.loadBest(b), saved.best); }
else { ix = await page.evaluate(() => PF.index()); fs.writeFileSync(IXF, JSON.stringify({ix, best: await page.evaluate(() => PF.best)})); }
console.log('index', JSON.stringify(ix), `${((Date.now() - t0) / 1000).toFixed(0)}s`);
const PJ = path.join(out, 'poses.json'), res = fs.existsSync(PJ) && process.argv.includes('--reuse') ? JSON.parse(fs.readFileSync(PJ)) : {index: ix, views: {}};
async function place(n, opt = {}) {
  const r = await page.evaluate(([n, o]) => PF.refine(n, o), [n, opt]);
  if (!r.placeable) { res.views[n] = {district: dist[n], ...r}; fs.writeFileSync(PJ, JSON.stringify(res)); console.log(n, dist[n], 'not placeable in this language', JSON.stringify(r.info)); return; }
  const ck = await page.evaluate(([n, p]) => PF.check(n, p), [n, r.best.pose]), nl = await page.evaluate(n => PF.nullScores(n), n);
  const sh = await page.evaluate(([p, h]) => PF.shoot(p, h), [r.best.pose, HOUR[dist[n]] ?? 13]);
  const pad = String(n).padStart(3, '0');
  fs.writeFileSync(path.join(out, `${pad}-photo.jpg`), Buffer.from(sh.photo.split(',')[1], 'base64')); fs.writeFileSync(path.join(out, `${pad}-sem.png`), Buffer.from(sh.sem.split(',')[1], 'base64'));
  // the eye says what each picture shows, so a result can be read without looking at it
  const refURL = 'data:image/webp;base64,' + fs.readFileSync(new URL(`../v/${pad}.webp`, import.meta.url)).toString('base64');
  let words = null; try { const d = await (await fetch('http://127.0.0.1:8232/describe', {method: 'POST', body: JSON.stringify({images: [refURL, sh.photo]})})).json();
    const [a, b] = d.emb; words = {ref: d.caption[0], found: d.caption[1], refTags: d.tags[0], foundTags: d.tags[1], clip: +a.reduce((s, v, i) => s + v * b[i], 0).toFixed(3)}; } catch (e) { words = {error: String(e)}; }
  const pr = await page.evaluate(n => PF.prompt(n), n);
  res.views[n] = {district: dist[n], ...r, check: ck, null: nl, words, shot: pr && {hfov: pr.hfov, vantage: pr.vantage[0]?.kind ?? null, said: pr.vantage[0]?.said ?? null, subjects: pr.subjects}, ...(opt.anchor ? {sibling: opt.sibling} : {})};
  fs.writeFileSync(PJ, JSON.stringify(res));
  console.log(n, dist[n], opt.anchor ? `(beside ${opt.sibling.of})` : '', 'score', r.best.s.toFixed(3), JSON.stringify(Object.fromEntries(Object.entries(r.best.parts).map(([k, v]) => [k, +(+v).toFixed(2)]))), 'own rank', ck.rank, 'null median', nl.median?.toFixed(3), 'p95', nl.p95?.toFixed(3), r.best.from.kind, `h ${r.best.h.toFixed(1)} hfov ${r.best.pose.hfov.toFixed(0)}`, `${((Date.now() - t0) / 1000).toFixed(0)}s`);
  if (words?.ref) console.log(`   sees: "${words.ref}"  →  found: "${words.found}"  (clip ${words.clip})`);
}
for (const n of VIEWS) await place(n);
// siblings: pictures made from one prompt are one place shot as different takes. The best-placed sibling anchors the group; the
// others are searched again around it (any heading), and the solo result is kept beside it for comparison.
if (!process.argv.includes('--no-siblings')) for (const g of await page.evaluate(() => PF.siblings())) {
  const ok = g.filter(n => VIEWS.includes(n) && res.views[n]?.placeable); if (ok.length < 2) continue;
  const a = ok.reduce((b, n) => res.views[n].best.s > res.views[b].best.s ? n : b), ap = res.views[a].best.pose;
  for (const n of ok) if (n !== a) { const solo = {s: res.views[n].best.s, pose: res.views[n].best.pose, clip: res.views[n].words?.clip, rank: res.views[n].check.rank};
    await place(n, {anchor: {x: ap.x, y: ap.y, h: res.views[a].best.h, yaw: ap.yaw, pitch: ap.pitch, hfov: ap.hfov}, sibling: {of: a, solo}}); }
}
await browser.close();
