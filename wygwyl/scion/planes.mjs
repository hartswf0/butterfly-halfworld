/* ============================================================================
   planes.mjs — DEPTH, FOR A FIELD THAT HAS NONE.

   The halfworld is one 192x144 buffer. A room is a floor line and a window and
   a wall of ink, all at the same distance, because there is nowhere else for
   them to be. So when the camera moves, everything moves together, which is
   the one thing a camera move must not do.

   THE STACK IS NOT INVENTED. cineosis-lab's cels/build_scion.py measures seven
   planes per cel shot off the footage the poems were drawn from — metric depth,
   a parallax coefficient, and what is in each plane by name. Across the 91
   halfworld shots it covers (inherit.mjs), the medians are:

       P0 camera mask        2.02 m   parallax 1.643
       P1 foreground         3.45 m   parallax 1.449
       P2 character action   4.72 m   parallax 1.000
       P3 secondary / FX    11.10 m   parallax 0.618
       P4 midground          6.71 m   parallax 0.954
       P5 distant           12.58 m   parallax 0.567
       P6 sky                  —      never present in 91 shots

   TWO THINGS THERE DISAGREE WITH THE SCION PROMPT'S NOMINAL LADDER, and the
   measurement wins. Its P3 sits at Z 1.2, in front of a midground at 2.5 —
   measured, P3 is the furthest plane but one, because what lands in it is
   street lamps and trees, which stand BEHIND the middle of a room. And its
   stack runs out to Z 6.0 at P5, where the footage says 2.66: these are
   interiors and streets, not landscapes, and a room is a compressed space. A
   parallax built on the nominal numbers would hold the background almost
   still when the real one swings nearly two thirds as far as the character.

   HOW A PLANE WORKS HERE. Not a second buffer — the world has no alpha and
   compositing would need one. A plane is a COORDINATE WRAPPER around the kit:
   everything drawn through it is placed as that depth would place it, and the
   ink lands in the same single field as everything else, so blend.mjs and
   renderScene and the halftone pass all keep working untouched.
   ========================================================================= */

/* the measured stack, as medians over the 91 covered shots */
export const MEASURED = {
  P0: { name: "camera mask", z_m: 2.02, parallax: 1.643 },
  P1: { name: "foreground", z_m: 3.45, parallax: 1.449 },
  P2: { name: "character action", z_m: 4.72, parallax: 1.000 },
  P3: { name: "secondary / FX", z_m: 11.10, parallax: 0.618 },
  P4: { name: "midground", z_m: 6.71, parallax: 0.954 },
  P5: { name: "distant background", z_m: 12.58, parallax: 0.567 },
  P6: { name: "sky", z_m: null, parallax: 0.0 },
};
export const ORDER = ["P6", "P5", "P3", "P4", "P2", "P1", "P0"];   // far to near, MEASURED

/* THE TWO COLUMNS ABOVE ARE SEPARATE MEDIANS AND DO NOT RECONSTRUCT EACH OTHER.
   In the cel data a plane's parallax is exactly its shot's own character depth
   over its own — 278 of 286 planes satisfy it to within 0.02, median error five
   ten-thousandths. But each shot has a DIFFERENT character depth, so the median
   of the ratios is not the ratio of the medians: 4.72/12.58 is 0.375 where the
   median P5 parallax is 0.567. The parallax column is the authoritative one,
   because a ratio taken per shot and then medianed is still a ratio. The depth
   column is descriptive — it says how far away these rooms are, and nothing
   should be derived from it.

   parallaxOf is therefore for ONE shot, with that shot's own reference depth.
   Handing it a suite median gives a confident wrong number. */
export const parallaxOf = (z_m, ref) => {
  if (z_m == null || !ref) return 0;
  return +(ref / z_m).toFixed(4);
};

const FW = 192, FH = 144;

