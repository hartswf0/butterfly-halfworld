/* ============================================================================
   set.lot — THE SERVICE ALLEY, THE FENCED LOT, THE WAREHOUSE ANNEX.
   SET_PIECE for I REMEMBER BEING A BUTTERFLY (B01). BF-26, BF-27, BF-28 — one
   continuous exterior, no cut, per scenes/_plans/the-lot.mjs.

   EVIDENCE.
     BF-26  "It crosses a fenced lot where waist-high weeds have grown through
             the chassis of a delivery truck."
     BF-27  "The bag splits, releasing lavender stems across the pavement."
     BF-28  "A low brick structure attached to the rear of the warehouse,
             windows covered in plywood. On the nearest board, painted: a broken
             circle with a line through it. The paint is new."

   ---------------------------------------------------------------------------
   THE ONE THING THIS FILE HAS TO GET RIGHT: GROWN THROUGH.

   The plan says it in its own note — "the weeds and the truck are authored as
   interleaved STATIONS, not as one prop, because the growing-through is the
   fact." A drawing has the same obligation and it is a LAYER ORDER problem, not
   a shape problem: if the weeds are drawn behind the chassis they are weeds
   beside a truck, and if they are drawn in front of it they are weeds in front
   of a truck. So truckAndWeeds() draws in three passes — stems behind, the
   chassis, stems in front, from ONE deterministic stem set split by a depth
   key. The same plant is on both sides of the metal. That is the sentence.

   ---------------------------------------------------------------------------
   LAVENDER IS A SMELL AND MUST NEVER BE DRAWN PURPLE (BUILD-BRIEF §1). It is
   drawn as what it physically is — straight woody stems and a dense spike of
   small buds — which is also what assets/character/iona.mjs decided for the
   bundle in the bag, and this is the same plant on the ground, so the two agree
   on geometry: nine stems, five buds to a spike.

   THE PAINT IS NOT DRAWN HERE. The broken circle on the plywood comes from
   brokenCircle() through assets/_broken-circle.mjs, imported by BF-28, because
   MOTION-BRIEF §5 says the five occurrences of that shape are one array and a
   set module that drew its own would make the world lie in exactly the place
   the world is about. plywoodFace() returns the BOX the mark goes in and paints
   nothing inside it.

   HORIZONTALS: an alley is a stack of them. Kerb, fence rail, brick courses,
   the top of the plywood run — every one through brokenLine/brokenBand.
   ========================================================================= */
import { INK, inkLevel, gray, rnd, lerp, clamp01 } from "../../engine/halfworld-engine.mjs";
import { brokenRun, brokenLine, brokenBand, speckle, streak, L, LV } from "./_kit.mjs";

const TAU = Math.PI * 2;

/* ===========================================================================
   PAVEMENT. Cracked, patched, and LIGHT — it is most of the frame in all three
   units and the running happens on it.
   ======================================================================== */
