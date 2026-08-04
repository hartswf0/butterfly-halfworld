/* assets/set/_facility.mjs — THE REARING FACILITY. The furniture of Act III.
   ============================================================================
   NOT an asset (exports no `asset`); the leading underscore follows the file it
   sits beside, assets/set/_kit.mjs, and keeps it out of glob-driven runs.

   SCENE-BRIEF S7: "There are no set assets yet. Your act owns its rooms." Eleven
   of the last twelve units play in this room, so the room is authored once here
   and every scene calls into it. If BF-29 and BF-40 disagreed about where the
   pool is the world would be lying about the last ten minutes of itself.

   THE ROOM, from the annex door looking the length of the loading room
   (scenes/_plans/the-facility.mjs' camera):

       y 96..132   the fluorescent tubes, overhead, BROKEN spans
       y 150..430  the far wall — the chrysalides. Drawn in _chrysalis-wall.mjs.
       y 430..760  the concrete floor, the pool, the cart, the near ground
       left/right  clear plastic sheeting in narrow chambers

   THE TRAPS THIS FILE IS BUILT AROUND, both inherited (BUILD-BRIEF S5):

   1. FULL-WIDTH HORIZONTALS STRIPE THE FRAME. This room is nothing but them —
      a ceiling grid, a floor line, a wall base, a pool lip, four tube banks,
      a row of sheeting hems. Every single one goes through brokenLine() or
      brokenBand() from _kit.mjs. There is exactly one unbroken horizontal in
      Act III and it is the near lip of the pool in BF-40, which is paid for in
      that file the way BF-01 pays for its lid.

   2. EVERYTHING PRINTS 2-3 INK LEVELS TOO DARK. So the room is built out of
      L(0)..L(2) planes with L(5)+ reserved for the things that must be found:
      the port of the projector lens, the split in a husk, a scale. Paper is the
      budget. If a frame here is more than half ink it is wrong.

   LAVENDER. It grows in galvanized troughs around the pool and it is A SMELL.
   BUILD-BRIEF S1 forbids drawing it purple; this file draws it in ink levels
   only, as narrow upright spikes, and there is no colour anywhere in it.
   ========================================================================= */
import { INK, PAPER, gray, inkLevel, rnd } from "../../engine/halfworld-engine.mjs";
import { brokenLine, brokenRun, speckle, numerals } from "./_kit.mjs";

const TAU = Math.PI * 2;
export const L = (l) => inkLevel(l);

/* ---------------------------------------------------------------- helpers -- */
function plane(g, x, y, w, h, level, lw = 3.4) {
  g.fillStyle = L(level); g.fillRect(x, y, w, h);
  if (lw) { g.strokeStyle = INK; g.lineWidth = lw; g.strokeRect(x, y, w, h); }
}

/* ============================================================== THE SHELL ==
   The concrete floor and the base of the far wall. `horizon` is where the wall
   meets the floor. Nothing here is a full-width rule. */
export function loadingRoomFloor(g, { x0 = 0, x1 = 1120, horizon = 430, bottom = 760, seed = 11 } = {}) {
  /* the floor: bare paper. It is the largest area in every frame of this act,
     so it is L(0) and not L(1) — BUILD-BRIEF trap 1, and half the frame has to
     stay cream. */
  g.fillStyle = L(0); g.fillRect(x0, horizon, x1 - x0, bottom - horizon);
  /* THE WALL BASE. PASS 2: this was a filled L(2) kick strip plus a 6px rule
     and it came back as a single black bar straight across the establishing
     frame — the exact failure BUILD-BRIEF S5 names, at the worst possible
     place. It is now a 4px rule in THREE segments with 6% gaps, and no fill at
     all. The wall meets the floor; it does not underline it. */
  brokenLine(g, x0 + 8, x1 - 8, horizon, seed + 3, { lw: 4, segs: 4, gap: 0.055, jitter: 0.6 });
  // expansion joints in the slab, running toward the camera. Verticals, so they
  // cannot stripe; they are what tells you the floor is concrete and not paper.
  g.strokeStyle = L(2); g.lineWidth = 2.6;
  for (const fx of [0.28, 0.72]) {
    const x = x0 + (x1 - x0) * fx;
    g.beginPath();
    g.moveTo(x, horizon + 10);
    g.lineTo(x + (fx - 0.5) * 240, bottom);
    g.stroke();
  }
  speckle(g, x0, horizon + 20, x1, bottom, seed + 91, 44, 2.4, 3);
}

