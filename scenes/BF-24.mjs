/* ============================================================================
   BF-24 · THE MARK DIVIDES            INT. MILL · THE REEL          the-mill

     "Across the left hindwing the scales form a pale broken circle. No line
      crosses it. The butterfly raises its wings. On the right hindwing is the
      line. THE MARK EXISTS ONLY WHEN THE WINGS ARE CLOSED TOGETHER.
      It opens: the symbol divides. It closes: the symbol becomes whole."
                                                          — atlas/source.json
     IONA: "Now you understand why it cannot be photographed."
     NIKO: "Of course it can be photographed."

   MOTION: CYCLE · 2 beats · 4.0s · 48 frames @12fps · loopClosed: FALSE.

   ===========================================================================
   THIS IS THE UNIT THE WHOLE WORLD IS BUILT TO MAKE POSSIBLE, AND IT IS THE
   ONE UNIT WHERE THE SCENE'S JOB IS TO NOT INTERFERE.

   MOTION-BRIEF: "Rendering the mark as a picture. It is the difference between
   two wing states. If it is legible in one frame, you have drawn the wrong
   thing." SCENE-BRIEF: "Import brokenCircle() and let closure do the union."

   Four files already do all of it, and none of them is this one:

     engine/motion.mjs        brokenCircle() returns the points. One array.
     assets/_broken-circle.mjs  maps that array onto a surface, and lets the two
                              SEGMENTS be drawn separately — "segs:['ring'] and
                              segs:['stroke'] are not a convenience, they are the
                              divided mark."
     creature/_lepidoptera.mjs  the projection. At closure 1 "THE X TERM VANISHES
                              FOR BOTH SIDES… The two wings occupy the same place
                              on the paper and the ring on one and the crooked
                              stroke on the other land on top of each other."
     creature/oldbutterfly.mjs  puts ring on the LEFT hindwing and stroke on the
                              RIGHT, both in wing space, and authors `mark`.

   So this file draws NO mark, computes NO union, and adds NO reveal. It calls
   oldbutterfly.motions.mark(u) and gets out of the way. Everything below is
   about WHICH CAMERA and about proving the claim rather than asserting it.

   ---------------------------------------------------------------------------
   THE RECUT: THIS SCENE IS ON THE SECOND CAMERA.

   The first staging of this unit ran on the module's default camera — PHI 55,
   PSI 26, the FLIGHT camera — and reported its own defect honestly: at full
   closure the united ring projected as a 94 x 34px ellipse, 2.7:1 foreshortened,
   so the mark read more clearly DIVIDED than WHOLE. That inverts the text.

   It was never a scene's bug. The flight camera exists so that closed wings do
   not degenerate to a line; it serves BF-01 and the swallowtail and every unit
   where a butterfly is an animal crossing a room. With PSI 26 the chord axis
   projects short at every tilt, so no value of V, cx, cy or tilt makes the
   closed ring circular — solving for equal singular values has no real root.

   _lepidoptera.mjs now offers a second camera, additively, the default
   untouched:

       CAMERA_MARK = { phiDeg: 84, psiDeg: 86 }

   which is a level lens looking at the animal's flank. Measured on the closed
   ring's own basis (span 0.54 x chord 0.62 of the marking patch):

       camera   singular values      aspect       united ring at this scene's V
       FLIGHT   1.0004 / 0.3258      3.07 : 1     90 x 171 px   (94 x 34 at V=460)
       MARK     1.0005 / 0.9885      1.01 : 1     158 x 138 px

   One geometry, two cameras — the same answer the maze reached, where one
   camera deletes height and cannot see the striking and the other deletes
   length so the choice has no extent. Physically it is the obvious thing: to
   photograph a marking on closed wings you look from the side. Which is also
   the joke of the scene, since Niko has just said it can be photographed.

   THE SIDE CAMERA IS NOT ROLLED. `ROLL` is declared in _lepidoptera.mjs as
   "camera roll and nothing more" — it exists to stand the body upright under
   the flight camera. Under the mark camera it would stand a perched butterfly
   on its tail, so this scene subtracts it: tilt = s.tilt - cam.ROLL, which
   leaves the animal's own +/- 0.03 rad of tilt and nothing else. Head to the
   right, wings rising. That is what an animal sitting on a reel looks like from
   the side, and it is the only staging decision in this file.

   ---------------------------------------------------------------------------
   MEASURED, BEFORE DRAWING ANYTHING.

   Separation between corresponding points of the two halves, sampled at the
   four corners and the centre of the marking patch (span .12-.66, chord
   .18-.80) and averaged, in units of V, on the MARK camera — and, in the third
   column, the fraction of the whole convergence that has happened by then:

       closure 0.000   0.0979 V     0%          closure 0.900   0.0203 V   84%
       closure 0.250   0.0918 V     7%          closure 0.955   0.0122 V   93%
       closure 0.500   0.0720 V    28%          closure 0.980   0.0085 V   97%
       closure 0.750   0.0416 V    61%          closure 1.000   0.0055 V  100%

   THE PROFILE IS UNCHANGED BY THE RECUT, and not by luck. The two halves are
   displaced from each other along the world's X axis only —

       X_right - X_left = 2·span·cos(theta) + 2·LEAN·closure·chord

   — so any camera scales the whole profile by the single number |P·e_X| and
   cannot bend it. FLIGHT gives 0.9333, MARK gives 0.1255, and the percentages
   above are identical to the first staging's to the last digit: 28% converged
   at closure 0.5, 84% at 0.9. Monotonic, and half the convergence still falls
   in the last tenth. The mark is not hidden early. It is APART.

   The residual 0.0055 V at full closure is LEAN, the declared fudge in
   _lepidoptera.mjs that keeps the far wing visible ("It is a fudge and it is
   written down"). On a 378px V that is 2px, on a ring 158px across.

   `mark` peaks at closure 0.985, not 1.000, because it is an OPEN cycle and its
   drift takes 0.015 out of the top. At 0.985 the halves are 0.0075 V apart —
   3px — and the ring measures 158 x 138. That is the frame the text calls
   whole, and it is one animal breathing rather than a diagram snapping shut.

   ---------------------------------------------------------------------------
   HOW MANY FRAMES ARE WHOLE. closure = sin(u*pi)^0.7 - wear/2, so at 48 frames
   closure exceeds 0.95 for frames 19 through 29 — eleven of forty-eight, a
   little under a second. The contact sheet samples every third frame, so f21
   and f24 are the whole ones and every other cell is divided.

   WHAT THE SECOND CAMERA COSTS, STATED PLAINLY. It is the flight camera's
   defect turned over. From the side, an OPEN wing is edge-on: at closure 0 the
   span axis projects at 0.1045 of its length, so the flat-open animal is a
   1029 x 80px line and the two halves of the mark are 37px apart on slivers
   20px deep. The text's "It opens: the symbol divides" therefore reads as the
   symbol GOING AWAY rather than as a ring on one wing beside a line on the
   other. The whole state is now right and the open state is poorer, which is
   the correct way round for a unit whose subject is the closed state and whose
   brief says the mark must not be legible in any other frame — but it is a
   cost, and it is written down. See process/scene-BF24-recut.jsonl.

   OPEN, NOT CLOSED. `mark` uses drift 0.06 and the asset says why: "this is a
   living thing: drift means it comes back a little further open than it
   started, so a scene that runs this twice does not get the same two frames."

   DECLARED DISCONTINUITIES: none. Nothing in this unit cuts.

   COMPOSITION. One subject: a symbol that exists only in the difference between
   two states of one animal.
   ========================================================================= */
