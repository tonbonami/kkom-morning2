# 「멍!」 영상 2개(Kling 18차) → 투명 애니 WebP 하나 + 정지컷 + 확인용 mp4.
#   python make_meong.py   (frames/a, frames/b 에 ffmpeg로 뽑은 f001.png… 가 있어야 함)
#   A = 숨 들이쉬기 → 동시에 「멍!」, B = 소리에 밀려나 털썩 앉아 멍.
#   배지는 「멍!」(외침) → 「멍...」(멍때림)으로 바뀐다(GPT 제안 말장난, 우댕이 후보 2 고름 2026-10-27).
#   크기는 모든 장면을 합친 테두리로 한 번만 정한다 → 장면이 바뀌어도 캐릭터 크기가 안 튄다(make_combo.py와 같은 방식).
import sys, os, subprocess
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'set16'))
from make_sticker import key, badge, W, H, BAND

# (폴더, 배지, 24fps 프레임 순서)
CUT = os.environ.get('MEONG_CUT') == '1'   # 1이면 가운데(점프·확대·잘림)를 빼고 외침 → 바로 털썩 앉아 멍(Aside 편집 대안)
SEQ = (
    [('a', '멍!', i) for i in list(range(1, 40, 3))]          # 숨 들이쉬기 — 원본 1.6초를 빠르게
    + [('a', '멍!', i) for i in range(40, 74)]                # 동시에 「멍!」
    + ([('b', '멍!', i) for i in range(1, 11)] if CUT else
       [('b', '멍!', i) for i in range(1, 15)]                # 소리에 밀려나기 시작
       + [('b', '멍!', i) for i in range(15, 37, 2)]          # 쭉 밀려남 — Kling이 여기서 튀어 오르고 확대돼 양 끝이 잘려서 빠르게 지나감
       + [('b', '멍!', i) for i in range(37, 40)])
    + [('b', '멍...', i) for i in range(40, 74)]              # 털썩 앉아 멍(「…」은 Jua 글꼴에 없어 네모로 깨짐 → 마침표 셋)
    + [('b', '멍...', 73)] * 12                               # 끝에서 0.5초 멈춤
)

def main(fps=12, src_fps=24, quality=70):
    step = max(1, round(src_fps / fps))
    keyed = [(t, key(os.path.join(HERE, 'frames', d, f'f{i:03d}.png'))) for d, t, i in SEQ[::step]]
    box = None
    for _, im in keyed:
        b = im.split()[3].point(lambda v: 255 if v > 20 else 0).getbbox()
        if b: box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
    badges = {t: badge(t, int(H * BAND * 0.62)) for t in ('멍!', '멍...')}
    bd0 = badges['멍!']; band_px = max(0, int(H * BAND * 0.5) - bd0.size[1] // 2) + bd0.size[1]; gap = int(H * 0.04)
    uw, uh = box[2] - box[0], box[3] - box[1]
    k = min(W * 0.92 / uw, (H - gap - band_px) / uh)
    frames = []
    for text, im in keyed:
        c = im.crop(box).resize((max(1, int(uw * k)), max(1, int(uh * k))), Image.LANCZOS)
        cv = Image.new('RGBA', (W, H), (0, 0, 0, 0)); cv.alpha_composite(c, ((W - c.width) // 2, H - c.height - gap))
        bd = badges[text]; cv.alpha_composite(bd, ((W - bd.size[0]) // 2, max(0, int(H * BAND * 0.5) - bd.size[1] // 2)))
        frames.append((text, cv))
    dst = os.path.join(HERE, 'kkul-meong-cut.webp' if CUT else 'kkul-meong.webp')
    frames[0][1].save(dst, save_all=True, append_images=[f for _, f in frames[1:]], duration=int(1000 / fps), loop=0,
                      format='WEBP', lossless=False, quality=quality, method=6, disposal=2)
    print(len(frames), 'frames', round(len(frames) / fps, 1), 's', os.path.getsize(dst) // 1024, 'KB')
    # 정지컷 = 「멍!」 외치는 순간(A 끝)
    still = [f for t, f in frames if t == '멍!'][len([1 for t, _ in frames if t == '멍!']) * 2 // 5]
    if not CUT: still.save(os.path.join(HERE, 'kkul-meong-still.png'), optimize=True)
    # 확인용 mp4(채팅 말풍선 같은 연한 바탕)
    tmp = os.path.join(HERE, 'preview_frames_cut' if CUT else 'preview_frames'); os.makedirs(tmp, exist_ok=True)
    for f in os.listdir(tmp): os.remove(os.path.join(tmp, f))
    for n, (_, f) in enumerate(frames):
        bg = Image.new('RGBA', (W * 2, H * 2), (250, 246, 240, 255)); bg.alpha_composite(f.resize((W * 2, H * 2), Image.LANCZOS))
        bg.convert('RGB').save(os.path.join(tmp, f'p{n:03d}.png'))
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-framerate', str(fps), '-i', os.path.join(tmp, 'p%03d.png'),
                    '-vf', 'loop=1:size=%d,format=yuv420p' % len(frames), '-c:v', 'libx264', '-crf', '20',
                    os.path.join(HERE, 'kkul-meong-cut-preview.mp4' if CUT else 'kkul-meong-preview.mp4')], check=True)

if __name__ == '__main__':
    main()
