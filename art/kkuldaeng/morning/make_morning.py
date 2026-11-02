# 꿀됑 「좋은 아침」 해돋이 — Kling 21차 영상(A 밤→빼꼼, B 해 뜸) → 반복 장면 카드 WebP + 정지컷 + 확인용 mp4.
#   /usr/bin/python3 make_morning.py   (frames/a, frames/b 에 ffmpeg로 뽑은 f001.png… 가 있어야 함)
#   B는 1.6~2.5초에 입을 크게 벌려 이·혀가 보이고(캐릭터 규칙 위반), C(눈부셔 코 벌름)는 코 벌름이 아예 없고 계속 웃는 입이라 안 씀.
#   → B의 깨끗한 앞부분(해가 뜨는 동안 쏙 숨었다가 웃으며 올라옴, f1~37)에서 끝 장면(입 다문 뿌듯, f64~73)으로 「뿅」 건너뛰고,
#     내려갈 땐 B 앞부분을 거꾸로(해가 지며 쏙 숨었다 멍하게 다시 빼꼼) → A 거꾸로(밤으로). 꼼이 판처럼 끝없이 반복.
import os, subprocess
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
S = 288   # 채팅 140px × 2배 정도
SEQ = (
    [('a', i) for i in range(1, 74, 3)]          # 밤 → 멍하게 빼꼼(빠르게)
    + [('b', i) for i in range(1, 38, 2)]        # 해가 뜨는 동안 쏙 숨었다 웃으며 올라옴
    + [('b', i) for i in range(64, 74, 2)]       # 「뿅」 — 입 다문 뿌듯(이·혀 나오는 가운데는 뺌)
    + [('b', 73)] * 8                            # 뿌듯 멈춤
    + [('b', i) for i in range(37, 0, -3)]       # 거꾸로: 해가 지며 쏙 숨었다 멍하게 다시 빼꼼
    + [('a', i) for i in range(73, 0, -4)]       # 거꾸로: 밤으로 가라앉아 방울만
    + [('a', 1)] * 4
)

def main(fps=12, quality=72):
    frames = [Image.open(os.path.join(HERE, 'frames', d, f'f{i:03d}.png')).convert('RGB').resize((S, S), Image.LANCZOS) for d, i in SEQ]
    out = os.path.join(HERE, 'out'); os.makedirs(out, exist_ok=True)
    dst = os.path.join(out, 'kkul-morning.webp')
    frames[0].save(dst, save_all=True, append_images=frames[1:], duration=int(1000 / fps), loop=0, format='WEBP', quality=quality, method=6)
    print(len(frames), 'frames', round(len(frames) / fps, 1), 's', os.path.getsize(dst) // 1024, 'KB')
    frames[len(SEQ) // 2 - 6].save(os.path.join(out, 'kkul-morning-still.png'), optimize=True)   # 정지컷 = 뿌듯한 해돋이
    tmp = os.path.join(HERE, 'preview'); os.makedirs(tmp, exist_ok=True)
    for f in os.listdir(tmp): os.remove(os.path.join(tmp, f))
    for n, f in enumerate(frames): f.resize((S * 2, S * 2), Image.LANCZOS).save(os.path.join(tmp, f'p{n:03d}.png'))
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-framerate', str(fps), '-i', os.path.join(tmp, 'p%03d.png'),
                    '-vf', 'loop=1:size=%d,format=yuv420p' % len(frames), '-c:v', 'libx264', '-crf', '20',
                    os.path.join(out, 'kkul-morning-preview.mp4')], check=True)

if __name__ == '__main__':
    main()
