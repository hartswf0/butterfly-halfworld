"""Lift the Sapiens2 bodies of a take into Atlas's 3D world.
For each frame: every keypoint reads Atlas's depth under it (the unmasked depth, which still holds the person), robustly
(a window median, kept within a body's thickness of the person's own depth), and is unprojected through that frame's
camera (RUB, camera-to-world). People are given ids that carry from frame to frame within a shot.
usage: python atlas/lift3d.py takes/01grey-grey-1123-0423   -> bodies3d.json"""
import json, os, sys
import numpy as np, OpenEXR
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), sys.argv[1])
B = json.load(open(f'{D}/bodies.json'))
def R(q):
    x, y, z, w = q
    return np.array([[1-2*(y*y+z*z), 2*(x*y-z*w), 2*(x*z+y*w)], [2*(x*y+z*w), 1-2*(x*x+z*z), 2*(y*z-x*w)], [2*(x*z-y*w), 2*(y*z+x*w), 1-2*(x*x+y*y)]])
out = {}
for sd in sorted(d for d in os.listdir(D) if d.startswith('s') and os.path.isdir(f'{D}/{d}')):
    fr = json.load(open(f'{D}/{sd}/pose_op.json'))['response']['frames']; ts = json.load(open(f'{D}/{sd}/times.json'))
    prev = []; nid = 0; shot = []
    for k, f in enumerate(fr):
        dep = OpenEXR.File(f'{D}/{sd}/posed/{k:02d}_depth.exr').channels()['Y'].pixels.astype(np.float32); H, W = dep.shape
        K = f['camera']['intrinsics']; e = f['camera']['extrinsics']; Rw = R(e['quaternion']); tw = np.array(e['position'])
        people = []
        for p in B.get(f'{sd}/{k:02d}', []):
            kp = np.array(p['kp']); sc = np.array(p['sc']); ok = sc > .3
            if (ok[:21]).sum() < 6: continue
            z = np.full(len(kp), np.nan)
            for i in np.where(ok)[0]:
                u, v = int(round(kp[i, 0])), int(round(kp[i, 1]))
                win = dep[max(0, v - 3):v + 4, max(0, u - 3):u + 4]; win = win[np.isfinite(win) & (win > 0)]
                if win.size: z[i] = np.median(win)
            torso = z[[5, 6, 9, 10]][np.isfinite(z[[5, 6, 9, 10]])]; body = z[:21][np.isfinite(z[:21])]
            if body.size < 4: continue
            ref = float(np.median(torso)) if torso.size >= 2 else float(np.median(body))
            # a body is thin: every joint stays within a hand's depth of the torso (feet otherwise read the ground behind them)
            z = np.where(np.isfinite(z), ref + np.clip(z - ref, -.25, .25), ref)
            X = np.stack([(kp[:, 0] - K['cx']) / K['fx'] * z, -(kp[:, 1] - K['cy']) / K['fy'] * z, -z], 1) @ Rw.T + tw
            cen = X[[5, 6, 9, 10]].mean(0)
            people.append({'c': cen, 'X': X, 'ok': ok})
        # carry ids: nearest torso centre in the previous frame, within 1.2 m
        used = set()
        for p in people:
            best = min(((np.linalg.norm(q['c'] - p['c']), q['id']) for q in prev if q['id'] not in used), default=(9e9, None))
            if best[0] < 1.2: p['id'] = best[1]; used.add(best[1])
            else: p['id'] = nid; nid += 1
        prev = people
        shot.append({'t': round(ts[k], 3), 'people': [{'id': p['id'], 'X': np.round(p['X'], 3).tolist(), 'ok': p['ok'].astype(int).tolist()} for p in people]})
    out[sd] = shot; print(sd, sum(len(s['people']) for s in shot), 'bodies over', len(shot), 'frames,', nid, 'people', flush=True)
json.dump(out, open(f'{D}/bodies3d.json', 'w'), separators=(',', ':'))
