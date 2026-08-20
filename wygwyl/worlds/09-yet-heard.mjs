/* ============================================================================
   09 · YET, HEARD — a WYGWYL halfworld

   ONE PLACE, ONE NIGHT, AND THE LIGHT IS THE CLOCK. Four phone calls made at
   the water's edge before leaving: the moon high over the harbour, then the
   dead hour with no moon in it, then the first grey in the east, then the sun
   coming up out of the harbour mouth. The poem hands that arc over whole —
   "the moon", "an abyss", "east toward the sunrises", "the inner harbor" —
   and it means the whole film can be ONE tonal engine with three numbers
   moved, instead of four pictures drawn.

   WHAT THIS REPLACES, AND WHY. The first version of this film was a dashed
   cord strung between two well-drawn bodies on bare paper, and nothing else:
   four movements at seven percent ink, all line, no field. It passed every
   instrument the suite had — it moved, no frame was empty or solid, and
   "spare" is allowed here. It was still a schematic of a scene rather than a
   scene, because two figures and a wire have no sky, no ground, no distance
   and no light, and a call made in a void is a diagram of a call. The bodies
   were never the problem; they had nowhere to stand.

   SO: TONE, IN ONE PASS. Sky, far shore, water and quay are decided per cell
   in a single `F.map` — 13's harbour discipline — and the same light that
   bands the sky lays the road on the water, so a moon and a sunrise are the
   same mechanism at two positions. Falloff is in WHOLE LEVELS, six of them,
   because whole levels are the only falloff this lattice has.

   THE CORD SURVIVES, AND CHANGES SUBSTANCE. A call is still a dashed, pulsed
   thread between two people — but against a night sky it is drawn as PAPER,
   not ink, and against a dawn sky as ink. One cell, one level, decided by
   what is already under it. A voice carried across a dark harbour is a line
   of light, and that is not a metaphor the film adds; it is what the lattice
   does when you ask a mark to read against a field that changes tone.
   ========================================================================= */
import { TAU, lerp, clamp01, smooth, ss, win } from "../halfworld.mjs";

/* the three horizons this world is built on: the far shore's waterline, the
   near quay's lip, and the stone a body actually stands on. A standing head
   lands near the horizon because that is where a standing head lands — so the
   far shore is kept two to four rows deep over most of its length and the
   tall marks are pushed to the edges, which leaves the crowns against sky. */
const HOR = 64, LIP = 104, FLOOR = 124;

/* the two people on the other end of the first two calls, given silhouettes
   of their own. This world has no faces and never will, so a second person
   who is not the poet has to be told apart by outline alone — hair mass,
   shoulder line, neck — or two figures in one frame read as one figure drawn
   twice. */
const LOVER  = { hair: 0.46, beard: 0, shoulderSlope: 0.16, shoulderWide: 0.90, stoop: 0, neck: 0.88, headScale: 1.02 };
const MOTHER = { hair: 0.52, beard: 0, shoulderSlope: 0.34, shoulderWide: 0.88, stoop: 0.10, neck: 0.86, headScale: 1.04 };

/* the sheds, the crane and the light tower, as steps in a PROFILE rather than
   as objects sitting on a line — a far shore at this distance is a skyline
   and nothing else, and drawing it as boxes would give it detail it cannot
   have from across the water */
const SHEDS = [[6, 26, 8], [34, 16, 5], [92, 20, 7], [152, 10, 11], [170, 16, 6]];
/* two channels where the harbour opens to the sea. They exist so the sky
   comes all the way down to the water twice — the horizon is then never one
   ruled edge across 192 cells — and the eastern one is where the sun comes up
   in M4, which is the only reason a gap in a shore is worth having. */
const CHANNEL = [[66, 84], [120, 146]];

/* THE VALUE STRUCTURE. A painter's, not a lighting model's. DISTANCE IS
   PALE: the far shore is a hazed 5 and not a black cutout, the far water
   carries the sky's own light, and both darken as they come toward you. The
   sky is the dark surface and the water is the bright one, which is the way
   round a night landscape actually goes — and the reason a black figure has
   somewhere to be legible in all four movements, since every standing body
   here crosses the water band between its chest and its shins. */
const CLAMP = (l) => (l < 0 ? 0 : l > 7 ? 7 : l);

function profile(F, base, amp, freq, sd) {
  const out = new Float64Array(F.W);
  for (let x = 0; x < F.W; x++) out[x] = base + (F.n2(x * freq, sd) - 0.5) * amp;
  return out;
}
function shoreProfile(F) {
  const out = new Float64Array(F.W);
  for (let x = 0; x < F.W; x++) {
    let t = HOR - 2 - F.n2(x * 0.085, 11) * 3;
    for (const [sx, sw, sh] of SHEDS) if (x >= sx && x < sx + sw) t = Math.min(t, HOR - sh);
    out[x] = t;
  }
  for (const [a, b] of CHANNEL) for (let x = a; x < b; x++) out[x] = 1e9;
  return out;
}

