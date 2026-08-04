/* ============================================================================
   set.canister — THE ASTER CANISTER, and what is inside it.
   PROP for I REMEMBER BEING A BUTTERFLY (B01). BF-18, BF-19, BF-21, BF-23,
   BF-24 — the object the middle third of the episode is an argument about.

   EVIDENCE.
     BF-18  "A dented circular canister no wider than her palm. Rust spreads
             from the hinge in branching lines. Around the edge, black
             electrical tape. Beneath the rust, a fragment of white label:
             ASTER. Yellow scales cling to the tape, caught in the adhesive.
             They are fresh enough to shine."
     BF-23  "Inside: a coil of 8mm film wrapped in waxed paper, and a dry
             chrysalis resting in the hollow centre of the reel. Larger than any
             swallowtail chrysalis Mara has seen. Split along one side. Empty."

   ---------------------------------------------------------------------------
   THE FOUR VALUES, and why they are in this order.

   The text hands this object a complete tonal ladder, which is rare, and the
   whole prop is built on obeying it rather than on inventing shading:

     BLACK   the electrical tape round the edge          level 7
     DARK    the rust branching from the hinge           level 4-5
     TIN     the dented lid                              level 2
     WHITE   the label fragment, and the scales          paper

   That is a dark ring containing a light disc with one dark stain on it and two
   bright things sitting on the dark ring. Nothing needs to be added and nothing
   may be: BUILD-BRIEF §5's trap is that a first draft comes out two or three
   levels too dark, and an object with an authored black band on it is exactly
   where that happens.

   YELLOW SCALES ARE LIGHT. The post pass quantizes by luminance, so a coat of
   fine yellow scales is PALER than what it sits on, never warmer — the same
   ruling assets/creature/oldbutterfly.mjs makes about the same scales. On the
   black tape they are the brightest points in the frame, which is what "fresh
   enough to shine" gets to mean in a world with no specular highlight and no
   colour. They are drawn ON the tape and nowhere else, because the text says
   they are caught in the adhesive.

   ASTER IS DRAWN AS GEOMETRY, NEVER AS TEXT (BUILD-BRIEF §5: small type
   dissolves in the dot lattice). Five stroked letterforms, and `label()`
   refuses to draw them at all below 26px of cap height — under that it draws
   the torn white patch alone, which is what a fragment of a label is at a
   distance anyway. A scene that wants the word legible has to get closer.

   ---------------------------------------------------------------------------
   THE TAPPING IS NOT HERE. It is in assets/set/_tapping.mjs, authored once and
   shared with BF-14's vial, per SCENE-BRIEF §6. This file exports the rim
   ellipse the ring is laid on (`rimOf`) so the two consumers agree about where
   a circumference is without either of them measuring one.
   ========================================================================= */
import { INK, inkLevel, gray, rnd, lerp, clamp01 } from "../../engine/halfworld-engine.mjs";
import { brokenLine, speckle, L, LV } from "./_kit.mjs";

const TAU = Math.PI * 2;

/* The canister lies on its face. Seen from the lobby camera it is a foreshortened
   ellipse; RIM_R is the ratio of its projected minor to major axis. One number,
   exported, so BF-21's tapping ring and BF-18's hands agree about the shape.

   PASS 2, from BF-18's full-resolution frame: at 0.40 with a 0.30R edge the tin
   read as a shallow BOWL — a wide black belt with a dish balanced on it — and
   the lid, which carries the rust and the label and the dents, was a sliver.
   0.62 with a 0.17R edge is a round tin held at an angle, which is what it is. */
export const RIM_R = 0.62;
export const rimOf = (cx, cy, R, squash = RIM_R) => ({ cx, cy, rx: R, ry: R * squash });

/* ===========================================================================
   THE CANISTER, closed. R is the HALF-WIDTH: "no wider than her palm", so a
   caller sizes it against a hand and not against the frame.
   ======================================================================== */
