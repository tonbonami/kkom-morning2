# 사이담 add-emo-label 결과(-label.webp, 화질 74 고정)가 600KB를 넘으면 가장자리 알파만 다시 정리하고 화질을 조금씩 내려 맞춘다.
#   /usr/bin/python3 art/kkuldoeng-export/fit_anim.py <입력-label.webp> <출력.webp> [fps]
#   fps 를 주면 재생 시각 기준으로 다시 고른다(머무는 장면 길이 그대로). 「일어나」(8.6초·둘이 움직임)는 12fps로는
#   화질 40에서도 900KB라 7fps로 낮췄다(8fps는 화질 40에서 601KB) — 용량은 화질보다 장 수가 좌우한다(알파가 장마다 ~4KB).
import os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from export_anim import clean

src, dst = sys.argv[1], sys.argv[2]
fps = int(sys.argv[3]) if len(sys.argv) > 3 else None
im = Image.open(src); fr, du = [], []
for i in range(im.n_frames):
    im.seek(i); fr.append(clean(im.convert('RGBA'))); du.append(im.info.get('duration', 83))
qs = (74, 68, 62, 56)
if fps:
    t, starts = 0, []
    for d in du: starts.append(t); t += d
    step = 1000 / fps; picked = []
    for k in range(round(t / step)):
        at = k * step; j = max(i for i, s in enumerate(starts) if s <= at); picked.append(fr[j])
    fr, du, qs = picked, [round(step)] * len(picked), (56, 50, 44, 40)
for q in qs:
    fr[0].save(dst, save_all=True, append_images=fr[1:], duration=du, loop=0, format='WEBP',
               lossless=False, quality=q, method=4, disposal=2)
    if os.path.getsize(dst) <= 600_000: break        # 600KB를 1000 단위로(어느 쪽으로 재도 안 넘게)
print(os.path.basename(dst), len(fr), 'frames', os.path.getsize(dst) // 1024, 'KB q', q)
