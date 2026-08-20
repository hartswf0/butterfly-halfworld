/* ============================================================================
   flow.mjs — THE TRUE MOTION OF A FILM, AND THE MOTION THE LATTICE CANNOT HOLD.

   THE THING THIS CAN DO THAT NOTHING ELSE CAN. Optical flow on real footage is
   estimated: you look at two pictures and guess what moved where, and you are
   often wrong, which is why hand-annotated flow datasets are expensive and why
   the ones that exist are mostly synthetic. These films do not need estimating.
   `renderTagged` fills a parallel field with WHICH DRAW CALL wrote each cell,
   so the same object can be located in two frames exactly. The correspondence
   is not inferred. It is remembered.

   WHAT THAT BUYS, BEYOND A DATASET. A defect this project has never been able
   to name:

     A figure crossing forty cells over twenty seconds at twelve frames a second
     moves one sixth of a cell per frame. It is animating in the source and
     standing still on the lattice. Every instrument here would pass it —
     coverage is fine, the movement measures as moving over its whole span, and
     the picture is a picture. But nobody watching sees motion; they see a
     stutter every sixth frame, which reads as a fault in the render rather than
     as a walk.

   So the number that matters is not how much the film moves. It is what
   fraction of the ink that DID move, moved less than one cell — motion written
   into the film that the lattice is too coarse to carry.

       CARRIED     >= 1 cell per frame · the viewer sees movement
       SUB-CELL    > 0 but < 1        · the source moves, the screen stutters
       STILL       exactly 0
   ========================================================================= */

const STILL = 0.125;    // cells per frame below which motion is not distinguishable

/* segment a frame into objects by their tag, with the mean level each carries */
function objects(ids, levels, w, h) {
  const m = new Map();
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const q = y * w + x, id = ids[q];
    if (!id || levels[q] <= 0.5) continue;
    let o = m.get(id);
    if (!o) m.set(id, o = { id, n: 0, sx: 0, sy: 0, sl: 0 });
    o.n++; o.sx += x; o.sy += y; o.sl += levels[q];
  }
  for (const o of m.values()) { o.cx = o.sx / o.n; o.cy = o.sy / o.n; o.lv = o.sl / o.n; }
  return [...m.values()];
}

/* MATCH BY WHAT AN OBJECT IS, NOT BY THE ORDER IT WAS DRAWN IN.

   The tag is a serial bumped per call, so a movement containing `if (open >
   0.06)` makes a different number of calls at different u and every tag after
   that conditional shifts by one. Trusting the serial across two frames would
   report a door that opened as a whole room teleporting.

   The tag is still worth everything, because it gives PERFECT SEGMENTATION:
   which cells belong to one object is known, not inferred, and that is the
   hard half of correspondence. Matching those known objects across two frames
   is then a small assignment problem over a handful of shapes with areas and
   tones, rather than dense correspondence over twenty-seven thousand cells.
   Greedy on the best score, largest objects first, one partner each. */
function match(A, B) {
  const pairs = [], taken = new Set();
  for (const b of [...B].sort((p, q) => q.n - p.n)) {
    let best = null, bestScore = -Infinity;
    for (const a of A) {
      if (taken.has(a.id)) continue;
      const d = Math.hypot(a.cx - b.cx, a.cy - b.cy);
      /* an object keeps its size and its tone; it is allowed to move. A
         candidate more than a fifth of the frame away, or that changed area by
         more than half, is a different object wearing the same serial. */
      const area = Math.min(a.n, b.n) / Math.max(a.n, b.n);
      if (d > 38 || area < 0.5) continue;
      const score = area * 2 - d * 0.06 - Math.abs(a.lv - b.lv) * 0.4 + (a.id === b.id ? 0.35 : 0);
      if (score > bestScore) { bestScore = score; best = a; }
    }
    if (best) { taken.add(best.id); pairs.push([best, b]); }
    else pairs.push([null, b]);
  }
  return pairs;
}

