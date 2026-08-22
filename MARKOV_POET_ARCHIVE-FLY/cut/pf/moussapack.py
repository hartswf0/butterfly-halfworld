#!/usr/bin/env python3
"""
THE REAL CARRIER.

HELD walked a fifteen-part mannequin: `partsAt(t)` — a hand-drawn stick figure
with a hip, a hat and a sway. Everything bound to it was bound to something
invented. MOUSSA has the actual poet: 135 shots, and a segmenter that already
tracked his body through 11,636 frames sitting in `bodycache/`.

This packs that into something a browser can carry:

    frames   192x144 RGB, the shot itself
    mask     192x144 uint8, the tracked body — SAM 2 through the shot
    surface  per frame, the body's own axis

A real silhouette has no joints, so it cannot offer (bone,u,v). But it has a
SHAPE, and a shape has second moments: a centroid, a principal axis, an extent
along it and a half-width across it. That is one bone, derived rather than
authored, and it is enough for u to run head-to-foot and v across — the same
contract `chart.mjs` provides for the drawn figure, from measurement instead of
from a rig.

    u = 0 at the head end, 1 at the foot end
    v = -1 at one silhouette edge, +1 at the other

WHICH END IS THE HEAD is not arbitrary and is not guessed: a standing body has
more mass at the shoulders than the ankles, so the end with the greater mass is
u=0. When the two ends are within a few percent the sign is UNRESOLVED, and that
is recorded rather than picked, because a coin-flip here would flip the skin
upside down on some frames and not others.
"""
import json, os, subprocess, sys, hashlib
import numpy as np
import cv2

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.dirname(HERE)
ROOT = os.path.dirname(BASE)
FF = "/opt/homebrew/bin/ffmpeg"
FW, FH = 192, 144
sys.path.insert(0, BASE)


def decode(path, n, seek=0.0, fps=12):
    """n frames at 192x144, the same field everything else in this repo uses"""
    cmd = [FF, "-v", "error", "-ss", f"{seek:.3f}", "-i", os.path.join(ROOT, path),
           "-vf", f"fps={fps},scale={FW}:{FH}:flags=area", "-frames:v", str(n),
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    raw = subprocess.run(cmd, capture_output=True).stdout
    got = len(raw) // (FW * FH * 3)
    if got < 1:
        return None
    return np.frombuffer(raw[:got * FW * FH * 3], np.uint8).reshape(got, FH, FW, 3)


def tone_range(frame, mask):
    """THE TONE IS NOT THE LUMINANCE.

       MOUSSA learned this once already: typing ink from absolute darkness gave
       back a white silhouette with a black outline, because a flat dark coat and
       the wall behind it are the same nothing to that law. Its answer was local
       contrast. HELD cannot run that law in a browser without writing a second
       copy of it that would drift from the first, so it does the smaller honest
       thing — it stretches each frame to ITS OWN range inside the body.

       A night shot is then read by its modelling rather than its exposure. This
       is not MOUSSA's law and does not claim to be; it is the same refusal to
       let absolute darkness place ink."""
    m = mask > 110
    if m.sum() < 40:
        return [0.0, 1.0]
    g = (0.299 * frame[:, :, 0] + 0.587 * frame[:, :, 1] + 0.114 * frame[:, :, 2])[m]
    lo, hi = np.percentile(g, 3), np.percentile(g, 97)
    if hi - lo < 12:                     # genuinely flat: say so rather than
        return [float(lo), float(lo + 12)]   # amplifying sensor noise into marks
    return [round(float(lo), 1), round(float(hi), 1)]


def surface(mask):
    """second moments -> one bone. returns None when there is no body to speak of."""
    ys, xs = np.nonzero(mask > 110)
    if len(ys) < 40:
        return None
    cx, cy = xs.mean(), ys.mean()
    x, y = xs - cx, ys - cy
    cov = np.array([[ (x*x).mean(), (x*y).mean() ],
                    [ (x*y).mean(), (y*y).mean() ]])
    w, v = np.linalg.eigh(cov)
    ax = v[:, 1]                                   # principal axis
    along = x * ax[0] + y * ax[1]
    across = -x * ax[1] + y * ax[0]
    a0, a1 = float(along.min()), float(along.max())
    half = float(np.percentile(np.abs(across), 92)) or 1.0

    # WHICH END IS THE HEAD.
    #
    # The first rule tried was "the end with more mass", on the reasoning that a
    # standing body is wider at the shoulders than the ankles. It named the coat.
    # These are medium shots cropped at the hip, so the torso fills the bottom of
    # the frame and outweighs the head every time — the rule is true of a whole
    # figure and false of every shot in this archive.
    #
    # The poet is never upside down in 135 shots, so IMAGE-UP decides, and the
    # mass imbalance becomes a check on that decision rather than the decision.
    # When the two disagree strongly the frame is flagged, not silently accepted.
    span = a1 - a0
    lo = float((along < a0 + span * 0.2).sum())
    hi = float((along > a1 - span * 0.2).sum())
    imbalance = abs(hi - lo) / max(1.0, lo + hi)
    # `ax` is the principal axis; whichever end has the smaller image y is up
    up_is_a0 = (ax[1] > 0)          # along grows downward -> a0 is the top
    head_end = 0 if up_is_a0 else 1
    mass_says = 1 if hi > lo else 0
    agrees = (mass_says == head_end) or imbalance < 0.06
    return dict(cx=round(float(cx), 2), cy=round(float(cy), 2),
                ax=[round(float(ax[0]), 4), round(float(ax[1]), 4)],
                a0=round(a0, 2), a1=round(a1, 2), half=round(half, 2),
                head=head_end, agrees=bool(agrees),
                imbalance=round(imbalance, 3),
                cover=round(float((mask > 110).mean()), 4))


def pack(patch, path, n=28, seek=0.5, fps=12, use_sam=True):
    fr = decode(path, n, seek, fps)
    if fr is None:
        return None, "decode failed"
    n = len(fr)
    mk = None
    if use_sam:
        try:
            import bodymask as BM
            key = hashlib.sha1(fr.tobytes()).hexdigest()
            mk = BM.masks_for(fr, key=key)
        except Exception as e:
            return None, f"segmenter: {e}"
    if mk is None:
        return None, "no mask"
    surf = [surface(m) for m in mk]
    rng = [tone_range(fr[k], mk[k]) for k in range(n)]
    live = [s for s in surf if s]
    if not live:
        return None, "no body in any frame"
    flat = sum(1 for a, b in rng if b - a <= 12.0)
    return dict(patch=patch, n=n, fps=fps, w=FW, h=FH,
                surface=surf, tone=rng, flat_frames=flat,
                cover=round(float(np.mean([s["cover"] for s in live])), 4),
                disputed=sum(1 for s in live if not s["agrees"]),
                blank=sum(1 for s in surf if s is None)), (fr, mk)
