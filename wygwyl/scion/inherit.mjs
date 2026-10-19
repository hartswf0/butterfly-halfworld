#!/usr/bin/env node
/* ============================================================================
   inherit.mjs — THE BACKGROUNDS, FROM THE CELS.

     node wygwyl/scion/inherit.mjs --src <dir with cels/scion/*.json>
     node wygwyl/scion/inherit.mjs --src ... --write

   The halfworld draws its rooms out of arithmetic: a floor line, a window, a
   wall of ink. They are flat, because the field is flat — one 192x144 buffer
   with no Z in it at all. GATE 4 says what that costs; the SCION stack says
   what is missing.

   cineosis-lab has already measured the thing the halfworld does not have.
   cels/build_scion.py carves the same suite into 166 cel shots and gives each
   one a seven-plane stack with METRIC DEPTH — P1 foreground at 3.75 m, the
   character at 4.72, midground at 5.66, the far wall at 6.29 — a parallax
   coefficient per plane, the contents of each plane by name (floor, tv,
   stairs, wall, ceiling), a camera move with its focus and amplitude, and the
   silhouette's own frame share.

   AND THE TWO SIDES ARE ON ONE CLOCK. The cel shots carry t0/t1 on the suite's
   own 1440.07 s, with the same chapter boundaries this repository uses, down
   to the 402 ms hole between NEVERMORE and BLOODLINES. So no mapping is
   needed, again: a halfworld shot inherits the plane stack of whatever cel
   shots cover the same seconds. The backgrounds are not invented for the
   halfworld — they are read off the footage the poem was drawn from.

   What comes out is a depth budget per shot: which planes exist, how far
   apart, and how fast each must move when the camera does. Painting them is
   the next thing; knowing where they are is this.
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..", "..");
const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf("--" + n); return i < 0 ? d : argv[i + 1]; };

const SRC = opt("src", "");
const OUT = path.join(ROOT, "renders", "scion");
fs.mkdirSync(OUT, { recursive: true });
if (!SRC || !fs.existsSync(SRC)) {
  console.error("--src must point at a directory of cels/scion/*.json");
  process.exit(1);
}

/* ---- the cel side -------------------------------------------------------- */
const cels = [];
for (const f of fs.readdirSync(SRC).sort()) {
  if (!f.endsWith(".json") || f === "index.json") continue;
  let d; try { d = JSON.parse(fs.readFileSync(path.join(SRC, f), "utf8")); } catch (_) { continue; }
  if (d.t0 == null || d.t1 == null || !d.multiplane) continue;
  cels.push({
    id: d.id, poem: d.poem, t0: d.t0, t1: d.t1, name: d.name, line: d.line,
    camera: d.multiplane.camera || null,
    silhouette: d.multiplane.silhouette || null,
    planes: (d.multiplane.planes || []).map(p => ({
      id: p.id, name: p.name, area: p.area, z_m: p.z_m, Z: p.Z,
      parallax: p.parallax, contents: p.contents || [],
    })),
    frames: d.frames, fps: d.fps,
    gates: d.gates ? Object.fromEntries(Object.entries(d.gates).map(([k, v]) => [k, v.pass])) : null,
  });
}
cels.sort((a, b) => a.t0 - b.t0);
if (!cels.length) { console.error("no cel shots read from " + SRC); process.exit(1); }

/* ---- our side ------------------------------------------------------------ */
const SHOTS = JSON.parse(fs.readFileSync(path.join(ROOT, "renders", "cineosis", "halfworld-shots.json"), "utf8"));

/* a halfworld shot inherits from every cel shot it overlaps, weighted by how
   many seconds they share — a 30 s movement spans several 6-12 s cel shots and
   taking only the first would throw away most of the room */
const lap = (a0, a1, b0, b1) => Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));
const PID = ["P0", "P1", "P2", "P3", "P4", "P5", "P6"];

