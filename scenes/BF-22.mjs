/* ============================================================================
   BF-22 · THE SCAR              INT. MILL · THE LOBBY              the-mill

     "Iona catches Mara's wrist. Her hand is unexpectedly strong. At the base of
      her thumb is a scar: a broken circle crossed by a crooked line."
                                                          — atlas/source.json
     IONA: "The first time you see it, you will think the picture is remembering
            the event. The second time, you will think the event was arranged to
            resemble the picture. Do not watch it a third time."
     MARA: "Why?"   IONA: "Because then you will remember being there."

   MOTION: HOLD · 5.0s · 60 frames @12fps.

   ---------------------------------------------------------------------------
   THE MARK IS IMPORTED, NOT DRAWN.

   MOTION-BRIEF rule 5: "The broken circle is authored once, in brokenCircle().
   The flight path, the pen mark on the photograph, the scar at the base of
   Iona's thumb, the wing marking, and the new paint on the plywood are provably
   the same shape. Do not redraw it. Import it."

   So this scene draws no mark. It asks assets/character/iona.mjs for her `scar`
   state — `{ view: "hand" }` — and her module calls paintMark() from
   assets/_broken-circle.mjs, which lays down the array engine/motion.mjs'
   brokenCircle() returns. The scene's only decision about the shape is how big
   the hand is, and her module already made the argument for that: "on a hand at
   full-figure size it is about twenty pixels across, which is at the edge of
   what the dot lattice will hold — hence the `scar` state, which frames the
   hand alone at a size where the world's central shape is legible."

   Here the hand box is 900px, which puts the mark at 180px. BF-24's wing
   marking, BF-28's fresh paint and this are the same array at three sizes.

   ---------------------------------------------------------------------------
   UNEXPECTEDLY STRONG, AS A HOLD.

   The grip closes once, over the first fifth, and then does not release: after
   u = 0.20 the only thing left is a fine tremor at 1.4px and hold()'s 4.1s
   breath. That is what "unexpectedly strong" is as motion — not a squeeze that
   pulses, which would read as effort, but a hand that arrives at a pressure and
   stays there while an old woman says three sentences. The tremor is deniable;
   the absence of release is not.

   MARA'S WRIST is declared overpaint: one forearm cylinder crossing under the
   grip, drawn BEFORE the hand, in the same two-value law _hands.mjs uses. Her
   own module cannot supply it — figure-hero draws a wrist as a feature of a
   body and there is no body in this frame.

   DECLARED DISCONTINUITIES: none.

   COMPOSITION. One subject: the scar at the base of her thumb.
   ========================================================================= */
import { hold, framesFor, clamp01 } from "../engine/motion.mjs";
import { INK, gray, lerp, smooth } from "../engine/halfworld-engine.mjs";
import { occupancyAt } from "../engine/blocking.mjs";
import { theMill } from "./_plans/the-mill.mjs";
import { lens, NW, NH, BODY_H } from "../assets/set/_stage.mjs";
import { SURFACE } from "../assets/character/_rig.mjs";
import { LV, brokenLine } from "../assets/set/_kit.mjs";
import { exitOccupancy as exitOccupancyBF21 } from "./BF-21.mjs";
import iona from "../assets/character/iona.mjs";

export const id         = "BF-22";
export const title      = "THE SCAR";
export const place      = "INT. MILL · THE LOBBY";
export const plan       = "the-mill";
export const motion     = "HOLD";
export const beats      = null;
export const seconds    = 5.0;
export const loopClosed = false;
export const frames     = framesFor(motion, seconds, 12);      // 60
export const declaredBreak = null;
export const breakAt    = null;

export const subject  = "the broken circle at the base of Iona's thumb";
export const distance = "CLOSE";
export const leftOut  = [
  "both faces, and the three sentences that are the reason the unit exists",
  "Niko, who is in the room and is not part of this",
  "the canister, which is on the floor behind this and belongs to BF-21 and BF-23",
  "the lobby: at this crop there is one stone joint and nothing else",
];

/* ---- framing ------------------------------------------------------------ */
const ZOOM = 9.0;
const station = lens(theMill, { zoom: ZOOM, cx: 0.5555, cy: 0.8596 });
const GRIP  = station("iona_grip");
const WRIST = station("mara_wrist_caught");
/* the hand box. Her module draws the hand at R = W*0.30 of whatever box it is
   given and puts the scar at (0.335, 0.505) of it, so the box width IS the
   decision about whether the world's central shape survives the lattice. */
