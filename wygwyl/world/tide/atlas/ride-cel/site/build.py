"""Build the viewer's reels.json and data files.
Two reels: Magic Ride (five places, his voice, his words) and the Arcade walk (one place, the take's own sound).
Binary files go as base64 text split into parts under 12 MB (artifacts serve only web types, 16 MB a file)."""
import base64, glob, json, os, sys
SITE = os.path.dirname(os.path.abspath(__file__)); A = os.path.dirname(os.path.dirname(SITE)); D = f'{A}/ride-cel'
sys.path.insert(0, A); from ride_cel import SCN
DATA = f'{SITE}/data'; os.makedirs(DATA, exist_ok=True); PART = 12_000_000
def pack(src, name):
    if not os.path.exists(src): return None
    for f in glob.glob(f'{DATA}/{name}.p*.txt'): os.remove(f)
    b = base64.b64encode(open(src, 'rb').read()).decode(); parts = []
    for i in range(0, len(b), PART): p = f'data/{name}.p{i // PART}.txt'; open(f'{SITE}/{p}', 'w').write(b[i:i + PART]); parts.append(p)
    return parts
po = lambda d: json.load(open(f'{d}/pose_op.json'))['response']['frames']
go = lambda d: json.load(open(f'{d}/gen_op.json'))['response']['frames']
K = lambda c, t: {'t': round(t, 3), 'p': c['extrinsics']['position'], 'q': c['extrinsics']['quaternion']}
spread = lambda cams, t0, t1: [K(c, t0 + (t1 - t0) * i / (len(cams) - 1)) for i, c in enumerate(cams)]
timed = lambda d, times: [K(f['camera'], t) for f, t in zip(po(d), times)]
LID = json.load(open(f'{SITE}/lidar.json'))
def place(name, title, t0, t1, keys, c0, d, splat):
    rel = lambda f: os.path.relpath(f, SITE) if f and os.path.exists(f) else None   # the original file, served directly where the repo is published (GitHub Pages)
    return {'name': name, 'title': title, 't0': t0, 't1': t1, 'keys': keys, 'fy': c0['intrinsics']['fy'], 'h': c0['intrinsics']['height'],
            'splat': pack(splat, f'{name}.spz'), 'mesh': pack(f'{d}/{name}_mesh.glb', f'{name}.glb'), 'lidar': f'data/{name}.lidar.txt', 'lidarMeta': LID[name],
            'raw': {'splat': rel(splat), 'mesh': rel(f'{d}/{name}_mesh.glb'), 'lidar': rel(f'{d}/{name}.lidar.bin')}}
kp, kg, np_, ng = po(f'{D}/kerb')[0]['camera'], go(f'{D}/kerb'), po(f'{D}/neon')[0]['camera'], go(f'{D}/neon')
ride = [
 place('kerb', 'Kerb, under the one lamp', 0, 13.04, spread([kg[1]['camera'], kg[2]['camera'], kp, kg[3]['camera'], kg[4]['camera']], 0, 13.04), kp, f'{D}/kerb', f'{D}/kerb/kerb_draft.spz'),
 place('neon', 'Wet neon road', 13.04, 20.92, spread([np_, ng[0]['camera'], ng[1]['camera'], ng[2]['camera']], 13.04, 20.92), np_, f'{D}/neon', f'{D}/neon/neon_draft.spz')]
for name, title, t0, t1 in (('tunnel', 'Grey tunnel', 20.92, 27.9), ('fog', 'Into the fog', 27.9, 36.17), ('lanterns', 'Lantern street', 36.17, 53.4)):
    ride.append(place(name, title, t0, t1, timed(f'{D}/{name}', SCN[name]['times']), po(f'{D}/{name}')[0]['camera'], f'{D}/{name}', f'{D}/{name}/{name}_draft.spz'))
