# 초록 배경 프레임 폴더 → 투명 애니 WebP + 한글 배지. 꿀댕이용(노랑 조끼라 사이담 despill 대신 G>max(R,B)만 뺀다).
#   python make_anim.py <프레임폴더(s000.png…)> "<글자>" <출력.webp> [원본fps=24] [출력fps=12] [화질=74]
#   둘이 나오는 장면(일어나!)은 길고 넓어 1.2MB가 돼서 화질 62로 낮춤.
import sys, glob, os, numpy as np
from PIL import Image
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'set16'))
from make_sticker import key, badge, W, H, BAND

def main(folder, text, dst, src_fps=24, fps=12, quality=74):
    fs = sorted(glob.glob(os.path.join(folder, 's*.png')))
    step = max(1, round(src_fps / fps))
    fs = fs[::step]
    frames = [key(f) for f in fs]
    box = None
    for im in frames:
        b = im.split()[3].point(lambda v: 255 if v > 20 else 0).getbbox()
        if b: box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
    first = frames[0].split()[3].point(lambda v: 255 if v > 20 else 0).getbbox()
    bd = badge(text, int(H * BAND * 0.62)); bx = (W - bd.size[0]) // 2; by = max(0, int(H * BAND * 0.5) - bd.size[1] // 2)
    band_px = by + bd.size[1]; gap = int(H * 0.04)
    uw, uh = box[2] - box[0], box[3] - box[1]
    k = min(W * 0.82 / (first[2] - first[0]), W * 0.90 / uw, (H - gap - band_px) / uh)
    out = []
    for im in frames:
        c = im.crop(box).resize((max(1, int(uw * k)), max(1, int(uh * k))), Image.LANCZOS)
        cv = Image.new('RGBA', (W, H), (0, 0, 0, 0)); cv.alpha_composite(c, ((W - c.width) // 2, H - c.height - gap)); cv.alpha_composite(bd, (bx, by))
        out.append(cv)
    out[0].save(dst, save_all=True, append_images=out[1:], duration=int(1000 / fps), loop=0, format='WEBP',
                lossless=False, quality=quality, method=6, disposal=2)
    print(len(out), 'frames', os.path.getsize(dst) // 1024, 'KB')

if __name__ == '__main__':
    a = sys.argv
    main(a[1], a[2], a[3], int(a[4]) if len(a) > 4 else 24, int(a[5]) if len(a) > 5 else 12, int(a[6]) if len(a) > 6 else 74)
