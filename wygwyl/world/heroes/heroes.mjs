// the hero-building viewer: pick a building; see it as mass, resolved, both; cut it by storey; lift its front; see it intact,
// ruined, reused; walk inside on its real stairs; read its proofs, its facts, its references; read the poem in its rooms.
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {Reflector} from 'three/addons/objects/Reflector.js';
import {CSS2DRenderer, CSS2DObject} from 'three/addons/renderers/CSS2DRenderer.js';
import {build, prove, useLibrary, expand} from './build.mjs';

const $ = id => document.getElementById(id), Q = new URLSearchParams(location.search);
const [HD, LIB, REFS, CITY] = await Promise.all(['hdl.json', '../language/library.json', 'refs.json', '../city3d/city.json'].map(u => fetch(u).then(r => r.json()).catch(() => null)));
const atlas = new THREE.TextureLoader().load('../language/library.webp'); atlas.colorSpace = THREE.SRGBColorSpace; atlas.anisotropy = 8;
useLibrary(LIB, atlas);

const MOBILE = matchMedia('(max-width: 900px)').matches;
const renderer = new THREE.WebGLRenderer({canvas: $('gl'), antialias: true}); renderer.setPixelRatio(Math.min(devicePixelRatio, MOBILE ? 1.5 : 2)); renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = !MOBILE; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
const labels = new CSS2DRenderer({element: $('labels')}); labels.setSize(innerWidth, innerHeight);
const scene = new THREE.Scene(), sky = new THREE.Color(0xbfc9cf); scene.background = sky; scene.fog = new THREE.Fog(sky, 120, 420);
const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.05, 1500); camera.rotation.order = 'YXZ';
const orbit = new OrbitControls(camera, renderer.domElement); orbit.enableDamping = true; orbit.maxPolarAngle = Math.PI * 0.49;
const hemi = new THREE.HemisphereLight(0xdfe8f0, 0x6a5a48, 1.1); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0dc, 2.6); sun.position.set(-40, 60, -30); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, {left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 200}); sun.shadow.bias = -0.0004; scene.add(sun); scene.add(sun.target);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({color: 0x7a7468, roughness: 1})); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; ground.receiveShadow = true; scene.add(ground);
const street = new THREE.Mesh(new THREE.PlaneGeometry(400, 14), new THREE.MeshStandardMaterial({color: 0x3a3a3c, roughness: 0.9})); street.rotation.x = -Math.PI / 2; street.position.set(0, -0.01, -7.5); street.receiveShadow = true; scene.add(street);

let cur = null, B = null, view = 'resolved', state = 'intact', cut = 99, front = false, night = false, walking = false, beatsOn = true;
const lamps = []; let beatObjs = [];
const PROOFS = HD.heroes.map(h => prove(h));
HD.heroes.forEach((h, i) => { const p = PROOFS[i], f = p.filter(x => x.state === 'FAIL').length, w = p.filter(x => x.state === 'WARN').length;
  const b = document.createElement('button'); b.className = 'hero'; b.innerHTML = `<i class="${f ? 'FAIL' : w ? 'WARN' : 'PASS'}">${f ? f + ' fail' : w ? w + ' warn' : 'pass'}</i><b>${h.name}</b><span>poem ${h.poem} · ${h.note}</span>`;
  b.onclick = () => show(i); b.dataset.i = i; $('list').append(b); });

