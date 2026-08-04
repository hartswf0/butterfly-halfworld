/* assets/set/_facility-lens.mjs — A LENS OVER THE FACILITY, and a way to stand
   a body on its floor.                                    (ACT III · BF-29..40)
   ============================================================================
   SCENE-BRIEF S3: "A plan is a map, not a shot list. `the-facility` has 131
   stations; a frame that uses 131 of them is an unreadable field of dots. Use
   `lens()`-style framing: crop in, preserve relative arrangement."

   The facility's own header measures what happens if you don't: at z .135 the
   chrysalis wall converges to 519px of a 1120px frame — 46% — and seventy-five
   years land 7.01px apart. Drawn literally, the climax of this world is a grey
   smear across the middle of the picture.

   A lens is one uniform similarity transform over project()'s OWN output. It
   cannot reorder or re-space anything, so every argument the plan makes survives
   the framing and only the crop changes.

   ---------------------------------------------------------------------------
   DECLARED DUPLICATION. assets/set/_lens.mjs (Act I) and assets/set/_stage.mjs
   (Act II) are the same twelve lines of arithmetic, authored independently by
   two other agents while this file was being written. Three lenses is one too
   many and the right end state is one shared module; this file exists rather
   than an import because those two are another act's set assets and are being
   edited concurrently, and a rename in either of them would take twelve scenes
   down mid-render. Flagged for consolidation rather than quietly forked.
   ---------------------------------------------------------------------------

   lens(name) -> { px, py, k, d }
     px, py  the station's GROUND point in frame pixels — where feet go
     k       the station's projected scale times the zoom — what to draw at
     d       the station's depth, untouched

   `cx, cy` are in project()'s OUTPUT space (0..1), not plan space: the point of
   the projected room that sits at the centre of the frame. project() puts every
   ground point between y .50 and y .96, so cy is nearly always .55..0.80.
   ========================================================================= */
import { project } from "../../engine/blocking.mjs";

export const NW = 1120, NH = 760;   // nominal source space, as scenes/BF-01.mjs

/** the pixel height of a body standing at projected scale 1.0, at zoom 1.
 *  Every figure and every piece of furniture in Act III is sized from this one
 *  number, so no two scenes can disagree about how big a person is.
 *
 *  180 IS MEASURED, NOT CHOSEN. project() is a shallow floor model: in the
 *  facility the far wall's ground line lands at y .553 and the annex door at
 *  y .924, so the ENTIRE depth of the room is 0.371 of the frame — 282px at
 *  zoom 1. A body at the wall (scale .760) has to fit inside that band or it
 *  covers the thing the act is about. At 180 it comes out 137px against 282px
 *  of floor, which is a person two thirds of the way down a loading room. The
 *  first pass used 430 and put Iona's head 27px above the top of the frame
 *  while her feet were still 300px below the ceiling. */
export const BODY = 180;

export function makeLens(plan, { centre = null, cx = 0.5, cy = 0.68, zoom = 1,
                                 dx = 0, dy = 0, W = NW, H = NH } = {}) {
  if (centre) { const c = plan.at(centre); cx = c.x; cy = c.y; }
  const f = (nameOrPoint, opts) => {
    const p = typeof nameOrPoint === "string" ? plan.at(nameOrPoint, opts)
                                              : project(nameOrPoint, opts);
    return {
      ...p,
      px: W * (0.5 + (p.x - cx) * zoom) + dx,
      py: H * (0.5 + (p.y - cy) * zoom) + dy,
      k:  p.scale * zoom,
      h:  p.scale * zoom * BODY,
    };
  };
  f.plan = plan; f.zoom = zoom; f.W = W; f.H = H; f.cx = cx; f.cy = cy;
  /** a point t of the way from station a to station b, in PLAN space, lensed. */
  f.between = (a, b, t, opts) => {
    const A = plan.stations[a], B = plan.stations[b];
    if (!A || !B) throw new Error(`[facility-lens] bad span ${a} -> ${b}`);
    return f({ x: A.x + (B.x - A.x) * t, z: A.z + (B.z - A.z) * t }, opts);
  };
  /** the ground line at a given depth, as a y in pixels — floors, lips, skirts */
  f.groundY = (z) => f({ x: 0.5, z }).py;
  /** the horizontal extent of a depth plane, as [x0,x1] in pixels */
  f.spanAt = (z, a = 0, b = 1) => [f({ x: a, z }).px, f({ x: b, z }).px];
  return f;
}

/* --------------------------------------------------------------------------
   STANDING A FIGURE ON THE FLOOR.

   figure-hero draws into a box and floor-corrects the rig so the lower ankle
   lands at 0.90 of the box height (HeroRig.apply: `const floor = H*.90`). So a
   body whose visible height should be `height` px, with its feet at (footX,
   footY), needs a box of height/0.90 whose bottom sits 0.10 of that below the
   feet. Doing this by eye is how two scenes end up with two different-sized
   people standing on one floor.

   The asset is drawn into the LIVE context under translate+scale rather than
   through placeInstance(): placeInstance measures ink and re-keys a cutout per
   call, which is right for one still and wrong for forty frames a scene, and the
   figure modules paint no background, so there is nothing to key out.
   -------------------------------------------------------------------------- */
export function placeFigure(g, mod, state, { footX, footY, height, clip = null } = {}) {
  const BH = height / 0.90, BW = BH * 0.76;
  g.save();
  if (clip) { g.beginPath(); g.rect(clip.x, clip.y, clip.w, clip.h); g.clip(); }
  g.translate(footX - BW / 2, footY - BH * 0.90);
  const a = mod.asset || mod;
  const res = a.draw(g, BW, BH, state);
  g.restore();
  const ox = footX - BW / 2, oy = footY - BH * 0.90;
  /* the rig's reported anchors, MAPPED INTO SCENE PIXELS. A scene that wants to
     hang something off a hand (BF-31's film strip) must get the hand from the
     pose that was actually drawn, not from a guess, or the prop and the body
     drift apart the moment the pose changes. */
  const anchors = {};
  for (const [k, p] of Object.entries((res && res.anchors) || {}))
    anchors[k] = { x: ox + p.x * BW, y: oy + p.y * BH };
  return { BW, BH, x: ox, y: oy, anchors, res };
}

/** a creature drawn into a square box of side `size` centred on (cx, cy). The
 *  lepidoptera kit positions itself from its own cx/cy channels inside that box,
 *  so those stay at .5 unless a scene wants the animal off-centre in its own
 *  frame. */
export function placeCreature(g, mod, state, { cx, cy, size }) {
  g.save();
  g.translate(cx - size / 2, cy - size / 2);
  const a = mod.asset || mod;
  a.draw(g, size, size, state);
  g.restore();
}

export const FACILITY_LENS_VERSION = "facility-lens/1.0.0";
