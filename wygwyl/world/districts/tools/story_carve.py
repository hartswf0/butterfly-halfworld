#!/usr/bin/env python3
"""CARVE THE FILM (the CUTBASTARD-1 patch law, applied to our story and our pipeline).
  patch law     each poem is carved into patches of 6–12 s (target 9) on her reading's clock. A new patch starts where the scene
                changes (location, action, entities: the scene book's scenes) and otherwise on a phrase end (her breath). SMPTE
                timecodes from 01:00:00:00, 24 fps.
  one shot      a patch is one MOVING shot: our own videos at the keyframe's moment (Markov, halfworld, film, generated, other),
                then found-footage clips (Cineosis); a still only when nothing moves (flagged: a drawing to animate). The in-point
                is a clean window around the matched moment, never across a hard cut in the source.
  laws          a shot once · its source not again within 3 patches · colour and black-and-white do not flip inside a poem
                (black-and-white only where the scene is montage, memory or the world's chaos) · no title cards, collages, grids,
                ink washes · the figure when the scene has one, our own footage for POET and the EX
  only what     each patch is described from what the matched footage shows (the pipeline's detections, measured camera, light)
  exists        plus the scene book's entities, place and blocking. A patch with nothing good enough is marked GENERATE.
  matrices      per poem: O (diagnosis + olog), A (YAML patch genome), B (story map), E (scene blueprint for POET, the EX, the
                child), F (reforge stack: Base → Master per patch). C/D (EDL, OTIO) only on request.
Writes .work/story/carve/NN.{md,yaml,json} and .work/story/film.json (for story_preview.py, which renders the moving cut)."""
import os, re, json, glob, math, subprocess, collections, numpy as np, torch, open_clip
from PIL import Image

T = os.path.dirname(os.path.abspath(__file__)); W = os.path.join(T, '.work'); ST = '/Users/gaia/resurrecting atlantis/_dig/media/store'
WY = os.path.join(T, '..', '..', '..'); OUTC = os.path.join(W, 'corpus', 'out'); D = os.path.join(W, 'story'); CV = os.path.join(D, 'carve'); os.makedirs(CV, exist_ok=True)
ARCH = '/Users/gaia/Downloads/WYGWYL-WORLD-ARCH/shots/out'; CIN = '/Users/gaia/resurrecting atlantis/CINEOSIS_44/lab'
S = json.load(open(os.path.join(T, '..', 'scenes.json'))); SCRIPT = {x['num']: x for x in S['script']}; DIST = {d['id']: d for d in S['districts']}
FPS = 24

# ---------- the pool ----------
ids = json.load(open(f'{ST}/emb_ids.json')); E = np.load(f'{ST}/emb.f16.npy', mmap_mode='r'); inv = {}
for l in open(f'{ST}/inventory.jsonl'): r = json.loads(l); inv[r['k']] = r
for l in open(f'{ST}/keyframes.jsonl'):
    r = json.loads(l); v = inv.get(r['video'], {}); inv[r['k']] = {**r, 'source': v.get('source'), 'poem': v.get('poem'), 'kind': 'keyframe', 'video_path': v.get('path')}
canon = {x['k']: x for x in json.load(open(f'{ST}/canon.json'))['items']}; cid2k = {x['cid']: x['k'] for x in canon.values()}
def private(r): p = (r.get('video_path') or r.get('path') or ''); return r.get('source') == 'shoot' or '/CAT/' in p or '/cdmx/' in p.lower() \
    or bool(re.search(r'/cuts/|/parts/|/reel/|/strips/|_MASTER_CUT|master_cut', p))      # (and our own rendered cuts: derivatives of footage already in the pool)
rows = [i for i, k in enumerate(ids) if k in inv and not private(inv[k]) and inv[k].get('kind') in ('image', 'keyframe') and os.path.exists(inv[k]['path'])]
keys = [ids[i] for i in rows]; X = np.asarray(E[rows], np.float32)
V = np.load(os.path.join(W, 'emb.npz'))['views'].astype(np.float32); vfiles = json.load(open(os.path.join(T, 'views.json')))
for n in range(1, 101):
    k = f'mj{n:03d}'; keys.append(k); inv[k] = {'k': k, 'path': os.path.join(T, '..', 'v', f'{n:03d}.webp'), 'source': 'mj', 'kind': 'image', 'n': n,
                                                'sid': vfiles[n - 1].rsplit('_', 2)[1] + '_' + vfiles[n - 1].rsplit('_', 1)[1].split('.')[0]}
