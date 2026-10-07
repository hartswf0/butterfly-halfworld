// ATLANTIS · the city across time — the worldtext city as a tool you can stand in.
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {CSS2DRenderer, CSS2DObject} from 'three/addons/renderers/CSS2DRenderer.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {loadCity, sampler, makeTerrain, makeWards, makeRoads, makeBuildings, makeTrees, makeStreetLife, STYLES, COVER, setLibrary} from './city.mjs';
import {makeFound} from './found3d.mjs';
import {makeIcons} from './icons.mjs';
import {makeStreetKit} from './streetkit.mjs';
import {makeHeroes} from './heroesInCity.mjs';
import {makeNames} from './names.mjs';
import {buildLandmark, tickClocks, MATS, NIGHTLIT} from './landmarks.mjs';
import {makeHeavens, makeSea} from './heavens.mjs';
import {makeRising} from './evolved.mjs';
import {makeDetail} from './detail.mjs';

const $ = id => document.getElementById(id);
const MOBILE = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
const lbar = $('lbar'), lmsg = $('lmsg'); const step = (p, m) => { lbar.style.width = p + '%'; lmsg.textContent = m; };
const Q = new URLSearchParams(location.search);

const renderer = new THREE.WebGLRenderer({canvas: $('gl'), antialias: !MOBILE, powerPreference: 'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio, MOBILE ? 1.5 : 2)); renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = !MOBILE; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 1, 52000);
const labels = new CSS2DRenderer({element: $('labels')}); labels.setSize(innerWidth, innerHeight);
const U = {night: {value: 0}, era: {value: 5}, time: {value: 0}, wet: {value: 0}, pulseO: {value: new THREE.Vector2(-1e5, -1e5)}, pulseT: {value: 99},
  matAtlas: {value: null}, matGrid: {value: new THREE.Vector2(8, 8)}, libFacade: {value: new THREE.Vector4()}, libRoad: {value: new THREE.Vector4()}};
// the material library: 32 surfaces × 2 variants cut from the archive's own frames (wygwyl/world/language/library.*)
const LIB = await fetch('../language/library.json').then(r => r.json());
U.matAtlas.value = new THREE.TextureLoader().load('../language/library.webp'); U.matAtlas.value.colorSpace = THREE.SRGBColorSpace; U.matAtlas.value.anisotropy = 8;
U.matGrid.value.set(LIB.cols, LIB.rows);

step(8, 'reading the worldtext');
const C = await loadCity('./').catch(e => { step(0, 'could not load the city: ' + e.message + ' (serve over http)'); throw e; });
const S = sampler(C), meta = C.meta;
const LIBI = setLibrary(LIB); U.libFacade.value.set(LIBI['graffiti'], LIBI['moss'], LIBI['ceramic'], 0); U.libRoad.value.set(LIBI['asphalt'], LIBI['granite'], LIBI['cobbles'], LIBI['sidewalk']);
$('ver').innerHTML = `${meta.version} · canon ${meta.from.canon_checksum} · city ${meta.from.city_checksum} · ${meta.counts.buildings.toLocaleString()} buildings · ${meta.counts.shots} placed shots · <a href="../iconic/">Lynch map</a> · <a href="../../atlas.html">atlas</a>`;

step(25, 'the ground and the sea');
const heav = makeHeavens(scene, renderer, {lat: meta.lat, lon: meta.lon, shadows: !MOBILE});
const terrain = makeTerrain(C); scene.add(terrain);
const sea = makeSea(scene, C.height, meta, heav);
const wards = makeWards(C);
step(40, 'the streets');
const roads = makeRoads(C, S, U); scene.add(roads);
step(55, 'the buildings');
const blds = makeBuildings(C, U); scene.add(blds);
step(68, 'trees, docks, cafés, bus stops');
const trees = makeTrees(C); scene.add(trees);
const street = makeStreetLife(C, S, U); scene.add(street);

// ——— landmarks: one hand-modeled structure per type, rebuilt when its era-state changes ———
step(78, 'the landmarks');
const ERA = meta.eras, LM = meta.landmarks;
const lmState = (lm, e) => { const [b, r, as] = lm.era; if (b > e) return null; if (r < 9 && e >= r) return e >= 5 && as ? 'reuse' : 'ruin'; return 'intact'; };
const lmGroups = LM.map(lm => { const g = new THREE.Group(); g.position.set(lm.x, lm.type === 'bridge' ? 0 : Math.max(lm.z, 0.2), lm.y); g.rotation.y = -(lm.rot || 0); g.userData = {lm, state: undefined, cache: {}}; scene.add(g); return g; });
function setLandmarks(e) {
  for (const g of lmGroups) { const st = lmState(g.userData.lm, e); if (st === g.userData.state) continue; g.userData.state = st;
    g.children.forEach(c => c.visible = false); if (!st) continue;
    const c = g.userData.cache[st] || (g.userData.cache[st] = buildLandmark(g.userData.lm, st)); if (!c.parent) g.add(c); c.visible = true; }
}
// ——— Atlantis rising: the structures evolved from the shots that ask for them ———
step(86, 'the evolved structures');
const rising = makeRising(scene, C, S, heav, U); const RD = await rising.load('structures.json').catch(() => null);
let vi = RD ? Math.max(0, RD.variants.findIndex(v => v.name === (Q.get('variant') || 'the mixed city'))) : -1;
const detail = makeDetail(scene, C, S, blds, {radius: MOBILE ? 260 : 420});
step(90, 'the found architecture');
const found = makeFound(scene, C, S, U, {idx: LIBI}); const FD = await found.load('../language/found.json');
step(94, 'the icons');
const icons = makeIcons(scene, C, S, U, heav); const ID = await icons.load('icons.json');
C.stopsForBoards = street.userData.stops; const PAL = await fetch('../language/palettes.json').then(r => r.json()).catch(() => null);
const skit = makeStreetKit(scene, C, S, U, heav, wards, PAL);
step(97, 'the hero buildings');
const heroes = await makeHeroes(scene, C, S, LIB, U.matAtlas.value, lmGroups, found);
const names = makeNames(scene, C, S);
const mats = MATS(); for (const k of NIGHTLIT) mats[k].userData.base = mats[k].emissiveIntensity;

// ——— labels: landmarks, poems, districts (with their use in this era), wards ———
const LAYERS = {labels: true, districts: true, wards: false, shots: true, words: true, trees: true, lamps: true};
function label(cls, html, x, y, z, onclick) { const d = document.createElement('div'); d.className = 'lab ' + cls; d.innerHTML = html; if (onclick) d.onclick = e => { e.stopPropagation(); onclick(); };
  const o = new CSS2DObject(d); o.position.set(x, y, z); scene.add(o); return o; }
const lmLabels = LM.map((lm, i) => label('lm', lm.name.split(' · ')[0], lm.x, Math.max(lm.z, 0) + 12, lm.y, () => showLandmark(i)));
const poemLabels = meta.poems.map(p => label('poem', `${p.num} ${p.title}`, p.x, S.ground(p.x, p.y) + 30, p.y, () => goPoem(p.num)));
const distLabels = meta.districts.map(d => label('dist', d.name.replace(/^the /, ''), d.x, Math.max(S.ground(d.x, d.y), 0) + 70, d.y));
const iconLabels = (ID?.icons || []).map((ic, i) => label('lm', ic.name, ic.site.x, Math.max(ic.site.z, 0) + 70, ic.site.y, () => showIcon(ic)));
const wardLabels = wards.list.map(d => label('ward', `WARD ${d.ward}`, d.x, Math.max(S.ground(d.x, d.y), 0) + 40, d.y + 60));

// ——— the worldtext: what he says, written into the place where he sees it ———
const words = meta.words.map(w => { const c = document.createElement('canvas'); c.width = 1024; c.height = 128; const x = c.getContext('2d');
  x.font = 'italic 44px Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = '#000'; x.shadowBlur = 10; x.fillStyle = '#fff3d8';
  x.fillText(w.t.length > 54 ? w.t.slice(0, 54) + '…' : w.t, 512, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({map: t, transparent: true, depthWrite: false, fog: false})); s.scale.set(32, 4, 1); s.position.set(w.x, w.z + 8, w.y); s.userData.w = w; scene.add(s); return s; });

// ——— the shots: every iconic frame stood where it was read; the frame floats in front of its camera ———
const SRC_COL = {archive: 0xffb35c, generated: 0x7fd1ff, markov: 0xd88cff, film: 0xff5a4a, halfworld: 0x8cff9a, other: 0xcccccc};
const SH = meta.shots;
const camGeo = new THREE.ConeGeometry(0.7, 1.8, 4); camGeo.rotateZ(-Math.PI / 2);
const shotMesh = new THREE.InstancedMesh(camGeo, new THREE.MeshBasicMaterial({color: 0xffffff}), SH.length);
SH.forEach((s, i) => { const m = new THREE.Matrix4().compose(new THREE.Vector3(s.x, s.z + 1.2, s.y), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -s.hd * Math.PI / 180), new THREE.Vector3(1, 1, 1));
  shotMesh.setMatrixAt(i, m); shotMesh.setColorAt(i, new THREE.Color(SRC_COL[s.source] || 0xffffff)); });
scene.add(shotMesh);
const frame = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({transparent: true, opacity: 0.92, side: THREE.DoubleSide, fog: false})); frame.visible = false; scene.add(frame);
const texLoader = new THREE.TextureLoader(), thumb = cid => `../iconic/c/${cid}.webp`;

