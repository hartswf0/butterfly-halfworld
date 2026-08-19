/* ============================================================================
   treatments.mjs — footage entering the dot law, past what ingest.mjs does.

   ingest.mjs answers one question well: "what ink level does THIS CELL get,
   read through this channel, this tone curve, this dither." Every treatment
   here asks a DIFFERENT question of the same source pixels — not "what level
   is this dot" but "what REGION is this part of," "is this cell part of the
   room's architecture or its haze," "is this the poet's own silhouette,"
   "did this cell change since the last sample," "where does the drawn room's
   window actually line up with the filmed one." None of that is a channel or
   a tone curve; it needs its own small amount of image processing (blur,
   Sobel, connected components, image moments, a guided Hough vote), done
   here, once, and then handed back as the same shape every other module in
   this suite already agrees on: a flat Float32Array, FW*FH long, values
   0..8, no alpha, nothing between frames.

   THE LAW, restated for this file specifically. Everything below produces a
   FLAT, QUANTISED field — 8 ink levels, no gradients, no blur baked into the
   output, no alpha — even where the technique (a blurred Sobel pass, an
   averaged "long exposure," a vignette) sounds continuous. Where a treatment
   needs to represent something that would naturally be a gradient (a
   falloff, a mean of several frames), it goes through the SAME move
   ingest.mjs and halfworld.mjs both use: compute a continuous 0..1 amount,
   then resolve it to a flat level through the ordered (Bayer) schedule. A
   gradient never gets stored; a dot pattern that READS as one does.

   TWO SHAPES OF FUNCTION, both pure.
     · FIELD treatments — swap/wipe/byLevel's own shape (blend.mjs): pure
       functions of one or more already-sampled Float32Arrays, returning a
       new one. motionInk, heldMemory, crushReverse, grainReverse,
       vignetteReverse, windowPortal/paintedWindow/windowLock, byStructure,
       longExposure, tracedFigure, paperFigure.
     · SOURCE treatments — pure functions of an ImageData-shaped `img`
       ({data,width,height}, exactly what canvas.getContext('2d')
       .getImageData(...) returns) PLUS opts. contourFill, structureLines,
       figureSilhouette, kaleidoField, resonantKaleido. Every one of these
       assumes img is already FW×FH — the same size ingest.mjs's own
       offscreen canvas samples down to (`makeIngest(el).canvas`), so the
       usual way to get one is to call ingest.sample() for its side effect
       on `.canvas`, then read that canvas's pixels here. No treatment in
       this file draws a video frame itself — that stays ingest.mjs's job,
       so there is exactly one place a video or a still-image element is
       ever read from, which is also why every fallback ingest.mjs already
       has (naturalWidth/naturalHeight when there's no videoWidth) keeps
       working for every treatment here with no extra code.

   fieldKit(buf) — a second, tiny reimplementation of exactly three of
   halfworld.mjs's makeKit primitives (put/ink/disc, plus a line() built the
   same way makeKit's own is). Not imported, because makeKit is not exported
   (blend.mjs hits the same wall and carries its own Bayer matrix for the
   same reason — see its header). This is bound to a plain Float32Array
   instead of a live runtime buffer, which is what lets tracedFigure call
   figure.mjs's real drawFigure() — the SAME rig every world in the suite
   draws with — and structureLines call a real line-stamper, while every
   export in this file keeps blend.mjs's convention: take fields, return a
   field, never a kit tied to something stateful.

   Read EXPERIMENTS.md and BLEND-NOTES.md before tuning any default below —
   both found real, non-obvious things about THIS footage (the levels/tone
   order bug, the blue-channel bug) that every treatment here inherits by
   sharing readChannel()'s weights with ingest.mjs's own channelValue().
   ========================================================================= */
import { FW, FH, TAU, clamp, clamp01, lerp } from "../halfworld.mjs";
import { bayer, n2 } from "../blend.mjs";
import { drawFigure } from "../figure.mjs";

const CELLS = FW * FH;
const alloc = () => new Float32Array(CELLS);
const idx = (x, y) => y * FW + x;

/* ---------------------------------------------------------------- fieldKit
   See header. Exported because a recipe assembling its own composite (the
   way 01b-out-of-life-blend.html's shell defines figureLockTorn on top of
   blend.mjs without editing it) may want the same three primitives. */
