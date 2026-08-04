/* character.niko — NIKO ALVAREZ, 26. The one who says stop.
   CHARACTER asset for I REMEMBER BEING A BUTTERFLY (B01). 17 units.

   ---------------------------------------------------------------------------
   EVIDENCE.

   THE FACE.
     prose  "The cruelly healthy complexion of someone whose body had not yet
             begun keeping a public account of every private mistake."
   The rig has no skin texture, no jowl, no asymmetry channel worth the name,
   and therefore NO INSTRUMENT for "has not yet begun keeping an account". What
   it has is one step of skin value and the absence of every mark the other
   faces carry. So: SURFACE.skinYoung, mouthAsym fixed at 0 in every pose, no
   browKnit in his baseline, and none of the lid-heaviness Mara and Iona have.
   He is the only face in the cast with nothing on it. That is the whole
   drawing of that sentence and I am flagging that it is thin.

   HE TREATS PROCEDURAL DISTINCTIONS AS MORAL ONES. This is not a mood, it is
   his entire dialogue, so it is in the poses rather than in an expression:
     BF-03  "Stop means stop." / MARA: "It's stopped." / "The odor is stopped."
            / MARA: "That's what I meant." / "No, it isn't."
     BF-05  "Trial 6F-19. Non-completion."
     BF-06  "The path is the record."
     BF-19  "This is exactly how contamination happens."
     BF-21  "Put it down." · "That isn't possible."
     BF-32  "You have to give me something."
   Every one of those is delivered square-on, from a still body, with the hands
   doing something procedural — a switch, a log, a reach for the object. He
   never gestures rhetorically. There is no arms-open pose in this file.

   THE CUP.
     prose  "He carries an orange ceramic cup he never uses; it breaks."
     BF-25  "The orange cup breaks without drama, pieces sliding apart over the
             stone."
     BF-35  "…Niko dropping the orange cup…"
   ORANGE IS A PROBLEM AND THE BRIEF ALREADY WARNED ABOUT IT: "A blue accent
   mark prints black — the post pass quantizes by luminance. Accents are
   semantic." So the cup is not drawn orange; it is drawn at the one tone
   nothing else in the cast occupies, mid-level, between the pale ceramics of
   the laboratory and the ink. It is the only object he holds and it is the
   only mid value on his body, so it separates at contact-sheet size, which is
   what the colour was for.

   OTHER BUSINESS.
     BF-06  "Niko discovers a loose wire and cannot yet tell whether it is live."
     BF-25  "Niko shoves the crash bar."
     BF-31  "She drops the film. Niko catches it. He lifts it to the light and
             sees only the glasshouse."

   SILENT. Height, build, hair, clothing, and everything about his face except
   the complexion. He gets the same laboratory garment as Mara — the palette's
   lightest closed one — because they work in the same room and the text
   distinguishes them by nothing visible. Flagged, not decided.
   ---------------------------------------------------------------------------
   OVERPAINT, declared: the cup (and its three pieces after the break), and the
   loose wire. Both placed from reported hand anchors.
*/
import { gray, INK, PAPER } from "../../engine/halfworld-engine.mjs";
import { POSES } from "../../engine/figure-hero.mjs";
import { makeGuiseFigure } from "../../engine/guise.mjs";
import { cycle, brk } from "../../engine/motion.mjs";
import { SURFACE, poseWith, P, breathRig } from "./_rig.mjs";

const TAU = Math.PI * 2;
const SCRATCH = "nk__frame";

/* ---- the one body ------------------------------------------------------- */
const BASE = {
  skin: SURFACE.skinYoung,     // the complexion; see header
  hairColor: SURFACE.hairMid,   // PASS 2: hairDark printed as a black cap
  hair: "short", beard: false, glasses: false, cloak: false,
  garment: SURFACE.lab, bareLegs: false,
  sleeve: "short",             // the one thing that separates his silhouette
                               // from Mara's: her forearms live inside box
                               // sleeves, his do not. Not a characterisation —
                               // a consequence of who puts their hands in the box.
  shoe: SURFACE.shoeLab,
  scale: 1.03,
};

/* The cup is the only surface change the text gives him, and it is a change by
   subtraction: he carries it through 24 units without using it and then it is
   in pieces on the stone. Carried on the spec so guise blending snaps it. */
const fig = makeGuiseFigure(BASE, {
  carrying: { cup: true },
  empty: { cup: false },
}, { id: "niko" });

/* ---- poses -------------------------------------------------------------- */
/* Level, unmarked, symmetrical. mouthAsym is 0 in every pose in this file and
   that is deliberate — see the header. */
