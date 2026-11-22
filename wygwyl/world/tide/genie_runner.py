#!/usr/bin/env python3
"""Stage one poem into a real-time world model, with a director model watching in a loop.

    python3 genie_runner.py --poem 03                  # dry run: print the staged plan, spend nothing
    python3 genie_runner.py --poem 03 --eye watcher    # same poem seen by a small hovering witness
    python3 genie_runner.py --poem 03 --live --max-seconds 30 --i-accept-the-cost

What is verified and what is not
  VERIFIED against the google-genai 3.6.1 package source (not against a running service):
    - events: {"event_type": "world_setup", "world_prompt": str, "reference_image": {"data": b64, "mime_type": ...}}
              {"event_type": "user_action", "action": "key_down"|"key_up"|"key_click", "input": "key_w"|...}
    - client.aio.interactions.connect(id) -> async context; .send(), .receive(), .complete(), .cancel()
    - closing the socket does NOT end the session server-side; complete() or cancel() does.
  CONFIRMED by a real 18-second session (poem 03): session creation, world setup with a seed image, mid-session
    text, key events, the video and audio that come back, and a clean completion. See live() for the shapes.
  NOT YET SEEN: a session longer than 18 s, the director's corrections taking effect, and reseeding a second session.
  The key is read from GEMINI_API_KEY in the environment and is never written to a file.

Reads prompts.json (build_prompts.py). Writes a plan and, when live, a log under runs/."""
import argparse, asyncio, base64, io, json, os, re, sys, time

RATE = 0.10          # dollars a second, the preview figure quoted to us; unverified
GAP = 4.0            # seconds between anything we send as text
LEAD = 0.8           # send a cue this long before the patch starts, so it lands as he speaks
SESSION = 90.0       # reseed before this
WALK = 2.0           # seconds of walking after a change of place
STALE = 6.0          # a director's answer older than this is thrown away
HERE = os.path.dirname(os.path.abspath(__file__))

EYES = {
    'film': None,   # the measured lens and height already in the seed
    'body': "EYE. First person, from the Poet's own eyes at 1.6 m. His hands and matte black sleeves enter the bottom of the frame. "
            "The view shakes slightly with his steps and stops when he stops. He cannot see behind him. Breath is audible.",
    'watcher': "EYE. A small hovering witness, the size of a bird, two metres behind and one metre above the Poet. It drifts, it is moved by weather, "
               "it dips toward surfaces and pauses at thresholds. It never rises to a map view and never flies ahead of him.",
}

DIRECTOR = """You are the director of a real-time world model. You are shown one frame and a checklist.
You cannot repaint the world; you can only send ONE short line of direction, or nothing.

HOLD (the riverbed; if any of this is wrong, correct it):
{hold}

MAY VARY (the flow; never correct these):
{vary}

OPERATION for this passage: {operation}

Look at the frame. Answer in JSON only:
{{"ok": true|false, "missing": ["what from HOLD is absent or wrong"], "correction": "one present-tense line, 14 words or fewer, or empty"}}
Rules: every person you mention is stated with gender, race and outfit. Never ask for a cut. Never add a new object.
If the frame is acceptable, say ok and send nothing: an unnecessary correction causes drift."""


def load(poem):
    d = json.load(open(os.path.join(HERE, 'prompts.json')))
    p = next((x for x in d['poems'] if x['num'] == poem), None)
    if not p: sys.exit(f'no poem {poem}')
    return d['characters'], p


def people_tags(ch, ids):
    return [f"{q['name']}: {q['race']} {q['gender']}, {q['outfit']}" for q in ch['people'] if q['id'] in ids]


