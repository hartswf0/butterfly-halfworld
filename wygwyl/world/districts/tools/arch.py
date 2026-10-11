#!/usr/bin/env python3
"""THE MEASURED SHOT, from wygwyl-world-arch (github.com/hartswf0/wygwyl-world-arch, shots/analyze.py + multiplane.py).
That repo read each Midjourney picture from the inside: Depth Pro (metric depth and its own focal length), OneFormer ADE20K,
Grounding DINO on the prompt's phrases → SAM 2.1, a RANSAC ground plane → camera height, pitch and roll; then cut each picture into
6–8 flat sheets standing at their measured depths (a multiplane stand), so the frame recomposes exactly from its own camera.
Here: the measured camera becomes the pose finder's constraint (it beats the prompt: Midjourney honoured the prompted lens in only
18 of 47 shots), and the stands are brought in to stand in the city at the found cameras.
Writes .work/lang/arch.json (all matched views) and ../../stands/stands.json + ../../stands/s/NNN/* (the sheets, for --views or
--district); --poses <poses.json> adds each stand's found camera."""
import os, sys, json, glob, shutil

T = os.path.dirname(os.path.abspath(__file__)); WK = os.path.join(T, '.work', 'lang'); A = '/Users/gaia/Downloads/WYGWYL-WORLD-ARCH/shots'
OUT = os.path.join(T, '..', '..', 'stands'); os.makedirs(os.path.join(OUT, 's'), exist_ok=True)
arg = lambda k: sys.argv[sys.argv.index('--' + k) + 1] if '--' + k in sys.argv else None
V = json.load(open(os.path.join(T, 'views.json'))); S = json.load(open(os.path.join(T, '..', 'scenes.json'))); vd = {v['n']: v['d'] for v in S['views']}
shot = {os.path.basename(os.path.dirname(f)): json.load(open(f)) for f in glob.glob(f'{A}/out/*/shot.json')}
W = open(f'{A}/world_data.js').read(); stand = {s['id']: s for s in json.loads(W[W.index('=') + 1:].rstrip().rstrip(';'))['shots']}
pick = set(map(int, arg('views').split(','))) if arg('views') else ({n for n, d in vd.items() if d == arg('district')} if arg('district') else None)

cams, stands = {}, []
for n, f in enumerate(V, 1):
    sid = f.rsplit('_', 2)[1] + '_' + f.rsplit('_', 1)[1].split('.')[0]
    if sid not in shot: continue
    c = shot[sid]['camera']; roll = c.get('roll_deg') or 0.0
    cams[n] = {'id': sid, 'fov': c.get('fov_h_deg'), 'h': c.get('height_m'), 'pitch': c.get('pitch_deg'), 'roll': roll if abs(roll) < 45 else 0.0,
               'conf': c.get('physics_confidence'), 'class': c.get('shot_class'), 'prompt_lens_agrees': c.get('focal_agrees'),
               'objects': [d['label'] for d in shot[sid].get('detections', [])[:12]]}
    if pick is None or n not in pick or sid not in stand: continue
    st = stand[sid]; d = os.path.join(OUT, 's', f'{n:03d}'); os.makedirs(d, exist_ok=True); sheets = []
    for k, sh in enumerate(st['sheets']):
        name = f'{k:02d}-{sh["plane"]}.webp'; shutil.copy(os.path.join(A, sh['lo']), os.path.join(d, name))
        sheets.append({'src': f's/{n:03d}/{name}', 'zm': sh['zm'], 'plane': sh['plane'], 'label': sh['label'], 'water': sh['water'], 'sway': sh['sway']})
    shutil.copy(os.path.join(A, st['backdrop']), os.path.join(d, 'backdrop.webp'))
    stands.append({'n': n, 'district': vd[n], 'title': st['title'], 'fov': st['fov'], 'aspect': st['aspect'], 'pitch': st['pitch'],
                   'roll': cams[n]['roll'], 'height': st['height'], 'class': st['shot_class'], 'move': st['move'], 'z_hero': st['z_hero'],
                   'sheets': sheets, 'backdrop': f's/{n:03d}/backdrop.webp'})
json.dump(cams, open(os.path.join(WK, 'arch.json'), 'w'), indent=1)
if pick is not None:
    P = os.path.join(OUT, 'stands.json'); old = json.load(open(P))['stands'] if os.path.exists(P) else []
    keep = {s['n']: s for s in old}; keep.update({s['n']: s for s in stands})
    if arg('poses'):                                                  # the found cameras (posefind-run.mjs) the stands will stand at
        R = json.load(open(arg('poses')))['views']
        for n, st in keep.items():
            r = R.get(str(n))
            if r and r.get('placeable'): st['pose'] = {**r['best']['pose'], 'h': r['best']['h'], 'score': r['best']['s'], 'rank': r['check']['rank'], 'clip': (r.get('words') or {}).get('clip'), 'found': (r.get('words') or {}).get('found'), 'ref': (r.get('words') or {}).get('ref')}
    json.dump({'from': 'github.com/hartswf0/wygwyl-world-arch shots/out (Depth Pro, SAM 2.1, OneFormer; multiplane.py)', 'stands': sorted(keep.values(), key=lambda s: s['n'])}, open(P, 'w'), indent=1)
print('measured cameras', len(cams), '· stands written', len(stands))
