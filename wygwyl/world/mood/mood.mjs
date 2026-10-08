// MOOD CITY — Atlantis as only its hero places, standing in black water, each in its own light. Moving between them, the
// world's colour becomes the colour of the place you are nearest. No ground, no generic blocks, no pictures stuck on walls.
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {Reflector} from 'three/addons/objects/Reflector.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {PLACES, MOODS, soft, loadLibrary} from './places.mjs';
import {makeFolds} from './folds.mjs';

const $ = id => document.getElementById(id), pad = n => String(n).padStart(3, '0');
const MOBILE = matchMedia('(pointer: coarse)').matches || innerWidth < 720;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const state = s => { document.body.dataset.state = s; };
const fail = msg => { state('fault'); $('fault').textContent = msg; };

let renderer;
try { renderer = new THREE.WebGLRenderer({canvas: $('gl'), antialias: !MOBILE, powerPreference: 'high-performance'}); }
catch (e) { fail('This browser could not start WebGL, so the places cannot be drawn. The scene book has every place as pictures: ../districts/'); throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio, MOBILE ? 1.25 : 1.75)); renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(0x000000, 0.003); scene.background = new THREE.Color(0x000000);
const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.3, 6000);
const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = false; controls.rotateSpeed = 0.5;   /* no inertia: a shot stays where it was put */
controls.maxPolarAngle = Math.PI * 0.9; controls.minDistance = 4; controls.maxDistance = 2600;   /* hero shots may look up at the spire and the moon */
const hemi = new THREE.HemisphereLight(0xffffff, 0x000000, 0.3); scene.add(hemi);

// the water: everything stands in it (a real mirror on a desktop, a dark gloss on a phone)
if (!MOBILE) { const w = new Reflector(new THREE.PlaneGeometry(9000, 9000), {textureWidth: innerWidth * 0.6 | 0, textureHeight: innerHeight * 0.6 | 0, color: 0x50565e, clipBias: 0.003});
  w.rotation.x = -Math.PI / 2; scene.add(w);
  const film = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), new THREE.MeshBasicMaterial({color: 0x000000, transparent: true, opacity: 0.38, depthWrite: false}));
  film.rotation.x = -Math.PI / 2; film.position.y = 0.02; scene.add(film); }
else { const w = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), new THREE.MeshStandardMaterial({color: 0x05070a, roughness: 0.12, metalness: 0.9})); w.rotation.x = -Math.PI / 2; scene.add(w); }

// stars over everything (faint; the field's sky is dense)
{ const p = []; for (let i = 0; i < 2500; i++) { const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = 4200; const s = Math.sqrt(1 - u * u); if (u < 0.05) continue; p.push(new THREE.Vector3(r * s * Math.cos(a), r * u, r * s * Math.sin(a))); }
  const st = new THREE.Points(new THREE.BufferGeometry().setFromPoints(p), new THREE.PointsMaterial({color: 0xbfd0ff, size: 1.6, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.55}));
  st.layers.set(1); camera.layers.enable(1); scene.add(st); }                                                  // layer 1: the water does not reflect the stars

const composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), 0.9, 0.55, 0.78); composer.addPass(bloom); composer.addPass(new OutputPass());

