"""Prepare the arcade walk (litmus/out/street-091.mp4) for Atlas.
Frames: 18 stills across the walk-in (0-12 s) and the turn (12-19.4 s), with the burned-in caption strip cropped off
(1194x672 centred, which keeps 16:9), scaled to Atlas's 1280x720 grid.
Masks: the walking man (Black man, black long-sleeved shirt, black trousers) tracked through the whole take with SAM 2.1
from his box at 6 s; each mask is dilated and written as Atlas's maskAsset convention (255 kept, 0 excluded)."""
import os, subprocess, tempfile, glob, json
import cv2, numpy as np, torch
T = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); OUT = os.path.join(T, 'atlas', 'arcade')
CLIP = os.path.join(T, 'litmus/out/street-091.mp4')
TIMES = [0.2, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13.4, 14.8, 16.2, 17.6, 19.2]
CROP = 'crop=1194:672:43:0'
FPS = 6; READ_T = 6.0; BOX = [0.4251, 0.3875, 0.1171, 0.6125]   # the man at 6 s, from seg/segments.json (street-091-00), full-frame coords
torch.set_num_threads(2)
os.makedirs(OUT + '/frames', exist_ok=True); os.makedirs(OUT + '/masks', exist_ok=True)
for n, t in enumerate(TIMES):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t}', '-i', CLIP, '-frames:v', '1', '-vf', f'{CROP},scale=1280:720:flags=lanczos', '-q:v', '2', f'{OUT}/frames/{n:02d}.jpg'], check=True)
# track the man at 6 fps on the same crop, half size
tmp = tempfile.mkdtemp()
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', CLIP, '-vf', f'fps={FPS},{CROP},scale=640:360', '-q:v', '2', f'{tmp}/%05d.jpg'], check=True)
files = sorted(glob.glob(tmp + '/*.jpg')); N = len(files); r = int(round(READ_T * FPS))
# box from full-frame coords to crop coords at 640x360
x0 = (BOX[0] * 1280 - 43) / 1194 * 640; y0 = BOX[1] * 720 / 672 * 360; x1 = ((BOX[0] + BOX[2]) * 1280 - 43) / 1194 * 640; y1 = min(360, (BOX[1] + BOX[3]) * 720 / 672 * 360)
from ultralytics.models.sam import SAM2VideoPredictor
pred = SAM2VideoPredictor(overrides=dict(conf=0.25, task='segment', mode='predict', imgsz=1024, model=os.path.join(T, 'seg', 'sam2.1_s.pt'), save=False, verbose=False))
masks = {}
for name, idx in (('fw', list(range(r, N))), ('bw', list(range(r, -1, -1)))):
    d = f'{tmp}/{name}'; os.makedirs(d)
    for k, i in enumerate(idx): os.link(files[i], f'{d}/{k:05d}.jpg')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', str(FPS), '-i', f'{d}/%05d.jpg', '-c:v', 'libx264', '-crf', '12', '-pix_fmt', 'yuv420p', f'{d}.mp4'], check=True)
    for k, res in enumerate(pred(source=f'{d}.mp4', bboxes=[[x0, y0, x1, y1]], stream=True)):
        masks[idx[k]] = (res.masks.data[0].cpu().numpy() > 0.5) if res.masks is not None and len(res.masks.data) else np.zeros((360, 640), bool)
info = []
for n, t in enumerate(TIMES):
    fi = min(N - 1, int(round(t * FPS))); m = masks.get(fi, np.zeros((360, 640), bool)).astype(np.uint8)
    m = cv2.resize(m, (1280, 720), interpolation=cv2.INTER_NEAREST); m = cv2.dilate(m, np.ones((25, 25), np.uint8))
    cv2.imwrite(f'{OUT}/masks/{n:02d}.png', np.where(m > 0, 0, 255).astype(np.uint8))
    info.append({'n': n, 't': t, 'man_px': int(m.sum())})
json.dump({'clip': 'litmus/out/street-091.mp4', 'crop': CROP, 'times': TIMES, 'frames': info}, open(f'{OUT}/prep.json', 'w'), indent=1)
print(json.dumps(info))
