// 홈 위젯 스냅샷 — 웹이 모은 데이터를 네이티브 앱그룹에 써서 위젯이 읽게 함.
// (네이티브 앱에서만 동작. PWA/브라우저는 무시.)
import { serverNow } from './presence';

const DDAY = '2023-09-28'; // 우댕♥꼼이 사귄 날

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
  partnerMood?: string;        // 이모지
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
    if (s.partnerMood) payload.partnerMood = s.partnerMood;
    await bridge.update(payload);
  } catch { /* 위젯 없거나 네이티브 아님 — 무시 */ }
}