X = np.concatenate([X, V]); X /= np.linalg.norm(X, axis=1, keepdims=True); jof = {k: j for j, k in enumerate(keys)}
VOC = json.load(open(f'{ST}/text_meta.json'))['vocab']; VE = np.load(f'{ST}/vocab.npy').astype(np.float32)

# moving footage behind each picture
CORP = json.load(open(f'{CIN}/cache/corpus.json'))
def motion_of(k):
    r = inv[k]
    if r.get('kind') == 'keyframe' and r.get('video_path') and os.path.exists(r['video_path']) and r['video_path'].lower().endswith(('.mp4', '.mov', '.webm', '.m4v')):
        return {'path': r['video_path'], 't': r['t'], 'dur': r.get('dur') or 0, 'src': r['video']}
    m = re.match(r'([0-9a-f-]{36})\.jpg$', os.path.basename(r['path']))
    if m and m.group(1) in CORP and os.path.exists(f'{CIN}/clips/{m.group(1)}.mp4'):
        c = CORP[m.group(1)]; d = c['endSeconds'] - c['startSeconds']
        return {'path': f'{CIN}/clips/{m.group(1)}.mp4', 't': d / 2, 'dur': d, 'src': c['sourceSlug'], 'title': c.get('sourceTitle'), 'year': c.get('sourceYear'), 'bw': c.get('colorMode') == 'bw'}
    return None
print('pool', len(keys), flush=True)

wts = glob.glob(os.path.expanduser('~/.cache/huggingface/hub/models--laion--CLIP-ViT-B-32-laion2B-s34B-b79K/snapshots/*/open_clip_model.safetensors'))[0]
model, _, prep = open_clip.create_model_and_transforms('ViT-B-32', pretrained=wts); tok = open_clip.get_tokenizer('ViT-B-32')
def enc(ts):
    with torch.no_grad(): t = model.encode_text(tok(ts)).float()
    return (t / t.norm(dim=-1, keepdim=True)).numpy()
mx = lambda ts: (X @ enc(ts).T).max(1)
photo = mx(['a photograph of a place', 'a film still of a room', 'a cinematic photograph of a street at night', 'a photograph of a landscape', 'a film still of a person']) \
      - mx(['a collage', 'a poster with text', 'a line drawing', 'an ink drawing', 'a grid of photographs', 'a screenshot of a user interface', 'a title card', 'a cut-out paper collage',
            'an audio waveform', 'a diagram', 'a contact sheet of film frames', 'a split screen of several photographs', 'a filmstrip', 'an ink wash painting on white paper', 'film leader with numbers', 'a halftone print', 'a dot pattern'])
person = mx(['a film still of a man', 'a film still of a woman', 'a film still of a child', 'a person in a room']) - mx(['an empty room', 'an empty street', 'a landscape with no people'])
wide = mx(['a wide establishing shot of a place', 'an aerial view of a city', 'a long shot of a building']) - mx(['a close-up', 'an extreme close-up of a face', 'a close-up of an object'])

stand = {}
for sj in glob.glob(f'{OUTC}/*/shot.json'):
    if not os.path.exists(os.path.join(os.path.dirname(sj), 'multiplane', 'multiplane.json')): continue
    s = json.load(open(sj)); c = (s.get('corpus') or {}).get('cid') or ''; k = cid2k.get(c) or (c[1:].replace('_', '-') if c.startswith('A') else c)
    pd = os.path.join(os.path.dirname(sj), 'program', 'scene.json')
    stand[k] = {'sid': s['id'], 'root': OUTC, 'cam': s['camera'], 'det': [d['label'] for d in s.get('detections', [])][:8], 'stuff': list((s.get('stuff') or {}).keys())[:4],
                'drawn': json.load(open(pd))['score'] if os.path.exists(pd) else None}
for k, r in inv.items():
    if r.get('source') == 'mj' and os.path.exists(os.path.join(ARCH, r['sid'], 'shot.json')):
        s = json.load(open(os.path.join(ARCH, r['sid'], 'shot.json'))); pd = os.path.join(ARCH, r['sid'], 'program', 'scene.json')
        stand[k] = {'sid': r['sid'], 'root': ARCH, 'cam': s['camera'], 'det': [d['label'] for d in s.get('detections', [])][:8], 'stuff': list((s.get('stuff') or {}).keys())[:4],
                    'drawn': json.load(open(pd))['score'] if os.path.exists(pd) else None}
