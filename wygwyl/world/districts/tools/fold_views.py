#!/usr/bin/env python3
"""Fold the 100 views into pop-ups, the elsewhere map's way (Hoiem's fold, Tour Into the Picture's box): mask2former panoptic
segmentation → a 48×27 grid of sky / ground / vertical / water / foliage / ceiling / thing, a horizon and a vanishing point.
The mood city stands each folded reference in its place, textured with the reference itself: from its station the frame is
the reference; walking off it, the fold's floor, walls and sky open up. Writes ../../mood/folds.json and ../../mood/fold.bin."""
import os, sys, json, numpy as np, torch, cv2
from PIL import Image
sys.path.insert(0, '/Users/gaia/resurrecting atlantis/_dig/media')
from elsewhere import fold_class, phenotype, GX, GY                  # the same fold rules as the elsewhere map
from transformers import AutoImageProcessor, Mask2FormerForUniversalSegmentation

T = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(T, '../../mood')
dev = 'mps' if torch.backends.mps.is_available() else 'cpu'
proc = AutoImageProcessor.from_pretrained('facebook/mask2former-swin-tiny-coco-panoptic')
seg = Mask2FormerForUniversalSegmentation.from_pretrained('facebook/mask2former-swin-tiny-coco-panoptic').eval().to(dev); id2 = seg.config.id2label
grids, meta = [], []
for n in range(1, 101):
    im = Image.open(os.path.join(T, '..', 'v', f'{n:03d}.webp')).convert('RGB'); asp = im.width / im.height
    work = im.resize((int(384 * asp) // 32 * 32, 384), Image.BILINEAR)
    with torch.no_grad():
        inp = {k: v.to(dev) for k, v in proc(images=[work], return_tensors='pt').items()}; o = seg(**inp)
        o.class_queries_logits = o.class_queries_logits.cpu(); o.masks_queries_logits = o.masks_queries_logits.cpu()
        rr = proc.post_process_panoptic_segmentation(o, target_sizes=[(GY * 8, GX * 8)])[0]
    lab = rr['segmentation'].numpy(); cm = np.full(lab.shape, 2, np.uint8)
    for s_ in rr['segments_info']: cm[lab == s_['id']] = fold_class(id2[s_['label_id']], s_['label_id'] < 80)
    grid = np.zeros((GY, GX), np.uint8)
    for y in range(GY):
        for x in range(GX): grid[y, x] = np.bincount(cm[y * 8:(y + 1) * 8, x * 8:(x + 1) * 8].ravel(), minlength=7).argmax()
    ph = phenotype({'grid': grid, 'vp': np.array([0.5, 0.45, 0.0])})
    grids.append(grid); meta.append({'n': n, 'asp': round(asp, 3), 'hz': round(ph['hz'], 3), 'fr': [round(float(x), 3) for x in ph['fr']], 'ground': round(ph['ground'], 3)})
    print(n, 'hz', round(ph['hz'], 2), 'ground', round(ph['ground'], 2), flush=True)
np.stack(grids).astype(np.uint8).tofile(os.path.join(OUT, 'fold.bin'))
json.dump({'version': 'folds-v1', 'grid': [GX, GY], 'fold': ['sky', 'ground', 'vertical', 'water', 'foliage', 'ceiling', 'thing'], 'views': meta}, open(os.path.join(OUT, 'folds.json'), 'w'))
