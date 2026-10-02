// THE MAP — the street plan the frames are registered to, drawn three ways: the plan (land use, footprints, every street and the
// disc), the aerial (the city photographed from straight above by the same engine) and the cartoon (Lynch's notation: paths,
// edges, districts, nodes, landmarks). One view serves the small heading-up map above the horizon and the full map with its
// Powers-of-Ten zoom.
const COVER_COL = ['#2a3a3a', '#d8c9a0', '#6f7a48', '#a8a060', '#3c5a2c', '#8a7f6c', '#8c7a66', '#7c6e62', '#9a948a', '#9a8c70', '#7d9a4a', '#2e2a26', '#8a9a62', '#7a7a76', '#5e5a54'];
const ROAD_W = [10, 18, 24, 15, 42];
export const STYLE_N = ['old-center house', 'rowhouse', 'civic building', 'tower', 'suburban house', 'port shed', 'industrial shed', 'relic'];

export function makeGround(meta, height, cover) {
  // the land-use raster (one pixel a 20 m cell), its cartoon twin, and the shoreline by marching squares at sea level
  const {nx, ny, cell} = meta, mk = () => { const c = document.createElement('canvas'); c.width = nx; c.height = ny; return c; };
  const plan = mk(), toon = mk(), px = plan.getContext('2d').createImageData(nx, ny), tx = toon.getContext('2d').createImageData(nx, ny);
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const CC = COVER_COL.map(hex);
  for (let k = 0; k < nx * ny; k++) { const h = height[k], c = h < 0 ? [34, 52, 58] : CC[cover[k]] || CC[3]; px.data.set([c[0], c[1], c[2], 255], k * 4);
    const t = h < 0 ? [176, 200, 214] : [cover[k] === 4 || cover[k] === 10 ? 226 : 239, cover[k] === 4 || cover[k] === 10 ? 232 : 233, cover[k] === 4 || cover[k] === 10 ? 214 : 220]; tx.data.set([...t, 255], k * 4); }
  plan.getContext('2d').putImageData(px, 0, 0); toon.getContext('2d').putImageData(tx, 0, 0);
  const coast = [];
  const H = (i, j) => height[j * nx + i], lerp = (a, b) => a / (a - b);
  for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const a = H(i, j), b = H(i + 1, j), c = H(i + 1, j + 1), d = H(i, j + 1), idx = (a > 0) | (b > 0) << 1 | (c > 0) << 2 | (d > 0) << 3; if (idx === 0 || idx === 15) continue;
    const e = [[(i + lerp(a, b)) * cell, j * cell], [(i + 1) * cell, (j + lerp(b, c)) * cell], [(i + lerp(d, c)) * cell, (j + 1) * cell], [i * cell, (j + lerp(a, d)) * cell]];
    const T = {1: [[0, 3]], 2: [[0, 1]], 3: [[1, 3]], 4: [[1, 2]], 5: [[0, 1], [2, 3]], 6: [[0, 2]], 7: [[2, 3]], 8: [[2, 3]], 9: [[0, 2]], 10: [[0, 3], [1, 2]], 11: [[1, 2]], 12: [[1, 3]], 13: [[0, 1]], 14: [[0, 3]]}[idx];
    for (const [p, q] of T) coast.push(e[p][0], e[p][1], e[q][0], e[q][1]); }
  return {plan, toon, coast};
}

