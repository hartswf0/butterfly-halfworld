/* character.thegirl — THE GIRL IN THE YELLOW DRESS. About eight.
   CHARACTER asset for I REMEMBER BEING A BUTTERFLY (B01). One unit: BF-40, the
   last one, and she has the last line.

   ---------------------------------------------------------------------------
   THE WHOLE OF HER, quoted. BF-40:

     "At the pool's edge stands a girl in a yellow dress. Water streams from her
      hair. In both hands she holds a chrysalis split neatly along one side. She
      looks eight years old. She has Mara's face. She raises the empty chrysalis
      to her ear. Then the projector stops. In the darkness, something opens its
      wings."
     THE GIRL: "Someone is still inside."

   Five facts and one line. Everything in this file traces to one of them.

   1. "SHE LOOKS EIGHT YEARS OLD" — spec.age = 8, which puts figure-hero's
      childProportion() curve in charge: 6.3 heads tall instead of 7.6, so the
      head is a fifth of her height rather than a seventh; legs 10% shorter as a
      fraction of height, trunk 4% longer, shoulders 9% narrower, neck 12%
      shorter and thicker. A SMALL ADULT IS THE FAILURE MODE HERE and it is a
      failure the rig has an instrument for, so there is no excuse for it. Her
      `scale` is 0.72 on top of that, which is height; `age` is proportion. Two
      different things and the second one is the one that matters.

   2. "SHE HAS MARA'S FACE" — imported, not approximated. FACE_OF_MARA and
      SKIN_OF_MARA come out of assets/character/mara.mjs, so if Mara's face
      changes this face changes with it and they cannot drift apart. This is the
      same reasoning that makes the broken circle one function.
      HONEST LIMIT: figure-hero draws one face and varies it by channels, so
      "the same face" is as far as any two characters in this world can be from
      each other anyway. What the import buys is that they are the same
      DELIBERATELY, and that the girl's face carries Mara's withholding rather
      than a child's default. What it cannot buy is a resemblance you could pick
      out of a line-up. Flagged.

   3. "IN A YELLOW DRESS" — the world has one accent and yellow is not it. What
      yellow IS, under a post pass that quantizes by luminance, is LIGHT: near
      paper, two or three levels above everything else in the frame. The rig's
      garment table has no value that light (its lightest closed garment is
      #9a9a92, a mid), so the dress is painted over the rig's torso as an A-line
      at gray(0xd6) and the shins are repainted in skin. Declared overpaint, and
      the reason is a palette limit, not a preference.

   4. "WATER STREAMS FROM HER HAIR" — continuous, not a drip: it is streaming.
      The strands are drawn wet-dark and the water leaves at EQUAL INTERVALS
      (see motions.stream), which is the same quantisation the tapping in BF-14
      and BF-21 gets. Nothing in this world eases.

   5. "A CHRYSALIS SPLIT NEATLY ALONG ONE SIDE" — and it is EMPTY, and she
      raises it to her ear anyway, and says someone is still inside. The split
      is drawn open, the interior is drawn as interior, and nothing is drawn in
      it. BF-32: "Every chrysalis is empty."

   SILENT. Her hair colour and length, her build, whether she is barefoot, and
   what she is standing on beyond "the pool's edge". Hair takes the wardrobe
   module's child-appropriate fall rather than the bob annulus (which "boxes the
   head into a slab" on a child, by the sibling world's own logged finding), at
   the shortest length that can plausibly stream. Bare feet are INFERRED from
   the pool and the streaming water and are flagged here as inference.
*/
import { gray, INK, PAPER, clamp } from "../../engine/halfworld-engine.mjs";
import { POSES } from "../../engine/figure-hero.mjs";
import { makeGuiseFigure } from "../../engine/guise.mjs";
import { hairFall } from "../../engine/acres-wardrobe.mjs";
import { advance, hold } from "../../engine/motion.mjs";
import { SURFACE, poseWith, P, breathRig } from "./_rig.mjs";
import { FACE_OF_MARA, SKIN_OF_MARA } from "./mara.mjs";

const TAU = Math.PI * 2;
const SCRATCH = "tg__frame";

