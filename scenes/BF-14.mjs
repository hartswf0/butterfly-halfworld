/* ============================================================================
   BF-14 · EQUAL INTERVALS     INT. LABORATORY · RECOVERY RACK — CONTINUOUS
                                                        plan: the-laboratory

     "From the recovery rack comes a dry tapping."
     "The butterfly strikes the vial once, then again. Not wildly."
     "It moves around the circumference, testing the glass at equal intervals."
                                                        — atlas/source.json

   MOTION: CYCLE · 8 beats · 4.0s · 48 frames @12fps · loopClosed: TRUE.
   THE LAST UNIT OF ACT I. Its exitOccupancy is the act's handoff — see the
   bottom of this file.

   ---------------------------------------------------------------------------
   THE RING THE PLANS REFUSED, AND THE CONVENTION I AM SETTING WITH IT.

   SCENE-BRIEF §6 and the-laboratory's own blocking section both decline to
   author this: eight stations around a 30mm vial project ~0.4px apart, "which
   would be a lie about what a plan can hold." They are right, and the refusal
   is the correct kind — it hands the scene a station (`recovery_rack_vial`) and
   says the ring is yours.

   BF-21's canister in the-mill is the same figure, drawn by another agent, and
   SCENE-BRIEF says the two "should rhyme". A rhyme written in prose is not a
   rhyme, so the convention is a function: assets/set/_tap-ring.mjs, which BF-21
   can import. Its header states all five decisions in full. In brief, and for
   whoever draws the canister:

     1. EIGHT stations, not twelve. At 12fps a 4-second loop gives 6 frames per
        station and 4 frames of dwell — an interval a viewer can COUNT, which is
        the only way "equal" gets seen rather than asserted. Twelve gives 4 and
        2, and the intervals become a shimmer. creature/swallowtail.mjs's own
        `motions.tap` uses twelve; that function is answering what the animal
        does, this one is answering what twelve frames a second can hold, and
        where they disagree the renderer wins. Say so if you choose otherwise.
     2. QUANTISED, NEVER EASED, dwell 0.50. Position is advance()'s `shift`:
        exactly zero for the whole dwell, then a fast slide, with no in-between
        position a viewer could call a curve. The FRACTION is arithmetic: at
        dwell .72 only one of the six frames per station is in transit, the
        animal covers 38% of the gap inside the loop and 62% of it across the
        wrap, and the renderer measured wrap 1.879% against mean step 0.854% —
        ratio 2.201, "open drift", on a loop declared CLOSED. At .50 there are
        two transit frames and the wrap step is the same size as the first one.
        Three of six frames still hold still, which is what makes the interval
        countable. See _tap-ring.mjs's header.
     3. THE STRIKE IS AT ARRIVAL AND IT IS A STEP. `contact` runs 1 -> 0 across
        the first 34% of a dwell and is 0 for the rest. A tap that fades IN is
        a caress.
     4. CLOSED, BY ARITHMETIC. theta = ((index + shift) / 8) * TAU, so after
        eight stations it is exactly TAU, which is exactly 0. The loop does not
        close because the drawing happens to come back; it closes because the
        number does.
     5. THE GLASS REMEMBERS. `struck[i]` counts the stations visited so far, and
        the scene puts a mark on the glass at each one. The marks accumulate
        around the circumference and reset at the wrap, because the loop is
        closed and it is the same vial it was. That accumulating ring of marks
        is the visible evidence of "equal intervals" — without it a viewer sees
        a butterfly moving, not a butterfly measuring.

   The ring is an ELLIPSE (ry = 0.34 rx): the circumference of an upright
   cylinder seen slightly from above. `near` interpolates 0 at the far side to 1
   at the near side, and the animal is drawn BEHIND the vial's contour on the
   far half and in front of it on the near half — which is the one thing that
   makes the ring read as going round rather than as sliding side to side.

   ---------------------------------------------------------------------------
   WHY A CLOSED LOOP HERE IS NOT A BREACH OF THE RULE ABOUT LIVING THINGS.

   MOTION-BRIEF: three units are authored loop:true and "every one is an
   apparatus, not a body." What is closed here is the VIAL. The animal inside it
   is not: `wear` climbs across the loop, the wings sag by the eighth station,
   and if the vial were opened the cycle would end. The closure belongs to the
   glass. This is the same argument BF-11 makes about a conversation and the
   opposite of the one BF-01 makes about a ceiling.

   THE ASSET CLOCK IS HELD, for the same reason as BF-11: the liveness layer is
   a function of elapsed seconds and is not periodic in u, so a live clock would
   put frame 47 in a different phase from frame 0 and tick once per revolution.
   Everything visible is driven explicitly.

   DECLARED DISCONTINUITIES: none.
   ========================================================================= */
