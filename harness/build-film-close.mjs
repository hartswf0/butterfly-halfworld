#!/usr/bin/env node
/* ============================================================================
   build-film-close.mjs — THE SPEAKING CUT.

   The same film, on the same clock, with one change: whenever someone who is
   in the room says something, the picture goes to their face.

   ---------------------------------------------------------------------------
   THE CONSTRAINT THAT MAKES THIS SAFE.

       THE SOUND IS NOT REBUILT. NOT ONE SAMPLE MOVES.

   audio/master.wav is reused exactly as the wide cut mixed it, and every scene
   keeps the duration film/cut.json gave it. Only the PICTURE inside each scene
   changes. That means drift cannot be introduced by this file — it is not
   arithmetic that happens to come out even, it is a quantity this program has
   no way to alter. The last builder that rebuilt both clocks in parallel put
   the picture 74 seconds away from the sound, and the fix then was the same
   idea as the rule here: one clock, computed once, obeyed by everything.

   So a scene of length D is no longer one looping shot of length D. It is a
   TIMELINE of length D:

       0 ─── wide loop ─── close-up ─ close-up ─── wide loop ─── D
                          ^ Niko      ^ Mara

   and the close-ups sit at the absolute times their voices already occupy in
   the master. Those times are recoverable exactly, because the mixer laid the
   takes by a rule this file re-runs rather than guesses:

       take k starts at  Σ(durations of takes before it) + k · TAKE_GAP

   ---------------------------------------------------------------------------
   WHAT STAYS WIDE, AND WHY IT IS NOT LAZINESS.

     · every scene with no dialogue at all — most of the film's images
     · the framing cards
     · voice-over and off-screen lines. A close-up asserts that a body is in
       the room making this sound. For VO, (V.O.) and (O.S.) that assertion is
       false, and in a film whose subject is testimony from a witness that
       cannot be corroborated, putting a face on an unverifiable voice is the
       one lie the film cannot afford. Iona's twenty-nine second voice-over in
       BF-13 is the longest single speech in the picture and it never shows her.

     node harness/build-film-close.mjs            build film/BUTTERFLY-CLOSE.mp4
     node harness/build-film-close.mjs --plan     print the timeline, build nothing
   ========================================================================= */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const FILM = path.join(ROOT, "film");
const CUT = JSON.parse(fs.readFileSync(path.join(FILM, "cut.json"), "utf8"));
const CLOSE = JSON.parse(fs.readFileSync(path.join(FILM, "closeups.json"), "utf8"));
const TAKES = JSON.parse(fs.readFileSync(path.join(ROOT, "audio", "line-timing.json"), "utf8"));
const PLAN_ONLY = process.argv.includes("--plan");
const FPS = CUT.fps || 12;
const TAKE_GAP = 0.5;                     // must match build-film.mjs' mixer
const MIN_WIDE = 0.30;                    // shorter than this is a flash frame
const LEAD = 1.50;                        // a scene would like to show its room first
const LEAD_MIN = 0.60;                    // ...but a lead this short is a flash frame, not a shot

const FF = ["/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg"].find((p) => fs.existsSync(p));
if (!FF) { console.error("no ffmpeg found"); process.exit(1); }
const FFPROBE = FF.replace(/ffmpeg$/, "ffprobe");
const dur = (f) => { try { return parseFloat(execFileSync(FFPROBE, ["-v", "error", "-show_entries",
  "format=duration", "-of", "default=nw=1:nk=1", f], { encoding: "utf8" }).trim()); } catch { return null; } };

/* ---- where each take starts inside its scene ---------------------------- */
const takesBy = {};
for (const t of TAKES.takes) (takesBy[t.scene] ||= []).push(t);
const takeStart = {};
for (const [scene, list] of Object.entries(takesBy)) {
  let off = 0;
  for (const t of list) { takeStart[t.id] = off; off += t.duration + TAKE_GAP; }
}
const unitsBy = {};
for (const u of CLOSE.units) if (u.face) (unitsBy[u.scene] ||= []).push(u);

/* ---- the timeline ------------------------------------------------------- */
const segs = [];                          // { src, in, out, kind, label }
let clock = 0, nClose = 0, nWide = 0, closeSec = 0, dropped = [], shortLead = [];
const perScene = [];

