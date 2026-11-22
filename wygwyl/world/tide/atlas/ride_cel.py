"""Magic Ride (cel-shaded take, full/out/10ride-cel-1122-0129/film.mp4), first half, as three Atlas scenes.
The take cuts at 13.04 s and 20.92 s, and Atlas reconstructs one place per request, so:
  kerb   0-13 s    He (Black man, black turtleneck, black trousers, black boots) stands by his black motorcycle under one street lamp.
                   Fixed camera -> pose one frame, generate 8 views arcing around him and the bike (he is kept, frozen).
  neon   13-20.9 s Wet neon commercial road; fixed camera, he rides off -> pose the near-empty frame at 20.6 s, generate 8 views down the road.
  tunnel 20.9-27.5 s Grey concrete tunnel; the camera follows him forward -> pose 12 frames, mask rider + bike (SAM 2.1 track), splat.
usage: python atlas/ride_cel.py <scene> [stage ...]   stages: frames pose views masks splat"""
import base64, json, math, os, ssl, subprocess, sys, tempfile, glob, urllib.request
import numpy as np, cv2
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import wlt
A = os.path.dirname(os.path.abspath(__file__)); T = os.path.dirname(A)
CLIP = os.path.join(T, 'full/out/10ride-cel-1122-0129/film.mp4')
PROMPT = {
 'kerb': 'Cel-shaded animation, night. A quiet residential street: a single street lamp casts a cone of light on wet grey asphalt and a kerb; dark trees and low houses behind. A Black man in a black turtleneck, black trousers and black boots stands beside a parked black motorcycle with a round headlight and a red tail light.',
 'neon': 'Cel-shaded animation, dusk after rain. A wide wet commercial road with yellow centre lines and white lane dashes mirroring neon; two-storey shopfronts with glowing pink, yellow and white signs, telephone poles and power lines against a teal sky.',
 'tunnel': 'Cel-shaded animation. A long monochrome grey concrete tunnel with an arched mouth opening onto bright fog; smooth concrete walls and floor, soft diffuse light.',
 'fog': 'Cel-shaded animation. A wide pale grey concrete plaza and road in thick fog; faint grey tower blocks, street lamps and a ramp dissolve into the white haze; flat diffuse light.',
 'lanterns': 'Cel-shaded animation, dusk. A long straight street under a teal sky hung with rows of glowing yellow paper lanterns on wires; dark two- and three-storey shophouses with awnings and lit windows; East and Southeast Asian men and women in teal, green and orange garments stand along both pavements watching.'}
SCN = {'kerb': {'times': [4.0]}, 'neon': {'times': [20.6]}, 'tunnel': {'times': [21.2 + 0.56 * i for i in range(12)]},
       'fog': {'times': [28.2 + 0.66 * i for i in range(12)]}, 'lanterns': {'times': [36.5 + 0.5 * i for i in range(11)] + [43.0, 46.0, 49.0, 52.5]}}
FPS = 6

def st(s):
    p = f'{A}/ride-cel/{s}/state.json'; return json.load(open(p)) if os.path.exists(p) else {}
def save(s, S): json.dump(S, open(f'{A}/ride-cel/{s}/state.json', 'w'), indent=1)

def frames(s):
    D = f'{A}/ride-cel/{s}'; os.makedirs(D + '/frames', exist_ok=True)
    for n, t in enumerate(SCN[s]['times']):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t}', '-i', CLIP, '-frames:v', '1', '-q:v', '2', f'{D}/frames/{n:02d}.jpg'], check=True)

