#!/usr/bin/env python3
"""HOW THE FILM IS MADE, written from the work itself: wygwyl/world/film/process.html (the system model, one frame traced through every
stage with its real intermediate images, the film judged from six points of view, provenance for every patch) + process/ images,
credits.json and the carve matrices (carve/NN.md). Re-run whenever the cut or the cels change.
  python3 story_doc.py [--patch P01-002]"""
import os, sys, json, glob, html, shutil, subprocess, collections, numpy as np, cv2

T = os.path.dirname(os.path.abspath(__file__)); D = os.path.join(T, '.work', 'story'); REPO = os.path.abspath(os.path.join(T, '..', '..', '..', '..'))
PUB = os.path.join(REPO, 'wygwyl', 'world', 'film'); IMG = os.path.join(PUB, 'process'); os.makedirs(IMG, exist_ok=True); os.makedirs(os.path.join(PUB, 'carve'), exist_ok=True)
VD = '/Users/gaia/Downloads/WYGWYL-CORPUS-ARCH/shots/video'
F = json.load(open(os.path.join(D, 'film.json'))); PID = sys.argv[sys.argv.index('--patch') + 1] if '--patch' in sys.argv else 'P01-002'
E = html.escape
shots = [s for f in F.values() for s in f['shots'] if s.get('id')]
OWN = {'markov', 'halfworld', 'generated', 'film', 'other', 'mj'}

# ---------- the frame anatomy: one patch, every stage ----------
work = os.path.join(VD, PID); keys = sorted(int(os.path.basename(k)[2:7]) for k in glob.glob(os.path.join(work, 'keyframes', 'kf*_0.png')))
k = keys[1] if len(keys) > 1 else keys[0]; k2 = next((x for x in keys if x > k), k); mid = (k + k2) // 2 if k2 > k else k
sid = f"vid-{PID.lower()}-kf{k:05d}_0"; od = os.path.join(work, 'out', sid)
def put(src, name, w=960):
    im = cv2.imread(src);
    if im is None: return None
    if im.shape[1] > w: im = cv2.resize(im, (w, int(im.shape[0] * w / im.shape[1])), interpolation=cv2.INTER_AREA)
    cv2.imwrite(os.path.join(IMG, name), im, [cv2.IMWRITE_JPEG_QUALITY, 84]); return f'process/{name}'
A = {}
A['source'] = put(os.path.join(work, 'frames', f'{k + 1:05d}.png'), '01-source.jpg')
A['read'] = put(os.path.join(od, 'overlay.jpg'), '02-read.jpg'); A['depth'] = put(os.path.join(od, 'depth.jpg'), '03-depth.jpg')
A['planes'] = put(os.path.join(od, 'multiplane', 'plane_map.jpg'), '04-planes.jpg'); A['exploded'] = put(os.path.join(od, 'multiplane', 'exploded.jpg'), '05-exploded.jpg')
A['program'] = put(os.path.join(od, 'program', 'compare.jpg'), '06-program.jpg', 1200); A['cel'] = put(os.path.join(od, 'program', 'frame0.png'), '07-keyframe-cel.jpg')
f0, f1 = cv2.imread(os.path.join(work, 'frames', f'{k + 1:05d}.png')), cv2.imread(os.path.join(work, 'frames', f'{mid + 1:05d}.png'))
if f0 is not None and f1 is not None:
    g0, g1 = cv2.cvtColor(f0, cv2.COLOR_BGR2GRAY), cv2.cvtColor(f1, cv2.COLOR_BGR2GRAY)
    fl = cv2.calcOpticalFlowFarneback(g1, g0, None, 0.5, 4, 21, 3, 7, 1.5, 0); mag, ang = cv2.cartToPolar(fl[..., 0], fl[..., 1])
    hsv = np.zeros_like(f0); hsv[..., 0] = ang * 90 / np.pi; hsv[..., 1] = 255; hsv[..., 2] = cv2.normalize(mag, None, 0, 255, cv2.NORM_MINMAX)
    cv2.imwrite(os.path.join(IMG, '08-flow.jpg'), cv2.resize(cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR), (960, int(960 * f0.shape[0] / f0.shape[1])))); A['flow'] = 'process/08-flow.jpg'
    A['between_src'] = put(os.path.join(work, 'frames', f'{mid + 1:05d}.png'), '09-between-source.jpg')
