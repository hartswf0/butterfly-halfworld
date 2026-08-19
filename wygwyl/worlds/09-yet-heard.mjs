/* ============================================================================
   09 · YET, HEARD — a WYGWYL halfworld

   THREE CALLS, ONE GRAMMAR. Each of the first three movements is one line of
   the poem and one drawn LINE: a dashed, pulsing cord strung between two
   standing figures, because a call is a pulsed thing and an unbroken cord
   edge-to-edge is exactly the stripe the dot law warns about. The distance
   between the two figures is the plot — it stretches across each movement,
   years folded into seconds — and each time something different rides the
   cord: a shared moon, then tears that peel off into an abyss, then his
   footsteps, retraced. The fourth movement drops the device entirely: the
   calls are over, the walk is no longer imagined, and it is the one place
   in the film that earns the suite's single blue mark.

   ONLY FOUR MOVEMENTS, so each one is long and mostly stillness — this is
   the quietest film in the suite. Rejected outright: a room for each call
   (a kitchen, a car, a doorway). None of the three lines names a room, only
   a person on the other end, so no room is built; two figures and a cord
   are the whole set.
   ========================================================================= */
import { TAU, lerp, clamp01, smooth, ss, win } from "../halfworld.mjs";

/* THE CORD. Dashed, never solid — a call is pulses, not a wire — and its
   dash pattern is stepped by `flow` so the connection reads as live rather
   than printed on. `sag` bows it downward at the midpoint; it stays at 0 for
   the two calls that hold level and is only ever earned by the mother's
   line, where what she is carrying visibly pulls the cord out of true. */
function cord(F, x0, y0, x1, y1, l, flow, sag = 0) {
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
  const period = 7, on = 4, shift = Math.floor(flow * period * 5);
  for (let k = 0; k <= n; k++) {
    if (((k + shift) % period + period) % period >= on) continue;
    const t = k / n;
    const bow = Math.sin(t * Math.PI) * sag;
    F.ink(Math.round(lerp(x0, x1, t)), Math.round(lerp(y0, y1, t) + bow), l);
  }
}

/* a speaker: the pose is almost nothing, because the cord is the subject
   and a figure at rest does not compete with it. A short tick under each
   pair of feet, not a floor across the frame — a call happens in no
   particular room, so no room is built under it. */
function speaker(F, x, floor, h, face, arms, l) {
  F.fig(x, floor, h, { mode: "stand", face, arms }, l);
  F.line(x - h * 0.22, floor + 1, x + h * 0.22, floor + 1, Math.max(2, l - 3), 1);
}

/* M1's payload: one moon, shared, so it never settles on either side. It
   swings the length of the cord and back, twice across the movement, riding
   just above it like a bead threaded on the line rather than a thing either
   speaker owns outright. */
function sharedMoon(F, x0, y0, x1, y1, u, l) {
  const t = 0.5 + 0.5 * Math.sin(u * TAU * 2 - Math.PI / 2);
  const x = lerp(x0, x1, t), y = lerp(y0, y1, t) - 4;
  F.disc(x, y, 3.2, l - 2);
  F.ring(x, y, 3.6, l);
}

/* M2's payload, half of it. Never a filled black wedge: "an abyss she's
   never known" is spoken of, not seen whole, so it stays a fan of falling
   lines with paper still showing between them. It opens under the cord's
   own sag point, because that is where the two speakers' weight actually
   meets. */
function abyss(F, cx, topY, depth, l) {
  const n = 9;
  for (let k = 0; k < n; k++) {
    const a = (k / (n - 1) - 0.5) * 1.1;
    const len = depth * (0.5 + F.noise(k, 17) * 0.5);
    F.line(cx, topY, cx + Math.sin(a) * depth * 0.3, topY + len, l, 1);
  }
}

