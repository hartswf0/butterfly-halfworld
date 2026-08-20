/* a bench for F.over: a world entirely at the figure's own fill level.
   Left, the body drawn straight — it should come out a wireframe.
   Right, the same body through F.over — it should be solid. */
export default {
  n: "zz", slug: "zz-over", title: "THE OVER BENCH", tagline: "a body on ground at its own fill level",
  accent: "#5aa7ff", seed: 7, slate: false,
  drone: { base: 55, steps: [0], bright: false },
  movements: [{
    label: "STRAIGHT vs OVER", seconds: 6, line: "",
    draw(u, F) {
      F.clear(4);
      F.fig(52, 132, 78, { mode: "stand", guise: "poet", weight: 0.7 }, 7);
      F.over(G => G.fig(140, 132, 78, { mode: "stand", guise: "poet", weight: 0.7 }, 7),
             { remap: v => (v === 4 ? 6 : v) });
    },
  }],
};
