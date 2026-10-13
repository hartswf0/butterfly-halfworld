#!/usr/bin/env python3
"""A CEL CUT ON SPINE-CUT'S REVIEWED PICKS. Spine-Cut (Cineosis Lab) aligned 506 spine sections to her words and an editor reviewed
every row (137 machine picks switched): the best human judgement of which archive shot plays under which line. Each section becomes a
patch of the cel cut:
  the clip    the reviewed pick ('clean'), at Spine-Cut's own in-point (read_t − 0.6 s) for the section's length; only where the pick
              cannot be drawn (cel-ability < 40: dead frames, a title card) the best cel-able candidate of that section that is local
              and not used elsewhere
  the cel     the second way (story_cels2): a keyframe every 3 s and at every cut, each read by wygwyl-world-arch's stack (Grounding
              DINO on the line + SAM 2.1, OneFormer, Depth Pro, multiplane) and drawn by the warm-started scene program (story_warm),
              EbSynth for the frames between
  the cut     every section at its place on the suite clock, on the suite's audio → WYGWYL-CORPUS-ARCH/film/spinecut_cels.mp4
Resumable (a section is redone only if its clip or window changed); progress for the monitor in WYGWYL-CORPUS-ARCH/progress_spine.json.
Run with wygwyl-world-arch's venv:  …/.venv-shots/bin/python story_spinecels.py [--only 0-50] [--assemble]"""
import os, re, sys, json, glob, time, shutil, subprocess, numpy as np, cv2
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import story_warm as W
from story_cels2 import between
from story_interp_bench import measure

LAB = '/Users/gaia/resurrecting atlantis/CINEOSIS_44/lab'; C = '/Users/gaia/Downloads/WYGWYL-CORPUS-ARCH'; VD = f'{C}/shots/video'; FPS = 12; EVERY = 36
D = json.load(open(f'{LAB}/spinecut/spinecut-data.json')); CORP = json.load(open(f'{LAB}/cache/corpus.json'))
CA = json.load(open('/Users/gaia/cineosis-lab-cels/lab/cels/cels.json'))['celability']
S = D['sections']; FILMS = D['films']
arg = lambda k, d=None: sys.argv[sys.argv.index('--' + k) + 1] if '--' + k in sys.argv else d
rng = arg('only'); lo, hi = (map(int, rng.split('-')) if rng else (0, len(S) - 1))

# ---------- which clip plays each section ----------
used, plan = set(), []
for i, s in enumerate(S):
    pick, why = s.get('clean'), 'the reviewed pick'
    sc = (CA.get(pick) or {}).get('score')
    if sc is not None and sc < 40:
        alt = next((c for c in s.get('cand', []) if c not in used and c != pick and os.path.exists(f'{LAB}/clips/{c}.mp4') and (CA.get(c) or {}).get('score', 0) >= 60), None)
        if alt: pick, why = alt, f'the reviewed pick could not be drawn (cel-ability {sc}): its best cel-able candidate'
    used.add(pick); x = D['shots'].get(pick) or {}
    film = next((f['n'] for f in FILMS if s['t0'] < f['t1']), FILMS[-1]['n'])                 # the poem whose chapter holds this section
    plan.append({'i': i, 'pid': f'S{i:03d}', 't0': s['t0'], 't1': s['t1'], 'film': film, 'line': s.get('line') or '', 'clip': pick, 'why': why,
                 'path': f'{LAB}/clips/{pick}.mp4', 'in': max(0.0, (x.get('read_t') or 0) - 0.6), 'len': max(1.0, s['t1'] - s['t0']),
                 'title': x.get('title'), 'year': x.get('year'), 'board': bool(s.get('board'))})
json.dump(plan, open(f'{C}/spinecut_cels_plan.json', 'w'), indent=1)