// ——— post ———
let composer = null;
if (!MOBILE) { composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.55, 0.6, 0.86)); composer.addPass(new OutputPass()); }

// ——— controls ———
const orbit = new OrbitControls(camera, renderer.domElement); orbit.enableDamping = true; orbit.maxPolarAngle = Math.PI * 0.495; orbit.minDistance = 20; orbit.maxDistance = 14000;
camera.position.set(6350, 340, 3700); orbit.target.set(5640, 30, 3180); camera.lookAt(orbit.target);
let mode = 'orbit', yaw = 0, pitch = 0, ptour = null; const keys = {}, look = {x: 0, y: 0}; let joy = null, flyTo = null, tour = null;
addEventListener('keydown', e => { if (e.target.tagName === 'INPUT') return; keys[e.key.toLowerCase()] = true; });
addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
let drag = null;
renderer.domElement.addEventListener('pointerdown', e => { drag = {x: e.clientX, y: e.clientY, t: performance.now(), moved: 0}; });
addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.moved += Math.abs(dx) + Math.abs(dy);
  if (mode === 'walk' || mode === 'fly' || mode === 'street') { yaw -= dx * 0.004; pitch = Math.max(-1.3, Math.min(1.3, pitch - dy * 0.004)); } drag.x = e.clientX; drag.y = e.clientY; });
addEventListener('pointerup', e => { if (drag && drag.moved < 6) pick(e); drag = null; });
// mobile joystick
const J = $('joy'), Ji = J.querySelector('i');
J.addEventListener('pointerdown', e => { e.stopPropagation(); joy = {id: e.pointerId, cx: J.getBoundingClientRect().left + 55, cy: J.getBoundingClientRect().top + 55, x: 0, y: 0}; J.setPointerCapture(e.pointerId); });
J.addEventListener('pointermove', e => { if (!joy) return; e.stopPropagation(); joy.x = Math.max(-1, Math.min(1, (e.clientX - joy.cx) / 45)); joy.y = Math.max(-1, Math.min(1, (e.clientY - joy.cy) / 45)); Ji.style.transform = `translate(${joy.x * 35}px,${joy.y * 35}px)`; });
J.addEventListener('pointerup', () => { joy = null; Ji.style.transform = ''; });

