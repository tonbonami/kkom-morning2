# 꿀됑 움짤 → 사이담(400×400 webp, 12fps, 600KB 이하). 배지 없이 원본에서 다시 뽑는다(새 클링 없음).
#   /usr/bin/python3 art/kkuldoeng-export/export_anim.py      → anim-raw/<이름>.webp(무손실 중간본) + 해돋이 장면 카드
#   그다음 사이담에서 앉히기·글씨(배지 규칙은 사이담 한 곳에만):
#     cd ../saidam && EMO_PY=/usr/bin/python3 node scripts/add-emo-label.mjs <중간본> "글자"   ("" = 그림만)
#   - 으악·ㅋㅋㅋ·꽃·안아줘: 꼼모닝 때 만든 초록 편집본 영상(<이름>-edit.mp4, 960·24fps) — 이미 순서·박자가 편집된 것
#   - 화이팅(=의기냥냥 꿀됑 판): art/nyang/frames/kkul-a·b + make_nyang.py 의 SEQS['kkul'] 순서(배지만 안 붙임)
#   - 좋은 아침 해돋이: 장면 카드(배경 있음, 키잉 없음) — 사이담 make-scene-emo 와 같은 둥근 모서리(폭 8.5%)
import os, sys, subprocess, tempfile, numpy as np
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'art', 'kkuldaeng', 'set16'))
from make_sticker import key
RAW = os.path.join(HERE, 'anim-raw'); os.makedirs(RAW, exist_ok=True)
DST = '/Users/mydang/Claude_Code/saidam/art/kkuldoeng/anim'; os.makedirs(DST, exist_ok=True)
S = 400

def frames_from_mp4(mp4, step=2):
    d = tempfile.mkdtemp()
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', mp4, os.path.join(d, 'f%03d.png')], check=True)
    return [key(os.path.join(d, f)) for f in sorted(os.listdir(d))[::step]]

def solid(im): return im.split()[3].point(lambda v: 255 if v > 20 else 0).getbbox()

def clean(im, lo=24, hi=232):
    # 키잉 가장자리의 옅은 잡티는 0, 거의 불투명은 255로 — 알파가 단순해져 용량이 30%쯤 준다(눈으로는 차이 없음)
    a = np.array(im); al = a[..., 3]
    a[al < lo] = 0; a[..., 3] = np.where(al > hi, 255, a[..., 3])
    return Image.fromarray(a)

def prelayout(frames, text):
    # 사이담 add-emo-label 이 쓸 크기로 미리 줄여 둔다 — 그래야 거기서 다시 키우지 않아(k≈1) 흐려지지 않는다.
    # 그쪽 규칙: 첫 프레임 폭 82% · 움직임 합집합 폭 90% · 위 글자 띠(24%)와 바닥 4% 사이
    box = None
    for im in frames:
        b = solid(im)
        if b: box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
    f0 = solid(frames[0]); uw, uh = box[2] - box[0], box[3] - box[1]
    band = int(S * 0.24) if text else 0
    k = min(S * 0.82 / (f0[2] - f0[0]), S * 0.90 / uw, (S - int(S * 0.04) - band) / uh)
    out = []
    for im in frames:
        c = im.crop(box).resize((max(1, round(uw * k)), max(1, round(uh * k))), Image.LANCZOS)
        cv = Image.new('RGBA', (S, S), (0, 0, 0, 0)); cv.alpha_composite(c, ((S - c.width) // 2, S - c.height - int(S * 0.04)))
        out.append(clean(cv))
    return out

def save_raw(name, frames, fps=12):
    p = os.path.join(RAW, f'{name}.webp')
    frames[0].save(p, save_all=True, append_images=frames[1:], duration=int(1000 / fps), loop=0,
                   format='WEBP', lossless=True, method=4, disposal=2)
    print('raw', name, len(frames), 'frames', round(len(frames) / fps, 1), 's')

# 이름 → (원본, 글자). 글자는 우댕님 「글씨가 필요하면 넣어야 해. 뜻이 안 통하면 안 돼」(2026-11-04) 기준
JOBS = {'omg': ('euak', ''), 'laugh': ('kkk', ''), 'flower': ('flower', '꽃 줄게'), 'hugme': ('hug', '안아줘')}
if __name__ == '__main__':
    K = os.path.join(ROOT, 'art', 'kkuldaeng')
    for name, (d, text) in JOBS.items():
        save_raw(name, prelayout(frames_from_mp4(os.path.join(K, d, f'{d}-edit.mp4')), text))

    # 화이팅(의기냥냥 꿀됑 판) — make_nyang 의 순서 그대로, 배지만 없음
    sys.path.insert(0, os.path.join(ROOT, 'art', 'nyang'))
    import make_nyang
    seq = make_nyang.SEQS['kkul'][::2]
    save_raw('fighting', prelayout([key(os.path.join(ROOT, 'art', 'nyang', 'frames', dd, f'f{i:03d}.png')) for dd, _, i in seq], '화이팅!'))

    # 좋은 아침 해돋이 — 장면 카드(키잉 없음), make_morning 의 SEQ 그대로
    sys.path.insert(0, os.path.join(K, 'morning'))
    import make_morning
    R = int(S * 0.085); mask = Image.new('L', (S, S), 0); ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], R, fill=255)
    mf = []
    for dd, i in make_morning.SEQ:
        c = Image.open(os.path.join(K, 'morning', 'frames', dd, f'f{i:03d}.png')).convert('RGB').resize((S, S), Image.LANCZOS).convert('RGBA')
        c.putalpha(mask); mf.append(c)
    p = os.path.join(DST, 'morning-sun.webp')
    for q in (82, 74, 66):
        mf[0].save(p, save_all=True, append_images=mf[1:], duration=83, loop=0, format='WEBP', lossless=False, quality=q, method=4, disposal=2)
        if os.path.getsize(p) <= 600 * 1024: break
    print('morning-sun', len(mf), 'frames', os.path.getsize(p) // 1024, 'KB q', q)
