/* ============================================================================
   BF-19 · A CONFESSION            INT. MILL · THE LOBBY            the-mill

     "Niko reaches for the canister. Mara moves it away from him.
      The gesture is small. It enters the room like a confession."
                                                          — atlas/source.json
     IONA: "You work for the clean version."  NIKO: "And you work for what?"
     IONA: "The version that survived."
     NIKO: "This is exactly how contamination happens."

   MOTION: HOLD · 4.0s · 48 frames @12fps.

   ---------------------------------------------------------------------------
   THE SMALLEST MOVE IN THE PLAN, AND IT DECIDES THE STORY.

   the-mill's own note: "It is authored as 30px: niko_reach to
   canister_withheld. The smallest move in the plan and the one that decides
   which side of the story Mara is on."

   So the unit is a HOLD whose entire content is a 30px displacement, and the
   scene's only real decision is the crop that makes 30px legible. At zoom 7 the
   plan's two stations land 206px apart, which is a gesture; at MEDIUM they land
   at 29px, which is a twitch, and the sentence stops being true.

   THE SUBJECT IS THE GAP, NOT EITHER HAND. His hand arrives and stops; hers
   goes the other way and stops; the frame is about the distance between them
   afterwards, which is why both hands are held for the last third of the loop
   and the only thing still moving is the breath. "It enters the room like a
   confession" is a sentence about an interval of silence following a small act,
   and an interval is a thing a loop can hold and a still frame cannot.

   HIS HAND NEVER CLOSES. assets/set/_hands.mjs' `reaching` is authored open and
   stays open; there is no state in this world in which Niko's hand arrives on
   this object. His `cup_untouched` motion makes the same argument about the
   same man — "`lift` never exceeds 0.66 in any frame, and that ceiling is the
   whole characterisation."

   DECLARED DISCONTINUITIES: none. Both moves ease; nothing here is a cut.

   COMPOSITION. One subject: the gap between a reaching hand and the canister.
   ========================================================================= */
import { hold, framesFor, clamp01 } from "../engine/motion.mjs";
import { INK, lerp, smooth } from "../engine/halfworld-engine.mjs";
import { occupancyAt } from "../engine/blocking.mjs";
import { theMill, MOVES_BF19 } from "./_plans/the-mill.mjs";
import { lens, NW, NH, propSize } from "../assets/set/_stage.mjs";
import { canister } from "../assets/set/canister.mjs";
import { fingersOver } from "../assets/set/_hands.mjs";
import { lobbyWall, stoneFloor } from "../assets/set/mill.mjs";
import { LV, brokenLine } from "../assets/set/_kit.mjs";
import { exitOccupancy as exitOccupancyBF18 } from "./BF-18.mjs";

export const id         = "BF-19";
export const title      = "A CONFESSION";
export const place      = "INT. MILL · THE LOBBY";
export const plan       = "the-mill";
export const motion     = "HOLD";
export const beats      = null;
export const seconds    = 4.0;
export const loopClosed = false;
export const frames     = framesFor(motion, seconds, 12);      // 48
export const declaredBreak = null;
export const breakAt    = null;

export const subject  = "the gap between a reaching hand and the canister";
export const distance = "CLOSE";
export const leftOut  = [
  "three faces, and the argument they are having — none of it is drawable",
  "Iona, who says the two lines that matter and does not move",
  "the lobby: at this crop there is nothing between the wall and the floor",
];

/* ---- framing ------------------------------------------------------------ */
/* PASS 2. Zoom 7 was chosen off the 30px GAP and forgot the 82px WITHDRAWAL:
   mara_hand_take landed at x 1028 with a 190px tin on it, so the scene opened
   with the subject cropped at the right edge. The lens is centred on the
   midpoint of the travel, at the zoom that fits both — 5.0 puts the withdrawal
   at 410px and the gap at 148px, and neither end of the move touches an edge. */
