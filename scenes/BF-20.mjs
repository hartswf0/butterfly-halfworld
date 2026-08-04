/* ============================================================================
   BF-20 · ROWS OF SEATED PEOPLE    INT. MILL · THE GLASS DOOR      the-mill

     "Through the glass the street stands white in the noon heat. A bus passes.
      For an instant its windows reflect the mill's brick façade, and the lobby
      appeared occupied by rows of seated people moving backward."
                                                          — atlas/source.json

   MOTION: TRANSFER · 3.5s · 42 frames @12fps.

   ---------------------------------------------------------------------------
   WHY THIS IS A TRANSFER: AN IMAGE CROSSES ONTO A SURFACE.

   transfer() is "discrete carriers crossing between two surfaces". Here the
   carriers are seven seated figures, surface A is the band of windows on the
   passing bus, and surface B is the glass of the mill's entrance. Nothing
   fades: each figure is on the bus, in flight, or on the glass, and its ink
   peaks at the midpoint of the crossing, which is the one moment the reflection
   is brighter than either surface it belongs to.

   AND THEY ARE ON THE GLASS, NOT BEHIND IT. the-mill's fixture note:
   "The seats are ON the glass, not behind it, for the same reason the city is
   in the laboratory's window rather than beyond it." So they are drawn AFTER
   the glazing, over its mullions, and the bus keeps its own windows underneath.

   ---------------------------------------------------------------------------
   BACKWARD IS AN ORDER, NOT A DIRECTION OF TRAVEL.

   `reflectedSeatRow` is declared axis x, dir -1, "listed in the order the eye
   receives them, right to left, because that is the direction the reflection
   travels while the bus goes the other way… An unordered band cannot move
   backward." Two things follow, and both are in the code:

     1. The bus travels LEFT TO RIGHT and the reflected people travel RIGHT TO
        LEFT, on the same glass, in the same frames. That opposition is the
        whole sentence.
     2. The ORDER of arrival is reflect_seat_7 first and reflect_seat_1 last.
        transfer() hands out random start times from its seed; those starts are
        SORTED and then assigned to the row in its declared order, so the
        stagger is transfer()'s and the sequence is the plan's. Neither is
        invented here.

   FOR AN INSTANT. The reflection lives inside u ∈ [0.30, 0.62] — ten frames of
   forty-two. Before and after, the lobby is empty and the street is white, and
   nobody in the lobby turns around.

   DECLARED DISCONTINUITIES: none. The window has hard edges in TIME, but the
   carriers cross them continuously — a figure is never half-present, it is
   somewhere along its own crossing, and the crossings are staggered.

   COMPOSITION. One subject: rows of seated people, moving backward, on glass.
   ========================================================================= */
import { transfer, framesFor, clamp01 } from "../engine/motion.mjs";
import { INK, inkLevel, lerp, smooth } from "../engine/halfworld-engine.mjs";
import { occupancyAt } from "../engine/blocking.mjs";
import { theMill, reflectedSeatRow } from "./_plans/the-mill.mjs";
import { lens, NW, NH, BODY_H } from "../assets/set/_stage.mjs";
import { glassDoor, busSlab, stoneFloor, lobbyWall } from "../assets/set/mill.mjs";
import { LV, brokenLine } from "../assets/set/_kit.mjs";
import { exitOccupancy as exitOccupancyBF19 } from "./BF-19.mjs";

export const id         = "BF-20";
export const title      = "ROWS OF SEATED PEOPLE";
export const place      = "INT. MILL · THE GLASS DOOR";
export const plan       = "the-mill";
export const motion     = "TRANSFER";
export const beats      = null;
export const seconds    = 3.5;
export const loopClosed = false;
export const frames     = framesFor(motion, seconds, 12);      // 42
export const declaredBreak = null;
export const breakAt    = null;

export const subject  = "rows of seated people moving backward across the glass";
export const distance = "MEDIUM";
export const leftOut  = [
  "Mara, Niko and Iona — the plan says nobody in the lobby turns around, so nobody is drawn turning",
  "the street itself: it 'stands white in the noon heat', which in this world means it has no ink in it",
  "the brick facade being reflected — what we see is what the reflection makes of the lobby, not the wall",
];

/* ---- framing ------------------------------------------------------------ */
const ZOOM   = 1.82;
const BODY_K = 0.42;
const station = lens(theMill, { zoom: ZOOM, cx: 0.5000, cy: 0.6809 });
const DOOR = station("entrance_door_glass");
const SEATS = reflectedSeatRow.map((n) => station(n));   // seat_7 .. seat_1
const BUS  = station("bus_passing");
const FAR  = station("lobby_far");
const bodyH = (p) => BODY_H * p.scale * BODY_K;

const STAND = bodyH(DOOR);
/* PASS 2: the margins were 0.62 of a body height either side, which put the
   glazing at x -103 .. 1204 — edge to edge, so the shopfront had no room around
   it and read as a black grid filling the picture. 0.12 leaves paper. */
const GLAZE = { h: STAND * 1.30, baseY: DOOR.y, x0: SEATS[6].x - STAND * 0.12, x1: SEATS[0].x + STAND * 0.12 };
const SEAT_H = STAND * 0.60;

/* THE WINDOW. "For an instant." */
const U0 = 0.30, U1 = 0.62;
/* the bus crosses wider than the reflection lasts: it arrives before the
   reflection and leaves after it */
const B0 = 0.16, B1 = 0.76;

