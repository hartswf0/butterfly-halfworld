/* ============================================================================
   BF-07 · THE SCALES BRIGHTEN     INT. LABORATORY · HER HAND — CONTINUOUS
                                                        plan: the-laboratory

     "Yellow scales have passed through a puncture near the thumb and settled
      on her skin."
     "They lie in the lines of her palm like ground metal."
     "She rubs them with the side of her finger. INSTEAD OF DISAPPEARING, THEY
      BRIGHTEN."                                        — atlas/source.json

     NIKO: "What is that?"   MARA: "Wing scale."

   MOTION: TRANSFER · 4.0s · 48 frames @12fps · loopClosed: false.

   ---------------------------------------------------------------------------
   THIS IS THE FIRST APPEARANCE OF THE SUBSTANCE THAT MOVES THROUGH THE WHOLE
   FILM, AND ANYTHING THAT DIMS IS WRONG.

   MOTION-BRIEF's punish-list: "Letting the scales fade. They BRIGHTEN when
   rubbed. transfer() peaks their ink at the midpoint of the crossing." So
   every one of the twenty-six carriers here runs the ink ladder

       at rest in the line       level 4
       crossing, at the midpoint level 7          <- transfer()'s peak
       settled on the ridge      level 6

   and there is no value of u at which any carrier is below the level it
   started at. That is checked, not asserted: NEVER_DIMS below walks all 48
   frames and all 26 carriers at import time and throws if any carrier's level
   ever drops under its source level (it reports minLevel 4). It has to be a
   check, because "brighten"
   is exactly the kind of claim a drawing can quietly stop honouring while
   still looking plausible.

   ---------------------------------------------------------------------------
   ONE PLACE WHERE I DEPART FROM transfer(), AND WHY.

   transfer()'s ink is 1 + sin(k*PI)*0.9: it PEAKS at the crossing midpoint and
   RETURNS TO 1 at k = 1. That is right for a carrier that is simply arriving
   somewhere — the scales on the glove in BF-04 do exactly that. But this unit
   says the opposite of return: "instead of disappearing, they brighten", which
   is a permanent change of state and not a transient. A scale that ends at the
   ink it started at has disappeared in the only sense this world has.

   So the scene adds a SETTLED GAIN: once a carrier reaches k = 1 it holds
   level 5 rather than falling back to level 3. The peak is transfer()'s and is
   untouched; the floor afterwards is the scene's, and it is two ink levels
   above where the scale began. transfer() is not modified — that function
   belongs to the world — and the gain is one line, here, stated.

   THE RUB IS A STRAIGHT LINE ACROSS, ONCE. The side of a finger, not a
   fingertip: a long contact edge that crosses the palm from the thumb side to
   the outside, so it meets each of the three palm lines in turn. Scales are
   moved ALONG the line they are lying in — ground metal in a groove does not
   scatter, it travels — and their displacement is small. Nothing is smeared;
   the dot law has no smear.

   PUNCTURE. "through a puncture near the thumb" — one small break in the
   glove's ink contour at the base of the thumb, which is the same place Iona
   carries a scar in BF-22. The plan gives it a station, `glove_puncture_thumb`.
   The glove is off in this shot (her state node is `palm`, guise `bare`); the
   puncture is drawn on the discarded cuff at the frame's lower edge.

   DECLARED DISCONTINUITIES: none.
   ========================================================================= */
import { transfer, framesFor, clamp01, TAU } from "../engine/motion.mjs";
import { INK, inkLevel, smooth, lerp } from "../engine/halfworld-engine.mjs";
import { occupancyAt } from "../engine/blocking.mjs";
import { brokenLine } from "../assets/set/_kit.mjs";
import { theLaboratory } from "./_plans/the-laboratory.mjs";
import { exitOccupancy as EXIT_BF06 } from "./BF-06.mjs";

export const id         = "BF-07";
export const title      = "THE SCALES BRIGHTEN";
export const place      = "INT. LABORATORY · HER HAND";
export const plan       = "the-laboratory";
export const motion     = "TRANSFER";
export const beats      = null;
export const seconds    = 4.0;
export const loopClosed = false;
export const frames     = framesFor(motion, seconds, 12);     // 48
export const declaredBreak = null;

export const subject  = "the scales in the lines of her palm, brightening under a finger";
export const distance = "CLOSE";
export const leftOut  = [
  "Niko, who asks what it is — the answer is two words and the frame is the " +
  "evidence for it",
  "her face — a palm this size and a face in the same frame is two subjects",
  "the bench, the box, the room",
];

/* ---- the palm ------------------------------------------------------------
   Three lines, in scene space. The scales lie IN them, so each carrier is
   parameterised by (which line, how far along it) and not by a free position:
   ground metal in a groove travels along the groove. */
