# 실제 빗소리 녹음(Pixabay 무료 라이선스) → 앱용 반복 파일. 우댕 「인공적인 빗소리 같아, 실제 소리 넣을 수 없어?」(2026-11-02) → 둘 다.
#   /usr/bin/python3 art/sleep/prep_real_rain.py <내려받은 wav 폴더> <출력 폴더>
#   - 기와지붕: richwise 「Soft rain on a tile roof」(pixabay 14515) 8:46 — 마지막 1분이 커서 10~470초만.
#   - 창가: DonRain 「Rain (on the window)」(pixabay 114709) 15:00 — 고르게 조용함, 10~610초(10분)만.
#   둘 다 녹음이 아주 작아(실효 0.003·0.006) 크기를 분홍·갈색 소음과 비슷하게(실효 ≈ 0.13) 올리고, 드문 큰 방울은 부드럽게 누른다.
#   끝 8초를 처음 8초와 교차 페이드해 이음새 없이 반복되게 한다. ⚠️ 원본·결과 음원은 공개 저장소에 올리지 않는다(라이선스상 단독 재배포 금지).
import sys, os, numpy as np
from scipy.io import wavfile
src, dst = sys.argv[1], sys.argv[2]
SPEC = {'roof': ('tile-roof.wav', 10, 470), 'window': ('window.wav', 10, 610)}
X = 8
for name, (fn, a, b) in SPEC.items():
    sr, x = wavfile.read(os.path.join(src, fn)); x = x.astype(np.float64) / 32768
    y = x[int(a * sr):int((b + X) * sr)]
    L = len(y) - X * sr
    t = np.linspace(0, np.pi / 2, X * sr)[:, None]
    out = y[:L].copy(); out[:X * sr] = y[:X * sr] * np.sin(t) + y[L:L + X * sr] * np.cos(t)
    rms = np.sqrt(np.mean(out ** 2)); g = 0.13 / rms
    out = np.tanh(out * g * 1.3) / 1.3
    print(name, 'gain x%.0f' % g, 'rms %.3f' % np.sqrt(np.mean(out ** 2)), 'peak %.3f' % np.abs(out).max(), round(len(out) / sr), 's')
    wavfile.write(os.path.join(dst, f'{name}.wav'), sr, (out * 32767).astype(np.int16))
