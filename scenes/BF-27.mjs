/* ============================================================================
   BF-27 · IT IS NOT AFRAID    EXT. THE LOT · THE SPILLED LAVENDER   the-lot

     "The bag splits, releasing lavender stems across the pavement.
      The butterfly descends and touches one flower. It does not recoil."
                                                          — atlas/source.json
     MARA: "It isn't afraid."   IONA: "Why would it be?"
     MARA: "Our colony—"        IONA: "Your colony was taught."
     MARA: "This one has the same marking."  IONA: "Marking is not memory."

   MOTION: HOLD · 5.0s · 60 frames @12fps.

   ---------------------------------------------------------------------------
   THE WHOLE UNIT IS AN ABSENCE, AND A HOLD IS THE ONLY MOTION THAT CAN CARRY IT.

   "It does not recoil." creature.oldbutterfly's header is explicit about what
   that means for the rig: "So there is no startle state in this file and there
   will not be one. It lands on lavender and stays." The laboratory colony was
   conditioned to avoid this smell and BF-01 spends four seconds on an animal
   refusing the corridor that carries it. This one puts a foot on it.

   A recoil is an event and a still frame can hold the aftermath of one. NOT
   recoiling is not an event; it is four seconds of a thing continuing. That is
   what HOLD is for, and it is why this unit is a loop rather than a picture:
   the animal must be seen to keep not flinching, frame after frame, on the one
   flower it has chosen.

   So the only motion in the frame is `breath` — the asset's own, which opens and
   closes the wings between 0.62 and 0.98 and "never opens past 0.62 or closes
   past 0.98, so neither end state is reached and the mark is never quite whole."
   That matters here: BF-24 is the unit where the mark completes, and this one
   must not steal it. Mara says "This one has the same marking" and the frame
   does not confirm her.

   THE LAVENDER IS NEVER PURPLE (BUILD-BRIEF §1). Straight woody stems and a
   dense spike of small buds, the same geometry assets/character/iona.mjs draws
   in the bag — nine stems, five buds to a spike — because it is the same plant,
   now on the ground.

   AND IT IS ON THE GROUND WHERE SHE STOPPED. the-lot: "The bag splits where the
   body failed, one station on from iona_falters and 16px away… `bag_split` is a
   contact pair with `iona_falters` for that reason: the last thing she is
   holding, at the instant she stops holding it."

   DECLARED DISCONTINUITIES: none. The bag has already split when the unit
   opens; the split itself belongs to the end of BF-26.

   COMPOSITION. One subject: a butterfly's foot on a lavender flower.
   ========================================================================= */
import { hold, framesFor, clamp01 } from "../engine/motion.mjs";
import { INK, lerp, smooth } from "../engine/halfworld-engine.mjs";
import { occupancyAt } from "../engine/blocking.mjs";
import { theLot, MOVES_BF27 } from "./_plans/the-lot.mjs";
import { lens, NW, NH, BODY_H, propSize } from "../assets/set/_stage.mjs";
import { pavement, lavenderSpill, splitBag } from "../assets/set/lot.mjs";
import { LV, brokenLine } from "../assets/set/_kit.mjs";
import { exitOccupancy as exitOccupancyBF26 } from "./BF-26.mjs";
import oldbutterfly from "../assets/creature/oldbutterfly.mjs";

export const id         = "BF-27";
export const title      = "IT IS NOT AFRAID";
export const place      = "EXT. THE LOT · THE SPILLED LAVENDER";
export const plan       = "the-lot";
export const motion     = "HOLD";
export const beats      = null;
export const seconds    = 5.0;
export const loopClosed = false;
export const frames     = framesFor(motion, seconds, 12);      // 60
export const declaredBreak = null;
export const breakAt    = null;

export const subject  = "a butterfly's foot on a lavender flower, not recoiling";
export const distance = "CLOSE";
export const leftOut  = [
  "Mara and Iona, and the six lines they exchange over this — none of it is drawable",
  "the whole marking: `breath` never closes past 0.98, so BF-24 keeps the union",
  "the lot behind it: at this crop there is pavement and nothing else",
  "any startle state. There is none in the asset and there is none here.",
];

