#!/usr/bin/env python3
"""COMPARING THE CEL IDEAS: wygwyl/world/film/compare.html, written from measurements, not impressions.
  1. found film against our own footage — every drawn patch of the film (story_quality.py → quality.json), by family
  2. the ways to make the frames between drawings — the bench (story_interp_bench.py → bench/<patch>/metrics.json): quality and
     compute, with drawings every second and every third second, on our footage and on found film
  3. affordances — what each way allows (output, editing, re-timing, archive robustness, failure), each claim tied to a number
Frames from the bench grids go to film/compare/ so the differences can be seen.   python3 story_compare.py"""
import os, json, glob, html, subprocess, numpy as np

T = os.path.dirname(os.path.abspath(__file__)); D = os.path.join(T, '.work', 'story'); REPO = os.path.abspath(os.path.join(T, '..', '..', '..', '..'))
PUB = os.path.join(REPO, 'wygwyl', 'world', 'film'); IMG = os.path.join(PUB, 'compare'); os.makedirs(IMG, exist_ok=True)
BD = '/Users/gaia/Downloads/WYGWYL-CORPUS-ARCH/bench'; E = html.escape
Q = json.load(open(os.path.join(D, 'quality.json'))); F = json.load(open(os.path.join(D, 'film.json')))
fam_of = {s['id']: s.get('source') for f in F.values() for s in f['shots'] if s.get('id')}
med = lambda R, k: float(np.nanmedian([r[k] for r in R if r.get(k) is not None])) if R else float('nan')

# 1 · found film against ours
groups = [('found film (archive)', [r for r in Q if r['family'] == 'archive']), ('our footage, all', [r for r in Q if r['own']])] + \
         [(f'  {fam}', [r for r in Q if r['family'] == fam]) for fam in ('markov', 'other', 'film', 'halfworld', 'generated') if any(r['family'] == fam for r in Q)]
cols = [('n', None), ('source px', 'src_w'), ('b&w', None), ('motion', 'motion'), ('ΔE ↓', 'dE'), ('value SSIM ↑', 'ssim'), ('edges F ↑', 'edgeF'), ('shapes', 'shapes'),
        ('pops/s ↓', 'pops_per_s'), ('ghost (1 = none)', 'ghost'), ('track ↑', 'track'), ('drawing s per film s', 'secs_per_s')]
def cell(R, k, lab):
    if lab == 'n': return str(len(R))
    if lab == 'b&w': return str(sum(r['bw'] for r in R))
    v = med(R, k); return '–' if np.isnan(v) else (f'{v:.0f}' if k in ('src_w', 'shapes') else f'{v:.2f}' if k in ('dE', 'motion', 'pops_per_s', 'secs_per_s') else f'{v:.3f}')
t1 = '<tr>' + ''.join(f'<th>{E(c)}</th>' for c, _ in [('', None)] + cols) + '</tr>' + ''.join('<tr><td>' + E(g) + '</td>' + ''.join(f'<td>{cell(R, k, c)}</td>' for c, k in cols) + '</tr>' for g, R in groups)

# 2 · the bench
B = {os.path.basename(os.path.dirname(f)): json.load(open(f)) for f in glob.glob(os.path.join(BD, '*', 'metrics.json'))}
B = {p: b for p, b in B.items() if 'A3' in b['metrics']}                                  # the timed round only
LAB = {'A': 'A · blend (theirs)', 'C': 'C · hold', 'F': 'F · EbSynth', 'G': 'G · RIFE', 'A3': 'A3 · blend, 1 drawing / 3 s', 'F3': 'F3 · EbSynth, 1 drawing / 3 s', 'G3': 'G3 · RIFE, 1 drawing / 3 s'}
def bench_rows(pids):
    out = ''
    for m in LAB:
        R = [B[p]['metrics'][m] for p in pids if m in B[p]['metrics']]
        if not R: continue
        g = lambda k: float(np.nanmean([r[k] for r in R if r.get(k) is not None]))
        out += f"<tr><td>{E(LAB[m])}</td><td>{g('pops_per_s'):.2f}</td><td>{g('ghost'):.3f}</td><td>{g('track'):.3f}</td><td>{g('between_s_per_s'):.1f}</td><td>{g('total_s_per_s'):.1f}</td></tr>"
    return out
own = [p for p in B if fam_of.get(p) != 'archive']; arch = [p for p in B if fam_of.get(p) == 'archive']
hdr = '<tr><th></th><th>pops/s ↓</th><th>ghost (1 = none)</th><th>track ↑</th><th>between-frames compute, s per film s</th><th>total with drawings, s per film s</th></tr>'
# players: every bench patch, playable — the grid (footage + every method, in sync) and each method alone, small enough to publish
VD = '/Users/gaia/Downloads/WYGWYL-CORPUS-ARCH/shots/video'
def enc(src, dst, w, crf):
    if os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src): return True
    return subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vf', f'scale={w}:-2', '-c:v', 'libx264', '-crf', str(crf), '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', dst]).returncode == 0
