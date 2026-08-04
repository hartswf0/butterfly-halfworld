/* ============================================================================
   BF-16 · LONG DUSTY COLUMNS     INT. MILL · THE STAIRCASE     plan: the-mill

     "Light enters from windows at each landing and falls in long dusty columns.
      Mara moves down through them, one after another.
      A strip of red satin slides across her shoe like a tongue."
                                                          — atlas/source.json

   MOTION: ADVANCE · 5.0s · 60 frames @12fps. Five columns, five dwells.

   ---------------------------------------------------------------------------
   ADVANCE IS QUANTISED AND THAT IS THE UNIT.

   advance(u, 5, { dwell: 0.72 }) over `lightColumnsDescending`. Sixty frames
   across five indices is twelve frames each: 8.6 held, 3.4 sliding. She is IN a
   column or BETWEEN columns and never partly in one — the plan says so in its
   own note and it is the difference between a descent and a camera move. At
   12fps the held frames are the drawing and the sliding frames are the join.
   Nothing here eases across a join.

   THE PLAN DOES THE ARRIVING AND I DO NOT HAVE TO ASK FOR IT. project() renders
   a body at column_5 at scale 0.7387 and at column_1 at 0.9600 — the 30% the
   plan's header claims, measured again here. Every position and every size in
   this file comes out of lens(theMill), so the growth is the plan's and not a
   number I chose.

   ---------------------------------------------------------------------------
   THE FINDING THAT COST THIS SCENE ITS FIRST HOUR, AND THE FIX.

   At zoom 1 the whole five-column descent covers 172px of frame width and 144px
   of frame height, while a scale-1 adult at BODY_H is 470px tall. So the camera
   the plan chose cannot show five distinct columns AND a body at the size the
   floor model wants: the five shafts land 43px apart and merge into one blob
   behind a figure three times taller than the run she is walking down.

   That is a real property of the geometry and not a bug in it, and there are
   only two knobs. Zoom is one — at 2.7 the run opens out to 553px wide and 385
   tall and the five columns land 138px apart, distinct. The other is that a WIDE
   shot of a stairwell has a smaller body in it than a portrait does, so the body
   carries a scene-level factor BODY_K = 0.176 ON TOP OF the plan's depth term.
   K is uniform, so it cannot touch the 30%: 165px at column_5, 215px at
   column_1, which is 0.9600/0.7387 to three figures. The plan's argument
   survives; only the crop is mine.

   ---------------------------------------------------------------------------
   LIGHT IS AN ABSENCE OF INK. The harness fills the canvas white before draw()
   runs, so nothing can be brighter than paper. The stairwell therefore carries
   the tone and the five shafts are PAPER cut out of it with hard edges, full of
   DARK motes — a mote you can see is a mote with light behind it. See the header
   of assets/set/mill.mjs; this is the scene that decision was made for.

   THE RED SATIN. One accent in an otherwise grey descent, and red cannot be red:
   the post pass quantizes by luminance. What survives of satin is that it is the
   only specular surface in a mill made of brick, steel and stone — a dark band
   with one hard white fold running down it, the single place in this scene where
   a bright edge sits against a dark one. The plan puts satin_strip between
   landings 2 and 1, so it lives inside index 3, and it is on screen for ten
   frames of sixty. "Like a tongue" is the motion: it curls as it crosses.

   DECLARED DISCONTINUITIES: none. The dwells are held frames, not cuts.

   COMPOSITION. One subject: a body moving through discrete columns of light.
   ========================================================================= */
import { advance, framesFor, TAU, clamp01 } from "../engine/motion.mjs";
import { INK, inkLevel, lerp, smooth } from "../engine/halfworld-engine.mjs";
import { occupancyAt } from "../engine/blocking.mjs";
import {
  theMill, MOVES_BF16, landingsDescending, lightColumnsDescending,
} from "./_plans/the-mill.mjs";
import { lens, NW, NH, BODY_H } from "../assets/set/_stage.mjs";
import { brickWall, millWindow, lightColumn, stairFlight, satinStrip } from "../assets/set/mill.mjs";
import { LV, brokenLine } from "../assets/set/_kit.mjs";
import { exitOccupancy as exitOccupancyBF15 } from "./BF-15.mjs";
import mara from "../assets/character/mara.mjs";

/* ---- the motion scene contract ------------------------------------------ */
export const id         = "BF-16";
export const title      = "LONG DUSTY COLUMNS";
export const place      = "INT. MILL · THE STAIRCASE";
export const plan       = "the-mill";
export const motion     = "ADVANCE";
export const beats      = null;
export const seconds    = 5.0;
export const loopClosed = false;
export const frames     = framesFor(motion, seconds, 12);      // 60
export const declaredBreak = null;
export const breakAt    = null;

