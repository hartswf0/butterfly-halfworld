#!/usr/bin/env python3
"""A poem as short shots cut on his lines. One session per line, text-only seeds sharing one lock.
    GEMINI_API_KEY=... python3 full/shots.py 12
Writes film.mp4, verify.mp4 (shot number + timecode burned in), manifest.json (every seed text), critic.json, sheet.jpg."""
import asyncio, base64, io, json, os, re, shutil, ssl, subprocess, sys, time, urllib.request, websockets
from PIL import Image
T = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); KEY = os.environ['GEMINI_API_KEY']
URL = 'wss://generativelanguage.googleapis.com/v1beta/interactions/live'; CTX = ssl.create_default_context(cafile=os.environ.get('SSL_CERT_FILE'))
num, style, nshots = sys.argv[1], sys.argv[2], int(sys.argv[3]); S = json.load(open(f'{T}/full/{num}ride.json')); S['shots'] = S['shots'][:nshots]; P = json.load(open(T + '/tide.json'))['poems'][int(num) - 1]; L = P['lines']
VOICE = os.path.normpath(os.path.join(T, '../..', P['audio'])); sl = S['start_lines']; cuts = [0.0] + [L[i]['t0'] for i in sl[1:nshots]] + [L[sl[nshots]]['t0'] if nshots < len(sl) else P['dur']]
async def shot(i, secs, out):
    s = S['shots'][i]; text = f"{S['styles'][style]} {S['third_person']} {S['character']} ACTION: {s['action']}"; img = open(f'{T}/full/seeds10/{style}{i + 1}.jpg', 'rb').read()
    if len(img) > 48000:
        im = Image.open(io.BytesIO(img))
        for q in range(80, 15, -5):
            b = io.BytesIO(); im.save(b, 'JPEG', quality=q)
            if b.tell() <= 48000: break
        img = b.getvalue()
    fr = []; t0 = [None]; pcm = bytearray()
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
            if s['key']: await asyncio.sleep(1.0); await send({'event_type': 'user_action', 'action': 'key_down', 'input': s['key']})
            await asyncio.sleep(max(0, secs - 1.2 - (time.monotonic() - t0[0])))
            if s['key']: await send({'event_type': 'user_action', 'action': 'key_up', 'input': s['key']})
            await asyncio.sleep(max(0, secs + .4 - (time.monotonic() - t0[0])))
        finally:
            try: await send({'event_type': 'interaction.complete'}); await asyncio.wait_for(rd, 12)
            except Exception:
                try: await send({'event_type': 'interaction.cancel'})
                except Exception: pass
    d = f'{out}/s{i}'; os.makedirs(d)
    for k, (_, b) in enumerate(fr): Image.open(io.BytesIO(b)).convert('RGB').save(f'{d}/{k:05d}.jpg', quality=90)
    open(d + '.pcm', 'wb').write(pcm); fps = len(fr) / fr[-1][0]
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', f'{fps:.3f}', '-i', d + '/%05d.jpg', '-f', 's16le', '-ar', '48000', '-ac', '2', '-i', d + '.pcm', '-t', f'{secs:.3f}',
                    '-vf', f"drawtext=text='shot {i + 1}/{len(S['shots'])}':x=16:y=16:fontsize=20:fontcolor=white:box=1:boxcolor=black@0.55", '-r', '24', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-c:a', 'aac', '-ar', '48000', d + 'v.mp4'])
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', f'{fps:.3f}', '-i', d + '/%05d.jpg', '-f', 's16le', '-ar', '48000', '-ac', '2', '-i', d + '.pcm', '-t', f'{secs:.3f}',
                    '-r', '24', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-c:a', 'aac', '-ar', '48000', d + '.mp4'])
    mid = Image.open(io.BytesIO(min(fr, key=lambda f: abs(f[0] - secs * .6))[1])).convert('RGB'); mid.save(f'{out}/mid{i}.jpg', quality=88)
    shutil.rmtree(d); os.remove(d + '.pcm'); print(f'shot {i + 1}: {len(fr)} frames, {fps:.1f} fps, {secs:.1f}s', flush=True)
    return dict(shot=i + 1, seed_image=f'full/seeds10/{style}{i + 1}.jpg', line=' '.join(l['text'] for l in L[sl[i]:(sl[i + 1] if i + 1 < len(sl) else len(L))]), t0=round(cuts[i], 2), seconds=round(secs, 2), seed_text=text, key=s['key'], frames=len(fr), delivered_fps=round(fps, 1))
