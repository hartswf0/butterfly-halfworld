/* creature.swallowtail — THE SWALLOWTAIL. The laboratory insect.
   CREATURE asset for I REMEMBER BEING A BUTTERFLY (B01). BF-01, 03, 04, 05,
   12, 14, 37.

   ---------------------------------------------------------------------------
   EVIDENCE.

   WHAT IT DOES, which is the whole character:
     BF-01  "A swallowtail rises into the clear acrylic lid of a choice maze and
             strikes it. It falls, rights itself in air, and strikes again. The
             roof offers no resistance until contact." / "The choice interval
             has run 43 seconds and should have ended after 30. It does not
             choose."
     BF-03  "The butterfly continues its pattern regardless."
     BF-05  MARA: "It rejected the premise."

   THE WINGS.
     BF-01  "A tilt of black-veined wings."  -> the venation is INK, level 7,
            and it is the darkest thing on the animal after the body.
     BF-05  "Its wings close, opening the false eyes on their undersides. The
             eyes look backward."
     BF-12  "One hindwing is damaged. A small crescent has been removed from its
             edge, as neatly as if cut with a punch. Through the missing
             portion, the white card behind shows with impossible brightness.
             There is nothing sharp in the maze."

   THE FEET.
     BF-04  "Its feet touch her skin: not pressure but arrangement — six points
             becoming twelve, twelve becoming none."
     Six points is six tarsi. The rig draws three legs a side and they are the
     only things it puts on a surface.

   THE TAPPING.
     BF-14  "From the recovery rack comes a dry tapping. The butterfly strikes
             the vial once, then again. NOT WILDLY. It moves around the
             circumference, testing the glass AT EQUAL INTERVALS."
     MOTION-BRIEF is explicit that this must be quantised and not eased, and
     BF-14 is one of the three units in the world authored loop:true — the
     apparatus loops, and what is looping here is the trial, not the insect.
     See motions.tap, which is quantised, and motions.strike, which is not
     closed. The difference between those two calls is the difference between
     the machine and the animal, and it is one argument.

   IT DRAWS THE MARK BY FLYING.
     BF-02  "The software draws the flight path as a green line. The line
             gathers over itself, loop after loop. A figure appears: an almost
             closed circle crossed near its lower edge by a crooked stroke."
     So this animal never WEARS the broken circle — it PRODUCES it. Its
     `flight_trace` motion returns its own position along brokenCircle()'s
     points, which is the same array the old butterfly's wing marking, Iona's
     scar and the pen on the photograph are drawn from. The scene draws the
     accumulating line; the insect is only ever at one point of it, and the
     figure is invisible in every instant. That is the TRACE motion's entire
     definition and it is also the difference between this insect and the
     older one: one of them is the mark, the other one is doing it.

   SILENT. Species beyond "swallowtail" (papilionid: tails on the hindwing,
   which is drawn), sex, size in millimetres, and any colour at all. The wing
   membrane is kept LIGHT — level 2 — because everything in this world comes
   out two to three ink levels too dark on a first pass and because a black-
   veined wing needs paper to be veined against.
*/
import { gray, INK } from "../../engine/halfworld-engine.mjs";
import { cycle, advance, hold, clamp01 } from "../../engine/motion.mjs";
import { markPoints } from "../_broken-circle.mjs";
import { makeLepidopteran, TONE } from "./_lepidoptera.mjs";

const TAU = Math.PI * 2;

const params = {
  family: "Papilionidae",      // "swallowtail": the tails are the diagnosis
  wing: 2,                     // membrane, LIGHT. see header
  veins: 7,                    // "black-veined"
  body: 6,
  falseEyes: true,             // BF-05, on the undersides
  crescent: 0,                 // BF-12 raises this to 1
  crescentSide: 1,
  legs: 3,                     // three a side: "six points"
  intervalRan: 43,             // seconds. It should have ended after 30.
  choseAnArm: false,
};

/* the undamaged animal and the damaged one are the same animal — one spec,
   one crescent parameter, so BF-12's "Was that there before?" is answerable by
   diffing one number rather than by comparing two drawings. */
const fig = makeLepidopteran({ ...params });
const cut = makeLepidopteran({ ...params, crescent: 1 });

