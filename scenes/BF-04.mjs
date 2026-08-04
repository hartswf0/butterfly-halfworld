/* ============================================================================
   BF-04 · SIX POINTS        INT. LABORATORY · THE BENCH — CONTINUOUS
                                                        plan: the-laboratory

     "The butterfly passes over her wrist before she can lower the vial."
     "Its feet touch her skin: not pressure but arrangement — six points
      becoming twelve, twelve becoming none."
     "It lifts and strikes the ceiling once more. A yellow powder remains on
      her glove."                                       — atlas/source.json

   MOTION: TRANSFER · 4.5s · 54 frames @12fps · loopClosed: false.

   ---------------------------------------------------------------------------
   "NOT PRESSURE BUT ARRANGEMENT" IS AN INSTRUCTION ABOUT DRAWING.

   Pressure would be a dent in the skin, a shadow, a give. There is none of
   that here. What lands is a SET OF POINTS, and the sentence counts them:
   six, then twelve, then none. So transfer(u, 6) carries six tarsi from the
   animal to the skin — each one at the animal, or in flight, or on her, never
   blended — and then each landed foot SPLITS, because a butterfly's tarsus has
   a pair of claws and the second mark of each pair only appears once weight is
   on it. Six becoming twelve is not a doubling effect; it is the second claw.

   And then none. Not a fade — MOTION-BRIEF forbids that and there is no alpha
   here anyway. The animal lifts, and a point that is not being stood on is
   simply not there. The marks are gone in one frame, on the frame the feet
   leave, which is the same instant in the text.

   WHAT REMAINS IS ON THE GLOVE, NOT ON THE SKIN. The last beat leaves powder,
   and it leaves it in the one place the sentence puts it. Those marks stay to
   the end of the loop and they are ink on a light glove, which in a one-accent
   world is the same statement as yellow on white. They are the seed of BF-07,
   where the same substance comes through a puncture and is rubbed and
   brightens.

   ---------------------------------------------------------------------------
   DRAWN IN SCENE SPACE, AND WHY THAT IS NOT A BREACH OF THE PLAN.
   `mara_wrist_in_box` and `swallowtail_over_wrist` are a CONTACT PAIR six
   thousandths of the room apart. There is no lens that makes a wrist fill a
   frame and still shows the bench it is over; SCENE-BRIEF §3 says a plan is a
   map, not a shot list. So the plan decides WHERE this happens and which
   bodies are in contact — it is used, below, for the occupancy chain — and the
   frame is a forearm. Same for BF-07, BF-09, BF-10 and BF-12.

   DECLARED DISCONTINUITIES: none. The feet arriving and leaving are per-carrier
   events inside a continuous transfer, not a BREAK: at every u the drawing is
   a pure function of u and nothing jumps that was not already at its target.
   ========================================================================= */
import { transfer, framesFor, clamp01, TAU } from "../engine/motion.mjs";
import { INK, inkLevel, smooth, lerp, placeInstance } from "../engine/halfworld-engine.mjs";
import { occupancyAt } from "../engine/blocking.mjs";
import { brokenLine, speckle } from "../assets/set/_kit.mjs";
import { theLaboratory, MOVES_BF04 } from "./_plans/the-laboratory.mjs";
import { exitOccupancy as EXIT_BF03 } from "./BF-03.mjs";
import swallowtail from "../assets/creature/swallowtail.mjs";

export const id         = "BF-04";
export const title      = "SIX POINTS";
export const place      = "INT. LABORATORY · THE BENCH";
export const plan       = "the-laboratory";
export const motion     = "TRANSFER";
export const beats      = null;
export const seconds    = 4.5;
export const loopClosed = false;
export const frames     = framesFor(motion, seconds, 12);     // 54
export const declaredBreak = null;

export const subject  = "six feet arriving on the skin of her wrist";
export const distance = "CLOSE";
export const leftOut  = [
  "the rest of Mara — at this distance the frame is a forearm; her face is a " +
  "different scene and BF-07 is it",
  "the vial she cannot get lowered — it is at vial_in_glove, off the near edge, " +
  "and drawing it would make the shot about the thing she failed to do rather " +
  "than about the thing that happened to her instead",
  "the box, the bench, the maze, the room",
];

