/* creature.oldbutterfly — THE OLDER BUTTERFLY. The one from the canister.
   CREATURE asset for I REMEMBER BEING A BUTTERFLY (B01). BF-23, 24, 25, 26, 27.

   ---------------------------------------------------------------------------
   EVIDENCE.

   WHERE IT COMES FROM.
     BF-23  "Inside: a coil of 8mm film wrapped in waxed paper, and a dry
             chrysalis resting in the hollow centre of the reel. Larger than any
             swallowtail chrysalis Mara has seen. Split along one side. Empty.
             A black leg appears beneath the film, withdraws, appears again. The
             butterfly pushes upward through a nest of its own discarded
             history."
     BF-18  the canister is dented, rusted, taped, labelled ASTER, and "yellow
             scales cling to the tape, caught in the adhesive. They are fresh
             enough to shine."

   WHAT IT LOOKS LIKE. From the prose brief: frayed wings, one antenna ending in
   a blunt white scar, coated in fine yellow scales. All three are age, and all
   three are drawn as age rather than as damage: the fray is scales gone off the
   margins, the antenna is a healed stub and not a wound, and the coat is the
   loose scales an old butterfly sheds over itself.
     YELLOW IS LIGHT. The post pass quantizes by luminance, so a coat of fine
     yellow scales makes this animal PALER than the laboratory one, never warmer
     and never darker. That is also how the two read apart at contact-sheet
     size: same outline, same venation, one bright and eaten, one crisp.

   THE MARK. THE CRITICAL ONE, and the reason the projection in
   _lepidoptera.mjs is built the way it is.
     BF-24  "Across the left hindwing the scales form a pale broken circle. No
             line crosses it. The butterfly raises its wings. On the right
             hindwing is the line. THE MARK EXISTS ONLY WHEN THE WINGS ARE
             CLOSED TOGETHER. It opens: the symbol divides. It closes: the
             symbol becomes whole."
             IONA: "Now you understand why it cannot be photographed."
             NIKO: "Of course it can be photographed."

   HOW IT IS SOLVED, precisely:
     · the shape comes from brokenCircle() in engine/motion.mjs, through
       assets/_broken-circle.mjs, which is the same call that draws Iona's scar
       (BF-22), the pen mark on the reverse of the photograph (BF-10) and the
       swallowtail's flight path (BF-02). Not a similar shape. The same array.
     · the LEFT hindwing gets seg:"ring" only. No line crosses it. BF-24 says so.
     · the RIGHT hindwing gets seg:"stroke" only.
     · both are laid down through the WING'S OWN transform, in (span, chord)
       coordinates, so they are carried by whatever the wing does.
     · at closure = 1 that transform sends both wings to the same place on the
       paper. The two halves land on top of each other and the mark is whole.
       NOBODY DRAWS A WHOLE MARK. The union is what the projection does.
     · the far wing's half shows THROUGH the near wing as they close — a wing is
       a translucent thing held up in a room full of light in this story, and
       "cannot be photographed" is a claim about a difference between states,
       not about an object. `showThrough` ramps from closure 0.55 and is
       illegible until it is complete, which is the whole requirement:
       MOTION-BRIEF, "if it is legible in one frame, you have drawn the wrong
       thing." The one frame where it is legible is the frame the text says it
       is legible in.

   WHAT IT DOES.
     BF-25  "The butterfly climbs the white brightness of the door. Impact.
             Drop. Recovery." — the same four beats as the laboratory insect,
             eighty years older. Same `strike`, more `wear`.
     BF-27  "The butterfly descends and touches one flower. It does not recoil."
             MARA: "It isn't afraid." / IONA: "Why would it be?"
             So there is no startle state in this file and there will not be
             one. It lands on lavender and stays.
     BF-26  it leads them; BF-25 it "passes into all of it and vanishes above
             the awning".

   SILENT. Its species (it is only ever "the butterfly"; the chrysalis is
   "larger than any swallowtail chrysalis Mara has seen", which says it is not
   one, but the rig draws the family it shares with the laboratory animal
   because BF-27 turns on them having the same marking). Whether the fraying is
   from age or from the canister. Its size.
*/
import { gray, INK, PAPER } from "../../engine/halfworld-engine.mjs";
import { cycle, hold, clamp01 } from "../../engine/motion.mjs";
import { paintMarkWith } from "../_broken-circle.mjs";
import { makeLepidopteran } from "./_lepidoptera.mjs";

const TAU = Math.PI * 2;

const params = {
  // PASS 2. The first render set fray 0.85 and coat 0.9 and the animal came
  // out as static: no wing contour, no marking, no read at any size. It was
  // over-aged. These are the numbers that leave it recognisably the same
  // species as the laboratory insect — which BF-27 requires — while still
  // being eighty years older than it.
  wing: 2,                     // the SAME membrane level as the young one: one species
  veins: 4,                    // but the venation has faded three levels,
                               // which is also what lets the marking dominate the wing
  body: 5,                     // and so has the body
  fray: 0.38,                  // "frayed wings" — scales gone off the margins
  antennaScar: -1,             // "one antenna ending in a blunt white scar"
  coat: 0.40,                  // "coated in fine yellow scales" -> pale, not warm
  falseEyes: false,            // the text gives the undersides of THIS one a mark
  legs: 3,
  from: "the canister",
  labelled: "ASTER",
};

