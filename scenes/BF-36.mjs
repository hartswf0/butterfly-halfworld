/* ============================================================================
   BF-36 · THE CASCADE        INT. REARING FACILITY · THE POOL   plan: the-facility

     "The reel slips and rolls in a widening circle across the floor, film
      unwinding behind it."
     "It strikes the tiled edge and falls into the water. Therefore the strip
      tightens."
     "Therefore every frame between the cart and the water becomes briefly
      visible:"
     "A man raising his hand. A woman in a green dress. A burning barn. A hotel
      corridor. A child on an airport platform. A face reflected in an
      artificial eye. A car sinking through blue light. A witness pointing
      across a courtroom. A dead wife opening her eyes on a space station."
                                                          — atlas/source.json

   MOTION: ADVANCE · 3.5s · 42 frames @12fps · loopClosed: false.
   NO DIALOGUE IN THIS UNIT. It is the only one in the act with none.

   ===========================================================================
   THE WIDEST FRAME IN THE WORLD, AND THE SMALLEST OBJECTS IN IT
   ===========================================================================
   zoom 1.20 — the lowest magnification anywhere in Act III, and the only unit
   that holds the cart, the roll, the pool and the rectangle at once. That is
   what the sentence needs: the frames become visible BETWEEN THE CART AND THE
   WATER, so both ends have to be in shot.

   And it costs exactly what the plan warned it would. `reelRollRun`'s nine
   stations run from x .822 to .580 at z .512..0.540, which at this lens is 231
   frame pixels. Nine frames in 231px is 26px each — SIX HALFTONE DOTS. Nothing
   is legible at six dots. So the wide shot and the nine images are, on their
   face, incompatible, and one of them has to give.

   ===========================================================================
   THE ROOM ALREADY SOLVED IT, AND THE PLAN SAYS SO
   ===========================================================================
   the-facility's `the_beam` fixture: "crosses the room laterally, over the pool,
   at about z .51." `beam_over_pool` is x .618 z .518. And `strip_frame_car_
   sinking` is x .630 z .504. THE REEL'S PATH RUNS THROUGH THE BEAM. Those two
   coordinates are eleven plan-thousandths apart and neither of them was put
   there by me.

   So the strip is dragged through a running projector's light, and each frame
   that crosses the beam is thrown on the white rectangle at the far end of the
   room — 300 x 240 pixels, where a drawing fits. That is where "briefly
   visible" happens, and it is cinema rather than an effect: a film pulled
   through a beam throws its frames.

   DECLARED AS A READING. The text says the frames become visible; it does not
   say where. Projecting them is an interpretation, and it is made here rather
   than smuggled. The alternative — nine 26px rectangles on a floor — is not an
   interpretation, it is an unreadable frame, and MOTION-BRIEF's instruction is
   that this must still obey the dot law.

   BOTH THINGS ARE DRAWN. The nine frames are on the strip, at their nine
   stations, at 26px, in the plan's order, because that is where they physically
   are. The one crossing the beam is ALSO on the rectangle, large. Nothing is
   moved to make the shot work.

   ===========================================================================
   ONE FRAME OF THE ADVANCE EACH. THEY ARE GLIMPSES, NOT SHOTS.
   ===========================================================================
   advance(u', 9, { dwell: 0.62 }) over the last 74% of the loop: each image gets
   one index, which at 42 frames and 12fps is about three rendered frames — a
   quarter of a second — and then it is gone and does not come back. There is no
   frame of this loop in which two of the nine are on the rectangle.

   dir IS -1. The plan's own note: "the strip pays out toward the pool, which is
   to the LEFT of the projector." The run is monotonic in x descending, and the
   advance walks it in that order: raised hand first, space station last, into
   the water.

   DECLARED DISCONTINUITIES: none. The reel rolls, tips and goes under
   continuously over u .00 -> .24; the advance's slide is fast, not instant.
   ========================================================================= */
