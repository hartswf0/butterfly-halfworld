// THE HAND-MODELED STRUCTURES — the buildings that make this city that city.
// Each is drawn from a reference the shots keep returning to (the white vaulted hall, the lattice mast, the twin pillars in the
// desert, the chapel on the flat, the harbor café with masts, the tower and its fire escapes …) and each has a life:
// built in one era, ruined in another, sometimes reused. build(type, state) → Group, state ∈ intact | ruin | reuse.
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

const M = {};
function mat(name, c, o = {}) { return M[name] || (M[name] = new THREE.MeshStandardMaterial({color: c, roughness: o.r ?? 0.8, metalness: o.m ?? 0, emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1, side: o.side ?? THREE.FrontSide, transparent: !!o.t, opacity: o.t ?? 1})); }
export const MATS = () => ({
  white: mat('white', 0xeeeae0, {r: 0.7}), stucco: mat('stucco', 0xe8dfcc), stone: mat('stone', 0xb9a27e), cantera: mat('cantera', 0xc9b99a),
  tezontle: mat('tezontle', 0x8a3b2a), brick: mat('brick', 0x7a3426), darkbrick: mat('darkbrick', 0x4f2a22), grey: mat('grey', 0x8d8a84),
  concrete: mat('concrete', 0xa4a19a), steel: mat('steel', 0x3c4248, {r: 0.4, m: 0.7}), iron: mat('iron', 0x1d1f22, {r: 0.6, m: 0.6}),
  glass: mat('glass', 0x4d6f86, {r: 0.08, m: 0.9}), gold: mat('gold', 0xd2a33a, {r: 0.3, m: 1}), verdigris: mat('verdigris', 0x5f9c8a, {r: 0.5, m: 0.4}),
  roofred: mat('roofred', 0x8e3d2c), slate: mat('slate', 0x3a3d44), wood: mat('wood', 0x5a4030), rust: mat('rust', 0x6e3b22, {r: 0.9, m: 0.3}),
  orange: mat('orange', 0xd98a3a, {r: 0.4, m: 0.3}), canvasR: mat('canvasR', 0xb8322a, {side: THREE.DoubleSide}), canvasW: mat('canvasW', 0xf1ece0, {side: THREE.DoubleSide}),
  hull: mat('hull', 0x1f2a33), sail: mat('sail', 0xe6e0d0, {side: THREE.DoubleSide}), green: mat('green', 0x2f5a2a), grass: mat('grass', 0x4f7a34),
  bluelamp: mat('bluelamp', 0x2c5cff, {e: 0x2c5cff, ei: 2}), redlamp: mat('redlamp', 0xff2a1a, {e: 0xff2a1a, ei: 3}), warm: mat('warm', 0xffc070, {e: 0xffb060, ei: 2}),
  neon: mat('neon', 0xff2a40, {e: 0xff2a40, ei: 3}), rose: mat('rose', 0x6040a0, {e: 0x8050ff, ei: 0.6}), lantern: mat('lantern', 0xfff2c0, {e: 0xffe9a0, ei: 4, t: 0.85}),
});
export const NIGHTLIT = ['bluelamp', 'redlamp', 'warm', 'neon', 'rose', 'lantern'];

