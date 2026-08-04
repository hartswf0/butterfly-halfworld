/* ============================================================
   assets/creature/_lepidoptera.mjs — THE BUTTERFLY RIG.
   Private support for the two CREATURE assets of this world, swallowtail and
   oldbutterfly. Nothing else imports it. Underscore-prefixed following the
   repo's own precedent, assets/creature/_kit.mjs.

   WHY IT EXISTS. Two reasons, and the second one is the whole world.

   1. _kit.mjs is a HORIZONTAL-SPINE beast rig: a swept body contour, limb
      chains ending in paws or hooves, a head frame. It is an excellent dog and
      it is not an insect. What a butterfly is, structurally, is a small body
      and FOUR PLANES ON HINGES, and the planes are the entire silhouette.
      Nothing in _kit or figure-hero has a hinged plane.

   2. THE TWO BUTTERFLIES MUST BE THE SAME KIND OF THING AT DIFFERENT AGES.
      A swallowtail from the laboratory colony and the one out of the 1945
      canister are the same animal eighty years apart; if they were built by
      two hands they would be two species and BF-27's exchange —
        MARA: "This one has the same marking."  IONA: "Marking is not memory."
      — stops meaning anything. So the body, the wing outlines, the vein
      system, the antennae and the projection are authored ONCE, here, and the
      two modules are specs on them: frayed edges, a missing antenna club, a
      coat of scales, a crescent cut out of one hindwing.

   ---------------------------------------------------------------------------
   THE PROJECTION, and why it is the most important decision in this file.

     BF-24  "Across the left hindwing the scales form a pale broken circle. No
             line crosses it. The butterfly raises its wings. On the right
             hindwing is the line. THE MARK EXISTS ONLY WHEN THE WINGS ARE
             CLOSED TOGETHER. It opens: the symbol divides. It closes: the
             symbol becomes whole."

   That is one continuous shot, and it is authored motion=CYCLE. So the opening
   and closing cannot be a cut between a dorsal illustration and a lateral one:
   it has to be ONE VIEW with ONE PARAMETER, and the mark has to become whole
   inside it without anybody drawing a whole mark.

   The camera is therefore ABOVE AND BEHIND AND A LITTLE TO ONE SIDE. Each wing
   is authored in its own two coordinates —
        span   0..1 outward from the body along the hinge
        chord  -1..1, negative toward the head, positive toward the tail
   — and rotated about the body's fore-aft axis by theta, where theta = 0 is
   flat open and theta = 90 degrees is closed. In world axes that is

        X (lateral) = side * span * cos(theta)
        Y (fore-aft) = chord
        Z (up)      = span * sin(theta)

   and the camera projects (PSI is the azimuth off dead-astern, PHI the tilt
   off vertical):

        screen_x = X*cos(PSI) - Y*sin(PSI)
        screen_y = -Z*sin(PHI) + (X*sin(PSI) + Y*cos(PSI))*cos(PHI)

   Read what that does at the two ends:
     theta = 0    the wings lie flat either side of the body, foreshortened and
                  banked, and the left hindwing's marking and the right one's
                  are a body's width apart. DIVIDED.
     theta = 90   THE X TERM VANISHES FOR BOTH SIDES: span maps to (0, -sin PHI)
                  whichever wing it belongs to. The two wings occupy the same
                  place on the paper — a tall closed-wing profile, its width
                  supplied by the chord through sin(PSI) — and the ring on one
                  and the crooked stroke on the other land on top of each other.
                  WHOLE.

   WHY PSI EXISTS, and it is the correction that mattered most in this file.
   The first version had the camera dead astern, PSI = 0. Then at theta = 90
   the CHORD projects vertically too, the wing degenerates to a LINE, and the
   closed butterfly is a smear a dozen pixels wide with nothing legible on it —
   which is a catastrophe here, because the closed state is the one state the
   whole world turns on. It took a motion strip to see it: the frame reads as a
   butterfly at every other u and the loop dies at the middle. PSI = 26 degrees
   gives the closed wings a little over half the width of the open span, which
   is about the ratio a real papilionid has between its chord and its wingspan,
   and costs a bank of some 40 degrees when the wings are open — so the whole
   animal is counter-rotated by ROLL and the body hangs vertical, which is
   camera roll and nothing more. 14 degrees was tried first and the closed
   profile came out at a quarter of the open span: a smear, not a butterfly.

   The marks are authored in the same (span, chord) coordinates as the wing, so
   they are carried by the same transform. Nobody draws the union. The union is
   what the projection does at theta = 90, and it is exact.

   ONE CONSEQUENCE, ACCEPTED: at theta = 90 the two wings coincide exactly and
   the far one is invisible. A real resting butterfly shows a sliver of the far
   wing, so LEAN offsets the far side by a hair — small enough that the two
   halves of the mark still read as one shape, large enough that the animal has
   two wings. It is a fudge and it is written down.

   The dot law is inherited from _kit.mjs: contour weight through cw(), tone
   through the eight-level ladder, and nothing sets a raw lineWidth.
   ============================================================ */
