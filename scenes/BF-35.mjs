/* ============================================================================
   BF-35 · THEREFORE THE FILM CHANGED
                       INT. REARING FACILITY · THE WALL      plan: the-facility

     "Mara turns. Therefore the film changes."
     "She now sees the laboratory lobby: Iona handing her the canister, Niko
      dropping the orange cup, the butterfly striking the door."
     "Within the projected image, the small projected Mara turns toward the
      camera. Her lips move. This time there is sound."     — atlas/source.json

     PROJECTED MARA: "I remember being a butterfly."

   MOTION: DISSOLVE · 6.0s · 72 frames @12fps · loopClosed: false.

   ===========================================================================
   THE SAME SHOT AS BF-33. NOT A SIMILAR ONE.
   ===========================================================================
   The rectangle and the lens are IMPORTED from scenes/BF-33.mjs. "Therefore the
   film changed" — the film changes; the camera does not. If this file re-derived
   its own framing the two units would be two set-ups and the join between them
   would be a cut, which is exactly what the sentence denies. One number, one
   import, and the two units are provably the same set-up.

   ===========================================================================
   BOTH IMAGES THROUGH ONE THRESHOLD MAP
   ===========================================================================
   dotSwap() builds the two ownership sets as exact complements from a single
   Bayer-8 map and paints each cell once. Image A is _glasshouse.mjs' glasshouse
   — THE SAME FUNCTION BF-33 CALLED, so the thing being replaced is the thing
   that arrived, not a redrawing of it. Image B is the mill lobby.

   There is no alpha anywhere in this. At u = 0.5 exactly 32 of every 64 cells
   belong to 1945 and 32 to thirty minutes ago, and each of those cells is a
   complete drawing of its own image. That is what "the film changed" looks like
   when a film cannot fade.

   ===========================================================================
   RE-STAGING ACT II — AND WHAT WAS ACTUALLY AVAILABLE
   ===========================================================================
   My instruction was to read scenes/BF-18.mjs and BF-25.mjs and quote their
   composition rather than invent one. When this file was written THOSE FILES DID
   NOT EXIST — scenes/ held BF-01 and this act. They landed while Act III was
   rendering, and they were then read. Here is what they actually are, and why
   the staging below did not change:

     BF-18  subject "the canister, changing hands", distance CLOSE. It is a
            macro on a tin and two sets of fingers — no lobby in it at all.
     BF-25  subject "the instant the outside replaces the inside", distance
            MEDIUM, motion BREAK at u .58, with niko.motions.drop's own cup
            break at .42. It is the door and what comes through it.

   NEITHER IS A WIDE OF THE LOBBY, because neither unit is about the lobby. So
   there was no composition to quote for the shot this one needs, and the wide
   stays staged from the atlas beats of BF-17, BF-18, BF-19 and BF-25, quoted in
   assets/set/_lobby-projected.mjs. What IS quoted from them is the timing:
   Niko's cup is already in pieces here because BF-25 breaks it at u .42 of a
   unit that happens before this one, and this file's `spread` is 1 for that
   reason and not by eye.

   The ROOM, however, is not invented. assets/set/mill.mjs is Act II's set asset
   and it already authors this lobby — lobbyWall, stairFlight, glassDoor,
   stoneFloor — so those are imported and called READ-ONLY. The projection is
   provably the same lobby Act II shoots in. The bodies are the cast modules at
   the poses the cast agent authored for those units. Nothing about this lobby is
   a second lobby.

   ===========================================================================
   THE ONE ROTATION IN THIS ACT THAT COMPLETES
   ===========================================================================
   BF-34: Mara does not turn, four times. Here the SMALL PROJECTED MARA does —
   bodyYaw runs PI to 0 over u .62 to .86 — and then speaks. The real Mara is not
   in this frame and does not turn in it either. The film turns instead. That is
   the story's own answer to EliseTurnLock and it is why the reverse angle is
   never needed.

   Her jaw is driven by advance(), quantised: five openings at equal intervals,
   no easing between them. MOTION-BRIEF is explicit about this class of motion,
   and a mouth that eases reads as a yawn rather than as speech. "This time there
   is sound" is carried by the audio layer; what the picture can carry is that
   the mouth is working on a schedule.

   THE GATE STILL DOES NOT WEAVE. Nobody threaded anything in BF-33 and nobody
   has threaded anything since. weave stays 0.

   DECLARED DISCONTINUITIES: none. The swap is ordered and progressive.
   ========================================================================= */
import { advance, framesFor, clamp01, TAU } from "../engine/motion.mjs";
import { INK, PAPER, inkLevel } from "../engine/halfworld-engine.mjs";
import { occupancyAt } from "../engine/blocking.mjs";
import { theFacility } from "./_plans/the-facility.mjs";
import { makeLens, NW, NH } from "../assets/set/_facility-lens.mjs";
import { dotSwap } from "../assets/set/_dot-swap.mjs";
import { glasshouse, projectedGate } from "../assets/set/_glasshouse.mjs";
import { lobbyProjected } from "../assets/set/_lobby-projected.mjs";
import { beamWedge, screenRect, loadingRoomFloor } from "../assets/set/_facility.mjs";
import { PROJECTION, PROJECTION_LENS, exitOccupancy as INITIAL_FROM_BF33 } from "./BF-33.mjs";

