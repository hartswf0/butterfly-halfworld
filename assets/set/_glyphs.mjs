/* assets/set/_glyphs.mjs — LETTERS AS GEOMETRY.  (ACT I)
   ============================================================================
   BUILD-BRIEF §5: "Small type DISSOLVES in the dot lattice. Draw numerals and
   signage as geometry, or size >= 33px." _kit.mjs already does this for house
   numbers with digit(); BF-10 needs the same discipline for words, because the
   whole unit is a thing written on the back of a photograph:

     ASTER HOUSE / AUGUST 1945 / IONA, ELISE, THOMAS / DO NOT TURN AROUND

   If that is drawn with ctx.fillText it will come out of the halftone pass as
   grey fur and the scene will be about an illegible smudge, which is a
   different and much worse scene. So every glyph here is a set of POLYLINES on
   a unit box, stroked at a weight tied to cap height, exactly like digit().

   It is a single-stroke hand, not a typeface: this is fountain pen on the back
   of a print, and a monoline skeleton is both the honest form and the only one
   that survives an ordered-dot field at 40px cap height.

   The comma and the slash overshoot the box downward on purpose (a descender
   and a full-height virgule); nothing else leaves 0..1.
   ========================================================================= */
import { INK } from "../../engine/halfworld-engine.mjs";

/* x rightward 0..1, y downward 0 (cap line) .. 1 (baseline) */
const G = {
  " ": [],
  A: [[[0, 1], [.5, 0], [1, 1]], [[.17, .62], [.83, .62]]],
  B: [[[0, 0], [0, 1]], [[0, 0], [.68, 0], [.9, .16], [.9, .34], [.68, .49], [0, .49]],
      [[0, .49], [.74, .49], [.95, .67], [.95, .84], [.74, 1], [0, 1]]],
  C: [[[.95, .16], [.72, .02], [.3, .02], [.05, .26], [.05, .74], [.3, .98], [.72, .98], [.95, .84]]],
  D: [[[0, 0], [0, 1]], [[0, 0], [.6, 0], [.93, .3], [.93, .7], [.6, 1], [0, 1]]],
  E: [[[.94, .02], [0, .02], [0, 1], [.94, 1]], [[0, .5], [.7, .5]]],
  F: [[[.94, .02], [0, .02], [0, 1]], [[0, .5], [.7, .5]]],
  G: [[[.95, .16], [.72, .02], [.3, .02], [.05, .26], [.05, .74], [.3, .98], [.78, .98],
       [.95, .82], [.95, .56], [.55, .56]]],
  H: [[[0, 0], [0, 1]], [[1, 0], [1, 1]], [[0, .5], [1, .5]]],
  I: [[[.5, 0], [.5, 1]], [[.16, 0], [.84, 0]], [[.16, 1], [.84, 1]]],
  J: [[[.85, 0], [.85, .77], [.6, .98], [.26, .98], [.06, .78]]],
  K: [[[0, 0], [0, 1]], [[.94, 0], [0, .56]], [[.32, .38], [.98, 1]]],
  L: [[[0, 0], [0, 1], [.9, 1]]],
  M: [[[0, 1], [0, 0], [.5, .62], [1, 0], [1, 1]]],
  N: [[[0, 1], [0, 0], [1, 1], [1, 0]]],
  O: [[[.05, .28], [.3, .02], [.7, .02], [.95, .28], [.95, .72], [.7, .98], [.3, .98],
       [.05, .72], [.05, .28]]],
  P: [[[0, 1], [0, 0], [.7, 0], [.95, .18], [.95, .4], [.7, .58], [0, .58]]],
  Q: [[[.05, .28], [.3, .02], [.7, .02], [.95, .28], [.95, .72], [.7, .98], [.3, .98],
       [.05, .72], [.05, .28]], [[.6, .7], [1, 1.06]]],
  R: [[[0, 1], [0, 0], [.7, 0], [.95, .18], [.95, .4], [.7, .58], [0, .58]],
      [[.44, .58], [1, 1]]],
  S: [[[.95, .15], [.72, .02], [.28, .02], [.06, .2], [.06, .37], [.28, .49], [.72, .49],
       [.94, .63], [.94, .82], [.72, .98], [.26, .98], [.05, .85]]],
  T: [[[0, .02], [1, .02]], [[.5, .02], [.5, 1]]],
  U: [[[0, 0], [0, .75], [.25, .98], [.75, .98], [1, .75], [1, 0]]],
  V: [[[0, 0], [.5, 1], [1, 0]]],
  W: [[[0, 0], [.22, 1], [.5, .36], [.78, 1], [1, 0]]],
  X: [[[0, 0], [1, 1]], [[1, 0], [0, 1]]],
  Y: [[[0, 0], [.5, .52], [1, 0]], [[.5, .52], [.5, 1]]],
  Z: [[[0, .02], [1, .02], [0, 1], [1, 1]]],
  0: [[[.05, .28], [.3, .02], [.7, .02], [.95, .28], [.95, .72], [.7, .98], [.3, .98],
       [.05, .72], [.05, .28]], [[.16, .84], [.84, .16]]],
  1: [[[.2, .22], [.5, .02], [.5, 1]], [[.2, 1], [.85, 1]]],
  2: [[[.05, .2], [.28, .02], [.72, .02], [.95, .22], [.92, .43], [.05, 1], [.98, 1]]],
  3: [[[.06, .07], [.72, .02], [.94, .2], [.9, .4], [.52, .5], [.92, .6], [.95, .82],
       [.7, .98], [.14, .94]]],
  4: [[[.74, 0], [.05, .69], [1, .69]], [[.74, 0], [.74, 1]]],
  5: [[[.92, .02], [.16, .02], [.1, .44], [.6, .4], [.92, .58], [.92, .8], [.66, .98], [.14, .93]]],
  6: [[[.9, .06], [.5, .02], [.14, .3], [.06, .7], [.28, .97], [.66, .97], [.9, .76],
       [.86, .56], [.55, .44], [.2, .55]]],
  7: [[[.04, .02], [.96, .02], [.4, 1]]],
  8: [[[.5, .02], [.15, .14], [.15, .36], [.5, .5], [.85, .36], [.85, .14], [.5, .02]],
      [[.5, .5], [.12, .65], [.12, .86], [.5, .98], [.88, .86], [.88, .65], [.5, .5]]],
  9: [[[.1, .94], [.5, .98], [.86, .7], [.94, .3], [.72, .03], [.34, .03], [.1, .24],
       [.14, .44], [.45, .56], [.8, .45]]],
  "/": [[[.9, -.05], [.1, 1.05]]],
  ",": [[[.55, .84], [.42, 1.14]]],
  ".": [[[.44, .99], [.56, .99]]],
  "-": [[[.1, .52], [.9, .52]]],
  "'": [[[.5, 0], [.42, .26]]],
};