export function fieldKit(buf) {
  const put = (x, y, l) => { x |= 0; y |= 0; if (x >= 0 && x < FW && y >= 0 && y < FH) buf[y * FW + x] = l; };
  const ink = (x, y, l) => { x |= 0; y |= 0; if (x >= 0 && x < FW && y >= 0 && y < FH) { const q = y * FW + x; if (l > buf[q]) buf[q] = l; } };
  const stamp = (x, y, l, set) => (set ? put : ink)(x, y, l);
  const disc = (cx, cy, r, l, set = false) => {
    const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(FW - 1, Math.ceil(cx + r));
    const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(FH - 1, Math.ceil(cy + r));
    const r2 = r * r;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy <= r2) stamp(x, y, l, set);
    }
  };
  const line = (x0, y0, x1, y1, l, th = 1, set = false) => {
    const dx = x1 - x0, dy = y1 - y0;
    const n = Math.max(1, Math.ceil(Math.hypot(dx, dy) * 2));
    for (let k = 0; k <= n; k++) {
      const x = x0 + dx * k / n, y = y0 + dy * k / n;
      if (th <= 1) stamp(Math.round(x), Math.round(y), l, set);
      else disc(x, y, th / 2, l, set);
    }
  };
  return { put, ink, stamp, disc, line };
}

/* grab an ImageData from any canvas — the standard way to get an `img` for
   every SOURCE treatment below (typically `ingest.canvas` right after a
   sample() call — see the header on why that's the one shared read site). */
export function grabImageData(canvas) {
  return canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
}

/* ------------------------------------------------------------- low-level
   readChannel — the same five weights ingest.mjs's private channelValue()
   uses (luma/r/g/b/chroma), restated because that function isn't exported,
   plus `max` (brightest of the three — useful for a mixed-colour glow no
   single channel captures alone). BLEND-NOTES.md's LUMA BUG lives here too:
   this footage is often graded almost entirely into one channel (blue, for
   most of MORE HAZE and half of THE FALL) and luma's 0.7152 green weight
   discounts exactly the channel carrying the shot's real information — try
   `b` before trusting luma on anything that isn't the room shot. */
export function readChannel(img, opts = {}) {
  const { channel = "luma", chromaHue = 165, chromaTol = 55 } = opts;
  const out = new Float32Array(FW * FH);
  const d = img.data;
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
    const q = y * FW + x, p = q * 4;
    const r = d[p] / 255, g = d[p + 1] / 255, b = d[p + 2] / 255;
    let v;
    switch (channel) {
      case "r": v = r; break;
      case "g": v = g; break;
      case "b": v = b; break;
      case "max": v = Math.max(r, g, b); break;
      case "chroma": {
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b), dd = mx - mn;
        let h = 0;
        if (dd > 0) {
          if (mx === r) h = ((g - b) / dd) % 6;
          else if (mx === g) h = (b - r) / dd + 2;
          else h = (r - g) / dd + 4;
          h *= 60; if (h < 0) h += 360;
        }
        const sat = mx === 0 ? 0 : dd / mx;
        let dh = Math.abs(h - chromaHue); if (dh > 180) dh = 360 - dh;
        v = clamp01(1 - dh / Math.max(1, chromaTol)) * sat;
        break;
      }
      default: v = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }
    out[q] = v;
  }
  return out;
}

/* separable box blur — cheap at 192x144 even at radius 4-5. Used to make
   "how big is a real edge" scale-selectable: a 1-cell radius still lets
   graffiti-scale marks vote; a 3-4 cell radius washes them out and leaves
   only edges that span whole regions (a window frame, a wall corner). */
function boxBlur(src, radius) {
  const r = Math.max(0, radius | 0);
  if (r === 0) return src;
  const tmp = new Float32Array(CELLS), out = new Float32Array(CELLS);
  for (let y = 0; y < FH; y++) {
    for (let x = 0; x < FW; x++) {
      let sum = 0, count = 0;
      for (let k = -r; k <= r; k++) { const xx = x + k; if (xx >= 0 && xx < FW) { sum += src[y * FW + xx]; count++; } }
      tmp[y * FW + x] = sum / count;
    }
  }
  for (let x = 0; x < FW; x++) {
    for (let y = 0; y < FH; y++) {
      let sum = 0, count = 0;
      for (let k = -r; k <= r; k++) { const yy = y + k; if (yy >= 0 && yy < FH) { sum += tmp[yy * FW + x]; count++; } }
      out[y * FW + x] = sum / count;
    }
  }
  return out;
}

/* Sobel magnitude + gradient DIRECTION (not just strength) — the direction
   is what lets structureLines guide its Hough vote instead of casting one
   blind in every possible angle. */
function sobel(src) {
  const mag = new Float32Array(CELLS), ang = new Float32Array(CELLS);
  const at = (x, y) => src[clamp(y, 0, FH - 1) * FW + clamp(x, 0, FW - 1)];
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
    const gx = (at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1)) - (at(x - 1, y - 1) + 2 * at(x - 1, y) + at(x - 1, y + 1));
    const gy = (at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1)) - (at(x - 1, y - 1) + 2 * at(x, y - 1) + at(x + 1, y - 1));
    const q = y * FW + x;
    mag[q] = Math.min(1, Math.hypot(gx, gy));
    ang[q] = Math.atan2(gy, gx);
  }
  return { mag, ang };
}

