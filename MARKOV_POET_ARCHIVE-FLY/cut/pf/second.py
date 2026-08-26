#!/usr/bin/env python3
"""
THE SECOND PASS — passages instead of fields.

WHAT WAS WRONG WITH THE FIRST HUNDRED AND SEVEN

Every image was ONE OPERATION APPLIED UNIFORMLY. GRID_ALL scatters everything.
The type-composites stack everything. The poem-fields average everything. The
meta-collage templates everything. That is why they all share a look no matter
what they are made of: the operation, not the material, is doing the talking.

Six things are missing, and they are the six this adds.

  1. PASSAGES.  A canvas divided into unequal regions, each with its own
     operation and density — a dense corner against a nearly empty half. Not a
     grid: recursive uneven splits with torn boundaries.

  2. REGISTERS OF MAKING.  Photographic transfer is one mark. A collage that
     holds up has several: drawn line, halftone, type, measurement, erasure,
     wash. All of ours can be derived from data we already have — contours from
     the segmenter's own masks, dots from the beflix law, text from the poem's
     own line, numbers from the confidence scores.

  3. SCALE JUMP.  Everything in our images sits at one scale of fragment. Here
     the largest element is at least twenty-five times the smallest, deliberately.

  4. PALIMPSEST.  Built in ordered passes where later passes only partly cover
     earlier ones, so the picture shows its own sequence. A single pass cannot
     look like a decision because it never had to survive another one.

  5. LOCAL COLOUR.  The accent appears in exactly ONE region. A palette applied
     globally is a filter; a palette applied locally is a choice.

  6. ONE EVENT.  Each image gets a focal incident — one operation that occurs
     nowhere else in that image. Without it there is nothing to look at first.

WHERE THE VOICE COMES FROM

Not from a style setting. From what each poem's material actually is, measured:

    01  1106 elements from 67 shots of one room  ->  PALIMPSEST
    02    14 elements from a single shot         ->  ENLARGEMENT past resolution
    10  dominated by hands                       ->  GESTURE
    11  dominated by windows                     ->  APERTURE
    13  dominated by walls                       ->  SURFACE
    14  64% one noun, the most concentrated      ->  SATURATION

Superabundance gets erasure; poverty gets magnification. A poem whose archive is
mostly hands is composed out of reaching. The operation is chosen by the archive,
which means no two are alike for a reason rather than by seed.

    python3 cut/pf/second.py           all fourteen + CONTACT
    python3 cut/pf/second.py 06        one
"""
import os, io, sys, json, math, random, collections
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from meta import ink, palette_of, torn_mask, noise1d, darker      # shared craft

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT  = os.path.join(ROOT, 'cut', 'out', 'second')
W, H = 2000, 2600
PAPER = (236, 231, 220)

# ── 1. COMPOSITION — eight geometries, not one ───────────────────────────────
"""
WHY THEY ALL LOOKED ALIKE.

The first second-pass gave every image the same recursive rectangle split, the
same five or six passes, the same full-bleed coverage, the same torn edge and the
same palette RELATIONSHIP — only the hue changed. But the eye reads structure
long before it reads colour, so fourteen identical structures in fourteen hues is
one image recoloured fourteen times. Hue is the last thing to vary, not the first.

So composition is now a grammar of eight geometries that disagree with each other
about the most basic questions: where the weight is, how much of the paper is
touched at all, and whether the picture is one thing or two.
"""
def split(box, depth, out, rnd):
    x, y, w, h = box
    if depth == 0 or w < 240 or h < 240:
        out.append(box); return
    vert = (w / float(h)) > (0.85 + rnd.random() * 0.5)
    f = 0.30 + rnd.random() * 0.38
    if vert:
        c = int(w * f)
        split((x, y, c, h), depth-1, out, rnd); split((x+c, y, w-c, h), depth-1, out, rnd)
    else:
        c = int(h * f)
        split((x, y, w, c), depth-1, out, rnd); split((x, y+c, w, h-c), depth-1, out, rnd)

