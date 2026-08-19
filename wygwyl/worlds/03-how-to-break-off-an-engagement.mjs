/* ============================================================================
   03 · HOW TO BREAK OFF AN ENGAGEMENT — a WYGWYL halfworld

   The tambourine that went through a window in 02 arrives here through a rose
   window, still whole, and leaves in pieces. Between those two facts: an empty
   temple, a storm that takes everything that was ever called goods, and two
   sets of footprints walking away from what the water kept.
   ========================================================================= */
import { TAU, lerp, clamp01, smooth, ss, win } from "../halfworld.mjs";
import { tambourine } from "./02-flashing-lights.mjs";

/* the nave: pews in perspective, choir stands, prayer lines. Drawn the same
   in M1, M3 and M4 so the storm has a real building to take apart. */
function nave(F, u, decay = 0) {
  F.line(0, 132, 84, 132, 6, 1); F.line(96, 132, 192, 132, 6, 1);
  for (const s of [-1, 1]) {
    F.line(96 + s * 88, 132, 96 + s * 20, 62, 4, 1);            // the aisle
    for (let k = 0; k < 7; k++) {
      const z = 1 - k / 7;
      const y = 62 + (1 - z * z) * 70, w = 6 + z * z * 62;
      const gone = decay > 0.1 && F.noise(k, s) < decay;
      if (gone) continue;
      F.line(96 + s * 14 + s * w * 0.1, y, 96 + s * (14 + w), y, 5, 1.4);
      F.line(96 + s * (14 + w), y, 96 + s * (14 + w), y - 4 - z * 6, 4, 1);
    }
  }
  /* choir stands, empty, tiered */
  for (let k = 0; k < 3; k++) {
    const y = 56 - k * 6, x0 = 66 + k * 5, x1 = 126 - k * 5;
    F.line(x0, y, x1, y, 4, 1);
    for (let j = 0; j < 5; j++) F.line(x0 + j * (x1 - x0) / 4, y, x0 + j * (x1 - x0) / 4, y - 4, 3, 1);
  }
}

/* the rose window. quantised petals — the one circle in the suite that is
   architecture rather than an object. */
export function roseWindow(F, cx, cy, r, u, l = 6) {
  F.ring(cx, cy, r, l, 1.6);
  F.ring(cx, cy, r * 0.34, l, 1.2);
  for (let k = 0; k < 12; k++) {
    const a = k / 12 * TAU + u * 0.12;
    F.line(cx + Math.cos(a) * r * 0.34, cy + Math.sin(a) * r * 0.34,
           cx + Math.cos(a) * r, cy + Math.sin(a) * r, l - 1, 1);
    const ma = a + TAU / 24;
    F.arc(cx + Math.cos(ma) * r * 0.67, cy + Math.sin(ma) * r * 0.67, r * 0.3, 0, TAU, l - 2, 1);
  }
}

