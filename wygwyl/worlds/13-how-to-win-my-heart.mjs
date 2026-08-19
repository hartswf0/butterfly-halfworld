/* ============================================================================
   13 · HOW TO WIN MY HEART — a WYGWYL halfworld

   ORBITS: what is loved keeps something else close, and COUNTED. Couples
   circle each other the way Jupiter keeps its moons — a small number, held
   in a tight loop, and put on screen as a literal digit rather than implied
   (F.word does the counting; the eye should never have to guess "how many").
   Between the orbits: pearls clutched over stories that burn to nothing, and
   flowers harvested until the harvester is grown out of them. The film's one
   act of attention is the REFOCUS in M5 — a window rebuilt one dot at a time
   on the Bayer schedule, each dot's own seeded scatter shrinking toward zero,
   arriving at its true place exactly when the schedule says to. That is the
   best image in the film, so it gets a movement almost to itself and the
   world's one accent mark — the eyes — which is never spent anywhere else.
   ========================================================================= */
import { TAU, lerp, clamp01, smooth, ss, win } from "../halfworld.mjs";

const HOR = 62, PIER = 122;
const TABLE_X = [34, 76, 118, 160], TABLE_Y = 122;

/* calm harbor water, not a sea — amplitude held under a cell so five rows
   read as still. Each row broken twice (an unbroken 192-wide line stripes
   the frame under the halftone; this is the law, not a style choice). */
function harborWater(F, u, rows = 5) {
  for (let k = 0; k < rows; k++) {
    const y0 = HOR + 5 + k * 8;
    const gA = Math.floor(F.noise(k, 3) * 140), gB = Math.floor(F.noise(k, 4) * 140);
    for (let x = 0; x < F.W; x++) {
      if ((x > gA && x < gA + 16) || (x > gB && x < gB + 12)) continue;
      F.ink(x, Math.round(y0 + Math.sin(x * 0.15 + u * TAU * 0.5 + k) * 0.6), 3);
    }
  }
}
/* the pier edge, three runs — same law as the water */
function pier(F) {
  F.line(0, PIER, 64, PIER + 1, 5, 1); F.line(76, PIER + 1, 128, PIER, 5, 1);
  F.line(140, PIER, 192, PIER + 1, 5, 1);
}
/* a small café table: a disc, a stem, a base. Reused in M1, M2 and M6
   without changing shape, so the same tables carry through the film */
function table(F, cx, cy, l) {
  F.disc(cx, cy - 7, 3.2, l);
  F.line(cx, cy - 7, cx, cy, l, 1.2);
  F.line(cx - 3, cy, cx + 3, cy, l, 1);
}
/* hull as the bottom half of a circle (a0=0..PI sweeps right-down-left,
   which is exactly the "smile" a hull silhouette needs), mast, one sail */
function boat(F, x, y, s, l) {
  F.arc(x, y, s, 0, Math.PI, l, 1.3);
  F.line(x, y, x, y - s * 1.6, l, 1);
  F.line(x, y - s * 1.6, x + s * 1.1, y - s * 0.5, l, 1);
}

/* THE WINDOW'S SHAPE, drawn two ways from the same idea of where its ink
   goes: solid (M1's distant foreshadow, M6's steady aftermath) and as a
   list of points (M5's dot lattice). Keeping one geometry for both means
   the window that resolves in M5 is provably the same window seen small
   in M1 and settled in M6, not a different shape standing in for it. */
function drawWindowSolid(F, cx, cy, hw, hh, l) {
  F.box(cx - hw, cy - hh, hw * 2, hh * 2, l, 2);
  F.line(cx, cy - hh, cx, cy + hh, l - 1, 1);
  F.line(cx - hw, cy, cx + hw, cy, l - 1, 1);
  F.line(cx - hw - 3, cy + hh + 2, cx + hw + 3, cy + hh + 3, l, 1);
}
function windowPoints(cx, cy, hw, hh) {
  const pts = [], step = 1.6;
  for (let x = -hw; x <= hw; x += step) { pts.push([cx + x, cy - hh, 6]); pts.push([cx + x, cy + hh, 6]); }
  for (let y = -hh; y <= hh; y += step) { pts.push([cx - hw, cy + y, 6]); pts.push([cx + hw, cy + y, 6]); }
  for (let y = -hh; y <= hh; y += step) pts.push([cx, cy + y, 5]);
  for (let x = -hw; x <= hw; x += step) pts.push([cx + x, cy, 5]);
  for (let x = -hw - 3; x <= hw + 3; x += step) pts.push([cx + x, cy + hh + 2, 6]);
  return pts;
}
/* the eyes as their own small lattice, 7 points, so "capture the eyes" is
   built by the same one mechanic as the window rather than a special case */
