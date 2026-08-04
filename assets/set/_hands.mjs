/* ============================================================================
   assets/set/_hands.mjs — THE HANDS AT THE CONTACT PAIRS. Private support for
   BF-18, BF-19 and BF-21. Underscore-prefixed; exports no `asset`.

   WHY A SCENE MAY DRAW A HAND AT ALL.

   the-mill has seven contact pairs and six of them are in the lobby, "inside
   ninety seconds of story: this is the room where the world stops being observed
   through a glove and starts touching people." Three of those six units are
   CLOSE on a palm-width object, and at that crop a whole figure is four times
   the frame. figure-hero cannot supply a hand at that scale — it draws hands as
   a feature of a body — so the alternative to authoring one here is to shoot
   every handover in MEDIUM and lose the rust, the tape, the label and the
   scales, which are the entire content of BF-18.

   THIS IS DECLARED OVERPAINT and it obeys the law the cast already obeys, taken
   from assets/character/iona.mjs' own hand close-up: "the hand: ONE closed
   silhouette, the law figure-hero draws hands under." One contour, one skin
   value from SURFACE, one thumb lobe merged into the same path, and creases at
   a lighter level. No knuckle modelling, no fingernails, no webbing.

   THREE HANDS, because the text distinguishes them:
     offering(...)  BF-18 · palm up, flat, holding the object out. Iona.
     taking(...)    BF-18/19 · fingers over the top of the object. Mara.
     reaching(...)  BF-19 · fingers extended toward something, holding nothing.
                    "The gesture is small. It enters the room like a confession."
                    Niko's, and it never closes on anything in this world.

   AGE IS ONE PARAMETER. Iona is 88 and Mara is 34, and the only thing that
   travels between them here is `age` 0..1, which lengthens the tendons and adds
   two crease lines. Everything else is the same path, for the same reason the
   two butterflies are one rig.
   ========================================================================= */
import { INK, gray, lerp } from "../../engine/halfworld-engine.mjs";
import { SURFACE } from "../character/_rig.mjs";
import { LV } from "./_kit.mjs";

const TAU = Math.PI * 2;

/* the wrist and forearm the hand arrives on. `dir` is the direction it comes
   FROM, in radians; sleeves are the garment, not the skin. */
function forearm(g, x, y, R, dir, sleeve) {
  const ax = x + Math.cos(dir) * R * 2.6, ay = y + Math.sin(dir) * R * 2.6;
  g.strokeStyle = INK; g.lineWidth = R * 0.86 + 9; g.lineCap = "butt";
  g.beginPath(); g.moveTo(ax, ay); g.lineTo(x + Math.cos(dir) * R * 0.5, y + Math.sin(dir) * R * 0.5); g.stroke();
  g.strokeStyle = sleeve; g.lineWidth = R * 0.86;
  g.beginPath(); g.moveTo(ax, ay); g.lineTo(x + Math.cos(dir) * R * 0.5, y + Math.sin(dir) * R * 0.5); g.stroke();
}

/* the one silhouette. `spread` 0..1 opens the fingers; `curl` 0..1 closes them
   over the far edge of whatever is being held. */
function palm(g, R, { spread = 0.5, curl = 0, age = 0, skin }) {
  g.fillStyle = skin; g.strokeStyle = INK; g.lineWidth = Math.max(3.4, R * 0.075);
  g.lineJoin = "round";
  const s = 0.86 + 0.24 * spread;
  g.beginPath();
  g.moveTo(-R * 0.62 * s, R * 0.52);
  g.quadraticCurveTo(-R * 0.92 * s, -R * 0.18, -R * 0.46 * s, -R * (0.68 + curl * 0.24));
  g.quadraticCurveTo(R * 0.10, -R * (1.02 + curl * 0.30), R * 0.64 * s, -R * (0.68 + curl * 0.20));
  g.quadraticCurveTo(R * 1.02 * s, -R * 0.32, R * 0.86 * s, R * 0.18);
  g.quadraticCurveTo(R * 0.60, R * 0.86, R * 0.02, R * 0.82);
  g.closePath(); g.fill(); g.stroke();
  // the thumb lobe, merged into the same contour
  g.beginPath();
  g.moveTo(-R * 0.58, R * 0.30);
  g.quadraticCurveTo(-R * 1.16, R * 0.12, -R * 1.24, -R * 0.42);
  g.quadraticCurveTo(-R * 1.06, -R * 0.76, -R * 0.74, -R * 0.54);
  g.quadraticCurveTo(-R * 0.50, -R * 0.08, -R * 0.40, R * 0.30);
  g.closePath(); g.fill(); g.stroke();
  // finger separations: three, and only three — more turns a hand into a rake
  g.strokeStyle = LV(3 + Math.round(age * 2)); g.lineWidth = Math.max(2.2, R * 0.045);
  for (let i = 0; i < 3; i++) {
    const t = (i + 1) / 4;
    const px = lerp(-R * 0.40, R * 0.72, t);
    g.beginPath();
    g.moveTo(px, -R * (0.62 + curl * 0.20));
    g.lineTo(px + R * 0.05, -R * (0.06 - curl * 0.20));
    g.stroke();
  }
  // an old hand has tendons and two knuckle creases; a young one has neither
  if (age > 0.5) {
    g.strokeStyle = LV(4); g.lineWidth = Math.max(2, R * 0.038);
    for (let i = 0; i < 3; i++) {
      const t = i / 2;
      g.beginPath();
      g.moveTo(-R * 0.26 + t * R * 0.56, -R * 0.42 + t * R * 0.10);
      g.lineTo(-R * 0.18 + t * R * 0.62, R * 0.14 + t * R * 0.08);
      g.stroke();
    }
  }
}

