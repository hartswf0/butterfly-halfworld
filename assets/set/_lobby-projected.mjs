/* assets/set/_lobby-projected.mjs — THE MILL LOBBY, THIRTY MINUTES AGO,
   AS A PROJECTED IMAGE.                                     (ACT III · BF-35)
   ============================================================================
     "She now sees the laboratory lobby: Iona handing her the canister, Niko
      dropping the orange cup, the butterfly striking the door."
     "Within the projected image, the small projected Mara turns toward the
      camera. Her lips move. This time there is sound."          — BF-35

   ---------------------------------------------------------------------------
   THIS FILE DRAWS NO ROOM. IT IMPORTS ONE.

   BF-35 re-stages Act II's own frames. My brief says to quote their composition
   rather than invent a new one, and at the time of writing scenes/BF-18.mjs and
   scenes/BF-25.mjs DO NOT EXIST — scenes/ contains BF-01 and my own act. So the
   staging comes from the atlas beats, which is what the brief says to fall back
   to:

     BF-17  "A small woman in a navy coat with a flattened fur collar, holding a
             grocery bag darkened at the bottom." "She looks not up the stairs
             but at their reflection in the glass door."
     BF-18  "A dented circular canister no wider than her palm. Rust spreads
             from the hinge in branching lines. Around the edge, black
             electrical tape."
     BF-19  "Niko reaches for the canister. Mara moves it away from him."
     BF-25  "The butterfly climbs the white brightness of the door. Impact.
             Drop. Recovery." "The orange cup breaks without drama, pieces
             sliding apart over the stone." "Niko shoves the crash bar."

   But the ROOM is not re-invented. assets/set/mill.mjs is Act II's set asset and
   it already authors this lobby — lobbyWall, stairFlight, glassDoor, stoneFloor
   and orangeCup — so those are imported and called, READ-ONLY. Nothing in this
   file writes to that module. The projection is therefore provably the same
   lobby the mill scenes are shot in, at a smaller size, which is the whole claim
   BF-35 makes: this is not a picture of the lobby, it is the lobby.

   THE FIGURES ARE THE CAST MODULES. Iona in her coat at io_offering, Niko at
   nk_crashbar with the cup already gone, Mara receiving. Same rigs, same poses
   the cast agent authored for those units. A projected person drawn by hand
   here would be a different person.
   ========================================================================= */
import { INK, PAPER, inkLevel } from "../../engine/halfworld-engine.mjs";
import { lobbyWall, stairFlight, glassDoor, stoneFloor, orangeCup } from "./mill.mjs";
import { placeFigure } from "./_facility-lens.mjs";
import mara from "../character/mara.mjs";
import iona from "../character/iona.mjs";
import niko from "../character/niko.mjs";
import { asset as oldbutterfly } from "../creature/oldbutterfly.mjs";
import { placeCreature } from "./_facility-lens.mjs";

const TAU = Math.PI * 2;
const L = (l) => inkLevel(l);

/* THE CANISTER. "A dented circular canister no wider than her palm ... around
   the edge, black electrical tape. Beneath the rust, a fragment of white label."
   Drawn here rather than imported because assets/set/canister.mjs is another
   act's asset authored at card scale, and at 26px across what survives is a
   disc, a tape band and one label fragment. Three marks. */
function canister(g, x, y, r) {
  g.fillStyle = L(2); g.strokeStyle = INK; g.lineWidth = 3;
  g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.stroke();
  g.strokeStyle = INK; g.lineWidth = r * 0.34;         // the electrical tape
  g.beginPath(); g.arc(x, y, r * 0.86, -0.4, 2.2); g.stroke();
  g.fillStyle = PAPER;                                  // the label fragment
  g.beginPath(); g.rect(x - r * 0.34, y - r * 0.20, r * 0.62, r * 0.30); g.fill();
}

/* ==========================================================================
   THE LOBBY.

   rect   the projected image's rectangle
   turn   0..1  the projected Mara turning toward the camera
   speak  0..1  her jaw, quantised — "This time there is sound."
   strike 0..1  the butterfly's beat against the glass
   spread 0..1  the three pieces of the cup sliding apart over the stone
   ========================================================================== */
