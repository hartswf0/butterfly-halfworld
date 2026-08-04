/* ============================================================================
   BF-26 · THEREFORE THEY TURNED       EXT. SERVICE ALLEY            the-lot

     "The butterfly turns at the alley's end. Therefore they turn.
      It crosses a fenced lot where waist-high weeds have grown through the
      chassis of a delivery truck.
      Iona is fast for perhaps twenty paces. Then her body remembers its age."
                                                          — atlas/source.json
     MARA: "Where is it going?"  IONA: "To the boy."
     MARA: "You said he's dead."  IONA: "I said we found him."

   MOTION: ADVANCE · 5.5s · 66 frames @12fps.

   ---------------------------------------------------------------------------
   THE ONLY ADVANCE IN THE WORLD THAT A BODY LOSES.

   the-lot's header: "`iona_falters` is authored ON the run, at z .598, four
   stations in… advance(u, 11, { dwell }) quantises the whole run; Iona's
   blocking stops at index 3 while Mara's continues to index 10. An ADVANCE both
   of them complete would make them equals, and the unit's content is that they
   are not."

   So there is ONE advance() call and three different caps on it: Mara 10, Niko
   8, Iona 3. Nobody gets their own clock. They are quantised onto the same
   eleven stations at the same instants and the difference between them is only
   how far along it they are still moving — which is what running after
   something together and losing is.

   IONA'S BODY IS HER OWN MODULE'S. `twenty_paces` is fed u/0.364 so that its
   twenty beats complete exactly as the advance passes index 3, and its `fresh`
   term — "1 - max(0, (q - 10) / 10) ** 1.5" — collapses over the last ten of
   them. Her stride amplitude, her chest lift and her spine's lean all fall away
   while the other two keep stepping. After index 3 she is held at the station
   the plan gives her and her chest is still going.

   ---------------------------------------------------------------------------
   NOBODY FACES THE CAMERA. the-lot: "there is no station in this plan that is
   not on, or within a body's width of, pursuitRun — eleven stations… strictly
   decreasing in z, which is a straight run away from the lens over 252px of
   frame depth. Nobody in this plan is ever facing the camera." Every figure
   here is drawn with bodyYaw near PI: we are behind them, and the animal is
   ahead of all of them.

   THE RUN BENDS AT alley_end_turn, index 2, because that is where the animal
   turns and "therefore they turn". The bend is in the plan's own station list;
   this file only follows it.

   DECLARED DISCONTINUITIES: none. The dwells are held frames, not cuts.

   COMPOSITION. One subject: an advance that one of the three bodies loses.
   ========================================================================= */
import { advance, framesFor, clamp01 } from "../engine/motion.mjs";
import { INK, lerp, smooth } from "../engine/halfworld-engine.mjs";
import { occupancyAt } from "../engine/blocking.mjs";
import { theLot, MOVES_BF26, pursuitRun } from "./_plans/the-lot.mjs";
import { lens, NW, NH, BODY_H } from "../assets/set/_stage.mjs";
import { pavement, alleyWall, chainFence, truckAndWeeds, weed } from "../assets/set/lot.mjs";
import { LV, brokenLine } from "../assets/set/_kit.mjs";
import { exitOccupancy as exitOccupancyBF25 } from "./BF-25.mjs";
import mara from "../assets/character/mara.mjs";
import niko from "../assets/character/niko.mjs";
import iona from "../assets/character/iona.mjs";
import oldbutterfly from "../assets/creature/oldbutterfly.mjs";

export const id         = "BF-26";
export const title      = "THEREFORE THEY TURNED";
export const place      = "EXT. SERVICE ALLEY";
export const plan       = "the-lot";
export const motion     = "ADVANCE";
export const beats      = null;
export const seconds    = 5.5;
export const loopClosed = false;
export const frames     = framesFor(motion, seconds, 12);      // 66
export const declaredBreak = null;
export const breakAt    = null;

export const subject  = "an advance that one of the three bodies loses";
export const distance = "WIDE";
export const leftOut  = [
  "every face — nobody in this plan faces the camera, and that is the plan's own rule",
  "the four spoken lines, which happen while all three are out of breath",
  "the annex at the far end (BF-28 owns it)",
  "the spilled lavender: it splits where Iona stops, and BF-27 is that unit",
];