export default {
  n: "03", slug: "03-how-to-break-off-an-engagement", title: "HOW TO BREAK OFF AN ENGAGEMENT",
  tagline: "the storm takes everything that was ever called goods",
  accent: "#5aa7ff", seed: 303,
  /* KEY: G Aeolian, two octaves down — natural minor for a heartbreak that
     is sad rather than violent, and low because 03 is one of the three
     darkest films in the suite (with 01 and 09). */
  drone: { base: 24.50, steps: [0, 0, 7, 3, -9, -5, -12] },
  movements: [
    {
      label: "ODE TO FOREVER", seconds: 13,
      line: "Ode to forever — a tambourine sounds off an empty temple, empty choir stands, empty prayer lines.",
      cues: [
        { at: 0.20, f: 1100, decay: 0.5, gain: 0.45, partials: [1, 2.7, 5.1, 7.9], noise: 0.9, nDecay: 0.03, seed: 71 },
        { at: 0.66, f: 1100, decay: 0.6, gain: 0.4, partials: [1, 2.7, 5.1, 7.9], noise: 0.9, nDecay: 0.03, seed: 72 },
      ],
      draw(u, F) {
        nave(F, u);
        /* the sound in an empty room: rings that leave and find nothing */
        for (let k = 0; k < 4; k++) {
          const p = ((u * 1.3 + k / 4) % 1);
          F.ring(96, 74, p * 130, Math.max(1, Math.round(4 - p * 3)), 1);
        }
        tambourine(F, 96, 74, 11, u * TAU, 7);
        F.box(38, 96, 22, 14, 4, 1); F.box(132, 96, 22, 14, 4, 1);   // baptism pools, dry
      },
    },
    {
      label: "STILL WHOLE", seconds: 12,
      line: "And abandoned baptism pools. It flies in through the rose window — still whole.",
      fx: { kaleido: "quad" },
      cues: [{ at: 0.44, f: 1250, decay: 0.7, gain: 0.5, partials: [1, 2.7, 5.1], noise: 0.8, nDecay: 0.02, seed: 81 }],
      draw(u, F) {
        /* the window is quartered by the glass itself; the object crossing it
           is quartered too, which is what a rose window does to any light */
        roseWindow(F, 96, 72, 58, u, 6);
        const p = smooth(u);
        tambourine(F, lerp(30, 96, p), lerp(20, 72, p), lerp(4, 12, p), u * TAU * 3, 7);
        F.arc(96, 118, 26, Math.PI, TAU, 4, 1);                       // the pool below
      },
    },
    {
      label: "COBWEBS", seconds: 13,
      line: "Pews taken by cobwebs, and doused in disintegration. Spirits have left salvations in opened gift boxes, placed outside the side doors.",
      draw(u, F) {
        nave(F, u, u * 0.3);
        /* the webs arrive on the ordered schedule — the pews are not covered,
           they are replaced, dot by dot */
        const take = smooth(u);
        F.map((x, y, v) => {
          if (v < 1) return;
          const w = F.fbm(x * 0.11, y * 0.11 + 3, 2);
          if (F.bayer(x, y) < take * w * 1.6) return 2;
        });
        for (let k = 0; k < 5; k++) {
          const cx = 20 + k * 40, cy = 40 + (k % 2) * 18;
          for (let j = 0; j < 6; j++) {
            const a = j / 6 * TAU + k;
            F.line(cx, cy, cx + Math.cos(a) * 16, cy + Math.sin(a) * 16, 2, 1);
          }
          for (let r = 5; r <= 15; r += 5) F.ring(cx, cy, r, 2, 1);
        }
        /* the gift boxes, opened, outside the side doors */
        for (const [bx, lid] of [[16, 0.7], [46, 0.4], [148, 0.9], [172, 0.55]]) {
          F.box(bx, 112, 16, 12, 6, 1);
          const a = lid * 1.1 + Math.sin(u * TAU + bx) * 0.06;
          F.line(bx, 112, bx + Math.cos(-a) * 17, 112 - Math.sin(a) * 17, 5, 1);
          F.line(bx, 118, bx + 16, 118, 3, 1);
        }
      },
    },
    {
      label: "UNTIL NOTHING REMAINS", seconds: 15,
      line: "It thunders. Then rains until nothing remains. What was once love, now goods — broken and sealed apart by lightning. Daily breads, soaked and delivered rotted by rain; and blankets, soiled by venomous puppeteers.",
      fx: { shake: (u) => (Math.sin(u * TAU * 2.5) > 0.9 ? 2.6 : 0) },
      cues: [
        { at: 0.10, f: 55, decay: 1.4, gain: 0.6, partials: [1, 1.4, 2.1], noise: 0.7, nDecay: 0.5, seed: 91 },
        { at: 0.52, f: 48, decay: 1.6, gain: 0.6, partials: [1, 1.3, 2.0], noise: 0.8, nDecay: 0.6, seed: 92 },
      ],
      draw(u, F) {
        nave(F, u, 0.2 + u * 0.7);
        /* rain: vertical dashes, never a sheet. a sheet is a gradient */
        const R = F.rng(3);
        for (let k = 0; k < 200; k++) {
          const x = R() * F.W, y0 = (R() * 200 + u * 700) % 190 - 30;
          F.line(x, y0, x + 1, y0 + 7, 4, 1);
        }
        /* venomous puppeteers: strings from a ceiling with nobody on it,
           and the blankets they work hang and turn */
        for (let k = 0; k < 5; k++) {
          const x = 24 + k * 36 + Math.sin(u * TAU * 0.9 + k) * 5;
          F.line(x, 0, x, 70 + Math.sin(u * TAU + k) * 6, 5, 1);
          const by = 70 + Math.sin(u * TAU + k) * 6;
          F.rect(x - 9, by, 18, 16, 3);
          F.line(x - 9, by, x + 9, by, 6, 1);
        }
        /* lightning: the only BREAK in this world, and it seals things apart */
        const strike = Math.sin(u * TAU * 2.5);
        if (strike > 0.9) {
          let lx = 60 + F.noise(Math.floor(u * 40), 5) * 70;
          for (let y = 0; y < 132; y += 6) {
            const nx = lx + (F.noise(Math.floor(u * 40), y) - 0.5) * 22;
            F.line(lx, y, nx, y + 6, 7, 2);
            lx = nx;
          }
          F.map((x, y, v) => (F.bayer(x, y) < (strike - 0.9) * 6 ? 7 - v : undefined));
        }
      },
    },
    {
      label: "TWO SETS OF FOOTSTEPS", seconds: 13,
      line: "Ode to the storm ending. Ode to two sets of mud-imprinted footsteps, leading away from what the water kept.",
      cues: [{ at: 0.3, f: 150, decay: 0.09, gain: 0.35, partials: [1, 2.2], noise: 0.9, nDecay: 0.03, seed: 101 }],
      draw(u, F) {
        /* mud: a flat quantised field, not a texture. the water kept the rest */
        F.rect(0, 96, F.W, 48, 2);
        F.map((x, y, v) => (y > 96 && F.fbm(x * 0.08, y * 0.14, 2) > 0.56 ? 3 : undefined));
        F.line(0, 96, 74, 95, 5, 1); F.line(86, 95, 192, 96, 5, 1);
        /* the prints arrive one at a time — ADVANCE, with a dwell */
        const n = Math.floor(u * 22);
        for (let k = 0; k <= n && k < 22; k++) {
          const p = k / 22;
          const x = 172 - p * 168, y = 138 - p * 36;
          const s = 1 - p * 0.55;
          F.disc(x, y, 3 * s, 5); F.disc(x + 5 * s, y - 5 * s, 2.6 * s, 5);
        }
        /* what the water kept, behind them: a shape under a flat surface */
        F.line(4, 90, 60, 90, 4, 1); F.line(72, 90, 188, 90, 4, 1);
        F.arc(150, 90, 14, Math.PI, TAU, 3, 1);
        tambourine(F, 150, 84, 10, 0.4, 3, 8);
      },
    },
    {
      label: "SHATTERED", seconds: 13,
      line: "And a tambourine, shattered into pieces. What if I followed this trail, to where the broken pieces have washed ashore?",
      cues: [{ at: 0.24, f: 1600, decay: 0.25, gain: 0.6, partials: [1, 1.6, 2.8, 4.9], noise: 1.0, nDecay: 0.05, seed: 111 }],
      draw(u, F) {
        /* IT COMES APART ALONG THE RING and every piece keeps its curvature —
           a shard of a circle is still a circle's worth of information, which
           is the only reason the eye can still assemble a tambourine from it.
           The first pass flew the shards apart in the first fifth of the
           movement and left eleven seconds of nearly empty paper; the break
           now runs the whole length, so the object is legible while it goes. */
        const b = smooth(u) * 0.92;
        const N = 11, r = 34, CX = 96, CY = 62;
        for (let k = 0; k < N; k++) {
          const a0 = k / N * TAU, a1 = (k + 0.78) / N * TAU, mid = (a0 + a1) / 2;
          /* Each shard KEEPS ITS SEAT ON THE RING and travels outward along its
             own radius, turning about its own middle. An earlier pass rebased
             every shard to the centre before moving it, which piled all eleven
             into one blob — a tambourine that shattered inward. */
          const fly = b * (14 + F.noise(k, 1) * 58);
          const drop = b * b * 46;
          const spin = b * (F.noise(k, 2) - 0.5) * 3.4;
          const mx = CX + Math.cos(mid) * r, my = CY + Math.sin(mid) * r;
          const ox = Math.cos(mid) * fly, oy = Math.sin(mid) * fly + drop;
          const cs = Math.cos(spin), sn = Math.sin(spin);
          const P = (t) => {
            const a = a0 + (a1 - a0) * t;
            const dx = CX + Math.cos(a) * r - mx, dy = CY + Math.sin(a) * r - my;
            return [mx + dx * cs - dy * sn + ox, my + dx * sn + dy * cs + oy];
          };
          const seg = 8;
          for (let j = 0; j < seg; j++) {
            const [px, py] = P(j / seg), [qx, qy] = P((j + 1) / seg);
            F.line(px, py, qx, qy, 7, 2);
          }
          F.disc(mx + ox, my + oy, 2.4, 6);          // the jingle it tore loose with
        }
        /* and the trail, already leaving the frame toward 04 */
        F.line(0, 128, 70, 126, 3, 1); F.line(84, 126, 192, 124, 3, 1);
        const n = Math.floor(clamp01((u - 0.35) / 0.65) * 12);
        for (let k = 0; k <= n && k < 12; k++) F.disc(12 + k * 15, 134 - k * 0.5, 2.4, 4);
      },
    },
  ],
};
