/* assets/set/_nine-frames.mjs — NINE IMAGES FROM NINE OTHER FILMS.
   ============================================================================
     "Therefore every frame between the cart and the water becomes briefly
      visible: A man raising his hand. A woman in a green dress. A burning barn.
      A hotel corridor. A child on an airport platform. A face reflected in an
      artificial eye. A car sinking through blue light. A witness pointing
      across a courtroom. A dead wife opening her eyes on a space station."
                                                                     — BF-36

   Nine frames, in the order the plan's `reelRollRun` lays them out from the cart
   to the water. One station each; one advance index each. They are GLIMPSES, so
   each one holds for three rendered frames at 12fps — a quarter of a second —
   and then it is gone and does not come back.

   ---------------------------------------------------------------------------
   THE BUDGET, AND WHY IT IS DIFFERENT FROM _film.mjs'

   The frames on the strip lying across the floor are 26 source pixels wide,
   because that is what the plan's nine stations measure at the widest lens in
   the act. Nothing legible fits in 26px. But BF-36 throws the frame that is
   crossing the beam onto the white rectangle, where it is ~300 x 240 — and at
   that size these are drawings and not pictograms. So each function here works
   at BOTH sizes: a strong two-value silhouette that survives 26px, carrying
   detail that only appears at 300.

   ---------------------------------------------------------------------------
   COLOUR IS NOT AVAILABLE AND SAYS SO

   "A woman in a GREEN dress." "A car sinking through BLUE light." BUILD-BRIEF
   trap 4: a colour accent prints black, because the post pass quantizes by
   luminance. So the green dress is a mid-value dress — the only mid-value in
   its frame — and the blue light is a DARK field with the car light against it.
   In both cases the colour word survives as the thing colour was doing in the
   shot (she is the one who is a different value from the room; the water is the
   thing that is darker than the car), and the hue itself is simply not in this
   world. Stated rather than faked.

   NO FACES EXCEPT TWO, AND BOTH ARE THE SUBJECT. The artificial eye has a face
   in it because the sentence is about a face being in it, and the dead wife has
   one because the sentence is about her eyes opening. Everywhere else the people
   are silhouettes.
   ========================================================================= */
import { INK, PAPER, inkLevel } from "../../engine/halfworld-engine.mjs";

const TAU = Math.PI * 2;
const L = (l) => inkLevel(l);

/* every frame starts with a ground and a horizon: the two marks that make a
   26px rectangle read as a picture rather than as a smudge. */
function ground(g, r, { sky = 0, floor = 2, horizon = 0.62 } = {}) {
  g.fillStyle = L(sky); g.fillRect(r.x, r.y, r.w, r.h);
  g.fillStyle = L(floor); g.fillRect(r.x, r.y + r.h * horizon, r.w, r.h * (1 - horizon));
  g.strokeStyle = L(floor + 2); g.lineWidth = Math.max(1.4, r.h * 0.012);
  g.beginPath();
  g.moveTo(r.x, r.y + r.h * horizon); g.lineTo(r.x + r.w * 0.44, r.y + r.h * horizon);
  g.moveTo(r.x + r.w * 0.54, r.y + r.h * horizon); g.lineTo(r.x + r.w, r.y + r.h * horizon);
  g.stroke();
}

/** a standing silhouette: head, trunk, two legs, one value. */
function fig(g, x, footY, h, { lev = 6, arm = 0, wide = 1, dress = false } = {}) {
  g.fillStyle = L(lev); g.strokeStyle = INK; g.lineWidth = Math.max(1.2, h * 0.020);
  const shY = footY - h * 0.78, hipY = footY - h * 0.44;
  const shW = h * 0.15 * wide;
  g.beginPath();
  g.moveTo(x - shW, shY); g.lineTo(x + shW, shY);
  if (dress) { g.lineTo(x + shW * 1.5, footY); g.lineTo(x - shW * 1.5, footY); }
  else { g.lineTo(x + h * 0.10, hipY); g.lineTo(x - h * 0.10, hipY); }
  g.closePath(); g.fill(); g.stroke();
  if (!dress) {
    g.lineWidth = h * 0.058; g.strokeStyle = L(lev);
    for (const sx of [-1, 1]) {
      g.beginPath(); g.moveTo(x + sx * h * 0.05, hipY); g.lineTo(x + sx * h * 0.06, footY); g.stroke();
    }
  }
  g.fillStyle = L(lev); g.strokeStyle = INK; g.lineWidth = Math.max(1.2, h * 0.018);
  g.beginPath(); g.ellipse(x, shY - h * 0.095, h * 0.072, h * 0.082, 0, 0, TAU); g.fill(); g.stroke();
  if (arm) {                                       // one raised arm, if asked
    g.strokeStyle = L(lev); g.lineWidth = h * 0.050; g.lineCap = "round";
    g.beginPath();
    g.moveTo(x + shW * 0.8, shY + h * 0.03);
    g.lineTo(x + shW * 1.5, shY - h * 0.22 * arm);
    g.stroke();
  }
}

