#!/usr/bin/env python3
"""
THE SCRIPTS — the five cuts as something you can read.

    python3 cut/pf/script.py

The films are 920 MB of mp4 and none of them is in the repository, so a link to
this archive has so far offered the poet everything except his own film. But
every cut was written down beside itself: WYGWYL_*.json carries each shot's
patch, source clip, source timecode, record timecode, duration, stanza, label,
screen text, and in D and E the line of the poem it holds. And a mid-frame of
all 135 shots sits in cut/frames at 1.8 MB for the lot.

That is enough to publish the film as a score. Every shot in order, its own
frame beside it, when it lands and how long it holds, and the words it carries.
A reader gets the whole structure of the cut and can say "shot 41 is wrong"
without downloading anything. An editor gets the same page as a relink sheet,
because each row names the source file and the in-point the cut took.

It is not the film. It is the film written down, which is a different and
honest thing, and it is what fits down a wire.
"""
import os, json, html, time

BASE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC  = os.path.join(BASE, 'cut', 'out')
OUT  = os.path.join(SRC, 'script')
FRAMES = '../../frames'          # from cut/out/script/ to cut/frames/

CUTS = [
 ('A', 'WYGWYL_A_THE_PQ_REEL', 'A · THE PQ REEL',
  'Every shot at its real duration, 5.04s to 39.17s, passed through without a '
  're-encode so the HDR is not flattened by being carried.'),
 ('B', 'WYGWYL_B_THE_WINDOW_AND_THE_DOOR', 'B · THE WINDOW AND THE DOOR',
  'Cut to the suite’s own script — 111 stanzas with screen text, voiceover and an '
  'image-function, which no previous cut had ever referenced.'),
 ('C', 'WYGWYL_C_THE_DECK_60BPM', 'C · THE DECK AT 60BPM',
  'The same material on a grid: one bar per shot at sixty beats a minute.'),
 ('D', 'WYGWYL_D_THE_DOOR', 'D · THE DOOR',
  'Ends on P014 — the only shot in the archive of an open, lit doorway, which had been '
  'sitting in the middle of poem 01.'),
 ('E', 'WYGWYL_E_THE_DOOR_mareamemory_06', 'E · THE DOOR, SCORED',
  'D again, carried on mareamemory 06.'),
]

def tc(s):
    s = max(0.0, float(s or 0))
    return f'{int(s//60):d}:{int(s%60):02d}' + f'{s - int(s):.2f}'[1:]

def esc(x): return html.escape(str(x or ''), quote=True)

CSS = """
*{box-sizing:border-box;margin:0;padding:0;border-radius:0!important}
:root{--paper:#f4f4f0;--paper2:#fdfdfa;--ink:#141414;--dim:#8a8a86;--l1:#e4e4e0;--l3:#a8a8a4;
 --accent:#0033cc;--warn:#8a6d00}
body{background:var(--paper);color:var(--ink);padding:0 20px 90px;
 font:400 15px/1.6 "Helvetica Neue",Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
.wrap{max-width:1000px;margin:0 auto}
header{border-bottom:3px solid var(--ink);padding:30px 0 20px;margin-bottom:8px}
.up{font:700 10px/1 ui-monospace,Menlo,monospace;letter-spacing:.18em;text-transform:uppercase;
 color:var(--accent);text-decoration:none;display:inline-block;margin-bottom:17px}
h1{font:900 clamp(22px,4.4vw,38px)/1.06 Helvetica,Arial;letter-spacing:.03em;text-transform:uppercase}
.lede{margin:17px 0 0;max-width:66ch;font-size:16px}
.tot{margin:15px 0 0;font:700 11px/1.7 ui-monospace,monospace;letter-spacing:.06em;color:var(--dim)}
.bar{position:sticky;top:0;z-index:30;background:var(--paper);border-bottom:1px solid var(--l3);
 padding:10px 0;display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin-bottom:16px}
.bar a,.bar b{font:900 10px/1 Helvetica;letter-spacing:.14em;text-transform:uppercase;
 border:1px solid var(--ink);padding:8px 11px;text-decoration:none;color:var(--ink);background:var(--paper2)}
.bar b{background:var(--ink);color:var(--paper2)}
.bar a:hover{background:var(--ink);color:var(--paper2)}
.mark{margin:30px 0 12px;border-top:2px solid var(--ink);padding-top:11px;
 font:900 12px/1.3 Helvetica;letter-spacing:.16em;text-transform:uppercase}
.mark small{display:block;font:700 10px/1.6 ui-monospace,monospace;letter-spacing:.06em;
 color:var(--dim);text-transform:none}
.shot{display:grid;grid-template-columns:132px 1fr;gap:14px;align-items:start;
 border-bottom:1px solid var(--l1);padding:11px 0}
.shot:hover{background:var(--paper2)}
.fr{display:block;border:1px solid var(--ink);background:var(--l1);aspect-ratio:4/3;overflow:hidden}
.fr img{width:100%;height:100%;object-fit:cover;display:block}
.fr.none{display:flex;align-items:center;justify-content:center;
 font:700 9px/1.3 ui-monospace,monospace;color:var(--l3);text-align:center;padding:6px}
.m{display:flex;gap:11px;flex-wrap:wrap;align-items:baseline;
 font:700 11px/1.5 ui-monospace,Menlo,monospace;color:var(--dim)}
.m .n{color:var(--ink)} .m .at{color:var(--ink)} .m .pid{color:var(--accent)}
.m .hdr{color:var(--warn)}
.lab{margin-top:5px;font:900 13px/1.3 Helvetica;letter-spacing:.04em;text-transform:uppercase}
.line{margin-top:7px;font:400 17px/1.5 Georgia,"Times New Roman",serif;max-width:60ch}
.text{margin-top:6px;font:400 13px/1.5 ui-monospace,Menlo,monospace;color:#3a3a38;max-width:66ch;
 border-left:2px solid var(--l3);padding-left:10px;white-space:pre-wrap}
.src{margin-top:7px;font:400 10px/1.4 ui-monospace,Menlo,monospace;color:var(--l3);word-break:break-all}
footer{margin-top:44px;border-top:3px solid var(--ink);padding-top:18px;max-width:78ch;
 font:400 13px/1.6 ui-monospace,Menlo,monospace;color:var(--dim)}
footer b{color:var(--ink)} footer p{margin:11px 0} footer a{color:var(--accent)}
@media(max-width:620px){body{padding:0 13px 70px}
 .shot{grid-template-columns:92px 1fr;gap:10px}.line{font-size:16px}}
"""