const FACE = { smile: 0, frown: 0, browUp: 0.06, browKnit: 0, eyeNarrow: 0, mouthAsym: 0, jaw: 0 };

// BF-05 — "Trial 6F-19. Non-completion." Square to the room, weight even, the
// cup held at waist height in the left hand where it has been all morning.
P("nk_procedural", {
  ...FACE,
  spineLean: 0, headPitch: -0.02, chestLift: 0.14,
  armLUpper: 0.60, armLLower: -0.84, handRotL: 0.24,
  armRUpper: -0.16, armRLower: 0.10,
  hipL: 0.02, hipR: -0.02, kneeL: 0.03, kneeR: 0.03,
}, ["relaxed", "relaxed"]);

// BF-03 — "Niko presses the manual switch." / "Stop means stop." The arm goes
// out to the wall, flat-handed. Everything else stays exactly where it was.
P("nk_stop", {
  ...FACE, browUp: 0.12,
  armRUpper: -1.32, armRLower: 0.16, handRotR: 0.10,
  armLUpper: 0.60, armLLower: -0.84, handRotL: 0.24,
  headYaw: 0.22, gazeX: 0.30, shoulderLiftR: 0.16,
}, ["relaxed", "stop"]);

// BF-06 — the loose wire, held away from the body by two fingers, because he
// "cannot yet tell whether it is live". The body leans AWAY from his own hand.
P("nk_wire", {
  ...FACE, browUp: 0.20, eyeWide: 0.22,
  spineLean: 0.16, bodyYaw: -0.14, headYaw: 0.34, gazeX: 0.44, headPitch: 0.20,
  armRUpper: -1.06, armRLower: 0.52, handRotR: -0.24,
  armLUpper: 0.28, armLLower: -0.88,
  shoulderLiftR: 0.24,
}, ["relaxed", "point"]);

// BF-19 — "Niko reaches for the canister. Mara moves it away from him." The
// reach is procedural, not greedy: forearm level, palm up, elbow in.
P("nk_reach", {
  ...FACE,
  spineLean: -0.14, bodyYaw: -0.16, headYaw: 0.12, gazeX: 0.24, gazeY: 0.18,
  armRUpper: -1.14, armRLower: 0.66, handRotR: 0.14,
  armLUpper: 0.30, armLLower: -0.94, handRotL: 0.24,
}, ["relaxed", "palm_up"]);

// BF-25 — "Niko shoves the crash bar." Both hands out, shoulders behind them,
// one step of weight forward. The cup is already gone.
P("nk_crashbar", {
  ...FACE, browKnit: 0.30, eyeNarrow: 0.20, jaw: 0.18,
  spineLean: -0.34, chestLift: 0.30,
  armLUpper: 1.02, armLLower: -1.30, handRotL: -0.10,
  armRUpper: -1.02, armRLower: 1.30, handRotR: 0.10,
  shoulderLiftL: 0.24, shoulderLiftR: 0.24,
  hipL: 0.22, kneeL: 0.16, hipR: -0.10, weightShift: 0.4, pelvisX: -0.12,
}, ["stop", "stop"]);

// BF-31 — "He lifts it to the light and sees only the glasshouse." Both hands
// up, chin lifted, and nothing in his face, because there is nothing there.
P("nk_lifting", {
  ...FACE,
  headPitch: -0.30, neckPitch: -0.14, gazeY: -0.38,
  armLUpper: 1.10, armLLower: -1.18, handRotL: 0.18,
  armRUpper: -1.06, armRLower: 1.14, handRotR: -0.18,
  shoulderLiftL: 0.28, shoulderLiftR: 0.28,
}, ["point", "point"]);

/* ---- overpaint ---------------------------------------------------------- */

/* THE CUP. Squat, thick-walled, a handle. Held, never raised to the mouth —
   see motions.cup_untouched. `lift` 0..1 is how far off its resting height it
   has got; it never reaches 1 in any motion in this file. */
