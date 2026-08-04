/* ============================================================================
   BF-40 · SOMEONE IS STILL INSIDE
             INT. REARING FACILITY · THE POOL'S EDGE         plan: the-facility

     "At the pool's edge stands a girl in a yellow dress. Water streams from her
      hair."
     "In both hands she holds a chrysalis split neatly along one side. She looks
      eight years old."
     "She has Mara's face. She raises the empty chrysalis to her ear."
     "Then the projector stops. In the darkness, something opens its wings."
                                                          — atlas/source.json

     THE GIRL: "Someone is still inside."

   MOTION: BREAK · 5.5s · 66 frames @12fps · loopClosed: false.
   THE LAST UNIT IN THE WORLD.

   ===========================================================================
   THE BREAK IS DECLARED, AND IT IS ONE INSTANT
   ===========================================================================
   declaredBreak = 0.72. "Then the projector stops."

   MOTION-BRIEF: BREAK is "the ONLY discontinuity this world permits, and it must
   be declared: one instant, stated in the scene file, before and after."
   the-facility says the same thing about this unit: "THE BREAK IS ONE INSTANT
   ... Everything before it is lit by a beam crossing the room; everything after
   it is darkness with something opening its wings."

   BEFORE (u .00 -> .72)  the beam, the pool, the girl in it, the husk going to
                          her ear, and her line.
   AFTER  (u .72 -> 1.0)  no beam, no pool, no girl. A dark field and a pair of
                          wings opening in it.

   There is no frame between those two states and there must not be one. brk()
   returns `before`, `after` and `sinceBreak`, and nothing in this file
   interpolates across the instant.

   ===========================================================================
   SHE IS NOT BLOCKED ON, AND THE PLAN SAYS WHY
   ===========================================================================
   "The girl is already standing at pool_tile_lip when the unit begins — she is
   not blocked ON, because nothing in the text shows her arriving, and staging an
   arrival for her would answer a question the story refuses to answer."
   MOVES_BF40 is empty. She is simply there, and BF-39 refused to put her there
   early for the same reason.

   ===========================================================================
   SHE HAS MARA'S FACE, AND THAT IS AN IMPORT
   ===========================================================================
   character.thegirl already imports FACE_OF_MARA and SKIN_OF_MARA from
   character.mara — "that is not a resemblance the atlas can check and it is not a
   thing two agents can agree on by eye, so the girl imports these values rather
   than approximating them; the same reasoning that makes the broken circle one
   function." So this scene does not draw a face at all. It calls her module, at
   the motion her module authors for this unit — `to_the_ear` — and the
   resemblance is a property of the cast and not of the staging.

   Her proportions are the real thing too: thegirl builds from spec.age, so the
   trunk, the neck and the shoulders are a child's and not a small adult's. "She
   looks eight years old" is a number in her params, not a scale factor here.

   THE WATER. `stream` in her module quantises the water leaving her hair with
   advance() — "equal intervals; quantise it, do not ease it" — and to_the_ear
   keeps `phase` running underneath the listening. Both are hers.

   ===========================================================================
   AND AFTER THE BREAK: THE MARK COMES APART
   ===========================================================================
   "In the darkness, something opens its wings."

   It is not named and it is not identified here. What is drawn is
   creature.oldbutterfly at a closure that runs from shut to open across the
   after-half — and BF-24 is explicit about what that does: "It opens: the symbol
   divides. It closes: the symbol becomes whole. The mark exists only when the
   wings are closed together."

   So the last thing the world does is TAKE THE MARK APART. It is whole for the
   first two frames after the break and then it is two halves that are not a
   shape, and the unit ends. That is not a flourish — MOTION-BRIEF's first
   punishment is "rendering the mark as a picture", and the final frame of the
   world is the one place it would be most tempting and most wrong.

   ===========================================================================
   ONE UNBROKEN HORIZONTAL, PAID FOR
   ===========================================================================
   _facility.mjs' own header reserves it: the pool's NEAR LIP, whole, in this
   unit. She is standing on it and BF-36's reel struck it. It is the edge the
   whole act has been arranging itself around, and like BF-01's acrylic lid it is
   the one span allowed to have no gap in it. Every other horizontal in the frame
   is broken.

   THE EXIT IS EXPORTED ANYWAY. There is no BF-41. The chain is exported because
   a chain that stops being maintained at its last link was never a chain.
   ========================================================================= */
