/* ============================================================================
   10 · MAGIC RIDE — a WYGWYL halfworld

   THE RIDER NEVER MOVES. The bike sits fixed at frame centre for the whole
   film and everything else — road, skyline, the rows of people at the
   roadside — streams past it horizontally. That is the one camera this world
   owns, and it is what lets the night-to-morning turn (M4) read as arrival
   rather than filter: the dawn is just another thing streaming past, only
   slower than the road, so it washes over the fixed bike exactly once.

   NIGHT IS REPLACED, NOT FADED. The sky is a flat dark tone; morning is
   paper. M4 does not dim one into the other — a travelling front sweeps
   through screen space and every sky cell it reaches is handed to F.bayer:
   still-night on one side of the dither band, morning on the other, never
   both at once in the same cell. Stars die in the order the front reaches
   them, which is the same mechanism applied to a different substance.

   THE BIKE IS WHEELS AND ANGLES: two rings and a triangulated strut frame,
   never a drawn silhouette. A head that turns to watch is a disc nudged off
   its neck point toward the thing it's watching — rotating the whole small
   body over-rotated at this scale and stopped reading as a person.

   ONE ACCENT: a glint off the tank. It is lit by whatever light is out —
   moonlight in M1–M3, its own last spark as dawn reaches the bike in M4,
   morning sun in M5–M6 — the same mark, the same steel, never two different
   things wearing the accent.
   ========================================================================= */
import { TAU, lerp, clamp01, smooth, ss, win } from "../halfworld.mjs";

const FW = 192;                      // mirrors F.W; stream helpers are pure and don't touch F
const HORIZON = 64, HILL = 64, FAR_Y = 98, NEAR_Y = 116, ROAD = 128;
const NIGHT = 5;                     // the flat night-sky tone the dawn front consumes

/* world streams past a fixed camera: an anchor slides left as u grows and
   wraps through a span wider than the frame so entries and exits are never
   seen. REJECTED: scrolling by plain modulo on x alone — every row then
   snapped in lockstep and the parallax depth cue vanished. Each caller picks
   its own span/speed instead, which is the whole of the depth illusion. */
function wrapX(anchor, u, speed, span) {
  const raw = anchor - u * speed;
  const m = ((raw % span) + span) % span;
  return m - (span - FW) / 2;
}
/* how far a small watcher's head has turned toward the bike, which always
   sits at the centre of the screen it is not permitted to leave */
function lookTurn(x, radius) {
  const d = 96 - x;
  const p = clamp01(1 - Math.abs(d) / radius);
  return (d === 0 ? 1 : Math.sign(d)) * p;
}

/* --------------------------------------------------------------- the road */
function groundLine(F) {
  F.line(0, ROAD, 62, ROAD, 6, 1); F.line(72, ROAD, 130, ROAD, 6, 1);
  F.line(140, ROAD, 192, ROAD, 6, 1);
}
function roadTicks(F, u, speed) {
  const span = FW + 40, n = 20;
  for (let k = 0; k < n; k++) {
    const x = wrapX(k * (span / n), u, speed, span);
    F.line(x, ROAD - 2, x, ROAD + 4, 5, 1);
  }
}
function skyline(F, u, speed, l) {
  const span = FW + 100, n = 8;
  for (let k = 0; k < n; k++) {
    const x = wrapX(k * (span / n) + (k % 2) * 14, u, speed, span);
    const hgt = 9 + F.noise(k, 4) * 20, w = 12 + F.noise(k, 5) * 10;
    F.rect(x, HILL - hgt, w, hgt, l);
    if (F.noise(k, 6) > 0.55) F.rect(x + w * 0.3, HILL - hgt - 4, 2, 4, l);
  }
}

/* -------------------------------------------------------------- the sky */
function skyBase(F) { F.rect(0, 0, FW, HORIZON, NIGHT); }
/* each star is resolved against the ordered schedule AT ITS OWN COORDINATE
   — the same law that governs a region-wide dissolve applied to one dot at
   a time, so a star can vanish into the dawn front later in this same film
   without a second mechanism being invented for it */
