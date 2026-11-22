"""Collect the five Magic Ride places (cel take) into site/scenes.json for the viewer. Camera keys carry the take's own times."""
import json, os, sys
D = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); sys.path.insert(0, os.path.dirname(D))
from ride_cel import SCN
po = lambda s: json.load(open(f'{D}/{s}/pose_op.json'))['response']['frames']
go = lambda s: json.load(open(f'{D}/{s}/gen_op.json'))['response']['frames']
K = lambda c, t: {'t': round(t, 3), 'p': c['extrinsics']['position'], 'q': c['extrinsics']['quaternion']}
def spread(cams, t0, t1): return [K(c, t0 + (t1 - t0) * i / (len(cams) - 1)) for i, c in enumerate(cams)]
def timed(s): return [K(f['camera'], t) for f, t in zip(po(s), SCN[s]['times'])]
kp, kg, np_, ng = po('kerb')[0]['camera'], go('kerb'), po('neon')[0]['camera'], go('neon')
places = [
 ('kerb', 'Kerb, under the one lamp', 0, 13.04, spread([kg[1]['camera'], kg[2]['camera'], kp, kg[3]['camera'], kg[4]['camera']], 0, 13.04), kp),
 ('neon', 'Wet neon road', 13.04, 20.92, spread([np_, ng[0]['camera'], ng[1]['camera'], ng[2]['camera']], 13.04, 20.92), np_),
 ('tunnel', 'Grey tunnel', 20.92, 27.9, timed('tunnel'), po('tunnel')[0]['camera']),
 ('fog', 'Into the fog', 27.9, 36.17, timed('fog'), po('fog')[0]['camera']),
 ('lanterns', 'Lantern street', 36.17, 53.4, timed('lanterns'), po('lanterns')[0]['camera'])]
out = []
for name, title, t0, t1, keys, c0 in places:
    e = {'name': name, 'title': title, 't0': t0, 't1': t1, 'spz': f'data/{name}.spz.txt', 'keys': keys, 'fy': c0['intrinsics']['fy'], 'h': c0['intrinsics']['height']}
    if os.path.exists(f'{D}/{name}/{name}_mesh.glb'): e['glb'] = f'data/{name}_mesh.glb.txt'
    out.append(e)
json.dump(out, open(f'{D}/site/scenes.json', 'w'), separators=(',', ':')); print([ (o['name'], len(o['keys']), 'glb' in o) for o in out])
