# 빗소리를 앱용 반복 파일로 — 「원본 그대로의 결」을 지키는 판(2026-11-03).
#   /usr/bin/python3 art/sleep/prep_rain_natural.py <입력 wav> <출력 wav> [교차페이드초=8]
#   ⚠️ 처음 판(prep_real_rain.py)은 크기를 올리며 tanh로 큰 소리를 눌렀다 → 빗방울 「톡톡」이 납작해지고(최대치 대비 평균 30dB → 16dB)
#      늘 깔린 쉬익 소리가 앞으로 나와 「바람 소리가 많이 나」(우댕, 텐트 빗소리). 높낮이 비중은 그대로였는데 결이 바뀐 것.
#   → 이제는 그냥 키우기만 한다: 상위 0.01% 세기가 -6dB에 오도록 같은 배율로 올리고, 그보다 드문 몇 개 방울만 -1dB에서 살짝(5ms) 받친다.
import sys, numpy as np
from scipy.io import wavfile
from scipy.ndimage import minimum_filter1d, uniform_filter1d
src, dst = sys.argv[1], sys.argv[2]
X = int(sys.argv[3]) if len(sys.argv) > 3 else 8
sr, x = wavfile.read(src); x = x.astype(np.float64) / 32768
L = len(x) - X * sr
t = np.linspace(0, np.pi / 2, X * sr)[:, None]
y = x[:L].copy(); y[:X * sr] = x[:X * sr] * np.sin(t) + x[L:L + X * sr] * np.cos(t)   # 끝 X초를 처음과 겹쳐 이음새 없이
a = np.abs(y).max(1)
g = 10 ** (-6 / 20) / np.quantile(a, 0.9999)
y *= g
thr = 10 ** (-1 / 20)
need = np.minimum(1.0, thr / np.maximum(np.abs(y).max(1), 1e-9))
w = int(sr * 0.005)
need = uniform_filter1d(minimum_filter1d(need, w * 2 + 1), w * 2 + 1)
y *= need[:, None]
a2 = np.abs(y); rms = np.sqrt(np.mean(y ** 2))
print(dst.split('/')[-1], 'gain x%.2f (%.1fdB)' % (g, 20 * np.log10(g)), 'rms %.1fdB' % (20 * np.log10(rms)),
      'peak %.1fdB' % (20 * np.log10(a2.max())), 'crest %.1fdB' % (20 * np.log10(a2.max() / rms)),
      'limited %.4f%%' % ((need < 0.999).mean() * 100), round(len(y) / sr), 's')
wavfile.write(dst, sr, (np.clip(y, -1, 1) * 32767).astype(np.int16))
