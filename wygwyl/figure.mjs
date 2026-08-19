/* ============================================================================
   figure.mjs — THE BODY.

   The first pass of this suite drew people as stick figures: single-cell lines
   from a hip to a shoulder to a head-disc. They read as people, which is why
   it survived fourteen films, but they cannot ACT. A line has no mass, so it
   cannot take weight on one leg; it has no width, so it cannot turn; it has no
   volume, so nothing can be occluded by it and a body can never be in front of
   its own arm.

   This is the replacement. It keeps the same call — fig(x, y, h, pose, level)
   with x,y at the FEET — so every film in the suite gets it at once, and every
   pose name that already existed still means what it meant.

   THREE IDEAS, AND THE THIRD IS THE ONE THAT MATTERS.

   1. VOLUME, NOT LINE. Every limb is a tapered capsule: a run of discs whose
      radius interpolates from proximal to distal, so a thigh is thicker than a
      shin and an upper arm is thicker than a wrist. The torso is a real
      quadrilateral from shoulders to hips.

   2. CONTOUR PLUS FILL, IN THAT ORDER, WITH THE LAW INTACT. Each part is laid
      down twice: the whole shape at the contour level with `ink` (which only
      darkens, so it never erases the world behind it), then the shape inset by
      a cell or so at the fill level with `put` (which overwrites, but only
      inside ground the contour pass just claimed). The result is a hard black
      edge around a flat mid tone — the dot law's own idiom, and no gradient
      anywhere.

   3. DRAWING ORDER IS OCCLUSION. Because the fill pass overwrites, a part drawn
      later hides one drawn earlier. So the parts are emitted back to front —
      far arm, far leg, torso, near leg, near arm, head — and a body is suddenly
      in front of itself. This is what makes a reach read as a reach rather than
      as a line crossing a line, and it costs nothing but the order of six
      calls.

   PROPORTION is the standard figure-drawing progression, 7.6 heads for an
   adult, with the landmarks as fractions of total height measured from the
   ground. Nothing here is invented; it is the same table the butterfly
   halfworld's hero rig uses, restated for a lattice instead of a canvas.

   SMALL BODIES DEGRADE ON PURPOSE. Below about fourteen cells a contour and a
   fill are the same cell and the rig turns to mud, so under that height it
   draws a compact solid silhouette instead. Several films stage crowds at
   h=8..13 and they must not become noise.
   ========================================================================= */

const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

/* landmarks as a fraction of total height, from the ground up */
const L = {
  ankle: 0.045, knee: 0.285, hip: 0.500, waist: 0.605,
  chest: 0.720, shoulder: 0.815, chin: 0.855, crown: 1.0,
};
/* Widths as a fraction of total height. These are heavier than a first pass
   used: at h=44 an arm at 0.031 is under three cells across and the halftone
   eats it, so a body drawn correctly by the numbers came out spindly. A figure
   in a lattice has to be built for the lattice, not for the anatomy book. */
const W = {
  head: 0.076, jaw: 0.058, neck: 0.032,
  shoulder: 0.112, chestHalf: 0.098, waistHalf: 0.076, hipHalf: 0.084,
  armTop: 0.042, armMid: 0.033, armEnd: 0.024,
  legTop: 0.060, legMid: 0.046, legEnd: 0.030,
  hand: 0.030, foot: 0.034,
};
/* No limb may be thinner than this many cells, whatever the arithmetic says.
   Crowds get staged at h=9 and an arm at 0.28 of a cell is not a thin arm, it
   is no arm — the body silently loses its limbs and reads as a smudge. */
const MINR = 0.85;