/* TRUE displacement per object between two renders one step apart. */
export function trueFlow(rt, t, dt, w, h) {
  const idsA = new Int32Array(w * h), idsB = new Int32Array(w * h);
  const a = Float32Array.from(rt.renderTagged(t, idsA));
  const b = Float32Array.from(rt.renderTagged(t + dt, idsB));
  const A = objects(idsA, a, w, h), B = objects(idsB, b, w, h);

  let carried = 0, sub = 0, still = 0, fresh = 0, moved = 0, sumDisp = 0;
  const perObject = [];
  for (const [p, o] of match(A, B)) {
    /* ink with no partner is ink that arrived; a displacement for it would be
       an invention, which is the lie estimated flow tells */
    if (!p) { fresh += o.n; continue; }
    const d = Math.hypot(o.cx - p.cx, o.cy - p.cy);
    sumDisp += d * o.n;
    /* WHERE STILL ENDS. A wall does not move, but the set of cells it owns
       shifts by a cell here and there as the light on it changes, and its
       centroid wobbles a few hundredths. Calling that motion made the first
       run of this instrument flag every movement containing a large lit
       surface — the wall was outvoting the man. Below an eighth of a cell per
       frame is one cell of travel per second, which at this lattice and this
       frame rate cannot be told from a static object being re-inked.

       Between there and a whole cell is the band that matters: the object is
       genuinely travelling, and the screen shows it in ticks. */
    if (d < STILL) still += o.n;
    else if (d < 1) { sub += o.n; moved += o.n; }
    else { carried += o.n; moved += o.n; }
    perObject.push({ cells: o.n, disp: d });
  }
  const ink = carried + sub + still + fresh;
  return {
    ink, objects: perObject.sort((x, y2) => y2.cells - x.cells).slice(0, 8),
    subCellShare: moved ? sub / moved : 0,
    carriedShare: ink ? carried / ink : 0,
    stillShare: ink ? still / ink : 0,
    arrivedShare: ink ? fresh / ink : 0,
    meanDisp: ink ? sumDisp / ink : 0,
    /* the number the film cares about: of the ink a viewer could see move,
       how much of it is too small a step for the lattice to show */
    movingInk: ink ? moved / ink : 0,
    /* and how coarse the ticks are — frames between one-cell steps, for the
       ink that is travelling. Two frames is a walk; ten is a stutter. */
    tickFrames: sub + carried > 0 && sumDisp > 0
      ? (carried + sub) / perObject.filter(o => o.disp >= STILL).reduce((a, o) => a + o.cells * o.disp, 1e-9)
      : 0,
  };
}

/* A DENSE FIELD, EXACT WHERE IT CLAIMS TO BE. Every cell of a tagged object
   carries that object's own displacement; cells belonging to an object that is
   not in both frames carry nothing and are marked invalid, because inventing a
   vector for ink that just arrived is exactly the lie estimated flow tells. */
export function denseFlow(rt, t, dt, w, h) {
  const idsA = new Int32Array(w * h), idsB = new Int32Array(w * h);
  const a = Float32Array.from(rt.renderTagged(t, idsA));
  const b = Float32Array.from(rt.renderTagged(t + dt, idsB));
  const A = objects(idsA, a, w, h), B = objects(idsB, b, w, h);
  const dsp = new Map();
  for (const [p, o] of match(A, B)) if (p) dsp.set(o.id, [o.cx - p.cx, o.cy - p.cy]);
  const fx = new Float32Array(w * h), fy = new Float32Array(w * h);
  const valid = new Uint8Array(w * h);
  for (let q = 0; q < w * h; q++) {
    if (b[q] <= 0.5) continue;
    const d = dsp.get(idsB[q]);
    if (!d) continue;
    fx[q] = d[0]; fy[q] = d[1]; valid[q] = 1;
  }
  return { fx, fy, valid, levels: b };
}