export function canister(g, cx, cy, R, {
  squash = RIM_R, depth = 0.17, tilt = 0, label = true, scales = 9, seed = 17, dents = 3,
} = {}) {
  const ry = R * squash, dz = R * depth;
  g.save();
  g.translate(cx, cy); g.rotate(tilt); g.translate(-cx, -cy);

  /* THE EDGE, wrapped in black electrical tape. Drawn first and drawn as a
     solid body so the lid sits ON it rather than beside it. */
  g.fillStyle = inkLevel(7);
  g.beginPath();
  g.ellipse(cx, cy + dz, R, ry, 0, 0, Math.PI);
  g.lineTo(cx - R, cy);
  g.ellipse(cx, cy, R, ry, 0, Math.PI, 0, true);
  g.closePath();
  g.fill();
  g.strokeStyle = INK; g.lineWidth = 4; g.stroke();

  /* THE LID. Tin, level 2 — a light plane, per the trap. */
  g.fillStyle = LV(2);
  g.beginPath(); g.ellipse(cx, cy, R, ry, 0, 0, TAU); g.fill();
  g.strokeStyle = INK; g.lineWidth = 5;
  g.beginPath(); g.ellipse(cx, cy, R, ry, 0, 0, TAU); g.stroke();

  /* DENTED. A dent in a tin lid is a closed contour with a hard edge on one
     side, not a smudge: the lid is pressed in and the crease catches. */
  const r = rnd(seed | 0);
  g.strokeStyle = LV(4); g.lineWidth = 3;
  for (let i = 0; i < dents; i++) {
    const a = r() * TAU, rr = (0.28 + r() * 0.48) * R;
    const dx = cx + Math.cos(a) * rr, dy = cy + Math.sin(a) * rr * squash;
    const w = R * (0.16 + r() * 0.16);
    g.beginPath();
    g.ellipse(dx, dy, w, w * squash * 1.5, a, -0.4, Math.PI + 0.4);
    g.stroke();
  }

  /* THE HINGE, and the rust spreading from it IN BRANCHING LINES. The branching
     is the sentence's own word and it is drawn as a recursive fork, not as a
     stain: rust travels along a seam. */
  const hx = cx - R * 0.62, hy = cy - ry * 0.52;
  g.fillStyle = LV(6);
  g.beginPath(); g.ellipse(hx, hy, R * 0.16, R * 0.07, -0.5, 0, TAU); g.fill();
  g.strokeStyle = INK; g.lineWidth = 3;
  g.beginPath(); g.ellipse(hx, hy, R * 0.16, R * 0.07, -0.5, 0, TAU); g.stroke();
  rustBranch(g, hx, hy, 0.55, R * 0.62, 3, seed + 4, squash);

  /* THE LABEL FRAGMENT — beneath the rust, so it is drawn after it and torn. */
  /* PASS 2: the label was 0.92R wide and centred, so it covered the dents, the
     hinge and the whole rust fan. It is a FRAGMENT of a label under the rust —
     smaller, and pushed down-right so the hinge quarter stays visible. */
  if (label) labelFragment(g, cx + R * 0.20, cy + ry * 0.34, R * 0.66, R * 0.40, seed + 9);

  /* THE SCALES, on the tape and nowhere else. Fresh enough to shine: paper with
     a fine ink rim, on the darkest band in the frame. */
  if (scales > 0) {
    for (let i = 0; i < scales; i++) {
      const a = lerp(0.12, Math.PI - 0.12, (i + 0.5) / scales) + (r() - 0.5) * 0.18;
      const sx = cx + Math.cos(a) * R * (0.92 + r() * 0.06);
      const sy = cy + Math.sin(a) * ry * 0.92 + dz * (0.25 + r() * 0.55);
      const s = R * (0.030 + r() * 0.022);
      g.fillStyle = "#ffffff";
      g.beginPath(); g.ellipse(sx, sy, s * 1.6, s, a, 0, TAU); g.fill();
      g.strokeStyle = LV(4); g.lineWidth = 1.6;
      g.beginPath(); g.ellipse(sx, sy, s * 1.6, s, a, 0, TAU); g.stroke();
    }
  }
  g.restore();
  return rimOf(cx, cy, R, squash);
}

/* rust, branching. depth-limited fork; deterministic from the seed. */
function rustBranch(g, x, y, a, len, depth, seed, squash) {
  if (depth <= 0 || len < 4) return;
  const r = rnd(seed | 0);
  const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len * squash * 2.2;
  /* PASS 3: at 1.2+depth*1.1 the fan printed as dotted hairlines and 'rust
     spreads from the hinge in branching lines' was not in the frame. */
  g.strokeStyle = LV(depth >= 3 ? 6 : 5); g.lineWidth = 2.6 + depth * 2.0; g.lineCap = "round";
  g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
  rustBranch(g, x2, y2, a + 0.42 + r() * 0.3, len * 0.62, depth - 1, seed * 3 + 1, squash);
  rustBranch(g, x2, y2, a - 0.38 - r() * 0.3, len * 0.55, depth - 1, seed * 5 + 2, squash);
}

/* ===========================================================================
   THE LABEL. A torn white patch; the word only if it will survive the lattice.
   ======================================================================== */
