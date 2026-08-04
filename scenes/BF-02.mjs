/* ============================================================================
   BF-02 · THE TRACE        INT. LABORATORY · MONITOR — CONTINUOUS
                                                        plan: the-laboratory

     "The software draws the flight path as a green line."
     "The line gathers over itself, loop after loop."
     "A figure appears: an almost closed circle crossed near its lower edge by
      a crooked stroke."                                — atlas/source.json
                                                 NIKO: "Stop the trial."

   MOTION: TRACE · 5.0s · 60 frames @12fps · loopClosed: false (an accumulation
   has a beginning and an end; it is the one motion in this world that must NOT
   come back to where it started).

   ---------------------------------------------------------------------------
   THE TRAP, AND THE WHOLE SCENE: THE FIGURE MUST NOT BE LEGIBLE EARLY.

   MOTION-BRIEF: "the figure is invisible in every instant." If a viewer can
   read the mark at u = 0.2 then I have drawn the ANSWER and called it an
   accumulation. The text is precise about the mechanism — "the line gathered
   over itself, LOOP AFTER LOOP, UNTIL a figure appeared" — so the figure is
   not revealed, it is CONVERGED ON, and what converges is a flight.

   So the path is six laps of brokenCircle(), each lap perturbed, and the
   perturbation decays as q = (lap / 5)^2.4 — back-loaded on purpose:

       lap 0   q .000   amplitude 1.00     u .00-.17   a scribble
       lap 1   q .021   amplitude .98      u .17-.33   a second scribble
       lap 2   q .110   amplitude .89      u .33-.50   they begin to agree
       lap 3   q .300   amplitude .70      u .50-.67   roundish; still unreadable
       lap 4   q .607   amplitude .39      u .67-.83   a ring is arguable
       lap 5   q 1.00   amplitude .00      u .83-1.0   THE FIGURE

   Nothing is revealed. Every lap is the same animal flying, and the mark
   appears because the last two laps land on each other while the first four sit
   under them as a nest. The perturbation is RADIAL plus a per-lap centre
   offset, never angular, so the 24-degree GAP survives every lap — no lap ever
   flies across the opening, because closing it is the one thing this shape
   never does.

   The only tone variation is trace()'s `age`, which MOTION-BRIEF licenses
   because it encodes TIME and not depth: the oldest laps sit at ink level 3 and
   the newest at 7. That is the accumulation, made of dots switching allegiance.

   ---------------------------------------------------------------------------
   THE PLANS AGENT'S MOST SPECULATIVE DECISION: I ACCEPT IT, AND HERE IS THE
   PROOF I ACCEPTED IT ON.

   `flightTraceArc` authors the flight in PLAN SPACE, over the box, rather than
   as a drawing on the monitor — the argument being that the monitor should draw
   the flight rather than draw a drawing. That is the right call, and it is not
   a matter of taste, because it is CHECKABLE: if the nine arc stations are the
   animal's real course and the mark is brokenCircle(), then the two must be the
   same shape under one affine map. checkPlanAgreesWithMark() below builds that
   map from the plan's own numbers (centre `observation_box_centre`, radii read
   off flight_arc_03 and flight_arc_05: RX .07460, RZ .03150) and measures every
   arc and stroke station against brokenCircle(). It runs at import time.

     THE NINE ARC STATIONS PASS, and they pass hard: worst residual 0.000999
     plan units (flight_arc_05), best 0.000050. That is under half a pixel at
     this room's depth, across 336 degrees. The arc was not eyeballed; it is
     brokenCircle(), and the check throws if it ever stops being.

   AND ONE THING THE CHECK FOUND, REPORTED RATHER THAN PAPERED OVER.
   The three-station STROKE run does not agree as well:

       flight_stroke_west   0.000101   exact
       flight_stroke_east   0.002731   z is .4941, the mark wants .4968
       flight_stroke_mid    0.015862   x is .4310, the mark wants .4467

     The endpoints are brokenCircle()'s stroke endpoints to four decimals; the
     MIDDLE station is ~12px off the mark's own stroke at this depth. The plan's
     note says the run is "crooked in z, ordered in x", and the hand that made
     it crooked moved it further than brokenCircle()'s sin(3.1t) wobble does.
     It is not a bug in anything that gets drawn — no consumer in this world
     draws the stroke FROM the stations; BF-02 draws brokenCircle() and the
     stations are a map of where it goes. But it is a place where the plan and
     the mark are 0.0159 apart while claiming to be one shape, and the next
     agent to build on flightTraceStroke should know it. The arc tolerance is
     therefore asserted (0.0015, throws) and the stroke residual is measured and
     exported (PLAN_MARK_RESIDUAL.stroke) rather than enforced, because
     enforcing it would mean editing another agent's plan to make my check pass.

   Had I authored the line on the monitor independently, neither the pass nor
   the finding could exist, and the world's central claim would rest on my care
   rather than on arithmetic. So: accepted, and the acceptance is load-bearing.

   WHAT THE SCREEN SHOWS. A plan view, normalised — which is what plotting
   software does. The box is wider than it is deep, so the flight is an ellipse
   in plan space; the software squares its axes, and what comes out is
   brokenCircle() at its authored proportions. That normalisation is the only
   liberty this file takes with the plan, it is stated here, and it is the
   reason the figure on the monitor is a broken CIRCLE and not a broken oval.

   GREEN. There is no green in this world; the post pass quantizes by luminance
   and BUILD-BRIEF §5 says an accent prints black. The line is therefore the
   only ink on a lit screen, which is the same statement about what the software
   is doing.

   DECLARED DISCONTINUITIES: none.
   ========================================================================= */
