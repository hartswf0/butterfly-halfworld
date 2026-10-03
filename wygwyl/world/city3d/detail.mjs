// THE LIVED-IN LAYER — drawn only where you are.
// Within a ring around the camera the city grows its everyday: stoops and marble steps, back stairs, AC units, water tanks,
// antennas and dishes, laundry over the alleys, wires across the streets, bins, boarded windows on the ruins, scaffolding
// on the houses being repaired. Built per 120 m tile, deterministic per building, dropped when you leave.
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

const hash = (a, b = 0) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
function kit(parts) {
  return mergeGeometries(parts.map(([geo, c, x = 0, y = 0, z = 0, ry = 0, rz = 0, rx = 0]) => {
    const g = (geo.index ? geo.toNonIndexed() : geo); g.rotateX(rx); g.rotateZ(rz); g.rotateY(ry); g.translate(x, y, z);
    const C = new THREE.Color(c), a = new Float32Array(g.attributes.position.count * 3); for (let i = 0; i < a.length; i += 3) { a[i] = C.r; a[i + 1] = C.g; a[i + 2] = C.b; }
    g.setAttribute('color', new THREE.BufferAttribute(a, 3)); for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'color'].includes(k)) g.deleteAttribute(k); return g; }));
}
const bx = (w, h, d) => new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
const cy = (r1, r2, h, s = 8) => new THREE.CylinderGeometry(r1, r2, h, s).translate(0, h / 2, 0);
const IRON = 0x1e2124, MARBLE = 0xe4e0d6;
// local frame: x along the frontage, front of the building is −z, y up from the building's ground
const KITS = {
  stoop: () => kit([[bx(1.8, 0.4, 0.9), MARBLE, 0, 0, -0.45], [bx(1.8, 0.8, 0.6), MARBLE, 0, 0, -0.15], [bx(1.8, 1.2, 0.35), MARBLE, 0, 0, 0.12],
    [cy(0.025, 0.025, 1.0, 4), IRON, -0.9, 0.4, -0.7], [cy(0.025, 0.025, 1.0, 4), IRON, 0.9, 0.4, -0.7], [bx(0.05, 0.05, 1.3), IRON, -0.9, 1.4, -0.2], [bx(0.05, 0.05, 1.3), IRON, 0.9, 1.4, -0.2]]),
  backstair: () => { const P = []; for (let f = 0; f < 4; f++) { const y = 1 + f * 3.2, s = f % 2 ? 1 : -1; P.push([bx(2.6, 0.08, 1.1), IRON, 0, y, 0], [bx(2.6, 0.05, 0.05), IRON, 0, y + 0.95, 0.55]);
      P.push([bx(0.5, 0.08, 3.6), IRON, 0, y + 1.6, 0.2, 0, 0, s * 0]); const st = new THREE.BoxGeometry(3.4, 0.08, 0.8); st.rotateZ(s * Math.atan2(3.2, 3)); P.push([st, IRON, 0, y + 1.6, 0.2]); }
    return kit(P); },
  ac: () => kit([[bx(0.85, 0.55, 0.6), 0xd6d2c8], [bx(0.7, 0.4, 0.02), 0x6b6b6b, 0, 0.07, -0.31], [bx(0.9, 0.04, 0.7), 0x8a8478, 0, -0.02, 0]]),
  tank: () => kit([...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => [cy(0.08, 0.08, 2.4, 4), IRON, a * 1.3, 0, b * 1.3]), [bx(3, 0.2, 3), 0x3a2c22, 0, 2.4, 0],
    [cy(1.6, 1.6, 3.6, 14), 0x6a4a32, 0, 2.6, 0], [new THREE.ConeGeometry(1.75, 1.2, 14).translate(0, 6.8, 0), 0x3d3d3d]]),
  antenna: () => kit([[cy(0.03, 0.04, 4.5, 4), 0x9a9a9a], ...[1.6, 2.6, 3.6].map(y => [bx(1.6 - y * 0.2, 0.03, 0.03), 0x9a9a9a, 0, y, 0]),
    [new THREE.SphereGeometry(0.45, 10, 6, 0, Math.PI * 2, 0, 0.9).rotateX(-1.2), 0xdedcd5, 1.2, 0.6, 0], [cy(0.04, 0.04, 0.6, 4), 0x9a9a9a, 1.2, 0, 0]]),
  laundry: () => kit([[cy(0.04, 0.05, 4.2, 4), 0x5a4a3a, -3.5, 0, 0], [cy(0.04, 0.05, 4.2, 4), 0x5a4a3a, 3.5, 0, 0], [bx(7, 0.015, 0.015), 0xdddddd, 0, 4.0, 0],
    ...[[-2.6, 0xe8e2d0], [-1.6, 0xb33a2e], [-0.5, 0x3a6fa8], [0.6, 0xf0d060], [1.6, 0xe8e2d0], [2.5, 0x5a8a4a]].map(([x, c], i) => [bx(0.7 + (i % 2) * 0.3, 0.9 + (i % 3) * 0.3, 0.02), c, x, 4.0 - 0.9 - (i % 3) * 0.3, 0])]),
  bins: () => kit([[bx(0.7, 1.0, 0.7), 0x2f4a2f, 0], [bx(0.75, 0.06, 0.75), 0x1f2f1f, 0, 1.0, 0], [bx(0.7, 1.0, 0.7), 0x3a3a40, 0.85], [bx(1.6, 1.3, 1.0), 0x2d5a7a, -1.4], [bx(0.5, 0.35, 0.4), 0x2a2a2a, 0.4, 0, -0.8]]),
  boards: () => kit([[bx(1.5, 0.22, 0.04), 0x8a6a46, 0, 0, 0, 0, 0.5], [bx(1.5, 0.22, 0.04), 0x7a5a3a, 0, 0, 0, 0, -0.5], [bx(1.5, 0.22, 0.04), 0x8a6a46, 0, -0.35, 0]]),
  scaffold: () => { const P = []; for (let x = -2; x <= 2; x++) P.push([cy(0.04, 0.04, 12, 4), 0x9aa0a6, x * 1.25, 0, 0]); for (let y = 1.6; y < 12; y += 2) { P.push([bx(5.2, 0.05, 0.05), 0x9aa0a6, 0, y, 0], [bx(5.2, 0.04, 0.9), 0x6a5038, 0, y - 0.05, 0.45]); }
    P.push([bx(5.4, 6, 0.02), 0x2f6f8a, 0, 6, -0.1]); return kit(P); },
  awning: () => kit([[bx(3.2, 0.06, 1.4), 0xb8322a, 0, 0, 0, 0, 0, -0.32], [bx(3.2, 0.35, 0.03), 0xf1ece0, 0, -0.35, -0.68]]),
};
const STYLE_OLD = 0, STYLE_ROW = 1, STYLE_TOWER = 3;

