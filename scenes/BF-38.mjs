/* ============================================================================
   BF-38 · A FRAME TOO SMALL TO CONTAIN IT
                    INT. REARING FACILITY · DARKNESS         plan: the-facility

     "Every fluorescent tube goes out. Darkness arrives complete except for the
      projector beam."
     "Within it, scales drift. Thousands of them."
     "They move across the light in slow currents, each scale briefly becoming a
      bright rectangle — a frame too small to contain the event it had carried."
                                                          — atlas/source.json

   MOTION: TRANSFER · 5.5s · 66 frames @12fps · loopClosed: false.

   ===========================================================================
   THE SENTENCE IS THE DRAWING INSTRUCTION
   ===========================================================================
   "each scale BRIEFLY BECOMING A BRIGHT RECTANGLE — A FRAME too small to
   contain the event it had carried."

   A scale is a speck for most of its crossing and a FILM FRAME at the middle of
   it. So each carrier is drawn twice over its life and never blended between
   them: at the edges of the beam it is a 3px dark speck; at the midpoint it is a
   12 x 9 paper rectangle with a hard ink border and a perforation notch — 4:3,
   because that is what a frame is. Nothing here fades. transfer()'s `ink` peaks
   at 1.9 exactly at the crossing midpoint, and MOTION-BRIEF is unambiguous:
   "They BRIGHTEN when rubbed ... Anything that dims is wrong."

   180 CARRIERS, NOT THOUSANDS, AND THAT IS DECLARED. "Thousands of them" is not
   drawable under the dot law: a thousand marks at 3px in a 1120x760 frame is a
   grey field, which is the one thing this post pass cannot do and also the
   opposite of "darkness arrives complete". 180 is the largest number at which
   the individual carriers still read as objects rather than as texture. The
   quantity in the sentence is carried by the beam being FULL of them at every
   depth, not by the count.

   ===========================================================================
   THE TUBES ARE ALREADY OUT, AND THAT IS NOT A DODGE
   ===========================================================================
   "Every fluorescent tube goes out" is an instant, and an instant is a BREAK,
   and a BREAK must be declared and this unit's motion is TRANSFER. So the tubes
   went out between units and this unit is the darkness that followed. They are
   drawn — three dead fittings across the top, level 3 cylinders with no pins —
   because a room that has just lost its light looks different from a room that
   never had any, and the plan is explicit that they are NOT an ordered run:
   "all at once is the opposite of a sweep."

   DARKNESS BY CONTRAST, NOT BY LEVEL. character.elise logged this: "a full-bleed
   mid grey is the one thing this post pass cannot do: darkness here has to be
   carried by the CONTRAST with the lit rectangle." So the room is L(3), the beam
   is L(1), the screen is paper, and the darkest thing in the frame is the dead
   tube.

   THE SCALES ARE THIN AND THE CONTACT SHEET WILL LOSE THEM. It samples every
   ~10 source pixels; a 3px speck is a coin flip at that rate and the 12px frames
   are two dots. Judged at full resolution.

   DECLARED DISCONTINUITIES: none.
   ========================================================================= */
import { transfer, framesFor, clamp01, TAU } from "../engine/motion.mjs";
import { INK, PAPER, inkLevel, lerp } from "../engine/halfworld-engine.mjs";
import { occupancyAt } from "../engine/blocking.mjs";
import { theFacility } from "./_plans/the-facility.mjs";
import { makeLens, NW, NH } from "../assets/set/_facility-lens.mjs";
import {
  loadingRoomFloor, tiledPool, projectorCart, screenRect, beamWedge, tubeBank,
} from "../assets/set/_facility.mjs";
import { exitFacilityOccupancy as INITIAL_FROM_BF37 } from "./BF-37.mjs";

/* ---- the motion scene contract ------------------------------------------ */
export const id         = "BF-38";
export const title      = "A FRAME TOO SMALL TO CONTAIN IT";
export const place      = "INT. REARING FACILITY · DARKNESS";
export const plan       = "the-facility";
export const motion     = "TRANSFER";
export const beats      = null;
export const seconds    = 5.5;
export const loopClosed = false;
export const frames     = framesFor(motion, seconds, 12);      // 66
export const declaredBreak = null;

export const subject    = "scales crossing a beam, each one briefly a frame";
export const distance   = "MEDIUM";
export const leftOut    = [
  "Mara. She is at mara_pool_north in the dark and this unit is not about her " +
  "looking at anything; the next one is",
  "the chrysalis wall. It is behind the beam and unlit, and 225 objects in a " +
  "dark frame is not darkness",
  "the tubes' going out. That is an instant and an instant is a BREAK; this " +
  "unit's motion is TRANSFER, so the tubes are already dead when it opens",
  "9,820 of the thousands of scales",
];

/* ---- the lens ------------------------------------------------------------ */
/* dx +110: at dx 0 the sheet sits at px -138..178 and five sixths of the
   thing the beam is landing ON is outside the frame. */
const lens = makeLens(theFacility, { centre: "beam_over_pool", zoom: 1.65, dy: 210, dx: 110 });
const LENS_PT = lens("projector_lens"), CART = lens("projector_cart");
const SCREEN = lens("screen_waiting");
const P_N = lens("pool_edge_north"), P_S = lens("pool_edge_south");
const P_W = lens("pool_edge_west"),  P_E = lens("pool_edge_east");

const SWID = 316, SHGT = 250;
const SRECT = { x: SCREEN.px - SWID / 2, y: SCREEN.py - SHGT, w: SWID, h: SHGT };

