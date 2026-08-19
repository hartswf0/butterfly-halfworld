/* ============================================================================
   04 · NEVERMORE — a WYGWYL halfworld

   ONE TRAIL, FOLLOWED TWICE, and each time it ends in a body part taken back
   and sworn over in the same breath: the heart out of the debris, the hands
   off the bare ground. So the film is built as two identical arcs in inverted
   material — the first half is ink arriving on paper, the second is paper
   carved out of ink, and the vow is the same word both times, arriving on the
   Bayer schedule in whichever substance the half is made of.

   The descent is monotone and one-way: dusk shore (paper sky) → moonlit field
   (a flat level-2 night) → the deepest dark the suite has. Nothing in this
   world brightens again. "Nevermore" is not the grief here, it is the hinge.
   ========================================================================= */
import { TAU, lerp, clamp01, smooth, ss, win } from "../halfworld.mjs";

/* --------------------------------------------------------------- the sea
   Horizontal wavefronts. calm ∈ 0..1 does TWO things at once, because the
   line asks for both: it kills the amplitude AND collapses the row spacing,
   so the sea does not merely go still, it FOLDS — ten swells stacking into a
   tight sheaf of whispers. An earlier pass only flattened the sine and the
   result was a ruled page: nine identical parallels, evenly spaced, dead.
   Every row is broken twice at its own x, because ten unbroken full-width
   lines is exactly the stripe the dot law warns about. */
const SEA_TOP = 6, SEA_ROWS = 10, FOLD_Y = 22, HOR = 53;
function seaRowY(F, u, calm, k, x) {
  const y0 = lerp(SEA_TOP + k * 4.4, FOLD_Y + k * 1.7, calm);
  const amp = (1 - calm) * (1.3 + k * 0.5);
  return y0 + Math.sin(x * 0.085 + u * TAU * (0.45 + k * 0.07) + k * 1.7) * amp;
}
function wavefronts(F, u, calm) {
  for (let k = 0; k < SEA_ROWS; k++) {
    const gA = (F.noise(k, 11) * 150) | 0, gB = (F.noise(k, 23) * 150) | 0;
    const l = calm > 0.55 ? 4 : 3;
    for (let x = 0; x < F.W; x++) {
      if ((x > gA && x < gA + 15) || (x > gB && x < gB + 11)) continue;
      F.ink(x, Math.round(seaRowY(F, u, calm, k, x)), l);
    }
  }
}

/* the sand under the ash of expired wildfires. A flat quantised drift, three
   tones, no ramp — the ash is a deposit, not a shading. */
function ashSand(F) {
  F.map((x, y) => {
    if (y <= HOR + 1) return;
    const a = F.fbm(x * 0.045, y * 0.075, 3);
    if (a > 0.615) return 3;
    if (a > 0.50) return 2;
    if (a > 0.42) return 1;
  });
  F.line(0, HOR + 1, 66, HOR + 2, 4, 1);
  F.line(78, HOR + 2, 140, HOR + 1, 4, 1);
  F.line(150, HOR + 1, 192, HOR + 2, 4, 1);
}

/* an arc torn out of a ring. A shard of a circle carries a circle's worth of
   information, which is the only reason a broken tambourine is still legible
   as a tambourine lying in the sand. */
function shard(F, cx, cy, r, a0, a1, rot, l) {
  const n = Math.max(4, Math.ceil((a1 - a0) * r * 1.4));
  const c = Math.cos(rot), s = Math.sin(rot);
  let px = 0, py = 0;
  for (let k = 0; k <= n; k++) {
    const a = a0 + (a1 - a0) * k / n;
    const dx = Math.cos(a) * r, dy = Math.sin(a) * r;
    const x = cx + dx * c - dy * s, y = cy + dx * s + dy * c;
    if (k) F.line(px, py, x, y, l, 1.6);
    px = x; py = y;
  }
}

/* the trail. Drawn by the same function both times it is followed — that
   sameness is the whole grammar, so it is one function and not two. */
