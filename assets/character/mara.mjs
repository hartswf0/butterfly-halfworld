/* character.mara — MARA VENN, 34. The researcher.
   CHARACTER asset for I REMEMBER BEING A BUTTERFLY (B01). She is in 30 of the
   40 units; every plan in the world has her in it.

   ---------------------------------------------------------------------------
   EVIDENCE. Everything below is quoted from atlas/source.json or from the
   prose brief. Where the text is silent I have said so instead of deciding.

   THE HANDS.
     BF-03  "Mara has not moved. Her hands are still inside the sleeves of the
             observation box."
     prose  "Both hands inside the sleeves, although there was nothing left for
             her hands to do."
   This is the character's whole posture and it is also, usefully, a drawing
   instruction: in her baseline state HER HANDS ARE NOT VISIBLE. They are
   inside a sealed box. The rig draws hands; the port discs are painted over
   them. A figure whose hands have been taken out of the frame and who has not
   moved is exactly what "nothing left for her hands to do" looks like.

   THE SHOULDERS. Stated twice, and by two different people, which is what
   makes it a silhouette fact rather than a description:
     BF-17  IONA: "You have her shoulders."
     BF-33  "Mara knows her before she turns — not her face. Her shoulders."
   So the shoulders are the one thing about her body that is recognisable at a
   distance, from behind, in a projected 8mm frame. `proportion.shoulders` is
   the only channel in the rig that can carry that, and it is set here and
   nowhere else in the cast. She is the only character in this world with
   non-default shoulders.

   THE BREATH.
     BF-37  "Mara sees herself beyond the acrylic: enormous, distorted, holding
             her breath."
   She holds it. That is a motion, not a pose — see `motions.held_breath`.

   THE SCALES ON HER HAND.
     BF-04  "A yellow powder remains on her glove."
     BF-07  "Yellow scales have passed through a puncture near the thumb and
             settled on her skin. They lie in the lines of her palm like ground
             metal. She rubs them with the side of her finger. Instead of
             disappearing, they brighten."
   The glove and the ungloved hand are the only surface change the text gives
   her, so they are the two guises. MOTION-BRIEF: "Letting the scales fade …
   Anything that dims is wrong." They are painted at PAPER, brighter than skin.

   WHAT SHE IS DOING.
     BF-06  MARA: "Delete the path visualization." / NIKO: "The path is the
            record." / MARA: "The arm choice is the record."
     BF-31  "She holds the strip toward the fluorescent light and advances it
            between her fingers."

   SILENT. The text never describes Mara's face, hair, height, or clothing. It
   describes a glove and a pair of box sleeves and nothing else. So: the rig's
   own proportions at 34 (no age curve applies), the palette's lightest closed
   garment standing in for laboratory clothing, and the shortest hair mass the
   wardrobe module draws — which is the lowest-information option available,
   not a characterisation. If a later pass gets a real description, only
   `params` changes; no pose and no motion depends on any of it.
   ---------------------------------------------------------------------------
   OVERPAINT, declared. BUILD-BRIEF §3 wants it at zero. Three things here are
   not in the rig and cannot be: the observation-box PORTS (which are the
   character's defining fact), the SCALES in her palm, and the FILM STRIP. Each
   is placed from the rig's reported hand anchors so it tracks the pose.
*/
import { makeFigure, gray, INK, PAPER, clamp } from "../../engine/halfworld-engine.mjs";
import { POSES } from "../../engine/figure-hero.mjs";
import { makeGuiseFigure } from "../../engine/guise.mjs";
import { hairMass } from "../../engine/acres-wardrobe.mjs";
import { cycle, hold, advance } from "../../engine/motion.mjs";
import { SURFACE, poseWith, P, breathRig } from "./_rig.mjs";

const TAU = Math.PI * 2;
const SCRATCH = "mv__frame";