def pose(s):
    D = f'{A}/ride-cel/{s}'; S = st(s); fr = sorted(os.listdir(D + '/frames'))
    if 'frame_assets' not in S: S['frame_assets'] = [wlt.upload(f'{D}/frames/{f}', f'ridecel-{s}-{f}') for f in fr]; save(s, S)
    if 'pose_op' not in S:
        body = {'frames': [{'imageAsset': {'assetId': a}} for a in S['frame_assets']], 'targetResolution': [1280, 720]}
        if len(fr) > 1: body['refinePoses'] = True
        S['pose_op'] = wlt.submit('images2PosedRGBD', body, idem=f'ridecel-{s}-pose-v1'); save(s, S)
    op = wlt.wait(S['pose_op']); json.dump(op, open(D + '/pose_op.json', 'w'), indent=1)
    r = op['response']; print(s, 'pose', op['metadata'].get('state'), 'refined', r.get('poseRefinementAccepted'), len(r['frames']), 'frames')
    os.makedirs(D + '/posed', exist_ok=True)
    for n, f in enumerate(r['frames']):
        wlt.fetch(f['depth']['depthAsset']['url'], f'{D}/posed/{n:02d}_depth.exr'); wlt.fetch(f['depth']['confidenceAsset']['url'], f'{D}/posed/{n:02d}_conf.png'); wlt.fetch(f['imageAsset']['url'], f'{D}/posed/{n:02d}_rgb.jpg')
        print(' ', n, [round(v, 2) for v in f['camera']['extrinsics']['position']], round(f['camera']['intrinsics']['fx']))

def qmul(a, b):
    x1, y1, z1, w1 = a; x2, y2, z2, w2 = b
    return [w1*x2 + x1*w2 + y1*z2 - z1*y2, w1*y2 - x1*z2 + y1*w2 + z1*x2, w1*z2 + x1*y2 - y1*x2 + z1*w2, w1*w2 - x1*x2 - y1*y2 - z1*z2]
def qy(deg): h = math.radians(deg) / 2; return [0, math.sin(h), 0, math.cos(h)]
def rot(q, v):
    x, y, z, w = q; M = np.array([[1-2*(y*y+z*z), 2*(x*y-z*w), 2*(x*z+y*w)], [2*(x*y+z*w), 1-2*(x*x+z*z), 2*(y*z-x*w)], [2*(x*z-y*w), 2*(y*z+x*w), 1-2*(x*x+y*y)]]); return M @ np.asarray(v, float)

def views(s):
    import OpenEXR
    D = f'{A}/ride-cel/{s}'; S = st(s); f0 = json.load(open(D + '/pose_op.json'))['response']['frames'][0]
    cam = f0['camera']; p0 = np.array(cam['extrinsics']['position']); q0 = cam['extrinsics']['quaternion']; K = cam['intrinsics']
    d = OpenEXR.File(f'{D}/posed/00_depth.exr').channels()['Y'].pixels.astype(np.float32)
    fwd = rot(q0, [0, 0, -1]); fwd_h = fwd.copy(); fwd_h[1] = 0; fwd_h /= np.linalg.norm(fwd_h); right = np.cross(fwd_h, [0, 1, 0])
    tg = []
    if s == 'kerb':   # arc around the man and bike: focus = depth at the frame's middle band
        h, w = d.shape; c = d[int(h * .45):int(h * .75), int(w * .3):int(w * .75)]; dist = float(np.nanmedian(c[np.isfinite(c)]))
        focus = p0 + fwd_h * dist; print('kerb focus distance', round(dist, 2))
        for ang in (-36, -24, -12, 12, 24, 36):
            v = p0 - focus; v2 = np.array([math.cos(math.radians(ang)) * v[0] + math.sin(math.radians(ang)) * v[2], v[1], -math.sin(math.radians(ang)) * v[0] + math.cos(math.radians(ang)) * v[2]])
            tg.append((focus + v2, qmul(qy(ang), q0)))
        tg += [(p0 + fwd_h * dist * .3, q0), (p0 - fwd_h * dist * .25 + np.array([0, .25, 0]), q0)]
    else:   # neon: move down the road and look around
        ok = np.isfinite(d) & (d > 0); typ = float(np.nanmedian(d[ok])); step = typ / 3 / 3; print('neon typical depth', round(typ, 2))
        for k, (fw, yaw) in enumerate([(1, 0), (2, 0), (3, 0), (1, 20), (2, -20), (3, 30), (2, -40), (0, 30)]):
            tg.append((p0 + fwd_h * step * fw + right * (0.3 * step if yaw < 0 else -0.3 * step if yaw > 0 else 0), qmul(qy(yaw), q0)))
    tcams = [{'extrinsics': {'position': [float(x) for x in p], 'quaternion': [float(x) for x in q], 'coordinateSystem': 'rub'}, 'intrinsics': K} for p, q in tg]
    ctx = [{'imageAsset': {'assetId': f0['imageAsset']['assetId']}, 'depth': {'depthAsset': {'assetId': f0['depth']['depthAsset']['assetId']}}, 'camera': cam}]
    if 'gen_op' not in S:
        S['gen_op'] = wlt.submit('atlasGenerate', {'contextFrames': ctx, 'targetCameras': tcams, 'returnDepth': True, 'prompt': PROMPT[s]}, idem=f'ridecel-{s}-gen-v1'); save(s, S)
    op = wlt.wait(S['gen_op']); json.dump(op, open(D + '/gen_op.json', 'w'), indent=1)
    r = op['response']; print(s, 'generate', op['metadata'].get('state') if op.get('metadata') else '', len(r['frames']), 'views; prompt used:', (r.get('promptUsed') or '')[:160])
    os.makedirs(D + '/gen', exist_ok=True)
    for n, f in enumerate(r['frames']):
        wlt.fetch(f['imageAsset']['url'], f'{D}/gen/{n:02d}_rgb.jpg')
        if f.get('depth') and f['depth'].get('depthAsset'): wlt.fetch(f['depth']['depthAsset']['url'], f'{D}/gen/{n:02d}_depth.exr')

