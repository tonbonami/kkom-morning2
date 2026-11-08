'use client';

// 허니브러리 시험 화면 — 가짜 책·기록·감상으로 화면만 본다. **데이터를 읽지도 쓰지도 않는다**(누르는 건 전부 빈 동작).
//   /library/test?v=shelf|empty|book|write|home  (편지 /letter/envelope-test 와 같은 목적)
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { HoneybraryShelfScreen } from '@/components/honeybrary/HoneybraryShelfScreen';
import { BookPlacementSheet } from '@/components/honeybrary/BookPlacementSheet';
import { HoneybraryHomeCard } from '@/components/honeybrary/HoneybraryHomeCard';
import { HoneyBookScreen } from '@/components/honeybrary/HoneyBookScreen';
import { NoteComposerSheet } from '@/components/honeybrary/NoteComposerSheet';
import { HoneyReviewComposer } from '@/components/honeybrary/HoneyReviewComposer';
import { HoneyReviewCard } from '@/components/honeybrary/HoneyReviewCard';
import { HoneyPhotoViewer } from '@/components/honeybrary/HoneyPhotoViewer';
import { REVIEW_KEYWORDS, type BookVM, type NoteVM, type Person, type PhotoVM, type ReviewVM } from '@/lib/honeybraryTypes';

const CHAR: Record<Person, string> = { '우댕': '/emo/kkuldaeng/mood/calm.png', '꼼이': '/emo/saidami/calm.webp' };
const P = (id: string, w = 480, h = 640): PhotoVM => ({ id, url: '/emo/kkuldaeng/library/reader.webp', thumbUrl: '/emo/kkuldaeng/library/reader.webp', width: w, height: h });

const BOOKS: BookVM[] = [
  { id: 'b1', title: '소년이 온다', placedBy: '꼼이', readers: { '꼼이': { status: 'reading', current: 182, total: 216 }, '우댕': { status: 'reading', current: 40 } } },
  { id: 'b2', title: '아주 긴 제목의 책이 두 줄로 넘어가면 어떻게 보이는지 확인하는 책', placedBy: '우댕', readers: { '우댕': { status: 'reading' } } },
  { id: 'b3', title: '작별하지 않는다', placedBy: '우댕', readers: { '우댕': { status: 'done' }, '꼼이': { status: 'done' } } },
  { id: 'b4', title: '불편한 편의점', placedBy: '꼼이', readers: { '꼼이': { status: 'shelved' } } },
  { id: 'b5', title: '데미안', placedBy: '우댕', readers: { '우댕': { status: 'shelved' } } },
];
const NOTES: NoteVM[] = [
  { id: 'n1', by: '꼼이', page: 34, text: '밑줄 친 문장을 옮겨 적는 자리(시험용 글).\n여기서 한참 멈췄어.' },
  { id: 'n2', by: '우댕', text: '나도 이 문장에서 멈췄어', parentNoteId: 'n1' },
  { id: 'n3', by: '우댕', page: 88, photo: P('p1', 480, 360) },
  { id: 'n4', by: '꼼이', text: '오늘은 카페에서 읽었다' },
];
const REVIEWS: ReviewVM[] = [
  { id: 'kkomi', by: '꼼이', rating: 5, keywords: ['문장이 예뻐요', '여운이 길어요', '함께 이야기하고 싶어요'], headline: '읽고 나서 한참 창밖만 봤어', body: '처음엔 무거워서 몇 번 덮었는데, 끝까지 읽고 나니 왜 이 책을 다들 이야기하는지 알 것 같아. 동호의 장면에서 오래 멈춰 있었어. 우댕도 다 읽으면 이 장면 이야기 꼭 하자. 문장이 짧은데 한 줄 한 줄이 오래 남아서 천천히 읽게 되더라. 다음엔 작별하지 않는다도 같이 읽어 보자.', photos: [P('r1'), P('r2', 640, 480), P('r3')], hasSpoiler: true, reply: { by: '우댕', text: '나도 그 장면에서 멈췄어. 주말에 이야기하자' } },
  { id: 'udaeng', by: '우댕', rating: 4, keywords: ['생각할 거리가 있어요'], headline: '', body: '천천히 읽는 중에 남겨 둔 감상.', photos: [], hasSpoiler: false },
];

function Test() {
  const v = useSearchParams().get('v') ?? 'shelf';
  const me: Person = (useSearchParams().get('me') as Person) || '우댕';
  const [sheet, setSheet] = useState(v === 'place');
  const [note, setNote] = useState(v === 'note');
  const [write, setWrite] = useState(v === 'write');
  const [viewer, setViewer] = useState<{ photos: PhotoVM[]; index: number } | null>(null);
  const noop = () => {};
  const anoop = async () => {};

  if (v === 'home') {
    return (
      <div className="sd-app min-h-screen p-4 grid grid-cols-2 gap-3 max-w-md mx-auto content-start">
        <div className="col-span-2 min-h-[140px]"><HoneybraryHomeCard book={BOOKS[0]} onOpen={noop} /></div>
        <div className="col-span-2 min-h-[140px]"><HoneybraryHomeCard onOpen={noop} /></div>
      </div>
    );
  }
  if (v === 'shelf' || v === 'empty' || v === 'place') {
    return (
      <>
        <HoneybraryShelfScreen books={v === 'empty' ? [] : BOOKS} loading={false} hasMore={v === 'shelf'} onLoadMore={noop}
          firstHint={v === 'empty'} onCloseHint={noop} onBack={noop} onOpenBook={noop} onAddBook={() => setSheet(true)} />
        <BookPlacementSheet open={sheet} me={me} busy={false} onSubmit={noop} onClose={() => setSheet(false)} />
      </>
    );
  }
  return (
    <>
      <HoneyBookScreen
        book={BOOKS[0]} me={me} notes={NOTES} hasOlderNotes onLoadOlderNotes={noop} hasMyReview={me === '우댕'}
        reviewsSlot={<div className="flex flex-col gap-4">{[...REVIEWS].sort((a) => (a.by === me ? -1 : 1)).map((r) => (
          <HoneyReviewCard key={r.id} review={r} me={me} charSrc={CHAR} onEdit={r.by === me ? () => setWrite(true) : undefined}
            onOpenPhoto={(i) => setViewer({ photos: r.photos, index: i })} onSaveReply={r.by !== me ? anoop : undefined} />
        ))}</div>}
        onBack={noop} onSaveMyReading={noop} onJoinReading={noop} onAddNote={() => setNote(true)} onWriteReview={() => setWrite(true)}
        onReplyNote={anoop} onDeleteNote={noop} onOpenPhoto={(photos, index) => setViewer({ photos, index })}
        onRename={noop} onChangeCover={noop} onDeleteBook={noop}
      />
      <NoteComposerSheet open={note} busy={false} onSubmit={noop} onClose={() => setNote(false)} />
      <HoneyReviewComposer open={write} mode="create" bookTitle={BOOKS[0].title} keywordOptions={REVIEW_KEYWORDS}
        photos={[P('w1'), P('w2')]} onAddPhotos={noop} onRemovePhoto={noop} busy={false} onSubmit={noop} onClose={() => setWrite(false)} />
      <HoneyPhotoViewer open={!!viewer} photos={viewer?.photos ?? []} initialIndex={viewer?.index ?? 0} onClose={() => setViewer(null)} />
    </>
  );
}

export default function HoneybraryTestPage() {
  return <Suspense fallback={null}><Test /></Suspense>;
}
