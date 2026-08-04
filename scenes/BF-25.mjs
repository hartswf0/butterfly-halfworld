/* ============================================================================
   BF-25 · SUMMER ENTERS       INT. MILL · THE ENTRANCE DOOR        the-mill

     "The butterfly climbs the white brightness of the door. Impact. Drop.
      Recovery. The orange cup breaks without drama, pieces sliding apart over
      the stone. Niko shoves the crash bar. Heat, traffic, hot rubber, river
      damp, cut weeds, diesel, sunlight. The butterfly passes into all of it and
      vanishes above the awning."                          — atlas/source.json
     MARA: "Open the door."  NIKO: "If it gets outside—"  MARA: "It will kill itself."

   MOTION: BREAK · 5.0s · 60 frames @12fps.
   DECLARED DISCONTINUITIES — two, and they do NOT coincide:
       u = 0.42   the cup leaves his hand        (10 frames before)
       u = 0.58   SUMMER ENTERS                  (the scene's BREAK)

   ===========================================================================
   WHY THEY DO NOT COINCIDE.

   character.niko authors `drop` with its own declared break at u = 0.42 and
   describes it as one event: "Before: carried, at rest. After: three pieces on
   the stone and two empty hands on the crash bar." That is HIS discontinuity —
   the instant his hands stop carrying and start pushing — and it is used here
   verbatim, at 0.42, on his own clock.

   The scene's BREAK is a different event. Summer does not enter when his hands
   arrive at the bar; it enters when the bar gives. Between the two there is a
   shove, and a shove takes time: the plan measures cup_in_hand to crash_bar at
   196.6px, "the longest single move in this plan". Ten frames at 12fps is what
   that move costs, and putting the two breaks on the same frame would say the
   door opened because he dropped the cup.

   It also protects the big one. The cup break is small, tonal, and local — one
   level-4 object becoming three on a pale floor. Summer is the whole field
   changing allegiance at once. Firing them together makes the small one a
   grace note on the large one and the audience never sees it happen. Ten frames
   apart, the first one is a fact and the second one is a rupture.

   NOTHING EASES ACROSS EITHER. There is no interpolation, no cross-fade and no
   transition frame at 0.42 or at 0.58. `brk()` returns before/after and the
   draw branches. MOTION-BRIEF: BREAK is "the ONLY discontinuity this world
   permits, and it must be declared".

   ---------------------------------------------------------------------------
   WHAT SUMMER IS, IN A WORLD WITH NO COLOUR AND NO GRADIENT.

   "Heat, traffic, hot rubber, river damp, cut weeds, diesel, sunlight" — seven
   things, arriving at once, none of which is a picture. So the after-state is
   built out of what the dot law actually has:

     · the FIELD INVERTS. Before the break the interior carries tone and the
       door is the one white thing in it — "the white brightness of the door".
       After, the whole frame is paper and the only ink left is structure. The
       brightest thing stops being a rectangle and becomes everything.
     · SEVEN BANDS of discrete marks cross the opening, one per named thing,
       each with its own mark and its own rate. They are not a haze. They are
       seven quantities arriving together, which is what the sentence lists.
     · the interior's tone, its floor joints, its stair and its wall are simply
       GONE on the break frame. Not faded. Gone.

   ---------------------------------------------------------------------------
   THE ANIMAL. creature.oldbutterfly's `strike` — "the same four beats as the
   laboratory insect, eighty years older… Open, always: it is dying of this" —
   runs on the door until the break. After it, it goes up and out through the
   opening and is gone before the last frame. `awning_out` is the plan's
   declared occupancy sink: "the animal is above the awning and is not standing
   on anything, which is the one place in five plans where that is true."

   COMPOSITION. One subject: the instant the outside replaces the inside.
   ========================================================================= */
