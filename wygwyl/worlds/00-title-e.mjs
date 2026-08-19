/* ============================================================================
   00 · WHERE YOU GO WHEN YOU LEAVE — THE WALK
   the title as a story in miniature, read across all fourteen poems

   THE PROBLEM WITH THE ONE BEFORE THIS. A harmonic field is a beautiful piece
   of mathematics and it was the wrong thing to put in front of these poems. It
   was busy where they are spare, it announced its own cleverness, and its only
   relation to the fourteen films behind it was a few icons scattered on a
   rotation. Cloudy and forced — which is what happens when a title is designed
   as a demonstration rather than as a picture.

   WHAT THIS IS INSTEAD. Read the fourteen poems end to end and they make one
   sentence. A man is in a room with a window he does not take. He leaves. He
   walks — past a storm, a shore, a city, a stage, a dance floor, three phone
   calls, a road, a temple, a reunion, a harbor — and at the end of all of it
   there is a door, and this time he goes through the door.

   That is the title. Not a caption for the suite: the suite in one minute,
   told with the same marks the films are made of.

   THE PICTURE IS BUILT OUT OF TONE, NOT LINE. A room here is not a rectangle
   drawn in outline floating on cream — that is a diagram. A room is a WALL: a
   flat field of ink two levels deep, with a hole in it where the window is,
   and the hole is paper. The man is level 7 against it. Three tones, one
   figure, and the composition does the rest. Interior is dim, outside is
   cream, and the whole story is legible as light: he is in the dark, he walks
   in the light, he arrives at a dark wall, and the door opens onto paper.

   THE DISCIPLINE IS SUBTRACTION. Five movements, long holds, nothing spins,
   and the only thing that ever crosses the frame is a man.

   THE FOURTEEN ARE ON THE HORIZON. During the walk, the films pass behind him
   as small marks at the lowest ink the lattice will hold — a tambourine, a
   rose window, a moon, a temple, a daisy, an hourglass, two wheels, a candle,
   some named stars. They are the size of a distant building and they are gone
   in a breath. If you have seen the films, you have walked past them. If you
   have not, they are weather.
   ========================================================================= */
import { TAU, lerp, clamp01, smooth, ss } from "../halfworld.mjs";

const HZ = 108;                      // the floor, and the ground he walks on

/* THE GROUND. A row at one level across the whole width stripes under the
   lattice; a row with a ten-cell hole punched in it looks like a mistake,
   which is worse. So the level is modulated along the run instead — the line
   is continuous, and no two adjacent cells agree strongly enough for the
   halftone to find a bar in it. */
function ground(F, l = 5, dy = 0) {
  const y = Math.round(HZ + dy);
  for (let x = 0; x < 192; x++) {
    const n = F.noise(x, 17);
    F.ink(x, y, l - (n > 0.74 ? 2 : n > 0.46 ? 1 : 0));
  }
}

/* TEXT ARRIVES AS A WIPE, NOT AS A DISSOLVE.
   A word half-dissolved on an 8-level lattice is not a word fading in, it is
   mush — and mush at the bottom of a title card is exactly what "cloudy" is a
   description of. A wipe keeps every letter it has reached whole and leaves
   every letter it has not reached absent. `a` brings the leading edge across,
   `d` brings the trailing edge after it. */
function say(F, text, cx, y, ph, a, d = 0, l = 6) {
  const w = F.wordW(text, ph), n = text.length, cw = w / n;
  const x0 = Math.round(cx - w / 2);
  F.word(text, cx, y, ph, l, false);
  /* the edge lands on a character boundary, never inside one: a title that
     shows you half an H has an error in it, and a title that shows you three
     whole letters has a hand in it */
  const lead = x0 + Math.round(clamp01(a) * n) * cw;
  const tail = x0 + Math.round(clamp01(d) * n) * cw;
  F.map((x, yy, v) => {
    if (yy < y - ph || yy > y + ph || x < x0 - 2 || x > x0 + w + 2) return;
    if (v === l && (x >= lead || x < tail)) return 0;
  });
}