export const subject  = "a body moving down through five discrete columns of light";
export const distance = "WIDE";
export const leftOut  = [
  "Niko — the plan keeps him at the stairhead, which is why BF-17 is two women alone",
  "the lobby she is descending into (BF-17 owns it)",
  "the fire door above (BF-15 owns it)",
  "her face — at this distance it is four dots and it is not the subject",
  "landings 4, 3 and 2's balustrades: the treads carry the descent, the rails would stripe it",
];

/* ---- framing --------------------------------------------------------------
   Every number below is derived; nothing is hand-placed. See the header for
   why zoom is 2.7 and why the body carries a second, uniform factor. */
const ZOOM   = 2.7;
/* PASS 2: 0.176 put a 165px body beside a 142px-wide shaft, so "she is IN a
   column" was a claim the drawing could not make. At 0.21 her width at
   column_1 is 108px against a 107px shaft: she fills it exactly. */
const BODY_K = 0.21;
const station = lens(theMill, { zoom: ZOOM, cx: 0.3555, cy: 0.6263 });

const COLS = lightColumnsDescending.map((n) => station(n));    // column_5 .. column_1
const WINS = ["window_landing_5", "window_landing_4", "window_landing_3",
              "window_landing_2", "window_landing_1"].map((n) => station(n));
const TREADS = landingsDescending.map((n) => station(n));      // 7, stairhead -> foot
const SATIN = station("satin_strip");
const SHOE  = station("mara_shoe_step");

const bodyH = (p) => BODY_H * p.scale * BODY_K;

/* THE SATIN'S WINDOW. The plan puts it between landings 2 and 1, which is
   inside index 3 of the advance. Ten frames of sixty: long enough to be an
   event, short enough that the descent is not about it. */
const SATIN_U0 = 0.66, SATIN_U1 = 0.82;

/* ============================================================ at(u) ========
   PURE. advance() is the whole of it; nothing here integrates. */
export function at(u, _ctx) {
  const a = advance(u, COLS.length, { dwell: 0.72 });
  const i = a.index;
  const j = Math.min(COLS.length - 1, i + 1);
  const A = COLS[i], B = COLS[j];
  const k = a.shift;                                  // 0 while held, then a fast slide

  /* the satin: its own clock inside index 3, so it is not smeared across the
     whole descent. `sat` 0..1 is how far the strip has crossed her shoe. */
  const sat = clamp01((u - SATIN_U0) / (SATIN_U1 - SATIN_U0));
  const satOn = u >= SATIN_U0 && u <= SATIN_U1;

  return {
    u, index: i, settled: a.settled, shift: k,
    x: lerp(A.x, B.x, k),
    y: lerp(A.y, B.y, k),
    h: lerp(bodyH(A), bodyH(B), k),
    /* a stride, and ONLY while the shift is running. During a dwell the legs
       are still and the only motion in the body is the breath. */
    stride: a.settled ? 0 : Math.sin(k * Math.PI),
    /* the dust never quantises — it is in the air, not on the stair, and it is
       the one continuous thing in a scene made entirely of steps */
    dust: u,
    satOn, sat,
  };
}

