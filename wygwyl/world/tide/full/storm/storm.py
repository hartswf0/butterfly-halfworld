#!/usr/bin/env python3
"""One Genie 4 session from a seed picture with timed text beats and W held: GEMINI_API_KEY=... python3 full/storm/storm.py full/storm/storm.json
Writes full/storm/out-<time>/: film.mp4, verify.mp4 (each beat on screen while it is in force), manifest.json, sheet.jpg."""
import asyncio, base64, io, json, os, ssl, subprocess, sys, time, websockets
from PIL import Image
T = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))); K = os.environ['GEMINI_API_KEY']; CTX = ssl.create_default_context(cafile=os.environ.get('SSL_CERT_FILE'))
S = json.load(open(sys.argv[1])); im = Image.open(f"{T}/{S['seed_image']}").convert('RGB')
for q in range(85, 15, -5):
    b = io.BytesIO(); im.save(b, 'JPEG', quality=q)
    if b.tell() <= 48000: break
img = b.getvalue(); out = f"{T}/full/storm/out-{time.strftime('%m%d-%H%M')}"; os.makedirs(out + '/f')
async def go():
    fr, pcm, sent, t0 = [], bytearray(), [], [None]
    async with websockets.connect('wss://generativelanguage.googleapis.com/v1beta/interactions/live', additional_headers={'x-goog-api-key': K}, ssl=CTX, max_size=None) as ws:
        send = lambda e: ws.send(json.dumps(e))
        async def pump():
            async for raw in ws:
                d = json.loads(raw)
                for e in (d.get('events') or [d]):
                    dl = e.get('delta') or {}
                    if dl.get('type') == 'video':
                        if t0[0] is None: t0[0] = time.monotonic()
                        fr.append(base64.b64decode(dl['data']))
                    elif dl.get('type') == 'audio': pcm.extend(base64.b64decode(dl['data']))
                    elif e.get('event_type') in ('interaction.completed', 'interaction.cancelled', 'error'): sent.append(dict(at=None, server=e)); return
        await send({'event_type': 'interaction.create', 'model': 'genie-4'}); rd = asyncio.create_task(pump()); await asyncio.sleep(.8)
        await send({'event_type': 'world_setup', 'world_prompt': S['world'], 'reference_image': {'data': base64.b64encode(img).decode(), 'mime_type': 'image/jpeg'}})
        while t0[0] is None and not rd.done(): await asyncio.sleep(.05)
        if t0[0] is None: raise SystemExit('no video: ' + json.dumps(sent)[:300])
        acts = sorted([(S['hold_w'][0], 'down'), (S['hold_w'][1], 'up')] + [(t, x) for t, x in S['beats']])
        try:
            for t, a in acts:
                w = t - (time.monotonic() - t0[0])
                if w > 0: await asyncio.sleep(w)
                if rd.done(): break
                at = round(time.monotonic() - t0[0], 2)
                if a in ('down', 'up'): await send({'event_type': 'user_action', 'action': 'key_' + a, 'input': 'key_w'}); sent.append(dict(at=at, key=a))
                else: await send({'event_type': 'input', 'content': [{'type': 'text', 'text': a}]}); sent.append(dict(at=at, text=a))
            await asyncio.sleep(max(0, S['seconds'] - (time.monotonic() - t0[0])))
        finally:
            try: await send({'event_type': 'interaction.complete'}); await asyncio.wait_for(rd, 15)
            except Exception: pass
    return fr, pcm, sent, time.monotonic() - t0[0]
fr, pcm, sent, dur = asyncio.run(go())
for i, x in enumerate(fr): Image.open(io.BytesIO(x)).convert('RGB').save(f'{out}/f/{i:05d}.jpg', quality=90)
open(out + '/w.pcm', 'wb').write(pcm); fps = len(fr) / dur; secs = len(fr) / fps
json.dump(dict(spec=S, events_sent=sent, frames=len(fr), seconds=round(secs, 1), fps=round(fps, 2)), open(out + '/manifest.json', 'w'), indent=1, ensure_ascii=False)
base = ['ffmpeg', '-y', '-loglevel', 'error', '-framerate', f'{fps:.3f}', '-i', out + '/f/%05d.jpg', '-f', 's16le', '-ar', '48000', '-ac', '2', '-i', out + '/w.pcm']
enc = ['-r', '24', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '22', '-c:a', 'aac', '-shortest']
subprocess.run(base + ['-map', '0:v', '-map', '1:a'] + enc + [out + '/film.mp4'])
tx = [s for s in sent if 'text' in s]; f = lambda s: f"{int(s // 3600):02d}:{int(s % 3600 // 60):02d}:{s % 60:06.3f}".replace('.', ',')
open(out + '/sent.srt', 'w').write('\n'.join(f"{i + 1}\n{f(c['at'])} --> {f(tx[i + 1]['at'] if i + 1 < len(tx) else secs)}\nsent {c['at']}s: {c['text']}\n" for i, c in enumerate(tx)))
subprocess.run(base + ['-vf', f"drawtext=text='%{{pts\\:hms}}':x=16:y=16:fontsize=20:fontcolor=white:box=1:boxcolor=black@0.55,subtitles={out}/sent.srt:force_style='FontSize=11,Outline=1,MarginV=12'", '-map', '0:v', '-map', '1:a'] + enc + [out + '/verify.mp4'])
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', out + '/film.mp4', '-vf', f'fps=16/{secs:.2f},scale=320:180,tile=8x2', '-frames:v', '1', out + '/sheet.jpg'])
subprocess.run(['rm', '-rf', out + '/f', out + '/w.pcm']); print(len(fr), 'frames', round(secs, 1), 's', [s.get('server', {}).get('event_type') for s in sent if 'server' in s]); print('OUT', out)
