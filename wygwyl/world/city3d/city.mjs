// THE CITY — ground, streets, buildings, trees and the things that make streets legible, all read from the worldtext export.
// Everything here has a birth era (and some a death): setEra(e) re-grows the city to that moment in its history.
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export const COVER = ['WATER', 'BEACH', 'MARSH', 'FIELD', 'FOREST', 'ROCK', 'OLD', 'ROW', 'CIVIC', 'RELIC', 'MEADOW', 'BURNED', 'SUBURB', 'PORT', 'INDUSTRY'];
const COVER_COL = [0x2a3a3a, 0xd8c9a0, 0x6f7a48, 0xa8a060, 0x3c5a2c, 0x8a7f6c, 0x8c7a66, 0x7c6e62, 0x9a948a, 0x9a8c70, 0x7d9a4a, 0x2e2a26, 0x8a9a62, 0x7a7a76, 0x5e5a54];
const URBAN_BORN = {6: 1, 7: 2, 8: 1, 12: 3, 13: 1, 14: 3};
export const STYLES = ['old', 'row', 'civic', 'tower', 'suburb', 'port', 'industry', 'relic'];
const PALETTE = [[0x8a3b2a, 0xb9a27e, 0xa14b32, 0xc8b28a, 0x9c7a52], [0x7a3426, 0x8c4030, 0x6e2e24, 0x9a5a40, 0x5e3a30], [0xd8d2c4, 0xcfc8b6, 0xe2dccd],
  [0x3a4652, 0x556270, 0x6a7680, 0xb8b0a0, 0x9a9488, 0xc9c0ae, 0x7a6a5a], [0xd9c7a5, 0xc9d3c4, 0xe0b9a0, 0xb8c4cc], [0x3f6b6b, 0x8a5a3a, 0x6b6f72], [0x5a3a2e, 0x6b6258, 0x4a4844], [0x9a8c70]];
const FLOOR = [3.4, 3.1, 4.6, 3.7, 3.0, 5.5, 6.5, 4];
const ROOF_COL = [0x8e3d2c, 0x34373d, 0x5a5650, 0x2c3036, 0x6e5a48, 0x50585a, 0x404040, 0x6a6050];
// which surfaces each kind of building wears (indices into the archive material atlas: see wygwyl/world/language/materials.json)
const STYLE_SKINS = [['stucco', 'peeling paint', 'tile', 'whitewash', 'azulejo', 'tezontle'], ['red brick', 'red brick', 'red brick', 'yellow brick', 'soot brick', 'peeling paint'],
  ['cantera', 'marble', 'whitewash'], ['concrete', 'block', 'concrete'], ['stucco', 'wood siding', 'whitewash', 'teal paint'], ['corrugated', 'rust', 'wood siding', 'teal paint'],
  ['corrugated', 'rust', 'soot brick', 'block', 'concrete'], ['cantera', 'moss', 'tezontle']];
const ADD_SKINS = ['wood siding', 'teal paint', 'whitewash', 'corrugated'], ROOF_SKIN = ['terracotta', 'slate', 'verdigris', 'slate', 'terracotta', 'slate', 'slate', 'terracotta'];
let MAT_BY_STYLE = [[0]], ADD_MAT = [0], ROOF_MAT = [0], LIBI = {};
// the material library (wygwyl/world/language/library.json): every name → its tile; a building takes variant 0 or 1 by its seed
export function setLibrary(lib) { LIBI = {}; for (const m of lib.materials) LIBI[m.name] = m.base;
  const id = n => LIBI[n] ?? 0; MAT_BY_STYLE = STYLE_SKINS.map(a => a.map(id)); ADD_MAT = ADD_SKINS.map(id); ROOF_MAT = ROOF_SKIN.map(id); return LIBI; }
const GRIT = [0.8, 0.7, 0.4, 0.3, 0.3, 1.0, 1.0, 0.9];
let MAT = [6, 0, 0, 0.5];
const ADD_COL = [0xd8d0b8, 0x5f7f86, 0xb7a68c, 0x9a6a4a, 0xc9c2b0];

export async function loadCity(base) {
  const [meta, hb, cb, bb, tb, roads] = await Promise.all([
    fetch(base + 'city.json').then(r => r.json()), fetch(base + 'height.bin').then(r => r.arrayBuffer()), fetch(base + 'cover.bin').then(r => r.arrayBuffer()),
    fetch(base + 'buildings.f32').then(r => r.arrayBuffer()), fetch(base + 'trees.f32').then(r => r.arrayBuffer()), fetch(base + 'roads.json').then(r => r.json())]);
  const h16 = new Int16Array(hb), height = new Float32Array(h16.length); for (let i = 0; i < h16.length; i++) height[i] = h16[i] / 10;
  return {meta, height, cover: new Uint8Array(cb), bld: new Float32Array(bb), trees: new Float32Array(tb), roads};
}

export function sampler(C) {
  const {nx, ny, cell} = C.meta, h = C.height, cv = C.cover;
  // the height on the mesh's own triangles (diagonal from (i+1, j) to (i, j+1)), so streets and buildings sit exactly on the ground you see
  const ground = (x, y) => { const fx = Math.min(Math.max(x / cell, 0), nx - 1.001), fy = Math.min(Math.max(y / cell, 0), ny - 1.001), i = fx | 0, j = fy | 0, a = fx - i, b = fy - j, k = j * nx + i;
    return a + b <= 1 ? h[k] + a * (h[k + 1] - h[k]) + b * (h[k + nx] - h[k]) : h[k + nx + 1] + (1 - a) * (h[k + nx] - h[k + nx + 1]) + (1 - b) * (h[k + 1] - h[k + nx + 1]); };
  const cover = (x, y) => cv[Math.min(ny - 1, Math.max(0, Math.round(y / cell))) * nx + Math.min(nx - 1, Math.max(0, Math.round(x / cell)))];
  return {ground, cover};
}

const hash = (a, b = 0) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };

// ——— the ground: height + cover; urban ground is field until its era, the burned land is forest until the Fall ———
export function makeTerrain(C) {
  const {nx, ny, cell} = C.meta, n = nx * ny, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const k = j * nx + i; pos[k * 3] = i * cell; pos[k * 3 + 1] = C.height[k]; pos[k * 3 + 2] = j * cell; }
  const idx = new Uint32Array((nx - 1) * (ny - 1) * 6); let q = 0;
  for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i; idx.set([a, a + nx, a + 1, a + 1, a + nx, a + nx + 1], q); q += 6; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1)); geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({vertexColors: true, roughness: 0.95})); mesh.receiveShadow = true;
  const nrm = geo.attributes.normal.array, c = new THREE.Color(), tint = new THREE.Color();
  mesh.userData.paint = (era, wards) => {
    for (let k = 0; k < n; k++) {
      let cv = C.cover[k]; const ht = C.height[k];
      if (URBAN_BORN[cv] > era) cv = 10; if (cv === 11 && era < 4) cv = 4;
      c.setHex(COVER_COL[cv]);
      const slope = 1 - nrm[k * 3 + 1]; if (slope > 0.25 && cv !== 0) c.lerp(tint.setHex(0x7a7166), Math.min(1, (slope - 0.25) * 3));
      if (ht < 0) c.lerp(tint.setHex(0x1c2a2c), Math.min(1, -ht / 12)); else if (ht < 1.2) c.lerp(tint.setHex(0xb8a88a), 0.5);
      if (ht > 140) c.lerp(tint.setHex(0xd8d4cc), Math.min(1, (ht - 140) / 40) * 0.5);
      const nz = hash(k * 0.013, k % 97) * 0.12 - 0.06; c.r += nz; c.g += nz; c.b += nz * 0.7;
      if (wards) { const w = wards[k]; if (w >= 0) { tint.setHSL((w * 0.137) % 1, 0.65, 0.5); c.lerp(tint, wards.edge[k] ? 0.85 : 0.18); } }
      col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b;
    }
    geo.attributes.color.needsUpdate = true;
  };
  // a skirt so the edge of the world is a shelf, not a paper edge
  const sk = new THREE.Mesh(new THREE.BoxGeometry(nx * cell, 60, ny * cell), new THREE.MeshStandardMaterial({color: 0x1a2224})); sk.position.set(nx * cell / 2, -90, ny * cell / 2); mesh.add(sk);
  return mesh;
}

