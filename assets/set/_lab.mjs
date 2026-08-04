/* assets/set/_lab.mjs — THE LABORATORY, AS FURNITURE.  (ACT I owns this room.)
   ============================================================================
   SCENE-BRIEF §7: "There are no set assets yet. Your act owns its rooms, so no
   other agent will touch them — draw what your scenes need, in assets/set/."

   Thirteen units play here. Drawing the bench thirteen times is how a room
   becomes thirteen different rooms, which is the failure `the-laboratory` plan
   exists to prevent — so every piece of furniture is authored ONCE, here,
   anchored to plan stations through a lens (assets/set/_lens.mjs). A scene
   chooses a centre and a zoom; it never chooses where the bench is.

   ---------------------------------------------------------------------------
   THE CAMERA IS LOW AND project() HAS NO ALTITUDE.

   project() returns the FOOT of a station: y = .50 + .46 d^1.08, so every
   station in the room lands between y .535 (the windows, z .11) and y .935 (the
   fire door). The whole plan is in the bottom half of the frame. Everything
   above that line is height, and height is this file's job — the plan says
   where a thing stands, this file says how tall it is, in units of `h` (the
   pixel height of a BODY standing at that station, from _lens.mjs). A bench is
   0.52h. A hood mouth is 1.30h. That way a bench is bench-high next to a person
   at any zoom, with no second calibration and no per-scene fiddling.

   ---------------------------------------------------------------------------
   TRAPS OBEYED, AND ONE PAID FOR.

   · BUILD-BRIEF §5: full-width horizontals stripe the frame. The bench top, the
     window transom, the ceiling tube, the floor joints and the rack shelves all
     go through brokenLine()/brokenRun() from _kit.mjs. Nothing here spans the
     frame unbroken.
   · Everything comes out 2-3 ink levels too dark. Every plane in this room is
     level 1 or 2; level 5+ is reserved for the four things that are actually
     dark (the loom bolts, the fan bank's interior, the monitor bezel, ink).
   · PAID FOR: the observation box's acrylic LID is drawn as one unbroken line,
     for the same reason BF-01 pays for it — it is the surface with no gap in
     it, and that is what the story is about. It is one line, not a band.

   COLD SURFACES ONLY, per BUILD-BRIEF §1: acrylic, stainless, tile, glass,
   waxed paper, rust, fluorescent tube. And lavender is a SMELL: it is drawn as
   a column of small marks with a level, never as a colour.
   ========================================================================= */
import { INK, inkLevel, gray } from "../../engine/halfworld-engine.mjs";
import { brokenLine, brokenRun, brokenBand, speckle, streak, LV } from "./_kit.mjs";
import { TAU } from "../../engine/motion.mjs";

const ink = (g, lw = 3.5) => { g.strokeStyle = INK; g.lineWidth = lw; };
const plane = (g, l) => { g.fillStyle = inkLevel(l); };

/* ---------------------------------------------------------------- the room --
   The floor, the ceiling band, one fluorescent tube. Drawn first, under
   everything. `z0`..`z1` is the depth band the scene actually shows. */
export function room(g, F, o = {}) {
  const W = F.W, H = F.H;
  const far = F.groundY(o.z0 ?? 0.10);
  const near = F.groundY(o.z1 ?? 0.95);

  // the far wall plane above the window feet. Level 0 by default: this is where
  // the paper budget lives, and every scene in the act spends it here.
  if ((o.wallLevel ?? 0) > 0) { plane(g, o.wallLevel); g.fillRect(-W, far - H * 2.2, W * 3, H * 2.2); }
  // the floor: tile, level 1, with joints broken so it is not a barcode
  plane(g, o.floorLevel ?? 1);
  g.fillRect(-W, far, W * 3, (near - far) + H * 1.4);
  // the wall/floor junction. BROKEN — it is the longest horizontal in the room
  // and drawn honestly it is a barcode across the middle of every frame.
  brokenLine(g, -W * 0.15, W * 1.15, far, 271, { lw: 4.4, segs: 3, gap: 0.055 });

  if (o.joints !== false) {
    for (let i = 1; i <= 4; i++) {
      const z = (o.z0 ?? 0.10) + ((o.z1 ?? 0.95) - (o.z0 ?? 0.10)) * (i / 5);
      brokenLine(g, -W * 0.2, W * 1.2, F.groundY(z), 300 + i * 13,
                 { lw: 3, segs: 3, gap: 0.05 });
    }
  }
  if (o.ceiling !== false) fluorescent(g, F, o);
}

