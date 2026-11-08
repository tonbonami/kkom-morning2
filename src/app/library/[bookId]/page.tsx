'use client';

// 허니브러리 — 책 한 권. 표지 · 사람마다 진행 · 읽으며 남긴 기록(+ 한 줄 잇기) · 둘의 감상(+ 상대의 한마디).
// 화면은 Gemini 시안(docs/gemini-honeybrary-B-*·C-*.md) 그대로, 여기는 데이터만 잇는다.
//
// ⚠️ 진행은 **읽는 사람 본인만** 고친다. 언제 바꿨는지(「3일 전 읽음」)는 안 보여 준다 — 감시가 된다.
// ⚠️ 두 사람 별점을 나란히 두지 않는다 — 감상은 위아래로 각각(나 먼저). 평균·합산 없음.
// ⚠️ 감상 사진은 「남기기」를 누를 때 올린다(고르기만 하고 닫으면 Storage 에 고아가 안 남게).
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { HoneyBookScreen } from '@/components/honeybrary/HoneyBookScreen';
import { NoteComposerSheet } from '@/components/honeybrary/NoteComposerSheet';
import { HoneyPhotoViewer } from '@/components/honeybrary/HoneyPhotoViewer';
import { HoneyReviewComposer } from '@/components/honeybrary/HoneyReviewComposer';
import { HoneyReviewCard } from '@/components/honeybrary/HoneyReviewCard';
import { HONEY } from '@/lib/honeybraryTheme';
import {
  honeyMe, subscribeHoneyBook, subscribeHoneyNotes, subscribeHoneyReviews, setMyHoneyReading, addHoneyNote, deleteHoneyNote,
  renameHoneyBook, setHoneyCover, deleteHoneyBook, saveHoneyReview, deleteHoneyReview, setHoneyReply, HONEY_PAGE, PracticeBlocked,
  type HoneyBook, type HoneyNote, type HoneyReview, type StoredPhoto,
} from '@/lib/honeybrary';
import { LIMITS, REVIEW_KEYWORDS, type Person, type PhotoVM, type ReviewDraft } from '@/lib/honeybraryTypes';

const CHAR_SRC: Record<Person, string> = { '우댕': '/emo/kkuldaeng/mood/calm.png', '꼼이': '/emo/saidami/calm.webp' };

/** 감상 쓰기 창의 사진 한 장 — 저장된 것 또는 새로 고른 파일. */
type DraftPhoto = { id: string; stored: StoredPhoto; file?: undefined; preview?: undefined } | { id: string; file: File; preview: string; stored?: undefined };

