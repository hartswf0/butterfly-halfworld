/* _kit.mjs — SHARED DRAWING KIT for the ABIDING ACRES set + prop vocabulary.
   NOT an asset. Exports no `asset`; the leading underscore keeps it out of
   glob-driven render runs.

   Three things live here, and all three exist because of BUILD-BRIEF §5:

   1. brokenRun()  — THE anti-striping primitive. This assignment is made
      almost entirely of full-width horizontals: siding courses, shingle
      rows, kerbs, counters, ceiling tees, shelves, rows of chairs. Drawn
      honestly they turn the halftone field into a barcode. Every long
      horizontal in every module I wrote goes through this: it chops a span
      into 2-5 segments separated by paper gaps, deterministically per
      (row, seed), so no two courses break in the same place and the eye
      reads material instead of stripes.

   2. digit()      — house numerals as stroked GEOMETRY, never as text.
      Type dissolves in the dot lattice (§5). A 1990s brass address plaque
      is drawn as strokes ~0.16 of cap height, minimum 60px in source space.

   3. tone/level shorthands and weathering speckle, so "vinyl siding is
      LIGHT" is easy to obey: L(1) and L(2) are the default wall planes and
      anything above L(5) has to earn it.
*/
import { toneSolid, inkLevel, INK, rnd, clamp, lerp } from "../../engine/halfworld-engine.mjs";

/* ---- ink shorthands ------------------------------------------------- */
export const L  = l => toneSolid(inkLevel(clamp(l, 0, 7)));
export const LV = l => inkLevel(clamp(l, 0, 7));

/* ---- the anti-striping primitive ------------------------------------ */
/* Split [x0,x1] into segments with paper gaps. Returns [[a,b],...].
   seed makes it deterministic per row so a render is reproducible. */
export function brokenRun(x0, x1, seed, {
  segs = 0,          // 0 = pick 2..4 from the seed
  gap = 0.045,       // gap width as a fraction of the whole span
  jitter = 0.35,     // how uneven the segment lengths are
  endTrim = 0.0,     // pull both ends in by this fraction
} = {}) {
  const r = rnd(seed | 0);
  const span = x1 - x0;
  const a0 = x0 + span * endTrim, a1 = x1 - span * endTrim;
  const n = segs || (2 + Math.floor(r() * 3));
  if (n <= 1) return [[a0, a1]];
  // random-ish weights
  const w = []; let tot = 0;
  for (let i = 0; i < n; i++) { const v = 1 + (r() - 0.5) * 2 * jitter; w.push(v); tot += v; }
  const usable = (a1 - a0) - span * gap * (n - 1);
  const out = []; let cx = a0;
  for (let i = 0; i < n; i++) {
    const len = usable * w[i] / tot;
    out.push([cx, cx + len]);
    cx += len + span * gap * (1 + (r() - 0.5) * 0.7);
  }
  return out;
}

/* Stroke a broken horizontal at y. The single most-used call in the set. */
export function brokenLine(g, x0, x1, y, seed, opts = {}) {
  const lw = opts.lw ?? 2.5;
  const drop = opts.drop ?? 0;    // per-segment vertical wobble
  g.strokeStyle = opts.color || INK;
  g.lineWidth = lw; g.lineCap = "butt";
  const r = rnd((seed | 0) + 7717);
  for (const [a, b] of brokenRun(x0, x1, seed, opts)) {
    const dy = drop ? (r() - 0.5) * drop : 0;
    g.beginPath(); g.moveTo(a, y + dy); g.lineTo(b, y + dy); g.stroke();
  }
}

/* Fill a broken horizontal BAND (a course of siding, a shelf edge, a kerb
   face). Same law: never one rectangle from edge to edge. */
export function brokenBand(g, x0, x1, y, h, seed, level, opts = {}) {
  g.fillStyle = LV(level);
  for (const [a, b] of brokenRun(x0, x1, seed, opts)) g.fillRect(a, y, b - a, h);
  if (opts.outline !== false) {
    g.strokeStyle = INK; g.lineWidth = opts.lw ?? 2;
    for (const [a, b] of brokenRun(x0, x1, seed, opts)) g.strokeRect(a, y, b - a, h);
  }
}

