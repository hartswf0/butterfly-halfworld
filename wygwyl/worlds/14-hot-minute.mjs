/* ============================================================================
   14 · HOT MINUTE — a WYGWYL halfworld

   THE FINALE. Everything this suite ever built is taken by ONE mechanism,
   used twice: a per-dot allegiance swap that starts at the water and climbs
   — first over the skyline (M1), then over the man himself, from the feet
   up (M2), because "I have been weather before" is not a mood to paint, it
   is a claim that the SAME function already did this to him once, thirty
   seconds earlier, in this very film. Then black with no rectangle in it —
   the one movement in the whole suite that owns no walls, because by then
   nothing built is still standing to have any. Then nine icons, one per
   beat, faster each time — the suite's own motifs and nothing else, each
   drawn by a one-purpose function that stops at the noun. Then two dancers
   who orbit rather than fall (01's falling pair, run with the sign flipped).
   Then a door — the ONE accent this film spends — that he walks to and,
   this time, through: not the window he went out of in 01 by accident, but
   a door he chooses on purpose.
   ========================================================================= */
import { TAU, lerp, clamp01, smooth, ss, win } from "../halfworld.mjs";
import { tambourine } from "./02-flashing-lights.mjs";

/* THE HAZE CONSUMES BY HEIGHT, NOT BY TIME. "edge" is a cell's distance from
   the water (0) toward the sky (1); a cell is claimed once edge falls below
   the schedule, so the flood always starts at the bottom and climbs — the
   ONLY dissolve this film uses, in M1 on the skyline and again in M2 on the
   man, because the line insists it is the same weather both times.
   Rejected: a second, prettier dissolve built for the man alone. That would
   have made "I have been weather before" false. */
function weatherClaim(F, u, claim, ph = 0) {
  F.map((x, y) => {
    const edge = (F.H - y) / F.H + (F.n2(x * 0.06 + ph, y * 0.06 + ph) - 0.5) * 0.18;
    if (edge < claim - 0.05) {
      const h = F.fbm(x * 0.085 + u * 1.1 + ph, y * 0.10 + ph, 2);
      return h > 0.60 ? 3 : h > 0.42 ? 2 : (h > 0.27 ? 1 : 0);
    }
    if (edge < claim && F.bayer(x, y) < (claim - edge) / 0.05) return 2;
  });
}

/* A BODY IN RESERVE: paper cut out of the ink instead of ink laid onto
   paper, the same formal idea 04 built for a shadow (not imported — 04
   exports nothing — but the same reasoning: on an all-dark field, F.ink can
   only ever darken it further, so the only way to put a man in a black
   room is to punch him out of the black). */
function reserveFig(F, x, y, h, l = 0) {
  const th = Math.max(1, h * 0.08);
  F.line(x, y - h * 0.46, x, y - h * 0.78, l, th, true);
  F.line(x, y - h * 0.46, x - h * 0.17, y, l, th * 0.85, true);
  F.line(x, y - h * 0.46, x + h * 0.17, y, l, th * 0.85, true);
  F.line(x, y - h * 0.78, x - h * 0.26, y - h * 0.52, l, th * 0.8, true);
  F.line(x, y - h * 0.78, x + h * 0.26, y - h * 0.52, l, th * 0.8, true);
  F.disc(x, y - h * 0.89, h * 0.11, l, true);
}

/* ---- nine small, undecorated functions. Movement 4 needs each one legible
   in a beat under two seconds, so every one of these stops at the noun: a
   window that also carried curtains stopped being a window and started
   being wallpaper. Two are reused at a second scale elsewhere in this film
   (templeGlyph in M1, windowGlyph again in M6) — the suite's own habit of
   drawing a thing once and calling it twice. */
