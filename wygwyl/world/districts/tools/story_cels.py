#!/usr/bin/env python3
"""THE CELS: every patch of the carved film (story_carve.py) drawn as a moving cartoon cel, in wygwyl-world-arch's angular style.
Each patch's exact window of footage is trimmed and passed to their own shots/cartoon_video.py (run in the local mirror): keyframes
about every second and at every cut go through the whole stack (Grounding DINO + SAM 2.1 + OneFormer + Depth Pro → multiplane →
the scene program's angular filled-region drawing), and the frames between are the neighbouring cels carried along the footage's
own optical flow, on twos (12 fps). The scene's words go to the detector as hints. A still patch is drawn from a 2 s hold.
Resumable: a patch is redrawn only if the carve gave it another window. After each poem, its cel film is rendered with her reading
(story_preview.py --cels). Outputs stay in the mirror (WYGWYL-CORPUS-ARCH/shots/video/<patch>/cartoon.mp4); nothing is published.
  python3 story_cels.py [01 02 …]"""
import os, sys, json, subprocess, shutil, time

T = os.path.dirname(os.path.abspath(__file__)); D = os.path.join(T, '.work', 'story')
C = '/Users/gaia/Downloads/WYGWYL-CORPUS-ARCH'; PY = '/Users/gaia/Downloads/WYGWYL-WORLD-ARCH/.venv-shots/bin/python'
PD = os.path.join(C, 'shots', 'patches'); VD = os.path.join(C, 'shots', 'video'); os.makedirs(PD, exist_ok=True)
F = json.load(open(os.path.join(D, 'film.json'))); poems = sys.argv[1:] or sorted(F)
env = dict(os.environ, PYTORCH_ENABLE_MPS_FALLBACK='1')

for p in poems:
    t0 = time.time(); done = 0
    for s in F[p]['shots']:
        pid = s.get('id')
        if not pid or not s.get('k'): continue                                  # a patch to make has nothing to draw yet
        d = s['t1'] - s['t0']; c = s.get('clip')
        sig = f"{c['path']}|{c['in']:.2f}|{c['len']:.2f}" if c else f"{s['path']}|still"
        work = os.path.join(VD, pid); sigf = os.path.join(work, 'patch.sig')
        if os.path.exists(os.path.join(work, 'cartoon.mp4')) and os.path.exists(sigf) and open(sigf).read() == sig: done += 1; continue
        shutil.rmtree(work, ignore_errors=True)
        src = os.path.join(PD, f'{pid}.mp4')
        if c: cmd = ['ffmpeg', '-loglevel', 'error', '-y', '-ss', f"{c['in']:.2f}", '-i', c['path'], '-t', f"{min(d, c['len']):.2f}", '-an', '-c:v', 'libx264', '-crf', '16', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', src]
        else: cmd = ['ffmpeg', '-loglevel', 'error', '-y', '-loop', '1', '-i', s['path'], '-t', '2', '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-crf', '16', '-pix_fmt', 'yuv420p', src]
        if subprocess.run(cmd).returncode: print(pid, 'trim failed', flush=True); continue
        hints = f"{s['what']} {s.get('here', '')}"[:220]
        r = subprocess.run([PY, 'shots/cartoon_video.py', f'shots/patches/{pid}.mp4', '--every', '1.0', '--fps', '12', '--width', '1024', '--no-compare', '--prompt', hints],
                           cwd=C, env=env, capture_output=True, text=True)
        if r.returncode or not os.path.exists(os.path.join(work, 'cartoon.mp4')): print(pid, 'cel failed', r.stdout[-300:], r.stderr[-300:], flush=True); continue
        open(sigf, 'w').write(sig); done += 1
        print(p, pid, f'{d:.1f}s', s['name'][:40], f'{time.time() - t0:.0f}s', flush=True)
    print(p, F[p]['title'], done, 'cels', flush=True)
    subprocess.run([sys.executable, os.path.join(T, 'story_preview.py'), p, '--cels'])