import { brk, framesFor, clamp01, TAU } from "../engine/motion.mjs";
import { INK, PAPER, inkLevel } from "../engine/halfworld-engine.mjs";
import { occupancyAt } from "../engine/blocking.mjs";
import { theFacility, INITIAL_BF40, MOVES_BF40 } from "./_plans/the-facility.mjs";
import { makeLens, placeFigure, placeCreature, BODY, NW, NH } from "../assets/set/_facility-lens.mjs";
import {
  loadingRoomFloor, tiledPool, beamWedge, trough, screenRect,
} from "../assets/set/_facility.mjs";
import thegirl from "../assets/character/thegirl.mjs";
import { asset as oldbutterfly } from "../assets/creature/oldbutterfly.mjs";
import { exitOccupancy as INITIAL_FROM_BF39 } from "./BF-39.mjs";

/* ---- the motion scene contract ------------------------------------------ */
export const id         = "BF-40";
export const title      = "SOMEONE IS STILL INSIDE";
export const place      = "INT. REARING FACILITY · THE POOL'S EDGE";
export const plan       = "the-facility";
export const motion     = "BREAK";
export const beats      = null;
export const seconds    = 5.5;
export const loopClosed = false;
export const frames     = framesFor(motion, seconds, 12);      // 66
export const declaredBreak = 0.72;                             // the projector stops
export const breakAt    = declaredBreak;                       // the harness reads this

export const subject    = "a child listening to an empty thing, and then nothing";
export const distance   = "MEDIUM";
export const leftOut    = [
  "Mara, Niko and Iona. All three are in the room — the occupancy carries them " +
  "— and none of them is in the frame. The last unit of the world is a child and " +
  "an object, and a reaction shot would make it about somebody's reaction",
  "the chrysalis wall, the cart and the sheet. Everything except the beam, the " +
  "pool's near lip and her",
  "her arrival. MOVES_BF40 is empty on purpose; she is already standing there",
  "the whole mark, in every frame after the break. It is taken apart, not shown",
];

/* ---- the lens ------------------------------------------------------------ */
const lens = makeLens(theFacility, { centre: "girl_pool_south", zoom: 2.8, dy: 180 });
const G = lens("girl_pool_south"), LIP = lens("pool_tile_lip");
const P_N = lens("pool_edge_north"), P_S = lens("pool_edge_south");
const P_W = lens("pool_edge_west"),  P_E = lens("pool_edge_east");
const LENS_PT = lens("projector_lens");

/* ============================================================ at(u) ======== */
export function at(u, _ctx) {
  const b = brk(u, declaredBreak);

  /* BEFORE. Her module's own one-shot, remapped so it fills the lit half: the
     hand goes up over the first third, the head comes to meet it over the
     second, and the last third is held. Her line lands in the held part. */
  const gu = clamp01(u / declaredBreak);
  const girl = thegirl.motions.to_the_ear(gu);

  /* her mouth. "Someone is still inside." Four syllables' worth of jaw, and it
     opens on a schedule; a mouth that eases reads as a yawn. */
  const sp = clamp01((gu - 0.62) / 0.30);
  const jaw = sp <= 0 || sp >= 1 ? 0 : (Math.floor(sp * 7) % 2 ? 0.34 : 0.04);

  /* AFTER. The wings open across the whole of the after-half. closure 1 is shut
     — the mark whole — and 0.10 is open, the mark divided and gone. */
  const open = b.after ? b.sinceBreak : 0;

  return {
    u, before: b.before, after: b.after, since: b.sinceBreak,
    girl, jaw, ripple: u, open,
    closure: 1 - 0.90 * Math.pow(open, 0.72),
  };
}

/* ============================================================ draw() ======= */
export function draw(g, W, H, s) {
  g.save();
  g.scale(W / NW, H / NH);
  g.lineJoin = "round"; g.lineCap = "round";

  if (s.before) drawBefore(g, s);
  else drawAfter(g, s);

  g.restore();
}