/* ---- framing ------------------------------------------------------------ */
/* PASS 2, and it is BF-16's finding again. At zoom 1.5 with a 0.404 body factor
   the eleven stations occupied 378px of frame depth while a body was 330px
   tall: the three runners overlapped for the whole loop and the alley had no
   room to be an alley. Zoom 2.0 opens the run to 505px of depth and 743px of
   width; BODY_K 0.215 makes the near body 238px and the far one 160px, which is
   the plan's own 33% shrink (1.1545 -> 0.7765) and nothing else. */
const ZOOM   = 2.00;
const BODY_K = 0.215;
const station = lens(theLot, { zoom: ZOOM, cx: 0.5000, cy: 0.7293 });
const RUN = pursuitRun.map((n) => station(n));
const bodyH = (p) => BODY_H * p.scale * BODY_K;

/* the caps. One run, three distances along it. */
const CAP = { mara: 10, niko: 8, iona: 3 };
/* the animal is ahead of all of them: 1.6 stations, which at 6 frames a station
   is about eight tenths of a second of lead */
const BUG_LEAD = 1.6;
/* Iona's twenty paces finish exactly as the advance passes index 3 */
const IONA_U = (CAP.iona + 1) / RUN.length;          // 0.364

const along = (f) => {                               // fractional index -> point
  const i = Math.max(0, Math.min(RUN.length - 1, Math.floor(f)));
  const j = Math.min(RUN.length - 1, i + 1);
  const k = clamp01(f - i);
  return {
    x: lerp(RUN[i].x, RUN[j].x, k),
    y: lerp(RUN[i].y, RUN[j].y, k),
    h: lerp(bodyH(RUN[i]), bodyH(RUN[j]), k),
  };
};

/* ============================================================ at(u) ========
   ONE advance. Three caps. Nobody gets their own clock. */
export function at(u, _ctx) {
  const a = advance(u, RUN.length, { dwell: 0.55 });
  const f = a.index + a.shift;
  const who = (cap) => along(Math.min(f, cap));
  return {
    u, index: a.index, settled: a.settled, shift: a.shift,
    mara: who(CAP.mara), niko: who(CAP.niko), iona: who(CAP.iona),
    bug: along(Math.min(f + BUG_LEAD, RUN.length - 1)),
    // a stride, and only while the shift is running
    stride: a.settled ? 0 : Math.sin(a.shift * Math.PI),
    // her own module's decay, complete at the instant the advance passes her cap
    paces: iona.motions.twenty_paces(Math.min(0.9995, u / IONA_U)),
    spent: clamp01((u - IONA_U) / 0.18),
  };
}

/* ============================================================ draw() ======= */
export function draw(g, W, H, s) {
  g.save();
  g.scale(W / NW, H / NH);
  g.lineJoin = "round"; g.lineCap = "round";

  /* ---- the ground the whole plan stands on */
  pavement(g, RUN[10].y - 90, NH + 20, -20, NW + 20, { seed: 61, cracks: 6 });

  /* ---- the alley walls, converging on the far end. They stop at the fence. */
  /* PASS 2: the walls were inset from the frame and read as two parallelograms
     floating in the middle of it. An alley's walls run off the near edge of the
     picture — that is what being in one means. Both near ends are outside the
     frame and both bottoms are below it. */
  const hN = bodyH(RUN[0]) * 2.2;
  alleyWall(g, { x: -120, y: NH + 80, top: -80 },
               { x: RUN[3].x - 165, y: RUN[3].y, top: RUN[3].y - hN * 0.50 },
               { side: 1, seed: 71 });
  alleyWall(g, { x: NW + 120, y: NH + 80, top: -80 },
               { x: RUN[3].x + 185, y: RUN[3].y, top: RUN[3].y - hN * 0.50 },
               { side: -1, seed: 77 });

  /* ---- the fence, and the gap in it the run goes through */
  const FW = station("fence_line_west"), FE = station("fence_line_east");
  chainFence(g, FW.x - 60, RUN[4].x - bodyH(RUN[4]) * 0.42, FW.y, bodyH(FW) * 0.62, { seed: 83, posts: 3 });
  chainFence(g, RUN[4].x + bodyH(RUN[4]) * 0.42, FE.x + 60, FE.y, bodyH(FE) * 0.62, { seed: 89, posts: 3 });

  /* ---- the truck, with the weeds grown THROUGH it. Three passes off one stem
     set — see assets/set/lot.mjs; the growing-through is a layer order. */
  truckAndWeeds(g, { x: RUN[8].x, y: RUN[8].y }, { x: RUN[6].x, y: RUN[6].y },
    { seed: 97, stems: 16, h: bodyH(RUN[7]) * 0.86 });

  /* ---- more weeds, waist high, at the two stations the plan names */
  weed(g, RUN[5].x - 40, RUN[5].y, bodyH(RUN[5]) * 0.50, { seed: 41, blades: 7, level: 3 });
  weed(g, station("weeds_north").x, station("weeds_north").y,
       bodyH(station("weeds_north")) * 0.48, { seed: 47, blades: 6, level: 2 });

  /* ---- THE THREE, from behind, on one run. Far first. */
  runner(g, niko, s.niko, s, "niko");
  runner(g, mara, s.mara, s, "mara");
  faltering(g, s);

  /* ---- THE ANIMAL, ahead of all of them. */
  const bh = s.bug.h;
  oldbutterfly.draw(g, NW, NH, {
    closure: 0.34 + 0.22 * Math.sin(s.u * Math.PI * 8),
    tilt: -0.10, wear: 0.55,
    cx: s.bug.x / NW, cy: (s.bug.y - bh * 1.15) / NH,
    V: bh * 0.30,
  });

  g.restore();
}

