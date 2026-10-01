#!/usr/bin/env node
/* ============================================================================
   sheet.mjs — THE 94, AS CINEOSIS WOULD HOLD THEM.

     node wygwyl/cineosis/sheet.mjs       → renders/cineosis/INDEX.html

   Law 5 of this repository: every serious defect produced a plausible picture,
   and every one was caught by looking at an image rather than by a test. A
   shot record that validates is not a shot. This lays all 94 out with the
   thumb, the strip, the clip, and every field a cineosis shot carries, so the
   ones that are wrong can be seen to be wrong.

   It shows the fields THE WAY THE JOIN MAKES THEM: the time on the cut's
   clock, the scale CLIP assigned beside the scale the film's own draw calls
   know, and the four CLIP fields marked absent rather than quietly omitted.
   ========================================================================= */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..", "..");
const OUT = path.join(ROOT, "renders", "cineosis");
const S = JSON.parse(fs.readFileSync(path.join(OUT, "halfworld-shots.json"), "utf8"));
/* --base rewrites every media path to a published site, because this page is
   worth sending to someone and 282 files of clip, thumb, strip and cutout are
   not worth sending with it. The files still have to exist locally: a path that
   resolves on a server but was never written is the one failure this sheet
   exists to make visible. */
const argv = process.argv.slice(2);
const BASE = ((argv.indexOf("--base") < 0 ? "" : argv[argv.indexOf("--base") + 1]) || "").replace(/\/+$/, "");
const url = (p) => (BASE ? `${BASE}/renders/cineosis/${p}` : p);
/* --embed inlines the stills so the page survives being sent somewhere that
   serves only itself. The clips do not come: 94 of them are 120MB against a
   16MB page, so the thumb stays and the clip becomes a link. A page that
   silently shows a blank video element is worse than one that says "clip" and
   takes you to it. */
const EMBED = argv.includes("--embed");
/* AND DOWNSCALED ON THE WAY IN. Inlined at full size the 94 thumbs and 94
   strips come to 17.4MB of base64 against a 16MB page — over the limit by
   enough that trimming quality alone would not do it. A card shows the thumb at
   about 310px and the strip at the same width, so carrying 320 and 1920 is
   paying for pixels no one sees. */
const FF = (() => { try {
  return fs.realpathSync(path.join(ROOT, "node_modules", "ffmpeg-static", "ffmpeg"));
} catch (_) { return null; } })();
const MIME = { ".jpg": "image/jpeg", ".png": "image/png" };
const cache = new Map();
const data = (p, w) => {
  if (!p) return null;
  if (!EMBED) return url(p);
  if (cache.has(p)) return cache.get(p);
  const f = path.join(OUT, p);
  let out = url(p);
  try {
    if (FF && w) {
      const tmp = path.join(OUT, ".sheet-tmp.jpg");
      const r = spawnSync(FF, ["-v", "error", "-y", "-i", f, "-vf", `scale=${w}:-2`, "-q:v", "6", tmp]);
      if (r.status === 0 && fs.existsSync(tmp)) {
        out = "data:image/jpeg;base64," + fs.readFileSync(tmp).toString("base64");
        fs.unlinkSync(tmp);
      }
    } else {
      out = `data:${MIME[path.extname(p)] || "application/octet-stream"};base64,`
        + fs.readFileSync(f).toString("base64");
    }
  } catch (_) {}
  cache.set(p, out);
  return out;
};

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const tc = (t) => `${String(Math.floor(t / 60)).padStart(2, "0")}:${(t % 60).toFixed(2).padStart(5, "0")}`;
const have = (p) => p && fs.existsSync(path.join(OUT, p));

