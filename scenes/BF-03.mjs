/* ============================================================================
   BF-03 · STOP MEANS STOP      INT. LABORATORY — CONTINUOUS
                                                        plan: the-laboratory

     "Niko presses the manual switch. Fans sigh. The lavender thins into the
      extraction hood."
     "The butterfly continues its pattern regardless."
     "Mara has not moved. Her hands are still inside the sleeves of the
      observation box."                                 — atlas/source.json

     NIKO: "Stop means stop."   MARA: "It's stopped."   NIKO: "The odor is
     stopped."   MARA: "That's what I meant."   NIKO: "No, it isn't."

   MOTION: HOLD · 5.0s · 60 frames @12fps · loopClosed: false.

   ---------------------------------------------------------------------------
   A HOLD IS NOT A FREEZE, AND THIS ONE HAS EXACTLY ONE THING HAPPENING IN IT.

   MOTION-BRIEF rule 3: the breath is 4.1s and "should be deniable — a viewer
   should not be able to say for certain that anything moved." So the gloves
   carry hold()'s breath at an amplitude of about two pixels, and the animal
   above them carries its own strike cycle at full size, and between those two
   the frame states the argument of the scene: one thing in this box has
   stopped and one thing has not.

   THE ONE VISIBLE EVENT is the lavender. It THINS — the column loses its top
   first, because the hood pulls from above — and it never reaches zero. At
   u = 1 there are still marks at the mouth of the corridor. That is the
   dialogue, drawn: the odour is stopped and the odour is still there, and
   those are not the same sentence.

   ---------------------------------------------------------------------------
   WHY MARA IS NOT IN THIS FRAME, in a unit whose third beat is about her.

   The plan puts `mara_at_sleeves` at z .6225 and `observation_box_near` at
   z .5285 — she is NEARER the camera than the box she is reaching into,
   because the ports face her and the camera is behind her at the fire door.
   From this camera she is a BACK, and character/mara.mjs has no back: every
   pose in her rig is authored front-on, and turning one round by hand is the
   overpaint that BUILD-BRIEF §3 says pulled six Odysseus modules out of
   family. So the shot is taken past her, at what her hands are doing, and her
   hands are inside the box where the camera can see them through acrylic.
   Two gloves, still, with nothing left for them to do. That IS the beat.

   DECLARED DISCONTINUITIES: none.
   ========================================================================= */
import { hold, framesFor, clamp01, TAU } from "../engine/motion.mjs";
import { INK, inkLevel, smooth } from "../engine/halfworld-engine.mjs";
import { occupancyAt } from "../engine/blocking.mjs";
import { placeInstance } from "../engine/halfworld-engine.mjs";
import { lens } from "../assets/set/_lens.mjs";
import { room, bench, observationBox, mazeInsideBox, lavender, manualSwitch, hood }
  from "../assets/set/_lab.mjs";
import { theLaboratory, MOVES_BF03 } from "./_plans/the-laboratory.mjs";
import { exitOccupancy as EXIT_BF02 } from "./BF-02.mjs";
import swallowtail from "../assets/creature/swallowtail.mjs";

export const id         = "BF-03";
export const title      = "STOP MEANS STOP";
export const place      = "INT. LABORATORY";
export const plan       = "the-laboratory";
export const motion     = "HOLD";
export const beats      = null;
export const seconds    = 5.0;
export const loopClosed = false;
export const frames     = framesFor(motion, seconds, 12);     // 60
export const declaredBreak = null;

export const subject  = "two gloved hands inside the box, with nothing left to do";
export const distance = "MEDIUM";
export const leftOut  = [
  "Mara's body — from this camera she is a back, and her rig has no back " +
  "(see the header). Her hands are in the frame; the rest of her is not.",
  "Niko's hand on the switch — the switch is drawn already pressed; a hand on " +
  "it would make the frame about the pressing rather than about what did not " +
  "stop when it was pressed",
  "the tall windows, the monitor, the cabinet, the loom bolts",
];

/* ============================================================ at(u) ======== */
export function at(u, _ctx) {
  const uu = clamp01(u);
  const h = hold(uu, { breathSec: 4.1, dur: seconds });
  return {
    u: uu,
    breath: h.breath,                 // ~2px of glove, and that is the whole body
    tilt: h.tilt, weight: h.weight,
    // the hood takes the top of the column first, and never takes all of it
    thin: 0.62 * smooth(uu * 1.15),
    odour: uu,
    fan: uu,
    bug: swallowtail.motions.strike((uu * 2.2) % 1),   // it continues regardless
  };
}

/* ============================================================ draw() ======= */
const NW = 1120, NH = 760;
const F = lens(theLaboratory, { centre: "observation_box_centre", zoom: 3.4,
                                dy: 614, W: NW, H: NH });

