# 사이담 add-emo-label 결과(-label.webp, 화질 74 고정)가 600KB를 넘으면 가장자리 알파만 다시 정리하고 화질을 조금씩 내려 맞춘다.
#   /usr/bin/python3 art/kkuldoeng-export/fit_anim.py <입력-label.webp> <출력.webp>
import os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from export_anim import clean

src, dst = sys.argv[1], sys.argv[2]
im = Image.open(src); fr, du = [], []
for i in range(im.n_frames):
    im.seek(i); fr.append(clean(im.convert('RGBA'))); du.append(im.info.get('duration', 83))
for q in (74, 68, 62, 56):
    fr[0].save(dst, save_all=True, append_images=fr[1:], duration=du, loop=0, format='WEBP',
               lossless=False, quality=q, method=4, disposal=2)
    if os.path.getsize(dst) <= 600 * 1024: break
print(os.path.basename(dst), len(fr), 'frames', os.path.getsize(dst) // 1024, 'KB q', q)