// wards: the voting districts — every urban cell votes with its nearest district; boundaries are drawn where the vote changes
export function makeWards(C) {
  const {nx, ny, cell} = C.meta, urban = C.meta.districts.filter(d => !d.natural);
  const w = new Int16Array(nx * ny).fill(-1);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const k = j * nx + i; if (!URBAN_BORN[C.cover[k]]) continue;
    let best = -1, bd = 2.2e6; urban.forEach((d, q) => { const dd = (d.x - i * cell) ** 2 + (d.y - j * cell) ** 2; if (dd < bd) { bd = dd; best = q; } }); w[k] = best; }
  const edge = new Uint8Array(nx * ny);
  for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) { const k = j * nx + i; if (w[k] < 0) continue; if (w[k + 1] !== w[k] && w[k + 1] >= 0 || w[k + nx] !== w[k] && w[k + nx] >= 0) edge[k] = 1; }
  w.edge = edge; w.list = urban.map((d, q) => ({...d, ward: q + 1})); return w;
}

// ——— streets: ribbons with a real surface — cobbles in the oldest streets, asphalt with lines, concrete highways, stone processional slabs ———
const RCLS = [{w: 10, side: 0.17, name: 'street'}, {w: 18, side: 0.14, name: 'arterial'}, {w: 24, side: 0, name: 'highway'}, {w: 15, side: 0.22, name: 'spine'}, {w: 42, side: 0.1, name: 'processional avenue'}];
export function makeRoads(C, S, U) {
  const P = [], N = [], UV = [], A = [], I = []; let v = 0;
  const br = C.meta.landmarks.find(l => l.type === 'bridge');
  const deckAt = (x, y, cls) => { if (cls !== 2 || !br) return null; const dx = Math.cos(br.rot), dy = Math.sin(br.rot), rx = x - br.x, ry = y - br.y, t = rx * dx + ry * dy, o = Math.abs(-rx * dy + ry * dx);
    const half = (br.span || 800) / 2 + 30; if (o > 40 || Math.abs(t) > half + 160) return null; return 27.6 * Math.min(1, (half + 160 - Math.abs(t)) / 160); };
  for (const [cls, born, flat] of C.roads) {
    const R = RCLS[cls], pts = [];
    for (let i = 0; i < flat.length - 2; i += 2) { const ax = flat[i], ay = flat[i + 1], bx = flat[i + 2], by = flat[i + 3], L = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.ceil(L / 7));
      for (let k = 0; k < n; k++) pts.push([ax + (bx - ax) * k / n, ay + (by - ay) * k / n]); }
    pts.push([flat[flat.length - 2], flat[flat.length - 1]]); if (pts.length < 2) continue;
    let along = 0;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      if (i) along += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]);
      const g = S.ground(p[0], p[1]), dk = deckAt(p[0], p[1], cls);
      const y = Math.max(dk ?? -1e9, Math.max(g, 0.35) + 0.22 + (cls === 4 ? 0.08 : 0));
      for (const s of [-1, 1]) { P.push(p[0] - ty * s * R.w / 2, y, p[1] + tx * s * R.w / 2); N.push(0, 1, 0); UV.push(s < 0 ? 0 : 1, along); A.push(cls, born, R.side, R.w); }
      if (i) I.push(v - 2, v, v - 1, v - 1, v, v + 1); v += 2;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); geo.setAttribute('aRoad', new THREE.Float32BufferAttribute(A, 4)); geo.setIndex(I);
  const m = new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 0.9, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2});
  m.onBeforeCompile = sh => {
    sh.uniforms.uEra = U.era; sh.uniforms.uNight = U.night; sh.uniforms.uWet = U.wet; sh.uniforms.uMatAtlas = U.matAtlas; sh.uniforms.uMatGrid = U.matGrid; sh.uniforms.uLib = U.libRoad;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aRoad; varying vec4 vRoad; varying vec2 vRU;')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\nvRoad = aRoad; vRU = uv;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      uniform float uEra, uNight, uWet; uniform sampler2D uMatAtlas; uniform vec2 uMatGrid; uniform vec4 uLib; varying vec4 vRoad; varying vec2 vRU;
      float rh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float rn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(rh(i), rh(i + vec2(1, 0)), f.x), mix(rh(i + vec2(0, 1)), rh(i + vec2(1, 1)), f.x), f.y); }
      vec3 matTex(float i, vec2 m) { vec2 cell = vec2(mod(i, uMatGrid.x), floor(i / uMatGrid.x)); vec2 f = fract(m);
        vec2 uv = vec2((cell.x + f.x) / uMatGrid.x, 1.0 - (cell.y + 1.0 - f.y) / uMatGrid.y); return textureGrad(uMatAtlas, uv, dFdx(m) / uMatGrid, dFdy(m) / uMatGrid).rgb; }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
      if (vRoad.y > uEra + 0.5) discard;
      float cls = vRoad.x, side = vRoad.z, W = vRoad.w; float u = vRU.x, a = vRU.y, x = u * W;
      vec3 asph = vec3(0.16, 0.16, 0.17) + 0.04 * rh(floor(vec2(x, a) * 3.0));
      bool cobble = vRoad.y < 1.5 && cls < 0.5;
      vec3 c = asph; float mk = 0.0;
      if (cobble) { vec2 q = vec2(x * 2.2 + 0.5 * mod(floor(a * 2.0), 2.0), a * 2.0); vec2 f = fract(q); c = vec3(0.36, 0.33, 0.3) * (0.75 + 0.35 * rh(floor(q))) * (0.55 + 0.45 * smoothstep(0.0, 0.12, min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y)))); }
      if (cls > 1.5 && cls < 2.5) { c = vec3(0.42, 0.41, 0.39) * (0.85 + 0.1 * rh(floor(vec2(x * 0.25, a * 0.2)))); if (mod(a, 5.0) < 0.06) c *= 0.7;
        float lane = abs(fract(x / 3.7 + 0.5) - 0.5) * 3.7; mk = step(lane, 0.08) * step(mod(a, 12.0), 4.0) * step(1.0, x) * step(x, W - 1.0); mk = max(mk, step(abs(x - 0.9), 0.1) + step(abs(x - W + 0.9), 0.1)); }
      if (cls > 0.5 && cls < 1.5) { float cx = abs(x - W * 0.5); mk = step(abs(cx - 0.18), 0.07); c = mix(c, vec3(0.85, 0.65, 0.12), mk); mk = 0.0;
        float lane = abs(cx - 3.6); mk = step(lane, 0.07) * step(mod(a, 9.0), 3.0); }
      if (cls > 2.5 && cls < 3.5) { vec2 q = vec2(x * 1.4, a * 1.4); c = vec3(0.47, 0.42, 0.36) * (0.8 + 0.25 * rh(floor(q))); if (abs(x - W * 0.5) < 1.2) c = vec3(0.22, 0.33, 0.16); }
      if (cls > 3.5) { vec2 q = vec2(x / 3.0, a / 3.0); vec2 f = fract(q); c = vec3(0.62, 0.56, 0.48) * (0.85 + 0.2 * rh(floor(q))) * (0.7 + 0.3 * step(0.04, min(f.x, f.y))); }
      // the asphalt and the slabs are cut from the archive; then the wear: oil, patches, manholes, zebra at the corner, puddles when wet
      if (!cobble && cls < 2.5) { vec3 at = matTex(uLib.x, vec2(x, a) / 7.0); c *= 0.55 + 0.9 * dot(at, vec3(0.33)); }
      if (cobble) c = mix(c, matTex(uLib.z, vec2(x, a) / 3.0) * 0.85, 0.65);
      if (cls > 3.5) c = mix(c, matTex(uLib.y, vec2(x, a) / 6.0) * 0.85, 0.65);
      float oil = smoothstep(0.62, 0.8, rn(vec2(x * 0.35, a * 0.12))) * step(side * W + 0.5, x) * step(x, W - side * W - 0.5); c *= 1.0 - 0.3 * oil;
      float patchy = step(0.82, rn(vec2(x * 0.09, a * 0.05))); c = mix(c, c * 0.75 + 0.03, patchy * 0.6);
      if (cls < 1.5) { float m0 = length(vec2(x - W * 0.5 - 1.6, mod(a, 37.0) - 18.0)); c = mix(c, vec3(0.08), (1.0 - smoothstep(0.32, 0.36, m0)) * 0.9 + (step(abs(m0 - 0.28), 0.03)) * 0.5); }
      if (cls < 1.5 && a < 5.0 && a > 1.2 && x > side * W && x < W - side * W) mk = max(mk, step(fract(x / 1.1), 0.55));
      c = mix(c, vec3(0.92), mk * 0.85);
      float puddle = smoothstep(0.58, 0.66, rn(vec2(x * 0.22, a * 0.09) + 3.0)) * uWet; c = mix(c, c * 0.45, puddle);
      float sw = side * W, inS = step(x, sw) + step(W - sw, x);
      if (side > 0.0 && inS > 0.0) { float e = min(abs(x - sw), abs(x - (W - sw))); vec2 q = vec2(x * 1.6, a * 1.6); c = vec3(0.6, 0.58, 0.54) * (0.88 + 0.12 * rh(floor(q)));
        c = mix(c, matTex(uLib.w, vec2(x, a) / 3.0), 0.6);
        if (e < 0.25) c = vec3(0.75, 0.73, 0.7); if (fract(q.y * 0.5) < 0.04) c *= 0.85; }
      c *= 1.0 - uWet * 0.35;
      diffuseColor.rgb = c;`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.15, uWet); roughnessFactor = mix(roughnessFactor, 0.02, smoothstep(0.58, 0.66, rn(vec2(vRU.x * vRoad.w * 0.22, vRU.y * 0.09) + 3.0)) * uWet);');
  };
  const mesh = new THREE.Mesh(geo, m); mesh.receiveShadow = true; return mesh;
}

// ——— the facade shader: windows by floor and bay in world space, shop fronts at street level, lights at night, neon for the clubs, glass for the rebuilt ———
export function facadeMat(U, opts = {}) {
  const m = new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 0.84});
  m.onBeforeCompile = sh => {
    sh.uniforms.uNight = U.night; sh.uniforms.uTime = U.time; sh.uniforms.uWet = U.wet; sh.uniforms.uPulseO = U.pulseO; sh.uniforms.uPulseT = U.pulseT;
    sh.uniforms.uMatAtlas = U.matAtlas; sh.uniforms.uMatGrid = U.matGrid; sh.uniforms.uLib = U.libFacade;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aInfo; attribute vec4 aMat; varying vec4 vInfo; varying vec4 vMat; varying vec3 vWP; varying vec3 vWN;')
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
        vec4 q4 = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          q4 = instanceMatrix * q4; vWN = normalize(mat3(instanceMatrix) * objectNormal);
        #else
          vWN = normalize(mat3(modelMatrix) * objectNormal);
        #endif
        vWP = (modelMatrix * q4).xyz; vInfo = aInfo; vMat = aMat;`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      uniform float uNight, uTime, uWet, uPulseT; uniform vec2 uPulseO; uniform sampler2D uMatAtlas; uniform vec2 uMatGrid; uniform vec4 uLib; varying vec4 vMat; varying vec4 vInfo; varying vec3 vWP; varying vec3 vWN;
      float fh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(fh(i), fh(i + vec2(1, 0)), f.x), mix(fh(i + vec2(0, 1)), fh(i + vec2(1, 1)), f.x), f.y); }
      // a surface cut from the archive: tile i of the material atlas, sampled in metres, mip-safe across the tile seam
      vec3 matTex(float i, vec2 m) { vec2 cell = vec2(mod(i, uMatGrid.x), floor(i / uMatGrid.x)); vec2 f = fract(m);
        vec2 uv = vec2((cell.x + f.x) / uMatGrid.x, 1.0 - (cell.y + 1.0 - f.y) / uMatGrid.y);
        return textureGrad(uMatAtlas, uv, dFdx(m) / uMatGrid, dFdy(m) / uMatGrid).rgb; }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
      vec3 bEmis = vec3(0.0);
      {
        float seed = vInfo.x, base = vInfo.y, kind = vInfo.z, fl = vInfo.w;
        float vert = 1.0 - smoothstep(0.35, 0.7, abs(vWN.y));
        vec2 tg = normalize(vec2(-vWN.z, vWN.x) + 1e-5);
        bool glass = kind > 1.5 && kind < 2.5, ruin = kind > 2.5 && kind < 3.5, club = kind > 0.5 && kind < 1.5, addn = kind > 3.5;
        float ceramic = kind > 4.5 ? 1.0 : 0.0;
        float dist0 = length(cameraPosition - vWP), near = 1.0 - smoothstep(250.0, 700.0, dist0);
        vec2 tg0 = normalize(vec2(-vWN.z, vWN.x) + 1e-5); float uw = dot(vWP.xz, tg0);
        // 1 · the skin: the district's colour carried by a surface cut from its footage
        if (near > 0.0 && ceramic < 0.5) {
          vec2 tm = vert > 0.5 ? vec2(uw, vWP.y) / 4.5 : vWP.xz / 6.0;
          vec3 tx = matTex(vMat.x, tm); float l = dot(tx, vec3(0.3, 0.59, 0.11));
          vec3 skin = mix(diffuseColor.rgb * (0.3 + 1.5 * l), tx * (0.7 + 0.6 * diffuseColor.rgb), 0.55);
          diffuseColor.rgb = mix(diffuseColor.rgb, skin, near * 0.9);
          if (vMat.y > 0.5 && vert > 0.5 && vWP.y - vInfo.y < 3.2) { vec3 gx = matTex(uLib.x, vec2(uw, vWP.y) / 3.0);   // graffiti at hand height
            diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * gx * 1.5, near * 0.65); }
          if (ruin) diffuseColor.rgb = mix(diffuseColor.rgb, matTex(uLib.y, tm), near * 0.45 * smoothstep(0.35, 0.75, vn(vWP.xz * 0.3 + vWP.y * 0.2)));   // moss takes the ruins
        }
        // 2 · grit: rain streaks under the sills, grime at the foot, soot at the top of industry
        float streak = smoothstep(0.55, 1.0, vn(vec2(uw * 1.6, vWP.y * 0.07))) * vert * vMat.w;
        diffuseColor.rgb *= 1.0 - 0.28 * streak - 0.25 * (1.0 - smoothstep(0.0, 1.6, vWP.y - vInfo.y)) * vert;
        // 3 · the flood datum: every building that stood in the Fall carries the same salt line at +4 m — one level across the whole city
        if (vMat.z > 0.5 && vert > 0.5) { float y = vWP.y; float wob = (vn(vec2(uw * 0.4, 1.0)) - 0.5) * 0.25;
          float salt = smoothstep(3.3, 3.5, y + wob) * (1.0 - smoothstep(4.0, 4.45, y + wob)) * (0.75 + 0.25 * vn(vec2(uw * 3.0, y * 9.0)));
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.93, 0.92, 0.87), salt * 0.95);
          float under = 1.0 - smoothstep(3.25, 3.45, y + wob); diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.42, 0.55, 0.45), under * 0.85); }
        float bay = glass ? 1.8 : (addn ? 2.6 : 3.3);
        float uu = dot(vWP.xz, tg) / bay, vv = (vWP.y - base) / fl;
        vec2 cell = vec2(floor(uu), floor(vv)), f = fract(vec2(uu, vv));
        float win = step(0.24, f.x) * step(f.x, 0.76) * step(0.3, f.y) * step(f.y, 0.85) * step(1.0, vv);
        float shop = step(0.06, vv) * step(vv, 0.8) * step(0.1, f.x) * step(f.x, 0.9) * (addn ? 0.0 : 1.0);
        float w = max(win, shop) * vert;
        float dist = length(cameraPosition - vWP), far = smoothstep(450.0, 1500.0, dist);
        float r = fh(cell + seed * 13.1);
        vec3 gl = mix(vec3(0.07, 0.09, 0.12), vec3(0.32, 0.4, 0.48), fh(cell + seed + 3.0) * 0.6);
        if (glass) gl = vec3(0.18, 0.3, 0.34);
        if (ruin) { gl = vec3(0.02); diffuseColor.rgb *= mix(0.45, 1.0, smoothstep(0.0, 1.5, vv)) * 0.8; }
        // the window as built: a trim, a stone lintel and sill, mullions; the glass takes the sky at a glancing angle
        vec3 Vv = normalize(cameraPosition - vWP); float fres = pow(1.0 - abs(dot(Vv, normalize(vWN))), 3.0);
        gl = mix(gl, vec3(0.62, 0.68, 0.74), fres * 0.65 * (1.0 - uNight));
        float trimZone = step(0.205, f.x) * step(f.x, 0.795) * step(0.255, f.y) * step(f.y, 0.93) * step(1.0, vv) * vert * (1.0 - far) * (glass ? 0.0 : 1.0);
        float trim = max(0.0, trimZone - win);
        float mull = win * (step(abs(f.x - 0.5), 0.014) + step(abs(f.y - 0.63), 0.014));
        vec3 trimC = (vMat.x < 2.5) ? vec3(0.86, 0.82, 0.73) : vec3(0.36, 0.37, 0.38);
        diffuseColor.rgb = mix(diffuseColor.rgb, trimC, clamp(trim + mull, 0.0, 1.0) * 0.9);
        w *= 1.0 - clamp(mull, 0.0, 1.0);
        diffuseColor.rgb = mix(diffuseColor.rgb, gl, mix(w, 0.25 * vert, far));
        // 4 · kintsugi of the Resurrection: the ruin repaired with white ceramic plates, the seams drawn in cyan light
        if (glass || ceramic > 0.5) { vec2 kp = vec2(uw, vWP.y) / 3.4; vec2 ki = floor(kp), kf = fract(kp); float d1 = 9.0, d2 = 9.0; vec2 cid = ki;
          for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 o = vec2(i, j); vec2 r = o + vec2(fh(ki + o), fh(ki + o + 7.1)) - kf; float dd = dot(r, r);
            if (dd < d1) { d2 = d1; d1 = dd; cid = ki + o; } else if (dd < d2) d2 = dd; }
          float plate = max(ceramic, step(0.42, fh(cid * 1.7))) * vert, seam = (1.0 - smoothstep(0.0, 0.07, sqrt(d2) - sqrt(d1))) * plate;
          vec3 cer = mix(vec3(0.93, 0.92, 0.88), matTex(uLib.z, vec2(uw, vWP.y) / 2.5) * 1.1, 0.6 * near);
          diffuseColor.rgb = mix(diffuseColor.rgb, cer, plate * (1.0 - w) * 0.92);
          bEmis += vec3(0.37, 0.9, 1.0) * seam * (0.35 + 1.4 * uNight); }
        float cor = step(0.0, vv) * vert * step(fract(vv), 0.05) * (glass ? 0.0 : 1.0); diffuseColor.rgb *= 1.0 - 0.18 * cor;
        diffuseColor.rgb *= mix(1.0, 0.8, step(0.6, vWN.y));
        diffuseColor.rgb *= 1.0 - 0.25 * uWet * vert;
        float litFrac = ruin ? 0.0 : (shop > 0.5 ? 0.6 : 0.2 + 0.12 * fract(seed * 31.0));
        float lit = step(1.0 - litFrac, r) * uNight;
        vec3 lc = mix(vec3(1.0, 0.7, 0.4), vec3(0.8, 0.88, 1.0), step(0.82, fh(cell + seed + 7.0)));
        bEmis = lc * lit * w * 1.1 * (1.0 - far) + lc * far * 0.07 * uNight * vert * (ruin ? 0.0 : 1.0);
        if (club) { float band = step(0.92, vv) * step(vv, 1.08) * vert; float pulse = 0.6 + 0.4 * sin(uTime * 3.0 + seed * 9.0);
          bEmis += mix(vec3(1.0, 0.1, 0.55), vec3(0.1, 0.9, 1.0), step(0.5, fract(seed * 7.0))) * band * 3.0 * uNight * pulse; diffuseColor.rgb *= 0.55; }
        { float pd = length(vWP.xz - uPulseO); float ring = exp(-pow((pd - uPulseT * 420.0) / 45.0, 2.0)) * exp(-uPulseT * 0.25);   // the resonance passing through
          bEmis += vec3(0.37, 0.9, 1.0) * ring * (0.6 + 1.6 * w) * (0.4 + uNight); }
      }`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += bEmis;');
  };
  return m;
}

// roofs: terracotta, slate or verdigris from the library, laid in world metres along the slope
function roofMat(U) {
  const m = new THREE.MeshStandardMaterial({roughness: 0.8});
  m.onBeforeCompile = sh => { sh.uniforms.uMatAtlas = U.matAtlas; sh.uniforms.uMatGrid = U.matGrid;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aMat; varying vec4 vMat; varying vec3 vWP;')
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
        vec4 q4 = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          q4 = instanceMatrix * q4;
        #endif
        vWP = (modelMatrix * q4).xyz; vMat = aMat;`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      uniform sampler2D uMatAtlas; uniform vec2 uMatGrid; varying vec4 vMat; varying vec3 vWP;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
      { vec2 mm = vWP.xz / 4.0 + vec2(vWP.y * 0.25); vec2 cell = vec2(mod(vMat.x, uMatGrid.x), floor(vMat.x / uMatGrid.x)); vec2 f = fract(mm);
        vec2 uv = vec2((cell.x + f.x) / uMatGrid.x, 1.0 - (cell.y + 1.0 - f.y) / uMatGrid.y);
        vec3 t = textureGrad(uMatAtlas, uv, dFdx(mm) / uMatGrid, dFdy(mm) / uMatGrid).rgb;
        float near = 1.0 - smoothstep(300.0, 900.0, length(cameraPosition - vWP));
        diffuseColor.rgb = mix(diffuseColor.rgb, mix(diffuseColor.rgb * (0.5 + dot(t, vec3(0.6))), t, 0.5), near); }`); };
  return m;
}
function unitBox() { const g = new THREE.BoxGeometry(1, 1, 1); g.translate(0, 0.5, 0); return g; }
function ruinBox() { const g = new THREE.BoxGeometry(1, 1, 1, 6, 4, 6); g.translate(0, 0.5, 0); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) if (p.getY(i) > 0.3) { const k = 0.5 + 0.5 * Math.sin(p.getX(i) * 9.1 + 1.3) * Math.cos(p.getZ(i) * 7.7); p.setY(i, Math.max(0.3, p.getY(i) - k * 0.65)); }
  g.computeVertexNormals(); return g; }
function gableGeo() { const s = new THREE.Shape(); s.moveTo(-0.5, 0); s.lineTo(0.5, 0); s.lineTo(0, 1); s.lineTo(-0.5, 0);
  const g = new THREE.ExtrudeGeometry(s, {depth: 1, bevelEnabled: false}); g.translate(0, 0, -0.5); g.rotateY(Math.PI / 2); return g; }   // ridge along x, span along z

// ——— the buildings ———
export function makeBuildings(C, U) {
  const B = C.bld, n = B.length / 14, cap = n * 2;
  const mk = (geo, mat, c) => { geo.setAttribute('aInfo', new THREE.InstancedBufferAttribute(new Float32Array(c * 4), 4)); geo.setAttribute('aMat', new THREE.InstancedBufferAttribute(new Float32Array(c * 4), 4)); const m = new THREE.InstancedMesh(geo, mat, c);
    m.castShadow = m.receiveShadow = true; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.setColorAt(0, new THREE.Color()); return m; };
  const fm = facadeMat(U);
  const body = mk(unitBox(), fm, cap), ruins = mk(ruinBox(), fm, n), roofGeo = gableGeo(); roofGeo.setAttribute('aMat', new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4));
  const roofs = new THREE.InstancedMesh(roofGeo, roofMat(U), n);
  roofs.castShadow = roofs.receiveShadow = true; roofs.setColorAt(0, new THREE.Color());
  const alleys = new THREE.InstancedMesh(unitBox(), new THREE.MeshStandardMaterial({color: 0x56524c, roughness: 0.95}), n); alleys.receiveShadow = true;
  const group = new THREE.Group(); group.add(body, ruins, roofs, alleys);
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), Sc = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0), col = new THREE.Color();
  const owner = {body: [], ruins: [], roofs: []};
  function put(mesh, i, x, y, z, rot, sx, sy, sz, info, c) {
    Q.setFromAxisAngle(Y, -rot); M4.compose(V.set(x, y, z), Q, Sc.set(sx, sy, sz)); mesh.setMatrixAt(i, M4); mesh.setColorAt(i, c);
    if (info) mesh.geometry.attributes.aInfo.array.set(info, i * 4);
    if (mesh.geometry.attributes.aMat) mesh.geometry.attributes.aMat.array.set(MAT, i * 4);
  }
  group.userData.state = (k, era) => {                       // what building k is at this era
    const o = k * 14, born = B[o + 7], ruin = B[o + 8], reuse = B[o + 9];
    if (born > era) return null; if (ruin <= era) return era >= 5 && reuse === 1 ? 'rebuilt in glass' : era >= 5 && reuse === 2 ? 'a club under neon' : 'ruin';
    return 'standing';
  };
  group.userData.owner = owner;
  // the landmarks and squares keep their ground: no generic building stands inside their footprint
  const clear = [...C.meta.landmarks.filter(l => l.r > 0 && l.type !== 'bridge').map(l => [l.x, l.y, l.r * 1.25 + 10]), ...C.meta.plazas.map(p => [p.x, p.y, p.r + 8])];
  let extra = [];
  group.userData.setExtraClear = list => { extra = list; };                // the evolved structures take their lots when they are built
  const keep = new Uint8Array(n); for (let k = 0; k < n; k++) { const x = B[k * 14], y = B[k * 14 + 1], w = Math.max(B[k * 14 + 2], B[k * 14 + 3]) / 2; keep[k] = clear.every(([cx, cy, r]) => Math.hypot(x - cx, y - cy) > r + w) ? 1 : 0; }
  group.userData.setEra = era => {
    let nb = 0, nr = 0, nf = 0, na = 0; owner.body.length = owner.ruins.length = owner.roofs.length = 0;
    for (let k = 0; k < n; k++) {
      const o = k * 14, x = B[o], y = B[o + 1], w = B[o + 2], d = B[o + 3], rot = B[o + 4], h = B[o + 5], st = B[o + 6], born = B[o + 7], ruin = B[o + 8], reuse = B[o + 9], roof = B[o + 10], ah = B[o + 11], ab = B[o + 12], gz = B[o + 13];
      if (born > era || !keep[k]) continue;
      if (extra.length && extra.some(([cx, cy, r, eb]) => eb <= era && Math.abs(B[o] - cx) < r && Math.abs(B[o + 1] - cy) < r && Math.hypot(B[o] - cx, B[o + 1] - cy) < r)) continue;
      const seed = hash(k, 3), pal = PALETTE[st] || PALETTE[0]; col.setHex(pal[Math.floor(seed * pal.length)]); col.offsetHSL(0, 0, (hash(k, 9) - 0.5) * 0.06);
      const fl = FLOOR[st] || 3.3, ruined = ruin <= era;
      const ms = MAT_BY_STYLE[st] || [6], s2 = hash(k, 21);
      MAT = [ms[Math.floor(s2 * ms.length)] + (hash(k, 24) < 0.5 ? 0 : 1), (st === 1 || st >= 5 || ruined) && hash(k, 22) < 0.35 ? 1 : 0, born <= 3 && era >= 4 && gz < 9 ? 1 : 0, GRIT[st] ?? 0.6];
      // the back alley behind rowhouses and the old center: a paved lane the depth of a cart
      // (rot encodes the street side: the back of the lot is (−sin rot, cos rot), the street is the other way)
      if (st <= 1) put(alleys, na++, x - Math.sin(rot) * (d / 2 + 2.4), Math.max(gz, 0.3) + 0.02, y + Math.cos(rot) * (d / 2 + 2.4), rot, w + 0.4, 0.25, 3.6, null, col);
      if (ruined && !(era >= 5 && reuse)) {
        put(ruins, nr, x, gz - 2, y, rot, w, h * (0.35 + 0.3 * seed) + 2, d, [seed, gz, 3, fl], col.multiplyScalar(0.8)); owner.ruins[nr++] = k; continue; }
      let kind = 0, H = st === 3 ? Math.min(h, 22 + h * 0.5) : h;     // the generic towers stay below the hand-modeled skyline
      if (ruined && reuse === 1) kind = 2;
      if (ruined && reuse === 2) kind = 1;
      if (st === 3 && H > 55 && kind === 0) {                   // a tower steps back as it rises: base, shaft, crown
        const h1 = H * (0.55 + 0.15 * seed), h2 = H - h1; put(body, nb, x, gz - 3, y, rot, w, h1 + 3, d, [seed, gz, kind, fl], col); owner.body[nb++] = k;
        put(body, nb, x, gz + h1, y, rot, w * 0.72, h2, d * 0.72, [seed, gz, kind, fl], col); owner.body[nb++] = k;
        if (seed > 0.5) { put(body, nb, x, gz + H, y, rot, w * 0.34, 4 + seed * 10, d * 0.34, [seed, gz, kind, fl], col); owner.body[nb++] = k; }
      } else { put(body, nb, x, gz - 3, y, rot, w, H + 3, d, [seed, gz, kind, fl], col); owner.body[nb++] = k; }
      if (!ruined && ah > 0 && ab <= era) {                   // the addition: lighter, later, set back — the house that grew
        const ox = -Math.sin(rot) * d * 0.15, oy = Math.cos(rot) * d * 0.15; col.setHex(ADD_COL[Math.floor(hash(k, 5) * ADD_COL.length)]);
        MAT = [ADD_MAT[Math.floor(hash(k, 23) * ADD_MAT.length)] + (hash(k, 25) < 0.5 ? 0 : 1), 0, 0, 0.4]; put(body, nb, x + ox, gz + h, y + oy, rot, w * 0.72, ah, d * 0.6, [seed + 0.5, gz + h, 4, 2.9], col); owner.body[nb++] = k; }
      if (kind === 2) { col.setHex(0xefece6); put(body, nb, x - Math.sin(rot) * d * 0.1, gz + H, y + Math.cos(rot) * d * 0.1, rot, w * 0.8, 3 + seed * 6, d * 0.7, [seed, gz + H, 5, 3.0], col); owner.body[nb++] = k; }   // the ceramic crown of a repaired house
      if (!ruined && roof === 1 && kind === 0) { col.setHex(ROOF_COL[st] || 0x444444); col.offsetHSL(0, 0, (seed - 0.5) * 0.08);
        MAT = [ROOF_MAT[st] + (seed < 0.5 ? 0 : 1), 0, 0, 0.5]; put(roofs, nf, x, gz + h, y, rot, w, Math.min(d * 0.38, 6), d, null, col); owner.roofs[nf++] = k; }
    }
    for (const [m, c] of [[body, nb], [ruins, nr], [roofs, nf], [alleys, na]]) { m.count = c; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
      if (m.geometry.attributes.aInfo) m.geometry.attributes.aInfo.needsUpdate = true; if (m.geometry.attributes.aMat) m.geometry.attributes.aMat.needsUpdate = true; m.computeBoundingSphere(); m.computeBoundingBox?.(); }
    return {standing: nb, ruins: nr};
  };
  group.userData.meshes = {body, ruins, roofs};
  return group;
}

// ——— kits: small vertex-coloured models for instancing (trees, lamps, bus stops, café tables, cranes, containers) ———
function kit(parts) {
  return mergeGeometries(parts.map(([geo, c, x = 0, y = 0, z = 0, ry = 0, rz = 0]) => {
    const g = (geo.index ? geo.toNonIndexed() : geo); g.rotateZ(rz); g.rotateY(ry); g.translate(x, y, z);
    const C = new THREE.Color(c), a = new Float32Array(g.attributes.position.count * 3); for (let i = 0; i < a.length; i += 3) { a[i] = C.r; a[i + 1] = C.g; a[i + 2] = C.b; }
    g.setAttribute('color', new THREE.BufferAttribute(a, 3)); for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(k)) g.deleteAttribute(k); return g; }));
}
const bx = (w, h, d) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(0, h / 2, 0); return g; };
const cy = (r1, r2, h, s = 7) => { const g = new THREE.CylinderGeometry(r1, r2, h, s); g.translate(0, h / 2, 0); return g; };
const co = (r, h, s = 7) => { const g = new THREE.ConeGeometry(r, h, s); g.translate(0, h / 2, 0); return g; };
const ic = (r, d = 1) => new THREE.IcosahedronGeometry(r, d);
const SPECIES = [
  ['broadleaf', () => kit([[cy(0.25, 0.35, 4), 0x4a3828], [ic(3.2), 0x3f6a2e, 0, 6.2], [ic(2.4), 0x4b7a34, 1.4, 7.6, 0.8], [ic(2.2), 0x386028, -1.3, 7.2, -0.9]])],
  ['pine', () => kit([[cy(0.2, 0.3, 4), 0x4a3828], [co(2.6, 5), 0x24452a, 0, 3], [co(2.1, 4.5), 0x2a4f30, 0, 6], [co(1.4, 4), 0x2e5634, 0, 9]])],
  ['palm', () => kit([[cy(0.2, 0.3, 11, 6), 0x7a6450, 0, 0, 0, 0, 0.05], ...[0, 1, 2, 3, 4, 5, 6].map(i => [bx(0.5, 0.15, 4.5), 0x4c7a30, Math.cos(i * 0.9) * 1.6, 10.8, Math.sin(i * 0.9) * 1.6, -i * 0.9 + Math.PI / 2])])],
  ['cypress', () => kit([[cy(0.2, 0.25, 1.5), 0x4a3828], [new THREE.SphereGeometry(1.4, 8, 10).scale(1, 4.5, 1).translate(0, 7, 0), 0x22402a]])],
  ['flowering', () => kit([[cy(0.2, 0.3, 3), 0x4a3828], [ic(2.8), 0x8a62c8, 0, 4.8], [ic(1.9), 0xa07ad8, 1.2, 6, 0.4], [ic(1.8), 0x7a52b0, -1.1, 5.6, -0.6]])],   // jacaranda
  ['burned', () => kit([[cy(0.18, 0.32, 8, 5), 0x1e1a18], [cy(0.08, 0.12, 3, 4), 0x1e1a18, 0.6, 4.5, 0, 0, -0.7], [cy(0.08, 0.12, 2.6, 4), 0x1e1a18, -0.5, 5.5, 0, 0, 0.8]])],
  ['reed', () => kit([0, 1, 2, 3, 4, 5].map(i => [co(0.12, 2.2 + (i % 3) * 0.4, 4), i % 2 ? 0x8a8a4a : 0x6a7a3a, Math.cos(i * 1.1) * 0.6, 0, Math.sin(i * 1.1) * 0.6]))],
  ['agave', () => kit([0, 1, 2, 3, 4, 5, 6, 7].map(i => [co(0.25, 1.8, 4), 0x6a8a7a, Math.cos(i * 0.785) * 0.5, 0, Math.sin(i * 0.785) * 0.5, -i * 0.785, 0.55]))],   // maguey
  ['giant', () => kit([[cy(1.2, 2.0, 10), 0x3e2e22], [ic(8, 1), 0x2f4a24, 0, 16], [ic(6), 0x385a2a, 5, 14, 3], [ic(6), 0x2a4420, -5, 15, -2]])],
];
export function makeTrees(C) {
  const T = C.trees, n = T.length / 6, group = new THREE.Group(), meshes = [];
  const mat = new THREE.MeshStandardMaterial({vertexColors: true, roughness: 0.9});
  const counts = new Array(SPECIES.length).fill(0); for (let k = 0; k < n; k++) counts[T[k * 6 + 2]]++;
  SPECIES.forEach(([name, f], s) => { const m = new THREE.InstancedMesh(f(), mat, Math.max(1, counts[s])); m.castShadow = s !== 6 && s !== 7; m.receiveShadow = true; meshes.push(m); group.add(m); });
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), Sc = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0), col = new THREE.Color();
  const S = sampler(C);
  group.userData.setEra = era => {
    const c = new Array(SPECIES.length).fill(0);
    for (let k = 0; k < n; k++) { const o = k * 6, sp = T[o + 2], born = T[o + 4], dies = T[o + 5]; if (born > era || dies <= era) continue;
      const x = T[o], y = T[o + 1], sc = T[o + 3] * (0.8 + 0.4 * hash(k, 1)); Q.setFromAxisAngle(Y, hash(k, 2) * 6.28);
      M4.compose(V.set(x, Math.max(S.ground(x, y), 0) - 0.2, y), Q, Sc.set(sc, sc * (0.85 + 0.3 * hash(k, 4)), sc));
      const m = meshes[sp]; m.setMatrixAt(c[sp], M4); col.setHSL(0, 0, 0.82 + 0.3 * hash(k, 6)); m.setColorAt(c[sp], col); c[sp]++; }
    meshes.forEach((m, s) => { m.count = c[s]; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; m.computeBoundingSphere(); });
  };
  return group;
}

// ——— the street: lamps, bus stops, café tables, docks and cranes, tanks, plazas with fountains, highway signs ———
function eraInstanced(geo, mat, items, shadow = true) {
  const m = new THREE.InstancedMesh(geo, mat, Math.max(1, items.length)); m.castShadow = shadow; m.receiveShadow = true;
  m.userData.setEra = era => { let c = 0; for (const it of items) if (it.born <= era && (it.dies ?? 9) > era) m.setMatrixAt(c++, it.m); m.count = c; m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere(); };
  m.userData.items = items; return m;
}
const place = (x, y, z, ry = 0, s = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry), new THREE.Vector3(s, s, s));
export function makeStreetLife(C, S, U) {
  const group = new THREE.Group(), vmat = new THREE.MeshStandardMaterial({vertexColors: true, roughness: 0.7}), glow = [], R = (k, s) => hash(k * 1.37, s);
  const lamps = [], stops = [], cafes = [], docks = [], cranes = [], boxes = [], tanks = [], bollards = [];
  // walk every road once: lamps along spines, arterials and the avenue; bus stops every ~380 m on arterials
  C.roads.forEach(([cls, born, f], ri) => {
    if (cls === 0 || cls === 2) return; const W = RCLS[cls].w / 2 - 0.6; let acc = 0, stopAcc = 120 + R(ri, 1) * 200;
    for (let i = 0; i < f.length - 2; i += 2) { const ax = f[i], ay = f[i + 1], bx2 = f[i + 2], by = f[i + 3], L = Math.hypot(bx2 - ax, by - ay); if (!L) continue;
      const tx = (bx2 - ax) / L, ty = (by - ay) / L;
      for (let s = (32 - acc % 32) % 32; s < L; s += 32) { const x = ax + tx * s, y = ay + ty * s, side = ((acc + s) / 32 | 0) % 2 ? 1 : -1, px = x - ty * side * W, py = y + tx * side * W, g = Math.max(S.ground(px, py), 0.4);
        if (g < 0.5 && S.ground(px, py) < 0) continue; lamps.push({m: place(px, g, py, -Math.atan2(ty, tx)), born: Math.max(born, 1)}); glow.push(px, g + 6.2, py, Math.max(born, 1)); }
      if (cls === 1) { stopAcc -= L; if (stopAcc < 0) { stopAcc = 380; const x = (ax + bx2) / 2 + ty * (W + 1.2), y = (ay + by) / 2 - tx * (W + 1.2), g = S.ground(x, y); if (g > 0.5) stops.push({m: place(x, g, y, -Math.atan2(ty, tx)), born: 3, x, y}); } }
      acc += L; }
  });
  // cafés: tables and an awning at the street face of some old and row buildings, and around the plazas
  const B = C.bld, nb = B.length / 14;
  for (let k = 0; k < nb; k++) { const o = k * 14, st = B[o + 6]; if (st > 1 || hash(k, 11) > 0.07) continue;
    const x = B[o], y = B[o + 1], d = B[o + 3], rot = B[o + 4], fx = x + Math.sin(rot) * (d / 2 + 2.6), fy = y - Math.cos(rot) * (d / 2 + 2.6);
    cafes.push({m: place(fx, Math.max(S.ground(fx, fy), 0.3), fy, -rot), born: Math.max(B[o + 7], 1), dies: B[o + 8] === 4 ? 4 : 9}); }
  for (const p of C.meta.plazas) for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + 0.3, x = p.x + Math.cos(a) * (p.r - 6), y = p.y + Math.sin(a) * (p.r - 6); cafes.push({m: place(x, Math.max(S.ground(x, y), 0.3), y, -a + Math.PI / 2), born: p.born + 1}); }
  // docks: wherever port land meets water — a wharf edge with bollards; cranes and stacked containers from the New Boroughs; tanks in the industrial land
  const {nx, ny, cell} = C.meta, cv = C.cover, ht = C.height;
  for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) { const k = j * nx + i, c = cv[k];
    if (c === 13 && ht[k] >= 0) { const nbs = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([a, b]) => ht[k + a + b * nx] < 0);
      if (nbs.length) { const [a, b] = nbs[0], ry = -Math.atan2(b, a), x = i * cell + a * 8, y = j * cell + b * 8;
        docks.push({m: place(x, 0, y, ry), born: 1}); if (hash(k, 3) < 0.6) bollards.push({m: place(x + a * 6, 2.6, y + b * 6, ry), born: 1});
        if (hash(k, 4) < 0.12) cranes.push({m: place(i * cell - a * 6, Math.max(ht[k], 0.5), j * cell - b * 6, ry), born: 3}); }
      else if (hash(k, 5) < 0.35) boxes.push({m: place(i * cell + (hash(k, 6) - 0.5) * 10, Math.max(ht[k], 0.5), j * cell + (hash(k, 7) - 0.5) * 10, Math.round(hash(k, 8)) * Math.PI / 2), born: 3, c: k}); }
    if (c === 14 && ht[k] > 0 && hash(k, 9) < 0.07) tanks.push({m: place(i * cell, ht[k], j * cell, 0, 0.8 + hash(k, 10) * 0.6), born: 3}); }
  const lampGeo = kit([[cy(0.1, 0.14, 6.2, 6), 0x23262a], [bx(1.6, 0.12, 0.12), 0x23262a, 0.7, 6.1], [bx(0.5, 0.25, 0.35), 0xffe0a0, 1.4, 5.9]]);
  const stopGeo = kit([[bx(4.2, 0.12, 1.8), 0x2a3036, 0, 2.6], [bx(4, 2.4, 0.06), 0x9fb8c8, 0, 0.2, -0.8], [cy(0.05, 0.05, 2.6, 5), 0x2a3036, -1.9, 0, -0.8], [cy(0.05, 0.05, 2.6, 5), 0x2a3036, 1.9, 0, -0.8],
    [bx(3, 0.45, 0.5), 0x6a4a30, 0, 0.45, -0.5], [cy(0.04, 0.04, 2.9, 4), 0x2a3036, 2.6, 0, 0.6], [bx(0.6, 0.6, 0.06), 0x1a6ab0, 2.6, 2.6, 0.6], [bx(1.2, 1.8, 0.1), 0xe8e0c0, -1.2, 0.5, -0.74]]);
  // local +z is toward the building: the awning hangs off the wall, the tables sit out toward the street
  const cafeGeo = kit([[bx(6, 0.12, 2.6), 0xb8322a, 0, 3.0, 1.3], [bx(6, 0.5, 0.06), 0xf1ece0, 0, 2.55, 0.0], ...[-2, 0, 2].flatMap(x => [[cy(0.4, 0.4, 0.05, 10), 0xf0ece0, x, 0.74, -0.4], [cy(0.04, 0.04, 0.74, 4), 0x222222, x, 0, -0.4],
    [bx(0.4, 0.45, 0.4), 0x3a2a20, x - 0.6, 0, -0.4], [bx(0.4, 0.45, 0.4), 0x3a2a20, x + 0.6, 0, -0.4]])]);
  const dockGeo = kit([[bx(20, 0.8, 20), 0x6e6a62, 0, 1.9], ...[-9, -3, 3, 9].map(x => [cy(0.4, 0.4, 6, 6), 0x2a2420, x, -3.5, 9])]);
  const bollardGeo = kit([[cy(0.25, 0.3, 0.7, 8), 0x1a1a1a], [cy(0.36, 0.36, 0.12, 8), 0x1a1a1a, 0, 0.7]]);
  const craneGeo = kit([[bx(1.2, 34, 1.2), 0xd8a020, -6, 0, -5], [bx(1.2, 34, 1.2), 0xd8a020, 6, 0, -5], [bx(1.2, 34, 1.2), 0xd8a020, -6, 0, 5], [bx(1.2, 34, 1.2), 0xd8a020, 6, 0, 5],
    [bx(14, 2, 1.2), 0xd8a020, 0, 32, -5], [bx(14, 2, 1.2), 0xd8a020, 0, 32, 5], [bx(1.6, 2, 52), 0xd8a020, 0, 36, 14], [bx(3, 3, 4), 0x2a3036, 0, 33, 26]]);
  const boxGeo = kit([[bx(12, 2.6, 2.5), 0x8a3426, 0, 0, -1.3], [bx(12, 2.6, 2.5), 0x2a5a8a, 0, 0, 1.3], [bx(12, 2.6, 2.5), 0x3a7a4a, 0, 2.6, -1.3], [bx(6, 2.6, 2.5), 0xb8a040, -3, 2.6, 1.3]]);
  const tankGeo = kit([[cy(9, 9, 12, 20), 0xd0ccc4], [co(9.2, 2, 20), 0xb8b4ac, 0, 12], [bx(0.4, 12, 0.6), 0x404040, 9, 0, 0]]);
  for (const [geo, items, sh] of [[lampGeo, lamps, false], [stopGeo, stops, true], [cafeGeo, cafes, true], [dockGeo, docks, true], [bollardGeo, bollards, false], [craneGeo, cranes, true], [boxGeo, boxes, true], [tankGeo, tanks, true]])
    group.add(eraInstanced(geo, vmat, items, sh));
  // the lamp glow at night: additive points
  const gg = new THREE.BufferGeometry(), gp = [], gb = []; for (let i = 0; i < glow.length; i += 4) { gp.push(glow[i], glow[i + 1], glow[i + 2]); gb.push(glow[i + 3]); }
  gg.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3)); gg.setAttribute('born', new THREE.Float32BufferAttribute(gb, 1));
  const gm = new THREE.ShaderMaterial({uniforms: {uNight: U.night, uEra: U.era}, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'attribute float born; uniform float uEra, uNight; varying float vA; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv; vA = step(born, uEra + .5) * uNight; gl_PointSize = clamp(2600. / -mv.z, 1.5, 26.); }',
    fragmentShader: 'varying float vA; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(1., .78, .45, smoothstep(.5, 0., d) * vA * .9); }'});
  const pts = new THREE.Points(gg, gm); pts.frustumCulled = false; group.add(pts);
  // plazas: paved discs with a fountain at the centre
  const pz = new THREE.Group(); group.add(pz);
  for (const p of C.meta.plazas) { const g = Math.max(S.ground(p.x, p.y), 0.3);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(p.r, p.r + 2, 1.6, 40), new THREE.MeshStandardMaterial({color: 0xa79b88, roughness: 0.9})); disc.position.set(p.x, g - 0.5, p.y); disc.receiveShadow = true; disc.userData.born = p.born; pz.add(disc);
    if (p.r >= 40) { const f = new THREE.Group(); f.add(new THREE.Mesh(new THREE.CylinderGeometry(6, 6.4, 0.9, 24), new THREE.MeshStandardMaterial({color: 0xc8bea8})));
      const w = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 5.5, 0.2, 24), new THREE.MeshStandardMaterial({color: 0x3a6a78, roughness: 0.1, metalness: 0.3})); w.position.y = 0.5; f.add(w);
      const jet = new THREE.Mesh(new THREE.ConeGeometry(0.9, 5, 10, 1, true), new THREE.MeshStandardMaterial({color: 0xdfefff, transparent: true, opacity: 0.55})); jet.position.y = 3; f.add(jet);
      f.position.set(p.x + p.r * 0.35, g + 0.4, p.y + p.r * 0.2); f.userData.born = p.born + 1; pz.add(f); } }
  // highway signs: green gantries naming where the road goes (the lore made legible)
  const named = C.meta.landmarks.filter(l => ['cathedral', 'pier', 'stadium', 'palace', 'Pyramid of the Sun', 'lighthouse', 'Monumento a la Revolución', 'Bromo Seltzer Tower', 'radio mast'].includes(l.type) || ['cathedral', 'pier', 'stadium', 'palace', 'lighthouse'].includes(l.name));
  const signs = new THREE.Group(); group.add(signs); let made = 0;
  C.roads.forEach(([cls, born, f], ri) => { if (cls !== 2 || f.length < 20 || made > 16 || hash(ri, 2) > 0.5) return; const i = (f.length / 4 | 0) * 2, x = f[i], y = f[i + 1], tx = f[i + 2] - x, ty = f[i + 3] - y, L = Math.hypot(tx, ty) || 1;
    const ahead = named.map(l => ({l, d: Math.hypot(l.x - x, l.y - y), dot: ((l.x - x) * tx + (l.y - y) * ty) / L / Math.hypot(l.x - x, l.y - y)})).filter(o => o.dot > 0.5).sort((a, b) => a.d - b.d)[0];
    if (!ahead) return; made++; const g = Math.max(S.ground(x, y), 0.4), sg = new THREE.Group();
    const c = document.createElement('canvas'); c.width = 512; c.height = 160; const q = c.getContext('2d'); q.fillStyle = '#0d5a2e'; q.fillRect(0, 0, 512, 160); q.strokeStyle = '#fff'; q.lineWidth = 6; q.strokeRect(8, 8, 496, 144);
    q.fillStyle = '#fff'; q.font = 'bold 44px Helvetica, Arial'; q.textAlign = 'center'; const nm = ahead.l.name.split(',')[0].replace('the ', '').toUpperCase(); q.fillText(nm.length > 18 ? nm.slice(0, 18) : nm, 256, 78);
    q.font = '32px Helvetica'; q.fillText(`${(ahead.d / 1609).toFixed(1)} MI  ↑`, 256, 126);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(10, 3.1), new THREE.MeshStandardMaterial({map: t, side: THREE.DoubleSide, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: 0.15})); pl.position.y = 8; sg.add(pl);
    for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 9.6, 6), new THREE.MeshStandardMaterial({color: 0x777777, metalness: 0.6})); p.position.set(s * 13, 4.8, 0); sg.add(p); }
    const bar = new THREE.Mesh(new THREE.BoxGeometry(26, 0.5, 0.5), new THREE.MeshStandardMaterial({color: 0x777777, metalness: 0.6})); bar.position.y = 9.4; sg.add(bar);
    sg.position.set(x, g, y); sg.rotation.y = -Math.atan2(ty, tx) + Math.PI / 2; sg.userData.born = Math.max(born, 3); signs.add(sg); });
  group.userData.setEra = era => { group.children.forEach(o => o.userData.setEra?.(era)); [...pz.children, ...signs.children].forEach(o => o.visible = o.userData.born <= era); };
  group.userData.stops = stops;
  return group;
}
