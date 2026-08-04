/* assets/set/_glasshouse.mjs — WHAT IS ON THE FILM. ASTER HOUSE, AUGUST 1945.
   ============================================================================
     "A glasshouse. White-painted windows. Lavender beside a pool. Three
      children with their backs to the camera."
     "A woman enters carrying a tray of chrysalides. Mara knows her before she
      turns — not her face. Her shoulders."                        — BF-33

   Used by BF-33 (it appears) and BF-35 (it is replaced). AUTHORED ONCE, for the
   same reason the broken circle is: BF-35's dissolve runs this image and the
   lobby through one threshold map, and if the two units drew two glasshouses the
   dissolve would be between two different films.

   ---------------------------------------------------------------------------
   THE SHOULDERS ARE NOT A DESCRIPTION, THEY ARE A NUMBER

   BF-17  IONA: "You have her shoulders."
   BF-33  "Mara knows her before she turns — not her face. Her shoulders."

   character.mara carries the only non-default proportion in the entire cast —
   `proportion.shoulders: 1.12` — and its own header says why: "the shoulders are
   the one thing about her body that is recognisable at a distance, from behind,
   in a projected 8mm frame." So the woman in this film is built from THAT
   NUMBER, imported, not from a shape chosen here that looks about right. The
   three children are built at 1.0. In the frame the woman is the only silhouette
   in the glasshouse that is wider at the top than a person's ought to be, and
   that is the entire content of "Mara knows her before she turns".

   SHE DOES NOT TURN. Not in BF-33 and not ever. BF-35 replaces the image instead,
   which is the story's own answer to the question the sentence sets up.

   NO FACES. Everyone in this film has their back to the camera, at 1945, in a
   frame that is 740px wide and being looked at through a halftone. A face here
   would be six dots and a lie.

   LAVENDER IS A SMELL (BUILD-BRIEF S1). There is no colour in this file.
   ELISE IS NOT IN THIS FILM. character.elise's locks are explicit: "NO FIGURE IN
   THE PROJECTED FILM ... Elise is not in it." Three children and one woman, and
   the woman is Mara's grandmother.
   ========================================================================= */
import { INK, PAPER, inkLevel, rnd } from "../../engine/halfworld-engine.mjs";
import mara from "../character/mara.mjs";

const TAU = Math.PI * 2;
const L = (l) => inkLevel(l);

/** THE NUMBER. Imported, never typed. */
export const HER_SHOULDERS = mara.params.proportion.shoulders;   // 1.12

/* ---- a body from behind, at a given age ---------------------------------
   Head, shoulder line, trunk, two legs. No face, no arms in front, no detail
   below the knee. `sh` multiplies the shoulder width and is the only thing that
   distinguishes the woman from the children other than height. */
function backFigure(g, x, footY, h, { sh = 1, hair = 5, garment = 1, stoop = 0, headK = 0.115 } = {}) {
  /* headK IS THE AGE. A child's head is about a sixth of its height and an
     adult's about an eighth, and at this size that ratio is the only thing
     separating the two — there is no face to read and no gait to read. PASS 2
     drew the woman at the children's 0.115 and she came back as a black
     lollipop on a stick, the largest and stupidest object in the film. */
  const headR = h * headK;
  const shW = h * 0.155 * sh;
  const hipW = h * 0.115;
  const shY = footY - h * 0.80 + stoop * h * 0.05;
  const hipY = footY - h * 0.46;

  g.save();
  // trunk
  g.fillStyle = L(garment); g.strokeStyle = INK; g.lineWidth = 3;
  g.beginPath();
  g.moveTo(x - shW, shY); g.lineTo(x + shW, shY);
  g.lineTo(x + hipW, hipY); g.lineTo(x - hipW, hipY);
  g.closePath(); g.fill(); g.stroke();
  // legs — two, and they do not cross
  g.lineWidth = 3;
  for (const sx of [-1, 1]) {
    g.beginPath();
    g.moveTo(x + sx * hipW * 0.52, hipY);
    g.lineTo(x + sx * hipW * 0.62, footY);
    g.strokeStyle = INK; g.lineWidth = h * 0.052; g.stroke();
    g.strokeStyle = L(3); g.lineWidth = h * 0.030; g.stroke();
  }
  // neck and head, from behind: one mass, and the hair is the whole of it
  g.fillStyle = L(garment); g.fillRect(x - h * 0.030, shY - h * 0.055, h * 0.060, h * 0.060);
  /* the back of a head is HAIR, and hair in this world is a level 4-5 mass with
     an ink contour, never a solid disc — the cast rig logged that one twice. */
  g.fillStyle = L(hair); g.strokeStyle = INK; g.lineWidth = 3;
  g.beginPath();
  g.ellipse(x, shY - h * 0.055 - headR * 0.82, headR * 0.92, headR * 1.06, 0, 0, TAU);
  g.fill(); g.stroke();
  g.restore();
}

