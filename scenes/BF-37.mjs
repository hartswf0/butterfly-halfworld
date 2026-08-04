/* ============================================================================
   BF-37 · FROM INSIDE THE MAZE
                  INT. THE MAZE · THE BUTTERFLY'S VIEW      plan: the-maze-inside

     "The projection cuts to a butterfly beating against a transparent ceiling —
      the same trial from that morning."
     "But the viewpoint is inside the maze."
     "Mara sees herself beyond the acrylic: enormous, distorted, holding her
      breath."
     "The butterfly strikes the lid. The image goes white."   — atlas/source.json

   MOTION: CYCLE · 4 beats · 4.0s · 48 frames @12fps · loopClosed: FALSE.
   The same motion, the same beats, the same frame count and the same drift as
   BF-01, because it is the same trial and the same morning.

   ===========================================================================
   THIS IS BF-01 REPLAYED FROM THE OTHER SIDE OF THE ACRYLIC
   ===========================================================================
   Not re-animated: REPLAYED. `at(u)` here calls scenes/BF-01.mjs' own at(u) and
   uses its result. The animal's height, its horizontal drift, its wing closure,
   its roll, its contact and its accumulated wear are BF-01's numbers, unchanged,
   and this file's only job is to put them through the other camera. If BF-01
   were re-tuned tomorrow this unit would change with it, which is the property
   the world's central claim depends on — one event, two records.

   THE MAPPING, and it is the only arithmetic in this file:
     BF-01 lays the animal out in pixels: APEX 256.6 at the acrylic, LOW 448
     cruising. the-maze authors it in `h`, height above the maze floor: the lid
     is h .620 and the drop bottoms out around h .330. So
        h = lerp(.620, .330, (by - APEX) / (LOW - APEX))
     and the horizontal comes off BF-01's CX the same way. Then
        theMazeInside(a, h)  ->  x = 1 - a,  z = h.

   ===========================================================================
   THE CAMERA DELETES LENGTH, AND THAT DECIDES THE WHOLE COMPOSITION
   ===========================================================================
   the-maze's header: "BF-37's camera cannot see length, so the maze has no
   length. The far, middle and near thirds of one corridor project to ONE POINT,
   0.00px apart ... What the camera has instead is the floor-to-roof axis:
   decision_point to lid_strike_point is 182.7px, and it is the only distance
   the animal has been trying to cross for 43 seconds. A choice worth nothing
   and a roof worth 183 pixels. That ratio is the unit."

   So the frame reads, top to bottom, as HEIGHT:

       y 150   the maze floor and the two corridors, at scale 0.697.
               The corridors have no length; they are two patches and a
               partition. The choice has no extent.
       y 300   the swallowtail, between h .33 and h .62
       y 440   THE LID, seen EDGE ON. A plane at one height, in a camera whose
               vertical axis is height, is a LINE. That is why the acrylic in
               this unit is a rule across the frame and not a surface.
       y 560+  MARA, at h .86 to .96, at scale 1.112 to 1.166 against the
               corridor floor's 0.697 — 1.67x, measured, from the engine, and
               nobody asked for it. "Distortion is the scene's job; the plan
               supplies the ground column."

   x IS MIRRORED. The camera has turned around: `a -> 1 - a`. The corridor that
   carries lavender is on the LEFT from outside and on the RIGHT from in here,
   and sleeve_port_left appears on the right. Any station read through this plan
   gets that for free and cannot get it wrong.

   ===========================================================================
   ONE DECLARED OVERPAINT, AND WHY THE RIG COULD NOT DO IT
   ===========================================================================
   character.mara authors `mv_held` for exactly this unit and its comment is
   right about everything except what can draw it: "Chest locked at the top of an
   inhale, shoulders up, head forward over the lid. The distortion is the
   acrylic's and belongs to the scene."

   figure-hero is a FRONT-ELEVATION rig. Placed at mara_at_lid it draws a woman
   standing beyond a glass wall — which is a true picture of a different shot.
   What this camera is looking at is a face DIRECTLY OVERHEAD, foreshortened, its
   shoulders receding away from it and therefore SMALLER AND HIGHER in a camera
   whose vertical axis is depth. No rig in this world can produce that and none
   should be bent into it.

   So Mara is drawn here, in scene space, and she takes her values from her own
   module rather than from a palette chosen here: FACE_OF_MARA (the expression
   the cast agent authored — no smile, no frown, lids a little low), SKIN_OF_MARA,
   and `proportion.shoulders` = 1.12, the one non-default proportion in the cast.
   BF-01 sets the precedent: it hand-draws its swallowtail rather than placing
   the creature asset, for the same reason — a camera the asset was not built for.

   ===========================================================================
   "THE IMAGE GOES WHITE" — AND IT IS NOT A BREAK
   ===========================================================================
   The whiteout is tied to CONTACT. It floods at the instant the animal reaches
   the acrylic and comes back over the following eight frames, so it happens once
   per revolution, inside beat 1, and the loop still closes. A whiteout at the
   WRAP would be a discontinuity, and a CYCLE may not have one.

   And it comes back as a DISSOLVE, not a fade: dotWash() runs the same Bayer-8
   ordered map, so the maze returns to the frame dot by dot. There is no alpha in
   this world in the last twelve units either.

   The coupling to BF-01's phase marks is CHECKED AT IMPORT: assertContact()
   below calls BF-01's own at() and throws if the impact beat is not where this
   file thinks it is. If BF-01 re-times its strike, this file fails loudly
   instead of whiting out over the wrong frame.

   DECLARED DISCONTINUITIES: none. The whiteout is progressive in both
   directions and is inside a beat.
   ========================================================================= */