A['between'] = put(os.path.join(work, 'cel_frames', f'{mid + 1:05d}.png'), '10-between-cel.jpg')
S = next(s for s in shots if s['id'] == PID); poem = PID[1:3]; tmid = S['t0'] + (S['t1'] - S['t0']) / 2
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{tmid:.2f}', '-i', os.path.join(PUB, f'{poem}.mp4'), '-frames:v', '1', '-vf', 'scale=960:-1', os.path.join(IMG, '11-film.jpg')]); A['film'] = 'process/11-film.jpg'
SJ = json.load(open(os.path.join(od, 'shot.json'))); MP = json.load(open(os.path.join(od, 'multiplane', 'multiplane.json'))); SC = json.load(open(os.path.join(od, 'program', 'scene.json')))
cam = SJ.get('camera', {}); dets = [d['label'] for d in SJ.get('detections', [])][:8]
sheets = [(x.get('plane') or x.get('id'), x.get('label'), x.get('z_m')) for x in MP.get('sheets', [])][:8]
sc = SC.get('score', {})
IB = json.load(open(os.path.join(work, 'inbetween.json'))) if os.path.exists(os.path.join(work, 'inbetween.json')) else None

# ---------- numbers ----------
N = dict(poems=len(F), patches=len(shots), moving=sum(1 for s in shots if s.get('clip')), still=sum(1 for s in shots if s.get('k') and not s.get('clip')), make=sum(1 for s in shots if not s.get('k')),
         gen=sum(1 for s in shots if s.get('generate')), own=sum(1 for s in shots if s.get('source') in OWN), found=sum(1 for s in shots if s.get('source') == 'archive'),
         mins=sum(f['dur'] + 4 for f in F.values()) / 60, mean=np.mean([s['t1'] - s['t0'] for s in shots]),
         cels=sum(1 for s in shots if os.path.exists(os.path.join(VD, s['id'], 'cartoon.mp4'))), keys=sum(len(glob.glob(os.path.join(VD, s['id'], 'keyframes', '*.png'))) for s in shots))
fam = collections.Counter(s.get('source') for s in shots if s.get('k'))

# ---------- credits and matrices ----------
cred = {p: [{'patch': s['id'], 'time': f"{s['t0']:.1f}-{s['t1']:.1f}", 'scene': s['scene'], 'name': s['name'], 'family': s.get('source'),
             'title': (s.get('clip') or {}).get('title'), 'year': (s.get('clip') or {}).get('year'), 'file': os.path.basename((s.get('clip') or {}).get('path') or s.get('path') or '') or None,
             'window': [(s.get('clip') or {}).get('in'), (s.get('clip') or {}).get('len')] if s.get('clip') else None, 'status': 'to make' if not s.get('k') else 'generate' if s.get('generate') else 'cel'}
            for s in f['shots'] if s.get('id')] for p, f in sorted(F.items())}
json.dump(cred, open(os.path.join(PUB, 'credits.json'), 'w'), indent=1, ensure_ascii=False)
for m in glob.glob(os.path.join(D, 'carve', '*.md')) + glob.glob(os.path.join(D, 'carve', '*.yaml')): shutil.copy(m, os.path.join(PUB, 'carve', os.path.basename(m)))

