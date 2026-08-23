#!/usr/bin/env python3
"""
    python3 pf/buildpack2.py [limit]

HELD-MOUSSA'S PACK — the whole archive, not eleven shots of it.

v1 wrote a vertical PNG strip: n photograph frames stacked above n mask frames,
192 x (n*288). Eleven shots came to 16MB, so 135 would have come to 200 and the
pack would have joined `out/elements/` in the list of things that only exist on
this machine.

The mask is one channel and the photograph is three. Put the mask in ALPHA and
the file halves before any codec runs — and then WebP, which is built for
photographs, does the rest. There is no second file to drift out of step with the
first, which was the reason for one strip in v1 and is a better reason now.

Shots with no subject still pack: a ground is not a failure, it is the other half
of a frame. Those carry alpha 255 and `body: false`, and HELD uses them as plates
instead of carriers. The segmenter is only asked about shots the atlas says have
someone in them, which is what keeps this a lunch break instead of a day.

Ordered by whether the fourteen stations actually use the shot, so an interrupted
run has finished the ones MOUSSA is made of.
"""
import json, os, sys, time, hashlib
import numpy as np, cv2

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.dirname(HERE)
sys.path[:0] = [HERE, BASE]
import moussapack as M

OUT = f"{BASE}/out/held/pack"
LIMIT = int(sys.argv[1]) if len(sys.argv) > 1 else 999
NFR, FPS, SEEK, Q = 24, 12, 0.4, 78

os.makedirs(OUT, exist_ok=True)
shots = {s["patch_id"]: s for s in json.load(open(f"{BASE}/shots.json"))}
atlas = {a["patch"]: a for a in json.load(open(f"{BASE}/atlas.json"))}
stations = json.load(open(f"{BASE}/out/moussa/moussa.json"))
used = {e["patch"] for st in stations for e in st["timeline"] if e["kind"] == "shot"}

order = sorted([p for p in atlas if p in shots],
               key=lambda p: (p not in used, not atlas[p].get("has_subject"),
                              -atlas[p].get("cover", 0)))[:LIMIT]

out, skipped, tbytes = [], [], 0
t0 = time.time()
for i, p in enumerate(order):
    a = atlas[p]
    want_body = bool(a.get("has_subject")) and bool(a.get("usable"))
    t = time.time()
    fr = M.decode(shots[p]["path"], NFR, SEEK, FPS)
    if fr is None:
        skipped.append((p, "decode failed")); continue
    n = len(fr)
    mk = None
    if want_body:
        try:
            import bodymask as BM
            mk = BM.masks_for(fr, key=hashlib.sha1(fr.tobytes()).hexdigest())
        except Exception as e:
            skipped.append((p, f"segmenter: {e}")); mk = None
    body = mk is not None and (mk > 110).mean() > 0.02
    if mk is None or not body:
        mk = np.full((n, M.FH, M.FW), 255, np.uint8)

    surf = [M.surface(m) for m in mk] if body else [None] * n
    tone = [M.tone_range(fr[k], mk[k]) for k in range(n)]

    # ONE FILE, TWO PANELS: n photograph frames, then n mask frames, RGB only.
    #
    # The mask went in the alpha channel first — half the pixels, and elegant.
    # But drawImage composites, so wherever alpha is 0 the source contributes
    # nothing and the canvas keeps transparent black: the photograph OUTSIDE the
    # body is destroyed on load. The body carrier never noticed; the plate, which
    # needs the whole frame, would have shown a poet floating in nothing.
    #
    # Two panels cost the same 43KB at q78 and the mask survives thresholding at
    # 100.00%, measured. Elegance that loses half the data is not elegance.
    sheet = np.zeros((M.FH * n * 2, M.FW, 3), np.uint8)
    for k in range(n):
        sheet[k*M.FH:(k+1)*M.FH] = cv2.cvtColor(fr[k], cv2.COLOR_RGB2BGR)
        sheet[M.FH*n + k*M.FH : M.FH*n + (k+1)*M.FH] = mk[k][:, :, None]
    q = f"{OUT}/{p}.webp"
    cv2.imwrite(q, sheet, [cv2.IMWRITE_WEBP_QUALITY, Q])
    tbytes += os.path.getsize(q)

    live = [s for s in surf if s]
    out.append(dict(patch=p, n=n, fps=FPS, w=M.FW, h=M.FH, body=bool(body),
                    surface=surf, tone=tone,
                    cover=round(float(np.mean([s["cover"] for s in live])), 4) if live else 0.0,
                    disputed=sum(1 for s in live if not s["agrees"]),
                    cls=a.get("cls"), role=a.get("role"), place=a.get("place"),
                    poem=a.get("poem"), scale=a.get("scale"), temp=a.get("temp"),
                    used=p in used, dur=shots[p].get("dur"),
                    prompt=(shots[p].get("prompt") or "")[:150]))
    print(f"  [{i+1}/{len(order)}] {p} {'BODY' if body else 'ground'} "
          f"cover={out[-1]['cover']:.2f} {os.path.getsize(q)/1024:.0f}KB {time.time()-t:.1f}s",
          flush=True)

bodies = [o for o in out if o["body"]]
json.dump(dict(shots=out, skipped=skipped,
               bodies=len(bodies), grounds=len(out) - len(bodies),
               frames=sum(o["n"] for o in out),
               axis_disputed=sum(o["disputed"] for o in bodies)),
          open(f"{OUT}/pack.json", "w"))
print(f"\n{len(out)} shots · {len(bodies)} bodies · {len(out)-len(bodies)} grounds "
      f"· {len(skipped)} skipped · {tbytes/1e6:.1f} MB · {(time.time()-t0)/60:.0f} min")
for s in skipped[:6]: print("   skip", s[0], s[1])
