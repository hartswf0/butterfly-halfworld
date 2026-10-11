#!/usr/bin/env python3
"""THE FILM, POEM BY POEM: the most followable telling of each poem from everything we have, timed to her reading, and made only of
shots the drawing pipeline (wygwyl-world-arch: analyze → multiplane → scene program) can turn into flat drawings to animate.
  time        each scene-book scene is found in the reading's word timings (timings/NN.json); its shots share its span
  shots       a scene gets: an establish shot when the poem opens or the story changes district · inserts where its camera asks
              ('insert on the TV') · action shots for the rest, one per ~6 s, each cast for the words spoken during it, so the
              picture follows the line
  the pool    54,815 pictures: found footage, our generated and Markov footage, film keyframes, the 100 Midjourney views (never
              'shoot', nothing under /CAT/ or /cdmx/)
  a fit       CLIP against the slot (action twice, the spoken words, the place) · a photographed place, not graphic material ·
              the figure when the scene has one, our own footage when it is POET or the EX (one poet across the film) ·
              shot scale by role (wide to establish, close for an insert) · one register: black-and-white found footage only where
              the scene is montage, memory or world chaos · size (soft) · already analysed, already drawn, and how well it drew
  the cut     a sequence (Viterbi): the same take or recurring place carries continuity, a near-duplicate never follows itself,
              flipping footage family or colour register costs; then at most two shots from one take per poem, a picture once
Writes .work/story/film.json (every shot with its time) and .work/story/film_NN.jpg; the queue of shots still to analyse."""
import os, re, json, glob, math, collections, numpy as np, torch, open_clip
from PIL import Image, ImageDraw, ImageFont, ImageStat

T = os.path.dirname(os.path.abspath(__file__)); W = os.path.join(T, '.work'); ST = '/Users/gaia/resurrecting atlantis/_dig/media/store'
WY = os.path.join(T, '..', '..', '..'); OUTC = os.path.join(W, 'corpus', 'out'); D = os.path.join(W, 'story'); os.makedirs(D, exist_ok=True)
ARCH = '/Users/gaia/Downloads/WYGWYL-WORLD-ARCH/shots/out'
S = json.load(open(os.path.join(T, '..', 'scenes.json')))
ids = json.load(open(f'{ST}/emb_ids.json')); E = np.load(f'{ST}/emb.f16.npy', mmap_mode='r')
inv = {}
for l in open(f'{ST}/inventory.jsonl'): r = json.loads(l); inv[r['k']] = r
for l in open(f'{ST}/keyframes.jsonl'):
    r = json.loads(l); v = inv.get(r['video'], {}); inv[r['k']] = {**r, 'source': v.get('source'), 'poem': v.get('poem'), 'kind': 'keyframe', 'video_path': v.get('path')}
canon = {x['k']: x for x in json.load(open(f'{ST}/canon.json'))['items']}; cid2k = {x['cid']: x['k'] for x in canon.values()}
def private(r): p = (r.get('video_path') or r.get('path') or ''); return r.get('source') == 'shoot' or '/CAT/' in p or '/cdmx/' in p.lower()
rows = [i for i, k in enumerate(ids) if k in inv and not private(inv[k]) and inv[k].get('kind') in ('image', 'keyframe') and os.path.exists(inv[k]['path'])]
keys = [ids[i] for i in rows]; X = np.asarray(E[rows], np.float32)
V = np.load(os.path.join(W, 'emb.npz'))['views'].astype(np.float32); vfiles = json.load(open(os.path.join(T, 'views.json')))
for n in range(1, 101):
    k = f'mj{n:03d}'; keys.append(k); inv[k] = {'k': k, 'path': os.path.join(T, '..', 'v', f'{n:03d}.webp'), 'source': 'mj', 'kind': 'image', 'n': n,
                                                'sid': vfiles[n - 1].rsplit('_', 2)[1] + '_' + vfiles[n - 1].rsplit('_', 1)[1].split('.')[0]}
X = np.concatenate([X, V]); X /= np.linalg.norm(X, axis=1, keepdims=True); jof = {k: j for j, k in enumerate(keys)}
print('pool', len(keys), flush=True)

wts = glob.glob(os.path.expanduser('~/.cache/huggingface/hub/models--laion--CLIP-ViT-B-32-laion2B-s34B-b79K/snapshots/*/open_clip_model.safetensors'))[0]
model, _, _ = open_clip.create_model_and_transforms('ViT-B-32', pretrained=wts); tok = open_clip.get_tokenizer('ViT-B-32')
def enc(ts):
    with torch.no_grad(): t = model.encode_text(tok(ts)).float()
    return (t / t.norm(dim=-1, keepdim=True)).numpy()
