/* ============================================================================
   BF-32 · EVERY CHRYSALIS WAS EMPTY   INT. REARING FACILITY · THE WALL
                                                                plan: the-facility

     "A clicking comes from the wall. One chrysalis moves. Then another. The
      sound travels down the rows."
     "Each seam splits at once — a synchronized line passing across the wall
      from left to right."
     "The oldest open first. Empty. Then the next. Empty. Every chrysalis is
      empty."
     "Yet the wall continues to move: something passes through the husks without
      occupying them, a distortion like wind crossing tall grass."
                                                          — atlas/source.json

     NIKO: "Temperature change?"  MARA: "No."
     NIKO: "Vibration?"           MARA: "No."
     NIKO: "You have to give me something."

   MOTION: SWEEP · 5.0s · 60 frames @12fps · loopClosed: false.

   ===========================================================================
   THIS UNIT IS TWO MOTIONS AND THEY MUST NOT BE THE SAME MOTION
   ===========================================================================

   ONE — THE FRONT. sweep(u, positions, { width: 0.035, dir: 1 }) over the plan's
   `chrysalisWallRun`: seventy-five stations IN DATE ORDER, 1951 at the left,
   because the plan fixes that handedness twice ("the oldest is at the LEFT
   because the sweep runs left to right and the text says the oldest go first;
   those two facts fix the wall's handedness and it may not be flipped").

   WIDTH IS 0.035, i.e. 2.6 COLUMNS MID-SPLIT. MOTION-BRIEF: "narrow `width`, a
   zip in sequence, not weather", and the plan's own note says keep it at or
   under 0.04. At 0.035 a given seam goes from shut to open in 1.6 rendered
   frames — an eighth of a second — which is what "each seam split AT ONCE"
   means. A wide front would make the wall fog over, which is a different and
   much worse image.

   TWO — THE FIELD. "Something passes through the husks without occupying them,
   a distortion like wind crossing tall grass." This is NOT the front. It is a
   travelling wave in `lean`, applied to EVERY husk in the frame with the same
   amplitude whether that husk has opened or not — because the field does not
   care which ones are empty; they all are. Two wavelengths cross the wall per
   revolution of u, so it is seamless by construction, and the three rows are
   given slightly different phase so the wall reads as a depth of grass rather
   than as a flat curtain being shaken.

   NOTHING IN THIS FILE BULGES, SWELLS, OR MOVES FROM INSIDE A HUSK. The husks
   only LEAN, and they lean because something is going past them.

   ===========================================================================
   AND THE WALL GETS LIGHTER
   ===========================================================================
   _chrysalis-wall.mjs paints the aperture of an opened husk at L(0) — bare
   paper, the brightest value available — so the front is also a boundary in
   VALUE: everything behind it is brighter than everything in front of it, and
   the frame visibly empties from left to right over five seconds. That is the
   line "every chrysalis is empty" carried by the picture rather than by any one
   object in it, which is the only way a wall of 225 objects can carry it.

   THE LOOP DOES NOT CLOSE, AND MUST NOT. At u = 1 the wall is open; at u = 0 it
   is shut. That is a wrap discontinuity of about 30% against a 1% mean step and
   it is reported as such. A SWEEP is a one-shot wavefront, not a cycle — closing
   it would mean the husks shut again, which is a different and untrue event.

   DECLARED DISCONTINUITIES: none within the unit. The wrap is the unit ending.

   ---------------------------------------------------------------------------
   THE LENS. zoom 2.2 about wall_1988, dropped 220px. This is the crop the plan
   asks for out loud: at zoom 1 the wall is 519px of a 1120px frame with 7.01px
   between years, which is below the lattice. At 2.2 it spans -12..1132 — it runs
   off both edges, which is right, because "hundreds" is a quantity you cannot
   see the ends of — and the pitch is 15.3px, above _chrysalis-wall.mjs'
   FINE_PITCH, so every husk is drawn as two shells and can actually split.
   ========================================================================= */
