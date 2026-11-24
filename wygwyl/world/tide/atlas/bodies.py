"""Sapiens2 (Meta) whole-body pose for the people cut out of a take: 308 keypoints per person per frame.
People come from the take's masks (shrunk back so neighbours separate), boxes as COCO x, y, w, h.
usage: python atlas/bodies.py takes/01grey-grey-1123-0423   -> bodies.json beside the shots"""
import json, os, sys, time
import numpy as np, cv2, torch
from PIL import Image
from transformers import AutoImageProcessor, Sapiens2ForPoseEstimation
torch.set_num_threads(int(os.environ.get('SAP_THREADS', '3')))
# the Mac's GPU (Apple silicon, Metal) when there is one, else CUDA, else the CPU
DEV = 'mps' if torch.backends.mps.is_available() else 'cuda' if torch.cuda.is_available() else 'cpu'
print('device', DEV, flush=True)
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), sys.argv[1]) if not sys.argv[1].startswith('/') else sys.argv[1]
if not os.path.isdir(D): sys.exit(f'no such take: {D}')
NAME = 'facebook/sapiens2-pose-0.4b'; pp = AutoImageProcessor.from_pretrained(NAME); m = Sapiens2ForPoseEstimation.from_pretrained(NAME).eval().to(DEV)
def people(mask):
    m_ = cv2.erode((cv2.imread(mask, 0) < 128).astype(np.uint8), np.ones((27, 27), np.uint8))
    _, _, st, _ = cv2.connectedComponentsWithStats(m_)
    return [[float(max(0, x - 10)), float(max(0, y - 10)), float(w + 20), float(h + 20)] for x, y, w, h, a in st[1:] if a > 400 and h > 40]
out_p = f'{D}/bodies.json' if not os.environ.get('REDO') else f'{D}/bodies.json'; out = json.load(open(out_p)) if os.path.exists(out_p) else {}
for sd in sorted(d for d in os.listdir(D) if d.startswith('s') and os.path.isdir(f'{D}/{d}')):
    KF = [int(x) for x in os.environ.get('KF', '').split(',') if x]   # track only these frames of each shot (the viewer blends between them)
    for k in range(len(os.listdir(f'{D}/{sd}/frames'))):
        if KF and k not in KF: continue
        key = f'{sd}/{k:02d}'
        weak = key in out and out[key] and max(max(p['sc'][:21]) for p in out[key]) < .3   # tracked, but every body too dark to read
        if key in out and not weak: continue
        bf = f'{D}/{sd}/boxes.json'
        if os.path.exists(bf):   # every person Gemini found, as COCO x, y, w, h with a small margin
            bx = [[max(0, b[1] * 1.28 - 8), max(0, b[0] * .72 - 8), (b[3] - b[1]) * 1.28 + 16, (b[2] - b[0]) * .72 + 16] for b in json.load(open(bf)).get(f'{k:02d}', []) if (b[2] - b[0]) * .72 > 25]
        else: bx = people(f'{D}/{sd}/masks/{k:02d}.png')
        t = time.time(); res = []
        if bx:
            with torch.inference_mode():
                im = Image.open(f'{D}/{sd}/frames/{k:02d}.jpg').convert('RGB')
                a = np.asarray(im).astype(np.float32)
                if a.mean() < 70:   # night and dim rooms: lift the shadows so the dark figures' joints can be read (boxes and keypoints keep the same pixels)
                    a = 255 * (a / 255) ** .45; lab = cv2.cvtColor(np.clip(a, 0, 255).astype(np.uint8), cv2.COLOR_RGB2LAB)
                    lab[..., 0] = cv2.createCLAHE(2.5, (8, 8)).apply(lab[..., 0]); im = Image.fromarray(cv2.cvtColor(lab, cv2.COLOR_LAB2RGB))
                inp = pp(im, boxes=[bx], return_tensors='pt')
                o = m(**{kk: v.to(DEV) if hasattr(v, 'to') else v for kk, v in inp.items()})
                if DEV != 'cpu': o.heatmaps = o.heatmaps.float().cpu()
                for p in pp.post_process_pose_estimation(o, boxes=[bx])[0]:
                    res.append({'bbox': [round(v, 1) for v in p['bbox'].tolist()], 'kp': np.round(p['keypoints'].numpy(), 1).tolist(), 'sc': np.round(p['scores'].numpy(), 3).tolist()})
        out[key] = res; json.dump(out, open(out_p, 'w'))
        print(key, len(res), 'people', round(time.time() - t, 1), 's', flush=True)
print('DONE', len(out), 'frames', sum(len(v) for v in out.values()), 'bodies')
