// ATLANTIS MOVIE MAP — the player. After the Aspen Movie Map (MIT ArchMac, 1978): you move only down the centres of the streets,
// a frame every ~3 m; you look front, right, back or left; at a corner you choose a turn. The frames come off "the disc"
// (WebP sheets pressed from the capture); off the disc, or in another era, season, hour, weather or rendering, the same
// registered pose is rendered live by the engine. Touch a façade: the ID buffer names the building and the car pulls up to it.
import {MapView, makeGround, STYLE_N} from './map.mjs';
import {makeCinema} from './cinema.mjs';
import {makeHoldings, srcURL} from './holdings.mjs';
import {makeSound} from './sound.mjs';

const $ = id => document.getElementById(id);
const MOBILE = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
const Q = new URLSearchParams(location.search);
const step = (p, m) => { $('lbar').style.width = p + '%'; $('lmsg').textContent = m; };
const TAU = Math.PI * 2, wrapA = a => ((a + Math.PI) % TAU + TAU) % TAU - Math.PI;
const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'], compass = h => COMPASS[Math.round(((Math.atan2(Math.cos(h), -Math.sin(h)) * 180 / Math.PI) + 360) % 360 / 45) % 8];
const VIEWN = ['front', 'right', 'back', 'left'];
// a message names a change; when the change can be undone, its undo sits beside it until the message goes
const toast = (t, ms = 2200, act = null) => { const el = $('toast'), b = el.querySelector('button'); el.querySelector('span').textContent = t; el.style.display = 'flex';
  b.hidden = !act; if (act) { b.textContent = act.label; b.onclick = () => { el.style.display = 'none'; act.fn(); }; } clearTimeout(toast.h); if (ms) toast.h = setTimeout(() => el.style.display = 'none', ms); };
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;      // motion only where it reports a change, and none if asked

step(10, 'the street plan and the disc index');
const [plan, disc, meta] = await Promise.all(['plan.json', 'disc.json', '../city3d/city.json'].map(u => fetch(u).then(r => { if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); })))
  .catch(e => { step(0, 'could not load: ' + e.message + ' (serve over http)'); throw e; });
const E = plan.edges, NODES = plan.nodes, WAYS = plan.ways, ERA = meta.eras;
const SEG = new Map(disc.segments.map(s => [s.seg, s]));
const FW = disc.frame.w, FH = disc.frame.h, PER = disc.sheet.per, COLS = disc.sheet.cols;
const nodeEdges = new Map(); E.forEach((e, i) => { for (const n of [e.a, e.b]) (nodeEdges.get(n) || nodeEdges.set(n, []).get(n)).push(i); });

