/* ============================================================================
   assets/character/_face.mjs — THE CLOSE-UP PUPPET.

   figure-hero draws a whole body and gives its head a radius of forty to
   seventy-five pixels. At the MESH pipeline's 3.4px dot pitch that is a mouth
   about twelve dots wide and, at full gape, eleven dots tall. Eleven dots is
   enough to say A MOUTH IS OPEN. It is not enough to say WHICH SHAPE, and the
   difference between those two is the difference between a face that is
   speaking and a face that is chewing.

   So this is a second head, built for one job: to be the only thing in the
   frame while someone says one sentence. At the CLOSE framing the head radius
   is about 300px — the mouth is sixty dots across and the aperture up to forty
   — and at that size the lattice can carry articulation. Everything below is
   an argument about what to spend those dots on.

   ---------------------------------------------------------------------------
   THE ONE ANATOMICAL FACT THIS FILE IS ORGANISED AROUND.

       THE UPPER LIP BELONGS TO THE SKULL.
       THE LOWER LIP RIDES THE JAW.

   Almost every bad lip-sync in the world draws a mouth as a single shape that
   grows and shrinks about its own centre. Real speech is not symmetrical: the
   maxilla does not move, ever, and the mandible swings about an axis through
   the ears. When you say "ah", your top lip stays exactly where it was and your
   chin travels. A mouth that opens symmetrically reads as a hole in a mask.

   Which means the JAW is not a mouth parameter here — it is a bone. It rotates
   a real mandible: the chin drops, the face lengthens, the jawline swings back,
   the cheek follows, and the lower lip and the chin move TOGETHER because they
   are attached to the same bone. The mouth aperture is a CONSEQUENCE of that
   rotation, not a drawing of it.

   The silhouette is therefore computed per frame as ONE closed path — cranium
   (fixed) joined to mandible (rotated) — and filled and contoured once. Two
   overlapping shapes would print a seam across the cheek, and in a world whose
   entire identity is hard contour, a spurious contour is not a small error.

   ---------------------------------------------------------------------------
   WHAT GETS DOTS, AND WHAT DOES NOT.

   BUILD-BRIEF trap 5 is the dot floor: detail finer than the lattice does not
   become subtle, it becomes noise, and then it becomes nothing. At R=300 the
   floor is roughly 12px — anything thinner than that is a gamble. So:

     SPENT ON     the mouth (60 dots wide), the eyes and their lids, the brows,
                  the jawline, and for Iona the four deep lines the text names.
     NOT DRAWN    skin texture, eyelashes, individual hair strands, iris detail
                  beyond a pupil and one catchlight, lip vermilion borders as
                  separate strokes from the lip mass.

   BUILD-BRIEF trap 1 is that everything comes out two to three levels too dark.
   A face is mostly paper. The skin plane is a light tone, the contour does the
   work, and the only near-black in the frame is the inside of the mouth — which
   is correct, and useful, because it means the aperture is the darkest thing on
   screen and the eye goes straight to it.

   ---------------------------------------------------------------------------
   PURE. drawCloseup() is a function of (spec, state) and nothing else.
   ========================================================================= */

import { INK, PAPER, gray, inkLevel, clamp, clamp01, lerp, shade } from "../../engine/halfworld-engine.mjs";
import { SURFACE } from "./_rig.mjs";

const TAU = Math.PI * 2;
const sm = (t) => { t = clamp01(t); return t * t * (3 - 2 * t); };

/* ============================================================================
   THE FACES.

   Five heads that must be told apart at a glance, in silhouette, in eight ink
   levels, with no colour. Every value below is either taken from the character
   module's own BASE spec (skin, hair, colour, age) or is a proportion invented
   here — and the invented ones are marked, because a close-up is the first
   thing in this world that has ever needed a cheekbone.

   The proportions are a small budget deliberately: `faceW`, `jawW`, `chin`,
   `brow`, `eyeGap` and `nose`. Six numbers is enough to separate five people
   and few enough that no one of them can be tuned into a caricature. The
   distinguishing marks that actually carry recognition at contact-sheet size
   are the HAIR MASS and the JAW WIDTH, which is why those two are the widest
   spread in the table.
   ========================================================================= */
