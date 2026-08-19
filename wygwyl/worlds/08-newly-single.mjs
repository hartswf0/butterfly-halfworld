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
   boundary kept. Over it, in M4, hangs the only sky this film draws: thick
   air at 4 and 5, never at 3, because the soul is drawn at 3 and a level it
   shares with the sky is a level it cannot be seen against. "Much hotter" is
   then a subtraction rather than an addition — the glare leaves the sun and
   blows that air off the frame, dot by dot, until the plain is standing in
   white and there is nothing left up there to look at.

   ONE ACCENT, THE SPARK OF HIM. It does not exist while he is whole (M1) or
   once he is settled and unresolved (M7 gives it back its quiet). Everywhere
   between, it sits at the soul's own head — never on the flesh, never on
   anyone else — because the one thing this film marks is which of the two
   copies is the one still asking questions.
   ========================================================================= */
import { TAU, lerp, clamp01, smooth, ss, win } from "../halfworld.mjs";

/* the flesh: the ordinary F.fig call, named so a reader never has to ask
   which of the two bodies a given line draws. GUISE POET, always — this is
   the same man every other film in the suite recognises by silhouette, and
   a standing body that never got a `phase` was holding its breath for
   thirteen seconds, so one is supplied here whenever a call site forgets. */
function flesh(F, u, x, y, h, pose) {
  F.fig(x, y, h, { guise: "poet", phase: pose.phase ?? u * 1.7, ...pose }, 7);
}

/* the soul: same figure, level 3, head hollowed to a ring (a solid skull on
   a level-3 body read as flesh with the volume turned down, not as an
   outline), then thinned per-dot on the Bayer schedule at a frequency the
   caller sets — fast is restless, slow is settled, and the number is the
   only thing that changes between an escape and an arrival. Bounded to its
   own bounding box so the flicker never reaches into anything else at
   level 3 elsewhere in the frame. */
