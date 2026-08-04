#!/usr/bin/env node
/* ============================================================================
   build-voices-scenes.mjs — THE DIALOGUE, RECORDED AS SCENES.

   WHY NOT ONE REQUEST PER LINE. The per-line path costs 595 requests and the
   TTS previews meter hard: the run stalled at 97. Recording a whole exchange
   in ONE multi-speaker request costs 73 — and it is the better object anyway.
   Isolated lines butted together at a fixed 0.42 s gap is not a conversation;
   a scene generated as one pass has real turn-taking, real overlap of breath,
   and one room across the whole exchange.

   CHUNKING. Gemini's multi-speaker config takes at most TWO voices, and 21 of
   the 73 speaking scenes have three or more (up to six). Those are split into
   the longest consecutive runs that contain no more than two distinct
   speakers, so a three-hander becomes two or three takes that still each carry
   a real exchange rather than a pile of single lines.

   THE DIRECTION IS STILL THE CORPUS'S. Each speaker's own written `voice`
   entity goes into the prompt as their direction, exactly as in the per-line
   path. What changes is the unit of performance, not its source.

   RATE, NOT QUOTA. The 429s from the 2.5 previews say "exceeded your current
   quota" but recover within a minute, so they are per-minute limits wearing a
   daily-cap message. The fix is spacing and patience, not another model.
   gemini-3.1-flash-tts-preview does look genuinely day-capped and is last.

   Writes audio/scenes/<sceneId>__<k>.wav and audio/scene-takes.json.
   ========================================================================= */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = JSON.parse(fs.readFileSync(path.join(ROOT, "audio", "script.json"), "utf8"));
const OUT = path.join(ROOT, "audio", "scenes");
const TAKES = path.join(ROOT, "audio", "scene-takes.json");

const MODELS = ["gemini-2.5-flash-preview-tts", "gemini-2.5-pro-preview-tts", "gemini-3.1-flash-tts-preview"];
const RATE_HZ = 24000;
const SPACING_MS = 5200;          // patient by design; the limit is per minute
// A take that has not been recorded still occupies time, and the picture and
// the sound must agree on exactly how much or the film drifts apart. One rule,
// used by both: estimate from the take's own word count at measured-delivery
// pace. (Before this, build-film skipped missing takes while buildMaster
// inserted a flat 2s, and the two clocks parted by 74 seconds.)
const MISSING_WPS = 2.55;
function takeSeconds(t) {
  if (t.duration != null) return t.duration;
  const w = t.lines.reduce((n, l) => n + String(l.text || "").split(/\s+/).filter(Boolean).length, 0);
  return Math.max(1.2, w / MISSING_WPS);
}

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };

const key = (process.env.GEMINI_API_KEY || fs.readFileSync(path.join(ROOT, "harness", ".gemini-key"), "utf8")).trim();

function wav(pcm) {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVE", 8);
  h.write("fmt ", 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22); h.writeUInt32LE(RATE_HZ, 24); h.writeUInt32LE(RATE_HZ * 2, 28);
  h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write("data", 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

/* ---- chunk every scene into takes of at most two voices ------------------ */
const byScene = {};
for (const l of SCRIPT.lines) (byScene[l.scene] ||= []).push(l);

const takes = [];
for (const [scene, lines] of Object.entries(byScene)) {
  let cur = [], voices = new Set(), k = 0;
  const flush = () => {
    if (!cur.length) return;
    takes.push({ id: `${scene}__${k++}`, scene, lines: cur.slice(), speakers: [...voices] });
    cur = []; voices = new Set();
  };
  for (const l of lines) {
    const next = new Set(voices); next.add(l.who);
    if (next.size > 2) flush();
    cur.push(l); voices.add(l.who);
  }
  flush();
}

/* ---- one take ------------------------------------------------------------ */
async function record(take, model) {
  const cast = [...new Set(take.lines.map((l) => l.who))];
  const rows = take.lines.map((l) => `${l.who}: ${l.text}`).join("\n");
  const directions = cast.map((who) => {
    const l = take.lines.find((x) => x.who === who);
    return `${who} — ${l.direction}`;
  }).join("\n");

  const prompt =
    `Read this scene from a quiet, unsentimental television drama. Underplay everything; ` +
    `no announcer voice, no warmth that is not written, no dramatic pauses beyond the punctuation.\n\n` +
    `${directions}\n\nThe exchange:\n${rows}`;

  const speech = cast.length > 1
    ? { multiSpeakerVoiceConfig: { speakerVoiceConfigs: cast.map((who) => ({
        speaker: who, voiceConfig: { prebuiltVoiceConfig: { voiceName: take.lines.find((l) => l.who === who).voice } } })) } }
    : { voiceConfig: { prebuiltVoiceConfig: { voiceName: take.lines[0].voice } } };

  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }],
                             generationConfig: { responseModalities: ["AUDIO"], speechConfig: speech } }) });
  if (!r.ok) { const e = new Error(`${r.status} ${(await r.text()).slice(0, 120)}`); e.status = r.status; throw e; }
  const j = await r.json();
  const d = j?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!d) throw new Error("no audio");
  return Buffer.from(d, "base64");
}