/* ============================================================================
   1 · CONTOUR FILL — the full tonal halfworld: contour plus flat interior
   fill, figure.mjs's OWN technique (contour pass with `ink`, inset fill pass
   with `put`) turned into a whole-frame treatment instead of a body's.

   ingest.mjs's quantize() asks, independently per cell, "which of 8 levels
   does THIS DOT land on" — correct, and it's what makes a wall under
   changing light come out as a fine, photographically-plausible dither
   texture. That is also exactly the tell: a photograph that has been
   halftoned still reads as a halftoned photograph. This asks a different
   question — "which flat REGION is this cell part of" — assigns the whole
   region one level with NO per-cell dither, and inks a hard line only where
   two regions actually meet. That is the difference between a printer's
   output and an illustrator's, and it is entirely a difference in what
   counts as the unit of quantisation (the cell vs. the region), not in the
   dot law itself: both are flat, 8-level, alpha-free. `blur` sets how big a
   mark has to be to count as its own region — under it, the graffiti wall's
   own texture disappears into whatever band its neighbourhood belongs to,
   which is the point (a photograph's texture is not the room's geometry).
   ========================================================================= */
export function contourFill(img, opts = {}) {
  const { channel = "luma", bands = 4, invert = true, contourLevel = 7,
          minLevel = 1, maxLevel = 6, blur = 2 } = opts;
  const raw = readChannel(img, { channel });
  const v = blur > 0 ? boxBlur(raw, blur) : raw;
  const n = Math.max(2, bands | 0);
  const band = new Int16Array(CELLS);
  for (let q = 0; q < CELLS; q++) {
    let t = clamp01(v[q]);
    if (invert) t = 1 - t;
    band[q] = Math.min(n - 1, Math.floor(t * n));
  }
  const out = alloc();
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
    const q = y * FW + x;
    out[q] = Math.round(lerp(minLevel, maxLevel, n <= 1 ? 0 : band[q] / (n - 1)));
  }
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
    const q = y * FW + x, b = band[q];
    if ((x + 1 < FW && band[q + 1] !== b) || (y + 1 < FH && band[q + FW] !== b)) out[q] = contourLevel;
  }
  return out;
}

/* ============================================================================
   2 · STRUCTURE LINES — Hough-ish, guided by gradient orientation. Finds the
   room's own straight edges (the window frame, the wall/ceiling line, the
   fire escape's rails) and REDRAWS them as clean strokes on otherwise blank
   paper, discarding every pixel that isn't part of one. The footage becomes
   a source of GEOMETRY, not of tone — the strongest possible answer to
   "prove this wasn't filmed," because a Hough line has no photographic
   texture left in it to prove it ever was.

   GUIDED, not exhaustive. A textbook Hough transform votes every edge pixel
   into every theta bin and lets the accumulator sort it out — correct, and
   wasteful: a pixel sitting on a vertical edge has no business voting for a
   line at 40°. Each edge pixel here only votes within `thetaSpread` bins of
   the angle its OWN Sobel gradient implies (a line runs perpendicular to
   the gradient at every point on it) — faster, and it keeps a dense patch of
   graffiti's own incoherent gradients from drowning out the room's few long,
   consistent edges with sheer numbers, which an unguided vote count cannot
   tell from a real line.

   `minVoteRatio` is the second half of that same fight: even guided, this
   footage's own texture keeps a long tail of weak, spurious peaks behind
   the real edges rather than going quiet. Stopping once a candidate's vote
   falls under `minVoteRatio` of the STRONGEST one found is what turns
   "twelve lines, half of them noise" into "the four or five the room
   actually has" — down for more lines (closer to a scribble), up for fewer
   (closer to a floor plan).
   ========================================================================= */