export default function HoneyBookPage() {
  const router = useRouter();
  const { bookId } = useParams<{ bookId: string }>();
  const [me, setMe] = useState<Person | null>(null);
  const [book, setBook] = useState<HoneyBook | null | undefined>(undefined);
  const [notes, setNotes] = useState<HoneyNote[]>([]);
  const [notesN, setNotesN] = useState(HONEY_PAGE);
  const [notesFull, setNotesFull] = useState(false);
  const [reviews, setReviews] = useState<HoneyReview[]>([]);
  const [failed, setFailed] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [noteOpen, setNoteOpen] = useState(false);
  const [noteBusy, setNoteBusy] = useState(false);
  const [noteErr, setNoteErr] = useState<string | null>(null);

  const [viewer, setViewer] = useState<{ photos: PhotoVM[]; index: number } | null>(null);

  const [revOpen, setRevOpen] = useState(false);
  const [revBusy, setRevBusy] = useState(false);
  const [revErr, setRevErr] = useState<string | null>(null);
  const [revProgress, setRevProgress] = useState<string | null>(null);
  const [revPhotos, setRevPhotos] = useState<DraftPhoto[]>([]);

  useEffect(() => {
    const who = honeyMe();
    if (!who) { router.replace('/'); return; }
    setMe(who);
  }, [router]);

  useEffect(() => {
    if (!bookId) return;
    const onErr = (e: unknown) => { console.error('허니브러리 책 불러오기 실패:', e); setFailed(true); };
    const a = subscribeHoneyBook(bookId, setBook, onErr);
    const c = subscribeHoneyReviews(bookId, setReviews, onErr);
    return () => { a(); c(); };
  }, [bookId]);
  useEffect(() => {
    if (!bookId) return;
    return subscribeHoneyNotes(bookId, notesN, (n, full) => { setNotes(n); setNotesFull(full); },
      (e) => { console.error('기록 불러오기 실패:', e); setFailed(true); });
  }, [bookId, notesN]);

  const flash = useCallback((m: string) => { setToast(m); setTimeout(() => setToast(null), 2200); }, []);
  const fail = useCallback((e: unknown, m: string) => {
    if (e instanceof PracticeBlocked) flash('연습 모드라 저장하지 않았어요');
    else { console.error(m, e); flash(m); }
  }, [flash]);

  const myReview = useMemo(() => reviews.find((r) => r.by === me), [reviews, me]);
  const orderedReviews = useMemo(() => [...reviews].sort((a) => (a.by === me ? -1 : 1)), [reviews, me]);

  // 감상 쓰기 창 — 사진 미리보기 주소는 창을 닫을 때·지울 때 돌려준다.
  const dropPreviews = (list: DraftPhoto[]) => list.forEach((p) => { if (p.preview) URL.revokeObjectURL(p.preview); });
  const openReview = () => {
    dropPreviews(revPhotos);
    setRevPhotos((myReview?.stored ?? []).map((s) => ({ id: s.id, stored: s })));
    setRevErr(null); setRevProgress(null); setRevOpen(true);
  };
  const closeReview = () => { if (revBusy) return; setRevOpen(false); dropPreviews(revPhotos); setRevPhotos([]); };
  useEffect(() => () => dropPreviews(revPhotos), []); // eslint-disable-line react-hooks/exhaustive-deps

  const revPhotoVMs: PhotoVM[] = revPhotos.map((p) => p.stored
    ? { id: p.id, url: p.stored.url, thumbUrl: p.stored.thumbUrl, width: p.stored.w, height: p.stored.h }
    : { id: p.id, url: p.preview!, thumbUrl: p.preview!, pending: revBusy });

  if (!me) return null;
  if (failed) {
    return (
      <div className="min-h-app flex flex-col items-center justify-center gap-3 px-6 text-center" style={{ background: HONEY.ground }}>
        <p className="text-[15px] font-bold" style={{ color: HONEY.ink }}>이 책을 펴지 못했어요</p>
        <button onClick={() => { setFailed(false); router.refresh(); }} className="text-[14px] font-bold min-h-[44px]" style={{ color: HONEY.accent }}>다시 해 볼게요</button>
      </div>
    );
  }
  if (book === undefined) {
    return <div className="min-h-app flex items-center justify-center text-[13px]" style={{ background: HONEY.ground, color: HONEY.faint }}>책을 펴는 중…</div>;
  }
  if (book === null) {
    return (
      <div className="min-h-app flex flex-col items-center justify-center gap-3 px-6 text-center" style={{ background: HONEY.ground }}>
        <p className="text-[15px] font-bold" style={{ color: HONEY.ink }}>이 책은 책장에 없어요</p>
        <button onClick={() => router.replace('/library')} className="text-[14px] font-bold min-h-[44px]" style={{ color: HONEY.accent }}>책장으로</button>
      </div>
    );
  }

  const repliesOf = (id: string) => notes.filter((n) => n.parentNoteId === id);

  return (
    <>
      <HoneyBookScreen
        book={book}
        me={me}
        notes={notes}
        hasOlderNotes={notesFull}
        loadingOlderNotes={false}
        onLoadOlderNotes={() => setNotesN((v) => v + HONEY_PAGE)}
        hasMyReview={!!myReview}
        toast={toast}
        reviewsSlot={orderedReviews.length ? (
          <div className="flex flex-col gap-4">
            {orderedReviews.map((r) => (
              <HoneyReviewCard
                key={r.id}
                review={r}
                me={me}
                charSrc={CHAR_SRC}
                onEdit={r.by === me ? openReview : undefined}
                onOpenPhoto={(i) => setViewer({ photos: r.photos, index: i })}
                onSaveReply={r.by !== me ? async (t) => {
                  try { await setHoneyReply(book.id, r.by, me, t); } catch (e) { fail(e, '한마디를 남기지 못했어요'); throw e; }
                } : undefined}
              />
            ))}
          </div>
        ) : null}
        onBack={() => router.push('/library')}
        onSaveMyReading={async (r) => { try { await setMyHoneyReading(book.id, me, r); } catch (e) { fail(e, '진행을 못 고쳤어요'); } }}
        onJoinReading={async () => { try { await setMyHoneyReading(book.id, me, { status: 'reading' }); } catch (e) { fail(e, '진행을 못 고쳤어요'); } }}
        onAddNote={() => { setNoteErr(null); setNoteOpen(true); }}
        onWriteReview={openReview}
        onReplyNote={async (noteId, text) => {
          try { await addHoneyNote(book.id, { by: me, text, parentNoteId: noteId }); }
          catch (e) { fail(e, '한 줄을 남기지 못했어요'); throw e; }
        }}
        onDeleteNote={async (noteId) => {
          const n = notes.find((x) => x.id === noteId);
          if (!n) return;
          try { await deleteHoneyNote(book.id, n, repliesOf(n.id)); flash('기록을 지웠어요'); } catch (e) { fail(e, '기록을 못 지웠어요'); }
        }}
        onOpenPhoto={(photos, index) => setViewer({ photos, index })}
        onRename={async (t) => { try { await renameHoneyBook(book.id, t); } catch (e) { fail(e, '제목을 못 고쳤어요'); } }}
        onChangeCover={async (f) => { try { await setHoneyCover(book, f); flash('표지를 바꿨어요'); } catch (e) { fail(e, '표지를 바꾸지 못했어요'); } }}
        onDeleteBook={async () => {
          try { await deleteHoneyBook(book.id); router.replace('/library'); } catch (e) { fail(e, '책을 지우지 못했어요. 다시 해 주세요'); }
        }}
      />

      <NoteComposerSheet
        open={noteOpen}
        busy={noteBusy}
        error={noteErr}
        onClose={() => { if (!noteBusy) setNoteOpen(false); }}
        onSubmit={async (v) => {
          if (noteBusy) return;
          setNoteBusy(true); setNoteErr(null);
          try { await addHoneyNote(book.id, { by: me, text: v.text, page: v.page, photo: v.photo }); setNoteOpen(false); }
          catch (e) { setNoteErr(e instanceof PracticeBlocked ? '연습 모드라 남기지 않았어요.' : '남기지 못했어요. 다시 해 주세요.'); if (!(e instanceof PracticeBlocked)) console.error('기록 남기기 실패:', e); }
          finally { setNoteBusy(false); }
        }}
      />

      <HoneyReviewComposer
        open={revOpen}
        mode={myReview ? 'edit' : 'create'}
        bookTitle={book.title}
        initial={myReview ? {
          rating: myReview.rating, keywords: myReview.keywords, headline: myReview.headline ?? '', body: myReview.body ?? '', hasSpoiler: myReview.hasSpoiler,
        } : undefined}
        keywordOptions={REVIEW_KEYWORDS}
        photos={revPhotoVMs}
        onAddPhotos={(files) => {
          const room = LIMITS.photos - revPhotos.length;
          const add = files.slice(0, Math.max(0, room)).map((f, i) => ({ id: `new-${Date.now()}-${i}`, file: f, preview: URL.createObjectURL(f) }));
          setRevPhotos((v) => [...v, ...add]);
        }}
        onRemovePhoto={(id) => setRevPhotos((v) => {
          const gone = v.find((p) => p.id === id);
          if (gone?.preview) URL.revokeObjectURL(gone.preview);
          return v.filter((p) => p.id !== id);
        })}
        busy={revBusy}
        progressText={revProgress}
        error={revErr}
        onClose={closeReview}
        onSubmit={async (d: ReviewDraft) => {
          if (revBusy) return;
          setRevBusy(true); setRevErr(null);
          const add = revPhotos.filter((p) => p.file).map((p) => p.file!);
          if (add.length) setRevProgress(`사진 올리는 중 0/${add.length}`);
          try {
            await saveHoneyReview(book.id, me, d,
              { keep: revPhotos.filter((p) => p.stored).map((p) => p.stored!), add, prev: myReview?.stored ?? [] },
              { isNew: !myReview, onProgress: (k) => setRevProgress(`사진 올리는 중 ${k}/${add.length}`) });
            setRevOpen(false); dropPreviews(revPhotos); setRevPhotos([]);
            flash(myReview ? '감상을 고쳤어요' : '감상을 남겼어요');
          } catch (e) {
            setRevErr(e instanceof PracticeBlocked ? '연습 모드라 남기지 않았어요.' : '감상을 남기지 못했어요. 다시 해 주세요.');
            if (!(e instanceof PracticeBlocked)) console.error('감상 남기기 실패:', e);
          } finally { setRevBusy(false); setRevProgress(null); }
        }}
        onDelete={myReview ? async () => {
          setRevBusy(true);
          try { await deleteHoneyReview(book.id, myReview); setRevOpen(false); dropPreviews(revPhotos); setRevPhotos([]); flash('감상을 지웠어요'); }
          catch (e) { fail(e, '감상을 못 지웠어요'); }
          finally { setRevBusy(false); }
        } : undefined}
      />

      <HoneyPhotoViewer
        open={!!viewer}
        photos={viewer?.photos ?? []}
        initialIndex={viewer?.index ?? 0}
        onClose={() => setViewer(null)}
      />
    </>
  );
}