sets = json.load(open(os.path.join(W, 'corpus', 'sets.json')))['sets']; place_of = {cid2k.get(c, c): n for n, st in enumerate(sets) for c in st['views']}
OWN = {'markov', 'halfworld', 'generated', 'film', 'other', 'mj'}
FIG = re.compile(r'\b(POET|EX|he|his|him|child|children|kid|girl|boy|woman|man|crowd|figure|lovers?|mother|father|parents|they|people)\b')
HERO = re.compile(r'\b(POET|EX|Young POET|ghost (?:kid|child))\b')
MONT = re.compile(r'montage|images of|chaos|\bTV\b|television|news|archiv|memor|flashback|the world|history|crowd', re.I)
LOOK = {}
def look(k):
    if k in LOOK: return LOOK[k]
    try:
        im = Image.open(inv[k]['path']); w = im.size[0]; a = np.asarray(im.convert('RGB').resize((64, 36)), np.float32)
        rg, yb = a[..., 0] - a[..., 1], 0.5 * (a[..., 0] + a[..., 1]) - a[..., 2]
        LOOK[k] = (w, float(np.hypot(rg.std(), yb.std()) + 0.3 * np.hypot(rg.mean(), yb.mean())), float((a.mean(-1) > 225).mean()), float(a.mean() / 255))
    except Exception: LOOK[k] = (0, 0.0, 0.0, 0.0)
    return LOOK[k]
def tags(k, n=5): return [VOC[i] for i in np.argsort(-(VE @ X[jof[k]]))[:n]]

PCACHE_F = os.path.join(D, 'probe_cache.json'); PCACHE = json.load(open(PCACHE_F)) if os.path.exists(PCACHE_F) else {}
def cuts_in(path, a, b):                                  # hard cuts inside a stretch of source (ffmpeg scene change), cached
    key = f'{path}|{a:.2f}|{b:.2f}'
    if key in PCACHE: return PCACHE[key]
    PCACHE[key] = _cuts_in(path, a, b); return PCACHE[key]
def _cuts_in(path, a, b):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-ss', f'{max(0, a):.2f}', '-t', f'{b - a:.2f}', '-i', path, '-vf', "scale=160:-1,select='gt(scene,0.32)',showinfo", '-an', '-f', 'null', '-'],
                       capture_output=True, text=True, timeout=60)
    return [max(0, a) + float(m) for m in re.findall(r'pts_time:([\d.]+)', r.stderr)]
def window(mv, dur):
    """a clean window of `dur` s around the matched moment: no hard cut inside, not the first 0.3 s, not the tail"""
    if not mv or mv['dur'] < min(dur, 3): return None
    a, b = max(0.0, mv['t'] - dur - 2), min(mv['dur'], mv['t'] + dur + 2)
    try: cs = [0.0] + cuts_in(mv['path'], a, b) + [mv['dur']]
    except Exception: cs = [0.0, mv['dur']]
    best = None
    for x, y in zip(cs, cs[1:]):
        x, y = x + 0.15, min(y - 0.1, mv['dur'] - 0.15)
        if y - x < min(dur, 4): continue
        s0 = min(max(x, mv['t'] - dur / 2), y - min(dur, y - x)); L = min(dur, y - x)
        sc = L - 0.2 * abs(s0 + L / 2 - mv['t'])
        if best is None or sc > best[0]: best = (sc, round(s0, 2), round(L, 2))
    return {'in': best[1], 'len': best[2]} if best and best[2] >= 1.5 else None          # (a clip shorter than its metadata says gives no window)

def scenes_timed(p):
    Tm = json.load(open(os.path.join(WY, 'timings', f'{p}.json'))); dur = Tm['duration']
    Wd = [(re.sub(r"[^a-z0-9']", '', w['w'].lower().replace('’', "'")), w['s'], w['e'], w['w']) for sg in Tm['segments'] for w in sg['words']]
    toks = [w[0] for w in Wd]; norm = lambda s: re.sub(r"[^a-z0-9' ]", ' ', s.lower().replace('’', "'")).split()
    sc = [s for s in S['scenes'] if s['poem'] == p]; at, pos = [], 0
    for s in sc:
        q = [t for l in s.get('lines', []) for t in norm(l)][:4]; hit = None
        for i in range(pos, len(toks) - max(1, len(q)) + 1):
            if q and (toks[i:i + len(q)] == q or (len(q) >= 3 and sum(a == b for a, b in zip(toks[i:i + 3], q[:3])) >= 2)): hit = i; break
        at.append(Wd[hit][1] if hit is not None else None); pos = hit if hit is not None else pos
    at[0] = 0.0
    for i in range(len(at)):
        if at[i] is None or (i and at[i] < at[i - 1]):
            nxt = next((at[j] for j in range(i + 1, len(at)) if at[j] is not None and at[j] > (at[i - 1] if i else 0)), dur); at[i] = (at[i - 1] + nxt) / 2 if i else 0.0
    spans = [(s, at[i], (at[i + 1] if i + 1 < len(sc) else dur)) for i, s in enumerate(sc)]
    return spans, Wd, dur, sorted({round(sg['end'], 2) for sg in Tm['segments']})