/* one tube, high, broken. Never a grid: a ceiling grid stripes the frame and
   there is no scene in this act that is about the ceiling. */
export function fluorescent(g, F, o = {}) {
  const p = F("bench_lamp");
  const y = p.y - p.h * (o.tubeH ?? 2.35);
  const x0 = F("bench_west_end").x - p.h * 0.5, x1 = F("bench_east_end").x + p.h * 0.5;
  const th = Math.max(4, p.h * 0.035);
  for (const [a, b] of brokenRun(x0, x1, 41, { segs: 2, gap: 0.11 })) {
    plane(g, 0); g.fillRect(a, y, b - a, th);
    ink(g, 3.4); g.strokeRect(a, y, b - a, th);
    // the two end caps, which is what makes it a tube and not a slot
    plane(g, 4);
    g.fillRect(a, y, th * 0.7, th); g.fillRect(b - th * 0.7, y, th * 0.7, th);
  }
}

/* -------------------------------------------------------- the tall windows --
   "The windows are too tall for modern use." The plan's header is explicit that
   their height is the SCENE's job and that the city is preserved WITHIN the
   glass rather than seen through it. So: three bays, piers between them, no
   sill, no head — the glazing leaves the top of every frame in this act — and
   the water towers / roofs / stadium rind are drawn AT the glass plane, small,
   at level 2, INSIDE the mullion grid. Nothing in this room is outdoors. */
export function tallWindows(g, F, o = {}) {
  const bays = ["window_bay_west", "window_bay_centre", "window_bay_east"];
  const pts = bays.map(b => F(b));
  const h = pts[1].h;
  const wBay = Math.abs(pts[2].x - pts[0].x) / 2.35;
  const top = pts[1].y - h * (o.tall ?? 3.4);            // above every frame

  for (let i = 0; i < 3; i++) {
    const p = pts[i];
    const x0 = p.x - wBay / 2, x1 = p.x + wBay / 2;
    plane(g, o.glazing ?? 1); g.fillRect(x0, top, x1 - x0, p.y - top);
    ink(g, 4.5); g.strokeRect(x0, top, x1 - x0, p.y - top);
    // mullions: broken verticals and one transom
    ink(g, 3.2);
    const mull = (o.mullions ?? 2) === 1 ? [1 / 2] : [1 / 3, 2 / 3];
    for (const t of mull) {
      g.beginPath(); g.moveTo(x0 + (x1 - x0) * t, top); g.lineTo(x0 + (x1 - x0) * t, p.y); g.stroke();
    }
    brokenLine(g, x0, x1, p.y - h * 1.62, 700 + i, { lw: 3.2, segs: 2, gap: 0.06 });
    // the pier between bays — brick, level 2, so the glazing run is broken
    if (i < 2) {
      const px0 = x1, px1 = pts[i + 1].x - wBay / 2;
      plane(g, 2); g.fillRect(px0, top, px1 - px0, p.y - top);
      ink(g, 4); g.strokeRect(px0, top, px1 - px0, p.y - top);
    }
  }
  if (o.city !== false) cityInTheGlass(g, F, o);
}

