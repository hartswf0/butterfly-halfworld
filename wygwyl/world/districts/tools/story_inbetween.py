#!/usr/bin/env python3
"""THE IN-BETWEENS, AGAIN: the same keyframe cels (wygwyl-world-arch's scene-program drawings, one about every second), carried
through the patch differently, because blending two different drawings is what made the films hard to watch.
  their way    every in-between = the two neighbouring drawings, each warped by optical flow, cross-blended → shapes re-cut every
               second ("boiling") and two drawings show through each other ("ghosting")
  this way     ONE drawing at a time, carried along the footage's flow for as long as the warp still explains the footage; a
               new drawing only when it no longer does (re-key on demand), entered with a 3-frame dissolve; never across a cut
               (a stricter cut test: histogram break or a jump in the picture). A still shot keeps one drawing throughout.
  measured     boiling   how much the cel changes beyond what the footage's own motion explains: each cel against the previous
                         cel carried forward by the flow (lower = the drawing holds together)
               ghosting  edge density of a frame against its drawings' own (1.0 = no doubled edges)
               switches  drawings entered per second
Writes <patch>/cel2_frames/ and <patch>/cartoon2.mp4 beside theirs, and metrics to <patch>/inbetween.json.
  python3 story_inbetween.py P01-004 P02-006 …   |   --all   [--compare → <patch>/compare2.mp4: theirs | this way]"""
import os, sys, re, json, glob, subprocess, numpy as np, cv2

VD = '/Users/gaia/Downloads/WYGWYL-CORPUS-ARCH/shots/video'; FPS = 12
def flow_map(src_g, dst_g, scale=0.5):                    # for each pixel of dst, where it was in src (remap-ready)
    h, w = dst_g.shape; a = cv2.resize(dst_g, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA); b = cv2.resize(src_g, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
    f = cv2.resize(cv2.calcOpticalFlowFarneback(a, b, None, 0.5, 4, 21, 3, 7, 1.5, 0), (w, h)) / scale
    gx, gy = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32)); return gx + f[..., 0], gy + f[..., 1]