/* ================================================== THE PLASTIC SHEETING ===
   "Clear plastic sheeting divides the loading room into narrow chambers."

   A surface the way the acrylic lid is: it offers no resistance until contact.
   So it is drawn the way BF-01 draws the lid — edges and catches, not a plane.
   A filled plane here would put a grey slab over half the room and would also
   be a lie about the material.

   `chambers` is a list of [x0, x1] pairs. The hem is broken per sheet; the
   sheets do not share a hem line, because they are separate hangings. */
export function sheeting(g, chambers, { top = 150, bottom = 585, seed = 31, sway = 0, rail = false } = {}) {
  const r = rnd(seed);
  chambers.forEach(([a, b], i) => {
    const sag = 8 + r() * 14 + Math.sin(sway * TAU + i * 1.6) * 3.5;
    /* the two hanging edges. PASS 3: at 4.2px with a rail across the top these
       read as structural PILLARS and two of them stood in the middle of the
       establishing frame like a doorway. An edge of clear sheet is a catch of
       light, not a post. 2.8px, and `rail` is off by default. */
    g.strokeStyle = INK; g.lineWidth = 2.8; g.lineCap = "round";
    for (const x of [a, b]) {
      g.beginPath();
      g.moveTo(x, top);
      g.quadraticCurveTo(x + (x === a ? 6 : -6), (top + bottom) / 2, x, bottom - sag);
      g.stroke();
    }
    // the hem, weighted, hanging clear of the floor. Broken, per sheet.
    brokenLine(g, a, b, bottom - sag, seed + i * 7, { lw: 3.4, segs: 2, gap: 0.08 });
    // three creases where the sheet folds. Never more: the material is clear and
    // a fourth crease turns it into corrugation.
    g.strokeStyle = L(2); g.lineWidth = 2.6;
    for (let k = 1; k <= 3; k++) {
      const x = a + (b - a) * (k / 4) + (r() - 0.5) * 10;
      g.beginPath();
      g.moveTo(x, top + 12);
      g.quadraticCurveTo(x + (r() - 0.5) * 22, (top + bottom) / 2, x + (r() - 0.5) * 14, bottom - sag - 6);
      g.stroke();
    }
    // the rail it hangs from: a short bar over this chamber only, and only if
    // the scene says the top of the hanging is in shot at all
    if (rail) {
      g.strokeStyle = INK; g.lineWidth = 5;
      g.beginPath(); g.moveTo(a - 8, top); g.lineTo(b + 8, top); g.stroke();
    }
  });
}

/* ================================================== THE FLUORESCENT TUBES ==
   BF-38: "Every fluorescent tube goes out. Darkness arrives complete." The plan
   is explicit that these are NOT an ordered run — all at once is the opposite of
   a sweep — so `on` is one boolean for the whole bank and there is no per-tube
   phase anywhere in this file. */
export function tubeBank(g, banks, { y = 112, on = true } = {}) {
  banks.forEach(([a, b], i) => {
    // the fitting: a shallow channel, dark, hung on two drops
    g.strokeStyle = INK; g.lineWidth = 3;
    for (const x of [a + (b - a) * 0.2, a + (b - a) * 0.8]) {
      g.beginPath(); g.moveTo(x, y - 30); g.lineTo(x, y - 6); g.stroke();
    }
    plane(g, a, y - 8, b - a, 12, 2, 3.2);
    // the tube itself. Lit: paper, the brightest thing above the wall. Dead: an
    // ink level 3 cylinder, and the room loses its ceiling.
    g.fillStyle = on ? PAPER : L(3);
    g.fillRect(a + 6, y + 4, (b - a) - 12, 11);
    g.strokeStyle = INK; g.lineWidth = on ? 2.4 : 3.4;
    g.strokeRect(a + 6, y + 4, (b - a) - 12, 11);
    if (on) {                       // the two pins at the ends, and nothing else
      g.fillStyle = INK;
      g.fillRect(a + 3, y + 6, 5, 7); g.fillRect(b - 8, y + 6, 5, 7);
    }
  });
}

