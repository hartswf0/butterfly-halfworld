#!/usr/bin/env node
// Drive the capture rig headless: every disc block, every ~3 m, four views → PNG frames in a scratch folder.
//   PLAYWRIGHT=/path/to/node_modules/playwright node capture-run.mjs <outDir> [--edges a,b,c] [--limit N] [--era 5] [--w 480 --h 320]
import {createRequire} from 'node:module';
import {mkdirSync, writeFileSync, existsSync, readFileSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
const require = createRequire(import.meta.url);
const {chromium} = require(process.env.PLAYWRIGHT || 'playwright');
const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, '../../../..');
const args = process.argv.slice(2), out = args[0], opt = k => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : null; };
const W = +(opt('w') || 480), H = +(opt('h') || 320), era = +(opt('era') ?? 5), PORT = +(opt('port') || 8193), tag = opt('tag') || `e${era}`;
const plan = JSON.parse(readFileSync(join(HERE, '../plan.json'), 'utf8'));
let ids = plan.edges.map((e, i) => e.disc ? i : -1).filter(i => i >= 0);
if (opt('edges')) ids = opt('edges').split(',').map(Number);
if (opt('limit')) ids = ids.slice(0, +opt('limit'));
const srv = spawn('node', [join(ROOT, 'harness/serve.mjs'), String(PORT)], {stdio: 'ignore'});
await new Promise(r => setTimeout(r, 600));
const browser = await chromium.launch({executablePath: process.env.CHROME, headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader']});
const page = await browser.newPage({viewport: {width: W, height: H + 40}});
page.on('console', m => { if (m.type() === 'error') console.error('[page]', m.text()); });
page.on('pageerror', e => console.error('[pageerror]', e.message));
await page.goto(`http://127.0.0.1:${PORT}/wygwyl/world/moviemap/tools/capture.html?w=${W}&h=${H}`);
await page.waitForFunction('window.capReady === true', null, {timeout: 180000});
const st = await page.evaluate(o => window.cap.setup(o), {era, hour: +(opt('hour') || 12), doy: +(opt('doy') || 265), weather: opt('weather') || 'clear', season: opt('season'), style: opt('style') || 'photo'});
console.log('rig ready', JSON.stringify(st), ids.length, 'blocks');
const t0 = Date.now(); let nf = 0;
for (const [n, id] of ids.entries()) {
  const e = plan.edges[id], dir = join(out, tag, String(id)); if (existsSync(join(dir, 'done'))) continue; mkdirSync(dir, {recursive: true});
  for (const [i, [x, y, h]] of e.steps.entries()) {
    const shots = await page.evaluate(([x, y, h]) => window.cap.shoot(x, y, h), [x, y, h]);
    shots.forEach((d, v) => writeFileSync(join(dir, `${v}_${String(i).padStart(4, '0')}.png`), Buffer.from(d.split(',')[1], 'base64'))); nf += 4;
  }
  writeFileSync(join(dir, 'done'), String(e.steps.length));
  if (n % 10 === 0) console.log(`${n + 1}/${ids.length} · block ${id} · ${nf} frames · ${((Date.now() - t0) / nf).toFixed(0)} ms/frame`);
}
if (opt('aerial')) { const [pw, ph] = opt('aerial').split('x').map(Number); const d = await page.evaluate(([pw, ph]) => window.cap.aerial(0, 0, 8000, 6000, pw, ph), [pw, ph]); writeFileSync(join(out, `aerial-${tag}.png`), Buffer.from(d.split(',')[1], 'base64')); }
console.log('done', nf, 'frames in', ((Date.now() - t0) / 1000).toFixed(0), 's');
await browser.close(); srv.kill();