def plan(ch, p, eye='film', max_seconds=None):
    """Turn a poem's patches into timed actions. Pure function of the data: nothing is sent."""
    seed = p['seed']
    if EYES[eye]: seed = re.sub(r'^EYE\..*$', EYES[eye], seed, flags=re.M)
    acts, last_text, prev = [], -99.0, None
    sess_start = 0.0
    for i, x in enumerate(p['patches']):
        if max_seconds and x['t'] >= max_seconds: break
        t = max(0.0, x['t'] - LEAD)
        # reseed on a beat boundary once the session has run long
        if x['t'] - sess_start > SESSION - 10 and x['kind'] == 'BEAT':
            acts.append(dict(t=round(t, 1), do='reseed', note='complete the session; start a new one from its last frame', seed=seed))
            sess_start = x['t']
        entering = [q for q in x['people'] if not prev or q not in prev['people']]
        leaving = [q for q in (prev['people'] if prev else []) if q not in x['people']]
        delta = []
        if prev is None or x['here'] != prev['here']: delta.append(f"place → {x['here']}")
        if entering: delta.append('enters: ' + ', '.join(entering))
        if leaving: delta.append('leaves: ' + ', '.join(leaving))
        if prev is None or x['water'] != prev['water']: delta.append(f"water → {x['water']}")
        hold = people_tags(ch, x['people']) + [f"place: {x['here']} ({x['district']})"] + [f"visible: {s}" for s in x['see']]
        vary = [f"water: {x['water']}", f"light: {x['light']}", 'small movements of cloth, air and reflections']
        if i == 0:
            acts.append(dict(t=0.0, do='world_setup', text=seed, patch=x['id']))
        elif x['kind'] != 'HOLD' and t - last_text >= GAP:
            acts.append(dict(t=round(t, 1), do='say', text=x['cue'], patch=x['id'], delta=delta)); last_text = t
        else:
            acts.append(dict(t=round(t, 1), do='hold', patch=x['id'], delta=delta, note='nothing sent; his voice carries it'))
        # LEARNED from the first full take: walking all the way through every patch drove the camera into a wall and
        # the later cues never registered. So: a short walk only when the place has just changed, then stand.
        if x['kind'] != 'HOLD' and 'stills' not in x['water'] and x['end'] - x['t'] > 5:
            acts.append(dict(t=round(x['t'] + 1.5, 1), do='key', action='key_down', input='key_w', patch=x['id']))
            acts.append(dict(t=round(x['t'] + 1.5 + WALK, 1), do='key', action='key_up', input='key_w', patch=x['id']))
        # the director looks once per patch, after the world has had time to resolve the cue
        acts.append(dict(t=round(min(x['end'] - 1.0, x['t'] + 4.5), 1), do='watch', patch=x['id'],
                         prompt=DIRECTOR.format(hold='\n'.join('- ' + h for h in hold), vary='\n'.join('- ' + v for v in vary), operation=x['operation'])))
        prev = x
    end = min(max_seconds or 1e9, p['dur'])
    acts = [a for a in acts if a['t'] < end]                  # nothing is staged past the cap
    keys = [a for a in acts if a['do'] == 'key']
    if keys and keys[-1]['action'] == 'key_down': acts.append(dict(t=round(end - .2, 1), do='key', action='key_up', input='key_w', patch=keys[-1]['patch']))
    acts.append(dict(t=round(end, 1), do='complete', note='end the session server-side so billing stops'))
    acts.sort(key=lambda a: (a['t'], {'reseed': 0, 'world_setup': 1, 'say': 2, 'hold': 2, 'key': 3, 'watch': 4, 'complete': 5}[a['do']]))
    return seed, acts


STARTUP = 3.6        # MEASURED: seconds from world_setup to the first frame; the film's zero, and the reading's zero
LATENCY = 3.0        # MEASURED on one cue in the first take: seconds from sending a line to the world visibly changing
MINGAP = 3.5


