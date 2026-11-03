# 꿀됑 → 사이담 넘기기(우댕 2026-11-04 「둘만 아는 건 빼고, 사이담 느낌(글씨 없음)으로」). 사이담 규격(사이담 세션이 정함):
#   정지 = 400×400 투명 webp, 캐릭터 키 74%, 가운데(꼬까2와 같은 자리) · 기분 얼굴 = 256×256 투명 webp(사이담 public/mood/quokka 처럼 85%)
#   글씨는 전부 뺀다 → 배지 붙기 전 초록 원본에서 다시 뽑는다(set16 make_sticker.key — 노랑 조끼가 살구색 안 되게 G만 깎는 키잉).
#   /usr/bin/python3 art/kkuldoeng-export/export.py [sticker] [mood]
import os, sys, numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(HERE, '..', '..')
sys.path.insert(0, os.path.join(ROOT, 'art', 'kkuldaeng', 'set16'))
from make_sticker import key
DST = '/Users/mydang/Claude_Code/saidam/art/kkuldoeng'
K = os.path.join(ROOT, 'art', 'kkuldaeng')
# (파일 이름, 한국어 이름표, 원본) — 이름은 꼬까2와 같은 뜻이면 같은 낱말(love·miss·hungry·otw·laugh·omg·thanks·sorry·yay)
STICKERS = [
    ('love', '사랑해', f'{K}/set16/02-saranghae-green.png'),
    ('miss', '보고싶어', f'{K}/set16/03-bogosipeo-green.png'),
    ('cute', '앙 귀여워', f'{K}/set16/04-anggwiyeowo-green.png'),
    ('laugh', 'ㅋㅋㅋ', f'{K}/set16/05-kkk-green.png'),
    ('hungry', '배고파', f'{K}/set16/06-baegopa-green.png'),
    ('otw', '가는 중', f'{K}/set16/07-ganeunjung-green.png'),
    ('arrive', '도착!', f'{K}/set16/08-dochak-green.png'),
    ('omg', '으악', f'{K}/set16/09-euak-green.png'),
    ('hug', '꼬옥', f'{K}/set16/10-kkoook-green.png'),
    ('thanks', '고마워', f'{K}/set16/11-gomawo-green.png'),
    ('really', '진짜아?', f'{K}/set16/12-jinjja-green.png'),
    ('yes', '응응', f'{K}/set16/14-eungeung-green.png'),
    ('areyouok', '괜찮아?(반창고)', f'{K}/set16/15-gwaenchanha-green.png'),
    ('morning', '좋은 아침', f'{K}/set16/16-joeunachim-green.png'),
    ('yay', '야호!', f'{K}/yaho/yaho-a-green.png'),
    ('sorry', '미안해', f'{K}/sorry/sorry-a-green.png'),
    ('promise', '약속!(코 도장)', os.path.join(ROOT, 'art', 'yaksok', 'yaksok-kkul.png')),
]

def cut(path):
    im = Image.open(path)
    if im.mode == 'RGBA' and (np.array(im)[..., 3] < 250).mean() > 0.05: return im   # 이미 투명
    return key(path)

def place(im, S, frac, wmax=0.94):
    a = np.array(im)[..., 3]; ys, xs = np.where(a > 20)
    c = im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    k = min(frac * S / c.height, wmax * S / c.width)      # 키 74%, 옆으로 긴 그림은 폭 94%에서 멈춤
    c = c.resize((max(1, round(c.width * k)), max(1, round(c.height * k))), Image.LANCZOS)
    # 상반신 그림(아래가 일자로 잘림 — 야호·약속·기분 얼굴)은 가운데에 두면 잘린 선이 허공에 뜬다 → 바닥에 붙여 「아래에서 빼꼼」처럼.
    #   사이담 기분 그림은 앞발을 올린 둥근 모양이라 잘린 선이 없다. 판정: 맨 아래 줄 폭이 그림 폭의 30% 넘으면 상반신.
    ca = np.array(c)[..., 3]; bust = (ca[-1] > 20).sum() > 0.3 * c.width
    cv = Image.new('RGBA', (S, S), (0, 0, 0, 0)); cv.alpha_composite(c, ((S - c.width) // 2, S - c.height if bust else (S - c.height) // 2))
    return cv

def main(what):
    rows = []
    if 'sticker' in what:
        os.makedirs(f'{DST}/sticker', exist_ok=True)
        for name, ko, src in STICKERS:
            cv = place(cut(src), 400, 0.74)
            p = f'{DST}/sticker/{name}.webp'; cv.save(p, 'WEBP', quality=86, method=6)
            rows.append(('sticker', name, ko, os.path.getsize(p) // 1024))
    if 'mood' in what:
        os.makedirs(f'{DST}/mood', exist_ok=True)
        for f in sorted(os.listdir(os.path.join(ROOT, 'public', 'emo', 'kkuldaeng', 'mood'))):
            if not f.endswith('.png'): continue
            im = Image.open(os.path.join(ROOT, 'public', 'emo', 'kkuldaeng', 'mood', f)).convert('RGBA')
            cv = place(im, 256, 0.85, 0.87)
            n = f[:-4]; p = f'{DST}/mood/{n}.webp'; cv.save(p, 'WEBP', quality=88, method=6)
            rows.append(('mood', n, '', os.path.getsize(p) // 1024))
    for r in rows: print(*r)

if __name__ == '__main__':
    main(sys.argv[1:] or ['sticker', 'mood'])