const films = [...new Set(S.map(s => s.halfworld.n))].sort();
const card = (s) => {
  const h = s.halfworld;
  const dot = (c) => `<i style="background:${esc(c)}"></i>`;
  return `<article data-f="${esc(h.n)}" data-q="${esc((s.title + " " + h.label + " " + h.line + " " + s.scale).toLowerCase())}">
  <div class="pic">${!have(s.thumb) ? `<div class="none">no media yet</div>`
    : EMBED
      ? `<img src="${esc(data(s.thumb, 300))}" alt="the shot at its representative instant">`
      : `<video preload="none" poster="${esc(url(s.thumb))}" ${have(s.clip) ? `src="${esc(url(s.clip))}"` : ""} controls playsinline></video>`}</div>
  ${EMBED && have(s.clip) ? `<a class="clip" href="${esc(url(s.clip))}" target="_blank" rel="noopener">▶ clip · ${(s.end - s.start).toFixed(1)}s</a>` : ""}
  ${have(s.strip) ? `<img class="strip" src="${esc(data(s.strip, 1000))}" alt="eight frames across the shot" loading="lazy">` : ""}
  <h3>${esc(h.label)} <small>${esc(s.title)}</small></h3>
  ${h.line ? `<p class="line">${esc(h.line)}</p>` : `<p class="line dim">— no line —</p>`}
  <dl>
    <dt>on the cut</dt><dd class="num">${tc(s.start)} → ${tc(s.end)} <span class="dim">· match ${tc(s.match)}</span></dd>
    <dt>scale</dt><dd>${esc(s.scale)}${h.scaleTruth && h.scaleTruth !== s.scale
      ? ` <span class="warn">CLIP · the film drew ${esc(h.scaleTruth)}</span>`
      : h.scaleTruth ? ` <span class="ok">agrees with the draw calls</span>` : ""}</dd>
    <dt>subjects</dt><dd>${s.subjects.length
      ? s.subjects.map(o => `${esc(o.label)} <span class="dim">${o.p}</span>`).join(" · ")
      : `<span class="dim">no figure — the frame is weather</span>`}</dd>
    <dt>colour</dt><dd class="pal">${s.palette.map(dot).join("")}<span class="num">lum ${s.lum} · sat ${s.sat}</span></dd>
    <dt>prosody</dt><dd>${esc(h.engine || "—")} <span class="dim">/</span> ${esc(h.mode || "—")}</dd>
    <dt>cineosis</dt><dd>${s.xy
      ? `xy ${s.xy[0]}, ${s.xy[1]} · sim ${s.sim} · top sign ${esc(s.aff_top?.[0]?.[0])} (${s.aff_top?.[0]?.[1]}%)`
      : `<span class="warn">xy · sim · affinity · aff_top not yet projected</span>`}</dd>
    <dt>id</dt><dd class="num dim">${esc(s.id)}</dd>
  </dl></article>`;
};

