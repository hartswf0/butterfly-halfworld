// THE ISLAND — drive it, get out, walk into the sets, light them, shoot them, play the scene.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import {makeSky, makeHalftone, blend} from './sky.mjs';
import {buildSet} from './sets.mjs';

const $ = id => document.getElementById(id);
const touchy = matchMedia('(pointer:coarse)').matches;
if (touchy) document.body.classList.add('touchy');
const say = t => { $('hplace').textContent = t; $('go').textContent = t.toUpperCase(); };
function fail(msg) {
  $('go').textContent = 'COULD NOT LOAD';
  const p = document.createElement('p'); p.className = 'err';
  p.textContent = location.protocol === 'file:' ? 'This page reads its data with fetch(), which browsers block on file:// — open it through a web server (the published link).' : msg;
  document.querySelector('#start .card').appendChild(p);
  throw new Error(msg);
}
addEventListener('unhandledrejection', e => fail(String(e.reason && e.reason.message || e.reason)));
let got = 0;
const load = (u, kind) => fetch(u).then(r => { if (!r.ok) throw new Error(u + ' → ' + r.status); return r[kind](); }).then(v => { say(`loading the island · ${++got}/6`); return v; });
const [meta, hbuf, blds, trees, roads, SD] = await Promise.all([
  load('meta.json', 'json'), load('height.bin', 'arrayBuffer'), load('buildings.json', 'json'),
  load('trees.json', 'json'), load('roads.json', 'json'), load('sets.json', 'json'),
]).catch(e => fail(e.message));
say('raising the ground');
const {W, H, cell: CELL, nx: NX, ny: NY} = meta;
const HT = new Int16Array(hbuf);
const hAt = (x, y) => {
  const fx = x / CELL, fy = y / CELL, i = Math.floor(fx), j = Math.floor(fy);
  if (i < 0 || j < 0 || i >= NX - 1 || j >= NY - 1) return -40;
  const tx = fx - i, ty = fy - j, o = j * NX + i;
  return ((HT[o] * (1 - tx) + HT[o + 1] * tx) * (1 - ty) + (HT[o + NX] * (1 - tx) + HT[o + NX + 1] * tx) * ty) / 10;
};
const SETS = SD.sets;
const BYNUM = Object.fromEntries(SETS.map(s => [s.num, s]));

