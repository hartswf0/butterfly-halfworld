/* ============================================================================
   BF-23 · A NEST OF ITS OWN HISTORY   INT. MILL · THE OPEN CANISTER  the-mill

     "Inside: a coil of 8mm film wrapped in waxed paper, and a dry chrysalis
      resting in the hollow centre of the reel. Larger than any swallowtail
      chrysalis Mara has seen. Split along one side. Empty.
      A black leg appears beneath the film, withdraws, appears again.
      The butterfly pushes upward through a nest of its own discarded history."
                                                          — atlas/source.json

   MOTION: CYCLE · 3 beats · 4.5s · 54 frames @12fps · loopClosed: FALSE.

   ---------------------------------------------------------------------------
   ALIVE, SO THE LOOP IS OPEN. Two units ago the same object was authored
   loop:true, because it was sealed and all we had was a schedule. The lid is
   off now and the same argument runs the other way: MOTION-BRIEF, "Never
   animate a living thing as a closed cycle."

   THE CYCLE IS THE SENTENCE. "A black leg APPEARS beneath the film, WITHDRAWS,
   APPEARS AGAIN." Three beats, and the third is not the first: each push
   reaches higher than the last and each withdrawal gives back less than it
   took. That is cycle({ closed:false, drift }) doing exactly what it is for.

   ---------------------------------------------------------------------------
   THE ASSET'S `emerging`, AND THE ONE THING I DID NOT TAKE FROM IT.

   creature.oldbutterfly authors `emerging` and its header says what it is: "One
   -shot, not a loop. Three pushes, each higher than the last, each followed by a
   withdrawal that does not give back all of it… The wings stay shut the whole
   way: they are not dry yet."

   Everything about the animal comes from that call — closure, tilt, wear, and
   the push rhythm sin(within*pi)^1.6. The vertical does not, and the reason is
   measured. `emerging` returns cy = 0.70 - gained*0.20 with gained = (beat +
   push*0.7)/3, so across one revolution it climbs 0.133 of the frame and never
   comes back: at u -> 1 it sits 101px above where it sat at u = 0. Rendered as
   authored, the wrap is a 101px jump and the renderer calls it a DISCONTINUITY,
   which it is. A one-shot is a correct thing for a creature module to export
   and a wrong thing to loop.

   So the vertical is authored HERE, in scene space, off the asset's own push:
   base minus push*amp, plus a permanent gain of 2px per revolution. The three
   pushes still climb, the animal still ends each revolution higher than it
   began, and the wrap becomes a drift instead of a hop.

   BOTH VERSIONS WERE RENDERED. Control, with the asset's cy verbatim:
   wrap 2.2007% vs mean step 1.0135%, RATIO 2.171 — "open drift at the wrap".
   As authored here: wrap 1.5117% vs mean step 1.4019%, RATIO 1.078 — "seamless".
   The control is inside the band the renderer says is expected for
   loopClosed:false, so it is not a failure; it is a 101px hop that is honest
   about being one. 1.078 is BF-01's own standard for an open cycle instead —
   "measurable, not watchable… a handful of pixels over the cycle" — and that is
   the register the rest of this act is in. The deviation is one channel of five
   and both numbers are on the record.

   ONE PLACE WHERE THE PLAN IS NOT THE ANSWER, AND WHY.

   the-mill authors reel_on_floor and chrysalis_in_reel as a CONTACT PAIR, and a
   contact pair is two stations a hand's width apart — which is what the plan
   verifier's separation check requires and what blocking needs. Measured, the
   chrysalis station sits 1.20 R from the reel's centre and the animal's sits at
   1.16 R, where R is the reel's own half-width. Both are OUTSIDE the rim, at
   every zoom: the ratio is scale-free, because the object's size and the station
   spacing are both linear in the crop.

   The text says the chrysalis is "resting in the HOLLOW CENTRE of the reel". A
   plan cannot express inside-an-object; its stations mean adjacent-on-the-floor,
   and at a 8x crop that resolves to inside. So the chrysalis is drawn in the
   hollow the reel actually has, and the plan's pair keeps its job, which is to
   let blocking name two things and the verifier separate them.

   The ANIMAL keeps its station. 1.16 R is the rim, and "a black leg appears
   BENEATH THE FILM" is a thing that happens at the edge of a coil, not at its
   axis. There the plan and the sentence agree and nothing needed deciding.

   THE CHRYSALIS TAKES NO TIME ARGUMENT. MOTION-BRIEF: "Making the empty
   chrysalides move like they contain something. They are empty." It is drawn by
   assets/set/canister.mjs' chrysalis(), which has no u parameter at all — it is
   the only still object in an animated world, on purpose.

   DECLARED DISCONTINUITIES: none.

   COMPOSITION. One subject: a black leg pushing up through a coil of film.
   ========================================================================= */
import { cycle, framesFor, TAU, clamp01 } from "../engine/motion.mjs";
import { INK, inkLevel, lerp, smooth } from "../engine/halfworld-engine.mjs";
import { occupancyAt } from "../engine/blocking.mjs";
import { theMill } from "./_plans/the-mill.mjs";
import { lens, NW, NH, propSize } from "../assets/set/_stage.mjs";
import { filmReel, chrysalis } from "../assets/set/canister.mjs";
import { stoneFloor } from "../assets/set/mill.mjs";
import { LV } from "../assets/set/_kit.mjs";
import { exitOccupancy as exitOccupancyBF22 } from "./BF-22.mjs";
import oldbutterfly from "../assets/creature/oldbutterfly.mjs";