/* ---------------------------------------------------------------- THE GUISE
   HOW A DRAWN BODY CAN BE UNMISTAKABLY ONE MAN AND ALSO ANYBODY.

   This world has no faces. At the sizes it draws at, a face is four cells and
   any attempt at one produces a doll. So a likeness cannot be carried by
   features — which turns out to be the useful constraint, because it forces
   the likeness into the SILHOUETTE, and a silhouette is exactly the register
   where both halves of that sentence can be true at once.

   Five marks, all of them outline, none of them a feature:

     hair      the mass on the back and top of the skull, and where its edge
               falls. This is the single strongest identity signal at any
               distance — you know people by their heads from across a street.
     beard     jaw mass. Squares and lengthens the lower head.
     shoulderSlope   square shoulders or fallen ones. Posture, not anatomy.
     stoop     the habitual forward carry of the chest.
     neck      thickness, which reads as build.

   Set them from a real person and the drawn body is recognisably that person
   in every scene, including the dark ones where nothing but the outline
   survives — which is the case this was built for. Describe the same figure in
   words and you have said "a man with short hair and a beard, shoulders a
   little rounded", which is nobody in particular. That is the whole idea: the
   recognition is real and the description is universal.

   POET is measured off the lead clip for OUT OF LIFE — the standing silhouette
   against the hazed window, which is the frame where his outline is clearest. */
export const GUISES = {
  everyman: { hair: 0, beard: 0, shoulderSlope: 0, shoulderWide: 1, stoop: 0, neck: 1, headScale: 1 },
  poet:     { hair: 0.34, beard: 0.30, shoulderSlope: 0.26, shoulderWide: 1.09, stoop: 0.05, neck: 1.22, headScale: 1.05 },
  /* the turned back in MORE HAZE: same build, no beard read from behind, and
     the hair is the only thing you have to know them by */
  turned:   { hair: 0.40, beard: 0, shoulderSlope: 0.24, shoulderWide: 1.07, stoop: 0.02, neck: 1.18, headScale: 1.04 },
  elder:    { hair: 0.14, beard: 0.42, shoulderSlope: 0.44, shoulderWide: 0.94, stoop: 0.16, neck: 0.92, headScale: 1.06 },
  child:    { hair: 0.26, beard: 0, shoulderSlope: 0.10, shoulderWide: 0.84, stoop: 0, neck: 0.85, headScale: 1.30 },
};
function guiseOf(g) {
  if (!g) return GUISES.everyman;
  if (typeof g === "string") return GUISES[g] || GUISES.everyman;
  return { ...GUISES.everyman, ...g };
}

/* the mass on the back and top of the skull — an arc of discs, so it hugs the
   head instead of sitting on it as a hat, and it never crosses the face side */
function hairCap(K, cx, cy, r, face, amount, level) {
  if (amount <= 0.01) return;
  const t = Math.max(0.24, amount) * r * 0.95;
  /* Solved in a canonical frame where the face points +x, then mirrored by
     `face`. The sweep runs hairline → crown → nape and stops there. An earlier
     version ran it all the way round to the front-bottom, which put a mass of
     hair under the chin and read as a growth on the shoulder. */
  const a0 = 0.18 * Math.PI, a1 = 1.22 * Math.PI;
  const n = Math.max(9, Math.ceil((a1 - a0) * r * 1.4));
  /* A CRESCENT, NOT A RING. Placing discs along one radius drew a hoop around
     the skull that read as a helmet at any size worth looking at. Each angle
     now lays a short radial run from inside the skull out past its edge, so
     the marks overlap into one mass with a soft outer profile — hair sitting
     ON the head rather than orbiting it. */
  const rIn = r * 0.62, rOut = r + t * 0.22;
  for (let i = 0; i <= n; i++) {
    const a = a0 + (a1 - a0) * (i / n);
    const cs = Math.cos(a) * face, sn = -Math.sin(a);
    /* the mass is deepest at the crown and thins toward hairline and nape,
       which is where a head of hair actually loses its depth */
    const d = 0.45 + 0.55 * Math.sin(Math.PI * (i / n));
    const ro = lerp(r * 0.96, rOut, d);
    capsule(K, cx + cs * rIn, cy + sn * rIn, cx + cs * ro, cy + sn * ro,
            t * 0.42, t * 0.30, level, level, true);
  }
}

