"""Render seg/film/<take>.mp4: the take with its tracked cut-outs.
Top: the take, each tracked mask tinted and outlined (subject in its ask's verdict colour, figures in blue), labelled.
Bottom: only the cut-outs, on blue water; outside an ask's 4-second window the frame dims to the water.
Masks are rebuilt from each object's sprite strip and union box (the DATA_CONTRACT files), held between the 6 fps samples."""
import glob, json, os, subprocess, sys
import cv2, numpy as np
S = os.path.dirname(os.path.abspath(__file__)); T = os.path.dirname(S)
W, H = 854, 480
VC = {'yes': (106, 227, 25), 'partly': (0, 212, 255), 'no': (42, 42, 255)}; FIG = (255, 155, 127)   # BGR
seg = {}
for f in sorted(glob.glob(S + '/segments*.json')): seg.update(json.load(open(f)))
takes = {}
for i, r in seg.items(): takes.setdefault(r['take'], []).append((i, r))
only = sys.argv[1:]
os.makedirs(S + '/film', exist_ok=True)

def masks_for(i, r):
    """{frame index: [(mask HxW bool, colour, label, role)]} at render resolution."""
    out = {}
    for o in r['objects']:
        sp = cv2.imread(os.path.join(T, o['sprite']), cv2.IMREAD_UNCHANGED)
        if sp is None: continue
        ux, uy, uw, uh = o['union']; X0, Y0 = int(ux * W), int(uy * H); cw, ch = max(1, int(uw * W)), max(1, int(uh * H))
        col = VC.get(r['happened'], (244, 246, 255)) if o['role'] == 'reading' else FIG
        for fi in range(r['frames']):
            a = sp[:, fi * o['sw']:(fi + 1) * o['sw'], 3]
            if a.size == 0 or a.max() == 0: continue
            m = np.zeros((H, W), bool); a = cv2.resize(a, (cw, ch)) > 127
            m[Y0:Y0 + ch, X0:X0 + cw] = a[:H - Y0, :W - X0]
            out.setdefault(fi, []).append((m, col, o['label'], o['role']))
    return out

def water(n):
    y = np.linspace(0, 1, H)[:, None]; x = np.linspace(0, 1, W)[None, :]
    w = 0.5 + 0.5 * np.sin(x * 40 + n * 0.15 + np.sin(y * 9 + n * 0.05) * 3)
    b = np.dstack([90 + 70 * w * (1 - y * .5), 30 + 25 * w, 8 + 0 * w]).astype(np.uint8); return b

for take, rows in sorted(takes.items()):
    if only and take not in only: continue
    rows = sorted(rows, key=lambda x: x[1]['t']); film = os.path.join(T, rows[0][1]['film'])
    cap = cv2.VideoCapture(film); fps = cap.get(cv2.CAP_PROP_FPS) or 24
    M = [(r, masks_for(i, r)) for i, r in rows]
    dst = os.path.join(S, 'film', take + '.mp4')
    ff = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H * 2}', '-r', f'{fps}', '-i', '-',
                           '-i', film, '-map', '0:v', '-map', '1:a?', '-shortest', '-c:v', 'libx264', '-crf', '23', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', dst], stdin=subprocess.PIPE)
    n = 0
    while True:
        ok, fr = cap.read()
        if not ok: break
        t = n / fps; fr = cv2.resize(fr, (W, H)); top = fr.copy(); bot = water(n); act = None
        for r, mk in M:
            fi = int((t - r['t0']) * r['fps'])
            if 0 <= fi < r['frames']: act = (r, mk.get(fi, []))
        if act:
            r, ms = act
            for m, col, lab, role in ms[::-1]:
                top[m] = (top[m] * .55 + np.array(col) * .45).astype(np.uint8)
                cs, _ = cv2.findContours(m.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                cv2.drawContours(top, cs, -1, col, 2)
                bot[m] = fr[m]
                ys, xs = np.where(m)
                if len(xs):
                    (tw, th), _ = cv2.getTextSize(lab, cv2.FONT_HERSHEY_SIMPLEX, .45, 1); x0, y0 = int(xs.min()), max(14, int(ys.min()))
                    cv2.rectangle(top, (x0, y0 - 16), (x0 + tw + 8, y0), col, -1); cv2.putText(top, lab, (x0 + 4, y0 - 4), cv2.FONT_HERSHEY_SIMPLEX, .45, (0, 0, 0), 1, cv2.LINE_AA)
            cap_txt = f"{r['t']:.1f}s  {r['happened'] or '-'}  " + r['claim'][:92]
            cv2.rectangle(bot, (0, H - 30), (W, H), (0, 0, 0), -1); cv2.putText(bot, cap_txt, (10, H - 10), cv2.FONT_HERSHEY_SIMPLEX, .42, VC.get(r['happened'], (244, 246, 255)), 1, cv2.LINE_AA)
        else:
            cv2.putText(bot, 'between asks', (10, H - 10), cv2.FONT_HERSHEY_SIMPLEX, .42, (200, 170, 120), 1, cv2.LINE_AA)
        ff.stdin.write(np.vstack([top, bot]).tobytes()); n += 1
    ff.stdin.close(); ff.wait(); print('wrote', dst, n, 'frames', flush=True)
