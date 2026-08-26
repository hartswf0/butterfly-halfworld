/* ============================================================================
   13 · HOW TO WIN MY HEART — a WYGWYL halfworld

   ONE QUANTITY PER MOVEMENT, AND IT ONLY EVER GOES ONE WAY. The tide comes in
   under the small tables; the dark comes down over the counted orbits; the
   smoke goes up off the burning letters; the field goes down in front of the
   harvester; the picture comes into focus on the distant window. Every one of
   those is a number the line itself names, every one is a PICTURE rather than
   an inference, and not one of them turns round.

   The harbor is built as a single tonal pass — sky, mud, water, quay decided
   per cell in one map — so a tide is a moved boundary rather than a redrawn
   object, and so the same place can hold an afternoon, a dusk and a night
   without being drawn three times. That pass is also why this film is made of
   TONE: an earlier version drew the harbor as five broken rows of wavelets on
   bare paper and the frame came out 94% paper — a diagram of a harbor rather
   than a harbor, and a diagram cannot hold a tide.
   ========================================================================= */
import { TAU, lerp, clamp01, smooth, ss, win } from "../halfworld.mjs";

const HOR = 62, PIER = 122, SEAT = 134;
const TABLE_X = [34, 76, 118, 160];

/* ------------------------------------------------------------- THE HARBOR
   ONE MAP, FOUR SUBSTANCES. `tide` slides the mud/water boundary from 106 up
   to 70 — thirty-six rows of the field changing substance, which is the whole
   of M1's motion and none of it is an object moving. `dark` is folded into the
   same pass as an ordered-dither offset, so the night arrives dot by dot
   (the law's own dissolve) rather than as a level being turned up. The quay
   takes only a little over half the darkness: a harbor's stones hold the
   water's light after the sky has gone, and a body inked at 7 has to have
   somewhere to be legible. */
function harbor(F, u, tide, dark = 0) {
  const wl = lerp(106, 70, tide), dk = dark * 4, dq = dark * 2.2;
  const cloud = 1 - dark * 0.75;          // cloud contrast goes with the light
  F.map((x, y) => {
    const b = F.bayer(x, y);
    if (y < HOR) {
      const c = F.n2(x * 0.035, y * 0.055 + 4);
      return Math.min(7, Math.floor(1 + (c > 0.66 ? cloud : 0) + dk + b));
    }
    if (y >= PIER) {
      return Math.min(7, Math.floor(1 + (F.noise(x, y) > 0.90 ? 1 : 0) + dq + b));
    }
    /* the shoreline wanders — a ruled edge across 192 cells would stripe the
       frame under the halftone exactly as an unbroken bar does */
    const shore = wl + (F.n2(x * 0.05, 21) - 0.5) * 7;
    if (y < shore) {                                          // mud, and it is still
      const m = F.n2(x * 0.10, y * 0.22 + 9);
      return Math.min(7, Math.floor((m > 0.62 ? 5 : m > 0.30 ? 4 : 3) + dk * 0.7 + b));
    }
    /* water: the noise is stretched four to one, because a ripple is long and
       low and an isotropic mottle reads as ploughed earth. Its own contrast
       CLOSES as the light goes — at full dark the untouched three-level
       spread read as corrugated iron rather than as a harbor at night. */
    const w = F.n2(x * 0.030, y * 0.30 + u * 2.4);
    return Math.min(7, Math.floor((w > 0.58 ? 3 : w > 0.20 ? 2 : 1) * (1 - dark * 0.42) + dk + b));
  });
  return wl;
}

/* the quay edge, three runs — an unbroken 192-wide line is the one thing this
   world's halftone cannot take */
function pier(F, l) {
  F.line(0, PIER, 64, PIER + 1, l, 1); F.line(76, PIER + 1, 128, PIER, l, 1);
  F.line(140, PIER, 192, PIER + 1, l, 1);
}

/* a window as an OPENING, not an outline: the pane is stamped rather than
   inked, so one call gives a dark hole in a daylit shed and a lit one after
   dark, decided only by which level is brighter than the wall around it */
function litWindow(F, cx, cy, hw, hh, pane, frame) {
  F.rect(cx - hw, cy - hh, hw * 2, hh * 2, pane, true);
  F.box(cx - hw - 1, cy - hh - 1, hw * 2 + 2, hh * 2 + 2, frame, 1);
  F.line(cx, cy - hh, cx, cy + hh, frame, 1);
  if (hh > 9) F.line(cx - hw, cy, cx + hw, cy, frame, 1);
}

/* ---------------------------------------------------------- THE FAR SHORE
   The far side of the harbor, in three runs with the sheds on it, and the
   window this film ends at — ten cells wide here and forty in M5, which is
   the same window at the distance its own line gives it ("a distant window").
   After dark the shore is only its lit windows, because that is all a far
   shore is at night. */
function farShore(F, dark, withWindow = true) {
  const l = Math.min(7, 5 + Math.round(dark * 2));
  F.rect(0, HOR - 3, 60, 5, l); F.rect(68, HOR - 4, 56, 6, l); F.rect(132, HOR - 3, 60, 5, l);
  for (const [sx, sy, sw, sh] of [[14, 48, 20, 12], [46, 51, 13, 9], [96, 47, 22, 13]]) {
    F.rect(sx, sy, sw, sh, l);
    F.line(sx - 2, sy, sx + sw / 2, sy - 5, l, 1.4);
    F.line(sx + sw / 2, sy - 5, sx + sw + 2, sy, l, 1.4);
  }
  for (const mx of [76, 126]) { F.line(mx, HOR - 4, mx, 33, l, 1); F.line(mx - 5, 39, mx + 6, 37, l, 1); }
  if (withWindow) {
    F.rect(140, 40, 30, 22, l);
    F.line(138, 40, 155, 33, l, 1.4); F.line(155, 33, 172, 40, l, 1.4);
    litWindow(F, 155, 50, 5, 6, dark > 0.35 ? 1 : 7, dark > 0.35 ? 4 : 7);
  }
  if (dark > 0.4) for (const [wx, wy] of [[19, 53], [28, 53], [50, 55], [101, 52], [110, 52], [113, 57]]) {
    F.rect(wx, wy, 3, 3, 1, true);                    // the far shore, after dark, is its lights
  }
}

/* ------------------------------------------------------------------ BOATS
   A boat that can be AGROUND. At low water she lies over on her own bilge in
   the mud; when the tide reaches her she comes upright and lifts. That is the
   entire reason this film has a tide in it — the water level is the line's
   own quantity, and the hulls are how you read it without a gauge. */
