#!/usr/bin/env python3
"""Where the three corpora sit against each other in CLIP space: the canon (2,707 shots the city was reversed from),
the 100 views, and the movie map's disc (the city as rendered). Isolation against the canon's own spacing; a UMAP of all
three, and one of the views alone. Writes .work/map.json and .work/iso.json."""
import os, json, numpy as np, umap

HERE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.work')
ST = '/Users/gaia/resurrecting atlantis/_dig/media/store'
W = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../..')
E = np.load(f'{ST}/emb.f16.npy').astype(np.float32); ids = json.load(open(f'{ST}/emb_ids.json')); ix = {k: i for i, k in enumerate(ids)}
canon = json.load(open(f'{ST}/canon.json'))['items']; Cn = np.stack([E[ix[c['k']]] for c in canon])
Z = np.load(os.path.join(HERE, 'emb.npz')); V, D = Z['views'], Z['disc']

nn = lambda A, B: (A @ B.T).max(1)
cc = Cn @ Cn.T; np.fill_diagonal(cc, -1); cb = np.sort(cc, 1)[:, -10:].mean(1)
vb = np.sort(V @ Cn.T, 1)[:, -10:].mean(1); pct = np.array([(cb > x).mean() for x in vb])
dd = D @ D.T; np.fill_diagonal(dd, -1); vv = V @ V.T; np.fill_diagonal(vv, -1)
stats = {'canon_canon': round(float(cc.max(1).mean()), 3), 'views_canon': round(float(nn(V, Cn).mean()), 3), 'views_views': round(float(vv.max(1).mean()), 3),
         'disc_canon': round(float(nn(D, Cn).mean()), 3), 'disc_views': round(float(nn(D, V).mean()), 3), 'disc_disc': round(float(dd.max(1).mean()), 3),
         'views_more_isolated_than_pct_of_canon': round(float(100 * pct.mean()), 1)}
json.dump({'iso_pct': [round(float(p), 3) for p in pct], 'v1': [round(float(x), 3) for x in nn(V, Cn)]}, open(os.path.join(HERE, 'iso.json'), 'w'))

X = np.concatenate([Cn, V, D]); u = umap.UMAP(n_neighbors=20, min_dist=0.15, metric='cosine', random_state=7).fit_transform(X); u = (u - u.min(0)) / (u.max(0) - u.min(0))
pub = set(os.path.splitext(f)[0] for f in os.listdir(f'{W}/iconic/c'))
nc = len(canon)
l = umap.UMAP(n_neighbors=8, min_dist=0.3, metric='cosine', random_state=3).fit_transform(V); l = (l - l.min(0)) / (l.max(0) - l.min(0))
out = {'canon': [[c['cid'], round(float(u[i, 0]), 4), round(float(u[i, 1]), 4), c.get('clip_poem'), c['source'], 1 if c['cid'] in pub else 0] for i, c in enumerate(canon)],
       'views': [[i + 1, round(float(u[nc + i, 0]), 4), round(float(u[nc + i, 1]), 4)] for i in range(len(V))],
       'disc': [[i, round(float(u[nc + len(V) + i, 0]), 4), round(float(u[nc + len(V) + i, 1]), 4)] for i in range(len(D))],
       'views_local': [[i + 1, round(float(l[i, 0]), 4), round(float(l[i, 1]), 4)] for i in range(len(V))], 'stats': stats}
json.dump(out, open(os.path.join(HERE, 'map.json'), 'w')); print(stats)