/* the six tarsi, in the order they come down: middle pair first, then front,
   then rear — which is how an alighting papilionid actually does it. */
const FEET = [
  { x: -0.16, y: 0.02, from: [-0.30, -0.62] },
  { x:  0.14, y: 0.03, from: [ 0.24, -0.60] },
  { x: -0.34, y: -0.06, from: [-0.52, -0.70] },
  { x:  0.32, y: -0.05, from: [ 0.46, -0.68] },
  { x: -0.06, y: 0.13, from: [-0.14, -0.52] },
  { x:  0.24, y: 0.15, from: [ 0.34, -0.50] },
];

const P_LAND  = 0.62;      // all six are down
const P_SPLIT = 0.74;      // twelve
const P_LIFT  = 0.80;      // none
const P_POWDER = 0.86;     // what is left, and where

/* ============================================================ at(u) ======== */
export function at(u, _ctx) {
  const uu = clamp01(u);
  // the six carriers cross once, inside the first 62% of the loop
  const car = transfer(clamp01(uu / P_LAND), 6, { stagger: 0.55, seed: 7 });
  const split = uu < P_SPLIT ? 0 : uu < P_LIFT ? 1 : 0;   // a step, never a ramp
  const gone  = uu >= P_LIFT;
  // the animal: down until it lifts, then up and out of frame toward the lid
  const rise = uu < P_LIFT ? 0 : smooth((uu - P_LIFT) / (1 - P_LIFT));
  return {
    u: uu, car, split, gone, rise,
    bug: {
      closure: gone ? 0.22 + 0.30 * Math.abs(Math.sin(uu * TAU * 5))
                    : 0.62 - 0.10 * Math.sin(uu * TAU * 2),
      tilt: gone ? -0.16 * rise : 0.02 * Math.sin(uu * TAU * 3),
      wear: uu * 0.20,
    },
    powder: uu < P_POWDER ? 0 : (uu - P_POWDER) / (1 - P_POWDER),
  };
}

/* ============================================================ draw() ======= */
const NW = 1120, NH = 760;
const WX = 560, WY = 452;         // the wrist, in scene space
const WR = 132;                    // half the width of the forearm

export function draw(g, W, H, s) {
  g.save();
  g.scale(W / NW, H / NH);
  g.lineJoin = "round"; g.lineCap = "round";

  backdrop(g);
  forearm(g, s);
  if (!s.gone) feet(g, s);

  placeInstance(g, NW, NH, swallowtail, {
    anchor: { x: (WX + 26) / NW, y: (WY - 26 - s.rise * 300) / NH },
    scale: 0.60,
    state: { closure: s.bug.closure, tilt: s.bug.tilt, wear: s.bug.wear, key: true },
  });

  g.restore();
}

/* the inside of the box: acrylic behind, one broken line for the far floor.
   Almost nothing, because the frame is a wrist. */
function backdrop(g) {
  g.fillStyle = inkLevel(1);
  g.fillRect(0, 0, NW, NH);
  g.fillStyle = inkLevel(0);
  g.fillRect(0, 0, NW, 300);
  brokenLine(g, -40, NW + 40, 300, 909, { lw: 4.2, segs: 3, gap: 0.05 });
  brokenLine(g, -40, NW + 40, 668, 913, { lw: 3.4, segs: 3, gap: 0.06 });
}

/* ---- the forearm ---------------------------------------------------------
   Bare from the glove cuff to the hand: this is the wrist the vial was going
   to be lowered by. Skin is a LIGHT plane (level 2) with a hard contour; the
   only dark things in the frame are the animal, the feet, and the cuff seam. */
