#!/usr/bin/env python3
"""Bake words.json: each poem's reference pictures, the line each one answers, when he says it,
and the grid of nouns the segmenter saw in it. Run from this folder."""
import json, re, collections
W = '../..'
J = lambda p: json.load(open(p))
R = J('../foundry/refs.json'); pw = {w['num']: w for w in J(f'{W}/poemworlds.json')['worlds']}
tok = lambda s: set(re.findall(r"[a-z']+", s.lower()))
out = []; labels = collections.Counter()
for num in sorted(R['poems']):
    refs = [r for r in R['refs'] if r['poem'] == num]
    if not refs: continue
    segs = J(f'{W}/timings/{num}.json')['segments']; dur = pw[num]['dur']
    rows = []
    for r in refs:
        lt = tok(r.get('line') or '')
        sc = [(len(lt & tok(s['text'])) / max(1, len(tok(s['text']))), -i) for i, s in enumerate(segs)]
        best = max(sc); si = -best[1] if lt and best[0] > 0 else None
        for row in r['grid']: labels.update(row)
        rows.append(dict(img='../foundry/' + r['img'], line=r.get('line') or '', desc=r['desc'], si=si, grid=r['grid']))
    # eight equal windows across the reading; a picture with a line takes the window its line falls in
    n = len(rows); slot = dur / n; seq = [None] * n
    for x in sorted([x for x in rows if x['si'] is not None], key=lambda x: x['si']):
        want = min(n - 1, int(segs[x['si']]['start'] / slot))
        free = sorted([i for i in range(n) if seq[i] is None], key=lambda i: abs(i - want))
        seq[free[0]] = x; x['own'] = True
    rest = [x for x in rows if x['si'] is None]
    for i in range(n):
        if seq[i] is None: seq[i] = rest.pop(0); seq[i]['own'] = False
    for i, x in enumerate(seq):
        x['t'] = round(i * slot, 2); x['t1'] = round((i + 1) * slot, 2); del x['si']
    out.append(dict(num=num, title=pw[num]['title'], audio=pw[num]['reading'], dur=dur, refs=seq,
                    lines=[[s['start'], s['end'], s['text'].strip()] for s in segs]))
    print(num, pw[num]['title'], sum(x['own'] for x in seq), 'of', len(refs), 'pictures answer a line')
json.dump(dict(poems=out), open('words.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print(labels.most_common(30))
