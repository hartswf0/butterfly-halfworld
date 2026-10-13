#!/usr/bin/env python3
"""CONSISTENT KEYFRAMES: wygwyl-world-arch's scene program, warm-started. Their Scene draws each keyframe from nothing (a fresh
semantic seed, then splits and merges), so neighbouring drawings disagree and the in-betweens boil. A WarmScene starts instead from
the previous keyframe's finished drawing: its label map (one region per shape, each with its plane) carried along the footage's
optical flow to this frame. Colours are refitted to this frame by the Scene itself; where the carried drawing does not fit (new
content, disocclusion: the warped footage disagrees with this frame) the fresh semantic seed fills in with new shapes; then a short
refine splits or merges only what changed. Shapes keep their ids from drawing to drawing, which is what a vector in-between needs.
Used by story_cels2.py."""
import os, sys, numpy as np, cv2
from scipy import ndimage as ndi

MIRROR = '/Users/gaia/Downloads/WYGWYL-CORPUS-ARCH/shots'
sys.path.insert(0, MIRROR)
import scene_program as SP                                   # their module, imported through the mirror so ROOT is the mirror

def flow_map(src_g, dst_g, scale=0.5):                       # for each pixel of dst, where it was in src
    h, w = dst_g.shape; a = cv2.resize(dst_g, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA); b = cv2.resize(src_g, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
    f = cv2.resize(cv2.calcOpticalFlowFarneback(a, b, None, 0.5, 4, 21, 3, 7, 1.5, 0), (w, h)) / scale
    gx, gy = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32)); return gx + f[..., 0], gy + f[..., 1]

class WarmScene(SP.Scene):
    """Scene(sid) seeded from a previous drawing: prev = (S, plane, rgb) of the previous keyframe, or None for a cold start."""
    def __init__(s, sid, prev=None, err_thr=28.0, **kw):
        s._prev, s._err_thr = prev, err_thr
        super().__init__(sid, **kw)

    def seed(s):
        super().seed()                                       # the fresh seed: kept for whatever the old drawing cannot explain
        if s._prev is None: return
        pS, pplane, prgb = s._prev
        if pS.shape != s.S.shape:
            pS = cv2.resize(pS.astype(np.float32), (s.W, s.H), interpolation=cv2.INTER_NEAREST).astype(np.int32)
            prgb = cv2.resize(prgb, (s.W, s.H), interpolation=cv2.INTER_AREA)
        g0, g1 = cv2.cvtColor(prgb, cv2.COLOR_RGB2GRAY), cv2.cvtColor(s.rgb, cv2.COLOR_RGB2GRAY)
        mx, my = flow_map(g0, g1)
        Sw = cv2.remap(pS.astype(np.float32), mx, my, cv2.INTER_NEAREST, borderMode=cv2.BORDER_CONSTANT, borderValue=0).astype(np.int32)
        err = cv2.GaussianBlur(np.abs(cv2.remap(prgb, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE).astype(np.float32) - s.rgb.astype(np.float32)).mean(2), (0, 0), 4)
        bad = (Sw == 0) | (err > s._err_thr)                 # where the old drawing does not describe this frame
        fresh = s.S.copy(); off = int(pS.max()) + 1
        S = np.where(bad, np.where(fresh > 0, fresh + off, 0), Sw)
        plane = {int(l): int(pplane[l]) for l in np.unique(Sw) if l and l in pplane}
        for l in np.unique(fresh[bad]):
            if l: plane[int(l) + off] = s.plane[int(l)]
        # a carried shape torn into pieces keeps its largest piece; the rest join their surroundings
        for l in list(plane):
            m = S == l
            if not m.any(): plane.pop(l); continue
            lab, n = ndi.label(m)
            if n > 1:
                keep = 1 + int(np.argmax(ndi.sum(m, lab, range(1, n + 1))))
                S[(lab > 0) & (lab != keep)] = 0
        holes = S == 0
        if holes.any():
            _, (iy, ix) = ndi.distance_transform_edt(holes, return_indices=True); S = S[iy, ix]
        s.S = S.astype(np.int32); s.plane = {l: p for l, p in plane.items() if (s.S == l).any()}; s.nxt = int(s.S.max()) + 1
        s.objs = list(ndi.find_objects(s.S)); s.carried = float((~bad).mean())

def draw(sid, out_dir, prev=None, rounds=None, lam=0.15):
    """draw one keyframe (cold or warm), export into out_dir/<sid>/program, return (S, plane, rgb) to carry forward"""
    sc = WarmScene(sid, prev=prev, lam=lam)
    sc.refine(rounds if rounds is not None else (6 if prev is not None else 10), log=lambda *a: None)
    od = sc.od; sc.od = os.path.join(out_dir, sid); os.makedirs(sc.od, exist_ok=True)
    sc.export(); sc.od = od
    np.savez_compressed(os.path.join(out_dir, sid, 'program', 'labels.npz'), S=sc.S.astype(np.int32), planes=np.array(sorted(sc.plane.items()), np.int32))
    return (sc.S.copy(), dict(sc.plane), sc.rgb.copy()), sc.final, getattr(sc, 'carried', 0.0)
