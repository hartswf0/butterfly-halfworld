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
   everywhere else. Elders are cut OUT of the past rather than drawn on top of
   it: for one movement the film's polarity turns over, the ink is the memory
   and the elders are the paper, and what ends them is not their leaving but
   the dark they were visible against draining away. Hourglasses both run and
   burn, and neither clock is allowed to finish — the sand falls, the glass
   gutters, and the number of them still alight comes down to one, which is
   the only answer this film gives to "is this a one-time occasion?".
   It ends in the widest silence in the film,
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
     against elderCut()'s hand-drawn line figure, which has no such clock at
     all — is what tells a living man from a memory of one, for free, and
     it is why elderCut() below is never rebuilt on top of F.fig. Weight
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

/* AN ELDER CUT OUT OF THE PAST. For one movement the polarity of the whole
   film turns over: the yard in M3 is being remembered out of a dark, so the
   ink is the past and the elders are the paper. Laid down with `set`, which is
   how a line writes light into a dark field — F.line takes that flag and
   F.ring does not, which is why the head here is a disc and not a hoop.
   It does not need to be a hoop either. The earlier version of this drew an
   elder as a dark outline with one hollow mark for a head, on the reasoning
   that presence without mass is what a memory is; in reserve the whole body is
   that hollow, so the one mark is no longer carrying the idea by itself. That
   version is gone: M3 was its only caller. */
function elderCut(F, x, y, h, arms) {
  const th = Math.max(1.8, h * 0.10);
  const hip = [x, y - h * 0.46], sh = [x, y - h * 0.78], hd = [x, y - h * 0.885];
  const ft = [[x - h * 0.09, y], [x + h * 0.09, y]];
  const hn = arms === "up" ? [[x - h * 0.20, y - h * 1.02], [x + h * 0.20, y - h * 1.02]]
    : arms === "open" ? [[x - h * 0.30, y - h * 0.62], [x + h * 0.30, y - h * 0.62]]
    : [[x - h * 0.10, y - h * 0.38], [x + h * 0.10, y - h * 0.38]];
  F.line(hip[0], hip[1], sh[0], sh[1], 0, th * 1.35, true);
  F.line(hip[0], hip[1], ft[0][0], ft[0][1], 0, th, true);
  F.line(hip[0], hip[1], ft[1][0], ft[1][1], 0, th, true);
  F.line(sh[0], sh[1], hn[0][0], hn[0][1], 0, th * 0.8, true);
  F.line(sh[0], sh[1], hn[1][0], hn[1][1], 0, th * 0.8, true);
  F.disc(hd[0], hd[1], h * 0.115, 0, true);
}

/* THE CREED, TOLD. M1's hearts are dark rings leaving a body on paper; these
   are light rings leaving one in the dark — the same law from the other side
   of it, because a creed told decades ago still arrives the way a voice does.
   Clipped at the yard so a ring never writes paper over ground the living are
   standing on. */
function creedRing(F, cx, cy, r, th) {
  const n = Math.max(10, Math.ceil(TAU * r * 1.5));
  for (let k = 0; k < n; k++) {
    const a = k / n * TAU;
    const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
    if (py > GROUND_Y - 3) continue;
    F.disc(px, py, th / 2, 0, true);
  }
}

/* AN HOURGLASS THAT IS ON FIRE AND STILL RUNNING. The first version of this
   file refused both: the sand turned to ash in place, on the reasoning that
   pouring is a transport and this line has nothing left to move — and the
   glass held a clean outline for sixteen seconds. What that produced was a
   diagram of an hourglass with a texture on it, held still. The line names two
   clocks and both have to run. THE SAND FALLS, drawn as a mass leaving one
   bulb and arriving in the other — filled runs, not a sprinkle, because a
   quantity you are meant to watch go down has to have a level you can see.
   THE GLASS BURNS: its outline is laid in short runs that go out where the
   fire has been at it, flame stands off the rims, and smoke leaves upward.
   Neither clock finishes on the one that matters — at the end of the movement
   the survivor is still running and still alight, because "will we make time?"
   is a question and this film will not answer it with an empty glass. */