function trail(F, adv, N, P, l) {
  const n = Math.floor(clamp01(adv) * N);
  for (let k = 0; k <= n && k < N; k++) {
    const [x, y, s] = P(k / (N - 1));
    const off = (k % 2 ? 1 : -1) * 2.4 * s;
    F.disc(x + off, y, Math.max(0.9, 2.5 * s), l);
    F.disc(x + off * 0.45, y - 3.6 * s, Math.max(0.7, 1.8 * s), l);
  }
}

/* lub-dub. Pure in u, two strikes per cycle, the second softer. */
function throb(u, rate) {
  const p = (u * rate) % 1;
  const q = (p - 0.27 + 1) % 1;
  return Math.min(1, Math.exp(-p * 11) + 0.62 * Math.exp(-q * 11));
}

/* the organ itself: two lobes and a filled taper. It is drawn solid because
   it is the one object in the film that has to survive being small. */
function heart(F, cx, cy, s, l, beat) {
  F.disc(cx - s * 0.46, cy - s * 0.30, s * 0.54, l);
  F.disc(cx + s * 0.46, cy - s * 0.30, s * 0.54, l);
  const H = s * 1.18;
  for (let y = 0; y <= H; y++) {
    const w = s * 0.98 * (1 - y / H);
    F.line(cx - w, cy - s * 0.14 + y, cx + w, cy - s * 0.14 + y, l, 1);
  }
  /* THE ONE ACCENT IN THE FILM is this pulse, and it is the same object each
     time it appears — lifted in M2, leading the second trail in M3, back in
     the chest in M6. Rejected: an accent on the moon, on the blooms, on the
     vow. A world gets one blue mark and it belongs to the thing being taken
     back. */
  F.put(cx, cy - s * 0.15, 8);
  if (beat > 0.45) { F.put(cx - 1, cy - s * 0.15, 8); F.put(cx + 1, cy - s * 0.15, 8); }
  if (beat > 0.80) { F.put(cx, cy - s * 0.15 - 1, 8); F.put(cx, cy - s * 0.15 + 1, 8); }
}

/* a hand: palm, four fingers, a thumb set off to the side. The thumb is the
   only reason this reads as a hand and not a rake, so it is never omitted. */
function hand(F, cx, cy, s, rot, spread, l) {
  const c = Math.cos(rot), sn = Math.sin(rot);
  const R = (px, py) => [cx + px * c - py * sn, cy + px * sn + py * c];
  F.disc(cx, cy, s * 0.40, l);
  for (let k = 0; k < 4; k++) {
    const a = -Math.PI / 2 + (k - 1.5) * spread;
    const len = s * (0.98 - Math.abs(k - 1.3) * 0.11);
    const [bx, by] = R(Math.cos(a) * s * 0.34, Math.sin(a) * s * 0.34);
    const [tx, ty] = R(Math.cos(a) * len, Math.sin(a) * len);
    F.line(bx, by, tx, ty, l, Math.max(1, s * 0.13));
  }
  const ta = -2.72;
  const [bx, by] = R(Math.cos(ta) * s * 0.32, Math.sin(ta) * s * 0.32);
  const [tx, ty] = R(Math.cos(ta) * s * 0.76, Math.sin(ta) * s * 0.76);
  F.line(bx, by, tx, ty, l, Math.max(1, s * 0.16));
  const [wx, wy] = R(0, s * 0.62);
  F.line(cx, cy, wx, wy, l, Math.max(1, s * 0.20));
}

/* THE VOW. Same word, same schedule, twice — but M2 lays it down as ink on a
   flat sea and M6 cuts it out of the dark. The gate needs a level nothing
   else in the band uses, so the glyphs go down at `mark` and are then
   resolved per-dot; the map is boxed to the word's own band so no other
   element of that level is caught in it. */
function vow(F, cy, arrive, mark, onTaken, onLeft) {
  F.word("NEVERMORE", 96, cy, 10, mark, true);
  F.map((x, y, v) => {
    if (y < cy - 10 || y > cy + 10 || x < 56 || x > 136) return;
    if (v !== mark) return;
    return F.bayer(x, y) < arrive ? onTaken : onLeft;
  });
}