/* ---- the tray of chrysalides -------------------------------------------- */
function tray(g, x, y, w) {
  g.fillStyle = L(0); g.strokeStyle = INK; g.lineWidth = 3;
  g.beginPath(); g.rect(x - w / 2, y, w, w * 0.16); g.fill(); g.stroke();
  g.fillStyle = L(4);
  for (let i = 0; i < 6; i++) {
    const px = x - w / 2 + w * (i + 0.5) / 6;
    g.beginPath(); g.ellipse(px, y - w * 0.045, w * 0.028, w * 0.062, 0, 0, TAU); g.fill();
  }
}

/* ==========================================================================
   THE GLASSHOUSE.

   rect  { x, y, w, h }   the projected image's own rectangle
   enter 0..1             the woman crossing in from the left
   ========================================================================== */
export function glasshouse(g, rect, { enter = 1, seed = 401 } = {}) {
  const { x, y, w, h } = rect;
  const r = rnd(seed);

  /* THE FIELD. A projected image is LIGHT. So the ground of this drawing is
     paper and everything in it is ink on paper, which is also what a 1945
     positive looks like when it is thrown on a sheet in a dark room. */
  g.fillStyle = PAPER; g.fillRect(x, y, w, h);

  /* WHITE-PAINTED WINDOWS. The panes are painted, so there is nothing behind
     them: they are bare paper and the only drawing is the glazing bars and the
     brush. That is the whole architecture and it costs eleven strokes.
     The bars converge slightly toward a vanishing point above the pool, which
     is what makes it a room and not a grid. */
  const vx = x + w * 0.46, vy = y - h * 0.55;
  g.strokeStyle = L(3); g.lineWidth = 3.4;
  for (let i = 0; i <= 7; i++) {
    const bx = x + w * (i / 7);
    g.beginPath();
    g.moveTo(bx, y + h * 0.66);
    g.lineTo(bx + (vx - bx) * 0.34, y + h * 0.02);
    g.stroke();
  }
  // the purlins: three, and each stops short of both ends of the glass
  g.lineWidth = 2.8;
  for (const fy of [0.10, 0.28, 0.46]) {
    const yy = y + h * fy;
    g.beginPath();
    g.moveTo(x + w * 0.03, yy + h * 0.012); g.lineTo(x + w * 0.44, yy);
    g.moveTo(x + w * 0.52, yy); g.lineTo(x + w * 0.97, yy + h * 0.010);
    g.stroke();
  }
  // the paint: short vertical strokes on the panes, uneven, at one light level.
  // This is what "white-painted" looks like from inside — the glass is opaque
  // and the brush is visible and nothing else is.
  g.strokeStyle = L(1); g.lineWidth = 5;
  for (let i = 0; i < 46; i++) {
    const bx = x + w * (0.02 + r() * 0.96), by = y + h * (0.02 + r() * 0.56);
    g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + (r() - 0.5) * 10, by + h * 0.06); g.stroke();
  }

  /* THE FLOOR AND THE POOL. A shallow rectangle of water, tiled, on a paved
     floor. Its far lip is broken; its near lip is the bottom of the frame. */
  g.fillStyle = L(1); g.fillRect(x, y + h * 0.66, w, h * 0.34);
  g.strokeStyle = L(4); g.lineWidth = 3;
  g.beginPath();
  g.moveTo(x + w * 0.02, y + h * 0.66); g.lineTo(x + w * 0.40, y + h * 0.66);
  g.moveTo(x + w * 0.48, y + h * 0.66); g.lineTo(x + w * 0.98, y + h * 0.665);
  g.stroke();

  const pl = x + w * 0.20, pr = x + w * 0.86, pt = y + h * 0.80, pb = y + h * 0.99;
  g.fillStyle = L(2);
  g.beginPath();
  g.moveTo(pl, pt); g.lineTo(pr, pt); g.lineTo(pr + w * 0.05, pb); g.lineTo(pl - w * 0.05, pb);
  g.closePath(); g.fill();
  g.strokeStyle = INK; g.lineWidth = 3.6; g.stroke();
  g.strokeStyle = L(5); g.lineWidth = 2.2;
  for (let i = 1; i < 5; i++) {
    const t = i / 5;
    g.beginPath();
    g.moveTo(pl + (pr - pl) * t, pt);
    g.lineTo(pl - w * 0.05 + (pr - pl + w * 0.10) * t, pb);
    g.stroke();
  }

  /* LAVENDER BESIDE A POOL. A bed at the left, in ink levels only: a bare stem
     and a short dense head, all the heads at one height. Never purple. */
  /* PASS 3: thirteen stems inside 0.14 of the width printed as one smudge of
     specks. Eight, spread over 0.17, taller, and each one legible as a stem
     with a head on it — which is the only thing that makes it lavender rather
     than grass. */
  for (let i = 0; i < 8; i++) {
    const sx = x + w * (0.035 + i * 0.0215) + (r() - 0.5) * 5;
    const by = y + h * (0.80 + r() * 0.05);
    const hh = h * (0.19 + r() * 0.06);
    g.strokeStyle = L(4); g.lineWidth = 2.6;
    g.beginPath(); g.moveTo(sx, by); g.lineTo(sx + (r() - 0.5) * 8, by - hh * 0.62); g.stroke();
    g.strokeStyle = INK; g.lineWidth = 3;
    for (let k = 0; k < 4; k++) {
      const ky = by - hh * 0.62 - k * hh * 0.09;
      g.beginPath(); g.moveTo(sx - 4, ky); g.lineTo(sx + 4, ky - 2); g.stroke();
    }
  }

  /* THREE CHILDREN WITH THEIR BACKS TO THE CAMERA. Standing at the pool, not
     grouped, not looking at each other. Shoulders at 1.0 — they are the control
     against which the fourth silhouette is read. */
  const ch = h * 0.34;
  /* BEHIND the pool's far lip, not standing in it. PASS 2 put their feet at
     0.86..0.90 of the frame, which is inside the water. */
  backFigure(g, x + w * 0.42, y + h * 0.745, ch,        { sh: 1, hair: 5, garment: 0, headK: 0.108 });
  backFigure(g, x + w * 0.56, y + h * 0.775, ch * 1.07, { sh: 1, hair: 4, garment: 1, stoop: 0.4, headK: 0.104 });
  backFigure(g, x + w * 0.69, y + h * 0.755, ch * 0.94, { sh: 1, hair: 5, garment: 0, headK: 0.112 });

  /* A WOMAN ENTERS CARRYING A TRAY OF CHRYSALIDES.
     From the left, at 1.12 shoulders — the number, imported. She does not turn.
     `enter` takes her from off the frame's own left edge to a third of the way
     across; at enter = 0 she is not in the picture at all. */
  if (enter > 0.02) {
    const wx = x - w * 0.12 + w * 0.36 * enter;
    const wh = h * 0.62;
    const wy = y + h * 0.80;
    g.save();
    g.beginPath(); g.rect(x, y, w, h); g.clip();      // she enters THE FRAME
    backFigure(g, wx, wy, wh, { sh: HER_SHOULDERS, hair: 4, garment: 2, headK: 0.072 });
    tray(g, wx + wh * 0.20, wy - wh * 0.44, wh * 0.44);
    g.restore();
  }

  return rect;
}

