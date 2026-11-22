#!/usr/bin/env python3
"""Full triage of every world-model run: the seed, every line of text sent with its second, every key press, and for each
thing we asked for a key frame and an independent yes / partly / no. Also: did the picture move more while a key was held?
    GEMINI_API_KEY=... python3 triage/build.py        -> triage/index.html, triage/triage.json, triage/kf/*.jpg"""
import base64, glob, html, io, json, os, re, ssl, subprocess, sys, time, urllib.request
from PIL import Image, ImageChops, ImageStat
T = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); KEY = os.environ['GEMINI_API_KEY']; CTX = ssl.create_default_context(cafile=os.environ.get('SSL_CERT_FILE'))
J = lambda p: json.load(open(os.path.join(T, p))); TIDE = J('tide.json'); KF = T + '/triage/kf'; TMP = '/tmp/claude-0/triage'; os.makedirs(TMP, exist_ok=True)
class Src:
    def __init__(s, path, dur=None):
        s.path = os.path.join(T, path)
        if os.path.isdir(s.path): s.fs = sorted(glob.glob(s.path + '/*.jpg')); s.dur = dur
        else: s.fs = None; s.dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', s.path], capture_output=True, text=True).stdout)
    def at(s, t):
        t = max(0.2, min(s.dur - 0.3, t))
        if s.fs: return Image.open(s.fs[min(len(s.fs) - 1, int(t / s.dur * len(s.fs)))]).convert('RGB')
        o = TMP + '/f.jpg'; subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', f'{t:.2f}', '-i', s.path, '-frames:v', '1', o]); return Image.open(o).convert('RGB')
    def small(s):
        if not hasattr(s, '_sm'):
            n = int(s.dur * 4); s._sm = [s.at((i + .5) / 4).convert('L').resize((96, 54)) for i in range(n)] if s.fs else None
            if s._sm is None:
                d = TMP + '/sm'; subprocess.run(['rm', '-rf', d]); os.makedirs(d); subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', s.path, '-vf', 'fps=4,scale=96:54', d + '/%05d.png'])
                s._sm = [Image.open(f).convert('L') for f in sorted(glob.glob(d + '/*.png'))]
        return s._sm
    def motion(s, a, b):
        sm = s.small(); ix = range(max(1, int(a * 4) + 2), min(len(sm), int(b * 4)))
        return round(sum(ImageStat.Stat(ImageChops.difference(sm[i], sm[i - 1])).mean[0] for i in ix) / len(ix), 2) if len(ix) > 1 else None
RUNS = []
def run(id, title, src, seed_text, seed_image=None, sent=(), asks=(), keys=(), keys_logged=True, note='', prior=None):
    RUNS.append(dict(id=id, title=title, src=src, seed_text=seed_text, seed_image=seed_image, sent=list(sent), asks=list(asks), keys=list(keys), keys_logged=keys_logged, note=note, prior=prior))
pairs = lambda ev: [(a['at'], b['at'], 'key_w') for a, b in zip([e for e in ev if e.get('key') == 'key_down'], [e for e in ev if e.get('key') == 'key_up'])]
# ---- poem 03, two early takes (frames kept on disk; 'at' in the log is seconds after setup, the film starts at the first frame)
for name, title, seedsrc in (('03-film-20261121-232051', 'Poem 03 take 1: generated patch cues + director', 'prompts'), ('03-sheet-20261121-233235', 'Poem 03 take 2: from the lectern, hand-written cues', 'sheet')):
    lg = [json.loads(x) for x in open(f'{T}/runs/{name}/log.jsonl')]; ff = next(x['at'] for x in lg if x['event'] == 'first frame'); end = next(x['at'] for x in lg if x['event'] == 'interaction.completed')
    sent = [dict(t=round(x['at'] - ff, 1), text=x['text'], by='script') for x in lg if x['event'] == 'say'] + [dict(t=round(x['at'] - ff, 1), text=x['correction'], by='director model') for x in lg if x['event'] == 'director' and x.get('sent')]
    sent.sort(key=lambda x: x['t'])
    if seedsrc == 'prompts': seed = next(p for p in J('prompts.json')['poems'] if p['num'] == '03')['seed']; img = '../foundry/refs/03-06.jpg'; kn = 'W held for most of every patch (as scheduled; individual presses were not logged in this run)'
    else: c = J('cues/03.json'); seed = c['seed']; img = c['seed_image']; kn = 'W held for the first 40% of each spoken line, at most 3 s (as scheduled; not logged)'
    run(name[:8], title, Src(f'runs/{name}/f', end - ff), seed, img, sent, [dict(t=x['t'] + 5, claim=x['text'], ref=i) for i, x in enumerate(sent)], keys_logged=False, note=kn)
