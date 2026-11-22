import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import wlt
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'arcade'); st = os.path.join(D, 'state.json'); S = json.load(open(st))
mode = sys.argv[1]   # draft | refined
fr = json.load(open(D + '/pose_op.json'))['response']['frames']
if 'mask_assets' not in S:
    S['mask_assets'] = [wlt.upload(f'{D}/masks/{n:02d}.png', f'arcade-mask-{n:02d}.png') for n in range(len(fr))]; json.dump(S, open(st, 'w'), indent=1)
pf = [{'imageAsset': {'assetId': f['imageAsset']['assetId']}, 'depth': {'depthAsset': {'assetId': f['depth']['depthAsset']['assetId']}},
       'camera': f['camera'], 'maskAsset': {'assetId': S['mask_assets'][n]}} for n, f in enumerate(fr)]
body = {'posedFrames': pf, 'refine': mode == 'refined',
        'prompt': 'An abandoned shopping arcade at night: twin escalators with glowing brass handrails rising into fog under a concrete mezzanine, wet tiled floor scattered with debris, neon shop signs and vending machines along the walls.'}
k = mode + '_op'
if k not in S:
    S[k] = wlt.submit('posedImages2Splats', body, idem=f'arcade-splats-{mode}-v1'); json.dump(S, open(st, 'w'), indent=1)
print(mode, 'op', S[k], flush=True)
op = wlt.wait(S[k], every=20); json.dump(op, open(f'{D}/{mode}_op.json', 'w'), indent=1)
print('state', op['metadata'].get('state') if op.get('metadata') else None, 'error', op.get('error'))
r = op['response'] or {}
if mode == 'draft': wlt.fetch(r['draftSplat']['url'], f'{D}/arcade_draft.spz')
else:
    for cnt, a in r['refinedSplats'].items(): wlt.fetch(a['url'], f'{D}/arcade_{cnt}.spz'); print('saved', cnt)
print(json.dumps({kk: (v if kk != 'refinedSplats' else list(v)) for kk, v in r.items() if kk not in ('draftSplat',)})[:600])
