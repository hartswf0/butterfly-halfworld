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
  NOT VERIFIED (no key, no session has been run): how a genie interaction is created, the shape of the
    video and audio events that come back, and whether the WebSocket passes this environment's proxy.
    Those three live in open_session() and record(); expect to adjust them on the first real run.

Reads prompts.json (build_prompts.py). Writes a plan and, when live, a log under runs/."""
import argparse, asyncio, base64, io, json, os, re, sys, time

RATE = 0.10          # dollars a second, the preview figure quoted to us; unverified
GAP = 4.0            # seconds between anything we send as text
LEAD = 0.8           # send a cue this long before the patch starts, so it lands as he speaks
SESSION = 90.0       # reseed before this
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
        # walk through the patch, but stand still for the last second and a half so the next change lands in view
        still = 'stills' in x['water']
        if not still and x['end'] - x['t'] > 4:
            acts.append(dict(t=round(x['t'] + 1.0, 1), do='key', action='key_down', input='key_w', patch=x['id']))
            acts.append(dict(t=round(x['end'] - 1.5, 1), do='key', action='key_up', input='key_w', patch=x['id']))
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


def seed_image(p, limit=48_000):
    """First foundry reference, cropped to 16:9 and squeezed under the size the docs give for a seed image."""
    from PIL import Image
    refs = p['seeds']['refs']
    if not refs: return None, None
    path = os.path.normpath(os.path.join(HERE, refs[0]))
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
async def open_session(client, model):
    """NOT VERIFIED. The package shows connect(id) for an existing interaction but this file's author has not
    seen how a world-model interaction is created. Adjust here on the first real run."""
    created = await client.aio.interactions.create(model=model, background=True)       # assumption
    return created.id


def record(event, log, state):
    """NOT VERIFIED event shapes: keep everything raw, and remember the most recent thing that looks like a frame."""
    d = event.model_dump(exclude_none=True) if hasattr(event, 'model_dump') else dict(event)
    kind = d.get('event_type', '?')
    blob = json.dumps(d)
    if 'image' in blob[:400] or 'video' in blob[:400]: state['frame'] = d
    log.write(json.dumps(dict(at=round(time.monotonic() - state['t0'], 2), kind=kind, size=len(blob))) + '\n')
    return kind


async def live(ch, p, seed, acts, img, args):
    from google import genai
    client = genai.Client()                                  # key comes from the environment / proxy, never from this file
    os.makedirs(os.path.join(HERE, 'runs'), exist_ok=True)
    name = os.path.join(HERE, 'runs', f"{p['num']}-{args.eye}-{time.strftime('%Y%m%d-%H%M%S')}")
    state = dict(t0=time.monotonic(), frame=None, sent=0.0, corrections=0)
    sid = await open_session(client, args.model)
    hard_stop = args.max_seconds + 5
    async with client.aio.interactions.connect(sid) as conn, open(name + '.events.jsonl', 'w') as log:
        async def pump():
            async for ev in conn.receive():
                if record(ev, log, state) in ('interaction.completed', 'interaction.canceled'): return
        reader = asyncio.create_task(pump())
        try:
            for a in acts:
                wait = a['t'] - (time.monotonic() - state['t0'])
                if wait > 0: await asyncio.sleep(wait)
                if time.monotonic() - state['t0'] > hard_stop: break
                if a['do'] == 'world_setup':
                    ev = dict(event_type='world_setup', world_prompt=a['text'])
                    if img[0]: ev['reference_image'] = dict(data=base64.b64encode(img[0]).decode(), mime_type='image/jpeg')
                    await conn.send(ev)
                elif a['do'] == 'say':
                    await conn.send(a['text']); state['sent'] = time.monotonic()
                elif a['do'] == 'key':
                    await conn.send(dict(event_type='user_action', action=a['action'], input=a['input']))
                elif a['do'] == 'watch' and state['frame'] is not None and not args.no_director:
                    asyncio.create_task(direct(client, conn, a, state, args))
                elif a['do'] in ('complete', 'reseed'):
                    break                                    # one session per run; reseeding is a second run from the saved last frame
        finally:
            try:
                await conn.complete(); await asyncio.wait_for(reader, 10)
            except Exception:
                await conn.cancel()                          # never leave a session billing
    print('log:', name + '.events.jsonl')


async def direct(client, conn, a, state, args):
    """One look, at most one correction, and never within GAP of another text."""
    try:
        r = await client.aio.models.generate_content(model=args.director, contents=[a['prompt'], json.dumps(state['frame'])[:200_000]])
        m = re.search(r'\{.*\}', r.text or '', re.S); v = json.loads(m.group(0)) if m else {}
        if v.get('ok') is False and v.get('correction') and time.monotonic() - state['sent'] >= GAP and state['corrections'] < args.max_corrections:
            await conn.send(v['correction']); state['sent'] = time.monotonic(); state['corrections'] += 1
    except Exception as e:
        print('director skipped:', type(e).__name__, e)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--poem', default='03'); ap.add_argument('--eye', choices=list(EYES), default='film')
    ap.add_argument('--max-seconds', type=float, default=30); ap.add_argument('--full', action='store_true', help='stage the whole reading in the dry run')
    ap.add_argument('--live', action='store_true'); ap.add_argument('--i-accept-the-cost', action='store_true')
    ap.add_argument('--model', default='genie-4'); ap.add_argument('--director', default='gemini-3.8-flash')
    ap.add_argument('--no-director', action='store_true'); ap.add_argument('--max-corrections', type=int, default=3)
    ap.add_argument('--json', help='write the staged plan to this file')
    args = ap.parse_args()
    ch, p = load(args.poem)
    seed, acts = plan(ch, p, args.eye, None if (args.full and not args.live) else args.max_seconds)
    img = seed_image(p)
    show(p, seed, acts, img)
    if args.json: json.dump(dict(poem=p['num'], eye=args.eye, seed=seed, actions=acts), open(args.json, 'w'), ensure_ascii=False, indent=1)
    if not args.live: print('\nDRY RUN. Nothing was sent and nothing was spent.'); return
    if not args.i_accept_the_cost: sys.exit(f"\nRefusing to go live without --i-accept-the-cost (this run is capped at {args.max_seconds:.0f} s, about ${args.max_seconds * RATE:.2f}).")
    asyncio.run(live(ch, p, seed, acts, img, args))


if __name__ == '__main__':
    main()
