#!/usr/bin/env python3
"""
THE BOARD — every image in the project, on one deck, with the prompt that goes
with it and a way to take a whole column away with you.

Four sources, none of which agreed on anything, reconciled into one row per
image:

  1. COLLAGE_ZETTELS  — 107 composed collages, each with its cineosis prompt.
  2. MARKOV_POET      — 135 generated shots, each with the prompt as sent, its
                        thumbnail, and the video it came from.
  3. cut/out/thumbs   — 2,033 cut-outs, each with the noun the segmenter gave it.
  4. WYGWYL_COVERAGE_MAP — which poem each shot belongs to, which is the only
                        thing that lets any of the above be grouped by poem.

Every row carries the same fields whatever it came from, so the board can regroup
by poem, by noun, by work or by medium without knowing where anything originated.

    python3 cut/pf/board.py   ->  BOARD/board.json
"""
import os, io, json, re, csv

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT  = os.path.join(ROOT, 'BOARD')

def jload(p):
    return json.load(io.open(p, encoding='utf-8')) if os.path.exists(p) else None

def main():
    os.makedirs(OUT, exist_ok=True)
    rows = []

    # ── which poem does a shot belong to ─────────────────────────────────────
    shot_poem, shot_line, shot_cat = {}, {}, {}
    cov = jload(os.path.join(ROOT, 'WYGWYL_COVERAGE_MAP.json'))
    if cov:
        for r in cov.get('shot_routing_records', []):
            a = r.get('primary_allocation') or {}
            if r.get('patch_id') and a.get('number'):
                shot_poem[r['patch_id']] = a['number'] + ' ' + (a.get('title') or '')
                shot_line[r['patch_id']] = a.get('direct_line_text') or ''
                shot_cat[r['patch_id']]  = (r.get('visual_category') or '').lower().replace('_',' ')

    # ── 1. the composed collages, with their cineosis prompts ────────────────
    zc = jload(os.path.join(ROOT, 'COLLAGE_ZETTELS', 'catalogue.json')) or []
    zbody = {}
    zd = os.path.join(ROOT, 'COLLAGE_ZETTELS', 'zettels')
    for z in zc:
        src = io.open(os.path.join(zd, z['file']), encoding='utf-8').read()
        m = re.search(r'TEXT-TO-CINEMA PROMPT:\s*\n\n(.*?)\n\n[A-Z]', src, re.S)
        zbody[z['id']] = m.group(1).strip() if m else ''
    for z in zc:
        # a zettel's PLATFORM names the poem when it has one
        pf = re.search(r'PLATFORM:\s*\n\[\[(.+?)\]\]',
                       io.open(os.path.join(zd, z['file']), encoding='utf-8').read())
        poem = pf.group(1) if pf else ''
        rows.append({
            'id': z['id'], 'kind': 'image', 'src': z['image'],
            'title': z.get('title',''), 'prompt': zbody.get(z['id'],''),
            'poem': poem if re.match(r'^\d| ', poem) or poem.isupper() else '',
            'type': z.get('sign',''), 'work': 'collage · ' + z.get('stage',''),
            'note': z.get('sign_id',''),
        })

    # ── 2. the generated shots: thumbnail, prompt as sent, and its video ─────
    stem_patch = {}
    if cov:
        for r in cov.get('shot_routing_records', []):
            if r.get('filename_stem'):
                stem_patch[r['filename_stem']] = r['patch_id']
    for coll in ('MARKOV_POET', 'MARKOV_POET_00'):
        man = jload(os.path.join(ROOT, coll, 'manifest.json')) or []
        for r in man:
            stem = r.get('filename_stem')
            if not stem:
                continue
            thumb = os.path.join(coll, 'thumbnails', stem + '.jpg')
            vid   = os.path.join(coll, 'videos', stem + '.mp4')
            if not os.path.exists(os.path.join(ROOT, thumb)):
                thumb = ''
            patch = stem_patch.get(stem, '')
            v = (r.get('visual_prompt') or '').strip()
            a = (r.get('audio_prompt') or '').strip()
            prompt = v
            if a:
                prompt = (v + '\n\nSOUND: ' + a) if v else ('SOUND: ' + a)
            if not prompt:
                prompt = '(no prompt recorded — the stem is all there is: ' + stem + ')'
            rows.append({
                'id': patch or stem[:24], 'kind': 'video',
                'src': thumb, 'video': vid if os.path.exists(os.path.join(ROOT, vid)) else '',
                'title': (patch + ' · ' if patch else '') + (r.get('resolution','') or '')
                         + ' ' + str(r.get('duration_seconds','')) + 's',
                'prompt': prompt,
                'poem': shot_poem.get(patch, ''),
                'type': shot_cat.get(patch, '') or 'unrouted',
                'work': coll, 'note': (r.get('created_at') or '')[:10],
            })

    # ── 3. the cut-outs, each with the noun it was given ─────────────────────
    arc = jload(os.path.join(ROOT, 'cut', 'out', 'thumbs', 'index.json')) or []
    for e in arc:
        p = e.get('patch','')
        rows.append({
            'id': e.get('id',''), 'kind': 'image',
            'src': 'cut/out/thumbs/' + e.get('id','') + '.webp',
            'title': e.get('id',''),
            'prompt': '"' + (e.get('p') or '?') + '" — cut from ' + p
                      + ('. ' + shot_line.get(p,'') if shot_line.get(p) else ''),
            'poem': shot_poem.get(p, ''), 'type': e.get('p') or '?',
            'work': 'archive · cut-outs', 'note': p,
        })

    # the zettels name their poem by title and the coverage map numbers it, so
    # the same poem arrived twice under two spellings. Fold the bare titles onto
    # the numbered ones rather than shipping thirty-two columns for fourteen poems.
    bytitle = {}
    for r in rows:
        m = re.match(r'^(\d\d)\s+(.+)$', r.get('poem') or '')
        if m:
            bytitle[m.group(2).strip().upper()] = r['poem']
    for r in rows:
        pm = (r.get('poem') or '').strip()
        if pm and not re.match(r'^\d\d ', pm):
            r['poem'] = bytitle.get(pm.upper(), '')

    rows = [r for r in rows if r.get('src')]
    json.dump(rows, io.open(os.path.join(OUT, 'board.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, separators=(',', ':'))

    with io.open(os.path.join(OUT, 'board.csv'), 'w', encoding='utf-8', newline='') as fh:
        w = csv.writer(fh)
        w.writerow(['id','kind','src','video','poem','type','work','title','prompt'])
        for r in rows:
            w.writerow([r.get(k,'') for k in
                        ('id','kind','src','video','poem','type','work','title','prompt')])

    print('%d rows' % len(rows))
    for k in ('poem','type','work'):
        print('  by %-5s %d groups' % (k, len({r.get(k) or '—' for r in rows})))
    print('  video %d · image %d' % (sum(1 for r in rows if r['kind']=='video'),
                                     sum(1 for r in rows if r['kind']=='image')))
    print('  with a prompt: %d' % sum(1 for r in rows if r.get('prompt')))

if __name__ == '__main__':
    main()
