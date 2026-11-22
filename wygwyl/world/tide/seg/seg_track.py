"""Directed, tracked segmentation for the Genie takes: the same recipe and output as cineosis-lab/lab/seg_track.py.

One job per triage ask: the take, the ask time, and the ask's claim. For each job:
1. Cut 24 frames at 6 fps (480 px high) around the ask time.
2. Direct: Gemini reads the claim and the reading frame and boxes the claim's subject first, then up to
   three other distinct figures. (cineosis-lab used CLIP here; CLIP weights cannot be fetched in this container.)
   Every person is named with gender, race and outfit.
3. Cut: each box prompts SAM 2.1 (small) for a mask on the reading frame.
4. Track: SAM 2.1's video predictor carries the masks forward and backward through the window.
5. Write per object a still cut-out, an RGBA sprite strip over time, and per-frame boxes (normalised).

Writes seg/<id>/... and seg/segments.json in the DATA_CONTRACT schema. Resumable.
usage: GEMINI_API_KEY=... python seg/seg_track.py [id ...]
"""
import base64, glob, json, os, shutil, ssl, subprocess, sys, tempfile, time, urllib.request
import numpy as np
from PIL import Image
import torch

HERE = os.path.dirname(os.path.abspath(__file__)); TIDE = os.path.dirname(HERE)
FPS, MAXF, MAXO, H = 6, 24, 4, 480
FILM = {'03-film-': 'litmus/out/poem03-take1.mp4', '03-sheet': 'litmus/out/poem03-take2.mp4'}
for k, p in {'street-020': 'litmus/out/street-020.mp4', 'street-091': 'litmus/out/street-091.mp4', 'street-098': 'litmus/out/street-098.mp4',
             'poemwalk-greybox': 'litmus/out/poemwalk-greybox.mp4', 'poemwalk-cel020': 'litmus/out/poemwalk-cel020.mp4',
             'probe-sheet': 'litmus/out/probe-sheet.mp4', 'probe-plan': 'litmus/out/probe-plan.mp4', 'probe-life': 'litmus/out/probe-life.mp4',
             'probe-spin': 'litmus/out/probe-spin.mp4', 'full-06': 'full/out/06-1122-0025/film.mp4', 'full-12': 'full/out/12-1122-0036/film.mp4',
             'shots-12': 'full/out/12shots-1122-0105/film.mp4', 'ride-grey': 'full/out/10ride-grey-1122-0119/film.mp4',
             'ride-cel': 'full/out/10ride-cel-1122-0129/film.mp4', 'ride-greyfig': 'full/out/10ride-greyfig-1122-0135/film.mp4'}.items():
    FILM[k] = p
MODELS = ['gemini-3.8-flash', 'gemini-flash-latest']
CTX = ssl.create_default_context(cafile=os.environ.get('SSL_CERT_FILE'))

ASK = """You are directing a segmentation pass over one frame of a generated video.
The frame was supposed to show: "{claim}"
Box at most {n} distinct things that are really in the frame. The first entry is the thing the sentence is about
(its subject; if it is absent, box whatever stands in its place and say so). Then the other distinct figures:
people first, then large objects. No background (sky, floor, walls, fog).
For every human, the desc must state gender, race and outfit as seen (e.g. "Black man, black mock-neck, black trousers").
Return JSON: [{{"label": one or two words, "desc": short description, "box_2d": [ymin, xmin, ymax, xmax] in 0-1000}}]"""

def gemini(jpg, claim):
    img = base64.b64encode(open(jpg, 'rb').read()).decode()
    body = {'contents': [{'parts': [{'inline_data': {'mime_type': 'image/jpeg', 'data': img}}, {'text': ASK.format(claim=claim, n=MAXO)}]}],
            'generationConfig': {'temperature': 0, 'responseMimeType': 'application/json'}}
    err = None
    for m in MODELS * 2:
        try:
            rq = urllib.request.Request(f'https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent', data=json.dumps(body).encode(),
                                        headers={'x-goog-api-key': os.environ['GEMINI_API_KEY'], 'content-type': 'application/json'})
            r = json.load(urllib.request.urlopen(rq, timeout=150, context=CTX))
            out = json.loads(r['candidates'][0]['content']['parts'][0]['text'])
            return [o for o in out if isinstance(o, dict) and len(o.get('box_2d', [])) == 4][:MAXO], m
        except Exception as e:
            err = e; time.sleep(4)
    raise RuntimeError(err)

