/* ============================================================================
   BF-13 · THE BREATHING        INT. LABORATORY · THE PHONE — CONTINUOUS
                                                        plan: the-laboratory

     "For several seconds there is only breathing — a larger rhythm, rough and
      receding, like water dragged over stone."
     "An old woman's voice arrives from a number Mara does not know."
                                                        — atlas/source.json

     IONA (V.O.): "You opened the lavender."
     IONA (V.O.): "You always open it too early. Your mother did. Her mother
                   did. The insects wake before the story is ready for them."
     IONA (V.O.): "I found the boy. He has been dead for eleven years."

   MOTION: HOLD · 5.5s · 66 frames @12fps · loopClosed: false.

   ---------------------------------------------------------------------------
   THE PROBLEM: THE SUBJECT OF THIS UNIT IS A SOUND.

   Nothing in a halftone world can draw breathing. What it can draw is the ONE
   physical object in the room that a breath at the other end of a line is
   attached to, and that object is a coiled handset cord.

   So the frame is a wall set with the handset off the hook, hanging, and the
   cord is the only thing in the act that moves for its own reasons. Its sway
   is built from three harmonics — 1, 2.3 and 5.1 per loop — which is what
   "rough" means when you cannot draw texture, and its amplitude DECAYS across
   the loop, which is what "receding" means. It never reaches zero. At u = 1 it
   is still moving by about four pixels, because the call has not ended; the
   text gives Iona three more lines after this.

   "LIKE WATER DRAGGED OVER STONE" is a description of an envelope, not of a
   picture, and I have drawn it as one: a slow fundamental with two faster
   components riding on it, decaying. If that reads as a cord swinging in a
   quiet room, the unit works. If it reads as a pendulum, it has failed, and
   the difference is entirely in whether the three harmonics stay out of phase
   — which they do, because 2.3 and 5.1 are not integers and the loop is not
   closed.

   THE HANDSET IS OFF THE HOOK AND NOBODY IS HOLDING IT. That is the whole
   staging decision. The plan pairs `wall_phone` with `mara_at_phone`, and she
   is NEARER the camera than the phone (z .4785 against .4325), so drawing her
   would put a back across the subject for the second time in this act — see
   BF-03's header for why her rig cannot carry one. She is off the near edge,
   listening. What is in frame is what she is listening to.

   NO WAVEFORM, NO RADIATING ARCS, NO MOUTH. Sound is not drawn in this world.

   DECLARED DISCONTINUITIES: none.
   ========================================================================= */
import { hold, framesFor, clamp01, TAU } from "../engine/motion.mjs";
import { INK, inkLevel } from "../engine/halfworld-engine.mjs";
import { occupancyAt } from "../engine/blocking.mjs";
import { lens } from "../assets/set/_lens.mjs";
import { room, wallPhone, phoneCord } from "../assets/set/_lab.mjs";
import { theLaboratory, MOVES_BF13 } from "./_plans/the-laboratory.mjs";
import { exitOccupancy as EXIT_BF12 } from "./BF-12.mjs";

export const id         = "BF-13";
export const title      = "THE BREATHING";
export const place      = "INT. LABORATORY · THE PHONE";
export const plan       = "the-laboratory";
export const motion     = "HOLD";
export const beats      = null;
export const seconds    = 5.5;
export const loopClosed = false;
export const frames     = framesFor(motion, seconds, 12);     // 66
export const declaredBreak = null;

export const subject  = "a handset hanging off the hook, moving on someone else's breath";
export const distance = "MEDIUM";
export const leftOut  = [
  "Mara — she is nearer the camera than the phone and would be a back across " +
  "the subject; she is off the near edge, listening, which is the only thing " +
  "the unit asks of her",
  "Iona — she is a voice with a number in this plan and no station; the first " +
  "one she is ever given is the-mill.iona_stand, in another act",
  "any drawing of sound: no waveform, no arcs, no mouth",
];