AR = f'{A}/arcade'; times = json.load(open(f'{AR}/prep.json'))['times']
arcade = [place('arcade', 'Arcade, zone 091', 0, 20.1, timed(AR, times), po(AR)[0]['camera'], AR, f'{AR}/arcade_draft.spz')]
reels = {
 'ride': {'title': 'Magic Ride', 'about': 'Poem 10, the cel-shaded Genie take, rebuilt by Atlas in five places. His voice; his words as he says them.', 'audio': 'voice.mp3', 'words': 'words.json', 'end': 53.4, 'places': ride},
 'arcade': {'title': 'Arcade walk', 'about': 'Genie street test, zone 091: he walks to the twin escalators, then the camera turns along the shopfronts. Rebuilt by Atlas from 18 frames, the man masked out. The take’s own sound.', 'audio': 'arcade.mp3', 'words': None, 'end': 20.1, 'places': arcade}}
# ---- the grey-box Genie takes: each shot a place (LiDAR from Atlas, people removed), with the Sapiens2 bodies lifted into it
import numpy as np, subprocess
from film import cloud
TITLES = {'01': 'Out of Life', '03': 'How to Break off an Engagement', '04': 'Nevermore', '05': 'Bloodline', '06': 'Resurrecting Atlantis', '12': 'Reunion'}
TP = json.load(open(f'{os.path.dirname(A)}/tide.json'))['poems']
def pack_cloud(P, C, name, n_max=160000, bin_path=None):
    lo, hi = np.percentile(P, .5, 0), np.percentile(P, 99.5, 0); ok = np.all((P >= lo) & (P <= hi), 1); P, C = P[ok], C[ok]
    if len(P) > n_max: i = np.random.default_rng(0).choice(len(P), n_max, replace=False); P, C = P[i], C[i]
    q = np.round((P - lo) / np.maximum(hi - lo, 1e-6) * 65535 - 32768).astype(np.int16); raw = q.tobytes() + C.mean(1).astype(np.uint8).tobytes()
    open(f'{DATA}/{name}.lidar.txt', 'w').write(base64.b64encode(raw).decode()); y = P[:, 1]
    if bin_path: open(bin_path, 'wb').write(raw)   # the same cloud as a plain file, committed, for GitHub Pages
    return {'n': int(len(P)), 'lo': lo.round(4).tolist(), 'hi': hi.round(4).tolist(), 'ground': round(float(np.percentile(y, 1)), 3), 'top': round(float(np.percentile(y, 99)), 3)}
for tk in sorted(glob.glob(f'{A}/takes/*/bodies3d.json')):
    TD = os.path.dirname(tk); take = os.path.basename(TD); man = json.load(open(f'{os.path.dirname(A)}/full/out/{take}/manifest.json')); poem = man['poem']
    B3 = json.load(open(tk)); places = []
    for s in man['shots']:
        sd = f"s{s['shot']}"; fr = po(f'{TD}/{sd}'); ts = json.load(open(f'{TD}/{sd}/times.json'))
        P, C = cloud([(f'{TD}/{sd}/posed/{k:02d}_rgb.jpg', f'{TD}/{sd}/posed/{k:02d}_depth_masked.exr', f['camera']) for k, f in enumerate(fr)], step=3)
        meta = pack_cloud(P, C, f'{take}-{sd}', bin_path=f'{TD}/{sd}/lidar.bin')
        places.append({'name': f'{take}-{sd}', 'title': f"Shot {s['shot']}", 't0': s['t0'], 't1': s['t0'] + s['seconds'], 'keys': timed(f'{TD}/{sd}', ts),
                       'fy': fr[0]['camera']['intrinsics']['fy'], 'h': fr[0]['camera']['intrinsics']['height'], 'splat': None, 'mesh': None,
                       'lidar': f'data/{take}-{sd}.lidar.txt', 'lidarMeta': meta, 'raw': {'lidar': os.path.relpath(f'{TD}/{sd}/lidar.bin', SITE)}, 'bodies': B3.get(sd, [])})
    aud = f'{take}.mp3'; subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f'{os.path.dirname(A)}/full/out/{take}/film.mp4', '-vn', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '96k', f'{SITE}/{aud}'], check=True)
    wf = f'{take}.words.json'; json.dump([{'t0': l['t0'], 't1': l['t1'], 'w': [[w[0], w[1]] for w in l['words']]} for l in TP[int(poem) - 1]['lines']], open(f'{SITE}/{wf}', 'w'), separators=(',', ':'))
    seed = 'inverse foundry' if '-grey-' in take else 'its own level'
    reels[take] = {'title': TITLES.get(poem.zfill(2), take), 'about': f"Poem {poem.zfill(2)}, a grey-box Genie 4 take seeded from {seed}, rebuilt by Atlas shot by shot. The people are cut out of the world; Sapiens2 tracks their bodies and Atlas depth sets them back in 3D. Pause and drag to walk round them.",
                   'audio': aud, 'words': wf, 'end': places[-1]['t1'], 'places': places}
    print(take, len(places), 'shots;', sum(len(f['people']) for p in places for f in p['bodies']), 'bodies')