const HAND_W = 980, HAND_H = 680;

/* ============================================================ at(u) ======== */
export function at(u, _ctx) {
  const h = hold(u, { breathSec: 4.1, dur: seconds });
  return {
    u,
    // it closes once and does not let go
    grip: smooth(clamp01(u / 0.20)),
    // and then a fine tremor: 1.4px, which is under a dot
    tremor: Math.sin(u * Math.PI * 2 * 9.0) * 1.4,
    breath: h.breath, tilt: h.tilt, weight: h.weight,
  };
}

/* ============================================================ draw() ======= */
export function draw(g, W, H, s) {
  g.save();
  g.scale(W / NW, H / NH);
  g.lineJoin = "round"; g.lineCap = "round";

  /* ---- one stone joint, a long way below. Nothing else is in this frame. */
  brokenLine(g, -20, NW + 20, NH - 46, 57, { lw: 4.4, segs: 3, gap: 0.05, color: LV(2) });

  const dy = s.breath * 4 - 2 + s.tremor, dx = s.weight * 3;

  /* ---- MARA'S WRIST, under the grip. Declared overpaint: one cylinder, two
     values, entering from the lower left and leaving at the upper right. It is
     caught, so it does not continue past the hand — it stops inside it. */
  wrist(g, WRIST.x + dx * 0.4, WRIST.y + dy * 0.4);

  /* ---- IONA'S HAND, and the mark. Her module owns both. The grip closes by
     squeezing the whole hand 3% and rolling it 0.02 rad — the smallest change
     that reads as pressure without turning into a pulse. */
  g.save();
  g.translate(GRIP.x + dx, GRIP.y + dy);
  g.rotate(-0.02 * s.grip);
  const k = 1 - 0.03 * s.grip;
  g.scale(k, k);
  g.translate(-HAND_W / 2, -HAND_H / 2);
  iona.draw(g, HAND_W, HAND_H, { ...iona.states.nodes.scar.preview });
  g.restore();

  g.restore();
}

/* ---- the caught wrist ---------------------------------------------------
   One swept cylinder with an ink contour and a lighter core, the same two-value
   law assets/set/_hands.mjs uses for a forearm, so the two limbs in this frame
   belong to one drawing. Mara's skin, not Iona's: SURFACE keeps them one step
   apart and that step is the whole difference between 34 and 88 here. */
function wrist(g, x, y) {
  /* PASS 2: the sleeve was gray(0x9a) at 96px with a 10px ink rim, and the
     whole forearm printed as a dark plank running diagonally across a pale
     hand — the heaviest object in a frame whose subject is a 130px scar. A
     forearm under a hand is the LIGHT thing; the hand is on top of it. */
  const R = 74;
  const ax = x - R * 2.6, ay = y + R * 2.8;
  const bx = x + R * 0.9, by = y - R * 0.5;
  g.save();
  g.lineCap = "round";
  g.strokeStyle = INK; g.lineWidth = R * 1.00 + 8;
  g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
  g.strokeStyle = SURFACE.skin; g.lineWidth = R * 1.00;
  g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
  // the cuff it comes out of: one band, level 2, and it stops well short
  g.strokeStyle = INK; g.lineWidth = R * 1.00 + 8;
  g.beginPath(); g.moveTo(ax, ay); g.lineTo(ax + R * 0.42, ay - R * 0.45); g.stroke();
  g.strokeStyle = LV(2); g.lineWidth = R * 1.00;
  g.beginPath(); g.moveTo(ax, ay); g.lineTo(ax + R * 0.42, ay - R * 0.45); g.stroke();
  // the tendon on the inside of the forearm
  g.strokeStyle = LV(3); g.lineWidth = 4;
  g.beginPath();
  g.moveTo(ax + R * 1.0, ay - R * 1.05); g.lineTo(bx - R * 0.4, by + R * 0.2);
  g.stroke();
  g.restore();
}

/* ---- occupancy ----------------------------------------------------------
   No blocking: iona_grip and mara_wrist_caught are a CONTACT PAIR reached by
   two arms, and the plan authors no move to them because neither body's feet
   leave the station they are standing on. */
export const INITIAL = exitOccupancyBF21;
export const MOVES   = [];
export const exitOccupancy = occupancyAt(theMill, MOVES, 5, INITIAL);

export const SCENE_VERSION = "bf-motion/1.0.0";
