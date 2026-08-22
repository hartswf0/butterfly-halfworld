/* ============================================================================
   00 · WHERE YOU GO WHEN YOU LEAVE — TITLE B: THE ARABESQUE — a WYGWYL halfworld

   SIX RINGS, each turning at an INTEGER multiple of the base rate and
   ALTERNATING direction — ring r rotates at rate (r+1)·base, sign flipping
   with r. Every ring also breathes: its radius carries a slow sine shared by
   the whole set, offset per ring, so the nested rings open and close out of
   phase with one another rather than as one pulsing disc. That is the whole
   arabesque; nothing about it is per-frame decision, only per-ring constants
   run through u.

   THE WORDS EMERGE LINE BY LINE FROM SUCCESSIVE RINGS COLLAPSING INWARD:
   line one is built only from the OUTER three rings, in the second
   movement; line two only from the INNER three, in the third. In each case
   the other half of the rings keep turning behind the settled word — the
   arabesque never actually stops, only the half of it that is busy spelling
   something does.
   ========================================================================= */
import { TAU, lerp, clamp01, smooth, ss, win } from "../halfworld.mjs";

const CX = 96, CY = 72;
const RINGS = 6;                       // r = 0 innermost … 5 outermost
const BASE_RATE = 0.9;                 // turns of ring 0 per whole u
const N0 = 110, DN = 55;               // points on ring r: N0 + r·DN — dense;
                                        // a few dozen points per ring read as
                                        // a scatter of beads, not an arabesque
const R0 = 9, DR = 9.5;                // radius of ring r: R0 + r·DR
const BREATHE = 5;                     // shared breathing amplitude, in cells

function ringPoints(r) { return N0 + r * DN; }

/* same harvest-and-erase used across the suite: stamp the word, read its
   ink back as flight targets, wipe it — one F.map pass regardless of
   whether this movement ever uses the result. */
function wordTargets(F, text, ph) {
  F.word(text, CX, CY, ph, 7, true);
  const xs = [], ys = [];
  F.map((x, y, v) => { if (v > 3.5) { xs.push(x); ys.push(y); return 0; } });
  return { xs, ys, n: xs.length || 1 };
}

/* one ring. `env` blends this ring's points toward a word's cells; pass 0
   (or omit xs/ys) to leave it as pure counter-rotating geometry. Radius
   breathes for every ring at all times — even a ring that is currently
   spelling a word keeps the shared pulse as its resting position, so the
   flight target is the only thing holding it still. `rankRef` is a shared
   counter across every ring drawn this frame: a first pass gave each ring
   its OWN i mod T, and every ring's i=0 piled onto the same first target
   cell while the far end of a short word never got a point at all. One
   running counter spends the flying rings' points across the whole word
   evenly instead. Idle points are leveled by radius — a slow band of
   darker and lighter rings — so the resting arabesque has depth instead of
   being one flat tone of ink. */
function ring(F, u, r, env, xs, ys, T, rankRef) {
  const n = ringPoints(r);
  const dir = r % 2 === 0 ? 1 : -1;
  const rate = (r + 1) * BASE_RATE * dir;
  const baseRad = R0 + r * DR + Math.sin(u * TAU * 0.6 + r * 0.9) * BREATHE;
  const band = 2 + Math.round((0.5 + 0.5 * Math.sin(baseRad * 0.5)) * 3) + (r % 2 === 0 ? 1 : 0);
  for (let i = 0; i < n; i++) {
    /* the ring's own (r+1)-fold lobe, fixed to its points and so carried
       around by the same rotation they turn with — a plain circle looks
       identical at every u no matter how fast it spins; the lobe is what
       lets a single still frame show which way, and how far, it has
       turned. */
    const local = (i / n) * TAU;
    const rad = baseRad * (1 + 0.07 * Math.cos(local * (r + 1)));
    const a = local + u * TAU * rate;
    let px = CX + Math.cos(a) * rad;
    let py = CY + Math.sin(a) * rad;
    let lvl = band;
    if (env > 0.002 && T) {
      const ti = rankRef.v % T; rankRef.v++;
      px = lerp(px, xs[ti], env);
      py = lerp(py, ys[ti], env);
      lvl = env > 0.5 ? 7 : 6;
    }
    F.ink(Math.round(px), Math.round(py), Math.min(7, lvl));
  }
}

