// 피부 일지 분석 숫자 — 순수 계산(브라우저·서버 공용). 기록이 없는 날은 '모름'으로 두고 0으로 채우지 않는다.
import type { SkinLog, MedStatus } from './skinTypes';

const addDays = (date: string, n: number) =>
  new Date(Date.parse(date + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);

export function medOf(log?: SkinLog | null): MedStatus | null {
  const s = (log?.meds ?? []).map((m) => m.status);
  if (s.includes('missed')) return 'missed';
  if (s.includes('late')) return 'late';
  if (s.includes('taken')) return 'taken';
  return null;
}

// UAS7 = 7일 UAS 합(0~42). 7일 중 4일 이상 적었으면 빈 날을 평균으로 채워 7일치로 환산, 3일 이하면 모름(null).
function uas7Of(byDate: Map<string, SkinLog>, end: string): number | null {
  const vals: number[] = [];
  for (let i = 0; i < 7; i++) {
    const u = byDate.get(addDays(end, -i))?.uas;
    if (u != null) vals.push(u);
  }
  if (vals.length < 4) return null;
  const sum = vals.reduce((a, b) => a + b, 0);
  return Math.round((sum * 7) / vals.length);
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export interface SkinSummary {
  uas7: number | null; uas7Prev: number | null;
  daysLogged: number; daysTotal: number;
  medMissedDays: number;
  afterMissedAvg: number | null; afterTakenAvg: number | null;
}

export function skinStats(logs: SkinLog[], today: string, days = 30) {
  const byDate = new Map(logs.map((l) => [l.date, l]));
  const window = Array.from({ length: days }, (_, i) => addDays(today, i - (days - 1)));

  const series = window.map((date) => ({ date, uas: byDate.get(date)?.uas ?? null, med: medOf(byDate.get(date)) }));

  // 약 거른/먹은 '다음날' 점수
  const afterMissed: number[] = [], afterTaken: number[] = [];
  for (const date of window) {
    const m = medOf(byDate.get(date));
    const next = byDate.get(addDays(date, 1))?.uas;
    if (next == null) continue;
    if (m === 'missed') afterMissed.push(next);
    else if (m === 'taken') afterTaken.push(next);
  }

  // 의심 요인·부위: 그 말이 나온 날 수 + 그날 평균 UAS
  const trig = new Map<string, number[]>();
  const areaDays = new Map<string, number>();
  for (const date of window) {
    const l = byDate.get(date);
    if (!l) continue;
    for (const t of new Set(l.triggers ?? [])) trig.set(t, [...(trig.get(t) ?? []), l.uas ?? NaN]);
    const areas = new Set((l.episodes ?? []).flatMap((e) => e.areas ?? []));
    for (const a of areas) areaDays.set(a, (areaDays.get(a) ?? 0) + 1);
  }
  const triggers = [...trig.entries()]
    .map(([name, us]) => ({ name, days: us.length, avgUas: avg(us.filter((u) => !Number.isNaN(u))) ?? 0 }))
    .sort((a, b) => b.days - a.days || b.avgUas - a.avgUas)
    .slice(0, 6);
  const areas = [...areaDays.entries()].map(([name, d]) => ({ name, days: d })).sort((a, b) => b.days - a.days);

  const summary: SkinSummary = {
    uas7: uas7Of(byDate, today),
    uas7Prev: uas7Of(byDate, addDays(today, -7)),
    daysLogged: window.filter((d) => byDate.get(d)?.uas != null).length,
    daysTotal: days,
    medMissedDays: window.filter((d) => medOf(byDate.get(d)) === 'missed').length,
    afterMissedAvg: avg(afterMissed),
    afterTakenAvg: avg(afterTaken),
  };
  return { summary, series, triggers, areas };
}