/* THE MILESTONES — one per film, a few marks each, passed at a distance.
   Drawn at 14-22 cells and level 2, which in this lattice is about what a
   building looks like from a mile away. Detail here would be a lie about how
   far off they are. */
const MILE = [
  (F, x, y, s) => { F.ring(x, y - s, s, 2, 1);                                  // 02 the tambourine
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU;
      F.ink(Math.round(x + Math.cos(a) * s), Math.round(y - s + Math.sin(a) * s), 2); } },
  (F, x, y, s) => { F.ring(x, y - s, s, 2, 1); F.ring(x, y - s, s * 0.4, 2, 1);  // 03 the rose window
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU;
      F.line(x + Math.cos(a) * s * 0.4, y - s + Math.sin(a) * s * 0.4,
             x + Math.cos(a) * s, y - s + Math.sin(a) * s, 2, 1); } },
  (F, x, y, s) => { F.ring(x, y - s * 1.6, s * 0.8, 2, 1); },                    // 09 the moon
  (F, x, y, s) => { for (let k = 0; k < 4; k++)                                  // 11 the temple
      F.line(x - s + k * s * 0.66, y, x - s + k * s * 0.66, y - s * 1.1, 2, 1);
    F.line(x - s * 1.2, y - s * 1.15, x + s * 1.2, y - s * 1.15, 2, 1);
    F.line(x - s * 1.2, y - s * 1.15, x, y - s * 1.7, 2, 1);
    F.line(x + s * 1.2, y - s * 1.15, x, y - s * 1.7, 2, 1); },
  (F, x, y, s) => { F.disc(x, y - s * 1.4, s * 0.22, 2);                         // 07 the daisy
    for (let k = 0; k < 11; k++) { const a = k / 11 * TAU;
      F.ink(Math.round(x + Math.cos(a) * s * 0.7), Math.round(y - s * 1.4 + Math.sin(a) * s * 0.7), 2); }
    F.line(x, y - s * 1.2, x, y, 2, 1); },
  (F, x, y, s) => { F.line(x - s * .7, y - s * 1.9, x + s * .7, y - s * 1.9, 2, 1); // 12 the hourglass
    F.line(x - s * .7, y, x + s * .7, y, 2, 1);
    F.line(x - s * .7, y - s * 1.9, x + s * .1, y - s * .95, 2, 1);
    F.line(x + s * .7, y - s * 1.9, x - s * .1, y - s * .95, 2, 1);
    F.line(x - s * .7, y, x + s * .1, y - s * .95, 2, 1);
    F.line(x + s * .7, y, x - s * .1, y - s * .95, 2, 1); },
  (F, x, y, s) => { F.ring(x - s * .6, y - s * .5, s * .5, 2, 1);                // 10 the ride
    F.ring(x + s * .6, y - s * .5, s * .5, 2, 1);
    F.line(x - s * .6, y - s * .5, x, y - s * 1.1, 2, 1);
    F.line(x, y - s * 1.1, x + s * .6, y - s * .5, 2, 1); },
  (F, x, y, s) => { F.box(x - s * .3, y - s * 1.0, s * .6, s, 2, 1);             // 06 the candle
    F.line(x, y - s * 1.05, x, y - s * 1.5, 2, 1); },
  (F, x, y, s) => { for (let k = 0; k < 5; k++) {                                // 05 the named stars
      const a = k * 2.4, r = s * (0.5 + (k % 3) * 0.5);
      const sx = x + Math.cos(a) * r, sy = y - s * 1.6 + Math.sin(a) * r * 0.7;
      F.ink(Math.round(sx), Math.round(sy), 2);
      F.ink(Math.round(sx + 1), Math.round(sy), 2);
      F.ink(Math.round(sx), Math.round(sy + 1), 2); } },
];

/* THE WALL. A flat field of ink with the frame's own edges left as paper, so
   it is a wall in a picture and not a bar across one. `dy` lifts the whole
   room out of frame when he leaves it. */