export function structureLines(img, opts = {}) {
  const {
    channel = "luma", blur = 2.4, threshold = 0.20, thetaSpread = 4,
    thetaStep = TAU / 180, rhoStep = 2, maxLines = 10, minSeparation = 18,
    minVoteRatio = 0.4, ink = 6, thickness = 1,
  } = opts;
  const lum = boxBlur(readChannel(img, { channel }), blur);
  const { mag, ang } = sobel(lum);

  const diag = Math.hypot(FW, FH);
  const thetaBins = Math.max(8, Math.round(Math.PI / thetaStep));
  const rhoBins = Math.max(8, Math.round((2 * diag) / rhoStep));
  const acc = new Float32Array(thetaBins * rhoBins);

  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
    const q = y * FW + x, m = mag[q];
    if (m < threshold) continue;
    const lineAngle = ang[q] + Math.PI / 2;          // the edge runs perpendicular to the gradient
    for (let s = -thetaSpread; s <= thetaSpread; s++) {
      let theta = lineAngle + s * thetaStep;
      theta = ((theta % Math.PI) + Math.PI) % Math.PI;
      const tb = Math.min(thetaBins - 1, Math.floor((theta / Math.PI) * thetaBins));
      const rho = x * Math.cos(theta) + y * Math.sin(theta);
      const rb = Math.min(rhoBins - 1, Math.max(0, Math.floor((rho + diag) / rhoStep)));
      acc[tb * rhoBins + rb] += m * (1 - Math.abs(s) / (thetaSpread + 1));
    }
  }

  /* greedy peak-pick with non-max suppression in (theta,rho) space — the
     same "pick the strongest, blank its neighbourhood, repeat" shape as any
     top-K selection, just over a 2D accumulator instead of a list. */
  const picked = [];
  let firstVotes = 0;
  for (let iter = 0; iter < maxLines; iter++) {
    let best = -1, bestV = 0;
    for (let i = 0; i < acc.length; i++) if (acc[i] > bestV) { bestV = acc[i]; best = i; }
    if (best < 0 || bestV <= 0) break;
    if (iter === 0) firstVotes = bestV;
    else if (bestV < firstVotes * minVoteRatio) break;   // a REAL edge, not the graffiti wall's noise catching up in a long tail
    const tb = Math.floor(best / rhoBins), rb = best % rhoBins;
    picked.push({ theta: (tb / thetaBins) * Math.PI, rho: rb * rhoStep - diag, votes: bestV });
    for (let dt = -minSeparation; dt <= minSeparation; dt++) for (let dr = -minSeparation; dr <= minSeparation; dr++) {
      const tt = tb + dt, rr = rb + dr;
      if (tt >= 0 && tt < thetaBins && rr >= 0 && rr < rhoBins) acc[tt * rhoBins + rr] = 0;
    }
  }

  const out = alloc();
  const K = fieldKit(out);
  for (const { theta, rho } of picked) {
    const ct = Math.cos(theta), st = Math.sin(theta);
    const px = ct * rho, py = st * rho;              // point on the line nearest the origin (Hesse normal form)
    const dx = -st, dy = ct;                          // direction along the line
    const big = diag * 1.3;
    K.line(px - dx * big, py - dy * big, px + dx * big, py + dy * big, ink, thickness);
  }
  return { field: out, edge: mag, lines: picked };
}

/* ============================================================================
   3 · FIGURE SILHOUETTE — this clip is backlit almost everywhere it has a
   figure in it (a window, an overcast sky, a field of sparks), which means
   the poet is very often the single largest coherent dark mass in the
   frame — an unusually clean silhouette to pull, easier than most footage
   would give up. Threshold, keep the largest 4-connected component (an
   iterative flood fill — 27,648 cells can exceed a real call stack, so this
   is NOT the recursive version), report it as a flat filled shape, and hand
   back its image moments (centroid + major-axis angle) for `tracedFigure`.
   `key:"bright"` inverts the test, for a shot where the figure is the LIT
   mass instead (the ember, the sparks around him in THE FALL).
   ========================================================================= */
