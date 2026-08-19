/* ============================================================================
   00 · WHERE YOU GO WHEN YOU LEAVE — TITLE C: THE CATALOGUE — a WYGWYL halfworld

   A GRID OF CELLS, each one an independent Lissajous figure x=sin(p·t+φ),
   y=sin(q·t+ψ). p is a fixed integer per cell — the cell's identity. q is
   NOT fixed: q(u) = q0 + drift·u, a constant added every step, so the
   figure a cell draws keeps changing shape (Whitney's incremental drift).
   When q(u) passes an integer the ratio p:q simplifies and the squiggle
   collapses to a single closed loop — the resonance — and because q0 is
   chosen so that crossing happens at an EXACT, chosen u, the loop always
   lands on time without the frame ever searching for it.

   THE TITLE ASSEMBLES ONE CELL AT A TIME: the grid is laid out one column
   per character of the line being spelled, q0 for each occupied column is
   solved backward from a left-to-right lock schedule, and the instant a
   column locks its loop is swapped for that column's own slice of the
   word's raster and stays there — a contact sheet turning, column by
   column, into type. Columns that are spaces never lock; they are left
   dancing, which is the closest this device gets to punctuation.
   ========================================================================= */
import { TAU, lerp, clamp01, smooth, ss, win } from "../halfworld.mjs";

const P = 4;              // every cell's fixed frequency — see below
const DRIFT = 6;           // q(u) = q0 + DRIFT·u
const BASE_PTS = 26;       // points tracing a cell's curve when it is idle

/* Read one line's ink back as per-character buckets. wordW gives the exact
   glyph width the font laid out, so the column boundaries are the same
   monospace pitch the glyphs themselves were drawn on — an assumed pitch
   independently guessed at drifted a column and a half off by "WHERE". */
function harvestColumns(F, text, ph, cx, cy) {
  F.word(text, cx, cy, ph, 7, true);
  const raw = [];
  F.map((x, y, v) => { if (v > 3.5) { raw.push(x, y); return 0; } });
  const w = F.wordW(text, ph), left = cx - w / 2, cellW = w / text.length;
  const cols = Array.from({ length: text.length }, () => ({ xs: [], ys: [] }));
  for (let i = 0; i < raw.length; i += 2) {
    let c = Math.floor((raw[i] - left) / cellW);
    c = c < 0 ? 0 : c >= text.length ? text.length - 1 : c;
    cols[c].xs.push(raw[i]); cols[c].ys.push(raw[i + 1]);
  }
  return { cols, left, cellW };
}

/* Occupied columns, left to right, each given a lock time spread evenly
   across [a,d]; q0 is solved so q(uLock) = P exactly — a 1:1 Lissajous,
   which for any integer P is a single ellipse, so every letter arrives
   through the SAME figure. Unoccupied columns (spaces) get a q0 that keeps
   q(u) away from P for the whole movement, so they never lock. */
function planColumns(cols, a, d) {
  const occ = [];
  for (let c = 0; c < cols.length; c++) if (cols[c].xs.length) occ.push(c);
  const plan = new Array(cols.length).fill(null).map(() => ({ q0: -3.3, uLock: null }));
  occ.forEach((c, m) => {
    const uLock = occ.length > 1 ? lerp(a, d, m / (occ.length - 1)) : (a + d) / 2;
    plan[c] = { q0: P - DRIFT * uLock, uLock };
  });
  return plan;
}

/* One cell: idle it draws its own curve, locked (env from an ss() snap
   around uLock) it flies from that curve onto its own bucket of glyph ink
   and stays — "assembles" is cumulative, so this env only ever rises. */
function cell(F, u, cx, cy, ampX, ampY, phase, q0, uLock, bucket) {
  const q = q0 + DRIFT * u;
  const env = uLock == null ? 0 : ss(uLock - 0.05, uLock + 0.05, u);
  const pts = bucket && bucket.xs.length ? Math.max(BASE_PTS, bucket.xs.length) : BASE_PTS;
  for (let j = 0; j < pts; j++) {
    const t = j / pts;
    let px = cx + Math.sin(TAU * (P * t + phase)) * ampX;
    let py = cy + Math.sin(TAU * (q * t + phase * 1.6 + 0.25)) * ampY;
    if (env > 0.002 && bucket && bucket.xs.length) {
      const bi = j % bucket.xs.length;
      px = lerp(px, bucket.xs[bi], env);
      py = lerp(py, bucket.ys[bi], env);
    }
    F.ink(Math.round(px), Math.round(py), env > 0.5 ? 7 : 5);
  }
}