const MODES = {orbit: 'drag to turn, scroll to zoom, right-drag to pan', walk: 'WASD / arrows · drag to look · shift to run', fly: 'WASD · Q/E down/up · drag to look', street: 'driving the spines at street level — the camera car', poems: 'the poem tour: each poem from the shot that best sees it'};
function setMode(m) {
  const prev = mode; if (tour) tour = null; ptour = null; flyTo = null; mode = m; orbit.enabled = m === 'orbit';
  document.querySelectorAll('#modes button').forEach(b => b.classList.toggle('on', b.dataset.m === m)); $('modehelp').textContent = MODES[m];
  J.style.display = (m === 'walk' || m === 'fly') && MOBILE ? 'block' : 'none';
  const d = new THREE.Vector3(); camera.getWorldDirection(d); yaw = Math.atan2(-d.x, -d.z); pitch = Math.asin(d.y);
  if (m === 'walk') { const p = camera.position; if (p.y > S.ground(p.x, p.z) + 40) { const t = orbit.target; p.set(t.x, 0, t.z); } pitch = 0; }
  if (m === 'orbit' && prev !== 'orbit') { const d2 = new THREE.Vector3(); camera.getWorldDirection(d2); orbit.target.copy(camera.position).addScaledVector(d2, 200); orbit.target.y = Math.max(S.ground(orbit.target.x, orbit.target.z), 0); }
  if (m === 'street') startStreet(); if (m === 'poems') startPoemTour();
}
function goTo(pos, target, dur = 1.6, then) { flyTo = {p0: camera.position.clone(), p1: pos.clone(), t0: (orbit.enabled ? orbit.target : camera.position.clone().add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(100))).clone(), t1: target.clone(), k: 0, dur, then}; }

// ——— the street car: the Aspen idea — drive the centre of the spines, every frame registered to the map ———
function spinePath() {
  const sp = C.roads.filter(r => r[0] === 3 || r[0] === 4).sort((a, b) => b[2].length - a[2].length); const pts = [];
  for (const r of sp.slice(0, 6)) for (let i = 0; i < r[2].length; i += 2) pts.push(new THREE.Vector3(r[2][i], 0, r[2][i + 1]));
  return pts;
}
function startStreet() { const pts = spinePath(); if (pts.length < 2) return; tour = {kind: 'street', pts, i: 0, f: 0}; }
function startPoemTour() { ptour = {k: -1, t: 99}; }
function bestShot(num) { const c = SH.filter(s => s.poem === num); return c.sort((a, b) => (b.read?.landmark?.[1] || 0) - (a.read?.landmark?.[1] || 0))[0]; }

// ——— time, weather, era ———
let hour = +($('hour').value), doy = +($('doy').value), running = false, era = Q.has('era') ? +Q.get('era') : 5;
if (Q.has('hour')) hour = +Q.get('hour'); if (Q.has('doy')) doy = +Q.get('doy');
function dateOf() { return new Date(Date.UTC(2026, 0, 1) + (doy - 1) * 864e5 + (hour + 4) * 36e5); }  // local = UTC−4
function fmtH(h) { const H = Math.floor(h) % 24, M = Math.floor((h % 1) * 60); return `${String(H).padStart(2, '0')}:${String(M).padStart(2, '0')}`; }
function syncRange(el) { el.style.setProperty('--p', ((el.value - el.min) / (el.max - el.min) * 100) + '%'); }
function setTimeUI() { $('hour').value = hour; $('doy').value = doy; syncRange($('hour')); syncRange($('doy')); $('hourO').textContent = fmtH(hour);
  const d = dateOf(); $('doyO').textContent = d.toLocaleDateString('en-US', {month: 'short', day: 'numeric', timeZone: 'UTC'}); $('clk').textContent = fmtH(hour); $('dt').textContent = $('doyO').textContent + ' · 39.29°N'; }
$('hour').oninput = e => { hour = +e.target.value; setTimeUI(); }; $('doy').oninput = e => { doy = +e.target.value; setTimeUI(); };
$('run').onclick = () => { running = !running; $('run').classList.toggle('on', running); $('run').textContent = running ? '❚❚ stop the clock' : '▶ run the clock'; };
function solarHourFor(targetEl) {               // find the hour when the sun stands at a given elevation (rising or setting)
  let best = 12, bd = 1e9; const am = targetEl[1] === 'am'; for (let h = am ? 3 : 12; h < (am ? 12 : 23); h += 0.02) { hour = h; heav.setDate(dateOf()); heav.update(0, camera, orbit.target);
    const d = Math.abs(heav.state.sunEl - targetEl[0]); if (d < bd) { bd = d; best = h; } } return best; }
const PRESETS = {dawn: [-4, 'am'], sunrise: [1, 'am'], noon: null, golden: [7, 'pm'], sunset: [0.5, 'pm'], dusk: [-6, 'pm'], night: 'night'};
for (const [k, v] of Object.entries(PRESETS)) { const b = document.createElement('button'); b.textContent = k; b.onclick = () => { if (v === null) hour = 13.1; else if (v === 'night') hour = 23.2; else hour = solarHourFor(v); heav.setDate(dateOf()); setTimeUI(); }; $('presets').append(b); }
const WEATHERS = ['clear', 'cloudy', 'fog', 'rain', 'storm']; let weather = Q.get('weather') || 'clear';
for (const w of WEATHERS) { const b = document.createElement('button'); b.textContent = w; b.dataset.w = w; b.onclick = () => setWeather(w); $('weather').append(b); }
function setWeather(w) { weather = w; heav.setWeather(w); document.querySelectorAll('#weather button').forEach(b => b.classList.toggle('on', b.dataset.w === w)); }
for (const m of Object.keys(MODES)) { const b = document.createElement('button'); b.textContent = {orbit: 'orbit', walk: 'walk', fly: 'fly', street: 'drive the spines', poems: 'poem tour'}[m]; b.dataset.m = m; b.onclick = () => setMode(m); $('modes').append(b); }
const LNAMES = {labels: 'landmarks', districts: 'districts', wards: 'wards (voting)', shots: 'shots', words: 'worldtext', trees: 'trees', lamps: 'street life'};
for (const [k, v] of Object.entries(LAYERS)) { const l = document.createElement('label'); l.innerHTML = `<input type="checkbox" ${v ? 'checked' : ''}> ${LNAMES[k]}`; l.querySelector('input').onchange = e => { LAYERS[k] = e.target.checked; applyLayers(); }; $('layers').append(l); }
function applyLayers() { shotMesh.visible = LAYERS.shots; trees.visible = LAYERS.trees; street.visible = LAYERS.lamps; wardLabels.forEach(o => o.visible = LAYERS.wards); terrain.userData.paint(era, LAYERS.wards ? wards : null); }
ERA.forEach((n, i) => { const b = document.createElement('button'); b.innerHTML = `${i}<br>${n.replace(/^The /, '')}`; b.dataset.e = i; b.onclick = () => setEra(i); $('eras').append(b); });
$('era').oninput = e => setEra(+e.target.value);
let playing = null; $('play').onclick = () => { if (playing) { clearInterval(playing); playing = null; $('play').textContent = '▶ play history'; return; }
  let e = 0; setEra(0); $('play').textContent = '❚❚ stop'; playing = setInterval(() => { e++; if (e > 5) { clearInterval(playing); playing = null; $('play').textContent = '▶ play history'; return; } setEra(e); }, 5200); };