function boatAt(F, x, gy, s, waterY, u, l) {
  const afloat = clamp01((gy - waterY) / 9);
  const heel = (1 - afloat) * 0.62;
  const y = gy - afloat * 1.6 + Math.sin(u * TAU * 0.7 + x) * afloat * 0.8;
  F.arc(x, y, s, heel, Math.PI + heel, l, 1.7);
  const bx = x + Math.cos(heel) * s, by = y + Math.sin(heel) * s;
  const sx = x + Math.cos(Math.PI + heel) * s, sy = y + Math.sin(Math.PI + heel) * s;
  F.line(sx, sy, bx, by, l, 1.2);                                   // the gunwale
  const mx = x + Math.sin(heel) * s * 2.1, my = y - Math.cos(heel) * s * 2.1;
  F.line(x, y, mx, my, l, 1.2);                                     // the mast
  F.line(mx, my, lerp(x, bx, 0.9), lerp(y, by, 0.9) - 1, l, 1);     // the forestay
}

/* a small café table: a FLAT top, a stem, a foot. The first pass gave it a
   round top and four of them read as a row of potted shrubs — the one mark
   that decides whether this is a quay with tables on it is that the top is
   wider than it is tall. */
function table(F, cx, cy, l) {
  F.line(cx - 5, cy - 8, cx + 5, cy - 8, l, 2.2);
  F.line(cx, cy - 8, cx, cy, l, 1.2);
  F.line(cx - 3.5, cy, cx + 3.5, cy, l, 1.2);
}

/* ---------------------------------------------------------------- JUPITER
   PAINTED, NOT OUTLINED. A bright disc with its belts laid in as chords, so
   it reads as a body with a surface; the earlier pass drew a ring with three
   lines across it, which is a diagram of a planet. Its contrast rides the
   dark — at dusk it is barely there and by full night it is the brightest
   thing in the sky, which is how a planet actually comes out. The spot rides
   the rotation and goes round the limb: the only mark on screen that says the
   thing is turning, and so the only reason its keeping reads as keeping. */
function planet(F, cx, cy, r, rot, dark) {
  const c = 0.35 + dark * 0.65;
  F.disc(cx, cy, r, 0, true);
  F.ring(cx, cy, r, Math.round(1 + c * 3), 1.4);
  for (const [f, lv] of [[-0.60, 2], [-0.28, 3], [0.06, 2], [0.36, 3], [0.64, 2]]) {
    const dy = f * r, w = Math.sqrt(Math.max(0, r * r - dy * dy));
    F.line(cx - w + 1, cy + dy, cx + w - 1, cy + dy, Math.round(lv * c) + 1, Math.max(1.3, r * 0.12), true);
  }
  if (Math.cos(rot) > 0) {
    F.disc(cx + Math.sin(rot) * r * 0.84, cy + r * 0.34, r * 0.17 * Math.cos(rot) + 0.6,
      Math.round(2 + c * 3), true);
  }
}

/* ---------------------------------------------------------------- THE FIRE
   Fire in a dark frame is PAPER, not ink: a tongue is stamped out of the
   night at level 0 inside its own hard contour, because ink laid on ink
   cannot glow. Five tongues, each on its own clock — a single flicker rate
   makes the whole fire pulse like a lamp on a dimmer. */
function fire(F, x, base, h, u) {
  const rel = [1.0, 0.62, 1.18, 0.54, 0.84];
  const tongues = [];
  for (let k = 0; k < 5; k++) {
    tongues.push({
      fx: x + (k - 2) * h * 0.17,
      fh: h * rel[k] * (0.70 + 0.55 * Math.abs(Math.sin(u * TAU * (13.7 + k * 2.3) + k * 2.4))),
      sway: Math.sin(u * TAU * (9.3 + k * 1.7) + k * 1.9),
    });
  }
  /* EVERY CONTOUR FIRST, THEN EVERY LIGHT. Drawing each tongue complete in
     turn put a dark rim down the middle of the fire wherever two overlapped,
     and five bright bars with black edges between them is a picket fence. In
     two passes the tongues merge into one lit mass with one outline. */
  for (let pass = 0; pass < 2; pass++) for (const t of tongues) {
    for (let yy = base - t.fh; yy <= base; yy += 1) {
      const s = clamp01((base - yy) / t.fh);            // 0 at the base, 1 at the tip
      const w = h * 0.15 * Math.sqrt(Math.max(0, 1 - s)) * (1 - s * 0.22);
      if (w < 0.5) continue;
      const cx = t.fx + t.sway * s * s * 3.4;           // it bends at the top, not the foot
      /* the rim scales with the tongue. A constant 1.2 cells of contour is
         nothing at the base and is the entire tongue near the tip, which
         turned the top half of the fire into a black crown. */
      /* no rim on the last cell of a tongue: a contour drawn a cell wider than
         a half-cell-wide tip IS the tip, and every flame ended in a black
         drip */
      if (pass === 0) { if (w < 1.1) continue; const r = w + w * 0.30; F.line(cx - r, yy, cx + r, yy, 7, 1.2); }
      else F.line(cx - w, yy, cx + w, yy, 0, 1.1, true);
    }
  }
}

/* a page as a sparse point set, because the only way a page BURNS per-dot on
   the bayer schedule is if it was already a set of dots — a filled rectangle
   has no per-dot identity to swap */
function pagePoints(x, y, w, h) {
  const pts = [];
  for (let t = 0; t <= 1; t += 0.05) {
    pts.push([x + t * w, y]); pts.push([x + t * w, y + h]);
    pts.push([x, y + t * h]); pts.push([x + w, y + t * h]);
  }
  for (let r = 0.24; r < 0.9; r += 0.20)
    for (let t = 0.12; t <= 0.88; t += 0.055) pts.push([x + t * w, y + h * r]);
  return pts;
}
/* prog rises 0→1; a point survives only while its own bayer value is still
   above prog, so a letter does not fade — it goes out one dot at a time */
function burnPage(F, pts, prog, l) {
  for (const [px, py] of pts) if (F.bayer(Math.round(px), Math.round(py)) > prog) F.ink(px, py, l);
}

/* ---------------------------------------------------------------- FLOWERS
   Heads first and stems thin: at the sizes this meadow is drawn at, what
   makes a field read as flowers rather than as a hatch is that the dark is
   gathered into round masses sitting above a lighter ground. */
function poppy(F, x, y, s, l) {
  F.line(x, y, x, y - s * 2.0, l - 1, Math.max(1, s * 0.28));
  F.disc(x, y - s * 2.3, s * 0.95, l);
  if (s > 2.4) F.disc(x - s * 0.3, y - s * 2.5, s * 0.3, Math.max(1, l - 4), true);
}
function blossom(F, x, y, s, l) {
  F.line(x, y, x, y - s * 1.8, l - 1, Math.max(1, s * 0.26));
  const cx = x, cy = y - s * 2.0;
  for (let k = 0; k < 5; k++) {
    const a = k / 5 * TAU + 0.4;
    F.disc(cx + Math.cos(a) * s * 0.62, cy + Math.sin(a) * s * 0.62, s * 0.46, l);
  }
  if (s > 2.4) F.disc(cx, cy, s * 0.34, Math.max(1, l - 4), true);
}
/* what a cut flower leaves: two cells of stalk. The meadow is not allowed to
   simply vanish behind the harvester — a field that has been picked is a
   different surface, not an absent one. */
function stubble(F, x, y, l) {
  F.line(x, y, x, y - 3.2, l, 1);
  F.line(x + 2.6, y, x + 2.6, y - 2.2, l, 1);
}