function show(i) {
  cur = HD.heroes[i]; document.querySelectorAll('.hero').forEach(b => b.classList.toggle('on', +b.dataset.i === i));
  history.replaceState(null, '', '?h=' + cur.id);
  $('hname').textContent = cur.name; $('hnote').textContent = cur.note;
  // proofs, facts, references, siting
  $('proofs').innerHTML = PROOFS[i].map(p => `<div class="pr"><b class="${p.state}">${p.state}</b><div><span class="r">${p.rule}</span><span class="d">${p.detail}</span></div></div>`).join('');
  $('fit').innerHTML = (cur.fit || []).map(f => `<div class="fit"><b>saw: ${f.saw}</b><span class="${/^open|^partly/.test(f.did) ? 'open' : ''}">${f.did}</span></div>`).join('');
  $('facts').innerHTML = (cur.facts || []).map(f => `<div class="fact"><i class="${f.status}">${f.status}</i>${f.claim}</div>`).join('');
  const R = REFS?.[cur.id] || {}; const th = it => `<img src="ref/${it.f}" title="${it.src} · ${it.s}" loading="lazy" alt="">`;
  $('rext').innerHTML = (R.exterior || []).slice(0, 9).map(th).join(''); $('rint').innerHTML = (R.interior || []).slice(0, 9).map(th).join('');
  document.querySelectorAll('.refs img').forEach(im => im.onclick = () => { $('zoom').querySelector('img').src = im.src; $('zoom').style.display = 'flex'; });
  const lm = CITY?.landmarks.find(l => l.type === cur.landmark || l.name === cur.landmark);
  $('where').innerHTML = lm ? `in the city it stands for <b style="color:var(--ink)">${lm.name}</b> (poem ${lm.poem}), read from ${lm.evidence.length} shots · <a style="color:#7fd1ff" href="../city3d/index.html">go to the city</a>` : '';
  const st = ['intact', ...(cur.eras.ruined != null ? ['ruin'] : []), ...(cur.eras.reuse ? ['reuse'] : [])];
  $('states').innerHTML = st.map(s => `<button class="c ${s === 'intact' ? 'on' : ''}" data-s="${s}">${s === 'reuse' ? (cur.eras.reuse || 'reused') : s === 'ruin' ? 'after the Fall' : 'as built'}</button>`).join('');
  $('states').querySelectorAll('button').forEach(b => b.onclick = () => { state = b.dataset.s; $('states').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); compile(); });
  state = 'intact'; cut = 99; $('cut').max = cur.levels.length; $('cut').value = cur.levels.length; front = false; $('front').classList.remove('on');
  setting(cur.setting || 'day'); compile(true); $('cmp').classList.remove('on'); $('cmpimg').style.display = 'none';
  const ref = (REFS?.[cur.id]?.exterior || [])[cur.shot?.ref ?? 0]; $('cmpimg').src = ref ? 'ref/' + ref.f : ''; heroShot();
}
function compile(frame) {
  if (B) { scene.remove(B.group); scene.remove(B.mass); B.group.traverse(o => o.geometry?.dispose()); }
  B = build(cur, {state}); scene.add(B.group); scene.add(B.mass);
  const [W, D] = cur.footprint; B.group.position.set(-W / 2, 0, 0); B.mass.position.copy(B.group.position);
  apply(); placeBeats(); setLamps();
  if (frame) { const r = Math.max(W, D, B.top) * 1.6; camera.fov = 48; camera.updateProjectionMatrix(); camera.position.set(r * 0.7, B.top * 0.7 + 8, -r * 0.9); orbit.target.set(0, B.top * 0.35, D / 2); walking = false; $('walk').classList.remove('on'); orbit.enabled = true; }
}
function apply() {
  if (!B) return;
  B.group.visible = view !== 'mass'; B.mass.visible = view !== 'resolved';
  B.mass.children.forEach(m => m.material.opacity = view === 'both' ? 0.3 : 0.7);
  const L = cur.levels.length, lim = Math.min(cut, L) - 1;
  B.levels.forEach((g, k) => { g.visible = k <= lim; g.traverse(o => { if (o.userData.wall) o.visible = !(front && o.userData.wall.ext && o.userData.wall.side === 'front'); if (o.userData.ceiling) o.visible = walking || k < lim || (cut >= L && !front ? true : k < lim); }); });
  B.stairs.children.forEach(g => g.visible = g.userData.level < lim || (g.userData.level <= lim && lim < L - 1) ? true : g.userData.level < L - 1 && g.userData.level <= lim);
  B.roof.visible = cut >= L && !front; B.ext.visible = !front || walking;
  B.mass.children.forEach(m => m.visible = m.userData.room.level <= lim);
  beatObjs.forEach(o => o.visible = beatsOn && (o.userData.level ?? 0) <= lim);
}
// the poem's lines, staged in the rooms its beats name
function placeBeats() {
  beatObjs.forEach(o => o.parent?.remove(o)); beatObjs = [];
  const lines = (CITY?.words || []).filter(w => w.poem === cur.poem).map(w => w.t), H = expand(cur), rooms = H.levels.flatMap(l => l.rooms);
  (cur.beats || []).forEach((b, i) => { const t = lines[i % Math.max(1, lines.length)]; if (!t) return; let p, lv = 0;
    const r = rooms.find(r => r.id === b);
    if (r) { p = [r.x + r.w / 2, r.z + 1.9, r.y + r.d / 2]; lv = r.level; }
    else if (b === 'fireescape') { const e = cur.exterior.find(e => e.kind === 'fireescape'); p = [e.x + e.w / 2, H.levels[2].z + 1.6, -1]; lv = 2; }
    else if (b === 'roof') { p = [cur.footprint[0] / 2, B.top + 2, cur.footprint[1] / 2]; lv = cur.levels.length - 1; }
    else if (b === 'terrace') { p = [cur.footprint[0] / 2, 2.2, -2]; }
    if (!p) return;
    const d = document.createElement('div'); d.className = 'beat'; d.innerHTML = `“${t}”<small>${r ? r.name : b}</small>`;
    const o = new CSS2DObject(d); o.position.set(...p); o.userData.level = lv; B.group.add(o); beatObjs.push(o); });
  apply();
}
function setLamps() {
  lamps.forEach(l => scene.remove(l)); lamps.length = 0; if ((!night && !walking) || !B) return;
  const lvNow = walking ? cur.levels.reduce((b, l, k) => l.z <= P.z + 0.5 ? k : b, 0) : null;   // walking: the storey you are on, and the next ones, are lit
  const rooms = B.rooms.filter(r => walking ? Math.abs(r.level - lvNow) <= 1 : r.level < Math.min(cut, cur.levels.length)).slice(0, 14);
  for (const r of rooms) { const l = new THREE.PointLight(0xffc98a, 14, Math.max(r.w, r.d) * 1.6, 1.6); l.position.set(r.x + r.w / 2 + B.group.position.x, r.z + r.h - 0.6, r.y + r.d / 2 + B.group.position.z); scene.add(l); lamps.push(l); }
}
// settings: each hero carries the mood of its references
const water = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshStandardMaterial({color: 0x2a4a52, roughness: 0.08, metalness: 0.3})); water.rotation.x = -Math.PI / 2; water.position.y = -0.7; water.visible = false; scene.add(water);
const coloured = [new THREE.PointLight(0xff2a3a, 0, 60, 1.4), new THREE.PointLight(0x20d0c8, 0, 60, 1.4)]; coloured.forEach(l => scene.add(l));
// the wet ground: a real mirror under a thin wet film, so lit things are doubled the way the references double them
const mirror = new Reflector(new THREE.PlaneGeometry(300, 300), {textureWidth: MOBILE ? 512 : 1024, textureHeight: MOBILE ? 512 : 1024, color: 0x6a6e74});
mirror.rotation.x = -Math.PI / 2; mirror.position.y = -0.03; mirror.visible = false; scene.add(mirror);
let SET = 'day';
function setting(name) {
  SET = name; const gm = ground.material, sm = street.material; water.visible = false; coloured.forEach(l => l.intensity = 0); mirror.visible = false;
  gm.transparent = false; gm.opacity = 1; sm.transparent = false; sm.opacity = 1;
  gm.color.set(0x7a7468); gm.roughness = 1; gm.metalness = 0; sm.roughness = 0.9; sm.color.set(0x3a3a3c); street.visible = true; ground.visible = true;
  let bg = 0xbfc9cf, hi = 1.1, si = 2.6, sc = 0xfff0dc, sp = [-40, 60, -30], ex = 1.0, nightish = false;
  if (name === 'tidal') { bg = 0x6d7882; hi = 1.0; si = 1.6; sc = 0xffe2c0; sp = [-50, 22, -10]; gm.color.set(0x8c8678); gm.roughness = 0.12; gm.metalness = 0.35; street.visible = false; }
  if (name === 'harbour') { bg = 0xa9c8d8; water.visible = true; ground.visible = false; street.visible = false; sp = [-30, 55, -40]; }
  if (name === 'wetnight' || name === 'redteal') { nightish = true; bg = 0x0a0d12; hi = 0.12; si = 0.05; ex = 1.4; sm.roughness = 0.08; sm.color.set(0x1a1c20); gm.roughness = 0.2; gm.color.set(0x24262a); }
  if (name === 'redteal') { const [W] = cur.footprint; coloured[0].position.set(-W * 0.2, 4, -6); coloured[0].intensity = 260; coloured[1].position.set(W * 1.2 - W / 2, 9, -7); coloured[1].intensity = 200; }
  if (['tidal', 'wetnight', 'redteal'].includes(name)) { mirror.visible = true; gm.transparent = true; gm.opacity = name === 'tidal' ? 0.55 : 0.5; sm.transparent = true; sm.opacity = 0.45; gm.needsUpdate = sm.needsUpdate = true; }
  scene.background = new THREE.Color(bg); scene.fog.color = new THREE.Color(bg); hemi.intensity = hi; sun.intensity = si; sun.color.set(sc); sun.position.set(...sp); renderer.toneMappingExposure = ex;
  night = nightish; $('night').classList.toggle('on', night);
}
function heroShot() { const s = cur.shot; if (!s || !B) return; walking = false; $('walk').classList.remove('on'); orbit.enabled = true;
  const o = B.group.position; camera.position.set(s.pos[0] + o.x, s.pos[2], s.pos[1] + o.z); orbit.target.set(s.target[0] + o.x, s.target[2], s.target[1] + o.z); camera.fov = s.fov || 40; camera.updateProjectionMatrix(); }
