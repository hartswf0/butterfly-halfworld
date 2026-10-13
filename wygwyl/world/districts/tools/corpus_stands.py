#!/usr/bin/env python3
"""OUR FOOTAGE THROUGH THEIR PROCESS. Runs wygwyl-world-arch's own shots/analyze.py and shots/multiplane.py, unchanged, on canon shots
from our corpus, so a frame of our footage becomes the same kind of thing as a Midjourney view there: a camera read from the inside
(Depth Pro focal and metric depth, a RANSAC ground plane → height, pitch, roll), Grounding DINO + SAM 2.1 masks, OneFormer stuff, and
a multiplane stand of flat sheets at their measured depths. Only the inputs are adapted:
  • the picture: a still as it is; a keyframe pulled from its video at its time
  • the 'prompt' (our footage has none): its CLIP tags and its Lynch reading, so detection still looks for the picture's own words
  • the district: given (a pilot is one district's shots)
Outputs go to .work/corpus/out (never into that repo's shots/out). Private material is never read: no source 'shoot', nothing under
/CAT/ or /cdmx/. Run with wygwyl-world-arch's venv:
  /Users/gaia/Downloads/WYGWYL-WORLD-ARCH/.venv-shots/bin/python corpus_stands.py .work/corpus_haze.json haze"""
import os, sys, json, subprocess, importlib, traceback

T = os.path.dirname(os.path.abspath(__file__)); WK = os.path.join(T, '.work', 'corpus'); SRC = os.path.join(WK, 'src'); OUT = os.path.join(WK, 'out')
ARCH = '/Users/gaia/Downloads/WYGWYL-WORLD-ARCH/shots'
os.makedirs(SRC, exist_ok=True); os.makedirs(OUT, exist_ok=True)
items, district = json.load(open(sys.argv[1])), (sys.argv[2] if len(sys.argv) > 2 else None)   # per-item 'district' wins
city = json.load(open(os.path.join(T, '..', '..', 'city3d', 'city.json')))
lynch = {s['cid']: s.get('read') or {} for s in city['shots']}
icon = json.load(open(os.path.join(T, '..', '..', 'iconic', 'city.json')))
lynch.update({s['cid']: s.get('read') or {} for s in icon['shots'] if s['cid'] not in lynch})

def private(p): return '/CAT/' in p or '/cdmx/' in p.lower()
def picture(x):
    out = os.path.join(SRC, f"{x['cid']}_0.png")
    if os.path.exists(out): return out
    if x['kind'] == 'keyframe' and x['path'].lower().endswith(('.mp4', '.mov', '.webm', '.m4v')):
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-ss', str(x.get('t') or 0), '-i', x['path'], '-frames:v', '1', out], check=True)
    else:
        from PIL import Image; Image.open(x['path']).convert('RGB').save(out)
    return out

sys.path.insert(0, ARCH); os.chdir(ARCH)
A = importlib.import_module('analyze'); MP = importlib.import_module('multiplane')
A.OUT = OUT; MP.OUT = OUT
M = A.Models(); done = []
for x in items:
    if x.get('source') == 'shoot' or private(x['path']): print('skip (private)', x['cid']); continue
    if os.path.exists(os.path.join(OUT, f"{x['cid']}_0", 'multiplane', 'multiplane.json')): done.append(x['cid']); continue   # resumable
    d_x = x.get('district') or district
    try:
        p = picture(x); rd = lynch.get(x['cid'], {})
        words = list(dict.fromkeys(x.get('tags', []) + [v[0] for v in rd.values() if isinstance(v, list) and v and v[0] not in (None, '—')]))
        rec = {'job_id': x['cid'], 'prompt': ', '.join(words) + ' --ar 16:9'}
        r = A.analyze(M, p, rec, {os.path.basename(p): (d_x, None)})
        sj = os.path.join(OUT, f"{x['cid']}_0", 'shot.json'); S = json.load(open(sj)); S['file'] = p; S['corpus'] = {k: x.get(k) for k in ('cid', 'source', 'kind', 'video', 't', 'sim', 'district', 'poem')}
        json.dump(S, open(sj, 'w'), indent=1)
        MP.build(f"{x['cid']}_0", {})
        c = r['camera']; done.append(x['cid'])
        print(f"{x['cid']} {d_x or '-':9s} {x['source']:8s} {x['kind']:8s} {c.get('shot_class')!s:22s} h={c.get('height_m')} pitch={c.get('pitch_deg')} fov={c.get('fov_h_deg')} dets={len(r['detections'])} {r['timing_s']}s", flush=True)
    except Exception:
        traceback.print_exc(); print('FAILED', x['cid'], flush=True)
print('stands', len(done), 'of', len(items))