function starsAt(F, show) {
  const R = F.rng(21);
  for (let k = 0; k < 50; k++) {
    const sx = Math.round(R() * FW), sy = Math.round(R() * (HORIZON - 6)) + 2, br = R();
    if (F.bayer(sx, sy) < show) F.put(sx, sy, br > 0.82 ? 2 : 1);
  }
}
function moonAt(F, x, y, r) {
  F.disc(x, y, r, 0, true); F.ring(x, y, r + 0.9, 4, 1);
  F.disc(x - r * 0.3, y - r * 0.25, r * 0.22, 3); F.disc(x + r * 0.35, y + r * 0.2, r * 0.16, 3);
}
function sunAt(F, x, y, r) {
  F.disc(x, y, r, 0, true); F.ring(x, y, r + 0.8, 3, 1);
  for (let k = 0; k < 8; k++) {
    const a = k / 8 * TAU;
    F.line(x + Math.cos(a) * (r + 2), y + Math.sin(a) * (r + 2), x + Math.cos(a) * (r + 5), y + Math.sin(a) * (r + 5), 4, 1);
  }
}
/* THE TURN ITSELF. A travelling front in screen space, dithered ~12 cells
   wide on the ordered schedule. Only cells that are still pure night sky
   (flat tone or a star) are eligible — buildings are drawn darker and are
   left alone, because a skyline doesn't relight when the sun comes up, it
   just stops being silhouetted against black. REJECTED: an alpha wipe — the
   whole point of this film's one dissolve is that it is never that. */
function dawnSweep(F, u) {
  const front = lerp(FW + 40, -60, smooth(u));
  F.map((x, y, v) => {
    if (y >= HORIZON || v > NIGHT + 0.4) return;
    const local = x - front + (F.n2(x * 0.06, y * 0.08) - 0.5) * 16;
    if (local < -4) return 0;
    if (local < 8) return F.bayer(x, y) < (8 - local) / 12 ? 0 : undefined;
  });
}

/* -------------------------------------------------------------- the bike
   TWO RINGS AND A TRIANGULATED STRUT FRAME. A first pass drew the tank and
   fenders as filled contours and the machine read as a cartoon; a frame
   built only from wheel-rings and angled struts reads as engineering, which
   is what "steel coverings" needs it to be. Returns the tank point because
   the glint (the film's one accent) and the rubbing marks in M1 both need
   to land on the same few cells of steel every time. */
function bike(F, cx, gy, s, spin, l) {
  const P = (lx, ly) => [cx + lx * s, gy + ly * s];
  const rA = P(-15, -9), fA = P(15, -9), piv = P(-6, -15), seat = P(1, -19);
  const hBase = P(12, -17), hTop = P(15, -24), hB1 = P(13, -27), hB2 = P(19, -27);
  const fpeg = P(-3, -13), tail = P(-19, -13), tank = P(-1, -16);
  const r = 9 * s;
  F.ring(rA[0], rA[1], r, l, 1.6); F.ring(fA[0], fA[1], r, l, 1.6);
  for (let k = 0; k < 5; k++) {
    const a = spin + k / 5 * TAU;
    F.line(rA[0], rA[1], rA[0] + Math.cos(a) * r * 0.85, rA[1] + Math.sin(a) * r * 0.85, l, 1);
    F.line(fA[0], fA[1], fA[0] + Math.cos(a) * r * 0.85, fA[1] + Math.sin(a) * r * 0.85, l, 1);
  }
  F.line(piv[0], piv[1], rA[0], rA[1], l, 1.6 * s);
  F.line(piv[0], piv[1], hBase[0], hBase[1], l, 1.6 * s);
  F.line(piv[0], piv[1], seat[0], seat[1], l, 1.6 * s);
  F.line(seat[0], seat[1], hTop[0], hTop[1], l, 1.4 * s);
  F.line(hBase[0], hBase[1], hTop[0], hTop[1], l, 1.6 * s);
  F.line(hTop[0], hTop[1], fA[0], fA[1], l, 1.7 * s);        // the rake — the angle that makes it a motorcycle
  F.line(hTop[0], hTop[1], hB1[0], hB1[1], l, 1.3 * s);
  F.line(hB1[0], hB1[1], hB2[0], hB2[1], l, 1.3 * s);
  F.line(piv[0], piv[1], tail[0], tail[1], l, 1.3 * s);
  F.line(piv[0], piv[1], fpeg[0], fpeg[1], l, 1.2 * s);
  F.rect(cx - 5 * s, gy - 17 * s, 10 * s, 6 * s, l);
  F.disc(tail[0] - 1 * s, tail[1], 1.1 * s, l);
  return { tank, footpeg: fpeg, seat, bar: hB2 };
}
/* F.fig's 'sit'+'reach' was tried first and put the reaching hand ABOVE the
   head — that pose is built for reaching down at something on the ground,
   not forward at a handlebar, and at this scale the mismatch reads as a
   knot, not a rider. Built by hand instead, anchored to the bike's own
   seat/bar/peg points so the body always fits the machine it's riding. */
