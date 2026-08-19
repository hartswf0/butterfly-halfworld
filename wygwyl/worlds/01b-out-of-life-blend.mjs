/* ============================================================================
   01b · OUT OF LIFE, BLEND — a WYGWYL halfworld, second version

   Same poem as 01-out-of-life.mjs, same four movements, same four verbatim
   lines — this version is not a rewrite, it is the same film with the actual
   lead footage let into the dot law. The computed room, haze, fall and flood
   below are UNCHANGED in their mechanism; what's new is the `footage` export,
   which tells the shell which seconds of `01-out-of-life-lead.mp4` to sample,
   through which ingest treatment, blended against the computed field by which
   per-dot rule — see blend.mjs and BLEND-NOTES.md for the reasoning behind
   each choice. THE FIGURE now carries GUISES.poet / GUISES.turned, measured
   off this same clip, so the silhouette reads as the same man whether the
   dot under him belongs to the camera or to the drawing.
   ========================================================================= */
import { TAU, lerp, clamp01, smooth, ss, win } from "../halfworld.mjs";

/* identical to 01's room/window helpers, with GUISES threaded through the
   figure calls — duplicated rather than imported because 01-out-of-life.mjs
   exports no helpers (and must not be edited to add any). */
function room(F, u, breathe = 1) {
  const b = Math.sin(u * TAU) * 0.8 * breathe;
  const FLOOR = 116 + b * 0.4;
  F.line(0, FLOOR, 70, FLOOR, 6, 1); F.line(78, FLOOR, 132, FLOOR, 6, 1);
  F.line(140, FLOOR, 192, FLOOR, 6, 1);
  const vx = 96 + (F.n2(u * 3.1, 7.7) - 0.5) * 44, vy = 74 + b;
  for (const x0 of [8, 40, 152, 184]) {
    F.line(x0, FLOOR, lerp(x0, vx, 0.72), lerp(FLOOR, vy, 0.72), 3, 1);
    F.line(x0, 20, lerp(x0, vx, 0.72), lerp(20, vy, 0.72), 2, 1);
  }
  F.box(vx - 9, vy - 11, 18, 22, 4, 1);
  for (let d = 0; d < 3; d++) {
    const dy = 62 + d * 16 + b;
    const out = Math.max(0, Math.sin(u * TAU * (1.5 + d * 0.7) + d * 2.1)) * 13;
    F.box(6, dy, 20 + out, 10, 5, 1);
    F.line(14 + out, dy + 5, 18 + out, dy + 5, 5, 1);
  }
  return { FLOOR, b };
}
function windowAt(F, wx, FLOOR) {
  F.box(wx, 40, 26, 44, 6, 2);
  F.line(wx + 13, 40, wx + 13, 84, 5, 1);
  F.line(wx, 62, wx + 26, 62, 5, 1);
  F.line(wx - 4, 84, wx + 30, 84, 6, 1);
}

