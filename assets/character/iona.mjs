/* character.iona — IONA ASH. Very old. The one who brought the film.
   CHARACTER asset for I REMEMBER BEING A BUTTERFLY (B01). 8 units, and she is
   in the photograph in two more.

   ---------------------------------------------------------------------------
   EVIDENCE.

   THE COAT AND THE FACE. BF-17, her entrance, is the only physical description
   of anyone in the whole corpus:
     "A small woman in a navy coat with a flattened fur collar, holding a
      grocery bag darkened at the bottom. Lavender protrudes from it in a thick
      bundle. She looks not up the stairs but at their reflection in the glass
      door. Her face has an unfinished quality — expressions arriving before
      the features can contain them."
     prose  white hair cut bluntly below the ears; under the coat a grey dress
            with a narrow white collar "belonging to another period or to no
            period at all"; the skin deeply lined, "but the expressions moving
            beneath it quick, almost juvenile, arriving before the features
            could contain them."

   THE LAST SENTENCE IS AN ANIMATION NOTE, NOT A DESCRIPTION, and it is the
   reason this module exists in a world that animates. A still frame cannot
   hold "arriving before the features could contain them" — the arrival and the
   containment are two times. So it is a MOTION: `expression_early` samples her
   expressive channels ahead of her postural ones by a fixed lead, and the head,
   neck and jaw catch up afterwards. In every frame of that cycle the face and
   the expression disagree, which is what an unfinished quality is.

   THE SCAR.
     BF-22  "Iona catches Mara's wrist. Her hand is unexpectedly strong. At the
             base of her thumb is a scar: a broken circle crossed by a crooked
             line."
   It is drawn by assets/_broken-circle.mjs, which draws it from the points
   engine/motion.mjs' brokenCircle() returns — the same call that draws the
   wing marking, the flight trace, the pen mark and the new paint. Not a
   similar shape. The same array.

   HER AGE. The text never gives a number. What it gives:
     BF-10  the photograph's reverse: "ASTER HOUSE / AUGUST 1945 / IONA, ELISE,
            THOMAS", and one of the figures is a child.
     BF-26  "Iona is fast for perhaps twenty paces. Then her body remembers its
            age."
   A child in August 1945, alive in a contemporary story, is somewhere near
   ninety. spec.age = 88 is INFERRED, not stated, and it is the only inferred
   number in this file; it drives elderProportion()'s kyphosis, narrowed
   shoulders and raised head-share, which is the whole of what the rig can say
   about an old body. If the setting date is ever fixed, change this one number.

   WHAT SHE SAYS is not drawable and is not drawn: BF-22's three sentences about
   watching the film, BF-27's "Marking is not memory", BF-29's "I remembered it."
   She is never given a knowing look. Her face does the arriving-early thing and
   nothing else, because that is the only expressive fact in the text.

   SILENT. Her build below the coat, her shoes, her hands apart from the scar,
   and her hair's texture. Blunt-cut and white are given; the rest is the
   wardrobe module's shortest mass.
   ---------------------------------------------------------------------------
   OVERPAINT, declared: the flattened fur collar, the narrow white collar under
   it, the grocery bag with the lavender, and the scar. The scar and the collar
   are silhouette-relevant and cannot come out of the rig; the bag is an object.
*/
import { gray, INK, PAPER } from "../../engine/halfworld-engine.mjs";
import { POSES } from "../../engine/figure-hero.mjs";
import { makeGuiseFigure } from "../../engine/guise.mjs";
import { hairFall } from "../../engine/acres-wardrobe.mjs";
import { cycle, hold } from "../../engine/motion.mjs";
import { paintMark } from "../_broken-circle.mjs";
import { SURFACE, poseWith, P, breathRig } from "./_rig.mjs";

const TAU = Math.PI * 2;
const SCRATCH = "io__frame";

/* ---- the one body ------------------------------------------------------- */
const BASE = {
  skin: SURFACE.skinOld,
  hairColor: SURFACE.hairWhite,
  hair: "short", beard: false, glasses: false, cloak: false,
  /* THE NAVY COAT. PASS 2 dropped this from "robe" (#565651) to "tunic"
     (#8a8a83). At robe she printed as one solid black mass from the collar to
     the shoe — the inherited trap in its purest form, and it also cost her the
     coat's own shape, because a silhouette with no interior tone has no seams,
     no hem and no fur collar. Navy is still the darkest garment in the cast at
     this level; what changed is that there is paper inside it now. */
  garment: "tunic",
  bareLegs: false,
  sleeve: "long",              // a winter coat has sleeves to the wrist
  shoe: "#3a3a36",
  scale: 0.86,                 // "a small woman", BF-17
  age: 88,                     // INFERRED — see header. Drives elderProportion().
};

