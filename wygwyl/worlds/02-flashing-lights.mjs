/* ============================================================================
   02 · FLASHING LIGHTS — a WYGWYL halfworld

   A silent scream is a scream whose rings travel INWARD. That is the whole
   grammar of this world: everything that should radiate, collapses. The walls
   cave, the pupil opens and we go through it, the ghost arrives at the wrong
   age, and the one object that finally leaves the room does so through glass.

   THE ROOMS ARE TONE, NOT OUTLINE. Half of these movements are interiors and
   all of them were first drawn as rectangles in outline floating on cream,
   which is a diagram of a room and not a dark one. A room here is a filled
   field of ink with holes cut in it, and the holes are paper: a mirror, a bed,
   a window. A person is level 7 against that. The ink then arrives or leaves
   on the ordered schedule, so a room can close on a man, or come apart around
   him, without one dot on screen ever being half of anything.
   ========================================================================= */
import { TAU, lerp, clamp01, smooth, ss, win } from "../halfworld.mjs";

/* the room, caving. cave ∈ 0..1 — at 1 the walls have taken half the frame */
function caving(F, u, cave) {
  const L = lerp(8, 60, cave), R = lerp(184, 132, cave), C = lerp(10, 40, cave);
  F.line(L, C, L, 132, 6, 2); F.line(R, C, R, 132, 6, 2);
  F.line(L, C, 84, C - 2, 5, 1); F.line(96, C - 2, R, C, 5, 1);   // ceiling, broken
  F.line(L, 132, 80, 132, 6, 1); F.line(92, 132, R, 132, 6, 1);   // floor, broken
  return { L, R, C };
}

/* a tambourine: a ring, and the jingles that make it a tambourine. `skin` is
   the level of its head — a drum has one, and without it the object is a hoop
   of line in an empty frame. Defaults off: three other films draw this and
   they were written against the hoop. */
export function tambourine(F, cx, cy, r, rot, l = 7, jingles = 8, skin = 0) {
  if (skin) F.disc(cx, cy, r - 1.4, skin);
  F.ring(cx, cy, r, l, 1.6);
  for (let k = 0; k < jingles; k++) {
    const a = rot + k / jingles * TAU;
    F.disc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, Math.max(1, r * 0.14), l);
  }
}

/* THE HOUSE. One room and one window, drawn identically in THE GHOST WAS SEVEN
   and in THROUGH THE WINDOW, because it is the same room and the same window
   — the one he eventually throws something through. The wall is a filled field
   and the window is a hole in it; what is outside is paper, which is the only
   way this lattice can say that a room is darker than the day. */
const HOUSE = { GY: 118, WX: 116, WY: 26, WW: 60, WH: 66 };
function house(F) {
  const { GY, WX, WY, WW, WH } = HOUSE;
  F.rect(5, 8, 182, 130, 2);
  /* the floor is a tone deeper, and its edge wanders a cell: a ruled line a
     hundred and eighty cells long stripes the frame under the halftone */
  for (let x = 5; x < 187; x++) {
    const j = F.noise(x, 3) > 0.72 ? 1 : 0;
    for (let y = GY + j; y < 138; y++) F.ink(x, y, F.n2(x * 0.13, y * 0.34) > 0.60 ? 3 : 4);
  }
  F.rect(WX, WY, WW, WH, 0, true);
  F.box(WX - 3, WY - 3, WW + 6, WH + 6, 6, 3);              // the casing
  F.line(WX + WW / 2, WY, WX + WW / 2, WY + WH, 6, 2);      // the mullions
  F.line(WX, WY + WH * 0.44, WX + WW, WY + WH * 0.44, 6, 2);
  F.rect(WX - 6, WY + WH + 3, WW + 12, 4, 6);               // the sill
  return HOUSE;
}

