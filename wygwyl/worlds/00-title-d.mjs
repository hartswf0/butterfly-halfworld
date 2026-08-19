/* ============================================================================
   00 · WHERE YOU GO WHEN YOU LEAVE — THE AURA
   the fused title: the arabesque and the catalogue, with the poems inside them

   Option B ran nested rings counter-rotating at integer ratios. Option C ran a
   grid of Lissajous cells that locked, one at a time, into letters. Both are
   Whitney's one idea — a field of elements on differential phase, passing
   through order and back — seen from two distances: B from far enough away
   that the whole field is one breathing figure, C from close enough that each
   cell is its own clock.

   This is both distances at once, and a third thing that neither had.

   THE FUSION. The rings are the ground and they never stop. The cells live ON
   the rings rather than in a grid — each ring carries a ring of cells, and a
   cell's Lissajous frequency pair is derived from the ring it rides, so the
   whole field is still ONE law: ring r turns at r times the base rate, and its
   cells trace (r : r+1) figures. When a ring's cells reach a simple ratio they
   lock, and what they lock into is a letter.

   THE AURA — and this is the part that is not Whitney. A title sequence for
   fourteen poems should be haunted by them. At each ring's resonance the field
   also throws up ONE IMAGE from the films behind it: the tambourine that goes
   through a window in 02 and shatters in 03, the rose window, the moon of 09,
   the temple of 11, the daisy of 07, the hourglass of 12, the ring of 10, the
   candle of 06, the stars of 05. They arrive at low ink, hold for a breath,
   and are taken back by the rotation. Nothing announces them. If you have seen
   the films they are memories; if you have not they are ornament, and both
   readings are correct — which is the same trick the guise plays with a face.

   The tambourine and the rose window are IMPORTED from the films that own them,
   not redrawn. A motif that exists twice is two motifs.
   ========================================================================= */
import { TAU, lerp, clamp01, smooth, ss } from "../halfworld.mjs";
import { tambourine } from "./02-flashing-lights.mjs";
import { roseWindow } from "./03-how-to-break-off-an-engagement.mjs";

const CX = 96, CY = 72;

/* ---- the aura: one image per resonance, drawn faint and taken back --------
   Each is deliberately a FEW MARKS. At the ink level these run at, detail is
   noise; what has to survive is the shape you would recognise from across a
   room, which is all a memory of an image ever is. */
const AURA = [
  (F, x, y, s, l) => tambourine(F, x, y, s, 0.3, l, 8),                       // 02 / 03
  (F, x, y, s, l) => roseWindow(F, x, y, s, 0.2, l),                          // 03
  (F, x, y, s, l) => {                                                        // 09 · the moon
    F.ring(x, y, s, l, 1.4);
    for (let k = 0; k < 5; k++) {
      const a = k * 1.31, r = s * (0.30 + (k % 3) * 0.18);
      F.disc(x + Math.cos(a) * r, y + Math.sin(a) * r, s * 0.11, Math.max(1, l - 1));
    }
  },
  (F, x, y, s, l) => {                                                        // 11 · the temple
    for (let k = 0; k < 5; k++) F.line(x - s * 0.62 + k * s * 0.31, y + s * 0.55,
                                       x - s * 0.62 + k * s * 0.31, y - s * 0.18, l, 1.6);
    F.line(x - s * 0.80, y + s * 0.60, x + s * 0.80, y + s * 0.60, l, 1.4);
    F.line(x - s * 0.78, y - s * 0.24, x + s * 0.78, y - s * 0.24, l, 1.4);
    F.line(x - s * 0.78, y - s * 0.24, x, y - s * 0.72, l, 1.4);
    F.line(x + s * 0.78, y - s * 0.24, x, y - s * 0.72, l, 1.4);
  },
  (F, x, y, s, l) => {                                                        // 07 · the daisy
    F.disc(x, y, s * 0.20, l);
    for (let k = 0; k < 11; k++) {                                            // eleven, as the poem counts
      const a = k / 11 * TAU + 0.2;
      F.line(x + Math.cos(a) * s * 0.30, y + Math.sin(a) * s * 0.30,
             x + Math.cos(a) * s * 0.86, y + Math.sin(a) * s * 0.86, Math.max(1, l - 1), 1.5);
    }
    F.line(x, y + s * 0.20, x, y + s * 1.05, l, 1.4);
  },
  (F, x, y, s, l) => {                                                        // 12 · the hourglass
    F.line(x - s * 0.62, y - s * 0.72, x + s * 0.62, y - s * 0.72, l, 1.5);
    F.line(x - s * 0.62, y + s * 0.72, x + s * 0.62, y + s * 0.72, l, 1.5);
    F.line(x - s * 0.62, y - s * 0.72, x + s * 0.10, y, l, 1.4);
    F.line(x + s * 0.62, y - s * 0.72, x - s * 0.10, y, l, 1.4);
    F.line(x - s * 0.62, y + s * 0.72, x + s * 0.10, y, l, 1.4);
    F.line(x + s * 0.62, y + s * 0.72, x - s * 0.10, y, l, 1.4);
  },
  (F, x, y, s, l) => {                                                        // 10 · the ride
    F.ring(x - s * 0.52, y + s * 0.30, s * 0.40, l, 1.4);
    F.ring(x + s * 0.52, y + s * 0.30, s * 0.40, l, 1.4);
    F.line(x - s * 0.52, y + s * 0.30, x, y - s * 0.30, Math.max(1, l - 1), 1.4);
    F.line(x, y - s * 0.30, x + s * 0.52, y + s * 0.30, Math.max(1, l - 1), 1.4);
    F.line(x - s * 0.20, y - s * 0.34, x + s * 0.34, y - s * 0.44, l, 1.4);
  },
  (F, x, y, s, l) => {                                                        // 06 · the candle
    F.rect(x - s * 0.20, y - s * 0.10, s * 0.40, s * 0.95, l);
    F.line(x, y - s * 0.16, x, y - s * 0.52, l, 1.6);
    F.disc(x, y - s * 0.68, s * 0.19, Math.max(1, l - 1));
  },
  (F, x, y, s, l) => {                                                        // 05 · the stars
    for (let k = 0; k < 7; k++) {
      const a = k * 2.399, r = s * (0.22 + (k % 4) * 0.24);
      const sx = x + Math.cos(a) * r, sy = y + Math.sin(a) * r, t = s * (0.13 + (k % 3) * 0.05);
      F.line(sx - t, sy, sx + t, sy, l, 1.3);
      F.line(sx, sy - t, sx, sy + t, l, 1.3);
    }
  },
];

