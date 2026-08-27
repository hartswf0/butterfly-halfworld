/* ============================================================================
   11 · NEW DAY — a WYGWYL halfworld

   ADVANCE. The temple is not revealed, dissolved into, or cross-faded up —
   it is COUNTED into being: nineteen pieces (three platform courses, six
   columns, seven entablature blocks, two pediment slopes, one finial), each
   arriving on its own Bayer schedule and then DWELLING, untouched, while the
   next piece takes its turn. It is drawn from ONE function, `temple(F,
   progress, l)`, called with a bigger `progress` in M3 than in M2 and a
   bigger one still — complete — in M6. Same cx, same ground line, same six
   columns: the discipline of this film is that there is only ever one
   drawing of this building.

   LIGHT IS THE OTHER THING BEING COUNTED, and it only ever goes one way.
   Fog claims the ground in M1 and gives it back; then the night comes off the
   sky from the horizon up (M2), the last of the air is cut away by wedges
   opening from the risen sun (M3), and in M6 the whole of it happens again at
   full strength and on the ground — a terminator running west across the
   valley floor as the sun clears the ridge. Each is a different mechanism for
   the same one-way fact, and all four are per-dot allegiance swaps: this
   world has no dimmer.

   Fog is the first of those fronts: an edge that sweeps across x, in on the
   first half of M1 and out on the second — one triangular number for
   "floating... as it exhales." The infinity pool (M4) never draws its own
   reflection: it draws the sky once, in the top half of the field, and lets
   the engine's own `kaleido:'y'` — the one honest use of that fx in the
   suite — fold it into the bottom half, because a still pool's reflection
   really is an exact mirror and this is the one place in the suite where
   that happens to be true rather than a shortcut. M5 walks on the water by
   making the surface's own amplitude a number that goes to zero under his
   feet and nowhere else — the miracle is arithmetic, not a caption.
   ========================================================================= */
import { TAU, lerp, clamp01, smooth, ss, win } from "../halfworld.mjs";

/* ------------------------------------------------------------- the temple
   `progress` counts finished pieces, 0..19, fractional mid-arrival. Every
   piece dissolves in over the first ~40% of its own one-unit window on the
   ordered schedule and then holds — the dwell is the point: a viewer who
   watches the whole window sees one stone arrive and sit still, not a bar
   filling. Rejected: a single rect that grows taller with `progress`. That
   read as a loading bar, and a loading bar is not a construction. */
function stepAmt(progress, k, dissolve = 0.42) {
  return clamp01((progress - k) / dissolve);
}
function block(F, x, y, w, h, amt, l) {
  if (amt <= 0) return;
  const x0 = Math.max(0, Math.floor(x)), x1 = Math.min(F.W, Math.ceil(x + w));
  const y0 = Math.max(0, Math.floor(y)), y1 = Math.min(F.H, Math.ceil(y + h));
  for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++)
    if (F.bayer(xx, yy) < amt) F.ink(xx, yy, l);
}
/* a course is three set stones, not one slab — which also satisfies the
   dot law's own ban on an unbroken span, for free, because real coursed
   stone actually has joints in it */
function courseRow(F, x0, w, y, h, amt, l) {
  const gap = 1.4, seg = (w - gap * 2) / 3;
  for (let s = 0; s < 3; s++) block(F, x0 + s * (seg + gap), y, seg, h, amt, l);
}
function lineD(F, x0, y0, x1, y1, amt, l, th = 1) {
  if (amt <= 0) return;
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
  for (let k = 0; k <= n; k++) {
    const x = Math.round(x0 + (x1 - x0) * k / n), y = Math.round(y0 + (y1 - y0) * k / n);
    if (F.bayer(x, y) < amt) { if (th <= 1) F.ink(x, y, l); else F.disc(x, y, th / 2, l); }
  }
}

const T_CX = 96, T_GY = 122, T_CN = 6;
const T_COLX = Array.from({ length: T_CN }, (_, i) => lerp(-42, 42, i / (T_CN - 1)));
const T_BEAMPTS = [-48, ...T_COLX, 48];

