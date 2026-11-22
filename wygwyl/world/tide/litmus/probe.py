#!/usr/bin/env python3
"""One probe = one question about the model. Each has a hypothesis written BEFORE it runs, the exact text sent, the keys
pressed, and yes/no checks. Everything is appended to log.json so the notebook can show prompt, reasoning and result together.
    GEMINI_API_KEY=... python3 litmus/probe.py sheet plan life spin"""
import asyncio, base64, io, json, os, re, shutil, ssl, subprocess, sys, time, urllib.request, websockets
from PIL import Image, ImageChops, ImageStat
H = os.path.dirname(os.path.abspath(__file__)); KEY = os.environ['GEMINI_API_KEY']; OUT = H + '/out'
URL = 'wss://generativelanguage.googleapis.com/v1beta/interactions/live'; CTX = ssl.create_default_context(cafile=os.environ.get('SSL_CERT_FILE'))
MAN = "A Black man in his thirties with close-cropped hair, wearing a matte black mock-neck long sleeve, black trousers and black boots"
PROBES = {
 'sheet': dict(seed='sheet_naraka.jpg', secs=12, keys=[(1, 'key_down', 'key_w'), (10, 'key_up', 'key_w')],
   question="Can a contact sheet of four views be given as one seed, so the model builds one territory from all four?",
   hypothesis="Probably not: it takes exactly one starting frame, so I expect it to treat the sheet as a picture of four panels, or to enter one panel and discard the rest.",
   text="This picture is a reference sheet: four views of the same district of one city, a night market built from shipping containers with alleys and a flooded underpass. Begin standing inside that district at eye level, in a single continuous place that contains all four views nearby. Do not show panels or borders.",
   checks={'one_scene': 'The frame shows one continuous scene, not a grid of separate panels with borders.'}),
 'plan': dict(seed='plan.jpg', secs=12, keys=[(1, 'key_down', 'key_w'), (10, 'key_up', 'key_w')],
   question="Can a map of the territory be the seed, with the camera dropped into it?",
   hypothesis="Unlikely to become street level; I expect it to stay a map and slide over it like a flat picture.",
   text="This picture is a map of an island city seen from above. Begin standing on the ground inside this city at eye level, on a street near the harbour, looking along the street. Do not show the map.",
   checks={'street_level': 'The camera is at ground level among buildings or terrain, not looking down at a map.'}),
 'life': dict(seed='street020.jpg', secs=14, keys=[(1, 'key_down', 'key_w'), (12, 'key_up', 'key_w')],
   question="If the seed text demands exaggerated life, does the street fill with action without any mid-take cue?",
   hypothesis="Yes: the seed text is the strongest lever we have found, so crowd, motion and weather asked for here should appear and persist.",
   text=MAN + " walks away from us down the middle of a night market street built from shipping containers; the camera follows behind him at eye level. The street is wildly alive: a dense crowd of Black women and men of every age in bright teal, orange and white wraps and coats dancing and carrying baskets, children running, banners snapping overhead, sparks rising from grills, flocks of birds wheeling, lanterns swinging, water running down the gutters. Everything moves, all the time.",
   checks={'crowd': 'There is a dense crowd of many people (more than ten) in the street.', 'man_from_behind': 'A man in black seen from behind is the main figure.'}),
 'spin': dict(seed='plaza008.jpg', secs=22, keys=[(1, 'key_down', 'arrow_left'), (21, 'key_up', 'arrow_left')],
   question="If the camera turns steadily in one direction, does it come back round to the place it started?",
   hypothesis="It will keep inventing new city rather than close the circle: nothing we have seen suggests it remembers what is behind it.",
   text="A wet stone plaza in an Afrofuturist harbour city, with a tall terracotta temple and an arched doorway. The camera stands still at eye level in the middle of the plaza and only turns.",
   checks={'temple_visible': 'A tall orange or terracotta building with a large arched doorway is visible.'}),
}
def judge(pics, checks):
    parts = [{'text': 'For each frame answer each statement true or false, by looking only.\n' + '\n'.join(f'{k}: {v}' for k, v in checks.items()) + '\nJSON only: {"frames":[{"frame":1,' + ','.join(f'"{k}":true' for k in checks) + '}]}'}]
    for i, im in enumerate(pics):
        b = io.BytesIO(); im.resize((768, 432)).save(b, 'JPEG', quality=80); parts += [{'text': f'FRAME {i + 1}'}, {'inline_data': {'mime_type': 'image/jpeg', 'data': base64.b64encode(b.getvalue()).decode()}}]
    for m in ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-4-hydrogen']:
        try:
            rq = urllib.request.Request(f'https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent', headers={'x-goog-api-key': KEY, 'content-type': 'application/json'},
                 data=json.dumps({'contents': [{'parts': parts}], 'generationConfig': {'responseMimeType': 'application/json', 'temperature': 0}}).encode())
            r = json.load(urllib.request.urlopen(rq, timeout=60, context=CTX)); return json.loads(re.search(r'\{.*\}', r['candidates'][0]['content']['parts'][0]['text'], re.S).group(0))['frames']
        except Exception as e: err = str(e)[:80]; time.sleep(3)
    return [{'error': err}]