/* ---- master: the takes laid on the film's own clock ---------------------- */
function buildMaster() {
  const TAKE_GAP = 0.55, TAIL = 0.90;
  const silence = (sec) => Buffer.alloc(Math.max(0, Math.round(sec * RATE_HZ)) * 2);
  const byS = {};
  for (const t of takes) (byS[t.scene] ||= []).push(t);
  const chunks = []; let placed = 0, silent = 0;
  for (const s of SCRIPT.scenes) {
    const ts = byS[s.id];
    if (!ts) { chunks.push(silence(s.hold != null ? s.hold : 3.0)); silent++; continue; }
    for (const t of ts) {
      const f = path.join(OUT, `${t.id}.wav`);
      if (fs.existsSync(f)) { chunks.push(fs.readFileSync(f).slice(44)); placed++; }
      else chunks.push(silence(takeSeconds(t)));   // same rule the picture uses
      chunks.push(silence(TAKE_GAP));
    }
    chunks.push(silence(TAIL - TAKE_GAP));
  }
  const pcm = Buffer.concat(chunks);
  fs.writeFileSync(path.join(ROOT, "audio", "master.wav"), wav(pcm));
  console.log(`master: ${(pcm.length / 2 / RATE_HZ / 60).toFixed(2)} min · ${placed} takes placed · ${silent} scenes held silent`);
}

/* ---- run ---------------------------------------------------------------- */
(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  if (process.argv.includes("--master")) { buildMaster(); return; }
  let todo = takes.filter((t) => !fs.existsSync(path.join(OUT, `${t.id}.wav`)));
  const outstanding = todo.length;      // count BEFORE --limit slices, or the report lies
  if (arg("--limit")) todo = todo.slice(0, +arg("--limit"));

  console.log(`${takes.length} takes cover ${SCRIPT.lines.length} lines across ${Object.keys(byScene).length} speaking scenes`);
  console.log(`  ${takes.length - outstanding} already recorded · ${outstanding} outstanding · ${todo.length} in this run`);
  const multi = takes.filter((t) => t.speakers.length > 1).length;
  console.log(`  ${multi} two-voice takes · ${takes.length - multi} single-voice\n`);

  let model = arg("--model") || MODELS[0], ok = 0, failed = [];
  for (const [n, take] of todo.entries()) {
    let attempt = 0;
    for (;;) {
      try {
        const pcm = await record(take, model);
        fs.writeFileSync(path.join(OUT, `${take.id}.wav`), wav(pcm));
        ok++;
        console.log(`  ${n + 1}/${todo.length}  ${take.id.padEnd(14)} ${take.speakers.join("+").padEnd(20)} ${take.lines.length} lines  ${(pcm.length / 2 / RATE_HZ).toFixed(1)}s`);
        break;
      } catch (e) {
        attempt++;
        if (attempt > 10) { failed.push({ id: take.id, err: String(e.message).slice(0, 100) }); break; }
        // these recover; wait rather than escalate
        const wait = Math.min(90000, 8000 * attempt);
        if (attempt === 3) {
          const nx = MODELS[MODELS.indexOf(model) + 1];
          if (nx) { console.log(`  ${model} not yielding — trying ${nx}`); model = nx; continue; }
        }
        process.stdout.write(`  …${take.id} ${e.status || ""} waiting ${(wait / 1000) | 0}s\n`);
        await new Promise((r) => setTimeout(r, wait));
      }
    }
    await new Promise((r) => setTimeout(r, SPACING_MS));
  }

  /* ---- manifest: real durations, and each line's share of its take -------- */
  const manifest = takes.map((t) => {
    const f = path.join(OUT, `${t.id}.wav`);
    let dur = null;
    if (fs.existsSync(f)) {
      try {
        dur = parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration",
          "-of", "default=nw=1:nk=1", f], { encoding: "utf8" }).trim());
      } catch (_) {}
    }
    // Subtitle timing inside a take is apportioned by word count. It is an
    // approximation and is labelled one — the alternative is forced alignment,
    // which this project does not have.
    const words = t.lines.reduce((n, l) => n + l.words, 0) || 1;
    let acc = 0;
    const lines = t.lines.map((l) => {
      const share = dur ? dur * (l.words / words) : null;
      const row = { id: l.id, who: l.who, text: l.text, t0: dur ? acc : null, dur: share, apportioned: true };
      if (dur) acc += share;
      return row;
    });
    return { id: t.id, scene: t.scene, speakers: t.speakers, file: fs.existsSync(f) ? `audio/scenes/${t.id}.wav` : null, duration: dur, lines };
  });
  fs.writeFileSync(TAKES, JSON.stringify({ built: new Date().toISOString(), model, takes: manifest }, null, 1));

  const done = manifest.filter((m) => m.duration != null);
  console.log(`\nrecorded ${ok} this run · ${done.length}/${takes.length} takes on disk · ${failed.length} failed`);
  console.log(`  ${(done.reduce((n, m) => n + m.duration, 0) / 60).toFixed(1)} min of dialogue`);
  if (failed.length) failed.slice(0, 6).forEach((f) => console.error(`  ${f.id}: ${f.err}`));
  console.log(`  wrote audio/scene-takes.json`);
  buildMaster();
})();