/* the city, PRESERVED IN the glass. Held, small, at the glass plane. */
export function cityInTheGlass(g, F, o = {}) {
  const wt = F("glass_water_towers"), ar = F("glass_apartment_roofs"), sr = F("glass_stadium_rind");
  const h = ar.h, base = ar.y - h * (o.cityY ?? 1.55);

  // apartment roofs: a broken skyline of light blocks
  plane(g, 2);
  const runs = brokenRun(ar.x - h * 0.95, ar.x + h * 0.95, 55, { segs: 4, gap: 0.03 });
  runs.forEach(([a, b], i) => {
    const bh = h * (0.16 + 0.10 * ((i * 7) % 3));
    g.fillStyle = inkLevel(2); g.fillRect(a, base - bh, b - a, bh);
    ink(g, 3); g.strokeRect(a, base - bh, b - a, bh);
  });

  // two water towers: a drum on legs. Level 2, hard contour.
  for (const s of [-1, 1]) {
    const cx = wt.x + s * h * 0.30, r = h * 0.10, ty = base - h * 0.46;
    plane(g, 2);
    g.beginPath(); g.moveTo(cx - r, ty); g.lineTo(cx + r, ty);
    g.lineTo(cx + r * 0.82, ty + r * 1.5); g.lineTo(cx - r * 0.82, ty + r * 1.5);
    g.closePath(); g.fill(); ink(g, 3.2); g.stroke();
    g.beginPath();
    g.moveTo(cx - r * 0.7, ty + r * 1.5); g.lineTo(cx - r * 0.5, base);
    g.moveTo(cx + r * 0.7, ty + r * 1.5); g.lineTo(cx + r * 0.5, base);
    g.stroke();
  }

  // the white rind of a stadium: an arc, the brightest edge up there
  const rr = h * 0.42;
  plane(g, 0);
  g.beginPath(); g.ellipse(sr.x, base + rr * 0.34, rr, rr * 0.30, 0, Math.PI, TAU); g.fill();
  ink(g, 4);
  g.beginPath(); g.ellipse(sr.x, base + rr * 0.34, rr, rr * 0.30, 0, Math.PI, TAU); g.stroke();
}

/* ------------------------------------------------------------- the bench ----
   Stainless. "Break the span in four; a full-width horizontal bar stripes the
   frame." — the plan's own fixture note. */
export function bench(g, F, o = {}) {
  const w = F("bench_west_end"), e = F("bench_east_end");
  const h = w.h;
  const topY = w.y - h * (o.height ?? 0.52);
  const depth = h * 0.105;                       // the front face of the slab
  const x0 = w.x - h * 0.28, x1 = e.x + h * 0.28;

  for (const [a, b] of brokenRun(x0, x1, 19, { segs: 4, gap: 0.018 })) {
    plane(g, 1); g.fillRect(a, topY, b - a, depth);
    ink(g, 4.2); g.strokeRect(a, topY, b - a, depth);
    // the stainless highlight along the lip: one short line per segment
    ink(g, 3);
    g.beginPath();
    g.moveTo(a + (b - a) * 0.12, topY + depth * 0.55);
    g.lineTo(a + (b - a) * 0.52, topY + depth * 0.55); g.stroke();
  }
  // legs — two, inset, so the bench is not a floating bar
  ink(g, 4.5);
  for (const t of [0.16, 0.84]) {
    const lx = x0 + (x1 - x0) * t;
    g.beginPath(); g.moveTo(lx, topY + depth); g.lineTo(lx, w.y); g.stroke();
  }
  return { topY, x0, x1, depth };
}

/* the bench lamp — BF-09/BF-10 are read under it */
export function benchLamp(g, F, o = {}) {
  const p = F("bench_lamp");
  const h = p.h, topY = p.y - h * 0.52;
  const armY = topY - h * 0.62;
  ink(g, 4.5);
  g.beginPath();
  g.moveTo(p.x, topY); g.lineTo(p.x, armY);
  g.lineTo(p.x - h * 0.30, armY - h * 0.06); g.stroke();
  // the shade: a light cone, hard edged
  const sx = p.x - h * 0.30, sy = armY - h * 0.06;
  plane(g, 1);
  g.beginPath();
  g.moveTo(sx - h * 0.13, sy); g.lineTo(sx + h * 0.13, sy);
  g.lineTo(sx + h * 0.07, sy + h * 0.13); g.lineTo(sx - h * 0.07, sy + h * 0.13);
  g.closePath(); g.fill(); ink(g, 4); g.stroke();
  return { x: sx, y: sy + h * 0.13, h };
}

/* --------------------------------------------------- the extraction hood ----
   BF-03: "Fans sigh. The lavender thins into the extraction hood." */