/* ---- the one body ------------------------------------------------------- */
const BASE = {
  skin: SKIN_OF_MARA,          // imported: "She has Mara's face."
  hairColor: "#3d3a34",        // wet. Hair colour is not given; wetness is.
  hair: "short",
  beard: false, glasses: false, cloak: false,
  garment: "dress",            // the shape; the yellow is painted over it
  bareLegs: false,
  sleeve: "none",              // a summer dress; arms bare to the shoulder
  shoe: SKIN_OF_MARA,          // barefoot — INFERRED from the pool. Flagged.
  scale: 0.72,                 // height
  age: 8,                      // PROPORTION. The important one. See header.
};

/* One guise: the text gives her one appearance, in one unit, and she is wet in
   all of it. The pattern is kept so that the body is provably one body and so
   that a later state cannot quietly become a different child. */
const fig = makeGuiseFigure(BASE, { wet: { wet: true } }, { id: "thegirl" });

/* ---- poses -------------------------------------------------------------- */
const FACE = { ...FACE_OF_MARA };        // imported wholesale. See header.

// BF-40 — standing at the pool's edge, the chrysalis held in BOTH hands at
// chest height. A child holding something carefully holds it with two hands and
// close in; the elbows stay at the ribs.
P("tg_pool", {
  ...FACE,
  spineLean: 0, headPitch: 0.10, chestLift: 0.18,
  armLUpper: 0.30, armLLower: -1.34, handRotL: 0.44,
  armRUpper: -0.30, armRLower: 1.34, handRotR: -0.44,
  hipL: 0.03, hipR: -0.03, kneeL: 0.04, kneeR: 0.04,
}, ["palm_up", "palm_up"]);

// BF-40 — "She raises the empty chrysalis to her ear." One hand goes up; the
// head tips toward it rather than the hand travelling all the way, which is
// what listening actually looks like.
P("tg_ear", {
  ...FACE, eyeNarrow: 0.30,
  headRoll: -0.20, headYaw: -0.16, neckRoll: -0.08, gazeX: -0.10, gazeY: 0.10,
  armLUpper: -0.46, armLLower: -1.86, handRotL: 0.30,
  armRUpper: -0.24, armRLower: 0.90, handRotR: -0.20,
  shoulderLiftL: 0.42,
}, ["relaxed", "palm_up"]);

// BF-40 — "Someone is still inside." Said levelly, to an adult, without
// urgency. jaw opens; nothing else in the face moves, because nothing in the
// text says it does.
P("tg_speaking", {
  ...FACE, jaw: 0.34,
  headPitch: -0.10, neckPitch: -0.06, gazeY: -0.16,
  armLUpper: 0.28, armLLower: -1.28, handRotL: 0.44,
  armRUpper: -0.28, armRLower: 1.28, handRotR: -0.44,
}, ["palm_up", "palm_up"]);

/* ---- overpaint ---------------------------------------------------------- */

/* THE DRESS. An A-line from the shoulder line to mid-thigh, light. No collar,
   no buttons, no sash: the text says "a yellow dress" and stops, so this is the
   fewest lines that make a dress. */
function dress(ctx, W, H, neck, hip, footL, footR) {
  const nx = neck.x * W, ny = neck.y * H, hx = hip.x * W, hy = hip.y * H;
  const fy = Math.max(footL.y, footR.y) * H;
  const hem = hy + (fy - hy) * 0.30;
  /* PASS 2. At 0.088/0.150 the dress swallowed both arms: it is painted after
     the rig, so anything inside its outline disappears, and a child holding
     something in both hands has her forearms exactly there. Narrowed to a
     bodice that clears the upper arms; the hands are repainted over it below. */
  const topW = W * 0.064, hemW = W * 0.124;
  ctx.save();
  ctx.fillStyle = gray(0xd6); ctx.strokeStyle = INK; ctx.lineWidth = 4.4; ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(nx - topW * 0.72, ny + H * 0.010);
  ctx.lineTo(nx + topW * 0.72, ny + H * 0.010);
  ctx.quadraticCurveTo(hx + topW * 0.95, hy - H * 0.02, hx + hemW, hem);
  ctx.quadraticCurveTo(hx, hem + H * 0.014, hx - hemW, hem);
  ctx.quadraticCurveTo(hx - topW * 0.95, hy - H * 0.02, nx - topW * 0.72, ny + H * 0.010);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // two folds, short, so the plane is not a slab
  ctx.strokeStyle = gray(0xa8); ctx.lineWidth = 3;
  for (const s of [-0.42, 0.30]) {
    ctx.beginPath();
    ctx.moveTo(hx + s * hemW * 0.9, hy + H * 0.012);
    ctx.lineTo(hx + s * hemW * 1.18, hem - H * 0.012);
    ctx.stroke();
  }
  ctx.restore();
}

