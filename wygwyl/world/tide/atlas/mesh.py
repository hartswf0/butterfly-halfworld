"""splats2Mesh: Atlas splats -> textured GLB mesh (+ collider boxes).  usage: python atlas/mesh.py <scene dir> <splat op json>"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import wlt
D, opf = sys.argv[1], sys.argv[2]; st = f'{D}/state.json'; S = json.load(open(st))
sp = json.load(open(f'{D}/{opf}'))['response']['draftSplat']['assetId']
if S.get('mesh_src') != sp:
    S['mesh_op'] = wlt.submit('splats2Mesh', {'splatAsset': {'assetId': sp}, 'textureMode': 'image_texture', 'textureSize': 4096, 'colliderBoxes': {}}, idem=f'mesh-{sp}')
    S['mesh_src'] = sp; json.dump(S, open(st, 'w'), indent=1)
print('mesh op', S['mesh_op'], flush=True)
op = wlt.wait(S['mesh_op'], every=15); json.dump(op, open(f'{D}/mesh_op.json', 'w'), indent=1)
if op.get('error'): print('error', op['error']); sys.exit(1)
r = op['response']; name = os.path.basename(D)
wlt.fetch(r['mesh']['url'], f'{D}/{name}_mesh.glb')
if r.get('colliderBoxes'): wlt.fetch(r['colliderBoxes']['url'], f'{D}/{name}_colliders.glb')
print('saved', os.path.getsize(f'{D}/{name}_mesh.glb'), 'bytes; anchors', len(r.get('anchorPositions') or []))
