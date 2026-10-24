// 피부 일지 분석 숫자 — 순수 계산(브라우저·서버 공용). 기록이 없는 날은 '모름'으로 두고 0으로 채우지 않는다.
import { sevOf, type SkinLog, type MedStatus } from './skinTypes';

// 하루 점수 = sevOf(가려움·붉어짐 0~10 중 높은 값, 예전 기록은 가려움 0~3을 0~10으로) — 2026-10-24부터 UAS(0~6) 대신.
const sev = (l?: SkinLog | null) => sevOf(l);

const addDays = (date: string, n: number) =>
  new Date(Date.parse(date + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);

export function medOf(log?: SkinLog | null): MedStatus | null {
  const s = (log?.meds ?? []).map((m) => m.status);
  if (s.includes('missed')) return 'missed';
  if (s.includes('late')) return 'late';
  if (s.includes('taken')) return 'taken';
  return null;
}

// 최근 7일 하루 점수 평균(0~10, 소수 한 자리). 3일 미만 적었으면 모름(null).
function avg7Of(byDate: Map<string, SkinLog>, end: string): { avg: number | null; n: number } {
  const vals: number[] = [];
  for (let i = 0; i < 7; i++) {
    const u = sev(byDate.get(addDays(end, -i)));
    if (u != null) vals.push(u);
  }
  if (vals.length < 3) return { avg: null, n: vals.length };
  return { avg: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10, n: vals.length };
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export interface SkinSummary {
  avg7: number | null; avg7Prev: number | null;   // 최근 7일 / 그 전 7일 하루 점수 평균(0~10)
  days7: number;                                  // 최근 7일 중 점수를 적은 날
  daysLogged: number; daysTotal: number;
  medMissedDays: number;
  afterMissedAvg: number | null; afterTakenAvg: number | null;
  afterMissedN: number; afterTakenN: number;   // 평균을 낸 날 수(표본)
}

export function skinStats(logs: SkinLog[], today: string, days = 30) {
  const byDate = new Map(logs.map((l) => [l.date, l]));
  const window = Array.from({ length: days }, (_, i) => addDays(today, i - (days - 1)));

  const series = window.map((date) => ({ date, sev: sev(byDate.get(date)), med: medOf(byDate.get(date)) }));

  // 약 거른/먹은 '다음날' 점수
  const afterMissed: number[] = [], afterTaken: number[] = [];
  for (const date of window) {
    const m = medOf(byDate.get(date));
    const next = sev(byDate.get(addDays(date, 1)));
    if (next == null) continue;
    if (m === 'missed') afterMissed.push(next);
    else if (m === 'taken') afterTaken.push(next);
  }

  // 의심 요인·부위: 그 말이 나온 날 수 + 그날 평균 점수(0~10)
  const trig = new Map<string, number[]>();
  const areaDays = new Map<string, number>();
  for (const date of window) {
    const l = byDate.get(date);
    if (!l) continue;
    for (const t of new Set(l.triggers ?? [])) trig.set(t, [...(trig.get(t) ?? []), sev(l) ?? NaN]);
    const areas = new Set((l.episodes ?? []).flatMap((e) => e.areas ?? []));
    for (const a of areas) areaDays.set(a, (areaDays.get(a) ?? 0) + 1);
  }
  // 생리 주기(우댕 고름): 「생리 중」인 날과 「생리 전 1주」(다음 시작일 1~7일 전)를 의심 요인 표에 같이 놓는다.
  //   시작일 = 생리 중인데 전날은 생리 중이 아닌 날(일지에서 바로 계산).
  const starts = [...byDate.values()].filter((l) => l.period === true && byDate.get(addDays(l.date, -1))?.period !== true).map((l) => l.date);
  for (const date of window) {
    const l = byDate.get(date);
    const v = sev(l);
    if (!l || v == null) continue;
    if (l.period === true) trig.set('생리 중', [...(trig.get('생리 중') ?? []), v]);
    else if (starts.some((s0) => { const d = (Date.parse(s0) - Date.parse(date)) / 86400000; return d >= 1 && d <= 7; })) {
      trig.set('생리 전 1주', [...(trig.get('생리 전 1주') ?? []), v]);
    }
  }

  const PERIOD = new Set(['생리 중', '생리 전 1주']);
  const rows = [...trig.entries()]
    // 점수 안 적은 날은 평균에서 뺀다. 점수 적은 날이 하나도 없으면 줄을 안 보여 줌(빈 점수를 0으로 세서 「술 · 평균 0.0」 — Aside 3차)
    .map(([name, us]) => ({ name, days: us.length, avg: avg(us.filter((u) => !Number.isNaN(u))) }))
    .filter((r): r is { name: string; days: number; avg: number } => r.avg != null)
    .map(({ name, days, avg: a }) => ({ name, days, avgUas: a }))
    .sort((a, b) => b.days - a.days || b.avgUas - a.avgUas);
  // 적어 넣은 의심 요인 상위 6개 + 생리 두 줄은 항상(있으면) 뒤에 붙인다
  const triggers = [...rows.filter((r) => !PERIOD.has(r.name)).slice(0, 6), ...rows.filter((r) => PERIOD.has(r.name))];
  const areas = [...areaDays.entries()].map(([name, d]) => ({ name, days: d })).sort((a, b) => b.days - a.days);

  const summary: SkinSummary = {
    avg7: avg7Of(byDate, today).avg,
    days7: avg7Of(byDate, today).n,
    avg7Prev: avg7Of(byDate, addDays(today, -7)).avg,
    daysLogged: window.filter((d) => sev(byDate.get(d)) != null).length,
    daysTotal: days,
    medMissedDays: window.filter((d) => medOf(byDate.get(d)) === 'missed').length,
    afterMissedAvg: avg(afterMissed),
    afterTakenAvg: avg(afterTaken),
    afterMissedN: afterMissed.length,
    afterTakenN: afterTaken.length,
  };
  return { summary, series, triggers, areas };
}
