"""Build seg/index.html from seg/segments.json: each Genie take plays with its tracked outlines drawn over it,
and under it every ask shows its directed cut-outs moving through the 4-second window."""
import glob, html, json, os
S = os.path.dirname(os.path.abspath(__file__)); e = html.escape
seg = {}
for f in sorted(glob.glob(S + '/segments*.json')): seg.update(json.load(open(f)))
tri = {r['id']: r for r in json.load(open(os.path.dirname(S) + '/triage/triage.json'))}
takes = {}
for i, r in sorted(seg.items(), key=lambda x: (x[1]['take'], x[1]['t'])): takes.setdefault(r['take'], []).append((i, r))
order = [k for k in tri if k in takes]
C = {'yes': 'var(--yes)', 'partly': 'var(--partly)', 'no': 'var(--no)'}
nobj = sum(len(r['objects']) for r in seg.values()); npeople = sum(1 for r in seg.values() for o in r['objects'] if any(w in o['desc'] for w in (' man', ' woman', 'Black ', ' men', ' women')))
body = []
def dims(o, n):
    z = min(120 / o['sh'], 150 / o['sw']); w, h = round(o['sw'] * z, 2), round(o['sh'] * z, 2)
    return f"width:{w}px;height:{h}px;--n:{n};--x:{-w * n}px;background-size:{w * n}px {h}px"
for k in order:
    rows = takes[k]; film = rows[0][1]['film']
    cards = []
    for i, r in rows:
        objs = ''.join(
            f"<figure class='o {o['role']}'><div class='spr' style='{dims(o, r['frames'])};background-image:url({e(i)}/{o['k']}_track.png)'></div>"
            f"<figcaption><b>{e(o['label'])}</b> {e(o['desc'])}<i>{'subject' if o['role'] == 'reading' else 'figure'} · held {round(o['present'] * 100)}%</i></figcaption></figure>"
            for o in r['objects']) or "<p class='none'>Nothing to cut out.</p>"
        cards.append(f"<article class='ask' style='--v:{C.get(r['happened'], 'var(--dim)')}'><header><button data-t='{r['t']}'>{r['t']:.1f}s</button>"
                     f"<span class='v'>{e(r['happened'] or '—')}</span></header><p class='claim'>{e(r['claim'])}</p><div class='objs'>{objs}</div></article>")
    body.append(f"<section class='take' id='{e(k)}' data-take='{e(k)}'><h2>{e(tri[k]['title'])}</h2><div class='stage'><video controls playsinline muted preload='metadata' src='../{e(film)}'></video><canvas></canvas></div>"
                f"<div class='asks'>{''.join(cards)}</div></section>")
data = {k: [{'t0': r['t0'], 'n': r['frames'], 'fps': r['fps'], 'v': r['happened'],
             'o': [{'l': o['label'], 'r': o['role'], 'b': o['boxes']} for o in r['objects']]} for _, r in takes[k]] for k in order}
