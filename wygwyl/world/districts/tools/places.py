#!/usr/bin/env python3
"""ONE MAP OF PLACES. Everything the project has already located in the city's plan space (8000 × 6000, city3d-v1), gathered
into one kind of record and given to one of the twelve districts of the scene book:
  city3d   33 landmarks (type, era, poem, the canon shots that are its evidence), 21 Lynch districts, 9 plazas, 14 poem sites,
           767 canon shots placed with a position and heading
  iconic   89 Lynch elements (landmark, path, node, edge, district) segmented from the canon
  language 21 district palettes (merged onto the Lynch districts of the same name)
  scenes   the scene book's hero sets and named places (they have views but no position yet: the found cameras give one)
and, per district, what it already offers: its views, what their prompts ask for (vantage, subjects), its landmarks and Lynch
elements, the canon shots that stand inside it, and whether those shots MEAN what the district's views mean (CLIP, one model
everywhere). Private shoot material is never included. Writes ../places.json."""
import os, json, math, collections, numpy as np

T = os.path.dirname(os.path.abspath(__file__)); W = os.path.join(T, '..', '..'); ST = '/Users/gaia/resurrecting atlantis/_dig/media/store'
J = lambda p: json.load(open(p))
S = J(f'{W}/districts/scenes.json'); C = J(f'{W}/city3d/city.json'); I = J(f'{W}/iconic/city.json'); PAL = J(f'{W}/language/palettes.json')
PR = J(f'{T}/.work/lang/prompts.json'); POSE = f'{T}/.work/pose-prompt/poses.json'
D = [{'id': d['id'], 'name': d['name'], 'x': d['site']['x'], 'y': d['site']['y'], 'r': d['site']['r']} for d in S['districts'] if d['site'].get('x') is not None]

def where(x, y):
    """the district a point belongs to: inside a site's ring, the nearest by ring-relative distance; outside every ring, 'fringe' of the nearest"""
    q = sorted((math.hypot(x - d['x'], y - d['y']) / d['r'], d['id']) for d in D)
    return {'district': q[0][1], 'inside': q[0][0] <= 1, 'rel': round(q[0][0], 2)}

