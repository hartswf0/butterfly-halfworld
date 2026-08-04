/* ============================================================================
   BF-15 · A SMELL RISES        INT. MILL · THE FIRE DOOR        plan: the-mill

     "A smell rises from the stairwell — not the measured concentration of the
      maze. This is green and bitter. Crushed stems warming in a hand."
                                                          — atlas/source.json
     MARA: "Call building security."

   MOTION: TRANSFER · 3.0s · 36 frames @12fps. Not a cycle; nothing here closes.

   WHY THIS IS A TRANSFER AND NOT AN ATMOSPHERE. transfer() is "a quantity of
   discrete carriers moving between two surfaces… never blended and never faded:
   each carrier is at A or in flight or at B. And they BRIGHTEN in transit."
   A smell drawn as a haze would be weather, and this world has no haze; it also
   would not be the sentence, which is about a specific quantity of a specific
   substance arriving from a specific place. The two surfaces are the STAIRWELL
   SIDE of the fire door and the LANDING SIDE, and the crossing is the 14px gap
   under the leaf. Every mark in this scene is at one side, in the gap, or at the
   other side.

   THE ONE ARGUMENT THIS SCENE MAKES IS AGAINST BF-01.
   "not the MEASURED CONCENTRATION of the maze." BF-01 draws the lavender in the
   left corridor as fifteen round dots on a golden-ratio ladder, evenly sized,
   evenly spaced, rising at one rate — a measured concentration, which is what a
   laboratory odour cue is. So this one must not be round, must not be even, and
   must not rise at one rate: transfer()'s `stagger` gives every carrier its own
   start, and each is drawn as a CRUSHED STEM — a bent line with three broken
   ticks off it — because the text says stems and says crushed. The difference
   between the two drawings is the whole of the beat.

   DECLARED DISCONTINUITIES: none.

   OCCUPANCY, AND WHY IT IS NOT A STRAIGHT IMPORT.

   BF-14 has landed. Its exitOccupancy is
       { mara: "mara_at_phone", niko: "niko_at_monitor",
         swallowtail: "recovery_rack_vial" }
   and every one of those is a station in THE-LABORATORY. the-mill does not have
   them; `theMill.at("mara_at_phone")` throws, which is the plan system working.
   Two plans do not share a namespace, and assigning one plan's occupancy into
   another would put three bodies at coordinates that mean nothing.

   What the two plans DO share is one leaf of steel. the-mill's header: "THE FAR
   EDGE IS THE PREVIOUS PLAN'S NEAR EDGE. `fire_door` here IS `fire_door` in
   the-laboratory: same leaf of steel, z .085 in this plan and z .946 in that
   one… BF-14 ends on the laboratory side of it; BF-15 begins with a smell
   coming up through it."

   So INITIAL is the-mill's own authored rest state — mara at fire_door, niko at
   stairhead, both re-expressed in this plan's coordinates — and BF-14's exit is
   kept as `carriedFromTheLaboratory` rather than silently dropped, with the tie
   station asserted at module load. That is the same shape BF-26 uses when this
   act crosses from the-mill into the-lot.

   COMPOSITION. One subject: the smell crossing the gap. Mara is in the frame at
   two-thirds height and in profile because somebody has to be receiving it — a
   smell with nobody in the frame is a diagram — but she is not the subject and
   her face is turned away from the lens.
   ========================================================================= */
import { transfer, framesFor, TAU, clamp01 } from "../engine/motion.mjs";
import { INK, inkLevel, lerp, smooth } from "../engine/halfworld-engine.mjs";
import { occupancyAt } from "../engine/blocking.mjs";
import { theMill, INITIAL_BF15, MOVES_BF15 } from "./_plans/the-mill.mjs";
import { exitOccupancy as exitOccupancyBF14 } from "./BF-14.mjs";
import { lens, NW, NH, bodyBox } from "../assets/set/_stage.mjs";
import { brickWall, fireDoor, stairFlight } from "../assets/set/mill.mjs";
import { LV, brokenLine } from "../assets/set/_kit.mjs";
import mara from "../assets/character/mara.mjs";

/* ---- the motion scene contract ------------------------------------------ */
export const id         = "BF-15";
export const title      = "A SMELL RISES";
export const place      = "INT. MILL · THE FIRE DOOR";
export const plan       = "the-mill";
export const motion     = "TRANSFER";
export const beats      = null;
export const seconds    = 3.0;
export const loopClosed = false;
export const frames     = framesFor(motion, seconds, 12);       // 36
export const declaredBreak = null;
export const breakAt    = null;

