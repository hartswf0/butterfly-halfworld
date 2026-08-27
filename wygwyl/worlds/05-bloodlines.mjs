/* ============================================================================
   05 · BLOODLINES — a WYGWYL halfworld

   ONE GRAPH, FOUR COSTUMES. Nine ancestors are nine nodes and twelve ties.
   They are the constellation he names, the Southern pine over the basement,
   the vessels feeding a fingerprint, and the book-matched veining in the
   marble of the gates — the same coordinates every time, so the film has a
   skeleton the eye recognises before it can say why.

   NAMING IS THE MECHANISM OF OWNERSHIP. A star is unclaimed until the label
   lands on it, and the label types out letter by letter; the tie between two
   stars is not drawn until both have names. He asks the galaxy for its name
   and the galaxy does not answer, because the line says "if I may".

   AND IT GETS BIGGER. M1 is a small man under a wide empty sky; by M4 the
   fingerprint has outgrown the frame and by M5 the gates run off all four
   edges. One accent mark in the whole film — the light he inherits rather
   than takes — and it sits on the same node of the graph in every costume.
   M3 has none, because M3 is the movement where he owns nothing yet.
   ========================================================================= */
import { TAU, lerp, clamp01, smooth, ss, win } from "../halfworld.mjs";

/* the blood. x,y are normalised into whatever box the movement gives them;
   lx,ly are where the name sits so nine labels can share one sky without
   colliding — hand-placed, because a rule that spaces them evenly puts them
   in a ring and a ring is not a family. */
const KIN = [
  { x: 0.10, y: 0.32, n: "AMOS", lx:  0, ly: -10 },
  { x: 0.26, y: 0.08, n: "IDA",  lx:  0, ly: -10 },
  { x: 0.40, y: 0.46, n: "OTIS", lx: -4, ly:  10 },
  { x: 0.58, y: 0.16, n: "RUTH", lx: 14, ly: -11 },
  { x: 0.50, y: 0.68, n: "MAE",  lx:  0, ly:  11 },
  { x: 0.74, y: 0.42, n: "ELI",  lx: -2, ly: -11 },
  { x: 0.92, y: 0.66, n: "CORA", lx: -8, ly:  11 },
  { x: 0.66, y: 0.90, n: "SOL",  lx:  0, ly:  10 },
  { x: 0.24, y: 0.78, n: "JUNE", lx:  0, ly:  11 },
];
const TIES = [[0,1],[1,2],[0,2],[2,3],[3,5],[2,4],[4,5],[5,6],[4,7],[2,8],[8,4],[7,5]];
const HEIR = 4;                 // MAE — the one light he is given, not one he takes
/* the order he claims them. HEIR first: inheritance is what you start with */
const CLAIM = [4, 2, 3, 1, 0, 8, 7, 5, 6];

const kinAt = (i, b) => [b.x + KIN[i].x * b.w, b.y + KIN[i].y * b.h];
const rankOf = (i) => CLAIM.indexOf(i);

/* a milled board: face, two arrises, and grain that runs its length. Drawn
   from the same endpoints as a constellation tie, which is the whole joke of
   movement two — he lies under his own sky and it is holding up a house. */
function board(F, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, L = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / L, ny = dx / L;
  F.line(ax, ay, bx, by, 3, 5);
  F.line(ax + nx * 2.6, ay + ny * 2.6, bx + nx * 2.6, by + ny * 2.6, 6, 1);
  F.line(ax - nx * 2.6, ay - ny * 2.6, bx - nx * 2.6, by - ny * 2.6, 6, 1);
  for (const off of [-1.3, 0.5]) {
    const n = Math.round(L);
    for (let k = 0; k < n; k++) {
      const t = k / n, w = off + Math.sin(t * 8.5 + off * 5) * 0.85;
      F.ink(ax + dx * t + nx * w, ay + dy * t + ny * w, 5);
    }
  }
}