def plan_sheet(p, sheet, max_seconds=None):
    """Stage a hand-written cue sheet: each cue lands on the word that names it; walking follows his speech."""
    L = json.load(open(os.path.join(HERE, 'tide.json')))['poems'][int(p['num']) - 1]['lines']
    acts = [dict(t=0.0, do='world_setup', text=sheet['seed'], patch='seed')]; last = -99.0; rows = []
    for c in sheet['cues']:
        l = L[c['line']]; ws = [w for w in l['words'] if re.sub(r'\W', '', w[0].lower()).startswith(c['word'].lower())]
        land = ws[0][1] if ws else l['t0']                       # reading clock
        t = max(land + STARTUP - LATENCY, last + MINGAP, 0.6); last = t
        late = (t - STARTUP + LATENCY) - land
        acts.append(dict(t=round(t, 1), do='say', text=c['send'], patch=f"L{c['line']}", delta=[]))
        rows.append(dict(line=c['line'], word=c['word'], land=round(land, 1), sent=round(t, 1), late=round(late, 1), send=c['send'], intent=c['intent']))
    for l in L:                                                  # walk while he speaks, stand in his silences
        d = l['t1'] - l['t0']; w = min(3.0, 0.4 * d)
        acts.append(dict(t=round(l['t0'] + STARTUP, 1), do='key', action='key_down', input='key_w', patch=''))
        acts.append(dict(t=round(l['t0'] + STARTUP + w, 1), do='key', action='key_up', input='key_w', patch=''))
    end = min(max_seconds or 1e9, p['dur'] + STARTUP + 1.5)
    acts = [a for a in acts if a['t'] < end]; acts.append(dict(t=round(end, 1), do='complete', note='end the session'))
    acts.sort(key=lambda a: a['t'])
    return acts, rows