/* ---------------------------------------------------------------- BEFORE -- */
function drawBefore(g, s) {
  g.fillStyle = inkLevel(3); g.fillRect(0, 0, NW, NH);
  loadingRoomFloor(g, { x0: -10, x1: NW + 10, horizon: P_N.py - 60, bottom: NH, seed: 43 });
  g.fillStyle = inkLevel(3); g.fillRect(0, P_N.py - 60, NW, NH - (P_N.py - 60));

  /* THE BEAM. She is standing in it — the plan's own note on `the_beam`:
     "BF-38's scales drift in this line; BF-40's girl stands in it." */
  beamWedge(g, NW + 200, P_N.py + 40, -140, P_N.py - 150, P_S.py + 40,
            { level: 1, edge: true });

  /* the troughs at the pool's edge, in the beam's light */
  const tE = lens("trough_east"), tW = lens("trough_west");
  trough(g, tW.px - 54 * tW.k, tW.py - 22 * tW.k, 108 * tW.k, 22 * tW.k,
         { seed: 93, sway: s.u, stems: 7, tall: 52 * tW.k });
  trough(g, tE.px - 54 * tE.k, tE.py - 22 * tE.k, 108 * tE.k, 22 * tE.k,
         { seed: 95, sway: (s.u + 0.4) % 1, stems: 7, tall: 52 * tE.k });

  const pool = tiledPool(g, {
    cx: (P_W.px + P_E.px) / 2, farY: P_N.py, nearY: P_S.py,
    farW: (P_E.px - P_W.px) * 0.86, nearW: (P_E.px - P_W.px) * 1.20,
    ripple: s.ripple, level: 2, seed: 101,
  });

  /* ---- THE GIRL ----
     Her module, her motion, her face — which is Mara's, imported there and not
     approximated here. */
  placeFigure(g, thegirl, {
    ...s.girl, guise: "wet", jaw: s.jaw,
  }, { footX: G.px, footY: LIP.py + 4, height: G.k * BODY * 1.18 });

  /* ---- THE ONE UNBROKEN HORIZONTAL IN ACT III ----
     The pool's near lip, whole, edge to edge of the pool, drawn OVER her feet
     because she is standing on the far side of it. Reserved for this frame in
     _facility.mjs' header and paid for by every other horizontal in the act
     being broken. */
  g.strokeStyle = INK; g.lineWidth = 9;
  g.beginPath();
  g.moveTo(pool.nl - 40, pool.nearY); g.lineTo(pool.nr + 40, pool.nearY);
  g.stroke();
}

/* ----------------------------------------------------------------- AFTER --
   "Then the projector stops. In the darkness, something opens its wings."

   No beam. No pool. No girl. One field and one animal, and the animal is not
   named. The field is level 6 — the darkest this world goes without becoming
   solid ink, and the only frames in Act III that are more ink than paper. */
function drawAfter(g, s) {
  g.fillStyle = inkLevel(6); g.fillRect(0, 0, NW, NH);

  /* the wings. creature.oldbutterfly, driven by `closure`: 1 is shut and the
     mark is whole; 0.10 is open and the mark is two halves that are not a shape.
     The animal is drawn at level 1 against level 6, so what opens in the
     darkness is the only light in the last frame of the world. */
  placeCreature(g, oldbutterfly, {
    closure: s.closure, cy: 0.50, tilt: -0.03 + 0.05 * s.since, wear: 0.42,
  }, { cx: NW * 0.50, cy: NH * 0.50, size: 640 });
}

/* ---- occupancy -----------------------------------------------------------
   INITIAL_BF40 puts the girl at girl_pool_south and carries the other three
   across from BF-34's exit; this file chains the three from BF-39 instead, which
   is the same three people ten minutes later and is the live chain rather than
   the plan's shortcut. There is no BF-41; the exit is exported anyway. */
export const INITIAL = { ...INITIAL_FROM_BF39, thegirl: INITIAL_BF40.thegirl };
export const MOVES   = MOVES_BF40;
export const exitOccupancy = occupancyAt(theFacility, MOVES, 6, INITIAL);

/** the act's handoff, named, for whatever reads the world after it ends. */
export const exitOccupancyActIII = exitOccupancy;

export const SCENE_VERSION = "bf-motion/1.0.0";