function eyeDots(cx, cy) {
  const pts = [[cx, cy]];
  for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; pts.push([cx + Math.cos(a) * 1.6, cy + Math.sin(a) * 1.15]); }
  return pts;
}
/* THE REFOCUS MECHANISM. A dot's own bayer value at its TRUE cell is its
   arrival time; before that time it sits off at a seeded scatter whose
   radius itself shrinks toward zero as u advances, so a dot that hasn't
   arrived yet is still visibly drifting inward, not frozen at full scatter
   until it snaps. The two together are why nothing ever appears to jump:
   by the time a dot's threshold is reached its own offset has already
   decayed to a sliver. Rejected: gating on u alone (every dot resolves at
   the same time — that is a wipe, not a focus) and gating on bayer alone
   with a fixed-radius scatter (correct schedule, but every unresolved dot
   sits still at full radius and the field reads as broken glass, not mist
   settling). Needs both. */
function resolveDot(F, x, y, l, idx, u, a, b, scatter, big) {
  const p = ss(a, b, u);
  const tx = Math.round(x), ty = Math.round(y);
  if (p >= F.bayer(tx, ty)) { big ? F.disc(x, y, 1.6, l) : F.ink(tx, ty, l); return; }
  const ang = F.noise(idx, 701) * TAU, r = (0.35 + F.noise(idx, 702) * 0.65) * scatter * (1 - p);
  const px = x + Math.cos(ang) * r, py = y + Math.sin(ang) * r;
  big ? F.disc(px, py, 1.6, l) : F.ink(Math.round(px), Math.round(py), l);
}

/* AN ELDER IS A ROBE, NOT A BODY — F.fig reads as young and upright, and
   the line needs stooped and covered. Built as its own small shape: a
   triangular hem instead of legs, hands drawn to a single point at the
   chest instead of F.fig's open reach, and a small arc of dots at the
   throat for the pearls, which is the one part of this figure that has to
   be legible or the gesture "clutch their pearls" has nothing to hold. */
function elder(F, x, y, h, l) {
  const shY = y - h * 0.62, hdY = y - h * 0.86, chestY = shY + h * 0.16;
  F.disc(x, hdY, h * 0.09, l);
  F.line(x - h * 0.14, shY, x - h * 0.30, y, l, 1.4);
  F.line(x + h * 0.14, shY, x + h * 0.30, y, l, 1.4);
  F.line(x - h * 0.30, y, x + h * 0.30, y, l, 1.4);
  F.line(x - h * 0.14, shY, x, chestY, l, 1.3);
  F.line(x + h * 0.14, shY, x, chestY, l, 1.3);
  F.disc(x, chestY, h * 0.035, l);
  for (let k = 0; k < 5; k++) {
    const a = 0.47 + k / 4 * 2.2;
    F.disc(x + Math.cos(a) * h * 0.10, hdY + h * 0.14 + Math.sin(a) * h * 0.05, Math.max(0.7, h * 0.018), l);
  }
}
/* a page as a sparse point set rather than solid strokes, because the only
   way a page BURNS per-dot on the bayer schedule (the law's dissolve) is
   if it was already a set of dots to begin with — a filled rectangle has
   no per-dot identity to swap */
function pagePoints(x, y, w, h) {
  const pts = [];
  for (let t = 0; t <= 1; t += 0.08) {
    pts.push([x + t * w, y]); pts.push([x + t * w, y + h]);
    pts.push([x, y + t * h]); pts.push([x + w, y + t * h]);
  }
  for (let t = 0.15; t <= 0.85; t += 0.1) { pts.push([x + t * w, y + h * 0.35]); pts.push([x + t * w, y + h * 0.62]); }
  return pts;
}
/* prog rises 0→1; a point survives only while its own bayer value is still
   above prog, so the page does not fade — it goes out one dot at a time,
   the ones whose schedule comes first vanishing first */