export function figureSilhouette(img, opts = {}) {
  const { channel = "luma", key = "dark", threshold = 0.32, minArea = 40,
          level = 7, erode = 1 } = opts;
  const v = readChannel(img, { channel });
  const isFg = new Uint8Array(CELLS);
  for (let q = 0; q < CELLS; q++) isFg[q] = (key === "dark" ? v[q] < threshold : v[q] > threshold) ? 1 : 0;

  const label = new Int32Array(CELLS).fill(-1);
  const stack = [];
  let bestLabel = -1, bestArea = 0, nextLabel = 0;
  for (let start = 0; start < CELLS; start++) {
    if (!isFg[start] || label[start] !== -1) continue;
    let area = 0;
    stack.push(start); label[start] = nextLabel;
    while (stack.length) {
      const q = stack.pop(); area++;
      const x = q % FW, y = (q / FW) | 0;
      if (x > 0 && isFg[q - 1] && label[q - 1] === -1) { label[q - 1] = nextLabel; stack.push(q - 1); }
      if (x < FW - 1 && isFg[q + 1] && label[q + 1] === -1) { label[q + 1] = nextLabel; stack.push(q + 1); }
      if (y > 0 && isFg[q - FW] && label[q - FW] === -1) { label[q - FW] = nextLabel; stack.push(q - FW); }
      if (y < FH - 1 && isFg[q + FW] && label[q + FW] === -1) { label[q + FW] = nextLabel; stack.push(q + FW); }
    }
    if (area > bestArea) { bestArea = area; bestLabel = nextLabel; }
    nextLabel++;
  }

  let mask = new Uint8Array(CELLS);
  let sx = 0, sy = 0, n = 0, x0 = FW, x1 = 0, y0 = FH, y1 = 0;
  if (bestArea >= minArea) {
    for (let q = 0; q < CELLS; q++) if (label[q] === bestLabel) {
      mask[q] = 1;
      const x = q % FW, y = (q / FW) | 0;
      sx += x; sy += y; n++;
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  let cx = n ? sx / n : FW / 2, cy = n ? sy / n : FH / 2, angle = Math.PI / 2;
  if (n > 4) {
    let mu20 = 0, mu02 = 0, mu11 = 0;
    for (let q = 0; q < CELLS; q++) if (mask[q]) {
      const x = q % FW, y = (q / FW) | 0, dx = x - cx, dy = y - cy;
      mu20 += dx * dx; mu02 += dy * dy; mu11 += dx * dy;
    }
    mu20 /= n; mu02 /= n; mu11 /= n;
    angle = 0.5 * Math.atan2(2 * mu11, mu20 - mu02);
    if (angle < 0) angle += Math.PI;                 // fold to 0..π — a major AXIS has no head or tail
  }

  /* erode: drop any mask cell touching background — clears single-cell
     noise off the silhouette's own edge without a gradient to do it with */
  for (let e = 0; e < Math.max(0, erode | 0); e++) {
    const m2 = new Uint8Array(CELLS);
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
      const q = y * FW + x;
      if (!mask[q]) continue;
      const solid = (x === 0 || mask[q - 1]) && (x === FW - 1 || mask[q + 1])
                 && (y === 0 || mask[q - FW]) && (y === FH - 1 || mask[q + FW]);
      m2[q] = solid ? 1 : 0;
    }
    mask = m2;
  }

  const field = alloc();
  for (let q = 0; q < CELLS; q++) if (mask[q]) field[q] = level;
  return {
    field, mask, area: n,
    bbox: { x0, y0, x1, y1, w: n ? x1 - x0 + 1 : 0, h: n ? y1 - y0 + 1 : 0 },
    centroid: { x: cx, y: cy }, angle,
  };
}

/* ============================================================================
   4 · TRACED FIGURE — hands the silhouette from (3) to the DRAWN world: not
   the mask itself but a POSE read off it, performed by figure.mjs's real
   `drawFigure` — the exact volumetric rig every world in the suite draws
   its bodies with. x/y/h come straight from the mask's own bounding box
   (feet = the bbox's bottom edge); `rot` is the mask's major-axis angle,
   offset from vertical and clamped inside figure.mjs's own house rule
   (|rot| < ~1.6, see WORLD-BRIEF.md's POSE section). This is a PROXY for a
   pose, not a measurement of one — a blob has no skeleton in it — and it is
   named honestly rather than oversold: it reads as "a body leaning" when
   the silhouette genuinely leans, and as a little upright noise when it
   doesn't, which is a fair trade for getting a pose at all from a shape
   with no joints.
   ========================================================================= */
export function tracedFigure(sil, opts = {}) {
  const { guise = "poet", level = 7, arms = "down", face = 1,
          minH = 10, rotGain = 1, rotMax = 1.3 } = opts;
  const out = alloc();
  if (!sil || !sil.bbox || sil.bbox.h < minH) return out;
  const K = fieldKit(out);
  const h = sil.bbox.h;
  const x = sil.centroid.x;
  const y = sil.bbox.y1;
  const rot = clamp((sil.angle - Math.PI / 2) * rotGain, -rotMax, rotMax);
  const crouch = clamp01((sil.bbox.w / Math.max(1, h) - 0.32) * 1.4);
  drawFigure(K, x, y, h, {
    mode: "stand", face, arms, rot, crouch, guise,
    phase: (x / FW) * 1.7 + 0.3,           // never 0 — a held figure still needs a clock (WORLD-BRIEF.md)
  }, level);
  return out;
}

/* ============================================================================
   5 · PAPER FIGURE — the reverse of (3): the silhouette is cut OUT of an
   inked field rather than filled with one. README names this the best
   single frame in the whole suite when 14 does it — "a figure cut out of
   the ink — paper as the subject" — and this is the same move, pulled from
   a real silhouette instead of a parametric one. Everything outside the
   mask is flooded to at least `floodLevel` (or, given a `base` field,
   whichever is darker of `base` and `floodLevel` — so a drawn scene's own
   darker marks still show through the flood); the mask itself is reserved
   straight to paper.
   ========================================================================= */
export function paperFigure(img, opts = {}) {
  const { floodLevel = 7, base = null, ...silOpts } = opts;
  const sil = figureSilhouette(img, silOpts);
  const out = alloc();
  for (let q = 0; q < CELLS; q++) out[q] = sil.mask[q] ? 0 : (base ? Math.max(base[q], floodLevel) : floodLevel);
  return { field: out, sil };
}

/* ============================================================================
   6 · MOTION INK — "difference two frames and ink only what moved." Pure in
   its two GIVEN fields: the caller samples ingest at t and at t-dt (two
   ordinary sample() calls, nothing hidden) and hands both here. Nothing is
   read from a clock and nothing is kept between calls, so the same pair of
   fields always makes the same picture — pure time, applied to a pair
   instead of a single instant.
   ========================================================================= */
export function motionInk(fieldNow, fieldPrev, opts = {}) {
  const { threshold = 1.4, level = 6, keepTone = false, floor = 0 } = opts;
  const out = alloc();
  for (let q = 0; q < CELLS; q++) {
    const d = Math.abs(fieldNow[q] - fieldPrev[q]);
    out[q] = d >= threshold ? (keepTone ? fieldNow[q] : level) : floor;
  }
  return out;
}

/* ============================================================================
   7 · HELD MEMORY — "hold a frame and let the drawing move over it." The
   room stops being sampled: `heldField` is ONE fixed ink field the caller
   sampled once and keeps reusing, while `liveField` (a world's own drawing,
   or a traced figure) keeps moving through it. Wherever `liveField` has ink
   at or above `threshold` that dot is always `liveField` — figureLock's own
   rule, restated here because this composes a THIRD ingredient figureLock
   alone doesn't have: `holdU`, normalised 0..1, how long the frame has been
   held — a NUMBER THE CALLER COMPUTES AND PASSES IN, never a timer this
   function reads itself, so two calls with the same holdU always corrode
   the same cells the same way. The corrosion reads as a photograph fading
   in the light, not as noise: a hash-selected fraction of the cells the
   live figure doesn't own creep toward `driftLevel` as holdU rises.
   ========================================================================= */
export function heldMemory(heldField, liveField, holdU, opts = {}) {
  const { threshold = 3.5, corrode = 0.6, seed = 7, driftLevel = 7, grain = 0.85 } = opts;
  const out = alloc();
  const u = clamp01(holdU);
  for (let q = 0; q < CELLS; q++) {
    const lv = liveField[q];
    if (lv >= threshold) { out[q] = lv; continue; }
    const x = q % FW, y = (q / FW) | 0;
    /* two octaves at a near-cell-scale frequency — a single low-frequency n2
       read corrodes in smooth blobs (camouflage, not decay); this one and a
       finer companion sample summed read as grain instead, the way a print
       actually goes speckled before it goes solid. */
    const speck = (n2(x * grain, y * grain, seed) * 0.6 + n2(x * grain * 2.3, y * grain * 2.3, seed + 1) * 0.4);
    out[q] = speck < u * corrode ? driftLevel : heldField[q];
  }
  return out;
}

/* ============================================================================
   8 · REGISTRATION — placing the same window in the same place.

   01-out-of-life.mjs draws its window at a FIXED screen position
   (`windowAt`, called with wx≈150–176 across the film — see
   worlds/01-out-of-life.mjs, which this suite does not edit) and the
   footage's own window cannot be made to land exactly there by panning and
   zooming — it would need a crop WIDER than the source frame actually is.
   Worked through in full in NOTES.md; the short version: the window occupies
   about 30% of the SOURCE frame's own width, and reaching the drawn box's
   position (82–96% across a 192-cell field) would need a crop wide enough
   to still contain the window while shrinking it to 14% of that crop's
   width — more horizontal source than 1280px holds. So this is REGION
   registration, not pixel registration: the calibration below gets the
   footage's window into the same THIRD of the frame the drawn one lives in
   (right of centre), which is as far as a simple crop can honestly reach —
   and `windowPortal`/`paintedWindow`/`windowLock` all take a `rect`
   argument rather than assuming one, so a recipe can use whichever box
   actually matches the shot it's pointed at, drawn or filmed.
   ========================================================================= */
export const REGISTRATION = {
  search: {
    note: "the room shot (THE SEARCH, clip ~11-28s). `rect` IS windowAt(F,158,FLOOR)'s own box — a portal treatment cuts by the DRAWN window's coordinates, not a separately-guessed one, so its mullions (drawn at levels 5-6) land exactly on the portal's own border and stay locked by windowLock's frameThreshold. `ingest` is the closest a simple crop/zoom gets the FOOTAGE's own window into that same neighbourhood of the frame — see the header comment above for why 'closest' tops out well short of 'exact.'",
    ingest: { fit: "cover", zoom: 1.0, panX: 0.78, panY: 0.3, white: 0.5 },
    rect: { x: 150, y: 40, w: 30, h: 44 },
  },
};

function windowOf(a, b, rect, opts = {}) {
  const { frameLevel = null, frameWidth = 1 } = opts;
  const out = alloc();
  out.set(a);
  const x0 = Math.max(0, Math.round(rect.x)), y0 = Math.max(0, Math.round(rect.y));
  const x1 = Math.min(FW, Math.round(rect.x + rect.w)), y1 = Math.min(FH, Math.round(rect.y + rect.h));
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) out[y * FW + x] = b[y * FW + x];
  if (frameLevel != null) {
    for (let x = x0; x < x1; x++) for (let t = 0; t < frameWidth; t++) { out[idx(x, clamp(y0 + t, 0, FH - 1))] = frameLevel; out[idx(x, clamp(y1 - 1 - t, 0, FH - 1))] = frameLevel; }
    for (let y = y0; y < y1; y++) for (let t = 0; t < frameWidth; t++) { out[idx(clamp(x0 + t, 0, FW - 1), y)] = frameLevel; out[idx(clamp(x1 - 1 - t, 0, FW - 1), y)] = frameLevel; }
  }
  return out;
}
/* the drawn room, with a live SCREEN let into it — real footage found
   inside the drawn world, literally. */
