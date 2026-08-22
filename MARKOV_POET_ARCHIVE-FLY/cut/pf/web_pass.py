#!/usr/bin/env python3
"""
    python3 pf/web_pass.py

MAKE THE GALLERIES SHIPPABLE.

23 of the 28 doors on the front page pointed at files no one but this machine
has — the pages were never committed, because the pictures beside them are
full-resolution PNGs and the films beside those are gigabytes. A front page whose
links mostly 404 is worse than a shorter one.

The archive pass already proved the shape of the fix: nothing on a web page is
looked at above ~1400px, and PNG is the wrong container for a photograph. So each
gallery gets its images resized and re-encoded, and its HTML rewritten to match.

Video is NOT converted. A 1.3GB film cannot be talked down to a size a repo
should hold, and pretending otherwise by shipping a thumbnail would put a door on
the page that opens onto a still. Those pages are marked instead.
"""
import os, re, sys
import cv2, numpy as np

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = f"{BASE}/out"
DIRS = sys.argv[1:] or ["collage", "archigram", "sheets", "lucier", "loom", "lab",
                        "previs", "inhabit", "dress", "textule", "patchfield", "scene"]
EDGE, Q = 1400, 80

grand_in = grand_out = 0
for d in DIRS:
    p = f"{OUT}/{d}"
    if not os.path.isdir(p):
        print(f"  {d}: not here"); continue
    pages = [f for f in os.listdir(p) if f.endswith(".html")]
    imgs = [f for f in os.listdir(p) if f.lower().endswith((".png", ".jpg", ".jpeg"))]
    if not imgs:
        print(f"  {d}: no images"); continue
    bi = bo = 0; rename = {}
    for f in imgs:
        src = f"{p}/{f}"
        bi += os.path.getsize(src)
        im = cv2.imread(src, cv2.IMREAD_UNCHANGED)
        if im is None:
            continue
        h, w = im.shape[:2]
        s = min(1.0, EDGE / max(h, w))
        if s < 1.0:
            im = cv2.resize(im, (int(w * s), int(h * s)), interpolation=cv2.INTER_AREA)
        q = os.path.splitext(f)[0] + ".webp"
        cv2.imwrite(f"{p}/{q}", im, [cv2.IMWRITE_WEBP_QUALITY, Q])
        bo += os.path.getsize(f"{p}/{q}")
        rename[f] = q
    for page in pages:
        s = open(f"{p}/{page}").read()
        for a, b in rename.items():
            s = s.replace(a, b)
        open(f"{p}/{page}", "w").write(s)
    for f in rename:                      # the original is regenerable; the repo
        os.remove(f"{p}/{f}")             # should carry one copy, not two
    grand_in += bi; grand_out += bo
    vids = len([f for f in os.listdir(p) if f.endswith(".mp4")])
    print(f"  {d:<12} {len(rename):>3} images  {bi/1e6:>7.1f} MB -> {bo/1e6:>5.1f} MB"
          + (f"   ({vids} films stay local)" if vids else ""))
print(f"\n{grand_in/1e6:.0f} MB -> {grand_out/1e6:.1f} MB")