/* ---- framing ------------------------------------------------------------ */
/* PASS 2. At zoom 5.5 a body height is 2535px, so everything sized off it —
   the bag at 0.20 B, the stems at 0.20 B — came out at 500px and the split bag
   filled the left half of the frame as one grey slab. And `lavenderSpill` was
   given the plan's own west-to-east span, 216px, with 304px stems in it, which
   is not a spill across pavement, it is a starburst from one point.
   3.3 sizes the animal at V = 174 (a 350px butterfly), and the spill is drawn
   across 720px because that is what "across the pavement" is; the plan's two
   spill stations are 216px apart and mark where it is, not how wide it is. */
const ZOOM = 3.30;
const station = lens(theLot, { zoom: ZOOM, cx: 0.5000, cy: 0.7794 });
const TOUCH = station("lavender_stem_touched");
const ALIGHT = station("oldbutterfly_alight");
const SPLIT = station("bag_split");
const WEST  = station("lavender_spill_west");
const EAST  = station("lavender_spill_east");
const B = BODY_H * TOUCH.scale;                     // one body height at this depth

/* ============================================================ at(u) ======== */
export function at(u, _ctx) {
  const h = hold(u, { breathSec: 4.1, dur: seconds });
  return { u, bug: oldbutterfly.motions.breath(u), room: h };
}

/* ============================================================ draw() ======= */
export function draw(g, W, H, s) {
  g.save();
  g.scale(W / NW, H / NH);
  g.lineJoin = "round"; g.lineCap = "round";

  pavement(g, -20, NH + 20, -20, NW + 20, { seed: 61, cracks: 4 });

  /* ---- the bag, split, where she stopped holding it. Bottom-left, running off
     the near edge: it is an object, not a body. */
  splitBag(g, SPLIT.x - 300, NH + 30, 300, 270, { seed: 137 });

  /* ---- the stems across the pavement. Never purple; woody stems and spikes. */
  lavenderSpill(g, (WEST.x + EAST.x) / 2, (WEST.y + EAST.y) / 2 + 40, 720,
    { seed: 131, stems: 11, len: 128 });

  /* ---- THE ONE FLOWER it touches, drawn again on top so the foot has
     something to be on that is not behind ten other stems */
  oneFlower(g, TOUCH.x - 40, TOUCH.y + 24, 168);

  /* ---- THE ANIMAL. Its own breath, and nothing else. It does not recoil. */
  const V = B * 0.115;                              // 174px: a 350px butterfly
  const cy = NH * 0.42 + s.room.breath * 2.0;
  oldbutterfly.draw(g, NW, NH, {
    closure: s.bug.closure, tilt: s.bug.tilt, wear: s.bug.wear,
    cx: ALIGHT.x / NW, cy: cy / NH, V,
  });

  g.restore();
}

/* the flower under the foot: one woody stem, one dense spike of five buds */
function oneFlower(g, x, y, len) {
  g.save();
  const a = -0.40;
  const x1 = x + Math.cos(a) * len, y1 = y + Math.sin(a) * len * 0.34;
  g.strokeStyle = LV(5); g.lineWidth = 5; g.lineCap = "round";
  g.beginPath(); g.moveTo(x, y); g.lineTo(x1, y1); g.stroke();
  for (let k = 0; k < 5; k++) {
    const t = k / 4;
    const bx = lerp(x1, x1 + Math.cos(a) * len * 0.34, t);
    const by = lerp(y1, y1 + Math.sin(a) * len * 0.34 * 0.34, t);
    g.fillStyle = LV(3);
    g.beginPath(); g.ellipse(bx, by, 8.4, 5.2, a, 0, Math.PI * 2); g.fill();
    g.strokeStyle = INK; g.lineWidth = 2.4;
    g.beginPath(); g.ellipse(bx, by, 8.4, 5.2, a, 0, Math.PI * 2); g.stroke();
  }
  g.restore();
}

/* ---- occupancy ---------------------------------------------------------- */
export const INITIAL = exitOccupancyBF26;
export const MOVES   = MOVES_BF27;
export const exitOccupancy = occupancyAt(theLot, MOVES, 6, INITIAL);

export const SCENE_VERSION = "bf-motion/1.0.0";