// ——— the places ———
state('loading');
await loadLibrary('../language/').catch(e => console.warn('material library unavailable; the places stay untextured', e));
const S = await fetch('../districts/scenes.json').then(r => r.json()).catch(() => null);
const D = S ? Object.fromEntries(S.districts.map(d => [d.id, d])) : {};
const title = n => (S?.script.find(c => c.num === n) || {}).title || '';
const ticks = [], pools = [];
// spread the archipelago so each place keeps its own light (the authored positions are a compressed plan)
for (const P of PLACES) P.at = [60 + (P.at[0] - 60) * 1.7, -60 + (P.at[1] + 60) * 1.7];
for (const P of PLACES) {
  const g = new THREE.Group(); g.position.set(P.at[0], 0, P.at[1]); scene.add(g); P.group = g;
  try { const tk = P.build(g); if (tk) ticks.push(tk); } catch (e) { console.error(P.id, e); P.broken = true; }
  P.color = D[P.district]?.color || '#888'; P.light = '#' + new THREE.Color(MOODS[P.district].amb).getHexString();   // the chip colour, and the colour of its light
  const shot = P.shot; P.cam = {p: new THREE.Vector3(...shot.p).add(g.position), t: new THREE.Vector3(...shot.t).add(g.position), fov: shot.fov};
  // a faint pool of the district's light on the water around each place: the mood seen from afar
  const pool = new THREE.Sprite(new THREE.SpriteMaterial({map: soft(), color: new THREE.Color(P.light), transparent: true, opacity: P.district === 'black' ? 0 : ['temple', 'plaza', 'cenotaph'].includes(P.district) ? 0.08 : 0.2, depthWrite: false, blending: THREE.AdditiveBlending, fog: false}));
  pool.position.set(P.at[0], 6, P.at[1]); pool.scale.set(260, 60, 1); pool.userData.o = pool.material.opacity; scene.add(pool); pools.push(pool);
}
// the transitions between poems, as lines of small lights on the water from one place to the next
const placeOf = {haze: 'catwalk', hive: 'needles', overseer: 'moon', bay: 'atrium', ascent: 'field', plaza: 'gate', naraka: 'market', ankhu: 'spire', commons: 'dish', arcade: 'canopy', cenotaph: 'viaduct', temple: 'temple', black: 'door'};
// the folds: every reference stood up as a walk-in pop-up in its place (?mode=sets | folds | both)
const MODE = new URLSearchParams(location.search).get('mode') || 'sets';            // the folds stretch the photos off their standpoint: an experiment, not the default
const FOLDS = S && MODE !== 'sets' ? await makeFolds(scene, PLACES, placeOf, Object.fromEntries(S.views.map(v => [v.n, v.d])), './').catch(e => { console.warn('folds unavailable', e); return null; }) : null;
if (MODE === 'folds') for (const P of PLACES) P.group.visible = false;
const byId = Object.fromEntries(PLACES.map(p => [p.id, p]));
const paths = [];
for (const t of S?.transitions || []) {
  const A = byId[placeOf[t.a]], B = byId[placeOf[t.b]]; if (!A || !B || A === B) continue;
  const a = new THREE.Vector3(A.at[0], 0.6, A.at[1]), b = new THREE.Vector3(B.at[0], 0.6, B.at[1]), m = a.clone().lerp(b, 0.5); m.y = t.mode === 'fall' || t.mode === 'fly' || t.mode === 'dissolve' ? 40 : 1.5;
  const curve = new THREE.QuadraticBezierCurve3(a, m, b), n = Math.max(20, a.distanceTo(b) / 6 | 0), pts = curve.getSpacedPoints(n);
  const geo = new THREE.BufferGeometry().setFromPoints(pts), cols = new Float32Array(pts.length * 3), ca = new THREE.Color(A.light), cb = new THREE.Color(B.light);
  pts.forEach((_, i) => { const c = ca.clone().lerp(cb, i / pts.length); cols.set([c.r, c.g, c.b], i * 3); }); geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  const pm = new THREE.PointsMaterial({size: 1.6, map: soft(), vertexColors: true, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false});
  const p = new THREE.Points(geo, pm); scene.add(p); paths.push({p, t, n: pts.length, A, B});
}

