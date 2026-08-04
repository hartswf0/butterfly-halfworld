/* ============================================================================
   BF-01 · THE REFUSAL          INT. OBSERVATION BOX — MORNING     plan: the-maze

     "A swallowtail rises into the clear acrylic lid of a choice maze and
      strikes it. It falls, rights itself in air, and strikes again. The roof
      offers no resistance until contact."
     "Below, lavender divides the world: one corridor carries it, the other
      does not."                                                — atlas/source.json

   MOTION: CYCLE · 4 beats · 4.0s · 48 frames @12fps · loopClosed: FALSE.

   The loop is OPEN and that is the whole scene. cycle({closed:false}) returns a
   `wear` that climbs from 0 to `drift` across one revolution, and every use of
   it here costs the animal something: the apex it can reach drops, the height
   it recovers to drops, the antennae fall. A closed loop would say this is a
   machine repeating; an open one says a body is being worn down by an act it
   cannot stop. Per MOTION-BRIEF that is one argument and one number.

   The wear is deliberately SMALL (a handful of pixels over the cycle) so the
   wrap still reads as continuous motion. It is measurable, not watchable — the
   renderer's loop check reports it as a wrap difference slightly above one
   frame's worth of change, which is the correct signature of an open cycle.

   DECLARED DISCONTINUITIES: none. There is no BREAK in this scene; the lid is
   continuous and so is the body. The only edge in the frame is the lid itself.

   DOT LAW: everything is drawn here in SOLID quantized tones with hard ink
   contours; the halftone is a single pass run by the engine over the whole
   field. No gradients, no alpha, no blur, no cross-fade.

   ONE DELIBERATE BREACH OF A TRAP: BUILD-BRIEF §5 says break every full-width
   horizontal span, because unbroken bars stripe the frame. The lid is drawn
   UNBROKEN, edge to edge. It is the one surface in this world that has no gap
   in it — that is what the scene is about — so the striping risk is paid for.
   Everything else horizontal (floor, corridor lips, floor band) is broken.
   ========================================================================= */
import { cycle, framesFor, TAU, clamp01 } from "../engine/motion.mjs";
import { INK, inkLevel, lerp, smooth } from "../engine/halfworld-engine.mjs";
import { brokenLine } from "../assets/set/_kit.mjs";

/* ---- the motion scene contract ------------------------------------------ */
export const id         = "BF-01";
export const title      = "THE REFUSAL";
export const place      = "INT. OBSERVATION BOX";
export const plan       = "the-maze";
export const motion     = "CYCLE";
export const beats      = 4;                       // rise · impact · drop · recover
export const seconds    = 4.0;
export const loopClosed = false;                   // it is alive
export const frames     = framesFor(motion, seconds, 12, beats);   // 48
export const drift      = 0.18;

/* ---- the box, in nominal 1120x760 source space --------------------------
   INK WEIGHT. dotifyField samples this drawing on a ~4px grid at full size and
   a ~10px grid in a contact cell. Anything thinner than the sampling grid is a
   coin flip and vanishes. The engine's LW=4 default is calibrated for a 660px
   asset canvas; at 1120px the equivalent is ~6.8px, and the first pass of this
   file was drawn at 2.2–4.5px. Nothing here goes below 3. */
const NW = 1120, NH = 760;
const LID_TOP = 126, LID_BOT = 158;                // the acrylic slab
const BOX_L = 150, BOX_R = 970, FLOOR = 690;
const MOUTH = 536;                                 // top of the corridor walls
const PART_L = 526, PART_R = 596, PART_TOP = 508;  // the white partition
const CX = 561;                                    // dead centre: above the partition
const R    = 112;                                  // px per local unit of animal
/* The roof is a ROOF. The first pass put the body centre at the lid, which
   sent the head and antennae straight through the acrylic — the one thing the
   scene says cannot happen. The apex is now set so the top of the animal meets
   the underside, and it is the antennae that arrive first. */
const APEX = LID_BOT + 0.88 * R;                   // where the wings meet acrylic
const LOW  = 448;                                  // cruising height
/* The bottom of the fall keeps the animal IN AIR. An earlier pass put it at
   476, where the folded wings landed on top of the white partition and the
   whole beat read as perching rather than as "rights itself in air". */
const FALL = 440;                                  // bottom of the drop

/* ============================================================ at(u) ========
   PURE function of normalised u. No clock, no state, no reading frame n-1.
   Frame 30 renders identically whether or not frame 29 was ever drawn.
   ========================================================================= */
/* Phase marks. The four beats are the atlas's (rise · impact · drop · recover)
   but the VERTICAL is authored as one continuous curve across them, not four
   independent segments — the first draft gave beat 1 its own gentle ease-out
   and the animal hung under the lid for a full second, which reads as a body
   waiting rather than a body that cannot stop. Contact is 0.055 of the cycle:
   under three frames at 12fps. A strike is an instant. */
