/* ============================================================================
   04 · NEVERMORE — a WYGWYL halfworld

   ONE TRAIL, FOLLOWED TWICE, and each time it ends in a body part taken back
   and sworn over in the same breath: the heart out of the debris, the hands
   off the bare ground. So the film is built as two identical arcs in inverted
   material — the first half is ink arriving on paper, the second is paper
   carved out of ink, and the vow is the same word both times, arriving on the
   Bayer schedule in whichever substance that half is made of.

   The descent is monotone and one-way: dusk shore (paper sky) → moonlit field
   (a flat level-2 night) → the deepest dark the suite has. Nothing in this
   world brightens again. "Nevermore" is not the grief here, it is the hinge.
   ========================================================================= */
import { TAU, lerp, clamp01, smooth, ss, win } from "../halfworld.mjs";

/* --------------------------------------------------------------- the sea
   Horizontal wavefronts. calm ∈ 0..1 does TWO things at once, because the
   line asks for both: it kills the amplitude AND collapses the row spacing,
   so the sea does not merely go still, it FOLDS — ten swells stacking into a
   tight sheaf of whispers.

   The rows are spaced in perspective (crowded at the horizon, open at the
   shore) and each row's amplitude is held strictly under half its spacing.
   The first pass gave every row the same spacing and let amplitude grow with
   nearness: neighbouring crests crossed each other and the whole sea came out
   as a diamond fishnet — a plausible picture of nothing.

   Every row is broken twice at its own x. Ten unbroken full-width lines is
   exactly the stripe the dot law warns about. */
const SEA_TOP = 8, SEA_ROWS = 10, FOLD_Y = 13, HOR = 53;
function seaRowY(F, u, calm, k, x) {
  const t = k / (SEA_ROWS - 1);
  const y0 = lerp(SEA_TOP + Math.pow(t, 1.55) * (HOR - 5 - SEA_TOP), FOLD_Y + k * 1.6, calm);
  const amp = (1 - calm) * (0.3 + t * t * 2.5);
  return y0 + Math.sin(x * (0.17 - t * 0.11) + u * TAU * (0.4 + t * 0.5) + k * 1.7) * amp;
}
function wavefronts(F, u, calm) {
  const l = calm > 0.55 ? 4 : 3;
  for (let k = 0; k < SEA_ROWS; k++) {
    const gA = (F.noise(k, 11) * 150) | 0, gB = (F.noise(k, 23) * 150) | 0;
    for (let x = 0; x < F.W; x++) {
      if ((x > gA && x < gA + 15) || (x > gB && x < gB + 11)) continue;
      F.ink(x, Math.round(seaRowY(F, u, calm, k, x)), l);
    }
  }
}

/* the sand under the ash of expired wildfires. Three flat tones and a loose
   grain — the ash is a deposit, not a shading. Held at a fine frequency
   because the wide one read as weather rather than as ground. */
function ashSand(F) {
  F.map((x, y) => {
    if (y <= HOR + 1) return;
    const a = F.fbm(x * 0.085, y * 0.13, 3);
    if (a > 0.63) return 3;
    if (a > 0.53) return 2;
    if (F.noise(x, y) > 0.90) return 1;
  });
  F.line(0, HOR + 1, 66, HOR + 2, 4, 1);
  F.line(78, HOR + 2, 140, HOR + 1, 4, 1);
  F.line(150, HOR + 1, 192, HOR + 2, 4, 1);
}

/* an arc torn out of a ring, squashed because it is lying flat in the sand.
   A shard of a circle carries a circle's worth of information, which is the
   only reason a smashed tambourine is still legible as a tambourine. */
function shard(F, cx, cy, r, a0, a1, squash, l) {
  const n = Math.max(4, Math.ceil((a1 - a0) * r * 1.6));
  let px = 0, py = 0;
  for (let k = 0; k <= n; k++) {
    const a = a0 + (a1 - a0) * k / n;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * squash;
    if (k) F.line(px, py, x, y, l, 1.8);
    px = x; py = y;
  }
}
/* four arcs still seated on the ring they came off, each pushed out along its
   own radius. Scattering them freely made a handful of scribbles; keeping the
   seat is what lets the eye close the circle back up. */