/** Width of one glyph box, as a fraction of cap height. Monoline hand. */
export const GLYPH_W = 0.66;
export const GLYPH_GAP = 0.28;

/** Advance width of a string at cap height h. */
export function textWidth(str, h) {
  const n = String(str).length;
  return n * h * GLYPH_W + Math.max(0, n - 1) * h * GLYPH_GAP;
}

/* -----------------------------------------------------------------------------
   strokeText(g, str, x, y, h, o)
   x,y is the LEFT end of the cap line. h is cap height in px — keep it >= 33
   per BUILD-BRIEF §5 or the halftone will eat it.
   o.lw     stroke weight; defaults to 0.13 * h, floored at 3px (the dot pitch)
   o.slant  radians of forward lean — a hand, not a face
   o.jitter per-glyph baseline wobble, deterministic in the character index
--------------------------------------------------------------------------- */
export function strokeText(g, str, x, y, h, o = {}) {
  const lw = Math.max(3, o.lw ?? h * 0.13);
  const slant = o.slant ?? 0;
  const jit = o.jitter ?? 0;
  g.save();
  g.strokeStyle = o.color || INK;
  g.lineWidth = lw;
  g.lineCap = "round"; g.lineJoin = "round";
  let cx = x;
  const s = String(str).toUpperCase();
  for (let i = 0; i < s.length; i++) {
    const gl = G[s[i]];
    const w = h * GLYPH_W;
    if (gl && gl.length) {
      const dy = jit ? Math.sin(i * 2.399) * jit * h : 0;
      g.beginPath();
      for (const poly of gl) {
        for (let k = 0; k < poly.length; k++) {
          const px = cx + poly[k][0] * w - (poly[k][1] - 0.5) * slant * h;
          const py = y + poly[k][1] * h + dy;
          if (k === 0) g.moveTo(px, py); else g.lineTo(px, py);
        }
      }
      g.stroke();
    }
    cx += w + h * GLYPH_GAP;
  }
  g.restore();
  return cx - h * GLYPH_GAP - x;
}

export const GLYPHS_VERSION = "glyphs/1.0.0";