# ---- litmus door / walker: no video kept, only the three check frames and the judge's answers
tests = J('litmus/tests.json')['tests']
for name in ('door', 'walker'):
    r = J(f'litmus/out/{name}-result.json'); t = tests[name]
    run('litmus-' + name, f'Litmus: {name} (2 takes)', None, t['seed'], None, [dict(t=t['script'][1]['t'], text=t['script'][1]['say'], by='script')], keys_logged=False, note='W held 0.5–14 s (as scheduled). No video was kept; only three frames per take.',
        prior=[dict(strip=f'../litmus/out/{x["strip"]}', rows=[dict(t=c['t'], claim=c['q'].replace('_', ' '), verdict='yes' if c['ok'] else 'no') for c in x['checks']]) for x in r['runs']])
c = J('litmus/out/controls.json')
run('litmus-controls', 'Key test, first person (4 takes, no text)', None, tests['door']['seed'], None, note='One key held 1–7 s per take. Measured: overall change and sideways shift between the first and last frame.',
    prior=[dict(strip='../litmus/out/controls.jpg', rows=[dict(t='1–7', claim=f"key {x['key']}", verdict=f"change {x['change']}, shift {x['shift_px']} px") for x in c['takes']])])
# ---- street x3
os.environ.setdefault('GEMINI_API_KEY', KEY); sys.argv = ['x']; sys.path.insert(0, T + '/litmus'); import street, poemwalk
for n in (20, 91, 98):
    run(f'street-{n:03d}', f'Street walk, zone {n:03d}', Src(f'litmus/out/street-{n:03d}.mp4'), street.seed(n)[1], None, asks=[dict(t=6, claim='A Black man in black clothing, seen from behind, is walking away from the camera.'), dict(t=10, claim='He has moved further into the place than at the start (walking has carried him forward).'), dict(t=18, claim='After the camera turned, the same man is still in frame.')],
        keys=[(1, 11, 'key_w'), (12, 19.5, 'arrow_left')], keys_logged=False, note='Keys as scheduled (not individually logged).')
# ---- word-to-world walks
for name in ('greybox', 'cel020'):
    cu = J(f'litmus/out/poemwalk-{name}.cues.json'); st = poemwalk.stage(); ks = [(a['t'], b['t'], 'key_w') for a, b in zip([x for x in st if x.get('key') == 'key_down'], [x for x in st if x.get('key') == 'key_up'])]
    run('poemwalk-' + name, f'Word to world, poem 06 ({name})', Src(f'litmus/out/poemwalk-{name}.mp4'), poemwalk.SEEDS[name], f'litmus/seeds/{name}.jpg', [dict(t=x['t'], text=x['say'], by='script', word=x['word'], word_at=x['land']) for x in cu],
        [dict(t=x['land'] + 2.5, claim=x['say'], ref=i) for i, x in enumerate(cu)], ks, keys_logged=False, note='W for the first 60% of each line (as scheduled).')
# ---- probes
for r in J('litmus/log.json'):
    ks = [(float(a.split('s')[0]), float(b.split('s')[0]), a.split()[-1]) for a, b in zip(r['keys'][::2], r['keys'][1::2])]
    run(r['id'], 'Probe: ' + r['question'], Src('litmus/' + r['video']), r['text_sent'], 'litmus/' + r['seed_image'], asks=[dict(t=x['t'], claim=v) for x in r['judged'][1:] for k, v in r['checks'].items()], keys=ks, keys_logged=False, note='Hypothesis written before the run: ' + r['hypothesis'])
