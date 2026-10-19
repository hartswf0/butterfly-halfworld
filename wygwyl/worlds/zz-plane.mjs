/* ============================================================================
   zz-plane.mjs — THE MEASURED STACK, UNDER A CAMERA.

   Not a film. A bench for depth, built the way zz-tread was built for the
   ground: the defect only shows when the thing moves, so the bench moves it.

   Six identical markers, one per plane, at the same screen position at u = 0.
   Push the camera and they must separate — P0 fastest, P5 slowest — by exactly
   the ratios cels/build_scion.py measured off the footage. Anything that
   stays together is a plane that is not doing its job, and a flat field keeps
   everything together, which is what the suite has always done.

   The second movement is a room: the same room 01 draws, but with its parts
   put where the cels say they are. The wall and the window go to the
   midground, the floor to the foreground, the figure to P2. Under a push the
   room opens instead of swelling.
   ========================================================================= */
import { makeStage, MEASURED, ORDER } from "../scion/planes.mjs";

/* the camera the cels measured most often: 66 of 91 shots push */
const CAM = { move: "push", amplitude: 0.25 };   /* exaggerated so a bench can be read; P0 at 1.643 leaves the frame much past this */
const S = makeStage({ camera: CAM });

const PLANES = ORDER.filter(p => p !== "P6");      // never present in 91 shots

/* ONE MARKER PER PLANE, ALL THE SAME DISTANCE FROM THE FOCUS. A push scales
   about the focus, so a marker sitting ON it never moves however deep it is —
   the first version put all six at the centre and measured nothing. At a fixed
   offset d the drift is d * parallax * amplitude, so the six drifts ARE the
   six parallaxes, read straight off the picture. */
const OFF = 50;                                     // cells right of the focus
function markers(F, u) {
  PLANES.forEach((pid, k) => {
    const y = 18 + k * 21;
    S.on(F, pid, (G) => {
      G.rect(96 + OFF - 5, y, 10, 10, 7, true);
      G.line(96, y + 5, 96 + OFF - 8, y + 5, 2, 1); // the rule the drift opens against
    }, u);
    /* the label does not travel: it names the plane, it is not in the world */
    F.word(pid, 12, y + 5, 7, 5);
  });
  F.line(96, 0, 96, 143, 2, 1);                     // the focus, which never moves
}

export default {
  n: "zz", slug: "zz-plane", title: "THE PLANE BENCH",
  tagline: "the measured stack, under a push",
  accent: "#5aa7ff", seed: 1212, slate: false,
  drone: { base: 55, steps: [0], bright: false },
  movements: [
    {
      label: "SIX PLANES, ONE PUSH", seconds: 8, line: "",
      draw(u, F) { markers(F, u); },
    },
    {
      /* A ROOM WITH ITS PARTS WHERE THE CELS PUT THEM. P4 carries wall, floor
         and window in 70, 51 and 25 of the covered shots; P1 carries floor and
         wall; the body is P2 by definition. */
      label: "A ROOM, IN DEPTH", seconds: 8, line: "",
      draw(u, F) {
        const FLOOR = 112;
        S.on(F, "P5", (G) => {                      // the far wall
          G.rect(0, 0, 192, FLOOR, 1, true);
          G.line(0, 34, 192, 34, 3, 1);
        }, u);
        S.on(F, "P4", (G) => {                      // the window and the wall it is in
          G.box(128, 40, 34, 42, 6, 1);
          G.line(145, 40, 145, 82, 5, 1);
          G.line(128, 61, 162, 61, 5, 1);
          G.line(0, FLOOR, 192, FLOOR, 6, 1);
        }, u);
        S.on(F, "P2", (G) => {                      // the body
          G.fig(70, FLOOR, 40, { mode: "stand", guise: "poet", face: 1 }, 7);
        }, u);
        S.on(F, "P1", (G) => {                      // the floor nearest us
          for (let x = 0; x < 192; x += 16) G.line(x, FLOOR, x + 8, 143, 3, 1);
        }, u);
        S.on(F, "P0", (G) => {                      // a doorframe edge crossing the lens
          G.rect(0, 0, 14, 144, 7, true);
        }, u);
      },
    },
  ],
};