// ── renderer ──
const renderer = new THREE.WebGLRenderer({canvas: $('gl'), antialias: !touchy, powerPreference: 'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio, touchy ? 1.5 : 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 1, 0.3, 9000);
const sky = makeSky(scene, renderer, camera);
const halftone = makeHalftone(renderer);
function resize() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

// ── terrain ──
{
  const STEP = 2, TX = Math.floor((NX - 1) / STEP) + 1, TY = Math.floor((NY - 1) / STEP) + 1;
  const pos = new Float32Array(TX * TY * 3), uv = new Float32Array(TX * TY * 2);
  for (let j = 0; j < TY; j++) for (let i = 0; i < TX; i++) {
    const k = j * TX + i, x = i * STEP * CELL, y = j * STEP * CELL;
    pos[k * 3] = x; pos[k * 3 + 1] = HT[(j * STEP) * NX + i * STEP] / 10; pos[k * 3 + 2] = y;
    uv[k * 2] = x / W; uv[k * 2 + 1] = 1 - y / H;
  }
  const idx = new Uint32Array((TX - 1) * (TY - 1) * 6); let n = 0;
  for (let j = 0; j < TY - 1; j++) for (let i = 0; i < TX - 1; i++) { const a = j * TX + i, b = a + 1, c = a + TX, d = c + 1; idx[n++] = a; idx[n++] = c; idx[n++] = b; idx[n++] = b; idx[n++] = c; idx[n++] = d; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeVertexNormals();
  const tex = await new THREE.TextureLoader().loadAsync('ground.jpg');
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  scene.add(new THREE.Mesh(g, new THREE.MeshLambertMaterial({map: tex})));
  $('mapimg').src = 'minimap.jpg';
  const sg = new THREE.PlaneGeometry(W * 3, H * 3); sg.rotateX(-Math.PI / 2); sg.translate(W / 2, -0.35, H / 2);
  scene.add(new THREE.Mesh(sg, new THREE.MeshLambertMaterial({color: 0x3f7f98, transparent: true, opacity: 0.86})));
}

// ── roads (for spawning, fronts, the seen) ──
const roadPts = [];
for (const r of [...roads.streets, ...roads.highways]) { if (r.k === 'lane') continue; for (let i = 1; i < r.pts.length; i++) roadPts.push([r.pts[i - 1], r.pts[i]]); }
const nearestRoad = (x, y, maxd = 1e9) => {
  let best = null, bd = maxd;
  for (const [a, b] of roadPts) {
    const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / L2));
    const px = a[0] + dx * t, py = a[1] + dy * t, d = Math.hypot(px - x, py - y);
    if (d < bd) { bd = d; best = {x: px, y: py, d, hd: Math.atan2(dx, -dy)}; }
  }
  return best;
};

// ── sets ──
const walls = [], levels = [], doors = [];
for (const s of SETS) {
  let front;
  if (s.type === 'beach' || s.type === 'chapel' || s.type === 'temple') {          // these face the water
    let best = null;
    for (let r = 20; r < 1200 && !best; r += 20) for (let a = 0; a < 6.28; a += 0.2) { const x = s.x + r * Math.cos(a), y = s.y + r * Math.sin(a); if (hAt(x, y) < 0) { best = {x: x - s.x, y: y - s.y}; break; } }
    front = best || {x: 1, y: 0};
  } else {
    const r = nearestRoad(s.x, s.y, 400); front = r && r.d > 2 ? {x: r.x - s.x, y: r.y - s.y} : {x: 1, y: 0};
  }
  const L = Math.hypot(front.x, front.y) || 1; front = {x: front.x / L, y: front.y / L};
  const b = buildSet(s, {hAt, front});
  s.built = b; scene.add(b.group);
  for (const w of b.walls) walls.push(w);
  for (const l of b.levels) levels.push({...l, set: s.num});
  for (const d of b.doors) doors.push({...d, set: s.num});
}
const nearSet = (x, y, pad = 8) => SETS.some(s => Math.hypot(s.x - x, s.y - y) < s.foot + pad);

// ── buildings (the island's, cleared where a set stands) ──
const KCOL = [[0.72, 0.68, 0.62], [0.80, 0.76, 0.69], [0.82, 0.73, 0.62], [0.76, 0.66, 0.55]];
const grid = new Map(), GC = 40, polys = [], tall = [];
{
  const P = [], Cc = [];
  const push = (x, y, z, c) => { P.push(x, y, z); Cc.push(c[0], c[1], c[2]); };
  for (const b of blds) {
    const h = b[0], col = KCOL[b[1]] || KCOL[0];
    let pts = []; for (let k = 2; k < b.length; k += 2) pts.push([b[k], b[k + 1]]);
    if (pts.length > 3 && pts[0][0] === pts.at(-1)[0] && pts[0][1] === pts.at(-1)[1]) pts.pop();
    if (pts.length < 3) continue;
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    if (nearSet(cx, cy, 10)) continue;
    let base = Infinity; for (const [x, y] of pts) base = Math.min(base, hAt(x, y));
    if (base < -0.5) continue;
    const top = base + h, bot = base - 3;
    const area = pts.reduce((s, p, i) => { const q = pts[(i + 1) % pts.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0);
    if (area < 0) pts.reverse();
    const wc = col.map(v => v * 0.86), rc = col.map(v => v * 1.04);
    for (let i = 0; i < pts.length; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length];
      const s = 0.82 + 0.18 * Math.abs(Math.sin(Math.atan2(y1 - y0, x1 - x0) + 0.6)); const c = wc.map(v => v * s);
      push(x0, bot, y0, c); push(x1, top, y1, c); push(x1, bot, y1, c); push(x0, bot, y0, c); push(x0, top, y0, c); push(x1, top, y1, c);
    }
    for (const [a, b2, c2] of THREE.ShapeUtils.triangulateShape(pts.map(p => new THREE.Vector2(p[0], p[1])), [])) {
      push(pts[a][0], top, pts[a][1], rc); push(pts[c2][0], top, pts[c2][1], rc); push(pts[b2][0], top, pts[b2][1], rc);
    }
    const bb = [Infinity, Infinity, -Infinity, -Infinity];
    for (const [x, y] of pts) { bb[0] = Math.min(bb[0], x); bb[1] = Math.min(bb[1], y); bb[2] = Math.max(bb[2], x); bb[3] = Math.max(bb[3], y); }
    const id = polys.push({pts, bb, top}) - 1;
    if (h > 20) tall.push([cx, cy, top]);
    for (let gx = Math.floor(bb[0] / GC); gx <= Math.floor(bb[2] / GC); gx++) for (let gy = Math.floor(bb[1] / GC); gy <= Math.floor(bb[3] / GC); gy++) {
      const key = gx * 10000 + gy; (grid.get(key) || grid.set(key, []).get(key)).push(id);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3));
  g.computeVertexNormals();
  scene.add(new THREE.Mesh(g, new THREE.MeshLambertMaterial({vertexColors: true, side: THREE.DoubleSide})));
}
const inPoly = (x, y, pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const hitsBuilding = (x, y) => { const ids = grid.get(Math.floor(x / GC) * 10000 + Math.floor(y / GC)); if (!ids) return false;
  for (const id of ids) { const p = polys[id]; if (x >= p.bb[0] && x <= p.bb[2] && y >= p.bb[1] && y <= p.bb[3] && inPoly(x, y, p.pts)) return true; } return false; };
const segD = (x, y, w) => { const dx = w[2] - w[0], dy = w[3] - w[1], L2 = dx * dx + dy * dy || 1; const t = Math.max(0, Math.min(1, ((x - w[0]) * dx + (y - w[1]) * dy) / L2)); return Math.hypot(x - w[0] - dx * t, y - w[1] - dy * t); };
const hitsWall = (x, y, z, r) => { for (const w of walls) if (Math.abs(w[4] - z) < 2.5 && segD(x, y, w) < r) return true; return false; };

// ── trees ──
const treeGrid = new Map();
{
  const keep = trees.filter(([x, y]) => !nearSet(x, y, 4));
  const crown = new THREE.ConeGeometry(1, 1, 7); crown.translate(0, 0.5, 0);
  const m = new THREE.InstancedMesh(crown, new THREE.MeshLambertMaterial({color: 0x4c6a3e}), keep.length);
  const o = new THREE.Object3D(), c = new THREE.Color();
  keep.forEach(([x, y, h], i) => {
    o.position.set(x, hAt(x, y) - 0.5, y); o.scale.set(h * 0.32, h, h * 0.32); o.updateMatrix(); m.setMatrixAt(i, o.matrix);
    c.setHSL(0.26 + Math.random() * 0.06, 0.32, 0.26 + Math.random() * 0.1); m.setColorAt(i, c);
    const k = Math.floor(x / 60) * 10000 + Math.floor(y / 60); (treeGrid.get(k) || treeGrid.set(k, []).get(k)).push([x, y]);
  });
  scene.add(m);
}

// ── highways, bridges ──
function ribbon(pts, zs, w, color, lift) {
  const P = [], I = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
    const [x, y] = pts[i], z = (zs ? zs[i] : hAt(x, y)) + lift;
    P.push(x - dy * w / 2, z, y + dx * w / 2, x + dy * w / 2, z, y - dx * w / 2);
    if (i) { const k = i * 2; I.push(k - 2, k, k - 1, k - 1, k, k + 1); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals();
  scene.add(new THREE.Mesh(g, new THREE.MeshLambertMaterial({color, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2})));
}
const bridgeSegs = [];
for (const hw of roads.highways) ribbon(hw.pts, hw.pts.map(([x, y], i) => Math.max(hAt(x, y), Math.min(hw.z[i], hAt(x, y) + 0.3))), 15, 0x5b5650, 0.25);
for (const br of roads.bridges) {
  ribbon(br.map(p => [p[0], p[1]]), br.map(p => p[2]), 16, 0x8a7f72, 0.4);
  for (let i = 1; i < br.length; i++) bridgeSegs.push([br[i - 1], br[i]]);
}
const onBridge = (x, y) => { for (const [a, b] of bridgeSegs) { const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / L2)); if (Math.hypot(x - a[0] - dx * t, y - a[1] - dy * t) < 9) return a[2] + (b[2] - a[2]) * t + 0.4; } return null; };

// ── vehicles and the poet ──
const car = new THREE.Group();
{
  const body = new THREE.Mesh(new THREE.BoxGeometry(2, 0.9, 4.4), new THREE.MeshLambertMaterial({color: 0xb5332a})); body.position.y = 0.75; car.add(body);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.7, 2.2), new THREE.MeshLambertMaterial({color: 0x1d2329})); cab.position.set(0, 1.45, -0.2); car.add(cab);
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.2, 0.1), new THREE.MeshBasicMaterial({color: 0xfff3c0})); lamp.position.set(0, 0.85, -2.22); car.add(lamp);
}
const bike = new THREE.Group();
{
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.55, 2.0), new THREE.MeshLambertMaterial({color: 0x151515})); b.position.y = 0.7; bike.add(b);
  for (const z of [-0.8, 0.8]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.08, 6, 14), new THREE.MeshLambertMaterial({color: 0x050505})); w.position.set(0, 0.34, z); w.rotation.y = Math.PI / 2; bike.add(w); }
  const l = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshBasicMaterial({color: 0xfff3c0})); l.position.set(0, 0.95, -1.0); bike.add(l);
}
bike.visible = false; scene.add(car); scene.add(bike);
const poet = new THREE.Group();
{
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 1.0, 4, 8), new THREE.MeshLambertMaterial({color: 0x1a1a1f})); body.position.y = 0.78; poet.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), new THREE.MeshLambertMaterial({color: 0x4a3226})); head.position.y = 1.62; poet.add(head);
  const sc = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.05, 6, 12), new THREE.MeshBasicMaterial({color: 0xffd23f})); sc.position.y = 1.42; sc.rotation.x = Math.PI / 2; poet.add(sc);
}
poet.visible = false; scene.add(poet);
const S = {mode: 'drive', veh: 'car', x: 0, y: 0, hd: 0, v: 0, z: 0, cx: 0, cy: 0, chd: 0, level: null, fall: null, yaw: 0, pitch: 0.15, cam: 0, last: [0, 0]};
// active-set practical lights (only the set you're in gets real lights)
const prac = [0, 1, 2, 3].map(() => { const l = new THREE.PointLight(0xffffff, 0, 30, 1.4); scene.add(l); return l; });