/* a tapered capsule: the whole vocabulary of a limb in this world */
function capsule(K, x0, y0, x1, y1, r0, r1, contour, fill, solid) {
  r0 = Math.max(MINR, r0); r1 = Math.max(MINR, r1);
  const n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
  for (let i = 0; i <= n; i++) {
    const t = i / n, r = lerp(r0, r1, t);
    K.disc(lerp(x0, x1, t), lerp(y0, y1, t), r, contour);
  }
  if (solid) return;
  const inset = 1.15;
  for (let i = 0; i <= n; i++) {
    const t = i / n, r = lerp(r0, r1, t) - inset;
    if (r > 0.35) K.disc(lerp(x0, x1, t), lerp(y0, y1, t), r, fill, true);
  }
}

/* a convex quad, scan-filled — the torso, and nothing else needs it */
function quad(K, p, contour, fill, solid) {
  let minY = 1e9, maxY = -1e9;
  for (const q of p) { if (q[1] < minY) minY = q[1]; if (q[1] > maxY) maxY = q[1]; }
  const span = (yy, shrink) => {
    let lo = 1e9, hi = -1e9;
    for (let i = 0; i < p.length; i++) {
      const a = p[i], b = p[(i + 1) % p.length];
      if ((a[1] <= yy && b[1] >= yy) || (b[1] <= yy && a[1] >= yy)) {
        const t = Math.abs(b[1] - a[1]) < 1e-6 ? 0 : (yy - a[1]) / (b[1] - a[1]);
        const x = a[0] + (b[0] - a[0]) * t;
        if (x < lo) lo = x; if (x > hi) hi = x;
      }
    }
    if (hi < lo) return null;
    return [lo + shrink, hi - shrink];
  };
  for (let yy = Math.floor(minY); yy <= Math.ceil(maxY); yy++) {
    const s = span(yy, 0);
    if (!s) continue;
    for (let x = Math.floor(s[0]); x <= Math.ceil(s[1]); x++) K.ink(x, yy, contour);
  }
  if (solid) return;
  for (let yy = Math.floor(minY) + 1; yy <= Math.ceil(maxY) - 1; yy++) {
    const s = span(yy, 1.2);
    if (!s || s[1] < s[0]) continue;
    for (let x = Math.ceil(s[0]); x <= Math.floor(s[1]); x++) K.put(x, yy, fill);
  }
}

/* ---------------------------------------------------------------- the pose
   Everything a body does here is one of a small number of readable acts, and
   each is a set of joint targets rather than a drawing. `face` is +1/-1 and
   flips the whole rig; `u`-driven values arrive from the caller because
   nothing in this world may keep state. */
