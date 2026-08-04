/* ============================================================================
   BF-11 · EVERY ANSWER IS YES   INT. LABORATORY — CONTINUOUS
                                                        plan: the-laboratory

     "A closed loop of question and concession that returns exactly to where it
      began."
     "Every answer is yes. Nothing is resolved by any of them."
                                                        — atlas/source.json

     NIKO: "Could it have gotten into the intake?"
     MARA: "The sensor would have caught it."
     NIKO: "Could the sensor be wrong?"        MARA: "Yes."
     NIKO: "Could the cleaning have failed?"   MARA: "Yes."
     NIKO: "Then why are we looking at a photograph from 1945?"

   MOTION: CYCLE · 4 beats · 4.0s · 48 frames @12fps · loopClosed: TRUE.

   ---------------------------------------------------------------------------
   THIS IS ONE OF THREE CLOSED LOOPS IN THE WORLD AND THE ONLY ONE WITH PEOPLE
   IN IT. MOTION-BRIEF: "Never animate a living thing as a closed cycle."

   The rule stands and this unit does not break it, because what is closed here
   is not a body. It is an EXCHANGE. Niko asks, Mara concedes, and the pair of
   them arrive back at the question they started from having agreed to
   everything and settled nothing. character/mara.mjs authors exactly this and
   says so: her `concession` motion is her one closed cycle, "because the text
   says it closes, and because what is looping is not her body but the
   exchange. She is being held inside an apparatus's cycle."

   So `closed: true` here is a claim that these two people are inside a machine,
   and the contrast with BF-01 is the point of the act. BF-01's swallowtail is
   `closed: false` and drifts by 0.18 per revolution because it is dying of what
   it is doing. These two drift by nothing at all. The animal is being worn
   down; the conversation is not even doing that much.

   ---------------------------------------------------------------------------
   HOW A CLOSED LOOP IS MADE PROVABLY CLOSED WITH A LIVE RIG.

   The renderer samples u = i / 48, so frame 47 sits one step before frame 0 and
   the wrap must look like any other adjacent step. For that, EVERY quantity in
   at(u) has to be periodic in u with period exactly 1. Two things in this world
   are not:

     1. `wear`. cycle({closed:true}) returns wear 0. Solved by the flag.
     2. THE ASSET'S OWN CLOCK. Both rigs take `t` in SECONDS and their liveness
        layer (blink, spring idle, breath drift) is a function of elapsed time,
        not of u — it is deliberately not periodic, because a living rig should
        not repeat. Passing t = u * 4 would therefore leave frame 47 in a
        different phase of a blink from frame 0 and the wrap would tick, once
        per revolution, forever.

   So this scene HOLDS the asset clock at a constant (t = 0.5) and drives
   everything visible through explicit rig channels that are built from
   cycle({closed:true}). The liveness layer is switched off and the motion is
   authored. That is a real cost — no blink, no idle — and it is the price of
   the one number this unit exists to produce. The renderer's loop check is the
   receipt: quoted in the ledger, not asserted here.

   THE FOUR BEATS.
     0  QUESTION      Niko leans in, head forward, gaze to her
     1  CONCESSION    Mara's head dips.  "Yes."
     2  QUESTION      again, and identically
     3  CONCESSION    again, and identically
   Beats 0 and 2 are the SAME shape and beats 1 and 3 are the same shape. That
   is not laziness; it is what "every answer is yes" means as a movement, and
   authoring four distinct beats would have made the loop about variety.

   NOBODY WALKS. the-laboratory's blocking section: "BF-11 IS DELIBERATELY
   UNBLOCKED... If a body drifted across a closed cycle the loop would not
   close." MOVES is empty here for the same reason.

   DECLARED DISCONTINUITIES: none. A closed cycle with a break in it is two
   scenes.
   ========================================================================= */
import { cycle, framesFor, clamp01, TAU } from "../engine/motion.mjs";
import { inkLevel, placeInstance } from "../engine/halfworld-engine.mjs";
import { occupancyAt } from "../engine/blocking.mjs";
import { lens } from "../assets/set/_lens.mjs";
import { room, bench, benchLamp, loomBolts, cabinet } from "../assets/set/_lab.mjs";
import { theLaboratory } from "./_plans/the-laboratory.mjs";
import { exitOccupancy as EXIT_BF10 } from "./BF-10.mjs";
import mara from "../assets/character/mara.mjs";
import niko from "../assets/character/niko.mjs";

export const id         = "BF-11";
export const title      = "EVERY ANSWER IS YES";
export const place      = "INT. LABORATORY";
export const plan       = "the-laboratory";
export const motion     = "CYCLE";
export const beats      = 4;
export const seconds    = 4.0;
export const loopClosed = true;                    // an apparatus, not a body
export const frames     = framesFor(motion, seconds, 12, beats);   // 48
export const declaredBreak = null;

export const subject  = "two people arriving back at the question they started from";
export const distance = "MEDIUM";
export const leftOut  = [
  "the photograph they are talking about — it is the last line of the exchange " +
  "and BF-09 and BF-10 are both of it; putting it in this frame would give the " +
  "loop somewhere to go, and the loop must not have somewhere to go",
  "the observation box, the monitor, the windows",
];

