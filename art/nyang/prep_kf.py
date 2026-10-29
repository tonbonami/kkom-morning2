# 의기냥냥 키프레임 → Kling용 초록(#00B140) 1024 정사각. 한 캐릭터의 세 장은 같은 배율로 줄이고 발바닥(알파 맨 아래)을 같은 높이로.
#   /usr/bin/python3 art/nyang/prep_kf.py
import os, numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
N, GREEN, WFRAC, BASE = 1024, (0, 177, 64), 0.74, 0.88
EXTRA = {'kk': ['kk1b']}   # 꼼이 펀치 직전 다시 그림(영상 1 탈락 — 몸 자세가 달라 Kling이 일어서서 늘어남, 2026-10-30)
for ch in ('kk', 'kd'):
    ims = [Image.open(os.path.join(HERE, 'kf', f'{ch}{i}.png')).convert('RGBA') for i in (1, 2, 3)]
    boxes = [im.split()[3].point(lambda v: 255 if v > 20 else 0).getbbox() for im in ims]
    k = WFRAC * N / max(b[2] - b[0] for b in boxes)                 # 가장 넓은 장이 74%가 되게 — 세 장 같은 배율
    cx = np.mean([(b[0] + b[2]) / 2 for b in boxes])                # 세 장 가운데의 평균을 화면 가운데로(장마다 따로 옮기지 않음)
    extra = [n for n in EXTRA.get(ch, [])]                          # 나중에 다시 그린 장(kk1b) — 같은 배율·같은 가운데로(이미 쓴 장과 자리가 맞게)
    for n in extra:
        im = Image.open(os.path.join(HERE, 'kf', f'{n}.png')).convert('RGBA'); ims.append(im)
        boxes.append(im.split()[3].point(lambda v: 255 if v > 20 else 0).getbbox())
    for i, (im, b) in enumerate(zip(ims, boxes), 1):
        s = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
        x = round(N / 2 - cx * k); y = round(BASE * N - b[3] * k)  # 발바닥을 88% 높이에
        cv = Image.new('RGBA', (N, N), GREEN + (255,)); cv.alpha_composite(s, (x, y))
        name = f'{ch}{i}' if i <= 3 else extra[i - 4]
        cv.convert('RGB').save(os.path.join(HERE, 'kling', f'{name}.png'))
        print(ch, i, 'k=%.3f' % k, 'top=%d bottom=%d left=%d right=%d' % (y + b[1] * k, y + b[3] * k, x + b[0] * k, x + b[2] * k))