export function labelFragment(g, cx, cy, w, h, seed = 9) {
  const r = rnd(seed | 0);
  g.save();
  g.beginPath();
  const n = 9;
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = cx - w / 2 + t * w;
    const y = cy - h / 2 + (i === 0 ? 0 : (r() - 0.5) * h * 0.22);
    i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
  }
  for (let i = n; i >= 0; i--) {                       // the torn lower edge
    const t = i / n, x = cx - w / 2 + t * w;
    g.lineTo(x, cy + h / 2 - Math.abs(Math.sin(t * 5.3)) * h * 0.34);
  }
  g.closePath();
  g.fillStyle = "#ffffff"; g.fill();
  g.strokeStyle = LV(3); g.lineWidth = 2.2; g.stroke();
  // ASTER, as geometry. Below 26px of cap height it is not drawn at all.
  const cap = h * 0.46;
  if (cap >= 26) word(g, "ASTER", cx - w * 0.40, cy - cap * 0.56, w * 0.80, cap);
  g.restore();
}

/* Stroked letterforms — five glyphs, which is all this world needs.
   Never ctx.fillText: type dissolves in the dot lattice (BUILD-BRIEF §5). */
export function word(g, s, x, y, w, h, color) {
  const gw = w / (s.length + (s.length - 1) * 0.28), gap = gw * 0.28;
  g.save();
  g.strokeStyle = color || INK; g.lineWidth = Math.max(3, h * 0.16);
  g.lineCap = "round"; g.lineJoin = "round";
  let cx = x;
  for (const ch of s) { glyph(g, ch, cx, y, gw, h); cx += gw + gap; }
  g.restore();
  return cx - gap - x;
}
function glyph(g, ch, x, y, w, h) {
  const M = (a, b) => g.moveTo(x + a * w, y + b * h);
  const T = (a, b) => g.lineTo(x + a * w, y + b * h);
  g.beginPath();
  switch (ch) {
    case "A": M(0.04, 1); T(0.50, 0); T(0.96, 1); M(0.22, 0.62); T(0.78, 0.62); break;
    case "S": M(0.92, 0.14); T(0.30, 0.06); T(0.12, 0.36); T(0.86, 0.62); T(0.70, 0.96); T(0.08, 0.88); break;
    case "T": M(0.04, 0.05); T(0.96, 0.05); M(0.50, 0.05); T(0.50, 1); break;
    case "E": M(0.92, 0.05); T(0.10, 0.05); T(0.10, 1); T(0.92, 1); M(0.10, 0.52); T(0.72, 0.52); break;
    case "R": M(0.10, 1); T(0.10, 0.05); T(0.70, 0.05); T(0.88, 0.30); T(0.66, 0.52); T(0.10, 0.52);
      M(0.48, 0.52); T(0.94, 1); break;
    default: M(0.10, 0.05); T(0.90, 0.05); T(0.90, 1); T(0.10, 1); T(0.10, 0.05);
  }
  g.stroke();
}

/* ===========================================================================
   THE OPEN CANISTER: a coil of 8mm film wrapped in waxed paper, with a HOLLOW
   CENTRE. The hollow is the point — it is where the chrysalis is and where the
   animal comes up through.

   The coil is drawn as concentric broken arcs, not as a filled annulus: 8mm
   stock on a reel is a thousand edges and what you actually see is the striping
   of them. Broken, because a full ring at this radius is a bar bent round.
   ======================================================================== */
export function filmReel(g, cx, cy, R, { squash = RIM_R, hollow = 0.34, seed = 23, rings = 7 } = {}) {
  const ry = R * squash;
  g.save();
  // the waxed paper the coil is wrapped in — pale, creased, slightly proud
  g.fillStyle = LV(1);
  g.beginPath(); g.ellipse(cx, cy, R * 1.06, ry * 1.06, 0, 0, TAU); g.fill();
  g.strokeStyle = INK; g.lineWidth = 4;
  g.beginPath(); g.ellipse(cx, cy, R * 1.06, ry * 1.06, 0, 0, TAU); g.stroke();
  g.strokeStyle = LV(3); g.lineWidth = 2.4;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU + 0.3;
    g.beginPath();
    g.moveTo(cx + Math.cos(a) * R * 0.42, cy + Math.sin(a) * ry * 0.42);
    g.lineTo(cx + Math.cos(a + 0.22) * R * 1.02, cy + Math.sin(a + 0.22) * ry * 1.02);
    g.stroke();
  }
  // the coil: concentric broken arcs from the outside in to the hollow
  for (let i = 0; i < rings; i++) {
    const k = i / (rings - 1);
    const rr = lerp(R * 0.96, R * hollow, k);
    const r2 = rnd(seed + i * 5);
    const a0 = r2() * TAU, span = TAU * (0.55 + r2() * 0.35);
    g.strokeStyle = LV(i % 2 ? 4 : 2); g.lineWidth = 3.2;
    g.beginPath(); g.ellipse(cx, cy, rr, rr * squash, 0, a0, a0 + span); g.stroke();
    g.strokeStyle = LV(i % 2 ? 4 : 2);
    g.beginPath(); g.ellipse(cx, cy, rr, rr * squash, 0, a0 + span + 0.35, a0 + TAU - 0.15); g.stroke();
  }
  // THE HOLLOW CENTRE. Ink-dark, because it is a hole and holes are not light.
  g.fillStyle = LV(6);
  g.beginPath(); g.ellipse(cx, cy, R * hollow, R * hollow * squash, 0, 0, TAU); g.fill();
  g.strokeStyle = INK; g.lineWidth = 4;
  g.beginPath(); g.ellipse(cx, cy, R * hollow, R * hollow * squash, 0, 0, TAU); g.stroke();
  g.restore();
  return { hollowR: R * hollow, hollowRy: R * hollow * squash };
}