// ── the light field: every place keeps its poem's hour; the light walks with you ──
let manual = null, lightT = 0;
function lightTarget() {
  if (manual) return manual;
  const ws = SETS.map(s => { const d = Math.hypot(s.x - S.x, s.y - S.y); return d < s.foot + 30 ? 1e6 : 1 / Math.pow(d + 150, 2.4); });
  return blend(SETS.map(s => s.light), ws);
}
const fmt = t => t == null ? '' : `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

// ── what he says he sees: find it on this island, and whether the stand can see it ──
const COMPASS = a => ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(((a % 360) + 360) % 360 / 45) % 8];
function seeLine(ax, ay, az, bx, by, bz) {
  for (let t = 0.04; t < 0.97; t += 0.03) { const x = ax + (bx - ax) * t, y = ay + (by - ay) * t, z = az + (bz - az) * t; if (hAt(x, y) > z + 0.5) return false; }
  return true;
}
function findFeature(type, x0, y0) {
  const z0 = hAt(x0, y0);
  const ring = (test, rmax = 3000, step = 25) => { for (let r = step; r < rmax; r += step) for (let a = 0; a < 6.28; a += step / r * 1.5) { const x = x0 + r * Math.cos(a), y = y0 + r * Math.sin(a); if (test(x, y)) return {x, y}; } return null; };
  if (type === 'water' || type === 'harbor') return ring((x, y) => hAt(x, y) < 0 && (type === 'water' || polys.some(p => Math.abs(p.bb[0] - x) < 220 && Math.abs(p.bb[1] - y) < 220)), 4000, 30);
  if (type === 'beach') return ring((x, y) => hAt(x, y) < 0 && hAt(x + 20, y) > 0 && hAt(x + 20, y) < 3, 4000, 30);
  if (type === 'forest') { let best = null, bd = 3000; for (const [k, arr] of treeGrid) for (const [x, y] of arr) { const d = Math.hypot(x - x0, y - y0); if (d < bd) { bd = d; best = {x, y}; } } return best; }
  if (type === 'road') { const r = nearestRoad(x0, y0, 900); return r && {x: r.x, y: r.y}; }
  if (type === 'city') { let best = null, bd = 5000; for (const [x, y] of tall) { const d = Math.hypot(x - x0, y - y0); if (d < bd) { bd = d; best = {x, y, z: 25}; } } return best; }
  if (type === 'mountains') { let best = null, ba = 1.2; for (let a = 0; a < 6.28; a += 0.1) for (let r = 500; r < 8000; r += 150) { const x = x0 + r * Math.cos(a), y = y0 + r * Math.sin(a); const h = hAt(x, y); const e = Math.atan2(h - z0, r) * 57.3; if (h > z0 + 90 && e > ba) { ba = e; best = {x, y}; } } return best; }
  if (type === 'field') return ring((x, y) => { const h = hAt(x, y); return h > 1 && Math.abs(hAt(x + 10, y) - h) < 0.6 && !hitsBuilding(x, y) && !(treeGrid.get(Math.floor(x / 60) * 10000 + Math.floor(y / 60)) || []).some(([tx, ty]) => Math.hypot(tx - x, ty - y) < 30); }, 2500, 30);
  const SETOF = {temple: '11', chapel: '03', gates: '06', fire: '04'};
  if (SETOF[type]) { const s = BYNUM[SETOF[type]]; return {x: s.x, y: s.y, z: 8}; }
  return null;
}
const SKYWORD = {stars: l => l.stars > 0.3, moon: l => l.stars > 0.3, night: l => l.el > 20 && l.stars > 0.3, dusk: l => l.el < 8 && l.stars < 0.5, dawn: l => l.el < 15 && (l.az ?? 0) < 130,
  storm: l => l.rain > 0, rain: l => l.rain > 0, clouds: l => true, wind: l => true, rainbow: l => false};
function readSeen(s) {
  const eye = (s.built.levels[0] ? s.built.levels[0].z : hAt(s.x, s.y)) + 1.7;
  return s.seen.filter(i => i.cls === 'land' || i.cls === 'sky').map(i => {
    if (i.cls === 'sky') { const f = SKYWORD[i.type]; const ok = f ? f(s.light) : true; return {...i, ok, where: ok ? 'in the sky of this set' : 'not in this set’s sky', f: null}; }
    const f = findFeature(i.type, s.x, s.y);
    if (!f) return {...i, ok: false, where: 'not on this island within reach', f: null};
    const d = Math.hypot(f.x - s.x, f.y - s.y), b = Math.atan2(f.x - s.x, -(f.y - s.y)) * 57.3;
    const vis = seeLine(s.x, s.y, eye, f.x, f.y, hAt(f.x, f.y) + (f.z || 2));
    return {...i, ok: vis, where: `${vis ? 'in view' : 'there but hidden'} · ${d < 1000 ? Math.round(d) + ' m' : (d / 1000).toFixed(1) + ' km'} ${COMPASS(b)}`, f};
  });
}

// ── camera stands (after the Odyssey's clearDir: search bearings for a clear line to the subject) ──
function standFor(s, k) {
  const p = s.pieces[k], st = p.stand, front = s.built.front;
  let tx = p.x, ty = p.y;
  if (Math.hypot(tx - s.x, ty - s.y) > 90) { tx = s.x; ty = s.y; }
  const tz = (s.built.levels.length && ['tower', 'rooftop'].includes(s.type) && k > 0 ? s.built.levels[0].z : hAt(tx, ty)) + 1.5;
  const base = Math.atan2(front.y, front.x) + st.az * Math.PI / 180;
  for (const off of [0, 0.35, -0.35, 0.7, -0.7, 1.1, -1.1, 1.6, -1.6, 2.2, -2.2, 3.14]) {
    for (const dm of [1, 0.6, 1.5]) {
      const a = base + off, d = st.dist * dm;
      const x = tx + Math.cos(a) * d, y = ty + Math.sin(a) * d;
      const z = Math.max(hAt(x, y), 0) + st.h + (tz - hAt(tx, ty) - 1.5 > 10 ? tz - hAt(tx, ty) - 1.5 : 0);
      if (hitsBuilding(x, y) || hitsWall(x, y, z - st.h, 0.5)) continue;
      let clear = true;
      for (let t = 0.1; t < 0.95 && clear; t += 0.1) { const qx = x + (tx - x) * t, qy = y + (ty - y) * t, qz = z + (tz - z) * t; if (hAt(qx, qy) > qz || polys.length && hitsBuilding(qx, qy) && qz < 20) clear = false; }
      if (clear) return {x, y, z, tx, ty, tz, k, move: st.move};
    }
  }
  const a = base; return {x: tx + Math.cos(a) * st.dist, y: ty + Math.sin(a) * st.dist, z: hAt(tx, ty) + st.h + 1, tx, ty, tz, k, move: st.move};
}

// ── input ──
const K = {}, T = {jx: 0, jy: 0};
addEventListener('keydown', e => {
  const k = e.key.toLowerCase(); K[k] = true;
  if (k === 'm') toggleMap(); if (k === 'f') inout(); if (k === 'e') action(); if (k === 'tab') { e.preventDefault(); togglePanel(); }
  if (k === 'v') shootToggle(); if (k === 'h') toggleHT(); if (k === 'c') S.cam = (S.cam + 1) % 3; if (k === 'p') sceneToggle();
  if (k === 'escape') { if (scn) sceneStop(); else if (shoot) shootToggle(); else { toggleMap(false); togglePanel(false); } }
  if (shoot && (k === 'arrowright' || k === ']')) shootStep(1); if (shoot && (k === 'arrowleft' || k === '[')) shootStep(-1);
});
addEventListener('keyup', e => K[e.key.toLowerCase()] = false);
{
  const st = $('stick'), nub = $('nub'); let id = null, ox = 0, oy = 0;
  st.addEventListener('pointerdown', e => { id = e.pointerId; st.setPointerCapture(id); const r = st.getBoundingClientRect(); ox = r.left + r.width / 2; oy = r.top + r.height / 2; mv(e); });
  const mv = e => { if (e.pointerId !== id) return; let dx = (e.clientX - ox) / 50, dy = (e.clientY - oy) / 50; const L = Math.hypot(dx, dy); if (L > 1) { dx /= L; dy /= L; } T.jx = dx; T.jy = dy; nub.style.transform = `translate(${dx * 34}px,${dy * 34}px)`; };
  st.addEventListener('pointermove', mv);
  const up = () => { id = null; T.jx = T.jy = 0; nub.style.transform = ''; };
  st.addEventListener('pointerup', up); st.addEventListener('pointercancel', up);
  // look: drag anywhere else on the canvas
  let ld = null;
  $('gl').addEventListener('pointerdown', e => { ld = [e.clientX, e.clientY]; });
  addEventListener('pointermove', e => { if (!ld || e.buttons === 0 && e.pointerType === 'mouse') { ld = null; return; } S.yaw -= (e.clientX - ld[0]) * 0.006; S.pitch = Math.max(-0.4, Math.min(0.9, S.pitch + (e.clientY - ld[1]) * 0.004)); ld = [e.clientX, e.clientY]; });
  addEventListener('pointerup', () => ld = null);
}
$('bio').onclick = () => inout(); $('bact').onclick = () => action(); $('bset').onclick = () => togglePanel(); $('bshoot').onclick = () => shootToggle();
$('bmap').onclick = () => toggleMap(); $('mini').onclick = () => toggleMap(); $('bht').onclick = () => toggleHT();

// ── driving ──
function drive(dt) {
  const gas = K['w'] || K['arrowup'] || T.jy < -0.25, brake = K['s'] || K['arrowdown'] || T.jy > 0.35;
  const steer = (K['a'] || K['arrowleft'] ? -1 : 0) + (K['d'] || K['arrowright'] ? 1 : 0) + (Math.abs(T.jx) > 0.15 ? T.jx : 0);
  const fx = Math.sin(S.hd), fy = -Math.cos(S.hd);
  const wet = hAt(S.x, S.y) < 0 && onBridge(S.x, S.y) === null;
  const slope = (hAt(S.x + fx * 3, S.y + fy * 3) - hAt(S.x - fx * 3, S.y - fy * 3)) / 6;
  const vmax = wet ? 5 : (S.veh === 'bike' ? 46 : (K['shift'] ? 60 : 38));
  if (gas) S.v += (S.v < 0 ? 30 : 14) * dt * (T.jy < -0.25 ? Math.min(1, -T.jy * 1.4) : 1);
  if (brake) S.v -= (S.v > 0 ? 30 : 8) * dt;
  S.v -= slope * 9.8 * dt * 0.6; S.v *= Math.pow(wet ? 0.3 : 0.86, dt); S.v = Math.max(-12, Math.min(vmax, S.v));
  S.hd += steer * dt * Math.min(1.9, Math.abs(S.v) * 0.12) * Math.sign(S.v || 1) / (1 + Math.abs(S.v) * 0.02);
  const nx = S.x + fx * S.v * dt, ny = S.y + fy * S.v * dt;
  const probe = [[nx + fx * 2.2, ny + fy * 2.2], [nx - fx * 2.2, ny - fy * 2.2], [nx + fy, ny - fx], [nx - fy, ny + fx]];
  const gz = hAt(nx, ny);
  if (probe.some(([x, y]) => hitsBuilding(x, y) || hitsWall(x, y, gz, 1.0)) && onBridge(nx, ny) === null) { S.v *= -0.25; return; }
  if (hAt(nx, ny) < -3.5 && onBridge(nx, ny) === null) { S.v = 0; [S.x, S.y] = S.last; return; }
  if (nx < 20 || ny < 20 || nx > W - 20 || ny > H - 20) { S.v = 0; return; }
  S.x = nx; S.y = ny; if (hAt(S.x, S.y) > 0.5) S.last = [S.x, S.y];
}
// ── walking ──
const levelAt = (x, y, z) => levels.find(l => Math.abs(l.z - z) < 1.2 && l.polys.some(p => inPoly(x, y, p)));
function walk(dt) {
  if (S.fall) {
    S.fall.v += 9.8 * dt; S.z -= S.fall.v * dt;
    const g = Math.max(hAt(S.x, S.y), 0);
    if (S.z <= g) {
      S.z = g; const h = S.fall.h0 - g; S.fall = null; S.level = null;
      const s = activeSet();
      if (h > 12 && s && s.departure && s.departure.mode === 'fall') leaveBy('fall', s);
    }
    return;
  }
  let f = (K['w'] || K['arrowup'] ? 1 : 0) - (K['s'] || K['arrowdown'] ? 1 : 0) - T.jy;
  let r = (K['d'] || K['arrowright'] ? 1 : 0) - (K['a'] || K['arrowleft'] ? 1 : 0) + T.jx;
  const L = Math.hypot(f, r); if (L > 1) { f /= L; r /= L; }
  if (L < 0.08) return;
  const sp = (K['shift'] ? 5.2 : 2.1) * dt;
  const yaw = S.yaw;
  const fx = Math.sin(yaw), fy = -Math.cos(yaw);
  const mx = (fx * f - fy * r) * sp, my = (fy * f + fx * r) * sp;
  S.hd = Math.atan2(mx, -my);
  const nx = S.x + mx, ny = S.y + my;
  const z = S.level ? S.level.z : Math.max(hAt(nx, ny), 0);
  if (hitsWall(nx, ny, S.level ? S.level.z : Math.max(hAt(S.x, S.y), 0), 0.38)) return;
  if (!S.level && (hitsBuilding(nx, ny) || hAt(nx, ny) < -1.2)) return;
  S.x = nx; S.y = ny;
  if (S.level && !S.level.polys.some(p => inPoly(nx, ny, p))) { S.fall = {v: 0, h0: S.z}; toast('', 'leaving is falling', ''); return; }
  S.z = z;
}
function inout() {
  if (S.mode === 'drive') {
    if (Math.abs(S.v) > 4) return;
    S.mode = 'walk'; S.cx = S.x; S.cy = S.y; S.chd = S.hd;
    S.x += Math.cos(S.hd) * 2.4; S.y += Math.sin(S.hd) * 2.4; S.z = Math.max(hAt(S.x, S.y), 0); S.yaw = S.hd;
    poet.visible = true; $('bio').textContent = 'IN';
  } else {
    if (S.level || Math.hypot(S.x - S.cx, S.y - S.cy) > 5) { toast('', 'walk back to the ' + (S.veh === 'bike' ? 'motorcycle' : 'car') + ' to get in', ''); return; }
    S.mode = 'drive'; S.x = S.cx; S.y = S.cy; S.hd = S.chd; S.v = 0; poet.visible = false; $('bio').textContent = 'OUT';
  }
}
function nearDoor() { return doors.find(d => Math.hypot(d.x - S.x, d.y - S.y) < 2.2 && ((S.level ? S.level.id : null) === d.level) && (!S.level || S.level.set === d.set)); }
function nearBike() { for (const s of SETS) if (s.built.marks.bike) { const [x, y] = s.built.marks.bike; if (Math.hypot(x - S.x, y - S.y) < 3) return {x, y, s}; } return null; }
function action() {
  if (S.mode !== 'walk') return;
  const d = nearDoor();
  if (d) { S.x = d.to.x; S.y = d.to.y; S.z = d.to.z; S.level = levelAt(S.x, S.y, S.z) || null; toast('', d.label, ''); return; }
  const b = nearBike();
  if (b) { S.veh = 'bike'; S.cx = b.x; S.cy = b.y; S.chd = S.hd; inout(); toast('10 · MAGIC RIDE', 'the motorcycle', 'ride toward first light'); }
}
function leaveBy(mode, s) {
  const next = SETS[SETS.indexOf(s) + 1]; if (!next) return;
  $('fade').classList.add('on');
  setTimeout(() => { travel(next, true); $('fade').classList.remove('on'); toast(`${next.num} · ${next.title.toUpperCase()}`, mode === 'fall' ? 'leaving is falling' : 'cut', next.place); }, 1600);
}

// ── where am I: the set you're in ──
function activeSet() {
  let best = null, bd = Infinity;
  for (const s of SETS) { const d = Math.hypot(s.x - S.x, s.y - S.y) - s.foot; if (d < bd) { bd = d; best = s; } }
  if (S.level) return BYNUM[S.level.set];
  return bd < 30 ? best : null;
}
let lastSet = null;
function onSet(s) {
  if (s === lastSet) return;
  lastSet = s;
  prac.forEach(l => l.intensity = 0);
  if (s) {
    s.built.lights.slice(0, 4).forEach(([x, z, y, c], i) => { prac[i].position.set(x, z + 0.4, y); prac[i].color.set(c); prac[i].intensity = 18; });
    $('chip').innerHTML = `<b>SET ${s.num}</b> ${s.title} <span>· ${s.place.split('(')[0]}</span>`;
    $('chip').classList.add('on');
    if (panelOn) fillPanel(s);
  } else $('chip').classList.remove('on');
}
$('chip').onclick = () => togglePanel(true);

// ── the set panel: card · shots · seen · light · sources ──
let panelOn = false, tab = 'card';
function togglePanel(on) {
  on = on ?? !panelOn; panelOn = on;
  const s = activeSet() || nearestSet();
  $('panel').classList.toggle('on', on);
  if (on) fillPanel(s);
}
const nearestSet = () => SETS.reduce((a, s) => Math.hypot(s.x - S.x, s.y - S.y) < Math.hypot(a.x - S.x, a.y - S.y) ? s : a, SETS[0]);
document.querySelectorAll('#tabs button').forEach(b => b.onclick = () => { tab = b.dataset.t; fillPanel(activeSet() || nearestSet()); });
$('pclose').onclick = () => togglePanel(false);
function fillPanel(s) {
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.t === tab));
  $('ptitle').innerHTML = `<span class="n">${s.num}</span> ${s.title} <small>${s.place}</small>`;
  const B = $('pbody');
  if (tab === 'card') {
    B.innerHTML = `<dl>
      <dt>the place</dt><dd>${s.kind}</dd>
      <dt>scouted as</dt><dd>${s.analog}</dd>
      <dt>what happens</dt><dd>${s.situation}</dd>
      <dt>the hour</dt><dd>${s.time}</dd>
      <dt>the light</dt><dd>${s.weather}</dd>
      <dt>arrives by</dt><dd>${s.arrival.mode || ''} — ${s.arrival.from_previous || ''}</dd>
      <dt>leaves by</dt><dd>${s.departure.mode || ''} — ${s.departure.to_next || ''}</dd>
      <dt>motifs</dt><dd>${(s.motifs || []).join(' · ')}</dd></dl>
      <div class="row"><button class="btn gold" id="pplay">▶ PLAY THE SCENE</button>
      <select id="pmode"><option value="staged">staged set</option><option value="generated">generated stills</option><option value="mixed">mixed</option></select></div>`;
    $('pplay').onclick = () => sceneStart(s, $('pmode').value);
  }
  if (tab === 'shots') {
    B.innerHTML = `<p class="note">The same poem storyboarded through the foundry's worlds — its reading steering the camera: <a href="../foundry/shots.html?poem=${s.num}" target="_blank" rel="noopener" style="color:var(--gold)">open the shots →</a></p>` + s.pieces.map((p, k) => `<div class="piece"><div class="ph"><b>${k + 1}. ${p.name}</b> <span>${p.t != null ? fmt(p.t) : ''}</span></div>
      <div class="pw">${p.what}</div>${p.lines.length ? `<div class="pl">“${p.lines.join(' / ')}”</div>` : ''}
      <div class="pc">camera: ${p.camera} <i>(${p.stand.dist} m · ${p.stand.h} m high · ${p.stand.move})</i></div>
      <div class="stills">${p.shots.filter(x => x.still).map(x => `<figure><img loading="lazy" src="${x.still}" alt=""><figcaption>${x.id}</figcaption></figure>`).join('')}</div>
      <button class="btn" data-k="${k}">FRAME IT</button></div>`).join('') + `<button class="btn" id="pmento">COPY SHOT LIST (MENTO)</button>`;
    B.querySelectorAll('button[data-k]').forEach(b => b.onclick = () => { shootAt(s, +b.dataset.k); });
    $('pmento').onclick = () => { navigator.clipboard && navigator.clipboard.writeText(mento(s)); toast('', 'shot list copied', 'MENTO grammar, island metres'); };
  }
  if (tab === 'seen') {
    const R = readSeen(s);
    const ok = R.filter(r => r.ok).length;
    B.innerHTML = `<p class="note">What he names, timed to the reading, read against this island from the set: ${ok} of ${R.length} hold.</p>` +
      R.map((r, i) => `<div class="seen ${r.ok ? 'ok' : 'no'}"><span class="t">${r.t != null ? fmt(r.t) : 'bible'}</span> <b>${r.type}</b> <i>“${r.line}”</i><br><span class="w">${r.where}</span>${r.f ? ` <button class="btn sm" data-i="${i}">LOOK</button>` : ''}</div>`).join('');
    B.querySelectorAll('button[data-i]').forEach(b => b.onclick = () => { const f = R[+b.dataset.i].f; lookAt = {x: f.x, y: hAt(f.x, f.y) + (f.z || 4), z: f.y, until: performance.now() + 3500}; togglePanel(false); });
  }
  if (tab === 'light') {
    const L = sky.look;
    const sl = (k, lab, min, max, step, val) => `<label class="sl"><span>${lab}<b id="v_${k}">${(+val).toFixed(step < 1 ? 2 : 0)}</b></span><input type="range" id="r_${k}" min="${min}" max="${max}" step="${step}" value="${val}"></label>`;
    B.innerHTML = `<div class="presets">${Object.keys(SD.presets).map(p => `<button class="chipb" data-p="${p}">${p}</button>`).join('')}</div>
      ${sl('el', 'sun / moon elevation °', -20, 75, 1, L.el)}${sl('az', 'bearing ° (90 = east)', 0, 360, 1, L.az ?? 120)}
      ${sl('key_i', 'key light', 0, 2.5, 0.05, L.key_i)}${sl('amb_i', 'fill', 0, 1.5, 0.05, L.amb_i)}
      ${sl('exp', 'exposure', 0.3, 2.5, 0.05, L.exp)}${sl('far', 'fog distance m', 150, 6000, 10, L.far)}
      ${sl('stars', 'stars', 0, 1.5, 0.05, L.stars)}${sl('rain', 'rain', 0, 1, 0.05, L.rain || 0)}
      <div class="row"><button class="btn" id="lbible">THE POEM’S LIGHT</button><button class="btn" id="lfield">LIGHT FOLLOWS THE JOURNEY</button><button class="btn ${htOn ? 'gold' : ''}" id="lht">HALFTONE</button></div>
      <p class="note">${manual ? 'manual light — the field is paused' : 'the light is the journey’s: each place keeps its poem’s hour'}</p>`;
    B.querySelectorAll('.chipb').forEach(b => b.onclick = () => { manual = {...SD.presets[b.dataset.p]}; fillPanel(s); });
    for (const k of ['el', 'az', 'key_i', 'amb_i', 'exp', 'far', 'stars', 'rain']) {
      const r = $('r_' + k); paintRange(r);
      r.oninput = () => { manual = {...(manual || sky.look), [k]: +r.value}; if (k === 'far') manual.near = +r.value * 0.12; $('v_' + k).textContent = (+r.value).toFixed(+r.step < 1 ? 2 : 0); paintRange(r); };
    }
    $('lbible').onclick = () => { manual = {...s.light}; fillPanel(s); };
    $('lfield').onclick = () => { manual = null; fillPanel(s); };
    $('lht').onclick = () => { toggleHT(); fillPanel(s); };
  }
  if (tab === 'sources') {
    const stills = s.pieces.flatMap(p => p.shots.filter(x => x.still));
    B.innerHTML = `<p class="note">The scene assembles from four kinds of pieces. Play it as any of them, or cut between them.</p>
      <h4>staged · this set</h4><p class="note">walk it, light it, frame it (SHOOT), take stills; the shot list exports as MENTO for the Odyssey tools.</p>
      <h4>generated · ${stills.length} stills</h4><div class="stills">${stills.map(x => `<figure><img loading="lazy" src="${x.still}" alt="" title="${(x.ekphrasis || '').replace(/"/g, '')}"><figcaption>${x.id}</figcaption></figure>`).join('')}</div>
      ${s.sources.halfworld ? `<h4>rendered · the halfworld film of the poem</h4><video controls preload="none" playsinline src="${s.sources.halfworld}"></video>` : ''}
      <h4>the voice</h4>${s.sources.reading ? `<audio controls preload="none" src="../../${s.sources.reading}"></audio>` : ''}
      <h4>archival · to forage</h4><p class="note">search the moving-image archives for: ${[s.analog.split(/[;(]/)[0], ...(s.motifs || []).slice(0, 4)].map(q => `<a target="_blank" rel="noopener" href="https://archive.org/search?query=${encodeURIComponent(q.trim())}&mediatype=movies">${q.trim()}</a>`).join(' · ')}</p>`;
  }
}
function paintRange(r) { const p = (r.value - r.min) / (r.max - r.min) * 100; r.style.setProperty('--p', p + '%'); }

// ── SHOOT: camera stands, lens, letterbox, stills ──
let shoot = null, lookAt = null;
function shootToggle() {
  if (shoot) { shoot = null; document.body.classList.remove('shooting'); return; }
  const s = activeSet() || nearestSet(); shootAt(s, 0);
}
function shootAt(s, k) {
  togglePanel(false);
  shoot = {s, k, st: standFor(s, k), t0: performance.now()};
  document.body.classList.add('shooting');
  const p = s.pieces[k];
  $('slate').innerHTML = `<b>${s.num}-${k + 1}</b> ${p.name} <span>${p.camera}</span>`;
  const still = p.shots.find(x => x.still);
  $('cmp').src = still ? still.still : ''; $('cmp').style.display = still ? '' : 'none';
}
function shootStep(d) { if (!shoot) return; const n = shoot.s.pieces.length; shootAt(shoot.s, (shoot.k + d + n) % n); }
$('sprev').onclick = () => shootStep(-1); $('snext').onclick = () => shootStep(1); $('sexit').onclick = () => shootToggle();
$('lens').oninput = e => { camera.fov = +e.target.value; camera.updateProjectionMatrix(); $('lensv').textContent = e.target.value; paintRange(e.target); };
paintRange($('lens'));
$('snap').onclick = () => {
  render();
  renderer.domElement.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `wygwyl-${shoot ? shoot.s.num + '-' + (shoot.k + 1) : 'still'}.png`; a.click(); });
};
function mento(s) {
  const L = [`0 !MENTO SET WORLD wygwyl-island TIME ${s.light.name} WEATHER ${s.light.rain ? 'rain' : 'clear'}`, `0 // ${s.num} ${s.title} — ${s.place} · units: island metres (x east, y up, z south)`];
  s.pieces.forEach((p, k) => {
    const st = standFor(s, k); const sec = Math.max(3, Math.round(((s.pieces[k + 1] && s.pieces[k + 1].t) || s.duration) - (p.t || 0)));
    L.push(`0 !MENTO SHOT "${s.num}-${k + 1} ${p.name.replace(/"/g, '')}" POS ${st.x.toFixed(1)} ${st.z.toFixed(1)} ${st.y.toFixed(1)} TGT ${st.tx.toFixed(1)} ${st.tz.toFixed(1)} ${st.ty.toFixed(1)} LENS ${camera.fov | 0} SEC ${sec}`);
  });
  return L.join('\n');
}

