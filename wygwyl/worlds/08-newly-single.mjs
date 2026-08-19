/* ============================================================================
   08 · NEWLY SINGLE — a WYGWYL halfworld

   TWO COPIES OF ONE FIGURE. The flesh is drawn the way every other body in
   this suite is drawn — F.fig at level 7, solid. The soul is the same call
   at level 3, with its head hollowed into a ring and its remaining ink
   flickering dot-by-dot on the Bayer schedule, faster when it is anxious,
   slower as it settles. The two are never merged into a single drawing call:
   even back in the body in M6, and even quiet together in M7, the film keeps
   drawing both, because the line never claims they became one thing again.

   THE PLANET IS AN ARC SO WIDE IT READS AS A FLOOR. Same technique as the
   globe in 05 — a circle of enormous radius, sampled per column — pushed
   further: at R=1600 the sagitta across the whole frame is three cells. It
   is a planet because it curves at all, and "much larger than my own" is
   the fact that you cannot see it curve. The equator is ticks nailed into
   that line, not a second line drawn over it — a boundary marked is a
   boundary kept.

   ONE ACCENT, THE SPARK OF HIM. It does not exist while he is whole (M1) or
   once he is settled and unresolved (M7 gives it back its quiet). Everywhere
   between, it sits at the soul's own head — never on the flesh, never on
   anyone else — because the one thing this film marks is which of the two
   copies is the one still asking questions.
   ========================================================================= */
import { TAU, lerp, clamp01, smooth, ss, win } from "../halfworld.mjs";

/* the flesh: the ordinary F.fig call, named so a reader never has to ask
   which of the two bodies a given line draws */
function flesh(F, x, y, h, pose) { F.fig(x, y, h, pose, 7); }

/* the soul: same figure, level 3, head hollowed to a ring (a solid skull on
   a level-3 body read as flesh with the volume turned down, not as an
   outline), then thinned per-dot on the Bayer schedule at a frequency the
   caller sets — fast is restless, slow is settled, and the number is the
   only thing that changes between an escape and an arrival. Bounded to its
   own bounding box so the flicker never reaches into anything else at
   level 3 elsewhere in the frame. */
function soulFig(F, u, x, y, h, pose, freq = 3, phase = 0) {
  const mode = pose.mode || "stand";
  F.fig(x, y, h, pose, 3);
  const hy = y - h * (mode === "sit" ? 0.73 : 0.885), hr = h * 0.10;
  for (let yy = Math.floor(hy - hr); yy <= Math.ceil(hy + hr); yy++)
    for (let xx = Math.floor(x - hr); xx <= Math.ceil(x + hr); xx++)
      if (Math.hypot(xx - x, yy - hy) < hr - 1) F.put(xx, yy, 0);
  const th = 0.5 + 0.32 * Math.sin(u * TAU * freq + phase);
  const x0 = Math.max(0, Math.floor(x - h * 0.6)), x1 = Math.min(F.W, Math.ceil(x + h * 0.6));
  const y0 = Math.max(0, Math.floor(y - h * 1.05)), y1 = Math.min(F.H, Math.ceil(y + h * 0.15));
  F.map((xx, yy, v) => {
    if (xx < x0 || xx >= x1 || yy < y0 || yy >= y1 || v !== 3) return;
    const b = F.bayer(xx, yy);
    if (b > th) return 0;
    if (b > th * 0.55) return 2;
  });
}

/* THE ONE ACCENT: a single point at the soul's own head. `extra` is used
   only twice in the whole film — the instant of departure and the instant
   of return — everywhere else it is one cell, deliberately easy to miss. */
function spark(F, x, y, extra = false) {
  F.put(Math.round(x), Math.round(y), 8);
  if (extra) F.put(Math.round(x) + 1, Math.round(y), 8);
}

/* the dance floor: a tile grid whose level pulses outward from its own
   centre — flat quantised tones, never a gradient, and the 1-cell gutter
   between tiles is what keeps sixteen rows of a grid from reading as
   stripes under the halftone. */