export function hood(g, F, o = {}) {
  const m = F("hood_mouth"), d = F("hood_duct"), f = F("fan_bank");
  const h = m.h;
  const mouthY = m.y - h * (o.mouthH ?? 1.30);
  const mw = h * 0.80, mh = h * 0.34;

  // the mouth: a light box with a hard lower lip and four louvres
  plane(g, 1); g.fillRect(m.x - mw / 2, mouthY, mw, mh);
  ink(g, 4.5); g.strokeRect(m.x - mw / 2, mouthY, mw, mh);
  ink(g, 3.2);
  for (let i = 1; i <= 3; i++) {
    const y = mouthY + mh * (i / 4);
    g.beginPath(); g.moveTo(m.x - mw * 0.42, y); g.lineTo(m.x + mw * 0.42, y); g.stroke();
  }
  ink(g, 6.5);
  g.beginPath(); g.moveTo(m.x - mw / 2, mouthY + mh); g.lineTo(m.x + mw / 2, mouthY + mh); g.stroke();

  // the duct, running back and down to the fan bank
  plane(g, 1);
  g.beginPath();
  g.moveTo(m.x + mw * 0.30, mouthY); g.lineTo(m.x + mw * 0.30, mouthY - h * 0.55);
  g.lineTo(d.x + h * 0.22, d.y - h * 1.60); g.lineTo(d.x + h * 0.22, d.y - h * 1.05);
  g.closePath(); g.fill(); ink(g, 4); g.stroke();

  // the fan bank: the one genuinely dark thing on this wall
  const fw = h * 0.42, fy = f.y - h * 1.05;
  plane(g, 5); g.fillRect(f.x - fw / 2, fy, fw, h * 0.52);
  ink(g, 4.5); g.strokeRect(f.x - fw / 2, fy, fw, h * 0.52);
  ink(g, 3.4);
  g.beginPath();
  g.arc(f.x, fy + h * 0.26, fw * 0.32, 0, TAU); g.stroke();
  return { mouth: { x: m.x, y: mouthY + mh, w: mw, h: mh }, h };
}

/* --------------------------------------------------- the observation box ----
   Held at LOW resolution by the plan on purpose: the maze's interior geometry
   is authored once, in the-maze.mjs. This draws the OUTSIDE — the thing that
   sits on the bench, with a lid and two sleeve ports. */
/* THE BOX STANDS ON THE BENCH, not on the floor. The first pass took its
   FLOOR from `observation_box_near`'s ground line, because that is what
   project() returns and project() has no altitude — and drew a box as tall as
   a person, standing through the bench, with sleeve ports the size of a head.
   Pass the bench's `topY` in as `baseY`; the plan says where the box is and
   this file says how high off the ground and how big. */
export function observationBox(g, F, o = {}) {
  const far = F("observation_box_far"), near = F("observation_box_near");
  const h = near.h;
  const baseY = o.baseY ?? near.y;
  /* THE WIDTH COMES FROM THE PLAN, NOT FROM A BODY. The first pass sized the
     box at 0.95 of a body height and put the two sleeve ports at their true
     separation inside it: the ports then sat in the middle fifth of a box more
     than twice as wide as the maze it contains, and the two gloves overlapped
     into one shape. The box is as wide as the thing inside it — the two
     corridors, plus a wall's worth each side — and the plan knows how far
     apart those are. */
  const arms = Math.abs(F("corridor_clean_mid").x - F("corridor_lavender_mid").x);
  const w = arms * (o.widthFactor ?? 1.95);
  const bh = w * (o.aspect ?? 0.62);              // a box on a bench, not a wardrobe
  const lidY = baseY - bh;
  const x0 = near.x - w / 2, x1 = near.x + w / 2;
  const backY = baseY - bh * 0.30;                // the far floor of the box, foreshortened

  // the acrylic walls: verticals with a gap at eye level, as in BF-01
  ink(g, 4.2);
  for (const x of [x0, x1]) {
    g.beginPath();
    g.moveTo(x, lidY); g.lineTo(x, lidY + bh * 0.38);
    g.moveTo(x, lidY + bh * 0.56); g.lineTo(x, baseY);
    g.stroke();
  }
  // the far floor line of the box — broken, like every other long horizontal
  brokenLine(g, x0 + w * 0.06, x1 - w * 0.06, backY, 353, { lw: 3.4, segs: 3, gap: 0.05 });

  // THE LID. Unbroken, on purpose. It is the surface with no gap in it.
  plane(g, 1); g.fillRect(x0, lidY, w, bh * 0.10);
  ink(g, 3.6);
  g.beginPath(); g.moveTo(x0, lidY); g.lineTo(x1, lidY); g.stroke();
  ink(g, 6.5);
  g.beginPath(); g.moveTo(x0, lidY + bh * 0.10); g.lineTo(x1, lidY + bh * 0.10); g.stroke();

  // the near face and the two sleeve ports
  const pl = F("sleeve_port_left"), pr = F("sleeve_port_right");
  const portY = baseY - bh * 0.30, pr0 = bh * 0.125;
  ink(g, 4);
  g.beginPath(); g.moveTo(x0, baseY); g.lineTo(x1, baseY); g.stroke();
  /* PORTS ARE OPTIONAL. BF-05 is shot from inside the box looking at the
     partition; at that magnification the two ports are 180px-wide holes on
     either side of the subject and the frame reads as a pair of portholes with
     something between them. A scene that is not about the hands turns them
     off. */
  if (o.ports !== false) for (const p of [pl, pr]) {
    const px = p.x;                               // the ports are ON the near face
    plane(g, 0);
    g.beginPath(); g.ellipse(px, portY, pr0, pr0 * 1.05, 0, 0, TAU); g.fill();
    ink(g, 5); g.stroke();
    ink(g, 3);                                    // the rubber iris, one ring in
    g.beginPath(); g.ellipse(px, portY, pr0 * 0.66, pr0 * 0.70, 0, 0, TAU); g.stroke();
  }
  return { x0, x1, lidY, baseY, backY, w, h, bh, portY, portR: pr0,
           cx: near.x, port: { l: pl.x, r: pr.x } };
}

