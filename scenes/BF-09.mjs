/* ============================================================================
   BF-09 · AUGUST 1945          INT. LABORATORY · THE CABINET — CONTINUOUS
                                                        plan: the-laboratory

     "Four people stand outside a glasshouse whose windows have been painted
      white for blackout."
     "A woman in a pale dress holds a shallow wooden tray of chrysalides, each
      tied upright to a narrow card."
     "Someone has drawn a mark above one child's head: a broken circle with a
      stroke through its lower edge."                    — atlas/source.json

     NIKO: "Who are they?"  MARA: "I don't know."  NIKO: "Family?"
     MARA: "The woman is supposed to be my grandmother."

   MOTION: HOLD · 5.5s · 66 frames @12fps · loopClosed: false.

   ---------------------------------------------------------------------------
   THE MARK IS DRAWN BY brokenCircle() AND BY NOTHING ELSE.

   MOTION-BRIEF rule 5 lists this pen mark among the five appearances that are
   "provably the same shape". So it goes through assets/_broken-circle.mjs's
   paintMark(), fitted into a box 96px across above the head of the second
   child — the same call, the same points, the same function that draws Iona's
   scar in BF-22 and the wing marking in BF-24 and the flight in BF-02. If it
   ever stops being the same shape, it will be because someone changed
   brokenCircle(), which is the only way it should ever be possible.

   IT IS DRAWN ON, NOT IN. The photograph is a 1945 print; the mark is ballpoint
   or pencil laid over it decades later, so it sits at full INK on top of a card
   whose own darkest value is level 5. It is the newest thing in the frame and
   the only thing in it that was not photographed.

   PHOTOGRAPHED FIGURES ARE SILHOUETTES, ON PURPOSE. BUILD-BRIEF §5: detail at
   this size dissolves in the dot lattice. Four people 150px tall inside a
   700px print, rendered through a halftone that samples every ~4px, cannot
   carry faces — and a 1945 contact print of four people outside a glasshouse
   would not carry much either. So they are solid shapes at levels 4 and 5 with
   hard contours, and the ONE piece of interior detail in the whole print is the
   tray of chrysalides, because the tray is what the next act is about.

   BLACKOUT WHITE. "windows painted white for blackout" — so the glasshouse
   behind them is the BRIGHTEST plane in the frame (level 0) and the people in
   front of it are the darkest. That inversion is the photograph: they are
   standing in front of something that has been made deliberately unseeable.

   DECLARED DISCONTINUITIES: none. The HOLD is 0.9 degrees of tip and two
   pixels of lift on a 4.1s breath — she is holding it under a lamp.
   ========================================================================= */
import { hold, framesFor, clamp01, TAU } from "../engine/motion.mjs";
import { INK, inkLevel } from "../engine/halfworld-engine.mjs";
import { occupancyAt } from "../engine/blocking.mjs";
import { paintMark } from "../assets/_broken-circle.mjs";
import { brokenLine, speckle } from "../assets/set/_kit.mjs";
import { theLaboratory, MOVES_BF09 } from "./_plans/the-laboratory.mjs";
import { exitOccupancy as EXIT_BF08 } from "./BF-08.mjs";

export const id         = "BF-09";
export const title      = "AUGUST 1945";
export const place      = "INT. LABORATORY · THE CABINET";
export const plan       = "the-laboratory";
export const motion     = "HOLD";
export const beats      = null;
export const seconds    = 5.5;
export const loopClosed = false;
export const frames     = framesFor(motion, seconds, 12);     // 66
export const declaredBreak = null;

export const subject  = "the mark someone drew above one child's head";
export const distance = "CLOSE";
export const leftOut  = [
  "Mara and Niko — four lines of dialogue over a photograph, and the " +
  "photograph is the only thing either of them is looking at",
  "the cabinet she took it from, the bench, the lamp arm — the plan blocks her " +
  "walk from cabinet to lamp (MOVES_BF09) and none of that walk is in frame",
];

