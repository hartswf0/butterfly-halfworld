#!/usr/bin/env python3
"""
THE STRIPS — what each entry should show of itself, chosen by measurement.

    python3 cut/pf/strips.py [--only I01,W02] [--refresh]

The first version of THE DOOR showed the first image it found in alphabetical
order. That is not a preview, it is an accident: P001 is simply the file whose
name sorts first, and a folder of 2,033 cut-outs was represented by whichever
one began with a digit. Worse, a frame lifted from the head of a clip is usually
black, because cuts fade in.

This pass does three things instead.

FIRST, it gathers candidates that span the thing: up to 24 images sampled evenly
across a collection, or frames pulled from across a clip's duration, or one
frame from each of two dozen clips in a folder of them. Spread, not head.

SECOND, it measures every candidate — tonal spread, edge energy, entropy,
saturation, mean light — and scores it. A frame that is nearly all one value
carries nothing no matter where it came from, so black frames and blown frames
fall out on their own rather than by a rule about timestamps.

THIRD, and this is the part that matters: it does not pick the eight best. Eight
best frames from one collection are eight versions of the same frame. It picks
the best one, then repeatedly picks the candidate FURTHEST from everything
already picked, in a space of 8x8 luma plus a hue histogram. The strip that comes
out shows the RANGE of the thing — which is what you actually need to tell two
folders apart, and what a single still can never show.

The same measurements then answer the harder question across entries. Each entry
gets a signature (the median of its chosen frames, plus how internally varied
they are), every signature is z-scored against all the others, and the axis where
an entry sits furthest from the pack is the difference that makes a difference
about it. Stated on its card, in its own units, with the median it departs from.
"""
import os, sys, json, math, subprocess, tempfile, shutil, time
from concurrent.futures import ThreadPoolExecutor
import numpy as np, cv2

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from door_entries import E, MEASURE, PREVIEW, NOPREVIEW, IMGX, VIDX

BASE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT  = os.path.join(BASE, 'door_strips')
FW, FH = 300, 169          # one frame of the strip; 16:9, the card's own shape
NFRAME = 8                 # eight is a contact sheet you can read at a glance
NCAND  = 24
SKIP   = {'index.html', 'door_thumbs', 'door_strips'}   # this pass's own output is not evidence

def roots_of(eid, href):
    m = MEASURE.get(eid)
    if m is None:
        m = os.path.dirname(href) if os.path.basename(href) == 'index.html' else href
    ms = m if isinstance(m, list) else [m]
    if eid in PREVIEW:
        p = PREVIEW[eid]
        ms = p if isinstance(p, list) else [p]
    out = [os.path.normpath(os.path.join(BASE, x)) for x in ms]
    return [x for x in out if os.path.exists(x)]

def gather(paths):
    imgs, vids = [], []
    for p in paths:
        if os.path.isfile(p):
            (vids if p.lower().endswith(VIDX) else imgs).append(p); continue
        for root, d, files in os.walk(p):
            d[:] = sorted(x for x in d if not x.startswith('.') and x not in SKIP)
            for f in sorted(files):
                if f.startswith('.') or f in SKIP: continue
                l = f.lower()
                if l.endswith(IMGX): imgs.append(os.path.join(root, f))
                elif l.endswith(VIDX): vids.append(os.path.join(root, f))
    return sorted(imgs), sorted(vids)

def spread(xs, n):
    """n items spread evenly across a list — not the first n, which is the bug
       this whole pass exists to fix"""
    if len(xs) <= n: return list(xs)
    return [xs[int(round(i * (len(xs) - 1) / (n - 1)))] for i in range(n)]

def duration(p):
    try:
        r = subprocess.run(['ffprobe','-v','error','-show_entries','format=duration',
                            '-of','default=nw=1:nk=1', p], capture_output=True, text=True, timeout=30)
        return float((r.stdout or '0').strip() or 0)
    except Exception: return 0.0

def grab(p, at, dst):
    """-ss BEFORE -i is an input seek: it jumps instead of decoding 391 MB to
       reach one frame"""
    try:
        subprocess.run(['ffmpeg','-v','error','-ss',f'{max(0.0,at):.2f}','-i',p,
                        '-frames:v','1','-y',dst], capture_output=True, timeout=90)
        return os.path.exists(dst) and os.path.getsize(dst) > 0
    except Exception: return False

