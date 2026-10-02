#!/usr/bin/env node
// THE DISC'S EYE — which buildings the filmed streets actually see, and how large: the ID buffer counted over every disc frame's
// side views (and the front), each building keeping its best view. Holdings that hang on walls go where the disc can see them.
//   PLAYWRIGHT=… CHROME=… node tools/visibility.mjs  →  vis.json
import {createRequire} from 'node:module'; import {writeFileSync, readFileSync} from 'node:fs'; import {join, dirname} from 'node:path'; import {fileURLToPath} from 'node:url'; import {spawn} from 'node:child_process';
const require = createRequire(import.meta.url); const {chromium} = require(process.env.PLAYWRIGHT || 'playwright');
const HERE = dirname(fileURLToPath(import.meta.url)), MM = join(HERE, '..'), ROOT = join(MM, '../../..'), PORT = 8199;
const disc = JSON.parse(readFileSync(join(MM, 'disc.json'), 'utf8'));
const srv = spawn('node', [join(ROOT, 'harness/serve.mjs'), String(PORT)], {stdio: 'ignore'}); await new Promise(r => setTimeout(r, 600));
const b = await chromium.launch({executablePath: process.env.CHROME, headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist']});
const p = await b.newPage({viewport: {width: 480, height: 360}}); p.on('pageerror', e => console.error(e.message));
await p.goto(`http://127.0.0.1:${PORT}/wygwyl/world/moviemap/tools/capture.html?w=480&h=320&shadows=0`); await p.waitForFunction('window.capReady === true', null, {timeout: 180000});
const t0 = Date.now();
const vis = await p.evaluate(segs => { const eng = window.cap.eng, best = {};
  for (const s of segs) s.steps.forEach(([x, y, h], i) => { for (const v of [1, 3, 0]) { eng.pose(x, y, h, v); const c = eng.idCounts();
    for (const [k, n] of c) if (!best[k] || n > best[k][0]) best[k] = [n, s.seg, i, v]; } });
  return best; }, disc.segments);
const total = 160 * 107, out = {version: 'moviemap-vis-v1', rule: 'per building: [most ID-buffer pixels in any disc frame (160×107, front/right/left views), segment, frame, view]', frame: total, vis};
writeFileSync(join(MM, 'vis.json'), JSON.stringify(out));
const n = Object.values(vis), big = n.filter(a => a[0] > total * 0.06).length;
console.log(Object.keys(vis).length, 'buildings seen from the disc ·', big, 'fill more than 6% of a frame ·', ((Date.now() - t0) / 1000).toFixed(0), 's');
await b.close(); srv.kill();
