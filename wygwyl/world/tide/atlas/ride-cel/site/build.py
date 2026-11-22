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
json.dump(reels, open(f'{SITE}/reels.json', 'w'), separators=(',', ':'))
# GitHub Pages copy of the page: the same page with the document head the artifact host normally adds
page = open(f'{SITE}/index.html').read()
open(f'{SITE}/play.html', 'w').write('<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
    '<!-- generated from index.html by build.py: the GitHub Pages copy of the viewer -->\n</head><body>\n' + page + '\n</body></html>\n')
for r in reels.values(): print(r['title'], [(p['name'], len(p['splat'] or []), len(p['mesh'] or [])) for p in r['places']])