import { advance, framesFor, clamp01, TAU } from "../engine/motion.mjs";
import { INK, PAPER, inkLevel, lerp, smooth } from "../engine/halfworld-engine.mjs";
import { occupancyAt } from "../engine/blocking.mjs";
import { theFacility, reelRollRun } from "./_plans/the-facility.mjs";
import { makeLens, NW, NH } from "../assets/set/_facility-lens.mjs";
import {
  loadingRoomFloor, tiledPool, projectorCart, screenRect, beamWedge, trough,
  tubeBank,
} from "../assets/set/_facility.mjs";
import { NINE, NINE_ORDER } from "../assets/set/_nine-frames.mjs";
import { exitOccupancy as INITIAL_FROM_BF35 } from "./BF-35.mjs";

/* ---- the motion scene contract ------------------------------------------ */
export const id         = "BF-36";
export const title      = "THE CASCADE";
export const place      = "INT. REARING FACILITY · THE POOL";
export const plan       = "the-facility";
export const motion     = "ADVANCE";
export const beats      = null;
export const seconds    = 3.5;
export const loopClosed = false;
export const frames     = framesFor(motion, seconds, 12);      // 42
export const declaredBreak = null;

export const subject    = "nine frames of nine other films, one at a time, going into water";
export const distance   = "WIDE";
export const leftOut    = [
  "Mara and Niko. The unit has no dialogue and no one in it does anything; a " +
  "body in this frame would be a person watching, and the sentence is not about " +
  "anybody watching",
  "the chrysalis wall. It is open and behind the beam and it would put 225 more " +
  "objects into the widest frame in the world",
  "eight of the nine images, in every frame of the loop. That is what a glimpse is",
];

/* ---- the lens: the widest in the act ------------------------------------ */
const lens = makeLens(theFacility, { centre: "pool_centre", zoom: 1.20, dy: 240 });
const CART = lens("projector_cart"), LENS_PT = lens("projector_lens");
const SCREEN = lens("screen_waiting");
const P_N = lens("pool_edge_north"), P_S = lens("pool_edge_south");
const P_W = lens("pool_edge_west"),  P_E = lens("pool_edge_east");
const BEAM = lens("beam_over_pool");

/* the nine, from the plan, in the plan's order, resolved once */
const RUN = reelRollRun.map((n) => lens(n));
const NINE_COUNT = RUN.length;                    // 9

/* the rectangle the thrown frame lands on */
const SWID = 300, SHGT = 240;
const SRECT = { x: SCREEN.px - SWID / 2, y: SCREEN.py - SHGT, w: SWID, h: SHGT };

const ROLL_OUT = 0.24;        // the reel is in the water by here
const ADV_IN   = 0.26;

/* ============================================================ at(u) ======== */
export function at(u, _ctx) {
  /* THE ROLL. "A widening circle" — so the reel does not travel in a straight
     line from the cart to the water; it bows toward the far wall in the middle
     and comes back, which is the arc the plan's `the_roll` fixture describes.
     One parameter, k, and the bow is a sine of it. */
  const k = smooth(clamp01(u / ROLL_OUT));
  const bow = Math.sin(k * Math.PI) * 92;

  /* THE FALL. It strikes the tiled edge at k = 1 and goes under: `sink` is 0
     until then and runs to 1 over the next tenth of the loop. */
  const sink = clamp01((u - ROLL_OUT) / 0.10);

  const adv = advance(clamp01((u - ADV_IN) / (1 - ADV_IN)), NINE_COUNT, { dwell: 0.62 });

  /* the strip tightens once the reel is in the water: `taut` straightens the
     bow out of the paid-out film, which is the physical cause of every frame
     passing through the beam in order. */
  const taut = clamp01((u - ROLL_OUT) / 0.34);

  return { u, k, bow, sink, adv, taut, ripple: u, spin: u * 3 };
}

