/* ============================================================================
   06 · RESURRECTING ATLANTIS — a WYGWYL halfworld

   THE WATERLINE DESCENDS, ONCE, ACROSS THE WHOLE FILM. One number — waterY —
   starts near the top of the frame in M1 (the city is a rumour: two spire
   tips) and is walked down, movement by movement, until it exits the bottom
   of the frame partway through M4 and never returns. Every building, every
   window, every crowd of people rides that single falling line — the same
   BUILD array and the same clip is reused in five different movements, the
   way BLOODLINES reused one graph in four costumes. The waterline itself is
   drawn as the one unbroken span the dot law allows, because its entire
   meaning IS that it has no gap in it — and in M1 it is also the horizon
   the sky ends at and the vanishing point the road runs to, because the
   yellow brick road is a causeway out over that water.

   "LEAVING BEHIND CROSSHAIRS FOR CONTINUUMS" is built literally in M5: a
   scope reticle (four arms that stop short of the centre) is, cell by cell
   on the Bayer schedule, REPLACED by a ring at the same radius — a shape
   with no ends and no gap — and each ring then widens away off the edges of
   the world, because a continuum that holds still is only a circle. The
   whole movement is seen through the last of those scopes: its aperture is
   the one that opens, until it is wider than the frame and there is no
   instrument left to look through. "Strains for serendipity" is the same
   release read in the body — a man who starts braced and ends open — rather
   than a second image built for the second clause.

   AND THE LAST MOVEMENT DRAWS THE CITY BY NOT DRAWING IT. M6 fills every
   cell the city is NOT — one number, one Bayer schedule, the whole night
   arriving at once — so the city is left standing as reserve, out of the
   blank page it was always on, which is what "born in unison, out of the
   purest of fictions" says. Its second clause is a count: one man walks in
   from the edge and is met at the middle of the plaza, and then ten more,
   until the ground the film spent five movements raising out of the water
   has twelve people standing on it.

   THE ONE UTOPIA IN THE SUITE. Populated on purpose — the plaza in the last
   movement is never one figure, it is a crowd that raises its arms
   together. The single accent (level 8) is one object seen twice: the spark
   a comet carries down in M1, the beacon lit on the tallest dome in M6.
   Rejected: giving every movement its own accent moment — the brief that
   comes with this world calls the accent budget "at most one thing," and a
   soul that only ever appears departing and arriving is that one thing.
   ========================================================================= */
import { TAU, lerp, clamp01, smooth, ss, win } from "../halfworld.mjs";

const GY = 142;   // the ground every building is anchored to, submerged or not

/* ---------------------------------------------------------------- the city
   Sixteen buildings, hand-placed once and reused in five movements (M1
   through M6) at whatever waterline that movement is at. Two-cell streets
   throughout — this is what makes them NARROW. The tenth building is the
   capital dome: it is the tallest thing in the film, the first tip to break
   the surface in M1 and the beacon's post in M6. */
const BUILD = [
  { x:  2, w:  9, h: 46,  roof: "flat"  },
  { x: 13, w: 12, h: 78,  roof: "dome"  },
  { x: 27, w:  8, h: 34,  roof: "spire" },
  { x: 37, w: 10, h: 100, roof: "spire" },
  { x: 49, w:  9, h: 52,  roof: "flat"  },
  { x: 60, w: 14, h: 118, roof: "dome"  },
  { x: 76, w:  8, h: 40,  roof: "spire" },
  { x: 86, w:  9, h: 66,  roof: "flat"  },
  { x: 97, w:  8, h: 84,  roof: "spire" },
  { x:107, w: 13, h: 134, roof: "dome"  },   // the capital dome
  { x:122, w:  8, h: 48,  roof: "flat"  },
  { x:132, w: 10, h: 74,  roof: "spire" },
  { x:144, w:  9, h: 42,  roof: "flat"  },
  { x:155, w: 13, h: 94,  roof: "dome"  },
  { x:170, w:  9, h: 58,  roof: "spire" },
  { x:181, w:  8, h: 36,  roof: "flat"  },
];
const CAPITAL = BUILD[9];

/* a straight run trimmed exactly at the current waterline. Rejected: gating
   whole walls on/off by a threshold on their base — at forty-odd cells tall
   that popped a wall into existence a full row at a time and the reveal
   read as a slide show instead of a rising tide. This is the one place the
   waterline is actually a hard geometric edge rather than a dissolve: it is
   a boundary that MOVES, not two substances swapping in place, so it is cut
   like NEVERMORE's sea/sand horizon rather than dithered on the Bayer clock. */
function clipLine(F, x0, y0, x1, y1, waterY, l, th = 1) {
  if (y0 >= waterY && y1 >= waterY) return;
  if (y0 < waterY && y1 < waterY) { F.line(x0, y0, x1, y1, l, th); return; }
  const t = (waterY - y0) / (y1 - y0);
  const cx = x0 + (x1 - x0) * t;
  if (y0 < waterY) F.line(x0, y0, cx, waterY, l, th); else F.line(cx, waterY, x1, y1, l, th);
}

/* windows, most dark, some candlelit. warmth is how much of the city has
   "come back to life" — low in M1's rumour, highest in M6's welcome. A lit
   window doesn't fade in, it FLICKERS: two discrete levels on a sine, the
   same kind of temporal oscillation the brief's own strobe example uses,
   never a bayer dissolve, because nothing here is one substance replacing
   another — it is a flame breathing. */
