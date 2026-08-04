/* ============================================================================
   BF-34 · DO NOT TURN AROUND      INT. REARING FACILITY      plan: the-facility

     "The sound comes from behind her."
     "Not the voice thinned by medication and made formal by the effort to
      appear lucid."
     "This is the voice from childhood — impatient and amused, calling from the
      front seat while Mara knelt backward in the car to watch a storm
      disappear behind them."
     ELISE (V.O.): "Do not turn around."                  — atlas/source.json

   MOTION: HOLD · 5.0s · 60 frames @12fps · loopClosed: false.

   ===========================================================================
   ELISE IS NOT DRAWN. NOT HERE, NOT ANYWHERE, NOT AS ANYTHING.
   ===========================================================================
   character.elise's locks are absolute and they are quoted here because they
   decided this frame:

     EliseAbsentBody — "NO FACE ... NO BODY, no silhouette, no shoulders, NO
       HANDS, no shape behind a curtain, NO SHADOW CAST INTO FRAME FROM
       OFF-SCREEN ... No surrogate: no waveform, no pulse of light, no empty
       chair with a cardigan on it, no doorway with someone just out of it.
       She is not a ghost and must never be lit like one."
     EliseTurnLock — "DO NOT AUTHOR THE REVERSE ANGLE."

   the-facility authors `elise_voice_behind` at x .436 z .652 and says of it:
   "Authored and never occupied ... 'behind her' needs to be a place before it
   can be a direction she refuses to turn toward." At this lens that station is
   214px BELOW the bottom edge of the frame. It is in the room, it has
   coordinates, it is between Mara and the camera, and there is nothing at it.

   ===========================================================================
   SO WHAT DOES THE VOICE DO? IT DOES SOMETHING TO SOMEBODY ELSE.
   ===========================================================================
   elise.motions.do_not_turn(u) returns no view change at all. It returns `pull`
   — and the module says exactly what to do with it: "A scene applies `pull` to
   the head of whoever is in front of her, and the frame she is in does not
   change at all."

   `pull` is advance(u, 4, { dwell: 0.62 }) — FOUR QUANTISED PUSHES, not a ramp.
   It is a pressure toward action (BF-39's own words), so this file spends it in
   three places on MARA and nowhere else:

     1. THE FLINCH. Only while a push is MOVING (a.settled === false) does her
        body begin to come round: 0.20 rad of SPINE TWIST, 0.22 of head yaw and
        a shoulder tilt, all of which go when the push settles. Four flinches,
        four failures to complete, and the quantisation is the point:
        MOTION-BRIEF forbids easing this class of motion — "equal intervals;
        quantise it, do not ease it." (Pass 1 spent the flinch on the head
        alone at 0.115 rad and it was invisible: a 6.6 degree rotation of the
        BACK of a head is not a rotation of anything you can see.)
     2. THE RESIDUE. 0.075 rad of yaw per unit of accumulated pull, which does
        NOT go back. She ends the loop fractionally more turned than she began
        and has still not turned around.
     3. THE BRACING. shoulderLift and chestLift rise with the pull. Not turning
        is work, and by the fourth push it is visible in her back.

   She never turns. In BF-35 the FILM turns instead, which is the story's own
   answer, and it is why the reverse angle is not needed here or anywhere.

   THE WALL IS STILL OPEN. BF-32 split every seam on it and BF-32's last beat is
   that the wall goes on moving afterwards. So the same travelling field runs
   through the same opened husks in this unit, at the same wavelength, and the
   room she is refusing to turn away from is a room that is still working.

   DECLARED DISCONTINUITIES: none.
   ========================================================================= */
import { hold, framesFor, clamp01, TAU } from "../engine/motion.mjs";
import { inkLevel } from "../engine/halfworld-engine.mjs";
import { occupancyAt } from "../engine/blocking.mjs";
import {
  theFacility, chrysalisWallRun, INITIAL_BF34, MOVES_BF34,
  WALL_YEAR_FIRST, WALL_YEAR_LAST,
} from "./_plans/the-facility.mjs";
import { makeLens, placeFigure, BODY, NW, NH } from "../assets/set/_facility-lens.mjs";
import { loadingRoomFloor, tiledPool } from "../assets/set/_facility.mjs";
import { chrysalisWall, wallBoard } from "../assets/set/_chrysalis-wall.mjs";
import mara from "../assets/character/mara.mjs";
import elise from "../assets/character/elise.mjs";
import { exitOccupancy as INITIAL_FROM_BF33 } from "./BF-33.mjs";

/* ---- the motion scene contract ------------------------------------------ */
export const id         = "BF-34";
export const title      = "DO NOT TURN AROUND";
export const place      = "INT. REARING FACILITY";
export const plan       = "the-facility";
export const motion     = "HOLD";
export const beats      = null;
export const seconds    = 5.0;
export const loopClosed = false;
export const frames     = framesFor(motion, seconds, 12);      // 60
export const declaredBreak = null;

export const subject    = "a back that four times begins to turn and does not";
export const distance   = "MEDIUM";
export const leftOut    = [
  "ELISE. Every part of her, under EliseAbsentBody: no face, no body, no " +
  "silhouette, no hands, no shape behind anything, and NO SHADOW CAST INTO " +
  "FRAME. elise_voice_behind is 214px below the bottom edge and is empty",
  "the reverse angle, under EliseTurnLock. There is no shot in this act from " +
  "behind Mara's shoulder looking back down the room, and there will not be",
  "Niko and Iona — they are in the room and neither of them can hear this",
  "the projector and the beam; the sheet is off frame left and the film has not " +
  "changed yet. It changes in BF-35 because of what does not happen here",
];

