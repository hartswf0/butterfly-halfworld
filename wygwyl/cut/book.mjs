/* ============================================================================
   book.mjs — THE CUT BOOK. A page you keep open while you edit.

   The analysis is a heap of numbers and a heap of numbers is not an edit. This
   is the reading desk: pick a song, see it as a picture, and AUDITION every
   proposed cut point before you trust it. That last part is the whole reason
   this exists — a cut point you have not heard is a guess with a timecode.

   AUDITION plays a second and a half either side of the point and drops the
   level in the middle, so you hear the approach and the landing with a hole
   where the cut would be. If the hole is invisible, the cut is free. If the
   music lurches, the sheet was right to score it.

   The map is drawn through the same ramp and the same 8x8 Bayer as every other
   picture in this project, because a page you look at for an hour should look
   like the thing you are cutting.
   ========================================================================= */
import { makePainter, energyToDisplay } from "../deep/paint.mjs";

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const fmt = (s) => { const m = Math.floor(s / 60); return `${m}:${(s - m * 60).toFixed(2).padStart(5, "0")}`; };
/* a timecode an editor can type into a timeline */
const tc = (s, fps = 24) => {
  const f = Math.round(s * fps), ff = f % fps, sec = Math.floor(f / fps);
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}:${String(ff).padStart(2, "0")}`;
};

const BOOKDATA = await fetch("data/book.json").then(r => r.json());
const audio = new Audio();
audio.preload = "metadata";
let SET = 0, SONG = 0, cutI = -1, audition = null, FPS = 24;

/* ---- the map --------------------------------------------------------------
   192 x 76: the spectrum on top, the energy envelope under it, then three
   rows of marks — sections, rests, and the cuts worth having. */
const MW = 192, MH = 76, CELL = 5;
const paint = makePainter($("map"), MW, MH, CELL);
const F = new Float32Array(MW * MH);
function drawMap() {
  const s = song();
  F.fill(0);
  const sp = s.spectrum, raw = Uint8Array.from(atob(sp.data), c => c.charCodeAt(0));
  for (let y = 0; y < sp.h; y++) for (let x = 0; x < MW; x++) F[y * MW + x] = raw[y * sp.w + x] / 15;
  const e0 = sp.h + 1;
  for (let x = 0; x < MW; x++) {
    const h = Math.round(s.envelope[x] * 16);
    for (let y = 0; y < h; y++) F[(e0 + 17 - y) * MW + x] = 0.75;
  }
  const col = (t) => clamp(Math.round(t / s.seconds * (MW - 1)), 0, MW - 1);
  for (const r of s.rests) {                                   // rests, as a band
    const a = col(r.t), b = col(r.t + r.dur);
    for (let x = a; x <= b; x++) for (let y = e0 + 19; y < e0 + 22; y++) F[y * MW + x] = 0.6;
  }
  for (const c of s.cuts) {
    if (c.kill > 0.20) continue;
    const x = col(c.t);
    for (let y = e0 + 23; y < MH - 1; y++) F[y * MW + x] = c.type === "SECTION" ? 1 : 0.8;
  }
  for (const sec of s.sections) { const x = col(sec.t); for (let y = 0; y < sp.h; y++) F[y * MW + x] = Math.max(F[y * MW + x], 0.95); }
  if (cutI >= 0 && free()[cutI]) { const x = col(free()[cutI].t); for (let y = 0; y < MH; y++) F[y * MW + x] = 1; }
  const D = new Float32Array(MW * MH);
  for (let i = 0; i < D.length; i++) D[i] = energyToDisplay(1 - F[i]);
  paint(D, audio.duration ? clamp(Math.round(audio.currentTime / s.seconds * (MW - 1)), 0, MW - 1) : -1);
}

const set = () => BOOKDATA.sets[SET];
const song = () => set().songs[SONG];
const free = () => song().cuts.filter(c => c.kill <= 0.20);

/* ---- AUDITION -------------------------------------------------------------
   Play the approach and the landing with the level dropped where the cut would
   be. You are not listening to the music, you are listening for whether the
   hole shows. */
function auditionAt(t) {
  const pre = 1.5, post = 1.5;
  clearAudition();
  audio.currentTime = Math.max(0, t - pre);
  audio.volume = 1;
  audio.play().catch(() => {});
  const step = () => {
    const d = audio.currentTime - t;
    audio.volume = Math.abs(d) < 0.09 ? 0.06 : 1;             // the hole
    if (d > post) { audio.pause(); audio.volume = 1; clearAudition(); return; }
    audition = requestAnimationFrame(step);
  };
  audition = requestAnimationFrame(step);
}
function clearAudition() { if (audition) cancelAnimationFrame(audition); audition = null; audio.volume = 1; }

/* ---- panels ---------------------------------------------------------------- */
function renderCuts() {
  const f = free(), s = song();
  $("cuts").innerHTML = f.length ? f.map((c, i) => `
    <button class="cut${i === cutI ? " on" : ""}" data-i="${i}">
      <b>${tc(c.t, FPS)}</b><i>${c.type}</i><u>${c.why || ""}</u>
    </button>`).join("")
    : `<div class="empty">no free cuts. this song has ${s.rest_seconds}s of rest in ${fmt(s.seconds)} —
       nothing opens by itself, so the cuts have to be motivated by picture or taken at the sections.</div>`;
  for (const b of $("cuts").querySelectorAll(".cut"))
    b.onclick = () => { cutI = +b.dataset.i; renderCuts(); auditionAt(free()[cutI].t); };
  const risky = song().cuts.filter(c => c.kill > 0.20);
  $("risky").textContent = `${risky.length} more candidates between 0.21 and 0.35 — grid beats and transients. `
    + `${song().cuts.filter(c => c.tail).length} of all candidates fall in a decaying tail.`;
}
function renderHead() {
  const s = song();
  $("title").textContent = `${set().name} · ${s.n}${s.title ? " · " + s.title : ""}`;
  $("sub").textContent = set().note;
  const flat = s.lra < 4.5, noGrid = s.conf < 0.30;
  $("nums").innerHTML = [
    ["length", fmt(s.seconds)],
    ["loudness", `${s.lufs} LUFS`],
    ["range", `${s.lra} LU${flat ? " — flat" : ""}`],
    ["tempo", `${s.bpm} BPM at ${(s.conf * 100).toFixed(0)}%${noGrid ? " — no grid" : ""}`],
    ["pulse", s.pulse ? `${s.pulse} band` : "none found"],
    ["events", `${s.onsets_per_min}/min`],
    ["rest", `${s.rest_seconds}s in ${fmt(s.seconds)}`],
    ["free cuts", String(free().length)],
  ].map(([k, v]) => `<i>${k}</i><span>${v}</span>`).join("");
  $("read").innerHTML = read(s);
}
/* the sentence an editor needs, not the numbers again */
function read(s) {
  const out = [];
  if (s.conf < 0.30) out.push(`<b>Do not cut this to a grid.</b> The tempo estimate is ${s.bpm} BPM at ${(s.conf * 100).toFixed(0)}% confidence, which means the autocorrelation barely stands above its own noise. Cut to the sections and the rests instead.`);
  else out.push(`A real pulse at <b>${s.bpm} BPM</b> (${(s.conf * 100).toFixed(0)}%). One beat is ${(s.period * 1000).toFixed(0)} ms — ${(s.period * FPS).toFixed(1)} frames at ${FPS} fps.`);
  if (s.lra < 4.5) out.push(`<b>Range ${s.lra} LU: the song has no dynamics of its own.</b> Every contrast has to come from the picture — scale changes and held frames, not more cuts.`);
  else if (s.lra > 12) out.push(`Range ${s.lra} LU — it breathes. Let the quiet parts stay quiet on screen too; do not fill them.`);
  if (s.rest_seconds < 1.5) out.push(`Only ${s.rest_seconds}s of rest in the whole track: <b>there is nowhere to hide a cut.</b> Anything you do will be heard as a decision, so make it one.`);
  if (s.pulse) out.push(`The pulse lives in the <b>${s.pulse}</b> band, so the picture change that answers it is a change of <b>${s.pulse === "sub" || s.pulse === "low" ? "weight — wide to close, dark to light" : s.pulse === "pres" || s.pulse === "air" ? "grain and texture, not weight" : "density"}</b>.`);
  out.push(`${s.sections.length} section boundar${s.sections.length === 1 ? "y" : "ies"} — the places the song already decided something changed.`);
  return out.map(t => `<p>${t}</p>`).join("");
}
function load() {
  cutI = -1; clearAudition();
  audio.src = song().audio;
  renderHead(); renderCuts(); drawMap();
  $("song").value = String(SONG);
}
function buildSelectors() {
  $("set").innerHTML = BOOKDATA.sets.map((s, i) => `<option value="${i}">${s.name} · ${s.songs.length}</option>`).join("");
  $("song").innerHTML = set().songs.map((s, i) => `<option value="${i}">${s.n}${s.title ? " " + s.title : ""}</option>`).join("");
  /* rewriting a select's innerHTML resets it to the first option, so the box
     said "transmission" while the page was showing onecut */
  $("set").value = String(SET);
  $("song").value = String(SONG);
}
$("set").onchange = () => { SET = +$("set").value; SONG = 0; buildSelectors(); load(); };
$("song").onchange = () => { SONG = +$("song").value; load(); };
$("fps").onchange = () => { FPS = +$("fps").value; renderCuts(); renderHead(); };
$("play").onclick = () => { clearAudition(); if (audio.paused) audio.play().catch(() => {}); else audio.pause(); };
$("map").onclick = (e) => {
  const r = $("map").getBoundingClientRect();
  clearAudition();
  audio.currentTime = (e.clientX - r.left) / r.width * song().seconds;
  audio.play().catch(() => {});
};
$("copy").onclick = async () => {
  const rows = free().map(c => `${tc(c.t, FPS)}\t${c.t.toFixed(3)}\t${c.type}\t${c.kill}`).join("\n");
  try { await navigator.clipboard.writeText(rows); $("copy").textContent = "COPIED"; setTimeout(() => ($("copy").textContent = "COPY CUTS"), 1200); }
  catch { $("copy").textContent = "BLOCKED"; }
};
addEventListener("keydown", (e) => {
  if (/INPUT|SELECT/.test(e.target.tagName)) return;
  const f = free();
  if (e.key === " ") { e.preventDefault(); $("play").click(); }
  if (e.key === "ArrowRight" && f.length) { cutI = clamp(cutI + 1, 0, f.length - 1); renderCuts(); auditionAt(f[cutI].t); }
  if (e.key === "ArrowLeft" && f.length) { cutI = clamp(cutI - 1, 0, f.length - 1); renderCuts(); auditionAt(f[cutI].t); }
  if (e.key === "ArrowDown") { SONG = (SONG + 1) % set().songs.length; load(); }
  if (e.key === "ArrowUp") { SONG = (SONG - 1 + set().songs.length) % set().songs.length; load(); }
});
audio.addEventListener("timeupdate", drawMap);
audio.addEventListener("play", () => ($("play").textContent = "◼ PAUSE"));
audio.addEventListener("pause", () => ($("play").textContent = "▶ PLAY"));

buildSelectors(); load();
setInterval(drawMap, 100);
window.__cutbook = () => ({ set: set().name, song: song().n, free: free().length, cut: cutI, t: audio.currentTime });
