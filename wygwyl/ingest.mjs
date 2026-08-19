/* ============================================================================
   INGEST — footage entering the dot law.

   A halfworld has eight ink levels, drawn flat, one halftone pass, no alpha.
   Footage cannot sit on top of that as a filtered video layer — it has to
   become the same substance as everything else the engine draws: sampled
   down to the 192x144 ink field, read through one channel, pushed through one
   tone curve, and quantised to eight levels by one of the world's own kinds
   of dither. Once it has done that, blend.mjs cannot tell a frame of footage
   from a frame of drawing, which is the whole point — a transition between
   them is then just two ink fields swapping dots, not a video composited over
   a canvas.

   makeIngest(videoEl) -> { sample(F, opts), canvas }

   sample(F, opts) draws the video's CURRENT frame (videoEl.currentTime, set
   by the caller) into an offscreen 192x144 canvas and writes ink levels 0..7
   into F, a Float32Array of length FW*FH — the same shape halfworld.mjs's
   renderField() returns and blend.mjs's functions consume, so a sampled
   field can be handed straight to a blend or straight to makePost's draw().

   PURITY: sample() keeps no state between calls. Every treatment below is
   computed fresh from the pixels currently on the video element and the opts
   object passed this call — same currentTime + same opts always produces the
   same field, which is what lets a live fader and a scripted film module
   agree on what a given setting looks like. The only impurity is the one the
   brief allows: reading whatever frame the <video> element is currently
   showing, which is the caller's responsibility to seek.
   ========================================================================= */
import { FW, FH, TAU, clamp, clamp01, lerp } from "./halfworld.mjs";
import { bayer, n2 } from "./blend.mjs";

const CELLS = FW * FH;

/* full default treatment: a straight inverted luma read, opened up a little
   for a dim shot, ordered-dithered on the world's own schedule. This alone
   is enough to put the footage "in the lattice" — everything below it is
   creative range on top of that baseline. */
export const DEFAULTS = {
  channel: "luma",        // luma | r | g | b | chroma
  chromaHue: 165,          // degrees; 165 sits between green(120) and cyan(180) — this footage's streetlights
  chromaTol: 55,           // degrees either side counted as a match
  black: 0.02, white: 0.85,// levels: black/white point, 0..1, before the tone curve
  tone: "invert",          // linear | gamma | posterise | solarise | invert
  gamma: 1.0,
  posterise: 4,             // steps, when tone === "posterise"
  solarise: 0.5,            // threshold, when tone === "solarise"
  edge: 0,                  // 0..1 — mix of a Sobel contour read into the value
  dither: "bayer",          // none | bayer | diffuse
  kaleido: "none",          // none | x | y | quad | radial
  radialSlices: 6,
  warp: 0,                  // 0..1 — displacement amount
  warpScale: 0.06,          // spatial frequency of the warp noise
  fit: "cover",              // cover | contain
  zoom: 1, panX: 0.5, panY: 0.5,
};

