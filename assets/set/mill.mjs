/* ============================================================================
   set.mill — THE CONVERTED TEXTILE MILL: stairwell and lobby, one space.
   SET_PIECE for I REMEMBER BEING A BUTTERFLY (B01). Eleven units play here:
   BF-15 .. BF-25.

   THE FURNITURE IS THE SCENE AGENT'S (SCENE-BRIEF §7). No set asset existed
   when Act II began, so this file is the mill's whole vocabulary, authored once
   and imported by eleven scenes, on the same reasoning that makes the rooms
   themselves plans: eleven independently-invented lobbies is eleven lobbies.

   ---------------------------------------------------------------------------
   THE LIGHT PROBLEM, and the decision the whole file turns on.

   "Light enters from windows at each landing and falls in LONG DUSTY COLUMNS."

   The harness fills the source canvas with #ffffff before draw() runs. So paper
   is already the brightest value available and a shaft of light CANNOT be drawn
   as something brighter — there is nothing brighter. Drawn as a pale wash it
   becomes a grey column, which is the exact inverse of the sentence, and drawn
   with any soft edge it becomes a glow, which the plan explicitly forbids
   ("Long and dusty; never a glow").

   So the stairwell is INVERTED: the interior carries tone (level 1 walls, level
   2 in the well) and the columns are PAPER, cut out of it with hard edges. A
   column is then literally an absence of ink, which is what light is on paper,
   and it is countable, which is what makes BF-16 an ADVANCE.

   And the dust: a lit column full of motes reads as PAPER WITH DARK SPECKS IN
   IT, because a mote you can see is a mote with light behind it. Drawing dust
   as light specks on a light column would be drawing nothing at all. Each mote's
   height is (u + phase) mod 1 so the set of motes at u=1 is identical to the set
   at u=0 — seamless by construction, the same trick BF-01 uses for its odour.

   ---------------------------------------------------------------------------
   HORIZONTALS. BUILD-BRIEF §5: full-width horizontals stripe the frame, and a
   mill is nothing but horizontals — brick courses, stair nosings, the flagstone
   joints, the transom over the entrance door. Every one of them goes through
   brokenLine/brokenBand from assets/set/_kit.mjs. The two exceptions are
   declared where they are drawn: the crash bar (an unbroken bar is what a crash
   bar IS) and the underside of the entrance transom.

   COLD SURFACES ONLY (BUILD-BRIEF §1): brick, steel, wired glass, flagstone,
   aluminium, rust. Nothing here is warm and nothing here is purple.
   ========================================================================= */
import { INK, inkLevel, gray, rnd, lerp, clamp01 } from "../../engine/halfworld-engine.mjs";
import { brokenRun, brokenLine, brokenBand, speckle, streak, L, LV } from "./_kit.mjs";

const TAU = Math.PI * 2;

/* ===========================================================================
   BRICK — the interior wall of the stairwell. "The windows are IN it, not
   opposite it" (the-mill fixtures). Kept at level 1: it is most of the frame in
   BF-16 and at level 2 the whole scene prints as a slab.
   ======================================================================== */
export function brickWall(g, x0, y0, x1, y1, { seed = 3, course = 26, level = 1 } = {}) {
  g.save();
  g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); g.clip();
  g.fillStyle = LV(level); g.fillRect(x0, y0, x1 - x0, y1 - y0);
  const r = rnd(seed | 0);
  let row = 0;
  for (let y = y0; y < y1; y += course, row++) {
    // the bed joint: broken, so twenty courses do not become twenty stripes
    brokenLine(g, x0 - 8, x1 + 8, y, seed + row * 7, { lw: 2.6, segs: 3, gap: 0.03, color: LV(level + 2) });
    // perpends: short ticks, offset half a brick every other course
    g.strokeStyle = LV(level + 2); g.lineWidth = 2.4;
    const off = (row % 2) * course * 1.1;
    g.beginPath();
    for (let x = x0 + off; x < x1; x += course * 2.2) {
      if (r() < 0.22) continue;                       // a few joints lost to paint
      g.moveTo(x, y + 2); g.lineTo(x, y + course - 2);
    }
    g.stroke();
  }
  // damp at the foot of the wall, and one rust run from a bracket
  speckle(g, x0, y1 - (y1 - y0) * 0.22, x1, y1, seed + 91, 26, 3.4, level + 3);
  streak(g, lerp(x0, x1, 0.72), y0 + (y1 - y0) * 0.18, y0 + (y1 - y0) * 0.62, 4, seed + 5, level + 3);
  g.restore();
}