def extract(clip, t_read, dur, out_dir):
    n_total = int(dur * FPS)
    if n_total <= MAXF: t0, n = 0.0, max(1, n_total)
    else: t0 = min(max(0.0, t_read - MAXF / FPS / 2), dur - MAXF / FPS); n = MAXF
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t0:.3f}", "-i", clip, "-t", f"{n / FPS:.3f}",
                    "-vf", f"fps={FPS},scale=-2:{H}", "-q:v", "2", "-start_number", "0", os.path.join(out_dir, "%05d.jpg")], check=True)
    files = sorted(f for f in os.listdir(out_dir) if f.endswith('.jpg'))
    return t0, len(files), min(len(files) - 1, max(0, int(round((t_read - t0) * FPS))))

def dur_of(clip):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', clip]).decode())

def jobs():
    out = {}
    for e in json.load(open(os.path.join(TIDE, 'triage', 'triage.json'))):
        if e['id'] not in FILM: continue
        clip = os.path.join(TIDE, FILM[e['id']])
        if not os.path.exists(clip): continue
        d = dur_of(clip)
        for j, a in enumerate(e['asks']):
            out[f"{e['id']}-{j:02d}"] = {'take': e['id'], 'clip': clip, 'film': FILM[e['id']], 'dur': d, 't': min(float(a['t']), d - 0.05),
                                         'claim': a['claim'], 'happened': a.get('happened'), 'ask': j}
    return out

def track(pred, tmp, frames_idx, boxes, sub):
    """Run SAM 2.1 video tracking from the first frame of frames_idx with box prompts; returns {obj: {frame: mask}}."""
    d = os.path.join(tmp, sub); os.makedirs(d, exist_ok=True)
    mp4 = os.path.join(tmp, sub + '.mp4')
    for n, fi in enumerate(frames_idx): os.link(os.path.join(tmp, f"{fi:05d}.jpg"), os.path.join(d, f"{n:05d}.jpg"))
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', str(FPS), '-i', os.path.join(d, '%05d.jpg'), '-c:v', 'libx264', '-crf', '12', '-pix_fmt', 'yuv420p', mp4], check=True)
    res = {k: {} for k in range(len(boxes))}
    for n, r in enumerate(pred(source=mp4, bboxes=boxes, stream=True)):
        if r.masks is None: continue
        m = r.masks.data.cpu().numpy() > 0.5
        for k in range(min(len(boxes), len(m))): res[k][frames_idx[n]] = m[k]
    return res