/* ---- the one body ------------------------------------------------------- */
const BASE = {
  skin: SURFACE.skin,
  hairColor: SURFACE.hairDark,
  hair: "short",
  beard: false, glasses: false, cloak: false,
  garment: SURFACE.lab,        // lightest closed garment in the palette; see header
  bareLegs: false,
  sleeve: "long",              // her forearms are inside box sleeves half the time
  shoe: SURFACE.shoeLab,
  scale: 0.98,
  // HER GRANDMOTHER'S SHOULDERS. The one non-default proportion in the cast.
  // 1.12 is enough to read at contact-sheet size and not enough to make her a
  // swimmer; the claim in the text is recognition, not physique.
  proportion: { shoulders: 1.12 },
};

/* Two guises, and the text supports exactly two: the gloved hand of BF-04 and
   the punctured, ungloved hand of BF-07. `glove` is not a rig channel — it is
   carried on the spec so that guise blending snaps it like any other discrete
   param, and so the silhouette underneath is provably the same body. */
const fig = makeGuiseFigure(BASE, {
  gloved: { glove: true },
  bare: { glove: false },
}, { id: "mara" });

/* ---- poses -------------------------------------------------------------- */
/* Her face, constant across every state. The text gives her no expression at
   all; what it gives her is withholding — she asks for evidence to be deleted
   and she does not answer Niko's last question in BF-11. So: no smile, no
   frown, lids a little low, brows level. Anything more is invention. */
const FACE = { smile: 0, frown: 0, browUp: 0.04, browKnit: 0.10, eyeNarrow: 0.16, jaw: 0 };

// BF-03 — both hands inside the sleeves. Forearms forward into the box, the
// body square to it, weight even, absolutely still.
P("mv_sleeves", {
  ...FACE,
  spineLean: -0.06, headPitch: 0.16, neckPitch: 0.08, gazeY: 0.22,
  armLUpper: 0.50, armLLower: -1.26, handRotL: 0.30,
  armRUpper: -0.50, armRLower: 1.26, handRotR: -0.30,
  shoulderLiftL: 0.10, shoulderLiftR: 0.10,
  hipL: 0.02, hipR: -0.02, kneeL: 0.03, kneeR: 0.03,
}, ["relaxed", "relaxed"]);

// BF-04 — the butterfly passes over her wrist "before she can lower the vial".
// The right arm is out and stopped mid-lowering; the left stays in the box.
P("mv_wrist", {
  ...FACE, eyeWide: 0.20, eyeNarrow: 0,
  headYaw: 0.30, neckYaw: 0.16, gazeX: 0.42, gazeY: 0.28, headPitch: 0.14,
  armRUpper: -0.98, armRLower: 0.74, handRotR: -0.18,
  armLUpper: 0.58, armLLower: -1.00, handRotL: 0.30,
  shoulderLiftR: 0.18,
}, ["relaxed", "offering"]);

// BF-07 — "She rubs them with the side of her finger." Both hands up at
// sternum height, the left palm turned up, the right crossing to it. Head
// down. This is the closest she comes to looking at anything.
P("mv_palm", {
  ...FACE, browKnit: 0.22, eyeNarrow: 0.08,
  headPitch: 0.44, neckPitch: 0.20, gazeY: 0.55, spineLean: -0.10,
  armLUpper: 0.44, armLLower: -1.28, handRotL: 0.52,
  armRUpper: -0.36, armRLower: 1.42, handRotR: -0.44,
  shoulderLiftL: 0.16, shoulderLiftR: 0.22,
}, ["palm_up", "point"]);

// BF-06 — "Delete the path visualization." Arms down and closed, one hand
// holding the opposite forearm. She is not gesturing; she is deciding.
P("mv_delete", {
  ...FACE, browKnit: 0.26, eyeNarrow: 0.24,
  bodyYaw: 0.18, headYaw: -0.34, gazeX: -0.42,
  armLUpper: -0.30, armLLower: -1.16, handRotL: 0.34,
  armRUpper: 0.34, armRLower: 1.24, handRotR: -0.30,
}, ["relaxed", "relaxed"]);

