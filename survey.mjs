#!/usr/bin/env node
/* ============================================================================
   survey.mjs — ONE INDEX, GENERATED, SO IT CANNOT GO STALE.

     node survey.mjs          writes SURVEY.html

   This repository had ninety-one pages and no survey of them. Two partial
   indexes — the root one linking three pages, wygwyl's linking ten — plus
   twenty-two per-experiment index.html files, each an island nothing pointed
   at. Fifty-eight pages were unreachable by link and twenty-nine were never
   mentioned in any other file in the repository at all.

   A hand-written index is how that happened: every new experiment arrives with
   its own index and nobody goes back to the old one. So this is WALKED, not
   written. It finds every page, builds the link graph, works out what is
   reachable from the two real roots, counts what each folder actually holds,
   picks a cover image, and prints the whole thing with the orphans marked.

   Run it again after any new work and the survey is true again. If a page
   stops being reachable, this is where that shows up.
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const SKIP = new Set([".git", "node_modules", ".claude", "renders", "survey-covers"]);
const IMG = /\.(png|webp|jpe?g|svg|gif)$/i, VID = /\.(mp4|webm|mov)$/i;
const AUD = /\.(mp3|wav|m4a|flac|ogg)$/i;

/* ---- walk ----------------------------------------------------------------- */
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(path.join(ROOT, d) || ROOT, { withFileTypes: true })) {
    if (SKIP.has(e.name) || e.name.startsWith(".")) continue;
    const rel = d ? `${d}/${e.name}` : e.name;
    if (e.isDirectory()) walk(rel); else files.push(rel);
  }
})("");
const pages = files.filter(f => f.endsWith(".html") && f !== "SURVEY.html").sort();
const pset = new Set(pages);