/* Legs in skin below the hem — without this the rig paints trouser grey from
   hip to ankle and a child in a summer dress reads as a child in slacks. */
function legs(ctx, W, H, hip, footL, footR) {
  const hx = hip.x * W, hy = hip.y * H;
  for (const f of [footL, footR]) {
    const fx = f.x * W, fy = f.y * H;
    const x0 = hx + (fx - hx) * 0.30, y0 = hy + (fy - hy) * 0.30;
    const x1 = hx + (fx - hx) * 0.92, y1 = hy + (fy - hy) * 0.92;
    ctx.lineCap = "round";
    ctx.strokeStyle = INK; ctx.lineWidth = W * 0.030 + 8;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.strokeStyle = SKIN_OF_MARA; ctx.lineWidth = W * 0.030;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  }
}

/* THE WATER. "Water streams from her hair" — streaming, so the strand is
   continuous and it is the DROPS that leave at equal intervals. `u` advances
   them; there is no easing anywhere in it, per MOTION-BRIEF's warning about
   smoothing the tapping. Drawn light on the dark wet hair and dark on the
   paper below it, because water is not a colour, it is a change of what is
   behind it. */
const gr = i => ((i + 1) * 0.6180339887498949) % 1;
function water(ctx, W, H, head, crown, phase = 0) {
  const cx = head.x * W, cy = head.y * H;
  const R = Math.max(10, (head.y - crown.y) * H);
  ctx.save();
  ctx.lineCap = "round";
  const n = 7;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const x = cx + (t - 0.5) * R * 2.15;
    const y0 = cy + R * (0.92 + 0.30 * Math.sin(t * 3.3));
    const len = R * (1.05 + 0.55 * gr(i * 5));
    // the stream itself
    ctx.strokeStyle = gray(0x54); ctx.lineWidth = 4.0;
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.quadraticCurveTo(x + R * 0.06 * (gr(i) - 0.5), y0 + len * 0.6, x + R * 0.05 * (gr(i + 3) - 0.5), y0 + len);
    ctx.stroke();
    // the drop that has left it. Equal intervals, quantised by the caller.
    const k = ((phase + gr(i * 11)) % 1);
    const dy = y0 + len + k * R * 1.35;
    ctx.fillStyle = gray(0x58);
    ctx.beginPath(); ctx.ellipse(x + R * 0.03, dy, R * 0.070, R * 0.105, 0, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

/* A CUPPED HAND, repainted over the dress. One closed contour: the palm, the
   four fingers fused into the cup's rim, the thumb a lobe on the same outline.
   `side` +1 is the left hand of the pair. */
function cupped(ctx, W, H, at, side) {
  const x = at.x * W, y = at.y * H, r = W * 0.030;
  ctx.save();
  ctx.fillStyle = SKIN_OF_MARA; ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x - side * r * 0.95, y - r * 0.35);
  ctx.quadraticCurveTo(x - side * r * 1.15, y + r * 0.55, x, y + r * 0.85);
  ctx.quadraticCurveTo(x + side * r * 1.05, y + r * 0.50, x + side * r * 0.90, y - r * 0.40);
  ctx.quadraticCurveTo(x + side * r * 0.30, y - r * 0.62, x - side * r * 0.95, y - r * 0.35);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 2.2;         // three finger notches
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(x + i * r * 0.42, y + r * 0.30);
    ctx.lineTo(x + i * r * 0.46, y + r * 0.72);
    ctx.stroke();
  }
  ctx.restore();
}

/* THE CHRYSALIS. "split neatly along one side", "larger than any swallowtail
   chrysalis Mara has seen" (BF-23), and empty. The split is a real opening with
   two lips and an interior, and the interior is drawn as an interior and
   contains NOTHING. `tilt` aims it; `open` widens the split. */
