/* ============================================================================
   BF-10 · DO NOT TURN AROUND   INT. LABORATORY · THE REVERSE — CONTINUOUS
                                                        plan: the-laboratory

     "On the back, in blue fountain pen: ASTER HOUSE / AUGUST 1945 / IONA,
      ELISE, THOMAS / DO NOT TURN AROUND."
     "Below the writing is the same broken circle. The ink has faded from black
      to brown but the shape is clean."                  — atlas/source.json

     NIKO: "Your mother was alive in 1945?"   MARA: "No."
     MARA: "My mother was born in 1963."      NIKO: "Then Elise isn't your mother."
     MARA: "It was her name."   MARA: "She said she remembered being there."

   MOTION: HOLD · 5.5s · 66 frames @12fps · loopClosed: false.

   ---------------------------------------------------------------------------
   THE WHOLE UNIT IS FOUR LINES OF HANDWRITING, SO THE HANDWRITING HAS TO WORK.

   BUILD-BRIEF §5: "Small type DISSOLVES in the dot lattice. Draw numerals and
   signage as GEOMETRY, or size >= 33px." A fillText() of DO NOT TURN AROUND at
   this scale comes out of the halftone pass as grey fur, and a unit whose
   entire content is an instruction would then be a picture of an illegible
   smudge. So assets/set/_glyphs.mjs holds a monoline stroke alphabet — every
   letter a set of polylines on a unit box — and every line here is set at cap
   height 46 to 54, well above the floor, and stroked at 0.13 of cap height.

   A single-stroke skeleton is not a compromise. It is fountain pen on the back
   of a print: one nib width, no modulation, and it is the only letterform that
   survives an ordered-dot field at all.

   BLUE FOUNTAIN PEN, AND THERE IS NO BLUE. BUILD-BRIEF §5 again: "A blue accent
   mark PRINTS BLACK — the post pass quantizes by luminance." So the writing is
   ink. What the text does give me is a value change I can actually draw: the
   MARK below it "has faded from black to brown", and brown is lighter than
   black. So the four written lines are level 7 and the mark under them is
   level 5 — two steps down the ladder — and the difference between them is
   exactly the sentence: the words are one age and the shape is older.

   AND THE SHAPE IS CLEAN. paintMark() from assets/_broken-circle.mjs, the same
   points as BF-02's flight and BF-09's pen mark on the recto. Faded is a LEVEL,
   not a degradation of the geometry: nothing here is roughened, blurred or
   broken up, because the sentence is explicit that the fading did not touch the
   shape. That is the whole reason the mark can still be recognised in BF-24.

   ---------------------------------------------------------------------------
   DO NOT TURN AROUND is written on the side you can only read BY turning it
   around. That joke is the unit and it needs no help; the frame is a rectangle
   of card and nothing else is in it.

   DECLARED DISCONTINUITIES: none.
   ========================================================================= */
import { hold, framesFor, clamp01 } from "../engine/motion.mjs";
import { INK, inkLevel } from "../engine/halfworld-engine.mjs";
import { occupancyAt } from "../engine/blocking.mjs";
import { paintMark } from "../assets/_broken-circle.mjs";
import { strokeText, textWidth } from "../assets/set/_glyphs.mjs";
import { brokenLine, speckle } from "../assets/set/_kit.mjs";
import { theLaboratory } from "./_plans/the-laboratory.mjs";
import { exitOccupancy as EXIT_BF09 } from "./BF-09.mjs";

export const id         = "BF-10";
export const title      = "DO NOT TURN AROUND";
export const place      = "INT. LABORATORY · THE REVERSE";
export const plan       = "the-laboratory";
export const motion     = "HOLD";
export const beats      = null;
export const seconds    = 5.5;
export const loopClosed = false;
export const frames     = framesFor(motion, seconds, 12);     // 66
export const declaredBreak = null;