mx = lambda ts: (X @ enc(ts).T).max(1)
photo = mx(['a photograph of a place', 'a film still of a room', 'a cinematic photograph of a street at night', 'a photograph of a landscape', 'a film still of a person']) \
      - mx(['a collage', 'a poster with text', 'a line drawing', 'an ink drawing', 'a grid of photographs', 'a screenshot of a user interface', 'a title card', 'a cut-out paper collage', 'an audio waveform', 'a diagram', 'a contact sheet of film frames', 'a split screen of several photographs', 'a filmstrip', 'an ink wash painting on white paper'])
person = mx(['a film still of a man', 'a film still of a woman', 'a film still of a child', 'a person in a room']) - mx(['an empty room', 'an empty street', 'a landscape with no people'])
wide = mx(['a wide establishing shot of a place', 'an aerial view of a city', 'a long shot of a building']) - mx(['a close-up', 'an extreme close-up of a face', 'a close-up of an object'])

# what the pipeline knows: analysed, drawn, how well it drew
stand = {}
def drew(pd):
    try: return json.load(open(os.path.join(pd, 'scene.json')))['score']
    except Exception: return None
for sj in glob.glob(f'{OUTC}/*/shot.json'):
    if not os.path.exists(os.path.join(os.path.dirname(sj), 'multiplane', 'multiplane.json')): continue
    s = json.load(open(sj)); c = (s.get('corpus') or {}).get('cid') or ''; k = cid2k.get(c) or (c[1:].replace('_', '-') if c.startswith('A') else c)
    stand[k] = {'sid': s['id'], 'root': OUTC, 'drawn': drew(os.path.join(os.path.dirname(sj), 'program'))}
for k, r in inv.items():
    if r.get('source') == 'mj' and os.path.exists(os.path.join(ARCH, r['sid'], 'shot.json')): stand[k] = {'sid': r['sid'], 'root': ARCH, 'drawn': drew(os.path.join(ARCH, r['sid'], 'program'))}
sets = json.load(open(os.path.join(W, 'corpus', 'sets.json')))['sets']
place_of = {cid2k.get(c, c): n for n, st in enumerate(sets) for c in st['views']}
OWN = {'markov', 'halfworld', 'generated', 'film', 'other', 'mj'}
FIG = re.compile(r'\b(POET|EX|he|his|him|child|children|kid|girl|boy|woman|man|crowd|figure|lovers?|mother|father|parents|they|people)\b')
HERO = re.compile(r'\b(POET|EX|Young POET|ghost (?:kid|child))\b')
INS = re.compile(r'\b(?:insert|close|cutaway)s? (?:on|of|to) (?:the |a |an |his |her )?([^;,.]+)', re.I)
MONT = re.compile(r'montage|images of|chaos|\bTV\b|television|news|archiv|memor|flashback|the world|history|crowd', re.I)

LOOK = {}
def look(k):                                              # width, colourfulness (Hasler–Süsstrunk), so black-and-white is known
    if k in LOOK: return LOOK[k]
    try:
        im = Image.open(inv[k]['path']); w = im.size[0]; a = np.asarray(im.convert('RGB').resize((64, 36)), np.float32)
        rg, yb = a[..., 0] - a[..., 1], 0.5 * (a[..., 0] + a[..., 1]) - a[..., 2]
        col = float(np.hypot(rg.std(), yb.std()) + 0.3 * np.hypot(rg.mean(), yb.mean()))
        paper = float((a.mean(-1) > 225).mean())                                # ink on paper: a white ground a photograph rarely has
    except Exception: w, col, paper = 0, 0.0, 0.0
    LOOK[k] = (w, col, paper); return LOOK[k]

def scenes_timed(p):
    """each scene's span in the reading: its first line found in the word timings; unfound scenes sit between their neighbours"""
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
            nxt = next((at[j] for j in range(i + 1, len(at)) if at[j] is not None and at[j] > (at[i - 1] if i else 0)), dur)
            at[i] = (at[i - 1] + nxt) / 2 if i else 0.0
    spans = []
    for i, s in enumerate(sc):
        t0, t1 = at[i], (at[i + 1] if i + 1 < len(sc) else dur)
        spans.append((s, t0, max(t1, t0 + 2.5)))
    ends = sorted({round(sg['end'], 2) for sg in Tm['segments']})                     # her breaths: where a phrase ends
    return spans, Wd, dur, ends

