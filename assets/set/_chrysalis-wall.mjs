/* assets/set/_chrysalis-wall.mjs — SEVENTY-FIVE YEARS OF CHRYSALIDES.
   ============================================================================
   The far wall of the rearing facility, in BF-29 (seen) and BF-32 (opened).

     "Hundreds of chrysalides hang from cards along the far wall. Each card
      bears a date: 1951, 1952, 1953, 1954, 1955."
     "The oldest cards are brown and soft at the corners. The newest are clean
      white plastic."
     "Every chrysalis, old or new, is fastened identically: a loop of silk
      around the thorax, a drop of adhesive beneath the tail."

   THE DATE AXIS IS THE PLAN'S; THE ROWS ARE MINE. scenes/_plans/the-facility.mjs
   says so out loud: "'DATED ROWS' ARE ROWS, AND ROWS ARE ALTITUDE. project() has
   no altitude, so this plan authors the DATE axis only; the stacking is the
   scene's job." So this file takes 75 x-positions from the plan and stacks THREE
   rows on each of them: 225 husks, one year per column, three cards per year.

   WHY THREE AND NOT ONE. BF-32's field has to be a FIELD — "a distortion like
   wind crossing tall grass" — and one row of 75 marks is a picket fence, not
   grass. Three rows is the smallest number that reads as a wall of hundreds
   while leaving each husk more than two halftone dots wide.

   WHY THREE AND NOT SIX. At 1040px of frame the year pitch is 13.9px. A husk is
   drawn at 8.6px wide with a 2.6px ink contour, which is at the floor of what
   the dot lattice can hold; halving the row height to fit six rows would take
   the husk HEIGHT below the same floor and the wall would render as grey noise.
   The rows are staggered by a third of a pitch in x so they cannot line up into
   vertical bars (BUILD-BRIEF S5, the striping trap, rotated 90 degrees).

   ---------------------------------------------------------------------------
   THE ONE THING THIS FILE MUST NOT DO

   MOTION-BRIEF: "Making the empty chrysalides move like they contain something.
   They are empty ... The motion is in the field, not in the objects."

   So: `open` splits a husk and what is revealed is PAPER — the brightest value
   available, and nothing is ever drawn inside it. An opened husk is TWO THIN
   PARTED SHELLS and a hole. It does not bulge, it does not swell before it
   splits, and no shape passes behind the gap. `lean` is applied to every husk
   identically whether it is open or shut, because the field does not care which
   ones are empty — they all are.

   An opened wall is also LIGHTER than a closed one, which is the argument in one
   value: the wall visibly evacuates from left to right and there is more paper
   behind the front than in front of it.
   ========================================================================= */
import { INK, PAPER, inkLevel, rnd } from "../../engine/halfworld-engine.mjs";
import { brokenLine } from "./_kit.mjs";

const TAU = Math.PI * 2;
const L = (l) => inkLevel(l);

export const ROWS = 3;

/* ---- the backing wall --------------------------------------------------- */
export function wallBoard(g, { x0, x1, yTop, yBot, seed = 201 } = {}) {
  g.fillStyle = L(0); g.fillRect(x0, yTop, x1 - x0, yBot - yTop);
  // three card rails, one per row of cards. Each is broken, and none of them is
  // the same length as another.
  return { x0, x1, yTop, yBot, seed };
}

/** the rail a row of cards is pinned to. Short, and never edge to edge. */
export function cardRail(g, x0, x1, y, seed) {
  brokenLine(g, x0 - 6, x1 + 6, y, seed, { lw: 4.2, segs: 3, gap: 0.035 });
}

/* ---- LEVEL OF DETAIL, and why there is one ------------------------------
   The wall is authored at ONE pitch by the plan and seen at two zooms: BF-29
   frames the whole room and gets 7.6px per year; BF-32 crops to the wall and
   gets 15.3px. At 15.3 a husk is two shells with a 2.6px contour and it reads.
   At 7.6 those same two shells and their four contour strokes overlap inside
   4.6px and every husk on the wall prints as a solid ink slug — 225 of them,
   i.e. the far wall of the room comes out as a black bar, which is BUILD-BRIEF
   trap 1 and trap 2 at once.

   So below FINE_PITCH a husk is ONE stroke. It is the same object, drawn with
   the ink the lattice can actually hold at that size, and the wall reads as a
   texture of fine ticks with three quarters of it paper. Nothing about the
   motion changes: a split at low detail is the stroke becoming two thinner
   strokes with paper between them, which is the same statement. */
