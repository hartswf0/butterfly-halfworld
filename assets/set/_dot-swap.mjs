/* assets/set/_dot-swap.mjs — THE PER-DOT ALLEGIANCE SWAP, as a drawing operation.
   ============================================================================
   MOTION-BRIEF: "THERE IS NO CROSS-FADE IN THIS WORLD." engine/motion.mjs gives
   `dissolve(u, gx, gy)` — an ordered Bayer-8 threshold that answers, per grid
   cell, WHICH IMAGE OWNS THIS DOT AT TIME u. That is the whole physics. What it
   does not give is a way to spend that answer on a canvas, and three units of
   Act III need one (BF-33, BF-35, and the whiteout inside BF-37).

   THE RULE THIS FILE EXISTS TO ENFORCE: both images run through the SAME
   threshold map, and the two ownership sets are exact complements. If A were
   drawn everywhere and B drawn over it through a mask, the seam would be a
   matte edge and every uncovered dot of A would still be under B — which is
   compositing, i.e. the thing the dot law forbids. Here each cell is painted
   exactly once, by exactly one image.

   VERIFIED, not asserted: at u = 0.5 the Bayer-8 matrix holds values 0..63, so
   `u > value/64` is true for exactly the 32 cells below 32 and false for the 32
   at or above it — 32/32 across an 8x8 cell. `assertHalf()` below runs that count
   at import time so the claim is checked by running code.

   CELL SIZE. The cell is a DOT-SCALE unit, not an image-scale one. At 10px in
   1120-space it is a little over two halftone dots across, which is the largest
   cell that still reads as dots switching rather than as tiles switching. Do not
   raise it past 14; the swap starts to look like a checkerboard wipe.
   ========================================================================= */
import { dissolve } from "../../engine/motion.mjs";

function assertHalf() {
  let a = 0, b = 0;
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) (dissolve(0.5, x, y) === "b" ? b++ : a++);
  if (a !== 32 || b !== 32) throw new Error(`[dot-swap] Bayer-8 is not 32/32 at u=0.5: a=${a} b=${b}`);
}
assertHalf();

/** Build the clip path of every cell owned by `which` ("a" | "b") inside rect. */
function ownership(g, rect, u, cell, which) {
  const cols = Math.ceil(rect.w / cell), rows = Math.ceil(rect.h / cell);
  g.beginPath();
  for (let gy = 0; gy < rows; gy++) {
    const y = rect.y + gy * cell, hh = Math.min(cell, rect.y + rect.h - y);
    for (let gx = 0; gx < cols; gx++) {
      if (dissolve(u, gx, gy) !== which) continue;
      const x = rect.x + gx * cell;
      g.rect(x, y, Math.min(cell, rect.x + rect.w - x), hh);
    }
  }
}

/** Paint A and B into `rect` so that every dot belongs to one of them and no
 *  dot belongs to both. `drawA` / `drawB` are painters taking (g) and are each
 *  called ONCE, inside their own clip. */
export function dotSwap(g, rect, u, drawA, drawB, { cell = 10 } = {}) {
  g.save(); ownership(g, rect, u, cell, "a"); g.clip(); drawA(g); g.restore();
  g.save(); ownership(g, rect, u, cell, "b"); g.clip(); drawB(g); g.restore();
}

/** The one-sided form: paint `draw` only into the cells that have switched.
 *  Used for the whiteout in BF-37, where "image A" is whatever is already on
 *  the canvas and there is nothing to re-draw. */
export function dotWash(g, rect, u, draw, { cell = 10 } = {}) {
  if (u <= 0) return;
  g.save(); ownership(g, rect, u, cell, "b"); g.clip(); draw(g); g.restore();
}

export const DOT_SWAP_VERSION = "dot-swap/1.0.0";
