/* ============================================================================
   02 · FLASHING LIGHTS — a WYGWYL halfworld

   A silent scream is a scream whose rings travel INWARD. That is the whole
   grammar of this world: everything that should radiate, collapses. The walls
   cave, the pupil opens and we go through it, the ghost arrives at the wrong
   age, and the one object that finally leaves the room does so through glass.
   ========================================================================= */
import { TAU, lerp, clamp01, smooth, ss, win } from "../halfworld.mjs";

/* the room, caving. cave ∈ 0..1 — at 1 the walls have taken half the frame */
function caving(F, u, cave) {
  const L = lerp(8, 60, cave), R = lerp(184, 132, cave), C = lerp(10, 40, cave);
  F.line(L, C, L, 132, 6, 2); F.line(R, C, R, 132, 6, 2);
  F.line(L, C, 84, C - 2, 5, 1); F.line(96, C - 2, R, C, 5, 1);   // ceiling, broken
  F.line(L, 132, 80, 132, 6, 1); F.line(92, 132, R, 132, 6, 1);   // floor, broken
  return { L, R, C };
}

/* a tambourine: a ring, and the jingles that make it a tambourine */
export function tambourine(F, cx, cy, r, rot, l = 7, jingles = 8) {
  F.ring(cx, cy, r, l, 1.6);
  for (let k = 0; k < jingles; k++) {
    const a = rot + k / jingles * TAU;
    F.disc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, Math.max(1, r * 0.14), l);
  }
}

