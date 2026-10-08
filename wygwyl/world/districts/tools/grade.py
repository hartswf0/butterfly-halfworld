#!/usr/bin/env python3
"""THE GUARDIAN GRADE — the best frustum each world could find for each view, judged against baselines that try to embarrass it.
CLIP alone rewards colour, so every CLIP number is set against what colour alone earns:
  flat      a flat image of the reference's mean colour (the floor: a render that cannot beat this adds nothing)
  blur      the reference reduced to a 16×9 grid of colour (colour and layout, no structure or texture)
  sibling   the closest OTHER view in the same district (a sibling from the same prompt: what 'this place' looks like)
and beside CLIP, four measures CLIP cannot fake with colour:
  layout    correlation of 16×9 luminance grids (where the light and dark masses sit)
  edges     correlation of 12-bin edge-orientation histograms (the drawing: verticals, diagonals, horizon)
  texture   high-frequency energy of the render ÷ the reference's (1 = as much surface nuance; 0 = smooth plastic)
  colour    hue–saturation histogram intersection
Writes .work/grade.json (and prints the rubric table)."""
import os, json, glob, numpy as np, torch, open_clip
from PIL import Image, ImageFilter

T = os.path.dirname(os.path.abspath(__file__)); WK = os.path.join(T, '.work'); OUT = os.path.join(T, '..')
ST = '/Users/gaia/resurrecting atlantis/_dig/media/store'
S = json.load(open(f'{OUT}/scenes.json')); dist = {v['n']: v['d'] for v in S['views']}
dev = 'mps' if torch.backends.mps.is_available() else 'cpu'
wts = glob.glob(os.path.expanduser('~/.cache/huggingface/hub/models--laion--CLIP-ViT-B-32-laion2B-s34B-b79K/snapshots/*/open_clip_model.safetensors'))[0]
model, _, prep = open_clip.create_model_and_transforms('ViT-B-32', pretrained=wts); model = model.to(dev).eval()
V = np.load(f'{WK}/emb.npz')['views']
def emb(ims):
    with torch.no_grad(): return torch.nn.functional.normalize(model.encode_image(torch.stack([prep(i) for i in ims]).to(dev)).float(), dim=-1).cpu().numpy()
W, H = 448, 252
ref = {n: Image.open(f'{OUT}/v/{n:03d}.webp').convert('RGB').resize((W, H), Image.LANCZOS) for n in range(1, 101)}

# baselines in CLIP
flat = emb([Image.new('RGB', (W, H), tuple(int(c) for c in np.asarray(ref[n]).reshape(-1, 3).mean(0))) for n in range(1, 101)])
blur = emb([ref[n].resize((16, 9), Image.BOX).resize((W, H), Image.BILINEAR) for n in range(1, 101)])
b_flat = {n: float(flat[n - 1] @ V[n - 1]) for n in range(1, 101)}; b_blur = {n: float(blur[n - 1] @ V[n - 1]) for n in range(1, 101)}
rank_of = lambda e, n: int(((V @ e) > (V[n - 1] @ e)).sum() + 1)
r_flat = {n: rank_of(flat[n - 1], n) for n in range(1, 101)}; r_blur = {n: rank_of(blur[n - 1], n) for n in range(1, 101)}
VV = V @ V.T
sib = {n: max([float(VV[n - 1, m - 1]) for m in range(1, 101) if m != n and dist[m] == dist[n]] or [0]) for n in range(1, 101)}

# structure
def gray(im): return np.asarray(im.convert('L'), np.float32) / 255
def layout(a, b):
    A = np.asarray(a.convert('L').resize((16, 9), Image.BOX), np.float32).ravel(); B = np.asarray(b.convert('L').resize((16, 9), Image.BOX), np.float32).ravel()
    return float(np.corrcoef(A, B)[0, 1]) if A.std() > 1e-3 and B.std() > 1e-3 else 0.0
def ohist(im):
    g = gray(im); gx = np.zeros_like(g); gy = np.zeros_like(g); gx[:, 1:-1] = g[:, 2:] - g[:, :-2]; gy[1:-1] = g[2:] - g[:-2]
    m = np.hypot(gx, gy); a = np.mod(np.arctan2(gy, gx), np.pi); h, _ = np.histogram(a, 12, (0, np.pi), weights=m); return h / (h.sum() + 1e-9)