/* THE MARKING. Called by the rig once per hindwing, in wing space, so it rides
   the same transform the wing does.

   The patch of wing the mark sits on: span 0.16..0.62, chord 0.24..0.70. That
   is the middle of the hindwing, clear of the tail and clear of the root, and
   it is the same patch on both sides — which is what makes the halves coincide
   when the wings close. */
const PATCH = { s0: 0.12, s1: 0.66, c0: 0.18, c1: 0.80 };
function onWing(ctx, T, side, st) {
  const map = (q) => T(PATCH.s0 + q.x * (PATCH.s1 - PATCH.s0),
                       PATCH.c0 + q.y * (PATCH.c1 - PATCH.c0));
  const V = st.V, W = st.W;
  /* PASS 3: at V*0.036 the ring filled in. The projection squashes the circle
     to cos(PHI) of its height, so a stroke that is fine on a round mark closes
     a flat one — the line weight has to come off with the foreshortening. */
  const lw = Math.max(3.0, V * 0.030);

  /* PASS 2. THE MARK IS PALE, and pale means what it says: "Across the left
     hindwing THE SCALES FORM A PALE BROKEN CIRCLE." It is not ink on a wing,
     it is a patch of lighter scales, so it is drawn at paper on a level-2
     membrane and prints as a broken circle of MISSING DOTS. The first pass
     drew it at gray(0x66) with a near-white halo underneath, which painted
     over its own path and made it invisible in every state. */
  const pale = "#fbfbf7";

  // this wing's own half. Left = the ring, and no line crosses it (BF-24).
  paintMarkWith(ctx, map, { segs: [side < 0 ? "ring" : "stroke"], ink: pale, lw });

  /* and the OTHER half, showing THROUGH as the wings come together — a wing
     held up in a room full of light is translucent. Only on the near wing,
     only above closure 0.55, and illegible until the two halves coincide.

     PASS 4: this was drawn DARK, on the reasoning that a mark seen through a
     membrane is a shadow. It read as a second, unrelated object: the united
     mark came out as a dark ring with a pale line through it, two values, two
     things. The half that shows through is still made of the same pale scales;
     it is only dimmer for having a wing in front of it. One value ladder, one
     figure. */
  if (side > 0 && st.closure > 0.55) {
    const k = (st.closure - 0.55) / 0.45;
    ctx.save();
    ctx.globalAlpha = k * k;                 // an ordered ramp, not a cross-fade
    paintMarkWith(ctx, map, { segs: ["ring"], ink: "#eeeee8", lw: lw * 0.95 });
    ctx.restore();
  }
}

const fig = makeLepidopteran({ ...params, onWing });

