/* ============================================================================
   paint.mjs — ONE PAINTER FOR EVERY SURFACE IN THE BROWSER.

   `screen.mjs` prints PNGs and therefore imports zlib and fs, which no page can
   load. This is the same printer with the file-writing removed: the same ramp,
   the same 8x8 ordered Bayer, the same duotone range, the same rule that the
   dot's contrast closes at both ends so solids stay solid and only the
   midtones are made of dots.

   It exists so that a film, a hand-drawn field, and a picture recovered from
   the audio are painted by identical arithmetic. If the three were painted by
   three functions they would drift, and then a comparison between them would
   be measuring the painters instead of the pictures.

   The caller hands over DISPLAY values, 0..1, already in print polarity —
   1 is paper, 0 is full ink. Deciding what ink means is the caller's business;
   this only knows how to put it on the page.
   ========================================================================= */
import { pal, BAYER8, RANGE } from "./ramp.mjs";

const LUT = new Uint8ClampedArray(256 * 3);
for (let i = 0; i < 256; i++) {
  const c = pal(i / 255);
  LUT[i * 3] = c[0]; LUT[i * 3 + 1] = c[1]; LUT[i * 3 + 2] = c[2];
}
const THR = new Float32Array(64);
for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) THR[y * 8 + x] = (BAYER8[y][x] + 0.5) / 64;

export { RANGE };

/* Build a painter bound to one canvas. Returns paint(field, headCol), where
   `field` is w*h display values and `headCol` is the column being listened to
   (-1 for none) — drawn as a hot line with dark shoulders rather than as
   something added, because half these pictures are pale fields and the other
   half are dark ones and anything additive disappears into one of them. */
export function makePainter(canvas, w, h, cell = 5) {
  canvas.width = w * cell; canvas.height = h * cell;
  const W = canvas.width, H = canvas.height;
  const cx = canvas.getContext("2d", { alpha: false });
  const img = cx.createImageData(W, H), PX = img.data;
  for (let i = 3; i < PX.length; i += 4) PX[i] = 255;
  return function paint(field, headCol = -1) {
    for (let y = 0; y < H; y++) {
      const row = ((y / cell) | 0) * w, orow = y * W, t8 = (y & 7) * 8;
      for (let x = 0; x < W; x++) {
        const c = (x / cell) | 0;
        let v = field[row + c];
        v = v < 0 ? 0 : v > 1 ? 1 : v;
        if (headCol >= 0) {
          const d = c - headCol;
          if (d === 0) v = 0.99; else if (d === -1 || d === 1) v = 0.02;
        }
        /* no dots in the solids, no dots in the paper — all of them in between */
        const amp = 0.17 * 4 * v * (1 - v);
        const s = THR[t8 + (x & 7)] < v ? v + amp : v - amp;
        const q = ((s < 0 ? 0 : s > 1 ? 1 : s) * 255) | 0, o = (orow + x) * 4, p = q * 3;
        PX[o] = LUT[p]; PX[o + 1] = LUT[p + 1]; PX[o + 2] = LUT[p + 2];
      }
    }
    cx.putImageData(img, 0, 0);
  };
}

/* the two mappings every surface here needs, kept in one place so a film and a
   hand and a spectrum cannot disagree about what level 4 looks like */
export const inkToDisplay = (v) =>
  v > 8.5 ? 0.97 : RANGE[0] + (1 - Math.min(7, Math.round(v)) / 7) * (RANGE[1] - RANGE[0]);
export const energyToDisplay = (e) =>
  RANGE[0] + (1 - (e < 0 ? 0 : e > 1 ? 1 : e)) * (RANGE[1] - RANGE[0]);