# ---- full takes
m = J('full/out/06-1122-0025/manifest.json'); tx = [e for e in m['events_sent'] if 'text' in e]
run('full-06', 'Poem 06, one continuous take', Src('full/out/06-1122-0025/film.mp4'), m['seed_text'], m['seed_image'], [dict(t=e['at'], text=e['text'], by='script', word=e['for_word'], word_at=e['word_at']) for e in tx], [dict(t=e['word_at'] + 2.5, claim=e['text'], ref=i) for i, e in enumerate(tx)], pairs(m['events_sent']))
m = J('full/out/12-1122-0036/manifest.json')
run('full-12', 'Poem 12, text only, no cues, no keys', Src('full/out/12-1122-0036/film.mp4'), m['seed_text'], None, asks=[dict(t=8, claim='Four Black men in their fifties in a hall with a WELCOME HOME banner, each holding a glowing hourglass.'), dict(t=14, claim='The men are hugging or laughing with heads thrown back.'),
    dict(t=25, claim='The camera is close, at chest height, inside the group of men.'), dict(t=36, claim='One man presses his ear to another man\'s chest.'), dict(t=46, claim='The daylight in the doorway has turned to blue dusk, clearly darker than at the start.'), dict(t=58, claim='The men have turned their hourglasses over or are walking out through the tall doors.'), dict(t=65, claim='The men are outside, walking toward a house with a lit porch, backs to camera.')], note='Everything asked for was in the opening text; nothing was sent afterwards.')
def shots(id, title, d, n_keys_from=None):
    m = J(f'full/out/{d}/manifest.json'); S10 = J('full/10ride.json'); L = TIDE['poems'][9]['lines']; sl = S10['start_lines']; cuts = [0.0] + [L[i]['t0'] for i in sl[1:]] + [TIDE['poems'][9]['dur']]
    t = 0; sent = []; asks = []; ks = []
    for s in m['shots']:
        sec = s.get('seconds') or (cuts[s['shot']] - cuts[s['shot'] - 1]); act = s['seed_text'].split('ACTION: ')[1].split(' CAMERA:')[0]
        sent.append(dict(t=round(t, 1), text=s['seed_text'], by=f"new session, shot {s['shot']}", img=s.get('seed_image')))
        asks.append(dict(t=t + .6 * sec, claim=act, ref=len(sent) - 1))
        if 'ride' in d: asks.append(dict(t=t + .6 * sec, claim='Third person: the man is seen from behind with his whole body and the motorcycle visible in the lower half of the frame.', ref=len(sent) - 1))
        if s['key']: ks.append((t + 1, t + sec - 1.2, s['key']))
        t += sec
    run(id, title, Src(f'full/out/{d}/film.mp4'), '(each shot has its own opening text; see the rows below)', None, sent, asks, ks, keys_logged=False, note='Keys as scheduled: held from 1 s into the shot until 1.2 s before its end.')
shots('shots-12', 'Poem 12 as nine shots', '12shots-1122-0105'); shots('ride-grey', 'Magic Ride, grey-box, eight shots', '10ride-grey-1122-0119'); shots('ride-cel', 'Magic Ride, cel-shaded, four shots', '10ride-cel-1122-0129'); shots('ride-greyfig', 'Magic Ride, grey-box with rider in the seed, two shots', '10ride-greyfig-1122-0135')
# ---- judge every ask from its key frame
def judge(frames):
    parts = [{'text': "For each numbered frame you are given one CLAIM about what should be visible. Look only at the frame. Answer happened = \"yes\" (clearly visible as described), \"partly\" (some of it, or weakly), or \"no\". "
              "Be strict: a related object in the wrong place or doing the wrong thing is \"partly\" at most. seen = one short plain sentence of what is actually in the frame. "
              'JSON only: {"frames":[{"n":1,"happened":"no","seen":""}]}'}]
    for i, (im, claim) in enumerate(frames):
        b = io.BytesIO(); im.resize((640, 360)).save(b, 'JPEG', quality=78); parts += [{'text': f'FRAME {i + 1}. CLAIM: {claim}'}, {'inline_data': {'mime_type': 'image/jpeg', 'data': base64.b64encode(b.getvalue()).decode()}}]
    for m in ['gemini-4-argon', 'gemini-3.8-flash', 'gemini-flash-latest', 'gemini-4-argon', 'gemini-3.8-flash']:
        try:
            rq = urllib.request.Request(f'https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent', headers={'x-goog-api-key': KEY, 'content-type': 'application/json'},
                 data=json.dumps({'contents': [{'parts': parts}], 'generationConfig': {'responseMimeType': 'application/json', 'temperature': 0}}).encode())
            r = json.load(urllib.request.urlopen(rq, timeout=150, context=CTX)); v = json.loads(re.search(r'\{.*\}', r['candidates'][0]['content']['parts'][0]['text'], re.S).group(0))['frames']
            if len(v) == len(frames): return v, m
        except Exception as e: time.sleep(5)
    return [dict(happened='unjudged', seen='the judging model was unavailable')] * len(frames), None
