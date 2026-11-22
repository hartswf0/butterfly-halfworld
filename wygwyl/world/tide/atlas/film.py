"""Render a scene film from Atlas posed RGBD: the world as a lidar point cloud flown along the Genie camera path,
his voice from the take, and the words as he says them. Nothing else on screen.
usage: python atlas/film.py ride-cel   -> atlas/ride-cel/magic-ride-first-half.mp4"""
import json, os, subprocess, sys, math
import numpy as np, cv2, OpenEXR
from PIL import Image, ImageDraw, ImageFont
A = os.path.dirname(os.path.abspath(__file__)); T = os.path.dirname(A)
W, H, FPS = 1280, 720, 24
BLUE = np.array([255, 77, 31], np.float32)   # BGR of #1f4dff, the word-water blue
FELL = ImageFont.truetype(f'{A}/fonts/im-fell-english-latin-400-italic.ttf', 40)

def exr(p):
    ch = OpenEXR.File(p).channels(); return list(ch.values())[0].pixels.astype(np.float32).reshape(H if False else -1, list(ch.values())[0].pixels.shape[1]) if False else list(ch.values())[0].pixels.astype(np.float32)

def R(q):
    x, y, z, w = q
    return np.array([[1-2*(y*y+z*z), 2*(x*y-z*w), 2*(x*z+y*w)], [2*(x*y+z*w), 1-2*(x*x+z*z), 2*(y*z-x*w)], [2*(x*z-y*w), 2*(y*z+x*w), 1-2*(x*x+y*y)]])

def cloud(views, step=2):
    """views: [(rgb path, depth exr path, camera)] -> points (N,3), colours (N,3 BGR)"""
    P, C = [], []
    for rgb, dep, cam in views:
        d = exr(dep); h, w = d.shape; im = cv2.imread(rgb)
        if im.shape[:2] != d.shape: im = cv2.resize(im, (w, h))
        k = cam['intrinsics']; e = cam['extrinsics']
        v, u = np.mgrid[0:h:step, 0:w:step]; z = d[::step, ::step]; ok = np.isfinite(z) & (z > 0) & (z < 120)
        z = z[ok]; X = np.stack([(u[ok] - k['cx']) / k['fx'] * z, -(v[ok] - k['cy']) / k['fy'] * z, -z], 1)
        P.append(X @ R(e['quaternion']).T + np.array(e['position'])); C.append(im[::step, ::step][ok])
    return np.concatenate(P).astype(np.float32), np.concatenate(C).astype(np.float32)

def ramp(h):
    """lidar height ramp: blue ground -> cyan -> green -> yellow -> orange -> red (BGR)"""
    stops = np.array([[255, 40, 10], [255, 190, 0], [80, 230, 40], [0, 230, 255], [0, 140, 255], [40, 40, 230]], np.float32)
    x = np.clip(h, 0, 1) * (len(stops) - 1); i = np.minimum(len(stops) - 2, x.astype(int)); f = (x - i)[:, None]
    return stops[i] * (1 - f) + stops[i + 1] * f

def slerp(a, b, t):
    a = np.array(a, float); b = np.array(b, float); d = np.dot(a, b)
    if d < 0: b, d = -b, -d
    if d > .9995: q = a + t * (b - a); return q / np.linalg.norm(q)
    th = math.acos(d); return (math.sin((1 - t) * th) * a + math.sin(t * th) * b) / math.sin(th)

def path_at(keys, u):
    """keys: [(position, quaternion)] spread evenly over u in [0,1], eased"""
    u = u * u * (3 - 2 * u); n = len(keys)
    if n == 1: return np.array(keys[0][0]), keys[0][1]
    f = u * (n - 1); i = min(n - 2, int(f)); a = f - i
    return np.array(keys[i][0]) * (1 - a) + np.array(keys[i + 1][0]) * a, slerp(keys[i][1], keys[i + 1][1], a)

def project(P, pos, q, K):
    Rm = R(q); Xc = (P - pos) @ Rm; z = -Xc[:, 2]; ok = z > 0.15
    u = K['fx'] * Xc[:, 0] / np.where(ok, z, 1) + K['cx']; v = -K['fy'] * Xc[:, 1] / np.where(ok, z, 1) + K['cy']
    ok &= (u >= 0) & (u < W - 1) & (v >= 0) & (v < H - 1)
    return u[ok].astype(np.int32), v[ok].astype(np.int32), z[ok], ok

def draw(P, col, pos, q, K):
    u, v, z, ok = project(P, pos, q, K); c = col[ok]
    o = np.argsort(-z); u, v, z, c = u[o], v[o], z[o], c[o]
    img = np.zeros((H, W, 3), np.float32); fog = np.clip(1.15 - z / 60, .25, 1)[:, None]; c = c * fog
    img[v, u] = c
    near = z < 4; img[v[near] + 1, u[near]] = c[near]; img[v[near], u[near] + 1] = c[near]; img[v[near] + 1, u[near] + 1] = c[near]
    glow = cv2.GaussianBlur(img, (0, 0), 3) * .9
    return np.clip(img + glow, 0, 255)