// ——— steps for every block: the disc's own, or the same rule computed here (every ~3 m, heading smoothed over ±6 m) ———
const stepCache = new Map();
function steps(ei) {
  if (SEG.has(ei)) return SEG.get(ei).steps; if (stepCache.has(ei)) return stepCache.get(ei);
  const f = E[ei].pts, P = []; for (let i = 0; i < f.length; i += 2) P.push([f[i], f[i + 1]]);
  const S = [0]; for (let i = 1; i < P.length; i++) S.push(S[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const at = d => { d = Math.max(0, Math.min(S[S.length - 1], d)); let i = 1; while (i < S.length - 1 && S[i] < d) i++; const t = (d - S[i - 1]) / ((S[i] - S[i - 1]) || 1); return [P[i - 1][0] + (P[i][0] - P[i - 1][0]) * t, P[i - 1][1] + (P[i][1] - P[i - 1][1]) * t]; };
  const L = S[S.length - 1], n = Math.max(2, Math.round(L / disc.frame.step) + 1), out = [];
  for (let i = 0; i < n; i++) { const d = L * i / (n - 1), p = at(d), a = at(d - 6), b = at(d + 6); out.push([p[0], p[1], Math.atan2(b[1] - a[1], b[0] - a[0])]); }
  stepCache.set(ei, out); return out;
}
// where a corner's block leaves from, as a heading
function leaving(ei, node) { const st = steps(ei); return E[ei].a === node ? st[0][2] : wrapA(st[st.length - 1][2] + Math.PI); }

// ——— the state: which block, which frame, which way along it, which of the four views ———
const S = {e: 0, i: 0, dir: 1, view: 0, era: 5, season: null, hour: 12, weather: 'clear', style: 'photo', speed: 0, reg: false};
const start = () => { const p = meta.poems.find(q => q.num === (Q.get('poem') || '06')); let best = null;
  for (const s of disc.segments) s.steps.forEach((st, i) => { if (s.n < 16 || i < 4 || i > s.n - 5) return; const d = Math.abs(Math.hypot(st[0] - p.x, st[1] - p.y) - 45) + (s.cls === 3 ? -15 : 0); if (!best || d < best.d) best = {d, e: s.seg, i}; }); return best; };
{ const b = Q.has('e') ? {e: +Q.get('e'), i: +(Q.get('i') || 0)} : Q.has('poem') || !SEG.has(761) ? start() : {e: 761, i: 10};   /* by default: Mount Vernon Street, the monument ahead */ S.e = b.e; S.i = Math.min(b.i, steps(b.e).length - 1); S.dir = Q.get('d') === '-1' ? -1 : 1; S.view = +(Q.get('v') || 0) % 4; }
const pose = () => { const st = steps(S.e)[S.i]; return {x: st[0], y: st[1], heading: S.dir > 0 ? st[2] : wrapA(st[2] + Math.PI)}; };
const trace = new Map();
const mark = () => { const n = steps(S.e).length; if (!trace.has(S.e)) trace.set(S.e, new Uint8Array(n)); trace.get(S.e)[S.i] = 1; };

// ——— the disc: sheets of 32 frames, decoded on demand, kept in a small cache ———
const sheets = new Map(), MAXS = MOBILE ? 14 : 40;
function sheetOf(seg, v, i) { const c = Math.floor(i / PER), k = i % PER; return {key: `${seg}_${v}_${c}`, sx: (k % COLS) * FW, sy: Math.floor(k / COLS) * FH}; }
function getSheet(key) {
  let s = sheets.get(key); if (s) { s.t = performance.now(); return s; }
  s = {img: new Image(), ready: false, t: performance.now()}; s.img.decoding = 'async'; s.img.src = disc.sheet.path.replace('{seg}', key.split('_')[0]).replace('{view}', key.split('_')[1]).replace('{chunk}', key.split('_')[2]);
  // onload, not decode(): a hidden tab may defer decode() indefinitely; drawImage decodes on first use if it must
  s.p = new Promise(res => { s.img.onload = () => { s.ready = true; res(); }; s.img.onerror = () => { s.err = true; res(); }; }); sheets.set(key, s);
  if (sheets.size > MAXS) { const old = [...sheets.entries()].sort((a, b) => a[1].t - b[1].t).slice(0, sheets.size - MAXS); for (const [k] of old) sheets.delete(k); }
  return s;
}
// the captured view for what you are looking at: driving against the capture swaps front/back and left/right
const capView = (dir, view) => dir > 0 ? view : (view + 2) % 4;
function frameRef(e, i, dir, view) { if (!SEG.has(e)) return null; const r = sheetOf(e, capView(dir, view), i); r.sheet = getSheet(r.key); return r; }
function prefetch() { if (!SEG.has(S.e)) return; const n = steps(S.e).length; for (const ahead of [0, PER]) { const i = S.i + S.dir * ahead; if (i >= 0 && i < n) getSheet(sheetOf(S.e, capView(S.dir, S.view), i).key); }
  const seg = S.e, at = S.i, idle = () => { if (SEG.has(seg)) for (let v = 0; v < 4; v++) getSheet(sheetOf(seg, v, at).key); };   /* the corner may be behind us by then */ (window.requestIdleCallback || setTimeout)(idle); }

// ——— is the disc enough, or must the engine render this pose live? ———
const onDisc = () => SEG.has(S.e) && S.era === 5 && !S.season && S.hour === 12 && S.weather === 'clear' && S.style === 'photo';
const liveWhy = () => { const d = []; if (!SEG.has(S.e)) d.push('off the disc'); if (S.era !== 5) d.push(`${S.era} ${ERA[S.era].replace(/^The /, '')}`); if (S.season) d.push(S.season);
  if (S.hour !== 12) d.push(`${String(Math.floor(S.hour)).padStart(2, '0')}:${String(Math.round((S.hour % 1) * 60)).padStart(2, '0')}`); if (S.weather !== 'clear') d.push(S.weather);
  if (S.style !== 'photo') d.push({flat: 'QADAS flat', wire: 'wireframe', id: 'ID buffer'}[S.style]); return d.join(' · ') + ' — rendered live'; };

// ——— the engine, raised on first need ———
let eng = null, engP = null;
const LW = MOBILE ? 720 : 1200, LH = Math.round(LW * FH / FW);
function ensureEngine(quiet = false) {
  if (eng) return Promise.resolve(eng); if (engP) { if (!quiet) toast('raising the city for the live render …', 0); return engP; }
  const cv = $('live'); cv.width = LW; cv.height = LH; if (!quiet) toast('raising the city for the live render …', 0);
  engP = import('./engine.mjs').then(m => m.makeEngine({canvas: cv, width: LW, height: LH, plan, base: '../city3d/', shadows: !MOBILE, onStep: (p, msg) => { if (!quiet || $('toast').style.display === 'block') toast(`raising the city · ${p}% ${msg}`, 0); }}))
    .then(e => { eng = e; e.setEra(S.era); if (S.season) e.setSeason(S.season); e.setHour(S.hour); e.setWeather(S.weather); e.setStyle(S.style === 'id' ? 'photo' : S.style); $('toast').style.display = 'none'; draw(); return e; })
    .catch(err => { engP = null; toast('the live city could not load — the disc still plays', 0, {label: 'retry', fn: () => ensureEngine()}); throw err; });
  return engP;
}

// ——— drawing: the frame, cover-fitted (or fitted to the width on a tall screen), the live canvas laid exactly over it ———
const frameC = $('frame'), fx = frameC.getContext('2d'), overC = $('over'), ox = overC.getContext('2d');
let fit = null, lastFrame = null, anim = null, hover = null, sel = null;
function layout() {
  const r = $('stage').getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2), W = Math.round(r.width * d), H = Math.round(r.height * d);
  for (const c of [frameC, overC]) if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
  // a wide screen is covered by the frame; a tall one gives the frame a band under the map, a little cropped at the sides
  const tall = r.width / r.height < 1.15, watching = cine && cine.active && cine.state !== 'choose', bh = tall ? Math.min(H * 0.52, W / FW * FH * 1.35) : H;
  const top = !tall ? 0 : watching ? Math.round(H * 0.42 - bh / 2) : (r.width < 761 ? 92 : 60) * d;   // watching, the frame takes the middle; the words sit under it
  const s = tall ? Math.max(W / FW, bh / FH) : Math.max(W / FW, H / FH), dw = FW * s, dh = FH * s, dx = (W - dw) / 2, dy = tall ? top : (H - dh) / 2;
  fit = {W, H, d, dx, dy, dw, dh, tall};
  const lv = $('live'); Object.assign(lv.style, {left: dx / d + 'px', top: dy / d + 'px', width: dw / d + 'px', height: dh / d + 'px'});
  if (tall) { $('hud').style.top = (dy + dh) / d + 8 + 'px'; $('tools').style.top = (dy + dh) / d + 8 + 'px'; } else { $('hud').style.top = ''; $('tools').style.top = ''; }
}
function blit(ref, offset = 0) { if (!ref || !ref.sheet.ready) return false; fx.drawImage(ref.sheet.img, ref.sx, ref.sy, FW, FH, fit.dx + offset * fit.dw, fit.dy, fit.dw, fit.dh); return true; }
function draw() {
  if (cine && cine.active && cine.state !== 'choose') { cine.draw(); return; }
  layout(); const live = !onDisc(), lv = $('live');
  fx.fillStyle = '#000'; fx.fillRect(0, 0, fit.W, fit.H);
  fx.save(); fx.beginPath(); fx.rect(Math.max(0, fit.dx), fit.dy, Math.min(fit.W, fit.dw), fit.dh); fx.clip();
  if (anim && anim.kind === 'slide') { const t = anim.t; blit(anim.a, -t * anim.sgn); blit(anim.b, (1 - t) * anim.sgn); }
  else if (!live || S.reg) { const ref = frameRef(S.e, S.i, S.dir, S.view);
    if (ref && ref.sheet.ready) { blit(ref); lastFrame = ref; $('search').classList.remove('on'); }
    else if (ref) { if (lastFrame && lastFrame.sheet.ready) blit(lastFrame); $('search').classList.add('on'); ref.sheet.p.then(() => requestDraw()); } }
  fx.restore();
  lv.style.display = live || S.reg ? 'block' : 'none'; lv.style.opacity = S.reg && !live ? 0.5 : 1;
  if ((live || S.reg) && !(anim && anim.kind === 'slide')) renderLive(anim && anim.kind === 'pan' ? anim.yaw : 0);
  drawOver(); hud(); navDraw();
}
let drawQ = false; const requestDraw = () => { if (drawQ) return; drawQ = true; requestAnimationFrame(() => { drawQ = false; draw(); }); };
function renderLive(yawOff = 0) {
  if (!eng) { ensureEngine(); return; }
  const p = pose(); eng.pose(p.x, p.y, p.heading, S.view, 0, yawOff);
  if (S.style === 'id') { const img = eng.idImage(); const c = $('live').getContext('2d'); if (c) c.putImageData(img, 0, 0); else { idCanvas(img); } }
  else eng.render();
}
// the ID image goes to a 2D canvas laid over the live one (the live canvas belongs to WebGL)
let idc = null; function idCanvas(img) { if (!idc) { idc = document.createElement('canvas'); idc.width = img.width; idc.height = img.height; } idc.getContext('2d').putImageData(img, 0, 0);
  fx.save(); fx.imageSmoothingEnabled = false; fx.drawImage(idc, fit.dx, fit.dy, fit.dw, fit.dh); fx.restore(); $('live').style.display = 'none'; }

// overlay: the turn arrows on the road at a corner, the hovered and the chosen thing outlined from the ID buffer
let maskC = null, arrowHits = [], cine = null, wallHits = [], HOLD = null, SND = null, groundH = null, listening = false;
function drawOver() {
  ox.clearRect(0, 0, overC.width, overC.height);
  // what the city holds, on its walls (photographic rendering only: the abstractions show the bare city)
  wallHits = [];
  if (HOLD && S.style === 'photo' && !(anim && anim.kind === 'slide'))
    wallHits = HOLD.draw(ox, camNow(anim && anim.kind === 'pan' ? anim.yaw : 0), fit, {era: S.era, night: isNight() ? 1 : 0,
      idAt: eng && !MOBILE && !anim ? (u, v) => { syncEnginePose(); return eng.pickAt(u, v); } : null});
  for (const [m, col] of [[hover, 'rgba(127,209,255,.35)'], [sel, 'rgba(255,179,92,.5)']]) { if (!m || !m.mask || m.key !== poseKey()) continue;
    if (!maskC) maskC = document.createElement('canvas'); maskC.width = m.mask.width; maskC.height = m.mask.height; const mc = maskC.getContext('2d'); mc.putImageData(m.mask, 0, 0); mc.globalCompositeOperation = 'source-in'; mc.fillStyle = col; mc.fillRect(0, 0, maskC.width, maskC.height); mc.globalCompositeOperation = 'source-over';
    ox.drawImage(maskC, fit.dx, fit.dy, fit.dw, fit.dh); }
  // turn arrows painted on the road ahead (front view at a corner): each way out projected onto the street through the camera
  arrowHits = [];
  if (choices && !anim) { const d = fit.d, EYE = disc.frame.eye, T = Math.tan(Math.PI / 4), TV = T * FH / FW;
    const proj = (f, r) => [fit.dx + (0.5 + 0.5 * (r / f) / T) * fit.dw, fit.dy + (0.5 + 0.5 * (EYE / f) / TV) * fit.dh];
    for (const c of choices) { if (c.u) continue; const a = c.turn - S.view * Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a);
      if (ca < 0.35) continue;                                          // out of this view: the chooser below still offers it
      const [x0, y0] = proj(7 * ca, 7 * sa), [x1, y1] = proj(13 * ca, 13 * sa), ang = Math.atan2(y1 - y0, x1 - x0), L = Math.hypot(x1 - x0, y1 - y0), wd = Math.max(10 * d, L * 0.35);
      ox.save(); ox.translate(x0, y0); ox.rotate(ang); ox.fillStyle = c.disc ? 'rgba(127,209,255,.8)' : 'rgba(255,179,92,.8)'; ox.strokeStyle = 'rgba(0,0,0,.55)'; ox.lineWidth = 2 * d;
      ox.beginPath(); ox.moveTo(0, -wd * 0.3); ox.lineTo(L * 0.62, -wd * 0.3); ox.lineTo(L * 0.62, -wd * 0.62); ox.lineTo(L, 0); ox.lineTo(L * 0.62, wd * 0.62); ox.lineTo(L * 0.62, wd * 0.3); ox.lineTo(0, wd * 0.3); ox.closePath(); ox.fill(); ox.stroke();
      ox.rotate(Math.abs(ang) > Math.PI / 2 ? Math.PI : 0); ox.restore();
      arrowHits.push({x: (x0 + x1) / 2 / d, y: (y0 + y1) / 2 / d, r: Math.max(26, L / d * 0.7), c});
      const lx = x1, ly = y1 - 14 * d; ox.font = `600 ${12 * d}px ui-sans-serif,-apple-system,Arial`; ox.textAlign = 'center'; ox.lineWidth = 3 * d; ox.strokeStyle = 'rgba(0,0,0,.8)'; ox.strokeText(c.name, lx, ly); ox.fillStyle = '#fff'; ox.fillText(c.name, lx, ly); } }
}
const poseKey = () => [S.e, S.i, S.dir, S.view, S.era, S.style].join();

