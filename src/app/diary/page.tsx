'use client';

// 다꾸 다이어리 — /diary. 화면·저장은 components/diary/DiaryApp, 여기선 누가 열었는지만 본다.
//   /diary            오늘 내 장 · /diary?d=2026-11-17 그 날짜
//   /diary?view=month 월간 달력(일정) · &date=2026-11-21 그날 시트까지 · &event=일정id (알림·꼼톡 카드가 이렇게 온다 — src/lib/calendarLink.ts)
//   /diary?d=…&who=kkomi  그 날짜 꼼이 장(다이어리 ♥·한마디 알림이 이렇게 온다)
//   ?practice=1       연습 모드(아무것도 저장하지 않음)
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DiaryApp } from '@/components/diary/DiaryApp';
import { honeyMe } from '@/lib/honeybrary';
import type { Person } from '@/lib/diaryTypes';

function Diary() {
  const router = useRouter();
  const sp = useSearchParams();
  const d = sp.get('date') ?? sp.get('d') ?? undefined;
  const [me, setMe] = useState<Person | null>(null);
  useEffect(() => {
    const who = honeyMe();
    if (!who) { router.replace('/'); return; }
    setMe(who);
  }, [router]);
  if (!me) return null;
  const who = sp.get('who');   // 다이어리 ♥·한마디 알림이 「누구 장」인지 실어 온다(udaeng|kkomi)
  const initialOwner: Person | undefined = who === 'udaeng' ? '우댕' : who === 'kkomi' ? '꼼이' : undefined;
  return <DiaryApp me={me} initialDate={d} initialOwner={initialOwner} initialView={sp.get('view') === 'month' ? 'month' : sp.get('view') === 'archive' ? 'archive' : 'day'} openAgenda={sp.get('view') === 'month' && !!sp.get('date')} initialEventId={sp.get('event') ?? undefined} onExit={() => router.push('/')} />;
}

export default function DiaryPage() {
  return <Suspense fallback={null}><Diary /></Suspense>;
}
