/* ============================================================
   assets/_broken-circle.mjs — THE MARK, PAINTED ONCE.

   MOTION-BRIEF.md, rule 5:
     "The broken circle is authored once, in brokenCircle(). The flight path,
      the pen mark on the photograph, the scar at the base of Iona's thumb, the
      wing marking, and the new paint on the plywood are provably the same
      shape. Do not redraw it. Import it. If they differ, the world is lying
      about its own central claim."

   engine/motion.mjs supplies the POINTS. It does not supply a painter, and a
   point list is not yet a mark: two consumers can take the same points and put
   them on the paper differently — different closure, different stroke weight
   relative to the shape, a flipped y — and the world would be lying at one
   remove instead of two. So the mapping from brokenCircle()'s 0..1 space onto
   a box of canvas pixels lives here, once, and both consumers call it:

     assets/character/iona.mjs      the scar at the base of her thumb (BF-22)
     assets/creature/oldbutterfly.mjs  the wing marking (BF-24)

   The one thing this file adds to brokenCircle() is that the two SEGMENTS can
   be drawn separately. brokenCircle() already tags every point `seg:"ring"` or
   `seg:"stroke"`, and BF-24 is precisely a claim about those two segments
   being on different surfaces:

     "Across the left hindwing the scales form a pale broken circle. No line
      crosses it. The butterfly raises its wings. On the right hindwing is the
      line."

   So `segs:["ring"]` and `segs:["stroke"]` are not a convenience — they are
   the divided mark, and the fact that they come out of ONE call to
   brokenCircle() is what makes the division and the whole the same object.
   ============================================================ */
import { brokenCircle } from "../engine/motion.mjs";
import { INK } from "../engine/halfworld-engine.mjs";

/* Cached: brokenCircle() is a pure function of its options and this file is
   called per frame per wing. Same options in, same array out, forever. */
const CACHE = new Map();
export function markPoints(opts = {}) {
  const key = JSON.stringify(opts);
  let p = CACHE.get(key);
  if (!p) { p = brokenCircle(opts); CACHE.set(key, p); }
  return p;
}

/** The shape's own bounds in brokenCircle() space, measured rather than
 *  assumed, so a box maps onto the ink and not onto whitespace. */
export function markBounds(opts = {}) {
  const p = markPoints(opts);
  let x0 = 1, y0 = 1, x1 = 0, y1 = 0;
  for (const q of p) { if (q.x < x0) x0 = q.x; if (q.x > x1) x1 = q.x; if (q.y < y0) y0 = q.y; if (q.y > y1) y1 = q.y; }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}

/* ---------------------------------------------------------------------------
   markPath(ctx, box, o) — lay the mark's path into ctx, no stroke, no fill.

   box  {x, y, w, h} in canvas pixels; the mark is fitted INSIDE it, centred,
        aspect preserved, so a scar 26px across and a wing marking 190px across
        are the same drawing at two sizes.
   o.segs   which segments to lay down: ["ring"], ["stroke"], or both.
   o.rot    radians. A scar on a thumb and a marking on a wing do not sit at
            the same angle on the paper; the SHAPE is what must not vary.
   o.flip   -1 mirrors in x — the right hindwing is the left one reflected, and
            a marking that did not mirror would sit on the wing wrong.
   o.u      0..1, draw only the first u of the selected points. For TRACE
            consumers (the flight path). Defaults to the whole mark.
--------------------------------------------------------------------------- */
export function markPath(ctx, box, o = {}) {
  const rot = o.rot || 0, flip = o.flip === -1 ? -1 : 1;
  const b = markBounds(o.opts);
  const s = Math.min(box.w / b.w, box.h / b.h);
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
  const mx = (b.x0 + b.x1) / 2, my = (b.y0 + b.y1) / 2;
  const cos = Math.cos(rot), sin = Math.sin(rot);
  return markPathWith(ctx, (q) => {
    const px = (q.x - mx) * s * flip, py = (q.y - my) * s;
    return { x: cx + px * cos - py * sin, y: cy + px * sin + py * cos };
  }, o);
}

/* ---------------------------------------------------------------------------
   markPathWith(ctx, put, o) — the same path under an ARBITRARY mapping.

   The wing needs this. assets/creature/_lepidoptera.mjs projects a wing from
   (span, chord) onto the paper through a transform that changes every frame as
   the wings open, and the marking has to be carried by THAT transform and not
   by a canvas-space box — otherwise the ring on the left hindwing and the
   stroke on the right would not land on top of each other when the wings
   close, and the world's central claim would fail by a few pixels.

   `put` takes a point of brokenCircle() (with .x and .y in 0..1) and returns
   canvas pixels. markPath() above is just this with a box mapper, so there is
   still exactly one path-laying loop in the world.
--------------------------------------------------------------------------- */
export function markPathWith(ctx, put, o = {}) {
  const segs = o.segs || ["ring", "stroke"];
  for (const seg of segs) {
    const pts = markPoints(o.opts).filter((q) => q.seg === seg);
    const n = Math.max(2, Math.floor(pts.length * (o.u == null ? 1 : Math.max(0, Math.min(1, o.u)))));
    if (n < 2) continue;
    const a = put(pts[0]);
    ctx.moveTo(a.x, a.y);
    for (let i = 1; i < n; i++) { const p = put(pts[i]); ctx.lineTo(p.x, p.y); }
  }
}

/** Stroke it. `ink` is any css colour — a scar is paler than a pen mark and a
 *  wing marking is paler still (it is made of scales, not of ink), but they
 *  are the same path at three weights. */
export function paintMark(ctx, box, o = {}) {
  stroke(ctx, (c) => markPath(c, box, o), o);
}

/** Stroke it under an arbitrary mapping — the wing case. */
export function paintMarkWith(ctx, put, o = {}) {
  stroke(ctx, (c) => markPathWith(c, put, o), o);
}

function stroke(ctx, lay, o) {
  ctx.save();
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  if (o.under) {                        // a light halo so the mark survives on a dark plane
    ctx.strokeStyle = o.under; ctx.lineWidth = (o.lw || 4) * 2.4;
    ctx.beginPath(); lay(ctx); ctx.stroke();
  }
  ctx.strokeStyle = o.ink || INK;
  ctx.lineWidth = o.lw || 4;
  ctx.beginPath(); lay(ctx); ctx.stroke();
  ctx.restore();
}

export const MARK_VERSION = "broken-circle/1.0.0";