/* ---- numerals as geometry ------------------------------------------- */
/* Stroked digit inside box (x,y,w,h). lw defaults to 0.17*h. Never text. */
export function digit(g, ch, x, y, w, h, lw, color) {
  const P = (nx, ny) => [x + nx * w, y + ny * h];
  g.save();
  g.strokeStyle = color || INK;
  g.lineWidth = lw || h * 0.17;
  g.lineCap = "round"; g.lineJoin = "round";
  const M = (nx, ny) => { const p = P(nx, ny); g.moveTo(p[0], p[1]); };
  const T = (nx, ny) => { const p = P(nx, ny); g.lineTo(p[0], p[1]); };
  const EL = (cx, cy, rx, ry, a0, a1) => g.ellipse(x + cx * w, y + cy * h, rx * w, ry * h, 0, a0, a1);
  g.beginPath();
  switch (String(ch)) {
    case "0": EL(0.50, 0.50, 0.38, 0.47, 0, 7); break;
    case "1": M(0.26, 0.22); T(0.55, 0.03); T(0.55, 0.97); M(0.24, 0.97); T(0.86, 0.97); break;
    case "2": EL(0.50, 0.28, 0.36, 0.25, Math.PI * 1.05, Math.PI * 0.30);
      M(0.86, 0.36); T(0.14, 0.97); T(0.90, 0.97); break;
    case "3": EL(0.48, 0.27, 0.34, 0.24, Math.PI * 1.10, Math.PI * 0.45);
      EL(0.46, 0.72, 0.38, 0.26, Math.PI * 1.62, Math.PI * 0.70); break;
    case "4": M(0.72, 0.03); T(0.06, 0.69); T(0.97, 0.69); M(0.72, 0.03); T(0.72, 0.97); break;
    case "5": M(0.88, 0.04); T(0.20, 0.04); T(0.15, 0.42);
      EL(0.50, 0.68, 0.40, 0.29, Math.PI * 1.22, Math.PI * 0.62); break;
    case "6": EL(0.50, 0.70, 0.40, 0.28, 0, 7);
      M(0.88, 0.08); T(0.60, 0.05); EL(0.52, 0.42, 0.38, 0.37, Math.PI * 1.55, Math.PI * 1.02, true); break;
    case "7": M(0.06, 0.05); T(0.94, 0.05); T(0.40, 0.97); break;
    case "8": EL(0.50, 0.25, 0.32, 0.22, 0, 7); EL(0.50, 0.72, 0.40, 0.26, 0, 7); break;
    case "9": EL(0.50, 0.29, 0.38, 0.26, 0, 7);
      M(0.88, 0.30); T(0.80, 0.72); T(0.34, 0.96); break;
    default: EL(0.50, 0.50, 0.30, 0.40, 0, 7);
  }
  g.stroke();
  g.restore();
}

/* Draw a whole number as geometry, left-aligned in a row of boxes. */
export function numerals(g, str, x, y, h, color) {
  const s = String(str), dw = h * 0.62, gapw = h * 0.20;
  let cx = x;
  for (const ch of s) { digit(g, ch, cx, y, dw, h, h * 0.16, color); cx += dw + gapw; }
  return cx - gapw - x;   // total width
}

/* ---- weathering ----------------------------------------------------- */
/* Scatter small dark specks — moss, stain, gravel, fallen fruit litter.
   Deliberately sparse: the brief says everything comes out too dark. */
export function speckle(g, x0, y0, x1, y1, seed, count, r0, level, shapeFn) {
  const r = rnd(seed | 0);
  g.fillStyle = LV(level);
  for (let i = 0; i < count; i++) {
    const px = lerp(x0, x1, r()), py = lerp(y0, y1, r());
    if (shapeFn && !shapeFn(px, py)) continue;
    const rr = r0 * (0.55 + r() * 0.9);
    g.beginPath(); g.ellipse(px, py, rr, rr * (0.6 + r() * 0.6), r() * 3, 0, 7); g.fill();
  }
}

/* Vertical stain streak under a gutter joint / AC drip / rust run. */
export function streak(g, x, y0, y1, wgt, seed, level) {
  const r = rnd(seed | 0);
  g.strokeStyle = LV(level); g.lineCap = "round";
  const n = 2 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    g.lineWidth = wgt * (0.4 + r() * 0.8);
    const dx = (r() - 0.5) * wgt * 2.4;
    g.beginPath(); g.moveTo(x + dx, y0 + (r() * 0.2) * (y1 - y0));
    g.lineTo(x + dx + (r() - 0.5) * wgt, y1 - (r() * 0.25) * (y1 - y0)); g.stroke();
  }
}

/* Soft contact shadow on the ground plane. */
export function groundShadow(g, cx, cy, rx, ry, a = 0.12) {
  g.fillStyle = `rgba(0,0,0,${a})`;
  g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, 7); g.fill();
}

/* ---- convenience ---------------------------------------------------- */
export function quad(pen, g, pts, tone, lw = 3) {
  pen.paint(() => {
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.closePath();
  }, tone, lw);
}

export const KIT_VERSION = "abiding-kit/1.0.0";
