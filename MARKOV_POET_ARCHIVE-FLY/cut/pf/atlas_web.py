#!/usr/bin/env python3
"""
THE WEB-SIZED ARCHIVE.

    python3 pf/atlas_web.py

`out/elements/` is 1.1GB: 2033 cut-outs, each a subject floating inside a full
768x576 transparent frame. That is why PASTE and HELD's archive shelf only ever
worked on this machine — the pile could not be deployed, so the tools could not
be opened by anyone who did not already have the archive.

Two facts make it shippable. The median cut-out's CONTENT is 163x231, so most of
every file is transparent nothing; and nothing in either tool samples a cut-out
above a few hundred pixels, because a socket is at most a few dozen cells wide.

    crop to alpha  ->  cap the long edge at 256  ->  WebP with alpha

Cropping is not only a size trick: both tools already crop at runtime, because a
skin mapped across the file instead of the subject measured 87.4% seam. Doing it
here means the shipped file IS the subject, and the runtime crop finds nothing
left to do.
"""
import json, os, sys
import numpy as np, cv2

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = f"{BASE}/out/elements"
OUT = f"{BASE}/out/thumbs"
EDGE = int(sys.argv[1]) if len(sys.argv) > 1 else 256
Q = int(sys.argv[2]) if len(sys.argv) > 2 else 78

os.makedirs(OUT, exist_ok=True)
rows = json.load(open(f"{BASE}/out/studio/elements.json"))
kept, dropped, bytes_in, bytes_out = [], [], 0, 0

for i, r in enumerate(rows):
    p = f"{SRC}/{r['id']}.png"
    if not os.path.exists(p):
        dropped.append((r["id"], "missing")); continue
    bytes_in += os.path.getsize(p)
    im = cv2.imread(p, cv2.IMREAD_UNCHANGED)
    if im is None:
        dropped.append((r["id"], "unreadable")); continue
    if im.shape[2] == 3:
        im = np.dstack([im, np.full(im.shape[:2], 255, np.uint8)])
    ys, xs = np.nonzero(im[:, :, 3] > 12)
    if len(ys) == 0:
        dropped.append((r["id"], "wholly transparent")); continue
    im = im[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    ih, iw = im.shape[:2]
    s = min(1.0, EDGE / max(ih, iw))
    if s < 1.0:
        im = cv2.resize(im, (max(1, int(iw * s)), max(1, int(ih * s))),
                        interpolation=cv2.INTER_AREA)
    q = f"{OUT}/{r['id']}.webp"
    cv2.imwrite(q, im, [cv2.IMWRITE_WEBP_QUALITY, Q])
    bytes_out += os.path.getsize(q)
    kept.append(dict(r, w=int(im.shape[1]), h=int(im.shape[0])))
    if i % 250 == 0:
        print(f"  {i}/{len(rows)}", flush=True)

json.dump(kept, open(f"{OUT}/index.json", "w"))
print(f"\n{len(kept)} kept · {len(dropped)} dropped")
for d in dropped[:8]:
    print(f"    {d[0]}  {d[1]}")
print(f"{bytes_in/1e6:.0f} MB -> {bytes_out/1e6:.1f} MB "
      f"({bytes_out/max(1,bytes_in)*100:.1f}%)")