/* ----------------------------------------------------------------------------
   A STAGE: the stack, a camera, and a wrapper per plane.

     const S = makeStage({ camera: { move: "push", amplitude: 0.06 } });
     S.on(F, "P4", (G) => { G.line(0, 96, 192, 96, 5, 1); }, u);

   `u` is how far through the move we are, 0 to 1. A push scales each plane
   about the focus by its parallax; a truck slides it. Both are the same law
   with the camera's vector swapped, which is the only reason to have a stack
   at all: one number per plane, applied to everything drawn through it.
-------------------------------------------------------------------------------*/
export function makeStage(opts = {}) {
  const planes = { ...MEASURED, ...(opts.planes || {}) };
  const cam = opts.camera || { move: "push", amplitude: 0.06 };
  /* the cel data gives focus in its own 480x270; default to the field's centre */
  const fx = opts.focus ? opts.focus[0] * FW / 480 : FW / 2;
  const fy = opts.focus ? opts.focus[1] * FH / 270 : FH / 2;

  /* what this plane does at this point in the move */
  function xform(pid, u) {
    const p = planes[pid] || planes.P2;
    const k = (p.parallax ?? 0) * (cam.amplitude ?? 0) * (u ?? 0);
    if (cam.move === "truck" || cam.move === "pan")
      return { s: 1, dx: k * FW, dy: 0 };
    /* push and crane_push: scale about the focus, and a crane lifts as it goes */
    return { s: 1 + k, dx: 0, dy: cam.move === "crane_push" ? -k * FH * 0.35 : 0 };
  }

  /* THE WRAPPER. Every primitive that takes a position gets one; everything
     else passes straight through, so a plane never has to be kept in step with
     the kit by hand. `fig` and `word` scale their size as well as their place,
     because a body that moves nearer and does not grow is a sticker. */
  const POS2 = ["put", "ink"];                            // (x, y, …)
  const BOX = ["rect", "box"];                            // (x, y, w, h, …)
  const RAD = ["disc", "ring"];                           // (cx, cy, r, …)
  function wrap(F, pid, u) {
    const { s, dx, dy } = xform(pid, u);
    const X = (x) => fx + (x - fx) * s + dx;
    const Y = (y) => fy + (y - fy) * s + dy;
    const G = Object.create(null);
    for (const k of Object.keys(F)) {
      const v = F[k];
      if (typeof v !== "function") { G[k] = v; continue; }
      if (POS2.includes(k)) G[k] = (x, y, ...r) => v(X(x), Y(y), ...r);
      else if (BOX.includes(k)) G[k] = (x, y, w, h, ...r) => v(X(x), Y(y), w * s, h * s, ...r);
      else if (RAD.includes(k)) G[k] = (cx, cy, r2, ...r) => v(X(cx), Y(cy), r2 * s, ...r);
      else if (k === "line") G[k] = (x0, y0, x1, y1, l, th, set) => v(X(x0), Y(y0), X(x1), Y(y1), l, th, set);
      else if (k === "arc") G[k] = (cx, cy, r2, a0, a1, ...r) => v(X(cx), Y(cy), r2 * s, a0, a1, ...r);
      else if (k === "fig") G[k] = (x, y, h, ...r) => v(X(x), Y(y), h * s, ...r);
      else if (k === "word") G[k] = (t, cx, cy, ph, ...r) => v(t, X(cx), Y(cy), ph * s, ...r);
      else if (k === "wordW") G[k] = (t, ph) => v(t, ph * s);
      /* noise and fbm are sampled, not drawn: moving their input is what makes
         a textured plane travel with the plane instead of swimming on it */
      else if (k === "noise" || k === "n2") G[k] = (x, y) => v(X(x), Y(y));
      else if (k === "fbm") G[k] = (x, y, o) => v(X(x), Y(y), o);
      else G[k] = v;
    }
    return G;
  }

  return {
    planes, camera: cam, focus: [fx, fy],
    xform,
    /* draw into a plane */
    on(F, pid, fn, u = 0) { fn(wrap(F, pid, u), xform(pid, u)); },
    /* every plane that has content, far to near, so near ink overwrites far */
    sweep(F, map, u = 0) {
      for (const pid of ORDER) if (map[pid]) this.on(F, pid, map[pid], u);
    },
  };
}