export function makeDetail(scene, C, S, blds, opts = {}) {
  const B = C.bld, n = B.length / 14, R = opts.radius || 420, CELL = 120;
  const mat = new THREE.MeshStandardMaterial({vertexColors: true, roughness: 0.75, metalness: 0.1, side: THREE.DoubleSide});
  const meshes = {}; for (const k of Object.keys(KITS)) { const m = new THREE.InstancedMesh(KITS[k](), mat, 7000); m.count = 0; m.castShadow = k !== 'boards'; m.receiveShadow = true; m.frustumCulled = false; meshes[k] = m; scene.add(m); }
  const wires = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({color: 0x101214})); wires.frustumCulled = false; scene.add(wires);
  const grid = new Map(); for (let k = 0; k < n; k++) { const key = Math.floor(B[k * 14] / CELL) + ',' + Math.floor(B[k * 14 + 1] / CELL); (grid.get(key) || grid.set(key, []).get(key)).push(k); }
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), Sc = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
  const tiles = new Map(); let era = -1, lastKey = '', hidden = () => false;
  const TL = new THREE.TextureLoader(), TX = new Map(); const texFor = cid => { if (!TX.has(cid)) { const t = TL.load(`../iconic/c/${cid}.webp`); t.colorSpace = THREE.SRGBColorSpace; TX.set(cid, t); } return TX.get(cid); };
  const frameMat = new THREE.MeshStandardMaterial({color: 0xf1eee7, roughness: 0.4}), saltMat = new THREE.MeshStandardMaterial({color: 0xecebe4, roughness: 0.3});
  const frames = []; for (let i = 0; i < 24; i++) { const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.12, 0.06), frameMat));
    const img = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.92), new THREE.MeshBasicMaterial({color: 0xdddddd})); img.position.z = 0.035; g.add(img); g.userData.img = img;
    const ln = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.03, 0.07), saltMat); ln.position.y = -0.56 + 1.12 * 0.4; ln.position.z = 0.01; g.add(ln); g.visible = false; frames.push(g); scene.add(g); }
  function local(x, y, gz, rot, lx, ly, lz) { const c = Math.cos(-rot), s = Math.sin(-rot); return [x + lx * c + lz * s, gz + ly, y - lx * s + lz * c]; }   // local → world (the buildings' own rotation)
  function tile(key) {
    const out = {}; for (const k of Object.keys(KITS)) out[k] = []; out.wire = []; out.frames = [];
    for (const k of grid.get(key) || []) {
      const st = blds.userData.state(k, era); if (!st || hidden(k)) continue;
      const o = k * 14, x = B[o], y = B[o + 1], w = B[o + 2], d = B[o + 3], rot = B[o + 4], h = B[o + 5], sty = B[o + 6], gz = B[o + 13];
      const put = (kind, lx, ly, lz, ry = 0, sx = 1, sy = 1, sz = 1) => { const [wx, wy, wz] = local(x, y, gz, rot, lx, ly, lz); Q.setFromAxisAngle(Y, -rot + ry); M4.compose(V.set(wx, wy, wz), Q, Sc.set(sx, sy, sz)); out[kind].push(M4.clone()); };
      const r = i => hash(k, i);
      const ruin = st === 'ruin', fh = sty === 1 ? 3.1 : sty === 0 ? 3.4 : 3.7;
      if (ruin) { const bays = Math.max(1, Math.floor(w / 3.3)); for (let b = 0; b < bays; b++) if (r(40 + b) < 0.7) put('boards', -w / 2 + (b + 0.5) * w / bays, fh * 1.55, -d / 2 - 0.05); continue; }
      if (sty === STYLE_ROW || sty === STYLE_OLD) {
        if (sty === STYLE_ROW || r(1) < 0.4) put('stoop', w * 0.25, 0, -d / 2 - 0.6);
        if (r(2) < 0.22 && h > 9) put('backstair', 0, 0, d / 2 + 0.6, 0, 1, Math.min(1.6, h / 13), 1);
        if (r(3) < 0.3) put('laundry', 0, 0, d / 2 + 2.4);
        if (r(4) < 0.35) put('bins', -w * 0.2, 0, d / 2 + 1.0);
        if (r(5) < 0.25 && sty === STYLE_OLD) put('awning', 0, fh * 0.92, -d / 2 - 0.7);
        if (r(6) < 0.3) { const [ax, ay, az] = local(x, y, gz, rot, -w / 2 + 0.3, h - 0.6, -d / 2); const [bx2, by, bz] = local(x, y, gz, rot, -w / 2 + 0.3 + (r(7) - 0.5) * 6, h - 1.2, -d / 2 - 15);
          for (let s = 0; s < 6; s++) { const t0 = s / 6, t1 = (s + 1) / 6, sag = t => -Math.sin(t * Math.PI) * 1.1; out.wire.push(ax + (bx2 - ax) * t0, ay + (by - ay) * t0 + sag(t0), az + (bz - az) * t0, ax + (bx2 - ax) * t1, ay + (by - ay) * t1 + sag(t1), az + (bz - az) * t1); } }
      }
      if (sty <= 4 && sty !== 2) { const acs = Math.floor(r(8) * Math.min(6, h / 4)); for (let a = 0; a < acs; a++) put('ac', -w / 2 + 0.6 + r(9 + a) * (w - 1.2), fh * (1.4 + Math.floor(r(19 + a) * Math.max(1, h / fh - 1.6))), -d / 2 - 0.3); }
      if ((sty <= 1 && r(10) < 0.12) || (sty === STYLE_TOWER && r(10) < 0.35)) put('tank', (r(11) - 0.5) * w * 0.4, h, (r(12) - 0.5) * d * 0.4);
      if (sty <= 4 && r(13) < 0.35) put('antenna', (r(14) - 0.5) * w * 0.6, h, (r(15) - 0.5) * d * 0.6, r(16) * 6);
      if ((sty <= 1) && r(31) < 0.06) { const [fx, fy, fz] = local(x, y, gz, rot, (r(32) - 0.5) * w * 0.5, 2.3, -d / 2 - 0.07); out.frames.push({x: fx, y: fz, z: fy, rot}); }   // the Archive on the street
      if (st === 'rebuilt in glass' && r(17) < 0.55) put('scaffold', 0, 0, -d / 2 - 1.0, 0, w / 5.4, Math.min(2.5, (h + 6) / 12), 1);
    }
    return out;
  }
  function refresh(focus, force) {
    const cx = Math.floor(focus.x / CELL), cz = Math.floor(focus.z / CELL), key = cx + ',' + cz;
    if (!force && key === lastKey) return; lastKey = key;
    const want = new Set(), rr = Math.ceil(R / CELL);
    for (let i = -rr; i <= rr; i++) for (let j = -rr; j <= rr; j++) if (Math.hypot(i, j) * CELL <= R + CELL) want.add((cx + i) + ',' + (cz + j));
    for (const k of [...tiles.keys()]) if (!want.has(k)) tiles.delete(k);
    for (const k of want) if (!tiles.has(k)) tiles.set(k, tile(k));
    for (const kind of Object.keys(KITS)) { const m = meshes[kind]; let c = 0; for (const t of tiles.values()) for (const mm of t[kind]) { if (c >= 7000) break; m.setMatrixAt(c++, mm); } m.count = c; m.instanceMatrix.needsUpdate = true; }
    const fr = []; for (const t of tiles.values()) for (const f of t.frames) fr.push(f); fr.sort((a, b) => Math.hypot(a.x - focus.x, a.y - focus.z) - Math.hypot(b.x - focus.x, b.y - focus.z));
    frames.forEach((g, i) => { const f = fr[i]; if (!f) { g.visible = false; return; } g.visible = true; g.position.set(f.x, f.z, f.y); g.rotation.y = -f.rot + Math.PI;
      let best = null, bd = 1e12; for (const s of C.meta.shots) { const dd = (s.x - f.x) ** 2 + (s.y - f.y) ** 2; if (dd < bd) { bd = dd; best = s; } }   // the shot taken nearest this wall
      if (best && g.userData.cid !== best.cid) { g.userData.cid = best.cid; g.userData.img.material.map = texFor(best.cid); g.userData.img.material.needsUpdate = true; } });
    const wp = []; for (const t of tiles.values()) for (const v of t.wire) wp.push(v);
    wires.geometry.dispose(); wires.geometry = new THREE.BufferGeometry(); wires.geometry.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3));
  }
  return {
    setEra(e, hide) { era = e; if (hide) hidden = hide; tiles.clear(); lastKey = ''; },
    update(focus) { refresh(focus); },
    count() { return Object.fromEntries(Object.entries(meshes).map(([k, m]) => [k, m.count])); },
    set visible(v) { Object.values(meshes).forEach(m => m.visible = v); wires.visible = v; frames.forEach(f => { if (!v) f.visible = false; }); },
  };
}
