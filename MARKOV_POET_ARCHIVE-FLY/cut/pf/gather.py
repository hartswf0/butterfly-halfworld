#!/usr/bin/env python3
"""
GATHER — one folder that holds every experiment, and says what each one was for.

The work is spread over thirty-odd directories because that is how it was made:
each pass wrote its own output beside its own script. That is fine while you are
making it and useless when you want to look back at it. There was no single
place to stand.

This builds that place. It does NOT copy the media — the video alone is 12.3 GB
and duplicating it would double the repository to save a click. Each work is a
DIRECTORY SYMLINK, so `COLLAGE_AND_VIDEO/media/collage` opens the real folder,
browsable and playable, at a cost of a few bytes.

What it can say about each work it takes from three places, none of them written
for this purpose:

  1. THE SCRIPT'S OWN WORDS. Every generator in `cut/` opens with a docstring
     saying what it was trying to do. That is the closest thing to a statement of
     intent that exists, and it was written at the time rather than remembered
     afterwards.
  2. THE MANIFESTS. `MARKOV_POET/manifest.json` and `MARKOV_POET_00/` carry the
     real generation prompts — visual, audio, compound — model version, and the
     parent generation each shot was seeded from.
  3. THE FILENAMES. Every source video's stem encodes the prompt it came from,
     which is why they read like `..._sound_drone_light_mood_red`.

Where it cannot attribute a work to a script it says so rather than guessing.

    python3 cut/pf/gather.py
"""

import os, io, json, re, csv, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT  = os.path.join(ROOT, 'COLLAGE_AND_VIDEO')

VIDEO = ('.mp4', '.webm', '.mov', '.m4v')
AUDIO = ('.m4a', '.wav', '.mp3', '.aac')
STILL = ('.webp', '.png', '.jpg', '.jpeg', '.gif', '.svg')
PAGE  = ('.html',)

# out-dir -> the script that made it, where the name does not simply match
ALIASES = {
    'arspoetica': 'arspoetica_site.py',
    'harvest_flow': 'harvest.py',
    'sheets': 'cutsheet.py',
    'footage': 'leads.py',
    'elements': 'parts.py',
    'thumbs': 'build_db.py',
    'sound': 'soundcollage.py',
    'textule': 'patchfield.py',
    'meta': 'pf/meta.py',
    'second': 'pf/second.py',
    'lab': 'lab_site.py',
}

# these are INSTRUMENTS, not experiments — the tools the work was made with. They
# hold media because a tool ships its own material, and calling them experiments
# would put the workshop in the exhibition.
TOOLS = {'op', 'op15', 'op16', 'held', 'paste', 'studio', 'pf', 'beflix_e', 'thumbs'}

def script_for(name):
    """the generator, if there is one — by name, then by alias"""
    if name in ALIASES:
        a = ALIASES[name]
        return a if a and os.path.exists(os.path.join(ROOT, 'cut', a)) else None
    for cand in (name + '.py', name + '_site.py', name.rstrip('s') + '.py', name + 's.py'):
        if os.path.exists(os.path.join(ROOT, 'cut', cand)):
            return cand
    return None

def docstring(path):
    """the script's own statement of intent, trimmed to something readable"""
    try:
        src = io.open(path, encoding='utf-8').read(20000)
    except Exception:
        return ''
    m = re.search(r'^\s*(?:#!.*\n)?(?:#.*\n)*\s*("""|\'\'\')(.*?)\1', src, re.S)
    if m:
        return m.group(2).strip()
    # some are commented rather than docstringed
    lines, out = src.split('\n'), []
    for ln in lines[:60]:
        t = ln.strip()
        if t.startswith('#') and not t.startswith('#!'):
            out.append(t.lstrip('# ').rstrip())
        elif out:
            break
    return '\n'.join(out).strip()

def human(n):
    for u in ('B', 'KB', 'MB', 'GB'):
        if n < 1024 or u == 'GB':
            return ('%.0f%s' % (n, u)) if u == 'B' else ('%.1f%s' % (n, u))
        n /= 1024.0

def scan(d):
    """the media a directory holds, by kind"""
    kinds = {'video': [], 'audio': [], 'still': [], 'page': []}
    total = 0
    for f in sorted(os.listdir(d)):
        p = os.path.join(d, f)
        if not os.path.isfile(p) or f.startswith('.'):
            continue
        e = os.path.splitext(f)[1].lower()
        k = ('video' if e in VIDEO else 'audio' if e in AUDIO
             else 'still' if e in STILL else 'page' if e in PAGE else None)
        if not k:
            continue
        sz = os.path.getsize(p)
        total += sz
        kinds[k].append({'file': f, 'bytes': sz})
    return kinds, total