function burnPage(F, pts, prog, l) {
  for (const [px, py] of pts) if (F.bayer(Math.round(px), Math.round(py)) > prog) F.ink(px, py, l);
}

function poppy(F, x, y, s, l) {
  F.line(x, y, x, y - s * 2.1, l, 1);
  F.disc(x, y - s * 2.3, s * 0.85, l);
  F.disc(x, y - s * 2.3, s * 0.3, Math.min(7, l + 1));
}
function blossom(F, x, y, s, l) {
  F.line(x, y, x, y - s * 1.8, l, 1);
  const cx = x, cy = y - s * 2.0;
  for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; F.line(cx, cy, cx + Math.cos(a) * s * 0.9, cy + Math.sin(a) * s * 0.9, l, 1); }
  F.disc(cx, cy, s * 0.25, Math.min(7, l + 1));
}

/* ONE STEM, GROWN OUTWARD FROM ITS JOINT rather than faded in — t is how
   far along the joint→tip path it has reached, and only past t=0.75 does
   a bloom open at the growing tip, sized by how far past that it is. A
   cross-fade between a straight limb and a flowered one was tried and
   rejected: with no alpha the two versions simply alternated, which read
   as flicker, not growth. */
function stem(F, jx, jy, tx, ty, t, l, seedk) {
  t = clamp01(t);
  const ex = lerp(jx, tx, t), ey = lerp(jy, ty, t);
  const mx = lerp(jx, ex, 0.5) + (F.noise(seedk, 3) - 0.5) * 4 * t, my = lerp(jy, ey, 0.5);
  F.line(jx, jy, mx, my, l, 1.3);
  F.line(mx, my, ex, ey, l, 1.3);
  if (t > 0.75) {
    const bloom = ss(0.75, 1, t) * 2.0;
    for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + seedk; F.line(ex, ey, ex + Math.cos(a) * bloom, ey + Math.sin(a) * bloom, l, 1); }
    F.disc(ex, ey, Math.max(0.6, bloom * 0.35), l);
  }
}
/* the power figure: a torso and head that stay a body, and four stems
   where the limbs were. Rejected: replacing the torso too — the line says
   the flowers become "my power", not "me"; a person still has to be
   standing there for the harvest to have cost or changed anything. */
function stemFigure(F, x, y, h, growth, l) {
  const hipY = y - h * 0.46, shY = y - h * 0.78, hdY = y - h * 0.885;
  F.line(x, hipY, x, shY, l, Math.max(1, h * 0.055));
  F.disc(x, hdY, h * 0.10, l);
  const tips = [[x, shY, x - h * 0.42, shY - h * 0.05, 0], [x, shY, x + h * 0.42, shY - h * 0.05, 0.06],
                [x, hipY, x - h * 0.20, y, 0.12], [x, hipY, x + h * 0.20, y, 0.18]];
  tips.forEach(([jx, jy, tx, ty, stagger], i) => stem(F, jx, jy, tx, ty, growth * 1.15 - stagger, l - 1, i));
}