/* ---- the ground: rings that never stop ---------------------------------
   Ring r turns at r times the base rate, alternating direction, and carries an
   (r+1)-fold lobe so its rotation is legible in a still frame. */
function rings(F, u, gain = 1, spin = 1) {
  for (let r = 1; r <= 6; r++) {
    const dir = r % 2 ? 1 : -1;
    const th = u * TAU * r * 0.16 * dir * spin;
    const rad = 13 + r * 10.5;
    const lobe = r + 1, amp = (1.6 + r * 0.5) * gain;
    const n = Math.max(30, Math.round(rad * 2.6));
    const lvl = Math.max(1, Math.round(6 - r * 0.55));
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU + th;
      const rr = rad + Math.sin(a * lobe + th * 2) * amp;
      F.ink(Math.round(CX + Math.cos(a) * rr), Math.round(CY + Math.sin(a) * rr * 0.86), lvl);
    }
  }
}

/* ---- the cells: a Lissajous figure riding each ring ---------------------
   The frequency pair comes from the ring, so this is not a second law bolted
   to the first — it is the same law read at a smaller radius. */
function cells(F, u, count, lock, size = 5.6) {
  for (let r = 2; r <= 6; r++) {
    const per = count;
    for (let k = 0; k < per; k++) {
      const base = k / per * TAU + u * TAU * r * 0.16 * (r % 2 ? 1 : -1);
      const rad = 13 + r * 10.5;
      const px = CX + Math.cos(base) * rad, py = CY + Math.sin(base) * rad * 0.86;
      const p = r, q = r + 1;
      const ph = u * TAU * 0.9 + k * 0.7;
      /* as `lock` rises the cell's own drift is removed and it settles onto a
         clean closed figure — the resonance, held rather than passed through */
      const drift = (1 - lock) * 0.55;
      /* A LISSAJOUS FIGURE NEEDS ENOUGH SAMPLES TO BE A CURVE. At thirteen the
         cells read as loose grit on the rings rather than as small closed
         figures riding them, which loses the whole point of the catalogue half
         of this fusion — you could not see that each cell was tracing its own
         ratio. Fifty samples is still nothing next to the field's cost. */
      const seg = 50;
      const lvl = lock > 0.6 ? 6 : lock > 0.25 ? 5 : 4;
      for (let i = 0; i < seg; i++) {
        const t = i / seg * TAU;
        const x = px + Math.sin(p * t + ph) * size;
        const y = py + Math.sin(q * t * (1 + drift * 0.12) + ph * 0.6) * size * 0.8;
        F.ink(Math.round(x), Math.round(y), lvl);
      }
    }
  }
}

