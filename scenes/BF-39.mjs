/* ============================================================================
   BF-39 · A PRESSURE TOWARD ACTION
                    INT. REARING FACILITY · DARKNESS         plan: the-facility

     "The memory enters through no opening she can name. Not a vision. Not
      information. A pressure toward action."
     "She knows a child stands behind her at the edge of the pool."
     "She knows the child will fall if she does not turn. She knows turning will
      cause the glass above them to break."
     "She knows her mother stood in this position. She knows Iona did. She knows
      none of these things can all be true."             — atlas/source.json

     IONA (O.S.): "You see why it survives."    NIKO: "Mara."

   MOTION: HOLD · 5.5s · 66 frames @12fps · loopClosed: false.

   ===========================================================================
   NOT A VISION. NOT INFORMATION. SO NOTHING IS SHOWN.
   ===========================================================================
   The unit names four things she knows and every one of them is a temptation to
   draw something that is not in the room: a child behind her, a child falling,
   glass breaking, her mother standing here, Iona standing here. NONE OF THEM IS
   IN THIS FRAME. The text is explicit that this is not a vision — it is a
   pressure toward action — and a pressure toward action drawn as a picture of
   the action is the opposite of it.

   The girl exists in BF-40 and not before. If she appeared here as a shape, a
   shadow or a reflection in the water, BF-40's first beat would be a repeat
   instead of an arrival, and the unit would also have answered a question the
   story refuses to answer.

   ===========================================================================
   WHAT A PRESSURE TOWARD ACTION LOOKS LIKE IN A BODY
   ===========================================================================
   hold() returns three channels and this unit spends all three on one idea:

     weight   -> her weight crosses from one foot to the other and back, twice,
                 without a step being taken. A body loading to move and not
                 moving. This is the whole content of the unit and it is one
                 number applied to pelvisX, hipL and hipR.
     tilt     -> the head, a little, and out of phase with the weight, so the
                 two never resolve into a decision.
     breath   -> the 4.1s breath against a 5.5s unit: they never line up inside
                 the loop, so no two frames are the same.

   All three are seamless sines of u and the whole unit is deniable, which is
   what a HOLD is for. If you can point at the motion here it has failed.

   NO FLINCH. BF-34 had four quantised pushes because there was a voice making
   them. Nothing is pushing here — "the memory enters through no opening she can
   name" — so the motion is continuous and unforced, and the difference between
   this unit and BF-34 is exactly the difference between being called and
   knowing.

   THE ROOM IS DARK AND THE WALL IS STILL OPEN. BF-38 left every tube dead and
   the beam running; BF-32 left every seam split and the field still crossing
   them. Both continue here, and the same wavelength runs through the same husks,
   which is what makes the last four units one continuous ten minutes.

   DECLARED DISCONTINUITIES: none.
   ========================================================================= */
import { hold, framesFor, TAU } from "../engine/motion.mjs";
import { INK, PAPER, inkLevel } from "../engine/halfworld-engine.mjs";
import { occupancyAt } from "../engine/blocking.mjs";
import {
  theFacility, chrysalisWallRun, WALL_YEAR_FIRST, WALL_YEAR_LAST,
} from "./_plans/the-facility.mjs";
import { makeLens, placeFigure, BODY, NW, NH } from "../assets/set/_facility-lens.mjs";
import { loadingRoomFloor, tiledPool, beamWedge, tubeBank } from "../assets/set/_facility.mjs";
import { chrysalisWall, wallBoard } from "../assets/set/_chrysalis-wall.mjs";
import mara from "../assets/character/mara.mjs";
import { exitOccupancy as INITIAL_FROM_BF38 } from "./BF-38.mjs";

/* ---- the motion scene contract ------------------------------------------ */
export const id         = "BF-39";
export const title      = "A PRESSURE TOWARD ACTION";
export const place      = "INT. REARING FACILITY · DARKNESS";
export const plan       = "the-facility";
export const motion     = "HOLD";
export const beats      = null;
export const seconds    = 5.5;
export const loopClosed = false;
export const frames     = framesFor(motion, seconds, 12);      // 66
export const declaredBreak = null;

export const subject    = "a body loading to move, twice, and not moving";
export const distance   = "MEDIUM";
export const leftOut    = [
  "the child. She is not in the room until BF-40 and drawing her here — as a " +
  "shape, a shadow, or a reflection in the water — would make BF-40's arrival a " +
  "repeat and would answer a question the story refuses",
  "the glass breaking above them. It does not break in this unit or in any unit",
  "her mother and Iona standing in this position. Two of the four things she " +
  "knows are other people having stood here, and neither of them is drawable " +
  "without turning a pressure into a vision",
  "Iona and Niko, who both speak in this unit and are both off frame. The " +
  "sentence is that she does not turn toward either of them",
];

