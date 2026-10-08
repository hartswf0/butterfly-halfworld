// Drives moviemap/tools/posefind.html: index the whole city, then evolve each view's pose, check it, and shoot it.
//   PLAYWRIGHT=… CHROME=… node posefind-run.mjs <outDir> [--views 1,2] [--port 8185]
import {createRequire} from 'node:module'; import fs from 'node:fs'; import path from 'node:path';
const require = createRequire(import.meta.url); const {chromium} = require(process.env.PLAYWRIGHT || 'playwright');
const [out] = process.argv.slice(2), arg = k => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : null; };
const PORT = arg('port') || 8185; fs.mkdirSync(out, {recursive: true});
const S = JSON.parse(fs.readFileSync(new URL('../scenes.json', import.meta.url))), dist = Object.fromEntries(S.views.map(v => [v.n, v.d]));
const HOUR = {haze: 19.6, hive: 1, overseer: 1, bay: 13, ascent: 23, plaza: 0.5, naraka: 1.5, ankhu: 2.5, commons: 20, arcade: 3.5, cenotaph: 7, temple: 7.5};
const VIEWS = arg('views') ? arg('views').split(',').map(Number) : S.views.map(v => v.n);
const browser = await chromium.launch({executablePath: process.env.CHROME, headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist']});
const page = await browser.newPage({viewport: {width: 448, height: 252}}); page.on('pageerror', e => console.error('[pageerror]', e.message));
page.setDefaultTimeout(0);
await page.goto(`http://127.0.0.1:${PORT}/wygwyl/world/moviemap/tools/posefind.html`); await page.waitForFunction('window.pfReady === true', null, {timeout: 600000});
const t0 = Date.now(); const ix = await page.evaluate(() => PF.index());
console.log('index', JSON.stringify(ix), `${((Date.now() - t0) / 1000).toFixed(0)}s`);
const res = {index: ix, views: {}};
for (const n of VIEWS) {
  const r = await page.evaluate(n => PF.refine(n), n);
  const ck = await page.evaluate(([n, p]) => PF.check(n, p), [n, r.best.pose]), nl = await page.evaluate(n => PF.nullScores(n), n);
  const sh = await page.evaluate(([p, h]) => PF.shoot(p, h), [r.best.pose, HOUR[dist[n]] ?? 13]);
  const pad = String(n).padStart(3, '0');
  fs.writeFileSync(path.join(out, `${pad}-photo.jpg`), Buffer.from(sh.photo.split(',')[1], 'base64')); fs.writeFileSync(path.join(out, `${pad}-sem.png`), Buffer.from(sh.sem.split(',')[1], 'base64'));
  res.views[n] = {district: dist[n], ...r, check: ck, null: nl};
  fs.writeFileSync(path.join(out, 'poses.json'), JSON.stringify(res));
  console.log(n, dist[n], 'score', r.best.s.toFixed(3), 'own rank', ck.rank, 'null median', nl.median?.toFixed(3), 'p95', nl.p95?.toFixed(3), r.best.from.kind, `${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
await browser.close();
