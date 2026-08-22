#!/usr/bin/env python3
"""
    python3 pf/buildpack.py [n_shots] [n_frames]

Writes out/held/pack/<patch>.png  — a vertical strip, photograph over mask
       out/held/pack/pack.json    — the surfaces, and what is not known about them
"""
import json, os, sys, time
import numpy as np, cv2
sys.path[:0] = [os.path.dirname(os.path.abspath(__file__)),
                os.path.dirname(os.path.dirname(os.path.abspath(__file__)))]
import moussapack as M

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = f"{BASE}/out/held/pack"
NSHOT = int(sys.argv[1]) if len(sys.argv) > 1 else 12
NFR = int(sys.argv[2]) if len(sys.argv) > 2 else 24

os.makedirs(OUT, exist_ok=True)
shots = {s["patch_id"]: s for s in json.load(open(f"{BASE}/shots.json"))}
atlas = {a["patch"]: a for a in json.load(open(f"{BASE}/atlas.json"))}
# the poet, in shots where the segmenter has something to find. ordered by
# cover so the fullest bodies come first — a 2% mask is a real answer and a
# useless carrier.
poets = sorted([p for p, a in atlas.items()
                if a.get("role") == "POET" and a.get("has_subject") and a.get("usable")
                and p in shots],
               key=lambda p: -atlas[p].get("cover", 0))[:NSHOT]

out, skipped = [], []
for i, p in enumerate(poets):
    t = time.time()
    meta, res = M.pack(p, shots[p]["path"], n=NFR, seek=0.4, fps=12)
    if meta is None:
        skipped.append((p, res)); print(f"  {p} SKIP {res}", flush=True); continue
    fr, mk = res
    n = meta["n"]
    strip = np.zeros((M.FH * n, M.FW, 3), np.uint8)
    for k in range(n):
        strip[k * M.FH:(k + 1) * M.FH] = cv2.cvtColor(fr[k], cv2.COLOR_RGB2BGR)
    mstrip = np.zeros((M.FH * n, M.FW), np.uint8)
    for k in range(n):
        mstrip[k * M.FH:(k + 1) * M.FH] = mk[k]
    # photograph above, mask below: one request, one decode, and the browser
    # never has to correlate two files that could drift apart
    both = np.zeros((M.FH * n * 2, M.FW, 3), np.uint8)
    both[:M.FH * n] = strip
    both[M.FH * n:] = mstrip[:, :, None]
    cv2.imwrite(f"{OUT}/{p}.png", both)
    a = atlas[p]
    meta.update(cls=a.get("cls"), place=a.get("place"), poem=a.get("poem"),
                scale=a.get("scale"), line=shots[p].get("prompt", "")[:120])
    out.append(meta)
    print(f"  {p} {n}f cover={meta['cover']:.3f} "
          f"disputed={meta['disputed']} flat={meta['flat_frames']} "
          f"{time.time()-t:.1f}s", flush=True)

disagree = sum(1 for m in out for s in m["surface"] if s and not s.get("agrees"))
tot = sum(1 for m in out for s in m["surface"] if s)
json.dump(dict(shots=out, skipped=skipped,
               frames=tot, axis_disputed=disagree), open(f"{OUT}/pack.json", "w"), indent=1)
print(f"\n{len(out)} shots · {tot} bodied frames · "
      f"{disagree} where mass disputes image-up ({100*disagree/max(1,tot):.0f}%) "
      f"· {len(skipped)} skipped")
