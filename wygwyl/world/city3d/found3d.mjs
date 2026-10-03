// FOUND ARCHITECTURE — buildings that exist only in our own generated footage, raised in the city.
// Each is cut out of its frame (segmentation), its silhouette becomes the extrusion profile, the frame itself is its face
// (Debevec's façade idea, made from one picture), its sides wear the city's facade shader, and it takes a lot in a district
// that suits what it is.
import * as THREE from 'three';
import {facadeMat} from './city.mjs';

const hash = (a, b = 0) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
const SIZE = {'a theater': [14, 20], 'a house': [10, 15], 'a tower': [70, 140], 'an apartment block': [28, 46], 'a temple': [22, 40], 'a church': [24, 42], 'a factory': [14, 22],
  'a warehouse': [12, 18], 'a ruin': [8, 16], 'a futuristic structure': [60, 150], 'a monument': [25, 50], 'a bridge': [18, 26], 'a dome': [22, 36]};
const WHERE = {'a theater': ['nightlife', 'downtown'], 'a house': ['rowhouses', 'old town', 'suburb'], 'a ruin': ['ruin field', 'old town', 'rowhouses'], 'a tower': ['downtown', 'nightlife'], 'an apartment block': ['downtown', 'nightlife', 'rowhouses'],
  'a futuristic structure': ['downtown', 'nightlife', 'waterfront'], 'a temple': ['old town', 'ruin field'], 'a church': ['old town', 'rowhouses'], 'a monument': ['old town', 'downtown'],
  'a factory': ['industrial', 'waterfront'], 'a warehouse': ['industrial', 'waterfront'], 'a bridge': ['waterfront'], 'a dome': ['old town', 'downtown']};
const BORN = {'a theater': 3, 'a ruin': 1, 'a futuristic structure': 5, 'a tower': 3, 'an apartment block': 3, 'a house': 2, 'a church': 1, 'a temple': 0, 'a monument': 2, 'a factory': 3, 'a warehouse': 3, 'a dome': 2, 'a bridge': 2};

export function makeFound(scene, C, S, U, lib) {
  const root = new THREE.Group(); scene.add(root);
  let F = null, placed = [];
  const loader = new THREE.TextureLoader();
  function site(f, k, taken) {                                      // a lot in a fitting district: the biggest free building lots there, chosen deterministically
    const kinds = WHERE[f.read.kind] || ['downtown'], ds = C.meta.districts.filter(d => kinds.includes(d.type));
    const B = C.bld, n = B.length / 14, cand = [];
    for (let i = 0; i < n; i++) { const o = i * 14, x = B[o], y = B[o + 1]; if (B[o + 6] === 2 || B[o + 6] === 3 && f.read.kind === 'a house') continue;
      const d = ds.find(d => Math.hypot(d.x - x, d.y - y) < d.r * 1.15); if (!d) continue;
      if (taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + 40)) continue;
      cand.push([B[o + 2] * B[o + 3] * (0.6 + hash(i, k)), i]); }
    cand.sort((a, b) => b[0] - a[0]); return cand.length ? cand[Math.min(cand.length - 1, Math.floor(hash(k, 7) * Math.min(6, cand.length)))][1] : null;
  }
  function build(f, k, i) {
    const B = C.bld, o = i * 14, x = B[o], y = B[o + 1], rot = B[o + 4], gz = B[o + 13];
    const [h0, h1] = SIZE[f.read.kind] || [16, 30], h = h0 + (h1 - h0) * hash(k, 3), w = Math.min(h * f.aspect, 160), depth = THREE.MathUtils.clamp(w * 0.55, 8, 46);
    const shape = new THREE.Shape(); shape.moveTo(-w / 2, 0);
    const P = f.profile; for (let c = 0; c < P.length; c++) shape.lineTo(-w / 2 + w * (c + 0.5) / P.length, Math.max(0.12, P[c]) * h);
    shape.lineTo(w / 2, 0); shape.lineTo(-w / 2, 0);
    const geo = new THREE.ExtrudeGeometry(shape, {depth, bevelEnabled: false, curveSegments: 1}); geo.translate(0, 0, -depth / 2);
    const pos = geo.attributes.position, uv = geo.attributes.uv, g0 = geo.groups[0];
    for (let v = g0.start; v < g0.start + g0.count; v++) { const idx = geo.index ? geo.index.getX(v) : v; uv.setXY(idx, (pos.getX(idx) + w / 2) / w, pos.getY(idx) / h); }
    // per-vertex facade inputs for the sides (windows, skin, grit) — same shader as every other building
    const nv = pos.count, info = new Float32Array(nv * 4), mat = new Float32Array(nv * 4), seed = hash(k, 11);
    const wall = lib.idx[{'brick': 'red brick', 'raw concrete': 'concrete', 'glass': 'cyan glass', 'stone': 'cantera', 'wood': 'wood siding', 'metal': 'corrugated', 'white ceramic': 'ceramic', 'stucco': 'stucco'}[f.read.material] || 'concrete'] ?? 0;
    for (let v = 0; v < nv; v++) { info.set([seed, gz, f.read.state === 'ruined' ? 3 : 0, f.read.kind === 'a house' ? 3.1 : 3.6], v * 4); mat.set([wall, 0, 0, 0.7], v * 4); }
    geo.setAttribute('aInfo', new THREE.BufferAttribute(info, 4)); geo.setAttribute('aMat', new THREE.BufferAttribute(mat, 4));
    const tex = loader.load(`../language/found/${f.id}.webp`); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const face = new THREE.MeshStandardMaterial({map: tex, alphaTest: 0.35, roughness: 0.7, side: THREE.DoubleSide});
    const side = facadeMat(U); side.color = new THREE.Color(f.palette[2] || '#999');
    const m = new THREE.Mesh(geo, [face, side]); m.castShadow = m.receiveShadow = true;
    const g = new THREE.Group(); g.add(m);
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(w + 2, 3, depth + 2), new THREE.MeshStandardMaterial({color: 0x6f6a62, roughness: 0.95})); plinth.position.y = -1.4; g.add(plinth);
    g.position.set(x, gz, y); g.rotation.y = -rot + Math.PI;      // the face (+z) turns to the street (the lot's −z)
    g.userData = {found: f, born: BORN[f.read.kind] ?? 2, x, y, r: Math.max(w, depth) / 2 + 4, h};
    root.add(g); return g;
  }
  return {
    root, get placed() { return placed; },
    async load(url) { F = await fetch(url).then(r => r.json()).catch(() => null); if (!F) return null;
      const K = await fetch(url.replace('found.json', 'keep.json')).then(r => r.json()).catch(() => null);   // only what passed the eye-review gate
      if (K) F.found = F.found.filter(f => K.keep[f.id]).map(f => ({...f, name: K.keep[f.id].name, read: {...f.read, kind: K.keep[f.id].kind}}));
      const taken = []; placed = [];
      F.found.forEach((f, k) => { if (f.read.kind === 'a bridge') return; const i = site(f, k, taken); if (i == null) return;
        const g = build(f, k, i); taken.push([g.userData.x, g.userData.y, g.userData.r]); placed.push(g); });
      return F; },
    footprints() { return placed.map(g => [g.userData.x, g.userData.y, g.userData.r, g.userData.born]); },
    setEra(e) { placed.forEach(g => g.visible = g.userData.born <= e && !g.userData.heroed); },
  };
}