export function windowPortal(drawnField, footageField, rect, opts = {}) {
  return windowOf(drawnField, footageField, rect, opts);
}
/* the inverse: the filmed room, with a drawn VISION let into it. */
export function paintedWindow(footageField, drawnField, rect, opts = {}) {
  return windowOf(footageField, drawnField, rect, opts);
}
/* the window's own FRAME — wherever the drawn field already inks a border
   around `rect` above `frameThreshold` — never dissolves; what's seen
   THROUGH the glass crossfades on the ordinary Bayer schedule underneath
   it. "The same window in the same place" even while what fills it turns
   from footage to drawing. */
export function windowLock(footageField, drawnField, t, rect, opts = {}) {
  const { frameThreshold = 4.5 } = opts;
  const out = alloc();
  out.set(drawnField);            // the room, undisturbed, EVERYWHERE by default — only the glass moves
  const x0 = Math.max(0, Math.round(rect.x)), y0 = Math.max(0, Math.round(rect.y));
  const x1 = Math.min(FW, Math.round(rect.x + rect.w)), y1 = Math.min(FH, Math.round(rect.y + rect.h));
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const q = y * FW + x;
    if (drawnField[q] >= frameThreshold) continue;     // a mullion crossing the glass — locked, like the wall around it
    out[q] = bayer(x, y) < t ? drawnField[q] : footageField[q];
  }
  return out;
}