const P_STRIKE  = 0.25;                              // the roof
const P_RELEASE = 0.305;                             // it comes off
const P_BOTTOM  = 0.75;                              // the bottom of the fall

export function at(u, _ctx) {
  const c = cycle(u, { beats, closed: loopClosed === true, drift });
  const w = c.wear;                                 // 0 → 0.18 across the cycle
  const t = c.within;
  const uu = u % 1;

  // the cost of doing this, in pixels
  const apex = APEX + w * 26;                       // it cannot reach as high
  const low  = LOW  + w * 18;                       // nor recover as far

  /* A wingbeat that is seamless BY CONSTRUCTION: 6 beats per cycle, and
     |sin| is exactly 0 at u = 0, .25, .5, .75, 1 — so it never introduces a
     step at a beat boundary or at the wrap. */
  const flap = Math.abs(Math.sin(u * TAU * 6));

  let by, roll, open, contact = 0;
  if (uu < P_STRIKE) {                              // RISE — accelerating up
    const k = uu / P_STRIKE;
    // ^1.4, not ^1.8. It still accelerates into contact, but ^1.8 spent the
    // first six frames of a twelve-frame beat covering a third of the rise —
    // the same dead air as the old hang, at the other end of the arc.
    by   = lerp(LOW, apex, Math.pow(k, 1.4));
    open = 0.62 + 0.34 * flap;
    roll = Math.sin(u * TAU * 6) * 0.05;
  } else if (uu < P_RELEASE) {                      // IMPACT — pressed on acrylic
    const k = (uu - P_STRIKE) / (P_RELEASE - P_STRIKE);
    by      = apex + 5 * Math.sin(k * Math.PI);     // compresses and rebounds
    open    = 0.62 + 0.36 * smooth(k);              // splayed flat on the roof
    roll    = Math.sin(k * Math.PI * 4) * 0.05;     // tremor, 0 at both ends
    contact = 1 - k;
  } else if (uu < P_BOTTOM) {                       // FALL — a tilt of wings
    const k = (uu - P_RELEASE) / (P_BOTTOM - P_RELEASE);
    // ^1.4, not ^2: a swallowtail does not fall like a stone, it flutters
    // down. Gravity's ^2 spends the first third of the fall going nowhere,
    // which is the hang this rewrite exists to kill.
    by   = lerp(apex, FALL, Math.pow(k, 1.4));
    open = k < 0.26 ? 0.98                           // still splayed as it leaves
         : lerp(0.98, 0.10, smooth((k - 0.26) / 0.74));  // then they come together
    roll = -Math.sin(k * Math.PI) * 0.95;            // over and back to level
  } else {                                           // RECOVER — rights itself
    const k = (uu - P_BOTTOM) / (1 - P_BOTTOM);
    by   = lerp(FALL, low, smooth(k));
    open = lerp(0.10, 0.62, smooth(k)) + 0.22 * flap * k;
    roll = Math.sin(k * TAU) * 0.06;
  }

  // horizontal drift: two seamless harmonics, so bx(0) === bx(1) exactly
  const bx = CX + 26 * Math.sin(u * TAU) + 10 * Math.sin(u * TAU * 3);

  return {
    u, beat: c.beat, within: t, wear: w,
    bx, by, roll, open: clamp01(open), contact,
    droop: w,                                       // antennae fall as it tires
    odour: u,                                       // the smell in the left corridor
  };
}

/* ============================================================ draw() =======
   Solid tones + hard contour only. The engine runs ONE halftone pass over the
   whole field afterwards, so this never draws a dot itself.
   ========================================================================= */
export function draw(g, W, H, s) {
  g.save();
  g.scale(W / NW, H / NH);                          // author once, at 1120x760
  g.lineJoin = "round"; g.lineCap = "round";

  set(g);
  odour(g, s.odour);
  swallowtail(g, s);
  if (s.contact > 0) impact(g, s);

  g.restore();
}