// ——— the caption: where you are, in the city's own words ———
const wardName = w => plan.wards[w - 1] ? plan.wards[w - 1].name.replace(/^the /, '') : '';
function blockNo(ei, s) { const e = E[ei], d = e.wr ? e.w0 + (e.len - s) : e.w0 + s; return 100 + Math.floor(d / 100) * 100; }
function hud() {
  const e = E[S.e], w = WAYS[e.w], p = pose(), st = steps(S.e), sAlong = S.i / Math.max(1, st.length - 1) * e.len;
  const [ward, pr, zone] = e.wz || [0, 0, ''];
  const nextN = S.dir > 0 ? e.b : e.a, cross = (nodeEdges.get(nextN) || []).map(i => WAYS[E[i].w]).filter(o => o.name !== w.name).sort((a, b) => [1, 3, 0, 4, 5][b.cls] - [1, 3, 0, 4, 5][a.cls])[0];
  const dist = Math.round((S.dir > 0 ? st.length - 1 - S.i : S.i) * disc.frame.step);
  $('where').innerHTML = `${blockNo(S.e, sAlong)} block of ${w.name}<small>heading ${compass(p.heading)} · looking ${VIEWN[S.view]} (${compass(p.heading + S.view * Math.PI / 2)})${ward ? ` · ward ${ward}, precinct ${ward}-${pr} (${wardName(ward)})` : ''}${zone ? ` · zone ${zone}` : ''}${w.route ? ` · bus ${w.route}` : ''}${cross ? `<br>next corner: ${cross.name} in ${dist} m` : dist ? `<br>block ends in ${dist} m` : ''}</small>`;
  // the disc is the normal state and says nothing; a live render says why, and offers the way back when settings caused it
  const live = !onDisc(), changed = S.era !== 5 || S.season || S.hour !== 12 || S.weather !== 'clear' || S.style !== 'photo';
  $('livestate').hidden = !live; $('badge').className = 'live'; $('badge').textContent = live ? `LIVE · ${liveWhy()}` : ''; $('toDisc').hidden = !changed;
  $('thisframe').textContent = `this frame: segment ${S.e} · corners ${e.a}→${e.b} · frame ${S.i + 1}/${st.length} · view ${VIEWN[S.view]}${S.dir < 0 && SEG.has(S.e) ? ' (driven against the capture)' : ''} · ${(p.x).toFixed(1)}, ${(p.y).toFixed(1)}`;
  document.querySelectorAll('#rose button').forEach(b => b.classList.toggle('on', +b.dataset.v === S.view));
  // the transport shows only what can be done now: stopped — step back, step, drive, drive fast; moving — stop, or the other speed
  const mv = S.speed > 0; $('bBack').hidden = mv; $('bStep').hidden = mv; $('bStop').hidden = !mv; $('bPlay').hidden = S.speed === 1; $('bFast').hidden = S.speed === 2;
}

// ——— moving: a step at a time down the centre; at a corner, a choice ———
let choices = null, queued = null;
function stepBy(k) {
  if (anim) return false; const n = steps(S.e).length, ni = S.i + S.dir * k;
  if (ni >= 0 && ni < n) { S.i = ni; arrived(); return true; }
  if (k > 0) { atCorner(S.dir > 0 ? E[S.e].b : E[S.e].a); return false; }
  return false;
}
function arrived() { mark(); choices = null; $('turns').style.display = 'none'; hover = null; prefetch(); requestDraw(); syncURL(); }
function atCorner(node) {
  const here = pose(), out = [];
  for (const ei of nodeEdges.get(node) || []) { if (ei === S.e) continue; const e = E[ei]; if (e.born > S.era) continue;
    const h = leaving(ei, node), turn = wrapA(h - here.heading); out.push({ei, node, turn, disc: SEG.has(ei), name: WAYS[e.w].name, cls: e.cls}); }
  // a street that stops a few metres short of another (the plan was drawn from subsampled lines): offer the cut across
  { const n0 = NODES[node], other = S.dir > 0 ? E[S.e].a : E[S.e].b;
    for (const [k, n] of NODES.entries()) { if (k === node || k === other || Math.abs(n[0] - n0[0]) > 25 || Math.abs(n[1] - n0[1]) > 25) continue; const dd = Math.hypot(n[0] - n0[0], n[1] - n0[1]);
      if (dd > 25 || (n0[2] > 1 && n[2] > 1)) continue;
      for (const ei of nodeEdges.get(k) || []) { if (ei === S.e || out.some(o => o.ei === ei) || E[ei].born > S.era) continue; const h = leaving(ei, k), turn = wrapA(h - here.heading);
        out.push({ei, node: k, turn, disc: SEG.has(ei), name: WAYS[E[ei].w].name + ` (across ${Math.round(dd)} m)`, cls: E[ei].cls, jump: true}); } } }
  out.sort((a, b) => a.turn - b.turn);
  const straight = out.filter(o => Math.abs(o.turn) < 0.6);
  // a bend (no real corner) or a single way on: keep going
  if (out.length === 1 || (out.length === 2 && straight.length === 1 && (nodeEdges.get(node) || []).length === 2)) { take(out.find(o => Math.abs(o.turn) < 1.2) || out[0]); return; }
  if (queued) { const q = out.reduce((b, o) => !b || Math.abs(wrapA(o.turn - queued)) < Math.abs(wrapA(b.turn - queued)) ? o : b, null); queued = null; take(q); return; }
  out.push({u: true, node, turn: Math.PI, name: 'turn back'});
  choices = out; if (S.speed) { S.speed = 0; }
  const ar = t => '↑↗→↘↓↙←↖'[Math.round(((t * 180 / Math.PI) + 360) % 360 / 45) % 8];
  const echo = HOLD && HOLD.atNode(node)[0];
  $('turns').innerHTML = `<div class="lab">AT THE CORNER · CHOOSE A WAY${echo ? `<br><span style="text-transform:none;letter-spacing:0;font:italic 13px Georgia,serif">⟲ an echo meets here: “${echo.title}” — ${echo.sources} recordings carry it</span>` : ''}</div>` + out.map((o, k) => `<button data-k="${k}" class="${o.disc ? 'disc' : ''}" title="${o.u ? '' : o.disc ? 'on the disc' : 'rendered live'}"><b>${o.u ? '⟲' : ar(o.turn)}</b>${o.name}</button>`).join('');
  $('turns').style.display = 'flex'; $('turns').querySelectorAll('button').forEach(b => b.onclick = () => take(out[+b.dataset.k]));
  requestDraw();
}
function take(o) {
  choices = null; $('turns').style.display = 'none';
  if (o.u) { turnAround(); return; }
  const e = E[o.ei], dir = e.a === o.node ? 1 : -1, n = steps(o.ei).length, from = {e: S.e, i: S.i, dir: S.dir, view: S.view};
  // the turn as a pan through the corner's own four views, then the cut onto the new block
  const k = Math.round(o.turn / (Math.PI / 2)); S.view = 0;
  const go = () => { S.e = o.ei; S.dir = dir; S.i = dir > 0 ? 0 : n - 1; S.view = 0; arrived(); };
  if (k === 0) { go(); return; }
  panViews(from, k, go);
}
function turnAround() { const from = {e: S.e, i: S.i, dir: S.dir, view: S.view}; panViews(from, 2, () => { S.dir = -S.dir; S.view = from.view; arrived(); }); }
function setView(v) { if (anim || v === S.view) return; const k = wrapA((v - S.view) * Math.PI / 2) / (Math.PI / 2); const from = {e: S.e, i: S.i, dir: S.dir, view: S.view}; panViews(from, Math.round(k), () => { S.view = v; hover = null; requestDraw(); syncURL(); }, true); }
// a pan of k quarter turns: on the disc the views slide past each other (they tile 90° each); live, the camera turns
function panViews(from, k, then, keepView = false) {
  if (RM) { then(); return; }
  const sgn = Math.sign(k), steps_ = Math.abs(k); let j = 0;
  const live = !onDisc() || !SEG.has(from.e);
  const one = () => {
    if (j >= steps_) { anim = null; then(); return; }
    const v0 = (from.view + sgn * j + 4) % 4, v1 = (from.view + sgn * (j + 1) + 4) % 4, t0 = performance.now(), dur = 260;
    if (live) { anim = {kind: 'pan', yaw: 0}; const base = v0; const tick = now => { const t = Math.min(1, (now - t0) / dur), e = t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2; S.view = base; anim.yaw = sgn * e * Math.PI / 2; draw(); if (t < 1) requestAnimationFrame(tick); else { j++; S.view = v1; one(); } }; requestAnimationFrame(tick); return; }
    const a = frameRef(from.e, from.i, from.dir, v0), b = frameRef(from.e, from.i, from.dir, v1);
    Promise.all([a.sheet.p, b.sheet.p]).then(() => { anim = {kind: 'slide', a, b, sgn, t: 0}; const tick = now => { const t = Math.min(1, (now - t0) / dur); anim.t = t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2; draw(); if (t < 1) requestAnimationFrame(tick); else { j++; one(); } }; requestAnimationFrame(tick); });
  };
  one();
}

