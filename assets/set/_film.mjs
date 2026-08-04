/* assets/set/_film.mjs — 8mm FILM, AND WHAT IS ON IT.
   ============================================================================
   Act III's other apparatus. Used by BF-31 (the strip advanced between her
   fingers) and BF-36 (the strip paying out across the floor).

   ---------------------------------------------------------------------------
   WHY THE FRAMES ARE DRAWN HERE AND NOT IN THE SCENES

   BF-31's strip and BF-36's strip are the SAME FILM. The glasshouse frames Mara
   advances past the fluorescent tube in BF-31 are three of the frames that
   become "briefly visible" when the reel rolls into the pool in BF-36, and Niko
   "lifts it to the light and sees only the glasshouse" in the same unit. If two
   scenes drew those frames independently they would be two films, and the story
   is that there is one.

   ---------------------------------------------------------------------------
   WHAT A FRAME CAN BE AT THIS SIZE

   A frame on this strip is about 44 x 40 source pixels — eleven halftone dots
   by ten. That is not enough for a picture and it is exactly enough for a
   PICTOGRAM: three or four strokes, one closed silhouette, one value. Every
   frame in this file is built to that budget and none of them has a face,
   because a face at ten dots is a smudge and a smudge reads as a printing
   fault rather than as a person.

   The frames are also drawn in the ink levels of the world, on a light ground,
   because they are a POSITIVE image seen by transmitted light: the strip is
   held up to a fluorescent tube. A negative would be the correct object and the
   wrong drawing — you cannot read a negative at eleven dots.
   ========================================================================= */
import { INK, PAPER, inkLevel } from "../../engine/halfworld-engine.mjs";

const TAU = Math.PI * 2;
const L = (l) => inkLevel(l);

/* ==========================================================================
   THE STRIP.  Drawn between two points — in BF-31 the two hands the rig
   reported, so the film moves and the fingers do not.

     adv       the object returned by advance(): { index, shift, settled }
     count     how many frames are ON the strip (its content length)
     frameAt   (g, contentIndex, w, h) -> paints one frame in its own box,
               origin at the box centre, +y down.

   The PERFORATIONS are on one edge only. 8mm has one per frame, and drawing two
   edges of them at this pitch eats the picture area and turns the strip into a
   ladder.
   ========================================================================== */
export function filmStrip(g, ax, ay, bx, by, {
  width = 60, count = 8, adv = null, frameAt = null, span = 1.0, ink = 4,
} = {}) {
  const dx = bx - ax, dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  const ang = Math.atan2(dy, dx);
  const pitch = width * 0.86;
  const half = (len * span) / 2 + pitch;

  g.save();
  g.translate((ax + bx) / 2, (ay + by) / 2);
  g.rotate(ang);

  // the base: the acetate. Light, because it is being looked THROUGH.
  g.fillStyle = L(1); g.strokeStyle = INK; g.lineWidth = 3.6;
  g.beginPath(); g.rect(-half, -width / 2, half * 2, width); g.fill(); g.stroke();

  const off = -(adv ? (adv.index + adv.shift) : 0) * pitch;
  const first = Math.floor((-half - off) / pitch) - 1;
  const last = Math.ceil((half - off) / pitch) + 1;

  for (let i = first; i <= last; i++) {
    const cx = i * pitch + off;
    if (cx + pitch / 2 < -half || cx - pitch / 2 > half) continue;
    // the frame line between this frame and the next
    g.strokeStyle = INK; g.lineWidth = 3.0;
    g.beginPath(); g.moveTo(cx - pitch / 2, -width / 2); g.lineTo(cx - pitch / 2, width / 2); g.stroke();
    // the perforation, one per frame, on the upper edge
    g.fillStyle = L(0);
    g.beginPath(); g.rect(cx - pitch * 0.16, -width * 0.46, pitch * 0.32, width * 0.16); g.fill();
    g.strokeStyle = INK; g.lineWidth = 1.8; g.stroke();
    // the picture area
    const pw = pitch * 0.86, ph = width * 0.58;
    g.save();
    g.beginPath(); g.rect(cx - pw / 2, -width * 0.20, pw, ph); g.clip();
    g.translate(cx, -width * 0.20 + ph / 2);
    g.fillStyle = L(ink === 0 ? 0 : 0);
    g.fillRect(-pw / 2, -ph / 2, pw, ph);
    if (frameAt) {
      const idx = ((i % count) + count) % count;
      frameAt(g, idx, pw, ph);
    }
    g.restore();
  }
  g.restore();
  return { pitch, ang, len };
}

/* ==========================================================================
   THE GLASSHOUSE FRAMES — what is on the film, 1945.

     "The child straightens. The woman turns. The butterfly descends."   BF-31
     "He lifts it to the light and sees only the glasshouse."            BF-31

   Three motifs and one intruder. Each is drawn to a 44x40 budget: a horizon, a
   silhouette, and at most two interior strokes.
   ========================================================================== */

/** a glazing bar and the painted glass behind it — the ground of every 1945
 *  frame, so all of them are provably the same room. */
