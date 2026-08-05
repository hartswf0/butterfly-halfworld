/* ============================================================================
   _test-cast.mjs — NOT A UNIT OF THE FILM.

   The second instrument. Five heads, each at the CLOSE framing, each saying the
   same open vowel, so the only difference between the frames is the person.

   The question: CAN YOU TELL THESE FIVE APART? If two of them are the same head
   with different hair, the close-ups will be unreadable at speed, and no amount
   of correct lip-sync will fix it — a viewer who cannot tell who is speaking is
   not watching a conversation. Frames alternate rest and speech per face so the
   sheet also shows what each jaw does.

     node harness/render-motion.mjs scenes/_test-cast.mjs --contact --step 1
   ========================================================================= */
import { framesFor } from "../engine/motion.mjs";
import { NW, NH } from "../assets/set/_stage.mjs";
import { FACES, drawCloseup, closeGeom, idleFace } from "../assets/character/_face.mjs";
import { INK } from "../engine/halfworld-engine.mjs";

const WHO = ["mara", "niko", "iona", "elise", "thegirl"];

export const id = "_TEST-CAST";
export const title = "FIVE HEADS";
export const place = "instrument";
export const plan = null;
export const motion = "ADVANCE";
export const beats = null;
export const frames = WHO.length * 2;
export const seconds = frames / 12;
export const loopClosed = false;
export const declaredBreak = null;
export const breakAt = null;
export const subject = "whether five faces are distinguishable at the close framing";
export const distance = "CLOSE";
export const leftOut = ["everything — this is not a scene"];

export function at(u) {
  const i = Math.min(frames - 1, Math.floor(u * frames));
  const who = WHO[Math.floor(i / 2)];
  const open = i % 2 === 1;
  return { who, open, t: i * 0.3 };
}

export function draw(g, W, H, s) {
  g.save();
  g.scale(W / NW, H / NH);
  g.lineJoin = "round"; g.lineCap = "round";
  const idle = idleFace(s.t, WHO.indexOf(s.who));
  drawCloseup(g, FACES[s.who], {
    jaw: s.open ? 0.82 : 0.0, wide: s.open ? 0.25 : 0, press: s.open ? 0 : 0.2,
    teeth: s.open ? 0.25 : 0, tongue: s.open ? 0.15 : 0,
    blink: idle.blink, gazeX: 0, gazeY: 0, browUp: s.open ? 0.32 : 0.08, browKnit: 0,
    headYaw: 0, headPitch: 0, headRoll: 0, chest: 0.3,
  }, closeGeom(NW, NH));
  g.fillStyle = INK;
  g.font = "700 40px Helvetica,Arial,sans-serif";
  g.textAlign = "center";
  g.fillText(s.who.toUpperCase(), NW * 0.5, NH * 0.975);
  g.restore();
}

export const SCENE_VERSION = "instrument/1.0.0";
