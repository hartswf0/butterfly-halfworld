/* ============================================================================
   BF-21 · THE TAPPING        INT. MILL · THE LOBBY FLOOR          the-mill

     "The canister clicks. All three hear it. The sound comes again, faint and
      exact. Not metal contracting. Something taps from inside, moving around
      the circumference at equal intervals."         — atlas/source.json
     NIKO: "Put it down."   NIKO: "That isn't possible."

   MOTION: CYCLE · 8 beats · 4.0s · 48 frames @12fps · loopClosed: TRUE.

   ---------------------------------------------------------------------------
   CLOSED, AND THE CLOSURE IS THE ARGUMENT.

   atlas/source.json authors this unit loop:true, and MOTION-BRIEF says what
   that has to mean: "closed: true returns exactly to its first state. That is a
   TRAP… Three units are authored loop:true. Every one is an apparatus, not a
   body. Check yours." This one is a tin. cycle(u, { beats: 8, closed: true })
   has wear 0 by construction, nothing in this file integrates, and frame 47's
   successor is frame 0 exactly.

   That is not a technicality. Whatever is inside the canister is alive, and the
   scene refuses to animate it as alive: we are outside a sealed container and
   all we get is a schedule. The living thing is BF-23, when the lid is off.

   ---------------------------------------------------------------------------
   THE RING IS AUTHORED ONCE, IN assets/set/_tapping.mjs.

   SCENE-BRIEF §6: BF-14's vial and BF-21's canister tap "around the
   circumference at equal intervals" on objects too small for a plan to hold a
   ring in — "those rings belong to you… they are the same figure twice and
   should rhyme."

   A world that authors brokenCircle() once and imports it five times does not
   then draw the same ring twice by hand. So the ring, the schedule, the mark a
   tap makes on a boundary and the recoil are in one file that both scenes
   import, and its header states the convention in full so BF-14 can match it:
   eight stations from the top, clockwise; present for the first 0.42 of each
   beat and absent for the rest; NEVER between two stations; the mark is on the
   WALL and nothing is drawn of the thing making it; the object recoils along
   the outward normal, also quantised. At 48 frames and 8 beats that is 2.5
   frames of contact and 3.5 of silence — "faint and exact".

   CLOSED BY ARITHMETIC, not by the drawing happening to come back:
   theta = ((index + shift) / 8 + phase0) * TAU, so after eight stations it is
   exactly TAU, which is exactly 0. Proved in node: at(0) and at(1) are
   identical.

   NOT EASED. MOTION-BRIEF names this as a punishable failure: "Smoothing the
   tapping… Equal intervals. Quantise it; do not ease it." advance()'s `shift`
   is exactly zero for three of every six frames and then slides in two; there
   is no frame in which the tap is at a position a viewer could call a curve.

   ---------------------------------------------------------------------------
   ALL THREE HEAR IT, AND NONE OF THEM IS IN THE FRAME.

   The unit's cast is three people and its subject is one palm-width object on a
   stone floor. Putting the three in the frame means either cropping them at the
   edges or shooting the tin at 40px, and both are forbidden. What is in the
   frame instead is their SHADOWS, lying across the stone from three bodies
   standing off the top of the frame — which is listening, drawn.

   The shadows do not move. In a closed cycle nothing may drift, and three
   people who have just heard something impossible do not shift their weight.

   COMPOSITION. One subject: something testing the inside of a sealed tin.
   ========================================================================= */
import { framesFor } from "../engine/motion.mjs";
import { INK, inkLevel, lerp } from "../engine/halfworld-engine.mjs";
import { occupancyAt } from "../engine/blocking.mjs";
import { theMill, MOVES_BF21 } from "./_plans/the-mill.mjs";
import { lens, NW, NH, propSize } from "../assets/set/_stage.mjs";
import { canister, rimOf, RIM_R } from "../assets/set/canister.mjs";
import { tapRing, ringStations } from "../assets/set/_tap-ring.mjs";
import { stoneFloor } from "../assets/set/mill.mjs";
import { LV } from "../assets/set/_kit.mjs";
import { exitOccupancy as exitOccupancyBF20 } from "./BF-20.mjs";