function brokenRing(F, cx, cy, r, squash, l) {
  for (const [a0, a1] of [[0.20, 1.60], [1.95, 3.05], [3.40, 4.60], [4.95, 6.10]]) {
    const m = (a0 + a1) / 2;
    const ox = Math.cos(m) * r * 0.17, oy = Math.sin(m) * r * squash * 0.17;
    shard(F, cx + ox, cy + oy, r, a0, a1, squash, l);
    F.disc(cx + ox + Math.cos(a0) * r, cy + oy + Math.sin(a0) * r * squash, 2.1, l);
    F.disc(cx + ox + Math.cos(a1) * r, cy + oy + Math.sin(a1) * r * squash, 2.1, l);
  }
}

/* the trail. Drawn by the same function both times it is followed — that
   sameness is the whole grammar, so it is one function and not two. A print
   is an elongated sole with a toe pad set off it: two equal discs read as a
   pair of pebbles, and in the garden they were indistinguishable from the
   seeds lying beside them. */
function trail(F, adv, N, P, l) {
  const n = Math.floor(clamp01(adv) * N);
  for (let k = 0; k <= n && k < N; k++) {
    const [x, y, s] = P(k / (N - 1));
    const off = (k % 2 ? 1 : -1) * 2.8 * s;
    const rw = Math.max(0.9, 1.7 * s), rh = Math.max(1.2, 2.9 * s);
    for (let dy = -rh; dy <= rh; dy++) {
      const w = rw * Math.sqrt(Math.max(0, 1 - (dy / rh) * (dy / rh)));
      F.line(x + off - w, y + dy, x + off + w, y + dy, l, 1);
    }
    F.disc(x + off * 0.75, y - rh - 1.5 * s, Math.max(0.8, 1.3 * s), l);
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
  /* THE ONE ACCENT IN THE FILM is this pulse, and it is the same object every
     time it appears — lifted in M2, leading the second trail in M3, back in
     the chest in M6. Rejected: an accent on the moon, on the blooms, on the
     vow. A world gets one blue mark and it belongs to the thing being taken
     back, which is why it never lands on anything else. */
  F.put(cx, cy - s * 0.15, 8);
  if (beat > 0.45) { F.put(cx - 1, cy - s * 0.15, 8); F.put(cx + 1, cy - s * 0.15, 8); }
  if (beat > 0.80) { F.put(cx, cy - s * 0.15 - 1, 8); F.put(cx, cy - s * 0.15 + 1, 8); }
}

/* A HAND IS A SLAB WITH FIVE THINGS OFF IT, and the slab is most of it. Two
   passes were thrown away here: fingers radiating from a round palm gave a
   starfish, and long fingers off a small palm gave a broom. What reads at
   this size is a filled rectangular palm roughly as long as the fingers are,
   four short strokes off its top edge, a thumb off one side and a wrist stub
   off the bottom — the thumb and the wrist are what fix which way the hand
   is facing, so neither is ever omitted. Built in the hand's own frame and
   rotated once at the end, so `rot` really is which way the fingers point. */
function hand(F, cx, cy, s, rot, spread, l) {
  const c = Math.cos(rot), sn = Math.sin(rot);
  const W = (px, py) => [cx + px * c - py * sn, cy + px * sn + py * c];
  const pw = s * 0.30, ph = s * 0.34;
  for (let ly = -ph; ly <= ph; ly += 0.7)
    for (let lx = -pw; lx <= pw; lx += 0.7) {
      const [X, Y] = W(lx, ly);
      F.ink(Math.round(X), Math.round(Y), l);
    }
  for (let k = 0; k < 4; k++) {
    const bx = -pw + (k + 0.5) * (pw * 2 / 4);
    const a = (k - 1.5) * spread;
    const len = s * (0.54 - Math.abs(k - 1.2) * 0.055);
    const [x0, y0] = W(bx, -ph + 0.6);
    const [x1, y1] = W(bx + Math.sin(a) * len, -ph + 0.6 - Math.cos(a) * len);
    F.line(x0, y0, x1, y1, l, 1.7);
  }
  const [t0x, t0y] = W(-pw, ph * 0.2), [t1x, t1y] = W(-pw - s * 0.32, -ph * 0.5);
  F.line(t0x, t0y, t1x, t1y, l, 2);
  const [w0x, w0y] = W(0, ph), [w1x, w1y] = W(0, ph + s * 0.26);
  F.line(w0x, w0y, w1x, w1y, l, Math.max(2, s * 0.21));
}

/* THE VOW. Same word, same schedule, twice — but M2 lays it down as ink over
   a flat sea and M6 cuts it out of the dark. The gate needs a level nothing
   else in that band uses, so the glyphs go down at `mark` and are resolved
   per-dot afterwards; the map is boxed to the word's own band so no other
   element of that level is caught in it. Held at pixelHeight 14: at 10 the
   strokes were one cell wide and a half-arrived word was unreadable scatter. */
function vow(F, cy, arrive, mark, onTaken, onLeft) {
  F.word("NEVERMORE", 96, cy, 14, mark, true);
  F.map((x, y, v) => {
    if (y < cy - 14 || y > cy + 14 || x < 46 || x > 146) return;
    if (v !== mark) return;
    return F.bayer(x, y) < arrive ? onTaken : onLeft;
  });
}

/* -------------------------------------------------------------- the garden
   The night arrives here as a flat level-2 tone and never leaves. Its lower
   edge is wobbled by noise, because a ruled boundary across 192 cells is the
   stripe again — the same law as the broken floor, applied to the seam
   between two tones instead of to a line. */
const VP = 60;
function gardenNight(F, u, withMoon) {
  F.map((x, y) => (y < VP - 2 + (F.n2(x * 0.045, 9) - 0.5) * 8 ? 2 : undefined));
  if (withMoon) {
    F.disc(170, 21, 11, 0, true);
    F.ring(170, 21, 11.8, 4, 1);
    F.disc(166, 18, 2.2, 2); F.disc(174, 25, 1.6, 2); F.disc(172, 15, 1.2, 2);
  }
  for (let k = 0; k <= 13; k++) {
    const t = k / 13, bx = -150 + t * 492, g0 = 0.18 + F.noise(k, 5) * 0.3;
    for (let j = 0; j < 26; j++) {
      const t0 = j / 26, t1 = (j + 1) / 26;
      if (t0 > g0 && t0 < g0 + 0.13) continue;
      F.line(lerp(bx, 96, t0), lerp(148, VP, t0), lerp(bx, 96, t1), lerp(148, VP, t1), 4, 1);
    }
  }
  /* the cross-rows, in runs — these ARE full-width, so they are cut */
  for (let r = 0; r < 5; r++) {
    const y = VP + Math.pow((r + 1) / 5, 1.75) * 80;
    const a = 20 + F.noise(r, 7) * 90, b = 112 + F.noise(r, 8) * 58;
    F.line(0, y, a, y, 3, 1); F.line(a + 16, y, b, y, 3, 1); F.line(b + 14, y, 192, y, 3, 1);
  }
}

/* a body PUNCHED OUT of whatever is already there — the only way to keep a
   figure legible once the field is at 7. F.fig only ever inks darker, so the
   negative version has to be built by hand. */
function cutFig(F, x, y, h, arms) {
  const th = Math.max(1, h * 0.095);
  F.line(x, y - h * 0.46, x, y - h * 0.78, 0, th, true);
  F.line(x, y - h * 0.46, x - h * 0.17, y, 0, th * 0.85, true);
  F.line(x, y - h * 0.46, x + h * 0.17, y, 0, th * 0.85, true);
  const a = arms === "up" ? -h * 0.30 : -h * 0.52;
  F.line(x, y - h * 0.78, x - h * 0.30, y + a, 0, th * 0.8, true);
  F.line(x, y - h * 0.78, x + h * 0.30, y + a, 0, th * 0.8, true);
  F.disc(x, y - h * 0.89, h * 0.11, 0, true);
}

export default {
  n: "04", slug: "04-nevermore", title: "NEVERMORE",
  tagline: "a trail followed twice, a vow made twice",
  accent: "#5aa7ff", seed: 404,
  /* THE FILM'S OWN PASSAGE of the suite's 24-minute score, taken from the
     original running order. The runtime stretches this film's movements to
     fill it, so picture and record line up without either being cut. */
  window: [286.513, 421.782],
  /* low and slow, per the note. The two vows sit at the extremes — M2 on the
     deepest step of the film, M6 back on the root. It ends where it swore. */
  /* KEY: G Dorian, one octave down — the raised 6th is the vow's small,
     stubborn hope inside a trail that keeps repeating; not bright, because
     the hope stays inside a minor frame the film never fully leaves. */
  drone: { base: 49.00, steps: [0, 0, 9, 2, -3, -12, 9] },
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
           stumps with their tops torn off, and the ash they became. Two
           passes of branches were cut — upright limbs, then a single side
           stub — because each time four small stick figures appeared on the
           beach and competed with the only person in the frame. A stump is
           squat, thicker than it is tall at the base, and its break is a
           ragged horizontal, never a pair of raised arms. Rejected outright:
           drawing flame, which is not in the line and would have been the one
           warm thing in the film. */
        for (const [sx, sy, sh] of [[26, 92, 8], [58, 76, 6], [114, 108, 9], [176, 86, 7]]) {
          const tl = (F.noise(sx, 3) - 0.5) * 2.5, tx = sx + tl, ty = sy - sh;
          F.disc(sx, sy, 4.2, 3);
          F.line(sx - 2, sy, tx - 1.6, ty, 6, 3.4);
          F.line(sx + 2, sy, tx + 1.6, ty, 6, 3.4);
          F.line(tx - 3.4, ty + 1.2, tx - 1, ty - 1.4, 6, 1);
          F.line(tx - 1, ty - 1.4, tx + 1.4, ty + 0.6, 6, 1);
          F.line(tx + 1.4, ty + 0.6, tx + 3.4, ty - 1, 6, 1);
        }
        /* the broken pieces, at the top of the trail where the water left
           them — the tambourine that went out through the window in 02 and
           came apart in 03, lying open in the sand */
        brokenRing(F, 152, 84, 19, 0.5, 6);
        for (let k = 0; k < 6; k++) {
          const j = F.rng(2 + k);
          F.disc(122 + j() * 26, 96 + j() * 22, 2.0, 5);
        }
        F.rect(120, 104, 22, 3, 6); F.disc(124, 105, 1, 3); F.disc(138, 105, 1, 3);   // a plank
        /* debris still out on the water, riding the swell it was lifted by —
           each piece sits ON a wavefront, so the sea carries it honestly */
        for (const [dx, row, r] of [[42, 8, 3.2], [98, 7, 2.4], [70, 9, 4.0]]) {
          const dy = seaRowY(F, u, 0, row, dx);
          F.arc(dx, dy, r, Math.PI, TAU, 5, 1);
          F.line(dx - r, dy, dx + r, dy, 5, 1);
        }
        /* the trail, and the man a little way behind its head */
        const P = (t) => [8 + t * 150, 138 - t * 54, 1 - t * 0.58];
        trail(F, u * 1.15, 18, P, 5);
        const p = clamp01(u * 0.95) * 0.80;
        const [fx0, fy0] = P(p);
        /* he is reading the trail, not the horizon — the head stays down
           at what his feet are following */
        F.fig(fx0, fy0, 34 * (1 - p * 0.5), {
          mode: "walk", phase: u * 3.4, face: 1, lean: 0.05, guise: "poet", headTilt: -0.35,
        }, 7);
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
        /* the vow goes down FIRST so the whispers can run behind the letters
           rather than through them; the wavefronts ink at 4 and cannot climb
           over a 7, so the sheaf passes behind the word by itself */
        vow(F, 21, ss(0.32, 0.58, u), 7, 7, 0);
        wavefronts(F, u, calm);
        ashSand(F);
        /* the winds mute the trees: the sway amplitude is the SAME calm the
           sea obeys, so one number silences both and the mute is a single
           event rather than two coincidences. They stand on the sand, below
           the waterline in frame — set level with it they read as four trees
           growing out of the sea. */
        for (let k = 0; k < 4; k++) {
          const x = 146 + k * 11, base = 66 - k * 1.5, h = 15 + F.noise(k, 3) * 6;
          const sway = (1 - calm) * Math.sin(u * TAU * (1.1 + k * 0.3) + k) * 0.24;
          const tx = x + Math.sin(sway) * h * 0.5, ty = base - h;
          F.line(x, base, tx, ty, 5, 2);
          for (let j = 0; j < 7; j++) {
            const a = -Math.PI / 2 + (j - 3) * 0.44 + sway * 1.7;
            const L = h * (0.34 + F.noise(k, j) * 0.28);
            F.line(tx, ty, tx + Math.cos(a) * L, ty + Math.sin(a) * L, 5, 1);
          }
        }
        /* the pile it was found in: the same ring, half-buried, going nowhere */
        brokenRing(F, 122, 126, 16, 0.45, 5);
        F.rect(84, 134, 20, 3, 5);
        /* he kneels at it. The lift is slow because the line says care — the
           heart travels 33 cells over half the movement, never overshoots,
           and ENDS AT HIS REACHING HAND rather than near it; the first pass
           parked it fifteen cells short and the gesture read as pointing */
        /* the reach itself is left untouched — its hand was already tuned
           to land exactly where the heart arrives, and a `gesture` target
           here would fight that tuning rather than sharpen it. Only the
           carriage is added: he is kneeling over something, so his head
           stays down at it, and he still needs a clock or he holds his
           breath through the whole approach. */
        F.fig(52, 132, 38, { mode: "sit", face: 1, arms: "reach", guise: "poet", phase: u * 1.7, headTilt: -0.4 }, 7);
        const lift = ss(0.30, 0.86, u), beat = throb(u, 7);
        heart(F, lerp(104, 66, lift), lerp(124, 105, lift), 6.0 + beat * 0.9, 7, beat);
      },
    },
    {
      label: "MUSTARD SEEDS", seconds: 13,
      line: "What if I followed this reclaimed heart, to where the puzzle pieces of faith are handcrafted — scrambled and scattered as mustard seeds into the vast moonlit night’s garden fields.",
      fx: { shake: (u) => win(u, 0.14, 0.20, 0.30, 0.38) * 2.1 },
      cues: [
        { at: 0.08, f: 520, decay: 0.09, gain: 0.4, partials: [1, 2.3, 3.7], noise: 0.6, nDecay: 0.015, seed: 61 },
        { at: 0.22, f: 390, decay: 0.2, gain: 0.45, partials: [1, 2.1, 3.4], noise: 0.9, nDecay: 0.03, seed: 62 },
        { at: 0.62, f: 880, decay: 0.08, gain: 0.45, partials: [1, 3.3, 5.9], noise: 1.0, nDecay: 0.06, seed: 63 },
      ],
      draw(u, F) {
        gardenNight(F, u, true);
        /* HANDCRAFTED FIRST, THEN SCRAMBLED, THEN SCATTERED, and each piece
           carries its own delay — so the frame holds all three states at once
           and the change is legible as a process rather than a cut. The
           scramble pushes each piece OUT ALONG ITS OWN RADIUS from the centre
           of the block: the first pass jittered them randomly and twenty-four
           squares simply piled into one illegible knot. Rotation is capped
           near half a radian, because a square turned forty-five degrees
           reads as a diamond and stops being a puzzle piece. */
        const R = F.rng(5);
        for (let k = 0; k < 24; k++) {
          const r0 = R(), r1 = R(), r2 = R(), r3 = R();
          const col = k % 8, row = (k / 8) | 0;
          const hx = 88 + (col - 3.5) * 12, hy = 32 + (row - 1) * 12;
          const dl = Math.hypot(hx - 88, hy - 32) || 1;
          const scr = ss(0.12, 0.34, u), sca = ss(0.22 + r0 * 0.40, 0.56 + r0 * 0.40, u);
          const sx = hx + (hx - 88) / dl * scr * 17 + (r1 - 0.5) * 7 * scr;
          const sy = hy + (hy - 32) / dl * scr * 13 + (r2 - 0.5) * 6 * scr;
          const x = lerp(sx, 96 + (r3 - 0.5) * 2 * (18 + r2 * 84), sca);
          const y = lerp(sy, 68 + Math.pow(r2, 1.4) * 68, sca);
          const s = lerp(12, 2.6, sca);
          const rot = (r1 - 0.5) * 1.0 * scr + u * TAU * 0.35 * sca;
          if (s > 5.2) {
            const h = s * 0.5, c = Math.cos(rot), sn = Math.sin(rot);
            const P = (px, py) => [x + px * c - py * sn, y + px * sn + py * c];
            const q = [P(-h, -h), P(h, -h), P(h, h), P(-h, h)];
            for (let j = 0; j < 4; j++) F.line(q[j][0], q[j][1], q[(j + 1) % 4][0], q[(j + 1) % 4][1], 6, 1);
            const tab = P(h, 0), slot = P(-h, 0);
            F.ring(tab[0], tab[1], s * 0.21, 6, 1);
            F.ring(slot[0], slot[1], s * 0.21, 6, 1);
          } else {
            /* a piece does not land as one seed. Scrambled means it arrives
               as a small broadcast, which is also the only way twenty-four
               objects fill a field instead of dotting it */
            const c3 = F.rng(40 + k);
            for (let j = 0; j < 3; j++) F.disc(x + (c3() - 0.5) * 10, y + (c3() - 0.5) * 7, 1.3, 6);
          }
        }
        /* the second trail, and the thing at its head doing the leading. It
           runs on a diagonal: an earlier straight-down path stacked its own
           prints into a single lumpy column. */
        const P2 = (t) => [96 + (1 - t) * (1 - t) * 32 + Math.sin(t * 3.0) * (1 - t) * 9,
                           144 - t * 78, 1.15 - t * 0.92];
        const adv = clamp01(u * 1.2);
        trail(F, adv, 12, P2, 5);
        const [hx2, hy2] = P2(Math.min(0.97, adv * 0.97));
        const beat = throb(u, 7);
        heart(F, hx2, hy2 - 13, 5.2 + beat * 0.8, 6, beat);
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
        const lane = 12 + smooth(u) * 17;
        /* A HEAD THAT TURNS IS AN ELLIPSE WHOSE X-RADIUS OPENS. That is the
           whole mechanism, and it is the only one that makes "face toward me"
           a fact instead of a caption: at face=0 the bloom is a vertical
           sliver seen edge-on, at face=1 a full disc with its centre punched
           out to paper. The turn is staggered by noise so the field turns
           raggedly, the way a thing that is alive does. Rejected: rotating
           the whole plant, which only made the rows wobble. */
        for (let r = 0; r < 6; r++) {
          const z = r / 5;
          const gy = 142 - z * 74, sc = 1 - z * 0.68;
          const per = 4 + Math.round(r * 1.8), spread = lerp(212, 56, z);
          for (let i = 0; i < per; i++) {
            const x = 96 + ((i + 0.5) / per - 0.5) * spread;
            if (Math.abs(x - 96) < lane) continue;
            const n = F.noise(r, i);
            const face = ss(0.16 + n * 0.30, 0.56 + n * 0.30, u);
            const H = 27 * sc, hy = gy - H;
            F.line(x, gy, x, hy + 5 * sc, 4, Math.max(1, 1.6 * sc));
            F.line(x, gy - H * 0.42, x - 6 * sc, gy - H * 0.58, 3, 1);
            F.line(x, gy - H * 0.28, x + 6 * sc, gy - H * 0.44, 3, 1);
            const rr = 6.4 * sc, rx = Math.max(0.8, rr * face);
            for (let dy = -rr; dy <= rr; dy++) {
              const w = rx * Math.sqrt(Math.max(0, 1 - (dy / rr) * (dy / rr)));
              F.line(x - w, hy + dy, x + w, hy + dy, 5, 1);
            }
            for (let k = 0; k < 10; k++) {
              const a = k / 10 * TAU;
              F.line(x + Math.cos(a) * rx, hy + Math.sin(a) * rr,
                     x + Math.cos(a) * rx * (1 + open * 0.85), hy + Math.sin(a) * rr * (1 + open * 0.85), 5, 1);
            }
            /* the golden hue is a hole: the centre is punched to paper, so a
               bloom facing you is the brightest thing on a level-2 night */
            if (face > 0.3) F.disc(x, hy, Math.max(0.8, rx * 0.44), 0, true);
          }
        }
        /* the weeds repel — they do not wilt, they let go and fall. They
           start high and fall slowly enough to still be in the air when the
           shadow reaches them: an earlier pass dropped them off the bottom of
           the frame before the shadow had risen, so the line's one causal
           claim — they fall INTO it — never happened on screen. */
        const fall = smooth(clamp01((u - 0.28) / 0.60));
        for (let k = 0; k < 10; k++) {
          const wx = 16 + F.noise(k, 21) * 162;
          if (Math.abs(wx - 96) < lane * 0.7) continue;
          const wy = 70 + F.noise(k, 22) * 32 + fall * (66 + F.noise(k, 23) * 26);
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
           small enough to mean so little. They are visible only BECAUSE the
           shadow arrived, which is the line's whole claim about memory. */
        if (sh < 128) { cutFig(F, 44, 141, 20); cutFig(F, 62, 139, 18, "up"); }
        /* called forward: the lane opens and the prints come at the camera */
        trail(F, u * 1.5, 8, (t) => [96 + Math.sin(t * 1.4) * 6, VP + 6 + t * t * 74, 0.3 + t * 1.0], 6);
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
        /* THE DARKEST FRAME IN THE FILM, and it gets there inside the first
           two fifths so the remaining eight seconds are the work rather than
           the arrival. Rejected: ramping the dark across the whole movement,
           which spent the movement on a dimmer and left no time to search. */
        const dark = ss(0.0, 0.40, u);
        const S = F.rng(9);
        for (let k = 0; k < 46; k++) {
          const sx = Math.round(S() * F.W), sy = Math.round(S() * 54), big = S() > 0.8;
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
        /* THE REACH OF TOUCH: an island of ground he actually has his hands
           on, dithered out at its own edge, drifting right while it shudders.
           Everything after this is drawn with ink, which cannot lighten — so
           the island is the only place anything is visible at all, and the
           two hands need no reveal schedule of their own. They are found
           exactly when the search arrives at them, which is the line. */
        const px = lerp(46, 142, smooth(u)) + Math.sin(u * TAU * 2.4) * 13;
        F.map((x, y) => {
          const d = Math.hypot((x - px) / 50, (y - 108) / 34);
          if (d < 1 && F.bayer(x, y) < (1 - d) * 1.5) return 0;
        });
        F.line(px - 40, 112, px - 8, 111, 3, 1); F.line(px + 4, 111, px + 38, 112, 3, 1);
        const P2 = F.rng(11);
        for (let k = 0; k < 40; k++) F.disc(px - 46 + P2() * 92, 88 + P2() * 50, 1.0, 3);
        hand(F, 148, 106, 15, 1.57, 0.34, 6);
        hand(F, 166, 117, 15, 4.71, 0.34, 6);
        /* extra hard work, in the dark: he is bent low over the ground he
           can touch, not sitting upright on it */
        F.fig(px - 6, 126, 30, { mode: "sit", face: 1, arms: "reach", guise: "poet", phase: u * 1.7, crouch: 0.18, headTilt: -0.5 }, 7);
      },
    },
    {
      label: "I PUT THEM BACK ON", seconds: 14,
      line: "Hands that once could touch dust after dusk, and feel good — they too used to be mine. I put them back on, with the care of my future at stake: nevermore.",
      cues: [
        { at: 0.18, f: 200, decay: 0.1, gain: 0.4, partials: [1, 2.4], noise: 0.9, nDecay: 0.03, seed: 91 },
        { at: 0.55, f: 150, decay: 0.3, gain: 0.45, partials: [1, 2.0, 3.3], noise: 0.5, nDecay: 0.05, seed: 92 },
        { at: 0.80, f: 330, decay: 1.4, gain: 0.5, partials: [1, 2.01, 3.02, 4.04], noise: 0.12, nDecay: 0.03, seed: 93 },
      ],
      draw(u, F) {
        F.clear(7);
        /* PUTTING THEM ON IS AN ACT WITH A BEGINNING AND AN END, and `fit` is
           the whole of it: one number that opens the reach, seats the hands,
           unfolds the crouch and lifts the gaze. This movement used to be a
           photograph of the result — the hands already fitted, the man already
           upright, twenty-two seconds of nothing moving but dust.

           THE ISLAND IS HIS REACH. M5 called it "the reach of touch": the
           ground a man with no hands can still get his forearms onto. So it
           begins at exactly the size M5 left it and OPENS as the hands go back
           on, because the reach of touch is precisely the thing being put back.
           Nothing in this world brightens — the dark is untouched and the film
           is still the darkest it has been. What grows is the hole in it. */
        const fit = ss(0.22, 0.74, u);
        const rx = lerp(49, 75, fit), ry = lerp(33, 55, fit);
        F.map((x, y) => {
          const d = Math.hypot((x - 96) / rx, (y - 98) / ry);
          if (d < 1 && F.bayer(x, y) < (1 - d) * 1.5) return 0;
        });
        F.line(96 - rx * 0.78, 128, 96 - rx * 0.16, 127, 4, 1);
        F.line(96 - rx * 0.02, 127, 96 + rx * 0.76, 128, 4, 1);
        const G = F.rng(13);
        for (let k = 0; k < 90; k++) F.disc(96 + (G() - 0.5) * rx * 1.8, 102 + G() * 38, 1.0, 3);
        /* DUST AFTER DUSK. It does not settle: it hangs, turns over and lifts,
           and it is the one thing in this half of the film allowed to feel
           good. Every mote keeps its own rate and its own start, so the field
           drifts rather than pulsing as one body — and it wraps, because a
           mote that leaves the top has to be replaced by one at the bottom or
           the air empties out over twenty-two seconds. */
        const D = F.rng(21);
        for (let k = 0; k < 150; k++) {
          const bx = D(), by = D(), r2 = D();
          const my = 62 + (((by * 74 - u * (16 + r2 * 34)) % 74) + 74) % 74;
          F.disc(96 + (bx - 0.5) * rx * 1.95 + Math.sin(u * TAU * (0.4 + r2 * 0.7) + bx * 9) * 3, my, 0.9, 3);
        }
        /* HE GETS UP OFF THE BARE GROUND. At the start he is folded over the
           place M5 left him searching, one wrist down in the grit against the
           hand lying there; by the end he is standing at full height with both
           of them on. The crouch unfolds, the gaze comes up off the ground,
           the weight settles onto one leg — four facts off one number, which
           is the only way a body reads as performing rather than as being
           posed twice and cut between. */
        const HX = 96, HY = 138, HH = 54;
        const crouch = lerp(1.45, 0, fit);
        const gx = lerp(-27, 21, fit), gy = lerp(3, 31, fit);
        const hipY = HH * 0.5 - HH * 0.16 * crouch, shY = HH * 0.815 - HH * 0.20 * crouch;
        F.fig(HX, HY, HH, {
          mode: "stand", face: 1, guise: "poet", phase: u * 1.7, arms: "reach",
          crouch, weight: lerp(0.5, 0.74, fit), headTilt: lerp(-0.55, 0.14, fit),
          gesture: [gx, gy],
        }, 7);
        /* THEY USED TO BE MINE. The near one is the one he already had hold
           of: it rides the wrist the rig puts there, so it comes up off the
           ground because his arm does, not on a schedule of its own. The far
           one is still lying where the search found it and travels to the
           other wrist — and both TURN as they go, from palm-down in the grit
           to hanging off a joint. Rejected: throwing them, which made a
           juggling act of the one gesture in the film that costs something. */
        hand(F, HX + gx, HY - gy, 18, lerp(1.42, 4.10, fit), 0.32, 7);
        hand(F, lerp(132, HX + HH * 0.09, fit), lerp(129, HY - hipY + HH * 0.02, fit),
             18, lerp(4.78, 2.16, fit), 0.32, 7);
        /* and the heart is where it was put back, still keeping time — and it
           rides the chest up as he rises, because an organ that stays at a
           fixed height while the man stands is a mark on the picture rather
           than a thing inside him */
        const beat = throb(u, 7);
        heart(F, HX + 2, HY - shY + 6, 7.0 + beat * 0.9, 7, beat);
        /* THE SAME VOW AS M2, IN THE INVERTED MATERIAL: there it was ink
           arriving over a flat sea, here it is paper cut out of the dark.
           Same word, same schedule, opposite substance — the only way I found
           to say a thing twice and have it mean more the second time. */
        vow(F, 22, ss(0.34, 0.60, u), 1, 0, 7);
      },
    },
  ],
};
