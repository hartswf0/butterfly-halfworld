// ELSEWHERE MAP — a movie map recovered from the pictures.
// Each station is a shot folded into a pop-up (floor on the ground plane, walls standing where they touch it, sky as a dome);
// exits are other shots; the map is remembered from the walk.
import * as THREE from 'three';

const $ = id => document.getElementById(id);
const D = await fetch('stations.json').then(r => r.json());
const FB = new Uint8Array(await fetch('fold.bin').then(r => r.arrayBuffer()));
const [GX, GY] = D.grid, ST = D.stations, NS = ST.length;
const Q = new URLSearchParams(location.search);
$('ver').textContent = `${D.version} · canon ${D.canon} · links ${D.checksum} · ${NS} stations`;

const renderer = new THREE.WebGLRenderer({canvas: $('gl'), antialias: true});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x07080a);
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.05, 2000); camera.rotation.order = 'YXZ';
const HFOV = 66 * Math.PI / 180, EYE = 1.6, SKY = 400;
const FOLD_COL = [0x6fa8dc, 0xc9a66b, 0x8a8a8a, 0x2f6fa0, 0x4f8a3a, 0xb7b0a0, 0xd0453a].map(c => new THREE.Color(c));
const loader = new THREE.TextureLoader(), img = cid => `img/${cid}.webp`;

// ——— the fold: a station's label grid → a rubber-sheet pop-up ———
function cellDepths(s, k) {
  const g = FB.subarray(k * GX * GY, (k + 1) * GX * GY), F = (s.asp / 2) / Math.tan(HFOV / 2), hz = s.hz;
  const vAt = j => j / GY, groundT = v => v > hz + 0.004 ? EYE * F / (v - hz) : Infinity;   // depth along -z of the ground at row v
  const dep = new Float32Array(GX * GY), kind = new Uint8Array(GX * GY);
  const colDepth = new Float32Array(GX).fill(NaN);
  for (let x = 0; x < GX; x++) {                       // walk each column up from the bottom: ground sets the depth, walls inherit where they stand
    let cur = NaN;
    for (let y = GY - 1; y >= 0; y--) {
      const c = g[y * GX + x], v = (y + 0.5) / GY; kind[y * GX + x] = c;
      if ((c === 1 || c === 3) && v > hz + 0.01) { cur = groundT(v); dep[y * GX + x] = cur; }
      else if (c === 0) dep[y * GX + x] = SKY;
      else if (c === 5) dep[y * GX + x] = v < hz - 0.01 ? EYE * 1.2 * F / (hz - v) : 6;   // ceiling: a plane above, mirrored
      else { if (isNaN(cur)) cur = groundT(Math.min(1, (y + 1) / GY)); if (!isFinite(cur)) cur = NaN;
        if (c === 2 && y + 1 < GY && g[(y + 1) * GX + x] === 6) cur = cur * 1.8;          // a wall seen over a figure stands behind it
        dep[y * GX + x] = cur; if (isNaN(colDepth[x])) colDepth[x] = cur; }
    }
  }
  // columns that never touch ground borrow from their neighbours (or a room-sized default)
  const known = [...colDepth].map((v, i) => [v, i]).filter(a => !isNaN(a[0]) && isFinite(a[0]));
  const fill = x => { if (!known.length) return 18; let b = known[0]; for (const a of known) if (Math.abs(a[1] - x) < Math.abs(b[1] - x)) b = a; return b[0]; };
  for (let i = 0; i < GX * GY; i++) if (isNaN(dep[i]) || !isFinite(dep[i])) dep[i] = fill(i % GX);
  for (let i = 0; i < GX * GY; i++) dep[i] = Math.min(Math.max(dep[i], 1.2), SKY);
  return {dep, kind, F};
}
function buildStation(k) {
  const s = ST[k], {dep, kind, F} = cellDepths(s, k), n = (GX + 1) * (GY + 1);
  const pos = new Float32Array(n * 3), uv = new Float32Array(n * 2), col = new Float32Array(n * 3);
  for (let j = 0; j <= GY; j++) for (let i = 0; i <= GX; i++) {
    const u = i / GX, v = j / GY, cells = [];
    for (const [a, b] of [[i - 1, j - 1], [i, j - 1], [i - 1, j], [i, j]]) if (a >= 0 && b >= 0 && a < GX && b < GY) cells.push(b * GX + a);
    const gr = cells.some(c => kind[c] === 1 || kind[c] === 3) && v > s.hz + 0.004;
    let z;
    if (gr) z = EYE * F / (v - s.hz);
    else { const solid = cells.filter(c => kind[c] !== 0); z = solid.length ? Math.min(...solid.map(c => dep[c])) : SKY; }
    z = Math.min(Math.max(z, 1.2), SKY);
    const dx = (u - 0.5) * s.asp, dy = (s.hz - v);
    const q = (j * (GX + 1) + i);
    pos.set([dx * z / F, gr ? -EYE : dy * z / F, -z], q * 3); uv.set([u, 1 - v], q * 2);
    const c = FOLD_COL[kind[cells[cells.length - 1]]]; col.set([c.r, c.g, c.b], q * 3);
  }
  const idx = [];
  for (let j = 0; j < GY; j++) for (let i = 0; i < GX; i++) { const a = j * (GX + 1) + i; idx.push(a, a + GX + 1, a + 1, a + 1, a + GX + 1, a + GX + 2); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setIndex(idx);
  const tex = loader.load(img(s.cid)); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const photo = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: true}));
  const fold = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({vertexColors: true, wireframe: true, transparent: true, opacity: 0.55}));
  const g = new THREE.Group(); g.add(photo, fold); g.userData = {k, photo, fold, reach: Math.min(14, dep[Math.floor(GY * 0.8) * GX + (GX >> 1)] * 0.55)};
  applyView(g); return g;
}
let view = 'photo';
function applyView(g) { g.userData.photo.visible = view !== 'fold'; g.userData.fold.visible = view !== 'photo'; }
function setOpacity(g, a) { g.userData.photo.material.opacity = a; g.userData.fold.material.opacity = 0.55 * a; }
const cache = new Map();
function station(k) { if (!cache.has(k)) { cache.set(k, buildStation(k)); if (cache.size > 24) { const [ok, og] = cache.entries().next().value; if (og.parent) return cache.get(k); og.traverse(o => { o.geometry?.dispose(); o.material?.map?.dispose(); o.material?.dispose(); }); cache.delete(ok); } } return cache.get(k); }

