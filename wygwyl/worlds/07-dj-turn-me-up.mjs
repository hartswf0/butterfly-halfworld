/* ============================================================================
   07 · DJ TURN ME UP — a WYGWYL halfworld

   THE GRAMMAR: AMPLITUDE. One envelope, seven rungs — starved in M1, turnt up
   in M7 — drives two things and only two: the level meter's own bars, and a
   single scale factor applied to the mic, the figure, and each movement's
   central object, anchored at the stage floor so the performer grows UP out
   of a floor that never moves. Everything else a line asks for (the daisy,
   the diverging rings, the three roads) is staged honestly around that same
   number. Level 8 is spent exactly once, on the silver lining in M6, per the
   director's note — nowhere else in this file reads or writes it.
   ========================================================================= */
import { TAU, lerp, clamp01, smooth, ss, win } from "../halfworld.mjs";

/* the seven rungs of the climb. Fixed per movement rather than derived from
   u, because u resets to 0 every movement and the poem's amplitude does not
   reset — it is one climb across the whole film, not seven separate ones.
   Rejected: deriving amp from the running suite clock, which would have
   broken the pure-function-of-u law the instant the film looped. */
const AMP = [0.05, 0.15, 0.28, 0.42, 0.55, 0.70, 0.95];
const scaleOf = (amp) => lerp(0.62, 1.32, amp);

/* the meter: nine bars, gapped, never full-width. Height and ink both track
   amplitude; the per-bar jitter comes from n2 so a "quiet" reading is a
   trembling near-zero rather than a dead flat line. It is drawn UNSCALED —
   the one thing in the film that has to stay a fixed measuring stick while
   everything else grows around it. */
function meter(F, u, amp) {
  const N = 9, x0 = 22, gap = 3, bw = 14, y1 = 141;
  for (let k = 0; k < N; k++) {
    const jit = (F.n2(k * 2.3, u * 5.2 + k * 0.7) - 0.5) * (0.30 + amp * 0.35);
    const lvl = clamp01(amp + jit);
    /* capped short of full height on purpose — the tallest reading still
       sits under every stage floor this film uses, so the meter never
       reaches up into the scene it is measuring */
    const h = 2 + lvl * 15;
    const x = x0 + k * (bw + gap);
    F.rect(x, y1 - h, bw, h, Math.max(1, Math.round(lvl * 7)));
  }
}

/* a coordinate rig: everything drawn through G grows from (cx,cy) by
   `scale`. cy is always the floor, so feet never lift — only the body above
   them grows. Rejected: routing the meter through this too, which made the
   meter read as part of the scene instead of the instrument reading it. */
function rig(F, scale, cx, cy) {
  const X = (x) => cx + (x - cx) * scale, Y = (y) => cy + (y - cy) * scale;
  return {
    line: (x0, y0, x1, y1, l, th = 1) => F.line(X(x0), Y(y0), X(x1), Y(y1), l, Math.max(1, th * scale)),
    disc: (px, py, r, l, set) => F.disc(X(px), Y(py), Math.max(0.6, r * scale), l, set),
    ring: (px, py, r, l, th = 1) => F.ring(X(px), Y(py), Math.max(0.8, r * scale), l, Math.max(1, th * scale)),
    arc: (px, py, r, a0, a1, l, th = 1) => F.arc(X(px), Y(py), Math.max(0.8, r * scale), a0, a1, l, Math.max(1, th * scale)),
    rect: (x, y, w, h, l) => F.rect(X(x), Y(y), w * scale, h * scale, l),
    fig: (px, py, h, pose, l) => F.fig(X(px), Y(py), h * scale, pose, l),
  };
}

/* the stage floor, always three runs — an unbroken edge-to-edge bar stripes
   the frame under the halftone, and this floor is under every movement that
   uses it, so it earns its own function rather than a copy-pasted triple. */
function floorRuns(F, y, l = 6) {
  F.line(0, y, 66, y, l, 1); F.line(74, y, 128, y, l, 1); F.line(136, y, 192, y, l, 1);
}
/* the arch: "chin nested at the ARCH of the weight" names it, so it is not
   scenery, it is the noun. Drawn through G, it grows with the same number
   the figure does — a small room for a small voice, a wide one turnt up. */
