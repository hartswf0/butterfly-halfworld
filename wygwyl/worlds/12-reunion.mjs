/* ============================================================================
   12 · REUNION — a WYGWYL halfworld

   LESS TIME FOR WORDS, MORE SPACE FOR LAUGHTER is not a caption here, it is
   the machine: every F.word call runs smaller than the last movement's —
   ph 12, 9, 8, 7, 6 — and says less each time, while the distance between
   the two brothers is one number that only grows, movement to movement and
   again inside movement five itself. Elders are drawn hollow-headed, because
   presence without mass is what a memory is. Hourglasses do not pour —
   pouring is a transport, and this film has nothing left to move from one
   place to another, only something to spend — so they burn outward from the
   neck and never finish emptying. It ends on the smallest word in the film,
   in the widest silence in the film, while the one ember this world is
   allowed drifts through the gap the wind has opened.
   ========================================================================= */
import { TAU, lerp, clamp01, smooth, ss, win } from "../halfworld.mjs";

const CX = 96, GROUND_Y = 128;

/* the yard the whole film stands in. THREE runs, not two — two runs with one
   narrow gap still reads as a single bar under the halftone at this width;
   splitting it again on the far side is what actually breaks it. */
function ground(F, l = 6, th = 1) {
  F.line(0, GROUND_Y, 54, GROUND_Y, l, th);
  F.line(66, GROUND_Y, 126, GROUND_Y, l, th);
  F.line(138, GROUND_Y, 192, GROUND_Y, l, th);
}

/* THE ONE NUMBER THE FILM IS ABOUT: the half-gap the brothers stand at. It
   only widens — hug, then talking distance, then the width of a memory
   between them, then the width of a question, then the width of a goodbye.
   Rejected: animating them walking toward or away from each other each
   movement, which would have made "more space" a plot event instead of the
   standing condition of every scene. */
function brothers(F, gap, h, armsL, armsR, l, breathe = 0, u = 0) {
  const bx = breathe ? Math.sin(u * TAU * 1.3) * breathe : 0;
  F.fig(CX - gap / 2 - bx, GROUND_Y, h, { mode: "stand", face: 1, ...armsL }, l);
  F.fig(CX + gap / 2 + bx, GROUND_Y, h, { mode: "stand", face: -1, ...armsR }, l);
}

/* LOUD VOICES, HEARTS OVERHEARD: rings that leave the chest and do not come
   home — the opposite of 02's silent scream, which collapsed inward because
   that film's subject was a room running out of space. This film has more
   space than it needs, so the sound is allowed to actually get there. */
function heardRings(F, u, cy, n, maxR) {
  for (let k = 0; k < n; k++) {
    const p = (u * 1.15 + k / n) % 1;
    const r = lerp(4, maxR, p);
    const lv = Math.max(1, Math.round(lerp(5, 1, p)));
    F.ring(CX, cy, r, lv, 1);
  }
}

/* AN ELDER IS AN OUTLINE. The living men in this film get F.fig's filled
   head; the one difference the eye needs to read "this one is a memory, not
   a person" is a hollow head and nothing else — so this is built by hand
   rather than by tinting a normal figure, which at low ink still read as
   someone merely standing far away. */
function elder(F, x, y, h, arms, l) {
  const th = Math.max(1, h * 0.05);
  const hip = [x, y - h * 0.46], sh = [x, y - h * 0.78], hd = [x, y - h * 0.885];
  const ft = [[x - h * 0.09, y], [x + h * 0.09, y]];
  const hn = arms === "up" ? [[x - h * 0.20, y - h * 1.02], [x + h * 0.20, y - h * 1.02]]
    : arms === "open" ? [[x - h * 0.30, y - h * 0.62], [x + h * 0.30, y - h * 0.62]]
    : [[x - h * 0.10, y - h * 0.38], [x + h * 0.10, y - h * 0.38]];
  F.line(hip[0], hip[1], sh[0], sh[1], l, th);
  F.line(hip[0], hip[1], ft[0][0], ft[0][1], l, th * 0.8);
  F.line(hip[0], hip[1], ft[1][0], ft[1][1], l, th * 0.8);
  F.line(sh[0], sh[1], hn[0][0], hn[0][1], l, th * 0.7);
  F.line(sh[0], sh[1], hn[1][0], hn[1][1], l, th * 0.7);
  F.ring(hd[0], hd[1], h * 0.10, l, 1);
}

