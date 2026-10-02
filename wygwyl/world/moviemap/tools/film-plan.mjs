#!/usr/bin/env node
// WHERE YOU GO WHEN YOU LEAVE — the movie map as one film. The album's own clock is the axis (clock.json: the unified drone record,
// 1,440 s, each poem in its passage); his reading sits inside its passage; the treatment gives each passage its hour and weather
// (world.json). The camera car leaves each poem's site through the whole street plan (rendered live, so no street is out of reach),
// moving only while he speaks, looking where his lines are written or at what stands in clear sight, looking back on the last line;
// a passage's tail after the reading shows the last place in its six eras; the canon's pictures surface where they were taken.
// Deterministic: plan, city, clock, world, timings in → film/cut.json out.   node wygwyl/world/moviemap/tools/film-plan.mjs
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url)), MM = join(HERE, '..'), W = join(MM, '..', '..');
const J = p => JSON.parse(readFileSync(p, 'utf8'));
const samples = J(join(W, 'samples.json')), plan = J(join(MM, 'plan.json')), meta = J(join(MM, '..', 'city3d', 'city.json')), clock = J(join(W, 'clock.json')), world = J(join(W, 'world', 'world.json'));
const E = plan.edges, N = plan.nodes, STEP = 3, VMAX = 7;
const TAU = Math.PI * 2, wrap = a => ((a + Math.PI) % TAU + TAU) % TAU - Math.PI, R2 = v => Math.round(v * 100) / 100, R1 = v => Math.round(v * 10) / 10, R3 = v => Math.round(v * 1000) / 1000;
const norm = s => s.toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();

// ——— the light of each passage, read from the treatment's time of day and weather (world.json sites) ———
// hour: [from, to] across the passage (local); weather: [first, then] with the change at `at` (fraction); wet streets where it says so
const LIGHT = {
  '01': {hour: [19.2, 20.4], weather: ['clear'], why: 'evening into night; the fire escape at dusk'},
  '02': {hour: [1.0, 1.2], weather: ['clear'], why: 'after midnight'},
  '03': {hour: [10, 18.5], weather: ['cloudy', 'storm'], at: 0.62, wet: 0.7, why: 'a time-lapse across a day, ending in storm'},
  '04': {hour: [19.4, 21.6], weather: ['clear'], why: 'twilight deepening to full dark; moonlight'},
  '05': {hour: [23.2, 23.4], weather: ['clear'], why: 'still night, deep starlight'},
  '06': {hour: [0.4, 0.6], weather: ['clear'], why: 'still night; warm-lit windows'},
  '07': {hour: [1.5, 1.7], weather: ['clear'], why: 'late night, the midnight booth'},
  '08': {hour: [2.4, 2.8], weather: ['clear'], why: 'deep night, city glow below'},
  '09': {hour: [3.5, 4.1], weather: ['cloudy'], wet: 1, why: 'late night, moon up, wet pavement'},
  '10': {hour: [4.6, 7.4], weather: ['clear'], wet: 1, why: 'midnight through the last of the night to first light; tire spray on wet asphalt'},
  '11': {hour: [7.5, 8.3], weather: ['fog'], why: 'early morning just after dawn; mist on the distant sea'},
  '12': {hour: [17.6, 19.8], weather: ['clear'], why: 'twilight and dusk, ending at a lit porch'},
  '13': {hour: [12.6, 14.2], weather: ['clear', 'fog'], at: 0.72, why: 'daytime; haze gathering over the harbor at the end'},
  '14': {hour: [22.5, 22.7], weather: ['clear'], why: 'timeless; the party reads as night'},
};