import { brk, framesFor, clamp01 } from "../engine/motion.mjs";
import { INK, inkLevel, lerp, smooth } from "../engine/halfworld-engine.mjs";
import { occupancyAt } from "../engine/blocking.mjs";
import { theMill, MOVES_BF25 } from "./_plans/the-mill.mjs";
import { lens, NW, NH, BODY_H } from "../assets/set/_stage.mjs";
import { glassDoor, stoneFloor, lobbyWall, orangeCup } from "../assets/set/mill.mjs";
import { LV, brokenLine } from "../assets/set/_kit.mjs";
import { exitOccupancy as exitOccupancyBF24 } from "./BF-24.mjs";
import niko from "../assets/character/niko.mjs";
import oldbutterfly from "../assets/creature/oldbutterfly.mjs";

export const id         = "BF-25";
export const title      = "SUMMER ENTERS";
export const place      = "INT. MILL · THE ENTRANCE DOOR";
export const plan       = "the-mill";
export const motion     = "BREAK";
export const beats      = null;
export const seconds    = 5.0;
export const loopClosed = false;
export const frames     = framesFor(motion, seconds, 12);      // 60
export const breakAt       = 0.58;                 // the harness records this one
export const declaredBreak = 0.58;
export const cupBreakAt    = 0.42;                 // niko.motions.drop's own

export const subject  = "the instant the outside replaces the inside";
export const distance = "MEDIUM";
export const leftOut  = [
  "Mara and Iona — Mara says the line that opens the door and is behind the lens saying it",
  "the street itself: what arrives is seven things at once, not a view",
  "the awning, which is above the opening and outside the frame — the animal goes to it",
  "any transition frame at either break. There are none, on purpose.",
];

/* ---- framing ------------------------------------------------------------ */
const ZOOM   = 1.90;
const BODY_K = 0.36;
const station = lens(theMill, { zoom: ZOOM, cx: 0.4700, cy: 0.7642 });
const DOOR   = station("entrance_door_glass");
const BAR    = station("crash_bar");
const CUP_IN = station("cup_in_hand");
const CUP_FL = station("cup_fall");
const PIECES = station("cup_pieces");
const ONDOOR = station("oldbutterfly_on_door");
const FAR    = station("lobby_far");
const bodyH = (p) => BODY_H * p.scale * BODY_K;

const STAND = bodyH(DOOR);
const GLAZE = { h: STAND * 1.30, baseY: DOOR.y, x0: DOOR.x - STAND * 0.72, x1: DOOR.x + STAND * 0.72 };

/* the seven things summer is made of, each with its own mark and its own rate */
const SUMMER = [
  { name: "heat",      mark: "wave",  rate: 1.00, n: 9 },
  { name: "traffic",   mark: "bar",   rate: 1.60, n: 7 },
  { name: "hot rubber", mark: "blot", rate: 0.80, n: 6 },
  { name: "river damp", mark: "wave", rate: 0.55, n: 8 },
  { name: "cut weeds", mark: "stem",  rate: 1.25, n: 10 },
  { name: "diesel",    mark: "blot",  rate: 1.40, n: 6 },
  { name: "sunlight",  mark: "ray",   rate: 2.20, n: 11 },
];

/* ============================================================ at(u) ======== */
export function at(u, _ctx) {
  const b  = brk(u, breakAt);                       // SUMMER
  const bc = brk(u, cupBreakAt);                    // the cup
  return {
    u,
    before: b.before, after: b.after, since: b.sinceBreak,
    cupHeld: bc.before,
    cupFall: bc.before ? 0 : Math.min(1, bc.sinceBreak * 3.0),
    // his own module's clock, so his break is his and lands where he put it
    niko: niko.motions.drop(u),
    // and the animal's, which runs only while there is a door to strike
    bug: oldbutterfly.motions.strike(clamp01(u / breakAt)),
    // after the break it goes up and out, and is gone before the last frame
    exit: b.after ? clamp01(b.sinceBreak * 1.9) : 0,
  };
}