def edges(a, b): A, B = ohist(a), ohist(b); return float(np.corrcoef(A, B)[0, 1])
def hf(im): g = np.asarray(im.convert('L').filter(ImageFilter.FIND_EDGES), np.float32) / 255; return float(g[2:-2, 2:-2].mean())
def colour(a, b):
    def h(im): x = np.asarray(im.convert('HSV').resize((112, 63)), np.float32).reshape(-1, 3); hh, _, _ = np.histogram2d(x[:, 0], x[:, 1], (18, 8), ((0, 256), (0, 256)), weights=(x[:, 2] / 255) + 0.05); return hh / hh.sum()
    return float(np.minimum(h(a), h(b)).sum())

# calibration: what each structural measure gives for a sibling of the same place (ceiling) and for random other views (chance)
rng = np.random.default_rng(3); CAL = {}
for n in range(1, 101):
    sibs = [m for m in range(1, 101) if m != n and dist[m] == dist[n]]; m_s = max(sibs, key=lambda m: VV[n - 1, m - 1]) if sibs else None
    others = rng.choice([m for m in range(1, 101) if dist[m] != dist[n]], 8, replace=False)
    CAL[n] = {k: {'ceil': (f(ref[m_s], ref[n]) if m_s else None), 'chance': float(np.mean([f(ref[int(m)], ref[n]) for m in others]))} for k, f in [('layout', layout), ('edges', edges), ('colour', colour)]}
def norm(k, n, v):
    c = CAL[n][k]; hi = c['ceil'] if c['ceil'] is not None and c['ceil'] > c['chance'] + 0.02 else 1.0
    return max(0.0, min(1.2, (v - c['chance']) / (hi - c['chance'])))
out = {'baselines': {}, 'worlds': {}, 'calibration': {k: {'ceil_median': float(np.median([CAL[n][k]['ceil'] for n in CAL if CAL[n][k]['ceil'] is not None])), 'chance_median': float(np.median([CAL[n][k]['chance'] for n in CAL]))} for k in ['layout', 'edges', 'colour']}}
for n in range(1, 101): out['baselines'][n] = {'flat': round(b_flat[n], 3), 'blur': round(b_blur[n], 3), 'sibling': round(sib[n], 3), 'r_flat': r_flat[n], 'r_blur': r_blur[n], 'texture_ref': round(hf(ref[n]), 4)}
for world in ['mood', 'mood2', 'mood3', 'city']:
    d = f'{WK}/frustum-{world}'
    if not os.path.exists(f'{d}/search.json'): continue
    R = json.load(open(f'{d}/search.json')); rows = {}
    for k, r in R.items():
        n = int(k)
        if r.get('none'): rows[n] = {'none': True}; continue
        im = Image.open(f'{d}/{n:03d}.jpg').convert('RGB').resize((W, H))
        b = r['best']; rows[n] = {'cos': b['cos'], 'rank': b['rank'], 'hero': r.get('hero'), 'light': r.get('light'),
            'beats_flat': b['cos'] > b_flat[n], 'beats_blur': b['cos'] > b_blur[n], 'gain_over_blur': round(b['cos'] - b_blur[n], 3),
            'of_sibling': round((b['cos'] - b_flat[n]) / max(1e-3, sib[n] - b_flat[n]), 3),
            'layout': round(layout(im, ref[n]), 3), 'edges': round(edges(im, ref[n]), 3), 'texture': round(hf(im) / max(1e-4, hf(ref[n])), 3), 'colour': round(colour(im, ref[n]), 3)}
        r_ = rows[n]; r_['n_layout'], r_['n_edges'], r_['n_colour'] = (round(norm(k, n, r_[k]), 3) for k in ['layout', 'edges', 'colour'])
        r_['near'] = r.get('near')
        r_['n_clip'] = round(max(0.0, min(1.2, (b['cos'] - b_blur[n]) / max(0.02, sib[n] - b_blur[n]))), 3)
    out['worlds'][world] = rows

