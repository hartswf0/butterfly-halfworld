#!/usr/bin/env python3
"""
    python3 pf/reindex.py

Rebuild pack.json from the .webp files already on disk.

The mask lives in the alpha channel of the packed sheet, so every measurement the
index carries — the surface, the tone range, the cover — can be recovered from
the files themselves. The long build writes its index only at the end; this makes
a usable one out of however much of it has finished, which is the difference
between testing now and testing in an hour.
"""
import json, os, sys
import numpy as np, cv2
HERE = os.path.dirname(os.path.abspath(__file__)); BASE = os.path.dirname(HERE)
sys.path[:0] = [HERE, BASE]
import moussapack as M

OUT = f"{BASE}/out/held/pack"
atlas = {a["patch"]: a for a in json.load(open(f"{BASE}/atlas.json"))}
shots = {s["patch_id"]: s for s in json.load(open(f"{BASE}/shots.json"))}
stations = json.load(open(f"{BASE}/out/moussa/moussa.json"))
used = {e["patch"] for st in stations for e in st["timeline"] if e["kind"] == "shot"}

out, tb = [], 0
for f in sorted(os.listdir(OUT)):
    if not f.endswith(".webp"): continue
    p = f[:-5]
    im = cv2.imread(f"{OUT}/{f}", cv2.IMREAD_UNCHANGED)
    if im is None: continue
    tb += os.path.getsize(f"{OUT}/{f}")
    n = im.shape[0] // M.FH // 2          # photographs above, masks below
    a = atlas.get(p, {})
    surf, tone = [], []
    for k in range(n):
        rgb = cv2.cvtColor(im[k*M.FH:(k+1)*M.FH, :, :3], cv2.COLOR_BGR2RGB)
        mk = im[M.FH*n + k*M.FH : M.FH*n + (k+1)*M.FH, :, 0]
        tone.append(M.tone_range(rgb, mk))
        surf.append(M.surface(mk) if (mk > 110).mean() < 0.97 else None)
    live = [s for s in surf if s]
    # a sheet whose alpha is solid is a GROUND: it was packed without a body, and
    # a "surface" over the whole frame would be a bone through the wall behind him
    body = len(live) > n * 0.5
    if not body: surf = [None] * n
    out.append(dict(patch=p, n=n, fps=12, w=M.FW, h=M.FH, body=body,
                    surface=surf, tone=tone,
                    cover=round(float(np.mean([s["cover"] for s in live])), 4) if (body and live) else 0.0,
                    usable=sum(1 for s in live if s["usable"]) if body else 0,
                    disputed=sum(1 for s in live if not s["agrees"]) if body else 0,
                    cls=a.get("cls"), role=a.get("role"), place=a.get("place"),
                    poem=a.get("poem"), scale=a.get("scale"), temp=a.get("temp"),
                    used=p in used, dur=shots.get(p, {}).get("dur"),
                    prompt=(shots.get(p, {}).get("prompt") or "")[:150]))

bodies = [o for o in out if o["body"]]
json.dump(dict(shots=out, skipped=[], bodies=len(bodies), grounds=len(out)-len(bodies),
               frames=sum(o["n"] for o in out),
               axis_usable=sum(o["usable"] for o in bodies),
               bodied_frames=sum(o["n"] for o in bodies),
               axis_disputed=sum(o["disputed"] for o in bodies)),
          open(f"{OUT}/pack.json", "w"))
bf = sum(o["n"] for o in bodies); us = sum(o["usable"] for o in bodies)
print(f"{len(out)} shots · {len(bodies)} bodies · {len(out)-len(bodies)} grounds "
      f"· {tb/1e6:.1f} MB · index {os.path.getsize(f'{OUT}/pack.json')/1024:.0f} KB")
print(f"axis usable (within 25deg of vertical, >10% cover): {us}/{bf} ({100*us/max(1,bf):.0f}%)")