// ——— travel ———
let cur = null, here = null, yaw = 0, pitch = 0, walk = 0, strafe = 0, busy = false, trail = [];
const EX = {f: 'forward', b: 'back', l: 'left', r: 'right', rh: 'rhyme'};
function place(k, how) {
  if (here) scene.remove(here); cur = k; here = station(k); here.position.set(0, 0, 0); here.rotation.set(0, 0, 0); setOpacity(here, 1); scene.add(here);
  yaw = 0; pitch = 0; walk = 0; strafe = 0; camera.position.set(0, 0, 0);
  trail.push(k); if (trail.length > 400) trail.shift();
  for (const e of ['f', 'b', 'l', 'r']) { const j = ST[k].x[e]; if (j != null) station(j); }       // prefetch the exits
  hud(how); drawMap();
  history.replaceState(null, '', `?s=${ST[k].cid}`);
}
function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
function go(e, j) {
  if (busy) return; if (j == null) j = ST[cur].x[e]; if (j == null) return;
  busy = true; const A = here, B = station(j), t0 = performance.now(), dur = e === 'rh' ? 900 : 1300;
  const d = Math.max(2.5, A.userData.reach);
  B.position.set(0, 0, 0); B.rotation.set(0, 0, 0); setOpacity(B, 0); scene.add(B);
  if (e === 'f') B.position.set(0, 0, -d);
  if (e === 'b') { B.position.set(0, 0, d); }
  if (e === 'r') B.rotation.y = -Math.PI / 2;
  if (e === 'l') B.rotation.y = Math.PI / 2;
  const y0 = yaw, p0 = camera.position.clone();
  function step() {
    const t = Math.min(1, (performance.now() - t0) / dur), k = ease(t);
    if (e === 'f') { camera.position.z = p0.z + (-d - p0.z) * k; camera.position.x = p0.x * (1 - k); setOpacity(A, 1 - k); setOpacity(B, Math.min(1, k * 1.6)); }
    if (e === 'b') { camera.position.z = p0.z + (d - p0.z) * k; setOpacity(A, 1 - k); setOpacity(B, Math.min(1, k * 1.6)); }
    if (e === 'r' || e === 'l') { yaw = y0 + ((e === 'r' ? -Math.PI / 2 : Math.PI / 2) - y0) * k; setOpacity(A, 1 - 0.7 * k); setOpacity(B, 0.3 + 0.7 * k); camera.position.lerpVectors(p0, new THREE.Vector3(), k); }
    if (e === 'rh') { setOpacity(A, 1 - k); setOpacity(B, k); $('cut').style.opacity = String(0.35 * Math.sin(Math.PI * t)); }
    if (t < 1) return requestAnimationFrame(step);
    scene.remove(A); B.position.set(0, 0, 0); B.rotation.set(0, 0, 0); scene.remove(B); $('cut').style.opacity = '0'; busy = false; place(j, e);
  }
  step();
}