export const asset = {
  id: "creature.swallowtail",
  type: "CREATURE",
  name: "The Swallowtail",
  statusWord: "REFUSAL",
  scene: "BF-01",

  params,
  layers: ["far-wing", "body", "legs", "antennae", "near-wing", "false-eyes", "crescent"],
  anchors: {
    thorax: { x: .50, y: .48 }, head: { x: .50, y: .38 },
    wingL: { x: .20, y: .48 }, wingR: { x: .80, y: .48 },
    feet: { x: .50, y: .55 },
  },
  states: {
    initial: "striking",
    nodes: {
      // BF-01 · mid-beat against the acrylic lid. The card.
      striking: { preview: { closure: .34, cy: .44, tilt: -.10 } },
      // BF-05 · settled on the white partition, wings closed, false eyes open.
      closed: { preview: { closure: 1, cy: .52, tilt: .04 } },
      // BF-04 · on her wrist. Wings half, feet down, weight on the skin.
      alighted: { preview: { closure: .62, cy: .54, tilt: .02 } },
      // BF-12 · a crescent removed from one hindwing, as if cut with a punch.
      damaged: { preview: { closure: .18, cy: .48, tilt: -.04, cut: true } },
      // BF-14 · in the recovery vial, testing the glass at equal intervals.
      vial: { preview: { closure: .78, cy: .50, tilt: .12 } },
    },
    edges: [["striking", "closed"], ["closed", "striking"], ["striking", "alighted"],
            ["alighted", "closed"], ["closed", "damaged"], ["damaged", "vial"],
            ["vial", "striking"]],
  },
  channels: ["closure", "cx", "cy", "tilt", "wear", "cut", "V"],

  /* ---- MOTIONS ---------------------------------------------------------
     Pure functions of u ∈ [0,1) returning partial draw-state. */
  motions: {
    /* BREATH. An insect at rest does not breathe visibly; what it does is open
       and close its wings, slowly, and that is the only respiration this animal
       has on paper. Tiny — a tenth of the closure range — because the large
       version of this movement is `strike`, and they must not be confused. */
    breath(u) {
      const h = hold(u, { dur: 5 });
      return { closure: 0.92 + 0.07 * Math.sin(u * TAU), tilt: h.tilt * 0.03, cy: 0.52 + h.breath * 0.004 };
    },

    /* STRIKE — the required one, and the argument of the whole unit.

         "It rises into the clear acrylic lid of a choice maze and strikes it.
          It falls, rights itself in air, and strikes again. The roof offers no
          resistance until contact."

       Four beats: RISE, IMPACT, DROP, RECOVERY. And it is NOT CLOSED —
       cycle(u, { closed:false, drift }) — because the insect is being worn
       down by doing this. MOTION-BRIEF: "the same act, but the body is being
       worn down by it. Never animate a living thing as a closed cycle."

       `wear` is the number that carries it: over one revolution the animal
       ends a little lower, a little more tilted and with its wings a little
       further open than it began. Three units later it is in a vial and one
       hindwing has a crescent missing.

       THE IMPACT IS NOT EASED. "The roof offers no resistance until contact" —
       so the rise is smooth and the contact is a step, and the drop starts at
       full speed rather than accelerating into it. */
    strike(u) {
      const c = cycle(u, { beats: 4, closed: false, drift: 0.22 });
      const ceiling = 0.325;                       // where the acrylic is
      const floor = 0.560;
      let y, closure, tilt;
      if (c.beat === 0) {                          // RISE — eased, powered
        y = floor - (floor - ceiling) * c.strike;
        closure = 0.55 - 0.35 * c.strike;
        tilt = -0.05 - 0.10 * c.strike;
      } else if (c.beat === 1) {                   // IMPACT — held against it
        y = ceiling;
        closure = 0.16 + 0.10 * c.within;
        tilt = -0.15 + 0.30 * Math.sin(c.within * Math.PI * 3) * (1 - c.within);
      } else if (c.beat === 2) {                   // DROP — no easing in
        y = ceiling + (floor - ceiling) * (c.within * c.within * 0.6 + c.within * 0.4);
        closure = 0.26 + 0.44 * c.within;
        tilt = 0.22 * Math.sin(c.within * Math.PI * 2.4);
      } else {                                     // RECOVERY — "rights itself"
        y = floor + 0.010 * Math.sin(c.within * Math.PI);
        closure = 0.70 - 0.15 * c.strike;
        tilt = 0.10 * (1 - c.strike);
      }
      return {
        cy: y + c.wear * 0.030,                    // it does not get back as high
        closure: clamp01(closure + c.wear * 0.10),
        tilt: tilt + c.wear * 0.05,
        wear: c.wear,
      };
    },

    /* TAP — BF-14. "It moves around the circumference, testing the glass at
       equal intervals." EQUAL INTERVALS: advance() with dwell, twelve stations
       around the glass, and no easing between them. The insect is at a station
       or it is moving to the next one; there is no in-between position that a
       viewer could call a curve.

       This is the one motion of this animal that is closed, and it is closed
       because the vial is closed. The body inside it is not: `wear` keeps
       accumulating and the wings sag by the twelfth station. */
    tap(u) {
      const a = advance(u, 12, { dwell: 0.74 });
      const th = ((a.index + a.shift) / 12) * TAU;   // twelve stations round the glass
      const r = 0.085;
      return {
        cx: 0.50 + Math.cos(th) * r,
        cy: 0.50 + Math.sin(th) * r * 0.62,
        closure: 0.80 + 0.06 * (a.settled ? 1 : 0),
        tilt: Math.cos(th) * 0.14,
        wear: u * 0.5,
      };
    },

    /* FLIGHT TRACE — BF-02. The insect flies the broken circle; the software
       draws the line. This returns WHERE IT IS at u, from the same points that
       draw the mark everywhere else in the world. The figure is invisible in
       every instant of this motion, which is exactly what TRACE means, and the
       scene that renders the accumulating line is the only thing that ever
       sees it. Do not draw the whole path from this module. */
    flight_trace(u) {
      const pts = markPoints();
      const i = Math.min(pts.length - 1, Math.floor(clamp01(u) * pts.length));
      const p = pts[i], q = pts[Math.min(pts.length - 1, i + 4)];
      // the maze is wider than it is deep; the path is laid into it flattened
      return {
        cx: 0.14 + p.x * 0.72,
        cy: 0.16 + p.y * 0.60,
        tilt: Math.atan2((q.y - p.y) * 0.60, (q.x - p.x) * 0.72) * 0.35,
        closure: 0.30 + 0.22 * Math.sin(u * TAU * 9),   // beating, all the way round
        wear: u * 0.4,
      };
    },
  },

  // CARD SIGNATURE — REFUSAL: mid-beat, on its way up into a roof that offers
  // no resistance until contact, 43 seconds into a 30-second interval.
  preview: () => ({ closure: .34, cy: .44, tilt: -.10, status: "REFUSAL", progress: 43 / 30 - 1 }),

  draw(ctx, W, H, state) {
    const st = state || {};
    const which = st.cut ? cut : fig;
    return which.draw(ctx, W, H, { V: Math.min(W, H) * 0.30, ...st });
  },
};
export default asset;