# bodies travel in one file per take, fetched when the take is opened (keeps the reel list small for phones)
os.makedirs(f'{SITE}/bodies', exist_ok=True)
for k, r in reels.items():
    B = {p['name']: p.pop('bodies') for p in r['places'] if 'bodies' in p}
    if B: json.dump(B, open(f'{SITE}/bodies/{k}.json', 'w'), separators=(',', ':')); r['bodiesFile'] = f'bodies/{k}.json'
json.dump(reels, open(f'{SITE}/reels.json', 'w'), separators=(',', ':'))
# GitHub Pages copy of the page: the same page with the document head the artifact host normally adds
page = open(f'{SITE}/index.html').read()
open(f'{SITE}/play.html', 'w').write('<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
    '<!-- generated from index.html by build.py: the GitHub Pages copy of the viewer -->\n</head><body>\n' + page + '\n</body></html>\n')
for r in reels.values(): print(r['title'], [(p['name'], len(p['splat'] or []), len(p['mesh'] or [])) for p in r['places']])
# the grey-box takes also go to a viewer of their own (one artifact holds at most 256 MB, and Magic Ride's splats and meshes fill most of it)
takes = {k: v for k, v in reels.items() if 'grey' in k}
json.dump({k: takes[k] for k in sorted(takes, key=lambda k: (k[:2], 'greyfig' in k))}, open(f'{SITE}/reels-takes.json', 'w'), separators=(',', ':'))
tp = open(f'{SITE}/index.html').read().replace('<title>Magic Ride</title>', '<title>Grey-box Takes</title>')
tp = tp.replace("await openReel(location.hash.slice(1) || 'ride');", "await openReel(location.hash.slice(1) || Object.keys(R)[0]);").replace("const r = R[id] || R.ride || Object.values(R)[0];", "const r = R[id] || R.ride || Object.values(R)[0];")
open(f'{SITE}/takes.html', 'w').write(tp)
open(f'{SITE}/play-takes.html', 'w').write('<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
    '<!-- generated from takes.html by build.py: the GitHub Pages copy of the grey-box takes viewer -->\n</head><body>\n' + tp + '\n</body></html>\n')

# ---- one page per reel, and a front page that lists them (GitHub Pages) --------------------------------------
import re, html as H
TIDE = os.path.dirname(A)
def slug(k, r):
    lab = '' if 'grey' not in k else ('-level' if 'greyfig' in k else '-foundry')
    return re.sub(r'[^a-z0-9]+', '-', r['title'].lower()).strip('-') + lab