/* ============================================================ at(u) ======== */
export function at(u, _ctx) {
  const uu = clamp01(u);
  const h = hold(uu, { breathSec: 4.1, dur: seconds });
  return {
    u: uu,
    tip: h.tilt * 0.0155,               // ~0.9 degrees, all loop
    lift: (h.breath - 0.5) * 4.0,       // two pixels
  };
}

/* ============================================================ draw() ======= */
const NW = 1120, NH = 760;
const CW = 726, CH = 552;               // the print
const CX = 556, CY = 372;

export function draw(g, W, H, s) {
  g.save();
  g.scale(W / NW, H / NH);
  g.lineJoin = "round"; g.lineCap = "round";

  // the bench under the lamp: a light plane and one broken edge
  g.fillStyle = inkLevel(0); g.fillRect(0, 0, NW, NH);
  g.fillStyle = inkLevel(1); g.fillRect(0, 232, NW, NH - 232);
  brokenLine(g, -30, NW + 30, 232, 617, { lw: 4.4, segs: 3, gap: 0.06 });

  g.save();
  g.translate(CX, CY + s.lift);
  g.rotate(-0.021 + s.tip);
  print(g, s);
  g.restore();

  g.restore();
}

function print(g, s) {
  const x0 = -CW / 2, y0 = -CH / 2;
  // the card: paper with a hard edge and a deckled white border
  g.fillStyle = "#ffffff";
  g.fillRect(x0 - 22, y0 - 22, CW + 44, CH + 44);
  g.strokeStyle = INK; g.lineWidth = 4;
  g.strokeRect(x0 - 22, y0 - 22, CW + 44, CH + 44);

  // the image area
  g.fillStyle = inkLevel(1);
  g.fillRect(x0, y0, CW, CH);
  g.lineWidth = 4.5; g.strokeRect(x0, y0, CW, CH);

  glasshouse(g, x0, y0);
  ground(g, x0, y0);
  people(g, x0, y0);

  // THE MARK. brokenCircle(), through the one painter in the world, above the
  // head of the second child. Full ink on a print whose own darkest is 5.
  /* ABOVE ONE CHILD'S HEAD. The marked child is FIGS[2]: its crown sits at
     0.80 - 0.335*0.955 = 0.48 of the card's height, so the mark is centred just
     over that. Pass 1 put it at 0.055 and it read as a circle drawn on the roof
     of the glasshouse. */
  paintMark(g, { x: x0 + CW * 0.480 - 52, y: y0 + CH * 0.250, w: 104, h: 104 },
            { lw: 5.0, rot: -0.10, ink: INK });
}

/* the glasshouse: a gable of glazing bars over panes PAINTED WHITE for
   blackout. Level 0 — the brightest plane in the frame — with the bars as the
   only structure. */
function glasshouse(g, x0, y0) {
  const gx = x0 + CW * 0.06, gw = CW * 0.88, gy = y0 + CH * 0.10, gh = CH * 0.64;
  g.fillStyle = "#ffffff";
  g.beginPath();
  g.moveTo(gx, gy + gh); g.lineTo(gx, gy + gh * 0.34);
  g.lineTo(gx + gw / 2, gy); g.lineTo(gx + gw, gy + gh * 0.34);
  g.lineTo(gx + gw, gy + gh);
  g.closePath(); g.fill();
  g.strokeStyle = INK; g.lineWidth = 4.6; g.stroke();
  // glazing bars: verticals, broken by one purlin. Never a full grid.
  g.lineWidth = 3.2;
  for (let i = 1; i < 9; i++) {
    const x = gx + gw * (i / 9);
    const top = gy + gh * 0.34 * (1 - Math.abs(i / 9 - 0.5) * 2) === 0
      ? gy : gy + Math.abs(i / 9 - 0.5) * 2 * gh * 0.34;
    g.beginPath(); g.moveTo(x, top); g.lineTo(x, gy + gh); g.stroke();
  }
  brokenLine(g, gx, gx + gw, gy + gh * 0.62, 233, { lw: 3.4, segs: 3, gap: 0.05 });
  // the brush marks of the blackout paint: sparse, level 2, so the white reads
  // as APPLIED rather than as empty paper
  speckle(g, gx + 8, gy + gh * 0.40, gx + gw - 8, gy + gh - 8, 991, 26, 5.5, 2);
}

