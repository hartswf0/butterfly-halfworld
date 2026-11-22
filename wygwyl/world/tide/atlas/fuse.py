"""Fuse Atlas posed RGBD frames into one coloured point cloud (PLY) and render a top-down and an oblique check image.
RUB cameras look along local -Z; depth is linear z-depth on the camera grid; quaternions are XYZW, camera-to-world."""
import json, os, sys, numpy as np, cv2, OpenEXR
D = sys.argv[1]; MASKS = len(sys.argv) > 2 and sys.argv[2] == '--masks'
op = json.load(open(D + '/pose_op.json'))['response']['frames']
def R(q):
    x, y, z, w = q
    return np.array([[1-2*(y*y+z*z), 2*(x*y-z*w), 2*(x*z+y*w)], [2*(x*y+z*w), 1-2*(x*x+z*z), 2*(y*z-x*w)], [2*(x*z-y*w), 2*(y*z+x*w), 1-2*(x*x+y*y)]])
P, C, cams = [], [], []
for n, f in enumerate(op):
    d = OpenEXR.File(f'{D}/posed/{n:02d}_depth.exr').channels()['Y'].pixels.astype(np.float32)
    rgb = cv2.imread(f'{D}/posed/{n:02d}_rgb.jpg')[..., ::-1]; conf = cv2.imread(f'{D}/posed/{n:02d}_conf.png', 0)
    k = f['camera']['intrinsics']; e = f['camera']['extrinsics']; h, w = d.shape
    if rgb.shape[:2] != d.shape: rgb = cv2.resize(rgb, (w, h))
    keep = np.isfinite(d) & (d > 0) & (conf > 128)
    if MASKS and os.path.exists(f'{D}/masks/{n:02d}.png'): keep &= cv2.resize(cv2.imread(f'{D}/masks/{n:02d}.png', 0), (w, h)) > 127
    v, u = np.mgrid[0:h, 0:w]; s = keep & ((u % 3 == 0) & (v % 3 == 0))
    z = d[s]; X = np.stack([(u[s] - k['cx']) / k['fx'] * z, -(v[s] - k['cy']) / k['fy'] * z, -z], 1)
    Rw = R(e['quaternion']); t = np.array(e['position']); P.append(X @ Rw.T + t); C.append(rgb[s]); cams.append((t, Rw))
P = np.concatenate(P); C = np.concatenate(C); print('points', len(P))
with open(D + '/cloud.ply', 'wb') as fh:
    fh.write(f'ply\nformat binary_little_endian 1.0\nelement vertex {len(P)}\nproperty float x\nproperty float y\nproperty float z\nproperty uchar red\nproperty uchar green\nproperty uchar blue\nend_header\n'.encode())
    a = np.zeros(len(P), dtype=[('x', '<f4'), ('y', '<f4'), ('z', '<f4'), ('r', 'u1'), ('g', 'u1'), ('b', 'u1')]); a['x'], a['y'], a['z'] = P.T; a['r'], a['g'], a['b'] = C.T; fh.write(a.tobytes())
def splat(view, name, W=1200, H=800):
    Q = P @ view.T; lo, hi = np.percentile(Q[:, :2], [2, 98], 0); sc = min(W / (hi[0] - lo[0]), H / (hi[1] - lo[1])) * .9
    px = ((Q[:, 0] - lo[0]) * sc + (W - (hi[0] - lo[0]) * sc) / 2).astype(int); py = (H - ((Q[:, 1] - lo[1]) * sc + (H - (hi[1] - lo[1]) * sc) / 2)).astype(int)
    o = np.argsort(Q[:, 2]); img = np.zeros((H, W, 3), np.uint8); ok = (px[o] >= 0) & (px[o] < W) & (py[o] >= 0) & (py[o] < H)
    img[py[o][ok], px[o][ok]] = C[o][ok][:, ::-1]
    for t, Rw in cams:
        q = view @ t; cx, cy = int((q[0] - lo[0]) * sc + (W - (hi[0] - lo[0]) * sc) / 2), int(H - ((q[1] - lo[1]) * sc + (H - (hi[1] - lo[1]) * sc) / 2))
        f = view @ (Rw @ np.array([0, 0, -1.0])); cv2.circle(img, (cx, cy), 5, (0, 255, 255), -1); cv2.line(img, (cx, cy), (int(cx + f[0] * 25), int(cy - f[1] * 25)), (0, 255, 255), 2)
    cv2.imwrite(f'{D}/{name}.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 85])
top = np.array([[1, 0, 0], [0, 0, -1], [0, -1, 0.]])   # look down: x right, -z up, depth = -y
a = np.radians(35); obl = np.array([[0, 0, -1], [np.sin(a), np.cos(a), 0], [np.cos(a), -np.sin(a), 0]]) @ np.array([[1, 0, 0], [0, 1, 0], [0, 0, 1.]])
splat(top, 'check_top'); splat(np.array([[0, 0, 1.], [0, 1, 0], [-1, 0, 0]]), 'check_side')