export function pavement(g, y0, y1, x0, x1, { seed = 61, cracks = 5 } = {}) {
  g.save();
  g.fillStyle = LV(1); g.fillRect(x0, y0, x1 - x0, y1 - y0);
  const r = rnd(seed | 0);
  // expansion joints, crowding with depth
  for (let i = 0; i <= 5; i++) {
    const k = Math.pow(i / 5, 0.78);
    brokenLine(g, x0, x1, lerp(y0, y1, k), seed + i * 11,
      { lw: 2.2 + k * 2.4, segs: 3, gap: 0.05, color: LV(3) });
  }
  // cracks: a crack wanders and forks; a straight one is a joint
  g.strokeStyle = LV(4); g.lineCap = "round";
  for (let i = 0; i < cracks; i++) {
    let x = lerp(x0, x1, r()), y = lerp(y0, y1, 0.2 + r() * 0.7);
    let a = -Math.PI / 2 + (r() - 0.5) * 2.2;
    g.lineWidth = 2.6;
    g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 7; k++) {
      a += (r() - 0.5) * 0.9;
      x += Math.cos(a) * 26; y += Math.sin(a) * 16;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  speckle(g, x0, y0, x1, y1, seed + 700, 46, 2.8, 3);
  g.restore();
}

/* ===========================================================================
   THE ALLEY WALLS. Two brick planes converging on the far end. Drawn as
   receding courses so the perspective is in the masonry and not in a vanishing
   point somebody had to invent.
   ======================================================================== */
export function alleyWall(g, near, far, { side = -1, seed = 71, courses = 12, level = 1 } = {}) {
  g.save();
  g.beginPath();
  g.moveTo(near.x, near.top); g.lineTo(far.x, far.top);
  g.lineTo(far.x, far.y); g.lineTo(near.x, near.y);
  g.closePath();
  g.fillStyle = LV(level); g.fill();
  g.strokeStyle = INK; g.lineWidth = 5; g.stroke();
  g.clip();
  for (let i = 1; i < courses; i++) {
    const k = Math.pow(i / courses, 1.05);
    const yN = lerp(near.top, near.y, k), yF = lerp(far.top, far.y, k);
    for (const [a, b] of brokenRun(0, 1, seed + i * 7, { segs: 3, gap: 0.05 })) {
      g.strokeStyle = LV(level + 2); g.lineWidth = 2.4;
      g.beginPath();
      g.moveTo(lerp(near.x, far.x, a), lerp(yN, yF, a));
      g.lineTo(lerp(near.x, far.x, b), lerp(yN, yF, b));
      g.stroke();
    }
  }
  // a downpipe and its stain — the only vertical on a wall made of horizontals
  const px = lerp(near.x, far.x, 0.42);
  g.strokeStyle = INK; g.lineWidth = 6;
  g.beginPath();
  g.moveTo(px, lerp(near.top, far.top, 0.42)); g.lineTo(px, lerp(near.y, far.y, 0.42));
  g.stroke();
  streak(g, px + side * 9, lerp(near.top, far.top, 0.6), lerp(near.y, far.y, 0.5), 5, seed + 3, level + 3);
  g.restore();
}

/* ===========================================================================
   CHAIN-LINK. A diamond mesh is a dot-lattice trap: drawn honestly it beats
   against the halftone and turns to porridge. So the fence is drawn as what
   survives — posts, a broken top rail, and a SPARSE set of wires at level 2 —
   and the mesh is implied by the two directions rather than by the count.
   ======================================================================== */
export function chainFence(g, x0, x1, yBase, h, { seed = 83, posts = 5, pitch = 46 } = {}) {
  g.save();
  g.beginPath(); g.rect(x0, yBase - h, x1 - x0, h); g.clip();
  g.strokeStyle = LV(2); g.lineWidth = 2.2;
  g.beginPath();
  for (let x = x0 - h; x < x1 + h; x += pitch) {
    g.moveTo(x, yBase); g.lineTo(x + h, yBase - h);
    g.moveTo(x, yBase - h); g.lineTo(x + h, yBase);
  }
  g.stroke();
  g.restore();
  brokenLine(g, x0, x1, yBase - h, seed, { lw: 5, segs: 3, gap: 0.04 });
  g.strokeStyle = INK; g.lineWidth = 6; g.lineCap = "round";
  g.beginPath();
  for (let i = 0; i <= posts; i++) {
    const x = lerp(x0, x1, i / posts);
    g.moveTo(x, yBase); g.lineTo(x, yBase - h - 6);
  }
  g.stroke();
}

/* ===========================================================================
   A WEED. Waist-high, gone to seed, ink and one light tone. Deterministic from
   the seed so a stem is in the same place in every frame of a loop.
   ======================================================================== */
export function weed(g, x, y, h, { seed = 5, blades = 6, level = 3 } = {}) {
  const r = rnd(seed | 0);
  g.save();
  g.strokeStyle = LV(level); g.lineCap = "round";
  for (let i = 0; i < blades; i++) {
    const lean = (r() - 0.5) * h * 0.62;
    const hh = h * (0.55 + r() * 0.55);
    g.lineWidth = 2.2 + r() * 1.8;
    g.beginPath();
    g.moveTo(x + (r() - 0.5) * h * 0.10, y);
    g.quadraticCurveTo(x + lean * 0.4, y - hh * 0.6, x + lean, y - hh);
    g.stroke();
    // the seed head: three ticks, geometry, at the tip
    if (i % 2 === 0) {
      g.lineWidth = 2;
      for (const s of [-1, 0, 1]) {
        g.beginPath();
        g.moveTo(x + lean, y - hh);
        g.lineTo(x + lean + s * h * 0.06, y - hh - h * 0.09);
        g.stroke();
      }
    }
  }
  g.restore();
}

/* ===========================================================================
   THE TRUCK CHASSIS, WITH WEEDS GROWN THROUGH IT.
   Three passes off ONE stem set. See the header: this is the whole point.
   ======================================================================== */
export function truckAndWeeds(g, cab, rear, { seed = 97, stems = 14, h = 92 } = {}) {
  const r = rnd(seed | 0);
  const S = [];
  for (let i = 0; i < stems; i++) {
    const k = r();
    S.push({
      x: lerp(rear.x, cab.x, k) + (r() - 0.5) * 40,
      y: lerp(rear.y, cab.y, k) + (r() - 0.5) * 16,
      h: h * (0.7 + r() * 0.7),
      behind: r() < 0.5,
      seed: seed + i * 13,
    });
  }
  for (const s of S) if (s.behind) weed(g, s.x, s.y, s.h, { seed: s.seed, level: 2 });

  /* the chassis. Not a truck: a truck is a volume and this has been stripped to
     its frame for years. Two rails, four wheel arches with nothing in them, a
     cab shell at one end. Level 2 with hard ink, so the plant reads against it. */
  g.save();
  const dx = cab.x - rear.x, dy = cab.y - rear.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const RAIL = 30;
  for (const s of [-1, 1]) {
    g.strokeStyle = INK; g.lineWidth = 7; g.lineCap = "butt";
    g.beginPath();
    g.moveTo(rear.x + nx * RAIL * s, rear.y + ny * RAIL * s);
    g.lineTo(cab.x + nx * RAIL * s, cab.y + ny * RAIL * s);
    g.stroke();
  }
  // cross members — broken, four of them
  g.lineWidth = 4;
  for (let i = 1; i <= 4; i++) {
    const k = i / 5;
    const px = lerp(rear.x, cab.x, k), py = lerp(rear.y, cab.y, k);
    g.beginPath();
    g.moveTo(px - nx * RAIL, py - ny * RAIL); g.lineTo(px + nx * RAIL * 0.2, py + ny * RAIL * 0.2);
    g.moveTo(px + nx * RAIL * 0.5, py + ny * RAIL * 0.5); g.lineTo(px + nx * RAIL, py + ny * RAIL);
    g.stroke();
  }
  // the cab shell: a light plane with a hole where the windscreen was
  const cw = 78, ch = 92;
  g.fillStyle = LV(2);
  g.fillRect(cab.x - cw / 2, cab.y - ch, cw, ch);
  g.strokeStyle = INK; g.lineWidth = 5;
  g.strokeRect(cab.x - cw / 2, cab.y - ch, cw, ch);
  g.fillStyle = "#ffffff";
  g.fillRect(cab.x - cw * 0.34, cab.y - ch * 0.84, cw * 0.68, ch * 0.40);
  g.lineWidth = 4;
  g.strokeRect(cab.x - cw * 0.34, cab.y - ch * 0.84, cw * 0.68, ch * 0.40);
  // wheel arches with nothing in them
  g.lineWidth = 5;
  for (const k of [0.18, 0.74]) {
    const px = lerp(rear.x, cab.x, k), py = lerp(rear.y, cab.y, k);
    g.beginPath(); g.arc(px + nx * RAIL, py + ny * RAIL, 26, Math.PI, TAU); g.stroke();
  }
  streak(g, lerp(rear.x, cab.x, 0.5), rear.y - 30, rear.y + 6, 5, seed + 9, 4);
  g.restore();

  for (const s of S) if (!s.behind) weed(g, s.x, s.y, s.h, { seed: s.seed, level: 3 });
}

/* ===========================================================================
   THE WAREHOUSE ANNEX: a low brick structure, windows covered in plywood.
   Returns the BOX for the painted mark on the nearest board. It does not paint
   it — see the header.
   ======================================================================== */
export function plywoodFace(g, x, y, w, h, { seed = 109, boards = 3 } = {}) {
  g.save();
  // brick
  g.fillStyle = LV(1); g.fillRect(x, y, w, h);
  g.strokeStyle = INK; g.lineWidth = 5; g.strokeRect(x, y, w, h);
  for (let i = 1; i < 11; i++) {
    brokenLine(g, x, x + w, y + (h * i) / 11, seed + i * 5,
      { lw: 2.2, segs: 3, gap: 0.045, color: LV(3) });
  }
  // the parapet: broken, because it is the widest horizontal in the frame
  brokenBand(g, x - 10, x + w + 10, y - 16, 16, seed + 3, 2, { segs: 3, gap: 0.03, lw: 4 });

  // the boarded openings. Plywood is a LIGHT plane with a hard edge and a grain
  // that runs one way; the fixings are what make it read as nailed on.
  const bw = (w * 0.86) / boards, gap = (w * 0.14) / (boards + 1);
  let last = null;
  for (let i = 0; i < boards; i++) {
    const bx = x + gap + i * (bw + gap);
    const by = y + h * 0.24, bh = h * 0.46;
    g.fillStyle = LV(2); g.fillRect(bx, by, bw, bh);
    g.strokeStyle = INK; g.lineWidth = 5; g.strokeRect(bx, by, bw, bh);
    g.strokeStyle = LV(4); g.lineWidth = 2;
    for (let k = 1; k < 6; k++) {
      const gy = by + (bh * k) / 6;
      g.beginPath(); g.moveTo(bx + 4, gy); g.lineTo(bx + bw - 4, gy); g.stroke();
    }
    g.fillStyle = INK;
    for (const [fx, fy] of [[0.08, 0.06], [0.92, 0.06], [0.08, 0.94], [0.92, 0.94], [0.5, 0.5]]) {
      g.beginPath(); g.arc(bx + bw * fx, by + bh * fy, 3.4, 0, TAU); g.fill();
    }
    last = { x: bx, y: by, w: bw, h: bh };
  }
  g.restore();
  // the mark goes on the NEAREST board, which is the last one drawn
  return {
    board: last,
    /* PASS 2 (BF-28): at 0.60 x 0.62 of a board the mark came out 101px across
       and read as a plain circle — the gap in the ring and the crooked stroke
       both fell under the dot pitch. Somebody painted this with a brush on a
       boarded window; it takes most of the board. */
    markBox: { x: last.x + last.w * 0.11, y: last.y + last.h * 0.13,
               w: last.w * 0.78, h: last.h * 0.74 },
  };
}

/* ===========================================================================
   THE SPILLED LAVENDER. Straight woody stems and a dense spike of small buds —
   the same geometry iona.mjs draws in the bag, because it is the same plant.
   NEVER PURPLE.
   ======================================================================== */
export function lavenderSpill(g, cx, cy, spread, { seed = 131, stems = 9, len = 96 } = {}) {
  const r = rnd(seed | 0);
  g.save();
  for (let i = 0; i < stems; i++) {
    const t = i / (stems - 1);
    const x0 = cx + (t - 0.5) * spread, y0 = cy + (r() - 0.5) * spread * 0.22;
    const a = (r() - 0.5) * 2.4;
    const L2 = len * (0.7 + r() * 0.6);
    const x1 = x0 + Math.cos(a) * L2, y1 = y0 + Math.sin(a) * L2 * 0.34;
    g.strokeStyle = LV(4); g.lineWidth = 3.4; g.lineCap = "round";
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    // the spike: five buds, geometry, at the far end
    for (let k = 0; k < 5; k++) {
      const kt = k / 4;
      const bx = lerp(x1, x1 + Math.cos(a) * L2 * 0.30, kt);
      const by = lerp(y1, y1 + Math.sin(a) * L2 * 0.30 * 0.34, kt);
      g.fillStyle = LV(3);
      g.beginPath(); g.ellipse(bx, by, 5.4, 3.4, a, 0, TAU); g.fill();
      g.strokeStyle = INK; g.lineWidth = 1.6;
      g.beginPath(); g.ellipse(bx, by, 5.4, 3.4, a, 0, TAU); g.stroke();
    }
  }
  g.restore();
}

/** The split paper bag it came out of. */
export function splitBag(g, cx, cy, w, h, { seed = 137 } = {}) {
  g.save();
  g.fillStyle = LV(2);
  g.beginPath();
  g.moveTo(cx - w / 2, cy - h);
  g.lineTo(cx + w / 2, cy - h * 0.86);
  g.lineTo(cx + w * 0.42, cy);
  g.lineTo(cx - w * 0.46, cy);
  g.closePath();
  g.fill();
  g.strokeStyle = INK; g.lineWidth = 4.4; g.lineJoin = "round"; g.stroke();
  // the split, and the wet at the bottom — the one tonal event on the paper
  g.strokeStyle = INK; g.lineWidth = 4;
  g.beginPath();
  g.moveTo(cx + w * 0.10, cy - h * 0.92);
  g.lineTo(cx + w * 0.02, cy - h * 0.44);
  g.lineTo(cx + w * 0.20, cy - h * 0.06);
  g.stroke();
  g.save();
  g.beginPath();
  g.moveTo(cx - w * 0.46, cy - h * 0.34); g.lineTo(cx + w * 0.44, cy - h * 0.30);
  g.lineTo(cx + w * 0.42, cy); g.lineTo(cx - w * 0.46, cy); g.closePath();
  g.clip();
  g.fillStyle = LV(4); g.fillRect(cx - w, cy - h, w * 2, h * 2);
  g.restore();
  g.restore();
}

/* ---- the asset ---------------------------------------------------------- */
export const asset = {
  id: "set.lot",
  type: "SET_PIECE",
  name: "The Lot",
  statusWord: "OVERGROWN",
  scene: "BF-26",
  params: {
    surfaces: "brick, asphalt, chain-link, rusted chassis, plywood",
    weeds: "waist-high, grown THROUGH the chassis — drawn in three passes",
    mark: "not drawn here; BF-28 imports brokenCircle()",
  },
  layers: ["pavement", "alley-walls", "fence", "weeds-behind", "chassis",
           "weeds-front", "annex", "plywood", "spill"],
  anchors: {
    alleyMouth: { x: .50, y: .92 }, alleyEnd: { x: .55, y: .62 },
    lotOpen: { x: .48, y: .44 }, annex: { x: .42, y: .24 },
  },
  states: {
    initial: "alley",
    nodes: {
      alley: { preview: { view: "alley" } },
      lot: { preview: { view: "lot" } },
      annex: { preview: { view: "annex" } },
    },
    edges: [["alley", "lot"], ["lot", "annex"]],
  },
  channels: ["view"],
  preview: () => ({ view: "lot", status: "OVERGROWN", progress: 0.5 }),

  draw(ctx, W, H, state) {
    const st = state || {};
    const sx = W / 1120, sy = H / 760;
    ctx.save(); ctx.scale(sx, sy);
    pavement(ctx, 330, 760, 0, 1120);
    if (st.view === "annex") {
      plywoodFace(ctx, 200, 150, 720, 380);
    } else if (st.view === "alley") {
      alleyWall(ctx, { x: 40, y: 700, top: 60 }, { x: 430, y: 380, top: 250 }, { side: 1, seed: 71 });
      alleyWall(ctx, { x: 1080, y: 700, top: 60 }, { x: 690, y: 380, top: 250 }, { side: -1, seed: 77 });
    } else {
      chainFence(ctx, 60, 1060, 560, 130);
      truckAndWeeds(ctx, { x: 800, y: 470 }, { x: 560, y: 530 });
    }
    ctx.restore();
    return { anchors: asset.anchors };
  },
};
export default asset;
export const LOT_VERSION = "set-lot/1.0.0";