/* BURN, NOT POUR. Pouring is a transport — grains leaving the top bulb and
   arriving in the bottom one — and this line has nothing left to move from
   one place to another, only something to spend. So the sand does not fall:
   it turns to ash IN PLACE, from the neck outward, and the ash never reaches
   the outer edge — the burn radius is capped short of the corners, because
   "will we make time?" is a question this film refuses to answer with an
   empty glass. Smoke is the only thing that leaves, and it leaves upward. */
function hourglass(F, u, cx, cy, w, h, seedK, l, withEmber) {
  const hw = w / 2;
  F.line(cx - hw, cy - h / 2, cx + hw, cy - h / 2, l, 1);
  F.line(cx - hw, cy - h / 2, cx, cy, l, 1);
  F.line(cx + hw, cy - h / 2, cx, cy, l, 1);
  F.line(cx - hw, cy + h / 2, cx + hw, cy + h / 2, l, 1);
  F.line(cx - hw, cy + h / 2, cx, cy, l, 1);
  F.line(cx + hw, cy + h / 2, cx, cy, l, 1);
  const burn = Math.min(0.58, u * 0.66);
  const R = F.rng(seedK);
  const n = Math.round(w * h * 0.10);
  for (let k = 0; k < n; k++) {
    const half = R() < 0.5 ? -1 : 1;
    const t = R();
    const yy = cy + half * t * (h / 2);
    const localHw = hw * t;
    const xx = cx + (R() * 2 - 1) * localHw;
    F.ink(Math.round(xx), Math.round(yy), t < burn ? 3 : 1);
  }
  for (let k = 0; k < 4; k++) {
    const sx = cx + (F.noise(seedK, k) - 0.5) * hw * 0.6;
    for (let j = 0; j < 7; j++) {
      const t = j / 7;
      const yy = cy - t * h * 0.85 - u * 3;
      const drift = Math.sin(t * 5 + k + u * 6) * (1.5 + t * 4);
      F.ink(Math.round(sx + drift), Math.round(yy), 2);
    }
  }
  if (withEmber) {
    const flick = 0.5 + 0.5 * Math.sin(u * TAU * 9 + seedK);
    F.put(cx, cy, 8);
    if (flick > 0.55) F.put(cx + (flick > 0.78 ? 1 : -1), cy, 8);
  }
}

/* A WORD ARRIVES OR LEAVES on the ordered schedule, never a cross-fade — the
   same dot-allegiance swap every dissolve in the suite obeys. `leaving`
   picks the direction: false grows a word out of paper, true erodes one back
   into it. Boxed tight to the glyph's own footprint so nothing else at this
   ink level nearby gets caught in the sweep. */
function typeset(F, text, cx, cy, ph, l, amt, leaving) {
  const w = F.wordW(text, ph), hgt = Math.ceil(ph * 1.6) + 2;
  F.word(text, cx, cy, ph, l, true);
  const x0 = cx - w / 2 - 2, x1 = cx + w / 2 + 2, y0 = cy - hgt / 2, y1 = cy + hgt / 2;
  F.map((x, y, v) => {
    if (v !== l || x < x0 || x > x1 || y < y0 || y > y1) return;
    const gone = F.bayer(x, y) < amt;
    return leaving ? (gone ? 0 : l) : (gone ? l : 0);
  });
}

