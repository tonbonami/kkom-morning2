# 꼼이 「꼼돌아」 — Codex 투명 그림 → 「꼼돌아」 배지 스티커 webp 320 + 꿀됑 「꼼슌아」와 나란히 본 미리보기.
#   /usr/bin/python3 art/kkom-call/make_call.py
import sys, os
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'couple16'))
from make_couple import cutout, make
ROOT = os.path.join(HERE, '..', '..')
outs = []
for n in 'abc':
    st = make(cutout(os.path.join(HERE, 'orig', f'kc-{n}.png')), '꼼돌아')
    p = os.path.join(HERE, 'out', f'kc-{n}.webp'); st.save(p, 'WEBP', quality=90, method=6); outs.append((n.upper(), st))
pair = Image.open(os.path.join(ROOT, 'public/emo/kkuldaeng/01-ggomsyun.webp')).convert('RGBA')
F = ImageFont.truetype('/System/Library/Fonts/AppleSDGothicNeo.ttc', 26)
S, G = 320, 24
sheet = Image.new('RGB', (G + len(outs) * (2 * S + G) + G * len(outs), S + 70), (250, 246, 240))
d = ImageDraw.Draw(sheet); x = G
for name, st in outs:   # 안마다 [꼼이 꼼돌아 | 꿀됑 꼼슌아] 짝으로
    d.text((x + S, 22), f'{name}안', fill=(220, 90, 140), font=F, anchor='mm')
    for j, im in enumerate((st, pair)):
        bx = x + j * S
        d.rounded_rectangle((bx + 4, 48, bx + S - 4, 48 + S - 8), radius=20, fill=(255, 255, 255))
        sheet.paste(im, (bx, 48), im)
    x += 2 * S + G * 2
sheet.save(os.path.join(HERE, 'out', 'compare.png')); print(sheet.size)