// ── PLAY THE SCENE: the reading drives the cut ──
const audio = new Audio(); audio.preload = 'none';
let scn = null;
async function sceneStart(s, mode) {
  togglePanel(false);
  const tj = await fetch(`../../timings/${s.num}.json`).then(r => r.json()).catch(() => ({segments: []}));
  const cuts = s.pieces.map((p, k) => ({k, t: p.t != null ? p.t : k * s.duration / s.pieces.length})).sort((a, b) => a.t - b.t);
  const looks = readSeen(s).filter(r => r.f && r.t != null && r.ok).map(r => ({t: r.t, f: r.f, word: r.type}));
  scn = {s, mode, cuts, looks, segs: tj.segments, k: -1, n: 0};
  document.body.classList.add('playing');
  audio.src = '../../' + s.sources.reading; audio.currentTime = 0; audio.play().catch(() => {});
  audio.onended = sceneStop;
}
function sceneStop() { scn = null; audio.pause(); document.body.classList.remove('playing'); $('still').classList.remove('on'); $('cap').textContent = ''; shoot = null; document.body.classList.remove('shooting'); }
function sceneToggle() { if (scn) sceneStop(); else { const s = activeSet() || nearestSet(); sceneStart(s, 'mixed'); } }
$('sstop').onclick = sceneStop;
function sceneTick() {
  const t = audio.currentTime, s = scn.s;
  let c = null; for (const x of scn.cuts) if (x.t <= t) c = x;
  if (c && c.k !== scn.k) {
    scn.k = c.k; scn.n++;
    const p = s.pieces[c.k]; const still = p.shots.filter(x => x.still);
    const useStill = scn.mode === 'generated' || (scn.mode === 'mixed' && scn.n % 2 === 0 && still.length);
    if (useStill && still.length) { $('still').src = still[0].still; $('still').classList.add('on'); }
    else { $('still').classList.remove('on'); shoot = {s, k: c.k, st: standFor(s, c.k), t0: performance.now()}; }
    $('slate').innerHTML = `<b>${s.num}-${c.k + 1}</b> ${p.name}`;
  }
  const seg = scn.segs.find(x => x.start <= t && t <= x.end + 0.4);
  $('cap').textContent = seg ? seg.text.trim() : '';
  const lk = scn.looks.find(x => t >= x.t && t < x.t + 1.8);
  if (lk && !$('still').classList.contains('on')) { lookAt = {x: lk.f.x, y: hAt(lk.f.x, lk.f.y) + 4, z: lk.f.y, until: performance.now() + 400}; $('seen').textContent = 'he sees: ' + lk.word; $('seen').classList.add('on'); }
  else $('seen').classList.remove('on');
}