/* Two guises. The coat is what the world sees; the grey dress with the narrow
   white collar is what is under it, and the text bothers to say that it belongs
   "to another period or to no period at all", which is a fact about her and not
   about the weather. Same body, two surfaces. */
const fig = makeGuiseFigure(BASE, {
  coat: { garment: "tunic", coated: true },
  dress: { garment: "dress", coated: false },
}, { id: "iona" });

/* ---- poses -------------------------------------------------------------- */
/* Her baseline face carries NO expression, on purpose: the expression is what
   arrives, and it arrives from the motion layer. A neutral base is what gives
   `expression_early` something to be early against. */
const FACE = { smile: 0, frown: 0, browUp: 0, browKnit: 0, eyeNarrow: 0.10, jaw: 0 };

// BF-17 — the lobby. Bag in the left hand, weight on one hip, and she is not
// looking up the stairs; she is looking at the reflection in the glass door,
// which is behind the camera and slightly to the side.
P("io_lobby", {
  ...FACE,
  headYaw: -0.42, neckYaw: -0.20, gazeX: -0.56, headPitch: -0.06,
  armLUpper: 0.14, armLLower: 0.06, handRotL: 0.06,       // the bag hangs
  armRUpper: -0.20, armRLower: 0.14,
  weightShift: 0.5, pelvisX: 0.16, hipL: 0.12, hipR: -0.04,
}, ["fist", "relaxed"]);

// BF-22 — "Iona catches Mara's wrist. Her hand is unexpectedly strong." The
// arm goes out fast and low and the hand closes. Nothing else in her moves;
// the strength is in one hand, which is the whole point of the sentence.
P("io_wrist", {
  ...FACE, browUp: 0.24, eyeWide: 0.18,
  bodyYaw: -0.18, headYaw: 0.30, gazeX: 0.40,
  armRUpper: -1.24, armRLower: 0.42, handRotR: -0.20,
  armLUpper: 0.16, armLLower: 0.10,
  shoulderLiftR: 0.30, spineLean: -0.10,
}, ["relaxed", "fist"]);

// BF-18 — "I brought you the film." Both hands forward, offering the canister,
// which belongs to the prop layer and is not drawn here.
P("io_offering", {
  ...FACE, browUp: 0.10,
  spineLean: -0.08, headPitch: 0.10, gazeY: 0.16,
  armRUpper: -0.94, armRLower: 0.72, handRotR: 0.10,
  armLUpper: 0.86, armLLower: -0.66, handRotL: -0.10,
}, ["palm_up", "offering"]);

// BF-26 — twenty paces. A walk pose; the decay is in the motion, not here.
P("io_paces", {
  ...FACE, browUp: 0.16, jaw: 0.10,
  walkSpeed: 1, spineLean: -0.16, headPitch: -0.04,
  armLUpper: 0.30, armRUpper: -0.30,
}, ["relaxed", "relaxed"]);

// BF-27 — the bag has split; her hands are empty and she is looking down at
// lavender across the pavement, and at a butterfly that is not afraid of it.
P("io_spilled", {
  ...FACE,
  headPitch: 0.42, neckPitch: 0.18, gazeY: 0.52,
  armLUpper: 0.22, armLLower: -0.18, armRUpper: -0.22, armRLower: 0.18,
  spineLean: -0.06,
}, ["relaxed", "relaxed"]);

/* ---- overpaint ---------------------------------------------------------- */

/* THE FUR COLLAR, FLATTENED BY AGE. Not fluffy — flattened is the adjective and
   it is doing work: this is a good coat that has been worn for decades. So the
   scallops are shallow and wide and the whole band is thin. */