def patches_for(p):
    """the patch law: scene edges are hard; inside a scene, cuts every ~9 s on the nearest breath (6–12 s)"""
    spans, Wd, dur, ends = scenes_timed(p); out, prev = [], None
    said = lambda a, b: ' '.join(w[3] for w in Wd if a <= w[1] < b)
    for s, t0, t1 in spans:
        L = t1 - t0; n = max(1, round(L / 9.0)); cuts = [t0]
        for i in range(1, n):
            x = t0 + L * i / n; near = [e for e in ends if cuts[-1] + 6 <= e <= t1 - 6 and abs(e - x) <= 2.5]
            cuts.append(min(near, key=lambda e: abs(e - x)) if near else x)
        cuts.append(t1)
        for i, (a, b) in enumerate(zip(cuts, cuts[1:])):
            trig = (('location change: ' + (s.get('here') or s['d'])) if not prev or prev['d'] != s['d'] or prev['here'] != s.get('here') else 'scene change: ' + s['name']) if i == 0 \
                   else f"phrase boundary: “{said(a, a + 2.5)[:40]}”"
            out.append(dict(scene=s['key'], name=s['name'], d=s['d'], here=s.get('here', ''), what=s['what'], camera=s.get('camera', ''), block=s.get('block', ''),
                            t0=round(a, 2), t1=round(b, 2), said=said(a, b), trigger=trig, figure=bool(FIG.search(s['what'])), hero=bool(HERO.search(s['what'])),
                            montage=bool(MONT.search(s['what'] + ' ' + (s.get('camera') or '')))))
        prev = {'d': s['d'], 'here': s.get('here')}
    tr = next((x for x in S['transitions'] if x['from'] == p), None)
    if tr: out.append(dict(scene=f"T{tr['from']}-{tr['to']}", name=f"{tr['mode']} into {tr['to']}", d=tr['a'], here=tr['zone'], what=tr['grammar'], camera=tr['grammar'], block=tr.get('physical', ''),
                           t0=round(dur, 2), t1=round(dur + 4.0, 2), said='', trigger=f"threshold: {tr['mode']} {tr['from']} → {tr['to']}", figure=False, hero=False, montage=False))
    return out, dur

usedX = None; USEDWIN = collections.defaultdict(list); USEDH = []
def dhash(k):                                            # the picture itself, so the same frame from another file is caught
    try: a = np.asarray(Image.open(inv[k]['path']).convert('L').resize((17, 16)), np.int16); return (a[:, 1:] > a[:, :-1]).flatten()
    except Exception: return None
def fhash(path, t):                                      # the frame a patch actually shows
    r = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t:.2f}', '-i', path, '-frames:v', '1', '-vf', 'scale=17:16,format=gray', '-f', 'rawvideo', '-'], capture_output=True, timeout=30)
    if len(r.stdout) < 272: return None
    a = np.frombuffer(r.stdout[:272], np.uint8).reshape(16, 17).astype(np.int16); return (a[:, 1:] > a[:, :-1]).flatten()
USEDC = []
def fclip(path, t):                                       # what the shown frame is of, so the same subject at another moment is caught too
    import io
    r = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t:.2f}', '-i', path, '-frames:v', '1', '-vf', 'scale=224:-1', '-f', 'image2', '-c:v', 'png', '-'], capture_output=True, timeout=30)
    if not r.stdout: return None
    with torch.no_grad(): e = model.encode_image(prep(Image.open(io.BytesIO(r.stdout)).convert('RGB'))[None]).float()[0].numpy()
    return e / np.linalg.norm(e)
def seen_before(k, mv=None, wdw=None):
    hs = [dhash(k)] + ([fhash(mv['path'], wdw['in'] + wdw['len'] / 2), fhash(mv['path'], wdw['in'] + 0.3)] if mv and wdw else [])
    cs = [X[jof[k]]] + ([fclip(mv['path'], wdw['in'] + wdw['len'] / 2)] if mv and wdw else [])
    dup = any(h is not None and any(int((h != u).sum()) < 40 for u in USEDH) for h in hs) or any(c is not None and USEDC and float(np.max(np.stack(USEDC) @ c)) > 0.88 for c in cs)
    return dup, ([h for h in hs if h is not None], [c for c in cs if c is not None])
