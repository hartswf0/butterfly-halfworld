/* ============================================================================
   12 · REUNION — a WYGWYL halfworld

   LESS TIME FOR WORDS, MORE SPACE FOR LAUGHTER is not a caption here, it is
   the machine: every F.word call runs smaller movement to movement, down
   from ph 12 in the first to ph 8-9 by the last two — never all the way to
   the kit's nominal floor of 6, because at this word length and weight 6
   is where letters start reading as other letters (see the notes at
   BURNING and BROTHERHOOD: legibility outranks the pattern every time they
   conflict) — while the distance between the
   two brothers is one number that only grows, movement to movement and
   again inside movement five itself. Words never erode as they shrink: a
   glyph mid-dissolve for most of a movement is not a word, it is noise, so
   every dissolve here is a short beat at one end and whole or absent
   everywhere else. Elders are drawn hollow-headed, because presence without
   mass is what a memory is. Hourglasses do not pour — pouring is a
   transport, and this film has nothing left to move from one place to
   another, only something to spend — so they burn outward from the neck
   and never finish emptying. It ends in the widest silence in the film,
   while the one ember this world is allowed drifts through the gap the
   wind has opened.
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
  /* THE BROTHERS BREATHE; THE ELDERS DO NOT. That single difference — a
     `phase` so the pose solver's own idle rise-and-fall actually runs,
     against elder()'s hand-drawn line figure which has no such clock at
     all — is what tells a living man from a memory of one, for free, and
     it is why elder() below is never rebuilt on top of F.fig. Weight
     settles onto opposite hips (mirrored by `face`) so two men standing
     and talking don't stand in the same diagram twice. */
  F.fig(CX - gap / 2 - bx, GROUND_Y, h, { mode: "stand", face: 1,
    phase: u * 1.7 + 0.3, weight: 0.62, guise: "poet", ...armsL }, l);
  F.fig(CX + gap / 2 + bx, GROUND_Y, h, { mode: "stand", face: -1,
    phase: u * 1.7 + 2.6, weight: 0.62, ...armsR }, l);
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

/* A WORD ARRIVES OR LEAVES on the ordered schedule, never a cross-fade — but
   ONLY ACROSS A SHORT WINDOW (t0..t1 typically 12-18% of the movement).
   Rejected: running the dissolve across most of the movement's length, which
   was the first draft of this file — a word that is half-scattered dots for
   forty percent of its screen time is not a word for forty percent of its
   screen time, it is noise, and this is the one film in the suite where the
   type has to survive being looked at. Outside [t0,t1] the glyph is either
   whole or absent; it is never partial for long. */
function typeset(F, text, cx, cy, ph, l, u, t0, t1, leaving) {
  const amt = leaving ? 1 - ss(t0, t1, u) : ss(t0, t1, u);
  if (amt <= 0.002) return;
  const w = F.wordW(text, ph), hgt = Math.ceil(ph * 1.6) + 2;
  F.word(text, cx, cy, ph, l, true);
  if (amt >= 0.998) return;                    // fully arrived: draw whole, skip the sweep
  const x0 = cx - w / 2 - 2, x1 = cx + w / 2 + 2, y0 = cy - hgt / 2, y1 = cy + hgt / 2;
  F.map((x, y, v) => {
    if (v !== l || x < x0 || x > x1 || y < y0 || y > y1) return;
    return F.bayer(x, y) < amt ? l : 0;
  });
}

/* WORDS DOES NOT ERODE, IT SHRINKS: the same complete glyph redrawn smaller
   every frame, which is legible at every single size right up until it is
   gone, and only "gone" is allowed to be a dissolve — a short one, at the
   very end, never the whole shrink. Rejected: eroding the glyph dot by dot
   as it also got smaller, which is what the size number in the line
   actually became on screen, but which is unreadable while it is happening;
   the line asks for less time for words, not for words that fall apart. */
function shrinkAway(F, text, cx, cy, ph0, ph1, l, u, shrinkEnd, goneBy) {
  if (u >= goneBy) return;
  if (u < shrinkEnd) {
    const ph = lerp(ph0, ph1, smooth(u / shrinkEnd));
    F.word(text, cx, cy, ph, l, true);
    return;
  }
  const amt = ss(shrinkEnd, goneBy, u);
  const w = F.wordW(text, ph1), hgt = Math.ceil(ph1 * 1.6) + 2;
  F.word(text, cx, cy, ph1, l, true);
  const x0 = cx - w / 2 - 2, x1 = cx + w / 2 + 2, y0 = cy - hgt / 2, y1 = cy + hgt / 2;
  F.map((x, y, v) => {
    if (v !== l || x < x0 || x > x1 || y < y0 || y > y1) return;
    return F.bayer(x, y) < amt ? 0 : l;
  });
}

