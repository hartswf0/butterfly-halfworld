/* ============================================================================
   07 · DJ TURN ME UP — a WYGWYL halfworld

   THE GRAMMAR: AMPLITUDE. One envelope, seven rungs — starved in M1, turnt up
   in M7 — drives two things and only two: the level meter's own bars, and a
   single scale factor applied to the mic, the figure, and each movement's
   central object, anchored at the stage floor so the performer grows UP out
   of a floor that never moves. Everything else a line asks for (the daisy,
   the diverging rings, the three roads) is staged honestly around that same
   number. Level 8 is spent exactly once, on the silver lining in M6, per the
   director's note — nowhere else in this file reads or writes it.

   THE FIRST TWO MOVEMENTS ARE MASSES, NOT OUTLINES. M1's arch is a hole cut
   in a filled wall that closes and deepens on him course by course, and M2's
   vineyard is a filled field the light goes out of from the far end inward.
   Both were line drawings on bare paper and both read as diagrams of a
   scene rather than as the scene: at this size a tone is the only way to
   have somewhere for a body to be.
   ========================================================================= */
import { TAU, lerp, clamp01, smooth, ss, win } from "../halfworld.mjs";

/* the seven rungs of the climb. Fixed per movement rather than derived from
   u, because u resets to 0 every movement and the poem's amplitude does not
   reset — it is one climb across the whole film, not seven separate ones.
   Rejected: deriving amp from the running suite clock, which would have
   broken the pure-function-of-u law the instant the film looped. */
const AMP = [0.05, 0.15, 0.28, 0.42, 0.55, 0.70, 0.95];
const scaleOf = (amp) => lerp(0.62, 1.32, amp);

/* M1's three landings, named once. The cues fire on these values, the
   courses of brick finish falling on them, and the settle in the body is
   read off them — one array, so the sound and the weight arriving cannot
   drift apart. M7 already carries the scar of that mistake in its own
   comment: its icons used to arrive a tenth before their strike. */
const NEST = [0.16, 0.50, 0.82];

/* the meter: nine bars, gapped, never full-width. Height and ink both track
   amplitude; the per-bar jitter comes from n2 so a "quiet" reading is a
   trembling near-zero rather than a dead flat line. It is drawn UNSCALED —
   the one thing in the film that has to stay a fixed measuring stick while
   everything else grows around it. */
function meter(F, u, amp) {
  const N = 9, x0 = 22, gap = 3, bw = 14, y1 = 141;
  for (let k = 0; k < N; k++) {
    const jit = (F.n2(k * 2.3, u * 5.2 + k * 0.7) - 0.5) * (0.30 + amp * 0.35);
    const lvl = clamp01(amp + jit);
    /* capped short of full height on purpose — the tallest reading still
       sits under every stage floor this film uses, so the meter never
       reaches up into the scene it is measuring */
    const h = 2 + lvl * 15;
    const x = x0 + k * (bw + gap);
    F.rect(x, y1 - h, bw, h, Math.max(1, Math.round(lvl * 7)));
  }
}

/* a coordinate rig: everything drawn through G grows from (cx,cy) by
   `scale`. cy is always the floor, so feet never lift — only the body above
   them grows. Rejected: routing the meter through this too, which made the
   meter read as part of the scene instead of the instrument reading it. */
function rig(F, scale, cx, cy) {
  const X = (x) => cx + (x - cx) * scale, Y = (y) => cy + (y - cy) * scale;
  return {
    line: (x0, y0, x1, y1, l, th = 1) => F.line(X(x0), Y(y0), X(x1), Y(y1), l, Math.max(1, th * scale)),
    disc: (px, py, r, l, set) => F.disc(X(px), Y(py), Math.max(0.6, r * scale), l, set),
    ring: (px, py, r, l, th = 1) => F.ring(X(px), Y(py), Math.max(0.8, r * scale), l, Math.max(1, th * scale)),
    arc: (px, py, r, a0, a1, l, th = 1) => F.arc(X(px), Y(py), Math.max(0.8, r * scale), a0, a1, l, Math.max(1, th * scale)),
    rect: (x, y, w, h, l) => F.rect(X(x), Y(y), w * scale, h * scale, l),
    fig: (px, py, h, pose, l) => F.fig(X(px), Y(py), h * scale, pose, l),
  };
}

/* the stage floor, always three runs — an unbroken edge-to-edge bar stripes
   the frame under the halftone, and this floor is under every movement that
   uses it, so it earns its own function rather than a copy-pasted triple. */