/* M2's payload, the other half: tears riding the cord from her side toward
   his, each on its own clock. Each one peels off partway across and falls
   straight down — a tear does not travel the whole distance a voice does —
   and the fall is capped short of the abyss floor, because the line never
   says it lands, only that it is spoken of. */
function tears(F, x0, y0, x1, y1, sag, u, l) {
  const R = F.rng(29);
  const peel = 0.55;
  for (let k = 0; k < 5; k++) {
    const speed = 0.45 + R() * 0.35, ph = R();
    const raw = (u * speed + ph) % 1;
    const t = 1 - raw;
    if (t > peel) {
      const bow = Math.sin(t * Math.PI) * sag;
      F.disc(lerp(x0, x1, t), lerp(y0, y1, t) + bow, 1.0, l);
    } else {
      const bx = lerp(x0, x1, peel), by = lerp(y0, y1, peel) + Math.sin(peel * Math.PI) * sag;
      const fall = clamp01((peel - t) / peel);
      F.disc(bx, by + fall * 20, 0.9, l);
    }
  }
}

/* the one footprint mark, drawn once here as the imagined trace of a call
   and again for real in M4 on the harbor ground — the same shape both
   times, because "retracing" only means something if the thing being
   retraced never changes shape between the imagining and the doing. */
function footMark(F, x, y, l) {
  F.line(x - 1.1, y - 0.3, x + 1.1, y + 0.3, l, 1.3);
  F.disc(x + 0.9, y + 0.7, 0.6, l);
}
/* M3's payload: his footsteps, counted down the cord from his end toward
   ours — retracing runs the opposite direction from a voice arriving. */
function cordFootsteps(F, x0, y0, x1, y1, adv, l) {
  const N = 8;
  const n = Math.floor(clamp01(adv) * N);
  const px = -(y1 - y0), py = (x1 - x0), pl = Math.hypot(px, py) || 1;
  for (let k = 0; k <= n && k < N; k++) {
    const t = 1 - k / (N - 1);
    const x = lerp(x0, x1, t), y = lerp(y0, y1, t);
    const off = (k % 2 ? 1 : -1) * 2.1;
    footMark(F, x + (px / pl) * off, y + (py / pl) * off, l);
  }
}

/* "his calming demeanor summoned from the yonders": he is not there at the
   start of the call, he arrives, dot by dot, on the ordered schedule — the
   one dissolve this world otherwise withholds, because a call itself has no
   fade, only a cord. His is the exception, and it is a person arriving, not
   a picture fading in. */
function summon(F, x, floor, h, arrive, l) {
  F.fig(x, floor, h, { mode: "stand", face: -1, arms: "down" }, l);
  F.map((xx, yy, v) => {
    if (xx < x - h * 0.4 || xx > x + h * 0.4 || yy < floor - h - 3 || yy > floor + 2) return;
    if (v > 0 && F.bayer(xx, yy) > arrive) return 0;
  });
}

/* the ground never claims a whole row: even level water is drawn as three
   broken runs, because ten unbroken rows and one unbroken row are the same
   stripe under the dot law. Used once as the harbor previewed in M3, and
   again as the harbor arrived at in M4. */
function waveShadows(F, y, l, phase) {
  for (const [a, b] of [[0, 54], [64, 128], [138, 192]]) {
    for (let x = a; x < b; x++) F.ink(x, Math.round(y + Math.sin(x * 0.09 + phase) * 1.1), l);
  }
}

/* the harbor trail keeps REAL spacing, unlike the cord's. Once he is
   actually walking, the elastic distance of a call is gone; a footprint
   that stretched with the frame the way the cord did would have made a
   joke of the one gesture in the film that is not imagined. */