export const asset = {
  id: "creature.oldbutterfly",
  type: "CREATURE",
  name: "The Older Butterfly",
  statusWord: "DIVIDED",
  scene: "BF-23",

  params,
  layers: ["far-wing", "mark-ring", "body", "legs", "antennae", "near-wing",
           "mark-stroke", "mark-through", "scale-coat"],
  anchors: {
    thorax: { x: .50, y: .48 }, head: { x: .50, y: .38 },
    wingL: { x: .20, y: .48 }, wingR: { x: .80, y: .48 },
    markL: { x: .30, y: .55 }, markR: { x: .70, y: .55 },
    feet: { x: .50, y: .55 },
  },
  states: {
    initial: "open",
    nodes: {
      // BF-24 · wings open. "It opens: the symbol divides." The ring is on one
      // wing and the line is on the other and there is no mark in this frame.
      // THIS IS THE CARD, deliberately: the card must not show a whole mark.
      open: { preview: { closure: .06, cy: .48, tilt: -.02 } },
      // BF-24 · wings closed. "It closes: the symbol becomes whole." The one
      // frame in this world where the shape is legible on a living thing.
      closed: { preview: { closure: 1, cy: .50, tilt: .03 } },
      // BF-23 · pushing upward through the film coil. Wings not yet dry.
      emerging: { preview: { closure: .90, cy: .62, tilt: .22, wear: .1 } },
      // BF-27 · on the spilled lavender. It does not recoil.
      lavender: { preview: { closure: .72, cy: .58, tilt: -.05 } },
      // BF-25 · climbing the white brightness of the entrance door.
      door: { preview: { closure: .30, cy: .36, tilt: -.14, wear: .5 } },
    },
    edges: [["emerging", "open"], ["open", "closed"], ["closed", "open"],
            ["open", "lavender"], ["lavender", "door"], ["door", "open"]],
  },
  channels: ["closure", "cx", "cy", "tilt", "wear", "V"],

  /* ---- MOTIONS --------------------------------------------------------- */
  motions: {
    /* BREATH. At rest this animal opens and closes its wings slowly — and
       because of what is painted on them, its respiration IS the mark
       assembling and dividing. That is not a flourish; it is what the text
       describes an old butterfly sitting on a reel doing. Kept small: this
       one never opens past 0.62 or closes past 0.98, so neither end state is
       reached and the mark is never quite whole. `mark` is the motion that
       completes it. */
    breath(u) {
      const h = hold(u, { dur: 5 });
      return {
        closure: 0.80 + 0.18 * Math.sin(u * TAU) - 0.02 * u,
        tilt: h.tilt * 0.04, cy: 0.50 + h.breath * 0.004, wear: 0.25,
      };
    },

    /* THE MARK. BF-24, the whole unit, as one cycle:
         "It opens: the symbol divides. It closes: the symbol becomes whole."
       Open at u=0, closed at u=0.5, open again at 1 — and NOT closed, because
       this is a living thing: drift means it comes back a little further open
       than it started, so a scene that runs this twice does not get the same
       two frames. The mark is illegible in every frame except the ones around
       0.5, which is the requirement.

       Do not raise `drift`. Past about 0.1 the second revolution never closes
       far enough for the halves to meet, and the animal stops being able to
       make the shape at all — which is a true thing about it and a wrong thing
       to have happen inside four seconds. */
    mark(u) {
      const c = cycle(u, { beats: 2, closed: false, drift: 0.06 });
      const closure = u < 0.5 ? Math.sin(u * Math.PI) ** 0.7 : Math.sin(u * Math.PI) ** 0.7;
      return {
        closure: clamp01(closure - c.wear * 0.5),
        tilt: 0.03 * Math.cos(u * TAU),
        cy: 0.50 - 0.006 * Math.sin(u * TAU * 2),
        wear: 0.3 + c.wear,
      };
    },

    /* STRIKE. BF-25: "The butterfly climbs the white brightness of the door.
       Impact. Drop. Recovery." The same four beats as creature.swallowtail and
       deliberately the same construction — one animal, two ages — but the
       drift is nearly double, because this one is eighty years old and has
       just come out of a tin. Open, always: it is dying of this.
       Its recovery does not get back to where the young one's does; that is
       the drift, and it is the only difference between the two motions. */
    strike(u) {
      const c = cycle(u, { beats: 4, closed: false, drift: 0.40 });
      const ceiling = 0.300, floor = 0.585;
      let y, closure, tilt;
      if (c.beat === 0) { y = floor - (floor - ceiling) * c.strike; closure = 0.60 - 0.34 * c.strike; tilt = -0.04 - 0.12 * c.strike; }
      else if (c.beat === 1) { y = ceiling; closure = 0.20 + 0.12 * c.within; tilt = -0.16 + 0.34 * Math.sin(c.within * Math.PI * 3) * (1 - c.within); }
      else if (c.beat === 2) { y = ceiling + (floor - ceiling) * (c.within * c.within * 0.55 + c.within * 0.45); closure = 0.30 + 0.46 * c.within; tilt = 0.26 * Math.sin(c.within * Math.PI * 2.2); }
      else { y = floor + 0.012 * Math.sin(c.within * Math.PI); closure = 0.76 - 0.14 * c.strike; tilt = 0.12 * (1 - c.strike); }
      return {
        cy: y + c.wear * 0.055, closure: clamp01(closure + c.wear * 0.16),
        tilt: tilt + c.wear * 0.09, wear: 0.3 + c.wear,
      };
    },

    /* EMERGING. BF-23: "A black leg appears beneath the film, withdraws,
       appears again. The butterfly pushes upward through a nest of its own
       discarded history." One-shot, not a loop. Three pushes, each higher than
       the last, each followed by a withdrawal that does not give back all of
       it — an open cycle in the strict sense. The wings stay shut the whole
       way: they are not dry yet. */
    emerging(u) {
      const c = cycle(u, { beats: 3, closed: false, drift: 0.30 });
      const push = Math.sin(c.within * Math.PI) ** 1.6;
      const gained = (c.beat + push * 0.7) / 3;
      return {
        cy: 0.70 - gained * 0.20,
        closure: 0.99 - 0.06 * push,
        tilt: 0.30 - gained * 0.26 + 0.05 * Math.sin(c.within * TAU),
        wear: 0.10 + c.wear,
      };
    },
  },

  // CARD SIGNATURE — DIVIDED: wings open, the ring on one hindwing, the line on
  // the other, and no mark anywhere in the frame. The card is not allowed to
  // show the whole shape; that is the point of the character.
  preview: () => ({ closure: .06, cy: .48, tilt: -.02, status: "DIVIDED", progress: .5 }),

  draw(ctx, W, H, state) {
    const st = state || {};
    return fig.draw(ctx, W, H, { V: Math.min(W, H) * 0.31, wear: 0.3, ...st });
  },
};
export default asset;