os.makedirs(f'{SITE}/reel', exist_ok=True); os.makedirs(f'{SITE}/posters', exist_ok=True)
page = open(f'{SITE}/index.html').read()
cards = []
for k, r in reels.items():
    sl = slug(k, r); json.dump({k: r}, open(f'{SITE}/reel/{sl}.json', 'w'), separators=(',', ':'))
    one = page.replace('<title>Magic Ride</title>', f"<title>{H.escape(r['title'])}</title>")
    open(f'{SITE}/{sl}.html', 'w').write('<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
        f'<!-- generated by build.py: one reel, {k} -->\n<script>window.REEL_FILE = "reel/{sl}.json";</script>\n</head><body>\n' + one + '\n</body></html>\n')
    # films that belong to this reel, and a poster frame from its Genie take
    films = []
    if 'grey' in k:
        films.append(('Genie take', f'../../../full/out/{k}/film.mp4'))
        for f in sorted(glob.glob(f'{A}/takes/{k}/*-lidar-bodies.mp4')): films.append(('LiDAR with bodies', os.path.relpath(f, SITE)))
        sheet = f'{TIDE}/full/out/{k}/seed-vs-film.jpg'
        if os.path.exists(sheet): films.append(('Seed vs film', os.path.relpath(sheet, SITE)))
        src = f'{TIDE}/full/out/{k}/film.mp4'
    elif k == 'ride':
        films += [('Genie take', '../../../full/out/10ride-cel-1122-0129/film.mp4'), ('LiDAR film', '../magic-ride.mp4')]; src = f'{A}/ride-cel/magic-ride.mp4'
    else:
        films.append(('Genie take', '../../../litmus/out/street-091.mp4')); src = f'{TIDE}/litmus/out/street-091.mp4'
    post = f'{SITE}/posters/{sl}.jpg'
    if not os.path.exists(post) and os.path.exists(src):
        d = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', src], capture_output=True, text=True).stdout or 10)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{d * .38:.2f}', '-i', src, '-frames:v', '1', '-vf', 'scale=640:-2', '-q:v', '5', post])
    seed = '' if 'grey' not in k else (' · seeded from its level' if 'greyfig' in k else ' · seeded from the inverse foundry')
    mins = f"{int(r['end'] // 60)}:{int(r['end'] % 60):02d}"
    links = ''.join(f'<a href="{H.escape(u)}">{H.escape(n)}</a>' for n, u in films)
    cards.append(f'''<article><a class="pic" href="{sl}.html"><img src="posters/{sl}.jpg" alt="" loading="lazy"></a>
<div class="txt"><h2><a href="{sl}.html">{H.escape(r['title'])}</a></h2><p class="meta">{len(r['places'])} {'shots' if 'grey' in k else 'places'} · {mins}{seed}</p>
<p>{H.escape(r['about'])}</p><p class="go"><a class="enter" href="{sl}.html">Enter the world</a>{links}</p></div></article>''')
open(f'{SITE}/reels.html', 'w').write(f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>WYGWYL Reels</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=IBM+Plex+Mono:wght@400;600&display=swap">
<style>
:root{{--stage:#030409;--ink:#f2f3fb;--dim:#8a92b0;--water:#1f4dff;--line:rgba(242,243,251,.16);--word:"IM Fell English",Georgia,serif;--mono:"IBM Plex Mono",ui-monospace,Menlo,monospace;color-scheme:dark}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--stage);color:var(--ink);font:14px/1.5 var(--mono)}}
main{{max-width:1080px;margin:0 auto;padding:28px max(16px,env(safe-area-inset-right,0px)) 72px max(16px,env(safe-area-inset-left,0px))}}
header p{{color:var(--dim);max-width:64ch}}h1{{font:italic 400 clamp(30px,6vw,46px)/1.1 var(--word);margin:0 0 10px}}
.grid{{display:grid;gap:28px;margin-top:28px}}
article{{display:grid;grid-template-columns:minmax(0,320px) minmax(0,1fr);gap:20px;border-top:1px solid var(--line);padding-top:20px}}
@media (max-width:640px){{article{{grid-template-columns:minmax(0,1fr)}}}}
.pic img{{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;background:#0b0d16}}
h2{{font:italic 400 24px/1.2 var(--word);margin:0}}h2 a{{color:var(--ink);text-decoration:none}}
.meta{{color:var(--dim);font-size:11px;letter-spacing:.12em;text-transform:uppercase;margin:4px 0 8px}}
.txt p{{margin:0 0 10px;max-width:62ch;color:#c9cde0;font-size:13px}}
.go{{display:flex;flex-wrap:wrap;gap:8px}}.go a{{font:600 11px/1 var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--ink);border:1px solid var(--line);padding:10px 12px;text-decoration:none}}
.go a.enter{{background:var(--water);border-color:var(--water)}}a:focus-visible{{outline:2px solid var(--water);outline-offset:2px}}
</style></head><body><main>
<header><h1>Where You Go When You Leave</h1><p>Genie 4 takes of the poems, rebuilt by Atlas as LiDAR, with every body tracked by Sapiens2. Each world opens on its own page: press Play to hear his reading, press Drive to move through it while it plays, and switch the bodies between skeleton, mannequin, blocks and figure.</p></header>
<div class="grid">{"".join(cards)}</div></main></body></html>
''')
print('pages', len(cards))