// ——— driving: the laserdisc plays — a frame waits for its sheet, a corner stops the car ———
const RATE = [0, 4, 10];
let lastT = 0;
function loop(now) {
  if (S.speed && !(cine && cine.active) && !anim && !choices && now - lastT > 1000 / RATE[S.speed]) {
    const ref = onDisc() ? frameRef(S.e, S.i + S.dir, S.dir, S.view) : null;
    if (!ref || ref.sheet.ready || S.i + S.dir < 0 || S.i + S.dir >= steps(S.e).length) { lastT = now; stepBy(1); }
  }
  if (mapOpen && mapView.step(now)) drawMap();
  if (SND) { if (cine && cine.active) { if (SND.on) SND.disable(); } else if (listening && !SND.on) SND.enable();
    if (SND.on && now - (loop.snd || 0) > 200) { loop.snd = now; SND.update(camNow(), {night: isNight(), era: S.era}); } }
  if (wallHits.some(w => w.h.kind === 'screen') && now - (loop.scr || 0) > 40 && !(cine && cine.active)) { loop.scr = now; drawOver(); }
  requestAnimationFrame(loop);
}

// ——— touch: drag sideways to look round, tap to touch what is there ———
let drag = null;
$('stage').addEventListener('pointerdown', e => { drag = {x: e.clientX, y: e.clientY, t: performance.now(), moved: 0}; });
addEventListener('pointermove', e => {
  if (drag) { drag.moved = Math.max(drag.moved, Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y)); return; }
  if (MOBILE || !eng || anim || cine.active || e.target !== $('stage') && e.target.parentNode !== $('stage')) return;
  clearTimeout(hoverT); hoverT = setTimeout(() => { const uv = toUV(e.clientX, e.clientY); if (!uv) { hover = null; requestDraw(); return; } syncEnginePose(); const h = eng.pickAt(uv[0], uv[1]);
    if (!h) { if (hover) { hover = null; requestDraw(); } $('stage').style.cursor = 'crosshair'; return; }
    if (hover && sameHit(hover.hit, h)) return; hover = {hit: h, mask: eng.maskOf(h), key: poseKey()}; $('stage').style.cursor = 'pointer'; requestDraw(); }, 90);
});
let hoverT = 0;
addEventListener('pointerup', e => {
  if (!drag) return;
  if (cine.active) { const onStage = e.target === $('stage') || e.target.parentNode === $('stage'); drag = null; if (onStage) cine.tap(); return; } const dx = e.clientX - drag.x, dy = e.clientY - drag.y, dt = performance.now() - drag.t; const d0 = drag; drag = null;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) { setView((S.view + (dx < 0 ? 1 : 3)) % 4); return; }          // swipe: look round
  if (Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx) * 1.3 && dt < 600) { dy < 0 ? stepBy(1) : stepBy(-1); return; }        // swipe up: a step on
  if (d0.moved < 8) touch(e.clientX, e.clientY);
});
function toUV(cx, cy) { const u = (cx * fit.d - fit.dx) / fit.dw, v = (cy * fit.d - fit.dy) / fit.dh; return u >= 0 && u <= 1 && v >= 0 && v <= 1 ? [u, v] : null; }
const sameHit = (a, b) => a && b && a.kind === b.kind && a.k === b.k && a.i === b.i && a.item === b.item;
function syncEnginePose() { const p = pose(); eng.pose(p.x, p.y, p.heading, S.view); }
async function touch(cx, cy) {
  const ah = arrowHits.find(a => Math.hypot(a.x - cx, a.y - cy) < a.r); if (ah && choices) { take(ah.c); return; }
  const wh = HOLD && wallHits.find(w => HOLD.inPoly([cx * fit.d, cy * fit.d], w.poly)); if (wh) { openHolding(wh.h, wh.k); return; }
  const uv = toUV(cx, cy); if (!uv) return;
  if (!eng) { toast('reading what you touched — raising the city …', 0); await ensureEngine(); }
  syncEnginePose(); const h = eng.pickAt(uv[0], uv[1]);
  if (!h) { closeInfo(); return; }
  if (h.kind === 'building') { await pullUpTo(h.k); return; }
  sel = {hit: h, mask: eng.maskOf(h), key: poseKey()}; showInfo(h); requestDraw();
}

// ——— touch a façade: the car pulls up to the street front of the building and looks at it ———
const here = () => ({e: S.e, i: S.i, dir: S.dir, view: S.view});
const undoMove = (from, msg) => toast(msg, 8000, {label: '↩ back', fn: () => { Object.assign(S, from, {speed: 0}); choices = null; sel = null; closeInfo(); arrived(); }});
function pullUpTo(k) {
  const from = here();
  const B = eng.C.bld, o = k * 14, bx = B[o], by = B[o + 1], d = B[o + 3], rot = B[o + 4], nx = Math.sin(rot), ny = -Math.cos(rot);
  const fxp = bx + nx * (d / 2), fyp = by + ny * (d / 2);
  let best = null;
  const consider = (ei, pen) => { const st = steps(ei); st.forEach(([x, y, h], i) => {
    const side = (x - bx) * nx + (y - by) * ny; if (side < d / 2 + 2) return;
    const dist = Math.hypot(x - fxp, y - fyp); if (dist > 70) return;
    const toB = Math.atan2(by - y, bx - x), dirs = [1, -1];
    for (const dir of dirs) { const hh = dir > 0 ? h : wrapA(h + Math.PI); const rel = wrapA(toB - hh), v = ((Math.round(rel / (Math.PI / 2)) % 4) + 4) % 4, off = Math.abs(wrapA(rel - v * Math.PI / 2));
      const sc = dist + off * 25 + pen + (v === 0 || v === 2 ? 6 : 0) + (dir !== S.dir && ei === S.e ? 3 : 0); if (!best || sc < best.sc) best = {sc, e: ei, i, dir, view: v}; } }); };
  const near = new Set(); for (const [ei, e] of E.entries()) { const bb = e.bb; if (bb && (bx < bb[0] - 90 || bx > bb[2] + 90 || by < bb[1] - 90 || by > bb[3] + 90)) continue; near.add(ei); }
  for (const ei of near) consider(ei, SEG.has(ei) ? 0 : 14);
  const hit = {kind: 'building', k};
  if (best && !(best.e === S.e && best.i === S.i && best.dir === S.dir && best.view === S.view)) {
    Object.assign(S, {e: best.e, i: best.i, dir: best.dir, view: best.view}); arrived(); undoMove(from, 'pulled up to the façade');
  }
  syncEnginePose(); sel = {hit, mask: eng.maskOf(hit), key: poseKey()}; showInfo(hit); requestDraw();
}