function glasshouseGround(g, w, h) {
  g.fillStyle = L(1); g.fillRect(-w / 2, -h / 2, w, h);
  g.strokeStyle = L(3); g.lineWidth = 1.6;
  for (const fx of [-0.26, 0.26]) {
    g.beginPath(); g.moveTo(fx * w, -h / 2); g.lineTo(fx * w, h * 0.10); g.stroke();
  }
  g.beginPath(); g.moveTo(-w / 2, -h * 0.16); g.lineTo(w / 2, -h * 0.16); g.stroke();
  // the floor of the glasshouse
  g.fillStyle = L(2); g.fillRect(-w / 2, h * 0.16, w, h * 0.34);
}

/** a child, from behind. Two strokes and a head. `rise` 0..1 straightens it. */
function child(g, x, s, rise, tone = 5) {
  g.save(); g.translate(x, 0); g.scale(s, s);
  g.fillStyle = L(tone);
  g.beginPath(); g.arc(0, -9 - rise * 3, 3.4, 0, TAU); g.fill();
  g.strokeStyle = L(tone); g.lineCap = "round"; g.lineWidth = 4.2;
  g.beginPath();
  g.moveTo(0, -6 - rise * 3);
  g.quadraticCurveTo(rise * 0.5, 0, -1.2 + rise * 1.2, 9);
  g.stroke();
  g.restore();
}

export const GLASSHOUSE_FRAMES = {
  /* "The child straightens." The middle one of the three does; the outer two
     do not, which is what makes it an event rather than a camera move. */
  child_straightens(g, w, h, k = 1) {
    glasshouseGround(g, w, h);
    /* PASS 2: these were drawn at h/34 and came out seventeen pixels tall in a
       sixty-four pixel frame — four halftone dots, i.e. nothing. A pictogram has
       to FILL its frame or it is not a pictogram, it is dirt on the film. */
    child(g, -w * 0.28, h / 19, 0);
    child(g, 0, h / 17, k);
    child(g, w * 0.28, h / 19, 0);
  },
  /* "The woman turns." A single upright silhouette and a tray. She is drawn
     with the SHOULDER WIDTH the cast module gives Mara — see _glasshouse.mjs,
     which imports the number rather than choosing one. */
  woman_turns(g, w, h, k = 1, shoulders = 1.12) {
    glasshouseGround(g, w, h);
    const s = h / 17;
    g.save(); g.translate(w * 0.04, h * 0.06); g.scale(s, s);
    g.fillStyle = L(6);
    g.beginPath(); g.arc(0, -8.5, 3.0, 0, TAU); g.fill();
    g.beginPath();                                  // torso: the shoulders ARE her
    g.moveTo(-4.6 * shoulders, -4.4); g.lineTo(4.6 * shoulders, -4.4);
    g.lineTo(3.0, 9.5); g.lineTo(-3.0, 9.5); g.closePath(); g.fill();
    g.strokeStyle = L(2); g.lineWidth = 2.0;        // the tray
    g.beginPath(); g.moveTo(-6.5, 1.4); g.lineTo(6.5, 1.4); g.stroke();
    g.restore();
  },
  /* "The butterfly descends." One shape, falling. `k` takes it down the frame. */
  butterfly_descends(g, w, h, k = 1) {
    glasshouseGround(g, w, h);
    const y = -h * 0.30 + k * h * 0.46, s = h / 13;
    g.save(); g.translate(-w * 0.04, y); g.scale(s, s);
    g.fillStyle = L(6);
    for (const sx of [-1, 1]) {
      g.beginPath();
      g.moveTo(0, 0);
      g.quadraticCurveTo(sx * 5.0, -4.4, sx * 5.6, 0.6);
      g.quadraticCurveTo(sx * 3.0, 2.4, 0, 1.2);
      g.closePath(); g.fill();
    }
    g.fillRect(-0.7, -2.2, 1.4, 5.0);
    g.restore();
  },
  /* THE INTRUDER. "The next frame shows Mara herself standing in the lobby with
     the canister in her hands." A different room — a stair rail and a glass
     door instead of glazing bars — and a figure holding a disc. */
  mara_in_the_lobby(g, w, h, k = 1, shoulders = 1.12) {
    g.fillStyle = L(0); g.fillRect(-w / 2, -h / 2, w, h);
    g.fillStyle = L(2); g.fillRect(w * 0.16, -h / 2, w * 0.34, h);   // the glass door
    g.strokeStyle = L(4); g.lineWidth = 1.6;                          // the stair
    g.beginPath();
    g.moveTo(-w / 2, h * 0.06); g.lineTo(-w * 0.12, -h * 0.24);
    g.stroke();
    g.fillStyle = L(2); g.fillRect(-w / 2, h * 0.30, w, h * 0.20);    // the floor
    const s = h / 17;
    g.save(); g.translate(-w * 0.10, h * 0.06); g.scale(s, s);
    g.fillStyle = L(6);
    g.beginPath(); g.arc(0, -8.0, 3.0, 0, TAU); g.fill();
    g.beginPath();
    g.moveTo(-4.4 * shoulders, -4.0); g.lineTo(4.4 * shoulders, -4.0);
    g.lineTo(2.8, 8.4); g.lineTo(-2.8, 8.4); g.closePath(); g.fill();
    g.fillStyle = L(0);                              // the canister, in both hands
    g.beginPath(); g.arc(0, 1.6, 2.6, 0, TAU); g.fill();
    g.strokeStyle = L(7); g.lineWidth = 1.2; g.stroke();
    g.restore();
  },
};

export const FILM_VERSION = "film/1.0.0";
