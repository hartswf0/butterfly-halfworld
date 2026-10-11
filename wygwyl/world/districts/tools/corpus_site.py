#!/usr/bin/env python3
"""OUR CORPUS AS A WYGWYL-WORLD-ARCH SITE. A mirror workspace (/Users/gaia/Downloads/WYGWYL-CORPUS-ARCH) whose shots/*.py and *.html are
links to wygwyl-world-arch's own, and whose shots/out is our corpus's stands (corpus_stands.py). Their stages then run unchanged on our
footage and their tools view it: cartoon.py (cel, ink, notan, layout sheets), film_render.py (a 24 fps animatic per shot), build_world.py
(the walkable multiplane world), index.html (the Shot Lab), world.html, reel.html. Only the data their scripts expect from their own
corpus is written here: city_data.js (which stands belong to which district).
  /Users/gaia/Downloads/WYGWYL-WORLD-ARCH/.venv-shots/bin/python corpus_site.py [--match C2312 C2202 …] [--stages cartoon,film,world]
Nothing here is published; the mirror lives outside every repo."""
import os, sys, json, glob, subprocess

C = '/Users/gaia/Downloads/WYGWYL-CORPUS-ARCH'; A = '/Users/gaia/Downloads/WYGWYL-WORLD-ARCH'; PY = f'{A}/.venv-shots/bin/python'
OUT = os.path.join(C, 'shots', 'out')
arg = lambda k, d=None: sys.argv[sys.argv.index('--' + k) + 1:] if '--' + k in sys.argv else d
match = [m for m in (arg('match') or []) if not m.startswith('--')]; match = match[:match.index('--stages')] if '--stages' in match else match
stages = (sys.argv[sys.argv.index('--stages') + 1] if '--stages' in sys.argv else 'index,program,cartoon,layers').split(',')   # the drawing first; film/world/curated only when asked

# which stands belong to which district (their build_world reads it from city_data.js)
t = open(f'{A}/shots/city_data.js').read(); city = json.loads(t[t.index('=') + 1:].rstrip().rstrip(';'))
by = {}
for sj in glob.glob(os.path.join(OUT, '*', 'shot.json')):
    if not os.path.exists(os.path.join(os.path.dirname(sj), 'multiplane', 'multiplane.json')): continue
    S = json.load(open(sj)); by.setdefault((S.get('corpus') or {}).get('district') or S.get('district'), []).append(S['id'])
for d in city['districts']: d['shots'] = sorted(by.get(d['id'], []))
open(os.path.join(C, 'shots', 'city_data.js'), 'w').write('window.CITY = ' + json.dumps(city, ensure_ascii=False) + ';\n')
print('stands by district', {d['id']: len(d['shots']) for d in city['districts']}, flush=True)

# the Shot Lab's indexes, written as analyze.py and multiplane.py write them at the end of their own batches
if 'index' in stages:
    shots, mp = [], {}
    for sj in sorted(glob.glob(os.path.join(OUT, '*', 'shot.json'))):
        S = json.load(open(sj)); S.pop('prompt_full', None); shots.append(S)
        m = os.path.join(os.path.dirname(sj), 'multiplane', 'multiplane.json')
        if os.path.exists(m): j = json.load(open(m)); mp[j['id']] = j
    open(os.path.join(C, 'shots', 'shots_data.js'), 'w').write('window.SHOTS = ' + json.dumps(shots, default=float) + ';\n')
    open(os.path.join(C, 'shots', 'multiplane_data.js'), 'w').write('window.MP = ' + json.dumps(mp) + ';\n')
    print('index', len(shots), 'shots,', len(mp), 'multiplane records', flush=True)
