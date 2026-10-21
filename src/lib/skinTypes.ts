// 꼼이 피부 일지 — 데이터 모양 + 정리(sanitize) + 아티팩트(옛 기록) 변환. 서버·이관 스크립트 공용(브라우저 의존 없음).
// 저장 위치(Admin 전용, 규칙상 클라 차단):
//   skin/kkomi/logs/{YYYY-MM-DD}      하루 기록 — 증상 없는 날도 wheals 0 / itch 0 으로 남긴다(비교군)
//   skin/kkomi/history/{onset|supplements}
//   skin/kkomi/survey/intake          초진 설문 {answers:{'1.1':..}, answeredCount, total}
//   skin/kkomi/weekly/{YYYY-Www}      주 1회 UCT 자리(문항은 저작권 확인 후)
// 원칙: '기록 없음'(null)과 '0·안 먹음'을 구분한다. 약 거른 다음날 분석이 여기에 달려 있다.

export const SKIN_OWNER = 'kkomi' as const;
export const skinLogPath = (date: string) => `skin/${SKIN_OWNER}/logs/${date}`;
export const SKIN_SETTINGS_PATH = `skin/${SKIN_OWNER}/meta/settings`; // { partnerAlert: boolean } — 꼼이가 켜고 끔
export const SKIN_CYCLE_PATH = `skin/${SKIN_OWNER}/meta/cycle`;       // { starts: ['YYYY-MM-DD', …] } 생리 시작일
export const SKIN_INTAKE_PATH = `skin/${SKIN_OWNER}/survey/intake`;   // { answers: { '4.1': … } }
export const SKIN_START = '2026-05-01'; // 꼼이 증상 시작(5월) — 「전체」 기간과 상담 맥락의 시작
// 백업(우댕 2026-10-21 "기록이 절대 날아가면 안 된다")
export const SKIN_BACKUP_META = `skin/${SKIN_OWNER}/meta/backup`;      // 매일 백업 결과 { lastAt, lastFile, mailedAt, … }
export const SKIN_PHOTO_TRASH = `skin/${SKIN_OWNER}/meta/photoTrash`;  // 지운 사진 { items: [{ date, id, path, t, removedAt }] } — 파일은 휴지통으로 옮길 뿐 안 지운다
export const SKIN_BACKUP_DIR = `skin/_backup/${SKIN_OWNER}`;           // Storage, 날마다 {날짜}.json 한 개(앱 규칙상 밖에선 못 읽음)
export const SKIN_TRASH_DIR = `skin/_trash/${SKIN_OWNER}`;             // Storage, 지운 사진
export const addDaysIso = (date: string, n: number) =>
  new Date(Date.parse(date + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);
export const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

export type MedStatus = 'taken' | 'missed' | 'late';
export interface SkinMed { name: string; dose?: string | null; time?: string | null; status: MedStatus | null }
export interface SkinFood { t?: string | null; text: string; tags?: string[]; photo?: string | null }
export interface SkinEpisode {
  start?: string | null;     // "HH:MM"
  durMin?: number | null;
  areas: string[];
  over24h?: boolean | null;  // 한 덩어리가 24시간 넘게 — 혈관염 감별 포인트
  bruiseLike?: boolean | null; // 멍처럼 남음 — 혈관염 감별 포인트
}
export interface SkinAngioedema { present: boolean; areas: string[] } // 입술·눈 / 목·혀는 응급 안내
export interface SkinEnv {
  temp: number | null; humidity: number | null; pm10: number | null; pm25: number | null;
  station?: string | null; at: string;
}
export interface SkinPhoto { id: string; path: string; t?: string | null }

export interface SkinLog {
  date: string;                  // YYYY-MM-DD (문서 id)
  wheals: number | null;         // 팽진 0~3
  itch: number | null;           // 가려움 0~3
  uas: number | null;            // wheals + itch (둘 다 있을 때만)
  meds: SkinMed[];               // [] = 약 기록 없음(≠ 안 먹음)
  episodes: SkinEpisode[];
  angioedema: SkinAngioedema | null;
  trace: string | null;          // 흔적 없음 | 색소 남음 | 긁은 상처
  triggers: string[];            // 목록 밖 자유값 허용(예: 공복)
  foods: SkinFood[];
  sleepH: number | null;
  wakeItch: boolean | null;      // 가려워서 깸
  waterMl: number | null;
  stress: number | null;         // 0~10
  cycleDay: number | null;
  period: boolean | null;
  newProducts: string[];
  photos: SkinPhoto[];
  note: string;
  env: SkinEnv | null;           // 서버가 저장 때 붙임(오늘 기록만)
  source: 'app' | 'artifact-import';
  createdAt: string;
  updatedAt: string;
  legacy?: Record<string, unknown>; // 옛 아티팩트 원본 그대로
  alertedAt?: string;               // 힘든 날 우댕 알림을 보낸 시각(하루 한 번)
}

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

// ── 값 정리 ──
const str = (v: unknown, max = 200): string | null => {
  if (v == null) return null;
  const s = String(v).trim();
  return s ? s.slice(0, max) : null;
};
const num = (v: unknown, lo: number, hi: number, int = false): number | null => {
  if (v == null || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  const c = Math.min(hi, Math.max(lo, n));
  return int ? Math.round(c) : Math.round(c * 10) / 10;
};
const bool = (v: unknown): boolean | null => {
  if (v === true || v === 'yes' || v === 'true') return true;
  if (v === false || v === 'no' || v === 'false') return false;
  return null;
};
const time = (v: unknown): string | null => {
  const s = str(v, 5);
  return s && TIME_RE.test(s) ? s : null;
};
const strList = (v: unknown, maxItems = 30, max = 60): string[] =>
  Array.isArray(v) ? v.map((x) => str(x, max)).filter((x): x is string => !!x).slice(0, maxItems) : [];
const medStatus = (v: unknown): MedStatus | null => (v === 'taken' || v === 'missed' || v === 'late' ? v : null);

// 부분 입력(PUT 본문)을 정리해서 저장할 필드만 돌려준다. 모르는 키는 버린다.
export function sanitizeLogPatch(input: Record<string, unknown>): Partial<SkinLog> {
  const out: Partial<SkinLog> = {};
  const has = (k: string) => Object.prototype.hasOwnProperty.call(input, k);
  if (has('wheals')) out.wheals = num(input.wheals, 0, 3, true);
  if (has('itch')) out.itch = num(input.itch, 0, 3, true);
  if (has('meds')) out.meds = (Array.isArray(input.meds) ? input.meds : []).slice(0, 10).map((m: any) => ({
    name: str(m?.name, 60) || '항히스타민', dose: str(m?.dose, 60), time: time(m?.time), status: medStatus(m?.status),
  }));
  if (has('episodes')) out.episodes = (Array.isArray(input.episodes) ? input.episodes : []).slice(0, 10).map((e: any) => ({
    start: time(e?.start), durMin: num(e?.durMin, 0, 60 * 24 * 7, true), areas: strList(e?.areas),
    over24h: bool(e?.over24h), bruiseLike: bool(e?.bruiseLike),
  }));
  if (has('angioedema')) {
    const a: any = input.angioedema;
    out.angioedema = a == null ? null : { present: !!a.present, areas: strList(a.areas, 10) };
  }
  if (has('trace')) out.trace = str(input.trace, 30);
  if (has('triggers')) out.triggers = strList(input.triggers);
  if (has('foods')) out.foods = (Array.isArray(input.foods) ? input.foods : []).slice(0, 30).map((f: any) => ({
    t: time(f?.t), text: str(f?.text, 500) || '', tags: strList(f?.tags, 10), photo: str(f?.photo, 300),
  })).filter((f) => f.text);
  if (has('sleepH')) out.sleepH = num(input.sleepH, 0, 24);
  if (has('wakeItch')) out.wakeItch = bool(input.wakeItch);
  if (has('waterMl')) out.waterMl = num(input.waterMl, 0, 10000, true);
  if (has('stress')) out.stress = num(input.stress, 0, 10, true);
  if (has('cycleDay')) out.cycleDay = num(input.cycleDay, 1, 60, true);
  if (has('period')) out.period = bool(input.period);
  if (has('newProducts')) out.newProducts = strList(input.newProducts, 20, 120);
  if (has('note')) out.note = str(input.note, 5000) || '';
  return out;
}

export const uasOf = (w: number | null | undefined, i: number | null | undefined): number | null =>
  w == null || i == null ? null : w + i;

export function emptyLog(date: string, now: string, source: SkinLog['source'] = 'app'): SkinLog {
  return {
    date, wheals: null, itch: null, uas: null, meds: [], episodes: [], angioedema: null, trace: null,
    triggers: [], foods: [], sleepH: null, wakeItch: null, waterMl: null, stress: null, cycleDay: null,
    period: null, newProducts: [], photos: [], note: '', env: null, source, createdAt: now, updatedAt: now,
  };
}

// ── 옛 아티팩트 기록(문자열 숫자, med yes/no, onset/durMin/areas 한 덩어리) → 새 모양 ──
export function fromLegacyLog(old: Record<string, any>): SkinLog {
  const date = String(old.date);
  const at = str(old.updatedAt, 40) || new Date().toISOString();
  const log = emptyLog(date, at, 'artifact-import');
  const patch = sanitizeLogPatch({
    wheals: old.wheals, itch: old.itch,
    // med 없음 = 기록 없음(meds:[]), "no" = 거름(missed)
    meds: old.med == null ? [] : [{ name: '항히스타민', time: old.medTime, status: old.med === 'yes' ? 'taken' : old.med === 'no' ? 'missed' : null }],
    episodes: old.areas || old.onset || old.durMin ? [{ start: old.onset, durMin: old.durMin, areas: old.areas }] : [],
    trace: old.trace, triggers: old.triggers,
    foods: old.food ? [{ t: null, text: old.food }] : [], // 시각이 문장 안에 섞여 있어 통째로 둔다
    sleepH: old.sleepH, wakeItch: old.wake, waterMl: old.waterMl, stress: old.stress, note: old.note,
  });
  Object.assign(log, patch);
  log.uas = uasOf(log.wheals, log.itch);
  log.photos = Array.isArray(old.photos)
    ? old.photos.map((p: any) => ({ id: String(p?.id ?? ''), path: String(p?.url ?? ''), t: str(p?.t, 40) })).filter((p: SkinPhoto) => p.path)
    : [];
  log.legacy = old;
  return log;
}