/* ============================================================ draw() ======= */
export function draw(g, W, H, s) {
  g.save();
  g.scale(W / NW, H / NH);
  g.lineJoin = "round"; g.lineCap = "round";

  if (s.before) drawInterior(g, s); else drawSummer(g, s);

  /* ---- NIKO. His own module, his own break, on his own clock. He is in both
     halves and he is the only thing that is. */
  const nb = bodyH(CUP_IN), nw = nb * 0.42;
  const nx = lerp(CUP_IN.x, BAR.x - nb * 0.30, smooth(clamp01((s.u - 0.44) / 0.14)));
  g.save();
  g.translate(nx - nw, CUP_IN.y - nb);
  niko.draw(g, nw * 2, nb, { ...s.niko, shards: false });
  g.restore();

  /* ---- THE CUP. In his hand until 0.42; three pieces on the stone after. */
  const cr = nb * 0.070;
  if (s.cupHeld) {
    orangeCup(g, CUP_IN.x + nb * 0.26, CUP_IN.y - nb * 0.46, cr, { spin: 0 });
  } else {
    const k = s.cupFall;
    if (k < 1) orangeCup(g, lerp(CUP_IN.x + nb * 0.26, CUP_FL.x, k),
                            lerp(CUP_IN.y - nb * 0.46, CUP_FL.y, k), cr, { spin: k * 1.4 });
    else shards(g, PIECES.x, PIECES.y, cr, clamp01((s.cupFall - 1) * 2 + 0.35));
  }

  /* ---- THE ANIMAL. */
  const V = STAND * 0.34;
  if (s.before) {
    oldbutterfly.draw(g, NW, NH, {
      closure: s.bug.closure, tilt: s.bug.tilt, wear: s.bug.wear,
      cx: ONDOOR.x / NW,
      cy: lerp(GLAZE.baseY - GLAZE.h * 0.18, GLAZE.baseY - GLAZE.h * 0.86, s.bug.cy) / NH,
      V,
    });
  } else if (s.exit < 1) {
    oldbutterfly.draw(g, NW, NH, {
      closure: 0.26, tilt: -0.22 - 0.3 * s.exit, wear: 0.7,
      cx: (ONDOOR.x + STAND * 0.30 * s.exit) / NW,
      cy: (GLAZE.baseY - GLAZE.h * 0.55 - GLAZE.h * 1.5 * s.exit) / NH,
      V: V * (1 - 0.35 * s.exit),
    });
  }

  g.restore();
}

/* ---- BEFORE: the interior, and the door is the one white thing in it ----- */
function drawInterior(g, s) {
  lobbyWall(g, -20, NW + 20, -200, FAR.y, { seed: 44, columns: [0.10, 0.90] });
  stoneFloor(g, FAR.y, NH + 20, -20, NW + 20, { seed: 21, courses: 4 });
  glassDoor(g, GLAZE.x0, GLAZE.baseY - GLAZE.h, GLAZE.x1 - GLAZE.x0, GLAZE.h,
    { crash: true, street: 1, seed: 33, leaves: 2 });
}

/* ---- AFTER: everything at once ------------------------------------------
   The field inverts. No wall, no floor tone, no glass: the frame is paper with
   structure in it, and seven bands of discrete marks crossing the opening. */