export const FACES = {
  /* MARA. "You have her shoulders" is the only physical claim the text makes
     about her, and it is about her frame, not her face. So her face is the
     cast's neutral — every other head in the table is a departure from this
     one — and the recognition is carried where the text put it. THE GIRL
     imports this skin because "She has Mara's face."  */
  mara: {
    skin: SURFACE.skin, hair: "short", hairColor: SURFACE.hairDark, hairMass: 0.92,
    faceW: 1.00, jawW: 0.86, chin: 1.00, brow: 1.00, eyeGap: 1.00, nose: 1.00,
    lip: 1.00, age: 34, lines: 0.10, glasses: false, collar: "lab",
  },
  /* NIKO. "the cruelly healthy complexion of someone whose body had not yet
     begun keeping a public account of every private mistake." In eight ink
     levels a complexion is one step lighter and nothing else — his module says
     so — and the rest of that sentence is an AGE claim, so it is spent on a
     face with no lines in it and a jaw that has not yet set. */
  niko: {
    skin: SURFACE.skinYoung, hair: "short", hairColor: SURFACE.hairMid, hairMass: 1.05,
    faceW: 0.96, jawW: 0.98, chin: 1.06, brow: 1.12, eyeGap: 0.97, nose: 1.06,
    lip: 0.92, age: 24, lines: 0.02, glasses: false, collar: "lab",
  },
  /* IONA. The only face the text describes: "white hair cut bluntly below the
     ears"; "the skin deeply lined, but the expressions moving beneath it quick,
     almost juvenile, arriving before the features could contain them."

     The lines are drawn — four of them, at the dot floor's width, no more —
     because "deeply lined" is a fact about her surface. But the second half of
     that sentence is the one that matters and it is NOT drawn here: it is a
     motion, expression_early, authored in her own module. This file only has to
     leave room for it, which it does by giving her the cast's most mobile brow
     and the widest expressive range, on a face that reads as ninety at rest. */
  iona: {
    skin: SURFACE.skinOld, hair: "bob", hairColor: SURFACE.hairWhite, hairMass: 1.10,
    faceW: 0.90, jawW: 0.76, chin: 0.92, brow: 0.84, eyeGap: 1.03, nose: 1.10,
    lip: 0.82, age: 88, lines: 1.00, glasses: false, collar: "coat",
  },
  /* ELISE. Seen only in a 1945 photograph and heard once in voice-over. She
     gets a face because BF-34 gives her a line, and a face built from the one
     thing the photograph establishes — that she stood next to Iona as a child.
     Family resemblance, at the distance of eighty years: Iona's proportions
     without Iona's age. Everything here is INFERRED and none of it is stated. */
  elise: {
    skin: SURFACE.skin, hair: "long", hairColor: gray(0x6a), hairMass: 1.16,
    faceW: 0.92, jawW: 0.78, chin: 0.94, brow: 0.88, eyeGap: 1.02, nose: 1.06,
    lip: 0.90, age: 30, lines: 0.16, glasses: false, collar: "period",
  },
  /* THE GIRL. "She has Mara's face." So: Mara's table, with the one
     transformation a child's skull actually is — a larger cranium, a smaller
     jaw, eyes lower and further apart, no brow ridge. That is not a stylistic
     softening; it is the neotenous proportion, and it is what makes a child
     read as a child rather than as a small adult. */
  thegirl: {
    skin: SURFACE.skin, hair: "short", hairColor: "#3d3a34", hairMass: 0.86,
    faceW: 1.03, jawW: 0.72, chin: 0.86, brow: 0.72, eyeGap: 1.10, nose: 0.82,
    lip: 1.06, age: 8, lines: 0.00, glasses: false, collar: "dress", child: true,
  },
};

/* Which face speaks a given script cue. The script's speaker labels carry
   parentheticals the cast list does not — "IONA (V.O.)", "PROJECTED MARA" —
   and two of them are deliberately NOT faces. See FACELESS below. */
export const SPEAKER_FACE = {
  "MARA": "mara", "NIKO": "niko", "IONA": "iona", "ELISE": "elise", "THE GIRL": "thegirl",
  "PROJECTED MARA": "mara",
};
/* A close-up is a claim that a body is in the room making this sound. Three
   speakers in this film are not: VO is the butterfly, and (V.O.)/(O.S.) are
   by definition somewhere the camera is not. Cutting to a face for those would
   be a lie about where the voice is coming from, and the film's whole subject
   is testimony from a witness that cannot be checked. They keep the wide loop. */
export const FACELESS = (who) => /^VO$/.test(who) || /\((V\.O\.|O\.S\.)\)/.test(who);

/* ============================================================================
   THE HEAD
   ========================================================================= */

/* ---- the mandible ------------------------------------------------------
   One rotation, applied to every point below the condyle line. Points above it
   are the cranium and do not move — that is the whole content of the function.

   The excursion: at jaw=1 the chin travels 0.52R, which on a head whose nasion
   -to-chin distance is about 1.5R works out near a 35% gape. That is a wide but
   real "ah"; anything past it is a yawn, and the sampler never asks for it
   because VISEMES.AH tops out at 0.92. */
const CONDYLE_Y = 0.20;                 // where the hinge sits, in R, below centre
function hinge(p, jaw) {
  if (p.y <= CONDYLE_Y) return p;
  const d = p.y - CONDYLE_Y;
  return {
    x: p.x * (1 - 0.11 * jaw),          // the jaw narrows a little as it drops
    y: CONDYLE_Y + d * (1 + 0.52 * jaw),
  };
}

/* ---- the canon of proportion --------------------------------------------
   PASS 2. The first head put the eyes at -0.10R on a silhouette spanning
   -1.05R to +1.26R — a fifth of a head radius ABOVE the true middle. Every
   drawing manual since Dürer says the same thing and it is not a convention,
   it is a measurement: THE EYES SIT HALFWAY DOWN THE HEAD. People
   systematically place them too high because the cranium above them is hidden
   under hair and the brain discounts what it cannot see.

   The cost was not subtle. Putting the eyes high lengthens everything below
   them, so the first contact sheet came back with five long-jawed mannequins
   and I read it as "the jaw is too long" — which it was not. The jaw was
   right; the eyes were wrong. These five numbers are the fix, and every
   feature below is placed off them rather than off the frame. */
const EYE_Y = 0.02;      // halfway down a silhouette spanning -1.10 .. +1.16
const NOSE_Y = 0.46;     // brow-to-chin thirds: eyes, nose base, chin
const MOUTH_Y = 0.70;    // a third of the way from nose base to chin
const HAIRLINE = -0.56;
const CHIN_Y = 1.16;

/* ---- the silhouette ----------------------------------------------------
   Returned as one array of points, in R units, centred on the skull. Built
   left temple -> over the crown -> right temple -> down the right mandible ->
   chin -> back up the left. Filled once, contoured once.  */