function forearm(g, s) {
  g.save();
  g.translate(WX, WY);
  g.rotate(-0.085);

  g.fillStyle = inkLevel(2);
  g.beginPath();
  g.moveTo(-560, -WR * 1.02);
  g.bezierCurveTo(-180, -WR * 0.96, 120, -WR * 0.86, 360, -WR * 0.70);
  g.bezierCurveTo(470, -WR * 0.62, 520, -WR * 0.20, 560, WR * 0.10);
  g.lineTo(560, WR * 1.30);
  g.bezierCurveTo(430, WR * 1.12, 180, WR * 1.02, -120, WR * 1.06);
  g.lineTo(-560, WR * 1.10);
  g.closePath();
  g.fill();
  g.strokeStyle = INK; g.lineWidth = 5.5; g.stroke();

  // the tendon and the two vein lines — the only structure the skin gets
  g.lineWidth = 3.2; g.strokeStyle = inkLevel(5);
  g.beginPath();
  g.moveTo(-360, -WR * 0.30); g.bezierCurveTo(-120, -WR * 0.18, 120, -WR * 0.10, 330, -WR * 0.24);
  g.moveTo(-300, WR * 0.44); g.bezierCurveTo(-60, WR * 0.52, 150, WR * 0.46, 340, WR * 0.24);
  g.stroke();

  // THE GLOVE CUFF, pushed back. Its far edge is where the powder ends up.
  g.fillStyle = inkLevel(1);
  g.beginPath();
  g.moveTo(-560, -WR * 1.03); g.lineTo(-360, -WR * 0.98);
  g.bezierCurveTo(-330, -WR * 0.30, -330, WR * 0.42, -358, WR * 1.07);
  g.lineTo(-560, WR * 1.10); g.closePath();
  g.fill(); g.strokeStyle = INK; g.lineWidth = 5; g.stroke();
  g.lineWidth = 3.6;
  g.beginPath();
  g.moveTo(-430, -WR * 1.00);
  g.bezierCurveTo(-402, -WR * 0.30, -402, WR * 0.42, -428, WR * 1.08);
  g.stroke();

  // the powder. Ink marks on a light glove — the same statement, in one accent.
  if (s.powder > 0) {
    const n = Math.floor(3 + s.powder * 15);
    speckle(g, -530, -WR * 0.86, -372, WR * 0.94, 4471, n, 5.0, 6);
  }
  g.restore();
}

/* ---- the feet ------------------------------------------------------------
   Each carrier is at the animal, in flight, or on the skin. A landed foot is
   ONE mark until u = .74 and TWO from then until the lift, and the second mark
   is a claw and not a copy: it sits outboard and slightly behind. */
function feet(g, s) {
  g.save();
  g.translate(WX, WY);
  g.rotate(-0.085);
  for (const c of s.car) {
    const f = FEET[c.i];
    const tx = f.x * WR * 2.4, ty = f.y * WR;
    const sx = f.from[0] * WR * 2.4, sy = f.from[1] * WR;
    const k = c.k;
    if (k <= 0) continue;                            // still on the animal
    const x = lerp(sx, tx, k), y = lerp(sy, ty, k);
    // ink PEAKS at the crossing midpoint — transfer()'s one aesthetic claim
    const lvl = Math.min(7, Math.round(3 + (c.ink - 1) / 0.9 * 4));
    g.fillStyle = inkLevel(k >= 1 ? 7 : lvl);
    g.beginPath(); g.arc(x, y, k >= 1 ? 6.6 : 5.4, 0, TAU); g.fill();
    // the leg, only while it is in flight or standing: three segments, thin
    if (k > 0.25) {
      g.strokeStyle = INK; g.lineWidth = 3.0;
      g.beginPath();
      g.moveTo(sx * 0.55 + 20, sy * 0.35 - 30);
      g.quadraticCurveTo((sx + x) / 2, (sy + y) / 2 - 22, x, y);
      g.stroke();
    }
    // TWELVE: the second claw, once there is weight on the foot
    if (k >= 1 && s.split) {
      g.fillStyle = inkLevel(7);
      g.beginPath();
      g.arc(x + Math.sign(f.x || 1) * 15, y + 9, 5.0, 0, TAU); g.fill();
    }
  }
  g.restore();
}

/* ============================================================ occupancy ==== */
export const INITIAL = EXIT_BF03;
export const MOVES   = MOVES_BF04;
export const exitOccupancy = occupancyAt(theLaboratory, MOVES, 6, INITIAL);

export const SCENE_VERSION = "bf-motion/1.0.0";