function setEra(e) {
  era = e; U.era.value = e; $('era').value = e; syncRange($('era'));
  document.querySelectorAll('#eras button').forEach(b => b.classList.toggle('on', +b.dataset.e === e));
  const fp = [...rising.footprints(vi), ...found.footprints(), ...icons.footprints(), ...heroes.footprints()]; icons.setEra(e); skit.setEra(e); names.setEra(e); blds.userData.setExtraClear(fp); rising.build(vi, e); found.setEra(e); heroes.setEra(e);
  detail.setEra(e, k => fp.some(([cx, cy, r, eb]) => eb <= e && Math.hypot(C.bld[k * 14] - cx, C.bld[k * 14 + 1] - cy) < r));
  const c = blds.userData.setEra(e); trees.userData.setEra(e); street.userData.setEra(e); setLandmarks(e); terrain.userData.paint(e, LAYERS.wards ? wards : null);
  $('lore').innerHTML = `<b>${e} · ${ERA[e]}.</b> ${meta.lore[e]}`;
  $('counts').textContent = `${c.standing.toLocaleString()} standing · ${c.ruins} ruins · ${LM.filter(l => lmState(l, e)).length} landmarks`;
  distLabels.forEach((o, i) => { const d = meta.districts[i], u = d.use ? d.use[e] : d.type; const nm = d.name.replace(/^the /, ''); o.element.innerHTML = nm + (u && !nm.startsWith(u) ? `<small>${u}</small>` : ''); });
  lmLabels.forEach((o, i) => { const st = lmState(LM[i], e); o.visible = !!st && LAYERS.labels; o.element.innerHTML = LM[i].name.split(' · ')[0].split(',')[0] + (st === 'ruin' ? '<small>ruin</small>' : st === 'reuse' ? `<small>now ${LM[i].era[2]}</small>` : ''); });
  if (infoK != null) showLandmark(infoK);
}

