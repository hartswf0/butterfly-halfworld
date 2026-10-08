#!/usr/bin/env python3
"""Publish the pose finder's results beside the scene book: ../poses/poses.json, each found frame (photo and reading) and each
reference's reading in the same colours."""
import os, json, shutil, numpy as np
from PIL import Image
T = os.path.dirname(os.path.abspath(__file__)); WK = os.path.join(T, '.work'); O = os.path.join(T, '..', 'poses'); os.makedirs(O, exist_ok=True)
COL = np.array([[30, 40, 70], [200, 120, 80], [150, 60, 50], [120, 120, 120], [40, 110, 200], [60, 160, 70], [230, 200, 60], [120, 90, 70], [240, 80, 200], [80, 230, 230]], np.uint8)
P = json.load(open(f'{WK}/pose/poses.json'))
for n in P['views']:
    p = f'{int(n):03d}'
    for s in ('-photo.jpg', '-sem.png'): shutil.copy(f'{WK}/pose/{p}{s}', f'{O}/{p}{s}')
    c = np.load(f'{WK}/lang/{p}.npz')['cls']; Image.fromarray(COL[np.minimum(c, 9)]).save(f'{O}/{p}-ref.png')
json.dump(P, open(f'{O}/poses.json', 'w'), separators=(',', ':')); print('published', len(P['views']))