import { INK, inkLevel, gray, clamp, lerp } from "../../engine/halfworld-engine.mjs";
import { pen as makeKitPen, L, TONE, cw, sw, gr, gr2, gr3, TAU, clamp01 } from "./_kit.mjs";

export { L, TONE, cw, sw, gr, gr2, gr3, TAU, clamp01 };

/* camera elevation. 55 degrees: high enough that an open wing reads as a wing
   rather than as a line, low enough that a closed wing keeps most of its
   width. Every number in this file assumes it. */
export const PHI = 55 * Math.PI / 180;      // tilt off vertical: 0 is plan view
export const PSI = 26 * Math.PI / 180;      // azimuth off dead astern. See header.
const SIN_PHI = Math.sin(PHI), COS_PHI = Math.cos(PHI);
const SIN_PSI = Math.sin(PSI), COS_PSI = Math.cos(PSI);
/* the counter-roll that puts the body back upright */
export const ROLL = -Math.atan2(SIN_PSI, COS_PSI * COS_PHI);
/* the fudge, declared above */
const LEAN = 0.045;

/** The one projection. World (X lateral, Y fore-aft, Z up) -> canvas. */
/* ---------------------------------------------------------------------------
   A SECOND CAMERA, and why the world needs one.

   The default camera (PHI 55, PSI 26) is the flight camera: it exists so the
   closed wings do not degenerate to a line, and it serves BF-01, the
   swallowtail, and every scene where a butterfly is an animal in a room.

   It cannot serve BF-24. There, the mark IS the subject, and at closure the
   ring's two wing-space axes land on screen vectors of 0.195V and 0.0714V —
   a 2.7:1 ellipse. The scene's own measurement showed the united mark reading
   more clearly DIVIDED than WHOLE, which inverts the text.

   It is not a tuning problem. With PSI 26 the chord axis projects short at
   every tilt: solving for equal singular values has no real root. The mark can
   only be circular when the wing plane faces the lens — which is to say, when
   you look at a closed-wing butterfly FROM THE SIDE, which is how anyone would
   actually photograph an underside marking.

   So: one geometry, two cameras — the same answer the maze reached, where one
   camera deletes height and cannot see the striking, and the other deletes
   length so the choice has no extent. A camera is a question, not a rig.
--------------------------------------------------------------------------- */
export function makeCamera(phiDeg, psiDeg) {
  const phi = phiDeg * Math.PI / 180, psi = psiDeg * Math.PI / 180;
  const sP = Math.sin(phi), cP = Math.cos(phi), sQ = Math.sin(psi), cQ = Math.cos(psi);
  const project = (cx, cy, V, X, Y, Z) => ({
    x: cx + V * (X * cQ - Y * sQ),
    y: cy + V * (-Z * sP + (X * sQ + Y * cQ) * cP),
  });
  return {
    phiDeg, psiDeg, project,
    ROLL: -Math.atan2(sQ, cQ * cP),
    bodyXform: (cx, cy, V) => (lateral, chord) => project(cx, cy, V, lateral, chord, 0),
    wingXform: (cx, cy, V, side, closure) => {
      const th = clamp01(closure) * Math.PI / 2;
      const c = Math.cos(th), sn = Math.sin(th);
      const lean = side * LEAN * clamp01(closure);
      return (span, chord) => project(cx, cy, V, side * span * c + lean * chord, chord, span * sn);
    },
  };
}