/* ===========================================================================
   A MILL WINDOW. Steel frame, small panes, and the pane field is PAPER — this
   is where the light comes from, so it is the one place in the stairwell with
   no ink in it at all.
   ======================================================================== */
export function millWindow(g, x, y, w, h, { cols = 3, rows = 4, lw = 4 } = {}) {
  g.save();
  g.fillStyle = "#ffffff";
  g.fillRect(x, y, w, h);
  // the frame: a hard steel surround, heavier at the sill
  g.strokeStyle = INK; g.lineWidth = lw; g.lineJoin = "miter";
  g.strokeRect(x, y, w, h);
  g.lineWidth = lw * 1.7;
  g.beginPath(); g.moveTo(x - lw, y + h); g.lineTo(x + w + lw, y + h); g.stroke();
  /* two panes filmed over with mill dust, so the light is not evenly clean.
     PASS 2: at LV(1) on white these vanished and the window read as a blank
     rectangle cut in the brick. LV(3) — a window with some dirty glass in it. */
  g.fillStyle = LV(3);
  g.fillRect(x + w / cols + 2, y + 2, w / cols - 4, h / rows - 4);
  g.fillRect(x + 2, y + (h * (rows - 1)) / rows + 2, w / cols - 4, h / rows - 4);
  // glazing bars — they are what makes a window read as industrial, and at a
  // stairwell's distance they have to carry weight or the frame is empty
  g.strokeStyle = INK; g.lineWidth = Math.max(3.0, lw * 0.72);
  g.beginPath();
  for (let i = 1; i < cols; i++) { const px = x + (w * i) / cols; g.moveTo(px, y); g.lineTo(px, y + h); }
  for (let j = 1; j < rows; j++) { const py = y + (h * j) / rows; g.moveTo(x, py); g.lineTo(x + w, py); }
  g.stroke();
  g.restore();
}

/* ===========================================================================
   A LIGHT COLUMN. Authored window-to-floor so the light has a DIRECTION and the
   dust in it has a plane (the-mill fixture note). A quadrilateral of paper cut
   out of the toned well, hard-edged, with motes inside it.

   `lit` 0..1 lets a scene say how much of the column the body standing in it is
   receiving; it does not change the column's edges, because a shaft of light
   does not get wider when somebody walks into it.
   ======================================================================== */
export function lightColumn(g, from, to, { wTop = 34, wBot = 108, u = 0, motes = 22, seed = 7, lit = 1 } = {}) {
  const dx = to.x - from.x, dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;                 // unit normal to the shaft
  const P = [
    { x: from.x + nx * wTop * 0.5, y: from.y + ny * wTop * 0.5 },
    { x: to.x + nx * wBot * 0.5, y: to.y + ny * wBot * 0.5 },
    { x: to.x - nx * wBot * 0.5, y: to.y - ny * wBot * 0.5 },
    { x: from.x - nx * wTop * 0.5, y: from.y - ny * wTop * 0.5 },
  ];
  g.save();
  g.beginPath();
  g.moveTo(P[0].x, P[0].y); for (let i = 1; i < 4; i++) g.lineTo(P[i].x, P[i].y);
  g.closePath();
  g.fillStyle = "#ffffff"; g.fill();                   // PAPER. Light is an absence of ink.
  /* HARD EDGES. A shaft with a soft edge is a glow and the plan forbids it.
     PASS 2 (BF-16): at LV(2) the edge was invisible against a level-1 well and
     five shafts merged into one paper mass — the ADVANCE stopped being
     countable, which is the whole unit. The edge is now LV(4): a cut, not a
     fade. It is the boundary of the light and it is allowed to be seen. */
  g.strokeStyle = LV(4); g.lineWidth = 3.0; g.stroke();
  g.clip();
  // the dust. Seamless: every mote's position is (u + phase) mod 1.
  g.fillStyle = LV(lit > 0.6 ? 4 : 3);
  for (let i = 0; i < motes; i++) {
    const ph = (i * 0.6180339887 + seed * 0.113) % 1;
    const k = (u + ph) % 1;
    const across = (((i * 0.7548776662 + seed * 0.317) % 1) - 0.5) * lerp(wTop, wBot, k) * 0.92;
    const cx = lerp(from.x, to.x, k) + nx * across;
    const cy = lerp(from.y, to.y, k) + ny * across;
    const r = 2.4 + 1.8 * ((i * 0.37) % 1);
    g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill();
  }
  g.restore();
}