function windows(F, b, bodyTop, waterY, u, bIdx, warmth) {
  const cols = Math.max(1, Math.floor((b.w - 3) / 5));
  const rows = Math.max(1, Math.floor((GY - 6 - bodyTop) / 9));
  for (let r = 0; r < rows; r++) {
    const wy = bodyTop + 5 + r * 9;
    if (wy + 3 >= waterY || wy + 3 >= GY) continue;
    for (let c = 0; c < cols; c++) {
      const wx = b.x + 2 + c * 5;
      const n = F.noise(bIdx * 19 + c * 7, r * 13 + 3);
      if (n > 1 - warmth) {
        const ph = F.noise(bIdx * 5 + c, r * 5 + 1) * TAU;
        const flick = 0.5 + 0.5 * Math.sin(u * TAU * (1.6 + F.noise(bIdx + c, r) * 2.2) + ph);
        F.rect(wx, wy, 2.2, 3.2, flick > 0.42 ? 6 : 5);
      } else {
        F.box(wx, wy, 2.2, 3.2, 2, 1);
      }
    }
  }
}

function building(F, b, waterY, u, bIdx, warmth) {
  const apex = GY - b.h;
  const roofH = b.roof === "dome" ? b.w / 2 : b.roof === "spire" ? Math.min(b.w * 1.3, b.h * 0.4) : 3;
  const bodyTop = apex + roofH;
  if (bodyTop >= waterY) return;              // nothing of this one has surfaced yet
  clipLine(F, b.x, bodyTop, b.x, GY, waterY, 5, 1);
  clipLine(F, b.x + b.w, bodyTop, b.x + b.w, GY, waterY, 5, 1);
  /* the roof sits entirely above bodyTop, which is already above waterY, so
     unlike the walls it never needs a partial clip of its own */
  const cx = b.x + b.w / 2;
  if (b.roof === "spire") {
    F.line(b.x, bodyTop, cx, apex, 5, 1);
    F.line(b.x + b.w, bodyTop, cx, apex, 5, 1);
    F.put(Math.round(cx), Math.round(apex), 6);
  } else if (b.roof === "dome") {
    F.arc(cx, bodyTop, b.w / 2, Math.PI, TAU, 5, 1.4);
    F.line(cx, apex, cx, apex - 3, 5, 1);
  } else {
    F.line(b.x - 1, bodyTop, b.x + b.w + 1, bodyTop, 5, 1);
  }
  windows(F, b, bodyTop, waterY, u, bIdx, warmth);
  if (waterY >= GY) F.rect(cx - 1, GY - 5, 2, 5, 4);   // a doorway, once dry land reaches it
}

function cityscape(F, waterY, u, warmth) {
  for (let i = 0; i < BUILD.length; i++) building(F, BUILD[i], waterY, u, i, warmth);
}

/* the water itself: the waterline is unbroken (see header), the ripples
   under it are broken twice per row exactly like every other floor in the
   suite. Rows are spaced across the WHOLE remaining depth rather than a
   fixed few near the surface — the first pass put three rows right under
   the line and left the rest of the frame bare paper, which at high water
   (waterY near the top, M1-M2) meant most of the picture was empty and read
   as a bug rather than a sea. */
function waterBelow(F, waterY, u) {
  if (waterY >= F.H) return;
  F.line(0, waterY, F.W, waterY, 5, 1);
  const depth = F.H - waterY;
  const rows = Math.max(2, Math.min(12, Math.round(depth / 9)));
  for (let r = 0; r < rows; r++) {
    const t = rows > 1 ? r / (rows - 1) : 0;
    const ry = waterY + 4 + t * (depth - 6) + Math.sin(u * TAU * 0.35 + r * 1.7) * 1.0;
    if (ry >= F.H) continue;
    const lvl = t < 0.4 ? 3 : 2;
    const gA = 10 + (r * 53) % 150;
    for (let x = 0; x < F.W; x += 3) {
      if (x > gA && x < gA + 20) continue;
      F.ink(x, Math.round(ry), lvl); F.ink(x + 1, Math.round(ry), lvl);
    }
  }
}
function groundLine(F, waterY) {
  if (waterY < GY) return;
  F.line(0, GY, 60, GY, 4, 1); F.line(70, GY, 130, GY, 4, 1); F.line(140, GY, F.W, GY, 4, 1);
}

/* THE CITY'S OWN OUTLINE, COLUMN BY COLUMN — the y of the highest ink this
   column carries, following the actual roof rather than a bounding box, so a
   dome is a dome and a spire is a spire. M6 fills everything above it, which
   is how that movement draws the city: as the part of the page the night is
   not allowed to have. Columns in the two-cell streets between buildings
   belong to no building and return the ground, so the night comes all the way
   down those and they read as the narrow streets M4 already named. */
function skylineY(x) {
  for (const b of BUILD) {
    if (x < b.x || x > b.x + b.w) continue;
    const apex = GY - b.h;
    const roofH = b.roof === "dome" ? b.w / 2 : b.roof === "spire" ? Math.min(b.w * 1.3, b.h * 0.4) : 3;
    const bodyTop = apex + roofH, cx = b.x + b.w / 2, half = b.w / 2;
    if (b.roof === "dome") {
      const dx = Math.abs(x - cx);
      return bodyTop - Math.sqrt(Math.max(0, half * half - dx * dx));
    }
    if (b.roof === "spire") return bodyTop - roofH * (1 - Math.min(1, Math.abs(x - cx) / half));
    return bodyTop;
  }
  return GY;
}

