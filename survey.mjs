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
import { execFileSync } from "node:child_process";

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf("--" + n); return i < 0 ? d : argv[i + 1]; };
const has = (n) => argv.includes("--" + n);
/* POINTABLE AT ANY REPOSITORY. --root walks somewhere else, --base rewrites
   every link to a published site so the survey works away from the files, and
   --embed inlines the covers as data URIs so it is one self-contained page. */
const ROOT = path.resolve(opt("root", process.cwd()));
const BASE = (opt("base", "") || "").replace(/\/+$/, "");
const EMBED = has("embed");
const OUTFILE = path.resolve(opt("out", path.join(ROOT, "SURVEY.html")));
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
/* A LINK TO A DIRECTORY IS A LINK TO ITS INDEX. This used to insist the href
   ended in `.html`, which misses the commonest way anyone links an index page:
   `href="lab/bets/"`. On cineosis-lab that one omission reported a nine-studio
   suite as nine orphans while the front page linked straight to it. So match
   any local href and resolve it the way a server does — a trailing slash, or a
   final segment with no dot, means `<dir>/index.html`. */
const resolveHref = (fromPage, href) => {
  if (/^(https?:|mailto:|tel:|data:|javascript:)/i.test(href) || href.startsWith("//")) return null;
  let h = href.split("#")[0].split("?")[0];
  if (!h) return null;
  const base = path.posix.dirname(fromPage);
  let t = path.posix.normalize(path.posix.join(base, h));
  if (h.endsWith("/") || !path.posix.basename(t).includes(".")) t = path.posix.join(t, "index.html");
  if (t.startsWith("/")) t = t.slice(1);
  return t.endsWith(".html") ? t : null;
};
for (const p of pages) {
  let txt = ""; try { txt = fs.readFileSync(path.join(ROOT, p), "utf8"); } catch (_) { continue; }
  for (const m of txt.matchAll(/href\s*=\s*["']([^"']+)["']/g)) {
    const t = resolveHref(p, m[1]);
    if (t && pset.has(t)) { out.get(p).add(t); inb.get(t).add(p); }
  }
  /* a page can also be named in a sibling script or manifest, which a static
     href scan never sees — that is how the film shells looked orphaned when
     they are not */
}
const mentionedElsewhere = new Set();
const nonHtml = files.filter(f => /\.(mjs|js|json|md|csv)$/i.test(f));
const blobs = new Map();
for (const f of nonHtml) { try { blobs.set(f, fs.readFileSync(path.join(ROOT, f), "utf8")); } catch (_) {} }
/* AND THE SCRIPT INSIDE THE PAGE. These are single-file apps: cineosis-lab's
   bets index routes its nine studios from a JS array, not from nine hrefs, so
   a scan of separate .js files finds nothing and all nine read as lost. The
   inline <script> of a page is a manifest like any other — read it as one. Only
   the script, never the markup, or a page linked solely from an orphan would
   get promoted and the distinction this survey draws would mean nothing. */
for (const p of pages) {
  try {
    const txt = fs.readFileSync(path.join(ROOT, p), "utf8");
    const js = [...txt.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]).join("\n");
    if (js.trim()) blobs.set(p + "#script", js);
  } catch (_) {}
}
/* ONE PASS PER BLOB, NOT ONE PER BLOB PER PAGE. This used to ask, for every
   page, whether every blob contained its name. cineosis-lab's lab-data.json is
   26 MB, so 61 pages meant scanning a gigabyte and a half of JSON and the
   survey never finished. Instead: sweep each blob once for anything shaped like
   a page name, and keep which blob named it. Same answer, linear. */
const namedIn = new Map();     // basename → set of blobs that mention it
for (const [f, txt] of blobs) {
  for (const m of txt.matchAll(/[\w.\-]+\.html/g)) {
    const b = m[0];
    if (!namedIn.has(b)) namedIn.set(b, new Set());
    namedIn.get(b).add(f);
  }
}
for (const p of pages) {
  const b = path.basename(p);
  if (b === "index.html") continue;
  const where = namedIn.get(b);
  if (!where) continue;
  for (const f of where) {
    if (f === p || f === p + "#script") continue;   // a page naming itself is not a link
    mentionedElsewhere.add(p); break;
  }
}
const ROOTS = ["index.html", "wygwyl/index.html"].filter(r => pset.has(r));
const reach = new Set(); const stack = [...ROOTS];
while (stack.length) { const c = stack.pop(); if (reach.has(c)) continue; reach.add(c); stack.push(...out.get(c)); }

