/* ============================================================================
   BF-17 · YOU HAVE HER SHOULDERS     INT. MILL · THE LOBBY — NOON   the-mill

     "A small woman in a navy coat with a flattened fur collar, holding a
      grocery bag darkened at the bottom. Lavender protrudes from it in a thick
      bundle. She looks not up the stairs but at their reflection in the glass
      door. Her face has an unfinished quality — expressions arriving before the
      features can contain them."                         — atlas/source.json
     IONA: "You have her shoulders."   MARA: "Are you Iona Ash?"

   MOTION: HOLD · 5.0s · 60 frames @12fps.

   ---------------------------------------------------------------------------
   THE ROOM HOLDS AND HER FACE DOES NOT. THAT IS THE WHOLE SCENE.

   MOTION-BRIEF rule 3: "HOLD is not a freeze… the breath is 4.1s and should be
   DENIABLE — a viewer should not be able to say for certain that anything
   moved." That is the room, and it is drawn with hold(): a stone floor, a brick
   wall and a woman standing still in a lobby at noon.

   Over the top of it runs `expression_early`, which is the opposite of
   deniable. Her own module authors it and says why: "Two clocks. The EXPRESSION
   runs at u + LEAD; the FACE — the head, the neck, the jaw, the whole carriage
   that would ordinarily arrive with it — runs at u… There is no frame in this
   cycle where the face and the expression agree, and that is the point."

   So the unit is a HOLD with one thing inside it that is not holding. If both
   layers breathed at the same rate this scene would be a woman standing in a
   lobby; the disagreement is what "an unfinished quality" is, and a still frame
   cannot hold it, which is why this world animates.

   ---------------------------------------------------------------------------
   WHY THIS IS NOT A TWO-SHOT, and the plan is the argument.

   the-mill authors a sightline, `sightline_iona_to_the_door`, with a note:
   "BF-17: 'She looks not up the stairs but at their reflection in the glass
   door.' She is facing the NEAR edge of the frame while Mara comes down the FAR
   one. They are looking at each other through the exit."

   A two-shot puts them face to face and deletes that. So Mara is not in the
   frame: she is behind the lens, at the foot of the stairs, and Iona is looking
   past the camera at the glass. `stair_foot` IS in the frame, at the left, empty
   and waiting, which is where Mara is about to be. The reflection itself belongs
   to BF-20, which is the unit that owns the glass door.

   And it buys the scene the one thing it cannot do without: at this crop her
   face is 150px across, which is enough dots for the arriving to register. In a
   two-shot it is 60px, which is eight, and the unit's only content dies.

   DECLARED DISCONTINUITIES: none.

   COMPOSITION. One subject: a face arriving before its features.
   ========================================================================= */
import { hold, framesFor, TAU, clamp01 } from "../engine/motion.mjs";
import { INK, inkLevel, lerp } from "../engine/halfworld-engine.mjs";
import { occupancyAt } from "../engine/blocking.mjs";
import { theMill, MOVES_BF17 } from "./_plans/the-mill.mjs";
import { lens, NW, NH, BODY_H } from "../assets/set/_stage.mjs";
import { lobbyWall, stoneFloor, stairFlight } from "../assets/set/mill.mjs";
import { LV, brokenLine } from "../assets/set/_kit.mjs";
import { exitOccupancy as exitOccupancyBF16 } from "./BF-16.mjs";
import iona from "../assets/character/iona.mjs";

/* ---- the motion scene contract ------------------------------------------ */
export const id         = "BF-17";
export const title      = "YOU HAVE HER SHOULDERS";
export const place      = "INT. MILL · THE LOBBY";
export const plan       = "the-mill";
export const motion     = "HOLD";
export const beats      = null;
export const seconds    = 5.0;
export const loopClosed = false;
export const frames     = framesFor(motion, seconds, 12);      // 60
export const declaredBreak = null;
export const breakAt    = null;

export const subject  = "a face arriving before its features can contain it";
export const distance = "MEDIUM";
export const leftOut  = [
  "Mara — she is behind the lens at the foot of the stairs; the plan's sightline says so",
  "the glass door and the reflection in it (BF-20 owns the door)",
  "Niko — the plan keeps him at the stairhead until BF-18",
  "the grey dress and the narrow white collar under the coat: the coat is closed here",
];