def fill(P, used, recent, bw_ok_poem):
    q = enc([P['what'], P['what'], P['said'][:200] or P['what'], P['here'][:200]]).mean(0); q /= np.linalg.norm(q); s = X @ q
    s = s - 0.1 * (photo < -0.01) - 0.02 * (photo < 0.01)
    if P['figure']: s = s + 0.25 * np.clip(person, -0.1, 0.1)
    if P['trigger'].startswith('location'): s = s + 0.12 * np.clip(wide, -0.1, 0.1)
    C = []
    for j in np.argsort(-s)[:150]:
        k = keys[j]
        if k in used or (usedX is not None and float((usedX @ X[j]).max()) > 0.93): continue      # never the same picture again, under any id
        r = inv[k]; v = float(s[j]); own = r.get('source') in OWN; mv = motion_of(k); w, col, paper, lum = look(k)
        src = (mv or {}).get('src') or r.get('video') or k
        if src in recent: continue                                                    # the same source not within 3 patches
        if paper > 0.3: continue
        bw = (mv or {}).get('bw', col < 6)
        if bw and not (P['montage'] or bw_ok_poem): v -= 0.04
        v += 0.015 if own else 0
        if P['hero'] and own and person[j] > 0: v += 0.02
        v += 0.03 if mv else -0.03                                                      # a patch moves
        st = stand.get(k); v += 0.006 if st else 0
        C.append([v, k, mv, src, bw])
    C.sort(key=lambda c: -c[0])
    for c in C[:10]:                                                                    # probe the leaders' footage for a clean window
        if c[2]:
            wdw = window(c[2], P['t1'] - P['t0'])
            if wdw and any(min(wdw['in'] + wdw['len'], b) - max(wdw['in'], a) > 0.3 * wdw['len'] for a, b in USEDWIN[c[3]]): wdw = None   # that stretch of the source is already in the film
            if wdw: c.append(wdw); c[0] += 0.01 * min(1, wdw['len'] / max(1, P['t1'] - P['t0']))
            else: c[0] -= 0.05; c.append(None)
        else: c.append(None)
    C = sorted(C[:10], key=lambda c: -c[0])
    for c in C:
        dup, hs = seen_before(c[1], c[2], c[5])
        if not dup: return c + [hs]
    return None                                                                         # nothing unseen fits: this patch is one to make

smpte = lambda t, base=3600: (lambda f: f"{f // (3600 * FPS):02d}:{f // (60 * FPS) % 60:02d}:{f // FPS % 60:02d}:{f % FPS:02d}")(int(round((t + base) * FPS)))
def scale_of(st, role_wide):
    c = (st or {}).get('cam') or {}
    if c.get('shot_class'): return c['shot_class']
    return 'wide' if role_wide > 0.03 else 'close' if role_wide < -0.03 else 'medium'

film, used = {}, set()
FIGL = re.compile(r'person|man|woman|figure|child|boy|girl|silhouette|people|crowd')
GEN_T = 0.27
for p in sorted({s['poem'] for s in S['scenes']}):
    PS, dur = patches_for(p); recent = collections.deque(maxlen=3); out = []
    bw_ok = sum(1 for x in PS if x['montage']) > len(PS) / 2                           # a poem that is mostly memory may be black-and-white
    for i, P in enumerate(PS):
        c = fill(P, used, recent, bw_ok)
        if not c: out.append({**P, 'id': f'P{p}-{i + 1:03d}', 'k': None, 'generate': True, 'source': 'to make', 'clip': None, 'bw': False, 'lum': 0.0, 'path': None, 'drawn': False, 'analysed': False,
                              'observed': {'detected': [], 'made_of': [], 'clip_tags': [], 'camera': None, 'scale': 'wide' if P['trigger'].startswith('location') else 'medium'}}); continue
        v, k, mv, src, bw, wdw, hs = c; used.add(k); USEDH.extend(hs[0]); USEDC.extend(hs[1]); recent.append(src); (USEDWIN[src].append((wdw['in'], wdw['in'] + wdw['len'])) if wdw else None);  usedX = X[jof[k]][None] if usedX is None else np.vstack([usedX, X[jof[k]]]); r = inv[k]; st = stand.get(k); w, col, paper, lum = look(k)
        out.append({**P, 'id': f'P{p}-{i + 1:03d}', 'k': k, 'fit': round(v, 4), 'source': r.get('source'), 'path': r['path'], 'cid': canon.get(k, {}).get('cid'), 'mj': r.get('n'),
                    'clip': ({'path': mv['path'], 'in': wdw['in'], 'len': wdw['len'], 'src': src, 'title': mv.get('title'), 'year': mv.get('year')} if mv and wdw else None),
                    'bw': bool(bw), 'lum': round(lum, 2), 'width': w, 'sid': st and st['sid'], 'root': st and st['root'], 'analysed': bool(st), 'drawn': bool(st and st['drawn']),
                    'observed': {'detected': (st or {}).get('det') or [], 'made_of': (st or {}).get('stuff') or [], 'clip_tags': tags(k),
                                 'camera': {x: (st or {}).get('cam', {}).get(x) for x in ('shot_class', 'fov_h_deg', 'height_m', 'pitch_deg')} if st else None,
                                 'scale': scale_of(st, float(wide[jof[k]]))},
                    'generate': bool(P['hero'] and person[jof[k]] <= 0 and not any(FIGL.search(d) for d in ((st or {}).get('det') or []))),   # the figure: CLIP or the pipeline's own detection
 'meaning': round(float(X[jof[k]] @ (lambda q: q / np.linalg.norm(q))(enc([P['what'], P['said'][:200] or P['what']]).mean(0))), 4)})
    film[p] = {'title': next(s['title'] for s in S['scenes'] if s['poem'] == p), 'dur': dur, 'shots': out}
    print(p, film[p]['title'], len(out), 'patches ·', sum(1 for x in out if x.get('clip')), 'moving', flush=True)