async def take(name):
    p = PROBES[name]; img = open(f'{H}/seeds/{p["seed"]}', 'rb').read()
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
        await send({'event_type': 'world_setup', 'world_prompt': p['text'], 'reference_image': {'data': base64.b64encode(img).decode(), 'mime_type': 'image/jpeg'}})
        try:
            while t0[0] is None and not rd.done(): await asyncio.sleep(.05)
            for t, a, k in p['keys']:
                w = t - (time.monotonic() - t0[0])
                if w > 0: await asyncio.sleep(w)
                await send({'event_type': 'user_action', 'action': a, 'input': k})
            await asyncio.sleep(max(0, p['secs'] - (time.monotonic() - t0[0])))
        finally:
            try: await send({'event_type': 'interaction.complete'}); await asyncio.wait_for(rd, 12)
            except Exception:
                try: await send({'event_type': 'interaction.cancel'})
                except Exception: pass
    d = f'{OUT}/probe-{name}'; os.makedirs(d, exist_ok=True)
    for i, (_, b) in enumerate(fr): Image.open(io.BytesIO(b)).convert('RGB').save(f'{d}/{i:05d}.jpg', quality=90)
    open(d + '.pcm', 'wb').write(pcm); fps = len(fr) / fr[-1][0]; dur = fr[-1][0]
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', f'{fps:.3f}', '-i', d + '/%05d.jpg', '-f', 's16le', '-ar', '48000', '-ac', '2', '-i', d + '.pcm',
                    '-vf', f"drawtext=text='probe {name}  %{{pts\\:hms}}':x=16:y=16:fontsize=20:fontcolor=white:box=1:boxcolor=black@0.55", '-r', '24', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '25', '-c:a', 'aac', '-shortest', d + '.mp4'])
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', d + '.mp4', '-vf', f'fps=6/{dur:.2f},scale=384:216,tile=6x1', '-frames:v', '1', d + '.jpg'])
    at = lambda s: Image.open(io.BytesIO(min(fr, key=lambda f: abs(f[0] - s))[1])).convert('RGB'); ts = [0.5, dur / 2, dur - .5]; pics = [at(s) for s in ts]
    ans = judge(pics, p['checks']); sm = lambda im: im.convert('L').resize((96, 54)); diff = lambda a, b: round(ImageStat.Stat(ImageChops.difference(sm(a), sm(b))).mean[0], 1)
    rec = dict(id=f'probe-{name}', date=time.strftime('%Y-%m-%d %H:%M'), question=p['question'], hypothesis=p['hypothesis'], seed_image='seeds/' + p['seed'], text_sent=p['text'],
               keys=[f'{t}s {a} {k}' for t, a, k in p['keys']], seconds=round(dur, 1), frames=len(fr), checks=p['checks'], judged=[dict(t=round(t, 1), **a) for t, a in zip(ts, ans)],
               first_vs_last=diff(pics[0], pics[2]), first_vs_middle=diff(pics[0], pics[1]), video=f'out/probe-{name}.mp4', strip=f'out/probe-{name}.jpg')
    lp = H + '/log.json'; log = json.load(open(lp)) if os.path.exists(lp) else []; log = [x for x in log if x['id'] != rec['id']] + [rec]; json.dump(log, open(lp, 'w'), indent=1, ensure_ascii=False)
    shutil.rmtree(d); os.remove(d + '.pcm'); print(name, len(fr), 'frames', json.dumps(rec['judged']), 'first-vs-last', rec['first_vs_last'], 'first-vs-middle', rec['first_vs_middle'], flush=True)
for i, n in enumerate(sys.argv[1:]):
    if i: time.sleep(34)
    asyncio.run(take(n))