/* ------------------------------------------------------------- THE HARBOUR
   ONE MAP, FOUR SUBSTANCES, ONE LIGHT.

   `L` is the only light in the sky — a moon, a town's glow, the east before
   sunrise, the sun — and it does two jobs from one position. It bands the sky
   away from itself in six whole levels, and it lays the ROADS on the water.
   `L.lift` caps how many of those levels a given light is strong enough to
   spend: a moon spends all six and a town spends three, which is the whole
   difference between the first movement and the second.

   `roads` are the paths of light on the water, one per person the light is
   reaching. A moon path is not a property of the moon — it points at whoever
   is looking, so two people on one quay get two of them, and that is what
   "the shared moon" means and why the line is not sentimental.

   Everything is decided per cell in this one pass. Three stacked maps do not
   fit in 16.6ms and a harbour does not need them. */
function harbour(F, u, S) {
  const shore = shoreProfile(F);
  /* four sky bands, three wandering edges. Two bands is not a night sky, it
     is a backdrop with a seam in it; four steps from the horizon to the
     zenith is a sky, and every edge is bent by noise so none of them rules a
     line across 192 cells. */
  const b1 = profile(F, 16, 11, 0.040, 3);
  const b2 = profile(F, 34, 13, 0.031, 5);
  const b3 = profile(F, 50, 11, 0.026, 9);
  /* the waterline wanders too. It is the one edge in the frame that runs the
     whole width, and four levels of jump along a ruled row is exactly the bar
     the dot law warns about — so it is bent, and cut through twice by the
     channels, where the sky comes all the way down to the water. */
  const wl = profile(F, HOR, 6, 0.075, 17);
  const w1 = profile(F, HOR + 13, 7, 0.045, 23);
  const w2 = profile(F, HOR + 28, 8, 0.038, 27);
  const lip = profile(F, LIP, 5, 0.065, 31);
  const back = profile(F, LIP + 20, 8, 0.048, 41);
  const fore = profile(F, LIP + 36, 18, 0.036, 43);
  const L = S.L, roads = S.roads || [], A = S.abyss, sky = S.sky;
  const wob = u * 2.2, nR = roads.length;
  F.map((x, y) => {
    let l;
    if (y < shore[x] && y < wl[x]) {
      /* THE SKY, and the one light in it. The bands darken toward the zenith
         and the horizon keeps a pale haze, which is what a night sky does and
         also where every head in this film is going to be. Then the light is
         SUBTRACTED out of the bands in six whole levels — `L.lift` caps how
         many a given light is strong enough to spend, so the same three lines
         are a full moon, a town's glow and a sunrise. */
      l = y < b1[x] ? sky[3] : y < b2[x] ? sky[2] : y < b3[x] ? sky[1] : sky[0];
      const d = Math.hypot((x - L.x) * L.a, y - L.y) / L.r;
      const k = d < 0.14 ? 6 : d < 0.26 ? 5 : d < 0.40 ? 4 : d < 0.58 ? 3
              : d < 0.82 ? 2 : d < 1.12 ? 1 : 0;
      l -= k < L.lift ? k : L.lift;
      /* cloud is one level either way and WHICH way is decided by the light:
         cloud with the moon behind it is the brightest thing in a night sky
         and cloud away from it is a blot. One test, two weathers. */
      if (F.n2(x * 0.026, y * 0.055 + 2.5) > 0.72) l += k >= 3 ? -1 : 1;
      /* THE SKY NEVER REACHES PAPER. Two things in this film are allowed to
         be level 0 and they are the moon and the sun; when the glow around
         the moon was also 0 the disc disappeared into its own halo and what
         was left on screen was a ring. The floor is 2 and not 1: level 1 is
         one dot in seven and at this lattice that is not distinguishable from
         paper, so a moon sitting in it was still a ring. */
      if (l < 2) l = 2;
    } else if (y < wl[x]) {
      /* THE FAR SHORE, HAZED. A black cutout across the middle of the frame
         would sit at exactly the tone the heads do and swallow them; it would
         also be a lie about how far away it is. Distance is pale. */
      l = S.shore;
    } else if (y < lip[x]) {
      /* THE WATER IS A DEPTH RAMP with a ripple on it, not one tone. The far
         water carries the sky's light and it darkens in two whole steps as it
         comes toward you, which is what puts forty cells of distance between
         the far shore and the wall you are standing on. The ripple is
         stretched two to one — long and low, the way a harbour ripple is — but
         no further: at four to one the bands ran the whole width of the frame
         and the halftone drew corrugated iron. */
      const w = F.n2(x * 0.058, y * 0.30 + wob);
      const dep = (y - wl[x]) / (lip[x] - wl[x]);
      l = S.water - (y < w1[x] ? 1 : 0) + (y > w2[x] ? 1 : 0)
                  + (w > 0.60 ? 1 : w > 0.28 ? 0 : -1);
      /* WATER STAYS THE BRIGHT SURFACE, WHATEVER THE HOUR. Every standing
         body in this film crosses the water band between its chest and its
         shins — a standing head lands at the horizon, and there is no
         arrangement of a quay where that is not true — so a dark harbour and
         a legible figure cannot both be had. The water is capped at 3 and the
         night lives in the sky, the shore and the abyss instead. */
      if (l > 4) l = 4; else if (l < 0) l = 0;
      /* THE ROAD ONLY LIGHTS THE WAVE FACES TURNED TOWARD IT. Without that
         gate a path of light is a solid pale wedge lying on the water like a
         slipway; with it the road is broken into flakes that get bigger as
         they come toward you, which is what one actually is. It also snakes,
         because a road on moving water is never straight for a whole row. */
      for (let i = 0; i < nR; i++) {
        const cx = L.x + (roads[i] - L.x) * dep + Math.sin(y * 0.66 + wob * 2.4) * 2.6;
        const o = Math.abs(x - cx) / (2.5 + dep * 11);
        if (o < 1 && w > 0.50) { l -= o < 0.45 ? 3 : 2; break; }
      }
      if (A) {
        /* THE ABYSS IS THE WATER'S OWN DEPTH. Three whole levels stepping
           inward and NO RIPPLE inside it — you cannot see the surface of
           something that deep, and the stopping of the texture is what makes
           a dark ellipse read as a hole rather than as a stain. The light
           gathers on its rim, so it has an edge without being outlined. */
        const ax = (x - A.x) / A.rx, az = (y - A.y) / A.ry, q = ax * ax + az * az;
        if (q < 1) l = q < 0.30 ? 7 : q < 0.62 ? 6 : 5;
        else if (q < 1.30) l -= 2;
      }
    } else {
      /* THE QUAY. Wet stone under a low light: near the water it holds the
         water's own tone and it dries and dulls as it comes toward you. The
         mottle is a smooth field rather than a per-cell hash — a hash at this
         amplitude read as camouflage netting laid over the whole foreground. */
      const m = F.n2(x * 0.085, y * 0.15 + 7);
      /* the strip nearest the viewer goes two levels down at once. It sits
         BELOW the feet, so it darkens nothing a body has to read against, and
         a foreground with weight in it is most of what stops a wide flat
         plane from reading as an empty page. */
      l = S.quay + (y > back[x] ? 1 : 0) + (y > fore[x] ? 2 : 0) - (m > 0.78 ? 1 : 0);
    }
    return CLAMP(l);
  });
  return lip;
}

