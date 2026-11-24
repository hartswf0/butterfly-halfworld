"""Pick a grey-box seed for every shot from the foundry's own renders, by CLIP (ViT-B-32, laion2b).
Pool: the inverse foundry 'after' renders (inv/*/*-b.jpg, the poem's own first) and the 1,008 world views (w/*-v*.jpg).
Score = CLIP(view, the shot's place words) - CLIP(view, "a map seen from above"), +0.015 for the poem's own renders.
Each shot takes the best view no other shot in the poem has used. Seeds are cropped to 16:9 at 1280x720.
usage: python full/seedpick.py 03 04 05   -> full/seeds03/grey1..8.jpg, and seeds_from + clip scores in the spec"""
import glob, json, os, sys
import numpy as np, torch, open_clip
from PIL import Image
T = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); FD = os.path.join(T, '..', 'foundry')
torch.set_num_threads(2)
m, _, pre = open_clip.create_model_and_transforms('ViT-B-32', pretrained='laion2b_s34b_b79k'); m.eval(); tok = open_clip.get_tokenizer('ViT-B-32')
pool = sorted(glob.glob(f'{FD}/inv/*/*-b.jpg')) + sorted(glob.glob(f'{FD}/w/*-v*.jpg'))
cache = f'{T}/full/seedpool_clip.npy'
if os.path.exists(cache) and np.load(cache).shape[0] == len(pool): E = np.load(cache)
else:
    E = []
    with torch.no_grad():
        for i in range(0, len(pool), 32):
            x = torch.stack([pre(Image.open(p).convert('RGB')) for p in pool[i:i + 32]]); f = m.encode_image(x); E.append((f / f.norm(dim=-1, keepdim=True)).numpy())
    E = np.concatenate(E); np.save(cache, E)
def txt(ts):
    with torch.no_grad(): t = m.encode_text(tok(ts)); return (t / t.norm(dim=-1, keepdim=True)).numpy()
neg = E @ txt(['a map seen from above, a satellite view'])[0]
def fit(p, o):
    im = Image.open(p).convert('RGB'); w, h = im.size; tw = min(w, int(h * 16 / 9)); th = int(tw * 9 / 16)
    im.crop(((w - tw) // 2, (h - th) // 2, (w + tw) // 2, (h + th) // 2)).resize((1280, 720), Image.LANCZOS).save(o, quality=85)
used = set()   # a view seeds one shot only, across every poem picked in this run
for num in sys.argv[1:]:
    S = json.load(open(f'{T}/full/{num}grey.json')); os.makedirs(f'{T}/full/seeds{num}', exist_ok=True)
    own = np.array([f'/inv/' in p and os.path.basename(p).startswith(num + '-') for p in pool])
    # describe the place, not the man: CLIP should match the world the shot needs
    Q = txt([f"a dark low-poly grey-box video game world at dusk: {s['action'].replace('He ', 'a path ').replace(' he ', ' ')}" for s in S['shots']])
    S['seeds_from'] = {}; S['seed_scores'] = {}
    for i, q in enumerate(Q):
        sc = E @ q - .5 * neg + .015 * own
        for j in np.argsort(-sc):
            if j not in used: break
        used.add(j); fit(pool[j], f'{T}/full/seeds{num}/grey{i + 1}.jpg')
        S['seeds_from'][f'grey{i + 1}.jpg'] = os.path.relpath(pool[j], os.path.join(T, '..')); S['seed_scores'][f'grey{i + 1}.jpg'] = round(float(sc[j]), 4)
    json.dump(S, open(f'{T}/full/{num}grey.json', 'w'), indent=1); print(num, list(S['seeds_from'].values()))
