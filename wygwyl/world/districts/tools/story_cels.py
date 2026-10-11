#!/usr/bin/env python3
"""THE CELS: every patch of the carved film (story_carve.py) drawn as a moving cartoon cel, in wygwyl-world-arch's angular style.
Each patch's exact window of footage is trimmed and passed to their own shots/cartoon_video.py (run in the local mirror): keyframes
about every second and at every cut go through the whole stack (Grounding DINO + SAM 2.1 + OneFormer + Depth Pro → multiplane →
the scene program's angular filled-region drawing), and the frames between are the neighbouring cels carried along the footage's
own optical flow, on twos (12 fps). The scene's words go to the detector as hints. A still patch is drawn from a 2 s hold.
Poem by poem: when a poem's patches are drawn its cel film is rendered with her reading (story_preview.py --cels), copied into the
repository (wygwyl/world/film/NN.mp4 + poster) and pushed, so each poem can be watched as it lands. Progress for the monitor
(WYGWYL-CORPUS-ARCH/monitor.html) is written to WYGWYL-CORPUS-ARCH/progress.json after every patch.
Resumable: a patch is redrawn only if the carve gave it another window.
  python3 story_cels.py [01 02 …] [--push]      --push: commit and push each finished poem (off by default)"""
import os, sys, json, subprocess, shutil, time, html

T = os.path.dirname(os.path.abspath(__file__)); D = os.path.join(T, '.work', 'story'); REPO = os.path.abspath(os.path.join(T, '..', '..', '..', '..'))
C = '/Users/gaia/Downloads/WYGWYL-CORPUS-ARCH'; PY = '/Users/gaia/Downloads/WYGWYL-WORLD-ARCH/.venv-shots/bin/python'
PD = os.path.join(C, 'shots', 'patches'); VD = os.path.join(C, 'shots', 'video'); TH = os.path.join(C, 'monitor', 'thumbs'); os.makedirs(PD, exist_ok=True); os.makedirs(TH, exist_ok=True)
PUB = os.path.join(REPO, 'wygwyl', 'world', 'film'); os.makedirs(PUB, exist_ok=True)
F = json.load(open(os.path.join(D, 'film.json'))); args = [a for a in sys.argv[1:] if not a.startswith('--')]; poems = args or sorted(F); PUSH = '--push' in sys.argv          # pushing to the public repository only when asked for explicitly
env = dict(os.environ, PYTORCH_ENABLE_MPS_FALLBACK='1')
BRANCH = subprocess.run(['git', 'rev-parse', '--abbrev-ref', 'HEAD'], cwd=REPO, capture_output=True, text=True).stdout.strip()

# ---------- progress, for the monitor ----------
PG = {'started': time.time(), 'branch': BRANCH, 'poems': {}}
for p in sorted(F):
    PG['poems'][p] = {'title': F[p]['title'], 'state': 'queued', 'film': None, 'pushed': None,
                      'patches': [{'id': s.get('id'), 'name': s['name'], 'len': round(s['t1'] - s['t0'], 1), 'state': 'to make' if not s.get('k') else 'queued',
                                   'secs': None, 'thumb': None} for s in F[p]['shots'] if s.get('id')]}
def save():
    done = [x for P in PG['poems'].values() for x in P['patches'] if x['state'] == 'drawn' and x['secs']]
    left = sum(1 for P in PG['poems'].values() for x in P['patches'] if x['state'] in ('queued', 'drawing'))
    PG['rate'] = sum(x['secs'] for x in done) / max(1, sum(x['len'] for x in done)) if done else None      # seconds of work per second of film
    PG['eta'] = PG['rate'] * sum(x['len'] for P in PG['poems'].values() for x in P['patches'] if x['state'] in ('queued', 'drawing')) if PG['rate'] else None
    PG['left'] = left; PG['updated'] = time.time()
    json.dump(PG, open(os.path.join(C, 'progress.json.tmp'), 'w')); os.replace(os.path.join(C, 'progress.json.tmp'), os.path.join(C, 'progress.json'))
def patch_state(p, pid, **kw):
    for x in PG['poems'][p]['patches']:
        if x['id'] == pid: x.update(kw)
    save()
mon = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'story_monitor.html')
if os.path.exists(mon): shutil.copy(mon, os.path.join(C, 'monitor.html'))
save()