// ── map, minimap ──
const mapEl = $('map'), wrap = $('mapwrap');
const meDot = document.createElement('div'); meDot.className = 'me'; wrap.appendChild(meDot);
for (const s of SETS) {
  const b = document.createElement('button'); b.className = 'pm'; b.textContent = +s.num; b.title = s.title;
  b.style.left = (s.x / W * 100) + '%'; b.style.top = (s.y / H * 100) + '%';
  b.onclick = e => { e.stopPropagation(); travel(s); toggleMap(false); };
  wrap.appendChild(b);
}
$('maplist').innerHTML = SETS.map(s => `<button data-n="${s.num}"><b>${s.num}</b> ${s.title}<span>${s.light.name}</span></button>`).join('');
$('maplist').querySelectorAll('button').forEach(b => b.onclick = e => { e.stopPropagation(); travel(BYNUM[b.dataset.n]); toggleMap(false); });
function toggleMap(on) { on = on ?? !mapEl.classList.contains('on'); mapEl.classList.toggle('on', on); meDot.style.left = (S.x / W * 100) + '%'; meDot.style.top = (S.y / H * 100) + '%'; }
mapEl.onclick = e => { if (e.target === mapEl) toggleMap(false); };
const mini = $('mini'), mctx = mini.getContext('2d'), mimg = new Image(); mimg.src = 'minimap.jpg';
function drawMini() {
  const Wp = mini.width, sc = mimg.width / W, k = Wp / (0.11 * W * sc) / 3.4, hd = S.mode === 'drive' ? S.hd : S.yaw;
  mctx.save(); mctx.clearRect(0, 0, Wp, Wp); mctx.beginPath(); mctx.arc(Wp / 2, Wp / 2, Wp / 2, 0, 7); mctx.clip();
  mctx.fillStyle = '#3d7d97'; mctx.fillRect(0, 0, Wp, Wp);
  mctx.translate(Wp / 2, Wp / 2); mctx.rotate(-hd); mctx.scale(k, k);
  if (mimg.complete) mctx.drawImage(mimg, -S.x * sc, -S.y * sc);
  for (const s of SETS) {
    mctx.save(); mctx.translate((s.x - S.x) * sc, (s.y - S.y) * sc); mctx.rotate(hd);
    mctx.strokeStyle = 'rgba(255,210,63,.6)'; mctx.lineWidth = 1.5 / k; mctx.beginPath(); mctx.arc(0, 0, s.foot * sc, 0, 7); mctx.stroke();
    mctx.fillStyle = '#121008'; mctx.strokeStyle = '#ffd23f'; mctx.lineWidth = 2 / k; mctx.beginPath(); mctx.arc(0, 0, 11 / k, 0, 7); mctx.fill(); mctx.stroke();
    mctx.fillStyle = '#ffd23f'; mctx.font = `700 ${12 / k}px Helvetica`; mctx.textAlign = 'center'; mctx.textBaseline = 'middle'; mctx.fillText(+s.num, 0, 0.5 / k); mctx.restore();
  }
  mctx.restore();
  mctx.fillStyle = '#ff3d6e'; mctx.beginPath(); mctx.moveTo(Wp / 2, Wp / 2 - 12); mctx.lineTo(Wp / 2 + 8, Wp / 2 + 9); mctx.lineTo(Wp / 2 - 8, Wp / 2 + 9); mctx.fill();
}