export default {
  n: "02", slug: "02-flashing-lights", title: "FLASHING LIGHTS",
  tagline: "the scream that travels inward",
  accent: "#5aa7ff", seed: 202,
  /* KEY: G Phrygian (the suite's fifth), one octave down — the flat 2nd
     keeps the scream turned inward instead of resolving outward, so no
     bright: this drone stays as dark as the loss films around it. */
  drone: { base: 49.00, steps: [0, 1, 8, 3, -2, 5, 1] },
  movements: [
    {
      label: "SILENT SCREAM", seconds: 13,
      line: "It was the type of silent scream a trapped lover makes to escape: a pending marriage, a concussion, a set of walls caving inward.",
      fx: { shake: (u) => ss(0.55, 0.8, u) * 3.2 * (1 - ss(0.86, 1, u)) },
      cues: [{ at: 0.58, f: 420, decay: 0.06, gain: 0.55, partials: [1, 3.1, 6.7], noise: 0.8, nDecay: 0.02, seed: 21 }],
      draw(u, F) {
        const cave = smooth(u);
        caving(F, u, cave);
        const hx = 96, hy = 62;
        /* the scream: five rings, and every one of them is coming home */
        for (let k = 0; k < 5; k++) {
          const p = (u * 1.6 + k / 5) % 1;
          F.ring(hx, hy + 2, lerp(52, 4, p), Math.round(lerp(1, 5, p)), 1);
        }
        /* the scream tightens him: crouch and weight both climb with `cave`,
           so the same number that closes the walls also closes the body —
           one mechanism, not a wall event and a body event coinciding by
           chance. Head thrown back is the scream's own shape. */
        F.fig(hx, 132, 46, {
          mode: "stand", arms: "up", phase: u * 3.35, weight: 0.22,
          crouch: 0.10 + cave * 0.22, headTilt: -0.7,
        }, 7);
        F.disc(hx, hy + 8, 3.2, 0);                              // the open mouth
        /* the pending marriage: two rings that approach and do not touch */
        const d = lerp(30, 9, smooth(u));
        F.ring(hx - d, 30, 7, 6, 1.4); F.ring(hx + d, 30, 7, 6, 1.4);
      },
    },
    {
      label: "THE MIRROR", seconds: 12,
      line: "An emergency call while tossing and turning — the silent call a man makes to the mirror after midnight, to digest a truth.",
      fx: { kaleido: "x" },
      cues: [
        { at: 0.10, f: 950, decay: 0.05, gain: 0.4, partials: [1, 2], noise: 0.2, nDecay: 0.01, seed: 31 },
        { at: 0.18, f: 950, decay: 0.05, gain: 0.4, partials: [1, 2], noise: 0.2, nDecay: 0.01, seed: 32 },
        { at: 0.62, f: 950, decay: 0.05, gain: 0.4, partials: [1, 2], noise: 0.2, nDecay: 0.01, seed: 33 },
      ],
      draw(u, F) {
        /* drawn only on the left; the mirror supplies the right, and the
           reflection is exact, which is the problem */
        F.line(0, 128, 88, 128, 6, 1);
        F.box(10, 26, 62, 74, 5, 2);                             // the mirror frame
        const sway = Math.sin(u * TAU * 1.5) * 3;
        /* three dial-tone cues, three small flinches — the ring landing
           on his shoulder before he can decide not to react to it */
        const ring1 = Math.max(
          Math.exp(-(((u - 0.10) / 0.03) ** 2)),
          Math.exp(-(((u - 0.18) / 0.03) ** 2)),
          Math.exp(-(((u - 0.62) / 0.03) ** 2)),
        );
        /* the phone is a gesture target, not a nearby prop — the hand lands
           exactly where the disc is drawn, so the call is held rather than
           mimed. He digests the truth with his chin down, not up at himself. */
        F.fig(44 + sway, 128, 52, {
          mode: "stand", arms: "hold", face: 1, guise: "poet", phase: u * 1.7,
          weight: 0.35, headTilt: -0.30 - ring1 * 0.35, gesture: [9, 46],
        }, 7);
        /* the phone at the ear; the call is silent both ways */
        F.disc(44 + sway + 9, 128 - 46, 3, 7);
        const dial = Math.floor(u * 7) % 7;
        for (let k = 0; k <= dial; k++) F.disc(78, 40 + k * 7, 1.6, 4);
        /* midnight, on a clock with both hands up */
        F.ring(30, 16, 8, 4, 1);
        F.line(30, 16, 30, 9, 6, 1); F.line(30, 16, 30 + Math.sin(u * TAU) * 5, 16 - Math.cos(u * TAU) * 5, 5, 1);
      },
    },
    {
      label: "WE GO THROUGH", seconds: 13,
      line: "A winless insomnia. An epiphany of a road winding down. My eyes dilate — and we go through.",
      draw(u, F) {
        /* THE ROAD IS SEEN THROUGH A PUPIL THAT IS OPENING. A dilating iris is
           the only zoom this world allows: there is no scaling pass, so getting
           closer to something has to be done by uncovering more of it.
           The aperture starts at 14 cells, and the first pass put nothing but
           the road's vanishing point inside it — twelve seconds that opened on
           blank paper. The horizon and the far light are drawn AT the vanishing
           point so the smallest aperture still contains a picture. */
        const vy = 66;
        F.line(52, vy, 88, vy, 3, 1); F.line(104, vy, 140, vy, 3, 1);   // horizon
        F.disc(96, vy - 3, 3.4, 6);                                      // the far light
        for (let k = 0; k < 26; k++) {
          const p = (k / 26 + u * 0.6) % 1, z = 1 - p;
          const w = 4 + z * z * 150, y = vy + (1 - z * z) * 66;
          const bend = Math.sin(p * 3.1 + u * 1.4) * 26 * (1 - z);
          const seg = Math.max(2, w * 0.22);
          F.line(96 + bend - w / 2, y, 96 + bend - w / 2 + seg, y, 5, 1.4);
          F.line(96 + bend + w / 2 - seg, y, 96 + bend + w / 2, y, 5, 1.4);
        }
        const R = lerp(14, 108, smooth(u));
        F.map((x, y, v) => {
          const d = Math.hypot((x - 96) * 0.92, y - 66);
          if (d > R) return 7;                                    // the iris
          if (d > R - 2.5) return 0;
        });
      },
    },
    {
      label: "THE GHOST WAS SEVEN", seconds: 14,
      line: "I was six, I recall, when the ghost of a dead and love-less seven-year-old appeared, and shared that my parents' marriage wouldn't last. A warm, heavy breeze in winter, where a child is left home alone.",
      draw(u, F) {
        F.line(0, 130, 76, 130, 6, 1); F.line(88, 130, 192, 130, 6, 1);
        F.box(120, 44, 40, 40, 5, 2); F.line(140, 44, 140, 84, 4, 1);   // the window
        /* the warm heavy breeze in winter: diagonal, and it does not cool */
        for (let k = 0; k < 22; k++) {
          const p = (k / 22 + u * 0.8) % 1;
          const x = p * 240 - 40, y = 20 + ((k * 37) % 100) + Math.sin(p * 6 + k) * 5;
          F.line(x, y, x + 11, y + 4, 2, 1);
        }
        /* SIX BREATHES; SEVEN DOES NOT. This is the one free difference the
           pose vocabulary gives the whole film, and it is the scene: a boy
           alone in his own house, drifting toward whatever is talking to
           him, and a dead child standing dead level because nothing is
           holding her up against her own weight any more. */
        const gx = 96 + Math.sin(u * TAU * 0.7) * 8;
        F.fig(64, 130, 30, {
          mode: "stand", arms: "down", guise: "child", phase: u * 1.7,
          weight: 0.28, crouch: 0.08, headTurn: Math.min(1, (gx - 64) / 40),
        }, 7);         // six
        /* the ghost is a year older and flickers on the ordered schedule */
        const gh = 35;
        F.fig(gx, 128, gh, {
          mode: "stand", arms: "open", guise: "child", breath: 0, weight: 0.5,
          headTurn: -0.3,
        }, 3);
        F.map((x, y, v) => {
          if (v === 3 && F.bayer(x, y) > 0.35 + 0.35 * Math.sin(u * TAU * 3)) return 0;
        });
        F.word("7", gx, 128 - gh - 10, 7, 4, true);
        /* the marriage, told in advance */
        F.ring(40, 24, 6, 4, 1); F.ring(40 + lerp(11, 34, smooth(u)), 24, 6, 4, 1);
      },
    },
    {
      label: "BLINDS UP", seconds: 13,
      line: "Curtains pulled, and blinds up as far and as wise as possible — to see flashing lights, and the whispering screams of two souls on a road winding down.",
      fx: { invert: (u) => (Math.sin(u * TAU * 9) > 0.72 ? 0.85 : 0) },
      cues: [
        { at: 0.22, f: 240, decay: 0.2, gain: 0.4, partials: [1, 1.9], noise: 0.5, nDecay: 0.04, seed: 51 },
        { at: 0.55, f: 240, decay: 0.2, gain: 0.4, partials: [1, 1.9], noise: 0.5, nDecay: 0.04, seed: 52 },
      ],
      draw(u, F) {
        /* the blinds go up: slats leave one at a time, from the bottom */
        const lift = smooth(u) * 15;
        for (let k = 0; k < 15; k++) {
          if (k < lift) continue;
          const y = 10 + k * 7;
          F.line(6, y, 92, y, 4, 1.5); F.line(100, y, 186, y, 4, 1.5);
        }
        /* the road winding down, and two souls on it, whispering, screaming */
        for (let k = 0; k < 16; k++) {
          const p = (k / 16 + u * 0.5) % 1, z = 1 - p;
          const y = 78 + (1 - z * z) * 52, w = 3 + z * z * 120;
          const bend = Math.sin(p * 2.6) * 20 * (1 - z);
          F.line(96 + bend - w / 2, y, 96 + bend - w / 2 + w * 0.2, y, 5, 1);
          F.line(96 + bend + w / 2 - w * 0.2, y, 96 + bend + w / 2, y, 5, 1);
        }
        for (const s of [-1, 1]) {
          const p = (u * 0.9 + (s > 0 ? 0.18 : 0)) % 1, z = 1 - p;
          const y = 80 + (1 - z * z) * 46;
          F.fig(96 + s * (6 + z * 30), y, 8 + z * 26, { mode: "walk", phase: u * 5 + s, face: s }, 6);
        }
      },
    },
    {
      label: "THROUGH THE WINDOW", seconds: 13,
      line: "And no tears, and no fucks, and no love to give. The ghost hands me a tambourine — and I throw it through the window.",
      cues: [{ at: 0.66, f: 1400, decay: 0.18, gain: 0.6, partials: [1, 1.7, 2.9, 4.4], noise: 1.0, nDecay: 0.06, seed: 61 }],
      draw(u, F) {
        F.line(0, 130, 78, 130, 6, 1); F.line(90, 130, 192, 130, 6, 1);
        const wx = 118, wy = 34, ww = 58, wh = 58;
        F.box(wx, wy, ww, wh, 6, 2);
        const hand = ss(0.05, 0.34, u), fly = ss(0.5, 0.78, u);
        F.fig(28, 130, 34, { mode: "stand", arms: "open" }, 3);        // the ghost
        F.fig(62, 130, 40, { mode: "stand", arms: "reach", face: 1 }, 7);
        /* handed over, then thrown; the arc is the only thing that leaves */
        const tx = lerp(lerp(36, 72, hand), wx + ww / 2, fly);
        const ty = lerp(96, wy + wh / 2, fly) - Math.sin(fly * Math.PI) * 22;
        tambourine(F, tx, ty, 9, u * TAU * 2, 7);
        if (u > 0.72) {
          /* the glass: cracks radiating from the point of exit, and the
             shards keep going because nothing here comes back */
          const R = F.rng(7);
          for (let k = 0; k < 16; k++) {
            const a = R() * TAU, r = (u - 0.72) * 240 * (0.5 + R());
            F.line(wx + ww / 2, wy + wh / 2, wx + ww / 2 + Math.cos(a) * r, wy + wh / 2 + Math.sin(a) * r, 6, 1);
          }
          F.map((x, y, v) => {
            if (x > wx && x < wx + ww && y > wy && y < wy + wh && F.bayer(x, y) < (u - 0.72) * 2) return 0;
          });
        }
      },
    },
  ],
};