function temple(F, progress, l = 7) {
  const cx = T_CX, gy = T_GY;
  /* three stepped courses, laid bottom first — the only order stone can
     actually go down in. Each is narrower than the one under it, so the
     steps themselves are the record of the count even at a glance. */
  const courses = [[130, 4], [114, 4], [98, 4]];
  let cy = gy;
  for (let k = 0; k < 3; k++) {
    const [w, h] = courses[k], amt = stepAmt(progress, k);
    courseRow(F, cx - w / 2, w, cy - h, h, amt, l);
    cy -= h;
  }
  const stylobate = cy, COLH = 35, colsTop = stylobate - COLH;
  /* six columns, left to right — the order a crew sets them, not a
     scatter, so "one column at a time" reads as a crew and not as noise */
  for (let i = 0; i < T_CN; i++) {
    const k = 3 + i, amt = stepAmt(progress, k);
    if (amt <= 0) continue;
    const x = cx + T_COLX[i];
    block(F, x - 2.6, colsTop, 5.2, COLH, amt, l);
    block(F, x - 4, colsTop - 3, 8, 3, amt, l);          // capital
    block(F, x - 3.4, stylobate - 2, 6.8, 2, amt, l);    // plinth
    lineD(F, x - 1, colsTop + 3, x - 1, stylobate - 3, amt, l);
    lineD(F, x + 1, colsTop + 3, x + 1, stylobate - 3, amt, l);
  }
  /* seven entablature blocks: five bays plus two overhangs, gapped where
     stone actually joints. Rejected: one long beam rect — besides being
     the unbroken span the dot law warns about, it made "one beam at a
     time" a lie, since there was only ever one beam to arrive. Sits flush
     ABOVE the capitals (colsTop-3) rather than overlapping them — the
     first pass put its floor at colsTop and the capitals, already present
     from every column, filled the beam's own bottom half before a single
     beam piece had arrived, so "one beam at a time" read as "the beam is
     already there." */
  const beamY = colsTop - 9;
  for (let i = 0; i < 7; i++) {
    const k = 9 + i, amt = stepAmt(progress, k);
    if (amt <= 0) continue;
    const x0 = cx + T_BEAMPTS[i] + 0.7, x1 = cx + T_BEAMPTS[i + 1] - 0.7;
    block(F, x0, beamY, x1 - x0, 6, amt, l);
  }
  /* the pediment: two raking slopes, split down the ridge so it is TWO
     placed pieces and not one symmetric stamp */
  const apex = beamY - 22, baseY = beamY;
  for (const side of [-1, 1]) {
    const k = side === -1 ? 16 : 17, amt = stepAmt(progress, k);
    if (amt <= 0) continue;
    for (let yy = Math.ceil(apex); yy < baseY; yy++) {
      const t = (yy - apex) / (baseY - apex), edge = cx + side * 48 * t;
      const a = Math.min(cx, edge), b = Math.max(cx, edge);
      for (let xx = Math.floor(a); xx <= Math.ceil(b); xx++)
        if (F.bayer(xx, yy) < amt) F.ink(xx, yy, l);
    }
    lineD(F, cx + side * 48, baseY, cx, apex, amt, l);
  }
  /* THE ONE ACCENT MARK IN THE WORLD, and it is the last piece — so the
     accent is a fact about completion, not decoration dropped in early.
     Rejected: putting it on the sun, which would have made "arrival"
     ambiguous with "morning." It only ever reaches level 8 in M6. */
  const amt18 = stepAmt(progress, 18, 0.34);
  if (amt18 > 0) {
    F.line(cx, apex, cx, apex - 5 * Math.min(1, amt18 / 0.55), l, 1.4);
    if (amt18 >= 0.55) F.put(cx, apex - 5, 8);
    if (amt18 >= 0.82) F.put(cx, apex - 6, 8);
  }
}

/* ---------------------------------------------------------------- weather
   Hills, water and fog — the world before and around the temple. */
/* THE RIDGE AS ONE FUNCTION. Three movements have to know where the hills are
   before they can decide which cells are sky and which are valley floor, so
   the profile is named rather than being re-typed inside the drawing that
   happens to use it. */
const ridgeYAt = (x, y0, amp) =>
  y0 - amp * 0.6 * Math.sin(x * 0.021 + 0.4) - amp * 0.35 * Math.sin(x * 0.05 + 2.1);
function hillsRidge(F, y0, amp, l = 4) {
  const ridgeY = (x) => ridgeYAt(x, y0, amp);
  for (const [a, b] of [[0, 68], [78, 128], [138, 192]])
    for (let x = a; x < b; x++) F.ink(x, Math.round(ridgeY(x)), l);
  /* THE TREE COVER THINS TOWARD THE FOOT OF THE HILL rather than stopping on
     a ruled line at y0+18. On paper that line was invisible; over a toned
     valley it drew a hard full-width tonal seam across the frame — the stripe
     the dot law warns about, arriving through the back door of a texture that
     simply ended. */
  for (let x = 0; x < F.W; x++) {
    const ry = ridgeY(x), foot = y0 + 18;
    for (let y = Math.ceil(ry); y < foot; y++) {
      const n = F.n2(x * 0.15, y * 0.22);
      const t = (y - ry) / Math.max(1, foot - ry);
      if (n > 0.58 + t * t * 0.34) F.ink(x, y, n > 0.76 ? l - 1 : l - 2);
    }
  }
}
/* horizontal wavefronts, broken twice per row — an unbroken sea is exactly
   the stripe the dot law warns about. `calm` kills amplitude AND tightens
   the crowding toward the horizon at once, the way a real, stilling sea
   does both together. */
