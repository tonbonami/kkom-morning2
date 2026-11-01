'use client';
// 잠 소리(백색소음) — 소리는 아이폰 앱(SleepSound.swift, AVAudioEngine)만 낸다. 웹은 고르고·켜고·끄기와 상태 표시만.
//   왜 웹이 아니라 네이티브: 웹뷰 소리는 화면을 잠그면 멈출 수 있고 JS 타이머도 백그라운드에서 선다(GPT 상의 docs/gpt-sleep-sound-answer.md).
//   설정(소리·끄는 때·아침 시각·볼륨)은 기기별 localStorage — 꼼이 폰 설정은 꼼이 폰에만.
import { useCallback, useEffect, useMemo, useState } from 'react';

export type SleepEndMode = 'morning' | 'forever';
export interface SleepSoundStatus { playing: boolean; sound: string; volume: number; endAt: number | null }
export const SLEEP_SOUNDS = [
  { id: 'rain', name: '포근한 빗소리', desc: '잔잔한 밤비' },
  { id: 'pink', name: '분홍 소음', desc: '부드러운 쉬—' },
  { id: 'brown', name: '갈색 소음', desc: '낮고 둥근 바람' },
];
const KEY = 'kkom-sleep-sound';
interface Prefs { sound: string; endMode: SleepEndMode; morningTime: string; volume: number }
const DEFAULT_PREFS: Prefs = { sound: 'rain', endMode: 'morning', morningTime: '07:00', volume: 0.6 };

type Plugin = {
  play(o: { sound: string; volume: number; endAt: number | null }): Promise<SleepSoundStatus>;
  stop(): Promise<void>;
  setVolume(o: { volume: number }): Promise<SleepSoundStatus>;
  status(): Promise<SleepSoundStatus>;
  addListener(ev: 'state', cb: (s: SleepSoundStatus) => void): Promise<{ remove: () => void }>;
};
let pluginP: Promise<Plugin | null> | null = null;
// 개발 서버에서만: 주소에 ?mockSleep 이 있으면 가짜 플러그인(소리 없음)으로 화면·흐름을 확인한다.
function mockPlugin(): Plugin {
  let s: SleepSoundStatus = { playing: false, sound: 'rain', volume: 0.6, endAt: null };
  const subs: ((x: SleepSoundStatus) => void)[] = [];
  const set = (x: SleepSoundStatus) => { s = x; subs.forEach((f) => f(s)); return s; };
  return {
    play: async (o) => set({ playing: true, sound: o.sound, volume: o.volume, endAt: o.endAt }),
    stop: async () => { set({ ...s, playing: false, endAt: null }); },
    setVolume: async (o) => set({ ...s, volume: o.volume }),
    status: async () => s,
    addListener: async (_e, cb) => { subs.push(cb); return { remove: () => { subs.splice(subs.indexOf(cb), 1); } }; },
  };
}
function plugin(): Promise<Plugin | null> {
  if (!pluginP) pluginP = (async () => {
    if (process.env.NODE_ENV !== 'production' && typeof location !== 'undefined' && /mockSleep/.test(location.search)) return mockPlugin();
    try {
      const { Capacitor, registerPlugin } = await import('@capacitor/core');
      if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable('SleepSound')) return null;   // 옛 빌드(플러그인 없음)도 여기서 걸러진다
      return registerPlugin('SleepSound') as unknown as Plugin;
    } catch { return null; }
  })();
  return pluginP;
}

// 다음 「HH:MM」 시각(이미 지났으면 내일)
export function nextMorning(hhmm: string, now = new Date()): number {
  const [h, m] = hhmm.split(':').map((v) => parseInt(v, 10));
  const d = new Date(now); d.setHours(isNaN(h) ? 7 : h, isNaN(m) ? 0 : m, 0, 0);
  if (d.getTime() <= now.getTime() + 60_000) d.setDate(d.getDate() + 1);
  return d.getTime();
}
function fmtLeft(ms: number) {
  const min = Math.max(0, Math.round(ms / 60_000)); const h = Math.floor(min / 60); const m = min % 60;
  return h > 0 ? `${h}시간 ${m}분 남음` : `${m}분 남음`;
}
function fmtClock(hhmm: string) {
  const [h, m] = hhmm.split(':').map((v) => parseInt(v, 10));
  return `${h < 12 ? '오전' : '오후'} ${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')}`;
}

