#!/usr/bin/env python3
"""
THE RELEASE — the video this repository cannot carry.

    python3 cut/pf/release.py [--tag media-v1] [--dry]

GitHub refuses any single file over 100 MB inside a repository, and B is 373 MB.
That is not a policy this archive can argue with, so the five cuts, the fourteen
halfworlds and the 135 generated source shots go up as release assets, which take
2 GB each and serve with range requests — which is the thing that matters, because
a <video> element cannot play a file it cannot seek in.

This uploads them and writes cut/pf/media.json: a map from the path a page
already uses to the URL that actually serves it. Every page builder consults that
map, so nothing anywhere has a release URL typed into it, and if this is never
run the pages fall back to their local paths and work from a copy of the archive.
Two ways of holding the same archive, one set of sources.
"""
import os, sys, json, subprocess, time

BASE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ROOT = os.path.dirname(BASE)                      # the repository
MAP  = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'media.json')
TAG  = 'media-v1'
for i, a in enumerate(sys.argv):
    if a == '--tag' and i + 1 < len(sys.argv): TAG = sys.argv[i + 1]
DRY = '--dry' in sys.argv

def listing(d, ext='.mp4'):
    p = os.path.join(BASE, d)
    return [f'{d}/{f}' for f in sorted(os.listdir(p))] if os.path.isdir(p) else []

SETS = {
 'the five cuts': ['cut/out/WYGWYL_A_THE_PQ_REEL.mp4',
                   'cut/out/WYGWYL_B_THE_WINDOW_AND_THE_DOOR.mp4',
                   'cut/out/WYGWYL_C_THE_DECK_60BPM.mp4',
                   'cut/out/WYGWYL_D_THE_DOOR.mp4',
                   'cut/out/WYGWYL_E_THE_DOOR_mareamemory_06.mp4'],
 'the halfworlds': [p for p in listing('cut/halfworlds') if p.endswith('.mp4')],
 'the source shots': [p for p in listing('MARKOV_POET/videos') if p.endswith('.mp4')]
                   + [p for p in listing('MARKOV_POET_00/videos') if p.endswith('.mp4')],
}

def repo_url(name):
    return (f'https://github.com/hartswf0/butterfly-halfworld/releases/download/{TAG}/'
            + name.replace(' ', '.'))      # GitHub substitutes dots for spaces in asset names

def have():
    try:
        out = subprocess.run(['gh', 'release', 'view', TAG, '--json', 'assets'],
                             cwd=ROOT, capture_output=True, text=True, timeout=120).stdout
        return {a['name']: a['url'] for a in json.loads(out or '{}').get('assets', [])}
    except Exception:
        return {}


# Pages written by other passes (and by hand) already name these files by their
# local path. Rewrite those references to whatever serves them, idempotently, so
# the map stays the single place a URL is decided.
RELINK = ['MARKOV_POET_GALLERY.html', 'COLLAGE_AND_VIDEO/index.html']

def relink(media):
    import re
    hit = 0
    for rel in RELINK:
        fp = os.path.join(BASE, rel)
        if not os.path.exists(fp): continue
        src = open(fp, encoding='utf-8', errors='replace').read()
        here = os.path.dirname(os.path.join(BASE, rel))
        out, n = src, 0
        for p, url in media.items():
            # the path as THIS page would have written it, relative to itself
            r = os.path.relpath(os.path.join(BASE, p), here).replace(os.sep, '/')
            for form in (r, './' + r):
                for attr in ('src="', 'href="'):
                    a, b = attr + form + '"', attr + url + '"'
                    if a in out: n += out.count(a); out = out.replace(a, b)
        if n:
            open(fp, 'w', encoding='utf-8').write(out)
            hit += n
        print(f'  relink {rel}: {n} reference{"" if n == 1 else "s"}')
    return hit

def main():
    todo, done = [], have()
    for group, paths in SETS.items():
        for p in paths:
            fp = os.path.join(BASE, p)
            if not os.path.exists(fp): print(f'  ! missing {p}'); continue
            if os.path.basename(p).replace(' ', '.') in done: continue
            todo.append((group, p, fp))
    nb = sum(os.path.getsize(f[2]) for f in todo)
    print(f'{len(done)} already up · {len(todo)} to upload · {nb/1e6:.0f} MB\n')
    if DRY:
        for g, p, _ in todo: print(f'  {g:18s} {p}')
        return
    t0 = time.time()
    # one call per file: 154 files in one gh invocation is one failure away from
    # knowing nothing about which ones landed
    for n, (group, p, fp) in enumerate(todo, 1):
        r = subprocess.run(['gh', 'release', 'upload', TAG, fp, '--clobber'],
                           cwd=ROOT, capture_output=True, text=True, timeout=3600)
        ok = r.returncode == 0
        print(f'  {n:3d}/{len(todo)}  {"ok " if ok else "FAIL"}  {os.path.getsize(fp)/1e6:6.0f} MB  {p}'
              + ('' if ok else f'\n        {r.stderr.strip()[:200]}'), flush=True)

    assets = have()
    media = {}
    for group, paths in SETS.items():
        for p in paths:
            nm = os.path.basename(p).replace(' ', '.')
            if nm in assets: media[p] = repo_url(os.path.basename(p))
    json.dump(dict(tag=TAG, built=time.strftime('%Y-%m-%d %H:%M'), media=media),
              open(MAP, 'w'), indent=1)
    if media: relink(media)
    want = sum(len(v) for v in SETS.values())
    print(f'\n{len(media)} of {want} mapped · {time.time()-t0:.0f}s · -> cut/pf/media.json')
    if len(media) < want:
        print('  ! not everything landed; re-run to pick up the rest')

if __name__ == '__main__':
    main()