/* -------------------------------------------------------- THE POWER FIGURE
   A stem that curves. The first pass ran the limbs out as straight lines and
   the result was a scarecrow: a disc on a post with two horizontal bars. A
   limb reads as a limb because it bends, and a stem reads as a stem because
   it leans away from the mass it grew out of. */
function curveStem(F, x0, y0, x1, y1, bx, by, l, th) {
  let px = x0, py = y0;
  for (let i = 1; i <= 9; i++) {
    const t = i / 9, s = Math.sin(t * Math.PI);
    const nx = lerp(x0, x1, t) + s * bx, ny = lerp(y0, y1, t) + s * by;
    F.line(px, py, nx, ny, l, th);
    px = nx; py = ny;
  }
}
function bloomAt(F, x, y, open, poppyKind, l) {
  const r = ss(0, 1, open) * 5.0;
  if (r < 0.5) return;
  if (poppyKind) { F.disc(x, y, r, l); F.disc(x - r * 0.3, y - r * 0.25, r * 0.3, Math.max(1, l - 4), true); }
  else for (let k = 0; k < 5; k++) {
    const a = k / 5 * TAU + 0.4;
    F.disc(x + Math.cos(a) * r * 0.66, y + Math.sin(a) * r * 0.66, r * 0.48, l);
  }
}
/* THE BECOMING, AND WHAT IT IS NOT. The first pass replaced the man with a
   torso, a disc and four stems where the limbs had been — hand-built, and it
   came out a scarecrow: a head on a post with two bars through it. What the
   line actually needs is a body that is unmistakably HIS (the rig, the poet's
   own guise, standing in his own field) with the harvest breaking out of it:
   five stems rooted in his hands, his shoulders and his crown, opening in
   stagger. The substitution is still total — nothing he is holding is in his
   hands any more, it is growing from them — and it is legible, which the
   scarecrow was not. The tips are computed off the rig's own published
   landmarks (shoulder at 0.815h, the 'open' hand at ±0.31h), so the stems
   leave the body at the exact cells the arms end at rather than near them. */
function flowering(F, x, y, h, bloom, l) {
  const shY = y - h * 0.815, hdY = y - h * 0.93;
  const stems = [
    [x - h * 0.31, shY + h * 0.06, x - h * 0.46, shY - h * 0.20, -h * 0.10, -h * 0.04, 0.00, true],
    [x + h * 0.31, shY + h * 0.05, x + h * 0.47, shY - h * 0.24, h * 0.10, -h * 0.05, 0.10, false],
    [x - h * 0.11, shY, x - h * 0.24, shY - h * 0.34, -h * 0.06, -h * 0.03, 0.22, false],
    [x + h * 0.11, shY, x + h * 0.26, shY - h * 0.30, h * 0.06, -h * 0.03, 0.32, true],
    [x, hdY, x + h * 0.03, hdY - h * 0.22, h * 0.04, 0, 0.44, true],
  ];
  for (const [x0, y0, tx, ty, bx, by, stag, kind] of stems) {
    const open = clamp01((bloom - stag) / (1 - stag));
    if (open <= 0) continue;
    curveStem(F, x0, y0, lerp(x0, tx, ss(0, 0.6, open)), lerp(y0, ty, ss(0, 0.6, open)), bx * open, by * open, l - 1, h * 0.040);
    bloomAt(F, lerp(x0, tx, ss(0, 0.6, open)), lerp(y0, ty, ss(0, 0.6, open)), open, kind, l);
  }
}

/* ------------------------------------------------------------- THE REFOCUS
   THE ONLY BLUR THIS WORLD CAN SPELL. No cell ever takes the average of its
   neighbours — that would be a gradient and the law forbids it. Instead every
   cell READS THE PICTURE FROM SOMEWHERE ELSE: a seeded direction per cell and
   one radius that falls to zero, so an unfocused wall is the wall's own tone
   fetched from the wrong address, and focus is every dot finding its right
   one. It works on TONE as well as on line, which the film's earlier
   dot-lattice window could not: that mechanism could only resolve two hundred
   points of outline on bare paper, and a window with nothing around it is a
   diagram of a window. The lattice survives here for the eyes alone, which
   arrive after the wall, because that is the order looking through a window
   actually happens in. */
function farTone(F, sx, sy, u, waterTop) {
  if (sy >= waterTop) {
    /* the water never focuses. Everything else in the movement is arriving at
       its true place; this is the one surface that has no true place, and it
       is still moving in the last frame. */
    const d = sy - waterTop;
    const wob = Math.sin(sy * 0.62 + u * 5.1) * (1.6 + d * 0.10);
    const src = wallTone(F, sx + wob, waterTop * 2 - sy - 4);
    const m = F.n2(sx * 0.05, sy * 0.30 + u * 2.0);
    return Math.min(4, Math.round(src * 0.40) + 2 + (m > 0.60 ? 1 : 0));
  }
  return wallTone(F, sx, sy);
}
/* the far wall: a filled field at level 2 with holes in it, which is what a
   lit wall is. The brick is bonded rather than coursed, and the cornice and
   the string course are dentilled — a hundred and fifty cells of unbroken
   horizontal joint stripes the frame exactly the way an edge-to-edge floor
   line does, and the wall has three of them. */
function wallTone(F, sx, sy) {
  if (sx < 30 || sx > 170) return 1;
  /* A GABLE, NOT A RECTANGLE. The first pass gave the wall a flat top and a
     dentilled cornice, and it read as a stage flat with a dashed line along
     it — two horizontal bands competing with the one hole the line cares
     about. A sloped verge states "building" in one mark and stripes nothing,
     because it is not horizontal. */
  const roofY = 12 + Math.abs(sx - 100) * 0.26;
  if (sy < roofY) return 1;
  if (sy < roofY + 3.4) return 6;
  if (sy > 84) return 2;
  if (sx > 88 && sx < 148 && sy > 30 && sy < 76) {                  // THE WINDOW
    if (sy > 73) return 5;                                          // the sill
    const hx = sx - 105, hy = sy - 40;
    if (hx * hx + hy * hy < 30) return 7;                           // her head
    if (sy >= 45 && sy < 49 && Math.abs(sx - 105) < 2.0) return 7;  // and a neck, without
    if (sy >= 49) {                                                 // which she is a chess piece
      const hw = sy < 61 ? 7.6 - (sy - 49) * 0.17 : 5.6 + (sy - 61) * 0.16;
      if (Math.abs(sx - 105) < hw) return 7;
    }
    if (Math.abs(sx - 126) < 1.8) return 1;                         // the mullion
    return 4;                                                       // the room
  }
  if (sy > 27 && sy < 30 && sx > 84 && sx < 152) return 4;          // the lintel
  if (sy > 76 && sy < 79 && sx > 84 && sx < 152) return 4;          // the sill course
  const course = ((sy / 7) | 0);
  if (sy % 7 < 1 || (sx + course * 5) % 11 < 1) return 3;
  return 2;
}
/* a dot's own bayer value at its TRUE cell is its arrival time; before that
   it sits at a seeded scatter whose radius itself shrinks, so nothing ever
   appears to jump — by the time a dot's threshold is reached its offset has
   already decayed to a sliver. Rejected: gating on u alone (every dot lands
   together — that is a wipe) and a fixed-radius scatter (every unresolved dot
   sits still, and the field reads as broken glass rather than as settling). */