/* ---- framing ------------------------------------------------------------ */
const ZOOM   = 1.6;
const BODY_K = 0.79;                     // MEDIUM: she stands 618px in a 760 frame
const station = lens(theMill, { zoom: ZOOM, cx: 0.5939, cy: 0.5392 });
const IONA  = station("iona_stand");
const FOOT  = station("stair_foot");
const WEST  = station("stone_floor_west");
const EAST  = station("stone_floor_east");
const FAR   = station("lobby_far");
/* lens() already folds ZOOM into p.scale, so BODY_K is the only extra term. */
const bodyH = (p) => BODY_H * p.scale * BODY_K;

/* ============================================================ at(u) ========
   PURE. Two clocks and nothing else. */
export function at(u, _ctx) {
  const h = hold(u, { breathSec: 4.1, dur: seconds });
  return {
    u,
    // the room. Deniable: a 4.1s breath and a 7.0s sway, both under 1% of frame.
    room: h,
    // the face. Not deniable, on purpose. Her module's own two-clock motion.
    face: iona.motions.expression_early(u),
  };
}

/* ============================================================ draw() ======= */
export function draw(g, W, H, s) {
  g.save();
  g.scale(W / NW, H / NH);
  g.lineJoin = "round"; g.lineCap = "round";

  const bh = bodyH(IONA);
  /* PASS 2: the wall/floor join was set from her HEAD height, which put the
     horizon 52px down the frame and made the lobby 93% stone floor. The join is
     the far end of the ROOM: lobby_far, the station the plan gives it. */
  const horizon = FAR.y;

  /* ---- the lobby. Plaster above the dado, brick below it, stone underfoot —
     authored once in set.mill so all six lobby units are one room. */
  lobbyWall(g, -20, NW + 20, -170, horizon, { seed: 44, columns: [0.13, 0.72] });
  brokenLine(g, -20, NW + 20, horizon, 55, { lw: 6, segs: 4, gap: 0.03 });
  stoneFloor(g, horizon, NH + 20, -20, NW + 20, { seed: 21, courses: 4 });

  /* ---- the foot of the stairs at the left: EMPTY, and it is the only thing in
     the frame that is about to matter. Four nosings, a newel and a handrail. */
  stairFlight(g, { x: FOOT.x - 96, y: FOOT.y - 150 }, { x: FOOT.x, y: FOOT.y },
    { steps: 4, wTop: bh * 0.46, wBot: bh * 0.62, seed: 12, stringer: false, lw: 6 });
  g.strokeStyle = INK; g.lineWidth = 9; g.lineCap = "round";
  g.beginPath();
  g.moveTo(FOOT.x + bh * 0.30, FOOT.y);
  g.lineTo(FOOT.x + bh * 0.30, FOOT.y - bh * 0.40);
  g.lineTo(FOOT.x - bh * 0.24, FOOT.y - bh * 0.62);
  g.stroke();

  /* ---- IONA. Whole, clear of every edge, facing the near edge of the frame. */
  const st = {
    ...iona.states.nodes.lobby.preview,
    ...s.face,
    bag: true, guise: "coat",
    gaze: { x: -0.56, y: 0.02 },
  };
  /* the room's own breath rides UNDER the face's, at a tenth of its amplitude:
     the sway is 4px over five seconds, which is the deniable part. */
  st.rig = {
    ...st.rig,
    pelvisX: (st.rig?.pelvisX || 0) + s.room.weight * 0.024,
    shoulderTilt: (st.rig?.shoulderTilt || 0) + s.room.tilt * 0.010,
  };
  const w = bh * 0.46;
  g.save();
  g.translate(IONA.x - w, IONA.y - bh);
  iona.draw(g, w * 2, bh, st);
  g.restore();

  g.restore();
}

/* ---- occupancy ---------------------------------------------------------- */
export const INITIAL = { ...exitOccupancyBF16, iona: "iona_stand" };
export const MOVES   = MOVES_BF17;
export const exitOccupancy = occupancyAt(theMill, MOVES, 6, INITIAL);

export const SCENE_VERSION = "bf-motion/1.0.0";