function windowGlyph(F, cx, cy, w, h, l) {
  F.box(cx - w / 2, cy - h / 2, w, h, l, 2.4);
  F.line(cx, cy - h / 2, cx, cy + h / 2, l, 1.6);
  F.line(cx - w / 2, cy, cx + w / 2, cy, l, 1.6);
  F.line(cx - w / 2 - 4, cy + h / 2 + 3, cx + w / 2 + 4, cy + h / 2 + 3, l, 1.6);
}
function fieldGlyph(F, cx, cy, w, h) {
  const gy = cy + h * 0.30, l = 7;
  F.line(cx - w * 0.5, gy, cx - w * 0.08, gy, l, 2);
  F.line(cx + w * 0.08, gy, cx + w * 0.5, gy, l, 2);
  for (let k = 0; k < 7; k++) {
    const x = cx - w * 0.42 + k * (w * 0.84 / 6);
    const tall = k === 3;
    const th = tall ? h * 0.52 : h * 0.30;
    F.line(x, gy, x - 2.2, gy - th, l, 1.6);
    F.line(x, gy, x + 2.2, gy - th, l, 1.6);
    if (tall) F.disc(x, gy - th - 2.5, 2.6, l);
  }
}
function star(F, cx, cy, r, l) {
  F.line(cx - r, cy, cx + r, cy, l, 1.6);
  F.line(cx, cy - r, cx, cy + r, l, 1.6);
  F.line(cx - r * 0.6, cy - r * 0.6, cx + r * 0.6, cy + r * 0.6, l, 1.1);
  F.line(cx - r * 0.6, cy + r * 0.6, cx + r * 0.6, cy - r * 0.6, l, 1.1);
}
function starsGlyph(F, cx, cy) {
  /* FIVE BURSTS ALONE TESTED AS ASTERISKS, NOT A SKY: what makes a mark
     read as "stars" and not "sparkle" is a FIELD of them. Forty-odd dim
     points, fixed and deterministic (F.noise, not F.rng — this glyph takes
     no seed of its own), do that job; the five bright crosses are the
     ones a viewer's eye actually lands on. */
  for (let k = 0; k < 46; k++) {
    const sx = cx + (F.noise(k, 501) - 0.5) * 178, sy = cy + (F.noise(k, 502) - 0.5) * 116;
    F.disc(sx, sy, F.noise(k, 503) > 0.78 ? 1.4 : 0.9, F.noise(k, 504) > 0.5 ? 3 : 2);
  }
  star(F, cx, cy - 6, 23, 7);
  star(F, cx - 54, cy + 18, 14, 6);
  star(F, cx + 52, cy - 12, 12, 6);
  star(F, cx - 20, cy + 46, 11, 6);
  star(F, cx + 30, cy + 38, 10, 6);
}
function candleGlyph(F, cx, cy, h, l) {
  const bw = h * 0.17, bTop = cy - h * 0.02, bBot = cy + h * 0.36;
  F.rect(cx - bw / 2, bTop, bw, bBot - bTop, l);
  /* the saucer: a candle alone is a thin vertical mark lost in a wide
     frame, and a holder is part of the noun, not decoration on it */
  const sw = bw * 4.0;
  F.arc(cx, bBot, sw / 2, Math.PI * 0.06, Math.PI * 0.94, l, 2.4);
  F.line(cx - sw / 2 + 2, bBot, cx + sw / 2 - 2, bBot, l, 1.8);
  /* THE FLAME IS A TAPER, NOT A DISC: the first pass put a circle at the
     wick and at this scale a circle is a lollipop, not a flame. Width
     rises from zero at the tip to a maximum at the base on a t^1.3 curve,
     so it stays a sliver near the top and only fills out low down — the
     one shape difference that makes it read as fire instead of a ball. */
  const wick = bTop - h * 0.03, fTip = wick - h * 0.30, fw = h * 0.042;
  for (let yy = fTip; yy <= wick; yy += 1) {
    const t = (yy - fTip) / (wick - fTip);
    const w = fw * Math.pow(t, 1.3);
    if (w > 0.3) F.line(cx - w, yy, cx + w, yy, l, 1.2);
  }
  F.line(cx, bTop, cx, wick, l, 1.4);
}
function daisyGlyph(F, cx, cy, r, l) {
  for (let k = 0; k < 9; k++) {
    const a = k / 9 * TAU;
    F.disc(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.92, r * 0.30, l);
  }
  F.disc(cx, cy, r * 0.44, 0, true);      // the centre is a hole, not a fill —
  F.ring(cx, cy, r * 0.44, l, 1.4);       // the same trick 04 used on a bloom
  /* the stem: SHORT, on purpose. A first pass ran it out to r*1.9 below
     centre, which at this glyph's scale (r large enough to fill the field)
     put the stem tip fifty cells past the bottom of the frame — a flower
     with no visible stem reads as a wheel of circles instead. */
  F.line(cx, cy + r * 0.92, cx, cy + r * 1.42, l, 1.8);
  F.line(cx, cy + r * 1.16, cx - r * 0.42, cy + r * 1.32, l, 1.3);
}
function rideGlyph(F, cx, cy, r, l) {
  F.ring(cx, cy, r, l, 2);
  for (let k = 0; k < 8; k++) {
    const a = k / 8 * TAU;
    const gx = cx + Math.cos(a) * r, gy = cy + Math.sin(a) * r;
    F.line(cx, cy, gx, gy, l, 1.2);
    F.rect(gx - 2.6, gy - 2.2, 5.2, 4.4, l);         // a gondola at every spoke
  }
  const legY = cy + r + 15;
  F.line(cx - r * 0.5, legY, cx, cy + r * 0.1, l, 1.6);
  F.line(cx + r * 0.5, legY, cx, cy + r * 0.1, l, 1.6);
  F.line(cx - r * 0.5, legY, cx + r * 0.5, legY, l, 1.6);
}
function templeGlyph(F, cx, cy, w, h, l) {
  const base = cy + h / 2, eave = cy - h / 2, peak = eave - h * 0.22;
  F.line(cx - w * 0.56, eave, cx, peak, l, 2);
  F.line(cx, peak, cx + w * 0.56, eave, l, 2);
  F.line(cx - w * 0.56, eave, cx + w * 0.56, eave, l, 2);
  for (let k = 0; k < 5; k++) {
    const x = cx - w * 0.45 + k * (w * 0.9 / 4);
    F.line(x, eave + 1, x, base, l, 2.2);
  }
  F.line(cx - w * 0.6, base, cx - w * 0.08, base, l, 2);
  F.line(cx + w * 0.08, base, cx + w * 0.6, base, l, 2);
}
function hourglassGlyph(F, cx, cy, h, l) {
  const w = h * 0.60, top = cy - h / 2, bot = cy + h / 2;
  F.line(cx - w / 2, top, cx + w / 2, top, l, 2);
  F.line(cx - w / 2, bot, cx + w / 2, bot, l, 2);
  F.line(cx - w / 2, top, cx, cy, l, 1.8);
  F.line(cx + w / 2, top, cx, cy, l, 1.8);
  F.line(cx - w / 2, bot, cx, cy, l, 1.8);
  F.line(cx + w / 2, bot, cx, cy, l, 1.8);
  F.disc(cx, cy - 2, 1.1, l); F.disc(cx, cy + 2, 1.1, l);      // the neck
  for (let k = 0; k < 4; k++) F.disc(cx - 3 + k * 2, bot - 3, 1, l);   // the pile
}

