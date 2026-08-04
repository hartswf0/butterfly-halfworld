/* ============================================================
   assets/creature/_kit.mjs — THE BEAST RIG
   Private support module for the six ABIDING ACRES creature assets
   (hap, deer, cat, crows, vultures, trout). Nothing else imports it.
   Named with a leading underscore following the repo's own precedent,
   assets/set/_kit.mjs.

   WHY THIS EXISTS.
   engine/figure-hero.mjs is a matrix skeleton hung off a VERTICAL spine:
   pelvis -> spineMid -> chest -> neck -> head, with two-segment arms and
   legs. It is an excellent human and it is not a dog. A quadruped's spine
   is HORIZONTAL and its width varies along its length (deep chest, tucked
   loin, round croup); a soaring bird has no legs in frame at all and its
   whole silhouette is two swept planes; a trout is a single tapered mass
   seen through moving water. None of those is a configuration of a biped.

   So this kit supplies the same three things figure-hero supplies, for a
   horizontal spine:

     beastBody()  ONE closed contour swept from a centreline + half-width
                  profile. A body is never a stack of ellipses — the human
                  rig builds its torso as a single polygon and so does this.
     limbChain()  an n-segment limb ending in a foot block (paw / hoof /
                  toes), drawn with pen.limb() exactly as the human rig
                  draws an arm: ink capsule under, tone capsule over.
     headFrame()  a translated+rotated local frame so a head is authored
                  once, in its own coordinates, and then aimed.

   FAMILY RESEMBLANCE IS ENFORCED HERE, NOT EYEBALLED.
   Two laws, taken off the human rig and applied to every creature:

     1. CONTOUR WEIGHT. figure-hero strokes its body polygons at 4px on a
        660px-wide canvas and its small features at 2.5–3px. cw(W) below is
        that same ratio, so a deer and a person drawn in one frame at one
        scale carry identical line weight. Nothing in my six sets a raw
        lineWidth; it all goes through cw().
     2. TONE LADDER. figure-hero's palette is a LIGHT body plane (skin
        #d9d4c8 ≈ level 2), a MID garment (#7f7f78..#9a9a92 ≈ level 3–4)
        and near-black accents (shoe #171717, hair #1d1d1d ≈ level 7).
        The ladder below is that palette expressed in the engine's eight
        quantized ink levels. Coats sit at 2–3 so plenty of paper shows —
        the inherited trap is that everything comes out 2–3 levels too dark.

   Everything is deterministic. No Math.random anywhere in this file or the
   six that use it; scatter comes from engine rnd(seed) or a golden-ratio
   walk, so a frame rendered today is bit-identical a year from now.
   ============================================================ */
import { makePen, toneSolid, inkLevel, INK, clamp, lerp } from "../../engine/halfworld-engine.mjs";

export const TAU = Math.PI * 2;
export const P = (x, y) => ({ x, y });
export const clamp01 = x => clamp(x, 0, 1);

/* ---- LAW 1: contour weight, taken off figure-hero (4px @ 660 wide) ---- */
export const cw   = (W, k = 1) => Math.max(1.2, W * 0.0061 * k);
/* small features — the human rig's 2.5–3px seams and creases */
export const sw   = (W, k = 1) => Math.max(1.6, W * 0.0042 * k);

/* ---- LAW 2: the tone ladder ---- */
export const L = i => toneSolid(inkLevel(i));
export const TONE = {
  PAPERISH : 1,   // white bib, white throat patch, grey muzzle, silver trailing edge
  COAT     : 2,   // the default animal plane. LIGHT. paper must show through it.
  COAT_DEEP: 3,   // flank/haunch/shoulder shading, far-side legs on a light animal
  MID      : 4,   // hoof horn, gravel, wet asphalt
  DARK     : 5,   // a dark ear, a shadowed underside
  DEEP     : 6,   // a duller crow, a fish's dorsal
  INKY     : 7,   // nose, hoof, pupil, a crow. the accent, used sparingly
};

/* ============================================================
   beastBody — the horizontal-spine equivalent of figure-hero's drawTorso().
   pts: [{x, y, w}] a centreline from TAIL end to HEAD end, w = half-width.
   The rails are offset along the curve normal and closed with rounded caps,
   so the whole animal is ONE path with ONE contour. A silhouette drawn this
   way cannot develop the internal seams that a stack of ellipses develops.
   ============================================================ */
