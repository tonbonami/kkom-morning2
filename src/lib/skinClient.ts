// 피부 일지 — 브라우저 쪽 도우미. 서버(/api/skin/*)는 PIN 쿠키(httpOnly, path /api/skin)로만 열린다.
import type { SkinLog } from './skinTypes';
import { nameFromCode } from './letters';
import { isPractice } from './practice';
import { demo } from './skinDemo';
import type { SkinDraft, MedStatus } from '@/components/skin/skinUi';
import type { ReportDay } from '@/components/skin/SkinDayReport';
import type { ApplyItem, ChatSummary, MemoryCandidate } from './skinChatSummary';

export const DEFAULT_MED = '항히스타민';
export const READ_ONLY_MSG = '보기 전용이에요 — 기록은 꼼이만 써요';

// 이 폰에 꼼모닝으로 로그인한 사람 이름(로그인코드 → 이름)
export function appUserName(): string {
  try {
    const code = JSON.parse(localStorage.getItem('kkom-user') || '{}').로그인코드;
    return code ? nameFromCode(code) : '';
  } catch { return ''; }
}

export const kstToday = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
export const addDays = (date: string, n: number) =>
  new Date(Date.parse(date + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);
const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'];
export const weekdayOf = (date: string) => WEEKDAY[new Date(date + 'T00:00:00Z').getUTCDay()];

export type SkinRole = 'kkomi' | 'viewer';

export async function skinSession(): Promise<{ configured: boolean; authed: boolean; role: SkinRole | null }> {
  if (isPractice()) return demo.session();
  const r = await fetch('/api/skin/session', { cache: 'no-store' });
  return r.ok ? r.json() : { configured: false, authed: false, role: null };
}

// as = 이 폰에 꼼모닝으로 로그인한 사람. 우댕 폰이면 서버가 보기 전용(viewer)으로 연다.
export async function skinLogin(pin: string, as: string): Promise<'ok' | 'bad' | 'locked' | 'error'> {
  if (isPractice()) return 'ok';
  const r = await fetch('/api/skin/session', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin, as }),
  });
  if (r.ok) return 'ok';
  if (r.status === 401) return 'bad';
  if (r.status === 429) return 'locked';
  return 'error';
}

export async function fetchSkinLogs(from: string, to: string): Promise<SkinLog[] | null> {
  if (isPractice()) return demo.logs(from, to);
  const r = await fetch(`/api/skin/log?from=${from}&to=${to}`, { cache: 'no-store' });
  if (r.status === 401) return null;
  if (!r.ok) throw new Error(`skin logs ${r.status}`);
  return (await r.json()).logs as SkinLog[];
}

export async function saveSkinLog(draft: SkinDraft): Promise<SkinLog> {
  // 약 줄 중 아무것도 안 고른 기본 줄(이름만 있는 빈 줄)은 '기록 없음'이라 빼고 보낸다.
  const meds = draft.meds.filter((m) => m.status || m.time || m.dose || (m.name.trim() && m.name.trim() !== DEFAULT_MED));
  if (isPractice()) return demo.save({ ...(draft as unknown as Partial<SkinLog>), date: draft.date, meds });
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

// 생리 주기 자동: 새 날 초안을 만들 때 어제가 「생리 중」(7일째까지)이면 오늘도 생리 중·n+1일째로 미리 채워 둔다(저장해야 확정).
export function prefillCycle(draft: SkinDraft, today?: SkinLog | null, yesterday?: SkinLog | null): SkinDraft {
  if (today || yesterday?.period !== true) return draft;
  const n = yesterday.cycleDay ?? null;
  if (n != null && n >= 7) return draft;
  return { ...draft, period: true, cycleDay: n != null ? n + 1 : null };
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

// ── 사진 ── 올리기 전에 브라우저에서 긴 변 1600px JPEG(0.85)로 줄인다(서버 한도 4MB, 같은 구도 비교엔 충분)
async function shrinkImage(file: File, maxSide = 1600): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url;
    });
    const k = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
    return await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('toBlob'))), 'image/jpeg', 0.85));
  } finally {
    URL.revokeObjectURL(url);
  }
}

export type SkinPhotoView = { id: string; url: string; t: string | null };

export async function fetchSkinPhotos(date: string): Promise<SkinPhotoView[]> {
  if (isPractice()) return demo.photos(date);
  const r = await fetch(`/api/skin/photo?date=${date}`, { cache: 'no-store' });
  return r.ok ? (await r.json()).photos : [];
}

export async function uploadSkinPhoto(date: string, file: File): Promise<SkinPhotoView> {
  if (isPractice()) return demo.addPhoto(date, file);
  const fd = new FormData();
  fd.append('date', date);
  fd.append('file', await shrinkImage(file), 'photo.jpg');
  const r = await fetch('/api/skin/photo', { method: 'POST', body: fd });
  if (!r.ok) throw new Error(`upload ${r.status}`);
  return (await r.json()).photo;
}

