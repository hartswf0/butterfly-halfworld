#!/usr/bin/env python3
"""The word-to-world test. Third person: the Poet walks; his reading plays; each cue is a change to the world that travels
through blue water, sent early so it lands on the word that causes it. One video per seed, with his voice, timecode and the
cue on screen.      GEMINI_API_KEY=... python3 litmus/poemwalk.py greybox cel020"""
import asyncio, base64, io, json, os, re, shutil, ssl, subprocess, sys, time, websockets
from PIL import Image
H = os.path.dirname(os.path.abspath(__file__)); KEY = os.environ['GEMINI_API_KEY']; OUT = H + '/out'; SECS = 62; LEAD = 3.0
URL = 'wss://generativelanguage.googleapis.com/v1beta/interactions/live'; CTX = ssl.create_default_context(cafile=os.environ.get('SSL_CERT_FILE'))
P = json.load(open(H + '/../tide.json'))['poems'][5]; L = P['lines']; VOICE = os.path.normpath(os.path.join(H, '../../..', P['audio']))
MAN = ("A Black man in his thirties with close-cropped hair, wearing a matte black mock-neck long sleeve, black trousers and black boots, "
       "stands a few steps ahead of the camera with his back to us and walks away from us at an easy pace. The camera is at eye level behind him and follows, keeping his whole body in frame.")
SEEDS = {'greybox': "A simple grey-box model of a harbour city at night: flat untextured blocks, a few lit yellow windows, a pale path leading down to dark water, moonlight on the water. " + MAN + " Keep the flat blocky untextured look until the water changes it. Ahead at the end of the path stand tall closed gates.",
         'cel020': "A flat cel-shaded cartoon street at dusk: large flat colour shapes with dark outlines, market stalls, soft pink and orange lights. " + MAN + " Keep the flat cel-shaded cartoon look with outlines throughout. Ahead at the end of the street stand tall closed gates."}
# word that causes it, what is sent, a short label, and why
CUES = [(0, 'gates', "Ahead of him, the tall gates swing open. They are white marble and have wings.", 'gates open, marble wings', "the poem's first image; the world opens on its first word"),
        (1, 'hymns', "Bright blue water made of small glowing white letters pours out through the open gates and runs down the path to his feet.", 'blue water of letters pours out', "words become water: what comes through the gate is language, as liquid"),
        (2, 'yellow', "Where the blue water touches the ground, the ground becomes a road of yellow bricks, laid one by one ahead of him as he walks.", 'water lays a yellow brick road', "'eased generations down yellow brick roads': the water is what builds the road"),
        (3, 'comets', "Comets cross the night sky above him, and their light runs in lines across the water.", 'comets overhead', "'to follow comets to the capital city'"),
        (4, 'resurrecting', "The blue water rises to his knees. Towers rise up out of the water on both sides of him, water streaming off them.", 'towers rise out of the water', "'resurrecting Atlantis': the city is what the water was hiding"),
        (4, 'nature', "Vines and trees grow up the wet towers. Everything the water has touched now has colour and detail.", 'nature climbs the towers', "'the pack we've made here with nature'"),
        (6, 'safe', "Windows light up one by one in blue and pink. In the doorways stand Black women and men of every age in long indigo and ochre robes, arms open to him.", 'windows light, people welcome him', "'here we are all safe, here we are all one': the city is finished when it is inhabited")]
def stage():
    acts = []; last = -9
    for li, word, text, lab, why in CUES:
        ws = [w for w in L[li]['words'] if re.sub(r'\W', '', w[0].lower()).startswith(word)]; land = ws[0][1] if ws else L[li]['t0']
        t = max(0.3, land - LEAD, last + 3.5); last = t; acts.append(dict(t=round(t, 1), land=round(land, 1), say=text, label=lab, word=word, why=why))
    for l in L:
        if l['t0'] < SECS - 3: acts += [dict(t=l['t0'] + .2, key='key_down'), dict(t=min(SECS - 2, l['t0'] + .6 * (l['t1'] - l['t0'])), key='key_up')]
    return sorted(acts, key=lambda a: a['t'])
async def take(name):
    img = open(f'{H}/seeds/{name}.jpg', 'rb').read()
    if len(img) > 48000:
        im = Image.open(io.BytesIO(img))
        for q in range(80, 15, -5):
            b = io.BytesIO(); im.save(b, 'JPEG', quality=q)
            if b.tell() <= 48000: break
        img = b.getvalue()
    fr = []; t0 = [None]; pcm = bytearray(); acts = stage()
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
        await send({'event_type': 'world_setup', 'world_prompt': SEEDS[name], 'reference_image': {'data': base64.b64encode(img).decode(), 'mime_type': 'image/jpeg'}})
        try:
            while t0[0] is None and not rd.done(): await asyncio.sleep(.05)
            for a in acts:
                w = a['t'] - (time.monotonic() - t0[0])
                if w > 0: await asyncio.sleep(w)
                if rd.done(): break
                if 'key' in a: await send({'event_type': 'user_action', 'action': a['key'], 'input': 'key_w'})
                else: await send({'event_type': 'input', 'content': [{'type': 'text', 'text': a['say']}]})
            await asyncio.sleep(max(0, SECS - (time.monotonic() - t0[0])))
        finally:
            try: await send({'event_type': 'interaction.complete'}); await asyncio.wait_for(rd, 12)
            except Exception:
                try: await send({'event_type': 'interaction.cancel'})
                except Exception: pass
    d = f'{OUT}/poemwalk-{name}'; os.makedirs(d, exist_ok=True)
    for i, (_, b) in enumerate(fr): Image.open(io.BytesIO(b)).convert('RGB').save(f'{d}/{i:05d}.jpg', quality=90)
    open(d + '.pcm', 'wb').write(pcm); fps = len(fr) / fr[-1][0]; cues = [a for a in acts if 'say' in a]
    box = "fontsize=20:fontcolor=white:box=1:boxcolor=black@0.55"
    vf = f"drawtext=text='{name}  %{{pts\\:hms}}':x=16:y=16:{box}," + ','.join(
        f"drawtext=text='sent {c['t']}s for the word {c['word']} at {c['land']}s - {c['label']}':x=16:y=h-36:{box}:enable='between(t,{c['t']},{(cues[i + 1]['t'] if i + 1 < len(cues) else SECS)})'" for i, c in enumerate(cues))
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', f'{fps:.3f}', '-i', d + '/%05d.jpg', '-f', 's16le', '-ar', '48000', '-ac', '2', '-i', d + '.pcm', '-i', VOICE,
                    '-filter_complex', f"[0:v]{vf}[v];[1:a]volume=0.4[w];[w][2:a]amix=inputs=2:duration=first:normalize=0[a]", '-map', '[v]', '-map', '[a]',
                    '-r', '24', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '24', '-c:a', 'aac', '-shortest', d + '.mp4'])
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', d + '.mp4', '-vf', 'fps=1/5,scale=384:216,tile=6x2', '-frames:v', '1', d + '.jpg'])
    shutil.rmtree(d); os.remove(d + '.pcm'); json.dump(cues, open(d + '.cues.json', 'w'), indent=1)
    print(f'{name}: {len(fr)} frames in {fr[-1][0]:.1f}s ({fps:.1f} fps) -> {d}.mp4', flush=True)
if __name__ == '__main__':
    for i, n in enumerate(sys.argv[1:]):
        if i: time.sleep(34)
        asyncio.run(take(n))
