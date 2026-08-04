/* character.elise — ELISE. Mara's mother. Dead. VOICE ONLY.
   CHARACTER asset for I REMEMBER BEING A BUTTERFLY (B01). She is cast in one
   unit, BF-34, and named in two more.

   ---------------------------------------------------------------------------
   THE WHOLE OF HER, quoted.

     BF-34  "The sound comes from behind her. Not the voice thinned by
             medication and made formal by the effort to appear lucid. This is
             the voice from childhood — impatient and amused, calling from the
             front seat while Mara knelt backward in the car to watch a storm
             disappear behind them."
             ELISE (V.O.): "Do not turn around."

     BF-10  the reverse of the 1945 photograph, in blue fountain pen:
             "ASTER HOUSE / AUGUST 1945 / IONA, ELISE, THOMAS / DO NOT TURN
              AROUND."  "The ink has faded from black to brown but the shape is
              clean."
             MARA: "My mother was born in 1963." / "It was her name." /
                   "She said she remembered being there."

     BF-17  MARA: "My mother is dead."  IONA: "Yes. That was what made it
             difficult."

   ---------------------------------------------------------------------------
   THE LOCKS. These are not inherited from an atlas record — this world's cast
   entries carry no `wt` — so they are derived here from the text and they bind
   this module absolutely.

     EliseAbsentBody
       NO FACE. None is to be generated, implied, glimpsed in glass, or
         reconstructed from Mara's or the girl's.
       NO BODY, no silhouette, no shoulders, NO HANDS, no shape behind a
         curtain, no shadow cast into frame from off-screen.
       NO FIGURE IN THE PROJECTED FILM. The film shows a glasshouse, three
         children with their backs to the camera, and a woman who is Mara's
         grandmother. Elise is not in it.
       No surrogate: no waveform, no pulse of light, no empty chair with a
         cardigan on it, no doorway with someone just out of it.
       She is not a ghost and must never be lit like one.

     EliseFromBehind
       Her sound is ALWAYS behind the frame. Every state in this file is a
       drawing of the thing in FRONT of the person she is speaking to — the
       seat back, the window, the photograph, the lit wall. The camera is
       facing the wrong way in all four, and it stays that way.

     EliseTurnLock
       "Do not turn around" is her only line and it is also the instruction on
       the back of a photograph from eighteen years before she was born. A
       shot that turns to look at her breaks the world's own rule out loud.
       DO NOT AUTHOR THE REVERSE ANGLE. There is no `revealed` state and there
       will not be one.

   WHY THIS IS THE FAITHFUL READING, not a shortcut. The sibling world solved
   character.mona — "a household intelligence with no body" — as a cream wall
   plate with a 4mm amber indicator at forty-eight inches, on the grounds that
   her visible inventory was a piece of builder-grade hardware and nothing else.
   Elise's visible inventory is smaller still: her NAME, written by someone
   else, in 1945, on the back of a photograph, above a broken circle. Everything
   else about her is acoustic, and this world has an audio layer for that.

   So her asset is four framings of the space she speaks from the far side of.
   The register is deliberately identical to mona.mjs: ordinary hardware and
   ordinary surfaces, flat light, no atmosphere, nothing supernatural.
   ---------------------------------------------------------------------------
   THE BROKEN CIRCLE. BF-10: "Below the writing is the same broken circle." So
   the mark is on her card too, from assets/_broken-circle.mjs, from the same
   brokenCircle() call as Iona's scar and the old butterfly's wing. In blue
   fountain pen faded to brown, which the post pass quantizes by luminance to a
   mid ink — the brief's own warning, and here it is also true of the object.
*/
import { gray, INK, PAPER } from "../../engine/halfworld-engine.mjs";
import { hold, advance, clamp01 } from "../../engine/motion.mjs";
import { paintMark } from "../_broken-circle.mjs";

const TAU = Math.PI * 2;