// ——— line of sight on the plan (footprints standing in Resurrection, landmark ground, the land itself) ———
const bb = readFileSync(join(MM, '..', 'city3d', 'buildings.f32')), B = new Float32Array(bb.buffer, bb.byteOffset, bb.byteLength / 4), BG = new Map();
for (let k = 0; k < B.length / 14; k++) { const o = k * 14; if (B[o + 7] > 5 || (B[o + 8] <= 5 && !B[o + 9])) continue; const key = Math.floor(B[o] / 40) + ',' + Math.floor(B[o + 1] / 40); (BG.get(key) || BG.set(key, []).get(key)).push(o); }
const LMS = meta.landmarks.filter(m => m.r && m.type !== 'bridge');
const hb = readFileSync(join(MM, '..', 'city3d', 'height.bin')), H16 = new Int16Array(hb.buffer, hb.byteOffset, hb.byteLength / 2), {nx, ny, cell} = meta;
const ground = (x, y) => Math.max(0.35, H16[Math.min(ny - 1, Math.max(0, Math.round(y / cell))) * nx + Math.min(nx - 1, Math.max(0, Math.round(x / cell)))] / 10);
function seen(x0, y0, x1, y1, skip = null) {
  const L = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(L / 2), z0 = ground(x0, y0) + 2.8, z1 = ground(x1, y1) + 6;
  for (let k = 2; k < n - 3; k++) { const x = x0 + (x1 - x0) * k / n, y = y0 + (y1 - y0) * k / n;
    if (ground(x, y) > z0 + (z1 - z0) * k / n - 0.5) return false;
    for (const m of LMS) if (m !== skip && Math.hypot(m.x - x, m.y - y) < m.r * 0.8) return false;
    for (let gx = -1; gx <= 1; gx++) for (let gy = -1; gy <= 1; gy++) for (const o of BG.get((Math.floor(x / 40) + gx) + ',' + (Math.floor(y / 40) + gy)) || []) {
      const c = Math.cos(B[o + 4]), s = Math.sin(B[o + 4]), dx = x - B[o], dy = y - B[o + 1], u = dx * c + dy * s, v = -dx * s + dy * c;
      if (Math.abs(u) < B[o + 2] / 2 && Math.abs(v) < B[o + 3] / 2) return false; } }
  return true;
}