for r in RUNS:
    s = r['src']; r['judge'] = None
    if s and r['asks']:
        ims = [s.at(a['t']) for a in r['asks']]
        for i, (a, im) in enumerate(zip(r['asks'], ims)): a['kf'] = f"kf/{r['id']}-{i:02d}.jpg"; im.resize((384, 216)).save(f"{T}/triage/{a['kf']}", quality=72)
        res = []
        for k in range(0, len(ims), 14):
            v, m = judge([(im, a['claim']) for im, a in zip(ims[k:k + 14], r['asks'][k:k + 14])]); res += v; r['judge'] = m
        for a, v in zip(r['asks'], res): a['happened'] = v['happened']; a['seen'] = v['seen']
    r['key_rows'] = []
    if s and r['keys']:
        held = [(a, b) for a, b, _ in r['keys']]; gaps = []; p = 0.5
        for a, b in sorted(held):
            if a - p > 1.2: gaps.append((p, a))
            p = b + .5
        if s.dur - p > 1.2: gaps.append((p, s.dur))
        base = [s.motion(a, b) for a, b in gaps]; base = [x for x in base if x is not None]; r['still'] = round(sum(base) / len(base), 2) if base else None
        for a, b, k in r['keys']: r['key_rows'].append(dict(a=round(a, 1), b=round(b, 1), key=k, motion=s.motion(a, b)))
    r['dur'] = round(s.dur, 1) if s else None; r.pop('src'); print(r['id'], len(r['asks']), 'asks', {h: sum(a.get('happened') == h for a in r['asks']) for h in ('yes', 'partly', 'no')}, 'still', r.get('still'), [k['motion'] for k in r['key_rows']][:6], flush=True)
json.dump(RUNS, open(T + '/triage/triage.json', 'w'), indent=1, ensure_ascii=False)
# ---- page
e = html.escape; C = dict(yes='#9fe08a', partly='#ffd23f', no='#ff6b8b', unjudged='#93a7cc')
tot = {h: sum(a.get('happened') == h for r in RUNS for a in r['asks']) for h in C}; nsent = sum(len(r['sent']) for r in RUNS); nk = sum(len(r['key_rows']) for r in RUNS)
kcmp = [(k['motion'], r['still']) for r in RUNS for k in r['key_rows'] if k['motion'] is not None and r.get('still') is not None]; kmore = sum(m > st * 1.25 for m, st in kcmp)
rows = ''.join(f"<tr><td><a href='#{r['id']}'>{e(r['title'])}</a></td><td>{r['dur'] or '—'}</td><td>{len(r['sent'])}</td><td>{len(r['keys'])}</td>" + ''.join(f"<td style='color:{C[h]}'>{sum(a.get('happened') == h for a in r['asks']) or ''}</td>" for h in ('yes', 'partly', 'no'))
               + f"<td>{'' if r.get('still') is None else r['still']}</td><td>{' '.join(str(k['motion']) for k in r['key_rows'][:8])}</td></tr>" for r in RUNS)
secs = []
for r in RUNS:
    h = f"<section id='{r['id']}'><h2>{e(r['title'])}</h2><p class='m'>{e(r['note'])}{' · judged by ' + r['judge'] if r['judge'] else ''}</p>"
    if r['seed_image']: h += f"<img class='seed' loading='lazy' src='../{r['seed_image']}' alt='starting picture'>"
    h += f"<details><summary>Opening text sent ({len(r['seed_text'].split())} words)</summary><pre>{e(r['seed_text'])}</pre></details>"
    if r['asks']:
        h += "<div class='tw'><table><tr><th>Sent at</th><th>Asked for</th><th>Key frame</th><th>Happened?</th><th>What the judge saw</th></tr>"
        for a in r['asks']:
            sx = r['sent'][a['ref']] if 'ref' in a else None; when = f"{sx['t']} s<small>{e(sx['by'])}</small>" + (f"<small>for “{e(sx['word'])}” at {sx['word_at']} s</small>" if sx and 'word' in sx else '') if sx else 'in the opening text'
            h += f"<tr><td>{when}</td><td>{e(a['claim'][:420])}</td><td><img loading='lazy' src='{a['kf']}' alt='key frame'><small>frame at {a['t']:.1f} s</small></td><td style='color:{C[a['happened']]}'><b>{a['happened']}</b></td><td>{e(a['seen'])}</td></tr>"
        h += '</table></div>'
    for pr in r['prior'] or []:
        h += f"<img loading='lazy' src='{pr['strip']}' alt='frames'><div class='tw'><table><tr><th>Time</th><th>Check</th><th>Result</th></tr>" + ''.join(f"<tr><td>{x['t']}</td><td>{e(str(x['claim']))}</td><td>{e(str(x['verdict']))}</td></tr>" for x in pr['rows']) + '</table></div>'
    if r['key_rows']:
        h += f"<h3>Key presses{'' if r['keys_logged'] else ' (as scheduled)'} — movement in the picture while held; still segments in this take average {r.get('still')}</h3><div class='tw'><table><tr><th>Held</th><th>Key</th><th>Movement</th><th>Against still</th></tr>"
        for k in r['key_rows']:
            st = r.get('still'); v = '—' if not st or k['motion'] is None else ('more movement' if k['motion'] > st * 1.25 else 'less movement' if k['motion'] < st * .8 else 'about the same')
            h += f"<tr><td>{k['a']}–{k['b']} s</td><td>{k['key']}</td><td>{k['motion']}</td><td>{v}</td></tr>"
        h += '</table></div>'
    secs.append(h + '</section>')
