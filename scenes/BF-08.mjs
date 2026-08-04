/* ============================================================================
   BF-08 · THE FLOOR BOLTS      INT. LABORATORY · THE TALL WINDOWS — MORNING
                                                        plan: the-laboratory

     "The laboratory occupies the upper floor of a converted textile mill; the
      windows are too tall for modern use."
     "Water towers, apartment roofs, the white rind of a stadium appear not
      outside but preserved within the glass."
     "The butterfly room once housed looms. Their floor bolts remain — dark
      circles surrounded by rust."                      — atlas/source.json

   MOTION: HOLD · 6.0s · 72 frames @12fps · loopClosed: false.

   ---------------------------------------------------------------------------
   THE ONLY WIDE SHOT IN THE ACT, AND IT IS THE ONE THAT LOOKS DOWN.

   the-laboratory's fixture `mara_path_of_habit` runs fire_door -> floor_open ->
   loom_bolt_centre -> mara_at_sleeves, and its note says: "She steps over it
   without looking, eleven times in thirteen units, and BF-08 is the unit that
   finally looks down." So this frame contains the whole length of the room —
   the glass at one end, the walked line running out of the near edge — and
   seven dark circles on the floor between them that have been under every
   other unit in this act without being in any of them.

   THEY RHYME WITH THE MARK AND THEY ARE NOT IT. A loom bolt is a filled circle
   in a ring of rust: the broken circle with its gap closed and its stroke
   removed. Drawn, therefore, as an ink circle inside a ring, per the plan's
   own instruction — "do not draw them as ellipses of shadow". Seven of them.
   The room is standing on the shape and nobody has looked at the floor.

   LENS: NONE. `lens(plan, { native: true, zoom: 1 })` is exactly project(), so
   this frame IS the plan, unmagnified, and every close-up in the act is a crop
   of this. That is the cheapest possible proof that the thirteen units are one
   room.

   THE BREATH. A wide empty room has nothing in it that breathes, and
   MOTION-BRIEF forbids a frozen frame. What is still going is the animal, in
   the box, at this distance about eleven pixels across — "the butterfly
   continues its pattern regardless" carried into the wide shot — plus a
   handful of motes near the glass. Both are deniable. Neither is the subject.

   NOTHING IN THIS ROOM IS OUTDOORS. The city is drawn AT the glass plane, at
   level 2, inside the mullion grid: preserved within it, per the sentence, not
   seen through it. There is no sky in this world.

   DECLARED DISCONTINUITIES: none.
   ========================================================================= */
import { hold, framesFor, clamp01, TAU } from "../engine/motion.mjs";
import { inkLevel, placeInstance } from "../engine/halfworld-engine.mjs";
import { occupancyAt } from "../engine/blocking.mjs";
import { lens } from "../assets/set/_lens.mjs";
import { room, bench, tallWindows, observationBox, loomBolts, hood }
  from "../assets/set/_lab.mjs";
import { theLaboratory } from "./_plans/the-laboratory.mjs";
import { exitOccupancy as EXIT_BF07 } from "./BF-07.mjs";
import swallowtail from "../assets/creature/swallowtail.mjs";

export const id         = "BF-08";
export const title      = "THE FLOOR BOLTS";
export const place      = "INT. LABORATORY · THE TALL WINDOWS";
export const plan       = "the-laboratory";
export const motion     = "HOLD";
export const beats      = null;
export const seconds    = 6.0;
export const loopClosed = false;
export const frames     = framesFor(motion, seconds, 12);     // 72
export const declaredBreak = null;

export const subject  = "seven loom bolts, and a room standing on them";
export const distance = "WIDE";
export const leftOut  = [
  "Mara and Niko — this is the room without either of them in it, which is " +
  "what a floor that predates both of them looks like",
  "the cabinet and the monitor cart and the recovery rack — east and west of " +
  "the frame's usable band; " +
  "including them would put fourteen objects in a wide shot and SCENE-BRIEF §3 " +
  "is explicit that a frame using every station is a field of dots",
];

/* ============================================================ at(u) ======== */
export function at(u, _ctx) {
  const uu = clamp01(u);
  const h = hold(uu, { breathSec: 4.1, dur: seconds });
  return {
    u: uu,
    motes: uu,
    bug: swallowtail.motions.strike((uu * 3.4) % 1),
    breath: h.breath,
  };
}

/* ============================================================ draw() ======= */
const NW = 1120, NH = 760;
/* THE IDENTITY LENS. zoom 1 + native = project(), which is what every other
   scene in this act is a crop of. */
const F = lens(theLaboratory, { native: true, zoom: 1.0, W: NW, H: NH });

export function draw(g, W, H, s) {
  g.save();
  g.scale(W / NW, H / NH);
  g.lineJoin = "round"; g.lineCap = "round";

  /* the wall is level 1 and the GLAZING is level 0, so the windows are the
     brightest planes in the room. Pass 1 had both at level 1 and the three
     bays vanished into the wall behind them — in the one unit whose first
     sentence is about the windows. */
  room(g, F, { z0: 0.10, z1: 0.95, tubeH: 1.75, wallLevel: 1 });
  tallWindows(g, F, { tall: 3.4, cityY: 0.55, glazing: 0, mullions: 1 });
  hood(g, F);
  loomBolts(g, F);
  const bt = bench(g, F);
  const box = observationBox(g, F, { baseY: bt.topY });

  // eleven pixels of animal, still going
  placeInstance(g, NW, NH, swallowtail, {
    anchor: { x: box.cx / NW, y: (box.lidY + box.bh * (0.24 + s.bug.cy * 0.5)) / NH },
    scale: 0.055,
    state: { closure: s.bug.closure, tilt: s.bug.tilt, key: true },
  });

  motes(g, F, s);
  g.restore();
}

/* a few motes at the glass. Marks, not light: this world has no gradients and
   therefore no beam, and a mote is a dot that is somewhere. */
function motes(g, F, s) {
  const w = F("window_bay_centre");
  const h = w.h;
  g.fillStyle = inkLevel(3);
  for (let i = 0; i < 9; i++) {
    const ph = (i * 0.6180339887) % 1;
    const k = (s.motes * 0.42 + ph) % 1;
    const x = w.x - h * 0.9 + ((i * 37) % 100) / 100 * h * 1.8;
    const y = w.y - h * 0.30 - k * h * 1.05;
    g.beginPath(); g.arc(x, y, 2.9, 0, TAU); g.fill();
  }
}

/* ============================================================ occupancy ==== */
export const INITIAL = EXIT_BF07;
export const MOVES   = [];
export const exitOccupancy = occupancyAt(theLaboratory, MOVES, 6, INITIAL);

export const SCENE_VERSION = "bf-motion/1.0.0";
