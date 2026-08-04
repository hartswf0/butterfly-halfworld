/* ============================================================================
   BF-30 · A WHITE RECTANGLE WAITS   INT. REARING FACILITY · THE TILED POOL
                                                                 plan: the-facility

     "A shallow tiled pool at the centre. Lavender grows in galvanized troughs
      around its edge."
     "A projector stands on a wheeled cart. Its power light is on. Opposite, a
      white rectangle waits."                                — atlas/source.json

     NIKO: "Someone has been running experiments here."  "How many?"
     IONA: "Enough to keep it from becoming evidence."

   MOTION: HOLD · 5.0s · 60 frames @12fps · loopClosed: false.

   THE PROJECTOR IS ON AND THE PROJECTOR IS NOT RUNNING. The text is precise:
   "Its power light is on" — not its lamp. So there is NO BEAM in this unit. The
   beam arrives in BF-33 and it arrives because nothing threaded the film, and if
   it were already crossing the room here that reversal would cost nothing.
   The power light is drawn as one hard ink dot and it does not blink; a blinking
   standby light would be an invention, and a small one that happens to be the
   only thing in the frame the eye can find.

   THE RECTANGLE IS A THING, NOT AN ABSENCE. It waits for four units before
   anything is on it, so it is drawn as a hung sheet with a rail, two drops and a
   weighted hem — an object in a room — and the fact that it is blank is then
   something it is DOING rather than something that has not happened yet.

   LAVENDER. BUILD-BRIEF S1: it is a smell and must never be drawn purple. There
   is no colour in this file. What makes the troughs lavender rather than grass
   is the shape — a bare stem for two thirds of its height and a short dense head
   — and the fact that all the heads are at one level, which is what a planted
   trough looks like and a weed patch does not.

   DECLARED DISCONTINUITIES: none.

   ---------------------------------------------------------------------------
   THE LENS. zoom 1.35 about pool_centre, dropped 220px. The plan puts the
   projector at x .848 and the screen at x .088 — deliberately at opposite ends,
   "so the wall and the projection can happen simultaneously" — which means at any
   zoom that holds both, both are near a frame edge. 1.35 is the largest zoom at
   which the cart's near wheel and the screen's left hem are still inside the
   picture. Anything tighter and the act's two machines start being cropped.
   ========================================================================= */
import { hold, framesFor, TAU } from "../engine/motion.mjs";
import { inkLevel } from "../engine/halfworld-engine.mjs";
import { occupancyAt } from "../engine/blocking.mjs";
import {
  theFacility, chrysalisWallRun, MOVES_BF30,
  WALL_YEAR_FIRST, WALL_YEAR_LAST,
} from "./_plans/the-facility.mjs";
import { makeLens, placeFigure, BODY, NW, NH } from "../assets/set/_facility-lens.mjs";
import {
  loadingRoomFloor, tubeBank, trough, tiledPool, projectorCart, screenRect,
  foldingTable, meshCages, sheeting,
} from "../assets/set/_facility.mjs";
import { chrysalisWall, wallBoard } from "../assets/set/_chrysalis-wall.mjs";
import mara from "../assets/character/mara.mjs";
import niko from "../assets/character/niko.mjs";
import { exitOccupancy as INITIAL_FROM_BF29 } from "./BF-29.mjs";

/* ---- the motion scene contract ------------------------------------------ */
export const id         = "BF-30";
export const title      = "A WHITE RECTANGLE WAITS";
export const place      = "INT. REARING FACILITY · THE TILED POOL";
export const plan       = "the-facility";
export const motion     = "HOLD";
export const beats      = null;
export const seconds    = 5.0;
export const loopClosed = false;
export const frames     = framesFor(motion, seconds, 12);      // 60
export const declaredBreak = null;

export const subject    = "the white rectangle that waits";
export const distance   = "WIDE";
export const leftOut    = [
  "Iona — she is at iona_at_wall, behind the pool and to the left, and putting a " +
  "third body in a frame whose subject is an empty rectangle would make the " +
  "rectangle the fourth thing in it",
  "the beam. The lamp is not lit in this unit and will not be until BF-33",
  "the fans and the filter bank, outside the frame at this zoom",
  "the year labels — this is not the wall's unit",
  "trough_south. It is at z .622, nearer than the pool's own near lip, so drawn " +
  "at its station it stands in front of the pool and hides the thing it is " +
  "supposed to be around. Three of the four troughs say 'around its edge'",
];

