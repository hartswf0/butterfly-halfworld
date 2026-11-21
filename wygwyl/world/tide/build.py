#!/usr/bin/env python3
"""Bake tide.json: for every poem, each spoken line with what the data already ties to it
(scene, district, palette, hour, weather, sound, archive views). Run from this folder."""
import json, re, os
W = '../..'
A = '../../../../wygwyl-world-arch/_city/palettes.json'   # sibling checkout; optional
J = lambda p: json.load(open(p))
sc = J('../districts/scenes.json'); pw = {w['num']: w for w in J(f'{W}/poemworlds.json')['worlds']}
pal = J(A) if os.path.exists(A) else {}
tok = lambda s: re.findall(r"[a-z']+", s.lower())
script = {s['num']: s for s in sc['script']}
views = {v['n']: v['words'] for v in sc['views']}
D = {}
for d in sc['districts']:
    p = pal.get(d['id'], {})
    D[d['id']] = dict(name=d['name'], mood=d['mood'], hour=d['hour'], weather=d['weather'], sound=d['sound'],
                      light=d.get('light_tech', ''), body=p.get('body', ['#1d2a44'])[:4], glow=p.get('glow', ['#4f8fd0'])[:3])
out = dict(districts=D, views=views, poems=[])
for n in range(1, 15):
    num = f'{n:02d}'; t = J(f'{W}/timings/{num}.json'); w = pw[num]; s = script[num]
    scenes = [x for x in sc['scenes'] if x['poem'] == num]
    S = [dict(name=x['name'], what=x['what'], camera=x['camera'], here=x['here'], d=x['d'], views=x['clip_views'][:4]) for x in scenes]
    lines, last = [], None
    for seg in t['segments']:
        st = set(tok(seg['text'])); best, bi = 0, None
        for i, x in enumerate(scenes):
            for frag in x['lines']:
                ft = tok(frag)
                if not ft: continue
                r = sum(1 for q in ft if q in st) / len(ft)
                if r > best: best, bi = r, i
        hit = best >= 0.6
        if hit: last = bi
        lines.append(dict(t0=seg['start'], t1=seg['end'], text=seg['text'].strip(), scene=bi if hit else last, hit=hit,
                          words=[[x['w'], round(x['s'], 2), round(x['e'], 2)] for x in seg.get('words', [])]))
    # lines before the first match belong to the first scene, as approach
    first = next((l['scene'] for l in lines if l['scene'] is not None), 0)
    for l in lines:
        if l['scene'] is None: l['scene'] = first
    snd = (w.get('sounds') or [{}])[0]
    out['poems'].append(dict(num=num, title=w['title'], audio=w['reading'], dur=t['duration'], mood=w['mood'],
                             hour=s['hour'], weather=s['weather'], why=s['why'], sound=snd.get('phr', ''), scenes=S, lines=lines))
    print(num, w['title'], len(lines), 'lines', sum(l['hit'] for l in lines), 'carry a place,', len(S), 'scenes')
json.dump(out, open('tide.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print(os.path.getsize('tide.json') // 1024, 'KB')
