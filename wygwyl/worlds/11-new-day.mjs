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

   Fog is the other advancing front: an edge that sweeps across x, in on the
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
import { TAU, lerp, clamp01, smooth, ss } from "../halfworld.mjs";

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
function hillsRidge(F, y0, amp, l = 4) {
  const ridgeY = (x) => y0 - amp * 0.6 * Math.sin(x * 0.021 + 0.4) - amp * 0.35 * Math.sin(x * 0.05 + 2.1);
  for (const [a, b] of [[0, 68], [78, 128], [138, 192]])
    for (let x = a; x < b; x++) F.ink(x, Math.round(ridgeY(x)), l);
  for (let x = 0; x < F.W; x++) {
    const ry = ridgeY(x);
    for (let y = Math.ceil(ry); y < y0 + 18; y++) {
      const n = F.n2(x * 0.15, y * 0.22);
      if (n > 0.58) F.ink(x, y, n > 0.76 ? l - 1 : l - 2);
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
      /* finer and lighter than the first pass (0.09/0.62): that frequency
         put three cell-wide clumps across the whole 192-cell band and the
         fog read as a spotted hide, not a mist. Higher frequency plus a
         higher floor for the darkest tone keeps most of the claimed band
         at 1-2 with only sparse denser wisps. */
      const h = F.n2(x * 0.17, y * 0.21 + u * 1.6);
      return h > 0.76 ? 3 : h > 0.32 ? 2 : 1;
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
function groundTexture(F, y0, y1, seedK) {
  const R = F.rng(seedK);
  for (let k = 0; k < 70; k++) F.disc(R() * F.W, y0 + R() * (y1 - y0), 0.8, 2);
  for (const [a, b] of [[0, 60], [70, 130], [140, 192]]) F.line(a, y0, b, y0, 3, 1);
}

export default {
  n: "11", slug: "11-new-day", title: "NEW DAY",
  tagline: "the temple assembles, one course at a time",
  accent: "#5aa7ff", seed: 1111,
  drone: { base: 50, steps: [0, 0, 3, 7, 5, 2, 12], bright: true },
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
        /* FRESH MUTED COLORS: the hills and dawn sit at 2–4 so the temple,
           the only thing at 7, is unmistakably the subject and not one of
           several equally loud shapes. The first pass gave the hills their
           usual 4–6 and the frame read as two competing landscapes. */
        hillsRidge(F, 46, 10, 3);
        /* the sun sits clear of the hill's own peak (y≈36 at its highest)
           — the first pass put it at y 54-64 and it landed inside the
           hill's tree stipple, and a disc drawn into a noise field reads
           as more noise, not as a sun */
        const sunY = lerp(26, 16, smooth(u));
        F.disc(174, sunY, 6, 3); F.ring(174, sunY, 8, 2, 1);
        /* recycled airs: a few soft wisps, drifting — NOT the fog wavefront
           of M1, which is a claimed front. These only ever add a little
           ink; they never cover anything, because dawn is clearing, not
           arriving. */
        for (let k = 0; k < 5; k++) {
          const dx = 20 + k * 34 + Math.sin(u * TAU * 0.5 + k) * 6;
          const dy = 96 + Math.sin(u * TAU * 0.3 + k * 1.3) * 3;
          F.disc(dx, dy, 2.4, 1); F.disc(dx + 4, dy + 1, 1.6, 1);
        }
        groundTexture(F, T_GY, 140, 201);
        temple(F, u * 9, 7);
        F.fig(20, T_GY, 14, { mode: "stand", arms: "open" }, 6);
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
        sunDisc(F, 158, 30, 9, 0.7 + 0.3 * smooth(u), 6);
        F.line(0, 26, 60, 25, 2, 1); F.line(72, 25, 122, 26, 2, 1); F.line(134, 26, 192, 25, 2, 1);
        groundTexture(F, T_GY, 140, 301);
        dewWinks(F, u, 132);
        temple(F, 9 + u * 9, 7);
        F.fig(18, T_GY, 13, { mode: "walk", phase: u * 4, face: 1 }, 6);
        F.fig(170, T_GY, 13, { mode: "stand", arms: "reach", face: -1 }, 6);
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
        F.fig(px, 70, 20, { mode: "walk", phase: u * 5, face: u < 0.5 ? 1 : -1, arms: "swing" }, 6);
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
        F.disc(150, 18, 5, 2);
        for (let k = 0; k < 4; k++) F.disc(30 + k * 22, 14 + F.noise(k, 4) * 6, 2.4, 1);
        /* DEEP BREATHS: the water's own stillness rises and falls on one
           slow sine of u — a number that breathes, not a caption that
           says so. THE MIRACLE IS ALSO A NUMBER: amplitude is multiplied
           by (1-near), which goes to zero within 26 cells of his feet, so
           the surface is flat exactly under him and nowhere else. Rejected:
           parting the water or drawing footprints on it — both make the
           water react to him, and the line's claim is that it doesn't. */
        const breath = 0.72 + 0.24 * Math.sin(u * TAU * 0.55);
        const POS = [26, 96, 166];
        const a = ss(0.15, 0.35, u), b = ss(0.58, 0.78, u);
        const px = lerp(lerp(POS[0], POS[1], a), POS[2], b);
        const y0 = 50, y1 = 136, rows = 10;
        for (let k = 0; k < rows; k++) {
          const t = k / (rows - 1), y = lerp(y0, y1, t);
          const ampBase = 2.6 * (1 - breath * 0.7) * (0.4 + t * 0.8);
          const gA = (F.noise(k, 41) * 180) | 0, gB = (F.noise(k, 53) * 180) | 0;
          for (let x = 0; x < F.W; x++) {
            if ((x > gA && x < gA + 16) || (x > gB && x < gB + 12)) continue;
            const near = clamp01(1 - Math.abs(x - px) / 26);
            const amp = ampBase * (1 - near);
            const yy = y + Math.sin(x * 0.085 + u * TAU * 0.35 + k * 1.2) * amp;
            F.ink(x, Math.round(yy), 4);
          }
        }
        F.fig(px, lerp(y0, y1, 0.75), 26, { mode: "stand", arms: "open" }, 7);
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
        /* the same hills as M1, unmoved — the world is at peace again, and
           it is the SAME peace, not a new one drawn to match */
        hillsRidge(F, 58, 16, 3);
        sunDisc(F, 158, 24, 10, 1, 6);
        groundTexture(F, T_GY, 140, 601);
        /* THE FINIAL ARRIVES EARLY AND HOLDS: catharsis is the arrival,
           welcome is everything after it. progress caps at 19.4 by u≈0.4,
           so the back 60% of the movement is the completed building, not
           the completing of it. */
        temple(F, 18 + ss(0, 0.4, u) * 1.4, 7);
        /* WELCOME: two figures flanking, arms open — placed OUTSIDE the
           platform's own footprint (it spans cx±65). The first pass put
           them at the base between the columns and the platform, drawn
           after them, simply buried them; a welcome nobody can see is not
           a welcome. */
        F.fig(14, T_GY, 13, { mode: "stand", arms: "open" }, 6);
        F.fig(178, T_GY, 13, { mode: "stand", arms: "open", face: -1 }, 6);
      },
    },
  ],
};
