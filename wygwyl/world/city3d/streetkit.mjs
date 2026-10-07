// the object kit, placed: line posts on the shore (their band at exactly +4.00 m above the sea), benches facing the water,
// tide boards (one live face, shared), poem plaques where the poems happen, ward signs at the wards, salt fountains and planters in the squares.
import * as THREE from 'three';
import {KIT, kitGeometry, buildObject, materialFor, drawEmblem, tideBoardTexture, TOKENS} from './kit.mjs';

const hash = (a, b = 0) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
const M4 = (x, y, z, ry = 0, s = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry), new THREE.Vector3(s, s, s));
function instanced(geo, mat, items) { const m = new THREE.InstancedMesh(geo, mat, Math.max(1, items.length)); m.castShadow = true; m.receiveShadow = true;
  m.userData.setEra = e => { let c = 0; for (const it of items) if (it.born <= e) m.setMatrixAt(c++, it.m); m.count = c; m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere(); }; return m; }
function canvasPlane(w, h, draw, emis = 0.6) { const c = document.createElement('canvas'); c.width = Math.round(512 * w / Math.max(w, h)); c.height = Math.round(512 * h / Math.max(w, h)); draw(c.getContext('2d'), c.width, c.height);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: emis, roughness: 0.5})); }

export function makeStreetKit(scene, C, S, U, heav, wards, palettes) {
  const root = new THREE.Group(); scene.add(root); const {nx, ny, cell} = C.meta, ht = C.height, vmat = new THREE.MeshStandardMaterial({vertexColors: true, roughness: 0.5, metalness: 0.15}), glowMat = new THREE.MeshBasicMaterial({vertexColors: true});
  const posts = [], benches = [], planters = [], singles = [];
  // 1 line posts: every ~170 m of shore, on land between 0.3 and 3.6 m, facing the water; a bench beside every other one
  const taken = new Set();
  for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) { const k = j * nx + i, h = ht[k]; if (h < 0.3 || h > 3.6) continue;
    const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([a, b]) => ht[k + a + b * nx] < -0.5); if (!nb) continue;
    const key = Math.floor(i * cell / 170) + ',' + Math.floor(j * cell / 170); if (taken.has(key)) continue; taken.add(key);
    const x = i * cell, y = j * cell, ry = -Math.atan2(nb[1], nb[0]) + Math.PI / 2;
    posts.push({m: M4(x, h, y), band: M4(x, 4.0, y), born: 4});
    if (hash(i, j) < 0.5) benches.push({m: M4(x - nb[1] * 3, Math.max(S.ground(x - nb[1] * 3, y + nb[0] * 3), 0.3), y + nb[0] * 3, ry + Math.PI), born: 1}); }
  const KP = kitGeometry('line post'), KB = kitGeometry('bench'), KPl = kitGeometry('planter');
  root.add(instanced(KP.body, vmat, posts)); if (KP.glow) root.add(instanced(KP.glow, glowMat, posts));
  const bandGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.16, 14); root.add(instanced(bandGeo, materialFor('salt', 0), posts.map(p => ({m: p.band, born: p.born}))));   // the datum: always at +4.00
  // 2 the squares: a salt fountain, benches round it, planters
  for (const p of C.meta.plazas) { const g = Math.max(S.ground(p.x, p.y), 0.3);
    if (p.r >= 40) { const f = buildObject('salt fountain'); f.position.set(p.x + p.r * 0.35, g, p.y + p.r * 0.2); f.userData.born = p.born + 1; root.add(f); singles.push(f); }
    for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + 0.4, r = p.r * 0.62; benches.push({m: M4(p.x + Math.cos(a) * r, g, p.y + Math.sin(a) * r, -a - Math.PI / 2), born: p.born}); }
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2, r = p.r * 0.85; planters.push({m: M4(p.x + Math.cos(a) * r, g, p.y + Math.sin(a) * r, a, 0.9 + hash(k, p.x) * 0.3), born: p.born}); } }
  // 3 tide boards: at the pier, the tide engine's landing, the squares, and every fifth bus stop; all share one live face
  const face = tideBoardTexture(), faceMat = new THREE.MeshStandardMaterial({map: face, emissiveMap: face, emissive: 0xffffff, emissiveIntensity: 0.7});
  const boardAt = (x, y, ry, born = 3) => { const b = buildObject('tide board'), g = Math.max(S.ground(x, y), 0.3); const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.03), faceMat); pl.position.set(0, 1.95, 0.045); b.add(pl);
    const pl2 = pl.clone(); pl2.rotation.y = Math.PI; pl2.position.z = -0.045; b.add(pl2); b.position.set(x, g, y); b.rotation.y = ry; b.userData.born = born; root.add(b); singles.push(b); };
  const pier = C.meta.landmarks.find(l => l.type === 'pier'); if (pier) boardAt(pier.x - 18, pier.y - 10, 0.3);
  C.meta.plazas.forEach((p, i) => boardAt(p.x - p.r * 0.5, p.y + p.r * 0.5, i));
  (C.stopsForBoards || []).forEach((s, i) => { if (i % 5 === 0) boardAt(s.x, s.y, 0); });
  // 4 poem plaques: each poem's number and first line, where it happens
  for (const p of C.meta.poems) { const w = C.meta.words.find(q => q.poem === p.num), b = buildObject('poem plaque'), g = Math.max(S.ground(p.x + 8, p.y + 8), 0.3);
    const pl = canvasPlane(0.86, 0.56, (x, W, H) => { x.fillStyle = TOKENS.ceramic; x.fillRect(0, 0, W, H); drawEmblem(x, W - 52, 52, 30, '#b9b3a6');
      x.fillStyle = '#2a2d33'; x.font = '600 34px ui-monospace, Menlo, monospace'; x.fillText(p.num, 26, 56); x.font = 'italic 25px Georgia, serif'; x.fillStyle = '#1c2024';
      const words = (w?.t || p.title).split(' '); let line = '', yy = 120; for (const wd of words) { if (x.measureText(line + wd).width > W - 52) { x.fillText(line, 26, yy); line = ''; yy += 32; if (yy > H - 40) break; } line += wd + ' '; } if (yy <= H - 40) x.fillText(line, 26, yy);
      x.fillStyle = TOKENS.salt; x.fillRect(0, H * 0.6, W, 4); x.fillStyle = '#7a7468'; x.font = '18px ui-monospace, Menlo, monospace'; x.fillText(p.title.toUpperCase(), 26, H - 22); }, 0.25);
    pl.position.set(0, 1.0 + 0.3 * Math.cos(0.35), 0.03 + 0.3 * Math.sin(0.35)); pl.rotation.x = -0.35; b.add(pl);
    b.position.set(p.x + 8, g, p.y + 8); b.rotation.y = hash(+p.num) * 6.28; b.userData.born = 5; root.add(b); singles.push(b);
    planters.push({m: M4(p.x + 9.4, g, p.y + 7, 0, 0.8), born: 5}); }
  // 5 ward signs: number, name, the district's own colours
  for (const d of wards.list) { const b = buildObject('ward sign'), x = d.x + 40, y = d.y + 40, g = Math.max(S.ground(x, y), 0.3), pal = palettes?.find(q => q.name === d.name);
    const disc = canvasPlane(0.86, 0.86, (c, W, H) => { c.fillStyle = TOKENS.ceramic; c.beginPath(); c.arc(W / 2, H / 2, W / 2, 0, 7); c.fill();
      if (pal) pal.colors.slice(1, 5).forEach((col, i) => { c.fillStyle = col; c.fillRect(W * 0.18 + i * W * 0.16, H * 0.62, W * 0.16, H * 0.06); });
      c.fillStyle = '#1c2024'; c.textAlign = 'center'; c.font = '700 120px ui-monospace, Menlo, monospace'; c.fillText(String(d.ward), W / 2, H * 0.5); c.font = '600 26px ui-monospace, Menlo, monospace'; c.fillText('WARD', W / 2, H * 0.22);
      c.font = 'italic 26px Georgia, serif'; c.fillText(d.name.replace(/^the /, '').replace(' district', ''), W / 2, H * 0.8); }, 0.3);
    disc.position.set(0, 2.8, 0.06); b.add(disc); const d2 = disc.clone(); d2.rotation.y = Math.PI; d2.position.z = -0.06; b.add(d2);
    b.position.set(x, g, y); b.userData.born = 3; root.add(b); singles.push(b); }
  root.add(instanced(KB.body, vmat, benches)); if (KB.glow) root.add(instanced(KB.glow, glowMat, benches)); root.add(instanced(KPl.body, vmat, planters));
  root.children.filter(o => o.isInstancedMesh).forEach(o => o.userData.setEra(5));
  let last = -1;
  return {
    root,
    setEra(e) { root.children.forEach(o => { if (o.userData.setEra) o.userData.setEra(e); }); singles.forEach(o => o.visible = o.userData.born <= e); },
    update(date) { const m = Math.floor(date.getTime() / 60000); if (m === last) return; last = m; face.userData.draw(date, d => 0.9 * Math.sin(2 * Math.PI * (d.getTime() / 36e5) / 12.42)); faceMat.emissiveIntensity = 0.35 + 0.8 * U.night.value; },
  };
}