export default {
  n: "12", slug: "12-reunion", title: "REUNION",
  tagline: "less time for words, more space for laughter",
  accent: "#5aa7ff", seed: 1212,
  drone: { base: 58, steps: [0, 4, 2, -3, -1, 5], bright: true },
  movements: [
    {
      label: "HUGS WITH NO REASON", seconds: 14,
      line: "Decades later, there is less time for words, and more space for laughter — hugs with no reason, and loud voices, so our hearts can be overheard.",
      /* LOUD VOICES gets one loud tool: a shake, timed to the two laugh
         cues rather than running the whole movement, because a shake that
         never stops reads as an earthquake and not as a laugh */
      fx: { shake: (u) => (Math.sin(u * TAU * 6.4) > 0.90 ? 1.6 : 0) },
      cues: [
        { at: 0.14, f: 140, decay: 0.20, gain: 0.45, partials: [1, 1.8, 2.6], noise: 0.4, nDecay: 0.05, seed: 121 },
        { at: 0.44, f: 520, decay: 0.14, gain: 0.5, partials: [1, 1.6, 2.9, 4.1], noise: 0.7, nDecay: 0.03, seed: 122 },
        { at: 0.70, f: 480, decay: 0.16, gain: 0.5, partials: [1, 1.7, 3.0], noise: 0.7, nDecay: 0.03, seed: 123 },
      ],
      draw(u, F) {
        ground(F);
        heardRings(F, u, 96, 4, 78);
        /* THE HUG: the gap is small enough that the reaching arms cross
           past centre and overlap, which is the only way two stick figures
           in this kit can read as embracing rather than facing off.
           Rejected: gap 12 with taller figures — the two heads fused into
           one blob at that radius and the hug read as conjoined twins. */
        brothers(F, 15, 33,
          { arms: "open", lean: 0.08 }, { arms: "open", lean: -0.08 }, 7, 1.2, u);
        /* the thesis, stated in full — this is the loudest, wordiest frame
           in the film on purpose, because everything after it only takes
           words away. Measured at 169 cells wide, ph 12: the widest legal
           margin before the halftone starts clipping descenders at 192. */
        F.word("LESS TIME FOR WORDS", CX, 16, 12, 7, true);
        F.word("MORE SPACE FOR LAUGHTER", CX, 33, 12, 7, true);
      },
    },
    {
      label: "LESS TIME, MORE SPACE", seconds: 8,
      line: "Less time for words. More space for laughter.",
      /* THE SHORTEST MOVEMENT, AND THE EMPTIEST ON PURPOSE. No fx, no
         rings, no ground texture beyond the plain break — every tool added
         here would be one more thing taking up the room the line just gave
         back. Two words only, and one of them is leaving. */
      cues: [{ at: 0.5, f: 300, decay: 0.10, gain: 0.20, partials: [1, 2], noise: 0.5, nDecay: 0.03, seed: 124 }],
      draw(u, F) {
        ground(F, 6, 1.4);
        brothers(F, lerp(28, 52, smooth(u)), 27,
          { arms: "up" }, { arms: "up" }, 6, 1, u);
        /* WORDS empties out of the frame as the line spends itself; LAUGHTER
           grows into the room it leaves — the same per-dot allegiance swap
           as every other dissolve in the suite, run once in each direction */
        typeset(F, "WORDS", 40, 18, 9, 7, smooth(u), true);
        typeset(F, "LAUGHTER", 150, 18, 9, 7, smooth(u * 0.9), false);
        /* THE ROOM ITSELF, MADE VISIBLE: a nearly-empty frame is still a
           frame, not a void, so the open air gets a few grains of its own —
           sparse enough to read as daylight and not as texture. Held under
           30 points because past that this stopped being "nearly empty"
           and started being a sky. */
        const R = F.rng(19);
        for (let k = 0; k < 26; k++) F.ink(Math.round(R() * F.W), Math.round(40 + R() * 70), 1);
      },
    },
    {
      label: "ELDERS, NOW PAST", seconds: 13,
      line: "Reflecting on legacies, and creeds once told — of elders, now past.",
      cues: [
        { at: 0.20, f: 220, decay: 0.9, gain: 0.35, partials: [1, 2.01, 3.02], noise: 0.2, nDecay: 0.10, seed: 125 },
        { at: 0.62, f: 165, decay: 1.1, gain: 0.35, partials: [1, 2.01, 3.02], noise: 0.15, nDecay: 0.10, seed: 126 },
      ],
      draw(u, F) {
        ground(F);
        brothers(F, 62, 32,
          { arms: "down", lean: -0.05 }, { arms: "down", lean: 0.05 }, 7, 1.2, u);
        /* THE ELDERS STAND IN THE ROOM THE BROTHERS' DISTANCE OPENED UP —
           the space that "more space" bought is where the past now stands.
           Faint (level 2-3): they are recalled, not present. One arm raised,
           because a creed has to be told by somebody. */
        elder(F, 74, GROUND_Y - 2, 26, "down", 2);
        elder(F, CX, GROUND_Y - 4, 30, "up", 3);
        elder(F, 118, GROUND_Y - 2, 24, "down", 2);
        typeset(F, "ELDERS", CX, 15, 8, 7, ss(0.12, 0.55, u), false);
      },
    },
    {
      label: "BURNING HOURGLASSES", seconds: 14,
      line: "And is this a one-time occasion? we ask. Or will we make time, in the sands of burning hourglasses?",
      fx: { shake: (u) => (Math.sin(u * TAU * 13) > 0.90 ? 1.2 : 0) },
      cues: [
        { at: 0.12, f: 1800, decay: 0.06, gain: 0.35, partials: [1, 1.4, 2.3], noise: 1.0, nDecay: 0.05, seed: 127 },
        { at: 0.44, f: 1600, decay: 0.06, gain: 0.30, partials: [1, 1.5, 2.1], noise: 1.0, nDecay: 0.05, seed: 128 },
        { at: 0.76, f: 1700, decay: 0.06, gain: 0.30, partials: [1, 1.4, 2.4], noise: 1.0, nDecay: 0.05, seed: 129 },
      ],
      draw(u, F) {
        ground(F);
        /* both of them reaching for the same object instead of for each
           other — the question is between them now, not the embrace */
        brothers(F, 78, 32,
          { arms: "reach" }, { arms: "reach" }, 7, 1.6, u);
        F.line(64, 96, 82, 96, 4, 1); F.line(110, 96, 128, 96, 4, 1);   // the shelf it sits on
        hourglass(F, u, CX, 74, 30, 38, 41, 6, true);
        /* THE SANDS ARE PLURAL: two small glasses flank the one being
           watched, burning on their own slower schedule, unlit — this
           world only spends one ember, on the one that is being asked
           about */
        hourglass(F, u * 0.7, 66, 96, 12, 15, 42, 5, false);
        hourglass(F, u * 0.85, 126, 96, 12, 15, 43, 5, false);
        typeset(F, "BURNING", CX, 15, 7, 7, ss(0.05, 0.32, u), false);
      },
    },
    {
      label: "WINDS PART", seconds: 13,
      line: "Before our winds part ways — to a next lifetime. This is brotherhood.",
      cues: [
        { at: 0.18, f: 60, decay: 1.4, gain: 0.30, partials: [1, 1.3, 1.9], noise: 0.9, nDecay: 0.5, seed: 130 },
        { at: 0.62, f: 52, decay: 1.6, gain: 0.30, partials: [1, 1.3, 1.9], noise: 0.9, nDecay: 0.55, seed: 131 },
      ],
      draw(u, F) {
        ground(F);
        const part = smooth(u);
        /* THE GAP THAT ONLY OPENS. Every other gap in this film breathes —
           in and back — because it belongs to a moment that is still
           happening. This one is the last movement of the last film of the
           suite's occasion, so it is allowed to just go: monotone in u,
           same as the storm in 01 that never brightens again. */
        const windGap = lerp(6, 92, part);
        for (let r = 0; r < 9; r++) {
          const y = lerp(34, 108, r / 8);
          const wob = Math.sin(u * TAU * (0.6 + r * 0.07) + r * 1.3) * (1 + (r % 3));
          const lEnd = CX - windGap / 2 - wob, rStart = CX + windGap / 2 + wob;
          for (let seg = 0; seg < 3; seg++) {
            const sw = 15;
            F.line(Math.max(0, lEnd - sw * (seg + 1)), y, Math.max(0, lEnd - sw * seg), y, 4, 1);
            F.line(Math.min(192, rStart + sw * seg), y, Math.min(192, rStart + sw * (seg + 1)), y, 4, 1);
          }
        }
        brothers(F, lerp(78, 118, part), 30,
          { arms: "open" }, { arms: "open" }, 7, 1.2, u);
        /* the last ember this world spends: the same fire from movement
           four, carried off through the gap the wind just opened */
        if (part > 0.55) {
          const ex = lerp(CX - windGap * 0.3, CX + windGap * 0.35, clamp01((part - 0.55) / 0.4));
          F.put(Math.round(ex), 70, 8);
        }
        typeset(F, "BROTHERHOOD", CX, 18, 6, 7, ss(0.5, 0.85, u), false);
      },
    },
  ],
};
