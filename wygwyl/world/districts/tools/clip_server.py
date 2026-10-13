#!/usr/bin/env python3
"""A local CLIP scorer for the frustum search: POST /score {"view": n, "imgs": [dataURL, ...]} →
{"cos": [cos to view n], "rank": [rank of view n among all 100 views, 1 = it is the closest]}.
The model is the archive's own (open_clip ViT-B-32 laion2B), so every number is in the same space as the archive,
the canon and the scene book. Run: python3 clip_server.py 8231"""
import os, sys, io, json, base64, glob, numpy as np, torch, open_clip
from http.server import BaseHTTPRequestHandler, HTTPServer
from PIL import Image

HERE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.work')
dev = 'mps' if torch.backends.mps.is_available() else 'cpu'
wts = glob.glob(os.path.expanduser('~/.cache/huggingface/hub/models--laion--CLIP-ViT-B-32-laion2B-s34B-b79K/snapshots/*/open_clip_model.safetensors'))[0]
model, _, prep = open_clip.create_model_and_transforms('ViT-B-32', pretrained=wts); model = model.to(dev).eval()
V = torch.tensor(np.load(os.path.join(HERE, 'emb.npz'))['views'], device=dev)          # the 100 references, view n at row n-1

def embed(imgs):
    out = []
    for i in range(0, len(imgs), 64):
        b = torch.stack([prep(im) for im in imgs[i:i + 64]]).to(dev)
        with torch.no_grad(): out.append(torch.nn.functional.normalize(model.encode_image(b).float(), dim=-1))
    return torch.cat(out)

class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_POST(self):
        q = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
        imgs = [Image.open(io.BytesIO(base64.b64decode(u.split(',', 1)[1]))).convert('RGB') for u in q['imgs']]
        E = embed(imgs); S = E @ V.T; n = q['view'] - 1
        cos = S[:, n]; rank = (S > cos[:, None]).sum(1) + 1
        body = json.dumps({'cos': [round(float(x), 4) for x in cos], 'rank': [int(x) for x in rank]}).encode()
        self.send_response(200); self.send_header('Content-Type', 'application/json'); self.send_header('Content-Length', str(len(body))); self.end_headers(); self.wfile.write(body)

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8231
    print('clip scorer on', port, dev, flush=True); HTTPServer(('127.0.0.1', port), H).serve_forever()