const PALM_X = 552, PALM_Y = 404, PALM_R = 268;
const LINES = [
  // heart line — high, running from the outside edge toward the index
  { p: [[-0.86, -0.34], [-0.30, -0.52], [0.28, -0.50], [0.72, -0.30]] },
  // head line — the long one across the middle
  { p: [[-0.92, 0.02], [-0.34, -0.14], [0.22, -0.10], [0.80, 0.06]] },
  // life line — round the ball of the thumb
  { p: [[-0.62, -0.44], [-0.84, 0.04], [-0.70, 0.52], [-0.34, 0.82]] },
];

const N = 26;
/* Each scale: which line, where along it, and how far the rub pushes it. */
const SCALES = (() => {
  const out = [];
  for (let i = 0; i < N; i++) {
    const line = i % 3;
    const t = ((i * 0.6180339887) % 1) * 0.86 + 0.07;
    out.push({ i, line, t, push: 0.028 + 0.030 * ((i * 7) % 5) / 4,
               off: (((i * 13) % 7) / 6 - 0.5) * 0.045 });
  }
  return out;
})();

/* the rub: the side of a finger crossing left to right, once */
const RUB_T0 = 0.16, RUB_T1 = 0.80;

/* ---- the ink ladder, and the check that it never goes down ---------------- */
/* THE LADDER. Pass 3 moved rest 3 -> 4 and settled 5 -> 6: at level 3 the
   scales were nearly invisible before the rub, and the sentence before the one
   about brightening says they LIE IN THE LINES OF HER PALM LIKE GROUND METAL —
   they have to be there to brighten. The permanent gain is still two levels. */
const LVL_REST = 4, LVL_SET = 6, LVL_PEAK = 7;
function levelFor(k, arrived) {
  if (k <= 0) return LVL_REST;
  if (arrived) return LVL_SET;                       // the settled gain. See header.
  // transfer()'s ink is 1 + sin(k*PI)*0.9; map its peak onto REST -> PEAK
  const ink = 1 + Math.sin(clamp01(k) * Math.PI) * 0.9;
  return Math.min(LVL_PEAK, Math.round(LVL_REST + (ink - 1) / 0.9 * (LVL_PEAK - LVL_REST)));
}

export const NEVER_DIMS = (() => {
  let worst = 99, at = null;
  for (let f = 0; f < 48; f++) {
    const st = at_(f / 48);
    for (const c of st.car) {
      const l = levelFor(c.k, c.k >= 1);
      if (l < worst) { worst = l; at = { frame: f, carrier: c.i, level: l }; }
    }
  }
  if (worst < LVL_REST) throw new Error(
    `[BF-07] a scale DIMMED: carrier ${at.carrier} hits level ${at.level} at frame ` +
    `${at.frame}, below its resting level ${LVL_REST}. The text says they brighten.`);
  return { minLevel: worst, restLevel: LVL_REST, settledLevel: LVL_SET, peakLevel: LVL_PEAK, at };
})();

/* ============================================================ at(u) ========
   Named at_ so the import-time check above can call it before the export
   binding is initialised; `at` is the export and is this function. */
function at_(u) {
  const uu = clamp01(u);
  // the rub crosses once. Carriers are staggered so the leading edge of the
  // finger reaches them in order across the palm.
  const rub = clamp01((uu - RUB_T0) / (RUB_T1 - RUB_T0));
  const car = transfer(rub, N, { stagger: 0.62, seed: 11 });
  return {
    u: uu,
    rub,
    fingerX: lerp(-1.18, 1.20, smooth(rub)),
    touching: uu > RUB_T0 && uu < RUB_T1,
    car,
  };
}
export function at(u, _ctx) { return at_(u); }

/* ============================================================ draw() ======= */
const NW = 1120, NH = 760;

export function draw(g, W, H, s) {
  g.save();
  g.scale(W / NW, H / NH);
  g.lineJoin = "round"; g.lineCap = "round";

  backdrop(g);
  palm(g);
  /* ORDER IS THE ARGUMENT. Scales still at rest or mid-crossing are drawn
     UNDER the finger, because the finger is on top of them; scales that have
     ARRIVED are drawn OVER it, because the finger has passed them and what
     the shot is about is being able to see that they did not go out. If the
     settled ones were painted first, the one event this unit exists for would
     spend the whole loop hidden behind the thing causing it. */
  scales(g, s, false);
  if (s.touching) finger(g, s);
  scales(g, s, true);
  cuff(g);

  g.restore();
}