/* a body seen from BEHIND, stepping only while the shift runs */
function runner(g, mod, p, s, key) {
  const sw = s.stride * (key === "niko" ? -1 : 1);
  const node = key === "niko" ? niko.states.nodes.reach.preview : mara.states.nodes.del.preview;
  const st = { ...node, ...mod.motions.breath(s.u), box: false };
  st.rig = {
    ...st.rig,
    bodyYaw: Math.PI, headYaw: Math.PI + 0.10,      // nobody faces the camera
    hipL: 0.50 * sw, hipR: -0.50 * sw,
    kneeL: 0.52 * Math.max(0, -sw), kneeR: 0.52 * Math.max(0, sw),
    armLUpper: 0.34 - 0.40 * sw, armRUpper: -0.34 + 0.40 * sw,
    rootY: -0.030 * Math.abs(sw),
    spineLean: -0.24,
  };
  const w = p.h * 0.42;
  g.save();
  g.translate(p.x - w, p.y - p.h);
  mod.draw(g, w * 2, p.h, st);
  g.restore();
}

/* IONA. Her own module's twenty_paces, and then the station she stops at. */
function faltering(g, s) {
  const p = s.iona;
  const st = { ...iona.states.nodes.paces.preview, ...s.paces, bag: true };
  st.rig = {
    ...st.rig,
    bodyYaw: Math.PI, headYaw: Math.PI + 0.14,
    // and when she has stopped, the lean goes out of her and the chest stays
    spineLean: (st.rig?.spineLean || 0) * (1 - s.spent) + 0.10 * s.spent,
    chestLift: (st.rig?.chestLift || 0.3) + 0.34 * s.spent,
    headPitch: (st.rig?.headPitch || 0) + 0.30 * s.spent,
  };
  const w = p.h * 0.44;
  g.save();
  g.translate(p.x - w, p.y - p.h);
  iona.draw(g, w * 2, p.h, st);
  g.restore();
}

/* ---- occupancy ---------------------------------------------------------- */
export const INITIAL = {
  mara: "alley_mouth", niko: "alley_mouth", iona: "alley_mouth",
  oldbutterfly: "alley_mid",
};
export const MOVES   = MOVES_BF26;
export const exitOccupancy = occupancyAt(theLot, MOVES, 7, INITIAL);

/* the mill's occupancy does not travel into this plan — a station name in
   the-mill is not a station name in the-lot, and the two plans meet only at
   `annex_door`/`fire_door`-style ties. exitOccupancyBF25 is imported so the
   chain is unbroken and is recorded here rather than silently dropped. */
export const carriedFromTheMill = exitOccupancyBF25;

export const SCENE_VERSION = "bf-motion/1.0.0";