const params = {
  // the only hard numbers the text gives about her
  born: 1963,
  photographed: 1945,          // eighteen years before she was born
  namedOn: "the reverse, in blue fountain pen",
  inkNow: 0x6a,                // "faded from black to brown"; a mid ink by luminance
  lines: ["ASTER HOUSE", "AUGUST 1945", "IONA, ELISE, THOMAS", "DO NOT TURN AROUND"],
  // her position, in every unit she is in
  bearing: "behind",
  visible: 0,
};

/* ---- the reverse of the photograph -------------------------------------
   BUILD-BRIEF trap 3: "Small type dissolves in the dot lattice. Draw numerals
   and signage as geometry, or size >= 33px." Her name is the entire asset, so
   it is set at 40px on a 660px card and the last line at 34px, above the
   minimum, and nothing smaller appears anywhere in this file. Handwriting is
   not a font; what is drawn is the size, the slope and the ink of a fountain
   pen, and the words are the words the text specifies. */
function reverse(ctx, W, H) {
  ctx.fillStyle = gray(0xf2); ctx.fillRect(0, 0, W, H);

  // the card itself: photographic paper, slightly warm, with a hard edge and
  // one dog-eared corner. Rotated 2 degrees — it is lying on a bench.
  ctx.save();
  ctx.translate(W * 0.5, H * 0.5); ctx.rotate(-0.035); ctx.translate(-W * 0.5, -H * 0.5);
  const x0 = W * 0.11, y0 = H * 0.20, w = W * 0.78, h = H * 0.58;
  ctx.fillStyle = gray(0xdb); ctx.strokeStyle = INK; ctx.lineWidth = 4.5; ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x0, y0); ctx.lineTo(x0 + w, y0); ctx.lineTo(x0 + w, y0 + h);
  ctx.lineTo(x0 + w * 0.06, y0 + h); ctx.lineTo(x0, y0 + h * 0.94);
  ctx.closePath(); ctx.fill(); ctx.stroke();

  // the writing. Four lines, ranged left, in a hand that slopes.
  const ink = gray(params.inkNow);
  ctx.save();
  ctx.translate(x0 + w * 0.10, y0 + h * 0.26);
  ctx.transform(1, 0, -0.13, 1, 0, 0);                    // the slope of the hand
  ctx.fillStyle = ink; ctx.textBaseline = "alphabetic";
  const sizes = [40, 40, 40, 34];
  for (let i = 0; i < params.lines.length; i++) {
    ctx.font = `${sizes[i]}px Georgia, 'Times New Roman', serif`;
    ctx.fillText(params.lines[i], 0, i * h * 0.145);
    // a pen that runs dry and is pressed again at the start of each line
    ctx.fillRect(-6, i * h * 0.145 - sizes[i] * 0.62, 3.2, sizes[i] * 0.72);
  }
  ctx.restore();

  // "Below the writing is the same broken circle." Same points as the scar and
  // the wing. Larger here because it was drawn by a hand on a table.
  paintMark(ctx, { x: x0 + w * 0.10, y: y0 + h * 0.70, w: w * 0.30, h: w * 0.30 }, {
    ink, lw: 5.2, rot: 0.04,
  });
  ctx.restore();
}

/* ---- the front seat ----------------------------------------------------
   BF-34's childhood image, drawn from where Mara was: kneeling backward on the
   rear bench. What is in frame is the BACK of the seat she is calling from. */