/* a small round window with a face in it — the "illuminating smiles" of M3.
   Rejected: putting the face on a whole figure's head, which at this scale
   is under two cells wide and cannot hold two eyes and a mouth. A window is
   already a frame; it only needed something looking back through it. */
function facewindow(F, cx, cy, r, u, ph) {
  const flick = 0.5 + 0.5 * Math.sin(u * TAU * 1.8 + ph);
  F.ring(cx, cy, r, flick > 0.4 ? 6 : 5, 1.3);
  F.disc(cx - r * 0.35, cy - r * 0.2, 0.75, 7);
  F.disc(cx + r * 0.35, cy - r * 0.2, 0.75, 7);
  F.arc(cx, cy + r * 0.1, r * 0.5, 0.18 * Math.PI, 0.82 * Math.PI, 7, 1);
}

/* the admission gate. Its threshold sits AT waterY rather than at a fixed
   ground height — the first pass anchored it to GY and it stayed invisible,
   fully submerged, for two thirds of the movement it is the subject of.
   Anchoring it to the shoreline means it is always exactly where the city's
   edge currently is, which is also just true: that is where an arrival
   happens. */
function gate(F, waterY) {
  const gw = 30, x0 = 96 - gw / 2, x1 = 96 + gw / 2, top = waterY - 24;
  F.line(x0, top, x0, waterY, 6, 1.6);
  F.line(x1, top, x1, waterY, 6, 1.6);
  F.arc(96, top, gw / 2, Math.PI, TAU, 6, 1.6);
  F.line(x0 + 3, top + 2, x0 + 3, waterY - 1, 4, 1);
  F.line(x1 - 3, top + 2, x1 - 3, waterY - 1, 4, 1);
  F.line(x0 - 5, waterY, x0 - 1, waterY, 5, 1);
  F.line(x1 + 1, waterY, x1 + 5, waterY, 5, 1);
}

/* THE SHAPE SUBSTITUTION. A crosshair — four arms, none of them touching the
   centre — and a ring occupy the SAME small patch of cells. r_k is a plain
   0..1 progress; which of the two shapes a given cell shows is decided by
   comparing r_k to THAT CELL's own Bayer value, so the swap happens dot by
   dot rather than as one snap at r_k=0.5. A cell belonging to only the old
   shape simply stops being drawn once its dot's turn comes; a cell
   belonging to only the new one starts. Rejected: cross-fading the two
   ink levels at one shared set of coordinates — the whole point is that the
   shapes themselves are different, not just their darkness. */
function crossRing(F, cx, cy, arm, rK, l) {
  const gap = Math.max(1.3, arm * 0.30), R = arm;
  const lo = Math.floor(cx - R - 1), hi = Math.ceil(cx + R + 1);
  const loY = Math.floor(cy - R - 1), hiY = Math.ceil(cy + R + 1);
  for (let y = loY; y <= hiY; y++) for (let x = lo; x <= hi; x++) {
    const dx = x - cx, dy = y - cy;
    const isCross = (Math.abs(dy) < 0.9 && Math.abs(dx) > gap && Math.abs(dx) <= arm) ||
                    (Math.abs(dx) < 0.9 && Math.abs(dy) > gap && Math.abs(dy) <= arm);
    const isRing = Math.abs(Math.hypot(dx, dy) - R) < 0.9;
    if (!isCross && !isRing) continue;
    if (F.bayer(x, y) < rK) { if (isRing) F.ink(x, y, l); }
    else { if (isCross) F.ink(x, y, l); }
  }
}

/* a comet: a shrinking, dimming trail of discs along a straight fall, active
   only inside its own [ts,te] window so it reads as one arrival rather than
   a loop. soul marks the one comet that is this film's single accent.

   THE TAIL IS LONG ENOUGH TO BE A TAIL. The first pass ran eight discs at
   two hundredths of the path apart and dimmed them to level 1 — a comet
   sixteen cells long that vanished entirely once the sky behind it was
   given a tone, in the movement named after them. Fourteen discs over a
   quarter of the fall, floored at level 3, is a streak you can see crossing
   a night. */
function comet(F, u, ts, te, x0, y0, x1, y1, l, soul) {
  if (u < ts || u > te) return;
  const p = clamp01((u - ts) / (te - ts));
  for (let k = 0; k < 14; k++) {
    const pk = p - k * 0.024;
    if (pk < 0) break;
    F.disc(lerp(x0, x1, pk), lerp(y0, y1, pk), Math.max(0.55, 1.9 - k * 0.22),
           Math.max(3, l - Math.floor(k * 0.42)));
  }
  if (soul) F.put(Math.round(lerp(x0, x1, p)), Math.round(lerp(y0, y1, p)), 8);
}