// ——— what you touched: its life in the eras, its use, the shots that saw it, the poem and the lines he said there ———
const thumb = cid => `../iconic/c/${cid}.webp`;
const STATE = (B, k, e) => { const o = k * 14, born = B[o + 7], ruin = B[o + 8], reuse = B[o + 9], ah = B[o + 11], ab = B[o + 12];
  if (born > e) return ['not yet built', 0]; if (ruin <= e) return e >= 5 && reuse === 1 ? ['rebuilt in white and glass', 3] : e >= 5 && reuse === 2 ? ['a club under neon', 3] : ['a ruin', 2];
  return [ah > 0 && ab <= e ? `standing, with an addition of ${ah.toFixed(1)} m` : 'standing', 1]; };
function nearestEdge(x, y) { let best = null; E.forEach((e, i) => { const bb = e.bb; if (bb && (x < bb[0] - 60 || x > bb[2] + 60 || y < bb[1] - 60 || y > bb[3] + 60)) return; const p = e.pts; let acc = 0;
  for (let k = 2; k < p.length; k += 2) { const ax = p[k - 2], ay = p[k - 1], dx = p[k] - ax, dy = p[k + 1] - ay, L = Math.hypot(dx, dy) || 1, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (L * L))), d = Math.hypot(x - ax - dx * t, y - ay - dy * t);
    if (!best || d < best.d) best = {d, ei: i, s: acc + t * L, side: Math.sign((x - ax) * dy - (y - ay) * dx)}; acc += L; } }); return best; }
function address(x, y) { const n = nearestEdge(x, y); if (!n) return null; const e = E[n.ei], dist = e.wr ? e.w0 + (e.len - n.s) : e.w0 + n.s; const num = 100 + Math.floor(dist / 100) * 100 + 2 * Math.floor((dist % 100) / 6) + (n.side > 0 ? 1 : 2);
  return {num, way: WAYS[e.w], e, ei: n.ei}; }
const nearShots = (x, y, R = 260, n = 10) => meta.shots.map(s => [Math.hypot(s.x - x, s.y - y), s]).filter(a => a[0] < R).sort((a, b) => a[0] - b[0]).slice(0, n).map(a => a[1]);
const nearPoem = (x, y, R = 320) => meta.poems.map(p => [Math.hypot(p.x - x, p.y - y), p]).filter(a => a[0] < R).sort((a, b) => a[0] - b[0])[0]?.[1];
const nearWords = (x, y, R = 220) => meta.words.map(w => [Math.hypot(w.x - x, w.y - y), w]).filter(a => a[0] < R).sort((a, b) => a[0] - b[0]).slice(0, 4).map(a => a[1]);
const distOf = (x, y) => plan.wards.reduce((b, w) => { const d = Math.hypot(w.x - x, w.y - y); return !b || d < b.d ? {d, w} : b; }, null).w;
function evid(list) { return list.length ? `<h2>The shots that saw it · ${list.length}</h2><div class="ev">${list.map(s => `<img src="${thumb(s.cid)}" data-c="${s.cid}" title="${s.cid} · ${s.source}${s.el ? ' · read as ' + s.el : ''}" loading="lazy" alt="">`).join('')}</div>` : ''; }
function poemBlock(p, x, y) { if (!p) return ''; const lines = meta.words.filter(w => w.poem === p.num).map(w => [Math.hypot(w.x - x, w.y - y), w]).sort((a, b) => a[0] - b[0]).slice(0, 3).map(a => a[1]);
  return `<h2>Poem ${p.num} · ${p.title}</h2><div class="k">he reads it here (zone ${p.zone}); the film plays where it was seen</div>
    <video src="${p.film}" controls playsinline preload="none"></video>${p.reading ? `<div class="chips" style="margin-top:6px"><button data-read="${p.reading}">▶ the reading</button></div>` : ''}
    ${lines.map(w => `<div class="wt">“${w.t}”</div>`).join('')}`; }