function floorRuns(F, y, l = 6) {
  F.line(0, y, 66, y, l, 1); F.line(74, y, 128, y, l, 1); F.line(136, y, 192, y, l, 1);
}
/* the arch: "chin nested at the ARCH of the weight" names it, so it is not
   scenery, it is the noun. Drawn through G, it grows with the same number
   the figure does — a small room for a small voice, a wide one turnt up. */
function archStage(G, cx, floorY, w, h, l) {
  G.line(cx - w / 2, floorY, cx - w / 2, floorY - h, l, 1.4);
  G.line(cx + w / 2, floorY, cx + w / 2, floorY - h, l, 1.4);
  G.arc(cx, floorY - h, w / 2, Math.PI, TAU, l, 1.6);
}
/* THE SAME ARCH, CUT OUT OF A WALL INSTEAD OF DRAWN AS ONE. In M1 the arch
   IS the weight, so it cannot be three thin strokes on bare paper — it has
   to have mass behind it. The room is laid down as a filled tone and the
   opening is where the mass is not, which reads as a lit wall where the
   outline read as a schematic, and it puts the man inside something.
   `tone` is fractional: the level between two rungs is dithered on the Bayer
   schedule, so the wall can deepen a fifth of a level at a time without any
   cell ever being two levels at once. */
function archWall(F, cx, floorY, half, hgt, tone) {
  const crown = floorY - hgt, spring = crown + half;
  const lo = Math.floor(tone), fr = tone - lo;
  for (let y = 0; y < floorY; y++) {
    let hw = 0;
    if (y >= spring) hw = half;
    else if (y >= crown) hw = Math.sqrt(Math.max(0, half * half - (spring - y) ** 2));
    const xL = cx - hw, xR = cx + hw;
    for (let x = 0; x < F.W; x++) {
      if (hw > 0 && x > xL && x < xR) continue;
      F.put(x, y, F.bayer(x, y) < fr ? lo + 1 : lo);
    }
  }
  /* the opening's own edge, so it reads as built and not merely absent */
  F.line(cx - half, floorY, cx - half, spring, 6, 1.4);
  F.line(cx + half, floorY, cx + half, spring, 6, 1.4);
  F.arc(cx, spring, half, Math.PI, TAU, 6, 1.6);
}
function micStand(G, x, floorY, h, l) {
  G.line(x, floorY, x, floorY - h, l, 1.3);
  G.line(x - 6, floorY, x + 6, floorY, l, 1.6);
  G.ring(x, floorY - h - 3, 2.6, l, 1.3);
  G.disc(x, floorY - h - 3, 1.1, l);
}
/* the weight of these spoken words, staged literally: three courses of
   brick that come DOWN out of the top of the frame, one at a time, and
   stack on his head. Rejected: individual letterforms, illegible at this
   scale and beside the point — the line names a WEIGHT, not a text.
   Rejected also: the first pass's three bricks that simply existed above
   him for the whole movement, which is a hat. A weight that was always
   there never lands, and a load that never lands cannot press.

   Each course arrives ON its cue (the fall ends exactly at `gate`), and the
   widest and heaviest is the one that gets there first and takes his head.
   `s` is the movement's amplitude scale, so the load is starved with the
   voice it is sitting on. */
function wordWeight(F, cx, restY, u, gates, s) {
  for (let k = 0; k < gates.length; k++) {
    const p = ss(gates[k] - 0.13, gates[k], u);
    if (p <= 0.001) continue;
    const w = (19 - k * 4) * s, h = 5 * s, gap = 1.8 * s;
    const y = lerp(-16, restY - h - k * (h + gap), p);
    F.rect(cx - w / 2, y, w, h, 4);
    F.box(cx - w / 2, y, w, h, 6, 1);
  }
}
/* a tapered stroke — the sole shape this film needs twice, once as a petal,
   once (in M7) as a single tear. Zero width at both ends, fattest at the
   middle: a lens laid along one axis. */
function petal(F, cx, cy, ang, len, wid, l) {
  const c = Math.cos(ang), s = Math.sin(ang);
  const n = Math.max(4, Math.round(len));
  for (let k = 0; k <= n; k++) {
    const t = k / n, r = wid * Math.sin(t * Math.PI) * 0.5;
    F.disc(cx + c * len * t, cy + s * len * t, Math.max(0.6, r), l);
  }
}

/* eleven years, eleven petals — the loop below runs exactly eleven times
   and nothing adds or removes an iteration, so the count is checkable by
   reading the loop bound, not by counting pixels. Each petal is on the
   flower or on the ground, never both, never neither. */
