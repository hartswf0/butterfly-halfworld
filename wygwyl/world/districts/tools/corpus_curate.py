#!/usr/bin/env python3
"""WHICH STANDS GO INTO THE WORLD. wygwyl-world-arch's world holds 81 dioramas; our corpus has ~2,250 stands, and their viewer (rightly)
cannot hold them all. Per district, at most --per stands, chosen as an editor would:
  1 a photographed place, not graphic material (collages, title cards, line animation, contact sheets): CLIP, the archive's own
    embedding, against 'a photograph of a place' vs 'a collage / a poster / a drawing / a grid of photographs / a screenshot'
  2 recurring places first (sets.json: one place seen from several measured cameras), then the rest
  3 a trustworthy camera (the ground plane's own confidence) and a good fit to the district (CLIP)
  4 one stand per video, so a district is many takes, not one clip
Writes .work/corpus/curated.json."""
import os, sys, json, glob, collections, numpy as np, torch, open_clip

T = os.path.dirname(os.path.abspath(__file__)); WK = os.path.join(T, '.work', 'corpus'); OUT = os.path.join(WK, 'out'); ST = '/Users/gaia/resurrecting atlantis/_dig/media/store'
PER = int(sys.argv[sys.argv.index('--per') + 1]) if '--per' in sys.argv else 16
canon = {x['cid']: x for x in json.load(open(f'{ST}/canon.json'))['items']}; ids = {k: i for i, k in enumerate(json.load(open(f'{ST}/emb_ids.json')))}
E = np.load(f'{ST}/emb.f16.npy', mmap_mode='r')
wts = glob.glob(os.path.expanduser('~/.cache/huggingface/hub/models--laion--CLIP-ViT-B-32-laion2B-s34B-b79K/snapshots/*/open_clip_model.safetensors'))[0]
model, _, _ = open_clip.create_model_and_transforms('ViT-B-32', pretrained=wts); tok = open_clip.get_tokenizer('ViT-B-32')
PLACE = ['a photograph of a place', 'a film still of a room', 'a cinematic photograph of a street at night', 'a photograph of a landscape']
GRAPHIC = ['a collage', 'a poster with text', 'a line drawing', 'a grid of photographs', 'a screenshot of a user interface', 'a title card', 'a cut-out paper collage']
with torch.no_grad(): TX = model.encode_text(tok(PLACE + GRAPHIC)).float(); TX = (TX / TX.norm(dim=-1, keepdim=True)).numpy()

R = []
for sj in glob.glob(f'{OUT}/*/shot.json'):
    if not os.path.exists(os.path.join(os.path.dirname(sj), 'multiplane', 'multiplane.json')): continue
    S = json.load(open(sj)); C = S['corpus']; k = canon.get(C['cid'], {}).get('k')
    if k not in ids: continue
    R.append({'sid': S['id'], 'cid': C['cid'], 'd': C.get('district') or S.get('district'), 'video': C.get('video') or C['cid'], 'sim': C.get('sim') or 0,
              'conf': (S['camera'].get('physics_confidence') or 0), 'row': ids[k]})
X = np.asarray(E[[r['row'] for r in R]], np.float32); X /= np.linalg.norm(X, axis=1, keepdims=True)
s = X @ TX.T; place, graphic = s[:, :len(PLACE)].max(1), s[:, len(PLACE):].max(1)
inset = {c for st in json.load(open(f'{WK}/sets.json'))['sets'] for c in st['views']}
for i, (r, p, g) in enumerate(zip(R, place, graphic)): r['photo'] = bool(p > g + 0.015); r['set'] = r['cid'] in inset; r['i'] = i   # a clear margin: borderline cut-outs stay out
pick = collections.defaultdict(list)
for r in sorted(R, key=lambda r: (not r['set'], -(r['conf'] * 0.5 + r['sim']))):
    if not r['photo'] or len(pick[r['d']]) >= PER or any(q['video'] == r['video'] for q in pick[r['d']]): continue
    if any(float(X[r['i']] @ X[q['i']]) > 0.95 for v in pick.values() for q in v): continue   # the same picture under another id
    pick[r['d']].append(r)
json.dump({d: [q['sid'] for q in v] for d, v in pick.items()}, open(f'{WK}/curated.json', 'w'), indent=1)
print('stands', len(R), '· photographic', sum(r['photo'] for r in R), '· graphic', sum(not r['photo'] for r in R))
print('curated', {d: len(v) for d, v in sorted(pick.items())}, 'total', sum(map(len, pick.values())))
