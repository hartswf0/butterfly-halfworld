"""Seed against film: each shot's seed, then frames at 15%, 50% and 90% of the shot, so a take can be checked against what was written."""
import json, subprocess, sys, cv2, numpy as np
num, O, out = sys.argv[1], sys.argv[2], sys.argv[3]; m = json.load(open(f'{O}/manifest.json')); rows = []
for s in m['shots']:
    i = s['shot']; seed = cv2.resize(cv2.imread(f'seeds{num}/grey{i}.jpg'), (320, 180)); cv2.putText(seed, f'SEED {i}', (6, 20), cv2.FONT_HERSHEY_SIMPLEX, .55, (0, 255, 255), 2); tiles = [seed]
    for f in (.15, .5, .9):
        t = s['t0'] + s['seconds'] * f; tmp = out + '.f.jpg'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t:.2f}', '-i', f'{O}/film.mp4', '-frames:v', '1', '-vf', 'scale=320:180', tmp])
        im = cv2.imread(tmp); cv2.putText(im, f'{t:.1f}s', (6, 20), cv2.FONT_HERSHEY_SIMPLEX, .55, (255, 255, 255), 2); tiles.append(im)
    rows.append(np.hstack(tiles))
cv2.imwrite(out, np.vstack(rows))