# the weakest matches in the whole film are the patches to make: the bottom 15% by meaning, and any POET patch with no figure in it
_m = np.array([x['meaning'] for f in film.values() for x in f['shots'] if x.get('k')]); GEN_Q = float(np.percentile(_m, 15))
for f in film.values():
    for x in f['shots']:
        if x.get('k') and x['meaning'] < GEN_Q: x['generate'] = True

# ---------- the matrices ----------
ENT = {'POET': 'the poet, a man (he/his)', 'EX': 'his ex', 'Young POET': 'the poet as a boy', 'ghost': 'the ghost child'}
def ents(P): return [e for e in ('Young POET', 'POET', 'EX') if re.search(r'\b' + e + r'\b', P['what'])] + (['ghost child'] if 'ghost' in P['what'] else []) + (['crowd'] if 'crowd' in P['what'] or 'party' in P['what'] else [])
def light(p, P):
    sc = SCRIPT.get(p, {}); h = sc.get('hour') or [None]; wx = ', '.join(sc.get('weather') or [])
    return f"{DIST.get(P['d'], {}).get('hour', '') or ''} {('hour %.1f' % h[0]) if h and h[0] is not None else ''} {wx}".strip()
def lens_mm(f): return round(18 / math.tan(math.radians(f) / 2)) if f else None
def reforge(p, P, prev):
    o = P.get('observed') or {}; cam = o.get('camera') or {}; e = ents(P) or ['no named figure']
    seen = ', '.join((o.get('detected') or [])[:5] or (o.get('clip_tags') or [])[:4])
    base = f"{seen}; {P['what']}"
    clar = f"{'; '.join(ENT.get(x.split()[0], x) for x in e)} — {P['what']} Place: {P['here']}."
    lm = lens_mm(cam.get('fov_h_deg')); hh = cam.get('height_m')
    cine = f"{o.get('scale')} shot{', ~%d mm' % lm if lm else ''}{', camera %.1f m up' % hh if hh is not None else ''}{', pitch %.0f°' % cam['pitch_deg'] if cam.get('pitch_deg') is not None else ''}; " \
           f"{'black-and-white archival film' if P.get('bw') else 'colour'}; light: {light(p, P) or 'as the source'}; luminance {P.get('lum', 0):.2f}."
    dirp = f"{P['camera'] or ''} {P['block'] or ''}".strip() or 'hold on the action; the figure leads the eye.'
    stress = f"16:9, one continuous shot of {P['t1'] - P['t0']:.1f} s, no cuts, no text, no title cards, no added figures beyond: {', '.join(e)}" \
             + (f"; continues {prev['id']} ({prev.get('observed', {}).get('scale', '')}, {'b&w' if prev.get('bw') else 'colour'})" if prev and prev.get('id') else '') + '.'
    master = f"{clar} {cine} {dirp} {stress}"
    return dict(base=base, clarified=clar, cinematic=cine, director=dirp, stress=stress, master=master)

