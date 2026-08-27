#!/usr/bin/env python3
"""Convert already-rendered PNG plates to WebP and repoint the index.
Written because the first pass rendered PNG before the size was measured:
247 MB for a thousand plates, against ~45 MB for the same images as WebP."""
import os, io, json, glob
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(
       os.path.dirname(os.path.abspath(__file__)))))
OUT = os.path.join(ROOT, 'AUDIO'); P = os.path.join(OUT, 'plates')
before = after = n = 0
for f in sorted(glob.glob(os.path.join(P, '*.png'))):
    w = f[:-4] + '.webp'
    before += os.path.getsize(f)
    Image.open(f).convert('RGB').save(w, 'WEBP', quality=82, method=4)
    after += os.path.getsize(w); os.remove(f); n += 1
ip = os.path.join(OUT, 'index.json')
if os.path.exists(ip):
    rows = json.load(io.open(ip, encoding='utf-8'))
    for r in rows:
        if r.get('plate','').endswith('.png'): r['plate'] = r['plate'][:-4] + '.webp'
    json.dump(rows, io.open(ip,'w',encoding='utf-8'), separators=(',',':'))
print('%d converted · %.0f MB -> %.0f MB' % (n, before/1e6, after/1e6))
