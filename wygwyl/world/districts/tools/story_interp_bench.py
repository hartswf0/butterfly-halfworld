#!/usr/bin/env python3
"""THE IN-BETWEEN BENCH: five ways to make the frames between keyframe cels, run on the same drawings and the same patches, measured
the same way, and laid side by side to be judged by eye. Nothing is redrawn: every method starts from the keyframe drawings
wygwyl-world-arch's scene program already made (raster frame0.png, vector scene.json, plane map planes.npz).
  A blend   theirs: the two neighbouring drawings, each warped by optical flow, cross-blended
  B carry   one drawing carried along the flow, re-keyed only when the warp stops explaining the footage (story_inbetween.py)
  C hold    limited animation: each drawing held until the next, a 2-frame dissolve between; no warping
  D planes  the multiplane way: the background planes (P4–P6) of one drawing per shot moved rigidly by the camera's motion
            (a homography fitted to the footage's flow on the background); the figure and foreground planes (P1–P3) carried by
            the dense flow from the nearest drawing, composited over it
  F ebsynth every frame re-synthesised from the neighbouring keyframe cels by EbSynth (patch-based, guided by the footage: the
            keyframe's footage → this frame's footage, plus their edges), both directions blended by time
  G rife    a learned interpolator (RIFE v4.6, ncnn/Vulkan) between consecutive keyframe cels: smooth, but blind to the footage between
  E morph   an animator's in-between: every polygon of a drawing matched to its partner in the next (same plane, nearby once the
            camera's motion is taken out, similar colour and size; Hungarian), vertices resampled and interpolated, colours too;
            unmatched shapes fade; every frame rendered fresh from the vectors, so no raster ghost is possible
Measures (per method): pops/s (frames whose motion-compensated change is > 3× the patch's median), residual (mean motion-
compensated change), ghost (edge density / the drawings' own), track (correlation of the drawing's frame-to-frame change with
the footage's — a drawing that freezes while the footage moves scores low).
Writes WYGWYL-CORPUS-ARCH/bench/<patch>/{A..E}.mp4, grid.mp4 (footage + five methods, labelled), metrics.json, and bench/index.html.
  python3 story_interp_bench.py P08-006 P01-002 …"""
import os, re, sys, json, glob, time, shutil, subprocess, numpy as np, cv2
from scipy.optimize import linear_sum_assignment
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import story_inbetween as IB

VD = '/Users/gaia/Downloads/WYGWYL-CORPUS-ARCH/shots/video'; BD = '/Users/gaia/Downloads/WYGWYL-CORPUS-ARCH/bench'; FPS = 12
BG, FG = (4, 5, 6), (0, 1, 2, 3)

def load(pid):
    work = os.path.join(VD, pid); frames = sorted(glob.glob(os.path.join(work, 'frames', '*.png')))
    F = [cv2.imread(f) for f in frames]; G = [cv2.cvtColor(x, cv2.COLOR_BGR2GRAY) for x in F]; h, w = G[0].shape; K = {}
    for kf in glob.glob(os.path.join(work, 'keyframes', 'kf*_0.png')):
        i = int(re.search(r'kf(\d+)_0', kf).group(1)); od = os.path.join(work, 'out', f"vid-{re.sub(r'[^a-z0-9]+', '-', pid.lower())}-kf{i:05d}_0")
        if i >= len(F) or not os.path.exists(os.path.join(od, 'program', 'frame0.png')): continue
        cel = cv2.imread(os.path.join(od, 'program', 'frame0.png')); sc = json.load(open(os.path.join(od, 'program', 'scene.json')))
        L = np.load(os.path.join(od, 'multiplane', 'planes.npz'))['L'] if os.path.exists(os.path.join(od, 'multiplane', 'planes.npz')) else None
        K[i] = {'cel': cv2.resize(cel, (w, h), interpolation=cv2.INTER_AREA), 'scene': sc, 'L': cv2.resize(L, (w, h), interpolation=cv2.INTER_NEAREST) if L is not None else None}
    hist = lambda im: cv2.normalize(cv2.calcHist([cv2.cvtColor(im, cv2.COLOR_BGR2HSV)], [0, 1], None, [16, 8], [0, 180, 0, 256]), None).flatten()
    seg = [0] * len(F); s = 0
    for i in range(1, len(F)):
        jump = float(np.abs(cv2.resize(G[i], (64, 36)).astype(np.float32) - cv2.resize(G[i - 1], (64, 36)).astype(np.float32)).mean())
        if cv2.compareHist(hist(F[i - 1]), hist(F[i]), cv2.HISTCMP_CORREL) < 0.75 or jump > 38: s += 1
        seg[i] = s
    return work, F, G, K, seg