/* ---- the observation box ------------------------------------------------ */
function set(g) {
  const ink = (lw = 3) => { g.strokeStyle = INK; g.lineWidth = lw; };

  // THE LID. Unbroken on purpose — see the header. Light plane, hard edges,
  // and the UNDERSIDE is the heaviest line in the frame because it is the
  // thing that is struck.
  g.fillStyle = inkLevel(1);
  g.fillRect(BOX_L - 26, LID_TOP, (BOX_R + 26) - (BOX_L - 26), LID_BOT - LID_TOP);
  ink(4.5);
  g.beginPath(); g.moveTo(BOX_L - 26, LID_TOP); g.lineTo(BOX_R + 26, LID_TOP); g.stroke();
  ink(8);
  g.beginPath(); g.moveTo(BOX_L - 26, LID_BOT); g.lineTo(BOX_R + 26, LID_BOT); g.stroke();
  // two short reflections in the acrylic — broken, so the slab is not a bar
  ink(4);
  g.beginPath();
  g.moveTo(BOX_L + 60, LID_TOP + 11);  g.lineTo(BOX_L + 230, LID_TOP + 11);
  g.moveTo(BOX_R - 260, LID_TOP + 21); g.lineTo(BOX_R - 120, LID_TOP + 21);
  g.stroke();

  // side walls of the box: acrylic, so a pair of lines with a gap at eye level
  ink(5);
  for (const x of [BOX_L, BOX_R]) {
    g.beginPath();
    g.moveTo(x, LID_BOT); g.lineTo(x, 372);
    g.moveTo(x, 412);     g.lineTo(x, FLOOR);
    g.stroke();
  }

  // floor of the box + the ground plane below it
  brokenLine(g, BOX_L - 20, BOX_R + 20, FLOOR, 3, { lw: 6, segs: 3, gap: 0.02 });
  g.fillStyle = inkLevel(1);
  g.fillRect(BOX_L - 20, FLOOR + 3, (BOX_R + 20) - (BOX_L - 20), 26);
  brokenLine(g, BOX_L - 20, BOX_R + 20, FLOOR + 29, 11, { lw: 4, segs: 4 });

  // THE MAZE: two corridors, one white partition.
  const wall = (x0, x1) => {
    g.fillStyle = inkLevel(2);
    g.fillRect(x0, MOUTH, x1 - x0, FLOOR - MOUTH);
    g.strokeStyle = INK; g.lineWidth = 4.5;
    g.strokeRect(x0, MOUTH, x1 - x0, FLOOR - MOUTH);
  };
  wall(196, 218);          // outer wall, left corridor
  wall(482, 504);          // inner wall, left corridor
  wall(618, 640);          // inner wall, right corridor
  wall(904, 926);          // outer wall, right corridor

  // corridor floors — a light plane inside each channel, so the corridors read
  // as volumes rather than as gaps between sticks
  g.fillStyle = inkLevel(1);
  g.fillRect(218, FLOOR - 58, 264, 58);
  g.fillRect(640, FLOOR - 58, 264, 58);
  brokenLine(g, 218, 482, FLOOR - 58, 21, { lw: 4, segs: 3 });
  brokenLine(g, 640, 904, FLOOR - 58, 23, { lw: 4, segs: 3 });

  // THE WHITE PARTITION. Paper, enclosed by a hard line — the brightest thing
  // in the frame is the thing that divides it.
  g.fillStyle = "#ffffff";
  g.fillRect(PART_L, PART_TOP, PART_R - PART_L, FLOOR - PART_TOP);
  g.strokeStyle = INK; g.lineWidth = 6;
  g.strokeRect(PART_L, PART_TOP, PART_R - PART_L, FLOOR - PART_TOP);
  g.lineWidth = 4;                                   // its top edge, chamfered
  g.beginPath();
  g.moveTo(PART_L + 9, PART_TOP + 14); g.lineTo(PART_R - 9, PART_TOP + 14);
  g.stroke();
}

/* ---- lavender, which is a smell and must never be drawn purple -----------
   A column of small marks rising out of the LEFT corridor only. Each mark's
   height is (u + phase) mod 1, so at u = 1 the set is identical to u = 0 —
   seamless by construction, like the wingbeat. */
function odour(g, u) {
  g.fillStyle = inkLevel(5);
  for (let i = 0; i < 15; i++) {
    const ph = (i * 0.6180339887) % 1;
    const k  = (u + ph) % 1;                         // 0 at the mouth, 1 at the top
    const x  = 268 + ((i * 31) % 170) + Math.sin((k + ph) * TAU) * 11;
    const y  = FLOOR - 70 - k * 286;
    const r  = 5.0 * (1 - k * 0.62);
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  }
}