function furCollar(ctx, W, H, neck, head) {
  /* PASS 2. Placed at the neck anchor it landed on her JAW and read as a
     muzzle — the elder proportion curve shortens the neck by a third, so the
     rig's neck anchor sits under the chin on her and nowhere near a collar.
     It is offset down onto the shoulder line and narrowed. */
  const cx = neck.x * W, cy = neck.y * H + H * 0.030, w = W * 0.082, h = H * 0.020;
  ctx.save();
  ctx.fillStyle = gray(0xa8); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(cx - w, cy + h * 0.5);
  const n = 7;
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = cx - w + t * w * 2;
    const y = cy - h * (0.35 + 0.30 * Math.sin(t * Math.PI));   // shallow, flattened
    ctx.quadraticCurveTo(x - w / n * 0.5, y - h * 0.30, x, y);
  }
  ctx.lineTo(cx + w, cy + h * 0.75);
  // PASS 3: the lower edge dips to a V at the throat, so the collar reads as
  // something worn round a neck rather than as a bib laid on a chest.
  ctx.quadraticCurveTo(cx + w * 0.42, cy + h * 1.05, cx, cy + h * 1.85);
  ctx.quadraticCurveTo(cx - w * 0.42, cy + h * 1.05, cx - w, cy + h * 0.75);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // pile: short ink ticks, thinned where it has been crushed by fifty winters
  ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.lineCap = "round";
  for (let i = 0; i < 11; i++) {
    const t = i / 10, x = cx - w * 0.92 + t * w * 1.84;
    const len = h * (0.30 + 0.22 * Math.sin(t * 5.1));
    ctx.beginPath(); ctx.moveTo(x, cy + h * 0.18); ctx.lineTo(x, cy + h * 0.18 - len); ctx.stroke();
  }
  ctx.restore();
}

/* THE NARROW WHITE COLLAR of the grey dress. Two small points at the throat,
   at PAPER, "belonging to another period or to no period at all". It is narrow;
   drawn any wider it becomes a costume and the sentence stops being true. */
function narrowCollar(ctx, W, H, neck) {
  const cx = neck.x * W, cy = neck.y * H + H * 0.006, w = W * 0.040, h = H * 0.030;
  ctx.save();
  ctx.fillStyle = PAPER; ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.lineJoin = "round";
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + s * w * 0.10, cy);
    ctx.lineTo(cx + s * w, cy + h * 0.18);
    ctx.lineTo(cx + s * w * 0.34, cy + h);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

/* THE GROCERY BAG, darkened at the bottom, with the lavender bundle.
   LAVENDER IS A SMELL AND MUST NEVER BE DRAWN PURPLE (BUILD-BRIEF §1). It is
   drawn as what it physically is: straight woody stems and a dense spike of
   small buds, in ink and one light tone. The darkening at the bottom of the
   bag is the wet — it is the only tonal event on the paper. */
function bagOfLavender(ctx, W, H, at) {
  const x = at.x * W, y = at.y * H, w = W * 0.088, h = H * 0.115;
  ctx.save();
  // the bag
  ctx.fillStyle = gray(0xdc); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x - w * 0.52, y); ctx.lineTo(x + w * 0.52, y);
  ctx.lineTo(x + w * 0.46, y + h); ctx.lineTo(x - w * 0.46, y + h);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // darkened at the bottom
  ctx.save(); ctx.beginPath();
  ctx.moveTo(x - w * 0.49, y + h * 0.58); ctx.quadraticCurveTo(x, y + h * 0.48, x + w * 0.49, y + h * 0.60);
  ctx.lineTo(x + w * 0.46, y + h); ctx.lineTo(x - w * 0.46, y + h); ctx.closePath();
  ctx.clip(); ctx.fillStyle = gray(0x8a); ctx.fillRect(x - w, y, w * 2, h * 1.2); ctx.restore();
  ctx.strokeStyle = INK; ctx.lineWidth = 2.6;
  ctx.beginPath(); ctx.moveTo(x - w * 0.49, y + h * 0.58); ctx.quadraticCurveTo(x, y + h * 0.48, x + w * 0.49, y + h * 0.60); ctx.stroke();
  // the bundle: stems out of the mouth of the bag, thick, all one way
  const n = 9;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), sx = x + (t - 0.5) * w * 0.80;
    const lean = (t - 0.5) * w * 0.62, len = h * (0.62 + 0.16 * Math.sin(t * 4.2));
    ctx.strokeStyle = gray(0x4e); ctx.lineWidth = 3.6; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(sx, y + h * 0.06); ctx.lineTo(sx + lean, y - len); ctx.stroke();
    // the spike: five small buds, geometry, never a colour
    ctx.fillStyle = gray(0x76); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    for (let k = 0; k < 5; k++) {
      const kt = k / 4;
      const bx = sx + lean * (0.82 + kt * 0.18), by = y - len - kt * h * 0.085;
      ctx.beginPath(); ctx.ellipse(bx, by, w * 0.026, w * 0.017, 0.2, 0, TAU); ctx.fill(); ctx.stroke();
    }
  }
  ctx.restore();
}

