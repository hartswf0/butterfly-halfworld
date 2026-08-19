/* ============================================================================
   03 · HOW TO BREAK OFF AN ENGAGEMENT — a WYGWYL halfworld

   The tambourine that went through a window in 02 arrives here through a rose
   window, still whole, and leaves in pieces. Between those two facts: an empty
   temple, a storm that takes everything that was ever called goods, and two
   sets of footprints walking away from what the water kept.

   THREE OF THESE ARE THINGS THAT HAPPEN OVER TIME AND WERE DRAWN AS THINGS
   THAT WERE ALREADY OVER. A cobweb is BUILT — bridge, frame, radials, then the
   spiral wound outward turn by turn — and drawing the finished doily is
   drawing the wrong noun. Footsteps are made one at a time and there are more
   of them at the end. A tambourine that shatters stops being one object; the
   pieces travel, land, and stay landed. So each of those three is now a
   quantity that only goes one way, and the frame is built out of tone under
   it: dust, mud, water, sand.
   ========================================================================= */
import { TAU, lerp, clamp01, smooth, ss, win } from "../halfworld.mjs";
import { tambourine } from "./02-flashing-lights.mjs";

/* the nave: pews in perspective, choir stands, prayer lines. Drawn the same
   in M1, M3 and M4 so the storm has a real building to take apart. */
function nave(F, u, decay = 0) {
  F.line(0, 132, 84, 132, 6, 1); F.line(96, 132, 192, 132, 6, 1);
  for (const s of [-1, 1]) {
    F.line(96 + s * 88, 132, 96 + s * 20, 62, 4, 1);            // the aisle
    for (let k = 0; k < 7; k++) {
      const z = 1 - k / 7;
      const y = 62 + (1 - z * z) * 70, w = 6 + z * z * 62;
      const gone = decay > 0.1 && F.noise(k, s) < decay;
      if (gone) continue;
      F.line(96 + s * 14 + s * w * 0.1, y, 96 + s * (14 + w), y, 5, 1.4);
      F.line(96 + s * (14 + w), y, 96 + s * (14 + w), y - 4 - z * 6, 4, 1);
    }
  }
  /* choir stands, empty, tiered */
  for (let k = 0; k < 3; k++) {
    const y = 56 - k * 6, x0 = 66 + k * 5, x1 = 126 - k * 5;
    F.line(x0, y, x1, y, 4, 1);
    for (let j = 0; j < 5; j++) F.line(x0 + j * (x1 - x0) / 4, y, x0 + j * (x1 - x0) / 4, y - 4, 3, 1);
  }
}

/* the rose window. quantised petals — the one circle in the suite that is
   architecture rather than an object. */
export function roseWindow(F, cx, cy, r, u, l = 6) {
  F.ring(cx, cy, r, l, 1.6);
  F.ring(cx, cy, r * 0.34, l, 1.2);
  for (let k = 0; k < 12; k++) {
    const a = k / 12 * TAU + u * 0.12;
    F.line(cx + Math.cos(a) * r * 0.34, cy + Math.sin(a) * r * 0.34,
           cx + Math.cos(a) * r, cy + Math.sin(a) * r, l - 1, 1);
    const ma = a + TAU / 24;
    F.arc(cx + Math.cos(ma) * r * 0.67, cy + Math.sin(ma) * r * 0.67, r * 0.3, 0, TAU, l - 2, 1);
  }
}

/* A WEB IS BUILT IN AN ORDER, AND THE ORDER IS THE PICTURE. A spider lays a
   bridge, then the frame, then every radial, and only then winds the spiral
   outward turn by turn. Drawn all at once it is a doily laid on the film; laid
   down in its own order across a movement it is the one thing in this temple
   that is still working. `grow` runs 0..1 and nothing here ever comes back. */
