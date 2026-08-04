/* ============================================================================
   BF-28 · THE PAINT IS NEW    EXT. THE WAREHOUSE · PLYWOOD          the-lot

     "A low brick structure attached to the rear of the warehouse, windows
      covered in plywood. On the nearest board, painted: a broken circle with a
      line through it. The paint is new."          — atlas/source.json
     NIKO: "That wasn't here last week."  MARA: "You come here?"  NIKO: "Lunch."

   MOTION: HOLD · 5.5s · 66 frames @12fps.
   ACT II ENDS HERE. `exitOccupancyActII` is exported for Act III.

   ---------------------------------------------------------------------------
   THE FIFTH OCCURRENCE, AND THE ONLY ONE SOMEBODY MADE ON PURPOSE.

   the-lot: "`fresh_paint_mark` is a broken circle with a line through it, on
   `plywood_board_nearest`, 11px apart. It is the same shape as the flight trace
   in the-laboratory, the scar on Iona's thumb in the-mill, the pen mark on the
   1945 photograph and the marking on the old butterfly's closed wings. Authored
   once in brokenCircle(); imported, never redrawn. If they differ the world is
   lying (MOTION-BRIEF S5). Note that this is the ONLY one of the five that
   somebody made with a brush, recently, on purpose."

   So this file imports paintMark() from assets/_broken-circle.mjs — the same
   call BF-22 makes for the scar and creature.oldbutterfly makes for the wing —
   and the set module refuses to draw it: plywoodFace() returns the BOX and
   paints nothing inside it. Two files that could each have drawn a broken
   circle, and neither does.

   WHAT MAKES IT NEW. Not a colour: the post pass quantizes by luminance. What
   is new about new paint, in ink, is that its edges are HARD while everything
   around them is soft with weather, that it sits ON the grain instead of in it,
   and that it has run: two short drips under the lower arc, which is the one
   thing in this frame that could only have happened in the last few days. The
   board is level 2 and weathered; the mark is level 6 and is not.

   THE HOLD. Nothing in this unit moves except Niko walking up to the board and
   the light. So hold() runs the frame — a 4.1s breath and a 9.3s weight shift,
   both deniable — and the only authored event is the plan's own move, niko
   weeds_south -> plywood_board_nearest over t 0 to 3.0. He arrives and stops in
   front of a thing he has been eating lunch inside sight of, and the plan says
   how far: "0.117 of the lot, 68px."

   DECLARED DISCONTINUITIES: none.

   COMPOSITION. One subject: fresh paint on the nearest board.
   ========================================================================= */
import { hold, framesFor, clamp01 } from "../engine/motion.mjs";
import { INK, gray, lerp, smooth } from "../engine/halfworld-engine.mjs";
import { occupancyAt } from "../engine/blocking.mjs";
import { theLot, MOVES_BF28 } from "./_plans/the-lot.mjs";
import { lens, NW, NH, BODY_H } from "../assets/set/_stage.mjs";
import { pavement, plywoodFace } from "../assets/set/lot.mjs";
import { paintMark } from "../assets/_broken-circle.mjs";
import { LV, brokenLine } from "../assets/set/_kit.mjs";
import { exitOccupancy as exitOccupancyBF27 } from "./BF-27.mjs";
import niko from "../assets/character/niko.mjs";

export const id         = "BF-28";
export const title      = "THE PAINT IS NEW";
export const place      = "EXT. THE WAREHOUSE · PLYWOOD";
export const plan       = "the-lot";
export const motion     = "HOLD";
export const beats      = null;
export const seconds    = 5.5;
export const loopClosed = false;
export const frames     = framesFor(motion, seconds, 12);      // 66
export const declaredBreak = null;
export const breakAt    = null;

export const subject  = "fresh paint on the nearest board: a broken circle with a line through it";
export const distance = "MEDIUM";
export const leftOut  = [
  "Mara — she asks the question and stays where BF-27 left her, off the near edge",
  "the annex door itself, which is the-facility's side of this wall and BF-29's business",
  "Iona, who has stopped and is not coming",
  "the boy this whole plan is running toward. He is never in Act II.",
];

/* ---- framing ------------------------------------------------------------ */
/* PASS 2: at zoom 2.10 the annex sat in the top third and two thirds of the
   frame was empty pavement, with the mark at 50px. 3.2 fills the frame with the
   wall the unit is about and puts the mark at 132px. */