function hourglass(F, u, cx, cy, w, h, seedK, l, run, fire, ember) {
  const hw = w / 2, hh = h / 2, top = cy - hh, bot = cy + hh;
  /* the vessel, guttering. Seven runs a side and a run drops out once the
     fire has eaten that far, so the glass is consumed rather than outlined. */
  const seg = (x0, y0, x1, y1, kB) => {
    for (let k = 0; k < 7; k++) {
      if (F.noise(seedK * 7 + kB, k) < (1 - fire) * 0.02 + run * 0.30) continue;
      const t0 = k / 7, t1 = (k + 0.92) / 7;
      F.line(lerp(x0, x1, t0), lerp(y0, y1, t0), lerp(x0, x1, t1), lerp(y0, y1, t1), l, 1);
    }
  };
  seg(cx - hw, top, cx + hw, top, 1); seg(cx - hw, bot, cx + hw, bot, 4);
  seg(cx - hw, top, cx, cy, 2); seg(cx + hw, top, cx, cy, 3);
  seg(cx - hw, bot, cx, cy, 5); seg(cx + hw, bot, cx, cy, 6);
  /* THE UPPER BULB, EMPTYING. Its surface descends toward the neck and the
     runs are never wider than the glass, so nothing here is a full-width bar. */
  const surf = cy - hh * (1 - run);
  for (let y = Math.ceil(surf); y < cy; y++) {
    const half = hw * (cy - y) / hh - 1.1;
    if (half > 0.6) F.rect(cx - half, y, half * 2, 1, 4);
  }
  /* THE LOWER BULB, FILLING, with a heap under the stream — sand landing makes
     a cone, and the cone is most of what tells the eye which way this is going */
  const pileTop = bot - hh * run * 0.90, apex = pileTop - hh * 0.30 * run;
  for (let y = Math.ceil(cy) + 1; y <= Math.floor(bot); y++) {
    const half = hw * (y - cy) / hh - 1.1;
    if (half < 0.6) continue;
    const hf = y >= pileTop ? half : (y > apex ? Math.min(half, (y - apex) * 0.95) : -1);
    if (hf > 0.5) F.rect(cx - hf, y, hf * 2, 1, 4);
  }
  /* the stream, dashed and stepping downward, so falling is visible as motion
     and not merely as two levels that happen to differ next frame */
  if (run > 0.02 && run < 0.99) {
    const off = Math.floor(u * 19);
    for (let y = Math.ceil(cy) + 1; y < apex; y++) {
      if ((((y - off) % 3) + 3) % 3 === 2) continue;
      F.ink(Math.round(cx), y, 5);
    }
  }
  /* FLAME, ALONG THE RIMS. Each tongue is three segments off one point, dark at
     the root and lighter at the tip, on its own flicker clock so no two of them
     ever agree — a row of tongues in step reads as a fence of them. */
  const tongue = (x, y, len, ph) => {
    let px = x, py = y;
    for (let j = 1; j <= 3; j++) {
      const t = j / 3;
      const nx = x + Math.sin(ph + t * 2.7) * len * 0.42 * t, ny = y - t * len;
      F.line(px, py, nx, ny, t < 0.7 ? 6 : 4, t < 0.5 ? 1.5 : 1);
      px = nx; py = ny;
    }
  };
  const nT = Math.max(2, Math.round(2 + fire * 4));
  for (let k = 0; k < nT; k++) {
    const t = (k + 0.5) / nT;
    const fl = h * (0.14 + 0.24 * F.noise(seedK, k + 3)) * fire
             * (0.62 + 0.38 * Math.sin(u * TAU * (2.4 + k * 0.53) + seedK));
    if (fl < 1.2) continue;
    tongue(cx - hw + t * w, top, fl, seedK + k * 1.7 + u * 4);
  }
  for (const s of [-1, 1]) {
    const fl = h * 0.30 * fire * (0.55 + 0.45 * Math.sin(u * TAU * 3.1 + s + seedK));
    if (fl > 1.2) tongue(cx + s * hw, bot, fl, seedK + s + u * 5);
  }
  /* smoke: the only thing that leaves, and it leaves upward */
  if (fire > 0.05) for (let k = 0; k < 4; k++) {
    const sx = cx + (F.noise(seedK, k + 20) - 0.5) * w * 0.7;
    for (let j = 0; j < 8; j++) {
      const t = (j / 8 + u * 0.55 + F.noise(seedK, k)) % 1;
      const yy = top - 3 - t * (h * 1.4 + 18);
      const drift = Math.sin(t * 4.4 + k + u * 3.2) * (2 + t * 9);
      F.ink(Math.round(sx + drift), Math.round(yy), t > 0.6 ? 1 : 2);
    }
  }
  if (ember) {
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
        { at: 0.18, f: 220, decay: 0.9, gain: 0.35, partials: [1, 2.01, 3.02], noise: 0.2, nDecay: 0.10, seed: 125 },
        { at: 0.52, f: 165, decay: 1.1, gain: 0.35, partials: [1, 2.01, 3.02], noise: 0.15, nDecay: 0.10, seed: 126 },
        { at: 0.86, f: 82, decay: 1.7, gain: 0.30, partials: [1, 1.5, 2.2], noise: 0.10, nDecay: 0.25, seed: 132 },
      ],
      draw(u, F) {
        /* THE PAST IS THE GROUND HERE AND THE ELDERS ARE THE FIGURE. Every
           other movement in this film is black on light; this one turns over,
           because what is being looked at is not the yard — it is the dark the
           yard is being remembered out of. And that dark is the movement's one
           quantity: it recedes from the edges inward, dot by dot on the ordered
           schedule, until it has gone and the two brothers are standing in a
           plain bright yard with more space between them than they started
           with. THE ELDERS DO NOT LEAVE. What leaves is the only thing they
           were ever visible against, which is what "now past" actually
           describes and what a memory actually does.
           REJECTED: three faint line figures on paper, held still for fifteen
           seconds, which is what this movement was — a legible diagram of the
           idea, and a photograph of it. */
        const gone = ss(0.10, 0.94, u);
        /* IT DRAINS DOWNWARD, AND THE ELDERS GO HEAD FIRST. Rejected: an
           ellipse contracting on the elders from the frame's edges — it
           narrowed to a dome, and with the creed's own rings nested inside it
           the frame read as a domed hall, which is a building and not a
           memory. A ceiling that comes down is the same monotone quantity with
           none of that in it, and it takes each elder from the crown
           downward, which is the order a face actually goes in.
           Both of its edges wander — the front on its own noise, the lower lip
           across the yard line — so neither is ever a ruled bar. */
        const front = lerp(-14, GROUND_Y + 8, gone);
        F.map((x, y, v) => {
          const lip = GROUND_Y + 1 + (F.n2(x * 0.06, 5.1) - 0.5) * 11;
          if (y > lip) return;
          const f = front + (F.n2(x * 0.05, 7.3) - 0.5) * 13;
          if (y < f - 7) return;
          if (y < f + 7) return F.bayer(x, y) < (y - f + 7) / 14 ? 3 : undefined;
          return 3;
        });
        ground(F);
        /* CREEDS ONCE TOLD, and told twice here — once on each bell. The reach
           of the rings is the reach of the telling, so they go out further on
           the second one and then there is no third. */
        const tell = Math.max(win(u, 0.10, 0.18, 0.34, 0.44), win(u, 0.44, 0.52, 0.66, 0.78));
        if (tell > 0.02) for (let k = 0; k < 3; k++) {
          const p = (u * 1.05 + k / 3) % 1;
          creedRing(F, CX, GROUND_Y - 33, lerp(4, 10 + 22 * tell, p), 1.2);
        }
        /* THE ELDERS STAND IN THE ROOM THE BROTHERS' DISTANCE OPENED UP — the
           space that "more space" bought is where the past now stands. Three
           of them near and told apart, and behind those a row of the rest,
           because "legacies" and "elders" are both plural and a lineage is
           not three people. One arm raised: a creed has to be told by
           somebody. */
        const G = F.rng(66);
        for (let k = 0; k < 10; k++) {
          const g1 = G(), g2 = G(), g3 = G(), g4 = G();
          const gx = 8 + k * 19.5 + (g1 - 0.5) * 9;
          if (Math.abs(gx - 82) < 14 || Math.abs(gx - CX) < 15 || Math.abs(gx - 110) < 14) continue;
          elderCut(F, gx, GROUND_Y - 5 - g2 * 6, 17 + g3 * 7, g4 > 0.72 ? "open" : "down");
        }
        elderCut(F, 82, GROUND_Y - 2, 26, "down");
        elderCut(F, CX, GROUND_Y - 4, 31, "up");
        elderCut(F, 110, GROUND_Y - 2, 24, "down");
        /* REFLECTING: the two of them look into it while it is there and back
           at each other when it is not, and the gap opens the whole time. At
           29 the pose solver draws them solid rather than contour-and-fill,
           which is the difference between two black men standing in a grey
           yard and two outlines of men lost in one. */
        const look = win(u, 0.02, 0.14, 0.60, 0.84);
        const carry = {
          arms: "down", headTilt: -0.34 + look * 0.26,
          weight: lerp(0.66, 0.34, smooth(u)), headTurn: look * 0.55,
        };
        brothers(F, lerp(54, 70, smooth(u)), 29,
          { ...carry, lean: -0.04 }, { ...carry, lean: 0.04 }, 7, 1.2, u);
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
        { at: 0.78, f: 1700, decay: 0.06, gain: 0.30, partials: [1, 1.4, 2.4], noise: 1.0, nDecay: 0.05, seed: 129 },
      ],
      draw(u, F) {
        ground(F);
        /* THE COUNT IS THE QUESTION. "Is this a one-time occasion?" is not a
           mood, it is a number, and the number is how many of these are still
           alight: the yard starts full of them and they go out one at a time,
           each slumping as it burns down, until exactly ONE is left — the one
           the two of them are still asking about, and the one whose ember the
           wind carries off in the last movement. Rejected: three glasses held
           for sixteen seconds, two of them flanking the third to make "sands"
           plural. Plural was true of that frame and nothing else was.
           A yard of them is also what finally gives this movement a mass to
           work with; three line drawings on paper never had one. */
        const R = F.rng(61);
        const N = 12;
        let lit = 1;                             // the one on the shelf, always
        /* LAID ON A GRID, AND THERE ARE ONLY TWELVE. Placed by chance alone
           they overlapped into knots of three and four and the yard read as
           wreckage — the same failure 08's crowd had to be given a minimum
           separation to cure. Eighteen was then too many for the grid as well:
           at fifteen cells across apiece, eighteen of them need more frame
           than the frame has, and a grid that has to be crowded is a scatter
           with extra steps. Four to a rank, three ranks interleaved, fourteen
           cells apart across and eight apart back — and any that would stand
           where a brother is standing simply does not. */
        for (let k = 0; k < N; k++) {
          const r1 = R(), r2 = R(), r3 = R(), r4 = R();
          const rank = k % 3, idx = (k / 3) | 0;
          /* THEY DO NOT GO OUT LEFT TO RIGHT. Ordering the deaths by k made
             them die in the order they were laid down, which is across the
             frame, and the yard emptied like a fuse — by two thirds through it
             was bare on the left and crowded on the right. Seven is coprime
             with twelve, so stepping by it visits every glass exactly once in
             an order that has nothing to do with where any of them stands. */
          const ord = (k * 7) % N;
          const dies = 0.04 + 0.62 * (ord / (N - 1)) + (r2 - 0.5) * 0.05;
          const alive = 1 - ss(dies, dies + 0.13, u);
          if (alive < 0.02) continue;
          lit++;
          /* NUDGED CLEAR OF THE LIVING. No uniform grid across this frame can
             miss both brothers, and the render of the one that did not put a
             burning glass directly behind a man's head — flames standing off
             his crown like a candelabra, which is exactly the kind of
             plausible picture the shooter's numbers never catch. Pushed aside
             rather than dropped, so the count the movement is about survives
             the composition fix. */
          let x = 10 + idx * 46 + rank * 15.5 + (r1 - 0.5) * 5;
          const half = lerp(70, 78, smooth(u)) / 2;
          for (const bx of [CX - half, CX + half])
            if (Math.abs(x - bx) < 13) x += (x < bx ? -1 : 1) * (13 - Math.abs(x - bx));
          const gy = GROUND_Y - 1 - rank * 8;
          const hk = (32 - rank * 6) * (0.82 + r3 * 0.36) * (0.36 + alive * 0.64);
          hourglass(F, u, x, gy - hk / 2, hk * 0.64, hk, 70 + k, 5,
                    clamp01(0.05 + u * 1.5 + r4 * 0.25), alive * 0.85, false);
        }
        F.line(64, 96, 82, 96, 4, 1); F.line(110, 96, 128, 96, 4, 1);   // the shelf it sits on
        /* the one being asked about. Its sand runs the whole movement and does
           not run out; its fire only grows. */
        hourglass(F, u, CX, 74, 32, 40, 41, 6, 0.06 + u * 0.60, 0.55 + 0.45 * ss(0.1, 0.8, u), true);
        /* the smoke of eighteen fires standing in the top of the frame — the
           same count again, in the substance the count leaves behind, thinning
           as they go out. Only paper is eligible, so nothing already drawn is
           dimmed by it. */
        /* A LAYER, NOT A WEATHER SYSTEM. Two drafts spread it as a soft field
           over the whole upper third and both came back as four or five big
           masses hanging off the top edge, which reads as a stain on the paper.
           Smoke from a room full of small fires does what smoke does indoors:
           it collects under the ceiling in a layer, deepest at the top and
           ragged along its own underside. The layer's depth is the count of
           fires still lit, which is the movement's one number again in the
           substance the number leaves behind. */
        const haze = clamp01(0.10 + lit / 11);
        const layer = 6 + haze * 34;
        F.map((x, y, v) => {
          if (v > 0.4) return;
          const lip = layer + (F.n2(x * 0.07, 4.2) - 0.5) * 12;
          if (y > lip) return;
          const s = F.n2(x * 0.09 + u * 0.9, y * 0.11 - u * 1.4);
          if (s > 0.62) return;                        // holes in it: smoke is not a slab
          if (F.bayer(x, y) < 0.45 + clamp01((lip - y) / 12) * 0.55) return 2;
        });
        /* BOTH OF THEM REACHING FOR THE SAME OBJECT instead of for each other —
           the question is between them now, not the embrace. The hands rise
           over the movement rather than starting up: they ask it, and then
           they reach. The two gestures are mirrored by hand because `gesture`
           is a raw body-local point and does not know which way a body faces.
           At 29 the solver draws them solid, which is what lets a glass stand
           behind one and be cleanly hidden by it rather than showing through a
           level-4 fill at exactly the weight of its own sand. */
        const t = ss(0.15, 0.78, u);
        const gx = lerp(-2.3, 9.5, t), gyH = lerp(13.5, 26.5, t);   // scaled to h=29's own shoulder
        const carry = { headTilt: -0.05 + t * 0.20, weight: lerp(0.62, 0.40, smooth(u)) };
        brothers(F, lerp(70, 78, smooth(u)), 29,
          { ...carry, gesture: [gx, gyH], lean: 0.03 * t },
          { ...carry, gesture: [-gx, gyH], lean: -0.03 * t }, 7, 1.6, u);
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
