"""Sapiens2 (Meta) whole-body pose for the people cut out of a take: 308 keypoints per person per frame.
People come from the take's masks (shrunk back so neighbours separate), boxes as COCO x, y, w, h.
usage: python atlas/bodies.py takes/01grey-grey-1123-0423   -> bodies.json beside the shots"""
import json, os, sys, time
import numpy as np, cv2, torch
from PIL import Image
from transformers import AutoImageProcessor, Sapiens2ForPoseEstimation
torch.set_num_threads(int(os.environ.get('SAP_THREADS', '3')))
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), sys.argv[1]) if not sys.argv[1].startswith('/') else sys.argv[1]
NAME = 'facebook/sapiens2-pose-0.4b'; pp = AutoImageProcessor.from_pretrained(NAME); m = Sapiens2ForPoseEstimation.from_pretrained(NAME).eval()
def people(mask):
    m_ = cv2.erode((cv2.imread(mask, 0) < 128).astype(np.uint8), np.ones((27, 27), np.uint8))
    _, _, st, _ = cv2.connectedComponentsWithStats(m_)
    return [[float(max(0, x - 10)), float(max(0, y - 10)), float(w + 20), float(h + 20)] for x, y, w, h, a in st[1:] if a > 400 and h > 40]
out_p = f'{D}/bodies.json'; out = json.load(open(out_p)) if os.path.exists(out_p) else {}
for sd in sorted(d for d in os.listdir(D) if d.startswith('s') and os.path.isdir(f'{D}/{d}')):
    for k in range(len(os.listdir(f'{D}/{sd}/frames'))):
        key = f'{sd}/{k:02d}'
        if key in out: continue
        bx = people(f'{D}/{sd}/masks/{k:02d}.png'); t = time.time(); res = []
        if bx:
            with torch.inference_mode():
                im = Image.open(f'{D}/{sd}/frames/{k:02d}.jpg').convert('RGB'); o = m(**pp(im, boxes=[bx], return_tensors='pt'))
                for p in pp.post_process_pose_estimation(o, boxes=[bx])[0]:
                    res.append({'bbox': [round(v, 1) for v in p['bbox'].tolist()], 'kp': np.round(p['keypoints'].numpy(), 1).tolist(), 'sc': np.round(p['scores'].numpy(), 3).tolist()})
        out[key] = res; json.dump(out, open(out_p, 'w'))
        print(key, len(res), 'people', round(time.time() - t, 1), 's', flush=True)
print('DONE', len(out), 'frames', sum(len(v) for v in out.values()), 'bodies')
