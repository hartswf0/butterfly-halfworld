/* ============================================================================
   01b · OUT OF LIFE, BLEND — a WYGWYL halfworld, second version

   Same poem as 01-out-of-life.mjs, same four movements, same four verbatim
   lines — this version is not a rewrite, it is the same film with the actual
   lead footage let into the dot law. THE FIGURE carries GUISES.poet /
   GUISES.turned, measured off this same clip, so the silhouette reads as the
   same man whether the dot under him belongs to the camera or the drawing.

   TIMING IS THE CLIP'S, NOT THE COMPUTED FILM'S. `01-out-of-life-lead.mp4` is
   already cut to its own reading of this poem — the picture in it is timed to
   the voice. So `movements[i].seconds` below is not a round production number
   the way it is in 01-out-of-life.mjs; it is the measured length, in the
   source clip, of the passage that carries that movement's line. The mapping
   (silence-gap analysis + the visual scene order, since no transcript or ASR
   was available in this environment) is recorded in full in BLEND-NOTES.md —
   read that before changing any number here. The four durations replace the
   original 13/13/13/14 with 25.67/25.75/21.30/12.58, which is why this film
   runs to about 90s against the computed version's 58s.
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
  /* UNUSED — see BLEND-NOTES.md "THE SOUND." The clip has the poet's own
     reading on its audio track, which the shell plays directly; layering the
     suite's synthesised drone/foley under a real voice was tried by reasoning
     it through (not by ear — see the note) and rejected as very likely to
     compete with the voice rather than support it. `drone` is kept only so
     this module still matches the documented world shape; makeSound(world)
     is never called by 01b-out-of-life-blend.html. */
  drone: { base: 16.35, steps: [0, 0, -11, -9, -12] },
  movements: [
    {
      label: "THE SEARCH", seconds: 25.67,
      line: "What we've made, we don't want. What we've sold — to the world, to ourselves — doesn't exist. I look for a way out: through the hallways, within the drawers, and fire escapes.",
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
      label: "MORE HAZE", seconds: 25.75,
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
      label: "THE FALL", seconds: 21.30,
      line: "It was the maze, constructed by a tainted love. You fall off the fire escape, into darkness — and the city streaks upward like it's leaving too.",
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
      label: "AS DARK AS BLACK", seconds: 12.58,
      line: "I trip on my own words, falling out of life — and find where you go when you leave. The gap between us breathes, and never closes.",
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

   Positionally aligned with `movements` (index 0 = THE SEARCH; no entry for
   the title card, which is always pure drawing — the clip hasn't started
   "playing" yet at that point, see 01b-out-of-life-blend.html).

     clipStart   the source clip's OWN timecode, in seconds, where this
                 movement's u=0 begins. clipStart + movements[i].seconds is
                 therefore always exactly the next movement's clipStart (or
                 the end of the file, for the last one) — the shell's clock
                 for movements 1..4 IS the video's real playback position,
                 not something scrubbed frame by frame, because the clip's
                 own audio is this film's soundtrack now (see BLEND-NOTES.md)
                 and audio wants to play forward, not be sought every frame.
     segments    sub-ranges of that movement's own u ∈ [0,1) — a movement may
                 change footage register, blend mode, or both partway through
                 (most of them do; the source clip itself cuts scenes inside
                 a single spoken line). Each segment:
       u0, u1      the slice of u this segment owns
       opts        passed straight to ingest.mjs's sample()
       blend       swap | wipe | byLevel | noiseSwap | figureLock, OR
                   "figureLockTorn" — a composite defined in the shell (not
                   in blend.mjs, which is not edited): noiseSwap's torn
                   schedule for the environment, with the drawn figure(s)
                   still locked in per figureLock's own rule. Used where the
                   brief asks for BOTH a torn dissolve AND a protected body.
       blendOpts   the extra positional args that blend fn takes
       mix(p)      p is local progress through the segment, 0..1 — returns
                   the blend's own t (absolute, 0..1, not relative to the
                   segment before it — see BLEND-NOTES.md for why each curve
                   is shaped the way it is, including the deliberate DROPS).
   ========================================================================= */