def seed_image(p, limit=48_000):
    """First foundry reference, cropped to 16:9 and squeezed under the size the docs give for a seed image."""
    from PIL import Image
    refs = p['seeds']['refs']; pk = os.path.join(HERE, 'seed_picks.json')
    picks = json.load(open(pk)) if os.path.exists(pk) else {}
    best = picks.get(p['num'], {}).get('paths', {}).get(picks.get(p['num'], {}).get('best'))
    if not best and not refs: return None, None
    path = os.path.normpath(os.path.join(HERE, best or refs[0]))
    im = Image.open(path).convert('RGB'); w, h = im.size; tw = min(w, int(h * 16 / 9)); th = int(tw * 9 / 16)
    im = im.crop(((w - tw) // 2, (h - th) // 2, (w + tw) // 2, (h + th) // 2)).resize((1280, 720), Image.LANCZOS)
    for q in range(80, 15, -5):
        buf = io.BytesIO(); im.save(buf, 'JPEG', quality=q)
        if buf.tell() <= limit: return buf.getvalue(), path
    return buf.getvalue(), path


def show(p, seed, acts, img):
    dur = acts[-1]['t']
    print(f"POEM {p['num']} · {p['title']} · {dur:.0f} s staged · about ${dur * RATE:.2f} at ${RATE:.2f}/s (unverified rate)")
    print(f"seed text {len(seed.split())} words · seed image {img[1] if img[1] else 'none'} ({len(img[0]) // 1024 if img[0] else 0} KB)")
    c = {}
    for a in acts: c[a['do']] = c.get(a['do'], 0) + 1
    print('actions:', ', '.join(f"{v} {k}" for k, v in c.items()), '\n')
    for a in acts:
        line = f"{a['t']:6.1f}  {a['do']:<11} {a.get('patch', ''):<4} "
        if a['do'] == 'world_setup': line += f"[{len(a['text'].split())} words + image]"
        elif a['do'] == 'say': line += a['text'][:110] + ('…' if len(a['text']) > 110 else '') + ('   Δ ' + '; '.join(a['delta']) if a['delta'] else '')
        elif a['do'] == 'key': line += f"{a['action']} {a['input']}"
        elif a['do'] == 'watch': line += 'director looks at one frame'
        elif a['do'] == 'hold': line += a['note'] + ('   Δ ' + '; '.join(a['delta']) if a['delta'] else '')
        else: line += a.get('note', '')
        print(line)


# ---------------------------------------------------------------------------------------------- live
URL = 'wss://generativelanguage.googleapis.com/v1beta/interactions/live'
REST = 'https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent'


async def live(ch, p, seed, acts, img, args):
    """One session. CONFIRMED on the live service (poem 03, 18 s): frames arrive as bytes holding JSON; a session is
    opened with interaction.create; world_setup starts generation about 4 s later; video comes as step.delta events of
    type "video" (one 1280x720 JPEG 2000 frame each, 24 a second) and type "audio" (48 kHz stereo 16-bit PCM);
    mid-session text is {"event_type": "input", "content": [{"type": "text", "text": ...}]}; interaction.complete
    ends it and returns token usage."""
    import ssl, websockets
    key = os.environ['GEMINI_API_KEY']; ctx = ssl.create_default_context(cafile=os.environ.get('SSL_CERT_FILE'))
    run = os.path.join(HERE, 'runs', f"{p['num']}-{args.eye}-{time.strftime('%Y%m%d-%H%M%S')}"); os.makedirs(run + '/jp2')
    st = dict(t0=None, frames=0, last=None, sent=-99.0, corrections=0, usage=None, notes=[])
    pcm = open(run + '/world.pcm', 'wb'); log = open(run + '/log.jsonl', 'w')
    note = lambda **k: (log.write(json.dumps(dict(at=round(time.monotonic() - (st['t0'] or time.monotonic()), 2), **k), ensure_ascii=False) + '\n'), log.flush())
    async with websockets.connect(URL, additional_headers={'x-goog-api-key': key}, ssl=ctx, open_timeout=25, max_size=None) as ws:
        send = lambda ev: ws.send(json.dumps(ev))
        async def pump():
            async for raw in ws:
                d = json.loads(raw.decode() if isinstance(raw, bytes) else raw)
                for e in (d.get('events') or [d]):
                    k = e.get('event_type'); dl = e.get('delta') or {}
                    if k == 'step.delta' and dl.get('type') == 'video':
                        st['frames'] += 1; st['last'] = base64.b64decode(dl['data'])
                        open(f"{run}/jp2/{st['frames']:05d}.jp2", 'wb').write(st['last'])
                        if st['frames'] == 1: note(event='first frame'); st['f0'] = time.monotonic()
                        st['f1'] = time.monotonic()
                    elif k == 'step.delta' and dl.get('type') == 'audio': pcm.write(base64.b64decode(dl['data']))
                    elif k == 'interaction.completed': st['usage'] = e.get('usage'); note(event=k, usage=e.get('usage')); return
                    elif k in ('interaction.cancelled', 'error'): note(event=k, body=e); return
                    elif k not in ('step.delta',): note(event=k)
        async def direct(a):
            """One look at the newest frame; at most one short correction; never within GAP of another line."""
            asked = time.monotonic()
            try:
                from PIL import Image
                im = Image.open(io.BytesIO(st['last'])).convert('RGB'); im.thumbnail((512, 512)); buf = io.BytesIO(); im.save(buf, 'JPEG', quality=75)
                body = dict(contents=[dict(parts=[dict(text=a['prompt']), dict(inline_data=dict(mime_type='image/jpeg', data=base64.b64encode(buf.getvalue()).decode()))])],
                            generationConfig=dict(responseMimeType='application/json', temperature=0))
                def call():
                    import urllib.request
                    rq = urllib.request.Request(REST.format(args.director), data=json.dumps(body).encode(), headers={'x-goog-api-key': key, 'content-type': 'application/json'})
                    return json.load(urllib.request.urlopen(rq, timeout=20, context=ctx))
                r = await asyncio.get_running_loop().run_in_executor(None, call)
                v = json.loads(re.search(r'\{.*\}', r['candidates'][0]['content']['parts'][0]['text'], re.S).group(0))
                acted = False; age = time.monotonic() - asked
                # LEARNED: answers took 10-15 s and arrived about a patch late; one stale correction removed the choir.
                if age > STALE: note(event='director stale', patch=a['patch'], age=round(age, 1), would_have_sent=v.get('correction')); return
                if v.get('ok') is False and v.get('correction') and time.monotonic() - st['sent'] >= GAP and st['corrections'] < args.max_corrections and st['t0']:
                    await send(dict(event_type='input', content=[dict(type='text', text=v['correction'])])); st['sent'] = time.monotonic(); st['corrections'] += 1; acted = True
                note(event='director', patch=a['patch'], ok=v.get('ok'), missing=v.get('missing'), correction=v.get('correction'), sent=acted)
            except Exception as e:
                note(event='director skipped', patch=a['patch'], why=f'{type(e).__name__}: {str(e)[:120]}')
        await send(dict(event_type='interaction.create', model=args.model))
        reader = asyncio.create_task(pump()); tasks = []
        try:
            await asyncio.sleep(0.8)
            for a in acts:
                if st['t0']:
                    w = a['t'] - (time.monotonic() - st['t0'])
                    if w > 0: await asyncio.sleep(w)
                    if reader.done() or time.monotonic() - st['t0'] > args.max_seconds + 3: break
                if a['do'] == 'world_setup':
                    ev = dict(event_type='world_setup', world_prompt=a['text'])
                    if img[0]: ev['reference_image'] = dict(data=base64.b64encode(img[0]).decode(), mime_type='image/jpeg')
                    await send(ev); st['t0'] = time.monotonic(); note(event='world_setup', words=len(a['text'].split()), image=img[1])
                elif a['do'] == 'say':
                    await send(dict(event_type='input', content=[dict(type='text', text=a['text'])])); st['sent'] = time.monotonic(); note(event='say', patch=a['patch'], text=a['text'])
                elif a['do'] == 'key': await send(dict(event_type='user_action', action=a['action'], input=a['input']))
                elif a['do'] == 'watch' and st['last'] and not args.no_director: tasks.append(asyncio.create_task(direct(a)))
                elif a['do'] in ('complete', 'reseed'): break
        finally:
            try:
                await send(dict(event_type='interaction.complete')); await asyncio.wait_for(reader, 15)
            except Exception:
                try: await send(dict(event_type='interaction.cancel'))          # never leave a session billing
                except Exception: pass
            for t in tasks:
                if not t.done(): t.cancel()
    pcm.close(); log.close()
    print(f"\nframes {st['frames']} ({st['frames'] / 24:.1f} s) · corrections sent {st['corrections']} · usage {json.dumps(st['usage'])[:200]}")
    # LEARNED: frames do not arrive at 24 a second (17.3 and 22.4 in the first takes). Encode at the rate they came.
    fps = max(1.0, (st['frames'] - 1) / max(.1, st.get('f1', 1) - st.get('f0', 0)))
    print(f'delivered at {fps:.1f} frames a second')
    finish(run, p, fps)


def finish(run, p, frames):
    """Turn the saved frames and sound into two films: the world alone, and the world under his reading."""
    import subprocess
    from PIL import Image
    os.makedirs(run + '/f', exist_ok=True)
    for f in sorted(os.listdir(run + '/jp2')):
        Image.open(f'{run}/jp2/{f}').convert('RGB').save(f"{run}/f/{f[:-4]}.jpg", quality=90)
    q = ['ffmpeg', '-y', '-loglevel', 'error', '-framerate', f'{frames:.3f}', '-i', run + '/f/%05d.jpg', '-f', 's16le', '-ar', '48000', '-ac', '2', '-i', run + '/world.pcm']
    subprocess.run(q + ['-r', '24', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-c:a', 'aac', '-shortest', run + '/world.mp4'])
    voice = os.path.normpath(os.path.join(HERE, '../..', json.load(open(os.path.join(HERE, 'tide.json')))['poems'][int(p['num']) - 1]['audio']))
    if os.path.exists(voice):          # generation starts about four seconds after setup, so the film's zero is the reading's zero
        subprocess.run(q + ['-i', voice, '-filter_complex', '[1:a]volume=0.45[w];[w][2:a]amix=inputs=2:duration=first:normalize=0[a]', '-map', '0:v', '-map', '[a]', '-r', '24',
                            '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-c:a', 'aac', '-shortest', run + '/with_voice.mp4'])
    import shutil; shutil.rmtree(run + '/jp2')
    print('take:', run)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--poem', default='03'); ap.add_argument('--eye', choices=list(EYES), default='film')
    ap.add_argument('--max-seconds', type=float, default=30); ap.add_argument('--full', action='store_true', help='stage the whole reading in the dry run')
    ap.add_argument('--live', action='store_true'); ap.add_argument('--i-accept-the-cost', action='store_true')
    ap.add_argument('--model', default='genie-4'); ap.add_argument('--director', default='gemini-3.8-flash')
    ap.add_argument('--no-director', action='store_true'); ap.add_argument('--max-corrections', type=int, default=3)
    ap.add_argument('--sheet', action='store_true', help='use the hand-written cue sheet in cues/NN.json')
    ap.add_argument('--json', help='write the staged plan to this file')
    args = ap.parse_args()
    ch, p = load(args.poem)
    sp = os.path.join(HERE, 'cues', args.poem + '.json')
    if args.sheet and os.path.exists(sp):
        sheet = json.load(open(sp)); acts, rows = plan_sheet(p, sheet, args.max_seconds if args.live else None)
        img = (open(os.path.join(HERE, sheet['seed_image']), 'rb').read(), sheet['seed_image']); seed = sheet['seed']; args.no_director = True
        if len(img[0]) > 48_000:
            from PIL import Image
            im = Image.open(io.BytesIO(img[0]))
            for q in range(80, 15, -5):
                b = io.BytesIO(); im.save(b, 'JPEG', quality=q)
                if b.tell() <= 48_000: break
            img = (b.getvalue(), sheet['seed_image'])
        print(f"POEM {p['num']} · {p['title']} · cue sheet · lead {LATENCY}s · {acts[-1]['t']:.0f}s · about ${acts[-1]['t'] * RATE:.2f}\n")
        for r in rows: print(f"  line {r['line']} · lands on “{r['word']}” at {r['land']:5.1f}s · sent {r['sent']:5.1f}" + (f" · {r['late']}s late" if r['late'] > .3 else '') + f"\n      SEND   {r['send']}\n      INTENT {r['intent']}")
        json.dump(rows, open(os.path.join(HERE, 'cues', args.poem + '.staged.json'), 'w'), ensure_ascii=False, indent=1)
        if not args.live: print('\nDRY RUN. Nothing was sent and nothing was spent.'); return
        if not args.i_accept_the_cost: sys.exit('Refusing to go live without --i-accept-the-cost.')
        args.eye = 'sheet'; asyncio.run(live(ch, p, seed, acts, img, args)); return
    seed, acts = plan(ch, p, args.eye, None if (args.full and not args.live) else args.max_seconds)
    img = seed_image(p)
    show(p, seed, acts, img)
    if args.json: json.dump(dict(poem=p['num'], eye=args.eye, seed=seed, actions=acts), open(args.json, 'w'), ensure_ascii=False, indent=1)
    if not args.live: print('\nDRY RUN. Nothing was sent and nothing was spent.'); return
    if not args.i_accept_the_cost: sys.exit(f"\nRefusing to go live without --i-accept-the-cost (this run is capped at {args.max_seconds:.0f} s, about ${args.max_seconds * RATE:.2f}).")
    asyncio.run(live(ch, p, seed, acts, img, args))


if __name__ == '__main__':
    main()
