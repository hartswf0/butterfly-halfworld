// The hero buildings, standing where they stand: one description (wygwyl/world/heroes/hdl.json) compiled once for its own page
// and again here, baked to a few draw calls, sited on its landmark's lot, and rebuilt when its era changes it (as built, the Fall, reuse).
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {build, useLibrary} from '../heroes/build.mjs';

const SITES = {severn: {lm: 'tower block'}, chapel: {lm: 'chapel'}, clocktower: {lm: 'clock tower'}, cafe: {lm: 'pier', offset: [-16, -22]}, marquee: {found: 'the NEW SINGLE marquee'}};

function bake(group) {                                     // merge every mesh by material; keep instanced meshes, lights and sprites as they are
  group.updateMatrixWorld(true); const by = new Map(), keep = [], inv = new THREE.Matrix4().copy(group.matrixWorld).invert();
  group.traverse(o => { if (o === group) return;
    if (o.isInstancedMesh || o.isLight || o.isSprite || o.isCSS2DObject) { keep.push(o); return; }
    if (!o.isMesh) return; const mats = Array.isArray(o.material) ? o.material : [o.material]; if (mats.length > 1) { keep.push(o); return; }
    const geo = o.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
    for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(k)) geo.deleteAttribute(k);
    if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
    if (!geo.attributes.normal) geo.computeVertexNormals();
    (by.get(mats[0]) || by.set(mats[0], []).get(mats[0])).push(geo.index ? geo.toNonIndexed() : geo); });
  const out = new THREE.Group();
  for (const [m, list] of by) { const mm = new THREE.Mesh(mergeGeometries(list), m); mm.castShadow = !m.transparent; mm.receiveShadow = true; out.add(mm); }
  for (const o of keep) { const w = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld); o.removeFromParent(); w.decompose(o.position, o.quaternion, o.scale); out.add(o); }
  return out;
}

export async function makeHeroes(scene, C, S, lib, atlas, lmGroups, found) {
  const HD = await fetch('../heroes/hdl.json').then(r => r.json()).catch(() => null); if (!HD) return {setEra() {}, groups: []};
  useLibrary(lib, atlas);
  const root = new THREE.Group(); scene.add(root); const placed = [];
  for (const h of HD.heroes) { const site = SITES[h.id]; if (!site) continue; const [W, D] = h.footprint;
    let x, y, gz, rot, hide = null;
    if (site.lm) { const i = C.meta.landmarks.findIndex(l => l.type === site.lm); if (i < 0) continue; const lm = C.meta.landmarks[i]; rot = lm.rot || 0;
      const [ox, oy] = site.offset || [0, 0], c = Math.cos(-rot), s = Math.sin(-rot); x = lm.x + ox * c + oy * s; y = lm.y - ox * s + oy * c; gz = Math.max(S.ground(x, y), 0.3);
      if (!site.offset) hide = lmGroups[i]; }
    else { const g = found.placed.find(p => p.userData.found.name === site.found); if (!g) continue; x = g.userData.x; y = g.userData.y; gz = g.position.y; rot = -(g.rotation.y - Math.PI); hide = g; }
    const holder = new THREE.Group(); holder.position.set(x, gz, y); holder.rotation.y = -rot; root.add(holder);
    placed.push({h, holder, hide, cache: {}, state: null, x, y, r: Math.hypot(W, D) / 2 + 4, born: h.eras.born}); }
  const stateOf = (h, e) => { const {born, ruined, reuse} = h.eras; if (born > e) return null; if (ruined != null && e >= ruined) return e >= 5 && reuse ? 'reuse' : 'ruin'; return 'intact'; };
  return {
    root, placed,
    footprints() { return placed.map(p => [p.x, p.y, p.r, p.born]); },
    setEra(e) { for (const p of placed) { const st = stateOf(p.h, e); if (p.hide) { p.hide.visible = false; p.hide.userData.heroed = true; }
      if (st === p.state) continue; p.state = st; p.holder.children.forEach(c => c.visible = false); if (!st) continue;
      if (!p.cache[st]) { const B = build(p.h, {state: st}); const [W, D] = p.h.footprint; B.group.position.set(-W / 2, 0, -D / 2); const wrap = new THREE.Group(); wrap.add(B.group); p.cache[st] = bake(wrap); p.cache[st].userData.hero = p.h; }
      if (!p.cache[st].parent) p.holder.add(p.cache[st]); p.cache[st].visible = true; } },
  };
}
