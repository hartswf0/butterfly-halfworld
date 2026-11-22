#!/usr/bin/env python3
"""The street test: third person. The Poet walks down a street away from us for ten seconds, then the camera turns a full
slow look around. No text is sent after the start. One video per zone, at the speed the frames arrived, with the world's sound.
    GEMINI_API_KEY=... python3 litmus/street.py 20 91 98"""
import asyncio, base64, glob, io, json, os, ssl, subprocess, sys, time, websockets
from PIL import Image
H = os.path.dirname(os.path.abspath(__file__)); KEY = os.environ['GEMINI_API_KEY']; OUT = H + '/out'
URL = 'wss://generativelanguage.googleapis.com/v1beta/interactions/live'; CTX = ssl.create_default_context(cafile=os.environ.get('SSL_CERT_FILE'))
SHOTS = {json.load(open(f))['bible_no']: (os.path.dirname(f), json.load(open(f))) for f in glob.glob(os.path.join(H, '../../../../../wygwyl-world-arch/shots/out/*/shot.json'))}
MAN = ("A Black man in his thirties with close-cropped hair, wearing a matte black mock-neck long sleeve, black trousers and black boots, "
       "stands a few steps ahead of the camera with his back to us. He walks away from us down the middle of this street at an easy pace. "
       "The camera is at eye level behind him and follows him, keeping his whole body in frame.")
def seed(n):
    d, s = SHOTS[n]; im = Image.open(d + '/image.jpg').convert('RGB'); w, h = im.size; tw = min(w, int(h * 16 / 9)); th = int(tw * 9 / 16)
    im = im.crop(((w - tw) // 2, (h - th) // 2, (w + tw) // 2, (h + th) // 2)).resize((1280, 720), Image.LANCZOS)
    for q in range(80, 15, -5):
        b = io.BytesIO(); im.save(b, 'JPEG', quality=q)
        if b.tell() <= 48_000: break
    place = s['prompt'].split('--')[0].strip().rstrip(',.')[:260]
    return b.getvalue(), f"{place}. {MAN} Keep the look of the starting picture exactly. Sound: his footsteps and the street."
async def take(n):
    img, text = seed(n); fr = []; t0 = [None]; pcm = bytearray()
    async with websockets.connect(URL, additional_headers={'x-goog-api-key': KEY}, ssl=CTX, max_size=None) as ws:
        send = lambda e: ws.send(json.dumps(e))
        async def pump():
            async for raw in ws:
                d = json.loads(raw.decode() if isinstance(raw, bytes) else raw)
                for e in (d.get('events') or [d]):
                    dl = e.get('delta') or {}
                    if dl.get('type') == 'video':
                        if t0[0] is None: t0[0] = time.monotonic()
                        fr.append((time.monotonic() - t0[0], base64.b64decode(dl['data'])))
                    elif dl.get('type') == 'audio': pcm.extend(base64.b64decode(dl['data']))
                    elif e.get('event_type') in ('interaction.completed', 'interaction.cancelled', 'error'): return
        await send({'event_type': 'interaction.create', 'model': 'genie-4'}); rd = asyncio.create_task(pump()); await asyncio.sleep(.8)
        await send({'event_type': 'world_setup', 'world_prompt': text, 'reference_image': {'data': base64.b64encode(img).decode(), 'mime_type': 'image/jpeg'}})
        try:
            while t0[0] is None and not rd.done(): await asyncio.sleep(.05)
            for t, a, k in [(1, 'key_down', 'key_w'), (11, 'key_up', 'key_w'), (12, 'key_down', 'arrow_left'), (19.5, 'key_up', 'arrow_left')]:
                w = t - (time.monotonic() - t0[0])
                if w > 0: await asyncio.sleep(w)
                await send({'event_type': 'user_action', 'action': a, 'input': k})
            await asyncio.sleep(max(0, 20 - (time.monotonic() - t0[0])))
        finally:
            try: await send({'event_type': 'interaction.complete'}); await asyncio.wait_for(rd, 12)
            except Exception:
                try: await send({'event_type': 'interaction.cancel'})
                except Exception: pass
    d = f'{OUT}/street-{n:03d}'; os.makedirs(d, exist_ok=True)
    for i, (_, b) in enumerate(fr): Image.open(io.BytesIO(b)).convert('RGB').save(f'{d}/{i:05d}.jpg', quality=90)
    open(d + '.pcm', 'wb').write(pcm); fps = len(fr) / fr[-1][0]
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', f'{fps:.3f}', '-i', d + '/%05d.jpg', '-f', 's16le', '-ar', '48000', '-ac', '2', '-i', d + '.pcm',
                    '-vf', f"drawtext=text='zone {n:03d} {SHOTS[n][1]['district']}  |  %{{pts\\:hms}}  |  1-11s walk   12-19s turn':x=16:y=h-34:fontsize=20:fontcolor=white:box=1:boxcolor=black@0.5",
                    '-r', '24', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '23', '-c:a', 'aac', '-shortest', d + '.mp4'])
    import shutil; shutil.rmtree(d); os.remove(d + '.pcm')
    print(f'zone {n:03d}: {len(fr)} frames in {fr[-1][0]:.1f}s ({fps:.1f} fps) -> {d}.mp4', flush=True)
for i, n in enumerate(map(int, sys.argv[1:])):
    if i: time.sleep(34)
    asyncio.run(take(n))