def main():
    from ultralytics.models.sam import SAM2VideoPredictor, SAM
    J = jobs(); only = [a for a in sys.argv[1:] if not a.startswith('--')]
    shard = next((a.split('=')[1] for a in sys.argv[1:] if a.startswith('--shard=')), None)   # --shard=k/n
    done = {}
    for f in glob.glob(os.path.join(HERE, 'segments*.json')): done.update(json.load(open(f)))
    out_path = os.path.join(HERE, f"segments_{shard.replace('/', 'of')}.json" if shard else 'segments.json')
    out = json.load(open(out_path)) if os.path.exists(out_path) else {}
    todo = [i for i in J if i in only] if only else [i for i in J if i not in done]
    if shard:
        a, b = map(int, shard.split('/')); todo = todo[a::b]
    torch.set_num_threads(int(os.environ.get('SEG_THREADS', '4')))
    ckpt = os.path.join(HERE, 'sam2.1_s.pt')
    img_sam = SAM(ckpt)
    pred = SAM2VideoPredictor(overrides=dict(conf=0.25, task='segment', mode='predict', imgsz=1024, model=ckpt, save=False, verbose=False))
    for k, i in enumerate(todo):
        s = J[i]; tmp = tempfile.mkdtemp(prefix='seg_'); t_start = time.time()
        try:
            t0, nfr, r = extract(s['clip'], s['t'], s['dur'], tmp)
            rj = os.path.join(tmp, f"{r:05d}.jpg"); frame = np.array(Image.open(rj).convert('RGB')); Hh, Ww = frame.shape[:2]
            dets, model = gemini(rj, s['claim'])
            boxes = [[b['box_2d'][1] * Ww / 1000, b['box_2d'][0] * Hh / 1000, b['box_2d'][3] * Ww / 1000, b['box_2d'][2] * Hh / 1000] for b in dets]
            keep = [n for n, b in enumerate(boxes) if (b[2] - b[0]) > 6 and (b[3] - b[1]) > 6 and (b[2] - b[0]) * (b[3] - b[1]) < 0.95 * Ww * Hh]
            dets = [dets[n] for n in keep]; boxes = [boxes[n] for n in keep]
            rec = {'fps': FPS, 't0': round(t0, 3), 'frames': nfr, 'read_idx': r, 'take': s['take'], 'ask': s['ask'], 'film': s['film'],
                   't': round(s['t'], 3), 'claim': s['claim'], 'happened': s['happened'], 'director': model, 'objects': []}
            if not boxes: out[i] = rec; continue
            still = img_sam(rj, bboxes=boxes, verbose=False)[0].masks.data.cpu().numpy() > 0.5
            tr_f = track(pred, tmp, list(range(r, nfr)), boxes, 'fw')
            tr_b = track(pred, tmp, list(range(r, -1, -1)), boxes, 'bw') if r > 0 else {n: {} for n in range(len(boxes))}
            frames = [np.array(Image.open(os.path.join(tmp, f"{fi:05d}.jpg")).convert('RGB')) for fi in range(nfr)]
            d = os.path.join(HERE, i); shutil.rmtree(d, ignore_errors=True); os.makedirs(d)
            for n, (det, sm) in enumerate(zip(dets, still)):
                ms = [tr_f[n].get(fi) if fi >= r else tr_b[n].get(fi) for fi in range(nfr)]
                bx = []
                for m in ms:
                    if m is None or m.sum() < 20: bx.append(None); continue
                    ys, xs = np.where(m); bx.append([round(xs.min() / Ww, 4), round(ys.min() / Hh, 4), round((xs.max() - xs.min() + 1) / Ww, 4), round((ys.max() - ys.min() + 1) / Hh, 4)])
                present = [b for b in bx if b]
                if not present or sm.sum() < 20: continue
                ux0 = min(b[0] for b in present); uy0 = min(b[1] for b in present)
                ux1 = max(b[0] + b[2] for b in present); uy1 = max(b[1] + b[3] for b in present)
                X0, Y0, X1, Y1 = int(ux0 * Ww), int(uy0 * Hh), int(ux1 * Ww), int(uy1 * Hh)
                cw, ch = max(1, X1 - X0), max(1, Y1 - Y0)
                sc = min(1.0, 200 / max(cw, ch)); sw, sh = max(1, int(cw * sc)), max(1, int(ch * sc))
                sprite = Image.new('RGBA', (sw * nfr, sh), (0, 0, 0, 0))
                for fi, m in enumerate(ms):
                    if m is None: continue
                    rgba = np.dstack([frames[fi], (m * 255).astype(np.uint8)])[Y0:Y1, X0:X1]
                    sprite.paste(Image.fromarray(rgba, 'RGBA').resize((sw, sh), Image.LANCZOS), (fi * sw, 0))
                sprite.save(os.path.join(d, f"{n}_track.png"))
                ys, xs = np.where(sm); x, y, w, h = int(xs.min()), int(ys.min()), int(xs.max() - xs.min() + 1), int(ys.max() - ys.min() + 1)
                Image.fromarray(np.dstack([frame, (sm * 255).astype(np.uint8)])[y:y + h, x:x + w], 'RGBA').save(os.path.join(d, f"{n}.png"))
                rec['objects'].append({'k': n, 'role': 'reading' if n == 0 else 'figure', 'label': det.get('label', 'figure'), 'src': 'directed',
                    'desc': det.get('desc', ''), 'target': s['claim'], 'png': f"seg/{i}/{n}.png",
                    'bbox': [round(x / Ww, 4), round(y / Hh, 4), round(w / Ww, 4), round(h / Hh, 4)], 'area': round(float(sm.sum()) / (Ww * Hh), 4),
                    'sprite': f"seg/{i}/{n}_track.png", 'sw': sw, 'sh': sh,
                    'union': [round(ux0, 4), round(uy0, 4), round(ux1 - ux0, 4), round(uy1 - uy0, 4)], 'boxes': bx, 'present': round(len(present) / nfr, 3)})
            out[i] = rec
        except Exception as e:
            print(f"{i} ERR {e}", flush=True); continue
        finally:
            shutil.rmtree(tmp, ignore_errors=True)
        json.dump(out, open(out_path, 'w'))
        o = out[i]['objects']
        print(f"{k + 1}/{len(todo)} {i:22s} {time.time() - t_start:5.0f}s objs={len(o)} " + ' | '.join(f"{x['label']}({x['present']})" for x in o), flush=True)
    allr = {}
    for f in sorted(glob.glob(os.path.join(HERE, 'segments*.json'))): allr.update(json.load(open(f)))
    if not shard: json.dump(dict(sorted(allr.items())), open(os.path.join(HERE, 'segments.json'), 'w'))
    print('DONE', sum(len(v['objects']) for v in out.values()), 'tracked objects in', len(out), 'shots', flush=True)

if __name__ == '__main__':
    main()