def nav(cur, back='../../../index.html'):
    out = [f'<a class="up" href="{back}">← THE DOOR</a>']
    bar = ''.join((f'<b>{c[0]}</b>' if c[0] == cur else f'<a href="{c[0]}.html">{c[0]}</a>')
                  for c in CUTS)
    return out[0], f'<div class="bar"><a href="index.html">ALL FIVE</a>{bar}</div>'

def page(key, stem, title, blurb):
    d = json.load(open(os.path.join(SRC, stem + '.json')))
    ev = d['events'] if isinstance(d, dict) else d
    secs = d.get('seconds') if isinstance(d, dict) else sum(e.get('dur', 0) for e in ev)
    up, bar = nav(key)
    # One divider per poem, carrying the richest label that poem ever gets.
    # Keying on `mark` alone broke the suite in two every time a shot happened
    # to be labelled "01" instead of "01 - OUT OF LIFE".
    def grp(e): return str(e.get('poem') or e.get('suite') or e.get('stanza', '')[:2] or '')
    best = {}
    for e in ev:
        g = grp(e); m = e.get('mark') or ''
        if g and len(m) > len(best.get(g, '')): best[g] = m
    rows, last_g, nframe = [], None, 0
    for i, e in enumerate(ev, 1):
        g = grp(e)
        if g and g != last_g:
            rows.append(f'<div class="mark">{esc(best.get(g) or g)}'
                        f'<small>from {esc(e.get("stanza") or "")}</small></div>')
            last_g = g
        pid = e.get('patch') or ''
        fp = os.path.join(BASE, 'cut', 'frames', f'{pid}.jpg')
        if pid and os.path.exists(fp):
            nframe += 1
            fr = (f'<a class="fr" href="{FRAMES}/{esc(pid)}.jpg">'
                  f'<img src="{FRAMES}/{esc(pid)}.jpg" alt="{esc(pid)}" loading="lazy" decoding="async"></a>')
        else:
            fr = '<div class="fr none">no frame<br>on file</div>'
        meta = [f'<span class="n">{i:03d}</span>',
                f'<span class="at">{tc(e.get("rec_in"))}</span>',
                f'<span>{float(e.get("dur") or 0):.2f}s</span>']
        if pid: meta.append(f'<span class="pid">{esc(pid)}</span>')
        if e.get('stanza'): meta.append(f'<span>{esc(e["stanza"])}</span>')
        if e.get('kind'): meta.append(f'<span>{esc(e["kind"]).upper()}</span>')
        if e.get('hdr'): meta.append('<span class="hdr">HDR</span>')
        if e.get('beats'): meta.append(f'<span>{esc(e["beats"])} beats</span>')
        body = [f'<div class="m">{"".join(meta)}</div>']
        if e.get('label'): body.append(f'<div class="lab">{esc(e["label"])}</div>')
        if e.get('line'):  body.append(f'<div class="line">{esc(e["line"])}</div>')
        if e.get('text'):  body.append(f'<div class="text">{esc(e["text"])}</div>')
        if e.get('src'):
            si = e.get('src_in')
            body.append(f'<div class="src">{esc(e["src"])}'
                        + (f' @ {float(si):.2f}s' if si is not None else '') + '</div>')
        rows.append(f'<div class="shot" id="s{i}">{fr}<div>{"".join(body)}</div></div>')

    lined = sum(1 for e in ev if e.get('line') or e.get('text'))
    h = (f'<!doctype html><html lang="en"><head><meta charset="utf-8">'
         f'<meta name="viewport" content="width=device-width,initial-scale=1">'
         f'<title>{esc(title)} — the script</title><style>{CSS}</style></head><body><div class="wrap">'
         f'<header>{up}<h1>{esc(title)}</h1><p class="lede">{esc(blurb)}</p>'
         f'<p class="tot">{len(ev)} SHOTS &middot; {int(secs//60)} MIN {int(secs%60):02d} SEC &middot; '
         f'{nframe} OF {len(ev)} WITH A FRAME ON FILE &middot; {lined} CARRYING WORDS</p></header>'
         f'{bar}{"".join(rows)}'
         f'<footer><p><b>This is the film written down, not the film.</b> Every row is one shot: '
         f'where it lands, how long it holds, which shot it is, and the words it carries. The frame '
         f'beside it is a real mid-frame of that shot. The grey line underneath names the source '
         f'clip and the second the cut took it from, which is what an editor needs to relink it.</p>'
         f'<p>The rendered mp4 is {"30 MB" if key=="A" else "over 100 MB"} and is not in this '
         f'repository — <a href="../../../index.html#F0{"ABCDE".index(key)+1}">its card on THE DOOR</a> '
         f'says why. The exchange files beside it — .edl, .otio, .json and a cue sheet — are.</p>'
         f'<p>Generated by <code>cut/pf/script.py</code> from <code>{stem}.json</code>.</p>'
         f'</footer></div></body></html>')
    open(os.path.join(OUT, f'{key}.html'), 'w').write(h)
    return dict(key=key, title=title, n=len(ev), secs=secs, frames=nframe, lined=lined, stem=stem)

