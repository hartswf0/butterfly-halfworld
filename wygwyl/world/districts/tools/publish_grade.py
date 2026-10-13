#!/usr/bin/env python3
"""Publish the frustum grade next to the mood city: ../../mood/grade/{m,c}/NNN.webp (each world's best frame for view NNN)
and ../../mood/grade/grade.json (the numbers, the frustums, the rubric, the guardian's verdict from verdict.json)."""
import os, json
from PIL import Image
T = os.path.dirname(os.path.abspath(__file__)); WK = os.path.join(T, '.work'); G = os.path.join(T, '../../mood/grade')
g = json.load(open(f'{WK}/grade.json'))
for w, k in [('mood', 'm'), ('mood2', 'm2'), ('mood3', 'm3'), ('city', 'c')]:
    os.makedirs(f'{G}/{k}', exist_ok=True); d = f'{WK}/frustum-{w}'
    if not os.path.exists(d): continue
    S = json.load(open(f'{d}/search.json'))
    for n, r in S.items():
        if r.get('none') or n not in g['worlds'][w]: continue                       # graded before this view was searched
        Image.open(f'{d}/{int(n):03d}.jpg').convert('RGB').save(f'{G}/{k}/{int(n):03d}.webp', 'WEBP', quality=70, method=6)
        g['worlds'][w][n]['frustum'] = r['best']; g['worlds'][w][n]['place'] = r.get('place')
v = os.path.join(T, 'verdict.json')
if os.path.exists(v): g['verdict'] = json.load(open(v))
json.dump(g, open(f'{G}/grade.json', 'w'), separators=(',', ':'))
print('published', sum(len(os.listdir(f'{G}/{k}')) for k in ['m', 'm2', 'm3', 'c'] if os.path.exists(f'{G}/{k}')), 'frames')