const FLOOR_Y0 = 92, FLOOR_COLS = 16, FLOOR_ROWS = 4;
function danceFloor(F, u, opts = {}) {
  const { rate = 2.2, cx = 96 } = opts;
  const tw = F.W / FLOOR_COLS, th = (F.H - FLOOR_Y0) / FLOOR_ROWS;
  for (let r = 0; r < FLOOR_ROWS; r++) {
    for (let c = 0; c < FLOOR_COLS; c++) {
      const cxT = (c + 0.5) * tw, cyT = FLOOR_Y0 + (r + 0.5) * th;
      const d = Math.hypot(cxT - cx, cyT - FLOOR_Y0) / 70;
      const v = (Math.sin(u * TAU * rate - d * 5) + 1) / 2;
      const lvl = v > 0.72 ? 5 : v > 0.42 ? 3 : 1;
      F.rect(c * tw + 1, FLOOR_Y0 + r * th + 1, tw - 2, th - 2, lvl);
    }
  }
  F.line(0, FLOOR_Y0 - 1, 84, FLOOR_Y0 - 1, 4, 1);
  F.line(96, FLOOR_Y0 - 1, 192, FLOOR_Y0 - 1, 4, 1);
}

/* the crowd: deterministic, so the same seed redraws the same club across
   M1–M3 and M6 — one room, thinning, not four different rooms of extras */
function crowd(F, u, n, seedBase, opts = {}) {
  const { yBand = [100, 138], gap = 18 } = opts;
  const R = F.rng(seedBase);
  for (let k = 0; k < n; k++) {
    const r1 = R(), r2 = R(), r3 = R(), r4 = R();
    let x = 14 + r1 * 164;
    if (Math.abs(x - 96) < gap) x += (x < 96 ? -1 : 1) * gap;
    x = Math.max(6, Math.min(186, x));
    const y = yBand[0] + r2 * (yBand[1] - yBand[0]);
    const h = 20 + r3 * 9, face = r4 > 0.5 ? 1 : -1;
    const phase = u * (2.2 + r1 * 3.4) + r2 * 6;
    F.fig(x, y, h, { mode: "stand", arms: "swing", phase, face, lean: Math.sin(phase * TAU) * 0.12 }, 4);
  }
}

/* a jagged bolt, not a radiating burst — "electric currents" travel between
   two points, they don't fan out from one */
function lightning(F, x0, y0, x1, y1, lvl, seedK) {
  const N = F.rng(seedK);
  let px = x0, py = y0;
  for (let k = 1; k <= 5; k++) {
    const t = k / 5;
    const jx = (N() - 0.5) * 7 * (1 - Math.abs(t - 0.5) * 2), jy = (N() - 0.5) * 3;
    const nx = lerp(x0, x1, t) + jx, ny = lerp(y0, y1, t) + jy;
    F.line(px, py, nx, ny, lvl, 1);
    px = nx; py = ny;
  }
}

/* THE PLANET. A circle of radius 1600 sampled per column — the same device
   05 used for a globe, pushed until the curve is nearly invisible, because
   "much larger than my own" only works if you cannot see it end. Four runs
   (rule 3): the first pass was one continuous ground line and the halftone
   turned a hundred-and-ninety-cell curve into a ruled bar. The equator is
   ticks driven off the SAME runs, so no tick ever lands in a gap the ground
   itself doesn't have. */
const PLANET_R = 1600;
const GROUND_RUNS = [[2, 44], [52, 92], [100, 140], [148, 190]];
function planetGround(F, cy) {
  const gy = (x) => cy + (PLANET_R - Math.sqrt(Math.max(0, PLANET_R * PLANET_R - (x - 96) * (x - 96))));
  for (const [a, b] of GROUND_RUNS) for (let x = a; x < b; x++) F.ink(x, Math.round(gy(x)), 6);
  for (const [a, b] of GROUND_RUNS) {
    for (let x = a; x < b; x += 7) { const y = gy(x); F.line(x, y - 3, x, y + 1, 5, 1); }
    for (let x = a; x < b; x++) if (F.noise(x, 3) > 0.9) F.ink(x, gy(x) + 1 + Math.round(F.noise(x, 9) * 2), 3);
  }
  return gy;
}

/* one dashed stream, flowing — the dash offset steps with u so the water
   reads as moving without ever being two different drawings crossfaded */
function pour(F, u, x0, y0, x1, y1, lvl) {
  const n = 22;
  for (let k = 0; k < n; k++) {
    if (((k + Math.floor(u * 20)) % 3) === 0) continue;
    const t = k / n;
    F.ink(lerp(x0, x1, t), lerp(y0, y1, t), lvl);
  }
}