/* PASS 2. 1.4% ink over twelve seconds — the emptiest frame in the film. The
   header below argues 5.0 from the ENDPOINTS of the travel, which is the right
   argument for keeping the move on screen and the wrong one for whether there
   is anything to look at: at 5.0 the hand and the canister are two specks with
   380px of blank mill between them, and the scene's declared subject is THE GAP
   BETWEEN THEM. A gap you cannot see the sides of is not a gap. 8.6 keeps both
   ends in frame and makes the space between them legible. */
const ZOOM = 8.6;
const station = lens(theMill, { zoom: ZOOM, cx: 0.49105, cy: 0.84640 });
const REACH = station("niko_reach");            // where his hand stops
const HELD  = station("canister_withheld");     // where the object ends up
const GIVEN = station("mara_hand_take");        // where it started, BF-18
const R = propSize(HELD, 0.027);

/* his reach and her withdrawal, scaled off the plan's own t0/t1 over T=5s */
const REACH_0 = 0.15, REACH_1 = 0.45;
const AWAY_0  = 0.40, AWAY_1  = 0.56;

/* ============================================================ at(u) ======== */
export function at(u, _ctx) {
  const h = hold(u, { breathSec: 4.1, dur: seconds });
  const reach = smooth(clamp01((u - REACH_0) / (REACH_1 - REACH_0)));
  const away  = smooth(clamp01((u - AWAY_0) / (AWAY_1 - AWAY_0)));
  return {
    u, reach, away,
    cx: lerp(GIVEN.x, HELD.x, away), cy: lerp(GIVEN.y, HELD.y, away),
    hx: lerp(REACH.x + R * 4.6, REACH.x, reach),
    hy: lerp(REACH.y + R * 0.9, REACH.y, reach),
    breath: h.breath, tilt: h.tilt, weight: h.weight,
  };
}

/* ============================================================ draw() ======= */
export function draw(g, W, H, s) {
  g.save();
  g.scale(W / NW, H / NH);
  g.lineJoin = "round"; g.lineCap = "round";

  /* ---- PASS 2. THE ROOM WAS TWO LINES AND PAPER, and the comment that used to
     be here said so out loud: "two broken lines a long way off, and paper."
     measure-frames.mjs put this scene at 1.4% ink coverage — an object floating
     on a blank page for 12 seconds — and I first tried to fix it by pushing the
     lens in, which made it worse, because zooming does not create ink. There
     was nothing behind the subject to get closer to.

     The mill HAS surfaces. BF-17 stands Iona against a brick wall over a stone
     floor eight scenes earlier, in this same lobby, from the same plan. This
     crop is lower and tighter, so we are against the wall rather than looking
     down the room — but it is the same wall, and an exchange happening in front
     of it is an exchange happening somewhere. */
  lobbyWall(g, -20, NW + 20, -160, 455, { seed: 71, columns: [] });
  brokenLine(g, -20, NW + 20, 455, 55, { lw: 6, segs: 4, gap: 0.03 });
  stoneFloor(g, 455, NH + 20, -20, NW + 20, { seed: 72, courses: 3 });

  const dy = s.breath * 4 - 2, dx = s.weight * 3;
  const cx = s.cx + dx, cy = s.cy + dy;

  /* ---- HIS HAND. Open, extended, and it does not arrive. Four fingers and a
     wrist behind them: `reaching`'s whole palm printed as a mitten on a stick
     at this size, and a hand that is reaching is fingers first. */
  fingersOver(g, s.hx, s.hy, R * 0.52,
    { dir: 0.06, age: 0, count: 4, spread: 0.50, wrist: true, reach: 0.72 + 0.28 * s.reach });

  /* ---- THE CANISTER, and her fingers over it. She is the one holding it now. */
  canister(g, cx, cy, R, { tilt: s.tilt * 0.02, scales: 9, seed: 17 });
  fingersOver(g, cx + R * 0.48, cy - R * 0.16, R * 0.44, { dir: 0.14, age: 0, count: 4 });

  g.restore();
}

/* ---- occupancy ---------------------------------------------------------- */
export const INITIAL = exitOccupancyBF18;
export const MOVES   = MOVES_BF19;
export const exitOccupancy = occupancyAt(theMill, MOVES, 5, INITIAL);

export const SCENE_VERSION = "bf-motion/1.0.0";
