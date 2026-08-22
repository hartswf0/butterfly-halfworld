#!/usr/bin/env python3
"""
    python3 pf/web_films.py

The shipped films are 1600x1200 at 12fps — twice the resolution the 192x144 dot
field needs, since a cell already lands on 8 pixels there and 5 is plenty. h264
handles halftone badly, so the saving is taken in RESOLUTION rather than in
quality: scale to 1024 wide with lanczos, then crf 20.

Measured on the largest of them: 13MB -> 7MB at 42.8 dB PSNR, mean error 0.74 of
255. The dots survive; the file halves. Anything already small is left alone.
"""
import os, subprocess, sys
FF = "/opt/homebrew/bin/ffmpeg"
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIRS = ["textule", "patchfield", "previs", "inhabit", "dress",
        "loom", "lucier", "collage", "scene"]
MIN = 2_000_000
tin = tout = n = 0
for d in DIRS:
    p = f"{BASE}/out/{d}"
    if not os.path.isdir(p): continue
    for f in sorted(os.listdir(p)):
        if not f.endswith(".mp4"): continue
        src = f"{p}/{f}"; sz = os.path.getsize(src)
        if sz < MIN:
            continue
        tmp = f"{src}.web.mp4"
        r = subprocess.run([FF, "-y", "-v", "error", "-i", src,
                            "-vf", "scale='min(1024,iw)':-2:flags=lanczos",
                            "-c:v", "libx264", "-crf", "20", "-preset", "slow",
                            "-pix_fmt", "yuv420p", "-movflags", "+faststart",
                            "-c:a", "copy", tmp], capture_output=True)
        if r.returncode or not os.path.exists(tmp):
            print(f"  {d}/{f}: ffmpeg failed, left alone"); continue
        new = os.path.getsize(tmp)
        if new >= sz:                    # already tight; a bigger file is not a win
            os.remove(tmp); print(f"  {d}/{f}: no smaller, left alone"); continue
        os.replace(tmp, src)
        tin += sz; tout += new; n += 1
        print(f"  {d}/{f:<34} {sz/1e6:>5.1f} -> {new/1e6:>5.1f} MB", flush=True)
print(f"\n{n} films · {tin/1e6:.0f} MB -> {tout/1e6:.0f} MB")