/* the reel's position at k, along the widening circle */
function reelAt(k, bow) {
  const x = lerp(CART.px, P_E.px, k);
  const y = lerp(CART.py - 96, P_E.py, k) - bow;
  return { x, y };
}

/* ============================================================ draw() ======= */
export function draw(g, W, H, s) {
  g.save();
  g.scale(W / NW, H / NH);
  g.lineJoin = "round"; g.lineCap = "round";

  /* the room, dark by contrast — the projector is running and the tubes are
     still on, so this is the last lit unit before BF-38 puts them all out. */
  g.fillStyle = inkLevel(1); g.fillRect(0, 0, NW, NH);
  loadingRoomFloor(g, { x0: -10, x1: NW + 10, horizon: P_N.py - 120, bottom: NH, seed: 31 });

  /* the beam, crossing the room over the pool. Drawn BEFORE the pool and the
     strip, because everything else in this frame is in it. */
  beamWedge(g, LENS_PT.px - 40, LENS_PT.py - 96, SRECT.x + SRECT.w + 4,
            SRECT.y - 8, SRECT.y + SRECT.h + 10, { level: 0, edge: true });

  /* ---- the white rectangle, and what is on it ----
     One of nine, for three rendered frames, and then the next. */
  screenRect(g, SRECT.x, SRECT.y, SRECT.w, SRECT.h, { sag: 6 });
  if (s.taut > 0.02) {
    const name = NINE_ORDER[Math.min(NINE_COUNT - 1, s.adv.index)];
    g.save();
    g.beginPath(); g.rect(SRECT.x + 4, SRECT.y + 4, SRECT.w - 8, SRECT.h - 8); g.clip();
    NINE[name](g, { x: SRECT.x + 4, y: SRECT.y + 4, w: SRECT.w - 8, h: SRECT.h - 8 });
    g.restore();
    /* the frame line: the strip is being DRAGGED, not projected properly, so the
       thrown image has a hard bar across it where the frame edge is sitting in
       the light. It moves with the advance's own shift. This is the one place in
       the act where a projected image is allowed to be unsteady, and it is
       unsteady because a hand-dragged film is. */
    const bar = SRECT.y + 4 + (SRECT.h - 8) * (1 - s.adv.shift);
    g.strokeStyle = INK; g.lineWidth = 6;
    g.beginPath(); g.moveTo(SRECT.x + 4, bar); g.lineTo(SRECT.x + SRECT.w - 4, bar); g.stroke();
  }

  /* ---- the pool ---- */
  tiledPool(g, {
    cx: (P_W.px + P_E.px) / 2, farY: P_N.py, nearY: P_S.py,
    farW: (P_E.px - P_W.px) * 0.86, nearW: (P_E.px - P_W.px) * 1.20,
    ripple: s.ripple, level: 2, seed: 101,
  });

  const tN = lens("trough_north");
  trough(g, tN.px - 46 * tN.k, tN.py - 18 * tN.k - 14, 92 * tN.k, 18 * tN.k,
         { seed: 91, sway: s.u, stems: 7, tall: 40 * tN.k });

  /* ---- the strip, on the floor, at its nine stations ----
     26px a frame. Illegible, and correct: this is where the film physically is.
     The one crossing the beam gets a hard outline, because it is the only one
     with light going through it. */
  g.strokeStyle = INK; g.lineWidth = 3;
  g.beginPath();
  const reel = reelAt(s.k, s.bow);
  g.moveTo(CART.px - 20, CART.py - 96);
  for (let i = 0; i < NINE_COUNT; i++) {
    const p = RUN[i];
    g.lineTo(p.px, p.py - (1 - s.taut) * 26 * Math.sin(i * 0.9));
  }
  g.lineTo(reel.x, reel.y);
  g.stroke();

  for (let i = 0; i < NINE_COUNT; i++) {
    const p = RUN[i];
    const q = RUN[Math.min(NINE_COUNT - 1, i + 1)];
    const ang = Math.atan2(q.py - p.py, q.px - p.px);
    const wob = (1 - s.taut) * 26 * Math.sin(i * 0.9);
    g.save();
    g.translate(p.px, p.py - wob); g.rotate(ang);
    const fw = 26, fh = 21;
    g.fillStyle = inkLevel(0); g.strokeStyle = INK; g.lineWidth = 2.4;
    g.beginPath(); g.rect(-fw / 2, -fh / 2, fw, fh); g.fill(); g.stroke();
    // a frame at six dots can carry ONE mark. It gets the darkest shape of its
    // own image and nothing else.
    g.fillStyle = inkLevel(5);
    g.fillRect(-fw * 0.22, -fh * 0.20, fw * 0.44, fh * 0.46);
    if (i === s.adv.index && s.taut > 0.02) {
      g.strokeStyle = INK; g.lineWidth = 5;
      g.beginPath(); g.rect(-fw * 0.72, -fh * 0.78, fw * 1.44, fh * 1.56); g.stroke();
    }
    g.restore();
  }

  /* ---- the reel ----
     Above the floor while it rolls; under the surface after. Once it is under,
     it is drawn INSIDE the pool as a dark disc with the strip rising out of it —
     which is what makes the strip tighten. */
  if (s.sink < 1) {
    const rr = 34 * (1 - s.sink * 0.25);
    g.fillStyle = inkLevel(1); g.strokeStyle = INK; g.lineWidth = 4;
    g.save();
    g.translate(reel.x, reel.y + s.sink * 44);
    g.scale(1, 1 - s.sink * 0.55);                 // it tips as it goes in
    g.beginPath(); g.arc(0, 0, rr, 0, TAU); g.fill(); g.stroke();
    g.rotate(s.spin * TAU);
    g.strokeStyle = INK; g.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      g.rotate(TAU / 3);
      g.beginPath(); g.moveTo(0, -rr * 0.24); g.lineTo(0, -rr * 0.88); g.stroke();
    }
    g.fillStyle = inkLevel(5);
    g.beginPath(); g.arc(0, 0, rr * 0.20, 0, TAU); g.fill();
    g.restore();
  } else {
    g.fillStyle = inkLevel(5);
    g.beginPath(); g.ellipse(P_E.px - 14, P_E.py + 20, 30, 12, 0, 0, TAU); g.fill();
    g.strokeStyle = PAPER; g.lineWidth = 3;        // the surface, broken over it
    g.beginPath(); g.moveTo(P_E.px - 52, P_E.py + 14); g.lineTo(P_E.px + 24, P_E.py + 16); g.stroke();
  }

  /* ---- the cart, emptied ---- */
  projectorCart(g, CART.px, CART.py - 104 * 0.78, 0.78,
                { on: true, power: true, spin: s.spin, threaded: false });

  /* ---- overhead. The tubes are still on; BF-38 is where they go out. PASS 2:
     without them the widest frame in the world had an empty upper third and
     every object in it sat in one horizontal band across the middle. ---- */
  tubeBank(g, ["tube_bank_west", "tube_bank_centre", "tube_bank_east"]
    .map((n) => { const p = lens(n); return [p.px - 66, p.px + 66]; }),
    { y: 96, on: true });
  /* the sheeting is NOT drawn in this unit. sheet_chamber_a lands at px 173..285
     and the white rectangle occupies 40..340: at the widest lens in the act the
     two hangings stand directly in front of the thing the nine images are
     landing on. The tubes fill the top; the sheeting would empty the left. */

  g.restore();
}

/* ---- occupancy ----------------------------------------------------------- */
export const INITIAL = INITIAL_FROM_BF35;
export const MOVES   = [];
export const exitOccupancy = occupancyAt(theFacility, MOVES, 5, INITIAL);

export const SCENE_VERSION = "bf-motion/1.0.0";
