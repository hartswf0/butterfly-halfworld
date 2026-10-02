// THE LEGIBLE STREET — what lets you read where you are: names on the corners and over the lanes, the ward you are entering and
// its precinct, the zoning, the bus that stops here, the route shields, the alley's name, the café's menu, the iron marker that
// tells a landmark's life. Every sign is a quad cut from a shared atlas; the poles are instanced; each carries its index so the
// ID buffer can say which sign you touched. All of it read from plan.json (built by tools/build-graph.mjs).
import * as THREE from 'three';

const PAGE = 2048;
const W2 = [5, 9, 12, 7.5, 21];

function fitText(x, text, maxW, size, weight = 'bold', family = '"Helvetica Neue", Helvetica, Arial, sans-serif') {
  let s = size; do { x.font = `${weight} ${s}px ${family}`; if (x.measureText(text).width <= maxW) break; s -= 1; } while (s > 8); return s;
}
function rr(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
function wrap(x, text, maxW) { const words = text.split(' '), lines = []; let cur = ''; for (const w of words) { const t = cur ? cur + ' ' + w : w; if (x.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; } if (cur) lines.push(cur); return lines; }

// how each kind of sign is painted: [cell w, cell h, draw(ctx, w, h, sign)]
const PAINT = {
  name: [256, 40, (x, w, h, t) => { x.fillStyle = '#0d6a3b'; rr(x, 1, 1, w - 2, h - 2, 5); x.fill(); x.strokeStyle = '#f2f2f2'; x.lineWidth = 2; rr(x, 3, 3, w - 6, h - 6, 4); x.stroke();
    x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; fitText(x, t, w - 16, 26); x.fillText(t, w / 2, h / 2 + 1); }],
  ward: [192, 128, (x, w, h, s) => { x.fillStyle = '#183f8c'; rr(x, 1, 1, w - 2, h - 2, 8); x.fill(); x.strokeStyle = '#fff'; x.lineWidth = 3; rr(x, 5, 5, w - 10, h - 10, 6); x.stroke();
    x.fillStyle = '#fff'; x.textAlign = 'center'; x.font = 'bold 15px Helvetica, Arial'; x.fillText('ENTERING', w / 2, 26); x.font = 'bold 40px Helvetica, Arial'; x.fillText(`WARD ${s.ward}`, w / 2, 66);
    x.font = 'bold 15px Helvetica, Arial'; x.fillText(`PRECINCT ${s.ward}-${s.precinct}`, w / 2, 90); fitText(x, s.t, w - 22, 14, 'italic'); x.fillText(s.t, w / 2, 112); }],
  zone: [192, 96, (x, w, h, s) => { x.fillStyle = '#f4f1e8'; x.fillRect(0, 0, w, h); x.strokeStyle = '#111'; x.lineWidth = 4; x.strokeRect(4, 4, w - 8, h - 8);
    x.fillStyle = '#111'; x.textAlign = 'center'; x.font = 'bold 14px Helvetica, Arial'; x.fillText('ZONING DISTRICT', w / 2, 24); x.font = 'bold 36px Helvetica, Arial'; x.fillText(s.z, w / 2, 60);
    fitText(x, s.t, w - 20, 14, 'normal'); x.fillText(s.t, w / 2, 82); }],
  bus: [128, 192, (x, w, h, s) => { x.fillStyle = '#f4f4f4'; x.fillRect(0, 0, w, h); x.fillStyle = '#c8102e'; x.fillRect(0, 0, w, 40); x.fillStyle = '#fff'; x.textAlign = 'center'; x.font = 'bold 26px Helvetica, Arial'; x.fillText('BUS', w / 2, 30);
    x.fillStyle = '#111'; x.font = 'bold 64px Helvetica, Arial'; x.fillText(String(s.route), w / 2, 108); x.font = 'bold 12px Helvetica, Arial'; x.fillText('STOP', w / 2, 128);
    x.font = '11px Helvetica, Arial'; wrap(x, s.t, w - 12).slice(0, 4).forEach((l, i) => x.fillText(l, w / 2, 148 + i * 13)); x.strokeStyle = '#111'; x.lineWidth = 2; x.strokeRect(1, 1, w - 2, h - 2); }],
  shield: [128, 160, (x, w, h, s) => { x.clearRect(0, 0, w, h); x.fillStyle = '#fff'; x.textAlign = 'center'; if (s.t) { x.fillStyle = '#0d5a2e'; rr(x, 4, 2, w - 8, 30, 4); x.fill(); x.fillStyle = '#fff'; fitText(x, s.t, w - 16, 16); x.fillText(s.t, w / 2, 23); }
    const top = 38; x.beginPath(); x.moveTo(10, top); x.lineTo(w - 10, top); x.lineTo(w - 10, top + 62); x.quadraticCurveTo(w - 12, h - 18, w / 2, h - 4); x.quadraticCurveTo(12, h - 18, 10, top + 62); x.closePath();
    x.fillStyle = '#fff'; x.fill(); x.save(); x.clip(); x.fillStyle = '#b5121b'; x.fillRect(0, top, w, 30); x.fillStyle = '#123f8f'; x.fillRect(0, top + 30, w, h); x.restore();
    x.fillStyle = '#fff'; x.font = 'bold 13px Helvetica, Arial'; x.fillText('ATLANTIS', w / 2, top + 21); x.font = 'bold 50px Helvetica, Arial'; x.fillText(String(s.route), w / 2, top + 84); }],
  cafe: [128, 192, (x, w, h, s) => { x.fillStyle = '#5a3a24'; x.fillRect(0, 0, w, h); x.fillStyle = '#1d2321'; x.fillRect(6, 6, w - 12, h - 12);
    x.fillStyle = '#f3efe2'; x.textAlign = 'center'; fitText(x, s.name, w - 18, 17, 'italic bold', 'Georgia, serif'); x.fillText(s.name, w / 2, 28); x.fillStyle = '#e8c86a'; x.font = 'italic 12px Georgia, serif'; x.fillText('— today —', w / 2, 46);
    x.textAlign = 'left'; s.menu.slice(0, 5).forEach(([it, pr], i) => { x.fillStyle = '#f3efe2'; fitText(x, it, w - 40, 12, 'normal', 'Georgia, serif'); x.fillText(it, 12, 68 + i * 24); x.fillStyle = '#e8c86a'; x.font = 'bold 12px Georgia, serif'; x.textAlign = 'right'; x.fillText('$' + pr, w - 11, 68 + i * 24); x.textAlign = 'left'; });
    x.strokeStyle = '#e8c86a'; x.lineWidth = 1; x.beginPath(); x.moveTo(20, h - 22); x.lineTo(w - 20, h - 22); x.stroke(); }],
  fascia: [256, 40, (x, w, h, t) => { x.fillStyle = '#7e1f18'; x.fillRect(0, 0, w, h); x.fillStyle = '#f6eedb'; x.textAlign = 'center'; x.textBaseline = 'middle'; fitText(x, t, w - 16, 24, 'italic bold', 'Georgia, serif'); x.fillText(t, w / 2, h / 2 + 1); }],
  alley: [192, 36, (x, w, h, t) => { x.fillStyle = '#5b3b22'; rr(x, 1, 1, w - 2, h - 2, 4); x.fill(); x.fillStyle = '#f2e6cc'; x.textAlign = 'center'; x.textBaseline = 'middle'; fitText(x, t, w - 14, 20); x.fillText(t, w / 2, h / 2 + 1); }],
  marker: [256, 192, (x, w, h, s) => { x.fillStyle = '#16251c'; rr(x, 2, 2, w - 4, h - 4, 14); x.fill(); x.strokeStyle = '#c8a24a'; x.lineWidth = 4; rr(x, 8, 8, w - 16, h - 16, 10); x.stroke();
    x.fillStyle = '#c8a24a'; x.textAlign = 'center'; x.font = 'bold 12px Georgia, serif'; x.fillText('ATLANTIS · HISTORIC MARKER', w / 2, 32);
    fitText(x, s.t, w - 30, 24, 'bold', 'Georgia, serif'); x.fillText(s.t, w / 2, 62); x.font = '12px Georgia, serif'; wrap(x, s.sub, w - 34).slice(0, 6).forEach((l, i) => x.fillText(l, w / 2, 88 + i * 16)); }],
  back: [32, 32, x => { x.fillStyle = '#8f9396'; x.fillRect(0, 0, 32, 32); }],
  white: [32, 32, x => { x.fillStyle = '#f2f2ee'; x.fillRect(0, 0, 32, 32); }],
};

export function makeLegible(plan, C, S, U) {
  const group = new THREE.Group(); group.name = 'legible';
  const pages = [], cells = new Map();
  function newPage() { const c = document.createElement('canvas'); c.width = c.height = PAGE; const p = {c, x: c.getContext('2d'), sx: 0, sy: 0, rowH: 0, P: [], N: [], UV: [], ID: [], AB: []}; pages.push(p); return p; }
  function cell(kind, key, arg) {
    const k = kind + '|' + key; if (cells.has(k)) return cells.get(k);
    const [w, h, draw] = PAINT[kind]; let p = pages[pages.length - 1] || newPage();
    if (p.sx + w > PAGE) { p.sx = 0; p.sy += p.rowH + 2; p.rowH = 0; }
    if (p.sy + h > PAGE) { p = newPage(); }
    const x0 = p.sx, y0 = p.sy; p.x.save(); p.x.translate(x0, y0); p.x.beginPath(); p.x.rect(0, 0, w, h); p.x.clip(); draw(p.x, w, h, arg); p.x.restore();
    p.sx += w + 2; p.rowH = Math.max(p.rowH, h);
    const r = {p, u0: (x0 + 0.5) / PAGE, u1: (x0 + w - 0.5) / PAGE, v0: 1 - (y0 + h - 0.5) / PAGE, v1: 1 - (y0 + 0.5) / PAGE}; cells.set(k, r); return r;
  }
  // a quad centred at c (world), spanning right r (unit), up (0,1,0); faces −(r × up) toward the viewer; id = sign index
  function quad(cl, cx, cy, cz, rx, rz, w, h, id, born = 0, dies = 9, tilt = 0) {
    // r = (rx, rz) is the reader's right; the face looks along f = (−rz, rx) toward the reader; tilt leans the top away
    const p = cl.p, hw = w / 2, hh = h / 2, fx = -rz, fz = rx, ux = -fx * Math.sin(tilt), uy = Math.cos(tilt), uz = -fz * Math.sin(tilt);
    const V = [[-hw, -hh, cl.u0, cl.v0], [hw, -hh, cl.u1, cl.v0], [hw, hh, cl.u1, cl.v1], [-hw, hh, cl.u0, cl.v1]];
    const base = p.P.length / 3;
    for (const [a, b, u, v] of V) { p.P.push(cx + rx * a + ux * b, cy + uy * b, cz + rz * a + uz * b); p.N.push(fx, 0, fz); p.UV.push(u, v); p.ID.push(id); p.AB.push(born, dies); }
    p.idx = p.idx || []; p.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  const posts = [], arms = [];
  const gy = (x, y) => Math.max(S.ground(x, y), 0.35) + 0.2;
  const signs = plan.signs.map(s => ({...s}));
  const wayBorn = w => Math.max(plan.ways[w]?.born ?? 1, 1);
  // overhead names on mast arms, over the lanes, before each corner the disc drives into
  const nodes = plan.nodes, E = plan.edges;
  const nodeEdges = new Map(); E.forEach((e, i) => { for (const n of [e.a, e.b]) (nodeEdges.get(n) || nodeEdges.set(n, []).get(n)).push(i); });
  const rank = c => [1, 3, 0, 4, 5][c];
  E.forEach((e, ei) => { if (!e.disc || e.len < 30) return;
    for (const end of ['a', 'b']) { const n = e[end], list = nodeEdges.get(n) || []; if (list.length < 3) continue;
      const ws = [...new Set(list.map(i => E[i].w))].filter(w => w !== e.w).sort((a, b) => rank(plan.ways[b].cls) - rank(plan.ways[a].cls) || plan.ways[b].len - plan.ways[a].len);
      if (!ws.length || plan.ways[ws[0]].cls === 2) continue;
      const P = e.pts, pts = []; for (let i = 0; i < P.length; i += 2) pts.push([P[i], P[i + 1]]); if (end === 'b') pts.reverse();
      let d = 0, i = 1; while (i < pts.length - 1 && d + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]) < 10) { d += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); i++; }
      const L = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]) || 1, t = Math.min(1, (10 - d) / L);
      const x = pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, y = pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t;
      const fx = (pts[i][0] - pts[i - 1][0]) / L, fy = (pts[i][1] - pts[i - 1][1]) / L;   // from the corner outward: the sign faces the car coming in
      signs.push({k: 'over', x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, a: Math.atan2(fy, fx), t: plan.ways[ws[0]].name, cls: e.cls, w: ws[0], e: ei, born: Math.max(wayBorn(ws[0]), wayBorn(e.w), 1)}); } });

  signs.forEach((s, id) => {
    const g = gy(s.x, s.y), ca = Math.cos(s.a ?? 0), sa = Math.sin(s.a ?? 0), back = cell('back', 'b');
    // facing direction f = (cos a, sin a): right vector for a viewer looking along −f is (f.y, −f.x) in plan (x, z)
    const face = (cl, w, h, yy, dx = 0, dz = 0, both = false, cl2 = null, born = 0, dies = 9) => {
      quad(cl, s.x + dx, g + yy, s.y + dz, sa, -ca, w, h, id, born, dies);
      quad(both ? (cl2 || cl) : back, s.x + dx - ca * 0.03, g + yy, s.y + dz - sa * 0.03, -sa, ca, w, h, id, born, dies); };
    if (s.k === 'blade') { const H = 4.6; posts.push([s.x, g, s.y, H + 0.2, 0.05, 1]);
      s.t.forEach((nm, j) => { const cl = cell('name', nm, nm), aa = s.a[j], rx = Math.cos(aa), rz = Math.sin(aa), yy = H - j * 0.78, b = 1;
        quad(cl, s.x, g + yy, s.y, rx, rz, 4.6, 0.72, id, b); quad(cl, s.x, g + yy, s.y, -rx, -rz, 4.6, 0.72, id, b); }); }
    else if (s.k === 'over') { const W = W2[s.cls] ?? 7, rx = sa, rz = -ca;          // the car's right is the sign's left
      const px = s.x + sa * (W + 0.8), pz = s.y - ca * (W + 0.8); posts.push([px, gy(px, pz), pz, 7.4, 0.18, s.born]);
      arms.push([s.x + sa * (W + 0.8) / 2, g + 7.1, s.y - ca * (W + 0.8) / 2, W + 0.8, Math.atan2(ca, sa), s.born]);
      const cl = cell('name', s.t, s.t); quad(cl, s.x, g + 6.3, s.y, rx, rz, 7.6, 1.2, id, s.born); quad(back, s.x - ca * 0.04, g + 6.3, s.y - sa * 0.04, -rx, -rz, 7.6, 1.2, id, s.born); }
    else if (s.k === 'ward') { posts.push([s.x, g, s.y, 4.2, 0.07, 1]); face(cell('ward', `${s.ward}-${s.precinct}-${s.t}`, s), 2.7, 1.8, 3.2, 0, 0, false, null, 1);
      if (s.line) { const [lx, ly, lh] = s.line, wd = W2[plan.edges[s.e].cls] * 2 - 1, wc = cell('white', 'w'), gl = Math.max(S.ground(lx, ly), 0.35) + 0.25;
        // a painted line across the road where the vote changes
        const p = wc.p, base = p.P.length / 3, rx = -Math.sin(lh), rz = Math.cos(lh), fx = Math.cos(lh) * 0.18, fz = Math.sin(lh) * 0.18;
        for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { p.P.push(lx + rx * a * wd / 2 + fx * b, gl, ly + rz * a * wd / 2 + fz * b); p.N.push(0, 1, 0); p.UV.push(wc.u0 + 0.001, wc.v0 + 0.001); p.ID.push(id); p.AB.push(1, 9); }
        p.idx = p.idx || []; p.idx.push(base, base + 1, base + 2, base, base + 2, base + 3, base, base + 2, base + 1, base, base + 3, base + 2); } }
    else if (s.k === 'zone') { posts.push([s.x, g, s.y, 3.2, 0.06, 3]); face(cell('zone', s.z + s.t, s), 2.2, 1.1, 2.6, 0, 0, false, null, 3); }
    else if (s.k === 'bus') { posts.push([s.x, g, s.y, 4.3, 0.07, 3]); const cl = cell('bus', `${s.route}|${s.t}`, s);
      quad(cl, s.x, g + 3.2, s.y, sa, -ca, 1.2, 1.8, id, 3); quad(cl, s.x, g + 3.2, s.y, -sa, ca, 1.2, 1.8, id, 3); }
    else if (s.k === 'shield') { const big = !!s.big, H = big ? 7.5 : 4.0, w = big ? 4.2 : 2.0, h = w * 1.25; posts.push([s.x, g, s.y, H, big ? 0.14 : 0.05, 3]);
      face(cell('shield', `${s.route}|${s.t}`, s), w, h, H - h / 2 + 0.1, 0, 0, false, null, 3); }
    else if (s.k === 'cafe') { const c = plan.cafes[s.cafe], th = s.a, cs = Math.cos(th), sn = Math.sin(th);
      // local café frame (city3d): +z toward the building; world = (x + lx·cos + lz·sin, z − lx·sin + lz·cos)
      const L = (lx, lz) => [s.x + lx * cs + lz * sn, s.y - lx * sn + lz * cs];
      const [bx, bz] = L(3.9, -1.9), gb = gy(bx, bz) - 0.2, menu = cell('cafe', String(c.id), c);
      // the A-frame board: two boards leaning together, the menu on both
      quad(menu, bx - sn * 0.28, gb + 0.8, bz - cs * 0.28, -cs, sn, 1.05, 1.6, id, c.born, c.dies, 0.2);
      quad(menu, bx + sn * 0.28, gb + 0.8, bz + cs * 0.28, cs, -sn, 1.05, 1.6, id, c.born, c.dies, 0.2);
      const [fx, fz] = L(0, -0.06); quad(cell('fascia', c.name, c.name), fx, gy(fx, fz) - 0.2 + 2.55, fz, -cs, sn, 5.8, 0.48, id, c.born, c.dies); }
    else if (s.k === 'alley') { const aa = s.a - Math.PI / 2, rx = Math.cos(aa), rz = Math.sin(aa); posts.push([s.x, g, s.y, 3.6, 0.05, 1]); const cl = cell('alley', s.t, s.t);
      quad(cl, s.x, g + 3.3, s.y, rx, rz, 3.0, 0.56, id, 1); quad(cl, s.x, g + 3.3, s.y, -rx, -rz, 3.0, 0.56, id, 1); }
    else if (s.k === 'marker') { const fa = s.a + Math.PI, fc = Math.cos(fa), fs = Math.sin(fa); posts.push([s.x, g, s.y, 1.9, 0.09, 5]); const cl = cell('marker', s.t, s);
      quad(cl, s.x, g + 2.4, s.y, fs, -fc, 2.4, 1.8, id, 5); quad(back, s.x - fc * 0.03, g + 2.4, s.y - fs * 0.03, -fs, fc, 2.4, 1.8, id, 5); }
    else if (s.k === 'pier') { posts.push([s.x, g, s.y, 2.4, 0.08, 1]); face(cell('name', s.t, s.t), 2.2, 0.36, 2.2, 0, 0, true, null, 1); }
  });

  // one mesh per atlas page; era-gated in the shader (a sign is born with its street and dies with its café)
  const meshes = pages.map(p => {
    const t = new THREE.CanvasTexture(p.c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(p.P, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(p.N, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(p.UV, 2)); geo.setAttribute('aId', new THREE.Float32BufferAttribute(p.ID, 1)); geo.setAttribute('aBD', new THREE.Float32BufferAttribute(p.AB, 2)); geo.setIndex(p.idx || []);
    const m = new THREE.MeshStandardMaterial({map: t, alphaTest: 0.5, roughness: 0.6, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.06});
    m.onBeforeCompile = sh => { sh.uniforms.uEra = U.era;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 aBD; uniform float uEra; varying float vGone;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvGone = step(uEra + 0.5, aBD.x) + step(aBD.y, uEra + 0.01);');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vGone;').replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\nif (vGone > 0.5) discard;'); };
    const mesh = new THREE.Mesh(geo, m); mesh.userData.legible = true; mesh.receiveShadow = true; mesh.castShadow = false; group.add(mesh); return mesh; });
  // poles and mast arms
  const pm = new THREE.MeshStandardMaterial({color: 0x5f6468, roughness: 0.45, metalness: 0.6});
  const pg = new THREE.CylinderGeometry(1, 1, 1, 6); pg.translate(0, 0.5, 0);
  const poles = new THREE.InstancedMesh(pg, pm, Math.max(1, posts.length)); poles.castShadow = true; poles.receiveShadow = true; group.add(poles);
  const ag = new THREE.BoxGeometry(1, 0.14, 0.14); const armM = new THREE.InstancedMesh(ag, pm, Math.max(1, arms.length)); armM.castShadow = true; group.add(armM);
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0), V = new THREE.Vector3(), Sc = new THREE.Vector3();
  function setEra(e) {
    let c = 0; for (const [x, y, z, h, r, born] of posts) { if (born > e) continue; poles.setMatrixAt(c++, M4.compose(V.set(x, y - 0.2, z), Q.identity(), Sc.set(r, h + 0.2, r))); }
    poles.count = c; poles.instanceMatrix.needsUpdate = true; poles.computeBoundingSphere();
    c = 0; for (const [x, y, z, len, ang, born] of arms) { if (born > e) continue; Q.setFromAxisAngle(Y, ang); armM.setMatrixAt(c++, M4.compose(V.set(x, y, z), Q, Sc.set(len, 1, 1))); }
    armM.count = c; armM.instanceMatrix.needsUpdate = true; armM.computeBoundingSphere();
  }
  function setNight(n) { for (const m of meshes) m.material.emissiveIntensity = 0.06 + 0.5 * n; }
  return {group, signs, setEra, setNight, pages: pages.length, meshes};
}