import { framesFor, clamp01 } from "../engine/motion.mjs";
import { INK, inkLevel, lerp } from "../engine/halfworld-engine.mjs";
import { occupancyAt } from "../engine/blocking.mjs";
import { theMill } from "./_plans/the-mill.mjs";
import { lens, NW, NH, propSize } from "../assets/set/_stage.mjs";
import { filmReel } from "../assets/set/canister.mjs";
import { stoneFloor } from "../assets/set/mill.mjs";
import { LV, brokenLine } from "../assets/set/_kit.mjs";
import { exitOccupancy as exitOccupancyBF23 } from "./BF-23.mjs";
import oldbutterfly from "../assets/creature/oldbutterfly.mjs";
import { makeCamera, CAMERA_MARK } from "../assets/creature/_lepidoptera.mjs";

export const id         = "BF-24";
export const title      = "THE MARK DIVIDES";
export const place      = "INT. MILL · THE REEL";
export const plan       = "the-mill";
export const motion     = "CYCLE";
export const beats      = 2;                        // opens · closes
export const seconds    = 4.0;
export const loopClosed = false;                    // it is alive
export const frames     = framesFor(motion, seconds, 12, beats);   // 48
export const drift      = 0.06;
export const declaredBreak = null;
export const breakAt    = null;

export const subject  = "the broken circle, which exists only when the wings are closed";
export const distance = "CLOSE";
export const leftOut  = [
  "Mara, Iona and Niko — the three of them are watching this and none is in the frame",
  "the argument about whether it can be photographed, which is the unit's dialogue and is not drawable",
  "the canister and the chrysalis (BF-23 owns them)",
  "the lobby: there is one stone joint under the reel and nothing else",
  "any drawing of a WHOLE mark. There is none in this file, at any u.",
];

/* ---- the camera ---------------------------------------------------------
   The only import that distinguishes this scene from every other unit with a
   butterfly in it. The default is untouched and BF-01 still renders to the
   same numbers; this scene simply asks a different question of the same
   geometry. */
