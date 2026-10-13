#!/usr/bin/env python3
"""THE CELS, SECOND WAY (what the bench and the comparison argued for):
  1 a drawing every 3 s, not every second (and at every cut): on found film the same quality for half the drawing
  2 consistent drawings: each keyframe warm-started from the one before (story_warm.WarmScene), cold only where a shot begins,
    so shapes keep their identity and neighbouring drawings agree — the fix for boiling
  3 EbSynth for the frames between: each frame re-synthesised from its neighbouring drawings, guided by the footage (its frames and
    their edges), both directions blended by time; run in parallel across frames
Keyframes are taken from those the first pass already analysed (Grounding DINO + SAM 2.1 + OneFormer + Depth Pro, multiplane), so
nothing is re-read; only the drawing is redone. Writes <patch>/v2/ (drawings, labels), <patch>/cel_v2/ and <patch>/cartoon_v2.mp4,
and <patch>/v2.json with measures against the first pass (agreement of consecutive drawings, pops, ghosting, tracking, time).
  python3 story_cels2.py P01-002 …  [--every 36] [--workers 3] [--width 640]"""
import os, re, sys, json, glob, time, subprocess, numpy as np, cv2
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import story_warm as W
from story_interp_bench import load, measure, EB

VD = '/Users/gaia/Downloads/WYGWYL-CORPUS-ARCH/shots/video'; FPS = 12
arg = lambda k, d: type(d)(sys.argv[sys.argv.index('--' + k) + 1]) if '--' + k in sys.argv else d
EVERY, WORKERS, EW = arg('every', 36), arg('workers', 3), arg('width', 640)
edges = lambda im: cv2.Canny(cv2.cvtColor(im, cv2.COLOR_BGR2GRAY), 60, 140) > 0

def agreement(cels, keys, G):
    """how much consecutive drawings agree once the footage's motion is taken out: edge F between the previous drawing carried to
    this keyframe and this keyframe's own drawing (1 = the same drawing moved; low = re-cut from scratch)"""
    fs = []
    for a, b in zip(keys, keys[1:]):
        m = W.flow_map(G[a], G[b]); ca = cv2.remap(cels[a], m[0], m[1], cv2.INTER_NEAREST, borderMode=cv2.BORDER_REPLICATE)
        ea, eb = edges(ca), edges(cels[b])
        if not ea.any() or not eb.any(): continue
        da = cv2.distanceTransform((~ea).astype(np.uint8), cv2.DIST_L2, 3); db = cv2.distanceTransform((~eb).astype(np.uint8), cv2.DIST_L2, 3)
        p = float((da[eb] <= 2).mean()); r = float((db[ea] <= 2).mean()); fs.append(2 * p * r / max(p + r, 1e-6))
    return round(float(np.mean(fs)), 3) if fs else None

def between(work, F, G, seg, keys, cel):
    """every frame that is not a drawing, re-synthesised by EbSynth from its neighbouring drawings (both directions, blended by time),
    guided by the footage and its edges; frames run in parallel"""
    h, w = G[0].shape; tmp = os.path.join(work, 'eb2'); os.makedirs(tmp, exist_ok=True); H2 = int(EW * h / w); sm = lambda im: cv2.resize(im, (EW, H2), interpolation=cv2.INTER_AREA)
    ed = lambda g: cv2.cvtColor(cv2.Canny(cv2.GaussianBlur(g, (0, 0), 1.2), 50, 120), cv2.COLOR_GRAY2BGR)
    for k in keys:
        cv2.imwrite(f'{tmp}/s{k}.png', sm(cel[k])); cv2.imwrite(f'{tmp}/g{k}.png', sm(F[k])); cv2.imwrite(f'{tmp}/e{k}.png', sm(ed(G[k])))
    def around(i):
        ks = [k for k in keys if seg[k] == seg[i]] or sorted(keys, key=lambda k: abs(k - i))[:1]
        return max([k for k in ks if k <= i], default=ks[0]), min([k for k in ks if k >= i], default=ks[-1])
    def frame(i):
        if i in cel: return i, cel[i]
        a, b = around(i); cv2.imwrite(f'{tmp}/t{i}.png', sm(F[i])); cv2.imwrite(f'{tmp}/te{i}.png', sm(ed(G[i]))); ims = []
        for k in sorted({a, b}):
            o = f'{tmp}/o{i}_{k}.png'
            subprocess.run([EB, '-style', f'{tmp}/s{k}.png', '-guide', f'{tmp}/g{k}.png', f'{tmp}/t{i}.png', '-weight', '2', '-guide', f'{tmp}/e{k}.png', f'{tmp}/te{i}.png', '-weight', '1', '-output', o], capture_output=True)
            ims.append(cv2.resize(cv2.imread(o), (w, h), interpolation=cv2.INTER_CUBIC))
        return i, (cv2.addWeighted(ims[0], 1 - (i - a) / (b - a), ims[1], (i - a) / (b - a), 0) if len(ims) == 2 else ims[0])
    with ThreadPoolExecutor(WORKERS) as ex: out = dict(ex.map(frame, range(len(F))))
    return [out[i] for i in range(len(F))]