// ——— the whole street plan (no highways), each block's centre every ~3 m ———
const adj = new Map(); E.forEach((e, i) => { if (e.cls === 2) return; for (const [u, v] of [[e.a, e.b], [e.b, e.a]]) (adj.get(u) || adj.set(u, []).get(u)).push([v, i]); });
const stepCache = new Map();
function steps(ei) {
  if (stepCache.has(ei)) return stepCache.get(ei);
  const f = E[ei].pts, P = []; for (let i = 0; i < f.length; i += 2) P.push([f[i], f[i + 1]]);
  const S = [0]; for (let i = 1; i < P.length; i++) S.push(S[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const at = d => { d = Math.max(0, Math.min(S[S.length - 1], d)); let i = 1; while (i < S.length - 1 && S[i] < d) i++; const t = (d - S[i - 1]) / ((S[i] - S[i - 1]) || 1); return [P[i - 1][0] + (P[i][0] - P[i - 1][0]) * t, P[i - 1][1] + (P[i][1] - P[i - 1][1]) * t]; };
  const L = S[S.length - 1], n = Math.max(2, Math.round(L / STEP) + 1), out = [];
  for (let i = 0; i < n; i++) { const d = L * i / (n - 1), p = at(d), a = at(d - 8), b = at(d + 8); out.push([p[0], p[1], Math.atan2(b[1] - a[1], b[0] - a[0])]); }
  stepCache.set(ei, out); return out;
}
const walk = (ei, from) => { const st = steps(ei), w = E[ei].w; return (E[ei].a === from ? st : [...st].reverse().map(([x, y, h]) => [x, y, wrap(h + Math.PI)])).slice(1).map(p => [...p, w]); };

function route(p, q, vt) {
  // from the street point nearest the poem's site, through the plan toward the next poem; an empty journey drives as far as it can
  // where to stand: on a street ~30 m from the site, clear of every landmark's ground, with the site in sight (else simply the nearest)
  let st = null; E.forEach((e, ei) => { if (e.cls === 2) return; steps(ei).forEach((x, i) => { const d = Math.hypot(x[0] - p.x, x[1] - p.y); if (d > 160) return;
    const clear = LMS.every(m => Math.hypot(m.x - x[0], m.y - x[1]) > m.r * 1.1 + 8), sc = Math.abs(d - 30) + (clear ? 0 : 500) + (seen(x[0], x[1], p.x, p.y) ? 0 : 60);
    if (!st || sc < st.sc) st = {d, ei, i, sc}; }); });
  if (!st) E.forEach((e, ei) => { if (e.cls === 2) return; steps(ei).forEach((x, i) => { const d = Math.hypot(x[0] - p.x, x[1] - p.y); if (!st || d < st.d) st = {d, ei, i}; }); });
  const e0 = E[st.ei], s0 = steps(st.ei), n0 = s0.length;
  const lead = {[e0.b]: s0.slice(st.i + 1).map(x => [...x, e0.w]), [e0.a]: s0.slice(0, st.i).reverse().map(([x, y, h]) => [x, y, wrap(h + Math.PI), e0.w])};
  const best = new Map(), prev = new Map(), Q = [], done = new Set();
  for (const u of [e0.a, e0.b]) { best.set(u, lead[u].length); prev.set(u, null); Q.push([lead[u].length, u]); }
  while (Q.length) { Q.sort((a, b) => a[0] - b[0]); const [c, u] = Q.shift(); if (done.has(u)) continue; done.add(u);
    for (const [v, ei] of adj.get(u) || []) { if (ei === st.ei) continue; const nc = c + steps(ei).length - 1 + (E[ei].cls === 0 ? 2 : 0); if (nc < (best.get(v) ?? 1e9)) { best.set(v, nc); prev.set(v, [u, ei]); Q.push([nc, v]); } } }
  // a journey long enough to carry the reading (≈2 steps a spoken second, at most VMAX), ending as near the next poem as that allows
  let direct = null; for (const [v, c] of best) { const sc = Math.hypot(N[v][0] - q.x, N[v][1] - q.y) + 0.35 * c * STEP; if (!direct || sc < direct.sc) direct = {v, c, sc}; }
  const want = Math.min(VMAX * vt, Math.max(direct.c, 2.1 * vt)); let end = null;
  for (const [v, c] of best) { const sc = Math.abs(c - want) * STEP * 1.5 + Math.hypot(N[v][0] - q.x, N[v][1] - q.y) * 0.25; if (!end || sc < end.sc) end = {v, c, sc}; }
  const chain = []; for (let v = end.v; prev.get(v); v = prev.get(v)[0]) chain.unshift(prev.get(v));
  const first = chain.length ? chain[0][0] : end.v;
  const h0 = lead[first].length ? lead[first][0][2] : s0[st.i][2];
  const path = [[s0[st.i][0], s0[st.i][1], h0, e0.w], ...lead[first]];
  for (const [u, ei] of chain) path.push(...walk(ei, u));
  return {path, startDist: st.d};
}

const ways = []; const wayIx = new Map(); const wid = w => { if (!wayIx.has(w)) { wayIx.set(w, ways.length); ways.push(plan.ways[w].name); } return wayIx.get(w); };
const usedShots = new Set(), chapters = [];
for (const [k, span] of clock.spans.entries()) {
  const p = meta.poems.find(q => q.num === span.num), q = meta.poems[(k + 1) % meta.poems.length], T = J(join(W, 'timings', span.num + '.json')), site = world.sites.find(s => s.num === span.num);
  // the reading sits where the album puts it in its passage (samples.json: the drone's offset_in_container), not where it would be convenient
  const spanDur = span.t1 - span.t0, lead = samples.tracks.find(t => t.num === span.num).drone.offset_in_container, read0 = span.t0 + lead;
  const vt0 = T.segments.reduce((a, s) => a + s.words.reduce((b, w) => b + Math.max(0, w.e - w.s), 0), 0);
  const {path, startDist} = route(p, q, vt0), Np = path.length - 1;
  const placed = meta.words.filter(w => w.poem === p.num);
  const lines = T.segments.map(s => ({s: R2(read0 + s.start), e: R2(read0 + s.end), text: s.text.trim(), words: s.words.map(w => [w.w, R2(read0 + w.s), R2(read0 + w.e)]), v: s.words.reduce((a, w) => a + Math.max(0, w.e - w.s), 0)}));
  const Vt = lines.reduce((a, l) => a + l.v, 0); let acc = 0;
  for (const [j, l] of lines.entries()) {
    const q0 = Np * acc / Vt; acc += l.v; const q1 = Np * acc / Vt;
    l.p0 = R1(q1 - q0 > VMAX * l.v ? q1 - VMAX * l.v : q0); l.p1 = R1(q1); l.cut = j > 0 && Math.abs(l.p0 - lines[j - 1].p1) > 0.5;
    const at = path[Math.round(l.p0)], end = path[Math.round(l.p1)], pl = placed.find(w => norm(w.t).slice(0, 25) === norm(l.text).slice(0, 25));
    if (pl && Math.hypot(pl.x - at[0], pl.y - at[1]) < 160 && seen(at[0], at[1], pl.x, pl.y)) { l.look = [R1(pl.x), R1(pl.y), R1(pl.z + 6)]; l.lookName = 'his line, written here'; }
    else if (j === lines.length - 1) l.back = 1;
    else { const lm = meta.landmarks.filter(m => m.type !== 'bridge' && !(m.era[1] < 9 && !m.era[2])).map(m => { const d = Math.hypot(m.x - end[0], m.y - end[1]), rel = wrap(Math.atan2(m.y - end[1], m.x - end[0]) - end[2]); return {m, d, rel}; })
        .filter(o => o.d > 25 && o.d < 160 && Math.abs(o.rel) < 1.9 && seen(end[0], end[1], o.m.x, o.m.y, o.m)).sort((a, b) => a.d - b.d)[0];
      if (lm && !(j > 0 && lines[j - 1].lookName === lm.m.name)) { l.look = [R1(lm.m.x), R1(lm.m.y), R1(Math.max(lm.m.z, 0) + 12)]; l.lookName = lm.m.name.split(' · ')[0]; } }
    // the canon's pictures surface where they were taken: a shot within 45 m whose camera faced the way we face
    const mid = path[Math.round((l.p0 + l.p1) / 2)], face = l.back ? wrap(mid[2] + Math.PI) : l.look ? Math.atan2(l.look[1] - mid[1], l.look[0] - mid[0]) : mid[2];
    const sh = meta.shots.filter(s => !usedShots.has(s.cid) && Math.hypot(s.x - mid[0], s.y - mid[1]) < 45 && Math.abs(wrap(s.hd * Math.PI / 180 - face)) < 0.9)
      .sort((a, b) => Math.hypot(a.x - mid[0], a.y - mid[1]) - Math.hypot(b.x - mid[0], b.y - mid[1]))[0];
    if (sh && l.e - l.s > 2.5 && !lines.slice(Math.max(0, j - 2), j).some(o => o.shot)) { usedShots.add(sh.cid); l.shot = {cid: sh.cid, source: sh.source, el: sh.el, t: R2((l.s + l.e) / 2 - 1.2), dur: 2.6}; }
    delete l.v;
  }
  // the tail after his last word: the place flashes through its six eras (at least ~0.5 s an era), or there is no coda
  const tail = span.t1 - lines[lines.length - 1].e, coda = tail >= 3.2 ? {t: R2(span.t1 - Math.min(9, tail - 0.3)), dur: R2(Math.min(9, tail - 0.3))} : null;
  const L = LIGHT[span.num];
  chapters.push({num: span.num, title: p.title, t0: R3(span.t0), t1: R3(span.t1), read0: R3(read0), reading: span.reading, readDur: T.duration,
    light: {...L, treatment: site ? site.time_of_day : ''}, startDist: Math.round(startDist), metres: Math.round(Np * STEP),
    path: path.map(([x, y, h, w]) => [R1(x), R1(y), R3(h), wid(w)]), lines, coda});
  console.log(`${span.num} ${p.title.padEnd(31)} ${spanDur.toFixed(0).padStart(4)} s passage · reading at +${lead.toFixed(1)} · ${String(Math.round(Np * STEP)).padStart(5)} m · ${lines.filter(l => l.cut).length} cuts · ${lines.filter(l => l.look).length} looks · ${lines.filter(l => l.shot).length} pictures · coda ${coda ? coda.dur + ' s' : '—'} · ${L.hour.join('→')}h ${L.weather.join('→')}`);
}
const cut = {version: 'moviemap-film-v1', title: 'Where You Go When You Leave', subtitle: 'a movie map of Atlantis', fps: 24, width: 1280, height: 720, picture: [1280, 536], hfov: 76, eye: 2.8,
  duration: clock.duration, credits: 14, drone: clock.drone, ways, chapters,
  from: {canon: meta.from.canon_checksum, city: meta.from.city_checksum, plan: plan.checksum}};
cut.checksum = createHash('sha1').update(JSON.stringify(chapters)).digest('hex').slice(0, 12);
mkdirSync(join(MM, 'film'), {recursive: true});
writeFileSync(join(MM, 'film', 'cut.json'), JSON.stringify(cut));
console.log('film/cut.json', cut.checksum, (JSON.stringify(cut).length / 1024).toFixed(0) + ' KB', '·', (clock.duration + cut.credits).toFixed(0), 's');