/* ============================================================ at(u) ======== */
export function at(u, _ctx) {
  const uu = clamp01(u);
  const h = hold(uu, { breathSec: 4.1, dur: seconds });
  /* ROUGH: three harmonics, none of them integer multiples of each other, so
     they never line up and the sway never becomes a pendulum.
     RECEDING: the envelope decays to 0.34 and stops there. The call goes on. */
  const env = 0.34 + 0.66 * Math.exp(-2.1 * uu);
  const rough = Math.sin(uu * TAU * 1.0)
              + 0.46 * Math.sin(uu * TAU * 2.3 + 1.1)
              + 0.22 * Math.sin(uu * TAU * 5.1 + 2.4);
  return {
    u: uu,
    sway: env * rough,                  // in units of ~22px at the handset
    env,
    phase: uu * TAU * 0.6,              // the coils, turning slowly
    breath: h.breath,
  };
}

/* ============================================================ draw() ======= */
const NW = 1120, NH = 760;
/* PASS 2. harness/measure-frames.mjs: THIRTY-THREE SECONDS — the longest scene
   in the film — at THREE PER CENT ink coverage. 18.7 "empty seconds", more than
   twice the next worst shot. At zoom 2.6 the phone occupied a fifth of the
   frame and the rest was wall, and the wall has nothing on it, because the
   whole point of this unit is that there is nobody in the room. An empty room
   is a composition. An empty frame is not, and this was the second. */
const F = lens(theLaboratory, { centre: "wall_phone", zoom: 3.4,
                                at: { x: 470, y: 960 }, W: NW, H: NH });

export function draw(g, W, H, s) {
  g.save();
  g.scale(W / NW, H / NH);
  g.lineJoin = "round"; g.lineCap = "round";

  /* PASS 2. 3% ink over 33 seconds, the emptiest shot in the film by a factor of
     two. `joints:false, wallLevel:1` is a wall with nothing on it and almost no
     tone, so the phone hung on a blank page. The room is a tiled laboratory;
     giving it its joints and one more ink level costs nothing and gives the
     handset a surface to hang against. */
  room(g, F, { z0: 0.10, z1: 0.98, ceiling: true, joints: true, wallLevel: 2 });
  const p = wallPhone(g, F);

  // the handset, hanging. It swings; the cord follows it.
  const hx = p.x + 118 + s.sway * 22;
  const hy = p.y + 172 + Math.abs(s.sway) * 5;
  phoneCord(g, p.x + 34, p.hookY + 26, hx - 8, hy - 46,
            { coils: 12, amp: 13, sag: 78 + s.env * 16, phase: s.phase, lw: 3.6 });
  handset(g, hx, hy, s);

  g.restore();
}

/* the handset: an earpiece, a bar, a mouthpiece. One shape, hung at an angle
   that is a function of the sway, so it reads as being moved rather than as
   being animated. */
function handset(g, x, y, s) {
  g.save();
  g.translate(x, y);
  g.rotate(0.42 + s.sway * 0.10);
  g.fillStyle = inkLevel(2);
  g.strokeStyle = INK; g.lineWidth = 5;
  const L = 214, T = 40;
  g.beginPath();
  g.moveTo(-L / 2, -T * 1.5);
  g.lineTo(-L / 2 + 44, -T * 0.35);
  g.lineTo(L / 2 - 44, -T * 0.35);
  g.lineTo(L / 2, -T * 1.5);
  g.lineTo(L / 2, T * 0.30);
  g.lineTo(L / 2 - 44, T * 0.70);
  g.lineTo(-L / 2 + 44, T * 0.70);
  g.lineTo(-L / 2, T * 0.30);
  g.closePath(); g.fill(); g.stroke();
  // the two grilles — the only dark marks on it, and they are holes
  g.fillStyle = inkLevel(6);
  for (const sx of [-1, 1]) {
    g.beginPath();
    g.ellipse(sx * (L / 2 - 21), -T * 0.55, 15, 12, 0, 0, TAU); g.fill();
  }
  g.restore();
}

/* ============================================================ occupancy ==== */
export const INITIAL = EXIT_BF12;
export const MOVES   = MOVES_BF13;
export const exitOccupancy = occupancyAt(theLaboratory, MOVES, 6, INITIAL);

export const SCENE_VERSION = "bf-motion/1.0.0";