/* -------------------------------------------------------------- the garden
   The night arrives here as a flat level-2 tone and never leaves. Its lower
   edge is wobbled by noise, because a ruled horizon across 192 cells is the
   stripe again — this is the same law as the broken floor, applied to a
   boundary between two tones rather than to a line. */
function gardenNight(F, u, withMoon) {
  F.map((x, y) => (y < 64 + (F.n2(x * 0.045, 9) - 0.5) * 8 ? 2 : undefined));
  if (withMoon) {
    F.disc(156, 24, 13, 0, true);
    F.ring(156, 24, 13.8, 4, 1);
    F.disc(151, 20, 2.4, 2); F.disc(160, 28, 1.7, 2); F.disc(158, 17, 1.3, 2);
  }
  /* furrows converging on a vanishing point at the wobbled horizon */
  for (let k = 0; k <= 13; k++) {
    const t = k / 13;
    const bx = -150 + t * 492;
    const g0 = 0.18 + F.noise(k, 5) * 0.3;
    for (let j = 0; j < 26; j++) {
      const t0 = j / 26, t1 = (j + 1) / 26;
      if (t0 > g0 && t0 < g0 + 0.13) continue;
      F.line(lerp(bx, 96, t0), lerp(146, 66, t0), lerp(bx, 96, t1), lerp(146, 66, t1), 4, 1);
    }
  }
  /* the cross-rows, in runs — these ARE full-width and so they are cut */
  for (let r = 0; r < 5; r++) {
    const y = 66 + Math.pow((r + 1) / 5, 1.75) * 74;
    const a = 20 + F.noise(r, 7) * 90, b = 110 + F.noise(r, 8) * 60;
    F.line(0, y, a, y, 3, 1); F.line(a + 16, y, b, y, 3, 1); F.line(b + 14, y, 192, y, 3, 1);
  }
}

/* a body PUNCHED OUT of whatever is already there — the only way to keep a
   figure legible once the field is at 7. F.fig only ever inks darker, so the
   negative version has to be built by hand. */
function cutFig(F, x, y, h, arms) {
  const th = Math.max(1, h * 0.095);
  const hip = [x, y - h * 0.46], sh = [x, y - h * 0.78];
  F.line(hip[0], hip[1], sh[0], sh[1], 0, th, true);
  F.line(hip[0], hip[1], x - h * 0.17, y, 0, th * 0.85, true);
  F.line(hip[0], hip[1], x + h * 0.17, y, 0, th * 0.85, true);
  const a = arms === "up" ? -h * 0.30 : -h * 0.52;
  F.line(sh[0], sh[1], x - h * 0.30, y + a, 0, th * 0.8, true);
  F.line(sh[0], sh[1], x + h * 0.30, y + a, 0, th * 0.8, true);
  F.disc(x, y - h * 0.89, h * 0.11, 0, true);
}

