'use client';

// 허니브러리 — 둘의 책장(사이담 사이브러리 /library 를 옮김). 화면은 Gemini 시안(docs/gemini-honeybrary-A-*.md) 그대로,
// 여기는 데이터만 잇는다. 데이터: src/lib/honeybrary.ts.
// ⚠️ 권수를 세지 않는다 — 「올해 12권」·「우댕 3권 · 꼼이 9권」은 장부다.
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HoneybraryShelfScreen } from '@/components/honeybrary/HoneybraryShelfScreen';
import { BookPlacementSheet } from '@/components/honeybrary/BookPlacementSheet';
import { subscribeHoneyBooks, addHoneyBook, honeyMe, HONEY_PAGE, PracticeBlocked, type HoneyBook } from '@/lib/honeybrary';
import type { Person } from '@/lib/honeybraryTypes';

const HINT_KEY = 'honeybrary-hint-seen';

export default function HoneybraryPage() {
  const router = useRouter();
  const [me, setMe] = useState<Person | null>(null);
  const [books, setBooks] = useState<HoneyBook[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [n, setN] = useState(HONEY_PAGE);
  const [full, setFull] = useState(false);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    const who = honeyMe();
    if (!who) { router.replace('/'); return; }
    setMe(who);
    // 처음 한 번만 — 뜨는 순간 본 것으로 적고, 그 방문 동안은 ✕ 로 닫는다(사이브러리와 같은 방식).
    try { if (!localStorage.getItem(HINT_KEY)) { setHint(true); localStorage.setItem(HINT_KEY, '1'); } } catch { /* 저장 막힘 */ }
  }, [router]);

  useEffect(() => subscribeHoneyBooks(n,
    (b, f) => { setBooks(b); setFull(f); setLoaded(true); },
    (e) => { console.error('허니브러리 불러오기 실패:', e); setLoaded(true); }), [n]);

  if (!me) return null;

  return (
    <>
      <HoneybraryShelfScreen
        books={books}
        loading={!loaded}
        hasMore={full}
        loadingMore={false}
        onLoadMore={() => setN((v) => v + HONEY_PAGE)}
        firstHint={hint}
        onCloseHint={() => setHint(false)}
        onBack={() => router.push('/')}
        onOpenBook={(id) => router.push(`/library/${id}`)}
        onAddBook={() => { setErr(null); setAdding(true); }}
      />
      <BookPlacementSheet
        open={adding}
        me={me}
        busy={busy}
        error={err}
        onClose={() => { if (!busy) setAdding(false); }}
        onSubmit={async (v) => {
          if (busy) return;
          setBusy(true); setErr(null);
          try {
            const id = await addHoneyBook({ ...v, by: me });
            setAdding(false);
            router.push(`/library/${id}`);
          } catch (e) {
            if (e instanceof PracticeBlocked) setErr('연습 모드라 책을 놓지 않았어요.');
            else { console.error('책 놓기 실패:', e); setErr('책을 놓지 못했어요. 잠시 뒤 다시 해 주세요.'); }
          } finally { setBusy(false); }
        }}
      />
    </>
  );
}
