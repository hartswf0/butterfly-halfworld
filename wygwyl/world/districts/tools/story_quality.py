#!/usr/bin/env python3
"""HOW EVERY PATCH DREW: the whole film measured the same way, so found film and our own footage can be compared.
Per drawn patch: family (archive = found film through Cineosis Lab; markov / generated / film / other / halfworld / mj = ours),
the source's own resolution, black-and-white, how much the footage moves; how well its keyframes drew (the scene program's own
render-and-compare score: colour ΔE, value SSIM, edge F, shapes); how the cel plays (pops/s, ghosting, tracking — the bench's
measures, on the film's in-betweens); and what it cost (seconds of drawing per second of film, from the cel job's log).
Writes .work/story/quality.json and prints a summary by family.  python3 story_quality.py"""
import os, re, json, glob, subprocess, collections, numpy as np, cv2
import story_inbetween as IB
from story_interp_bench import load, measure

T = os.path.dirname(os.path.abspath(__file__)); D = os.path.join(T, '.work', 'story'); VD = '/Users/gaia/Downloads/WYGWYL-CORPUS-ARCH/shots/video'
F = json.load(open(os.path.join(D, 'film.json')))
secs = {}                                                  # per-patch drawing time, from the cel job's logs (cumulative per poem → differences)
for log in ('cels.log', 'cels_repair.log'):
    prev = {}
    for l in open(os.path.join(D, log)) if os.path.exists(os.path.join(D, log)) else []:
        m = re.match(r'^(\d\d) (P\d\d-\d{3}) [\d.]+s .* (\d+)s$', l.strip())
        if m: p, pid, cum = m.group(1), m.group(2), int(m.group(3)); secs[pid] = cum - prev.get(p, 0); prev[p] = cum
OWN = {'markov', 'halfworld', 'generated', 'film', 'other', 'mj'}
def size(path):
    r = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', path], capture_output=True, text=True).stdout.strip()
    try: w, h = map(int, r.split(',')[:2]); return w, h
    except Exception: return None, None
rows = []
for p, f in sorted(F.items()):
    for s in f['shots']:
        pid = s.get('id')
        if not pid or not os.path.exists(os.path.join(VD, pid, 'cartoon.mp4')): continue
        work, Fr, G, K, seg = load(pid)
        if not K or len(Fr) < 4: continue
        theirs = [cv2.resize(cv2.imread(x), (G[0].shape[1], G[0].shape[0])) for x in sorted(glob.glob(os.path.join(work, 'cel_frames', '*.png')))][:len(Fr)]
        if len(theirs) != len(Fr): continue
        M = measure(theirs, G, seg, K)
        sc = [v['scene'].get('score', {}) for v in K.values()]
        mv = np.mean([float(np.abs(G[i].astype(np.float32) - G[i - 1].astype(np.float32)).mean()) for i in range(1, len(G))])
        w, h = size((s.get('clip') or {}).get('path') or s.get('path') or '')
        rows.append({'id': pid, 'family': s.get('source'), 'own': s.get('source') in OWN, 'bw': bool(s.get('bw')), 'src_w': w, 'src_h': h, 'motion': round(float(mv), 2),
                     'keys': len(K), 'cuts': seg[-1], 'dE': round(float(np.mean([x.get('dE', np.nan) for x in sc])), 2), 'ssim': round(float(np.mean([x.get('value_ssim', np.nan) for x in sc])), 3),
                     'edgeF': round(float(np.mean([x.get('edge_f', np.nan) for x in sc])), 3), 'shapes': round(float(np.mean([x.get('shapes', np.nan) for x in sc])), 1),
                     **M, 'secs_per_s': round(secs[pid] / max(0.1, s['t1'] - s['t0']), 1) if secs.get(pid) else None})
        print(pid, rows[-1]['family'], rows[-1]['src_w'], M, flush=True)
json.dump(rows, open(os.path.join(D, 'quality.json'), 'w'), indent=1)
def summ(R):
    k = ['src_w', 'motion', 'dE', 'ssim', 'edgeF', 'shapes', 'pops_per_s', 'ghost', 'track', 'secs_per_s']
    return {x: round(float(np.nanmedian([r[x] for r in R if r.get(x) is not None])), 3) for x in k} | {'n': len(R), 'bw': sum(r['bw'] for r in R)}
print('\nfound film (archive):', summ([r for r in rows if r['family'] == 'archive']))
print('our footage:          ', summ([r for r in rows if r['own']]))
for fam in sorted({r['family'] for r in rows}): print(f'  {fam:10s}', summ([r for r in rows if r['family'] == fam]))
