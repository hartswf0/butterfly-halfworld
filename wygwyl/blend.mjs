/* ============================================================================
   BLEND — the transitions between footage and drawing.

   The world has no alpha, so there is exactly one kind of dissolve: a per-dot
   allegiance swap on the ordered (Bayer) schedule (see halfworld.mjs, THE DOT
   LAW). Every function here takes two ink fields — flat Float32Array buffers,
   FW*FH long, values 0..8, the same shape halfworld.mjs's renderField() and
   ingest.mjs's sample() both produce — and returns a NEW field built by
   choosing, cell by cell, which of the two substances occupies that dot. There
   is no cell that is ever "40% footage" — a cell is footage, or it is drawing,
   and the schedule decides which dots have already changed sides.

   halfworld.mjs keeps its Bayer matrix and its noise hash private to the
   engine (makeKit is not exported), so this module carries its own — the same
   8x8 matrix, because the schedule is the law, not an implementation detail,
   and every dissolve in the suite should tear along the same lattice. ingest.mjs
   imports both from here rather than re-deriving them, so the whole footage
   pipeline and every transition share one schedule and one noise field.
   ========================================================================= */
import { FW, FH, TAU, clamp01, lerp } from "./halfworld.mjs";

/* 8x8 Bayer matrix, /64 — identical to halfworld.mjs's private B8, reproduced
   here because the engine does not export it and every dissolve in this suite
   must tear along the same ordered schedule. */
const B8 = [
  0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26,
  12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22,
  3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25,
  15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21,
];
export const bayer = (x, y) => B8[((y & 7) << 3) | (x & 7)] / 64;

/* deterministic hash noise + smooth value noise, private-engine-equivalent but
   independently seeded so a blend's tearing never accidentally lines up with
   a world's own noise field. */
function hash(x, y, seed) {
  let n = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 69069) + 0x9e3779b9;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
const fade = (t) => t * t * (3 - 2 * t);
export function n2(x, y, seed = 0) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const tx = fade(x - xi), ty = fade(y - yi);
  const a = hash(xi, yi, seed), b = hash(xi + 1, yi, seed);
  const c = hash(xi, yi + 1, seed), d = hash(xi + 1, yi + 1, seed);
  return lerp(lerp(a, b, tx), lerp(c, d, tx), ty);
}

const alloc = () => new Float32Array(FW * FH);

/* -------------------------------------------------------------------------
   swap — the plain allegiance swap. Every cell whose Bayer value is under t
   has already changed sides; the schedule fills in a stable, evenly spread
   dither pattern as t sweeps 0..1, which is why an ordered dissolve reads as
   grain resolving rather than as noise. This is the one every other blend
   here specialises. */
export function swap(a, b, t) {
  const out = alloc();
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
    const q = y * FW + x;
    out[q] = bayer(x, y) < t ? b[q] : a[q];
  }
  return out;
}

/* -------------------------------------------------------------------------
   wipe — the same schedule, biased by a direction so the swap front crosses
   the frame at `angle` (radians, 0 = left-to-right) instead of arriving
   evenly everywhere at once. `opts.band` (default 0.22, in normalised
   frame-projection units) is how wide the dithered leading edge is; a narrow
   band reads as a hard-ish diagonal wipe, a wide one as a long, torn front. */
export function wipe(a, b, t, angle = 0, opts = {}) {
  const band = Math.max(0.02, opts.band ?? 0.22);
  const nx = Math.cos(angle), ny = Math.sin(angle);
  const corners = [[0, 0], [FW, 0], [0, FH], [FW, FH]];
  let mn = Infinity, mx = -Infinity;
  for (const [cx, cy] of corners) { const p = cx * nx + cy * ny; if (p < mn) mn = p; if (p > mx) mx = p; }
  const span = (mx - mn) || 1;
  const out = alloc();
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
    const q = y * FW + x;
    const p = ((x * nx + y * ny) - mn) / span;             // 0..1 along the wipe direction
    const edge = t * (1 + band) - band * 0.5;               // where the front currently sits
    const local = clamp01((edge - p) / band + 0.5);         // 0..1 across the dithered band
    out[q] = bayer(x, y) < local ? b[q] : a[q];
  }
  return out;
}

/* -------------------------------------------------------------------------
   byLevel — allegiance is keyed to how dark the FOOTAGE cell (`a`) already
   is, not just its position, so one image reads as being eaten out of the
   other along its own tonal structure. reverse=false: dark dots (high ink,
   toward 7) go first — shadow turns to drawing while the highlights hold, an
   underexposed shot dissolving from its own darkest mass outward. reverse=
   true: light dots go first — the glow around a streetlight is the first
   thing to become ink, and the dark figure is the last thing standing in
   footage. A little Bayer noise is mixed into the key so cells at the same
   level do not all flip in the same instant, which without it read as
   banding rather than dissolve. */
export function byLevel(a, b, t, reverse = false) {
  const out = alloc();
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
    const q = y * FW + x;
    let dark = clamp01(a[q] / 7);
    if (reverse) dark = 1 - dark;
    const key = (1 - dark) * 0.78 + bayer(x, y) * 0.22;      // low key = swaps early
    out[q] = key < t ? b[q] : a[q];
  }
  return out;
}

/* -------------------------------------------------------------------------
   noiseSwap — the ordered schedule perturbed by field noise, so the boundary
   is torn rather than evenly dithered: patches jump ahead of or lag behind
   the front. `s` (0..1) is how much of the schedule is noise versus Bayer —
   at s=0 this is identical to swap(); at s=1 the front has no residual grid
   structure left at all and looks closer to burning paper than a wipe.
   `opts.scale` sets the spatial frequency of the tear (default 0.05: tears
   ~20 cells across); `opts.seed` reseeds it for a different tear pattern. */
export function noiseSwap(a, b, t, s = 0.4, opts = {}) {
  const scale = opts.scale ?? 0.05, seed = opts.seed ?? 0;
  const out = alloc();
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
    const q = y * FW + x;
    const n = n2(x * scale, y * scale, seed);
    const local = clamp01(bayer(x, y) * (1 - s) + n * s);
    out[q] = local < t ? b[q] : a[q];
  }
  return out;
}

/* -------------------------------------------------------------------------
   figureLock — footage everywhere EXCEPT where the drawing (`b`) already
   has ink, so a drawn body can move through a filmed room. `b`'s own ink is
   the mask: wherever it draws at or above `threshold` (default 3.5 — the
   engine's own "is this cell meaningfully inked" line, see F.ink), that cell
   is ALWAYS the drawing, at every t — that is the lock, and it is not
   scheduled, because a figure that flickered between footage and drawing at
   its own silhouette edge would read as a matte problem, not a transition.
   `t` instead sweeps the ROOM around the locked figure from footage (t=0)
   to drawing (t=1) on the ordinary Bayer schedule, so the same control that
   drives every other blend here can carry the room from "he is drawn, and
   everything around him is filmed" through to "he is drawn, and so now is
   the room" — the figure never has to wait for the room to catch up. */
export function figureLock(a, b, t, threshold = 3.5) {
  const out = alloc();
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
    const q = y * FW + x;
    const bv = b[q];
    if (bv >= threshold) { out[q] = bv; continue; }
    out[q] = bayer(x, y) < t ? b[q] : a[q];
  }
  return out;
}