function silhouette(F, jaw) {
  const w = F.faceW, jw = F.jawW, ch = F.chin;
  const child = F.child ? 1 : 0;
  const cr = 1.06 + 0.10 * child;                       // cranium height
  /* PASS 5. jawW was an absolute multiplier, so a narrow jaw (The Girl at 0.70)
     put the gonion 0.43R inside the cheekbone across only 0.32R of drop. The
     curve through those two points overshoots and the head comes out as an
     ANVIL — a bulging cheek with a step under it — which on the contact sheet
     read as hair, and sent me twice into the hair code. It was never the hair.
     It was a cliff in the silhouette, and it only appeared on the three faces
     whose jaws are narrow, which is exactly the pattern I misread as a styling
     bug.

     So the jaw is now a PROPORTION OF THE FACE (0.55..0.95 of the cheekbone),
     the taper gets an intermediate point to travel through, and no face can
     express a jaw the curve cannot round. Five heads still separate; none of
     them can produce a cliff. */
  const gon = w * (0.55 + 0.40 * jw);                    // gonion, as a share of the cheek
  const man = w * (0.40 + 0.38 * jw);                    // mandible body
  const jut = w * (0.18 + 0.28 * jw);                    // the chin's own width
  const raw = [
    { x: -0.98 * w, y: -0.16 },                          // left temple
    { x: -0.92 * w, y: -0.60 },
    { x: -0.62 * w, y: -1.00 * cr },
    { x: 0.00, y: -1.10 * cr },                          // crown
    { x: 0.62 * w, y: -1.00 * cr },
    { x: 0.92 * w, y: -0.60 },
    { x: 0.98 * w, y: -0.16 },                           // right temple
    { x: 0.99 * w, y: 0.16 },                            // right zygoma
    { x: (0.99 * w + gon) / 2, y: 0.38 },                // the taper's own point
    { x: gon, y: 0.62 },                                 // right gonion
    { x: man, y: 0.92 },                                 // right mandible body
    { x: jut, y: 1.08 * ch },
    { x: 0.00, y: CHIN_Y * ch },                         // chin
    { x: -jut, y: 1.08 * ch },
    { x: -man, y: 0.92 },
    { x: -gon, y: 0.62 },
    { x: -(0.99 * w + gon) / 2, y: 0.38 },
    { x: -0.99 * w, y: 0.16 },
  ];
  return raw.map((p) => hinge(p, jaw));
}

/* smooth closed path through points (Catmull-Rom -> bezier). A polygon here
   would print sixteen corners on a face; a face has none. */
function closedCurve(g, pts, S) {
  const n = pts.length, P = (i) => pts[(i % n + n) % n];
  g.beginPath();
  g.moveTo(P(0).x * S.x, P(0).y * S.y);
  for (let i = 0; i < n; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    g.bezierCurveTo(
      (p1.x + (p2.x - p0.x) / 6) * S.x, (p1.y + (p2.y - p0.y) / 6) * S.y,
      (p2.x - (p3.x - p1.x) / 6) * S.x, (p2.y - (p3.y - p1.y) / 6) * S.y,
      p2.x * S.x, p2.y * S.y);
  }
  g.closePath();
}

/* ============================================================================
   drawCloseup(g, spec, st, geom)

   g     stage-space context (the scene has already scaled W/NW)
   spec  one entry of FACES
   st    { jaw, wide, press, teeth, tongue,            <- from engine/speech
           blink, gazeX, gazeY, browUp, browKnit,
           headYaw, headPitch, headRoll, chest, smile, frown }
   geom  { cx, cy, R }   R is the head half-width in stage pixels
   ========================================================================= */
