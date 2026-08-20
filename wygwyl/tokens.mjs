/* ============================================================================
   tokens.mjs — READ A FIELD AS A PROGRAM, AND MEASURE ITS TEXTURE.

   Adapted from `decompileToTokens` in hartswf0/abc-flix `icaro-flow-sp.html`,
   parameterised to any lattice instead of that file's fixed 128x96, and run
   here at our native 192x144.

   WHAT A TOKEN IS. Run-length encode each row into maximal same-level runs,
   then merge vertically adjacent runs that share x, width and level. What
   comes out is the smallest set of axis-aligned rectangles that reconstructs
   the field exactly — the field rewritten as a drawing program.

   WHY IT IS WORTH HAVING. Their decompiler dies on halftoned photography:
   measured over forty frames of OUT OF LIFE it produced 6322 tokens for a
   12288-cell frame — 51% of raw, at 297ms — because a Bayer dither is built to
   alternate every cell and run-length encoding needs runs. Our films are
   halftoned too, but only at the very last step: `renderField()` hands back
   LEVELS, before the dot law is applied. Fed that, the same algorithm returns
   686 tokens per frame at 6.8ms — nine times fewer, forty times faster.

   THE MEASUREMENT THAT CAME OUT OF IT. Token count is not ink coverage. Across
   the fourteen films the two correlate at only 0.69, so half of what a token
   count knows, coverage does not. What the remainder is, is TEXTURE: how
   broken up the picture is, independent of how much of it there is.

       texture = tokens / (coverage x 100)

   Film 10 MAGIC RIDE reads 8 — night and morning as large flat fields.
   Film 03 HOW TO BREAK OFF AN ENGAGEMENT reads 46 — cobwebs, a storm, a
   shattered tambourine, a picture made of scattered fragments. Film 13 reads
   14 while covering 99% of the frame, because almost all of that is one tone.
   The index reads the films correctly, and nothing else we have measures it:
   `--motion` says whether a movement moves and coverage says how dark it is,
   but neither can tell a mass from a scatter.
   ========================================================================= */

/* field: Float32Array or number[] of w*h levels. Returns rectangles that
   reconstruct it exactly, the first being the background fill. */
export function toTokens(field, w, h) {
  const at = (x, y) => Math.min(7, Math.round(field[y * w + x]));
  const counts = new Uint32Array(9);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) counts[at(x, y)]++;
  let bg = 0;
  for (let i = 1; i < 9; i++) if (counts[i] > counts[bg]) bg = i;

  const runs = [];
  for (let y = 0; y < h; y++) {
    let x = 0;
    while (x < w) {
      const v = at(x, y);
      if (v === bg) { x++; continue; }
      const x0 = x;
      while (x < w && at(x, y) === v) x++;
      runs.push({ x: x0, y, w: x - x0, h: 1, ink: v });
    }
  }
  /* merge downward. The original is O(n^2) over every pair; keyed by
     (x,width,ink) this is one pass, and on a 192x144 field with a few thousand
     runs that is the difference between milliseconds and seconds. */
  const open = new Map(), out = [{ cmd: "CLR", x: 0, y: 0, w, h, ink: bg }];
  for (const r of runs) {
    const k = r.x + "," + r.w + "," + r.ink;
    const t = open.get(k);
    if (t && t.y + t.h === r.y) { t.h++; continue; }
    if (t) out.push(t);
    open.set(k, { cmd: "PNT", ...r });
  }
  for (const t of open.values()) out.push(t);
  return out;
}

/* Everything the index needs, in one pass over the field. */
export function textureOf(field, w, h) {
  const tokens = toTokens(field, w, h);
  let ink = 0, sum = 0;
  for (let i = 0; i < w * h; i++) { const v = Math.min(7, Math.round(field[i])); if (v > 0) ink++; sum += v; }
  const cov = ink / (w * h);
  return {
    tokens: tokens.length,
    coverage: cov,
    meanLevel: sum / (w * h),
    /* tokens per one percent of coverage: a mass reads low, a scatter high.
       Coverage near zero would divide by nothing, so an empty field has no
       texture rather than an infinite one. */
    texture: cov > 0.005 ? tokens.length / (cov * 100) : 0,
    /* what a run-length coder would save: 1.0 means the field is incompressible */
    density: tokens.length / (w * h),
  };
}