function water(F, u, y0, y1, rows, calm, amp0, seedBase = 0) {
  for (let k = 0; k < rows; k++) {
    const t = k / Math.max(1, rows - 1);
    const y = lerp(y0, y1, t);
    const amp = amp0 * (1 - calm * 0.8) * (0.35 + t * 0.9);
    const gA = (F.noise(k + seedBase, 11) * 180) | 0, gB = (F.noise(k + seedBase, 23) * 180) | 0;
    for (let x = 0; x < F.W; x++) {
      if ((x > gA && x < gA + 16) || (x > gB && x < gB + 12)) continue;
      const yy = y + Math.sin(x * (0.08 + t * 0.05) + u * TAU * (0.3 + t * 0.35) + k * 1.3) * amp;
      F.ink(x, Math.round(yy), 4);
    }
  }
}
/* THE FOG IS A WAVEFRONT, not a wash: one edge, perturbed by noise, moving
   across x — in over the first half of u, out over the second, "floating
   ... as it exhales" as a single triangular number. It CLAIMS cells (an
   allegiance swap via F.map) rather than adding ink on top of them, because
   fog obscures what's under it and F.ink can only darken, never cover.
   Rejected: fx.invert as a stand-in for "fog" — that flips tone, it doesn't
   claim territory, and the line is explicitly about ground being covered. */
function fogSweep(F, u, y0, y1) {
  const sweep = u < 0.5 ? smooth(u * 2) : smooth((1 - u) * 2);
  F.map((x, y, v) => {
    if (y < y0 || y >= y1) return;
    const edge = x / F.W + (F.n2(x * 0.07, y * 0.09) - 0.5) * 0.28;
    if (edge < sweep - 0.05) {
      /* FLAT, not blobby. The first two passes shaded this by value noise
         (F.n2) at rising frequencies and every one of them still rolled up
         into a few soft continents across the 192-cell band — that is what
         interpolated noise does at any frequency, and it read as a hide or
         a cloud layer, not as mist sitting on the ground. Mist is closer to
         one flat tone than to weather, so it is one level with a sparse
         uncorrelated fleck (raw F.noise, no interpolation) on top. */
      return F.noise(x, y) > 0.93 ? 3 : 2;
    }
    if (edge < sweep && F.bayer(x, y) < (sweep - edge) / 0.05) return 2;
  });
}
function sunDisc(F, cx, cy, r, rays, l = 6) {
  F.disc(cx, cy, r, l);
  if (rays > 0) {
    for (let k = 0; k < 8; k++) {
      const a = k / 8 * TAU + 0.2, r0 = r + 2, r1 = r + 2 + rays * 9;
      lineD(F, cx + Math.cos(a) * r0, cy + Math.sin(a) * r0,
               cx + Math.cos(a) * r1, cy + Math.sin(a) * r1, 1, l - 2);
    }
  }
}
/* dew that winks: a density of small lights toggling on deterministic
   noise, gated by a floor of u — a pure function, not a random flicker
   with memory. Rejected: fx.invert as a global strobe, which would have
   winked the whole frame, not the dew specifically. */
function dewWinks(F, u, y) {
  for (let k = 0; k < 9; k++) {
    const x = 14 + k * 20 + F.noise(k, 5) * 8, yy = y + F.noise(k, 9) * 6;
    const phase = Math.floor(u * 16 + k * 2.3) % 3;
    if (phase === 0) { F.disc(x, yy, 1, 6); F.put(Math.round(x), Math.round(yy) - 1, 6); }
  }
}
/* `l` because half this film's ground is now standing on a toned field rather
   than on paper, and a level-2 speck on a level-3 shadow is not a speck */
function groundTexture(F, y0, y1, seedK, l = 2) {
  const R = F.rng(seedK);
  for (let k = 0; k < 70; k++) F.disc(R() * F.W, y0 + R() * (y1 - y0), 0.8, l);
  for (const [a, b] of [[0, 60], [70, 130], [140, 192]]) F.line(a, y0, b, y0, l + 1, 1);
}