function solve(h, pose, stocky = 1, G = GUISES.everyman) {
  const face = pose.face === -1 ? -1 : 1;
  const mode = pose.mode || "stand";
  const ph = pose.phase || 0;
  const a = pose.arms || (mode === "walk" ? "swing" : "down");

  /* breath is under one percent of frame and deniable, which is exactly what
     the butterfly halfworld calls a HOLD — it keeps a standing body alive
     without ever becoming a thing that happens. */
  const breath = (pose.breath ?? 1) * Math.sin(ph * TAU * 0.42) * h * 0.006;
  /* contrapposto: weight on one leg drops the free hip and counter-tilts the
     shoulders. This one number is most of what separates a person standing
     from a diagram of a person standing. */
  const wt = pose.weight ?? (mode === "stand" ? 0.5 : 0);
  const hipTilt = (wt - 0.5) * h * 0.028 * face;
  const shTilt = -(wt - 0.5) * h * 0.020 * face;

  let hipY = L.hip * h, shY = L.shoulder * h + breath;
  let footA = [-W.hipHalf * h * 0.85, 0], footB = [W.hipHalf * h * 0.85, 0];
  let kneeA = null, kneeB = null;
  let crouch = pose.crouch || 0;

  if (mode === "walk") {
    const s = Math.sin(ph * TAU), c = Math.cos(ph * TAU);
    footA = [s * h * 0.20, -Math.max(0, Math.sin(ph * TAU + 1.7)) * h * 0.055];
    footB = [-s * h * 0.20, -Math.max(0, Math.sin(ph * TAU + TAU / 2 + 1.7)) * h * 0.055];
    hipY -= Math.abs(c) * h * 0.014;
    shY -= Math.abs(c) * h * 0.010;
  } else if (mode === "sit") {
    hipY = L.hip * h * 0.56; shY = L.shoulder * h * 0.74 + breath;
    footA = [face * h * 0.26, 0]; footB = [face * h * 0.32, 0];
    kneeA = [face * h * 0.26, hipY - h * 0.01];
    kneeB = [face * h * 0.31, hipY - h * 0.01];
  } else if (mode === "fall") {
    footA = [-h * 0.16, -h * 0.06]; footB = [h * 0.20, -h * 0.02];
  }
  if (crouch) { hipY -= h * 0.16 * crouch; shY -= h * 0.20 * crouch; }

  const hip = [hipTilt * 0.5, hipY];
  const sh = [shTilt * 0.5 + face * G.stoop * h * 0.5, shY];
  const neck = [sh[0] + face * h * 0.004, shY + h * 0.030];
  const headC = [neck[0] + (pose.headTurn || 0) * h * 0.03 * face,
                 shY + h * (L.crown - L.shoulder) * 0.60 + breath];

  /* hands */
  let handA, handB, elbowA = null, elbowB = null;   /* elbows may be solved by a pose */
  const armLen = h * (L.shoulder - L.hip) * 1.34;
  if (a === "down") {
    handA = [hip[0] - W.hipHalf * h * 0.95, hipY - h * 0.03];
    handB = [hip[0] + W.hipHalf * h * 0.95, hipY - h * 0.05];
  } else if (a === "open") {
    handA = [-h * 0.31, shY - h * 0.06]; handB = [h * 0.31, shY - h * 0.05];
  } else if (a === "up") {
    handA = [-h * 0.19, shY + h * 0.28]; handB = [h * 0.19, shY + h * 0.30];
    /* Arms overhead bend at the elbow OUTWARD and UP, not sideways. Letting
       the generic perpendicular-bend rule solve this put both elbows out past
       the hands and the raised arms read as a pair of wings. */
    elbowA = [-h * 0.24, shY + h * 0.11]; elbowB = [h * 0.24, shY + h * 0.13];
  } else if (a === "reach") {
    handA = [face * h * 0.36, shY + h * 0.05];
    handB = [face * h * 0.09, hipY - h * 0.02];
    elbowA = [face * h * 0.20, shY - h * 0.03];
  } else if (a === "hold") {
    handA = [face * h * 0.13, shY - h * 0.10]; handB = [face * h * 0.15, shY - h * 0.13];
  } else {                                   // swing
    const s = Math.sin(ph * TAU);
    handA = [s * h * 0.17, hipY - h * 0.02];
    handB = [-s * h * 0.17, hipY - h * 0.04];
  }
  if (pose.gesture) {                        // a caller-supplied hand target
    handA = [pose.gesture[0], pose.gesture[1]];
    elbowA = [(sh[0] + handA[0]) / 2 + face * h * 0.07, (sh[1] + handA[1]) / 2 - h * 0.02];
  }

  /* elbows and knees bend AWAY from the body so the limb reads as jointed */
  const bend = (p0, p1, out, k) => {
    const mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2;
    const dx = p1[0] - p0[0], dy = p1[1] - p0[1];
    const len = Math.hypot(dx, dy) || 1;
    return [mx - (dy / len) * out * k, my + (dx / len) * out * k];
  };
  const SW = W.shoulder * h * stocky * G.shoulderWide, HW = W.hipHalf * h * stocky;
  /* fallen shoulders drop at the OUTER end only — the neck stays where it is,
     which is what makes it read as carriage rather than as a shrug */
  const drop = G.shoulderSlope * SW * 0.55;
  const shA = [sh[0] - SW, sh[1] - drop], shB = [sh[0] + SW, sh[1] - drop];
  elbowA = elbowA || bend(shA, handA, h * 0.055, -face);
  elbowB = elbowB || bend(shB, handB, h * 0.055, -face);
  const hipA = [hip[0] - HW, hip[1]], hipB = [hip[0] + HW, hip[1]];
  kneeA = kneeA || bend(hipA, footA, h * 0.045, face);
  kneeB = kneeB || bend(hipB, footB, h * 0.045, face);

  return { face, hip, sh, shA, shB, hipA, hipB, neck, headC,
           handA, handB, elbowA, elbowB, footA, footB, kneeA, kneeB, armLen };
}

