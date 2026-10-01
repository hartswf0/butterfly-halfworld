#!/usr/bin/env python3
"""
THE DOOR — one index for everything this archive made.

    python3 cut/pf/door.py

Why this exists: there were thirty-nine instruments, four libraries, five cuts
and twenty-four notes, and every one of them had its own front page. None of
them had a front page. The repository's own index.html links to three things and
does not know this archive exists; wygwyl/atlas.html indexes the sibling body of
work. So the honest answer to "where is the single index" was: nowhere. This
builds it.

The entries are declared by hand, because what a thing IS cannot be measured —
but everything measurable is measured here and nothing is typed twice:

    href exists?  ->  file count  ->  bytes  ->  last touched  ->  a real preview

A preview is pulled from the collection itself (first image, or a frame lifted
from the first clip at 1/3 in). An entry whose href is missing is not silently
dropped: it renders struck through, with the reason, because an index that hides
its own dead links is worth less than no index.
"""
import os, sys, json, subprocess, hashlib, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np, cv2

BASE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # .../MARKOV_POET_ARCHIVE-FLY
OUT  = os.path.join(BASE, 'index.html')
THUMBS = os.path.join(BASE, 'door_thumbs')
EDGE, Q = 460, 74

from door_entries import *


# This pass writes index.html and door_strips into the archive it is measuring.
# Counting its own output as evidence would date every entry to today and erase
# the whole chronology, so it is excluded by name wherever the disk is read.
MINE_DIRS = {'door_thumbs', 'door_strips'}
_mine_cache = {}
def is_mine(path):
    """An index.html is excluded only if THIS pass wrote it. Excluding the name
       outright was wrong: OPERATOR 15, OPERATOR 14 and PASTE are each a single
       index.html, so the rule measured them as zero files and quietly dropped
       all three out of the chronology. The sheets this pass writes carry a
       data-door marker; nothing else does."""
    if os.path.basename(path) != 'index.html': return False
    if path in _mine_cache: return _mine_cache[path]
    try:
        with open(path, 'rb') as fh: head = fh.read(220)
        v = (b'data-door' in head) or os.path.abspath(path) == os.path.abspath(OUT)
    except OSError: v = False
    _mine_cache[path] = v
    return v

def walk(p, cap=40000):
    """count, bytes, and WHEN — for a file, itself; for a dir, everything under it.
       The dates are the 5th and 95th percentile of the mtimes, not the min and
       max: one file touched last week should not restate when the work happened."""
    if os.path.isfile(p):
        s = os.stat(p)
        return 1, s.st_size, [min(s.st_mtime, getattr(s, 'st_birthtime', s.st_mtime) or s.st_mtime)]
    n = b = 0; ts = []
    for root, dirs, files in os.walk(p):
        dirs[:] = [d for d in dirs if not d.startswith('.') and d not in MINE_DIRS]
        for f in files:
            if f.startswith('.'): continue
            fp = os.path.join(root, f)
            if is_mine(fp): continue
            try: s = os.stat(fp)
            except OSError: continue
            n += 1; b += s.st_size
            ts.append(min(s.st_mtime, getattr(s, 'st_birthtime', s.st_mtime) or s.st_mtime))
            if n >= cap: return n, b, ts
    return n, b, ts

