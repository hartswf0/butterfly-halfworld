"""A Genie grey-box take -> Atlas LiDAR film. Each shot is its own place (the take cuts between shots).
  prep : 10 frames per shot; Gemini boxes every person, SAM 2.1 cuts them; masks are written into depth later (no geometry)
  pose : Atlas images2PosedRGBD per shot (cameras + depth), people masked out as NaN depth
  film : the shots as LiDAR point clouds flown along their own cameras, the take's sound, his words as he says them
usage: GEMINI_API_KEY=... python atlas/take_lidar.py full/out/01grey-grey-1123-0423 prep pose film"""
import base64, json, os, ssl, subprocess, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor
import numpy as np, cv2
A = os.path.dirname(os.path.abspath(__file__)); T = os.path.dirname(A); sys.path.insert(0, A)
import wlt
N = 10
CTX = ssl.create_default_context(cafile=os.environ.get('SSL_CERT_FILE'))

def boxes(jpg):
    q = 'Box every person in this frame, each separately, however small. JSON list of {"label": "person", "box_2d": [ymin, xmin, ymax, xmax] in 0-1000}. Empty list if none.'
    body = {'contents': [{'parts': [{'inline_data': {'mime_type': 'image/jpeg', 'data': base64.b64encode(open(jpg, 'rb').read()).decode()}}, {'text': q}]}],
            'generationConfig': {'temperature': 0, 'responseMimeType': 'application/json'}}
    for m in ('gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.8-flash'):
        try:
            rq = urllib.request.Request(f'https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent', data=json.dumps(body).encode(),
                                        headers={'x-goog-api-key': os.environ['GEMINI_API_KEY'], 'content-type': 'application/json'})
            out = json.loads(json.load(urllib.request.urlopen(rq, timeout=150, context=CTX))['candidates'][0]['content']['parts'][0]['text'])
            return [b['box_2d'] for b in out if isinstance(b, dict) and len(b.get('box_2d', [])) == 4]
        except Exception: pass
    return []

def prep(take, D, man):
    from ultralytics.models.sam import SAM
    sam = SAM(os.path.join(T, 'seg', 'sam2.1_s.pt')); film = os.path.join(T, take, 'film.mp4')
    jobs = []
    for s in man['shots']:
        d = f"{D}/s{s['shot']}"; os.makedirs(f'{d}/frames', exist_ok=True); os.makedirs(f'{d}/masks', exist_ok=True)
        ts = [s['t0'] + .35 + (s['seconds'] - .7) * k / (N - 1) for k in range(N)]; json.dump(ts, open(f'{d}/times.json', 'w'))
        for k, t in enumerate(ts):
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t:.3f}', '-i', film, '-frames:v', '1', '-vf', 'scale=1280:720', '-q:v', '2', f'{d}/frames/{k:02d}.jpg'], check=True)
            jobs.append((d, k))
    with ThreadPoolExecutor(8) as ex: B = list(ex.map(lambda j: boxes(f'{j[0]}/frames/{j[1]:02d}.jpg'), jobs))
    for (d, k), bx in zip(jobs, B):
        m = np.zeros((720, 1280), bool)
        if bx:
            bb = [[b[1] * 1.28, b[0] * .72, b[3] * 1.28, b[2] * .72] for b in bx]
            r = sam(f'{d}/frames/{k:02d}.jpg', bboxes=bb, verbose=False)[0]
            if r.masks is not None: m = (r.masks.data.cpu().numpy() > .5).any(0)
        m = cv2.dilate(m.astype(np.uint8), np.ones((25, 25), np.uint8)) > 0
        cv2.imwrite(f'{d}/masks/{k:02d}.png', np.where(m, 0, 255).astype(np.uint8))
    print('prep', len(jobs), 'frames;', sum(1 for b in B if b), 'with people', flush=True)