for (const sc of CUT.scenes) {
  const D = sc.duration;
  const wide = path.join(ROOT, "renders", "motion", `${sc.id}.webm`);
  const units = (unitsBy[sc.id] || [])
    .map((u) => ({ ...u, abs0: takeStart[u.take] + u.t0, abs1: takeStart[u.take] + u.t1 }))
    .filter((u) => {
      const src = path.join(ROOT, u.src);
      if (!fs.existsSync(src)) { dropped.push(`${u.id} — no render`); return false; }
      if (u.abs1 > D + 0.05) { dropped.push(`${u.id} — runs past the scene end (${u.abs1.toFixed(2)} > ${D})`); return false; }
      return true;
    })
    .sort((a, b) => a.abs0 - b.abs0);

  /* THE LEAD-IN. A scene whose first take starts at zero opens ON a face, and
     the wide shot — the room, the apparatus, the thing the dialogue is about —
     arrives only after the conversation is over. That is establishing a place
     by showing it last.

     The fix costs nothing because every run carries a HANDLE of recorded
     silence before its first word. Push the first close-up later and start the
     clip further in by the same amount: the mouth still lands on the syllable
     it landed on before, because both sides moved together. The trim is capped
     at the handle, so it can never eat into speech — a scene with no silence to
     spare simply gets a shorter lead, and says so. */
  if (units.length && units[0].abs0 < LEAD) {
    const u = units[0];
    const want = LEAD - u.abs0;
    const can = Math.min(want, u.head || 0, u.seconds - 0.4);
    /* PASS 2. Taking whatever was available produced twenty-seven leads of
       between 0.20s and 0.46s — two to five frames of room — and twenty new
       sub-quarter-second wide slivers elsewhere in the cut. A three-frame
       establishing shot does not establish anything; it reads as a fault in the
       projector, which is the exact defect the handles were introduced to
       remove. So a lead is taken only if it is worth taking. */
    if (can >= LEAD_MIN) { u.skip = +can.toFixed(3); u.abs0 = +(u.abs0 + can).toFixed(3); }
    else shortLead.push(`${sc.id} — only ${can.toFixed(2)}s available; opens on the face`);
  }

  const local = [];
  let t = 0;
  for (const u of units) {
    const gap = u.abs0 - t;
    // a wide beat shorter than MIN_WIDE is a flash frame; give it to the
    // close-up in front of it rather than cutting twice for four frames
    if (gap >= MIN_WIDE) local.push({ src: wide, in: t, out: u.abs0, kind: "wide", label: sc.id, loop: true });
    else if (gap > 0) local.push({ src: wide, in: t, out: u.abs0, kind: "wide", label: sc.id, loop: true, thin: true });
    local.push({ src: path.join(ROOT, u.src), in: u.abs0, out: Math.min(D, u.abs1),
                 kind: "close", label: `${u.who} · ${u.id}`, loop: false, skip: u.skip || 0 });
    t = Math.min(D, u.abs1);
  }
  if (t < D - 0.001) local.push({ src: wide, in: t, out: D, kind: "wide", label: sc.id, loop: true });

  for (const s of local) {
    s.t0 = clock + s.in; s.t1 = clock + s.out; s.seconds = +(s.out - s.in).toFixed(3);
    if (s.kind === "close") { nClose++; closeSec += s.seconds; } else nWide++;
    segs.push(s);
  }
  perScene.push({ id: sc.id, D, close: local.filter((s) => s.kind === "close").length });
  clock += D;
}

/* ---- report ------------------------------------------------------------- */
console.log(`THE SPEAKING CUT\n`);
console.log(`  ${CUT.scenes.length} scenes · ${(clock / 60).toFixed(2)} min — the same length as the wide cut`);
console.log(`  ${nClose} close-ups · ${(closeSec / 60).toFixed(2)} min of face (${(100 * closeSec / clock).toFixed(1)}% of the film)`);
console.log(`  ${nWide} wide passages · ${segs.length} cuts in total`);
const thin = segs.filter((s) => s.thin);
if (thin.length) console.log(`  ${thin.length} wide beats under ${MIN_WIDE}s were kept anyway (they sit between takes, not inside one)`);
if (dropped.length) { console.log(`\n  ** ${dropped.length} close-ups DROPPED:`); for (const d of dropped) console.log(`      ${d}`); }
const led = segs.filter((s) => s.skip);
if (led.length) console.log(`  ${led.length} scenes open on the room first, trimming into the shot's own silence`);
if (shortLead.length) console.log(`  ${shortLead.length} dialogue scenes open ON the speaker — their first word lands at t=0 ` +
  `and buying a lead would mean moving the sound, which this file will not do`);
const busiest = perScene.filter((s) => s.close).sort((a, b) => b.close - a.close).slice(0, 5);
console.log(`\n  busiest scenes: ${busiest.map((s) => `${s.id}×${s.close}`).join("  ")}`);

fs.writeFileSync(path.join(FILM, "close-cut.json"), JSON.stringify({
  built: new Date().toISOString(), totalSeconds: +clock.toFixed(3),
  closeSeconds: +closeSec.toFixed(2), cuts: segs.length, dropped,
  segments: segs.map((s) => ({ t0: +s.t0.toFixed(3), seconds: s.seconds, kind: s.kind, label: s.label })),
}, null, 1));

if (PLAN_ONLY) {
  console.log(`\n  TIMELINE\n`);
  let last = null;
  for (const s of segs.slice(0, 60)) {
    const mm = String(Math.floor(s.t0 / 60)).padStart(2, "0"), ss = (s.t0 % 60).toFixed(1).padStart(4, "0");
    if (s.label.split(" · ")[0] !== last) console.log(`  ${mm}:${ss}  ${s.kind === "close" ? "CLOSE" : " wide"}  ${s.label}  (${s.seconds}s)`);
    last = s.kind === "close" ? s.label.split(" · ")[0] : null;
  }
  console.log(`\n  wrote film/close-cut.json (${segs.length} segments) — no video built`);
  process.exit(0);
}

