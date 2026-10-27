# 커플 16종(꿀됑+꼼이) — Codex 그림(투명 또는 초록 #00B140) → 투명 + 「배지」 스티커 webp 320 + 미리보기 시트.
#   /usr/bin/python3 art/couple16/make_couple.py <그림 폴더> <출력 폴더>
#   그림 이름은 cp01-morning.png … cp16-date.png. 배지 글자는 아래 BADGES(GPT 회의 + 우댕 OK 대기, 2026-10-27).
#   투명으로 온 그림은 알파만 다듬고(거의 불투명 252~253 → 255), 초록으로 온 그림은 set16 key()로 뺀다.
import sys, os, numpy as np
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'kkuldaeng', 'set16'))
from make_sticker import key, badge, W, H, BAND
FONT = '/Users/mydang/Claude_Code/saidam/art/fonts/Jua.ttf'

BADGES = [
    ('cp01-morning', '꼼모닝'), ('cp02-night', '잘자'), ('cp03-love', '사랑해'), ('cp04-mukbang', '냠냠냠'),
    ('cp05-selfie', '찰칵'), ('cp06-takecare', '조심히 와'), ('cp07-arrived', '왔어!'), ('cp08-itsok', '괜찮아'),
    ('cp09-goodjob', '수고했어'), ('cp10-sulk', '삐짐'), ('cp11-makeup', '화해'), ('cp12-congrats', '축하해'),
    ('cp13-nap', '푸데데'), ('cp14-whitening', '화이트닝'), ('cp15-dust', '먼지 저리가'), ('cp16-date', '데이트'),
]

def cutout(path):
    im = Image.open(path).convert('RGBA'); a = np.array(im).astype(np.int32)
    if (a[..., 3] < 250).mean() < 0.05:          # 배경이 칠해져 왔다(초록) → 키잉
        im = key(path); a = np.array(im).astype(np.int32)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    al = np.where(al >= 235, 255, np.where(al < 12, 0, al))
    g = np.where(g > np.maximum(r, b) + 6, np.maximum(r, b), g)   # 초록 테두리 기운만(노랑 조끼·분홍은 G가 안 크다)
    im = Image.fromarray(np.dstack([r, g, b, al]).astype(np.uint8))
    return im.crop(im.split()[3].point(lambda v: 255 if v > 20 else 0).getbbox())

def make(c, text):
    bd = badge(text, int(H * BAND * 0.62)); by = max(0, int(H * BAND * 0.5) - bd.size[1] // 2)
    band_px = by + bd.size[1]; gap = int(H * 0.04)
    k = min(W * 0.94 / c.width, (H - gap - band_px) / c.height)
    cc = c.resize((max(1, int(c.width * k)), max(1, int(c.height * k))), Image.LANCZOS)
    cv = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    cv.alpha_composite(cc, ((W - cc.width) // 2, H - cc.height - gap)); cv.alpha_composite(bd, ((W - bd.size[0]) // 2, by))
    return cv

def main(src, dst):
    os.makedirs(dst, exist_ok=True)
    done = []
    for name, text in BADGES:
        p = os.path.join(src, name + '.png')
        if not os.path.exists(p): continue
        st = make(cutout(p), text)
        st.save(os.path.join(dst, name + '.webp'), format='WEBP', quality=86, method=6)
        done.append((name, text, st))
    # 미리보기 시트(채팅 바탕색 위, 4열)
    font = ImageFont.truetype(FONT, 22); cols = 4; cell = 300
    rows = (len(done) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * cell + 20, rows * (cell + 34) + 20), (245, 240, 235)); d = ImageDraw.Draw(sheet)
    for i, (name, text, st) in enumerate(done):
        x = 10 + (i % cols) * cell; y = 10 + (i // cols) * (cell + 34)
        bg = Image.new('RGBA', (W, H), (251, 248, 242, 255)); bg.alpha_composite(st)
        sheet.paste(bg.convert('RGB').resize((cell - 10, cell - 10), Image.LANCZOS), (x, y))
        d.text((x + 4, y + cell - 4), f'{i + 1}. {text}', fill=(110, 90, 100), font=font)
    sheet.save(os.path.join(dst, 'couple16-sheet.png')); print(len(done), 'stickers')

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