export default {
  n: "05", slug: "05-bloodlines", title: "BLOODLINES",
  tagline: "he names the stars after the people who made him",
  accent: "#5aa7ff", seed: 505,
  /* THE FILM'S OWN PASSAGE of the suite's 24-minute score, taken from the
     original running order. The runtime stretches this film's movements to
     fill it, so picture and record line up without either being cut. */
  window: [422.184, 513.214],
  /* the bed RISES with the ambition — the only drone in the suite that never
     steps back down */
  /* KEY: C major (Ionian) at the suite's root — the plainest, warmest scale
     in the palette, because the ancestors being named are not a mystery. */
  drone: { base: 65.41, steps: [0, 0, 5, 7, 11, 12], bright: true },
  /* PROSODY · Mali / Guinea / Gambia · Jaliya. The cycle does not vary; that is the whole point. The breath is a constant
     5.85s and only the ground opens, from silence to 0.85, because the ground
     is the generations being added underneath a voice that is free above it.
     `deep/sonify.mjs` scans the field under this law. The root is the drone's
     own base folded into one octave, so the film sings in the key it hums in. */
  score: { engine: "jaliya", mode: "mixo" },
  movements: [
    {
      label: "NAME MY OWN STARS", seconds: 13,
      line: "Now go, they tell me. To ask if I can inherit the earth — to ask if I can name my own stars. Even galaxies, if I may.",
      cues: [
        { at: 0.30, f: 880, decay: 0.30, gain: 0.50, partials: [1, 2.01, 3.01, 4.02], noise: 0.35, nDecay: 0.012, seed: 51 },
        { at: 0.53, f: 990, decay: 0.28, gain: 0.42, partials: [1, 2.01, 3.01], noise: 0.35, nDecay: 0.012, seed: 52 },
        { at: 0.76, f: 1180, decay: 0.34, gain: 0.42, partials: [1, 2.01, 3.01], noise: 0.35, nDecay: 0.012, seed: 53 },
      ],
      draw(u, F) {
        /* THE ASK ESCALATES — the earth, then the stars, then galaxies — so
           the PICTURE escalates with it, because the line's subject is an
           order of magnitude and not a mood. This movement used to hold one
           fixed camera on a small constellation for sixteen seconds: the
           naming was real and it was two per cent of the field, which is a
           photograph of somebody naming stars rather than the naming.
           So the frame goes where the ask goes. The earth he asks for shrinks
           under his feet into a lit cap at the bottom of the field; the sky he
           is naming deepens two whole levels around it; and in the last third
           there is a galaxy across it that no name is allowed to land on. */
        const away = smooth(u);
        const R = lerp(320, 84, away), TOP = lerp(106, 130, away), CY = TOP + R;
        const gy = (x) => {
          const dx = x - 96, s = R * R - dx * dx;
          return s <= 0 ? null : CY - Math.sqrt(s);
        };
        /* THE NIGHT ARRIVES IN WHOLE LEVELS, keyed to height above the surface
           he is leaving: the last of the day sits as a lit rim on the limb and
           the sky steps down twice above it to the dark stars are visible in.
           The bands close as he goes, which is what leaving an atmosphere
           looks like. Rejected: a flat level-2 sky switched on at u=0, which
           is a backdrop; the point is that the dark is arriving.
           THE ANONYMOUS STARS COME OUT BY THEMSELVES. A faint star is a patch
           of sky two levels short of the dark around it, so they live in the
           same map and cost nothing — invisible at dusk, thick by the middle,
           which is the honest order of events and not a schedule. */
        const night = ss(0, 0.34, u);
        const t1 = lerp(160, 9, night), t2 = lerp(230, 22, night), t3 = lerp(320, 50, night);
        F.map((x, y) => {
          const a = Math.hypot(x - 96, y - CY) - R;
          const l = a < t1 ? 0 : a < t2 ? 1 : a < t3 ? 2 : 3;
          if (l === 0) return;
          return F.noise(x >> 1, y >> 1) > 0.986 ? Math.max(0, l - 2) : l;
        });
        /* EVEN GALAXIES, IF I MAY. It arrives last, it is bigger than the
           whole constellation — one arm leaves the frame — and NO NAME LANDS
           ON IT: the line asks permission and this film does not grant it. It
           is cut out of the night as light, the same substance the stars he
           did claim are made of, so that what he is refused is legible as the
           same thing he was given. Rejected: two thin spiral strokes, which is
           what was here before and read as a diagram of a galaxy at the size
           of a coin. */
        const gal = ss(0.58, 0.98, u);
        if (gal > 0.01) {
          const GX = 172, GY = 32, GR = gal * 126;
          F.map((x, y, v) => {
            if (y > 106 || v === 0) return;
            const dx = (x - GX) * 0.58, dy = y - GY;
            const rr = Math.hypot(dx, dy);
            if (rr > GR) return;
            if (rr < GR * 0.09) return 0;                              // the core
            if (rr < GR * 0.18) return F.noise(x, y) < 0.70 ? 0 : 1;   // the bulge
            /* ARMS, NOT A SMEAR. The first pass gave each arm half a sector of
               angular width and tapered its density — which on a lattice is a
               cloud, and the frame read as weather. An arm is narrow and it
               either has stars in it or it does not. */
            let p = (Math.atan2(dy, dx) - Math.log(rr) * 2.6) / Math.PI;
            p -= Math.floor(p);
            const w = Math.max(0, 1 - Math.min(p, 1 - p) * 4.5);
            const dens = w * w * (1.15 - rr / GR);
            if (F.noise(x, y) < dens * 0.85) return 0;
            if (F.noise(x + 7, y + 3) < dens * 0.45) return 1;
          });
        }
        /* THE EARTH HE IS ASKING FOR IS A GLOBE, so the horizon is convex and
           the camber strengthens as it recedes — the one honest cue that the
           thing is round and is going away. Past the halfway point its limb
           has come inside the frame by itself and there is no full-width span
           left to break. Its stipple thickens with depth, so the earth has
           mass under the horizon instead of blotches on it. */
        for (let x = 0; x < F.W; x++) {
          const g0 = gy(x);
          if (g0 === null || g0 >= F.H) continue;
          for (let y = Math.max(0, Math.ceil(g0)); y < F.H; y++) {
            const d = clamp01((y - g0) / 26);
            if (F.fbm(x * 0.075, y * 0.09, 2) > 0.50 - d * 0.18) F.ink(x, y, d > 0.45 ? 5 : 4);
          }
        }
        for (const [a, b] of [[0, 44], [52, 92], [100, 140], [148, 192]])
          for (let x = a; x < b; x++) {
            const g0 = gy(x);
            if (g0 !== null && g0 >= 0 && g0 < F.H) F.ink(x, Math.round(g0), 6);
          }
        /* THE GATE is in every frame of this film. Here it is the smallest
           thing in it — ten cells of doorway at the top of the sky, where he
           is looking. It grows every movement until it is the movement. */
        F.arc(96, 8, 5, Math.PI, TAU, 6, 1);
        F.line(91, 8, 91, 15, 6, 1); F.line(101, 8, 101, 15, 6, 1);
        /* NOW GO, THEY TELL ME — so he goes, and the ground goes with him. He
           walks the crown of a world getting smaller under his feet, which is
           the only way a body stays in the same frame as an escalation from
           earth to galaxies and stays the size the line says he is. */
        const mh = lerp(34, 13, away);
        const mx = 96 + lerp(-54, -4, away) * (0.62 + 0.38 * R / 320);
        const my = gy(mx) ?? 143;
        F.fig(mx, my, mh, {
          mode: "walk", phase: u * 5.35, face: 1, arms: "reach", guise: "poet",
          headTilt: 0.5, headTurn: 0.35,
        }, 7);
        const HX = mx + mh * 0.36, HY = my - mh * 0.865;

        const SKY = { x: 10, y: 22, w: 126, h: 76 };
        const prog = clamp01((u - 0.24) / 0.52) * KIN.length;
        const done = Math.min(KIN.length, Math.floor(prog));
        const f = clamp01(prog - done);
        /* A TIE IS A CONSEQUENCE OF TWO NAMES. Nothing joins the stars but the
           fact that both ends have been claimed — so the constellation
           assembles itself out of the naming rather than being revealed by it.
           Dotted, and in light: a dark line drawn between two lights is a
           diagram of a constellation, not a constellation. */
        for (const [a, b] of TIES) {
          if (rankOf(a) >= done || rankOf(b) >= done) continue;
          const [ax, ay] = kinAt(a, SKY), [bx, by] = kinAt(b, SKY);
          const n = Math.max(2, Math.round(Math.hypot(bx - ax, by - ay) / 4));
          for (let k = 0; k <= n; k++) F.put(lerp(ax, bx, k / n), lerp(ay, by, k / n), 0);
        }
        /* the claim itself: a dashed reach from his hand to the star being
           taken. Dashed and dim, because he has no beam — he only has nerve. */
        if (done < KIN.length) {
          const [tx, ty] = kinAt(CLAIM[done], SKY);
          const n = Math.max(3, Math.round(Math.hypot(tx - HX, ty - HY) / 3));
          const reach = Math.min(1, f * 1.7);
          for (let k = 0; k <= n * reach; k++)
            if (k % 2 === 0) F.put(lerp(HX, tx, k / n), lerp(HY, ty, k / n), 1);
        }
        for (let i = 0; i < KIN.length; i++) {
          const r = rankOf(i);
          if (r > done) continue;         // still one of the anonymous specks
          const [sx, sy] = kinAt(i, SKY);
          const lit = r < done ? 1 : f;
          /* A NAMED STAR IS A HOLE OF LIGHT. Ink cannot brighten and a star
             you have taken is the brightest thing in your sky, so the claim is
             a piece of the night handed back to paper — and it opens as the
             name lands rather than switching on. */
          F.disc(sx, sy, 1.4 + lit * 3.4, 0, true);
          const arm = 3 + lit * 9;
          F.line(sx - arm, sy, sx + arm, sy, 0, 1, true);
          F.line(sx, sy - arm, sx, sy + arm, 0, 1, true);
          /* the label TYPES: naming is an act with a duration, and the frame
             where half a name has landed is the frame the film is about */
          const nm = KIN[i].n;
          const shown = r < done ? nm : nm.slice(0, Math.ceil(f * nm.length));
          if (shown) {
            const fw = F.wordW(nm, 7), cw = F.wordW(shown, 7);
            /* THE NAME COMES ON A PLATE — the same plate the lumber carries in
               movement two. One mark that reads on paper and on night alike,
               and the film's own rhyme: the name he gives a star up here is
               the name branded on the beam over his head down there. No border
               on it: nine bordered tags is a star chart, and this is a sky.
               Clamped into the frame, because a name half off the edge is the
               one thing a movement about naming cannot afford. */
            const bx = clamp01((sx + KIN[i].lx * 1.3 - fw / 2 + cw / 2 - cw / 2 - 5) / (F.W - cw - 10)) * (F.W - cw - 10) + cw / 2 + 5;
            /* a name that would run off the top of the sky goes UNDER its star
               instead of being shoved down into it — and the top of the sky is
               where the gate is, which nothing else in this film may cover */
            const ly = KIN[i].ly * 1.45;
            const by = sy + (sy + ly < 22 ? -ly : ly);
            F.rect(bx - cw / 2 - 2, by - 6, cw + 4, 12, 0, true);
            F.word(shown, bx, by, 7, 7);
          }
          if (i === HEIR && r < done) { F.put(sx, sy, 8); F.put(sx + 1, sy, 8); F.put(sx, sy + 1, 8); }
        }
      },
    },
    {
      label: "SOUTHERN PINE", seconds: 15,
      line: "The past, too, was waiting for me — coming of age in the shared rooms of humid basements as bedrooms; mattress pads where the wood beams of Southern pine could comfort my spine. It didn’t. To dream was to prevail.",
      cues: [
        { at: 0.22, f: 210, decay: 0.09, gain: 0.45, partials: [1, 2.71, 5.13], noise: 0.85, nDecay: 0.010, seed: 61 },
        { at: 0.55, f: 176, decay: 0.11, gain: 0.45, partials: [1, 2.71, 5.13], noise: 0.85, nDecay: 0.010, seed: 62 },
        { at: 0.80, f: 1350, decay: 0.05, gain: 0.30, partials: [1, 3.4], noise: 0.9, nDecay: 0.006, seed: 63 },
      ],
      draw(u, F) {
        /* THE CEILING IS THE CONSTELLATION, SAWN. Same nodes, same ties, but
           the box is nearly the whole frame now — the film's second size. The
           sag is 01's gap restated: the joists come down toward him on a
           cycle and stop about forty cells short, forever. */
        const sag = 3.0 + Math.sin(u * TAU * 1.4) * 2.4;
        const CEIL = { x: 2, y: 2 + sag, w: 188, h: 88 };
        for (const [a, b] of TIES) {
          const [ax, ay] = kinAt(a, CEIL), [bx, by] = kinAt(b, CEIL);
          board(F, ax, ay, bx, by);
        }
        /* joist plates, punched — the hardware that makes an irregular graph
           read as carpentry rather than as a diagram of a family */
        for (let i = 0; i < KIN.length; i++) {
          const [px, py] = kinAt(i, CEIL);
          F.rect(px - 3.5, py - 3.5, 8, 8, 7);
          F.rect(px - 1, py - 1, 3, 3, 0, true);
          if (i === HEIR) { F.put(px, py, 8); F.put(px + 1, py, 8); }
        }
        /* the grade stamp. Lumber is branded every few feet, not every foot,
           so five of the nine carry their name — and the name is the same
           name that was on the star. */
        for (const i of [0, 2, 4, 6, 8]) {
          const [px, py] = kinAt(i, CEIL);
          const nm = KIN[i].n, w = F.wordW(nm, 6);
          const bx = px + KIN[i].lx * 1.5, by = py + KIN[i].ly * 1.25;
          F.rect(bx - w / 2 - 2, by - 5, w + 4, 10, 0, true);
          F.box(bx - w / 2 - 2, by - 5, w + 4, 10, 5, 1);
          F.word(nm, bx, by, 6, 7);
        }
        /* the basement wall: two courses of block. The joints are the gaps
           that keep a wall from becoming one bar across the frame. */
        for (let row = 0; row < 2; row++) {
          const y = 96 + row * 8;
          for (let c = 0; c < 8; c++) F.box(-10 + row * 14 + c * 28, y, 24, 8, 4, 1);
        }
        /* THE GATE, THIRD SIZE: a window well, which is the only gate a
           basement has. Two of his stars are through it, still named. */
        F.rect(136, 90, 46, 20, 0, true);
        F.box(136, 90, 46, 20, 6, 2);
        F.line(151, 92, 151, 108, 5, 1); F.line(166, 92, 166, 108, 5, 1);
        for (const [sx, sy] of [[144, 96], [174, 103], [158, 99]]) {
          F.line(sx - 2, sy, sx + 2, sy, 5, 1); F.line(sx, sy - 2, sx, sy + 2, 5, 1);
        }
        F.line(0, 133, 68, 133, 5, 1); F.line(80, 133, 192, 133, 5, 1);
        /* the mattress pad, tufted, and it does not compress under him —
           its top edge is at 120 in every frame of the movement */
        F.rect(64, 120, 82, 11, 2);
        F.box(64, 120, 82, 11, 5, 1);
        for (let k = 0; k < 5; k++) F.disc(73 + k * 17, 125, 1.3, 5);
        /* HE LIES ON HIS BACK, and he is drawn at fifty cells because at forty
           he was a smear. The walk phase is here only to throw one knee clear
           of the other: at rot ≈ −1.5 a standing pose puts head, hips, both
           feet and both hands on one scanline. Arms are forced down for the
           same reason — 'open' threw one arm straight up out of the bed. */
        /* the 0.09 constant still does the one job it was tuned for — one
           knee clear of the other at any u — but a body that lies still for
           fifteen humid seconds is not a held frame, it shifts. A slow drift
           on top of the constant keeps the knee separation intact at every
           u while giving him a restless half-turn across the movement. */
        F.fig(106, 140, 50, { mode: "walk", phase: 0.09 + u * 0.15, rot: -1.5, face: -1, arms: "down", guise: "poet" }, 7);
        /* THE MEASURE FROM THE PINE TO HIS BACK. This is the number the line
           is about: it breathes and it never closes, which is the whole of
           "could comfort my spine. It didn't." Rejected: drawing the spine as
           a row of ticks on the torso — it made the man a caterpillar. */
        const [hx, hy] = kinAt(HEIR, CEIL);
        for (let y = hy + 6; y < 112; y += 5) F.ink(hx, y, 4);
        F.line(hx - 4, 112, hx + 4, 112, 5, 1);
        F.line(hx - 4, hy + 6, hx + 4, hy + 6, 5, 1);

        /* HUMID. The room does not fog — a fog is a gradient. It BEADS: the
           damp takes cells one at a time on the ordered schedule, and where
           it has taken enough of them it runs. */
        const damp = ss(0.05, 0.86, u);
        F.map((x, y, v) => {
          const b = F.fbm(x * 0.11, y * 0.11 + 9, 3);
          if (b > 0.44 && F.bayer(x, y) < damp * (b - 0.40) * 3.5) return Math.max(v, 2);
        });
        const R = F.rng(23);
        for (let k = 0; k < 16; k++) {
          const dx0 = 8 + R() * 176, dy0 = 16 + R() * 62, start = R() * 0.72;
          const p = clamp01((u - start) / 0.46);
          if (p > 0) F.disc(dx0, dy0 + p * (118 - dy0), 1.4, 6);
        }
        /* TO DREAM WAS TO PREVAIL. The wood gives the frame back to the sky
           dot by dot — the same allegiance swap, run in reverse of movement
           one. Rejected: cross-fading to a second drawing of M1, which is
           exactly the thing this world is not allowed to do. */
        const dream = ss(0.72, 1.0, u);
        if (dream > 0.01) {
          F.map((x, y, v) => (v > 0 && v < 6.5 && y < 94 && F.bayer(x, y) < dream * 0.8 ? 0 : undefined));
          for (let i = 0; i < KIN.length; i++) {
            const [px, py] = kinAt(i, CEIL), arm = 2 + dream * 7;
            F.line(px - arm, py, px + arm, py, 7, 1);
            F.line(px, py - arm, px, py + arm, 7, 1);
          }
        }
      },
    },
    {
      label: "A NEW UNIVERSE", seconds: 13,
      line: "They tell me: ask if I can invent a new universe — if God would let me, little ole me, award a blessing here and there. Even grant miracles.",
      cues: [
        { at: 0.14, f: 300, decay: 0.35, gain: 0.42, partials: [1, 1.98, 3.02, 5.1], noise: 0.4, nDecay: 0.02, seed: 71 },
        { at: 0.48, f: 400, decay: 0.35, gain: 0.42, partials: [1, 1.98, 3.02, 5.1], noise: 0.4, nDecay: 0.02, seed: 72 },
        { at: 0.78, f: 600, decay: 0.9, gain: 0.55, partials: [1, 2.0, 3.0, 4.0, 6.0], noise: 0.3, nDecay: 0.03, seed: 73 },
      ],
      draw(u, F) {
        const CX = 96, CY = 118;
        /* THE GATE, FOURTH SIZE, AND STILL SHUT. The line is a request, so
           the seam holds. The accent is deliberately absent from this
           movement: he owns nothing here, he is asking. */
        F.box(74, 6, 44, 38, 5, 2);
        F.rect(95, 8, 2, 34, 5);
        /* panelled, not ruled: the first pass drew the leaves as stacks of
           horizontal lines and the gate read as a page of text */
        for (const px of [78, 99]) { F.box(px, 10, 15, 14, 4, 1); F.box(px, 27, 15, 13, 4, 1); }
        /* THE UNIVERSE IS INVENTED AS A WEB, not as a spray of stars: shells
           of matter born one after another out of his raised hands, joined
           by filaments that stretch as everything gets further apart. The
           first pass drew closed rings and the frame read as a stone dropped
           in water — the arcs now break at every node, which is what makes
           it structure instead of a ripple. */
        const SH = 9, CNT = [11, 15, 19];
        const radOf = (k) => Math.max(0, (u - k * 0.095)) * 175;
        const angsOf = (k) => {
          const n = CNT[k % 3], A = [];
          for (let j = 0; j < n; j++) A.push((j + F.noise(k * 7 + j, 3) * 0.5) / n * TAU - 1.35);
          return A;
        };
        for (let k = SH - 1; k >= 0; k--) {
          const r = radOf(k);
          /* nothing is drawn until it has cleared his hands by fifteen cells:
             the newest shell otherwise piles onto the figure and swallows the
             only person in the frame */
          if (r < 15) continue;
          const A = angsOf(k), n = A.length;
          for (let j = 0; j < n; j++) {
            const a0 = A[j], a1 = (j + 1 < n ? A[j + 1] : A[0] + TAU);
            const seg = Math.max(4, Math.round((a1 - a0) * r * 1.3));
            for (let q = 2; q < seg - 1; q++) {
              const a = a0 + (a1 - a0) * q / seg;
              F.ink(CX + Math.cos(a) * r, CY + Math.sin(a) * r, 2);
            }
            const am = (a0 + a1) / 2;
            F.disc(CX + Math.cos(am) * r, CY + Math.sin(am) * r, 1.1, 4);
          }
          if (k > 0) {
            const r2 = radOf(k - 1), A2 = angsOf(k - 1), n2 = A2.length;
            for (let j = 0; j < n; j++) {
              const j2 = Math.round(j * n2 / n) % n2;
              F.line(CX + Math.cos(A[j]) * r, CY + Math.sin(A[j]) * r,
                     CX + Math.cos(A2[j2]) * r2, CY + Math.sin(A2[j2]) * r2, 3, 1);
            }
          }
          for (let j = 0; j < n; j++) {
            const px = CX + Math.cos(A[j]) * r, py = CY + Math.sin(A[j]) * r;
            F.disc(px, py, 1.9, 6);
            /* a blessing, here and there — one node in eight, marked and
               left. "Here and there" is a density, so it is a threshold on
               deterministic noise and never a count. */
            if (F.noise(k * 17 + j, 5) > 0.87) {
              F.line(px - 4, py, px + 4, py, 7, 1);
              F.line(px, py - 4, px, py + 4, 7, 1);
            }
          }
        }
        /* the ask: a dashed plumb from his hands to the seam of the gate.
           Everything he invents is drawn around this line. */
        for (let y = 46; y < 116; y += 4) F.ink(96, y, 4);
        F.line(58, 136, 88, 136, 5, 1); F.line(104, 136, 134, 136, 5, 1);
        F.fig(96, 136, 16, { mode: "stand", arms: "up", guise: "poet" }, 7);
        /* EVEN GRANT MIRACLES: one node stops obeying the scale of the
           universe it belongs to. That is the only definition of a miracle
           this world can draw. */
        const mir = ss(0.70, 0.97, u);
        if (mir > 0.01) {
          const A = angsOf(5), r = radOf(5), a = A[4];
          const mx = CX + Math.cos(a) * r, my = CY + Math.sin(a) * r;
          F.ring(mx, my, 5 + mir * 21, 7, 2);
          F.ring(mx, my, 2.5 + mir * 10, 6, 1);
          F.disc(mx, my, 2 + mir * 3, 7);
        }
      },
    },
    {
      label: "BEWARE OF ME", seconds: 14,
      line: "In uncertain times, in forsaken times. Their blood flows through my hands — fingerprints that orchestra great powers — sun-kissing my skin, deepening my voice to a baritone of a million cries. Beware of me.",
      fx: { shake: (u) => ss(0.74, 1, u) * 2.4 },
      cues: [
        { at: 0.20, f: 130, decay: 0.5, gain: 0.5, partials: [1, 1.51, 2.24], noise: 0.5, nDecay: 0.05, seed: 81 },
        { at: 0.56, f: 98, decay: 0.7, gain: 0.55, partials: [1, 1.49, 2.2], noise: 0.5, nDecay: 0.07, seed: 82 },
        { at: 0.84, f: 62, decay: 1.2, gain: 0.6, partials: [1, 1.48, 2.18], noise: 0.6, nDecay: 0.12, seed: 83 },
      ],
      draw(u, F) {
        const CX = 96, CY = 66;
        const grow = 0.62 + smooth(u) * 0.72;
        /* THE PRINT OUTGROWS THE PICTURE. Concentric, literally, with the
           core drifting a cell or two per ridge so the whorl nests off-axis
           the way a real one does; every ridge ends somewhere, because a
           closed ring is a target and a broken one is skin.
           The ridge SPACING widens outward — that is the voice deepening —
           and past forty cells a ridge stops being a line and becomes a row
           of tick marks, which is what a million cries look like from here.
           Rejected: a separate waveform along the bottom edge. It made the
           frame a diagram with a soundtrack drawn under it. */
        for (let m = 0; m < 26; m++) {
          const r = (3 + m * (3.4 + m * 0.20)) * grow;
          if (r > 200) break;
          const dcx = CX + Math.sin(m * 0.55) * 2.0, dcy = CY + Math.sin(m * 0.37 + 1.1) * 1.7;
          /* the beat travelling outward through the ridges: great powers,
             orchestrated — a conductor's stripe, not a rotation */
          const beat = (((m * 0.8 - u * 9) % 5) + 5) % 5;
          const l = beat < 2.2 ? 7 : 4;
          const ga = F.noise(m, 3) * TAU, gw = 0.20 + F.noise(m, 9) * 0.34;
          if (r < 40) {
            F.arc(dcx, dcy, r, ga + gw, ga + TAU, l, 1);
          } else {
            /* the ticks lie ALONG the ridge, not across it. Radial ticks made
               a sunburst — a picture of a sun, in the frame that already has
               one — and the ridge stopped being a ridge. */
            const n = Math.max(14, Math.round(r * 0.42));
            const step = (TAU - gw) / n;
            for (let j = 0; j < n; j++) {
              const a = ga + gw + step * j;
              F.arc(dcx, dcy, r, a, a + step * 0.42, l, 1);
            }
          }
        }
        /* two more fingers, also too big for the frame, so that "hands" is
           plural and the corners are not empty paper */
        for (const [ox, oy, sc] of [[-16, 138, 1], [206, 6, 1]])
          for (let m = 2; m < 16; m++) {
            const r = (3 + m * (3.6 + m * 0.22)) * sc * grow;
            const ga = F.noise(m + 40, 3) * TAU;
            F.arc(ox, oy, r, ga + 0.3, ga + TAU, 3, 1);
          }
        /* THEIR BLOOD, ARRIVING FROM ABOVE. The graph is pushed up until
           six of the nine are off the top of the frame — the ancestors are
           mostly out of shot by now — and the three that are left send
           vessels down into the core, tapering as they go. */
        const VEIN = { x: -18, y: -30, w: 228, h: 74 };
        for (const [a, b] of TIES) {
          const [ax, ay] = kinAt(a, VEIN), [bx, by] = kinAt(b, VEIN);
          if (ay < -6 && by < -6) continue;
          F.line(ax, ay, bx, by, 4, 1.4);
        }
        for (const i of [4, 8, 7]) {
          const [vx, vy] = kinAt(i, VEIN);
          for (let k = 0; k <= 44; k++) {
            const t = k / 44;
            const x = lerp(vx, CX, smooth(t)) + Math.sin(t * 6.5 + i) * 10 * (1 - t);
            F.disc(x, lerp(vy, CY, t), 1.7 - t * 1.0, 7);
          }
        }
        F.put(CX, CY, 8); F.put(CX + 1, CY, 8); F.put(CX, CY + 1, 8);
        /* SUN-KISSING MY SKIN. Not a wash — a front. The kiss advances from
           one corner on the ordered schedule and what is behind the front is
           flat level two, so the frame stays quantised. */
        const sun = ss(0.22, 0.95, u);
        F.disc(172, 16, 7, 7);
        for (let k = 0; k < 8; k++) {
          const a = k / 8 * TAU + 0.2;
          F.line(172 + Math.cos(a) * 9.5, 16 + Math.sin(a) * 9.5,
                 172 + Math.cos(a) * 14, 16 + Math.sin(a) * 14, 6, 1);
        }
        F.map((x, y, v) => {
          if (v > 0.5) return;
          const d = Math.hypot(x - 172, y - 16) / 230 + (F.n2(x * 0.045, y * 0.045) - 0.5) * 0.11;
          if (F.bayer(x, y) < (sun - d) * 3) return 2;
        });
      },
    },
    {
      label: "THE GATES OPEN", seconds: 15,
      line: "The gates open with wings — gifted from evolution, and made of marble stones kissed by the hymns our Creator composed, with an orchestra of our ancestors’ wildest dreams, to welcome us.",
      cues: [
        { at: 0.10, f: 88, decay: 1.0, gain: 0.55, partials: [1, 1.62, 2.31, 3.9], noise: 0.8, nDecay: 0.18, seed: 91 },
        { at: 0.46, f: 330, decay: 1.4, gain: 0.5, partials: [1, 2, 3, 4, 5, 6], noise: 0.15, nDecay: 0.02, seed: 92 },
        { at: 0.80, f: 660, decay: 1.6, gain: 0.5, partials: [1, 2, 3, 4, 5, 6], noise: 0.12, nDecay: 0.02, seed: 93 },
      ],
      draw(u, F) {
        /* THE LEAVES ARE HINGED OFF THE FRAME AND SWING TOWARD US, so their
           projected width foreshortens as they open — which is both true and
           the only way a gate that fills the frame when shut can leave room
           for what is behind it when open. Rejected: sliding the leaves
           sideways, which reads as a lift door and has no hinge. */
        const open = smooth(clamp01((u - 0.04) / 0.80));
        const Wp = 122 * Math.cos(open * 1.18);
        const inner = 124 - Wp;
        const wing = ss(0.16, 0.86, u);
        /* STONE → WING. At wing=0 the leaf is a slab with both edges off the
           frame. At wing=1 it is nine feathers: the leading edge falls away
           on a curve and the trailing edge bulges once per feather, so each
           rib can land on its own tip. The first pass scalloped the trailing
           edge by two cells at a frequency unrelated to the ribs, and the
           leaves read as swung doors with diagonals ruled on them. */
        const FEATHERS = 9;
        const leadf = (q) => 34 - 44 * q + 14 * q * q;
        const trailf = (q) => leadf(q) + 30 + 118 * q + Math.abs(Math.sin(q * Math.PI * FEATHERS)) * 8;
        const topf = (q) => lerp(-8, leadf(q), wing);
        const botf = (q) => lerp(152, trailf(q), wing);
        const qOf = (x) => (Math.abs(x - 96) - inner) / Wp;
        const inLeaf = (x, y) => {
          const q = qOf(x);
          return q >= 0 && q <= 1 && y >= topf(q) && y <= botf(q);
        };
        for (const s of [-1, 1]) {
          for (let x = 0; x < F.W; x++) {
            if (Math.sign(x - 96) !== s && x !== 96) continue;
            const q = qOf(x);
            if (q < 0 || q > 1) continue;
            const t0 = topf(q), t1 = botf(q);
            /* MARBLE: a pale stone is a sparse stipple with darker drift in
               it, not a filled block. A filled block at level 2 turned the
               finale into a grey wall with a slot in it. */
            for (let y = Math.max(0, Math.ceil(t0)); y <= Math.min(F.H - 1, Math.floor(t1)); y++) {
              const mk = F.fbm(x * 0.05 + s * 3, y * 0.05, 3);
              if (mk > 0.62) F.ink(x, y, 2); else if (mk > 0.42) F.ink(x, y, 1);
            }
            if (wing > 0.2) {
              if (t0 > 2) { F.ink(x, t0, 6); F.ink(x, t0 + 1, 6); }
              if (t1 < F.H - 2) { F.ink(x, t1, 6); F.ink(x, t1 - 1, 6); }
            }
          }
          /* the veining is the same twelve ties, and the two leaves are
             book-matched the way a marble slab is cut from one block */
          const LB = { x: 96 + s * inner, y: 10, w: s * (Wp - 4), h: 124 };
          for (const [a, b] of TIES) {
            const [ax, ay] = kinAt(a, LB), [bx, by] = kinAt(b, LB);
            const n = Math.max(4, Math.round(Math.hypot(bx - ax, by - ay)));
            for (let k = 0; k <= n; k++) {
              const t = k / n;
              const vx = lerp(ax, bx, t) + Math.sin(t * 9 + a) * 2.4;
              const vy = lerp(ay, by, t) + Math.cos(t * 7 + b) * 2.0;
              if (inLeaf(vx, vy)) F.ink(vx, vy, 4);
            }
          }
          /* GIFTED FROM EVOLUTION. The masonry courses do not fade — they
             are handed over to the feather ribs cell by cell on the ordered
             schedule, so at mid-movement the leaf is measurably part stone
             and part bird and never a blur of both. */
          for (let row = 0; row < 7; row++) {
            const cy = 12 + row * 21;
            for (let x = 0; x < F.W; x++) {
              if (Math.sign(x - 96) !== s) continue;
              if ((x % 23) > 17) continue;
              if (F.bayer(x, cy) < wing) continue;
              if (inLeaf(x, cy)) F.ink(x, cy, 4);
            }
          }
          /* the ribs arrive one at a time — gifted from evolution — and each
             one lands on the peak of its own feather */
          const shx = 96 + s * (inner + 0.99 * Wp), shy = topf(0.99) + 4;
          for (let j = 0; j < FEATHERS; j++) {
            if (wing < 0.14 + j * 0.078) continue;
            const qe = (j + 0.5) / FEATHERS;
            const ex = 96 + s * (inner + qe * Wp), ey = botf(qe);
            for (let k = 0; k <= 110; k++) {
              const t = k / 110, rx = lerp(shx, ex, t), ry = lerp(shy, ey, t);
              if (inLeaf(rx, ry)) F.ink(rx, ry, 5);
            }
          }
          F.line(96 + s * inner, Math.max(0, topf(0)), 96 + s * inner, Math.min(143, botf(0)), 6, 2);
        }
        /* WHAT IS THROUGH THE GATE. The hymns arrive as broken rings — a
           closed ring here would be a target — and under them the nine
           stand with their arms open, wearing the names he gave them in
           movement one. The film ends where the naming went. */
        const GAP = inner - 4;
        if (GAP > 10) {
          for (let r = 22; r < 116; r += 12) {
            const n = Math.round(r * 2.4);
            for (let k = 0; k <= n; k++) {
              const a = Math.PI * 1.04 + (k / n) * Math.PI * 0.92;
              const hx = 96 + Math.cos(a) * r, hy = 132 + Math.sin(a) * r * 0.82;
              if ((k % 7) < 5 && Math.abs(hx - 96) < GAP - 2) F.ink(hx, hy, 3);
            }
          }
          for (const [i, ny, off, ph] of [[HEIR, 40, 0, 7], [2, 58, -22, 6], [5, 58, 22, 6],
                                          [8, 76, -22, 6], [7, 76, 22, 6]]) {
            const nx = 96 + off, w = F.wordW(KIN[i].n, ph);
            if (Math.abs(off) + w / 2 < GAP - 3) F.word(KIN[i].n, nx, ny, ph, 4);
          }
          /* an orchestra, not a chorus line: the outer two carry the elder
             guise so the crowd reads as generations rather than a repeated
             stencil of the same body five times */
          for (let j = -2; j <= 2; j++) {
            const fx2 = 96 + j * 15;
            if (Math.abs(fx2 - 96) > GAP - 8) continue;
            F.fig(fx2, 126, 14 - Math.abs(j), { mode: "stand", arms: "open", guise: Math.abs(j) === 2 ? "elder" : "everyman" }, 6);
          }
        }
        /* the light he inherited, last seen at the core of his own print,
           now on the far side — visible through the seam from the first
           frame of the movement, before the gates have moved at all */
        F.put(96, 70, 8); F.put(96, 71, 8); F.put(96, 72, 8);
      },
    },
  ],
};
