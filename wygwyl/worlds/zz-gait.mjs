/* ============================================================================
   zz-gait.mjs — THE WALK, LAID OUT FLAT.

   Not a film. A bench. Eight phases of one cycle side by side, so a gait can
   be judged as a gait rather than glimpsed one frame at a time inside a poem.
   Shoot it with `node wygwyl/shoot.mjs --sweep zz-gait` and look at the strip:
   a walk is wrong in ways that are obvious across a row and invisible in a
   single frame, which is exactly how the first one survived fourteen films.
   ========================================================================= */
import { TAU } from "../halfworld.mjs";

const row = (F, y, h, n = 8, extra = {}) => {
  const gap = 190 / n;
  for (let k = 0; k < n; k++) {
    F.fig(gap * 0.5 + k * gap, y, h, { mode: "walk", phase: k / n, face: 1, guise: "poet", ...extra }, 7);
  }
  F.line(0, y, 88, y, 4, 1); F.line(96, y, 192, y, 4, 1);
};

export default {
  n: "zz", slug: "zz-gait", title: "THE GAIT BENCH", tagline: "eight phases of one cycle",
  accent: "#5aa7ff", seed: 4242, slate: false,
  drone: { base: 55, steps: [0], bright: false },
  movements: [
    { label: "WALK · TWO, HUGE, PLAIN", seconds: 8, line: "",
      draw(u, F) {
        F.fig(52, 138, 128, { mode: "walk", phase: 0.0, face: 1, guise: "everyman" }, 7);
        F.fig(140, 138, 128, { mode: "walk", phase: 0.25, face: 1, guise: "everyman" }, 7);
        F.line(0, 138, 88, 138, 4, 1); F.line(96, 138, 192, 138, 4, 1);
      } },
    { label: "WALK · BIG ENOUGH TO JUDGE", seconds: 8, line: "",
      draw(u, F) { row(F, 132, 108, 5); } },
    { label: "WALK · THREE SIZES", seconds: 8, line: "",
      draw(u, F) { row(F, 56, 44, 6); row(F, 104, 30, 8); row(F, 136, 18, 8); } },
    { label: "WALK · TURNED THE OTHER WAY", seconds: 8, line: "",
      draw(u, F) { row(F, 66, 52, 5, { face: -1 }); row(F, 134, 52, 5); } },
  ],
};
