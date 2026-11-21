#!/usr/bin/env python3
"""Ask a Gemini model to judge every seed-image candidate for a poem against that poem's seed text.
    GEMINI_API_KEY=... python3 pick_seeds.py 01 02 03
Writes seed_picks.json. The key is read from the environment and never written anywhere."""
import base64, glob, io, json, os, re, sys, urllib.request, ssl
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); MODEL = os.environ.get('JUDGE_MODEL', 'gemini-flash-latest')
P = json.load(open(os.path.join(HERE, 'prompts.json')))
shots = {}
for f in glob.glob(os.path.join(HERE, '../../../../wygwyl-world-arch/shots/out/*/shot.json')):
    shots[json.load(open(f))['bible_no']] = os.path.join(os.path.dirname(f), 'image.jpg')
CL = os.path.join(HERE, '../../../../cineosis-lab/lab/wygwyl/Halfworld_Reference_Frames/')
def small(path):
    im = Image.open(path).convert('RGB'); im.thumbnail((512, 512)); b = io.BytesIO(); im.save(b, 'JPEG', quality=70); return base64.b64encode(b.getvalue()).decode()
ASK = """You are choosing the single opening frame for a real-time world model. It accepts ONE 16:9 image and then builds a walkable world from it.
Below is the world description, then numbered candidate images.

Judge each candidate 0-10 on:
 place   - does it show the described place clearly, with depth to walk into?
 style   - does it fit the described Afrofuturist, photographic, practical-light look?
 people  - are the described people present and correct (gender, race, outfit)? If no people are visible, say so; that is a gap, not a fault of the place.
 clean   - free of text, borders, collage seams, distorted anatomy?
 seedable- would a world model keep this stable (clear ground plane, no extreme close-up, 16:9 friendly)?

Answer in JSON only: {"ranking":[{"id":"...","place":n,"style":n,"people":n,"clean":n,"seedable":n,"total":n,"note":"one sentence"}],
 "best":"id","runner_up":"id","gap":"what the best image still lacks, in one sentence"}

WORLD DESCRIPTION:
"""
out = json.load(open(os.path.join(HERE, 'seed_picks.json'))) if os.path.exists(os.path.join(HERE, 'seed_picks.json')) else {}
ctx = ssl.create_default_context(cafile=os.environ.get('SSL_CERT_FILE'))
for num in sys.argv[1:]:
    p = next(x for x in P['poems'] if x['num'] == num); cands = []
    for u in p['seeds']['halfworld']: cands.append((f"halfworld:{os.path.basename(u)}", CL + os.path.basename(u)))
    for r in p['seeds']['refs']: cands.append((f"ref:{os.path.basename(r)}", os.path.join(HERE, r)))
    for v in p['seeds']['views']:
        if v['n'] in shots: cands.append((f"view:{v['n']:03d}", shots[v['n']]))
    cands = [(i, f) for i, f in cands if os.path.exists(f)]
    parts = [{'text': ASK + p['seed']}]
    for i, f in cands: parts += [{'text': f'CANDIDATE {i}'}, {'inline_data': {'mime_type': 'image/jpeg', 'data': small(f)}}]
    req = urllib.request.Request(f'https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent',
                                 data=json.dumps({'contents': [{'parts': parts}], 'generationConfig': {'responseMimeType': 'application/json', 'temperature': 0}}).encode(),
                                 headers={'x-goog-api-key': os.environ['GEMINI_API_KEY'], 'content-type': 'application/json'})
    try:
        r = json.load(urllib.request.urlopen(req, timeout=180, context=ctx))
        txt = r['candidates'][0]['content']['parts'][0]['text']; v = json.loads(re.search(r'\{.*\}', txt, re.S).group(0))
    except Exception as e:
        print(num, 'FAILED', type(e).__name__, str(e)[:200], getattr(e, 'read', lambda: b'')()[:300]); continue
    paths = dict(cands); v['paths'] = {k: os.path.relpath(paths[k], HERE) for k in (v.get('best'), v.get('runner_up')) if k in paths}
    v['judge'] = MODEL; v['candidates'] = len(cands); out[num] = v
    print(f"\n{num} {p['title']} — {len(cands)} candidates judged by {MODEL}")
    for x in sorted(v['ranking'], key=lambda x: -x['total'])[:5]: print(f"  {x['total']:>4}  {x['id']:<22} place {x['place']} style {x['style']} people {x['people']} clean {x['clean']} seedable {x['seedable']}  {x['note'][:110]}")
    print('  BEST', v.get('best'), '| runner-up', v.get('runner_up'), '| gap:', v.get('gap'))
json.dump(out, open(os.path.join(HERE, 'seed_picks.json'), 'w'), ensure_ascii=False, indent=1)
