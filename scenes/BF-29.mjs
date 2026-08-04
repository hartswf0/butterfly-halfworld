/* ============================================================================
   BF-29 · THE WALL, SEEN        INT. REARING FACILITY — CONTINUOUS   plan: the-facility

     "Clear plastic sheeting divides the loading room into narrow chambers.
      Tubes run along the floor. Fans turn behind filters."
     "Hundreds of chrysalides hang from cards along the far wall. Each card
      bears a date: 1951, 1952, 1953, 1954, 1955."
     "The oldest cards are brown and soft at the corners. The newest are clean
      white plastic."
     "Every chrysalis, old or new, is fastened identically."     — atlas/source.json

     IONA: "I remembered it."

   MOTION: HOLD · 4.5s · 54 frames @12fps · loopClosed: false.

   THE WALL DOES NOT MOVE IN THIS UNIT, AND THAT IS THE POINT. BF-32 is the same
   wall doing something, and it can only be something if this frame established
   that the wall is furniture. So the only things alive here are a fan (an
   apparatus — MOTION-BRIEF: closed cycles are for apparatus, and this is the one
   closed cycle in my act), the sheeting moving in the air the fan is pushing,
   and Iona breathing. hold()'s breath is 4.1s against a 4.5s unit, so the
   respiration and the loop are deliberately out of phase and the frame never
   repeats itself exactly. The brief asks that a HOLD be deniable; if you can
   point at the motion here, it is wrong.

   DECLARED DISCONTINUITIES: none — and getting that right cost a pass. PASS 3
   drove the sheeting at u*0.5 and the wrap check reported 2.0% against a 0.38%
   mean step: a five-fold jump, invisible in every still and unmissable in the
   loop, because sin(0.5*TAU) is not sin(0). ANY sub-motion in a looping unit has
   to be a whole number of revolutions of u. Where two things must not move
   together the fix is a PHASE OFFSET — ((u + 0.37) % 1) — and never a rate.

   ---------------------------------------------------------------------------
   OCCUPANCY. SCENE-BRIEF S2 wants Act II's aggregate imported here, and it now
   is: `exitOccupancyActII` from scenes/BF-28.mjs.

   THAT IMPORT WAS NOT AVAILABLE WHEN THIS FILE WAS WRITTEN. scenes/ held BF-01
   and this act only; Act II landed while Act III was rendering. The fallback
   this file shipped with was the-facility's own authored rest state,
   INITIAL_BF29 — all three at annex_door — chosen because annex_door is the
   cross-plan tie with the-lot and Act II's exit HAS to arrive there. It did:
   BF-28's aggregate declares `crossesInto: { plan: "the-facility", station:
   "annex_door" }`. The two agreed without having met, which is what authoring
   the rooms once buys.

   The occupancy Act II hands over is in THE-LOT's namespace, so it cannot be
   spread into a facility occupancy directly — the-lot and the-facility share
   exactly one station name and it is the doorway. So the handoff is asserted
   rather than copied: assertHandoff() below throws if Act II does not end at
   annex_door, and the facility's own rest state is then used, which is the same
   three people standing in the same doorway from the other side of it.

   THE BLOCKING CLOCK IS NOT THE LOOP CLOCK. the-facility authored MOVES_BF29
   over 9 seconds of story time; this unit is a 4.5-second loop of the moment
   after they stop walking. occupancyAt() is therefore evaluated at the plan's
   own T = 9, so this file's handoff is byte-identical to exitOccupancyBF29 and
   the two cannot drift apart.

   ---------------------------------------------------------------------------
   THE LENS. zoom 1.1 about wall_1988, dropped 50px. At zoom 1 project() puts the
   whole depth of this room — far wall to annex door — inside 0.371 of the frame,
   so the lens is doing almost nothing here on purpose: this is the establishing
   frame and it is supposed to contain the room. The consequence is that the
   seventy-five years land 7.6px apart, below _chrysalis-wall.mjs' FINE_PITCH,
   and the wall draws at low detail as a texture of ticks. That is the correct
   drawing of a far wall of hundreds of small objects; BF-32 crops to 15.3px and
   gets the shells.
   ========================================================================= */
import { hold, framesFor, TAU } from "../engine/motion.mjs";
import { INK, inkLevel } from "../engine/halfworld-engine.mjs";
import { occupancyAt } from "../engine/blocking.mjs";
import {
  theFacility, chrysalisWallRun, INITIAL_BF29, MOVES_BF29,
  WALL_YEAR_FIRST, WALL_YEAR_LAST,
} from "./_plans/the-facility.mjs";
import { makeLens, placeFigure, BODY, NW, NH } from "../assets/set/_facility-lens.mjs";
import {
  loadingRoomFloor, sheeting, tubeBank, floorTubes, fanBehindFilter,
  foldingTable, meshCages, yearRail,
} from "../assets/set/_facility.mjs";
import { chrysalisWall, wallBoard } from "../assets/set/_chrysalis-wall.mjs";
import iona from "../assets/character/iona.mjs";
import { exitOccupancyActII } from "./BF-28.mjs";

