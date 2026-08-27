/* ============================================================================
   01 · OUT OF LIFE — a WYGWYL halfworld

   The beflix film's own motifs, restaged: the haze claims the room left to
   right (a per-dot allegiance swap, not a fade); the gap between the falling
   bodies is 24 cells, breathes ±3, and never closes; his words fall beside
   him as tumbling dashes; the last light in the film is the vape ember.
   ========================================================================= */
import { TAU, lerp, clamp01, smooth, ss, win } from "../halfworld.mjs";

/* the apartment, drawn the same way in M1 and M2 so the haze has something
   real to take. breathe: the walls move under 1% of frame — a HOLD, deniable */
function room(F, u, breathe = 1) {
  const b = Math.sin(u * TAU) * 0.8 * breathe;
  const FLOOR = 116 + b * 0.4;
  /* floor band, broken (an unbroken full-width bar stripes the frame) */
  F.line(0, FLOOR, 70, FLOOR, 6, 1); F.line(78, FLOOR, 132, FLOOR, 6, 1);
  F.line(140, FLOOR, 192, FLOOR, 6, 1);
  /* the hallway: perspective lines to a vanishing point that will not sit
     still — the maze rearranging itself while he searches it */
  const vx = 96 + (F.n2(u * 3.1, 7.7) - 0.5) * 44, vy = 74 + b;
  for (const x0 of [8, 40, 152, 184]) {
    F.line(x0, FLOOR, lerp(x0, vx, 0.72), lerp(FLOOR, vy, 0.72), 3, 1);
    F.line(x0, 20, lerp(x0, vx, 0.72), lerp(20, vy, 0.72), 2, 1);
  }
  F.box(vx - 9, vy - 11, 18, 22, 4, 1);           // the far door of the maze
  /* drawers, pulled out and pushed in by nobody */
  for (let d = 0; d < 3; d++) {
    const dy = 62 + d * 16 + b;
    const out = Math.max(0, Math.sin(u * TAU * (1.5 + d * 0.7) + d * 2.1)) * 13;
    F.box(6, dy, 20 + out, 10, 5, 1);
    F.line(14 + out, dy + 5, 18 + out, dy + 5, 5, 1);   // the pull
  }
  return { FLOOR, b };
}
/* the window he moves toward. it is drawn honestly; it recedes anyway */
function windowAt(F, wx, FLOOR) {
  F.box(wx, 40, 26, 44, 6, 2);
  F.line(wx + 13, 40, wx + 13, 84, 5, 1);
  F.line(wx, 62, wx + 26, 62, 5, 1);
  F.line(wx - 4, 84, wx + 30, 84, 6, 1);          // the fire escape lip
}

