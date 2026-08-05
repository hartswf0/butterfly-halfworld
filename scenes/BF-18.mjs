/* ============================================================================
   BF-18 · I BROUGHT YOU THE FILM     INT. MILL · THE LOBBY        the-mill

     "A dented circular canister no wider than her palm. Rust spreads from the
      hinge in branching lines. Around the edge, black electrical tape. Beneath
      the rust, a fragment of white label: ASTER. Yellow scales cling to the
      tape, caught in the adhesive. They are fresh enough to shine."
                                                          — atlas/source.json
     IONA: "I brought you the film."  MARA: "Where did these come from?"
     IONA: "The envelope."  MARA: "Was there a butterfly in it?"
     IONA: "Not when I closed it."

   MOTION: HOLD · 4.5s · 54 frames @12fps.

   ---------------------------------------------------------------------------
   A HOLD THAT CONTAINS A HANDOVER.

   The plan's blocking for this unit is iona_stand -> iona_hand_out over t 1.0
   to 2.4 and mara_stand -> mara_hand_take over t 1.2 to 2.6: the two moves
   OVERLAP by 1.2 seconds, and its header says why — "the object is in two
   people's hands for one instant and in one person's for the rest of the
   episode." That overlap is the unit. It is not a BREAK, because there is no
   frame in which the canister is held by nobody; custody is continuous even
   though it changes. So: only Iona's hand under it for the first third, both
   hands on it through the middle, only Mara's for the last third, and the
   object itself never moves. The thing that moves is who is responsible for it.

   Everything else holds. hold() supplies the deniable residue — MOTION-BRIEF
   rule 3, "a frozen frame reads as a crash" — as a 4.1s breath in both wrists
   and a 9.3s weight shift, neither of which exceeds four pixels.

   ---------------------------------------------------------------------------
   WHY THIS IS CLOSE, and what it cost.

   Everything the unit is made of — branching rust, a tape edge, five letters of
   a torn label, scales small enough to be caught in adhesive — lives on an
   object "no wider than her palm". At MEDIUM that object is 40px across and all
   six facts are gone. So the lens goes to zoom 14.2, which sizes the canister
   at 380px and the label's cap height at 44px, over the 26px floor below which
   assets/set/canister.mjs refuses to draw the word at all.

   THE PRICE, DECLARED: at that crop no body fits in the frame and figure-hero
   cannot supply a hand on its own. The two hands are authored in
   assets/set/_hands.mjs as declared overpaint, under the law Iona's own module
   already states for her hand close-up — ONE closed silhouette, one skin value,
   a thumb lobe merged into the same contour. Age is the only parameter that
   separates them, because Iona is 88 and Mara is 34.

   AND THE BACKGROUND IS PAPER. At this crop the wall is above the frame and the
   floor is below it; there is nothing between them but air, and air in this
   world has no ink in it. Half the frame stays cream by not being anything.

   DECLARED DISCONTINUITIES: none.

   COMPOSITION. One subject: the canister, changing hands.
   ========================================================================= */
import { hold, framesFor, TAU, clamp01 } from "../engine/motion.mjs";
import { INK, inkLevel, lerp, smooth } from "../engine/halfworld-engine.mjs";
import { occupancyAt } from "../engine/blocking.mjs";
import { theMill, MOVES_BF18 } from "./_plans/the-mill.mjs";
import { lens, NW, NH, BODY_H, propSize } from "../assets/set/_stage.mjs";
import { canister } from "../assets/set/canister.mjs";
import { fingersOver } from "../assets/set/_hands.mjs";
import { lobbyWall, stoneFloor } from "../assets/set/mill.mjs";
import { LV, brokenLine } from "../assets/set/_kit.mjs";
import { exitOccupancy as exitOccupancyBF17 } from "./BF-17.mjs";

/* ---- the motion scene contract ------------------------------------------ */
export const id         = "BF-18";
export const title      = "I BROUGHT YOU THE FILM";
export const place      = "INT. MILL · THE LOBBY";
export const plan       = "the-mill";
export const motion     = "HOLD";
export const beats      = null;
export const seconds    = 4.5;
export const loopClosed = false;
export const frames     = framesFor(motion, seconds, 12);      // 54
export const declaredBreak = null;
export const breakAt    = null;

export const subject  = "the canister, changing hands";
export const distance = "CLOSE";
export const leftOut  = [
  "all three faces — at this crop none of them is in the frame",
  "Niko, who is still coming down the stairs through this whole unit",
  "the lobby: the wall is above the frame and the floor is below it",
  "the envelope the scales came from — it is spoken and never seen",
];

