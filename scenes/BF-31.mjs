/* ============================================================================
   BF-31 · I SAW TODAY        INT. REARING FACILITY · THE FILM IN HER HAND
                                                                plan: the-facility

     "She holds the strip toward the fluorescent light and advances it between
      her fingers."
     "The child straightens. The woman turns. The butterfly descends."
     "Then the image changes: the next frame shows Mara herself standing in the
      lobby with the canister in her hands."                — atlas/source.json

     NIKO: "What did you see?"   MARA: "I saw today."
     IONA: "You saw yourself arranged as a memory."

   MOTION: ADVANCE · 8 frames of film · 4.0s · 48 frames @12fps.

   ADVANCE IS QUANTISED AND IT HAS DWELL. advance(u, 8, { dwell: 0.72 }) holds
   each frame at the gate for 72% of its interval and then slides to the next in
   the remaining 28% — at 12fps that is four held frames and two moving ones.
   MOTION-BRIEF: "NOT continuous ... there is a deliberate dwell so the eye
   registers each frame as a separate thing." Easing this would turn a film strip
   into a conveyor belt.

   THE FINGERS DO NOT MOVE; THE FILM DOES. the-facility's header is explicit:
   "BF-31 is frames advancing PAST a stationary gate ... advance(u, count) is
   quantised against a gate, not against ground. The gate does not move and
   neither does she." So the strip is drawn between the two hands the RIG
   REPORTED — placeFigure hands back the pose's own anchors — and the film slides
   along that line. Her hands are held by mara.motions.advance_strip, which is
   the motion the cast module authored for this unit.

   EIGHT FRAMES, AND THE EIGHTH IS THE UNIT. Seven are the glasshouse — child,
   woman, butterfly, twice round — and the eighth is Mara in the lobby with the
   canister. It arrives once per loop, holds for four rendered frames, and goes.
   Because this is a loop it then happens again, which is the correct behaviour
   for an image of yourself arranged as a memory.

   DECLARED DISCONTINUITIES: none. The advance's slide is fast, not instant.

   ---------------------------------------------------------------------------
   THE LENS. zoom 12 about mara_strip_hand, dropped 761px.

   THE ZOOM IS DERIVED FROM THE DOT LATTICE, not chosen. A frame on the strip is
   0.86 of the strip's width, and a pictogram needs about 88 x 70 source pixels
   to survive dotifyField's 4px grid — three or four strokes, ten dots deep. So
   the strip must be about 120px wide; a 120px strip means her two hands must be
   about 980px apart; 980px of hand separation is a body about 2200px tall; and
   that is zoom 12. PASS 1 ran at zoom 7 and the frames came back as noise — the
   whole subject of the unit, illegible, in a frame that also contained her
   knees.
   ========================================================================= */
import { advance, framesFor, TAU } from "../engine/motion.mjs";
import { INK, PAPER, inkLevel } from "../engine/halfworld-engine.mjs";
import { occupancyAt } from "../engine/blocking.mjs";
import { theFacility, MOVES_BF31 } from "./_plans/the-facility.mjs";
import { makeLens, placeFigure, BODY, NW, NH } from "../assets/set/_facility-lens.mjs";
import { filmStrip, GLASSHOUSE_FRAMES } from "../assets/set/_film.mjs";
import mara from "../assets/character/mara.mjs";
import { exitOccupancy as INITIAL_FROM_BF30 } from "./BF-30.mjs";

/* ---- the motion scene contract ------------------------------------------ */
export const id         = "BF-31";
export const title      = "I SAW TODAY";
export const place      = "INT. REARING FACILITY · THE FILM IN HER HAND";
export const plan       = "the-facility";
export const motion     = "ADVANCE";
export const beats      = null;
export const seconds    = 4.0;
export const loopClosed = false;
export const frames     = framesFor(motion, seconds, 12);      // 48
export const declaredBreak = null;

export const subject    = "the strip advancing between her fingers";
export const distance   = "CLOSE";
export const leftOut    = [
  "Niko. He catches the film at niko_catch, which at this zoom is 904px below " +
  "the bottom of the frame — he is standing where the lens is. The catch is the " +
  "unit's last beat and this loop is its middle one",
  "the room. At zoom 7 there is no room; there is a hand and a light",
  "the fluorescent tube she is holding it toward — it is overhead and out of " +
  "frame, which is what makes the light come from above",
];

/* ---- the lens ------------------------------------------------------------ */
const lens = makeLens(theFacility, { centre: "mara_strip_hand", zoom: 8, dy: 647 });
const HAND = lens("mara_strip_hand");
const FILM_COUNT = 8;                       // frames on the strip
const LOBBY_INDEX = 7;                      // the one that is today