# ---------- the page ----------
fig = lambda key, cap: f"<figure><img src='{A[key]}' alt='{E(cap)}' loading='lazy'><figcaption>{cap}</figcaption></figure>" if A.get(key) else ''
STAGES = [('Story', 'the scene book: 90 scenes, 14 transitions; who, what, where, how blocked', 'scenes.json'),
          ('Clock', 'his reading: 14 recordings, 2,799 timed words; each scene found on it', 'timings/NN.json'),
          ('Carve', 'patches of 6–12 s; a scene edge is a hard cut, inside a scene cuts fall on her breaths', 'patches + triggers'),
          ('Pool', f'53,303 pictures and keyframes in one CLIP space; never the shoot, CAT or cdmx, nor our rendered cuts', 'emb + inventory'),
          ('Cast', 'meaning (action, words spoken, place) · a photographed place · the figure · our footage for POET · one register · no reuse (stretch, frame, subject)', 'one shot per patch'),
          ('Window', 'the clean in-point: no hard cut inside, judged on the stretch actually probed', 'clip in + length'),
          ('Keys', 'a keyframe about every second and at every cut', '1 key / s'),
          ('Read', 'Grounding DINO on the scene’s words → SAM 2.1 masks · OneFormer ADE20K · Depth Pro (metric depth, focal) · ground plane → camera height, pitch, roll', 'shot.json'),
          ('Planes', 'the picture cut into flat sheets at measured depths: P6 sky … P1 foreground, P0 mask', 'multiplane'),
          ('Draw', 'the scene program: polygons in the shot’s own colours per plane, refined by render-and-compare (colour ΔE, value SSIM, edges, simplicity)', 'keyframe cel'),
          ('Carry', 'the frames between: keyframe cels carried along the footage’s optical flow, on twos (12 fps)', 'cel frames'),
          ('Assemble', 'patches in order on his clock, his voice, his line on screen; a card where a patch is still to be made', 'NN.mp4')]
svg_w, bw_, bh, gap = 1180, 180, 74, 16
svg = [f'<svg viewBox="0 0 {svg_w} 360" role="img" aria-label="the system model: twelve stages from the scene book to the film" class="model">']
for i, (t, d, o) in enumerate(STAGES):
    col, row = i % 6, i // 6; x = 10 + col * (bw_ + 16); y = 20 + row * (bh + 120)
    svg.append(f'<rect x="{x}" y="{y}" width="{bw_}" height="{bh}" rx="8" class="box"/><text x="{x + 12}" y="{y + 26}" class="t">{i + 1:02d} {E(t)}</text><text x="{x + 12}" y="{y + 50}" class="o">{E(o)}</text>')
    if col < 5 and i + 1 < len(STAGES): svg.append(f'<path d="M{x + bw_} {y + bh / 2} h16" class="ar"/>')
svg.append(f'<path d="M{10 + 5 * (bw_ + 16) + bw_ / 2} {20 + bh} v40 H{10 + bw_ / 2} v{120 - 40}" class="ar"/></svg>')
stage_rows = ''.join(f'<tr><td><b>{i + 1:02d} {E(t)}</b></td><td>{E(d)}</td><td><code>{E(o)}</code></td></tr>' for i, (t, d, o) in enumerate(STAGES))
povs = [('The viewer', 'Can it be watched? Three things broke it: boiling (each keyframe drawn on its own re-cuts the shapes every second), ghosting (in-betweens blended two different drawings), and hidden cuts (montage footage inside one patch). The cuts are fixed: windows are judged only on the stretch actually probed, with a strict test, and the 20 montage patches were re-cast. For boiling and ghosting a second in-betweener carries one drawing at a time and re-keys only when the footage stops fitting (story_inbetween.py); the measures do not yet separate it from the original, so it is compared by eye.'),
        ('The editor', f'One patch, one moving shot, on his clock: {N["patches"]} patches averaging {N["mean"]:.1f} s. A shot is never used twice: not the same stretch of a source, not the same frame from another file (our edits re-contain their clips), not the same subject at another moment (CLIP of the frame shown). A source does not return within three patches; colour and black-and-white do not flip inside a poem.'),
        ('The poem', 'Every scene is found on the reading by its first line (85 of 90 exactly, the rest between their neighbours); a patch is cast for the words spoken while it is on screen, so the picture follows the line. Transitions carry each poem into the next.'),
        ('The animator', f'Cels in the angular style of wygwyl-world-arch: flat polygons in the shot’s own colours, one light, no outlines, cut into planes so they can move at different speeds. {N["keys"]} keyframes drawn, the frames between carried by the footage’s motion on twos; a patch with no clean moving footage is a held drawing.'),
        ('The archivist', f'{N["own"]} patches from our own footage (Markov, generated, film, halfworld, Midjourney views), {N["found"]} from found film through Cineosis Lab; credits.json lists every patch’s source file, window, and for found film its title and year. Nothing from the shoot, CAT or cdmx is in the pool.'),
        ('The machine', 'Where the models fail: Depth Pro reads fog as near-flat; COCO-trained segmenters give up on haze and neon (hence prompt-driven Grounding DINO + SAM); CLIP rates the meaning of collages and ink washes as if they were photographs (hence a pixel test for paper and a list of graphic forms); ffmpeg’s scene test misses fast montage (hence the stricter repair).')]
