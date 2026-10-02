#!/usr/bin/env node
// THE HOLDINGS — everything the project has made, given an address in the city. The city is the index.
// Each holding chooses its own lot by rendezvous hashing (highest hash of item × lot among the lots its kind may use), so adding a
// holding never moves another: the city grows by infill, as its lore says ("nothing was knocked down; everything was added to").
//   node wygwyl/world/moviemap/tools/build-holdings.mjs  →  holdings.json
// Kinds and where they live:
//   reading  his reading, at the poem's site                     line   each line of a reading, a building on the filmed streets near it
//   mouth    the line sung by another mouth, in the same building passage the drone record's passage for the poem (the ground tone)
//   echo     a phrase that recurs across sources, at a corner     hook   a hook, looping in a club after dark
//   pack     a loop / bed / hit / texture / riser, by district    radio  the poem's station, from the mast
//   screen   a film, on a façade                                  poster a canon shot, on a wall near where it was taken
//   ref      a reference image, in a civic building (the library)
// Only published, servable material: files in this repo, the canon thumbnails, the release films. Nothing from the real-person benches.
import {readFileSync, writeFileSync, existsSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url)), MM = join(HERE, '..'), W = join(MM, '..', '..'), CITY = join(MM, '..', 'city3d');
const J = p => JSON.parse(readFileSync(p, 'utf8'));
const meta = J(join(CITY, 'city.json')), plan = J(join(MM, 'plan.json')), clock = J(join(W, 'clock.json'));
const samples = J(join(W, 'samples.json')), codex = J(join(W, 'codex', 'lines.json')), chops = J(join(W, 'chops.json')), echoes = J(join(W, 'echoes.json'));
const pack = J(join(W, 'pack', 'pack.json')), refs = J(join(W, 'world', 'foundry', 'refs.json'));
const bb = readFileSync(join(CITY, 'buildings.f32')), B = new Float32Array(bb.buffer, bb.byteOffset, bb.byteLength / 4), NB = B.length / 14;
const R1 = v => Math.round(v * 10) / 10, R2 = v => Math.round(v * 100) / 100;
const H = s => parseInt(createHash('sha1').update(s).digest('hex').slice(0, 12), 16) / 2 ** 48;      // a stable hash in [0, 1)
const norm = s => s.toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();
const poems = meta.poems, site = n => poems.find(p => p.num === n);

// ——— the lots: buildings standing in Resurrection and not cleared for a landmark or square (city3d's own rule) ———
const clear = [...meta.landmarks.filter(l => l.r > 0 && l.type !== 'bridge').map(l => [l.x, l.y, l.r * 1.25 + 10]), ...meta.plazas.map(p => [p.x, p.y, p.r + 8])];
const discE = plan.edges.filter(e => e.disc);
function nearDisc(x, y, R) { for (const e of discE) { const p = e.pts; for (let i = 2; i < p.length; i += 2) { const ax = p[i - 2], ay = p[i - 1], dx = p[i] - ax, dy = p[i + 1] - ay, L2 = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L2));
  if (Math.hypot(x - ax - dx * t, y - ay - dy * t) < R) return true; } } return false; }
const lots = [];
for (let k = 0; k < NB; k++) { const o = k * 14, x = B[o], y = B[o + 1], w = B[o + 2], d = B[o + 3], rot = B[o + 4], h = B[o + 5], st = B[o + 6], born = B[o + 7], ruin = B[o + 8], reuse = B[o + 9];
  if (born > 5 || (ruin <= 5 && !reuse)) continue; if (!clear.every(([cx, cy, r]) => Math.hypot(x - cx, y - cy) > r + Math.max(w, d) / 2)) continue;
  const nx = Math.sin(rot), ny = -Math.cos(rot), fx = x + nx * d / 2, fy = y + ny * d / 2;                 // the street face
  const H2 = reuse === 1 ? h * 1.35 + 6 : st === 3 ? Math.min(h, 22 + h * 0.5) : h;
  lots.push({k, x, y, fx, fy, nx, ny, rot, w, h: H2, gz: B[o + 13], st, club: reuse === 2, glass: reuse === 1}); }
// which lots front the disc (so a holding is heard and seen from the filmed streets) — a coarse grid makes this quick
const DG = new Map(); for (const e of discE) { const p = e.pts; for (let i = 0; i < p.length; i += 2) { const key = Math.floor(p[i] / 50) + ',' + Math.floor(p[i + 1] / 50); (DG.get(key) || DG.set(key, []).get(key)).push(e); } }
for (const L of lots) { const near = new Set(); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const e of DG.get((Math.floor(L.fx / 50) + a) + ',' + (Math.floor(L.fy / 50) + b)) || []) near.add(e);
  L.disc = [...near].some(e => { const p = e.pts; for (let i = 2; i < p.length; i += 2) { const ax = p[i - 2], ay = p[i - 1], dx = p[i] - ax, dy = p[i + 1] - ay, L2 = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((L.fx - ax) * dx + (L.fy - ay) * dy) / L2));
    if (Math.hypot(L.fx - ax - dx * t, L.fy - ay - dy * t) < 26) return true; } return false; }); }