/* ============================================================ at(u) ======== */
export function at(u, _ctx) {
  const a = advance(u, FILM_COUNT, { dwell: 0.72 });
  return {
    u, adv: a,
    /* the cast module's own motion for this unit. It returns the pose, the
       guise and a head that lifts one notch each time a frame settles at the
       gate — a person reading a filmstrip, not a person posing with one. */
    mara: mara.motions.advance_strip(u),
    /* the butterfly in frame 2 descends across its own frame. It is the only
       thing inside the film that moves independently of the advance, and it is
       tied to u rather than to the index so that the same frame is not the same
       picture twice. */
    fall: (u * 3) % 1,
  };
}

/* ============================================================ draw() ======= */
export function draw(g, W, H, s) {
  g.save();
  g.scale(W / NW, H / NH);
  g.lineJoin = "round"; g.lineCap = "round";

  /* THE LIGHT, INVERTED. PASS 2 split the field into a bright upper band and a
     darker lower one with a broken edge between them, and the edge printed as
     one more full-width horizontal in a frame that already had the strip lying
     across it. There is a better answer and the object supplies it: she is
     holding the film UP TO A TUBE, so the film is lit from behind and the
     ACETATE IS THE BRIGHTEST THING IN THE PICTURE. The room is one flat L(1)
     and the strip is paper. No band, no edge, no second horizontal. */
  g.fillStyle = inkLevel(1); g.fillRect(0, 0, NW, NH);

  /* ---- Mara, with the strip switched OFF in her own module ----
     mara.mjs draws its own film strip between the reported hands. It is the
     right object at asset scale and the wrong one here: at 60px wide its frames
     carry no picture, and this unit is about what is in them. So `strip:false`,
     and the strip is drawn below from the same two anchors her rig hands back —
     which means it is still hung off the pose and cannot drift from it. */
  const body = placeFigure(g, mara, {
    ...s.mara, strip: false, box: false, guise: "bare",
    /* ONE DECLARED DEPARTURE FROM THE AUTHORED POSE. mv_strip is symmetric, so
       the strip between the two hands comes out DEAD HORIZONTAL and 977px long
       — a bar straight across the frame, i.e. BUILD-BRIEF S5 committed with the
       largest object in the shot. PASS 2 tilted it four degrees and it was
       still a bar. This is the asymmetry the sentence actually describes: one
       hand HIGH, holding the strip up toward the tube, and one hand low
       feeding it. The strip now crosses the frame at about 25 degrees and the
       advance runs UP it. Same pose, same object, same two fingers. */
    rig: { ...(s.mara.rig || {}), armLUpper: 1.58, armLLower: -0.92,
           armRUpper: -0.42, armRLower: 1.30, shoulderLiftL: 0.42, shoulderLiftR: 0.16 },
  }, { footX: HAND.px, footY: HAND.py, height: HAND.k * BODY });

  const L = body.anchors.leftHand, R = body.anchors.rightHand;

  /* ---- the film ----
     Eight frames. Seven of 1945 and one of thirty minutes ago. */
  filmStrip(g, L.x, L.y, R.x, R.y, {
    width: 110, count: FILM_COUNT, adv: s.adv, span: 1.30,
    frameAt(gg, i, w, h) {
      if (i === LOBBY_INDEX) return GLASSHOUSE_FRAMES.mara_in_the_lobby(gg, w, h);
      const which = i % 3;
      if (which === 0) GLASSHOUSE_FRAMES.child_straightens(gg, w, h, s.adv.settled ? 1 : 0.35);
      else if (which === 1) GLASSHOUSE_FRAMES.woman_turns(gg, w, h);
      else GLASSHOUSE_FRAMES.butterfly_descends(gg, w, h, s.fall);
    },
  });

  /* THE GATE. Her two fingers are the gate, and the gate is the only place on
     the strip that is in contact with anything: two short hard marks where the
     film passes between finger and thumb. Drawn over the strip because they are
     in front of it. */
  const ang = Math.atan2(R.y - L.y, R.x - L.x);
  for (const [hx, hy] of [[L.x, L.y], [R.x, R.y]]) {
    g.save(); g.translate(hx, hy); g.rotate(ang);
    g.strokeStyle = INK; g.lineWidth = 8;
    g.beginPath(); g.moveTo(0, -66); g.lineTo(0, 66); g.stroke();
    g.restore();
  }

  g.restore();
}

/* ---- occupancy ----------------------------------------------------------- */
export const INITIAL = INITIAL_FROM_BF30;
export const MOVES   = MOVES_BF31;
export const exitOccupancy = occupancyAt(theFacility, MOVES, 6, INITIAL);

export const SCENE_VERSION = "bf-motion/1.0.0";
