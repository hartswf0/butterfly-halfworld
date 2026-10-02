#!/usr/bin/env node
// THE POEM DRIVES THE CAR — fourteen films compiled from the readings onto the disc. Deterministic: same plan, disc and timings in,
// same cut list out (films.json). Each film:
//   · opens at the poem's site, the camera turning to each of his lines where they are written into the city;
//   · then leaves — down the disc toward the next poem — moving only while he speaks (the voice is the throttle; a breath is a held frame);
//   · when the road is longer than the reading can carry, it jumps forward at a line's start (a cut), never mid-line;
//   · the last line looks back; after it, the place is shown across its six eras under a still camera.
//   node wygwyl/world/moviemap/tools/compile-films.mjs
import {readFileSync, writeFileSync, existsSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url)), MM = join(HERE, '..'), W = join(MM, '..', '..');
const plan = JSON.parse(readFileSync(join(MM, 'plan.json'), 'utf8')), disc = JSON.parse(readFileSync(join(MM, 'disc.json'), 'utf8'));
const meta = JSON.parse(readFileSync(join(MM, '..', 'city3d', 'city.json'), 'utf8'));
const E = plan.edges, SEG = new Map(disc.segments.map(s => [s.seg, s]));
// line of sight on the plan: a look is only turned if nothing standing (a building's footprint, a landmark's ground) is between
const bb = readFileSync(join(MM, '..', 'city3d', 'buildings.f32')), B = new Float32Array(bb.buffer, bb.byteOffset, bb.byteLength / 4), BG = new Map();
for (let k = 0; k < B.length / 14; k++) { const o = k * 14; if (B[o + 7] > 5 || (B[o + 8] <= 5 && !B[o + 9])) continue; const key = Math.floor(B[o] / 40) + ',' + Math.floor(B[o + 1] / 40); (BG.get(key) || BG.set(key, []).get(key)).push(o); }
const LMS = meta.landmarks.filter(m => m.r && m.type !== 'bridge');
const hb = readFileSync(join(MM, '..', 'city3d', 'height.bin')), H16 = new Int16Array(hb.buffer, hb.byteOffset, hb.byteLength / 2), {nx, ny, cell} = meta;
const ground = (x, y) => Math.max(0.35, H16[Math.min(ny - 1, Math.max(0, Math.round(y / cell))) * nx + Math.min(nx - 1, Math.max(0, Math.round(x / cell)))] / 10);
function seen(x0, y0, x1, y1, skip = null) {
  const L = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(L / 2), z0 = ground(x0, y0) + 2.8, z1 = ground(x1, y1) + 6;
  for (let k = 2; k < n - 3; k++) { const x = x0 + (x1 - x0) * k / n, y = y0 + (y1 - y0) * k / n;
    if (ground(x, y) > z0 + (z1 - z0) * k / n - 0.5) return false;                 // the land itself rises between
    for (const m of LMS) if (m !== skip && Math.hypot(m.x - x, m.y - y) < m.r * 0.8) return false;
    for (let gx = -1; gx <= 1; gx++) for (let gy = -1; gy <= 1; gy++) for (const o of BG.get((Math.floor(x / 40) + gx) + ',' + (Math.floor(y / 40) + gy)) || []) {
      const c = Math.cos(B[o + 4]), s = Math.sin(B[o + 4]), dx = x - B[o], dy = y - B[o + 1], u = dx * c + dy * s, v = -dx * s + dy * c;
      if (Math.abs(u) < B[o + 2] / 2 && Math.abs(v) < B[o + 3] / 2) return false; } }
  return true;
}
const VMAX = 6, PRE = 3.2, CODA = 1.4 * 6 + 1.5;                    // steps per spoken second at most; title hold; six eras + a breath
const TAU = Math.PI * 2, wrap = a => ((a + Math.PI) % TAU + TAU) % TAU - Math.PI, R2 = v => Math.round(v * 100) / 100;
const norm = s => s.toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();

