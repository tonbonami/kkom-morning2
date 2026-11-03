# 꼼이+꿀됑 커플 → 사이담 「꼼이랑 꿀됑」 팩(우댕 「서로 안고 있는 거 굳이 뺄 이유 있나?」, 사이담 경유 2026-11-04). 새 클링·새 그림 없음.
#   /usr/bin/python3 art/kkuldoeng-export/export_couple.py [still] [anim]
#   정지 → notext-couple/c_*.webp(400, 둘을 합친 덩어리 키 74% 가운데) — 글씨 없는 것은 바로 사이담 couple/ 로.
#   움짤 → anim-raw/c_*.webp(무손실, 사이담 add-emo-label 이 k≈1 되게 미리 앉힘).
#   글씨는 사이담에서(배지 규칙은 사이담 한 곳에만):
#     cd ../saidam && EMO_PY=/usr/bin/python3 node scripts/add-emo-label.mjs <파일> "글자"  → <파일>-label.webp
#     움짤은 그다음 fit_anim.py 로 600KB 맞춤.
import os, sys, shutil, subprocess, tempfile
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(ROOT, 'art', 'couple16'))
from export import cut, place
from export_anim import prelayout, save_raw
from make_couple import cutout
from make_sticker import key
SD = '/Users/mydang/Claude_Code/saidam/art/kkuldoeng'
NT = os.path.join(HERE, 'notext-couple')
C16 = os.path.join(ROOT, 'art', 'couple16', 'orig')
K = os.path.join(ROOT, 'art', 'kkuldaeng')

# (이름, 원본, 글씨) — 글씨는 우댕 「글씨가 필요하면 넣어야 해. 뜻이 안 통하면 안 돼」. '' = 그림만으로 뜻이 확실.
#   꼼모닝·푸데데는 둘만의 낱말이라 그림은 두고 낱말만 바꿨다(혼자 팩 꼼슌아→자기야~, 푸데데→꿀잠과 같은 방식). 14 화이트닝은 그림째 둘만의 농담이라 뺌.
STILLS = [
    ('c_morning', 'cp01-morning', '좋은 아침'), ('c_night', 'cp02-night', '잘자'), ('c_love', 'cp03-love', '사랑해'),
    ('c_eat', 'cp04-mukbang', ''), ('c_selfie', 'cp05-selfie', ''), ('c_takecare', 'cp06-takecare', '조심히 와'),
    ('c_arrived', 'cp07-arrived', '왔어!'), ('c_itsok', 'cp08-itsok', '괜찮아'), ('c_goodjob', 'cp09-goodjob', '수고했어'),
    ('c_sulk', 'cp10-sulk', '삐짐'), ('c_makeup', 'cp11-makeup', '화해'), ('c_congrats', 'cp12-congrats', '축하해'),
    ('c_nap', 'cp13-nap', '꿀잠'), ('c_dust', 'cp15-dust', '먼지 저리가'), ('c_date', 'cp16-date', '데이트'),
    ('c_kiss', os.path.join(K, 'kiss', 'kiss-a-green.png'), ''),
]
# 움짤 — 꼼모닝 때 우댕 OK 받은 편집 순서 그대로(대화 기록에서 옮김). 24fps 원본 → 12fps
ANIMS = {'c_wake': '일어나!', 'c_kiss': ''}

def mp4_frames(path):
    d = tempfile.mkdtemp()
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', path, os.path.join(d, 'f%03d.png')], check=True)
    return lambda i: os.path.join(d, f'f{i:03d}.png')

def wake_seq():
    # 영상 1: 멀리서 붕붕 → 꼼이 혼자 귀 쫑긋·휙 → 꿀됑 흠칫 / 영상 2: 내려앉아 멍(+4장 더) / 영상 3: f2~30 + f46~72(기대며 겹치는 구간 잘라 냄)
    v = [mp4_frames(os.path.join(K, 'wake', f'kling14-wake-{n}.mp4')) for n in (1, 2, 3)]
    s = [v[0](i) for i in range(1, 74)] + [v[1](i) for i in range(2, 74)] + [v[1](73)] * 4
    return s + [v[2](i) for i in range(2, 31)] + [v[2](i) for i in range(46, 73)]

def kiss_seq():
    # 영상 1 f1~52(쪽!) + 영상 2 f10~73(더듬이 하트·붕 뜸) + 마지막 장 20장 더
    v = [mp4_frames(os.path.join(K, 'kiss', f'kling17-kiss-{n}.mp4')) for n in (1, 2)]
    return [v[0](i) for i in range(1, 53)] + [v[1](i) for i in range(10, 74)] + [v[1](73)] * 20

def stills():
    os.makedirs(NT, exist_ok=True); os.makedirs(f'{SD}/couple', exist_ok=True)
    for name, src, text in STILLS:
        p = src if os.path.isabs(src) else os.path.join(C16, src + '.png')
        im = cut(p) if p.endswith('-green.png') else cutout(p)
        cv = place(im, 400, 0.74)
        out = os.path.join(NT, f'{name}.webp'); cv.save(out, 'WEBP', quality=86, method=6)
        if not text: shutil.copy(out, f'{SD}/couple/{name}.webp')
        print(name, text or '(글씨 없음)', os.path.getsize(out) // 1024, 'KB')

def anims():
    cache = {}
    for name, text in ANIMS.items():
        seq = (wake_seq if name == 'c_wake' else kiss_seq)()[::2]
        fr = []
        for p in seq:
            if p not in cache: cache[p] = key(p)
            fr.append(cache[p])
        save_raw(name, prelayout(fr, text))

if __name__ == '__main__':
    what = sys.argv[1:] or ['still', 'anim']
    if 'still' in what: stills()
    if 'anim' in what: anims()