/* ---- the words, read out of the field ----------------------------------
   Drawn into the field and then eroded back on the ordered schedule, so the
   letters ARRIVE as the field's own dots rather than being printed over it. */
function word(F, text, y, ph, arrive) {
  F.word(text, CX, y, ph, 7, false);
  F.map((x, yy, v) => {
    if (yy < y - ph * 0.9 || yy > y + ph * 0.9) return;
    if (v !== 7) return;
    return F.bayer(x, yy) < arrive ? 7 : undefined;
  });
}

export default {
  n: "00", slug: "00-title-d", title: "WHERE YOU GO WHEN YOU LEAVE",
  tagline: "the aura — rings and cells, haunted by the fourteen",
  accent: "#5aa7ff", seed: 9004,
  /* the mp3 IS the score for this suite; the title borrows its opening. */
  audio: { src: "footage/unified-drones.mp3", from: 0, gain: 0.85 },
  drone: { base: 65.41, steps: [0, 0, 7, 12, 0] },
  movements: [
    {
      label: "THE FIELD", seconds: 9,
      line: "",
      draw(u, F) {
        rings(F, u, smooth(clamp01(u * 1.5)), 1);
        cells(F, u, 4, 0, 5.0 + smooth(u) * 1.8);
      },
    },
    {
      label: "WHERE YOU GO", seconds: 10,
      line: "",
      cues: [{ at: 0.46, f: 320, decay: 0.5, gain: 0.35, partials: [1, 2.5, 4.2], noise: 0.3, nDecay: 0.03, seed: 91 }],
      draw(u, F) {
        rings(F, u, 1, 1);
        const lock = ss(0.18, 0.50, u) * (1 - ss(0.82, 0.98, u));
        cells(F, u, 5, lock, 6.4);
        /* the first image the field remembers, arriving with the words */
        const a = ss(0.30, 0.55, u) * (1 - ss(0.72, 0.92, u));
        if (a > 0.02) AURA[0](F, CX, CY, 16 + a * 5, Math.max(1, Math.round(a * 4)));
        word(F, "WHERE YOU GO", CY, 15, ss(0.34, 0.62, u) * (1 - ss(0.86, 1, u)) * 1.15);
      },
    },
    {
      label: "THE AURA", seconds: 15,
      line: "",
      cues: [
        { at: 0.20, f: 520, decay: 0.35, gain: 0.28, partials: [1, 2.7], noise: 0.35, nDecay: 0.02, seed: 92 },
        { at: 0.62, f: 410, decay: 0.40, gain: 0.28, partials: [1, 2.4], noise: 0.35, nDecay: 0.02, seed: 93 },
      ],
      draw(u, F) {
        rings(F, u, 1, 1.25);
        cells(F, u, 4, 0.25, 6.2);
        /* NINE IMAGES, ONE PER RESONANCE, each held for about a second and a
           half and taken back by the rotation. They ride the rings' own
           positions, so a memory surfaces where the field is already turning
           rather than being placed on top of it. */
        const N = AURA.length;
        for (let k = 0; k < N; k++) {
          const c = (k + 0.5) / N;
          const a = ss(c - 0.085, c - 0.020, u) * (1 - ss(c + 0.020, c + 0.085, u));
          if (a < 0.03) continue;
          const ang = k / N * TAU + u * TAU * 0.11;
          const rad = 30 + (k % 3) * 11;
          AURA[k](F, CX + Math.cos(ang) * rad, CY + Math.sin(ang) * rad * 0.8,
                  10 + a * 8, Math.max(1, Math.round(1 + a * 4)));
        }
      },
    },
    {
      label: "WHEN YOU LEAVE", seconds: 11,
      line: "",
      cues: [{ at: 0.44, f: 260, decay: 0.7, gain: 0.35, partials: [1, 2.02, 3.01], noise: 0.25, nDecay: 0.05, seed: 94 }],
      draw(u, F) {
        rings(F, u, 1 - ss(0.72, 1, u) * 0.45, 0.8);
        const lock = ss(0.16, 0.46, u) * (1 - ss(0.78, 0.96, u));
        cells(F, u, 5, lock, 6.4);
        const a = ss(0.26, 0.50, u) * (1 - ss(0.70, 0.90, u));
        if (a > 0.02) AURA[2](F, CX, CY - 26, 12 + a * 5, Math.max(1, Math.round(a * 4)));
        word(F, "WHEN YOU LEAVE", CY, 15, ss(0.30, 0.58, u) * (1 - ss(0.84, 1, u)) * 1.15);
        /* the suite's one accent, once, on the last beat of the title */
        if (u > 0.62 && u < 0.92) F.put(CX, CY + 30, 8);
      },
    },
  ],
};
