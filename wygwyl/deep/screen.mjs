/* ============================================================================
   screen.mjs — ONE LOOK FOR THE PICTURE AND THE SOUND.

   A beflix frame and a spectrogram are the same object: a field of magnitudes
   on a grid. They have never looked alike because they are printed by
   different machines — one by an ordered halftone onto paper, the other by
   ffmpeg's colormap onto black. This is the single printer both go through, so
   that watching the film and looking at its sound are the same act.

   THE PALETTE is the spectrogram's, because that is the one that has to be
   borrowed: a picture can be printed in any colours and a spectrogram is
   already read in these. Black through purple through red and orange to a
   white-yellow — it is the ramp the eye already knows means MORE.

   THE SCREEN is the film's, because that is the one that has to be borrowed
   back: an 8x8 ordered Bayer threshold, the same schedule every dissolve in
   the suite runs on. It is applied in OUTPUT pixels rather than in cells, so
   the dot grid is continuous across the whole print and does not announce
   where one cell ends and the next begins.

   AND THE SCREEN VANISHES AT BOTH ENDS, which is the part that makes it read
   as a print rather than as a texture laid over one. A real halftone has no
   dots in the solids and no dots in the paper; all of its dots are in the
   midtones. So the value sets the dot's own contrast, and a black object is
   solid black, a blown highlight is solid, and everything between them is
   made of dots — which is exactly the thing a beflix frame does.
   ========================================================================= */
import zlib from "node:zlib";
import fs from "node:fs";

/* the spectrogram ramp, as control points */
const RAMP = [
  [0, 0, 4], [22, 11, 57], [66, 10, 104], [106, 23, 110], [147, 38, 103],
  [188, 55, 84], [221, 81, 58], [243, 120, 25], [252, 165, 10], [246, 215, 70],
  [252, 255, 164],
];
export function pal(v) {
  v = v < 0 ? 0 : v > 1 ? 1 : v;
  const f = v * (RAMP.length - 1), i = Math.min(RAMP.length - 2, Math.floor(f)), t = f - i;
  const a = RAMP[i], b = RAMP[i + 1];
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/* the suite's own 8x8 ordered Bayer, 0..63 */
export const BAYER8 = (() => {
  const m = [[0, 2], [3, 1]];
  let g = m;
  for (let s = 0; s < 2; s++) {
    const n = g.length * 2, o = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++)
      o[y][x] = g[y % (n / 2)][x % (n / 2)] * 4 + m[Math.floor(y / (n / 2))][Math.floor(x / (n / 2))];
    g = o;
  }
  return g;
})();

/* value field (w x h, 0..1) -> RGB pixels at `cell` dots per cell.
   `invert` flips which end of the ramp is empty: a spectrogram's silence is
   black and a sheet of paper is not, so a picture printed to sit beside a
   spectrogram and a picture printed to BE one are the same print, reversed. */
export function print(field, w, h, { cell = 6, invert = false, screen = 0.17, floor = 0 } = {}) {
  const W = w * cell, H = h * cell;
  const px = Buffer.alloc(W * H * 3);
  for (let y = 0; y < H; y++) {
    const cy = (y / cell) | 0;
    for (let x = 0; x < W; x++) {
      const cx = (x / cell) | 0;
      let v = field[cy * w + cx];
      v = v < 0 ? 0 : v > 1 ? 1 : v;
      if (invert) v = 1 - v;
      v = floor + v * (1 - floor);
      /* the dot's contrast closes at both ends: no dots in the solids */
      const amp = screen * 4 * v * (1 - v);
      const thr = (BAYER8[y & 7][x & 7] + 0.5) / 64;
      const c = pal(v + (thr < v ? amp : -amp));
      const o = (y * W + x) * 3;
      px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2];
    }
  }
  return { px, W, H };
}

/* a PNG, written here rather than shelled out, because the printer should not
   depend on which build of ffmpeg happens to be on the machine */
export function png(file, px, W, H) {
  const raw = Buffer.alloc((W * 3 + 1) * H);
  for (let y = 0; y < H; y++) {
    raw[y * (W * 3 + 1)] = 0;                                  // filter: none
    px.copy(raw, y * (W * 3 + 1) + 1, y * W * 3, (y + 1) * W * 3);
  }
  const chunk = (type, data) => {
    const b = Buffer.alloc(8 + data.length + 4);
    b.writeUInt32BE(data.length, 0); b.write(type, 4);
    data.copy(b, 8);
    const crcBuf = Buffer.concat([Buffer.from(type), data]);
    b.writeUInt32BE(crc32(crcBuf) >>> 0, 8 + data.length);
    return b;
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const out = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  fs.writeFileSync(file, out);
  return { W, H, bytes: out.length };
}
const CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return c ^ 0xffffffff;
}
