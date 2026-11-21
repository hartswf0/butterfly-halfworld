#!/usr/bin/env python3
"""Two proofs, as cheaply as possible.
 1. identity: what the service itself says it is running (free: a session is created and cancelled before any frame).
 2. controls: the same seed four times for 8 s with no text at all: no key, W, A, arrow-left. If the keys do nothing the four strips match.
    GEMINI_API_KEY=... python3 litmus/controls.py"""
import asyncio, base64, io, json, os, ssl, sys, time, websockets
from PIL import Image, ImageChops, ImageDraw, ImageStat
H = os.path.dirname(os.path.abspath(__file__)); KEY = os.environ['GEMINI_API_KEY']; sys.argv = ['x', 'door', '0']
URL = 'wss://generativelanguage.googleapis.com/v1beta/interactions/live'; CTX = ssl.create_default_context(cafile=os.environ.get('SSL_CERT_FILE'))
T = json.load(open(H + '/tests.json'))['tests']['door']
src = open(H + '/run.py').read(); ns = {}; exec(src[src.index('def frame_for'):src.index('async def take')], dict(json=json, os=os, io=io, Image=Image, H=H, glob=__import__('glob')), ns); seed_img = ns['frame_for'](T)
dec = lambda raw: json.loads(raw.decode() if isinstance(raw, bytes) else raw)
async def identity():
    async with websockets.connect(URL, additional_headers={'x-goog-api-key': KEY}, ssl=CTX, max_size=None) as ws:
        await ws.send(json.dumps({'event_type': 'interaction.create', 'model': 'genie-4'})); a = dec(await ws.recv())
        await ws.send(json.dumps({'event_type': 'interaction.cancel'})); b = dec(await ws.recv()); return a, b
async def take(key, secs=8.0):
    fr = []; t0 = [None]; usage = [None]
    async with websockets.connect(URL, additional_headers={'x-goog-api-key': KEY}, ssl=CTX, max_size=None) as ws:
        send = lambda e: ws.send(json.dumps(e))
        async def pump():
            async for raw in ws:
                d = dec(raw)
                for e in (d.get('events') or [d]):
                    dl = e.get('delta') or {}
                    if dl.get('type') == 'video':
                        if t0[0] is None: t0[0] = time.monotonic()
                        fr.append((time.monotonic() - t0[0], base64.b64decode(dl['data'])))
                    elif e.get('event_type') == 'interaction.completed': usage[0] = e.get('usage'); return
                    elif e.get('event_type') in ('interaction.cancelled', 'error'): return
        await send({'event_type': 'interaction.create', 'model': 'genie-4'}); rd = asyncio.create_task(pump()); await asyncio.sleep(.8)
        await send({'event_type': 'world_setup', 'world_prompt': T['seed'], 'reference_image': {'data': base64.b64encode(seed_img).decode(), 'mime_type': 'image/jpeg'}})
        try:
            while t0[0] is None and not rd.done(): await asyncio.sleep(.05)
            await asyncio.sleep(1.0)
            if key: await send({'event_type': 'user_action', 'action': 'key_down', 'input': key})
            await asyncio.sleep(secs - 2.0)
            if key: await send({'event_type': 'user_action', 'action': 'key_up', 'input': key})
            await asyncio.sleep(1.0)
        finally:
            try: await send({'event_type': 'interaction.complete'}); await asyncio.wait_for(rd, 12)
            except Exception:
                try: await send({'event_type': 'interaction.cancel'})
                except Exception: pass
    return fr, usage[0]
a, b = asyncio.run(identity()); print('IDENTITY', json.dumps(a)[:400]); print('        ', json.dumps(b)[:200])
out = {'identity': a, 'takes': []}; rows = []
for key in [None, 'key_w', 'key_a', 'arrow_left']:
    time.sleep(34)                                   # the service allows two sessions a minute on this tier
    fr, usage = asyncio.run(take(key)); at = lambda s: Image.open(io.BytesIO(min(fr, key=lambda f: abs(f[0] - s))[1])).convert('RGB')
    f1, f7 = at(0.8), at(7.0); sm = lambda im: im.convert('L').resize((96, 54))
    change = ImageStat.Stat(ImageChops.difference(sm(f1), sm(f7))).mean[0]
    # horizontal shift that best re-aligns the last frame to the first: sign and size say which way the view went
    A, B = sm(f1), sm(f7); best = min(range(-30, 31), key=lambda dx: ImageStat.Stat(ImageChops.difference(A.crop((30, 0, 66, 54)), B.crop((30 + dx, 0, 66 + dx, 54)))).mean[0])
    vt = usage and next((m['tokens'] for m in usage.get('output_tokens_by_modality', []) if m['modality'] == 'video'), None)
    out['takes'].append(dict(key=key or 'none', frames=len(fr), change=round(change, 1), shift_px=best * 1280 // 96, video_tokens=vt, tokens_per_frame=vt and round(vt / len(fr), 1)))
    print(out['takes'][-1], flush=True); rows.append((key or 'no key', f1, at(4.0), f7))
sh = Image.new('RGB', (3 * 484, 4 * 290), '#061433'); d = ImageDraw.Draw(sh)
for r, (k, *ims) in enumerate(rows):
    for c, im in enumerate(ims): sh.paste(im.resize((480, 270)), (c * 484, r * 290)); d.text((c * 484 + 4, r * 290 + 272), f"{k} · {[0.8, 4.0, 7.0][c]}s", fill='white')
sh.save(H + '/out/controls.jpg', quality=85); json.dump(out, open(H + '/out/controls.json', 'w'), indent=1)
