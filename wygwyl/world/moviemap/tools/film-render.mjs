#!/usr/bin/env node
// Render WHERE YOU GO WHEN YOU LEAVE: tools/film.html frame by frame into per-chapter video (resumable), then the record and his
// readings mixed against the album clock, burned and soft subtitles, chapters.   PLAYWRIGHT=… CHROME=… node film-render.mjs [01 02 …] [--assemble]
import {createRequire} from 'node:module';
import {mkdirSync, existsSync, writeFileSync, renameSync, readFileSync, statSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn, spawnSync} from 'node:child_process';
const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url)), MM = join(HERE, '..'), W = join(MM, '..', '..'), ROOT = join(W, '..');
const TMP = join(ROOT, 'film', '.tmp', 'moviemap'), OUT = join(ROOT, 'film', 'WYGWYL-moviemap.mp4'); mkdirSync(TMP, {recursive: true});
const args = process.argv.slice(2), only = args.filter(a => /^\d\d$/.test(a)), PORT = 8196;
const cut = JSON.parse(readFileSync(join(MM, 'film', 'cut.json'), 'utf8'));
const FF = spawnSync('sh', ['-c', 'command -v ffmpeg']).stdout.toString().trim();

if (!args.includes('--assemble')) {
  const {chromium} = require(process.env.PLAYWRIGHT || 'playwright');
  const srv = spawn('node', [join(ROOT, 'harness/serve.mjs'), String(PORT)], {stdio: 'ignore'}); await new Promise(r => setTimeout(r, 600));
  const browser = await chromium.launch({executablePath: process.env.CHROME, headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist']});
  const page = await browser.newPage({viewport: {width: 1280, height: 760}}); page.on('pageerror', e => console.error('[pageerror]', e.message));
  await page.goto(`http://127.0.0.1:${PORT}/wygwyl/world/moviemap/tools/film.html`); await page.waitForFunction('window.filmReady === true', null, {timeout: 240000});
  const chapters = await page.evaluate(() => window.film.chapterFrames);
  for (const [num, f0, f1] of chapters) {
    if (only.length && !only.includes(num)) continue; const dst = join(TMP, `ch${num}.mp4`); if (existsSync(dst)) { console.log('have', num); continue; }
    const ff = spawn(FF, ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(cut.fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', String(cut.fps), dst + '.part.mp4'], {stdio: ['pipe', 'inherit', 'inherit']});
    const t0 = Date.now();
    for (let n = f0; n < f1; n++) { const d = await page.evaluate(n => window.film.frame(n), n); const ok = ff.stdin.write(Buffer.from(d.slice(d.indexOf(',') + 1), 'base64')); if (!ok) await new Promise(r => ff.stdin.once('drain', r));
      if ((n - f0) % 240 === 0) console.log(`ch${num} ${n - f0}/${f1 - f0} · ${((Date.now() - t0) / Math.max(1, n - f0)).toFixed(0)} ms/frame`); }
    ff.stdin.end(); await new Promise(r => ff.on('close', r)); renameSync(dst + '.part.mp4', dst); console.log(`ch${num} done in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
  await browser.close(); srv.kill();
}

if (args.includes('--assemble') || !only.length) {
  const nums = [...cut.chapters.map(c => c.num), '15'];
  if (!nums.every(n => existsSync(join(TMP, `ch${n}.mp4`)))) { console.log('not every chapter is rendered yet'); process.exit(0); }
  // joined through MPEG-TS (the concat protocol copies every frame; the mp4 concat demuxer dropped one at each join)
  for (const n of nums) { const ts = join(TMP, `ch${n}.ts`); if (!existsSync(ts)) spawnSync(FF, ['-loglevel', 'error', '-y', '-i', join(TMP, `ch${n}.mp4`), '-c', 'copy', '-bsf:v', 'h264_mp4toannexb', '-f', 'mpegts', ts]); }
  spawnSync(FF, ['-loglevel', 'error', '-y', '-i', 'concat:' + nums.map(n => join(TMP, `ch${n}.ts`)).join('|'), '-c', 'copy', '-r', String(cut.fps), join(TMP, 'video.mp4')], {stdio: 'inherit'});
  // subtitles (soft, and a .vtt beside the film) and chapters, from the cut
  const ts = (t, sep) => { const h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, s = t % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${s.toFixed(3).padStart(6, '0').replace('.', sep)}`; };
  const subs = cut.chapters.flatMap(c => c.lines.map(l => [l.s, l.e + 0.4, l.text]));
  writeFileSync(join(TMP, 'subs.srt'), subs.map(([a, b, t], i) => `${i + 1}\n${ts(a, ',')} --> ${ts(b, ',')}\n${t}\n`).join('\n'));
  writeFileSync(join(MM, 'film', 'WYGWYL-moviemap.vtt'), 'WEBVTT\n\n' + subs.map(([a, b, t]) => `${ts(a, '.')} --> ${ts(b, '.')}\n${t}\n`).join('\n'));
  const total = cut.duration + cut.credits;
  writeFileSync(join(TMP, 'chapters.txt'), ';FFMETADATA1\ntitle=Where You Go When You Leave — a movie map of Atlantis\n' + [...cut.chapters.map(c => [c.t0, c.t1, `${c.num} ${c.title}`]), [cut.duration, total, 'credits']]
    .map(([a, b, t]) => `[CHAPTER]\nTIMEBASE=1/1000\nSTART=${Math.round(a * 1000)}\nEND=${Math.round(b * 1000)}\ntitle=${t}\n`).join('\n'));
  // the record under everything; each reading laid into its passage at the cut's read0
  const ins = ['-i', join(W, cut.drone), ...cut.chapters.flatMap(c => ['-i', join(W, c.reading)])];
  // his readings never overlap, so they are laid end to end with silence between (the ffmpeg here has no un-normalised amix);
  // then the record and the readings are mixed as two constant streams and the halving is given back
  const F = 'aformat=sample_rates=48000:channel_layouts=stereo:sample_fmts=fltp', parts = [], segs = [];
  // each reading gets an exact slot, from its own start to the next one's: padded and trimmed, so nothing can drift
  parts.push(`aevalsrc=0|0:s=48000:d=${cut.chapters[0].read0.toFixed(4)},${F}[g]`); segs.push('[g]');
  cut.chapters.forEach((c, i) => { const next = i + 1 < cut.chapters.length ? cut.chapters[i + 1].read0 : total; parts.push(`[${i + 1}:a]${F},apad,atrim=end_sample=${Math.round((next - c.read0) * 48000)}[r${i}]`); segs.push(`[r${i}]`); });
  const fl = [...parts, `${segs.join('')}concat=n=${segs.length}:v=0:a=1,apad,atrim=0:${total.toFixed(3)}[voice]`,
    `[0:a]${F},volume=0.62,afade=t=out:st=${(cut.duration - 6).toFixed(2)}:d=6,apad,atrim=0:${total.toFixed(3)}[d]`,
    `[d][voice]amix=inputs=2:duration=longest:dropout_transition=0,volume=2,alimiter=limit=0.95[a]`].join(';');
  let r = spawnSync(FF, ['-loglevel', 'error', '-y', ...ins, '-filter_complex', fl, '-map', '[a]', '-c:a', 'aac', '-b:a', '192k', join(TMP, 'mix.m4a')], {stdio: 'inherit'}); if (r.status) process.exit(1);
  r = spawnSync(FF, ['-loglevel', 'error', '-y', '-i', join(TMP, 'video.mp4'), '-i', join(TMP, 'mix.m4a'), '-i', join(TMP, 'subs.srt'), '-i', join(TMP, 'chapters.txt'),
    '-map', '0:v', '-map', '1:a', '-map', '2:s', '-map_metadata', '3', '-map_chapters', '3', '-c:v', 'copy', '-c:a', 'copy', '-c:s', 'mov_text', '-metadata:s:s:0', 'language=eng', '-movflags', '+faststart', OUT], {stdio: 'inherit'});
  if (r.status) process.exit(1);
  console.log('film', OUT, (statSync(OUT).size / 1048576).toFixed(0) + ' MB');
}