// ——— HUD: the station, its phenotype, its exits ———
function hud(how) {
  const s = ST[cur];
  $('title').textContent = `${s.cid} · ${s.src}${s.kind === 'keyframe' ? ' keyframe' : ''}`;
  $('meta').textContent = `${s.poem ? 'poem ' + s.poem + ' · ' : ''}horizon ${s.hz.toFixed(2)} · walls ${s.enc.map(v => v.toFixed(2)).join('/')} · sky ${(s.fr[0] * 100).toFixed(0)}% ground ${((s.fr[1] + s.fr[3]) * 100).toFixed(0)}%`;
  $('how').textContent = how ? `arrived by ${EX[how]}${s.sc && s.sc[{f: 'b', b: 'f', l: 'r', r: 'l'}[how]] ? '' : ''}` : 'entered';
  const c = $('ph').getContext('2d'), W = 560, H = 92; c.clearRect(0, 0, W, H);
  c.fillStyle = 'rgba(111,168,220,.25)'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#8a8a8a'; c.beginPath(); c.moveTo(0, H); s.prof.forEach((p, i) => { c.lineTo(i / (s.prof.length - 1) * W, H - p * H); }); c.lineTo(W, H); c.fill();
  c.strokeStyle = '#ffb35c'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, s.hz * H); c.lineTo(W, s.hz * H); c.stroke();
  if (s.vp[2] > 0.08) { c.fillStyle = '#7fd1ff'; c.beginPath(); c.arc(Math.min(W, Math.max(0, s.vp[0] * W)), Math.min(H, Math.max(0, s.vp[1] * H)), 5, 0, 7); c.fill(); }
  c.fillStyle = '#efe8da'; c.font = '11px ui-monospace,Menlo,monospace'; c.fillText('skyline · horizon · vanishing point', 6, 13);
  for (const e of ['f', 'b', 'l', 'r']) { const b = $('x' + e), j = s.x[e]; b.classList.toggle('none', j == null);
    if (j != null) { b.querySelector('img').src = img(ST[j].cid); b.querySelector('span').textContent = `${ST[j].cid} ${(s.sc?.[e] ?? 0).toFixed(2)}`; b.onclick = () => go(e); } else b.querySelector('img').removeAttribute('src'); }
  $('rhy').innerHTML = s.x.rh.map(j => `<button class="ex rh" data-j="${j}" title="spatial rhyme: ${ST[j].cid}"><img src="${img(ST[j].cid)}" alt=""><b>⟿</b></button>`).join('');
  $('rhy').querySelectorAll('button').forEach(b => b.onclick = () => go('rh', +b.dataset.j));
}