/* ===========================================================================
   A FLIGHT OF STAIRS, seen from the lobby looking up. What reads as stairs at
   this dot pitch is the NOSING RUN, not the risers: a ladder of broken
   horizontals that narrows and closes up as it recedes.
   ======================================================================== */
export function stairFlight(g, top, bot, {
  steps = 7, wTop = 150, wBot = 250, seed = 12, stringer = true, lw = 4.2,
} = {}) {
  for (let i = 0; i <= steps; i++) {
    const k = i / steps;
    const x = lerp(top.x, bot.x, k), y = lerp(top.y, bot.y, k);
    const w = lerp(wTop, wBot, k);
    // the tread plane, then its nosing over it. Both broken.
    brokenBand(g, x - w / 2, x + w / 2, y - 3, 7, seed + i * 3, 1, { segs: 3, gap: 0.035, lw: 2 });
    brokenLine(g, x - w / 2, x + w / 2, y + 4, seed + i * 5 + 1, { lw, segs: 2, gap: 0.05 });
  }
  // the stringer down the open side — broken, per the plan's own note.
  // `stringer:false` for a run drawn as a chain of short flights, where each
  // segment's own stringer would shoot off at the joins.
  if (!stringer) return;
  const sx0 = top.x + wTop / 2, sx1 = bot.x + wBot / 2;
  for (const [a, b] of brokenRun(0, 1, seed + 71, { segs: 3, gap: 0.05 })) {
    g.strokeStyle = INK; g.lineWidth = 5;
    g.beginPath();
    g.moveTo(lerp(sx0, sx1, a), lerp(top.y, bot.y, a));
    g.lineTo(lerp(sx0, sx1, b), lerp(top.y, bot.y, b));
    g.stroke();
  }
}

/* ===========================================================================
   THE FIRE DOOR. One leaf of steel — the-mill and the-laboratory meet on it and
   assert the same station name, so it is the world's one seamless walk between
   plans. Drawn as a flat plane with a kick plate, a push bar and a GAP at the
   floor, because BF-15 is a smell coming through that gap.
   ======================================================================== */
export function fireDoor(g, x, y, w, h, { gap = 14, open = 0 } = {}) {
  g.save();
  // the reveal the leaf sits in
  g.fillStyle = LV(3);
  g.fillRect(x - 16, y - 14, w + 32, h + 14);
  g.strokeStyle = INK; g.lineWidth = 5;
  g.strokeRect(x - 16, y - 14, w + 32, h + 14);
  // the leaf, hung short so the gap at the floor is real
  const lh = h - gap;
  const lw = w * (1 - open * 0.30);
  g.fillStyle = LV(2); g.fillRect(x, y, lw, lh);
  g.strokeStyle = INK; g.lineWidth = 5.5; g.strokeRect(x, y, lw, lh);
  // kick plate: stainless, one step lighter, and its top edge is broken
  g.fillStyle = LV(1); g.fillRect(x + 6, y + lh * 0.72, lw - 12, lh * 0.24);
  brokenLine(g, x + 6, x + lw - 6, y + lh * 0.72, 41, { lw: 3, segs: 2 });
  // the push bar, and the vision panel: wired glass, so it is paper with a grid
  g.fillStyle = "#ffffff";
  g.fillRect(x + lw * 0.18, y + lh * 0.16, lw * 0.64, lh * 0.22);
  g.strokeStyle = INK; g.lineWidth = 4;
  g.strokeRect(x + lw * 0.18, y + lh * 0.16, lw * 0.64, lh * 0.22);
  g.lineWidth = 1.8; g.beginPath();
  for (let i = 1; i < 5; i++) {
    const px = x + lw * 0.18 + (lw * 0.64 * i) / 5;
    g.moveTo(px, y + lh * 0.16); g.lineTo(px, y + lh * 0.38);
  }
  for (let j = 1; j < 3; j++) {
    const py = y + lh * 0.16 + (lh * 0.22 * j) / 3;
    g.moveTo(x + lw * 0.18, py); g.lineTo(x + lw * 0.82, py);
  }
  g.stroke();
  g.strokeStyle = INK; g.lineWidth = 8; g.lineCap = "round";
  g.beginPath();
  g.moveTo(x + lw * 0.12, y + lh * 0.52); g.lineTo(x + lw * 0.88, y + lh * 0.52);
  g.stroke();
  g.restore();
  return { gapY: y + lh, gapX0: x, gapX1: x + lw };
}