import { sweep, framesFor, clamp01, TAU } from "../engine/motion.mjs";
import { INK, PAPER, inkLevel } from "../engine/halfworld-engine.mjs";
import { occupancyAt } from "../engine/blocking.mjs";
import {
  theFacility, chrysalisWallRun, MOVES_BF32,
  WALL_YEAR_FIRST, WALL_YEAR_LAST,
} from "./_plans/the-facility.mjs";
import { makeLens, NW, NH } from "../assets/set/_facility-lens.mjs";
import { loadingRoomFloor, yearRail } from "../assets/set/_facility.mjs";
import { chrysalisWall, wallBoard } from "../assets/set/_chrysalis-wall.mjs";
import { exitOccupancy as INITIAL_FROM_BF31 } from "./BF-31.mjs";

/* ---- the motion scene contract ------------------------------------------ */
export const id         = "BF-32";
export const title      = "EVERY CHRYSALIS WAS EMPTY";
export const place      = "INT. REARING FACILITY · THE WALL";
export const plan       = "the-facility";
export const motion     = "SWEEP";
export const beats      = null;
export const seconds    = 5.0;
export const loopClosed = false;
export const frames     = framesFor(motion, seconds, 12);      // 60
export const declaredBreak = null;

export const subject    = "the wall emptying, left to right";
export const distance   = "WIDE";
export const leftOut    = [
  "Mara, Niko and Iona. Mara crosses to mara_pool_north during this unit and at " +
  "zoom 2.2 that station is 420px below the bottom of the frame. All three of " +
  "them are behind the lens. The dialogue is two people failing to name what " +
  "they are looking at, and what they are looking at is the whole frame",
  "the pool, the projector, the rectangle, the tubes, the sheeting — this is a " +
  "crop onto one surface and everything else in the room is outside it",
  "any occupant of any husk, in any frame, at any point in the loop",
];

/* ---- the lens ------------------------------------------------------------ */
const lens = makeLens(theFacility, { centre: "wall_1988", zoom: 2.2, dy: 220 });
const N = chrysalisWallRun.length;                     // 75
const WX0 = lens(chrysalisWallRun[0]).px;              // 1951, at the LEFT
const WX1 = lens(chrysalisWallRun[N - 1]).px;          // 2025
const WALL_BASE = lens(chrysalisWallRun[0]).py;        // 600
const WALL_TOP  = WALL_BASE - 450;

/* the sweep's positions: the run's own order, normalised. Nothing here knows a
   year — it knows an index in a list the plan built and check D verifies. */
const POS = chrysalisWallRun.map((_, i) => i / (N - 1));

/* the two isolated clicks that start it. "One chrysalis moves. Then another."
   Two columns, named once, and they are inside the oldest fifth of the wall
   because that is the end the front is about to arrive from. */
const CLICK_A = 4, CLICK_B = 13;

const SWEEP_IN  = 0.10;      // the clicking happens first
const SWEEP_OUT = 0.86;      // and the field goes on after the front has gone

/* ============================================================ at(u) ======== */
export function at(u, _ctx) {
  /* THE FRONT. Remapped so the sweep occupies the middle 76% of the loop: the
     first 10% is the clicking and the last 14% is the wall continuing to move
     after every seam has already split, which is the beat the unit ends on. */
  const su = clamp01((u - SWEEP_IN) / (SWEEP_OUT - SWEEP_IN));
  const front = sweep(su, POS, { width: 0.035, dir: 1 });

  /* THE FIELD. Two wavelengths per revolution — an integer, so lean(1) ===
     lean(0) and the field itself introduces no step at the wrap; the only
     discontinuity in this unit is the wall being shut again, which is the unit
     starting over. The wavelength is 0.18 of the wall — about thirteen years of
     husks leaning together — which is the scale at which wind crosses grass.
     A shorter wavelength read as vibration, which is the one explanation Niko
     offers and Mara refuses. */
  const K = TAU / 0.18;
  const lean = POS.map((p) => 0.145 * Math.sin(K * p - u * TAU * 2));

  /* THE CLICKS. Quantised, not eased — the same law as the tapping in BF-14 and
     BF-21. A click is an instant and its whole visible life is three frames. */
  const clickAt = (start) => {
    const k = (u - start) / 0.05;
    return k > 0 && k < 1 ? (1 - k) : 0;
  };
  const cA = clickAt(0.015), cB = clickAt(0.055);

  const cells = POS.map((p, i) => ({
    open: front[i].open,
    lean: lean[i] + (i === CLICK_A ? cA * 0.30 : 0) + (i === CLICK_B ? cB * 0.30 : 0),
    /* the three rows do not lean together. rowLean is added to row 0 and
       subtracted from row 2 by _chrysalis-wall.mjs, so the wall has a front and
       a back to it. */
    rowLean: lean[i] * 0.42,
  }));

  /* where the line IS, in wall-fraction. dir +1: front = su*(1+width) - width */
  const linePos = su * (1 + 0.035) - 0.035;

  return { u, cells, linePos, live: su > 0 && su < 1, clicks: [cA, cB] };
}