# ——— the rubric (guardian: start low, earn up; caps for red lines) ———
def grade(rows, borrowed=False):
    ok = [r for r in rows.values() if not r.get('none')]; n_all = 100
    if not ok: return None
    med = lambda xs: float(np.median(xs))
    top1 = sum(r['rank'] == 1 for r in ok) / n_all; top5 = sum(r['rank'] <= 5 for r in ok) / n_all
    C = {}
    C['C1 identity'] = {'w': 20, 'measure': f'top-1 {top1:.0%}, top-5 {top5:.0%} of all 100 views (CLIP picks the intended view among 100)', 'score': round(min(100, 100 * (0.6 * top1 + 0.4 * top5) / 0.6))}
    g = med([r['n_clip'] for r in ok]); bf = sum(r['beats_blur'] for r in ok) / len(ok)
    C['C2 likeness beyond colour'] = {'w': 15, 'measure': f'median share of the way from the blurred reference to a sibling view {g:.0%} (beats the blur in {bf:.0%})', 'score': round(100 * min(1, g))}
    lay, ed, nl, ne = med([r['layout'] for r in ok]), med([r['edges'] for r in ok]), med([r['n_layout'] for r in ok]), med([r['n_edges'] for r in ok])
    C['C3 composition'] = {'w': 15, 'measure': f'median layout r {lay:.2f} ({nl:.0%} of the way from chance to a sibling), edge-orientation r {ed:.2f} ({ne:.0%})', 'score': round(100 * min(1, 0.5 * nl + 0.5 * ne))}
    tx = med([r['texture'] for r in ok])
    C['C4 texture and material nuance'] = {'w': 15, 'measure': f'median high-frequency energy {tx:.2f}× the reference (1 = as much surface nuance)', 'score': round(max(0, min(100, 100 * min(tx, 1 / max(tx, 1e-3)))))}
    col, nc = med([r['colour'] for r in ok]), med([r['n_colour'] for r in ok])
    C['C5 colour and light'] = {'w': 10, 'measure': f'median hue–saturation histogram intersection {col:.2f} ({nc:.0%} of the way from chance to a sibling)', 'score': round(100 * min(1, nc))}
    cov = len(ok) / n_all; hero = [r['hero']['rank'] for r in ok if r.get('hero')]
    C['C6 placemaking coverage'] = {'w': 10, 'measure': f'{len(ok)} of 100 views have a place built for them' + (f'; the authored hero shots: median rank {med(hero):.0f}' if hero else ''), 'score': round(100 * cov * (0.5 if not hero else min(1, 5 / max(1, med(hero))) * 0.5 + 0.5))}
    nr = [r['near'] for r in ok if r.get('near')]
    if nr:
        t5 = sum(x['top5'] for x in nr) / n_all; mr = med([x['rank'] for x in nr])
        keep = t5 / max(1e-3, top5)
        C['C7 holds off the frustum'] = {'w': 15, 'measure': f'12 cameras 3–8 m and ~17° off the best frustum: the view stays in CLIP’s top 5 for {t5:.0%} of them (median rank {mr:.0f}); {keep:.0%} of the on-frustum identity survives', 'score': round(min(100, 100 * t5 / 0.6))}
    else: C['C7 holds off the frustum'] = {'w': 15, 'measure': 'not measured', 'score': 0}
    total = sum(c['score'] * c['w'] for c in C.values()) / 100; caps = []
    if borrowed: caps.append(('its likeness is the reference’s own pixels, so it is worth only what survives off the frustum', C['C7 holds off the frustum']['score']))
    if med([r['rank'] for r in ok]) > 10: caps.append(('median rank worse than 10: CLIP cannot tell which view a frame was meant to be', 45))
    if sum(not r['beats_flat'] for r in ok) / len(ok) > 0.3: caps.append(('in more than 30% of views a flat colour card beats the render', 40))
    if C['C4 texture and material nuance']['score'] < 30: caps.append(('surfaces carry under 30% of the references’ texture energy', 50))
    final = min([total] + [c for _, c in caps]); return {'criteria': C, 'weighted': round(total, 1), 'caps': caps, 'grade': round(final, 1),
        'median_rank': med([r['rank'] for r in ok]), 'median_cos': med([r['cos'] for r in ok])}
out['grades'] = {w: grade(rows, borrowed=(w == 'mood3')) for w, rows in out['worlds'].items()}
fb = [b['r_flat'] for b in out['baselines'].values()]; bb = [b['r_blur'] for b in out['baselines'].values()]
out['baseline_summary'] = {'flat_median_rank': float(np.median(fb)), 'blur_median_rank': float(np.median(bb)), 'blur_top5': sum(r <= 5 for r in bb) / 100,
                           'flat_median_cos': float(np.median([b['flat'] for b in out['baselines'].values()])), 'blur_median_cos': float(np.median([b['blur'] for b in out['baselines'].values()])),
                           'sibling_median_cos': float(np.median([b['sibling'] for b in out['baselines'].values()]))}
json.dump(out, open(f'{WK}/grade.json', 'w'))
print('baselines', out['baseline_summary'])
for w, g in out['grades'].items():
    if not g: continue
    print(f'\n== {w}: {g["grade"]} (weighted {g["weighted"]}) median rank {g["median_rank"]} median cos {g["median_cos"]:.3f}')
    for k, c in g['criteria'].items(): print(f'  {k:32s} {c["score"]:3d} (w{c["w"]})  {c["measure"]}')
    for why, cap in g['caps']: print(f'  CAP {cap}: {why}')