import { cycle, framesFor, clamp01, TAU } from "../engine/motion.mjs";
import { INK, PAPER, inkLevel, lerp, gray } from "../engine/halfworld-engine.mjs";
import { occupancyAt } from "../engine/blocking.mjs";
import {
  theMazeInside, MAZE_GEOMETRY, INITIAL_BF37, MOVES_BF37,
} from "./_plans/the-maze.mjs";
import { makeLens, NW, NH } from "../assets/set/_facility-lens.mjs";
import { dotWash } from "../assets/set/_dot-swap.mjs";
import { at as bf01At, drift as bf01Drift } from "./BF-01.mjs";
import { FACE_OF_MARA, SKIN_OF_MARA } from "../assets/character/mara.mjs";
import maraAsset from "../assets/character/mara.mjs";
import { exitOccupancy as INITIAL_FROM_BF36 } from "./BF-36.mjs";

/* ---- the motion scene contract ------------------------------------------ */
export const id         = "BF-37";
export const title      = "FROM INSIDE THE MAZE";
export const place      = "INT. THE MAZE · THE BUTTERFLY'S VIEW";
export const plan       = "the-maze-inside";
export const motion     = "CYCLE";
export const beats      = 4;
export const seconds    = 4.0;
export const loopClosed = false;                    // it is alive
export const frames     = framesFor(motion, seconds, 12, beats);   // 48
export const drift      = bf01Drift;                // 0.18 — BF-01's number
export const declaredBreak = null;

export const subject    = "a face above a roof, from under the roof";
export const distance   = "MEDIUM";
export const leftOut    = [
  "the corridors' LENGTH. The camera deletes it: partition_white_far, _mid and " +
  "_near are one point in this plan and eight of the twenty-eight stations are " +
  "excluded because of it. The choice has no extent and that is the unit",
  "the observation box's near face and the two sleeve ports. They are at h .30 " +
  "and .36, between the partition and the lid, and drawing them puts two more " +
  "horizontals across the only 183 pixels this scene has",
  "the room outside the box, the bench, Niko, the clock. From in here there is a " +
  "floor, a roof, and a face on the roof",
  "the real Mara in the rearing facility, watching this on a sheet. The " +
  "projection is playing this shot; the audience is watching a lid through a " +
  "screen through a lid, and only the innermost of those is in frame",
];

