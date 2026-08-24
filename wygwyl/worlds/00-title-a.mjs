/* ============================================================================
   00 · WHERE YOU GO WHEN YOU LEAVE — TITLE A: THE ROSETTE — a WYGWYL halfworld

   ONE LAW, nothing else: N points sit at fixed anchors evenly around a
   ring, and EVERY point also spins about its own anchor — point k at
   k·Ω·u turns, the differential-phase device, undiluted. A first pass put
   the points directly on the ring with no local spin: proportional angles
   alone just sort into straight radial spokes, which is a wheel, not a
   rosette. The local orbit is what turns the same law into loops — at any
   instant every anchor's satellite is somewhere on its own little circle,
   and the ENVELOPE of nineteen hundred little circles, all turning at
   different multiples of one rate, is the rosette.

   When Ω·u drifts near a low rational p/q, every k-th satellite shares a
   phase with q−1 neighbours and the loops snap into a q-fold flower. That
   collapse is the resonance, and Ω = 4 makes it land on its own at
   u = .25, .5, .75, 1 — four total collapses a movement, for free, never
   triggered by hand.

   THE TITLE RIDES THE SAME LAW rather than interrupting it: at the resolve
   windows an even sample of the field — spread across every anchor angle,
   never all of it — is ALSO given a second position, a cell read back out
   of the word's own raster, and u blends between the two. The rest of the
   field keeps turning, so the word arrives as one resonance the rosette is
   currently holding, in front of a rosette that never stopped.
   ========================================================================= */
import { TAU, lerp, clamp01, smooth, ss, win } from "../halfworld.mjs";

const CX = 96, CY = 72;           // the pivot every point turns around
const ANCHOR_R = 38;               // radius of the ring the anchors sit on
const OMEGA = 4;                  // Ω·u is an integer at u=.25/.5/.75/1
const SWARM = 1900;                // Whitney's fields are dense — a few dozen
                                   // points reads as scatter, not a harmonic
                                   // field; the caustics only appear once
                                   // there are enough loops for the eye to
                                   // find the envelope curve through them

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
   differential phase, 1 is the word, the run between is the flight. `pivot`
   moves the whole field's centre; the kaleido movement needs one off the
   field's own mirror line (x=96,y=72) or the fold reads a still-empty
   mirrored half back over a populated one and erases it — caught as an
   all-black frame at the exact u the field collapsed onto that row.

   ONLY A SUBSET OF THE FIELD EVER FLIES. Letting all nineteen hundred
   points fly resolved the word onto empty paper — a stronger and truer
   picture keeps most of the field turning behind and around the settled
   letters, so the title is one resonance the field is currently holding,
   not a state it has replaced itself with. Membership is every `stride`-th
   point, which — because k also sets the anchor angle — samples the whole
   ring evenly rather than draining one arc of the rosette bare. */
function field(F, u, env, xs, ys, T, pivot) {
  const [px0, py0] = pivot || [CX, CY];
  const FLY = Math.max(700, T || 0);
  const stride = T ? Math.max(1, Math.floor(SWARM / FLY)) : 0;
  const phase = OMEGA * u, frac = phase - Math.floor(phase);
  const resGlow = Math.min(frac, 1 - frac) < 0.05 ? 1 : 0;
  let rank = 0;
  for (let k = 0; k < SWARM; k++) {
    const anchor = (k / SWARM) * TAU;
    const spin = k * OMEGA * u * TAU;
    const rSat = 15 + 7 * Math.sin(k * 0.021);
    let px = px0 + Math.cos(anchor) * ANCHOR_R + Math.cos(spin) * rSat;
    let py = py0 + Math.sin(anchor) * ANCHOR_R + Math.sin(spin) * rSat;
    const flies = stride > 0 && k % stride === 0;
    const ti = flies ? rank++ % T : -1;
    let lvl;
    if (flies && env > 0.002) {
      px = lerp(px, xs[ti], env);
      py = lerp(py, ys[ti], env);
      lvl = env > 0.5 ? 7 : 6;
    } else {
      const dist = Math.hypot(px - px0, py - py0);
      const band = 0.5 + 0.5 * Math.sin(dist * 0.55);
      lvl = 2 + Math.round(band * 3) + resGlow;
    }
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
         others, not a destination the field stops at. Hold is wide (u∈
         [.38,.62]) rather than a single instant: a narrow hold left the
         letters mid-flight — softened, not wrong — at the exact moment
         meant to be the readable one. */
      draw(u, F) {
        const { xs, ys, n } = wordTargets(F, "WHERE YOU GO", 14);
        const env = win(u, 0.20, 0.38, 0.62, 0.80);
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
         letter reflected reads as a different letter, not a bigger one.
         Pivot is nudged off (96,72) — see the note on `field`'s `pivot`. */
      draw(u, F) { field(F, u, 0, null, null, 0, [93, 68]); },
    },
    {
      label: "WHEN YOU LEAVE", seconds: 9, line: "",
      cues: [
        { at: 0.28, f: 392, decay: 0.25, gain: 0.4, partials: [1, 2.5, 4], noise: 0.5, nDecay: 0.03, seed: 41 },
        { at: 0.46, f: 588, decay: 1.4, gain: 0.55, partials: [1, 2.01, 3.02, 4.04], noise: 0.15, nDecay: 0.04, seed: 42 },
      ],
      /* The last word doesn't let go: env rises once, fully locked well
         before the movement's midpoint, and holds through the rest of it —
         so the suite's own title is the last thing standing when this film
         loops back into its own title card. */
      draw(u, F) {
        const { xs, ys, n } = wordTargets(F, "WHEN YOU LEAVE", 14);
        const env = ss(0.12, 0.32, u);
        field(F, u, env, xs, ys, n);
      },
    },
  ],
};