// the disc as a graph: only filmed blocks, so every frame of every film is on the disc
const adj = new Map(); for (const s of disc.segments) for (const [u, v] of [[s.a, s.b], [s.b, s.a]]) (adj.get(u) || adj.set(u, []).get(u)).push([v, s.seg]);
const stepsOf = seg => SEG.get(seg).steps;
const headingAt = ([seg, i, dir]) => { const h = stepsOf(seg)[i][2]; return dir > 0 ? h : wrap(h + Math.PI); };
const posAt = ([seg, i]) => stepsOf(seg)[i];
// the steps of a block driven from node u to the other end, as [seg, i, dir], without repeating the corner
const blockFrom = (seg, u) => { const s = SEG.get(seg), n = s.n; return s.a === u ? Array.from({length: n - 1}, (_, k) => [seg, k + 1, 1]) : Array.from({length: n - 1}, (_, k) => [seg, n - 2 - k, -1]); };

function route(p, q) {
  // start: the disc frame nearest the poem's site
  let st = null; for (const s of disc.segments) s.steps.forEach((x, i) => { const d = Math.hypot(x[0] - p.x, x[1] - p.y); if (!st || d < st.d) st = {d, seg: s.seg, i}; });
  const s0 = SEG.get(st.seg);
  // two ways off the first block; Dijkstra over the disc from each end
  const best = new Map(), prev = new Map(), Q = [];
  const lead = {[s0.b]: Array.from({length: s0.n - 1 - st.i}, (_, k) => [st.seg, st.i + 1 + k, 1]), [s0.a]: Array.from({length: st.i}, (_, k) => [st.seg, st.i - 1 - k, -1])};
  for (const u of [s0.a, s0.b]) { const c = lead[u].length; if (c < (best.get(u) ?? 1e9)) { best.set(u, c); prev.set(u, null); Q.push([c, u]); } }
  const done = new Set();
  while (Q.length) { Q.sort((a, b) => a[0] - b[0]); const [c, u] = Q.shift(); if (done.has(u)) continue; done.add(u);
    for (const [v, seg] of adj.get(u) || []) { if (seg === st.seg) continue; const nc = c + SEG.get(seg).n - 1; if (nc < (best.get(v) ?? 1e9)) { best.set(v, nc); prev.set(v, [u, seg]); Q.push([nc, v]); } } }
  // the end: the reachable corner nearest the next poem; if that is no journey at all, the farthest corner (leaving is the point)
  const N = plan.nodes; let end = null;
  for (const [v, c] of best) { const sc = Math.hypot(N[v][0] - q.x, N[v][1] - q.y) + 0.6 * c; if (!end || sc < end.sc) end = {v, c, sc}; }
  if (end.c < 60) for (const [v, c] of best) if (c > end.c) end = {v, c};
  const chain = []; for (let v = end.v; prev.get(v); v = prev.get(v)[0]) chain.unshift(prev.get(v));
  const first = chain.length ? chain[0][0] : end.v, path = [[st.seg, st.i, lead[first].length && lead[first][0][2] || 1], ...lead[first]];
  for (const [u, seg] of chain) path.push(...blockFrom(seg, u));
  return {path, start: st, to: N[end.v]};
}