import { cycle, framesFor, clamp01, TAU } from "../engine/motion.mjs";
import { INK, inkLevel, placeInstance } from "../engine/halfworld-engine.mjs";
import { occupancyAt } from "../engine/blocking.mjs";
import { lens } from "../assets/set/_lens.mjs";
import { room, recoveryRack, vial } from "../assets/set/_lab.mjs";
import { tapRing, ringStations } from "../assets/set/_tap-ring.mjs";
import { theLaboratory, MOVES_BF14 } from "./_plans/the-laboratory.mjs";
import { exitOccupancy as EXIT_BF13 } from "./BF-13.mjs";
import swallowtail from "../assets/creature/swallowtail.mjs";

export const id         = "BF-14";
export const title      = "EQUAL INTERVALS";
export const place      = "INT. LABORATORY · RECOVERY RACK";
export const plan       = "the-laboratory";
export const motion     = "CYCLE";
export const beats      = 8;                       // eight stations. See above.
export const seconds    = 4.0;
export const loopClosed = true;                    // the vial is closed
export const frames     = framesFor(motion, seconds, 12, beats);   // 48
export const declaredBreak = null;

export const subject  = "an animal testing the circumference of a vial at equal intervals";
export const distance = "CLOSE";
export const leftOut  = [
  "Mara and Niko — nobody speaks in this unit and nobody is looking at the " +
  "rack; the tapping is a sound coming FROM somewhere, and the shot is that " +
  "somewhere",
  "the fire door — it is 0.3 of the room nearer and BF-15 begins on the other " +
  "side of it (the plan's crossPlanTies); this act ends on this side",
];

/* the ring, in scene space. rx/ry are the vial's own numbers. */
const RING = { stations: 8, dwell: 0.50, strikeFrac: 0.34, phase0: -0.25 };

/* ============================================================ at(u) ========
   Periodic in u with period 1, by arithmetic: see decision 4. */
export function at(u, _ctx) {
  const c = cycle(u, { beats, closed: true });
  const r = tapRing(u, { ...RING, rx: 1, ry: 0.34 });   // unit ring; scaled in draw
  return {
    u, beat: c.beat,
    ring: r,
    /* the body inside the closed thing is NOT closed. wear climbs and the
       wings sag; it just cannot climb past the wrap, because the vial resets
       and the animal is the same animal it was one revolution ago. */
    closure: 0.74 + 0.10 * Math.sin(u * TAU) - 0.06 * u,
    tilt: Math.cos(r.theta) * 0.13,
    wear: 0.36 + 0.30 * u,
  };
}

/* ============================================================ draw() =======
   The rack and the vial are drawn at explicit scene-space sizes anchored to the
   plan's `recovery_rack_vial`. At the zoom that makes a 30mm vial fill a frame,
   BODY-derived furniture is thousands of pixels tall and the rack would be four
   lines running off every edge; the plan says WHERE, the scene says HOW BIG,
   and that division is the same one _lab.mjs's header sets out. */
const NW = 1120, NH = 760;
const F = lens(theLaboratory, { native: true, zoom: 1.0, W: NW, H: NH });
const VX = 560, VBASE = 604, VW = 168, VH = 414;
const RX = VW * 1.02, RY = RX * 0.34;              // the ring, on the glass
const RCY = VBASE - VH * 0.52;

export function draw(g, W, H, s) {
  g.save();
  g.scale(W / NW, H / NH);
  g.lineJoin = "round"; g.lineCap = "round";

  backdrop(g);
  rack(g);

  /* DRAW ORDER, PASS 2. The first version put the animal UNDER the vial on the
     far half of the ring, and vial()'s cylinder is an opaque level-1 fill, so
     for four of the eight stations the subject of the scene was invisible.
     Glass is transparent: the animal is always drawn, always over the fill.
     What carries the far/near half instead is SIZE (0.30 -> 0.35) and the
     near-wall highlights, which are drawn last and cross it only when it is
     behind them. */
  const v = vial(g, VX, VBASE, VW, VH, { level: 1, lw: 5.2, stopper: true });
  struckMarks(g, s);
  animal(g, s);
  glassNearWall(g, v, s);
  if (s.ring.contact > 0) tick(g, s);

  g.restore();
}

function backdrop(g) {
  g.fillStyle = inkLevel(0); g.fillRect(0, 0, NW, NH);
  g.fillStyle = inkLevel(1); g.fillRect(0, 604, NW, NH - 604);
}

/* the rack, at scene scale: two uprights and three tiers, the middle one
   holding this vial. Everything broken; nothing spans the frame. */