figs = ''
for p in sorted(B):
    od = os.path.join(IMG, p); os.makedirs(od, exist_ok=True); have = []
    if os.path.exists(os.path.join(BD, p, 'grid.mp4')) and enc(os.path.join(BD, p, 'grid.mp4'), os.path.join(od, 'grid.mp4'), 1440, 27): have.append(('grid', 'all side by side'))
    fr = os.path.join(VD, p, 'frames')                                                    # the footage itself, as the drawings saw it
    if os.path.isdir(fr) and not os.path.exists(os.path.join(od, 'S.mp4')):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', '12', '-i', os.path.join(fr, '%05d.png'), '-vf', 'scale=720:-2', '-c:v', 'libx264', '-crf', '26', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', os.path.join(od, 'S.mp4')])
    if os.path.exists(os.path.join(od, 'S.mp4')): have.append(('S', 'footage'))
    for m in B[p]['metrics']:
        if os.path.exists(os.path.join(BD, p, f'{m}.mp4')) and enc(os.path.join(BD, p, f'{m}.mp4'), os.path.join(od, f'{m}.mp4'), 720, 26): have.append((m, LAB.get(m, m)))
    btn = ''.join(f"<button data-src='compare/{p}/{k}.mp4'{' class=on' if k == 'grid' else ''}>{E(l)}</button>" for k, l in have)
    mt = B[p]['metrics']
    figs += (f"<figure class='pl'><video controls loop muted playsinline preload='metadata' src='compare/{p}/grid.mp4'></video><div class='btns'>{btn}</div>"
             f"<figcaption>{E(p)} · {E(fam_of.get(p) or '')} · " + ' · '.join(f"{E(m)}: track {v['track']}, pops {v['pops_per_s']}/s" for m, v in mt.items() if v.get('track') is not None) + "</figcaption></figure>")
# 3 · affordances (each grounded in the numbers above)
def m(meth, k, pids=list(B)):
    v = [B[p]['metrics'][meth][k] for p in pids if meth in B[p]['metrics'] and B[p]['metrics'][meth].get(k) is not None]; return float(np.mean(v)) if v else float('nan')
AFF = [('A · blend (theirs)', f"{m('A', 'total_s_per_s'):.0f} s of computer per second of film, almost all of it drawing a keyframe every second", 'raster frames',
        'change a keyframe drawing, re-run the in-betweens', 'needs the footage’s flow', f"tracks well (track {m('A', 'track'):.2f}); boils where neighbouring drawings disagree, ghosts in fast motion"),
       ('C · hold', f"{m('C', 'total_s_per_s'):.0f} s per film s: no in-between work at all", 'each frame IS a drawing: the scene program’s vector SVG, editable and re-timable',
        'any held drawing can be redrawn by hand or re-run alone', 'free: holds are the classic way to time a cartoon', f"does not move between drawings (track {m('C', 'track'):.2f}); pops at each new drawing ({m('C', 'pops_per_s'):.2f}/s)"),
       ('F · EbSynth', f"{m('F', 'total_s_per_s'):.0f} s per film s; the synthesis itself (CPU) costs more than the drawings", 'raster frames that keep the drawing’s own texture',
        'change a keyframe drawing, re-synthesise', 'follows the footage’s structure frame by frame', f"tracks best and ghosts least (track {m('F', 'track'):.2f}, ghost {m('F', 'ghost'):.2f}); smears where new content appears"),
       ('F3 · EbSynth, a drawing every 3 s', f"{m('F3', 'total_s_per_s'):.0f} s per film s, a third of the drawings", 'as F', 'fewer drawings to fix by hand', 'as F',
        f"keeps EbSynth’s quality with a third of the drawings (track {m('F3', 'track'):.2f})"),
       ('G · RIFE', f"{m('G', 'total_s_per_s'):.0f} s per film s; the in-betweens are GPU-fast", 'raster frames: learned morphs between drawings', 'change a drawing, re-run',
        'free: it never looks at the footage', f"smooth between drawings but blind to the footage between them (track {m('G', 'track'):.2f}); best used to turn 12 drawings a second into 24"),
       ('B / D / E · carry, planes, morph', 'cheap (flow only) to moderate (vector rendering)', 'E alone gives vectors in every frame', 'E: move vertices by hand',
        'D and E could re-time freely', 'lost on every patch in the first bench: carry tears figures, planes ghost them, morph mismatches shapes — all three need keyframe drawings that share their shapes first')]
