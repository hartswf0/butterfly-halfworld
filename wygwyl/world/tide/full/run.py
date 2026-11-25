#!/usr/bin/env python3
"""One full poem, one continuous session, his whole reading.
    GEMINI_API_KEY=... python3 full/run.py 06
Writes into full/out/NN-<time>/:
  film.mp4       the take with his reading over the world's sound
  verify.mp4     the same with timecode and every sent line on screen while it is in force
  manifest.json  seed image hash, seed text, every event actually sent with the second it left, frames, tokens
  critic.json    an independent model's reading of the frames, made WITHOUT seeing what was sent"""
import asyncio, base64, hashlib, io, json, os, re, shutil, ssl, subprocess, sys, time, urllib.request, websockets
from PIL import Image
T = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); KEY = os.environ['GEMINI_API_KEY']; LEAD = 3.5
URL = 'wss://generativelanguage.googleapis.com/v1beta/interactions/live'; CTX = ssl.create_default_context(cafile=os.environ.get('SSL_CERT_FILE'))
num = sys.argv[1]; SPEC = sys.argv[2] if len(sys.argv) > 2 else num; S = json.load(open(f'{T}/full/{SPEC}.json')); P = json.load(open(T + '/tide.json'))['poems'][int(num) - 1]; L = P['lines']
VOICE = os.path.normpath(os.path.join(T, '../..', P['audio'])); SECS = min(116.0, P['dur'] + 2)
def stage():
    acts = []; last = -9
    for c in S['cues']:
        ws = [w for w in L[c['line']]['words'] if re.sub(r'\W', '', w[0].lower()).startswith(c['word'])]; land = ws[0][1] if ws else L[c['line']]['t0']
        t = max(0.3, land - LEAD, last + 4.0); last = t; acts.append(dict(t=round(t, 1), land=round(land, 1), word=c['word'], line=c['line'], say=c['send']))
    for i, l in enumerate(L[:-1] if S.get('walk', True) else []): acts += [dict(t=l['t0'] + .2, key='key_down'), dict(t=l['t0'] + .55 * (l['t1'] - l['t0']), key='key_up')]
    for d, u in S.get('keys', []): acts += [dict(t=d, key='key_down'), dict(t=u, key='key_up')]   # held pushes at set seconds (a slow dolly in)
    return sorted(acts, key=lambda a: a['t'])
async def take(out):
    img = open(f'{T}/{S["seed_image"]}', 'rb').read() if S.get('seed_image') else b''
    if len(img) > 48000:
        im = Image.open(io.BytesIO(img))
        for q in range(80, 15, -5):
            b = io.BytesIO(); im.save(b, 'JPEG', quality=q)
            if b.tell() <= 48000: break
        img = b.getvalue()
    seed = S['world_lock'] + ' ' + S['seed']; fr = []; t0 = [None]; pcm = bytearray(); sent = []; usage = [None]
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
                    elif e.get('event_type') == 'interaction.completed': usage[0] = e.get('usage'); return
                    elif e.get('event_type') in ('interaction.cancelled', 'error'): sent.append(dict(at=None, server=e)); return
        await send({'event_type': 'interaction.create', 'model': 'genie-4'}); rd = asyncio.create_task(pump()); await asyncio.sleep(.8)
        ws_ev = {'event_type': 'world_setup', 'world_prompt': seed}
        if img: ws_ev['reference_image'] = {'data': base64.b64encode(img).decode(), 'mime_type': 'image/jpeg'}
        await send(ws_ev)
        try:
            while t0[0] is None and not rd.done(): await asyncio.sleep(.05)
            for a in stage():
                w = a['t'] - (time.monotonic() - t0[0])
                if w > 0: await asyncio.sleep(w)
                if rd.done(): break
                at = round(time.monotonic() - t0[0], 2)
                if 'key' in a: await send({'event_type': 'user_action', 'action': a['key'], 'input': 'key_w'}); sent.append(dict(at=at, key=a['key']))
                else: await send({'event_type': 'input', 'content': [{'type': 'text', 'text': a['say']}]}); sent.append(dict(at=at, text=a['say'], for_word=a['word'], word_at=a['land'], line=a['line']))
            await asyncio.sleep(max(0, SECS - (time.monotonic() - t0[0])))
        finally:
            try: await send({'event_type': 'interaction.complete'}); await asyncio.wait_for(rd, 15)
            except Exception:
                try: await send({'event_type': 'interaction.cancel'})
                except Exception: pass
    os.makedirs(out + '/f')
    for i, (_, b) in enumerate(fr): Image.open(io.BytesIO(b)).convert('RGB').save(f'{out}/f/{i:05d}.jpg', quality=90)
    open(out + '/w.pcm', 'wb').write(pcm); dur = fr[-1][0]; fps = len(fr) / dur; cues = [s for s in sent if 'text' in s]
    json.dump(dict(poem=num, title=P['title'], model='genie-4', seed_image=S['seed_image'], seed_image_sha256=hashlib.sha256(img).hexdigest() if img else None, seed_why=S['seed_why'], seed_text=seed,
                   events_sent=sent, frames=len(fr), seconds=round(dur, 1), delivered_fps=round(fps, 2), usage=usage[0], reading=P['audio']), open(out + '/manifest.json', 'w'), indent=1, ensure_ascii=False)
    base = ['ffmpeg', '-y', '-loglevel', 'error', '-framerate', f'{fps:.3f}', '-i', out + '/f/%05d.jpg', '-f', 's16le', '-ar', '48000', '-ac', '2', '-i', out + '/w.pcm', '-i', VOICE]
    mix = "[1:a]volume=0.4[w];[w][2:a]amix=inputs=2:duration=first:normalize=0[a]"; enc = ['-r', '24', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '24', '-c:a', 'aac', '-shortest']
    subprocess.run(base + ['-filter_complex', mix, '-map', '0:v', '-map', '[a]'] + enc + [out + '/film.mp4'])
    srt = []
    for i, c in enumerate(cues):
        f = lambda s: f"{int(s // 3600):02d}:{int(s % 3600 // 60):02d}:{s % 60:06.3f}".replace('.', ',')
        srt.append(f"{i + 1}\n{f(c['at'])} --> {f(cues[i + 1]['at'] if i + 1 < len(cues) else dur)}\nsent {c['at']}s for “{c['for_word']}” ({c['word_at']}s): {c['text']}\n")
    open(out + '/sent.srt', 'w').write('\n'.join(srt))
    subprocess.run(base + ['-filter_complex', f"[0:v]drawtext=text='poem {num}  %{{pts\\:hms}}':x=16:y=16:fontsize=20:fontcolor=white:box=1:boxcolor=black@0.55," + (f"subtitles={out}/sent.srt:force_style='FontSize=11,Outline=1,MarginV=12'" if cues else 'null') + f"[v];" + mix,
                           '-map', '[v]', '-map', '[a]'] + enc + [out + '/verify.mp4'])
    return fr, dur, cues