/* ================================================ TUBES ALONG THE FLOOR =====
   "Tubes run along the floor." Air lines to the chambers. They are drawn as
   pairs of lines with a gap, curving toward the camera, so they never lie flat
   across the frame as a bar. */
export function floorTubes(g, runs, { seed = 55 } = {}) {
  const r = rnd(seed);
  for (const [x0, y0, x1, y1] of runs) {
    const mx = (x0 + x1) / 2 + (r() - 0.5) * 120, my = Math.max(y0, y1) + 26 + r() * 30;
    g.lineCap = "round";
    g.strokeStyle = INK; g.lineWidth = 13;
    g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(mx, my, x1, y1); g.stroke();
    g.strokeStyle = L(1); g.lineWidth = 7;
    g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(mx, my, x1, y1); g.stroke();
  }
}

/* ================================================ FANS BEHIND FILTERS ======
   "Fans turn behind filters." So the fan is ALWAYS partly hidden: a filter
   frame in front, and the blades read through it. `phase` 0..1 turns them —
   this is the only continuously rotating object in the act and it is deliberate
   that it is a machine (MOTION-BRIEF: closed cycles are for apparatus).      */
export function fanBehindFilter(g, cx, cy, R, phase = 0) {
  // the housing
  g.fillStyle = L(1); g.strokeStyle = INK; g.lineWidth = 4;
  g.beginPath(); g.rect(cx - R * 1.12, cy - R * 1.12, R * 2.24, R * 2.24); g.fill(); g.stroke();
  // the blades — four, behind
  g.save();
  g.translate(cx, cy); g.rotate(phase * TAU);
  g.fillStyle = L(3); g.strokeStyle = INK; g.lineWidth = 3;
  for (let i = 0; i < 4; i++) {
    g.rotate(TAU / 4);
    g.beginPath();
    g.moveTo(0, 0);
    g.quadraticCurveTo(R * 0.72, -R * 0.30, R * 0.90, R * 0.16);
    g.quadraticCurveTo(R * 0.50, R * 0.26, 0, 0);
    g.fill(); g.stroke();
  }
  g.fillStyle = L(5);
  g.beginPath(); g.arc(0, 0, R * 0.20, 0, TAU); g.fill();
  g.restore();
  // the filter in front: a pleated card, light, drawn OVER the blades. Its
  // pleats are verticals, so the fan is legible through them.
  g.strokeStyle = L(4); g.lineWidth = 3;
  for (let i = -4; i <= 4; i++) {
    const x = cx + i * R * 0.26;
    g.beginPath(); g.moveTo(x, cy - R * 1.02); g.lineTo(x, cy + R * 1.02); g.stroke();
  }
  g.strokeStyle = INK; g.lineWidth = 4.6;
  g.strokeRect(cx - R * 1.12, cy - R * 1.12, R * 2.24, R * 2.24);
}

/* ================================================ MESH CAGES / TABLES ======
   Rearing furniture. A folding table is drawn as a top and two legs with the
   span BROKEN; a stack of mesh cages is drawn as frames, never as filled boxes,
   because filled boxes at this size print as one black brick. */
export function foldingTable(g, x, y, w, h, seed = 71) {
  g.fillStyle = L(1); g.fillRect(x, y, w, 9);
  brokenLine(g, x, x + w, y, seed, { lw: 4, segs: 2, gap: 0.06 });
  brokenLine(g, x, x + w, y + 9, seed + 1, { lw: 3, segs: 3, gap: 0.05 });
  g.strokeStyle = INK; g.lineWidth = 3.6;
  for (const fx of [0.12, 0.88]) {
    const lx = x + w * fx;
    g.beginPath(); g.moveTo(lx, y + 9); g.lineTo(lx + (fx - 0.5) * 22, y + h); g.stroke();
  }
}