def main():
    os.makedirs(OUT, exist_ok=True)
    made = [page(*c) for c in CUTS]
    cards = ''.join(
      f'<a class="shot" href="{m["key"]}.html" style="text-decoration:none;color:inherit">'
      f'<div class="fr none">{m["key"]}</div><div>'
      f'<div class="lab">{esc(m["title"])}</div>'
      f'<div class="m"><span class="n">{m["n"]} shots</span>'
      f'<span>{int(m["secs"]//60)} min {int(m["secs"]%60):02d} sec</span>'
      f'<span>{m["frames"]} frames on file</span>'
      f'<span>{m["lined"]} carrying words</span></div>'
      f'<div class="src">{esc(m["stem"])}.json · .edl · .otio</div></div></a>' for m in made)
    tot = sum(m['n'] for m in made)
    h = (f'<!doctype html><html lang="en"><head><meta charset="utf-8">'
         f'<meta name="viewport" content="width=device-width,initial-scale=1">'
         f'<title>THE SCRIPTS — five cuts, readable</title><style>{CSS}</style></head>'
         f'<body><div class="wrap"><header>'
         f'<a class="up" href="../../../index.html">← THE DOOR</a>'
         f'<h1>The Scripts</h1><p class="lede">The five cuts as something you can read. Every shot '
         f'in order with its own frame, when it lands, how long it holds, the source clip and '
         f'timecode it was taken from, and the words it carries. The films themselves are 920 MB '
         f'and are not in this repository; these are.</p>'
         f'<p class="tot">5 CUTS &middot; {tot} SHOTS &middot; BUILT {time.strftime("%Y-%m-%d")}</p>'
         f'</header>{cards}</div></body></html>')
    open(os.path.join(OUT, 'index.html'), 'w').write(h)
    for m in made:
        print(f'  {m["key"]}  {m["title"][:34]:34s} {m["n"]:4d} shots · '
              f'{m["frames"]:3d} framed · {m["lined"]:3d} lined')
    print(f'\n-> {os.path.relpath(OUT, os.getcwd())}')

if __name__ == '__main__':
    main()