export default {
  n: "01", slug: "01-out-of-life", title: "OUT OF LIFE",
  tagline: "the maze, the haze, the fall, the ember",
  accent: "#5aa7ff", seed: 101,
  /* THE FILM'S OWN PASSAGE of the suite's 24-minute score, taken from the
     original running order. The runtime stretches this film's movements to
     fill it, so picture and record line up without either being cut. */
  window: [0, 122.99],
  /* KEY: C Phrygian, two octaves down (C0) — the suite's tonal centre at its
     darkest register, because 01 ends "as dark as black" and nothing after
     it goes lower; the flat 2nd is the haze closing in before the fall. */
  drone: { base: 16.35, steps: [0, 0, -11, -9, -12] },
  /* PROSODY · Morocco · Malhun / qsida. Free at the head and inevitable at the end: the breath tightens from 9.5s
     to 4.2s a pass, and the room itself is not allowed to speak until past the
     halfway mark, so the film speaks in objects before it speaks in weather.
     `deep/sonify.mjs` scans the field under this law. The root is the drone's
     own base folded into one octave, so the film sings in the key it hums in. */
  score: { engine: "malhun", mode: "bayati" },
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
        /* he searches: crossing the room, turning, crossing back. The two
           cues are what he startles at — a drawer, a latch — and the head
           catches the sound a beat before the body would, which is what
           makes it a reaction instead of a coincidence of timing. */
        const p = smooth(Math.abs(((u * 2.2) % 2) - 1));
        const x = lerp(34, 140, p);
        const face = ((u * 2.2) % 2) < 1 ? 1 : -1;
        const startle = Math.max(Math.exp(-(((u - 0.28) / 0.045) ** 2)), Math.exp(-(((u - 0.62) / 0.045) ** 2)));
        F.fig(x, FLOOR, 34, {
          mode: "walk", phase: u * 7.35, face, lean: face * 0.06, guise: "poet",
          /* scanning while he walks, then a sharp glance at the startle */
          headTurn: Math.max(-1, Math.min(1, face * (0.45 + 0.30 * Math.sin(u * TAU * 4.4)) - startle * face * 0.9)),
          headTilt: startle * 0.5,
        }, 7);
      },
    },
    {
      label: "MORE HAZE", seconds: 13,
      line: "The vape gathers, inside and out. My vision blurs. I move toward the window — and you only get further away. More haze.",
      /* ONE TAP, NOT TWO. Every smear tap is a full redraw, and this movement's
         redraw ends in an fbm evaluated per cell — at two taps the frame cost
         hit 19ms and the film dropped frames on the one movement whose subject
         is that seeing is getting harder. One tap still blurs the figure, and
         the haze supplies the rest of the softness by itself. */
      fx: { smear: { taps: 1, spread: 0.014, fall: 2.0 } },
      draw(u, F) {
        const { FLOOR } = room(F, u, 0.5);
        /* the window is the EX: every step toward it, it gets further away */
        const wx = lerp(150, 176, smooth(u));
        windowAt(F, wx, FLOOR);
        /* the turned back — the guise is set from the same clip figure.mjs
           was measured off, so the silhouette here is unmistakably her even
           with no face to read. She has stopped moving toward anything;
           weight settles onto one hip the way a body does at a window it
           has given up on reaching. */
        F.fig(wx + 13, 84, 22, {
          mode: "stand", arms: "down", guise: "turned", phase: u * 1.7,
          weight: 0.82, headTilt: -0.25,
        }, 5);
        F.ink(wx + 16, 66, 8);                                        // the ember
        /* the ember breathes with the drag she is not taking yet */
        if (Math.sin(u * TAU * 1.3 + 2) > 0.72) F.ink(wx + 17, 65, 7);
        const px = lerp(50, wx - 22, smooth(u * 0.9));
        F.fig(px, FLOOR, 34, {
          mode: "walk", phase: u * 6.35, face: 1, arms: "reach", guise: "poet",
          headTurn: 0.5,                                    // he leads with his eyes on her
        }, 7);
        /* the haze claims the room left to right — dot by dot, an allegiance
           swap. one substance replacing another, never two coexisting */
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
        /* THE CITY STREAKS UPWARD. It is held at levels 2–4 and pushed to the
           edges, because the two bodies are the subject and a body at 7 has to
           have somewhere to be legible. The first pass gave the towers the
           whole frame at full ink and the fall became a smear on wallpaper. */
        const v = u * 640;
        for (const [bx, bw, sp] of [[2, 30, 1.00], [36, 18, 1.22], [140, 20, 1.14], [166, 26, 0.94]]) {
          F.rect(bx, 0, bw, F.H, 1);
          for (let k = 0; k < 26; k++) {
            const yy = ((k * 9 + F.H * 4 - v * sp) % (F.H + 30)) - 15;
            F.line(bx + 1, yy, bx + bw - 1, yy, 2, 1);              // floor slabs
            for (let w = 0; w < 3; w++) {                            // lit windows
              if (F.noise(bx + w, k) > 0.55) F.rect(bx + 3 + w * (bw - 6) / 3, yy + 2, 3, 4, 4);
            }
          }
          F.line(bx, 0, bx, F.H, 3, 1); F.line(bx + bw - 1, 0, bx + bw - 1, F.H, 3, 1);
        }
        /* TWO BODIES. The gap is 24 cells, it breathes ±3, it never closes.
           They tumble but do not spin: past about a radian the stick figure
           stops reading as a person and the scene loses its subject. */
        const gap = 24 + Math.sin(u * TAU * 2) * 3;
        const cy = 40 + smooth(u) * 30;
        const roll = Math.sin(u * TAU * 0.8) * 0.5;
        /* both bodies brace against the tumble — a crouch that tightens as
           the fall goes on, not the loose open pose of somebody standing */
        const brace = 0.10 + smooth(u) * 0.22;
        F.fig(84, cy + gap, 30, {
          mode: "stand", rot: 1.5 + roll, arms: "open", phase: u * 5.35,
          crouch: brace, headTilt: -0.4,
        }, 7);   // the EX, falling first
        F.ink(90, cy + gap - 20, 8);                                                     // the ember, still lit
        F.fig(110, cy, 33, {
          mode: "stand", rot: -1.4 - roll, arms: "reach", face: -1, phase: u * 4.35,
          guise: "poet", crouch: brace, headTurn: -0.6, headTilt: -0.3,
          gesture: [-15, 8],                                 // reaching back for her
        }, 7);
        /* he trips on his own words: they fall beside him as tumbling dashes,
           each one keeping its own rate, none of them landing */
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
        /* the two bodies persist, faint, gap still breathing — until the ink
           takes them. the flood is per-dot, scheduled from the edges in */
        const gap = 24 + Math.sin(u * TAU * 2) * 3;
        const cy = 60;
        F.fig(86, cy + gap, 24, { mode: "stand", rot: 1.9, arms: "open", phase: u * 3.35, crouch: 0.28 }, 2);
        F.fig(112, cy, 27, {
          mode: "stand", rot: -2.1, arms: "reach", face: -1, phase: u * 2.35,
          guise: "poet", crouch: 0.28, gesture: [-15, 8],
        }, 3);
        const flood = u * 1.35;
        F.map((x, y, v) => {
          const d = Math.hypot(x - 100, y - 44) / 150;     // distance from the ember
          if (F.bayer(x, y) < (flood - d) * 1.6) return 7;
        });
        /* the last light in the film is the vape: a blue speck on black */
        if (u > 0.45) {
          const pulse = 0.6 + 0.4 * Math.sin(u * TAU * 5);
          F.put(100, 44, 8);
          if (pulse > 0.85) { F.put(101, 44, 8); F.put(100, 43, 8); }
        }
      },
    },
  ],
};