export const footage = {
  src: "footage/01-out-of-life-lead.mp4",
  duration: 88.38,
  movements: [
    /* 0 · THE SEARCH — clip 3.08 → 28.75 (25.67s). Seg A is the exterior fog
       shot with its own walking silhouette (a different vantage of the same
       man, low in the mix — this is atmosphere arriving before the room
       does, not the room itself). Seg B carries the neon title card's own
       fade and then the room; figureLock keeps the drawn walker solid ink
       throughout while the room around him rides footage → drawing. */
    {
      clipStart: 3.08,
      segments: [
        { u0: 0, u1: 0.3475,
          opts: { channel: "luma", black: 0, white: 0.5, tone: "invert", dither: "bayer" },
          blend: "swap", blendOpts: {},
          mix: (p) => 0.05 + 0.17 * smooth(p) },
        { u0: 0.3475, u1: 1,
          opts: { channel: "luma", black: 0, white: 0.35, tone: "invert", dither: "bayer" },
          blend: "figureLock", blendOpts: { threshold: 3.5 },
          mix: (p) => 0.22 + 0.78 * smooth(p) },
      ],
    },
    /* 1 · MORE HAZE — clip 28.75 → 54.50 (25.75s), FOUR beats in the source:
       haze/vape (byLevel — "he empties out before the room does," the
       poet's own dark mass is the first thing to convert), the turned back
       at the fire-escape landing (figureLock, GUISES.turned), a framed TV
       showing something else entirely ("my vision blurs" — kept deliberately
       LOW in the mix: it is not his room and should not read as if it were,
       so the mix DROPS here rather than continuing to climb), then the
       kitchen haze closing back in (byLevel again) as he fails to reach the
       window. */
    {
      clipStart: 28.75,
      segments: [
        { u0: 0, u1: 0.2233,
          opts: { channel: "luma", black: 0, white: 0.55, tone: "invert", dither: "bayer" },
          blend: "byLevel", blendOpts: { reverse: false },
          mix: (p) => lerp(0.0, 0.55, smooth(p)) },
        { u0: 0.2233, u1: 0.4175,
          opts: { channel: "luma", black: 0, white: 0.5, tone: "invert", dither: "bayer" },
          blend: "figureLock", blendOpts: { threshold: 3.5 },
          mix: (p) => lerp(0.55, 0.75, smooth(p)) },
        { u0: 0.4175, u1: 0.6699,
          opts: { channel: "luma", black: 0, white: 0.6, tone: "linear", edge: 0.6, dither: "bayer" },
          blend: "noiseSwap", blendOpts: { s: 0.5, opts: { scale: 0.04, seed: 39 } },
          mix: (p) => lerp(0.75, 0.25, smooth(p)) },
        { u0: 0.6699, u1: 1,
          opts: { channel: "luma", black: 0, white: 0.55, tone: "invert", dither: "bayer" },
          blend: "byLevel", blendOpts: { reverse: false },
          mix: (p) => lerp(0.25, 0.7, smooth(p)) },
      ],
    },
    /* 2 · THE FALL — clip 54.50 → 75.80 (21.30s), the surreal one, three
       registers, figureLock (or its torn cousin) the whole way so the two
       drawn bodies never dissolve even as the environment tears itself
       apart around them: roof + leap (torn), the plunge through sparks
       (WARP RIPPLE, EXPERIMENTS #6 — a coordinate remap costs the locked
       bodies nothing), then the climb into the golden climax (kaleido
       "radial" + torn noiseSwap — per EXPERIMENTS this blots any FILMED
       body caught in it into a Rorschach smear, which is fine, even good,
       because the bodies that have to read here are the DRAWN ones,
       unaffected because figureLock reads them off `b`, not `a`). */
    {
      clipStart: 54.5,
      segments: [
        { u0: 0, u1: 0.3521,
          opts: { channel: "luma", black: 0, white: 0.55, tone: "invert", dither: "bayer" },
          blend: "figureLockTorn", blendOpts: { threshold: 3.5, s: 0.5, opts: { scale: 0.05, seed: 21 } },
          mix: (p) => lerp(0.3, 0.55, smooth(p)) },
        { u0: 0.3521, u1: 0.7277,
          opts: { channel: "luma", black: 0, white: 0.7, tone: "invert", dither: "bayer",
                  warp: 0.6, warpScale: 0.02 },
          blend: "figureLock", blendOpts: { threshold: 3.5 },
          mix: (p) => lerp(0.55, 0.65, smooth(p)) },
        { u0: 0.7277, u1: 1,
          opts: { channel: "luma", black: 0, white: 0.6, tone: "invert", dither: "bayer",
                  kaleido: "radial", radialSlices: 8, warp: 0.25, warpScale: 0.03 },
          blend: "figureLockTorn", blendOpts: { threshold: 3.5, s: 0.75, opts: { scale: 0.03, seed: 62 } },
          mix: (p) => lerp(0.65, 0.85, smooth(p)) },
      ],
    },
    /* 3 · AS DARK AS BLACK — clip 75.80 → 88.38 (12.58s): the SAME shot THE
       FALL was just in, continuing past the hand-off — the golden climax
       blooming into a halo, the clip's own closing title card fading over
       it, then true black. Widened white point (EXPERIMENTS #2, the NIGHT
       register) so only that fading highlight stays paper and everything
       else is already ink, agreeing with the computed flood this movement
       is doing anyway. No figureLock: the two bodies here are drawn faint
       (levels 2–3, "the gap between us breathes") and are meant to be as
       dissolvable as everything else in this movement, not protected. */
    {
      clipStart: 75.8,
      segments: [
        { u0: 0, u1: 1,
          opts: { channel: "luma", black: 0.02, white: 0.85, tone: "invert", dither: "bayer" },
          blend: "swap", blendOpts: {},
          mix: (p) => Math.min(1, smooth(p) * 1.3) },
      ],
    },
  ],
};
