#!/usr/bin/env python3
"""THE SHARED LANGUAGE, the photographs' side: each of the 100 views read into the same ten classes the city's semantic pass
writes (moviemap/engine.mjs semFrame), so a photograph and a rendered frame can be compared pixel for pixel without
pretending one is the other.
  0 sky · 1 facade · 2 roof · 3 ground · 4 water · 5 planting · 6 structure · 7 rock · 8 figure · 9 vehicle
plus a light layer (the emitters: lamps, neon, lit windows: bright, not sky) and the camera's own geometry (the horizon from
the sky/ground boundary and the vanishing point from the receding lines), which constrain pitch and lens before any search.
Writes .work/lang/NNN.npz (cls 54×96, light 54×96, hz, vp) and .work/lang/sheet.jpg."""
import os, json, numpy as np, torch, cv2
from PIL import Image
from transformers import AutoImageProcessor, Mask2FormerForUniversalSegmentation

T = os.path.dirname(os.path.abspath(__file__)); WK = os.path.join(T, '.work', 'lang'); os.makedirs(WK, exist_ok=True)
GW, GH = 96, 54
NAMES = ['sky', 'facade', 'roof', 'ground', 'water', 'planting', 'structure', 'rock', 'figure', 'vehicle']
COL = np.array([[30, 40, 70], [200, 120, 80], [150, 60, 50], [120, 120, 120], [40, 110, 200], [60, 160, 70], [230, 200, 60], [120, 90, 70], [240, 80, 200], [80, 230, 230]], np.uint8)
def cls_of(name):
    n = name.lower()
    if n.startswith('sky'): return 0
    if n in ('roof',): return 2
    if any(k in n for k in ('building', 'house', 'wall', 'window', 'door', 'tent')): return 1
    if any(k in n for k in ('road', 'pavement', 'floor', 'platform', 'railroad', 'playingfield', 'gravel', 'dirt', 'sand', 'snow', 'rug', 'stairs')): return 3
    if any(k in n for k in ('sea', 'river', 'water')): return 4
    if any(k in n for k in ('tree', 'grass', 'flower', 'potted plant')): return 5
    if any(k in n for k in ('mountain', 'rock')): return 7
    if n in ('person', 'bird', 'cat', 'dog', 'horse', 'sheep', 'cow'): return 8
    if n in ('bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat'): return 9
    return 6
dev = 'mps' if torch.backends.mps.is_available() else 'cpu'
proc = AutoImageProcessor.from_pretrained('facebook/mask2former-swin-tiny-coco-panoptic')
seg = Mask2FormerForUniversalSegmentation.from_pretrained('facebook/mask2former-swin-tiny-coco-panoptic').eval().to(dev); id2 = seg.config.id2label

def vanishing(img):
    g = cv2.cvtColor(np.asarray(img), cv2.COLOR_RGB2GRAY); e = cv2.Canny(g, 60, 160); W, H = img.size
    L = cv2.HoughLinesP(e, 1, np.pi / 180, 60, minLineLength=max(30, W // 14), maxLineGap=6)
    if L is None or len(L) < 4: return (0.5, 0.5, 0.0)
    L = L[:, 0, :].astype(np.float64); a = np.arctan2(L[:, 3] - L[:, 1], L[:, 2] - L[:, 0]); L = L[(np.abs(np.sin(a)) > 0.12) & (np.abs(np.cos(a)) > 0.12)][:120]
    P = []
    for i in range(len(L)):
        for j in range(i + 1, len(L)):
            x1, y1, x2, y2 = L[i]; x3, y3, x4, y4 = L[j]; d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
            if abs(d) < 1e-6: continue
            px = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / d; py = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / d
            if -0.5 * W < px < 1.5 * W and -0.5 * H < py < 1.5 * H: P.append((px / W, py / H))
    if len(P) < 5: return (0.5, 0.5, 0.0)
    P = np.array(P); h2, xe, ye = np.histogram2d(P[:, 0], P[:, 1], bins=24, range=[[-0.5, 1.5], [-0.5, 1.5]]); k = np.unravel_index(h2.argmax(), h2.shape)
    return (float((xe[k[0]] + xe[k[0] + 1]) / 2), float((ye[k[1]] + ye[k[1] + 1]) / 2), float(h2.max() / len(P)))

tiles, meta = [], []
for n in range(1, 101):
    im = Image.open(os.path.join(T, '..', 'v', f'{n:03d}.webp')).convert('RGB'); asp = im.width / im.height
    work = im.resize((int(448 * asp) // 32 * 32, 448), Image.BILINEAR)
    with torch.no_grad():
        o = seg(**{k: v.to(dev) for k, v in proc(images=[work], return_tensors='pt').items()})
        o.class_queries_logits = o.class_queries_logits.cpu(); o.masks_queries_logits = o.masks_queries_logits.cpu()
        rr = proc.post_process_panoptic_segmentation(o, target_sizes=[(GH * 4, GW * 4)], label_ids_to_fuse=set())[0]
    lab = rr['segmentation'].numpy(); cm = np.full(lab.shape, 6, np.uint8)
    for s in rr['segments_info']: cm[lab == s['id']] = cls_of(id2[s['label_id']])
    cls = np.zeros((GH, GW), np.uint8)
    for y in range(GH):
        for x in range(GW): cls[y, x] = np.bincount(cm[y * 4:(y + 1) * 4, x * 4:(x + 1) * 4].ravel(), minlength=10).argmax()
    hsv = np.asarray(im.resize((GW, GH), Image.BOX).convert('HSV'), np.float32) / 255
    light = ((hsv[..., 2] > 0.82) | ((hsv[..., 2] > 0.6) & (hsv[..., 1] > 0.55))) & (cls != 0)
    # the horizon: where sky ends above ground or water, column by column; else the vanishing point's height
    hz = []
    for x in range(GW):
        c = cls[:, x]; s = np.where(c == 0)[0]; g = np.where((c == 3) | (c == 4))[0]
        if len(s) and len(g) and s.max() < g.min(): hz.append((s.max() + 1 + g.min()) / 2 / GH)
    vp = vanishing(work)
    h = float(np.median(hz)) if len(hz) > 8 else (vp[1] if vp[2] > 0.08 and 0.05 < vp[1] < 0.95 else None)
    fr = np.bincount(cls.ravel(), minlength=10) / cls.size
    np.savez_compressed(os.path.join(WK, f'{n:03d}.npz'), cls=cls, light=light, hz=np.array(-1 if h is None else h), vp=np.array(vp))
    meta.append({'n': n, 'hz': None if h is None else round(h, 3), 'vp': [round(v, 3) for v in vp], 'fr': {NAMES[i]: round(float(f), 3) for i, f in enumerate(fr) if f > 0.005}, 'light': round(float(light.mean()), 3)})
    t = np.concatenate([np.asarray(im.resize((GW * 2, GH * 2))), np.repeat(np.repeat(COL[cls], 2, 0), 2, 1)], 1); tiles.append(t)
    print(n, meta[-1]['fr'], 'hz', meta[-1]['hz'], flush=True)
json.dump(meta, open(os.path.join(WK, 'lang.json'), 'w'))
rows = [np.concatenate(tiles[i:i + 4], 1) for i in range(0, 100, 4)]
Image.fromarray(np.concatenate(rows[:13], 0)).save(os.path.join(WK, 'sheet1.jpg'), quality=80); Image.fromarray(np.concatenate(rows[13:], 0)).save(os.path.join(WK, 'sheet2.jpg'), quality=80)