export const subject  = "the smell crossing the gap under the fire door";
export const distance = "MEDIUM";
export const leftOut  = [
  "Niko — he is at the stairhead behind the lens and he has the telephone",
  "the laboratory on the other side of the leaf",
  "the flight of stairs below (BF-16 owns it)",
  "Mara's face — she is turned to the door",
];

/* ---- framing -------------------------------------------------------------
   the-mill projects its whole depth into y .53 .. .96, so a straight plan.at()
   would put the fire door in a 30px band at the horizon. lens() is a uniform
   zoom about one point — it cannot reorder anything — cropped onto the door. */
const station = lens(theMill, { zoom: 1.55, cx: 0.502, cy: 0.292 });
const DOOR = station("fire_door");
const SMELL = station("fire_door_smell");
const MARA_P = station("fire_door");

const CARRIERS = 18;

/* ============================================================ at(u) ========
   PURE function of normalised u. No clock, no state, no reading frame n-1. */
export function at(u, _ctx) {
  /* stagger 0.62: the last carrier leaves at u = 0.62 and the crossing itself
     takes 0.38 of the scene, so nothing is still at the source at the end and
     nothing has arrived at the start. An even release would be the maze. */
  const car = transfer(u, CARRIERS, { stagger: 0.62, seed: 815 });
  return {
    u,
    car,
    // she turns her head toward the door across the whole scene, once, slowly
    turn: smooth(clamp01((u - 0.10) / 0.55)),
    breath: Math.sin(u * TAU * 0.9),
  };
}

/* ---- the landing, laid out in nominal pixels around the station ----------
   the-mill has ONE station at the door and Mara is standing AT it; the plan has
   no sub-station resolution there, so the door and the body are separated in
   scene space, which is the only place that separation can be made.
   PASS 2 numbers. Pass 1 put the door dead centre and Mara at +1.65 body widths,
   which cropped her at the right edge — the failure SCENE-BRIEF §3 names first. */
const DOOR_CX  = DOOR.x - 196;
const MARA_CX  = DOOR.x + 214;

/* ============================================================ draw() ======= */
export function draw(g, W, H, s) {
  g.save();
  g.scale(W / NW, H / NH);
  g.lineJoin = "round"; g.lineCap = "round";

  const box = bodyBox(MARA_P, 1);
  const doorH = box.h * 1.18, doorW = doorH * 0.46;
  const dx = DOOR_CX - doorW * 0.5, dy = DOOR.y - doorH;

  /* ---- the landing.
     PASS 2: pass 1 filled the whole frame — brick at level 1 on the left, a
     level-2 well on the right — and the render came back as one grey field with
     a grey door in it, which is BUILD-BRIEF §5's first trap taken at full size.
     The landing is now PAPER. Brick appears only in the reveal the door is hung
     in; everything else is a broken skirting and a broken floor line, and half
     the frame is cream, which is what the budget says. */
  brickWall(g, dx - 92, dy - 66, dx - 22, DOOR.y + 6, { seed: 3, course: 26, level: 1 });
  brokenLine(g, dx + doorW + 30, NW - 40, dy + doorH * 0.06, 55, { lw: 3.4, segs: 3, color: LV(3) });

  const gap = fireDoor(g, dx, dy, doorW, doorH, { gap: 16 });

  /* ---- the landing floor, and the top treads of the flight going down and
     AWAY from her. Broken, so the landing edge is not one bar across a frame
     that is already all horizontals. */
  brokenLine(g, dx - 130, NW - 30, DOOR.y + 3, 61, { lw: 6, segs: 4, gap: 0.035 });
  stairFlight(g, { x: dx - 40, y: DOOR.y + 26 }, { x: dx - 130, y: DOOR.y + 118 },
    { steps: 3, wTop: doorW * 0.9, wBot: doorW * 1.25, seed: 12 });

  /* ---- MARA, whole, clear of every edge. She is not the subject. */
  drawMara(g, box, s);

  /* ---- THE SMELL. The whole scene. */
  smell(g, s, gap, box);

  g.restore();
}

/* ---- the crossing --------------------------------------------------------
   A: under the leaf, in the stairwell, below the gap line — only the tips show.
   B: the landing air, up and across toward the person who is smelling it.
   Every carrier is at A, in flight, or at B; none is blended between two states.
   ink peaks at the midpoint of the crossing (transfer()'s own law) and SIZE only
   ever grows, so nothing in this scene gets smaller as it arrives. */