/* THE QUAY'S OWN EDGE, in three runs with a gap at each break, plus the two
   things that say a wall rather than a beach: bollards standing on it, and a
   ladder going down the face of it into the water. An unbroken 192-wide line
   is the one thing this world's halftone cannot take. */
function quayEdge(F, lip) {
  const at = (x) => Math.round(lip[x]);
  /* THE LEVEL IS MODULATED ALONG THE RUN rather than the run being cut. A
     wall's edge with two ten-cell holes punched in it looks like a mistake,
     which is worse than the bar it was meant to avoid; a line whose level
     changes every few cells never lets the halftone find a stripe in it, and
     the edge is still an edge. Taken from the title card's own ground. */
  for (let x = 0; x < F.W; x++) {
    const n = F.noise(x, 53);
    F.ink(x, at(x), 6 - (n > 0.72 ? 2 : n > 0.44 ? 1 : 0));
  }
  for (const bx of [26, 118]) {
    F.rect(bx - 1, at(bx) - 5, 3, 6, 7);
    F.rect(bx - 2, at(bx) - 6, 5, 2, 7);
  }
  /* a ladder down the face of the wall: the one mark that says the water is
     lower than the stone rather than level with it */
  const lx = 60, ly = at(lx);
  F.line(lx, ly, lx, ly + 8, 6, 1); F.line(lx + 4, ly, lx + 4, ly + 8, 6, 1);
  for (let k = 1; k < 4; k++) F.line(lx, ly + k * 2, lx + 4, ly + k * 2, 6, 1);
}

/* the masts and the crane's jib. At 7 rather than at the shore's own tone:
   these are the only marks in the upper half of the frame that are not
   weather, and a mast that matches the shed it stands behind is a smudge. */
/* the crane sits at 44 and not at 100 because the summoned father resolves out
   of the sky around x=112 and his dissolve is bounded by a box, not by his own
   outline — anything ink-black standing inside that box speckles with him */
function rigging(F) {
  F.line(14, HOR - 8, 14, HOR - 23, 7, 1); F.line(8, HOR - 19, 21, HOR - 21, 7, 1);
  F.line(44, HOR - 6, 44, HOR - 21, 7, 1); F.line(44, HOR - 21, 57, HOR - 17, 7, 1);
  F.line(158, HOR - 11, 158, HOR - 26, 7, 1);
  F.line(176, HOR - 6, 176, HOR - 17, 7, 1);
}
/* THE TOWN ACROSS THE WATER IS ITS LIGHTS, and a light on water is a broken
   vertical streak under it. Four lamps, not seven: the first pass scattered
   enough of them to read as debris floating in the upper harbour rather than
   as reflections hanging off a shore. Stamped as paper, because a light in a
   dark field is a hole in the ink. */
