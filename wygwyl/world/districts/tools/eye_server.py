#!/usr/bin/env python3
"""THE EYE — so the search can see for itself instead of a person looking at every frame.
  POST /likeness {"view": n, "frames": [[cls...], ...], "near": [[...], ...]}  →  {"dino": [...]}
      Each candidate is drawn as a LANGUAGE IMAGE (every pixel in its class's colour, shaded by nearness) exactly as the view's own
      reading is drawn; DINOv2 (ViT-S/14) compares the two patch by patch. Same kind of image on both sides, so the likeness is about
      shape (receding columns, an arch, a deck) and not about a grey box failing to look like a painting.
  POST /describe {"images": [dataURL, ...]}  →  {"caption": [...], "tags": [[...]], "emb": [...]}
      BLIP's caption and CLIP's nearest words from the archive's vocabulary, so a found frame can be judged in words.
CORS is open to the local page. Run: python3 eye_server.py 8232"""
import os, sys, io, json, base64, glob, numpy as np, torch, open_clip
from http.server import BaseHTTPRequestHandler, HTTPServer
from PIL import Image
import torch.nn.functional as F

T = os.path.dirname(os.path.abspath(__file__)); WK = os.path.join(T, '.work'); ST = '/Users/gaia/resurrecting atlantis/_dig/media/store'
dev = 'mps' if torch.backends.mps.is_available() else 'cpu'
dino = torch.hub.load(os.path.expanduser('~/.cache/torch/hub/facebookresearch_dinov2_main'), 'dinov2_vits14', source='local').eval().to(dev)
from transformers import BlipProcessor, BlipForConditionalGeneration
bp = BlipProcessor.from_pretrained('Salesforce/blip-image-captioning-large'); blip = BlipForConditionalGeneration.from_pretrained('Salesforce/blip-image-captioning-large').eval().to(dev)
wts = glob.glob(os.path.expanduser('~/.cache/huggingface/hub/models--laion--CLIP-ViT-B-32-laion2B-s34B-b79K/snapshots/*/open_clip_model.safetensors'))[0]
clip, _, cprep = open_clip.create_model_and_transforms('ViT-B-32', pretrained=wts); clip = clip.to(dev).eval()
VOC = json.load(open(f'{ST}/text_meta.json'))['vocab']; VE = torch.tensor(np.load(f'{ST}/vocab.npy').astype(np.float32), device=dev)
COL = np.array([[30, 40, 70], [200, 120, 80], [150, 60, 50], [120, 120, 120], [40, 110, 200], [60, 160, 70], [230, 200, 60], [120, 90, 70], [240, 80, 200], [80, 230, 230]], np.float32)
GW, GH, IW, IH = 96, 54, 392, 224                                   # language grids, and the DINO input (28 × 16 patches)
MEAN = torch.tensor([0.485, 0.456, 0.406], device=dev)[:, None, None]; STD = torch.tensor([0.229, 0.224, 0.225], device=dev)[:, None, None]

def lang_image(cls, near):                                          # class colour × (0.35 + 0.65 · nearness): the shared picture
    c = COL[np.minimum(np.asarray(cls, np.uint8).reshape(GH, GW), 9)] * (0.35 + 0.65 * np.asarray(near, np.float32).reshape(GH, GW, 1))
    t = torch.tensor(c / 255, device=dev).permute(2, 0, 1)[None]; t = F.interpolate(t, (IH, IW), mode='nearest')[0]
    return (t - MEAN) / STD
def patches(batch):
    with torch.no_grad(): f = dino.forward_features(torch.stack(batch).float())['x_norm_patchtokens']
    return F.normalize(f, dim=-1)                                   # (B, 448, 384)
REF = {}
def ref_feat(n):
    if n not in REF:
        z = np.load(f'{WK}/lang/{n:03d}.npz'); d = np.load(f'{WK}/lang/{n:03d}-depth.npy')
        REF[n] = patches([lang_image(z['cls'], d)])[0]
    return REF[n]

class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def _ok(self, obj):
        b = json.dumps(obj).encode(); self.send_response(200); self.send_header('Content-Type', 'application/json'); self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Length', str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_OPTIONS(self):
        self.send_response(204); self.send_header('Access-Control-Allow-Origin', '*'); self.send_header('Access-Control-Allow-Headers', '*'); self.send_header('Access-Control-Allow-Methods', 'POST'); self.end_headers()
    def do_POST(self):
        q = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
        if self.path == '/likeness':
            R = ref_feat(q['view']); out = []
            fr = q['frames']
            for i in range(0, len(fr), 32):
                P = patches([lang_image(c, nr) for c, nr in zip(fr[i:i + 32], q['near'][i:i + 32])])
                out += [round(float(x), 4) for x in (P * R[None]).sum(-1).mean(-1)]    # mean cosine of corresponding patches
            return self._ok({'dino': out})
        if self.path == '/describe':
            ims = [Image.open(io.BytesIO(base64.b64decode(u.split(',', 1)[1]))).convert('RGB') for u in q['images']]
            with torch.no_grad():
                ids = blip.generate(**bp(images=ims, return_tensors='pt').to(dev), max_new_tokens=24)
                caps = [bp.decode(x, skip_special_tokens=True) for x in ids]
                e = F.normalize(clip.encode_image(torch.stack([cprep(i) for i in ims]).to(dev)).float(), dim=-1)
            s = e @ VE.T; tags = [[VOC[j] for j in row.topk(5).indices.tolist()] for row in s]
            return self._ok({'caption': caps, 'tags': tags, 'emb': e.cpu().numpy().round(4).tolist()})
        self.send_response(404); self.end_headers()

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8232
    print('eye on', port, dev, flush=True); HTTPServer(('127.0.0.1', port), H).serve_forever()