/* ===========================================================================
   THE LOBBY FLOOR. Stone, laid in courses, and it is the plane every object in
   BF-18 .. BF-25 sits on. Light: it is half the frame in four units.
   ======================================================================== */
export function stoneFloor(g, y0, y1, x0, x1, { seed = 21, courses = 6 } = {}) {
  g.save();
  g.fillStyle = LV(1); g.fillRect(x0, y0, x1 - x0, y1 - y0);
  for (let i = 0; i <= courses; i++) {
    const k = Math.pow(i / courses, 0.82);            // joints crowd with depth
    const y = lerp(y0, y1, k);
    brokenLine(g, x0, x1, y, seed + i * 9, { lw: 2.6 + k * 2.2, segs: 3, gap: 0.04, color: LV(3) });
    // the cross joints of that course, staggered
    const n = 3 + i;
    g.strokeStyle = LV(3); g.lineWidth = 2.2 + k * 1.4;
    g.beginPath();
    for (let j = 1; j < n; j++) {
      const px = lerp(x0, x1, (j + ((i % 2) ? 0.5 : 0)) / n);
      const y2 = lerp(y0, y1, Math.pow((i + 1) / courses, 0.82));
      g.moveTo(px, y); g.lineTo(px + (px - (x0 + x1) / 2) * 0.06, Math.min(y1, y2));
    }
    g.stroke();
  }
  speckle(g, x0, y0, x1, y1, seed + 400, 40, 2.6, 3);
  g.restore();
}

/* ===========================================================================
   THE LOBBY WALL — the background of six units (BF-17 .. BF-22), authored once.

   PASS 2, from BF-17's full-resolution frame. The back wall was brickWall()
   edge to edge, and at a 34px course with perpends every 75px it printed as
   GRAPH PAPER: a perfectly regular lattice of dashes over the entire field,
   with a figure standing on it. Two faults in one. It was mechanical, and it
   was the only thing in the frame — a converted mill lobby with nothing in it
   but masonry.

   What a converted mill lobby actually has, and what this draws:
     · a PLASTER wall above the dado — paper, which is where the ink budget goes
     · brick only in the dado band below it, where the plaster has been cut back
     · CAST-IRON COLUMNS. A textile mill is held up by them, and they are the
       one strong vertical available in a room made entirely of horizontals.
       Two, off-centre and unequally spaced, so they do not read as a colonnade.
     · a broken picture rail and a broken skirting

   Everything horizontal here is broken. The columns are not: a column with a
   gap in it is not holding anything up.
   ======================================================================== */
