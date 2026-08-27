/* ============================================================================
   ramp.mjs — THE PALETTE AND THE SCREEN, AND NOTHING ELSE.

   Split out of `screen.mjs` so that the browser can have them. `screen.mjs`
   writes PNG files and therefore imports zlib and fs, which no page can load;
   but the two things a page actually needs from it — the ramp that says MORE
   and the eight-by-eight schedule the whole suite dissolves on — are pure
   arithmetic with no imports at all. The radio paints its films with exactly
   the numbers the printer prints them with, because they are these numbers.
   ========================================================================= */
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


/* THE PLATE'S RANGE, not the gamut. Level 0 at the very bottom of the ramp and
   level 7 at the very top means a mostly-paper film prints as a sheet of white
   and a mostly-ink film prints as a sheet of black, and half this suite lives
   at one end or the other. Paper is a warm orange, full ink is very nearly
   black, and every film happens between them. */
export const RANGE = [0.06, 0.76];