/* ============================================================ draw() ======= */
export function draw(g, W, H, s) {
  g.save();
  g.scale(W / NW, H / NH);
  g.lineJoin = "round"; g.lineCap = "round";

  /* ---- the west wall, with a window at each landing. The windows are IN the
     brick (the-mill fixtures), so the wall is drawn first and they are cut into
     it. It is level 1: this is most of the left half of the frame. */
  const wallR = WINS[0].x + 96;
  brickWall(g, -30, -30, wallR, NH + 20, { seed: 3, course: 30, level: 1 });

  const winBoxes = WINS.map((p, i) => {
    const bh = bodyH(p);
    const w = bh * 0.62, h = bh * 0.58;
    const box = { x: p.x - w / 2, y: p.y - bh * 0.60 - h, w, h };
    millWindow(g, box.x, box.y, box.w, box.h, { cols: 3, rows: 3, lw: Math.max(3.4, bh * 0.026) });
    return box;
  });

  /* ---- the well. The stair side of the frame carries the tone the columns are
     cut out of; the right edge stays paper, so half the frame is still cream.
     PASS 2: at level 1 the paper shafts had nothing to be cut out OF. Level 2. */
  g.fillStyle = LV(2);
  g.beginPath();
  g.moveTo(wallR - 10, -20);
  g.lineTo(NW * 0.90, -20);
  g.lineTo(NW * 0.56, NH + 20);
  g.lineTo(wallR - 10, NH + 20);
  g.closePath();
  g.fill();

  /* ---- the treads. Six short flights along landingsDescending, every one with
     `stringer:false` — PASS 2: each segment drew its own stringer from its own
     wTop/2 to its own wBot/2, and at the joins those shot off across the frame
     as long diagonal bars. One run, one stringer, drawn below. */
  for (let i = 0; i < TREADS.length - 1; i++) {
    const a = TREADS[i], b = TREADS[i + 1];
    stairFlight(g, { x: a.x, y: a.y }, { x: b.x, y: b.y }, {
      steps: 3, wTop: bodyH(a) * 1.02, wBot: bodyH(b) * 1.10,
      seed: 12 + i * 8, stringer: false, lw: 3.4 + bodyH(b) * 0.006,
    });
  }
  { const a = TREADS[0], b = TREADS[TREADS.length - 1];
    brokenLine(g, 0, 1, 0, 0, { lw: 0, segs: 1 });     // (no-op; keeps the import honest)
    g.strokeStyle = INK; g.lineWidth = 5;
    for (const [t0, t1] of [[0.02, 0.30], [0.38, 0.66], [0.74, 0.98]]) {
      g.beginPath();
      g.moveTo(lerp(a.x, b.x, t0) + lerp(bodyH(a), bodyH(b), t0) * 0.55,
               lerp(a.y, b.y, t0));
      g.lineTo(lerp(a.x, b.x, t1) + lerp(bodyH(a), bodyH(b), t1) * 0.55,
               lerp(a.y, b.y, t1));
      g.stroke();
    } }

  /* ---- THE FIVE COLUMNS. Paper, hard-edged, full of dark motes, each
     authored window-to-floor so the light has a direction.
     PASS 2: wBot was 0.86 of a body height — 142px shafts landing 138px apart,
     which is five overlapping wedges and therefore one wedge. A column is now
     narrower than the gap between columns, which is what makes them countable
     and therefore what makes this an ADVANCE. */
  COLS.forEach((p, i) => {
    const bh = bodyH(p);
    const wb = winBoxes[i];
    lightColumn(g, { x: wb.x + wb.w * 0.58, y: wb.y + wb.h }, { x: p.x, y: p.y }, {
      wTop: bh * 0.26, wBot: bh * 0.52, u: s.dust, motes: 13, seed: 7 + i * 5,
      lit: s.index === i ? 1 : 0.5,
    });
  });

  /* ---- THE SATIN, on the tread between landings 2 and 1 --------------- */
  if (s.satOn) {
    const len = bodyH(SHOE) * 0.92;
    satinStrip(g, lerp(SATIN.x - len * 0.5, SHOE.x + len * 0.2, s.sat), SHOE.y - 6, len,
      { u: s.sat, w: bodyH(SHOE) * 0.075, dir: 1 });
  }

  /* ---- MARA. In a column, or between columns. Never partly in one. ---- */
  drawMara(g, s);

  g.restore();
}

/* ---- the body -----------------------------------------------------------
   `mv_delete` is her most neutral standing pose; the descent is authored on the
   rig, the way iona.mjs authors twenty_paces, because the cast has no walk pose
   and inventing one in a scene file would put a sixth Mara in the world. */
function drawMara(g, s) {
  const sw = s.stride;
  const st = {
    ...mara.states.nodes.del.preview,
    ...mara.motions.breath(s.u),
    box: false, guise: "gloved",
    gaze: { x: -0.10, y: 0.30 },
  };
  st.rig = {
    ...st.rig,
    // the stride: hips and knees only while the shift is running
    hipL: 0.44 * sw, hipR: -0.44 * sw,
    kneeL: 0.46 * Math.max(0, -sw), kneeR: 0.46 * Math.max(0, sw),
    armLUpper: 0.24 - 0.26 * sw, armRUpper: -0.24 + 0.26 * sw,
    rootY: -0.020 * Math.abs(sw),
    // going DOWN: the weight is forward and the head is over the treads
    spineLean: -0.14, headPitch: 0.26, neckPitch: 0.12, gazeY: 0.34,
    bodyYaw: -0.52, headYaw: -0.26,
  };
  const h = s.h, w = h * 0.42;
  g.save();
  g.translate(s.x - w, s.y - h);
  mara.draw(g, w * 2, h, st);
  g.restore();
}

/* ---- occupancy ---------------------------------------------------------- */
export const INITIAL = exitOccupancyBF15;
export const MOVES   = MOVES_BF16;
export const exitOccupancy = occupancyAt(theMill, MOVES, 10, INITIAL);

export const SCENE_VERSION = "bf-motion/1.0.0";