export const id         = "BF-21";
export const title      = "THE TAPPING";
export const place      = "INT. MILL · THE LOBBY FLOOR";
export const plan       = "the-mill";
export const motion     = "CYCLE";
export const beats      = 8;                                   // eight stations
export const seconds    = 4.0;
export const loopClosed = true;                                // it is a container
export const frames     = framesFor(motion, seconds, 12, beats);   // 48
export const declaredBreak = null;
export const breakAt    = null;

export const subject  = "something testing the inside of a sealed tin, at equal intervals";
export const distance = "CLOSE";
export const leftOut  = [
  "all three bodies — only their shadows are in the frame, which is what listening looks like",
  "the thing inside: this unit is outside a sealed container and stays outside",
  "Niko's two lines, which are the only sound in the unit and are not drawable",
];

/* ---- framing ------------------------------------------------------------ */
/* PASS 2: at 11 the tin was 28% of the frame width and the tap was 8px of bow
   on a 300px rim — eight identical contact cells. */
const ZOOM = 16.0;
const station = lens(theMill, { zoom: ZOOM, cx: 0.4982, cy: 0.8722 });
const TIN = station("lobby_floor_canister");
const R = propSize(TIN, 0.027);
const RIM = rimOf(TIN.x, TIN.y, R, RIM_R);
const RING_RX = RIM.rx, RING_RY = RIM.ry;

/* the ring, in scene space. Act I's five decisions, unchanged — see the header
   for the one number (dwell) that a consumer is asked to re-derive, and why the
   derivation gives the same answer here. */
const RING = { stations: 8, dwell: 0.50, strikeFrac: 0.34, phase0: -0.25 };

/* ============================================================ at(u) ========
   PURE, and quantised. advance()'s shift is zero for three frames in six. */
export function at(u, _ctx) {
  const r = tapRing(u, { ...RING, cx: TIN.x, cy: TIN.y, rx: RING_RX, ry: RING_RY });
  return { u, tap: r };
}

/* ============================================================ draw() ======= */
export function draw(g, W, H, s) {
  g.save();
  g.scale(W / NW, H / NH);
  g.lineJoin = "round"; g.lineCap = "round";

  /* ---- the stone floor, right up to the lens */
  stoneFloor(g, -20, NH + 20, -20, NW + 20, { seed: 21, courses: 3 });

  /* ---- three shadows, from three people standing off the top of the frame.
     Static: a closed cycle has no drift in it, anywhere. */
  shadows(g);

  /* ---- the tin, recoiling along the outward normal of the current station.
     Quantised: it moves while the contact tick is alive and not afterwards. A
     palm-width tin on stone moves when something inside it hits the wall; it
     does not wobble back. */
  const rec = 3 * s.tap.contact;
  const dx = Math.cos(s.tap.theta) * rec, dy = Math.sin(s.tap.theta) * rec * 0.5;
  canister(g, TIN.x + dx, TIN.y + dy, R, { tilt: 0, scales: 9, seed: 17 });

  /* ---- THE GLASS REMEMBERS (Act I's decision 5). A dent appears at each
     station as it is reached and they accumulate round the rim, then reset at
     the wrap because the loop is closed and it is the same tin it was. This is
     what makes "equal intervals" a measurement instead of a thing moving. */
  const stations = ringStations({ ...RING, cx: TIN.x + dx, cy: TIN.y + dy,
                                  rx: RING_RX, ry: RING_RY });
  g.save();
  g.strokeStyle = LV(5); g.lineWidth = Math.max(3, R * 0.024); g.lineCap = "round";
  stations.forEach((st, i) => {
    if (!s.tap.struck[i]) return;
    const nx = Math.cos(st.theta) / RING_RX, ny = Math.sin(st.theta) / RING_RY;
    const nl = Math.hypot(nx, ny) || 1;
    g.beginPath();
    g.moveTo(st.x, st.y);
    g.lineTo(st.x + (nx / nl) * R * 0.055, st.y + (ny / nl) * R * 0.055);
    g.stroke();
  });
  g.restore();

  /* ---- THE TAP ITSELF. On the wall. Nothing of what is making it. */
  if (s.tap.contact > 0) drawTap(g, s.tap, R);

  g.restore();
}

