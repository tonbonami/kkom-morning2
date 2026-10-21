'use client';
// 꼼이 피부 일지 — 모아보기(하루하루 보고서). 겉모습은 SkinReportView·SkinDayReport(제미나이 시안, 값 그대로), 여기선 범위·데이터만.
// 우댕 2026-10-21: "나중에 한 달 넘게 쌓일 수도 있잖아. 하루하루를 보고서 형태로 모아서 보여 주는 기능"
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import SkinReportView, { type ReportRange } from '@/components/skin/SkinReportView';
import SkinScreen from '@/components/skin/SkinScreen';
import type { SkinLog } from '@/lib/skinTypes';
import {
  SKIN_START, addDays, addMonths, daysFromTo, fetchSkinLogsLong, kstToday, monthDays, monthOf, reportSummary, skinSession, toReportDay,
} from '@/lib/skinClient';

const md = (d: string) => `${Number(d.slice(5, 7))}월 ${Number(d.slice(8, 10))}일`;

function rangeOf(r: ReportRange, today: string, firstLog: string | null): [string, string] {
  const ym = monthOf(today);
  switch (r) {
    case '2w': return [addDays(today, -13), today];
    case 'month': return [`${ym}-01`, today];
    case 'prevMonth': { const p = addMonths(ym, -1); return [`${p}-01`, monthDays(p).slice(-1)[0]]; }
    case '3m': return [addDays(today, -89), today];
    case 'all': return [firstLog ?? SKIN_START, today];
  }
}

export default function SkinReportPage() {
  const router = useRouter();
  const today = useMemo(() => kstToday(), []);
  const [range, setRange] = useState<ReportRange>('2w');
  const [canEdit, setCanEdit] = useState(false);
  const [all, setAll] = useState<Record<string, SkinLog> | null>(null);

  // 처음에 5월부터 다 받아 둔다(하루 2KB 안팎이라 1년치도 가볍다) — 범위 칩은 받아 둔 걸 자르기만
  useEffect(() => {
    skinSession().then((s) => {
      if (!s.authed) { router.replace('/skin'); return; }
      setCanEdit(s.role === 'kkomi');
      return fetchSkinLogsLong(SKIN_START, today).then((list) => {
        if (list === null) { router.replace('/skin'); return; }
        setAll(Object.fromEntries(list.map((l) => [l.date, l])));
      });
    }).catch(() => setAll({}));
  }, [router, today]);

  const firstLog = useMemo(() => (all ? Object.keys(all).sort()[0] ?? null : null), [all]);
  const [rawFrom, to] = rangeOf(range, today, firstLog);
  // 일지 시작 전 날은 빼기 — 분모·목록에 들어가 「기록 3/30일」처럼 안 쓴 것처럼 보였다(Aside 2차)
  const from = firstLog && rawFrom < firstLog ? (firstLog <= to ? firstLog : to) : rawFrom;
  const days = useMemo(
    () => daysFromTo(from, to).reverse().map((d) => toReportDay(d, all?.[d])),
    [from, to, all],
  );
  const summary = useMemo(() => reportSummary(days), [days]);

  return (
    <SkinScreen>
      <SkinReportView
        onBack={() => router.push('/skin')}
        range={range}
        onRange={setRange}
        rangeLabel={`${md(from)} ~ ${md(to)}`}
        days={all ? days : []}
        summary={summary}
        loading={all === null}
        onOpenDay={(d) => router.push(`/skin?date=${d}`)}
        canEdit={canEdit}
      />
    </SkinScreen>
  );
}