// ——— mood: the world takes the colour of the places you are near ———
const cBg = new THREE.Color(), cFog = new THREE.Color(), cAmb = new THREE.Color(), tmp = new THREE.Color();
function mood() {
  const q = controls.target; let W = 0; cBg.setRGB(0, 0, 0); cFog.setRGB(0, 0, 0); cAmb.setRGB(0, 0, 0); let den = 0, bl = 0, ai = 0, best = null, bd = 1e9;
  for (const P of PLACES) { const d = Math.hypot(P.at[0] - q.x, P.at[1] - q.z); const w = Math.exp(-d / 90) + 1e-6; W += w; const M = MOODS[P.district];
    cBg.add(tmp.set(M.bg).multiplyScalar(w)); cFog.add(tmp.set(M.fog).multiplyScalar(w)); cAmb.add(tmp.set(M.amb).multiplyScalar(w)); den += M.density * w; bl += M.bloom * w; ai += M.ambI * w;
    if (d < bd) { bd = d; best = P; } }
  cBg.multiplyScalar(1 / W); cFog.multiplyScalar(1 / W); cAmb.multiplyScalar(1 / W);
  scene.background.copy(cBg); scene.fog.color.copy(cFog);
  const far = THREE.MathUtils.smoothstep(camera.position.y, 120, 1100);                 // from high up the fog thins so the whole archipelago shows
  scene.fog.density = (den / W) * (1 - 0.85 * far); for (const p of pools) { p.material.opacity = p.userData.o * (1 + 2.5 * far); p.scale.set(260 + 300 * far, 60 + 260 * far, 1); } hemi.color.copy(cAmb); hemi.intensity = ai / W; bloom.strength = bl / W;
  return {best, bd};
}

// ——— the interface: only what is true now ———
const strip = $('strip');
strip.innerHTML = PLACES.map((P, i) => `<button class="pl" data-i="${i}" aria-label="${P.name}" style="--c:${P.color}"><img src="../districts/t/${pad(P.views[0])}.webp" alt=""><span>${P.name}</span></button>`).join('');
strip.onclick = e => { const b = e.target.closest('.pl'); if (b) { stopTour(); go(+b.dataset.i); } };
let cur = -1, fly = null;
function go(i, dur = REDUCED ? 0 : 3.2) {
  cur = (i + PLACES.length) % PLACES.length; const P = PLACES[cur];
  fly = {t0: performance.now() / 1000, dur, p0: camera.position.clone(), t0v: controls.target.clone(), f0: camera.fov, P};
  [...strip.children].forEach((b, k) => b.setAttribute('aria-current', k === cur ? 'true' : 'false'));
  strip.children[cur]?.scrollIntoView({block: 'nearest', inline: 'center', behavior: REDUCED ? 'auto' : 'smooth'});
  card(P); if (cmpOn) setCompare(true);
}
function card(P) {
  const d = D[P.district];
  $('card').innerHTML = `<div class="k" style="color:${P.color}">${d ? d.name : ''}${d && d.realm !== 'X' ? ' · ' + (S.realms.find(r => r.id === d.realm)?.name.split(' —')[0] || '') : ''}</div><h2>${P.name}</h2><p>${P.line}</p>
    <p class="m">${d ? d.mood + ' · ' + d.hour : ''}</p><p class="m">poems ${P.poems.map(n => `${n} ${title(n)}`).join(' · ')}</p>
    <div class="refs">${P.views.map(n => `<img src="../districts/t/${pad(n)}.webp" alt="reference ${n}" title="reference ${n}" data-v="${n}">`).join('')}</div>`;
}
// compare: the place's reference over the frame, to judge the set against it
let cmpOn = false, cmpView = null;
function setCompare(on, v) { cmpOn = on; const P = PLACES[cur]; if (!P) return; cmpView = v || (cmpView && P.views.includes(cmpView) ? cmpView : P.views[0]);
  $('cmp').style.display = on ? 'block' : 'none'; $('cmpimg').src = on ? `../districts/v/${pad(cmpView)}.webp` : ''; $('bCmp').setAttribute('aria-pressed', on); }