/* ============================================================ at(u) ======== */
export function at(u, _ctx) {
  // local time inside the instant, so the seven crossings all fit in the window
  const w = clamp01((u - U0) / (U1 - U0));
  const car = transfer(w, SEATS.length, { stagger: 0.62, seed: 2011 });
  // sort the carriers by their own start time, then deal them out along the row
  const byStart = car.map((c, i) => ({ c, i }))
    .sort((p, q) => (q.c.k - p.c.k) || (p.i - q.i));        // earliest start = largest k
  const seats = SEATS.map(() => null);
  byStart.forEach((e, rank) => { seats[rank] = e.c; });     // rank 0 -> seat_7
  return {
    u,
    on: u >= U0 && u <= U1,
    w,
    seats,
    // the bus: left to right, across the glazing, on its own clock
    bus: clamp01((u - B0) / (B1 - B0)),
    busOn: u >= B0 && u <= B1,
  };
}

/* ============================================================ draw() ======= */
export function draw(g, W, H, s) {
  g.save();
  g.scale(W / NW, H / NH);
  g.lineJoin = "round"; g.lineCap = "round";

  /* ---- the lobby, behind and around the glazing */
  lobbyWall(g, -20, NW + 20, -180, FAR.y, { seed: 44, columns: [0.08, 0.93] });
  stoneFloor(g, FAR.y, NH + 20, -20, NW + 20, { seed: 21, courses: 4 });

  /* ---- THE GLAZED ENTRANCE. The street stands white: the glass is paper.
     PASS 2 BUG: the bus was drawn first and glassDoor then filled every leaf
     with #ffffff on top of it, so a bus crossed the whole loop and was never in
     a single frame. The glazing goes down first with its glass field, and
     everything outside is drawn after it, clipped to the opening. */
  glassDoor(g, GLAZE.x0, GLAZE.baseY - GLAZE.h, GLAZE.x1 - GLAZE.x0, GLAZE.h,
    { crash: true, street: 1, seed: 33, leaves: 3 });

  /* ---- the bus, OUTSIDE, seen through it. Clipped to the opening, so it is a
     thing passing in the street and not a thing in the room. */
  g.save();
  g.beginPath();
  g.rect(GLAZE.x0 + 10, GLAZE.baseY - GLAZE.h + 10, GLAZE.x1 - GLAZE.x0 - 20, GLAZE.h - 20);
  g.clip();
  if (s.busOn) {
    const bw = (GLAZE.x1 - GLAZE.x0) * 1.15, bh = GLAZE.h * 0.52;
    const bx = lerp(GLAZE.x0 - bw, GLAZE.x1, s.bus);
    busSlab(g, bx, GLAZE.baseY - GLAZE.h * 0.82, bw, bh, { seed: 55, windows: 7 });
  }
  g.restore();

  /* ---- THE REFLECTION, ON the glass. Right to left, against the bus. */
  if (s.on) {
    g.save();
    g.beginPath();
    g.rect(GLAZE.x0, GLAZE.baseY - GLAZE.h, GLAZE.x1 - GLAZE.x0, GLAZE.h);
    g.clip();
    SEATS.forEach((p, rank) => {
      const c = s.seats[rank];
      if (!c || c.at === "source") return;
      /* BACKWARD. The bus goes one way and this goes the other, on one surface.
         The travel is one seat pitch: they are a row sliding through itself, not
         a crowd walking. */
      const pitch = Math.abs(SEATS[0].x - SEATS[1].x);
      const x = p.x + (1 - c.k) * pitch * 1.6;
      const level = c.ink > 1.62 ? 5 : c.ink > 1.30 ? 4 : 2;
      seated(g, x, GLAZE.baseY - GLAZE.h * 0.16, SEAT_H, level, rank);
    });
    g.restore();
  }

  g.restore();
}

/* A SEATED PERSON, as a reflection: a silhouette and nothing else. A reflection
   in a bus window at noon has no face in it, and giving it one would make seven
   characters this episode does not have. */
function seated(g, x, baseY, h, level, i) {
  const w = h * 0.46;
  g.save();
  g.fillStyle = inkLevel(level);
  g.strokeStyle = INK; g.lineWidth = 3;
  /* SEATED, not standing. PASS 2: a rectangle with a round head on it reads as
     a person on their feet, and seven of them read as a queue. What makes a
     seated figure is the KNEE — the silhouette turns a right angle at the lap
     and comes forward. The row is a row of thighs, torsos and heads. */
  /* an L: a torso block sitting on a thigh block. PASS 3 — the quadratic
     shoulder and the two knee returns of pass 2 pinched at the waist and every
     figure printed as a goblet. A seated body at 60px is two rectangles. */
  g.beginPath();
  g.rect(x - w * 0.36, baseY - h * 0.68, w * 0.72, h * 0.46);
  g.fill(); g.stroke();
  g.beginPath();
  g.rect(x - w * 0.50, baseY - h * 0.24, w * 0.98, h * 0.24);
  g.fill(); g.stroke();
  g.beginPath();
  g.ellipse(x + (i % 2 ? 1 : -1) * w * 0.05, baseY - h * 0.82, w * 0.24, h * 0.14, 0, 0, Math.PI * 2);
  g.fill(); g.stroke();
  g.restore();
}

/* ---- occupancy ----------------------------------------------------------
   The plan authors no blocking for this unit: a bus passes and nobody in the
   lobby turns around, so no foot crosses any ground. MOVES is empty and the
   occupancy passes through unchanged, which is the correct statement. */
export const INITIAL = exitOccupancyBF19;
export const MOVES   = [];
export const exitOccupancy = occupancyAt(theMill, MOVES, 4, INITIAL);

export const SCENE_VERSION = "bf-motion/1.0.0";
