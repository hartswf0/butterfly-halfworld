#!/usr/bin/env python3
"""Proof of driving: one take, no text after the start, a fixed key schedule, and the key being held burned into the video.
Still segments between keys are the control. Motion is measured per segment.   GEMINI_API_KEY=... python3 litmus/drive.py"""
import asyncio, base64, io, json, os, shutil, ssl, subprocess, time, websockets
from PIL import Image, ImageChops, ImageStat
H = os.path.dirname(os.path.abspath(__file__)); T = os.path.dirname(H); KEY = os.environ['GEMINI_API_KEY']
URL = 'wss://generativelanguage.googleapis.com/v1beta/interactions/live'; CTX = ssl.create_default_context(cafile=os.environ.get('SSL_CERT_FILE'))
S = json.load(open(T + '/full/10ride.json'))
TEXT = f"{S['styles']['greyfig']} {S['third_person']} {S['character']} Night. He sits still on the motorcycle and moves only when driven."
SEG = [(0, 3, None), (3, 7, 'key_w'), (7, 10, None), (10, 14, 'arrow_left'), (14, 17, None), (17, 21, 'arrow_right'), (21, 24, None), (24, 28, 'key_s'), (28, 30, None)]
async def take():
    img = open(T + '/full/seeds10/greyfig1.jpg', 'rb').read()
    if len(img) > 48000:
        im = Image.open(io.BytesIO(img))
        for q in range(80, 15, -5):
            b = io.BytesIO(); im.save(b, 'JPEG', quality=q)
            if b.tell() <= 48000: break
        img = b.getvalue()
    fr = []; t0 = [None]; sent = []
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
                    elif e.get('event_type') in ('interaction.completed', 'interaction.cancelled', 'error'): return
        await send({'event_type': 'interaction.create', 'model': 'genie-4'}); rd = asyncio.create_task(pump()); await asyncio.sleep(.8)
        await send({'event_type': 'world_setup', 'world_prompt': TEXT, 'reference_image': {'data': base64.b64encode(img).decode(), 'mime_type': 'image/jpeg'}})
        try:
            while t0[0] is None and not rd.done(): await asyncio.sleep(.05)
            for a, b, k in SEG:
                await asyncio.sleep(max(0, a - (time.monotonic() - t0[0])))
                if k: await send({'event_type': 'user_action', 'action': 'key_down', 'input': k}); sent.append((round(time.monotonic() - t0[0], 2), 'down', k))
                await asyncio.sleep(max(0, b - (time.monotonic() - t0[0])))
                if k: await send({'event_type': 'user_action', 'action': 'key_up', 'input': k}); sent.append((round(time.monotonic() - t0[0], 2), 'up', k))
        finally:
            try: await send({'event_type': 'interaction.complete'}); await asyncio.wait_for(rd, 12)
            except Exception:
                try: await send({'event_type': 'interaction.cancel'})
                except Exception: pass
    return fr, sent
fr, sent = asyncio.run(take()); d = H + '/out/drive'; os.makedirs(d, exist_ok=True)
ims = [Image.open(io.BytesIO(b)).convert('RGB') for _, b in fr]
for i, im in enumerate(ims): im.save(f'{d}/{i:05d}.jpg', quality=90)
fps = len(fr) / fr[-1][0]; sm = [im.convert('L').resize((160, 90)) for im in ims]; ts = [t for t, _ in fr]; rows = []
for a, b, k in SEG:
    ix = [i for i, t in enumerate(ts) if a + .7 <= t < b]                       # skip 0.7 s of settling after each change
    if len(ix) < 3: continue
    mot = sum(ImageStat.Stat(ImageChops.difference(sm[i], sm[i - 1])).mean[0] for i in ix[1:]) / (len(ix) - 1)
    A, B = sm[ix[0]], sm[ix[-1]]; top = (40, 5, 120, 45)                         # sky and skyline band: shifts when the view turns
    dx = min(range(-36, 37), key=lambda s: ImageStat.Stat(ImageChops.difference(A.crop(top), B.crop((top[0] + s, top[1], top[2] + s, top[3])))).mean[0])
    rows.append(dict(seconds=f'{a}-{b}', key=k or 'none', motion_per_frame=round(mot, 2), skyline_shift_px=dx * 8)); print(rows[-1], flush=True)
dt = ','.join(f"drawtext=text='{(k or 'NO KEY').upper().replace('_', ' ')}':x=(w-text_w)/2:y=30:fontsize=44:fontcolor={'yellow' if k else 'white'}:box=1:boxcolor=black@0.6:enable='between(t,{a},{b})'" for a, b, k in SEG)
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', f'{fps:.3f}', '-i', d + '/%05d.jpg', '-vf', dt + ",drawtext=text='%{pts\\:hms}':x=16:y=h-36:fontsize=20:fontcolor=white:box=1:boxcolor=black@0.55",
                '-r', '24', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '23', H + '/out/drive.mp4'])
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', H + '/out/drive.mp4', '-vf', 'fps=1/3,scale=384:216,tile=10x1', '-frames:v', '1', H + '/out/drive.jpg'])
shutil.rmtree(d); json.dump(dict(text_sent=TEXT, keys_sent=sent, segments=rows, frames=len(fr), fps=round(fps, 1)), open(H + '/out/drive.json', 'w'), indent=1)
