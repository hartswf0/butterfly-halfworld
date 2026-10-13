// THE HERO PLACES — only what the most distinctive references show, built as sets that stand in the water, each in its own light.
// No generic city: CLIP reads 1 of the 100 views (and 6% of the canon) as a building seen from outside; the rest is light, haze,
// water, streets, rooms and skylines, so the world is made of those. Each place answers named views of the scene book
// (../districts/), carries its district's mood, and has a hero shot composed like its reference.
import * as THREE from 'three';

// ——— surfaces: the material library cut from the archive's own frames (../language/library.*), the same 44 surfaces the
// generic city wears, mapped triplanar in world metres so any shape (box, column, arch, lathe) takes brick, rust or marble at true scale
const LIB = {tex: null, idx: {}, cols: 8, rows: 11};
export async function loadLibrary(base = '../language/') {
  const L = await fetch(base + 'library.json').then(r => r.json()); LIB.cols = L.cols; LIB.rows = L.rows; for (const m of L.materials) LIB.idx[m.name] = m.base;
  LIB.tex = await new THREE.TextureLoader().loadAsync(base + 'library.webp'); LIB.tex.colorSpace = THREE.SRGBColorSpace; LIB.tex.anisotropy = 8;
}
function skin(m, name, metres = 3, variant = 0, k = 1) {
  if (!LIB.tex || LIB.idx[name] == null) return m; const i = LIB.idx[name] + variant, col = i % LIB.cols, row = Math.floor(i / LIB.cols);
  const U = {uLib: {value: LIB.tex}, uTile: {value: new THREE.Vector4(col / LIB.cols, 1 - (row + 1) / LIB.rows, 1 / LIB.cols, 1 / LIB.rows)}, uScale: {value: 1 / metres}, uK: {value: k}};
  m.onBeforeCompile = sh => { Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; varying vec3 vWN;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz; vWN = normalize(mat3(modelMatrix) * objectNormal);');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      uniform sampler2D uLib; uniform vec4 uTile; uniform float uScale, uK; varying vec3 vWP; varying vec3 vWN;
      vec3 tileAt(vec2 p) { vec2 f = fract(p) * .96 + .02; return textureGrad(uLib, uTile.xy + f * uTile.zw, dFdx(p) * uTile.zw, dFdy(p) * uTile.zw).rgb; }`)
      .replace('#include <map_fragment>', `#include <map_fragment>
      { vec3 w = pow(abs(normalize(vWN)), vec3(4.)); w /= (w.x + w.y + w.z); vec3 q = vWP * uScale;
        vec3 t = tileAt(q.zy) * w.x + tileAt(q.xz) * w.y + tileAt(q.xy) * w.z;
        diffuseColor.rgb *= mix(vec3(1.), t * 1.7, uK); }`); };
  m.customProgramCacheKey = () => 'skin'; return m;
}
const C = c => new THREE.Color(c);
export const mat = (c, o = {}) => skin(new THREE.MeshStandardMaterial({color: c, roughness: o.r ?? 0.85, metalness: o.m ?? 0, emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1,
  emissiveMap: o.em || null, map: o.map || null, transparent: !!o.t, opacity: o.o ?? 1, side: o.side ?? THREE.FrontSide, depthWrite: o.dw ?? true}), o.s, o.ts ?? 3, o.sv ?? 0, o.sk ?? 1);
export const glow = (c, i = 1.6, o = {}) => new THREE.MeshBasicMaterial({color: C(c).multiplyScalar(i), toneMapped: false, transparent: !!o.t, opacity: o.o ?? 1, side: o.side ?? THREE.FrontSide,
  blending: o.add ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: !o.add});
function put(g, geo, m, x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); g.add(o); return o; }
const box = (g, w, h, d, m, x, y, z, ry = 0) => put(g, new THREE.BoxGeometry(w, h, d), m, x, y + h / 2, z, ry);
const cyl = (g, r0, r1, h, m, x, y, z, seg = 16) => put(g, new THREE.CylinderGeometry(r0, r1, h, seg), m, x, y + h / 2, z);
function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = Math.imul(s ^ (s >>> 15), 2246822507) ^ Math.imul(s ^ (s >>> 13), 3266489909), (s ^= s >>> 16) >>> 0) / 4294967296); }
// lit windows: a canvas grid, some cells lit in the district's colours
export function windows(cols, rows, lit, density, seed, dark = '#05070b') {
  const cv = document.createElement('canvas'); cv.width = cols * 8; cv.height = rows * 8; const x = cv.getContext('2d'), R = rng(seed);
  x.fillStyle = dark; x.fillRect(0, 0, cv.width, cv.height);
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) if (R() < density) { x.fillStyle = lit[Math.floor(R() * lit.length)]; x.globalAlpha = 0.5 + R() * 0.5; x.fillRect(i * 8 + 1, j * 8 + 2, 6, 5); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; return t;
}
// corrugated steel: vertical ribs, light and dark
let RIB = null;
function corrugated() { if (RIB) return RIB; const cv = document.createElement('canvas'); cv.width = 64; cv.height = 4; const x = cv.getContext('2d');
  for (let i = 0; i < 64; i++) { const v = 150 + 90 * Math.sin(i / 64 * Math.PI * 16); x.fillStyle = `rgb(${v},${v},${v})`; x.fillRect(i, 0, 1, 4); }
  RIB = new THREE.CanvasTexture(cv); RIB.wrapS = RIB.wrapT = THREE.RepeatWrapping; RIB.repeat.set(3, 1); return RIB; }
let SOFT = null;
export function soft() { if (SOFT) return SOFT; const cv = document.createElement('canvas'); cv.width = cv.height = 128; const x = cv.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  SOFT = new THREE.CanvasTexture(cv); return SOFT; }
// haze: big soft sprites in the district's colour, drifting
function haze(g, n, c, spread, h, size, opacity, seed) { const R = rng(seed), m = new THREE.SpriteMaterial({map: soft(), color: c, transparent: true, opacity, depthWrite: false, fog: true});
  const list = []; for (let i = 0; i < n; i++) { const s = new THREE.Sprite(m); s.position.set((R() - .5) * spread, R() * h, (R() - .5) * spread); const k = size * (0.6 + R() * 0.8); s.scale.set(k, k * 0.6, 1); s.userData.v = (R() - .5) * 0.6; g.add(s); list.push(s); }
  return list; }
// points of light (string lights, lanterns, stars in a pool, the parade)
function dots(g, pts, c, size, add = true) { const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const p = new THREE.Points(geo, new THREE.PointsMaterial({color: C(c).multiplyScalar(2), size, map: soft(), transparent: true, depthWrite: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending, toneMapped: false}));
  g.add(p); return p; }
function catenary(a, b, sag, n) { const out = []; for (let i = 0; i <= n; i++) { const u = i / n; out.push(new THREE.Vector3().lerpVectors(a, b, u).add(new THREE.Vector3(0, -sag * 4 * u * (1 - u), 0))); } return out; }
function stairs(g, n, w, rise, run, m, x, y, z, ry = 0) { const s = new THREE.Group(); s.position.set(x, y, z); s.rotation.y = ry; for (let i = 0; i < n; i++) box(s, w, rise, run, m, 0, i * rise, -i * run); g.add(s); return s; }
function archGeo(w, h, span, rise, depth) { const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.lineTo(-w / 2, 0);
  const hole = new THREE.Path(); const leg = h - rise - 1.5; hole.moveTo(-span / 2, 0); hole.lineTo(-span / 2, leg); hole.absarc(0, leg, span / 2, Math.PI, 0, true); hole.lineTo(span / 2, 0); hole.lineTo(-span / 2, 0); s.holes.push(hole);
  return new THREE.ExtrudeGeometry(s, {depth, bevelEnabled: false}); }

// ——— the places ———
// each: {id, district, name, at:[x,z], views, poems, shot:{p,t,fov}, build(g, T) → tick(t)} — world units are metres; y is up; the water is y = 0
export const PLACES = [
  {id: 'catwalk', district: 'haze', name: 'The Orange Catwalk and the Severn', at: [-420, -150], views: [84, 85, 66, 1, 81], poems: ['01', '13', '14'],
    line: 'a lone figure on a lit catwalk over nothing; the tower he reads in, its spiral escape in the light well',
    shot: {p: [-60, 9, 62], t: [8, 8, -20], fov: 42},
    build(g) {
      const con = mat(0x8a6a58, {r: 0.9, s: 'concrete', ts: 4}), brick = mat(0x9a7a6a, {r: 0.95, s: 'soot brick', ts: 2.5}), iron = mat(0x6a4a3a, {r: 0.6, m: 0.5, s: 'rust', ts: 2});
      // the expressway deck on its columns, the undercroft beneath
      box(g, 180, 3, 22, con, 0, 14, -40); for (let i = -80; i <= 80; i += 16) { cyl(g, 1.4, 1.6, 14, con, i, 0, -32); cyl(g, 1.4, 1.6, 14, con, i, 0, -48); }
      for (let i = -76; i <= 76; i += 32) { const l = new THREE.PointLight(0xff7a1a, 300, 60, 1.6); l.position.set(i, 11, -40); g.add(l); }
      // the catwalk: a curving path at 8 m with its glowing kerb, ending in a platform over the water
      const path = new THREE.CatmullRomCurve3([[-70, 8, 30], [-30, 8, 12], [10, 8, 4], [40, 8, -6], [62, 8, -2]].map(p => new THREE.Vector3(...p)));
      const N = 60; for (let i = 0; i < N; i++) { const u = i / N, p = path.getPointAt(u), t = path.getTangentAt(u), a = Math.atan2(t.x, t.z);
        const s = box(g, 3, 0.4, 2.2, con, p.x, p.y, p.z, a); if (i % 6 === 0) cyl(g, 0.35, 0.35, 8, con, p.x, 0, p.z); }
      put(g, new THREE.TubeGeometry(path, 160, 0.12, 6), glow(0xffa040, 1.8)).position.set(1.4, 0.45, 0);
      put(g, new THREE.TubeGeometry(path, 160, 0.12, 6), glow(0xffa040, 1.8)).position.set(-1.4, 0.45, 0);
      box(g, 8, 0.5, 6, con, 66, 7.9, -2); box(g, 8, 1.1, 0.1, iron, 66, 8.4, 1);
      const fig = new THREE.Group(); box(fig, 0.5, 1.75, 0.3, mat(0x080404), 0, 0, 0); fig.position.set(68, 8.4, 0); g.add(fig);
      // the Severn: a brick tower, its light well and the spiral escape with planters
      const T = new THREE.Group(); T.position.set(-40, 0, -8); g.add(T);
      box(T, 18, 46, 14, mat(0xa08070, {s: 'red brick', ts: 2.5, em: windows(18, 40, ['#ffb070', '#ff8a4a', '#ffd0a0'], 0.18, 11), e: 0xffffff, ei: 0.8, r: 0.9}), 0, 0, 0);
      for (let i = 0; i < 40; i++) { const a = i * 0.5, y = i * 1.1; box(T, 2.4, 0.15, 1.1, iron, 9 + 2.2 * Math.cos(a), y, 2.2 * Math.sin(a), -a);
        if (i % 7 === 3) put(T, new THREE.SphereGeometry(0.7, 8, 6), mat(0x2f4a1c), 9 + 2.6 * Math.cos(a), y + 0.7, 2.6 * Math.sin(a)); }
      cyl(T, 0.12, 0.12, 44, iron, 9, 0, 0);
      const hz = haze(g, 46, 0xff7a20, 220, 30, 70, 0.10, 3);
      return t => hz.forEach((s, i) => { s.position.x += s.userData.v * 0.04; if (s.position.x > 110) s.position.x = -110; if (s.position.x < -110) s.position.x = 110; });
    }},
  {id: 'needles', district: 'hive', name: 'The Needle Field', at: [-640, -330], views: [12, 70, 46, 48, 38], poems: ['01', '14'],
    line: 'seen, never entered: indigo spires with signal lattices, the skyline in his window',
    shot: {p: [230, 22, 210], t: [0, 80, 0], fov: 40},
    build(g) {
      const R = rng(7), beacons = [];
      for (let i = 0; i < 46; i++) { const h = 50 + R() * 110, w = 5 + R() * 7, x = (R() - .5) * 200, z = (R() - .5) * 160;
        const em = windows(8, Math.round(h / 2.5), ['#4a7dff', '#9fc6ff', '#2a4ab0'], 0.2 + R() * 0.2, 100 + i);
        box(g, w, h, w, mat(0x3a4058, {em, e: 0xffffff, ei: 1.0, r: 0.4, m: 0.3, s: 'concrete', ts: 6, sv: 1}), x, 0, z);
        put(g, new THREE.ConeGeometry(w * 0.55, h * 0.35, 4), mat(0x0a0f22, {r: 0.4, m: 0.4}), x, h + h * 0.175, z, Math.PI / 4);
        const b = put(g, new THREE.SphereGeometry(0.9, 8, 6), glow(0xff2a2a, 3), x, h * 1.36, z); b.userData.ph = R() * 6; beacons.push(b); }
      return t => beacons.forEach(b => { b.visible = Math.sin(t * 2.2 + b.userData.ph) > 0.2; });
    }},
  {id: 'moon', district: 'overseer', name: 'The Moon Canyon and the Child’s Window', at: [-560, -520], views: [88, 86, 87, 25], poems: ['02'],
    line: 'two slabs and the moon exactly between them; below, one warm window over the curb',
    shot: {p: [0, 3, 120], t: [0, 60, -40], fov: 50},
    build(g) {
      const slab = h => mat(0x2a3a5a, {s: 'block', ts: 5, sv: 1, em: windows(26, Math.round(h / 2.2), ['#7fb0ff', '#c8dcff', '#3060c0'], 0.38, h | 0), e: 0xffffff, ei: 0.9, r: 0.35, m: 0.4});
      box(g, 30, 140, 22, slab(140), -26, 0, -20); box(g, 30, 140, 22, slab(141), 26, 0, -20);
      for (let y = 20; y < 130; y += 18) put(g, new THREE.CylinderGeometry(0.9, 0.9, 22, 10), mat(0x0d3a8a, {r: 0.3, m: 0.7}), 0, y, -8, 0, 0, Math.PI / 2);
      const moon = put(g, new THREE.SphereGeometry(9, 32, 24), glow(0xdfe9ff, 2.2), 0, 160, -300); moon.userData.moon = true;
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({map: soft(), color: 0x6f9cff, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending})); halo.position.copy(moon.position); halo.scale.set(110, 110, 1); g.add(halo);
      const L = new THREE.DirectionalLight(0x9cc4ff, 1.4); L.position.set(0, 160, -300); L.target.position.set(0, 0, 40); g.add(L, L.target);
      // the child's house at the foot of the canyon: brick, the stoop, one warm ground-floor window
      const H = new THREE.Group(); H.position.set(-6, 0, 50); g.add(H);
      box(H, 6, 7, 9, mat(0x8a6a60, {r: 0.95, s: 'red brick', ts: 2.5}), 0, 0, 0); put(H, new THREE.PlaneGeometry(1.8, 1.4), glow(0xffb060, 2.4), 0, 2.2, 4.51);
      box(H, 1.6, 0.9, 1.4, mat(0xd0d0d0, {s: 'marble', ts: 1.5}), 1.9, 0, 5.2);
      const pl = new THREE.PointLight(0xffa050, 20, 20, 2); pl.position.set(0, 2.2, 7); H.add(pl);
      // the car at the curb, its headlights sweeping
      const car = new THREE.Group(); car.position.set(8, 0, 58); g.add(car); box(car, 4.2, 1.3, 1.8, mat(0x101010, {r: 0.3, m: 0.6}), 0, 0.3, 0);
      const hl = new THREE.SpotLight(0xfff2d0, 2600, 60, 0.35, 0.6, 1.5); hl.position.set(-2.2, 1, 0); car.add(hl, hl.target);
      return t => { hl.target.position.set(-20, 2 + Math.sin(t * 0.9) * 2, -6 + Math.sin(t * 0.6) * 14); };
    }},
  {id: 'atrium', district: 'bay', name: 'The Drowned Atrium and the Sleep-Dam', at: [-300, 90], views: [53, 54, 57, 58, 75], poems: ['13', '03'],
    line: 'a lobby that stayed flooded: the floor glowing under the water, trees in the planters, the wall that holds the bay back',
    shot: {p: [0, 3.2, 46], t: [0, 4, -10], fov: 50},
    build(g) {
      const steel = mat(0x5a7a70, {r: 0.4, m: 0.5, s: 'verdigris', ts: 2}), con = mat(0x8a9090, {r: 0.95, s: 'concrete', ts: 4, sv: 1});
      // the glass hall's frame (no walls: the glass is the water's reflection)
      for (let x = -30; x <= 30; x += 10) for (let z = -30; z <= 10; z += 10) cyl(g, 0.45, 0.45, 22, steel, x, -2, z, 8);
      for (let z = -30; z <= 10; z += 10) box(g, 62, 0.6, 0.6, steel, 0, 20, z); for (let x = -30; x <= 30; x += 10) box(g, 0.6, 0.6, 42, steel, x, 20, -10);
      // the floor glowing a metre and a half under the water
      const tiles = windows(32, 22, ['#36f0d8', '#1aa0b0', '#8affe8'], 0.55, 53, '#04201f'); tiles.magFilter = THREE.LinearFilter;
      const fl = put(g, new THREE.PlaneGeometry(64, 44), new THREE.MeshBasicMaterial({map: tiles, color: C(0xffffff).multiplyScalar(1.1), toneMapped: false}), 0, 0.06, -10, 0, -Math.PI / 2);
      put(g, new THREE.PlaneGeometry(64, 44), new THREE.MeshStandardMaterial({color: 0x0a3a3a, roughness: 0.05, metalness: 0.6, transparent: true, opacity: 0.55, depthWrite: false}), 0, 0.5, -10, 0, -Math.PI / 2);
      const R = rng(5); for (let i = 0; i < 9; i++) { const x = (R() - .5) * 50, z = -30 + R() * 38;
        box(g, 4, 1.2, 4, con, x, -0.4, z); cyl(g, 0.25, 0.35, 5, mat(0x2a1c10), x, 0.8, z, 6);
        put(g, new THREE.IcosahedronGeometry(2.2, 0), mat(0x0f2a18, {r: 0.9}), x, 6.5, z); dots(g, Array.from({length: 18}, () => new THREE.Vector3(x + (R() - .5) * 5, 5 + R() * 4, z + (R() - .5) * 5)), 0xc8ffd8, 0.9); }
      const pl = new THREE.PointLight(0x40e0d0, 160, 70, 1.4); pl.position.set(0, 2, -10); g.add(pl);
      // the sleep-dam wall behind, a lit gate through it, salt graffiti
      box(g, 140, 16, 5, con, 0, -1, -60); put(g, new THREE.PlaneGeometry(8, 9), glow(0x9ff0ff, 1.3), 30, 4.5, -57.4);
      put(g, new THREE.PlaneGeometry(26, 2.2), glow(0xe8f4f0, 0.9), -24, 9, -57.4);
      const hz = haze(g, 24, 0x2a8a8a, 140, 14, 40, 0.07, 9);
      return t => { fl.material.color.setScalar(0.9 + 0.2 * Math.sin(t * 0.6)); };
    }},
  {id: 'field', district: 'ascent', name: 'The Night Field and the Parade', at: [330, 290], views: [71, 68, 78], poems: ['04', '05'],
    line: 'red soil under the moon where he finds his hands; the ancestors’ vault of light along the avenue',
    shot: {p: [-58, 2.4, 40], t: [10, 10, -10], fov: 46},
    build(g) {
      put(g, new THREE.CircleGeometry(90, 64), mat(0x9a3020, {r: 1, e: 0x2a0402, ei: 0.4, s: 'sand', ts: 6, sv: 1}), 0, 0.15, 0, 0, -Math.PI / 2);
      for (let i = -60; i <= 60; i += 4) box(g, 3.6, 0.2, 5, mat(0xa09080, {r: 0.9, s: 'granite', ts: 2, sv: 1}), i, 0.15, 0);       // the avenue's stones
      cyl(g, 0.6, 1.4, 18, mat(0xd8d0c0, {r: 0.7, s: 'cantera', ts: 3}), 30, 0, -14, 4);                                       // the obelisk
      cyl(g, 0.4, 0.6, 6, mat(0x1a1008), -20, 0, 18, 6); put(g, new THREE.IcosahedronGeometry(4, 1), mat(0x0a1810), -20, 8, 18);
      // the parade's vault: arches of held lights over the avenue
      const pts = [], R = rng(3);
      for (let k = -50; k <= 50; k += 6) for (let i = 0; i <= 24; i++) { const a = Math.PI * i / 24; pts.push(new THREE.Vector3(k + (R() - .5), 1.5 + Math.sin(a) * 16, Math.cos(a) * 12)); }
      const vault = dots(g, pts, 0xffc890, 1.4);
      const gifts = dots(g, Array.from({length: 160}, () => new THREE.Vector3((R() - .5) * 100, 1.2 + R() * 1.4, (R() - .5) * 8)), 0x9fd8ff, 0.9);
      // blue blossoms at the edge
      dots(g, Array.from({length: 500}, () => { const a = R() * Math.PI * 2, r = 70 + R() * 18; return new THREE.Vector3(Math.cos(a) * r, 0.5 + R() * 1.2, Math.sin(a) * r); }), 0x4a7dff, 1.1);
      return t => { vault.material.opacity = 0.75 + 0.25 * Math.sin(t * 0.8); gifts.position.y = Math.sin(t * 0.5) * 0.3; };
    }},
  {id: 'gate', district: 'plaza', name: 'The Light Gate and the Perimeter', at: [450, 150], views: [89, 90, 33, 34], poems: ['05', '06'],
    line: 'a hundred-metre ring of white ceramic across the avenue; the fence of light before it; the round plaza behind',
    shot: {p: [0, 3, 130], t: [0, 30, 0], fov: 48},
    build(g) {
      const cer = mat(0xb8b4ac, {r: 0.55, e: 0xfff6e8, ei: 0.015, s: 'ceramic', ts: 6});
      const ring = put(g, new THREE.TorusGeometry(50, 4.2, 24, 160), cer, 0, 52, 0);
      const seam = (a0, a1) => put(g, new THREE.TorusGeometry(50, 4.35, 8, 40, a1 - a0), glow(0x5fe8ff, 3), 0, 52, 0, 0, 0, a0);
      seam(Math.PI * 0.47, Math.PI * 0.53); seam(Math.PI * 1.47, Math.PI * 1.53);
      // the Perimeter: a fence of light along an arc in front of the ring
      const fp = []; for (let i = -70; i <= 70; i += 1.2) for (let y = 0; y <= 5; y += 0.6) fp.push(new THREE.Vector3(i, y, 60 + (i * i) / 260));
      dots(g, fp, 0x58e6ff, 0.5);
      for (let i = -70; i <= 70; i += 14) { cyl(g, 0.12, 0.12, 6, mat(0x223338), i, 0, 60 + (i * i) / 260, 6); }
      // the round plaza behind: rose terraces stepping down to a white floor
      for (let k = 0; k < 6; k++) { const r0 = 40 - k * 5; put(g, new THREE.CylinderGeometry(r0, r0, 1, 64, 1, true), mat(0xe0a0a8, {r: 0.8, side: THREE.DoubleSide, s: 'terracotta', ts: 3}), 0, 2.5 - k * 0.5, -80); }
      put(g, new THREE.CircleGeometry(14, 48), mat(0xf2ece0, {e: 0xfff4e0, ei: 0.3, s: 'marble', ts: 4}), 0, 0.2, -80, 0, -Math.PI / 2);
      const crowd = []; const R = rng(4); for (let i = 0; i < 700; i++) { const a = R() * Math.PI * 2, r = 16 + R() * 22; crowd.push(new THREE.Vector3(Math.cos(a) * r, 1.6 + R() * 0.4, -80 + Math.sin(a) * r)); }
      dots(g, crowd, 0xffd0a0, 0.7);
      const pl = new THREE.PointLight(0x9fdcff, 300, 120, 1.6); pl.position.set(0, 20, 40); g.add(pl);
      return t => { ring.material.emissiveIntensity = 0.015 + 0.02 * Math.max(0, Math.sin(t * 0.4)); };
    }},
  {id: 'market', district: 'naraka', name: 'The Container Rows and the Shadow-Pool', at: [610, 30], views: [19, 20, 92, 93, 45, 96], poems: ['06', '07'],
    line: 'containers stacked into shops and rooms under string lights; the flooded underpass where children stand in the reflection',
    shot: {p: [1.5, 1.7, 4], t: [-1, 4.5, -40], fov: 60},
    build(g) {
      const pal = [0x1f6f78, 0x2a8a8a, 0x8a2f4a, 0x3a4a5a, 0x6a3a2a, 0x1a5a6a], R = rng(19);
      const geo = new THREE.BoxGeometry(12, 2.6, 2.44), lit = [];
      for (const side of [-1, 1]) for (let i = 0; i < 9; i++) for (let k = 0; k < 1 + Math.floor(R() * 4); k++) {
        const m = mat(pal[Math.floor(R() * pal.length)], {r: 0.5, m: 0.3, s: 'corrugated', ts: 2.5, e: pal[Math.floor(R() * pal.length)], ei: 0.18});
        const o = put(g, geo, m, side * 9, 1.3 + k * 2.6, -60 + i * 6.2 + (R() - .5), Math.PI / 2);
        if (R() < 0.55) { const w = put(g, new THREE.PlaneGeometry(2.2, 1.6), glow(R() < .5 ? 0xffb0c8 : 0xa0f0e8, 0.35 + R() * 0.35), side * 9 - side * 1.25, 1.3 + k * 2.6, -60 + i * 6.2, side > 0 ? -Math.PI / 2 : Math.PI / 2); lit.push(w); } }
      put(g, new THREE.PlaneGeometry(18, 90), mat(0x34363c, {r: 0.6, m: 0.0, s: 'wet asphalt', ts: 3, t: true, o: 0.7}), 0, 0.04, -30, 0, -Math.PI / 2);   // the street: wet asphalt, the mirror under it
      // string lights over the street
      const R2 = rng(2); for (let i = 0; i < 10; i++) { const z = -56 + i * 6; dots(g, catenary(new THREE.Vector3(-8, 9 + R2() * 3, z), new THREE.Vector3(8, 9 + R2() * 3, z + (R2() - .5) * 6), 1.8, 26), i % 2 ? 0xffd890 : 0xff9ad0, 0.8); }
      const pa = new THREE.PointLight(0xff5aa0, 70, 50, 1.4); pa.position.set(0, 7, -15); const pb = new THREE.PointLight(0x40e0e8, 70, 50, 1.4); pb.position.set(0, 7, -45); g.add(pa, pb);
      for (let i = 0; i < 12; i++) { const side = i % 2 ? 1 : -1; put(g, new THREE.PlaneGeometry(0.3 + R() * 3, 0.5 + R() * 2), glow([0xff3a8a, 0x2ae8ff, 0xffc04a][i % 3], 1.3), side * 7.7, 3 + R() * 6, -55 + i * 4.6, side > 0 ? -Math.PI / 2 : Math.PI / 2); }
      // the underpass shadow-pool at the end of the row: a concrete tube, ankle-deep water, the market's light at the far end
      const U = new THREE.Group(); U.position.set(0, 0, -78); g.add(U); const con = mat(0x8a8c8c, {r: 0.95, s: 'concrete', ts: 4});
      box(U, 18, 1, 30, con, 0, 6, -10); box(U, 1, 6.5, 30, con, -9, 0, -10); box(U, 1, 6.5, 30, con, 9, 0, -10);
      put(U, new THREE.PlaneGeometry(14, 6), glow(0xbfefff, 1.1), 0, 3, -25);
      for (let i = 0; i < 5; i++) box(U, 0.4, 1.3, 0.3, mat(0x050505), -4 + i * 2, 0, -8 + (i % 2) * 3);
      // the teahouse's vapour
      const hz = haze(g, 14, 0x38a8d8, 24, 8, 12, 0.06, 21); hz.forEach(s => s.position.add(new THREE.Vector3(5, 0, -48)));             // the teahouse's vapour, down the row
      return t => { lit.forEach((w, i) => { if (i % 9 === 0) w.material.color.setScalar(1.2 + Math.sin(t * 7 + i) * 0.6); }); };
    }},
  {id: 'spire', district: 'ankhu', name: 'The Spire, its Shaft and the Sky Platforms', at: [770, -230], views: [82, 83, 11, 28, 31, 73], poems: ['07', '08'],
    line: 'a hundred-storey shaft lit red, the way up from the House; mushroom-stem platforms in the cloud, gardens and a club on the crowns',
    shot: {p: [-90, 40, 110], t: [0, 90, 0], fov: 50},
    build(g) {
      const stem = mat(0x5a6688, {r: 0.4, m: 0.4, s: 'concrete', ts: 5, sv: 1}), deck = mat(0x6a7090, {r: 0.6, s: 'tile', ts: 3});
      // the shaft: an open square frame 160 m tall, red inside
      const S = new THREE.Group(); g.add(S);
      for (const [x, z] of [[-6, -6], [6, -6], [-6, 6], [6, 6]]) box(S, 1.2, 160, 1.2, mat(0x5a2a2a, {r: 0.5, m: 0.5, s: 'rust', ts: 2}), x, 0, z);
      for (let y = 0; y < 160; y += 4) { box(S, 13, 0.4, 0.4, mat(0x5a2a2a, {s: 'rust', ts: 2}), 0, y, -6); box(S, 13, 0.4, 0.4, mat(0x5a2a2a, {s: 'rust', ts: 2}), 0, y, 6); box(S, 0.4, 0.4, 13, mat(0x5a2a2a, {s: 'rust', ts: 2}), -6, y, 0); box(S, 0.4, 0.4, 13, mat(0x5a2a2a, {s: 'rust', ts: 2}), 6, y, 0); }
      const red = put(S, new THREE.BoxGeometry(9, 160, 9), glow(0xff1818, 1.6, {t: true, o: 0.35}), 0, 80, 0);
      const cage = box(S, 3, 3.2, 3, glow(0xff6040, 2.4), 0, 20, 0);
      const pl = new THREE.PointLight(0xff2020, 600, 90, 1.4); pl.position.set(0, 70, 0); S.add(pl);
      // the platforms on mushroom stems, violet underlit, gardens on top
      const R = rng(8), plats = [];
      for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2 + R(), r = 40 + R() * 60, x = Math.cos(a) * r, z = Math.sin(a) * r, h = 60 + R() * 90, w = 10 + R() * 12;
        cyl(g, 1.6, 2.6, h, stem, x, 0, z, 12);
        put(g, new THREE.CylinderGeometry(w, w * 0.35, 5, 32), deck, x, h + 2.5, z);
        put(g, new THREE.CircleGeometry(w * 0.9, 32), glow(0xa060ff, 1.5), x, h - 0.05, z, 0, Math.PI / 2);
        const gl = new THREE.PointLight(0x9a5aff, 220, 60, 1.6); gl.position.set(x, h - 6, z); g.add(gl);
        for (let k = 0; k < 4; k++) put(g, new THREE.IcosahedronGeometry(1.6 + R() * 1.6, 1), mat(0x1e3a22), x + (R() - .5) * w, h + 6, z + (R() - .5) * w);
        dots(g, Array.from({length: 30}, () => new THREE.Vector3(x + (R() - .5) * w * 1.6, h + 5.5, z + (R() - .5) * w * 1.6)), 0xffd8a0, 0.8);
        plats.push({x, h, z}); }
      // the rooftop club: the highest crown, its laser and its bridge to the shaft
      const top = plats.reduce((a, b) => (b.h > a.h ? b : a));
      const laser = put(g, new THREE.CylinderGeometry(0.15, 0.15, 160, 6), glow(0xff40ff, 3, {t: true, o: 0.7}), top.x, top.h + 6, top.z, 0, 0, Math.PI / 2.4);
      put(g, new THREE.BoxGeometry(Math.hypot(top.x, top.z), 0.6, 2), deck, top.x / 2, top.h + 5, top.z / 2, -Math.atan2(top.z, top.x));
      const hz = haze(g, 40, 0x4a5aa8, 260, 60, 80, 0.06, 13);                                            // the cloud under the platforms
      return t => { cage.position.y = 20 + (Math.sin(t * 0.15) * 0.5 + 0.5) * 130; laser.rotation.y = t * 0.6; };
    }},
  {id: 'dish', district: 'commons', name: 'The Dish and the Sunken Forum', at: [700, -60], views: [14, 15, 16, 21], poems: ['06', '10'],
    line: 'where the city listens: a radio dish turning over the square, the forum’s lit lip, children running under it',
    shot: {p: [38, 4, 46], t: [0, 10, -6], fov: 50},
    build(g) {
      put(g, new THREE.CircleGeometry(60, 64), mat(0x4a5a6a, {r: 0.25, m: 0.2, s: 'wet asphalt', ts: 4}), 0, 0.12, 0, 0, -Math.PI / 2);
      for (let k = 0; k < 6; k++) put(g, new THREE.TorusGeometry(16 - k * 2, 0.5, 6, 64), mat(0xd8dcdc, {s: 'concrete', ts: 3, sv: 1}), 14, 0.4 - k * 0.5, 10, 0, Math.PI / 2);
      put(g, new THREE.TorusGeometry(16.4, 0.14, 6, 96), glow(0xfff0c8, 1.6), 14, 0.65, 10, 0, Math.PI / 2);
      const crowd = [], R = rng(6); for (let i = 0; i < 260; i++) { const a = R() * Math.PI * 2, r = 17 + R() * 4; crowd.push(new THREE.Vector3(14 + Math.cos(a) * r, 1.3, 10 + Math.sin(a) * r)); } dots(g, crowd, 0xffc890, 0.6);
      // the dish: a parabola on a yoke, turning at the gate
      const D = new THREE.Group(); D.position.set(-14, 0, -14); g.add(D); cyl(D, 2, 3, 8, mat(0xa8b0b8, {s: 'concrete', ts: 3, sv: 1}), 0, 0, 0);
      const Y = new THREE.Group(); Y.position.y = 10; D.add(Y);
      const pts = []; for (let i = 0; i <= 20; i++) { const r = i / 20 * 13; pts.push(new THREE.Vector2(r, r * r / 30)); }
      const dish = put(Y, new THREE.LatheGeometry(pts, 48), mat(0xa8b0b8, {r: 0.5, m: 0.3, side: THREE.DoubleSide, e: 0x6a8ac8, ei: 0.12}), 0, 0, 0, 0, -0.8);
      put(Y, new THREE.CylinderGeometry(0.2, 0.2, 9, 6), mat(0xa8b0b8, {s: 'concrete', ts: 3, sv: 1}), 0, 4, 2.6, 0, -0.8);
      const pl = new THREE.PointLight(0x7ab8ff, 260, 50, 1.6); pl.position.set(20, 8, 20); g.add(pl);
      return t => { Y.rotation.y = Math.sin(t * 0.1) * 1.2; };
    }},
  {id: 'canopy', district: 'arcade', name: 'The LED Canopy and the Booth', at: [560, -140], views: [94, 95, 100, 62, 6], poems: ['09', '10'],
    line: 'a vault of moving colour over the avenue, rain on everything; at its end the phone booth on its curb, and the bike',
    shot: {p: [3, 1.7, 66], t: [0, 9, -30], fov: 58},
    build(g) {
      const vault = new THREE.ShaderMaterial({uniforms: {t: {value: 0}}, side: THREE.BackSide, toneMapped: false,
        vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: `uniform float t; varying vec2 vU;
          float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
          void main(){ vec2 p = vU * vec2(14., 3.); float a = n(p + vec2(t * .15, 0.)) * .6 + n(p * 2.3 - vec2(0., t * .2)) * .4;
            vec3 c = mix(vec3(.15, .2, .9), vec3(1., .25, .6), smoothstep(.3, .7, a)); c = mix(c, vec3(1., .75, .3), smoothstep(.7, .95, n(p * 4. + t * .1)));
            float px = step(.12, fract(vU.x * 260.)) * step(.12, fract(vU.y * 60.)); gl_FragColor = vec4(c * (.75 + .45 * a) * (.5 + .5 * px), 1.); }`});
      const v = put(g, new THREE.CylinderGeometry(22, 22, 120, 48, 1, true, -Math.PI / 2, Math.PI), vault, 0, 0, -20);
      v.rotation.set(-Math.PI / 2, 0, 0); v.position.set(0, 12, -20); v.scale.set(1, 1, 0.55);                // a low vault resting on the shopfronts
      const R = rng(12); for (const s of [-1, 1]) for (let i = 0; i < 10; i++) { const h = 12 + R() * 2; box(g, 8, h, 10, mat(0x5a4a50, {r: 0.7, s: 'peeling paint', ts: 3, em: windows(14, 18, ['#ffb070', '#ff5a8a', '#6a9aff'], 0.35, 300 + i * 2 + s), e: 0xffffff, ei: 0.6}), s * 26, 0, -75 + i * 12);
        put(g, new THREE.PlaneGeometry(6, 0.5), glow([0xff3a5a, 0x3a7aff, 0xff7ad0][i % 3], 2.2), s * 21.9, 3 + R() * 3, -75 + i * 12, -s * Math.PI / 2); }
      dots(g, Array.from({length: 900}, () => new THREE.Vector3((R() - .5) * 36, 1.5 + R() * 0.3, -78 + R() * 110)), 0xffd8b8, 0.45, false);              // the crowd under the canopy
      put(g, new THREE.PlaneGeometry(44, 130), mat(0x34363c, {r: 0.6, m: 0.0, s: 'wet asphalt', ts: 3, t: true, o: 0.7}), 0, 0.04, -20, 0, -Math.PI / 2);   // the street: wet asphalt, the mirror under it
      const pa = new THREE.PointLight(0xff4aa0, 120, 60, 1.4); pa.position.set(0, 10, -10); const pb = new THREE.PointLight(0x4a7aff, 120, 60, 1.4); pb.position.set(0, 10, -50); g.add(pa, pb);
      // the booth on its curb, the suitcases, the bike
      box(g, 1.2, 2.4, 1.2, glow(0xf0f6ff, 0.9, {t: true, o: 0.8}), 7, 0, 54); box(g, 0.7, 0.5, 0.3, mat(0x3a2418), 5.6, 0, 54.5); box(g, 0.6, 0.45, 0.3, mat(0x1a2a3a), 5.6, 0, 55.2);
      box(g, 2.1, 0.8, 0.5, mat(0x0a0a0a, {r: 0.3, m: 0.8}), 9.5, 0.2, 58); const lamp = new THREE.PointLight(0xfff0d8, 220, 18, 2); lamp.position.set(8, 5, 56); g.add(lamp);
      // rain
      const rp = []; const R2 = rng(31); for (let i = 0; i < 1600; i++) rp.push(new THREE.Vector3((R2() - .5) * 40, R2() * 30, -80 + R2() * 130));
      const rain = new THREE.Points(new THREE.BufferGeometry().setFromPoints(rp), new THREE.PointsMaterial({color: 0x9ab0d8, size: 0.12, transparent: true, opacity: 0.6, depthWrite: false})); g.add(rain);
      return t => { vault.uniforms.t.value = t; const p = rain.geometry.attributes.position; for (let i = 0; i < p.count; i++) { let y = p.getY(i) - 0.9; if (y < 0) y += 30; p.setY(i, y); } p.needsUpdate = true; };
    }},
  {id: 'viaduct', district: 'cenotaph', name: 'The Named Viaduct and the Shore Steps', at: [10, 240], views: [43, 37, 97, 50], poems: ['04', '10', '11'],
    line: 'the broken rail kept as a cenotaph: arches with names below the line, and wet stone steps down to the sea with lanterns',
    shot: {p: [74, 3, 74], t: [0, 9, -8], fov: 40},
    build(g) {
      const stone = mat(0x9a9498, {r: 0.95, s: 'soot brick', ts: 3}), rust = mat(0x9a6a56, {r: 0.7, m: 0.4, s: 'rust', ts: 2});
      const ag = archGeo(14, 18, 10, 5, 7);
      for (let i = -6; i <= 6; i++) { if (i === 2) continue; put(g, ag, stone, i * 14, 0, -10); put(g, new THREE.PlaneGeometry(6, 0.5), glow(0xe8e0d0, 0.5), i * 14, 3.2, -2.9); }   // a gap where the Fall broke it
      box(g, 14 * 13, 1.6, 8, stone, 0, 18, -6.5); box(g, 26, 0.5, 6, rust, -70, 19.6, -6.5);
      put(g, new THREE.SphereGeometry(0.6, 8, 6), glow(0xff8a2a, 3), -76, 23, -6.5); cyl(g, 0.1, 0.1, 4, rust, -76, 19.6, -6.5, 6);
      const pl0 = new THREE.PointLight(0xff8a2a, 60, 30, 1.6); pl0.position.set(-76, 22, -6.5); g.add(pl0);
      // the shore steps: wide flights down into the sea, lanterns on the landings
      const st = stairs(g, 14, 16, 0.32, 0.9, mat(0x8a8a8c, {r: 0.35, s: 'granite', ts: 2, sv: 1}), 30, -1.2, 40, Math.PI); const lan = [];
      for (let i = 0; i < 14; i += 3) for (const s of [-1, 1]) { const p = new THREE.Vector3(30 + s * 7.4, -1.2 + i * 0.32 + 0.9, 40 + i * 0.9); lan.push(p); }
      dots(g, lan, 0xffa860, 0.9); lan.forEach((p, i) => { if (i % 2) return; const l = new THREE.PointLight(0xff9a50, 14, 14, 2); l.position.copy(p); g.add(l); });
      put(g, new THREE.ConeGeometry(120, 70, 5), mat(0x3a3c44, {r: 1, s: 'slate', ts: 20}), 30, 35, -170);                        // the mountain behind
      // first light behind the mountain: the hour this district is always seen at
      const sun = new THREE.Sprite(new THREE.SpriteMaterial({map: soft(), color: 0xffa070, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending, fog: false}));
      sun.position.set(-60, 26, -320); sun.scale.set(700, 180, 1); g.add(sun);
      const dl = new THREE.DirectionalLight(0xffb088, 0.9); dl.position.set(-60, 30, -300); dl.target.position.set(0, 0, 0); g.add(dl, dl.target);
      const hz = haze(g, 20, 0x8a6a6a, 200, 10, 60, 0.05, 41);
      return t => {};
    }},
  {id: 'temple', district: 'temple', name: 'The White Temple and its Pools', at: [-90, 410], views: [52, 72, 42], poems: ['03', '11', '12'],
    line: 'a white vault over the chapel’s ruin, a colonnade doubled in a still pool, a black pool that holds the stars',
    shot: {p: [0, 2, 70], t: [0, 9, -20], fov: 44},
    build(g) {
      const white = mat(0xe8e4dc, {r: 0.5, s: 'marble', ts: 3, sv: 1}), stone = mat(0x6a6a6e, {r: 0.95, s: 'cantera', ts: 3});
      // the chapel's dark nave (as built) with its gable, and the white vault over it
      box(g, 9, 6, 22, stone, 0, 0, -30);
      { const sh = new THREE.Shape([new THREE.Vector2(-4.8, 0), new THREE.Vector2(4.8, 0), new THREE.Vector2(0, 5.6)]); put(g, new THREE.ExtrudeGeometry(sh, {depth: 22, bevelEnabled: false}), stone, 0, 6, -41); }
      box(g, 1.2, 2.4, 0.8, stone, 0, 11.6, -19);                                                             // the bell-cote on the front gable
      put(g, new THREE.SphereGeometry(18, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xe8e4dc, {r: 0.3, t: true, o: 0.35, side: THREE.DoubleSide, e: 0xffffff, ei: 0.03, dw: false}), 0, 0, -30).scale.set(1, 1.1, 1.6);
      put(g, new THREE.TorusGeometry(18, 0.12, 6, 96, Math.PI), glow(0x5fe8ff, 2.6), 0, 0, -30, Math.PI / 2, 0, 0).scale.set(1, 1.6, 1.1);
      // the portico on its pool
      for (let i = -7; i <= 7; i++) cyl(g, 0.7, 0.8, 9, white, i * 3.4, 0, 0, 16);
      box(g, 51, 1.6, 4, white, 0, 9, 0); box(g, 51, 0.6, 30, white, 0, 0, 12);
      put(g, new THREE.PlaneGeometry(50, 24), mat(0x050608, {r: 0.05, m: 0.9}), 0, 0.05, 30, 0, -Math.PI / 2);
      // the pool of stars: a black square holding points of light
      const R = rng(72); put(g, new THREE.PlaneGeometry(20, 20), mat(0x020204, {r: 0.1}), 40, 0.1, 20, 0, -Math.PI / 2);
      dots(g, Array.from({length: 260}, () => new THREE.Vector3(40 + (R() - .5) * 19, 0.15, 20 + (R() - .5) * 19)), 0xc8d8ff, 0.35);
      const pl = new THREE.PointLight(0xffe8c8, 260, 70, 1.6); pl.position.set(-14, 6, 24); g.add(pl);
      const hz = haze(g, 16, 0xc8d0e0, 140, 6, 50, 0.05, 52);
      return t => {};
    }},
  {id: 'door', district: 'black', name: 'The Door in the Black', at: [80, -560], views: [6, 36], poems: ['01', '14'],
    line: 'nothing but a vintage door standing in the black, warm light leaking round it: the party behind',
    shot: {p: [0, 1.7, 14], t: [0, 1.9, 0], fov: 40},
    build(g) {
      const wood = mat(0x8a5a40, {r: 0.6, s: 'wood siding', ts: 2});
      box(g, 2.6, 0.2, 0.5, wood, 0, 2.7, 0); box(g, 0.2, 2.9, 0.5, wood, -1.2, 0, 0); box(g, 0.2, 2.9, 0.5, wood, 1.2, 0, 0);
      const leaf = new THREE.Group(); leaf.position.set(-1.05, 0, 0.05); g.add(leaf); box(leaf, 2.1, 2.65, 0.08, mat(0x9a6a50, {r: 0.5, s: 'panelling', ts: 2}), 1.05, 0.02, 0);
      put(g, new THREE.PlaneGeometry(2.2, 2.7), glow(0xffb070, 1.0), 0, 1.38, -0.2);
      const pl = new THREE.PointLight(0xffa860, 40, 12, 2); pl.position.set(0, 1.5, 1.4); g.add(pl);
      return t => { leaf.rotation.y = -0.18 - 0.12 * Math.sin(t * 0.3); };
    }}
];

// each district's mood: what the world becomes as you come near one of its places
export const MOODS = {
  haze: {bg: 0x2a0c02, fog: 0x7a3008, density: 0.0062, amb: 0xff8a40, ambI: 0.35, bloom: 0.85, exp: 1.0},
  hive: {bg: 0x04060e, fog: 0x0a1424, density: 0.0018, amb: 0x2a4a90, ambI: 0.3, bloom: 0.9, exp: 1.0},
  overseer: {bg: 0x020818, fog: 0x06163a, density: 0.0016, amb: 0x3a6ad0, ambI: 0.45, bloom: 0.8, exp: 1.05},
  bay: {bg: 0x02100f, fog: 0x0a2a2c, density: 0.0040, amb: 0x2ab0a8, ambI: 0.35, bloom: 0.8, exp: 1.0},
  ascent: {bg: 0x050210, fog: 0x0e0718, density: 0.0022, amb: 0x5a3a80, ambI: 0.3, bloom: 1.0, exp: 1.0},
  plaza: {bg: 0x081014, fog: 0x14262c, density: 0.0020, amb: 0xc8e8ff, ambI: 0.45, bloom: 0.9, exp: 1.0},
  naraka: {bg: 0x031014, fog: 0x082228, density: 0.0045, amb: 0x2ab0c8, ambI: 0.28, bloom: 0.85, exp: 1.0},
  ankhu: {bg: 0x070a20, fog: 0x1a2250, density: 0.0024, amb: 0x7a6ad8, ambI: 0.45, bloom: 0.95, exp: 1.0},
  commons: {bg: 0x050e1e, fog: 0x0e2240, density: 0.0028, amb: 0x5a8ac8, ambI: 0.5, bloom: 0.8, exp: 1.0},
  arcade: {bg: 0x10040c, fog: 0x2a0a24, density: 0.0040, amb: 0xc84a90, ambI: 0.4, bloom: 1.05, exp: 1.0},
  cenotaph: {bg: 0x2a1c20, fog: 0x4a3434, density: 0.0034, amb: 0xd8a080, ambI: 0.55, bloom: 0.7, exp: 1.05},
  temple: {bg: 0x0c121a, fog: 0x1c2634, density: 0.0028, amb: 0xb8c8e0, ambI: 0.32, bloom: 0.55, exp: 1.0},
  black: {bg: 0x000000, fog: 0x000000, density: 0.012, amb: 0x000000, ambI: 0.0, bloom: 1.1, exp: 1.0}
};