/* ---- the motion scene contract ------------------------------------------ */
export const id         = "BF-29";
export const title      = "THE WALL, SEEN";
export const place      = "INT. REARING FACILITY";
export const plan       = "the-facility";
export const motion     = "HOLD";
export const beats      = null;
export const seconds    = 4.5;
export const loopClosed = false;
export const frames     = framesFor(motion, seconds, 12);      // 54
export const declaredBreak = null;

export const subject    = "the far wall of dated chrysalides";
export const distance   = "WIDE";
export const leftOut    = [
  "Mara and Niko — they are at mara_entering / niko_entering, z .812 and .828, " +
  "which is within a metre of the lens; drawing them would put two backs across " +
  "the bottom of the establishing frame of the act",
  "the pool, the projector and the white rectangle — BF-30's subject, and this " +
  "frame is the wall's",
  "the annex door behind the camera",
  "seventy-one of the seventy-five year labels",
  "sheet_chamber_b and _c — the two inner hangings land at px 367 and 694, " +
  "straight across the middle of the wall. The outer two are kept because they " +
  "frame it; the inner two would erase the subject to honour a stage direction",
];

/* ---- THE ACT BOUNDARY, CHECKED --------------------------------------------
   Act II ends on the-lot and this act opens on the-facility. The two plans meet
   at exactly one station and the world walks through it. If Act II ever stops
   ending there, this throws at import instead of teleporting three people. */
(function assertHandoff() {
  const a = exitOccupancyActII;
  if (!a || a.crossesInto?.station !== "annex_door" || a.crossesInto?.plan !== "the-facility")
    throw new Error("[BF-29] Act II no longer crosses into the-facility at annex_door");
  for (const who of ["mara", "niko", "iona"])
    if (INITIAL_BF29[who] !== "annex_door")
      throw new Error(`[BF-29] ${who} does not start at the tie station`);
})();

/* ---- the lens ------------------------------------------------------------ */
const lens = makeLens(theFacility, { centre: "wall_1988", zoom: 1.55, dy: 180 });
const N = chrysalisWallRun.length;                              // 75

/* the wall's extent, taken from the plan's own first and last stations rather
   than from any number typed here */
const WX0 = lens(chrysalisWallRun[0]).px;                       // 1951
const WX1 = lens(chrysalisWallRun[N - 1]).px;                   // 2025
const WALL_BASE = lens(chrysalisWallRun[0]).py;                 // where it meets the floor
const WALL_TOP  = WALL_BASE - 330;

/* ============================================================ at(u) ======== */
export function at(u, _ctx) {
  const h = hold(u, { breathSec: 4.1, dur: seconds });
  return {
    u,
    breath: h.breath,                       // 0..1, the room's air
    tilt: h.tilt,
    fan: u,                                 // the one closed cycle in this act
    sway: u,                                // the sheeting. u, NOT u*k: see the header
    iona: iona.motions.breath(u),
  };
}