function rails(pts){
  const n = pts.length, top = [], bot = [];
  for (let i = 0; i < n; i++){
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let tx = b.x - a.x, ty = b.y - a.y;
    const m = Math.hypot(tx, ty) || 1; tx /= m; ty /= m;
    const nx = -ty, ny = tx;
    top.push(P(pts[i].x + nx * pts[i].w, pts[i].y + ny * pts[i].w));
    bot.push(P(pts[i].x - nx * pts[i].w, pts[i].y - ny * pts[i].w));
  }
  return { top, bot };
}
/* smooth polyline: quadratics through segment midpoints (no cusps) */
export function smoothTo(g, pts, from = 0){
  for (let i = from; i < pts.length - 1; i++){
    const a = pts[i], b = pts[i + 1];
    g.quadraticCurveTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2);
  }
  const last = pts[pts.length - 1];
  g.lineTo(last.x, last.y);
}
export function beastPath(g, pts){
  const { top, bot } = rails(pts);
  const n = pts.length;
  g.moveTo(top[0].x, top[0].y);
  smoothTo(g, top);
  // head cap: swing around the nose end through an extended tip
  const h = pts[n - 1], hPrev = pts[n - 2];
  let hx = h.x - hPrev.x, hy = h.y - hPrev.y;
  const hm = Math.hypot(hx, hy) || 1; hx /= hm; hy /= hm;
  g.quadraticCurveTo(h.x + hx * h.w * 1.25, h.y + hy * h.w * 1.25, bot[n - 1].x, bot[n - 1].y);
  const rev = bot.slice().reverse();
  smoothTo(g, rev);
  // tail cap
  const t0 = pts[0], t1 = pts[1];
  let bx = t0.x - t1.x, by = t0.y - t1.y;
  const bm = Math.hypot(bx, by) || 1; bx /= bm; by /= bm;
  g.quadraticCurveTo(t0.x + bx * t0.w * 1.25, t0.y + by * t0.w * 1.25, top[0].x, top[0].y);
  g.closePath();
}
export function beastBody(pen, pts, tone, lw){
  pen.paint(() => beastPath(pen.ctx, pts), tone, lw);
}

/* ============================================================
   limbChain — an n-segment limb. Same construction as figure-hero's arms:
   an ink capsule under a tone capsule, width tapering down the chain, then
   a foot block. joints: [{x,y}, ...] proximal -> distal.
   foot: "paw" | "hoof" | "toes" | "none"
   ============================================================ */
export function limbChain(pen, joints, w0, tone, { foot = "paw", W = 660, taper = 0.80, dir = 1, recede = 0 } = {}){
  const g = pen.ctx;
  let w = w0;
  /* A LEG THINNER THAN ITS OWN CONTOUR IS A LINE, NOT A TUBE. pen.limb() lays
     an ink capsule of (w + 7.6px) under the tone capsule, which is right for a
     human arm and catastrophic for a deer's cannon bone: at w = 3px the leg
     prints as 10px of solid ink and the animal reads as a black trestle. Below
     the threshold the segment is drawn as a single ink stroke instead — which
     is what a pen does when the form is narrower than the nib. */
  const thin = w0 < cw(W) * 2.0;
  /* a THIN limb is pure ink, so the far pair of legs would print as dark as
     the near pair and the animal would lose its depth. recede fades them. */
  if (recede){ g.save(); g.globalAlpha = 1 - recede; }
  for (let i = 0; i < joints.length - 1; i++){
    const a = joints[i], b = joints[i + 1];
    if (thin) pen.ink(() => { g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); }, Math.max(sw(W, 0.9), w * 1.15));
    else      pen.limb(() => { g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); }, tone, w);
    w *= taper;
  }
  const f = joints[joints.length - 1];
  if (recede) g.restore();
  if (foot === "paw"){
    pen.paint(() => { g.ellipse(f.x + dir * w * 0.42, f.y - w * 0.10, w * 0.95, w * 0.55, 0, 0, TAU); }, tone, cw(W, 0.7));
  } else if (foot === "hoof"){
    if (recede){ g.save(); g.globalAlpha = 1 - recede; }
    /* a white-tailed deer's hoof is a small dark wedge — one of the few
       level-7 accents on an otherwise light animal, and the thing that puts
       the leg ON the asphalt rather than near it. */
    pen.paint(() => {
      g.moveTo(f.x - w * 0.52, f.y - w * 0.16);
      g.lineTo(f.x + dir * w * 0.86, f.y - w * 0.10);
      g.lineTo(f.x + dir * w * 0.72, f.y + w * 0.62);
      g.lineTo(f.x - w * 0.40, f.y + w * 0.58);
      g.closePath();
    }, L(TONE.INKY), cw(W, 0.6));
    if (recede) g.restore();
  } else if (foot === "toes"){
    g.strokeStyle = INK; g.lineWidth = sw(W, 1.3); g.lineCap = "round";
    for (let k = -1; k <= 1; k++){
      g.beginPath(); g.moveTo(f.x, f.y);
      g.lineTo(f.x + dir * w * (1.5 - Math.abs(k) * 0.35), f.y + k * w * 0.85 + w * 0.30);
      g.stroke();
    }
    g.beginPath(); g.moveTo(f.x, f.y); g.lineTo(f.x - dir * w * 0.85, f.y + w * 0.25); g.stroke();
  }
  return f;
}

/* ============================================================
   headFrame — author a head once in local coordinates, then aim it.
   ============================================================ */
export function headFrame(ctx, at, ang, fn, scale = 1){
  ctx.save(); ctx.translate(at.x, at.y); ctx.rotate(ang);
  if (scale !== 1) ctx.scale(scale, scale);
  fn(); ctx.restore();
}