export class MapView {
  constructor(canvas, D) {
    this.cv = canvas; this.x = canvas.getContext('2d'); this.D = D; this.mode = 'plan'; this.mini = false;
    this.cx = 4000; this.cy = 3000; this.scale = 0.1; this.rot = 0; this.aer = {}; this.anim = null;
    // a coarse grid of edges for culling
    this.grid = new Map(); D.plan.edges.forEach((e, i) => { const p = e.pts; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (let k = 0; k < p.length; k += 2) { x0 = Math.min(x0, p[k]); x1 = Math.max(x1, p[k]); y0 = Math.min(y0, p[k + 1]); y1 = Math.max(y1, p[k + 1]); }
      e.bb = [x0, y0, x1, y1]; for (let gx = Math.floor(x0 / 200); gx <= Math.floor(x1 / 200); gx++) for (let gy = Math.floor(y0 / 200); gy <= Math.floor(y1 / 200); gy++) { const k = gx + ',' + gy; (this.grid.get(k) || this.grid.set(k, []).get(k)).push(i); } });
  }
  size() { const r = this.cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); const W = Math.round(r.width * d), H = Math.round(r.height * d); if (this.cv.width !== W || this.cv.height !== H) { this.cv.width = W; this.cv.height = H; } this.dpr = d; return [W, H]; }
  toScreen(x, y) { const [W, H] = [this.cv.width, this.cv.height], c = Math.cos(this.rot), s = Math.sin(this.rot), dx = (x - this.cx) * this.scale, dy = (y - this.cy) * this.scale; return [W / 2 + dx * c - dy * s, H / 2 + dx * s + dy * c]; }
  toWorld(px, py) { const [W, H] = [this.cv.width, this.cv.height], c = Math.cos(-this.rot), s = Math.sin(-this.rot), dx = (px - W / 2), dy = (py - H / 2); return [this.cx + (dx * c - dy * s) / this.scale, this.cy + (dx * s + dy * c) / this.scale]; }
  field() { return this.cv.width / this.scale / this.dpr * (this.dpr); }          // metres across
  zoomTo(fieldM, cx = this.cx, cy = this.cy, ms = 1400) { if (matchMedia('(prefers-reduced-motion: reduce)').matches) ms = 1; const W = this.cv.width || 800; this.anim = {s0: this.scale, s1: W / fieldM, x0: this.cx, y0: this.cy, x1: cx, y1: cy, t0: performance.now(), ms}; }
  step(now) { const a = this.anim; if (!a) return false; const k = Math.min(1, (now - a.t0) / a.ms), e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
    this.scale = Math.exp(Math.log(a.s0) + (Math.log(a.s1) - Math.log(a.s0)) * e); this.cx = a.x0 + (a.x1 - a.x0) * e; this.cy = a.y0 + (a.y1 - a.y0) * e; if (k >= 1) this.anim = null; return true; }
  visibleEdges() { const [W, H] = [this.cv.width, this.cv.height], R = Math.hypot(W, H) / 2 / this.scale, out = new Set();
    if (R > 3000) return this.D.plan.edges.map((_, i) => i);
    for (let gx = Math.floor((this.cx - R) / 200); gx <= Math.floor((this.cx + R) / 200); gx++) for (let gy = Math.floor((this.cy - R) / 200); gy <= Math.floor((this.cy + R) / 200); gy++) for (const i of this.grid.get(gx + ',' + gy) || []) out.add(i);
    return [...out]; }
  path(pts) { const x = this.x; x.beginPath(); for (let k = 0; k < pts.length; k += 2) { const [a, b] = this.toScreen(pts[k], pts[k + 1]); k ? x.lineTo(a, b) : x.moveTo(a, b); } }

  draw(S) {
    const [W, H] = this.size(), x = this.x, D = this.D, sc = this.scale, d = this.dpr, mode = this.mode, mini = this.mini, toon = mode === 'lynch';
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, H);
    x.fillStyle = mini ? 'rgba(8,12,16,.86)' : toon ? '#b0c8d6' : '#1d2b30'; x.fillRect(0, 0, W, H);
    // ground: the land-use raster, its cartoon or the aerial photograph — laid in world space
    const G = D.ground, M = D.meta;
    const lay = img => { x.save(); const [ox, oy] = this.toScreen(0, 0); x.translate(ox, oy); x.rotate(this.rot); x.scale(sc * M.W / img.width, sc * M.H / img.height); x.imageSmoothingEnabled = mode === 'aerial' || sc < 0.5; x.drawImage(img, 0, 0); x.restore(); };
    if (mode === 'aerial' && D.aerial) { const im = sc > 0.35 && D.aerial.big ? D.aerial.big : D.aerial.small; if (im) lay(im); else if (G) lay(G.plan); }
    else if (G) { x.globalAlpha = mini ? 0.55 : 1; lay(toon ? G.toon : G.plan); x.globalAlpha = 1; }
    // lynch: districts as hatched fields, coast as the great edge
    if (toon) {
      for (const w of D.plan.wards) { const [a, b] = this.toScreen(w.x, w.y), r = 380 * sc, hue = (w.ward * 47) % 360; x.save(); x.beginPath(); x.arc(a, b, r, 0, 7); x.clip();
        x.strokeStyle = `hsla(${hue},55%,45%,.35)`; x.lineWidth = 1.2 * d; for (let k = -r * 2; k < r * 2; k += 7 * d) { x.beginPath(); x.moveTo(a + k - r, b - r); x.lineTo(a + k + r, b + r); x.stroke(); } x.restore();
        x.strokeStyle = `hsla(${hue},55%,40%,.6)`; x.setLineDash([6 * d, 4 * d]); x.beginPath(); x.arc(a, b, r, 0, 7); x.stroke(); x.setLineDash([]); }
    }
    if (G && (toon || mode === 'plan')) { x.strokeStyle = toon ? '#1f3e55' : 'rgba(150,200,220,.55)'; x.lineWidth = (toon ? 3.2 : 1.2) * d; x.beginPath(); const c = G.coast;
      for (let k = 0; k < c.length; k += 4) { const [a, b] = this.toScreen(c[k], c[k + 1]), [e, f] = this.toScreen(c[k + 2], c[k + 3]); x.moveTo(a, b); x.lineTo(e, f); } x.stroke(); }
    // footprints when near
    const B = D.bld && D.bld();
    if (B && sc > 0.18) { const era = S.era ?? 5, n = B.length / 14, [wx0, wy0] = this.toWorld(0, 0), R = Math.hypot(W, H) / sc;
      x.fillStyle = toon ? 'rgba(90,80,66,.28)' : mini ? 'rgba(210,200,180,.35)' : 'rgba(225,212,190,.8)';
      for (let k = 0; k < n; k++) { const o = k * 14, bx = B[o], by = B[o + 1]; if (Math.abs(bx - this.cx) > R || Math.abs(by - this.cy) > R) continue; if (B[o + 7] > era) continue;
        const w = B[o + 2] / 2, dd = B[o + 3] / 2, r = B[o + 4], c = Math.cos(r), s = Math.sin(r); x.beginPath();
        for (const [u, v] of [[-w, -dd], [w, -dd], [w, dd], [-w, dd]]) { const [a, b] = this.toScreen(bx + u * c - v * s, by + u * s + v * c); x.lineTo(a, b); } x.closePath(); x.fill(); } }
    // streets: every one by class; the disc's blocks lit; the trace of where you have been
    const vis = this.visibleEdges(), E = D.plan.edges, era = S.era ?? 5; x.lineCap = 'round'; x.lineJoin = 'round';
    const order = [0, 1, 4, 3, 2];
    if (mode === 'aerial') x.globalAlpha = sc > 1.5 ? 0.5 : 0;            // over the photograph the plan's streets step back
    for (const cls of order) for (const i of vis) { const e = E[i]; if (e.cls !== cls || e.born > era || (mode === 'aerial' && sc <= 1.5)) continue; this.path(e.pts);
      const w = toon ? [0.9, 3.2, 4.2, 3.8, 5][cls] * Math.min(2, Math.max(0.7, sc * 1.6)) * d : Math.max(0.7, ROAD_W[cls] * sc) * d;
      if (toon) { x.strokeStyle = cls === 2 ? '#2a2a2a' : cls === 0 ? '#a39a8c' : '#202020'; x.lineWidth = w; x.stroke();
        if (cls === 2) { x.strokeStyle = '#efe9dc'; x.lineWidth = w * 0.5; x.setLineDash([4 * d, 5 * d]); x.stroke(); x.setLineDash([]); } }
      else { x.strokeStyle = mini ? ['#56606a', '#c9b48a', '#8a96a2', '#e7c58a', '#d8c7a6'][cls] : ['#cfc8bb', '#f1d79c', '#a8b4bf', '#f6d48a', '#efe0c0'][cls]; x.lineWidth = w; x.stroke(); } }
    x.globalAlpha = 1;
    // the disc: blocks with frames, a thin bright line down their centres
    x.strokeStyle = mini ? 'rgba(127,209,255,.95)' : toon ? 'rgba(200,40,40,.85)' : 'rgba(127,209,255,.9)'; x.lineWidth = Math.max(1.4, Math.min(4, 2.2 * sc)) * d;
    for (const i of vis) { const e = E[i]; if (!e.disc) continue; this.path(e.pts); x.stroke(); }
    if (S.trace) { x.strokeStyle = '#ffb35c'; x.lineWidth = Math.max(2.5, Math.min(8, 6 * sc)) * d;
      for (const [ei, flags] of S.trace) { const st = D.steps(ei); let open = false; x.beginPath();
        for (let k = 0; k < st.length; k++) { if (!flags[k]) { open = false; continue; } const [a, b] = this.toScreen(st[k][0], st[k][1]); open ? x.lineTo(a, b) : x.moveTo(a, b); open = true; } x.stroke(); } }
    // nodes and landmarks (Lynch), plazas, poem sites
    if (toon) { for (const [k, n] of D.plan.nodes.entries()) { if (n[2] < 3) continue; const big = (D.nodeRank[k] || 0) >= 2; if (!big && sc < 0.6) continue; const [a, b] = this.toScreen(n[0], n[1]);
        x.fillStyle = '#111'; x.beginPath(); x.arc(a, b, (big ? 4 : 2) * d, 0, 7); x.fill(); if (big) { x.strokeStyle = '#111'; x.lineWidth = 1.2 * d; x.beginPath(); x.arc(a, b, 8 * d, 0, 7); x.stroke(); } }
      for (const p of M.plazas) { const [a, b] = this.toScreen(p.x, p.y); x.strokeStyle = '#111'; x.lineWidth = 1.5 * d; x.beginPath(); x.arc(a, b, Math.max(5 * d, p.r * sc), 0, 7); x.stroke(); } }
    const lmS = toon ? 9 : 6;
    for (const l of M.landmarks) { const [a, b] = this.toScreen(l.x, l.y); if (a < -40 || b < -40 || a > W + 40 || b > H + 40) continue; if (l.era[0] > era) continue;
      x.fillStyle = toon ? '#111' : '#ffb35c'; x.beginPath(); x.moveTo(a, b - lmS * d); x.lineTo(a + lmS * 0.85 * d, b + lmS * 0.6 * d); x.lineTo(a - lmS * 0.85 * d, b + lmS * 0.6 * d); x.closePath(); x.fill();
      if (!mini && (sc > 0.25 || toon)) this.label(l.name.split(' · ')[0].split(',')[0], a + 8 * d, b + 3 * d, toon ? '#111' : '#ffd9a8', 11, 'left'); }
    for (const p of M.poems) { const [a, b] = this.toScreen(p.x, p.y); x.fillStyle = '#7fd1ff'; x.strokeStyle = '#06202c'; x.lineWidth = 2 * d; x.beginPath(); x.arc(a, b, 4.5 * d, 0, 7); x.fill(); x.stroke();
      if (!mini && sc > 0.12) this.label(p.num + ' ' + p.title, a + 8 * d, b - 6 * d, toon ? '#0a4a6a' : '#bfe6ff', 11, 'left'); }
    if (toon && !mini) for (const w of D.plan.wards) { const [a, b] = this.toScreen(w.x, w.y); this.label(w.name.replace(/^the /, '').toUpperCase(), a, b, `hsl(${(w.ward * 47) % 360},55%,28%)`, 12, 'center', '600', 0.22); }
    // street names along the ways when near
    if (!mini && sc > 0.7) { const done = new Set(); for (const i of vis) { const e = E[i]; if (done.has(e.w) || e.len < 60 || e.born > era) continue; done.add(e.w); const p = e.pts, k = (p.length / 4 | 0) * 2;
        const [a, b] = this.toScreen(p[k], p[k + 1]), [c, f] = this.toScreen(p[k + 2] ?? p[k], p[k + 3] ?? p[k + 1]); let ang = Math.atan2(f - b, c - a); if (ang > Math.PI / 2) ang -= Math.PI; if (ang < -Math.PI / 2) ang += Math.PI;
        x.save(); x.translate(a, b); x.rotate(ang); this.label(D.plan.ways[e.w].name, 0, -4 * d, toon ? '#222' : '#fff', 10, 'center'); x.restore(); } }
    // the steps of the current block, every frame a dot, at the nearest powers
    if (S.pos && sc > 5) { const st = D.steps(S.pos.e); x.fillStyle = '#fff'; for (let k = 0; k < st.length; k++) { const [a, b] = this.toScreen(st[k][0], st[k][1]); x.beginPath(); x.arc(a, b, 2.2 * d, 0, 7); x.fill(); if (sc > 12) this.label(String(k), a + 4 * d, b - 4 * d, '#ffd', 9, 'left'); } }
    // you: the car, its heading and the camera's 90° view
    if (S.pos) { const [a, b] = this.toScreen(S.x, S.y), hv = S.heading + S.view * Math.PI / 2 + this.rot, R = (mini ? 38 : 46) * d;
      x.fillStyle = 'rgba(255,179,92,.28)'; x.beginPath(); x.moveTo(a, b); x.arc(a, b, R, hv - Math.PI / 4, hv + Math.PI / 4); x.closePath(); x.fill();
      const hh = S.heading + this.rot; x.fillStyle = '#ffb35c'; x.strokeStyle = '#000'; x.lineWidth = 1.5 * d; x.beginPath();
      x.moveTo(a + Math.cos(hh) * 10 * d, b + Math.sin(hh) * 10 * d); x.lineTo(a + Math.cos(hh + 2.5) * 7 * d, b + Math.sin(hh + 2.5) * 7 * d); x.lineTo(a + Math.cos(hh - 2.5) * 7 * d, b + Math.sin(hh - 2.5) * 7 * d); x.closePath(); x.fill(); x.stroke(); }
    // scale bar: the power of ten in view
    if (!mini) { const fm = W / sc, p = Math.pow(10, Math.floor(Math.log10(fm / 3))), L = p * sc; x.fillStyle = toon ? '#111' : '#fff'; x.fillRect(16 * d, H - 22 * d, L, 3 * d);
      this.label(p >= 1000 ? `${p / 1000} km` : `${p} m`, 16 * d + L + 6 * d, H - 17 * d, toon ? '#111' : '#fff', 11, 'left');
      this.label(`field ${fm >= 1000 ? (fm / 1000).toFixed(fm < 10000 ? 1 : 0) + ' km' : Math.round(fm) + ' m'} · 10^${Math.log10(fm).toFixed(1)} m`, 16 * d, H - 30 * d, toon ? '#333' : '#cfd8de', 10, 'left'); }
  }
  label(t, a, b, col, size = 11, align = 'left', weight = '500', spacing = 0) {
    const x = this.x, d = this.dpr; x.font = `${weight} ${size * d}px ui-sans-serif,-apple-system,"Helvetica Neue",Arial`; x.textAlign = align; x.textBaseline = 'middle';
    if (spacing && x.letterSpacing !== undefined) x.letterSpacing = `${spacing}em`;
    x.lineWidth = 3 * d; x.strokeStyle = this.mode === 'lynch' ? 'rgba(239,233,220,.9)' : 'rgba(0,0,0,.75)'; x.strokeText(t, a, b); x.fillStyle = col; x.fillText(t, a, b);
    if (spacing && x.letterSpacing !== undefined) x.letterSpacing = '0px';
  }
}