function ground(g, x0, y0) {
  g.fillStyle = inkLevel(2);
  g.fillRect(x0, y0 + CH * 0.74, CW, CH * 0.26);
  brokenLine(g, x0, x0 + CW, y0 + CH * 0.74, 771, { lw: 4, segs: 3, gap: 0.04 });
  speckle(g, x0, y0 + CH * 0.78, x0 + CW, y0 + CH, 553, 28, 4.2, 4);
}

/* four people. Two adults, two children. Solid shapes, hard contours, no
   faces — see the header. The woman in the PALE dress is level 2 against the
   others' 5, which is how she is identifiable at this size and is also the one
   adjective the text gives her. */
const FIGS = [
  { x: 0.205, h: 0.50, w: 0.070, level: 5, hat: true },              // a man
  { x: 0.345, h: 0.505, w: 0.086, level: 2, tray: true },            // the woman
  { x: 0.480, h: 0.335, w: 0.058, level: 5 },                        // the marked child
  { x: 0.612, h: 0.310, w: 0.055, level: 4 },                        // the other child
];

function people(g, x0, y0) {
  const base = y0 + CH * 0.80;
  for (const f of FIGS) {
    const cx = x0 + CW * f.x, hh = CH * f.h, hw = CW * f.w;
    g.fillStyle = inkLevel(f.level);
    g.strokeStyle = INK; g.lineWidth = 4.2;
    // body: shoulders to hem, one closed shape
    g.beginPath();
    g.moveTo(cx - hw * 0.62, base);
    g.lineTo(cx - hw * 0.90, base - hh * 0.62);
    g.quadraticCurveTo(cx, base - hh * 0.80, cx + hw * 0.90, base - hh * 0.62);
    g.lineTo(cx + hw * 0.62, base);
    g.closePath(); g.fill(); g.stroke();
    // head
    g.beginPath();
    g.ellipse(cx, base - hh * 0.90, hw * 0.44, hw * 0.52, 0, 0, TAU);
    g.fill(); g.stroke();
    if (f.hat) {
      g.beginPath();
      g.moveTo(cx - hw * 0.86, base - hh * 0.955);
      g.lineTo(cx + hw * 0.86, base - hh * 0.955);
      g.lineWidth = 5.5; g.stroke(); g.lineWidth = 4.2;
    }
    if (f.tray) tray(g, cx, base - hh * 0.40, hw);
  }
}

/* the shallow wooden tray, and the chrysalides tied upright to narrow cards.
   The one piece of interior detail in the print: six cards, six husks. */
function tray(g, cx, cy, hw) {
  const tw = hw * 2.4, th = hw * 0.34;
  g.fillStyle = inkLevel(4);
  g.fillRect(cx - tw / 2, cy, tw, th);
  g.strokeStyle = INK; g.lineWidth = 4;
  g.strokeRect(cx - tw / 2, cy, tw, th);
  for (let i = 0; i < 6; i++) {
    const x = cx - tw / 2 + tw * (i + 0.5) / 6;
    // the narrow card
    g.fillStyle = inkLevel(0);
    g.fillRect(x - tw * 0.045, cy - th * 2.0, tw * 0.09, th * 2.0);
    g.lineWidth = 2.6; g.strokeRect(x - tw * 0.045, cy - th * 2.0, tw * 0.09, th * 2.0);
    // the husk, tied to it
    g.fillStyle = inkLevel(6);
    g.beginPath();
    g.ellipse(x, cy - th * 1.30, tw * 0.030, th * 0.62, 0.08, 0, TAU);
    g.fill();
  }
}

/* ============================================================ occupancy ==== */
export const INITIAL = EXIT_BF08;
export const MOVES   = MOVES_BF09;
export const exitOccupancy = occupancyAt(theLaboratory, MOVES, 9, INITIAL);

export const SCENE_VERSION = "bf-motion/1.0.0";