function backdrop(g) {
  g.fillStyle = inkLevel(0); g.fillRect(0, 0, NW, NH);
  g.fillStyle = inkLevel(1); g.fillRect(0, 610, NW, NH - 610);
  brokenLine(g, -30, NW + 30, 610, 517, { lw: 4.4, segs: 3, gap: 0.06 });
}

/* map a normalised palm coordinate to the frame */
const PX = (x, y) => ({ x: PALM_X + x * PALM_R, y: PALM_Y + y * PALM_R });

function lineAt(line, t) {
  const p = LINES[line].p;
  const seg = Math.min(p.length - 2, Math.floor(t * (p.length - 1)));
  const k = t * (p.length - 1) - seg;
  return [lerp(p[seg][0], p[seg + 1][0], k), lerp(p[seg][1], p[seg + 1][1], k)];
}

/* the hand, open, seen from above.
   PASS 2. The first version drew four rectangular fingers ABOVE a straight
   knuckle line with paper gaps between them and the palm, and a thumb made of
   two planks: it rendered as a mitten with cutlery. Fingers now spring from
   the palm and are drawn UNDER it, so the joins are covered by the palm's own
   plane and there is no seam; each tapers and has a rounded tip and one joint
   crease. The thumb comes off the thenar as a single tapering mass. Skin is
   level 2 with a hard contour — the palm is the largest light plane in the act
   and everything dark in this frame is either a line of the hand or a scale. */
function palm(g) {
  g.save();
  g.strokeStyle = INK;

  // ---- the four fingers, UNDER the palm ----------------------------------
  g.lineWidth = 5.5;
  const FING = [[-0.80, 1.02], [-0.28, 1.20], [0.24, 1.16], [0.72, 0.96]];
  FING.forEach(([x0, len], i) => {
    const base = PX(x0, -0.52), tip = PX(x0 + 0.06, -0.52 - len);
    const w0 = 52, w1 = 40;
    g.fillStyle = inkLevel(2);
    g.beginPath();
    g.moveTo(base.x - w0, base.y);
    g.lineTo(tip.x - w1, tip.y + 30);
    g.quadraticCurveTo(tip.x, tip.y - 16, tip.x + w1, tip.y + 30);
    g.lineTo(base.x + w0, base.y);
    g.closePath(); g.fill(); g.stroke();
    // one joint crease, so a finger is a finger and not a dowel
    g.strokeStyle = inkLevel(5); g.lineWidth = 3.4;
    g.beginPath();
    g.moveTo(base.x - w0 * 0.72, base.y - len * PALM_R * 0.40);
    g.lineTo(base.x + w0 * 0.72, base.y - len * PALM_R * 0.40 - 8);
    g.stroke();
    g.strokeStyle = INK; g.lineWidth = 5.5;
  });

  // ---- the thumb, off the thenar, also under the palm ---------------------
  const th0 = PX(-0.72, 0.18), th1 = PX(-1.58, -0.22);
  g.fillStyle = inkLevel(2);
  g.beginPath();
  g.moveTo(th0.x, th0.y + 62);
  g.bezierCurveTo(th0.x - 120, th0.y + 70, th1.x + 40, th1.y + 66, th1.x + 4, th1.y + 40);
  g.quadraticCurveTo(th1.x - 34, th1.y + 4, th1.x + 24, th1.y - 24);
  g.bezierCurveTo(th0.x - 80, th0.y - 60, th0.x - 30, th0.y - 66, th0.x, th0.y - 40);
  g.closePath(); g.fill(); g.stroke();

  // ---- the palm itself, OVER the joins -----------------------------------
  g.fillStyle = inkLevel(2);
  g.lineWidth = 6;
  g.beginPath();
  const P = (x, y) => PX(x, y);
  g.moveTo(P(-0.90, -0.50).x, P(-0.90, -0.50).y);           // outside knuckle
  g.bezierCurveTo(P(-1.20, -0.18).x, P(-1.20, -0.18).y,     // thenar, the ball
                  P(-1.14, 0.36).x,  P(-1.14, 0.36).y,
                  P(-0.78, 0.72).x,  P(-0.78, 0.72).y);
  g.bezierCurveTo(P(-0.40, 1.02).x,  P(-0.40, 1.02).y,      // heel of the hand
                  P(0.32, 1.00).x,   P(0.32, 1.00).y,
                  P(0.68, 0.66).x,   P(0.68, 0.66).y);
  g.bezierCurveTo(P(0.98, 0.34).x,   P(0.98, 0.34).y,
                  P(1.02, -0.14).x,  P(1.02, -0.14).y,
                  P(0.88, -0.50).x,  P(0.88, -0.50).y);
  g.closePath(); g.fill(); g.stroke();

  // THE THREE LINES. Level 6, and they are grooves: the scales lie in them and
  // travel along them rather than scattering.
  g.strokeStyle = inkLevel(6); g.lineWidth = 4.6;
  for (const L of LINES) {
    g.beginPath();
    const p0 = PX(L.p[0][0], L.p[0][1]); g.moveTo(p0.x, p0.y);
    for (let i = 1; i < L.p.length; i++) { const p = PX(L.p[i][0], L.p[i][1]); g.lineTo(p.x, p.y); }
    g.stroke();
  }
  g.restore();
}