// which walls a filmed street can actually see: a disc frame 10–45 m in front of the face, nothing standing between
const disc = J(join(MM, 'disc.json')), SG = new Map(); for (const sg of disc.segments) for (const st of sg.steps) { const key = Math.floor(st[0] / 50) + ',' + Math.floor(st[1] / 50); (SG.get(key) || SG.set(key, []).get(key)).push(st); }
const FG = new Map(); for (let k = 0; k < NB; k++) { const o = k * 14; if (B[o + 7] > 5 || (B[o + 8] <= 5 && !B[o + 9])) continue; const key = Math.floor(B[o] / 40) + ',' + Math.floor(B[o + 1] / 40); (FG.get(key) || FG.set(key, []).get(key)).push(k); }
function clearLine(x0, y0, x1, y1, skip) { const L = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(L / 2.5);
  for (let s = 1; s < n - 1; s++) { const x = x0 + (x1 - x0) * s / n, y = y0 + (y1 - y0) * s / n;
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const k of FG.get((Math.floor(x / 40) + a) + ',' + (Math.floor(y / 40) + b)) || []) { if (k === skip) continue; const o = k * 14, c = Math.cos(B[o + 4]), sn = Math.sin(B[o + 4]), dx = x - B[o], dy = y - B[o + 1];
      if (Math.abs(dx * c + dy * sn) < B[o + 2] / 2 + 0.5 && Math.abs(-dx * sn + dy * c) < B[o + 3] / 2 + 0.5) return false; } } return true; }
for (const L of lots) { let seen = 0;
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const st of SG.get((Math.floor(L.fx / 50) + a) + ',' + (Math.floor(L.fy / 50) + b)) || []) {
    const dx = st[0] - L.fx, dy = st[1] - L.fy, d = Math.hypot(dx, dy); if (d < 10 || d > 45 || (dx * L.nx + dy * L.ny) / d < 0.5) continue; if (clearLine(st[0], st[1], L.fx + L.nx * 0.5, L.fy + L.ny * 0.5, L.k)) seen++; }
  L.seen = seen; }
// the disc's eye (tools/visibility.mjs): how much of a disc frame each building fills at best, and from where; the wall it faces there
const VIS = existsSync(join(MM, 'vis.json')) ? J(join(MM, 'vis.json')).vis : {}, SEGS = new Map(disc.segments.map(s => [s.seg, s]));
for (const L of lots) { const v = VIS[L.k]; L.vis = v ? v[0] : 0; if (!v) continue; const st = SEGS.get(v[1]).steps[v[2]], o = L.k * 14, w = B[o + 2], d = B[o + 3], rot = B[o + 4];
  const faces = [[Math.sin(rot), -Math.cos(rot), d / 2, w], [-Math.sin(rot), Math.cos(rot), d / 2, w], [Math.cos(rot), Math.sin(rot), w / 2, d], [-Math.cos(rot), -Math.sin(rot), w / 2, d]];
  const dx = st[0] - L.x, dy = st[1] - L.y, dl = Math.hypot(dx, dy) || 1; const f = faces.sort((a, b) => (b[0] * dx + b[1] * dy) - (a[0] * dx + a[1] * dy))[0];
  if ((f[0] * dx + f[1] * dy) / dl > 0.25) { L.nx = f[0]; L.ny = f[1]; L.fx = L.x + f[0] * f[2]; L.fy = L.y + f[1] * f[2]; L.w = f[3]; } }
const district = (x, y) => plan.wards.reduce((b, w) => { const d = Math.hypot(w.x - x, w.y - y); return !b || d < b.d ? {d, w} : b; }, null).w.type;
lots.forEach(L => L.dt = district(L.x, L.y));
// rendezvous: the lot among the eligible whose hash with this item is highest; a filmed street front wins if there is one
function lotFor(id, ok, wall = false) { let seen = null, sw = -1, best = null, bw = -1, any = null, aw = -1;
  for (const L of lots) { if (!ok(L)) continue; const w = H(id + '@' + L.k); if (wall && L.vis >= 900 && w > sw) { sw = w; seen = L; } if (L.disc && w > bw) { bw = w; best = L; } if (w > aw) { aw = w; any = L; } } return seen || best || any; }