/* the two corridors and the white partition, seen from the ROOM (low res).
   X comes from the plan (the arrangement is the plan's), Y comes from the box
   (the plan has no altitude and says so in its own header). */
export function mazeInsideBox(g, F, box, o = {}) {
  const lav = F("corridor_lavender_mid"), cle = F("corridor_clean_mid"),
        par = F("partition_white_mid");
  const sx = (p) => p.x;
  const floorY = box.baseY - box.bh * 0.14;
  const wallH = box.bh * 0.26, wallW = box.bh * 0.055;
  ink(g, 3.6);
  for (const c of [lav, cle]) {
    const x = sx(c);
    for (const s of [-1, 1]) {
      plane(g, 2);
      g.fillRect(x + s * box.bh * 0.20 - wallW / 2, floorY - wallH, wallW, wallH);
      g.strokeRect(x + s * box.bh * 0.20 - wallW / 2, floorY - wallH, wallW, wallH);
    }
  }
  // THE WHITE PARTITION — the brightest thing in the box is the thing that
  // divides it. BF-05 settles on it.
  const px = sx(par), pw = box.bh * 0.15, ph = box.bh * 0.42;
  g.fillStyle = "#ffffff"; g.fillRect(px - pw / 2, floorY - ph, pw, ph);
  ink(g, 5); g.strokeRect(px - pw / 2, floorY - ph, pw, ph);
  ink(g, 3.2);
  g.beginPath();
  g.moveTo(px - pw * 0.34, floorY - ph + box.bh * 0.030);
  g.lineTo(px + pw * 0.34, floorY - ph + box.bh * 0.030); g.stroke();
  return { x: px, y: floorY, w: pw, h: ph, top: floorY - ph,
           lavenderX: sx(lav), cleanX: sx(cle), floorY };
}

/* -------------------------------------------------------- lavender, a smell --
   Never purple. A column of small marks out of the LEFT corridor only, rising
   and thinning. `thin` 0..1 removes marks from the top down: BF-03's hood.
   Seamless by construction: each mark's height is (u + phase) mod 1. */
export function lavender(g, F, u, o = {}) {
  const c = F(o.from || "corridor_lavender_mid");
  const h = o.h ?? c.h, n = o.count ?? 15, thin = o.thin ?? 0;
  const ox = o.x ?? c.x, oy = o.y ?? (c.y - h * 0.30);
  const rise = h * (o.rise ?? 1.10);
  const pull = o.pull ?? 0;                      // sideways drift into the hood
  g.fillStyle = inkLevel(o.level ?? 5);
  for (let i = 0; i < n; i++) {
    const ph = (i * 0.6180339887) % 1;
    const k = (u + ph) % 1;
    if (k > 1 - thin) continue;                  // the top of the column goes first
    const x = ox + ((i * 31) % 100 - 50) / 50 * h * 0.16
            + Math.sin((k + ph) * TAU) * h * 0.035 + pull * k * h;
    const y = oy - k * rise;
    const r = Math.max(2.6, h * 0.021 * (1 - k * 0.62));
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  }
}