def gemini_box(jpg, what):
    ctx = ssl.create_default_context(cafile=os.environ.get('SSL_CERT_FILE'))
    q = f'Box {what}. Return JSON list of {{"label": text, "box_2d": [ymin, xmin, ymax, xmax] in 0-1000}}.'
    body = {'contents': [{'parts': [{'inline_data': {'mime_type': 'image/jpeg', 'data': base64.b64encode(open(jpg, 'rb').read()).decode()}}, {'text': q}]}], 'generationConfig': {'temperature': 0, 'responseMimeType': 'application/json'}}
    rq = urllib.request.Request('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent', data=json.dumps(body).encode(), headers={'x-goog-api-key': os.environ['GEMINI_API_KEY'], 'content-type': 'application/json'})
    return json.loads(json.load(urllib.request.urlopen(rq, timeout=150, context=ctx))['candidates'][0]['content']['parts'][0]['text'])

def masks(s):
    """Track the rider and his motorcycle through the tunnel shot (they move with the camera), from Gemini boxes at the first frame."""
    import torch; torch.set_num_threads(2)
    from ultralytics.models.sam import SAM2VideoPredictor
    D = f'{A}/ride-cel/{s}'; os.makedirs(D + '/masks', exist_ok=True); times = SCN[s]['times']
    tmp = tempfile.mkdtemp(); t0 = times[0] - 0.1; t1 = times[-1] + 0.2
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t0}', '-i', CLIP, '-t', f'{t1 - t0}', '-vf', f'fps={FPS},scale=640:360', '-q:v', '2', f'{tmp}/%05d.jpg'], check=True)
    files = sorted(glob.glob(tmp + '/*.jpg'))
    det = gemini_box(files[0], 'the rider (a Black man in black clothes) and, separately, his black motorcycle')
    boxes = [[b['box_2d'][1] * .64, b['box_2d'][0] * .36, b['box_2d'][3] * .64, b['box_2d'][2] * .36] for b in det if len(b.get('box_2d', [])) == 4][:3]
    print('boxes', [b.get('label') for b in det])
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', str(FPS), '-i', f'{tmp}/%05d.jpg', '-c:v', 'libx264', '-crf', '12', '-pix_fmt', 'yuv420p', f'{tmp}/c.mp4'], check=True)
    pred = SAM2VideoPredictor(overrides=dict(conf=0.25, task='segment', mode='predict', imgsz=1024, model=os.path.join(T, 'seg', 'sam2.1_s.pt'), save=False, verbose=False))
    M = {}
    for k, res in enumerate(pred(source=f'{tmp}/c.mp4', bboxes=boxes, stream=True)):
        M[k] = (res.masks.data.cpu().numpy() > 0.5).any(0) if res.masks is not None and len(res.masks.data) else np.zeros((360, 640), bool)
    for n, t in enumerate(times):
        k = min(len(M) - 1, int(round((t - t0) * FPS))); m = cv2.resize(M[k].astype(np.uint8), (1280, 720), interpolation=cv2.INTER_NEAREST)
        m = cv2.dilate(m, np.ones((35, 35), np.uint8)); cv2.imwrite(f'{D}/masks/{n:02d}.png', np.where(m > 0, 0, 255).astype(np.uint8))
    print(s, 'masks', [int((cv2.imread(f'{D}/masks/{n:02d}.png', 0) < 128).sum()) for n in range(len(times))])