/* THE ROOM IS LIT BY ITS OWN HOLE. Tone falls away from the window or the
   doorway in whole levels, because whole levels are the only falloff this
   lattice has — two steps of wall instead of one, and the room stops being a
   flat panel and becomes a room with a light in it. */
function litBy(F, lx, ly, reach = 1) {
  F.map((x, y, v) => {
    if (v !== 2) return;
    const d = Math.hypot((x - lx) * 0.62, y - ly) / reach;
    return d > 96 ? 4 : d > 58 ? 3 : 2;
  });
}

function wall(F, dy = 0, l = 2) {
  const top = 8 + dy, bot = HZ + dy;
  if (bot <= 0) return;
  F.rect(16, top, 160, bot - top, l);
  F.line(16, top, 16, bot, 4, 1);                         // the corner
  F.line(176, top, 176, bot, 4, 1);
  F.line(16, top, 176, top, 4, 1);                        // the ceiling
  if (bot < HZ - 1) F.line(16, bot, 176, bot, 4, 1);      // its base, once it has left the floor
}

export default {
  n: "00", slug: "00-title-e", title: "WHERE YOU GO WHEN YOU LEAVE",
  tagline: "a man leaves a room, walks past fourteen poems, and finds a door",
  accent: "#5aa7ff", seed: 9005,
  /* NO SLATE. The runtime stamps a solid black card with the film's number and
     title in front of every world. This world IS that card, at length; playing
     both announces the picture twice. */
  slate: false,
  /* NO WINDOW. The title sits before the record starts, so the first poem's
     music no longer plays underneath it. Its own bed is low and almost still. */
  drone: { base: 32.70, steps: [0, 0, -5, 0, 3, 0], bright: false },
  movements: [
    {
      /* A ROOM, AND ALMOST NOTHING ELSE. Dim wall, bright window, one man
         against it. He is at the window and does not take it — the whole first
         poem is a man going out of a window, and the title's job is to make
         you feel he could have, and didn't, yet. */
      label: "A ROOM", seconds: 11, line: "",
      cues: [{ at: 0.62, f: 118, decay: 0.7, gain: 0.22, partials: [1, 2.0, 3.1], noise: 0.3, nDecay: 0.08, seed: 950 }],
      draw(u, F) {
        wall(F);
        /* THE DAY GOES OUT OF THE ROOM WHILE HE STANDS IN IT.
           The one thing that must happen in a first movement about a man who
           does not take a window is that the light he could have left by runs
           out. The lit reach shrinks by a factor of two and a half across the
           movement, so the wall walks from tone 2 to tone 4 in whole levels —
           ten thousand cells changing, which is a movement, and it is also
           the only thing in the picture that says any time has passed. */
        litBy(F, 137, 59, lerp(1.42, 0.52, smooth(u)));
        /* the window is a HOLE in the wall, not a box drawn on it */
        F.rect(120, 34, 34, 50, 0, true);
        F.box(120, 34, 34, 50, 5, 1);
        F.line(137, 34, 137, 84, 4, 1);
        F.line(120, 59, 154, 59, 4, 1);
        ground(F, 6);
        /* weight settles across the movement and his head comes round to the
           window — that is the whole performance and it is enough of one */
        /* he comes to it, and stops at it; the walk is over by the halfway
           mark so the rest of the movement is a man standing in a darkening
           room, which is the picture the poems keep making */
        const p = smooth(clamp01(u / 0.46));
        F.fig(lerp(28, 70, p), HZ, 50, {
          mode: p < 0.97 ? "walk" : "stand", phase: u * 6.35, face: 1, guise: "poet",
          weight: lerp(0.5, 0.84, smooth(u)),
          breath: 0.6, headTurn: smooth(clamp01((u - 0.42) / 0.5)) * 0.55,
        }, 7);
        /* the first half of the title, small and low, where a signature goes */
        say(F, "WHERE YOU GO", 52, 126, 9, ss(0.22, 0.62, u));
      },
    },
    {
      /* THE LEAVING. He goes; the room goes with him. The wall lifts out of
         frame rather than dimming, because this world has no fade — and a room
         that leaves is a truer picture of leaving one than a room that dims.
         What is left behind is paper, which is where the walk happens. */
      label: "THE LEAVING", seconds: 9, line: "",
      cues: [{ at: 0.30, f: 150, decay: 0.35, gain: 0.30, partials: [1, 2.1, 3.4], noise: 0.5, nDecay: 0.04, seed: 951 }],
      draw(u, F) {
        const lift = smooth(clamp01((u - 0.18) / 0.66)) * 122;
        wall(F, -lift);
        litBy(F, 137, 59 - lift, 0.52);
        if (HZ - lift > 0) {
          F.rect(120, 34 - lift, 34, 50, 0, true);
          F.box(120, 34 - lift, 34, 50, 5, 1);
          F.line(137, 34 - lift, 137, 84 - lift, 4, 1);
          F.line(120, 59 - lift, 154, 59 - lift, 4, 1);
        }
        ground(F, 6);
        const x = lerp(70, 156, smooth(u));
        F.fig(x, HZ, 50, {
          mode: "walk", phase: u * 5.35, face: 1, guise: "poet", headTurn: 0.3, breath: 0.5,
        }, 7);
        /* it goes when the room goes, not over three slow seconds before it —
           a title breaking up letter by letter in an empty frame reads as
           debris rather than as a departure */
        say(F, "WHERE YOU GO", 52, 126, 9, 1, ss(0.88, 1.0, u));
      },
    },
    {
      /* THE LONG WALK — the whole suite, at the size the suite is when you are
         walking past it. He crosses the entire width once. Nothing else
         happens. The fourteen films pass behind him at level 2 and are gone. */
      label: "THE LONG WALK", seconds: 17, line: "",
      draw(u, F) {
        ground(F, 5);
        /* the milestones drift right to left at the speed he is going, so the
           parallax says he is the one moving. The wrap is wider than the span
           of the marks, so no two of them ever land on top of each other. */
        /* THE FOURTEEN RUN OUT BEFORE HE DOES. They drift right to left at
           the speed he is going, and the pan is longer than the wrap, so the
           last of them goes off the left edge with a third of the walk still
           to run — he passes everything the suite contains and then keeps
           walking, which is the sentence the fourteen poems make. */
        const pan = u * 640;
        for (let k = 0; k < MILE.length; k++) {
          const x = k * 46.66 + 250 - pan;
          if (x < -30 || x > 222) continue;
          MILE[k](F, x, HZ - 1, 8 + (k % 3) * 2);
        }
        /* HAZE WITH NO TOP EDGE. A band of dots at constant density is a
           rectangle of dots; the density has to fall off with height or the
           lattice draws you the edge of the effect instead of the distance. */
        /* AND THE WEATHER COMES UP WHILE HE WALKS. The haze starts as a
           thread on the horizon and ends as a bank two fifths of the frame
           deep — the distance closing in around a man who has run out of
           landmarks. No top edge on it: the density falls off with height,
           because a band of dots at constant density is a rectangle of dots
           and the lattice will draw you the edge of the effect instead. */
        const w = ss(0.06, 0.94, u);
        const deep = lerp(6, 60, w), dens = lerp(0.34, 1.06, w);
        F.map((x, y, v) => {
          if (y > HZ - 2 || y < HZ - deep || v > 0) return;
          const d = (HZ - 2 - y) / deep, f = (1 - d) * (1 - d);
          const b = F.bayer(x, y);
          /* two tones, not one: a bank of weather has a body to it, and a
             single density of dots is a dust rather than a distance */
          if (b < dens * f * f * 0.55) return 2;
          if (b < dens * f) return 1;
        });
        const x = lerp(-14, 206, u);
        F.fig(x, HZ, 42, {
          mode: "walk", phase: u * 15.35, face: 1, guise: "poet", breath: 0.4,
          headTurn: 0.15 + Math.sin(u * TAU * 1.3) * 0.35,   // he looks around as he goes
        }, 7);
      },
    },
    {
      /* THE DOOR. The last poem's last line is that he chooses the door this
         time instead of the window he fell out of in the first. So the title
         ends on a door in a dark wall, it opens onto paper, and the one accent
         mark in the whole sequence is the light lying across the threshold. */
      label: "THE DOOR", seconds: 13, line: "",
      cues: [{ at: 0.48, f: 96, decay: 0.9, gain: 0.34, partials: [1, 1.9, 2.8], noise: 0.4, nDecay: 0.12, seed: 952 }],
      draw(u, F) {
        const DX = 118, DW = 30, DH = 66, DY = HZ - DH;
        wall(F);
        /* the doorway is the same hole the window was, one movement later and
           at the bottom of the wall instead of the middle of it */
        const open = smooth(clamp01((u - 0.30) / 0.44));
        /* THE DOOR LIGHTS THE WALL. Thirty cells by sixty-six is two percent
           of the field, so a door that only opens is a small event no matter
           how important it is. What makes it the size it deserves is that the
           room around it goes from unlit to lit as it opens — the wall walks
           from tone 4 back to tone 2 across ten thousand cells, and the man
           arrives out of the dark into it. */
        litBy(F, DX + DW / 2, DY + DH * 0.5, lerp(0.42, 1.55, open));
        F.rect(DX, DY, DW, DH, 0, true);                    // what is behind it is paper
        F.box(DX, DY, DW, DH, 5, 1);
        /* the leaf: a closed slab of ink that swings out of the way. Drawn as
           a quad in the wall's own tone, so it reads as part of the wall
           coming loose rather than as two diagonal marks in the air. */
        const lw = DW * (1 - open);
        if (lw > 1) {
          F.rect(DX + DW - lw, DY + 1, lw, DH - 2, 6);
          F.line(DX + DW - lw, DY + 1, DX + DW - lw, DY + DH - 2, 4, 1);  // its free edge
        }
        ground(F, 6);
        /* the light across the threshold — the sequence's single accent, laid
           down as two runs so it does not stripe under the lattice */
        if (open > 0.10) {
          const sp = Math.round((DW + 10) * open), x0 = DX - 5 + Math.round((DW + 10 - sp) / 2);
          for (let x = x0; x < x0 + sp; x++) { F.put(x, HZ - 1, 8); F.put(x, HZ, 8); }
          /* and a little of it thrown up the inside of the jamb */
          for (let y = HZ - 2; y > HZ - 2 - Math.round(10 * open); y--) {
            F.put(DX + 1, y, 8); F.put(DX + DW - 2, y, 8);
          }
        }
        /* he arrives and goes in; past 0.86 only the doorway is left */
        const p = smooth(clamp01(u / 0.84));
        if (u < 0.94) {
          F.fig(lerp(24, DX + DW * 0.5, p), HZ, 44, {
            mode: u > 0.76 ? "stand" : "walk", phase: u * 13.35, face: 1,
            guise: "poet", headTurn: 0.4, weight: 0.7, breath: 0.5,
          }, 7);
        }
        /* the second half of the title, opposite corner from the first */
        say(F, "WHEN YOU LEAVE", 138, 126, 9, ss(0.10, 0.50, u));
      },
    },
    {
      /* THE CREDIT. Cream, four lines, held, wiped on and wiped off. The names
         come after the title because that is where they come in a film, and
         because the title has just spent a minute earning them. */
      label: "THE CREDIT", seconds: 9, line: "",
      draw(u, F) {
        const d = ss(0.90, 1.0, u);
        say(F, "POEMS BY", 96, 48, 9, ss(0.04, 0.20, u), d);
        say(F, "MARK ANTHONY THOMAS", 96, 62, 11, ss(0.10, 0.30, u), d);
        say(F, "PROMPTS BY", 96, 88, 9, ss(0.26, 0.42, u), d);
        say(F, "WATSON HARTSOE", 96, 102, 11, ss(0.32, 0.52, u), d);
      },
    },
  ],
};