export function useSleepSound() {
  const [available, setAvailable] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [st, setSt] = useState<SleepSoundStatus>({ playing: false, sound: 'rain', volume: 0.6, endAt: null });
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) }); } catch { /* 기본값 */ }
    let off: (() => void) | undefined; let alive = true;
    plugin().then(async (p) => {
      if (!alive || !p) return;
      setAvailable(true);
      try { setSt(await p.status()); } catch { /* noop */ }
      const h = await p.addListener('state', (s) => setSt(s)); off = () => h.remove();
    });
    // 앱으로 돌아올 때 네이티브 상태를 다시 읽는다(웹 화면이 상태의 원본이 되면 안 됨)
    const onVis = () => { if (document.visibilityState === 'visible') plugin().then((p) => p?.status().then(setSt).catch(() => {})); };
    document.addEventListener('visibilitychange', onVis);
    return () => { alive = false; off?.(); document.removeEventListener('visibilitychange', onVis); };
  }, []);
  // 남은 시간 표시용 — 재생 중에만 30초마다
  useEffect(() => {
    if (!st.playing) return;
    const t = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(t);
  }, [st.playing]);

  const savePrefs = useCallback((p: Partial<Prefs>) => {
    setPrefs((prev) => { const next = { ...prev, ...p }; try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* noop */ } return next; });
  }, []);

  const play = useCallback(async (over?: Partial<Prefs>) => {
    const p = await plugin(); if (!p) return;
    const pr = { ...prefs, ...over };
    const endAt = pr.endMode === 'morning' ? nextMorning(pr.morningTime) : null;
    try { setSt(await p.play({ sound: pr.sound, volume: pr.volume, endAt })); } catch { /* noop */ }
  }, [prefs]);
  const stop = useCallback(async () => {
    const p = await plugin(); if (!p) return;
    try { await p.stop(); } catch { /* noop */ }
  }, []);
  const toggle = useCallback(() => (st.playing ? stop() : play()), [st.playing, play, stop]);

  // 재생 중에 소리·끄는 때·시각을 바꾸면 바로 그걸로 다시 튼다
  const select = useCallback((sound: string) => { savePrefs({ sound }); if (st.playing) void play({ sound }); }, [savePrefs, st.playing, play]);
  const setEndMode = useCallback((endMode: SleepEndMode) => { savePrefs({ endMode }); if (st.playing) void play({ endMode }); }, [savePrefs, st.playing, play]);
  const setMorningTime = useCallback((morningTime: string) => {
    if (!/^\d{2}:\d{2}$/.test(morningTime)) return;
    savePrefs({ morningTime }); if (st.playing && prefs.endMode === 'morning') void play({ morningTime });
  }, [savePrefs, st.playing, prefs.endMode, play]);
  const setVolume = useCallback((volume: number) => {
    savePrefs({ volume });
    plugin().then((p) => p?.setVolume({ volume }).catch(() => {}));
  }, [savePrefs]);

  const soundId = st.playing ? st.sound : prefs.sound;
  const soundName = SLEEP_SOUNDS.find((s) => s.id === soundId)?.name ?? '포근한 빗소리';
  const remainingText = st.playing ? (st.endAt ? fmtLeft(st.endAt - now) : '끌 때까지 계속') : undefined;
  const endText = useMemo(() => remainingText
    ?? (prefs.endMode === 'morning' ? `${fmtClock(prefs.morningTime)}까지` : '끌 때까지 계속'), [remainingText, prefs]);

  return { available, playing: st.playing, soundId, soundName, prefs, endText, remainingText,
    play, stop, toggle, select, setEndMode, setMorningTime, setVolume };
}