/* ---- the motion scene contract ------------------------------------------ */
export const id         = "BF-35";
export const title      = "THEREFORE THE FILM CHANGED";
export const place      = "INT. REARING FACILITY · THE WALL";
export const plan       = "the-facility";
export const motion     = "DISSOLVE";
export const beats      = null;
export const seconds    = 6.0;
export const loopClosed = false;
export const frames     = framesFor(motion, seconds, 12);      // 72
export const declaredBreak = null;

export const subject    = "1945 being replaced, dot by dot, by thirty minutes ago";
export const distance   = "MEDIUM";
export const leftOut    = [
  "the real Mara. She turns at the pool, behind and to the right of this frame, " +
  "and the turn is the CAUSE — BF-34 ends on the fourth failed push and this " +
  "unit opens with the film already changing. Putting her in shot would make " +
  "the frame about a woman turning instead of about a film that changed because " +
  "she did",
  "Niko and Iona in the room. Both of them are inside the projection instead, " +
  "which is the only place in this act either of them appears twice",
  "the projector, 1350px off the right edge at this zoom, as in BF-33",
  "any gate weave, any frame bar, any flicker — nothing is threaded",
];

/* ---- the lens: BF-33's, imported ---------------------------------------- */
const lens = makeLens(theFacility, PROJECTION_LENS);
const RECT = PROJECTION;
const { x: SX, y: SY, w: SW, h: SH } = RECT;
const S = lens("screen_waiting");

const SWAP_IN = 0.14, SWAP_OUT = 0.70;
const TURN_IN = 0.62, TURN_OUT = 0.86;

/* ============================================================ at(u) ======== */
export function at(u, _ctx) {
  /* the projected Mara's jaw. Five openings, quantised, no easing across the
     join. advance() is the world's quantiser and speech is not a curve. */
  const sp = advance(clamp01((u - 0.84) / 0.16), 5, { dwell: 0.42 });
  return {
    u,
    swap: clamp01((u - SWAP_IN) / (SWAP_OUT - SWAP_IN)),
    turn: clamp01((u - TURN_IN) / (TURN_OUT - TURN_IN)),
    speak: u < 0.84 ? 0 : (sp.settled ? 0.42 : 0.06),
    /* the butterfly on the glass door, inside the film. Its beat is the strike
       cycle of the animal that came out of the canister; four impacts across the
       loop, an integer, so it introduces no step at the wrap. */
    strike: Math.abs(Math.sin(u * TAU * 2)),
    spread: 1,
    dust: u,
  };
}

/* ============================================================ draw() ======= */
export function draw(g, W, H, s) {
  g.save();
  g.scale(W / NW, H / NH);
  g.lineJoin = "round"; g.lineCap = "round";

  g.fillStyle = inkLevel(2); g.fillRect(0, 0, NW, NH);
  loadingRoomFloor(g, { x0: -10, x1: NW + 10, horizon: S.py + 44, bottom: NH, seed: 23 });
  beamWedge(g, NW + 120, SY + SH * 0.42, SX + SW + 6, SY - 20, SY + SH + 24,
            { level: 1, edge: true });
  screenRect(g, SX, SY, SW, SH, { sag: 7 });

  /* ======================= THE SWAP =======================
     A: 1945, from the same function BF-33 used, with the woman fully entered.
     B: the mill lobby, thirty minutes ago.
     One map, two complementary sets, every cell painted exactly once. */
  dotSwap(g, RECT, s.swap,
    (gg) => glasshouse(gg, RECT, { enter: 1, seed: 401 }),
    (gg) => lobbyProjected(gg, RECT, {
      turn: s.turn, speak: s.speak, strike: s.strike, spread: s.spread,
    }),
    { cell: 10 });

  projectedGate(g, RECT, { weave: 0 });

  /* the dust, still in the room and still the only unsteady thing in the shot */
  g.fillStyle = inkLevel(5);
  for (let i = 0; i < 9; i++) {
    const p = (s.dust + i * 0.1111) % 1;
    const x = SX + SW + 20 + p * 360;
    const y = SY + SH * 0.24 + Math.sin(p * TAU + i * 1.7) * SH * 0.30 + i * 6;
    g.beginPath(); g.arc(x, y, 4, 0, TAU); g.fill();
  }

  g.restore();
}

/* ---- occupancy ----------------------------------------------------------- */
export const INITIAL = INITIAL_FROM_BF33;
export const MOVES   = [];
export const exitOccupancy = occupancyAt(theFacility, MOVES, 6, INITIAL);

export const SCENE_VERSION = "bf-motion/1.0.0";