/* ============================================================================
   9 · CRUSH — the reverse direction: give the drawn world the footage's own
   darkness. Footage that has gone through ingest's narrow levels window
   already skews toward the dark end (see EXPERIMENTS.md's CREAM/NIGHT
   registers); a COMPUTED field never does, because nothing forces it to — a
   world module hands out its 8 levels however the poem wants them, evenly
   if nobody chose otherwise. This is a per-LEVEL lookup, still 8 flat values
   in and 8 flat values out, that pushes a drawing's own mid-tones toward
   its extremes so a computed room reads as underexposed the way the real
   one is.
   ========================================================================= */
const CRUSH_CURVES = {
  soft: [0, 0, 1, 2, 4, 6, 7, 7],
  hard: [0, 0, 0, 1, 6, 7, 7, 7],
};
export function crushReverse(field, opts = {}) {
  const { curve = "soft" } = opts;
  const lut = Array.isArray(curve) ? curve : (CRUSH_CURVES[curve] || CRUSH_CURVES.soft);
  const out = alloc();
  for (let q = 0; q < CELLS; q++) out[q] = lut[clamp(Math.round(field[q]), 0, 7)];
  return out;
}

/* ============================================================================
   10 · GRAIN — the engine's own halftone always tears along the same 8x8
   Bayer tile, exactly regular; a lens and a sensor are not (EXPERIMENTS.md
   tried Floyd-Steinberg for this and rejected it — diffuse dither doesn't
   obey the schedule a dissolve is keyed to, which tears against a different
   grain and reads as a seam. This does the same job WITHOUT leaving the
   schedule: only cells already sitting on a level BOUNDARY are eligible,
   and each is reassigned to its neighbour's level with probability `amount`
   by a hash of its own coordinates — deterministic, so the same field and
   seed always grain the same way, and every flat interior cell (most of any
   frame) is untouched.
   ========================================================================= */
export function grainReverse(field, opts = {}) {
  const { amount = 0.35, seed = 3 } = opts;
  const out = alloc();
  out.set(field);
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
    const q = y * FW + x, lv = field[q];
    let nb = -1;
    if (x + 1 < FW && field[q + 1] !== lv) nb = field[q + 1];
    else if (y + 1 < FH && field[q + FW] !== lv) nb = field[q + FW];
    else if (x > 0 && field[q - 1] !== lv) nb = field[q - 1];
    else if (y > 0 && field[q - FW] !== lv) nb = field[q - FW];
    if (nb < 0) continue;
    if (n2(x * 0.6, y * 0.6, seed) < amount) out[q] = nb;
  }
  return out;
}

/* ============================================================================
   11 · VIGNETTE — footage shot on a real lens loses light toward the
   corners (visible in nearly every still this suite pulled — see
   NOTES.md); a computed field is lit perfectly evenly because nothing in it
   draws light falloff at all. Adds density outward from centre exactly the
   way ingest.mjs's OWN tone curve adds density: a continuous 0..1 amount,
   resolved through the Bayer schedule rather than a smooth per-cell
   darken — so the vignette is itself made of flat dots at the right
   density, the dot law's usual trick for drawing something that LOOKS like
   a gradient without ever storing one.
   ========================================================================= */
export function vignetteReverse(field, opts = {}) {
  const { amount = 0.5, radius = 0.72, level = 7 } = opts;
  const out = alloc();
  const cx = FW / 2, cy = FH / 2, maxR = Math.hypot(cx, cy);
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
    const q = y * FW + x;
    const r = Math.hypot(x - cx, y - cy) / maxR;
    const fall = clamp01((r - radius) / (1 - radius || 1e-6)) * amount;
    out[q] = fall > 0 && bayer(x, y) < fall ? Math.max(field[q], level) : field[q];
  }
  return out;
}

