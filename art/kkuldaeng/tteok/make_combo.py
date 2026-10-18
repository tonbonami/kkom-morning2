# 떡 4종 영상 → 장면마다 배지가 바뀌는 투명 애니 WebP 하나 (찰떡! → 쑥떡! → 콩떡! → 개떡!) + 낱장 정지컷.
#   python make_combo.py <프레임 폴더 부모(chal/ ssuk/ kong/ gae/ 안에 f001.png…)> <출력 폴더>
#   - 낱장 움짤(kkul-tteok-*.webp)은 make_anim.py(앞뒤 반복)로 따로 만든다. 여기선 합친 판과 정지컷만.
#   - 크기는 네 장면 전체를 합친 테두리로 한 번만 정한다 → 장면이 바뀌어도 캐릭터 크기가 안 튄다.
import sys, os
from PIL import Image
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'set16'))
from make_sticker import key, badge, W, H, BAND

SEGS = [  # (폴더, 배지, 24fps 프레임 순서): 다가가기는 빠르게(3칸씩), 맞닿는 부분은 그대로, 끝에서 0.33초 멈춤
    ('chal', '찰떡!', list(range(1, 41, 3)) + list(range(41, 74)) + [73] * 8),
    ('ssuk', '쑥떡!', list(range(1, 37, 3)) + list(range(37, 74)) + [73] * 8),
    ('kong', '콩떡!', list(range(1, 41, 3)) + list(range(41, 74)) + [73] * 8),
    ('gae',  '개떡!', list(range(1, 21, 2)) + list(range(21, 74)) + [73] * 10),
]

def main(src, out_dir, fps=12, src_fps=24, quality=70):
    step = max(1, round(src_fps / fps))
    keyed = []   # (배지, RGBA)
    for folder, text, order in SEGS:
        for i in order[::step]:
            keyed.append((text, key(os.path.join(src, folder, f'f{i:03d}.png'))))
    box = None
    for _, im in keyed:
        b = im.split()[3].point(lambda v: 255 if v > 20 else 0).getbbox()
        if b: box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
    badges = {t: badge(t, int(H * BAND * 0.62)) for _, t, _ in SEGS}
    bd0 = next(iter(badges.values())); band_px = max(0, int(H * BAND * 0.5) - bd0.size[1] // 2) + bd0.size[1]; gap = int(H * 0.04)
    uw, uh = box[2] - box[0], box[3] - box[1]
    k = min(W * 0.92 / uw, (H - gap - band_px) / uh)
    frames = []
    for text, im in keyed:
        c = im.crop(box).resize((max(1, int(uw * k)), max(1, int(uh * k))), Image.LANCZOS)
        cv = Image.new('RGBA', (W, H), (0, 0, 0, 0)); cv.alpha_composite(c, ((W - c.width) // 2, H - c.height - gap))
        bd = badges[text]; cv.alpha_composite(bd, ((W - bd.size[0]) // 2, max(0, int(H * BAND * 0.5) - bd.size[1] // 2)))
        frames.append((text, cv))
    os.makedirs(out_dir, exist_ok=True)
    dst = os.path.join(out_dir, 'kkul-tteok-all.webp')
    frames[0][1].save(dst, save_all=True, append_images=[f for _, f in frames[1:]], duration=int(1000 / fps), loop=0,
                      format='WEBP', lossless=False, quality=quality, method=6, disposal=2)
    print(len(frames), 'frames', round(len(frames) / fps, 1), 's', os.path.getsize(dst) // 1024, 'KB')
    # 합친 판 정지컷 = 찰떡 맞닿는 순간
    still = next(f for t, f in frames[::-1] if t == '찰떡!')
    still.save(os.path.join(out_dir, 'kkul-tteok-all-still.png'), optimize=True)

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