let covered = 0, uncovered = [];
const out = SHOTS.map(s => {
  const over = cels.map(c => ({ c, w: lap(s.start, s.end, c.t0, c.t1) })).filter(x => x.w > 0.05);
  const span = s.end - s.start;
  const share = over.reduce((a, x) => a + x.w, 0) / span;
  if (!over.length) { uncovered.push(s.halfworld.label); return { id: s.id, cover: 0, planes: null }; }
  covered++;

  /* each plane's depth is the seconds-weighted median across the cel shots
     that cover this movement; a mean would let one long empty shot pull the
     whole room toward it */
  const planes = PID.map(pid => {
    const rows = over.map(x => ({ p: x.c.planes.find(p => p.id === pid), w: x.w })).filter(x => x.p);
    const seen = rows.filter(x => x.p.z_m != null);
    const wmed = (key) => {
      const v = seen.map(x => ({ v: x.p[key], w: x.w })).filter(x => x.v != null).sort((a, b) => a.v - b.v);
      if (!v.length) return null;
      const half = v.reduce((a, x) => a + x.w, 0) / 2;
      let acc = 0;
      for (const x of v) { acc += x.w; if (acc >= half) return +x.v.toFixed(3); }
      return +v[v.length - 1].v.toFixed(3);
    };
    const contents = {};
    for (const r of rows) for (const c of r.p.contents) contents[c] = (contents[c] || 0) + r.w;
    return {
      id: pid, name: rows[0]?.p.name || null,
      z_m: wmed("z_m"), Z: wmed("Z"), parallax: wmed("parallax"),
      area: wmed("area"),
      present: +(seen.reduce((a, x) => a + x.w, 0) / Math.max(1e-9, span)).toFixed(3),
      contents: Object.entries(contents).sort((a, b) => b[1] - a[1]).map(([k]) => k),
    };
  });

  const moves = {};
  for (const x of over) if (x.c.camera?.move) moves[x.c.camera.move] = (moves[x.c.camera.move] || 0) + x.w;
  const camera = Object.entries(moves).sort((a, b) => b[1] - a[1])[0];

  return {
    id: s.id, film: s.halfworld.n, label: s.halfworld.label,
    start: s.start, end: s.end,
    cover: +Math.min(1, share).toFixed(3),
    from: over.sort((a, b) => b.w - a.w).map(x => ({ id: x.c.id, name: x.c.name, seconds: +x.w.toFixed(2) })),
    camera: camera ? { move: camera[0], seconds: +camera[1].toFixed(2) } : null,
    planes: planes.filter(p => p.present > 0 || p.z_m != null),
  };
});

fs.writeFileSync(path.join(OUT, "inherited-planes.json"), JSON.stringify({
  about: "each halfworld shot's depth budget, inherited from the cel cut's measured multiplane stack",
  celShots: cels.length, halfworldShots: SHOTS.length, covered,
  shots: out,
}, null, 1));

/* ---- what we learned ----------------------------------------------------- */
const withP = out.filter(o => o.planes);
const depth = (pid) => {
  const v = withP.map(o => o.planes.find(p => p.id === pid)?.z_m).filter(x => x != null).sort((a, b) => a - b);
  return v.length ? v[v.length >> 1] : null;
};
console.log(`${cels.length} cel shots · ${covered}/${SHOTS.length} halfworld shots covered`);
if (uncovered.length) console.log(`  not covered: ${uncovered.slice(0, 6).join(", ")}${uncovered.length > 6 ? " …" : ""}`);
console.log(`\nMEDIAN DEPTH OF EACH PLANE, across the suite`);
for (const pid of PID) {
  const z = depth(pid);
  const rows = withP.map(o => o.planes.find(p => p.id === pid)).filter(Boolean);
  const pres = rows.filter(p => p.z_m != null).length;
  const par = rows.map(p => p.parallax).filter(x => x != null).sort((a, b) => a - b);
  const name = rows[0]?.name || "—";
  console.log(`  ${pid} ${String(name).padEnd(20)} ${z == null ? "   —  " : (z.toFixed(2) + " m").padStart(7)}`
    + ` · parallax ${par.length ? par[par.length >> 1].toFixed(3) : "  —  "} · present in ${pres}/${withP.length}`);
}
const cnt = {};
for (const o of withP) for (const p of o.planes) for (const c of p.contents) {
  cnt[p.id] = cnt[p.id] || {}; cnt[p.id][c] = (cnt[p.id][c] || 0) + 1;
}
console.log(`\nWHAT IS IN EACH PLANE`);
for (const pid of PID) {
  if (!cnt[pid]) continue;
  const top = Object.entries(cnt[pid]).sort((a, b) => b[1] - a[1]).slice(0, 6);
  console.log(`  ${pid}  ${top.map(([k, v]) => `${k} (${v})`).join(" · ")}`);
}
const mv = {};
for (const o of withP) if (o.camera) mv[o.camera.move] = (mv[o.camera.move] || 0) + 1;
console.log(`\nCAMERA  ${Object.entries(mv).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${v} ${k}`).join(" · ")}`);
console.log(`\n→ renders/scion/inherited-planes.json`);