/* ============================================================
   eye — the ONE eye construction shared by all six, lifted from the human
   rig (pale sclera disc, ink rim, dark iris) so a dog's eye and a person's
   eye are the same drawing at different sizes.
   opts.cloud 0..1  lens haze: the iris goes PALE and gains a rim, which is
                    exactly how a cataract reads on paper — the dark centre
                    that every other eye in this film has, missing.
   opts.closed      an ink crescent instead.
   ============================================================ */
export function eye(pen, x, y, r, { cloud = 0, closed = 0, W = 660, iris = TONE.INKY } = {}){
  const g = pen.ctx;
  if (closed > 0.5){
    pen.ink(() => { g.moveTo(x - r, y); g.quadraticCurveTo(x, y + r * 0.85, x + r, y); }, sw(W, 1.5));
    return;
  }
  /* A CLOUDED eye is drawn as ONE disc: level-2 lens, heavy ink rim, and NO
     dark centre. Anything finer than this — a sclera ring plus a lens ring
     plus a haze arc — dissolves in the dot lattice at the sizes these heads
     render at (the inherited trap: small marks disappear under the halftone).
     The absence of the pupil every other eye in the film has IS the cataract. */
  if (cloud > 0.5){
    pen.paint(() => { g.ellipse(x, y, r, r * 0.92, 0, 0, TAU); }, L(TONE.COAT), cw(W, 1.15));
    return;
  }
  pen.paint(() => { g.ellipse(x, y, r, r * 0.88, 0, 0, TAU); }, L(TONE.PAPERISH), cw(W, 0.55));
  {
    pen.fillPath(() => { g.ellipse(x, y, r * 0.56, r * 0.56, 0, 0, TAU); }, inkLevel(iris));
  }
}

/* nose / bill tip — a hard level-7 accent, the same mark on every muzzle */
export function nose(pen, x, y, r, W = 660){
  pen.fillPath(() => { pen.ctx.ellipse(x, y, r, r * 0.86, 0, 0, TAU); }, inkLevel(TONE.INKY));
}

/* ============================================================
   ground — a shadow and a BROKEN ground line. The inherited trap sheet is
   explicit: a full-width horizontal bar stripes the frame. Nothing in my
   six draws a span; brokenLine() takes a list of gaps and never closes them.
   ============================================================ */
export function groundShadow(g, cx, cy, rx, ry, a = 0.10){
  g.save(); g.fillStyle = `rgba(0,0,0,${a})`;
  g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU); g.fill(); g.restore();
}
export const DEFAULT_SPANS = [[.03,.21],[.26,.44],[.50,.71],[.76,.97]];
export function brokenLine(g, W, y, { spans = DEFAULT_SPANS, alpha = 0.20, lw = 2.6, jitter = 0 } = {}){
  g.save(); g.strokeStyle = `rgba(0,0,0,${alpha})`; g.lineWidth = lw; g.lineCap = "round";
  spans.forEach((s, i) => {
    const dy = jitter * ((i % 2) ? 1 : -1);
    g.beginPath(); g.moveTo(W * s[0], y + dy); g.lineTo(W * s[1], y + dy); g.stroke();
  });
  g.restore();
}

/* deterministic quasi-random walks — scatter without a PRNG, identical in
   every engine and every process. i -> 0..1

   THE BUG THIS EXISTS TO FIX, recorded because it cost a whole creature:
   a single golden-ratio walk is one-dimensional. Using gr(i*k) for x and
   gr(i*k+1) for y makes the two coordinates step by the SAME amount every
   iteration, so every "scattered" point lands on a straight line. The trout's
   creek bed came out as two diagonal stripes of gravel across an empty frame
   and it took a render to notice. For a 2-D scatter use gr for one axis and
   gr2 for the other: 0.6180 (golden) and 0.7549 (plastic) are independent, so
   the pair is the R2 low-discrepancy sequence and actually covers the plane.
   gr3 is a third stride for a size or an angle. */
export const gr  = i => ((i + 1) * 0.6180339887498949) % 1;
export const gr2 = i => ((i + 1) * 0.7548776662466927) % 1;
export const gr3 = i => ((i + 1) * 0.5698402909980532) % 1;

/* a light plane with a hard edge — asphalt, lawn, water, concrete apron.
   Always drawn as a shape with a BROKEN top edge, never as a filled band
   with a ruled horizon. */
export function planeBand(pen, W, yTop, yBot, level, { wobble = 0, seedI = 0, lw = 0 } = {}){
  const g = pen.ctx;
  g.beginPath(); g.moveTo(0, yTop);
  const n = 9;
  for (let i = 1; i <= n; i++){
    const x = W * i / n;
    const y = yTop + (gr(i + seedI) - 0.5) * wobble;
    g.quadraticCurveTo(W * (i - 0.5) / n, yTop + (gr(i + seedI + 7) - 0.5) * wobble, x, y);
  }
  g.lineTo(W, yBot); g.lineTo(0, yBot); g.closePath();
  g.fillStyle = inkLevel(level); g.fill();
  if (lw){ g.strokeStyle = INK; g.lineWidth = lw; g.stroke(); }
}

export function pen(ctx){ return makePen(ctx, { outline: true }); }
export { lerp, clamp, INK, inkLevel, toneSolid };