/* the reel: eight equal beats (~1.43s, under the 1.5s target) and a ninth
   that runs longer. The ninth is not favouritism — the ENGINE cross-fades
   the last 1.5s of every movement into the next one (XFADE in
   halfworld.mjs, which this module does not touch), so whatever icon lands
   last always loses its final second-and-a-half to the dance beginning
   underneath it. Give it only 1/9 of the movement and the hourglass is
   never once seen clean — it is born already dissolving. Giving it a wider
   share buys it real, unblended time before that dissolve starts, which
   also happens to be the one icon in the poem that is ABOUT running out of
   time, so the film's own engine constraint becomes the joke instead of a
   bug. Rejected: beats that shrink beat to beat for "getting faster" — it
   read as the reel spending most of its length on the FIRST icon and
   blinking the rest; the cut carries the acceleration instead, below.
   Every icon is sized to fill most of the field, because a viewer has
   about a second and only a shape that big lands in it. No cross-fade
   between icons: a reel does not dissolve one frame into the next, it
   cuts — the only dissolve in this movement is the one the engine imposes
   at its very end, which no movement in this suite can opt out of. */
const REEL_BOUND = [0, 0.095, 0.19, 0.285, 0.38, 0.475, 0.57, 0.665, 0.76, 1.0];
const REEL = [
  (F) => windowGlyph(F, 96, 70, 140, 112, 7),
  (F) => tambourine(F, 96, 72, 54, 0.5, 7, 12),
  (F) => fieldGlyph(F, 96, 82, 172, 100),
  (F) => starsGlyph(F, 96, 70),
  (F) => candleGlyph(F, 96, 84, 138, 7),
  (F) => daisyGlyph(F, 96, 60, 38, 7),
  (F) => rideGlyph(F, 96, 70, 50, 7),
  (F) => templeGlyph(F, 96, 84, 168, 104, 7),
  (F) => hourglassGlyph(F, 96, 76, 118, 7),
];
/* THE CUT HAS WEIGHT: a black frame at the head of each beat, standing for
   the frame-line a real reel carries between exposures. Its share of the
   beat shrinks from one icon to the next — 22% of ~1.44s down to 5% —
   which is where "getting faster" actually lives: the cuts sharpen while
   the icons themselves keep an equal, legible hold. */
