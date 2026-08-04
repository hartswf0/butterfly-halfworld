/* ============================================================
   assets/character/_rig.mjs — private support for the five human CAST modules
   (mara, niko, iona, elise, thegirl). Nothing else imports it. Named with a
   leading underscore following the repo's own precedent, assets/creature/_kit.mjs
   and assets/set/_kit.mjs.

   IT EXISTS FOR TWO REASONS, both of them "so the seven belong to one world".

   1. THE TONE LADDER. BUILD-BRIEF trap 1: "Everything comes out 2–3 ink levels
      too dark on a first draft. Prefer light planes with dark accents; plenty
      of paper must show." Five agents' worth of independently chosen greys is
      how a cast stops looking like one hand drew it, so the laboratory's
      surfaces are enumerated once, here, and every human takes their garment
      values out of this table. The register is the brief's: "a laboratory, a
      converted textile mill, and a rearing facility behind a paper warehouse.
      Cold surfaces: acrylic, stainless steel, plastic sheeting, tile, waxed
      paper, rust, fluorescent tube."

   2. MOTION CANNOT REACH THE RIG WITHOUT IT. figure-hero's draw() lets a
      caller override the FACE from state (smile, browUp, eyeWide, jaw, gaze,
      blink…) and nothing else. Every postural channel — chestLift, spineLean,
      headPitch, the arm angles — is authored in the pose and is unreachable
      from outside. But MOTION-BRIEF requires each character to export cycles
      that are pure functions of u returning RIG STATE, and a breath that
      cannot move a chest is not a breath.

      poseWith() is the bridge: it merges a motion's channel deltas into a copy
      of the pose and registers it under a private scratch id on figure-hero's
      POSES singleton, immediately before the draw that consumes it. The write
      is a pure function of (baseId, rig), the read happens on the next line,
      and nothing else in the world uses these ids — so it stays deterministic
      and frame n still renders without frame n−1 having existed.

   THE MOTION CONTRACT, stated once and obeyed by all seven modules:

      asset.motions[name](u) -> a partial draw-state, u ∈ [0,1)

      Spread it over a state node's preview to get the frame:
        st = { ...asset.states.nodes[s].preview, ...asset.motions[m](u) }
      Anything under `rig` is merged into the pose by poseWith(); everything
      else is ordinary state. PURE: no Date.now(), no module-level mutation
      that outlives the call, no reading of the previous frame.
   ============================================================ */
import { POSES } from "../../engine/figure-hero.mjs";
import { gray } from "../../engine/halfworld-engine.mjs";

/* ---- the cast's shared surfaces ----------------------------------------
   Kept LIGHT on purpose. The darkest value any of the five wears is Iona's
   navy coat, and it is the only one, because it is the only garment colour the
   text actually names ("a small woman in a navy coat", BF-17). */
export const SURFACE = {
  // skin. Two values only: a working adult under fluorescent tube, and Niko's
  // "cruelly healthy complexion of someone whose body had not yet begun
  // keeping a public account of every private mistake" — which in a world of
  // eight ink levels is one step lighter and nothing else.
  skin: "#e0dacd",
  skinYoung: "#e9e3d8",
  skinOld: "#ded9cf",
  // laboratory clothing. The text never describes what Mara or Niko wear; the
  // rig requires a value, so they get the lightest closed garment the palette
  // has ("dress" -> #9a9a92) and the choice is flagged in both modules rather
  // than dressed up as characterisation.
  lab: "dress",
  // the one dark garment in the cast, and the only one the text names
  navy: gray(0x4a),
  navyDeep: gray(0x33),
  // hair
  hairDark: "#2a2a28",
  // PASS 2: the rig paints hair as one solid mass, so a "dark" hair colour
  // prints as a level-7 slab on top of the head. Dark hair in this world is a
  // level 5; the ink contour is what makes it hair.
  hairMid: "#4e4b46",
  hairWhite: "#e2e0da",
  // hardware and objects: acrylic, steel, waxed paper, ceramic, rust
  acrylic: gray(0xe8),
  steel: gray(0xa6),
  waxed: gray(0xdc),
  rust: gray(0x8c),
  shoeLab: "#3a3a36",
};

/* ---- poseWith --------------------------------------------------------
   baseId  a pose id already registered on POSES
   rig     { channel: value } from a motion, or null
   tag     a private scratch id, one per module, so two characters animating in
           the same frame cannot overwrite each other's scratch pose.
   Returns the pose id to hand to the figure. */
export function poseWith(baseId, rig, tag) {
  const src = POSES[baseId] || POSES.neutral_front;
  if (!rig) return src.id;
  POSES[tag] = { id: tag, label: tag, group: "scratch", n: { ...src.n, ...rig }, opt: src.opt || {} };
  return tag;
}

/* ---- registerPose ----------------------------------------------------
   Thin wrapper so every module registers poses the same way marjorie.mjs does,
   and so a module never has to know POSES' internal record shape. */
export function P(id, n, hands, group = "cast") {
  POSES[id] = { id, label: id, group, n, opt: hands ? { hands } : {} };
  return id;
}

/* ---- breath ----------------------------------------------------------
   Every character in this world exports `breath`, and there is no reason for
   five different sine amplitudes. This is the shape of it: chest rises, head
   settles a hair behind it, and the whole thing is small enough to be deniable
   — liveness.mjs' own finding, "you should not be able to point at the motion;
   you should only notice that the figure is not a cut-out."

   `closed:false` with a small drift, always, for every living body. That is
   MOTION-BRIEF's one theme-carrying number: "Never animate a living thing as a
   closed cycle." A breath that returned exactly to its first state would be
   the apparatus, not the animal.  */
export function breathRig(u, { amp = 1, drift = 0.05, lead = 0 } = {}) {
  const p = ((u + lead) % 1 + 1) % 1;
  const s = Math.sin(p * Math.PI * 2);
  const wear = drift * u;                     // open cycle: the body is spending something
  return {
    chestLift: (0.26 + 0.30 * (0.5 + 0.5 * s)) * amp - wear * 0.4,
    headY: -0.035 * s * amp + wear * 0.10,
    shoulderTilt: 0.012 * Math.sin(p * Math.PI * 2 + 1.7) * amp,
  };
}

export const RIG_SUPPORT_VERSION = "cast-rig/1.0.0";