function allRings(F, u, envFor) {
  const rankRef = { v: 0 };
  for (let r = 0; r < RINGS; r++) {
    const e = envFor(r);
    ring(F, u, r, e.env, e.xs, e.ys, e.n, rankRef);
  }
}
const IDLE = { env: 0, xs: null, ys: null, n: 0 };

export default {
  n: "00", slug: "00-title-b", title: "WHERE YOU GO WHEN YOU LEAVE",
  tagline: "the arabesque — nested rings, counter-rotating, collapsing inward",
  accent: "#5aa7ff", seed: 9002,
  drone: { base: 164, steps: [0, 4, 7, 4, 9], bright: true },
  movements: [
    {
      label: "THE ARABESQUE", seconds: 9, line: "",
      fx: { smear: { taps: 2, spread: 0.015, fall: 1.8 } },
      cues: [
        { at: 0.2, f: 330, decay: 0.6, gain: 0.35, partials: [1, 2, 3], noise: 0.2, nDecay: 0.06, seed: 51 },
        { at: 0.7, f: 494, decay: 0.6, gain: 0.35, partials: [1, 2, 3], noise: 0.2, nDecay: 0.06, seed: 52 },
      ],
      /* All six rings, none of them carrying a word yet — the counter-
         rotation and the breathing are the whole picture, on their own.
         Motion-blurred because this is the one movement with nothing to
         read, so smear can afford to make it louder. */
      draw(u, F) { allRings(F, u, () => IDLE); },
    },
    {
      label: "WHERE YOU GO", seconds: 10, line: "",
      cues: [
        { at: 0.24, f: 440, decay: 0.2, gain: 0.4, partials: [1, 2.5, 4], noise: 0.5, nDecay: 0.03, seed: 61 },
        { at: 0.42, f: 660, decay: 0.5, gain: 0.5, partials: [1, 2, 3, 4], noise: 0.15, nDecay: 0.04, seed: 62 },
      ],
      /* Only the OUTER three rings (3,4,5) fly to the word, rise-hold-
         release. The inner three keep turning underneath, unclaimed —
         proof the arabesque is still running while the outside of it
         spells something. */
      draw(u, F) {
        const { xs, ys, n } = wordTargets(F, "WHERE YOU GO", 14);
        const env = win(u, 0.22, 0.42, 0.60, 0.78);
        allRings(F, u, (r) => (r >= 3 ? { env, xs, ys, n } : IDLE));
      },
    },
    {
      label: "WHEN YOU LEAVE", seconds: 10, line: "",
      cues: [
        { at: 0.20, f: 392, decay: 0.25, gain: 0.4, partials: [1, 2.5, 4], noise: 0.5, nDecay: 0.03, seed: 71 },
        { at: 0.46, f: 588, decay: 1.4, gain: 0.55, partials: [1, 2.01, 3.02, 4.04], noise: 0.15, nDecay: 0.04, seed: 72 },
      ],
      /* Now the INNER three rings (0,1,2) collapse to the second line and
         hold to the end; the outer three — the ones that just finished
         spelling the first line — go back to pure rotation and keep the
         frame alive around the settled title instead of freezing whole. */
      draw(u, F) {
        const { xs, ys, n } = wordTargets(F, "WHEN YOU LEAVE", 14);
        const env = ss(0.20, 0.46, u);
        allRings(F, u, (r) => (r <= 2 ? { env, xs, ys, n } : IDLE));
      },
    },
  ],
};