open(T + '/triage/index.html', 'w').write(f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Triage · WYGWYL</title>
<style>*{{box-sizing:border-box;margin:0;padding:0}}body{{background:#061433;color:#eaf2ff;font:14.5px/1.5 "Iowan Old Style",Palatino,Georgia,serif}}main{{max-width:1180px;margin:0 auto;padding:18px 16px 70px}}a{{color:inherit}}
h1{{font-size:clamp(26px,5vw,38px);font-weight:400;margin:6px 0}}h2{{font-size:21px;font-weight:400;margin:38px 0 4px;padding-top:14px;border-top:1px solid rgba(234,242,255,.2)}}h3{{font:800 11px Helvetica,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#ffd23f;margin:16px 0 6px}}
p{{max-width:860px}}.m,.note{{color:#93a7cc}}.tw{{overflow-x:auto;margin-top:8px}}table{{border-collapse:collapse;width:100%;min-width:760px}}th{{font:800 10px Helvetica,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#93a7cc;text-align:left}}
th,td{{padding:7px 12px 7px 0;border-bottom:1px solid rgba(234,242,255,.14);vertical-align:top}}td img{{width:192px;display:block}}img.seed{{width:240px;margin:8px 0;border:1px solid rgba(234,242,255,.2)}}section>img{{max-width:100%;margin-top:8px}}
small{{display:block;font:11px Helvetica,Arial,sans-serif;color:#93a7cc}}pre{{white-space:pre-wrap;background:#0b1e47;padding:10px 12px;font:12px/1.5 ui-monospace,Menlo,monospace;margin-top:6px}}summary{{cursor:pointer;color:#7fe0ff;font:13px Helvetica,Arial,sans-serif}}
.big{{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin:14px 0}}.big div{{background:#0b1e47;padding:10px 12px}}.big b{{display:block;font-size:26px;font-weight:400}}.big span{{font:11px Helvetica,Arial,sans-serif;color:#93a7cc}}</style></head><body><main>
<div class="m">WYGWYL · THE TIDELINE</div><h1>Triage — every prompt, every key press, and whether it happened</h1>
<p class="note">{len(RUNS)} runs. For each thing we asked the world model for, this page shows when it was sent, a key frame from when it should be visible, and an independent model's strict yes / partly / no from that frame alone. Key presses are checked by measuring how much the picture moved while the key was held, against the still stretches of the same take.</p>
<div class="big"><div><b>{nsent}</b><span>texts sent after the start (cues, corrections, shot openings)</span></div><div><b style="color:{C['yes']}">{tot['yes']}</b><span>asks that happened</span></div><div><b style="color:{C['partly']}">{tot['partly']}</b><span>partly</span></div><div><b style="color:{C['no']}">{tot['no']}</b><span>did not happen</span></div>
<div><b>{nk}</b><span>key holds measured</span></div><div><b>{kmore} of {len(kcmp)}</b><span>key holds with clearly more movement than the still stretches of the same take</span></div></div>
<div class="tw"><table><tr><th>Run</th><th>Seconds</th><th>Texts</th><th>Key holds</th><th>Yes</th><th>Partly</th><th>No</th><th>Still</th><th>Movement while held</th></tr>{rows}</table></div>
{''.join(secs)}</main></body></html>""")
print('TOTAL', tot, 'texts', nsent, 'key holds', nk, 'more-than-still', kmore, 'of', len(kcmp))