const G = THREE;
function add(g, geo, m, x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0) { const o = new G.Mesh(geo, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); g.add(o); return o; }
const box = (g, w, h, d, m, x = 0, y = 0, z = 0, ry = 0) => add(g, new G.BoxGeometry(w, h, d), m, x, y + h / 2, z, ry);
const cyl = (g, rt, rb, h, m, x = 0, y = 0, z = 0, s = 16) => add(g, new G.CylinderGeometry(rt, rb, h, s), m, x, y + h / 2, z);
const cone = (g, r, h, m, x = 0, y = 0, z = 0, s = 4, ry = Math.PI / 4) => add(g, new G.ConeGeometry(r, h, s), m, x, y + h / 2, z, ry);
const sph = (g, r, m, x = 0, y = 0, z = 0, half = false) => add(g, new G.SphereGeometry(r, 24, 12, 0, Math.PI * 2, 0, half ? Math.PI / 2 : Math.PI), m, x, y, z);
function rod(g, a, b, r, m) {                               // a thin member from a to b
  const A = new G.Vector3(...a), B = new G.Vector3(...b), L = A.distanceTo(B);
  const o = add(g, new G.CylinderGeometry(r, r, L, 5), m); o.position.copy(A).add(B).multiplyScalar(0.5);
  o.quaternion.setFromUnitVectors(new G.Vector3(0, 1, 0), B.clone().sub(A).normalize()); return o;
}
function prism(g, w, h, d, m, x = 0, y = 0, z = 0, ry = 0) {  // gable roof: ridge along x
  const s = new G.Shape(); s.moveTo(-d / 2, 0); s.lineTo(d / 2, 0); s.lineTo(0, h); s.lineTo(-d / 2, 0);
  const geo = new G.ExtrudeGeometry(s, {depth: w, bevelEnabled: false}); geo.translate(0, 0, -w / 2); geo.rotateY(Math.PI / 2);
  return add(g, geo, m, x, y, z, ry);
}
function jag(g, w, h, d, m, x, y, z, seed = 1) {           // a broken wall: a box whose top is bitten
  const geo = new G.BoxGeometry(w, h, d, Math.max(2, Math.round(w / 2)), 3, Math.max(1, Math.round(d / 2)));
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) { const k = Math.sin(p.getX(i) * 1.7 + seed) * Math.cos(p.getZ(i) * 2.3 + seed * 3); p.setY(i, h / 2 - (0.5 + 0.5 * k) * h * 0.6); }
  geo.computeVertexNormals(); return add(g, geo, m, x, y + h / 2, z);
}
function textPlane(g, text, w, h, color, x, y, z, ry = 0, font = 'bold 110px Futura, Helvetica, Arial', bg = null) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = Math.round(1024 * h / w);
  const x2 = c.getContext('2d'); if (bg) { x2.fillStyle = bg; x2.fillRect(0, 0, c.width, c.height); }
  x2.font = font; x2.textAlign = 'center'; x2.textBaseline = 'middle'; x2.fillStyle = color; x2.shadowColor = color; x2.shadowBlur = 24;
  x2.fillText(text, c.width / 2, c.height / 2 + 6);
  const t = new G.CanvasTexture(c); t.colorSpace = G.SRGBColorSpace;
  const m = new G.MeshStandardMaterial({map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: 1.5, transparent: true, side: G.DoubleSide, depthWrite: false});
  m.userData.nightlit = true;
  return add(g, new G.PlaneGeometry(w, h), m, x, y, z, ry);
}
let clockFaces = [];
function clockFace(g, r, x, y, z, ry) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const t = new G.CanvasTexture(c); t.colorSpace = G.SRGBColorSpace;
  const m = new G.MeshStandardMaterial({map: t, emissiveMap: t, emissive: 0xfff0c8, emissiveIntensity: 0.0});
  m.userData.nightlit = 0.6; clockFaces.push({c, t}); return add(g, new G.CircleGeometry(r, 32), m, x, y, z, ry);
}
export function tickClocks(date) {                           // the clocks keep the city's time
  const h = date.getHours() % 12, mi = date.getMinutes();
  for (const {c, t} of clockFaces) {
    const x = c.getContext('2d'); x.fillStyle = '#f3ecd8'; x.beginPath(); x.arc(128, 128, 124, 0, 7); x.fill();
    x.strokeStyle = '#1b1b1b'; x.lineWidth = 8; x.stroke();
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; x.lineWidth = i % 3 ? 4 : 10; x.beginPath(); x.moveTo(128 + Math.sin(a) * 100, 128 - Math.cos(a) * 100); x.lineTo(128 + Math.sin(a) * 116, 128 - Math.cos(a) * 116); x.stroke(); }
    const hand = (a, L, w) => { x.lineWidth = w; x.beginPath(); x.moveTo(128, 128); x.lineTo(128 + Math.sin(a) * L, 128 - Math.cos(a) * L); x.stroke(); };
    hand((h + mi / 60) / 12 * Math.PI * 2, 62, 10); hand(mi / 60 * Math.PI * 2, 96, 6); t.needsUpdate = true;
  }
}