export const NINE = {
  /* 1 — A MAN RAISING HIS HAND. One figure, one arm, an empty room behind it.
     The gesture is the whole frame, so nothing else in it moves or is drawn. */
  raised_hand(g, r) {
    ground(g, r, { sky: 0, floor: 1, horizon: 0.70 });
    fig(g, r.x + r.w * 0.44, r.y + r.h * 0.92, r.h * 0.62, { lev: 6, arm: 1 });
  },

  /* 2 — A WOMAN IN A GREEN DRESS. See the header: the hue is unavailable, so
     what survives is that she is the one VALUE in the frame that the room is
     not. Level 4 against a level 0 wall and a level 1 floor. */
  green_dress(g, r) {
    ground(g, r, { sky: 0, floor: 1, horizon: 0.74 });
    g.strokeStyle = L(2); g.lineWidth = Math.max(1.4, r.h * 0.010);   // a doorway behind
    g.beginPath(); g.rect(r.x + r.w * 0.62, r.y + r.h * 0.20, r.w * 0.22, r.h * 0.54); g.stroke();
    fig(g, r.x + r.w * 0.38, r.y + r.h * 0.94, r.h * 0.68, { lev: 4, dress: true });
  },

  /* 3 — A BURNING BARN. A gable, a black doorway, and flame drawn as DISCRETE
     TONGUES with hard edges. There is no glow in this world and a fire without
     hard edges is a smudge. */
  burning_barn(g, r) {
    ground(g, r, { sky: 0, floor: 1, horizon: 0.80 });
    const bx = r.x + r.w * 0.30, bw = r.w * 0.46, by = r.y + r.h * 0.34, bh = r.h * 0.46;
    g.fillStyle = L(3); g.strokeStyle = INK; g.lineWidth = Math.max(1.6, r.h * 0.014);
    g.beginPath();
    g.moveTo(bx, by + bh); g.lineTo(bx, by + bh * 0.34);
    g.lineTo(bx + bw / 2, by); g.lineTo(bx + bw, by + bh * 0.34); g.lineTo(bx + bw, by + bh);
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = INK;                                   // the doorway
    g.fillRect(bx + bw * 0.36, by + bh * 0.56, bw * 0.28, bh * 0.44);
    g.fillStyle = L(6);                                  // flame: five tongues
    for (let i = 0; i < 5; i++) {
      const fx = bx + bw * (0.14 + i * 0.18), fy = by + bh * 0.16;
      g.beginPath();
      g.moveTo(fx, fy);
      g.lineTo(fx + bw * 0.05, fy - bh * (0.30 + (i % 3) * 0.12));
      g.lineTo(fx + bw * 0.10, fy);
      g.closePath(); g.fill();
    }
    g.fillStyle = L(2);                                  // smoke: discrete lumps
    for (let i = 0; i < 4; i++) {
      g.beginPath();
      g.ellipse(bx + bw * (0.2 + i * 0.22), by - bh * (0.22 + i * 0.06),
                bw * 0.11, bh * 0.09, 0, 0, TAU);
      g.fill();
    }
  },

  /* 4 — A HOTEL CORRIDOR. One-point perspective: a runner, two walls of doors,
     and a vanishing point slightly off centre so it is a corridor and not a
     diagram. Nobody in it. */
  hotel_corridor(g, r) {
    g.fillStyle = L(0); g.fillRect(r.x, r.y, r.w, r.h);
    const vx = r.x + r.w * 0.54, vy = r.y + r.h * 0.50;
    g.fillStyle = L(2);                                   // the runner
    g.beginPath();
    g.moveTo(r.x + r.w * 0.10, r.y + r.h);
    g.lineTo(vx - r.w * 0.05, vy + r.h * 0.02);
    g.lineTo(vx + r.w * 0.05, vy + r.h * 0.02);
    g.lineTo(r.x + r.w * 0.92, r.y + r.h);
    g.closePath(); g.fill();
    g.strokeStyle = INK; g.lineWidth = Math.max(1.4, r.h * 0.010);
    for (const sx of [-1, 1]) {                           // the two walls
      g.beginPath();
      g.moveTo(vx + sx * r.w * 0.52, r.y - r.h * 0.05); g.lineTo(vx + sx * r.w * 0.06, vy - r.h * 0.06);
      g.moveTo(vx + sx * r.w * 0.52, r.y + r.h * 1.02); g.lineTo(vx + sx * r.w * 0.06, vy + r.h * 0.03);
      g.stroke();
      for (let i = 0; i < 3; i++) {                       // the doors
        const t = 0.20 + i * 0.24;
        const x0 = vx + sx * (r.w * 0.52 * (1 - t) + r.w * 0.06 * t);
        const yT = r.y - r.h * 0.05 + (vy - r.h * 0.06 - (r.y - r.h * 0.05)) * t;
        const yB = r.y + r.h * 1.02 + (vy + r.h * 0.03 - (r.y + r.h * 1.02)) * t;
        g.fillStyle = L(1); g.strokeStyle = INK;
        g.beginPath(); g.rect(x0 - sx * r.w * 0.055, yT + (yB - yT) * 0.16,
                              sx * r.w * 0.055, (yB - yT) * 0.68);
        g.fill(); g.stroke();
      }
    }
  },

  /* 5 — A CHILD ON AN AIRPORT PLATFORM. A railing, a small figure at it, and
     the tail of an aircraft beyond. The child is looking away from us, because
     everyone on a platform is. */
  airport_platform(g, r) {
    ground(g, r, { sky: 0, floor: 2, horizon: 0.72 });
    g.fillStyle = L(3); g.strokeStyle = INK; g.lineWidth = Math.max(1.4, r.h * 0.012);
    g.beginPath();                                         // a tail fin
    g.moveTo(r.x + r.w * 0.60, r.y + r.h * 0.70);
    g.lineTo(r.x + r.w * 0.72, r.y + r.h * 0.24);
    g.lineTo(r.x + r.w * 0.88, r.y + r.h * 0.24);
    g.lineTo(r.x + r.w * 0.92, r.y + r.h * 0.70);
    g.closePath(); g.fill(); g.stroke();
    fig(g, r.x + r.w * 0.30, r.y + r.h * 0.86, r.h * 0.34, { lev: 6 });
    g.strokeStyle = INK; g.lineWidth = Math.max(1.6, r.h * 0.014);   // the railing
    const ry = r.y + r.h * 0.74;
    g.beginPath();
    g.moveTo(r.x + r.w * 0.02, ry); g.lineTo(r.x + r.w * 0.44, ry);
    g.moveTo(r.x + r.w * 0.52, ry); g.lineTo(r.x + r.w * 0.98, ry);
    g.stroke();
    g.lineWidth = Math.max(1.2, r.h * 0.008);
    for (let i = 0; i <= 6; i++) {
      const x = r.x + r.w * (0.04 + i * 0.155);
      g.beginPath(); g.moveTo(x, ry); g.lineTo(x, ry + r.h * 0.16); g.stroke();
    }
  },

  /* 6 — A FACE REFLECTED IN AN ARTIFICIAL EYE. The eye fills the frame, and
     the face is a four-mark silhouette curved onto it. One of the two frames
     in this set that is allowed a face, because it is what the sentence is
     about. */
  artificial_eye(g, r) {
    g.fillStyle = L(1); g.fillRect(r.x, r.y, r.w, r.h);
    const cx = r.x + r.w * 0.50, cy = r.y + r.h * 0.50, R = Math.min(r.w, r.h) * 0.40;
    g.fillStyle = L(0); g.strokeStyle = INK; g.lineWidth = Math.max(1.8, r.h * 0.016);
    g.beginPath(); g.ellipse(cx, cy, R * 1.35, R, 0, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = L(4);                                   // the iris: a ring of spokes
    g.beginPath(); g.arc(cx, cy, R * 0.62, 0, TAU); g.fill();
    g.strokeStyle = INK; g.lineWidth = Math.max(1.2, r.h * 0.008);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU;
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * R * 0.30, cy + Math.sin(a) * R * 0.30);
      g.lineTo(cx + Math.cos(a) * R * 0.60, cy + Math.sin(a) * R * 0.60);
      g.stroke();
    }
    g.fillStyle = INK;
    g.beginPath(); g.arc(cx, cy, R * 0.26, 0, TAU); g.fill();
    // the reflection: a head and shoulders, small, on the wet of the eye
    g.fillStyle = PAPER;
    g.beginPath(); g.ellipse(cx - R * 0.34, cy - R * 0.30, R * 0.11, R * 0.14, 0, 0, TAU); g.fill();
    g.beginPath();
    g.moveTo(cx - R * 0.52, cy - R * 0.05);
    g.quadraticCurveTo(cx - R * 0.34, cy - R * 0.20, cx - R * 0.16, cy - R * 0.05);
    g.lineTo(cx - R * 0.20, cy + R * 0.10); g.lineTo(cx - R * 0.48, cy + R * 0.10);
    g.closePath(); g.fill();
  },

  /* 7 — A CAR SINKING THROUGH BLUE LIGHT. The blue is a DARK field; the car is
     the light thing in it, going away downward, with its own headlamps still on.
     Bubbles rise past it in discrete marks. */
  car_sinking(g, r) {
    g.fillStyle = L(5); g.fillRect(r.x, r.y, r.w, r.h);
    g.fillStyle = L(3); g.fillRect(r.x, r.y, r.w, r.h * 0.16);   // the surface, above
    g.strokeStyle = PAPER; g.lineWidth = Math.max(1.6, r.h * 0.012);
    g.beginPath();
    g.moveTo(r.x, r.y + r.h * 0.16); g.lineTo(r.x + r.w * 0.40, r.y + r.h * 0.15);
    g.moveTo(r.x + r.w * 0.50, r.y + r.h * 0.16); g.lineTo(r.x + r.w, r.y + r.h * 0.17);
    g.stroke();
    const cx = r.x + r.w * 0.46, cy = r.y + r.h * 0.62, cw = r.w * 0.46, ch = r.h * 0.22;
    g.save(); g.translate(cx, cy); g.rotate(0.28);
    g.fillStyle = L(1); g.strokeStyle = INK; g.lineWidth = Math.max(1.6, r.h * 0.012);
    g.beginPath();
    g.moveTo(-cw / 2, ch * 0.4); g.lineTo(-cw * 0.34, -ch * 0.1);
    g.lineTo(-cw * 0.12, -ch * 0.5); g.lineTo(cw * 0.18, -ch * 0.5);
    g.lineTo(cw * 0.36, -ch * 0.1); g.lineTo(cw / 2, ch * 0.4);
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = PAPER;                                  // the lamps, still on
    g.beginPath(); g.ellipse(-cw * 0.46, ch * 0.14, cw * 0.05, ch * 0.14, 0, 0, TAU); g.fill();
    g.restore();
    g.fillStyle = PAPER;                                  // bubbles
    for (let i = 0; i < 9; i++) {
      const bx = r.x + r.w * (0.14 + (i * 0.0973) % 0.76);
      const by = r.y + r.h * (0.20 + (i * 0.1613) % 0.5);
      g.beginPath(); g.arc(bx, by, Math.max(1.4, r.h * (0.010 + (i % 3) * 0.005)), 0, TAU); g.fill();
    }
  },

  /* 8 — A WITNESS POINTING ACROSS A COURTROOM. A rail, a raised arm going
     LEFT across the frame, and a bench of heads on the other side of it. The
     direction is the content, so the arm is horizontal and long. */
  courtroom(g, r) {
    ground(g, r, { sky: 0, floor: 1, horizon: 0.66 });
    g.fillStyle = L(2); g.strokeStyle = INK; g.lineWidth = Math.max(1.4, r.h * 0.012);
    g.beginPath(); g.rect(r.x + r.w * 0.58, r.y + r.h * 0.40, r.w * 0.40, r.h * 0.30);
    g.fill(); g.stroke();                                  // the bench
    g.fillStyle = L(5);
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.ellipse(r.x + r.w * (0.66 + i * 0.11), r.y + r.h * 0.38, r.w * 0.030, r.h * 0.048, 0, 0, TAU);
      g.fill();
    }
    fig(g, r.x + r.w * 0.26, r.y + r.h * 0.92, r.h * 0.56, { lev: 6 });
    g.strokeStyle = L(6); g.lineWidth = r.h * 0.030; g.lineCap = "round";
    g.beginPath();                                         // the pointing arm
    g.moveTo(r.x + r.w * 0.30, r.y + r.h * 0.52);
    g.lineTo(r.x + r.w * 0.54, r.y + r.h * 0.48);
    g.stroke();
    g.strokeStyle = INK; g.lineWidth = Math.max(1.6, r.h * 0.014);   // the rail
    g.beginPath();
    g.moveTo(r.x, r.y + r.h * 0.68); g.lineTo(r.x + r.w * 0.40, r.y + r.h * 0.68);
    g.stroke();
  },

  /* 9 — A DEAD WIFE OPENING HER EYES ON A SPACE STATION. A face, level, filling
     the frame, with a porthole behind it and the eyes OPEN — the only frame in
     this set in which anything is looking back. */
  space_station(g, r) {
    g.fillStyle = L(1); g.fillRect(r.x, r.y, r.w, r.h);
    const px = r.x + r.w * 0.76, py = r.y + r.h * 0.30, pr = Math.min(r.w, r.h) * 0.19;
    g.fillStyle = INK;
    g.beginPath(); g.arc(px, py, pr, 0, TAU); g.fill();
    g.strokeStyle = INK; g.lineWidth = Math.max(2.0, r.h * 0.020);
    g.beginPath(); g.arc(px, py, pr * 1.22, 0, TAU); g.stroke();
    g.fillStyle = PAPER;
    for (let i = 0; i < 5; i++) {
      g.beginPath();
      g.arc(px + Math.cos(i * 2.4) * pr * 0.6, py + Math.sin(i * 2.4) * pr * 0.6,
            Math.max(1.2, r.h * 0.007), 0, TAU);
      g.fill();
    }
    const fx = r.x + r.w * 0.40, fy = r.y + r.h * 0.62, fr = Math.min(r.w, r.h) * 0.34;
    g.fillStyle = L(2); g.strokeStyle = INK; g.lineWidth = Math.max(1.8, r.h * 0.016);
    g.beginPath(); g.ellipse(fx, fy, fr * 0.78, fr, 0, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = L(5);                                    // hair, spread
    g.beginPath(); g.ellipse(fx, fy - fr * 0.72, fr * 0.84, fr * 0.42, 0, 0, TAU); g.fill();
    g.fillStyle = PAPER; g.strokeStyle = INK; g.lineWidth = Math.max(1.4, r.h * 0.011);
    for (const sx of [-1, 1]) {                            // the eyes, open
      g.beginPath();
      g.ellipse(fx + sx * fr * 0.30, fy - fr * 0.10, fr * 0.19, fr * 0.12, 0, 0, TAU);
      g.fill(); g.stroke();
      g.fillStyle = INK;
      g.beginPath(); g.arc(fx + sx * fr * 0.30, fy - fr * 0.10, fr * 0.075, 0, TAU); g.fill();
      g.fillStyle = PAPER;
    }
    g.strokeStyle = INK; g.lineWidth = Math.max(1.4, r.h * 0.011);
    g.beginPath();
    g.moveTo(fx - fr * 0.20, fy + fr * 0.40); g.lineTo(fx + fr * 0.20, fy + fr * 0.40);
    g.stroke();
  },
};

/** the nine, in the plan's own order — reelRollRun, cart to water. */
export const NINE_ORDER = [
  "raised_hand", "green_dress", "burning_barn", "hotel_corridor",
  "airport_platform", "artificial_eye", "car_sinking", "courtroom",
  "space_station",
];

export const NINE_VERSION = "nine-frames/1.0.0";