function archStage(G, cx, floorY, w, h, l) {
  G.line(cx - w / 2, floorY, cx - w / 2, floorY - h, l, 1.4);
  G.line(cx + w / 2, floorY, cx + w / 2, floorY - h, l, 1.4);
  G.arc(cx, floorY - h, w / 2, Math.PI, TAU, l, 1.6);
}
function micStand(G, x, floorY, h, l) {
  G.line(x, floorY, x, floorY - h, l, 1.3);
  G.line(x - 6, floorY, x + 6, floorY, l, 1.6);
  G.ring(x, floorY - h - 3, 2.6, l, 1.3);
  G.disc(x, floorY - h - 3, 1.1, l);
}
/* the weight of these spoken words, staged literally: bricks pressing down
   on the head, heaviest and widest closest to it. Rejected: individual
   letterforms, illegible at this scale and beside the point — the line
   names a WEIGHT, not a text. Drawn through G so it presses on the same
   head the amplitude is growing. */
function wordWeight(G, cx, headTopLocal, l) {
  /* three bricks, stepped well clear of the head and of each other — the
     first pass put the stack flush against the skull and it read as an odd
     hairline instead of a separate load; the gap between bricks now has to
     survive being shrunk by the movement's own (starved) scale, so it is
     bigger, locally, than it needs to look once drawn. */
  for (let k = 0; k < 3; k++) {
    const w = 17 - k * 4, yy = headTopLocal - 4 - k * 7;
    G.rect(cx - w / 2, yy - 4, w, 4, l);
  }
}
/* a tapered stroke — the sole shape this film needs twice, once as a petal,
   once (in M7) as a single tear. Zero width at both ends, fattest at the
   middle: a lens laid along one axis. */
function petal(F, cx, cy, ang, len, wid, l) {
  const c = Math.cos(ang), s = Math.sin(ang);
  const n = Math.max(4, Math.round(len));
  for (let k = 0; k <= n; k++) {
    const t = k / n, r = wid * Math.sin(t * Math.PI) * 0.5;
    F.disc(cx + c * len * t, cy + s * len * t, Math.max(0.6, r), l);
  }
}

/* eleven years, eleven petals — the loop below runs exactly eleven times
   and nothing adds or removes an iteration, so the count is checkable by
   reading the loop bound, not by counting pixels. Each petal is on the
   flower or on the ground, never both, never neither. */
const PETAL_N = 11;
function daisy(F, G, cx, cy, R, u) {
  G.disc(cx, cy, 3, 6);
  for (let k = 0; k < PETAL_N; k++) {
    const ang = (k / PETAL_N) * TAU - Math.PI / 2;
    const c = Math.cos(ang), s = Math.sin(ang);
    const pluckAt = (k + 1) / (PETAL_N + 1);
    if (u < pluckAt) {
      for (let t = 0; t <= 6; t++) {
        const tt = t / 6, len = R * (0.5 + tt * 0.62);
        const w = Math.max(0.6, 2.1 * Math.sin(tt * Math.PI));
        G.disc(cx + c * len, cy + s * len, w, 5);
      }
    } else {
      /* plucked: drifts off, alternating sides — "we love" one way, "we
         not" the other, so the refrain is a direction, not a caption */
      const since = u - pluckAt, side = k % 2 === 0 ? 1 : -1;
      const dx = cx + side * (10 + since * 60) + c * R * 0.3;
      const dy = cy + R * 1.7 + since * 34;
      if (dy < 143) F.disc(dx, dy, 1.6, 4);
    }
  }
}

/* one road, drawn small enough that three of them fit with real gaps
   between — converging edges plus a dashed centre, never a solid span. */
function roadPanel(F, x0, x1, floorY, vy, l = 5) {
  const cx = (x0 + x1) / 2;
  F.line(x0 + 3, floorY, cx, vy, l, 1.2);
  F.line(x1 - 3, floorY, cx, vy, l, 1.2);
  F.line(x0, floorY, x1, floorY, l, 1);
  for (let k = 0; k < 4; k++) {
    const t = (k + 0.5) / 4, y = lerp(floorY, vy, t);
    F.line(cx - 1, y, cx + 1, y, l, 1);
  }
}