export default {
  n: "08", slug: "08-newly-single", title: "NEWLY SINGLE",
  tagline: "a soul leaves a body on a dance floor",
  accent: "#5aa7ff", seed: 808,
  /* the bed follows the body: level through the crowd, up at the separation,
     a hard jump for the planet ("much larger... and much hotter"), down
     through the cooling, and lowest at the end — settled, not resolved */
  drone: { base: 57, steps: [0, 0, 4, 6, 11, 8, 2, -3], bright: true },
  movements: [
    {
      label: "PULSING", seconds: 13,
      line: "Pulsing, and head throbbing from the music — and empty, on a crowded floor of sweated perfumes and temptations.",
      cues: [
        { at: 0.15, f: 120, decay: 0.14, gain: 0.55, partials: [1, 1.5, 2.2], noise: 0.5, nDecay: 0.03, seed: 801 },
        { at: 0.50, f: 120, decay: 0.14, gain: 0.55, partials: [1, 1.5, 2.2], noise: 0.5, nDecay: 0.03, seed: 802 },
        { at: 0.85, f: 120, decay: 0.14, gain: 0.55, partials: [1, 1.5, 2.2], noise: 0.5, nDecay: 0.03, seed: 803 },
      ],
      draw(u, F) {
        danceFloor(F, u, { rate: 2.4 });
        crowd(F, u, 7, 11, { yBand: [100, 136], gap: 16 });
        /* HE IS THE ONE STILL BODY ON A MOVING FLOOR. The crowd swings on
           its own phase; he barely does — arms down, a hair of lean —
           because "empty on a crowded floor" is a contrast the crowd has
           to supply, not a caption he can perform by himself. */
        const sway = Math.sin(u * TAU * 1.1) * 0.05;
        flesh(F, 96, 138, 34, { mode: "stand", arms: "down", lean: sway });
        /* the throb: three rings on the same clock as the floor, centred on
           his head and nowhere else — a headache, not a halo */
        const hx = 96, hy = 138 - 34 * 0.885;
        for (let k = 0; k < 3; k++) {
          const p = (u * 2.4 + k / 3) % 1;
          F.ring(hx, hy, lerp(1.5, 11, p), Math.round(lerp(6, 1, p)), 1);
        }
        /* sweated perfumes: faint commas rising off the floor and going
           nowhere — they are not smoke, they don't accumulate, they just
           keep leaving */
        const R = F.rng(31);
        for (let k = 0; k < 14; k++) {
          const r1 = R(), r2 = R();
          const bx = 10 + r1 * 172, t = (u * 0.5 + r2) % 1, by = 132 - t * 66;
          F.line(bx - 1, by, bx + 1, by - 2, 2, 1);
        }
        /* NO ACCENT HERE. There is only one of him yet, and one of him
           doesn't need marking — the spark exists once there are two. */
      },
    },
    {
      label: "THE ESCAPE", seconds: 14,
      line: "The soul escapes my body, and leaves him on the dance floor — just flesh and bones. Rejection and heartache hit different, with no feelings afloat.",
      cues: [
        { at: 0.03, f: 90, decay: 0.6, gain: 0.5, partials: [1, 1.5, 2.1], noise: 0.5, nDecay: 0.2, seed: 811 },
        { at: 0.48, f: 520, decay: 0.4, gain: 0.35, partials: [1, 2.4, 3.9], noise: 0.3, nDecay: 0.06, seed: 812 },
        { at: 0.88, f: 200, decay: 0.2, gain: 0.3, partials: [1, 2], noise: 0.4, nDecay: 0.04, seed: 813 },
      ],
      draw(u, F) {
        danceFloor(F, u, { rate: 1.5 });
        crowd(F, u, 3, 11, { yBand: [106, 132], gap: 26 });
        const esc = smooth(u), bx = 96, by = 138;
        /* JUST FLESH AND BONES: arms down, a small forward tilt — the pose
           of someone still standing because standing takes no decision */
        flesh(F, bx, by, 34, { mode: "stand", arms: "down", rot: 0.07, lean: 0.03 });
        /* THE SOUL STARTS WHERE HE IS. It shares his position at u=0 and
           only then peels off — an escape has to begin coincident with the
           thing it's escaping, or it reads as a second person arriving
           rather than a first person leaving. Rejected: starting the soul
           already apart, which made M2 a reunion shot run backward. */
        const sx = lerp(bx, bx + 32, esc), sy = lerp(by - 6, 40, esc);
        const sh = lerp(34, 21, esc * 0.55);
        soulFig(F, u, sx, sy, sh, { mode: "stand", arms: esc > 0.5 ? "open" : "down", rot: -esc * 0.2 }, 3.2, 0);
        spark(F, sx, sy - sh * 0.885, esc > 0.85);
        /* NO FEELINGS AFLOAT: everything else in this frame that leaves the
           body goes up. These don't — small weights that settle at his
           feet instead of rising, the one thing that does not answer to
           the escape. */
        const G = F.rng(23);
        for (let k = 0; k < 9; k++) {
          const g1 = G(), g2 = G();
          const dx = bx - 10 + g1 * 20, arrive = clamp01(u * 1.3 - g2 * 0.5);
          if (arrive <= 0) continue;
          F.disc(dx, lerp(112, 138, arrive), 1, 4);
        }
      },
    },
    {
      label: "IMAGINE MY BODY", seconds: 13,
      line: "I want my soul to imagine my body. Watch strangers collide and spark electric currents that gamut the mood. We want him to be the last to leave.",
      cues: [
        { at: 0.34, f: 900, decay: 0.08, gain: 0.5, partials: [1, 2.6, 4.3], noise: 0.9, nDecay: 0.02, seed: 821 },
        { at: 0.79, f: 900, decay: 0.08, gain: 0.5, partials: [1, 2.6, 4.3], noise: 0.9, nDecay: 0.02, seed: 822 },
      ],
      draw(u, F) {
        danceFloor(F, u, { rate: 2.6 });
        /* LAST TO LEAVE: the room he isn't in empties around the room he
           is — the crowd count is the clock this movement runs on */
        const nBg = Math.round(lerp(6, 1, smooth(u)));
        crowd(F, u, nBg, 17, { yBand: [104, 130], gap: 30 });
        /* two strangers on a collision course that repeats — the line
           watches it happen more than once, so it is a cycle, not an
           event */
        const t = Math.sin(u * TAU * 2.2), x1 = 66 - t * 9, x2 = 126 + t * 9, cy = 118;
        F.fig(x1, cy, 23, { mode: "stand", arms: "reach", face: 1, phase: u * 3 }, 5);
        F.fig(x2, cy, 23, { mode: "stand", arms: "reach", face: -1, phase: u * 3 }, 5);
        if (x2 - x1 < 24) lightning(F, x1 + 6, cy - 15, x2 - 6, cy - 15, 6, 40 + Math.floor(u * 10));
        /* the flesh, still dancing — the one figure in the room not
           counting down to leaving */
        flesh(F, 96, 138, 34, { mode: "stand", arms: "swing", phase: u * 7, lean: Math.sin(u * TAU * 1.1) * 0.05 });
        /* the soul, small and apart, imagining rather than inhabiting — the
           reach down to the body is dashed because imagining isn't a wire,
           it's intermittent */
        const sx = 158, sy = 30;
        soulFig(F, u, sx, sy, 15, { mode: "stand", arms: "open" }, 2.1, 0.6);
        spark(F, sx, sy - 15 * 0.885);
        for (let k = 0; k < 24; k += 3) F.ink(lerp(sx, 96, k / 24), lerp(sy, 108, k / 24), 2);
      },
    },
    {
      label: "THE EQUATOR", seconds: 13,
      line: "Now let us put my soul in the middle of an open field — at the equator of a planet much larger than my own, and much hotter.",
      cues: [
        { at: 0.05, f: 46, decay: 1.2, gain: 0.5, partials: [1, 1.4, 2.1], noise: 0.5, nDecay: 0.4, seed: 831 },
        { at: 0.62, f: 2600, decay: 0.15, gain: 0.3, partials: [1, 1.8], noise: 1.0, nDecay: 0.08, seed: 832 },
      ],
      draw(u, F) {
        F.clear(0);
        const gy = planetGround(F, 118);
        /* MY OWN PLANET, FOR SCALE. A whole second horizon would have
           argued with the one that matters; a marble in the corner argues
           nothing — it just makes the big one big by being small next to
           it. */
        F.disc(15, 15, 3, 4); F.ring(15, 15, 4.2, 3, 1);
        /* a sun too close and too big for its own sky — that is "hotter" */
        const sunX = 158, sunY = 20;
        F.disc(sunX, sunY, 13, 6);
        for (let k = 0; k < 9; k++) {
          const a = k / 9 * TAU + u * 0.25;
          F.line(sunX + Math.cos(a) * 15, sunY + Math.sin(a) * 15, sunX + Math.cos(a) * 22, sunY + Math.sin(a) * 22, 5, 1);
        }
        /* heat off the ground, rising and wavering, never settling into a
           shape — a gradient would have been smoke, this has to be heat */
        for (let k = 0; k < 16; k++) {
          const x = 8 + k * 12, y0 = gy(x) - 2, wob = Math.sin(u * TAU * (1.4 + k * 0.1) + k) * 3;
          F.line(x, y0, x + wob, y0 - 9, 2, 1);
        }
        /* THE FIELD IS OPEN, WHICH MEANS EMPTY. Rejected: scattering rocks
           or scrub to fill it — the line's whole claim is that there is
           nothing here but him and the curve of the ground. */
        soulFig(F, u, 96, gy(96), 26, { mode: "stand", arms: "open" }, 2.0, 0);
        spark(F, 96, gy(96) - 26 * 0.885);
      },
    },
    {
      label: "COOL ME DOWN", seconds: 14,
      line: "Cool me down: pouring unfiltered water out of ice baths, salted from the closest moons, from angles of the newest religions — their graces curse or bless me. Only infinity will tell.",
      cues: [
        { at: 0.10, f: 260, decay: 0.3, gain: 0.4, partials: [1, 1.7, 2.4], noise: 0.9, nDecay: 0.2, seed: 841 },
        { at: 0.42, f: 240, decay: 0.3, gain: 0.4, partials: [1, 1.7, 2.4], noise: 0.9, nDecay: 0.2, seed: 842 },
        { at: 0.74, f: 220, decay: 0.3, gain: 0.4, partials: [1, 1.7, 2.4], noise: 0.9, nDecay: 0.2, seed: 843 },
      ],
      draw(u, F) {
        F.clear(0);
        const gy = planetGround(F, 118);
        /* the closest moons: too near to be background, too small to be
           suns */
        F.ring(28, 13, 4, 4, 1); F.disc(31, 11, 1, 3); F.ring(172, 9, 3, 4, 1);
        const tx = 96, ty = gy(96) - 5;
        /* THE ANGLES OF THE NEWEST RELIGIONS: three pours from three
           unrelated directions — one source would have been one religion,
           not several. Two carry an ice bath at their origin; the third is
           bare sky, a grace with no basin under it. Curse and bless are
           the same gesture at two ink weights, and the film never says
           which stream is which. */
        const STREAMS = [
          { x0: 16, y0: 8, lvl: 5, ice: true },
          { x0: 178, y0: 4, lvl: 3, ice: true },
          { x0: 96, y0: 2, lvl: 4, ice: false },
        ];
        for (const s of STREAMS) {
          if (s.ice) { F.box(s.x0 - 6, s.y0 - 4, 12, 6, 5, 1); F.disc(s.x0 - 2, s.y0 - 1, 1, 6); F.disc(s.x0 + 2, s.y0, 1, 6); }
          pour(F, u, s.x0, s.y0, tx, ty, s.lvl);
        }
        /* salt, off the water rather than in it — a scatter near the
           landing, not a stream of its own */
        const R = F.rng(51);
        for (let k = 0; k < 10; k++) F.disc(tx + (R() - 0.5) * 20, ty + 2 + R() * 6, 0.8, 3);
        soulFig(F, u, 96, gy(96), 26, { mode: "stand", arms: "open" }, 2.0, 0);
        spark(F, 96, gy(96) - 26 * 0.885);
        /* ONLY INFINITY WILL TELL: the ground the equator ticks are nailed
           to runs to both edges of the frame and stops nowhere in it. */
      },
    },
    {
      label: "BACK TO MY BODY", seconds: 14,
      line: "Now bring my soul back to my body: to lean back, breathe in the smoke that fills the room — how good it is to finally get acquainted with the night.",
      cues: [
        { at: 0.06, f: 180, decay: 0.5, gain: 0.35, partials: [1, 2], noise: 0.7, nDecay: 0.3, seed: 851 },
        { at: 0.55, f: 70, decay: 0.8, gain: 0.45, partials: [1, 1.5, 2], noise: 0.3, nDecay: 0.3, seed: 852 },
      ],
      draw(u, F) {
        danceFloor(F, u, { rate: 1.0 });
        crowd(F, u, 1, 41, { yBand: [112, 130], gap: 40 });
        const ret = smooth(u), bx = 96, by = 138;
        /* TO LEAN BACK: rot goes negative, the one direction this world's
           figures otherwise never fall */
        flesh(F, bx, by, 34, { mode: "stand", arms: "open", rot: -0.15, lean: -0.05 });
        /* the soul comes home along the kind of path it left by — high and
           to the side, down onto him — and the flicker itself slows as it
           arrives, so settling in is a frequency change, not a fade */
        const sx = lerp(bx + 32, bx, ret), sy = lerp(38, by - 24, ret), sh = lerp(20, 34, ret);
        const freq = lerp(4.4, 1.0, ret);
        soulFig(F, u, sx, sy, sh, { mode: "stand", arms: "open", rot: lerp(-0.2, -0.05, ret) }, freq, 1.1);
        spark(F, sx, sy - sh * 0.885, ret > 0.8);
        /* THE SMOKE FILLS THE ROOM: a per-dot allegiance the room concedes
           to, not a fog laid over it — the dot law, applied to weather */
        const fill = ret * 0.85;
        F.map((x, y, v) => {
          const s = F.fbm(x * 0.045 + u * 1.1, y * 0.06, 2);
          if (s > 0.5 && F.bayer(x, y) < fill * (s - 0.42) * 2.6) return Math.max(v, 2);
        });
      },
    },
    {
      label: "MOUNTAINS IN THE DISTANCE", seconds: 13,
      line: "Unfamiliar, yet relatable mountains in the distance; wandering thoughts within reach. Accepting you'll never say, nor feel, my love was real. What isn't mine, I still can not give.",
      cues: [
        { at: 0.30, f: 130, decay: 0.9, gain: 0.3, partials: [1, 1.5, 2], noise: 0.2, nDecay: 0.3, seed: 861 },
      ],
      draw(u, F) {
        /* the ground, broken — even a horizon this quiet doesn't get to be
           one unbroken bar */
        F.line(0, 132, 70, 132, 4, 1); F.line(82, 132, 192, 132, 4, 1);
        /* UNFAMILIAR, YET RELATABLE: a second, fainter ridge sits half a
           step behind the first — the same silhouette, offset — which is
           what a shape looks like when you almost recognise it. Static
           across the movement: the mountains are the one thing here that
           does not move, because the line puts them "in the distance," not
           in play. */
        for (const [dx, lvl, drop] of [[7, 2, 8], [0, 4, 0]]) {
          let px = -8, py = 132 - drop;
          for (let x = -8; x <= 200; x += 15) {
            const h = drop + 18 + F.noise(x + dx, 5) * 44, nx = x + dx, ny = 132 - h;
            if (x > -8) F.line(px, py, nx, ny, lvl, 1.3);
            px = nx; py = ny;
          }
        }
        /* the two of him, quiet, still two — the film never draws them as
           one body, because the line does not claim they became one */
        flesh(F, 96, 132, 30, { mode: "sit", arms: "down", face: 1 });
        soulFig(F, u, 96, 132, 30, { mode: "sit", arms: "down", face: 1 }, 0.6, 0);
        const hx = 96, hy = 132 - 30 * 0.73;
        spark(F, hx, hy);
        /* WANDERING THOUGHTS WITHIN REACH: they orbit, they don't leave —
           the radius is arm's length and it holds for the whole movement,
           the last quiet fact this film states. */
        for (let k = 0; k < 5; k++) {
          const wx = hx + Math.sin(u * TAU * (0.28 + k * 0.06) + k * 2.1) * 9 + (F.n2(k, 3) - 0.5) * 3;
          const wy = hy - 5 + Math.cos(u * TAU * (0.22 + k * 0.05) + k * 1.3) * 6;
          F.disc(wx, wy, 0.9, 3);
        }
      },
    },
  ],
};
