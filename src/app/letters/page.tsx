'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import LetterInboxV2 from '@/components/LetterInboxV2';
import {
  subscribeRecentLetters,
  toInboxLetter,
  nameFromCode,
  type Letter as FsLetter,
} from '@/lib/letters';

const PAGE_STEP = 20;

export default function LettersPage() {
  const router = useRouter();
  const [me, setMe] = useState<'우댕' | '꼼이' | ''>('');
  const [raw, setRaw] = useState<FsLetter[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [pageSize, setPageSize] = useState(PAGE_STEP);
  const [loading, setLoading] = useState(true);

  // 로그인된 '나' 결정
  useEffect(() => {
    const userStr = localStorage.getItem('kkom-user');
    if (!userStr) {
      router.push('/login');
      return;
    }
    const name = nameFromCode(JSON.parse(userStr).로그인코드);
    setMe(name as '우댕' | '꼼이');
  }, [router]);

  // pageSize 바뀔 때마다 재구독 — Firestore에서 최신 N+1개만 가져옴
  useEffect(() => {
    if (!me) return;
    setLoading(true);
    const unsub = subscribeRecentLetters(pageSize, (docs, more) => {
      setRaw(docs);
      setHasMore(more);
      setLoading(false);
    });
    return () => unsub();
  }, [me, pageSize]);

  // Firestore → V2 컴포넌트가 기대하는 형태로 변환
  const letters = useMemo(() => raw.map(toInboxLetter), [raw]);

  if (!me) return <div className="min-h-screen bg-[#F7F9F9] max-w-md mx-auto" />;

  return (
    <LetterInboxV2
      me={me}
      letters={letters}
      hasMore={hasMore}
      loading={loading && raw.length === 0}
      onLoadMore={() => setPageSize((p) => p + PAGE_STEP)}
      onWriteLetter={() => router.push('/letter/new')}
      onBack={() => router.push('/')}
    />
  );
}