// ── travel ──
function travel(s, onFoot) {
  const r = nearestRoad(s.x, s.y, 2000);
  let p = r && r.d < 400 ? r : {x: s.x + s.built.front.x * (s.foot + 6), y: s.y + s.built.front.y * (s.foot + 6), hd: 0};
  if (hitsBuilding(p.x, p.y) || hAt(p.x, p.y) < 0.3) p = {x: s.x + s.built.front.x * (s.foot + 6), y: s.y + s.built.front.y * (s.foot + 6), hd: 0};
  S.level = null; S.fall = null;
  if (onFoot || S.mode === 'walk') {
    S.mode = 'walk'; poet.visible = true; $('bio').textContent = 'IN';
    S.cx = p.x; S.cy = p.y; S.chd = p.hd;
    S.x = s.x + s.built.front.x * (s.foot * 0.5); S.y = s.y + s.built.front.y * (s.foot * 0.5); S.z = Math.max(hAt(S.x, S.y), 0);
    S.yaw = Math.atan2(s.x - S.x, -(s.y - S.y));
  } else { S.mode = 'drive'; S.x = p.x; S.y = p.y; S.hd = p.hd; S.v = 0; poet.visible = false; }
  S.last = [S.x, S.y]; first = true;
}

// ── toast ──
let toastT = 0;
function toast(k, t, l) { $('tn').textContent = k; $('tt').textContent = t; $('tl').textContent = l; $('toast').classList.add('on'); toastT = performance.now(); }
let htOn = false; function toggleHT() { htOn = !htOn; $('bht').classList.toggle('gold', htOn); }