/* ---- the lens ------------------------------------------------------------ */
const lens = makeLens(theFacility, { centre: "pool_centre", zoom: 1.35, dy: 260 });
const N = chrysalisWallRun.length;
const WX0 = lens(chrysalisWallRun[0]).px, WX1 = lens(chrysalisWallRun[N - 1]).px;
const WALL_BASE = lens(chrysalisWallRun[0]).py;

const P_N = lens("pool_edge_north"), P_S = lens("pool_edge_south");
const P_W = lens("pool_edge_west"),  P_E = lens("pool_edge_east");
const SCREEN = lens("screen_waiting"), CART = lens("projector_cart");

/* ============================================================ at(u) ======== */
export function at(u, _ctx) {
  const h = hold(u, { breathSec: 4.1, dur: seconds });
  /* EVERY SUB-MOTION IS A WHOLE REVOLUTION OF u. The first pass drove the
     troughs at u*0.62 and Niko's breath at u*1.19 to keep them from moving
     together, and the renderer's wrap check came back at 2.0127% against a
     0.3843% mean step — ratio 5.2, a hard jump once per loop that no still
     could show. Desynchronisation is a PHASE OFFSET, never a rate. */
  return {
    u,
    ripple: u,                              // the water's surface
    sway: (u + 0.31) % 1,                   // the troughs, offset from the water
    weight: h.weight,
    mara: mara.motions.breath(u),
    niko: niko.motions.breath((u + 0.37) % 1),   // two people never breathe together
  };
}