/* ---- ONE FRAME GRID -----------------------------------------------------
   The first build came out 0.912s longer in picture than in sound, and the
   arithmetic is not subtle: 139 segments, each handed to ffmpeg as a duration
   in seconds and each rounding UP to the next whole frame. A twelfth of a
   second, 139 times, mostly in the same direction.

   The consequence is worse than a long file. The error ACCUMULATES, so a cut
   near the end lands most of a second after the voice it belongs to — which is
   precisely the failure this entire cut exists to remove, arriving through the
   back door at assembly time after the lip-sync itself was made exact.

   So durations are not computed per segment at all. Every boundary is snapped
   ONCE to the global frame grid and each segment is given the INTEGER NUMBER
   OF FRAMES between its own two snapped boundaries. Consecutive segments then
   share a boundary by construction, the count telescopes to
   round(total × fps) exactly, and no per-segment rounding survives to be
   added up. Same lesson as the sound clock: one clock, computed once. */
let cursor = 0;
for (const s of segs) {
  const f0 = Math.round(s.t0 * FPS), f1 = Math.round(s.t1 * FPS);
  s.f0 = Math.max(cursor, f0);
  s.nframes = Math.max(1, f1 - s.f0);
  cursor = s.f0 + s.nframes;
}
const totalFrames = cursor, gridSec = totalFrames / FPS;
console.log(`  frame grid: ${totalFrames} frames = ${gridSec.toFixed(3)}s vs clock ${clock.toFixed(3)}s` +
  ` · snap error ${Math.abs(gridSec - clock).toFixed(3)}s`);

/* ---- picture ------------------------------------------------------------ */
const TMP = path.join(FILM, ".tmpclose");
fs.mkdirSync(TMP, { recursive: true });
console.log(`\n  building picture…`);
const parts = [];
segs.forEach((s, i) => {
  const out = path.join(TMP, `s-${String(i).padStart(4, "0")}.mp4`);
  const srcLen = dur(s.src) || s.seconds;
  const args = ["-y", "-v", "error"];
  if (s.loop) args.push("-stream_loop", String(Math.max(1, Math.ceil(s.nframes / (srcLen * FPS)) + 1)));
  args.push("-i", s.src);
  // output-side seek: frame-accurate, and these clips are two seconds long
  if (s.skip) args.push("-ss", String(s.skip));
  // a close-up is played from ITS OWN start; the wide loop is played from
  // wherever the scene clock happens to be, so a scene that returns to the
  // room does not restart its cycle
  if (s.loop && s.in > 0) args.splice(args.indexOf("-i"), 0, "-ss", String((s.in % srcLen).toFixed(3)));
  /* A close-up clip is exactly as long as the run it was rendered from, and the
     grid occasionally asks it for one frame more than it owns — seven shots,
     nine frames, in a 4908-frame film, and every one of them shortened the
     picture against a sound track that cannot move. tpad clones the final
     frame; -frames:v then truncates to exactly the grid's count. A held frame
     at the very end of a shot, inside its own trailing silence, is invisible;
     a picture that runs short of its sound is not. */
  if (!s.loop) args.push("-vf", "tpad=stop_mode=clone:stop_duration=1");
  args.push("-r", String(FPS), "-frames:v", String(s.nframes),
    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
    "-vsync", "cfr", out);
  execFileSync(FF, args);
  parts.push(out);
  if ((i + 1) % 40 === 0) console.log(`    ${i + 1}/${segs.length}`);
});
const list = path.join(TMP, "concat.txt");
fs.writeFileSync(list, parts.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n"));
const picture = path.join(TMP, "picture.mp4");
execFileSync(FF, ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", picture]);

/* ---- mux against the UNCHANGED master ----------------------------------- */
const master = path.join(ROOT, "audio", "master.wav");
const out = path.join(FILM, "BUTTERFLY-CLOSE.mp4");
execFileSync(FF, ["-y", "-v", "error", "-i", picture, "-i", master,
  "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-shortest", out]);

const pd = dur(picture), ad = dur(master), od = dur(out);
console.log(`\n  wrote film/BUTTERFLY-CLOSE.mp4`);
console.log(`  ${(fs.statSync(out).size / 1048576).toFixed(1)} MB · ${(od / 60).toFixed(2)} min`);
console.log(`  picture ${pd.toFixed(3)}s vs sound ${ad.toFixed(3)}s · drift ${Math.abs(pd - ad).toFixed(3)}s` +
  (Math.abs(pd - ad) > 0.5 ? "   ** DRIFT" : "   clocks agree"));
const wideMp4 = path.join(FILM, "BUTTERFLY.mp4");
if (fs.existsSync(wideMp4)) {
  const wd = dur(wideMp4);
  console.log(`  wide cut ${wd.toFixed(3)}s vs speaking cut ${od.toFixed(3)}s · difference ${Math.abs(wd - od).toFixed(3)}s` +
    (Math.abs(wd - od) > 0.5 ? "   ** the two cuts are not the same film" : "   the two cuts are the same length"));
}