const timeline = (f) => `<div class="tl">${ERA.map((n, e) => { const [t] = f(e); return `<div class="${e === S.era ? 'now' : ''}"><b>${e} ${n.replace(/^The /, '')}</b>${t}</div>`; }).join('')}</div>`;
const audio = new Audio();
function showInfo(h) {
  const I = $('info'); let html = '';
  if (h.kind === 'building') { const B = eng.C.bld, k = h.k, o = k * 14, x = B[o], y = B[o + 1], st = B[o + 6], hgt = B[o + 5], reuse = B[o + 9];
    const ad = address(x + Math.sin(B[o + 4]) * B[o + 3] / 2, y - Math.cos(B[o + 4]) * B[o + 3] / 2), dd = distOf(x, y), [ward, pr, zone] = ad ? ad.e.wz : [0, 0, ''];
    const cafe = plan.cafes.find(c => c.b === k), p = nearPoem(x, y), words = nearWords(x, y);
    html = `<h3>${ad ? `${ad.num} ${ad.way.name}` : 'a building'}</h3><div class="k">${STYLE_N[st] || 'building'} · ${hgt.toFixed(0)} m · building ${k}${cafe ? ` · <b style="color:var(--acc)">${cafe.name}</b> on the ground floor` : ''}</div>${holdsBlock(k)}
      <div class="k" style="margin-top:3px">now: <b style="color:var(--ink)">${STATE(B, k, S.era)[0]}</b> (${ERA[S.era]})</div>
      <h2>Its life in the six eras</h2>${timeline(e => STATE(B, k, e))}
      ${reuse ? `<h2>Adaptive reuse</h2><div class="k">ruined in the Fall; in Resurrection ${reuse === 1 ? 'rebuilt in white and glass on its own footprint' : 'relit as a club under neon, the old walls kept'}.</div>` : ''}
      <h2>The district and its use</h2><div class="k">${dd.name}${ward ? ` · ward ${ward}, precinct ${ward}-${pr}` : ''}${zone ? ` · zoned ${zone} (${plan.zones[zone] || ''})` : ''}</div>
      ${dd.use ? timeline(e => [dd.use[e]]) : ''}
      ${cafe ? `<h2>${cafe.name} · today</h2><table>${cafe.menu.map(([a, b]) => `<tr><td>${a}</td><td>$${b}</td></tr>`).join('')}</table>` : ''}
      ${evid(nearShots(x, y))}${poemBlock(p, x, y)}
      ${words.length && !p ? `<h2>The worldtext here</h2>${words.map(w => `<div class="wt">“${w.t}”</div>`).join('')}` : ''}`; }
  else if (h.kind === 'landmark') { const lm = meta.landmarks[h.i], [b, r, as] = lm.era, p = meta.poems.find(q => q.num === lm.poem);
    const stOf = e => b > e ? ['not yet raised'] : r < 9 && e >= r ? [e >= 5 && as ? `reused as ${as}` : 'a ruin'] : ['standing'];
    html = `<h3>${lm.name}</h3><div class="k">a landmark · ${lm.evidence.length} shots read this structure${p ? ` · poem ${p.num}` : ''}</div>
      <h2>Its life in the six eras</h2>${timeline(stOf)}${as ? `<h2>Adaptive reuse</h2><div class="k">in Resurrection it lives on as <b>${as}</b></div>` : ''}
      ${evid(lm.evidence.slice(0, 12).map(c => meta.shots.find(s => s.cid === c) || {cid: c, source: 'canon'}))}${poemBlock(p || nearPoem(lm.x, lm.y), lm.x, lm.y)}`; }
  else if (h.kind === 'cafe') { const c = plan.cafes.map(c => [Math.hypot(c.x - h.x, c.y - h.y), c]).sort((a, b) => a[0] - b[0])[0]; const cafe = c && c[0] < 12 ? c[1] : null;
    html = cafe ? `<h3>${cafe.name}</h3><div class="k">tables out on the street${cafe.poem ? ` · near poem ${cafe.poem}` : ''} · open from ${ERA[cafe.born]}${cafe.dies < 9 ? ` until ${ERA[cafe.dies]}` : ''}</div><h2>Today</h2><table>${cafe.menu.map(([a, b]) => `<tr><td>${a}</td><td>$${b}</td></tr>`).join('')}</table>`
      : `<h3>a café</h3><div class="k">tables out on the square — the menu is chalked inside</div>`; }
  else if (h.kind === 'stop') { const st = plan.stops.map(s => [Math.hypot(s.x - h.x, s.y - h.y), s]).sort((a, b) => a[0] - b[0])[0][1], head = 8 + (st.route % 5) * 2, now = S.hour * 60;
    const next = [1, 2, 3].map(k => { const m = Math.ceil(now / head) * head + (k - 1) * head; return `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; });
    html = `<h3>Bus ${st.route} · ${st.way}</h3><div class="k">stop at ${st.at || st.way} · every ${head} minutes${S.era < 3 ? ' — but there are no buses before the New Boroughs' : ''}</div><h2>Next buses</h2><div class="k" style="font:14px ui-monospace,Menlo,monospace;color:var(--ink)">${next.join(' · ')}</div>`; }
  else if (h.kind === 'sign') { const s = h.sign; const K = {blade: 'street-name blades', over: 'street name over the lanes', ward: 'ward and precinct line', zone: 'zoning district', bus: 'bus stop flag', shield: 'route shield', cafe: 'café sign', alley: 'alley sign', marker: 'historic marker', pier: 'pier number'}[s.k];
    const body = s.k === 'blade' ? s.t.join(' × ') : s.k === 'ward' ? `Ward ${s.ward}, precinct ${s.ward}-${s.precinct} — ${s.t}. The wards are the voting districts: every city cell votes with its nearest district.` + (plan.wards[s.ward - 1]?.use ? `<br>its use: ${plan.wards[s.ward - 1].use.map((u, e) => `<b>${ERA[e].replace(/^The /, '')}</b> ${u}`).join(' · ')}` : '')
      : s.k === 'zone' ? `Zone ${s.z}: ${s.t}` : s.k === 'bus' ? `Route ${s.route} · ${s.t}` : s.k === 'shield' ? `Route ${s.route} · ${s.t}` : s.k === 'marker' ? `${s.t}<br>${s.sub}` : s.k === 'alley' ? `${s.t}, ${s.sub}` : s.k === 'cafe' ? `${s.t}` : s.t;
    html = `<h3>${K || 'a sign'}</h3><div class="k" style="font-size:13px;color:var(--ink)">${body}</div>`;
    if (s.k === 'marker' && s.lm != null) { showInfo({kind: 'landmark', i: s.lm}); return; }
    if (s.k === 'cafe') { const c = plan.cafes[s.cafe]; html += `<table>${c.menu.map(([a, b]) => `<tr><td>${a}</td><td>$${b}</td></tr>`).join('')}</table>`; } }
  I.innerHTML = `<button class="x" title="close">×</button>` + html; I.classList.add('open'); $('side').classList.remove('open');
  I.querySelector('.x').onclick = closeInfo; wireHolds(I);
  I.querySelectorAll('img[data-c]').forEach(im => im.onclick = () => showEvidence(im.dataset.c, im.title));
  I.querySelectorAll('button[data-read]').forEach(b => b.onclick = () => { if (!audio.paused && audio.src.endsWith(encodeURI(b.dataset.read))) { audio.pause(); b.textContent = '▶ the reading'; return; } audio.src = '../../' + b.dataset.read; audio.play().catch(() => {}); b.textContent = '❚❚ the reading'; });
}
// ——— what a building holds: its address, and each holding with the one action it allows ———
const KINDN = {line: 'a line of his reading', mouth: 'the line, sung by another mouth', hook: 'a hook', pack: 'from the sound pack', screen: 'a film', poster: 'a picture from the canon', ref: 'a reference', reading: 'his reading', echo: 'an echo', radio: 'the radio'};
function holdsBlock(k) {
  const list = HOLD ? HOLD.forLot(k) : []; if (!list.length) return '';
  const audioK = new Set(['line', 'mouth', 'hook', 'pack']);
  return `<h2>What it holds · ${list[0].addr}</h2><div class="holds">${list.map(h => audioK.has(h.kind) ? `<div class="hr"><button data-play="${h.src}" aria-label="play">▶</button><span><b>${KINDN[h.kind]}</b> ${h.title}</span></div>`
    : h.kind === 'screen' ? `<div class="hr"><button data-film="${h.src}" aria-label="watch">▶</button><span><b>${KINDN[h.kind]}</b> ${h.title}</span></div>`
    : `<img src="${srcURL(h.src)}" data-${h.kind === 'poster' ? 'c' : 'ref'}="${h.cid || h.src}" title="${h.title.replace(/"/g, '&quot;')}" loading="lazy" alt="">`).join('')}</div>`;
}
function wireHolds(I) {
  I.querySelectorAll('[data-play]').forEach(b => b.onclick = () => { const src = srcURL(b.dataset.play); if (!audio.paused && audio.src.endsWith(encodeURI(src).replace(/^\.\.\/\.\.\//, ''))) { audio.pause(); b.textContent = '▶'; return; }
    I.querySelectorAll('[data-play]').forEach(q => q.textContent = '▶'); audio.src = src; audio.play().catch(() => {}); b.textContent = '❚❚'; audio.onended = () => b.textContent = '▶'; });
  I.querySelectorAll('[data-film]').forEach(b => b.onclick = () => { const v = document.createElement('video'); v.src = srcURL(b.dataset.film); v.controls = true; v.autoplay = true; v.playsInline = true; b.closest('.hr').after(v); b.remove(); });
  I.querySelectorAll('img[data-ref]').forEach(im => im.onclick = () => { $('evid').querySelector('img').src = im.src; $('evid').style.display = 'block'; $('evbar').style.display = 'flex'; $('evcap').textContent = im.title + ' — laid over the frame'; });
}
// touching a wall: what hangs or plays there, then the rest of what the building holds
function openHolding(h, k) {
  const I = $('info'); let html = '';
  if (h.kind === 'poster') { const s = meta.shots.find(q => q.cid === h.cid); html = `<h3>${h.cid}</h3><div class="k">a picture from the canon (${s ? s.source : ''}) — hung on the wall that faces where it was taken${s && s.poem ? ` · poem ${s.poem}` : ''}</div><img class="big" src="${srcURL(h.src)}" alt=""><div class="chips" style="margin-top:6px"><button data-lay="${h.cid}">lay it over the frame</button></div>`; }
  else if (h.kind === 'screen') html = `<h3>${h.title}</h3><div class="k">playing on the wall · ${h.addr}</div><video src="${srcURL(h.src)}" controls autoplay playsinline></video>`;
  else if (h.kind === 'ref') html = `<h3>${h.title}</h3><div class="k">a reference the foundry read poem ${h.poem} against (${h.source}, ${h.why})</div><img class="big" src="${srcURL(h.src)}" alt="">${h.line ? `<div class="wt">“${h.line}”</div>` : ''}`;
  I.innerHTML = `<button class="x" title="close" aria-label="close">×</button>` + html + holdsBlock(k); I.classList.add('open'); $('side').classList.remove('open');
  I.querySelector('.x').onclick = closeInfo; wireHolds(I);
  I.querySelectorAll('[data-lay]').forEach(b => b.onclick = () => showEvidence(b.dataset.lay, h.title));
  I.querySelectorAll('img[data-c]').forEach(im => im.onclick = () => showEvidence(im.dataset.c, im.title));
}
function closeInfo() { $('info').classList.remove('open'); $('info').querySelectorAll('video').forEach(v => v.pause()); sel = null; audio.pause(); requestDraw(); }
function showEvidence(cid, cap) { $('evid').querySelector('img').src = thumb(cid); $('evid').style.display = 'block'; $('evbar').style.display = 'flex'; $('evcap').textContent = cap + ' — laid over the frame'; }
$('evop').oninput = e => $('evid').querySelector('img').style.opacity = e.target.value;
$('evx').onclick = () => { $('evid').style.display = 'none'; $('evbar').style.display = 'none'; };

// ——— the city in place: era, season, hour, weather, rendering — the step stays registered ———
const lore = () => $('lore').innerHTML = `<b>${S.era} · ${ERA[S.era]}.</b> ${meta.lore[S.era]}`;
ERA.forEach((n, e) => { const b = document.createElement('button'); b.innerHTML = `${e}<br>${n.replace(/^The /, '')}`; b.dataset.e = e; b.onclick = () => setSetting('era', e); $('eras').append(b); });
const SEASONS = [['disc', null, '22 Sept (the disc)'], ['summer', 'summer'], ['autumn', 'autumn'], ['winter', 'winter'], ['spring', 'spring']];
for (const [k, v, t] of SEASONS) { const b = document.createElement('button'); b.textContent = t || k; b.dataset.s = k; b.onclick = () => setSetting('season', v); $('seasons').append(b); }
for (const [t, h] of [['10:00', 10], ['noon (disc)', 12], ['14:00', 14], ['golden', 18.1], ['dusk', 19.3], ['night', 23]]) { const b = document.createElement('button'); b.textContent = t; b.onclick = () => setSetting('hour', h); $('hours').append(b); }
for (const w of ['clear', 'cloudy', 'fog', 'rain', 'storm']) { const b = document.createElement('button'); b.textContent = w + (w === 'clear' ? ' (disc)' : ''); b.dataset.w = w; b.onclick = () => setSetting('weather', w); $('weather').append(b); }
for (const [k, t] of [['photo', 'photographic'], ['flat', 'QADAS flat'], ['wire', 'wireframe'], ['id', 'ID buffer']]) { const b = document.createElement('button'); b.textContent = t; b.dataset.st = k; b.onclick = () => setSetting('style', k); $('styles').append(b); }
$('hour').oninput = e => setSetting('hour', +e.target.value);
$('reg').onchange = e => { S.reg = e.target.checked; if (S.reg) ensureEngine(); requestDraw(); };
function setSetting(k, v) {
  S[k] = v; syncSide(); syncURL();
  if (!onDisc()) ensureEngine().then(e => { if (k === 'era') e.setEra(v); if (k === 'season') { if (v) e.setSeason(v); else { e.setSeason('summer'); e.setDoy(265); e.U.season.value = 0; } } if (k === 'hour') e.setHour(v); if (k === 'weather') e.setWeather(v); if (k === 'style') e.setStyle(v === 'id' ? 'photo' : v); hover = sel = null; requestDraw(); });
  else if (eng) { eng.setEra(S.era); if (!S.season) { eng.setSeason('summer'); eng.setDoy(265); eng.U.season.value = 0; } eng.setHour(S.hour); eng.setWeather(S.weather); eng.setStyle('photo'); }
  requestDraw();
}
function syncSide() {
  document.querySelectorAll('#eras button').forEach(b => b.classList.toggle('on', +b.dataset.e === S.era));
  document.querySelectorAll('#seasons button').forEach(b => b.classList.toggle('on', (b.dataset.s === 'disc' && !S.season) || b.dataset.s === S.season));
  document.querySelectorAll('#weather button').forEach(b => b.classList.toggle('on', b.dataset.w === S.weather));
  document.querySelectorAll('#styles button').forEach(b => b.classList.toggle('on', b.dataset.st === S.style));
  $('hour').value = S.hour; $('hourO').textContent = `${String(Math.floor(S.hour)).padStart(2, '0')}:${String(Math.round((S.hour % 1) * 60)).padStart(2, '0')}`; lore();
}
$('toDisc').onclick = () => { for (const [k, v] of Object.entries({era: 5, season: null, hour: 12, weather: 'clear', style: 'photo'})) if (S[k] !== v) setSetting(k, v); };
$('btnSide').onclick = () => { $('side').classList.toggle('open'); $('info').classList.remove('open'); };
$('discnote').innerHTML = `The disc: ${disc.totals.frames.toLocaleString()} frames (${disc.totals.steps.toLocaleString()} steps × 4 views) over ${disc.totals.km} km — the poet's spines, the processional avenue, the arterials and streets around the fourteen poems — captured at 12:00 on 22 September in ${ERA[5]}, ${FW}×${FH}, 90° each view, ${(disc.totals.bytes / 1048576).toFixed(1)} MB. Anything else is the same pose rendered live.`;

// ——— the transport ———
$('bStep').onclick = () => { S.speed = 0; stepBy(1); };
$('bBack').onclick = () => { S.speed = 0; stepBy(-1); };
$('bStop').onclick = () => { S.speed = 0; requestDraw(); };
$('bPlay').onclick = () => { S.speed = S.speed === 1 ? 0 : 1; if (choices && S.speed) take(choices.find(c => !c.u && Math.abs(c.turn) < 0.6) || choices[0]); requestDraw(); };
$('bFast').onclick = () => { S.speed = S.speed === 2 ? 0 : 2; if (choices && S.speed) take(choices.find(c => !c.u && Math.abs(c.turn) < 0.6) || choices[0]); requestDraw(); };
$('bTurn').onclick = () => { if (choices) { take(choices[choices.length - 1]); } else turnAround(); };
document.querySelectorAll('#rose button').forEach(b => b.onclick = () => setView(+b.dataset.v));
addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.metaKey || e.ctrlKey) return; const k = e.key;
  if (cine.active) { if (cine.key(e)) e.preventDefault(); return; }
  if (mapOpen) { if (k === 'Escape' || k === 'm' || k === 'M') closeMap(); return; }
  if (choices && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp')) { const want = k === 'ArrowLeft' ? -Math.PI / 2 : k === 'ArrowRight' ? Math.PI / 2 : 0;
    take(choices.filter(c => !c.u).reduce((b, c) => !b || Math.abs(wrapA(c.turn - want)) < Math.abs(wrapA(b.turn - want)) ? c : b, null) || choices[0]); e.preventDefault(); return; }
  if (k === 'ArrowUp' || k === 'w') { S.speed = 0; stepBy(1); e.preventDefault(); }
  else if (k === 'ArrowDown' || k === 's') { S.speed = 0; stepBy(-1); e.preventDefault(); }
  else if (k === 'ArrowLeft' || k === 'a') setView((S.view + 3) % 4);
  else if (k === 'ArrowRight' || k === 'd') setView((S.view + 1) % 4);
  else if (k === ' ') { $('bPlay').click(); e.preventDefault(); }
  else if (k === 'm' || k === 'M') openMap();
  else if (k === 'Escape') { closeInfo(); $('side').classList.remove('open'); }
});

// ——— the map above the horizon, and the map ———
const D = {plan, meta, steps, ground: null, aerial: null, bld: () => eng ? eng.C.bld : bldBuf, nodeRank: {}};
NODES.forEach((n, k) => { D.nodeRank[k] = new Set((nodeEdges.get(k) || []).filter(i => E[i].cls >= 1 && E[i].cls !== 2).map(i => E[i].w)).size; });
let bldBuf = null;
const navView = new MapView($('navc'), D); navView.mini = true; navView.mode = 'plan';
function navDraw() { const p = pose(); navView.cx = p.x; navView.cy = p.y; navView.size(); navView.scale = navView.cv.width / 520; navView.rot = -Math.PI / 2 - p.heading;
  navView.draw({pos: S, x: p.x, y: p.y, heading: p.heading, view: S.view, trace, era: S.era});
  $('navt').textContent = `${compass(p.heading)} · ${[...trace.values()].reduce((a, f) => a + f.reduce((s, v) => s + v, 0), 0) * 3} m explored`; }
const mapView = new MapView($('mapc'), D); let mapOpen = false;
function drawMap() { const p = pose(); mapView.draw({pos: S, x: p.x, y: p.y, heading: p.heading, view: S.view, trace, era: S.era}); }
async function loadGround() {
  if (D.ground) return; const [hb, cb] = await Promise.all(['../city3d/height.bin', '../city3d/cover.bin'].map(u => fetch(u).then(r => r.arrayBuffer())));
  const h16 = new Int16Array(hb), height = Float32Array.from(h16, v => v / 10); D.ground = makeGround(meta, height, new Uint8Array(cb));
  if (!eng) bldBuf = new Float32Array(await fetch('../city3d/buildings.f32').then(r => r.arrayBuffer()));
}
function loadAerial() { if (D.aerial) return; D.aerial = {}; const s = new Image(); s.src = 'aerial-s.webp'; s.onload = () => { D.aerial.small = s; drawMap(); }; const b = new Image(); b.src = 'aerial.webp'; b.onload = () => { D.aerial.big = b; drawMap(); }; }
async function openMap() { mapOpen = true; $('map').classList.add('open'); const p = pose(); mapView.size(); mapView.cx = p.x; mapView.cy = p.y; mapView.scale = mapView.cv.width / 10000; mapView.rot = 0; drawMap();
  await loadGround(); drawMap(); mapView.zoomTo(1000, p.x, p.y, 1600); }
function closeMap() { mapOpen = false; $('map').classList.remove('open'); requestDraw(); }
$('nav').onclick = openMap; $('mapx').onclick = closeMap;
for (const [k, t] of [['plan', 'plan'], ['aerial', 'aerial'], ['lynch', 'cartoon (Lynch)']]) { const b = document.createElement('button'); b.textContent = t; b.dataset.m = k; b.onclick = () => { mapView.mode = k; if (k === 'aerial') loadAerial(); $('legend').style.display = k === 'lynch' ? 'block' : 'none'; document.querySelectorAll('#mapmodes button').forEach(q => q.classList.toggle('on', q === b)); drawMap(); }; $('mapmodes').append(b); }
document.querySelector('#mapmodes button').classList.add('on');
for (const f of [10, 100, 1000, 10000]) { const b = document.createElement('button'); b.innerHTML = `10<sup>${Math.log10(f)}</sup> m`; b.title = `a field ${f >= 1000 ? f / 1000 + ' km' : f + ' m'} across`; b.onclick = () => { const p = pose(); mapView.zoomTo(f, f >= 10000 ? 4000 : p.x, f >= 10000 ? 3000 : p.y); }; $('powers').append(b); }
{ const mc = $('mapc'); let md = null, pinch = null; const pts = new Map();
  mc.addEventListener('pointerdown', e => { mc.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); md = {x: e.clientX, y: e.clientY, cx: mapView.cx, cy: mapView.cy, moved: 0}; mapView.anim = null;
    if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = {d: Math.hypot(a[0] - b[0], a[1] - b[1]), s: mapView.scale}; } });
  mc.addEventListener('pointermove', e => { if (!md) return; pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pinch && pts.size === 2) { const [a, b] = [...pts.values()]; mapView.scale = Math.max(0.03, Math.min(80, pinch.s * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch.d)); md.moved = 99; drawMap(); return; }
    const dx = e.clientX - md.x, dy = e.clientY - md.y; md.moved = Math.max(md.moved, Math.abs(dx) + Math.abs(dy)); mapView.cx = md.cx - dx * mapView.dpr / mapView.scale; mapView.cy = md.cy - dy * mapView.dpr / mapView.scale; drawMap(); });
  mc.addEventListener('pointerup', e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (md && md.moved < 6) mapJump(e.clientX, e.clientY); md = null; });
  mc.addEventListener('wheel', e => { e.preventDefault(); const r = mc.getBoundingClientRect(), [wx, wy] = mapView.toWorld((e.clientX - r.left) * mapView.dpr, (e.clientY - r.top) * mapView.dpr), f = Math.exp(-e.deltaY * 0.0015);
    mapView.scale = Math.max(0.03, Math.min(80, mapView.scale * f)); const [nx, ny] = mapView.toWorld((e.clientX - r.left) * mapView.dpr, (e.clientY - r.top) * mapView.dpr); mapView.cx += wx - nx; mapView.cy += wy - ny; drawMap(); }, {passive: false}); }