const LAMPS = [[19, 6], [96, 5], [107, 4], [158, 11]];
function harbourLights(F, on) {
  if (on <= 0) return;
  for (const [x, dy] of LAMPS) {
    F.put(x, HOR - dy, 0); F.put(x + 1, HOR - dy, 0);
    for (let y = HOR + 2; y < HOR + 20; y++) {
      if (F.noise(x, y) > 0.55) continue;              // the streak is broken, always
      F.put(x + (F.noise(x, y * 7) > 0.62 ? 1 : 0), y, 0);
    }
  }
}

/* THE MOON IS PAPER. It is the brightest thing in the film and the film has
   one brighter thing only, at the very end, and that one is the sun. The
   maria are in because a plain white disc at this size is a lamp. */
function moon(F, cx, cy, r) {
  F.disc(cx, cy, r, 0, true);
  F.ring(cx, cy, r, 3, 1);
  /* the maria at 1, not at 2: a second ring inside the rim made a doughnut
     and maria at 2 made a face. What is wanted is a disc that is not blank. */
  F.disc(cx - r * 0.38, cy - r * 0.14, r * 0.30, 1, true);
  F.disc(cx + r * 0.24, cy + r * 0.34, r * 0.22, 1, true);
  F.disc(cx + r * 0.02, cy - r * 0.52, r * 0.15, 1, true);
}
/* THE SUN COMES UP OUT OF THE WATER, so it is drawn as the part of a disc
   that is above the waterline and nothing else — a half sun sitting on the
   horizon is one shape, and a whole disc slid up from underneath is two. */
function sunUp(F, cx, cy, r) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    if (y > HOR) break;
    const w = Math.sqrt(Math.max(0, r * r - (y - cy) * (y - cy)));
    F.line(cx - w, y, cx + w, y, 0, 1, true);
    F.put(Math.round(cx - w), y, 3); F.put(Math.round(cx + w), y, 3);
  }
}

/* LIGHT ON DARK, INK ON LIGHT. A mark that has to read across four movements
   of changing tone cannot pick its own level in advance, so it asks the cell
   it is landing on. This is not a fade and not an alpha — it is one cell at
   one level, chosen by what is already under it. */
function contra(F, x, y) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || x >= F.W || y < 0 || y >= F.H) return 7;
  return F.buf[F.i(x, y)] >= 4 ? 0 : 7;
}

/* THE CORD. Dashed, never solid — a call is pulses, not a wire — and its dash
   pattern is stepped by `flow` so the connection reads as live rather than
   printed on. `sag` bows the midpoint away from level: it is negative for the
   lover's call, which rises to a shared moon; positive for the mother's,
   where what she is carrying pulls the cord down into the water. */
function cord(F, x0, y0, x1, y1, flow, sag = 0) {
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
  const period = 7, on = 5, shift = Math.floor(flow * period * 5);
  for (let k = 0; k <= n; k++) {
    if (((k + shift) % period + period) % period >= on) continue;
    const t = k / n;
    const x = lerp(x0, x1, t), y = lerp(y0, y1, t) + Math.sin(t * Math.PI) * sag;
    F.disc(x, y, 1.0, contra(F, x, y), true);
  }
}

/* A BODY IS A SILHOUETTE HERE, AND IT IS CLOSED ON A SCRATCH FIELD.

   The rig fills a body three levels lighter than its own contour — 4 under a
   contour of 7 — which is right against paper and ruinous against a harbour,
   where 4 is a tone the water and the sky are also entitled to be: the first
   cut of this film came out as two wireframes with the water showing through
   them. Reserving level 4 for flesh fixed the bodies and broke the sky —
   every glow band that landed on 4 had to jump two levels, and the dawn drew
   a hard arc across the frame like the mouth of a tunnel.

   So the body goes into a SCRATCH FIELD and is composited back. The kit can
   be re-bound, so this costs one buffer per draw and one pass over the body's
   own box, every cell that comes back is known to be the body's, and the
   harbour gets all eight levels to itself again. The fill closes to 6 and not
   to 7, because one level between fill and contour is what keeps an arm in
   front of a torso instead of inside it.

   `gate` is the summoned father: a cell of him is composited only once the
   ordered schedule has reached it, so what he has not arrived into is the
   harbour behind him rather than a hole. The law's own dissolve, and it never
   touches a cell that was not his. */