export default {
  n: "02", slug: "02-flashing-lights", title: "FLASHING LIGHTS",
  tagline: "the scream that travels inward",
  accent: "#5aa7ff", seed: 202,
  /* THE FILM'S OWN PASSAGE of the suite's 24-minute score, taken from the
     original running order. The runtime stretches this film's movements to
     fill it, so picture and record line up without either being cut. */
  window: [122.987, 214.107],
  /* KEY: G Phrygian (the suite's fifth), one octave down — the flat 2nd
     keeps the scream turned inward instead of resolving outward, so no
     bright: this drone stays as dark as the loss films around it. */
  drone: { base: 49.00, steps: [0, 1, 8, 3, -2, 5, 1] },
  movements: [
    {
      label: "SILENT SCREAM", seconds: 13,
      line: "It was the type of silent scream a trapped lover makes to escape: a pending marriage, a concussion, a set of walls caving inward.",
      fx: { shake: (u) => ss(0.55, 0.8, u) * 3.2 * (1 - ss(0.86, 1, u)) },
      cues: [{ at: 0.58, f: 420, decay: 0.06, gain: 0.55, partials: [1, 3.1, 6.7], noise: 0.8, nDecay: 0.02, seed: 21 }],
      draw(u, F) {
        const cave = smooth(u);
        caving(F, u, cave);
        const hx = 96, hy = 62;
        /* the scream: five rings, and every one of them is coming home */
        for (let k = 0; k < 5; k++) {
          const p = (u * 1.6 + k / 5) % 1;
          F.ring(hx, hy + 2, lerp(52, 4, p), Math.round(lerp(1, 5, p)), 1);
        }
        /* the scream tightens him: crouch and weight both climb with `cave`,
           so the same number that closes the walls also closes the body —
           one mechanism, not a wall event and a body event coinciding by
           chance. Head thrown back is the scream's own shape. */
        F.fig(hx, 132, 46, {
          mode: "stand", arms: "up", phase: u * 3.35, weight: 0.22,
          crouch: 0.10 + cave * 0.22, headTilt: -0.7,
        }, 7);
        F.disc(hx, hy + 8, 3.2, 0);                              // the open mouth
        /* the pending marriage: two rings that approach and do not touch */
        const d = lerp(30, 9, smooth(u));
        F.ring(hx - d, 30, 7, 6, 1.4); F.ring(hx + d, 30, 7, 6, 1.4);
      },
    },
    {
      label: "THE MIRROR", seconds: 12,
      line: "An emergency call while tossing and turning — the silent call a man makes to the mirror after midnight, to digest a truth.",
      /* THE GLASS IS THE FRAME'S OWN CENTRE LINE. Everything is drawn in the
         left half and the runtime's mirror supplies the right, so the
         reflection is not a second drawing that might disagree with the first
         — it is the same cells, and it is exact, which is the problem. */
      fx: { kaleido: "x" },
      cues: [
        { at: 0.09, f: 950, decay: 0.05, gain: 0.40, partials: [1, 2], noise: 0.2, nDecay: 0.01, seed: 31 },
        { at: 0.17, f: 950, decay: 0.05, gain: 0.40, partials: [1, 2], noise: 0.2, nDecay: 0.01, seed: 32 },
        { at: 0.76, f: 165, decay: 1.10, gain: 0.45, partials: [1, 2.02, 3.01], noise: 0.25, nDecay: 0.22, seed: 33 },
      ],
      draw(u, F) {
        const GY = 116, MX = 72, MY = 28;
        const BX = 6, BY = 98, BW = 54;
        /* A DARK ROOM WITH TWO HOLES IN IT, and both holes are paper: the bed
           he cannot stay in, and the glass he ends up at. The first pass drew
           this room as an outlined rectangle on cream and then held it for
           thirteen seconds while a man swayed on the spot; the picture had no
           dark in it at all, in the one movement that happens after midnight. */
        F.rect(6, 8, 90, 128, 2);
        F.rect(6, GY, 90, 20, 3);
        F.line(6, GY, 44, GY, 5, 1); F.line(52, GY, 95, GY, 5, 1);
        F.rect(MX, MY, 96 - MX, GY - MY, 0, true);
        F.rect(MX - 4, MY - 4, 4, GY - MY + 8, 6);              // the near stile
        F.line(MX - 4, MY - 3, 80, MY - 3, 6, 2); F.line(86, MY - 3, 95, MY - 3, 6, 2);
        F.line(MX - 4, GY + 2, 80, GY + 2, 6, 2); F.line(86, GY + 2, 95, GY + 2, 6, 2);
        F.rect(BX, BY, BW, GY - BY, 0, true);                   // the sheets
        F.box(BX, BY, BW, GY - BY, 5, 1);
        F.rect(BX, BY - 13, 3, 13, 5);                          // the headboard
        /* MIDNIGHT IS THE ONE TIME A CLOCK IS SYMMETRICAL, so the clock is
           hung on the wall BEHIND him and we only ever see it in the glass —
           which also means the mirror has something in it before he arrives.
           One hand is drawn, leaning left of twelve, and the mirror gives it
           back leaning right, so the pair opens like a V as the hour gets
           later: the only quantity here that goes one way and stays gone. */
        F.ring(95, 46, 11, 6, 1.6);
        for (let k = 0; k < 3; k++) F.line(95 - 11 + k, 46, 95 - 8 + k, 46, 6, 1);
        /* THE ROOM CLOSES IN FROM THE EDGES, dot by dot on the ordered
           schedule, toward the one thing he is looking at. This world's rings
           travel inward and so does its dark; the room is not dimmed, it is
           replaced, and the glass keeps its light because paper is exempt. */
        const dark = ss(0.16, 0.90, u);
        F.map((x, y, v) => {
          if (v < 1 || x < 6 || x > 95 || y < 8 || y > 136) return;
          const dx = Math.max(0, MX - x), dy = Math.max(0, MY - y, y - GY);
          const near = 1 - Math.min(1, Math.hypot(dx, dy) / 52);
          /* an EDGE that advances, not a density that rises: the multiplier
             narrows the schedule's band to about a fifth of the movement, so
             what crosses the room is a line of dark rather than a fog. It
             stops at 5 — the walls of this room have to stay lighter than the
             man crossing them or he is a black shape on a black ground. */
          if (F.bayer(x, y) < (dark * 1.5 - near) * 3.0) return Math.max(v, 5);
        });
        const late = ss(0.04, 0.96, u) * 1.15;
        F.line(95, 46, 95, 37, 6, 1.8);                          // still at twelve
        F.line(95, 46, 95 - Math.sin(late) * 10, 46 - Math.cos(late) * 10, 5, 1.4);
        /* the emergency call: a handset on the sheets, and the ring arriving
           as rings that CLOSE on it — in this film sound collapses inward */
        F.rect(BX + 31, BY + 5, 8, 3, 6);
        for (const at of [0.09, 0.17]) {
          const p = clamp01((u - at) / 0.10);
          if (p > 0 && p < 1) F.ring(BX + 35, BY + 6, lerp(17, 3, p), Math.max(1, Math.round(2 + p * 4)), 1);
        }
        /* the bed goes when he does: the paper is taken back at the rate he
           crosses the floor, so what he got out of stops being lit */
        const left = ss(0.44, 0.88, u);
        for (let y = BY - 14; y <= GY; y++) for (let x = BX; x <= BX + BW; x++)
          if (F.bayer(x, y) < left * 1.35) F.put(x, y, 5);
        /* ONE CLOCK FOR THE WHOLE PERFORMANCE: he tosses, the phone rings
           twice in the dark, he sits up, he crosses the room, and he puts a
           hand flat on the glass — where his own hand comes out to meet it,
           because the reflection is exact. Nothing else happens in thirteen
           seconds, and the room closing behind him is the only other event. */
        const ring = Math.max(Math.exp(-(((u - 0.09) / 0.035) ** 2)), Math.exp(-(((u - 0.17) / 0.035) ** 2)));
        const rise = ss(0.24, 0.46, u), walk = ss(0.48, 0.74, u);
        const H = 54;
        const fx = lerp(lerp(32, 58, rise), 84, walk);
        const moving = walk > 0.02 && walk < 0.98;
        F.fig(fx, lerp(BY + H / 2, GY, rise), H, {
          mode: moving ? "walk" : "stand", face: 1, guise: "poet",
          rot: (1 - rise) * 1.5,
          phase: moving ? u * 7.35 : u * 1.9,
          weight: walk > 0.98 ? 0.34 : 0.5,
          crouch: (1 - rise) * (0.16 + ring * 0.30) + win(u, 0.28, 0.38, 0.42, 0.52) * 0.26,
          headTilt: -0.34 + ss(0.76, 0.94, u) * 0.5,
          headTurn: walk * 0.35,
          gesture: walk > 0.98 ? [12, 33] : undefined,
        }, 7);
        /* HE IS UNDER THE COVERS. The rig laid horizontal reads as a heap of
           limbs and not as a man in a bed; what says man-in-a-bed is a mound
           with a head at one end of it. So the blanket is drawn over him, it
           moves while he does, and it slides off him as he sits up. */
        if (rise < 0.98) {
          const bl = lerp(BX + 9, BX + 42, rise), be = BX + BW - 2;
          for (let x = Math.round(bl); x < be; x++) {
            const t = (x - bl) / Math.max(1, be - bl);
            const top = BY + 1 - Math.sin(t * Math.PI) * 3.5
                      + Math.sin(u * TAU * 2.3 + t * 3.4) * 1.6;
            for (let y = Math.round(top); y < GY - 1; y++) F.put(x, y, 6);
          }
        }
      },
    },
    {
      label: "WE GO THROUGH", seconds: 13,
      line: "A winless insomnia. An epiphany of a road winding down. My eyes dilate — and we go through.",
      draw(u, F) {
        /* THE ROAD IS SEEN THROUGH A PUPIL THAT IS OPENING. A dilating iris is
           the only zoom this world allows: there is no scaling pass, so getting
           closer to something has to be done by uncovering more of it.
           The aperture starts at 14 cells, and the first pass put nothing but
           the road's vanishing point inside it — twelve seconds that opened on
           blank paper. The horizon and the far light are drawn AT the vanishing
           point so the smallest aperture still contains a picture. */
        const vy = 66;
        F.line(52, vy, 88, vy, 3, 1); F.line(104, vy, 140, vy, 3, 1);   // horizon
        F.disc(96, vy - 3, 3.4, 6);                                      // the far light
        for (let k = 0; k < 26; k++) {
          const p = (k / 26 + u * 0.6) % 1, z = 1 - p;
          const w = 4 + z * z * 150, y = vy + (1 - z * z) * 66;
          const bend = Math.sin(p * 3.1 + u * 1.4) * 26 * (1 - z);
          const seg = Math.max(2, w * 0.22);
          F.line(96 + bend - w / 2, y, 96 + bend - w / 2 + seg, y, 5, 1.4);
          F.line(96 + bend + w / 2 - seg, y, 96 + bend + w / 2, y, 5, 1.4);
        }
        const R = lerp(14, 108, smooth(u));
        F.map((x, y, v) => {
          const d = Math.hypot((x - 96) * 0.92, y - 66);
          if (d > R) return 7;                                    // the iris
          if (d > R - 2.5) return 0;
        });
      },
    },
    {
      label: "THE GHOST WAS SEVEN", seconds: 14,
      line: "I was six, I recall, when the ghost of a dead and love-less seven-year-old appeared, and shared that my parents' marriage wouldn't last. A warm, heavy breeze in winter, where a child is left home alone.",
      cues: [
        { at: 0.30, f: 300, decay: 0.55, gain: 0.30, partials: [1, 2.4, 3.9], noise: 0.6, nDecay: 0.12, seed: 41 },
        { at: 0.72, f: 520, decay: 0.30, gain: 0.40, partials: [1, 3.1, 5.2], noise: 0.5, nDecay: 0.03, seed: 42 },
      ],
      draw(u, F) {
        const { GY, WX, WY, WW, WH } = house(F);
        const WCX = WX + WW / 2;
        /* THE COUNT. Seven notches climb a post, one at a time, and the sixth
           is exactly the height of the boy's crown while the seventh is
           exactly the height of the ghost's. That is the line as a picture:
           he was six, she is seven, and the difference between the living and
           the dead is one notch he has not reached. They are cut to PAPER, so
           the room can go as dark as it likes and the years stay legible. */
        const PX = 36, YEAR = 7.7;
        for (let k = 1; k <= 7; k++) {
          if (u < 0.04 + k * 0.096) break;
          const y = GY - k * YEAR, w = 13 + F.noise(k, 9) * 5;
          const kink = F.noise(k, 4) > 0.5 ? 1 : 0;            // cut by a hand, not a rule
          F.line(PX - w, y + kink, PX, y, 0, 1, true);
          F.line(PX - w, y + 1 + kink, PX, y + 1, 0, 1, true);
        }
        /* THE AFTERNOON GOES. The window lays a slab of light on the floor and
           it retreats toward the window as the sun drops — the only clock in a
           house with a child left alone in it. */
        const day = smooth(u);
        const a0 = lerp(44, 120, day), a1 = lerp(158, 174, day);
        for (let y = GY + 2; y < 136; y++) {
          const sh = (y - GY) * 0.85;                          // the sun's own angle
          for (let x = Math.round(a0 - sh); x < a1 - sh * 0.7; x++) F.put(x, y, 0);
        }
        /* the warm heavy breeze, in at the window and across the room. Heavy
           is the adjective a lattice can keep, so these are drawn at 6 and
           they are dashes: a continuous stroke would be wind, not weather. */
        for (let k = 0; k < 18; k++) {
          const p = (k / 18 + u * 0.5) % 1;
          const x = WX + 26 - p * 210, y = 20 + ((k * 43) % 86) + Math.sin(p * 5.4 + k) * 6;
          F.line(x, y, x + 12, y + 5, 6, 1);
        }
        /* SHE IS ASSEMBLED, NOT FADED IN — handed over dot by dot on the
           ordered schedule. And because she is drawn before the room goes
           out, the dusk fills her body in and leaves only her outline, which
           is what a ghost is by the end of an afternoon.
           SIX BREATHES; SEVEN DOES NOT. That one free difference in the pose
           vocabulary is the whole scene: a boy drifting toward whatever is
           talking to him, and a dead child standing dead level because
           nothing is holding her up against her own weight any more. */
        const here = ss(0.24, 0.52, u);
        if (here > 0.01) {
          /* SEVEN YEARS TALL, TO THE CELL. Her crown lands on the seventh
             notch and his lands on the sixth, so the year between them is a
             distance on a wall and not an assertion. */
          F.fig(44, GY, 7 * YEAR, {
            mode: "stand", arms: "down", guise: "child", breath: 0,
            weight: 0.5, face: 1, headTurn: 0.3,
          }, 7);
          F.map((x, y, v) => {
            if (x < 28 || x > 60 || y < GY - 60 || y > GY + 2) return;
            if (v === 7 && F.bayer(x, y) > here * (0.60 + 0.08 * Math.sin(u * TAU * 2.2))) return 2;
          });
        }
        /* THE ROOM GOES OUT WITH THE LIGHT, from the corners toward the
           window, so the last of the day is the last thing to go dark. */
        const dusk = ss(0.08, 0.92, u);
        F.map((x, y, v) => {
          if (v < 1) return;
          const d = Math.min(1, Math.hypot((x - WCX) * 0.7, y - (WY + WH / 2)) / 118);
          if (F.bayer(x, y) < dusk * 2 - (1 - d)) return Math.max(v, 4);
        });
        /* told in advance: two rings on the sill, going apart and not stopping.
           In SILENT SCREAM the same two rings approach and never touch. */
        const apart = smooth(u);
        for (const s of [-1, 1]) F.ring(WCX + s * lerp(8, 23, apart), WY + WH - 3, 5, 7, 1.6);
        /* he starts at the window with his back to the room, waiting for a car
           that is not coming, and turns and crosses to the post */
        const cross = ss(0.30, 0.64, u);
        const going = cross > 0.03 && cross < 0.97;
        F.fig(lerp(170, 70, cross), GY, 6 * YEAR, {
          mode: going ? "walk" : "stand", face: cross > 0.03 ? -1 : 1,
          guise: "child", phase: going ? u * 8.35 : u * 1.7,
          weight: 0.32, crouch: 0.05,
          headTurn: cross > 0.9 ? -0.45 : lerp(0.5, -0.6, cross),
          headTilt: -ss(0.70, 0.90, u) * 0.5,
        }, 7);
      },
    },
    {
      label: "BLINDS UP", seconds: 13,
      line: "Curtains pulled, and blinds up as far and as wise as possible — to see flashing lights, and the whispering screams of two souls on a road winding down.",
      fx: { invert: (u) => (Math.sin(u * TAU * 9) > 0.72 ? 0.85 : 0) },
      cues: [
        { at: 0.22, f: 240, decay: 0.2, gain: 0.4, partials: [1, 1.9], noise: 0.5, nDecay: 0.04, seed: 51 },
        { at: 0.55, f: 240, decay: 0.2, gain: 0.4, partials: [1, 1.9], noise: 0.5, nDecay: 0.04, seed: 52 },
      ],
      draw(u, F) {
        /* the blinds go up: slats leave one at a time, from the bottom */
        const lift = smooth(u) * 15;
        for (let k = 0; k < 15; k++) {
          if (k < lift) continue;
          const y = 10 + k * 7;
          F.line(6, y, 92, y, 4, 1.5); F.line(100, y, 186, y, 4, 1.5);
        }
        /* the road winding down, and two souls on it, whispering, screaming */
        for (let k = 0; k < 16; k++) {
          const p = (k / 16 + u * 0.5) % 1, z = 1 - p;
          const y = 78 + (1 - z * z) * 52, w = 3 + z * z * 120;
          const bend = Math.sin(p * 2.6) * 20 * (1 - z);
          F.line(96 + bend - w / 2, y, 96 + bend - w / 2 + w * 0.2, y, 5, 1);
          F.line(96 + bend + w / 2 - w * 0.2, y, 96 + bend + w / 2, y, 5, 1);
        }
        for (const s of [-1, 1]) {
          const p = (u * 0.9 + (s > 0 ? 0.18 : 0)) % 1, z = 1 - p;
          const y = 80 + (1 - z * z) * 46;
          F.fig(96 + s * (6 + z * 30), y, 8 + z * 26, { mode: "walk", phase: u * 5.35 + s, face: s }, 6);
        }
      },
    },
    {
      label: "THROUGH THE WINDOW", seconds: 13,
      line: "And no tears, and no fucks, and no love to give. The ghost hands me a tambourine — and I throw it through the window.",
      cues: [
        { at: 0.24, f: 620, decay: 0.30, gain: 0.34, partials: [1, 2.7, 5.3], noise: 0.7, nDecay: 0.02, seed: 62 },
        { at: 0.66, f: 1400, decay: 0.18, gain: 0.60, partials: [1, 1.7, 2.9, 4.4], noise: 1.0, nDecay: 0.06, seed: 61 },
      ],
      draw(u, F) {
        const { GY, WX, WY, WW, WH } = house(F);
        const EX = WX + WW * 0.5, EY = WY + WH * 0.44;      // where it goes through
        /* the glass is there — three strokes of sheen on the paper, and they
           are the only thing in a window this world can break */
        for (let k = 0; k < 3; k++) {
          const x0 = WX + 9 + k * 16;
          F.line(x0, WY + WH - 7, x0 + 15, WY + 7, 2, 2);
        }
        /* the ghost, drawn before the room comes apart so that the room takes
           her with it. She is the one who hands the thing over and she has no
           further business here. */
        const pass = ss(0.14, 0.28, u);
        F.fig(30, GY, 48, {
          mode: "stand", arms: "reach", guise: "child", breath: 0, weight: 0.5,
          face: 1, headTurn: 0.4, gesture: [14, 30],
        }, 7);
        /* her outline breaks and re-forms on the ordered schedule. The first
           pass knocked two thirds of her out and she stopped being a child and
           became a column of specks — a ghost still has to be somebody. */
        F.map((x, y, v) => {
          if (x < 10 || x > 54 || y < GY - 54 || y > GY + 2) return;
          if (v === 7 && F.bayer(x, y) > 0.70 + 0.18 * Math.sin(u * TAU * 2.4)) return 2;
        });
        /* THE ROOM IS WHAT LEAVES. One object goes through the glass and the
           break does not stop at the window: the wall is handed back to the
           paper, dot by dot, outward from the hole. "No love to give" is a
           room with nothing left in it. The floor is exempt — a man standing
           on nothing is falling, and this one is not falling. */
        const gone = ss(0.66, 0.99, u);
        if (gone > 0) F.map((x, y, v) => {
          if (v < 1) return;
          const d = Math.hypot((x - EX) * 0.62, y - EY) / 128;
          if (F.bayer(x, y) < (gone * 1.9 - d) * (y > GY ? 0.40 : 0.92)) return 0;
        });
        /* he takes it, turns, crosses the room, and throws. The arc is cut in
           two at the pane so the crossing lands on the cue's own value rather
           than wherever a single smoothstep happens to put it: the first pass
           broke the glass eleven hundredths after the sound. */
        const walk = ss(0.32, 0.56, u);
        const mx = lerp(66, 96, walk);
        /* the hand the thing is in swings across him as he turns, so the
           handover, the carry and the throw are one continuous hold */
        const hx = mx + lerp(-14, 15, walk), hy = GY - lerp(34, 36, walk);
        const toGlass = ss(0.56, 0.66, u), beyond = clamp01((u - 0.66) / 0.24);
        let tx, ty;
        if (beyond > 0) {
          tx = lerp(EX, 232, beyond);
          ty = EY + beyond * 26 - Math.sin(beyond * 2.2) * 14;
        } else if (toGlass > 0) {
          tx = lerp(hx, EX, toGlass);
          ty = lerp(hy, EY, toGlass) - Math.sin(toGlass * Math.PI) * 20;
        } else {
          tx = lerp(44, hx, pass); ty = lerp(88, hy, pass);
        }
        const moving = walk > 0.03 && walk < 0.97;
        F.fig(mx, GY, 52, {
          mode: moving ? "walk" : "stand", face: walk > 0.03 ? 1 : -1, guise: "poet",
          phase: moving ? u * 7.35 : u * 1.7, weight: 0.34,
          headTurn: walk > 0.03 ? 0.45 : -0.4,
          arms: "reach", gesture: toGlass > 0.02 ? [17, 44] : [tx - mx, GY - ty],
        }, 7);
        if (tx < 200) tambourine(F, tx, ty, 9, u * TAU * 2, 7, 8, 3);
        if (beyond > 0) {
          /* the cracks fork out of the point of exit; a crack that is a
             straight ray is a spoke, and a wheel is not a broken window */
          const R = F.rng(7);
          for (let k = 0; k < 14; k++) {
            const a = R() * TAU, r0 = 5 + R() * 5, len = beyond * (26 + R() * 50);
            let px = EX + Math.cos(a) * r0, py = EY + Math.sin(a) * r0;
            for (let s = 0; s < 3; s++) {
              const aa = a + (R() - 0.5) * 0.55;
              const qx = px + Math.cos(aa) * len / 3, qy = py + Math.sin(aa) * len / 3;
              F.line(px, py, qx, qy, 6, 1); px = qx; py = qy;
            }
          }
          /* and the pane comes out in pieces, which fall and stay fallen */
          for (let k = 0; k < 11; k++) {
            const sx = WX + 6 + ((k * 37) % (WW - 12));
            const t = clamp01((u - 0.66 - k * 0.013) / 0.26);
            const yy = Math.min(GY - 2, WY + 8 + ((k * 53) % (WH - 22)) + t * t * 130);
            const w = 3 + (k % 3);
            F.line(sx, yy, sx + w, yy + w * 0.8, 6, 1.6);
          }
        }
      },
    },
  ],
};