export const FINE_PITCH = 13;

/* ---- one card and the thing hanging from it -----------------------------
   age 0 = 1951: brown, soft at the corners.  age 1 = 2025: clean white plastic.
   open 0..1   : the seam. 1 is fully split and EMPTY.
   lean        : radians, applied about the point of attachment. THE FIELD.  */
export function husk(g, x, yCard, pitch, rowH, { age = 1, open = 0, lean = 0, seed = 0 } = {}) {
  const cw = pitch * 0.74, chh = Math.max(6, rowH * 0.16);
  const hw = pitch * 0.44, hh = rowH * 0.36;

  if (pitch < FINE_PITCH) return huskFine(g, x, yCard, pitch, rowH, { age, open, lean, jitter: 0.78 + ((seed * 0.6180339887) % 1) * 0.5 });

  /* THE CARD. Old ones are a deeper value with their corners taken off — "soft
     at the corners" is drawn as a chamfer, because a rounded corner at 10px is
     one dot and reads as nothing. New ones are bare paper with hard corners. */
  const soft = (1 - age) * cw * 0.30;
  g.beginPath();
  g.moveTo(x - cw / 2 + soft, yCard);
  g.lineTo(x + cw / 2 - soft, yCard);
  g.lineTo(x + cw / 2, yCard + soft);
  g.lineTo(x + cw / 2, yCard + chh - soft);
  g.lineTo(x + cw / 2 - soft, yCard + chh);
  g.lineTo(x - cw / 2 + soft, yCard + chh);
  g.lineTo(x - cw / 2, yCard + chh - soft);
  g.lineTo(x - cw / 2, yCard + soft);
  g.closePath();
  g.fillStyle = L(age > 0.62 ? 0 : age > 0.3 ? 2 : 3); g.fill();
  g.strokeStyle = INK; g.lineWidth = 2.2; g.stroke();

  g.save();
  g.translate(x, yCard + chh);
  g.rotate(lean);

  /* THE FASTENING, identical for seventy-five years: a loop of silk around the
     thorax and a drop of adhesive beneath the tail. Two marks, and they are the
     same two marks on every husk in the frame — that identity is the point of
     the beat and it costs four pixels. */
  g.strokeStyle = INK; g.lineWidth = 2.0;
  g.beginPath(); g.moveTo(-hw * 0.62, hh * 0.20); g.lineTo(hw * 0.62, hh * 0.20); g.stroke();

  /* THE SPLIT. A shed husk does not slide apart, it SPLAYS: it stays fastened
     at the thorax and the two halves swing away from each other toward the
     tail. So the parting is mostly a rotation about the point of attachment
     and only a little a translation, which is also what keeps an opened husk
     inside its own 15px of pitch instead of colliding with 1952. */
  /* PASS 2 OF BF-32, AND IT INVERTED THE UNIT. The halves were parted by
     hw*0.22 and splayed 0.17rad WITHOUT getting any thinner, so an opened husk
     measured 16px across a 15.25px pitch: every opened husk touched its
     neighbours and the wall behind the front came back DARKER than the wall in
     front of it. The scene's whole argument — the wall empties, and empty is
     brighter — was running backwards and the contact sheet was too coarse to
     show it.

     A shed husk is two SHELLS. It is thinner open than shut, because what was
     round is now two curved plates. So the x-extent falls with `open` while the
     parting rises, and an opened husk measures 9.5px against 15.25 of pitch —
     40% less ink than a shut one, in the same place. */
  const part = open * hw * 0.16, splay = open * 0.15;
  const ext = hw * (0.90 - 0.34 * open);
  const shell = (sx) => {
    g.beginPath();
    g.moveTo(0, 0);
    g.quadraticCurveTo(sx * ext, hh * 0.26, sx * ext * 0.78, hh * 0.74);
    g.quadraticCurveTo(sx * ext * 0.30, hh * 1.00, 0, hh * 1.02);
    g.closePath();
  };
  /* the two halves. The value is the AGE, not the state: an old husk is a deeper
     ink than a new one whether it is open or shut. What the opening changes is
     how much of the wall is paper. */
  /* THE VALUE OF A SHELL. Shut, it is the husk's outer surface and it carries
     the age: 1 at the present, 2 in the middle, 3 at 1951. Split, it turns and
     presents its INNER surface, which is pale in every insect that has ever
     done this — so an opened shell steps to L(0) and becomes an outline.

     This is BF-01's own move, applied to a different object: "a closed wing
     presents its pale UNDERSIDE, which is exactly the surface the text cares
     about, so it steps 2 -> 1 -> 0 and its detail drops with it." Two discrete
     values, no interpolation, and the step lands inside the 1.6 frames the seam
     takes to split. It is also the third independent thing making the emptied
     wall brighter than the unopened wall, after the aperture and the width. */
  const lev = open > 0.5 ? 0 : age > 0.62 ? 1 : age > 0.3 ? 2 : 3;
  /* THE APERTURE, AND IT IS THE ARGUMENT OF BF-32.
     When a husk opens, what is inside it is PAPER — the brightest value this
     world has, painted explicitly rather than left to the background, so that
     an opened husk is a BRIGHT SLIT and not merely a thinner mark. Nothing is
     ever drawn in here. The wall therefore fills with light from the left as the
     front crosses it, and "every chrysalis is empty" is carried by the value of
     the wall rather than by any single object in it.
     MOTION-BRIEF: "If your husks look like they contain something, you have
     drawn the wrong thing." There is no shape in this branch to get wrong. */
  if (open > 0.12) {
    g.fillStyle = L(0);
    g.beginPath();
    g.moveTo(0, -1);
    g.lineTo(hw * 0.44 * open + 1.4, hh * 0.94);
    g.lineTo(-hw * 0.44 * open - 1.4, hh * 0.94);
    g.closePath(); g.fill();
  }
  for (const sx of [-1, 1]) {
    g.save();
    g.translate(sx * part, 0); g.rotate(sx * splay);
    shell(sx);
    g.fillStyle = L(lev); g.fill();
    g.strokeStyle = INK; g.lineWidth = 2.6; g.stroke();
    g.restore();
  }
  /* THE SEAM. Before it opens it is one hard line down the near side; that is
     the "seam" the text splits. After it opens there is nothing between the two
     shells at all — no membrane, no interior, no occupant. Paper. */
  if (open < 0.04) {
    g.strokeStyle = INK; g.lineWidth = 2.0;
    g.beginPath(); g.moveTo(0, hh * 0.05); g.lineTo(0, hh * 0.92); g.stroke();
  }
  // the drop of adhesive beneath the tail
  g.fillStyle = INK;
  g.beginPath(); g.arc(0, hh * 1.04, 1.9, 0, TAU); g.fill();
  g.restore();
}