// ——— the remembered map: places laid out by walking the links; recurrences dashed; your trail ———
const TH = new Map(); function thumbImg(cid) { if (!TH.has(cid)) { const im = new Image(); im.onload = () => { clearTimeout(TH.t); TH.t = setTimeout(drawMap, 120); }; im.src = img(cid); TH.set(cid, im); } return TH.get(cid); }
const mapC = $('map'); let big = false, mz = 1, mox = 0, moy = 0;
function drawMap() {
  const dpr = devicePixelRatio, W = mapC.clientWidth, H = mapC.clientHeight; mapC.width = W * dpr; mapC.height = H * dpr;
  const c = mapC.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
  const s = ST[cur], comp = s.c, mem = ST.map((t, i) => [t, i]).filter(([t]) => t.c === comp && t.pos);
  const [cx, cy] = s.pos; const unit = big ? 26 * mz : 9;
  const P = (x, y) => [W / 2 + (x - cx) * unit + (big ? mox : 0), H / 2 + (y - cy) * unit + (big ? moy : 0)];
  c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1;
  for (const [t] of mem) for (const e of ['f', 'b']) { const j = t.x[e]; if (j == null || ST[j].c !== comp) continue; const a = P(...t.pos), b = P(...ST[j].pos); c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke(); }
  c.setLineDash([3, 4]); c.strokeStyle = 'rgba(216,140,255,.45)';
  const near = new Set([cur, ...trail.slice(-30)]);                                     // only the contradictions you have walked into are drawn
  for (const [i, j, e, nx, ny] of D.recur) { if (ST[i].c !== comp || !(near.has(i) || near.has(j))) continue; const a = P(...ST[j].pos), b = P(nx, ny); c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke();
    c.strokeRect(b[0] - 3, b[1] - 3, 6, 6); }
  c.setLineDash([]);
  const seenPlace = new Set();
  for (const [t, i] of mem) { const [x, y] = P(...t.pos); if (x < -20 || y < -20 || x > W + 20 || y > H + 20) continue; const key = t.pos.join(',');
    c.fillStyle = trail.includes(i) ? '#ffb35c' : 'rgba(239,232,218,.55)'; c.beginPath(); c.arc(x, y, seenPlace.has(key) ? 1.6 : 2.6, 0, 7); c.fill(); seenPlace.add(key);
    if (big && mz > 1.2 && !seenPlace.has('t' + key)) { seenPlace.add('t' + key); const im = thumbImg(t.cid), w = unit * 0.9, h = w / t.asp;
      if (im.complete && im.naturalWidth) { c.drawImage(im, x - w / 2, y - h / 2, w, h); if (i === cur) { c.strokeStyle = '#fff'; c.strokeRect(x - w / 2, y - h / 2, w, h); } } } }
  // trail
  c.strokeStyle = '#ffb35c'; c.lineWidth = 2; c.beginPath(); let first = true;
  for (const k of trail.slice(-60)) { if (ST[k].c !== comp) { first = true; continue; } const [x, y] = P(...ST[k].pos); first ? c.moveTo(x, y) : c.lineTo(x, y); first = false; } c.stroke();
  const [x, y] = P(cx, cy), hd = [[0, -1], [1, 0], [0, 1], [-1, 0]][s.h];
  c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y, 5, 0, 7); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + hd[0] * 14, y + hd[1] * 14); c.stroke();
  c.fillStyle = 'rgba(239,232,218,.7)'; c.font = '10px ui-monospace,Menlo,monospace';
  c.fillText(`region ${comp} · ${mem.length} places remembered · ${D.recur.filter(r => ST[r[0]].c === comp).length} kept twice`, 8, H - 8);
  mapC._P = P; mapC._mem = mem;
}
mapC.addEventListener('click', e => {
  if (!big) { big = true; mapC.classList.add('big'); $('maphint').textContent = 'tap a place to go there · scroll to zoom · M to close'; drawMap(); return; }
  if (dragMoved) return;
  const r = mapC.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top; let best = null, bd = 14;
  for (const [t, i] of mapC._mem) { const [x, y] = mapC._P(...t.pos), d = Math.hypot(x - mx, y - my); if (d < bd) { bd = d; best = i; } }
  if (best != null) { closeMap(); place(best, null); }
});
let mdrag = null, dragMoved = false;
mapC.addEventListener('pointerdown', e => { if (big) { mdrag = [e.clientX, e.clientY]; dragMoved = false; } });
addEventListener('pointerup', () => mdrag = null);
mapC.addEventListener('pointermove', e => { if (!mdrag) return; mox += e.clientX - mdrag[0]; moy += e.clientY - mdrag[1]; if (Math.abs(e.clientX - mdrag[0]) + Math.abs(e.clientY - mdrag[1]) > 2) dragMoved = true; mdrag = [e.clientX, e.clientY]; drawMap(); });
mapC.addEventListener('wheel', e => { if (!big) return; e.preventDefault(); mz = Math.min(6, Math.max(0.15, mz * Math.exp(-e.deltaY * 0.0015))); drawMap(); }, {passive: false});
function closeMap() { big = false; mapC.classList.remove('big'); mox = moy = 0; $('maphint').textContent = 'the remembered map · tap to open'; drawMap(); }