export default {
  n: "01", slug: "01b-out-of-life-blend", title: "OUT OF LIFE",
  tagline: "the filmed room and the drawn one, one substance",
  accent: "#5aa7ff", seed: 1015,
  drone: { base: 16.35, steps: [0, 0, -11, -9, -12] },
  movements: [
    {
      label: "THE SEARCH", seconds: 13,
      line: "What we've made, we don't want. What we've sold — to the world, to ourselves — doesn't exist. I look for a way out: through the hallways, within the drawers, and fire escapes.",
      cues: [
        { at: 0.28, f: 190, decay: 0.10, gain: 0.5, partials: [1, 2.7, 5.3], noise: 0.7, nDecay: 0.012, seed: 11 },
        { at: 0.62, f: 160, decay: 0.12, gain: 0.5, partials: [1, 2.7, 5.3], noise: 0.7, nDecay: 0.012, seed: 12 },
      ],
      draw(u, F) {
        const { FLOOR } = room(F, u);
        windowAt(F, 158, FLOOR);
        const p = smooth(Math.abs(((u * 2.2) % 2) - 1));
        const x = lerp(34, 140, p);
        const face = ((u * 2.2) % 2) < 1 ? 1 : -1;
        /* headTurn leads the eye toward the window he's failing to reach —
           the same thing the filmed frame does: he sits looking at it before
           he ever gets up. */
        F.fig(x, FLOOR, 34, { mode: "walk", phase: u * 7, face, lean: face * 0.06,
                               guise: "poet", headTurn: face * 0.4 }, 7);
      },
    },
    {
      label: "MORE HAZE", seconds: 13,
      fx: { smear: { taps: 1, spread: 0.014, fall: 2.0 } },
      line: "The vape gathers, inside and out. My vision blurs. I move toward the window — and you only get further away. More haze.",
      draw(u, F) {
        const { FLOOR } = room(F, u, 0.5);
        const wx = lerp(150, 176, smooth(u));
        windowAt(F, wx, FLOOR);
        /* the turned back: GUISES.turned, because from behind the beard is
           gone and hair is the only mark that still says who he is */
        F.fig(wx + 13, 84, 22, { mode: "stand", arms: "down", guise: "turned", phase: u * 1.7 }, 5);
        F.ink(wx + 16, 66, 8);
        const px = lerp(50, wx - 22, smooth(u * 0.9));
        F.fig(px, FLOOR, 34, { mode: "walk", phase: u * 6, face: 1, arms: "reach",
                                guise: "poet", headTurn: 0.5 }, 7);
        const claim = u * 1.25;
        F.map((x, y, v) => {
          const edge = x / F.W + (F.n2(x * 0.06, y * 0.06) - 0.5) * 0.22;
          if (edge < claim - 0.04) {
            const h = F.fbm(x * 0.09 + u * 2.2, y * 0.11, 2);
            return h > 0.60 ? 3 : h > 0.43 ? 2 : 1;
          }
          if (edge < claim && F.bayer(x, y) < (claim - edge) / 0.04) {
            return 2;
          }
        });
      },
    },
    {
      label: "THE FALL", seconds: 13,
      line: "It was the maze, constructed by a tainted love. You fall off the fire escape, into darkness — and the city streaks upward like it's leaving too.",
      cues: [{ at: 0.06, f: 90, decay: 0.5, gain: 0.6, partials: [1, 1.5, 2.2], noise: 0.9, nDecay: 0.09, seed: 21 }],
      draw(u, F) {
        const v = u * 640;
        for (const [bx, bw, sp] of [[2, 30, 1.00], [36, 18, 1.22], [140, 20, 1.14], [166, 26, 0.94]]) {
          F.rect(bx, 0, bw, F.H, 1);
          for (let k = 0; k < 26; k++) {
            const yy = ((k * 9 + F.H * 4 - v * sp) % (F.H + 30)) - 15;
            F.line(bx + 1, yy, bx + bw - 1, yy, 2, 1);
            for (let w = 0; w < 3; w++) {
              if (F.noise(bx + w, k) > 0.55) F.rect(bx + 3 + w * (bw - 6) / 3, yy + 2, 3, 4, 4);
            }
          }
          F.line(bx, 0, bx, F.H, 3, 1); F.line(bx + bw - 1, 0, bx + bw - 1, F.H, 3, 1);
        }
        const gap = 24 + Math.sin(u * TAU * 2) * 3;
        const cy = 40 + smooth(u) * 30;
        const roll = Math.sin(u * TAU * 0.8) * 0.5;
        F.fig(84, cy + gap, 30, { mode: "stand", rot: 1.5 + roll, arms: "open" }, 7);   // the EX, falling first
        F.ink(90, cy + gap - 20, 8);
        /* arms:"open" (not "reach") — the filmed body at this point is fully
           spread against the sparks, and "reach" read as a different man */
        F.fig(110, cy, 33, { mode: "stand", rot: -1.4 - roll, arms: "open", face: -1,
                              guise: "poet" }, 7);
        const R = F.rng(31);
        for (let k = 0; k < 16; k++) {
          const sx = 70 + R() * 58, sy = ((R() * 200 + u * 300 * (0.7 + R() * 0.6)) % 190) - 20;
          const a = R() * TAU + u * TAU * (R() > 0.5 ? 2 : -2);
          F.line(sx + Math.cos(a) * 4, sy + Math.sin(a) * 4, sx - Math.cos(a) * 4, sy - Math.sin(a) * 4, 6, 1.4);
        }
      },
    },
    {
      label: "AS DARK AS BLACK", seconds: 14,
      line: "I trip on my own words, falling out of life — and find where you go when you leave. The gap between us breathes, and never closes.",
      cues: [{ at: 0.62, f: 62, decay: 1.1, gain: 0.5, partials: [1, 2.01, 3.02], noise: 0.2, nDecay: 0.3, seed: 41 }],
      draw(u, F) {
        const gap = 24 + Math.sin(u * TAU * 2) * 3;
        const cy = 60;
        F.fig(86, cy + gap, 24, { mode: "stand", rot: 1.9, arms: "open" }, 2);
        F.fig(112, cy, 27, { mode: "stand", rot: -2.1, arms: "open", face: -1, guise: "poet" }, 3);
        const flood = u * 1.35;
        F.map((x, y, v) => {
          const d = Math.hypot(x - 100, y - 44) / 150;
          if (F.bayer(x, y) < (flood - d) * 1.6) return 7;
        });
        if (u > 0.45) {
          const pulse = 0.6 + 0.4 * Math.sin(u * TAU * 5);
          F.put(100, 44, 8);
          if (pulse > 0.85) { F.put(101, 44, 8); F.put(100, 43, 8); }
        }
      },
    },
  ],
};