function resolveDot(F, x, y, l, idx, u, a, b, scatter, big) {
  const p = ss(a, b, u);
  const tx = Math.round(x), ty = Math.round(y);
  if (p >= F.bayer(tx, ty)) { big ? F.disc(x, y, 0.9, l) : F.ink(tx, ty, l); return; }
  const ang = F.noise(idx, 701) * TAU, r = (0.35 + F.noise(idx, 702) * 0.65) * scatter * (1 - p);
  const px = x + Math.cos(ang) * r, py = y + Math.sin(ang) * r;
  big ? F.disc(px, py, 0.9, l) : F.ink(Math.round(px), Math.round(py), l);
}
/* an eye is SEVEN POINTS AND NO MORE. At the radius the first pass used, a
   pair of them came to twelve cells across on an eleven-cell head and she
   read as a doll with headlights. */
function eyeDots(cx, cy) {
  const pts = [[cx, cy]];
  for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; pts.push([cx + Math.cos(a) * 0.7, cy + Math.sin(a) * 0.5]); }
  return pts;
}

export default {
  n: "13", slug: "13-how-to-win-my-heart", title: "HOW TO WIN MY HEART",
  tagline: "orbits, close and counted",
  accent: "#5aa7ff", seed: 1313,
  /* THE FILM'S OWN PASSAGE of the suite's 24-minute score, taken from the
     original running order. The runtime stretches this film's movements to
     fill it, so picture and record line up without either being cut. */
  window: [1243.003, 1352.983],
  /* low and warm at the harbor, up through the count, down for the burning,
     climbing back through the harvest to the refocus, settling just above
     where it started — bittersweet, not resolved */
  /* KEY: C Dorian — the raised 6th keeps the courtship open rather than
     settled; the steps land on the 5th, not the tonic, because "won't
     leave" is a wish here, not yet a fact. */
  drone: { base: 65.41, steps: [0, 0, 2, -3, 5, 9, 7] },
  /* PROSODY · Zanzibar / Swahili coast · Taarab. Desire moves sideways. The breath LENGTHENS across the film, so every pass
     resolves a fraction later than the last, and when the eyes meet the
     instruments are removed instead of added.
     `deep/sonify.mjs` scans the field under this law. The root is the drone's
     own base folded into one octave, so the film sings in the key it hums in. */
  score: { engine: "taarab", mode: "rast" },
  movements: [
    {
      label: "SMALL TABLES", seconds: 13,
      line: "Find me at the harbor, at the small tables, watching.",
      /* the chair, then two hulls coming off the mud — the movement's three
         events, struck at the u the picture actually reaches them: 0.36 is
         where the tide passes the near boat's keel and 0.62 the far one's */
      cues: [
        { at: 0.29, f: 150, decay: 0.16, gain: 0.35, partials: [1, 2.6, 4.1], noise: 0.7, nDecay: 0.02, seed: 1301 },
        { at: 0.36, f: 118, decay: 0.40, gain: 0.30, partials: [1, 1.7, 2.4], noise: 0.8, nDecay: 0.14, seed: 1302 },
        { at: 0.62, f: 132, decay: 0.34, gain: 0.26, partials: [1, 1.7, 2.4], noise: 0.8, nDecay: 0.12, seed: 1303 },
      ],
      draw(u, F) {
        /* THE TIDE IS THE MOVEMENT. Thirty-six rows of mud become water over
           thirteen seconds — a fifth of the field changing substance, slowly,
           with no object crossing it. Watching is what you do at a harbor
           table, and this is the only thing there is to watch. */
        const tide = smooth(u);
        const wl = harbor(F, u, tide, 0);
        farShore(F, 0);
        pier(F, 6);
        /* the two moored boats are the gauge: aground and lying over at the
           start, upright and afloat by the end, and the far one lifts last
           because the water reaches it last */
        boatAt(F, 44, 95, 9, wl, u, 6);
        boatAt(F, 150, 79, 5.5, wl, u, 6);
        for (const tx of TABLE_X) table(F, tx, SEAT, 6);
        /* FIND ME: he is not in the first frame. He comes in along the quay,
           crosses a hundred cells of it, lowers himself onto the third chair
           and stays — an arrival, and then a hold that breathes.
           PHASE 33.4 IS NOT AN ACCIDENT. The gait sends both feet to the same
           offset at every HALF-integer of phase, and the QA sweep samples at
           u=.2/.5/.8 — so a rate is only safe if 0.2r is far from n/2 AND
           0.8r (which is four times it) is too. The first pass used 27.4, put
           0.2r at 5.48, and the sweep's first frame caught the one man in the
           movement standing with his feet in exactly the same place. */
        const px = lerp(10, TABLE_X[2] - 9, smooth(clamp01((u - 0.02) / 0.22)));
        if (u < 0.24) {
          F.fig(px, SEAT, 34, {
            mode: "walk", phase: u * 33.4, face: 1, guise: "poet",
            headTurn: 0.45, headTilt: 0.05,
          }, 7);
        } else if (u < 0.29) {
          /* the half-second of lowering, so the sit is an act and not a cut */
          F.fig(TABLE_X[2] - 9, SEAT, 34, {
            mode: "stand", face: 1, guise: "poet", phase: u * 1.7, arms: "down",
            crouch: ss(0.24, 0.29, u), weight: 0.7, headTilt: 0.2,
          }, 7);
        } else {
          F.fig(TABLE_X[2] - 9, SEAT, 34, {
            mode: "sit", face: 1, arms: "down", phase: u * 1.7, guise: "poet",
            /* WATCHING is a head that keeps going back out to the water and
               to the far window, not a face held level for eleven seconds */
            headTurn: 0.25 + Math.sin(u * TAU * 0.62) * 0.55, headTilt: 0.06,
          }, 7);
        }
      },
    },
    {
      label: "COUNTED ORBITS", seconds: 14,
      line: "The couples orbit each other the way Jupiter keeps its moons — close, and counted.",
      cues: [
        { at: 0.24, f: 520, decay: 0.14, gain: 0.32, partials: [1, 2, 3], noise: 0.2, nDecay: 0.02, seed: 1311 },
        { at: 0.60, f: 620, decay: 0.14, gain: 0.32, partials: [1, 2, 3], noise: 0.2, nDecay: 0.02, seed: 1312 },
        { at: 0.80, f: 740, decay: 0.14, gain: 0.34, partials: [1, 2, 3], noise: 0.2, nDecay: 0.02, seed: 1313 },
      ],
      draw(u, F) {
        /* YOU CANNOT COUNT THEM UNTIL IT IS DARK. The dark is this movement's
           one quantity: it comes down the sky dot by dot on the ordered
           schedule, the moons come out of it one at a time, and the numeral
           follows them. That is the whole mechanism — the count is a function
           of the dark rather than a caption laid over it.
           Rejected: the simile staged as a labelled diagram in daylight,
           which is what the first pass did — a circle with three lines in it
           and a nine-pixel "4" in the corner. */
        const dark = smooth(clamp01((u - 0.04) / 0.72));
        harbor(F, u, 1, dark);
        /* Jupiter RISES: the climb any planet makes across an evening. Drawn
           before the far shore, so the shore occludes it on the way up. */
        const jx = 134, jy = lerp(58, 26, smooth(u)), jr = 21;
        planet(F, jx, jy, jr, u * TAU * 0.62 + 1.1, dark);
        /* close, and counted. A moon on the far side of its swing goes behind
           the planet and comes out the other side — keeping is what the line
           says Jupiter does, and an occultation is what keeping looks like. */
        const beats = [0.24, 0.38, 0.60, 0.80], radii = [32, 39, 46, 54], speeds = [0.95, 0.66, 0.46, 0.31];
        let seen = 0;
        for (let m = 0; m < 4; m++) {
          if (u < beats[m]) continue;
          seen++;
          const a = m * 1.7 + (u - beats[m]) * TAU * speeds[m];
          const mx = jx + Math.cos(a) * radii[m], my = jy + Math.sin(a) * radii[m] * 0.17;
          if (Math.sin(a) > 0 && Math.abs(mx - jx) < jr) continue;
          F.disc(mx, my, 1.8, 0, true); F.ring(mx, my, 2.6, 4, 1);
        }
        farShore(F, dark);
        /* the same two boats as M1, riding the tide that came in under it */
        boatAt(F, 44, 95, 9, 70, u, Math.min(7, 6 + Math.round(dark)));
        boatAt(F, 150, 79, 5.5, 70, u, Math.min(7, 6 + Math.round(dark)));
        pier(F, 6);
        /* the count, put on screen rather than left to be tallied by eye —
           and stamped as paper, because by the time there is anything to
           count, the sky it sits in is ink */
        if (seen) F.word(String(seen), 26, 24, 20, 0, true);
        /* CLOSE: four couples come onto the quay, one to a table, and each
           pair's orbit tightens for as long as it turns. They arrive walking,
           and THE FURTHEST TABLE ON EACH SIDE FILLS FIRST — ordered left to
           right, the second couple walked straight through the first one's
           table, and four bodies inside twenty cells read as one black
           crowd. Filling outward-in means nobody ever crosses ground that is
           already occupied. */
        const arriveAt = [0.38, 0.02, 0.16, 0.58];
        for (let t = 0; t < TABLE_X.length; t++) {
          const cx = TABLE_X[t], arrive = arriveAt[t], entry = t < 2 ? -10 : 202;
          const p = clamp01((u - arrive) / 0.20);
          if (p <= 0) continue;
          /* CLOSE, not merged. Closing to seven cells put two twenty-seven-cell
             bodies inside one silhouette and four couples read as four
             individuals — the one thing this movement cannot say. Thirteen is
             as close as two people can stand and still be two. */
          const orbitR = lerp(19, 13, clamp01((u - arrive - 0.20) / 0.40));
          /* A THIRD OF A TURN IN EIGHTEEN SECONDS. At two thirds every pair
             passed through its own crossing twice, and an edge-on crossing is
             two silhouettes in one place however the depth is drawn. Slower,
             with the four tables offset, keeps almost every couple side by
             side almost all the time — and a slow orbit is what the line is
             describing anyway. */
          const ang = (u - arrive) * TAU * 0.36 + t * 0.8;
          /* the ellipse is only a quarter flattened. At a third it was nearly
             edge-on, and twice a turn the two bodies stood at the same x and
             merged into one four-legged mass; at 0.72 the far one is nineteen
             cells further back, drawn first and drawn smaller, so a pair
             occludes instead of fusing. */
          const ox = Math.cos(ang) * orbitR, oy = Math.sin(ang) * orbitR * 0.72;
          const walking = p < 1;
          /* the orbit's centre sits two cells up the quay from the chairs, so
             the near half of it does not walk anybody off the bottom edge */
          const A = [lerp(entry, cx + ox, smooth(p)), SEAT - 2 + (walking ? 0 : oy)];
          const B = [lerp(entry - 11, cx - ox, smooth(p)), SEAT - 2 - (walking ? 0 : oy)];
          const pose = (self, other, ph) => ({
            mode: walking ? "walk" : "stand",
            phase: walking ? u * 27.3 + ph : u * 1.7 + ph,
            face: walking ? (entry < 0 ? 1 : -1) : (self < other ? 1 : -1),
            arms: walking ? "swing" : "reach",
            weight: walking ? 0.5 : 0.5 + Math.sin(ang + ph) * 0.28,
            headTurn: walking ? 0.3 : 0.25,
          });
          /* the nearer body second, so a couple occludes itself as it turns */
          const order = A[1] >= B[1] ? [B, A] : [A, B];
          const hOf = (b) => 27 + (b[1] - SEAT + 2) * 0.30;      // the near one is the bigger one
          F.fig(order[0][0], order[0][1], hOf(order[0]), pose(order[0][0], order[1][0], 0), 7);
          F.fig(order[1][0], order[1][1], hOf(order[1]), pose(order[1][0], order[0][0], 1.9), 7);
          /* CLOSE, and it has to be drawn: 'reach' ends each body's own arm at
             a point, and the join between the two points is the only mark that
             says they are holding on rather than standing near each other.
             Only while the gap is a gap — once they cross, there is nothing
             to bridge. */
          const gap = Math.abs(order[1][0] - order[0][0]);
          if (!walking && gap > 9 && gap < 30) {
            const h0 = hOf(order[0]), h1 = hOf(order[1]);
            const f0 = order[0][0] < order[1][0] ? 1 : -1;
            F.line(order[0][0] + f0 * h0 * 0.36, order[0][1] - h0 * 0.72,
                   order[1][0] - f0 * h1 * 0.36, order[1][1] - h1 * 0.72, 7, 1.4);
          }
          table(F, cx, SEAT, 6);
        }
      },
    },
    {
      label: "BURNED STORIES", seconds: 13,
      line: "The elders clutch their pearls and pray. Life has burned all my love stories — victory-less seasons.",
      cues: [
        { at: 0.14, f: 200, decay: 0.30, gain: 0.40, partials: [1, 1.8, 2.6], noise: 0.9, nDecay: 0.20, seed: 1321 },
        { at: 0.42, f: 180, decay: 0.35, gain: 0.35, partials: [1, 1.7, 2.4], noise: 0.95, nDecay: 0.25, seed: 1322 },
        { at: 0.71, f: 160, decay: 0.40, gain: 0.32, partials: [1, 1.6, 2.3], noise: 0.95, nDecay: 0.28, seed: 1323 },
      ],
      draw(u, F) {
        /* THE SMOKE IS THE MOVEMENT'S QUANTITY, AND IT IS PALE. A pall over a
           big fire at night is lit from underneath, so it climbs the frame as
           paper on ink rather than ink on ink — which is also the only way it
           could be seen at all, the sky it climbs into being already at five.
           Rejected: dark smoke on a night sky. It measured as motion and
           looked like nothing. */
        harbor(F, u, 1, 1);
        farShore(F, 1);
        const FX = 122;
        /* the wave tops nearest the fire catch it, and nothing else in this
           water is lit. The glints blink because water does. */
        for (let k = 0; k < 70; k++) {
          const off = (F.noise(k, 31) - 0.5) * 90;
          const gx = FX + off, gy = PIER - 3 - F.noise(k, 32) * (26 - Math.abs(off) * 0.16);
          if (Math.sin(gy * 0.5 + u * TAU * 1.7 + k) < 0.52 + Math.abs(off) * 0.006) continue;
          F.put(gx, gy, 1); F.put(gx + 1, gy, 2);
        }
        /* the firelight on the stones: bright at the fire, dithered out to
           the ambient at its rim, and it rises and dies with the fire */
        const heat = 0.30 + 0.70 * win(u, 0.05, 0.34, 0.62, 0.97);
        F.map((x, y) => {
          if (y < PIER) return;
          const d = Math.hypot((x - FX) * 0.62, y - (PIER + 6)) / (26 + heat * 46);
          if (d < 1) return Math.min(4, Math.floor(d * 4.2 + F.bayer(x, y)));
        });
        const top = 128 - smooth(u) * 132;
        /* the plume runs all the way DOWN to the stones, not from the horizon
           up: cut off at the skyline it read as weather that happened to be
           over the harbor rather than as the smoke of this particular fire */
        F.map((x, y) => {
          if (y >= PIER || y < top) return;
          const rise = clamp01((128 - y) / 118);
          const cxp = FX - rise * 40 + F.n2(rise * 4.2 + u * 0.5, 3) * 16 - 8;
          const w = (7 + rise * 66) * (0.72 + 0.56 * F.n2(rise * 3.1 + u * 0.4, 9));
          const d = 1 - Math.abs(x - cxp) / w;
          if (d <= 0) return;
          /* two scales of texture, and it is never allowed all the way to
             paper: a plume at level 0 read as a searchlight beam, and smoke
             is a substance you can see the far shore through */
          const tex = F.n2(x * 0.075 + u * 0.6, y * 0.10) * 0.6 + F.n2(x * 0.022, y * 0.035 + u * 0.3) * 0.55;
          const dens = d * (0.35 + tex) * clamp01((y - top) / 16) * (1 - rise * 0.40);
          if (dens < 0.16) return;
          return Math.max(1, Math.min(6, Math.floor(6.4 - dens * 5.4 + F.bayer(x, y))));
        });
        pier(F, 7);
        /* FIVE LOVE STORIES, GOING ONE AT A TIME. They lie in a heap on the
           stones and catch in sequence — a front sweeping the stack, not one
           flash over the cluster, so the stack COMES APART across the
           movement instead of dimming as a single object. */
        /* the letters lie ON THE STONES, inside the firelight. The first pass
           stacked them up the frame and the top of the heap stood in the dark
           water, where ink at 7 on ink at 6 is nothing at all. */
        /* spread wide enough that the outer letters are not standing inside
           the fire: the ones under the flame are erased by their own light */
        const heap = [[62, 123, 21, 8], [96, 124, 20, 8], [148, 122, 21, 8], [78, 132, 20, 7], [132, 133, 21, 7]];
        let lit = 0;
        heap.forEach((pd, i) => {
          const gone = clamp01((u - (0.10 + i * 0.145)) / 0.20);
          if (gone > 0) lit++;
          burnPage(F, pagePoints(pd[0], pd[1], pd[2], pd[3]), gone, 7);
        });
        /* it takes hold as the letters go in, and it is embers by the end —
           "victory-less" is a fire you are still sitting beside when it stops
           being one */
        fire(F, FX, 132, (11 + lit * 3.6) * (1 - 0.62 * ss(0.74, 1, u)), u);
        for (let k = 0; k < 26; k++) {
          const pi = k % 5, t0 = 0.10 + pi * 0.145 + (k / 26) * 0.09;
          if (u <= t0) continue;
          const age = u - t0;
          const ex = FX + (F.noise(k, 11) - 0.5) * 26 + Math.sin(age * 8 + k) * 6 - age * 26;
          const ey = 126 - age * 190;
          if (ey > 5) F.disc(ex, ey, F.noise(k, 12) > 0.72 ? 1.3 : 0.85, 0, true);
        }
        /* THE ELDERS PRAY, AND A PRAYER IS A BODY GOING DOWN. arms:'hold' is
           the rig's own two-hands-at-the-chest, which is exactly the clutch
           the line names, so the pearls have something to be held by; crouch
           and headTilt climb across the whole thirteen seconds — the
           movement's second monotone number. Rejected: a hand-built robe, a
           triangle with a knob on it, which read as a traffic cone. */
        /* Level 6, not 7: at 7 the fill comes out at 4, which is the same tone
           as the night water they stand against, and two elders turned into
           two x-rays. At 6 the body fills at 3 — lighter than the water
           behind them and darker than the lit stones under them, so one
           figure reads against both surfaces it crosses. */
        for (const [ex2, ey2, eh, delay] of [[38, 138, 44, 0.06], [68, 141, 39, 0.16]]) {
          const bow = ss(delay, delay + 0.84, u);
          F.fig(ex2, ey2, eh, {
            mode: "stand", face: 1, arms: "hold", guise: "elder", phase: u * 1.7 + delay * 9,
            crouch: 0.10 + bow * 0.42, headTilt: -0.15 - bow * 0.55, weight: 0.42,
            lean: bow * 0.10, headTurn: 0.2,
          }, 6);
          /* AND THE ROBE. The rig gives a body, and a body in trousers is a
             bystander; the line says elders, and what makes an elder at
             twenty cells is that the legs are covered. Stamped, not inked,
             because it has to close over the legs the rig has already drawn. */
          const hipY = ey2 - eh * (0.50 - (0.10 + bow * 0.42) * 0.16);
          const lean2 = bow * eh * 0.10;
          for (let yy = Math.round(hipY); yy <= ey2; yy++) {
            const t = (yy - hipY) / (ey2 - hipY);
            const hw = eh * (0.105 + t * t * 0.115), rx = ex2 + lean2 * (1 - t);
            F.line(rx - hw, yy, rx + hw, yy, 3, 1, true);
            F.put(Math.round(rx - hw), yy, 6); F.put(Math.round(rx + hw), yy, 6);
          }
          F.line(ex2 - eh * 0.22, ey2, ex2 + eh * 0.22, ey2, 6, 1.4);
          for (let k = 0; k < 6; k++) {
            const a = 0.5 + k / 5 * 2.2;
            F.disc(ex2 + Math.cos(a) * eh * 0.11 + bow * eh * 0.05,
              ey2 - eh * (0.74 - bow * 0.12) + Math.sin(a) * eh * 0.05, Math.max(0.85, eh * 0.026), 7);
          }
        }
      },
    },
    {
      label: "HARVESTED POWER", seconds: 14,
      line: "So I harvest the flowers instead — scarlet poppies, purple blossoms — and they become my power.",
      cues: [
        { at: 0.19, f: 700, decay: 0.08, gain: 0.40, partials: [1, 2.4], noise: 0.6, nDecay: 0.02, seed: 1331 },
        { at: 0.36, f: 650, decay: 0.08, gain: 0.40, partials: [1, 2.4], noise: 0.6, nDecay: 0.02, seed: 1332 },
        { at: 0.70, f: 220, decay: 0.60, gain: 0.40, partials: [1, 2.0, 3.0], noise: 0.3, nDecay: 0.10, seed: 1333 },
      ],
      draw(u, F) {
        /* THE FIELD GOES DOWN IN FRONT OF HIM. The first pass drew the meadow
           as a row of specimens and erased whatever the sweep passed, and by
           the second half the frame was 98% paper — one harvester cannot be
           "instead of" a whole meadow if the meadow is gone. So the meadow is
           a MASS; the far half of it is never touched and the near half is
           only ever cut back to the middle of the frame; and what the sweep
           leaves is not absence but a different surface — cut ground with two
           stalks of stubble per head taken, lighter by two levels than the
           standing crop.
           The sky is the night this line turns away from: M3's smoke, going
           off the top of the frame while he works. "Instead" is a word about
           the movement before this one, and it is the only reason there is
           weather in this one. */
        const sweepX = lerp(194, 96, smooth(clamp01(u / 0.46)));
        const cutAt = (y) => sweepX + (y - 116) * 0.09 + (F.n2(y * 0.20, 7) - 0.5) * 9;
        const rest = 1 - smooth(clamp01(u / 0.74));
        F.map((x, y) => {
          const b = F.bayer(x, y);
          /* the skyline is not ruled: a straight tone boundary across 192
             cells stripes the frame as surely as a drawn bar does */
          if (y < 58 + (F.n2(x * 0.09, 13) - 0.5) * 11) return Math.min(7, Math.floor(1 + rest * 2.4 + b));
          if (y < 92) return Math.min(7, Math.floor(2 + F.n2(x * 0.06, y * 0.10) * 1.5 + b * 0.8));
          const cut = x > cutAt(y);
          const g = F.n2(x * 0.07, y * 0.13 + 3);
          return Math.min(7, Math.floor((cut ? 0.9 : 2.4) + g * (cut ? 1.2 : 1.6) + b));
        });
        /* the far half of the field: four rows that recede and are never cut,
           so the abundance is on screen for the whole movement */
        for (const [ry, n, s, l, k] of [[70, 40, 0.9, 4, 41], [77, 36, 1.1, 4, 43], [84, 32, 1.4, 5, 45], [91, 28, 1.7, 5, 47]])
          for (let i = 0; i < n; i++) {
            const fx = 2 + i * (188 / (n - 1)) + (F.noise(i, k) - 0.5) * 6;
            (i + k) % 2 ? blossom(F, fx, ry, s, l) : poppy(F, fx, ry, s, l);
          }
        /* the near half: five rows, and every head in them is either standing
           or cut, decided one flower at a time by where the sweep has got to */
        const rows = [[100, 30, 2.0, 5], [110, 27, 2.4, 6], [121, 24, 2.9, 6], [132, 21, 3.5, 6], [143, 18, 4.1, 7]];
        rows.forEach(([ry, n, s, l], r) => {
          for (let i = 0; i < n; i++) {
            const fx = 2 + i * (188 / (n - 1)) + (F.noise(i, 50 + r) - 0.5) * 7;
            if (fx > cutAt(ry)) { stubble(F, fx, ry, 4); continue; }
            (i + r) % 2 ? blossom(F, fx, ry, s, l) : poppy(F, fx, ry, s, l);
          }
        });
        /* the four tall stalks he actually takes. The hand goes ON the stem,
           at the bend — the bloom sits four heads above the shoulder and a
           hand sent up there stretches the arm into a rod, which reads as
           broken rather than as reaching. */
        const targets = [104, 132, 158, 182].map((x, i) => ({ x, top: 92 + (F.noise(i, 21) - 0.5) * 10, poppy: i % 2 === 0 }));
        for (const t of targets) {
          if (t.x > cutAt(141)) { stubble(F, t.x, 142, 5); continue; }
          const bend = (F.noise(t.x, 77) - 0.5) * 9, midY = (142 + t.top) / 2;
          F.line(t.x, 142, t.x + bend, midY, 6, 1.4); F.line(t.x + bend, midY, t.x, t.top, 6, 1.4);
          t.poppy ? poppy(F, t.x, t.top + 8, 3.6, 7) : blossom(F, t.x, t.top + 8, 3.4, 7);
        }
        const held = targets.filter((t) => t.x > cutAt(141));
        if (u < 0.68) {
          const ahead = targets.filter((t) => t.x <= cutAt(141));
          const nextT = ahead.length ? ahead.reduce((a, b) => (b.x > a.x ? b : a)) : null;
          const reachIn = nextT ? sweepX - nextT.x : 999;
          const gesture = nextT && reachIn < 18 && reachIn > -6 ? [nextT.x - sweepX, 142 - (142 + nextT.top) / 2] : undefined;
          /* after the sweep he walks back into what he has cut, so the
             becoming happens with the standing field behind it */
          const back = ss(0.50, 0.68, u);
          const hx = back > 0 ? lerp(sweepX, 122, back) : sweepX;
          F.fig(hx, 139, 52, {
            mode: "walk", phase: u * 21.3, face: back > 0.02 ? 1 : -1, guise: "poet",
            arms: gesture ? "reach" : "swing", gesture, headTurn: back > 0.02 ? 0.2 : -0.35,
          }, 7);
          /* the armful, and it is a count: one more bloom in the crook of the
             arm every time a stalk goes down */
          held.forEach((t, i) => {
            const bx = hx - 10 + (i % 2) * 6, by = 106 - ((i / 2) | 0) * 6;
            t.poppy ? poppy(F, bx, by, 2.0, 7) : blossom(F, bx, by, 2.0, 7);
          });
        } else {
          /* THE BECOMING, DECLARED: he stops, and then it happens to him. It
             is sequential and not overlapping — the walk ends, the body
             settles, and only then do the stems open, so nothing has to
             flower mid-stride. The armful empties into him as they open:
             what he was carrying and what is growing out of him are the same
             four flowers, and the count of one is the count of the other. */
          const bloom = ss(0.68, 0.86, u);
          F.fig(122, 139, 52, {
            mode: "stand", arms: "open", guise: "poet", phase: u * 1.7,
            weight: 0.38, headTilt: -0.22 - bloom * 0.18, headTurn: 0.15,
          }, 7);
          flowering(F, 122, 139, 52, bloom, 7);
          const keep = held.slice(0, Math.round(held.length * (1 - bloom)));
          keep.forEach((t, i) => {
            const bx = 110 + (i % 2) * 6, by = 108 - ((i / 2) | 0) * 6;
            t.poppy ? poppy(F, bx, by, 2.0, 7) : blossom(F, bx, by, 2.0, 7);
          });
        }
      },
    },
    {
      label: "REFOCUS", seconds: 14,
      line: "Then, a distant window. She says: you'll see me. Capture the eyes. Refocus. Step back. Say hello.",
      cues: [
        { at: 0.08, f: 900, decay: 0.05, gain: 0.30, partials: [1, 1.5], noise: 0.4, nDecay: 0.02, seed: 1341 },
        { at: 0.56, f: 500, decay: 0.40, gain: 0.45, partials: [1, 2.01, 3.02], noise: 0.15, nDecay: 0.05, seed: 1342 },
        { at: 0.90, f: 330, decay: 0.30, gain: 0.30, partials: [1, 2.0, 2.9], noise: 0.25, nDecay: 0.04, seed: 1343 },
      ],
      draw(u, F) {
        /* THE WHOLE FAR HALF OF THE FRAME IS OUT OF FOCUS, AND COMES IN. No
           fx anywhere near it: a smear made the arriving dots look as though
           they were moving rather than choosing when to arrive, and a shake
           read as the window trembling rather than as the picture sharpening. */
        const WATER = 86, NEAR = 112;
        /* it starts resolving on the first frame and finishes on the word
           "refocus" — the line's fourth beat. Held at full scatter for the
           first fifth, the movement opened on eleven seconds of mush and the
           first beat ("a distant window") had nothing in it to be distant. */
        const blur = (1 - ss(0, 0.58, u)) * 10;
        F.map((x, y) => {
          if (y > NEAR) return;
          const a = F.n2(x * 0.10, y * 0.10) * TAU * 2;
          return farTone(F, x + Math.cos(a) * blur, y + Math.sin(a) * blur, u, WATER);
        });
        /* the near quay: sunlit stone, sharp from the first frame, and the
           one surface in the movement that never had to arrive */
        F.map((x, y) => (y <= NEAR ? undefined
          : Math.min(7, Math.floor(1 + (F.noise(x, y) > 0.88 ? 1 : 0) + F.bayer(x, y)))));
        F.line(0, NEAR, 70, NEAR + 1, 6, 1.6); F.line(84, NEAR + 1, 192, NEAR, 6, 1.6);
        /* CAPTURE THE EYES: the film's one accent, and the only thing in it
           that arrives as a lattice rather than as tone — the frame first and
           the face inside it second, which is the order looking through a
           window happens in */
        [eyeDots(102.6, 39.2), eyeDots(107.4, 39.2)].forEach((eye, ei) =>
          eye.forEach((p, i) => resolveDot(F, p[0], p[1], 8, 4000 + ei * 50 + i, u, 0.42, 0.80, 22, true)));
        /* STEP BACK: away from the rail and toward us, so he GROWS instead of
           shrinking — the only way this world can spell a step toward the
           camera, there being no scaling pass in it. Then the chin comes up,
           and only then the hand: "say hello" is a head before it is a wave. */
        const back = ss(0.72, 0.94, u), hello = ss(0.88, 1, u);
        const h = lerp(46, 58, back);
        F.fig(44, lerp(126, 143, back), h, {
          mode: "stand", face: 1, arms: hello > 0.02 ? "reach" : "down",
          phase: u * 1.7, guise: "poet", weight: lerp(0.32, 0.62, back),
          headTurn: 0.55, headTilt: 0.12 + back * 0.22,
          gesture: hello > 0.02 ? [h * 0.22, h * (0.78 + hello * 0.20)] : undefined,
        }, 7);
      },
    },
    {
      label: "WON'T LEAVE", seconds: 12,
      line: "Don't make me leave. I escaped here for a reason.",
      cues: [
        { at: 0.20, f: 160, decay: 0.5, gain: 0.35, partials: [1, 1.5, 2.1], noise: 0.5, nDecay: 0.20, seed: 1351 },
        { at: 0.70, f: 130, decay: 0.4, gain: 0.30, partials: [1, 1.4], noise: 0.6, nDecay: 0.25, seed: 1352 },
      ],
      draw(u, F) {
        /* THE SAME QUAY AS M1, THE SAME CHAIR, THE NEXT DAY. The tide that
           came in under the small tables is still in; the window that was ten
           cells wide across the water in M1 and forty in M5 is here in the
           wall it belongs to, holding, because this is the movement in which
           nothing is asked to arrive. */
        const wl = harbor(F, u, 1, 0);
        farShore(F, 0, false);
        pier(F, 6);
        const wx = 148, wy = 40;
        F.rect(wx - 30, wy - 24, 60, 48, 3);
        /* the eave in two runs with a gap, not a row of blocks: the dentils
           the first pass used came out as battlements and the wall the film
           has been walking toward turned into a castle */
        F.rect(wx - 33, wy - 28, 30, 3, 6); F.rect(wx + 1, wy - 28, 32, 3, 6);
        F.line(wx - 30, wy - 25, wx + 8, wy - 25, 5, 1); F.line(wx + 14, wy - 25, wx + 30, wy - 25, 5, 1);
        litWindow(F, wx, wy, 15, 16, 5, 7);
        /* SHE IS STILL IN IT, and in the same half of it as in M5. Eighteen
           seconds were spent bringing this window and this figure into focus;
           leaving the pane empty here would have spent that on a rectangle. */
        const hx = wx - 8;
        F.disc(hx, wy - 8, 4.0, 7);
        for (let yy = wy - 4; yy < wy + 15; yy++) {
          const t = (yy - (wy - 4)) / 19;
          const hw = t < 0.55 ? 5.2 - t * 2.2 : 4.0 + (t - 0.55) * 6;
          F.line(hx - hw, yy, hx + hw, yy, 7, 1);
        }
        const pulse = 0.7 + 0.3 * Math.sin(u * TAU * 1.4);
        F.disc(hx - 1.8, wy - 9, 1.3 * pulse, 8); F.disc(hx + 1.8, wy - 9, 1.3 * pulse, 8);
        /* a boat leaves without them — the one thing in frame that goes */
        const s = smooth(u);
        boatAt(F, lerp(56, 118, s), lerp(112, 76, s), lerp(10, 4, s), wl, u, 6);
        for (const tx of TABLE_X) table(F, tx, SEAT, 5);
        table(F, TABLE_X[2], SEAT, 7);
        /* HOLDING ON: the reaching hand lands on the table's own edge, not
           mimed in the air past it — "don't make me leave" gripping the one
           thing here that isn't going anywhere, while the head still follows
           the boat that is. */
        F.fig(TABLE_X[2] - 9, SEAT, 34, {
          mode: "sit", face: 1, arms: "reach", phase: u * 1.7, guise: "poet",
          gesture: [9, 12], headTurn: 0.45, headTilt: -0.10,
        }, 7);
      },
    },
  ],
};