// ——— the builders ———
const B = {};
B.chapel = (g, m, st) => {                                   // the chapel on the tidal flat; its ruin; the white temple raised over the ruin
  if (st === 'intact') {
    box(g, 9, 9, 22, m.stucco, 0, 0, 0); prism(g, 22.6, 5, 9.8, m.roofred, 0, 9, 0, Math.PI / 2);
    box(g, 5.5, 20, 5.5, m.stucco, 0, 0, -13); cone(g, 4.2, 6, m.roofred, 0, 20, -13);
    box(g, 0.4, 3, 0.4, m.iron, 0, 26, -13); box(g, 1.8, 0.4, 0.4, m.iron, 0, 27.6, -13);
    box(g, 2.2, 3.6, 0.3, m.wood, 0, 0, -15.8); for (const s of [-1, 1]) for (let k = 0; k < 4; k++) box(g, 0.25, 2.6, 1.3, m.warm, s * 4.6, 3.5, -7 + k * 5);
    clockFace(g, 1.4, 0, 15, -15.8, Math.PI);
  } else {
    for (const s of [-1, 1]) jag(g, 0.8, 8, 22, m.stucco, s * 4.2, 0, 0, s + 2);
    jag(g, 9, 7, 0.8, m.stucco, 0, 0, 10.6, 5); jag(g, 5.5, 13, 5.5, m.stucco, 0, 0, -13, 7);
    for (let k = 0; k < 9; k++) box(g, 1 + (k % 3), 0.7, 0.9, m.stucco, Math.sin(k * 7) * 9, 0, Math.cos(k * 3) * 14, k);
    if (st === 'reuse') {                                    // the white temple: a ribbed vault built right over the ruin, the ruin kept inside it
      const R = 16, L = 64, shell = new G.CylinderGeometry(R, R, L, 40, 1, true, -Math.PI / 2, Math.PI);
      shell.rotateX(Math.PI / 2); add(g, shell, mat('vault', 0xf4f2ec, {r: 0.55, side: G.DoubleSide}), 0, 0, 4);
      for (let k = 0; k <= 16; k++) { const rib = new G.TorusGeometry(R + 0.35, 0.35, 6, 40, Math.PI); add(g, rib, m.white, 0, 0, 4 - L / 2 + k * L / 16); }
      for (let k = 0; k < 15; k++) for (const a of [0.55, 1.0, 1.45, 1.9, 2.35]) {
        const o = add(g, new G.PlaneGeometry(2.2, 1.1), m.lantern, Math.cos(a) * (R - 0.1), Math.sin(a) * (R - 0.1), 4 - L / 2 + 2 + k * L / 16);
        o.lookAt(0, 0, o.position.z); }
      const end = new G.CircleGeometry(R, 40, 0, Math.PI); add(g, end, mat('vaultend', 0xc9d6dc, {r: 0.1, m: 0.6, t: 0.5, side: G.DoubleSide}), 0, 0, 4 + L / 2);
      box(g, 36, 0.6, 72, m.concrete, 0, -0.3, 4);
    }
  }
};
B['clock tower'] = (g, m) => { box(g, 7, 30, 7, m.brick, 0, 0, 0); box(g, 8, 6, 8, m.stone, 0, 30, 0); for (let i = 0; i < 4; i++) clockFace(g, 2.6, Math.sin(i * Math.PI / 2) * 4.05, 33, Math.cos(i * Math.PI / 2) * 4.05, i * Math.PI / 2); cone(g, 5.8, 9, m.verdigris, 0, 36, 0); };
B['Bromo Seltzer Tower'] = (g, m) => {                       // a tall Florentine-style clock tower; the bottle on top glows blue
  box(g, 22, 14, 22, m.brick, 0, 0, 0); box(g, 12, 58, 12, m.stone, 0, 14, 0);
  for (let i = 0; i < 4; i++) { clockFace(g, 3.9, Math.sin(i * Math.PI / 2) * 6.6, 64, Math.cos(i * Math.PI / 2) * 6.6, i * Math.PI / 2); }
  box(g, 13.5, 12, 13.5, m.stone, 0, 58, 0); box(g, 14.5, 1.2, 14.5, m.cantera, 0, 70, 0);
  for (let i = 0; i < 4; i++) for (let k = -2; k <= 2; k++) { const a = i * Math.PI / 2; box(g, 1.2, 2, 1.2, m.cantera, Math.sin(a) * 6.8 + Math.cos(a) * k * 2.8, 71.2, Math.cos(a) * 6.8 - Math.sin(a) * k * 2.8); }
  cyl(g, 1.6, 2.4, 6, m.bluelamp, 0, 71, 0); cyl(g, 0.7, 1.4, 3, m.bluelamp, 0, 77, 0);
};
B['radio mast'] = (g, m) => {                                // the lattice mast with its red lights and guy wires
  const H = 150, r = 2.2, lv = 25;
  for (let i = 0; i < 3; i++) { const a = i * 2 * Math.PI / 3; rod(g, [Math.cos(a) * r, 0, Math.sin(a) * r], [Math.cos(a) * r * 0.6, H, Math.sin(a) * r * 0.6], 0.18, m.steel); }
  for (let k = 0; k < lv; k++) { const y0 = k * H / lv, y1 = (k + 1) * H / lv, s0 = 1 - 0.4 * y0 / H, s1 = 1 - 0.4 * y1 / H;
    for (let i = 0; i < 3; i++) { const a = i * 2 * Math.PI / 3, b = (i + 1) * 2 * Math.PI / 3;
      rod(g, [Math.cos(a) * r * s0, y0, Math.sin(a) * r * s0], [Math.cos(b) * r * s1, y1, Math.sin(b) * r * s1], 0.07, m.steel);
      rod(g, [Math.cos(a) * r * s1, y1, Math.sin(a) * r * s1], [Math.cos(b) * r * s1, y1, Math.sin(b) * r * s1], 0.07, m.steel); } }
  for (const y of [40, 80, 120, 150]) sph(g, 0.9, m.redlamp, 0, y, 0);
  for (let i = 0; i < 3; i++) { const a = i * 2 * Math.PI / 3 + 0.5; for (const y of [60, 120]) rod(g, [0, y, 0], [Math.cos(a) * y * 0.75, 0, Math.sin(a) * y * 0.75], 0.03, m.iron); }
  box(g, 8, 3.5, 6, m.concrete, 6, 0, 4);
};
B.ruins = (g, m) => {                                        // the twin pillars in the field, the lintel down between them
  for (const s of [-1, 1]) { box(g, 3.4, 1.6, 3.4, m.stone, s * 5, 0, 0); for (let k = 0; k < 6; k++) box(g, 2.6 - (k % 2) * 0.15, 2.2, 2.6, m.stone, s * 5, 1.6 + k * 2.2, 0, k * 0.05 * s);
    box(g, 3.6, 1, 3.6, m.cantera, s * 5, 14.8, 0); }
  add(g, new G.BoxGeometry(9, 1.6, 2.2), m.stone, 1, 0.8, 4.2, 0.35, 0, 0.12);
  for (let k = 0; k < 14; k++) box(g, 1 + (k % 3) * 0.6, 0.6 + (k % 2) * 0.6, 1 + (k % 4) * 0.3, m.stone, Math.sin(k * 2.1) * 16, 0, Math.cos(k * 1.3) * 14, k);
  for (let k = 0; k < 4; k++) jag(g, 8, 3, 1, m.stone, -20 + k * 12, 0, -14 + (k % 2) * 4, k);
};
B.pier = (g, m, st) => {                                     // the pier of black piles; the promenade with café awnings; a ship with masts moored at its head
  const L = 180;
  for (let z = 0; z <= L; z += 6) for (const s of [-1, 1]) if (st !== 'ruin' || (z * 7) % 5 > 1) cyl(g, 0.35, 0.35, 9, m.iron, s * 4.2, -6, z, 6);
  if (st === 'ruin') { for (let z = 0; z < L; z += 12) if ((z / 12) % 3 !== 1) box(g, 9, 0.5, 10, m.wood, 0, 2.6, z + 5); return; }
  box(g, 10, 0.6, L, m.wood, 0, 2.6, L / 2);
  for (let z = 6; z < L; z += 18) { cyl(g, 0.08, 0.1, 4.5, m.iron, 4.6, 3.2, z, 6); sph(g, 0.35, m.warm, 4.6, 7.8, z); cyl(g, 0.08, 0.1, 4.5, m.iron, -4.6, 3.2, z, 6); sph(g, 0.35, m.warm, -4.6, 7.8, z); }
  // the café at the root: tables under striped awnings
  box(g, 18, 4, 9, m.stucco, 0, 0, -14); for (let k = 0; k < 6; k++) add(g, new G.BoxGeometry(3, 0.12, 4), k % 2 ? m.canvasR : m.canvasW, -7.5 + k * 3, 4.6, -8.5, 0, -0.35);
  box(g, 16, 0.8, 0.2, m.neon, 0, 4.1, -9.55);
  for (let k = 0; k < 8; k++) { const x = -8 + (k % 4) * 5.2, z = -5 + Math.floor(k / 4) * 3.2; cyl(g, 0.5, 0.5, 0.06, m.white, x, 0.75, z); cyl(g, 0.05, 0.05, 0.75, m.iron, x, 0, z, 5); cyl(g, 0.03, 0.03, 2.4, m.wood, x, 0.8, z, 4); cone(g, 1.3, 0.6, k % 2 ? m.canvasR : m.canvasW, x, 3.0, z, 8); }
  // the ship: hull, deckhouse, three masts, yards, rigging
  const sx = 12, sz = L - 30; box(g, 7, 4, 42, m.hull, sx, -2.5, sz); box(g, 6.4, 0.4, 41, m.wood, sx, 1.5, sz); box(g, 4, 2.5, 7, m.white, sx, 1.9, sz + 12);
  for (const [dz, H] of [[-12, 30], [2, 34], [14, 26]]) { cyl(g, 0.25, 0.35, H, m.wood, sx, 1.9, sz + dz, 6);
    for (const y of [H * 0.45, H * 0.7, H * 0.9]) add(g, new G.CylinderGeometry(0.12, 0.12, 11 * (1.1 - y / H), 5), m.wood, sx, y + 1.9, sz + dz, 0, 0, Math.PI / 2);
    rod(g, [sx, H + 1.9, sz + dz], [sx, 2, sz - 21], 0.03, m.iron); rod(g, [sx, H + 1.9, sz + dz], [sx + 3.4, 2, sz + dz], 0.03, m.iron); rod(g, [sx, H + 1.9, sz + dz], [sx - 3.4, 2, sz + dz], 0.03, m.iron); }
};
B['tower block'] = (g, m) => {                               // the Severn: a brick slab and the zigzag of its fire escapes
  const W = 30, D = 14, F = 18, fh = 3.3;
  box(g, W, F * fh, D, m.brick, 0, 0, 0); box(g, W + 1, 1.2, D + 1, m.stone, 0, F * fh, 0); box(g, 5, 4, 5, m.brick, 8, F * fh + 1, 0);
  cyl(g, 2, 2, 4, m.wood, -8, F * fh + 1.2, 2, 10); cone(g, 2.3, 1.6, m.wood, -8, F * fh + 5.2, 2, 10);
  for (const x0 of [-9, 5]) for (let f = 1; f < F; f++) {    // each floor: a landing, a railing, a stair flight up to the next, alternating
    const y = f * fh, s = f % 2 ? 1 : -1;
    box(g, 4.4, 0.12, 1.4, m.iron, x0, y, D / 2 + 0.7); box(g, 4.4, 0.06, 0.06, m.iron, x0, y + 1, D / 2 + 1.4);
    for (let k = -2; k <= 2; k++) box(g, 0.05, 1, 0.05, m.iron, x0 + k * 1.1, y, D / 2 + 1.4);
    rod(g, [x0 - s * 1.9, y + 0.1, D / 2 + 0.9], [x0 + s * 1.9, y + fh, D / 2 + 0.9], 0.09, m.iron);
  }
};
B.lighthouse = (g, m) => {
  cyl(g, 4, 5.5, 4, m.stone, 0, 0, 0); for (let k = 0; k < 6; k++) cyl(g, 3.0 - k * 0.18, 3.18 - k * 0.18, 4.5, k % 2 ? m.roofred : m.white, 0, 4 + k * 4.5, 0, 20);
  cyl(g, 3.2, 3.2, 0.5, m.iron, 0, 31, 0, 20); cyl(g, 1.8, 1.8, 3, m.lantern, 0, 31.5, 0, 12); cone(g, 2.1, 2, m.iron, 0, 34.5, 0, 12);
  const beam = add(g, new G.ConeGeometry(14, 260, 24, 1, true), new G.MeshBasicMaterial({color: 0xfff1c0, transparent: true, opacity: 0.08, blending: G.AdditiveBlending, depthWrite: false, side: G.DoubleSide}), 0, 33, 0, 0, 0, Math.PI / 2);
  beam.geometry.translate(0, -130, 0); beam.userData.beam = true; beam.userData.nightonly = true;
};
B.bridge = (g, m, st, lm) => {                               // the suspension bridge; broken in the Fall; rebuilt
  const S = (lm.span || 800) + 60, deck = 26, tw = 95, half = S / 2, tx = S * 0.3;
  const broke = st === 'ruin';
  const seg = (a, b) => box(g, b - a, 1.6, 22, m.concrete, (a + b) / 2, deck, 0);
  if (broke) { seg(-half, -40); seg(70, half); add(g, new G.BoxGeometry(60, 1.6, 22), m.concrete, -12, deck - 9, 0, 0, 0, -0.32); } else seg(-half, half);
  for (const x of [-tx, tx]) { for (const s of [-1, 1]) box(g, 4, tw + deck + 8, 4, m.verdigris, x, -8, s * 10); for (const y of [deck + 20, deck + 55, deck + tw - 4]) box(g, 4, 4, 24, m.verdigris, x, y, 0); }
  for (const s of [-1, 1]) {
    const pts = []; for (let i = 0; i <= 60; i++) { const x = -half + S * i / 60; let y;
      if (x < -tx) y = deck + 2 + (tw - 2) * (x + half) / (half - tx); else if (x > tx) y = deck + 2 + (tw - 2) * (half - x) / (half - tx);
      else y = deck + 4 + (tw - 4) * Math.pow(x / tx, 2);
      if (broke && x > -10 && x < 50) y = deck - 6 - 20 * Math.sin((x + 10) / 60 * Math.PI); pts.push(new G.Vector3(x, y, s * 10)); }
    add(g, new G.TubeGeometry(new G.CatmullRomCurve3(pts), 120, 0.55, 6), m.iron);
    if (!broke || true) for (let i = 2; i < 59; i += 2) { const p = pts[i]; if (broke && p.x > -40 && p.x < 70) continue; if (p.y > deck + 3) rod(g, [p.x, p.y, p.z], [p.x, deck + 1.6, p.z], 0.08, m.iron); }
  }
  if (!broke) for (let x = -half + 20; x < half; x += 40) for (const s of [-1, 1]) { cyl(g, 0.12, 0.12, 6, m.iron, x, deck + 1.6, s * 10.5, 5); sph(g, 0.4, m.warm, x, deck + 7.8, s * 10.5); }
};
B.gates = (g, m) => {                                        // twin pylons with winged figures, an iron gate between
  for (const s of [-1, 1]) { box(g, 6, 22, 6, m.cantera, s * 14, 0, 0); box(g, 7, 2, 7, m.stone, s * 14, 22, 0);
    cyl(g, 0.9, 1.2, 4, m.gold, s * 14, 24, 0, 8); for (const w of [-1, 1]) add(g, new G.BoxGeometry(5, 3.5, 0.3), m.gold, s * 14 + w * 2.6, 27.6, 0, 0, 0, w * 0.6); sph(g, 0.8, m.gold, s * 14, 28.8, 0); }
  for (let x = -10.5; x <= 10.5; x += 0.75) box(g, 0.12, 6 + 1.5 * Math.cos(x / 10.5 * Math.PI / 2), 0.12, m.iron, x, 0, 0);
  box(g, 21, 0.3, 0.25, m.iron, 0, 2, 0); box(g, 21, 0.3, 0.25, m.gold, 0, 5.4, 0);
};
function stepped(g, m, R, tiers, Ht, temple) {
  for (let k = 0; k < tiers; k++) { const r = R * (1 - k * 0.8 / tiers), h = Ht / tiers; add(g, new G.CylinderGeometry(r * 0.94, r, h, 4, 1), m.stone, 0, k * h + h / 2, 0, Math.PI / 4); }
  const stair = new G.BoxGeometry(R * 0.22, 0.1, R * 1.0); for (let k = 0; k < 24; k++) box(g, R * 0.22, Ht / 24, 1.2, m.cantera, 0, k * Ht / 24, -R * 0.7 + k * R * 0.55 / 24);
  if (temple) { box(g, R * 0.2, 6, R * 0.16, m.tezontle, 0, Ht, 0); prism(g, R * 0.22, 3, R * 0.18, m.stone, 0, Ht + 6, 0); }
}
B.pyramid = (g, m) => stepped(g, m, 46, 5, 30, true);
B['Pyramid of the Sun'] = (g, m) => stepped(g, m, 75, 5, 58, false);
B.obelisk = (g, m) => { box(g, 7, 3, 7, m.stone, 0, 0, 0); add(g, new G.CylinderGeometry(1.3 * Math.SQRT2, 2 * Math.SQRT2, 26, 4), m.cantera, 0, 16, 0, Math.PI / 4); cone(g, 1.3 * Math.SQRT2, 3, m.gold, 0, 29, 0); };
B['Washington Monument, Mount Vernon'] = (g, m) => {          // the white Doric column with a figure on top, in a cross of squares
  box(g, 14, 9, 14, m.white, 0, 0, 0); cyl(g, 3.1, 3.6, 45, m.white, 0, 9, 0, 20); box(g, 8, 1.5, 8, m.white, 0, 54, 0); cyl(g, 1.8, 1.8, 2, m.white, 0, 55.5, 0, 12);
  cyl(g, 0.6, 0.8, 4.5, m.grey, 0, 57.5, 0, 8); sph(g, 0.6, m.grey, 0, 62.4, 0);
};
B['Angel of Independence'] = (g, m) => {
  box(g, 22, 4, 22, m.cantera, 0, 0, 0); for (let i = 0; i < 4; i++) box(g, 3, 4, 3, m.grey, Math.cos(i * Math.PI / 2 + 0.785) * 9, 4, Math.sin(i * Math.PI / 2 + 0.785) * 9);
  box(g, 11, 8, 11, m.cantera, 0, 4, 0); cyl(g, 2.6, 3, 30, m.cantera, 0, 12, 0, 20); for (const y of [20, 30]) cyl(g, 3.3, 3.3, 1, m.gold, 0, y, 0, 20);
  box(g, 5, 2, 5, m.cantera, 0, 42, 0); cyl(g, 0.6, 0.9, 5, m.gold, 0, 44, 0, 8); for (const w of [-1, 1]) add(g, new G.BoxGeometry(4, 3, 0.25), m.gold, w * 1.8, 48.5, 0, 0, 0, w * 0.5); sph(g, 0.6, m.gold, 0, 49.6, 0);
};
B.palace = (g, m) => {                                       // the white marble palace, its orange dome and an eagle at the lantern
  box(g, 100, 24, 64, m.white, 0, 0, 0); box(g, 40, 30, 30, m.white, 0, 0, -18);
  for (let k = -9; k <= 9; k++) cyl(g, 0.9, 0.9, 14, m.white, k * 5, 4, -33.5, 10); box(g, 100, 4, 4, m.white, 0, 0, -33.5);
  cyl(g, 16, 17, 8, m.white, 0, 24, 0, 32); sph(g, 16, m.orange, 0, 32, 0, true); cyl(g, 2.4, 2.4, 6, m.white, 0, 47, 0, 12); sph(g, 1.8, m.gold, 0, 54, 0);
  for (const s of [-1, 1]) { sph(g, 7, m.orange, s * 38, 24, -14, true); }
};
B['Monumento a la Revolución'] = (g, m) => {                  // four piers, arches, an attic, a copper dome and lantern
  const s = 20; for (const a of [-1, 1]) for (const b of [-1, 1]) box(g, 12, 34, 12, m.stone, a * s, 0, b * s);
  for (const a of [-1, 1]) { box(g, 52, 8, 12, m.stone, 0, 34, a * s); box(g, 12, 8, 52, m.stone, a * s, 34, 0); }
  box(g, 44, 6, 44, m.cantera, 0, 42, 0); cyl(g, 18, 20, 4, m.cantera, 0, 48, 0, 32); sph(g, 18, m.verdigris, 0, 52, 0, true);
  cyl(g, 3.5, 3.5, 7, m.verdigris, 0, 69, 0, 12); cone(g, 4, 3, m.verdigris, 0, 76, 0, 12);
};
B['Torre Latinoamericana'] = (g, m) => {                      // the set-back tower, banded glass and steel, an antenna
  let y = 0; for (const [w, h] of [[34, 70], [30, 50], [26, 30], [20, 18], [14, 10]]) { box(g, w, h, w, m.glass, 0, y, 0);
    for (let k = 4; k < h; k += 4) box(g, w + 0.4, 0.4, w + 0.4, m.steel, 0, y + k, 0); y += h; }
  cyl(g, 0.6, 1.2, 30, m.steel, 0, y, 0, 6); sph(g, 1, m.redlamp, 0, y + 30, 0);
};
B.skyscraper = (g, m) => { let y = 0; for (const [w, d, h] of [[30, 30, 60], [26, 26, 40], [20, 20, 22]]) { box(g, w, h, d, m.glass, 0, y, 0); for (let k = 3.6; k < h; k += 3.6) box(g, w + 0.3, 0.35, d + 0.3, m.steel, 0, y + k, 0); y += h; } box(g, 8, 8, 8, m.steel, 0, y, 0); cyl(g, 0.4, 0.6, 18, m.steel, 0, y + 8, 0, 6); sph(g, 0.8, m.redlamp, 0, y + 26, 0); };
B['Domino Sugars sign'] = (g, m) => {                        // a refinery shed, silos and a red rooftop sign (no brand: just SUGAR)
  box(g, 70, 22, 34, m.brick, 0, 0, 0); prism(g, 70, 6, 34, m.slate, 0, 22, 0); for (let k = 0; k < 4; k++) cyl(g, 6, 6, 34, m.concrete, -24 + k * 13, 0, 26, 20);
  for (let k = -3; k <= 3; k++) box(g, 0.4, 8, 0.4, m.iron, k * 9, 28, 0); textPlane(g, 'SUGAR', 66, 13, '#ff3828', 0, 37, 0.3, 0, 'bold 300px Georgia, serif');
};
B['neon sign'] = (g, m) => {                                 // a blade sign on a marquee: LIGHTS (Flashing Lights)
  box(g, 22, 16, 14, m.darkbrick, 0, 0, 0); box(g, 18, 2.4, 3, m.neon, 0, 4, -8.2);
  const b = textPlane(g, 'LIGHTS', 22, 4, '#ff4fd8', 9, 22, -7.6, Math.PI / 2, 'bold 220px Futura, Helvetica'); b.rotation.set(0, Math.PI / 2, Math.PI / 2); b.userData.flicker = true;
  box(g, 0.6, 22, 1.2, m.iron, 9, 12, -7.6);
};
B.cathedral = (g, m) => {                                    // the cathedral: twin bell towers, a rose window, a dome at the crossing
  box(g, 34, 26, 80, m.cantera, 0, 0, 0); prism(g, 80, 10, 34, m.tezontle, 0, 26, 0, Math.PI / 2); box(g, 70, 18, 22, m.cantera, 0, 0, 10);
  for (const s of [-1, 1]) { box(g, 13, 46, 13, m.cantera, s * 21, 0, -40); box(g, 10, 12, 10, m.stone, s * 21, 46, -40); add(g, new G.SphereGeometry(5.6, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), m.cantera, s * 21, 58, -40);
    box(g, 0.4, 5, 0.4, m.iron, s * 21, 63.6, -40); box(g, 2.2, 0.4, 0.4, m.iron, s * 21, 66.4, -40); for (let k = 0; k < 2; k++) box(g, 2.2, 5, 0.3, m.warm, s * 21, 49 + k * 0.1, -45.2); }
  add(g, new G.CircleGeometry(6, 24), m.rose, 0, 20, -40.1, Math.PI); box(g, 6, 9, 0.4, m.wood, 0, 0, -40.2);
  cyl(g, 9, 9, 8, m.cantera, 0, 36, 10, 24); sph(g, 9, m.verdigris, 0, 44, 10, true); cyl(g, 1.6, 1.6, 4, m.cantera, 0, 53, 10, 8);
};
B.stadium = (g, m) => {
  const bowl = new G.CylinderGeometry(90, 64, 26, 48, 1, true); bowl.scale(1, 1, 0.72); add(g, bowl, mat('bowl', 0xb7b4ad, {side: G.DoubleSide}), 0, 13, 0);
  const f = new G.CircleGeometry(60, 40); f.scale(1, 0.72, 1); add(g, f, m.grass, 0, 0.3, 0, 0, -Math.PI / 2);
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.785, x = Math.cos(a) * 92, z = Math.sin(a) * 66; cyl(g, 0.6, 0.9, 50, m.steel, x, 0, z, 6); box(g, 8, 4, 1, m.lantern, x, 50, z, -a); }
};
B.dome = (g, m) => { cyl(g, 34, 35, 6, m.concrete, 0, 0, 0, 40); sph(g, 33, m.white, 0, 6, 0, true); for (let i = 0; i < 16; i++) add(g, new G.TorusGeometry(33.2, 0.4, 4, 32, Math.PI), m.concrete, 0, 6, 0, i * Math.PI / 16); };
B['water tower'] = (g, m) => { for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.785; rod(g, [Math.cos(a) * 7, 0, Math.sin(a) * 7], [Math.cos(a) * 4.5, 24, Math.sin(a) * 4.5], 0.4, m.steel); }
  cyl(g, 6, 6, 9, m.steel, 0, 24, 0, 20); cone(g, 6.4, 3.5, m.steel, 0, 33, 0, 20); textPlane(g, 'ATLANTIS', 9, 2, '#e8e2d0', 0, 28.5, -6.05, Math.PI, 'bold 150px Helvetica'); };