// BF-31 — the strip held toward the fluorescent light, advanced between the
// fingers. Both hands up, chin lifted, gaze past her own hands.
P("mv_strip", {
  ...FACE, eyeWide: 0.14, eyeNarrow: 0, browUp: 0.14,
  headPitch: -0.26, neckPitch: -0.12, gazeY: -0.34,
  armLUpper: 1.06, armLLower: -1.14, handRotL: 0.20,
  armRUpper: -1.02, armRLower: 1.10, handRotR: -0.20,
  shoulderLiftL: 0.30, shoulderLiftR: 0.30,
}, ["point", "point"]);

// BF-37 — from inside the maze: "enormous, distorted, holding her breath."
// Chest locked at the top of an inhale, shoulders up, head forward over the
// lid. The distortion is the acrylic's and belongs to the scene, not to her.
P("mv_held", {
  ...FACE, eyeWide: 0.30, eyeNarrow: 0, browUp: 0.10, browKnit: 0.18,
  spineLean: -0.24, headPitch: 0.30, neckPitch: 0.16, gazeY: 0.42,
  chestLift: 0.92,
  armLUpper: 0.54, armLLower: -1.28, armRUpper: -0.54, armRLower: 1.28,
  shoulderLiftL: 0.28, shoulderLiftR: 0.28, rootScale: 1.06,
}, ["relaxed", "relaxed"]);

/* ---- overpaint ---------------------------------------------------------- */

/* THE PORTS. The near wall of the observation box, cut off well short of the
   frame edge (trap 2: a full-width horizontal bar stripes the frame), with two
   sleeve ports her forearms enter and her hands do not come out of. The gauntlet
   cuff is a heavy ring; inside it there is nothing to draw, and that is the
   point. Placed from the reported hand anchors, so it tracks the pose. */