const ZOOM   = 3.20;
const BODY_K = 0.30;
const station = lens(theLot, { zoom: ZOOM, cx: 0.4700, cy: 0.5057 });
const FACE   = station("warehouse_annex_face");
const NEAREST = station("plywood_board_nearest");
const MARK   = station("fresh_paint_mark");
const LUNCH  = station("niko_lunch_spot");
const WEST   = station("plywood_board_west");
const bodyH = (p) => BODY_H * p.scale * BODY_K;

/* ============================================================ at(u) ======== */
export function at(u, _ctx) {
  const h = hold(u, { breathSec: 4.1, dur: seconds });
  return {
    u,
    // the plan's own move: weeds_south -> plywood_board_nearest over t 0..3 of 6
    walk: smooth(clamp01(u / 0.50)),
    room: h,
    niko: niko.motions.breath(u),
  };
}

/* ============================================================ draw() ======= */
export function draw(g, W, H, s) {
  g.save();
  g.scale(W / NW, H / NH);
  g.lineJoin = "round"; g.lineCap = "round";

  const bh = bodyH(NEAREST);
  const wallH = bh * 1.55;

  pavement(g, FACE.y - 10, NH + 20, -20, NW + 20, { seed: 61, cracks: 5 });

  /* ---- the low brick structure, windows covered in plywood. Three boards; the
     paint is on the nearest. plywoodFace returns the box and paints nothing. */
  const face = plywoodFace(g, WEST.x - bh * 0.30, FACE.y - wallH,
    (NEAREST.x - WEST.x) + bh * 1.10, wallH, { seed: 109, boards: 3 });

  /* ---- THE MARK. brokenCircle(), through assets/_broken-circle.mjs. The same
     array as the scar, the wing, the flight trace and the pen mark. Level 6 on
     a level-2 board: hard edges on a weathered plane is what new is. */
  const box = face.markBox;
  paintMark(g, box, {
    segs: ["ring", "stroke"], rot: 0.06,
    ink: gray(0x2e), lw: Math.max(6, box.w * 0.055),
  });
  drips(g, box);

  /* ---- NIKO, walking up to it. He has been eating lunch 68px from this wall. */
  /* PASS 2: he walked to +0.62 of a body width and stopped standing ON the
     mark. He is looking at it, so he stops beside it: the subject stays visible
     for the whole loop and the man is the thing that arrives. */
  const nx = lerp(LUNCH.x + bh * 1.9, NEAREST.x + bh * 1.14, s.walk);
  const ny = lerp(LUNCH.y + bh * 0.30, NEAREST.y + bh * 0.10, s.walk);
  const nb = bodyH({ scale: lerp(LUNCH.scale, NEAREST.scale, s.walk) });
  const st = { ...niko.states.nodes.lifting.preview, ...s.niko, guise: "empty" };
  st.rig = {
    ...st.rig,
    bodyYaw: 2.30, headYaw: 2.55, headPitch: -0.16,
    spineLean: -0.06 + 0.04 * s.room.tilt,
    pelvisX: s.room.weight * 0.02,
  };
  const w = nb * 0.42;
  g.save();
  g.translate(nx - w, ny - nb);
  niko.draw(g, w * 2, nb, st);
  g.restore();

  g.restore();
}

/* TWO DRIPS. The only thing in this frame that could only have happened in the
   last few days, and the whole of what "the paint is new" gets to be in ink. */
function drips(g, box) {
  g.save();
  g.strokeStyle = gray(0x2e); g.lineCap = "round";
  for (const [kx, len, w] of [[0.34, 0.24, 0.030], [0.62, 0.15, 0.024]]) {
    g.lineWidth = Math.max(4, box.w * w);
    const x = box.x + box.w * kx, y = box.y + box.h * 0.86;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + box.w * 0.012, y + box.h * len); g.stroke();
  }
  g.restore();
}

/* ---- occupancy ----------------------------------------------------------
   THE ACT BOUNDARY. Act III imports `exitOccupancyActII`. */
export const INITIAL = exitOccupancyBF27;
export const MOVES   = MOVES_BF28;
export const exitOccupancy = occupancyAt(theLot, MOVES, 6, INITIAL);

/** ACT II's aggregate handoff. Named, so Act III imports one thing:
 *      import { exitOccupancyActII } from "./BF-28.mjs";
 *  `plan` says which plan those station names belong to — the-lot and the-mill
 *  do not share a namespace, and the world crosses between them at annex_door,
 *  which the-facility asserts by the same name. */
export const exitOccupancyActII = {
  plan: "the-lot",
  at: "BF-28",
  occupancy: exitOccupancy,
  crossesInto: { plan: "the-facility", station: "annex_door" },
};

export const SCENE_VERSION = "bf-motion/1.0.0";