page = f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tracked Cut-outs</title><style>
:root{{--bg:#000;--ink:#f4f6ff;--dim:#8b93b5;--line:rgba(255,255,255,.16);--yes:#19e36a;--partly:#ffd400;--no:#ff2a2a;--hold:#1f4dff;--m:ui-monospace,"SF Mono",Menlo,Consolas,monospace}}
*{{box-sizing:border-box;margin:0;padding:0}}html{{-webkit-text-size-adjust:100%}}body{{background:var(--bg);color:var(--ink);font:15px/1.5 var(--m)}}
main{{max-width:1100px;margin:0 auto;padding:22px 16px 80px}}a{{color:var(--ink)}}
.top{{display:flex;justify-content:space-between;gap:10px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim)}}
h1{{font:400 clamp(34px,11vw,72px)/.95 var(--m);letter-spacing:-.04em;margin:14px 0 10px}}
.lede{{color:var(--dim);max-width:70ch;font-size:13px}}.sum{{display:flex;gap:18px;flex-wrap:wrap;margin:14px 0 6px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--dim)}}.sum b{{font-weight:400;font-size:20px;color:var(--ink);margin-right:5px}}
.take{{border-top:1px solid var(--line);margin-top:36px;padding-top:16px}}h2{{font:400 18px/1.25 var(--m);margin-bottom:10px}}
.stage{{position:relative;background:#02030c}}.stage video{{display:block;width:100%;aspect-ratio:16/9}}.stage canvas{{position:absolute;inset:0;width:100%;height:calc(100% - 0px);pointer-events:none}}
.asks{{display:grid;grid-template-columns:minmax(0,1fr);gap:10px;margin-top:12px}}.ask{{min-width:0;border-left:3px solid var(--v);background:#05081c;padding:10px 12px}}
.ask header{{display:flex;gap:10px;align-items:center;font-size:11px;letter-spacing:.12em;text-transform:uppercase}}
.ask button{{font:inherit;color:var(--bg);background:var(--ink);border:0;padding:3px 8px;cursor:pointer}}.v{{color:var(--v)}}
.claim{{font-size:13px;margin:6px 0 10px;color:#cfd4ee}}.objs{{display:flex;gap:12px;overflow-x:auto;padding-bottom:4px}}
.o{{flex:0 0 auto;width:150px;display:flex;flex-direction:column}}.o .spr{{align-self:flex-start}}.spr{{background:#1f4dff no-repeat 0 0;animation:play calc(var(--n) * 1s / 6) steps(var(--n)) infinite;margin-bottom:6px}}
.o.reading .spr{{outline:2px solid var(--v);outline-offset:2px}}@keyframes play{{to{{background-position-x:var(--x)}}}}
figcaption{{font-size:11px;line-height:1.35;color:var(--dim)}}figcaption b{{color:var(--ink);font-weight:400;display:block}}figcaption i{{display:block;font-style:normal;margin-top:3px;letter-spacing:.06em}}
.none{{font-size:12px;color:var(--dim)}}@media (prefers-reduced-motion:reduce){{.spr{{animation:none}}}}
</style></head><body><main>
<div class="top"><span>WYGWYL · Genie takes</span><span><a href="../triage/index.html">Triage</a> · <a href="../watch.html">Watch</a></span></div>
<h1>Tracked<br>cut-outs</h1>
<p class="lede">The cineosis-lab segmentation pass, run on the Genie takes. Every ask in the triage is one job: 24 frames at 6 fps around the moment it was sent. Gemini reads the ask and boxes its subject first, then up to three other figures, naming every person's gender, race and outfit. SAM 2.1 cuts each box and tracks it forward and back through the window. Play a take to see the outlines; the subject's outline takes the ask's verdict colour (green yes, yellow partly, red no).</p>
<div class="sum"><span><b>{len(seg)}</b>asks</span><span><b>{nobj}</b>tracked objects</span><span><b>{len(order)}</b>takes</span><span><b>{npeople}</b>people</span></div>
{''.join(body)}
</main><script>
const D={json.dumps(data, separators=(',', ':'))};const V={{yes:'#19e36a',partly:'#ffd400',no:'#ff2a2a'}};
document.querySelectorAll('.take').forEach(sec=>{{const vid=sec.querySelector('video'),cv=sec.querySelector('canvas'),g=cv.getContext('2d'),J=D[sec.dataset.take];
 function draw(){{const r=vid.getBoundingClientRect(),dpr=devicePixelRatio||1;if(cv.width!==Math.round(r.width*dpr)){{cv.width=Math.round(r.width*dpr);cv.height=Math.round(r.width*9/16*dpr)}}
  g.clearRect(0,0,cv.width,cv.height);const t=vid.currentTime,W=cv.width,H=cv.height;g.lineWidth=2*dpr;g.font=(11*dpr)+'px ui-monospace,monospace';
  for(const j of J){{const f=Math.floor((t-j.t0)*j.fps);if(f<0||f>=j.n)continue;for(const o of j.o){{const b=o.b[f];if(!b)continue;const c=o.r==='reading'?(V[j.v]||'#f4f6ff'):'#7f9bff';
   g.strokeStyle=c;g.strokeRect(b[0]*W,b[1]*H,b[2]*W,b[3]*H);const tw=g.measureText(o.l).width+8*dpr;g.fillStyle=c;g.fillRect(b[0]*W,b[1]*H-15*dpr,tw,15*dpr);g.fillStyle='#000';g.fillText(o.l,b[0]*W+4*dpr,b[1]*H-4*dpr)}}}}}}
 (function loop(){{draw();requestAnimationFrame(loop)}})();
 sec.querySelectorAll('button[data-t]').forEach(b=>b.onclick=()=>{{vid.currentTime=Math.max(0,+b.dataset.t-1);vid.play();vid.scrollIntoView({{block:'center',behavior:'smooth'}})}});}});
</script></body></html>"""
open(S + '/index.html', 'w').write(page); print('wrote', len(page), 'bytes;', len(seg), 'asks', nobj, 'objects')