P = []
pal = {p['name']: p for p in PAL}
for l in C['landmarks']: P.append({'id': f"lm:{l['name']}", 'kind': 'landmark', 'type': l['type'], 'name': l['name'], 'x': l['x'], 'y': l['y'], 'z': l.get('z'), 'era': l.get('era'), 'poem': l.get('poem'), 'evidence': l.get('evidence', [])[:12], 'src': 'city3d'})
for d in C['districts']: P.append({'id': f"ld:{d['name']}", 'kind': 'lynch district', 'type': d['type'], 'name': d['name'], 'x': d['x'], 'y': d['y'], 'r': d['r'], 'realm': d.get('realm'), 'natural': d.get('natural'), 'evidence': d.get('evidence', [])[:12], 'colors': pal.get(d['name'], {}).get('colors'), 'src': 'city3d+language'})
for p in C['plazas']: P.append({'id': f"pz:{p['name']}:{round(p['x'])}", 'kind': 'plaza', 'type': p['name'], 'name': p['name'], 'x': p['x'], 'y': p['y'], 'r': p.get('r'), 'era': p.get('born'), 'src': 'city3d'})
for p in C['poems']: P.append({'id': f"poem:{p['num']}", 'kind': 'poem site', 'type': 'poem', 'name': p['title'], 'x': p['x'], 'y': p['y'], 'poem': p['num'], 'src': 'city3d'})
for e in I['elements']:
    r = {'id': f"ic:{e['id']}", 'kind': e['kind'], 'type': e['name'], 'name': e['name'], 'realm': e.get('realm'), 'poem': e.get('poem'), 'conf': e.get('conf'), 'evidence': e.get('evidence', [])[:12], 'src': 'iconic'}
    if 'pts' in e: pts = [c for q in e['pts'] for c in q] if e['pts'] and isinstance(e['pts'][0], list) else e['pts']; r.update(x=sum(pts[0::2]) / (len(pts) // 2), y=sum(pts[1::2]) / (len(pts) // 2), pts=pts)
    else: r.update(x=e['x'], y=e['y'], r=e.get('r'), h=e.get('h'))
    P.append(r)
for p in P: p.update(where(p['x'], p['y']))

# the canon shots that stand somewhere, and their meaning (CLIP rows in the store, by key)
canon = {it['cid']: it for it in J(f'{ST}/canon.json')['items']}
ids = {k: i for i, k in enumerate(J(f'{ST}/emb_ids.json'))}; E = np.load(f'{ST}/emb.npz.npy' if os.path.exists(f'{ST}/emb.npz.npy') else f'{ST}/emb.f16.npy', mmap_mode='r')
shots = []
for s in C['shots']:
    c = canon.get(s['cid'], {})
    if c.get('source') == 'shoot' or s.get('source') == 'shoot': continue          # private: never
    rec = {'cid': s['cid'], 'x': s['x'], 'y': s['y'], 'z': s.get('z'), 'hd': s.get('hd'), 'poem': s.get('poem'), 'el': s.get('el'),
           'read': {k: v[0] for k, v in (s.get('read') or {}).items()}, 'row': ids.get(c.get('k'))}
    rec.update(where(s['x'], s['y'])); shots.append(rec)

# the views' meaning: the scene book's own CLIP of the 100 (clip_embed.py)
V = np.load(f'{T}/.work/emb.npz')['views'].astype(np.float32); V /= np.linalg.norm(V, axis=1, keepdims=True)
vd = {v['n']: v['d'] for v in S['views']}
pose = J(POSE)['views'] if os.path.exists(POSE) else {}

out = {'version': 1, 'space': {'W': 8000, 'H': 6000, 'from': C.get('from')}, 'districts': [], 'places': P, 'shots': shots}
ids_ = [d['id'] for d in D]; shot_cent, view_cent = {}, {}
for d in D:
    mine = [p for p in P if p['district'] == d['id']]
    sh = [s for s in shots if s['district'] == d['id'] and s['inside']]
    vs = [n for n, dd in vd.items() if dd == d['id']]
    rows = [s['row'] for s in sh if s['row'] is not None]
    if rows: m = np.asarray(E[sorted(rows)], np.float32); m /= np.linalg.norm(m, axis=1, keepdims=True); shot_cent[d['id']] = m.mean(0)
    if vs: view_cent[d['id']] = V[[n - 1 for n in vs]].mean(0)
    pr = [PR[n - 1] for n in vs]
    found = [pose[str(n)]['best']['pose'] for n in vs if str(n) in pose and pose[str(n)].get('placeable')]
    out['districts'].append({
        'id': d['id'], 'name': d['name'], 'site': {k: d[k] for k in ('x', 'y', 'r')}, 'views': vs,
        'asks': {'vantage': collections.Counter(r['vantage'][0]['kind'] for r in pr if r['vantage']).most_common(),
                 'subjects': collections.Counter(w for r in pr for w in set(r['subjects'])).most_common(14),
                 'atmos': collections.Counter(w for r in pr for w in set(r['atmos'])).most_common(8),
                 'lens': sorted(r['hfov'] for r in pr if r['hfov'])},
        'has': {k: [p['name'] for p in mine if p['kind'] == k and p['inside']] for k in ('landmark', 'node', 'path', 'edge', 'lynch district', 'plaza', 'poem site')},
        'near': [p['name'] for p in mine if not p['inside'] and p['rel'] < 1.6 and p['kind'] in ('landmark', 'node', 'edge')],
        'shots_inside': len(sh), 'shot_reads': {k: collections.Counter(s['read'].get(k) for s in sh if s['read'].get(k)).most_common(4) for k in ('landmark', 'node', 'district')},
        'found_inside': sum(1 for p in found if where(p['x'], p['y'])['district'] == d['id']), 'found': len(found)})
# does position agree with meaning? cosine between each district's placed canon shots and each district's views
both = [i for i in ids_ if i in shot_cent and i in view_cent]
M = np.array([[float(shot_cent[a] @ view_cent[b] / np.linalg.norm(shot_cent[a]) / np.linalg.norm(view_cent[b])) for b in both] for a in both])
out['agreement'] = {'districts': both, 'cos': M.round(4).tolist(),
                    'own_rank': {a: int((M[i] > M[i, i]).sum()) + 1 for i, a in enumerate(both)}}
json.dump(out, open(os.path.join(W, 'districts', 'places.json'), 'w'), separators=(',', ':'), ensure_ascii=False)
print('places', len(P), 'shots', len(shots), 'districts', len(out['districts']))
for d in out['districts']:
    h = d['has']; print(f"{d['id']:9s} views {len(d['views']):2d} shots {d['shots_inside']:3d} landmarks {h['landmark'][:4]} nodes {h['node'][:3]} edges {h['edge'][:2]} | asks {[k for k, _ in d['asks']['vantage']][:3]} {[k for k, _ in d['asks']['subjects']][:5]} | found inside {d['found_inside']}/{d['found']}")
print('canon shots placed in a district vs its views, own rank of 12 by CLIP:', out['agreement']['own_rank'])