def keys_around(K, seg, i):
    ks = sorted(k for k in K if seg[k] == seg[i]) or sorted(K, key=lambda k: abs(k - i))[:1]
    a = max([k for k in ks if k <= i], default=ks[0]); b = min([k for k in ks if k >= i], default=ks[-1]); return a, b

def m_blend(F, G, K, seg, tau=14.0):                    # theirs (cartoon_video.propagate), re-implemented so it can run on fewer keyframes
    out = []
    for i in range(len(F)):
        a, b = keys_around(K, seg, i)
        if i in K: out.append(K[i]['cel']); continue
        cs, ws = [], []
        for k in sorted({a, b}):
            m = IB.flow_map(G[k], G[i]); err = cv2.GaussianBlur(np.abs(IB.warp(F[k], m).astype(np.float32) - F[i].astype(np.float32)).mean(2), (0, 0), 6)
            wt = 1.0 if a == b else ((b - i) / (b - a) if k == a else (i - a) / (b - a)); cs.append(IB.warp(K[k]['cel'], m).astype(np.float32)); ws.append(wt * np.exp(-err / tau) + 1e-4)
        out.append(cs[0].astype(np.uint8) if len(cs) == 1 else ((cs[0] * (ws[0] / (ws[0] + ws[1]))[..., None]) + cs[1] * (ws[1] / (ws[0] + ws[1]))[..., None]).astype(np.uint8))
    return out
def sparse(K, seg, every=3):                             # every third drawing, and always the first of each shot
    ks = sorted(K); keep = set(ks[::every]) | {k for k in ks if k == min(x for x in ks if seg[x] == seg[k])}
    return {k: K[k] for k in keep}

def m_hold(F, G, K, seg, dissolve=2):
    out = []
    for i in range(len(F)):
        a, b = keys_around(K, seg, i); cel = K[a]['cel']
        if b != a and b - i < dissolve: t = (dissolve - (b - i)) / (dissolve + 1); cel = cv2.addWeighted(K[a]['cel'], 1 - t, K[b]['cel'], t, 0)
        out.append(cel)
    return out

def m_planes(F, G, K, seg):
    out = []; seg_first = {}
    for k in sorted(K): seg_first.setdefault(seg[k], k)
    for i in range(len(F)):
        a, b = keys_around(K, seg, i); n = a if abs(a - i) <= abs(b - i) else b; base = seg_first.get(seg[i], n)
        # background: one drawing per shot, moved rigidly by the camera
        bk = K[base]; bgm = np.isin(bk['L'], BG) if bk['L'] is not None else np.ones(G[0].shape, bool)
        if i == base: bgimg = bk['cel']
        else:
            mx, my = IB.flow_map(G[base], G[i]); ys, xs = np.mgrid[0:G[0].shape[0]:12, 0:G[0].shape[1]:12]
            src = np.stack([mx[ys, xs], my[ys, xs]], -1).reshape(-1, 2); dst = np.stack([xs, ys], -1).reshape(-1, 2).astype(np.float32)
            keep = bgm[ys, xs].reshape(-1) if bgm.any() else np.ones(len(src), bool)
            H, _ = cv2.findHomography(src[keep], dst[keep], cv2.RANSAC, 3.0) if keep.sum() > 12 else (None, None)
            bgimg = cv2.warpPerspective(bk['cel'], H, (G[0].shape[1], G[0].shape[0]), borderMode=cv2.BORDER_REPLICATE) if H is not None else IB.warp(bk['cel'], (mx, my))
        # figure and foreground: the nearest drawing, carried by the dense flow, over the background
        nk = K[n]; fgm = np.isin(nk['L'], FG).astype(np.float32) if nk['L'] is not None else np.zeros(G[0].shape, np.float32)
        if i != n: m = IB.flow_map(G[n], G[i]); fg = IB.warp(nk['cel'], m); fgm = IB.warp(fgm, m)
        else: fg = nk['cel']
        fgm = cv2.GaussianBlur(fgm, (0, 0), 1.2)[..., None]
        out.append((fg.astype(np.float32) * fgm + bgimg.astype(np.float32) * (1 - fgm)).astype(np.uint8))
    return out