function drawSummer(g, s) {
  // the opening: two jambs and a head, and nothing between them
  g.strokeStyle = INK; g.lineWidth = 9;
  g.beginPath();
  g.moveTo(GLAZE.x0, GLAZE.baseY); g.lineTo(GLAZE.x0, GLAZE.baseY - GLAZE.h);
  g.lineTo(GLAZE.x1, GLAZE.baseY - GLAZE.h); g.lineTo(GLAZE.x1, GLAZE.baseY);
  g.stroke();
  // the leaf, swung out and away, still attached
  g.strokeStyle = INK; g.lineWidth = 7;
  g.beginPath();
  g.moveTo(GLAZE.x1, GLAZE.baseY - GLAZE.h);
  g.lineTo(GLAZE.x1 + GLAZE.h * 0.30, GLAZE.baseY - GLAZE.h * 0.86);
  g.lineTo(GLAZE.x1 + GLAZE.h * 0.30, GLAZE.baseY - GLAZE.h * 0.06);
  g.lineTo(GLAZE.x1, GLAZE.baseY);
  g.stroke();
  brokenLine(g, -20, NW + 20, GLAZE.baseY + 6, 61, { lw: 5, segs: 4, gap: 0.04 });

  /* SEVEN THINGS, ARRIVING AT ONCE. Every band starts at the break — none of
     them ramps in — and they differ only in mark and rate, which is what makes
     them seven things instead of one effect. */
  const k = s.since;
  g.save();
  SUMMER.forEach((band, bi) => {
    const y0 = GLAZE.baseY - GLAZE.h * (0.06 + bi * 0.135);
    for (let i = 0; i < band.n; i++) {
      const ph = ((i * 0.6180339887 + bi * 0.317) % 1);
      const t = (k * band.rate + ph) % 1;
      const x = lerp(GLAZE.x0 - 40, GLAZE.x1 + 40, t);
      const y = y0 + Math.sin((t + ph) * Math.PI * 2) * GLAZE.h * 0.035;
      const level = 3 + (bi % 4);
      summerMark(g, band.mark, x, y, GLAZE.h * 0.055, level, i + bi);
    }
  });
  g.restore();
}

function summerMark(g, kind, x, y, r, level, i) {
  g.save();
  g.strokeStyle = inkLevel(level); g.fillStyle = inkLevel(level);
  g.lineWidth = Math.max(2.6, r * 0.20); g.lineCap = "round";
  if (kind === "wave") {
    g.beginPath();
    g.moveTo(x - r, y);
    g.quadraticCurveTo(x - r * 0.5, y - r * 0.5, x, y);
    g.quadraticCurveTo(x + r * 0.5, y + r * 0.5, x + r, y);
    g.stroke();
  } else if (kind === "bar") {
    g.beginPath(); g.moveTo(x - r * 1.2, y); g.lineTo(x + r * 1.2, y); g.stroke();
  } else if (kind === "blot") {
    g.beginPath(); g.ellipse(x, y, r * 0.42, r * 0.30, i * 0.7, 0, Math.PI * 2); g.fill();
  } else if (kind === "stem") {
    g.beginPath();
    g.moveTo(x, y + r * 0.6); g.lineTo(x + r * 0.2, y - r * 0.6);
    g.moveTo(x + r * 0.12, y); g.lineTo(x + r * 0.6, y - r * 0.24);
    g.stroke();
  } else {                                            // ray
    g.beginPath();
    for (const a of [-0.6, 0, 0.6]) {
      g.moveTo(x, y);
      g.lineTo(x + Math.cos(a - 0.4) * r * 1.1, y + Math.sin(a - 0.4) * r * 1.1);
    }
    g.stroke();
  }
  g.restore();
}

/* three pieces, sliding apart over the stone. They do not bounce, spin or ring. */
function shards(g, x, y, r, spread) {
  g.save();
  g.fillStyle = LV(4); g.strokeStyle = INK; g.lineWidth = 3.4; g.lineJoin = "round";
  const P = [[-1.0, 0.10, 0.9], [0.25, -0.35, 1.1], [1.1, 0.30, 0.7]];
  for (const [dx, dy, sc] of P) {
    const px = x + dx * r * 2.2 * spread, py = y + dy * r * 1.5 * spread;
    g.beginPath();
    g.moveTo(px - r * 0.7 * sc, py + r * 0.30 * sc);
    g.lineTo(px + r * 0.6 * sc, py + r * 0.42 * sc);
    g.lineTo(px + r * 0.30 * sc, py - r * 0.44 * sc);
    g.closePath(); g.fill(); g.stroke();
  }
  g.restore();
}

/* ---- occupancy ---------------------------------------------------------- */
/* BF-24 now MOVES the animal onto the reel rather than asserting it, so this
   chains straight through with no override. */
export const INITIAL = exitOccupancyBF24;
export const MOVES   = MOVES_BF25;
export const exitOccupancy = occupancyAt(theMill, MOVES, 7, INITIAL);

export const SCENE_VERSION = "bf-motion/1.0.0";