def critic(fr, dur, out):
    """Fresh context: sees one frame from the middle of each spoken line and the line itself. Never sees what we sent."""
    at = lambda s: Image.open(io.BytesIO(min(fr, key=lambda f: abs(f[0] - s))[1])).convert('RGB')
    rows = [(i, l, min(dur - .5, (l['t0'] + l['t1']) / 2 + 1.5)) for i, l in enumerate(L)]
    parts = [{'text': "You are reviewing a film in which a poet's spoken lines are meant to transform the world around a walking man. Below is one frame per line, taken while that line is spoken, with the line. "
              "The man may be among other people. For each frame answer: seen = one plain sentence of what is visible; enacts = 0 to 3, how strongly the image enacts that line (0 unrelated, 1 loosely, 2 clearly, 3 strikingly); "
              "changed = true if the place is different in kind from the previous frame, not merely a new prop; man = true if a Black man in black clothing is clearly present in the frame. Be strict. "
              'Then overall = two sentences: does the world transform with the words, and what is the biggest weakness. JSON only: {"frames":[{"line":0,"seen":"","enacts":0,"changed":false,"man":true}],"overall":""}'}]
    for i, l, s in rows:
        b = io.BytesIO(); at(s).resize((640, 360)).save(b, 'JPEG', quality=78); parts += [{'text': f'LINE {i}: “{l["text"]}”'}, {'inline_data': {'mime_type': 'image/jpeg', 'data': base64.b64encode(b.getvalue()).decode()}}]
    for m in ['gemini-4-argon', 'gemini-3.8-flash', 'gemini-flash-latest']:
        try:
            rq = urllib.request.Request(f'https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent', headers={'x-goog-api-key': KEY, 'content-type': 'application/json'},
                 data=json.dumps({'contents': [{'parts': parts}], 'generationConfig': {'responseMimeType': 'application/json', 'temperature': 0}}).encode())
            r = json.load(urllib.request.urlopen(rq, timeout=120, context=CTX)); v = json.loads(re.search(r'\{.*\}', r['candidates'][0]['content']['parts'][0]['text'], re.S).group(0)); v['critic_model'] = m
            json.dump(v, open(out + '/critic.json', 'w'), indent=1, ensure_ascii=False); return v
        except Exception as e: err = f'{type(e).__name__} {str(e)[:100]}'; time.sleep(4)
    return dict(frames=[], overall='critic unavailable: ' + err)
out = f"{T}/full/out/{SPEC}-{time.strftime('%m%d-%H%M')}"; os.makedirs(out); fr, dur, cues = asyncio.run(take(out))
print(f"{len(fr)} frames, {dur:.1f}s, {len(cues)} lines sent"); v = critic(fr, dur, out)
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', out + '/film.mp4', '-vf', f'fps=14/{dur:.2f},scale=320:180,tile=7x2', '-frames:v', '1', out + '/sheet.jpg'])
shutil.rmtree(out + '/f'); os.remove(out + '/w.pcm')
for f in v['frames']: print(f"  line {f['line']:>2}  enacts {f['enacts']}  changed {'Y' if f['changed'] else '-'}  man {'Y' if f['man'] else '-'}  {f['seen'][:110]}")
print('CRITIC', v.get('critic_model'), ':', v['overall']); print('OUT', out)