/* ---- BF-01's own layout constants, restated so the mapping is legible ----
   These four numbers are read off scenes/BF-01.mjs and the assertion below
   proves the phase marks still agree. */
const BF01_APEX = 158 + 0.88 * 112;                 // LID_BOT + 0.88*R = 256.56
const BF01_LOW  = 448;
const BF01_CX   = 561, BF01_W = 1120;
const LID_H = MAZE_GEOMETRY.lid_strike_point.h;     // .620
const DROP_H = MAZE_GEOMETRY.swallowtail_drop.h;    // .340

/* the impact beat, per BF-01's P_STRIKE / P_RELEASE. CHECKED, not assumed. */
const IMPACT_IN = 0.25, IMPACT_OUT = 0.305;
(function assertContact() {
  const mid = bf01At((IMPACT_IN + IMPACT_OUT) / 2, {});
  const before = bf01At(IMPACT_IN - 0.02, {});
  const after = bf01At(IMPACT_OUT + 0.02, {});
  if (!(mid.contact > 0) || before.contact > 0 || after.contact > 0)
    throw new Error("[BF-37] BF-01's impact beat has moved; the whiteout window is stale");
})();

/* ---- the lens ------------------------------------------------------------ */
const lens = makeLens(theMazeInside, { cx: 0.5, cy: 0.72, zoom: 1.55 });
const F_LAV = lens("maze_floor_lavender"), F_CLN = lens("maze_floor_clean");
const PART  = lens("partition_white_mid");
const LID_L = lens("lid_over_clean"), LID_R = lens("lid_over_lavender");
const LID_C = lens("lid_strike_point");
const MARA_LID = lens("mara_at_lid"), MARA_BR = lens("mara_held_breath");

/* the animal, at an arbitrary (a, h), through this camera */
function animalAt(a, h) {
  return lens({ x: 1 - a, z: h });
}

/* ============================================================ at(u) ======== */
export function at(u, _ctx) {
  /* BF-01's OWN STATE. Not a copy of its maths — its maths. */
  const b = bf01At(u, {});

  const a = 0.5 + (b.bx - BF01_CX) / BF01_W;
  const h = lerp(LID_H, DROP_H, clamp01((b.by - BF01_APEX) / (BF01_LOW - BF01_APEX)));
  const p = animalAt(a, h);

  /* THE WHITEOUT. 1 through the impact beat, then back over eight frames as an
     ordered per-dot swap. Entirely inside beat 1; the wrap is untouched. */
  const uu = u % 1;
  const white = uu >= IMPACT_IN && uu < IMPACT_OUT ? 1
              : uu >= IMPACT_OUT ? clamp01(1 - (uu - IMPACT_OUT) / 0.08)
              : clamp01(1 - (IMPACT_IN - uu) / 0.02);

  /* Mara holds her breath.

     PASS 1 USED HER MODULE'S OWN ONE-SHOT — chest rising over the first 14% and
     giving a little back at the end — AND IT BROKE THE CYCLE. The renderer
     reported wrap 6.40% against a 1.96% mean step, ratio 3.27, verdict
     DISCONTINUITY: `press` ended the revolution at 0.80 and began it at 0.28,
     which moved her face 26px in one frame at the wrap. Invisible in a still.

     The fix is not to soften it, it is to understand where the loop sits. She
     has been holding it for 43 seconds; the inhale happened long before this
     loop starts. So `press` is a HELD value with a deniable residue on it —
     0.035 of a sine, one revolution, seamless by construction — and MOTION-BRIEF
     rule 3 is satisfied by the residue rather than by an arc: "A frozen frame
     reads as a crash," and this is not frozen, it is held. */
  const press = 0.86 + 0.035 * Math.sin(u * TAU);

  return {
    u, beat: b.beat, wear: b.wear, contact: b.contact,
    ax: p.px, ay: p.py, ak: p.k,
    open: b.open, roll: b.roll, droop: b.droop,
    white, press,
    /* the acrylic's own displacement of what is beyond it. Three bands, and
       they do not move: acrylic does not ripple. What moves is her. */
    lidLight: (u * 2) % 1,
  };
}

