#!/usr/bin/env python3
"""Run a litmus test N times unchanged and report the pass rate.
    GEMINI_API_KEY=... python3 litmus/run.py door 2
Frames are stamped with the time they arrived, so checks read real seconds, not frame counts."""
import asyncio, base64, glob, io, json, os, re, ssl, sys, time, urllib.request, websockets
from PIL import Image, ImageDraw
H = os.path.dirname(os.path.abspath(__file__)); KEY = os.environ['GEMINI_API_KEY']
URL = 'wss://generativelanguage.googleapis.com/v1beta/interactions/live'
CTX = ssl.create_default_context(cafile=os.environ.get('SSL_CERT_FILE'))
T = json.load(open(H + '/tests.json'))['tests']
Q = {'outside': 'The camera is outdoors, outside the building.', 'inside': 'The camera is indoors, inside a building interior (walls or columns around, a ceiling or roof overhead).',
     'doorway_closer': 'A doorway or arch fills clearly more of the frame than in FRAME 1 (we have moved toward it), or we are already passing through it.',
     'man_from_behind': 'A Black man in black clothing is visible, seen from behind or mostly from behind.'}
def frame_for(t):
    d = [f for f in glob.glob(os.path.join(H, '../../../../../wygwyl-world-arch/shots/out/*/shot.json')) if json.load(open(f))['bible_no'] == t['view']][0]
    im = Image.open(os.path.dirname(d) + '/image.jpg').convert('RGB'); w, h = im.size; tw = min(w, int(h * 16 / 9)); th = int(tw * 9 / 16)
    im = im.crop(((w - tw) // 2, (h - th) // 2, (w + tw) // 2, (h + th) // 2)).resize((1280, 720), Image.LANCZOS)
    for q in range(80, 15, -5):
        b = io.BytesIO(); im.save(b, 'JPEG', quality=q)
        if b.tell() <= 48_000: break
    return b.getvalue()
async def take(t, out):
    frames = []; t0 = [None]
    async with websockets.connect(URL, additional_headers={'x-goog-api-key': KEY}, ssl=CTX, open_timeout=25, max_size=None) as ws:
        send = lambda e: ws.send(json.dumps(e))
        async def pump():
            async for raw in ws:
                d = json.loads(raw.decode() if isinstance(raw, bytes) else raw)
                for e in (d.get('events') or [d]):
                    dl = e.get('delta') or {}
                    if e.get('event_type') == 'step.delta' and dl.get('type') == 'video':
                        if t0[0] is None: t0[0] = time.monotonic()
                        frames.append((time.monotonic() - t0[0], base64.b64decode(dl['data'])))
                    elif e.get('event_type') in ('interaction.completed', 'interaction.cancelled', 'error'): return
        await send({'event_type': 'interaction.create', 'model': 'genie-4'}); rd = asyncio.create_task(pump()); await asyncio.sleep(.8)
        await send({'event_type': 'world_setup', 'world_prompt': t['seed'], 'reference_image': {'data': base64.b64encode(frame_for(t)).decode(), 'mime_type': 'image/jpeg'}})
        try:
            while t0[0] is None and not rd.done(): await asyncio.sleep(.05)
            for s in t['script']:                                   # script times are on the film's own clock
                w = s['t'] - (time.monotonic() - t0[0])
                if w > 0: await asyncio.sleep(w)
                if 'key' in s: await send({'event_type': 'user_action', 'action': 'key_' + s['key'], 'input': 'key_w'})
                else: await send({'event_type': 'input', 'content': [{'type': 'text', 'text': s['say']}]})
            w = t['seconds'] - (time.monotonic() - t0[0])
            if w > 0: await asyncio.sleep(w)
        finally:
            try: await send({'event_type': 'interaction.complete'}); await asyncio.wait_for(rd, 12)
            except Exception:
                try: await send({'event_type': 'interaction.cancel'})
                except Exception: pass
    at = lambda sec: min(frames, key=lambda f: abs(f[0] - sec))[1]
    times = sorted({c['t'] for c in t['checks']}); pics = [Image.open(io.BytesIO(at(s))).convert('RGB') for s in times]
    strip = Image.new('RGB', (len(pics) * 484, 290), '#061433'); d = ImageDraw.Draw(strip)
    for i, (s, im) in enumerate(zip(times, pics)): strip.paste(im.resize((480, 270)), (i * 484, 0)); d.text((i * 484 + 4, 272), f'{s:.1f}s', fill='white')
    strip.save(out + '.jpg', quality=85)
    return frames, times, pics
def judge(t, times, pics):
    qs = sorted({c['q'] for c in t['checks']}); parts = [{'text': 'Answer each statement true or false for each frame, by looking only. Statements:\n' + '\n'.join(f'{q}: {Q[q]}' for q in qs)
             + '\nJSON only: {"frames":[{"frame":1,' + ','.join(f'"{q}":true' for q in qs) + '}]}'}]
    for i, im in enumerate(pics):
        b = io.BytesIO(); im.resize((768, 432)).save(b, 'JPEG', quality=80); parts += [{'text': f'FRAME {i + 1}'}, {'inline_data': {'mime_type': 'image/jpeg', 'data': base64.b64encode(b.getvalue()).decode()}}]
    for m in ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-4-hydrogen', 'gemini-3.8-flash']:
        try:
            rq = urllib.request.Request(f'https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent', headers={'x-goog-api-key': KEY, 'content-type': 'application/json'},
                 data=json.dumps({'contents': [{'parts': parts}], 'generationConfig': {'responseMimeType': 'application/json', 'temperature': 0}}).encode())
            r = json.load(urllib.request.urlopen(rq, timeout=60, context=CTX)); v = json.loads(re.search(r'\{.*\}', r['candidates'][0]['content']['parts'][0]['text'], re.S).group(0))
            return {times[f['frame'] - 1]: f for f in v['frames']}, m
        except Exception as e: err = e; time.sleep(3)
    raise err
name, n = sys.argv[1], int(sys.argv[2]); t = T[name]; os.makedirs(H + '/out', exist_ok=True); results = []
for k in range(n):
    out = f"{H}/out/{name}-{time.strftime('%H%M%S')}-{k + 1}"; frames, times, pics = asyncio.run(take(t, out)); ans, m = judge(t, times, pics)
    row = [dict(c, got=ans[c['t']].get(c['q']), ok=ans[c['t']].get(c['q']) == c['want']) for c in t['checks']]
    results.append(dict(take=k + 1, frames=len(frames), seconds=round(frames[-1][0], 1), fps=round(len(frames) / frames[-1][0], 1), judge=m, checks=row, strip=os.path.basename(out) + '.jpg', passed=all(r['ok'] for r in row)))
    print(f"take {k + 1}: {'PASS' if results[-1]['passed'] else 'FAIL'}  {len(frames)} frames in {frames[-1][0]:.1f}s ({results[-1]['fps']} fps)  " + '  '.join(f"{r['t']}s {r['q']}={'yes' if r['got'] else 'no'}{'' if r['ok'] else ' ✗'}" for r in row), flush=True)
json.dump(dict(test=name, claim=t['claim'], runs=results, pass_rate=f"{sum(r['passed'] for r in results)}/{n}"), open(f"{H}/out/{name}-result.json", 'w'), indent=1)
print(f"{name}: {sum(r['passed'] for r in results)}/{n} passed — {t['claim']}")
