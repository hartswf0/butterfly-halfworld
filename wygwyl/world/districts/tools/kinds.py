#!/usr/bin/env python3
"""What our references are pictures OF: zero-shot CLIP (the archive's ViT-B-32) over the 100 views and the 2,707 canon shots,
into ten kinds. Only one of them is a building seen from outside; the rest are rooms, streets, land, sky, water, people,
things and light. Writes .work/kinds.json."""
import os, json, glob, numpy as np, torch, open_clip

HERE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.work')
ST = '/Users/gaia/resurrecting atlantis/_dig/media/store'
KINDS = {'building': ['a photo of a building exterior', 'architecture, the facade of a building', 'a tower seen from outside'],
         'interior': ['a photo of an interior room', 'inside a hall or corridor', 'an indoor space'],
         'street': ['a photo of a city street or alley', 'a sidewalk at night', 'an urban street scene'],
         'skyline': ['a city skyline from far away', 'an aerial view of a city'],
         'land': ['a landscape with fields or mountains', 'a beach and the sea', 'a forest or meadow'],
         'sky': ['the night sky, stars or the moon', 'clouds and sky'],
         'water': ['water, a pool or a canal', 'underwater'],
         'people': ['a crowd of people', 'a person, a portrait', 'hands, a close-up of a body'],
         'thing': ['an object close-up', 'a vehicle, a car or a motorcycle', 'a sign or a screen'],
         'light': ['abstract light and colour', 'darkness with a light', 'smoke, fog and haze']}
wts = glob.glob(os.path.expanduser('~/.cache/huggingface/hub/models--laion--CLIP-ViT-B-32-laion2B-s34B-b79K/snapshots/*/open_clip_model.safetensors'))[0]
model, _, _ = open_clip.create_model_and_transforms('ViT-B-32', pretrained=wts); tok = open_clip.get_tokenizer('ViT-B-32')
with torch.no_grad():
    T = []
    for k, ps in KINDS.items():
        f = torch.nn.functional.normalize(model.encode_text(tok(ps)).float(), dim=-1).mean(0); T.append(torch.nn.functional.normalize(f, dim=0).numpy())
T = np.stack(T); names = list(KINDS)
E = np.load(f'{ST}/emb.f16.npy').astype(np.float32); ids = json.load(open(f'{ST}/emb_ids.json')); ix = {k: i for i, k in enumerate(ids)}
canon = json.load(open(f'{ST}/canon.json'))['items']; Cn = np.stack([E[ix[c['k']]] for c in canon])
V = np.load(os.path.join(HERE, 'emb.npz'))['views']
def kind(X):
    s = 100 * X @ T.T; p = np.exp(s - s.max(1, keepdims=True)); p /= p.sum(1, keepdims=True); return p.argmax(1), p.max(1)
out = {}
for name, X in [('views', V), ('canon', Cn)]:
    a, c = kind(X); out[name] = {'kind': [names[i] for i in a], 'conf': [round(float(x), 3) for x in c], 'counts': {n: int((a == i).sum()) for i, n in enumerate(names)}}
    print(name, len(X), sorted(out[name]['counts'].items(), key=lambda kv: -kv[1]))
json.dump(out, open(os.path.join(HERE, 'kinds.json'), 'w'))