function web(F, cx, cy, r, k, grow, anchors) {
  if (grow <= 0.005) return;
  const N = 9;
  const R = F.rng(40 + k), th = [];
  for (let j = 0; j < N; j++) th.push(j / N * TAU + (R() - 0.5) * 0.30);
  /* the bridge threads first — a web hanging from nothing is a snowflake.
     They are given as ANGLES and land just outside the spiral: run to the
     corners of the frame instead and three webs put nine long rays across the
     picture, which is a starburst and not a temple with webs in it. */
  for (const a of anchors)
    F.line(cx, cy, cx + Math.cos(a) * r * 1.30, cy + Math.sin(a) * r * 1.30, 2, 1);
  const rad = clamp01((grow - 0.06) / 0.34), spi = clamp01((grow - 0.34) / 0.66);
  const shown = Math.floor(rad * N + 1e-6);
  for (let j = 0; j < shown; j++)
    F.line(cx, cy, cx + Math.cos(th[j]) * r, cy + Math.sin(th[j]) * r, 5, 1);
  const turns = 7, tot = turns * N, seg = Math.floor(spi * tot);
  for (let q = 0; q < seg; q++) {
    const j = q % N, t0 = q / tot, t1 = (q + 1) / tot;
    const r0 = r * (0.10 + 0.90 * t0), r1 = r * (0.10 + 0.90 * t1);
    const a0 = th[j], a1 = th[(j + 1) % N] + (j === N - 1 ? TAU : 0);
    F.line(cx + Math.cos(a0) * r0, cy + Math.sin(a0) * r0,
           cx + Math.cos(a1) * r1, cy + Math.sin(a1) * r1, 4, 1);
  }
}