export function lobbyWall(g, x0, x1, yTop, yFloor, {
  seed = 44, dado = 0.62, columns = [0.22, 0.79], colW = 26,
} = {}) {
  const dy = lerp(yTop, yFloor, dado);
  g.save();
  // plaster: paper, with two long shallow cracks and a damp patch near the foot
  g.strokeStyle = LV(2); g.lineWidth = 2.4;
  for (const [k, len] of [[0.34, 0.42], [0.71, 0.28]]) {
    g.beginPath();
    let x = lerp(x0, x1, k), y = yTop + 20;
    g.moveTo(x, y);
    for (let i = 0; i < 5; i++) { x += (i % 2 ? 9 : -13); y += (dy - yTop) * len / 5; g.lineTo(x, y); }
    g.stroke();
  }
  // the dado: brick, cut back, and it is the only toned band above the floor
  brickWall(g, x0, dy, x1, yFloor, { seed, course: Math.max(18, (yFloor - dy) / 4), level: 1 });
  brokenLine(g, x0, x1, dy, seed + 1, { lw: 5, segs: 4, gap: 0.03 });
  brokenLine(g, x0, x1, yTop + (dy - yTop) * 0.18, seed + 2, { lw: 3.4, segs: 3, gap: 0.05, color: LV(3) });
  // the cast-iron columns
  for (const k of columns) {
    const cx = lerp(x0, x1, k);
    const h = yFloor - yTop;
    g.fillStyle = LV(2);
    g.fillRect(cx - colW / 2, yTop + h * 0.04, colW, yFloor - (yTop + h * 0.04));
    g.strokeStyle = INK; g.lineWidth = 5;
    g.strokeRect(cx - colW / 2, yTop + h * 0.04, colW, yFloor - (yTop + h * 0.04));
    // capital and base: a plain flare, drawn as geometry
    for (const [yy, ww] of [[yTop + h * 0.04, colW * 1.9], [yFloor - h * 0.03, colW * 1.7]]) {
      g.fillStyle = LV(3);
      g.fillRect(cx - ww / 2, yy - 12, ww, 22);
      g.strokeStyle = INK; g.lineWidth = 4;
      g.strokeRect(cx - ww / 2, yy - 12, ww, 22);
    }
  }
  g.restore();
  return { dadoY: dy };
}

/* ===========================================================================
   THE GLASS ENTRANCE DOOR. "Through the glass the street stands WHITE in the
   noon heat" — so the glass is paper, the frame is aluminium, and the only ink
   in it is structure. This is the near edge of the plan and the brightest thing
   in the lobby.

   `crash` draws the bar. It is the ONE unbroken horizontal in this file, and it
   is unbroken because a crash bar with a gap in it is not a crash bar; the same
   licence BF-01 takes with the acrylic lid, and paid for the same way — every
   other horizontal around it is broken.
   ======================================================================== */
export function glassDoor(g, x, y, w, h, {
  crash = true, street = 1, seed = 33, leaves = 2, fillGlass = true,
} = {}) {
  g.save();
  // the transom and the reveal. PASS 2: this was a solid bar the full width of
  // the glazing, which on BF-20's 900px front was the heaviest stripe in the
  // frame. Broken, like everything else horizontal in this file.
  brokenBand(g, x - 26, x + w + 26, y - 46, 46, seed + 11, 1, { segs: 3, gap: 0.04, lw: 4 });
  /* the leaves. Glass = paper.
     PASS 2: stile was w*0.030, which on a 900px shopfront is a 27px black bar
     round every leaf — the glazing printed as a black grid with the room lost
     inside it. A shopfront stile is slender; 0.012 with a 8px floor. */
  const stile = Math.max(8, w * 0.012);
  for (let s = 0; s < leaves; s++) {
    const lw2 = w / leaves;
    const lx = x + s * lw2;
    // `fillGlass:false` for a caller that has drawn something BEHIND the glass
    // and does not want it painted over — BF-20's bus was erased this way.
    if (fillGlass) { g.fillStyle = "#ffffff"; g.fillRect(lx, y, lw2, h); }
    g.strokeStyle = INK; g.lineWidth = stile;
    g.strokeRect(lx + stile / 2, y + stile / 2, lw2 - stile, h - stile);
  }
  // the street beyond, standing white: a kerb line and a far parapet, thin,
  // so there is somewhere out there without there being a picture out there.
  if (street > 0) {
    g.save();
    g.beginPath(); g.rect(x + stile, y + stile, w - stile * 2, h - stile * 2); g.clip();
    brokenLine(g, x, x + w, y + h * 0.62, seed + 3, { lw: 3.4, segs: 3, gap: 0.06, color: LV(2) });
    brokenLine(g, x, x + w, y + h * 0.30, seed + 8, { lw: 2.6, segs: 2, gap: 0.09, color: LV(1) });
    g.restore();
  }
  if (crash) {
    /* UNBROKEN, on purpose — see the header. But it spans the DOOR LEAVES only,
       not the whole shopfront: PASS 2 ran it edge to edge across a 900px front,
       which is not a crash bar, it is a rail across a window. */
    const a = x + w * (leaves > 2 ? 0.36 : 0.06), b = x + w * (leaves > 2 ? 0.64 : 0.94);
    g.strokeStyle = INK; g.lineWidth = 11; g.lineCap = "round";
    g.beginPath(); g.moveTo(a, y + h * 0.56); g.lineTo(b, y + h * 0.56); g.stroke();
    g.lineWidth = 6;
    g.beginPath();
    for (const px of [a + (b - a) * 0.12, b - (b - a) * 0.12]) {
      g.moveTo(px, y + h * 0.56); g.lineTo(px, y + h * 0.50);
    }
    g.stroke();
  }
  g.restore();
  return { barY: y + h * 0.56, glass: { x: x + stile, y: y + stile, w: w - stile * 2, h: h - stile * 2 } };
}