$('bCmp').onclick = () => { if (cur < 0) go(0); setCompare(!cmpOn); };
$('cmpo').oninput = e => { $('cmpimg').style.opacity = e.target.value; };
$('card').onclick = e => { const im = e.target.closest('img[data-v]'); if (im) setCompare(true, +im.dataset.v); };
// the tour: the poems in order, place to place along their transitions
const TOUR = [['catwalk', '01'], ['moon', '02'], ['temple', '03'], ['viaduct', '04'], ['field', '05'], ['gate', '06'], ['market', '07'], ['spire', '08'], ['canopy', '09'], ['viaduct', '10'], ['temple', '11'], ['temple', '12'], ['atrium', '13'], ['catwalk', '14'], ['door', '14']];
let tour = null;
function stopTour() { if (!tour) return; clearTimeout(tour.h); tour = null; $('bTour').textContent = '▶ walk the poems'; $('bTour').setAttribute('aria-pressed', 'false'); $('cap').textContent = ''; }
function tourStep() { if (!tour) return; const [id, n] = TOUR[tour.k]; go(PLACES.findIndex(p => p.id === id)); $('cap').textContent = `${n} · ${title(n)}`; tour.k++;
  if (tour.k >= TOUR.length) { tour.h = setTimeout(stopTour, 9000); return; } tour.h = setTimeout(tourStep, 9000); }
$('bTour').onclick = () => { if (tour) return stopTour(); setCompare(false); tour = {k: 0}; $('bTour').textContent = '■ stop'; $('bTour').setAttribute('aria-pressed', 'true'); tourStep(); };
$('bAll').onclick = () => { stopTour(); setCompare(false); cur = -1; $('card').innerHTML = intro;
  fly = {t0: performance.now() / 1000, dur: REDUCED ? 0 : 3, p0: camera.position.clone(), t0v: controls.target.clone(), f0: camera.fov, P: {cam: {p: new THREE.Vector3(60, 1150, 1350), t: new THREE.Vector3(60, 0, -60), fov: 42}}}; };
addEventListener('keydown', e => { if (e.key === 'Escape') { if (cmpOn) setCompare(false); else stopTour(); } else if (e.key === 'ArrowRight') { stopTour(); go(cur + 1); } else if (e.key === 'ArrowLeft') { stopTour(); go(cur - 1); } });
renderer.domElement.addEventListener('pointerdown', () => { if (fly) fly = null; stopTour(); });
const intro = $('card').innerHTML;
{ const NEXT = {both: 'sets', sets: 'folds', folds: 'both'}, NAME = {both: 'sets + folds', sets: 'sets only', folds: 'folds only'};
  $('bMode').textContent = 'showing ' + NAME[MODE] + ' ↻'; $('bMode').onclick = () => { const q = new URLSearchParams(location.search); q.set('mode', NEXT[MODE]); location.search = q; }; }

// the mood map: coloured fields where the places are, the transitions between them, where you are
const mc = $('map'), mx = mc.getContext('2d');
const B = {x0: Math.min(...PLACES.map(p => p.at[0])) - 140, x1: Math.max(...PLACES.map(p => p.at[0])) + 140, z0: Math.min(...PLACES.map(p => p.at[1])) - 120, z1: Math.max(...PLACES.map(p => p.at[1])) + 120}, MX = x => (x - B.x0) / (B.x1 - B.x0) * mc.width, MZ = z => (z - B.z0) / (B.z1 - B.z0) * mc.height;
function drawMap() {
  mx.globalCompositeOperation = 'source-over'; mx.fillStyle = '#05060a'; mx.fillRect(0, 0, mc.width, mc.height); mx.globalCompositeOperation = 'lighter';
  for (const P of PLACES) { if (P.district === 'black') continue; const x = MX(P.at[0]), y = MZ(P.at[1]), g = mx.createRadialGradient(x, y, 0, x, y, 60);
    g.addColorStop(0, P.light + 'ff'); g.addColorStop(0.4, P.light + '88'); g.addColorStop(1, P.light + '00'); mx.fillStyle = g; mx.fillRect(x - 60, y - 60, 120, 120); }
  mx.globalCompositeOperation = 'source-over'; mx.setLineDash([2, 4]); mx.lineWidth = 1;
  for (const p of paths) { mx.strokeStyle = 'rgba(255,255,255,.35)'; mx.beginPath(); mx.moveTo(MX(p.A.at[0]), MZ(p.A.at[1])); mx.lineTo(MX(p.B.at[0]), MZ(p.B.at[1])); mx.stroke(); } mx.setLineDash([]);
  PLACES.forEach((P, i) => { mx.fillStyle = i === cur ? '#fff' : P.district === 'black' ? '#444' : P.color; mx.beginPath(); mx.arc(MX(P.at[0]), MZ(P.at[1]), i === cur ? 5 : 3.2, 0, 7); mx.fill(); });
  const q = controls.target; mx.strokeStyle = '#fff'; mx.lineWidth = 1.5; mx.beginPath(); mx.arc(MX(q.x), MZ(q.z), 9, 0, 7); mx.stroke();
}
mc.onclick = e => { const b = mc.getBoundingClientRect(), x = (e.clientX - b.left) / b.width * mc.width, y = (e.clientY - b.top) / b.height * mc.height; let bi = 0, bd = 1e9;
  PLACES.forEach((P, i) => { const d = (MX(P.at[0]) - x) ** 2 + (MZ(P.at[1]) - y) ** 2; if (d < bd) { bd = d; bi = i; } }); stopTour(); go(bi); };