/* ---- what each folder holds ----------------------------------------------- */
/* ONE stat PER FILE, NOT ONE PER FILE PER PAGE. folder() was summing sizes with
   a statSync inside a filter over every file in the repository, for every page:
   on cineosis-lab's 12,000 files that is three quarters of a million syscalls
   and the survey stopped finishing. Stat everything once, up front. */
const SIZE = new Map();
for (const f of files) { try { SIZE.set(f, fs.statSync(path.join(ROOT, f)).size); } catch (_) { SIZE.set(f, 0); } }
const BYDIR = new Map();
for (const f of files) { const d = path.posix.dirname(f); if (!BYDIR.has(d)) BYDIR.set(d, []); BYDIR.get(d).push(f); }
const under = (dir) => { const acc = [];
  for (const [d, fl] of BYDIR) if (d === dir || d.startsWith(dir + "/")) acc.push(...fl);
  return acc; };
function folder(dir) {
  const inside = under(dir);
  const img = inside.filter(f => IMG.test(f) && !f.endsWith(".svg"));
  return {
    files: inside.length,
    img: img.length,
    vid: inside.filter(f => VID.test(f)).length,
    aud: inside.filter(f => AUD.test(f)).length,
    md: inside.filter(f => f.endsWith(".md")).length,
    bytes: inside.reduce((a, f) => a + (SIZE.get(f) || 0), 0),
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
const pimg = new Set(allImg);

/* A POSTER FOR THE FOLDERS THAT ARE ONLY VIDEO. DRESS, INHABIT, PREVIS,
   TEXTULE and THE LOOM hold nothing but mp4s, so they had no cover at all —
   and they are exactly the video versions this survey exists to show. One
   frame is pulled from each, two seconds in, and cached in `survey-covers/`
   so a re-run costs nothing. */
/* ffmpeg lives next to THIS SCRIPT, not necessarily under the repository being
   surveyed — pointing --root at another project found no binary and silently
   dropped every poster frame. Try the surveyed root first, then our own. */
const FF = (() => {
  const here = path.dirname(new URL(import.meta.url).pathname);
  for (const base of [ROOT, here, path.join(here, "..")]) {
    const p = path.join(base, "node_modules", "ffmpeg-static", "ffmpeg");
    try { if (fs.existsSync(p)) return fs.realpathSync(p); } catch (_) {}
  }
  return null;
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
/* AND FAILING THAT, A PICTURE THE PAGE ITSELF NAMES. Stem matching only works
   where the frames are named after the page, which is this archive's habit and
   nobody else's: on cineosis-lab, whose 9,219 images sit in four central
   folders, it found nothing and the survey came out as a page of grey boxes —
   the one thing it must not be, since the whole claim is that you can tell the
   experiments apart at a glance. A page's own markup and script name the
   pictures it draws. Take the first that exists on disk. */
const imgDirs = (() => { const m = new Map();
  for (const f of allImg) { const d = path.posix.dirname(f); (m.get(d) || m.set(d, []).get(d)).push(f); }
  for (const v of m.values()) v.sort(); return m; })();
/* A STABLE PICK, so a re-run gives the same page the same picture. */
const pick = (list, key) => { let h = 2166136261;
  for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
  return list[(h >>> 0) % list.length]; };
function referenced(p) {
  let txt = ""; try { txt = fs.readFileSync(path.join(ROOT, p), "utf8"); } catch (_) { return null; }
  const base = path.posix.dirname(p);
  const abs = (h) => { let t = path.posix.normalize(path.posix.join(base, h.split("#")[0].split("?")[0]));
    return t.startsWith("/") ? t.slice(1) : t; };
  /* first choice: a whole path the page spells out */
  for (const m of txt.matchAll(/["'`]([^"'`\s>${}]+\.(?:png|webp|jpe?g|gif))["'`]/gi)) {
    if (/^(https?:)?\/\//.test(m[1]) || m[1].startsWith("data:")) continue;
    const t = abs(m[1]); if (pimg.has(t)) return t;
  }
  /* second: THE FOLDER IT DRAWS FROM. These pages build their paths —
     `thumbs/${id}.webp` — so no literal ever names a file, but the literal does
     name the directory, and which archive a page works on is itself the thing
     worth seeing: a page over `thumbs/` is about shots, one over `cutouts/` is
     about figures. One image from that folder, chosen by a hash of the page
     name so it is stable and so sibling pages do not all show the same frame. */
  /* No regex here on purpose: the obvious pattern for "a quoted string ending
     in an image extension" needs two lazy quantifiers and backtracks
     catastrophically on a 400 KB single-file app — it did not finish. Find each
     extension, walk back to the quote, keep the directory part. */
  const EXT = /\.(?:png|webp|jpe?g|gif)\b/gi;
  for (let m; (m = EXT.exec(txt));) {
    let i = m.index;
    while (i > 0 && !`"'\`<>`.includes(txt[i - 1]) && !/\s/.test(txt[i - 1])) i--;
    const frag = txt.slice(i, m.index);
    const cut = frag.lastIndexOf("/");
    if (cut <= 0) continue;
    const dir = frag.slice(0, cut);
    if (/^(https?:)?\/\//.test(dir) || dir.includes("data:")) continue;
    const list = imgDirs.get(abs(dir));
    if (list && list.length) return { src: pick(list, p), from: abs(dir) };
  }
  /* third, and clearly marked as such: these pages take their picture paths out
     of the data they load, so nothing in the source names an image at all.
     cineosis-lab's 61 pages produced 59 grey boxes. The archive a page sits
     above is still real information — a page over `thumbs/` works on shots, one
     over `cutouts/` on figures — so sample it, and say in the card that this is
     a sample from that archive and not the page's own output. A borrowed
     picture passed off as the page's own would make the survey lie. */
  let best = null;
  for (const [d, list] of imgDirs) {
    if (d !== base && !d.startsWith(base + "/")) continue;
    if (!best || list.length > best[1].length) best = [d, list];
  }
  return best ? { src: pick(best[1], p), from: best[0], sampled: true } : null;
}
function coverFor(p) {
  const stem = path.basename(p, ".html");
  if (stem.length >= 4) {
    const hits = allImg.filter(f => path.basename(f).includes(stem));
    /* prefer a frame from the archive over a QA render */
    if (hits.length) {
      hits.sort((a, b) => (a.includes("MARKOV") ? -1 : 1) - (b.includes("MARKOV") ? -1 : 1) || a.localeCompare(b));
      return { src: hits[0] };
    }
  }
  return referenced(p);
}

/* WHAT MAKES THIS ONE DIFFERENT FROM THE OTHERS. A title alone says DRESS and
   PREVIS and THE LOOM and tells you nothing — these pages all carry their own
   statement of intent in the first lines of the body, and that is the thing
   worth surfacing: "the archive fitted to the halfworld, and held there",
   "the halfworld blocks it, the archive fills it", "a weave that moves".
   Style and script are stripped first or the first text found is CSS. */
const ENT = { "&mdash;": "—", "&ndash;": "–", "&amp;": "&", "&lt;": "<", "&gt;": ">",
  "&rsquo;": "\u2019", "&lsquo;": "\u2018", "&rdquo;": "\u201d", "&ldquo;": "\u201c",
  "&middot;": "·", "&nbsp;": " ", "&quot;": '"', "&rarr;": "→", "&times;": "×" };
const deent = (t) => t.replace(/&[a-z]+;|&#\d+;/gi, (m) => ENT[m.toLowerCase()] ?? m);
function describe(p) {
  let txt = ""; try { txt = fs.readFileSync(path.join(ROOT, p), "utf8"); } catch (_) { return {}; }
  const title = deent((txt.match(/<title>([^<]*)</) || [, ""])[1]).trim();
  const body = txt.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "").replace(/<!--[\s\S]*?-->/g, "");
  const lines = body.replace(/<[^>]+>/g, "\n").split("\n")
    .map(l => deent(l).replace(/\s+/g, " ").trim()).filter(l => l.length > 3);
  const norm = (x) => x.toLowerCase().replace(/[^a-z0-9]/g, "");
  /* the headline is often the title again with a subtitle welded on */
  let sub = "", prose = "";
  for (const l of lines.slice(0, 8)) {
    if (!sub && norm(l) !== norm(title) && norm(l).startsWith(norm(title).slice(0, 6)) && l.length > title.length + 4) {
      sub = l.replace(/^[^—–-]*[—–-]\s*/, "").trim(); continue;
    }
    if (!prose && l.length > 34 && norm(l) !== norm(title) && /[a-z]{3}/.test(l) && !/^[A-Z0-9 ·—/]+$/.test(l)) prose = l;
  }
  return { title: title || path.basename(p, ".html"), sub, prose };
}

/* WHEN A PAGE SAYS NOTHING ABOUT ITSELF. The nine bet studios are apps: their
   markup is controls, so describe() finds no prose and the cards came out as a
   title and nothing else — which is the one thing this survey promises not to
   do. But a hub almost always describes its children where it lists them, and
   cineosis-lab's bets index is exactly that: `['P4','audition.html','Audition',
   'choosing is the work']`. So look where the page is named and take the
   longest quoted phrase just after it. General, because a manifest that names a
   page and then says what it is, is the normal shape of a manifest. */
function fromParent(p) {
  const b = path.basename(p);
  const where = namedIn.get(b);
  if (!where) return "";
  for (const f of where) {
    if (f === p || f === p + "#script") continue;
    const txt = blobs.get(f); if (!txt) continue;
    const i = txt.indexOf(b); if (i < 0) continue;
    /* STOP AT THE END OF THE RECORD. A fixed-width window ran straight past the
       closing bracket into the next entry, and because it then took the longest
       quoted phrase it found, Concordance was captioned with Voice Clock's line
       — a caption that reads perfectly and is about a different page. Cut the
       window at the first thing that ends a record. */
    const tail = txt.slice(i + b.length, i + b.length + 400);
    const end = tail.search(/[\]}\n]|<\/a>|<\/li>/);
    const win = end > 0 ? tail.slice(0, end) : tail;
    let best = "";
    for (const m of win.matchAll(/["'`]([^"'`\n]{12,90})["'`]/g)) {
      const v = m[1].trim();
      if (/\.(html|js|mjs|json|png|webp|jpe?g|mp4)$/i.test(v)) continue;
      if (!/[a-z]{3}/.test(v) || /[{}<>;=]/.test(v)) continue;
      if (v.length > best.length) best = v;
    }
    if (best) return best;
  }
  return "";
}
const title = (p) => describe(p).title;

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
/* AND WHEN THE REPOSITORY IS NOT THIS ONE. Those four groups are this repo's
   shape, so pointing --root anywhere else drops all 61 of cineosis-lab's pages
   into EVERYTHING ELSE — one undifferentiated wall, which is the opposite of
   what a survey is for. Any repository already states its own shape in its
   directories, so derive the rest of the groups from those: a folder holding
   two or more pages becomes a section, named after itself, ordered by size. The
   hand-written groups still win wherever they match, because their notes say
   something a directory name cannot. */
function deriveGroups(unclaimed) {
  const by = new Map();
  for (const p of unclaimed) {
    const seg = p.includes("/") ? p.slice(0, p.indexOf("/")) : "";
    const sub = seg && p.slice(seg.length + 1).includes("/")
      ? p.slice(0, p.indexOf("/", seg.length + 1)) : seg;
    const key = sub || "";
    if (!by.has(key)) by.set(key, []);
    by.get(key).push(p);
  }
  /* deepest first: GROUPS.find takes the first test that matches, so a shallow
     `lab` listed before `lab/bets` swallows the whole repository into one
     section — which is exactly what it did. */
  const depth = (d) => d.split("/").length;
  const made = [];
  for (const [dir, ps] of [...by].sort((a, b) => depth(b[0]) - depth(a[0]) || b[1].length - a[1].length)) {
    if (!dir || ps.length < 2) continue;
    made.push({ id: "d:" + dir, name: dir.toUpperCase().replace(/[/_-]+/g, " · "),
      note: "", test: (p) => p === dir || p.startsWith(dir + "/") });
  }
  return made;
}
{
  const claimed = new Set();
  for (const g of GROUPS) if (g.id !== "rest") for (const p of pages) if (g.test(p)) claimed.add(p);
  const rest = pages.filter(p => !claimed.has(p));
  GROUPS.splice(GROUPS.length - 1, 0, ...deriveGroups(rest));
  GROUPS[GROUPS.length - 1].name = "LOOSE PAGES";
  GROUPS[GROUPS.length - 1].note = "at the top level, or alone in a folder";
}

const entries = pages.map(p => {
  const dir = path.posix.dirname(p);
  const isIdx = path.basename(p) === "index.html";
  const f = isIdx ? folder(dir) : null;
  return {
    path: p, dir, ...(() => { const d = describe(p);
      if (!d.sub && !d.prose) d.prose = fromParent(p);
      return d; })(),
    reachable: reach.has(p), mentioned: mentionedElsewhere.has(p),
    inbound: [...inb.get(p)], outbound: out.get(p).size,
    isIndex: isIdx, hold: f, ...(() => { const c = (f && f.cover) ? { src: f.cover } : coverFor(p);
      return { cover: c && c.src, sampled: !!(c && c.sampled), coverFrom: c && c.from }; })(),
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
  bytes: files.reduce((a, f) => a + (SIZE.get(f) || 0), 0),
};
const mb = (b) => b > 1 << 30 ? (b / (1 << 30)).toFixed(1) + " GB" : (b / (1 << 20)).toFixed(0) + " MB";

/* ---- print ---------------------------------------------------------------- */
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* ONE SELF-CONTAINED PAGE. --embed downscales each cover to 300px and inlines
   it, so the survey can be published, mailed or opened from anywhere without
   the repository underneath it. Twenty-six covers come to well under a
   megabyte; the originals are up to several each. */
const dataCache = new Map();
function src(rel) {
  if (!rel) return null;
  if (!EMBED) return BASE ? `${BASE}/${rel}` : rel;
  if (dataCache.has(rel)) return dataCache.get(rel);
  let uri = null;
  try {
    const tmp = path.join(ROOT, ".survey-tmp.jpg");
    const r = spawnSync(FF, ["-v", "error", "-y", "-i", path.join(ROOT, rel),
      "-vf", "scale=300:-2", "-q:v", "7", tmp], { timeout: 30000 });
    if (r.status === 0 && fs.existsSync(tmp)) {
      uri = "data:image/jpeg;base64," + fs.readFileSync(tmp).toString("base64");
      fs.unlinkSync(tmp);
    }
  } catch (_) {}
  dataCache.set(rel, uri);
  return uri;
}
const href = (p) => BASE ? `${BASE}/${p}` : p;
const card = (e) => {
  const h = e.hold;
  const bits = h ? [h.img && `${h.img} img`, h.vid && `${h.vid} vid`, h.aud && `${h.aud} audio`, h.md && `${h.md} notes`].filter(Boolean).join(" · ") : "";
  const cv = src(e.cover);
  const line = e.sub || e.prose || "";
  return `<a class="c${e.reachable ? "" : e.mentioned ? " loose" : " orphan"}" href="${esc(href(e.path))}" target="_blank" rel="noopener"
     data-g="${e.group}" data-s="${e.reachable ? "linked" : e.mentioned ? "loose" : "orphan"}"
     data-q="${esc((e.title + " " + line + " " + e.dir).toLowerCase())}">
    ${cv ? `<figure><img loading="lazy" src="${cv}" alt="">${e.sampled
        ? `<figcaption>sample from ${esc(e.coverFrom || "")} — not this page's output</figcaption>` : ""}</figure>`
      : `<span class="noimg"></span>`}
    <b>${esc(e.title)}</b>
    ${line ? `<s>${esc(line.slice(0, 150))}</s>` : ""}
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
/* --bare drops the document head: a published artifact supplies its own
   doctype, charset and viewport, and duplicating them is how a page ends up
   with two viewport metas disagreeing about scale. */
const BARE = has("bare");
const TITLE = opt("title", BARE ? "Halfworld Survey" : "SURVEY — everything in this repository, and what points at it");
const html = `${BARE ? "" : `<!doctype html>
<meta charset="utf-8">`}
<title>${esc(TITLE)}</title>
${BARE ? "" : `<link rel="icon" href="wygwyl/dot.svg">
<meta name="viewport" content="width=device-width,initial-scale=1">`}
<style>
  /* one deliberate dark world — the instrument panel the rest of this project
     is printed in — so the theme is committed rather than omitted */
  :root{color-scheme:dark;
        --bg:#0b0410;--paper:#f6e7c8;--dim:#8d6a70;--hot:#f2a03c;--acc:#e0532c;--edge:#2a1220;--good:#7fd67f}
  *{box-sizing:border-box}html,body{margin:0;min-height:100%}
  body{background:radial-gradient(120% 90% at 50% -10%,#3a1430 0%,#1b0817 45%,#0b0410 100%);
       color:var(--paper);font:12.5px/1.55 ui-monospace,"SF Mono",Menlo,monospace}
  header{padding-block:16px 12px;padding-inline:20px;border-bottom:1px solid var(--edge)}
  h1{margin:0;font-size:15px;letter-spacing:.30em;color:var(--hot)}
  .tally{margin-top:7px;color:var(--dim);display:flex;gap:16px;flex-wrap:wrap}
  .tally b{color:var(--paper);font-weight:400}
  .tally b.bad{color:var(--acc)}
  .filters{display:flex;gap:6px;flex-wrap:wrap;padding-block:11px;padding-inline:20px;border-bottom:1px solid var(--edge);position:sticky;top:env(safe-area-inset-top,0px);background:var(--bg);z-index:5}
  button{font:inherit;color:var(--paper);background:#00000055;border:1px solid var(--edge);
         border-radius:2px;padding:5px 10px;cursor:pointer;letter-spacing:.06em}
  button:hover{border-color:var(--hot);color:var(--hot)}
  button.on{background:#ffb45418;border-color:var(--hot);color:var(--hot)}
  main{padding-block:4px 30px;padding-inline:20px}
  section{margin:22px 0}
  h2{font-size:11px;letter-spacing:.26em;color:var(--paper);font-weight:600;margin:0 0 3px;
     border-bottom:1px solid var(--edge);padding-bottom:6px}
  h2 span{color:var(--dim);letter-spacing:.06em;font-weight:400;margin-left:8px}
  .note{color:var(--dim);margin:6px 0 11px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,190px),1fr));gap:10px}
  .c{min-width:0}
  .c{display:block;text-decoration:none;color:inherit;border:1px solid var(--edge);
     background:#00000038;padding:8px;transition:border-color .12s}
  .c:hover{border-color:var(--hot)}
  .c figure{margin:0;position:relative}
  .c figcaption{position:absolute;left:0;right:0;bottom:0;background:#120a16e8;color:#9b8ea6;
    font:400 9.5px/1.35 ui-monospace,Menlo,monospace;padding:3px 5px;letter-spacing:.02em}
  .c img,.noimg{display:block;width:100%;aspect-ratio:4/3;object-fit:cover;background:#190a1c;
     border:1px solid var(--edge);margin-bottom:7px;image-rendering:auto}
  .c b{display:block;font-weight:400;font-size:12.5px;color:var(--hot);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .c s{display:block;text-decoration:none;color:var(--paper);font-size:11px;line-height:1.4;margin:3px 0 4px;
       display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
  .c i{display:block;font-style:normal;color:var(--dim);font-size:10.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .c u{display:block;text-decoration:none;color:var(--hot);font-size:10.5px;margin-top:3px}
  .c em{display:block;font-style:normal;color:var(--acc);font-size:10.5px;margin-top:4px}
  .c.loose em{color:var(--dim)}
  .c.orphan{border-color:#5a2018}
  footer{padding-block:14px 30px;padding-inline:20px;border-top:1px solid var(--edge);color:var(--dim);max-width:96ch}
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
  <input id="q" placeholder="search titles, descriptions, paths…" style="flex:1;min-width:170px;font:inherit;color:var(--paper);background:#00000055;border:1px solid var(--edge);padding:5px 10px;border-radius:2px">
  ${GROUPS.filter(g => entries.some(e => e.group === g.id))
      .map(g => `<button data-g="${g.id}">${g.name}</button>`).join("")}
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
  let q = "";
  const apply = () => {
    for (const c of cards) {
      const okF = f === "all" || c.dataset.s === f;
      const okG = !g || c.dataset.g === g;
      const okQ = !q || c.dataset.q.includes(q);
      c.classList.toggle("hide", !(okF && okG && okQ));
    }
    for (const s of document.querySelectorAll("section"))
      s.classList.toggle("hide", ![...s.querySelectorAll(".c")].some(c => !c.classList.contains("hide")));
  };
  document.getElementById("q").oninput = (e) => { q = e.target.value.trim().toLowerCase(); apply(); };
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
fs.mkdirSync(path.dirname(OUTFILE), { recursive: true });
fs.writeFileSync(OUTFILE, html);
console.log(`${totals.pages} pages · ${totals.reachable} reachable · ${totals.orphans} orphaned`);
console.log(`${totals.img.toLocaleString()} images · ${totals.vid} videos · ${totals.aud} audio · ${mb(totals.bytes)}`);
console.log("\norphans:");
for (const o of orphans) console.log(`  ${o.path}${o.title ? "  — " + o.title : ""}`);
console.log(`\n→ ${path.relative(process.cwd(), OUTFILE)}  ${(fs.statSync(OUTFILE).size / 1024).toFixed(0)} KB`);