/* ===========================================================================
   A BUS CROSSING THE STREET OUTSIDE. Drawn as a SLAB, not a vehicle: a long
   light body with a band of windows and wheels under it, because at this
   distance through wired glass in noon heat that is all a bus is. It is the
   carrier surface in BF-20 and its own detail must not compete with what it
   is carrying.
   ======================================================================== */
export function busSlab(g, x, y, w, h, { seed = 55, windows = 7 } = {}) {
  g.save();
  g.fillStyle = LV(2); g.fillRect(x, y, w, h);
  g.strokeStyle = INK; g.lineWidth = 5; g.strokeRect(x, y, w, h);
  // the window band. These are the reflecting surfaces.
  const wy = y + h * 0.16, wh = h * 0.40;
  for (let i = 0; i < windows; i++) {
    const ww = (w * 0.94) / windows;
    const wx = x + w * 0.03 + i * ww;
    g.fillStyle = LV(1); g.fillRect(wx + 3, wy, ww - 6, wh);
    g.strokeStyle = INK; g.lineWidth = 3; g.strokeRect(wx + 3, wy, ww - 6, wh);
  }
  brokenLine(g, x, x + w, y + h * 0.72, seed, { lw: 3, segs: 3 });
  g.fillStyle = LV(6);
  for (const k of [0.18, 0.78]) {
    g.beginPath(); g.arc(x + w * k, y + h, h * 0.17, 0, TAU); g.fill();
  }
  g.restore();
  return { windowY: wy, windowH: wh };
}

/* ===========================================================================
   THE STRIP OF RED SATIN. BF-16's single accent, and the only thing that
   touches Mara in the whole descent.

   RED CANNOT BE RED. The post pass quantizes by luminance (BUILD-BRIEF §5), so
   a red ribbon is a mid-grey ribbon and nothing about the colour survives. What
   survives is that satin is the only SPECULAR surface in a mill made of brick,
   steel and stone: it is drawn as a dark band with one hard white highlight
   running along its fold, and it is the one place in the descent where a bright
   edge sits directly against a dark one. "Like a tongue" is the motion, so the
   band curls as it goes.
   ======================================================================== */
export function satinStrip(g, x, y, len, { u = 0, w = 15, dir = 1 } = {}) {
  g.save();
  g.translate(x, y);
  const curl = Math.sin(u * Math.PI) * 0.55;
  g.beginPath();
  g.moveTo(0, 0);
  g.bezierCurveTo(len * 0.30 * dir, -w * 1.6 * curl, len * 0.62 * dir, w * 1.9 * curl, len * dir, w * 0.5 * curl);
  g.lineTo(len * dir, w * 0.5 * curl + w);
  g.bezierCurveTo(len * 0.62 * dir, w * 1.9 * curl + w, len * 0.30 * dir, -w * 1.6 * curl + w, 0, w);
  g.closePath();
  g.fillStyle = LV(5); g.fill();
  g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
  // the specular fold: the one bright edge against a dark plane in this room
  g.strokeStyle = "#ffffff"; g.lineWidth = 4.2; g.lineCap = "round";
  g.beginPath();
  g.moveTo(len * 0.10 * dir, w * 0.34);
  g.bezierCurveTo(len * 0.36 * dir, -w * 1.2 * curl + w * 0.34,
                  len * 0.64 * dir, w * 1.5 * curl + w * 0.34,
                  len * 0.90 * dir, w * 0.46 * curl + w * 0.34);
  g.stroke();
  g.restore();
}

