// 피부 일지 — 브라우저 쪽 도우미. 서버(/api/skin/*)는 PIN 쿠키(httpOnly, path /api/skin)로만 열린다.
import type { SkinLog } from './skinTypes';
import type { SkinDraft, MedStatus } from '@/components/skin/skinUi';

export const DEFAULT_MED = '항히스타민';

export const kstToday = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
export const addDays = (date: string, n: number) =>
  new Date(Date.parse(date + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);
const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'];
export const weekdayOf = (date: string) => WEEKDAY[new Date(date + 'T00:00:00Z').getUTCDay()];

export async function skinSession(): Promise<{ configured: boolean; authed: boolean }> {
  const r = await fetch('/api/skin/session', { cache: 'no-store' });
  return r.ok ? r.json() : { configured: false, authed: false };
}

export async function skinLogin(pin: string): Promise<'ok' | 'bad' | 'locked' | 'error'> {
  const r = await fetch('/api/skin/session', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin }),
  });
  if (r.ok) return 'ok';
  if (r.status === 401) return 'bad';
  if (r.status === 429) return 'locked';
  return 'error';
}

export async function fetchSkinLogs(from: string, to: string): Promise<SkinLog[] | null> {
  const r = await fetch(`/api/skin/log?from=${from}&to=${to}`, { cache: 'no-store' });
  if (r.status === 401) return null;
  if (!r.ok) throw new Error(`skin logs ${r.status}`);
  return (await r.json()).logs as SkinLog[];
}

export async function saveSkinLog(draft: SkinDraft): Promise<SkinLog> {
  // 약 줄 중 아무것도 안 고른 기본 줄(이름만 있는 빈 줄)은 '기록 없음'이라 빼고 보낸다.
  const meds = draft.meds.filter((m) => m.status || m.time || (m.name.trim() && m.name.trim() !== DEFAULT_MED));
  const r = await fetch('/api/skin/log', {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...draft, meds }),
  });
  if (!r.ok) throw new Error(`save ${r.status}`);
  return (await r.json()).log as SkinLog;
}

// 저장된 기록 → 화면 초안. 약 기록이 없으면 항히스타민 빈 줄 하나를 깔아 둔다(먹음/거름 한 번에 누르게).
export function draftFrom(date: string, log?: SkinLog | null): SkinDraft {
  const meds = log?.meds?.length ? log.meds.map((m) => ({ ...m })) : [{ name: DEFAULT_MED, time: null, status: null }];
  return {
    date,
    wheals: log?.wheals ?? null, itch: log?.itch ?? null,
    meds,
    episodes: log?.episodes ?? [], angioedema: log?.angioedema ?? null, trace: log?.trace ?? null,
    triggers: log?.triggers ?? [], foods: (log?.foods ?? []).map((f) => ({ t: f.t ?? null, text: f.text })),
    sleepH: log?.sleepH ?? null, wakeItch: log?.wakeItch ?? null, waterMl: log?.waterMl ?? null, stress: log?.stress ?? null,
    period: log?.period ?? null, cycleDay: log?.cycleDay ?? null, newProducts: log?.newProducts ?? [],
    note: log?.note ?? '',
  };
}

// 하루 약 상태 한 줄 요약: 하나라도 거름 > 늦게 > 먹음 > 기록 없음
export function medOfDay(log?: SkinLog | null): MedStatus | null {
  const s = (log?.meds ?? []).map((m) => m.status);
  if (s.includes('missed')) return 'missed';
  if (s.includes('late')) return 'late';
  if (s.includes('taken')) return 'taken';
  return null;
}

export function savedAtText(iso: string): string {
  const d = new Date(iso);
  const t = d.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Seoul' });
  return `${t}에 저장됨`;
}
