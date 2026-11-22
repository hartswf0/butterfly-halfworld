#!/usr/bin/env python3
"""Rebuild triage/index.html from triage.json as ONE self-contained file: pictures and sound are inside the page, so it
shows anywhere. Each ask is a card: the frame, the verdict, his words at that moment, what was sent, what was seen, and
four seconds of the take's sound.     python3 triage/page.py"""
import base64, html, io, json, os, subprocess
from PIL import Image
T = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); R = json.load(open(T + '/triage/triage.json')); TIDE = json.load(open(T + '/tide.json'))['poems']; TMP = '/tmp/claude-0/triage'; os.makedirs(TMP, exist_ok=True)
SRC = {'03-film-': ('pcm', 'runs/03-film-20261121-232051/world.pcm'), '03-sheet': ('pcm', 'runs/03-sheet-20261121-233235/world.pcm'), 'street-020': ('v', 'litmus/out/street-020.mp4'), 'street-091': ('v', 'litmus/out/street-091.mp4'), 'street-098': ('v', 'litmus/out/street-098.mp4'),
       'poemwalk-greybox': ('v', 'litmus/out/poemwalk-greybox.mp4'), 'poemwalk-cel020': ('v', 'litmus/out/poemwalk-cel020.mp4'), 'probe-sheet': ('v', 'litmus/out/probe-sheet.mp4'), 'probe-plan': ('v', 'litmus/out/probe-plan.mp4'), 'probe-life': ('v', 'litmus/out/probe-life.mp4'), 'probe-spin': ('v', 'litmus/out/probe-spin.mp4'),
       'full-06': ('v', 'full/out/06-1122-0025/film.mp4'), 'full-12': ('v', 'full/out/12-1122-0036/film.mp4'), 'shots-12': ('v', 'full/out/12shots-1122-0105/film.mp4'), 'ride-grey': ('v', 'full/out/10ride-grey-1122-0119/film.mp4'), 'ride-cel': ('v', 'full/out/10ride-cel-1122-0129/film.mp4'), 'ride-greyfig': ('v', 'full/out/10ride-greyfig-1122-0135/film.mp4')}
POEM = {'03-film-': 3, '03-sheet': 3, 'poemwalk-greybox': 6, 'poemwalk-cel020': 6, 'full-06': 6, 'full-12': 12, 'shots-12': 12, 'ride-grey': 10, 'ride-cel': 10, 'ride-greyfig': 10}
VOICED = {'poemwalk-greybox', 'poemwalk-cel020', 'full-06', 'full-12', 'shots-12', 'ride-grey', 'ride-cel', 'ride-greyfig'}
def b64(path, mime): return f"data:{mime};base64," + base64.b64encode(open(path, 'rb').read()).decode()
def pic(path, w=420, q=62):
    im = Image.open(path).convert('RGB'); im.thumbnail((w, w)); b = io.BytesIO(); im.save(b, 'JPEG', quality=q); return 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()
def sound(rid, t):
    kind, p = SRC[rid]; o = TMP + '/c.mp3'; a = max(0, t - 2.5)
    cmd = ['ffmpeg', '-y', '-loglevel', 'error'] + (['-f', 's16le', '-ar', '48000', '-ac', '2'] if kind == 'pcm' else []) + ['-ss', f'{a:.2f}', '-t', '4.5', '-i', f'{T}/{p}', '-vn', '-ac', '1', '-ar', '22050', '-b:a', '24k', o]
    subprocess.run(cmd); return b64(o, 'audio/mpeg') if os.path.exists(o) and os.path.getsize(o) > 500 else None
def words(rid, t):
    if rid not in POEM: return None
    if rid == 'ride-greyfig' and t > 13: t = 53.3 + (t - 13)
    L = TIDE[POEM[rid] - 1]['lines']; c = [l for l in L if l['t0'] - .5 <= t <= l['t1'] + 1.5] or [min(L, key=lambda l: abs((l['t0'] + l['t1']) / 2 - t))]; return c[-1]['text']

FILM = {'03-film-': 'litmus/out/poem03-take1.mp4', '03-sheet': 'litmus/out/poem03-take2.mp4'}
for k, (kind, p) in SRC.items():
    if kind == 'v': FILM[k] = p