const cam = makeCamera(CAMERA_MARK.phiDeg, CAMERA_MARK.psiDeg);

/* ---- framing ------------------------------------------------------------
   THE PLAN CANNOT PUT THE ANIMAL ON THE REEL, and this is the same scale-free
   fact BF-23 measured: oldbutterfly_on_reel sits 3.3 reel-radii from
   reel_on_floor at EVERY zoom, because the object's size and the station
   spacing are both linear in the crop. A contact pair means adjacent on the
   floor; it cannot mean standing on.

   So the lens is centred on the animal's own station and the reel is drawn
   below it, in scene space, in the direction the plan puts it (down and left),
   at the size a palm-width reel actually is. It runs off the bottom edge, which
   is allowed: it is furniture, not a body. */
const ZOOM = 18.0;
const station = lens(theMill, { zoom: ZOOM, cx: 0.5203, cy: 0.8948 });
const ANIMAL = station("oldbutterfly_on_reel");
const R = propSize(ANIMAL, 0.027);                  // 256px: the palm-width reel

/* V, RESIZED FOR THE SECOND CAMERA. V is the half-span in pixels and it is the
   only lever a scene has over the size of the mark.

   On the flight camera V = R*1.80 = 460 was the measured maximum: the closed
   profile is the TALL state there and above ~500 it overran the top of the
   frame. The mark camera transposes the animal — the closed profile is now
   1018 x 411 rather than 314 x 722 — so the binding edge is the WIDTH, and the
   width is set by the antennae forward and the hindwing tails aft: 2.69 V from
   tip to tip. 1120px of frame with a margin the brief insists on ("do not crop
   bodies at the frame edge") gives

       V = R * 1.48 = 378px      animal 1019 x 411 at peak closure,
                                 46px of paper at each end.

   V went UP against the mark, not down: the ring is 158 x 138px here against
   94 x 34 before, because the mark camera spends its pixels on the wing plane
   instead of on foreshortening it. */
const V = R * 1.48;                                 // 378px

/* Where the animal sits. Head right, wings rising out of the top of the body,
   feet just above the reel's rim. Measured off the projected silhouette at
   V=378: x runs -446..+572 about (cx,cy) and y runs -377..+34, so cx sits
   left of centre to balance the antennae and cy sits low. */
const CX = 0.449;
const CY_OFFSET = 0.203;                            // added to the asset's own cy

/* ============================================================ at(u) ========
   PURE, and it is one call. The asset owns the motion; the scene owns nothing
   about the mark at all. */
export function at(u, _ctx) {
  const m = oldbutterfly.motions.mark(u);
  return { u, ...m };
}

/* ============================================================ draw() ======= */
export function draw(g, W, H, s) {
  g.save();
  g.scale(W / NW, H / NH);
  g.lineJoin = "round"; g.lineCap = "round";

  stoneFloor(g, NH * 0.72, NH + 20, -20, NW + 20, { seed: 21, courses: 2 });

  /* ---- the reel it is standing on. Down and left of the animal, per the
     plan's direction, running off the bottom edge. */
  filmReel(g, ANIMAL.x - R * 0.42, NH + R * 0.62, R * 1.35,
    { seed: 23, rings: 6, hollow: 0.32 });

  /* ---- THE ANIMAL. Its own module, its own motion, untouched — and now its
     own camera, handed in rather than assumed. */
  oldbutterfly.draw(g, NW, NH, {
    cam,
    closure: s.closure,
    /* the side camera is not rolled; see the header. What is left is the
       animal's own tilt, +/- 0.03 rad. */
    tilt: s.tilt - cam.ROLL,
    wear: s.wear,
    cx: CX,
    cy: s.cy + CY_OFFSET,
    V,
  });

  g.restore();
}

/* ---- occupancy ---------------------------------------------------------- */
/* CHAIN AUDIT, caught by walking all fourteen INITIALs against the previous
   exitOccupancy: this file had `{ ...exitOccupancyBF23, oldbutterfly:
   "oldbutterfly_on_reel" }`, which OVERWRITES the previous scene's exit instead
   of chaining from it. SCENE-BRIEF S2: exitOccupancy is "never hand-written".
   The animal really does move between BF-23 and BF-24 — it comes up out of the
   coil and onto the reel — so that is a MOVE, and occupancyAt computes it. */
export const INITIAL = exitOccupancyBF23;
export const MOVES   = [
  { who: "oldbutterfly", from: "oldbutterfly_emerge", to: "oldbutterfly_on_reel", t0: 0, t1: 1.2 },
];
export const exitOccupancy = occupancyAt(theMill, MOVES, 4, INITIAL);

export const SCENE_VERSION = "bf-motion/1.0.0";