# ---------- progress for the monitor ----------
PGF = f'{C}/progress_spine.json'
PG = {'started': time.time(), 'branch': 'spine-cut cel cut', 'poems': {}}
for p in plan:
    f = str(p['film']).zfill(2) if p['film'] is not None else '00'
    PG['poems'].setdefault(f, {'title': next((x['title'].title() for x in FILMS if x['n'] == f), f),
                               'state': 'queued', 'film': None, 'pushed': None, 'patches': []})['patches'].append({'id': p['pid'], 'name': p['line'][:60] or '(storyboard beat)', 'len': round(p['len'], 1), 'state': 'queued', 'secs': None, 'thumb': None})
def save():
    done = [x for P in PG['poems'].values() for x in P['patches'] if x['state'] == 'drawn' and x['secs']]
    PG['rate'] = sum(x['secs'] for x in done) / max(1, sum(x['len'] for x in done)) if done else None
    PG['eta'] = PG['rate'] * sum(x['len'] for P in PG['poems'].values() for x in P['patches'] if x['state'] in ('queued', 'drawing')) if PG['rate'] else None
    PG['updated'] = time.time(); json.dump(PG, open(PGF + '.tmp', 'w')); os.replace(PGF + '.tmp', PGF)
def mark(pid, **kw):
    for P in PG['poems'].values():
        for x in P['patches']:
            if x['id'] == pid: x.update(kw)
    save()

# ---------- one section ----------
M = None
def section(p):
    global M
    import analyze as A, multiplane as MP
    work = os.path.join(VD, p['pid']); sig = f"{p['clip']}|{p['in']:.2f}|{p['len']:.2f}|v2"; sigf = os.path.join(work, 'patch.sig')
    if os.path.exists(os.path.join(work, 'cartoon_v2.mp4')) and os.path.exists(sigf) and open(sigf).read() == sig: return 'kept'
    shutil.rmtree(work, ignore_errors=True); fr = os.path.join(work, 'frames'); kd = os.path.join(work, 'keyframes'); os.makedirs(fr); os.makedirs(kd)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f"{p['in']:.2f}", '-i', p['path'], '-t', f"{p['len']:.2f}", '-vf', f'fps={FPS},scale=1024:-2', os.path.join(fr, '%05d.png')], check=True)
    files = sorted(glob.glob(os.path.join(fr, '*.png')))
    if not files: return 'no frames'
    F = [cv2.imread(f) for f in files]; G = [cv2.cvtColor(x, cv2.COLOR_BGR2GRAY) for x in F]; h, w = G[0].shape
    hist = lambda im: cv2.normalize(cv2.calcHist([cv2.cvtColor(im, cv2.COLOR_BGR2HSV)], [0, 1], None, [16, 8], [0, 180, 0, 256]), None).flatten()
    seg = [0] * len(F); sgi = 0
    for i in range(1, len(F)):
        jump = float(np.abs(cv2.resize(G[i], (64, 36)).astype(np.float32) - cv2.resize(G[i - 1], (64, 36)).astype(np.float32)).mean())
        if cv2.compareHist(hist(F[i - 1]), hist(F[i]), cv2.HISTCMP_CORREL) < 0.75 or jump > 38: sgi += 1
        seg[i] = sgi
    keys = []
    for i in range(len(F)):
        if not keys or seg[i] != seg[keys[-1]] or i - keys[-1] >= EVERY: keys.append(i)
    out = os.path.join(work, 'out'); os.makedirs(out); A.OUT = MP.OUT = out; W.SP.OUT = out
    if M is None: M = A.Models()
    cel, prev, scores = {}, None, []
    for n, k in enumerate(keys):
        name = f'kf{k:05d}_0.png'; path = os.path.join(kd, name); shutil.copy(files[k], path)
        job = f"vid-{p['pid'].lower()}-kf{k:05d}"; sid = f'{job}_0'
        rec = A.analyze(M, path, dict(job_id=job, prompt=(p['line'] + ' ' + (S[p['i']].get('prompt') or ''))[:300], files=[name]), {})
        sj = os.path.join(out, sid, 'shot.json'); rec['file'] = os.path.relpath(path, C); json.dump(rec, open(sj, 'w'), indent=1, default=float)
        MP.build(sid, {})
        if n and seg[k] != seg[keys[n - 1]]: prev = None
        prev, sc, _ = W.draw(sid, os.path.join(work, 'v2'), prev=prev); scores.append(sc)
        cel[k] = cv2.resize(cv2.imread(os.path.join(work, 'v2', sid, 'program', 'frame0.png')), (w, h), interpolation=cv2.INTER_AREA)
    seq = between(work, F, G, seg, keys, cel)
    od = os.path.join(work, 'cel_v2'); os.makedirs(od, exist_ok=True)
    for i, x in enumerate(seq): cv2.imwrite(os.path.join(od, f'{i + 1:05d}.png'), x)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', str(FPS), '-i', os.path.join(od, '%05d.png'), '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', os.path.join(work, 'cartoon_v2.mp4')], check=True)
    json.dump({'keys': len(keys), 'cuts': seg[-1], 'dE': round(float(np.mean([x['dE'] for x in scores])), 2), **measure(seq, G, seg, {k: {'cel': cel[k]} for k in keys})}, open(os.path.join(work, 'v2.json'), 'w'))
    open(sigf, 'w').write(sig); return 'drawn'