const withMedia = S.filter(s => have(s.clip)).length;
const projected = S.filter(s => s.xy).length;
const html = `<!doctype html><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Halfworld shots, in cineosis shape</title>
<style>
:root{color-scheme:dark;--bg:#0b0410;--paper:#f6e7c8;--dim:#8d6a70;--hot:#f2a03c;--acc:#e0532c;--edge:#2a1220;--ok:#7fd67f}
*{box-sizing:border-box}html,body{margin:0}
body{background:var(--bg);color:var(--paper);font:13px/1.55 ui-monospace,"SF Mono",Menlo,monospace;
  padding-inline:18px;padding-block:0 40px}
header{padding-block:18px 12px;border-bottom:1px solid var(--edge)}
h1{margin:0;font-size:15px;letter-spacing:.28em;color:var(--hot)}
.tally{margin-top:8px;color:var(--dim);display:flex;gap:16px;flex-wrap:wrap}
.tally b{color:var(--paper);font-weight:400}
.bar{display:flex;gap:6px;flex-wrap:wrap;padding-block:11px;border-bottom:1px solid var(--edge);
  position:sticky;top:env(safe-area-inset-top,0px);background:var(--bg);z-index:5}
button,input{font:inherit;color:var(--paper);background:#00000055;border:1px solid var(--edge);padding:5px 10px;cursor:pointer}
button:hover,button.on{border-color:var(--hot);color:var(--hot)}
input{cursor:text;flex:1;min-width:150px}
main{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,330px),1fr));gap:12px;padding-block:14px}
article{border:1px solid var(--edge);background:#00000038;padding:9px;min-width:0}
.pic{aspect-ratio:4/3;background:#190a1c;border:1px solid var(--edge)}
.pic video{width:100%;height:100%;object-fit:contain;display:block}
.none{display:grid;place-items:center;height:100%;color:var(--dim);font-size:11px}
.pic img{width:100%;height:100%;object-fit:contain;display:block}
.strip{display:block;width:100%;margin-top:5px;border:1px solid var(--edge)}
a.clip{display:block;margin-top:5px;padding:3px 7px;font-size:11px;text-decoration:none;
  color:var(--hot);border:1px solid var(--edge);text-align:center}
a.clip:hover{border-color:var(--hot);background:#ffb45418}
h3{margin:9px 0 3px;font-size:12.5px;font-weight:400;color:var(--hot);letter-spacing:.04em}
h3 small{color:var(--dim);letter-spacing:.02em}
.line{margin:0 0 8px;font-size:11.5px;line-height:1.5;color:var(--paper);opacity:.86}
.line.dim{color:var(--dim);opacity:1}
dl{display:grid;grid-template-columns:72px minmax(0,1fr);gap:2px 8px;margin:0;font-size:11px}
dt{color:var(--dim)}dd{margin:0;min-width:0;overflow-wrap:anywhere}
.num{font-variant-numeric:tabular-nums}
.dim{color:var(--dim)}.warn{color:var(--acc)}.ok{color:var(--ok)}
.pal i{display:inline-block;width:11px;height:11px;margin-right:2px;border:1px solid #0006;vertical-align:-1px}
.pal .num{margin-left:6px}
.hide{display:none}
footer{margin-top:22px;padding-top:14px;border-top:1px solid var(--edge);color:var(--dim);max-width:92ch}
footer b{color:var(--paper);font-weight:400}
</style>
<header><h1>HALFWORLD SHOTS · CINEOSIS SHAPE</h1>
<div class="tally">
  <span><b>${S.length}</b> shots</span>
  <span><b>${withMedia}</b> with clip, thumb and strip</span>
  <span><b>${projected}</b> projected into the archive's space</span>
  <span><b>${tc(S[0].start)} → ${tc(S[S.length - 1].end)}</b> on the cut's clock</span>
</div></header>
<div class="bar"><button class="on" data-f="">ALL</button>
${films.map(n => `<button data-f="${n}">${n}</button>`).join("")}
<input id="q" placeholder="search label, line, scale…"></div>
<main>${S.map(card).join("")}</main>
<footer>Every field here is either read off the film or taken from cineosis's own pipeline.
<b>Times</b> are on the cut's clock, converted per film so the 402 ms hole between NEVERMORE and
BLOODLINES is carried rather than averaged away. <b>Scale</b> and <b>subjects</b> are shown as CLIP
assigns them, with the film's own figure heights beside them where they disagree — the films drew the
bodies, so that column is ground truth and the other is a classifier. <b>xy, sim, affinity</b> are a
projection into the existing 15,149-shot map, never a fresh fit, and are marked absent until that
projection has run.</footer>
<script>
const q = document.getElementById("q"), cards = [...document.querySelectorAll("article")];
let film = "";
const apply = () => { const t = q.value.trim().toLowerCase();
  for (const c of cards) c.classList.toggle("hide",
    (film && c.dataset.f !== film) || (t && !c.dataset.q.includes(t))); };
q.addEventListener("input", apply);
for (const b of document.querySelectorAll(".bar button")) b.addEventListener("click", () => {
  document.querySelectorAll(".bar button").forEach(x => x.classList.toggle("on", x === b));
  film = b.dataset.f; apply(); });
</script>`;
fs.writeFileSync(path.join(OUT, "INDEX.html"), html);
console.log(`${S.length} shots · ${withMedia} with media · ${projected} projected`);
console.log(`→ renders/cineosis/INDEX.html`);
