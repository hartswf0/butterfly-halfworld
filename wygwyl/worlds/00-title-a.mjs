/* ============================================================================
   00 · WHERE YOU GO WHEN YOU LEAVE — TITLE A: THE ROSETTE — a WYGWYL halfworld

   ONE LAW, nothing else: a field of N points where point k sits at angle
   k·Ω·u — the differential-phase device, undiluted. Because the angular step
   is proportional to k, the field is never a shape someone drew; it is what
   N clocks running at N different speeds look like from directly above.
   When Ω·u drifts near a low rational p/q, every k-th point shares an angle
   with q−1 neighbours and the fan collapses into a q-spoke star. That
   collapse is the resonance, and Ω = 4 makes it land on its own at
   u = .25, .5, .75, 1 — four total collapses a movement, for free, never
   triggered by hand.

   THE TITLE RIDES THE SAME LAW rather than interrupting it: at the resolve
   windows the same N points are ALSO given a second position — a cell read
   back out of the word's own raster — and u simply blends between the two.
   The flight paths are the rosette's own geometry deciding how a letter
   gets built, which is why they arrive from everywhere at once instead of
   left-to-right like a typewriter.
   ========================================================================= */
import { TAU, lerp, clamp01, smooth, ss, win } from "../halfworld.mjs";

const CX = 96, CY = 72;           // the pivot every point turns around
const OMEGA = 4;                  // Ω·u is an integer at u=.25/.5/.75/1
const SWARM = 900;                // the chaos population. Letters draw MORE
                                   // ink by reusing points, never fewer of them

/* Rasterise a word, read its ink back as a flight-target list, erase it —
   one F.map pass either way, so a chaos-only movement never pays for text
   and a text movement never pays for it twice. Threshold is 3.5 because the
   glyph is stamped at level 7 into a field that starts at 0; nothing else
   in this world ever occupies the gap between. */
function wordTargets(F, text, ph) {
  F.word(text, CX, CY, ph, 7, true);
  const xs = [], ys = [];
  F.map((x, y, v) => {
    if (v > 3.5) { xs.push(x); ys.push(y); return 0; }
  });
  return { xs, ys, n: xs.length || 1 };
}

/* THE FIELD. env is how much of the argument the word has won: 0 is pure
   differential phase, 1 is the word, the run between is the flight. Point k
   is assigned target k mod T — sorting points to their nearest target was
   tried and cost a full sort every frame for a result no more legible than
   modulo; the spare points from SWARM > T just thicken the stroke, which a
   halftone wants anyway. */
function field(F, u, env, xs, ys, T) {
  for (let k = 0; k < SWARM; k++) {
    const turns = k * OMEGA * u;
    const th = (turns - Math.floor(turns)) * TAU;
    const rad = 6 + (k / SWARM) * 60;
    let px = CX + Math.cos(th) * rad;
    let py = CY + Math.sin(th) * rad;
    if (env > 0.002 && T) {
      const ti = k % T;
      px = lerp(px, xs[ti], env);
      py = lerp(py, ys[ti], env);
    }
    const lvl = 4 + (F.noise(k, 3) > 0.72 ? 2 : 0) + (env > 0.5 ? 1 : 0);
    F.ink(Math.round(px), Math.round(py), Math.min(7, lvl));
  }
}

export default {
  n: "00", slug: "00-title-a", title: "WHERE YOU GO WHEN YOU LEAVE",
  tagline: "the rosette — a differential-phase field resolving into type",
  accent: "#5aa7ff", seed: 9001,
  drone: { base: 174, steps: [0, 5, 9, 5, 12], bright: true },
  movements: [
    {
      label: "THE LAW ALONE", seconds: 7, line: "",
      cues: [
        { at: 0.25, f: 520, decay: 0.5, gain: 0.4, partials: [1, 2, 3], noise: 0.25, nDecay: 0.06, seed: 11 },
        { at: 0.75, f: 660, decay: 0.5, gain: 0.4, partials: [1, 2, 3], noise: 0.25, nDecay: 0.06, seed: 12 },
      ],
      /* No text: this movement is the demonstration. Watch it pass through
         order at u=.25/.5/.75 without anyone marking the beat. */
      draw(u, F) { field(F, u, 0, null, null, 0); },
    },
    {
      label: "WHERE YOU GO", seconds: 8, line: "",
      cues: [
        { at: 0.30, f: 440, decay: 0.2, gain: 0.4, partials: [1, 2.5, 4], noise: 0.5, nDecay: 0.03, seed: 21 },
        { at: 0.52, f: 660, decay: 0.6, gain: 0.5, partials: [1, 2, 3, 4], noise: 0.15, nDecay: 0.04, seed: 22 },
      ],
      /* Rise, hold, and let go again — the word is one resonance among the
         others, not a destination the field stops at. */
      draw(u, F) {
        const { xs, ys, n } = wordTargets(F, "WHERE YOU GO", 14);
        const env = win(u, 0.30, 0.52, 0.68, 0.88);
        field(F, u, env, xs, ys, n);
      },
    },
    {
      label: "THE FIELD AGAIN", seconds: 6, line: "",
      fx: { kaleido: "quad" },
      cues: [
        { at: 0.5, f: 620, decay: 0.4, gain: 0.35, partials: [1, 2, 3], noise: 0.2, nDecay: 0.05, seed: 31 },
      ],
      /* Same law, mirrored into four quadrants — a second look at the same
         differential, folded into the mandala the un-mirrored version only
         gestures at. Rejected: mirroring the text movements too, where a
         letter reflected reads as a different letter, not a bigger one. */
      draw(u, F) { field(F, u, 0, null, null, 0); },
    },
    {
      label: "WHEN YOU LEAVE", seconds: 9, line: "",
      cues: [
        { at: 0.28, f: 392, decay: 0.25, gain: 0.4, partials: [1, 2.5, 4], noise: 0.5, nDecay: 0.03, seed: 41 },
        { at: 0.46, f: 588, decay: 1.4, gain: 0.55, partials: [1, 2.01, 3.02, 4.04], noise: 0.15, nDecay: 0.04, seed: 42 },
      ],
      /* The last word doesn't let go: env rises once and holds through the
         rest of the movement, so the suite's own title is the last thing
         standing when this film loops back into its own title card. */
      draw(u, F) {
        const { xs, ys, n } = wordTargets(F, "WHEN YOU LEAVE", 14);
        const env = ss(0.28, 0.58, u);
        field(F, u, env, xs, ys, n);
      },
    },
  ],
};