function rider(F, B, s, l) {
  const hip = [B.seat[0], B.seat[1] - 1.5 * s];
  const sh = [hip[0] + 3.5 * s, hip[1] - 9 * s];
  const head = [sh[0] + 1.2 * s, sh[1] - 3.6 * s];
  F.line(hip[0], hip[1], B.footpeg[0], B.footpeg[1], l, 1.3 * s);
  F.line(hip[0], hip[1], sh[0], sh[1], l, 1.6 * s);
  F.line(sh[0], sh[1], B.bar[0], B.bar[1], l, 1.2 * s);
  F.disc(head[0], head[1], 1.9 * s, l);
}
/* the film's one accent, always on the same two cells of tank steel */
function glint(F, x, y) { F.put(x, y, 8); F.put(x + 1, y, 8); }

/* --------------------------------------------------------- the roadside
   A HEAD THAT TURNS IS A DISC OFFSET FROM ITS OWN NECK POINT, the same
   mechanism 04-nevermore uses for a bloom facing the camera. Rotating the
   whole 8–13 cell body was tried first and overshot into a wobble that read
   as the figure falling over, not looking. */
function watcher(F, x, gy, h, turn, l) {
  const hipY = gy - h * 0.42, shY = gy - h * 0.80, headY = gy - h * 0.95;
  F.line(x, gy, x - h * 0.10, hipY, l, Math.max(1, h * 0.10));
  F.line(x, gy, x + h * 0.10, hipY, l, Math.max(1, h * 0.10));
  F.line(x, hipY, x, shY, l, Math.max(1, h * 0.11));
  F.line(x, shY, x - h * 0.16, shY + h * 0.16, l, Math.max(1, h * 0.08));
  F.line(x, shY, x + h * 0.16, shY + h * 0.16, l, Math.max(1, h * 0.08));
  F.disc(x + turn * h * 0.42, headY, Math.max(1, h * 0.16), l);
}
function watcherRow(F, u, y, h, speed, count, span, l) {
  const margin = (span - FW) / 2;
  for (let k = 0; k < count; k++) {
    const x = wrapX(k * (span / count) + margin * (F.noise(k, 30) - 0.5), u, speed, span);
    watcher(F, x, y, h, lookTurn(x, h * 4.4), l);
  }
}

/* ------------------------------------------------------------------ birds
   A bird is two strokes off a point, wingtip-to-wingtip — a shallow M — the
   same amount of information a distant bird actually gives the eye. */
function bird(F, x, y, flap, l) {
  const w = 3 + flap * 2.2;
  F.line(x - w, y - flap * 1.6, x, y, l, 1);
  F.line(x, y, x + w, y - flap * 1.6, l, 1);
}
function flock(F, u, count, l) {
  for (let k = 0; k < count; k++) {
    const x = wrapX(k * (232 / count), u, 300 + k * 22, 232);
    const y = 16 + F.noise(k, 9) * 30 + Math.sin(u * TAU * (1.2 + k * 0.15) + k) * 3;
    bird(F, x, y, 0.5 + 0.5 * Math.sin(u * TAU * (7 + k) + k * 2), l);
  }
}
/* the nest is the one thing in this film that does NOT stream on a loop —
   it crosses the frame once, because "spring out of the night" needs a
   single legible event, not a repeating background texture */
function nestTree(F, u) {
  const x = lerp(224, -30, smooth(u)), gy = 100;
  F.line(x, gy, x, gy - 22, 6, 1.5);
  F.arc(x, gy - 24, 3.4, Math.PI * 0.1, Math.PI * 0.95, 6, 1.4);
  return { x, y: gy - 24 };
}
function birdBurst(F, u, start, nx, ny, l) {
  if (u < start) return;
  const t = u - start;
  for (let k = 0; k < 5; k++) {
    const bt = Math.max(0, t - k * 0.03);
    if (bt <= 0) continue;
    const x = nx + Math.sin(k * 2.1) * 4 + bt * (40 + k * 14);
    const y = ny - bt * 70 + Math.sin(bt * 14 + k) * 3;
    bird(F, x, y, 0.5 + 0.5 * Math.sin(u * TAU * 10 + k * 2), l);
  }
}