function frontSeat(ctx, W, H, o = {}) {
  const rock = (o.rock || 0) * H * 0.004;                  // the car, moving
  ctx.fillStyle = gray(0xe8); ctx.fillRect(0, 0, W, H);

  // the light over the top of the seat — the windscreen, out of frame
  ctx.fillStyle = gray(0xfa); ctx.fillRect(0, 0, W, H * 0.30);
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.lineCap = "round";
  ctx.beginPath();                                        // roof line, broken
  ctx.moveTo(0, H * 0.075); ctx.lineTo(W * 0.38, H * 0.070);
  ctx.moveTo(W * 0.52, H * 0.069); ctx.lineTo(W, H * 0.064);
  ctx.stroke();

  const top = H * 0.30 + rock;
  // the seat back: one plane, vinyl, light
  ctx.fillStyle = gray(0xc8); ctx.strokeStyle = INK; ctx.lineWidth = 4.5; ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(W * 0.06, H * 1.02);
  ctx.lineTo(W * 0.10, top + H * 0.10);
  ctx.quadraticCurveTo(W * 0.50, top + H * 0.045, W * 0.90, top + H * 0.10);
  ctx.lineTo(W * 0.94, H * 1.02);
  ctx.closePath(); ctx.fill(); ctx.stroke();

  // the headrest: separate, with the gap under it that the light comes through
  ctx.fillStyle = gray(0xbc);
  ctx.beginPath();
  ctx.moveTo(W * 0.33, top + H * 0.055);
  ctx.quadraticCurveTo(W * 0.50, top - H * 0.085, W * 0.67, top + H * 0.055);
  ctx.lineTo(W * 0.66, top + H * 0.085);
  ctx.quadraticCurveTo(W * 0.50, top + H * 0.020, W * 0.34, top + H * 0.085);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.lineWidth = 3.4;                                    // the two posts
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(W * (0.5 + s * 0.10), top + H * 0.082);
    ctx.lineTo(W * (0.5 + s * 0.10), top + H * 0.112);
    ctx.stroke();
  }

  // stitched seams down the vinyl. Broken, never a full-width rule.
  ctx.strokeStyle = gray(0x8c); ctx.lineWidth = 2.8;
  for (const fx of [0.30, 0.50, 0.70]) {
    ctx.beginPath();
    ctx.moveTo(W * fx, top + H * 0.14); ctx.lineTo(W * fx, H * 0.74);
    ctx.moveTo(W * fx, H * 0.80); ctx.lineTo(W * fx, H * 0.98);
    ctx.stroke();
  }
  // the crease where a shoulder has rested against it for years
  ctx.strokeStyle = gray(0xa4); ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(W * 0.16, top + H * 0.26);
  ctx.quadraticCurveTo(W * 0.34, top + H * 0.20, W * 0.44, top + H * 0.30);
  ctx.stroke();
}

/* ---- the rear window ---------------------------------------------------
   "…to watch a storm disappear behind them." What the child was looking at
   INSTEAD of her mother. `recede` 0..1 takes the storm from near to far; it
   never arrives and it never quite goes. */
function rearWindow(ctx, W, H, o = {}) {
  const k = clamp01(o.recede == null ? 0.35 : o.recede);
  ctx.fillStyle = gray(0xdc); ctx.fillRect(0, 0, W, H);

  // the aperture: parcel shelf below, roof above, pillars either side
  const x0 = W * 0.12, y0 = H * 0.24, w = W * 0.76, h = H * 0.40;
  ctx.fillStyle = gray(0xfb); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x0 + w * 0.06, y0);
  ctx.lineTo(x0 + w * 0.94, y0);
  ctx.quadraticCurveTo(x0 + w, y0 + h * 0.5, x0 + w * 0.90, y0 + h);
  ctx.lineTo(x0 + w * 0.10, y0 + h);
  ctx.quadraticCurveTo(x0, y0 + h * 0.5, x0 + w * 0.06, y0);
  ctx.closePath(); ctx.fill(); ctx.stroke();

  ctx.save(); ctx.clip();
  // the storm: a low dark mass and the rain under it, shrinking with distance.
  // No lightning. It is weather at the end of a road, not an event.
  const s = 1 - k * 0.72;
  const cy = y0 + h * (0.52 + k * 0.16);
  ctx.fillStyle = gray(0x7e);
  ctx.beginPath();
  ctx.moveTo(x0 + w * (0.5 - 0.42 * s), cy);
  ctx.quadraticCurveTo(x0 + w * (0.5 - 0.30 * s), cy - h * 0.30 * s, x0 + w * 0.5, cy - h * 0.22 * s);
  ctx.quadraticCurveTo(x0 + w * (0.5 + 0.30 * s), cy - h * 0.34 * s, x0 + w * (0.5 + 0.42 * s), cy);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = gray(0x9a); ctx.lineWidth = 2.4; ctx.lineCap = "round";
  for (let i = 0; i < 9; i++) {
    const t = i / 8, x = x0 + w * (0.5 + (t - 0.5) * 0.78 * s);
    ctx.beginPath(); ctx.moveTo(x, cy); ctx.lineTo(x - w * 0.012, cy + h * 0.20 * s); ctx.stroke();
  }
  // the road, going away under it
  ctx.strokeStyle = gray(0x6e); ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x0 + w * 0.34, y0 + h); ctx.lineTo(x0 + w * 0.48, cy + h * 0.02); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x0 + w * 0.70, y0 + h); ctx.lineTo(x0 + w * 0.54, cy + h * 0.02); ctx.stroke();
  ctx.restore();

  // defroster elements: short segments, never spanning the glass
  ctx.strokeStyle = gray(0xb2); ctx.lineWidth = 2.6;
  for (let i = 1; i <= 4; i++) {
    const y = y0 + h * (i / 5);
    ctx.beginPath();
    ctx.moveTo(x0 + w * 0.10, y); ctx.lineTo(x0 + w * 0.44, y);
    ctx.moveTo(x0 + w * 0.54, y); ctx.lineTo(x0 + w * 0.88, y);
    ctx.stroke();
  }
  // the parcel shelf, in front of the child's knees
  ctx.fillStyle = gray(0xc4); ctx.strokeStyle = INK; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.rect(W * 0.06, y0 + h, W * 0.88, H * 0.10); ctx.fill(); ctx.stroke();
}