export function drawCloseup(g, spec, st, { cx, cy, R }) {
  const F = spec;
  const jaw = clamp01(st.jaw || 0);
  const wide = clamp(st.wide || 0, -1, 1);
  const press = clamp01(st.press || 0);
  const yaw = clamp(st.headYaw || 0, -0.9, 0.9);
  const pitch = clamp(st.headPitch || 0, -0.5, 0.5);

  /* tones. Light planes, dark accents, plenty of paper — trap 1. */
  const SKIN = F.skin;
  const SKIN_D = shade(F.skin, -44);              // the one shading plane: under the jaw
  const HAIR = F.hairColor;
  const LIP = shade(F.skin, -46);
  const MOUTH = inkLevel(7);
  const TEETH = inkLevel(0);
  const TONGUE = inkLevel(4);
  const GARMENT = F.collar === "coat" ? SURFACE.navy
    : F.collar === "period" ? gray(0x9e) : F.collar === "dress" ? gray(0xb6) : gray(0x9a);

  /* contour weights, held ABOVE the dot floor. At R=300 the MESH lattice is
     ~3.4px; a 4px line (figure-hero's default) is one dot and prints as a
     dotted line. These are 2-3 dots and hold. */
  const LWa = Math.max(5, R * 0.026);             // silhouette
  const LWb = Math.max(4, R * 0.018);             // features
  const LWc = Math.max(3, R * 0.011);             // age lines, creases

  const sx = 0.80 + 0.20 * Math.cos(yaw);          // foreshortening
  const fx = Math.sin(yaw) * R * 0.26;             // features shift with the turn
  const S = { x: R * sx, y: R };
  const py = pitch * R * 0.10;

  g.save();
  g.translate(cx, cy);
  g.rotate(st.headRoll || 0);
  g.lineJoin = "round"; g.lineCap = "round";

  /* ---- 1. shoulders and neck, behind everything ------------------------- */
  const chest = (st.chest || 0.3);
  const NKW = 0.26 + 0.14 * F.jawW;      // a neck under a narrow jaw is a narrow neck
  const shY = R * (1.72 - 0.05 * chest);
  g.fillStyle = SKIN;
  g.strokeStyle = INK; g.lineWidth = LWa;
  g.beginPath();                                  // neck: a column, not a stalk
  g.moveTo(-R * NKW * sx, R * 0.62);
  g.bezierCurveTo(-R * (NKW + .02) * sx, R * 1.16, -R * (NKW + .06) * sx, R * 1.40, -R * (NKW + .10) * sx, shY);
  g.lineTo(R * (NKW + .10) * sx, shY);
  g.bezierCurveTo(R * (NKW + .06) * sx, R * 1.40, R * (NKW + .02) * sx, R * 1.16, R * NKW * sx, R * 0.62);
  g.closePath(); g.fill(); g.stroke();
  // the shadow the jaw casts on the neck: the single tone step that tells you
  // the head is in front of the body rather than pasted onto it
  g.fillStyle = SKIN_D;
  g.beginPath();
  g.moveTo(-R * (NKW + .01) * sx, R * 0.70);
  g.bezierCurveTo(-R * 0.18, R * (1.14 + jaw * 0.46), R * 0.18, R * (1.14 + jaw * 0.46), R * (NKW + .01) * sx, R * 0.70);
  g.lineTo(R * (NKW + .07) * sx, R * 1.62); g.lineTo(-R * (NKW + .07) * sx, R * 1.62);
  g.closePath(); g.fill();

  g.fillStyle = GARMENT; g.strokeStyle = INK; g.lineWidth = LWa;
  g.beginPath();
  g.moveTo(-R * 2.4, R * 2.6);
  g.bezierCurveTo(-R * 1.5, shY - R * 0.06, -R * 0.86, shY + R * 0.10, -R * 0.50 * sx, shY);
  g.lineTo(R * 0.50 * sx, shY);
  g.bezierCurveTo(R * 0.86, shY + R * 0.10, R * 1.5, shY - R * 0.06, R * 2.4, R * 2.6);
  g.closePath(); g.fill(); g.stroke();
  if (F.collar === "coat") {                       // the flattened fur collar, BF-17
    g.strokeStyle = INK; g.lineWidth = LWb;
    g.beginPath();
    g.moveTo(-R * 1.22, shY + R * 0.30); g.bezierCurveTo(-R * 0.70, shY + R * 0.02,
      -R * 0.56, shY + R * 0.02, -R * 0.50 * sx, shY + R * 0.16);
    g.moveTo(R * 1.22, shY + R * 0.30); g.bezierCurveTo(R * 0.70, shY + R * 0.02,
      R * 0.56, shY + R * 0.02, R * 0.50 * sx, shY + R * 0.16);
    g.stroke();
  } else if (F.collar === "lab" || F.collar === "period") {
    g.strokeStyle = INK; g.lineWidth = LWb;
    g.beginPath();
    g.moveTo(-R * 0.52 * sx, shY + R * 0.06); g.lineTo(-R * 0.16, shY + R * 0.62);
    g.moveTo(R * 0.52 * sx, shY + R * 0.06); g.lineTo(R * 0.16, shY + R * 0.62);
    g.stroke();
  }

  /* ---- 2. hair behind the head ------------------------------------------
     PASS 2. The first version drew the back mass as an ellipse sitting on top
     of the skull and the front as a strip along the hairline, and the two of
     them together printed a BERET. The fault was that neither piece went down
     PAST THE EARS: hair that stops at temple height is a hat, whatever shape
     you give it, because the eye reads the boundary between hair and skin at
     the side of the head, not the one across the forehead.

     So the back mass now descends to at least the ear on every style, and the
     three styles differ by how far past it they go — which is also the only
     thing the text ever says about anyone's hair ("cut bluntly below the
     ears"). */
  const hm = F.hairMass;
  const drop = F.hair === "bob" ? 0.94 : F.hair === "long" ? 1.90 : 0.30;
  if (F.hair !== "bald") {
    /* PASS 3. Drawing this as two side pieces put a contoured shape OUTSIDE the
       skull on each cheek — earmuffs on Iona, a scalloped chin-strap on the
       others — because a piece of hair authored beside a head has an edge on
       the inside as well as the outside, and the inside one lands on the face.

       One mass, behind everything, with no inside edge at all: the head is
       drawn over it and decides for itself how much hair shows. The only
       parameter is how far down it descends, which is also the only thing the
       text ever says about hair — "cut bluntly below the ears". */
    /* PASS 4. Even as one mass it kept printing a contour on the cheek — but
       only on the three faces with a NARROW jaw (Iona 0.76, The Girl 0.70,
       Mara 0.86) and never on Niko at 0.98. That is the whole diagnosis: the
       mass was authored at skull width and the skull is at its widest at the
       temple, so on a face that tapers below the cheekbone a sliver of hair
       protrudes past the jaw and gets stroked. It looked like a hairstyle
       decision. It was a jaw width.

       Short hair therefore draws NO back mass at all — the crown in step 9
       already covers the skull down past the temple, and anything more can
       only stick out. Hair that hangs (bob, long) keeps its mass, reshaped so
       the widest point is high and the hem tucks inward. */
    if (drop > 0.4) {
      g.fillStyle = HAIR; g.strokeStyle = INK; g.lineWidth = LWa;
      g.beginPath();
      g.moveTo(-R * 1.04 * hm * sx, -R * 0.50);
      g.bezierCurveTo(-R * 1.14 * hm * sx, -R * 0.06, -R * 1.02 * hm * sx, R * (drop * 0.72),
        -R * 0.72 * sx, R * drop);
      g.lineTo(R * 0.72 * sx, R * drop);
      g.bezierCurveTo(R * 1.02 * hm * sx, R * (drop * 0.72), R * 1.14 * hm * sx, -R * 0.06,
        R * 1.04 * hm * sx, -R * 0.50);
      g.bezierCurveTo(R * 1.10 * hm * sx, -R * 1.26, -R * 1.10 * hm * sx, -R * 1.26,
        -R * 1.04 * hm * sx, -R * 0.50);
      g.closePath(); g.fill(); g.stroke();
    }
  }

  /* ---- 3. ears ----------------------------------------------------------- */
  for (const es of [-1, 1]) {
    if (Math.abs(yaw) > 0.55 && es * Math.sin(yaw) < 0) continue;
    g.fillStyle = SKIN; g.strokeStyle = INK; g.lineWidth = LWb;
    g.beginPath();
    g.ellipse(es * R * 0.95 * F.faceW * sx + fx * 0.2, R * 0.04, R * 0.115, R * 0.205, 0, 0, TAU);
    g.fill(); g.stroke();
  }

  /* ---- 4. the head: cranium + mandible as ONE contour -------------------- */
  const sil = silhouette(F, jaw);
  g.fillStyle = SKIN; g.strokeStyle = INK; g.lineWidth = LWa;
  closedCurve(g, sil, S); g.fill(); g.stroke();

  /* the jaw's own shading plane — under the mandible, and it GROWS as the jaw
     drops, which is the cue that reads at contact-sheet size even when the
     mouth itself is too small to parse */
  if (jaw > 0.08) {
    g.save(); closedCurve(g, sil, S); g.clip();
    g.fillStyle = SKIN_D;
    g.beginPath();
    g.moveTo(-R * 0.84 * sx, R * (0.62 + 0.30 * jaw));
    g.bezierCurveTo(-R * 0.40, R * (1.30 + 0.44 * jaw), R * 0.40, R * (1.30 + 0.44 * jaw),
      R * 0.84 * sx, R * (0.62 + 0.30 * jaw));
    g.lineTo(R * 0.84 * sx, R * 2.4); g.lineTo(-R * 0.84 * sx, R * 2.4);
    g.closePath(); g.globalAlpha = 0.9; g.fill(); g.globalAlpha = 1;
    g.restore();
  }

  /* ---- 5. eyes and brows -------------------------------------------------
     Placed on the SKULL, so they do not move with the jaw. */
  const eyeY = R * EYE_Y + py;
  const eyeDx = R * 0.37 * F.eyeGap * sx;
  const blink = clamp01(st.blink || 0);
  const open = clamp(1 - blink * 1.35 + (st.eyeWide || 0) * 0.4 - (st.eyeNarrow || 0) * 0.6, 0.04, 1.4);
  const browUp = st.browUp || 0, browKnit = st.browKnit || 0;

  for (const es of [-1, 1]) {
    if (Math.abs(yaw) > 0.7 && es * Math.sin(yaw) < 0) continue;
    const ex = fx + es * eyeDx;
    const ew = R * 0.245 * (F.child ? 1.08 : 1), eh = R * 0.175 * open;
    // white almond
    g.fillStyle = inkLevel(0); g.strokeStyle = INK; g.lineWidth = LWc;
    g.beginPath();
    g.moveTo(ex - ew, eyeY);
    g.quadraticCurveTo(ex - ew * 0.12, eyeY - eh * 1.25, ex + ew, eyeY);
    g.quadraticCurveTo(ex + ew * 0.14, eyeY + eh * 0.90, ex - ew, eyeY);
    g.closePath(); g.fill();
    if (open > 0.14) {
      g.save(); g.clip();
      g.fillStyle = INK;
      const px = ex + (st.gazeX || 0) * R * 0.075 + Math.sin(yaw) * R * 0.045;
      const pyy = eyeY + (st.gazeY || 0) * R * 0.060 + R * 0.012;
      g.beginPath(); g.arc(px, pyy, R * 0.082, 0, TAU); g.fill();
      g.fillStyle = inkLevel(0);
      g.beginPath(); g.arc(px - R * 0.028, pyy - R * 0.030, R * 0.024, 0, TAU); g.fill();
      g.restore();
    }
    // the upper lid: the heaviest stroke on the face after the silhouette
    g.strokeStyle = INK; g.lineWidth = LWb * 1.15;
    g.beginPath();
    g.moveTo(ex - ew, eyeY);
    g.quadraticCurveTo(ex - ew * 0.12, eyeY - eh * 1.25, ex + ew, eyeY);
    g.stroke();
    // the socket. One line above the lid, following it at a distance. Without
    // it the eye is a shape lying ON the face; with it the eye is set INTO a
    // skull, and that is the whole difference between a mask and a head.
    if (!F.child) {
      g.lineWidth = LWc;
      g.beginPath();
      g.moveTo(ex - ew * 0.86, eyeY - eh * 0.55 - R * 0.055);
      g.quadraticCurveTo(ex - ew * 0.05, eyeY - eh * 1.35 - R * 0.070,
        ex + ew * 0.92, eyeY - eh * 0.30 - R * 0.040);
      g.stroke();
    }
    // a lower lid line only on the old face; on a young one it reads as fatigue
    if (F.lines > 0.4) {
      g.lineWidth = LWc;
      g.beginPath();
      g.moveTo(ex - ew * 0.8, eyeY + eh * 0.9);
      g.quadraticCurveTo(ex, eyeY + eh * 1.5, ex + ew * 0.85, eyeY + eh * 0.7);
      g.stroke();
    }
    // brow
    const inner = ex + es * ew * 0.92, outer = ex - es * ew * 1.02;
    const base = eyeY - R * 0.31 * F.brow - browUp * R * 0.15;
    g.lineWidth = Math.max(LWb, R * 0.075 * (F.lines > 0.4 ? 0.62 : 1));
    g.strokeStyle = INK;
    g.beginPath();
    g.moveTo(inner, base + browKnit * R * 0.11);
    g.quadraticCurveTo(ex, base - R * 0.055 - browUp * R * 0.02, outer, base + R * 0.012);
    g.stroke();
  }

  /* ---- 6. nose ------------------------------------------------------------
     PASS 2. The first nose was a full-length centre line from the brow to the
     tip with two dots under it — a stick with nostrils. A nose has no line down
     its middle; what it has is a SHADOW down one side and a lit tip, and in a
     world with one shading plane and no gradients the only honest version is a
     short stroke that starts where the bridge actually turns (below the eyes,
     not between them) and resolves into the tip.

     So: no bridge above the eye line, a wing on one side only, and the nostrils
     as short arcs rather than dots — a dot is a hole, an arc is a nostril. */
  const nx = fx + Math.sin(yaw) * R * 0.10;
  const ntip = R * (EYE_Y + (NOSE_Y - EYE_Y) * F.nose) + py;
  const shadeSide = yaw >= 0 ? -1 : 1;
  g.strokeStyle = INK; g.lineWidth = LWb * 0.9;
  g.beginPath();
  g.moveTo(nx + shadeSide * R * 0.048 * sx, eyeY + R * 0.09);
  g.quadraticCurveTo(nx + shadeSide * R * 0.085 * sx, ntip - R * 0.10,
    nx + shadeSide * R * 0.030 * sx, ntip - R * 0.010);
  g.stroke();
  g.lineWidth = LWb;
  g.beginPath();                                   // the underside of the tip
  g.moveTo(nx - R * 0.075 * sx, ntip - R * 0.020);
  g.quadraticCurveTo(nx, ntip + R * 0.055, nx + R * 0.075 * sx, ntip - R * 0.020);
  g.stroke();
  g.lineWidth = LWb * 0.85;
  for (const es of [-1, 1]) {                      // nostril wings
    if (Math.abs(yaw) > 0.62 && es * Math.sin(yaw) < 0) continue;
    g.beginPath();
    g.moveTo(nx + es * R * 0.075 * sx, ntip - R * 0.030);
    g.quadraticCurveTo(nx + es * R * 0.130 * sx, ntip - R * 0.045,
      nx + es * R * 0.115 * sx, ntip + R * 0.005);
    g.stroke();
  }

  /* ---- 7. THE MOUTH ------------------------------------------------------
     Upper lip anchored to the maxilla at `upperY`. Lower lip carried by the
     mandible, so its travel is EXACTLY the hinge's travel at the lip's own
     height — not an independent number, or the chin and the lip would disagree
     and the face would come apart at speed. */
  const upperY = R * MOUTH_Y + py;
  const lipAnchor = hinge({ x: 0, y: MOUTH_Y }, jaw);
  const lowerY = R * lipAnchor.y + py + R * 0.06;
  const aperture = Math.max(0, lowerY - upperY - R * 0.03);

  const mw = R * clamp(0.30 + 0.115 * wide - press * 0.02, 0.17, 0.45) * F.lip * sx;
  const mx = fx + Math.sin(yaw) * R * 0.06;
  const smile = (st.smile || 0) - (st.frown || 0);
  const corner = smile * R * 0.10;
  const round = clamp01(-wide);                      // OO/OH: the lips protrude

  g.save(); g.translate(mx, 0);

  if (aperture < R * 0.045) {
    /* CLOSED. Not "a line": two lips pressed, with a seam between them. press
       flattens them and adds the compression that makes /m/ read as a held
       consonant rather than as a pause. */
    const fl = 1 - press * 0.45;
    g.fillStyle = LIP; g.strokeStyle = INK; g.lineWidth = LWb;
    g.beginPath();
    g.moveTo(-mw, upperY - corner);
    g.bezierCurveTo(-mw * 0.5, upperY - R * 0.075 * fl - corner, -mw * 0.14, upperY - R * 0.045 * fl, 0, upperY - R * 0.022 * fl);
    g.bezierCurveTo(mw * 0.14, upperY - R * 0.045 * fl, mw * 0.5, upperY - R * 0.075 * fl - corner, mw, upperY - corner);
    g.bezierCurveTo(mw * 0.55, upperY + R * 0.085 * fl, -mw * 0.55, upperY + R * 0.085 * fl, -mw, upperY - corner);
    g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = INK; g.lineWidth = LWb * 1.1;    // the seam
    g.beginPath();
    g.moveTo(-mw, upperY - corner);
    g.quadraticCurveTo(0, upperY + R * 0.012 - corner * 0.5, mw, upperY - corner);
    g.stroke();
    if (press > 0.55) {                              // compression crease above
      g.lineWidth = LWc;
      g.beginPath();
      g.moveTo(-mw * 0.6, upperY - R * 0.115);
      g.quadraticCurveTo(0, upperY - R * 0.145, mw * 0.6, upperY - R * 0.115);
      g.stroke();
    }
  } else {
    /* OPEN. The dark interior first — this is the darkest plane in the frame
       and the eye finds it before anything else, which is the point. Then the
       teeth band hung from the upper lip (teeth belong to the skull too), then
       the tongue at the floor, then the two lips over the top of all of it. */
    const rw = mw * (1 - round * 0.30);              // rounding narrows the aperture
    g.fillStyle = MOUTH; g.strokeStyle = INK; g.lineWidth = LWb;
    g.beginPath();
    g.moveTo(-rw, upperY - corner * 0.5);
    g.quadraticCurveTo(0, upperY - aperture * 0.12, rw, upperY - corner * 0.5);
    g.quadraticCurveTo(rw * (0.72 + round * 0.2), lowerY - R * 0.02, 0, lowerY);
    g.quadraticCurveTo(-rw * (0.72 + round * 0.2), lowerY - R * 0.02, -rw, upperY - corner * 0.5);
    g.closePath(); g.fill();

    g.save(); g.clip();
    if ((st.teeth || 0) > 0.05) {
      g.fillStyle = TEETH;
      const th = aperture * clamp01(st.teeth) * 0.40;
      g.fillRect(-rw, upperY - corner * 0.5 - R * 0.01, rw * 2, th);
      g.strokeStyle = INK; g.lineWidth = LWc * 0.8;
      g.beginPath(); g.moveTo(-rw, upperY - corner * 0.5 + th); g.lineTo(rw, upperY - corner * 0.5 + th); g.stroke();
    }
    if ((st.tongue || 0) > 0.08 && aperture > R * 0.10) {
      g.fillStyle = TONGUE;
      g.beginPath();
      g.ellipse(0, lowerY - aperture * 0.10, rw * 0.66, aperture * 0.30 * clamp01(st.tongue) + R * 0.02, 0, 0, TAU);
      g.fill();
    }
    g.restore();
    g.strokeStyle = INK; g.lineWidth = LWb;
    g.beginPath();
    g.moveTo(-rw, upperY - corner * 0.5);
    g.quadraticCurveTo(0, upperY - aperture * 0.12, rw, upperY - corner * 0.5);
    g.quadraticCurveTo(rw * (0.72 + round * 0.2), lowerY - R * 0.02, 0, lowerY);
    g.quadraticCurveTo(-rw * (0.72 + round * 0.2), lowerY - R * 0.02, -rw, upperY - corner * 0.5);
    g.closePath(); g.stroke();

    // upper lip: a band above the aperture, fixed to the skull
    g.fillStyle = LIP; g.strokeStyle = INK; g.lineWidth = LWb * 0.85;
    const ut = R * 0.055 * (1 + round * 0.5);
    g.beginPath();
    g.moveTo(-mw, upperY - corner);
    g.bezierCurveTo(-mw * 0.5, upperY - ut - corner, -mw * 0.14, upperY - ut * 0.55, 0, upperY - ut * 0.3);
    g.bezierCurveTo(mw * 0.14, upperY - ut * 0.55, mw * 0.5, upperY - ut - corner, mw, upperY - corner);
    g.quadraticCurveTo(0, upperY - aperture * 0.12, -mw, upperY - corner);
    g.closePath(); g.fill(); g.stroke();
    // lower lip: a band below the aperture, riding the jaw
    const lt = R * 0.070 * (1 + round * 0.45);
    g.beginPath();
    g.moveTo(-mw, upperY - corner);
    g.quadraticCurveTo(-rw * 0.72, lowerY - R * 0.02, 0, lowerY);
    g.quadraticCurveTo(rw * 0.72, lowerY - R * 0.02, mw, upperY - corner);
    g.bezierCurveTo(mw * 0.55, lowerY + lt, -mw * 0.55, lowerY + lt, -mw, upperY - corner);
    g.closePath(); g.fill(); g.stroke();
  }
  g.restore();

  /* ---- 8. the creases that a face actually has --------------------------
     Philtrum always; nasolabial folds only when the mouth is doing something
     that would make them; and for Iona the four the text pays for. */
  g.strokeStyle = INK; g.lineWidth = LWc;
  g.beginPath();
  g.moveTo(nx - R * 0.012, ntip + R * 0.030);
  g.lineTo(mx, upperY - R * 0.085);
  g.stroke();

  const fold = clamp01(Math.max(jaw * 0.7, Math.abs(smile), clamp01(wide) * 0.6));
  if (fold > 0.24) {
    g.lineWidth = LWc * (0.8 + fold * 0.6);
    for (const es of [-1, 1]) {
      if (Math.abs(yaw) > 0.6 && es * Math.sin(yaw) < 0) continue;
      g.beginPath();
      g.moveTo(nx + es * R * 0.125 * sx, ntip - R * 0.02);
      g.quadraticCurveTo(mx + es * R * 0.30 * sx, upperY - R * 0.14,
        mx + es * mw * 1.08, upperY + aperture * 0.35 - corner);
      g.stroke();
    }
  }

  if (F.lines > 0.3) {
    /* "the skin deeply lined". Four lines, at three dots' width, because a
       fifth would start to read as texture and texture is what the lattice
       cannot hold. Forehead, crow's feet, marionette, neck. */
    const a = F.lines;
    g.strokeStyle = INK; g.lineWidth = LWc;
    g.globalAlpha = 0.85;
    for (let i = 0; i < 2; i++) {
      const yy = eyeY - R * (0.52 + i * 0.15) - browUp * R * 0.10;
      g.beginPath();
      g.moveTo(-R * 0.52 * sx + fx, yy + R * 0.02);
      g.quadraticCurveTo(fx, yy - R * 0.035, R * 0.52 * sx + fx, yy + R * 0.02);
      g.stroke();
    }
    for (const es of [-1, 1]) {
      if (Math.abs(yaw) > 0.7 && es * Math.sin(yaw) < 0) continue;
      const ex = fx + es * eyeDx;
      for (let i = 0; i < 2; i++) {
        g.beginPath();
        g.moveTo(ex + es * R * 0.215, eyeY - R * 0.02 + i * R * 0.055);
        g.lineTo(ex + es * R * (0.30 + 0.02 * i), eyeY - R * 0.05 + i * R * 0.075);
        g.stroke();
      }
      g.beginPath();                                 // marionette
      g.moveTo(mx + es * mw * 1.10, upperY + aperture * 0.5 - corner);
      g.quadraticCurveTo(mx + es * mw * 1.22, R * 0.86 + aperture * 0.5,
        mx + es * mw * 0.96, R * 1.02 + aperture * 0.6);
      g.stroke();
    }
    g.globalAlpha = 1;
  }

  /* ---- 9. the crown, over the forehead -----------------------------------
     One mass: out around the cranium, then back along the hairline. The
     hairline is deliberately ASYMMETRIC — lower on the left, swept right —
     because a symmetrical one is a swimming cap, and the asymmetry is the
     cheapest thing in the drawing that says a person combs this. */
  if (F.hair !== "bald") {
    const hl = HAIRLINE + (F.child ? 0.06 : 0);
    g.fillStyle = HAIR; g.strokeStyle = INK; g.lineWidth = LWa;
    g.beginPath();
    g.moveTo(-R * 1.04 * hm * sx, R * 0.06);
    g.bezierCurveTo(-R * 1.12 * hm * sx, -R * 0.66, -R * 0.78 * hm * sx, -R * 1.28,
      R * 0.02, -R * 1.26 * hm);
    g.bezierCurveTo(R * 0.80 * hm * sx, -R * 1.26, R * 1.12 * hm * sx, -R * 0.62,
      R * 1.04 * hm * sx, R * 0.06);
    // back along the hairline, right temple to left
    g.bezierCurveTo(R * 0.98 * sx, -R * 0.22, R * 0.86 * sx, -R * 0.44, R * 0.62 * sx, R * (hl + 0.10));
    g.bezierCurveTo(R * 0.34 * sx, R * (hl - 0.10), R * 0.10 * sx, R * (hl - 0.06), -R * 0.22 * sx, R * hl);
    g.bezierCurveTo(-R * 0.56 * sx, R * (hl + 0.08), -R * 0.86 * sx, R * (hl + 0.18), -R * 1.04 * hm * sx, R * 0.06);
    g.closePath(); g.fill(); g.stroke();
  }
  if (F.glasses) {
    g.strokeStyle = INK; g.lineWidth = LWb;
    for (const es of [-1, 1]) {
      g.beginPath(); g.ellipse(fx + es * eyeDx, eyeY, R * 0.27 * sx, R * 0.22, 0, 0, TAU); g.stroke();
    }
    g.beginPath();
    g.moveTo(fx - eyeDx + R * 0.27 * sx, eyeY); g.lineTo(fx + eyeDx - R * 0.27 * sx, eyeY);
    g.stroke();
  }

  g.restore();
}

