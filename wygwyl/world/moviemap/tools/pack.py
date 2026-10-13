#!/usr/bin/env python3
"""Press the disc: captured PNG frames -> WebP sprite sheets, one per segment per view (32 frames a sheet), and disc.json,
the index that correlates every frame to the street plan (segment, its two intersections, each frame's position and heading).

  python3 tools/pack.py <framesDir> [--tag e5] [--q 50]
"""
import json, os, sys, hashlib, subprocess, tempfile
from concurrent.futures import ProcessPoolExecutor
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__)); MM = os.path.dirname(HERE)
args = sys.argv[1:]; FR = args[0]
opt = lambda k, d=None: args[args.index('--' + k) + 1] if '--' + k in args else d
TAG, Q, SCALE = opt('tag', 'e5'), int(opt('q', '40')), float(opt('scale', '0.9'))
COLS, PER = 8, 32
plan = json.load(open(os.path.join(MM, 'plan.json')))
city = json.load(open(os.path.join(MM, '..', 'city3d', 'city.json')))
out = os.path.join(MM, 'disc', TAG); os.makedirs(out, exist_ok=True)

def press(job):
    """one sheet: up to 32 frames of one view of one segment, scaled, tiled 8 across, pressed with cwebp"""
    src, sid, v, c, n = job
    ims = [Image.open(os.path.join(src, f'{v}_{i:04d}.png')).convert('RGB') for i in range(c * PER, min(n, (c + 1) * PER))]
    w, h = round(ims[0].width * SCALE), round(ims[0].height * SCALE)
    cols = min(COLS, len(ims)); rows = (len(ims) + COLS - 1) // COLS
    sheet = Image.new('RGB', (w * cols, h * rows))
    for k, im in enumerate(ims): sheet.paste(im.resize((w, h), Image.LANCZOS) if SCALE != 1 else im, ((k % COLS) * w, (k // COLS) * h))
    fn = os.path.join(out, f'{sid}_{v}_{c}.webp')
    with tempfile.NamedTemporaryFile(suffix='.png') as t:
        sheet.save(t.name); subprocess.run(['cwebp', '-quiet', '-q', str(Q), '-sns', '90', '-f', '70', '-m', '6', t.name, '-o', fn], check=True)
    return sid, os.path.getsize(fn), w, h

def main():
    W = H = None
    jobs, meta_seg = [], []
    for sid, e in enumerate(plan['edges']):
        if not e.get('disc'): continue
        src = os.path.join(FR, TAG, str(sid))
        if not os.path.exists(os.path.join(src, 'done')): print('missing', sid); continue
        n = len(e['steps']); meta_seg.append((sid, e, n))
        for v in range(4):
            for c in range((n + PER - 1) // PER): jobs.append((src, sid, v, c, n))
    for f in os.listdir(out):
        if f.endswith('.webp'): os.remove(os.path.join(out, f))
    size = {}
    with ProcessPoolExecutor() as ex:
        for k, (sid, b, w, h) in enumerate(ex.map(press, jobs, chunksize=4)):
            size[sid] = size.get(sid, 0) + b; W, H = w, h
            if k % 100 == 0: print(f'{k}/{len(jobs)} sheets · {sum(size.values()) / 1048576:.1f} MB', flush=True)
    segs, total, nframes = [], 0, 0
    for sid, e, n in meta_seg:
        w = plan['ways'][e['w']]; total += size[sid]; nframes += n * 4
        segs.append({'seg': sid, 'a': e['a'], 'b': e['b'], 'way': e['w'], 'name': w['name'], 'cls': e['cls'], 'len': e['len'], 'n': n, 'bytes': size[sid], 'steps': e['steps']})
    print('sheets', len(jobs), 'frames', nframes, f'{total / 1048576:.1f} MB')

    # the aerial: the whole city from straight above, two sizes (the map's base at the far powers of ten)
    aer = os.path.join(FR, f'aerial-{TAG}.png')
    if os.path.exists(aer):
        im = Image.open(aer).convert('RGB')
        im.save(os.path.join(MM, 'aerial.webp'), 'WEBP', quality=62, method=6)
        im.resize((im.width // 4, im.height // 4), Image.LANCZOS).save(os.path.join(MM, 'aerial-s.webp'), 'WEBP', quality=70, method=6)
        print('aerial', os.path.getsize(os.path.join(MM, 'aerial.webp')) // 1024, 'KB')

    disc = {
        'version': 'moviemap-disc-v1', 'tag': TAG,
        'from': {**plan['from'], 'plan_checksum': plan['checksum']},
        'frame': {'w': W, 'h': H, 'hfov': 90, 'eye': 2.8, 'step': plan['step'], 'format': 'webp', 'quality': Q},
        'light': {'era': 5, 'era_name': city['eras'][5], 'hour': 12, 'doy': 265, 'date': '2026-09-22', 'weather': 'clear', 'lat': city['lat']},
        'views': ['front', 'right', 'back', 'left'],
        'sheet': {'cols': COLS, 'per': PER, 'path': 'disc/%s/{seg}_{view}_{chunk}.webp' % TAG,
                  'rule': 'frame i of view v of segment s lives in sheet {s}_{v}_{i//per} at column (i%per)%cols, row (i%per)//cols; frames run from intersection a to b, heading = steps[i][2] (radians, plan x east / y south); view v looks heading + v*90deg'},
        'segments': segs,
        'totals': {'segments': len(segs), 'steps': sum(s['n'] for s in segs), 'frames': nframes, 'bytes': total, 'km': round(sum(s['len'] for s in segs) / 1000, 3)},
    }
    disc['checksum'] = hashlib.sha1(json.dumps(segs, separators=(',', ':')).encode()).hexdigest()[:12]
    json.dump(disc, open(os.path.join(MM, 'disc.json'), 'w'), separators=(',', ':'))
    print('disc.json', disc['totals'], disc['checksum'])


if __name__ == '__main__':
    main()