/** The flight camera — the module default, unchanged. */
export const CAMERA_FLIGHT = { phiDeg: 55, psiDeg: 26 };
/** The mark camera — side-on, so a closed wing faces the lens and the united
 *  broken circle is a circle rather than a 2.7:1 ellipse. BF-24 only. */
export const CAMERA_MARK = { phiDeg: 84, psiDeg: 86 };

/* THE PLUMB, and it is the whole of the change this file needed.

   makeCamera() was added but nothing could reach it: makeLepidopteran() called
   the module-level wingXform/bodyXform/ROLL directly, so a scene holding a
   second camera had no way to hand it to the animal, and the only alternative
   was for the scene to redraw the butterfly — which would give this world two
   species and break BF-27. So the rig now takes an OPTIONAL `cam` in state.

   CAM_DEFAULT is makeCamera(55, 26), which computes the same expressions from
   the same constants as PHI/PSI/ROLL above. Every scene that does not pass
   `cam` renders exactly as before — checked, not assumed: BF-01's loop numbers
   are identical to four decimals across the change (wrap 1.4638%, mean step
   1.4829%, ratio 0.987). */
const CAM_DEFAULT = makeCamera(CAMERA_FLIGHT.phiDeg, CAMERA_FLIGHT.psiDeg);

export function project(cx, cy, V, X, Y, Z) {
  return {
    x: cx + V * (X * COS_PSI - Y * SIN_PSI),
    y: cy + V * (-Z * SIN_PHI + (X * SIN_PSI + Y * COS_PSI) * COS_PHI),
  };
}
/** The body axis, at span 0 — used by the body and the head parts so they sit
 *  in the same space the wings do. */
export function bodyXform(cx, cy, V) {
  return (lateral, chord) => project(cx, cy, V, lateral, chord, 0);
}

/** The wing transform. `closure` 0 = flat open, 1 = closed together. Returns a
 *  function mapping (span, chord) in wing space to canvas pixels. */
export function wingXform(cx, cy, V, side, closure) {
  const th = clamp01(closure) * Math.PI / 2;
  const c = Math.cos(th), s = Math.sin(th);
  const lean = side * LEAN * clamp01(closure);   // the far wing peeks. See header.
  return (span, chord) => project(cx, cy, V, side * span * c + lean * chord, chord, span * s);
}

/* ---------------------------------------------------------------------------
   THE WING OUTLINES, authored once in (span, chord).

   A papilionid forewing is a triangle with a long costal margin and a produced
   apex; the hindwing is round with an anal margin and, on this genus, a tail.
   These are the two shapes both butterflies in this world are cut from — the
   old one is the same outline with pieces missing.
--------------------------------------------------------------------------- */
export const FOREWING = [
  [0.04, -0.14], [0.36, -0.62], [0.72, -0.82], [0.95, -0.66],
  [1.00, -0.30], [0.84, 0.02], [0.54, 0.22], [0.22, 0.26], [0.05, 0.08],
];
export const HINDWING = [
  [0.05, 0.14], [0.34, 0.06], [0.60, 0.26], [0.68, 0.54],
  [0.56, 0.76], [0.46, 1.18], [0.38, 0.80], [0.20, 0.86], [0.06, 0.54],
];
/* the tail is points 4..6 of HINDWING; a module without tails skips them */
const TAIL_FROM = 4, TAIL_TO = 7;

/* the veins: from the wing root out to a margin point. "Black-veined wings"
   (the swallowtail's whole description) so these are INK, not tone, and they
   are the darkest thing on the animal after the body. */
const FORE_VEINS = [[0.95, -0.62], [1.00, -0.30], [0.84, 0.00], [0.60, 0.20], [0.34, 0.24]];
const HIND_VEINS = [[0.66, 0.30], [0.68, 0.54], [0.54, 0.74], [0.30, 0.84]];