function soulFig(F, u, x, y, h, pose, freq = 3, phase = 0) {
  const mode = pose.mode || "stand";
  /* GUISE POET, ALWAYS — the soul is the same man as the flesh, only drawn
     thinner, and a standing pose still needs a clock or it holds its
     breath for the whole shot (see flesh() above for the same fix). */
  F.fig(x, y, h, { guise: "poet", phase: pose.phase ?? u * 1.7, ...pose }, 3);
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
   stripes under the halftone. CAPPED AT LEVEL 3. A lit tile at 5 sat level
   with a crowd figure at 4–5 and `ink` only keeps the brighter of the two —
   at the first pass a body crossing a lit square simply vanished into it,
   and once a whole column of tiles happened to pulse together it read as a
   third body standing in the room. Every figure in this film outranks the
   floor now, on purpose. */
const FLOOR_Y0 = 92, FLOOR_COLS = 16, FLOOR_ROWS = 4;
function danceFloor(F, u, opts = {}) {
  const { rate = 2.2, cx = 96 } = opts;
  const tw = F.W / FLOOR_COLS, th = (F.H - FLOOR_Y0) / FLOOR_ROWS;
  for (let r = 0; r < FLOOR_ROWS; r++) {
    for (let c = 0; c < FLOOR_COLS; c++) {
      const cxT = (c + 0.5) * tw, cyT = FLOOR_Y0 + (r + 0.5) * th;
      const d = Math.hypot(cxT - cx, cyT - FLOOR_Y0) / 70;
      const v = (Math.sin(u * TAU * rate - d * 5) + 1) / 2;
      const lvl = v > 0.72 ? 3 : v > 0.42 ? 2 : 1;
      F.rect(c * tw + 1, FLOOR_Y0 + r * th + 1, tw - 2, th - 2, lvl);
    }
  }
  F.line(0, FLOOR_Y0 - 1, 84, FLOOR_Y0 - 1, 4, 1);
  F.line(96, FLOOR_Y0 - 1, 192, FLOOR_Y0 - 1, 4, 1);
}

/* the crowd: deterministic, so the same seed redraws the same club across
   M1–M3 and M6 — one room, thinning, not four different rooms of extras.
   MINIMUM SEPARATION IS ENFORCED. The first pass placed x by chance alone
   and two dancers eight cells apart, staggered in y, chained into a single
   silhouette twice anyone's height — a fourth figure nobody asked for. */
function crowd(F, u, n, seedBase, opts = {}) {
  const { yBand = [100, 138], gap = 18, minSep = 17 } = opts;
  const R = F.rng(seedBase);
  const used = [];
  for (let k = 0; k < n; k++) {
    const r1 = R(), r2 = R(), r3 = R(), r4 = R();
    let x = 14 + r1 * 164;
    if (Math.abs(x - 96) < gap) x += (x < 96 ? -1 : 1) * gap;
    for (const ux of used) if (Math.abs(x - ux) < minSep) x += (x < ux ? -1 : 1) * (minSep - Math.abs(x - ux));
    x = Math.max(6, Math.min(186, x));
    used.push(x);
    const y = yBand[0] + r2 * (yBand[1] - yBand[0]);
    const h = 20 + r3 * 9, face = r4 > 0.5 ? 1 : -1;
    const phase = u * (2.2 + r1 * 3.4) + r2 * 6;
    /* WEIGHT RIDES THE SAME CLOCK AS THE SWING: a crowd standing at 0.5 is
       a diagram wearing motion, not a body dancing — hips have to actually
       carry the shift the arms are already performing. Each dancer's own
       phase decides which hip, so the room never falls into lockstep. */
    F.fig(x, y, h, { mode: "stand", arms: "swing", phase, face,
      weight: 0.5 + Math.sin(phase * TAU * 0.5) * 0.32,
      headTurn: Math.sin(phase * TAU * 0.5 + 0.8) * 0.4,
      lean: Math.sin(phase * TAU) * 0.12 }, 4);
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

/* ONE POUR, BRAIDED. A single dashed line is a scratch, and three of them
   ruled across an empty frame is a diagram of a pour — which is what the first
   version of M5 rendered as. A column of falling water is several strands that
   spread as they fall and step downstream on their own dash phases, so no two
   of them are ever in register and the fall is motion rather than two drawings
   that happen to differ. */
function pour(F, u, x0, y0, x1, y1, lvl, seedK) {
  const n = 24;
  for (let s = -1; s <= 1; s++) {
    const off = Math.floor(u * 26 + s * 3 + seedK);
    for (let k = 0; k < n; k++) {
      if ((((k - off) % 4) + 4) % 4 >= 2) continue;
      const t0 = k / n, t1 = (k + 1.05) / n;
      const w0 = s * (1.2 + t0 * 2.6), w1 = s * (1.2 + t1 * 2.6);
      F.line(lerp(x0, x1, t0) + w0, lerp(y0, y1, t0), lerp(x0, x1, t1) + w1, lerp(y0, y1, t1),
             s === 0 ? lvl : Math.max(2, lvl - 2), 1.4);
    }
  }
}

export default {
  n: "08", slug: "08-newly-single", title: "NEWLY SINGLE",
  tagline: "a soul leaves a body on a dance floor",
  accent: "#5aa7ff", seed: 808,
  /* THE FILM'S OWN PASSAGE of the suite's 24-minute score, taken from the
     original running order. The runtime stretches this film's movements to
     fill it, so picture and record line up without either being cut. */
  window: [732.136, 833.386],
  /* the bed follows the body: level through the crowd, up at the separation,
     a hard jump for the planet ("much larger... and much hotter"), down
     through the cooling, and lowest at the end — settled, not resolved */
  /* KEY: C Aeolian, one octave down — natural minor for a soul that leaves
     its body and, by "back to my body", returns to the tonic it started
     from; not bright, this is a loss film even where it dances. */
  drone: { base: 32.70, steps: [0, 0, 7, -4, 2, -9, 0, -7] },
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
           to supply, not a caption he can perform by himself. His weight
           still drifts, slowly, hip to hip across the whole movement —
           even someone standing still shifts eventually — and the throb
           lands as a wince (a small crouch, the head dipping) on the SAME
           three `at` values the cues strike, so the ache is seen and heard
           on the same beat rather than one merely scoring the other. */
        const sway = Math.sin(u * TAU * 1.1) * 0.05;
        const wince = Math.max(
          win(u, 0.10, 0.15, 0.17, 0.24),
          win(u, 0.45, 0.50, 0.52, 0.59),
          win(u, 0.80, 0.85, 0.87, 0.94));
        flesh(F, u, 96, 138, 34, { mode: "stand", arms: "down", lean: sway,
          weight: lerp(0.32, 0.68, smooth(u)),
          crouch: 0.04 + wince * 0.11, headTilt: -wince * 0.5 });
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
           of someone still standing because standing takes no decision.
           The weight settles onto one hip and the crouch deepens as the
           escape completes — a body left behind SAGS, it does not hold
           its own posture once the thing animating it has gone. */
        flesh(F, u, bx, by, 34, { mode: "stand", arms: "down", rot: 0.07, lean: 0.03,
          weight: lerp(0.5, 0.72, esc), crouch: esc * 0.09,
          breath: lerp(1, 0.65, esc), headTilt: -esc * 0.18 });
        /* THE SOUL STARTS WHERE HE IS. It shares his position at u=0 and
           only then peels off — an escape has to begin coincident with the
           thing it's escaping, or it reads as a second person arriving
           rather than a first person leaving. Rejected: starting the soul
           already apart, which made M2 a reunion shot run backward. It
           looks BACK as it goes — headTurn against its own direction of
           travel — because an escape that never glances behind it reads as
           indifference, not as leaving. */
        const sx = lerp(bx, bx + 32, esc), sy = lerp(by - 6, 40, esc);
        const sh = lerp(34, 21, esc * 0.55);
        soulFig(F, u, sx, sy, sh, { mode: "stand", arms: esc > 0.5 ? "open" : "down", rot: -esc * 0.2,
          headTurn: -esc * 0.45, headTilt: esc * 0.2 }, 3.2, 0);
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
        /* phase 3.35, not 3 — an integer rate lands both strangers on the
           gait's own degenerate frame at u=0.5 (see WORLD-BRIEF's phase
           law). Each also turns its head toward the other as they close
           the gap — a collision that never looks at what it's colliding
           with reads as two props sliding together, not two people. */
        const t = Math.sin(u * TAU * 2.2), x1 = 66 - t * 9, x2 = 126 + t * 9, cy = 118;
        F.fig(x1, cy, 23, { mode: "stand", arms: "reach", face: 1, phase: u * 3.35,
          weight: 0.5 + t * 0.3, headTurn: 0.5 }, 5);
        F.fig(x2, cy, 23, { mode: "stand", arms: "reach", face: -1, phase: u * 3.35 + 1.1,
          weight: 0.5 - t * 0.3, headTurn: -0.5 }, 5);
        if (x2 - x1 < 24) lightning(F, x1 + 6, cy - 15, x2 - 6, cy - 15, 6, 40 + Math.floor(u * 10));
        /* the flesh, still dancing — the one figure in the room not
           counting down to leaving. Phase 7.35, same reason as above. */
        flesh(F, u, 96, 138, 34, { mode: "stand", arms: "swing", phase: u * 7.35,
          weight: 0.5 + Math.sin(u * TAU * 3.35) * 0.3,
          lean: Math.sin(u * TAU * 1.1) * 0.05 });
        /* the soul, small and apart, imagining rather than inhabiting — the
           reach down to the body is dashed because imagining isn't a wire,
           it's intermittent. Head tilted down at what it's imagining. */
        const sx = 158, sy = 30;
        soulFig(F, u, sx, sy, 15, { mode: "stand", arms: "open", headTilt: -0.4, headTurn: -0.3 }, 2.1, 0.6);
        spark(F, sx, sy - 15 * 0.885);
        for (let k = 0; k < 24; k += 3) F.ink(lerp(sx, 96, k / 24), lerp(sy, 108, k / 24), 2);
      },
    },
    {
      label: "THE EQUATOR", seconds: 13,
      line: "Now let us put my soul in the middle of an open field — at the equator of a planet much larger than my own, and much hotter.",
      cues: [
        { at: 0.05, f: 46, decay: 1.2, gain: 0.5, partials: [1, 1.4, 2.1], noise: 0.5, nDecay: 0.4, seed: 831 },
        { at: 0.34, f: 98, decay: 0.30, gain: 0.45, partials: [1, 1.7, 2.6], noise: 0.85, nDecay: 0.05, seed: 832 },
        { at: 0.72, f: 2600, decay: 0.15, gain: 0.3, partials: [1, 1.8], noise: 1.0, nDecay: 0.08, seed: 833 },
      ],
      draw(u, F) {
        F.clear(0);
        /* MUCH HOTTER IS A SUBTRACTION. Past a certain temperature heat stops
           adding anything to a picture and starts taking the picture away, so
           the one monotone quantity this movement runs on is the GLARE: it
           leaves the sun and blows the thick air off the sky, dot by dot on
           the ordered schedule, until there is nothing left up there to look
           at and the plain is standing in white. Rejected: haze that thickens
           with u, which is what the first pass drew — the frame got darker as
           it got hotter and read as weather closing in, not as noon. */
        const heat = u;
        /* the sun climbs toward the vertical, which is the only thing the word
           "equator" actually promises, and it grows the whole way up */
        const sunX = lerp(164, 110, smooth(heat)), sunY = lerp(46, 21, smooth(heat));
        const sunR = lerp(8, 17, heat), glare = lerp(5, 120, heat);
        /* THE AIR IS ONE SURFACE WITH NO GAP IN IT — rule 3's exception, taken
           deliberately, because a sky broken into runs is a set of clouds and
           this planet has none. It is held at 4 and never at 3: the soul is
           drawn at 3, and a level it shares with the sky is a level it cannot
           be seen against.
           ITS BOTTOM EDGE IS A DITHER BAND, NOT A COASTLINE. The first pass
           gave it a big slow wobble and a heavier band along the bottom, and
           the render came back with a range of hills standing where the sky
           was meant to be — the eye reads a dark mass with a rolling top edge
           as land every time, whatever it is called. Thinning it downward on
           the ordered schedule reads as air instead, because air is the only
           thing that ends by running out. */
        F.map((x, y, v) => {
          const lip = 58 + (F.n2(x * 0.10, 3.7) - 0.5) * 5;
          if (y > lip) return;
          if (y > lip - 13 && F.bayer(x, y) > (lip - y) / 13) return;
          const d = Math.hypot((x - sunX) * 0.9, y - sunY);
          const g = glare - d;
          if (g > 7) return 0;
          if (g > -7 && F.bayer(x, y) < (g + 7) / 14) return 0;
          return y < 16 ? 5 : 4;
        });
        const gy = planetGround(F, 118);
        /* MY OWN PLANET, FOR SCALE. A whole second horizon would have
           argued with the one that matters; a marble in the corner argues
           nothing — it just makes the big one big by being small next to
           it. Drawn as paper with a rim so it is the same small world in a
           thick sky and in a white one. Rejected: shrinking it across the
           movement, which says it is going away; the line says it is smaller,
           not that it is leaving. */
        F.disc(15, 15, 4.5, 0, true); F.ring(15, 15, 5.4, 6, 1);
        /* heat off the ground: SHORT SIDEWAYS RIPPLES STACKED IN THE AIR, and
           the tiers come up one at a time as the temperature climbs, so the
           count is the thermometer. Two drafts got this wrong the same way —
           an upright stroke that leans a little reads as a mast, and an
           upright stroke that wavers and is rooted at the ground line reads as
           a tuft of grass, on the one planet whose entire claim is that the
           field is empty. Heat displaces what is behind it SIDEWAYS; drawn
           sideways, and standing clear of the soil, it cannot be mistaken for
           anything that grows. */
        for (let k = 0; k < 34; k++) {
          const bx = 6 + F.noise(k, 21) * 176;
          const tier = k % 5;
          const on = clamp01(heat * 1.9 - tier * 0.16 - F.noise(k, 7) * 0.35);
          if (on < 0.15) continue;
          const y = gy(bx) - 4 - tier * 4.5;
          const wob = Math.sin(u * TAU * (0.9 + tier * 0.18) + k * 1.7) * 3.4;
          const len = (4 + F.noise(k, 33) * 5) * (0.4 + on * 0.6);
          F.line(bx + wob, y, bx + wob + len, y - 1, tier > 2 ? 2 : 3, 1);
        }
        /* THE FIELD IS OPEN, WHICH MEANS EMPTY. Rejected: scattering rocks
           or scrub to fill it — the line's whole claim is that there is
           nothing here but him and the curve of the ground. */
        /* NOW LET US PUT MY SOUL. It is set down out of the air onto the middle
           of the field, from the high right where M3 left it imagining, and the
           equator is what its feet find. For the first beat it is inside air
           heavier than it is and simply cannot be seen — a body at 3 in a sky
           at 4 is not a faint body, it is no body — so it does not become a
           figure until it is below the lip. That emergence is the arrival, and
           it costs nothing but the order of two numbers. */
        const drop = smooth(clamp01(u / 0.34));
        const land = win(u, 0.29, 0.345, 0.38, 0.50);       // the knees taking it
        const bake = ss(0.52, 0.96, u);                     // how far the heat is into him
        const sx = lerp(113, 96, drop), sy = lerp(50, gy(96), drop), sh = lerp(21, 26, drop);
        soulFig(F, u, sx, sy, sh, {
          mode: "stand", arms: "open", rot: lerp(0.22, 0, drop),
          weight: lerp(0.5, 0.28, drop) + bake * 0.34,
          crouch: land * 0.24 + bake * 0.14,
          headTilt: lerp(0.05, 0.45, drop) - bake * 0.80,
          headTurn: lerp(-0.35, 0.5, drop) * (1 - bake * 0.7),
          /* the shielding hand starts exactly where the open arm already had
             it, so it comes up out of the pose instead of snapping into one */
          gesture: [lerp(-sh * 0.31, sh * 0.19, bake), lerp(sh * 0.755, sh * 0.99, bake)],
        }, 2.0, 0);
        spark(F, sx, sy - sh * 0.885);
        /* the sun is drawn AFTER the glare it is the source of. Drawn before,
           it is inside the region its own light has already cleared, and the
           map takes it. At 7, not 6: a sun one level darker than the sky it
           hangs in is a smudge. */
        F.disc(sunX, sunY, sunR, 7);
        for (let k = 0; k < 9; k++) {
          const a = k / 9 * TAU + u * 0.25;
          const r0 = sunR + 2, r1 = sunR + lerp(4, 15, heat);
          F.line(sunX + Math.cos(a) * r0, sunY + Math.sin(a) * r0,
                 sunX + Math.cos(a) * r1, sunY + Math.sin(a) * r1, 6, 1);
        }
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
        /* THE ONE MONOTONE QUANTITY: how far down it has got him. Everything
           in this movement is hung on it — the baths empty, the salt piles up,
           the pool spreads, and the body opens out of the brace it walked in
           with. The heat is the only thing here that does not run one way, and
           it is drawn as the steam that is leaving. */
        const cool = smooth(u);
        /* the closest moons: too near to be background, too small to be suns.
           Paper with a rim, so they read the same over the white plain that
           the sun burned M4 down to. They sit between the baths rather than
           over them: at the corners each moon landed inside a basin's outline
           and the two read as one object with a bubble in it. */
        F.disc(58, 9, 4.5, 0, true); F.ring(58, 9, 5.4, 6, 1); F.disc(60, 7, 1.2, 4);
        F.disc(136, 7, 3.4, 0, true); F.ring(136, 7, 4.2, 6, 1);
        /* the streams land ON HIM, which is what "cool me down" says, but they
           land on his crown and not through his chest: converging at the ground
           put three columns of water straight down the middle of a level-3
           body and the figure simply went missing inside its own scene. */
        const tx = 96, ty = gy(96) - 31;
        /* THE ANGLES OF THE NEWEST RELIGIONS: three pours from three
           unrelated directions — one source would have been one religion,
           not several. Two carry an ice bath at their origin; the third is
           bare sky, a grace with no basin under it. Curse and bless are
           the same gesture at two ink weights, and the film never says
           which stream is which. */
        const STREAMS = [
          { x0: 26, y0: 16, lvl: 5, ice: true, k: 0 },
          { x0: 166, y0: 24, lvl: 3, ice: true, k: 2 },
          { x0: 96, y0: 2, lvl: 4, ice: false, k: 4 },
        ];
        for (const s of STREAMS) {
          if (s.ice) {
            /* A BATH THAT IS BEING POURED OUT IS A BATH THAT IS EMPTYING. The
               level inside it is the pour seen from the other end, and it is
               the cheapest place in the frame to put the same number twice. */
            const bw = 17, bh = 10;
            F.box(s.x0 - bw / 2, s.y0 - bh, bw, bh, 6, 1);
            const lv = Math.round(lerp(bh - 3, 0, cool));
            if (lv > 0) F.rect(s.x0 - bw / 2 + 1, s.y0 - 1 - lv, bw - 2, lv, 4);
            for (let q = 0; q < 3; q++)                       // ice, still floating on what is left
              if (lv > 2) F.box(s.x0 - 6 + q * 5, s.y0 - 1 - lv, 3, 3, 6, 1);
          }
          pour(F, u, s.x0, s.y0, tx, ty, s.lvl, s.k);
        }
        /* where three streams land on one spot, water leaves it again */
        for (let k = 0; k < 11; k++) {
          const p = ((u * 3.1 + k * 0.317) % 1), a = Math.PI * (0.08 + k / 11 * 0.84);
          const r = p * 17;
          F.ink(Math.round(tx - Math.cos(a) * r), Math.round(ty - Math.sin(a) * r * 0.55 + p * p * 9 - 3), 4);
        }
        /* STEAM: cold water on ground the last movement left too hot to stand
           on. It is the one quantity here that does not only grow — it comes up
           when the water lands and it is gone once the ground has given in,
           which is the whole of "cool me down" said once in a substance. */
        const steam = win(u, 0.02, 0.18, 0.42, 0.84);
        for (let k = 0; k < 30; k++) {
          const bx = tx + (F.noise(k, 41) - 0.5) * 104;
          const rise = (0.4 + F.noise(k, 43) * 0.9) * 30 * steam;
          if (rise < 2.5) continue;
          const t = ((u * 0.8 + F.noise(k, 45)) % 1);
          const yy = gy(bx) - 2 - t * rise, drift = Math.sin(t * 4 + k) * (1.4 + t * 5);
          F.line(bx + drift, yy, bx + drift + 3.5, yy - 1, t > 0.55 ? 1 : 3, 1);
        }
        /* THE POOL. It spreads from where the three streams land and it never
           drains: "cool me down" is a quantity that only goes one way. By the
           end it has reached both edges of the frame and stopped nowhere in it,
           which is what the line's last sentence says out loud. A sheet of
           standing water is rule 3's exception, taken deliberately — its whole
           meaning is that it has no gap in it — and its outer edge is a
           dithered arc rather than an end, so nothing here is ruled. */
        const reach = lerp(4, 138, cool);
        F.map((x, y, v) => {
          if (v > 0.4 || y < gy(x) - 1) return;
          /* the waterline wanders on a long wavelength AND a short one; on the
             short one alone the pool ended in two near-vertical cuts and read
             as a rectangle of water laid on the plain */
          const d = Math.abs(x - tx) + (F.n2(x * 0.021, 9.1) - 0.5) * 34
                                     + (F.n2(x * 0.10, 3.3) - 0.5) * 9;
          if (d > reach) return;
          if (d > reach - 17) return F.bayer(x, y) < (reach - d) / 17 ? 2 : undefined;
          return y - gy(x) > 20 ? 3 : 2;
        });
        /* SALTED FROM THE CLOSEST MOONS: it comes off the water rather than in
           it, and there is more of it every second — a count, spreading with
           the pool that carries it. */
        const R = F.rng(51);
        for (let k = 0, n = Math.round(7 + cool * 34); k < n; k++) {
          const a = R(), b = R();
          F.disc(tx + (a - 0.5) * (24 + cool * 96), gy(96) + 1 + b * 6, 0.9, 5);
        }
        /* the flinch: a small crouch and a downward head, timed to the same
           three `at` values the pours strike so the cold LANDS on the
           picture the instant it lands on the ear. Under it runs the longer
           motion — a body braced against M4's heat, opening as the cold works
           through it: the crouch comes off, the weight settles, the head comes
           up. Rejected: holding the flinch pose for the whole movement, which
           made three separate shocks read as one continuous wince. */
        const flinch = Math.max(
          win(u, 0.06, 0.10, 0.13, 0.20),
          win(u, 0.38, 0.42, 0.45, 0.52),
          win(u, 0.70, 0.74, 0.77, 0.84));
        soulFig(F, u, 96, gy(96), 26, { mode: "stand", arms: "open",
          crouch: lerp(0.20, 0.02, cool) + flinch * 0.14,
          weight: lerp(0.72, 0.42, cool),
          headTilt: lerp(-0.35, 0.30, cool) - flinch * 0.5,
          headTurn: lerp(0.30, 0, cool) }, 2.0, 0);
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
           figures otherwise never fall. Breathing in the smoke, chin
           lifting as the lungs fill — and the weight settles back onto its
           heel as arrival completes, the opposite drift from M2's sag. */
        flesh(F, u, bx, by, 34, { mode: "stand", arms: "open", rot: -0.15, lean: -0.05,
          weight: lerp(0.7, 0.4, ret), headTilt: 0.15 + Math.sin(u * TAU * 0.6) * 0.08 });
        /* the soul comes home along the kind of path it left by — high and
           to the side, down onto him — and the flicker itself slows as it
           arrives, so settling in is a frequency change, not a fade. Its
           gaze comes down from wherever it was to meet the body it is
           rejoining — headTilt and headTurn both resolve to level at ret=1. */
        const sx = lerp(bx + 32, bx, ret), sy = lerp(38, by - 24, ret), sh = lerp(20, 34, ret);
        const freq = lerp(4.4, 1.0, ret);
        soulFig(F, u, sx, sy, sh, { mode: "stand", arms: "open", rot: lerp(-0.2, -0.05, ret),
          headTilt: lerp(0.35, 0, ret), headTurn: lerp(-0.4, 0, ret) }, freq, 1.1);
        spark(F, sx, sy - sh * 0.885, ret > 0.8);
        /* THE SMOKE FILLS THE ROOM: a per-dot allegiance the room concedes
           to, not a fog laid over it — the dot law, applied to weather. The
           first pass ran the noise at 0.045 and got four or five cloud-sized
           blobs, which read as weather rather than smoke; a smaller wave-
           length gives many small wisps instead of one big one. */
        const fill = ret * 0.55;
        F.map((x, y, v) => {
          const s = F.fbm(x * 0.10 + u * 1.6, y * 0.11, 2);
          if (s > 0.56 && F.bayer(x, y) < fill * (s - 0.5) * 3.4) return Math.max(v, 2);
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
        /* MOUNTAINS ARE A MASS WITH A TOP EDGE, NOT A TOP EDGE. The first pass
           drew both ranges as polylines and the render came back as a line
           chart — two zigzags on blank paper, which is a schematic of a
           landscape and not a landscape. Filled, they finally give this
           movement the one thing it never had: a ground for the man to be
           seen against. Held at 1 and 3, low: a distant range is PALE, and a
           black seated body needs somewhere to be black.
           BOTH RANGES ARE THE SAME SILHOUETTE. H() is sampled once in node
           space and both calls read it, so "unfamiliar, yet relatable" is
           literally one shape drawn twice — the second raised and offset, and
           the offset only grows, which is the shape you almost recognise
           getting less like the one you know. */
        const H = (i) => 18 + F.noise(i * 15, 5) * 44;
        const ridge = (shiftX, raise, lvl) => {
          for (let x = 0; x < 192; x++) {
            const t = (x - shiftX) / 15, i = Math.floor(t);
            const y = 132 - raise - lerp(H(i), H(i + 1), t - i);
            F.rect(x, y, 1, 133 - y, lvl);
          }
        };
        const nearY = (x) => {
          const t = x / 15, i = Math.floor(t);
          return 132 - lerp(H(i), H(i + 1), t - i);
        };
        ridge(lerp(6, 40, smooth(u)), 26, 1);          // the one that is going
        ridge(0, 0, 3);                                // the one that stays
        /* the ground, broken — even a horizon this quiet doesn't get to be
           one unbroken bar */
        F.line(0, 132, 70, 132, 5, 1); F.line(82, 132, 192, 132, 5, 1);
        /* IN THE DISTANCE, AND GETTING FURTHER. Distance in any graphic
           tradition is air, so the air is the movement: it fills the valleys
           and climbs, at the same weight as the far range, until the far range
           is not a shape any more but part of what is between him and it.
           Monotone, and it never reaches the top of the frame — this film does
           not get to close over. */
        const air = lerp(133, 34, smooth(u));
        F.map((x, y, v) => {
          if (v > 0.4) return;
          const top = air + (F.n2(x * 0.035, 6.4) - 0.5) * 18;
          if (y < top || y > nearY(x)) return;
          if (y < top + 12 && F.bayer(x, y) > (y - top) / 12) return;
          /* AIR IS NOT A WALL — BUT A HOLE IN IT IS NOT AIR EITHER. The
             thinning used to be a hard cut on a low-frequency noise, and at
             this scale that put two round paper holes in the sky that read as
             the render dropping out rather than as clearer air. The noise now
             sets a DENSITY and the Bayer schedule spends it, with a floor
             under it: the thin places are thin and never empty. */
          const th = F.n2(x * 0.10, y * 0.14);
          const dens = 0.22 + 0.78 * clamp01((th - 0.26) / 0.42);
          if (F.bayer(x, y) > dens) return;
          return 1;
        });
        /* the two of him, quiet, still two — the film never draws them as
           one body, because the line does not claim they became one. At 29
           the flesh draws solid, so the black silhouette holds against the
           range behind it, and the soul's one contribution is the hollow it
           puts where the head is. Both look down and inward, toward the
           thoughts orbiting at arm's reach rather than out at the horizon —
           "wandering thoughts within reach" is closer to him than the
           mountains are. */
        flesh(F, u, 96, 132, 29, { mode: "sit", arms: "down", face: 1, headTilt: -0.18 });
        soulFig(F, u, 96, 132, 29, { mode: "sit", arms: "down", face: 1, headTilt: -0.22, headTurn: 0.2 }, 0.6, 0);
        const hx = 96, hy = 132 - 29 * 0.73;
        spark(F, hx, hy);
        /* WANDERING THOUGHTS WITHIN REACH: they orbit, they don't leave — the
           radius is arm's length and it holds for the whole movement, the last
           quiet fact this film states. There are fourteen of them, not five:
           at five they were specks and the only moving thing in the frame was
           too small to be a thing. */
        for (let k = 0; k < 14; k++) {
          const wx = hx + Math.sin(u * TAU * (0.24 + k * 0.031) + k * 2.1) * (7 + (k % 3) * 3.5)
                        + (F.n2(k, 3) - 0.5) * 3;
          const wy = hy - 3 + Math.cos(u * TAU * (0.19 + k * 0.027) + k * 1.3) * (5 + (k % 4) * 2);
          F.disc(wx, wy, k % 3 === 0 ? 1.4 : 1.0, 5);
        }
      },
    },
  ],
};
