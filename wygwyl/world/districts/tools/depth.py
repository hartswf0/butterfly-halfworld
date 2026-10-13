#!/usr/bin/env python3
"""THE SHARED LANGUAGE, layer 2 (depth), the photographs' side: Depth Anything V2 Small reads each of the 100 views into relative
depth (affine-invariant inverse depth: nearer is larger; no metres). The city's side is exact (the depth buffer); the two are
compared up to scale and shift, by rank, so a bus-shelter roof one metre away can no longer pass for a deck that recedes
from 5 to 100 m. Needs transformers ≥ 4.45 (run it with the depth venv's python).
Writes .work/lang/NNN-depth.npy (54×96 float32, 0 = farthest, 1 = nearest in the frame), .work/lang/depth.bin and a sheet."""
import os, numpy as np, torch
from PIL import Image
from transformers import AutoImageProcessor, AutoModelForDepthEstimation

T = os.path.dirname(os.path.abspath(__file__)); WK = os.path.join(T, '.work', 'lang'); GW, GH = 96, 54
dev = 'mps' if torch.backends.mps.is_available() else 'cpu'
proc = AutoImageProcessor.from_pretrained('depth-anything/Depth-Anything-V2-Small-hf')
model = AutoModelForDepthEstimation.from_pretrained('depth-anything/Depth-Anything-V2-Small-hf').eval().to(dev)
out, tiles = [], []
for n in range(1, 101):
    im = Image.open(os.path.join(T, '..', 'v', f'{n:03d}.webp')).convert('RGB')
    with torch.no_grad():
        d = model(**{k: v.to(dev) for k, v in proc(images=im, return_tensors='pt').items()}).predicted_depth[0].float().cpu().numpy()
    g = np.asarray(Image.fromarray(d).resize((GW, GH), Image.BOX), np.float32)
    lo, hi = np.percentile(g, 1), np.percentile(g, 99); g = np.clip((g - lo) / max(1e-6, hi - lo), 0, 1)
    np.save(os.path.join(WK, f'{n:03d}-depth.npy'), g); out.append(g)
    tiles.append(np.concatenate([np.asarray(im.resize((GW * 2, GH * 2))), np.repeat(np.repeat((np.stack([g] * 3, -1) * 255).astype(np.uint8), 2, 0), 2, 1)], 1))
    print(n, 'near share', round(float((g > 0.8).mean()), 3), flush=True)
np.stack(out).astype(np.float32).tofile(os.path.join(WK, 'depth.bin'))
rows = [np.concatenate(tiles[i:i + 4], 1) for i in range(0, 100, 4)]
Image.fromarray(np.concatenate(rows[:13], 0)).save(os.path.join(WK, 'depth1.jpg'), quality=80); Image.fromarray(np.concatenate(rows[13:], 0)).save(os.path.join(WK, 'depth2.jpg'), quality=80)