/** BF-18 · palm up and flat, the object resting on it. */
export function offering(g, x, y, R, { dir = 0.4, age = 1, rot = 0 } = {}) {
  g.save();
  forearm(g, x, y, R, dir, age > 0.5 ? gray(0x56) : gray(0x9a));
  g.translate(x, y); g.rotate(rot + Math.PI);
  palm(g, R, { spread: 0.9, curl: 0, age, skin: age > 0.5 ? SURFACE.skinOld : SURFACE.skin });
  g.restore();
}

/** BF-18 / BF-19 · fingers over the top of the object, taking it or holding it. */
export function taking(g, x, y, R, { dir = Math.PI - 0.4, age = 0, rot = 0 } = {}) {
  g.save();
  forearm(g, x, y, R, dir, age > 0.5 ? gray(0x56) : gray(0x9a));
  g.translate(x, y); g.rotate(rot);
  palm(g, R, { spread: 0.35, curl: 0.85, age, skin: age > 0.5 ? SURFACE.skinOld : SURFACE.skin });
  g.restore();
}

/* ---------------------------------------------------------------------------
   fingersOver(g, cx, cy, R, o) — FOUR FINGERS COMING OVER A RIM, and nothing
   else of the hand.

   PASS 2, from BF-18's full-resolution frame. Two whole `palm()` silhouettes
   either side of a 380px canister produced three overlapping lobes of the same
   value with the object buried under them: the rust, the label, the dents and
   seven of the nine scales were gone, which is every fact the unit is made of.
   The failure is compositional and it has a name — the hand that TAKES an
   object is in front of it, so drawing all of that hand deletes the object.

   What is actually visible when somebody takes a tin off a palm is four
   fingertips on the near rim and nothing else; the rest of the hand is behind
   the thing it is taking. So this draws the four, from a knuckle line outside
   the frame's interest, and the object keeps its face.

   `reach` 0..1 slides the fingers along `dir` — BF-19's whole content is a hand
   that comes this far and no further.
--------------------------------------------------------------------------- */
export function fingersOver(g, cx, cy, R, {
  dir = Math.PI, age = 0, count = 4, spread = 0.44, reach = 1, wrist = false,
} = {}) {
  const skin = age > 0.5 ? SURFACE.skinOld : SURFACE.skin;
  g.save();
  g.translate(cx, cy); g.rotate(dir);
  g.fillStyle = skin; g.strokeStyle = INK; g.lineWidth = Math.max(3.2, R * 0.085);
  g.lineJoin = "round"; g.lineCap = "round";
  /* `wrist` adds the knuckle mass and a sleeved forearm BEHIND the fingers, for
     a hand that is reaching through open air rather than closing on an object
     that already hides it. BF-19 is the only caller. */
  if (wrist) {
    const sl = age > 0.5 ? gray(0x56) : gray(0x9a);
    g.strokeStyle = INK; g.lineWidth = R * 1.05 + 9; g.lineCap = "butt";
    g.beginPath(); g.moveTo(R * 3.4, 0); g.lineTo(R * 1.05, 0); g.stroke();
    g.strokeStyle = sl; g.lineWidth = R * 1.05;
    g.beginPath(); g.moveTo(R * 3.4, 0); g.lineTo(R * 1.05, 0); g.stroke();
    g.fillStyle = skin; g.strokeStyle = INK; g.lineWidth = Math.max(3.2, R * 0.085);
    g.lineJoin = "round"; g.lineCap = "round";
    g.beginPath();
    g.ellipse(R * 1.02, 0, R * 0.42, R * spread * 1.28, 0, 0, TAU);
    g.fill(); g.stroke();
  }
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const off = (t - 0.5) * R * spread * 2;
    const len = R * (0.86 + 0.30 * Math.sin(t * Math.PI)) * (0.55 + 0.45 * reach);
    const w = R * (0.19 - 0.03 * Math.abs(t - 0.5) * 2);
    g.beginPath();
    g.moveTo(R * 1.10, off - w);
    g.lineTo(R * 1.10 - len, off - w);
    g.quadraticCurveTo(R * 1.10 - len - w * 1.15, off, R * 1.10 - len, off + w);
    g.lineTo(R * 1.10, off + w);
    g.closePath(); g.fill(); g.stroke();
    // one crease per finger; an old hand gets a second
    g.strokeStyle = LV(3 + Math.round(age * 2)); g.lineWidth = Math.max(2, R * 0.035);
    g.beginPath();
    g.moveTo(R * 1.10 - len * 0.42, off - w * 0.9); g.lineTo(R * 1.10 - len * 0.42, off + w * 0.9);
    g.stroke();
    if (age > 0.5) {
      g.beginPath();
      g.moveTo(R * 1.10 - len * 0.72, off - w * 0.8); g.lineTo(R * 1.10 - len * 0.72, off + w * 0.8);
      g.stroke();
    }
    g.strokeStyle = INK; g.lineWidth = Math.max(3.2, R * 0.085);
  }
  g.restore();
}

/** BF-19 · reaching, and holding nothing. "It enters the room like a
 *  confession." Open, extended, and it does not arrive. */
export function reaching(g, x, y, R, { dir = Math.PI * 1.15, age = 0, rot = 0 } = {}) {
  g.save();
  forearm(g, x, y, R, dir, gray(0x9a));
  g.translate(x, y); g.rotate(rot - 0.35);
  palm(g, R, { spread: 1, curl: 0.10, age, skin: SURFACE.skin });
  g.restore();
}

export const HANDS_VERSION = "bf-hands/1.0.0";
