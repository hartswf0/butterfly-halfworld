/* ============================================================================
   BF-12 · THE CRESCENT         INT. LABORATORY · THE VIAL — CONTINUOUS
                                                        plan: the-laboratory

     "One hindwing is damaged. A small crescent has been removed from its edge,
      as neatly as if cut with a punch."
     "Through the missing portion, the white card behind shows with impossible
      brightness."
     "There is nothing sharp in the maze."               — atlas/source.json

     NIKO: "Was that there before?"   MARA: "No."

   MOTION: BREAK · 4.0s · 48 frames @12fps · loopClosed: false.
   DECLARED BREAK: u = 0.5 — frame 24 of 48, exactly.

   ---------------------------------------------------------------------------
   THE ONLY DISCONTINUITY THIS WORLD PERMITS, AND IT IS ONE FRAME WIDE.

   MOTION-BRIEF rule 4: "Declare your BREAK. One instant, stated in the header.
   An undeclared discontinuity is a bug." So:

       frames  0..23   (u < .5)    the hindwing is INTACT
       frames 24..47   (u >= .5)   a crescent is GONE, and the card shows

   Nothing eases across that line. There is no easing IN — no thinning of the
   margin, no crack propagating, no anticipation — and there is no easing OUT:
   the hole does not open, does not settle, does not decay. It is absent and
   then it is present. brk(u, 0.5) supplies `before` and `after` and this scene
   uses NOTHING else from it: `sinceBreak` is deliberately not read, because any
   use of it would be a ramp, and a ramp is the thing the text rules out with
   "as neatly as if cut with a punch."

   WHAT DOES CONTINUE ACROSS THE BREAK is the animal's breathing — the slow
   open-and-close of a papilionid at rest, which creature/swallowtail.mjs calls
   its only visible respiration. It runs at the same amplitude and the same
   phase on both sides. That is the point: the body did not react. Nobody in
   the room saw it happen and neither does the animal.

   ---------------------------------------------------------------------------
   THE HOLE IS DRAWN BY THE ASSET, NOT BY THIS FILE.

   creature/swallowtail.mjs builds two figures from ONE spec — `fig` with
   crescent 0 and `cut` with crescent 1 — so that, in its own words, "BF-12's
   'Was that there before?' is answerable by diffing one number rather than by
   comparing two drawings." This scene therefore flips one boolean, `cut`, at
   u = 0.5 and touches nothing else about the animal. The punch, its hard edge
   and its #ffffff fill are the asset's, authored once.

   IMPOSSIBLE BRIGHTNESS. The asset fills the crescent pure white. In an eight-
   level world pure white is level 0 and there is nothing above it — the missing
   portion is literally the brightest value the world can print, and it is
   brighter than the vial, the card, and the paper the frame is drawn on,
   because those all carry at least a dot. "Impossible" is not an effect here;
   it is the top of the ladder, and the ladder has a top.

   NOTHING SHARP IN THE MAZE. There is nothing sharp in this frame either. The
   only hard-edged circle in it is the absence.

   DECLARED DISCONTINUITIES: one, at u = 0.5, exported as `breakAt` (which the
   harness reads) and as `declaredBreak`.
   ========================================================================= */
import { brk, framesFor, clamp01, TAU } from "../engine/motion.mjs";
import { INK, inkLevel, placeInstance } from "../engine/halfworld-engine.mjs";
import { occupancyAt } from "../engine/blocking.mjs";
import { vial } from "../assets/set/_lab.mjs";
import { brokenLine } from "../assets/set/_kit.mjs";
import { theLaboratory } from "./_plans/the-laboratory.mjs";
import { exitOccupancy as EXIT_BF11 } from "./BF-11.mjs";
import swallowtail from "../assets/creature/swallowtail.mjs";

export const id         = "BF-12";
export const title      = "THE CRESCENT";
export const place      = "INT. LABORATORY · THE VIAL";
export const plan       = "the-laboratory";
export const motion     = "BREAK";
export const beats      = null;
export const seconds    = 4.0;
export const loopClosed = false;
export const frames     = framesFor(motion, seconds, 12);     // 48
export const breakAt       = 0.5;      // the harness reads this
export const declaredBreak = 0.5;      // SCENE-BRIEF's name for the same number

export const subject  = "a crescent that was not there, and the card behind it";
export const distance = "CLOSE";
export const leftOut  = [
  "both speakers — two lines of dialogue, four words, over the evidence",
  "the recovery rack — BF-14 is the rack; this is the vial in the hand that is " +
  "about to set it into one",
  "the maze, in which there is nothing sharp",
];