/* the beam's two edges, as a line the carriers cross */
const BEAM_A = { x: LENS_PT.px - 44, y: LENS_PT.py - 104 };
const BEAM_TOP = SRECT.y - 6, BEAM_BOT = SRECT.y + SRECT.h + 8;

const N_SCALES = 180;

/* ============================================================ at(u) ======== */
export function at(u, _ctx) {
  /* the carriers. stagger 0.62 so that at any instant some are at the source,
     some in flight and some arrived — a current rather than a volley. */
  const car = transfer(u, N_SCALES, { stagger: 0.62, seed: 20250804 });
  return { u, car, ripple: u, spin: u * 2 };
}

/* ============================================================ draw() ======= */
export function draw(g, W, H, s) {
  g.save();
  g.scale(W / NW, H / NH);
  g.lineJoin = "round"; g.lineCap = "round";

  /* the room, dark. L(3) — dark enough to be a dark room, light enough that the
     post pass does not turn it into a printing fault. */
  g.fillStyle = inkLevel(3); g.fillRect(0, 0, NW, NH);
  loadingRoomFloor(g, { x0: -10, x1: NW + 10, horizon: P_N.py - 150, bottom: NH, seed: 37 });
  g.fillStyle = inkLevel(3); g.fillRect(0, P_N.py - 150, NW, NH - (P_N.py - 150));

  /* THE DEAD TUBES. Level 3 cylinders in level 4 fittings and no pins. They are
     drawn because a room that has just lost its light is not the same picture as
     a room that never had any. */
  tubeBank(g, ["tube_bank_west", "tube_bank_centre", "tube_bank_east"]
    .map((n) => { const p = lens(n); return [p.px - 96, p.px + 96]; }),
    { y: 92, on: false });

  /* THE BEAM. The only light in the room, crossing it laterally over the pool
     exactly where the plan's `the_beam` fixture puts it. */
  beamWedge(g, BEAM_A.x, BEAM_A.y, SRECT.x + SRECT.w + 4, BEAM_TOP, BEAM_BOT,
            { level: 1, edge: true });

  screenRect(g, SRECT.x, SRECT.y, SRECT.w, SRECT.h, { sag: 6 });

  /* the pool, under the beam. Almost unlit: what it has is the beam's reflection
     off its surface, which is the only mark in it. */
  g.save();
  g.globalAlpha = 1;
  tiledPool(g, {
    cx: (P_W.px + P_E.px) / 2, farY: P_N.py, nearY: P_S.py,
    farW: (P_E.px - P_W.px) * 0.86, nearW: (P_E.px - P_W.px) * 1.20,
    ripple: s.ripple, level: 4, seed: 101,
  });
  g.restore();

  projectorCart(g, CART.px, CART.py - 104 * 0.86, 0.86,
                { on: true, power: true, spin: s.spin, threaded: false });

  /* ======================= THE SCALES =======================
     Each carrier crosses the beam from the lens end toward the sheet. Its
     position along the beam is `k`; its position ACROSS the beam is a slow
     current, deterministic per carrier, plus transfer()'s own wobble.

     A speck at the ends. A FRAME at the middle. Never anything in between. */
  const beamLen = (SRECT.x + SRECT.w) - BEAM_A.x;
  for (const c of s.car) {
    const gy = ((c.i * 0.6180339887) % 1);          // its lane across the beam
    const drift2 = ((c.i * 0.7548776662) % 1) - 0.5;
    const k = c.k;
    const x = BEAM_A.x + beamLen * k;
    /* the beam is a wedge, so a lane is a FRACTION of it and the carriers
       spread apart as they cross — which is the whole reason the far end of a
       beam is the one you can see anything in. */
    const halfA = 8, halfB = (BEAM_BOT - BEAM_TOP) / 2;
    const half = lerp(halfA, halfB, k);
    const cy = lerp(BEAM_A.y, (BEAM_TOP + BEAM_BOT) / 2, k)
             + (gy - 0.5) * 2 * half * 0.92
             + Math.sin((s.u + c.i * 0.13) * TAU) * half * 0.06
             + c.wobble * 4 * drift2;

    if (c.at === "source" || c.at === "target") continue;

    /* THE PEAK. transfer()'s ink runs 1 -> 1.9 -> 1 across the crossing and
       peaks exactly at the midpoint. Above 1.62 the carrier is a FRAME. */
    if (c.ink > 1.62) {
      const fw = 12, fh = 9;
      g.fillStyle = PAPER;
      g.fillRect(x - fw / 2, cy - fh / 2, fw, fh);
      g.strokeStyle = INK; g.lineWidth = 2.4;
      g.strokeRect(x - fw / 2, cy - fh / 2, fw, fh);
      // one perforation. It is what makes 12 x 9 pixels a frame and not a chip.
      g.fillStyle = INK;
      g.fillRect(x - fw * 0.42, cy - fh * 0.62, fw * 0.26, fh * 0.22);
    } else {
      // a speck. Dark on the light beam, and it never gets darker than this.
      g.fillStyle = inkLevel(c.ink > 1.3 ? 4 : 6);
      const r = 1.7 + c.ink * 0.9;
      g.beginPath(); g.ellipse(x, cy, r * 1.5, r, 0.4, 0, TAU); g.fill();
    }
  }

  g.restore();
}

/* ---- occupancy ----------------------------------------------------------- */
export const INITIAL = INITIAL_FROM_BF37;
export const MOVES   = [];
export const exitOccupancy = occupancyAt(theFacility, MOVES, 6, INITIAL);

export const SCENE_VERSION = "bf-motion/1.0.0";