def pose(take, D, man):
    import OpenEXR
    def one(s):
        d = f"{D}/s{s['shot']}"; st = f'{d}/state.json'; S = json.load(open(st)) if os.path.exists(st) else {}
        if 'frames' not in S: S['frames'] = [wlt.upload(f'{d}/frames/{k:02d}.jpg', f"{os.path.basename(take)}-s{s['shot']}-{k:02d}.jpg") for k in range(N)]; json.dump(S, open(st, 'w'))
        if 'op' not in S:
            S['op'] = wlt.submit('images2PosedRGBD', {'frames': [{'imageAsset': {'assetId': a}} for a in S['frames']], 'targetResolution': [1280, 720], 'refinePoses': True}, idem=f"{os.path.basename(take)}-s{s['shot']}-pose-v1"); json.dump(S, open(st, 'w'))
        op = wlt.wait(S['op']); json.dump(op, open(f'{d}/pose_op.json', 'w')); os.makedirs(f'{d}/posed', exist_ok=True)
        for k, f in enumerate(op['response']['frames']):
            wlt.fetch(f['depth']['depthAsset']['url'], f'{d}/posed/{k:02d}_depth.exr'); wlt.fetch(f['depth']['confidenceAsset']['url'], f'{d}/posed/{k:02d}_conf.png'); wlt.fetch(f['imageAsset']['url'], f'{d}/posed/{k:02d}_rgb.jpg')
            ex = OpenEXR.File(f'{d}/posed/{k:02d}_depth.exr'); dep = ex.channels()['Y'].pixels.copy()
            mk = cv2.resize(cv2.imread(f'{d}/masks/{k:02d}.png', 0), (dep.shape[1], dep.shape[0]), interpolation=cv2.INTER_NEAREST) < 128
            dep[mk] = np.nan; OpenEXR.File(ex.header(), {'Y': dep}).write(f'{d}/posed/{k:02d}_depth_masked.exr')
        p = [f['camera']['extrinsics']['position'] for f in op['response']['frames']]
        return s['shot'], op['metadata'].get('state'), op['response'].get('poseRefinementAccepted'), round(float(np.linalg.norm(np.array(p[-1]) - np.array(p[0]))), 2)
    with ThreadPoolExecutor(4) as ex:
        for r in ex.map(one, man['shots']): print('pose shot %s %s refined=%s travel=%sm' % r, flush=True)

def film(take, D, man):
    import film as F
    from PIL import Image
    P = json.load(open(f'{T}/tide.json'))['poems'][int(man['poem']) - 1]
    lines = [{'t0': l['t0'], 't1': l['t1'], 'words': [[w[0], w[1]] for w in l['words']]} for l in P['lines']]
    places = []
    for s in man['shots']:
        d = f"{D}/s{s['shot']}"; fr = json.load(open(f'{d}/pose_op.json'))['response']['frames']; ts = json.load(open(f'{d}/times.json'))
        P_, C = F.cloud([(f'{d}/posed/{k:02d}_rgb.jpg', f'{d}/posed/{k:02d}_depth_masked.exr', f['camera']) for k, f in enumerate(fr)])
        y = P_[:, 1]; g, top = np.percentile(y, 1), np.percentile(y, 99); col = F.ramp((y - g) / max(1e-3, top - g)) * (.45 + .75 * (C.mean(1) / 255)[:, None])
        places.append({'t0': s['t0'], 't1': s['t0'] + s['seconds'], 'P': P_, 'col': col, 'K': fr[0]['camera']['intrinsics'], 'ts': ts,
                       'keys': [(f['camera']['extrinsics']['position'], f['camera']['extrinsics']['quaternion']) for f in fr]})
        print('cloud shot', s['shot'], len(P_), flush=True)
    END = places[-1]['t1']; out = f'{D}/lidar.mp4'; W, H, FPS = F.W, F.H, F.FPS
    ff = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-i', os.path.join(T, take, 'film.mp4'),
                           '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-crf', '27', '-preset', 'slow', '-tune', 'grain', '-movflags', '+faststart', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', out], stdin=subprocess.PIPE)
    for n in range(int(END * FPS)):
        t = n / FPS; s = next((p for p in places if p['t0'] <= t < p['t1']), places[-1]); ts = s['ts']
        i = max(0, min(len(ts) - 2, int(np.searchsorted(ts, t) - 1))); a = min(1, max(0, (t - ts[i]) / (ts[i + 1] - ts[i]))); a = a * a * (3 - 2 * a)
        pos = np.array(s['keys'][i][0]) * (1 - a) + np.array(s['keys'][i + 1][0]) * a; q = F.slerp(s['keys'][i][1], s['keys'][i + 1][1], a)
        img = F.draw(s['P'], s['col'], pos, q, s['K'])
        e = min(t - s['t0'], s['t1'] - t); w = 0 if e > .45 else (1 - e / .45) ** 1.5
        if w > 0: img = img * (1 - w) + (F.BLUE * (.35 + .65 * w)) * w * (img.mean(2, keepdims=True) / 255 * .6 + .4)
        fr = Image.fromarray(img.astype(np.uint8)[..., ::-1]).convert('RGBA'); lay = F.words_layer(lines, t)
        if lay: fr.alpha_composite(lay)
        ff.stdin.write(np.array(fr.convert('RGB'))[..., ::-1].tobytes())
    ff.stdin.close(); ff.wait(); print('wrote', out, os.path.getsize(out) // 1_000_000, 'MB', flush=True)

if __name__ == '__main__':
    take = sys.argv[1].rstrip('/'); man = json.load(open(os.path.join(T, take, 'manifest.json')))
    D = f'{A}/takes/{os.path.basename(take)}'; os.makedirs(D, exist_ok=True)
    for st in sys.argv[2:]: globals()[st](take, D, man)