/* ------------------------------------------------------------ small bodies
   Under about sixteen cells the proportional rig stops describing a person.
   The arithmetic is still right, but every part rounds to one or two cells and
   the result is a vertical smear with specks — worse than the stick figure it
   replaced, which at least had separated limbs.

   So a small body is not a shrunken large one. It is a DIFFERENT DRAWING with
   the same silhouette: a head that is deliberately too big (which is how
   distant figures read in any graphic tradition), one chunky trunk, and legs
   and arms wide enough to survive the lattice. It answers the same poses,
   because a crowd still has to walk and raise its arms. */
function drawSmall(K, x, y, h, pose, contour) {
  const G = guiseOf(pose.guise);
  const face = pose.face === -1 ? -1 : 1;
  const mode = pose.mode || "stand";
  const ph = pose.phase || 0;
  const a = pose.arms || (mode === "walk" ? "swing" : "down");
  /* A SMALL FIGURE IS A SILHOUETTE, NOT A SKELETON. The first version of this
     path drew thin capsules on the joint solution, and thin capsules ARE stick
     figures — the very thing the rig replaced, still turning up in every crowd
     and every distant body in the suite. A small body has to be a MASS: a big
     head, a trunk with real width, and limbs thick enough to be seen as limbs
     rather than as the wires between them. Everything here is deliberately
     heavier than proportion allows, because at this size the silhouette is the
     only information that survives. */
  const hr = Math.max(1.7, h * 0.150) * G.headScale;
  const tw = Math.max(2.0, h * 0.155) * G.shoulderWide;
  const lw = Math.max(1.35, h * 0.088);
  const aw = Math.max(1.15, h * 0.072);
  const rot = pose.rot || 0, cs = Math.cos(rot), sn = Math.sin(rot);
  const hipY = h * 0.46, shY = h * 0.78;
  const T = (bx, by) => {
    const dx = bx, dy = by - hipY;
    return [x + dx * cs - dy * sn, y - (hipY + dx * sn + dy * cs)];
  };
  let fA = [-h * 0.17, 0], fB = [h * 0.17, 0];
  if (mode === "walk") {
    const s = Math.sin(ph * TAU);
    fA = [s * h * 0.20, -Math.max(0, Math.sin(ph * TAU + 1.7)) * h * 0.06];
    fB = [-s * h * 0.20, -Math.max(0, Math.sin(ph * TAU + TAU / 2 + 1.7)) * h * 0.06];
  } else if (mode === "sit") { fA = [face * h * 0.24, 0]; fB = [face * h * 0.30, 0]; }
  let hA, hB;
  if (a === "up") { hA = [-h * 0.17, shY + h * 0.28]; hB = [h * 0.17, shY + h * 0.30]; }
  else if (a === "open") { hA = [-h * 0.30, shY - h * 0.04]; hB = [h * 0.30, shY - h * 0.03]; }
  else if (a === "reach") { hA = [face * h * 0.34, shY + h * 0.04]; hB = [face * h * 0.08, hipY]; }
  else if (a === "swing") { const s = Math.sin(ph * TAU);
    hA = [s * h * 0.16, hipY - h * 0.02]; hB = [-s * h * 0.16, hipY - h * 0.03]; }
  else { hA = [-h * 0.13, hipY - h * 0.02]; hB = [h * 0.13, hipY - h * 0.02]; }
  const seg = (p0, p1, r0, r1) => { const A = T(p0[0], p0[1]), B = T(p1[0], p1[1]);
    capsule(K, A[0], A[1], B[0], B[1], r0, r1 ?? r0 * 0.8, contour, contour, true); };
  const hip = [0, hipY], sh = [0, shY];
  /* arms are hung from the OUTSIDE of the shoulder, so the silhouette gets the
     bump that says "arm" instead of a line leaving the middle of a trunk */
  const shL = [-tw * 0.55, shY], shR = [tw * 0.55, shY];
  seg(shL, hA, aw); seg(shR, hB, aw);
  seg(hip, fA, lw); seg(hip, fB, lw);
  /* the trunk last and widest: shoulders broader than hips, one solid mass */
  seg(hip, sh, tw * 0.82, tw);
  const hd = T(0, shY + h * 0.115);
  K.disc(hd[0], hd[1], hr, contour);
  hairCap(K, hd[0], hd[1], hr, face, G.hair, contour);
}