function chrysalis(ctx, W, H, at, o = {}) {
  const x = at.x * W, y = at.y * H;
  // PASS 3: at 0.082 it printed as a pale ring at her waist. It is "larger
  // than any swallowtail chrysalis Mara has seen" (BF-23) and it is the thing
  // the whole state is about, so it is bigger and a level darker.
  const L = W * 0.112, w = L * 0.42;
  ctx.save();
  ctx.translate(x, y); ctx.rotate(o.tilt || -0.35);
  // the husk: one closed contour, tapering to the cremaster
  ctx.fillStyle = gray(0xb2); ctx.strokeStyle = INK; ctx.lineWidth = 4.5; ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(0, -L * 0.52);
  ctx.quadraticCurveTo(w, -L * 0.30, w * 0.92, L * 0.10);
  ctx.quadraticCurveTo(w * 0.70, L * 0.46, 0, L * 0.56);
  ctx.quadraticCurveTo(-w * 0.70, L * 0.46, -w * 0.92, L * 0.10);
  ctx.quadraticCurveTo(-w, -L * 0.30, 0, -L * 0.52);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // the split, along ONE side, neat: a lens of interior with two hard lips
  const s = 0.55 + (o.open || 0) * 0.45;
  ctx.fillStyle = gray(0x4e);
  ctx.beginPath();
  ctx.moveTo(w * 0.10, -L * 0.34);
  ctx.quadraticCurveTo(w * (0.30 + 0.30 * s), 0, w * 0.06, L * 0.40);
  ctx.quadraticCurveTo(w * 0.02, 0, w * 0.10, -L * 0.34);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(w * 0.10, -L * 0.34);
  ctx.quadraticCurveTo(w * (0.30 + 0.30 * s), 0, w * 0.06, L * 0.40);
  ctx.stroke();
  // segment rings on the abdomen end. Geometry, three of them, no more.
  ctx.strokeStyle = gray(0x8a); ctx.lineWidth = 2.4;
  for (let i = 0; i < 3; i++) {
    const yy = L * (0.06 + i * 0.13);
    ctx.beginPath(); ctx.moveTo(-w * 0.72, yy); ctx.quadraticCurveTo(0, yy + L * 0.05, w * 0.66, yy - L * 0.02); ctx.stroke();
  }
  ctx.restore();
}