/* ============================================================ at(u) ========
   PURE, and the only thing that crosses u = 0.5 is a boolean. */
export function at(u, _ctx) {
  const uu = clamp01(u);
  const b = brk(uu, breakAt);
  // the animal's own respiration — identical either side of the break, because
  // it did not notice and neither did anyone else
  /* PRESENTING THE HINDWING. The crescent is cut from the hindwing's edge, and
     _lepidoptera's wingXform folds span onto the vertical as closure -> 1, so
     at 0.90 (pass 1) the damaged wing was edge on and the hole was four pixels
     of white inside a black blade. At 0.50 the hindwing is 71% of its open
     span and the punch is a punch. The animal in a vial is at rest, not
     closed; nothing in the text says otherwise. */
  const breathe = 0.50 + 0.06 * Math.sin(uu * TAU);
  return {
    u: uu,
    cut: b.after,                       // false, then true. One frame. No ramp.
    before: b.before,
    closure: breathe,
    tilt: 0.06 + 0.018 * Math.sin(uu * TAU * 1.0),
    wear: 0.34,                          // it has been doing this since BF-01
  };
}

/* ============================================================ draw() ======= */
const NW = 1120, NH = 760;
const VX = 556, VBASE = 636, VW = 176, VH = 470;

export function draw(g, W, H, s) {
  g.save();
  g.scale(W / NW, H / NH);
  g.lineJoin = "round"; g.lineCap = "round";

  backdrop(g);
  whiteCard(g);
  // the glass first, then the animal inside it, then the near wall of the
  // glass as two highlights: the animal is IN the vial, not in front of it
  const v = vial(g, VX, VBASE, VW, VH, { level: 1, lw: 5.0, stopper: true });

  placeInstance(g, NW, NH, swallowtail, {
    anchor: { x: VX / NW, y: (VBASE - VW * 0.30 - 34) / NH },
    // 0.44, not 0.66: at 0.66 the wings overhung the glass on both sides and the
    // animal read as being in front of the vial rather than in it.
    scale: 0.44,
    state: { closure: s.closure, tilt: s.tilt, wear: s.wear, cut: s.cut, key: true },
  });

  glassHighlights(g, v);
  g.restore();
}

/* the field is level 2, NOT paper. The unit's second sentence is about
   IMPOSSIBLE BRIGHTNESS, and brightness is a comparison: on a paper field the
   white card and the white crescent were the same value as the page and the
   break was invisible. Level 2 behind, level 0 through the hole — that is the
   whole distance the ladder has, spent here. */
function backdrop(g) {
  g.fillStyle = inkLevel(2); g.fillRect(0, 0, NW, NH);
  g.fillStyle = inkLevel(3); g.fillRect(0, 636, NW, NH - 636);
  brokenLine(g, -30, NW + 30, 636, 641, { lw: 4.6, segs: 3, gap: 0.06 });
}

/* THE WHITE CARD. `white_card_behind` in the plan. Level 0 with a hard edge —
   and the crescent, when it comes, is the same value with nothing between it
   and the eye. The card is what makes the hole visible and it is placed before
   the break so it cannot be read as arriving with it. */
function whiteCard(g) {
  g.fillStyle = "#ffffff";
  g.fillRect(268, 78, 584, 570);
  g.strokeStyle = INK; g.lineWidth = 4.2;
  g.strokeRect(268, 78, 584, 570);
}

/* two short highlights on the near wall of the glass. Broken, so the cylinder
   does not become a pair of bars. */
function glassHighlights(g, v) {
  g.strokeStyle = inkLevel(3); g.lineWidth = 5;
  g.beginPath();
  g.moveTo(v.cx - v.w * 0.62, v.top + v.ry * 2.4);
  g.lineTo(v.cx - v.w * 0.62, v.top + v.ry * 2.4 + VH * 0.34);
  g.moveTo(v.cx + v.w * 0.70, v.top + v.ry * 4.2);
  g.lineTo(v.cx + v.w * 0.70, v.top + v.ry * 4.2 + VH * 0.20);
  g.stroke();
}

/* ============================================================ occupancy ==== */
export const INITIAL = EXIT_BF11;
export const MOVES   = [];
export const exitOccupancy = occupancyAt(theLaboratory, MOVES, 6, INITIAL);

export const SCENE_VERSION = "bf-motion/1.0.0";