function filmFrame(F) {
  const L = 5, R = 187, T = 5, B = 139;
  F.line(L, T, R, T, 6, 1.6); F.line(L, B, R, B, 6, 1.6);
  F.line(L, T, L, B, 6, 1.6); F.line(R, T, R, B, 6, 1.6);
  for (let x = L + 7; x < R - 7; x += 11) {
    F.rect(x, 0, 4, 3, 5); F.rect(x, F.H - 3, 4, 3, 5);
  }
}

/* the door: hinged at its LEFT edge, its visible width shrinking by the
   cosine of the swing — the same foreshortening 05 used on its gates, one
   leaf instead of two, because a party has one door, not a temple's pair. */
function doorLeaf(F, hx, top, bot, visW) {
  const x2 = hx + visW;
  F.rect(hx, top, Math.max(1, visW), bot - top, 6);
  F.line(hx, top, x2, top, 7, 1.6);
  F.line(hx, bot, x2, bot, 7, 1.6);
  F.line(x2, top, x2, bot, 7, 1.8);
  if (visW > 6) {
    const pw = Math.max(1, visW * 0.58);
    F.box(hx + visW * 0.22, top + (bot - top) * 0.10, pw, (bot - top) * 0.32, 7, 1);
    F.box(hx + visW * 0.22, top + (bot - top) * 0.56, pw, (bot - top) * 0.32, 7, 1);
  }
  if (visW > 4) F.disc(x2 - Math.min(4, visW * 0.3), (top + bot) / 2, 1.6, 7);
}