/* ---- the lens ------------------------------------------------------------ */
const lens = makeLens(theFacility, { centre: "mara_pool_north", zoom: 2.6, dy: 300 });
const N = chrysalisWallRun.length;
const WX0 = lens(chrysalisWallRun[0]).px, WX1 = lens(chrysalisWallRun[N - 1]).px;
const WALL_BASE = lens(chrysalisWallRun[0]).py;
const WALL_TOP  = WALL_BASE - 300;
const M = lens("mara_pool_north");

const POS = chrysalisWallRun.map((_, i) => i / (N - 1));

/* ============================================================ at(u) ======== */
export function at(u, _ctx) {
  const h = hold(u, { breathSec: 4.1, dur: seconds });

  /* THE VOICE. The module is called and its return value is used; nothing about
     her frame is read, because her frame is not in this shot. */
  const e = elise.motions.do_not_turn(u);
  const flinch = e.settled ? 0 : 1;

  /* the field still crossing the opened wall — the same wavelength as BF-32,
     two revolutions per loop, seamless by construction */
  const K = TAU / 0.18;
  const cells = POS.map((p) => {
    const lean = 0.145 * Math.sin(K * p - u * TAU * 2);
    return { open: 1, lean, rowLean: lean * 0.42 };
  });

  return {
    u, breath: h.breath, tilt: h.tilt, cells,
    pull: e.pull, flinch,
    mara: mara.motions.breath(u),
    ripple: u,
  };
}

/* ============================================================ draw() ======= */
export function draw(g, W, H, s) {
  g.save();
  g.scale(W / NW, H / NH);
  g.lineJoin = "round"; g.lineCap = "round";

  loadingRoomFloor(g, { x0: -10, x1: NW + 10, horizon: WALL_BASE, bottom: NH, seed: 29 });

  wallBoard(g, { x0: WX0 - 40, x1: WX1 + 40, yTop: WALL_TOP - 40, yBot: WALL_BASE });
  chrysalisWall(g, { x0: WX0, x1: WX1, yTop: WALL_TOP, yBot: WALL_BASE - 8, seed: 201 },
                s.cells, { first: WALL_YEAR_FIRST, last: WALL_YEAR_LAST });

  /* the pool, between her and the wall. She is on its NORTH side facing the
     wall — the plan's `sightline_mara_to_the_wall` — so the water is in front of
     her feet and the wall is beyond it. */
  const P_N = lens("pool_edge_north"), P_S = lens("pool_edge_south");
  const P_W = lens("pool_edge_west"), P_E = lens("pool_edge_east");
  tiledPool(g, {
    cx: (P_W.px + P_E.px) / 2, farY: P_N.py, nearY: P_S.py,
    farW: (P_E.px - P_W.px) * 0.86, nearW: (P_E.px - P_W.px) * 1.20,
    ripple: s.ripple, level: 2, seed: 101,
  });

  /* ---- MARA, from behind, being worked on ----
     The flinch is applied to the HEAD and the neck; the residue to the head
     only; the bracing to the shoulders and the chest. Her body stays square to
     the wall in every frame — bodyYaw is PI throughout and nothing touches it,
     because the one thing this unit is about is that it does not change. */
  /* PASS 2. 0.115rad of head yaw on a head seen from BEHIND is a 6.6 degree
     rotation of an oval — measured on the render, invisible. A body that begins
     to turn and stops does it with its SPINE first, so the flinch is now spent
     on spineTwist and shoulderTilt as well as the head, and it is the torso
     starting to come round that you see. bodyYaw is still untouched, which is
     the difference between beginning to turn and turning. */
  const yaw = Math.PI - (0.22 * s.flinch + 0.075 * s.pull);
  placeFigure(g, mara, {
    ...s.mara,
    pose: "mv_sleeves", guise: "bare", box: false,
    rig: {
      ...s.mara.rig,
      bodyYaw: Math.PI,                       // NOT A CHANNEL OF THE PULL
      headYaw: yaw,
      neckYaw: -(0.09 * s.flinch),
      spineTwist: -(0.20 * s.flinch + 0.06 * s.pull),
      shoulderTilt: -0.035 * s.flinch,
      headRoll: -0.06 * s.flinch,
      shoulderLiftL: 0.10 + 0.26 * s.pull,
      shoulderLiftR: 0.10 + 0.30 * s.pull,
      chestLift: (s.mara.rig.chestLift || 0.3) + 0.22 * s.pull,
      spineLean: -0.06 - 0.06 * s.pull,
    },
  }, { footX: M.px, footY: M.py, height: M.k * BODY });

  /* AND BEHIND HER: THE ROOM. Concrete, the two expansion joints the floor
     already has, and nothing else. No shadow enters this frame from below it.
     That emptiness is authored, not left over. */

  g.restore();
}

/* ---- occupancy -----------------------------------------------------------
   the-facility blocks this unit precisely BECAUSE nobody moves in it: "an
   occupancy that holds her at mara_pool_north through a unit whose only line is
   'Do not turn around' is the handoff doing real work." MOVES_BF34 is empty and
   that is the content. */
export const INITIAL = { ...INITIAL_FROM_BF33, ...INITIAL_BF34 };
export const MOVES   = MOVES_BF34;
export const exitOccupancy = occupancyAt(theFacility, MOVES, 5, INITIAL);

export const SCENE_VERSION = "bf-motion/1.0.0";