/* THE MARK ONE TAP MAKES ON A BOUNDARY, seen from outside it: the wall bows out
   along the outward normal, two stress ticks sit either side of the contact, and
   three ticks radiate from it. That last is borrowed knowingly — BF-01 draws the
   swallowtail's contact with the acrylic lid as ticks radiating along the
   underside, and a tap on the inside of a tin is the same event from the other
   side of the boundary. */
function drawTap(g, t, R) {
  const k = t.contact;
  let nx = Math.cos(t.theta) / RING_RX, ny = Math.sin(t.theta) / RING_RY;
  const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
  const tx = -ny, ty = nx;
  const bow = R * 0.115 * k, lw = Math.max(6, R * 0.055);
  const w = Math.max(9, Math.min(RING_RX, RING_RY) * 0.34);
  g.save();
  g.strokeStyle = INK; g.lineWidth = lw; g.lineCap = "round";
  g.beginPath();
  g.moveTo(t.x - tx * w, t.y - ty * w);
  g.quadraticCurveTo(t.x + nx * bow * 2, t.y + ny * bow * 2, t.x + tx * w, t.y + ty * w);
  g.stroke();
  g.lineWidth = lw * 0.62;
  g.beginPath();
  for (const sg of [-1, 1]) {
    const bx = t.x + tx * w * 1.5 * sg, by = t.y + ty * w * 1.5 * sg;
    g.moveTo(bx, by); g.lineTo(bx + nx * bow * 0.9, by + ny * bow * 0.9);
  }
  g.stroke();
  g.lineWidth = lw * 0.9;
  g.beginPath();
  for (const a of [-0.55, 0, 0.55]) {
    const ox = nx * Math.cos(a) - ny * Math.sin(a);
    const oy = nx * Math.sin(a) + ny * Math.cos(a);
    const sx = t.x + ox * bow * 1.6, sy = t.y + oy * bow * 1.6;
    g.moveTo(sx, sy); g.lineTo(sx + ox * bow * 2.6, sy + oy * bow * 2.6);
  }
  g.stroke();
  g.restore();
}

/* ---- what listening looks like ------------------------------------------
   Three long shadows across the stone, converging on the tin, from bodies that
   are not in the frame. Level 1: a noon shadow on pale stone is a value, not a
   hole. They are the only thing in the frame that is about people. */
function shadows(g) {
  const casts = [
    { x: TIN.x - R * 2.4, w: R * 1.9 },
    { x: TIN.x - R * 0.2, w: R * 1.6 },
    { x: TIN.x + R * 2.2, w: R * 2.0 },
  ];
  g.save();
  g.fillStyle = LV(2);
  for (const c of casts) {
    g.beginPath();
    g.moveTo(c.x - c.w / 2, -20);
    g.lineTo(c.x + c.w / 2, -20);
    g.lineTo(TIN.x + (c.x - TIN.x) * 0.24 + c.w * 0.22, TIN.y - R * 0.4);
    g.lineTo(TIN.x + (c.x - TIN.x) * 0.24 - c.w * 0.22, TIN.y - R * 0.4);
    g.closePath();
    g.fill();
  }
  g.strokeStyle = LV(4); g.lineWidth = 4;
  for (const c of casts) {
    g.beginPath();
    g.moveTo(c.x - c.w / 2, -20);
    g.lineTo(TIN.x + (c.x - TIN.x) * 0.24 - c.w * 0.22, TIN.y - R * 0.4);
    g.stroke();
  }
  g.restore();
}

/* ---- occupancy ----------------------------------------------------------
   The plan's own exit for this unit adds the canister as an occupant of
   lobby_floor_canister: she puts it down, and from here it is a thing standing
   on the floor rather than a thing in a hand. */
export const INITIAL = exitOccupancyBF20;
export const MOVES   = MOVES_BF21;
export const exitOccupancy = {
  ...occupancyAt(theMill, MOVES, 4, INITIAL),
  canister: "lobby_floor_canister",
};

export const SCENE_VERSION = "bf-motion/1.0.0";