export function draw(g, W, H, s) {
  g.save();
  g.scale(W / NW, H / NH);
  g.lineJoin = "round"; g.lineCap = "round";

  room(g, F, { z0: 0.22, z1: 0.95, joints: false, ceiling: false });
  hood(g, F);
  const bt = bench(g, F);
  const box = observationBox(g, F, { baseY: bt.topY });
  const mz = mazeInsideBox(g, F, box);
  lavender(g, F, s.odour, {
    x: mz.lavenderX, y: mz.floorY - box.bh * 0.12, h: box.bh,
    thin: s.thin, pull: 0.22 * s.thin, count: 13, rise: 0.72, level: 5,
  });

  // the animal, inside the box, on its own clock. It continues regardless.
  placeInstance(g, NW, NH, swallowtail, {
    anchor: { x: box.cx / NW,
              y: (box.lidY + box.bh * (0.16 + s.bug.cy * 0.52)) / NH },
    scale: 0.215,
    // cx/cy are STRIPPED: the asset uses them to place itself inside its own
    // box, and the anchor above already carries the position. Passing both
    // moved the animal twice and it read as a smear rather than a body.
    state: { closure: s.bug.closure, tilt: s.bug.tilt, wear: s.bug.wear, key: true },
  });

  gloves(g, box, s);
  manualSwitch(g, F);
  fanTicks(g, F, s);

  g.restore();
}

/* ---- the two gloves ------------------------------------------------------
   Butyl gauntlets seen through the acrylic near face. PASS 2: the first
   version drew a cuff ellipse on top of the port's own ellipse and a rounded
   palm under it, and the two circles fused — the frame contained two eggs, or
   two faces, and nothing that could be read as a hand. The port is already a
   ring; the glove is only what hangs INSIDE it. Four fingers straight down and
   a thumb, no grip, no gesture: there is nothing left for them to do.

   They breathe at hold()'s amplitude, about two pixels at this lens, which is
   under the dot pitch and is as deniable as MOTION-BRIEF asks for. */
function gloves(g, box, s) {
  const r = box.portR, dy = (s.breath - 0.5) * 4.2, tl = s.tilt * 1.4;
  for (const [side, px] of [[-1, box.port.l], [1, box.port.r]]) {
    g.save();
    g.translate(px, box.portY + dy + side * tl);
    g.fillStyle = inkLevel(1);
    g.strokeStyle = INK; g.lineWidth = 4.0;
    // the back of the hand: a long tapering shape, wrist at the port
    g.beginPath();
    g.moveTo(-r * 0.62, 0);
    g.bezierCurveTo(-r * 0.74, r * 0.90, -r * 0.60, r * 1.55, -r * 0.30, r * 1.80);
    g.lineTo(r * 0.44, r * 1.86);
    g.bezierCurveTo(r * 0.74, r * 1.55, r * 0.80, r * 0.86, r * 0.62, 0);
    g.closePath(); g.fill(); g.stroke();
    // three finger separations, running to the tips. Not four: at this size a
    // fourth is a clot rather than a finger.
    g.lineWidth = 3.2;
    g.beginPath();
    for (const t of [-0.34, 0.02, 0.36]) {
      g.moveTo(t * r * 0.9, r * 0.98);
      g.lineTo(t * r * 1.05, r * 1.80);
    }
    g.stroke();
    // the thumb, on the inboard side — the one mark that makes it a hand
    g.beginPath();
    g.moveTo(-side * r * 0.60, r * 0.52);
    g.bezierCurveTo(-side * r * 1.02, r * 0.70, -side * r * 1.06, r * 1.16,
                    -side * r * 0.72, r * 1.30);
    g.fillStyle = inkLevel(1); g.fill();
    g.lineWidth = 3.6; g.stroke();
    g.restore();
  }
}

/* ---- the fans, sighing ---------------------------------------------------
   Not drawn as air. Four short marks at the hood mouth that step inward on a
   seamless harmonic — the extraction is running and has been running. */
function fanTicks(g, F, s) {
  const m = F("hood_mouth");
  const h = m.h;
  g.fillStyle = inkLevel(4);
  for (let i = 0; i < 4; i++) {
    const k = (s.fan * 1.6 + i * 0.25) % 1;
    const x = m.x - h * 0.62 - k * h * 0.55;
    const y = m.y - h * 1.30 + h * 0.34 * (0.25 + 0.5 * ((i * 3) % 2));
    g.beginPath(); g.arc(x, y, Math.max(2.8, h * 0.016), 0, TAU); g.fill();
  }
}

/* ============================================================ occupancy ==== */
export const INITIAL = EXIT_BF02;
export const MOVES   = MOVES_BF03;
export const exitOccupancy = occupancyAt(theLaboratory, MOVES, 6, INITIAL);

export const SCENE_VERSION = "bf-motion/1.0.0";