/* ============================================================================
   FOOTAGE — what the shell overlays on top of the computed field above.

   Aligned positionally with `movements` (index 0 = THE SEARCH, no title-card
   entry — the title card is always pure drawing). Each entry is an ARRAY of
   SEGMENTS covering successive slices of that movement's own u ∈ [0,1); a
   movement may have one segment (a single treatment ridden the whole way) or
   several (a movement that changes footage, register or blend mode partway
   through, per BLEND-NOTES.md).

   A segment:
     u0, u1     the slice of the movement's u this segment owns
     t0, t1     footage seconds at u0 and u1 — sampled by linear interpolation
                of local progress, NOT by the video's own playback rate. The
                clip is scrubbed by u, exactly like the drawing is.
     opts       passed straight to ingest.mjs's sample()
     blend      one of blend.mjs's exports: swap | wipe | byLevel | noiseSwap
                | figureLock
     blendOpts  the extra positional args each blend fn takes beyond (a,b,t)
     mix(p)     p is LOCAL progress through the segment, 0..1 — returns the
                blend's own t. Defaults to identity (a straight ride) when
                omitted.
   ========================================================================= */
export const footage = {
  src: "footage/01-out-of-life-lead.mp4",
  duration: 88.38,
  movements: [
    /* 0 · THE SEARCH — footage of the room stays footage; the drawn figure
       is locked in at full ink from the first frame (figureLock does not
       schedule the figure itself). `mix` rides the ROOM from footage to
       drawing across the whole thirteen seconds, so by the time he reaches
       the window the room has become the same ink he is. */
    [
      { u0: 0, u1: 1, t0: 20.0, t1: 29.0,
        opts: { channel: "luma", black: 0, white: 0.35, tone: "invert", dither: "bayer" },
        blend: "figureLock", blendOpts: { threshold: 3.5 },
        mix: (p) => smooth(p) },
    ],
    /* 1 · MORE HAZE — "he empties out before the room does." Segment A keys
       the dissolve to the FOOTAGE's own darkness (byLevel): the poet, raising
       his hand into the haze, is the darkest mass on screen and is the first
       thing to convert. Segment B is the turned back at the fire escape —
       figureLock again, GUISES.turned locked in, the smoke-choked landing
       around him still footage until the very end of the movement. */
    [
      { u0: 0, u1: 0.55, t0: 29.5, t1: 34.0,
        opts: { channel: "luma", black: 0, white: 0.55, tone: "invert", dither: "bayer" },
        blend: "byLevel", blendOpts: { reverse: false },
        mix: (p) => ss(0, 1, p) * 0.85 },
      { u0: 0.55, u1: 1, t0: 35.0, t1: 39.0,
        opts: { channel: "luma", black: 0, white: 0.5, tone: "invert", dither: "bayer" },
        blend: "figureLock", blendOpts: { threshold: 3.5 },
        mix: (p) => 0.55 + ss(0, 1, p) * 0.4 },
    ],
    /* 2 · THE FALL — the surreal one, three registers in thirteen seconds.
       Seg 1: the roof, the leap — a torn noiseSwap, the schedule starting to
       tear before he's even off the ledge. Seg 2: WARP RIPPLE through the
       sparks (EXPERIMENTS #6) — a coordinate remap costs the falling body
       nothing, so he stays crisp while the field around him buckles. Seg 3:
       kaleido "radial" folds the sparks into a rose window — which, per
       EXPERIMENTS, blots any FILMED body caught in it into a Rorschach smear.
       That is used on purpose here: the footage becomes pure vision-texture
       and the two DRAWN bodies (unaffected — they are `b`, not `a`) are what
       stays legible. Going further than EXPERIMENTS shipped, because this is
       the one movement the brief asks to. */
    [
      { u0: 0, u1: 0.3, t0: 56.0, t1: 60.5,
        opts: { channel: "luma", black: 0, white: 0.55, tone: "invert", dither: "bayer" },
        blend: "noiseSwap", blendOpts: { s: 0.4, opts: { scale: 0.05, seed: 21 } },
        mix: (p) => p },
      { u0: 0.3, u1: 0.68, t0: 62.0, t1: 69.0,
        opts: { channel: "luma", black: 0, white: 0.7, tone: "invert", dither: "bayer",
                warp: 0.6, warpScale: 0.02 },
        blend: "swap", blendOpts: {},
        mix: (p) => smooth(p) },
      { u0: 0.68, u1: 1, t0: 71.0, t1: 79.5,
        opts: { channel: "luma", black: 0, white: 0.6, tone: "invert", dither: "bayer",
                kaleido: "radial", radialSlices: 8, warp: 0.25, warpScale: 0.03 },
        blend: "noiseSwap", blendOpts: { s: 0.75, opts: { scale: 0.03, seed: 62 } },
        mix: (p) => 0.15 + smooth(p) * 0.75 },
    ],
    /* 3 · AS DARK AS BLACK — the night register (EXPERIMENTS #2): the footage
       is the tail of the clip fading through its own bright flare to black,
       widened white point so only the fading highlight stays paper and
       everything else is already ink — the same field the flood is filling.
       An even swap, because this movement's own drama is the flood, not the
       footage; the footage just needed to already agree with it. */
    [
      { u0: 0, u1: 0.7, t0: 82.0, t1: 87.0,
        opts: { channel: "luma", black: 0.02, white: 0.85, tone: "invert", dither: "bayer" },
        blend: "swap", blendOpts: {},
        mix: (p) => Math.min(1, p * 1.4) },
    ],
  ],
};