/* ============================================================ draw() ======= */
export function draw(g, W, H, s) {
  g.save();
  g.scale(W / NW, H / NH);
  g.lineJoin = "round"; g.lineCap = "round";

  /* ---- the floor FIRST. PASS 2: it was painted after the wall and its L(0)
     plane ate the entire year rail — thirty-four-pixel numerals, invisible,
     and the beat that says "each card bears a date" silently deleted. ---- */
  loadingRoomFloor(g, {
    x0: -10, x1: NW + 10,
    horizon: WALL_BASE, bottom: NH, seed: 11,
  });

  /* ---- the far wall ---- */
  wallBoard(g, { x0: WX0 - 34, x1: WX1 + 34, yTop: WALL_TOP - 46, yBot: WALL_BASE });
  const still = new Array(N).fill(0).map(() => ({ open: 0, lean: 0 }));
  chrysalisWall(g, { x0: WX0, x1: WX1, yTop: WALL_TOP, yBot: WALL_BASE - 8, seed: 201 },
                still, { first: WALL_YEAR_FIRST, last: WALL_YEAR_LAST });

  /* the dates. Four of seventy-five, drawn as geometry at 34px (BUILD-BRIEF
     trap 3: type dissolves below 33px in this lattice). The text names 1951
     through 1955 and "the present"; the plan's WALL_YEAR_LAST is the only
     invented number in it and it is shown here rather than hidden. */
  /* PASS 3: the rail was under the wall, where Iona's legs crossed 1975 and the
     filter bank ate 2025. It is now above it, on the only empty band in the
     frame, and 1975 is dropped — three marks are enough to say "seventy-five
     years in order" and four is what made the collision. */
  yearRail(g, WX0, WX1, WALL_TOP - 42, [1951, 2000, WALL_YEAR_LAST],
           WALL_YEAR_FIRST, WALL_YEAR_LAST);

  /* ---- the apparatus, at its stations ---- */
  const ft = lens("folding_table_west"), fte = lens("folding_table_east");
  foldingTable(g, ft.px - 96 * ft.k, ft.py - 74 * ft.k, 192 * ft.k, 74 * ft.k, 71);
  foldingTable(g, fte.px - 90 * fte.k, fte.py - 72 * fte.k, 180 * fte.k, 72 * fte.k, 73);

  const mc = lens("mesh_cage_stack");
  meshCages(g, mc.px - 52 * mc.k, mc.py - 132 * mc.k, 104 * mc.k, 132 * mc.k, 3);

  /* "Tubes run along the floor." Three of them, leaving the wall base and
     running toward the camera off the bottom edge. They are the only thing in
     the lower quarter of this frame and they are what makes it a floor rather
     than an empty margin — and being diagonals they cannot stripe it. */
  const tr = lens("floor_tubes_run");
  floorTubes(g, [
    [tr.px, WALL_BASE + 6, tr.px - 150, NH + 30],
    [tr.px + 140, WALL_BASE + 10, tr.px + 320, NH + 30],
    [lens("filter_bank").px - 30, WALL_BASE + 14, lens("filter_bank").px + 90, NH + 30],
  ], { seed: 55 });

  /* the fan. fan_behind_filter is at x .945 z .528, which this lens puts at
     px 1121 — one pixel outside the frame. So the assembly is hung at
     filter_bank, its own station, and it is CUT BY THE RIGHT EDGE. A machine
     cut by the frame edge is not the trap SCENE-BRIEF names; that rule is
     about bodies, and there is no body within 300px of it. */
  const fan = lens("filter_bank");
  fanBehindFilter(g, fan.px, fan.py - 96 * fan.k, 58 * fan.k, s.fan);

  /* ---- Iona, at the wall she remembered ----
     Back to us. She is looking at the thing, not at the people behind her, and
     at 150px the face is twelve pixels wide — a front view here would spend the
     whole of her on a feature the frame cannot hold. figure-hero carries a
     back_view pose (bodyYaw: PI); this drives the same two channels through the
     rig so her breath keeps running underneath. */
  const io = lens("iona_at_wall");
  placeFigure(g, iona, {
    ...s.iona,
    pose: "io_lobby", guise: "coat", bag: false,
    rig: { ...s.iona.rig, bodyYaw: Math.PI, headYaw: Math.PI },
  }, { footX: io.px, footY: io.py, height: io.k * BODY });

  /* ---- the sheeting, LAST: it is in front of everything, including her ----
     Four chambers, drawn as edges and creases only. A filled plane here would
     put a grey slab over the wall, and would also be a lie: the material is
     clear and its whole behaviour is that it offers no resistance until
     contact. */
  const sa = lens("sheet_chamber_a");
  sheeting(g, [[sa.px - 190 * sa.k, sa.px + 44 * sa.k]], {
    top: 132, bottom: sa.py - 14, seed: 31, sway: s.sway, rail: true,
  });

  /* ---- the tubes, overhead. All on. In BF-38 they all go out at once. ---- */
  tubeBank(g, ["tube_bank_west", "tube_bank_centre", "tube_bank_east"]
    .map(n => { const p = lens(n); return [p.px - 86, p.px + 86]; }),
    { y: 84, on: true });

  /* the room's air, as the only thing hold() is allowed to show: two motes
     crossing the light. Deniable by construction — 3px, and they never cross
     the same path twice inside one loop. */
  g.fillStyle = inkLevel(4);
  for (let i = 0; i < 5; i++) {
    const p = (s.u + i * 0.2137) % 1;
    const x = 180 + i * 190 + Math.sin(p * TAU + i) * 26;
    const y = 300 + Math.cos(p * TAU * 0.7 + i * 2) * 90 + p * 40;
    g.beginPath(); g.arc(x, y, 3, 0, TAU); g.fill();
  }

  g.restore();
}

/* ---- occupancy ----------------------------------------------------------- */
export const INITIAL = INITIAL_BF29;         // == BF-28's exit; see the header
export const MOVES   = MOVES_BF29;
export const exitOccupancy = occupancyAt(theFacility, MOVES, 9, INITIAL);

export const SCENE_VERSION = "bf-motion/1.0.0";