export const subject  = "four lines in fountain pen, and the same shape under them";
export const distance = "CLOSE";
export const leftOut  = [
  "the recto — BF-09 is the recto, and a frame containing both sides of one " +
  "card would be a diagram of a photograph rather than a photograph",
  "both speakers, the lamp, the bench, the room",
];

/* CAP HEIGHTS ARE SET BY THE CARD, NOT BY TASTE. textWidth() is exact, so each
   line is sized to fit inside the writing area (756px) with a margin. Pass 1
   set every line at 46-54 and the two long ones ran off the right edge of the
   photograph and out over the bench — 809px of text in a 638px card. */
const LINES = [
  { t: "ASTER HOUSE",            h: 54, y: 150 },
  { t: "AUGUST 1945",            h: 50, y: 226 },
  { t: "IONA, ELISE, THOMAS",    h: 37, y: 296 },   // 19 glyphs -> 650px
  { t: "DO NOT TURN AROUND",     h: 41, y: 366 },   // 18 glyphs -> 682px
];

/* ============================================================ at(u) ======== */
export function at(u, _ctx) {
  const uu = clamp01(u);
  const h = hold(uu, { breathSec: 4.1, dur: seconds });
  return { u: uu, tip: h.tilt * 0.013, lift: (h.breath - 0.5) * 3.6 };
}

/* ============================================================ draw() ======= */
const NW = 1120, NH = 760;
const CW = 880, CH = 616, CX = 552, CY = 376;

export function draw(g, W, H, s) {
  g.save();
  g.scale(W / NW, H / NH);
  g.lineJoin = "round"; g.lineCap = "round";

  g.fillStyle = inkLevel(0); g.fillRect(0, 0, NW, NH);
  g.fillStyle = inkLevel(1); g.fillRect(0, 246, NW, NH - 246);
  brokenLine(g, -30, NW + 30, 246, 811, { lw: 4.4, segs: 3, gap: 0.06 });

  g.save();
  g.translate(CX, CY + s.lift);
  g.rotate(0.017 + s.tip);
  g.translate(-CW / 2, -CH / 2);
  card(g);
  g.restore();

  g.restore();
}

function card(g) {
  // the back of a 1945 print: paper, a hard edge, and the ghost of the emulsion
  // curl along one side. Nothing else.
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, CW, CH);
  g.strokeStyle = INK; g.lineWidth = 4.5;
  g.strokeRect(0, 0, CW, CH);
  g.lineWidth = 3;
  g.beginPath(); g.moveTo(CW - 20, 12); g.lineTo(CW - 20, CH - 12); g.stroke();
  speckle(g, 14, 14, CW - 34, CH - 14, 313, 18, 3.4, 2);

  // THE WRITING. Level 7, a hand, leaning forward, with a per-glyph baseline
  // wobble so it is written rather than set.
  for (const L of LINES) {
    strokeText(g, L.t, 62, L.y - L.h, L.h,
               { lw: L.h * 0.128, slant: 0.10, jitter: 0.016, color: inkLevel(7) });
  }
  // the rule the writer drew under the date block — broken, short, a hand's
  brokenLine(g, 62, 62 + textWidth("AUGUST 1945", 50) * 0.86, 246, 199,
             { lw: 3.4, segs: 2, gap: 0.08 });

  /* THE SAME BROKEN CIRCLE, TWO INK LEVELS DOWN. Faded black to brown; the
     SHAPE is clean, so nothing about the geometry is degraded. */
  /* BELOW THE WRITING, which is where the sentence puts it. Pass 1 centred it
     at 0.60 of the card and it landed across DO NOT TURN AROUND, so the unit's
     two objects were on top of each other. */
  paintMark(g, { x: CW * 0.50 - 108, y: CH * 0.645, w: 216, h: 216 },
            { lw: 6.0, rot: 0.06, ink: inkLevel(5) });
}

/* ============================================================ occupancy ==== */
export const INITIAL = EXIT_BF09;
export const MOVES   = [];
export const exitOccupancy = occupancyAt(theLaboratory, MOVES, 6, INITIAL);

export const SCENE_VERSION = "bf-motion/1.0.0";