def assemble():
    """the cut: every section's cel at its place on the suite clock, held or trimmed to its exact length, on the suite's audio"""
    tmp = f'{C}/film/_spine'; os.makedirs(tmp, exist_ok=True); parts = []; t = 0.0
    for p in plan:
        cel = os.path.join(VD, p['pid'], 'cartoon_v2.mp4'); dur = p['t1'] - p['t0']; o = f"{tmp}/{p['pid']}.mp4"
        if p['t0'] > t + 0.01: dur += p['t0'] - t                                   # a gap before the first section: held
        src = ['-i', cel] if os.path.exists(cel) else ['-f', 'lavfi', '-i', f'color=c=0x0b0d14:s=1280x720:r=24:d={dur:.3f}']
        subprocess.run(['ffmpeg', '-v', 'error', '-y', *src, '-an', '-vf', f'scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,fps=24,tpad=stop_mode=clone:stop_duration={dur:.3f},trim=duration={dur:.3f},format=yuv420p',
                        '-c:v', 'libx264', '-crf', '20', '-preset', 'veryfast', o], check=True); parts.append(o); t = p['t1']
    open(f'{tmp}/list.txt', 'w').write(''.join(f"file '{x}'\n" for x in parts))
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', f'{tmp}/list.txt', '-i', f'{LAB}/wygwyl/WYGWYL_Suite_Audio.mp3', '-map', '0:v', '-map', '1:a',
                    '-c:v', 'libx264', '-crf', '23', '-preset', 'veryfast', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', f'{C}/film/spinecut_cels.mp4'], check=True)
    shutil.rmtree(tmp); print('assembled', f'{C}/film/spinecut_cels.mp4', flush=True)

if __name__ == '__main__':
    if '--assemble' not in sys.argv or rng:
        save()
        for p in plan[lo:hi + 1]:
            t0 = time.time(); mark(p['pid'], state='drawing')
            try: r = section(p)
            except Exception as e: r = f'failed: {e}'
            cel = os.path.join(VD, p['pid'], 'cartoon_v2.mp4'); th = f"{C}/monitor/thumbs/{p['pid']}.jpg"
            if os.path.exists(cel) and not os.path.exists(th): subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', '0.5', '-i', cel, '-frames:v', '1', '-vf', 'scale=320:-1', th])
            mark(p['pid'], state='drawn' if r in ('drawn', 'kept') else 'failed', secs=round(time.time() - t0, 1) if r == 'drawn' else None, thumb=f"monitor/thumbs/{p['pid']}.jpg" if os.path.exists(th) else None)
            print(p['pid'], r, f"{time.time() - t0:.0f}s", p['line'][:50], flush=True)
    if '--assemble' in sys.argv: assemble()