def load_prompts():
    """the real generation prompts, keyed by filename stem"""
    by_stem = {}
    for coll in ('MARKOV_POET', 'MARKOV_POET_00'):
        mp = os.path.join(ROOT, coll, 'manifest.json')
        if not os.path.exists(mp):
            continue
        for r in json.load(io.open(mp, encoding='utf-8')):
            st = r.get('filename_stem')
            if st:
                by_stem[st] = r
    return by_stem

def esc(t):
    return (t or '').replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')

def write_html(works, tv, ts, tb):
    """the page you actually open. Every work is a row: what it was for on the
       left, what it made on the right, playing in place."""
    h = ['<title>Every experiment</title>',
         '<style>',
         ':root{--k:#111;--w:#f4f1ea;--a:#c8102e}',
         '*{box-sizing:border-box}',
         'body{margin:0;background:var(--w);color:var(--k);'
         'font:13px/1.55 ui-monospace,SFMono-Regular,Menlo,monospace}',
         'header{padding:26px 22px 16px;border-bottom:3px solid var(--k)}',
         'h1{margin:0 0 6px;font:700 15px/1.2 ui-monospace,monospace;letter-spacing:.24em}',
         '.sub{opacity:.65;font-size:11px;max-width:74ch}',
         'nav{padding:10px 22px;border-bottom:3px solid var(--k);position:sticky;top:0;'
         'background:var(--w);z-index:5;display:flex;flex-wrap:wrap;gap:6px}',
         'nav a{color:var(--k);text-decoration:none;border:2px solid var(--k);padding:5px 8px;'
         'font-size:10px;letter-spacing:.1em}',
         'nav a:hover{background:var(--k);color:var(--w)}',
         'h2{margin:0;padding:16px 22px;background:var(--k);color:var(--w);'
         'font:700 11px/1.2 ui-monospace,monospace;letter-spacing:.24em}',
         '.w{border-bottom:2px solid var(--k);padding:20px 22px;display:grid;'
         'grid-template-columns:minmax(240px,30%) 1fr;gap:22px}',
         '@media(max-width:820px){.w{grid-template-columns:1fr}}',
         '.w h3{margin:0 0 4px;font:700 13px/1.2 ui-monospace,monospace;letter-spacing:.1em}',
         '.meta{font-size:10px;opacity:.6;margin-bottom:10px;word-break:break-all}',
         '.intent{font-size:11px;line-height:1.6;white-space:pre-wrap;max-height:19em;'
         'overflow:auto;border-left:3px solid var(--k);padding-left:10px}',
         '.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:8px}',
         '.grid figure{margin:0;border:2px solid var(--k);background:#fff}',
         '.grid video,.grid img{display:block;width:100%;height:auto;background:#000}',
         '.grid figcaption{font-size:9px;padding:4px 5px;border-top:2px solid var(--k);'
         'word-break:break-all;opacity:.8}',
         '.tile{aspect-ratio:16/9;background:var(--k);color:var(--w);display:flex;'
         'align-items:center;justify-content:center;cursor:pointer;font-size:26px}',
         '.tile:hover{background:var(--a)}',
         '.grid img{max-height:230px;object-fit:contain}',
         '.more{font-size:10px;opacity:.6;padding:6px 0}',
         '.pill{display:inline-block;border:2px solid var(--k);padding:2px 6px;'
         'font-size:9px;letter-spacing:.1em;margin-right:4px}',
         'a.open{display:inline-block;margin-top:8px;font-size:10px;color:var(--k)}',
         '</style>',
         '<header><h1>EVERY EXPERIMENT</h1>',
         '<div class="sub">%d works &middot; %d moving &middot; %d still &middot; %s. '
         'The media is not copied here &mdash; each work is a symlink to where it really lives, '
         'so this page browses all of it without duplicating a byte.</div></header>'
         % (len(works), tv, ts, human(tb))]

    groups = (('experiment','THE EXPERIMENTS'), ('cut','THE CUTS'),
              ('source','THE SOURCE ARCHIVE'), ('tool','THE INSTRUMENTS'))
    h.append('<nav>')
    for k,t in groups:
        if any(w['kind']==k for w in works):
            h.append('<a href="#%s">%s</a>' % (k, t))
    h.append('<a href="prompts/THE_PROMPTS.md">THE PROMPTS</a>')
    h.append('<a href="catalogue.csv">CSV</a></nav>')

    for k, title in groups:
        sel = [w for w in works if w['kind']==k]
        if not sel: continue
        h.append('<h2 id="%s">%s</h2>' % (k, title))
        for w in sel:
            c = w['counts']
            pills = ''.join('<span class="pill">%d %s</span>' % (c[x], x)
                            for x in ('video','still','audio','page') if c[x])
            h.append('<section class="w"><div>')
            h.append('<h3>%s</h3>' % esc(w['name']))
            h.append('<div class="meta">%s<br>%s%s</div>' % (
                pills, esc(w['path']),
                (' &middot; ' + esc(w['script'])) if w['script'] else ''))
            if w['intent']:
                h.append('<div class="intent">%s</div>' % esc(w['intent'][:2600]))
            else:
                h.append('<div class="intent" style="opacity:.5">No statement of intent was '
                         'written for this one. What it is, is what is in it.</div>')
            h.append('<a class="open" href="%s/">open the folder &rarr;</a>' % esc(w['href']))
            h.append('</div><div>')
            h.append('<div class="grid">')
            shown = 0
            for f in w['files']['video'][:12]:
                # CLICK TO PLAY. Embedding five hundred <video> elements built a page
                # that hung the renderer before it finished laying out. A tile costs
                # nothing until you ask for it.
                h.append('<figure><div class="tile" data-src="%s/%s">'
                         '<span>&#9654;</span></div>'
                         '<figcaption>%s</figcaption></figure>'
                         % (esc(w['href']), f['file'], esc(f['file'])))
                shown += 1
            for f in w['files']['still'][:12 - min(shown,12)]:
                h.append('<figure><img loading="lazy" src="%s/%s" alt="">'
                         '<figcaption>%s</figcaption></figure>'
                         % (esc(w['href']), f['file'], esc(f['file'])))
            h.append('</div>')
            rest = c['video'] + c['still'] - 12
            if rest > 0:
                h.append('<div class="more">&hellip; and %d more in the folder</div>' % rest)
            if c['page']:
                for f in w['files']['page']:
                    h.append('<div class="more"><a href="%s/%s">%s</a></div>'
                             % (esc(w['href']), f['file'], esc(f['file'])))
            h.append('</div></section>')

    h.append('<script>'
             'document.addEventListener("click",function(e){'
             ' var t=e.target.closest&&e.target.closest(".tile"); if(!t)return;'
             ' var v=document.createElement("video");'
             ' v.src=t.dataset.src; v.controls=true; v.autoplay=true; v.playsInline=true;'
             ' t.replaceWith(v);'
             '});</script>')
    io.open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write('\n'.join(h) + '\n')