def splat(s):
    D = f'{A}/ride-cel/{s}'; S = st(s); pf = []
    po = json.load(open(D + '/pose_op.json'))['response']['frames']
    if os.path.exists(D + '/masks') and 'mask_assets' not in S:
        S['mask_assets'] = [wlt.upload(f'{D}/masks/{n:02d}.png', f'ridecel-{s}-mask-{n:02d}.png') for n in range(len(po))]; save(s, S)
    for n, f in enumerate(po):
        dep = f['depth']['depthAsset']['assetId']
        if os.path.exists(f'{D}/posed/{n:02d}_depth_masked.exr'):   # the draft path ignores maskAsset; masked pixels carry NaN depth instead
            S.setdefault('masked_depth_assets', {})
            if str(n) not in S['masked_depth_assets']: S['masked_depth_assets'][str(n)] = wlt.upload(f'{D}/posed/{n:02d}_depth_masked.exr', f'ridecel-{s}-depthmask-{n:02d}.exr'); save(s, S)
            dep = S['masked_depth_assets'][str(n)]
        e = {'imageAsset': {'assetId': f['imageAsset']['assetId']}, 'depth': {'depthAsset': {'assetId': dep}}, 'camera': f['camera']}
        if S.get('mask_assets'): e['maskAsset'] = {'assetId': S['mask_assets'][n]}
        pf.append(e)
    if os.path.exists(D + '/gen_op.json'):
        keep = S.get('keep_views')
        for n, f in enumerate(json.load(open(D + '/gen_op.json'))['response']['frames']):
            if keep is not None and n not in keep: continue
            if f.get('depth') and f['depth'].get('depthAsset'):
                pf.append({'imageAsset': {'assetId': f['imageAsset']['assetId']}, 'depth': {'depthAsset': {'assetId': f['depth']['depthAsset']['assetId']}}, 'camera': f['camera']})
    ver = 'v2' if S.get('masked_depth_assets') else 'v1'
    if S.get('draft_ver', 'v1' if 'draft_op' in S else None) != ver:
        S['draft_op'] = wlt.submit('posedImages2Splats', {'posedFrames': pf, 'refine': False, 'prompt': PROMPT[s]}, idem=f'ridecel-{s}-draft-{ver}'); S['draft_ver'] = ver; save(s, S)
    op = wlt.wait(S['draft_op'], every=10); json.dump(op, open(D + '/draft_op.json', 'w'), indent=1)
    print(s, 'draft splats', op.get('error') or 'ok', len(pf), 'frames'); wlt.fetch(op['response']['draftSplat']['url'], f'{D}/{s}_draft.spz')
    cams = [{'p': x['camera']['extrinsics']['position'], 'q': x['camera']['extrinsics']['quaternion'], 'fy': x['camera']['intrinsics']['fy'], 'h': x['camera']['intrinsics']['height']} for x in po]
    json.dump(cams, open(D + '/cameras.json', 'w'))

if __name__ == '__main__':
    s = sys.argv[1]; os.makedirs(f'{A}/ride-cel/{s}', exist_ok=True)
    for stage in sys.argv[2:]: globals()[stage](s)
