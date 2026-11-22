"""Minimal Atlas Developer API client. The key is injected by the session's network proxy (WLT-Api-Key header)."""
import base64, json, os, ssl, time, urllib.request, uuid
B = 'https://api.atlas.worldlabs.ai/api/v2'
CTX = ssl.create_default_context(cafile=os.environ.get('SSL_CERT_FILE'))
KEY = os.environ.get('WLT_API_KEY', 'proxy-injected')

def call(method, path, body=None, idem=None, timeout=120):
    h = {'WLT-Api-Key': KEY, 'Content-Type': 'application/json'}
    if idem: h['Idempotency-Key'] = idem
    rq = urllib.request.Request(B + path, method=method, data=None if body is None else json.dumps(body).encode(), headers=h)
    try:
        return json.load(urllib.request.urlopen(rq, timeout=timeout, context=CTX))
    except urllib.error.HTTPError as e:
        raise RuntimeError(f'{method} {path} -> HTTP {e.code}: {e.read().decode()[:1500]}')

def upload(path, name=None):
    b = base64.b64encode(open(path, 'rb').read()).decode()
    r = call('POST', '/assets', {'asset': {'displayName': name or os.path.basename(path), 'base64': b}}, idem='up-' + uuid.uuid4().hex)
    a = r.get('asset', r); return a['id'] if 'id' in a else a['assetId']

def submit(task, body, idem):
    return call('POST', f'/tasks:{task}', body, idem=idem)['id']

def wait(op_id, every=10, limit=7200):
    t0 = time.time()
    while True:
        try: op = call('GET', f'/operations/{op_id}')
        except RuntimeError as e:
            if '404' in str(e): time.sleep(every); continue
            raise
        if op.get('done'): return op
        if time.time() - t0 > limit: raise TimeoutError(op_id)
        time.sleep(every)

def fetch(url, dst):
    urllib.request.urlretrieve(url, dst); return dst