$('shot').onclick = () => { heroShot(); };
$('cmp').onclick = () => { const on = !$('cmp').classList.contains('on'); $('cmp').classList.toggle('on', on); $('cmpimg').style.display = on && $('cmpimg').src ? 'block' : 'none'; if (on) { heroShot(); beatsOn = false; $('beats').classList.remove('on'); apply(); } };
$('cmpo').oninput = e => $('cmpimg').style.opacity = e.target.value;
// controls
document.querySelectorAll('#views button').forEach(b => b.onclick = () => { view = b.dataset.v; document.querySelectorAll('#views button').forEach(x => x.classList.toggle('on', x === b)); apply(); });
$('cut').oninput = e => { cut = +e.target.value; apply(); setLamps(); };
$('front').onclick = () => { front = !front; $('front').classList.toggle('on', front); apply(); };
$('night').onclick = () => { const N = ['wetnight', 'redteal'], home = cur.setting || 'day'; setting(night ? (N.includes(home) ? 'day' : home) : (N.includes(home) ? home : 'wetnight')); setLamps(); };
$('beats').onclick = () => { beatsOn = !beatsOn; $('beats').classList.toggle('on', beatsOn); apply(); }; $('beats').classList.add('on');
$('zoom').onclick = () => $('zoom').style.display = 'none';