def candidates(eid, href, tmp):
    imgs, vids = gather(roots_of(eid, href))
    out = []
    if imgs:
        out = [('img', p, None) for p in spread(imgs, NCAND)]
    if vids and len(out) < NCAND:
        want = NCAND - len(out)
        picks = spread(vids, min(want, len(vids)))
        per = max(1, int(math.ceil(want / float(len(picks)))))
        jobs = []
        for v in picks:
            dur = duration(v)
            # inside the clip, never at its ends: cuts fade in and fade out
            ts = ([dur * (0.22 + 0.56 * (k / float(max(1, per - 1)))) for k in range(per)]
                  if dur > 2.0 and per > 1 else [dur * 0.4 if dur > 1.5 else 0.0])
            for k, t in enumerate(ts):
                jobs.append((v, t, os.path.join(tmp, f'{abs(hash((v,k)))%10**12}.png')))
        with ThreadPoolExecutor(max_workers=6) as ex:
            got = list(ex.map(lambda j: (grab(j[0], j[1], j[2]), j), jobs))
        for ok, j in got:
            if ok: out.append(('vid', j[2], j[0]))
    return out[:NCAND]

def features(path):
    im = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    if im is None: return None
    if im.dtype != np.uint8:
        im = cv2.normalize(im, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
    if im.ndim == 2: im = cv2.cvtColor(im, cv2.COLOR_GRAY2BGR)
    if im.shape[2] == 4:
        a = im[:, :, 3]
        ys, xs = np.nonzero(a > 12)
        if len(ys): im = im[ys.min():ys.max()+1, xs.min():xs.max()+1]
        al = im[:, :, 3:4].astype(np.float32) / 255.0
        im = (im[:, :, :3].astype(np.float32) * al + 244.0 * (1 - al)).astype(np.uint8)
    im = im[:, :, :3]
    sm = cv2.resize(im, (128, 128), interpolation=cv2.INTER_AREA)
    g  = cv2.cvtColor(sm, cv2.COLOR_BGR2GRAY)
    hsv = cv2.cvtColor(sm, cv2.COLOR_BGR2HSV)
    gf = g.astype(np.float32)
    lo, hi = np.percentile(gf, 3), np.percentile(gf, 97)
    h = np.histogram(g, bins=32, range=(0, 256))[0].astype(np.float32); h /= max(1.0, h.sum())
    ent = float(-(h[h > 0] * np.log2(h[h > 0])).sum())
    edge = float(np.abs(cv2.Laplacian(g, cv2.CV_32F)).mean())
    sat = float(hsv[:, :, 1].mean()) / 255.0
    light = float(gf.mean()) / 255.0
    rng = float(hi - lo) / 255.0
    # descriptor: coarse layout + where the colour is, so "far apart" means
    # genuinely different pictures rather than different exposures
    d8 = cv2.resize(g, (8, 8), interpolation=cv2.INTER_AREA).astype(np.float32).ravel()
    d8 = (d8 - d8.mean()) / (d8.std() + 1e-6)
    hh = np.histogram(hsv[:, :, 0], bins=12, range=(0, 180),
                      weights=hsv[:, :, 1].astype(np.float32))[0]
    hh = hh / (hh.sum() + 1e-6)
    desc = np.concatenate([d8 / 8.0, hh * 3.0])
    # a frame that is nearly one value carries nothing, wherever it came from
    q = ent * 0.42 + min(edge, 40.0) / 40.0 * 1.3 + rng * 1.5 - abs(light - 0.5) * 0.9
    if rng < 0.07: q -= 3.0
    return dict(q=float(q), ent=ent, edge=edge, sat=sat, light=light, rng=rng, desc=desc)

def choose(cands):
    """best one, then furthest-from-chosen, repeatedly: a strip that shows the
       range instead of eight versions of the same frame"""
    scored = []
    for kind, path, src in cands:
        f = features(path)
        if f: scored.append(dict(f, path=path, src=src or path, kind=kind))
    if not scored: return []
    scored.sort(key=lambda r: -r['q'])
    picked = [scored[0]]
    pool = scored[1:]
    while pool and len(picked) < NFRAME:
        best, bi = None, -1
        for i, r in enumerate(pool):
            d = min(float(np.linalg.norm(r['desc'] - p['desc'])) for p in picked)
            s = d + r['q'] * 0.22          # far, but not far and empty
            if best is None or s > best: best, bi = s, i
        picked.append(pool.pop(bi))
    return picked

def strip(picked, dst):
    tiles = []
    for r in picked:
        im = cv2.imread(r['path'], cv2.IMREAD_UNCHANGED)
        if im is None: continue
        if im.dtype != np.uint8:
            im = cv2.normalize(im, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
        if im.ndim == 2: im = cv2.cvtColor(im, cv2.COLOR_GRAY2BGR)
        if im.shape[2] == 4:
            a = im[:, :, 3]; ys, xs = np.nonzero(a > 12)
            if len(ys): im = im[ys.min():ys.max()+1, xs.min():xs.max()+1]
            al = im[:, :, 3:4].astype(np.float32) / 255.0
            im = (im[:, :, :3].astype(np.float32) * al + 244.0 * (1 - al)).astype(np.uint8)
        im = im[:, :, :3]
        ih, iw = im.shape[:2]
        s = max(FW / float(iw), FH / float(ih))
        im = cv2.resize(im, (max(FW, int(round(iw*s))), max(FH, int(round(ih*s)))),
                        interpolation=cv2.INTER_AREA)
        y = (im.shape[0] - FH) // 2; x = (im.shape[1] - FW) // 2
        tiles.append(im[y:y+FH, x:x+FW])
    # Padding a short strip by repeating frames makes one picture look like
    # eight. Fewer than three distinct frames is not a preview; say so and let
    # the entry fall back to its drawn mark.
    if len(tiles) < 3: return 0
    while len(tiles) < NFRAME: tiles.append(tiles[len(tiles) % max(1, len(tiles))].copy())
    cv2.imwrite(dst, np.hstack(tiles[:NFRAME]), [cv2.IMWRITE_WEBP_QUALITY, 76])
    return len(tiles[:NFRAME])

def main():
    only = None
    for a in sys.argv[1:]:
        if a.startswith('--only'): only = set(a.split('=', 1)[-1].replace('--only', '').strip(', ').split(','))
    if only: only = {x for x in only if x}
    refresh = '--refresh' in sys.argv
    os.makedirs(OUT, exist_ok=True)
    idx_path = os.path.join(OUT, 'index.json')
    idx = {}
    if os.path.exists(idx_path) and not refresh:
        try: idx = json.load(open(idx_path))
        except Exception: idx = {}

    todo = [(eid, href) for eid, kind, name, href, line, note in E
            if eid not in NOPREVIEW and (not only or eid in only)
            and (refresh or eid not in idx or not os.path.exists(os.path.join(OUT, f'{eid}.webp')))]
    print(f'{len(todo)} to do · {len(idx)} already made\n')

    t0 = time.time()
    for n, (eid, href) in enumerate(todo, 1):
        tmp = tempfile.mkdtemp(prefix=f'strip_{eid}_')
        try:
            cands = candidates(eid, href, tmp)
            if not cands:
                print(f'  {eid}  no candidates'); idx.pop(eid, None); continue
            picked = choose(cands)
            if not picked:
                print(f'  {eid}  nothing readable'); idx.pop(eid, None); continue
            k = strip(picked, os.path.join(OUT, f'{eid}.webp'))
            med = lambda key: float(np.median([p[key] for p in picked]))
            # how varied this entry is INSIDE itself — the mean distance between
            # the frames it chose. A folder of near-identical renders and a folder
            # of unrelated works can hold the same number of files.
            ds = [float(np.linalg.norm(a['desc'] - b['desc']))
                  for i, a in enumerate(picked) for b in picked[i+1:]]
            idx[eid] = dict(
                frames=k, n_cand=len(cands),
                sources=[os.path.relpath(p['src'], BASE) for p in picked],
                light=med('light'), contrast=med('rng'), edge=med('edge'),
                colour=med('sat'), variety=float(np.mean(ds)) if ds else 0.0)
            print(f"  {eid:4s} {k} frames from {len(cands):2d} candidates  "
                  f"light {idx[eid]['light']:.2f} contrast {idx[eid]['contrast']:.2f} "
                  f"edge {idx[eid]['edge']:5.1f} colour {idx[eid]['colour']:.2f} "
                  f"variety {idx[eid]['variety']:.2f}", flush=True)
        except Exception as ex:
            print(f'  {eid}  FAILED: {ex}')
        finally:
            shutil.rmtree(tmp, ignore_errors=True)

    # the difference that makes a difference: where does each entry sit furthest
    # from all the others? z-scored, so five incomparable units become comparable
    AX = [('light', 'light'), ('contrast', 'contrast'), ('edge', 'detail'),
          ('colour', 'colour'), ('variety', 'variety')]
    for key, _ in AX:
        vals = np.array([v[key] for v in idx.values()], np.float64)
        mu, sd = float(np.median(vals)), float(vals.std() or 1.0)
        for v in idx.values(): v[key + '_z'] = (v[key] - mu) / sd
        for v in idx.values(): v[key + '_med'] = mu
    for eid, v in idx.items():
        best = max(AX, key=lambda a: abs(v[a[0] + '_z']))
        k, label = best
        v['apart'] = dict(axis=label, key=k, z=v[k + '_z'],
                          value=v[k], median=v[k + '_med'],
                          dir='more' if v[k + '_z'] > 0 else 'less')
    json.dump(idx, open(idx_path, 'w'), indent=1)
    print(f"\n{len(idx)} strips · {time.time()-t0:.0f}s · -> {os.path.relpath(OUT, os.getcwd())}")

if __name__ == '__main__':
    main()