B.smokestacks = (g, m, st) => { box(g, 50, 18, 26, m.darkbrick, 0, 0, 0); prism(g, 50, 5, 26, m.slate, 0, 18, 0);
  for (let k = 0; k < 3; k++) { cyl(g, 2.4, 4, 72, m.brick, -16 + k * 16, 0, 18, 16); cyl(g, 2.8, 2.8, 2, m.darkbrick, -16 + k * 16, 72, 18, 16); if (st === 'reuse') sph(g, 1.2, m.redlamp, -16 + k * 16, 75, 18); }
  if (st === 'intact') for (let k = 0; k < 3; k++) { const s = add(g, new G.SphereGeometry(5, 8, 6), new G.MeshStandardMaterial({color: 0xbab6b0, transparent: true, opacity: 0.35, depthWrite: false}), -16 + k * 16, 80, 18); s.userData.smoke = k; } };
B['phone booth'] = (g, m) => { box(g, 1.1, 2.5, 1.1, mat('booth', 0x2a3a7a), 0, 0, 0); box(g, 0.9, 1.6, 0.05, m.lantern, 0, 0.7, -0.56); box(g, 1.15, 0.3, 1.15, m.warm, 0, 2.5, 0); };
B.statue = (g, m) => { box(g, 6, 4, 6, m.stone, 0, 0, 0); cyl(g, 0.7, 0.9, 3.4, m.verdigris, 0, 4, 0, 8); sph(g, 0.55, m.verdigris, 0, 7.9, 0); rod(g, [0.5, 6.8, 0], [1.6, 8.6, 0.4], 0.18, m.verdigris); };
B.wreck = (g, m) => { const o = new G.Group(); box(o, 9, 6, 48, m.rust, 0, -2, 0); box(o, 5, 5, 9, m.rust, 0, 4, 10); cyl(o, 1.4, 1.4, 8, m.rust, 0, 9, 4); o.rotation.set(0.12, 0.3, 0.32); o.position.y = -1; g.add(o); };
B.motorcycle = (g, m) => { for (const z of [-0.7, 0.7]) add(g, new G.TorusGeometry(0.33, 0.1, 8, 16), m.iron, 0, 0.42, z, Math.PI / 2); box(g, 0.35, 0.45, 1.3, mat('moto', 0x9a1a1a, {r: 0.3, m: 0.6}), 0, 0.55, 0); rod(g, [0, 0.9, -0.6], [0, 1.25, -0.8], 0.04, m.steel); box(g, 0.8, 0.05, 0.05, m.steel, 0, 1.25, -0.8); };
function palm(g, m, x, z, H) { const trunk = []; for (let k = 0; k <= 8; k++) trunk.push(new G.Vector3(x + Math.sin(k / 8 * 1.6) * H * 0.06, k / 8 * H, z));
  add(g, new G.TubeGeometry(new G.CatmullRomCurve3(trunk), 8, 0.28, 6), m.wood); const top = trunk[8];
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, f = add(g, new G.PlaneGeometry(1.3, 5.5), mat('frond', 0x3d6a2a, {side: G.DoubleSide}), top.x + Math.cos(a) * 2.2, top.y - 0.6, top.z + Math.sin(a) * 2.2); f.rotation.set(0, -a, 0); f.rotateX(1.1); f.rotation.order = 'YXZ'; f.rotation.set(1.0, -a + Math.PI / 2, 0); } }
B['palm row'] = (g, m) => { for (let k = -5; k <= 5; k++) palm(g, m, k * 9, 0, 13 + (k * 7 % 5)); box(g, 100, 0.4, 6, m.cantera, 0, 0, 3); };
B['lone tree'] = (g, m) => { cyl(g, 1.6, 2.6, 14, m.wood, 0, 0, 0, 10); for (let i = 0; i < 9; i++) { const a = i * 2.4, r = 6 + (i % 3) * 3; sph(g, 7 + (i % 3), mat('crown', 0x2f4a24), Math.cos(a) * r, 18 + (i % 4) * 2.5, Math.sin(a) * r); } sph(g, 9, m.green, 0, 24, 0); };
B['lone peak'] = (g, m) => { cone(g, 2.2, 3, m.stone, 0, 0, 0, 7); cyl(g, 0.06, 0.06, 4, m.iron, 0, 3, 0, 4); box(g, 1.2, 0.7, 0.05, m.neon, 0.6, 6.2, 0); };