/* ---- the link graph ------------------------------------------------------- */
const out = new Map(pages.map(p => [p, new Set()]));
const inb = new Map(pages.map(p => [p, new Set()]));
for (const p of pages) {
  let txt = ""; try { txt = fs.readFileSync(path.join(ROOT, p), "utf8"); } catch (_) { continue; }
  for (const m of txt.matchAll(/href\s*=\s*["']([^"'#?]+\.html)(?:[?#][^"']*)?["']/g)) {
    if (/^(https?:)?\/\//.test(m[1])) continue;
    const t = path.posix.normalize(path.posix.join(path.posix.dirname(p), m[1]));
    if (pset.has(t)) { out.get(p).add(t); inb.get(t).add(p); }
  }
  /* a page can also be named in a sibling script or manifest, which a static
     href scan never sees — that is how the film shells looked orphaned when
     they are not */
}
const mentionedElsewhere = new Set();
const nonHtml = files.filter(f => /\.(mjs|js|json|md|csv)$/i.test(f));
const blobs = new Map();
for (const f of nonHtml) { try { blobs.set(f, fs.readFileSync(path.join(ROOT, f), "utf8")); } catch (_) {} }
for (const p of pages) {
  const b = path.basename(p);
  if (b === "index.html") continue;
  for (const [f, txt] of blobs) if (f !== p && txt.includes(b)) { mentionedElsewhere.add(p); break; }
}
const ROOTS = ["index.html", "wygwyl/index.html"].filter(r => pset.has(r));
const reach = new Set(); const stack = [...ROOTS];
while (stack.length) { const c = stack.pop(); if (reach.has(c)) continue; reach.add(c); stack.push(...out.get(c)); }

/* ---- what each folder holds ----------------------------------------------- */
function folder(dir) {
  const inside = files.filter(f => f === dir || f.startsWith(dir + "/"));
  const img = inside.filter(f => IMG.test(f) && !f.endsWith(".svg"));
  return {
    files: inside.length,
    img: img.length,
    vid: inside.filter(f => VID.test(f)).length,
    aud: inside.filter(f => AUD.test(f)).length,
    md: inside.filter(f => f.endsWith(".md")).length,
    bytes: inside.reduce((a, f) => { try { return a + fs.statSync(path.join(ROOT, f)).size; } catch (_) { return a; } }, 0),
    cover: img.sort()[Math.floor(img.length / 2)]
      || poster(dir, inside.filter(f => VID.test(f)).sort()) || null,
  };
}
/* A COVER FOR A PAGE THAT IS NOT A FOLDER. The film shells have no directory
   of their own, so they had no picture — but the archive is full of frames
   named after them: `cut/out/scene/08_08-newly-single.webp` is the cover for
   `wygwyl/08-newly-single.html`. Matching on the stem makes the survey do
   something better than list the two halves — it reconnects them. */
const allImg = files.filter(f => IMG.test(f) && !f.endsWith(".svg"));

/* A POSTER FOR THE FOLDERS THAT ARE ONLY VIDEO. DRESS, INHABIT, PREVIS,
   TEXTULE and THE LOOM hold nothing but mp4s, so they had no cover at all —
   and they are exactly the video versions this survey exists to show. One
   frame is pulled from each, two seconds in, and cached in `survey-covers/`
   so a re-run costs nothing. */
const FF = (() => {
  const p = path.join(ROOT, "node_modules", "ffmpeg-static", "ffmpeg");
  try { return fs.existsSync(p) ? fs.realpathSync(p) : null; } catch (_) { return null; }
})();
const COVERS = "survey-covers";
function poster(dir, vids) {
  if (!FF || !vids.length) return null;
  const name = dir.replace(/[^\w]+/g, "_") + ".jpg";
  const rel = `${COVERS}/${name}`;
  if (fs.existsSync(path.join(ROOT, rel))) return rel;
  fs.mkdirSync(path.join(ROOT, COVERS), { recursive: true });
  const r = spawnSync(FF, ["-v", "error", "-y", "-ss", "2", "-i", path.join(ROOT, vids[0]),
    "-frames:v", "1", "-vf", "scale=320:-2", "-q:v", "6", path.join(ROOT, rel)], { timeout: 30000 });
  return r.status === 0 && fs.existsSync(path.join(ROOT, rel)) ? rel : null;
}
function coverFor(p) {
  const stem = path.basename(p, ".html");
  if (stem.length < 4) return null;
  const hits = allImg.filter(f => path.basename(f).includes(stem));
  if (!hits.length) return null;
  /* prefer a frame from the archive over a QA render */
  hits.sort((a, b) => (a.includes("MARKOV") ? -1 : 1) - (b.includes("MARKOV") ? -1 : 1) || a.localeCompare(b));
  return hits[0];
}

const title = (p) => {
  try { return (fs.readFileSync(path.join(ROOT, p), "utf8").match(/<title>([^<]*)</) || [, ""])[1].trim(); }
  catch (_) { return ""; }
};

/* ---- group ---------------------------------------------------------------- */
/* The groups are the shape the work actually took, not a taxonomy imposed on
   it: the suite and its instruments, the experiments each of which arrived as
   a folder with its own index, and the loose pages. */
const GROUPS = [
  { id: "experiments", name: "THE EXPERIMENTS", note: "each arrived as a folder with its own index — this is the first thing that points at them",
    test: (p) => p.startsWith("MARKOV_POET_ARCHIVE-FLY/") },
  { id: "suite", name: "THE SUITE", note: "the fourteen halfworlds and the instruments built around them",
    test: (p) => p.startsWith("wygwyl/") && !p.includes("/", 7) },
  { id: "tools", name: "TOOLS AND HARNESSES", note: "render rigs, benches and one-off desks",
    test: (p) => p.startsWith("harness/") || p.includes("/zz-") },
  { id: "rest", name: "EVERYTHING ELSE", note: "", test: () => true },
];
const entries = pages.map(p => {
  const dir = path.posix.dirname(p);
  const isIdx = path.basename(p) === "index.html";
  const f = isIdx ? folder(dir) : null;
  return {
    path: p, dir, title: title(p) || path.basename(p, ".html"),
    reachable: reach.has(p), mentioned: mentionedElsewhere.has(p),
    inbound: [...inb.get(p)], outbound: out.get(p).size,
    isIndex: isIdx, hold: f, cover: (f && f.cover) || coverFor(p),
    group: GROUPS.find(g => g.test(p)).id,
  };
});
const orphans = entries.filter(e => !e.reachable && !e.mentioned);

/* ---- the media, counted across the whole repository ----------------------- */
const totals = {
  pages: pages.length, reachable: reach.size, orphans: orphans.length,
  img: files.filter(f => IMG.test(f) && !f.endsWith(".svg")).length,
  vid: files.filter(f => VID.test(f)).length,
  aud: files.filter(f => AUD.test(f)).length,
  bytes: files.reduce((a, f) => { try { return a + fs.statSync(path.join(ROOT, f)).size; } catch (_) { return a; } }, 0),
};
const mb = (b) => b > 1 << 30 ? (b / (1 << 30)).toFixed(1) + " GB" : (b / (1 << 20)).toFixed(0) + " MB";

/* ---- print ---------------------------------------------------------------- */
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const card = (e) => {
  const h = e.hold;
  const bits = h ? [h.img && `${h.img} img`, h.vid && `${h.vid} vid`, h.aud && `${h.aud} audio`, h.md && `${h.md} notes`].filter(Boolean).join(" · ") : "";
  return `<a class="c${e.reachable ? "" : e.mentioned ? " loose" : " orphan"}" href="${esc(e.path)}" data-g="${e.group}" data-s="${e.reachable ? "linked" : e.mentioned ? "loose" : "orphan"}">
    ${e.cover ? `<img loading="lazy" src="${esc(e.cover)}" alt="">` : `<span class="noimg"></span>`}
    <b>${esc(e.title)}</b>
    <i>${esc(e.dir || ".")}</i>
    <u>${bits}${h ? (bits ? " · " : "") + mb(h.bytes) : ""}</u>
    ${e.reachable ? "" : `<em>${e.mentioned ? "not linked, but named in a script" : "ORPHAN — nothing points here"}</em>`}
  </a>`;
};
const section = (g) => {
  const es = entries.filter(e => e.group === g.id);
  if (!es.length) return "";
  es.sort((a, b) => (b.hold?.img || 0) + (b.hold?.vid || 0) * 10 - ((a.hold?.img || 0) + (a.hold?.vid || 0) * 10) || a.path.localeCompare(b.path));
  const orph = es.filter(e => !e.reachable && !e.mentioned).length;
  return `<section><h2>${g.name} <span>${es.length} pages${orph ? ` · ${orph} orphaned` : ""}</span></h2>
    ${g.note ? `<p class="note">${g.note}</p>` : ""}<div class="grid">${es.map(card).join("")}</div></section>`;
};
const html = `<!doctype html>
<meta charset="utf-8">
<title>SURVEY — everything in this repository, and what points at it</title>
<link rel="icon" href="wygwyl/dot.svg">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  :root{--bg:#0b0410;--paper:#f6e7c8;--dim:#8d6a70;--hot:#f2a03c;--acc:#e0532c;--edge:#2a1220;--good:#7fd67f}
  *{box-sizing:border-box}html,body{margin:0;min-height:100%}
  body{background:radial-gradient(120% 90% at 50% -10%,#3a1430 0%,#1b0817 45%,#0b0410 100%);
       color:var(--paper);font:12.5px/1.55 ui-monospace,"SF Mono",Menlo,monospace}
  header{padding:16px 20px 12px;border-bottom:1px solid var(--edge)}
  h1{margin:0;font-size:15px;letter-spacing:.30em;color:var(--hot)}
  .tally{margin-top:7px;color:var(--dim);display:flex;gap:16px;flex-wrap:wrap}
  .tally b{color:var(--paper);font-weight:400}
  .tally b.bad{color:var(--acc)}
  .filters{display:flex;gap:6px;flex-wrap:wrap;padding:11px 20px;border-bottom:1px solid var(--edge)}
  button{font:inherit;color:var(--paper);background:#00000055;border:1px solid var(--edge);
         border-radius:2px;padding:5px 10px;cursor:pointer;letter-spacing:.06em}
  button:hover{border-color:var(--hot);color:var(--hot)}
  button.on{background:#ffb45418;border-color:var(--hot);color:var(--hot)}
  main{padding:4px 20px 30px}
  section{margin:22px 0}
  h2{font-size:11px;letter-spacing:.26em;color:var(--paper);font-weight:600;margin:0 0 3px;
     border-bottom:1px solid var(--edge);padding-bottom:6px}
  h2 span{color:var(--dim);letter-spacing:.06em;font-weight:400;margin-left:8px}
  .note{color:var(--dim);margin:6px 0 11px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(188px,1fr));gap:10px}
  .c{display:block;text-decoration:none;color:inherit;border:1px solid var(--edge);
     background:#00000038;padding:8px;transition:border-color .12s}
  .c:hover{border-color:var(--hot)}
  .c img,.noimg{display:block;width:100%;aspect-ratio:4/3;object-fit:cover;background:#190a1c;
     border:1px solid var(--edge);margin-bottom:7px;image-rendering:auto}
  .c b{display:block;font-weight:400;font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .c i{display:block;font-style:normal;color:var(--dim);font-size:10.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .c u{display:block;text-decoration:none;color:var(--hot);font-size:10.5px;margin-top:3px}
  .c em{display:block;font-style:normal;color:var(--acc);font-size:10.5px;margin-top:4px}
  .c.loose em{color:var(--dim)}
  .c.orphan{border-color:#5a2018}
  footer{padding:14px 20px 30px;border-top:1px solid var(--edge);color:var(--dim);max-width:96ch}
  footer b{color:var(--paper);font-weight:400}
  .hide{display:none}
</style>
<header>
  <h1>SURVEY</h1>
  <div class="tally">
    <span><b>${totals.pages}</b> pages</span>
    <span><b>${totals.reachable}</b> reachable from an index</span>
    <span><b class="${totals.orphans ? "bad" : ""}">${totals.orphans}</b> orphaned</span>
    <span><b>${totals.img.toLocaleString()}</b> images</span>
    <span><b>${totals.vid}</b> videos</span>
    <span><b>${totals.aud}</b> audio</span>
    <span><b>${mb(totals.bytes)}</b></span>
    <span>generated ${new Date().toISOString().slice(0, 10)}</span>
  </div>
</header>
<div class="filters">
  <button class="on" data-f="all">ALL</button>
  <button data-f="orphan">ORPHANS ONLY</button>
  <button data-f="linked">LINKED ONLY</button>
  ${GROUPS.map(g => `<button data-g="${g.id}">${g.name}</button>`).join("")}
</div>
<main>${GROUPS.map(section).join("")}</main>
<footer>
  <b>This page is walked, not written.</b> It finds every page, builds the link
  graph, and works out what is reachable from <code>index.html</code> and
  <code>wygwyl/index.html</code>. A card marked ORPHAN is a page nothing in the
  repository points at — not a broken link, a page that was finished and then
  never connected to anything. A card marked <i>named in a script</i> is reached
  some other way, by a manifest or a generated link, which a static scan cannot
  see. Run <code>node survey.mjs</code> again after any new work and this is true
  again; if something stops being reachable, it shows up here first.
</footer>
<script>
  const cards = [...document.querySelectorAll(".c")];
  let f = "all", g = null;
  const apply = () => {
    for (const c of cards) {
      const okF = f === "all" || c.dataset.s === f;
      const okG = !g || c.dataset.g === g;
      c.classList.toggle("hide", !(okF && okG));
    }
    for (const s of document.querySelectorAll("section"))
      s.classList.toggle("hide", ![...s.querySelectorAll(".c")].some(c => !c.classList.contains("hide")));
  };
  for (const b of document.querySelectorAll("[data-f]")) b.onclick = () => {
    f = b.dataset.f;
    for (const o of document.querySelectorAll("[data-f]")) o.classList.toggle("on", o === b);
    apply();
  };
  for (const b of document.querySelectorAll("[data-g]")) b.onclick = () => {
    g = g === b.dataset.g ? null : b.dataset.g;
    for (const o of document.querySelectorAll("[data-g]")) o.classList.toggle("on", o.dataset.g === g);
    apply();
  };
</script>`;
fs.writeFileSync(path.join(ROOT, "SURVEY.html"), html);
console.log(`${totals.pages} pages · ${totals.reachable} reachable · ${totals.orphans} orphaned`);
console.log(`${totals.img.toLocaleString()} images · ${totals.vid} videos · ${totals.aud} audio · ${mb(totals.bytes)}`);
console.log("\norphans:");
for (const o of orphans) console.log(`  ${o.path}${o.title ? "  — " + o.title : ""}`);
console.log(`\n→ SURVEY.html`);