function mapJump(cx, cy) { const r = $('mapc').getBoundingClientRect(), [wx, wy] = mapView.toWorld((cx - r.left) * mapView.dpr, (cy - r.top) * mapView.dpr); let best = null;
  const tol = 22 * mapView.dpr / mapView.scale;
  for (const [ei, e] of E.entries()) { const bb = e.bb; if (wx < bb[0] - tol || wx > bb[2] + tol || wy < bb[1] - tol || wy > bb[3] + tol) continue; steps(ei).forEach((st, i) => { const d = Math.hypot(st[0] - wx, st[1] - wy) - (SEG.has(ei) ? tol * 0.5 : 0); if (!best || d < best.d) best = {d, ei, i}; }); }
  if (!best || best.d > tol) return; const from = here(); Object.assign(S, {e: best.ei, i: best.i, dir: 1, view: 0}); choices = null; closeMap(); arrived(); undoMove(from, `${WAYS[E[best.ei].w].name}${SEG.has(best.ei) ? '' : ' — off the disc, rendered live'}`); }

// ——— the address bar keeps your place ———
let urlT = 0; function syncURL() { clearTimeout(urlT); urlT = setTimeout(() => { const q = new URLSearchParams({e: S.e, i: S.i, d: S.dir, v: S.view}); if (S.era !== 5) q.set('era', S.era); history.replaceState(null, '', '?' + q); }, 300); }
if (Q.has('era')) S.era = +Q.get('era');