// ——— camera species: autopilots with appetites ———
let auto = null;
Object.entries(D.species).forEach(([name, sp]) => { const b = document.createElement('button'); b.textContent = name; b.onclick = () => runSpecies(name, b); $('species').append(b); });
function runSpecies(name, btn) {
  document.querySelectorAll('#species button').forEach(x => x.classList.toggle('on', x === btn && !(auto && auto.name === name)));
  if (auto && auto.name === name) { clearInterval(auto.t); auto = null; $('sp').textContent = ''; return; }
  if (auto) clearInterval(auto.t);
  const sp = D.species[name], p = ST[cur].poem && sp.walks[ST[cur].poem] ? ST[cur].poem : Object.keys(sp.walks)[0], path = sp.walks[p];
  $('sp').textContent = `${name}: ${sp.about} — from poem ${p}, ${path.length} stations`;
  place(path[0], null); let i = 0;
  auto = {name, t: setInterval(() => { if (busy) return; i++; if (i >= path.length) { clearInterval(auto.t); auto = null; return; }
    const a = ST[cur], j = path[i], e = ['f', 'l', 'r', 'b'].find(k => a.x[k] === j) || 'rh'; go(e, j); }, 3200)};
}
Object.entries(D.poems).sort().forEach(([p, k]) => { const b = document.createElement('button'); b.textContent = p; b.title = ST[k].cid; b.onclick = () => place(k, null); $('poems').append(b); });
document.querySelectorAll('#views button').forEach(b => b.onclick = () => { view = b.dataset.v; document.querySelectorAll('#views button').forEach(x => x.classList.toggle('on', x === b)); applyView(here); cache.forEach(applyView); });
$('menu').onclick = () => $('side').classList.toggle('open');

// ——— look and walk within a picture ———
const keys = {}; let drag = null, touch0 = null;
addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true;
  const m = {arrowup: 'f', arrowdown: 'b', arrowleft: 'l', arrowright: 'r'}[e.key.toLowerCase()]; if (m) { e.preventDefault(); go(m); }
  if (e.key === 'r') { const j = ST[cur].x.rh[0]; if (j != null) go('rh', j); }
  if (e.key === 'f') document.querySelector(`#views button[data-v="${view === 'photo' ? 'both' : view === 'both' ? 'fold' : 'photo'}"]`).click();
  if (e.key === 'm') big ? closeMap() : mapC.click(); });
addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
$('gl').addEventListener('pointerdown', e => { drag = [e.clientX, e.clientY]; touch0 = [e.clientX, e.clientY, performance.now()]; });
addEventListener('pointermove', e => { if (!drag || mdrag) return; yaw = Math.max(-0.5, Math.min(0.5, yaw - (e.clientX - drag[0]) * 0.003)); pitch = Math.max(-0.25, Math.min(0.25, pitch - (e.clientY - drag[1]) * 0.003)); drag = [e.clientX, e.clientY]; });
addEventListener('pointerup', e => { if (touch0 && e.pointerType === 'touch') { const dx = e.clientX - touch0[0], dy = e.clientY - touch0[1];      // swipes travel on phones
    if (performance.now() - touch0[2] < 400 && Math.max(Math.abs(dx), Math.abs(dy)) > 60) go(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'r' : 'l') : (dy < 0 ? 'f' : 'b')); }
  drag = null; touch0 = null; });
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); drawMap(); });
const clock = new THREE.Clock();
function loop() {
  const dt = Math.min(0.05, clock.getDelta());
  if (!busy && here) {
    const R = here.userData.reach, f = (keys.w ? 1 : 0) - (keys.s ? 1 : 0), sd = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
    walk = Math.max(-0.5, Math.min(R, walk + f * dt * 3)); strafe = Math.max(-1.5, Math.min(1.5, strafe + sd * dt * 2));
    camera.position.set(strafe, 0, -walk);
    if (walk >= R * 0.98 && f > 0 && ST[cur].x.f != null) go('f');
    if (walk <= -0.49 && f < 0 && ST[cur].x.b != null) go('b');
    if (!keys.w && !keys.s && !drag) { yaw *= 0.97; pitch *= 0.97; }
  }
  const s = here ? ST[here.userData.k] : null; camera.fov = s ? Math.min(75, 2 * Math.atan(Math.tan(HFOV / 2) / s.asp * Math.max(1, s.asp / camera.aspect)) * 180 / Math.PI) : 60; camera.updateProjectionMatrix();
  camera.rotation.set(pitch, yaw, 0);
  renderer.render(scene, camera); requestAnimationFrame(loop);
}
const start = Q.get('s') ? ST.findIndex(s => s.cid === Q.get('s')) : (D.poems['01'] ?? 0);
place(start >= 0 ? start : 0, null); $('loading').style.display = 'none'; loop();
window.__else = {go, place, ST, D};
