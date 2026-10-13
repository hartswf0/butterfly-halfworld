#!/usr/bin/env python3
"""THE PROMPT, read as a shot list. Every one of the 100 views is a Midjourney image, and each PNG still carries the full prompt
that made it (the 'Description' chunk). The prompt says what the picture is of and how it was 'shot': the camera body and lens
(so the field of view), where the camera stands (platform level, drone, through a window, beneath a bridge), what has to be in
front of it (the subjects), and what is air rather than structure (haze, smoke, neon). The search no longer has to guess those.
Writes .work/lang/prompts.json: one record per view, in view order."""
import os, re, json
from PIL import Image

T = os.path.dirname(os.path.abspath(__file__)); WK = os.path.join(T, '.work', 'lang'); ARCH = '/Users/gaia/Downloads/WYGWYL-WORLD-ARCH'
# sensor width in mm (a 16:9 crop keeps the full width of a 3:2 or 4:3 sensor)
BODIES = [(r'hasselblad x2d|x2d', 43.8, 'Hasselblad X2D'), (r'phase one', 53.4, 'Phase One'), (r'mamiya|pentax 67', 56.0, 'medium format film'),
          (r'red komodo', 27.03, 'RED Komodo'), (r'ursa mini pro', 25.34, 'Blackmagic URSA'), (r'arri|alexa', 28.25, 'ARRI'),
          (r'panasonic gh|gh6|gh5|olympus|om-?1', 17.3, 'Micro Four Thirds'), (r'fujifilm|x-t\d|x100', 23.5, 'Fujifilm APS-C'),
          (r'iphone', 9.8, 'iPhone'), (r'dsc-f828', 8.8, 'Sony F828'),
          (r'sony a7|a7s|sony fx3|fx3|canon eos|canon r\d|canon a-1|1d x|nikon z|leica sl|leica m|leica iii|summicron|summilux|zeiss batis', 36.0, 'full frame')]
PHONE_EQ = {'iphone': 24}                                             # a phone with no focal length: its main camera, in 35 mm terms
VANTAGE = [  # (pattern, kind, height range m, pitch range rad: + looks up). Camera phrasing only: these prompts are poems, and
             # 'drone' is often a machine in the scene, 'beneath' often a metaphor, 'from above' often where the light comes from
    (r'underwater', 'underwater', (0.5, 4), (-0.3, 0.3)),
    (r'drone.?(mounted|glide|shot|view|perspective)|aerial (view|shot)|bird.?s.?eye|(view|shot|seen|observing [\w ]{0,20}) from above|top.?down|satellite (view|mimic|angle|image)', 'aerial', (40, 300), (-1.3, -0.25)),
    (r'high.?rise|skybridge|from the top of|shot from a rooftop|rooftop|from a tower|upper floor|\bledge\b|balcony', 'high', (15, 160), (-0.7, 0.1)),
    (r'platform level|from (the )?platform|elevated (concrete |glowing )?(catwalk|path|walkway)|catwalk|overpass|gantry|mezzanine', 'raised', (4, 20), (-0.35, 0.15)),
    (r'looking up|low.?angle|worm.?s.?eye|shot from below|towers overhead|towering above', 'low', (0.3, 2.5), (0.15, 0.9)),
    (r'beneath (?!skin|control|your|the surface)[\w\- ]{0,30}|under(neath)? (a |the )?(bridge|deck|overpass|arch|canopy|elevated)|undercroft|tunnel|underpass', 'under', (1.2, 6), (-0.2, 0.4)),
    (r'street level|eye level|alley|\bstreet\b|sidewalk|corridor|market|plaza|pier|stairwell|\bsteps\b', 'street', (1.2, 2.2), (-0.3, 0.25)),
]
THROUGH = r'(shot |shooting |seen |looking )?through (an? |the )?([\w\- ]{3,40}?)(?=[,.]| from| at| into| as| with| toward|$)'
NOT_PLACE = {'air', 'fire', 'water', 'pool', 'neon'}           # too often light, mood or metaphor to be a thing the camera stands near
ATMOS = ['haze', 'smoke', 'fog', 'mist', 'steam', 'rain', 'dust', 'neon', 'glow', 'flare', 'bioluminescen', 'smog', 'snow', 'drizzle', 'spray', 'embers', 'sparks', 'light rays', 'god rays', 'reflection']
# place nouns the shared language (and later an open-vocabulary segmenter) can look for; longest first so 'fire escape' beats 'fire'
NOUNS = sorted(set('''stairwell staircase stairs steps stair fire escape ladder alley alleyway corridor passage arcade colonnade column pillar arch archway
vault dome tower spire skyscraper high-rise skyline facade window windows balcony rooftop roof terrace platform pier jetty dock wharf quay boardwalk
bridge skybridge overpass underpass tunnel deck canal river waterfront bay harbor harbour sea ocean lake pool fountain shore beach water
street road avenue boulevard plaza square courtyard market stall stalls kiosk shrine temple altar chapel cathedral monument statue obelisk cenotaph
gate doorway door wall walls fence railing billboard sign signs neon sign screen screens lantern lanterns lamp lamps streetlight chandelier chandeliers
air conditioners cables wires pipes scaffolding crane container containers tram train rail rails station subway escalator elevator elevators
tree trees palm palms garden vines moss terraces mountain cliff rock ruins hall library museum prison theatre cinema ward atrium greenhouse
car cars bus taxi motorcycle boat boats ship person figure woman man crowd people child'''.split('\n')).union(
    ['fire escape', 'air conditioners', 'neon sign', 'stacked air conditioners']) - {''}, key=len, reverse=True)