import { trace, brokenCircle, framesFor, clamp01, TAU } from "../engine/motion.mjs";
import { INK, inkLevel } from "../engine/halfworld-engine.mjs";
import { occupancyAt } from "../engine/blocking.mjs";
import { lens } from "../assets/set/_lens.mjs";
import { room, bench, monitorCart } from "../assets/set/_lab.mjs";
import {
  theLaboratory, flightTraceArc, flightTraceStroke,
  INITIAL_BF02, MOVES_BF02,
} from "./_plans/the-laboratory.mjs";
import { exitOccupancyBF01 } from "./_plans/the-maze.mjs";

/* ---- the motion scene contract ------------------------------------------ */
export const id         = "BF-02";
export const title      = "THE TRACE";
export const place      = "INT. LABORATORY · MONITOR";
export const plan       = "the-laboratory";
export const motion     = "TRACE";
export const beats      = null;
export const seconds    = 5.0;
export const loopClosed = false;
export const frames     = framesFor(motion, seconds, 12);     // 60
export const declaredBreak = null;

export const subject  = "the green line gathering over itself on the monitor";
export const distance = "CLOSE";
export const leftOut  = [
  "Niko — he crosses to this screen and says 'Stop the trial.', and drawing him " +
  "would put a second subject in a frame whose whole content is a line that is " +
  "not yet a figure. He is in MOVES; he is not in the picture.",
  "Mara at the sleeves — she can see this screen without taking her hands out " +
  "(the plan's sightline_sleeves_to_monitor), which is exactly why she does not " +
  "need to be in the shot",
  "the observation box — at this lens it lands on top of the glass, and a frame " +
  "that shows both the flight and the drawing of the flight has answered the " +
  "scene's question before asking it",
  "the tall windows, the hood, the loom bolts, the recovery rack",
];

/* ============================================================================
   THE CHECK. The plan's arc and brokenCircle(), under one map, at import time.
   ========================================================================= */
const C   = theLaboratory.stations.observation_box_centre;      // {x .4455 z .4695}
const RX  = theLaboratory.stations.flight_arc_03.x - C.x;       // +.0746
const RZ  = theLaboratory.stations.flight_arc_05.z - C.z;       // +.0315
/** brokenCircle()'s unit space -> the plan's floor. Built from the plan's own
 *  numbers; nothing here is tuned. */
const markToPlan = (p) => ({ x: C.x + (p.x - 0.5) / 0.34 * RX,
                             z: C.z + (p.y - 0.5) / 0.34 * RZ });

function residuals(names, pts) {
  const at = (arr, t) => arr[Math.round(t * (arr.length - 1))];
  return names.map((name, i) => {
    const want = theLaboratory.stations[name];
    const got  = markToPlan(at(pts, i / (names.length - 1)));
    return { name, d: +Math.hypot(want.x - got.x, want.z - got.z).toFixed(6) };
  });
}
function checkPlanAgreesWithMark() {
  const pts = brokenCircle();
  const arc    = residuals(flightTraceArc,    pts.filter(p => p.seg === "ring"));
  const stroke = residuals(flightTraceStroke, pts.filter(p => p.seg === "stroke"));
  const worstArc = arc.reduce((a, b) => (b.d > a.d ? b : a));
  if (worstArc.d > 0.0015) throw new Error(
    `[BF-02] the plan's flight ARC and brokenCircle() are NOT the same shape: ` +
    `${worstArc.name} is ${worstArc.d} plan units off. One of them was redrawn.`);
  const worstStroke = stroke.reduce((a, b) => (b.d > a.d ? b : a));
  return { arc, stroke, worstArc, worstStroke };
}
export const PLAN_MARK_RESIDUAL = checkPlanAgreesWithMark();