export default {
  n: "06", slug: "06-resurrecting-atlantis", title: "RESURRECTING ATLANTIS",
  tagline: "a city comes up out of the water",
  accent: "#5aa7ff", seed: 606,
  /* THE FILM'S OWN PASSAGE of the suite's 24-minute score, taken from the
     original running order. The runtime stretches this film's movements to
     fill it, so picture and record line up without either being cut. */
  window: [513.212, 623.452],
  /* higher and brighter than anything else in the suite, per the note this
     is the one utopia — and the only drone that only ever climbs */
  /* KEY: G Lydian, bright — the raised 4th is the city coming up out of the
     water; paired with 11 as the suite's highest, lightest register. */
  drone: { base: 98.00, steps: [0, 0, 2, 6, 4, 9, 12], bright: true },
  /* PROSODY · Algerian Sahara · Ahellil. One voice becomes many. The ground rises to 0.95 because the ground IS the
     others arriving, and by the end the protagonist is one body among them
     rather than a soloist with an accompaniment.
     `deep/sonify.mjs` scans the field under this law. The root is the drone's
     own base folded into one octave, so the film sings in the key it hums in. */
  score: { engine: "ahellil", mode: "dorian" },
  movements: [
    {
      label: "THE COMETS", seconds: 13,
      line: "Poets, who eased generations down yellow brick roads — and plucked our souls out of their secret places, to follow comets to the capital city of our collective consciousness.",
      /* the three landings, and nothing else: each cue is a comet reaching
         the dome, so the bell and the arrival are the same event */
      cues: [
        { at: 0.55, f: 660, decay: 0.22, gain: 0.42, partials: [1, 2.4, 3.9], noise: 0.5, nDecay: 0.015, seed: 611 },
        { at: 0.70, f: 520, decay: 0.24, gain: 0.40, partials: [1, 2.3, 3.7], noise: 0.5, nDecay: 0.015, seed: 612 },
        { at: 0.92, f: 780, decay: 0.34, gain: 0.50, partials: [1, 2.5, 4.1], noise: 0.55, nDecay: 0.012, seed: 613 },
      ],
      draw(u, F) {
        /* THE ROAD IS A CAUSEWAY. This film's whole geography is one falling
           waterline, so the road that generations were eased down runs out
           ACROSS the water to a city still under it — its vanishing point is
           the waterline itself, and it moves down with it. Rejected: a road
           on dry paper with the sea nowhere in the frame, which made M1 the
           only movement in the film that was not about water. */
        const waterY = lerp(30, 38, smooth(u));
        const NEAR = waterY + 2, DEEP = 146;
        /* ONE DEPTH MAPPING FOR THE WHOLE MOVEMENT. d = 1 is the brick under
           our own feet and d = 0 is the city gate; the road's width, its
           courses, and every walker's station and height are all read off
           it. The first pass spaced the rungs on one curve and drew the
           road's edges on another, so the rungs' ends missed the kerb by a
           few cells all the way down and the walkers stood a little beside
           the road rather than on it. */
        const DY = (d) => lerp(NEAR, DEEP, Math.pow(d, 1.6));
        const HW = (y) => lerp(2.5, 74, (y - NEAR) / (DEEP - NEAR));
        const SZ = (y) => lerp(3.5, 30, (y - NEAR) / (DEEP - NEAR));
        /* NIGHT AS A TONE, NOT BARE PAPER WITH SPECKS ON IT. The sky is laid
           down as a field and the stars are cut OUT of it, which is how a
           woodcut has always made a star. Its lower edge is the waterline —
           the one unbroken full-width span this world allows itself, for the
           reason the header gives — so the tone ends where the sea begins
           and nowhere else. */
        F.rect(0, 0, F.W, waterY, 1);
        const S = F.rng(60);
        for (let k = 0; k < 60; k++) {
          F.disc(Math.round(S() * F.W), Math.round(S() * (waterY - 4)), S() > 0.82 ? 1.2 : 0.6, 0, true);
        }
        cityscape(F, waterY, u, 0.14);
        /* THE COLLECTIVE CONSCIOUSNESS FILLS. The souls plucked off the road
           below go up into it and stay, and in an ink field a thing that is
           filling gets DARKER — so the sky is walked from level 1 to level 3
           on the ordered schedule across the whole movement, dot by dot, and
           only where it is still sky: the cut stars and the city's own ink
           are left exactly where they are. Rejected: a drift of separate
           motes standing in for the souls arriving, which at this scale is
           grit on the lens. The tone IS the count. */
        const filled = ss(0.04, 0.96, u);
        const lv = 1 + filled * 2.2, lo = Math.floor(lv), fr = lv - lo;
        F.map((x, y, v) => {
          if (v === 1 && y < waterY) return F.bayer(x, y) < fr ? lo + 1 : lo;
        });
        waterBelow(F, waterY, u);
        /* YELLOW BRICK ROAD, AS A SURFACE AND NOT A LADDER. Laid down over
           the sea with `set`, so the swell stops at its kerb; mottled two
           cells at a time, coursed, and jointed between courses with the
           bond staggered. The first pass drew rungs between two rails with
           nothing in between, which is a railway, not a road. */
        for (let y = Math.ceil(NEAR); y < F.H; y++) {
          const half = HW(y), x0 = Math.max(0, Math.round(96 - half));
          for (let x = x0; x <= 96 + half && x < F.W; x++) {
            F.put(x, y, F.noise(x >> 1, y >> 1) > 0.74 ? 2 : 1);
          }
        }
        for (let k = 0; k <= 13; k++) {
          const y = DY(k / 13), half = HW(y), yN = DY(Math.min(1, (k + 1) / 13));
          const bw = lerp(3.2, 16, (y - NEAR) / (DEEP - NEAR));
          for (let bx = -half + (k % 2 ? bw * 0.5 : 0); bx < half; bx += bw) {
            const x0 = Math.max(-half, bx), x1 = Math.min(half, bx + bw - 2.4);
            if (x1 - x0 > 0.6) F.line(96 + x0, y, 96 + x1, y, 3, 1);
            if (k < 13 && bx > -half + 0.5) F.line(96 + bx, y + 1, 96 + bx * HW(yN) / HW(y), yN - 1, 2, 1);
          }
        }
        F.line(96 - HW(NEAR), NEAR, 96 - HW(DEEP), DEEP, 4, 1);
        F.line(96 + HW(NEAR), NEAR, 96 + HW(DEEP), DEEP, 4, 1);
        /* GENERATIONS, EASED DOWN. Twelve of them at one shared pace, stationed
           from the gate back past the bottom edge of the frame, so the road
           empties from the front and fills again from behind us for the
           whole movement: the word in the line is plural and it is a plural
           that does not run out. Rejected: six bodies at a pace proportional
           to what each had left, so that they would arrive together — they
           bunched into one black lump at the vanishing point, which is what
           six people converging on four cells looks like. */
        const D0 = [0.30, 0.45, 0.60, 0.76, 0.92, 1.08, 1.24, 1.40, 1.56, 1.72, 1.88, 2.04];
        for (let i = 0; i < D0.length; i++) {
          const d = D0[i] - u * 0.92;
          if (d < 0.03 || d > 1.12) continue;         // through the gate, or not yet past us
          const y = DY(d), h = Math.min(34, SZ(y));
          const x = 96 + Math.sin(i * 2.1) * HW(y) * 0.42;
          F.fig(x, y, h, { mode: "walk", phase: u * 5.35 + i * 0.6, face: 1, lean: 0.03, headTurn: 0.28 }, 6);
          /* PLUCKED OUT OF THEIR SECRET PLACES: it leaves the body once and
             goes up into the sky that is filling — taken, not dropped and
             re-caught, so nothing here ever descends but the comets. */
          const t2 = ss(0.04 + i * 0.09, 0.54 + i * 0.09, u);
          if (t2 > 0.01) F.disc(x, y - h * 0.92 - t2 * (y + 14), Math.max(0.7, 1.7 - t2), 5);
        }
        /* three comets converging on the capital dome's own tip, one
           carrying this film's single accent — the soul the poem names,
           which is left standing on that dome and will be the beacon lit on
           it in M6. Their throws are shallow and start at the frame's own
           edges: the sky here is thirty cells deep, so a comet lobbed from
           high above it spends four fifths of its window off the top and
           arrives as a dot with no streak behind it, which is what the
           first pass of this movement did three times over. */
        const tipX = CAPITAL.x + CAPITAL.w / 2, tipY = GY - CAPITAL.h + 5;
        comet(F, u, 0.06, 0.55, -12, 2, tipX, tipY, 7, false);
        comet(F, u, 0.26, 0.70, 206, 5, tipX, tipY, 7, false);
        comet(F, u, 0.46, 0.92, 22, 0, tipX, tipY, 7, true);
        if (u > 0.92) F.put(Math.round(tipX), Math.round(tipY), 8);
      },
    },
    {
      label: "THE WATERLINE FALLS", seconds: 15,
      line: "Resurrecting Atlantis. Here we are all one — the pact we've made here with nature, abandoned and hoped for the best, back on life.",
      cues: [
        { at: 0.05, f: 180, decay: 0.6, gain: 0.50, partials: [1, 2.01, 3.02, 4.04], noise: 0.30, nDecay: 0.08, seed: 621 },
        { at: 0.50, f: 220, decay: 0.7, gain: 0.50, partials: [1, 2.01, 3.02, 4.04], noise: 0.25, nDecay: 0.08, seed: 622 },
        { at: 0.85, f: 262, decay: 0.8, gain: 0.50, partials: [1, 2.0, 3.0, 4.0], noise: 0.20, nDecay: 0.06, seed: 623 },
      ],
      draw(u, F) {
        /* THE RECKONING MOVEMENT. Forty-four cells of waterline fall over
           fifteen seconds — nothing else in this world moves that far. The
           first pass eased it with smooth() and the reveal read as gentle
           when the line is a resurrection, an event; a plain lerp on u gives
           it a steadier, more deliberate descent. */
        const waterY = lerp(38, 92, u);
        cityscape(F, waterY, u, 0.24);
        waterBelow(F, waterY, u);
        /* HERE WE ARE ALL ONE: people arriving stand exactly at the current
           shoreline, so the crowd and the falling water are the same event
           — they are not walking toward the city, the city is rising to
           meet them where they already stand. */
        /* figures at this scale need real height before two legs read as
           two legs rather than one merged stroke — the first pass held them
           to nine or ten cells and the whole crowd read as a row of small
           crosses, which is exactly the shape M5 later means something by */
        const R = F.rng(62);
        for (let i = 0; i < 9; i++) {
          const x = 12 + i * 21 + (R() - 0.5) * 6;
          F.fig(x, waterY, 15 + R() * 4, { mode: "stand", arms: i % 3 ? "open" : "down", face: R() > 0.5 ? 1 : -1 }, 6);
        }
      },
    },
    {
      label: "ADMISSION", seconds: 14,
      line: "A relearned currency, we reassess as the admission. But here we are all safe. An unfamiliar, flickering candle light, illuminating smiles at night.",
      cues: [
        { at: 0.18, f: 1200, decay: 0.10, gain: 0.35, partials: [1, 2.6, 4.3], noise: 0.6, nDecay: 0.010, seed: 631 },
        { at: 0.50, f: 1100, decay: 0.10, gain: 0.35, partials: [1, 2.6, 4.3], noise: 0.6, nDecay: 0.010, seed: 632 },
        { at: 0.78, f: 440, decay: 0.50, gain: 0.40, partials: [1, 2.0, 3.0], noise: 0.15, nDecay: 0.04, seed: 633 },
      ],
      draw(u, F) {
        const waterY = lerp(92, 118, smooth(u));
        cityscape(F, waterY, u, 0.40);
        waterBelow(F, waterY, u);
        gate(F, waterY);
        /* the relearned currency: a coin carried up the queue and set down.
           Rejected: hands exchanging it mid-air — at this scale two stick
           hands meeting read as a knot, not a transaction. The coin arriving
           at the booth on its own IS the transaction. */
        const booth = { x: 62, y: waterY - 7 };
        F.box(booth.x - 4, booth.y, 9, 6, 5, 1);
        for (let k = 0; k < 3; k++) F.ring(booth.x - 1 + k * 3, booth.y - 2, 1.2, 6, 1);
        for (let i = 0; i < 5; i++) {
          const p = clamp01(u * 1.1 - i * 0.12);
          const x = lerp(20, 74, p);
          F.fig(x, waterY, 15, { mode: "walk", phase: u * 4.35 + i, face: 1 }, 6);
          if (p > 0.85) F.ring(lerp(x + 4, booth.x + 5, ss(0.85, 1, p)), waterY - 8, 1.1, 6, 1);
        }
        /* here we are all safe: the ones already through, small, warm */
        for (let i = 0; i < 5; i++) {
          const x = 82 + i * 6, y = waterY - 3 - (i % 2) * 3;
          F.fig(x, y, 12, { mode: "stand", arms: "down" }, 5);
        }
        /* illuminating smiles at night: two lantern-windows on the gate
           itself, each with a face flickering behind it */
        facewindow(F, 96 - 21, waterY - 15, 5, u, 0.4);
        facewindow(F, 96 + 21, waterY - 15, 5, u, 2.1);
      },
    },
    {
      label: "NARROW STREETS", seconds: 13,
      line: "Where shadows cast from narrow streets beaming with love — in the joyful noises that color rainbows, and give us infinite time to heal, and set clouds free.",
      cues: [
        { at: 0.15, f: 340, decay: 0.4, gain: 0.40, partials: [1, 1.5, 2.0, 3.0], noise: 0.5, nDecay: 0.15, seed: 641 },
        { at: 0.55, f: 500, decay: 0.5, gain: 0.40, partials: [1, 1.5, 2.2, 3.3], noise: 0.4, nDecay: 0.10, seed: 642 },
      ],
      draw(u, F) {
        /* the city finishes surfacing mid-movement, on a plain lerp so
           "infinite time to heal" gets a slow, steady finish rather than an
           eased one that lingers at the top and rushes the last cells */
        const waterY = lerp(118, 170, u);
        cityscape(F, waterY, u, 0.50);
        waterBelow(F, waterY, u);
        groundLine(F, waterY);
        /* SHADOWS CAST FROM NARROW STREETS: the streets themselves are the
           source, so each gap between two buildings is filled with diagonal
           hatch rather than lit ground — a shadow that is the street, not a
           shape thrown across it. Rejected: a wedge cast sideways from one
           wall, which needed a light source this film never otherwise
           defines and looked like an explanation rather than a fact. */
        for (let i = 1; i < BUILD.length; i += 2) {
          const gx0 = BUILD[i - 1].x + BUILD[i - 1].w, gx1 = BUILD[i].x;
          if (gx1 - gx0 < 2) continue;
          const depth = 20 + F.n2(i, 3) * 8;
          for (let gx = gx0; gx < gx1; gx += 2)
            F.line(gx, GY, gx + 4, GY - depth, 3, 1);
        }
        /* JOYFUL NOISES THAT COLOR RAINBOWS: seven arcs, one per ink level —
           the level ladder itself standing in for colour, since this engine
           has none. Rejected: one flat band at a single level, which read
           as a grey arch and not a rainbow at all. Also rejected: a huge
           radius centred far below the frame — the first pass only ever
           showed the very top sliver of that circle, which is nearly flat,
           and seven flat stacked lines read as a radar sweep, not a bow.
           This radius is small enough that both feet of the arc land inside
           the frame, so the curve itself is what is on screen. Arrives dot
           by dot on the Bayer schedule, like every dissolve here. */
        const reveal = ss(0.05, 0.55, u);
        for (let l = 1; l <= 7; l++) {
          const r = 27 + l * 3, cx = 96, cy = 48;
          const n = Math.max(8, Math.ceil(Math.PI * r * 1.4));
          for (let k = 0; k <= n; k++) {
            const a = Math.PI + (Math.PI * k) / n;
            const x = Math.round(cx + Math.cos(a) * r), y = Math.round(cy + Math.sin(a) * r);
            if (F.bayer(x, y) < reveal) F.ink(x, y, l);
          }
        }
        /* clouds, set free: they start low, among the spires, and rise
           straight off the top of the frame and do not come back */
        for (let c = 0; c < 3; c++) {
          const rise = clamp01((u - c * 0.12) * 0.9);
          const cy = lerp(46 - c * 6, -22, rise), cx = 40 + c * 55 + Math.sin(u * TAU * 0.3 + c) * 5;
          for (let k = 0; k < 5; k++) F.disc(cx + (k - 2) * 4.2, cy + Math.abs(k - 2) * 1.6, 3.2 - Math.abs(k - 2) * 0.4, 2);
        }
        /* the streets, lived in — small and unremarkable, which is the
           point; nobody here is a soloist */
        const R = F.rng(64);
        for (let i = 0; i < 6; i++) {
          const x = 10 + i * 30 + R() * 8;
          F.fig(x, GY, 13 + R() * 4, { mode: "walk", phase: u * 3.5 + i, face: R() > 0.5 ? 1 : -1 }, 5);
          if (i % 3 === 0) for (let j = 0; j < 4; j++) {
            const a = j / 4 * TAU + u * TAU * 0.6;
            F.line(x + Math.cos(a) * 3, GY - 9 + Math.sin(a) * 3, x + Math.cos(a) * 5.5, GY - 9 + Math.sin(a) * 5.5, 4, 1);
          }
        }
      },
    },
    {
      label: "CROSSHAIRS TO CONTINUUMS", seconds: 13,
      line: "I know my soul — and it could stay here forever. Leaving behind crosshairs for continuums, and strains for serendipity.",
      /* three cues, and each one is a reticle going whole: the swaps are
         timed to land on them rather than near them */
      cues: [
        { at: 0.16, f: 660, decay: 0.30, gain: 0.40, partials: [1, 2.0, 3.0], noise: 0.20, nDecay: 0.02, seed: 651 },
        { at: 0.46, f: 880, decay: 0.35, gain: 0.40, partials: [1, 2.0, 3.0], noise: 0.20, nDecay: 0.02, seed: 652 },
        { at: 0.76, f: 1100, decay: 0.55, gain: 0.44, partials: [1, 2.0, 3.0], noise: 0.15, nDecay: 0.02, seed: 653 },
      ],
      draw(u, F) {
        cityscape(F, 999, u, 0.55);   // fully surfaced now; waterY plays no further part
        groundLine(F, 999);
        /* the marks that were aiming at something — comet targets, the
           city's own old reticles — scattered through the sky and the
           streets, each on its own clock so the frame holds crosshairs and
           continuums at once rather than cutting between them */
        const CROSS = [
          [20, 22, 5], [150, 18, 5], [34, 60, 6], [124, 36, 6],
          [64, 40, 5], [158, 56, 5], [14, 96, 5], [178, 100, 5],
          [60, 112, 4], [132, 108, 4],
        ];
        for (let k = 0; k < CROSS.length; k++) {
          const [cx, cy, arm] = CROSS[k];
          const start = 0.04 + (k / CROSS.length) * 0.72;
          const sw = ss(start, start + 0.16, u);
          if (sw < 1) { crossRing(F, cx, cy, arm, sw, 6); continue; }
          /* AND THEN IT DOES NOT STOP. A ring already has the property the
             line wants — no ends, no gap — but a ring that holds still is
             only a ring; the continuum is that it keeps widening after the
             aim has been let go of. Rejected: floating them away upward,
             which reads as the continuum leaving rather than as the man
             staying inside it. Also rejected: fifty cells of growth apiece,
             which by the last third had the sky full of overlapping circles
             — a compass drawing, not a city. Each one now opens by its own
             ten to twenty-four and no two arrive at the same size. */
          F.ring(cx, cy, arm + ss(start + 0.16, start + 0.96, u) * (10 + (k % 3) * 7), 6, 1);
        }
        /* the one figure the line is spoken in — not the crowd's "we" but a
           single "I", inside the aperture from the first frame because he is
           the thing that stays. STRAINS FOR SERENDIPITY IS A BODY: he starts
           held — braced, weight jammed onto one leg, near hand tucked at the
           chest, chin down — and unclenches across the whole movement into a
           man standing level with an open hand and his head up. One number
           does all of it, the same number the scope opens on. */
        const open = smooth(clamp01((u - 0.08) / 0.86));
        const R = F.rng(65);
        for (let i = 0; i < 5; i++) F.fig(18 + i * 40 + R() * 10, GY, 13 + R() * 4, { mode: "stand", arms: "down" }, 5);
        F.fig(96, GY, 34, {
          mode: "stand", arms: "hold", guise: "poet", phase: u * 1.7,
          weight: lerp(0.16, 0.5, open), crouch: lerp(0.26, 0, open),
          headTilt: lerp(-0.35, 0.30, open),
          headTurn: Math.sin(u * TAU * 0.5) * 0.35,
          gesture: [lerp(4.5, -12, open), lerp(21, 27.5, open)],
        }, 7);
        /* THE SCOPE OPENS, AND IT IS THE LAST THING DRAWN. What the line
           leaves behind is not only the shape of a crosshair, it is looking
           at anything through one — so the movement begins inside the
           instrument, with the city dim outside a small aperture, and ends
           with the aperture wider than the frame. Outside, paper takes a
           tone and every drawn cell goes two levels darker, which keeps the
           skyline a silhouette instead of blanking it: the rest of the city
           is still there, it is only not being aimed at. Rejected: a solid
           black surround — 02's iris is that, and is a pupil; this is a
           barrel. The aperture is centred on the man, not on the frame,
           because what he could stay in forever is what the light widens to
           include. */
        const scopeR = lerp(36, 158, Math.pow(u, 0.86));
        F.map((x, y, v) => {
          const d = Math.hypot((x - 96) * 0.94, y - 108) - scopeR;
          if (d <= 0) return;
          if (F.bayer(x, y) < d / 5) return v > 0.5 ? Math.min(7, v + 2) : 3;
        });
      },
    },
    {
      label: "WELCOMING ALL", seconds: 14,
      line: "A city born in unison, out of the purest of fictions — welcoming me, and welcoming all.",
      cues: [
        { at: 0.10, f: 196, decay: 1.0, gain: 0.50, partials: [1, 2, 3, 4, 5], noise: 0.20, nDecay: 0.05, seed: 661 },
        { at: 0.50, f: 262, decay: 1.2, gain: 0.55, partials: [1, 2, 3, 4, 5, 6], noise: 0.15, nDecay: 0.04, seed: 662 },
        { at: 0.85, f: 392, decay: 1.5, gain: 0.55, partials: [1, 2, 3, 4, 5, 6], noise: 0.10, nDecay: 0.03, seed: 663 },
      ],
      draw(u, F) {
        /* BORN IN UNISON, OUT OF THE PUREST OF FICTIONS. The city is not
           drawn into this frame — everything that is NOT the city is, and
           what is left unfilled is therefore the city, born out of the blank
           page it was always standing on. One number and one Bayer schedule
           govern every cell of that night at once, which is what "in unison"
           has to be if it is a mechanism rather than a caption: not sixteen
           buildings arriving one after another, one arrival that the whole
           field takes part in. The fill starts at zero, so the film's last
           movement opens exactly where M5 closed it — a bright city, no
           night in it yet — and the birth is the eighteen seconds after.
           Rejected: the finished city held whole while the crowd bobbed its
           arms on a sine, which is what this movement was. The resolution of
           the film was the one photograph in it. */
        const born = ss(0.10, 0.74, u);
        /* the windows come on WITH the night. warmth is a threshold on fixed
           noise, so a rising warmth lights more of them and can never put one
           out: the count of lit windows only ever climbs, and that count is
           the welcome — by the last frame there is no dark window left. */
        cityscape(F, 999, u, 0.42 + born * 0.50);
        groundLine(F, 999);
        const bx = Math.round(CAPITAL.x + CAPITAL.w / 2), by = GY - CAPITAL.h;
        const halo = 3 + born * 4.5;
        const sky = [];
        for (let x = 0; x < F.W; x++) sky.push(skylineY(x));
        const lv = born * 3.2, lo = Math.floor(lv), fr = lv - lo;
        F.map((x, y, v) => {
          if (v > 0.5 || y >= sky[x]) return;
          /* the one place the night is not allowed to close: around the
             beacon, which is a light and therefore has to have a dark it is
             clearing rather than a dark it is sitting in */
          if (Math.hypot(x - bx, (y - by) * 1.15) < halo) return;
          return F.bayer(x, y) < fr ? lo + 1 : lo;
        });
        /* WELCOMING ME, AND WELCOMING ALL — the clause order is the staging.
           One man walks in from the edge and is met at the middle of the
           plaza on the second cue; then ten more, each entering from the
           edge it is nearest. The stations fill from the centre OUTWARD, so
           nobody ever crosses in front of somebody already standing and the
           welcome spreads from the one it began with. The count is the
           movement: one body at the start, twelve at the end, and every one
           of them walked here. */
        const STATION = [78, 114, 60, 132, 42, 150, 26, 166, 10, 182];
        const rise = ss(0.85, 0.91, u);            // every arm, on the last cue
        const R = F.rng(66);
        for (let i = 0; i < STATION.length; i++) {
          /* the stream is read before anything can skip: a figure's height
             and build must not change because time passed */
          const r1 = R(), r2 = R();
          const p = clamp01((u - (0.26 + i * 0.042)) / 0.17);
          if (p <= 0) continue;
          const side = STATION[i] < 96 ? -1 : 1;
          F.fig(lerp(side < 0 ? -14 : 206, STATION[i], smooth(p)), GY, 19 + r1 * 5, {
            mode: p < 1 ? "walk" : "stand", face: -side,
            arms: rise > 0.5 ? "up" : p < 1 ? "swing" : "open",
            guise: i % 4 === 0 ? "elder" : "everyman", phase: u * 5.35 + i * 0.7,
            weight: p < 1 ? undefined : 0.28 + r2 * 0.44,
            headTilt: rise > 0.5 ? 0.30 + r2 * 0.2 : 0.05,
          }, 6);
        }
        const pw = clamp01(u / 0.50);
        F.fig(lerp(-16, 96, smooth(pw)), GY, 34, {
          mode: pw < 1 ? "walk" : "stand", face: 1, guise: "poet",
          arms: rise > 0.5 ? "up" : pw < 1 ? "swing" : "open",
          phase: u * 5.35, weight: pw < 1 ? undefined : 0.38,
          headTurn: pw < 1 ? 0.30 : 0, headTilt: lerp(0.15, 0.45, rise),
        }, 7);
        /* the beacon: the same soul that departed on a comet in M1, settled
           on the dome it was always headed for. It is spent as the film's
           accent twice and this is the second time; it strengthens with the
           night, because a light only becomes visible once there is a dark
           for it to be in. */
        F.put(bx, by, 8);
        if (born > 0.35) F.put(bx + 1, by, 8);
        if (born > 0.60) F.put(bx, by - 1, 8);
        if (born > 0.85) F.put(bx - 1, by, 8);
      },
    },
  ],
};
