/* ============================================================================
   zz-tread.mjs — THE BENCH THAT CAN SEE A SKATING FOOT.

   zz-gait.mjs lays eight phases of one cycle side by side and judges the shape
   of a walk. It caught four real defects that way. It cannot catch this one,
   and the reason is structural: THE BENCH HOLDS THE BODY STILL AND VARIES THE
   PHASE. A foot only skates when the body travels, so a bench that never
   translates is blind to the contract between stride and speed by construction.
   Fourteen films walked over it.

   THE CONTRACT. figure.mjs puts a foot at sin(q)*stride in BODY-LOCAL space,
   q = phase*TAU. Foot A is on the ground while cos q <= 0, that is q from pi/2
   to 3pi/2, and across that half-cycle its local x sweeps +stride to -stride.
   So the foot is pinned in the world if and only if the body advances exactly
   2*stride across that same half-cycle:

       dq/dx = pi / (2*stride)        ->      phase = (x - x0) / (4*stride)

   with stride = 0.15h, that is phase = (x - x0) / (0.6h). Phase is therefore
   NOT a free parameter. It is a function of where the body is. Every film in
   this suite authors the two independently — 01 moves the body on a smoothstep
   ping-pong while phase runs linearly off u — and nothing was ever going to
   make those agree.

   Three lanes, same body, same speed, same ground:

     TOP     DECOUPLED   phase from time, as the films do it
     MIDDLE  PINNED      phase from distance, the contract above
     BOTTOM  PINNED      the same, walking the other way, because a sign error
                         in `face` would otherwise read as success in one
                         direction and nobody would look at the other

   Judge it with `node wygwyl/scion/gates.mjs --world zz-tread`, which reports
   slip per lane: 0 is a planted foot and 1 is a drawing being dragged.
   ========================================================================= */

/* the ground contract, exported so a film can use it and this bench and the
   film cannot drift apart */
export const gaitPhase = (x, x0, h, face = 1) => (face * (x - x0)) / (0.6 * h);

const H = 40;                       // one body height, all three lanes
const X0 = 20, X1 = 172;            // the walk, in cells

const ground = (F, y) => { F.line(0, y, 192, y, 3, 1); };

/* a lane walks the same path at the same speed; only the phase rule changes */
function lane(F, u, y, how, face = 1) {
  /* a plain there-and-back so the body is always travelling and the gate
     always has a displacement to divide by */
  const p = Math.abs(((u * 2) % 2) - 1);
  const x = face > 0 ? X0 + (X1 - X0) * p : X1 - (X1 - X0) * p;
  const ph = how === "time" ? u * 7.35                       // what the films do
                            : gaitPhase(x, face > 0 ? X0 : X1, H, face);
  F.fig(x, y, H, { mode: "walk", phase: ph, face, guise: "everyman" }, 7);
  ground(F, y);
}

export default {
  n: "zz", slug: "zz-tread", title: "THE TREAD BENCH",
  tagline: "phase from time against phase from distance",
  accent: "#5aa7ff", seed: 7331, slate: false,
  drone: { base: 55, steps: [0], bright: false },
  movements: [
    {
      label: "DECOUPLED · PHASE FROM TIME", seconds: 8, line: "",
      draw(u, F) { lane(F, u, 44, "time", 1); },
    },
    {
      label: "PINNED · PHASE FROM DISTANCE", seconds: 8, line: "",
      draw(u, F) { lane(F, u, 94, "dist", 1); },
    },
    {
      label: "PINNED · THE OTHER WAY", seconds: 8, line: "",
      draw(u, F) { lane(F, u, 142, "dist", -1); },
    },
    {
      /* THE BODY DOES NOT MOVE AND THE PHASE DOES. This is the measurement the
         contract above was derived without: how far does a foot actually travel
         across screen in one cycle? figure.mjs says sin(q)*stride with stride =
         0.15h, but it also foreshortens the sagittal span by `turn` (0.88 for a
         walk), and whatever else happens between that number and a dot on the
         lattice happens here. Sweep one cycle over a stationary body and read
         the excursion off the picture. */
      label: "PROBE · FIXED BODY, ONE CYCLE", seconds: 8, line: "",
      draw(u, F) {
        F.fig(96, 94, H, { mode: "walk", phase: u, face: 1, guise: "everyman" }, 7);
        ground(F, 94);
      },
    },
  ],
};