/* ---- the lit wall ------------------------------------------------------
   BF-34 as it actually happens: the rearing facility, the projector running,
   and Mara facing a white rectangle. The sound comes from behind her. What is
   in frame is the reason she does not turn. */
function litWall(ctx, W, H) {
  /* PASS 2. At 0x9e this filled the whole frame with a dense dot field, ate
     the card's own label and read as a printing fault rather than as a dark
     room. The room IS dark, but a full-bleed mid grey is the one thing this
     post pass cannot do: darkness here has to be carried by the CONTRAST with
     the lit rectangle, not by the level of the field. */
  ctx.fillStyle = gray(0xd2); ctx.fillRect(0, 0, W, H);
  // BF-30: "Opposite, a white rectangle waits."
  const x0 = W * 0.14, y0 = H * 0.22, w = W * 0.72, h = H * 0.44;
  ctx.fillStyle = PAPER; ctx.strokeStyle = INK; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.fill(); ctx.stroke();
  // the beam's edge, arriving from behind the camera on the left
  ctx.save();
  ctx.fillStyle = gray(0xdb);
  ctx.beginPath();
  ctx.moveTo(0, H * 0.86); ctx.lineTo(x0, y0 + h); ctx.lineTo(x0, y0); ctx.lineTo(0, H * 0.52);
  ctx.closePath(); ctx.fill();
  ctx.restore();
  // the tiled floor, and the pool's near edge, drawn as broken spans
  ctx.strokeStyle = INK; ctx.lineWidth = 3.2; ctx.lineCap = "round";
  for (const [a, b, y] of [[0.02, 0.34, 0.80], [0.42, 0.72, 0.80], [0.80, 0.98, 0.80],
                           [0.06, 0.40, 0.90], [0.50, 0.94, 0.90]]) {
    ctx.beginPath(); ctx.moveTo(W * a, H * y); ctx.lineTo(W * b, H * y); ctx.stroke();
  }
  // and behind the camera: nothing. There is no shadow on this floor that is
  // not the room's own. EliseAbsentBody.
}

