#!/usr/bin/env python3
"""THE SCENE BOOK — compile the districts page's data.
  design.json   the authored design: realms, districts (mood, hour, light by era, places, vignettes), where every set piece
                happens and how it is blocked, the transitions between poems, sixteen hero briefs, prompts for the valleys
  groups.json   the 100 views by district, with the palettes measured from their pixels (body / glow)
  .work/        the CLIP reading (clip_embed.py → clip_read.py → clip_map.py)
  the poems     the fourteen set files (set pieces, lines, camera, position, arrival, departure)
  the film      moviemap/film/cut.json (each passage's album time and light) for the colour script
Writes ../scenes.json and the views as ../v/NNN.webp (1280 px) and ../t/NNN.webp (360 px)."""
import os, json
from PIL import Image

T = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(T, '..'); WK = os.path.join(T, '.work')
ARCH = '/Users/gaia/Downloads/WYGWYL-WORLD-ARCH'; DIG = '/Users/gaia/resurrecting atlantis/_dig'
J = lambda p: json.load(open(p))
design, groups, read, mp, iso = J(f'{T}/design.json'), J(f'{T}/groups.json'), J(f'{WK}/read.json'), J(f'{WK}/map.json'), J(f'{WK}/iso.json')
names = J(f'{T}/views.json'); cut = J(f'{T}/../../moviemap/film/cut.json')
poems = {f'{n:02d}': J(f'{DIG}/world/poems/{n:02d}.json') for n in range(1, 15)}

# the views, small enough to publish (1280 px at q72 ~ 100 KB; 360 px thumbs)
os.makedirs(f'{OUT}/v', exist_ok=True); os.makedirs(f'{OUT}/t', exist_ok=True)
for i, n in enumerate(names):
    v, t = f'{OUT}/v/{i + 1:03d}.webp', f'{OUT}/t/{i + 1:03d}.webp'
    if os.path.exists(v) and os.path.exists(t): continue
    im = Image.open(os.path.join(ARCH, n)).convert('RGB')
    im.resize((1280, round(1280 * im.height / im.width)), Image.LANCZOS).save(v, 'WEBP', quality=72, method=6)
    im.resize((360, round(360 * im.height / im.width)), Image.LANCZOS).save(t, 'WEBP', quality=62, method=6)

grp = {g['id']: g for g in groups}; dist_of = {n: g['id'] for g in groups for n in g['images']}
rv = {v['n']: v for v in read['views']}
views = []
for i in range(100):
    n = i + 1; r = rv[n]
    nb = [{'cid': a['cid']} if a['cid'] else {'pub': a['pub']} for a in r['neighbours'] if a['cid'] or a['pub'] is not None][:6]
    views.append({'n': n, 'd': dist_of[n], 'clip_d': r['clip_district'], 'margin': r['margin'], 'next': r['next'], 'iso': iso['iso_pct'][i], 'nn': iso['v1'][i],
                  'words': r['words'][:5], 'near': nb, 'prompt': (lambda t: t if len(t) < 170 else t[:170].rsplit(' ', 1)[0] + ' …')(names[i].replace('coolradio_', '').rsplit('_', 2)[0].replace('_', ' '))})

# the set pieces, with the poem's own staging and the scene book's district, place and blocking
rs = {(s['poem'], s['k']): s for s in read['scenes']}
scenes = []
for num, p in poems.items():
    for k, sp in enumerate(p['set_pieces']):
        key = f'{num}.{k}'; d = design['scenes'][key]; r = rs[(num, k)]
        scenes.append({'key': key, 'poem': num, 'title': p['title'], 'name': sp['name'], 'what': sp['what_happens'], 'lines': sp.get('lines', []),
                       'camera': sp.get('camera'), 'position': sp.get('position'), 'd': d[0], 'here': d[1], 'block': d[2],
                       'clip_views': [v[0] for v in r['views'][:4]], 'best_view': r['best_view'], 'best_archive': r['best_archive'],
                       'prompt': design['prompts'].get(key)})
# valleys: set pieces nothing pictures well yet (neither the views nor the archive); the black is kept black on purpose
import re
cited = lambda s: bool(re.search(r'\(\d+(, \d+)*\)', s['block']))       # the blocking names a view that pictures it
for s in scenes: s['cited'] = cited(s); s['weak'] = s['best_view'] < 0.215 and s['best_archive'] < 0.345
valleys = sorted([s['key'] for s in scenes if s['d'] != 'black' and ((s['weak'] and not s['cited']) or s['prompt'])],
                 key=lambda k: next(s['best_view'] + s['best_archive'] for s in scenes if s['key'] == k))
outliers = sorted(range(100), key=lambda i: -iso['iso_pct'][i])[:12]

# the colour script: each passage of the album, its hour, and the districts its set pieces stand in (by share of pieces)
script = []
for ch in cut['chapters']:
    ps = [s for s in scenes if s['poem'] == ch['num']]; n = len(ps)
    share = {}
    for s in ps: share[s['d']] = share.get(s['d'], 0) + 1 / n
    script.append({'num': ch['num'], 'title': ch['title'], 't0': ch['t0'], 't1': ch['t1'], 'hour': ch['light']['hour'], 'weather': ch['light']['weather'],
                   'why': ch['light']['why'], 'seq': [s['d'] for s in ps]})

districts = []
for rl in design['realms']:
    for did in rl['districts']:
        d = design['districts'][did]; g = grp.get(did)
        districts.append({'id': did, **d, 'realm': rl['id'], 'color': g['color'] if g else '#888', 'body': g['body'] if g else [], 'glow': g['glow'] if g else [],
                          'glow_share': g['glow_share'] if g else 0, 'images': g['images'] if g else [],
                          'scenes': [s['key'] for s in scenes if s['d'] == did]})
bridges = [{'pair': k.split('|'), 'views': v} for k, v in read['bridges'].items()]
out = {'version': design['version'], 'thesis': design['thesis'], 'realms': design['realms'], 'districts': districts, 'scenes': scenes,
       'transitions': design['transitions'], 'heroes': design['heroes'], 'joins': design['joins'], 'views': views, 'valleys': valleys,
       'outliers': [i + 1 for i in outliers], 'bridges': bridges, 'script': script, 'album': cut['duration'],
       'clip': {'model': read['model'], 'archive_n': read['archive_n'], 'stats': mp['stats'], 'ari': read['ari_eye_vs_clip'],
                'agree': sum(1 for v in views if v['d'] == v['clip_d']), 'disc_counts': read['disc_counts']},
       'map': {'canon': [[c[1], c[2], c[3]] for c in mp['canon']], 'views': mp['views'], 'disc': mp['disc'], 'local': mp['views_local']}}
json.dump(out, open(f'{OUT}/scenes.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print('scenes', len(scenes), 'valleys', valleys, 'outliers', out['outliers'], 'bytes', os.path.getsize(f'{OUT}/scenes.json'))