export default {
  n: "11", slug: "11-new-day", title: "NEW DAY",
  tagline: "the temple assembles, one course at a time",
  accent: "#5aa7ff", seed: 1111,
  /* THE FILM'S OWN PASSAGE of the suite's 24-minute score, taken from the
     original running order. The runtime stretches this film's movements to
     fill it, so picture and record line up without either being cut. */
  window: [1056.659, 1168.019],
  /* KEY: G Lydian, bright — paired with 06 as the suite's brightest
     register; the temple assembles toward the octave the way the film
     assembles toward daylight. */
  drone: { base: 98.00, steps: [0, 0, 2, 6, 7, 9, 12], bright: true },
  /* PROSODY · Ethiopia · Qene + Baganna. Every phrase dictates its own breath, so the sweep wanders and never
     settles; the ground opens late, which is the second meaning arriving
     inside a sentence that had already finished.
     `deep/sonify.mjs` scans the field under this law. The root is the drone's
     own base folded into one octave, so the film sings in the key it hums in. */
  score: { engine: "qene", mode: "ambassel" },
  movements: [
    {
      label: "MORNING FOG", seconds: 13,
      line: "Fog covers the seas and hugs the tree-covered hills, floating through the morning as it exhales its introduction. This world is at peace.",
      cues: [
        { at: 0.12, f: 70, decay: 0.6, gain: 0.4, partials: [1, 1.6, 2.3], noise: 0.85, nDecay: 0.3, seed: 11 },
        { at: 0.68, f: 300, decay: 0.9, gain: 0.32, partials: [1, 1.5, 2.0], noise: 0.9, nDecay: 0.5, seed: 12 },
      ],
      draw(u, F) {
        hillsRidge(F, 58, 16, 4);
        water(F, u, 66, 128, 9, 0.65, 3.2, 0);
        fogSweep(F, u, 18, 118);
      },
    },
    {
      label: "FIRST COURSES", seconds: 13,
      line: "In the awakening of dawn, in fresh muted colors: we can rebuild this temple. It's a new day — a catharsis for me to say, with newfound energies and recycled airs.",
      cues: [
        { at: 0.30, f: 140, decay: 0.25, gain: 0.5, partials: [1, 1.8, 2.6], noise: 0.6, nDecay: 0.05, seed: 21 },
        { at: 0.78, f: 520, decay: 0.8, gain: 0.42, partials: [1, 2.01, 3.02], noise: 0.15, nDecay: 0.03, seed: 22 },
      ],
      draw(u, F) {
        /* THE AWAKENING OF DAWN IS A THING THAT HAPPENS TO THE WHOLE FIELD,
           and this movement used to open on paper — which meant nothing in it
           could awaken, because nothing in it was asleep. Seventeen seconds of
           three stones and six columns arriving at one per cent of the frame
           apiece is a photograph of a building site.

           So the night is here at the start and the light takes it from the
           HORIZON UP, which is where dawn comes from, and tallest in the east,
           because the sun that is still under the hills is over there. Two
           whole levels of night above the glow line: quantised falloff is the
           only falloff this lattice has, and it is what makes a sky a sky
           rather than a wash. No sun disc anywhere in the movement — the
           awakening of dawn is the hour BEFORE the sun, and drawing one here
           would spend the sunrise the last movement needs. */
        const dawn = smooth(u);
        const HY = 46, AMP = 10;
        const glow = lerp(1, 74, dawn);
        /* the valley is still under the night and only catches up dot by dot:
           the first courses are laid before the light gets down here, which is
           what "in fresh muted colors" is a description of */
        const lift = clamp01((dawn - 0.28) / 0.66);
        F.map((x, y) => {
          const ry = ridgeYAt(x, HY, AMP);
          const a = ry - y;
          if (a >= 0) {
            const g = glow * (0.55 + 0.80 * x / F.W);
            return a < g ? 0 : a < g + 26 ? 1 : 2;
          }
          const d = (y - ry + (F.n2(x * 0.04, 3) - 0.5) * 12) / 100;
          const base = d > 0.66 ? 3 : d > 0.28 ? 2 : 1;
          return F.bayer(x, y) < lift ? base - 1 : base;
        });
        hillsRidge(F, HY, AMP, 6);
        /* recycled airs: a few soft wisps, drifting. They are CLEARINGS now,
           not ink — on a valley that is itself a tone, a level-1 smudge is
           invisible, and air that has been recycled is air you can see
           through. They never claim territory, which is what separates them
           from M1's fog: dawn is clearing, not arriving. */
        for (let k = 0; k < 5; k++) {
          const cx = 20 + k * 34 + Math.sin(u * TAU * 0.5 + k) * 7;
          const cy = 92 + Math.sin(u * TAU * 0.3 + k * 1.3) * 5;
          /* a lens, not a disc: two stacked circles read as eggs lying in the
             field, and air lies along the ground in a streak */
          for (let dx = -15; dx <= 15; dx++) {
            const h = 2.0 * (1 - (dx / 15) * (dx / 15)) + 0.6;
            for (let dy = -h; dy <= h; dy++)
              if (F.bayer(cx + dx, cy + dy) < 1.35 * (1 - Math.abs(dy) / h))
                F.put(Math.round(cx + dx), Math.round(cy + dy), 0);
          }
        }
        groundTexture(F, T_GY, 140, 201, 5);
        temple(F, u * 9, 7);
        /* WE CAN REBUILD THIS TEMPLE — so there are two of them, and one of
           them arrives. The mason walks in from off the frame and reaches the
           stone he is setting at about the moment the third course goes down;
           the other is already at the far end of the platform. A small body
           (h14) only answers to mode, phase, arms and rot in this kit, so a
           crossing and a cut from open to up on the cue beat is the whole
           performance it can give — and a cut on a struck note is honest here
           the way 10's walk-to-ride cut is: a beat, not a blend. */
        const walk = clamp01((u - 0.06) / 0.50);
        F.fig(lerp(-22, 26, smooth(walk)), T_GY, 14,
          { mode: walk < 1 ? "walk" : "stand", phase: u * 6.35 + 0.15, face: 1,
            arms: walk < 1 ? "swing" : (win(u, 0.72, 0.78, 0.84, 0.92) > 0.5 ? "up" : "open") }, 6);
        F.fig(174, T_GY, 13, { mode: "stand", face: -1,
          arms: win(u, 0.24, 0.30, 0.36, 0.44) > 0.5 ? "up" : "reach",
          rot: -0.08 + Math.sin(u * TAU * 0.9) * 0.06 }, 6);
      },
    },
    {
      label: "COLUMNS AND BEAMS", seconds: 14,
      line: "We can rebuild this temple — under vibrant sun rays of glory, of the wisdoms of morning dews and their winks of luck.",
      cues: [
        { at: 0.22, f: 440, decay: 0.5, gain: 0.4, partials: [1, 2, 3, 4], noise: 0.2, nDecay: 0.05, seed: 31 },
        { at: 0.85, f: 1200, decay: 0.12, gain: 0.4, partials: [1, 2.7, 4.3], noise: 0.8, nDecay: 0.02, seed: 32 },
      ],
      draw(u, F) {
        const glory = smooth(u);
        const SX = 158, SY = 30, RAYS = 11;
        /* VIBRANT SUN RAYS OF GLORY. A shaft of light cannot be drawn as ink
           on cream, because in this world light IS the paper — so the AIR is
           given a tone and the rays are cut out of it: eleven wedges opening
           from the disc and lengthening until the field is more light than
           air. The wedges turn a tenth of a radian in eighteen seconds, which
           is under a cell a second at the frame's edge — enough that the light
           is alive, not enough to be a thing that spins.
           Rejected: the eight ink sticks that used to come off the disc. They
           are what a sun looks like in a pictogram, they were nine cells long,
           and lengthening them by four was this movement's only event. */
        F.map((x, y) => {
          const dx = x - SX, dy = y - SY;
          const d = Math.hypot(dx, dy);
          let p = (Math.atan2(dy, dx) + glory * 0.10) * RAYS / TAU;
          p -= Math.floor(p);
          const w = Math.abs(p - 0.5) * 2;                  // 1 on a ray's axis
          const reach = lerp(16, 300, glory) * (0.42 + w * 1.05);
          if (d < reach) return;
          if (d < reach + 20 && F.bayer(x, y) < (reach + 20 - d) / 20) return;
          return F.noise(x, y) > 0.93 ? 2 : 1;
        });
        /* the same hills as the movement before it, because it is the same
           morning and the same valley — held at 4 so the tone the rays are
           cutting stays the subject */
        hillsRidge(F, 46, 10, 4);
        sunDisc(F, SX, SY, 10, 0, 6);
        groundTexture(F, T_GY, 140, 301, 5);
        /* the dews only wink where the light has actually landed on them,
           which is the line's own causal claim about morning and luck */
        if (glory > 0.22) dewWinks(F, u, 132);
        /* HE WALKS THE STYLOBATE, AND HE WALKS BEHIND THE COLONNADE — drawn
           before the temple, so each column takes him and each gap gives him
           back. It is the one place in this film where the rig's own occlusion
           rule can be used on the building instead of on a body, and it is
           what a crew actually does: the man setting beams is up there among
           them, not standing next to the site pointing at it.
           Rejected: walking him across the ground. The platform spans cx±65,
           the temple is drawn after him at level 7, and he simply vanished
           into it for two thirds of the crossing. */
        F.fig(lerp(50, 142, smooth(clamp01(u / 0.94))), T_GY - 12, 15,
          { mode: "walk", phase: u * 10.35 + 0.15, face: 1 }, 6);
        temple(F, 9 + u * 9, 7);
        F.fig(172, T_GY, 13, { mode: "stand", arms: "reach", face: -1,
          rot: 0.10 + Math.sin(u * TAU * 0.8) * 0.06 }, 6);
      },
    },
    {
      label: "THE INFINITY POOL", seconds: 13,
      line: "With laps around infinity pools of edgeless dreams, that reflect the enormity of the skies.",
      /* THE ONE HONEST KALEIDO IN THE SUITE. Everything below is drawn only
         for y<72: the engine's own fx.kaleido:'y' mirrors it into the
         bottom half verbatim. A still pool's reflection genuinely is an
         exact mirror, so for once the cheap trick is also the true
         picture. EDGELESS means there is no coping line at the seam —
         drawing one would have put a visible edge on the one pool in the
         suite whose whole point is that it doesn't have one. */
      fx: { kaleido: "y" },
      cues: [
        { at: 0.18, f: 90, decay: 0.4, gain: 0.35, partials: [1, 1.5, 2.1], noise: 0.9, nDecay: 0.15, seed: 41 },
        { at: 0.65, f: 900, decay: 0.6, gain: 0.28, partials: [1, 2.3, 3.7], noise: 0.5, nDecay: 0.2, seed: 42 },
      ],
      draw(u, F) {
        for (let y = 0; y < 72; y++) for (let x = 0; x < F.W; x++) {
          const c = F.n2(x * 0.045, y * 0.05 + u * 0.4);
          if (c > 0.6) F.ink(x, y, c > 0.74 ? 2 : 1);
        }
        sunDisc(F, 150, 16, 8, 0.6, 6);
        for (const [bx, by, ph] of [[40, 14, 0], [64, 22, 1], [104, 10, 2]]) {
          const a = 2.2 + 0.15 * Math.sin(u * TAU * 0.4 + ph);
          F.line(bx - 4, by, bx, by - a, 3, 1); F.line(bx, by - a, bx + 4, by, 3, 1);
        }
        /* LAPS: there and back once, a triangle wave of u — the only
           lengths of pool this figure is given are the two ends of it */
        const lapT = u < 0.5 ? smooth(u * 2) : smooth((1 - u) * 2);
        const px = lerp(28, 166, lapT);
        /* phase carries a +0.15 offset because u*5 alone lands exactly on
           a whole stride at u=0.5 — legs and swinging arms both pass
           through the centreline at once and the figure collapses to a
           single stroke. He's mid-stride when the movement opens, not at
           the top of a cycle, which is the more natural place to start. */
        F.fig(px, 70, 20, { mode: "walk", phase: u * 5 + 0.15, face: u < 0.5 ? 1 : -1, arms: "swing" }, 6);
      },
    },
    {
      label: "WALKING ON WATER", seconds: 13,
      line: "And of modern faiths — that we too can walk on water. Deep breaths, in appreciation of present life, and our present positions.",
      cues: [
        { at: 0.18, f: 180, decay: 0.15, gain: 0.35, partials: [1, 1.8], noise: 0.5, nDecay: 0.05, seed: 51 },
        { at: 0.50, f: 250, decay: 1.0, gain: 0.3, partials: [1, 1.5], noise: 0.9, nDecay: 0.6, seed: 52 },
        { at: 0.82, f: 170, decay: 0.15, gain: 0.35, partials: [1, 1.8], noise: 0.5, nDecay: 0.05, seed: 53 },
      ],
      draw(u, F) {
        /* THE LINE SAYS WALK, so he walks — the whole width, once, without
           stopping. What was here was a standing body slid sideways between
           three marks over seventeen seconds: a man on castors, on a sea
           drawn as ten dotted rules on cream. A man standing on a diagram is
           not walking on water.

           SO THE SEA IS A FIELD. It is a tone that deepens toward the viewer,
           the crests are drawn into it rather than being all there is of it,
           and THE MIRACLE IS A HOLE: within about thirty cells of him the
           swell's amplitude goes to zero AND the surface goes to paper, so
           the stillness he is standing on is a pool of light that travels
           with him and exists nowhere else. Rejected: parting the water, or
           footprints — both make the water react to him, and the line's claim
           is that it doesn't. */
        const SEA = 52, FY = 112;
        F.disc(150, 20, 6, 6);
        /* two low streaks, not four discs: a disc in an empty sky reads as a
           seed head, and cloud at this hour lies along the horizon */
        for (const [cx, cy, w] of [[54, 28, 26], [110, 20, 18]])
          for (let dx = -w; dx <= w; dx++) {
            const h = 1.8 * (1 - (dx / w) * (dx / w)) + 0.5;
            for (let dy = -h; dy <= h; dy++) F.ink(Math.round(cx + dx), Math.round(cy + dy), 2);
          }
        /* DEEP BREATHS: the stillness itself rises and falls on one slow sine
           of u — a number that breathes, not a caption saying so. It sets both
           how flat the sea is and how far the flatness reaches, so the breath
           is one fact with two visible consequences. */
        const breath = 0.72 + 0.24 * Math.sin(u * TAU * 0.55);
        const px = lerp(20, 172, u);
        F.map((x, y) => {
          if (y < SEA) return;
          const near = clamp01(1 - Math.hypot((x - px) / (38 * breath + 10), (y - FY) / (28 * breath + 8)));
          if (near > 0 && F.bayer(x, y) < near * 2.4) return 0;
          const t = (y - SEA) / (F.H - SEA);
          /* the horizon is not a ruled seam: the tone arrives on the ordered
             schedule over the first few rows, which is also what distance
             does to a surface */
          if (t < 0.14 && F.bayer(x, y) > t / 0.14) return;
          /* the seam between the two depths is wobbled, because a straight
             tonal boundary across 192 cells is the stripe the dot law warns
             about even when it is a change of one level */
          return t + (F.n2(x * 0.045, 5) - 0.5) * 0.13 > 0.58 ? 3 : 2;
        });
        const rows = 10, y0 = 64, y1 = 140;
        for (let k = 0; k < rows; k++) {
          const t = k / (rows - 1), y = lerp(y0, y1, t);
          const ampBase = 2.6 * (1 - breath * 0.7) * (0.4 + t * 0.8);
          const gA = (F.noise(k, 41) * 180) | 0, gB = (F.noise(k, 53) * 180) | 0;
          for (let x = 0; x < F.W; x++) {
            if ((x > gA && x < gA + 16) || (x > gB && x < gB + 12)) continue;
            const near = clamp01(1 - Math.abs(x - px) / (38 * breath + 10));
            if (near > 0.52) continue;                  // flat, and lit, under him
            const amp = ampBase * (1 - near);
            const yy = y + Math.sin(x * 0.085 + u * TAU * 0.35 + k * 1.2) * amp;
            /* THE LEVEL IS MODULATED ALONG THE RUN. A crest is a nearly
               horizontal line, and a nearly horizontal line at one level over
               a toned sea is a bar — the two gaps per row are not enough once
               there is something behind them. No two adjacent cells agree
               strongly enough now for the halftone to find a rule in it, and
               the crests read as broken water instead. */
            const n = F.noise(x, k * 7);
            F.ink(x, Math.round(yy), n > 0.72 ? 4 : n > 0.40 ? 5 : 6);
          }
        }
        /* the stride is matched to the crossing: a hundred and fifty-two
           cells at 0.4h a step is six and a bit strides, so his feet land
           where he actually is instead of skating. And 6.35 rather than 6 —
           an integer rate puts both feet at the same offset at u=0.5 and the
           body collapses into one vertical stroke. */
        F.fig(px, FY, 30, {
          mode: "walk", phase: u * 6.35 + 0.15, face: 1, guise: "poet",
          arms: "swing", breath: 1.6, headTurn: 0.2,
        }, 7);
      },
    },
    {
      label: "A NEW DAY", seconds: 14,
      line: "We can rebuild this temple. It's a new day. A catharsis. We can welcome a new day.",
      cues: [
        { at: 0.05, f: 220, decay: 1.0, gain: 0.45, partials: [1, 1.5, 2, 3], noise: 0.2, nDecay: 0.1, seed: 61 },
        { at: 0.28, f: 660, decay: 1.6, gain: 0.55, partials: [1, 2, 3, 4, 5], noise: 0.12, nDecay: 0.03, seed: 62 },
        { at: 0.85, f: 1320, decay: 0.9, gain: 0.3, partials: [1, 2, 3], noise: 0.4, nDecay: 0.15, seed: 63 },
      ],
      draw(u, F) {
        /* A NEW DAY IS A CHANGE OF LIGHT OVER TIME, and it is the only thing
           in this suite that unambiguously is one — so the film's last
           movement is that change and nothing else. It used to be a finished
           building under a finished sun, held without a cell moving for
           eighteen seconds: the most complete picture in the film and the
           worst still in the suite, and it was the last thing the film did.

           It opens in the blue hour. The valley is under the hills' own
           shadow, the temple is a black shape standing in it, the sun is
           still under the ridge and there are stars. Nothing is revealed:
           the night is REPLACED, cell by cell on the ordered schedule, and
           the edge doing the replacing is the terminator running west across
           the floor as the sun comes up. Rejected: raising the whole field on
           a ramp, which is a gradient in time — a dimmer being turned up,
           not a sunrise. */
        const HY = 58, AMP = 16;
        const rise = smooth(clamp01((u - 0.04) / 0.78));
        const SX = 158, SY = lerp(78, 22, rise);
        const term = lerp(250, -90, rise);
        const bright = lerp(8, 470, rise);
        /* the building's own shadow, thrown west off the platform while the
           sun is low and drawn in as it climbs — the one piece of the dark
           that belongs to the temple rather than to the hills */
        const shade = lerp(150, 0, clamp01(rise / 0.78));
        F.map((x, y) => {
          const ry = ridgeYAt(x, HY, AMP);
          if (y < ry) {
            const d = Math.hypot((x - SX) * 0.72, y - SY);
            return d < bright * 0.34 ? 0 : d < bright * 0.62 ? 1 : d < bright ? 2 : 3;
          }
          const dark = (y - ry) > 46 ? 4 : 3;
          if (y > 120 && x < 31) {
            const w = 31 - x;
            if (w < shade && F.bayer(x, y) < 0.22 + 0.78 * (1 - w / shade)) return dark;
          }
          const lit = (x + (F.n2(x * 0.05, 7) - 0.5) * 10) - term;
          if (lit <= 0) return dark;
          if (F.bayer(x, y) < clamp01(lit / 22)) return F.noise(x, y) > 0.90 ? 1 : 0;
          return dark;
        });
        /* the stars go out one at a time, each on its own hour, so the sky
           empties raggedly the way it does. They are holes: a star on a night
           at level 3 cannot be ink, and light in this world is paper. */
        const S = F.rng(77);
        for (let k = 0; k < 16; k++) {
          const sx = 6 + S() * 180, sy = 4 + S() * 34, when = 0.08 + S() * 0.44;
          if (rise <= when) F.disc(sx, sy, 1.4, 0, true);
        }
        /* THE SUN COMES UP OUT OF THE HILLS, so it is drawn only where it has
           cleared them. The ridge is opaque to it, which is the whole reason
           there is a moment when it arrives rather than a disc that was
           always in the frame getting higher. */
        for (let dy = -10; dy <= 10; dy++) for (let dx = -10; dx <= 10; dx++) {
          if (dx * dx + dy * dy > 100) continue;
          const x = Math.round(SX + dx), y = Math.round(SY + dy);
          if (y < ridgeYAt(x, HY, AMP)) F.ink(x, y, 6);
        }
        if (rise > 0.58) {
          const g = ss(0.58, 0.96, rise) * 11;
          for (let k = 0; k < 8; k++) {
            const a = k / 8 * TAU + 0.2;
            lineD(F, SX + Math.cos(a) * 12.5, SY + Math.sin(a) * 12.5,
                     SX + Math.cos(a) * (12.5 + g), SY + Math.sin(a) * (12.5 + g), 1, 4);
          }
        }
        /* the same hills as M1, unmoved — the world is at peace again, and it
           is the SAME peace, not a new one drawn to match */
        hillsRidge(F, HY, AMP, 6);
        groundTexture(F, T_GY, 140, 601, 5);
        /* THE FINIAL ARRIVES EARLY AND HOLDS: catharsis is the arrival,
           welcome is everything after it. progress caps at 19.4 by u≈0.4, so
           the back 60% of the movement is the completed building standing in
           a light that is still changing around it. */
        temple(F, 18 + ss(0, 0.4, u) * 1.4, 7);
        /* WELCOME: two of them, and they ARRIVE — walking in from the frame's
           own edges to stand clear of the platform's footprint (it spans
           cx±65). The first pass put them at the base between the columns and
           the platform, drawn after them, and simply buried them; a welcome
           nobody can see is not a welcome. The one in the east comes in first
           and raises his arms first, because that is the order the light
           reaches them in. */
        /* the west one comes in later because the light does: he is still in
           the hills' shadow until past the middle of the movement, and a body
           at level 6 standing on a level-4 shadow is a smudge */
        const ea = ss(0.08, 0.44, u), we = ss(0.46, 0.82, u);
        F.fig(lerp(208, 178, ea), T_GY, 13, {
          mode: ea < 1 ? "walk" : "stand", phase: u * 7.35 + 0.15, face: -1,
          arms: ea < 1 ? "swing" : (u > 0.52 ? "up" : "open"),
        }, 6);
        F.fig(lerp(-16, 14, we), T_GY, 13, {
          mode: we < 1 ? "walk" : "stand", phase: u * 7.35 + 0.42, face: 1,
          arms: we < 1 ? "swing" : (u > 0.90 ? "up" : "open"),
        }, 6);
      },
    },
  ],
};