export default {
  n: "03", slug: "03-how-to-break-off-an-engagement", title: "HOW TO BREAK OFF AN ENGAGEMENT",
  tagline: "the storm takes everything that was ever called goods",
  accent: "#5aa7ff", seed: 303,
  /* THE FILM'S OWN PASSAGE of the suite's 24-minute score, taken from the
     original running order. The runtime stretches this film's movements to
     fill it, so picture and record line up without either being cut. */
  window: [214.108, 286.508],
  /* KEY: G Aeolian, two octaves down — natural minor for a heartbreak that
     is sad rather than violent, and low because 03 is one of the three
     darkest films in the suite (with 01 and 09). */
  drone: { base: 24.50, steps: [0, 0, 7, 3, -9, -5, -12] },
  movements: [
    {
      label: "ODE TO FOREVER", seconds: 13,
      line: "Ode to forever — a tambourine sounds off an empty temple, empty choir stands, empty prayer lines.",
      cues: [
        { at: 0.20, f: 1100, decay: 0.5, gain: 0.45, partials: [1, 2.7, 5.1, 7.9], noise: 0.9, nDecay: 0.03, seed: 71 },
        { at: 0.66, f: 1100, decay: 0.6, gain: 0.4, partials: [1, 2.7, 5.1, 7.9], noise: 0.9, nDecay: 0.03, seed: 72 },
      ],
      draw(u, F) {
        nave(F, u);
        /* the sound in an empty room: rings that leave and find nothing */
        for (let k = 0; k < 4; k++) {
          const p = ((u * 1.3 + k / 4) % 1);
          F.ring(96, 74, p * 130, Math.max(1, Math.round(4 - p * 3)), 1);
        }
        /* THE PICTURE STRIKES WHEN THE CUE DOES. Two beats, on the same `at`
           the sound uses — a ring that starts at radius zero and outruns
           the ambient ones, so the two struck frames read as struck and not
           just as more of the same drift. */
        for (const at of [0.20, 0.66]) {
          const p = clamp01((u - at) / 0.16);
          if (p > 0 && p < 1) F.ring(96, 74, p * 44, Math.max(1, Math.round(7 - p * 6)), 1);
        }
        tambourine(F, 96, 74, 11, u * TAU, 7, 8, 3);
        F.box(38, 96, 22, 14, 4, 1); F.box(132, 96, 22, 14, 4, 1);   // baptism pools, dry
      },
    },
    {
      label: "STILL WHOLE", seconds: 12,
      line: "And abandoned baptism pools. It flies in through the rose window — still whole.",
      fx: { kaleido: "quad" },
      cues: [{ at: 0.44, f: 1250, decay: 0.7, gain: 0.5, partials: [1, 2.7, 5.1], noise: 0.8, nDecay: 0.02, seed: 81 }],
      draw(u, F) {
        /* the window is quartered by the glass itself; the object crossing it
           is quartered too, which is what a rose window does to any light */
        roseWindow(F, 96, 72, 58, u, 6);
        const p = smooth(u);
        const tx = lerp(30, 96, p), ty = lerp(20, 72, p);
        tambourine(F, tx, ty, lerp(4, 12, p), u * TAU * 3, 7, 8, 3);
        /* the cue is the moment it actually crosses the glass — a ring
           struck from the object itself, not the window, because the
           object is what is making the sound */
        const strike = clamp01((u - 0.44) / 0.14);
        if (strike > 0 && strike < 1) F.ring(tx, ty, strike * 22, Math.max(1, Math.round(7 - strike * 6)), 1);
        F.arc(96, 118, 26, Math.PI, TAU, 4, 1);                       // the pool below
      },
    },
    {
      label: "COBWEBS", seconds: 13,
      line: "Pews taken by cobwebs, and doused in disintegration. Spirits have left salvations in opened gift boxes, placed outside the side doors.",
      cues: [
        { at: 0.22, f: 190, decay: 0.60, gain: 0.26, partials: [1, 1.6, 2.4], noise: 0.85, nDecay: 0.22, seed: 82 },
        { at: 0.68, f: 140, decay: 0.80, gain: 0.28, partials: [1, 1.4, 2.1], noise: 0.90, nDecay: 0.34, seed: 83 },
      ],
      draw(u, F) {
        /* DOUSED IN DISINTEGRATION. The dust is not laid over the room, the
           room is handed to it — dot by dot on the ordered schedule, from the
           floor up, until the air itself is a tone and the building is what
           shows through it. This is the movement the film's only tonal ground
           belongs to: an outlined nave on cream is a drawing of a church, and
           a church full of dust is a place. */
        const dust = ss(0.0, 0.90, u);
        for (let y = 0; y < 144; y++) {
          const h = clamp01((y - 14) / 118);
          const s = dust * 1.22 - (1 - h) * 0.70;
          if (s <= 0) continue;
          /* it stops short of the whole field on purpose: a room dusted to
             the last cell is a grey rectangle, and the thing this movement is
             about has to stay visible through it */
          const l = h > 0.80 ? 3 : 2;
          for (let x = 0; x < 192; x++) if (F.bayer(x, y) < s) F.ink(x, y, l);
        }
        /* and the pews go one at a time under it */
        nave(F, u, 0.08 + u * 0.55);
        /* THE WEBS ARE BUILT. Three of them, started at different moments, so
           the room is at three ages of the same decay at once. Each hangs off
           the architecture it is eating. */
        web(F, 30, 42, 34, 1, clamp01(u / 0.80), [-2.4, -0.6, 1.5]);
        web(F, 162, 54, 26, 2, clamp01((u - 0.18) / 0.72), [-2.0, -0.7, 1.9]);
        web(F, 128, 100, 17, 3, clamp01((u - 0.42) / 0.54), [-2.5, -1.0, 1.2]);
        /* the side doors, and what the spirits left outside them: boxes with
           the light still in them, which is the only paper left in the frame */
        for (const [dx, s] of [[0, 1], [180, -1]]) {
          F.rect(dx, 92, 12, 40, 6);
          F.line(dx + (s > 0 ? 12 : 0), 92, dx + (s > 0 ? 12 : 0), 132, 7, 1.6);
        }
        for (const [bx, lid] of [[16, 0.72], [44, 0.44], [146, 0.90], [170, 0.58]]) {
          F.rect(bx, 116, 18, 13, 5);
          F.rect(bx + 3, 118, 12, 6, 0, true);
          F.line(bx, 116, bx + 18, 116, 7, 1.4);
          const a = lid * 1.2 + Math.sin(u * TAU * 0.6 + bx) * 0.05;
          F.line(bx, 116, bx + Math.cos(a) * 19, 116 - Math.sin(a) * 19, 6, 1.4);
        }
      },
    },
    {
      label: "UNTIL NOTHING REMAINS", seconds: 15,
      line: "It thunders. Then rains until nothing remains. What was once love, now goods — broken and sealed apart by lightning. Daily breads, soaked and delivered rotted by rain; and blankets, soiled by venomous puppeteers.",
      fx: { shake: (u) => (Math.sin(u * TAU * 2.5) > 0.9 ? 2.6 : 0) },
      cues: [
        { at: 0.10, f: 55, decay: 1.4, gain: 0.6, partials: [1, 1.4, 2.1], noise: 0.7, nDecay: 0.5, seed: 91 },
        { at: 0.52, f: 48, decay: 1.6, gain: 0.6, partials: [1, 1.3, 2.0], noise: 0.8, nDecay: 0.6, seed: 92 },
      ],
      draw(u, F) {
        nave(F, u, 0.2 + u * 0.7);
        /* rain: vertical dashes, never a sheet. a sheet is a gradient */
        const R = F.rng(3);
        for (let k = 0; k < 200; k++) {
          const x = R() * F.W, y0 = (R() * 200 + u * 700) % 190 - 30;
          F.line(x, y0, x + 1, y0 + 7, 4, 1);
        }
        /* venomous puppeteers: strings from a ceiling with nobody on it,
           and the blankets they work hang and turn */
        for (let k = 0; k < 5; k++) {
          const x = 24 + k * 36 + Math.sin(u * TAU * 0.9 + k) * 5;
          F.line(x, 0, x, 70 + Math.sin(u * TAU + k) * 6, 5, 1);
          const by = 70 + Math.sin(u * TAU + k) * 6;
          F.rect(x - 9, by, 18, 16, 3);
          F.line(x - 9, by, x + 9, by, 6, 1);
        }
        /* lightning: the only BREAK in this world, and it seals things apart */
        const strike = Math.sin(u * TAU * 2.5);
        if (strike > 0.9) {
          let lx = 60 + F.noise(Math.floor(u * 40), 5) * 70;
          for (let y = 0; y < 132; y += 6) {
            const nx = lx + (F.noise(Math.floor(u * 40), y) - 0.5) * 22;
            F.line(lx, y, nx, y + 6, 7, 2);
            lx = nx;
          }
          F.map((x, y, v) => (F.bayer(x, y) < (strike - 0.9) * 6 ? 7 - v : undefined));
        }
      },
    },
    {
      label: "TWO SETS OF FOOTSTEPS", seconds: 13,
      line: "Ode to the storm ending. Ode to two sets of mud-imprinted footsteps, leading away from what the water kept.",
      cues: [
        { at: 0.30, f: 150, decay: 0.09, gain: 0.35, partials: [1, 2.2], noise: 0.9, nDecay: 0.03, seed: 101 },
        { at: 0.62, f: 132, decay: 0.10, gain: 0.32, partials: [1, 2.2], noise: 0.9, nDecay: 0.03, seed: 102 },
      ],
      draw(u, F) {
        const SH = 92;                                   // where the mud starts
        /* ODE TO THE STORM ENDING. The cloud is a field of ink with a ragged
           western edge, and it is handed back to the paper dot by dot as it
           goes east. A sky that dims is a fade and this world has none; a sky
           that LEAVES is a storm ending. */
        const clear = -0.17 + ss(0.02, 0.90, u) * 1.10;
        for (let y = 0; y < SH; y++) for (let x = 0; x < F.W; x++) {
          /* the weather goes off to the north-east: east because it came from
             the west, and up because a storm ending lifts off the horizon
             before it lets go of the sky */
          const e = x / F.W * 0.55 + (1 - y / SH) * 0.30 + (F.n2(x * 0.05, y * 0.06) - 0.5) * 0.30;
          if (e > clear) F.ink(x, y, e > clear + 0.12 ? 4 : 2);
        }
        /* and the last of the rain, which only falls where the cloud still is */
        const R = F.rng(5);
        for (let k = 0; k < 110; k++) {
          const x = R() * 236 - 22, y0 = (R() * 210 + u * 640) % 210 - 34;
          if (x / F.W * 0.55 < clear - 0.10 || y0 > SH) continue;
          F.line(x, y0, x + 1, y0 + 6, 5, 1);
        }
        /* the mud: a flat quantised field, not a texture. the water kept the rest */
        F.rect(0, SH, F.W, 144 - SH, 2);
        F.map((x, y, v) => (y > SH && F.n2(x * 0.09, y * 0.16) > 0.58 ? 3 : undefined));
        F.line(0, SH, 74, SH - 1, 5, 1); F.line(86, SH - 1, 192, SH, 5, 1);
        /* WHAT THE WATER KEPT: a pool that did not drain, with the thing still
           in it. The trail starts here, which is what "leading away from" means
           — the near end of the trail is the end they left. */
        const PX = 158, PY = 128;
        for (let y = -7; y <= 7; y++) {
          const w = Math.round(Math.sqrt(Math.max(0, 1 - (y / 7) ** 2)) * 26);
          for (let x = -w; x <= w; x++) F.ink(PX + x, PY + y, 4);
        }
        F.arc(PX - 4, PY + 3, 12, Math.PI, TAU, 7, 1.8);
        for (let k = 1; k < 5; k++) {
          const a = Math.PI + k / 5 * Math.PI;
          F.disc(PX - 4 + Math.cos(a) * 12, PY + 3 + Math.sin(a) * 12, 1.8, 7);
        }
        /* THE PRINTS ARRIVE ONE AT A TIME, TWO SETS OF THEM, alternating feet,
           and the pair converges with distance because everything does. There
           are twenty-six at the end and none at the beginning. */
        const N = 26, made = Math.floor(clamp01(u / 0.88) * N);
        const tx = (p) => 140 - p * 118, ty = (p) => 132 - p * 34;
        for (let k = 0; k < made && k < N; k++) {
          const p = k / N, sc = 1 - p * 0.62, lane = k % 2 ? 1 : -1;
          /* THE TWO SETS TAKE ALTERNATE STEPS. Giving both of them every step
             put a print every four cells and the trail became one chain of
             blobs; a stride is about two and a half feet long, and out of
             step is also what two people walking actually are. */
          const x = tx(p) + lane * (13 * sc + 4) + (k % 4 < 2 ? 2.4 : -2.4) * sc;
          const y = ty(p) + (k % 4 < 2 ? 1 : 0);
          F.disc(x, y, 3.2 * sc, 6);
          F.disc(x + 3.6 * sc, y - 3.6 * sc, 2.3 * sc, 6);
        }
        /* THE STEPS THAT LAND ON THE CUES: mud thrown up around the print the
           sound belongs to, which is the only frame where the strike and the
           footfall are the same event. */
        for (const at of [0.30, 0.62]) {
          const sp = clamp01((u - at) / 0.12);
          if (sp > 0 && sp < 1) {
            const p = (made - 1) / N;
            F.ring(tx(p), ty(p), sp * 9, Math.max(1, Math.round(6 - sp * 5)), 1);
          }
        }
        /* the two who made them, at the head of their own trails, going */
        for (const lane of [-1, 1]) {
          const p = clamp01(clamp01(u / 0.88) - (lane < 0 ? 0.055 : 0));
          const sc = 1 - p * 0.62;
          F.fig(tx(p) + lane * (13 * sc + 4), ty(p), 13 + 19 * sc * sc, {
            mode: "walk", phase: u * 11.35 + (lane < 0 ? 0.7 : 0), face: -1,
            guise: lane < 0 ? "poet" : "turned",
          }, 7);
        }
      },
    },
    {
      label: "SHATTERED", seconds: 13,
      line: "And a tambourine, shattered into pieces. What if I followed this trail, to where the broken pieces have washed ashore?",
      cues: [
        { at: 0.22, f: 1600, decay: 0.25, gain: 0.60, partials: [1, 1.6, 2.8, 4.9], noise: 1.0, nDecay: 0.05, seed: 111 },
        { at: 0.74, f: 380, decay: 0.35, gain: 0.28, partials: [1, 1.7, 3.1], noise: 0.8, nDecay: 0.08, seed: 112 },
      ],
      draw(u, F) {
        const CX = 96, CY = 42, r = 30, N = 13, SEA = 76;
        /* THE SHORE, because the line names one: sky is paper, water is the
           darkest field in the frame, sand is what is between them. The sea's
           top edge is the one unbroken horizontal in this film — a horizon
           whose whole meaning is that it has no gap in it. The tideline below
           it wanders, because that one is water on sand and never straight. */
        /* AND THE TIDE COMES IN, which is what "washed ashore" is the name of.
           The waterline climbs the beach through the whole movement and the
           pieces come down to meet it, so the last frame has them lying in the
           wash rather than on dry sand at a distance from the sea. */
        const edge = [], tide = 96 + smooth(u) * 17;
        for (let x = 0; x < F.W; x++) edge.push(tide + (F.n2(x * 0.07, 3) - 0.5) * 9);
        for (let y = SEA; y < 144; y++) for (let x = 0; x < F.W; x++)
          F.ink(x, y, y < edge[x] ? 4 : y > edge[x] + 16 ? 1 : 2);
        /* the foam is the only paper below the horizon, and it is what makes
           the tideline a line of water rather than a change of tone */
        for (let x = 0; x < F.W; x++) {
          if (F.n2(x * 0.19, 8) < 0.42) continue;
          F.put(x, Math.round(edge[x]), 0); F.put(x, Math.round(edge[x]) + 1, 0);
        }
        /* IT COMES APART ALONG THE RING and every piece keeps its curvature.
           Each shard KEEPS ITS SEAT and travels outward along its own radius,
           turning about its own middle: an earlier pass rebased every shard to
           the centre first and the whole thing imploded.
           A TAMBOURINE HAS A HEAD ON IT. Drawn as a hoop it was eleven curved
           strokes in an empty frame and 3% of the field; drawn as a skin, the
           break is a solid thing coming apart into solid things, which is what
           the eye needs to follow eleven pieces at once. */
        const impact = clamp01((u - 0.22) / 0.10);
        if (impact > 0 && impact < 1) F.ring(CX, CY, impact * 24, Math.max(1, Math.round(7 - impact * 6)), 1);
        for (let k = 0; k < N; k++) {
          const a0 = k / N * TAU, a1 = (k + 0.93) / N * TAU, mid = (a0 + a1) / 2;
          /* not every piece lets go at once: an eighth of a second of stagger
             is the difference between a break and a pinwheel opening */
          const b = smooth(clamp01((u - 0.22 - F.noise(k, 5) * 0.07) / 0.60));
          const mx = CX + Math.cos(mid) * r * 0.62, my = CY + Math.sin(mid) * r * 0.62;
          const fly = 8 + F.noise(k, 1) * 28;
          /* WHERE IT COMES TO REST. The fall is solved for the moment this
             piece reaches its own place on the sand, and after that it does
             not move again — pieces that have washed ashore have stopped. */
          const land = 112 + F.noise(k, 3) * 20, A = 88, L = 15;
          const bl = Math.min(1, (L + Math.sqrt(L * L + 4 * A * Math.max(2, land - my))) / (2 * A));
          const bb = Math.min(b, bl);
          const ox = Math.cos(mid) * fly * bb, oy = -L * bb + A * bb * bb;
          const spin = bb * (F.noise(k, 2) - 0.5) * 3.0;
          const cs = Math.cos(spin), sn = Math.sin(spin);
          const T = (rr, aa) => {
            const dx = CX + Math.cos(aa) * rr - mx, dy = CY + Math.sin(aa) * rr - my;
            return [mx + dx * cs - dy * sn + ox, my + dx * sn + dy * cs + oy];
          };
          for (let rr = 1.5; rr < r - 1; rr += 1.0) {
            const st = 1.0 / rr;
            for (let aa = a0; aa <= a1; aa += st) { const q = T(rr, aa); F.ink(q[0], q[1], 3); }
          }
          for (let aa = a0; aa <= a1; aa += 1 / r) { const q = T(r, aa); F.disc(q[0], q[1], 1.3, 7); }
          if (b > 0.01) for (const aa of [a0, a1])
            for (let rr = 0; rr < r; rr += 0.7) { const q = T(rr, aa); F.ink(q[0], q[1], 6); }
          const j = T(r, mid); F.disc(j[0], j[1], 2.3, 7);       // its jingle
        }
        /* WHAT IF I FOLLOWED THIS TRAIL. He comes along the sand behind the
           pieces, laying prints of his own, and they are landing where he is
           going — the film ends with him still walking toward them. */
        const p = clamp01((u - 0.06) / 0.86);
        const made = Math.floor(p * 15);
        for (let k = 0; k < made; k++) {
          const q = k / 15, x = 2 + q * 34, y = 136 - q * 4;
          F.disc(x, y, 2.2, 5); F.disc(x + 2.6, y - 2.6, 1.5, 5);
        }
        F.fig(2 + p * 34, 136 - p * 4, 27, {
          mode: "walk", phase: u * 9.35, face: 1, guise: "poet", headTurn: 0.4,
        }, 7);
      },
    },
  ],
};