/* ===========================================================================
   THE CHRYSALIS. Dry. Split along ONE side. EMPTY.

   MOTION-BRIEF's warning about the husks in the facility applies here too:
   "Making the empty chrysalides move like they contain something" is the
   failure. So this takes no time argument at all. It is a still object in an
   animated world, on purpose, and it is the only one.
   ======================================================================== */
export function chrysalis(g, cx, cy, len, { rot = 0, split = 1 } = {}) {
  const w = len * 0.34;
  g.save();
  g.translate(cx, cy); g.rotate(rot);
  // the husk: one swept contour, tapering to a cremaster
  g.beginPath();
  g.moveTo(0, -len * 0.5);
  g.bezierCurveTo(w * 0.72, -len * 0.30, w * 0.62, len * 0.22, 0, len * 0.5);
  g.bezierCurveTo(-w * 0.62, len * 0.22, -w * 0.72, -len * 0.30, 0, -len * 0.5);
  g.closePath();
  g.fillStyle = LV(1); g.fill();
  g.strokeStyle = INK; g.lineWidth = 4; g.stroke();
  // the segmentation ridges of a dry pupa — geometry, four of them
  g.strokeStyle = LV(3); g.lineWidth = 2.4;
  for (let i = 1; i <= 4; i++) {
    const t = -0.20 + i * 0.16;
    g.beginPath();
    g.moveTo(-w * 0.46, len * t); g.quadraticCurveTo(0, len * (t + 0.03), w * 0.46, len * t);
    g.stroke();
  }
  // THE SPLIT. One side, opened, and what is behind it is the inside of an
  // empty shell — level 5, not black: a husk lets light through.
  if (split > 0) {
    g.beginPath();
    g.moveTo(0, -len * 0.42);
    g.bezierCurveTo(w * 0.30 * split, -len * 0.22, w * 0.34 * split, len * 0.16, 0, len * 0.40);
    g.bezierCurveTo(w * 0.10, len * 0.16, w * 0.12, -len * 0.22, 0, -len * 0.42);
    g.closePath();
    g.fillStyle = LV(5); g.fill();
    g.strokeStyle = INK; g.lineWidth = 3.4; g.stroke();
  }
  g.restore();
}

/* ---- the asset ---------------------------------------------------------- */
export const asset = {
  id: "prop.canister",
  type: "PROP",
  name: "The ASTER Canister",
  statusWord: "SEALED",
  scene: "BF-18",
  params: {
    width: "no wider than her palm", tape: "black electrical, round the edge",
    rust: "branching, from the hinge", label: "ASTER, a fragment",
    scales: "yellow, in the adhesive, fresh enough to shine",
    contents: "8mm film in waxed paper; an empty split chrysalis in the hollow centre",
  },
  layers: ["tape-edge", "lid", "dents", "hinge", "rust", "label", "scales",
           "waxed-paper", "coil", "hollow", "chrysalis"],
  anchors: {
    face: { x: .50, y: .50 }, hinge: { x: .19, y: .40 }, rim: { x: .50, y: .70 },
    hollow: { x: .50, y: .50 },
  },
  states: {
    initial: "sealed",
    nodes: {
      sealed: { preview: { view: "sealed" } },      // BF-18, BF-19, BF-21
      open: { preview: { view: "open" } },          // BF-23, BF-24
    },
    edges: [["sealed", "open"]],
  },
  channels: ["view", "tilt", "scales"],
  preview: () => ({ view: "sealed", status: "SEALED", progress: 0.35 }),

  draw(ctx, W, H, state) {
    const st = state || {};
    const R = Math.min(W, H) * 0.36;
    if (st.view === "open") {
      filmReel(ctx, W * 0.5, H * 0.52, R);
      chrysalis(ctx, W * 0.5, H * 0.52, R * 0.56, { rot: 0.4 });
    } else {
      canister(ctx, W * 0.5, H * 0.50, R, { tilt: st.tilt || 0, scales: st.scales ?? 9 });
    }
    return { anchors: asset.anchors };
  },
};
export default asset;
export const CANISTER_VERSION = "set-canister/1.0.0";