function groundTrail(F, x0, y, x1, l) {
  const spacing = 8.5, dist = Math.max(0, x1 - x0), n = Math.floor(dist / spacing);
  for (let k = 0; k <= n; k++) {
    const x = x0 + k * spacing;
    footMark(F, x, y + (k % 2 ? 1 : -1) * 2.3, l);
  }
}
function dock(F, l) {
  F.line(14, 118, 14, 138, l, 1.4); F.line(24, 122, 24, 138, l, 1.4);
  F.line(10, 118, 30, 118, l, 1);
}
function boat(F, x, y, l) {
  F.arc(x, y, 8, 0.15, Math.PI - 0.15, l, 1.2);
  F.line(x - 2, y - 7, x - 2, y - 15, l, 1);
  F.line(x - 2, y - 15, x + 5, y - 7, l, 1);
}

export default {
  n: "09", slug: "09-yet-heard", title: "YET, HEARD",
  tagline: "three calls before leaving",
  accent: "#5aa7ff", seed: 909,
  /* the dip belongs to the mother's call, the deepest step in the film; the
     father's call starts the climb back and the walk ends above the root —
     the one place this world is allowed to sound like relief. */
  drone: { base: 52, steps: [0, -3, -5, -1, 5] },
  movements: [
    {
      label: "THE SHARED MOON", seconds: 17,
      line: "Before I go, we look at the moon the way we used to see it. We talk for years, travel through time — we grow old together, I believe. Maybe we could have it all.",
      cues: [
        { at: 0.25, f: 640, decay: 0.7, gain: 0.32, partials: [1, 2.0, 3.0], noise: 0.12, nDecay: 0.05, seed: 911 },
        { at: 0.75, f: 640, decay: 0.7, gain: 0.28, partials: [1, 2.0, 3.0], noise: 0.12, nDecay: 0.05, seed: 912 },
      ],
      draw(u, F) {
        const t = smooth(u);
        const xL = lerp(76, 34, t), xR = lerp(116, 160, t);
        const floor = 122, h = 44, ay = floor - h * 0.62;
        speaker(F, xL, floor, h, 1, "down", 7);
        speaker(F, xR, floor, h, -1, "down", 7);
        cord(F, xL, ay, xR, ay, 5, u * 1.6);
        sharedMoon(F, xL, ay, xR, ay, u, 6);
      },
    },
    {
      label: "TEARS, AN ABYSS", seconds: 18,
      line: "Before I go, I call on my mother — in tears, speaking of an abyss she's never known. We talk for years, re-closet wounds, and re-explain my way of birth. Even after prayer: what isn't mine, I still can not give.",
      cues: [
        { at: 0.32, f: 190, decay: 0.6, gain: 0.4, partials: [1, 1.5, 2.3], noise: 0.5, nDecay: 0.15, seed: 921 },
        { at: 0.72, f: 165, decay: 0.7, gain: 0.35, partials: [1, 1.5, 2.3], noise: 0.5, nDecay: 0.18, seed: 922 },
      ],
      draw(u, F) {
        const t = smooth(u);
        const xL = lerp(80, 48, t), xR = lerp(112, 146, t);
        const floor = 122, h = 44, ay = floor - h * 0.62;
        const sag = lerp(2, 21, t);
        speaker(F, xL, floor, h, 1, "down", 7);
        speaker(F, xR, floor, h, -1, "open", 7);
        cord(F, xL, ay, xR, ay, 5, u * 1.1, sag);
        /* the abyss is capped short of the frame's own floor: a depth that
           ran off the bottom edge read as a cropping bug rather than
           something merely unseen, so the cap keeps its tip inside paper */
        abyss(F, (xL + xR) / 2, ay + sag, lerp(7, 23, t), 6);
        tears(F, xL, ay, xR, ay, sag, u, 6);
      },
    },
    {
      label: "HIS FOOTSTEPS, RETRACED", seconds: 18,
      line: "Before I go, I call on my father — his calming demeanor summoned from the yonders. We walk for years, east toward the sunrises, retracing his footsteps — my tears falling in the wave shadows of the inner harbor.",
      cues: [
        { at: 0.10, f: 140, decay: 0.15, gain: 0.4, partials: [1, 1.4, 2.1], noise: 0.6, nDecay: 0.05, seed: 931 },
        { at: 0.42, f: 140, decay: 0.15, gain: 0.35, partials: [1, 1.4, 2.1], noise: 0.6, nDecay: 0.05, seed: 932 },
      ],
      draw(u, F) {
        const t = smooth(u);
        /* asymmetric on purpose: his side is pulled further than ours, so
           the stretch itself leans east before the walk ever says so */
        const xL = lerp(84, 52, t), xR = lerp(108, 168, t);
        const floor = 122, h = 44, ay = floor - h * 0.62;
        speaker(F, xL, floor, h, 1, "down", 7);
        summon(F, xR, floor, h, ss(0, 0.30, u), 7);
        cord(F, xL, ay, xR, ay, 5, u * 2.0);
        cordFootsteps(F, xL, ay, xR, ay, u * 1.15, 6);
        waveShadows(F, 136, 3, u * 0.6);
        waveShadows(F, 140, 2, u * 0.6 + 2);
        /* the wave shadows of the inner harbor, previewed here at the
           bottom edge — small, background, so M4 arrives at a place the
           eye has already half-seen rather than a place cut to cold */
        const R = F.rng(37);
        for (let k = 0; k < 3; k++) {
          const ph = R(), speed = 0.5 + R() * 0.3;
          const drop = (u * speed + ph) % 1;
          F.disc(xL - 6 + k * 5, 128 + drop * 10, 0.9, 5);
        }
      },
    },
    {
      label: "EAST, AT THE HARBOR", seconds: 16,
      line: "We stroll, father and son, hearted and shaken. Someone borrowed, and someone blue — yet, broken. Yet, heard.",
      /* the only shake in the film, and it is brief and small — "shaken" is
         one word in a quiet line, not a cue to make the last movement loud */
      fx: { shake: (u) => win(u, 0.30, 0.38, 0.50, 0.58) * 1.3 },
      cues: [
        { at: 0.12, f: 130, decay: 0.15, gain: 0.32, partials: [1, 1.3, 1.9], noise: 0.5, nDecay: 0.04, seed: 941 },
        { at: 0.46, f: 90, decay: 0.4, gain: 0.35, partials: [1, 1.6, 2.2], noise: 0.6, nDecay: 0.15, seed: 942 },
        { at: 0.93, f: 520, decay: 1.1, gain: 0.4, partials: [1, 2.0, 3.0], noise: 0.08, nDecay: 0.03, seed: 943 },
      ],
      draw(u, F) {
        const t = smooth(u);
        const cx = lerp(46, 150, t);
        const floor = 130, hf = 42, hs = 40;
        dock(F, 6);
        boat(F, 172, 122, 5);
        waveShadows(F, 134, 3, u * 0.5);
        waveShadows(F, 139, 2, u * 0.5 + 3);
        groundTrail(F, 46, floor + 2, cx, 6);
        const xf = cx - 9, xs = cx + 9;
        /* a walk cycle's stride crosses through zero separation twice a
           lap — the instant both feet sit under the hip — and at this
           resolution anything short of a wide stance reads as one leg, not
           two. Picked so neither figure is ever near that crossing at the
           moments the eye actually lands on the frame. */
        F.fig(xf, floor, hf, { mode: "walk", phase: u * 6.5, face: 1 }, 7);
        F.fig(xs, floor, hs, { mode: "walk", phase: u * 6.5 + 0.49, face: 1 }, 7);
        /* SOMEONE BLUE: the suite's one accent mark, one occurrence, held
           back until the last fifth of the last movement — everywhere else
           in this world "blue" is only the tagline's color name. Kept clear
           of the engine's own 1.5s crossfade back into the title card
           (u > ~0.906 at this length): a mark that only ever appeared
           already dissolving would never have been seen whole. */
        if (u > 0.80) F.disc(xs, floor - hs * 0.62, 1.3, 8);
      },
    },
  ],
};