t3 = '<tr><th>way</th><th>compute</th><th>output</th><th>editing</th><th>re-timing</th><th>quality and failure</th></tr>' + ''.join('<tr>' + ''.join(f'<td>{E(x)}</td>' for x in r) + '</tr>' for r in AFF)
arch_q, own_q = [r for r in Q if r['family'] == 'archive'], [r for r in Q if r['own']]
page = f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cel Ideas Compared</title>
<meta name="description" content="WYGWYL · found film against our own footage as cartoon cels, and seven ways to make the frames between drawings, compared on quality, compute and what each allows.">
<style>:root{{--bg:#0a0d18;--panel:#11152a;--line:rgba(255,255,255,.12);--ink:#eef0f7;--mute:#8b93ad;--acc:#f2a541;--cy:#5fe8ff;color-scheme:dark}}
@media (prefers-color-scheme: light){{:root:not([data-theme="dark"]){{--bg:#f6f4ee;--panel:#ebe7dd;--line:rgba(0,0,0,.12);--ink:#191a1f;--mute:#5b5f6e;--acc:#b8650b;--cy:#0b6f86;color-scheme:light}}}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--ink);font:16px/1.6 system-ui,sans-serif}}main{{max-width:1200px;margin:0 auto;padding:28px 16px 80px}}a{{color:var(--cy)}}
.k{{font:500 12px ui-monospace,Menlo,monospace;letter-spacing:.2em;text-transform:uppercase;color:var(--mute)}}h1{{font-weight:500;font-size:clamp(26px,4.4vw,42px);line-height:1.1;margin:8px 0 14px}}
h2{{font:600 12px ui-monospace,Menlo,monospace;letter-spacing:.18em;text-transform:uppercase;color:var(--acc);margin:0 0 12px}}section{{border-top:1px solid var(--line);padding:24px 0}}p{{max-width:880px}}
.scroll{{overflow-x:auto}}table{{border-collapse:collapse;font-size:14px;min-width:100%}}th,td{{border-top:1px solid var(--line);padding:7px 9px;text-align:left;vertical-align:top}}th{{color:var(--mute);font-weight:500;font-size:12.5px}}
figure{{margin:0 0 22px}}figure img,figure video{{width:100%;border-radius:6px;display:block;background:#000}}figcaption{{font-size:13px;color:var(--mute)}}
.btns{{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}}.btns button{{font:500 12px ui-monospace,Menlo,monospace;padding:5px 9px;border-radius:999px;border:1px solid var(--line);background:transparent;color:var(--ink);cursor:pointer}}.btns button.on{{background:var(--acc);color:#111;border-color:var(--acc)}}</style></head><body><main>
<div class="k">WYGWYL · the film in cels · compared</div><h1>Found film against our footage, and seven ways to make the frames between drawings.</h1>
<p>Every number here is measured on the film itself: {len(Q)} drawn patches for the first table, {len(B)} patches run every way for the second. <a href="process.html">How each frame is made</a> · <a href="index.html">the films</a>.</p>
<section><h2>1 · Found film and our footage, as cels</h2>
<p>Found film draws <b>better per keyframe</b> than our own footage (colour error {med(arch_q, 'dE'):.2f} against {med(own_q, 'dE'):.2f}, value structure {med(arch_q, 'ssim'):.3f} against {med(own_q, 'ssim'):.3f}): at {med(arch_q, 'src_w'):.0f} px, mostly without colour noise, it simplifies into fewer shapes ({med(arch_q, 'shapes'):.0f} against {med(own_q, 'shapes'):.0f}). It <b>plays a little worse</b> (pops {med(arch_q, 'pops_per_s'):.2f}/s against {med(own_q, 'pops_per_s'):.2f}/s) and <b>costs more</b> ({med(arch_q, 'secs_per_s'):.1f} s of drawing per second against {med(own_q, 'secs_per_s'):.1f}): old film cuts and flickers inside a patch, and every cut forces another drawing. Our own film keyframes (family "film", the fastest footage) are the hardest of all.</p>
<div class="scroll"><table>{t1}</table></div></section>
<section><h2>2 · The frames between drawings</h2><p>The same keyframe drawings, made into in-betweens seven ways. Compute counts the in-betweens and the drawings (about 25 s of the full stack per drawing).</p>
<h3>our footage · {len(own)} patches</h3><div class="scroll"><table>{hdr}{bench_rows(own)}</table></div>
<h3>found film · {len(arch)} patches</h3><div class="scroll"><table>{hdr}{bench_rows(arch)}</table></div>
<p>Each player: the grid first (footage, then every way, labelled, in sync); the buttons play any one alone at the same moment.</p><div style="margin-top:12px">{figs}</div></section>
<section><h2>3 · What each way allows</h2><div class="scroll"><table>{t3}</table></div></section>
</main><script>
// each player switches between the grid and any single method, keeping its place in time
document.querySelectorAll('figure.pl').forEach(f => {{ const v = f.querySelector('video');
  f.querySelectorAll('.btns button').forEach(b => b.onclick = () => {{ const t = v.currentTime, play = !v.paused; v.src = b.dataset.src;
    v.addEventListener('loadedmetadata', () => {{ try {{ v.currentTime = Math.min(t, v.duration - 0.05); }} catch (e) {{}} if (play) v.play(); }}, {{ once: true }});
    f.querySelectorAll('.btns button').forEach(x => x.classList.toggle('on', x === b)); }}); }});
</script></body></html>"""
open(os.path.join(PUB, 'compare.html'), 'w').write(page); print('wrote compare.html ·', len(Q), 'patches ·', len(B), 'bench patches', '· own', own, '· archive', arch)