const PETAL_N = 11;
function daisy(F, G, cx, cy, R, u) {
  G.disc(cx, cy, 3, 6);
  for (let k = 0; k < PETAL_N; k++) {
    const ang = (k / PETAL_N) * TAU - Math.PI / 2;
    const c = Math.cos(ang), s = Math.sin(ang);
    const pluckAt = (k + 1) / (PETAL_N + 1);
    if (u < pluckAt) {
      for (let t = 0; t <= 6; t++) {
        const tt = t / 6, len = R * (0.5 + tt * 0.62);
        const w = Math.max(0.6, 2.1 * Math.sin(tt * Math.PI));
        G.disc(cx + c * len, cy + s * len, w, 5);
      }
    } else {
      /* plucked: drifts off, alternating sides — "we love" one way, "we
         not" the other, so the refrain is a direction, not a caption */
      const since = u - pluckAt, side = k % 2 === 0 ? 1 : -1;
      const dx = cx + side * (10 + since * 60) + c * R * 0.3;
      const dy = cy + R * 1.7 + since * 34;
      if (dy < 143) F.disc(dx, dy, 1.6, 4);
    }
  }
}

/* one road, drawn small enough that three of them fit with real gaps
   between — converging edges plus a dashed centre, never a solid span. */
function roadPanel(F, x0, x1, floorY, vy, l = 5) {
  const cx = (x0 + x1) / 2;
  F.line(x0 + 3, floorY, cx, vy, l, 1.2);
  F.line(x1 - 3, floorY, cx, vy, l, 1.2);
  F.line(x0, floorY, x1, floorY, l, 1);
  for (let k = 0; k < 4; k++) {
    const t = (k + 0.5) / 4, y = lerp(floorY, vy, t);
    F.line(cx - 1, y, cx + 1, y, l, 1);
  }
}