/* ============================================================================
   THE PATH — six laps, converging. Built once; pure.
   ========================================================================= */
const LAPS = 6;
/* Exported: BF-06 is the same screen twenty seconds later, with the record
   sitting on it, and it must be THE SAME LINE. It imports this array rather
   than re-deriving one, for the same reason nothing in this world redraws
   brokenCircle(). */
export const PATH = (() => {
  const base = brokenCircle();
  const out = [];
  for (let j = 0; j < LAPS; j++) {
    const q = Math.pow(j / (LAPS - 1), 2.4);        // convergence, back-loaded
    const A = 1 - q;                                 // how wrong this lap still is
    const ph = j * 2.3999632;                        // golden-angle phase per lap
    const cx = Math.cos(ph) * 0.140 * A;
    const cy = Math.sin(ph * 1.7) * 0.105 * A;
    for (let i = 0; i < base.length; i++) {
      const p = base[i];
      const dx = p.x - 0.5, dy = p.y - 0.5;
      const th = Math.atan2(dy, dx);
      // RADIAL only. An angular perturbation would eventually fly through the
      // gap, and the gap is the shape.
      const rr = 1 + A * (0.40 * Math.sin(th * 3 + ph)
                        + 0.26 * Math.sin(th * 7 - ph * 2.1)
                        + 0.14 * Math.sin(th * 13 + ph * 0.7));
      out.push({ x: 0.5 + dx * rr + cx, y: 0.5 + dy * rr + cy,
                 seg: p.seg, lap: j });
    }
  }
  return out;
})();

/* the unit box the screen shows. Wide enough that lap 0 is not clipped away —
   the wild flight is evidence and must stay on the glass. */
export const VIEW = { x0: -0.09, x1: 1.09, y0: -0.08, y1: 1.08 };

/* ============================================================ at(u) ======== */
export function at(u, _ctx) {
  const uu = clamp01(u);
  const drawn = trace(uu, PATH, { fade: 0.52 });
  const head = drawn.length ? drawn[drawn.length - 1] : null;
  return {
    u: uu,
    pts: drawn,
    head,
    lap: head ? head.lap : 0,
    // the sweep bar on the software's own clock — the trial is 43 seconds into
    // a 30-second interval and the readout does not stop because it cannot.
    clock: (uu * 1.37) % 1,
  };
}

/* ============================================================ draw() ======= */
const NW = 1120, NH = 760;
/* zoom 2.0 is the number at which the whole cart — floor to screen top — fits
   the frame with the screen filling its upper half. At 3.35 (first pass) the
   glass was entirely above the top edge and the scene rendered as a floor. */
const F = lens(theLaboratory, { centre: "monitor_screen", zoom: 2.25, dy: 380,
                                W: NW, H: NH });

export function draw(g, W, H, s) {
  g.save();
  g.scale(W / NW, H / NH);
  g.lineJoin = "round"; g.lineCap = "round";

  room(g, F, { z0: 0.30, z1: 0.95, ceiling: false, joints: false });
  bench(g, F);
  const scr = monitorCart(g, F, { screenW: 0.74 });
  screenFurniture(g, scr, s);
  theLine(g, scr, s);

  g.restore();
}

/* the software's own chrome, drawn as geometry (BUILD-BRIEF §5: type dissolves,
   so there is none). A frame, a corner tick, and a clock bar that runs. */