warp = lambda im, m: cv2.remap(im, m[0], m[1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
edges = lambda im: float((cv2.Canny(cv2.cvtColor(im, cv2.COLOR_BGR2GRAY), 60, 140) > 0).mean())

def run(pid, compare=False, err_thr=16.0, dissolve=3):
    work = os.path.join(VD, pid); frames = sorted(glob.glob(os.path.join(work, 'frames', '*.png')))
    if not frames: return None
    F = [cv2.imread(f) for f in frames]; G = [cv2.cvtColor(x, cv2.COLOR_BGR2GRAY) for x in F]; h, w = G[0].shape
    keys = {}
    for kf in glob.glob(os.path.join(work, 'keyframes', 'kf*_0.png')):
        i = int(re.search(r'kf(\d+)_0', kf).group(1)); sid = f"vid-{re.sub(r'[^a-z0-9]+', '-', pid.lower())}-kf{i:05d}_0"
        p = os.path.join(work, 'out', sid, 'program', 'frame0.png')
        if os.path.exists(p) and i < len(F): c = cv2.imread(p); keys[i] = c if c.shape[:2] == (h, w) else cv2.resize(c, (w, h), interpolation=cv2.INTER_AREA)
    if not keys: return None
    # cuts: a histogram break, or the picture jumping
    hist = lambda im: cv2.normalize(cv2.calcHist([cv2.cvtColor(im, cv2.COLOR_BGR2HSV)], [0, 1], None, [16, 8], [0, 180, 0, 256]), None).flatten()
    seg = [0] * len(F); s = 0
    for i in range(1, len(F)):
        jump = float(np.abs(cv2.resize(G[i], (64, 36)).astype(np.float32) - cv2.resize(G[i - 1], (64, 36)).astype(np.float32)).mean())
        if cv2.compareHist(hist(F[i - 1]), hist(F[i]), cv2.HISTCMP_CORREL) < 0.75 or jump > 38: s += 1
        seg[i] = s
    out, active, prev_cel, fade, switches = [], None, None, 0, 0
    for i in range(len(F)):
        cand = [k for k in keys if seg[k] == seg[i]] or sorted(keys, key=lambda k: abs(k - i))[:1]      # a segment with no drawing borrows the nearest
        def carried(k):
            if k == i: return keys[k], 0.0
            m = flow_map(G[k], G[i]); err = float(np.abs(warp(F[k], m).astype(np.float32) - F[i].astype(np.float32)).mean())
            return warp(keys[k], m), err
        if active not in cand: active = min(cand, key=lambda k: abs(k - i)); cel, err = carried(active); new = True
        else:
            cel, err = carried(active); new = False
            if err > err_thr:                                                         # the drawing no longer explains the footage
                best = min(cand, key=lambda k: abs(k - i))
                if best != active: c2, e2 = carried(best)
                if best != active and e2 < err - 2: active, cel, err, new = best, c2, e2, True
        if new and prev_cel is not None and seg[i] == seg[i - 1]: fade = dissolve; switches += 1; base = prev_cel
        if fade > 0: a = fade / (dissolve + 1); cel = cv2.addWeighted(base, a, cel, 1 - a, 0); fade -= 1
        out.append(cel); prev_cel = cel
    # measures, for theirs and this way
    FM = {i: flow_map(G[i - 1], G[i]) for i in range(1, len(F)) if seg[i] == seg[i - 1]}
    def measure(seq):
        bo, gh = [], []
        ke = np.mean([edges(c) for c in keys.values()]) + 1e-6
        for i in range(1, len(seq)):
            if i in FM: bo.append(float(np.abs(seq[i].astype(np.float32) - warp(seq[i - 1], FM[i]).astype(np.float32)).mean()))
            gh.append(edges(seq[i]) / ke)
        return {'boiling': round(float(np.mean(bo)) if bo else 0.0, 2), 'ghosting': round(float(np.mean(gh)), 3)}
    theirs = [cv2.imread(f) for f in sorted(glob.glob(os.path.join(work, 'cel_frames', '*.png')))]
    M = {'pid': pid, 'frames': len(F), 'drawings': len(keys), 'cuts': seg[-1], 'this': {**measure(out), 'switches_per_s': round(switches / (len(F) / FPS), 2)},
         'theirs': measure([t if t.shape[:2] == (h, w) else cv2.resize(t, (w, h)) for t in theirs]) if len(theirs) == len(F) else None}
    od = os.path.join(work, 'cel2_frames'); os.makedirs(od, exist_ok=True)
    for f in glob.glob(os.path.join(od, '*.png')): os.remove(f)
    for i, c in enumerate(out): cv2.imwrite(os.path.join(od, f'{i + 1:05d}.png'), c)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', str(FPS), '-i', os.path.join(od, '%05d.png'), '-c:v', 'libx264', '-crf', '17', '-pix_fmt', 'yuv420p', os.path.join(work, 'cartoon2.mp4')], check=True)
    if compare and len(theirs) == len(F):
        cd = os.path.join(work, 'cmp2_frames'); os.makedirs(cd, exist_ok=True)
        for i, (a, b) in enumerate(zip(theirs, out)): cv2.imwrite(os.path.join(cd, f'{i + 1:05d}.png'), np.hstack([cv2.resize(a, (w, h)), b]))
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', str(FPS), '-i', os.path.join(cd, '%05d.png'), '-vf', 'scale=1600:-2', '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p', os.path.join(work, 'compare2.mp4')], check=True)
    json.dump(M, open(os.path.join(work, 'inbetween.json'), 'w'), indent=1); return M

if __name__ == '__main__':
    ids = sorted(os.path.basename(d) for d in glob.glob(os.path.join(VD, 'P*')) if os.path.exists(os.path.join(d, 'cartoon.mp4'))) if '--all' in sys.argv else [a for a in sys.argv[1:] if not a.startswith('--')]
    for pid in ids:
        m = run(pid, compare='--compare' in sys.argv)
        if m: print(pid, m['drawings'], 'drawings', m['cuts'], 'cuts · this', m['this'], '· theirs', m['theirs'], flush=True)