def slots_for(p):
    spans, Wd, dur, ends = scenes_timed(p); out, prev_d = [], None
    snap = lambda x, a, b: min([e for e in ends if a + 1.5 < e < b - 1.5] or [x], key=lambda e: abs(e - x)) if abs(min([e for e in ends if a + 1.5 < e < b - 1.5] or [x], key=lambda e: abs(e - x)) - x) < 2.5 else x
    said = lambda a, b: ' '.join(w[3] for w in Wd if a <= w[1] < b)
    for s, t0, t1 in spans:
        ctx = dict(scene=s['key'], name=s['name'], d=s['d'], what=s['what'], figure=bool(FIG.search(s['what'])), hero=bool(HERO.search(s['what'])),
                   montage=bool(MONT.search(s['what'] + ' ' + (s.get('camera') or ''))))
        parts, t = [], t0
        if prev_d != s['d']:
            parts.append(dict(role='establish', text=[s.get('here', ''), s.get('position', '')], figure=False, hero=False, len=min(4.0, (t1 - t0) * 0.3)))
        prev_d = s['d']
        ins = [m.group(1).strip()[:120] for m in INS.finditer(s.get('camera') or '')]
        rest = (t1 - t0) - sum(x['len'] for x in parts) - 3.0 * len(ins)
        n = max(1, round(rest / 6.0));
        for i in range(n): parts.append(dict(role='action', text=None, len=rest / n))
        for x in ins: parts.insert(len(parts) - (n // 2), dict(role='insert', text=[x, s['what']], figure=False, hero=False, len=3.0))
        for ii, x in enumerate(parts):
            a = t; b = t1 if ii == len(parts) - 1 else snap(t + x['len'], t, t1); t = b      # every cut on the nearest breath
            words = said(a, b)
            if x['text'] is None: x['text'] = [s['what'], s['what'], words[:200], s.get('position', '')]
            out.append({**ctx, **{k: v for k, v in x.items() if k != 'len'}, 't0': round(a, 2), 't1': round(b, 2), 'said': words})
    tr = next((x for x in S['transitions'] if x['from'] == p), None)
    if tr: out.append(dict(scene=f"T{tr['from']}-{tr['to']}", name=f"{tr['mode']} into {tr['to']}", d=tr['a'], what=tr['zone'], role='transition', text=[tr['zone'], tr['grammar']],
                           figure=False, hero=False, montage=False, t0=round(dur, 2), t1=round(dur + 3.0, 2), said=''))
    return out, dur

def emit(sl, K=40):
    tx = [t for t in sl['text'] if t]; q = enc(tx).mean(0); q /= np.linalg.norm(q); s = X @ q
    s = s - 0.08 * (photo < -0.01) - 0.02 * (photo < 0.01)
    if sl['figure']: s = s + 0.25 * np.clip(person, -0.1, 0.1)
    if sl['role'] == 'establish': s = s + 0.15 * np.clip(wide, -0.1, 0.1)
    if sl['role'] == 'insert': s = s - 0.15 * np.clip(wide, -0.1, 0.1)
    top = np.argsort(-s)[:K * 3]; C = []
    for j in top:
        k = keys[j]; r = inv[k]; v = float(s[j]); own = r.get('source') in OWN
        v += 0.015 if own else 0
        if sl['hero'] and own and person[j] > 0: v += 0.02                    # POET and the EX are our footage's people
        st = stand.get(k)
        if st: v += 0.004 + (0.006 + 0.01 * max(0, 1 - st['drawn'].get('dE', 10) / 10) if st['drawn'] else 0)
        C.append([v, k])
    C.sort(reverse=True); C = C[:K]
    for c in C:
        w, col, paper = look(c[1]); c[0] += 0.012 * min(1, w / 960) - (0.02 if w < 300 else 0) - (0.1 if paper > 0.3 else 0)
        if col < 6 and not (sl['montage'] or sl['role'] in ('insert', 'transition')): c[0] -= 0.03   # black-and-white only where it means memory
    return C

def trans(a, b, same_scene):
    if a == b: return -1.0
    ra, rb = inv[a], inv[b]; v = 0.0
    if ra.get('video') and ra.get('video') == rb.get('video'): v += 0.02 if same_scene else -0.01
    if place_of.get(a) is not None and place_of.get(a) == place_of.get(b): v += 0.03
    sim = float(X[jof[a]] @ X[jof[b]]); v += 0.02 if 0.6 < sim < 0.9 else -0.06 if sim >= 0.93 else 0
    if (ra.get('source') in OWN) != (rb.get('source') in OWN): v -= 0.012
    if (look(a)[1] < 6) != (look(b)[1] < 6): v -= 0.01
    return v

film, used = {}, set()
F = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 12); FB = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 12)
for p in sorted({s['poem'] for s in S['scenes']}):
    SL, dur = slots_for(p); CS = [[c for c in emit(sl) if c[1] not in used] for sl in SL]
    sc = [[c[0] for c in CS[0]]]; bk = [[-1] * len(CS[0])]
    for i in range(1, len(SL)):
        ss = SL[i]['scene'] == SL[i - 1]['scene']; row, br = [], []
        for c in CS[i]:
            best, bi = -9, -1
            for h, pc in enumerate(CS[i - 1]):
                v = sc[-1][h] + trans(pc[1], c[1], ss)
                if v > best: best, bi = v, h
            row.append(best + c[0]); br.append(bi)
        sc.append(row); bk.append(br)
    j = int(np.argmax(sc[-1])); path = []
    for i in range(len(SL) - 1, -1, -1): path.append(j); j = bk[i][j]
    path = path[::-1]; per_take = collections.Counter(); shots = []
    for i, (sl, j) in enumerate(zip(SL, path)):
        order = [CS[i][j]] + [c for c in CS[i] if c is not CS[i][j]]
        pick = next((c for c in order if c[1] not in used and per_take[inv[c[1]].get('video') or c[1]] < 2
                     and all(float(X[jof[c[1]]] @ X[jof[x['k']]]) < 0.93 for x in shots)), order[0])
        k = pick[1]; used.add(k); per_take[inv[k].get('video') or k] += 1; r = inv[k]; st = stand.get(k); w, col, _ = look(k)
        shots.append({**{x: sl[x] for x in ('scene', 'name', 'role', 'd', 't0', 't1', 'said', 'what')}, 'k': k, 'source': r.get('source'), 'kind': r.get('kind'),
                      'path': r['path'], 'video': r.get('video'), 't': r.get('t'), 'video_path': r.get('video_path'), 'cid': canon.get(k, {}).get('cid'), 'mj': r.get('n'),
                      'width': w, 'bw': col < 6, 'sid': st and st['sid'], 'root': st and st['root'], 'drawn': bool(st and st['drawn']), 'analysed': bool(st),
                      'place': place_of.get(k), 'fit': round(pick[0], 4)})
    film[p] = {'title': next(s['title'] for s in S['scenes'] if s['poem'] == p), 'dur': dur, 'shots': shots}
    TW, TH, PER = 240, 135, 6; nrow = math.ceil(len(shots) / PER)
    im = Image.new('RGB', (TW * PER, (TH + 34) * nrow + 26), (12, 12, 14)); g = ImageDraw.Draw(im)
    g.text((6, 6), f"{p} {film[p]['title']} - {len(shots)} shots, {dur:.0f} s", fill=(242, 165, 65), font=FB)
    for i, sh in enumerate(shots):
        x, y = (i % PER) * TW, 26 + (i // PER) * (TH + 34)
        try: t = Image.open(sh['path']).convert('RGB'); t.thumbnail((TW - 4, TH)); im.paste(t, (x + 2, y))
        except Exception: pass
        g.text((x + 3, y + TH + 2), f"{sh['t0']:.0f}s {sh['scene']} {sh['role']}"[:40], fill=(236, 230, 218), font=FB)
        g.text((x + 3, y + TH + 17), (f"“{sh['said'][:34]}”" if sh['said'] else f"{sh['source']} {sh['width']}px"), fill=(150, 160, 190), font=F)
    im.save(os.path.join(D, f'film_{p}.jpg'), quality=82)
json.dump(film, open(os.path.join(D, 'film.json'), 'w'), indent=1)
CL = '/Users/gaia/resurrecting atlantis/CINEOSIS_44/lab/clips'; q = []
for p, f in film.items():
    for s in f['shots']:
        if s['analysed'] or s['source'] == 'mj': continue
        cid = s['cid'] or ('A' + s['k'].replace('-', '_'))
        if s['kind'] == 'keyframe' and s.get('video_path') and os.path.exists(s['video_path']) and s['video_path'].lower().endswith(('.mp4', '.mov', '.webm', '.m4v')):
            it = dict(cid=cid, path=s['video_path'], kind='keyframe', t=s['t'])
        else:
            u = os.path.splitext(os.path.basename(s['path']))[0]; clip = os.path.join(CL, u + '.mp4')
            it = dict(cid=cid, path=clip, kind='keyframe', t=0.6) if os.path.exists(clip) else dict(cid=cid, path=s['path'], kind='still')
        it.update(source=s['source'], district=s['d'], poem=p, scene=s['scene'], tags=[s['name'], s['role']]); q.append(it)
json.dump(q, open(os.path.join(D, 'film_queue.json'), 'w'), indent=1)
allc = [s for f in film.values() for s in f['shots']]
print('shots', len(allc), '· roles', dict(collections.Counter(s['role'] for s in allc)), '· sources', dict(collections.Counter(s['source'] for s in allc)))
print('black-and-white', sum(s['bw'] for s in allc), '· drawn', sum(s['drawn'] for s in allc), '· analysed', sum(s['analysed'] for s in allc), '· to analyse', len(q),
      '· mean shot', round(np.mean([s['t1'] - s['t0'] for s in allc]), 1), 's')