def publish(p):
    """the poem's cel film into the repository, a page listing every published poem, one commit, pushed"""
    src = os.path.join(C, 'film', f'{p}_cel.mp4')
    if not os.path.exists(src): return None
    dst = os.path.join(PUB, f'{p}.mp4')
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', src, '-c:v', 'libx264', '-crf', '24', '-preset', 'slow', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', dst], check=True)
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-ss', '3', '-i', src, '-frames:v', '1', '-vf', 'scale=640:-1', os.path.join(PUB, f'{p}.jpg')], check=True)
    have = sorted(x[:2] for x in os.listdir(PUB) if x.endswith('.mp4'))
    rows = ''.join(f"<section><h2>{q} · {html.escape(F[q]['title'])}</h2><video controls preload='none' poster='{q}.jpg' src='{q}.mp4'></video></section>" for q in have)
    open(os.path.join(PUB, 'index.html'), 'w').write(f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Where You Go When You Leave</title><meta name="description" content="WYGWYL · the film as cartoon cels, poem by poem: each patch of footage redrawn in the angular multiplane style and carried by its own motion, under her reading.">
<style>:root{{color-scheme:dark;--bg:#0a0d18;--ink:#eef0f7;--mute:#8b93ad}}body{{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,sans-serif}}main{{max-width:1100px;margin:0 auto;padding:24px 16px 60px}}
h1{{font:500 12px ui-monospace,Menlo,monospace;letter-spacing:.2em;text-transform:uppercase;color:var(--mute)}}h2{{font-weight:400;margin:28px 0 8px}}video{{width:100%;border-radius:8px;background:#000}}p{{color:var(--mute)}}</style></head>
<body><main><h1>Where you go when you leave · the film in cels · {len(have)} of 14 poems</h1><p>Each poem carved into 6–12 s patches on her reading's clock; every patch's footage redrawn as angular cels (wygwyl-world-arch's scene program) and carried by its own motion, on twos. Poems appear as they are drawn.</p>{rows}</main></body></html>""")
    if not PUSH: return None
    rel = [os.path.relpath(x, REPO) for x in (dst, os.path.join(PUB, f'{p}.jpg'), os.path.join(PUB, 'index.html'))]
    subprocess.run(['git', 'add', '--', *rel], cwd=REPO, check=True)
    msg = f"WYGWYL film in cels: {p} {F[p]['title']}\n\nEach patch of the poem's carved cut redrawn as moving angular cels, under her reading.\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
    if subprocess.run(['git', 'commit', '-q', '-m', msg, '--', *rel], cwd=REPO).returncode: return None
    r = subprocess.run(['git', 'push', '-q', 'origin', BRANCH], cwd=REPO, capture_output=True, text=True)
    return f"https://github.com/hartswf0/butterfly-halfworld/blob/{BRANCH}/wygwyl/world/film/{p}.mp4" if r.returncode == 0 else 'push failed: ' + r.stderr[-200:]

for p in poems:
    t0 = time.time(); done = 0; PG['poems'][p]['state'] = 'drawing'; save()
    for s in F[p]['shots']:
        pid = s.get('id')
        if not pid or not s.get('k'): continue                                  # a patch to make has nothing to draw yet
        d = s['t1'] - s['t0']; c = s.get('clip')
        sig = f"{c['path']}|{c['in']:.2f}|{c['len']:.2f}" if c else f"{s['path']}|still"
        work = os.path.join(VD, pid); sigf = os.path.join(work, 'patch.sig'); thumb = os.path.join(TH, f'{pid}.jpg')
        if os.path.exists(os.path.join(work, 'cartoon.mp4')) and os.path.exists(sigf) and open(sigf).read() == sig:
            done += 1; patch_state(p, pid, state='drawn', thumb=f'monitor/thumbs/{pid}.jpg' if os.path.exists(thumb) else None); continue
        patch_state(p, pid, state='drawing', started=time.time())
        shutil.rmtree(work, ignore_errors=True); ts = time.time()
        src = os.path.join(PD, f'{pid}.mp4')
        if c: cmd = ['ffmpeg', '-loglevel', 'error', '-y', '-ss', f"{c['in']:.2f}", '-i', c['path'], '-t', f"{min(d, c['len']):.2f}", '-an', '-c:v', 'libx264', '-crf', '16', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', src]
        else: cmd = ['ffmpeg', '-loglevel', 'error', '-y', '-loop', '1', '-i', s['path'], '-t', '2', '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-crf', '16', '-pix_fmt', 'yuv420p', src]
        if subprocess.run(cmd).returncode: print(pid, 'trim failed', flush=True); patch_state(p, pid, state='failed'); continue
        hints = f"{s['what']} {s.get('here', '')}"[:220]
        r = subprocess.run([PY, 'shots/cartoon_video.py', f'shots/patches/{pid}.mp4', '--every', '1.0', '--fps', '12', '--width', '1024', '--no-compare', '--prompt', hints],
                           cwd=C, env=env, capture_output=True, text=True)
        if r.returncode or not os.path.exists(os.path.join(work, 'cartoon.mp4')):
            print(pid, 'cel failed', r.stdout[-300:], r.stderr[-300:], flush=True); patch_state(p, pid, state='failed'); continue
        open(sigf, 'w').write(sig); done += 1
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-ss', f'{min(d, 4) / 2:.2f}', '-i', os.path.join(work, 'cartoon.mp4'), '-frames:v', '1', '-vf', 'scale=320:-1', thumb])
        patch_state(p, pid, state='drawn', secs=round(time.time() - ts, 1), thumb=f'monitor/thumbs/{pid}.jpg')
        print(p, pid, f'{d:.1f}s', s['name'][:40], f'{time.time() - t0:.0f}s', flush=True)
    print(p, F[p]['title'], done, 'cels', flush=True)
    PG['poems'][p]['state'] = 'rendering'; save()
    subprocess.run([sys.executable, os.path.join(T, 'story_preview.py'), p, '--cels'])
    PG['poems'][p]['film'] = f'film/{p}_cel.mp4' if os.path.exists(os.path.join(C, 'film', f'{p}_cel.mp4')) else None
    PG['poems'][p]['pushed'] = publish(p); PG['poems'][p]['state'] = 'done'; save()
    print(p, 'published', PG['poems'][p]['pushed'], flush=True)