export function meshCages(g, x, y, w, h, n = 3) {
  const ch = h / n;
  for (let i = 0; i < n; i++) {
    const yy = y + i * ch, ww = w * (1 - i * 0.04);
    g.fillStyle = L(1); g.fillRect(x, yy, ww, ch - 5);
    g.strokeStyle = INK; g.lineWidth = 3.6; g.strokeRect(x, yy, ww, ch - 5);
    g.strokeStyle = L(3); g.lineWidth = 2;         // the mesh: verticals only
    for (let k = 1; k < 7; k++) {
      const mx = x + ww * (k / 7);
      g.beginPath(); g.moveTo(mx, yy + 4); g.lineTo(mx, yy + ch - 9); g.stroke();
    }
  }
}

/* ==================================================== THE ANNEX DOOR =======
   the-facility.annex_door == the-lot.annex_door: the plywood face of a low brick
   structure from outside, the inside of the same doorway from in here. It is at
   z .928, i.e. behind the camera in most of these units; it is drawn only when a
   scene looks back toward it. A lit rectangle in a dark wall. */
export function annexDoor(g, x, y, w, h) {
  plane(g, x, y, w, h, 0, 5.5);
  g.fillStyle = L(2);                              // the jamb, one side only
  g.fillRect(x - 14, y, 14, h);
  g.strokeStyle = INK; g.lineWidth = 4;
  g.beginPath(); g.moveTo(x - 14, y); g.lineTo(x - 14, y + h); g.stroke();
}

/* ==================================== THE GALVANIZED TROUGHS AND LAVENDER ==
   "Lavender grows in galvanized troughs around its edge."

   LAVENDER IS A SMELL. It is drawn here as upright narrow spikes in ink levels
   and there is no colour in this function. What makes it lavender rather than
   grass is the SHAPE: a bare stem for two thirds of its length and a short
   dense head at the top, and the heads all at about one height. `sway` is a
   whole-trough phase, not a per-stem one — a trough of lavender moves as one
   thing or it looks like a crowd.                                            */
export function trough(g, x, y, w, h, { seed = 91, sway = 0, stems = 22, tall = 62 } = {}) {
  // the galvanized box: corrugated, so its verticals do the work
  g.fillStyle = L(1); g.fillRect(x, y, w, h);
  g.strokeStyle = INK; g.lineWidth = 4; g.strokeRect(x, y, w, h);
  g.strokeStyle = L(3); g.lineWidth = 2.4;
  for (let i = 1; i < 9; i++) {
    const cx = x + w * (i / 9);
    g.beginPath(); g.moveTo(cx, y + 4); g.lineTo(cx, y + h - 4); g.stroke();
  }
  // the rolled lip
  brokenLine(g, x - 4, x + w + 4, y, seed, { lw: 5, segs: 2, gap: 0.06 });

  const r = rnd(seed + 5);
  for (let i = 0; i < stems; i++) {
    const sx = x + 6 + (w - 12) * ((i + 0.5) / stems) + (r() - 0.5) * 6;
    const hgt = tall * (0.78 + r() * 0.44);
    const lean = Math.sin(sway * TAU + i * 0.7) * hgt * 0.055;
    const ty = y - hgt;
    g.strokeStyle = L(4); g.lineWidth = 2.4;       // the bare stem
    g.beginPath();
    g.moveTo(sx, y + 2);
    g.quadraticCurveTo(sx + lean * 0.5, y - hgt * 0.55, sx + lean, ty + hgt * 0.30);
    g.stroke();
    // the head: a short dense spike, four ticks. Never a blob.
    g.strokeStyle = INK; g.lineWidth = 2.8;
    for (let k = 0; k < 4; k++) {
      const ky = ty + hgt * 0.30 - k * hgt * 0.085;
      g.beginPath();
      g.moveTo(sx + lean - 3.4, ky); g.lineTo(sx + lean + 3.4, ky - 2);
      g.stroke();
    }
  }
}