# ---------- E: vector morph ----------
NUM = re.compile(r'[-+]?\d*\.?\d+')
def polys(sc, sx, sy):
    out = []
    for pl, shapes in sc['planes'].items():
        pi = int(pl[1]) if pl[1:].isdigit() else 6
        for s in shapes:
            v = np.array(list(map(float, NUM.findall(s['d']))), np.float32)
            if len(v) < 6: continue
            p = v[: len(v) // 2 * 2].reshape(-1, 2) * [sx, sy]; f = s.get('fill') or {}
            c0 = f.get('c0', '#808080') if isinstance(f, dict) else str(f); c1 = f.get('c1', c0) if isinstance(f, dict) else c0
            out.append({'plane': pi, 'p': p, 'c0': np.array([int(c0[i:i + 2], 16) for i in (5, 3, 1)], np.float32), 'c1': np.array([int(c1[i:i + 2], 16) for i in (5, 3, 1)], np.float32),
                        'area': float(s.get('area', 0)), 'cen': p.mean(0)})
    return out
def resample(p, n=64):
    q = np.vstack([p, p[:1]]); seg = np.linalg.norm(np.diff(q, axis=0), axis=1); t = np.concatenate([[0], np.cumsum(seg)]); L = t[-1] or 1
    s = np.linspace(0, L, n, endpoint=False); return np.stack([np.interp(s, t, q[:, 0]), np.interp(s, t, q[:, 1])], 1)
def align(a, b):                                          # rotate b's start to best fit a (and reverse if wound the other way)
    best = None
    for bb in (b, b[::-1]):
        d = [np.linalg.norm(a - np.roll(bb, -k, 0), axis=1).mean() for k in range(0, len(bb), 2)]
        k = int(np.argmin(d)) * 2
        if best is None or d[k // 2] < best[0]: best = (d[k // 2], np.roll(bb, -k, 0))
    return best[1]
def render(shapes, h, w):
    img = np.zeros((h, w, 3), np.float32)
    for s in sorted(shapes, key=lambda s: -s['plane']):
        pts = np.round(s['p']).astype(np.int32); x0, y0 = np.clip(pts.min(0), 0, [w - 1, h - 1]); x1, y1 = np.clip(pts.max(0) + 1, 1, [w, h])
        if x1 <= x0 or y1 <= y0: continue
        m = np.zeros((y1 - y0, x1 - x0), np.uint8); cv2.fillPoly(m, [pts - [x0, y0]], 1)
        t = np.linspace(0, 1, y1 - y0, dtype=np.float32)[:, None, None]; col = s['c0'] * (1 - t) + s['c1'] * t
        a = (m.astype(np.float32) * s.get('alpha', 1.0))[..., None]; img[y0:y1, x0:x1] = img[y0:y1, x0:x1] * (1 - a) + col * a
    return np.clip(img, 0, 255).astype(np.uint8)
def m_morph(F, G, K, seg):
    h, w = G[0].shape; P = {}
    for k, v in K.items(): P[k] = polys(v['scene'], w / v['scene']['W'], h / v['scene']['H'])
    pairs = {}
    ks = sorted(K)
    for a, b in zip(ks, ks[1:]):
        if seg[a] != seg[b]: continue
        A, B = P[a], P[b]
        # where each shape of a has moved to by b: flow_map(b, a) gives, for every pixel of a, where it is in b
        fwd = IB.flow_map(G[b], G[a]); cen = []
        for s in A:
            x, y = np.clip(s['cen'], [0, 0], [w - 1, h - 1]).astype(int); cen.append([fwd[0][y, x], fwd[1][y, x]])
        C = np.full((len(A), len(B)), 1e6, np.float32)
        for i, s in enumerate(A):
            for j, t in enumerate(B):
                if s['plane'] != t['plane']: continue
                d = np.linalg.norm(np.array(cen[i]) - t['cen']) / (0.25 * w); col = np.linalg.norm(s['c0'] - t['c0']) / 120; ar = abs(np.log((s['area'] + 1) / (t['area'] + 1)))
                C[i, j] = d + col + 0.5 * ar
        r, c = linear_sum_assignment(C); pairs[(a, b)] = [(i, j) for i, j in zip(r, c) if C[i, j] < 1.5]
    out = []
    for i in range(len(F)):
        a, b = keys_around(K, seg, i)
        if a == b or (a, b) not in pairs: out.append(render(P[a], h, w)); continue
        t = (i - a) / (b - a); sh = []; ma = {x for x, _ in pairs[(a, b)]}; mb = {y for _, y in pairs[(a, b)]}
        for x, y in pairs[(a, b)]:
            s, u = P[a][x], P[b][y]; pa = resample(s['p']); pb = align(pa, resample(u['p']))
            sh.append({'plane': s['plane'], 'p': pa * (1 - t) + pb * t, 'c0': s['c0'] * (1 - t) + u['c0'] * t, 'c1': s['c1'] * (1 - t) + u['c1'] * t})
        sh += [{**P[a][x], 'alpha': max(0.0, 1 - 2 * t)} for x in range(len(P[a])) if x not in ma]
        sh += [{**P[b][y], 'alpha': max(0.0, 2 * t - 1)} for y in range(len(P[b])) if y not in mb]
        out.append(render(sh, h, w))
    return out

TOOLS = '/Users/gaia/Downloads/wygwyl-interp-tools'; EB = f'{TOOLS}/ebsynth-src/bin/ebsynth'
RIFE = glob.glob(f'{TOOLS}/rife/rife-ncnn-vulkan-*-macos')[0] if glob.glob(f'{TOOLS}/rife/rife-ncnn-vulkan-*-macos') else None
def m_ebsynth(F, G, K, seg, tmp, W=512):
    os.makedirs(tmp, exist_ok=True); h, w = G[0].shape; H = int(W * h / w); sm = lambda im: cv2.resize(im, (W, H), interpolation=cv2.INTER_AREA)
    edge = lambda g: cv2.cvtColor(cv2.Canny(cv2.GaussianBlur(g, (0, 0), 1.2), 50, 120), cv2.COLOR_GRAY2BGR)
    for k in K:
        cv2.imwrite(f'{tmp}/s{k}.png', sm(K[k]['cel'])); cv2.imwrite(f'{tmp}/g{k}.png', sm(F[k])); cv2.imwrite(f'{tmp}/e{k}.png', sm(edge(G[k])))
    out = []
    for i in range(len(F)):
        a, b = keys_around(K, seg, i)
        if i in K: out.append(K[i]['cel']); continue
        cv2.imwrite(f'{tmp}/t.png', sm(F[i])); cv2.imwrite(f'{tmp}/te.png', sm(edge(G[i]))); ims = []
        for k in sorted({a, b}):
            subprocess.run([EB, '-style', f'{tmp}/s{k}.png', '-guide', f'{tmp}/g{k}.png', f'{tmp}/t.png', '-weight', '2', '-guide', f'{tmp}/e{k}.png', f'{tmp}/te.png', '-weight', '1',
                            '-output', f'{tmp}/o{k}.png'], capture_output=True)
            ims.append(cv2.resize(cv2.imread(f'{tmp}/o{k}.png'), (w, h), interpolation=cv2.INTER_CUBIC))
        if len(ims) == 2: t = (i - a) / (b - a); out.append(cv2.addWeighted(ims[0], 1 - t, ims[1], t, 0))
        else: out.append(ims[0])
    return out
def m_rife(F, G, K, seg, tmp):
    h, w = G[0].shape; out = [None] * len(F); ks = sorted(K)
    for i in range(len(F)):
        if i in K: out[i] = K[i]['cel']
    for a, b in zip(ks, ks[1:]):
        if seg[a] != seg[b] or b - a < 2: continue
        d = os.path.join(tmp, f'r{a}'); shutil.rmtree(d, ignore_errors=True); os.makedirs(d + '/in'); os.makedirs(d + '/out')
        cv2.imwrite(f'{d}/in/00000001.png', K[a]['cel']); cv2.imwrite(f'{d}/in/00000002.png', K[b]['cel'])
        subprocess.run([f'{RIFE}/rife-ncnn-vulkan', '-i', f'{d}/in', '-o', f'{d}/out', '-n', str(b - a + 1), '-m', f'{RIFE}/rife-v4.6'], capture_output=True)
        fs = sorted(glob.glob(f'{d}/out/*.png'))
        for j, f in enumerate(fs[: b - a + 1]): out[a + j] = cv2.resize(cv2.imread(f), (w, h))
    for i in range(len(F)):                                                             # frames outside any pair hold the nearest drawing
        if out[i] is None: a, b = keys_around(K, seg, i); out[i] = K[a if abs(a - i) <= abs(b - i) else b]['cel']
    return out

def measure(seq, G, seg, K):
    FM = {i: IB.flow_map(G[i - 1], G[i]) for i in range(1, len(G)) if seg[i] == seg[i - 1]}
    res, d_cel, d_src = [], [], []
    for i in FM:
        res.append(float(np.abs(seq[i].astype(np.float32) - IB.warp(seq[i - 1], FM[i]).astype(np.float32)).mean()))
        d_cel.append(float(np.abs(seq[i].astype(np.float32) - seq[i - 1].astype(np.float32)).mean())); d_src.append(float(np.abs(G[i].astype(np.float32) - G[i - 1].astype(np.float32)).mean()))
    med = np.median(res) if res else 0; ke = np.mean([IB.edges(v['cel']) for v in K.values()]) + 1e-6
    return {'pops_per_s': round(sum(r > 3 * med for r in res) / (len(G) / FPS), 2), 'residual': round(float(np.mean(res)), 2) if res else 0,
            'ghost': round(float(np.mean([IB.edges(x) / ke for x in seq])), 3), 'track': round(float(np.corrcoef(d_cel, d_src)[0, 1]), 3) if len(res) > 3 and np.std(d_src) > 0 else None}

def write(seq, path):
    d = path + '_frames'; os.makedirs(d, exist_ok=True)
    for f in glob.glob(os.path.join(d, '*.png')): os.remove(f)
    for i, x in enumerate(seq): cv2.imwrite(os.path.join(d, f'{i + 1:05d}.png'), x)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', str(FPS), '-i', os.path.join(d, '%05d.png'), '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', path + '.mp4'], check=True)

LABEL = {'S': 'footage', 'A': 'A blend (theirs)', 'B': 'B carry', 'C': 'C hold', 'D': 'D planes', 'E': 'E morph', 'F': 'F ebsynth', 'G': 'G rife',
         'A3': 'A3 blend, 1 key / 3 s', 'F3': 'F3 ebsynth, 1 key / 3 s', 'G3': 'G3 rife, 1 key / 3 s'}
KEY_COST = 25.0                                           # seconds to draw one keyframe through the whole stack (from the cel job's logs)
if __name__ == '__main__':
    allm = {}
    for pid in [a for i, a in enumerate(sys.argv[1:], 1) if not a.startswith('--') and sys.argv[i - 1] != '--methods']:
        work, F, G, K, seg = load(pid); h, w = G[0].shape; od = os.path.join(BD, pid); os.makedirs(od, exist_ok=True)
        METHODS = (sys.argv[sys.argv.index('--methods') + 1].split(',') if '--methods' in sys.argv else ['A', 'B', 'C', 'D', 'E', 'F', 'G'])
        K3 = sparse(K, seg); RUN = {'A': lambda: m_blend(F, G, K, seg), 'B': lambda: (IB.run(pid), [cv2.imread(f) for f in sorted(glob.glob(os.path.join(work, 'cel2_frames', '*.png')))][:len(F)])[1],
               'C': lambda: m_hold(F, G, K, seg), 'D': lambda: m_planes(F, G, K, seg), 'E': lambda: m_morph(F, G, K, seg),
               'F': lambda: m_ebsynth(F, G, K, seg, os.path.join(od, 'tmp_eb')), 'G': lambda: m_rife(F, G, K, seg, os.path.join(od, 'tmp_rife')),
               'A3': lambda: m_blend(F, G, K3, seg), 'F3': lambda: m_ebsynth(F, G, K3, seg, os.path.join(od, 'tmp_eb3')), 'G3': lambda: m_rife(F, G, K3, seg, os.path.join(od, 'tmp_rife3'))}
        S, M, film_s = {'S': F}, {}, len(F) / FPS
        for m in METHODS:
            t0 = time.perf_counter(); S[m] = RUN[m](); dt = time.perf_counter() - t0; kk = len(K3) if m.endswith('3') else len(K)
            M[m] = {**measure(S[m], G, seg, K), 'between_s_per_s': round(dt / film_s, 1), 'keys': kk, 'total_s_per_s': round((dt + kk * KEY_COST) / film_s, 1)}
            write(S[m], os.path.join(od, m))
        tiles = []
        for i in range(len(F)):
            row = []
            for m in ['S'] + METHODS:
                t = cv2.resize(S[m][i], (480, 270)); cv2.rectangle(t, (0, 0), (480, 24), (0, 0, 0), -1); cv2.putText(t, LABEL[m], (8, 17), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (240, 240, 240), 1, cv2.LINE_AA); row.append(t)
            while len(row) % 4: row.append(np.zeros((270, 480, 3), np.uint8))
            tiles.append(np.vstack([np.hstack(row[r:r + 4]) for r in range(0, len(row), 4)]))
        write(tiles, os.path.join(od, 'grid'))
        json.dump({'pid': pid, 'drawings': len(K), 'frames': len(F), 'cuts': seg[-1], 'metrics': M}, open(os.path.join(od, 'metrics.json'), 'w'), indent=1); allm[pid] = M
        print(pid, len(K), 'drawings', len(F), 'frames', json.dumps(M), flush=True)
    rows = ''.join(f"<section><h2>{p}</h2><video controls loop muted playsinline src='{p}/grid.mp4'></video><table>{''.join(f'<tr><td>{LABEL[m]}</td>' + ''.join(f'<td>{k} {v}</td>' for k, v in M.items()) + '</tr>' for m, M in json.load(open(os.path.join(BD, p, 'metrics.json')))['metrics'].items())}</table></section>"
                   for p in sorted(os.listdir(BD)) if os.path.exists(os.path.join(BD, p, 'metrics.json')))
    open(os.path.join(BD, 'index.html'), 'w').write("""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>In-between Bench</title>
<style>:root{color-scheme:dark}body{margin:0;background:#0a0d18;color:#eef0f7;font:14px/1.5 system-ui,sans-serif}main{max-width:1500px;margin:0 auto;padding:20px 16px 60px}h1{font:500 12px ui-monospace,Menlo,monospace;letter-spacing:.2em;text-transform:uppercase;color:#8b93ad}
h2{font-weight:500;margin:26px 0 8px}video{width:100%;border-radius:6px;background:#000}table{border-collapse:collapse;margin-top:8px;font:12px ui-monospace,Menlo,monospace}td{padding:3px 12px;border-top:1px solid rgba(255,255,255,.1)}</style></head><body><main>
<h1>In-between bench · the same keyframe drawings, seven ways to make the frames between · footage | A blend | B carry / C hold | D planes | E morph / F ebsynth | G rife</h1>
<p style="color:#8b93ad">pops/s: jumps beyond the footage's motion (lower is calmer) · residual: motion-compensated change · ghost: edge density against the drawings' own (1.0 = none doubled) · track: does the drawing move when the footage does (higher follows better)</p>""" + rows + '</main></body></html>')
    print('bench', os.path.join(BD, 'index.html'))
