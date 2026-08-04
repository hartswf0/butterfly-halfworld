/* ============================================================================
   BF-06 · THE PATH IS THE RECORD   INT. LABORATORY · MONITOR — CONTINUOUS
                                                        plan: the-laboratory

     "Mara asks for the path visualization to be deleted from the report."
     "Niko discovers a loose wire and cannot yet tell whether it is live."

     MARA: "Delete the path visualization."   NIKO: "The path is the record."
     MARA: "The arm choice is the record."    NIKO: "It didn't choose an arm."
     MARA: "Then the trial failed."           — atlas/source.json

   MOTION: HOLD · 5.0s · 60 frames @12fps · loopClosed: false.

   ---------------------------------------------------------------------------
   NOTHING IS DELETED IN THIS UNIT. That is what makes it a HOLD.

   The text says she ASKS. Between the asking and the deleting there is a
   stretch of time in which the figure is still on the glass and is still the
   record, and this unit is that stretch. So the screen holds BF-02's finished
   line — imported, the same array, not redrawn — and the only things that move
   are a clock that does not care and three copper filaments that have not been
   tested yet.

   THE ONE COMPOSITION DECISION. MOTION-BRIEF names this room's deletion as the
   thing the whole world is about: "which is, precisely, the thing the
   laboratory does when it deletes the path visualization and keeps the arm
   choice." So the frame holds two objects and nothing else: the record, and a
   wire whose state is unknown. They are the same problem — a thing whose
   meaning depends entirely on whether you decide to test it — and putting them
   in one frame is the only argument this scene makes.

   THE WIRE IS THE DENIABLE BREATH. Three stripped filaments at the end of a
   dropped lead, moving by under two pixels on a slow harmonic. A viewer cannot
   say for certain that anything moved, which is MOTION-BRIEF rule 3 and is
   also the literal content: he cannot yet tell whether it is live.

   DECLARED DISCONTINUITIES: none.
   ========================================================================= */
import { hold, trace, framesFor, clamp01, TAU } from "../engine/motion.mjs";
import { INK, inkLevel } from "../engine/halfworld-engine.mjs";
import { occupancyAt } from "../engine/blocking.mjs";
import { lens } from "../assets/set/_lens.mjs";
import { room, bench, monitorCart, looseWire } from "../assets/set/_lab.mjs";
import { theLaboratory } from "./_plans/the-laboratory.mjs";
import { exitOccupancy as EXIT_BF05 } from "./BF-05.mjs";
import { PATH, VIEW } from "./BF-02.mjs";

export const id         = "BF-06";
export const title      = "THE PATH IS THE RECORD";
export const place      = "INT. LABORATORY · MONITOR";
export const plan       = "the-laboratory";
export const motion     = "HOLD";
export const beats      = null;
export const seconds    = 5.0;
export const loopClosed = false;
export const frames     = framesFor(motion, seconds, 12);     // 60
export const declaredBreak = null;

export const subject  = "the finished figure on the glass, still being the record";
export const distance = "MEDIUM";
export const leftOut  = [
  "Mara and Niko — both speak over this shot and neither is in it. Five lines " +
  "of dialogue about what counts as a record, over a frame containing a record " +
  "and an untested wire.",
  "the observation box, the partition, the animal — this unit is the report, " +
  "not the trial",
];

/* the finished line, computed once. trace() at u = 1 is the whole path. */
const FULL = trace(1, PATH, { fade: 0.52 });

/* ============================================================ at(u) ======== */
export function at(u, _ctx) {
  const uu = clamp01(u);
  const h = hold(uu, { breathSec: 4.1, dur: seconds });
  return {
    u: uu,
    clock: (0.37 + uu * 0.21) % 1,      // it has been running since BF-02
    wire: Math.sin(uu * TAU) * 1.8 + h.tilt * 1.1,    // under two pixels
    breath: h.breath,
  };
}

/* ============================================================ draw() ======= */
const NW = 1120, NH = 760;
const F = lens(theLaboratory, { centre: "monitor_screen", zoom: 2.25, dy: 380,
                                W: NW, H: NH });