const within = (p, R) => L => Math.hypot(L.x - p.x, L.y - p.y) < R;

const holdings = [];
const add = (h, L) => { if (L) Object.assign(h, {lot: L.k, at: [R1(L.fx), R1(L.fy)], face: [R1(L.fx), R1(L.fy), R2(L.gz), R2(Math.atan2(L.ny, L.nx)), R1(L.w), R1(L.h)]}); h.addr = `A·${h.poem || '00'}·${h.lot ?? h.node ?? 'site'}`; holdings.push(h); };

for (const p of poems) {
  const tr = samples.tracks.find(t => t.num === p.num), span = clock.spans.find(s => s.num === p.num), cx = codex.poems.find(q => q.num === p.num);
  // his reading at the site; the record's passage as the poem's ground tone
  add({id: `reading:${p.num}`, kind: 'reading', poem: p.num, title: `his reading of ${p.num} ${p.title}`, src: p.reading, at: [R1(p.x), R1(p.y)]});
  add({id: `passage:${p.num}`, kind: 'passage', poem: p.num, title: `the drone record, passage ${p.num}`, src: clock.drone, span: [R2(span.t0), R2(span.t1)], read: R2(tr.drone.offset_in_container), at: [R1(p.x), R1(p.y)]});
  // every line of the reading a building near the site; its sung mouth in the same building
  for (const l of tr.lines) {
    if (!existsSync(join(W, l.file))) continue;
    const L = [300, 600, 1200, 3000].reduce((f, R) => f || lotFor(`line:${l.id}`, within(p, R)), null), m = cx && cx.lines.find(q => q.sung_clip && norm(q.text).slice(0, 30) === norm(l.text).slice(0, 30));
    add({id: `line:${l.id}`, kind: 'line', poem: p.num, n: l.n, title: l.text, src: l.file, dur: R2(l.e - l.s)}, L);
    if (m && existsSync(join(W, m.sung_clip))) add({id: `mouth:${p.num}:${m.i}`, kind: 'mouth', poem: p.num, n: l.n, title: `${l.text} — sung by ${m.voice?.mouth || 'another mouth'}`, src: m.sung_clip, dur: R2(m.sung_dur)}, L);
  }
  // the film, on a façade large enough to carry it, near the site
  add({id: `film:${p.num}`, kind: 'screen', poem: p.num, title: `${p.num} ${p.title} — the halfworld film`, src: p.film, aspect: 16 / 9}, [[260, 9], [500, 8], [900, 7], [2500, 6]].reduce((f, [R, m]) => f || lotFor(`film:${p.num}`, L => within(p, R)(L) && L.w >= m && L.h >= m, true), null));
}
add({id: 'film:lead-01', kind: 'screen', poem: '01', title: 'Out of Life — the lead', src: 'footage/01-out-of-life-lead.mp4', aspect: 16 / 9}, lotFor('film:lead-01', L => within(site('01'), 400)(L) && L.w >= 9 && L.h >= 9, true));
add({id: 'film:moviemap', kind: 'screen', poem: '01', title: 'Where You Go When You Leave — the movie map film', src: '../film/WYGWYL-moviemap.mp4', local: 1, aspect: 16 / 9},
  lotFor('film:moviemap', L => L.st === 2 && L.w >= 12 && L.h >= 10, true));

// echoes: a phrase that recurs across the sources is a corner where its voices meet; heard here through the readings that carry it
const corners = []; plan.nodes.forEach(([x, y, deg], i) => { if (deg >= 3 && discE.some(e => e.a === i || e.b === i)) corners.push({i, x, y}); });
for (const e of echoes.echoes) {
  const inst = e.instances.filter(q => q.src.startsWith('reading:')).map(q => ({poem: q.src.split(':')[1].padStart(2, '0'), t0: R2(q.t0), t1: R2(q.t1)}));
  if (!inst.length) continue;
  const p = site(inst[0].poem), cand = corners.filter(c => Math.hypot(c.x - p.x, c.y - p.y) < 450), pool = cand.length ? cand : corners;
  let best = null, bw = -1; for (const c of pool) { const w = H(`echo:${e.text}@${c.i}`); if (w > bw) { bw = w; best = c; } }
  holdings.push({id: `echo:${norm(e.text).slice(0, 40)}`, kind: 'echo', poem: inst[0].poem, title: e.text, n: e.n, sources: e.files, voices: inst.slice(0, 6).map(q => [site(q.poem).reading, q.t0, q.t1]), node: best.i, at: [R1(best.x), R1(best.y)], addr: `A·${inst[0].poem}·n${best.i}`});
}
// hooks loop in the clubs after dark (the warehouses relit under neon); the best-graded chop of each hook carries it
const allChops = chops.tracks.flatMap(t => t.chops);
for (const hk of chops.hooks) { const c = allChops.filter(q => q.norm === norm(hk) || norm(q.text) === norm(hk)).sort((a, b) => (a.gr > b.gr) - (a.gr < b.gr) || b.score - a.score)[0]; if (!c || !existsSync(join(W, c.file))) continue;
  add({id: `hook:${norm(hk)}`, kind: 'hook', poem: c.track, title: `“${hk}”`, src: c.file, dur: R2(c.ce - c.cs), night: 1}, lotFor(`hook:${hk}`, L => (L.club || L.dt === 'nightlife') && L.disc) || lotFor(`hook:${hk}`, L => L.club || L.dt === 'nightlife')); }
