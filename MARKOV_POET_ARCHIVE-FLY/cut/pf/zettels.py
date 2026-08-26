#!/usr/bin/env python3
"""
THE ZETTEL LIBRARY — every collage image, and the film it is asking for.

A collage is a still that remembers it was once moving. Each of these was cut
out of the archive by a segmenter and put back together by a script, and each
one implies a camera it never had. This builds the library where the image and
that implied camera sit side by side.

Every zettel follows the CINEOSIS schema and is filed against one of Deamer's
forty-four signs — not decoratively, but because the sign names the operation the
image is already performing. GRID_ALL is acentred, so it is gaseous perception.
The quilt makes bodies out of their own world, so it is imprint. The cutsheet
puts the city on a diagram with its confidences showing, so it is cinema of the
brain.

Zettels are authored by hand as markdown with front matter. This only reads the
directory and renders the library, so adding a zettel is adding a file.

    python3 cut/pf/zettels.py
"""
import os, io, re, json

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT  = os.path.join(ROOT, 'COLLAGE_ZETTELS')
ZD   = os.path.join(OUT, 'zettels')

def parse(path):
    src = io.open(path, encoding='utf-8').read()
    m = re.match(r'^---\n(.*?)\n---\n(.*)$', src, re.S)
    if not m:
        return None
    meta = {}
    for line in m.group(1).split('\n'):
        if ':' in line:
            k, v = line.split(':', 1)
            meta[k.strip()] = v.strip()
    meta['body'] = m.group(2).strip()
    meta['file'] = os.path.basename(path)
    return meta

def esc(t):
    return (t or '').replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')

def main():
    zs = []
    for f in sorted(os.listdir(ZD)):
        if not f.endswith('.md'):
            continue
        z = parse(os.path.join(ZD, f))
        if z:
            zs.append(z)

    stages = []
    for z in zs:
        if z.get('stage') not in stages:
            stages.append(z.get('stage'))

    # link each zettel to the image, relative to the library folder
    for z in zs:
        z['rel'] = os.path.relpath(os.path.join(ROOT, z['image']), OUT)

    json.dump([{k: v for k, v in z.items() if k != 'body'} for z in zs],
              io.open(os.path.join(OUT, 'catalogue.json'), 'w', encoding='utf-8'),
              indent=1, ensure_ascii=False)

    h = ['<title>The collage zettels</title>', '<style>',
         ':root{--k:#111;--w:#f4f1ea;--a:#c8102e;--b:#0033cc}',
         '*{box-sizing:border-box}',
         'body{margin:0;background:var(--w);color:var(--k);'
         'font:13px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace}',
         'header{padding:28px 22px 18px;border-bottom:3px solid var(--k)}',
         'h1{margin:0 0 8px;font:700 15px/1.2 ui-monospace,monospace;letter-spacing:.26em}',
         '.sub{opacity:.65;font-size:11px;max-width:78ch}',
         'nav{padding:10px 22px;border-bottom:3px solid var(--k);position:sticky;top:0;'
         'background:var(--w);z-index:5;display:flex;flex-wrap:wrap;gap:6px}',
         'nav a{color:var(--k);text-decoration:none;border:2px solid var(--k);padding:5px 8px;'
         'font-size:10px;letter-spacing:.1em}',
         'nav a:hover{background:var(--k);color:var(--w)}',
         'h2{margin:0;padding:16px 22px;background:var(--k);color:var(--w);'
         'font:700 11px/1.2 ui-monospace,monospace;letter-spacing:.26em}',
         '.z{border-bottom:2px solid var(--k);padding:22px;display:grid;'
         'grid-template-columns:minmax(300px,42%) 1fr;gap:24px;align-items:start}',
         '@media(max-width:900px){.z{grid-template-columns:1fr}}',
         '.z img{width:100%;height:auto;border:3px solid var(--k);background:#fff;display:block}',
         '.id{font-size:10px;letter-spacing:.16em;opacity:.6}',
         '.z h3{margin:6px 0 4px;font:700 14px/1.35 ui-monospace,monospace}',
         '.sign{display:inline-block;background:var(--b);color:#fff;padding:3px 7px;'
         'font-size:9px;letter-spacing:.12em;margin-top:6px}',
         '.prompt{border:3px solid var(--k);background:#fff;padding:12px;margin:12px 0;'
         'font-size:12px;line-height:1.65}',
         '.prompt b{display:block;font-size:9px;letter-spacing:.16em;margin-bottom:6px;opacity:.6}',
         'details{margin-top:10px;border-top:2px solid var(--k);padding-top:8px}',
         'summary{cursor:pointer;font-size:10px;letter-spacing:.14em}',
         'pre{white-space:pre-wrap;font:11px/1.6 ui-monospace,monospace;margin:10px 0 0}',
         '</style>',
         '<header><h1>THE COLLAGE ZETTELS</h1>',
         '<div class="sub">%d collage images, each with the film it is asking for. '
         'Every one is filed against a sign from Deamer&rsquo;s taxonomy &mdash; not as decoration '
         'but because the sign names the operation the image is already performing.</div></header>'
         % len(zs)]

    h.append('<nav>')
    for s in stages:
        h.append('<a href="#%s">%s</a>' % (s, s.upper()))
    h.append('</nav>')

    for s in stages:
        h.append('<h2 id="%s">%s</h2>' % (s, s.upper()))
        for z in [x for x in zs if x.get('stage') == s]:
            h.append('<section class="z">')
            h.append('<div><img loading="lazy" src="%s" alt=""></div>' % esc(z['rel']))
            h.append('<div>')
            h.append('<div class="id">%s</div>' % esc(z['id']))
            h.append('<h3>%s</h3>' % esc(z.get('title','')))
            h.append('<div class="sign">%s &middot; %s</div>' % (esc(z.get('sign','')), esc(z.get('sign_id',''))))
            body = z['body']
            pm = re.search(r'TEXT-TO-CINEMA PROMPT:\s*\n\n(.*?)\n\n[A-Z]', body, re.S)
            if pm:
                h.append('<div class="prompt"><b>TEXT-TO-CINEMA PROMPT</b>%s</div>' % esc(pm.group(1).strip()))
            h.append('<details><summary>THE WHOLE ZETTEL &rarr;</summary><pre>%s</pre></details>' % esc(body))
            h.append('</div></section>')

    io.open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write('\n'.join(h) + '\n')

    b = ['# The collage zettels', '',
         '%d collage images, each with the film it is asking for.' % len(zs), '',
         'Open `index.html`. Each zettel is also its own file in `zettels/`.', '', '---', '']
    for s in stages:
        sel = [x for x in zs if x.get('stage') == s]
        b += ['## %s — %d' % (s, len(sel)), '']
        for z in sel:
            b.append('- **%s** · %s — *%s* · `%s`' % (
                z['id'], z.get('title',''), z.get('sign',''), z.get('image','')))
        b.append('')
    io.open(os.path.join(OUT, 'INDEX.md'), 'w', encoding='utf-8').write('\n'.join(b) + '\n')

    print('%d zettels · %d stages' % (len(zs), len(stages)))
    for s in stages:
        print('  %-14s %d' % (s, len([x for x in zs if x.get('stage')==s])))

if __name__ == '__main__':
    main()