/* ------------------------------------------------------------- the monitor --
   A cart at the east end. Returns the SCREEN interior so the scene can draw the
   green line into it and nowhere else. */
export function monitorCart(g, F, o = {}) {
  const cart = F("monitor_cart"), scr = F("monitor_screen"), kb = F("monitor_keyboard");
  const h = cart.h;
  const cartTop = cart.y - h * 0.56;
  const cw = h * 0.62;

  // the cart: two shelves, four castors, nothing spanning
  plane(g, 1);
  g.fillRect(cart.x - cw / 2, cartTop, cw, h * 0.07);
  ink(g, 4); g.strokeRect(cart.x - cw / 2, cartTop, cw, h * 0.07);
  ink(g, 3.6);
  for (const s of [-1, 1]) {
    g.beginPath();
    g.moveTo(cart.x + s * cw * 0.42, cartTop + h * 0.07);
    g.lineTo(cart.x + s * cw * 0.42, cart.y); g.stroke();
  }
  brokenLine(g, cart.x - cw * 0.44, cart.x + cw * 0.44, cart.y - h * 0.18, 61,
             { lw: 3.4, segs: 2, gap: 0.09 });

  // the monitor: a bezel around a LIGHT screen. Level 3, not 5 — the first pass
  // put a solid dark ring round the one bright thing in the frame and the
  // monitor read as a television set from the street.
  const sw = h * (o.screenW ?? 0.70), sh = sw * 0.74;
  const sy = cartTop - sh - h * 0.06, sx = scr.x - sw / 2;
  plane(g, 3); g.fillRect(sx - sw * 0.045, sy - sh * 0.055, sw * 1.09, sh * 1.14);
  ink(g, 4.5); g.strokeRect(sx - sw * 0.045, sy - sh * 0.055, sw * 1.09, sh * 1.14);
  plane(g, o.screenLevel ?? 1); g.fillRect(sx, sy, sw, sh);
  ink(g, 4); g.strokeRect(sx, sy, sw, sh);

  // the keyboard, on the lower shelf
  const kw = h * 0.34;
  plane(g, 2); g.fillRect(kb.x - kw / 2, cart.y - h * 0.20, kw, h * 0.045);
  ink(g, 3.4); g.strokeRect(kb.x - kw / 2, cart.y - h * 0.20, kw, h * 0.045);

  /* THE FIELD IS `h` AND IT USED TO BE TWO THINGS. The first version of this
     return was `{ ..., h: sh, cartTop, h }` — a duplicate key, so the later
     shorthand silently won and every consumer got the BODY height (554px)
     where it asked for the SCREEN height (303px). BF-02 clipped its trace to a
     box 43% too tall and the flight path spilled out of the monitor and down
     over the cart, in a way the contact sheet showed and no error reported. */
  return { x: sx, y: sy, w: sw, h: sh, cartTop, bodyH: h };
}

/* --------------------------------------------- the personal-objects cabinet --
   West wall. BF-09: the photograph comes off this shelf. */
export function cabinet(g, F, o = {}) {
  const f = F("cabinet_face"), sh = F("cabinet_shelf_photos");
  const h = f.h, cw = h * 0.66, ch = h * 1.30;
  const top = f.y - ch;
  plane(g, 1); g.fillRect(f.x - cw / 2, top, cw, ch);
  ink(g, 4.5); g.strokeRect(f.x - cw / 2, top, cw, ch);
  // three shelves, broken
  for (let i = 1; i <= 3; i++) {
    brokenLine(g, f.x - cw * 0.46, f.x + cw * 0.46, top + ch * (i / 4), 83 + i,
               { lw: 3.4, segs: 2, gap: 0.07 });
  }
  if (o.open) {                                  // the door, swung out
    ink(g, 4.5);
    g.beginPath();
    g.moveTo(f.x + cw / 2, top + ch * 0.06);
    g.lineTo(f.x + cw * 1.02, top + ch * 0.16);
    g.lineTo(f.x + cw * 1.02, top + ch * 0.92);
    g.lineTo(f.x + cw / 2, top + ch * 0.96);
    plane(g, 1); g.fill(); g.stroke();
  }
  return { x: f.x, y: f.y, w: cw, h: ch, top, shelfY: top + ch * 0.5 };
}