/* ==========================================================================
   THE GATE. What a projected image has that a picture does not: a hard edge
   with softened corners, and — when there is film in the machine — a frame line
   that will not sit still.

   BF-33's WHOLE POINT IS THAT THERE IS NO WEAVE. "No one has threaded the
   film." An unthreaded projector has no intermittent movement, so the image it
   is not supposed to be making is PERFECTLY STEADY: no gate weave, no frame bar,
   no flicker. `weave` therefore defaults to 0 and BF-33 never raises it. It is
   the one drawing decision in the act that is made out of an absence.
   ========================================================================== */
export function projectedGate(g, rect, { weave = 0 } = {}) {
  const { x, y, w, h } = rect;
  const k = weave * 3;
  g.save();
  g.strokeStyle = INK; g.lineWidth = 4;
  const r = Math.min(w, h) * 0.035;
  g.beginPath();
  g.moveTo(x + r, y + k); g.lineTo(x + w - r, y + k);
  g.quadraticCurveTo(x + w, y + k, x + w, y + r + k);
  g.lineTo(x + w, y + h - r + k);
  g.quadraticCurveTo(x + w, y + h + k, x + w - r, y + h + k);
  g.lineTo(x + r, y + h + k);
  g.quadraticCurveTo(x, y + h + k, x, y + h - r + k);
  g.lineTo(x, y + r + k);
  g.quadraticCurveTo(x, y + k, x + r, y + k);
  g.stroke();
  g.restore();
}

export const GLASSHOUSE_VERSION = "glasshouse/1.0.0";
