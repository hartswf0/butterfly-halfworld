/* assets/set/_lens.mjs — A LENS OVER A PLAN.  (ACT I · the laboratory + the maze)
   ============================================================================
   SCENE-BRIEF §3: "A plan is a map, not a shot list. Use lens()-style framing:
   crop in, preserve relative arrangement."

   the-laboratory has 60 stations. A frame that draws 60 of them is an
   unreadable field of dots, and a frame that hand-places two of them has
   thrown away the reason the plan exists. A lens is the third option: it is a
   PURE AFFINE MAP over project()'s output, so

     · every station keeps its position RELATIVE to every other one,
     · depth scale keeps meaning (a thing at z .11 is still 71% of a thing at
       z .62, at any zoom),
     · and a close-up is a crop, not a re-authoring.

   A scene names a centre station and a zoom. Nothing else changes. If two
   scenes in this act frame the same object at different zooms, the object is
   provably in the same place in both, which is the whole point of the plan and
   is not something a scene can promise by hand.

   THE ONE ASYMMETRY, STATED. x offsets are multiplied by W and y offsets by H,
   because that is exactly what project() itself does when the harness paints a
   1120x760 frame. At zoom 1 the lens is therefore the IDENTITY and a lensed
   scene and an unlensed one sit on one floor. At zoom 6 a circle in plan space
   comes out 1120/760 = 1.47 wide. That is a real distortion and it is the
   reason the tap ring in BF-14 is authored in SCENE space (see _tap-ring.mjs)
   rather than as a ring of plan stations: the ring has to be a ring.

   ONE UNIT OF BODY. `BODY` is the pixel height of a figure at scale 1. Every
   set piece in _lab.mjs is sized as a fraction of it, so a bench is bench-high
   next to a person at any zoom without a second calibration.
   ========================================================================= */
import { project } from "../../engine/blocking.mjs";

export const BODY = 300;          // px per unit of project() scale, at zoom 1

/* `at: {x, y}` puts the centre station at that PIXEL, which is how a scene
 *  frames a shot: name the thing, say where in the frame it goes. `native:
 *  true` is the wide case — zoom about the frame centre with no recentring, so
 *  lens(plan, {native:true}) is exactly project() and a wide scene and a close
 *  one demonstrably sit on one floor. */
export function lens(plan, { centre, zoom = 1, dx = 0, dy = 0, at = null,
                             native = false, W = 1120, H = 760 } = {}) {
  const c = native ? { x: 0.5, y: 0.5 } : plan.at(centre);
  if (at) { dx = at.x - W * 0.5; dy = at.y - H * 0.5; }
  const f = (nameOrPoint, opts) => {
    const p = typeof nameOrPoint === "string" ? plan.at(nameOrPoint, opts)
                                              : project(nameOrPoint, opts);
    return {
      x: W * (0.5 + (p.x - c.x) * zoom) + dx,
      y: H * (0.5 + (p.y - c.y) * zoom) + dy,
      scale: p.scale * zoom,
      d: p.d,
      h: p.scale * zoom * BODY,      // a body's height, in pixels, standing there
    };
  };
  f.plan = plan;
  f.zoom = zoom;
  f.W = W; f.H = H;
  /** a point on the straight line between two stations, in PLAN space, then
   *  lensed. Used for anything that spans (a bench top, a duct, a sightline). */
  f.between = (a, b, t, opts) => {
    const A = plan.stations[a], B = plan.stations[b];
    if (!A || !B) throw new Error(`[lens] bad span ${a}->${b}`);
    return f({ x: A.x + (B.x - A.x) * t, z: A.z + (B.z - A.z) * t }, opts);
  };
  /** the ground line at a given depth, as a y in pixels — for floors and skirts */
  f.groundY = (z) => f({ x: 0.5, z }).y;
  return f;
}

export const LENS_VERSION = "lens/1.0.0";