// ——— walking: wall collision with doors, floors with holes, stairs as ramps you climb ———
let P = {x: 0, y: -3, z: 0}, yaw = 0, pitch = 0, lastLv = -1; const keys = {}; let drag = null;
$('walk').onclick = () => { walking = !walking; $('walk').classList.toggle('on', walking); orbit.enabled = !walking;
  if (walking) { const d = (cur.doors || []).find(d => d.a === 'street' || d.b === 'street'); const H = expand(cur);
    const at = d ? (d.at ?? (H.levels[0].rooms.find(r => r.id === (d.a === 'street' ? d.b : d.a))?.x + H.levels[0].rooms.find(r => r.id === (d.a === 'street' ? d.b : d.a))?.w / 2)) : cur.footprint[0] / 2;
    P = {x: at, y: -3.5, z: 0}; yaw = Math.PI; pitch = 0; $('hint').textContent = 'WASD / arrows to walk · drag to look · climb the stairs by walking onto them'; }
  else $('hint').textContent = ''; apply(); setLamps(); };
addEventListener('keydown', e => keys[e.key.toLowerCase()] = true); addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
renderer.domElement.addEventListener('pointerdown', e => drag = [e.clientX, e.clientY]); addEventListener('pointerup', () => drag = null);
addEventListener('pointermove', e => { if (!drag || !walking) return; yaw -= (e.clientX - drag[0]) * 0.004; pitch = Math.max(-1.2, Math.min(1.2, pitch - (e.clientY - drag[1]) * 0.004)); drag = [e.clientX, e.clientY]; });
function floorAt(x, y, z) {
  for (const f of B.flights) if (f.contains(x, y, 0.05)) { const hz = f.heightAt(x, y); if (Math.abs(hz - z) < 0.65) return hz; }
  let best = null; const H = cur;
  for (const r of B.rooms) { if (x < r.x || x > r.x + r.w || y < r.y || y > r.y + r.d) continue; if (r.z > z + 0.45) continue;
    if (B.flights.some(f => f.to === r.level && x >= f.hole.x && x <= f.hole.x + f.hole.w && y >= f.hole.y && y <= f.hole.y + f.hole.d)) continue;
    if (best == null || r.z > best) best = r.z; }
  if (best != null) return best;
  for (const e of cur.exterior || []) { if (e.kind === 'stoop' && x >= e.x && x <= e.x + e.w && y < 0 && y > -Math.ceil(e.rise / 0.17) * 0.3) return e.rise * (1 + y / (Math.ceil(e.rise / 0.17) * 0.3));
    if (e.kind === 'terrace' && y < 0 && y > -e.d) return cur.levels[0].z; if (e.kind === 'porch' && y > cur.footprint[1] - 1.5) return cur.levels[0].z * Math.max(0, Math.min(1, 1 - (x - (cur.footprint[0] - 1.2)) / 1.1)); }
  return 0;
}
function blocked(x0, y0, x1, y1, z) {
  const lv = cur.levels.reduce((b, l, k) => l.z <= z + 0.5 ? k : b, 0);
  for (const w of B.walls2d[lv] || []) { if (w.kind !== 'wall') continue;
    const [p0, p1, c] = w.o === 'h' ? [y0, y1, w.c] : [x0, x1, w.c], along = w.o === 'h' ? x1 : y1;
    if (along < w.a - 0.2 || along > w.b + 0.2) continue;
    if (Math.abs(p1 - c) < 0.22 || (p0 - c) * (p1 - c) < 0) { const door = (w.ops || []).find(o => o[4] === 'door' && along > o[0] + 0.15 && along < o[1] - 0.15 && o[2] <= z + 0.3); if (!door) return true; } }
  return false;
}
const clock = new THREE.Clock();
function loop() {
  const dt = Math.min(0.05, clock.getDelta());
  if (walking && B) {
    const sp = (keys.shift ? 3.2 : 1.6) * dt, f = (keys.w || keys.arrowup ? 1 : 0) - (keys.s || keys.arrowdown ? 1 : 0), s = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0);
    const fx = -Math.sin(yaw), fy = -Math.cos(yaw), dx = (fx * f + Math.cos(yaw) * s) * sp, dy = (fy * f - Math.sin(yaw) * s) * sp;
    // local frame: three x = HDL x; three z = HDL y (+offset)
    const lx = P.x, ly = P.y;
    if (!blocked(lx, ly, lx + dx, ly, P.z)) P.x += dx; if (!blocked(P.x, ly, P.x, ly + dy, P.z)) P.y += dy;
    const fz = floorAt(P.x, P.y, P.z); P.z += (fz - P.z) * Math.min(1, dt * (fz < P.z ? 6 : 14));
    camera.position.set(P.x + B.group.position.x, P.z + 1.6, P.y + B.group.position.z); camera.rotation.set(pitch, yaw, 0);
    const lv = cur.levels.reduce((b, l, k) => l.z <= P.z + 0.5 ? k : b, 0); if (cut !== 99 && cut < lv + 1) { cut = 99; $('cut').value = cur.levels.length; apply(); }
    if (lv !== lastLv) { lastLv = lv; setLamps(); }
  } else orbit.update();
  B?.group.traverse(o => { if (o.userData.marquee) o.material.emissiveIntensity = night ? 3 : 1; });
  renderer.render(scene, camera); labels.render(scene, camera); requestAnimationFrame(loop);
}
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); labels.setSize(innerWidth, innerHeight); });
$('loading').style.display = 'none';
show(Math.max(0, HD.heroes.findIndex(h => h.id === Q.get('h')))); loop();
window.__heroes = {get P() { return P; }, get B() { return B; }, PROOFS, show, camera, orbit};