def when(ts):
    if not ts: return (0.0, 0.0, 0.0)
    ts = sorted(ts)
    return (ts[len(ts)//20], ts[-1 - len(ts)//20], ts[(len(ts)-1)//2])

def pick_source(p):
    """the image this collection should show: its own first image, or a frame from its first clip"""
    d = p if os.path.isdir(p) else os.path.dirname(p)
    if os.path.isfile(p) and p.lower().endswith(VIDX): return ('vid', p)
    imgs, vids = [], []
    for root, dirs, files in os.walk(d):
        dirs[:] = sorted(x for x in dirs if not x.startswith('.') and x not in ('plates','thumbs','elements'))
        for f in sorted(files):
            l = f.lower()
            if l.endswith(IMGX) and not l.startswith('.'): imgs.append(os.path.join(root, f))
            elif l.endswith(VIDX): vids.append(os.path.join(root, f))
        if imgs or vids: break
        if root.count(os.sep) - d.count(os.sep) >= 2: break
    if imgs: return ('img', imgs[0])
    if vids: return ('vid', vids[0])
    return (None, None)

def frame_of(path, out):
    """a frame one third of the way in — the first frame of a cut is often black"""
    dur = 0.0
    try:
        r = subprocess.run(['ffprobe','-v','error','-show_entries','format=duration',
                            '-of','default=nw=1:nk=1', path], capture_output=True, text=True, timeout=30)
        dur = float((r.stdout or '0').strip() or 0)
    except Exception: pass
    at = max(0.0, dur/3.0) if dur > 1.5 else 0.0
    try:
        subprocess.run(['ffmpeg','-v','error','-ss',f'{at:.2f}','-i',path,'-frames:v','1',
                        '-y', out], capture_output=True, timeout=60)
        return os.path.exists(out) and os.path.getsize(out) > 0
    except Exception: return False

def thumb(src, kind, dst):
    tmp = dst + '.src.png'
    if kind == 'vid':
        if not frame_of(src, tmp): return False
        src = tmp
    im = cv2.imread(src, cv2.IMREAD_UNCHANGED)
    if im is None:
        if os.path.exists(tmp): os.remove(tmp)
        return False
    if im.dtype != np.uint8:
        im = cv2.normalize(im, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
    if im.ndim == 2: im = cv2.cvtColor(im, cv2.COLOR_GRAY2BGR)
    if im.shape[2] == 4:
        # a cut-out is mostly transparent nothing — crop to what is actually there,
        # then lay it on paper, because a checkerboard is not the aesthetic
        a = im[:,:,3]; ys, xs = np.nonzero(a > 12)
        if len(ys): im = im[ys.min():ys.max()+1, xs.min():xs.max()+1]
        al = im[:,:,3:4].astype(np.float32)/255.0
        im = (im[:,:,:3].astype(np.float32)*al + 244.0*(1.0-al)).astype(np.uint8)
    ih, iw = im.shape[:2]
    s = min(1.0, EDGE/float(max(ih, iw)))
    if s < 1.0: im = cv2.resize(im, (max(1,int(iw*s)), max(1,int(ih*s))), interpolation=cv2.INTER_AREA)
    ok = cv2.imwrite(dst, im, [cv2.IMWRITE_WEBP_QUALITY, Q])
    if os.path.exists(tmp): os.remove(tmp)
    return bool(ok)


# Bayer 8x8, the same ordered matrix the tools dither with
BAYER = np.array([[ 0,32, 8,40, 2,34,10,42],[48,16,56,24,50,18,58,26],
                  [12,44, 4,36,14,46, 6,38],[60,28,52,20,62,30,54,22],
                  [ 3,35,11,43, 1,33, 9,41],[51,19,59,27,49,17,57,25],
                  [15,47, 7,39,13,45, 5,37],[63,31,55,23,61,29,53,21]], np.float32) / 64.0

def mark(eid, dst, cells=(46, 23), cell=10):
    """An entry with no image of its own gets a real ink field, not a screenshot
       borrowed from its neighbour: a seeded smooth field quantised to eight
       levels through the ordered matrix and drawn with the tools' own disc law,
       radius = CELL*0.5*(lv/7)^0.72*1.24. It is a placeholder that tells the
       truth about what the thing behind it is made of."""
    rs = np.random.RandomState(int(hashlib.md5(eid.encode()).hexdigest()[:8], 16))
    cw, ch = cells
    f = np.zeros((ch, cw), np.float32)
    for oct_, amp in ((2, 1.0), (4, 0.55), (8, 0.28), (16, 0.14)):
        g = rs.rand(max(2, oct_ * ch // cw + 1), oct_).astype(np.float32)
        f += amp * cv2.resize(g, (cw, ch), interpolation=cv2.INTER_CUBIC)
    f -= f.min(); f /= max(1e-6, float(np.ptp(f)))   # numpy 2: ndarray.ptp is gone
    b = BAYER[np.arange(ch) % 8][:, np.arange(cw) % 8]
    lv = np.clip(np.floor(f * 7.0 + (b - 0.5) * 1.1 + 0.5), 0, 7).astype(np.int32)
    im = np.full((ch * cell, cw * cell, 3), 228, np.uint8)
    for y in range(ch):
        for x in range(cw):
            v = int(lv[y, x])
            if v == 0: continue
            r = cell * 0.5 * (v / 7.0) ** 0.72 * 1.24
            cv2.circle(im, (int(x * cell + cell / 2), int(y * cell + cell / 2)),
                       max(1, int(round(r))), (20, 20, 20), -1, cv2.LINE_AA)
    return bool(cv2.imwrite(dst, im, [cv2.IMWRITE_WEBP_QUALITY, 88]))

def esc(s):
    return (s.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;').replace('"','&quot;'))

def human(b):
    for u, d in (('GB',1e9), ('MB',1e6), ('KB',1e3)):
        if b >= d: return f'{b/d:.1f} {u}' if b/d < 100 else f'{b/d:.0f} {u}'
    return f'{b} B'



# --------------------------------------------------- what survives a clone
# Measuring the disk answers "is it here". It does not answer "will it be here
# for anyone else", and those turned out to be very different questions: the
# five cuts, the segments, the halfworlds and the 135 generated shots are all
# on this disk and none of them is in the repository. An index that does not
# say so sends a visitor to fourteen 404s.
def git_state():
    try:
        top = subprocess.run(['git','rev-parse','--show-toplevel'], cwd=BASE,
                             capture_output=True, text=True, timeout=20).stdout.strip()
        ls = subprocess.run(['git','ls-files','-z'], cwd=top,
                            capture_output=True, text=True, timeout=120).stdout
        return top, set(x for x in ls.split('\0') if x)
    except Exception as ex:
        print(f'  ! git unreadable ({ex}); repository state will not be shown')
        return None, None


# ----------------------------------------------------------------- the media map
# Four of the five cuts are over GitHub's 100 MB per-file limit, so the video
# lives on a release instead. cut/pf/media.json maps the path a page already
# uses to the URL that actually serves it. Nothing here has a release URL typed
# into it, and with no map every path falls back to local — which is what a copy
# of the archive on a drive needs. Two ways of holding it, one set of sources.
try:
    _m = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'media.json')))
    MEDIA, MEDIA_TAG = _m.get('media', {}), _m.get('tag', '')
except Exception:
    MEDIA, MEDIA_TAG = {}, ''

def served(relpath):
    """the URL that serves this file, or None if only the disk has it"""
    return MEDIA.get(os.path.normpath(relpath).replace(os.sep, '/'))

GIT_TOP, GIT_FILES = git_state()

# What each entry should show of itself, and how it differs from the rest —
# chosen and measured by cut/pf/strips.py, which is a separate pass because it
# costs minutes and this one costs seconds.
try:
    STRIPS = json.load(open(os.path.join(BASE, 'door_strips', 'index.json')))
except Exception:
    STRIPS = {}
    print('  ! no door_strips/index.json — run cut/pf/strips.py for moving previews')

def tracked(paths):
    """how many files under these roots git knows about"""
    if GIT_FILES is None: return None
    n = 0
    for x in paths:
        r = os.path.relpath(x, GIT_TOP).replace(os.sep, '/')
        if r in GIT_FILES: n += 1; continue
        pre = r.rstrip('/') + '/'
        n += sum(1 for f in GIT_FILES if f.startswith(pre))
    return n

# ------------------------------------------------------- the folder sheets
# Fourteen entries point at a directory. A local server redirects a bare
# directory to a listing; GitHub Pages returns 404. So every directory entry
# gets a real page written into it — which is better anyway: clicking THE META
# COLLAGES should show the fourteen posters, not a list of filenames.
SHEET_CAP = 300          # render media for this many; list the rest honestly
THUMB_MIRROR = {'cut/out/elements': 'cut/out/thumbs'}   # 1.1 GB of PNG has an 8.9 MB web-sized twin

SHEET_CSS = """
*{box-sizing:border-box;margin:0;padding:0;border-radius:0!important}
body{background:#f4f4f0;color:#141414;font:400 14px/1.6 "Helvetica Neue",Helvetica,Arial,sans-serif;
 padding:0 20px 80px;-webkit-font-smoothing:antialiased}
.wrap{max-width:1180px;margin:0 auto}
header{border-bottom:3px solid #141414;padding:28px 0 18px;margin-bottom:26px}
.up{font:700 10px/1 ui-monospace,Menlo,monospace;letter-spacing:.18em;text-transform:uppercase;
 color:#0033cc;text-decoration:none;display:inline-block;margin-bottom:18px}
h1{font:900 clamp(21px,4vw,34px)/1.08 Helvetica,Arial;letter-spacing:.03em;text-transform:uppercase}
h1 small{display:block;font:700 10px/1 ui-monospace,monospace;letter-spacing:.2em;color:#8a8a86;margin-top:11px}
.lede{margin:16px 0 0;max-width:68ch;font-size:15px}
.note{margin:12px 0 0;font:400 12px/1.5 ui-monospace,Menlo,monospace;color:#8a6d00;
 border-left:2px solid #8a6d00;padding-left:9px;max-width:68ch}
.tot{margin:14px 0 0;font:700 11px/1.6 ui-monospace,monospace;letter-spacing:.06em;color:#8a8a86}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(236px,1fr));gap:12px}
.it{border:2px solid #141414;background:#fdfdfa;display:flex;flex-direction:column}
.it a.box{display:block;background:#e4e4e0;border-bottom:2px solid #141414}
.it img,.it video{width:100%;display:block;background:#e4e4e0}
.it .cap{padding:9px 10px;font:400 11px/1.4 ui-monospace,Menlo,monospace;word-break:break-all}
.it .cap b{display:block;font-weight:700;margin-bottom:3px}
.it .cap span{color:#8a8a86}
.rows{border:2px solid #141414;background:#fdfdfa;margin-top:16px}
.rows a{display:flex;gap:14px;justify-content:space-between;padding:8px 12px;border-bottom:1px solid #e4e4e0;
 font:400 12px/1.4 ui-monospace,Menlo,monospace;color:#141414;text-decoration:none}
.rows a:last-child{border-bottom:0}
.rows a:hover{background:#141414;color:#fdfdfa}
.rows span{color:#8a8a86;white-space:nowrap}
.rows em{font-style:normal;color:#8a8a86;flex:1 1 auto;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-left:10px}
.rows a:hover em{color:#a8a8a4}
.rows a:hover span{color:#a8a8a4}
.more{margin:22px 0 10px;font:700 10px/1 Helvetica;letter-spacing:.2em;text-transform:uppercase;color:#8a8a86;
 border-top:2px solid #141414;padding-top:12px}
.absent-note{margin:14px 0 0;max-width:72ch;font:400 12.5px/1.6 ui-monospace,Menlo,monospace;
 color:#8a6d00;border-left:3px solid #8a6d00;padding-left:11px}
.absent-note b{color:#141414}
body.absent .grid{opacity:.4}
body.absent .it{background:#f0f0ec}
@media(max-width:560px){body{padding:0 13px 70px}.grid{grid-template-columns:1fr 1fr;gap:8px}}
"""


# A sheet listing 300 clips that are not served from this host is 300 grey
# rectangles and no explanation. Sample a handful on load; if none of them
# answer, say so at the top instead of letting the page fail silently.
SHEET_JS = """<script>
(function(){
 var m=[].slice.call(document.querySelectorAll('.it img[src], .it video[src], .it audio[src]'));
 if(!m.length) return;
 var step=Math.max(1,Math.floor(m.length/6)), s=[];
 for(var i=0;i<m.length && s.length<6;i+=step) s.push(m[i]);
 Promise.all(s.map(function(el){
   return fetch(el.getAttribute('src'),{method:'HEAD'})
     .then(function(r){return r.ok?1:0;}).catch(function(){return 0;});
 })).then(function(r){
   var ok=r.reduce(function(a,b){return a+b;},0);
   if(ok) return;
   document.body.classList.add('absent');
   var h=document.querySelector('header');
   if(h) h.insertAdjacentHTML('beforeend','<p class="absent-note"><b>None of these files are '
    + 'served from here.</b> This sheet lists what is in the folder on the disk it was made on; '
    + 'the files themselves were never pushed \\u2014 they are renders and segments, not sources. '
    + 'The listing, the names and the sizes are real. Open this from a copy of the archive and '
    + 'every item plays.</p>');
 });
})();
</script>"""

def sheet(r, base):
    """Write a contact sheet into a directory entry. Never clobbers a page that
       is already there — an existing index.html is somebody's work."""
    roots = r.get('roots') or []
    dirs = [x for x in roots if os.path.isdir(x)]
    if not dirs: return None
    tgt = os.path.normpath(os.path.join(base, r['href']))
    if not os.path.isdir(tgt): return None
    out = os.path.join(tgt, 'index.html')
    if os.path.exists(out) and not open(out).read(400).count('data-door'): return None

    items = []
    for d in dirs:
        for root, sub, files in os.walk(d):
            sub[:] = sorted(x for x in sub if not x.startswith('.'))
            for f in sorted(files):
                if f.startswith('.') or f == 'index.html': continue
                fp = os.path.join(root, f)
                items.append((os.path.relpath(fp, tgt), fp, os.path.getsize(fp)))
    items.sort(key=lambda t: t[0])

    mirror = None
    for k, v in THUMB_MIRROR.items():
        if os.path.normpath(os.path.join(base, k)) in dirs:
            mirror = os.path.normpath(os.path.join(base, v))
    cards, rows, nserved = [], [], 0
    for i, (rel, fp, sz) in enumerate(items):
        l = rel.lower()
        _u = served(os.path.relpath(fp, base))
        if _u: nserved += 1
        href = _u or '/'.join(urlq(x) for x in rel.split(os.sep))
        if i < SHEET_CAP and l.endswith(IMGX):
            src = href
            if mirror:
                m = os.path.join(mirror, os.path.splitext(os.path.basename(rel))[0] + '.webp')
                if os.path.exists(m): src = os.path.relpath(m, tgt).replace(os.sep, '/')
            cards.append(f'<div class="it"><a class="box" href="{href}">'
                         f'<img src="{src}" alt="" loading="lazy" decoding="async"></a>'
                         f'<div class="cap"><b>{esc(rel)}</b><span>{human(sz)}</span></div></div>')
        elif i < SHEET_CAP and l.endswith(VIDX):
            # preload=none: a folder of 46 clips must not pull 1.4 GB to open
            cards.append(f'<div class="it"><div class="box">'
                         f'<video src="{href}" controls preload="none" playsinline></video></div>'
                         f'<div class="cap"><b>{esc(rel)}</b><span>{human(sz)}</span></div></div>')
        elif i < SHEET_CAP and l.endswith(('.wav', '.m4a', '.mp3', '.aac', '.flac', '.ogg')):
            cards.append(f'<div class="it"><div class="cap"><b>{esc(rel)}</b><span>{human(sz)}</span>'
                         f'<audio src="{href}" controls preload="none" style="width:100%;margin-top:7px"></audio>'
                         f'</div></div>')
        else:
            # a folder of notes is unreadable as filenames; give each one its title
            sub_ = ''
            if l.endswith('.md'):
                try:
                    for ln in open(fp, errors='replace'):
                        t = ln.strip().lstrip('#').strip()
                        if t and not t.startswith('---'): sub_ = t[:92]; break
                except OSError: pass
            rows.append(f'<a href="{href}">{esc(rel)}'
                        + (f'<em>{esc(sub_)}</em>' if sub_ else '')
                        + f'<span>{human(sz)}</span></a>')

    nb = sum(t[2] for t in items)
    extra = (f'<div class="more">the remaining {len(rows):,} files, listed</div>'
             if rows and len(items) > SHEET_CAP else
             (f'<div class="more">files</div>' if rows else ''))
    html = (f'<!doctype html><html lang="en" data-door="1"><head><meta charset="utf-8">'
            f'<meta name="viewport" content="width=device-width,initial-scale=1">'
            f'<title>{esc(r["name"])}</title><style>{SHEET_CSS}</style></head><body><div class="wrap">'
            f'<header><a class="up" href="{rel_to_door(tgt, base)}">← THE DOOR</a>'
            f'<h1>{esc(r["name"])}<small>{r["id"]}</small></h1>'
            f'<p class="lede">{esc(r["line"])}</p>'
            + (f'<p class="note">{esc(r["note"])}</p>' if r['note'] else '')
            + f'<p class="tot">{len(items):,} FILES &middot; {human(nb)}'
            + (f' &middot; SHOWING THE FIRST {SHEET_CAP}' if len(items) > SHEET_CAP else '')
            + '</p></header>'
            + (f'<div class="grid">{"".join(cards)}</div>' if cards else '')
            + extra + (f'<div class="rows">{"".join(rows)}</div>' if rows else '')
            + SHEET_JS + '</div></body></html>')
    open(out, 'w').write(html)
    r['sheet'] = (len(items), min(len(items), SHEET_CAP) if cards else 0)
    r['served'] = nserved
    return out

def urlq(x):
    return x.replace('%', '%25').replace('#', '%23').replace('?', '%3F').replace(' ', '%20')

def rel_to_door(tgt, base):
    return os.path.relpath(os.path.join(base, 'index.html'), tgt).replace(os.sep, '/')

# ------------------------------------------------------------------- measure
os.makedirs(THUMBS, exist_ok=True)
rows, dead, nopreview = [], [], []
for eid, kind, name, href, line, note in E:
    p = os.path.normpath(os.path.join(BASE, href))
    r = dict(id=eid, kind=kind, name=name, href=href, line=line, note=note,
             ok=os.path.exists(p), n=0, bytes=0, mtime=0, t_lo=0, t_hi=0, t_mid=0,
             thumb='', noun='files')
    if not r['ok']:
        dead.append((eid, href)); rows.append(r); continue
    m = MEASURE.get(eid)
    if m is None:
        m = os.path.dirname(href) if os.path.basename(href) == 'index.html' else href
    ms = m if isinstance(m, list) else [m]
    ms = [os.path.normpath(os.path.join(BASE, x)) for x in ms if x]
    ms = [x for x in ms if os.path.exists(x)] or [p]
    stamps = []
    for x in ms:
        n, b, t = walk(x)
        r['n'] += n; r['bytes'] += b; stamps += t
    r['t_lo'], r['t_hi'], r['t_mid'] = when(stamps)
    r['mtime'] = r['t_hi']
    r['roots'] = ms
    r['git'] = tracked(ms)
    mp = ms[0]
    if eid in COUNT:
        cf, noun = COUNT[eid]
        try:
            r['n'] = len(json.load(open(os.path.normpath(os.path.join(BASE, cf)))))
            r['noun'] = noun
        except Exception as ex:
            print(f'    ! {eid} manifest unreadable: {ex}')
    r['has_strip'] = bool(STRIPS.get(eid)) and os.path.exists(
        os.path.join(BASE, 'door_strips', eid + '.webp'))
    if r['has_strip']:
        rows.append(r)               # the strip supersedes the still AND the mark
        print(f"  {eid}  {name[:28]:28s} {r['n']:6d} {r['noun']:7s} {human(r['bytes']):>9s}  strip")
        continue
    if eid in NOPREVIEW:
        sk, ss = None, None
    else:
        pv = PREVIEW.get(eid)
        sk, ss = pick_source(os.path.normpath(os.path.join(BASE, pv))) if pv else pick_source(mp)
    if ss:
        q = os.path.join(THUMBS, f'{eid}.webp')
        if os.path.exists(q) and '--refresh' not in sys.argv:
            r['thumb'] = f'door_thumbs/{eid}.webp'
        elif thumb(ss, sk, q):
            r['thumb'] = f'door_thumbs/{eid}.webp'
            r['from'] = os.path.relpath(ss, BASE)
    if not r['thumb']:
        q = os.path.join(THUMBS, f'{eid}_mark.webp')
        if (os.path.exists(q) and '--refresh' not in sys.argv) or mark(eid, q):
            r['thumb'] = f'door_thumbs/{eid}_mark.webp'; r['drawn'] = True
        nopreview.append(eid)
    rows.append(r)
    print(f"  {eid}  {name[:28]:28s} {r['n']:6d} {r['noun']}  {human(r['bytes']):>9s}  {'thumb' if r['thumb'] else '—'}", flush=True)

sheets = []
for r in rows:
    if not r['ok']: continue
    try:
        w = sheet(r, BASE)
        if w: sheets.append(os.path.relpath(w, BASE))
    except Exception as ex:
        print(f"    ! {r['id']} sheet failed: {ex}")
if sheets:
    print(f"\n  {len(sheets)} folder sheets written (a bare directory is a 404 on Pages):")
    for x in sheets: print(f"    {x}")

live = [r for r in rows if r['ok']]
allroots = sorted({x for r in live for x in r.get('roots', [])})
tops = []
for x in allroots:
    if not any(x != y and x.startswith(y.rstrip(os.sep) + os.sep) for y in allroots):
        tops.append(x)
TOT_N = TOT_B = 0
for x in tops:
    n, b, _ = walk(x); TOT_N += n; TOT_B += b
print(f'\n  total over {len(tops)} distinct roots ({len(allroots)-len(tops)} nested, not double-counted)')

# ---------------------------------------------------------------- the page
def dots(eid):
    """a four-dot mark seeded by the id, for an entry with no image of its own —
       a drawn placeholder is honest where a borrowed screenshot is not"""
    h = int(hashlib.md5(eid.encode()).hexdigest(), 16)
    out = []
    for i in range(16):
        lv = (h >> (i*3)) & 7
        if lv < 3: continue
        x, y = 12 + (i % 4) * 26, 12 + (i // 4) * 26
        out.append(f'<circle cx="{x}" cy="{y}" r="{2.2 + lv*1.5:.1f}"/>')
    return ('<svg class="dots" viewBox="0 0 110 110" aria-hidden="true">'
            f'<g fill="#141414">{"".join(out)}</g></svg>')


# ------------------------------------------- the difference that makes a difference
# Five measurements per entry, z-scored against all the others by strips.py. The
# axis an entry sits furthest out on is what actually tells it apart from its
# neighbours — said in words, with the number and the median it departs from, so
# the claim can be checked rather than believed.
APART = {
 'light':   ('brighter than anything else here', 'darker than anything else here'),
 'contrast':('harder in its blacks and whites',  'flatter — it lives in the middle'),
 'detail':  ('busier — more happening per inch', 'emptier — more space than mark'),
 'colour':  ('more colour',                      'closest to grey'),
 'variety': ('the least alike inside itself',    'the most uniform inside itself'),
}
def apart_line(eid):
    a = (STRIPS.get(eid) or {}).get('apart')
    if not a or abs(a['z']) < 0.75: return ''      # not actually apart; say nothing
    words = APART.get(a['axis'], (a['axis'], a['axis']))[0 if a['dir'] == 'more' else 1]
    v, m = a['value'], a['median']
    fmt = (lambda x: f'{x:.0f}') if abs(m) >= 10 else (lambda x: f'{x:.2f}')
    w = max(2, min(100, int(abs(a['z']) / 3.0 * 100)))
    return (f'<div class="apart"><i style="width:{w}%"></i>'
            f'<span><b>{esc(words)}</b> \u2014 {fmt(v)} against a median of {fmt(m)}</span></div>')

MON = ('JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC')
def dated(lo, hi):
    if not lo: return ''
    a, b = time.localtime(lo), time.localtime(hi)
    if (a.tm_year, a.tm_mon, a.tm_mday) == (b.tm_year, b.tm_mon, b.tm_mday):
        return f'{MON[a.tm_mon-1]} {a.tm_mday}'
    if (a.tm_year, a.tm_mon) == (b.tm_year, b.tm_mon):
        return f'{MON[a.tm_mon-1]} {a.tm_mday}\u2013{b.tm_mday}'
    return f'{MON[a.tm_mon-1]} {a.tm_mday} \u2013 {MON[b.tm_mon-1]} {b.tm_mday}'

cards = []
seq = sorted([r for r in live if r['t_mid']], key=lambda r: r['t_mid'])
SEQ = {r['id']: i + 1 for i, r in enumerate(seq)}
for r in rows:
    cls = 'card' + ('' if r['ok'] else ' gone')
    meta = ('<span class="gonetag">LINK DEAD</span>' if not r['ok'] else
            f"<span>{r['n']:,} {r['noun']}{'' if r['noun'].endswith('s') else 's'}</span><span>{human(r['bytes'])}</span>"
            f"<span>{dated(r['t_lo'], r['t_hi'])}</span>"
            + ('<span class="rel">ON THE RELEASE</span>'
               if (any(served(os.path.relpath(x, BASE)) for x in (r.get('roots') or []))
                   or (r.get('served') and r['served'] >= 0.8 * r['n'])) else
               '' if r.get('git') is None else
               ('<span class="disk">DISK ONLY</span>' if r['git'] == 0 else
                (f'<span class="part">IN REPO {r["git"]:,}/{r["n"]:,}</span>'
                 if r['git'] < r['n'] else ''))))
    note = r['note']
    if r.get('sheet'):
        n_, shown = r['sheet']
        made = (f'Contact sheet generated into the folder: {shown} of {n_:,} shown, the rest listed.'
                if n_ > shown else 'Contact sheet generated into the folder.')
        note = (note + '  ' + made) if note else made
    st = STRIPS.get(r['id'])
    if st and os.path.exists(os.path.join(BASE, 'door_strips', r['id'] + '.webp')):
        pv = (f'<i class="strip" data-n="{st["frames"]}" '
              f'style="background-image:url(door_strips/{r["id"]}.webp)" '
              f'title="{st["frames"]} frames chosen to span this, out of {st["n_cand"]} looked at"></i>')
    elif r['thumb']:
        pv = (f'<img src="{esc(r["thumb"])}" alt="" loading="lazy" decoding="async"'
              + (' class="drawn" title="drawn ink field \u2014 this entry has no image of its own">'
                 if r.get('drawn') else '>'))
    else:
        pv = dots(r['id'])
    where = esc(r['href'] if r['href'].endswith(('.html', '.md', '.mp4')) else r['href'].rstrip('/') + '/')
    body = (f'<div class="pv">{pv}</div>'
            f'<div class="txt"><div class="hd"><span class="eid">{r["id"]}</span>'
            f'<h3>{esc(r["name"])}</h3>'
            + (f'<span class="seq">{SEQ[r["id"]]}<small>/{len(seq)}</small></span>' if r['id'] in SEQ else '')
            + '</div>'
            f'<p class="line">{esc(r["line"])}</p>'
            + apart_line(r['id'])
            + (f'<p class="note">{esc(note)}</p>' if note else '')
            + f'<div class="meta">{meta}</div>'
            f'<div class="where">{where}</div></div>')
    hay = esc((r['id'] + ' ' + r['name'] + ' ' + r['line'] + ' ' + r['note'] + ' ' + r['href']).lower())
    link = served(r['href']) or r['href']
    if r['ok']:
        cards.append(f'<a class="{cls}" id="{r["id"]}" href="{esc(link)}" '
                     f'data-k="{r["kind"]}" data-h="{hay}">{body}</a>')
    else:
        cards.append(f'<div class="{cls}" id="{r["id"]}" data-k="{r["kind"]}" data-h="{hay}">{body}</div>')

# ------------------------------------------------------------- the chronology
# The dates are not decoration. Read in order they are the only record of how
# this went: the halfworlds and the radio first, then the carrier, then the
# harvest and the cut-outs, then the collages, then the operators, then the
# zettels and the board, then the meta and the second pass, then the sound. The
# file system remembered it even where nothing was written down.
days, order = [], []
for r in seq:
    d = time.strftime('%Y-%m-%d', time.localtime(r['t_mid']))
    if not days or days[-1][0] != d: days.append((d, []))
    days[-1][1].append(r)
KCOL = {'operate':'#0033cc','browse':'#8a6d00','look':'#141414',
        'watch':'#cf222e','stock':'#6a6a6a','read':'#0a5'}
for d, rs in days:
    t = time.localtime(time.mktime(time.strptime(d, '%Y-%m-%d')))
    chips = ''.join(
      f'<a class="chip" href="#{r["id"]}" data-k="{r["kind"]}" '
      f'style="--c:{KCOL.get(r["kind"], "#141414")}">'
      f'<b>{r["id"]}</b>{esc(r["name"])}</a>' for r in rs)
    order.append(f'<div class="day"><div class="dh">{MON[t.tm_mon-1]} <b>{t.tm_mday}</b>'
                 f'<small>{len(rs)}</small></div><div class="chips">{chips}</div></div>')
# ---------------------------------------------------------------- the ways in
NAMES = {r['id']: r for r in rows}
ways = []
for title, sub, steps in PATHS:
    li = []
    for n, (eid, why) in enumerate(steps, 1):
        r = NAMES.get(eid)
        if not r:
            print(f'  ! path "{title}" names {eid}, which is not an entry'); continue
        li.append(f'<a class="step" href="#{eid}"><span class="sn">{n}</span>'
                  f'<span class="st"><b>{esc(r["name"])}</b>{esc(why)}</span>'
                  f'<span class="sid">{eid}</span></a>')
    ways.append(f'<div class="way"><h3>{esc(title)}<small>{esc(sub)}</small></h3>{"".join(li)}</div>')
WAYS = ('<h2 id="start">START <small>three ways in \u00b7 pick the one that is yours</small></h2>'
        f'<div class="ways">{"".join(ways)}</div>') if ways else ''

WHEN = ('<h2 id="when">WHEN <small>the order the work happened, dated off the filesystem \u00b7 '
        f'{len(days)} days \u00b7 {dated(seq[0]["t_mid"], seq[-1]["t_mid"]) if seq else ""}</small></h2>'
        f'<div class="when">{"".join(order)}</div>') if seq else ''

tabs = ''.join(f'<button class="tab" data-f="{k}">{lab}<small>{sum(1 for r in live if r["kind"]==k)}</small></button>'
               for k, lab, _ in KINDS)
secs = []
for k, lab, sub in KINDS:
    ids = [r['id'] for r in rows if r['kind'] == k]
    secs.append(f'<h2 data-sec="{k}">{lab} <small>{sub} · {len(ids)}</small></h2>'
                + '<div class="grid" data-sec="' + k + '">'
                + ''.join(c for c in cards if f'data-k="{k}"' in c) + '</div>')

DISKONLY = sum(1 for r in live if r.get('git') == 0)
HTML = f'''<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>THE DOOR — one index for the whole archive</title>
<meta name="description" content="{len(live)} entries: {sum(1 for r in live if r['kind']=='operate')} instruments you can work in, {sum(1 for r in live if r['kind']=='browse')} libraries, the finished works, the five cuts and the record — {TOT_N:,} files, {human(TOT_B)}.">
<style>
/* Same room as the film: cream paper, hard contour, eight ink levels,
   no gradients, no rounded corners. A door in a different language than
   the room is a lie about the room. */
:root{{--paper:#f4f4f0;--paper2:#fdfdfa;--ink:#141414;--dim:#8a8a86;--accent:#0033cc;
  --l1:#e4e4e0;--l3:#a8a8a4;--warn:#8a6d00}}
*{{box-sizing:border-box;margin:0;padding:0;border-radius:0!important}}
body{{background:var(--paper);color:var(--ink);
  font:400 15px/1.6 "Helvetica Neue",Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;
  padding:0 22px 110px}}
.wrap{{max-width:1180px;margin:0 auto}}
header{{border-bottom:3px solid var(--ink);padding:40px 0 22px}}
.mark{{width:26px;height:26px;margin-bottom:22px;
  background:radial-gradient(circle 3.4px at 6px 6px,var(--ink) 98%,transparent),
             radial-gradient(circle 3.4px at 20px 6px,var(--ink) 98%,transparent),
             radial-gradient(circle 3.4px at 6px 20px,var(--ink) 98%,transparent),
             radial-gradient(circle 3.4px at 20px 20px,var(--ink) 98%,transparent)}}
h1{{font:900 clamp(26px,5.2vw,44px)/1.05 Helvetica,Arial;letter-spacing:.03em;text-transform:uppercase}}
h1 small{{display:block;font:900 11px/1 Helvetica;letter-spacing:.34em;color:var(--dim);margin-top:14px}}
.lede{{margin:24px 0 0;font-size:17px;max-width:68ch}} .lede b{{font-weight:900}}
.tot{{margin:18px 0 0;font:700 12px/1.7 ui-monospace,Menlo,monospace;letter-spacing:.06em;color:var(--dim)}}
.tot a{{color:var(--accent);text-decoration:none;border-bottom:1px solid var(--accent)}}
.bar{{position:sticky;top:0;z-index:40;background:var(--paper);border-bottom:1px solid var(--l3);
  padding:12px 0;display:flex;gap:8px;align-items:center;flex-wrap:wrap}}
.tab{{border:1px solid var(--ink);background:var(--paper2);color:var(--ink);font:900 10px/1 Helvetica;
  letter-spacing:.16em;text-transform:uppercase;padding:9px 12px;cursor:pointer;display:flex;gap:7px;align-items:center}}
.tab small{{font:700 10px/1 ui-monospace,monospace;color:var(--dim);letter-spacing:0}}
.tab[aria-pressed="true"]{{background:var(--ink);color:var(--paper2)}}
.tab[aria-pressed="true"] small{{color:var(--l3)}}
#q{{flex:1 1 180px;min-width:150px;border:1px solid var(--ink);background:var(--paper2);color:var(--ink);
  font:400 13px/1 ui-monospace,Menlo,monospace;padding:10px 11px}}
#q::placeholder{{color:var(--l3)}}
#cnt{{font:700 11px/1 ui-monospace,monospace;color:var(--dim);letter-spacing:.06em;white-space:nowrap}}
h2{{font:900 11px/1 Helvetica;letter-spacing:.22em;text-transform:uppercase;color:var(--ink);
  margin:46px 0 14px;padding-bottom:8px;border-bottom:2px solid var(--ink);display:flex;gap:12px;align-items:baseline}}
h2 small{{font:700 10px/1 ui-monospace,monospace;letter-spacing:.06em;color:var(--dim);text-transform:none}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(318px,1fr));gap:14px}}
.card{{border:2px solid var(--ink);background:var(--paper2);text-decoration:none;color:var(--ink);
  display:flex;flex-direction:column;min-height:0}}
a.card:hover{{background:var(--ink);color:var(--paper2)}}
a.card:hover .line{{color:var(--paper2)}} a.card:hover .eid,a.card:hover .meta span{{color:var(--l3)}}
a.card:hover .note{{color:#d8c87a;border-color:#6d6d6a}}
a.card:hover .pv{{border-bottom-color:var(--paper2)}}
.pv{{border-bottom:2px solid var(--ink);background:var(--l1);height:178px;overflow:hidden;
  display:flex;align-items:center;justify-content:center;flex:0 0 auto}}
.pv img{{width:100%;height:100%;object-fit:cover;display:block;image-rendering:auto}}
.pv .dots{{width:88px;height:88px;opacity:.5}}
.pv img.drawn{{object-fit:cover;opacity:.9}}
.txt{{padding:14px 15px 15px;display:flex;flex-direction:column;gap:9px;flex:1 1 auto}}
.hd{{display:flex;gap:9px;align-items:baseline}}
.eid{{font:700 10px/1.2 ui-monospace,monospace;color:var(--dim);letter-spacing:.08em;flex:0 0 auto;padding-top:2px}}
h3{{font:900 14px/1.18 Helvetica,Arial;letter-spacing:.035em;text-transform:uppercase}}
.line{{font-size:13.5px;line-height:1.5;color:var(--ink)}}
.note{{font:400 12px/1.5 ui-monospace,Menlo,monospace;color:var(--warn);
  border-left:2px solid var(--warn);padding-left:9px}}
.meta{{margin-top:auto;display:flex;gap:12px;flex-wrap:wrap;
  font:700 10px/1 ui-monospace,monospace;letter-spacing:.06em;color:var(--dim);padding-top:4px}}
.gone{{opacity:.6}} .gone h3{{text-decoration:line-through}}
.gonetag{{color:#cf222e;font-weight:900}}
.meta .rel{{color:var(--accent);font-weight:900}} a.card:hover .meta .rel{{color:#9ab6ff}}
.meta .disk{{color:#cf222e;font-weight:900}} a.card:hover .meta .disk{{color:#ff8a92}}
.meta .part{{color:var(--warn);font-weight:900}} a.card:hover .meta .part{{color:#d8c87a}}
footer{{margin-top:56px;border-top:3px solid var(--ink);padding-top:20px;
  font:400 13px/1.62 ui-monospace,Menlo,monospace;color:var(--dim);max-width:78ch}}
footer b{{color:var(--ink)}} footer p{{margin:12px 0}}
footer a{{color:var(--accent)}}
.pv .strip{{display:block;width:100%;height:100%;background-repeat:no-repeat;
  background-size:800% 100%;background-position:0% 50%}}
.seq{{margin-left:auto;font:700 10px/1 ui-monospace,monospace;color:var(--dim);flex:0 0 auto;padding-top:2px}}
.seq small{{font-weight:400;color:var(--l3)}}
a.card:hover .seq{{color:var(--l3)}}
.apart{{border-top:1px solid var(--l1);padding-top:8px;display:flex;flex-direction:column;gap:5px}}
.apart i{{display:block;height:3px;background:var(--ink);min-width:2px}}
.apart span{{font:400 11.5px/1.45 ui-monospace,Menlo,monospace;color:var(--dim)}}
.apart b{{color:var(--ink);font-weight:700}}
a.card:hover .apart{{border-color:#4a4a48}} a.card:hover .apart i{{background:var(--paper2)}}
a.card:hover .apart span{{color:var(--l3)}} a.card:hover .apart b{{color:var(--paper2)}}
.where{{font:400 10px/1.4 ui-monospace,Menlo,monospace;color:var(--l3);word-break:break-all;
  border-top:1px solid var(--l1);padding-top:7px}}
a.card:hover .where{{color:#6a6a68;border-color:#4a4a48}}
.ways{{display:grid;grid-template-columns:repeat(auto-fit,minmax(286px,1fr));gap:13px}}
.way{{border:2px solid var(--ink);background:var(--paper2);padding:14px 15px 15px}}
.way h3{{font:900 12px/1.2 Helvetica;letter-spacing:.14em;text-transform:uppercase;
  border-bottom:2px solid var(--ink);padding-bottom:9px;margin-bottom:4px}}
.way h3 small{{display:block;font:400 11.5px/1.45 ui-monospace,Menlo,monospace;color:var(--dim);
  letter-spacing:0;text-transform:none;margin-top:6px}}
.step{{display:flex;gap:10px;align-items:baseline;text-decoration:none;color:var(--ink);
  padding:9px 0;border-bottom:1px solid var(--l1)}}
.step:last-child{{border-bottom:0}}
.step:hover{{background:var(--ink);color:var(--paper2);margin:0 -15px;padding-left:15px;padding-right:15px}}
.sn{{font:700 10px/1.5 ui-monospace,monospace;color:var(--dim);flex:0 0 14px}}
.st{{flex:1 1 auto;min-width:0;font:400 12px/1.45 ui-monospace,Menlo,monospace;color:var(--dim)}}
.st b{{display:block;font:900 12px/1.3 Helvetica;letter-spacing:.04em;text-transform:uppercase;
  color:var(--ink);margin-bottom:3px}}
.step:hover .st,.step:hover .sn,.step:hover .sid{{color:var(--l3)}}
.step:hover .st b{{color:var(--paper2)}}
.sid{{font:700 9px/1.5 ui-monospace,monospace;color:var(--l3);flex:0 0 auto}}
.when{{border:2px solid var(--ink);background:var(--paper2)}}
.day{{display:flex;gap:14px;align-items:flex-start;padding:11px 13px;border-bottom:1px solid var(--l1)}}
.day:last-child{{border-bottom:0}}
.dh{{flex:0 0 74px;font:900 10px/1.5 Helvetica;letter-spacing:.16em;text-transform:uppercase;
  color:var(--dim);position:sticky;top:64px}}
.dh b{{color:var(--ink);font-size:17px;letter-spacing:0;display:block;line-height:1.05}}
.dh small{{display:block;font:700 10px/1.6 ui-monospace,monospace;letter-spacing:0;color:var(--l3)}}
.chips{{display:flex;flex-wrap:wrap;gap:6px;min-width:0}}
.chip{{text-decoration:none;color:var(--ink);font:400 11px/1.3 ui-monospace,Menlo,monospace;
  border-left:3px solid var(--c);padding:3px 8px 4px 7px;background:var(--paper);max-width:230px}}
.chip b{{display:block;font:700 9px/1.2 ui-monospace,monospace;color:var(--c);letter-spacing:.08em}}
.chip:hover{{background:var(--ink);color:var(--paper2)}}
.chip:hover b{{color:var(--l3)}}
@media(max-width:560px){{.day{{flex-direction:column;gap:7px}}.dh{{position:static;flex:0 0 auto;
  display:flex;gap:9px;align-items:baseline}}.dh b{{display:inline}}.dh small{{display:inline}}}}
.card:target{{outline:4px solid var(--accent);outline-offset:3px}}
.hide{{display:none!important}}
.card.unreach{{opacity:.72}}
@media(max-width:560px){{body{{padding:0 14px 90px}} .grid{{grid-template-columns:1fr}} .pv{{height:200px}}}}
</style></head><body><div class="wrap">

<header>
  <div class="mark"></div>
  <h1>The Door<small>one index for the whole archive</small></h1>
  <p class="lede">Everything made from the MARKOV&nbsp;POET archive and the fourteen WYGWYL
  poems, in one place. <b>{sum(1 for r in live if r['kind']=='operate')} instruments</b> you can
  work in, <b>{sum(1 for r in live if r['kind']=='browse')} libraries</b> you can search and take
  from, the finished works, the five cuts, and the record of what went wrong.
  Every count and every byte was measured off the disk when the page was built. Every preview
  is eight real frames chosen to span the thing rather than one picked off the top of the pile —
  so what turns on each card is the <i>range</i> of what is in there. Under each one, the single
  measurement on which it sits furthest from everything else here: the difference that makes a
  difference. <a href="#when">WHEN</a> puts all of it back in the order it was made.</p>
  <p class="tot"><a href="#start">START</a> &nbsp;\u00b7&nbsp; <a href="#when">WHEN</a> &nbsp;\u00b7&nbsp; {len(live)} ENTRIES &nbsp;·&nbsp; {TOT_N:,} FILES &nbsp;·&nbsp; {human(TOT_B)} &nbsp;·&nbsp; BUILT {time.strftime('%Y-%m-%d %H:%M')}</p>
</header>

<div class="bar">
  <button class="tab" data-f="all" aria-pressed="true">All<small>{len(live)}</small></button>
  {tabs}
  <input id="q" type="search" placeholder="search  /  the whole page" autocomplete="off" spellcheck="false">
  <span id="cnt"></span>
</div>

{WAYS}

{WHEN}

{''.join(secs)}

<footer>
  <p><b>What will not survive a clone.</b> {DISKONLY} of these {len(live)} entries are on this
  disk and in no repository — marked <b>DISK ONLY</b> on their cards, and <b>PART IN REPO</b>
  where the page ships but its material does not. Every tool, every library, every note and
  every contact sheet is committed. What is not: the five cuts, and the 135 generated shots
  behind the gallery.</p>
  <p>Some of that is a decision and some of it is not a choice at all. B, C, D and E run 113 MB
  to 391 MB each and GitHub refuses any single file over 100 MB, so they cannot be pushed as
  they are — they need a release asset or an external host. A is 30 MB and could go in; it is
  out because the five belong together. <code>MARKOV_POET_00/</code> is 237 MB of source
  material, not an output, and nothing but this disk holds it — that one is worth a backup
  rather than a commit. The segments, the harvest, the halfworlds and the 1.1 GB of cut-outs
  are regenerable stock and stay local on purpose, the way <code>cut/out/elements/</code>
  already did.</p>
  <p><b>What is open.</b> A picked region is still not a nameable, bindable part, so the
  forearm-and-sleeve case cannot be done by name (<a href="cut/pf/OP16_FIT.md">OP16_FIT</a>).
  The second pass has structure but no subject, and rejected nothing — fourteen in,
  fourteen out (<a href="cut/pf/SECOND_PASS.md">SECOND_PASS</a>).</p>
  <p><b>How this page is kept true.</b> It is generated, not written. <code>cut/pf/door.py</code>
  builds it in seconds and checks every link against the disk, rendering a missing one struck
  through with LINK DEAD rather than dropping it. <code>cut/pf/strips.py</code> is the slow pass:
  it looks at up to twenty-four candidates per entry, measures each one, keeps the best, then
  repeatedly keeps whatever is <i>furthest</i> from everything kept so far — eight best frames
  from one folder are eight versions of the same frame, and it is the spread that tells two
  folders apart. The five measurements are then z-scored across all entries, which is where the
  line under each card comes from.</p>
  <p>Two limits, stated. The dates are the filesystem's: a file rewritten later reads as later,
  and the entry for OPERATOR 16 sat in October until this pass started taking the earlier of
  each file's creation and modification time — my own one-line fix to its title had moved it.
  And a preview can only span what it was shown; where an entry had fewer than three readable
  frames it carries a drawn ink field instead of a strip, rather than one picture repeated eight
  times to look like eight.</p>
</footer>

</div><script>
(function(){{
 var cards=[].slice.call(document.querySelectorAll('.card')),
     tabs=[].slice.call(document.querySelectorAll('.tab')),
     secs=[].slice.call(document.querySelectorAll('[data-sec]')),
     q=document.getElementById('q'), cnt=document.getElementById('cnt'), f='all';
 function apply(){{
  var t=q.value.trim().toLowerCase(), n=0;
  cards.forEach(function(c){{
   var ok=(f==='all'||c.dataset.k===f)&&(!t||c.dataset.h.indexOf(t)>=0);
   c.classList.toggle('hide',!ok); if(ok)n++;
  }});
  /* a heading over an empty grid is a lie about what is there */
  secs.forEach(function(s){{
   var g=s.classList.contains('grid')?s:document.querySelector('.grid[data-sec="'+s.dataset.sec+'"]');
   var any=[].slice.call(g.children).some(function(c){{return !c.classList.contains('hide');}});
   s.classList.toggle('hide',!any);
  }});
  cnt.textContent=(t||f!=='all')?n+' SHOWN':'';
  tabs.forEach(function(b){{b.setAttribute('aria-pressed', b.dataset.f===f?'true':'false');}});
 }}
 tabs.forEach(function(b){{b.addEventListener('click',function(){{f=b.dataset.f;apply();}});}});
 q.addEventListener('input',apply);
 document.addEventListener('keydown',function(e){{
  if(e.key==='/'&&document.activeElement!==q){{e.preventDefault();q.focus();}}
  if(e.key==='Escape'&&document.activeElement===q){{q.value='';q.blur();apply();}}
 }});
 apply();

 /* Eight frames chosen to span the thing are worth more than one if you can see
    all eight. They turn only while on screen, each card on its own phase so the
    wall does not march in step, and faster under the pointer. */
 var live=new Set(), tick=0;
 var io=new IntersectionObserver(function(es){{
   es.forEach(function(e){{ e.isIntersecting ? live.add(e.target) : live.delete(e.target); }});
 }},{{rootMargin:'140px'}});
 var strips=[].slice.call(document.querySelectorAll('.strip'));
 strips.forEach(function(el,i){{
   el._i=0; el._p=i%5; el._fast=false; io.observe(el);
   var c=el.closest('.card');
   if(c){{ c.addEventListener('pointerenter',function(){{el._fast=true;}});
           c.addEventListener('pointerleave',function(){{el._fast=false;}}); }}
 }});
 function turn(el){{
   var n=+el.dataset.n||8; if(n<2) return;
   el._i=(el._i+1)%n;
   el.style.backgroundPositionX=(el._i*100/(n-1))+'%';
 }}
 if(strips.length && !matchMedia('(prefers-reduced-motion: reduce)').matches){{
   setInterval(function(){{
     tick++;
     live.forEach(function(el){{ if(el._fast || (tick+el._p)%5===0) turn(el); }});
   }},340);
 }}

 /* Whether an entry resolves depends on where this page is being served from,
    which it cannot know when it is built. Two entries live above this folder, and
    the ones marked DISK ONLY are in no repository, so they exist on the machine
    that made them and nowhere else. Both cases are asked about once, on load, and
    answered on the card — a card that says DISK ONLY is still a link, and a link
    that 404s teaches nothing. */
 cards.filter(function(c){{
   return c.tagName==='A' && (c.getAttribute('href').indexOf('../')===0
                              || (c.querySelector('.meta .disk')
                                  && !c.querySelector('.meta .rel')));
  }}).forEach(function(c){{
   var up=c.getAttribute('href').indexOf('../')===0;
   fetch(c.getAttribute('href'),{{method:'HEAD'}}).then(function(r){{
    if(r.ok) return; throw 0;
   }}).catch(function(){{
    c.classList.add('unreach');
    var m=c.querySelector('.meta');
    if(m) m.insertAdjacentHTML('afterbegin','<span class="disk">NOT ON THIS HOST</span>');
    var t=c.querySelector('.txt');
    if(t) t.insertAdjacentHTML('beforeend','<p class="note">'
      + (up ? 'This entry lives above this folder. Serve the repository root instead — or run '
            + 'the-door.command, which does.'
            : 'Not served from here. It is on the disk it was made on; see the foot of this page '
            + 'for why it is not in the repository.')
      + '</p>');
   }});
  }});
}})();
</script></body></html>'''

open(OUT, 'w').write(HTML)


print(f"\n{len(live)} live · {len(dead)} dead · {TOT_N:,} files · {human(TOT_B)}")
if dead:
    print("DEAD LINKS (rendered struck through, not hidden):")
    for eid, h in dead: print(f"    {eid}  {h}")
if nopreview:
    print(f"no frames to show, drawn ink field instead: {' '.join(nopreview)}")
print(f"-> {os.path.relpath(OUT, os.getcwd())}")