/* ============================================================================
   12/13 · KALEIDO FIELD + RESONANT KALEIDO. ingest.mjs's own kaleido folds
   ONE sample at a fixed slice count; this samples the source directly so
   TWO different fold factors can exist as two independent fields in the
   same frame. Small, deliberate duplication of ingest's own fold math (see
   its `foldKaleido`) — there is no way to ask one sample() call for two
   kaleido variants at once, and every dissolve in this suite is supposed to
   share the Bayer schedule and noise field from blend.mjs regardless, which
   this does (`bayer` for quantising, imported, not re-derived).

   resonantKaleido applies the SAME per-dot allegiance law every dissolve in
   this suite obeys — to a FOLD COUNT instead of a substance. Half the frame
   reads as a `slicesA`-fold mandala and half as `slicesB`-fold at t=0.5,
   torn along the identical ordered grain a swap() between two SOURCES would
   use. The mandala breathes without ever cross-fading.
   ========================================================================= */
function foldRadial(x, y, slices) {
  const cx = FW / 2, cy = FH / 2, dx = x - cx, dy = y - cy;
  const r = Math.hypot(dx, dy);
  const seg = TAU / Math.max(2, slices);
  let a = ((Math.atan2(dy, dx) % seg) + seg) % seg;
  if (a > seg / 2) a = seg - a;
  return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
}
export function kaleidoField(img, opts = {}) {
  const { channel = "luma", slices = 6, black = 0, white = 0.5, invert = true } = opts;
  const v = readChannel(img, { channel });
  const out = alloc();
  const span = (white - black) || 1e-6;
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
    const [sx, sy] = foldRadial(x, y, slices);
    const ix = clamp(Math.round(sx), 0, FW - 1), iy = clamp(Math.round(sy), 0, FH - 1);
    let t = clamp01((v[iy * FW + ix] - black) / span);
    if (invert) t = 1 - t;
    const tq = t * 7, base = Math.floor(tq), frac = tq - base;
    out[y * FW + x] = clamp(bayer(x, y) < frac ? base + 1 : base, 0, 7);
  }
  return out;
}
export function resonantKaleido(img, t, opts = {}) {
  const { slicesA = 6, slicesB = 10, ...rest } = opts;
  const a = kaleidoField(img, { ...rest, slices: slicesA });
  const b = kaleidoField(img, { ...rest, slices: slicesB });
  const out = alloc();
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
    const q = y * FW + x;
    out[q] = bayer(x, y) < t ? b[q] : a[q];
  }
  return out;
}

/* ============================================================================
   14 · BY STRUCTURE — blend.mjs's byLevel keys allegiance to how DARK a dot
   already is; this keys it to how STRUCTURAL it is, using `edgeField` — the
   continuous Sobel magnitude structureLines already computes as a side
   product of finding its lines, so this is meant to be run on the `edge`
   half of that function's return, not a separate pass. reverse=false: the
   room's own architecture (the window frame, the wall corner) converts
   FIRST and the soft haze converts last — the bones change before the air
   does. reverse=true is the opposite: the air goes first and the
   architecture is the last thing standing, which is closer to what MORE
   HAZE's own text asks for ("my vision blurs" — the soft things go first,
   the room's hard edges are what's left when the swap is nearly done).
   ========================================================================= */
export function byStructure(a, b, t, edgeField, opts = {}) {
  const { reverse = false, mix = 0.75 } = opts;
  const out = alloc();
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
    const q = y * FW + x;
    let e = clamp01(edgeField[q]);
    if (reverse) e = 1 - e;
    const key = (1 - e) * mix + bayer(x, y) * (1 - mix);
    out[q] = key < t ? b[q] : a[q];
  }
  return out;
}

/* ============================================================================
   15 · LONG EXPOSURE — average several already-sampled fields (the caller
   takes N samples at different currentTime values; this never seeks
   anything itself, so it stays pure in exactly the fields it's handed) and
   requantise the mean on the ordered schedule. Smoke and haze are what this
   is for: one sample freezes a single turbulent instant of something that
   isn't supposed to have an instant; the mean of several looks closer to
   what standing in the room and watching it would leave you with —
   integrated, not frozen.
   ========================================================================= */
export function longExposure(fields, opts = {}) {
  const out = alloc();
  const n = fields.length || 1;
  for (let q = 0; q < CELLS; q++) {
    let sum = 0;
    for (const f of fields) sum += f[q];
    const mean = sum / n;
    const x = q % FW, y = (q / FW) | 0;
    const base = Math.floor(mean), frac = mean - base;
    out[q] = clamp(bayer(x, y) < frac ? base + 1 : base, 0, 7);
  }
  return out;
}