export default {
  n: "07", slug: "07-dj-turn-me-up", title: "DJ TURN ME UP",
  tagline: "amplitude, and eleven petals",
  accent: "#5aa7ff", seed: 707,
  /* KEY: G Dorian, bright — envelope starved to turnt up needs headroom, so
     the drone sits on the fifth and the steps climb a full octave across
     the seven movements, ending exactly where "chin high" would put it. */
  drone: { base: 98.00, steps: [-12, -5, 0, 3, 7, 9, 12], bright: true },
  movements: [
    {
      label: "CHIN NESTED", seconds: 13,
      line: "DJ, turn me up, please. Eyes wide shut, chin nested at the arch of the weight of these spoken words.",
      cues: [
        { at: 0.12, f: 260, decay: 0.10, gain: 0.30, partials: [1, 2.2], noise: 0.5, nDecay: 0.03, seed: 701 },
        { at: 0.70, f: 95, decay: 0.35, gain: 0.35, partials: [1, 1.6, 2.3], noise: 0.5, nDecay: 0.10, seed: 702 },
      ],
      draw(u, F) {
        const amp = clamp01(AMP[0] + (F.n2(1.7, u * 3) - 0.5) * 0.03);
        const scale = scaleOf(AMP[0]), FLOOR = 124, cx = 96;
        floorRuns(F, FLOOR);
        const G = rig(F, scale, cx, FLOOR);
        archStage(G, cx, FLOOR, 74, 60, 3);
        micStand(G, cx - 16, FLOOR, 34, 6);
        const h = 40;
        /* nested, bowed: a small forward rot carries the head down toward
           the mic rather than the whole torso folding, which read as
           sitting when the first pass tried it */
        G.fig(cx, FLOOR, h, { mode: "stand", arms: "down", rot: 0.16, lean: 0.05 }, 7);
        wordWeight(G, cx + 4, FLOOR - h * 0.885 - h * 0.12, 5);
        meter(F, u, amp);
      },
    },
    {
      label: "VINEYARD GHOSTS", seconds: 13,
      line: "I have a love story to tell — of ghosts, whispering unfolded dilutions, birthed in purity, and dying in the vineyards of sun-soaked evergreen fields, unnourished.",
      cues: [
        { at: 0.22, f: 220, decay: 0.5, gain: 0.28, partials: [1, 1.8, 2.6], noise: 0.85, nDecay: 0.30, seed: 711 },
        { at: 0.78, f: 66, decay: 0.6, gain: 0.30, partials: [1, 1.5, 2.1], noise: 0.4, nDecay: 0.20, seed: 712 },
      ],
      draw(u, F) {
        const amp = clamp01(AMP[1] + (F.n2(4.4, u * 3.4) - 0.5) * 0.03);
        const scale = scaleOf(AMP[1]), HOR = 46, FLOOR = 118, vx = 96;
        floorRuns(F, FLOOR, 4);
        /* the rows recede to a vanishing point: purity near the viewer,
           unnourished toward the horizon, so distance itself tells the
           decay instead of a caption doing it. Levels skip 3 on purpose —
           that level is reserved for the ghosts below, so the flicker map
           only ever catches them, never a row or a post. */
        for (let r = 0; r < 9; r++) {
          const t = r / 8, x0 = 4 + t * 184, nourished = 1 - t;
          const rowL = nourished > 0.66 ? 4 : nourished > 0.33 ? 2 : 1;
          F.line(x0, FLOOR, lerp(x0, vx, 0.86), lerp(FLOOR, HOR, 0.86), rowL, 1);
          for (let p = 1; p < 6; p++) {
            const pt = p / 6;
            const px = lerp(x0, vx, pt * 0.86), py = lerp(FLOOR, HOR, pt * 0.86);
            if (F.noise(r, p) < nourished * 0.8 + 0.1) F.ink(px, py - 1, nourished > 0.66 ? 5 : nourished > 0.33 ? 2 : 1);
          }
        }
        /* ghosts: whispering, so they never speak in full ink — held at 3,
           and taken apart dot by dot on the ordered schedule, never faded */
        const G = rig(F, scale, 96, FLOOR);
        for (const gx of [62, 128]) G.fig(gx, FLOOR, 30, { mode: "stand", arms: "open", face: gx < 96 ? 1 : -1 }, 3);
        F.map((x, y, v) => {
          if (v === 3 && F.bayer(x, y) > 0.30 + 0.30 * Math.sin(u * TAU * 2.2 + x * 0.05)) return 0;
        });
        meter(F, u, amp);
      },
    },
    {
      label: "THOUSAND LIGHT YEARS", seconds: 14,
      line: "One by one, treasures escaping — devaluing themselves after unsullied stars diminished their glares. I walked a thousand light years to be heard. So DJ — please — turn me up.",
      fx: { smear: { taps: 1, spread: 0.018, fall: 2.2 } },
      cues: [
        { at: 0.10, f: 1200, decay: 0.10, gain: 0.30, partials: [1, 2.4, 3.7], noise: 0.7, nDecay: 0.02, seed: 721 },
        { at: 0.90, f: 340, decay: 0.20, gain: 0.35, partials: [1, 2.1], noise: 0.4, nDecay: 0.03, seed: 722 },
      ],
      draw(u, F) {
        const amp = clamp01(AMP[2] + (F.n2(2.1, u * 4) - 0.5) * 0.03);
        const scale = scaleOf(AMP[2]), FLOOR = 122;
        floorRuns(F, FLOOR, 3);
        /* treasures escaping one by one: each star has its own scheduled
           exit, spread evenly across the whole movement so the loss reads
           as a sequence and not a single flicker */
        const N = 14, R = F.rng(73), stars = [];
        for (let k = 0; k < N; k++) stars.push([R() * 188 + 2, R() * 78 + 6, R()]);
        const glare = lerp(5, 2, u);   // unsullied stars diminished their glares
        for (let k = 0; k < N; k++) {
          const [sx, sy, r0] = stars[k], te = (k + 1) / (N + 1);
          const life = u < te ? 1 : clamp01(1 - (u - te) / 0.10);
          if (life <= 0) continue;
          F.disc(sx, sy, Math.max(0.6, (0.9 + r0 * 1.1) * life), Math.round(glare));
        }
        /* a thousand light years is told as distance, not as a body — a
           trail of fading footprints carries it better than the figure */
        const wx = lerp(16, 176, smooth(u));
        for (let k = 0; k < 14; k++) {
          const fx = wx - k * 5.2;
          if (fx < 4) break;
          F.ink(fx, FLOOR - 1 + (k % 2 ? 1 : 0), Math.max(1, 5 - k * 0.32));
        }
        const G = rig(F, scale, 96, FLOOR);
        G.fig(wx, FLOOR, 30, { mode: "walk", phase: u * 6, face: 1 }, 7);
        meter(F, u, amp);
      },
    },
    {
      label: "DIVERGING RINGS", seconds: 14,
      line: "So I can speak: of wedding bands diverging across abstract skies of wounded souls. Of a shared home, boxed and trucked on separate one-way streets — not built with U-turns, or stop, maybe-we-shouldn't signs.",
      cues: [
        { at: 0.05, f: 660, decay: 0.30, gain: 0.30, partials: [1, 2.0, 3.0], noise: 0.2, nDecay: 0.04, seed: 731 },
        { at: 0.55, f: 520, decay: 0.30, gain: 0.28, partials: [1, 2.0, 3.0], noise: 0.2, nDecay: 0.04, seed: 732 },
      ],
      draw(u, F) {
        const amp = clamp01(AMP[3] + (F.n2(5.5, u * 3) - 0.5) * 0.03), cy = 30;
        /* wounded souls: thin scratches scattered in the sky, never
           gathering into a figure — kept as texture so the rings stay the
           only thing in the sky the eye is asked to follow */
        const R = F.rng(74);
        for (let k = 0; k < 18; k++) {
          const sx = R() * 188 + 2, sy = 6 + R() * 34;
          F.line(sx - 1.4, sy, sx + 1.4, sy, 2, 1);
          F.line(sx, sy - 1.4, sx, sy + 1.4, 2, 1);
        }
        /* THE RINGS WILL NOT RE-CONVERGE. d(u) is built from `smooth`,
           therefore strictly non-decreasing across the movement — there is
           no term anywhere in it that could pull the two rings back
           together, which is the whole claim the line makes. */
        const d = lerp(5, 78, smooth(u));
        const G = rig(F, scaleOf(AMP[3]), 96, cy);
        G.ring(96 - d / 2, cy, 7, 6, 1.5);
        G.ring(96 + d / 2, cy, 7, 6, 1.5);
        /* the shared home: two straight one-way streets — rejected outright
           any curve in them, a U-turn is exactly what the line disowns —
           each carrying a boxed truck further from the other, below the
           same divergence the rings are making above */
        const FLOOR = 132;
        floorRuns(F, FLOOR, 5);
        for (const s of [-1, 1]) {
          const rx = 96 + s * 4, ry = FLOOR, ex = 96 + s * 86, ey = 70;
          F.line(rx, ry, ex, ey, 4, 1.4);
          /* one-way chevrons, not stop signs — a stop sign is an octagon
             and this street was never built with the option to stop */
          const ang = Math.atan2(ey - ry, ex - rx);
          for (let k = 1; k < 5; k++) {
            const t = k / 5, ax = lerp(rx, ex, t), ay = lerp(ry, ey, t);
            F.line(ax, ay, ax - Math.cos(ang) * 3 + Math.sin(ang) * 2, ay - Math.sin(ang) * 3 - Math.cos(ang) * 2, 5, 1);
            F.line(ax, ay, ax - Math.cos(ang) * 3 - Math.sin(ang) * 2, ay - Math.sin(ang) * 3 + Math.cos(ang) * 2, 5, 1);
          }
          const p = smooth(u), tx = lerp(rx, ex, 0.15 + p * 0.75), ty = lerp(ry, ey, 0.15 + p * 0.75);
          F.rect(tx - 5, ty - 4, 10, 6, 6);
          F.disc(tx - 3, ty + 2, 1.3, 7); F.disc(tx + 3, ty + 2, 1.3, 7);
        }
        meter(F, u, amp);
      },
    },
    {
      label: "ELEVEN PETALS", seconds: 14,
      line: "A love story of years — eleven years — each plunkled off as daisy petals. We love, we not. Of a future gone swiftly, and a past left empty-handed.",
      cues: [
        { at: 0.08, f: 480, decay: 0.10, gain: 0.30, partials: [1, 2.3], noise: 0.6, nDecay: 0.02, seed: 741 },
        { at: 0.92, f: 140, decay: 0.30, gain: 0.28, partials: [1, 1.7], noise: 0.5, nDecay: 0.06, seed: 742 },
      ],
      draw(u, F) {
        const amp = clamp01(AMP[4] + (F.n2(6.6, u * 3) - 0.5) * 0.03);
        const scale = scaleOf(AMP[4]), cx = 96, cy = 68;
        floorRuns(F, 106, 3);
        const G = rig(F, scale, cx, cy);
        G.line(cx, cy + 6, cx, cy + 38, 4, 1.6);
        daisy(F, G, cx, cy, 22, u);
        /* a future gone swiftly, a past left empty-handed: the hand that
           did the plucking, open and holding nothing, once all eleven are
           down — it arrives only after the loop above has emptied */
        if (u > PETAL_N / (PETAL_N + 1)) {
          F.rect(cx - 6, 104, 12, 5, 4);
          for (let f = 0; f < 4; f++) F.line(cx - 4 + f * 2.6, 104, cx - 4 + f * 2.6, 100, 4, 1);
        }
        meter(F, u, amp);
      },
    },
    {
      label: "THREE ROADS", seconds: 13,
      line: "To pick a road: of heavy rain. Or of frontal fog. Or of dimmed night lights under a cloud — with a silver lining.",
      cues: [
        { at: 0.08, f: 60, decay: 0.6, gain: 0.35, partials: [1, 1.4, 2.0], noise: 0.9, nDecay: 0.5, seed: 751 },
        { at: 0.42, f: 180, decay: 0.4, gain: 0.20, partials: [1, 1.6], noise: 0.85, nDecay: 0.35, seed: 752 },
        { at: 0.80, f: 760, decay: 0.5, gain: 0.30, partials: [1, 2.5, 4.0], noise: 0.15, nDecay: 0.05, seed: 753 },
      ],
      draw(u, F) {
        const amp = clamp01(AMP[5] + (F.n2(7.7, u * 3) - 0.5) * 0.03);
        const floorY = 136, vy = 40;
        /* three separate panels, three separate stakes in the choice. One
           shared rig anchored at frame-centre would have pulled the fog
           sideways into the rain panel's gap, so each panel picks its own
           subject to carry the amplitude scale instead of sharing one
           transform: only the rain gets bigger, because the fog and the
           dimness are already their own measure of amplitude and scaling
           them too would have doubled the same idea on top of itself. */
        roadPanel(F, 6, 60, floorY, vy);
        const Ga = rig(F, scaleOf(AMP[5]), 33, floorY);
        const R1 = F.rng(76);
        for (let k = 0; k < 26; k++) {
          const rx0 = 8 + R1() * 44, ry0 = (R1() * 100 + u * 260) % 100;
          Ga.line(rx0, ry0, rx0 - 3, ry0 + 9, 5, 1);
        }

        roadPanel(F, 68, 124, floorY, vy);
        /* frontal fog: the front itself arrives across the movement, a
           lumpy fbm boundary sweeping in rather than a curtain dropping */
        const front = smooth(u);
        F.map((x, y) => {
          if (x < 66 || x > 126) return;
          const c = F.n2(x * 0.14, y * 0.16 + u * 1.4);
          const d = front * 1.5 - 0.25 + (c - 0.5) * 0.7;
          if (F.bayer(x, y) < d) return 4;
        });

        roadPanel(F, 132, 186, floorY, vy);
        F.rect(132, 12, 54, 60, 1);
        for (const [wx, wy] of [[140, 100], [150, 108], [170, 98], [178, 106]]) F.disc(wx, wy, 1.1, 2);
        const ccx = 159, ccy = 26, cr = 13;
        for (const [ox, oy, orr] of [[-7, 1, 7], [0, -2, 9], [8, 1, 7], [-2, 3, 6], [5, 3, 6]]) {
          F.disc(ccx + ox, ccy + oy, orr, 3);
        }
        /* THE SILVER LINING — the only accent in this film, level 8, spent
           once, on the lower rim of the cloud, and nowhere else in the
           module. Everything above and below this line is levels 0-7. */
        F.arc(ccx, ccy + 2, cr + 1, 0.12 * Math.PI, 0.88 * Math.PI, 8, 1.3);

        meter(F, u, amp);
      },
    },
    {
      label: "CHIN HIGH", seconds: 14,
      line: "Now, turning forth to face delights and shadows — one night at a time; one tear at a time; one open mic at a time. Chin now nested high, and volume turnt up.",
      fx: { shake: (u) => (0.4 + 0.6 * Math.abs(Math.sin(u * TAU * 5))) * AMP[6] * 2.4 },
      cues: [
        { at: 0.15, f: 300, decay: 0.10, gain: 0.30, partials: [1, 2.2], noise: 0.4, nDecay: 0.02, seed: 761 },
        { at: 0.50, f: 220, decay: 0.15, gain: 0.30, partials: [1, 1.8], noise: 0.5, nDecay: 0.03, seed: 762 },
        { at: 0.86, f: 140, decay: 0.5, gain: 0.5, partials: [1, 2.0, 3.0, 4.0], noise: 0.4, nDecay: 0.05, seed: 763 },
      ],
      draw(u, F) {
        const amp = clamp01(AMP[6] + (F.n2(8.8, u * 6) - 0.5) * 0.04);
        const scale = scaleOf(AMP[6]), FLOOR = 124, cx = 96;
        /* delights and shadows: a boundary he turns to face, wobbled so it
           reads as weather rather than a ruled line — the same technique
           the floor seam uses elsewhere in the suite, spent here on light
           itself instead of ground */
        F.map((x, y) => (y < FLOOR && x < 96 + (F.n2(y * 0.06, 3) - 0.5) * 30 ? 1 : undefined));
        floorRuns(F, FLOOR);
        const G = rig(F, scale, cx, FLOOR);
        archStage(G, cx, FLOOR, 74, 60, 3);
        micStand(G, cx - 16, FLOOR, 34, 6);
        /* chin high: rot goes the OTHER way from M1, and nothing is
           stacked on the head — the weight from M1 never returns here */
        G.fig(cx, FLOOR, 42, { mode: "stand", arms: "open", rot: -0.14 }, 7);
        /* one night, one tear, one open mic — three marks arriving in the
           order the line names them, each one a per-dot arrival on the
           ordered schedule rather than a pop-in */
        const icons = [[40, 16, "night"], [96, 12, "tear"], [152, 16, "mic"]];
        const gate = [0.12, 0.42, 0.70];
        for (let idx = 0; idx < icons.length; idx++) {
          const [ix, iy, kind] = icons[idx];
          if (u < gate[idx]) continue;
          if (kind === "night") F.disc(ix, iy, 3, 7);
          else if (kind === "tear") petal(F, ix, iy - 4, Math.PI / 2, 8, 4, 7);
          else { F.line(ix, iy - 5, ix, iy + 5, 7, 1.2); F.ring(ix, iy - 6, 2, 7, 1); }
          const arrive = ss(gate[idx], gate[idx] + 0.10, u);
          F.map((x, y, v) => {
            if (x < ix - 8 || x > ix + 8 || y < iy - 9 || y > iy + 10) return;
            if (v !== 7) return;
            return F.bayer(x, y) < arrive ? 5 : 0;
          });
        }
        meter(F, u, amp);
      },
    },
  ],
};
