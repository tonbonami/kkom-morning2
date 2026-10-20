// 피부 일지 — 브라우저 쪽 도우미. 서버(/api/skin/*)는 PIN 쿠키(httpOnly, path /api/skin)로만 열린다.
import type { SkinLog } from './skinTypes';
import { nameFromCode } from './letters';
import type { SkinDraft, MedStatus } from '@/components/skin/skinUi';

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
  const r = await fetch('/api/skin/session', { cache: 'no-store' });
  return r.ok ? r.json() : { configured: false, authed: false, role: null };
}

// as = 이 폰에 꼼모닝으로 로그인한 사람. 우댕 폰이면 서버가 보기 전용(viewer)으로 연다.
export async function skinLogin(pin: string, as: string): Promise<'ok' | 'bad' | 'locked' | 'error'> {
  const r = await fetch('/api/skin/session', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin, as }),
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
  const r = await fetch(`/api/skin/photo?date=${date}`, { cache: 'no-store' });
  return r.ok ? (await r.json()).photos : [];
}

export async function uploadSkinPhoto(date: string, file: File): Promise<SkinPhotoView> {
  const fd = new FormData();
  fd.append('date', date);
  fd.append('file', await shrinkImage(file), 'photo.jpg');
  const r = await fetch('/api/skin/photo', { method: 'POST', body: fd });
  if (!r.ok) throw new Error(`upload ${r.status}`);
  return (await r.json()).photo;
}

export async function deleteSkinPhoto(date: string, id: string): Promise<void> {
  await fetch(`/api/skin/photo?date=${date}&id=${encodeURIComponent(id)}`, { method: 'DELETE' });
}
