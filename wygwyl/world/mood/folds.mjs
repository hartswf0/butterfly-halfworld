// THE FOLDS — each reference stood up as a walk-in pop-up in its place (the elsewhere map's fold, Tour Into the Picture's box):
// floor on the ground, walls where they meet it, things as cards, the sky left out so the district's own sky and water show.
// A place is a few standpoints; each standpoint is a ring of up to four references, one per quarter turn. From the standpoint
// the frame is the reference; walking off it, the fold opens. The photo is lit by nothing but itself, fogged into the mood.
import * as THREE from 'three';

const HFOV = 66 * Math.PI / 180, EYE = 1.6, FAR = 140;
export const FOLD_VFOV = 2 * Math.atan(Math.tan(HFOV / 2) / (16 / 9)) * 180 / Math.PI;          // the fold's camera, as a vertical fov

function cellDepths(s, g, GX, GY) {
  const F = (s.asp / 2) / Math.tan(HFOV / 2), hz = s.hz, backdrop = s.ground < 0.04;               // no ground in frame: a skyline, a painted backdrop far off
  const groundT = v => v > hz + 0.004 ? EYE * F / (v - hz) : Infinity;
  const dep = new Float32Array(GX * GY), kind = new Uint8Array(GX * GY), colDepth = new Float32Array(GX).fill(NaN);
  for (let x = 0; x < GX; x++) { let cur = NaN;
    for (let y = GY - 1; y >= 0; y--) { const c = g[y * GX + x], v = (y + 0.5) / GY; kind[y * GX + x] = c;
      if ((c === 1 || c === 3) && v > hz + 0.01) { cur = groundT(v); dep[y * GX + x] = cur; }
      else if (c === 0) dep[y * GX + x] = FAR;
      else if (c === 5) dep[y * GX + x] = v < hz - 0.01 ? EYE * 1.2 * F / (hz - v) : 6;
      else { if (isNaN(cur)) cur = groundT(Math.min(1, (y + 1) / GY)); if (!isFinite(cur)) cur = NaN;
        if (c === 2 && y + 1 < GY && g[(y + 1) * GX + x] === 6) cur = cur * 1.8; dep[y * GX + x] = cur; if (isNaN(colDepth[x])) colDepth[x] = cur; } } }
  const known = [...colDepth].map((v, i) => [v, i]).filter(a => !isNaN(a[0]) && isFinite(a[0]));
  const fill = x => { if (backdrop || !known.length) return backdrop ? 90 : 18; let b = known[0]; for (const a of known) if (Math.abs(a[1] - x) < Math.abs(b[1] - x)) b = a; return b[0]; };
  for (let i = 0; i < GX * GY; i++) if (isNaN(dep[i]) || !isFinite(dep[i])) dep[i] = fill(i % GX);
  for (let i = 0; i < GX * GY; i++) dep[i] = Math.min(Math.max(dep[i], 1.2), FAR);
  return {dep, kind, F};
}
function foldMesh(s, g, GX, GY, tex, fog) {
  const {dep, kind, F} = cellDepths(s, g, GX, GY), n = (GX + 1) * (GY + 1), pos = new Float32Array(n * 3), uv = new Float32Array(n * 2);
  for (let j = 0; j <= GY; j++) for (let i = 0; i <= GX; i++) {
    const u = i / GX, v = j / GY, cells = [];
    for (const [a, b] of [[i - 1, j - 1], [i, j - 1], [i - 1, j], [i, j]]) if (a >= 0 && b >= 0 && a < GX && b < GY) cells.push(b * GX + a);
    const gr = cells.some(c => kind[c] === 1 || kind[c] === 3) && v > s.hz + 0.004;
    let z; if (gr) z = EYE * F / (v - s.hz); else { const solid = cells.filter(c => kind[c] !== 0); z = solid.length ? Math.min(...solid.map(c => dep[c])) : FAR; }
    z = Math.min(Math.max(z, 1.2), FAR); const dx = (u - 0.5) * s.asp, dy = (s.hz - v), q = j * (GX + 1) + i;
    pos.set([dx * z / F, gr ? -EYE : dy * z / F, -z], q * 3); uv.set([u, 1 - v], q * 2);
  }
  const idx = [];
  for (let j = 0; j < GY; j++) for (let i = 0; i < GX; i++) { if (kind[j * GX + i] === 0) continue;                // the sky is left out
    const a = j * (GX + 1) + i; idx.push(a, a + GX + 1, a + 1, a + 1, a + GX + 1, a + GX + 2); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({map: tex, side: THREE.DoubleSide, toneMapped: false, fog}));
}

// stand every view in its district's place: standpoint 0 at the place's centre, the rest on a ring 70 m out
export async function makeFolds(scene, PLACES, placeOfDistrict, distOfView, base = './') {
  const F = await fetch(base + 'folds.json').then(r => r.json()), FB = new Uint8Array(await fetch(base + 'fold.bin').then(r => r.arrayBuffer()));
  const [GX, GY] = F.grid, byN = Object.fromEntries(F.views.map((v, k) => [v.n, {...v, k}])), loader = new THREE.TextureLoader(), pad = n => String(n).padStart(3, '0');
  const stations = [], group = new THREE.Group(), loads = []; scene.add(group);
  for (const P of PLACES) {
    const ns = Object.keys(distOfView).map(Number).filter(n => placeOfDistrict[distOfView[n]] === P.id).sort((a, b) => (P.views.indexOf(a) + 1 || 99) - (P.views.indexOf(b) + 1 || 99));
    ns.forEach((n, i) => {
      const sp = Math.floor(i / 4), q = i % 4, ring = sp === 0 ? 0 : 70, a = sp * 2.4;
      const ox = P.at[0] + ring * Math.cos(a), oz = P.at[1] + ring * Math.sin(a), yaw = q * Math.PI / 2 + sp * 0.4;
      const s = byN[n], g = FB.subarray(s.k * GX * GY, (s.k + 1) * GX * GY);
      let done; loads.push(new Promise(r => { done = r; })); const tex = loader.load(`../districts/v/${pad(n)}.webp`, () => done(), undefined, () => done()); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
      const m = foldMesh(s, g, GX, GY, tex, true), st = new THREE.Group(); st.add(m); st.position.set(ox, EYE + 0.06, oz); st.rotation.y = yaw; group.add(st);
      const dir = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
      stations.push({n, place: P.id, p: [ox, EYE + 0.06, oz], t: [ox + dir.x * 30, EYE + 0.06 + 30 * (s.hz - 0.5) / ((s.asp / 2) / Math.tan(HFOV / 2)), oz + dir.z * 30], fov: FOLD_VFOV, mesh: st});
    });
  }
  return {group, stations, ready: () => Promise.all(loads), setVisible: v => { group.visible = v; }};
}
