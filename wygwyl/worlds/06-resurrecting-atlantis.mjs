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
   meaning IS that it has no gap in it.

   "LEAVING BEHIND CROSSHAIRS FOR CONTINUUMS" is built literally in M5: a
   scope reticle (four arms that stop short of the centre) is, cell by cell
   on the Bayer schedule, REPLACED by a ring at the same radius — a shape
   with no ends and no gap. The same swap stands in for "strains for
   serendipity" too: a taut, aimed thing loosening into an endless one is one
   mechanism, not two, so no second image was built for the second clause.

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
   a loop. soul marks the one comet that is this film's single accent. */
function comet(F, u, ts, te, x0, y0, x1, y1, l, soul) {
  if (u < ts || u > te + 0.05) return;
  const p = clamp01((u - ts) / (te - ts));
  for (let k = 0; k < 8; k++) {
    const pk = p - k * 0.02;
    if (pk < 0) break;
    F.disc(lerp(x0, x1, pk), lerp(y0, y1, pk), Math.max(0.5, 1.7 - k * 0.18), Math.max(1, l - k));
  }
  if (soul && p < 1) F.put(Math.round(lerp(x0, x1, p)), Math.round(lerp(y0, y1, p)), 8);
}

export default {
  n: "06", slug: "06-resurrecting-atlantis", title: "RESURRECTING ATLANTIS",
  tagline: "a city comes up out of the water",
  accent: "#5aa7ff", seed: 606,
  /* higher and brighter than anything else in the suite, per the note this
     is the one utopia — and the only drone that only ever climbs */
  drone: { base: 64, steps: [0, 3, 7, 9, 12, 16, 19], bright: true },
  movements: [
    {
      label: "THE COMETS", seconds: 13,
      line: "Poets, who eased generations down yellow brick roads — and plucked our souls out of their secret places, to follow comets to the capital city of our collective consciousness.",
      cues: [
        { at: 0.12, f: 660, decay: 0.22, gain: 0.42, partials: [1, 2.4, 3.9], noise: 0.5, nDecay: 0.015, seed: 611 },
        { at: 0.42, f: 520, decay: 0.24, gain: 0.40, partials: [1, 2.3, 3.7], noise: 0.5, nDecay: 0.015, seed: 612 },
        { at: 0.75, f: 780, decay: 0.20, gain: 0.46, partials: [1, 2.5, 4.1], noise: 0.55, nDecay: 0.012, seed: 613 },
      ],
      draw(u, F) {
        const VPX = 96, VPY = 40;
        /* the sky the road runs to. Sparser than a full night — this is a
           rumour of a city, not the city yet */
        const S = F.rng(60);
        for (let k = 0; k < 60; k++) {
          const sx = Math.round(S() * F.W), sy = Math.round(S() * VPY);
          F.ink(sx, sy, S() > 0.82 ? 3 : 1);
        }
        const waterY = lerp(30, 38, smooth(u));
        cityscape(F, waterY, u, 0.14);
        /* YELLOW BRICK ROAD. A perspective ladder like 01's hallway, but with
           joints ticked across the nearer rows so it reads as paving and not
           just converging lines — the first pass was rails with no ties and
           looked like a train track, not a road generations walk down. */
        for (let k = 0; k < 13; k++) {
          const t = k / 12, y = lerp(VPY + 4, 144, Math.pow(t, 1.6)), half = lerp(3, 72, t);
          F.line(96 - half, y, 96 + half, y, 4, 1);
          if (t > 0.5) for (let bx = -half; bx < half; bx += lerp(14, 7, t)) F.ink(96 + bx, y - 1, 3);
        }
        F.line(VPX - 2, VPY, VPX - 74, 144, 4, 1);
        F.line(VPX + 2, VPY, VPX + 74, 144, 4, 1);
        /* generations, walking away from us and down toward the city */
        for (let i = 0; i < 6; i++) {
          const t = 0.12 + i * 0.16, y = lerp(VPY + 6, 140, Math.pow(t, 1.6)), h = lerp(4, 24, t);
          const x = 96 + Math.sin(i * 2.1) * lerp(2, 24, t) * 0.35;
          F.fig(x, y, h, { mode: "walk", phase: u * 3 + i * 0.4, face: 1, lean: 0.03 }, 6);
          /* PLUCKED FROM THEIR SECRET PLACES: a soul lifts straight off two
             of the walkers and does not come back down — it is taken, not
             dropped and re-caught */
          if (i === 2 || i === 4) {
            const t2 = ss(0.10 + i * 0.05, 0.55 + i * 0.05, u);
            if (t2 > 0.01 && t2 < 0.97) F.disc(x, y - h * 0.9 - t2 * 30, 1.0, 5);
          }
        }
        /* three comets converging on the capital dome's tip, one carrying
           this film's single accent — the soul the poem names */
        comet(F, u, 0.05, 0.55, 8, -8, 100, 22, 6, false);
        comet(F, u, 0.20, 0.68, 186, 2, 100, 22, 6, false);
        comet(F, u, 0.34, 0.86, 150, -12, 100, 22, 6, true);
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
          F.fig(x, waterY, 15, { mode: "walk", phase: u * 4 + i, face: 1 }, 6);
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
      cues: [
        { at: 0.20, f: 660, decay: 0.30, gain: 0.40, partials: [1, 2.0, 3.0], noise: 0.20, nDecay: 0.02, seed: 651 },
        { at: 0.50, f: 880, decay: 0.35, gain: 0.40, partials: [1, 2.0, 3.0], noise: 0.20, nDecay: 0.02, seed: 652 },
        { at: 0.80, f: 1100, decay: 0.40, gain: 0.42, partials: [1, 2.0, 3.0], noise: 0.15, nDecay: 0.02, seed: 653 },
      ],
      draw(u, F) {
        cityscape(F, 999, u, 0.55);   // fully surfaced now; waterY plays no further part
        groundLine(F, 999);
        /* the marks that were aiming at something — comet targets, the
           city's own old reticles — scattered through the sky and the
           streets, each on its own clock so the frame holds crosshairs and
           continuums at once rather than cutting between them */
        const CROSS = [
          [20, 22, 5], [46, 14, 4], [150, 18, 5], [172, 28, 4],
          [34, 60, 6], [64, 40, 5], [124, 36, 6], [158, 56, 5],
          [14, 96, 5], [178, 100, 5], [60, 112, 4], [132, 108, 4],
          [96, 50, 6], [96, 130, 5],
        ];
        for (let k = 0; k < CROSS.length; k++) {
          const [cx, cy, arm] = CROSS[k];
          const start = (k / CROSS.length) * 0.55;
          crossRing(F, cx, cy, arm, ss(start, start + 0.22, u), 6);
        }
        /* the one figure the line is spoken in — not the crowd's "we" but a
           single "I," standing still while everything around it resolves */
        F.fig(96, GY, 34, { mode: "stand", arms: "open" }, 7);
        const R = F.rng(65);
        for (let i = 0; i < 5; i++) F.fig(18 + i * 40 + R() * 10, GY, 13 + R() * 4, { mode: "stand", arms: "down" }, 5);
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
        cityscape(F, 999, u, 0.72);   // richest window count in the film — fully back on life
        groundLine(F, 999);
        /* BORN IN UNISON: one shared beat decides every figure's arms at
           once, so the crowd moves as a single gesture rather than each
           person animating on their own clock — that IS unison as a
           mechanism, not a description of one */
        const up = Math.sin(u * TAU * 1.4) > 0.55;
        const R = F.rng(66);
        for (let i = 0; i < 9; i++) {
          const x = 10 + i * 20 + R() * 6;
          F.fig(x, GY, 19 + R() * 4, { mode: "stand", arms: up ? "up" : "open", face: i % 2 ? 1 : -1 }, 6);
        }
        for (let i = 0; i < 8; i++) {
          const x = 20 + i * 20 + R() * 6;
          F.fig(x, GY - 17, 13 + R() * 3, { mode: "stand", arms: up ? "up" : "open" }, 5);
        }
        /* the beacon: the same soul that departed on a comet in M1, now
           settled and lighting the tallest dome it was always headed for */
        const bx = CAPITAL.x + CAPITAL.w / 2, by = GY - CAPITAL.h;
        const glow = ss(0.0, 0.6, u);
        F.put(Math.round(bx), Math.round(by), 8);
        if (glow > 0.4) F.put(Math.round(bx) + 1, Math.round(by), 8);
        if (glow > 0.75) F.put(Math.round(bx), Math.round(by) - 1, 8);
      },
    },
  ],
};