export function lobbyProjected(g, rect, { turn = 0, speak = 0, strike = 0, spread = 1 } = {}) {
  const { x, y, w, h } = rect;
  g.save();
  g.beginPath(); g.rect(x, y, w, h); g.clip();

  // the field of a projected positive: paper.
  g.fillStyle = PAPER; g.fillRect(x, y, w, h);

  const floorY = y + h * 0.74;
  lobbyWall(g, x - 10, x + w + 10, y - h * 0.06, floorY,
            { seed: 44, dado: 0.60, columns: [0.20, 0.80], colW: Math.max(12, w * 0.022) });
  stoneFloor(g, floorY, y + h + 10, x - 10, x + w + 10, { seed: 21, courses: 5 });

  // the stair at the left, going up out of the frame
  stairFlight(g, { x: x + w * 0.14, y: y + h * 0.16 }, { x: x + w * 0.08, y: floorY - h * 0.02 },
              { steps: 6, wTop: w * 0.16, wBot: w * 0.26, seed: 12, lw: 3.2,
                stringer: false });   // its own note: a stringer on a short flight shoots off at the join

  /* THE GLASS ENTRANCE DOOR, at the right, and it is the brightest thing in the
     lobby: "through the glass the street stands WHITE in the noon heat." That is
     also what the butterfly is climbing. */
  const dw = w * 0.30, dh = h * 0.52;
  const dx = x + w * 0.62, dy = floorY - dh;
  glassDoor(g, dx, dy, dw, dh, { crash: true, street: 1, seed: 33, leaves: 2 });

  /* THE BUTTERFLY ON THE DOOR. creature.oldbutterfly, at its own `strike`
     state — the animal that came out of the canister, climbing the white
     brightness. Small, on the glass, in front of it. */
  placeCreature(g, oldbutterfly, {
    closure: 0.30 - 0.16 * strike, cy: 0.52 - 0.28 * strike, tilt: -0.14, wear: 0.5,
  }, { cx: dx + dw * 0.44, cy: dy + dh * 0.34, size: h * 0.22 });

  /* THE THREE PIECES OF THE CUP, on the stone. BF-25: "The orange cup breaks
     without drama, pieces sliding apart over the stone." It is already broken —
     this is thirty minutes ago and the cup went ten minutes into it — so what is
     on the floor is three pieces, not a cup. orangeCup() draws a whole one, so
     what is used here is its value and not its shape: level 4 against level 1,
     "the one mid-tone object in a frame that is otherwise white door and pale
     stone", as the mill module puts it. */
  g.save();
  g.fillStyle = L(4); g.strokeStyle = INK; g.lineWidth = 2.6;
  const cxp = x + w * 0.50, cyp = floorY + h * 0.13;
  for (const [ax, ay, rr] of [[-1, 0.2, 1.0], [0.7, -0.3, 0.8], [1.7, 0.5, 0.62]]) {
    const px = cxp + ax * w * 0.070 * (0.4 + spread), py = cyp + ay * h * 0.03;
    g.beginPath();
    g.moveTo(px, py);
    g.quadraticCurveTo(px + w * 0.040 * rr, py - h * 0.055 * rr, px + w * 0.066 * rr, py);
    g.closePath(); g.fill(); g.stroke();
  }
  g.restore();

  /* THE THREE OF THEM. Iona offering, Mara taking, Niko at the door.
     Separated in depth and never overlapping: the frame is 740px wide inside a
     projection and three bodies in it is already the limit. */
  const bh = h * 0.44;

  placeFigure(g, iona, {
    pose: "io_offering", guise: "coat", bag: false, t: 0.5,
    gaze: { x: 0.30, y: 0.12 },
    rig: { bodyYaw: 0.55, headYaw: 0.35, chestLift: 0.30 },
  }, { footX: x + w * 0.26, footY: floorY + h * 0.16, height: bh });

  /* THE PROJECTED MARA. She starts with her back to the camera — she is taking
     the canister from Iona — and TURNS. bodyYaw runs PI -> 0 with `turn`, which
     is the one rotation in this act that completes.
     Her mouth is driven by `speak`, quantised: a jaw that opens on a schedule
     rather than on a curve, because a mouth that eases reads as a yawn. */
  const mBody = placeFigure(g, mara, {
    pose: "mv_wrist", guise: "bare", box: false, t: 0.5,
    jaw: speak, mouth: 0,
    gaze: { x: 0, y: 0.06 },
    rig: {
      bodyYaw: Math.PI * (1 - turn),
      headYaw: Math.PI * (1 - turn) * 0.86,
      chestLift: 0.34,
      armRUpper: -0.86, armRLower: 0.92,
      armLUpper: 0.62, armLLower: -1.02,
    },
  }, { footX: x + w * 0.41, footY: floorY + h * 0.20, height: bh * 1.06 });

  // the canister, between the two of them, in her hands
  const R = mBody.anchors.rightHand || { x: x + w * 0.36, y: floorY - h * 0.10 };
  canister(g, R.x, R.y, Math.max(7, w * 0.020));

  placeFigure(g, niko, {
    pose: "nk_crashbar", guise: "empty", cup: false, shards: false, t: 0.5,
    gaze: { x: 0.30, y: 0.04 },
    rig: { bodyYaw: 0.42, headYaw: 0.30, chestLift: 0.36 },
  }, { footX: x + w * 0.70, footY: floorY + h * 0.10, height: bh * 0.94 });

  g.restore();
  return rect;
}

export const LOBBY_PROJECTED_VERSION = "lobby-projected/1.0.0";