export default {
  n: "04", slug: "04-nevermore", title: "NEVERMORE",
  tagline: "a trail followed twice, a vow made twice",
  accent: "#5aa7ff", seed: 404,
  /* low and slow, per the note. The two vows land on the root (M2 is the
     deepest step, M6 returns) — the film ends where it swore it would. */
  drone: { base: 46, steps: [0, -5, -7, 0, 4, -12, 0] },
  movements: [
    {
      label: "WASHED ASHORE", seconds: 13,
      line: "What if I followed this trail, to where the broken pieces have washed ashore — and the ashes of expired wildfires cover sands, and debris lifted from the night sea water’s floor.",
      cues: [
        { at: 0.14, f: 80, decay: 0.7, gain: 0.45, partials: [1, 1.6, 2.3], noise: 0.9, nDecay: 0.35, seed: 41 },
        { at: 0.62, f: 72, decay: 0.8, gain: 0.4, partials: [1, 1.6, 2.3], noise: 0.9, nDecay: 0.4, seed: 42 },
        { at: 0.88, f: 1500, decay: 0.12, gain: 0.5, partials: [1, 2.6, 4.3], noise: 1.0, nDecay: 0.02, seed: 43 },
      ],
      draw(u, F) {
        wavefronts(F, u, 0);
        ashSand(F);
        /* the wildfires are expired: what is left of them is four charred
           stubs and the ash they became. Rejected: drawing flame, which is
           not in the line and would have been the only warm thing here. */
        for (const [sx, sy, sh] of [[26, 92, 13], [58, 78, 9], [112, 104, 15], [176, 86, 10]]) {
          const tl = (F.noise(sx, 3) - 0.5) * 0.5;
          F.line(sx, sy, sx + Math.sin(tl) * sh, sy - sh, 6, 2);
          F.line(sx + Math.sin(tl) * sh * 0.6, sy - sh * 0.6, sx + 6, sy - sh * 0.85, 5, 1);
          F.line(sx + Math.sin(tl) * sh * 0.4, sy - sh * 0.4, sx - 5, sy - sh * 0.75, 5, 1);
        }
        /* the broken pieces, at the top of the trail where the water left
           them: arcs off one ring, plus the jingles they tore loose with */
        const D = [[152, 80, 0.2, 2.1, 0.4], [166, 88, 2.4, 4.0, -0.8],
                   [140, 92, 3.4, 5.0, 1.9], [174, 76, 1.1, 2.6, 2.7],
                   [158, 96, 4.6, 6.1, 0.3]];
        for (const [cx, cy, a0, a1, rot] of D) shard(F, cx, cy, 9, a0, a1, rot, 6);
        for (let k = 0; k < 7; k++) {
          const j = F.rng(2 + k);
          F.disc(136 + j() * 48, 74 + j() * 28, 2.1, 5);
        }
        F.line(128, 100, 148, 97, 6, 2); F.line(160, 104, 182, 102, 6, 2);   // planks
        /* debris still out on the water, riding the swell it was lifted by —
           each piece sits ON a wavefront, so the sea carries it honestly */
        for (const [dx, row, r] of [[42, 8, 3.2], [96, 7, 2.4], [70, 9, 4.0]]) {
          const dy = seaRowY(F, u, 0, row, dx);
          F.arc(dx, dy, r, Math.PI, TAU, 5, 1);
          F.line(dx - r, dy, dx + r, dy, 5, 1);
        }
        /* the trail, and the man a little way behind its head */
        const P = (t) => [8 + t * 154, 138 - t * 56, 1 - t * 0.58];
        trail(F, u * 1.15, 20, P, 5);
        const p = clamp01(u * 0.95) * 0.82;
        const [fx0, fy0, fs] = P(p);
        F.fig(fx0, fy0, 34 * (1 - p * 0.5), { mode: "walk", phase: u * 3.4, face: 1, lean: 0.05 }, 7);
      },
    },
    {
      label: "FOLDED WHISPERS", seconds: 14,
      line: "The waves calm to folded whispers; the winds mute the trees. The right level of silence, to find a throbbing heart — it used to be mine. I lift it with care: nevermore.",
      /* NO FX AT ALL, deliberately. Every other tool in the kit — smear,
         shake, invert — is a way of making the frame louder, and this
         movement is about arriving at the right level of silence. */
      cues: [
        { at: 0.40, f: 64, decay: 0.5, gain: 0.5, partials: [1, 2.0, 3.1], noise: 0.3, nDecay: 0.08, seed: 51 },
        { at: 0.52, f: 58, decay: 0.6, gain: 0.4, partials: [1, 2.0, 3.1], noise: 0.25, nDecay: 0.09, seed: 52 },
        { at: 0.74, f: 330, decay: 1.3, gain: 0.5, partials: [1, 2.01, 3.02, 4.04], noise: 0.15, nDecay: 0.03, seed: 53 },
      ],
      draw(u, F) {
        const calm = ss(0.08, 0.62, u);
        wavefronts(F, u, calm);
        ashSand(F);
        /* the winds mute the trees: the sway amplitude is the SAME calm the
           sea obeys, so one number silences both and the mute is a single
           event rather than two coincidences */
        for (let k = 0; k < 4; k++) {
          const x = 12 + k * 11, base = 58 - k * 1.5, h = 20 + F.noise(k, 3) * 11;
          const sway = (1 - calm) * Math.sin(u * TAU * (1.1 + k * 0.3) + k) * 0.24;
          const tx = x + Math.sin(sway) * h * 0.5, ty = base - h;
          F.line(x, base, tx, ty, 5, 1.8);
          for (let j = 0; j < 7; j++) {
            const a = -Math.PI / 2 + (j - 3) * 0.42 + sway * 1.7;
            const L = h * (0.42 + F.noise(k, j) * 0.32);
            F.line(tx, ty, tx + Math.cos(a) * L, ty + Math.sin(a) * L, 5, 1);
          }
        }
        /* the debris pile it was found in, half-buried and going nowhere */
        for (const [cx, cy, a0, a1, rot] of [[86, 118, 0.4, 2.2, 0.6], [110, 124, 2.8, 4.3, -0.4], [98, 130, 3.6, 5.2, 1.4]])
          shard(F, cx, cy, 11, a0, a1, rot, 5);
        F.line(74, 132, 96, 129, 5, 2); F.line(112, 134, 134, 132, 5, 2);
        /* he kneels at it. The lift is slow because the line says care: the
           heart travels 34 cells over half the movement and never overshoots */
        F.fig(64, 132, 42, { mode: "sit", face: 1, arms: "reach" }, 7);
        const lift = ss(0.30, 0.86, u);
        const beat = throb(u, 7);
        const hx = lerp(92, 80, lift), hy = lerp(122, 96, lift);
        heart(F, hx, hy, 5.6 + beat * 0.9, 7, beat);
        /* and the vow, laid into the folded sheaf as ink */
        vow(F, 29, ss(0.42, 0.74, u), 6, 6, 0);
      },
    },
    {
      label: "MUSTARD SEEDS", seconds: 13,
      line: "What if I followed this reclaimed heart, to where the puzzle pieces of faith are handcrafted — scrambled and scattered as mustard seeds into the vast moonlit night’s garden fields.",
      fx: { shake: (u) => win(u, 0.16, 0.22, 0.32, 0.40) * 2.1 },
      cues: [
        { at: 0.10, f: 520, decay: 0.09, gain: 0.4, partials: [1, 2.3, 3.7], noise: 0.6, nDecay: 0.015, seed: 61 },
        { at: 0.24, f: 390, decay: 0.2, gain: 0.45, partials: [1, 2.1, 3.4], noise: 0.9, nDecay: 0.03, seed: 62 },
        { at: 0.70, f: 880, decay: 0.08, gain: 0.45, partials: [1, 3.3, 5.9], noise: 1.0, nDecay: 0.06, seed: 63 },
      ],
      draw(u, F) {
        gardenNight(F, u, true);
        /* THE PIECES ARE HANDCRAFTED FIRST, then scrambled, then scattered,
           and each piece keeps its own delay — so the frame always holds all
           three states at once. The first pass moved them in lockstep and the
           block simply slid down: an object being lowered, not faith coming
           apart into something you could plant. */
        const R = F.rng(5);
        for (let k = 0; k < 24; k++) {
          const r0 = R(), r1 = R(), r2 = R(), r3 = R();
          const col = k % 8, row = (k / 8) | 0;
          const hx = 96 + (col - 3.5) * 13, hy = 34 + (row - 1) * 13;
          const dk = r0 * 0.42;
          const scr = ss(0.14, 0.36, u), sca = ss(0.28 + dk, 0.74 + dk, u);
          const x = lerp(hx + (r1 - 0.5) * 26 * scr, 96 + (r3 - 0.5) * 2 * (16 + r2 * 88), sca);
          const y = lerp(hy + (r2 - 0.5) * 20 * scr, 72 + Math.pow(r2, 1.4) * 66, sca);
          const s = lerp(13, 2.6, sca);
          const rot = r1 * TAU * scr + u * TAU * 0.5 * sca;
          if (s > 5.2) {
            const h = s * 0.5, c = Math.cos(rot), sn = Math.sin(rot);
            const P = (px, py) => [x + px * c - py * sn, y + px * sn + py * c];
            const q = [P(-h, -h), P(h, -h), P(h, h), P(-h, h)];
            for (let j = 0; j < 4; j++) F.line(q[j][0], q[j][1], q[(j + 1) % 4][0], q[(j + 1) % 4][1], 6, 1);
            const tab = P(h, 0), slot = P(-h, 0);
            F.ring(tab[0], tab[1], s * 0.20, 6, 1);
            F.ring(slot[0], slot[1], s * 0.20, 6, 1);
          } else {
            F.disc(x, y, Math.max(1.1, s * 0.46), 6);
          }
        }
        /* the second trail, and the thing at its head doing the leading */
        const P2 = (t) => [96 + Math.sin(t * 2.3) * (1 - t) * 26, 142 - t * 70, 1 - t * 0.78];
        const adv = clamp01(u * 1.2);
        trail(F, adv, 18, P2, 5);
        const [hx2, hy2] = P2(Math.min(0.97, adv * 0.97));
        const beat = throb(u, 7);
        heart(F, hx2, hy2 - 12, 5.0 + beat * 0.8, 6, beat);
      },
    },
    {
      label: "THEY TURN TO FACE ME", seconds: 14,
      line: "The plants in a golden hue bloom, and face toward me in anticipation. The weeds repel, falling into the shadows where our memories hide — and mean so little, in a moment of defeat — as I’m called forward.",
      cues: [
        { at: 0.30, f: 210, decay: 0.5, gain: 0.4, partials: [1, 1.5, 2.4], noise: 0.4, nDecay: 0.12, seed: 71 },
        { at: 0.66, f: 95, decay: 0.4, gain: 0.45, partials: [1, 1.7, 2.6], noise: 0.8, nDecay: 0.2, seed: 72 },
      ],
      draw(u, F) {
        gardenNight(F, u, false);
        const open = ss(0.05, 0.52, u);
        const lane = 11 + smooth(u) * 17;
        /* A HEAD THAT TURNS IS AN ELLIPSE WHOSE X-RADIUS OPENS. That is the
           entire mechanism and it is the only one that makes "face toward me"
           a fact rather than a caption: at face=0 the bloom is a vertical
           sliver seen edge-on, at face=1 it is a full disc with a punched
           centre. The turn is staggered by noise so the field turns raggedly,
           the way a thing that is alive does. Rejected: rotating the whole
           plant, which just made the rows wobble. */
        for (let r = 0; r < 5; r++) {
          const z = r / 4;
          const gy = 140 - z * 60, sc = 1 - z * 0.60;
          const per = 5 + r * 2, spread = lerp(210, 66, z);
          for (let i = 0; i < per; i++) {
            const x = 96 + ((i + 0.5) / per - 0.5) * spread;
            if (Math.abs(x - 96) < lane) continue;
            const n = F.noise(r, i);
            const face = ss(0.16 + n * 0.30, 0.56 + n * 0.30, u);
            const H = 26 * sc, hx = x, hy = gy - H;
            F.line(x, gy, hx, hy + 5 * sc, 4, Math.max(1, 1.6 * sc));
            F.line(x, gy - H * 0.45, x - 7 * sc, gy - H * 0.62, 3, 1);
            F.line(x, gy - H * 0.30, x + 7 * sc, gy - H * 0.48, 3, 1);
            const rr = 6.2 * sc, rx = Math.max(0.8, rr * face);
            for (let dy = -rr; dy <= rr; dy++) {
              const w = rx * Math.sqrt(Math.max(0, 1 - (dy / rr) * (dy / rr)));
              F.line(hx - w, hy + dy, hx + w, hy + dy, 5, 1);
            }
            for (let k = 0; k < 10; k++) {
              const a = k / 10 * TAU;
              F.line(hx + Math.cos(a) * rx, hy + Math.sin(a) * rr,
                     hx + Math.cos(a) * rx * (1 + open * 0.85), hy + Math.sin(a) * rr * (1 + open * 0.85), 5, 1);
            }
            /* the golden hue is a hole: the centre is punched to paper, so a
               bloom facing you is the brightest thing on a level-2 night */
            if (face > 0.3) F.disc(hx, hy, Math.max(0.8, rx * 0.44), 0, true);
          }
        }
        /* the weeds repel — they do not wilt, they let go and fall */
        const fall = smooth(clamp01((u - 0.18) / 0.66));
        for (let k = 0; k < 13; k++) {
          const wx = 14 + F.noise(k, 21) * 168, wy0 = 88 + F.noise(k, 22) * 44;
          if (Math.abs(wx - 96) < lane * 0.6) continue;
          const wy = wy0 + fall * (60 + F.noise(k, 23) * 30);
          const tw = fall * (F.noise(k, 24) - 0.5) * 4;
          for (let j = 0; j < 5; j++) {
            const a = -Math.PI / 2 + (j - 2) * 0.5 + tw;
            const L = 9 + F.noise(k, j) * 7;
            F.line(wx, wy, wx + Math.cos(a) * L, wy + Math.sin(a) * L, 3, 1);
          }
        }
        /* the shadow rises from the bottom edge on the ordered schedule —
           dot by dot, so the weeds are REPLACED by it rather than covered */
        const sh = 144 - smooth(u) * 54;
        F.map((x, y) => {
          const d = (y - sh) / 24;
          if (d > 0 && F.bayer(x, y) < d) return 7;
        });
        /* and inside it, what hides there: two figures cut out of the dark,
           small enough to mean so little. They are only visible BECAUSE the
           shadow arrived, which is the line's whole claim. */
        if (sh < 128) { cutFig(F, 46, 140, 19); cutFig(F, 62, 138, 17, "up"); }
        /* called forward: the lane opens and the prints come at the camera */
        trail(F, u, 9, (t) => [96 + Math.sin(t * 1.6) * 5, 70 + t * t * 72, 0.35 + t * 0.85], 6);
      },
    },
    {
      label: "DEEPEST DARKNESS", seconds: 12,
      line: "The clouds mute the stars for the deepest level of darkness — welcoming extra hard work, to search the bare ground for two hands.",
      cues: [
        { at: 0.16, f: 42, decay: 1.8, gain: 0.55, partials: [1, 1.3, 1.9], noise: 0.6, nDecay: 0.7, seed: 81 },
        { at: 0.78, f: 170, decay: 0.08, gain: 0.35, partials: [1, 2.4], noise: 0.9, nDecay: 0.02, seed: 82 },
      ],
      draw(u, F) {
        /* THE DARKEST FRAME IN THE FILM, and it gets there in the first two
           fifths so that the remaining eight seconds are the work rather than
           the arrival. Rejected: ramping the dark across the whole movement,
           which spent the movement on a dimmer and left no time to search. */
        const dark = ss(0.0, 0.40, u);
        const S = F.rng(9);
        for (let k = 0; k < 46; k++) {
          const sx = Math.round(S() * F.W), sy = Math.round(S() * 56), big = S() > 0.8;
          F.ink(sx, sy, 5);
          if (big) { F.ink(sx + 1, sy, 4); F.ink(sx - 1, sy, 4); F.ink(sx, sy + 1, 4); F.ink(sx, sy - 1, 4); }
        }
        F.line(0, 62, 68, 63, 4, 1); F.line(80, 63, 192, 62, 4, 1);
        const G = F.rng(10);
        for (let k = 0; k < 110; k++) F.disc(G() * F.W, 64 + G() * 78, 0.9, 2);
        /* the clouds are lumps, not a curtain: the fbm decides which dots go
           first, so the stars are muted one at a time and unevenly */
        F.map((x, y) => {
          const c = F.fbm(x * 0.03 + dark * 0.9, y * 0.045, 3);
          const d = dark * 1.38 - 0.30 + (c - 0.5) * 0.9;
          if (F.bayer(x, y) < d) return 7;
        });
        /* the reach of touch: an island of ground he has actually got his
           hands on, dithered out at its own edge. It drifts right across the
           movement while shuddering — the search is not a sweep, it is work */
        const px = lerp(46, 138, smooth(u)) + Math.sin(u * TAU * 2.4) * 14;
        F.map((x, y) => {
          const d = Math.hypot((x - px) / 50, (y - 108) / 34);
          if (d < 1 && F.bayer(x, y) < (1 - d) * 1.5) return 0;
        });
        F.line(px - 40, 112, px - 8, 111, 3, 1); F.line(px + 4, 111, px + 38, 112, 3, 1);
        const P2 = F.rng(11);
        for (let k = 0; k < 40; k++) F.disc(px - 46 + P2() * 92, 88 + P2() * 50, 1.0, 3);
        F.fig(px - 4, 124, 30, { mode: "sit", face: 1, arms: "reach" }, 7);
        /* what he has not found yet, at the far lip of the island, arriving
           only as far as the dither lets it */
        const near = ss(0.45, 0.95, u);
        if (near > 0.02) {
          hand(F, 140, 116, 12, 2.5, 0.36, 3);
          hand(F, 158, 122, 12, 2.1, 0.32, 3);
          F.map((x, y, v) => {
            if (v === 3 && x > 126 && y > 100 && F.bayer(x, y) > near) return 7;
          });
        }
      },
    },
    {
      label: "I PUT THEM BACK ON", seconds: 14,
      line: "Hands that once could touch dust after dusk, and feel good — they too used to be mine. I put them back on, with the care of my future at stake: nevermore.",
      cues: [
        { at: 0.16, f: 200, decay: 0.1, gain: 0.4, partials: [1, 2.4], noise: 0.9, nDecay: 0.03, seed: 91 },
        { at: 0.60, f: 150, decay: 0.3, gain: 0.45, partials: [1, 2.0, 3.3], noise: 0.5, nDecay: 0.05, seed: 92 },
        { at: 0.80, f: 330, decay: 1.4, gain: 0.5, partials: [1, 2.01, 3.02, 4.04], noise: 0.12, nDecay: 0.03, seed: 93 },
      ],
      draw(u, F) {
        F.clear(7);
        /* the same island of touch as M5, held still and opened wide — he has
           stopped searching, so the ground stops moving under him */
        F.map((x, y) => {
          const d = Math.hypot((x - 96) / 64, (y - 100) / 46);
          if (d < 1 && F.bayer(x, y) < (1 - d) * 1.5) return 0;
        });
        F.line(34, 128, 84, 127, 4, 1); F.line(96, 127, 158, 128, 4, 1);
        const G = F.rng(13);
        for (let k = 0; k < 70; k++) F.disc(38 + G() * 116, 100 + G() * 40, 1.0, 3);
        /* dust after dusk: it does not settle, it hangs and turns over, and
           it is the one thing here that is allowed to feel good */
        const D = F.rng(21);
        for (let k = 0; k < 60; k++) {
          const mx = 38 + D() * 116, r1 = D(), r2 = D();
          const my = 78 + r1 * 54 - Math.sin(u * TAU * (0.5 + r2 * 0.8) + mx * 0.3) * 5 - u * 10;
          F.disc(mx, my, 0.9, 3);
        }
        const fit = ss(0.28, 0.70, u);
        F.fig(96, 130, 44, { mode: "stand", arms: "open" }, 7);
        /* they used to be mine: found on the ground, lifted, and set back on
           the ends of the arms. The travel is short and slow — a fitting, not
           a catch. Rejected: throwing them, which made a juggling act of the
           one gesture in the film that is supposed to cost something. */
        const L = [lerp(60, 82, fit), lerp(124, 103, fit)];
        const Rt = [lerp(134, 110, fit), lerp(120, 103, fit)];
        hand(F, L[0], L[1], 13, lerp(2.6, 3.14, fit), lerp(0.36, 0.24, fit), 7);
        hand(F, Rt[0], Rt[1], 13, lerp(-2.4, 3.14, fit), lerp(0.34, 0.24, fit), 7);
        /* and the heart is where it was put back, still keeping time */
        const beat = throb(u, 7);
        heart(F, 96, 108, 3.6 + beat * 0.7, 7, beat);
        /* THE SAME VOW AS M2, IN THE INVERTED MATERIAL: there it was ink
           arriving on a flat sea, here it is paper cut out of the dark. Same
           word, same schedule, opposite substance — which is the only way I
           found to say a thing twice and have it mean more the second time. */
        vow(F, 20, ss(0.38, 0.74, u), 1, 0, 7);
      },
    },
  ],
};