pov_html = ''.join(f'<div class="pov"><h3>{E(t)}</h3><p>{E(d)}</p></div>' for t, d in povs)
cred_rows = ''.join(f"<tr><td>{E(c['patch'])}</td><td>{E(c['time'])}</td><td>{E(c['name'])}</td><td>{E(c['family'] or '')}</td><td>{E((c['title'] or '') + (' (' + str(c['year']) + ')' if c['year'] else ''))}</td><td><code>{E((c['file'] or '')[:46])}</code></td><td>{E(c['status'])}</td></tr>"
                    for p in sorted(cred) for c in cred[p])
page = f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>How the Film Is Made</title><meta name="description" content="WYGWYL · how the cel film is made: the system model from the scene book to the frame, one frame traced through every stage with its real images, six points of view, and the provenance of every patch.">
<style>:root{{--bg:#0a0d18;--panel:#11152a;--line:rgba(255,255,255,.12);--ink:#eef0f7;--mute:#8b93ad;--acc:#f2a541;--cy:#5fe8ff;color-scheme:dark}}
@media (prefers-color-scheme: light){{:root:not([data-theme="dark"]){{--bg:#f6f4ee;--panel:#ebe7dd;--line:rgba(0,0,0,.12);--ink:#191a1f;--mute:#5b5f6e;--acc:#b8650b;--cy:#0b6f86;color-scheme:light}}}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--ink);font:16px/1.6 system-ui,sans-serif}}main{{max-width:1180px;margin:0 auto;padding:28px 16px 80px}}a{{color:var(--cy)}}
.k{{font:500 12px ui-monospace,Menlo,monospace;letter-spacing:.2em;text-transform:uppercase;color:var(--mute)}}h1{{font-weight:500;font-size:clamp(28px,4.6vw,46px);line-height:1.08;margin:8px 0 14px}}
h2{{font:600 12px ui-monospace,Menlo,monospace;letter-spacing:.18em;text-transform:uppercase;color:var(--acc);margin:0 0 12px}}section{{border-top:1px solid var(--line);padding:26px 0}}p{{max-width:860px}}
.nums{{display:flex;flex-wrap:wrap;gap:10px 30px}}.nums div{{font:12px ui-monospace,Menlo,monospace;color:var(--mute)}}.nums b{{display:block;font:600 28px system-ui;color:var(--ink)}}
.model{{width:100%;height:auto;display:block}}.model .box{{fill:var(--panel);stroke:var(--line)}}.model .t{{fill:var(--ink);font:600 15px system-ui}}.model .o{{fill:var(--mute);font:12px ui-monospace,Menlo,monospace}}.model .ar{{stroke:var(--acc);stroke-width:2;fill:none}}
table{{width:100%;border-collapse:collapse;font-size:14px}}td{{border-top:1px solid var(--line);padding:7px 8px;vertical-align:top}}code{{font:12px ui-monospace,Menlo,monospace;color:var(--mute)}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:14px}}figure{{margin:0}}figure img{{width:100%;display:block;border-radius:6px;background:#000}}figcaption{{font-size:13px;color:var(--mute);margin-top:6px}}
.wide{{grid-column:1/-1}}.pov{{background:var(--panel);border-radius:10px;padding:14px 16px}}.pov h3{{margin:0 0 6px;font-size:16px}}.pov p{{margin:0;font-size:14.5px}}.povs{{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:12px}}
.scroll{{overflow-x:auto}}</style></head><body><main>
<div class="k">WYGWYL · where you go when you leave · the film in cels</div>
<h1>How each frame is made, from the poem to the cel.</h1>
<p>Fourteen poems, read aloud; a scene book that says what happens in each; an archive of found film and our own footage; and wygwyl-world-arch’s drawing pipeline. Each poem is carved into short patches on his reading’s clock, each patch is cast one moving shot that means what she is saying, and every frame of that shot is redrawn as an angular cel. <a href="index.html">Watch the films</a>.</p>
<div class="nums">{''.join(f'<div><b>{b}</b>{l}</div>' for b, l in [(N['poems'], 'poems'), (f"{N['mins']:.0f} min", 'of film'), (N['patches'], 'patches'), (f"{N['mean']:.1f} s", 'mean patch'), (N['moving'], 'moving shots'), (N['still'], 'held drawings'), (N['make'], 'still to make'), (N['keys'], 'keyframes drawn')])}</div>
<section><h2>The system model</h2>{''.join(svg)}<div class="scroll"><table>{stage_rows}</table></div></section>
<section><h2>One frame, every stage · {E(PID)} · {E(S['name'])}</h2>
<p>{E(S['what'])} His words while it is on screen: “{E(S['said'][:160])}”. Source: {E(S.get('source') or '')}, {E(os.path.basename((S.get('clip') or {}).get('path') or S.get('path') or ''))}, {(S.get('clip') or {}).get('len', 0):.1f} s from {(S.get('clip') or {}).get('in', 0):.2f} s. Keyframe {k} of {len(keys)} keys; the in-between shown is frame {mid}.</p>
<div class="grid">{fig('source', '1 · the footage at the keyframe')}{fig('read', '2 · read: Grounding DINO boxes on the scene’s words, SAM 2.1 masks, the horizon — ' + E(', '.join(dets)))}
{fig('depth', f"3 · Depth Pro: metric depth; camera {cam.get('height_m')} m up, pitch {cam.get('pitch_deg')}°, lens {cam.get('fov_h_deg')}° ({E(str(cam.get('shot_class')))})")}
{fig('planes', '4 · the planes: every pixel assigned P6 sky … P1 foreground')}{fig('exploded', '5 · the multiplane: sheets at their measured depths — ' + E(', '.join(f'{a} {b} {c:.1f} m' if isinstance(c, (int, float)) else f'{a} {b}' for a, b, c in sheets)))}
<div class="wide">{fig('program', f"6 · the scene program: original · drawing · end of camera move · colour error. ΔE {sc.get('dE')}, value SSIM {sc.get('value_ssim')}, edges F {sc.get('edge_f')}, {sc.get('shapes')} shapes")}</div>
{fig('cel', '7 · the keyframe cel')}{fig('flow', f'8 · the footage’s motion from keyframe {k} to frame {mid} (hue = direction, brightness = speed)')}
{fig('between_src', f'9 · the footage at frame {mid}')}{fig('between', f'10 · the cel at frame {mid}: the keyframe drawings carried along that motion')}
<div class="wide">{fig('film', '11 · the frame in the film: on his clock, his line on screen')}</div></div>
{('<p>In-between measures for this patch: ' + E(json.dumps(IB['this'])) + ' (one drawing carried) against ' + E(json.dumps(IB['theirs'])) + ' (two drawings blended).</p>') if IB and IB.get('theirs') else ''}</section>
<section><h2>Six points of view</h2><div class="povs">{pov_html}</div></section>
<section><h2>Provenance · every patch</h2><p>Families: {E(', '.join(f'{k} {v}' for k, v in fam.most_common()))}. The carve matrices for each poem (diagnosis and olog, patch genome, story map, reforge stack with each patch’s Master Patch Prompt) are in <a href="carve/">carve/</a>; every patch’s source is in <a href="credits.json">credits.json</a>.</p>
<div class="scroll"><table><tr><td><b>patch</b></td><td><b>s</b></td><td><b>scene</b></td><td><b>family</b></td><td><b>found film</b></td><td><b>file</b></td><td><b>status</b></td></tr>{cred_rows}</table></div></section>
</main></body></html>"""
open(os.path.join(PUB, 'process.html'), 'w').write(page)
print('wrote', os.path.join(PUB, 'process.html'), N)