/* ---- the asset ---------------------------------------------------------- */
export const asset = {
  id: "character.elise",
  type: "CHARACTER",
  name: "Elise",
  statusWord: "BEHIND",
  scene: "BF-34",

  params,
  layers: ["field", "aperture", "storm", "seat", "card", "hand", "mark"],
  /* The anchors are acoustic and architectural. `voice` sits on the frame's
     NEAR edge because she is on the other side of it; there is no anchor
     inside this frame that belongs to a body, and adding one would be the
     first step toward drawing her. */
  anchors: {
    voice: { x: .50, y: .995 },
    addressee: { x: .50, y: .60 },        // where the person she is speaking to is
    mark: { x: .32, y: .62 },             // the broken circle on the reverse
    horizon: { x: .50, y: .44 },
  },
  states: {
    initial: "behind",
    nodes: {
      // BF-34 as it happens: the lit wall, and the sound from behind the frame.
      behind: { preview: { view: "wall" } },
      // BF-34's memory: the back of the front seat, from the rear footwell.
      frontseat: { preview: { view: "seat", rock: 0 } },
      // what the child was watching instead: the storm going away behind them.
      rearwindow: { preview: { view: "window", recede: 0.35 } },
      // BF-10: her name, in another person's hand, eighteen years early.
      reverse: { preview: { view: "reverse" } },
    },
    // No edge leads to a state in which she appears, because there is none.
    edges: [["behind", "frontseat"], ["frontseat", "rearwindow"],
            ["rearwindow", "frontseat"], ["behind", "reverse"], ["reverse", "behind"]],
  },
  // What a runtime can drive: the framing, the car's motion, how far the storm
  // has got, and the impulse she produces in somebody else. Not a pose, not a
  // gaze, not a mouth.
  channels: ["view", "rock", "recede", "pull", "gap"],

  /* ---- MOTIONS ---------------------------------------------------------
     She has no body, so `breath` drives the room she is speaking into — the
     same solve the sibling world used for a character whose "silhouette is the
     room she is speaking into". */
  motions: {
    /* BREATH — the car, moving. hold() supplies the deniable residue; the
       amplitude is four thousandths of the frame, under two pixels at the size
       this renders at, and if you can point at it it is wrong. */
    breath(u) {
      const h = hold(u, { dur: 6 });
      return { rock: h.breath * 2 - 1, recede: 0.35 + 0.02 * h.weight };
    },

    /* RECEDING — "a storm disappear behind them". It gets further away and it
       does not arrive anywhere. An open one-shot: the last frame is further
       than the first, so this is not a loop and must not be cycled. */
    receding(u) {
      return { view: "window", recede: 0.06 + 0.88 * u, rock: Math.sin(u * TAU * 2.7) };
    },

    /* DO NOT TURN AROUND — her one line, and the only motion she has that is
       about her.

       IT IS NOT DRAWN ON HER. There is nothing to draw it on. What it returns
       is `pull`: the impulse to turn around, quantised — it arrives in four
       discrete pushes, with dwell, exactly as advance() moves a film strip past
       a gate, because BF-39 describes it as "a pressure toward action", not a
       feeling. A scene applies `pull` to the head of whoever is in front of
       her, and the frame she is in does not change at all.

       BF-35: "Mara turns. Therefore the film changes." The turning is another
       character's channel. This module supplies the pressure and refuses the
       reverse angle. */
    do_not_turn(u) {
      const a = advance(u, 4, { dwell: 0.62 });
      return {
        view: "wall",
        pull: (a.index + a.shift) / 4,
        settled: a.settled,
        // and nothing else. No visual change whatsoever in her own frame.
      };
    },
  },

  // CARD SIGNATURE — BEHIND: the white rectangle that Mara is facing, the beam
  // arriving over her shoulder, and no one in the room but the room.
  preview: () => ({ view: "wall", status: "BEHIND", progress: .02 }),

  draw(ctx, W, H, state) {
    const st = state || {};
    if (st.view === "seat") frontSeat(ctx, W, H, st);
    else if (st.view === "window") rearWindow(ctx, W, H, st);
    else if (st.view === "reverse") reverse(ctx, W, H);
    else litWall(ctx, W, H);
    return { anchors: { voice: { x: .50, y: .995 }, addressee: { x: .50, y: .60 } } };
  },
};
export default asset;
