# 잠 소리용 빗소리 합성 — 녹음 출처(저작권) 걱정 없이 코드로 만든다. 끝과 처음을 겹쳐(교차 페이드) 이음새 없이 반복된다.
#   /usr/bin/python3 art/sleep/gen_rain.py   → out/rain-a.wav, rain-b.wav(+ 미리듣기 m4a), 분홍·갈색 미리듣기
#   구성: 빗줄기 쉬익(대역 잡음, 아주 느린 세기 흔들림) + 잔 빗방울 톡톡(짧은 잡음 조각 수백 개/초) + 굵은 방울 몇 개 + 먼 웅웅(저역).
import os, numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile
SR = 32000
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out'); os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(20261101)

def band(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype='band', fs=SR, output='sos'), x)
def low(x, f, order=2):
    return sosfilt(butter(order, f, btype='low', fs=SR, output='sos'), x)
def rms(x): return float(np.sqrt(np.mean(x ** 2)))
def slow_wobble(n, depth, fmax):          # 0.03~fmax Hz 느린 흔들림(바람·빗줄기 굵기)
    w = low(rng.standard_normal(n), fmax, 2); w /= (np.abs(w).max() + 1e-9)
    return 1 + depth * w

def drops(n, rate, lo, hi, len_ms, amp_sigma):
    """짧은 감쇠 잡음 조각(빗방울)을 무작위 시각에 뿌린다. 조각은 64가지를 미리 만들어 돌려 쓴다."""
    bank = []
    for _ in range(64):
        L = int(SR * rng.uniform(*len_ms) / 1000)
        c = rng.uniform(lo, hi)
        b = band(rng.standard_normal(L + 64), max(80, c * 0.6), min(SR / 2 - 100, c * 1.6))[64:]
        env = np.exp(-np.linspace(0, rng.uniform(4, 8), L)); env[:min(8, L)] *= np.linspace(0, 1, min(8, L))
        b = b * env; bank.append(b / (np.abs(b).max() + 1e-9))
    out = np.zeros(n)
    k = rng.poisson(rate * n / SR)
    at = rng.integers(0, n, k); amp = rng.lognormal(0, amp_sigma, k)
    for t, a in zip(at, amp):
        b = bank[rng.integers(64)]; e = min(n, t + len(b)); out[t:e] += a * b[:e - t]
    return out

def rain(seconds, *, hiss_hi, drop_rate, drop_hi, big_rate, rumble, seed):
    global rng; rng = np.random.default_rng(seed)
    n = int(SR * seconds)
    ch = []
    common = band(rng.standard_normal(n), 300, hiss_hi)                 # 두 귀에 같이 들리는 몫(70%) — 공간이 너무 갈라지지 않게
    for side in range(2):
        hiss = 0.7 * common + 0.3 * band(rng.standard_normal(n), 300, hiss_hi)
        hiss = low(hiss, hiss_hi * 0.8) * slow_wobble(n, 0.18, 0.25)
        d = drops(n, drop_rate, 1500, drop_hi, (2, 10), 0.6)
        big = drops(n, big_rate, 500, 1400, (18, 45), 0.4)
        rum = low(np.cumsum(rng.standard_normal(n)) * 0.002, 140) if rumble else np.zeros(n)
        x = hiss / rms(hiss) * 0.085 + d / (rms(d) + 1e-9) * 0.05 + big / (rms(big) + 1e-9) * 0.02
        if rumble: x += (rum - low(rum, 15)) / (rms(rum) + 1e-9) * 0.03
        ch.append(x)
    return np.stack(ch, 1)

def loopable(y, X):
    L = len(y) - X
    t = np.linspace(0, np.pi / 2, X)[:, None]
    out = y[:L].copy(); out[:X] = y[:X] * np.sin(t) + y[L:L + X] * np.cos(t)
    return out

def finish(y, name):
    y = y / rms(y) * 0.16
    y = np.tanh(y * 1.4) / 1.4                                          # 드문 큰 방울만 살짝 눌러 찢어짐 방지
    wavfile.write(os.path.join(OUT, name + '.wav'), SR, (y * 32767).astype(np.int16))
    print(name, 'rms', round(rms(y), 3), 'peak', round(float(np.abs(y).max()), 3), round(len(y) / SR, 1), 's')

LOOP, X = 80, 6
finish(loopable(rain(LOOP + X, hiss_hi=6500, drop_rate=260, drop_hi=4500, big_rate=4, rumble=True, seed=1), SR * X), 'rain-a')   # 포근한(따뜻·잔잔)
finish(loopable(rain(LOOP + X, hiss_hi=9000, drop_rate=520, drop_hi=7000, big_rate=9, rumble=False, seed=2), SR * X), 'rain-b')  # 창가(톡톡 또렷)

# 앱 안 분홍·갈색 소음과 같은 식(SleepSound.swift)으로 미리듣기 12초
n = SR * 12; w = rng.uniform(-1, 1, n); st = np.zeros(7); pk = np.zeros(n)
for i in range(n):
    x = w[i]
    st[0] = 0.99886 * st[0] + x * 0.0555179; st[1] = 0.99332 * st[1] + x * 0.0750759; st[2] = 0.96900 * st[2] + x * 0.1538520
    st[3] = 0.86650 * st[3] + x * 0.3104856; st[4] = 0.55000 * st[4] + x * 0.5329522; st[5] = -0.7616 * st[5] - x * 0.0168980
    pk[i] = (st[0] + st[1] + st[2] + st[3] + st[4] + st[5] + st[6] + x * 0.5362) * 0.11; st[6] = x * 0.115926
br = np.zeros(n); last = 0.0
for i in range(n): last = (last + 0.02 * w[i]) / 1.02; br[i] = last * 3.2
for nm, y in (('pink', pk), ('brown', br)):
    print(nm, 'rms', round(rms(y), 3), 'peak', round(float(np.abs(y).max()), 3))
    wavfile.write(os.path.join(OUT, nm + '-preview.wav'), SR, (np.clip(y, -1, 1) * 32767).astype(np.int16))