/* --------------------------------------------------------------- the draw */
export function drawFigure(K, x, y, h, pose = {}, level = 7) {
  if (h < 4) return;
  const contour = clamp(level, 1, 7);
  const fill = clamp(contour - 3, 1, 7);
  /* Raised from 16: between 16 and 21 the proportional rig produced limbs
     one and two cells wide, which is a stick figure however it was derived.
     The silhouette path carries that range now. */
  if (h < 22) { drawSmall(K, x, y, h, pose, contour); return; }
  const solid = h < 30;            // volumes, but no hollow: the fill would close up

  /* A SMALL BODY MUST BE A STOCKIER BODY. Width scales with h, but legibility
     does not — it is set by the lattice, which does not get finer when the
     figure gets smaller. So a correctly-proportioned 18-cell body has a
     four-cell chest and reads as a wire, while the same proportions at 48
     cells read as a person. Widths are therefore multiplied back up as height
     falls: identity at 40 and above, half again as wide by 16. This is the
     same reason a woodcut of a distant figure is chunkier than the geometry
     says it should be. */
  const stocky = clamp(1 + (40 - h) / 24 * 0.30, 1, 1.55);

  const G = guiseOf(pose.guise);
  const P = solve(h, pose, stocky, G);
  const rot = pose.rot || 0, lean = pose.lean || 0;
  const cs = Math.cos(rot), sn = Math.sin(rot);
  const px = P.hip[0], py = P.hip[1];
  /* every joint is solved in a body space whose origin is the ground under the
     hip, then rotated about the hip — so `rot` tumbles a whole person rather
     than shearing one, which is what film 01's fall needs. */
  const T = (p) => {
    let dx = p[0] - px, dy = p[1] - py;
    const rx = dx * cs - dy * sn, ry = dx * sn + dy * cs;
    return [x + px + rx + lean * (py - p[1]) * 0.8, y - (py + ry)];
  };

  const HR = W.head * h * (1 + (stocky - 1) * 0.6) * G.headScale, JR = W.jaw * h * (1 + G.beard * 0.55);
  const aT = W.armTop * h * stocky, aM = W.armMid * h * stocky, aE = W.armEnd * h * stocky;
  const lT = W.legTop * h * stocky, lM = W.legMid * h * stocky, lE = W.legEnd * h * stocky;
  const [shA, shB] = [T(P.shA), T(P.shB)];
  const [hipA, hipB] = [T(P.hipA), T(P.hipB)];
  const [elA, elB] = [T(P.elbowA), T(P.elbowB)];
  const [haA, haB] = [T(P.handA), T(P.handB)];
  const [knA, knB] = [T(P.kneeA), T(P.kneeB)];
  const [ftA, ftB] = [T(P.footA), T(P.footB)];
  const nk = T(P.neck), hd = T(P.headC);

  /* BACK TO FRONT. The fill pass overwrites, so order is occlusion: the far
     side of the body is laid down first and the near arm ends up in front of
     the chest. This is the whole reason a reach reads as a reach. */
  const far = P.face >= 0 ? "A" : "B", near = far === "A" ? "B" : "A";
  const arm = (which) => {
    const s = which === "A" ? shA : shB, e = which === "A" ? elA : elB;
    const ha = which === "A" ? haA : haB;
    capsule(K, s[0], s[1], e[0], e[1], aT, aM, contour, fill, solid);
    capsule(K, e[0], e[1], ha[0], ha[1], aM, aE, contour, fill, solid);
    K.disc(ha[0], ha[1], W.hand * h, contour);
    if (!solid) K.disc(ha[0], ha[1], W.hand * h - 1.1, fill, true);
  };
  const leg = (which) => {
    const hp = which === "A" ? hipA : hipB, k = which === "A" ? knA : knB;
    const ft = which === "A" ? ftA : ftB;
    capsule(K, hp[0], hp[1], k[0], k[1], lT, lM, contour, fill, solid);
    capsule(K, k[0], k[1], ft[0], ft[1], lM, lE, contour, fill, solid);
    const fw = W.foot * h * P.face;
    capsule(K, ft[0], ft[1], ft[0] + fw, ft[1] + 0.5, lE * 0.8, lE * 0.55, contour, fill, true);
  };

  arm(far); leg(far);

  const chestY = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
  const cA = chestY(shA, hipA, 0.42), cB = chestY(shB, hipB, 0.42);
  const wA = chestY(shA, hipA, 0.72), wB = chestY(shB, hipB, 0.72);
  quad(K, [
    [shA[0], shA[1]], [shB[0], shB[1]],
    [cB[0] + (shB[0] - cB[0]) * 0.12, cB[1]],
    [wB[0] * 0.5 + hipB[0] * 0.5, wB[1]],
    [hipB[0], hipB[1]], [hipA[0], hipA[1]],
    [wA[0] * 0.5 + hipA[0] * 0.5, wA[1]],
    [cA[0] + (shA[0] - cA[0]) * 0.12, cA[1]],
  ], contour, fill, solid);

  leg(near); arm(near);

  /* neck, then head. The head is an oval with a jaw: a circle alone reads as a
     ball on a stick, and the jaw is the cheapest mark that makes it a skull. */
  capsule(K, (shA[0] + shB[0]) / 2, (shA[1] + shB[1]) / 2, nk[0], nk[1],
          W.neck * h * 1.25 * G.neck, W.neck * h * G.neck, contour, fill, solid);
  const tilt = (pose.headTilt || 0) * 0.5;
  K.disc(hd[0], hd[1], HR, contour);
  capsule(K, hd[0] - Math.sin(tilt) * JR * 0.3, hd[1] + JR * (0.55 + G.beard * 0.25),
          hd[0] + P.face * JR * 0.42, hd[1] + JR * (0.80 + G.beard * 0.30),
          JR * 0.72, JR * (0.5 + G.beard * 0.34), contour, fill, true);
  if (!solid) {
    K.disc(hd[0], hd[1], HR - 1.15, fill, true);
    /* One mark for where the face points. Not a face — this world does not
       have faces at this scale, and drawing eyes at nine cells makes a doll. */
    K.disc(hd[0] + P.face * HR * 0.44, hd[1] + HR * 0.10, Math.max(0.8, HR * 0.17), contour);
  }
  hairCap(K, hd[0], hd[1], HR, P.face, G.hair, contour);
}
