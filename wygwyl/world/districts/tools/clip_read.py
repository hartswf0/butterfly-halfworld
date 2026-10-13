#!/usr/bin/env python3
"""Read the 100 views against everything else in CLIP space.
  neighbours  each view's nearest archive frames and canon shots (shoot photographs never shown)
  novelty     how unlike the 58k archive a view is, against the archive's own baseline
  districts   the eye grouping checked by clustering; each view's margin to the next district (bridges)
  adjacency   which districts the bridges join: the transition zones
  scenes      each set piece's best views and best archive frames: where the scene happens, and the valleys
  siting      where each district's look-alikes already stand in the city (the 767 placed canon shots)
  disc        which district each filmed street of the movie map already reads as
Writes read.json."""
import os, json, numpy as np
from collections import Counter, defaultdict
from sklearn.cluster import AgglomerativeClustering
from sklearn.metrics import adjusted_rand_score

HERE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.work'); os.makedirs(HERE, exist_ok=True)
ST = '/Users/gaia/resurrecting atlantis/_dig/media/store'
W = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../..')
Z = np.load(os.path.join(HERE, 'emb.npz')); M = json.load(open(os.path.join(HERE, 'emb_meta.json')))
V, S, D = Z['views'], Z['scenes'], Z['disc']
E = np.load(f'{ST}/emb.f16.npy').astype(np.float32); ids = json.load(open(f'{ST}/emb_ids.json'))
src = {}
for l in open(f'{ST}/inventory.jsonl'):
    j = json.loads(l); src[j['k']] = j['source']
keep = np.array([src.get(k) != 'shoot' for k in ids])                  # never show or cite the shoot's photographs
Ek = E[keep]; idk = [k for k, ok in zip(ids, keep) if ok]
vocab = json.load(open(f'{ST}/text_meta.json'))['vocab']; VOC = np.load(f'{ST}/vocab.npy').astype(np.float32)
A = json.load(open(f'{W}/archive/items.json')); g = A['fields'].index('group')
pub = {it[g]: i for i, it in enumerate(A['items'])}                    # store key -> published archive thumb t/{i}.webp
canon = json.load(open(f'{ST}/canon.json'))['items']; ck = {c['k']: c['cid'] for c in canon}
cpub = set(os.path.splitext(f)[0] for f in os.listdir(f'{W}/iconic/c'))
idx = {k: i for i, k in enumerate(idk)}
city = json.load(open(f'{W}/city3d/city.json')); placed = {s['cid']: s for s in city['shots']}
DIS = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'groups.json'))); lab = np.zeros(100, int)
for di, d in enumerate(DIS):
    for n in d['images']: lab[n - 1] = di

# novelty: mean cos to the 10 nearest archive frames, against the archive's own (2,000 frames vs the rest)
def topk(Q, K=10):
    s = Q @ Ek.T; I = np.argpartition(-s, K, axis=1)[:, :K]
    r = np.take_along_axis(s, I, 1); o = np.argsort(-r, 1); return np.take_along_axis(I, o, 1), np.take_along_axis(r, o, 1)
rng = np.random.default_rng(7); smp = rng.choice(len(Ek), 2000, replace=False)
bs = Ek[smp] @ Ek.T; bs[np.arange(2000), smp] = -1; base = np.sort(bs, 1)[:, -10:].mean(1)
VI, VS = topk(V, 40); nov_raw = VS[:, :10].mean(1)
pct = np.array([(base > x).mean() for x in nov_raw])                   # share of archive frames with closer neighbours than this view

# clustering check
ag = AgglomerativeClustering(n_clusters=len(DIS), metric='cosine', linkage='average').fit(V)
ari = adjusted_rand_score(lab, ag.labels_)
C = np.stack([V[lab == i].mean(0) for i in range(len(DIS))]); C /= np.linalg.norm(C, axis=1, keepdims=True)
sc = V @ C.T
own = sc[np.arange(100), lab]; sc2 = sc.copy(); sc2[np.arange(100), lab] = -9; nxt = sc2.argmax(1); margin = own - sc2.max(1)
nearest_c = sc.argmax(1)
# adjacency: views whose next district is close (bridges), and centroid similarity
adj = defaultdict(list)
for i in np.argsort(margin):
    if margin[i] < 0.035: a, b = sorted([int(lab[i]), int(nxt[i])]); adj[(a, b)].append(int(i) + 1)
CC = C @ C.T

# scenes: best views and best archive frames per set piece; valleys
SV = S @ V.T; SI, SA = topk(S, 12)
VOCs = V @ VOC.T