// ── frame ──
let camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), first = true;
function place(dt) {
  const veh = S.veh === 'bike' ? bike : car;
  car.visible = S.veh === 'car'; bike.visible = S.veh === 'bike';
  if (S.mode === 'drive') {
    const br = onBridge(S.x, S.y), gz = br !== null ? Math.max(br, hAt(S.x, S.y)) : Math.max(hAt(S.x, S.y), -1.1);
    S.z += (gz - S.z) * (first ? 1 : 0.35);
    const fx = Math.sin(S.hd), fy = -Math.cos(S.hd);
    veh.position.set(S.x, S.z, S.y); veh.rotation.set(0, 0, 0); veh.rotateY(-S.hd);
    if (br === null) { veh.rotateX(Math.atan2(hAt(S.x + fx * 2, S.y + fy * 2) - hAt(S.x - fx * 2, S.y - fy * 2), 4)); }
    S.yaw = S.hd;
  } else {
    veh.position.set(S.cx, Math.max(hAt(S.cx, S.cy), 0), S.cy); veh.rotation.set(0, -S.chd, 0);
    poet.position.set(S.x, S.z, S.y); poet.rotation.y = -S.hd;
  }
  const fx = Math.sin(S.yaw), fy = -Math.cos(S.yaw);
  let want, look;
  if (shoot) {
    const st = shoot.st; const tt = (performance.now() - shoot.t0) / 1000;
    const drift = st.move === 'track' ? Math.min(6, tt * 0.6) : st.move === 'handheld' ? Math.sin(tt * 1.7) * 0.15 : 0;
    const dx = st.tx - st.x, dy = st.ty - st.y, L = Math.hypot(dx, dy) || 1;
    want = new THREE.Vector3(st.x + dx / L * drift + (st.move === 'handheld' ? Math.sin(tt * 2.3) * 0.08 : 0), st.z, st.y + dy / L * drift);
    look = new THREE.Vector3(st.tx, st.tz, st.ty);
    camPos.copy(want); camLook.lerp(look, first ? 1 : 0.25); first = false;
  } else {
    const walkCam = S.mode === 'walk';
    const back = walkCam ? (touchy ? 5 : 4.2) : [13, 34, 5][S.cam], up = walkCam ? 1.4 + S.pitch * 4 : [5.5, 18, 2.3][S.cam], ahead = walkCam ? 6 : [10, 30, 30][S.cam];
    const by = S.mode === 'drive' ? S.z : S.z + 1.5;
    want = new THREE.Vector3(S.x - fx * back, 0, S.y - fy * back);
    want.y = Math.max(by + up, (S.level ? S.level.z : hAt(want.x, want.z)) + 1.2);
    look = new THREE.Vector3(S.x + fx * ahead, by + (walkCam ? 0.4 - S.pitch * 2 : 1.5), S.y + fy * ahead);
    if (first) { camPos.copy(want); camLook.copy(look); first = false; }
    camPos.lerp(want, walkCam ? 0.18 : 0.12); camLook.lerp(look, 0.2);
  }
  if (lookAt && performance.now() < lookAt.until) camLook.lerp(new THREE.Vector3(lookAt.x, lookAt.y, lookAt.z), 0.08); else lookAt = null;
  camera.position.copy(camPos); camera.lookAt(camLook);
}
function render() { if (htOn) halftone.render(scene, camera); else renderer.render(scene, camera); }