export default {
  n: "14", slug: "14-hot-minute", title: "HOT MINUTE",
  tagline: "everything learns to be weather, then a door",
  accent: "#5aa7ff", seed: 1414,
  /* low and grieving through the dissolve, bottoming out at the black, then
     climbing back up through the reel into the dance and the open door —
     the only drone motion in this film is upward, once it starts */
  drone: { base: 50, steps: [0, -5, -8, -10, -3, 4, 9], bright: true },
  movements: [
    {
      label: "EVERYTHING I BUILT", seconds: 13,
      line: "A hot minute. The haze gathers on the water — and everything I built here learns to be weather: the city, the temple, the harbor.",
      cues: [
        { at: 0.12, f: 120, decay: 0.7, gain: 0.4, partials: [1, 1.5, 2.1], noise: 0.6, nDecay: 0.25, seed: 1401 },
        { at: 0.55, f: 90, decay: 0.8, gain: 0.4, partials: [1, 1.4, 2.0], noise: 0.7, nDecay: 0.3, seed: 1402 },
      ],
      draw(u, F) {
        const WATER = 118;
        /* the harbor: a post, a pier arm, a hulled boat under its own mast */
        F.line(30, WATER, 30, WATER - 26, 6, 2);
        F.line(28, WATER - 26, 46, WATER - 26, 6, 2);
        F.arc(18, WATER - 3, 13, Math.PI * 0.06, Math.PI * 0.94, 6, 2);
        F.line(18, WATER - 4, 18, WATER - 26, 6, 1.6);
        F.line(18, WATER - 26, 27, WATER - 21, 6, 1);
        F.line(27, WATER - 21, 18, WATER - 17, 6, 1);
        /* the city: five towers that only ever need to STAND, because the
           whole point of this movement is that they stop standing */
        const TOWERS = [[64, 60, 17], [84, 44, 15], [101, 70, 13], [117, 50, 19], [138, 64, 14]];
        for (const [tx, ty, tw] of TOWERS) {
          F.rect(tx, ty, tw, WATER - ty, 5);
          F.line(tx, ty, tx + tw, ty, 6, 1);
          for (let ry = ty + 5; ry < WATER - 4; ry += 8) {
            for (let rx = tx + 3; rx < tx + tw - 2; rx += 6) {
              if (F.noise(rx, ry) > 0.52) F.rect(rx, ry, 3, 4, 3);
            }
          }
        }
        /* the temple, on its own rise at the far shore */
        const plateau = WATER - 18;
        F.line(158, WATER, 172, plateau, 5, 1);
        F.line(190, WATER, 176, plateau, 5, 1);
        F.line(172, plateau, 176, plateau, 5, 1);
        templeGlyph(F, 174, plateau - 21, 40, 34, 7);
        /* the water it all stands on, broken twice, already restless */
        for (let gx = 0; gx < F.W; gx += 3) {
          if ((gx + 4) % 17 < 3) continue;
          const yy = WATER + 3 + Math.sin(gx * 0.15 + u * TAU * 0.6) * 1.2;
          F.ink(gx, Math.round(yy), 4);
        }
        /* THE HAZE GATHERS ON THE WATER: claim starts at 0 and overshoots 1,
           so the noise-perturbed top edge of the frame is fully taken too —
           the first pass stopped the claim at exactly 1 and left a rind of
           untouched sky along the top the line does not admit to. */
        weatherClaim(F, u, smooth(u) * 1.30, 0);
      },
    },
    {
      label: "FROM THE GROUND UP", seconds: 13,
      line: "It takes me last, and from the ground up. I am reluctant — but I have been weather before.",
      cues: [
        { at: 0.08, f: 150, decay: 0.5, gain: 0.35, partials: [1, 1.6, 2.3], noise: 0.5, nDecay: 0.15, seed: 1403 },
        { at: 0.66, f: 70, decay: 0.9, gain: 0.4, partials: [1, 1.4, 2.0], noise: 0.6, nDecay: 0.35, seed: 1404 },
      ],
      draw(u, F) {
        const FEET = 122, H = 58;
        F.line(38, FEET, 84, FEET, 4, 1); F.line(104, FEET, 150, FEET, 4, 1);
        const shiver = Math.sin(u * TAU * 5) * 0.045;
        F.fig(96, FEET, H, { mode: "stand", arms: "open", rot: -0.10 + shiver, lean: 0.02 }, 7);
        /* I AM RELUCTANT: the schedule does not rise evenly. It climbs to
           0.44, HOLDS there through the movement's middle third, and only
           then finishes — a hesitation built into the dissolve itself
           rather than into the figure's pose. Rejected: animating the
           resistance into his stance instead — a stick figure that visibly
           fights a fog stops reading as a man dissolving and starts reading
           as a man doing jumping jacks. */
        const claim = 0.02 + ss(0, 0.38, u) * 0.42 + ss(0.60, 1, u) * 0.30;
        /* the same weatherClaim as M1, with only the phase shifted — this
           is the entire argument for "I have been weather before" */
        weatherClaim(F, u, claim, 3.7);
      },
    },
    {
      label: "NO WALLS", seconds: 13,
      line: "All black again. But no walls this time.",
      cues: [
        { at: 0.05, f: 46, decay: 1.6, gain: 0.5, partials: [1, 1.3, 1.8], noise: 0.5, nDecay: 0.6, seed: 1405 },
        { at: 0.58, f: 130, decay: 0.3, gain: 0.2, partials: [1, 1.8], noise: 0.9, nDecay: 0.1, seed: 1415 },
      ],
      draw(u, F) {
        /* THE BLACK BREATHES: the base level drifts between 6 and 7 on the
           ordered schedule, so "solid black" is a texture that is faintly,
           slowly alive for the whole movement rather than one flat number
           held for thirteen seconds. Rejected: the first pass, a pupil that
           finished closing two-fifths in and left the remaining eight
           seconds truly empty — a frame with nothing in it just looks like
           the film stopped, which is not the line. */
        const breathe = 0.5 + 0.45 * Math.sin(u * TAU * 0.35);
        F.map((x, y) => (F.bayer(x, y) < breathe ? 7 : 6));
        /* THE ONE EDGE IN THE MOVEMENT: an open horizon, noise-bent, that
           never closes and never turns a corner — no F.rect or F.box call
           appears anywhere in this function. Every movement before this one
           built something with a right angle (a tower, a window, a
           stance); this is what is left once none of it is standing, and
           the only "wall" law it obeys is that there are none. */
        for (let x = 0; x < F.W; x++) {
          const hy = 78 + (F.n2(x * 0.026, u * 0.6 + 4) - 0.5) * 20 + Math.sin(u * TAU * 0.2) * 3;
          F.put(x, Math.round(hy), 4); F.put(x, Math.round(hy) + 1, 5);
        }
        /* HE IS STILL IN IT, IN RESERVE. He drifts, because there is no
           wall left to stand near and nowhere he has to be instead. */
        reserveFig(F, lerp(58, 134, smooth(u)), 112, 42);
      },
    },
    {
      label: "THE REEL", seconds: 15,
      line: "A life flashes the way a reel does: the window, the tambourine, the field, the stars, the candle, the daisy, the ride, the temple, the hourglass.",
      cues: [
        { at: 0.02, f: 700, decay: 0.06, gain: 0.35, partials: [1, 2.3], noise: 0.7, nDecay: 0.02, seed: 1406 },
        { at: 0.40, f: 700, decay: 0.06, gain: 0.35, partials: [1, 2.3], noise: 0.7, nDecay: 0.02, seed: 1407 },
        { at: 0.80, f: 700, decay: 0.06, gain: 0.35, partials: [1, 2.3], noise: 0.7, nDecay: 0.02, seed: 1408 },
      ],
      draw(u, F) {
        const n = REEL.length;
        let i = 0; while (i < n - 1 && u >= REEL_BOUND[i + 1]) i++;
        const segStart = REEL_BOUND[i], segEnd = REEL_BOUND[i + 1];
        const p = (u - segStart) / (segEnd - segStart);      // 0..1 local progress through this beat
        const cut = lerp(0.22, 0.05, i / (n - 1));            // the flash shrinks — this is where "faster" lives
        filmFrame(F);
        if (p < cut) F.rect(6, 6, 180, 132, 7);               // the black frame-line between exposures
        else REEL[i](F);
      },
    },
    {
      label: "TWO ENTWINED MUSES", seconds: 14,
      line: "Our dance together is a victory — two entwined muses, as it ends.",
      cues: [
        { at: 0.18, f: 260, decay: 0.3, gain: 0.4, partials: [1, 1.5, 2.2], noise: 0.3, nDecay: 0.05, seed: 1409 },
        { at: 0.55, f: 300, decay: 0.3, gain: 0.4, partials: [1, 1.5, 2.2], noise: 0.3, nDecay: 0.05, seed: 1410 },
        { at: 0.84, f: 660, decay: 0.9, gain: 0.55, partials: [1, 2, 3, 4], noise: 0.2, nDecay: 0.05, seed: 1411 },
      ],
      draw(u, F) {
        const CX = 96, BY = 118, R = 34;
        /* THE SPIN SLOWS INTO A LANDING rather than running at one speed to
           the last frame — "as it ends" needs an ending the eye can see
           arrive, not a freeze-frame on whatever angle u happened to hit. */
        const ang = TAU * 2.2 * ss(0, 0.82, u);
        const settle = ss(0.82, 1, u);
        const bounce = Math.sin(ang * 3) * 2;
        const HA = 46 + bounce, HB = 42 - bounce;
        const ax = CX + Math.cos(ang) * R, ay = BY + Math.sin(ang) * R * 0.22;
        const bx = CX - Math.cos(ang) * R, by = BY - Math.sin(ang) * R * 0.22;
        const faceA = ax > CX ? -1 : 1, faceB = bx > CX ? -1 : 1;
        F.ring(CX, BY + 4, R + 12, 4, 1);     // the floor they turn on, a ring, no stage rectangle
        const up = settle > 0.5;
        F.fig(ax, ay, HA, { mode: "stand", face: faceA, arms: up ? "up" : "reach", rot: Math.sin(ang) * 0.12 }, 7);
        F.fig(bx, by, HB, { mode: "stand", face: faceB, arms: up ? "up" : "reach", rot: -Math.sin(ang) * 0.12 }, 7);
        if (!up) {
          /* ENTWINED: 'reach' makes each figure's own arm end at this exact
             point internally; drawing the join between the two is the only
             way to show two stick figures are holding on rather than
             merely standing near each other. */
          const hxA = ax + faceA * HA * 0.36, hyA = ay - HA * 0.72;
          const hxB = bx + faceB * HB * 0.36, hyB = by - HB * 0.72;
          F.line(hxA, hyA, hxB, hyB, 6, 1.4);
        }
        /* VICTORY: a burst that only earns its rays once the dance has
           actually resolved, not one running the whole movement as garnish */
        if (settle > 0.02) {
          for (let k = 0; k < 14; k++) {
            const ra = k / 14 * TAU, r0 = 44, r1 = 44 + settle * 44;
            F.line(CX + Math.cos(ra) * r0, ay - 10 + Math.sin(ra) * r0 * 0.5,
                   CX + Math.cos(ra) * r1, ay - 10 + Math.sin(ra) * r1 * 0.5, 3, 1);
          }
        }
      },
    },
    {
      label: "I CHOOSE THE DOOR", seconds: 18,
      line: "An old door, from a vintage somewhere. It opens on a slow party — the kind I once fell out of a window to escape. This time, I choose the door.",
      fx: { shake: (u) => win(u, 0.04, 0.08, 0.10, 0.15) * 1.3 },
      cues: [
        { at: 0.08, f: 180, decay: 0.5, gain: 0.4, partials: [1, 1.7, 2.6], noise: 0.9, nDecay: 0.2, seed: 1412 },
        { at: 0.50, f: 330, decay: 0.8, gain: 0.45, partials: [1, 2, 3, 4], noise: 0.15, nDecay: 0.05, seed: 1413 },
        { at: 0.88, f: 220, decay: 1.0, gain: 0.5, partials: [1, 1.5, 2.2], noise: 0.3, nDecay: 0.1, seed: 1414 },
      ],
      draw(u, F) {
        const hx = 132, top = 22, bot = 134, fullW = 34;
        const openAngle = smooth(clamp01((u - 0.06) / 0.62)) * 1.38;
        const visW = Math.max(0, fullW * Math.cos(openAngle));

        F.line(0, bot, 60, bot, 6, 1); F.line(72, bot, 192, bot, 6, 1);
        /* THE WINDOW, SHUT, THE KIND HE ONCE WENT THROUGH: present, dark,
           and never touched this movement — the whole point of drawing it
           is that nothing happens to it. Rejected: breaking it, echoing 01's
           fall. This film is not about that window any more. */
        windowGlyph(F, 40, 46, 32, 38, 5);
        /* THE SLOW PARTY: two bodies swaying at a fraction of a beat under
           a garland with one gap in it, so eleven discs never read as a
           stripe across the top of the room */
        for (let k = 0; k < 11; k++) {
          if (k === 5) continue;
          const t = k / 10, gx = 52 + t * 62, gy = 15 + Math.sin(t * Math.PI) * 6;
          F.disc(gx, gy, 1.3, 4);
        }
        for (const [dx, ph0] of [[58, 0], [88, 2.3]]) {
          const sway = Math.sin(u * TAU * 0.55 + ph0) * 4;
          F.fig(dx + sway, 130, 32, { mode: "stand", arms: "open", lean: Math.sin(u * TAU * 0.55 + ph0) * 0.05 }, 5);
        }

        doorLeaf(F, hx, top, bot, visW);

        /* THE LIGHT UNDER THE DOOR — the ONE accent this whole film spends.
           A sliver at the threshold from frame one, because the party has
           been lit the entire time and he is only now opening the door on
           it, and it widens up the gap as the leaf swings clear of the
           frame that used to hold it. Nowhere else in this module does
           level 8 appear. */
        for (let x = hx + 3; x < hx + fullW - 3; x += 3) F.put(x, bot - 1, 8);
        const gap = fullW - visW;
        if (gap > 2) {
          const gx = Math.round(hx + visW + Math.min(gap - 2, 4));
          for (let y = top + 3; y < bot - 3; y += 4) F.put(gx, y, 8);
        }

        /* HE WALKS TO IT, AND THROUGH IT: one figure moves once, from among
           the dancers to the doorway, and it never turns back toward the
           window it passes on the way. */
        const walk = ss(0.06, 0.82, u);
        const px = lerp(78, hx + 6, walk);
        const step = ss(0.82, 1, u);
        const px2 = lerp(px, hx + fullW * 0.55, step);
        F.fig(px2, 130, 40, { mode: "walk", phase: u * 5.5, face: 1 }, 7);
      },
    },
  ],
};