for p, f in film.items():
    sh = [x for x in f['shots'] if x.get('id')]; prev = None
    for x in sh: x['prompts'] = reforge(p, x, prev); prev = x
    scenes = [s for s in S['scenes'] if s['poem'] == p]; units = [scenes[:max(1, len(scenes) // 3)], scenes[max(1, len(scenes) // 3):max(2, 2 * len(scenes) // 3)], scenes[max(2, 2 * len(scenes) // 3):]]
    gen = [x for x in sh if x['generate']]; own = sum(1 for x in sh if x['source'] in OWN); mov = sum(1 for x in sh if x.get('clip'))
    flips = sum(1 for a, b in zip(sh, sh[1:]) if a['bw'] != b['bw'])
    O = [f"# {p} · {f['title']} — carved", '', '## Brutal Structural Diagnosis',
         f"- {len(sh)} patches over {f['dur']:.0f} s of reading; {mov} move, {len(sh) - mov} are stills that must be animated as drawings.",
         f"- {len(gen)} patches have no footage that shows the event: they must be generated ({', '.join(x['id'] for x in gen[:8])}{'…' if len(gen) > 8 else ''}).",
         f"- {own} of {len(sh)} from our own footage; the rest is found film, so POET only exists where our footage carries him.",
         f"- colour/black-and-white flips: {flips}" + (' — the register breaks; hold it or motivate it as memory.' if flips > 1 else '.'),
         f"- the scene book's longest scene runs {max(t1 - t0 for _, t0, t1 in scenes_timed(p)[0]):.0f} s: it must be carried by patches, not one shot.", '', '## Olog Map']
    rel = [f"<{f['title']}> [is set in] <{DIST.get(scenes[0]['d'], {}).get('name', scenes[0]['d'])}>"]
    for s in scenes:
        rel += [f"<beat {s['key']} {s['name']}> [belongs to] <unit {1 + next(i for i, u in enumerate(units) if s in u)}>", f"<beat {s['key']}> [happens at] <{(s.get('here') or s['d'])[:60]}>"]
        for e in ents({'what': s['what']}): rel.append(f"<{e}> [acts in] <beat {s['key']}>")
    for x in sh[:40]:
        rel += [f"<{x['id']}> [is part of] <beat {x['scene']}>", f"<{x['id']}> [is triggered by] <{x['trigger'][:70]}>", f"<{x['id']}> [is conformed from] <{(x['clip'] or {}).get('src') or x['k']}" + (f" @ {x['clip']['in']:.2f}s>" if x.get('clip') else '>'),
                f"<{x['id']}> [camera relation] <{x['observed']['scale']}>", f"<{x['id']}> [sound state] <her reading{': “' + x['said'][:40] + '”' if x['said'] else ': silence / drone'}>"]
    tr = next((t for t in S['transitions'] if t['from'] == p), None)
    if tr: rel.append(f"<{f['title']}> [crosses threshold] <{tr['zone'][:70]}> "), rel.append(f"<threshold> [leads to] <poem {tr['to']}>")
    O += [f"- {r}" for r in rel] + ['', '## Structural Consequences', '- Segmentation follows the scene book: a scene edge is a hard cut; inside a scene, patches cut on her breaths.',
                                    '- Patch triggers: ' + '; '.join(sorted({x['trigger'].split(':')[0] for x in sh})) + '.']
    A = {'title': f['title'][:40], 'seed': f"{f['title']}: " + '; '.join(s['name'] for s in scenes)[:180],
         'diegesis': {'premise': scenes[0]['what'], 'world_rules': ['the reading sets the clock', 'a scene edge is a hard cut', 'POET is one man throughout'],
                      'core_entities': sorted({e for s in scenes for e in ents({'what': s['what']})}), 'core_locations': list(dict.fromkeys((s.get('here') or s['d'])[:60] for s in scenes))},
         'macro_structure': [{'unit_id': f'U{i + 1}', 'kind': 'sequence', 'function': ' → '.join(s['name'] for s in u)} for i, u in enumerate(units) if u],
         'beat_structure': [{'beat_id': s['key'], 'parent_unit': f"U{1 + next(i for i, u in enumerate(units) if s in u)}", 'syntagma_type': 'accumulative' if MONT.search(s['what']) else 'continuous',
                             'pressure_shift': s['what'][:120]} for s in scenes],
         'patch_timeline': [{'patch_id': x['id'], 'start_time': smpte(x['t0']), 'end_time': smpte(x['t1']), 'location': x['here'][:80], 'entities_present': ents(x),
                             'action_summary': x['what'][:140], 'camera_relation': x['prompts']['cinematic'].split(';')[0], 'light_sound_state': f"{light(p, x)}; her reading" + (f": “{x['said'][:60]}”" if x['said'] else ''),
                             'patch_trigger': x['trigger'], 'source': ((x['clip'] or {}).get('title') or x['source']) + (f" {x['clip']['in']:.2f}+{x['clip']['len']:.2f}s" if x.get('clip') else ' (still)'),
                             'status': 'GENERATE' if x['generate'] else ('moving' if x.get('clip') else 'still → drawing'), 'rehydration_seed': x['prompts']['master'][:400]} for x in sh]}
    B = [f"# Diegesis\n{scenes[0]['what']}\n", '# Macro Structure']
    for i, u in enumerate(units):
        if not u: continue
        B.append(f"## U{i + 1}")
        for s in u:
            B.append(f"### {s['key']} {s['name']}")
            for x in [y for y in sh if y['scene'] == s['key']]:
                B.append(f"#### {x['id']} - {smpte(x['t0'])}–{smpte(x['t1'])}{'  ·  GENERATE' if x['generate'] else ''}\n- **Action**: {x['what']}\n- **Camera/Environment**: {x['prompts']['cinematic']}\n"
                         f"- **Pressure Shift**: {x['trigger']}\n- **Seed**: {x['prompts']['master'][:300]}")
    pn, nx = f"{int(p) - 1:02d}", f"{int(p) + 1:02d}"
    def bp(e, poem):
        sc = [s for s in S['scenes'] if s['poem'] == poem and re.search(r'\b' + e + r'\b', s['what'])]
        if not sc: return {'who': ENT.get(e, e), 'what': 'absent', 'when': f'poem {poem}', 'where': '-', 'why': '-', 'how': '-'}
        s = sc[-1] if poem < p else sc[0]
        return {'who': ENT.get(e, e), 'what': s['what'], 'when': f"poem {poem}, {s['key']}", 'where': s.get('here') or s['d'], 'why': 'the pressure the scene puts on him: ' + s['name'], 'how': s.get('camera') or ''}
    Ebp = {'Scene_Blueprint': {e: {'Previous_Scene': bp(e, pn), 'Current_Scene': bp(e, p), 'Update_Scene': bp(e, nx)} for e in ('POET', 'EX') }}
    F = [f"## {x['id']} — {smpte(x['t0'])} to {smpte(x['t1'])}{'  ·  GENERATE' if x['generate'] else ''}\n- **Patch Event**: {x['what']}\n- **Base Patch Prompt**: {x['prompts']['base']}\n"
         f"- **Clarified Prompt**: {x['prompts']['clarified']}\n- **Cinematic Prompt**: {x['prompts']['cinematic']}\n- **Director Prompt**: {x['prompts']['director']}\n"
         f"- **Stress-Test Prompt**: {x['prompts']['stress']}\n- **Master Patch Prompt**: {x['prompts']['master']}" for x in sh]
    import yaml
    open(os.path.join(CV, f'{p}.yaml'), 'w').write(yaml.safe_dump(A, sort_keys=False, allow_unicode=True, width=200))
    json.dump(Ebp, open(os.path.join(CV, f'{p}_blueprint.json'), 'w'), indent=1, ensure_ascii=False)
    open(os.path.join(CV, f'{p}.md'), 'w').write('\n'.join(O) + '\n\n# Matrix B · Story Map\n' + '\n'.join(B) + '\n\n# Matrix F · Patch Reforge Stack\n' + '\n\n'.join(F) + '\n')
json.dump(film, open(os.path.join(D, 'film.json'), 'w'), indent=1, default=lambda o: o.item() if hasattr(o, 'item') else str(o))
json.dump(PCACHE, open(PCACHE_F, 'w'))
# the pipeline's queue: every patch shot not yet analysed, at the frame the patch shows (the middle of its clean window)
q = []
for p, f in film.items():
    for x in f['shots']:
        if not x.get('k') or x['analysed'] or x['source'] == 'mj': continue   # (patches to make have no shot yet)
        cid = x['cid'] or ('A' + x['k'].replace('-', '_'))
        it = dict(cid=cid, path=x['clip']['path'], kind='keyframe', t=round(x['clip']['in'] + x['clip']['len'] / 2, 2)) if x.get('clip') else dict(cid=cid, path=x['path'], kind='still')
        it.update(source=x['source'], district=x['d'], poem=p, scene=x['scene'], tags=[x['name']]); q.append(it)
json.dump(q, open(os.path.join(D, 'film_queue.json'), 'w'), indent=1)
allp = [x for f in film.values() for x in f['shots'] if x.get('k')]
print('patches', len(allp), '· moving', sum(1 for x in allp if x.get('clip')), '· stills', sum(1 for x in allp if not x.get('clip')), '· GENERATE', sum(x['generate'] for x in allp),
      '· own footage', sum(x['source'] in OWN for x in allp), '· mean', round(np.mean([x['t1'] - x['t0'] for x in allp]), 1), 's')
