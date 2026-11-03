# 사이담 꼬까 마스코트 반복 움짤 5개 — Kling 22차(파란 배경, 시작=끝 같은 그림) → 투명 WebP 400×400(꼬까2 팩·꼼이 움짤과 같은 캔버스·캐릭터 키 74%).
#   /usr/bin/python3 make_kkoka_now.py   (frames/<이름>/f001.png… 가 있어야 함, ffmpeg로 뽑음)
#   ⚠️ 초록 배경이 아니라 파랑(0,60,255): night·shy에 초록 잎이 있어 초록을 빼면 잎이 같이 지워진다.
#   파랑 빼기: d = B − max(R,G). 꼬까 그림엔 파란 기운이 0%(재 봄) → d ≤ 30 은 그대로, d ≥ 110 은 투명, 사이는 부드럽게.
#   가장자리 파란 번짐은 B를 max(R,G)로 눌러 없앤다. Kling 출력 960 → 400 축소(입력 1024에 400 그림을 그대로 키워 넣었으니 비율이 같다).
import os, sys, numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out'); os.makedirs(OUT, exist_ok=True)
S, LO, HI = 400, 30.0, 110.0

def key(path):
    a = np.array(Image.open(path).convert('RGB')).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    d = b - np.maximum(r, g)
    alpha = np.clip((HI - d) / (HI - LO), 0, 1)
    b2 = np.where(d > 0, np.maximum(r, g), b)          # 파란 번짐 제거
    rgba = np.dstack([r, g, b2, alpha * 255]).astype(np.uint8)
    return Image.fromarray(rgba, 'RGBA').resize((S, S), Image.LANCZOS)

def main(names, fps=12, quality=75):
    for n in names:
        files = sorted(os.listdir(os.path.join(HERE, 'frames', n)))
        step = max(1, round(24 / fps))
        frames = [key(os.path.join(HERE, 'frames', n, f)) for f in files[::step]]
        # 반복 이음새: 마지막 프레임이 첫 프레임과 거의 같으면 마지막 것을 빼 같은 장면이 두 번 안 나오게
        a0, a1 = np.array(frames[0]).astype(int), np.array(frames[-1]).astype(int)
        if np.abs(a0 - a1).mean() < 6: frames = frames[:-1]
        dst = os.path.join(OUT, f'{n}.webp')
        frames[0].save(dst, save_all=True, append_images=frames[1:], duration=int(1000 / fps), loop=0,
                       format='WEBP', lossless=False, quality=quality, method=6, disposal=2)
        frames[0].save(os.path.join(OUT, f'{n}-still.png'), optimize=True)   # 꼼이 still과 같은 규칙: 0번째 프레임
        al = np.array(frames[0])[..., 3]; ys, xs = np.where(al > 20)
        print(n, len(frames), 'frames', round(len(frames) / fps, 2), 's', os.path.getsize(dst) // 1024, 'KB',
              'char h %.0f%%' % ((ys.max() - ys.min()) / S * 100), 'loop diff %.1f' % np.abs(a0 - a1).mean())

if __name__ == '__main__':
    main(sys.argv[1:] or ['hug', 'yay', 'night', 'doki', 'shy'])