NOUNS = sorted({w for line in NOUNS for w in ([line] if ' ' in line and len(line.split()) <= 3 else line.split())}, key=len, reverse=True)

def read(p):
    t = p.replace('â\x80\x99', "'").replace('Ã¤', 'ä'); lo = t.lower(); body = sensor = None
    for pat, w, name in BODIES:
        if re.search(pat, lo): body, sensor = name, w; break
    mm = [float(x) for x in re.findall(r'(\d+(?:\.\d+)?)\s?mm\b', lo) if 4 <= float(x) <= 1200]
    lens = mm[0] if mm else (PHONE_EQ['iphone'] if body == 'iPhone' else None)
    if body == 'iPhone' and lens: sensor = 36.0                       # quoted in 35 mm terms
    if lens and not sensor: sensor = 36.0                             # a lens with no body: assume full frame
    hfov = round(2 * 57.29578 * __import__('math').atan(sensor / (2 * lens)), 1) if lens else None
    van = [(k, h, pr, m.group(0)) for pat, k, h, pr in VANTAGE for m in [re.search(pat, lo)] if m]
    van = van[:1] + [v for v in van[1:] if v[0] in ('under', 'low') and van[0][0] == 'street'] if van else []   # first = strongest; 'street' may sharpen to under/low
    if len(van) > 1 and van[0][0] == 'street': van = van[1:2]
    thr = [m.group(3).strip() for m in re.finditer(THROUGH, lo)]
    atm = [a for a in ATMOS if a in lo]
    subj, rest = [], lo
    for w in NOUNS:
        if w in NOT_PLACE: continue
        if re.search(r'\b' + re.escape(w) + r'\b', rest): subj.append(w); rest = re.sub(r'\b' + re.escape(w) + r'\b', ' ', rest)
    flags = re.findall(r'--(\w+)\s*([\w:.]+)?', lo)
    return {'prompt': t.split(' Job ID:')[0], 'body': body, 'sensor_mm': sensor, 'lens_mm': lens, 'hfov': hfov,
            'vantage': [{'kind': k, 'h': h, 'pitch': pr, 'said': s} for k, h, pr, s in van], 'through': thr, 'atmos': atm, 'subjects': subj,
            'place': bool(subj) and not re.search(r'\b(the moon dripped|abstract|pure light|no place)\b', lo), 'flags': dict(flags)}

if __name__ == '__main__':
    V = json.load(open(os.path.join(T, 'views.json')))
    out = []
    for n, f in enumerate(V, 1):
        r = read(Image.open(os.path.join(ARCH, f)).info.get('Description', '')); r['n'] = n; out.append(r)
    json.dump(out, open(os.path.join(WK, 'prompts.json'), 'w'), indent=1, ensure_ascii=False)
    k = lambda f: sum(1 for r in out if f(r))
    print('lens', k(lambda r: r['hfov']), 'vantage', k(lambda r: r['vantage']), 'through', k(lambda r: r['through']), 'subjects', k(lambda r: r['subjects']), 'placeless', k(lambda r: not r['place']))