/* ---- the same husk, at the pitch the room actually gives it --------------
   One stroke for the shell, one dot for the adhesive, one dash for the card.
   The split is the stroke becoming two, with paper between them — and because
   the stroke is 2.0px and the parted pair straddle 4px, the wall genuinely gets
   LIGHTER behind the front, which is the argument of BF-32 carried in value. */
function huskFine(g, x, yCard, pitch, rowH, { age = 1, open = 0, lean = 0, jitter = 1 } = {}) {
  /* ONE HORIZONTAL DASH AND ONE VERTICAL TICK. The card is the dash, the husk
     is the tick, and the pair reads as a thing hanging from a thing — which is
     what the wall is — where three rows of bare verticals read as a barcode.
     The first pass of this file drew the tick alone and the establishing frame
     of the act came back as a filing cabinet.

     `jitter` varies the tick's length by +/-25% per cell. Without it 225 marks
     of identical length on a regular pitch print as a ruled screen and the eye
     stops seeing objects. It is a deterministic function of the cell index, so
     the wall is the same wall in every frame and in both units. */
  const hh = rowH * 0.34 * jitter;
  /* ink by AGE. PASS 2 ran the husk from level 5 down to level 1 and the newest
     forty years of the wall DISAPPEARED — the right half of every row came back
     as bare paper and the wall looked like it stopped in 1985. The husk now runs
     5..3 (it is always a real mark, because a chrysalis is always a real object)
     and the age is carried mostly by the CARD, 6..2, which is the thing the text
     actually describes ageing: "the oldest cards are brown and soft at the
     corners; the newest are clean white plastic". */
  const lev = 5 - Math.round(age * 2);
  g.lineCap = "round";
  g.strokeStyle = L(6 - Math.round(age * 4)); g.lineWidth = 2.6;
  // the card. SHORT: at pitch 10.7 a dash of 0.64 pitch leaves a 3.8px gap and
  // seventy-five of them fuse into a rule across the wall — the striping trap,
  // arrived at from the other direction. 0.42 leaves more paper than card.
  g.beginPath(); g.moveTo(x - pitch * 0.21, yCard + 2); g.lineTo(x + pitch * 0.21, yCard + 2); g.stroke();
  g.strokeStyle = L(lev);

  g.save();
  g.translate(x, yCard + 4); g.rotate(lean);
  const part = open * pitch * 0.20, splay = open * 0.20;
  for (const sx of [-1, 1]) {
    if (open < 0.04 && sx > 0) continue;            // shut: ONE stroke, not two
    g.save(); g.translate(sx * part, 0); g.rotate(sx * splay);
    g.lineWidth = open < 0.04 ? 3.2 : 1.8;
    g.beginPath();
    g.moveTo(0, 0);
    g.quadraticCurveTo(sx * pitch * 0.12, hh * 0.5, 0, hh);
    g.stroke();
    g.restore();
  }
  g.restore();
}