function figure(F, tmp, x, h, pose, gate) {
  const main = F.buf, W = F.W;
  const x0 = Math.max(0, Math.round(x - h * 0.52)), x1 = Math.min(W - 1, Math.round(x + h * 0.52));
  const y0 = Math.max(0, Math.round(FLOOR - h - 6)), y1 = Math.min(F.H - 1, FLOOR + 5);
  for (let yy = y0; yy <= y1; yy++) tmp.fill(0, yy * W + x0, yy * W + x1 + 1);
  F.bind(tmp);
  F.fig(x, FLOOR, h, pose, 7);
  F.bind(main);
  for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) {
    const q = yy * W + xx, v = tmp[q];
    if (v > 0 && (gate === undefined || F.bayer(xx, yy) <= gate)) main[q] = v === 4 ? 6 : v;
  }
}
const scratch = (F) => new Float32Array(F.W * F.H);

/* a speaker, and the one gesture the poem is actually about. `gesture` puts
   the near hand at a named point in body space, so a hand goes TO the ear
   rather than miming near it — three men on three calls, and the frame says
   "call" before the cord does. The rest of the pose is almost nothing,
   because the harbour is the picture now and a figure at rest must not
   compete with it: a clock so a held body is not holding its breath, and a
   slow weight drift, because two people on a long call shift their feet
   without ever pacing. The tick of floor they used to stand on is gone;
   there is a quay under them. */
function speaker(F, tmp, u, x, h, face, extra = {}) {
  figure(F, tmp, x, h, { mode: "stand", face, arms: "down",
    phase: u * 1.7 + x * 0.03,
    weight: 0.5 + Math.sin(u * TAU * 0.18 + x * 0.05) * 0.28,
    gesture: [face * h * 0.075, h * 0.845],
    ...extra });
}

/* a tear lands, and the water takes it. Two rings, thin, drawn at whatever
   reads against the water under them — and inside the abyss nothing lands,
   because there is no surface there to ring. */
function splash(F, cx, cy, age) {
  const r = 1.5 + age * 7;
  F.ring(cx, cy, r, contra(F, cx - r, cy), 1);
  if (age > 0.45) F.ring(cx, cy, r * 0.44, contra(F, cx, cy), 1);
}
/* tears riding the cord from her side toward his, each on its own clock; each
   peels off partway across and falls straight down, because a tear does not
   travel the whole distance a voice does. Where one reaches the water it
   rings. Where the water has gone, it does not. */
function tears(F, x0, y0, x1, y1, sag, u, waterAt, hole) {
  const R = F.rng(29);
  for (let k = 0; k < 5; k++) {
    /* each tear leaves the cord at its own point. At one shared peel they all
       fell down the same column and read as a leak rather than as weeping. */
    const peel = 0.40 + k * 0.075;
    const speed = 0.45 + R() * 0.35, ph = R();
    const t = 1 - (u * speed + ph) % 1;
    if (t > peel) {
      const y = lerp(y0, y1, t) + Math.sin(t * Math.PI) * sag;
      const x = lerp(x0, x1, t);
      F.disc(x, y, 1.0, contra(F, x, y), true);
      continue;
    }
    const bx = lerp(x0, x1, peel), by = lerp(y0, y1, peel) + Math.sin(peel * Math.PI) * sag;
    const fall = clamp01((peel - t) / peel), hit = waterAt(bx);
    const y = by + fall * (hit - by);
    if (y < hit - 1) { F.disc(bx, y, 1.0, contra(F, bx, y), true); continue; }
    if (hole && hole(bx, hit)) continue;
    splash(F, bx, hit, clamp01((y - hit + 1) / 6 + fall * 0.2));
  }
}

/* the one footprint mark, drawn on the quay in M3 as the trace already lying
   there and again in M4 under two men actually walking on it — the same shape
   both times, because "retracing" only means something if the thing being
   retraced does not change shape between the imagining and the doing. */
function footMark(F, x, y, l) {
  F.line(x - 1.3, y - 0.4, x + 1.3, y + 0.4, l, 1.5);
  F.disc(x + 1.1, y + 0.9, 0.7, l);
}
function trail(F, x0, x1, y, l, upto) {
  const spacing = 9.5, n = Math.floor(Math.abs(x1 - x0) / spacing), dir = x1 > x0 ? 1 : -1;
  const m = Math.floor(clamp01(upto) * (n + 1));
  for (let k = 0; k <= n && k < m; k++)
    footMark(F, x0 + dir * k * spacing, y + (k % 2 ? 2.4 : -2.4), l);
}

/* "his calming demeanor summoned from the yonders": he is not there at the
   start of the call, he arrives dot by dot on the ordered schedule — the one
   dissolve this world otherwise withholds, because a call has no fade, only a
   cord. He resolves out of the paling eastern sky, which is where a man
   summoned from the yonders would come from. The map is bounded to his own
   bounding box: an unbounded pass here would be a second full field. */
function summon(F, tmp, u, x, h, arrive) {
  figure(F, tmp, x, h, { mode: "stand", face: -1, arms: "down", guise: "elder",
    phase: u * 1.7 + 2.1, weight: 0.62, headTilt: clamp01(arrive) * 0.18,
    gesture: [-h * 0.075, h * 0.845] }, arrive);
}

