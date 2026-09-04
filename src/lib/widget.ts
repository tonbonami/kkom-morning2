// 홈 위젯 스냅샷 — 웹이 모은 데이터를 네이티브 앱그룹에 써서 위젯이 읽게 함.
// (네이티브 앱에서만 동작. PWA/브라우저는 무시.)
import { serverNow } from './presence';

const DDAY = '2023-09-28'; // 우댕♥꼼이 사귄 날

// Live Activity(제미나이 ContentState)용 파생값 — 네이티브 계산과 동일 규칙.
function agoTextJS(lastSeen: number, now: number): string {
  if (!lastSeen) return '대기 중';
  const m = Math.max(1, Math.floor(Math.max(0, now - lastSeen) / 60000));
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24); if (d === 1) return '어제'; if (d < 7) return `${d}일 전`;
  return `${Math.floor(d / 7)}주 전`;
}
function ddayTextJS(nowMs: number): string {
  const kstDay = (ms: number) => Math.floor((ms + 9 * 3600 * 1000) / 86400000);
  const days = kstDay(nowMs) - kstDay(Date.parse(`${DDAY}T00:00:00+09:00`));
  return `D+${days + 1}`;
}
function skyEmojiJS(sky?: string): string {
  if (sky === '1') return '☀️';
  if (sky === '3') return '⛅';
  if (sky === '4') return '☁️';
  return '🌤️';
}

export interface WidgetSnapshot {
  partnerName: string;
  partnerLastSeenMs: number;   // 서버 epoch (presence lastSeenAt)
  partnerActive: boolean;
  nextEventTitle?: string;
  nextEventDate?: string;      // YYYY-MM-DD
  airGrade?: string;
  airPm10?: number;
  airPm25?: number;
  airLoc?: string;
  weatherTemp?: number;
  weatherSky?: string;
  weatherRainEmoji?: string;   // 비/눈 예보 있으면 ☔/🌨️
  partnerMood?: string;        // 이모지
}

// 로그아웃 시 호출 — 위젯이 옛 상대를 계속 보여주지 않게 네이티브 앱그룹 스냅샷을 지운다.
export async function clearWidgetSnapshot(): Promise<void> {
  try {
    const { Capacitor, registerPlugin } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;
    const bridge = registerPlugin('WidgetBridge') as { clear(): Promise<void> };
    await bridge.clear();
  } catch { /* 위젯 없거나 네이티브 아님 — 무시 */ }
}

export async function pushWidgetSnapshot(s: WidgetSnapshot): Promise<void> {
  try {
    const { Capacitor, registerPlugin } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;
    const bridge = registerPlugin('WidgetBridge') as { update(o: Record<string, unknown>): Promise<void> };
    const payload: Record<string, unknown> = {
      partnerName: s.partnerName,
      partnerLastSeenMs: s.partnerLastSeenMs,
      partnerActive: s.partnerActive,
      snapshotServerMs: serverNow(),   // 시계 오차 보정된 현재 서버 시각
      snapshotDeviceMs: Date.now(),
      ddayDate: DDAY,
    };
    if (s.nextEventTitle) payload.nextEventTitle = s.nextEventTitle;
    if (s.nextEventDate) payload.nextEventDate = s.nextEventDate;
    if (s.airGrade) payload.airGrade = s.airGrade;
    if (s.airPm10 != null) payload.airPm10 = s.airPm10;
    if (s.airPm25 != null) payload.airPm25 = s.airPm25;
    if (s.airLoc) payload.airLoc = s.airLoc;
    if (s.weatherTemp != null) payload.weatherTemp = s.weatherTemp;
    if (s.weatherSky) payload.weatherSky = s.weatherSky;
    if (s.weatherRainEmoji) payload.rainEmoji = s.weatherRainEmoji;
    if (s.partnerMood) payload.partnerMood = s.partnerMood;
    await bridge.update(payload);

    // Live Activity base 저장 — 상대 ping이 이 base를 프레즌스만 패치해 씀(키=iOS ContentState).
    const me = s.partnerName === '꼼이' ? '우댕' : '꼼이';
    const myKey = me === '우댕' ? 'udaeng' : 'kkomi';
    const grade = s.airGrade && s.airGrade !== '정보 없음' && s.airGrade !== '조회 실패' ? s.airGrade : undefined;
    const now = serverNow();
    const online = s.partnerActive && s.partnerLastSeenMs > 0 && now - s.partnerLastSeenMs < 90000;
    const state: Record<string, unknown> = {
      partnerName: s.partnerName,
      online,
      agoText: online ? '지금 함께' : agoTextJS(s.partnerLastSeenMs, now),
      dday: ddayTextJS(now),
      skyEmoji: skyEmojiJS(s.weatherSky),
    };
    if (grade) state.airGrade = grade;
    if (s.airLoc) state.airLoc = s.airLoc;
    if (s.airPm10 != null) state.pm10 = s.airPm10;
    if (s.airPm25 != null) state.pm25 = s.airPm25;
    if (s.weatherTemp != null) state.temp = s.weatherTemp;
    if (s.weatherRainEmoji) state.rainEmoji = s.weatherRainEmoji;
    if (s.partnerMood) state.partnerMood = s.partnerMood;
    fetch('/api/live-activity/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userKey: myKey, state }),
    }).catch(() => {});
  } catch { /* 위젯 없거나 네이티브 아님 — 무시 */ }
}