/* ---- framing ------------------------------------------------------------ */
/* PASS 2. 4.2% ink over 13.5s, and a bounding box covering 14% of the frame —
   a disc floating in white. Unlike BF-13 this is not an under-zoom: at 14.2 the
   canister is already large. What is missing is EVERYTHING ELSE. The scene is
   called "the canister, changing hands" and neither hand is legible in it,
   because the lens is centred on the object rather than on the exchange.
   Widening slightly and dropping the centre brings both hands and the floor
   into frame — the transaction instead of the merchandise. */
const ZOOM = 11.4;
const station = lens(theMill, { zoom: ZOOM, cx: 0.5402, cy: 0.8560 });
const OUT  = station("iona_hand_out");
const TAKE = station("mara_hand_take");
/* a palm is 0.055 of a standing body and the canister is "no wider than" one,
   so its half-width is 0.027 of a body height at this depth. Derived, not chosen. */
const R = propSize(OUT, 0.027);
const CX = (OUT.x + TAKE.x) / 2, CY = (OUT.y + TAKE.y) / 2;

/* the two custody windows. They OVERLAP, which is the unit. */
const IONA_LETS_GO = 0.66;      // her hand is under it until here
const MARA_TAKES   = 0.34;      // hers is on it from here

/* ============================================================ at(u) ======== */
export function at(u, _ctx) {
  const h = hold(u, { breathSec: 4.1, dur: seconds });
  return {
    u,
    iona: u < IONA_LETS_GO ? 1 : 0,
    mara: u >= MARA_TAKES ? 1 : 0,
    both: u >= MARA_TAKES && u < IONA_LETS_GO,
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
     measure-frames.mjs put this scene at 4.2% ink coverage — an object floating
     on a blank page for 13.5 seconds — and I first tried to fix it by pushing the
     lens in, which made it worse, because zooming does not create ink. There
     was nothing behind the subject to get closer to.

     The mill HAS surfaces. BF-17 stands Iona against a brick wall over a stone
     floor eight scenes earlier, in this same lobby, from the same plan. This
     crop is lower and tighter, so we are against the wall rather than looking
     down the room — but it is the same wall, and an exchange happening in front
     of it is an exchange happening somewhere. */
  lobbyWall(g, -20, NW + 20, -160, 470, { seed: 63, columns: [] });
  brokenLine(g, -20, NW + 20, 470, 55, { lw: 6, segs: 4, gap: 0.03 });
  stoneFloor(g, 470, NH + 20, -20, NW + 20, { seed: 64, courses: 3 });

  /* the deniable residue, in pixels: 4 up and down, 3 side to side, over 4.5s */
  const dy = s.breath * 4 - 2, dx = s.weight * 3;
  const cx = CX + dx, cy = CY + dy;

  /* ---- IONA'S HAND, UNDER it and BEHIND it — drawn first, and placed low
     enough that only the heel and the outer fingers clear the canister's rim.
     PASS 2: at R*0.86 centred on the object, a whole palm silhouette buried it.
     A hand that is holding something out is mostly behind the something. */
  if (s.iona) fingersOver(g, cx - R * 0.66, cy - R * 0.30, R * 0.44,
    { dir: Math.PI - 0.20, age: 1, count: 3, spread: 0.56 });

  /* ---- THE CANISTER. It does not move. Only the hands do. */
  canister(g, cx, cy, R, { tilt: s.tilt * 0.030, scales: 9, seed: 17 });

  /* ---- MARA'S FINGERS, on the near rim, and nothing else of her hand: the
     hand that takes an object is in front of it, so drawing all of it would
     delete the object and the object is the unit. */
  /* and her thumb, IN FRONT of the near rim: three fingers behind and one in
     front is what holding a flat thing out on an open hand looks like. */
  if (s.iona) fingersOver(g, cx - R * 0.50, cy + R * 0.42, R * 0.34,
    { dir: Math.PI - 0.55, age: 1, count: 1 });

  if (s.mara) {
    const k = clamp01((s.u - MARA_TAKES) / 0.16);
    /* dir 0.10, not PI: fingersOver lays its tips toward LOCAL -x, so a hand
       arriving from the right and closing on the object is dir ~0. At PI they
       pointed away from the tin and read as a hand leaving. */
    fingersOver(g, cx + R * 0.52, cy - R * 0.10, R * 0.46,
      { dir: 0.10, age: 0, count: 4, reach: 0.55 + 0.45 * k });
  }

  g.restore();
}

/* ---- occupancy ---------------------------------------------------------- */
export const INITIAL = exitOccupancyBF17;
export const MOVES   = MOVES_BF18;
export const exitOccupancy = occupancyAt(theMill, MOVES, 6, INITIAL);

export const SCENE_VERSION = "bf-motion/1.0.0";
