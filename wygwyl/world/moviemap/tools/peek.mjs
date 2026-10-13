#!/usr/bin/env node
// Look through the rig at a few poses and write a contact sheet: node peek.mjs out.png "x,y,h,view;x,y,h,view" [--style flat] [--era 3] [--season winter] [--hour 18]
import {createRequire} from 'node:module'; import {writeFileSync} from 'node:fs'; import {join, dirname} from 'node:path'; import {fileURLToPath} from 'node:url'; import {spawn} from 'node:child_process';
const require = createRequire(import.meta.url); const {chromium} = require(process.env.PLAYWRIGHT || 'playwright');
const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, '../../../..');
const args = process.argv.slice(2), opt = k => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : null; };
const PORT = 8194, srv = spawn('node', [join(ROOT, 'harness/serve.mjs'), String(PORT)], {stdio: 'ignore'}); await new Promise(r => setTimeout(r, 500));
const browser = await chromium.launch({executablePath: process.env.CHROME, headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist']});
const page = await browser.newPage({viewport: {width: 960, height: 700}}); page.on('pageerror', e => console.error('[pageerror]', e.message)); page.on('console', m => m.type() === 'error' && console.error('[page]', m.text()));
await page.goto(`http://127.0.0.1:${PORT}/wygwyl/world/moviemap/tools/capture.html?w=480&h=320`); await page.waitForFunction('window.capReady === true', null, {timeout: 180000});
await page.evaluate(o => window.cap.setup(o), {era: +(opt('era') ?? 5), hour: +(opt('hour') ?? 12), weather: opt('weather') || 'clear', season: opt('season'), style: opt('style') || 'photo'});
const poses = args[1].split(';').map(s => s.split(',').map(Number));
const shots = []; for (const [x, y, h, v] of poses) shots.push((await page.evaluate(([x, y, h, v]) => window.cap.shoot(x, y, h, [v]), [x, y, h, v]))[0]);
const html = `<body style="margin:0;background:#000;display:flex;flex-wrap:wrap;width:960px">${shots.map(d => `<img src="${d}" width=480 height=320>`).join('')}</body>`;
const p2 = await browser.newPage({viewport: {width: 960, height: Math.ceil(shots.length / 2) * 320}}); await p2.setContent(html); await p2.waitForTimeout(200);
writeFileSync(args[0], await p2.screenshot()); await browser.close(); srv.kill();
