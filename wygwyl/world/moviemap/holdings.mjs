// WHAT THE CITY HOLDS, ON ITS WALLS — posters (the canon's pictures, on the façade that faces where each was taken), the library's
// reference images, and films playing on façades. They are drawn into the frame by projecting each façade quad through the same
// camera the frame was made with, so they sit on the walls of disc frames and live renders alike. Hidden when something stands between.
const BASE = '../../';
export const srcURL = s => /^https?:/.test(s) ? s : BASE + s;

export function makeHoldings(ledger, {bld, onload = () => {}}) {
  const H = ledger.holdings, byLot = new Map(), byNode = new Map();
  for (const h of H) { if (h.lot != null) (byLot.get(h.lot) || byLot.set(h.lot, []).get(h.lot)).push(h); if (h.node != null) (byNode.get(h.node) || byNode.set(h.node, []).get(h.node)).push(h); }
  // one thing shown per façade: a film over a picture over a reference
  const RANK = {screen: 0, poster: 1, ref: 2};
  const walls = [...byLot.entries()].map(([k, list]) => { const show = list.filter(h => RANK[h.kind] != null).sort((a, b) => RANK[a.kind] - RANK[b.kind] || (a.id < b.id ? -1 : 1))[0]; return show ? {k, h: show, face: show.face} : null; }).filter(Boolean);
  const WG = new Map(); for (const w of walls) { const key = Math.floor(w.face[0] / 100) + ',' + Math.floor(w.face[1] / 100); (WG.get(key) || WG.set(key, []).get(key)).push(w); }
  // footprints, for a line-of-sight test on the plan
  const BG = new Map(); if (bld) for (let k = 0; k < bld.length / 14; k++) { const o = k * 14, key = Math.floor(bld[o] / 40) + ',' + Math.floor(bld[o + 1] / 40); (BG.get(key) || BG.set(key, []).get(key)).push(k); }
  function blocked(x0, y0, x1, y1, skip, era) {
    const L = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(L / 3);
    for (let s = 1; s < n - 1; s++) { const x = x0 + (x1 - x0) * s / n, y = y0 + (y1 - y0) * s / n;
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const k of BG.get((Math.floor(x / 40) + a) + ',' + (Math.floor(y / 40) + b)) || []) { if (k === skip) continue; const o = k * 14;
        if (bld[o + 7] > era || (bld[o + 8] <= era && !(era >= 5 && bld[o + 9]))) continue;
        const c = Math.cos(bld[o + 4]), sn = Math.sin(bld[o + 4]), dx = x - bld[o], dy = y - bld[o + 1];
        if (Math.abs(dx * c + dy * sn) < bld[o + 2] / 2 && Math.abs(-dx * sn + dy * c) < bld[o + 3] / 2) return true; } }
    return false;
  }
  const standing = (k, era) => { if (!bld) return true; const o = k * 14; return bld[o + 7] <= era && (bld[o + 8] > era || (era >= 5 && bld[o + 9] > 0)); };
  // the camera the frame was made with: position, yaw, horizontal field of view 90°, aspect 3:2
  function projector(cam) { const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), T = Math.tan(cam.hfov / 2), TV = T / cam.aspect;
    return (X, Y, Z) => { const dx = X - cam.x, dz = Z - cam.y, dy = Y - cam.z, f = dx * cy + dz * sy, r = -dx * sy + dz * cy; if (f < 0.6) return null;
      return [0.5 + 0.5 * (r / f) / T, 0.5 - 0.5 * (dy / f) / TV, f]; }; }
  // the quad of a holding on its façade, as 3D corners (u from the reader's left, v from the top)
  function quad(w, aspect) {
    const [fx, fy, gz, ang, fw, fh] = w.face, nx = Math.cos(ang), ny = Math.sin(ang), rx = Math.sin(ang), ry = -Math.cos(ang);
    let pw = Math.min(fw * 0.72, w.h.kind === 'screen' ? 16 : 10), ph = pw / aspect; const room = Math.max(2, fh - 4.2); if (ph > room) { ph = room; pw = ph * aspect; }
    const z0 = gz + 3.6, cx = fx + nx * 0.25, cy2 = fy + ny * 0.25;
    return (u, v) => [cx + rx * (u - 0.5) * pw, z0 + (1 - v) * ph, cy2 + ry * (u - 0.5) * pw];
  }
  const imgs = new Map(), vids = new Map();
  function image(h) { let im = imgs.get(h.id); if (!im) { im = new Image(); im.decoding = 'async'; im.onload = onload; im.src = srcURL(h.src); imgs.set(h.id, im); } return im.complete && im.naturalWidth ? im : null; }
  function video(h, on) { let v = vids.get(h.id); if (!on) { if (v && !v.paused) v.pause(); return v && v.readyState >= 2 ? v : null; }
    if (!v) { v = document.createElement('video'); v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto'; v.crossOrigin = null; v.src = srcURL(h.src); v.onerror = () => { v.dead = true; }; vids.set(h.id, v); }
    if (!v.dead && v.paused) v.play().catch(() => {}); return v.readyState >= 2 ? v : null; }
  // a textured quad drawn as a grid of affine triangles (close enough to perspective at this size)
  function texQuad(x, src, sw, sh, P) {
    const N = 4;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const a = P[j][i], b = P[j][i + 1], c = P[j + 1][i], d = P[j + 1][i + 1]; if (!a || !b || !c || !d) continue;
      const u0 = i / N * sw, u1 = (i + 1) / N * sw, v0 = j / N * sh, v1 = (j + 1) / N * sh;
      tri(x, src, a, b, c, [u0, v0], [u1, v0], [u0, v1]); tri(x, src, d, c, b, [u1, v1], [u0, v1], [u1, v0]); }
  }
  function tri(x, src, p0, p1, p2, t0, t1, t2) {
    x.save(); x.beginPath(); const cxm = (p0[0] + p1[0] + p2[0]) / 3, cym = (p0[1] + p1[1] + p2[1]) / 3, g = q => [q[0] + Math.sign(q[0] - cxm) * 0.6, q[1] + Math.sign(q[1] - cym) * 0.6];
    const [A, Bq, Cq] = [g(p0), g(p1), g(p2)]; x.moveTo(A[0], A[1]); x.lineTo(Bq[0], Bq[1]); x.lineTo(Cq[0], Cq[1]); x.closePath(); x.clip();
    const d = t0[0] * (t1[1] - t2[1]) + t1[0] * (t2[1] - t0[1]) + t2[0] * (t0[1] - t1[1]); if (!d) { x.restore(); return; }
    const a = (p0[0] * (t1[1] - t2[1]) + p1[0] * (t2[1] - t0[1]) + p2[0] * (t0[1] - t1[1])) / d, b = (p0[1] * (t1[1] - t2[1]) + p1[1] * (t2[1] - t0[1]) + p2[1] * (t0[1] - t1[1])) / d;
    const c = (p0[0] * (t2[0] - t1[0]) + p1[0] * (t0[0] - t2[0]) + p2[0] * (t1[0] - t0[0])) / d, dd = (p0[1] * (t2[0] - t1[0]) + p1[1] * (t0[0] - t2[0]) + p2[1] * (t1[0] - t0[0])) / d;
    const e = (p0[0] * (t1[0] * t2[1] - t2[0] * t1[1]) + p1[0] * (t2[0] * t0[1] - t0[0] * t2[1]) + p2[0] * (t0[0] * t1[1] - t1[0] * t0[1])) / d;
    const f = (p0[1] * (t1[0] * t2[1] - t2[0] * t1[1]) + p1[1] * (t2[0] * t0[1] - t0[0] * t2[1]) + p2[1] * (t0[0] * t1[1] - t1[0] * t0[1])) / d;
    x.transform(a, b, c, dd, e, f); x.drawImage(src, 0, 0); x.restore();
  }
  // draw what is on the walls in view; returns the hit regions (screen polygons) for touch
  function draw(x, cam, fit, {era = 5, night = 0, idAt = null, dbg = null} = {}) {
    const P = projector(cam), hits = [], R = 110, cand = [];
    for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) for (const w of WG.get((Math.floor(cam.x / 100) + a) + ',' + (Math.floor(cam.y / 100) + b)) || []) {
      const [fx, fy, , ang] = w.face, d = Math.hypot(fx - cam.x, fy - cam.y); if (d > R || d < 4) continue;
      if ((cam.x - fx) * Math.cos(ang) + (cam.y - fy) * Math.sin(ang) < 1) continue;                       // the wall faces us
      if (!standing(w.k, era)) continue;
      // in the frame at all? (the nearest ten in view are drawn, not the nearest ten in any direction)
      const [cx0, cy0, gz0] = w.face, pc0 = P(cx0, gz0 + 5, cy0); if (!pc0 || pc0[0] < -0.3 || pc0[0] > 1.3) continue; cand.push([d, w]); }
    cand.sort((a, b) => a[0] - b[0]);
    let playing = 0;
    for (const [d, w] of cand.slice(0, 10)) {
      const h = w.h, isScreen = h.kind === 'screen';
      const src = isScreen ? video(h, playing < 2 && d < 120) : image(h); if (isScreen && src) playing++;
      const aspect = isScreen ? (h.aspect || 16 / 9) : src ? src.naturalWidth / src.naturalHeight : 2.27, Q = quad(w, aspect);
      const c3 = Q(0.5, 0.5), pc = P(c3[0], c3[1], c3[2]); if (!pc || pc[0] < -0.2 || pc[0] > 1.2 || pc[1] < -0.2 || pc[1] > 1.2) continue;
      // the ID buffer, when the city is raised, must see this very building at the picture's centre (a tree, a sign, another house: hidden)
      if (idAt) { const id = idAt(pc[0], pc[1]); if (dbg) dbg.push(['id', w.h.id, id && (id.kind + (id.k ?? id.i ?? ''))]); if (!id || id.kind !== 'building' || id.k !== w.k) continue; }
      else if (bld && blocked(cam.x, cam.y, c3[0], c3[2], w.k, era)) continue;
      const G = []; for (let j = 0; j <= 4; j++) { G.push([]); for (let i = 0; i <= 4; i++) { const p3 = Q(i / 4, j / 4), p = P(p3[0], p3[1], p3[2]); G[j].push(p ? [fit.dx + p[0] * fit.dw, fit.dy + p[1] * fit.dh] : null); } }
      const fade = Math.min(1, (R - d) / 30);
      x.save(); x.globalAlpha = fade * (isScreen ? 1 : 0.94);
      if (dbg) dbg.push([w.h.id, Math.round(d), !!src, pc && pc.map(v => +v.toFixed(2))]);
      if (!src && !isScreen) continue;                                  // a picture not yet arrived is not drawn as a hole
      if (src) texQuad(x, src, isScreen ? src.videoWidth : src.naturalWidth, isScreen ? src.videoHeight : src.naturalHeight, G);
      else { x.fillStyle = isScreen ? '#05070a' : '#2a2620'; x.beginPath(); [G[0][0], G[0][4], G[4][4], G[4][0]].forEach((p, i) => p && (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.closePath(); x.fill(); }
      // a frame round each: thin, so the wall still reads as a wall
      x.strokeStyle = isScreen ? `rgba(127,209,255,${0.5 + 0.4 * night})` : 'rgba(20,16,12,.7)'; x.lineWidth = Math.max(1, 2.5 * fit.d * Math.min(1, 30 / d)); x.beginPath();
      [G[0][0], G[0][4], G[4][4], G[4][0]].forEach((p, i) => p && (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.closePath(); x.stroke(); x.restore();
      hits.push({poly: [G[0][0], G[0][4], G[4][4], G[4][0]], h, k: w.k});
    }
    for (const [id, v] of vids) if (!cand.slice(0, 10).some(([, w]) => w.h.id === id) && !v.paused) v.pause();
    return hits;
  }
  const inPoly = (pt, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if (!a || !b) return false; if ((a[1] > pt[1]) !== (b[1] > pt[1]) && pt[0] < (b[0] - a[0]) * (pt[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
  return {H, byLot, byNode, walls, draw, inPoly, forLot: k => byLot.get(k) || [], atNode: n => byNode.get(n) || [], counts: ledger.counts};
}
