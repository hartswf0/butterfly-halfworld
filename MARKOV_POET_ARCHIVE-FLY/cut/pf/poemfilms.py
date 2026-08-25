#!/usr/bin/env python3
"""
THE OTHER FILM.

Every poem in the suite has two films. One is DRAWN — the halfworld, a program
that runs for 70 to 135 seconds and can be taken apart by the names it knows.
The other was FILMED — the shots out of the MARKOV POET archive, cut apart by a
segmenter and packed as sheets of photographs over masks.

OPERATOR could stream the drawn one from a button and the filmed one only if you
knew a URL or had a file to pick, which means in practice it could not stream it
at all. The mapping was never missing: WYGWYL_COVERAGE_MAP.json routes all 135
shots to poems, with the line each one illustrates and how sure the routing is.

So this writes that routing out as something the tool can read: fourteen poems,
each with its world slug on one side and its ordered shots on the other. Order
is by STANZA, not by shot id, so the film reads in the order of the poem rather
than in the order the renders happened to finish.

    python3 cut/pf/poemfilms.py            -> cut/out/held/poems.json
"""
import json, io, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MAP  = os.path.join(ROOT, 'WYGWYL_COVERAGE_MAP.json')
PACK = os.path.join(ROOT, 'cut', 'out', 'held', 'pack')
OUT  = os.path.join(ROOT, 'cut', 'out', 'held', 'poems.json')
WORLDS = os.path.join(ROOT, 'cut', 'out', 'held', 'world', 'worlds.json')

def stanza_key(line_id):
    """`01_S3` sorts after `01_S2` and before `01_S10` — string order does not."""
    m = re.match(r'^(\d+)_S(\d+)$', line_id or '')
    return (int(m.group(1)), int(m.group(2))) if m else (99, 99)

def main():
    cov = json.load(io.open(MAP, encoding='utf-8'))
    worlds = json.load(io.open(WORLDS, encoding='utf-8')) if os.path.exists(WORLDS) else []
    have = {f[:-5] for f in os.listdir(PACK) if f.endswith('.webp')} if os.path.isdir(PACK) else set()

    by_poem = {}
    missing = []
    for r in cov.get('shot_routing_records', []):
        alloc = r.get('primary_allocation') or {}
        num, title = alloc.get('number'), alloc.get('title')
        if not num:
            continue
        pid = r.get('patch_id')
        if pid not in have:
            missing.append(pid)          # a routed shot with no packed sheet
            continue
        by_poem.setdefault((num, title), []).append({
            'patch': pid,
            'line':  alloc.get('direct_line_id') or '',
            'text':  (alloc.get('direct_line_text') or '')[:180],
            'cat':   r.get('visual_category') or '',
            'p':     alloc.get('probability') or 0,
            'secs':  r.get('duration_seconds') or '',
        })

    out = []
    for (num, title), shots in sorted(by_poem.items(), key=lambda kv: kv[0][0]):
        shots.sort(key=lambda s: (stanza_key(s['line']), -s['p'], s['patch']))
        slug = next((w for w in worlds if w.startswith(num + '-')), None)
        out.append({'n': num, 'title': title, 'world': slug,
                    'shots': shots, 'count': len(shots)})

    io.open(OUT, 'w', encoding='utf-8').write(json.dumps(out, ensure_ascii=False))

    total = sum(p['count'] for p in out)
    print('%d poems, %d shots routed and packed' % (len(out), total))
    for p in out:
        print('  %s %-26s %2d shots  world=%s' % (p['n'], p['title'][:26], p['count'], p['world'] or '—'))
    if missing:
        print('\n%d routed shots have no packed sheet: %s' % (len(missing), ', '.join(sorted(set(missing))[:12])))
    unpacked = sorted(have - {s['patch'] for p in out for s in p['shots']})
    if unpacked:
        print('%d packed sheets are not routed to any poem: %s' % (len(unpacked), ', '.join(unpacked[:12])))

if __name__ == '__main__':
    main()