export default {
  n: "00", slug: "00-title-c", title: "WHERE YOU GO WHEN YOU LEAVE",
  tagline: "the catalogue — a grid of lissajous cells locking to letters",
  accent: "#5aa7ff", seed: 9003,
  drone: { base: 190, steps: [0, 3, 7, 3, 10], bright: true },
  movements: [
    {
      label: "THE CONTACT SHEET", seconds: 8, line: "",
      cues: [
        { at: 0.35, f: 587, decay: 0.3, gain: 0.35, partials: [1, 2, 3], noise: 0.2, nDecay: 0.05, seed: 81 },
        { at: 0.68, f: 494, decay: 0.3, gain: 0.35, partials: [1, 2, 3], noise: 0.2, nDecay: 0.05, seed: 82 },
      ],
      /* Eighteen cells, none of them tied to a word yet. Each one's own q0
         is solved so it resonates at its OWN random moment within the
         movement — every cell in the sheet snaps to its ellipse exactly
         once, at a different time, entirely from the drift crossing P; no
         cell's lock time is chosen by anything watching the clock. */
      draw(u, F) {
        const cols = 6, rows = 3, cw = F.W / cols, ch = F.H / rows;
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          const k = r * cols + c, R = F.rng(k);
          const uSnap = 0.12 + R() * 0.76;
          const q0 = P - DRIFT * uSnap;
          cell(F, u, (c + 0.5) * cw, (r + 0.5) * ch, cw * 0.36, ch * 0.30,
               R() * TAU, q0, null, null);
        }
      },
    },
    {
      label: "WHERE YOU GO", seconds: 10, line: "",
      cues: [
        { at: 0.18, f: 440, decay: 0.15, gain: 0.35, partials: [1, 2.4, 3.8], noise: 0.5, nDecay: 0.02, seed: 91 },
        { at: 0.42, f: 587, decay: 0.15, gain: 0.35, partials: [1, 2.4, 3.8], noise: 0.5, nDecay: 0.02, seed: 92 },
        { at: 0.68, f: 660, decay: 0.5, gain: 0.45, partials: [1, 2, 3], noise: 0.15, nDecay: 0.04, seed: 93 },
      ],
      /* One row, one column per character. Occupied columns lock left to
         right across u∈[.16,.72]; the two spaces never do. */
      draw(u, F) {
        const text = "WHERE YOU GO", cy = 66, ph = 14;
        const { cols, left, cellW } = harvestColumns(F, text, ph, F.W / 2, cy);
        const plan = planColumns(cols, 0.16, 0.72);
        for (let c = 0; c < text.length; c++) {
          const R = F.rng(c + 40);
          cell(F, u, left + (c + 0.5) * cellW, cy, cellW * 0.42, 11,
               R() * TAU, plan[c].q0, plan[c].uLock, cols[c]);
        }
      },
    },
    {
      label: "WHEN YOU LEAVE", seconds: 10, line: "",
      cues: [
        { at: 0.14, f: 392, decay: 0.15, gain: 0.35, partials: [1, 2.4, 3.8], noise: 0.5, nDecay: 0.02, seed: 101 },
        { at: 0.40, f: 523, decay: 0.15, gain: 0.35, partials: [1, 2.4, 3.8], noise: 0.5, nDecay: 0.02, seed: 102 },
        { at: 0.66, f: 588, decay: 1.4, gain: 0.55, partials: [1, 2.01, 3.02, 4.04], noise: 0.15, nDecay: 0.04, seed: 103 },
      ],
      /* Same mechanism, the second line, locking a little earlier and a
         little tighter (u∈[.14,.66]) so the whole phrase reads as one
         gesture speeding up toward its own end rather than two identical
         passes back to back. Holds from full lock to the end of the film. */
      draw(u, F) {
        const text = "WHEN YOU LEAVE", cy = 78, ph = 14;
        const { cols, left, cellW } = harvestColumns(F, text, ph, F.W / 2, cy);
        const plan = planColumns(cols, 0.14, 0.66);
        for (let c = 0; c < text.length; c++) {
          const R = F.rng(c + 80);
          cell(F, u, left + (c + 0.5) * cellW, cy, cellW * 0.42, 11,
               R() * TAU, plan[c].q0, plan[c].uLock, cols[c]);
        }
      },
    },
  ],
};
