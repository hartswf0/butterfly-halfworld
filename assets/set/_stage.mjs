/* ============================================================================
   assets/set/_stage.mjs — THE LENS. Private support for the ACT II scenes.
   Underscore-prefixed, following assets/set/_kit.mjs and assets/creature/_kit.mjs:
   it exports no `asset` and must stay out of glob-driven render runs.

   WHY IT EXISTS.

   SCENE-BRIEF §3: "A plan is a map, not a shot list. `the-facility` has 131
   stations; a frame that uses 131 of them is an unreadable field of dots. Use
   lens()-style framing: crop in, preserve relative arrangement."

   the-mill projects its whole depth into y 0.53 .. 0.96 of the frame — every
   station in the plan lands in the bottom 43% of the picture, because
   blocking.mjs' projection is a FLOOR MODEL: y is where the feet go, not where
   the shot is. Taking plan.at() straight to canvas would put the entire mill in
   a band 320px tall with the top half of every frame empty, fourteen times.

   So the lens is a uniform similarity transform — one zoom about one centre —
   applied to the plan's OWN projection. Uniform is the whole point: it cannot
   change any relative arrangement, so the plan's arguments survive the framing.
   BF-16's ADVANCE still grows 30% from column_5 to column_1, iona_falters is
   still index 3 of 10, and the reflected seat row is still ON the glass, in
   order, at z .886 — the lens can only decide how much of that we are close to.

   The one thing a lens may NOT do is reorder or re-space stations, which is why
   there is no per-axis scale here and no keystone. If a scene needs a different
   arrangement it needs a different plan, not a different lens.

   ---------------------------------------------------------------------------
   A DUPLICATION, DECLARED, WITH THE ONE NUMBER THAT MATTERS.

   Act I landed assets/set/_lens.mjs while this act was being written, and it is
   the same idea with a different signature: it takes a centre station NAME and
   an `at` pixel, this one takes the centre in plan-projected coordinates. The
   transform is the same in both — x offsets scaled by frame width, y by frame
   height, one uniform zoom — and both declare the same asymmetry. Neither is
   wrong and neither produces a different arrangement, because the arrangement
   is the plan's.

   Where they DIFFER is one constant, and it is worth writing down rather than
   leaving to be discovered: _lens.mjs sets BODY = 300px per unit of project()
   scale at zoom 1; this file derives BODY_H = 0.62 x frame height = 471px, from
   BF-01's own maze geometry. That is not a continuity error in any frame — both
   acts apply a further per-scene factor and the plans guarantee the relative
   sizes either way — but two unnormalised body constants in one world is a
   thing that should be one constant. It was not consolidated here because doing
   it at the end of an act means re-checking the framing of fourteen rendered
   scenes for no visible gain; it is logged instead, in process/scene-actII.jsonl
   and in the act's report. The tap ring WAS consolidated, because that one is a
   drawing two scenes have to share and this one is not.
   ========================================================================= */
import { clamp01, lerp } from "../../engine/halfworld-engine.mjs";

export const NW = 1120, NH = 760;          // nominal source space, as BF-01

/* ---------------------------------------------------------------------------
   lens(plan, { zoom, cx, cy })

   Returns  at(stationName, opts) -> { x, y, scale, d }
   in NOMINAL PIXELS (NW x NH), where

     x = (0.5 + (px - cx) * zoom) * NW
     y = (0.5 + (py - cy) * zoom) * NH

   cx, cy are the plan-projected point the lens is centred ON — normally
   plan.at("the thing this scene is about"). zoom is how many times bigger the
   plan reads than it would at 1:1.

   `scale` comes back multiplied by zoom so a figure grows with the crop; the
   plan's own depth term (0.60 + 0.50 d) is untouched underneath it.
--------------------------------------------------------------------------- */
export function lens(plan, { zoom = 1, cx = 0.5, cy = 0.74, on = null } = {}) {
  if (on) { const p = plan.at(on); cx = p.x; cy = p.y; }
  const at = (name, opts) => {
    const p = typeof name === "string" || !name.x ? plan.at(name, opts) : name;
    return {
      x: (0.5 + (p.x - cx) * zoom) * NW,
      y: (0.5 + (p.y - cy) * zoom) * NH,
      scale: p.scale * zoom,
      d: p.d,
    };
  };
  /* the same transform for a point BETWEEN two stations — the plan's own ray,
     so an animal crossing a lot and a body running after it are on one floor. */
  at.ray = (a, b, u) => at(plan.ray(a, b, clamp01(u)));
  at.zoom = zoom; at.cx = cx; at.cy = cy; at.plan = plan;
  return at;
}

/* ---------------------------------------------------------------------------
   FLOOR HEIGHT. A body standing at a station has its feet at `y` and its head
   at y - height. blocking.mjs' `scale` is the depth term; this turns it into
   pixels once, so fourteen scenes agree about how tall a person is.

   BODY_H is 0.62 of the nominal frame at scale 1.0 — measured against BF-01's
   own numbers rather than chosen: the maze plan puts Mara at the lid at scale
   1.112 and BF-01 draws the box 564px tall, so a scale-1 adult is ~470px, which
   is 0.62 NH.
--------------------------------------------------------------------------- */
export const BODY_H = 0.62 * NH;
export const bodyBox = (p, k = 1) => {
  const h = BODY_H * p.scale * k;
  return { x: p.x, y: p.y, h, w: h * 0.42, top: p.y - h };
};

/* A prop's size at a station: the same depth law, at a caller-chosen fraction
   of a body. Palm-width objects, cups and reels all come through here so they
   shrink with depth exactly as the people do. */
export const propSize = (p, frac) => BODY_H * p.scale * frac;

/* linear interpolation of two lens points — for anything that has to travel
   between stations without being a body (a strip of satin, a bus). */
export const lerpPt = (a, b, u) => ({
  x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u),
  scale: lerp(a.scale, b.scale, u), d: lerp(a.d, b.d, u),
});

export const STAGE_VERSION = "bf-stage/1.0.0";