/* ======================================================== THE TILED POOL ===
   "A shallow tiled pool at the centre." Shallow: you can see its floor, so the
   tile grid is drawn INSIDE the water and the water is only a change of value
   plus a few marks. `ripple` is a phase; the water in this room never has waves,
   it has a surface that is not quite still.

   Drawn as a trapezoid — near edge wider than far edge — so it sits on the same
   floor as project()'s depth model rather than floating as a rectangle.       */
export function tiledPool(g, { cx = 560, farY = 470, nearY = 640, farW = 380, nearW = 560,
                               ripple = 0, level = 1, seed = 101 } = {}) {
  const fl = cx - farW / 2, fr = cx + farW / 2, nl = cx - nearW / 2, nr = cx + nearW / 2;
  g.beginPath();
  g.moveTo(fl, farY); g.lineTo(fr, farY); g.lineTo(nr, nearY); g.lineTo(nl, nearY);
  g.closePath();
  g.fillStyle = L(level); g.fill();
  g.save(); g.clip();
  /* PASS 2: at L(1) the water was indistinguishable from the floor and the pool
     came back as four faint edges around nothing. Shallow water over pale tile
     is still DARKER than a concrete floor in the same light, and this world can
     only say "wet" with a value. */
  // the tile grid, on the floor of the pool, in perspective. Both families are
  // drawn as short spans between the pool's own edges, so nothing here can
  // stripe the frame: the pool is not full width.
  g.strokeStyle = L(level + 3); g.lineWidth = 2.6;
  for (let i = 1; i < 9; i++) {                     // toward the camera
    const t = i / 9;
    g.beginPath();
    g.moveTo(fl + (fr - fl) * t, farY);
    g.lineTo(nl + (nr - nl) * t, nearY);
    g.stroke();
  }
  for (let j = 1; j < 5; j++) {                     // across
    const t = Math.pow(j / 5, 1.35);
    const y = farY + (nearY - farY) * t;
    const l = fl + (nl - fl) * t, rr = fr + (nr - fr) * t;
    g.beginPath(); g.moveTo(l, y); g.lineTo(rr, y); g.stroke();
  }
  // the surface: four short catches of light, moving. This is the entire
  // animation of the water and it should be deniable.
  g.strokeStyle = PAPER; g.lineWidth = 4;
  for (let k = 0; k < 4; k++) {
    const p = (ripple + k * 0.25) % 1;
    const y = farY + (nearY - farY) * (0.18 + 0.64 * p);
    const halfW = (farW + (nearW - farW) * p) * 0.5;
    const w = halfW * (0.24 + 0.12 * Math.sin(p * TAU + k));
    const x = cx + Math.sin(p * TAU * 1.3 + k * 2.1) * halfW * 0.35;
    g.beginPath(); g.moveTo(x - w, y); g.lineTo(x + w, y - 3); g.stroke();
  }
  g.restore();
  // the tiled lip. The far edge is broken; the near edge is left to the scene,
  // because BF-40 needs it whole.
  brokenLine(g, fl, fr, farY, seed, { lw: 4.5, segs: 2, gap: 0.07 });
  g.strokeStyle = INK; g.lineWidth = 5;
  g.beginPath(); g.moveTo(fl, farY); g.lineTo(nl, nearY); g.moveTo(fr, farY); g.lineTo(nr, nearY); g.stroke();
  // the near lip, whole. It is the edge a reel strikes in BF-36 and a child
  // stands on in BF-40, and it is short enough that it cannot stripe anything.
  g.lineWidth = 6.5;
  g.beginPath(); g.moveTo(nl, nearY); g.lineTo(nr, nearY); g.stroke();
  return { fl, fr, nl, nr, farY, nearY };
}