e = html.escape; n = dict(yes=0, partly=0, no=0); lanes = []; panes = []
for li, r in enumerate(R):
    dur = r['dur'] or 20; tally = {h: sum(a.get('happened') == h for a in r['asks']) for h in n}
    for h in n: n[h] += tally[h]
    bands = ''.join(f"<i class='hold' style='top:{k['a'] / dur * 100:.1f}%;height:{max(1.2, (k['b'] - k['a']) / dur * 100):.1f}%'></i>" for k in r['key_rows'])
    cards = []
    for i, a in enumerate(r['asks']):
        sx = r['sent'][a['ref']] if 'ref' in a else None; snd = sound(r['id'], a['t']); w = words(r['id'], a['t'])
        when = (f"sent {sx['t']} s" + (f" for “{e(sx['word'])}”" if 'word' in sx else '') + (f" · {e(sx['by'])}" if sx['by'] != 'script' else '')) if sx else 'in the opening text'
        bands += f"<button class='b {a['happened']}' style='top:{min(96, a['t'] / dur * 100):.1f}%' data-l='{li}' data-i='{i}' data-t='{a['t']:.1f}' aria-label='{e(r['title'])}, {a['t']:.0f} seconds: {a['happened']}'></button>"
        cards.append(f"""<article class="c {a['happened']}" id="c{li}-{i}"><div class="f"><img loading="lazy" src="{pic(T + '/triage/' + a['kf'])}" alt="Frame at {a['t']:.0f} seconds"><b>{a['happened']}</b><button class="go" data-t="{a['t']:.1f}" aria-label="Play the video from this moment">{a['t']:.0f} s ▶</button>{f'<button class="snd" data-a="{snd}" aria-label="Play four seconds of sound from this moment">sound</button>' if snd else ''}</div>
<dl>{f'<dt>he says</dt><dd class="w">“{e(w)}”</dd>' if w else ''}<dt>asked · {when}</dt><dd>{e(a['claim'])}</dd><dt>seen</dt><dd>{e(a['seen'])}</dd></dl></article>""")
    for pr in r.get('prior') or []:
        cards.append(f"""<article class="c wide"><div class="f"><img loading="lazy" src="{pic(T + '/triage/' + pr['strip'], 1100, 55)}" alt="Frames from this take"></div><dl>{''.join(f"<dt>{e(str(x['t']))} s · {e(str(x['claim']))}</dt><dd>{e(str(x['verdict']))}</dd>" for x in pr['rows'])}</dl></article>""")
    if not r['asks']: bands += "<i class='none'></i>"
    kr = [k for k in r['key_rows'] if k['motion'] is not None]; st = r.get('still'); keys = ''
    if kr:
        fw = [k for k in kr if k['key'] == 'key_w']; tu = [k for k in kr if k['key'] != 'key_w']; bits = []
        if fw: bits.append(f"forward ×{len(fw)}" + (f", {sum(k['motion'] > st * 1.25 for k in fw)} moved more than still" if st else ''))
        if tu: bits.append(f"other keys ×{len(tu)}, movement {', '.join(str(k['motion']) for k in tu)}" + (f" vs {st} still" if st else ''))
        keys = f"<p class='k'><i class='sw'></i>keys held · {'; '.join(bits)}</p>"
    seedimg = f"<img class='seed' loading='lazy' src='{pic(T + '/' + r['seed_image'], 300)}' alt='Starting picture'>" if r['seed_image'] and os.path.exists(T + '/' + r['seed_image']) else ''
    vid = f"<video controls playsinline preload='none' src='../{FILM[r['id']]}'></video><p class='k vn'>Plays when this page is opened from the site. Tap a band or a frame's time to jump there.</p>" if r['id'] in FILM else ''
    lanes.append(f"<div class='lane' data-l='{li}'>{bands}<span>{li + 1:02d}</span></div>")
    panes.append(f"""<section class="pane" id="p{li}" hidden><p class="no">{li + 1:02d}</p><h2>{e(r['title'])}</h2><p class="t">{(f"{tally['yes']} yes · {tally['partly']} partly · {tally['no']} no") if r['asks'] else 'frames and first results only'}{f" · {r['dur']:.0f} s" if r['dur'] else ''}</p>
{vid}{f"<p class='k'>{e(r['note'])}</p>" if r['note'] else ''}{keys}<details class="o"><summary>opening text{' + picture' if seedimg else ''}</summary>{seedimg}<pre>{e(r['seed_text'])}</pre></details><div class="g">{''.join(cards)}</div></section>""")
tot = sum(n.values())
page = f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>The Gel · WYGWYL</title>
<style>
:root{{--bg:#000;--ink:#f4f6ff;--dim:#8b93b5;--line:rgba(255,255,255,.16);--yes:#19e36a;--partly:#ffd400;--no:#ff2a2a;--hold:#1f4dff;--m:ui-monospace,"SF Mono",Menlo,Consolas,monospace}}
*{{box-sizing:border-box;margin:0;padding:0}}html{{-webkit-text-size-adjust:100%}}body{{background:var(--bg);color:var(--ink);font:15px/1.5 var(--m)}}
main{{max-width:1100px;margin:0 auto;padding:18px 12px 110px}}
.top{{display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim)}}.top a{{color:var(--ink)}}
h1{{font:400 clamp(34px,11vw,72px)/.95 var(--m);letter-spacing:-.04em;margin:14px 0 8px}}
.sum{{display:flex;gap:18px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--dim);flex-wrap:wrap}}.sum b{{font-weight:400;font-size:20px;margin-right:5px}}
.gel{{position:relative;display:flex;gap:3px;height:min(56vh,460px);margin:16px -12px 0;padding:0 12px 22px;background:#000;overflow:hidden}}
.gel::after{{content:"";position:absolute;inset:0 0 22px;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(0,0,0,.42) 0 1px,transparent 1px 3px)}}
.lane{{position:relative;flex:1;min-width:0;background:linear-gradient(#05081c,#02030c);cursor:pointer}}.lane span{{position:absolute;bottom:-20px;left:0;right:0;text-align:center;font-size:9px;color:var(--dim)}}
.lane.on{{box-shadow:-2px 0 0 #fff,2px 0 0 #fff;z-index:2}}.lane.on span{{color:#fff}}
.b{{position:absolute;left:0;right:0;height:4.2%;min-height:9px;border:0;padding:0;cursor:pointer;border-radius:1px}}
.b.yes{{background:var(--yes);box-shadow:0 0 9px var(--yes)}}.b.partly{{background:var(--partly);box-shadow:0 0 9px rgba(255,212,0,.7)}}.b.no{{background:var(--no);box-shadow:0 0 9px rgba(255,42,42,.8)}}
.b.cur{{outline:2px solid #fff;z-index:3}}.hold{{position:absolute;left:18%;right:18%;background:var(--hold);opacity:.75}}.none{{position:absolute;inset:8% 30% 8%;background:repeating-linear-gradient(0deg,#1a2148 0 4px,transparent 4px 12px)}}
.gel.f-yes .b:not(.yes),.gel.f-partly .b:not(.partly),.gel.f-no .b:not(.no){{opacity:.1;box-shadow:none}}
nav{{position:sticky;top:0;z-index:5;background:rgba(0,0,0,.92);backdrop-filter:blur(6px);display:flex;gap:6px;padding:10px 0;border-bottom:1px solid var(--line);overflow-x:auto}}
nav button{{flex:0 0 auto;font:12px var(--m);letter-spacing:.08em;text-transform:uppercase;color:var(--ink);background:none;border:1px solid var(--line);padding:0 12px;min-height:42px;cursor:pointer}}
nav button[aria-pressed=true]{{background:var(--ink);color:#000}}nav button i{{display:inline-block;width:9px;height:9px;margin-right:6px;vertical-align:middle}}
.hint{{color:var(--dim);font-size:12.5px;margin-top:16px}}.pane{{padding-top:18px}}.no{{font-size:11px;color:var(--dim);letter-spacing:.14em}}
h2{{font:400 22px/1.15 var(--m);letter-spacing:-.02em;margin:2px 0 4px}}.t{{font-size:12px;color:var(--dim);letter-spacing:.06em;text-transform:uppercase}}
video{{display:block;width:100%;aspect-ratio:16/9;background:#05081c;margin-top:12px}}.k{{font-size:12.5px;color:var(--dim);margin-top:8px;max-width:760px}}.sw{{display:inline-block;width:9px;height:9px;background:var(--hold);margin-right:7px}}
.o{{margin:8px 0 4px}}.o summary{{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--dim);cursor:pointer;min-height:40px;display:flex;align-items:center}}.seed{{display:block;width:200px;margin:6px 0}}
pre{{white-space:pre-wrap;font:12px/1.55 var(--m);color:#c9d2f5;border-left:2px solid var(--hold);padding-left:10px}}
.g{{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:26px 16px;margin-top:16px}}.c.wide{{grid-column:1/-1}}.c{{scroll-margin-top:70px}}
.f{{position:relative;border-top:5px solid var(--line)}}.c.yes .f{{border-color:var(--yes)}}.c.partly .f{{border-color:var(--partly)}}.c.no .f{{border-color:var(--no)}}.f img{{display:block;width:100%;background:#05081c}}
.f b{{position:absolute;left:0;top:0;font:700 11px var(--m);letter-spacing:.12em;text-transform:uppercase;color:#000;padding:3px 8px}}.c.yes b{{background:var(--yes)}}.c.partly b{{background:var(--partly)}}.c.no b{{background:var(--no)}}
.f button{{position:absolute;bottom:6px;font:12px var(--m);color:#fff;background:rgba(0,0,0,.72);border:1px solid rgba(255,255,255,.4);padding:0 10px;min-height:36px;cursor:pointer}}.go{{left:6px}}.snd{{right:6px}}.snd.on{{background:#fff;color:#000}}
dl{{margin-top:8px}}dt{{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim);margin-top:9px}}dd{{font-size:13.5px}}dd.w{{font:italic 16px/1.4 "Iowan Old Style",Palatino,Georgia,serif}}
.hide{{display:none}}
</style></head><body><main>
<div class="top"><span>WYGWYL · the gel</span><span><a href="../seg/index.html">cut-outs</a> · <a href="../watch.html">all videos</a></span></div>
<h1>Did it happen?</h1>
<div class="sum"><span><b style="color:var(--yes)">{n['yes']}</b>yes</span><span><b style="color:var(--partly)">{n['partly']}</b>partly</span><span><b style="color:var(--no)">{n['no']}</b>no</span><span><b>{tot}</b>asks · {len(R)} runs</span></div>
<div class="gel" id="gel">{''.join(lanes)}</div>
<nav aria-label="Show"><button data-f="all" aria-pressed="true">all</button><button data-f="yes" aria-pressed="false"><i style="background:var(--yes)"></i>yes</button><button data-f="partly" aria-pressed="false"><i style="background:var(--partly)"></i>partly</button><button data-f="no" aria-pressed="false"><i style="background:var(--no)"></i>no</button></nav>
<p class="hint" id="hint">Each lane is one run, read top to bottom in time. Each band is one thing we asked for, coloured by whether it happened. Blue is a key being held. Tap a lane or a band.</p>
{''.join(panes)}
</main><script>
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],au=new Audio();let cur=null,open=-1;
function show(l){{if(open===l)return;open=l;$$('.pane').forEach((p,i)=>p.hidden=i!==l);$$('.lane').forEach((x,i)=>x.classList.toggle('on',i===l));$('#hint').hidden=true}}
function seek(l,t){{const v=$('#p'+l+' video');if(v){{const go=()=>{{v.currentTime=Math.max(0,t-1.5);v.play().catch(()=>{{}})}};v.readyState?go():(v.addEventListener('loadedmetadata',go,{{once:true}}),v.load())}}}}
document.addEventListener('click',e=>{{
 const s=e.target.closest('.snd');if(s){{if(cur===s&&!au.paused){{au.pause();return}}cur&&cur.classList.remove('on');cur=s;au.src=s.dataset.a;au.play();s.classList.add('on');return}}
 const g=e.target.closest('.go');if(g){{seek(open,+g.dataset.t);$('#p'+open+' video')?.scrollIntoView({{block:'center',behavior:'smooth'}});return}}
 const b=e.target.closest('.b');if(b){{show(+b.dataset.l);$$('.b.cur').forEach(x=>x.classList.remove('cur'));b.classList.add('cur');$('#c'+b.dataset.l+'-'+b.dataset.i).scrollIntoView({{block:'start',behavior:'smooth'}});return}}
 const l=e.target.closest('.lane');if(l){{show(+l.dataset.l);$('#p'+l.dataset.l).scrollIntoView({{block:'start',behavior:'smooth'}});return}}
 const f=e.target.closest('nav button');if(f){{$$('nav button').forEach(x=>x.setAttribute('aria-pressed',x===f));const k=f.dataset.f;$('#gel').className='gel'+(k==='all'?'':' f-'+k);$$('.c').forEach(c=>c.classList.toggle('hide',k!=='all'&&!c.classList.contains(k)&&!c.classList.contains('wide')))}}}});
au.onended=au.onpause=()=>cur&&cur.classList.remove('on');
</script></body></html>"""
open(T + '/triage/index.html', 'w').write(page); print(len(R), 'lanes', tot, 'bands', os.path.getsize(T + '/triage/index.html') // 1024, 'KB')