/* ===========================================================================
   THE ORANGE CUP. BF-25. Niko's own module draws it in his hand and draws the
   shards after the break; this is the cup ON ITS OWN, for the frames where it
   is in the air between those two states and belongs to no one.
   ORANGE IS A VALUE. Level 4 against a level-1 floor: the one mid-tone object
   in a frame that is otherwise white door and pale stone.
   ======================================================================== */
export function orangeCup(g, cx, cy, r, { spin = 0 } = {}) {
  g.save();
  g.translate(cx, cy); g.rotate(spin);
  g.fillStyle = LV(4); g.strokeStyle = INK; g.lineWidth = 4; g.lineJoin = "round";
  g.beginPath();
  g.moveTo(-r * 0.72, -r); g.lineTo(r * 0.72, -r);
  g.lineTo(r * 0.52, r); g.lineTo(-r * 0.52, r);
  g.closePath(); g.fill(); g.stroke();
  g.fillStyle = LV(1);
  g.beginPath(); g.ellipse(0, -r, r * 0.72, r * 0.24, 0, 0, TAU); g.fill();
  g.strokeStyle = INK; g.lineWidth = 3.4;
  g.beginPath(); g.ellipse(0, -r, r * 0.72, r * 0.24, 0, 0, TAU); g.stroke();
  // the sleeve band, broken
  brokenLine(g, -r * 0.66, r * 0.66, -r * 0.12, 3, { lw: 3, segs: 2, color: LV(6) });
  g.restore();
}

/* ---- the asset ---------------------------------------------------------- */
export const asset = {
  id: "set.mill",
  type: "SET_PIECE",
  name: "The Mill",
  statusWord: "CONVERTED",
  scene: "BF-16",
  params: {
    brickLevel: 1, wellLevel: 2, glass: "paper", floor: "stone",
    columns: 5, note: "light is an absence of ink; the interior carries the tone",
  },
  layers: ["brick", "windows", "well", "columns", "stairs", "floor", "door", "street"],
  anchors: {
    stairhead: { x: .50, y: .16 }, stairFoot: { x: .30, y: .62 },
    lobbyFloor: { x: .50, y: .78 }, entrance: { x: .50, y: .88 },
  },
  states: {
    initial: "stairwell",
    nodes: {
      stairwell: { preview: { view: "stairwell" } },
      lobby: { preview: { view: "lobby" } },
    },
    edges: [["stairwell", "lobby"], ["lobby", "stairwell"]],
  },
  channels: ["view", "u"],
  preview: () => ({ view: "stairwell", u: 0.3, status: "CONVERTED", progress: 0.4 }),

  draw(ctx, W, H, state) {
    const st = state || {}, u = st.u || 0;
    const sx = W / 1120, sy = H / 760;
    ctx.save(); ctx.scale(sx, sy);
    if (st.view === "lobby") {
      ctx.fillStyle = LV(1); ctx.fillRect(0, 0, 1120, 420);
      brickWall(ctx, 0, 0, 1120, 400, { seed: 4, course: 30 });
      stoneFloor(ctx, 400, 760, 0, 1120, { seed: 21 });
      glassDoor(ctx, 300, 120, 520, 380, { crash: true });
    } else {
      brickWall(ctx, 0, 0, 620, 760, { seed: 3, course: 26 });
      ctx.fillStyle = LV(2); ctx.fillRect(620, 0, 500, 760);
      millWindow(ctx, 120, 130, 190, 230);
      lightColumn(ctx, { x: 310, y: 300 }, { x: 760, y: 700 }, { u, wTop: 46, wBot: 150 });
      stairFlight(ctx, { x: 640, y: 250 }, { x: 700, y: 690 }, { steps: 7 });
    }
    ctx.restore();
    return { anchors: asset.anchors };
  },
};
export default asset;
export const MILL_VERSION = "set-mill/1.0.0";