export default {
  n: "13", slug: "13-how-to-win-my-heart", title: "HOW TO WIN MY HEART",
  tagline: "orbits, close and counted",
  accent: "#5aa7ff", seed: 1313,
  /* low and warm at the harbor, up through the count, down for the burning,
     climbing back through the harvest to the refocus, settling just above
     where it started — bittersweet, not resolved */
  drone: { base: 58, steps: [0, 2, 4, -3, 1, 6, 3] },
  movements: [
    {
      label: "SMALL TABLES", seconds: 13,
      line: "Find me at the harbor, at the small tables, watching.",
      cues: [
        { at: 0.20, f: 140, decay: 0.4, gain: 0.30, partials: [1, 1.6], noise: 0.8, nDecay: 0.30, seed: 1301 },
        { at: 0.62, f: 110, decay: 0.5, gain: 0.25, partials: [1, 1.4], noise: 0.7, nDecay: 0.35, seed: 1302 },
      ],
      draw(u, F) {
        harborWater(F, u);
        pier(F);
        /* the window, distant and small — nothing to see in it yet */
        drawWindowSolid(F, 150, 34, 6, 7, 5);
        boat(F, 30, 76 + Math.sin(u * TAU * 0.6) * 1.2, 7, 5);
        boat(F, 170, 84 + Math.sin(u * TAU * 0.5 + 2) * 1.2, 6, 5);
        for (const tx of TABLE_X) table(F, tx, TABLE_Y, 5);
        /* one table is occupied. The others are named by the line
           ("the small tables") but not sat at — only one watcher */
        F.fig(TABLE_X[2] + 9, TABLE_Y, 32, { mode: "sit", face: -1, arms: "down" }, 7);
      },
    },
    {
      label: "COUNTED ORBITS", seconds: 14,
      line: "The couples orbit each other the way Jupiter keeps its moons — close, and counted.",
      cues: [
        { at: 0.08, f: 520, decay: 0.12, gain: 0.35, partials: [1, 2, 3], noise: 0.2, nDecay: 0.02, seed: 1311 },
        { at: 0.30, f: 580, decay: 0.12, gain: 0.35, partials: [1, 2, 3], noise: 0.2, nDecay: 0.02, seed: 1312 },
        { at: 0.52, f: 640, decay: 0.12, gain: 0.35, partials: [1, 2, 3], noise: 0.2, nDecay: 0.02, seed: 1313 },
      ],
      draw(u, F) {
        /* THE SIMILE, STAGED LITERALLY: Jupiter and its moons at top, the
           same small number of couples orbiting the same small tables
           below. Rejected: drawing only the couples and leaving Jupiter as
           a caption — the line's comparison is the point, so both halves
           of it are on screen at once, not one illustrating the other. */
        const jx = 158, jy = 30, jr = 12;
        F.disc(jx, jy, jr, 3);
        for (const dy of [-6, -1, 4]) { const w = Math.sqrt(Math.max(0, jr * jr - dy * dy)); F.line(jx - w, jy + dy, jx + w, jy + dy, 5, 1); }
        const speeds = [3.1, 2.3, 1.6, 1.0], radii = [16, 20, 24, 29];
        for (let m = 0; m < 4; m++) F.ring(jx, jy, radii[m], 2, 1);
        for (let m = 0; m < 4; m++) {
          const a = m * 1.7 + u * TAU * speeds[m];
          F.disc(jx + Math.cos(a) * radii[m], jy + Math.sin(a) * radii[m] * 0.4, 1.6, 6);
        }
        /* the count, put on screen rather than left to be tallied by eye */
        F.ring(10, 10, 4, 2, 1); F.disc(14, 10, 1, 6);
        F.word("4", 24, 10, 9, 6, true);
        pier(F);
        for (let t = 0; t < TABLE_X.length; t++) {
          const cx = TABLE_X[t], cy = TABLE_Y - 9, orbitR = 8;
          F.ring(cx, cy, orbitR, 2, 1);
          const ang = t * 1.4 + u * TAU * (0.7 + t * 0.12);
          const p1 = [cx + Math.cos(ang) * orbitR, cy + Math.sin(ang) * orbitR * 0.35];
          const p2 = [cx + Math.cos(ang + Math.PI) * orbitR, cy + Math.sin(ang + Math.PI) * orbitR * 0.35];
          F.fig(p1[0], p1[1] + 9, 15, { mode: "stand", face: p1[0] < cx ? 1 : -1, arms: "open" }, 6);
          F.fig(p2[0], p2[1] + 9, 15, { mode: "stand", face: p2[0] < cx ? 1 : -1, arms: "open" }, 6);
          table(F, cx, TABLE_Y, 3);
        }
      },
    },
    {
      label: "BURNED STORIES", seconds: 13,
      line: "The elders clutch their pearls and pray. Life has burned all my love stories — victory-less seasons.",
      fx: { shake: (u) => win(u, 0.08, 0.14, 0.5, 0.6) * 1.3 },
      cues: [
        { at: 0.15, f: 200, decay: 0.30, gain: 0.40, partials: [1, 1.8, 2.6], noise: 0.9, nDecay: 0.20, seed: 1321 },
        { at: 0.55, f: 180, decay: 0.35, gain: 0.35, partials: [1, 1.7, 2.4], noise: 0.95, nDecay: 0.25, seed: 1322 },
      ],
      draw(u, F) {
        pier(F);
        elder(F, 26, 128, 40, 6);
        elder(F, 54, 130, 36, 6);
        /* five letters, each catching fire a little after the last — a
           front sweeping the stack rather than one flash. Rejected: one
           bulk fade over the whole cluster, which read as a single object
           dimming rather than five separate stories going out */
        const pagesDefs = [[92, 84, 16, 11], [112, 92, 15, 10], [100, 102, 17, 12], [128, 86, 14, 10], [118, 106, 16, 11]];
        const front = smooth(u);
        pagesDefs.forEach((pd, i) => burnPage(F, pagePoints(pd[0], pd[1], pd[2], pd[3]), clamp01((front - i * 0.13) * 2.4), 5));
        const idxBurning = Math.floor(front / 0.13);
        if (idxBurning >= 0 && idxBurning < pagesDefs.length) {
          const pd = pagesDefs[idxBurning];
          for (let k = 0; k < 3; k++) {
            const fx0 = pd[0] + pd[2] * 0.5 + Math.sin(u * 40 + k) * 2, fy0 = pd[1] + pd[3] - 2 - k * 3;
            F.line(fx0, fy0, fx0 + Math.sin(u * 30 + k * 2) * 3, fy0 - 5, 6, 1.2);
          }
        }
        /* ash, rising off whichever page has already caught */
        for (let k = 0; k < 16; k++) {
          const pIdx = k % pagesDefs.length, pd = pagesDefs[pIdx], spawnU = pIdx * 0.13 + 0.05;
          if (u <= spawnU) continue;
          const age = u - spawnU, bx = pd[0] + F.noise(k, 11) * pd[2];
          const y = pd[1] - age * 66, x = bx + Math.sin(age * 6 + k) * 3;
          if (y > 18) F.disc(x, y, 0.9, 3);
        }
      },
    },
    {
      label: "HARVESTED POWER", seconds: 14,
      line: "So I harvest the flowers instead — scarlet poppies, purple blossoms — and they become my power.",
      cues: [
        { at: 0.10, f: 700, decay: 0.08, gain: 0.40, partials: [1, 2.4], noise: 0.6, nDecay: 0.02, seed: 1331 },
        { at: 0.30, f: 650, decay: 0.08, gain: 0.40, partials: [1, 2.4], noise: 0.6, nDecay: 0.02, seed: 1332 },
        { at: 0.70, f: 220, decay: 0.60, gain: 0.40, partials: [1, 2.0, 3.0], noise: 0.3, nDecay: 0.10, seed: 1333 },
      ],
      draw(u, F) {
        /* AN ABUNDANCE THAT DOES NOT EMPTY. The first pass had the sweep
           erase every flower it passed, and by the second half of the
           movement the field was bare and the frame was 98% paper — one
           harvester cannot be "instead of" a whole meadow if the meadow
           is gone. So the meadow (three rows, eighteen heads, the back
           row's stems reaching well past the mid-line) is drawn every
           frame and never removed; what the sweep actually harvests is a
           handful of taller, separate stalks in front of it. Abundance
           stays on screen the entire movement; the harvesting is still a
           real, visible subtraction, just not of the whole picture. */
        for (let i = 0; i < 7; i++) poppy(F, 10 + i * 26 + (F.noise(i, 3) - 0.5) * 8, 140, 4.0, 5);
        for (let i = 0; i < 6; i++) blossom(F, 24 + i * 29 + (F.noise(i, 9) - 0.5) * 8, 128, 3.0, 5);
        for (let i = 0; i < 5; i++) poppy(F, 18 + i * 36 + (F.noise(i, 15) - 0.5) * 10, 114, 2.2, 4);
        F.line(0, 141, 70, 142, 4, 1); F.line(82, 142, 140, 141, 4, 1); F.line(152, 141, 192, 142, 4, 1);
        /* the harvest targets: six tall stalks, stems long enough to
           clear the mid-line, plucked one at a time as the sweep passes */
        const targets = [20, 52, 84, 112, 144, 174].map((x, i) => ({ x, top: 50 + (F.noise(i, 21) - 0.5) * 14, poppy: i % 2 === 0 }));
        const sweepT = clamp01(u / 0.55);
        const sweepX = lerp(188, 6, smooth(sweepT));
        for (const t of targets) {
          if (t.x <= sweepX) continue;
          F.line(t.x, 140, t.x, t.top, 6, 1.2);
          t.poppy ? (F.disc(t.x, t.top, 3.2, 6), F.disc(t.x, t.top, 1.1, 7))
                  : [0, 1, 2, 3, 4].forEach((k) => F.line(t.x, t.top, t.x + Math.cos(k / 5 * TAU) * 3.2, t.top + Math.sin(k / 5 * TAU) * 3.2, 6, 1));
        }
        const held = targets.filter((t) => t.x <= sweepX);
        if (u < 0.58) {
          F.fig(sweepX, 128, 38, { mode: "walk", phase: u * 7, face: -1, arms: "reach" }, 7);
          held.forEach((t, i) => { const c = i % 6, r = (i / 6) | 0; const bx = sweepX + 9 + c * 3.2, by = 92 - r * 4;
            t.poppy ? poppy(F, bx, by, 1.4, 6) : blossom(F, bx, by, 1.5, 6); });
        } else {
          /* BECOMING: the harvester settles centre-frame and grows large —
             the substitution of limb for stem only reads at a size where
             an arm and a flowering stem are both clearly legible. See
             stemFigure for why the torso stays and only the limbs turn. */
          const settle = ss(0.55, 0.72, u), growth = ss(0.55, 0.92, u);
          const px = lerp(6, 96, settle);
          stemFigure(F, px, 122, 64, growth, 7);
          const remain = held.slice(0, Math.round(held.length * (1 - growth)));
          remain.forEach((t, i) => { const c = i % 6, r = (i / 6) | 0; const bx = px + 11 + c * 3.2, by = 86 - r * 4;
            t.poppy ? poppy(F, bx, by, 1.4, 6) : blossom(F, bx, by, 1.5, 6); });
        }
      },
    },
    {
      label: "REFOCUS", seconds: 14,
      line: "Then, a distant window. She says: you'll see me. Capture the eyes. Refocus. Step back. Say hello.",
      cues: [
        { at: 0.06, f: 900, decay: 0.05, gain: 0.30, partials: [1, 1.5], noise: 0.4, nDecay: 0.02, seed: 1341 },
        { at: 0.62, f: 500, decay: 0.40, gain: 0.45, partials: [1, 2.01, 3.02], noise: 0.15, nDecay: 0.05, seed: 1342 },
      ],
      draw(u, F) {
        /* THE BEST IMAGE IN THE FILM — no fx, nothing competing with it.
           Every other tool in the kit was tried here and cut: a smear made
           the arriving dots look like they were moving rather than
           choosing when to arrive, and a shake read as the window
           trembling rather than the picture sharpening. */
        const cx = 110, cy = 58, hw = 26, hh = 30;
        windowPoints(cx, cy, hw, hh).forEach((p, i) => resolveDot(F, p[0], p[1], p[2], i, u, 0.04, 0.58, 32));
        /* the eyes arrive a little after the frame — focus finds the frame
           first, the face inside it second, which is the order looking
           through a window actually happens in */
        [eyeDots(cx - 9, cy - 3), eyeDots(cx + 9, cy - 3)].forEach((eye, ei) =>
          eye.forEach((p, i) => resolveDot(F, p[0], p[1], 8, 4000 + ei * 50 + i, u, 0.30, 0.76, 26, true)));
        F.line(30, 132, 80, 133, 4, 1); F.line(96, 133, 150, 132, 4, 1);
        /* step back: smaller, and a half-step further from the glass */
        const back = ss(0.80, 0.98, u);
        F.fig(96, lerp(136, 127, back), lerp(30, 21, back), { mode: "stand", face: 1, arms: u > 0.90 ? "up" : "down" }, 7);
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
        harborWater(F, u, 4);
        pier(F);
        /* the window, resolved now and staying that way — same geometry
           as M1's tiny box and M5's lattice, just held still */
        const wx = 146, wy = 38;
        drawWindowSolid(F, wx, wy, 15, 17, 5);
        const pulse = 0.7 + 0.3 * Math.sin(u * TAU * 1.4);
        F.disc(wx - 6, wy - 2, 1.6 * pulse, 8); F.disc(wx + 6, wy - 2, 1.6 * pulse, 8);
        /* a boat leaves without them — the one thing in frame that goes */
        const s = smooth(u);
        boat(F, lerp(60, 150, s), lerp(96, HOR + 4, s), lerp(9, 3, s), 4);
        for (const tx of TABLE_X) table(F, tx, TABLE_Y, 4);
        table(F, TABLE_X[2], TABLE_Y, 6);
        F.fig(TABLE_X[2] + 9, TABLE_Y, 32, { mode: "sit", face: -1, arms: "reach" }, 7);
      },
    },
  ],
};