// one draw call per material: bake a group's meshes into merged geometries
function bake(g) {
  g.updateMatrixWorld(true); const by = new Map(), keep = [];
  g.traverse(o => { if (!o.isMesh) return; if (o.userData.beam || o.userData.smoke !== undefined || o.userData.flicker || o.material.map) { keep.push(o); return; }
    const geo = o.geometry.clone().applyMatrix4(o.matrixWorld); for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(k)) geo.deleteAttribute(k);
    if (!geo.attributes.uv) geo.setAttribute('uv', new G.BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
    const gg = geo.index ? geo.toNonIndexed() : geo; (by.get(o.material) || by.set(o.material, []).get(o.material)).push(gg); });
  const out = new G.Group();
  for (const [m, list] of by) { const mm = new G.Mesh(mergeGeometries(list), m); mm.castShadow = mm.receiveShadow = true; out.add(mm); }
  for (const o of keep) { o.updateMatrixWorld(true); o.matrix.copy(o.matrixWorld); o.matrix.decompose(o.position, o.quaternion, o.scale); o.removeFromParent(); out.add(o); }
  return out;
}
export function buildLandmark(lm, state) {
  const m = MATS(), g = new G.Group(), f = B[lm.type] || B[lm.name];
  if (!f) { box(g, 10, 12, 10, m.stone); } else f(g, m, state, lm);
  return bake(g);
}
export const HAS = t => !!B[t];
