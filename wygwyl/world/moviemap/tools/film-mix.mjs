#!/usr/bin/env node
// THE FILM'S STREET SOUND, OFFLINE — walk the film's camera (filmcam.mjs) through the album and ask the same rule the app's Watch
// uses live (sound.mjs: ambience, codaMouth) what the city plays at every frame; write the envelopes (gain, pan per source, 24 Hz,
// smoothed as WebAudio would) for tools/film-mix.py to render.   node tools/film-mix.mjs → film/.tmp/moviemap/ambience.json
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs'; import {join, dirname} from 'node:path'; import {fileURLToPath} from 'node:url';
import {makeFilmCam, lineAt, lightAt} from '../filmcam.mjs'; import {ambience, codaMouth} from '../sound.mjs';
const HERE = dirname(fileURLToPath(import.meta.url)), MM = join(HERE, '..'), ROOT = join(MM, '../../..'), J = p => JSON.parse(readFileSync(p, 'utf8'));
const cut = J(join(MM, 'film/cut.json')), meta = J(join(MM, '../city3d/city.json')), ledger = J(join(MM, 'holdings.json'));
const hb = readFileSync(join(MM, '../city3d/height.bin')), H16 = new Int16Array(hb.buffer, hb.byteOffset, hb.byteLength / 2), {nx, ny, cell} = meta;
const h = i => H16[i] / 10;
function groundY(x, y) { const fx = Math.min(Math.max(x / cell, 0), nx - 1.001), fy = Math.min(Math.max(y / cell, 0), ny - 1.001), i = fx | 0, j = fy | 0, a = fx - i, b = fy - j, k = j * nx + i;
  const g = a + b <= 1 ? h(k) + a * (h(k + 1) - h(k)) + b * (h(k + nx) - h(k)) : h(k + nx + 1) + (1 - a) * (h(k + nx) - h(k + nx + 1)) + (1 - b) * (h(k + 1) - h(k + nx + 1)); return Math.max(g, 0.35) + 0.22; }
const fcam = makeFilmCam(cut, groundY), FPS = cut.fps, N = Math.round((cut.duration + cut.credits) * FPS), K = 1 - Math.exp(-1 / FPS / 0.4);
const src = new Map(), tracks = new Map(); // id → {src, frames: Map(frame → [gain, pan])}
const live = new Map();                      // id → {g, pan} smoothed
for (let n = 0; n < N; n++) { const t = n / FPS, A = fcam.at(t); let want = [];
  if (!A.credits && !A.inCoda && !(A.ch === cut.chapters[0] && t < A.ch.read0)) { const L = lightAt(A.ch, t), p = A.pose;
    want = ambience(ledger.holdings, {x: p.px, y: p.py, yaw: p.yaw}, {speaking: lineAt(A.ch, t).speaking, night: L.hour >= 19 || L.hour < 6}); }
  const wmap = new Map(want.map(w => [w.id, w]));
  for (const w of want) { src.set(w.id, w.src); if (!live.has(w.id)) live.set(w.id, {g: 0, pan: w.pan, on: n}); }
  for (const [id, s] of live) { const w = wmap.get(id); s.g += ((w ? w.gain : 0) - s.g) * K; if (w) s.pan = w.pan;
    if (!tracks.has(id)) tracks.set(id, []); const tr = tracks.get(id);
    if (s.g < 0.002 && !w) { live.delete(id); tr.push([n, 0, s.pan, 'end']); continue; }
    if (s.on === n) tr.push([n, s.g, s.pan, 'start']); else tr.push([n, +s.g.toFixed(4), +s.pan.toFixed(3)]); } }
// the coda mouths: placed at each coda's start, centred
const mouths = cut.chapters.filter(c => c.coda).map(c => { const m = codaMouth(ledger.holdings, c); return m ? {id: m.id, src: m.src, t: c.coda.t, gain: 0.7} : null; }).filter(Boolean);
const out = {fps: FPS, total: cut.duration + cut.credits, sources: Object.fromEntries(src), tracks: Object.fromEntries([...tracks].map(([id, f]) => [id, f])), mouths};
mkdirSync(join(ROOT, 'film/.tmp/moviemap'), {recursive: true}); writeFileSync(join(ROOT, 'film/.tmp/moviemap/ambience.json'), JSON.stringify(out));
console.log('ambience:', src.size, 'sources across the film ·', mouths.length, 'coda mouths');