// the sound pack by district: loops in the clubs and the nightlife, beds on the water and in the parks, hits in industry, textures in the ruins, risers downtown
const HOME = {LOOP: ['nightlife'], BED: ['waterfront', 'suburb', 'old town'], HIT: ['industrial'], TEXTURE: ['ruin field', 'industrial'], RISER: ['downtown']};
for (const s of pack.segments) { if (!existsSync(join(W, s.file))) continue;
  add({id: `pack:${s.name}`, kind: 'pack', cls: s.cls, title: `a ${s.cls.toLowerCase()} from “${s.name.replace(/^ATL_[A-Z]+_/, '').replace(/_\d+$/, '').replace(/_/g, ' ').toLowerCase()}”${s.key ? ` · ${s.key}` : ''}${s.cls === 'LOOP' && s.bpm ? ` · ${Math.round(s.bpm)} bpm` : ''}`, src: s.file, dur: R2(s.e - s.s), night: s.cls === 'LOOP' ? 1 : 0},
    lotFor(`pack:${s.name}`, L => (HOME[s.cls] || []).includes(L.dt))); }
// the radio: each poem's station, broadcast from the mast
const mast = meta.landmarks.find(l => l.type === 'radio mast');
for (const p of poems) if (existsSync(join(W, 'radio', p.num + '.mp3'))) holdings.push({id: `radio:${p.num}`, kind: 'radio', poem: p.num, title: `WYGWYL radio · station ${p.num} ${p.title}`, src: `radio/${p.num}.mp3`, at: [R1(mast.x), R1(mast.y)], addr: `A·${p.num}·mast`});
// posters: each canon shot on the façade that faces where it was taken
for (const s of meta.shots) { const L = lotFor(`shot:${s.cid}`, L => Math.hypot(L.fx - s.x, L.fy - s.y) < 160, true); if (!L) continue;
  add({id: `shot:${s.cid}`, kind: 'poster', poem: s.poem || null, title: `${s.cid} · ${s.source}${s.el ? ' · read as ' + s.el : ''}`, src: `world/iconic/c/${s.cid}.webp`, cid: s.cid}, L); }
// references: the library — civic buildings hold the images the foundry read the poems against
for (const r of refs.refs) { if (!existsSync(join(W, 'world', 'foundry', r.img))) continue;
  add({id: `ref:${r.id}`, kind: 'ref', poem: r.poem, title: r.desc, line: r.line || null, why: r.why, source: r.source, src: `world/foundry/${r.img}`}, lotFor(`ref:${r.id}`, L => L.st === 2 || L.dt === 'downtown' || L.dt === 'old town', true)); }

// ——— write: one ledger, the address of everything ———
const counts = holdings.reduce((o, h) => (o[h.kind] = (o[h.kind] || 0) + 1, o), {});
const out = {version: 'moviemap-holdings-v1', rule: 'rendezvous hashing: each holding takes the eligible lot with the highest hash(id@lot); a filmed street front wins when there is one; adding holdings never moves another',
  from: {plan: plan.checksum, city: meta.from.city_checksum}, counts, holdings};
out.checksum = createHash('sha1').update(JSON.stringify(holdings)).digest('hex').slice(0, 12);
writeFileSync(join(MM, 'holdings.json'), JSON.stringify(out));
const lotsUsed = new Set(holdings.map(h => h.lot).filter(v => v != null));
console.log('walls the disc sees well', lots.filter(L => L.vis >= 900).length, 'of', lots.length, '·', JSON.stringify(counts), '·', holdings.length, 'holdings in', lotsUsed.size, 'buildings ·', holdings.filter(h => h.node != null).length, 'at corners ·', out.checksum, (JSON.stringify(out).length / 1024).toFixed(0) + ' KB');