/* ============================================================ draw() ======= */
export function draw(g, W, H, s) {
  g.save();
  g.scale(W / NW, H / NH);
  g.lineJoin = "round"; g.lineCap = "round";

  loadingRoomFloor(g, { x0: -10, x1: NW + 10, horizon: WALL_BASE, bottom: NH, seed: 17 });

  wallBoard(g, { x0: WX0 - 60, x1: WX1 + 60, yTop: WALL_TOP - 70, yBot: WALL_BASE });
  yearRail(g, WX0, WX1, WALL_TOP - 56, [1951, 2000, WALL_YEAR_LAST],
           WALL_YEAR_FIRST, WALL_YEAR_LAST);

  chrysalisWall(g, { x0: WX0, x1: WX1, yTop: WALL_TOP, yBot: WALL_BASE - 10, seed: 201 },
                s.cells, { first: WALL_YEAR_FIRST, last: WALL_YEAR_LAST });

  /* ---- THE LINE ----
     "a synchronized line passing across the wall from left to right".

     It is a line. The text calls it one, so it is drawn as one: a single bright
     rule the height of the wall, at the front's own position, with the ink
     doubled either side of it so it reads on both the shut wall in front of it
     and the opened wall behind it. It is the only object in this act that is
     allowed to be a full-height vertical, and it is allowed because it is the
     subject. */
  if (s.live) {
    const x = WX0 + (WX1 - WX0) * s.linePos;
    g.strokeStyle = INK; g.lineWidth = 7;
    g.beginPath(); g.moveTo(x, WALL_TOP - 14); g.lineTo(x, WALL_BASE - 4); g.stroke();
    g.strokeStyle = PAPER; g.lineWidth = 3.2;
    g.beginPath(); g.moveTo(x, WALL_TOP - 14); g.lineTo(x, WALL_BASE - 4); g.stroke();
  }

  /* ---- THE CLICKING ----
     "A clicking comes from the wall. One chrysalis moves. Then another." Two
     short radiating ticks at two named columns, three frames each, before the
     front arrives. They are the sound, drawn. */
  s.clicks.forEach((c, j) => {
    if (c <= 0) return;
    const i = j === 0 ? CLICK_A : CLICK_B;
    const x = WX0 + ((WX1 - WX0) / N) * (i + 0.5);
    const y = WALL_TOP + (WALL_BASE - 10 - WALL_TOP) * (0.34 + j * 0.33);
    g.strokeStyle = INK; g.lineWidth = 2.6 + 2.4 * c;
    g.beginPath();
    for (const a of [-1, 1]) {
      g.moveTo(x + a * 12, y); g.lineTo(x + a * (12 + 16 * c), y - 7 * c);
    }
    g.stroke();
  });

  g.restore();
}

/* ---- occupancy ----------------------------------------------------------- */
export const INITIAL = INITIAL_FROM_BF31;
export const MOVES   = MOVES_BF32;
export const exitOccupancy = occupancyAt(theFacility, MOVES, 8, INITIAL);

export const SCENE_VERSION = "bf-motion/1.0.0";