/* ============================================================ draw() ======= */
export function draw(g, W, H, s) {
  g.save();
  g.scale(W / NW, H / NH);
  g.lineJoin = "round"; g.lineCap = "round";

  g.fillStyle = inkLevel(0); g.fillRect(0, 0, NW, NH);

  /* ---- THE FLOOR OF THE MAZE, at the top, at scale 0.697 ----
     Two corridor patches and the white partition between them. They have no
     length; what is drawn is what the camera can hold, which is their WIDTH and
     the fact that there are two of them. */
  const fy = F_LAV.py;
  g.fillStyle = inkLevel(1);
  /* PASS 2: at 300px wide the two patches overlapped by 25px and printed as ONE
     bar — which quietly says the maze has one corridor, i.e. the opposite of the
     unit. 240px leaves a 35px gap and there are visibly two of them. */
  g.fillRect(F_CLN.px - 120, fy - 44, 240, 88);
  g.fillRect(F_LAV.px - 120, fy - 44, 240, 88);
  g.strokeStyle = INK; g.lineWidth = 4;
  g.strokeRect(F_CLN.px - 120, fy - 44, 240, 88);
  g.strokeRect(F_LAV.px - 120, fy - 44, 240, 88);

  /* LAVENDER. One corridor carries it and one does not, and from in here it is
     still a SMELL: a column of small marks over the right-hand patch, which is
     the LEFT corridor of BF-01, because this camera has turned around. */
  g.fillStyle = inkLevel(5);
  for (let i = 0; i < 12; i++) {
    const ph = (i * 0.6180339887) % 1;
    const k = (s.u + ph) % 1;
    g.beginPath();
    g.arc(F_LAV.px - 108 + ((i * 37) % 216) + Math.sin((k + ph) * TAU) * 9,
          fy - 10 - k * 66, 4.2 * (1 - k * 0.6), 0, TAU);
    g.fill();
  }

  /* THE WHITE PARTITION — the brightest thing at the top of the frame, and the
     thing that divides. It has no length either; it is a bar between the two. */
  g.fillStyle = "#ffffff";
  g.fillRect(PART.px - 52, PART.py - 34, 104, 68);
  g.strokeStyle = INK; g.lineWidth = 6;
  g.strokeRect(PART.px - 52, PART.py - 34, 104, 68);

  /* ---- THE SWALLOWTAIL, from underneath ----
     What you see from below is the VENTRAL side: pale, and at the strike it is
     pressed flat on the plate. Drawn with the same wing law BF-01 uses — the
     closed wing presents its pale underside and steps down the ink ladder — and
     with the same open/roll/droop numbers, because they are the same numbers. */
  swallowtailFromBelow(g, s);

  /* ---- THE LID, EDGE ON ----
     A plane at one height, in a camera whose vertical axis IS height, is a LINE.
     Two hard rules with a light band between them: the thickness of the acrylic,
     which is the only dimension of it this camera can see. It is drawn UNBROKEN,
     the same licence BF-01 takes and for the same reason — it is the one surface
     in this world with no gap in it. */
  const ly = LID_C.py;
  g.fillStyle = inkLevel(1);
  g.fillRect(0, ly - 13, NW, 26);
  g.strokeStyle = INK; g.lineWidth = 5;
  g.beginPath(); g.moveTo(0, ly - 13); g.lineTo(NW, ly - 13); g.stroke();
  g.lineWidth = 9;
  g.beginPath(); g.moveTo(0, ly + 13); g.lineTo(NW, ly + 13); g.stroke();

  /* ---- MARA. Beyond it, enormous, holding her breath. ---- */
  maraOverhead(g, s);

  /* the acrylic between us and her: three hard catches of light lying ACROSS
     her, and a doubling of every edge under them. Acrylic does not ripple, so
     none of this moves; what moves is the face under it. */
  g.save();
  g.beginPath(); g.rect(0, ly + 13, NW, NH - ly - 13); g.clip();
  g.strokeStyle = inkLevel(0); g.lineWidth = 16;
  for (const [x0, x1, yy] of [[60, 470, 0.30], [560, 1010, 0.52], [150, 640, 0.78]]) {
    const y = ly + 13 + (NH - ly - 13) * yy;
    g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y + 8); g.stroke();
  }
  g.restore();

  /* ---- THE IMAGE GOES WHITE ----
     An ordered per-dot wash over the whole field, tied to contact. It floods at
     the strike and comes back dot by dot; there is no alpha in this and no
     cross-fade. */
  dotWash(g, { x: 0, y: 0, w: NW, h: NH }, s.white,
          (gg) => { gg.fillStyle = PAPER; gg.fillRect(0, 0, NW, NH); },
          { cell: 10 });

  g.restore();
}