function rack(g) {
  const x0 = 232, x1 = 888;
  g.strokeStyle = INK; g.lineWidth = 6;
  for (const x of [x0, x1]) {
    g.beginPath(); g.moveTo(x, 96); g.lineTo(x, 604); g.stroke();
  }
  g.lineWidth = 6.5;
  const tiers = [[152, 0.10, 0.44], [372, 0.06, 0.40], [604, 0.12, 0.46]];
  for (const [y, a, b] of tiers) {
    g.beginPath();
    g.moveTo(x0, y);        g.lineTo(x0 + (x1 - x0) * (0.5 - a), y);
    g.moveTo(x0 + (x1 - x0) * (0.5 + b * 0.24), y); g.lineTo(x1, y);
    g.stroke();
  }
  // two empty vials on the far tier, so the rack is a rack
  g.strokeStyle = inkLevel(4); g.lineWidth = 4;
  for (const cx of [318, 806]) {
    g.beginPath();
    g.moveTo(cx - 34, 372); g.lineTo(cx - 34, 176);
    g.moveTo(cx + 34, 372); g.lineTo(cx + 34, 176);
    g.stroke();
    g.beginPath(); g.ellipse(cx, 176, 34, 12, 0, 0, TAU); g.stroke();
  }
}

/* THE EVIDENCE. One mark on the glass at every station reached so far, at the
   station's own place on the ellipse. Marks on the far half sit lighter,
   because they are being read through the glass. */
function struckMarks(g, s) {
  const st = ringStations({ ...RING, rx: RX, ry: RY, cx: VX, cy: RCY });
  for (const p of st) {
    if (!s.ring.struck[p.i]) continue;
    const level = p.near > 0.5 ? 6 : 4;
    g.fillStyle = inkLevel(level);
    g.save();
    g.translate(p.x, p.y);
    g.rotate(Math.atan2(-Math.cos(p.theta) * RY, Math.sin(p.theta) * RX));
    g.fillRect(-3.4, -13, 6.8, 26);                 // a short vertical scuff
    g.restore();
  }
}

/* the animal, at its station on the ring. Its horizontal position is the
   ellipse's x; its vertical is the ellipse's y, which is what turns eight
   equal angles into eight unequal-looking screen positions and is exactly why
   the ring reads as a circumference. */
function animal(g, s) {
  const x = VX + Math.cos(s.ring.theta) * RX * 0.86;
  const y = RCY + Math.sin(s.ring.theta) * RY * 0.86;
  placeInstance(g, NW, NH, swallowtail, {
    anchor: { x: x / NW, y: (y + 96) / NH },
    scale: 0.30 + 0.05 * s.ring.near,
    state: { closure: s.closure, tilt: s.tilt, wear: s.wear, key: true },
  });
}

/* the near wall of the glass: two short highlights, drawn last so they pass in
   front of an animal that is on the far side of the circumference. */
function glassNearWall(g, v, s) {
  if (s.ring.near >= 0.5) return;
  g.strokeStyle = inkLevel(3); g.lineWidth = 5;
  g.beginPath();
  g.moveTo(v.cx - v.w * 0.60, v.top + v.ry * 3.0);
  g.lineTo(v.cx - v.w * 0.60, v.top + v.ry * 3.0 + VH * 0.30);
  g.moveTo(v.cx + v.w * 0.68, v.top + v.ry * 5.0);
  g.lineTo(v.cx + v.w * 0.68, v.top + v.ry * 5.0 + VH * 0.18);
  g.stroke();
}

/* the tap. Three short ticks on the glass at the point of contact, at full ink,
   stepping to nothing across four frames. Never a ring, never a ripple: this
   world has no waves and a tap is a tap. */
function tick(g, s) {
  const k = s.ring.contact;
  const x = VX + Math.cos(s.ring.theta) * RX;
  const y = RCY + Math.sin(s.ring.theta) * RY;
  g.strokeStyle = INK; g.lineWidth = 3.0 + 3.2 * k;
  g.beginPath();
  for (const a of [-0.7, 0, 0.7]) {
    const dx = Math.cos(s.ring.theta + a) * 15, dy = Math.sin(s.ring.theta + a) * 15;
    g.moveTo(x + dx, y + dy);
    g.lineTo(x + dx * (1 + 1.5 * k), y + dy * (1 + 1.5 * k));
  }
  g.stroke();
}

/* ============================================================ occupancy ====
   NO MOVES — the plan's BF-14 table is empty and so is this one: loop:true and
   a body crossing the room would leave frame 47 different from frame 0.

   THE ACT'S HANDOFF. Act II imports ACT_I_EXIT. It is occupancyAt(), never
   hand-written, and it is the state of the room on this side of the fire door
   at the moment BF-15 begins on the other side of it.
   ========================================================================= */
export const INITIAL = EXIT_BF13;
export const MOVES   = MOVES_BF14;
export const exitOccupancy = occupancyAt(theLaboratory, MOVES, 6, INITIAL);

/** Act I ends here. `ACT_I_EXIT` is the named aggregate for Act II. */
export const ACT_I_EXIT = {
  act: "I",
  lastUnit: "BF-14",
  plan: "the-laboratory",
  /** the room, as the next act inherits it */
  occupancy: exitOccupancy,
  /** the door BF-15 comes through, named identically in both plans */
  handoffStation: "fire_door",
};

export const SCENE_VERSION = "bf-motion/1.0.0";