// ——— picking: touch a building, a landmark, a shot ———
const ray = new THREE.Raycaster(), mouse = new THREE.Vector2(); let infoK = null;
function pick(e) {
  if (e.target !== renderer.domElement) return;
  mouse.set(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1); ray.setFromCamera(mouse, camera);
  const tgt = [shotMesh, heroes.root, ...lmGroups.filter(g => !g.userData.heroed), ...icons.groups, ...rising.groups, ...found.placed, blds.userData.meshes.body, blds.userData.meshes.ruins].filter(o => o.visible);
  const h = ray.intersectObjects(tgt, true)[0]; if (!h) { $('info').style.display = 'none'; infoK = null; return; }
  if (h.object === shotMesh) return fitShot(h.instanceId);
  let o = h.object; while (o && !o.userData.lm && !o.userData.s && !o.userData.found && !o.userData.icon && !o.userData.hero) o = o.parent;
  if (o && o.userData.hero) { const hh = o.userData.hero; infoK = null; $('info').innerHTML = `<h3>${hh.name}</h3><div class="k">poem ${hh.poem} · ${hh.note}</div><div style="margin-top:6px"><a href="../heroes/index.html?h=${hh.id}" style="color:var(--acc2)">walk inside · see its proofs →</a></div>`; $('info').style.display = 'block'; return; }
  if (o && o.userData.icon) { rising.pulse(o.userData.icon.site.x, o.userData.icon.site.y); return showIcon(o.userData.icon); }
  if (o && o.userData.found) return showFound(o.userData); if (o && o.userData.s) { rising.pulse(o.userData.s.x, o.userData.s.y); return showStructure(o.userData.s); }
  if (o) { rising.pulse(o.userData.lm.x, o.userData.lm.y); return showLandmark(LM.indexOf(o.userData.lm)); }
  const mesh = h.object, key = mesh === blds.userData.meshes.body ? 'body' : 'ruins', k = blds.userData.owner[key][h.instanceId]; if (k != null) showBuilding(k, h.point);
}
function nearestDistrict(x, y) { return meta.districts.reduce((b, d) => { const dd = Math.hypot(d.x - x, d.y - y); return dd < b.d ? {d: dd, v: d} : b; }, {d: 1e9}).v; }
function wardAt(x, y) { const i = Math.round(x / meta.cell), j = Math.round(y / meta.cell), w = wards[j * meta.nx + i]; return w >= 0 ? wards.list[w] : null; }
function evid(cids) { return `<div class="ev">${cids.slice(0, 10).map(c => `<img src="${thumb(c)}" data-c="${c}" title="${c}" loading="lazy">`).join('')}</div>`; }
function wireEvid() { $('info').querySelectorAll('img[data-c]').forEach(im => im.onclick = () => { const i = SH.findIndex(s => s.cid === im.dataset.c); if (i >= 0) fitShot(i); }); }
function showBuilding(k, p) {
  const o = k * 14, B = C.bld, st = B[o + 6], born = B[o + 7], ruin = B[o + 8], reuse = B[o + 9], ah = B[o + 11], ab = B[o + 12];
  const d = nearestDistrict(B[o], B[o + 1]), w = wardAt(B[o], B[o + 1]), state = blds.userData.state(k, era);
  const life = [`built in <b>${ERA[born]}</b>`]; if (ah > 0) life.push(`an addition of ${ah.toFixed(1)} m in ${ERA[Math.min(ab, 5)]}`); if (ruin < 9) life.push(`ruined in the Fall`); if (ruin < 9 && reuse) life.push(reuse === 1 ? 'rebuilt in white and glass' : 'relit as a club');
  const near = SH.map((s, i) => [Math.hypot(s.x - B[o], s.y - B[o + 1]), s.cid]).sort((a, b) => a[0] - b[0]).slice(0, 6).map(a => a[1]);
  $('info').innerHTML = `<h3>${STYLES[st]} · ${B[o + 5].toFixed(0)} m</h3><div class="k">${state} · ${life.join(' · ')}</div>
    ${st === 1 ? '<div style="margin-top:4px"><a href="../heroes/index.html?h=rowhouse" style="color:var(--acc2)">walk into a rowhouse like this →</a></div>' : ''}
    <div class="k" style="margin-top:4px">${d ? d.name : ''}${w ? ` · ward ${w.ward}` : ''} — used now as <b style="color:var(--acc)">${d && d.use ? d.use[era] : d ? d.type : ''}</b></div>${evid(near)}`;
  $('info').style.display = 'block'; infoK = null; wireEvid();
}
const TNAME = {spire: 'spire', arcology: 'arcology', ring: 'halo', dish: 'listening dish', dome: 'dome', seawall: 'sea wall', vfarm: 'garden tower', platform: 'sea platform'};
function showIcon(ic) {
  infoK = null; const [b, r, as] = ic.era;
  $('info').innerHTML = `<h3>${ic.name}</h3><div class="k">raised in <b>${ERA[b]}</b>${r < 9 ? ` · ${as === 'kept drowned' ? 'sunk' : 'broken'} in ${ERA[r]}` : ''}${as && as !== 'kept drowned' ? ` · ${as} in Resurrection` : ''} · kept by <b style="color:var(--acc)">${ic.institution}</b></div>
    <p style="font:13px/1.5 Georgia,serif;color:#e9e0cc;margin:6px 0">${ic.lore}</p>
    <div class="k">witnessed by ${ic.witnesses.length} shots that look like it</div>${evid(ic.witnesses)}
    <div style="margin-top:6px"><a href="../gazetteer/index.html#${ic.id}" style="color:var(--acc2)">in the gazetteer →</a></div>`;
  $('info').style.display = 'block'; wireEvid();
}
function showFound(u) {
  const f = u.found; infoK = null; rising.pulse(u.x, u.y);
  $('info').innerHTML = `<h3>${f.name || 'found'} · ${f.read.kind.replace(/^an? /, '')}</h3><div class="k">${f.read.roof} · ${f.read.material} · ${f.read.state} · raised to ${u.h.toFixed(0)} m</div>
    <img src="../language/found/${f.id}.webp" style="max-width:100%;max-height:150px;margin-top:6px;border-radius:6px;background:#222" alt="">
    <div class="k" style="margin-top:4px">from our own <b style="color:var(--acc)">${f.src}</b> footage · ${Math.round(f.unique * 100)}% unlike anything in the real archive · our footage returns to this kind ${f.size}× · its face is the frame itself, its outline the extrusion</div>
    ${/NEW SINGLE/.test(f.name || '') ? '<div style="margin-top:6px"><a href="../heroes/index.html?h=marquee" style="color:var(--acc2)">walk into the NEW SINGLE →</a></div>' : ''}
    <div class="chips" style="margin-top:6px">${f.palette.map(c => `<span style="width:20px;height:14px;border-radius:3px;background:${c};display:inline-block"></span>`).join('')}</div>`;
  $('info').style.display = 'block';
}
function showStructure(s) {
  infoK = null; const dims = s.t === 'ring' ? `radius ${s.R.toFixed(0)} m, lifted ${s.lift.toFixed(0)} m on ${s.legs} legs` : s.t === 'seawall' ? `${s.L.toFixed(0)} m long, ${s.H.toFixed(0)} m high, ${s.gates} tide gates` : s.t === 'dome' ? `${(s.r * 2).toFixed(0)} m across, ${s.ribs} ribs` : `${(s.H || 0).toFixed(0)} m high, ${((s.r || 0) * 2).toFixed(0)} m wide`;
  const [b, r, as] = s.era;
  $('info').innerHTML = `<h3>${TNAME[s.t]} · ${RD.variants[vi].name}</h3><div class="k">${dims} · raised in <b>${ERA[b]}</b>${r < 9 ? ` · broken in ${ERA[r]} · ${as}` : ''}</div>
    <div class="k" style="margin-top:4px">called for by <b style="color:var(--acc)">${s.causes.length} shots</b> that read as a ${TNAME[s.t]} and look this way — it stands where it answers the most of them</div>
    <div class="k" style="margin-top:3px">lineage: ${s.muts.join(' → ') || 'founding'}</div>${evid(s.causes)}`;
  $('info').style.display = 'block'; wireEvid();
}
function showLandmark(i) {
  const lm = LM[i]; infoK = i; const st = lmState(lm, era), [b, r, as] = lm.era;
  const life = [`raised in <b>${ERA[b]}</b>`]; if (r < 9) life.push(`ruined in <b>${ERA[r]}</b>`); if (as) life.push(`reused in Resurrection as <b>${as}</b>`);
  const p = meta.poems.find(q => q.num === lm.poem);
  $('info').innerHTML = `<h3>${lm.name}</h3><div class="k">${st ? (st === 'intact' ? 'standing' : st === 'ruin' ? 'a ruin' : 'reused as ' + as) : 'not yet built'} · ${life.join(' · ')}</div>
    ${p ? `<div class="k">poem ${p.num} · ${p.title}</div>` : ''}<div class="k">${lm.evidence.length} shots read this structure</div>${evid(lm.evidence)}
    <div class="chips" style="margin-top:6px"><button id="lmgo">go there</button>${p ? '<button id="lmpoem">the poem</button>' : ''}</div>`;
  $('info').style.display = 'block'; wireEvid();
  const hero = {'tower block': 'severn', chapel: 'chapel', 'clock tower': 'clocktower', pier: 'cafe'}[lm.type];
  if (hero) $('info').insertAdjacentHTML('beforeend', `<div class="chips" style="margin-top:6px"><a href="../heroes/index.html?h=${hero}" style="color:var(--acc2)">walk inside the hero building →</a></div>`);
  $('lmgo').onclick = () => { setMode('orbit'); const R = Math.max(80, (lm.r || 30) * 3.2); goTo(new THREE.Vector3(lm.x + R, Math.max(lm.z, 0) + R * 0.45, lm.y + R * 0.6), new THREE.Vector3(lm.x, Math.max(lm.z, 0) + 15, lm.y)); };
  if (p) $('lmpoem').onclick = () => goPoem(p.num);
}

