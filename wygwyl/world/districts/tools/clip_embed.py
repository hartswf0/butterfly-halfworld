#!/usr/bin/env python3
"""Put the 100 world views into the archive's own CLIP space (open_clip ViT-B-32 laion2B, the model engine.py used),
with the poems' set pieces as text, and the movie map's disc as pictures of the city we already have.
Writes emb.npz (all vectors) for analyse.py."""
import os, json, glob, numpy as np, torch, open_clip
from PIL import Image

HERE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.work'); os.makedirs(HERE, exist_ok=True)
ARCH = '/Users/gaia/Downloads/WYGWYL-WORLD-ARCH'
DIG = '/Users/gaia/resurrecting atlantis/_dig'
MM = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../moviemap')
dev = 'mps' if torch.backends.mps.is_available() else 'cpu'
wts = glob.glob(os.path.expanduser('~/.cache/huggingface/hub/models--laion--CLIP-ViT-B-32-laion2B-s34B-b79K/snapshots/*/open_clip_model.safetensors'))[0]
model, _, prep = open_clip.create_model_and_transforms('ViT-B-32', pretrained=wts); model = model.to(dev).eval()
tok = open_clip.get_tokenizer('ViT-B-32')

def img_feats(ims):
    out = []
    for i in range(0, len(ims), 32):
        b = torch.stack([prep(im) for im in ims[i:i + 32]]).to(dev)
        with torch.no_grad(): f = model.encode_image(b).float()
        out.append(torch.nn.functional.normalize(f, dim=-1).cpu().numpy())
    return np.concatenate(out)

def txt_feats(ts):
    out = []
    for i in range(0, len(ts), 64):
        with torch.no_grad(): f = model.encode_text(tok(ts[i:i + 64]).to(dev)).float()
        out.append(torch.nn.functional.normalize(f, dim=-1).cpu().numpy())
    return np.concatenate(out)

# 1. the 100 views (1-based numbering, sorted filenames: same order as the board)
names = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'views.json')))   # view n is names[n-1]: the board's numbering
views = img_feats([Image.open(os.path.join(ARCH, n)).convert('RGB') for n in names])

# 2. the set pieces of the fourteen poems, as text (what happens + where), and each poem's place
scenes, stext = [], []
for n in range(1, 15):
    j = json.load(open(f'{DIG}/world/poems/{n:02d}.json'))
    L = j['location']
    scenes.append({'poem': j['num'], 'k': -1, 'name': L['name'], 'kind': 'place'})
    stext.append(f"{L['kind']}, {j['weather_light']}"[:300])
    for k, sp in enumerate(j['set_pieces']):
        scenes.append({'poem': j['num'], 'k': k, 'name': sp['name'], 'kind': 'piece'})
        stext.append(f"{sp['what_happens']} {sp.get('position', '')}"[:300])
scene_f = txt_feats(stext)

# 3. the city we already have: one front frame from the middle of every disc sheet (the street at noon)
disc = json.load(open(f'{MM}/disc.json'))
frames, fmeta = [], []
for p in sorted(glob.glob(f'{MM}/disc/e5/*_0_*.webp')):
    sh = Image.open(p).convert('RGB'); W, H = 432, 288; cols = sh.width // W; n = (sh.width // W) * (sh.height // H)
    i = n // 2; frames.append(sh.crop(((i % cols) * W, (i // cols) * H, (i % cols) * W + W, (i // cols) * H + H)))
    fmeta.append(os.path.basename(p))
disc_f = img_feats(frames) if frames else np.zeros((0, 512), np.float32)

np.savez(os.path.join(HERE, 'emb.npz'), views=views, scenes=scene_f, disc=disc_f)
json.dump({'scenes': scenes, 'scene_text': stext, 'disc': fmeta}, open(os.path.join(HERE, 'emb_meta.json'), 'w'))
print('views', views.shape, 'scenes', scene_f.shape, 'disc', disc_f.shape)