/* ------------------------------------------------------- the recovery rack --
   BF-14. Three tiers; the vial is set into the middle one by hand and then the
   tapping starts. Returns the vial's box in scene space so BF-14 can put its
   ring there — the plan refuses to hold the ring and says so. */
export function recoveryRack(g, F, o = {}) {
  const top = F("recovery_rack_top"), mid = F("recovery_rack_mid"), v = F("recovery_rack_vial");
  const h = mid.h, rw = h * (o.width ?? 0.58);
  const y0 = mid.y - h * 1.20, y1 = mid.y;

  ink(g, 4.5);                                   // two uprights
  for (const s of [-1, 1]) {
    g.beginPath(); g.moveTo(mid.x + s * rw / 2, y0); g.lineTo(mid.x + s * rw / 2, y1); g.stroke();
  }
  for (let i = 0; i < 3; i++) {                  // three tiers, broken
    const y = y0 + (y1 - y0) * (0.18 + i * 0.32);
    brokenLine(g, mid.x - rw / 2, mid.x + rw / 2, y, 121 + i, { lw: 4.4, segs: 2, gap: 0.10 });
  }
  const vialH = h * (o.vialH ?? 0.40), vialW = vialH * 0.42;
  const cx = v.x, base = y0 + (y1 - y0) * 0.50;
  return { cx, base, w: vialW, h: vialH, rackW: rw, bodyH: h };
}

/* the vial itself: an upright glass cylinder with a stopper. Drawn separately
   from the rack because BF-12 and BF-14 both need it and only BF-14 has a rack. */
export function vial(g, cx, base, w, h, o = {}) {
  const top = base - h;
  const ry = w * (o.ry ?? 0.34);
  plane(g, o.level ?? 1);
  g.beginPath();
  g.moveTo(cx - w, top + ry); g.lineTo(cx - w, base - ry);
  g.ellipse(cx, base - ry, w, ry, 0, Math.PI, TAU, true);
  g.lineTo(cx + w, top + ry);
  g.ellipse(cx, top + ry, w, ry, 0, 0, Math.PI, true);
  g.closePath(); g.fill();
  ink(g, o.lw ?? 4.5);
  g.beginPath();
  g.moveTo(cx - w, top + ry); g.lineTo(cx - w, base - ry);
  g.moveTo(cx + w, top + ry); g.lineTo(cx + w, base - ry);
  g.stroke();
  g.beginPath(); g.ellipse(cx, base - ry, w, ry, 0, 0, TAU); g.stroke();
  g.beginPath(); g.ellipse(cx, top + ry, w, ry, 0, 0, TAU); g.stroke();
  // a stopper: waxed paper over the mouth, one band
  if (o.stopper !== false) {
    plane(g, 2);
    g.fillRect(cx - w * 1.06, top - ry * 0.9, w * 2.12, ry * 1.5);
    ink(g, 3.6); g.strokeRect(cx - w * 1.06, top - ry * 0.9, w * 2.12, ry * 1.5);
  }
  return { cx, top, base, w, ry, midY: (top + base) / 2 };
}

/* ------------------------------------------------------------ the loom bolts --
   "dark circles surrounded by rust... the broken circle with the gap closed and
   the stroke removed. The room is standing on seven of the same shape, and
   nobody has looked at the floor." */
export function loomBolts(g, F, o = {}) {
  const names = o.only || ["loom_bolt_nw", "loom_bolt_ne", "loom_bolt_w", "loom_bolt_e",
                           "loom_bolt_centre", "loom_bolt_sw", "loom_bolt_se"];
  names.forEach((n, i) => {
    const p = F(n);
    const r = p.h * (o.r ?? 0.070);
    // the rust: a ring of speckle, level 3, sparse
    speckle(g, p.x - r * 2.2, p.y - r * 1.1, p.x + r * 2.2, p.y + r * 1.1,
            900 + i * 31, 16, r * 0.18, 3,
            (px, py) => {
              const dx = (px - p.x) / (r * 2.0), dy = (py - p.y) / (r * 1.0);
              const q = dx * dx + dy * dy; return q > 0.42 && q < 1.0;
            });
    plane(g, 6);                                  // the bolt: dark, and a circle
    g.beginPath(); g.ellipse(p.x, p.y, r, r * 0.48, 0, 0, TAU); g.fill();
    ink(g, Math.max(3, r * 0.20));
    g.beginPath(); g.ellipse(p.x, p.y, r, r * 0.48, 0, 0, TAU); g.stroke();
    ink(g, Math.max(3, r * 0.16));                // the ring of rust, as a line
    g.beginPath(); g.ellipse(p.x, p.y, r * 1.72, r * 0.86, 0, 0, TAU); g.stroke();
  });
}