// ——— fit: stand where a shot was taken; lay the frame over the city ———
let fitI = null, fitList = [];
function fitShot(i, list) {
  const s = SH[i]; fitI = i; if (list) fitList = list; else if (!fitList.includes(i)) fitList = [i];
  if (ptour) { mode = 'fly'; orbit.enabled = false; } else setMode('fly'); const a = s.hd * Math.PI / 180, eye = new THREE.Vector3(s.x, s.z + 0.5, s.y), dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
  goTo(eye, eye.clone().addScaledVector(dir, 100), 1.4, () => { yaw = Math.atan2(-dir.x, -dir.z); pitch = 0; });
  const img = $('fit').querySelector('img'); img.src = thumb(s.cid); $('fit').style.display = 'block'; $('fitbar').style.display = 'flex';
  const r = s.read || {}; const rd = Object.entries(r).map(([k, v]) => `${k}: ${v[0]}`).join(' · ');
  $('fitcap').innerHTML = `<b>${s.cid}</b> · ${s.source} · poem ${s.poem || '—'} · read as <b>${s.el}</b><br><span style="color:var(--dim)">${rd}</span>`;
  texLoader.load(thumb(s.cid), t => { t.colorSpace = THREE.SRGBColorSpace; frame.material.map?.dispose(); frame.material.map = t; frame.material.needsUpdate = true;
    const asp = t.image.width / t.image.height; frame.scale.set(9 * asp, 9, 1); frame.position.copy(eye).addScaledVector(dir, 26); frame.position.y += 2; frame.lookAt(eye); frame.visible = true; });
}
$('fitop').oninput = e => { $('fit').querySelector('img').style.opacity = e.target.value; syncRange(e.target); }; syncRange($('fitop'));
$('fitx').onclick = () => { $('fit').style.display = 'none'; $('fitbar').style.display = 'none'; frame.visible = false; fitI = null; };
$('fitnext').onclick = () => { const k = fitList.indexOf(fitI); fitShot(fitList[(k + 1) % fitList.length], fitList); };
$('fitprev').onclick = () => { const k = fitList.indexOf(fitI); fitShot(fitList[(k - 1 + fitList.length) % fitList.length], fitList); };