/* ---- the CLOSE framing --------------------------------------------------
   One framing, shared by every close-up in the film, so that ninety cuts
   between five faces never move the eye line. That is not tidiness — a cut
   between two shots whose eye lines differ reads as a jump, and this film cuts
   between two faces every few seconds.

   R = 0.30 of frame height puts the head 2.4R tall in a 760px frame: the crown
   sits 32px down, the chin at 583, the collar enters at 711. It is a MEDIUM
   CLOSE-UP, not a tight one — the tight version crops the crown, and cropping
   is the one thing this world's ink-measured layout has never done. */
export const CLOSE = { cx: 0.500, cy: 0.420, R: 0.300 };
export const closeGeom = (NW, NH) => ({ cx: NW * CLOSE.cx, cy: NH * CLOSE.cy, R: NH * CLOSE.R });

/* ---- idle physiology ----------------------------------------------------
   A blink schedule and a gaze wander that are PURE functions of t. No random
   number generator, no accumulated state: two different renders of the same
   second must produce the same blink, or the loop-closure instrument in
   render-motion.mjs measures the blink instead of the motion.

   The blink is quantised to the frame grid on purpose. A 12fps blink that
   lands between frames is a half-closed eye held for 83ms, which reads as a
   flinch. Better to lose it or to land it square. */
export function idleFace(t, seed = 0, { rate = 4.2 } = {}) {
  const phase = (t / rate + seed * 0.37) % 1;
  const b = phase < 0.055 ? Math.sin((phase / 0.055) * Math.PI) : 0;
  return {
    blink: b > 0.15 ? b : 0,
    gazeX: Math.sin(t * 0.41 + seed * 2.1) * 0.30 + Math.sin(t * 1.9 + seed) * 0.05,
    gazeY: Math.sin(t * 0.33 + seed * 1.3) * 0.16,
  };
}

export const FACE_VERSION = "closeup-face/1.0.0";