function cup(ctx, W, H, at, lift = 0) {
  const x = at.x * W, y = at.y * H - W * 0.052 * lift;
  const r = W * 0.044, h = r * 1.55;   // PASS 2: at 0.031 it disappeared into the pelvis
  ctx.save();
  ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.lineJoin = "round"; ctx.lineCap = "round";
  // handle, behind the body of the cup
  ctx.beginPath(); ctx.arc(x + r * 1.02, y + h * 0.02, r * 0.56, -1.15, 1.15); ctx.stroke();
  // the cup: a truncated cone, wider at the lip
  ctx.fillStyle = gray(0x9a);
  ctx.beginPath();
  ctx.moveTo(x - r, y - h / 2); ctx.lineTo(x + r, y - h / 2);
  ctx.lineTo(x + r * 0.80, y + h / 2); ctx.lineTo(x - r * 0.80, y + h / 2);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // the lip: the glaze catches, one pale ellipse, and it is always full-height
  ctx.fillStyle = gray(0xd6); ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(x, y - h / 2, r, r * 0.34, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.restore();
}

/* AFTER. "pieces sliding apart over the stone" — three pieces, no dust, no
   radiating cracks, no drama. They slide; `spread` 0..1 carries them apart. */
function shards(ctx, W, H, at, spread = 1) {
  const x = at.x * W, y = at.y * H, r = W * 0.044, s = spread;
  ctx.save();
  ctx.fillStyle = gray(0x9a); ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.lineJoin = "round";
  const piece = (dx, dy, rot, w2, h2) => {
    ctx.save(); ctx.translate(x + dx * s, y + dy * s * 0.4); ctx.rotate(rot);
    ctx.beginPath();
    ctx.moveTo(-w2, -h2 * 0.5); ctx.lineTo(w2 * 0.8, -h2); ctx.lineTo(w2, h2 * 0.6);
    ctx.lineTo(-w2 * 0.6, h2 * 0.4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  };
  piece(-r * 2.4, r * 0.2, -0.32, r * 0.86, r * 0.52);
  piece(r * 0.3, r * 0.5, 0.18, r * 0.72, r * 0.44);
  piece(r * 2.6, -r * 0.1, 0.62, r * 0.60, r * 0.40);
  ctx.restore();
}

/* THE LOOSE WIRE (BF-06). Two conductors, stripped, held by the insulation
   only. Whether it is live is not drawable and must not be implied — no spark,
   no glow, no arc. It is a wire in a hand and the not-knowing is his pose. */
function wire(ctx, W, H, at) {
  const x = at.x * W, y = at.y * H;
  ctx.save();
  ctx.strokeStyle = INK; ctx.lineCap = "round"; ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x, y); ctx.quadraticCurveTo(x + W * 0.05, y + H * 0.05, x + W * 0.015, y + H * 0.105);
  ctx.quadraticCurveTo(x - W * 0.02, y + H * 0.15, x + W * 0.03, y + H * 0.19);
  ctx.stroke();
  ctx.strokeStyle = gray(0xb0); ctx.lineWidth = 2.4;                 // the copper, bare
  ctx.beginPath();
  ctx.moveTo(x - W * 0.006, y - H * 0.014); ctx.lineTo(x - W * 0.001, y - H * 0.036);
  ctx.moveTo(x + W * 0.008, y - H * 0.013); ctx.lineTo(x + W * 0.016, y - H * 0.034);
  ctx.stroke();
  ctx.restore();
}

/* ---- the asset ---------------------------------------------------------- */
export const asset = {
  id: "character.niko",
  type: "CHARACTER",
  name: "Niko Alvarez",
  statusWord: "PROCEDURE",
  scene: "BF-02",

  params: { ...BASE, age: 26, cup: true },
  layers: ["shadow", "legs", "garment", "far-arm", "neck", "head", "face", "near-arm",
           "cup", "wire", "shards"],
  anchors: {
    head: { x: .50, y: .20 }, crown: { x: .50, y: .13 }, eyes: { x: .50, y: .21 },
    sternum: { x: .50, y: .44 }, cup: { x: .40, y: .56 },
    leftHand: { x: .40, y: .56 }, rightHand: { x: .60, y: .56 },
    hip: { x: .50, y: .61 }, feet: { x: .50, y: .93 },
  },
  states: {
    initial: "procedural",
    nodes: {
      // BF-05 · the log entry. Baseline, and the card.
      procedural: { preview: { pose: "nk_procedural", guise: "carrying", gaze: { x: 0, y: .04 }, t: .5 } },
      // BF-03 · the manual switch. "Stop means stop."
      stop: { preview: { pose: "nk_stop", guise: "carrying", gaze: { x: .30, y: 0 }, t: .5 } },
      // BF-06 · the loose wire, held away from the body.
      wire: { preview: { pose: "nk_wire", guise: "carrying", wire: true, gaze: { x: .44, y: .20 }, t: .5 } },
      // BF-19 · reaching for the canister.
      reach: { preview: { pose: "nk_reach", guise: "carrying", gaze: { x: .24, y: .18 }, t: .5 } },
      // BF-25 · the crash bar. The cup is on the stone in three pieces.
      crashbar: { preview: { pose: "nk_crashbar", guise: "empty", shards: true, gaze: { x: 0, y: .06 }, t: .5 } },
      // BF-31 · lifting the strip to the light and seeing only the glasshouse.
      lifting: { preview: { pose: "nk_lifting", guise: "empty", gaze: { x: 0, y: -.38 }, t: .5 } },
    },
    edges: [["procedural", "stop"], ["stop", "procedural"], ["procedural", "wire"],
            ["wire", "procedural"], ["procedural", "reach"], ["reach", "procedural"],
            ["reach", "crashbar"], ["crashbar", "lifting"], ["lifting", "procedural"]],
  },
  channels: ["gaze", "mouth", "breath", "pose", "guise", "cup", "lift", "wire", "shards", "rig"],

  /* ---- MOTIONS --------------------------------------------------------- */
  motions: {
    breath(u) { return { rig: breathRig(u, { amp: 1, drift: 0.04 }), t: u * 4.1 }; },

    /* THE CUP HE NEVER USES. Four beats: the hand starts to raise it, the
       forearm turns, it stops at two thirds, it goes back down. It never
       arrives. The cycle is OPEN — MOTION-BRIEF: "Never animate a living thing
       as a closed cycle" — and its drift is the cup ending each revolution a
       little lower than it started, which is what carrying something for four
       hours actually looks like. `lift` never exceeds 0.66 in any frame, and
       that ceiling is the whole characterisation. */
    cup_untouched(u) {
      const c = cycle(u, { beats: 4, closed: false, drift: 0.10 });
      const raise = c.beat === 0 ? c.strike : c.beat === 1 ? 1 : c.beat === 2 ? 1 - c.strike : 0;
      const lift = raise * 0.66 - c.wear * 0.5;   // the ceiling. It never arrives.
      return {
        cup: true, lift,
        rig: {
          ...breathRig(u, { amp: 0.9, drift: 0.04 }),
          armLLower: -0.84 - lift * 0.36,
          handRotL: 0.24 + lift * 0.10,
          // the head does NOT come down to meet it. It never occurs to him.
          headPitch: -0.02,
        },
        t: u * 4,
      };
    },

    /* BREAK — declared, per MOTION-BRIEF rule 4. ONE instant, at u = 0.42:
       the cup leaves his hand. Before: carried, at rest. After: three pieces
       on the stone and two empty hands on the crash bar. There is no in-between
       frame and there must not be one — "The orange cup breaks WITHOUT DRAMA."
       This is the only discontinuity in this module. */
    drop(u) {
      const b = brk(u, 0.42);
      if (b.before) {
        return { pose: "nk_procedural", guise: "carrying", cup: true, lift: 0.12,
                 rig: breathRig(u, { amp: 0.9, drift: 0.04 }), t: u * 4 };
      }
      return {
        pose: "nk_crashbar", guise: "empty", shards: true,
        // the pieces slide apart over the stone and then stop. They do not
        // bounce, spin, or ring.
        spread: Math.min(1, b.sinceBreak * 2.2),
        rig: { ...breathRig(u, { amp: 1.1, drift: 0.04 }), spineLean: -0.34 + 0.06 * b.sinceBreak },
        t: u * 4,
      };
    },
  },

  // CARD SIGNATURE — PROCEDURE: square to the room, cup at waist height, the
  // trial logged as a non-completion.
  preview: () => ({ pose: "nk_procedural", guise: "carrying", gaze: { x: 0, y: .04 }, t: .5,
                    status: "PROCEDURE", progress: .19 }),

  draw(ctx, W, H, state) {
    const st = state || {};
    const pose = poseWith(st.pose && POSES[st.pose] ? st.pose : "nk_procedural", st.rig, SCRATCH);
    const r = fig.draw(ctx, W, H, { ...st, pose });
    const a = (r && r.anchors) || {};
    const L = a.leftHand || { x: .40, y: .56 }, R = a.rightHand || { x: .60, y: .56 };

    const spec = fig.specAt(st.guise);
    const hasCup = st.cup != null ? st.cup : spec.cup;
    if (hasCup) cup(ctx, W, H, L, st.lift || 0);
    if (st.wire) wire(ctx, W, H, R);
    if (st.shards) shards(ctx, W, H, { x: .30, y: .935 }, st.spread == null ? 1 : st.spread);
    return r;
  },
};
export default asset;