function screenFurniture(g, scr, s) {
  g.save();
  g.strokeStyle = INK; g.lineWidth = 3;
  g.strokeRect(scr.x + scr.w * 0.055, scr.y + scr.h * 0.055,
               scr.w * 0.89, scr.h * 0.78);
  // corner ticks — the plot's axes, which is all a plan view needs
  const L = scr.w * 0.05;
  g.lineWidth = 3.4;
  g.beginPath();
  g.moveTo(scr.x + scr.w * 0.055, scr.y + scr.h * 0.055 + L);
  g.lineTo(scr.x + scr.w * 0.055, scr.y + scr.h * 0.055);
  g.lineTo(scr.x + scr.w * 0.055 + L, scr.y + scr.h * 0.055);
  g.moveTo(scr.x + scr.w * 0.945 - L, scr.y + scr.h * 0.835);
  g.lineTo(scr.x + scr.w * 0.945, scr.y + scr.h * 0.835);
  g.lineTo(scr.x + scr.w * 0.945, scr.y + scr.h * 0.835 - L);
  g.stroke();
  // the clock bar, along the bottom of the glass
  const by = scr.y + scr.h * 0.94, bx0 = scr.x + scr.w * 0.055, bw = scr.w * 0.52;
  g.lineWidth = 3; g.beginPath();
  g.moveTo(bx0, by); g.lineTo(bx0 + bw, by);            // half-width: a readout,
  g.stroke();                                            // not a rule under the plot
  g.fillStyle = inkLevel(5);
  g.fillRect(bx0, by - scr.h * 0.030, bw * s.clock, scr.h * 0.030);
  g.restore();
}

/* ---- the line ------------------------------------------------------------
   Broken between laps, and between the ring and the crooked stroke, so the
   polyline never draws a chord across the gap. Ink level is trace()'s age,
   quantized to the ladder: the oldest lap is 3, the newest is 7. */
function theLine(g, scr, s) {
  const px = (p) => ({
    x: scr.x + scr.w * (0.055 + 0.89 * (p.x - VIEW.x0) / (VIEW.x1 - VIEW.x0)),
    y: scr.y + scr.h * (0.055 + 0.78 * (p.y - VIEW.y0) / (VIEW.y1 - VIEW.y0)),
  });
  g.save();
  g.beginPath();
  g.rect(scr.x + scr.w * 0.055, scr.y + scr.h * 0.055, scr.w * 0.89, scr.h * 0.78);
  g.clip();
  g.lineCap = "round"; g.lineJoin = "round";

  const pts = s.pts;
  let i = 0;
  while (i < pts.length) {
    let j = i + 1;
    while (j < pts.length && pts[j].lap === pts[i].lap && pts[j].seg === pts[i].seg) j++;
    // one continuous run: same lap, same segment
    const run = pts.slice(i, j);
    if (run.length > 1) {
      const age = run[Math.floor(run.length / 2)].age;
      const level = 3 + Math.round(4 * (1 - age));
      g.strokeStyle = inkLevel(level);
      g.lineWidth = 3.0 + 2.6 * (1 - age);
      g.beginPath();
      const a = px(run[0]); g.moveTo(a.x, a.y);
      for (let k = 1; k < run.length; k++) { const p = px(run[k]); g.lineTo(p.x, p.y); }
      g.stroke();
    }
    i = j;
  }
  // the head: where the animal is, right now. The software's cursor.
  if (s.head) {
    const h = px(s.head);
    g.fillStyle = INK;
    g.beginPath(); g.arc(h.x, h.y, 5.2, 0, TAU); g.fill();
  }
  g.restore();
}

/* ============================================================ occupancy ====
   THE CHAIN STARTS HERE. BF-01 is shot in the-maze and ends with the animal at
   `swallowtail_rise` and Mara at `mara_held_breath` — names that do not exist
   in this plan, because they are the same objects seen by a camera that has
   height. The translation is one table, and it is checked against the plan's
   own INITIAL_BF02 rather than asserted.
   ========================================================================= */
const CROSS_PLAN = {
  swallowtail_rise: "flight_arc_05",   // in the air over the box, near edge of the loop
  mara_held_breath: "mara_at_sleeves", // she has not moved; the maze camera saw her closer
};
const carried = Object.fromEntries(
  Object.entries(exitOccupancyBF01).map(([who, st]) => [who, CROSS_PLAN[st] ?? st]));

for (const [who, st] of Object.entries(carried)) {
  if (INITIAL_BF02[who] && INITIAL_BF02[who] !== st) throw new Error(
    `[BF-02] the chain from BF-01 is broken: ${who} exits BF-01 at ${st} but ` +
    `the-laboratory starts it at ${INITIAL_BF02[who]}`);
}

export const INITIAL = { ...INITIAL_BF02, ...carried };
export const MOVES   = MOVES_BF02;
export const exitOccupancy = occupancyAt(theLaboratory, MOVES, 6, INITIAL);

export const SCENE_VERSION = "bf-motion/1.0.0";