/* ---- the animal, ventral, at BF-01's own state --------------------------- */
function swallowtailFromBelow(g, s) {
  const R = 168 * s.ak;
  g.save();
  g.translate(s.ax, s.ay);
  g.rotate(s.roll * 0.6);
  const openX = 0.12 + 0.88 * s.open;
  g.save(); g.scale(openX, 1);
  /* THE INK LADDER, BF-01's, restated: a closing wing presents its pale
     underside, so it steps 2 -> 1 -> 0 and its vein count drops with it. From
     underneath the whole animal is one step lighter again, because this is the
     ventral surface and that is what a ventral surface is. */
  const lev = s.open < 0.30 ? 0 : s.open < 0.58 ? 0 : 1;
  const nV  = s.open < 0.30 ? 1 : s.open < 0.58 ? 2 : 3;
  for (const sx of [-1, 1]) {
    for (const spec of [HIND, FORE]) {
      g.beginPath();
      g.moveTo(spec[0][0] * sx * R, spec[0][1] * R);
      for (let i = 1; i < spec.length; i++) {
        const p = spec[i];
        if (p.length === 6) g.bezierCurveTo(p[0] * sx * R, p[1] * R, p[2] * sx * R, p[3] * R, p[4] * sx * R, p[5] * R);
        else g.lineTo(p[0] * sx * R, p[1] * R);
      }
      g.closePath();
      g.fillStyle = inkLevel(lev); g.fill();
      g.strokeStyle = INK; g.lineWidth = 4.4; g.stroke();
    }
    g.strokeStyle = INK; g.lineWidth = 3.0 / Math.max(0.25, openX);
    g.beginPath();
    // 0.80 of their length: at full length they run past the wing outline and
    // the animal reads as a spider. A vein stops inside the wing.
    for (const [ex, ey] of VEINS.slice(0, nV)) { g.moveTo(0.06 * sx * R, 0); g.lineTo(ex * 0.80 * sx * R, ey * 0.80 * R); }
    g.stroke();
    /* THE FALSE EYES. They are on the UNDERSIDES, so this is the one camera in
       the world that can see them without the wings being closed — BF-05's
       "the false eyes on the undersides look back". Two, per wing, and they
       are the only round marks on the animal. */
    g.fillStyle = INK;
    g.beginPath(); g.arc(0.62 * sx * R, 0.44 * R, 5.2, 0, TAU); g.fill();
    g.fillStyle = PAPER;
    g.beginPath(); g.arc(0.62 * sx * R, 0.44 * R, 2.0, 0, TAU); g.fill();
  }
  g.restore();
  // the body, and the six legs that only this camera can see
  g.fillStyle = inkLevel(5);
  g.beginPath();
  g.moveTo(0, -0.62 * R);
  g.bezierCurveTo(0.10 * R, -0.46 * R, 0.09 * R, 0.30 * R, 0.02 * R, 0.58 * R);
  g.bezierCurveTo(-0.05 * R, 0.30 * R, -0.10 * R, -0.46 * R, 0, -0.62 * R);
  g.closePath(); g.fill();
  g.strokeStyle = INK; g.lineWidth = 3.4; g.stroke();
  g.lineWidth = 2.8;
  for (const sx of [-1, 1]) for (const [ay, bx, by] of [[-0.28, 0.34, -0.44], [-0.10, 0.40, -0.18], [0.08, 0.34, 0.14]]) {
    g.beginPath();
    g.moveTo(0.04 * sx * R, ay * R);
    g.quadraticCurveTo(bx * 0.6 * sx * R, (ay + by) * 0.5 * R, bx * sx * R, by * R);
    g.stroke();
  }
  const dp = s.droop * 1.6;
  g.lineWidth = 3.2;
  for (const sx of [-1, 1]) {
    g.beginPath();
    g.moveTo(0, -0.58 * R);
    g.quadraticCurveTo(0.16 * sx * R, -0.80 * R + dp * R, 0.32 * sx * R, -0.82 * R + dp * 1.7 * R);
    g.stroke();
  }
  g.restore();

  /* CONTACT. BF-01 draws its ticks on the far side of the acrylic; from in here
     they are on THIS side, and what you see is the animal pressed flat and a
     ring of loose scales coming off it. They brighten — MOTION-BRIEF — so they
     are paper on the light lid. */
  if (s.contact > 0) {
    const k = s.contact;
    g.fillStyle = PAPER;
    for (let i = 0; i < 9; i++) {
      const ph = (i * 0.7548776662) % 1;
      g.beginPath();
      g.arc(s.ax + (ph - 0.5) * 340 * (0.5 + k), s.ay + 26 + (1 - k) * 46 + ph * 14, 5, 0, TAU);
      g.fill();
    }
    g.strokeStyle = INK; g.lineWidth = 4 * k + 2;
    g.beginPath();
    for (const a of [-1, -0.5, 0.5, 1]) {
      const x = s.ax + a * 130;
      g.moveTo(x, s.ay + 34); g.lineTo(x + a * 28 * k, s.ay + 34 + 18 * k);
    }
    g.stroke();
  }
}