function poly(ctx, T, pts, { skip = null } = {}) {
  let first = true;
  for (let i = 0; i < pts.length; i++) {
    if (skip && i >= skip[0] && i < skip[1]) continue;
    const p = T(pts[i][0], pts[i][1]);
    if (first) { ctx.moveTo(p.x, p.y); first = false; } else ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
}

/* ---------------------------------------------------------------------------
   FRAY. "Frayed wings" is the old butterfly's first adjective. A frayed margin
   is not a rough line — it is a margin with SCALES MISSING off the edge, so it
   is drawn as bites taken out of the outline, deterministically, from the
   golden/plastic pair (a single golden walk puts every bite on one diagonal —
   the trout bug, logged in _kit.mjs).
--------------------------------------------------------------------------- */
function frayEdge(ctx, T, pts, amount, seed, W) {
  if (amount <= 0) return;
  ctx.save();
  ctx.fillStyle = "#ffffff";
  const n = Math.round(12 * amount);
  /* PASS 2. At the first size these bites ate the wing's contour and the
     animal stopped having an outline. A frayed margin is scales gone off the
     EDGE — a few millimetres — not a wing with holes in it, so the bite is
     capped near the contour weight and the count is halved. */
  const cap = cw(W, 2.6);
  for (let i = 0; i < n; i++) {
    const t = gr(i * 3 + seed) * (pts.length - 1);
    const i0 = Math.floor(t), f = t - i0;
    const a = pts[i0], b = pts[Math.min(pts.length - 1, i0 + 1)];
    const span = lerp(a[0], b[0], f), chord = lerp(a[1], b[1], f);
    const p = T(span, chord);
    const r = (0.018 + 0.026 * gr2(i * 5 + seed)) * amount;
    const q = T(span * (1 + r), chord * (1 + r * 0.6));
    const rx = Math.min(cap, Math.abs(q.x - p.x) + 2.4);
    const ry = Math.min(cap, Math.abs(q.y - p.y) + 2.4);
    ctx.beginPath(); ctx.ellipse(q.x, q.y, rx, ry, 0, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

/* ---------------------------------------------------------------------------
   makeLepidopteran(spec) -> { draw(ctx, W, H, state) }

   spec  tails        papilionid tails on the hindwing
         wing         ink level of the wing membrane (LIGHT: 1 or 2)
         veins        ink level of the venation
         body         ink level of the body
         fray         0..1, scales gone off the margins
         antennaScar  0 | 1 | -1 — which antenna ends in a blunt stub
         coat         0..1, a coat of fine scales over everything
         falseEyes    ocelli on the underside of the hindwing
         crescent     0..1, a crescent punched out of one hindwing's edge
         crescentSide -1 | 1
         onWing(ctx, T, side, state)   a hook, called per hindwing in wing
                                       space, for whatever this individual
                                       carries. The MARK goes through here.

   state closure   0 open .. 1 closed
         cx, cy    position 0..1 of the thorax in the frame
         V         wing span in px (defaults from frame size)
         tilt      radians, the whole animal
         wear      0..1 from an open cycle; droops the wings and the antennae
         cam       OPTIONAL. A makeCamera() object. Omit for the flight camera,
                   which is what every scene but BF-24 wants.
--------------------------------------------------------------------------- */
export function makeLepidopteran(spec = {}) {
  const S = {
    tails: true, wing: 2, veins: 7, body: 6, fray: 0, antennaScar: 0,
    coat: 0, falseEyes: false, crescent: 0, crescentSide: 1, legs: 3,
    onWing: null, ...spec,
  };

  function draw(ctx, W, H, st = {}) {
    const pen = makeKitPen(ctx);
    const g = ctx;
    const V = st.V || Math.min(W, H) * 0.30;
    const cx = (st.cx == null ? 0.5 : st.cx) * W;
    const cy = (st.cy == null ? 0.48 : st.cy) * H;
    const closure = clamp01(st.closure == null ? 0 : st.closure);
    const wear = clamp01(st.wear || 0);
    const K = 1;
    const cam = st.cam || CAM_DEFAULT;

    g.save();
    g.translate(cx, cy); g.rotate(cam.ROLL + (st.tilt || 0)); g.translate(-cx, -cy);

    /* wings droop with wear: an insect that has been striking a ceiling for
       forty-three seconds does not hold its wings where a fresh one does. */
    const droop = wear * 0.10;

    const drawSide = (side, back) => {
      const T = cam.wingXform(cx, cy, V, side, clamp01(closure + droop));
      const tone = L(S.wing);
      const skip = S.tails ? null : [TAIL_FROM, TAIL_TO];

      // HINDWING first — it sits under the forewing on a real animal
      pen.paint(() => poly(g, T, HINDWING, { skip }), tone, cw(W, back ? 0.8 : 1.05 * K));
      // the crescent: "A small crescent has been removed from its edge, as
      // neatly as if cut with a punch." Punched, so the cut is a circle and
      // its edge is as hard as the wing's own.
      if (S.crescent > 0 && side === S.crescentSide) {
        const c = T(0.72, 0.46);
        const r = V * 0.10 * S.crescent;
        g.save();
        g.fillStyle = "#ffffff";
        g.beginPath(); g.ellipse(c.x, c.y, r, r * 0.92, 0, 0, TAU); g.fill();
        g.strokeStyle = INK; g.lineWidth = cw(W, 1.0);
        g.beginPath(); g.ellipse(c.x, c.y, r, r * 0.92, 0, 0, TAU); g.stroke();
        g.restore();
      }
      // venation
      g.save();
      g.strokeStyle = inkLevel(S.veins); g.lineWidth = sw(W, 1.25 * K); g.lineCap = "round";
      const root = T(0.03, 0.16);
      for (const v of HIND_VEINS) {
        const p = T(v[0], v[1]);
        g.beginPath(); g.moveTo(root.x, root.y); g.lineTo(p.x, p.y); g.stroke();
      }
      g.restore();
      // the undersides. "Its wings close, opening the false eyes on their
      // undersides. THE EYES LOOK BACKWARD." (BF-05) They are on the UNDERSIDE,
      // so they appear only as the wings come together, and they sit toward
      // the tail, which is the direction they look.
      if (S.falseEyes && closure > 0.45) {
        const k = (closure - 0.45) / 0.55;
        for (const [sp, ch] of [[0.30, 0.68], [0.48, 0.56]]) {
          const p = T(sp, ch), r = V * 0.052 * k;
          pen.paint(() => g.ellipse(p.x, p.y, r, r * 0.94, 0, 0, TAU), L(TONE.PAPERISH), cw(W, 0.8));
          pen.fillPath(() => g.ellipse(p.x, p.y, r * 0.52, r * 0.50, 0, 0, TAU), inkLevel(7));
        }
      }
      if (S.onWing) S.onWing(g, T, side, { ...st, closure, V, W, H });
      frayEdge(g, T, HINDWING, S.fray, side > 0 ? 11 : 29, W);

      // FOREWING over it
      pen.paint(() => poly(g, T, FOREWING), tone, cw(W, back ? 0.8 : 1.05 * K));
      g.save();
      g.strokeStyle = inkLevel(S.veins); g.lineWidth = sw(W, 1.35 * K); g.lineCap = "round";
      const froot = T(0.03, -0.06);
      for (const v of FORE_VEINS) {
        const p = T(v[0], v[1]);
        g.beginPath(); g.moveTo(froot.x, froot.y); g.lineTo(p.x, p.y); g.stroke();
      }
      // the cross-vein arc that makes a forewing read as a forewing
      const a1 = T(0.30, -0.50), a2 = T(0.46, -0.10), a3 = T(0.30, 0.18);
      g.lineWidth = sw(W, 1.0);
      g.beginPath(); g.moveTo(a1.x, a1.y); g.quadraticCurveTo(a2.x, a2.y, a3.x, a3.y); g.stroke();
      g.restore();
      frayEdge(g, T, FOREWING, S.fray, side > 0 ? 5 : 17, W);
    };

    /* far wing, body, near wing — the same depth order the human rig uses.
       PASS 2: the HEAD PARTS come last. Drawn with the body they were painted
       over by the near forewing and the animal had no antennae at all, which
       is the one feature that says butterfly rather than moth. */
    drawSide(-1, true);
    drawBody(pen, g, W, H, cx, cy, V, S, st, wear, cam);
    drawSide(1, false);
    drawHeadParts(pen, g, W, H, cx, cy, V, S, wear, cam);

    /* the coat of scales. "coated in fine yellow scales" — yellow is LIGHT
       under a luminance quantiser, so the coat is drawn at paper and it makes
       the animal PALER, never darker or warmer. It goes on last, over
       everything, because that is where it is. */
    if (S.coat > 0) {
      g.save();
      g.fillStyle = "#fdfdfa";
      /* PASS 2: 150 specks at V*0.018 turned the animal into static and
         swallowed the wing marking. FINE scales: a third as many, half the
         size, and none of them on the body column, where they read as damage
         rather than as dust. */
      const n = Math.round(60 * S.coat);
      for (let i = 0; i < n; i++) {
        const a = gr(i * 3) * TAU, rr = (0.30 + 0.70 * Math.sqrt(gr2(i * 3))) * V * 0.92;
        const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * (0.62 + 0.38 * (1 - closure));
        if (Math.abs(x - cx) < V * 0.10) continue;
        const s = V * (0.005 + 0.006 * gr3(i));
        g.beginPath(); g.ellipse(x, y, s * 1.7, s, a, 0, TAU); g.fill();
      }
      g.restore();
    }
    g.restore();

    return {
      anchors: {
        thorax: { x: cx / W, y: cy / H },
        head: { x: cx / W, y: (cy - V * 0.52 * COS_PHI) / H },
        wingL: { x: (cx - V * 0.6 * Math.cos(closure * Math.PI / 2)) / W, y: cy / H },
        wingR: { x: (cx + V * 0.6 * Math.cos(closure * Math.PI / 2)) / W, y: cy / H },
      },
    };
  }

  return { draw, spec: S };
}

/* ---------------------------------------------------------------------------
   THE BODY. Head, thorax, abdomen along the chord axis at span 0, so it lives
   in the same projection as the wings and foreshortens with them. Built as ONE
   swept contour, the law _kit.mjs states for every animal in the family: "A
   body is never a stack of ellipses."
--------------------------------------------------------------------------- */
function drawBody(pen, g, W, H, cx, cy, V, S, st, wear, cam = CAM_DEFAULT) {
  const T = cam.bodyXform(cx, cy, V);
  const tone = L(S.body);

  // abdomen -> thorax -> head, as a rail-swept contour
  const seg = [
    [0.80, 0.030], [0.52, 0.075], [0.16, 0.092], [-0.16, 0.088], [-0.44, 0.062], [-0.60, 0.040],
  ];
  g.save();
  g.beginPath();
  const top = [], bot = [];
  for (const [chord, w] of seg) { top.push(T(w, chord)); bot.push(T(-w, chord)); }
  g.moveTo(top[0].x, top[0].y);
  for (let i = 1; i < top.length; i++) g.lineTo(top[i].x, top[i].y);
  const headTip = T(0, -0.70);
  g.quadraticCurveTo(headTip.x + V * 0.04, headTip.y, headTip.x, headTip.y);
  for (let i = bot.length - 1; i >= 0; i--) g.lineTo(bot[i].x, bot[i].y);
  const tailTip = T(0, 0.92);
  g.quadraticCurveTo(tailTip.x, tailTip.y, top[0].x, top[0].y);
  g.closePath();
  g.fillStyle = inkLevel(S.body); g.fill();
  g.strokeStyle = INK; g.lineWidth = cw(W, 1.0); g.lineJoin = "round"; g.stroke();
  // abdominal segments — geometry, four of them
  g.strokeStyle = inkLevel(Math.max(0, S.body - 3)); g.lineWidth = sw(W, 0.9);
  for (let i = 1; i <= 4; i++) {
    const c = 0.16 + i * 0.14, a = T(-0.062, c), b = T(0.062, c);
    g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
  }
  g.restore();

}

/* ---------------------------------------------------------------------------
   THE HEAD PARTS — eyes, antennae, legs, proboscis.

   PASS 2 MOVED THESE. They used to be drawn with the body, which put them
   UNDER the near forewing, and in the first render the animal had no antennae
   at all: the one feature that distinguishes a butterfly from a moth was
   painted over in every frame. They are drawn last now, over everything, which
   is also where they are on the animal.
--------------------------------------------------------------------------- */
function drawHeadParts(pen, g, W, H, cx, cy, V, S, wear, cam = CAM_DEFAULT) {
  const T = cam.bodyXform(cx, cy, V);

  // eyes: two dark hemispheres, the widest part of the head
  for (const s of [-1, 1]) {
    const p = T(s * 0.075, -0.52);
    pen.fillPath(() => g.ellipse(p.x, p.y, V * 0.042, V * 0.036, 0, 0, TAU), inkLevel(7));
  }

  /* ANTENNAE. Clubbed — this is a butterfly and not a moth, and the club is
     the whole of that distinction. `antennaScar` removes one club and leaves a
     blunt stub: "one antenna ending in a blunt white scar". White, so the stub
     is PAPER with an ink rim, and it is the brightest point on the animal. */
  g.save();
  g.lineCap = "round";
  for (const s of [-1, 1]) {
    const base = T(s * 0.05, -0.58);
    const bend = T(s * 0.52, -1.14 + wear * 0.12);
    const tip = T(s * 0.86, -1.38 + wear * 0.26);
    /* PASS 3. The antennae were the right length and the right weight and they
       still did not read, because at any closure above about 0.2 they lie over
       the raised forewing and print at the same value as its venation. A pen
       draws one line over another by leaving a gap; so does this. */
    g.strokeStyle = "#ffffff"; g.lineWidth = sw(W, 1.6) + 5;
    g.beginPath(); g.moveTo(base.x, base.y); g.quadraticCurveTo(bend.x, bend.y, tip.x, tip.y); g.stroke();
    g.strokeStyle = INK; g.lineWidth = sw(W, 1.6);
    g.beginPath(); g.moveTo(base.x, base.y); g.quadraticCurveTo(bend.x, bend.y, tip.x, tip.y); g.stroke();
    if (S.antennaScar === s) {
      // the blunt white scar where the club was
      g.save();
      g.fillStyle = "#fdfdfa"; g.strokeStyle = INK; g.lineWidth = sw(W, 1.3);
      g.beginPath(); g.ellipse(tip.x, tip.y, V * 0.038, V * 0.034, 0, 0, TAU);
      g.fill(); g.stroke();
      g.restore();
    } else {
      const club = T(s * 0.96, -1.45 + wear * 0.28);
      g.save();
      g.fillStyle = inkLevel(7);
      g.beginPath(); g.ellipse(club.x, club.y, V * 0.034, V * 0.024, s * 0.5, 0, TAU); g.fill();
      g.restore();
    }
  }
  // legs: thin ink, three per side, and they are legs, not sticks — two joints
  g.lineWidth = sw(W, 0.9);
  for (const s of [-1, 1]) {
    for (let i = 0; i < S.legs; i++) {
      const c = -0.30 + i * 0.16;
      const a = T(s * 0.055, c), b = T(s * 0.16, c + 0.16), d = T(s * 0.13, c + 0.30);
      g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.lineTo(d.x, d.y); g.stroke();
    }
  }
  // proboscis, coiled. One small spiral under the head; a butterfly that is
  // not feeding keeps it rolled.
  const pb = T(0, -0.46);
  g.lineWidth = sw(W, 0.9);
  g.beginPath();
  g.arc(pb.x, pb.y + V * 0.030, V * 0.030, -0.6, 4.4);
  g.stroke();
  g.restore();
}

export const LEPIDOPTERA_VERSION = "lepidoptera/1.0.0";