/* LAUGHTER's mirror: a short arrival, whole from the moment it lands, and
   then it is given the room WORDS just gave up — it grows, never erodes,
   for the rest of the movement. */
function growIn(F, text, cx, cy, ph0, ph1, l, u, arriveStart, arriveEnd) {
  if (u < arriveStart) return;
  if (u < arriveEnd) {
    const amt = ss(arriveStart, arriveEnd, u);
    const w = F.wordW(text, ph0), hgt = Math.ceil(ph0 * 1.6) + 2;
    F.word(text, cx, cy, ph0, l, true);
    const x0 = cx - w / 2 - 2, x1 = cx + w / 2 + 2, y0 = cy - hgt / 2, y1 = cy + hgt / 2;
    F.map((x, y, v) => {
      if (v !== l || x < x0 || x > x1 || y < y0 || y > y1) return;
      return F.bayer(x, y) < amt ? l : 0;
    });
    return;
  }
  const ph = lerp(ph0, ph1, smooth((u - arriveEnd) / (1 - arriveEnd)));
  F.word(text, cx, cy, ph, l, true);
}

export default {
  n: "12", slug: "12-reunion", title: "REUNION",
  tagline: "less time for words, more space for laughter",
  accent: "#5aa7ff", seed: 1212,
  /* THE FILM'S OWN PASSAGE of the suite's 24-minute score, taken from the
     original running order. The runtime stretches this film's movements to
     fill it, so picture and record line up without either being cut. */
  window: [1168.019, 1242.999],
  /* KEY: C major (Ionian) at the suite's root — plain and warm for a
     reunion that is "less time for words, more space for laughter". */
  drone: { base: 65.41, steps: [0, 0, 4, -3, 7, 12], bright: true },
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
        /* WORDS shrinks, whole at every size, then goes in one short beat;
           LAUGHTER lands in one short beat and then grows into the room
           WORDS gave up. Neither is ever a half-formed scatter for long —
           see shrinkAway / growIn for why that draft was rejected. */
        shrinkAway(F, "WORDS", 40, 18, 11, 8, 7, u, 0.55, 0.70);
        growIn(F, "LAUGHTER", 150, 18, 9, 11, 7, u, 0.18, 0.34);
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
        typeset(F, "ELDERS", CX, 15, 9, 7, u, 0.08, 0.24, false);
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
        /* held at ph 9, not 7 — at 7 the B-U pair compresses into a shape
           that reads as "W" at a glance, which is exactly the failure this
           film cannot afford in its own title word */
        typeset(F, "BURNING", CX, 15, 9, 7, u, 0.05, 0.20, false);
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
        /* THE WIND IS SHORT DIAGONAL DASHES LEANING AWAY FROM CENTRE, not
           ruled horizontal rows — the first draft used straight rows at
           fixed heights and it read as blinds, not weather. Every dash
           points the direction its half of the frame is going, which is
           what makes the empty middle read as something PARTING rather
           than a diagram with a gap in it.
           THE GAP THAT ONLY OPENS. Every other gap in this film breathes —
           in and back — because it belongs to a moment that is still
           happening. This one is monotone in u, same as the storm in 01
           that never brightens again. */
        const gapHalf = lerp(3, 60, part);
        const R = F.rng(51);
        for (let k = 0; k < 100; k++) {
          const y = 26 + R() * 92, bx = 22 + R() * 148;
          const x = bx + Math.sin(u * TAU * (0.4 + R() * 0.5) + bx * 0.05) * 3;
          if (Math.abs(x - CX) < gapHalf) continue;
          const side = x < CX ? -1 : 1;
          const len = 7 + R() * 8, rise = (R() - 0.5) * 5;
          F.line(x, y, x + side * len, y + rise, 4, 1);
        }
        brothers(F, lerp(78, 118, part), 30,
          { arms: "open" }, { arms: "open" }, 7, 1.2, u);
        /* the last ember this world spends: the same fire from movement
           four, carried off through the gap the wind just opened */
        if (part > 0.55) {
          const ex = lerp(CX - gapHalf * 0.6, CX + gapHalf * 0.7, clamp01((part - 0.55) / 0.4));
          F.put(Math.round(ex), 70, 8);
        }
        /* BROTHERHOOD holds at ph 8, one size down from the ph-9 plateau
           M3 and M4 share — rejected outright once the render showed it: an
           eleven-letter word with a double O collapses into noise below 8,
           and this is the one word the whole film has been saving its space
           for. The arc is 12 in M1, down to 8-11 across M2's shrink-and-grow,
           a ph-9 floor for M3 and M4, and one size smaller again here — a
           trend, not a ruler, because the last movement's word had to win
           the argument with the pattern every time the two disagreed. */
        typeset(F, "BROTHERHOOD", CX, 18, 8, 7, u, 0.55, 0.68, false);
      },
    },
  ],
};