def comp_quarters(W, H, rnd):
    out = []; split((0, 0, W, H), 3, out, rnd); return out

def comp_strata(W, H, rnd):
    """horizontal bands of wildly unequal depth — the horizon logic"""
    out, y = [], 0
    while y < H:
        h = int(H * (0.05 + rnd.random() ** 2 * 0.34))
        out.append((0, y, W, min(h, H - y))); y += h
    return out

def comp_figure(W, H, rnd):
    """ONE dominant mass, and a great deal of nothing around it"""
    fw, fh = int(W * (.42 + rnd.random() * .22)), int(H * (.50 + rnd.random() * .26))
    fx, fy = int((W - fw) * (.2 + rnd.random() * .6)), int((H - fh) * (.15 + rnd.random() * .7))
    return [(fx, fy, fw, fh),
            (fx - int(W*.12), fy - int(H*.08), int(W*.20), int(H*.22)),
            (fx + fw - int(W*.06), fy + fh - int(H*.30), int(W*.22), int(H*.26))]

def comp_constellation(W, H, rnd):
    """small incidents on a mostly untouched sheet"""
    return [(rnd.randint(0, int(W*.82)), rnd.randint(0, int(H*.86)),
             int(W * (.06 + rnd.random()*.20)), int(H * (.05 + rnd.random()*.16)))
            for _ in range(rnd.randint(7, 13))]