/* ---- the whole wall ------------------------------------------------------
   `states` is 75 entries in DATE ORDER — the plan's `chrysalisWallRun` — each
   { open, lean }. The three rows of a year share its state, because "each seam
   split at once" means at once across the wall's height as well as along it. */
export function chrysalisWall(g, rect, states, { first = 1951, last = 2025 } = {}) {
  const { x0, x1, yTop, yBot } = rect;
  const n = states.length;
  const pitch = (x1 - x0) / n;
  const rowH = (yBot - yTop) / ROWS;
  const r = rnd(rect.seed || 201);
  const jitter = [];
  for (let i = 0; i < n * ROWS; i++) jitter.push((r() - 0.5) * pitch * 0.16);

  /* THE AGE, AS A FIELD. "The oldest cards are brown and soft at the corners.
     The newest are clean white plastic."

     PASS 3. Carrying the age in the ink weight of a 2.6px stroke does not
     survive the halftone: levels 3, 4 and 5 at that width all print as the same
     dotted line and the wall came back uniform, which deleted seventy-five
     years from the frame. So the age is ALSO a backing tone — a per-column band
     at level 2 under 1951 falling to level 0 (bare paper) at the present. An
     ordered dither is very good at exactly this and it is the one tonal ramp in
     the act. It runs left to right, which fixes the wall's handedness a second
     time, independently of the sweep. */
  for (let i = 0; i < n; i++) {
    const age = n <= 1 ? 1 : i / (n - 1);
    const lev = (1 - age) * 1.4;
    /* ORDERED, NOT ROUNDED. Math.round() over 75 columns and three usable ink
       levels gives three hard blocks and the wall comes back looking stained
       rather than aged. The fractional part is resolved against a per-column
       threshold from the golden-ratio sequence, which is the same trick the
       halftone itself uses one level down: the ramp dithers instead of banding.

       CAPPED AT 1.4, not 2.2. At 2.2 the oldest third of the wall carried an
       L(2) ground, which is exactly the end of the wall that opens FIRST in
       BF-32 — so the age ramp was darkening the same region the split was
       supposed to be brightening, and the two arguments cancelled. The age is
       still legible at level 1 against paper; the emptying needs the headroom
       more than the ageing does. */
    const t = ((i * 0.6180339887) % 1);
    const q = Math.floor(lev) + ((lev % 1) > t ? 1 : 0);
    if (q < 1) continue;
    g.fillStyle = L(q);
    g.fillRect(x0 + pitch * i - pitch * 0.06, yTop, pitch * 1.12, yBot - yTop);
  }

  for (let row = 0; row < ROWS; row++) {
    const yCard = yTop + row * rowH + rowH * 0.04;
    // stagger: a third of a pitch per row, so the columns cannot form bars
    const dx = (row - 1) * pitch * 0.33;
    /* the rail is drawn ONLY at fine detail, where the cards themselves are too
       small to describe a row. At coarse detail the row of cards IS the rail,
       and drawing both gave the wall three extra full-width horizontals and made
       it read as library shelving. */
    if (pitch >= FINE_PITCH) cardRail(g, x0, x1, yCard - 4, (rect.seed || 201) + row * 13);
    for (let i = 0; i < n; i++) {
      const age = n <= 1 ? 1 : i / (n - 1);
      const x = x0 + pitch * (i + 0.5) + dx + jitter[row * n + i];
      const s = states[i] || {};
      husk(g, x, yCard, pitch, rowH, {
        age, open: s.open || 0, lean: (s.lean || 0) + (s.rowLean ? s.rowLean * (row - 1) : 0),
        seed: i + row * 97,
      });
    }
  }
  return { pitch, rowH, first, last };
}

export const WALL_VERSION = "chrysalis-wall/1.0.0";