/* ------------------------------------------------------------- the phone -----
   BF-13. Wall set, coiled cord. The cord is the only thing in that unit that
   moves, and it moves because someone is breathing at the other end of it. */
export function wallPhone(g, F, o = {}) {
  const p = F("wall_phone");
  const h = p.h;
  const bw = h * 0.26, bh = h * 0.38;
  const bx = p.x - bw / 2, by = p.y - h * 1.15;
  plane(g, 1); g.fillRect(bx, by, bw, bh);
  ink(g, 4.5); g.strokeRect(bx, by, bw, bh);
  ink(g, 3.2);
  brokenLine(g, bx + bw * 0.12, bx + bw * 0.88, by + bh * 0.62, 47, { lw: 3, segs: 2 });
  return { x: bx + bw / 2, y: by + bh, w: bw, h: bh, bodyH: h, hookY: by + bh * 0.30 };
}

/* the coiled cord. `swing` 0..1 of a full sway; `slack` lengthens it. */
export function phoneCord(g, x0, y0, x1, y1, o = {}) {
  const coils = o.coils ?? 11;
  const amp = o.amp ?? 14;
  const sag = o.sag ?? 46;
  ink(g, o.lw ?? 3.4);
  g.beginPath();
  for (let i = 0; i <= coils * 6; i++) {
    const t = i / (coils * 6);
    const bx = x0 + (x1 - x0) * t;
    const by = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * sag;
    const px = bx + Math.cos(t * coils * TAU + (o.phase ?? 0)) * amp;
    const py = by + Math.sin(t * coils * TAU + (o.phase ?? 0)) * amp * 0.30;
    if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
  }
  g.stroke();
}

/* ---------------------------------------------------------- the loose wire ---
   BF-06. He cannot yet tell whether it is live. */
export function looseWire(g, F, o = {}) {
  const w = F("loose_wire");
  const h = w.h;
  ink(g, o.lw ?? 4);
  g.beginPath();
  g.moveTo(w.x - h * 0.22, w.y - h * 0.52);
  g.bezierCurveTo(w.x - h * 0.05, w.y - h * 0.36, w.x + h * 0.16, w.y - h * 0.44,
                  w.x + h * 0.20, w.y - h * 0.22);
  g.stroke();
  // the stripped end: three filaments, which is what makes it a question
  ink(g, 3);
  for (const a of [-0.36, 0, 0.36]) {
    g.beginPath();
    g.moveTo(w.x + h * 0.20, w.y - h * 0.22);
    g.lineTo(w.x + h * 0.20 + Math.sin(a) * h * 0.11, w.y - h * 0.22 + Math.cos(a) * h * 0.10);
    g.stroke();
  }
  return { x: w.x + h * 0.20, y: w.y - h * 0.22, h };
}

/* the manual switch — BF-03, "Stop means stop." */
export function manualSwitch(g, F, o = {}) {
  const s = F("niko_manual_switch");
  const h = s.h, bw = h * 0.13, bh = h * 0.17;
  const x = s.x - bw / 2, y = s.y - h * 0.62;
  plane(g, 1); g.fillRect(x, y, bw, bh);
  ink(g, 4.5); g.strokeRect(x, y, bw, bh);
  plane(g, 4);                                    // the mushroom head, pressed
  g.beginPath(); g.ellipse(x + bw / 2, y + bh * 0.40, bw * 0.26, bw * 0.18, 0, 0, TAU); g.fill();
  ink(g, 3.4); g.stroke();
  return { x: x + bw / 2, y: y + bh * 0.40, h };
}

export const LAB_VERSION = "lab-set/1.0.0";