function smell(g, s, gap, box) {
  const gy = gap.gapY;
  const x0 = gap.gapX0, x1 = gap.gapX1;
  /* PASS 2 BUG, logged: the target was box.x, which is the STATION x — and the
     station is the door. Every carrier converged on the door's own right edge and
     clotted there in a black mass instead of crossing the landing. The target is
     the place the body was DRAWN, which is the only thing in the frame that is
     smelling anything. */
  /* PASS 3: every carrier had ONE target, so all eighteen arrived on the same
     point and the last third of the loop was a black bundle sitting on her face.
     A smell does not arrive at a point. Each carrier gets its own arrival in a
     cloud around her head, and the top size comes down so the cloud sits beside
     the face rather than on top of it. */
  const TX = MARA_CX, TY = box.top + box.h * 0.20;
  for (const c of s.car) {
    const ph = (c.i * 0.6180339887) % 1;
    const ph2 = (c.i * 0.7548776662) % 1;
    const lane = lerp(x0 + 14, x1 - 14, ph);
    let x, y, grow;
    if (c.at === "source") {
      x = lane; y = gy + 10 + ph2 * 6; grow = 0.26;
    } else {
      const k = c.k;
      // a shallow arc out of the gap and across the landing to her: the sideways
      // component arrives later than the lift, so it rises before it travels
      const kx = k * k;
      const tx = TX + (ph - 0.5) * 210, ty = TY + (ph2 - 0.5) * 190;
      x = lane + (tx - lane) * kx * 0.92 + c.wobble * 30 * k;
      y = lerp(gy, ty, Math.pow(k, 0.78));
      grow = 0.26 + 0.62 * k;
    }
    const level = c.ink > 1.62 ? 7 : c.ink > 1.30 ? 6 : 4;
    crushedStem(g, x, y, 56 * grow, level, c.i);
  }
}

/* A CRUSHED STEM, not a dot. Bent, with three broken ticks off it — the mark
   that is not "the measured concentration of the maze". */
function crushedStem(g, x, y, len, level, i) {
  const a = -Math.PI / 2 + Math.sin(i * 2.399) * 0.9;
  const bend = Math.cos(i * 1.71) * 0.8;
  g.save();
  g.translate(x, y); g.rotate(a);
  g.strokeStyle = inkLevel(level); g.lineWidth = Math.max(2.2, len * 0.13);
  g.beginPath();
  g.moveTo(0, 0);
  g.quadraticCurveTo(len * 0.34 * bend, -len * 0.5, len * 0.16 * bend, -len);
  g.stroke();
  g.lineWidth = Math.max(1.8, len * 0.10);
  for (let k = 0; k < 3; k++) {
    const t = 0.3 + k * 0.26;
    const sx = len * 0.30 * bend * t, sy = -len * t;
    const sgn = k % 2 ? 1 : -1;
    g.beginPath();
    g.moveTo(sx, sy); g.lineTo(sx + sgn * len * 0.30, sy - len * 0.13);
    g.stroke();
  }
  g.restore();
}

/* ---- Mara ---------------------------------------------------------------
   Drawn through her own module, at the station the plan puts her on, with her
   `breath` motion and her head turning to the door. `mv_delete` is the pose
   whose gaze is off to one side; the turn drives gazeX and headYaw over it. */
function drawMara(g, box, s) {
  const st = {
    ...mara.states.nodes.del.preview,
    ...mara.motions.breath(s.u),
    box: false, guise: "gloved",
    gaze: { x: -0.30 - 0.34 * s.turn, y: -0.06 },
  };
  st.rig = { ...st.rig, headYaw: -0.34 - 0.52 * s.turn, neckYaw: -0.14 - 0.24 * s.turn,
             gazeX: -0.30 - 0.40 * s.turn, bodyYaw: -0.62, headPitch: -0.12 };
  g.save();
  g.translate(MARA_CX - box.w * 1.0, box.top);
  mara.draw(g, box.w * 2.0, box.h, st);
  g.restore();
}

/* ---- occupancy ---------------------------------------------------------- */
/* the cross-plan tie, asserted rather than assumed */
if (!theMill.has("fire_door")) throw new Error("[BF-15] the-mill lost fire_door");
export const carriedFromTheLaboratory = exitOccupancyBF14;

export const INITIAL = INITIAL_BF15;         // see the header: two plans, one leaf
export const MOVES   = MOVES_BF15;
export const exitOccupancy = occupancyAt(theMill, MOVES, 4, INITIAL);

export const SCENE_VERSION = "bf-motion/1.0.0";
