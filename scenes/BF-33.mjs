/* ============================================================================
   BF-33 · NO ONE HAD THREADED THE FILM
                    INT. REARING FACILITY · THE PROJECTION   plan: the-facility

     "The projector turns on. Its fan rises to speed. Light strikes the wall."
     "No one has threaded the film. Nevertheless an image appears."
     "A glasshouse. White-painted windows. Lavender beside a pool. Three
      children with their backs to the camera."
     "A woman enters carrying a tray of chrysalides. Mara knows her before she
      turns — not her face. Her shoulders."                — atlas/source.json

     MARA: "Who is filming?"    IONA: "The person who remembers."

   MOTION: DISSOLVE · 5.5s · 66 frames @12fps · loopClosed: false.

   ===========================================================================
   THERE IS NO CROSS-FADE IN THIS WORLD
   ===========================================================================
   dissolve(u, gx, gy) is a Bayer-8 ordered threshold that answers, per grid
   cell, WHICH IMAGE OWNS THIS DOT. assets/set/_dot-swap.mjs spends that answer:
   it builds the two ownership sets as EXACT COMPLEMENTS from ONE threshold map
   and paints each cell exactly once, so no dot is ever partly one image and
   partly the other. That module asserts the map is 32/32 across an 8x8 cell at
   u = 0.5 at import time, so the claim is checked by running code rather than
   asserted in prose.

   The cell is 10 source pixels — a little over two halftone dots. Larger and the
   swap stops reading as dots switching and starts reading as tiles switching.

   TWO SWAPS, IN SEQUENCE, ON THE SAME MAP:
     u .00 -> .16   the LAMP. The blank sheet becomes a lit sheet, per dot.
     u .24 -> .88   the IMAGE. The lit sheet becomes the glasshouse, per dot.
   The gap between them is the beat "no one has threaded the film" — a lit
   rectangle with nothing on it, held for eight frames, so that what follows is
   an arrival and not a fade-up.

   ===========================================================================
   THE ONE DRAWING DECISION MADE OUT OF AN ABSENCE
   ===========================================================================
   An unthreaded projector has no intermittent movement. So the image it is not
   supposed to be making has NO GATE WEAVE — no frame bar, no flicker, no jitter
   — while the dust in the beam, which is in the room and not in the machine,
   goes on moving. The projection is the steadiest thing in the frame. That is
   the whole horror of the beat and it is drawn by NOT drawing something; see
   _glasshouse.mjs' projectedGate({ weave: 0 }), which BF-33 never raises.

   SHE DOES NOT TURN. "Mara knows her before she turns — NOT HER FACE. HER
   SHOULDERS." The woman is built from character.mara's own
   `proportion.shoulders` = 1.12, imported by _glasshouse.mjs and never typed
   there; the three children are built at 1.0. She is the only silhouette in the
   glasshouse that is wrong at the top, and the recognition is that and nothing
   else. No face is drawn anywhere in this film.

   DECLARED DISCONTINUITIES: none. Both swaps are ordered and progressive.

   ---------------------------------------------------------------------------
   THE LENS. zoom 3.4 about screen_waiting, dropped 260px. The projector is at
   x .848 and lands 1350px off the right edge at this zoom; that is correct and
   it is why the beam enters from off-frame. BF-30 established the machine, its
   empty spindles and its unthreaded gate at a zoom that held both ends of the
   room. This unit is the other end.
   ========================================================================= */
import { framesFor, clamp01, TAU } from "../engine/motion.mjs";
import { INK, PAPER, inkLevel } from "../engine/halfworld-engine.mjs";
import { occupancyAt } from "../engine/blocking.mjs";
import { theFacility } from "./_plans/the-facility.mjs";
import { makeLens, NW, NH } from "../assets/set/_facility-lens.mjs";
import { dotSwap } from "../assets/set/_dot-swap.mjs";
import { glasshouse, projectedGate } from "../assets/set/_glasshouse.mjs";
import { beamWedge, screenRect, loadingRoomFloor } from "../assets/set/_facility.mjs";
import { exitOccupancy as INITIAL_FROM_BF32 } from "./BF-32.mjs";

/* ---- the motion scene contract ------------------------------------------ */
export const id         = "BF-33";
export const title      = "NO ONE HAD THREADED THE FILM";
export const place      = "INT. REARING FACILITY · THE PROJECTION";
export const plan       = "the-facility";
export const motion     = "DISSOLVE";
export const beats      = null;
export const seconds    = 5.5;
export const loopClosed = false;
export const frames     = framesFor(motion, seconds, 12);      // 66
export const declaredBreak = null;

export const subject    = "an image arriving on a sheet nobody threaded a film into";
export const distance   = "MEDIUM";
export const leftOut    = [
  "the projector. At zoom 3.4 the cart is 1350px off the right edge. Its empty " +
  "spindles and unthreaded gate are BF-30's frame; this one is what they produce",
  "Mara and Iona. They are at the pool, behind the beam, and the unit's two " +
  "lines are asked and answered off frame. A body in this shot competes with a " +
  "projection, and the projection has to win",
  "the chrysalis wall — it is on the far wall and the screen is on the near " +
  "left, which is exactly why the plan put them there: they must be able to " +
  "happen at once and this frame is only one of them",
];