/* ---- the scales ---------------------------------------------------------- */
function scales(g, s, onlyArrived) {
  for (const sc of SCALES) {
    const c = s.car[sc.i];
    const arrived = c.k >= 1;
    if (arrived !== !!onlyArrived) continue;
    const t = clamp01(sc.t + sc.push * clamp01(c.k));
    const [lx, ly] = lineAt(sc.line, t);
    const p = PX(lx, ly + sc.off);
    const level = levelFor(c.k, arrived);
    // a scale is a short flake, not a dot: a rectangle a few px long, lying
    // along the groove. Ground metal.
    g.save();
    g.translate(p.x, p.y);
    g.rotate(sc.i * 0.9 + (c.k > 0 && !arrived ? c.wobble * 0.5 : 0));
    g.fillStyle = inkLevel(level);
    const w = 19 + (level - LVL_REST) * 3.4, h = 8.4 + (level - LVL_REST) * 1.5;
    g.fillRect(-w / 2, -h / 2, w, h);
    if (level >= 7) { g.strokeStyle = INK; g.lineWidth = 2.2; g.strokeRect(-w / 2, -h / 2, w, h); }
    g.restore();
  }
}

/* ---- the finger ----------------------------------------------------------
   The SIDE of a finger: a long contact edge, drawn as the near silhouette of a
   digit crossing the palm. It is level 1 — lighter than the palm — so it reads
   as being in front, and it never covers a scale it has already passed. */
function finger(g, s) {
  const x = s.fingerX;
  const top = PX(x - 0.10, -0.86), bot = PX(x + 0.10, 1.10);
  g.save();
  g.fillStyle = inkLevel(1);
  g.strokeStyle = INK; g.lineWidth = 5.5;
  g.beginPath();
  g.moveTo(top.x - 34, top.y);
  g.bezierCurveTo(top.x - 44, top.y + 220, bot.x - 42, bot.y - 200, bot.x - 26, bot.y);
  g.lineTo(bot.x + 34, bot.y + 8);
  g.bezierCurveTo(bot.x + 48, bot.y - 220, top.x + 46, top.y + 210, top.x + 30, top.y);
  g.closePath(); g.fill(); g.stroke();
  // the nail edge, one line, so the shape is a finger and not a bar
  g.strokeStyle = inkLevel(5); g.lineWidth = 3.4;
  g.beginPath();
  g.moveTo(top.x + 10, top.y + 40);
  g.bezierCurveTo(top.x + 22, top.y + 240, bot.x + 20, bot.y - 250, bot.x + 8, bot.y - 40);
  g.stroke();
  g.restore();
}

/* ---- the glove, off, with the puncture ----------------------------------- */
function cuff(g) {
  const y = 646;
  g.save();
  g.fillStyle = inkLevel(1);
  g.beginPath();
  g.moveTo(96, NH); g.lineTo(120, y + 26);
  g.bezierCurveTo(260, y - 16, 430, y - 8, 546, y + 34);
  g.lineTo(560, NH);
  g.closePath(); g.fill();
  g.strokeStyle = INK; g.lineWidth = 5;
  g.beginPath();
  g.moveTo(120, y + 26);
  g.bezierCurveTo(260, y - 16, 430, y - 8, 546, y + 34);
  g.stroke();
  // THE PUNCTURE, near the thumb: one break in the contour with two short
  // radiating splits. It is the same shape of injury Iona carries in BF-22.
  g.strokeStyle = inkLevel(0); g.lineWidth = 9;
  g.beginPath(); g.moveTo(276, y - 9); g.lineTo(316, y - 12); g.stroke();
  g.strokeStyle = INK; g.lineWidth = 3.4;
  g.beginPath();
  g.moveTo(276, y - 9); g.lineTo(288, y + 16);
  g.moveTo(316, y - 12); g.lineTo(308, y + 14);
  g.stroke();
  g.restore();
}

/* ============================================================ occupancy ==== */
export const INITIAL = EXIT_BF06;
export const MOVES   = [];
export const exitOccupancy = occupancyAt(theLaboratory, MOVES, 6, INITIAL);

export const SCENE_VERSION = "bf-motion/1.0.0";
