/* ============================================================================
   _test-visemes.mjs — NOT A UNIT OF THE FILM.

   An instrument. Ten frames, one per viseme, at the exact CLOSE framing and the
   exact dot pitch the close-ups will print at, so the ten shapes can be looked
   at side by side before ninety scenes are generated from them.

   The question it answers is the only one that matters at this stage: ARE THESE
   TEN SHAPES DISTINGUISHABLE AFTER THE HALFTONE PASS? A viseme set that
   collapses to three shapes on the lattice is a viseme set with three visemes,
   and no amount of correct timing will recover the difference.

     node harness/render-motion.mjs scenes/_test-visemes.mjs --contact --keep
   ========================================================================= */
import { framesFor } from "../engine/motion.mjs";
import { VISEMES } from "../engine/speech.mjs";
import { NW, NH } from "../assets/set/_stage.mjs";
import { FACES, drawCloseup, closeGeom } from "../assets/character/_face.mjs";
import { INK } from "../engine/halfworld-engine.mjs";

const NAMES = Object.keys(VISEMES);

export const id = "_TEST-VISEMES";
export const title = "TEN SHAPES";
export const place = "instrument";
export const plan = null;
export const motion = "ADVANCE";
export const beats = null;
export const seconds = NAMES.length / 12;
export const loopClosed = false;
export const frames = NAMES.length;
export const declaredBreak = null;
export const breakAt = null;
export const subject = "whether ten mouth shapes survive the dot lattice";
export const distance = "CLOSE";
export const leftOut = ["everything — this is not a scene"];

export function at(u) {
  const i = Math.min(NAMES.length - 1, Math.floor(u * NAMES.length));
  const V = VISEMES[NAMES[i]];
  return { name: NAMES[i], ...V, gate: 1 };
}

export function draw(g, W, H, s) {
  g.save();
  g.scale(W / NW, H / NH);
  g.lineJoin = "round"; g.lineCap = "round";
  drawCloseup(g, FACES.mara, {
    jaw: s.jaw, wide: s.wide, press: s.press, teeth: s.teeth, tongue: s.tongue,
    blink: 0, gazeX: 0, gazeY: 0, browUp: 0.1, browKnit: 0,
    headYaw: 0, headPitch: 0, headRoll: 0, chest: 0.3,
  }, closeGeom(NW, NH));
  g.fillStyle = INK;
  g.font = "700 46px Helvetica,Arial,sans-serif";
  g.textAlign = "center";
  g.fillText(s.name, NW * 0.5, NH * 0.965);
  g.restore();
}

export const SCENE_VERSION = "instrument/1.0.0";
