'use client';
// 꼼이 피부 일지 — 분석 화면. 겉모습은 SkinInsightsView(제미나이 시안, 값 그대로), 여기선 숫자만 계산해서 넘김.
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import SkinInsightsView from '@/components/skin/SkinInsightsView';
import SkinScreen from '@/components/skin/SkinScreen';
import type { SkinLog } from '@/lib/skinTypes';
import { skinStats } from '@/lib/skinStats';
import { addDays, fetchSkinLogs, kstToday } from '@/lib/skinClient';

// 의사 꿀됑(우댕 A·B OK 2026-10-21): 걸을 땐 B(뒷짐) 제자리 걷기 움짤(Kling 18, 우댕 OK), 분석 중 멈추면 A(턱 괴고 고민).
const DOCTOR_WALK = '/emo/kkuldaeng/doctor/walk.webp';
const DOCTOR_THINK = '/emo/kkuldaeng/doctor/think.webp';

export default function SkinInsightsPage() {
  const router = useRouter();
  const today = useMemo(() => kstToday(), []);
  const [logs, setLogs] = useState<SkinLog[] | null>(null);

  useEffect(() => {
    // 30일 그래프 + 지난주 UAS7 + 첫날의 '다음날' 비교까지 넉넉히 37일
    fetchSkinLogs(addDays(today, -36), today)
      .then((l) => (l === null ? router.replace('/skin') : setLogs(l)))
      .catch(() => setLogs([]));
  }, [today, router]);

  const stats = useMemo(() => skinStats(logs ?? [], today), [logs, today]);
  const thinking = logs === null;

  return (
    <SkinScreen>
    <SkinInsightsView
      doctorSrc={thinking ? DOCTOR_THINK : DOCTOR_WALK}
      thinking={thinking}
      onBack={() => router.push('/skin')}
      onOpenChat={() => router.push('/skin/chat')}
      summary={stats.summary}
      series={stats.series}
      triggers={stats.triggers}
      areas={stats.areas}
    />
    </SkinScreen>
  );
}