/* ---- the lens: BF-34's, so this is the same set-up ---------------------- */
const lens = makeLens(theFacility, { centre: "mara_pool_north", zoom: 2.6, dy: 300 });
const N = chrysalisWallRun.length;
const WX0 = lens(chrysalisWallRun[0]).px, WX1 = lens(chrysalisWallRun[N - 1]).px;
const WALL_BASE = lens(chrysalisWallRun[0]).py;
const WALL_TOP  = WALL_BASE - 300;
const M = lens("mara_pool_north");
const P_N = lens("pool_edge_north"), P_S = lens("pool_edge_south");
const P_W = lens("pool_edge_west"),  P_E = lens("pool_edge_east");
const LENS_PT = lens("projector_lens"), SCREEN = lens("screen_waiting");

const POS = chrysalisWallRun.map((_, i) => i / (N - 1));

/* ============================================================ at(u) ======== */
export function at(u, _ctx) {
  const h = hold(u, { breathSec: 4.1, dur: seconds });

  /* THE PRESSURE. Two loadings per revolution — an integer, so it is seamless —
     and it never becomes a step. `shift` is signed: left, back, right, back. */
  const shift = Math.sin(u * TAU * 2);
  const lean  = Math.sin(u * TAU * 2 + 1.1) * 0.6;   // out of phase, so unresolved

  const K = TAU / 0.18;
  const cells = POS.map((p) => {
    const l = 0.145 * Math.sin(K * p - u * TAU * 2);
    return { open: 1, lean: l, rowLean: l * 0.42 };
  });

  return {
    u, cells, shift, lean, breath: h.breath, tilt: h.tilt,
    mara: mara.motions.breath(u), ripple: u,
  };
}

/* ============================================================ draw() ======= */
export function draw(g, W, H, s) {
  g.save();
  g.scale(W / NW, H / NH);
  g.lineJoin = "round"; g.lineCap = "round";

  g.fillStyle = inkLevel(3); g.fillRect(0, 0, NW, NH);
  loadingRoomFloor(g, { x0: -10, x1: NW + 10, horizon: WALL_BASE, bottom: NH, seed: 41 });
  g.fillStyle = inkLevel(3); g.fillRect(0, WALL_BASE, NW, NH - WALL_BASE);

  tubeBank(g, ["tube_bank_west", "tube_bank_centre", "tube_bank_east"]
    .map((n) => { const p = lens(n); return [p.px - 110, p.px + 110]; }),
    { y: 66, on: false });

  /* the wall, still open and still moving, in the dark. It is drawn on an L(2)
     board rather than an L(0) one, because the light in this room now comes from
     one lateral beam and none of it reaches the far wall. */
  wallBoard(g, { x0: WX0 - 40, x1: WX1 + 40, yTop: WALL_TOP - 40, yBot: WALL_BASE });
  g.fillStyle = inkLevel(2);
  g.fillRect(WX0 - 40, WALL_TOP - 40, (WX1 + 40) - (WX0 - 40), WALL_BASE - (WALL_TOP - 40));
  chrysalisWall(g, { x0: WX0, x1: WX1, yTop: WALL_TOP, yBot: WALL_BASE - 8, seed: 201 },
                s.cells, { first: WALL_YEAR_FIRST, last: WALL_YEAR_LAST });

  /* THE BEAM, crossing behind her at z .518 — she is at z .432, so it passes
     between her and the wall and she is standing in front of the only light in
     the room. That is why she is a silhouette and the wall behind her is not. */
  beamWedge(g, NW + 140, P_N.py + 30, -60, P_N.py - 84, P_N.py + 96,
            { level: 1, edge: true });

  tiledPool(g, {
    cx: (P_W.px + P_E.px) / 2, farY: P_N.py, nearY: P_S.py,
    farW: (P_E.px - P_W.px) * 0.86, nearW: (P_E.px - P_W.px) * 1.20,
    ripple: s.ripple, level: 4, seed: 101,
  });

  /* ---- MARA. Back to us, in front of the beam, loading and not moving. ---- */
  placeFigure(g, mara, {
    ...s.mara,
    pose: "mv_sleeves", guise: "bare", box: false,
    rig: {
      ...s.mara.rig,
      bodyYaw: Math.PI,
      headYaw: Math.PI + s.lean * 0.10,
      headRoll: s.lean * 0.05,
      /* THE WHOLE UNIT, IN THREE CHANNELS. The pelvis crosses; the hips take the
         load and give it back; nothing else changes and no foot leaves the
         floor. */
      pelvisX: s.shift * 0.055,
      hipL: 0.02 + s.shift * 0.10,
      hipR: -0.02 + s.shift * 0.10,
      kneeL: 0.03 + Math.max(0, s.shift) * 0.10,
      kneeR: 0.03 + Math.max(0, -s.shift) * 0.10,
      shoulderTilt: -s.shift * 0.020,
      spineLean: -0.06 - Math.abs(s.shift) * 0.05,
    },
  }, { footX: M.px, footY: M.py, height: M.k * BODY });

  g.restore();
}

/* ---- occupancy ----------------------------------------------------------- */
export const INITIAL = INITIAL_FROM_BF38;
export const MOVES   = [];
export const exitOccupancy = occupancyAt(theFacility, MOVES, 6, INITIAL);

export const SCENE_VERSION = "bf-motion/1.0.0";