/* ======================================= THE PROJECTOR, ON A WHEELED CART ==
   "A projector stands on a wheeled cart. Its power light is on."
   "Its fan rises to speed."  "No one has threaded the film."

   THE REELS ARE EMPTY AND THE GATE IS EMPTY, and that has to be visible: the
   two spindles carry nothing, and the path between them is drawn as the bare
   rollers with no strip on them. `spin` turns the take-up reel anyway, which is
   the unit's whole content — an apparatus running with nothing in it.
   `on` lights the lamp house; `power` lights the one small hard dot that is the
   power light and that is on in BF-30 before anything else happens.           */
export function projectorCart(g, x, y, s = 1, { on = true, power = true, spin = 0, threaded = false } = {}) {
  const S = (v) => v * s;
  g.save(); g.translate(x, y);

  // the cart: a top, a shelf, and four wheels. The top is BROKEN — it is the
  // widest horizontal on the near side of this room.
  g.fillStyle = L(1); g.fillRect(S(-116), S(0), S(232), S(13));
  brokenLine(g, S(-120), S(120), S(0), 121, { lw: 4.5, segs: 2, gap: 0.09 });
  brokenLine(g, S(-118), S(118), S(13), 122, { lw: 3, segs: 3, gap: 0.06 });
  g.strokeStyle = INK; g.lineWidth = 3.6;
  for (const fx of [-0.82, 0.82]) {
    g.beginPath(); g.moveTo(S(116 * fx), S(13)); g.lineTo(S(116 * fx * 1.06), S(96)); g.stroke();
  }
  brokenLine(g, S(-100), S(100), S(62), 123, { lw: 3, segs: 2, gap: 0.10 });
  g.fillStyle = L(3);
  for (const fx of [-0.86, 0.86]) {
    g.beginPath(); g.arc(S(116 * fx * 1.06), S(104), S(11), 0, TAU); g.fill();
    g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
  }

  // the body: a lamp house and an arm. Light plane, hard edges.
  g.fillStyle = L(1); g.strokeStyle = INK; g.lineWidth = 4;
  g.beginPath(); g.rect(S(-64), S(-56), S(120), S(56)); g.fill(); g.stroke();
  // the lens, pointing LEFT — the screen is on the far left of this room
  g.fillStyle = L(2);
  g.beginPath(); g.rect(S(-92), S(-42), S(30), S(24)); g.fill(); g.stroke();
  g.fillStyle = on ? PAPER : L(6);
  g.beginPath(); g.ellipse(S(-92), S(-30), S(7), S(12), 0, 0, TAU); g.fill();
  g.strokeStyle = INK; g.lineWidth = 3.4; g.stroke();

  // the two spindles. EMPTY unless `threaded`. The take-up turns regardless.
  for (const [sx, sy, dir] of [[-26, -92, 1], [30, -84, -1]]) {
    g.strokeStyle = INK; g.lineWidth = 3.4;
    g.beginPath(); g.moveTo(S(sx), S(-56)); g.lineTo(S(sx), S(sy + 16)); g.stroke();
    g.save(); g.translate(S(sx), S(sy)); g.rotate(spin * TAU * dir);
    g.fillStyle = L(0); g.strokeStyle = INK; g.lineWidth = 3.4;
    g.beginPath(); g.arc(0, 0, S(30), 0, TAU); g.fill(); g.stroke();
    if (threaded) { g.fillStyle = L(4); g.beginPath(); g.arc(0, 0, S(23), 0, TAU); g.fill(); }
    g.lineWidth = 2.8;                              // three spokes, so the turn reads
    for (let i = 0; i < 3; i++) {
      g.rotate(TAU / 3);
      g.beginPath(); g.moveTo(0, S(-7)); g.lineTo(0, S(-28)); g.stroke();
    }
    g.fillStyle = L(5); g.beginPath(); g.arc(0, 0, S(6), 0, TAU); g.fill();
    g.restore();
  }
  // the gate, between them: two rollers and nothing running over them.
  g.fillStyle = L(3); g.strokeStyle = INK; g.lineWidth = 2.6;
  for (const rx of [-40, 6]) {
    g.beginPath(); g.arc(S(rx), S(-64), S(7), 0, TAU); g.fill(); g.stroke();
  }
  // the power light: one small hard dot. It is on before anything else is.
  g.fillStyle = power ? INK : L(2);
  g.beginPath(); g.arc(S(40), S(-14), S(6), 0, TAU); g.fill();
  g.strokeStyle = INK; g.lineWidth = 2.4; g.stroke();
  g.restore();
}