/* ---- the swallowtail ----------------------------------------------------- */
function swallowtail(g, s) {
  g.save();
  g.translate(s.bx, s.by);
  g.rotate(s.roll);

  const openX = 0.12 + 0.88 * s.open;                // wings closing = a squeeze in x
  g.save();
  g.scale(openX, 1);

  /* CLOSING WINGS GET LIGHTER, IN QUANTIZED STEPS.
     When the wings come together, four wing planes and sixteen veins land on
     top of each other inside a 60px strip and the animal renders as a solid
     black clot — the frame at u=0.688 was unreadable before this. The fix is
     not opacity (there is none in this world) but the ink ladder: a closed
     wing presents its pale UNDERSIDE, which is exactly the surface the text
     cares about, so it steps 2 → 1 → 0 and its detail drops with it. Three
     discrete levels, no interpolation, and the steps fall inside the fall
     where the body is moving fastest. */
  const wingLevel = s.open < 0.30 ? 0 : s.open < 0.58 ? 1 : 2;
  const nVeins    = s.open < 0.30 ? 1 : s.open < 0.58 ? 2 : 4;
  for (const sx of [-1, 1]) {
    // hindwing first, so the forewing overlaps it as it does on the animal
    path(g, HIND, sx, R); fillWing(g, wingLevel);
    path(g, FORE, sx, R); fillWing(g, wingLevel);
    // black veins, fanning from the wing root. Four, not five: at this dot
    // pitch a fifth turns the wing into a clot instead of a plane.
    g.strokeStyle = INK; g.lineWidth = 3.0 / Math.max(0.25, openX);
    g.beginPath();
    for (const [ex, ey] of VEINS.slice(0, nVeins)) { g.moveTo(0.06 * sx * R, 0.0); g.lineTo(ex * sx * R, ey * R); }
    g.stroke();
  }
  g.restore();                                       // end wing squeeze

  // body: one tapered spindle, never a stack of ellipses
  g.fillStyle = inkLevel(5);
  g.beginPath();
  g.moveTo(0, -0.66 * R);
  g.bezierCurveTo(0.10 * R, -0.50 * R, 0.09 * R, 0.30 * R, 0.02 * R, 0.60 * R);
  g.bezierCurveTo(-0.05 * R, 0.30 * R, -0.10 * R, -0.50 * R, 0, -0.66 * R);
  g.closePath();
  g.fill(); g.strokeStyle = INK; g.lineWidth = 3.4; g.stroke();

  // antennae — they reach 0.86R, which is exactly the clearance APEX allows,
  // so they are what touches the acrylic first. They fall as the cycle wears
  // the animal down.
  const dp = s.droop * 1.6;
  g.strokeStyle = INK; g.lineWidth = 3.2;
  for (const sx of [-1, 1]) {
    g.beginPath();
    g.moveTo(0, -0.62 * R);
    g.quadraticCurveTo(0.16 * sx * R, -0.84 * R + dp * R,
                       0.32 * sx * R, -0.86 * R + dp * 1.7 * R);
    g.stroke();
    g.fillStyle = INK;
    g.beginPath();
    g.arc(0.32 * sx * R, -0.86 * R + dp * 1.7 * R, 4.6, 0, TAU); g.fill();
  }
  g.restore();
}

const FORE = [[0.02, -0.58], [0.55, -0.74, 1.02, -0.42, 1.05, -0.02],
              [0.80, 0.06, 0.35, 0.11, 0.06, 0.11]];
const HIND = [[0.05, 0.06], [0.55, 0.10, 0.88, 0.26, 0.80, 0.52],
              [0.95, 0.80], [0.66, 0.62], [0.45, 0.66, 0.18, 0.54, 0.05, 0.36]];
const VEINS = [[0.92, -0.40], [1.00, -0.14], [0.80, 0.14], [0.68, 0.46]];

function path(g, spec, sx, R) {
  g.beginPath();
  g.moveTo(spec[0][0] * sx * R, spec[0][1] * R);
  for (let i = 1; i < spec.length; i++) {
    const p = spec[i];
    if (p.length === 6) g.bezierCurveTo(p[0] * sx * R, p[1] * R, p[2] * sx * R, p[3] * R, p[4] * sx * R, p[5] * R);
    else g.lineTo(p[0] * sx * R, p[1] * R);
  }
  g.closePath();
}
function fillWing(g, level = 2) {
  g.fillStyle = inkLevel(level); g.fill();
  g.strokeStyle = INK; g.lineWidth = 4.4; g.stroke();
}

/* ---- the moment of contact ----------------------------------------------
   Three ticks against the acrylic and a few loose scales. They exist only
   inside beat 1 and are gone before the beat ends, so they cannot leak across
   the wrap. Scales BRIGHTEN when they come off — they are drawn as ink marks
   ON the light lid, which is the same statement in a one-accent world. */
function impact(g, s) {
  const k = s.contact;                               // 1 at the strike → 0
  g.strokeStyle = INK; g.lineWidth = 5 * k + 2;
  g.beginPath();
  for (const a of [-1, -0.55, 0.55, 1]) {            // radiating clear of the wings
    const x = s.bx + a * 108, y = LID_BOT + 6;
    g.moveTo(x, y); g.lineTo(x + a * 26 * k, y + 20 * k);
  }
  g.stroke();
  g.fillStyle = inkLevel(6);
  for (let i = 0; i < 7; i++) {
    const ph = (i * 0.7548776662) % 1;
    const x = s.bx + (ph - 0.5) * 300 * (0.5 + k);
    const y = LID_BOT + 14 + (1 - k) * 52 + ph * 16;
    g.beginPath(); g.arc(x, y, 4, 0, TAU); g.fill();
  }
}

export const SCENE_VERSION = "bf-motion/1.0.0";