/* ============================================================ draw() ======= */
export function draw(g, W, H, s) {
  g.save();
  g.scale(W / NW, H / NH);
  g.lineJoin = "round"; g.lineCap = "round";

  loadingRoomFloor(g, { x0: -10, x1: NW + 10, horizon: WALL_BASE, bottom: NH, seed: 13 });

  /* the wall, in the far background and out of focus in the only sense this
     world has one: at 8.7px of pitch it is at fine detail, a texture rather
     than an inventory. It is BF-32's subject, not this one's. */
  wallBoard(g, { x0: WX0 - 30, x1: WX1 + 30, yTop: WALL_BASE - 210, yBot: WALL_BASE });
  chrysalisWall(g, { x0: WX0, x1: WX1, yTop: WALL_BASE - 194, yBot: WALL_BASE - 6, seed: 201 },
                new Array(N).fill(0).map(() => ({ open: 0, lean: 0 })),
                { first: WALL_YEAR_FIRST, last: WALL_YEAR_LAST });

  /* the far apparatus */
  const ft = lens("folding_table_west");
  foldingTable(g, ft.px - 88 * ft.k, ft.py - 66 * ft.k, 176 * ft.k, 66 * ft.k, 71);
  const mc = lens("mesh_cage_stack");
  meshCages(g, mc.px - 46 * mc.k, mc.py - 118 * mc.k, 92 * mc.k, 118 * mc.k, 3);

  /* ---- the troughs, far side first ----
     PASS 2: these were drawn 187px wide with seventeen stems each, i.e. wider
     than the pool they are supposed to be around and dense enough that four
     troughs of them printed as one scribble across the middle of the frame.
     They are now NARROWER THAN THE POOL and nine stems each, and the north one
     sits behind the far lip instead of on it. */
  const tN = lens("trough_north");
  trough(g, tN.px - 55 * tN.k, tN.py - 20 * tN.k - 16, 110 * tN.k, 20 * tN.k,
         { seed: 91, sway: s.sway, stems: 9, tall: 44 * tN.k });

  /* ---- the pool ----
     Its four edges come from the plan's four edge stations, so the shape is the
     room's and not a rectangle chosen here. Shallow: the tile grid is drawn on
     its FLOOR, through the water, because you can see the bottom of it. */
  tiledPool(g, {
    cx: (P_W.px + P_E.px) / 2,
    farY: P_N.py, nearY: P_S.py,
    farW: (P_E.px - P_W.px) * 0.86, nearW: (P_E.px - P_W.px) * 1.20,
    ripple: s.ripple, level: 2, seed: 101,
  });

  const tW = lens("trough_west"), tE = lens("trough_east");
  trough(g, tW.px - 44 * tW.k, tW.py - 20 * tW.k, 88 * tW.k, 20 * tW.k,
         { seed: 93, sway: (s.sway + 0.31) % 1, stems: 7, tall: 48 * tW.k });
  trough(g, tE.px - 44 * tE.k, tE.py - 20 * tE.k, 88 * tE.k, 20 * tE.k,
         { seed: 95, sway: (s.sway + 0.62) % 1, stems: 7, tall: 48 * tE.k });

  /* ---- the white rectangle. It is at z .492, so it is drawn before anything
     nearer than that: Mara is in front of it.

     IT HAS TO BE THE WHITEST THING IN THE FRAME, and in a world whose field is
     already cream that is not free. So the far-left corner of the room gets a
     light L(1) panel and the rectangle is PAPER on it. Without the panel the
     screen was a big outlined box on the same value as everything else and read
     as a doorway. */
  const swid = 232, shgt = 232;
  g.fillStyle = inkLevel(1);
  g.fillRect(SCREEN.px - swid / 2 - 62, SCREEN.py - shgt - 54, swid + 124, shgt + 62);
  screenRect(g, SCREEN.px - swid / 2, SCREEN.py - shgt, swid, shgt, { sag: 7 });

  /* ---- the projector, facing it across the room. Power on, lamp off. ---- */
  projectorCart(g, CART.px, CART.py - 104 * 0.85, 0.85,
                { on: false, power: true, spin: 0, threaded: false });

  /* ---- the two of them ----
     Mara at the pool's south edge with her back to us, already facing the wall
     and the rectangle — the geometry the rest of the act is built on (the plan's
     `sightline_mara_to_the_wall`). Niko at the switch, turned toward the machine.
     Separated in depth by 0.006 of plan z and 411px of frame, which is the
     "separate overlapping figures in depth" rule paid in full.

     MARA IS NUDGED 95px LEFT ALONG HER OWN EDGE, and that is declared.
     pool_edge_south is x .480 and pool_centre is x .478: standing exactly at her
     station she is dead in front of the pool and her body covers the whole of
     it. The plan fixes which EDGE she stands at; where along that edge is the
     scene's business, and 95px is 0.06 of plan x. */
  const mp = lens("pool_edge_south");
  placeFigure(g, mara, {
    ...s.mara, pose: "mv_sleeves", guise: "bare", box: false,
    rig: { ...s.mara.rig, bodyYaw: Math.PI, headYaw: Math.PI },
  }, { footX: mp.px - 95, footY: mp.py, height: mp.k * BODY });

  /* NIKO HAS NO CUP. BF-25 broke it — "the orange cup breaks without drama,
     pieces sliding apart over the stone" — five units before this one, so his
     guise here is `empty` and both hands are free. The first pass gave him the
     cup out of habit and put a prop back in his hand that the story had already
     taken off him. */
  const np = lens("projector_switch");
  placeFigure(g, niko, {
    ...s.niko, pose: "nk_procedural", guise: "empty", cup: false,
    gaze: { x: .34, y: .18 },
    rig: { ...s.niko.rig, bodyYaw: 0.7, headYaw: 0.5 },
  }, { footX: np.px - 96, footY: np.py, height: np.k * BODY });

  /* ---- overhead ---- */
  tubeBank(g, ["tube_bank_west", "tube_bank_centre", "tube_bank_east"]
    .map(n => { const p = lens(n); return [p.px - 78, p.px + 78]; }),
    { y: 74, on: true });

  const sa = lens("sheet_chamber_a");
  sheeting(g, [[sa.px - 170 * sa.k, sa.px + 30 * sa.k]],
           { top: 108, bottom: sa.py - 12, seed: 31, sway: s.sway, rail: true });

  /* the room's air. Five motes, 3px, on paths that do not repeat inside one
     loop — the whole visible content of a HOLD, and it should be deniable. */
  g.fillStyle = inkLevel(4);
  for (let i = 0; i < 5; i++) {
    const p = (s.u + i * 0.2137) % 1;
    const x = 240 + i * 170 + Math.sin(p * TAU + i) * 30;
    const y = 250 + Math.cos(p * TAU * 0.7 + i * 2) * 80 + p * 44;
    g.beginPath(); g.arc(x, y, 3, 0, TAU); g.fill();
  }

  g.restore();
}

/* ---- occupancy ----------------------------------------------------------- */
export const INITIAL = INITIAL_FROM_BF29;
export const MOVES   = MOVES_BF30;
export const exitOccupancy = occupancyAt(theFacility, MOVES, 6, INITIAL);

export const SCENE_VERSION = "bf-motion/1.0.0";
