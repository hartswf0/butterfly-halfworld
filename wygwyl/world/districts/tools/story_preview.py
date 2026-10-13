#!/usr/bin/env python3
"""WATCH IT: each poem's cut (story_film.py) as a film timed to her reading. Every shot shows its drawing when the pipeline has
made one (the scene program's frame: flat shapes in the shot's own colours) and its source picture until then, with a slow push,
the line she is speaking burnt in, and a small label (scene · role · source · drawn or not) so the cut can be judged while watching.
Re-run after more shots are drawn and the film fills in with drawings. Writes WYGWYL-CORPUS-ARCH/film/NN.mp4 and film/index.html
(local, served with the mirror; nothing is published).
  python3 story_preview.py [01 02 …] [--drawn]      footage by default; --drawn shows each patch's drawing where it exists
  python3 story_preview.py [01 02 …] --cels --clean the cels with no captions and no audio (for the Cineosis Lab suite, which brings its own)
  python3 story_preview.py [01 02 …] --cels         the film itself: each patch's moving cartoon cel (story_cels.py), no labels → film/NN_cel.mp4"""
import os, sys, json, re, subprocess, tempfile, shutil, html

T = os.path.dirname(os.path.abspath(__file__)); D = os.path.join(T, '.work', 'story'); WY = os.path.join(T, '..', '..', '..')
OUT = '/Users/gaia/Downloads/WYGWYL-CORPUS-ARCH/film'; os.makedirs(OUT, exist_ok=True)
FONT = '/System/Library/Fonts/Supplemental/Arial.ttf'; FPS, WD, HT = 24, 1280, 720
F = json.load(open(os.path.join(D, 'film.json'))); DRAWN = '--drawn' in sys.argv; CELS = '--cels' in sys.argv; CLEAN = '--clean' in sys.argv; V2 = '--v2' in sys.argv; VD = '/Users/gaia/Downloads/WYGWYL-CORPUS-ARCH/shots/video'; poems = [a for a in sys.argv[1:] if not a.startswith('--')] or sorted(F)   # --drawn: drawings over footage
AUDIO = {re.match(r'(\d\d)_', f).group(1): os.path.join(WY, 'audio', f) for f in os.listdir(os.path.join(WY, 'audio')) if re.match(r'\d\d_.*\.mp3$', f)}

def frame_of(s):
    if s.get('drawn') and s.get('sid'):
        f = os.path.join(s['root'], s['sid'], 'program', 'frame0.png')
        if os.path.exists(f): return f, True
    return s['path'], False

def esc(t): return t.replace('\\', '\\\\').replace(':', '\\:').replace("'", '’').replace('%', '\\%')