// ——— the ground under the camera, the camera itself, and the ledger of what the city holds ———
const isNight = () => S.hour >= 19 || S.hour < 6;
function groundAt(x, y) { const {nx, ny, cell} = meta, h = groundH, fx = Math.min(Math.max(x / cell, 0), nx - 1.001), fy = Math.min(Math.max(y / cell, 0), ny - 1.001), i = fx | 0, j = fy | 0, a = fx - i, b = fy - j, k = j * nx + i;
  return a + b <= 1 ? h[k] + a * (h[k + 1] - h[k]) + b * (h[k + nx] - h[k]) : h[k + nx + 1] + (1 - a) * (h[k + nx] - h[k + nx + 1]) + (1 - b) * (h[k + 1] - h[k + nx + 1]); }
function camNow(yawOff = 0) { const p = pose(), g = groundH ? Math.max(groundAt(p.x, p.y), 0.35) + 0.22 : 1; return {x: p.x, y: p.y, z: g + disc.frame.eye, yaw: p.heading + S.view * Math.PI / 2 + yawOff, hfov: Math.PI / 2, aspect: FW / FH}; }
async function loadHoldings() {
  const [L, hb, bb] = await Promise.all(['holdings.json', '../city3d/height.bin', '../city3d/buildings.f32'].map((u, i) => fetch(u).then(r => i ? r.arrayBuffer() : r.json())));
  groundH = Float32Array.from(new Int16Array(hb), v => v / 10); if (!bldBuf) bldBuf = new Float32Array(bb);
  HOLD = makeHoldings(L, {bld: D.bld(), onload: () => requestDraw()}); D.holdings = L.holdings;
  SND = makeSound(L, {captions: html => { $('heard').innerHTML = html; $('heard').hidden = !html; }});
  $('btnListen').hidden = false; requestDraw();
}
$('btnListen').onclick = () => { if (!SND) return; listening = !SND.on; listening ? SND.enable() : SND.disable(); $('btnListen').classList.toggle('on', listening); $('btnListen').textContent = listening ? '♪ listening' : '♪ listen'; $('btnListen').setAttribute('aria-pressed', listening); };

// ——— watch: the poem drives the car ———
cine = makeCinema({$, disc,
  pose, fit: () => fit, fx, layout, blit, frameRef,
  clearOver: () => { ox.clearRect(0, 0, overC.width, overC.height); $('turns').style.display = 'none'; },
  wayOf: seg => WAYS[E[seg].w].name,
  ensureEngine: q => ensureEngine(q),
  poseEngine: (seg, i, dir, view) => { const st = steps(seg)[i]; eng.pose(st[0], st[1], dir > 0 ? st[2] : wrapA(st[2] + Math.PI), view); },
  snapshot: () => ({...S}),
  // a film plays from the disc: the city as it was filmed, whatever the street was set to; leaving restores it
  discState: () => { S.speed = 0; choices = null; for (const [k, v] of Object.entries({era: 5, season: null, hour: 12, weather: 'clear', style: 'photo', reg: false})) if (S[k] !== v) setSetting(k, v); },
  restore: o => { for (const k of ['era', 'season', 'hour', 'weather', 'style']) if (S[k] !== o[k]) setSetting(k, o[k]); Object.assign(S, {e: o.e, i: o.i, dir: o.dir, view: o.view, speed: 0}); arrived(); },
  goTo: o => { Object.assign(S, o, {speed: 0}); arrived(); },
  markTrace: path => { for (const [seg, i] of path) { const n = steps(seg).length; if (!trace.has(seg)) trace.set(seg, new Uint8Array(n)); trace.get(seg)[i] = 1; } },
  chrome: on => { for (const id of ['nav', 'hud', 'bar', 'tools']) $(id).hidden = !on; if (!on) { $('side').classList.remove('open'); closeInfo(); closeMapIfOpen(); $('turns').style.display = 'none'; $('toast').style.display = 'none'; } else requestDraw(); },
});
function closeMapIfOpen() { if (mapOpen) closeMap(); }
$('btnWatch').onclick = () => cine.choose();

// ——— go ———
addEventListener('resize', () => { requestDraw(); if (mapOpen) drawMap(); });
syncSide(); mark(); prefetch();
const first = frameRef(S.e, S.i, S.dir, S.view); step(70, 'the first frames off the disc');
if (first) await first.sheet.p;
step(100, ''); $('loading').style.display = 'none';
loadHoldings().catch(e => console.warn('holdings', e));
draw(); requestAnimationFrame(loop);
if (!onDisc()) ensureEngine();
else if (!MOBILE) setTimeout(() => ensureEngine(true), 2500);     // on a desk, raise the city quietly so a touch is answered at once
if (Q.has('watch')) cine.load().then(fs => { const f = fs.find(x => x.num === Q.get('watch')); if (f) { cine.choose().then(() => cine.play(f)); } });
window.__mm = {wallHits: () => wallHits, get HOLD() { return HOLD; }, get SND() { return SND; }, cine, S, plan, disc, steps, draw, ensureEngine, get eng() { return eng; }, stepBy, setView, take, get choices() { return choices; }, openMap, mapView, pullUpTo, touch};