/* ================================== THE WHITE RECTANGLE THAT WAITS =========
   BF-30: "Opposite, a white rectangle waits." It waits for four units before
   anything is on it, so it has to be a THING and not an absence: a hung sheet
   with a weighted lower edge, two grommets, and a top rail that does not reach
   either side of the frame. Returns the inner rect the image plays in.        */
export function screenRect(g, x, y, w, h, { sag = 0 } = {}) {
  g.strokeStyle = INK; g.lineWidth = 5;             // the rail, short
  g.beginPath(); g.moveTo(x - 18, y - 12); g.lineTo(x + w + 18, y - 12); g.stroke();
  g.lineWidth = 3;
  for (const fx of [0.14, 0.86]) {
    g.beginPath(); g.moveTo(x + w * fx, y - 12); g.lineTo(x + w * fx, y); g.stroke();
  }
  g.fillStyle = PAPER;
  g.beginPath();
  g.moveTo(x, y); g.lineTo(x + w, y);
  g.lineTo(x + w, y + h - sag * 0.4);
  g.quadraticCurveTo(x + w / 2, y + h + sag, x, y + h - sag * 0.4);
  g.closePath();
  g.fill();
  g.strokeStyle = INK; g.lineWidth = 5; g.stroke();
  // the weighted hem
  g.lineWidth = 7;
  g.beginPath();
  g.moveTo(x + 10, y + h - sag * 0.4 + 3);
  g.quadraticCurveTo(x + w / 2, y + h + sag + 3, x + w - 10, y + h - sag * 0.4 + 3);
  g.stroke();
  return { x, y, w, h };
}

/* ==================================================== THE BEAM ============
   the-facility fixture `the_beam`: projector_lens -> screen_waiting, crossing
   the room laterally over the pool. Drawn as the two edges of a wedge and the
   volume between them at ONE light level. It is never a gradient — the dot law
   has none — so its softness comes from the dots and not from the fill.       */
export function beamWedge(g, lx, ly, sx, sTop, sBot, { level = 0, edge = true } = {}) {
  g.beginPath();
  g.moveTo(lx, ly - 6); g.lineTo(sx, sTop); g.lineTo(sx, sBot); g.lineTo(lx, ly + 6);
  g.closePath();
  g.fillStyle = L(level); g.fill();
  if (edge) {
    g.strokeStyle = L(3); g.lineWidth = 2.6;
    g.beginPath(); g.moveTo(lx, ly - 6); g.lineTo(sx, sTop);
    g.moveTo(lx, ly + 6); g.lineTo(sx, sBot); g.stroke();
  }
}

/* ============================================== THE YEAR RAIL =============
   The date axis, as GEOMETRY. BUILD-BRIEF trap 3: small type dissolves, so the
   four labels under the chrysalis wall are drawn by _kit.mjs' numerals() at 34px
   cap height and there is no text anywhere in this act.                        */
export function yearRail(g, x0, x1, y, years, first, last) {
  brokenLine(g, x0, x1, y, 141, { lw: 3.4, segs: 3, gap: 0.05 });
  for (const yr of years) {
    const t = (yr - first) / (last - first);
    const x = x0 + (x1 - x0) * t;
    g.strokeStyle = INK; g.lineWidth = 3;
    g.beginPath(); g.moveTo(x, y - 7); g.lineTo(x, y + 7); g.stroke();
    const w = String(yr).length * 34 * 0.82;
    numerals(g, yr, x - w / 2, y + 16, 34, L(6));
  }
}

export const FACILITY_VERSION = "facility-set/1.0.0";