// ——— the poems: the film plays (or lies over the city), the reading, the worldtext, the shots that see it ———
function goPoem(num) {
  const p = meta.poems.find(q => q.num === num); if (!p) return;
  const s = bestShot(num); const wl = meta.words.filter(w => w.poem === num);
  if (s) fitShot(SH.indexOf(s), SH.map((q, i) => q.poem === num ? i : -1).filter(i => i >= 0));
  else { setMode('orbit'); goTo(new THREE.Vector3(p.x + 160, S.ground(p.x, p.y) + 90, p.y + 160), new THREE.Vector3(p.x, S.ground(p.x, p.y), p.y)); }
  const F = $('film'); F.style.display = 'block';
  F.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><h3>${p.num} · ${p.title}</h3><button id="fx">×</button></div>
    <video id="fv" src="${p.film}" controls playsinline preload="metadata"></video>
    <div class="chips" style="margin:6px 0"><button id="fover">lay the film over the city</button>${p.reading ? '<button id="fread">▶ the reading</button>' : ''}</div>
    ${wl.map(w => `<div class="wt">“${w.t}”</div>`).join('')}<div style="color:var(--dim);font-size:11px">zone ${p.zone} · ${SH.filter(q => q.poem === num).length} shots stand here</div>`;
  $('fx').onclick = () => { F.style.display = 'none'; $('fv').pause(); $('filmovv').style.display = 'none'; $('filmovv').pause(); audio.pause(); };
  $('fover').onclick = () => { const v = $('filmovv'); if (v.style.display === 'block') { v.style.display = 'none'; v.pause(); return; } v.src = p.film; v.style.display = 'block'; v.play().catch(() => {}); };
  if (p.reading) $('fread').onclick = () => { audio.src = '../../' + p.reading; audio.play().catch(() => {}); };
}
const audio = new Audio();
meta.poems.forEach(p => { const b = document.createElement('button'); b.textContent = `${p.num} ${p.title}`; b.onclick = () => goPoem(p.num); $('poems').append(b); });
LM.forEach((lm, i) => { const b = document.createElement('button'); b.textContent = lm.name.split(' · ')[0].split(',')[0]; b.onclick = () => showLandmark(i); $('lms').append(b); });
if (RD) {
  RD.variants.forEach((v, i) => { const b = document.createElement('button'); b.textContent = v.name.replace('the ', ''); b.title = `${v.n} structures answer ${v.structures.reduce((a, s) => a + s.causes.length, 0)} shots · fitness ${v.fitness}`; b.dataset.v = i; b.onclick = () => { vi = i; syncVariant(); setEra(era); }; $('variants').append(b); });
  const nb = document.createElement('button'); nb.textContent = 'none'; nb.dataset.v = -1; nb.onclick = () => { vi = -1; syncVariant(); setEra(era); }; $('variants').append(nb);
  $('vver').textContent = `${RD.version} · ${RD.checksum} · ${RD.gens.toLocaleString()} generations · ${RD.calls} calls`;
}
function syncVariant() { document.querySelectorAll('#variants button').forEach(b => b.classList.toggle('on', +b.dataset.v === vi));
  const v = vi >= 0 ? RD.variants[vi] : null; $('vinfo').textContent = v ? `${v.n} structures · answer ${v.structures.reduce((a, s) => a + s.causes.length, 0)} of ${RD.calls} calls · appear in Resurrection (sea walls from the New Boroughs)` : 'the city without the evolved structures'; }
syncVariant();
$('resonate').onclick = () => { const t = orbit.enabled ? orbit.target : camera.position; rising.pulse(t.x, t.z); };
$('causes').onchange = e => rising.setCauses(e.target.checked);
setInterval(() => { if (U.night.value < 0.5) return; const res = icons.groups.find(g => g.userData.icon.kind === 'resonator' && g.visible);   // the Resonator sends the city's pulse
  if (res) rising.pulse(res.position.x, res.position.z); else if (rising.groups.length) { const g = rising.groups[(Math.random() * rising.groups.length) | 0]; rising.pulse(g.position.x, g.position.z); } }, 22000);
$('wards').innerHTML = wards.list.map(d => `<div><b style="color:hsl(${(d.ward - 1) * 0.137 % 1 * 360},65%,60%)">WARD ${d.ward}</b> · ${d.name.replace(/^the /, '')} — ${d.use ? d.use[5] : d.type}</div>`).join('');

// ——— the footage strip: the shots nearest you, facing your way ———
let stripKey = '';
function updateStrip() {
  const p = mode === 'orbit' ? orbit.target : camera.position, dir = camera.getWorldDirection(new THREE.Vector3());
  const R = mode === 'orbit' ? Math.max(350, camera.position.distanceTo(orbit.target) * 0.8) : 400;
  const c = []; SH.forEach((s, i) => { const d = Math.hypot(s.x - p.x, s.y - p.z); if (d > R) return; const a = s.hd * Math.PI / 180, face = Math.cos(a) * dir.x + Math.sin(a) * dir.z; c.push([d / R + (1 - face) * 0.4, i]); });
  c.sort((a, b) => a[0] - b[0]); const top = c.slice(0, 14).map(a => a[1]); const key = top.join(','); if (key === stripKey) return; stripKey = key;
  const dn = nearestDistrict(p.x, p.z), onSt = names.at(p.x, p.z);
  $('strip').innerHTML = `<div class="hd"><b>${onSt ? onSt.name : dn ? dn.name.replace(/^the /, '') : ''}</b>${onSt && dn ? `<span style="display:block;color:var(--dim)">${dn.name.replace(/^the /, '')}</span>` : ''}${top.length} shots here · facing ${['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(((Math.atan2(dir.x, -dir.z) * 180 / Math.PI) + 360) % 360 / 45) % 8]}</div>` +
    top.map(i => `<div class="shot" data-i="${i}"><img src="${thumb(SH[i].cid)}" loading="lazy" alt=""><span>${SH[i].cid} · ${SH[i].el}</span></div>`).join('');
  $('strip').querySelectorAll('.shot').forEach(d => d.onclick = () => fitShot(+d.dataset.i, top));
}

// ——— the loop ———
$('toggle').onclick = () => $('panel').classList.toggle('hide'); if (MOBILE) $('panel').classList.add('hide');
setTimeUI(); setWeather(weather); setMode('orbit'); setEra(era); applyLayers();
['era'].forEach(id => syncRange($(id)));
step(100, ''); $('loading').style.display = 'none';
// labels: near first, poems before landmarks before districts; a label that would overlap one already placed waits
let declT = 0; const PV = new THREE.Vector3();
function declutter() {
  const cp = camera.position, cand = [];
  const push = (o, pri, maxD, minD = 0) => { const d = cp.distanceTo(o.position); if (d > maxD || d < minD) { o.visible = false; return; } cand.push([pri + d / 20000, o]); };
  poemLabels.forEach(o => LAYERS.labels ? push(o, 0, 9000) : o.visible = false);
  lmLabels.forEach((o, i) => lmState(LM[i], era) && LAYERS.labels ? push(o, 1, mode === 'orbit' ? 4000 : 1600) : o.visible = false);
  iconLabels.forEach((o, i) => icons.groups[i]?.visible && LAYERS.labels ? push(o, 0.5, 9000) : o.visible = false);
  distLabels.forEach(o => LAYERS.districts ? push(o, 2, 7000, 400) : o.visible = false);
  wardLabels.forEach(o => LAYERS.wards ? push(o, 3, 9000) : o.visible = false);
  cand.sort((a, b) => a[0] - b[0]); const placed = [];
  for (const [, o] of cand) { PV.copy(o.position).project(camera); if (PV.z > 1) { o.visible = false; continue; }
    const x = (PV.x + 1) / 2 * innerWidth, y = (1 - PV.y) / 2 * innerHeight, w = Math.min(220, o.element.textContent.length * 6.2) / 2 + 4, h = o.element.querySelector('small') ? 15 : 9;
    if (placed.some(r => Math.abs(r[0] - x) < r[2] + w && Math.abs(r[1] - y) < r[3] + h)) { o.visible = false; continue; }
    placed.push([x, y, w, h]); o.visible = true; if (placed.length > 40) { o.visible = false; } }
}
const perf = {t: 0, n: 0}; function setPR(p) { renderer.setPixelRatio(p); renderer.setSize(innerWidth, innerHeight); composer?.setPixelRatio?.(p); composer?.setSize(innerWidth, innerHeight); }
const clock = new THREE.Clock(); let stripT = 0, clockMin = -1;
const V3 = new THREE.Vector3(), fwd = new THREE.Vector3(), right = new THREE.Vector3();
function frameLoop() {
  const dt = Math.min(clock.getDelta(), 0.1); U.time.value += dt;
  if (running) { hour += dt * +$('speed').value / 3600; if (hour >= 24) { hour -= 24; doy = doy % 365 + 1; } setTimeUI(); }
  heav.setDate(dateOf());
  const focus = mode === 'orbit' ? orbit.target : camera.position;
  heav.update(dt, camera, focus); sea.update(dt);
  const night = heav.state.night; U.night.value = THREE.MathUtils.smoothstep(night, 0.15, 0.7);
  U.wet.value += ((weather === 'rain' || weather === 'storm' ? 1 : 0) - U.wet.value) * dt * 0.3;
  for (const k of NIGHTLIT) mats[k].emissiveIntensity = mats[k].userData.base * (0.08 + 0.92 * U.night.value);
  const tide = heav.state.tide, flooding = Math.cos(2 * Math.PI * (dateOf().getTime() / 36e5) / 12.42) > 0;
  $('tide').textContent = `tide ${tide >= 0 ? '+' : ''}${tide.toFixed(2)} m ${flooding ? "↑" : "↓"}`; $('tideO').textContent = `${tide >= 0 ? '+' : ''}${tide.toFixed(2)} m · ${flooding ? "flooding" : "ebbing"} · semidiurnal 12.42 h`;
  const mi = Math.floor(hour * 60); if (mi !== clockMin) { clockMin = mi; tickClocks({getHours: () => Math.floor(hour), getMinutes: () => Math.floor((hour % 1) * 60)}); }
  // animated pieces in the landmarks
  for (const g of lmGroups) g.traverse(o => { if (o.userData.beam) { o.parent.visible && (o.rotation.y += dt * 0.9); o.visible = U.night.value > 0.2; o.material.opacity = 0.1 * U.night.value; }
    if (o.userData.smoke !== undefined) { o.position.y += dt * 4; o.scale.addScalar(dt * 0.25); if (o.position.y > 120) { o.position.y = 80; o.scale.setScalar(1); } }
    if (o.userData.flicker) o.material.emissiveIntensity = (Math.sin(U.time.value * 17) > -0.7 ? 1.6 : 0.2) * (0.2 + U.night.value);
    if (o.material?.userData?.nightlit) o.material.emissiveIntensity = (o.material.userData.nightlit === true ? 1.6 : 1.2) * (0.12 + 0.88 * U.night.value); });
  // movement
  if (flyTo) { flyTo.k = Math.min(1, flyTo.k + dt / flyTo.dur); const e = flyTo.k < 0.5 ? 2 * flyTo.k * flyTo.k : 1 - Math.pow(-2 * flyTo.k + 2, 2) / 2;
    camera.position.lerpVectors(flyTo.p0, flyTo.p1, e); V3.lerpVectors(flyTo.t0, flyTo.t1, e);
    if (orbit.enabled) { orbit.target.copy(V3); } else camera.lookAt(V3);
    if (flyTo.k >= 1) { const t = flyTo.then; flyTo = null; t && t(); } }
  else if (mode === 'walk' || mode === 'fly') {
    const run = keys.shift ? 4 : 1, sp = (mode === 'walk' ? 6 : 90) * run * dt;
    fwd.set(-Math.sin(yaw), 0, -Math.cos(yaw)); right.set(Math.cos(yaw), 0, -Math.sin(yaw));
    let f = (keys.w || keys.arrowup ? 1 : 0) - (keys.s || keys.arrowdown ? 1 : 0), r = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0);
    if (joy) { f = -joy.y; r = joy.x; }
    camera.position.addScaledVector(fwd, f * sp).addScaledVector(right, r * sp);
    if (mode === 'fly') { if (pitch && f) camera.position.y += Math.sin(pitch) * f * sp; camera.position.y += ((keys.e ? 1 : 0) - (keys.q ? 1 : 0)) * sp; camera.position.y = Math.max(camera.position.y, Math.max(S.ground(camera.position.x, camera.position.z), heav.state.tide) + 1.6); }
    else camera.position.y = Math.max(S.ground(camera.position.x, camera.position.z), heav.state.tide + 0.2) + 1.7;
    camera.rotation.set(pitch, yaw, 0, 'YXZ');
  } else if (tour && tour.kind === 'street') {
    const P = tour.pts; let L = P[tour.i].distanceTo(P[tour.i + 1]);
    tour.f += dt * 14;                                       // metres along the current segment (14 m/s, a slow camera car)
    while (tour.f > L) { tour.f -= L; tour.i++; if (tour.i >= P.length - 1) tour.i = 0; L = P[tour.i].distanceTo(P[tour.i + 1]);
      if (L > 120) { tour.f = 0; tour.i = (tour.i + 1) % (P.length - 1); L = P[tour.i].distanceTo(P[tour.i + 1]); } }   // a jump between spines is a cut
    camera.position.lerpVectors(P[tour.i], P[tour.i + 1], L ? tour.f / L : 0); camera.position.y = Math.max(S.ground(camera.position.x, camera.position.z), 0.4) + 2.4;
    const c = P[Math.min(tour.i + 3, P.length - 1)]; V3.set(c.x, Math.max(S.ground(c.x, c.z), 0.4) + 2.4, c.z);
    if (V3.distanceTo(camera.position) > 2) camera.lookAt(V3);
  }
  if (ptour) { ptour.t += dt; if (ptour.t > 9) { ptour.t = 0; ptour.k = (ptour.k + 1) % meta.poems.length; goPoem(meta.poems[ptour.k].num); } }
  rising.update(dt, U.time.value); icons.update(dt, U.time.value); skit.update(dateOf());
  // only where you are: the lived-in layer streams in a ring around the focus, and the resolution follows the frame rate
  const fz = mode === 'orbit' ? orbit.target : camera.position; detail.visible = LAYERS.lamps && camera.position.y - Math.max(S.ground(camera.position.x, camera.position.z), 0) < 700; detail.update(fz); if (detail.visible !== false) names.update(fz.x, fz.z);
  perf.t += dt; perf.n++; if (perf.t > 2) { const ms = perf.t / perf.n * 1000; const pr = renderer.getPixelRatio(), max = Math.min(devicePixelRatio, MOBILE ? 1.5 : 2);
    if (ms > 30 && pr > 1) setPR(Math.max(1, pr - 0.25)); else if (ms < 17 && pr < max) setPR(Math.min(max, pr + 0.25)); perf.t = 0; perf.n = 0; }
  if (mode === 'orbit') orbit.update();
  // label culling
  const cp = camera.position;
  declT -= dt; if (declT < 0) { declT = 0.2; declutter(); }
  words.forEach(s => { const d = cp.distanceTo(s.position); s.visible = LAYERS.words && d < 420 && d > 30; s.material.opacity = THREE.MathUtils.clamp((420 - d) / 200, 0, 1); });
  stripT -= dt; if (stripT < 0) { stripT = 0.5; updateStrip(); }
  if (composer) composer.render(); else renderer.render(scene, camera);
  labels.render(scene, camera);
  requestAnimationFrame(frameLoop);
}
requestAnimationFrame(frameLoop);
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); labels.setSize(innerWidth, innerHeight); composer?.setSize(innerWidth, innerHeight); });
window.__city = {names, heroes, skit, icons, found, detail, rising, scene, camera, orbit, setEra, setWeather, goPoem, fitShot, heav, setMode, get hour() { return hour; }, set hour(v) { hour = v; setTimeUI(); }, C};