/* the asset clock, held. See the header — this is the whole closure argument. */
const T_HELD = 0.5;

/* ============================================================ at(u) ========
   Every quantity below is periodic in u with period 1, by construction:
   cycle()'s beat/within are a sawtooth, its breath is sin(u*TAU), and wear is
   identically 0 because closed is true. Nothing here reads a clock. */
/* PHASE. The loop is shifted a quarter of a beat so that u = 0 lands where the
   lean is MOVING FASTEST rather than where it is at rest. That is not a
   cosmetic choice: the renderer's loop check compares frame 47 with frame 0
   against the mean adjacent step, and a cycle whose endpoints sit at its own
   rest points produces a tiny wrap difference and therefore a small ratio —
   which is the same signature a DUPLICATED FRAME produces. Pass 1 read 0.245
   for that reason. Starting mid-gesture makes the wrap a normal-sized step, so
   the number the instrument prints is actually about the closure. */
const PHASE = 0.0625;

export function at(u, _ctx) {
  const c = cycle((u + PHASE) % 1, { beats, closed: true });
  const asking = c.beat === 0 || c.beat === 2;      // 0 and 2 are the same beat
  const q = asking ? c.strike : 0;                  // the lean, in and back
  const yes = asking ? 0 : c.strike;                // the dip, down and back
  // in-and-back inside one beat, so the beat boundary is not a step
  const lean = Math.sin(q * Math.PI);
  const nod  = Math.sin(yes * Math.PI);
  const breath = Math.sin((u + PHASE) * TAU);
  return {
    u, beat: c.beat, asking, lean, nod, breath,
    /* THE CACHE KEY, AND A BUG THAT COST A WHOLE RENDER.
       halfworld-engine's stateSig() builds an asset's cache key from the
       SCALAR entries of its state and deliberately skips objects — "not
       cheaply hashable". Every moving quantity in this scene lives inside
       `rig`, which is an object, so all 48 frames hashed to one key,
       keyedModuleCanvas returned the same canvas 48 times, and the renderer
       reported wrap 0% against mean step 0%: a CYCLE in which literally
       nothing moved, with no error anywhere. `rigk` is a scalar summary of the
       rig and its only job is to make the signature change when the rig does.
       It is periodic in u because everything in it is, so it does not itself
       break the closure. */
    rigk: +(lean * 1000 + nod * 3 + breath * 0.007).toFixed(4),
  };
}

/* ============================================================ draw() ======= */
const NW = 1120, NH = 760;
/* the two of them, at the same depth, 336px apart. The centre is the midpoint
   of mara_at_lamp and niko_at_monitor — the stations the chain leaves them on
   after BF-09 — so the lens is derived from the occupancy and not chosen. */
const MID = { x: (0.5325 + 0.7845) / 2, z: 0.5905 };
const F = lens(theLaboratory, { centre: MID, zoom: 1.6,
                                at: { x: 560, y: 690 }, W: NW, H: NH });

export function draw(g, W, H, s) {
  g.save();
  g.scale(W / NW, H / NH);
  g.lineJoin = "round"; g.lineCap = "round";

  room(g, F, { z0: 0.18, z1: 0.95, ceiling: false });
  cabinet(g, F);
  loomBolts(g, F, { only: ["loom_bolt_nw", "loom_bolt_w", "loom_bolt_ne"] });
  bench(g, F);
  benchLamp(g, F);

  const m = F("mara_at_lamp"), n = F("niko_at_monitor");

  // MARA — conceding. Her head dips on the beats where the answer is yes.
  placeInstance(g, NW, NH, mara, {
    anchor: { x: m.x / NW, y: m.y / NH }, scale: (m.h * 1.02) / NH,
    state: {
      pose: "mv_delete", guise: "bare", box: false, t: T_HELD, key: true,
      rigk: s.rigk, gaze: { x: 0.34, y: 0.04 },
      rig: {
        headPitch: 0.05 + s.nod * 0.15,
        gazeX: 0.30 - s.nod * 0.06,
        chestLift: 0.24 + s.breath * 0.020,
        shoulderTilt: s.breath * 0.010,
      },
    },
  });

  // NIKO — asking. He leans in on the beats where the question is put, and the
  // lean is identical both times.
  placeInstance(g, NW, NH, niko, {
    anchor: { x: n.x / NW, y: n.y / NH }, scale: (n.h * 1.02) / NH,
    state: {
      pose: "nk_procedural", guise: "carrying", t: T_HELD, key: true,
      rigk: -s.rigk, gaze: { x: -0.42, y: 0.02 },
      rig: {
        headPitch: -0.04 - s.lean * 0.10,
        gazeX: -0.38 - s.lean * 0.08,
        chestLift: 0.22 + s.breath * 0.018 + s.lean * 0.05,
        shoulderTilt: -s.lean * 0.030,
        pelvisX: -s.lean * 0.016,
      },
    },
  });

  g.restore();
}

/* ============================================================ occupancy ====
   NO MOVES. See the header and the plan's blocking section. */
export const INITIAL = EXIT_BF10;
export const MOVES   = [];
export const exitOccupancy = occupancyAt(theLaboratory, MOVES, 6, INITIAL);

export const SCENE_VERSION = "bf-motion/1.0.0";