function ports(ctx, W, H, L, R) {
  const lx = L.x * W, ly = L.y * H, rx = R.x * W, ry = R.y * H;
  const r = W * 0.052;

  /* PASSES 2 AND 3. Twice this was drawn as a filled plane across her middle
     and twice it SEVERED THE FIGURE: a near-white fill is above the dot floor,
     so it prints as bare paper and takes her hips and thighs with it. The
     second attempt narrowed it to a band and it severed her more neatly.

     The answer was in the text the whole time. BF-01: "the CLEAR acrylic lid";
     `transparency` is one of the world's fourteen concepts and it is weighted
     10 in BF-37. The front of an observation box is clear. So there is no
     plane here at all — only the edges of the aperture, two short rules where
     the acrylic catches, and the two ports. Everything behind it is her, and
     that is both what the box is and what the dot law wants. */
  ctx.save();
  ctx.strokeStyle = INK; ctx.lineCap = "round"; ctx.lineJoin = "round";

  for (const [hx, hy] of [[lx, ly], [rx, ry]]) {
    // the acrylic's edge, catching the light either side of the port: two
    // short rules, never a span
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(hx - r * 2.30, hy - r * 1.02); ctx.lineTo(hx - r * 1.20, hy - r * 1.02);
    ctx.moveTo(hx + r * 1.20, hy - r * 1.02); ctx.lineTo(hx + r * 2.30, hy - r * 1.02);
    ctx.stroke();

    // the sleeve: a pale cuff, gathered, going into the box
    ctx.fillStyle = gray(0xd2); ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(hx, hy, r * 1.06, r * 0.92, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 2.4;
    for (const k of [-0.42, 0, 0.42]) {              // the gathers
      ctx.beginPath();
      ctx.moveTo(hx + k * r * 0.9, hy - r * 0.72);
      ctx.lineTo(hx + k * r * 1.05, hy + r * 0.66);
      ctx.stroke();
    }
    // the gauntlet ring
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.ellipse(hx, hy, r * 0.74, r * 0.62, 0, 0, TAU); ctx.stroke();
    // the port: dark, and empty. Her hands are inside it and are not drawn.
    ctx.fillStyle = gray(0x3c);
    ctx.beginPath(); ctx.ellipse(hx, hy, r * 0.56, r * 0.46, 0, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

/* THE GLOVE (BF-04). A nitrile cuff at the wrist and the hand a shade lighter
   than skin — the powder is on the glove, so the glove has to be a surface the
   powder can sit on. Nothing else changes; it is the same hand underneath. */
function glove(ctx, W, H, at, wristR) {
  const x = at.x * W, y = at.y * H, r = W * 0.030;
  ctx.fillStyle = gray(0xe6); ctx.strokeStyle = INK; ctx.lineWidth = 3.6;
  ctx.beginPath(); ctx.ellipse(x, y + r * 0.1, r * 1.34, r * 1.5, wristR || 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.lineWidth = 2.6;                                  // the rolled cuff
  ctx.beginPath(); ctx.ellipse(x, y + r * 1.28, r * 0.92, r * 0.34, wristR || 0, 0, TAU); ctx.stroke();
}

/* THE SCALES. "like ground metal", and they BRIGHTEN. Deterministic scatter —
   the R2 low-discrepancy pair from the creature kit, because a golden-ratio
   walk on both axes puts every speck on one diagonal. `ink` runs 1..1.9 out of
   transfer(); at rest it is 1. Nothing here ever dims. */
const gr = i => ((i + 1) * 0.6180339887498949) % 1;
const gr2 = i => ((i + 1) * 0.7548776662466927) % 1;
function scales(ctx, W, H, at, n, brightness) {
  const x = at.x * W, y = at.y * H, s = W * 0.034;
  ctx.save();
  // the palm reads a step deeper so the specks have something to be brighter than
  ctx.fillStyle = gray(0xc9);
  ctx.beginPath(); ctx.ellipse(x, y, s * 1.15, s * 1.5, 0.12, 0, TAU); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.9;             // the lines of her palm
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x - s * 0.8, y - s * 0.6 + i * s * 0.55);
    ctx.quadraticCurveTo(x, y - s * 0.3 + i * s * 0.62, x + s * 0.75, y - s * 0.75 + i * s * 0.7);
    ctx.stroke();
  }
  const b = clamp(brightness == null ? 1 : brightness, 0.8, 1.9);
  ctx.fillStyle = PAPER;
  for (let i = 0; i < n; i++) {
    const px = x + (gr(i * 3) - 0.5) * s * 1.9;
    const py = y + (gr2(i * 3) - 0.5) * s * 2.5;
    const rr = (0.055 + 0.035 * gr(i * 7)) * s * b;
    ctx.beginPath(); ctx.ellipse(px, py, rr * 1.6, rr, 0.5, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

/* THE FILM STRIP (BF-31). 8mm: one perforation per frame down one edge. Drawn
   between the two reported hands so the ADVANCE motion moves the frames past
   her fingers rather than moving her fingers. `shift` 0..1 is one frame of
   travel; `index` is which frame is at the gate. */
function filmStrip(ctx, W, H, L, R, adv) {
  const ax = L.x * W, ay = L.y * H, bx = R.x * W, by = R.y * H;
  const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
  const ang = Math.atan2(dy, dx);
  const w = W * 0.052;                                   // strip width
  ctx.save();
  ctx.translate((ax + bx) / 2, (ay + by) / 2); ctx.rotate(ang);
  ctx.fillStyle = gray(0xdd); ctx.strokeStyle = INK; ctx.lineWidth = 3.4;
  ctx.beginPath(); ctx.rect(-len * 0.66, -w / 2, len * 1.32, w); ctx.fill(); ctx.stroke();
  // frames + perforations, marching by `shift`. Never smaller than 4px.
  const pitch = w * 0.86, off = -(adv ? adv.shift : 0) * pitch;
  ctx.lineWidth = 2.4;
  for (let i = -9; i <= 9; i++) {
    const x = i * pitch + off;
    if (Math.abs(x) > len * 0.64) continue;
    ctx.beginPath(); ctx.moveTo(x, -w / 2); ctx.lineTo(x, w / 2); ctx.stroke();
    ctx.fillStyle = gray(0x2e);
    ctx.beginPath(); ctx.rect(x + pitch * 0.30, -w * 0.44, pitch * 0.28, w * 0.17); ctx.fill();
  }
  ctx.restore();
}

/* ---- the asset ---------------------------------------------------------- */
export const asset = {
  id: "character.mara",
  type: "CHARACTER",
  name: "Mara Venn",
  statusWord: "HOLDING",
  scene: "BF-01",

  params: { ...BASE, age: 34, glove: true },
  layers: ["shadow", "legs", "garment", "far-arm", "neck", "head", "face", "near-arm",
           "hair", "glove", "scales", "strip", "box-panel", "ports"],
  anchors: {
    head: { x: .50, y: .20 }, crown: { x: .50, y: .13 }, eyes: { x: .50, y: .21 },
    shoulders: { x: .50, y: .32 }, sternum: { x: .50, y: .44 },
    leftHand: { x: .40, y: .55 }, rightHand: { x: .60, y: .55 },
    hip: { x: .50, y: .61 }, feet: { x: .50, y: .93 },
  },
  states: {
    initial: "sleeves",
    nodes: {
      // BF-03 · HOLD. The baseline, and the card. Her hands are inside the box
      // and therefore not drawn.
      sleeves: { preview: { pose: "mv_sleeves", guise: "gloved", box: true, gaze: { x: 0, y: .22 }, t: .5 } },
      // BF-04 · TRANSFER. The vial half-lowered, the wrist bare to the insect.
      wrist: { preview: { pose: "mv_wrist", guise: "gloved", box: false, gaze: { x: .42, y: .28 }, t: .5 } },
      // BF-07 · TRANSFER. Ungloved, punctured, the scales in the palm lines.
      palm: { preview: { pose: "mv_palm", guise: "bare", box: false, scales: 26, bright: 1, gaze: { x: 0, y: .55 }, t: .5 } },
      // BF-06 · "Delete the path visualization."
      del: { preview: { pose: "mv_delete", guise: "bare", box: false, gaze: { x: -.42, y: .02 }, t: .5 } },
      // BF-31 · ADVANCE. The strip against the fluorescent tube.
      strip: { preview: { pose: "mv_strip", guise: "bare", box: false, strip: true, gaze: { x: .04, y: -.34 }, t: .5 } },
      // BF-37 · seen from inside the maze, holding her breath.
      held: { preview: { pose: "mv_held", guise: "gloved", box: true, gaze: { x: 0, y: .42 }, t: .5 } },
    },
    edges: [["sleeves", "wrist"], ["wrist", "palm"], ["palm", "del"], ["del", "sleeves"],
            ["sleeves", "held"], ["held", "sleeves"], ["del", "strip"], ["strip", "del"]],
  },
  channels: ["gaze", "mouth", "breath", "pose", "guise", "box", "scales", "bright", "strip", "rig"],

  /* ---- MOTIONS ---------------------------------------------------------
     Pure functions of u ∈ [0,1) returning partial draw-state. See
     assets/character/_rig.mjs for the contract. */
  motions: {
    /* BREATH — required of everyone. Open cycle: she is spending something.  */
    breath(u) { return { rig: breathRig(u, { amp: 1, drift: 0.05 }), t: u * 4.1 }; },

    /* HELD BREATH — BF-37, "holding her breath". This is the motion the whole
       character is built around and it is mostly an absence: the chest goes UP
       once, stops, and stays up while everything else keeps going. hold()
       supplies the deniable residue (tilt and weight) so the frame is not
       frozen — MOTION-BRIEF rule 3: "A frozen frame reads as a crash."
       The release at the end is NOT a return: the last frame sits a little
       lower than the first, because she has been doing this for 43 seconds. */
    held_breath(u) {
      const h = hold(u, { dur: 6 });
      const rise = Math.min(1, u / 0.14);              // the inhale, fast
      const give = u < 0.86 ? 0 : (u - 0.86) / 0.14;   // and then a little slips
      return {
        // a motion that names an action carries the pose that action needs, so
        // it composes correctly over any state rather than only over its own
        pose: "mv_held", box: true, guise: "gloved",
        rig: {
          chestLift: 0.30 + 0.62 * rise - 0.18 * give,
          shoulderLiftL: 0.20 + 0.16 * rise, shoulderLiftR: 0.20 + 0.16 * rise,
          shoulderTilt: h.tilt * 0.012,
          pelvisX: h.weight * 0.03,
          headY: -0.02 * rise + 0.05 * give,
        },
        t: u * 6,
      };
    },

    /* ADVANCE — BF-31, "She advanced the strip between her fingers." Quantised
       with dwell, never eased across the join: the eye must register each frame
       as a separate thing. The fingers do not move; the film does. */
    advance_strip(u) {
      const a = advance(u, 8, { dwell: 0.72 });
      return {
        pose: "mv_strip", box: false, guise: "bare",
        strip: true, adv: a,
        // the head lifts by one notch each time a frame settles at the gate
        rig: { headPitch: -0.26 - (a.settled ? 0.02 : 0), gazeY: -0.34 },
        t: u * 5,
      };
    },

    /* THE LOOP OF QUESTIONS — BF-11, the only unit in the world authored
       `loop:true` that has a person in it. "A closed loop of question and
       concession that returns exactly to where it began. Every answer is yes."
       So this ONE cycle of hers is closed — because the text says it closes,
       and because what is looping is not her body but the exchange. She is
       being held inside an apparatus's cycle, which is the difference the
       `closed` argument exists to carry. Her body still drifts underneath it. */
    concession(u) {
      const c = cycle(u, { beats: 4, closed: true });
      const nod = c.beat === 1 || c.beat === 3 ? c.strike : 0;   // "Yes." "Yes."
      return {
        pose: "mv_delete", box: false, guise: "bare",
        rig: { ...breathRig(u, { amp: 0.8, drift: 0.04 }), headPitch: 0.06 + nod * 0.14, gazeX: -0.30 + nod * 0.06 },
        t: u * 4,
      };
    },
  },

  // CARD SIGNATURE — HOLDING: both hands inside the sleeves, nothing left for
  // them to do, the trial 13 seconds past the interval it should have ended in.
  preview: () => ({ pose: "mv_sleeves", guise: "gloved", box: true, gaze: { x: 0, y: .22 }, t: .5,
                    status: "HOLDING", progress: .43 }),

  draw(ctx, W, H, state) {
    const st = state || {};
    const pose = poseWith(st.pose && POSES[st.pose] ? st.pose : "mv_sleeves", st.rig, SCRATCH);
    const r = fig.draw(ctx, W, H, { ...st, pose });
    const a = (r && r.anchors) || {};
    const L = a.leftHand || { x: .40, y: .55 }, R = a.rightHand || { x: .60, y: .55 };
    const head = a.head || { x: .5, y: .21 }, crown = a.crown || { x: .5, y: .14 };

    // hair: the shortest mass the wardrobe draws. The rig's crown cap alone
    // reads bald on a woman; this is the lowest-information fix, not a style.
    // PASS 2: at gray(0x3a) this printed as a solid black slab around the
    // face — the inherited trap, two levels too dark. A dark bob is level 5,
    // not level 7; the ink contour is what makes it read as hair.
    hairMass(ctx, W, H, head, crown, { len: 0.86, fill: gray(0x5e), part: -1 });

    const spec = fig.specAt(st.guise);
    if (spec.glove && !st.box) { glove(ctx, W, H, R); glove(ctx, W, H, L); }
    if (st.scales) scales(ctx, W, H, L, st.scales, st.bright);
    if (st.strip) filmStrip(ctx, W, H, L, R, st.adv);
    if (st.box) ports(ctx, W, H, L, R);
    return r;
  },
};
export default asset;

/* Exported for character.thegirl. BF-40: "She has Mara's face." That is not a
   resemblance the atlas can check and it is not a thing two agents can agree on
   by eye, so the girl imports these values rather than approximating them — the
   same reasoning that makes the broken circle one function. Only the face
   travels; the shoulders do not, because the text gives those to Mara and to
   her grandmother and to no one else. */
export const FACE_OF_MARA = FACE;
export const SKIN_OF_MARA = BASE.skin;