export const id         = "BF-23";
export const title      = "A NEST OF ITS OWN HISTORY";
export const place      = "INT. MILL · THE OPEN CANISTER";
export const plan       = "the-mill";
export const motion     = "CYCLE";
export const beats      = 3;                        // appears · withdraws · appears
export const seconds    = 4.5;
export const loopClosed = false;                    // it is alive
export const frames     = framesFor(motion, seconds, 12, beats);   // 54
export const drift      = 0.30;
export const declaredBreak = null;
export const breakAt    = null;

export const subject  = "a black leg pushing up through a coil of its own discarded history";
export const distance = "CLOSE";
export const leftOut  = [
  "Mara, who is looking at this and whose face would be the wrong subject",
  "the canister's lid, which is off and out of frame",
  "the wings: they are shut the whole way and not dry, so there is nothing to open",
];

/* ---- framing ------------------------------------------------------------ */
const ZOOM = 8.0;
const station = lens(theMill, { zoom: ZOOM, cx: 0.4800, cy: 0.8830 });
const REEL  = station("reel_on_floor");
const HOLLOW = station("chrysalis_in_reel");
const EMERGE = station("oldbutterfly_emerge");
const R = propSize(REEL, 0.027);                    // the same palm-width object

/* ============================================================ at(u) ========
   PURE. The asset supplies the animal; the vertical is authored here — see the
   header for the measured reason and for exactly what was changed. */
export function at(u, _ctx) {
  const e = oldbutterfly.motions.emerging(u);
  const c = cycle(u, { beats, closed: false, drift });
  const push = Math.sin(c.within * Math.PI) ** 1.6;
  // each push reaches higher than the last...
  const reach = (0.62 + 0.19 * c.beat) * push;
  // ...and each revolution leaves it a little further up than it started
  const gain = 0.012 * u;
  return {
    u, beat: c.beat, push,
    closure: e.closure, tilt: e.tilt, wear: e.wear,
    lift: reach + gain,
    // the leg is out whenever the push is past a quarter — quantised, because a
    // leg is either under the film or through it
    legOut: push > 0.25,
    legK: clamp01((push - 0.25) / 0.75),
  };
}

/* ============================================================ draw() ======= */
export function draw(g, W, H, s) {
  g.save();
  g.scale(W / NW, H / NH);
  g.lineJoin = "round"; g.lineCap = "round";

  stoneFloor(g, -20, NH + 20, -20, NW + 20, { seed: 21, courses: 3 });

  /* ---- the coil, in its waxed paper, with a hollow centre */
  filmReel(g, REEL.x, REEL.y, R, { seed: 23, rings: 7, hollow: 0.34 });

  /* ---- THE CHRYSALIS, in the hollow. Dry, split along one side, EMPTY.
     It takes no time argument. It is the only still thing in the world. */
  chrysalis(g, REEL.x, REEL.y, R * 0.50, { rot: 0.38, split: 1 });

  /* ---- THE ANIMAL, pushing up from BENEATH the film. Drawn after the coil, so
     what we see is the part that has come through it. */
  const lift = s.lift * R * 1.20;
  oldbutterfly.draw(g, NW, NH, {
    ...oldbutterfly.states.nodes.emerging.preview,
    closure: s.closure, tilt: s.tilt, wear: s.wear,
    cx: EMERGE.x / NW,
    cy: (EMERGE.y - lift) / NH,
    V: R * 1.55,
  });

  /* ---- THE LEG. "A black leg appears beneath the film, withdraws, appears
     again." Drawn on top of the coil because it comes THROUGH it: it is the one
     part of the animal that is in front of its own discarded history. */
  if (s.legOut) leg(g, EMERGE.x - R * 0.46, EMERGE.y - lift * 0.35, R * 0.86, s.legK);

  g.restore();
}

/* one black leg, two joints, hooked. Ink, and the darkest thing in the frame. */
function leg(g, x, y, len, k) {
  g.save();
  g.strokeStyle = INK; g.lineWidth = Math.max(4, len * 0.075); g.lineCap = "round";
  const a = -0.9 - 0.5 * k;
  const x1 = x + Math.cos(a) * len * 0.55 * k, y1 = y + Math.sin(a) * len * 0.55 * k;
  const x2 = x1 + Math.cos(a - 1.1) * len * 0.62 * k, y2 = y1 + Math.sin(a - 1.1) * len * 0.62 * k;
  g.beginPath();
  g.moveTo(x, y); g.lineTo(x1, y1); g.lineTo(x2, y2);
  g.stroke();
  // the tarsal claw at the end of it, which is what is hooking the film
  g.lineWidth = Math.max(3, len * 0.05);
  g.beginPath();
  g.moveTo(x2, y2); g.lineTo(x2 + len * 0.10, y2 + len * 0.09);
  g.moveTo(x2, y2); g.lineTo(x2 - len * 0.06, y2 + len * 0.11);
  g.stroke();
  g.restore();
}

/* ---- occupancy ---------------------------------------------------------- */
export const INITIAL = { ...exitOccupancyBF22, oldbutterfly: "oldbutterfly_emerge" };
export const MOVES   = [];
export const exitOccupancy = occupancyAt(theMill, MOVES, 5, INITIAL);

export const SCENE_VERSION = "bf-motion/1.0.0";