export default {
  n: "09", slug: "09-yet-heard", title: "YET, HEARD",
  tagline: "three calls before leaving",
  accent: "#5aa7ff", seed: 909,
  /* THE FILM'S OWN PASSAGE of the suite's 24-minute score, taken from the
     original running order. The runtime stretches this film's movements to
     fill it, so picture and record line up without either being cut. */
  window: [833.385, 950.935],
  /* the dip belongs to the mother's call, the deepest step in the film; the
     father's call starts the climb back and the walk ends above the root —
     the one place this world is allowed to sound like relief. */
  /* KEY: C Aeolian, one octave down — the suite's root at its lowest
     register for the last of the three darkest films (with 01 and 03);
     grief with nowhere further to fall by "east, at the harbor". */
  drone: { base: 32.70, steps: [0, 0, -9, -5, -12] },
  movements: [
    {
      label: "THE SHARED MOON", seconds: 17,
      line: "Before I go, we look at the moon the way we used to see it. We talk for years, travel through time — we grow old together, I believe. Maybe we could have it all.",
      cues: [
        { at: 0.25, f: 640, decay: 0.7, gain: 0.32, partials: [1, 2.0, 3.0], noise: 0.12, nDecay: 0.05, seed: 911 },
        { at: 0.75, f: 640, decay: 0.7, gain: 0.28, partials: [1, 2.0, 3.0], noise: 0.12, nDecay: 0.05, seed: 912 },
      ],
      draw(u, F) {
        const T = scratch(F);
        const t = smooth(u);
        const xL = lerp(74, 32, t), xR = lerp(118, 162, t);
        const h = 72, ay = FLOOR - h * 0.84;
        /* THE MOON CLIMBS, AND THAT IS THE HOUR PASSING. "We talk for years,
           travel through time" is a night going by, and the only clock a
           harbour has is where the moon is — so it rises through twenty-two
           rows and its six levels of glow re-band the whole sky as it goes.
           Ten thousand cells change tone across the movement and no object
           crosses the frame, which is the same trade 13 makes with its tide. */
        const mx = 96, my = lerp(34, 16, t), mr = 12;
        /* TWO ROADS, ONE MOON. A path of light on water is not a property of
           the moon — it points at whoever is looking, so two people standing
           apart on one quay each get their own, and both run back to the same
           disc. That is what "the shared moon" is, and as they drift apart
           the two roads open from a single blaze into a V. */
        const lip = harbour(F, u, {
          sky: [3, 5, 6, 7], water: 3, quay: 2, shore: 5,
          L: { x: mx, y: my, r: 38, a: 0.86, lift: 6 }, roads: [xL, xR],
        });
        rigging(F);
        harbourLights(F, 1);
        quayEdge(F, lip);
        moon(F, mx, my, mr);
        /* "WE LOOK AT THE MOON": both heads tilt up at the thing the cord
           crests toward, and turn with it as it climbs — a sightline that
           tracks, not two faces held level while a moon happens to be above
           them. The tilt deepens as the moon gets higher, because it has to. */
        const tilt = 0.42 + t * 0.30;
        speaker(F, T, u, xL, h, 1,
          { guise: "poet", headTilt: tilt, headTurn: clamp01((mx - xL) / 90) * 0.6 });
        /* SHE IS NOT AN EVERYMAN. With no hair mass and a default neck the
           second head came out as a bare disc floating over a gap at the
           shoulder — the one figure in the film who is not the poet needs her
           own silhouette or she reads as a mannequin. */
        speaker(F, T, u, xR, h, -1,
          { guise: LOVER, headTilt: tilt, headTurn: -clamp01((xR - mx) / 90) * 0.6 });
        /* the cord's crest IS the moon: it does not run flat between two
           chins with a moon drawn above it, it goes up to the thing they are
           both looking at and comes down the other side */
        /* the crest sits just UNDER the moon's limb rather than through its
           middle: a dashed arc drawn across a disc is a headband, and what
           two sightlines meeting at a moon look like is a pair of lines that
           stop at it */
        cord(F, xL, ay, xR, ay, u * 1.6, my + mr + 3 - ay);
      },
    },
    {
      label: "TEARS, AN ABYSS", seconds: 18,
      line: "Before I go, I call on my mother — in tears, speaking of an abyss she's never known. We talk for years, re-closet wounds, and re-explain my way of birth. Even after prayer: what isn't mine, I still can not give.",
      cues: [
        { at: 0.32, f: 190, decay: 0.6, gain: 0.4, partials: [1, 1.5, 2.3], noise: 0.5, nDecay: 0.15, seed: 921 },
        { at: 0.72, f: 165, decay: 0.7, gain: 0.35, partials: [1, 1.5, 2.3], noise: 0.5, nDecay: 0.18, seed: 922 },
      ],
      draw(u, F) {
        const T = scratch(F);
        const t = smooth(u);
        const xL = lerp(78, 46, t), xR = lerp(114, 148, t);
        const h = 72, ay = FLOOR - h * 0.84;
        const sag = lerp(4, 30, t);
        /* THE MOON HAS GONE and what is left is the town's own glow along the
           far shore — a weak light, three levels where the moon spent six, and
           low, so the sky is darkest overhead and palest exactly where their
           heads are. It is also the only reason two black figures are legible
           in the darkest movement of the darkest film in the suite. */
        /* THE ABYSS OPENS IN THE HARBOUR. "An abyss she's never known" is not
           a black wedge dropped between two people — it is the depth that was
           always under the water they are standing beside, becoming visible.
           So it opens IN the water, it is unlit rather than filled, and it is
           capped short of both shores: something spoken of and never seen
           whole. The first version of this film drew it as nine falling lines
           on bare paper, which is a diagram of a chasm; a chasm is a tone. */
        const A = { x: (xL + xR) / 2, y: 84, rx: lerp(9, 46, t), ry: lerp(4, 15, t) };
        const lip = harbour(F, u, {
          sky: [5, 6, 7, 7], water: 3, quay: 2, shore: 5,
          L: { x: 100, y: HOR - 2, r: 70, a: 0.42, lift: 3 }, roads: [100], abyss: A,
        });
        rigging(F);
        harbourLights(F, 1);
        quayEdge(F, lip);
        /* HE LISTENS, BOWED. SHE WEEPS, CROUCHED OVER IT. The cord's own sag
           carries the abyss opening between them; the two bodies carry the
           grief that opened it — his head dropping as hers goes further, hers
           folding forward the way someone folds around what they are saying
           rather than standing to deliver it. */
        speaker(F, T, u, xL, h, 1,
          { guise: "poet", headTilt: -0.25 - t * 0.15, crouch: t * 0.05 });
        speaker(F, T, u, xR, h, -1,
          { guise: MOTHER, headTilt: -0.35 - t * 0.25, crouch: 0.04 + t * 0.14 });
        cord(F, xL, ay, xR, ay, u * 1.1, sag);
        /* the tears fall from her side, and the water takes them — except the
           ones that fall where the water has gone. "What isn't mine, I still
           can not give": what the abyss is given, it does not answer for. */
        tears(F, xL, ay, xR, ay, sag, u, () => 88,
          (bx, by) => {
            const ax = (bx - A.x) / A.rx, az = (by - A.y) / A.ry;
            return ax * ax + az * az < 1;
          });
      },
    },
    {
      label: "HIS FOOTSTEPS, RETRACED", seconds: 18,
      line: "Before I go, I call on my father — his calming demeanor summoned from the yonders. We walk for years, east toward the sunrises, retracing his footsteps — my tears falling in the wave shadows of the inner harbor.",
      cues: [
        { at: 0.10, f: 140, decay: 0.15, gain: 0.4, partials: [1, 1.4, 2.1], noise: 0.6, nDecay: 0.05, seed: 931 },
        { at: 0.42, f: 140, decay: 0.15, gain: 0.35, partials: [1, 1.4, 2.1], noise: 0.6, nDecay: 0.05, seed: 932 },
      ],
      draw(u, F) {
        const T = scratch(F);
        const t = smooth(u);
        /* asymmetric on purpose: his side is pulled further east than ours, so
           the stretch itself leans toward the sunrise before the walk says so */
        const xL = lerp(80, 48, t), xR = lerp(112, 170, t);
        const h = 72, ay = FLOOR - h * 0.84;
        const arrive = ss(-0.06, 0.30, u);
        /* EAST TOWARD THE SUNRISES. The light is still under the horizon —
           its centre sits four rows below the waterline in the eastern
           channel — so nothing is risen and everything is lit. It climbs from
           three levels of lift to five across the movement, which walks the
           eastern sky from 5 down to 0 in whole steps while the west stays
           night: the whole sky re-bands, and that is the movement's motion. */
        const lip = harbour(F, u, {
          sky: [5, 6, 7, 7], water: 3, quay: 2, shore: 5,
          L: { x: 133, y: HOR + 4, r: lerp(66, 108, t), a: 0.40, lift: 4 + Math.round(t * 2) },
          roads: [xL],
        });
        rigging(F);
        harbourLights(F, 1 - t);
        quayEdge(F, lip);
        /* the poet turns to face the arrival as it resolves — watching him
           come in rather than standing there regardless of him */
        speaker(F, T, u, xL, h, 1, { guise: "poet", headTurn: arrive * 0.4 });
        /* summoned, not conjured: he is never at literal zero, even in the
           first instant, because "from the yonders" is a distance being
           closed, not a switch being thrown */
        summon(F, T, u, xR, h, arrive);
        cord(F, xL, ay, xR, ay, u * 2.0, -16);
        /* RETRACING HIS FOOTSTEPS. They are not a payload riding the cord —
           they are already on the quay, older than the call, running east out
           of frame past the poet's own feet, and they are counted off one at a
           time as the line names them. A print here is a shadow in stone, so
           it is the darkest thing on the ground and nothing else has to say
           it. Rejected: the same marks strung along the cord, which made a
           man's whole life into eight beads on a wire. */
        trail(F, xL + 14, 198, FLOOR + 4, 7, u * 1.15);
        /* "MY TEARS FALLING IN THE WAVE SHADOWS OF THE INNER HARBOR." The wave
           shadows are not two dashed rows drawn along the bottom edge any
           more; they are the dark faces of the harbour's own ripple, which
           the water pass has been laying down since the first frame. All this
           has to add is the falling. */
        /* they fall off the CALL and not off his face, because a tear that
           leaves a head in this frame lands on stone — the water is behind
           him, and behind is up. Off the cord they go into the harbour
           between the two men, and each one ends in a ring on the surface. */
        const R = F.rng(37), hit = 96;
        for (let k = 0; k < 3; k++) {
          const speed = 0.5 + R() * 0.3, ph = R();
          const prog = (u * speed + ph) % 1;
          const ct = 0.30 + k * 0.18;
          const x = lerp(xL, xR, ct), top = ay + Math.sin(ct * Math.PI) * -16;
          const fall = clamp01(prog / 0.78);
          if (fall < 1) { const y = lerp(top, hit, fall); F.disc(x, y, 1.0, contra(F, x, y), true); }
          else splash(F, x, hit, (prog - 0.78) / 0.22);
        }
      },
    },
    {
      label: "EAST, AT THE HARBOR", seconds: 16,
      line: "We stroll, father and son, hearted and shaken. Someone borrowed, and someone blue — yet, broken. Yet, heard.",
      /* the only shake in the film, and it is brief and small — "shaken" is
         one word in a quiet line, not a cue to make the last movement loud */
      fx: { shake: (u) => win(u, 0.30, 0.38, 0.50, 0.58) * 1.3 },
      cues: [
        { at: 0.12, f: 130, decay: 0.15, gain: 0.32, partials: [1, 1.3, 1.9], noise: 0.5, nDecay: 0.04, seed: 941 },
        { at: 0.46, f: 90, decay: 0.4, gain: 0.35, partials: [1, 1.6, 2.2], noise: 0.6, nDecay: 0.15, seed: 942 },
        { at: 0.93, f: 520, decay: 1.1, gain: 0.4, partials: [1, 2.0, 3.0], noise: 0.08, nDecay: 0.03, seed: 943 },
      ],
      draw(u, F) {
        const T = scratch(F);
        const t = smooth(u);
        const cx = lerp(40, 138, t);
        /* THE SUN COMES UP IN THE HARBOUR MOUTH. The gap in the far shore was
           cut for this: the disc rises out of open water rather than from
           behind a shed, so the one thing the film has been walking toward
           arrives with nothing in front of it. Its glow spends all six levels
           and the sky goes from night to paper — the largest tonal change in
           the film, in the last movement, which is where it belongs. */
        const sx = 133, sy = lerp(HOR + 11, HOR - 16, t), sr = 13;
        const lip = harbour(F, u, {
          sky: [3, 5, 6, 7], water: 3, quay: 2, shore: 5,
          L: { x: sx, y: sy, r: lerp(50, 104, t), a: 0.62, lift: 6 }, roads: [cx],
        });
        rigging(F);
        /* the harbour lights go out as the sun comes up, which is the only
           thing in the film that ends rather than changes */
        harbourLights(F, t < 0.42 ? 1 : 0);
        quayEdge(F, lip);
        sunUp(F, sx, sy, sr);
        /* the prints are already on the stone, laid down in the call before
           this one, and now two men are walking on them */
        trail(F, 30, 198, FLOOR + 4, 7, 1);
        /* widened from ±9: at ±9 the two bodies' torsos overlapped into one
           silhouette and "father and son" read as a single four-legged
           figure. ±14 keeps them shoulder to shoulder without merging. */
        const xf = cx - 14, xs = cx + 14, hf = 70, hs = 65;
        /* FATHER AND SON, NAMED BY GUISE: the same elder build that arrived in
           M3 and the same poet the rest of the suite knows by silhouette — a
           small, occasional turn of the head toward each other, because a
           stroll with someone is not two people walking in parallel, it is
           two people walking together and glancing over. */
        const glance = Math.sin(u * TAU * 0.35) * 0.3;
        figure(F, T, xf, hf, { mode: "walk", phase: u * 6.5, face: 1, guise: "elder", headTurn: glance });
        figure(F, T, xs, hs, { mode: "walk", phase: u * 6.5 + 0.49, face: 1, guise: "poet", headTurn: -glance });
        /* SOMEONE BLUE: the suite's one accent mark, one occurrence, held back
           until the last fifth of the last movement — everywhere else in this
           world "blue" is only the tagline's color name. Kept clear of the
           engine's own 1.5s crossfade back into the title card (u > ~0.906 at
           this length): a mark that only ever appeared already dissolving
           would never have been seen whole. */
        if (u > 0.80) F.disc(xs, FLOOR - hs * 0.62, 1.5, 8);
      },
    },
  ],
};