const FORE = [[0.02, -0.58], [0.55, -0.74, 1.02, -0.42, 1.05, -0.02],
              [0.80, 0.06, 0.35, 0.11, 0.06, 0.11]];
const HIND = [[0.05, 0.06], [0.55, 0.10, 0.88, 0.26, 0.80, 0.52],
              [0.95, 0.80], [0.66, 0.62], [0.45, 0.66, 0.18, 0.54, 0.05, 0.36]];
const VEINS = [[0.92, -0.40], [1.00, -0.14], [0.80, 0.14], [0.68, 0.46]];

/* ---- MARA, DIRECTLY OVERHEAD ---------------------------------------------
   Declared overpaint; see the header. Her values are her module's: the face the
   cast agent authored, her skin, and the 1.12 shoulders that are the only
   non-default proportion in the cast.

   The foreshortening is the camera's rule applied honestly: her head is at
   h .96 and her shoulders at h .86, so the head is NEARER — bigger and LOWER in
   frame — and the shoulders recede upward and outward behind it. That is what a
   face over a tank looks like from inside the tank and it is why no elevation
   rig could produce it. */
const SHOULDERS = maraAsset.params.proportion.shoulders;   // 1.12

function maraOverhead(g, s) {
  const cx = MARA_BR.px;
  const headY = MARA_BR.py + 84 - s.press * 22;
  const R = 146 * MARA_BR.k;                    // 1.166 at the near limit
  const shY = MARA_LID.py + 26 - s.press * 8;
  const shW = 330 * MARA_LID.k * SHOULDERS;

  g.save();

  // the shoulders, BEHIND and ABOVE the head: farther, so smaller and higher
  g.fillStyle = inkLevel(4); g.strokeStyle = INK; g.lineWidth = 6;
  g.beginPath();
  g.moveTo(cx - shW, shY + R * 1.5);
  g.quadraticCurveTo(cx - shW * 0.82, shY - R * 0.16, cx - R * 0.62, shY + R * 0.10);
  g.lineTo(cx + R * 0.62, shY + R * 0.10);
  g.quadraticCurveTo(cx + shW * 0.82, shY - R * 0.16, cx + shW, shY + R * 1.5);
  g.closePath(); g.fill(); g.stroke();

  // the hair, falling toward the camera round the face: the mass hangs DOWN in
  // frame because down in frame is nearer, and hair over a tank hangs at you.
  g.fillStyle = gray(0x5e); g.strokeStyle = INK; g.lineWidth = 5;
  g.beginPath();
  g.ellipse(cx, headY + R * 0.14, R * 1.10, R * 1.22, 0, 0, TAU);
  g.fill(); g.stroke();

  // the face
  g.fillStyle = SKIN_OF_MARA; g.strokeStyle = INK; g.lineWidth = 5;
  g.beginPath();
  g.ellipse(cx, headY, R * 0.82, R * 0.96, 0, 0, TAU);
  g.fill(); g.stroke();

  /* THE FEATURES, from FACE_OF_MARA: browUp .04, browKnit .10, eyeNarrow .16,
     no smile and no frown. Seen from below, a face is chin-first: the jaw is
     NEARER than the brow, so the mouth sits low and large and the eyes sit high
     and compressed. That is the distortion, and it is anatomy rather than an
     effect on top of a drawing. */
  const eyeY = headY - R * 0.30, eyeDX = R * 0.34;
  g.lineWidth = 5; g.strokeStyle = INK;
  for (const sx of [-1, 1]) {
    // the brow: knit, and level
    g.beginPath();
    g.moveTo(cx + sx * (eyeDX - R * 0.20), eyeY - R * 0.20 - FACE_OF_MARA.browUp * R * 0.06);
    g.quadraticCurveTo(cx + sx * eyeDX, eyeY - R * 0.27,
                       cx + sx * (eyeDX + R * 0.19), eyeY - R * 0.19);
    g.stroke();
    // the eye: narrowed, and compressed by the angle
    g.fillStyle = PAPER;
    g.beginPath();
    g.ellipse(cx + sx * eyeDX, eyeY, R * 0.20, R * 0.098 * (1 - FACE_OF_MARA.eyeNarrow), 0, 0, TAU);
    g.fill(); g.stroke();
    g.fillStyle = INK;
    g.beginPath(); g.arc(cx + sx * eyeDX, eyeY, R * 0.058, 0, TAU); g.fill();
  }
  // the underside of the nose: two nostrils and no bridge. From below there is
  // no bridge.
  g.fillStyle = INK;
  for (const sx of [-1, 1]) {
    g.beginPath();
    g.ellipse(cx + sx * R * 0.11, headY + R * 0.16, R * 0.052, R * 0.036, sx * 0.4, 0, TAU);
    g.fill();
  }
  // the mouth: closed, low, and wide, because she is holding her breath
  g.strokeStyle = INK; g.lineWidth = 6;
  g.beginPath();
  g.moveTo(cx - R * 0.26, headY + R * 0.46);
  g.quadraticCurveTo(cx, headY + R * 0.50, cx + R * 0.26, headY + R * 0.46);
  g.stroke();

  g.restore();
}

/* ---- occupancy -----------------------------------------------------------
   the-maze: "BF-37 is a PROJECTION of the morning's trial, so its occupancy is
   not chained from BF-01 in the-facility's timeline; it is BF-01's occupancy
   replayed." So this unit exports the MAZE's occupancy under `exitOccupancy`,
   and passes the FACILITY's through untouched under its own name, because the
   people in the rearing facility do not move while a projector runs. BF-38
   imports the second one and the chain of the act survives a scene set in a
   different room eighty minutes earlier. */
export const INITIAL = INITIAL_BF37;
export const MOVES   = MOVES_BF37;
export const exitOccupancy = occupancyAt(theMazeInside, MOVES, 5, INITIAL);

/** the rearing facility's chain, carried across this unit unchanged. Nobody in
 *  that room moves while a projector runs, and BF-38 imports THIS rather than
 *  `exitOccupancy` so that eleven units of the act stay one continuous
 *  movement across a scene shot in another room eighty minutes earlier. */
export const exitFacilityOccupancy = INITIAL_FROM_BF36;

export const SCENE_VERSION = "bf-motion/1.0.0";
