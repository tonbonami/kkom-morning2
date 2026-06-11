'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LetterInboxV3, { type Comment as ViewComment, type Letter as ViewLetter } from '@/components/LetterInboxV3';
import {
  subscribeRecentLetters,
  toInboxLetter,
  nameFromCode,
  type Letter as FsLetter,
} from '@/lib/letters';
import {
  incrementHeartsAt,
  subscribeCommentsAt,
  addCommentAt,
  deleteCommentAt,
} from '@/lib/reactions';

const PAGE_STEP = 20;
const COLLECTION = 'letters';

export default function LettersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F7F9F9] max-w-md mx-auto" />}>
      <LettersPageInner />
    </Suspense>
  );
}

function LettersPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openParam = searchParams.get('open');
  const [me, setMe] = useState<'우댕' | '꼼이' | ''>('');
  const [raw, setRaw] = useState<FsLetter[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [pageSize, setPageSize] = useState(PAGE_STEP);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem('kkom-user');
    if (!userStr) { router.push('/login'); return; }
    const name = nameFromCode(JSON.parse(userStr).로그인코드);
    setMe(name as '우댕' | '꼼이');
  }, [router]);

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

  const letters = useMemo(() => raw.map(toInboxLetter), [raw]);

  if (!me) return <div className="min-h-screen bg-[#F7F9F9] max-w-md mx-auto" />;

  return (
    <LetterInboxV3
      me={me}
      letters={letters as unknown as ViewLetter[]}
      initialOpenLetterId={openParam}
      hasMore={hasMore}
      loading={loading && raw.length === 0}
      onLoadMore={() => setPageSize((p) => p + PAGE_STEP)}
      onWriteLetter={() => router.push('/letter/new')}
      onBack={() => router.push('/')}
      onHeart={(id) => incrementHeartsAt(COLLECTION, id)}
      subscribeComments={(id, cb) =>
        subscribeCommentsAt(COLLECTION, id, (cs) => cb(cs as unknown as ViewComment[]))
      }
      addComment={(id, text) => addCommentAt(COLLECTION, id, me, text)}
      deleteComment={(id, cid) => deleteCommentAt(COLLECTION, id, cid)}
    />
  );
}
