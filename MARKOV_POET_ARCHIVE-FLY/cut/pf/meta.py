#!/usr/bin/env python3
"""
THE META COLLAGE — a collage whose material is our other collages.

Everything we have made so far combines by AVERAGING. Elements are laid over one
another and the result is soft: the poem-fields dissolve, the type-composites
blur into weather, GRID_ALL scatters. That is one way to put images together and
it has one look, and after a hundred and seven of them it is the only look we
have.

A cut-paper collage does the opposite. It COMMITS. Every patch has a hard torn
edge, sits at a declared depth, and does not blend with its neighbour — the seam
is the point. A painted poster of a man on a balcony over a city is legible not
because the parts agree but because they are cut and stacked in a fixed order:
sky, skyline, street, figure, and a thought above the head.

So this builds that, out of what we already made:

  SKY       a wash, plus torn patches of the sky and water composites
  SKYLINE   blocks torn from the building and window composites
  STREET    a run of small rectangles, the rowhouse register
  HERO      one large figure — a real silhouette from the archive — filled with
            that poem's own collage, so the body is made of its poem
  THOUGHT   a cloud over the head, filled with water
  FRAME     cream margin, title, credits

Three things do the work, and none of them is compositing:

  1. TORN EDGES. Every patch boundary is perturbed by 1-D noise before it is
     used, so nothing has a machine edge.
  2. ONE PALETTE. Each poster derives five colours from its own poem and pushes
     every patch toward the nearest one, keeping luminance. This is what makes a
     hundred unrelated photographs look painted by one hand.
  3. A SEAM. Each patch is outlined in a darkened version of its own colour, so
     the cut is visible. Removing this line is the fastest way to make the image
     go back to looking like a composite.

    python3 cut/pf/meta.py          all fourteen, plus a contact sheet
    python3 cut/pf/meta.py 06       just one
"""
import os, io, sys, json, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT  = os.path.join(ROOT, 'cut', 'out', 'meta')
W, H = 1400, 1800
MARGIN = 46
FOOT = 232          # the cream band the title lives in, as on the reference

POEMS = [
    ("01","01-out-of-life","IN NEED OF SEAWATER" if False else "OUT OF LIFE"),
    ("02","02-flashing-lights","FLASHING LIGHTS"),
    ("03","03-how-to-break-off-an-engagement","HOW TO BREAK OFF AN ENGAGEMENT"),
    ("04","04-nevermore","NEVERMORE"),
    ("05","05-bloodlines","BLOODLINES"),
    ("06","06-resurrecting-atlantis","RESURRECTING ATLANTIS"),
    ("07","07-dj-turn-me-up","DJ TURN ME UP"),
    ("08","08-newly-single","NEWLY SINGLE"),
    ("09","09-yet-heard","YET, HEARD"),
    ("10","10-magic-ride","MAGIC RIDE"),
    ("11","11-new-day","NEW DAY"),
    ("12","12-reunion","REUNION"),
    ("13","13-how-to-win-my-heart","HOW TO WIN MY HEART"),
    ("14","14-hot-minute","HOT MINUTE"),
]