travel(BYNUM['01']);
say('ready'); $('go').disabled = false; $('go').textContent = 'BEGIN AT THE SEVERN';
let running = false;
$('go').onclick = () => { $('start').style.display = 'none'; running = true; toast('01 · OUT OF LIFE', 'The Severn', 'F gets you out of the car · E opens doors · TAB the set'); };
let t0 = performance.now(), frame = 0;
function loop(t) {
  const dt = Math.min(0.05, (t - t0) / 1000); t0 = t;
  if (running && !mapEl.classList.contains('on') && !shoot && !scn) (S.mode === 'drive' ? drive : walk)(dt);
  place(dt);
  if (scn) sceneTick();
  if (frame % 3 === 0) sky.set(lightTarget(), first ? 1 : 0.06);
  sky.update(camera, dt, new THREE.Vector3(S.x, S.z, S.y));
  for (const s of SETS) for (const c of s.built.cast) { c.userData.sway += dt; c.rotation.z = Math.sin(c.userData.sway * 1.3) * 0.03; }
  if (frame++ % 6 === 0) {
    const s = activeSet(); onSet(s);
    const lk = sky.look || {};
    $('hreg').textContent = s ? `SET ${s.num} · ${s.light.name}` : 'THE ISLAND';
    $('hplace').textContent = s ? s.title : (S.mode === 'walk' ? 'on foot' : 'driving');
    $('hspd').textContent = S.mode === 'drive' ? Math.round(Math.abs(S.v) * 3.6) + ' km/h' : (S.level ? S.level.label : '');
    const d = S.mode === 'walk' ? nearDoor() : null, b = S.mode === 'walk' && !d ? nearBike() : null;
    $('hint').textContent = d ? `E · ${d.label}` : b ? 'E · take the motorcycle' : (S.mode === 'walk' && Math.hypot(S.x - S.cx, S.y - S.cy) < 5 && !S.level ? 'F · get in' : '');
    $('hint').classList.toggle('on', !!$('hint').textContent);
    $('bact').classList.toggle('lit', !!(d || b));
    drawMini();
  }
  if (performance.now() - toastT > 6000) $('toast').classList.remove('on');
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
window.__island = {S, travel, SETS, hAt, meta, readSeen, standFor, sky};
