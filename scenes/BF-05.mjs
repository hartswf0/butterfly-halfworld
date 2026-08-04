/* ============================================================================
   BF-05 · THE EYES LOOK BACKWARD   INT. LABORATORY · THE PARTITION — CONT.
                                                        plan: the-laboratory

     "The swallowtail settles on the white partition between the two corridors."
     "Its wings close, opening the false eyes on their undersides."
     "The eyes look backward."                          — atlas/source.json

     NIKO: "Trial 6F-19. Non-completion."   MARA: "It completed something."
     NIKO: "It chose the ceiling?"          MARA: "It rejected the premise."

   MOTION: HOLD · 5.0s · 60 frames @12fps · loopClosed: false.

   ---------------------------------------------------------------------------
   THE CLOSING IS OVER BEFORE THE UNIT STARTS, AND THAT IS WHY THIS IS A HOLD.

   "Its wings close" is a completed action in the text — the unit is what is
   TRUE afterwards: an animal on a white wall with two eyes on it that face the
   wrong way. So closure runs from .72 to .86 across the first fifth of the loop
   and then holds, with a tremor of ±0.012 that never lets the frame freeze.
   The false eyes are on the undersides and the undersides are what a closing
   wing presents; the asset draws them from `falseEyes` above closure .45, so
   this scene does not draw an eye. It closes a wing and the eyes are what is
   there.

   WHY .86 AND NOT 1.0, WHICH IS WHAT THE SENTENCE SAYS.
   _lepidoptera.mjs's wingXform maps span onto the vertical axis by sin(closure
   * PI/2), so at closure 1.0 the lateral component is exactly zero and the
   animal is EDGE ON. That is correct physics for a camera at 55 degrees of
   elevation and 26 of azimuth, and it is also unreadable: pass 1 rendered a
   240px black blade with an antenna, and the two false eyes the unit is named
   for were inside it, facing the camera's own axis. At .86 the wings are
   28% of their open span — plainly closed, plainly a butterfly, and the eyes
   are at 75% of their drawn size and pointing where the text says they point.
   The remaining 14% is the cost of having a camera, and it is paid here rather
   than hidden.

   THE PARTITION IS WHITE AND IT IS THE BRIGHTEST THING IN THE WORLD. Pure
   #ffffff, not level 1 — the one surface in this room that gets level 0 — with
   a hard contour, because it is the thing that divides the world into a
   corridor that carries lavender and a corridor that does not, and the animal
   has landed on the divider rather than in either arm. That is the whole
   argument of the dialogue and it is a composition, not a caption.

   THE CAMERA IS IN THE ROOM. The plan is explicit: BF-05 is shot in
   the-laboratory and not in the-maze, "because it is a thing seen from the
   room" — so this is the observation box's own partition at high zoom, through
   acrylic, and not the magnified interior geometry that BF-01 and BF-37 use.
   Same object, and `partition_white_mid` carries the same name in both files.

   DECLARED DISCONTINUITIES: none.
   ========================================================================= */
import { hold, framesFor, clamp01, TAU } from "../engine/motion.mjs";
import { inkLevel, smooth, placeInstance } from "../engine/halfworld-engine.mjs";
import { occupancyAt } from "../engine/blocking.mjs";
import { lens } from "../assets/set/_lens.mjs";
import { room, bench, observationBox, mazeInsideBox, lavender } from "../assets/set/_lab.mjs";
import { theLaboratory } from "./_plans/the-laboratory.mjs";
import { exitOccupancy as EXIT_BF04 } from "./BF-04.mjs";
import swallowtail from "../assets/creature/swallowtail.mjs";

export const id         = "BF-05";
export const title      = "THE EYES LOOK BACKWARD";
export const place      = "INT. LABORATORY · THE PARTITION";
export const plan       = "the-laboratory";
export const motion     = "HOLD";
export const beats      = null;
export const seconds    = 5.0;
export const loopClosed = false;
export const frames     = framesFor(motion, seconds, 12);     // 60
export const declaredBreak = null;

export const subject  = "the closed wings on the white partition, and what is on them";
export const distance = "CLOSE";
export const leftOut  = [
  "Niko and Mara — the four lines of dialogue over this shot are an argument " +
  "about what the frame already shows; putting either speaker in it would make " +
  "the frame illustrate the argument instead of being its evidence",
  "the lid, the ports, the bench, the room beyond the box",
];

/* ============================================================ at(u) ======== */
export function at(u, _ctx) {
  const uu = clamp01(u);
  const h = hold(uu, { breathSec: 4.1, dur: seconds });
  const settle = smooth(clamp01(uu / 0.20));
  return {
    u: uu,
    closure: 0.72 + 0.14 * settle + 0.012 * Math.sin(uu * TAU * 2),
    tilt: 0.030 + h.tilt * 0.020,
    perch: h.breath * 3.0,             // three pixels of weight shift, all loop
    odour: uu,
  };
}

/* ============================================================ draw() ======= */
const NW = 1120, NH = 760;
/* zoom 12.3, and the vertical offset is large because it has to be. At this
   magnification a BODY is 2355px tall and a bench is 1225px of it, so the
   bench top — which is what the box stands on and therefore what has to be in
   frame — sits far above its own ground line. The first pass framed the
   partition's GROUND STATION at 596 and rendered an entirely empty room: every
   object was a thousand pixels off the top edge. `at` names where the station
   goes; the object above it is the scene's problem, and this is the arithmetic
   that solves it. */
const F = lens(theLaboratory, { centre: "partition_white_mid", zoom: 8.8,
                                at: { x: 560, y: 2181 }, W: NW, H: NH });

export function draw(g, W, H, s) {
  g.save();
  g.scale(W / NW, H / NH);
  g.lineJoin = "round"; g.lineCap = "round";

  room(g, F, { z0: 0.30, z1: 0.95, joints: false, ceiling: false, wallLevel: 1 });
  const bt = bench(g, F);
  const box = observationBox(g, F, { baseY: bt.topY, ports: false });
  const mz = mazeInsideBox(g, F, box);
  lavender(g, F, s.odour, {
    x: mz.lavenderX, y: mz.floorY - box.bh * 0.10, h: box.bh * 0.42,
    count: 11, rise: 1.0, level: 4,
  });

  // the animal, on the top of the partition, wings closed
  placeInstance(g, NW, NH, swallowtail, {
    // placeInstance anchors at the BASE of the measured ink, so this is the
    // animal's feet on the top edge of the partition. Pass 1 put the feet at
    // y = 86 and the body went off the top of the frame.
    anchor: { x: mz.x / NW, y: (mz.top + 8 + s.perch) / NH },
    scale: 0.42,
    state: { closure: s.closure, tilt: s.tilt, key: true },
  });

  g.restore();
}

/* ============================================================ occupancy ====
   No MOVES. The plan does not block this unit and neither does the scene: an
   animal that has settled is the subject, and a body crossing the room behind
   it would be a second one. */
export const INITIAL = EXIT_BF04;
export const MOVES   = [];
export const exitOccupancy = occupancyAt(theLaboratory, MOVES, 6, INITIAL);

export const SCENE_VERSION = "bf-motion/1.0.0";