out = f"{T}/full/out/{num}ride-{style}-{time.strftime('%m%d-%H%M')}"; os.makedirs(out); man = []
for i in range(len(S['shots'])):
    if i: time.sleep(31)
    man.append(asyncio.run(shot(i, cuts[i + 1] - cuts[i], out)))
for tag, name in (('', 'film'), ('v', 'verify')):
    open(out + '/list.txt', 'w').write(''.join(f"file 's{i}{tag}.mp4'\n" for i in range(len(man))))
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', out + '/list.txt', '-i', VOICE, '-filter_complex',
                    "[0:a]volume=0.4[w];[w][1:a]amix=inputs=2:duration=first:normalize=0[a]" + (";[0:v]drawtext=text='%{pts\\:hms}':x=w-150:y=16:fontsize=20:fontcolor=white:box=1:boxcolor=black@0.55[v]" if tag else ''),
                    '-map', '[v]' if tag else '0:v', '-map', '[a]', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '24', '-c:a', 'aac', out + f'/{name}.mp4'])
pics = [Image.open(f'{out}/mid{i}.jpg') for i in range(len(man))]; sh = Image.new('RGB', (4 * 484, 2 * 274), '#061433')
for i, im in enumerate(pics): sh.paste(im.resize((480, 270)), ((i % 4) * 484, (i // 4) * 274))
sh.save(out + '/sheet.jpg', quality=85)
parts = [{'text': "You are reviewing a short film made of several shots. You have not seen how it was made. For each shot answer: seen = one plain sentence; "
          "third_person = true only if a man is seen from behind, whole body visible, in the lower-middle of the frame, like a third-person video game; on_bike = true if he is on or beside a motorcycle; "
          "same_man = true if he looks like the same man as in SHOT 1 (dark clothes, same build); style = one or two words for the visual style (e.g. grey-box, cel cartoon, photoreal, painted); enacts = 0-3 for how strongly the image enacts its line. "
          "Then overall = two strict sentences: is the third-person view and the style consistent across the shots, and what is the biggest weakness. "
          'JSON only: {"shots":[{"shot":1,"seen":"","third_person":true,"on_bike":true,"same_man":true,"style":"","enacts":0}],"overall":""}'}]
for i, im in enumerate(pics):
    b = io.BytesIO(); im.resize((768, 432)).save(b, 'JPEG', quality=80); parts += [{'text': f'SHOT {i + 1}, line: “{man[i]["line"]}”'}, {'inline_data': {'mime_type': 'image/jpeg', 'data': base64.b64encode(b.getvalue()).decode()}}]
v = dict(shots=[], overall='critic unavailable')
for m in ['gemini-4-argon', 'gemini-3.8-flash', 'gemini-flash-latest']:
    try:
        rq = urllib.request.Request(f'https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent', headers={'x-goog-api-key': KEY, 'content-type': 'application/json'},
             data=json.dumps({'contents': [{'parts': parts}], 'generationConfig': {'responseMimeType': 'application/json', 'temperature': 0}}).encode())
        r = json.load(urllib.request.urlopen(rq, timeout=120, context=CTX)); v = json.loads(re.search(r'\{.*\}', r['candidates'][0]['content']['parts'][0]['text'], re.S).group(0)); v['critic_model'] = m; break
    except Exception as e: time.sleep(4)
json.dump(v, open(out + '/critic.json', 'w'), indent=1, ensure_ascii=False); json.dump(dict(poem=num, style=style, shots=man), open(out + '/manifest.json', 'w'), indent=1, ensure_ascii=False)
for f in os.listdir(out):
    if re.match(r's\d+v?\.mp4|mid\d|list', f): os.remove(f'{out}/{f}')
for x in v['shots']: print(f"  shot {x['shot']} 3rd {'Y' if x['third_person'] else '-'} bike {'Y' if x['on_bike'] else '-'} same {'Y' if x['same_man'] else '-'} style {x['style']:<12} enacts {x['enacts']}  {x['seen'][:90]}")
print('CRITIC', v.get('critic_model'), ':', v['overall']); print('OUT', out)