/* ---- the lens ------------------------------------------------------------ */
const lens = makeLens(theFacility, { centre: "screen_waiting", zoom: 3.4, dy: 260 });
const S = lens("screen_waiting");
const SW = 740, SH = 548;
const SX = S.px - SW / 2, SY = S.py - SH;
const RECT = { x: SX, y: SY, w: SW, h: SH };

/* EXPORTED SO BF-35 IS THE SAME SHOT. "Mara turns. Therefore the film changed."
   — the film changes, not the camera. If BF-35 re-derived this rectangle the
   two units would be two set-ups and the cut between them would be a cut, which
   is precisely the thing the sentence denies. */
export const PROJECTION = RECT;
export const PROJECTION_LENS = { centre: "screen_waiting", zoom: 3.4, dy: 260 };

const LAMP_IN   = 0.00, LAMP_OUT  = 0.16;
const IMAGE_IN  = 0.24, IMAGE_OUT = 0.88;

/* ============================================================ at(u) ======== */
export function at(u, _ctx) {
  return {
    u,
    lamp:  clamp01((u - LAMP_IN)  / (LAMP_OUT - LAMP_IN)),
    image: clamp01((u - IMAGE_IN) / (IMAGE_OUT - IMAGE_IN)),
    /* the woman crosses in over the last half of the image's arrival, so she is
       assembling out of dots at the same time as she is walking. She enters the
       FRAME of the film; nothing in the room moves. */
    enter: clamp01((u - 0.46) / 0.42),
    dust: u,
    /* the fan rising to speed — heard, not seen; it is off frame with the
       machine. What it does here is put the dust in the beam in motion, which is
       the only thing in this shot that is allowed to look unsteady. */
    fan: u,
  };
}

/* ============================================================ draw() ======= */
export function draw(g, W, H, s) {
  g.save();
  g.scale(W / NW, H / NH);
  g.lineJoin = "round"; g.lineCap = "round";

  /* THE ROOM. Dark by CONTRAST, never by level: character.elise's module logged
     this one already — "a full-bleed mid grey is the one thing this post pass
     cannot do: darkness here has to be carried by the CONTRAST with the lit
     rectangle, not by the level of the field." So the room is L(2) and the
     rectangle is paper. */
  g.fillStyle = inkLevel(2); g.fillRect(0, 0, NW, NH);
  loadingRoomFloor(g, { x0: -10, x1: NW + 10, horizon: S.py + 44, bottom: NH, seed: 23 });

  /* THE BEAM, arriving from off frame right. Drawn before the sheet, because it
     is the thing landing on it. */
  if (s.lamp > 0.02) {
    beamWedge(g, NW + 120, SY + SH * 0.42, SX + SW + 6, SY - 20, SY + SH + 24,
              { level: 1, edge: true });
  }

  /* THE SHEET. It is a hung object with a rail and a weighted hem — BF-30 drew
     the same one waiting. */
  screenRect(g, SX, SY, SW, SH, { sag: 7 });

  /* ============================ THE TWO SWAPS ============================
     Both run through _dot-swap's single ordered map. Each cell is painted by
     exactly one painter; nothing is composited over anything. */

  /* ONE — the lamp. Unlit sheet -> lit sheet. */
  dotSwap(g, RECT, s.lamp,
    (gg) => { gg.fillStyle = inkLevel(2); gg.fillRect(SX, SY, SW, SH); },
    (gg) => { gg.fillStyle = PAPER;       gg.fillRect(SX, SY, SW, SH); },
    { cell: 10 });

  /* TWO — the image. Lit sheet -> the glasshouse. Only after the lamp has
     finished, so the two swaps never argue over a cell. */
  if (s.image > 0) {
    dotSwap(g, RECT, s.image,
      (gg) => { gg.fillStyle = PAPER; gg.fillRect(SX, SY, SW, SH); },
      (gg) => { glasshouse(gg, RECT, { enter: s.enter, seed: 401 }); },
      { cell: 10 });
  }

  /* THE GATE, with weave 0. See the header: an unthreaded machine has no
     intermittent movement, so this image cannot weave, and the fact that it does
     not is the most frightening thing about it. */
  projectedGate(g, RECT, { weave: 0 });

  /* THE DUST. In the room, not in the machine — so it is the one unsteady thing
     in the frame, and it crosses the beam between the lens and the sheet rather
     than sitting on the image. Nine motes, 4px, on seamless paths. */
  if (s.lamp > 0.4) {
    g.fillStyle = inkLevel(5);
    for (let i = 0; i < 9; i++) {
      const p = (s.dust + i * 0.1111) % 1;
      const x = SX + SW + 20 + p * 360;
      const y = SY + SH * 0.24 + Math.sin(p * TAU + i * 1.7) * SH * 0.30 + i * 6;
      g.beginPath(); g.arc(x, y, 4, 0, TAU); g.fill();
    }
  }

  g.restore();
}

/* ---- occupancy -----------------------------------------------------------
   the-facility deliberately blocks no MOVES for this unit: "BF-33, BF-35 and
   BF-38 are DISSOLVE and TRANSFER on a beam and a wall — no body crosses ground
   in them and MOVES tables would be invented motion." So the occupancy passes
   through unchanged, computed rather than copied. */
export const INITIAL = INITIAL_FROM_BF32;
export const MOVES   = [];
export const exitOccupancy = occupancyAt(theFacility, MOVES, 6, INITIAL);

export const SCENE_VERSION = "bf-motion/1.0.0";