/* the word, arriving the way NEVERMORE's vow does: stamped once at a level
   nothing else in its band uses, then resolved per-dot against the front it
   is handed. Boxed tight so the map cannot reach outside the caption band. */
function chillyWord(F, arrive) {
  F.word("CHILLY", 96, 26, 13, 6, true);
  F.map((x, y, v) => {
    if (y < 10 || y > 42 || x < 30 || x > 162 || v !== 6) return;
    return F.bayer(x, y) < arrive ? 6 : 0;
  });
}

export default {
  n: "10", slug: "10-magic-ride", title: "MAGIC RIDE",
  tagline: "night replaced by morning, dot by dot",
  accent: "#5aa7ff", seed: 1010,
  drone: { base: 50, steps: [0, -2, 3, 1, 7, 10, 6], bright: true },
  movements: [
    {
      label: "HOP ON", seconds: 13,
      line: "I wasn't looking for a ride, but here you are — blissful, and oddly sensitive. I rub my aggressions into your steel coverings, and hop on.",
      cues: [
        { at: 0.16, f: 130, decay: 0.08, gain: 0.4, partials: [1, 1.6], noise: 0.6, nDecay: 0.02, seed: 1 },
        { at: 0.34, f: 125, decay: 0.08, gain: 0.4, partials: [1, 1.6], noise: 0.6, nDecay: 0.02, seed: 2 },
        { at: 0.60, f: 300, decay: 0.10, gain: 0.35, partials: [1, 2.3], noise: 0.9, nDecay: 0.05, seed: 3 },
        { at: 0.88, f: 55, decay: 0.6, gain: 0.55, partials: [1, 1.3, 1.8], noise: 0.8, nDecay: 0.3, seed: 4 },
      ],
      draw(u, F) {
        /* NOTHING STREAMS YET. The bike is still and so is the world behind
           it — speed is M2's word, not this one's, so the parallax rig is
           called with speed 0 rather than being a second mechanism. */
        skyBase(F); starsAt(F, 1); moonAt(F, 150, 24, 9);
        skyline(F, 0, 0, 6);
        groundLine(F);
        const B = bike(F, 96, ROAD, 1.28, u * 1.1, 7);
        /* HE WALKS UP, THEN HE IS SIMPLY SEATED. A cut, not a cross-fade —
           the dot law forbids blending two drawings but says nothing about
           a cut, and "hop on" is an instant, not a dissolve. */
        const walkP = clamp01(u / 0.55);
        if (walkP < 1) {
          const wx = lerp(14, B.footpeg[0] - 3, smooth(walkP));
          F.fig(wx, ROAD, 32, { mode: "walk", phase: u * 6, face: 1 }, 7);
        } else {
          rider(F, B, 1.28, 7);
        }
        /* THE RUBBING: aggression worked into the steel as short radial
           strokes at the tank, thickening the closer he gets to it. */
        const touch = ss(0.28, 0.55, u);
        if (touch > 0) {
          const R = F.rng(77);
          const n = Math.round(touch * 9);
          for (let k = 0; k < n; k++) {
            const a = R() * TAU;
            F.line(B.tank[0] + Math.cos(a) * 3, B.tank[1] + Math.sin(a) * 3,
                   B.tank[0] + Math.cos(a) * 5.5, B.tank[1] + Math.sin(a) * 5.5, 5, 1);
          }
          glint(F, B.tank[0], B.tank[1] - 1);
        }
      },
    },
    {
      label: "HEADS TWIST", seconds: 14,
      /* THIS IS THE MOVEMENT fx.smear WAS BUILT FOR. Two taps, not three —
         the roadside carries two full rows of watchers and a third tap put
         the frame within a hair of budget for a scene that has to hold that
         cost for fourteen seconds, not a hundred milliseconds. */
      fx: { smear: { taps: 1, spread: 0.010, fall: 2.0 } },
      line: "Loneliness is having everything with no one to tell — being everywhere, with no one to love. I let the noise block the noise. The way I ride: eyes turn, heads twist — and prove the magic still exists.",
      cues: [
        { at: 0.04, f: 200, decay: 0.3, gain: 0.4, partials: [1, 1.8], noise: 1.0, nDecay: 0.15, seed: 11 },
        { at: 0.55, f: 700, decay: 0.12, gain: 0.4, partials: [1, 2.3], noise: 0.3, nDecay: 0.02, seed: 12 },
        { at: 0.85, f: 900, decay: 0.15, gain: 0.45, partials: [1, 2.4, 3.9], noise: 0.2, nDecay: 0.02, seed: 13 },
      ],
      draw(u, F) {
        skyBase(F); starsAt(F, 1);
        skyline(F, u, 170, 6);
        watcherRow(F, u, FAR_Y, 8, 230, 7, 272, 5);
        watcherRow(F, u, NEAR_Y, 13, 430, 6, 272, 6);
        groundLine(F); roadTicks(F, u, 760);
        const B = bike(F, 96, ROAD, 1.05, u * 30, 7);
        rider(F, B, 1.05, 7);
        /* the glint answers "eyes turn, heads twist" and again "the magic
           still exists" — the same mark, twice, because it is one object */
        if (Math.max(win(u, 0.50, 0.54, 0.58, 0.62), win(u, 0.82, 0.85, 0.88, 0.92)) > 0.5)
          glint(F, B.tank[0], B.tank[1] - 1);
      },
    },
    {
      label: "MOON SETTLES", seconds: 12,
      line: "All preparations to live and dream in darkness, I no longer desire. The moon settles, and the tease of distant stars subsides — and I can see a morning ahead for me.",
      cues: [
        { at: 0.18, f: 180, decay: 0.5, gain: 0.3, partials: [1, 1.6], noise: 1.0, nDecay: 0.4, seed: 21 },
        { at: 0.70, f: 1200, decay: 0.1, gain: 0.28, partials: [1, 2.6], noise: 0.4, nDecay: 0.02, seed: 22 },
      ],
      draw(u, F) {
        skyBase(F);
        /* THE TEASE SUBSIDES: each star is resolved against the same ordered
           schedule the dawn front will use in M4, just driven by u instead
           of by position — the two are one law, not two coincidences. */
        starsAt(F, 1 - ss(0.30, 0.95, u));
        moonAt(F, lerp(150, 168, smooth(u)), lerp(20, HORIZON - 5, smooth(u)), lerp(9, 6, smooth(u)));
        /* a morning ahead: a small paper patch opening low on the horizon,
           the same dot-swap M4 will do to the whole sky, done here in
           miniature because the line only claims he can SEE it, not that it
           has arrived */
        const glowR = smooth(u) * 22;
        if (glowR > 0.5) F.map((x, y, v) => {
          if (y >= HORIZON || v > NIGHT + 0.4) return;
          const d = Math.hypot(x - 172, y - 34);
          if (d < glowR && F.bayer(x, y) < (glowR - d) / 9) return 0;
        });
        skyline(F, u, 110, 6);
        groundLine(F); roadTicks(F, u, 520);
        const B = bike(F, 96, ROAD, 1.05, u * 24, 7);
        rider(F, B, 1.05, 7);
      },
    },
    {
      label: "NIGHT REPLACED", seconds: 14,
      line: "It looks like a morning I could believe in — a morning where loss and life aren't so — well — ripe with sunlight that's deceptively warm. The chirping of birds, fueling of nests, spring out of the night that has covered me.",
      cues: [
        { at: 0.28, f: 440, decay: 1.0, gain: 0.5, partials: [1, 2.01, 3.02, 4.04], noise: 0.15, nDecay: 0.03, seed: 31 },
        { at: 0.55, f: 1800, decay: 0.08, gain: 0.4, partials: [1, 1.5], noise: 0.8, nDecay: 0.02, seed: 32 },
        { at: 0.76, f: 2100, decay: 0.07, gain: 0.4, partials: [1, 1.4], noise: 0.8, nDecay: 0.02, seed: 33 },
      ],
      draw(u, F) {
        skyBase(F); starsAt(F, 1);
        const sgrow = ss(0.05, 0.55, u);
        if (sgrow > 0) sunAt(F, 156, lerp(70, 34, sgrow), 3 + sgrow * 10);
        skyline(F, u, 140, 6);
        /* THE TURN. Everything above HORIZON that is still pure night is
           handed to the front; buildings, drawn darker, are left alone. */
        dawnSweep(F, u);
        groundLine(F); roadTicks(F, u, 620);
        const front = lerp(FW + 40, -60, smooth(u));
        const B = bike(F, 96, ROAD, 1.05, u * 28, 7);
        rider(F, B, 1.05, 7);
        /* the glint is lit only while the bike's OWN patch of sky is still
           night — once the front has passed x=96 the steel is in daylight
           and needs no spark of its own. The last one is the film's ember. */
        if (front > 96) glint(F, B.tank[0], B.tank[1] - 1);
        const nest = nestTree(F, u);
        birdBurst(F, u, 0.40, nest.x, nest.y, 6);
      },
    },
    {
      label: "BLISSFUL, INNOCENT", seconds: 13,
      line: "With my own curiosities, for a chance at an end wherever everything will be OK. I want to live in this feeling forever — blissful, and oddly innocent.",
      cues: [
        { at: 0.25, f: 500, decay: 0.6, gain: 0.32, partials: [1, 2, 3], noise: 0.1, nDecay: 0.05, seed: 41 },
        { at: 0.72, f: 1600, decay: 0.1, gain: 0.3, partials: [1, 1.6], noise: 0.7, nDecay: 0.03, seed: 42 },
      ],
      draw(u, F) {
        /* PAPER, UNFILLED — the sky needs no tone at all now, which is the
           whole difference between this movement and the first three. */
        sunAt(F, 156, 32, 12);
        skyline(F, u, 90, 6);
        groundLine(F);
        /* HIS OWN CURIOSITIES: the road he is on quietly forks — two ground
           lines that started as one and drift apart, never resolving to
           either one, because the line never picks a destination either. */
        const split = smooth(u) * 10;
        F.line(4, ROAD - split, 90, ROAD - split * 0.6, 4, 1);
        F.line(100, ROAD - split * 0.6, 188, ROAD - split, 4, 1);
        F.line(4, ROAD + split, 90, ROAD + split * 0.6, 4, 1);
        F.line(100, ROAD + split * 0.6, 188, ROAD + split, 4, 1);
        roadTicks(F, u, 380);
        flock(F, u, 3, 6);
        const B = bike(F, 96, ROAD, 1.05, u * 20, 7);
        rider(F, B, 1.05, 7);
        /* the same glint, now lit by the sun instead of by its own spark —
           one object, one meaning, a different light on it */
        glint(F, B.tank[0], B.tank[1] - 1);
      },
    },
    {
      label: "CHILLY MORNING", seconds: 14,
      fx: { smear: { taps: 1, spread: 0.010, fall: 2.0 } },
      line: "Riding in a way you can't help but double-click — and prove the magic still exists. Even here, it's chilly in the morning.",
      cues: [
        { at: 0.615, f: 2600, decay: 0.04, gain: 0.45, partials: [1, 1.2], noise: 0.9, nDecay: 0.01, seed: 51 },
        { at: 0.70, f: 2600, decay: 0.04, gain: 0.45, partials: [1, 1.2], noise: 0.9, nDecay: 0.01, seed: 52 },
        { at: 0.92, f: 2000, decay: 0.09, gain: 0.35, partials: [1, 1.4], noise: 0.7, nDecay: 0.02, seed: 53 },
      ],
      draw(u, F) {
        sunAt(F, 156, 30, 12);
        skyline(F, u, 170, 6);
        watcherRow(F, u, FAR_Y, 8, 230, 7, 272, 5);
        watcherRow(F, u, NEAR_Y, 13, 430, 6, 272, 6);
        groundLine(F); roadTicks(F, u, 760);
        /* birds are more numerous by the end, because the film ends with
           them — a count that rises is legible; a cut to more birds is not */
        flock(F, u, Math.round(lerp(3, 6, ss(0.55, 0.95, u))), 6);
        const B = bike(F, 96, ROAD, 1.05, u * 30, 7);
        rider(F, B, 1.05, 7);
        /* "double-click": two identical pulses of the one accent, close
           together, timed to the two click cues rather than to one long
           glow — the line names an action with a count, not a duration */
        if (Math.max(win(u, 0.595, 0.615, 0.625, 0.645), win(u, 0.68, 0.70, 0.71, 0.73)) > 0.5)
          glint(F, B.tank[0], B.tank[1] - 1);
        chillyWord(F, ss(0.68, 0.95, u));
      },
    },
  ],
};