// ——— run ———
camera.position.set(60, 1150, 1350); controls.target.set(60, 0, -60); camera.lookAt(controls.target);
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight); });
const ease = u => u < .5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2;
const clock = new THREE.Clock(); let lastMap = 0;
state('ready');
if (new URLSearchParams(location.search).get('p')) { const i = PLACES.findIndex(p => p.id === new URLSearchParams(location.search).get('p')); if (i >= 0) go(i, 0); }
renderer.setAnimationLoop(() => {
  const t = clock.getElapsedTime();
  if (fly) { const u = fly.dur ? Math.min(1, (performance.now() / 1000 - fly.t0) / fly.dur) : 1, k = ease(u), c = fly.P.cam;
    // go up and over between places that are far apart, then come down into the hero shot
    const lift = Math.sin(Math.PI * k) * Math.min(260, fly.p0.distanceTo(c.p) * 0.35);
    camera.position.lerpVectors(fly.p0, c.p, k).y += lift; controls.target.lerpVectors(fly.t0v, c.t, k); camera.fov = fly.f0 + (c.fov - fly.f0) * k; camera.updateProjectionMatrix();
    if (u >= 1) fly = null; }
  controls.update(); if (camera.position.y < 0.6) camera.position.y = 0.6;          // never under the water
  for (const tk of ticks) tk(t);
  for (const p of paths) p.p.material.opacity = 0.35 + 0.25 * Math.sin(t * 1.2 + p.n);
  const m = mood();
  $('where').textContent = m.bd < 160 ? (D[m.best.district]?.name || '') : 'between places';
  composer.render();
  if (t - lastMap > 0.25) { drawMap(); lastMap = t; }
});
window.__mood = {camera, controls, scene, go, PLACES, get cur() { return cur; }};
// the frustum search's hook (mood/tools/ → districts/tools/frustum-run.mjs): render a list of cameras and hand back the frames.
// Only with ?harness=1: the interface is hidden and the animation loop stops, so each frame is exactly the camera asked for.
if (new URLSearchParams(location.search).get('harness')) {
  document.body.classList.add('harness'); renderer.setAnimationLoop(null);
  const placeOfView = {}; for (const P of PLACES) for (const n of P.views) placeOfView[n] = placeOfView[n] || P.id;
  window.__mood.stations = FOLDS ? FOLDS.stations.map(({mesh, ...s}) => s) : [];
  window.__mood.places = PLACES.map(P => ({id: P.id, district: P.district, at: P.at, views: P.views, cam: {p: P.cam.p.toArray(), t: P.cam.t.toArray(), fov: P.cam.fov}}));
  window.__mood.render = (cams, q = 0.85) => cams.map(c => {
    camera.position.set(...c.p); controls.target.set(...c.t); camera.fov = c.fov; camera.updateProjectionMatrix(); camera.lookAt(controls.target);
    for (const tk of ticks) tk(10); mood(); composer.render(); return renderer.domElement.toDataURL('image/jpeg', q); });
  (FOLDS ? FOLDS.ready() : Promise.resolve()).then(() => { window.__moodReady = true; });
}
