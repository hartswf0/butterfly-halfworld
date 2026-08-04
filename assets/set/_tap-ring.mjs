/* assets/set/_tap-ring.mjs — THE RING THE PLANS REFUSED.  ONE CONVENTION, TWICE.
   ============================================================================
     "From the recovery rack comes a dry tapping. The butterfly strikes the vial
      once, then again. NOT WILDLY. It moves around the circumference, testing
      the glass AT EQUAL INTERVALS."                      — BF-14, atlas/source

   SCENE-BRIEF §6 and the-laboratory's header both refuse to author this as
   plan stations, and they are right to: eight points around a 30mm vial project
   ~0.4px apart, which is below a plan's resolution and would be a lie about
   what a plan can hold. The plan supplies ONE station (`recovery_rack_vial`,
   and `lobby_floor_canister` in the-mill) and the ring is drawn in SCENE space
   at that point.

   Two scenes need it — BF-14's vial (this act) and BF-21's canister (the-mill,
   another agent) — and SCENE-BRIEF says they "are the same figure twice and
   should rhyme". A convention written in prose does not rhyme; a convention
   written as a function does. So it is here, and BF-21 imports it.

   ---------------------------------------------------------------------------
   THE CONVENTION, in five decisions. BF-21: match these or say why.

   1. EIGHT STATIONS. Not twelve. creature/swallowtail.mjs's `motions.tap`
      authors twelve for its own asset preview, and twelve is wrong for a
      rendered loop: at 12fps a four-second cycle gives 4 frames per station,
      the dwell is two frames, and "equal intervals" becomes an unreadable
      shimmer. Eight gives 6 frames per station, three of them held motionless
      (see decision 2) — an interval a viewer can COUNT, which is the only way
      the word "equal" can be seen rather than asserted. The asset is not wrong; it is answering a
      different question (what does this animal do) than the scene (what can be
      read at twelve frames a second).

   2. QUANTISED, NEVER EASED, AND THE DWELL IS 0.50 BECAUSE OF THE FRAME RATE.
      MOTION-BRIEF's punish-list names "smoothing the tapping" explicitly, so
      position between stations is advance()'s `shift`: ZERO for the whole
      dwell, then a fast slide, with no in-between position a viewer could call
      a curve. The dwell FRACTION, though, is set by arithmetic and not by
      taste. Eight stations over 48 frames is 6 frames per station, sampled at
      within = 0, 1/6 ... 5/6. At dwell 0.72 only ONE of those six frames is in
      transit, so the animal covers 38% of the gap inside the loop and the
      remaining 62% happens across the WRAP — the renderer measured that as a
      wrap 2.2x the mean step and reported drift on a loop declared closed.
      At 0.50 there are two transit frames (shift .259 and .741) and the wrap
      step is .259, the same size as the first one. Three of six frames are
      still held motionless, which is what makes the interval countable.
      BF-21: if your loop is not 48 frames over 8 stations, recompute this
      rather than copying 0.50.

   3. THE STRIKE IS AT ARRIVAL, AND IT IS A STEP. `contact` goes 1 -> 0 across
      the first `strikeFrac` of a dwell and is 0 for the rest. A tap is an
      instant; a tap that fades in is a caress.

   4. CLOSED. `theta` is ((index + shift) / n) * TAU, so after n stations it is
      exactly TAU, which is exactly 0. The loop closes by ARITHMETIC and not by
      the drawing happening to come back. This is one of only three closed loops
      in the world and every one of them is an apparatus.

   5. THE GLASS REMEMBERS. `struck[i]` counts how many times station i has been
      hit so far in this revolution. It is what lets the scene put a mark on the
      glass at each station and have the marks accumulate around the
      circumference — which is the visible evidence of "equal intervals", and it
      resets at the wrap because the loop is closed and the vial is the same
      vial it was.

   THE RING IS AN ELLIPSE, not a circle: it is the circumference of an upright
   cylinder seen from slightly above, so the near half is lower and larger. `ry`
   is typically .34 of `rx`. The scene supplies both; this file supplies the
   schedule.
   ========================================================================= */
import { advance, TAU } from "../../engine/motion.mjs";

/**
 * tapRing(u, o) -> the schedule, in scene space.
 *   o.stations   8 by default. See decision 1.
 *   o.dwell      .50 by default — the fraction of each interval held still.
 *   o.strikeFrac .34 — how much of the DWELL the contact tick survives.
 *   o.rx, o.ry   the ellipse, in px. o.cx, o.cy its centre.
 *   o.phase0     which station the loop starts on, in turns (default 0 = far).
 *
 * Returns { index, next, shift, settled, theta, x, y, near, contact, struck[] }
 *   near   0 at the far side of the glass, 1 at the near side — the scene uses
 *          it to put the animal behind or in front of the vial's own contour.
 */
export function tapRing(u, o = {}) {
  const n = o.stations ?? 8;
  const dwell = o.dwell ?? 0.50;
  const strikeFrac = o.strikeFrac ?? 0.34;
  const rx = o.rx ?? 100, ry = o.ry ?? rx * 0.34;
  const cx = o.cx ?? 0, cy = o.cy ?? 0;
  const phase0 = o.phase0 ?? 0;

  const a = advance(u, n, { dwell });
  const theta = ((a.index + a.shift) / n + phase0) * TAU;

  // where in the current dwell are we? 0 at arrival, 1 at the moment it moves.
  const within = (u * n) - a.index;                    // 0..1 across the interval
  const inDwell = Math.min(1, within / dwell);
  const contact = inDwell < strikeFrac ? 1 - inDwell / strikeFrac : 0;

  // the glass remembers: station i has been struck once we have arrived at it
  const struck = [];
  for (let i = 0; i < n; i++) struck.push(i <= a.index ? 1 : 0);

  return {
    n, index: a.index, next: (a.index + 1) % n, shift: a.shift, settled: a.settled,
    theta,
    x: cx + Math.cos(theta) * rx,
    y: cy + Math.sin(theta) * ry,
    near: 0.5 + 0.5 * Math.sin(theta),                 // 1 = nearest the camera
    contact, struck,
  };
}

/** The station angles themselves, for drawing the evidence on the glass. */
export function ringStations(o = {}) {
  const n = o.stations ?? 8;
  const rx = o.rx ?? 100, ry = o.ry ?? rx * 0.34;
  const cx = o.cx ?? 0, cy = o.cy ?? 0;
  const phase0 = o.phase0 ?? 0;
  const out = [];
  for (let i = 0; i < n; i++) {
    const th = (i / n + phase0) * TAU;
    out.push({ i, theta: th, x: cx + Math.cos(th) * rx, y: cy + Math.sin(th) * ry,
               near: 0.5 + 0.5 * Math.sin(th) });
  }
  return out;
}

export const TAP_RING_VERSION = "tap-ring/1.0.0";
