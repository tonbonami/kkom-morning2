# 「냥냥! 의기냥냥!」 영상 2개(Kling 19차) → 투명 애니 WebP 하나 + 정지컷 + 확인용 mp4.
#   /usr/bin/python3 make_nyang.py kkul|kkom   (frames/<이름>-a, -b 에 ffmpeg로 뽑은 f001.png… 가 있어야 함)
#   배지는 「냥냥!」(준비·냥냥 발짓) → 「의기냥냥!」(결의가 터지는 순간부터 끝까지)로 바뀐다(GPT 회의 + 우댕 「추천대로」 2026-10-30).
#   크기는 모든 장면을 합친 테두리로 한 번만 정한다 → 장면이 바뀌어도 캐릭터 크기가 안 튄다(make_meong.py와 같은 방식).
import sys, os, subprocess
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'kkuldaeng', 'set16'))
from make_sticker import key, badge, W, H, BAND

A, B = '냥냥!', '의기냥냥!'
SEQS = {   # (폴더, 배지, 24fps 프레임 번호)
    'kkul': (
        [('kkul-a', A, i) for i in range(1, 21)]                 # 낮게 버티며 앞발굽으로 고양이 발짓(냥, 냥)
        + [('kkul-a', A, i) for i in range(33, 41)]              # 고개 숙여 힘 모으기
        + [('kkul-a', B, i) for i in range(41, 57)]              # 고개 번쩍 + 외침, 더듬이 V
        + [('kkul-b', B, i) for i in range(1, 19)]               # 입 다물고 눈 감으며 뿌듯
        + [('kkul-b', B, i) for i in (19, 22, 25)]               # Kling이 몸을 돌리며 살짝 뜨는 구간 — 빠르게 지나감
        + [('kkul-b', B, i) for i in range(28, 74)]              # 더듬이 방울 둘이 머리 위에서 콩(떨어졌다 다시 붙음)
        + [('kkul-b', B, 73)] * 12),                             # 끝에서 0.5초 멈춤
}

def main(name, fps=12, src_fps=24, quality=70):
    seq = SEQS[name]; step = max(1, round(src_fps / fps))
    keyed = [(t, key(os.path.join(HERE, 'frames', d, f'f{i:03d}.png'))) for d, t, i in seq[::step]]
    box = None
    for _, im in keyed:
        b = im.split()[3].point(lambda v: 255 if v > 20 else 0).getbbox()
        if b: box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
    badges = {t: badge(t, int(H * BAND * 0.62)) for t in (A, B)}
    bd0 = badges[B]; band_px = max(0, int(H * BAND * 0.5) - bd0.size[1] // 2) + bd0.size[1]; gap = int(H * 0.04)
    uw, uh = box[2] - box[0], box[3] - box[1]
    k = min(W * 0.92 / uw, (H - gap - band_px) / uh)
    frames = []
    for text, im in keyed:
        c = im.crop(box).resize((max(1, int(uw * k)), max(1, int(uh * k))), Image.LANCZOS)
        cv = Image.new('RGBA', (W, H), (0, 0, 0, 0)); cv.alpha_composite(c, ((W - c.width) // 2, H - c.height - gap))
        bd = badges[text]; cv.alpha_composite(bd, ((W - bd.size[0]) // 2, max(0, int(H * BAND * 0.5) - bd.size[1] // 2)))
        frames.append((text, cv))
    out = os.path.join(HERE, 'out'); os.makedirs(out, exist_ok=True)
    dst = os.path.join(out, f'{name}-nyang.webp')
    frames[0][1].save(dst, save_all=True, append_images=[f for _, f in frames[1:]], duration=int(1000 / fps), loop=0,
                      format='WEBP', lossless=False, quality=quality, method=6, disposal=2)
    print(name, len(frames), 'frames', round(len(frames) / fps, 1), 's', os.path.getsize(dst) // 1024, 'KB')
    # 정지컷 = 마무리 장면(「의기냥냥!」 배지 + 사고 친 몸) — 서랍에서 이게 보인다
    frames[-1][1].save(os.path.join(out, f'{name}-nyang-still.png'), optimize=True)
    # 확인용 mp4(채팅 말풍선 같은 연한 바탕)
    tmp = os.path.join(HERE, 'preview', name); os.makedirs(tmp, exist_ok=True)
    for f in os.listdir(tmp): os.remove(os.path.join(tmp, f))
    for n, (_, f) in enumerate(frames):
        bg = Image.new('RGBA', (W * 2, H * 2), (250, 246, 240, 255)); bg.alpha_composite(f.resize((W * 2, H * 2), Image.LANCZOS))
        bg.convert('RGB').save(os.path.join(tmp, f'p{n:03d}.png'))
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-framerate', str(fps), '-i', os.path.join(tmp, 'p%03d.png'),
                    '-vf', 'loop=1:size=%d,format=yuv420p' % len(frames), '-c:v', 'libx264', '-crf', '20',
                    os.path.join(out, f'{name}-nyang-preview.mp4')], check=True)

if __name__ == '__main__':
    main(sys.argv[1])