/* THE SCAR. Same points as the wing, the pen mark and the paint. On a hand at
   full-figure size it is about twenty pixels across, which is at the edge of
   what the dot lattice will hold — hence the `scar` state, which frames the
   hand alone at a size where the world's central shape is legible. */
function thumbScar(ctx, W, H, at, size, rot) {
  const s = size == null ? W * 0.036 : size;
  paintMark(ctx, { x: at.x * W - s / 2, y: at.y * H - s / 2, w: s, h: s }, {
    segs: ["ring", "stroke"], rot: rot == null ? -0.35 : rot,
    ink: gray(0x50), lw: Math.max(1.8, s * 0.055), under: PAPER,
  });
}

/* The `scar` state: her hand and forearm alone, at a size where the mark holds.
   Precedent for a CHARACTER asset that is a framing rather than a figure is
   character.mona in the sibling world, whose entire asset is a wall plate. */
function handClose(ctx, W, H) {
  const cx = W * 0.50, cy = H * 0.52, R = W * 0.30;
  ctx.save();
  // forearm in coat sleeve, entering from below left
  ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.lineCap = "round";
  ctx.strokeStyle = INK; ctx.lineWidth = R * 0.86 + 9;
  ctx.beginPath(); ctx.moveTo(cx - R * 1.5, cy + R * 1.5); ctx.lineTo(cx - R * 0.30, cy + R * 0.42); ctx.stroke();
  ctx.strokeStyle = gray(0x56); ctx.lineWidth = R * 0.86;
  ctx.beginPath(); ctx.moveTo(cx - R * 1.5, cy + R * 1.5); ctx.lineTo(cx - R * 0.30, cy + R * 0.42); ctx.stroke();
  // the hand: ONE closed silhouette, the law figure-hero draws hands under
  ctx.fillStyle = SURFACE.skinOld; ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(cx - R * 0.58, cy + R * 0.52);
  ctx.quadraticCurveTo(cx - R * 0.86, cy - R * 0.20, cx - R * 0.42, cy - R * 0.72);
  ctx.quadraticCurveTo(cx + R * 0.10, cy - R * 1.06, cx + R * 0.62, cy - R * 0.72);
  ctx.quadraticCurveTo(cx + R * 1.00, cy - R * 0.34, cx + R * 0.86, cy + R * 0.18);
  ctx.quadraticCurveTo(cx + R * 0.60, cy + R * 0.86, cx + R * 0.02, cy + R * 0.82);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // the thumb, a lobe merged into the same contour
  ctx.beginPath();
  ctx.moveTo(cx - R * 0.56, cy + R * 0.30);
  ctx.quadraticCurveTo(cx - R * 1.18, cy + R * 0.10, cx - R * 1.26, cy - R * 0.44);
  ctx.quadraticCurveTo(cx - R * 1.10, cy - R * 0.78, cx - R * 0.76, cy - R * 0.56);
  ctx.quadraticCurveTo(cx - R * 0.50, cy - R * 0.10, cx - R * 0.40, cy + R * 0.30);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // knuckle creases and the tendon line — an old hand, not a young one
  ctx.strokeStyle = gray(0x8a); ctx.lineWidth = 3;
  for (let i = 0; i < 3; i++) {
    const t = i / 2;
    ctx.beginPath();
    ctx.moveTo(cx - R * 0.10 + t * R * 0.60, cy - R * 0.58 + t * R * 0.16);
    ctx.lineTo(cx - R * 0.02 + t * R * 0.66, cy + R * 0.06 + t * R * 0.10);
    ctx.stroke();
  }
  ctx.restore();
  // and the mark, at the base of the thumb, where the text puts it
  thumbScar(ctx, W, H, { x: 0.335, y: 0.505 }, W * 0.20, -0.30);
}