/* ---- the asset ---------------------------------------------------------- */
export const asset = {
  id: "character.thegirl",
  type: "CHARACTER",
  name: "The Girl in the Yellow Dress",
  statusWord: "STILL INSIDE",
  scene: "BF-40",

  params: { ...BASE, dress: "yellow -> light, by luminance", barefoot: "inferred" },
  layers: ["shadow", "legs", "dress", "far-arm", "neck", "head", "face", "near-arm",
           "hair", "water", "chrysalis"],
  anchors: {
    head: { x: .50, y: .24 }, crown: { x: .50, y: .16 }, eyes: { x: .50, y: .25 },
    ear: { x: .44, y: .25 }, sternum: { x: .50, y: .47 },
    leftHand: { x: .43, y: .55 }, rightHand: { x: .57, y: .55 },
    chrysalis: { x: .50, y: .55 }, hip: { x: .50, y: .64 }, feet: { x: .50, y: .93 },
  },
  states: {
    initial: "pool",
    nodes: {
      // BF-40 · at the pool's edge, both hands on the split husk. The card.
      pool: { preview: { pose: "tg_pool", guise: "wet", chrysalis: true, phase: .2, gaze: { x: 0, y: .12 }, t: .5 } },
      // BF-40 · "She raises the empty chrysalis to her ear."
      ear: { preview: { pose: "tg_ear", guise: "wet", chrysalis: true, atEar: true, phase: .5, gaze: { x: -.10, y: .10 }, t: .5 } },
      // BF-40 · "Someone is still inside."
      speaking: { preview: { pose: "tg_speaking", guise: "wet", chrysalis: true, phase: .8, gaze: { x: 0, y: -.16 }, t: .5 } },
    },
    edges: [["pool", "ear"], ["ear", "speaking"], ["speaking", "pool"]],
  },
  channels: ["gaze", "mouth", "breath", "pose", "guise", "chrysalis", "atEar", "phase", "open", "rig"],

  /* ---- MOTIONS --------------------------------------------------------- */
  motions: {
    /* BREATH. A child's resting rate is faster and deeper as a fraction of the
       chest than an adult's, so the amplitude is up and the drift is down —
       she has not been standing here for 43 seconds holding it, the way Mara
       has. Open cycle regardless: she is alive. */
    breath(u) {
      return { rig: breathRig(u, { amp: 1.25, drift: 0.03 }), phase: u, t: u * 3.4 };
    },

    /* STREAM. The water leaves her hair at EQUAL INTERVALS. advance() with
       dwell is the quantiser — MOTION-BRIEF: "Not wildly. It moves around the
       circumference, testing the glass at equal intervals. Equal intervals.
       Quantise it; do not ease it." Same law, different water.
       The body underneath goes on breathing; the two are not synchronised, and
       must not be, or the child starts to look like a pump. */
    stream(u) {
      const a = advance(u, 6, { dwell: 0.30 });
      return {
        pose: "tg_pool", chrysalis: true,
        phase: (a.index + a.shift) / 6,
        rig: breathRig(u * 1.37, { amp: 1.25, drift: 0.03 }),
        t: u * 3.4,
      };
    },

    /* TO THE EAR. One-shot, not a loop: the hand goes up over the first third,
       the head comes to meet it over the second, and the last third is held —
       held, not frozen, so hold() keeps the residue going underneath. She is
       listening to an empty object and the listening is the long part. */
    to_the_ear(u) {
      const rise = Math.min(1, u / 0.34);
      const tip = Math.min(1, Math.max(0, (u - 0.28) / 0.30));
      const h = hold(u, { dur: 5 });
      return {
        pose: "tg_ear", chrysalis: true, atEar: rise > 0.9,
        phase: u,
        rig: {
          ...breathRig(u, { amp: 1.15, drift: 0.03 }),
          armLUpper: 0.30 - 0.76 * rise,
          armLLower: -1.34 - 0.52 * rise,
          shoulderLiftL: 0.42 * rise,
          headRoll: -0.20 * tip + h.tilt * 0.02,
          neckRoll: -0.08 * tip,
          headYaw: -0.16 * tip,
        },
        eyeNarrow: 0.30 * tip,
        t: u * 5,
      };
    },
  },

  // CARD SIGNATURE — STILL INSIDE: eight years old, at the pool's edge, holding
  // an empty thing in both hands, water still coming off her.
  preview: () => ({ pose: "tg_pool", guise: "wet", chrysalis: true, phase: .2,
                    gaze: { x: 0, y: .12 }, t: .5, status: "STILL INSIDE", progress: 1 }),

  draw(ctx, W, H, state) {
    const st = state || {};
    const pose = poseWith(st.pose && POSES[st.pose] ? st.pose : "tg_pool", st.rig, SCRATCH);
    const r = fig.draw(ctx, W, H, { ...st, pose });
    const a = (r && r.anchors) || {};
    const head = a.head || { x: .5, y: .24 }, crown = a.crown || { x: .5, y: .16 };
    const neck = a.neck || { x: .5, y: .36 }, hip = a.hip || { x: .5, y: .64 };
    const fL = a.leftFoot || { x: .46, y: .92 }, fR = a.rightFoot || { x: .54, y: .92 };
    const L = a.leftHand || { x: .43, y: .55 }, R = a.rightHand || { x: .57, y: .55 };

    legs(ctx, W, H, hip, fL, fR);
    dress(ctx, W, H, neck, hip, fL, fR);
    // wet hair: two falls either side of the face. The annulus used on the
    // adults boxes a child's head into a slab — the sibling world logged that
    // one after a render, and it is not worth rediscovering.
    hairFall(ctx, W, H, head, crown, { len: 1.5, fill: gray(0x3d) });
    water(ctx, W, H, head, crown, st.phase || 0);
    if (st.chrysalis) {
      const at = st.atEar ? { x: L.x, y: L.y } : { x: (L.x + R.x) / 2, y: (L.y + R.y) / 2 - 0.012 };
      // hands first, then the thing they are holding, both over the dress.
      // "In BOTH hands" — so two cupped hands, each ONE closed silhouette, the
      // law figure-hero draws its own hands under.
      if (!st.atEar) { cupped(ctx, W, H, L, 1); cupped(ctx, W, H, R, -1); }
      else cupped(ctx, W, H, L, 1);
      chrysalis(ctx, W, H, at, { tilt: st.atEar ? -1.15 : -0.35, open: st.open || 0 });
    }
    return r;
  },
};
export default asset;