export default {
  n: "07", slug: "07-dj-turn-me-up", title: "DJ TURN ME UP",
  tagline: "amplitude, and eleven petals",
  accent: "#5aa7ff", seed: 707,
  /* THE FILM'S OWN PASSAGE of the suite's 24-minute score, taken from the
     original running order. The runtime stretches this film's movements to
     fill it, so picture and record line up without either being cut. */
  window: [623.454, 732.134],
  /* KEY: G Dorian, bright — envelope starved to turnt up needs headroom, so
     the drone sits on the fifth and the steps climb a full octave across
     the seven movements, ending exactly where "chin high" would put it. */
  drone: { base: 98.00, steps: [0, -12, -5, 0, 3, 7, 9, 12], bright: true },
  movements: [
    {
      label: "CHIN NESTED", seconds: 13,
      line: "DJ, turn me up, please. Eyes wide shut, chin nested at the arch of the weight of these spoken words.",
      /* the three courses landing, and nothing else. Every one of them is a
         dull, short, inharmonic body — a brick is not a bell — and they
         descend in pitch as the load gets heavier. */
      cues: [
        { at: NEST[0], f: 190, decay: 0.26, gain: 0.30, partials: [1, 1.63, 2.31], noise: 0.6, nDecay: 0.05, seed: 701 },
        { at: NEST[1], f: 132, decay: 0.30, gain: 0.33, partials: [1, 1.58, 2.24], noise: 0.6, nDecay: 0.07, seed: 702 },
        { at: NEST[2], f: 88, decay: 0.38, gain: 0.36, partials: [1, 1.52, 2.18], noise: 0.6, nDecay: 0.10, seed: 703 },
      ],
      draw(u, F) {
        const amp = clamp01(AMP[0] + (F.n2(1.7, u * 3) - 0.5) * 0.03);
        const scale = scaleOf(AMP[0]), FLOOR = 124, cx = 96, h = 40;
        /* PRESS IS THE WHOLE MOVEMENT. One number, never decreasing: a slow
           continuous settle plus three abrupt ones at the courses' own
           landings, so the room is always closing AND articulates exactly
           three times. It drives the opening's width and height, the wall's
           tone, and the man's crouch and chin together — the arch coming
           down on him and his head going down under it are one event, which
           is what "chin nested at the arch of the weight" says.
           Rejected: a pure staircase, which held thirteen still seconds
           between three jumps and made a slideshow of a settling. */
        const beats = (ss(NEST[0] - 0.12, NEST[0], u) + ss(NEST[1] - 0.12, NEST[1], u)
                     + ss(NEST[2] - 0.12, NEST[2], u)) / 3;
        const press = clamp01(0.45 * u + 0.55 * beats);
        archWall(F, cx, FLOOR, lerp(58, 24, press), lerp(100, 41, press), 1 + press * 2.2);
        floorRuns(F, FLOOR);
        const G = rig(F, scale, cx, FLOOR);
        micStand(G, cx - 16, FLOOR, 34, 6);
        /* each landing is felt: a settle in the crouch on the same `at` the
           sound strikes, so a course looks like it has just come to rest on
           him rather than like a thing that was always there */
        let land = 0;
        for (const g of NEST) land = Math.max(land, Math.exp(-(((u - g) / 0.045) ** 2)));
        /* nested, bowed: a small forward rot carries the head down toward
           the mic rather than the whole torso folding, which read as
           sitting when the first pass tried it */
        G.fig(cx, FLOOR, h, {
          mode: "stand", arms: "down", rot: 0.16 + press * 0.06, lean: 0.05, guise: "poet",
          phase: u * 1.7, weight: 0.35, headTilt: -0.20 - press * 0.22,
          crouch: 0.04 + press * 0.16 + land * 0.09,
        }, 7);
        wordWeight(F, cx + 2, FLOOR - h * scale - 1.4 + press * 1.6, u, NEST, scale);
        meter(F, u, amp);
      },
    },
    {
      label: "VINEYARD GHOSTS", seconds: 13,
      line: "I have a love story to tell — of ghosts, whispering unfolded dilutions, birthed in purity, and dying in the vineyards of sun-soaked evergreen fields, unnourished.",
      /* a birth and two dyings: the first strike is the pair arriving whole
         and near, the other two are each ghost reaching the far end of the
         rows and not coming back. Their `at` values are the same numbers
         the walks are solved from. */
      cues: [
        { at: 0.08, f: 220, decay: 0.5, gain: 0.28, partials: [1, 1.8, 2.6], noise: 0.85, nDecay: 0.30, seed: 711 },
        { at: 0.64, f: 88, decay: 0.6, gain: 0.28, partials: [1, 1.5, 2.1], noise: 0.5, nDecay: 0.22, seed: 712 },
        { at: 0.94, f: 66, decay: 0.7, gain: 0.30, partials: [1, 1.5, 2.1], noise: 0.4, nDecay: 0.20, seed: 713 },
      ],
      draw(u, F) {
        const amp = clamp01(AMP[1] + (F.n2(4.4, u * 3.4) - 0.5) * 0.03);
        /* the vanishing point is off centre on purpose: with it at 96 the
           middle row of eleven runs dead vertical up the middle of the
           frame, which is correct perspective and looks like a dropped
           wire. */
        const HOR = 46, FLOOR = 118, vx = 112;
        /* UNNOURISHED IS THE SUN GOING OFF THE FIELD, and it goes off the far
           end first. One boundary, lumpy per column and dithered on the
           ordered schedule, walks up the field from the horizon to our feet
           across the movement and takes every row it passes with it: a vine
           drawn at level 2 simply stops existing once the ground it stands
           on is at 3, because ink only ever darkens. So the vineyard is not
           annotated as dying, it dies.
           Rejected: diluting the field toward paper instead of toward shade.
           "Dilution" is the poem's word for what happens to the ghosts, and
           it happens to them; a field losing its light is what leaves them
           unnourished. */
        /* a plain ramp, not a smoothstep: an eased front loiters at both
           ends and this one has to cross the whole field steadily, the
           way the light actually goes */
        const shade = clamp01(u * 1.04);
        const wob = [], top = [];
        for (let x = 0; x < F.W; x++) {
          wob.push((F.n2(x * 0.07, 5.5) - 0.5) * 0.22);
          top.push(HOR + (F.n2(x * 0.09, 2.2) - 0.5) * 7);      // an evergreen treeline, never a ruled horizon
        }
        /* THE SUN ITSELF, going down behind the treeline — the shade above
           is its own shadow reaching toward us, so the field is unnourished
           BY something rather than merely getting darker. Drawn before the
           ground, so the ground takes it as it sinks. */
        F.disc(146, lerp(12, HOR + 7, shade), 6.5, 6);
        const ground = (x, y) => {
          const far = Math.min(0.985, (FLOOR - y) / (FLOOR - HOR));
          const s = (far - (1 - shade) + wob[x]) * 3.4;
          /* the ground's own tone is PLANTED: solving each cell back to the
             row line it stands on makes the field darker along the rows and
             barer between them, so the mass agrees with the drawing on top
             of it. Rejected: a plain noise mottle, which at this density
             reads as static rather than as a crop. */
          const row = (x - vx * far) / (1 - far);
          const f = Math.abs((((row + 8) / 20.8) % 1 + 1) % 1 - 0.5) * 2;
          const base = f < 0.40 + (F.noise(x >> 1, y >> 1) - 0.5) * 0.34 ? 2 : 1;
          if (s <= 0 || F.bayer(x, y) >= s) return base;
          /* and it keeps going down. The front is where the light leaves,
             but the far end left it first and has been leaving ever since,
             so shade deepens with how long a cell has been in it — one more
             rung, on a second dot schedule offset from the first so the two
             thresholds cannot land on the same cells and band. */
          const more = clamp01((s - 1.2) * 0.55);
          return base + 2 + (F.bayer(x + 3, y + 5) < more ? 1 : 0);
        };
        for (let x = 0; x < F.W; x++)
          for (let y = Math.round(top[x]); y < FLOOR; y++) F.put(x, y, ground(x, y));
        /* THE ROWS ARE VINES, NOT WIRES: each one is ten separate lengths
           with air between them, and its ink falls with distance, so the
           recession is told by the drawing and not by a left-to-right
           gradient. The first pass tied the decay to the row's INDEX, which
           made the field darker on the left and paler on the right — a
           lighting effect, in a movement about distance. */
        for (let r = 0; r < 11; r++) {
          const x0 = -8 + (r / 10) * 208;
          for (let k = 0; k < 10; k++) {
            const p0 = (k / 10) * 0.94, p1 = ((k + 0.72) / 10) * 0.94, near = 1 - p0;
            const l = near > 0.6 ? 5 : near > 0.3 ? 3 : 2;
            F.line(lerp(x0, vx, p0), lerp(FLOOR, HOR, p0), lerp(x0, vx, p1), lerp(FLOOR, HOR, p1), l, 1);
            if (near > 0.45 && k % 3 === 1) {                    // stakes, only where they can still be seen
              const px = lerp(x0, vx, p0), py = lerp(FLOOR, HOR, p0);
              F.line(px, py, px, py - 3 * near, 5, 1);
            }
          }
        }
        floorRuns(F, FLOOR, 5);
        /* BIRTHED IN PURITY, DYING IN THE VINEYARDS. The love story's two
           ghosts walk away from us down the rows, from whole and near to
           small and gone at the vanishing point — the poet's own silhouette
           and the turned back the suite already knows him by, because the
           line says a love story and a love story has two people in it.
           They do not breathe: the one free mark the pose vocabulary gives
           a dead thing, spent here exactly as 02 spends it. */
        for (const [gx0, off, guise, face] of [[52, 0.30, "poet", 1], [140, 0.0, "turned", -1]]) {
          const p = (u + off) * 1.06;
          if (p >= 1) continue;
          const q = smooth(clamp01(p));
          F.fig(lerp(gx0, vx, q), lerp(FLOOR, HOR + 3, q), lerp(36, 6, q), {
            mode: "walk", phase: u * 5.35 + off * 4, face, guise, breath: 0, headTilt: -0.15,
          }, 7);
        }
        /* WHISPERING UNFOLDED DILUTIONS. A ghost is never at full ink: its
           cells are kept or given back to the field on the ordered schedule,
           and the fraction kept falls with the same distance the vines fade
           over — so walking away IS diluting, one mechanism and not two. The
           dissolved cells return the exact ground they are standing in
           rather than paper, which is what dilution means: not a hole, the
           same field with less of them in it. */
        F.map((x, y, v) => {
          if (v !== 7 && v !== 4) return;
          const far = clamp01((FLOOR - y) / (FLOOR - HOR));
          const keep = lerp(0.92, 0.22, far) * (0.86 + 0.14 * Math.sin(u * TAU * 2.2 + x * 0.05));
          if (F.bayer(x, y) < keep) return;
          return y < top[x] ? 0 : ground(x, y);
        });
        meter(F, u, amp);
      },
    },
    {
      label: "THOUSAND LIGHT YEARS", seconds: 14,
      line: "One by one, treasures escaping — devaluing themselves after unsullied stars diminished their glares. I walked a thousand light years to be heard. So DJ — please — turn me up.",
      fx: { smear: { taps: 1, spread: 0.018, fall: 2.2 } },
      cues: [
        { at: 0.10, f: 1200, decay: 0.10, gain: 0.30, partials: [1, 2.4, 3.7], noise: 0.7, nDecay: 0.02, seed: 721 },
        { at: 0.90, f: 340, decay: 0.20, gain: 0.35, partials: [1, 2.1], noise: 0.4, nDecay: 0.03, seed: 722 },
      ],
      draw(u, F) {
        const amp = clamp01(AMP[2] + (F.n2(2.1, u * 4) - 0.5) * 0.03);
        const scale = scaleOf(AMP[2]), FLOOR = 122;
        floorRuns(F, FLOOR, 3);
        /* treasures escaping one by one: each star has its own scheduled
           exit, spread evenly across the whole movement so the loss reads
           as a sequence and not a single flicker */
        const N = 14, R = F.rng(73), stars = [];
        for (let k = 0; k < N; k++) stars.push([R() * 188 + 2, R() * 78 + 6, R()]);
        const glare = lerp(5, 2, u);   // unsullied stars diminished their glares
        for (let k = 0; k < N; k++) {
          const [sx, sy, r0] = stars[k], te = (k + 1) / (N + 1);
          const life = u < te ? 1 : clamp01(1 - (u - te) / 0.10);
          if (life <= 0) continue;
          F.disc(sx, sy, Math.max(0.6, (0.9 + r0 * 1.1) * life), Math.round(glare));
        }
        /* a thousand light years is told as distance, not as a body — a
           trail of fading footprints carries it better than the figure */
        const wx = lerp(16, 176, smooth(u));
        for (let k = 0; k < 14; k++) {
          const fx = wx - k * 5.2;
          if (fx < 4) break;
          F.ink(fx, FLOOR - 1 + (k % 2 ? 1 : 0), Math.max(1, 5 - k * 0.32));
        }
        const G = rig(F, scale, 96, FLOOR);
        G.fig(wx, FLOOR, 30, { mode: "walk", phase: u * 6.35, face: 1, guise: "poet", headTilt: -0.2 }, 7);
        meter(F, u, amp);
      },
    },
    {
      label: "DIVERGING RINGS", seconds: 14,
      line: "So I can speak: of wedding bands diverging across abstract skies of wounded souls. Of a shared home, boxed and trucked on separate one-way streets — not built with U-turns, or stop, maybe-we-shouldn't signs.",
      cues: [
        { at: 0.05, f: 660, decay: 0.30, gain: 0.30, partials: [1, 2.0, 3.0], noise: 0.2, nDecay: 0.04, seed: 731 },
        { at: 0.55, f: 520, decay: 0.30, gain: 0.28, partials: [1, 2.0, 3.0], noise: 0.2, nDecay: 0.04, seed: 732 },
      ],
      draw(u, F) {
        const amp = clamp01(AMP[3] + (F.n2(5.5, u * 3) - 0.5) * 0.03), cy = 30;
        /* wounded souls: thin scratches scattered in the sky, never
           gathering into a figure — kept as texture so the rings stay the
           only thing in the sky the eye is asked to follow */
        const R = F.rng(74);
        for (let k = 0; k < 18; k++) {
          const sx = R() * 188 + 2, sy = 6 + R() * 34;
          F.line(sx - 1.4, sy, sx + 1.4, sy, 2, 1);
          F.line(sx, sy - 1.4, sx, sy + 1.4, 2, 1);
        }
        /* THE RINGS WILL NOT RE-CONVERGE. d(u) is built from `smooth`,
           therefore strictly non-decreasing across the movement — there is
           no term anywhere in it that could pull the two rings back
           together, which is the whole claim the line makes. */
        const d = lerp(5, 78, smooth(u));
        const G = rig(F, scaleOf(AMP[3]), 96, cy);
        G.ring(96 - d / 2, cy, 7, 6, 1.5);
        G.ring(96 + d / 2, cy, 7, 6, 1.5);
        /* the shared home: two straight one-way streets — rejected outright
           any curve in them, a U-turn is exactly what the line disowns —
           each carrying a boxed truck further from the other, below the
           same divergence the rings are making above */
        const FLOOR = 132;
        floorRuns(F, FLOOR, 5);
        for (const s of [-1, 1]) {
          const rx = 96 + s * 4, ry = FLOOR, ex = 96 + s * 86, ey = 70;
          F.line(rx, ry, ex, ey, 4, 1.4);
          /* one-way chevrons, not stop signs — a stop sign is an octagon
             and this street was never built with the option to stop */
          const ang = Math.atan2(ey - ry, ex - rx);
          for (let k = 1; k < 5; k++) {
            const t = k / 5, ax = lerp(rx, ex, t), ay = lerp(ry, ey, t);
            F.line(ax, ay, ax - Math.cos(ang) * 3 + Math.sin(ang) * 2, ay - Math.sin(ang) * 3 - Math.cos(ang) * 2, 5, 1);
            F.line(ax, ay, ax - Math.cos(ang) * 3 - Math.sin(ang) * 2, ay - Math.sin(ang) * 3 + Math.cos(ang) * 2, 5, 1);
          }
          const p = smooth(u), tx = lerp(rx, ex, 0.15 + p * 0.75), ty = lerp(ry, ey, 0.15 + p * 0.75);
          F.rect(tx - 5, ty - 4, 10, 6, 6);
          F.disc(tx - 3, ty + 2, 1.3, 7); F.disc(tx + 3, ty + 2, 1.3, 7);
        }
        meter(F, u, amp);
      },
    },
    {
      label: "ELEVEN PETALS", seconds: 14,
      line: "A love story of years — eleven years — each plunkled off as daisy petals. We love, we not. Of a future gone swiftly, and a past left empty-handed.",
      cues: [
        { at: 0.08, f: 480, decay: 0.10, gain: 0.30, partials: [1, 2.3], noise: 0.6, nDecay: 0.02, seed: 741 },
        { at: 0.92, f: 140, decay: 0.30, gain: 0.28, partials: [1, 1.7], noise: 0.5, nDecay: 0.06, seed: 742 },
      ],
      draw(u, F) {
        const amp = clamp01(AMP[4] + (F.n2(6.6, u * 3) - 0.5) * 0.03);
        const scale = scaleOf(AMP[4]), cx = 96, cy = 68;
        floorRuns(F, 106, 3);
        const G = rig(F, scale, cx, cy);
        G.line(cx, cy + 6, cx, cy + 38, 4, 1.6);
        daisy(F, G, cx, cy, 22, u);
        /* a future gone swiftly, a past left empty-handed: the hand that
           did the plucking, open and holding nothing, once all eleven are
           down — it arrives only after the loop above has emptied */
        if (u > PETAL_N / (PETAL_N + 1)) {
          F.rect(cx - 6, 104, 12, 5, 4);
          for (let f = 0; f < 4; f++) F.line(cx - 4 + f * 2.6, 104, cx - 4 + f * 2.6, 100, 4, 1);
        }
        meter(F, u, amp);
      },
    },
    {
      label: "THREE ROADS", seconds: 13,
      line: "To pick a road: of heavy rain. Or of frontal fog. Or of dimmed night lights under a cloud — with a silver lining.",
      cues: [
        { at: 0.08, f: 60, decay: 0.6, gain: 0.35, partials: [1, 1.4, 2.0], noise: 0.9, nDecay: 0.5, seed: 751 },
        { at: 0.42, f: 180, decay: 0.4, gain: 0.20, partials: [1, 1.6], noise: 0.85, nDecay: 0.35, seed: 752 },
        { at: 0.80, f: 760, decay: 0.5, gain: 0.30, partials: [1, 2.5, 4.0], noise: 0.15, nDecay: 0.05, seed: 753 },
      ],
      draw(u, F) {
        const amp = clamp01(AMP[5] + (F.n2(7.7, u * 3) - 0.5) * 0.03);
        const floorY = 136, vy = 40;
        /* three separate panels, three separate stakes in the choice. One
           shared rig anchored at frame-centre would have pulled the fog
           sideways into the rain panel's gap, so each panel picks its own
           subject to carry the amplitude scale instead of sharing one
           transform: only the rain gets bigger, because the fog and the
           dimness are already their own measure of amplitude and scaling
           them too would have doubled the same idea on top of itself. */
        roadPanel(F, 6, 60, floorY, vy);
        const Ga = rig(F, scaleOf(AMP[5]), 33, floorY);
        const R1 = F.rng(76);
        for (let k = 0; k < 26; k++) {
          const rx0 = 8 + R1() * 44, ry0 = (R1() * 100 + u * 260) % 100;
          Ga.line(rx0, ry0, rx0 - 3, ry0 + 9, 5, 1);
        }

        roadPanel(F, 68, 124, floorY, vy);
        /* frontal fog: the front itself arrives across the movement, a
           lumpy fbm boundary sweeping in rather than a curtain dropping */
        const front = smooth(u);
        F.map((x, y) => {
          if (x < 66 || x > 126) return;
          const c = F.n2(x * 0.14, y * 0.16 + u * 1.4);
          const d = front * 1.5 - 0.25 + (c - 0.5) * 0.7;
          if (F.bayer(x, y) < d) return 4;
        });

        roadPanel(F, 132, 186, floorY, vy);
        F.rect(132, 12, 54, 60, 1);
        for (const [wx, wy] of [[140, 100], [150, 108], [170, 98], [178, 106]]) F.disc(wx, wy, 1.1, 2);
        const ccx = 159, ccy = 26, cr = 13;
        for (const [ox, oy, orr] of [[-7, 1, 7], [0, -2, 9], [8, 1, 7], [-2, 3, 6], [5, 3, 6]]) {
          F.disc(ccx + ox, ccy + oy, orr, 3);
        }
        /* THE SILVER LINING — the only accent in this film, level 8, spent
           once, on the lower rim of the cloud, and nowhere else in the
           module. Everything above and below this line is levels 0-7. */
        F.arc(ccx, ccy + 2, cr + 1, 0.12 * Math.PI, 0.88 * Math.PI, 8, 1.3);

        meter(F, u, amp);
      },
    },
    {
      label: "CHIN HIGH", seconds: 14,
      line: "Now, turning forth to face delights and shadows — one night at a time; one tear at a time; one open mic at a time. Chin now nested high, and volume turnt up.",
      fx: { shake: (u) => (0.4 + 0.6 * Math.abs(Math.sin(u * TAU * 5))) * AMP[6] * 2.4 },
      cues: [
        { at: 0.15, f: 300, decay: 0.10, gain: 0.30, partials: [1, 2.2], noise: 0.4, nDecay: 0.02, seed: 761 },
        { at: 0.50, f: 220, decay: 0.15, gain: 0.30, partials: [1, 1.8], noise: 0.5, nDecay: 0.03, seed: 762 },
        { at: 0.86, f: 140, decay: 0.5, gain: 0.5, partials: [1, 2.0, 3.0, 4.0], noise: 0.4, nDecay: 0.05, seed: 763 },
      ],
      draw(u, F) {
        const amp = clamp01(AMP[6] + (F.n2(8.8, u * 6) - 0.5) * 0.04);
        const scale = scaleOf(AMP[6]), FLOOR = 124, cx = 96;
        /* delights and shadows: a boundary he turns to face, wobbled so it
           reads as weather rather than a ruled line — the same technique
           the floor seam uses elsewhere in the suite, spent here on light
           itself instead of ground */
        F.map((x, y) => (y < FLOOR && x < 96 + (F.n2(y * 0.06, 3) - 0.5) * 30 ? 1 : undefined));
        floorRuns(F, FLOOR);
        const G = rig(F, scale, cx, FLOOR);
        archStage(G, cx, FLOOR, 74, 60, 3);
        micStand(G, cx - 16, FLOOR, 34, 6);
        /* chin high: rot goes the OTHER way from M1, and headTilt does too
           — M1 nested down at -0.20, this ends up at +0.35. Same figure,
           same clock, the film's whole arc read in one number twice. */
        G.fig(cx, FLOOR, 42, { mode: "stand", arms: "open", rot: -0.14, guise: "poet", phase: u * 1.7, weight: 0.6, headTilt: 0.35 }, 7);
        /* one night, one tear, one open mic — three marks arriving in the
           order the line names them, each one a per-dot arrival on the
           ordered schedule rather than a pop-in. Gated on the cues' own
           `at` values now, not a separate guess at where they'd fall — the
           first pass used 0.12/0.42/0.70 against cues fired at
           0.15/0.50/0.86 and the icons kept arriving before their sound. */
        const icons = [[40, 16, "night"], [96, 12, "tear"], [152, 16, "mic"]];
        const gate = [0.15, 0.50, 0.86];
        for (let idx = 0; idx < icons.length; idx++) {
          const [ix, iy, kind] = icons[idx];
          if (u < gate[idx]) continue;
          if (kind === "night") F.disc(ix, iy, 3, 7);
          else if (kind === "tear") petal(F, ix, iy - 4, Math.PI / 2, 8, 4, 7);
          else { F.line(ix, iy - 5, ix, iy + 5, 7, 1.2); F.ring(ix, iy - 6, 2, 7, 1); }
          const arrive = ss(gate[idx], gate[idx] + 0.10, u);
          F.map((x, y, v) => {
            if (x < ix - 8 || x > ix + 8 || y < iy - 9 || y > iy + 10) return;
            if (v !== 7) return;
            return F.bayer(x, y) < arrive ? 5 : 0;
          });
        }
        meter(F, u, amp);
      },
    },
  ],
};