/* ---- the asset ---------------------------------------------------------- */
export const asset = {
  id: "character.iona",
  type: "CHARACTER",
  name: "Iona Ash",
  statusWord: "EARLY",
  scene: "BF-17",

  params: { ...BASE, coat: "navy", collar: "fur, flattened", hairCut: "blunt, below the ears" },
  layers: ["shadow", "legs", "coat", "far-arm", "neck", "collar-white", "collar-fur",
           "head", "face", "near-arm", "hair", "bag", "scar"],
  anchors: {
    head: { x: .50, y: .22 }, crown: { x: .50, y: .15 }, eyes: { x: .50, y: .23 },
    neck: { x: .50, y: .34 }, sternum: { x: .50, y: .45 },
    leftHand: { x: .38, y: .60 }, rightHand: { x: .62, y: .60 },
    scar: { x: .62, y: .60 }, bag: { x: .34, y: .62 },
    hip: { x: .50, y: .63 }, feet: { x: .50, y: .93 },
  },
  states: {
    initial: "lobby",
    nodes: {
      // BF-17 · the lobby, the bag, the reflection in the glass door.
      lobby: { preview: { pose: "io_lobby", guise: "coat", bag: true, gaze: { x: -.56, y: 0 }, t: .5 } },
      // BF-22 · catching the wrist. The scar is on this hand.
      wrist: { preview: { pose: "io_wrist", guise: "coat", bag: false, scar: true, gaze: { x: .40, y: .06 }, t: .5 } },
      // BF-18 · "I brought you the film."
      offering: { preview: { pose: "io_offering", guise: "coat", bag: false, gaze: { x: 0, y: .16 }, t: .5 } },
      // BF-26 · twenty paces, and then not.
      paces: { preview: { pose: "io_paces", guise: "coat", bag: false, gaze: { x: .10, y: -.04 }, t: .5 } },
      // BF-27 · the bag has split; lavender across the pavement.
      spilled: { preview: { pose: "io_spilled", guise: "coat", bag: false, gaze: { x: 0, y: .52 }, t: .5 } },
      // the coat open: the grey dress and the narrow white collar underneath.
      dress: { preview: { pose: "io_lobby", guise: "dress", bag: false, gaze: { x: -.30, y: 0 }, t: .5 } },
      // BF-22 close: her hand alone, at a size where the mark is legible.
      scar: { preview: { view: "hand" } },
    },
    edges: [["lobby", "offering"], ["offering", "wrist"], ["wrist", "scar"], ["scar", "wrist"],
            ["lobby", "paces"], ["paces", "spilled"], ["spilled", "lobby"], ["lobby", "dress"]],
  },
  channels: ["gaze", "mouth", "breath", "pose", "guise", "bag", "scar", "view", "rig"],

  /* ---- MOTIONS --------------------------------------------------------- */
  motions: {
    /* BREATH. BF-13: "For several seconds there is only breathing — a larger
       rhythm, rough and receding, like water dragged over stone." That beat is
       the phone, and the voice that follows it is hers; attributing the breath
       to Iona is INFERENCE and is flagged as such. It shapes it: slower than
       the cast's 4.1s, and asymmetric — the intake is short and the release is
       long and does not finish. */
    breath(u) {
      const s = Math.sin(u * TAU);
      const rough = 0.12 * Math.sin(u * TAU * 3 + 1.1);      // the drag over stone
      return {
        rig: {
          chestLift: 0.22 + 0.26 * (0.5 + 0.5 * Math.pow(Math.max(0, s), 0.6)) + rough * 0.06 - 0.05 * u,
          headY: -0.028 * s, shoulderTilt: 0.010 * Math.sin(u * TAU + 1.7),
        },
        t: u * 5.6,
      };
    },

    /* EXPRESSION_EARLY — the required one, and the reason this character is
       different from every other character in the cast.

         "the skin deeply lined, but the expressions moving beneath it quick,
          almost juvenile, ARRIVING BEFORE THE FEATURES COULD CONTAIN THEM."

       Two clocks. The EXPRESSION runs at u + LEAD; the FACE — the head, the
       neck, the jaw, the whole carriage that would ordinarily arrive with it —
       runs at u. LEAD is 0.085 of the cycle, which at 12fps and a 4-second
       cycle is four frames: long enough to see the disagreement, short enough
       that it reads as her rather than as a sync error.

       There is no frame in this cycle where the face and the expression agree,
       and that is the point. Do not "fix" it by setting LEAD to 0. */
    expression_early(u) {
      const LEAD = 0.085;
      const e = ((u + LEAD) % 1 + 1) % 1;                     // the expression's clock
      // the expression: three arrivals per cycle, quick and juvenile
      const pulse = (p) => Math.max(0, Math.sin(p * TAU * 3));
      const early = pulse(e), late = pulse(u);
      return {
        // face channels, which figure-hero lets state override directly
        browUp: 0.44 * early,
        eyeWide: 0.30 * early,
        smile: 0.22 * early,
        mouthAsym: 0.34 * early,
        // and the features, arriving after, still on the old clock
        rig: {
          ...breathRig(u, { amp: 0.85, drift: 0.05 }),
          headPitch: -0.05 - 0.12 * late,
          headRoll: 0.09 * late,
          neckRoll: 0.04 * late,
          jaw: 0.16 * late,
        },
        t: u * 4,
      };
    },

    /* TWENTY PACES — BF-26, "Iona is fast for perhaps twenty paces. Then her
       body remembers its age."

       This is NOT a seamless loop and must not be treated as one: it is a
       one-shot open cycle over twenty beats, and its last frame is nothing
       like its first, which is the whole content of the sentence. `wear` from
       cycle(closed:false) does the remembering: stride amplitude, chest lift
       and speed all fall away from pace ~11 and the spine gives up its lean. */
    twenty_paces(u) {
      const c = cycle(u, { beats: 20, closed: false, drift: 1.0 });
      const q = c.beat + c.within;                            // paces elapsed, 0..20
      const fresh = 1 - Math.max(0, (q - 10) / 10) ** 1.5;    // the body remembering
      const swing = Math.sin(q * Math.PI) * fresh;
      return {
        pose: "io_paces", bag: false,
        rig: {
          walkSpeed: fresh,
          hipL: 0.46 * swing, hipR: -0.46 * swing,
          kneeL: 0.50 * Math.max(0, -swing), kneeR: 0.50 * Math.max(0, swing),
          armLUpper: 0.30 - 0.30 * swing, armRUpper: -0.30 + 0.30 * swing,
          rootY: -0.030 * Math.abs(swing),
          spineLean: -0.18 * fresh,
          chestLift: 0.20 + 0.50 * (1 - fresh),               // and then she is breathing
          headPitch: -0.04 + 0.22 * (1 - fresh),
          shoulderLiftL: 0.20 * (1 - fresh), shoulderLiftR: 0.20 * (1 - fresh),
        },
        browUp: 0.30 * (1 - fresh), jaw: 0.10 + 0.24 * (1 - fresh),
        t: u * 8,
      };
    },
  },

  // CARD SIGNATURE — EARLY: the lobby, the coat, the bag, and a face two frames
  // ahead of itself.
  preview: () => ({ pose: "io_lobby", guise: "coat", bag: true, gaze: { x: -.56, y: 0 }, t: .5,
                    status: "EARLY", progress: .55 }),

  draw(ctx, W, H, state) {
    const st = state || {};
    if (st.view === "hand") { handClose(ctx, W, H); return { anchors: { scar: { x: .335, y: .505 } } }; }

    const pose = poseWith(st.pose && POSES[st.pose] ? st.pose : "io_lobby", st.rig, SCRATCH);
    const r = fig.draw(ctx, W, H, { ...st, pose });
    const a = (r && r.anchors) || {};
    const head = a.head || { x: .5, y: .22 }, crown = a.crown || { x: .5, y: .15 };
    const neck = a.neck || { x: .5, y: .34 };
    const L = a.leftHand || { x: .38, y: .60 }, R = a.rightHand || { x: .62, y: .60 };
    const spec = fig.specAt(st.guise);

    if (!spec.coated) narrowCollar(ctx, W, H, neck);
    if (spec.coated) furCollar(ctx, W, H, neck, head);
    /* white, cut bluntly below the ears. PASS 2 switched from hairMass to
       hairFall: the annulus is a set bob and on a head this size it printed as
       a white bonnet with a hard rim, which is a different garment. hairFall
       leaves the rig's own crown cap (already white) and hangs two blunt falls
       to just below the ear, which is the cut the text specifies. */
    hairFall(ctx, W, H, head, crown, { len: 1.02, fill: SURFACE.hairWhite });
    if (st.bag) bagOfLavender(ctx, W, H, { x: L.x, y: L.y + 0.005 });
    if (st.scar) thumbScar(ctx, W, H, R);
    return r;
  },
};
export default asset;
