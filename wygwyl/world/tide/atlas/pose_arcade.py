import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import wlt
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'arcade'); st = os.path.join(D, 'state.json')
S = json.load(open(st)) if os.path.exists(st) else {}
fr = sorted(os.listdir(D + '/frames'))
if 'frame_assets' not in S:
    S['frame_assets'] = [wlt.upload(f'{D}/frames/{f}', f'arcade-{f}') for f in fr]; json.dump(S, open(st, 'w'), indent=1); print('uploaded', len(fr))
if 'pose_op' not in S:
    S['pose_op'] = wlt.submit('images2PosedRGBD', {'frames': [{'imageAsset': {'assetId': a}} for a in S['frame_assets']], 'targetResolution': [1280, 720], 'refinePoses': True}, idem='arcade-pose-v1')
    json.dump(S, open(st, 'w'), indent=1); print('pose op', S['pose_op'])
op = wlt.wait(S['pose_op']); json.dump(op, open(D + '/pose_op.json', 'w'), indent=1)
print('state', op['metadata'].get('state'), 'error', op.get('error'))
r = op['response']; print('refinement accepted', r.get('poseRefinementAccepted'), 'frames', len(r['frames']))
os.makedirs(D + '/posed', exist_ok=True)
for n, f in enumerate(r['frames']):
    wlt.fetch(f['depth']['depthAsset']['url'], f'{D}/posed/{n:02d}_depth.exr'); wlt.fetch(f['depth']['confidenceAsset']['url'], f'{D}/posed/{n:02d}_conf.png'); wlt.fetch(f['imageAsset']['url'], f'{D}/posed/{n:02d}_rgb.jpg')
    e = f['camera']['extrinsics']; print(n, [round(v, 2) for v in e['position']], f['camera']['intrinsics']['fx'])