def arch(ii, ss, n=8):
    out = []
    for i, s in zip(ii, ss):
        k = idk[i]; c = ck.get(k)
        out.append({'k': k, 'src': src.get(k), 's': round(float(s), 3), 'pub': pub.get(k), 'cid': c if c in cpub else None})
        if len(out) >= n: break
    return out

views = []
for i in range(100):
    w = np.argsort(-VOCs[i])[:6]
    views.append({'n': i + 1, 'district': DIS[lab[i]]['id'], 'clip_district': DIS[nearest_c[i]]['id'], 'margin': round(float(margin[i]), 3), 'next': DIS[nxt[i]]['id'],
                  'novelty': round(float(1 - nov_raw[i]), 3), 'novel_pct': round(float(1 - pct[i]), 3), 'words': [vocab[j] for j in w],
                  'neighbours': arch(VI[i], VS[i]), 'scenes': [int(j) for j in np.argsort(-SV[:, i])[:3]]})
scenes = []
for j, m in enumerate(M['scenes']):
    bv = np.argsort(-SV[j])[:5]
    scenes.append({**m, 'text': M['scene_text'][j], 'views': [[int(i) + 1, round(float(SV[j, i]), 3)] for i in bv], 'best_view': round(float(SV[j, bv[0]]), 3),
                   'archive': arch(SI[j], SA[j], 5), 'best_archive': round(float(SA[j, 0]), 3),
                   'district_votes': Counter(DIS[lab[i]]['id'] for i in bv[:5]).most_common()})
# siting: the 767 placed canon shots nearest each district centroid -> where on the plan
pl = [(c, placed[c]) for c in placed if any(cc['cid'] == c for cc in canon)]
ckey = {c['cid']: c['k'] for c in canon}
P = np.stack([Ek[idx[ckey[c]]] for c, _ in pl if ckey[c] in idx]); plv = [s for c, s in pl if ckey[c] in idx]
siting = []
for di, d in enumerate(DIS):
    s = P @ C[di]; o = np.argsort(-s)[:25]
    xs = np.array([[plv[i]['x'], plv[i]['y']] for i in o]); w = np.maximum(s[o] - s[o].min() + 1e-3, 0)
    siting.append({'id': d['id'], 'top': [{'cid': plv[i]['cid'], 'x': plv[i]['x'], 'y': plv[i]['y'], 'el': plv[i].get('el'), 'poem': plv[i].get('poem'), 's': round(float(s[i]), 3)} for i in o[:12]],
                   'centre': [round(float(np.average(xs[:, 0], weights=w)), 1), round(float(np.average(xs[:, 1], weights=w)), 1)],
                   'district_reads': Counter(plv[i]['read']['district'][0] for i in o).most_common(4)})
# disc: what each filmed street reads as
DS = D @ C.T; disc = [{'sheet': M['disc'][i], 'district': DIS[int(DS[i].argmax())]['id'], 's': round(float(DS[i].max()), 3)} for i in range(len(D))]

out = {'model': 'open_clip ViT-B-32 laion2B-s34B-b79K (the archive engine\'s)', 'archive_n': int(keep.sum()), 'ari_eye_vs_clip': round(float(ari), 3),
       'clip_clusters': [int(x) for x in ag.labels_], 'districts': [d['id'] for d in DIS],
       'centroid_sim': [[round(float(x), 3) for x in r] for r in CC], 'bridges': {f'{DIS[a]["id"]}|{DIS[b]["id"]}': v for (a, b), v in sorted(adj.items(), key=lambda kv: -len(kv[1]))},
       'baseline_top10': round(float(base.mean()), 3), 'views': views, 'scenes': scenes, 'siting': siting, 'disc': disc,
       'disc_counts': Counter(x['district'] for x in disc).most_common()}
json.dump(out, open(os.path.join(HERE, 'read.json'), 'w'))
print('ARI eye vs clip', round(ari, 3), '| archive baseline top10', round(float(base.mean()), 3), '| views top10 mean', round(float(nov_raw.mean()), 3))
print('most novel:', sorted([(v['novel_pct'], v['n'], v['district']) for v in views])[-12:])
print('least novel:', sorted([(v['novel_pct'], v['n'], v['district']) for v in views])[:8])
print('disagree:', [(v['n'], v['district'], v['clip_district'], v['margin']) for v in views if v['district'] != v['clip_district']])
print('bridges:', {k: v for k, v in out['bridges'].items()})
for s in siting: print('site', s['id'], s['centre'], s['district_reads'], [(t['el'], t['poem']) for t in s['top'][:5]])
print('disc', out['disc_counts'])