# ── torn edges ───────────────────────────────────────────────────────────────
def noise1d(n, octaves=2, seed=0):
    """smooth 1-D noise in [-1,1] — the deckle on a torn sheet"""
    rnd = np.random.RandomState(seed)
    out = np.zeros(n)
    amp, step = 1.0, max(2, n // 14)
    for _ in range(octaves):
        k = max(2, step)
        pts = rnd.rand(k + 1) * 2 - 1
        x = np.linspace(0, k, n)
        i = x.astype(int); f = x - i
        out += amp * (pts[i] * (1 - f) + pts[np.minimum(i + 1, k)] * f)
        amp *= 0.5; step *= 2
    m = np.abs(out).max() or 1
    return out / m

def torn_mask(w, h, seed=0, rough=0.05, feather=1.0):
    """a rectangle whose four edges have been torn rather than cut"""
    w, h = max(4, int(w)), max(4, int(h))
    m = Image.new('L', (w, h), 0)
    d = ImageDraw.Draw(m)
    ax = max(3, int(min(w, h) * rough))
    top    = (noise1d(w, seed=seed + 1) * ax)
    bottom = (noise1d(w, seed=seed + 2) * ax)
    left   = (noise1d(h, seed=seed + 3) * ax)
    right  = (noise1d(h, seed=seed + 4) * ax)
    pts  = [(x, max(0, ax + top[x])) for x in range(w)]
    pts += [(w - 1 - max(0, ax + right[y]), y) for y in range(h)]
    pts += [(x, h - 1 - max(0, ax + bottom[x])) for x in range(w - 1, -1, -1)]
    pts += [(max(0, ax + left[y]), y) for y in range(h - 1, -1, -1)]
    d.polygon(pts, fill=255)
    if feather:
        m = m.filter(ImageFilter.GaussianBlur(feather))
    return m

# ── one palette ──────────────────────────────────────────────────────────────
def palette_of(img, k=5):
    """the poem's own colours — SATURATED and spread.

    Straight k-means on our fields returns five greys, because our fields are
    averages and averages are grey. A poster with five greys has nothing to be
    confident about, which was the whole complaint. So the centres are pushed
    away from their own mean chroma and given a deliberate light-to-dark spread.
    """
    import cv2, colorsys
    a = np.asarray(img.convert('RGB').resize((240, 240))).reshape(-1, 3).astype(np.float32)
    a = a[(a.sum(1) > 55) & (a.sum(1) < 700)]
    if len(a) < 40:
        return [(46, 74, 112), (150, 178, 200), (206, 120, 66), (28, 34, 44), (232, 226, 210)]

    # WHERE THE HUE COMES FROM MATTERS. The first version took the most COMMON
    # colours, and the most common colour in an averaged field is a near-grey
    # whose hue is numerical noise. Amplifying that noise turned a pale blue poem
    # magenta. The hue is taken from the most SATURATED tenth of the pixels —
    # the part of the image that actually has a colour opinion — and the rest of
    # the scheme is built from it.
    mx, mn = a.max(1), a.min(1)
    chroma = (mx - mn) / np.maximum(1.0, mx)
    keep = a[chroma >= np.quantile(chroma, 0.90)]
    if len(keep) < 20:
        keep = a
    crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 24, 1.0)
    kk = min(3, max(1, len(keep) // 8))
    _, lab, cen = cv2.kmeans(keep.astype(np.float32), kk, None, crit, 4, cv2.KMEANS_PP_CENTERS)
    dom = cen[np.argmax(np.bincount(lab.flatten(), minlength=kk))]
    r, g, b = [max(0.0, min(1.0, v / 255.0)) for v in dom]
    h0, _, _ = colorsys.rgb_to_hls(r, g, b)

    # an analogous scheme around that hue, plus one complement to argue with it.
    # Saturation stays low: paint is not neon, and the accent is the only voice
    # allowed to be loud.
    def mk(dh, l, sat):
        rr, gg, bb = colorsys.hls_to_rgb((h0 + dh) % 1.0, l, sat)
        return (int(rr * 255), int(gg * 255), int(bb * 255))
    return [mk(0.00, .62, .30), mk(-0.055, .46, .26), mk(0.055, .40, .30),
            mk(0.02, .30, .24), mk(0.50, .52, .52)]

def ink(img, hue_rgb, lo, hi, amount=0.86, contrast=1.25):
    """Tint a patch to ONE colour and squeeze its values into a band.

    THE VALUE LADDER IS THE WHOLE POSTER. A painted collage is legible because
    sky is light, city is middle, ground is darker and the figure is darkest —
    you can read it as a thumbnail, in the dark, upside down. Tinting everything
    toward one shared palette, which is what this did first, produced a single
    pink mush with no register at all: correct colours, no picture.

    So each register is given its own hue AND its own band of lightness, and the
    patch's own detail survives only as variation inside that band.
    """
    a = np.asarray(img.convert('RGB')).astype(np.float32) / 255.0
    lum = a @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
    m, sd = lum.mean(), max(1e-3, lum.std())
    lum = np.clip((lum - m) / (sd * 2.6) * contrast + 0.5, 0.0, 1.0)   # its own range
    lum = lo + lum * (hi - lo)                                          # into the band
    base = np.array(hue_rgb, dtype=np.float32) / 255.0
    bl = float(base @ np.array([0.299, 0.587, 0.114], dtype=np.float32)) or 0.5
    tinted = np.clip(base.reshape(1, 1, 3) * (lum / bl)[..., None], 0.0, 1.0)
    out = a * (1.0 - amount) + tinted * amount
    return Image.fromarray(np.clip(out * 255.0, 0, 255).astype(np.uint8))

def to_palette(img, pal, amount=0.72):
    """kept for the thought-cloud, where one flat colour would kill the water"""
    return ink(img, pal[min(1, len(pal) - 1)], 0.34, 0.86, amount=amount * .8)

def darker(c, f=0.55):
    return tuple(max(0, int(v * f)) for v in c[:3])

# ── placing a patch ──────────────────────────────────────────────────────────
def paste_patch(canvas, src, box, seed, pal, rough=0.05, seam=3, tint=0.72,
                hue=None, band=(0.30, 0.80)):
    """crop a piece of a source collage, tear it, tune it, and lay it down with
       its cut edge showing"""
    x, y, w, h = [int(v) for v in box]
    if w < 6 or h < 6:
        return
    sw, sh = src.size
    cw = min(sw, max(24, int(w * (0.5 + random.random() * 0.9))))
    ch = min(sh, max(24, int(h * (0.5 + random.random() * 0.9))))
    cx = random.randint(0, max(0, sw - cw)); cy = random.randint(0, max(0, sh - ch))
    piece = src.crop((cx, cy, cx + cw, cy + ch)).resize((w, h), Image.LANCZOS)
    piece = ink(piece, hue if hue is not None else pal[1 % len(pal)],
                band[0], band[1], amount=tint)
    m = torn_mask(w, h, seed=seed, rough=rough)
    canvas.paste(piece, (x, y), m)
    if seam:
        # the cut, drawn — a darkened line following the torn boundary
        edge = m.filter(ImageFilter.FIND_EDGES).point(lambda v: 255 if v > 40 else 0)
        edge = edge.filter(ImageFilter.MaxFilter(seam if seam % 2 else seam + 1))
        avg = tuple(int(v) for v in np.asarray(piece.resize((8, 8))).reshape(-1, 3).mean(0))
        canvas.paste(Image.new('RGB', (w, h), darker(avg)), (x, y), edge)

def load(p):
    fp = os.path.join(ROOT, p)
    return Image.open(fp).convert('RGB') if os.path.exists(fp) else None

def main():
    os.makedirs(OUT, exist_ok=True)
    only = sys.argv[1] if len(sys.argv) > 1 else None
    arc = json.load(io.open(os.path.join(ROOT, 'cut', 'out', 'thumbs', 'index.json'),
                            encoding='utf-8'))
    cov = json.load(io.open(os.path.join(ROOT, 'WYGWYL_COVERAGE_MAP.json'), encoding='utf-8'))
    poem_of = {}
    for r in cov.get('shot_routing_records', []):
        a = r.get('primary_allocation') or {}
        if r.get('patch_id') and a.get('number'):
            poem_of[r['patch_id']] = a['number']

    made = []
    for (n, slug, title) in POEMS:
        if only and only != n:
            continue
        random.seed(int(n) * 977)
        np.random.seed(int(n) * 977)

        field = load('cut/out/collage/poem_%s.webp' % n)
        if field is None:
            print('  %s — no poem field, skipped' % n); continue
        plate  = load('cut/out/scene/%s_PLATE.webp' % n) or field
        sky    = load('cut/out/collage/type_the-sky.webp') or field
        water  = load('cut/out/collage/type_water.webp') or field
        bldg   = load('cut/out/collage/type_a-building.webp') or plate
        win    = load('cut/out/collage/type_a-window.webp') or plate
        wall   = load('cut/out/collage/type_a-wall.webp') or plate

        # the four roles a poster actually has. Hues come from the poem; the
        # lightness of each role does not, because that is what makes it legible.
        raw = palette_of(field, 5)
        import colorsys
        def role(src, light, sat):
            r, g, b = [v / 255.0 for v in src]
            h, _, _ = colorsys.rgb_to_hls(r, g, b)
            rr, gg, bb = colorsys.hls_to_rgb(h, light, sat)
            return (int(rr * 255), int(gg * 255), int(bb * 255))
        SKY_C    = role(raw[0], 0.74, 0.26)
        CITY_C   = role(raw[1], 0.48, 0.24)
        STREET_C = role(raw[2], 0.40, 0.28)
        GROUND_C = role(raw[3], 0.34, 0.22)
        ACCENT_C = role(raw[4], 0.52, 0.55)
        FIG_C    = role(raw[1], 0.15, 0.26)
        pal = [SKY_C, CITY_C, STREET_C, GROUND_C, ACCENT_C]
        paper = (238, 234, 224)
        canvas = Image.new('RGB', (W, H), paper)

        # ── SKY: a wash, then torn weather over it ──────────────────────────
        base = ink(sky.resize((W, int(H * 0.64)), Image.LANCZOS), SKY_C, .60, .93, .92, 1.0)
        canvas.paste(base.filter(ImageFilter.GaussianBlur(9)), (0, 0))
        for i in range(6):
            w = random.randint(int(W * .26), int(W * .66))
            h = random.randint(int(H * .05), int(H * .14))
            paste_patch(canvas, sky if i % 2 else water,
                        (random.randint(-40, W - w + 40), random.randint(-30, int(H * .38)), w, h),
                        seed=100 + i * 7, pal=pal, rough=.10, seam=2, tint=.9,
                        hue=SKY_C, band=(.58, .97))

        # ── SKYLINE: blocks, standing on a shared baseline ──────────────────
        horizon = int(H * 0.56)
        x = -30
        i = 0
        while x < W + 20:
            w = random.randint(70, 190)
            h = random.randint(int(H * .10), int(H * .30))
            paste_patch(canvas, bldg if i % 3 else win,
                        (x, horizon - h, w, h),
                        seed=300 + i * 11, pal=pal, rough=.030, seam=3, tint=.9,
                        hue=(ACCENT_C if i % 7 == 3 else CITY_C),
                        band=(.30, .62) if i % 7 != 3 else (.42, .78))
            x += w - random.randint(6, 26); i += 1

        # ── STREET: the rowhouse register, small and regular ────────────────
        y0 = horizon + random.randint(6, 22)
        x = -20; i = 0
        while x < W + 20:
            w = random.randint(64, 120)
            h = random.randint(90, 180)
            paste_patch(canvas, wall if i % 2 else plate,
                        (x, y0, w, h), seed=600 + i * 13, pal=pal, rough=.045, seam=3, tint=.9,
                        hue=(ACCENT_C if i % 5 == 2 else STREET_C), band=(.24, .56))
            x += w - random.randint(2, 14); i += 1
        # ground — torn slabs, not one photograph. A single soft image here
        # undid every cut above it.
        gy = y0 + random.randint(120, 170)
        x = -40; i = 0
        while x < W + 30:
            w = random.randint(240, 460)
            paste_patch(canvas, plate if i % 2 else wall,
                        (x, gy + random.randint(-12, 14), w, (H - FOOT + 30) - gy),
                        seed=880 + i * 17, pal=pal, rough=.05, seam=4, tint=.92,
                        hue=GROUND_C, band=(.26, .54))
            x += w - random.randint(10, 40); i += 1

        # ── HERO: a real silhouette, filled with this poem's own collage ────
        # A FIGURE HAS A SHAPE. The first version sorted candidates by height and
        # got a sliver — a 30px-wide strip of coat is tall and is not a person.
        # Aspect is the filter that matters, not size.
        # THE THUMBS ARE HEIGHT-CAPPED AT 256, so every candidate reports the same
        # height and sorting by area silently sorts by WIDTH — which selects the
        # widest, i.e. the least figure-like blob. Score by shape instead:
        # a standing person is about 0.42 wide for its height, and its mask fills
        # roughly 45% of its box, because a body has gaps between its limbs and a
        # blob does not.
        def figure_like(e):
            w, h = e.get('w') or 0, e.get('h') or 0
            return h >= 150 and w >= 55 and 0.24 <= w / float(h) <= 0.90
        cands = [e for e in arc
                 if e.get('p') in ('a person', 'a person in mid-air')
                 and poem_of.get(e.get('patch','')) == n and figure_like(e)]
        if not cands:
            cands = [e for e in arc if e.get('p') == 'a person' and figure_like(e)]
        cands.sort(key=lambda e: abs((e.get('w') or 1) / float(e.get('h') or 1) - 0.42))
        scored = []
        for e in cands[:26]:
            fp = os.path.join(ROOT, 'cut', 'out', 'elements', e['id'] + '.png')
            if not os.path.exists(fp):
                continue
            al = Image.open(fp).convert('RGBA').split()[3]
            bb = al.getbbox()
            if not bb:
                continue
            arr = np.asarray(al.crop(bb))
            fill = float((arr > 110).mean())
            aw, ah = bb[2] - bb[0], bb[3] - bb[1]
            ar = aw / float(max(1, ah))
            if fill < 0.20 or fill > 0.72:
                continue
            scored.append((abs(ar - 0.42) * 3.0 + abs(fill - 0.45) * 2.0, e))
        scored.sort(key=lambda t: t[0])
        cands = [e for _, e in scored] or cands
        hero_ok = False
        if cands:
            for e in cands[:14]:
                fp = os.path.join(ROOT, 'cut', 'out', 'elements', e['id'] + '.png')
                if not os.path.exists(fp):
                    continue
                cut = Image.open(fp).convert('RGBA')
                alpha = cut.split()[3]
                bb = alpha.getbbox()
                if not bb:
                    continue
                alpha = alpha.crop(bb)
                aw, ah = alpha.size
                th = int(H * 0.56)
                tw = max(1, int(aw * th / ah))
                if tw > W * 0.46:
                    tw = int(W * 0.46); th = int(ah * tw / aw)
                alpha = alpha.resize((tw, th), Image.LANCZOS).point(lambda v: 255 if v > 110 else 0)
                # the body is made of its own poem
                # the darkest thing on the page, and almost flat: the reference's
                # man is one shape you read before you read anything else
                # a NARROW band, well below the ground's: on a value ladder the
                # figure has to own the bottom rung alone or it disappears into
                # the floor, which is exactly what it did.
                body = ink(field.resize((tw, th), Image.LANCZOS), FIG_C, .07, .27, .95, .60)
                hx = int(W * 0.50) + random.randint(-20, 80)
                hy = H - FOOT - th + int(H * 0.012)
                # a seam around the figure too, so it is cut and not keyed
                ring = alpha.filter(ImageFilter.FIND_EDGES).point(lambda v: 255 if v > 40 else 0)
                ring = ring.filter(ImageFilter.MaxFilter(5))
                canvas.paste(body, (hx, hy), alpha)
                canvas.paste(Image.new('RGB', (tw, th), darker(pal[0], .35)), (hx, hy), ring)
                hero_ok = True
                break

        # ── THOUGHT: a cloud above, filled with water ───────────────────────
        cw, ch = int(W * .40), int(H * .17)
        cx0, cy0 = int(W * .34), int(H * .045)
        cloud = Image.new('L', (cw, ch), 0)
        cd = ImageDraw.Draw(cloud)
        for i in range(11):
            # the puff must fit the cloud box in BOTH axes, or the range is empty
            r = random.randint(int(ch * .22), max(int(ch * .22) + 1, int(ch * .44)))
            r = min(r, (cw // 2) - 2, (ch // 2) - 2)
            if r < 4:
                continue
            ex = random.randint(r, cw - r); ey = random.randint(r, ch - r)
            cd.ellipse((ex - r, ey - r, ex + r, ey + r), fill=255)
        cloud = cloud.filter(ImageFilter.GaussianBlur(2))
        fill = ink(water.resize((cw, ch), Image.LANCZOS), ACCENT_C, .42, .88, .88, 1.1)
        canvas.paste(fill, (cx0, cy0), cloud)
        ring = cloud.filter(ImageFilter.FIND_EDGES).point(lambda v: 255 if v > 40 else 0)
        ring = ring.filter(ImageFilter.MaxFilter(5))
        canvas.paste(Image.new('RGB', (cw, ch), darker(pal[0], .4)), (cx0, cy0), ring)
        for i, s in enumerate((26, 17, 11)):
            bx = cx0 + int(cw * .14) - i * 26
            by = cy0 + ch + 12 + i * 30
            b = Image.new('L', (s, s), 0)
            ImageDraw.Draw(b).ellipse((0, 0, s - 1, s - 1), fill=255)
            canvas.paste(fill.resize((s, s)), (bx, by), b)

        # ── FRAME: the cream border and the type ────────────────────────────
        d = ImageDraw.Draw(canvas)
        d.rectangle((0, 0, W, MARGIN), fill=paper)
        d.rectangle((0, H - FOOT, W, H), fill=paper)
        d.rectangle((0, 0, MARGIN, H), fill=paper)
        d.rectangle((W - MARGIN, 0, W, H), fill=paper)
        try:
            big = ImageFont.truetype('/System/Library/Fonts/Supplemental/Futura.ttc', 78)
            sml = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 21)
        except Exception:
            big = ImageFont.load_default(); sml = ImageFont.load_default()
        typ = darker(GROUND_C, .55)
        words = title.split()
        lines, cur = [], ''
        for wd in words:
            t = (cur + ' ' + wd).strip()
            if d.textlength(t, font=big) > W - MARGIN * 2 - 40 and cur:
                lines.append(cur); cur = wd
            else:
                cur = t
        lines.append(cur)
        ty = H - FOOT + 34
        for ln in lines:
            d.text((MARGIN + 18, ty), ln, font=big, fill=typ); ty += 84
        d.text((MARGIN + 20, MARGIN + 14),
               'a meta collage  ·  %s  ·  cut from the poem\'s own field' % n,
               font=sml, fill=typ)

        fp = os.path.join(OUT, '%s_%s.png' % (n, slug))
        canvas.save(fp)
        made.append((n, title, fp, hero_ok))
        print('  %s %-32s %s' % (n, title[:32], 'hero' if hero_ok else 'NO HERO — no usable silhouette'))

    if made and not only:
        cols, rows = 5, int(math.ceil(len(made) / 5.0))
        tw, th = 300, int(300 * H / W)
        sheet = Image.new('RGB', (cols * tw, rows * th), (238, 234, 224))
        for i, (n, t, fp, _) in enumerate(made):
            sheet.paste(Image.open(fp).resize((tw, th), Image.LANCZOS),
                        ((i % cols) * tw, (i // cols) * th))
        sheet.save(os.path.join(OUT, 'CONTACT.png'))
    print('%d posters -> cut/out/meta' % len(made))
    miss = [m for m in made if not m[3]]
    if miss:
        print('%d without a figure: %s' % (len(miss), ', '.join(m[0] for m in miss)))

if __name__ == '__main__':
    main()