export async function deleteSkinPhoto(date: string, id: string): Promise<void> {
  if (isPractice()) { demo.deletePhoto(date, id); return; }
  await fetch(`/api/skin/photo?date=${date}&id=${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ── 설정·설문 ──
export async function fetchSkinSettings(): Promise<{ partnerAlert: boolean } | null> {
  if (isPractice()) return demo.settings();
  const r = await fetch('/api/skin/settings', { cache: 'no-store' });
  return r.ok ? r.json() : null;
}
export async function saveSkinSettings(partnerAlert: boolean): Promise<boolean> {
  if (isPractice()) { demo.setSettings(partnerAlert); return true; }
  const r = await fetch('/api/skin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ partnerAlert }) });
  return r.ok;
}
export async function fetchIntake(): Promise<Record<string, string | string[]> | null> {
  if (isPractice()) return demo.intake();
  const r = await fetch('/api/skin/intake', { cache: 'no-store' });
  return r.ok ? (await r.json()).answers : null;
}
export async function saveIntakeAnswer(id: string, value: string | string[] | null): Promise<boolean> {
  if (isPractice()) { demo.setIntake(id, value); return true; }
  const r = await fetch('/api/skin/intake', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, value }) });
  return r.ok;
}

// ── 모아보기·달력(우댕 2026-10-21: 한 달 넘게 쌓이면 7일 띠로는 못 본다)
export { SKIN_START } from './skinTypes';
export const monthOf = (date: string) => date.slice(0, 7);
export const addMonths = (ym: string, n: number) => {
  const d = new Date(Date.UTC(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1 + n, 1));
  return d.toISOString().slice(0, 7);
};
export const monthDays = (ym: string) => {
  const last = new Date(Date.UTC(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)), 0)).getUTCDate();
  return Array.from({ length: last }, (_, i) => `${ym}-${String(i + 1).padStart(2, '0')}`);
};
export const daysFromTo = (from: string, to: string) => {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
};

// 서버는 한 번에 120일까지 — 길면 나눠서 받는다
export async function fetchSkinLogsLong(from: string, to: string): Promise<SkinLog[] | null> {
  const out: SkinLog[] = [];
  for (let a = from; a <= to; a = addDays(a, 120)) {
    const b = addDays(a, 119) < to ? addDays(a, 119) : to;
    const part = await fetchSkinLogs(a, b);
    if (part === null) return null;
    out.push(...part);
  }
  return out;
}

export function toReportDay(date: string, l?: SkinLog | null): ReportDay {
  return {
    date, logged: !!l,
    wheals: l?.wheals ?? null, itch: l?.itch ?? null, uas: l?.uas ?? null,
    meds: l?.meds ?? [], episodes: l?.episodes ?? [], angioedema: l?.angioedema ?? null, trace: l?.trace ?? null,
    triggers: l?.triggers ?? [], foods: l?.foods ?? [],
    sleepH: l?.sleepH ?? null, wakeItch: l?.wakeItch ?? null, waterMl: l?.waterMl ?? null, stress: l?.stress ?? null,
    period: l?.period ?? null, cycleDay: l?.cycleDay ?? null, newProducts: l?.newProducts ?? [], note: l?.note ?? '',
    photoCount: l?.photos?.length ?? 0,
    env: l?.env ? { temp: l.env.temp, humidity: l.env.humidity, pm10: l.env.pm10, pm25: l.env.pm25 } : null,
  };
}

export function reportSummary(days: ReportDay[]) {
  const logged = days.filter((d) => d.logged);
  const scored = logged.filter((d) => d.uas != null);
  const count = new Map<string, number>();
  for (const d of logged) for (const t of new Set(d.triggers)) count.set(t, (count.get(t) ?? 0) + 1);
  return {
    daysLogged: logged.length, daysTotal: days.length,
    avgUas: scored.length ? Math.round((scored.reduce((s, d) => s + (d.uas ?? 0), 0) / scored.length) * 10) / 10 : null,
    hardDays: scored.filter((d) => (d.uas ?? 0) >= 4).length,
    medMissedDays: logged.filter((d) => d.meds.some((m) => m.status === 'missed')).length,
    angioedemaDays: logged.filter((d) => d.angioedema?.present).length,
    topTriggers: [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, n]) => ({ name, days: n })),
  };
}

// ── Claude 상담 사용량(우댕 폰 상담 화면에서 봄)
export type SkinUsage = {
  today: { count: number; won: number }; month: { count: number; won: number }; total: { count: number; won: number }; limit: number;
};
export async function fetchSkinUsage(): Promise<SkinUsage | null> {
  if (isPractice()) return { today: { count: 3, won: 120 }, month: { count: 41, won: 1650 }, total: { count: 41, won: 1650 }, limit: 60 }; // 연습 모드 예시
  const r = await fetch('/api/skin/usage', { cache: 'no-store' });
  return r.ok ? ((await r.json()) as SkinUsage) : null;
}

// ── 오늘 상담 정리(우댕 2026-10-21) — 정리 받기·불러오기·일지 반영
export async function fetchChatSummary(date: string): Promise<{ summary: ChatSummary | null; msgCount: number } | null> {
  if (isPractice()) return { summary: demo.chatSummary(date), msgCount: date === kstToday() ? 2 : 0 }; // 연습 모드는 오늘만 상담이 있는 걸로
  const r = await fetch(`/api/skin/chat/summary?date=${date}`, { cache: 'no-store' });
  return r.ok ? r.json() : null;
}
export async function makeChatSummary(date: string): Promise<{ summary: ChatSummary; logs: SkinLog[] }> {
  if (isPractice()) { await new Promise((r) => setTimeout(r, 1500)); return demo.makeChatSummary(date); }
  const r = await fetch('/api/skin/chat/summary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date }) });
  if (!r.ok) throw new Error((await r.json().catch(() => null))?.error ?? `summary ${r.status}`);
  return r.json();
}
export async function applyChatSummary(date: string, items: ApplyItem[], memory: MemoryCandidate[]): Promise<boolean> {
  if (isPractice()) { demo.applyChatSummary(date, items, memory); return true; }
  const r = await fetch('/api/skin/chat/summary/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date, items, memory }) });
  return r.ok;
}