# the walkable world from a curated selection (corpus_curate.py): a second mirror whose out holds only those stands
if 'curated' in stages:
    CW = C + '-WORLD'; cur = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.work', 'corpus', 'curated.json')))
    os.makedirs(os.path.join(CW, 'shots', 'out'), exist_ok=True); os.makedirs(os.path.join(CW, 'shots', 'film'), exist_ok=True)
    for f in glob.glob(f'{A}/shots/*.py') + glob.glob(f'{A}/shots/*.html') + [f'{A}/shots/cartoon_character.js'] + [f'{A}/{x}' for x in ('nav.js', 'favicon.svg', '404.html')]:
        dst = os.path.join(CW, 'shots' if '/shots/' in f else '', os.path.basename(f))
        if not os.path.lexists(dst): os.symlink(f, dst)
    for f in ('audio_drone.js', 'poems_data.js'):
        dst = os.path.join(CW, 'shots', 'film', f)
        if not os.path.lexists(dst): os.symlink(f'{A}/shots/film/{f}', dst)
    for x in os.listdir(os.path.join(CW, 'shots', 'out')): os.unlink(os.path.join(CW, 'shots', 'out', x))
    for d, sids in cur.items():
        for sid in sids: os.symlink(os.path.join(OUT, sid), os.path.join(CW, 'shots', 'out', sid))
    for f in ('_city',): os.makedirs(os.path.join(CW, f), exist_ok=True)
    for f in ('districts.json', 'palettes.json'):
        if not os.path.exists(os.path.join(CW, '_city', f)): open(os.path.join(CW, '_city', f), 'w').write(open(f'{A}/_city/{f}').read())
    for d in city['districts']: d['shots'] = cur.get(d['id'], [])
    open(os.path.join(CW, 'shots', 'city_data.js'), 'w').write('window.CITY = ' + json.dumps(city, ensure_ascii=False) + ';\n')
    subprocess.run([PY, 'shots/build_world.py'], cwd=CW, check=True)
    print('curated world', {d: len(v) for d, v in cur.items()}, flush=True)

env = dict(os.environ, PYTORCH_ENABLE_MPS_FALLBACK='1')
run = lambda *a: subprocess.run([PY, *a], cwd=C, env=env, check=True)
m = ['--match', *match] if match else []
if 'program' in stages: run('shots/scene_program.py', *m)          # the drawing: vector shapes per plane in the shot's own colours
if 'cartoon' in stages: run('shots/cartoon.py', *m)
# the drawing taken apart: their build_landing.build() for every shot with a program → landing/<cid>/P6…P1.svg + poster, and our viewer
if 'layers' in stages:
    sys.path.insert(0, os.path.join(C, 'shots')); os.chdir(C)
    import importlib; BL = importlib.import_module('build_landing'); BL.OUT = OUT; BL.DEST = os.path.join(C, 'landing'); os.makedirs(BL.DEST, exist_ok=True)
    sets = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.work', 'corpus', 'sets.json')))['sets'] if os.path.exists(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.work', 'corpus', 'sets.json')) else []
    place = {c: k for k, st in enumerate(sets) for c in st['views']}
    man = {}
    for sc in sorted(glob.glob(os.path.join(OUT, '*', 'program', 'scene.json'))):
        sid = sc.split(os.sep)[-3]; key = sid[:-2]
        try:
            r = BL.build(key, sid); S = json.load(open(os.path.join(OUT, sid, 'shot.json'))); co = S.get('corpus') or {}
            r.update(district=co.get('district') or S.get('district'), source=co.get('source'), kind=co.get('kind'), poem=co.get('poem'),
                     place=place.get(key), score=json.load(open(sc)).get('score'), labels=[d['label'] for d in S.get('detections', [])[:6]])
            man[key] = r
        except Exception as e: print('layers failed', sid, e, flush=True)
    for x in man.values():
        for p in x['planes']: p['src'] = p['src']
    open(os.path.join(BL.DEST, 'manifest.js'), 'w').write('window.LANDING = ' + json.dumps(man, separators=(',', ':')) + ';\n')
    src = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'corpus_apart.html')
    if os.path.exists(src): open(os.path.join(C, 'apart.html'), 'w').write(open(src).read())
    print('layers', len(man), 'drawings', flush=True)
if 'film' in stages: run('shots/film_render.py', *(m if match else ['--all']))
if 'world' in stages: run('shots/build_world.py')