def comp_spine(W, H, rnd):
    """one axis of density, empty flanks"""
    diag = rnd.random() < .45
    out = []
    n = rnd.randint(5, 8)
    for i in range(n):
        t = i / float(n - 1)
        cx = int(W * (.18 + t * .64)) if diag else int(W * (.34 + rnd.random() * .30))
        cw = int(W * (.16 + rnd.random() * .22)); ch = int(H / n * (1.0 + rnd.random() * .7))
        out.append((cx - cw // 2, int(t * (H - ch)), cw, ch))
    return out

def comp_corner(W, H, rnd):
    """everything crowded into one edge, a huge void kept"""
    cx = rnd.choice([0, 1]); cy = rnd.choice([0, 1])
    out = []
    for i in range(rnd.randint(5, 8)):
        w = int(W * (.14 + rnd.random() * .30)); h = int(H * (.10 + rnd.random() * .28))
        x = rnd.randint(0, int(W*.34)) if cx == 0 else rnd.randint(int(W*.50), max(int(W*.50), W - w))
        y = rnd.randint(0, int(H*.30)) if cy == 0 else rnd.randint(int(H*.54), max(int(H*.54), H - h))
        out.append((x, y, w, h))
    return out

def comp_flood(W, H, rnd):
    """edge to edge, no paper, everything overlapping everything"""
    return [(rnd.randint(int(-W*.15), int(W*.5)), rnd.randint(int(-H*.15), int(H*.5)),
             int(W * (.45 + rnd.random()*.55)), int(H * (.40 + rnd.random()*.60)))
            for _ in range(rnd.randint(8, 12))]

def comp_fold(W, H, rnd):
    """two halves that disagree, with a hard seam between them"""
    c = int(W * (.36 + rnd.random() * .28))
    L = []; R = []
    split((0, 0, c, H), 2, L, rnd); split((c, 0, W - c, H), 2, R, rnd)
    return L + R

COMPS = {'quarters': comp_quarters, 'strata': comp_strata, 'figure': comp_figure,
         'constellation': comp_constellation, 'spine': comp_spine, 'corner': comp_corner,
         'flood': comp_flood, 'fold': comp_fold}

# format is part of the difference: a square beside a 3:1 reads as other work
FORMATS = {'portrait': (2000, 2600), 'wide': (2600, 1800), 'square': (2200, 2200),
           'tall': (1700, 2900), 'panorama': (3000, 1400)}

# ── 2. REGISTERS OF MAKING ───────────────────────────────────────────────────
def bleed(box, f, rnd):
    """A REGION IS A BIAS, NOT A FENCE.

    The first version clipped every operation to its own torn rectangle and the
    result was a patchwork of stamps — exactly the grid the passages were meant
    to replace. Regions now overflow their bounds by a third or more, so a
    passage begins somewhere and ends somewhere else, which is what makes it a
    passage rather than a tile."""
    x, y, w, h = box
    gx, gy = int(w * f * (.5 + rnd.random())), int(h * f * (.5 + rnd.random()))
    return (x - gx, y - gy, w + gx * 2, h + gy * 2)

def reg_wash(cv, box, ctx):
    x, y, w, h = bleed(box, .42, ctx['rnd'])
    p = ink(ctx['sky'].resize((w, h), Image.LANCZOS), ctx['hue'], *ctx['band'], amount=.94)
    m = torn_mask(w, h, ctx['seed'], .16, feather=max(14, min(w, h) * .10))
    cv.paste(p.filter(ImageFilter.GaussianBlur(ctx['rnd'].randint(6, 20))), (x, y), m)

def reg_stack(cv, box, ctx):
    x, y, w, h = bleed(box, .26, ctx['rnd'])
    p = ink(ctx['field'].resize((w, h), Image.LANCZOS), ctx['hue'], *ctx['band'], amount=.90)
    cv.paste(p, (x, y), torn_mask(w, h, ctx['seed'], .09, feather=max(6, min(w, h) * .04)))

def reg_field(cv, box, ctx):
    """scatter — but with a real scale jump inside one region"""
    x, y, w, h = box
    els = ctx['els']
    if not els: return
    wt = ctx.get('weight', 1.0)
    n = int(ctx['density'] * 210 / wt) + 12
    big = max(20, int(min(w, h) * (0.65 + ctx['rnd'].random() * 0.7) * wt))
    for i in range(n):
        # 3 ELEMENTS ARE HUGE, the rest are crumbs: 25:1 or it reads as one size
        s = big if i < max(3, int(3 * wt)) else max(4, int(big / (8 + ctx['rnd'].random() * 26)))
        e = ctx['rnd'].choice(els)
        im = ctx['open_el'](e)
        if im is None: continue
        iw, ih = im.size
        sh = max(3, int(s * ih / max(1, iw))) if iw >= ih else s
        sw = s if iw >= ih else max(3, int(s * iw / max(1, ih)))
        im = im.resize((max(2, sw), max(2, sh)), Image.LANCZOS)
        rgb = ink(im.convert('RGB'), ctx['hue'], *ctx['band'], amount=.72)
        px = x + ctx['rnd'].randint(-sw // 3, max(1, w - sw // 2))
        py = y + ctx['rnd'].randint(-sh // 3, max(1, h - sh // 2))
        cv.paste(rgb, (px, py), im.split()[3])

def reg_contour(cv, box, ctx):
    """DRAWN LINE, from the segmenter's own masks. Not a filter — a different
       kind of mark, which is what a surface needs to stop looking transferred."""
    x, y, w, h = box
    lay = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    col = darker(ctx['hue'], .30) + (255,)
    for _ in range(max(3, int(ctx['rnd'].randint(5, 14) / ctx.get('weight',1.0)))):
        e = ctx['rnd'].choice(ctx['els'])
        im = ctx['open_el'](e)
        if im is None: continue
        a = np.asarray(im.split()[3])
        cs, _ = cv2.findContours((a > 110).astype(np.uint8),
                                 cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not cs: continue
        c = max(cs, key=cv2.contourArea).reshape(-1, 2).astype(np.float32)
        if len(c) < 8: continue
        s = (0.25 + ctx['rnd'].random() * 1.5) * ctx.get('weight',1.0) * min(w, h) / max(1.0, a.shape[0])
        c = c * s
        ox = ctx['rnd'].randint(-w // 4, w); oy = ctx['rnd'].randint(-h // 4, h)
        pts = [(float(px + ox), float(py + oy)) for px, py in c]
        d.line(pts + [pts[0]], fill=col,
               width=max(2, int(ctx['rnd'].randint(2, 6) * ctx.get('weight',1.0))), joint='curve')
    cv.paste(lay, (x, y), lay)

def reg_halftone(cv, box, ctx):
    """the beflix law as a register: eight weights of ink, ordered dither"""
    x, y, w, h = box
    small = ctx['field'].resize((max(8, w // 12), max(8, h // 12)), Image.LANCZOS).convert('L')
    a = np.asarray(small).astype(np.float32) / 255.0
    lay = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    col = darker(ctx['hue'], .34)
    ch, cw = a.shape
    cell = min(w / float(cw), h / float(ch))
    for j in range(ch):
        for i in range(cw):
            v = 1.0 - a[j, i]
            if v < .12: continue
            r = cell * .5 * (v ** .72) * 1.22
            cx, cy = (i + .5) * cell, (j + .5) * cell
            d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=col + (235,))
    cv.paste(lay, (x, y), lay)

def reg_type(cv, box, ctx):
    """THE POEM, set large and allowed to be covered. Legibility is not the
       point; the presence of language as a material is."""
    x, y, w, h = box
    txt = (ctx['line'] or '').upper()
    if not txt: return
    lay = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    # AN INCIDENT, NOT A FIELD. At a third of a region's height the type became
    # the loudest thing in eight of fourteen images and every one of them started
    # to look like the same poster. Language is one register among six.
    size = int(h * (0.09 + ctx['rnd'].random() * 0.11) * ctx.get('weight', 1.0))
    try:
        f = ImageFont.truetype('/System/Library/Fonts/Supplemental/Futura.ttc', size)
    except Exception:
        f = ImageFont.load_default()
    words = txt.split()
    start = ctx['rnd'].randint(0, max(0, len(words) - 3))
    frag = ' '.join(words[start:start + ctx['rnd'].randint(1, 3)])
    ox = ctx['rnd'].randint(int(-w * .10), max(1, int(w * .45)))
    oy = ctx['rnd'].randint(int(h * .05), max(2, int(h * .72)))
    d.text((ox, oy), frag, font=f,
           fill=darker(ctx['hue'], .28) + (ctx['rnd'].randint(120, 215),))
    cv.paste(lay, (x, y), lay)

def reg_measure(cv, box, ctx):
    """the cutsheet's leader lines and confidences, used as COMPOSITION rather
       than as annotation — the drawing showing its own working"""
    x, y, w, h = box
    lay = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    col = darker(ctx['hue'], .25) + (215,)
    try:
        f = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', max(11, h // 44))
    except Exception:
        f = ImageFont.load_default()
    for _ in range(ctx['rnd'].randint(3, 8)):
        ax, ay = ctx['rnd'].randint(0, w), ctx['rnd'].randint(0, h)
        bx, by = ctx['rnd'].randint(0, w), ay + ctx['rnd'].choice([-1, 1]) * ctx['rnd'].randint(40, h // 2)
        d.line([(ax, ay), (ax, by), (bx, by)], fill=col, width=2)
        d.ellipse((ax - 5, ay - 5, ax + 5, ay + 5), outline=col, width=2)
        e = ctx['rnd'].choice(ctx['els'])
        d.text((min(bx, w - 130) + 6, by - 20),
               '%s  %.3f' % ((e.get('p') or '?')[:14].upper(), 0.72 + ctx['rnd'].random() * .27),
               font=f, fill=col)
    cv.paste(lay, (x, y), lay)

def reg_erase(cv, box, ctx):
    """SUBTRACTION, in tatters. Every other pass adds; taking away is what makes
       a surface look worked rather than assembled. But erasing a whole region
       bleaches the page — the first version turned the picture to paper. It
       takes a few torn bites out of a region, never the region."""
    x, y, w, h = box
    rnd = ctx['rnd']
    for _ in range(rnd.randint(2, 5)):
        bw = int(w * (.16 + rnd.random() * .34)); bh = int(h * (.16 + rnd.random() * .34))
        if bw < 12 or bh < 12: continue
        bx = x + rnd.randint(-bw // 3, max(1, w - bw // 2))
        by = y + rnd.randint(-bh // 3, max(1, h - bh // 2))
        # a SCRAPE, not a fog. Smooth grain multiplied into the mask produced
        # soft white cauliflower — the one texture in the whole set that looks
        # like a filter. Threshold it hard so the paper comes back in flakes.
        m = torn_mask(bw, bh, ctx['seed'] + rnd.randint(0, 999), .20, feather=1.5)
        n = (np.random.RandomState(ctx['seed'] + bw).rand(bh // 5 + 1, bw // 5 + 1) * 255).astype(np.uint8)
        grain = Image.fromarray(n).resize((bw, bh), Image.NEAREST)
        grain = grain.point(lambda v: 255 if v > 96 else 0).filter(ImageFilter.MinFilter(3))
        m = ImageChops.multiply(m, grain)
        cv.paste(Image.new('RGB', (bw, bh), PAPER), (bx, by), m)

def reg_enlarge(cv, box, ctx):
    """one element blown up far past its resolution, so the material's own
       poverty becomes the subject"""
    x, y, w, h = box
    e = max(ctx['els'], key=lambda z: (z.get('w') or 0) * (z.get('h') or 0))
    im = ctx['open_el'](e)
    if im is None: return
    tiny = im.resize((max(6, im.size[0] // 9), max(6, im.size[1] // 9)), Image.LANCZOS)
    big = tiny.resize((int(w * 1.5), int(h * 1.5)), Image.NEAREST)
    rgb = ink(big.convert('RGB'), ctx['hue'], *ctx['band'], amount=.86)
    cv.paste(rgb, (x - w // 4, y - h // 4), big.split()[3].resize(big.size, Image.NEAREST))

REGISTERS = {
    'wash': reg_wash, 'stack': reg_stack, 'field': reg_field, 'contour': reg_contour,
    'halftone': reg_halftone, 'type': reg_type, 'measure': reg_measure,
    'erase': reg_erase, 'enlarge': reg_enlarge,
}

# ── the voice: a WHOLE SHAPE chosen by the archive ───────────────────────────
"""
A voice is not a hue. It is: what geometry, what proportion of the sheet is
touched at all, how many registers are allowed, how the palette is built, and
what format the thing is. Change only the hue and you have made a swatch book.
"""
VOICES = {
  # name          comp             format      coverage regs                                   event      palette
  'PALIMPSEST': ('quarters',      'portrait',  0.95, ['stack','field','erase','stack','contour','measure'], 'erase',   'full'),
  'ENLARGEMENT':('figure',        'square',    0.70, ['wash','enlarge','contour','enlarge','measure'],                          'enlarge', 'duo'),
  'SATURATION': ('flood',         'portrait',  1.00, ['field','field','halftone','field'],                  'halftone','mono'),
  'GESTURE':    ('spine',         'tall',      0.42, ['contour','field','contour','measure'],               'contour', 'bleached'),
  'APERTURE':   ('fold',          'wide',      0.70, ['stack','erase','halftone'],                          'erase',   'duo'),
  'SURFACE':    ('strata',        'panorama',  0.90, ['stack','halftone','erase'],                          'halftone','mono'),
  'DISPERSAL':  ('constellation', 'portrait',  0.40, ['wash','field','field','measure'],                    'field',   'bleached'),
  'PANORAMA':   ('strata',        'panorama',  0.80, ['wash','stack','field','measure'],                    'measure', 'full'),
  'ASSEMBLY':   ('corner',        'portrait',  0.55, ['wash','stack','field','type'],                       'type',    'full'),
  'SPINE':      ('spine',         'tall',      0.55, ['wash','field','contour','type'],                     'type',    'duo'),
}

def voice_of(stat):
    n, shots, noun, share, ar = (stat['n'], stat['shots'], stat['noun'],
                                 stat['share'], stat['ar'])
    if n >= 600:            k = 'PALIMPSEST'
    elif n <= 20:           k = 'ENLARGEMENT'
    elif share >= 0.55:     k = 'SATURATION'
    elif noun == 'a hand':  k = 'GESTURE'
    elif noun == 'a window':k = 'APERTURE'
    elif noun == 'a wall':  k = 'SURFACE'
    elif shots >= 7:        k = 'DISPERSAL'
    elif ar >= 1.6:         k = 'PANORAMA'
    elif ar <= 0.70:        k = 'SPINE'
    else:                   k = 'ASSEMBLY'
    return (k,) + VOICES[k]

def build_palette(raw, mode, rnd):
    """HOW the palette is built is part of the voice. Five roles at fixed
       lightness for every image made every image the same picture recoloured."""
    import colorsys
    def role(src, l, sat):
        r, g, b = [v / 255. for v in src]
        h, _, _ = colorsys.rgb_to_hls(r, g, b)
        rr, gg, bb = colorsys.hls_to_rgb(h, l, sat)
        return (int(rr*255), int(gg*255), int(bb*255))
    if mode == 'mono':      # one hue, carried entirely by value
        return [role(raw[0], l, .20) for l in (.78, .56, .38, .20, .46)]
    if mode == 'duo':       # two hues that argue, nothing between them
        a, b = raw[0], raw[4]
        return [role(a, .74, .26), role(a, .40, .30), role(b, .30, .44),
                role(a, .18, .22), role(b, .56, .74)]
    if mode == 'bleached':  # near-paper, one dark, one accent — mostly nothing
        return [role(raw[0], .90, .07), role(raw[1], .84, .09), role(raw[2], .78, .11),
                role(raw[3], .17, .26), role(raw[4], .52, .80)]
    return [role(raw[0], .70, .22), role(raw[1], .50, .20), role(raw[2], .34, .24),
            role(raw[3], .22, .20), role(raw[4], .54, .62)]

def main():
    os.makedirs(OUT, exist_ok=True)
    only = sys.argv[1] if len(sys.argv) > 1 else None
    arc = json.load(io.open(os.path.join(ROOT,'cut','out','thumbs','index.json'), encoding='utf-8'))
    cov = json.load(io.open(os.path.join(ROOT,'WYGWYL_COVERAGE_MAP.json'), encoding='utf-8'))
    poem_of, line_of, title_of = {}, {}, {}
    for r in cov['shot_routing_records']:
        a = r.get('primary_allocation') or {}
        if r.get('patch_id') and a.get('number'):
            poem_of[r['patch_id']] = a['number']
            line_of[a['number']] = a.get('direct_line_text') or ''
            title_of[a['number']] = a.get('title') or ''
    by = collections.defaultdict(list)
    for e in arc:
        p = poem_of.get(e.get('patch',''))
        if p: by[p].append(e)

    cache = {}
    def open_el(e):
        k = e['id']
        if k in cache: return cache[k]
        fp = os.path.join(ROOT,'cut','out','elements', k + '.png')
        im = None
        if os.path.exists(fp):
            im = Image.open(fp).convert('RGBA')
            if max(im.size) > 420: im.thumbnail((420,420), Image.LANCZOS)
        if len(cache) > 260: cache.clear()
        cache[k] = im
        return im

    made = []
    for num in sorted(by):
        if only and only != num: continue
        els = by[num]
        rnd = random.Random(int(num) * 7919)
        c = collections.Counter(e['p'] for e in els)
        noun, cnt = c.most_common(1)[0]
        stat = {'n': len(els), 'shots': len({e['patch'] for e in els}), 'noun': noun,
                'share': cnt / float(len(els)),
                'ar': sum((e.get('w') or 1)/float(e.get('h') or 1) for e in els)/len(els)}
        name, comp, fmt, coverage, passes, event, pmode = voice_of(stat)
        Wc, Hc = FORMATS[fmt]

        field = Image.open(os.path.join(ROOT,'cut','out','collage','poem_%s.webp'%num)).convert('RGB')
        sky   = Image.open(os.path.join(ROOT,'cut','out','collage','type_the-sky.webp')).convert('RGB')
        HUES = build_palette(palette_of(field, 5), pmode, rnd)

        cv = Image.new('RGB', (Wc, Hc), PAPER)
        regions = COMPS[comp](Wc, Hc, rnd)
        rnd.shuffle(regions)
        accent_i = rnd.randrange(len(regions))
        event_i  = rnd.randrange(len(regions))

        score = []
        used_type = False
        for pi, op in enumerate(passes):                     # 4. PALIMPSEST
            for ri, box in enumerate(regions):
                # COVERAGE IS PART OF THE VOICE. Everything was full-bleed before,
                # which is a bigger sameness than any palette: a sheet that is a
                # fifth touched and a sheet with no paper left are not the same
                # kind of object.
                if rnd.random() > coverage: continue
                use = event if ri == event_i and pi == len(passes) - 1 else op
                if use == 'type':
                    if used_type: continue
                    used_type = True
                hue = HUES[4] if ri == accent_i else HUES[min(pi, 3)]
                band = [(.58,.92), (.34,.70), (.24,.58), (.12,.42)][min(pi,3)]
                if pmode == 'bleached' and ri != accent_i:
                    band = (max(band[0], .62), .96)
                ctx = {'field': field, 'sky': sky, 'els': els, 'open_el': open_el,
                       'hue': hue, 'band': band, 'rnd': rnd, 'seed': pi*97+ri*13,
                       'density': .3 + rnd.random()*.8, 'line': line_of.get(num,''),
                       'weight': 1.0 + (1.0 - coverage) * 1.7}
                try: REGISTERS[use](cv, box, ctx)
                except Exception: continue
                score.append((pi, use, box))

        a = np.asarray(cv).astype(np.float32) / 255.
        a = np.clip((a - a.mean()) * 1.16 + a.mean() * .98, 0, 1)
        g = np.random.RandomState(int(num)).normal(0, .012, a.shape[:2])[..., None]
        cv = Image.fromarray(np.clip((a + g) * 255, 0, 255).astype(np.uint8))
        W, H = Wc, Hc

        d = ImageDraw.Draw(cv)
        M = 40
        for r in ((0,0,W,M),(0,H-150,W,H),(0,0,M,H),(W-M,0,W,H)):
            d.rectangle(r, fill=PAPER)
        try:
            fb = ImageFont.truetype('/System/Library/Fonts/Supplemental/Futura.ttc', 56)
            fs = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 18)
        except Exception:
            fb = fs = ImageFont.load_default()
        tcol = darker(HUES[3], .5)
        d.text((M+16, H-128), '%s  %s' % (num, title_of.get(num,'').upper()), font=fb, fill=tcol)
        d.text((M+18, H-52),
               '%s  ·  %s / %s / %s  ·  %d elements from %d shots  ·  %d marks'
               % (name, comp, fmt, pmode, stat['n'], stat['shots'], len(score)),
               font=fs, fill=tcol)

        fp = os.path.join(OUT, '%s.png' % num)
        cv.save(fp); made.append((num, name, fp))
        print('  %s  %-12s %-14s %-9s %-9s cov%.2f  %4d els  %d marks'
              % (num, name, comp, fmt, pmode, coverage, stat['n'], len(score)))

    if made and not only:
        cols = 5; rows = int(math.ceil(len(made)/5.0))
        cw, chh = 380, 380
        sheet = Image.new('RGB', (cols*cw, rows*chh), (218, 213, 203))
        for i,(n,v,fp) in enumerate(made):
            im = Image.open(fp); im.thumbnail((cw-16, chh-16), Image.LANCZOS)
            ox = (i%cols)*cw + (cw-im.size[0])//2
            oy = (i//cols)*chh + (chh-im.size[1])//2
            sheet.paste(im, (ox, oy))
        sheet.save(os.path.join(OUT,'CONTACT.png'))
    print('%d -> cut/out/second' % len(made))

if __name__ == '__main__':
    main()