def words_layer(lines, t):
    """the line being spoken, word by word as each is said"""
    cur = [l for l in lines if l['t0'] - .05 <= t <= l['t1'] + 1.4]
    lay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    if not cur: return None
    l = cur[-1]; out = min(1, max(0, (l['t1'] + 1.4 - t) / .5))
    shown = [(w, min(1, max(0, (t - wt) / .18))) for w, wt in l['words'] if t >= wt - .01]
    if not shown: return None
    # wrap the full line so the words do not shift as they arrive
    full = [w for w, _ in l['words']]; rows, row = [], []
    for w in full:
        if FELL.getlength(' '.join(row + [w])) > W * .78 and row: rows.append(row); row = []
        row.append(w)
    rows.append(row); d = ImageDraw.Draw(lay); y = H - 70 - 50 * len(rows); k = 0
    for r in rows:
        x = (W - FELL.getlength(' '.join(r))) / 2
        for w in r:
            a = shown[k][1] * out if k < len(shown) else 0
            if a > 0:
                for dx, dy in ((0, 2), (0, 0)):
                    d.text((x + dx, y + dy), w, font=FELL, fill=(0, 0, 0, int(150 * a)) if dy else (244, 246, 255, int(255 * a)))
            x += FELL.getlength(w + ' '); k += 1
        y += 50
    return lay

def ride_cel():
    D = f'{A}/ride-cel'; L = json.load(open(f'{T}/game/poem.json'))['lines']; END = 27.9
    lines = [l for l in L if l['t0'] < END]
    po = lambda s: json.load(open(f'{D}/{s}/pose_op.json'))['response']['frames']
    go = lambda s: json.load(open(f'{D}/{s}/gen_op.json'))['response']['frames']
    kp, kg = po('kerb'), go('kerb'); np_, ng = po('neon'), go('neon'); tp = po('tunnel')
    E = lambda c: (c['extrinsics']['position'], c['extrinsics']['quaternion'])
    scenes = []
    # kerb: the frozen moment, an arc across him and the bike under the one lamp
    v = [(f'{D}/kerb/posed/00_rgb.jpg', f'{D}/kerb/posed/00_depth.exr', kp[0]['camera'])] + [(f'{D}/kerb/gen/{n:02d}_rgb.jpg', f'{D}/kerb/gen/{n:02d}_depth.exr', kg[n]['camera']) for n in range(1, 8)]
    scenes.append({'t0': 0, 't1': 13.04, 'cloud': cloud(v), 'K': kp[0]['camera']['intrinsics'], 'keys': [E(kg[1]['camera']), E(kg[2]['camera']), E(kp[0]['camera']), E(kg[3]['camera']), E(kg[4]['camera'])]})
    v = [(f'{D}/neon/posed/00_rgb.jpg', f'{D}/neon/posed/00_depth.exr', np_[0]['camera'])] + [(f'{D}/neon/gen/{n:02d}_rgb.jpg', f'{D}/neon/gen/{n:02d}_depth.exr', ng[n]['camera']) for n in range(8)]
    scenes.append({'t0': 13.04, 't1': 20.92, 'cloud': cloud(v), 'K': np_[0]['camera']['intrinsics'], 'keys': [E(np_[0]['camera']), E(ng[0]['camera']), E(ng[1]['camera']), E(ng[2]['camera'])]})
    v = [(f'{D}/tunnel/posed/{n:02d}_rgb.jpg', f'{D}/tunnel/posed/{n:02d}_depth_masked.exr', tp[n]['camera']) for n in range(12)]
    scenes.append({'t0': 20.92, 't1': END, 'cloud': cloud(v), 'K': tp[0]['camera']['intrinsics'], 'keys': [E(tp[n]['camera']) for n in range(3, 12)]})
    for s in scenes:
        P, C = s['cloud']; y = P[:, 1]; g, top = np.percentile(y, 1), np.percentile(y, 99)
        lum = (C.mean(1) / 255)[:, None]; s['col'] = ramp((y - g) / (top - g)) * (.45 + .75 * lum); print('points', len(P))
    out = f'{D}/magic-ride-first-half.mp4'
    ff = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                           '-ss', '0', '-t', f'{END}', '-i', f'{T}/full/out/10ride-cel-1122-0129/film.mp4', '-map', '0:v', '-map', '1:a',
                           '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', out], stdin=subprocess.PIPE)
    for n in range(int(END * FPS)):
        t = n / FPS; s = next(x for x in scenes if x['t0'] <= t < x['t1'] or x is scenes[-1])
        u = (t - s['t0']) / (s['t1'] - s['t0']); pos, q = path_at(s['keys'], min(1, max(0, u)))
        img = draw(s['cloud'][0], s['col'], pos, q, s['K'])
        # between places the world drains to blue and fills again
        e = min(t - s['t0'], s['t1'] - t); w = 0 if e > .6 else (1 - e / .6) ** 1.5
        if s is scenes[0] and t < 1: w = max(w, 1 - t)
        if w > 0: img = img * (1 - w) + (BLUE * (.35 + .65 * w)) * w * (img.mean(2, keepdims=True) / 255 * .6 + .4)
        fr = Image.fromarray(img.astype(np.uint8)[..., ::-1]).convert('RGBA'); lay = words_layer(lines, t)
        if lay: fr.alpha_composite(lay)
        ff.stdin.write(np.array(fr.convert('RGB'))[..., ::-1].tobytes())
        if n % 96 == 0: print(f'{t:5.1f}s', flush=True)
    ff.stdin.close(); ff.wait(); print('wrote', out)

if __name__ == '__main__':
    globals()[sys.argv[1].replace('-', '_')]()