const films = [];
for (const [k, p] of meta.poems.entries()) {
  const q = meta.poems[(k + 1) % meta.poems.length], tf = join(W, 'timings', p.num + '.json'); if (!existsSync(tf)) continue;
  const T = JSON.parse(readFileSync(tf, 'utf8'));
  const {path, start} = route(p, q), Np = path.length - 1;
  const placed = meta.words.filter(w => w.poem === p.num);
  const lines = T.segments.map(s => ({s: R2(s.start), e: R2(s.end), text: s.text.trim(), words: s.words.map(w => [w.w, R2(w.s), R2(w.e)]), v: s.words.reduce((a, w) => a + Math.max(0, w.e - w.s), 0)}));
  const Vt = lines.reduce((a, l) => a + l.v, 0);
  // allot the road to the lines by how long each is spoken; a line that cannot cover its share at VMAX jumps to it
  let acc = 0;
  for (const [j, l] of lines.entries()) {
    const q0 = Math.round(Np * acc / Vt); acc += l.v; const q1 = Math.round(Np * acc / Vt);
    l.p0 = q1 - q0 > VMAX * l.v ? Math.round(q1 - VMAX * l.v) : q0; l.p1 = q1; l.cut = j > 0 && l.p0 !== lines[j - 1].p1;
    // where he looks: at the line written into the city if it is near; the last line looks back; otherwise down the road
    const pl = placed.find(w => norm(w.t).slice(0, 25) === norm(l.text).slice(0, 25));
    const at = path[l.p0], [x, y] = posAt(at);
    l.view = 0;
    if (pl && Math.hypot(pl.x - x, pl.y - y) < 160 && seen(x, y, pl.x, pl.y)) { l.look = 'his line'; const rel = wrap(Math.atan2(pl.y - y, pl.x - x) - headingAt(at)); l.view = ((Math.round(rel / (Math.PI / 2)) % 4) + 4) % 4; l.place = [pl.x, pl.y]; }
    else if (j === lines.length - 1) l.view = 2;
    else {                                                            // on the open road he looks at what stands there: the nearest landmark within reach of a view
      const [ex, ey] = posAt(path[l.p1]), h = headingAt(path[l.p1]);
      const lm = meta.landmarks.filter(m => m.type !== 'bridge' && m.era[0] <= 5 && !(m.era[1] < 9 && !m.era[2])).map(m => { const d = Math.hypot(m.x - ex, m.y - ey), rel = wrap(Math.atan2(m.y - ey, m.x - ex) - h), v = ((Math.round(rel / (Math.PI / 2)) % 4) + 4) % 4;
        return {m, d, v, off: Math.abs(wrap(rel - v * Math.PI / 2))}; }).filter(o => o.d > 25 && o.d < 140 && o.off < 0.6 && o.v !== 2 && seen(ex, ey, o.m.x, o.m.y, o.m)).sort((a, b) => a.d - b.d)[0];
      if (lm && !(j > 0 && lines[j - 1].look === lm.m.name)) { l.view = lm.v; l.look = lm.m.name.split(' · ')[0]; }
    }
    delete l.v;
  }
  const way = seg => plan.ways[E[seg].w].name;
  const ways = []; for (const st of path) { const nm = way(st[0]); if (ways[ways.length - 1] !== nm) ways.push(nm); }
  films.push({num: p.num, title: p.title, audio: p.reading, film: p.film, duration: T.duration, pre: PRE, coda: CODA,
    from: way(start.seg), toward: `${q.num} ${q.title}`, metres: Math.round(Np * disc.frame.step), cuts: lines.filter(l => l.cut).length, ways,
    path, lines});
  console.log(`${p.num} ${p.title.padEnd(32)} ${T.duration.toFixed(0).padStart(4)} s · ${String(Math.round(Np * 3)).padStart(5)} m · ${(Np / Vt).toFixed(1)} steps/spoken s · ${lines.filter(l => l.cut).length} cuts · ${ways.length} streets · looks: ${lines.map(l => 'FRBL'[l.view]).join('')}`);
}
const out = {version: 'moviemap-films-v1', disc: disc.checksum, vmax: VMAX, rule: 'path[k] = [segment, frame, dir]; during line l the car moves from path[l.p0] to path[l.p1] in proportion to the time words are being spoken; between lines it holds; view is constant within a line (0 front, 1 right, 2 back, 3 left, relative to the direction driven)', films};
out.checksum = createHash('sha1').update(JSON.stringify(films)).digest('hex').slice(0, 12);
writeFileSync(join(MM, 'films.json'), JSON.stringify(out));
console.log('films.json', out.checksum, (JSON.stringify(out).length / 1024).toFixed(0) + ' KB');