def main():
    prompts = load_prompts()

    works = []
    outdir = os.path.join(ROOT, 'cut', 'out')
    for name in sorted(os.listdir(outdir)):
        d = os.path.join(outdir, name)
        if not os.path.isdir(d) or name.startswith('.'):
            continue
        kinds, total = scan(d)
        n = sum(len(v) for v in kinds.values())
        if not n:
            continue
        sc = script_for(name)
        works.append({
            'name': name,
            'kind': 'tool' if name in TOOLS else 'experiment',
            'path': os.path.relpath(d, ROOT),
            'script': ('cut/' + sc) if sc else None,
            'intent': docstring(os.path.join(ROOT, 'cut', sc)) if sc else '',
            'counts': {k: len(v) for k, v in kinds.items()},
            'bytes': total,
            'files': kinds,
        })

    # the two source collections and the loose cuts
    for name, rel in (('MARKOV_POET', 'MARKOV_POET/videos'),
                      ('MARKOV_POET_00', 'MARKOV_POET_00/videos'),
                      ('rendered_cuts', 'rendered_cuts'),
                      ('contact_sheets', 'contact_sheets'),
                      ('cut_out_root', 'cut/out')):
        d = os.path.join(ROOT, rel)
        if not os.path.isdir(d):
            continue
        kinds, total = scan(d)
        if not sum(len(v) for v in kinds.values()):
            continue
        works.append({
            'name': name, 'kind': 'source' if name.startswith('MARKOV') else 'cut',
            'path': rel, 'script': None,
            'intent': ('The generated archive itself — every shot with the prompt that made it.'
                       if name.startswith('MARKOV') else ''),
            'counts': {k: len(v) for k, v in kinds.items()},
            'bytes': total, 'files': kinds,
        })

    # ── write ────────────────────────────────────────────────────────────────
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(os.path.join(OUT, 'prompts'), exist_ok=True)

    # NO SYMLINKS. The first version made COLLAGE_AND_VIDEO/media/<work> a
    # directory symlink so the folder would browse everything for a few bytes.
    # Forty-three of them were committed, and on the build runner tar died trying
    # to read links pointing at directories a checkout does not contain — which
    # took down EVERY Pages deploy, not just these links. They were untracked in
    # a later commit, and that left this page loading with all of its media 404.
    #
    # A relative path to where the work actually lives costs the same to write,
    # survives a clone, and cannot break a build. It is what the zettel library
    # and the board had been doing all along, which is why those two stayed up.
    for w in works:
        w['href'] = os.path.relpath(os.path.join(ROOT, w['path']), OUT)

    json.dump(works, io.open(os.path.join(OUT, 'catalogue.json'), 'w', encoding='utf-8'),
              indent=1, ensure_ascii=False)

    with io.open(os.path.join(OUT, 'catalogue.csv'), 'w', encoding='utf-8', newline='') as fh:
        wr = csv.writer(fh)
        wr.writerow(['work', 'kind', 'path', 'script', 'video', 'audio', 'still', 'page', 'size'])
        for w in works:
            c = w['counts']
            wr.writerow([w['name'], w['kind'], w['path'], w['script'] or '',
                         c['video'], c['audio'], c['still'], c['page'], human(w['bytes'])])

    # one prompt file per work
    for w in works:
        b = ['# ' + w['name'], '', '`' + w['path'] + '`', '']
        if w['script']:
            b += ['Made by `' + w['script'] + '`.', '']
        else:
            b += ['*No generating script found for this directory — it was made by hand, '
                  'by a tool, or by a script that has since been renamed.*', '']
        if w['intent']:
            b += ['## What it was for', '', w['intent'], '']
        b += ['## What is in it', '']
        for k in ('video', 'audio', 'still', 'page'):
            for f in w['files'][k]:
                b.append('- `%s` · %s · %s' % (f['file'], k, human(f['bytes'])))
        io.open(os.path.join(OUT, 'prompts', w['name'] + '.md'), 'w', encoding='utf-8')\
          .write('\n'.join(b) + '\n')

    # the source prompts, in full
    rows = sorted(prompts.values(), key=lambda r: r.get('created_at') or '')
    b = ['# The prompts', '',
         'Every generated shot, with the prompt that made it, oldest first. Taken from',
         '`MARKOV_POET/manifest.json` and `MARKOV_POET_00/manifest.json` — these are the',
         'prompts as sent, not as remembered.', '',
         '%d shots · %d with a visual prompt · %d with an audio prompt' % (
             len(rows),
             sum(1 for r in rows if (r.get('visual_prompt') or '').strip()),
             sum(1 for r in rows if (r.get('audio_prompt') or '').strip())), '', '---', '']
    for r in rows:
        b.append('## ' + (r.get('filename_stem') or r.get('id', '?')))
        b.append('')
        b.append('%s · %s · %s · %s%s' % (
            r.get('collection_name', ''), (r.get('created_at') or '')[:19].replace('T', ' '),
            r.get('resolution', ''), r.get('duration_seconds', '?') + 's',
            ' · audio' if r.get('has_audio') else ' · silent'))
        b.append('')
        v = (r.get('visual_prompt') or '').strip()
        a = (r.get('audio_prompt') or '').strip()
        if v: b += ['**Visual** — ' + v, '']
        if a: b += ['**Audio** — ' + a, '']
        if not v and not a:
            b += ['*No prompt recorded. The stem is all there is: `%s`*' % (r.get('filename_stem') or ''), '']
        if r.get('parent_generation_id'):
            b += ['Seeded from `%s`' % r['parent_generation_id'][:8], '']
        b.append('---')
        b.append('')
    io.open(os.path.join(OUT, 'prompts', 'THE_PROMPTS.md'), 'w', encoding='utf-8')\
      .write('\n'.join(b) + '\n')

    # the index
    tv = sum(w['counts']['video'] for w in works)
    ts = sum(w['counts']['still'] for w in works)
    tb = sum(w['bytes'] for w in works)
    b = ['# Every experiment, in one place', '',
         '%d works · %d moving · %d still · %s' % (len(works), tv, ts, human(tb)), '',
         'The media is not copied here — each entry under `media/` is a symlink to the real',
         'directory, so this folder browses the whole thing without duplicating %s.' % human(tb),
         '',
         'Open `index.html` to look at it. `prompts/THE_PROMPTS.md` has every generation',
         'prompt. `catalogue.csv` is the same thing as a table.', '', '---', '']
    for kind, title in (('experiment', 'THE EXPERIMENTS'), ('cut', 'THE CUTS'),
                        ('source', 'THE SOURCE ARCHIVE'), ('tool', 'THE INSTRUMENTS')):
        sel = [w for w in works if w['kind'] == kind]
        if not sel: continue
        b += ['## ' + title, '']
        for w in sel:
            c = w['counts']
            bits = [('%d moving' % c['video']) if c['video'] else '',
                    ('%d still' % c['still']) if c['still'] else '',
                    ('%d sound' % c['audio']) if c['audio'] else '']
            b.append('### %s — %s' % (w['name'], ' · '.join([x for x in bits if x]) or 'pages'))
            b.append('')
            b.append('`%s`%s · %s' % (w['path'],
                     (' · `' + w['script'] + '`') if w['script'] else '', human(w['bytes'])))
            b.append('')
            if w['intent']:
                first = [ln for ln in w['intent'].split('\n') if ln.strip()]
                head = ' '.join(first[:6])
                b += ['> ' + head[:600] + ('…' if len(head) > 600 else ''), '']
            b += ['[what it was for](prompts/%s.md) · [open it](%s/)' % (w['name'], w['href']), '']
    io.open(os.path.join(OUT, 'INDEX.md'), 'w', encoding='utf-8').write('\n'.join(b) + '\n')

    write_html(works, tv, ts, tb)

    # a plain statement of what this folder is and what it is not
    tracked = sum(1 for w in works if not w['path'].startswith('MARKOV_POET'))
    io.open(os.path.join(OUT, 'README.md'), 'w', encoding='utf-8').write(
        '# COLLAGE_AND_VIDEO\n\n'
        'Every experiment in one place: %d works, %d moving pieces, %d stills, %s.\n\n'
        '- **`index.html`** — open this. Every work, what it was for, and what it made,\n'
        '  playing in place. Video loads on click, not on load.\n'
        '- **`INDEX.md`** — the same thing as text.\n'
        '- **`prompts/THE_PROMPTS.md`** — every generation prompt, as sent.\n'
        '- **`prompts/<work>.md`** — one file per work: what it was for, and what is in it.\n'
        '- **`catalogue.csv` / `.json`** — the same thing as a table.\n'
        '- each entry links straight to where the work really lives.\n\n'
        '## Two things to know\n\n'
        '**Nothing is copied.** The media is %s and duplicating it would double the\n'
        'repository to save a click. Each entry links by relative path to where the work\n'
        'actually lives, so this folder browses all of it and costs about a megabyte.\n'
        'It used to do this with directory symlinks; forty-three of them were committed and\n'
        'the build runner\'s tar died reading links to directories a checkout does not have,\n'
        'which took down every deploy. Relative paths cost the same and cannot do that.\n\n'
        '**Not all of it is in git.** `cut/out/` is committed and travels with the repo.\n'
        '`MARKOV_POET/` and `MARKOV_POET_00/` — the generated source archive, and the only\n'
        'place the real prompts live — are **not tracked**: they are gigabytes of video\n'
        'that a repository should not carry. On this machine the links resolve and\n'
        'everything plays. On a fresh clone the source-archive links will dangle, and\n'
        '`prompts/THE_PROMPTS.md` is then the only surviving record of what was asked for.\n'
        'That file is small, it is text, and it is committed for exactly that reason.\n\n'
        '## Rebuilding\n\n'
        '    python3 cut/pf/gather.py\n\n'
        'It reads the scripts\' own docstrings, the two manifests, and the directories\n'
        'themselves. Nothing here is hand-maintained, so nothing here goes stale silently.\n'
        % (len(works), tv, ts, human(tb), human(tb)))

    print('%d works · %d moving · %d still · %s' % (len(works), tv, ts, human(tb)))
    unattributed = [w['name'] for w in works if w['kind'] == 'experiment' and not w['script']]
    if unattributed:
        print('no script found for: ' + ', '.join(unattributed))
    print('wrote ' + os.path.relpath(OUT, ROOT))

if __name__ == '__main__':
    main()