for p in poems:
    f = F[p]; tmp = tempfile.mkdtemp(); clips = []; drawn = 0
    for i, s in enumerate(f['shots']):
        if not s.get('k'):                                     # a patch to make: a card for its length, so the cut stays on her clock
            d = max(1.0, s['t1'] - s['t0']); n = int(round(d * FPS)); c = os.path.join(tmp, f'{i:03d}.mp4'); tf = os.path.join(tmp, f'gen{i:03d}.txt')
            open(tf, 'w').write(f"TO MAKE  {s.get('id')}  {s['name']}\n{s['what'][:90]}")
            subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', f'color=c=0x0b0d14:s={WD}x{HT}:r={FPS}:d={d:.2f}', '-vf',
                            f"drawtext=fontfile={FONT}:textfile={tf}:x=(w-text_w)/2:y=(h-text_h)/2-40:fontsize=24:line_spacing=10:fontcolor=0xf2a541,format=yuv420p", '-frames:v', str(n),
                            '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', c]); clips.append(c); continue
        d = max(1.0, s['t1'] - s['t0']); n = int(round(d * FPS)); img, dr = frame_of(s); c = os.path.join(tmp, f'{i:03d}.mp4')
        mode = 'drawing' if (dr and DRAWN) else 'footage' if s.get('clip') else 'drawing' if dr else 'still'; drawn += mode == 'drawing'
        lab = f"{s.get('id') or s['scene']} {s.get('role') or ''} - {s['source']} - {mode}{' - GENERATE' if s.get('generate') else ''}"
        tag = f"drawtext=fontfile={FONT}:text='{esc(lab)}':x=14:y=12:fontsize=15:fontcolor=white@0.75:box=1:boxcolor=black@0.35:boxborderw=5"
        cel = os.path.join(VD, s.get('id') or '-', 'cartoon_v2.mp4' if V2 and os.path.exists(os.path.join(VD, s.get('id') or '-', 'cartoon_v2.mp4')) else 'cartoon.mp4')
        if CELS and os.path.exists(cel):                       # the cel, fitted to the patch: its own 12 fps drawings, held on twos at 24
            drawn += 1; vf = f"scale={WD}:{HT}:force_original_aspect_ratio=increase,crop={WD}:{HT},fps={FPS},tpad=stop_mode=clone:stop_duration={d:.2f},format=yuv420p"
            r = subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', cel, '-an', '-vf', vf, '-frames:v', str(n), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', c])
            if r.returncode == 0: clips.append(c)
            continue
        if CELS: tag = 'null'                                  # not drawn yet: the footage, unlabelled, until its cel lands
        if mode == 'footage':                                  # the source moving, from its clean in-point; held on its last frame if short
            cl = s['clip']; vf = f"scale={WD}:{HT}:force_original_aspect_ratio=increase,crop={WD}:{HT},fps={FPS},tpad=stop_mode=clone:stop_duration={d:.2f},{tag},format=yuv420p"
            cmd = ['ffmpeg', '-loglevel', 'error', '-y', '-ss', f"{cl['in']:.2f}", '-i', cl['path'], '-an', '-vf', vf, '-frames:v', str(n), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', c]
        else:
            vf = (f"scale={WD * 2}:{HT * 2}:force_original_aspect_ratio=increase,crop={WD * 2}:{HT * 2},"
                  f"zoompan=z='1+0.07*on/{n}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={n}:s={WD}x{HT}:fps={FPS},{tag},format=yuv420p")
            cmd = ['ffmpeg', '-loglevel', 'error', '-y', '-i', img, '-vf', vf, '-frames:v', str(n), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', c]
        r = subprocess.run(cmd)
        if r.returncode == 0: clips.append(c)
    open(os.path.join(tmp, 'list.txt'), 'w').write(''.join(f"file '{c}'\n" for c in clips))
    # her lines, burnt in at the times she speaks them
    Tm = json.load(open(os.path.join(WY, 'timings', f'{p}.json'))); caps = []
    for k, sg in enumerate(Tm['segments']):
        txt = re.sub(r'\s+', ' ', sg['text']).strip(); lines, cur = [], ''
        for w in txt.split():
            if len(cur) + len(w) > 62: lines.append(cur); cur = w
            else: cur = (cur + ' ' + w).strip()
        lines.append(cur); tf = os.path.join(tmp, f'cap{k:03d}.txt'); open(tf, 'w').write('\n'.join(lines))
        caps.append(f"drawtext=fontfile={FONT}:textfile={tf}:x=(w-text_w)/2:y=h-text_h-38:fontsize=26:line_spacing=6:fontcolor=white:box=1:boxcolor=black@0.45:boxborderw=10:enable='between(t,{sg['start']:.2f},{sg['end']:.2f})'")
    out = os.path.join(OUT, f'{p}_cel_clean.mp4' if CLEAN else f'{p}_cel.mp4' if CELS else f'{p}.mp4'); cmd = ['ffmpeg', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', os.path.join(tmp, 'list.txt')]
    if p in AUDIO and not CLEAN: cmd += ['-i', AUDIO[p], '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '160k']
    cmd += ['-vf', ','.join(caps) if caps and not CLEAN else 'null', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out]
    subprocess.run(cmd, check=True); shutil.rmtree(tmp)
    print(p, f['title'], len(f['shots']), 'shots', drawn, 'drawn', out, flush=True)

# a page to watch them, with each film's shot list
rows = []
for p in sorted(F):
    if not os.path.exists(os.path.join(OUT, f'{p}.mp4')): continue
    f = F[p]; li = ''.join(f"<li><b>{s['t0']:.0f}s</b> {html.escape(s.get('id') or s['scene'])} · {html.escape(s['name'])} · {html.escape((s.get('clip') or {}).get('title') or s.get('source') or '')}{' · GENERATE' if s.get('generate') else ''}{' · drawn' if s.get('drawn') else ''}"
                           f"{' · “' + html.escape(s['said'][:70]) + '”' if s['said'] else ''}</li>" for s in f['shots'] if s.get('id') or s.get('k'))
    cel = os.path.exists(os.path.join(OUT, f'{p}_cel.mp4'))
    rows.append(f"<section><h2>{p} · {html.escape(f['title'])}</h2>" + (f"<video controls preload='metadata' src='{p}_cel.mp4'></video><p style='color:#8b93ad;font-size:13px'>the cels · <a style='color:#5fe8ff' href='{p}.mp4'>the footage cut</a></p>" if cel else f"<video controls preload='metadata' src='{p}.mp4'></video>") + f"<details><summary>{len(f['shots'])} patches</summary><ol>{li}</ol></details></section>")
open(os.path.join(OUT, 'index.html'), 'w').write("""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>The Film, Cut</title>
<style>:root{color-scheme:dark}body{margin:0;background:#0a0d18;color:#eef0f7;font:15px/1.5 system-ui,sans-serif}main{max-width:1100px;margin:0 auto;padding:24px 16px 60px}
h1{font:500 12px ui-monospace,Menlo,monospace;letter-spacing:.2em;text-transform:uppercase;color:#8b93ad}h2{font-weight:400;margin:28px 0 8px}video{width:100%;border-radius:8px;background:#000}
details{color:#8b93ad;font-size:13px;margin-top:6px}ol{columns:2;gap:24px}li{break-inside:avoid;margin:2px 0}b{color:#f2a541}</style></head><body><main>
<h1>Where you go when you leave · the film, cut poem by poem from the archive, our footage and the drawings · a draft to watch</h1>""" + ''.join(rows) + '</main></body></html>')
print('index', os.path.join(OUT, 'index.html'))