def run(pid):
    t0 = time.perf_counter(); work, F, G, K, seg = load(pid); h, w = G[0].shape
    if not K: return None
    W.SP.OUT = os.path.join(work, 'out')
    # 1 · a drawing every EVERY frames within each shot, from the keyframes already read
    keys = []
    for sgi in sorted(set(seg)):
        ks = sorted(k for k in K if seg[k] == sgi)
        for k in ks:
            if not keys or seg[keys[-1]] != sgi or k - keys[-1] >= EVERY: keys.append(k)
        if ks and keys[-1] != ks[-1] and ks[-1] - keys[-1] >= EVERY // 2 and (max(i for i in range(len(F)) if seg[i] == sgi) - keys[-1]) > EVERY: keys.append(ks[-1])
    # 2 · consistent drawings, warm-started along each shot
    v2 = os.path.join(work, 'v2'); os.makedirs(v2, exist_ok=True); cel, prev, scores, carried = {}, None, [], []
    for k in keys:
        sid = f"vid-{re.sub(r'[^a-z0-9]+', '-', pid.lower())}-kf{k:05d}_0"
        if prev is not None and seg[k] != seg[keys[keys.index(k) - 1]]: prev = None          # a new shot starts cold
        prev, sc, cr = W.draw(sid, v2, prev=prev); scores.append(sc); carried.append(cr)
        cel[k] = cv2.resize(cv2.imread(os.path.join(v2, sid, 'program', 'frame0.png')), (w, h), interpolation=cv2.INTER_AREA)
    t_draw = time.perf_counter() - t0
    # 3 · EbSynth between them, in parallel
    seq = between(work, F, G, seg, keys, cel); t_all = time.perf_counter() - t0
    od = os.path.join(work, 'cel_v2'); os.makedirs(od, exist_ok=True)
    for f in glob.glob(os.path.join(od, '*.png')): os.remove(f)
    for i, x in enumerate(seq): cv2.imwrite(os.path.join(od, f'{i + 1:05d}.png'), x)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', str(FPS), '-i', os.path.join(od, '%05d.png'), '-c:v', 'libx264', '-crf', '17', '-pix_fmt', 'yuv420p', os.path.join(work, 'cartoon_v2.mp4')], check=True)
    # measures, against the first pass on the same patch
    v1 = [cv2.resize(cv2.imread(x), (w, h)) for x in sorted(glob.glob(os.path.join(work, 'cel_frames', '*.png')))][:len(F)]
    film_s = len(F) / FPS
    M = {'pid': pid, 'frames': len(F), 'keys_v1': len(K), 'keys_v2': len(keys), 'carried': round(float(np.mean([c for c in carried if c])), 3) if any(carried) else 0.0,
         'agreement_v1': agreement({k: K[k]['cel'] for k in K}, sorted(K), G), 'agreement_v2': agreement(cel, keys, G),
         'v2': {**measure(seq, G, seg, {k: {'cel': cel[k]} for k in keys}), 'draw_s_per_s': round(t_draw / film_s, 1), 'total_s_per_s': round(t_all / film_s, 1)},
         'v1': measure(v1, G, seg, K) if len(v1) == len(F) else None,
         'dE_v2': round(float(np.mean([x['dE'] for x in scores])), 2), 'dE_v1': round(float(np.mean([v['scene']['score']['dE'] for v in K.values()])), 2)}
    json.dump(M, open(os.path.join(work, 'v2.json'), 'w'), indent=1); return M

if __name__ == '__main__':
    for pid in [a for i, a in enumerate(sys.argv[1:], 1) if not a.startswith('--') and not sys.argv[i - 1].startswith('--')]:
        m = run(pid)
        if m: print(pid, json.dumps(m), flush=True)
