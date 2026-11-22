"""Pack each place's fused Atlas depth into a compact LiDAR cloud for the viewer:
int16 xyz quantised over the place's bounds + uint8 luminance, base64 text (artifacts serve only web types).
Writes ride-cel/site/data/<place>.lidar.txt and ride-cel/site/lidar.json (bounds, ground, top)."""
import json, os, sys, base64, numpy as np
A = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, A)
from film import cloud
D = f'{A}/ride-cel'; OUT = f'{D}/site/data'; os.makedirs(OUT, exist_ok=True)
po = lambda d: json.load(open(f'{d}/pose_op.json'))['response']['frames']
go = lambda d: json.load(open(f'{d}/gen_op.json'))['response']['frames']
def views(name):
    d = f'{D}/{name}' if name != 'arcade' else f'{A}/arcade'
    v = []
    for n, f in enumerate(po(d)):
        dep = f'{d}/posed/{n:02d}_depth_masked.exr' if os.path.exists(f'{d}/posed/{n:02d}_depth_masked.exr') else f'{d}/posed/{n:02d}_depth.exr'
        v.append((f'{d}/posed/{n:02d}_rgb.jpg', dep, f['camera']))
    if os.path.exists(f'{d}/gen_op.json'):
        keep = json.load(open(f'{d}/state.json')).get('keep_views')
        for n, f in enumerate(go(d)):
            if (keep is None or n in keep) and os.path.exists(f'{d}/gen/{n:02d}_depth.exr'): v.append((f'{d}/gen/{n:02d}_rgb.jpg', f'{d}/gen/{n:02d}_depth.exr', f['camera']))
    return v
meta = {}
for name in ['kerb', 'neon', 'tunnel', 'fog', 'lanterns', 'arcade']:
    P, C = cloud(views(name), step=2)
    # voxel thin to ~400k points so it stays light on a phone
    lo, hi = np.percentile(P, .5, 0), np.percentile(P, 99.5, 0); ok = np.all((P >= lo) & (P <= hi), 1); P, C = P[ok], C[ok]
    def thin(vox):
        key = np.floor((P - lo) / vox).astype(np.int64); return np.unique(key[:, 0] * 73856093 ^ key[:, 1] * 19349663 ^ key[:, 2] * 83492791, return_index=True)[1]
    a_, b_ = 1e-3, 2.0   # find the grid size that keeps about 400k points
    for _ in range(14):
        m = (a_ * b_) ** .5; n = len(thin(m))
        if n > 400000: a_ = m
        else: b_ = m
    idx = thin(b_)
    if len(idx) > 420000: idx = np.random.default_rng(0).choice(idx, 420000, replace=False)
    P, C = P[idx], C[idx]
    q = np.round((P - lo) / (hi - lo) * 65535 - 32768).astype(np.int16); lum = C.mean(1).astype(np.uint8)
    open(f'{OUT}/{name}.lidar.txt', 'w').write(base64.b64encode(q.tobytes() + lum.tobytes()).decode())
    y = P[:, 1]; meta[name] = {'n': int(len(P)), 'lo': lo.round(4).tolist(), 'hi': hi.round(4).tolist(), 'ground': round(float(np.percentile(y, 1)), 3), 'top': round(float(np.percentile(y, 99)), 3)}
    print(name, len(P), round(os.path.getsize(f'{OUT}/{name}.lidar.txt') / 1e6, 1), 'MB', flush=True)
json.dump(meta, open(f'{D}/site/lidar.json', 'w'))