export function draw(g, W, H, s) {
  g.save();
  g.scale(W / NW, H / NH);
  g.lineJoin = "round"; g.lineCap = "round";

  room(g, F, { z0: 0.30, z1: 0.95, ceiling: false, joints: false });
  bench(g, F);
  const scr = monitorCart(g, F, { screenW: 0.74 });
  theRecord(g, scr, s);
  wire(g, F, s);

  g.restore();
}

/* the record: BF-02's own points, laid into the same VIEW box, at the ink
   ladder that unit left them at. Nothing here recomputes a shape. */
function theRecord(g, scr, s) {
  const px = (p) => ({
    x: scr.x + scr.w * (0.055 + 0.89 * (p.x - VIEW.x0) / (VIEW.x1 - VIEW.x0)),
    y: scr.y + scr.h * (0.055 + 0.78 * (p.y - VIEW.y0) / (VIEW.y1 - VIEW.y0)),
  });
  g.save();
  g.beginPath();
  g.rect(scr.x + scr.w * 0.055, scr.y + scr.h * 0.055, scr.w * 0.89, scr.h * 0.78);
  g.clip();
  g.strokeStyle = INK; g.lineWidth = 3;
  g.strokeRect(scr.x + scr.w * 0.055, scr.y + scr.h * 0.055, scr.w * 0.89, scr.h * 0.78);
  let i = 0;
  while (i < FULL.length) {
    let j = i + 1;
    while (j < FULL.length && FULL[j].lap === FULL[i].lap && FULL[j].seg === FULL[i].seg) j++;
    const run = FULL.slice(i, j);
    if (run.length > 1) {
      const age = run[Math.floor(run.length / 2)].age;
      g.strokeStyle = inkLevel(3 + Math.round(4 * (1 - age)));
      g.lineWidth = 3.0 + 2.6 * (1 - age);
      g.beginPath();
      const a = px(run[0]); g.moveTo(a.x, a.y);
      for (let k = 1; k < run.length; k++) { const p = px(run[k]); g.lineTo(p.x, p.y); }
      g.stroke();
    }
    i = j;
  }
  g.restore();

  // the clock bar. Half-width, so it is a readout and not a rule.
  const by = scr.y + scr.h * 0.94, bx0 = scr.x + scr.w * 0.055, bw = scr.w * 0.52;
  g.strokeStyle = INK; g.lineWidth = 3;
  g.beginPath(); g.moveTo(bx0, by); g.lineTo(bx0 + bw, by); g.stroke();
  g.fillStyle = inkLevel(5);
  g.fillRect(bx0, by - scr.h * 0.030, bw * s.clock, scr.h * 0.030);
}

/* the loose wire, hanging off the cart. Its three filaments move by less than
   two pixels; whether they are live is not information this frame has. */
function wire(g, F, s) {
  const w = F("loose_wire");
  const h = w.h;
  g.save();
  g.strokeStyle = INK; g.lineWidth = 4.4;
  g.beginPath();
  g.moveTo(w.x - h * 0.20, w.y - h * 0.62);
  g.bezierCurveTo(w.x - h * 0.02, w.y - h * 0.46, w.x + h * 0.14, w.y - h * 0.52,
                  w.x + h * 0.17, w.y - h * 0.30);
  g.stroke();
  g.lineWidth = 3.2;
  for (const a of [-0.42, 0, 0.42]) {
    g.beginPath();
    g.moveTo(w.x + h * 0.17, w.y - h * 0.30);
    g.lineTo(w.x + h * 0.17 + Math.sin(a) * h * 0.10 + s.wire,
             w.y - h * 0.30 + Math.cos(a) * h * 0.095);
    g.stroke();
  }
  g.restore();
}

/* ============================================================ occupancy ==== */
export const INITIAL = EXIT_BF05;
export const MOVES   = [];
export const exitOccupancy = occupancyAt(theLaboratory, MOVES, 6, INITIAL);

export const SCENE_VERSION = "bf-motion/1.0.0";