export function makeIngest(videoEl) {
  const cv = document.createElement("canvas");
  cv.width = FW; cv.height = FH;
  const ctx = cv.getContext("2d", { willReadFrequently: true });

  /* scratch buffers, reallocated only once — sample() writes fresh values
     into them every call, so reuse does not leak state between calls. */
  const chGrid = new Float32Array(CELLS);      // channel-selected value, 0..1
  const lumaGrid = new Float32Array(CELLS);    // luminance, for the edge read
  const edgeGrid = new Float32Array(CELLS);    // Sobel magnitude, 0..1
  const valGrid = new Float32Array(CELLS);     // post levels/tone value, 0..1

  function drawFrame(opts) {
    const vw = videoEl.videoWidth || 1280, vh = videoEl.videoHeight || 720;
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, FW, FH);
    const zoom = Math.max(0.05, opts.zoom ?? 1);
    const panX = clamp01(opts.panX ?? 0.5), panY = clamp01(opts.panY ?? 0.5);
    const targetAR = FW / FH, srcAR = vw / vh;
    let sw, sh;
    if ((opts.fit || "cover") === "cover") {
      if (srcAR > targetAR) { sh = vh / zoom; sw = sh * targetAR; }
      else { sw = vw / zoom; sh = sw / targetAR; }
      sw = Math.min(sw, vw); sh = Math.min(sh, vh);
      const sx = clamp(panX * (vw - sw), 0, Math.max(0, vw - sw));
      const sy = clamp(panY * (vh - sh), 0, Math.max(0, vh - sh));
      if (vw > 0 && vh > 0) ctx.drawImage(videoEl, sx, sy, sw, sh, 0, 0, FW, FH);
    } else {
      /* contain: the whole frame is visible, letterboxed to paper black */
      if (srcAR > targetAR) { sw = FW * zoom; sh = sw / srcAR; }
      else { sh = FH * zoom; sw = sh * srcAR; }
      const dx = (FW - sw) * panX, dy = (FH - sh) * panY;
      if (vw > 0 && vh > 0) ctx.drawImage(videoEl, 0, 0, vw, vh, dx, dy, sw, sh);
    }
  }

  function channelValue(r, g, b, opts) {
    switch (opts.channel) {
      case "r": return r;
      case "g": return g;
      case "b": return b;
      case "chroma": {
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
        let h = 0;
        if (d > 0) {
          if (mx === r) h = ((g - b) / d) % 6;
          else if (mx === g) h = (b - r) / d + 2;
          else h = (r - g) / d + 4;
          h *= 60; if (h < 0) h += 360;
        }
        const sat = mx === 0 ? 0 : d / mx;
        const target = opts.chromaHue ?? 165, tol = Math.max(1, opts.chromaTol ?? 55);
        let dh = Math.abs(h - target); if (dh > 180) dh = 360 - dh;
        return clamp01(1 - dh / tol) * sat;      // hue match, weighted by how saturated the pixel is
      }
      case "luma":
      default: return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }
  }

  function applyTone(v, opts) {
    v = clamp01(v);
    switch (opts.tone) {
      case "gamma": return Math.pow(v, Math.max(0.05, opts.gamma ?? 1));
      case "posterise": {
        const s = Math.max(2, Math.round(opts.posterise ?? 4));
        return Math.min(s - 1, Math.floor(v * s)) / (s - 1);
      }
      case "solarise": { const th = opts.solarise ?? 0.5; return v < th ? v : 1 - v; }
      case "invert": return 1 - v;
      case "linear":
      default: return v;
    }
  }

  function foldKaleido(x, y, opts) {
    const mode = opts.kaleido;
    if (!mode || mode === "none") return [x, y];
    if (mode === "x") return [x >= FW / 2 ? FW - 1 - x : x, y];
    if (mode === "y") return [x, y >= FH / 2 ? FH - 1 - y : y];
    if (mode === "quad") return [x >= FW / 2 ? FW - 1 - x : x, y >= FH / 2 ? FH - 1 - y : y];
    if (mode === "radial") {
      const cx = FW / 2, cy = FH / 2, dx = x - cx, dy = y - cy;
      const r = Math.hypot(dx, dy);
      const n = Math.max(2, Math.round(opts.radialSlices ?? 6));
      const seg = TAU / n;
      let a = ((Math.atan2(dy, dx) % seg) + seg) % seg;
      if (a > seg / 2) a = seg - a;               // mirror within the slice — a rose window, not a pinwheel
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    }
    return [x, y];
  }

  function warpOffset(x, y, opts) {
    if (!opts.warp) return [0, 0];
    const scale = opts.warpScale ?? 0.06, amp = clamp01(opts.warp) * 16;   // cells
    const dx = (n2(x * scale, y * scale, 11) - 0.5) * 2 * amp;
    const dy = (n2(x * scale + 50, y * scale + 50, 17) - 0.5) * 2 * amp;
    return [dx, dy];
  }

  function quantize(opts, out) {
    const black = opts.black ?? 0, white = opts.white ?? 1, span = (white - black) || 1e-6;
    if (opts.dither === "diffuse") {
      /* Floyd-Steinberg over a scratch copy scaled to 0..7 — the error only
         ever propagates within this one call, never across frames, so this
         stays pure: same inputs, same tear pattern, every time. */
      const work = new Float32Array(CELLS);
      for (let q = 0; q < CELLS; q++) work[q] = clamp01((valGrid[q] - black) / span) * 7;
      for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
        const q = y * FW + x, v = work[q];
        const lvl = clamp(Math.round(v), 0, 7);
        out[q] = lvl;
        const err = v - lvl;
        if (x + 1 < FW) work[q + 1] += err * 7 / 16;
        if (y + 1 < FH) {
          if (x > 0) work[q + FW - 1] += err * 3 / 16;
          work[q + FW] += err * 5 / 16;
          if (x + 1 < FW) work[q + FW + 1] += err * 1 / 16;
        }
      }
      return;
    }
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
      const q = y * FW + x;
      const t = clamp01((valGrid[q] - black) / span) * 7;
      const base = Math.floor(t), frac = t - base;
      let lvl;
      if (opts.dither === "bayer") lvl = frac > bayer(x, y) ? base + 1 : base;
      else lvl = Math.round(t);
      out[q] = clamp(lvl, 0, 7);
    }
  }

  return {
    canvas: cv,
    sample(F, rawOpts = {}) {
      const opts = { ...DEFAULTS, ...rawOpts };
      drawFrame(opts);
      const img = ctx.getImageData(0, 0, FW, FH).data;

      const needEdge = (opts.edge ?? 0) > 0;
      for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
        const q = y * FW + x, p = q * 4;
        const r = img[p] / 255, g = img[p + 1] / 255, b = img[p + 2] / 255;
        chGrid[q] = channelValue(r, g, b, opts);
        if (needEdge) lumaGrid[q] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      }
      if (needEdge) {
        const at = (x, y) => lumaGrid[clamp(y, 0, FH - 1) * FW + clamp(x, 0, FW - 1)];
        for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
          const gx = (at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1))
                   - (at(x - 1, y - 1) + 2 * at(x - 1, y) + at(x - 1, y + 1));
          const gy = (at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1))
                   - (at(x - 1, y - 1) + 2 * at(x, y - 1) + at(x + 1, y - 1));
          edgeGrid[y * FW + x] = Math.min(1, Math.hypot(gx, gy));
        }
      }

      /* the value grid is built in OUTPUT space (x,y) — warp and kaleido only
         change which SOURCE cell is read, never where the result lands, so
         the halftone dot lattice stays fixed to the screen even while the
         picture under it warps or folds. */
      for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
        const [wx, wy] = warpOffset(x, y, opts);
        const [kx, ky] = foldKaleido(x + wx, y + wy, opts);
        const ix = clamp(Math.round(kx), 0, FW - 1), iy = clamp(Math.round(ky), 0, FH - 1);
        const sq = iy * FW + ix;
        let v = chGrid[sq];
        if (needEdge) v = lerp(v, edgeGrid[sq], clamp01(opts.edge));
        valGrid[y * FW + x] = applyTone(v, opts);
      }

      quantize(opts, F);
      return F;
    },
  };
}
