'use client';

// 우리의 시집 — 시화 표지 그리드 → 탭해서 전체화면 읽기 → 좌우 스와이프로 넘기기.
// 시 한 편 = 시화(선택) + 사진(선택) + 텍스트(선택) + 제목 + 작성자.
// 예전엔 긴 세로 스크롤로 전부 늘어놨는데, 편수가 늘면 사용감이 나빠서 표지/리더 분리.

import type { ChangeEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Camera, Loader2, MessageCircle, X, BookText,
  Trash2, Sparkles, Palette, ChevronLeft, ChevronRight,
} from 'lucide-react';
import {
  subscribePoems,
  addPoem,
  deletePoem,
  setPoemArt,
  removePoemArt,
  readPoemsLastSeen,
  markPoemsSeen,
  isNewPoem,
  type PoemItemView,
} from '@/lib/poems';
import {
  incrementHeartsAt,
  subscribeCommentsAt,
  addCommentAt,
  deleteCommentAt,
  type ReactionComment,
} from '@/lib/reactions';
import CommentSheet from '@/components/CommentSheet';
import PhotoGalleryModal from '@/components/PhotoGalleryModal';
import HeartButton from '@/components/HeartButton';
import { nameFromCode } from '@/lib/letters';
import { feedback } from '@/lib/feedback';
import { useObjectUrl } from '@/lib/useObjectUrl';

const COLLECTION = 'poems';

const fmtDate = (d: Date) =>
  d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Seoul' });

export default function PoemsPage() {
  const router = useRouter();
  const [me, setMe] = useState<'우댕' | '꼼이' | ''>('');
  const [items, setItems] = useState<PoemItemView[]>([]);

  // 이번 방문 시작 시점의 '마지막으로 본 시각' — 이번 화면에선 NEW 배지를 계속 보여주려고 고정해둠
  const [lastSeen, setLastSeen] = useState(0);

  // 읽기(리더) — 열려있는 시의 인덱스
  const [readerIdx, setReaderIdx] = useState<number | null>(null);
  const [dir, setDir] = useState(1); // 슬라이드 방향 (1=다음, -1=이전)

  // 작성 모달 (풀스크린)
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [draftPhoto, setDraftPhoto] = useState<File | null>(null);
  const draftPhotoUrl = useObjectUrl(draftPhoto);
  const [draftArt, setDraftArt] = useState<File | null>(null);
  const draftArtUrl = useObjectUrl(draftArt);
  const [isOcr, setIsOcr] = useState(false);
  const [ocrUsed, setOcrUsed] = useState(false);

  // 이미 올라간 시에 시화 붙이는 중인 id
  const [artUploadingId, setArtUploadingId] = useState<string | null>(null);

  // 갤러리 모달 (시화/사진 확대)
  const [galleryPhoto, setGalleryPhoto] = useState<string | null>(null);
  const [galleryTitle, setGalleryTitle] = useState<string | undefined>();

  // 댓글
  const [commentItem, setCommentItem] = useState<PoemItemView | null>(null);
  const [comments, setComments] = useState<ReactionComment[]>([]);

  useEffect(() => {
    const userStr = localStorage.getItem('kkom-user');
    if (!userStr) { router.push('/login'); return; }
    setMe(nameFromCode(JSON.parse(userStr).로그인코드) as '우댕' | '꼼이');
    // 배지 계산용으로 '이전에 본 시각'을 먼저 확보한 뒤, 지금 봤다고 기록
    setLastSeen(readPoemsLastSeen());
    markPoemsSeen();
    const unsub = subscribePoems(setItems);
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!commentItem) { setComments([]); return; }
    const unsub = subscribeCommentsAt(COLLECTION, commentItem.id, setComments);
    return () => unsub();
  }, [commentItem]);

  // 시가 지워져서 인덱스가 범위를 벗어나면 리더 닫기
  useEffect(() => {
    if (readerIdx !== null && readerIdx >= items.length) setReaderIdx(null);
  }, [items.length, readerIdx]);

  if (!me) return <div className="min-h-screen bg-[#FFFCF5] max-w-md mx-auto" />;

  const openSheet = () => {
    setDraftTitle('');
    setDraftBody('');
    setDraftPhoto(null);
    setDraftArt(null);
    setOcrUsed(false);
    setIsAdding(true);
  };

  // 이미 올라간 시에 시화만 붙이기 (내 시·상대 시 둘 다 가능 — 그림 선물)
  const handleArtPick = async (id: string, e: ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const f = input.files?.[0];
    input.value = '';
    if (!f || !f.type.startsWith('image/')) return;
    setArtUploadingId(id);
    try {
      await setPoemArt(id, f, me);
      feedback('🎨 시화를 걸었어');
    } catch (err) {
      console.error(err);
      feedback('시화 올리기 실패. 다시 해보자', 'error');
    } finally {
      setArtUploadingId(null);
    }
  };

  // 사진을 base64로 변환해서 /api/ocr-poem 호출. 결과를 본문에 채워줌(사용자가 편집 가능).
  const runOcr = async () => {
    if (!draftPhoto || isOcr) return;
    setIsOcr(true);
    try {
      const buf = await draftPhoto.arrayBuffer();
      let binary = '';
      const bytes = new Uint8Array(buf);
      const CHUNK = 0x8000;
      for (let i = 0; i < bytes.length; i += CHUNK) {
        binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
      }
      const base64 = btoa(binary);
      const r = await fetch('/api/ocr-poem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: draftPhoto.type || 'image/jpeg' }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || 'OCR failed');
      const text = (data.text || '').trim();
      if (!text) { feedback('글자를 못 읽었어. 직접 적어줘', 'info'); return; }
      setDraftBody((prev) => prev.trim() ? `${prev.trim()}\n\n${text}` : text);
      setOcrUsed(true);
      feedback('✨ 시를 옮겨왔어 — 다듬어줘');
    } catch (e: any) {
      console.error(e);
      feedback('OCR 실패. 직접 적어줘', 'error');
    } finally {
      setIsOcr(false);
    }
  };

  const handleSubmit = async () => {
    if (!draftTitle.trim()) { feedback('제목은 적어줘', 'error'); return; }
    if (!draftBody.trim() && !draftPhoto) { feedback('사진이나 시 본문 둘 중 하나는 있어야 해', 'error'); return; }
    setIsSubmitting(true);
    try {
      await addPoem({
        title: draftTitle,
        body: draftBody || undefined,
        photoFile: draftPhoto,
        artFile: draftArt,
        by: me,
      });
      markPoemsSeen(); // 내가 방금 올린 건 나한텐 NEW 아님
      feedback('📜 시 한 편 엮었어');
      setIsAdding(false);
    } catch (e) {
      console.error(e);
      feedback('올리기 실패. 다시 해보자', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const goPrev = () => setReaderIdx((i) => (i === null || i <= 0 ? i : (setDir(-1), i - 1)));
  const goNext = () => setReaderIdx((i) => (i === null || i >= items.length - 1 ? i : (setDir(1), i + 1)));

  const reading = readerIdx !== null ? items[readerIdx] : null;

  return (
    <div className="min-h-[100dvh] bg-[#FFFCF5] text-slate-800">
      {/* 책 표지 톤 헤더 */}
      <header className="relative pt-12 pb-7 border-b border-purple-100">
        <div className="absolute top-0 inset-x-0 h-1.5 bg-purple-300" />
        <button
          onClick={() => router.push('/')}
          className="absolute top-5 left-5 h-10 w-10 rounded-2xl bg-white shadow-sm border border-white/70 flex items-center justify-center text-slate-500 active:scale-95"
          aria-label="홈으로"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="px-5 flex flex-col items-center text-center">
          <span className="text-[11px] font-bold text-purple-400 tracking-[0.2em] uppercase mb-1.5">
            Volume. 1
          </span>
          <h1 className="font-handwriting text-[36px] text-purple-900 leading-none mb-2">
            우리의 시집
          </h1>
          <p className="text-[12px] text-slate-400">
            {items.length > 0 ? `시 ${items.length}편 · 표지를 눌러 펼쳐보세요` : '서로를 향해 적어내린 마음들'}
          </p>
        </div>
      </header>

      <main className="max-w-md mx-auto px-5 pt-7 pb-32">
        <button
          onClick={openSheet}
          className="w-full mb-8 h-14 rounded-2xl bg-purple-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(168,85,247,0.22)] active:scale-[0.98] transition"
        >
          <Plus size={18} /> 새 시 엮기
        </button>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-10 px-6 opacity-80">
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-6">
              <BookText className="text-purple-300" size={32} />
            </div>
            <p className="font-handwriting text-[24px] text-purple-800/70 text-center leading-[1.55]">
              아직 쓰이지 않은 백지네요.<br/>
              오늘 우리 마음은<br/>어떤 시인가요?
            </p>
          </div>
        ) : (
          /* 시화 표지 그리드 — 2열 */
          <div className="grid grid-cols-2 gap-x-4 gap-y-7">
            {items.map((item, idx) => {
              const fresh = isNewPoem(item, lastSeen);
              const tilt = idx % 2 === 0 ? 'rotate-1' : '-rotate-1';
              return (
                <button
                  key={item.id}
                  onClick={() => { setDir(1); setReaderIdx(idx); }}
                  className="relative text-left active:scale-[0.97] transition"
                >
                  {fresh && (
                    <span className="absolute -top-2.5 -right-1.5 z-20 bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md rotate-[8deg] shadow-md ring-2 ring-white">
                      ✨ NEW
                    </span>
                  )}
                  {/* 표지 = 시화 (없으면 플레이스홀더) */}
                  <div className={`p-2 bg-white shadow-[1px_3px_10px_rgba(107,33,168,0.10)] ${tilt}`}>
                    {item.artUrl ? (
                      <img
                        src={item.artUrl}
                        alt={`${item.title} 시화`}
                        className="w-full aspect-square object-cover bg-slate-50"
                      />
                    ) : (
                      <div className="w-full aspect-square bg-purple-50/70 flex flex-col items-center justify-center gap-1.5 text-purple-300 border border-dashed border-purple-200">
                        <Palette size={22} />
                        <span className="text-[9px] font-black">시화 없음</span>
                      </div>
                    )}
                  </div>
                  <p className="mt-2.5 text-[13px] font-black text-purple-900 truncate leading-tight">
                    {item.title}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                    {item.by} · {fmtDate(item.createdAt)}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </main>

      {/* ── 읽기(리더) — 전체화면, 좌우 스와이프로 넘김 ── */}
      <AnimatePresence>
        {reading && readerIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#FFFCF5] flex flex-col"
          >
            {/* 상단 바 */}
            <div
              className="flex items-center justify-between px-4 py-3 max-w-md mx-auto w-full shrink-0"
              style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
            >
              <button
                onClick={() => setReaderIdx(null)}
                className="h-9 w-9 rounded-full bg-white border border-purple-100 shadow-sm flex items-center justify-center text-slate-500 active:scale-90"
                aria-label="닫기"
              ><X size={17} /></button>
              <span className="text-[11px] font-black text-purple-400 tabular-nums">
                {readerIdx + 1} / {items.length}
              </span>
              {reading.by === me ? (
                <button
                  onClick={() => { if (confirm('이 시를 지울까요?')) { deletePoem(reading.id); setReaderIdx(null); } }}
                  className="h-9 w-9 rounded-full bg-white border border-purple-100 shadow-sm flex items-center justify-center text-slate-300 active:text-rose-500 active:scale-90"
                  aria-label="삭제"
                ><Trash2 size={15} /></button>
              ) : <span className="w-9" />}
            </div>

            {/* 스와이프 영역 */}
            <PoemReader
              key={reading.id}
              item={reading}
              dir={dir}
              me={me}
              artUploading={artUploadingId === reading.id}
              onArtPick={(e) => handleArtPick(reading.id, e)}
              onArtRemove={() => { if (confirm('시화를 뺄까요?')) removePoemArt(reading.id); }}
              onZoom={(url, title) => { setGalleryPhoto(url); setGalleryTitle(title); }}
              onPrev={goPrev}
              onNext={goNext}
              hasPrev={readerIdx > 0}
              hasNext={readerIdx < items.length - 1}
            />

            {/* 하단 액션 바 */}
            <div
              className="shrink-0 border-t border-purple-100 bg-[#FFFCF5]/95 backdrop-blur max-w-md mx-auto w-full px-5 py-3 flex items-center justify-between"
              style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
            >
              <div className="flex items-center gap-4">
                <HeartButton count={reading.hearts} onHeart={() => incrementHeartsAt(COLLECTION, reading.id)} />
                <button
                  onClick={() => setCommentItem(reading)}
                  aria-label="댓글"
                  className="inline-flex items-center gap-1 text-slate-500 text-[12px] font-bold active:scale-90"
                >
                  <MessageCircle size={15} /> {reading.commentCount || 0}
                </button>
              </div>
              {/* 이전/다음 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={goPrev}
                  disabled={readerIdx === 0}
                  className="h-9 w-9 rounded-full bg-white border border-purple-100 shadow-sm flex items-center justify-center text-purple-500 active:scale-90 disabled:opacity-30"
                  aria-label="이전 시"
                ><ChevronLeft size={18} /></button>
                <button
                  onClick={goNext}
                  disabled={readerIdx === items.length - 1}
                  className="h-9 w-9 rounded-full bg-white border border-purple-100 shadow-sm flex items-center justify-center text-purple-500 active:scale-90 disabled:opacity-30"
                  aria-label="다음 시"
                ><ChevronRight size={18} /></button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 풀스크린 시 엮기 모달 */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-[#FFFCF5] notebook-bg flex flex-col"
          >
            <div className="flex justify-between items-center px-4 py-3 max-w-md mx-auto w-full" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
              <button
                onClick={() => setIsAdding(false)}
                className="text-slate-400 px-2 text-[13px] font-bold active:scale-95"
              >
                닫기
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-purple-500 text-white font-bold text-[13px] px-5 py-2 rounded-full shadow-sm active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmitting && <Loader2 size={13} className="animate-spin" />}
                시 엮기
              </button>
            </div>

            <div className="flex-1 max-w-md mx-auto w-full px-6 py-6 flex flex-col overflow-y-auto">
              {/* 시화 첨부 (선택) — 표지가 됨 */}
              {draftArt ? (
                <div className="mb-5 mx-auto relative w-36">
                  <div className="p-2 bg-white shadow-md">
                    {draftArtUrl && <img src={draftArtUrl} alt="" className="w-full aspect-square object-cover" />}
                  </div>
                  <button
                    type="button"
                    onClick={() => setDraftArt(null)}
                    className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-lg"
                    aria-label="시화 빼기"
                  ><X size={15} /></button>
                  <p className="text-center text-[10px] font-black text-purple-400 mt-2">시화 (표지)</p>
                </div>
              ) : (
                <label className="mb-5 mx-auto w-28 h-28 rounded-2xl bg-purple-50/60 border-2 border-dashed border-purple-200 flex flex-col items-center justify-center text-purple-400 cursor-pointer active:scale-95 shadow-sm">
                  <Palette size={22} />
                  <span className="text-[10px] font-bold mt-1 leading-tight text-center px-2">시화 첨부<br/>(표지·선택)</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      const f = e.target.files?.[0];
                      if (f && f.type.startsWith('image/')) setDraftArt(f);
                      e.currentTarget.value = '';
                    }}
                  />
                </label>
              )}

              {/* 사진 첨부 (선택) + OCR */}
              {draftPhoto ? (
                <div className="mb-5 flex flex-col items-center gap-3">
                  <div className="relative mx-auto max-w-[240px] p-2.5 bg-white shadow-md rotate-1">
                    {draftPhotoUrl && <img src={draftPhotoUrl} alt="" className="w-full object-contain" />}
                    <button
                      type="button"
                      onClick={() => { setDraftPhoto(null); setOcrUsed(false); }}
                      className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-lg"
                      aria-label="사진 빼기"
                    ><X size={15} /></button>
                  </div>
                  <button
                    type="button"
                    onClick={runOcr}
                    disabled={isOcr}
                    className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-[12px] font-black active:scale-95 disabled:opacity-60 transition"
                  >
                    {isOcr ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                    {isOcr ? '사진에서 글 읽는 중...' : ocrUsed ? '한 번 더 읽기' : '✨ 사진에서 글 읽어와'}
                  </button>
                </div>
              ) : (
                <label className="mb-5 mx-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-purple-100 text-purple-400 text-[11px] font-black cursor-pointer active:scale-95 shadow-sm">
                  <Camera size={14} /> 손글씨 사진 첨부 (선택)
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      const f = e.target.files?.[0];
                      if (f && f.type.startsWith('image/')) { setDraftPhoto(f); setOcrUsed(false); }
                      e.currentTarget.value = '';
                    }}
                  />
                </label>
              )}

              <input
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="제목"
                className="bg-transparent border-none focus:outline-none focus:ring-0 text-center font-handwriting text-[32px] text-purple-900 placeholder:text-purple-200 mb-5 w-full"
              />

              <textarea
                value={draftBody}
                onChange={(e) => setDraftBody(e.target.value)}
                placeholder="여기에 마음을 적어주세요..."
                className="bg-transparent border-none focus:outline-none focus:ring-0 text-center font-handwriting text-[22px] text-slate-700 placeholder:text-slate-300 flex-1 min-h-[200px] resize-none w-full"
                style={{ lineHeight: 1.9 }}
              />

              <p className="text-[11px] text-slate-400 text-center mt-4">
                시화를 넣으면 시집 표지가 돼요
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PhotoGalleryModal
        open={!!galleryPhoto}
        photos={galleryPhoto ? [galleryPhoto] : []}
        startIndex={0}
        title={galleryTitle}
        onClose={() => setGalleryPhoto(null)}
      />

      <CommentSheet
        open={!!commentItem}
        me={me}
        title={commentItem?.title}
        comments={comments}
        onClose={() => setCommentItem(null)}
        onAdd={(text) => addCommentAt(COLLECTION, commentItem!.id, me, text)}
        onDelete={(commentId) => deleteCommentAt(COLLECTION, commentItem!.id, commentId)}
      />
    </div>
  );
}

// ── 리더 본문 — 좌우 스와이프 감지 ──
// framer-motion drag 대신 touch 이벤트로 직접 판정: 세로 스크롤을 절대 안 뺏기 위해
// |dx| > 60 이고 가로 이동이 세로보다 확실히 클 때만 페이지 전환.
function PoemReader({
  item, dir, me, artUploading, onArtPick, onArtRemove, onZoom, onPrev, onNext, hasPrev, hasNext,
}: {
  item: PoemItemView;
  dir: number;
  me: '우댕' | '꼼이';
  artUploading: boolean;
  onArtPick: (e: ChangeEvent<HTMLInputElement>) => void;
  onArtRemove: () => void;
  onZoom: (url: string, title: string) => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}) {
  const start = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    start.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!start.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.current.x;
    const dy = t.clientY - start.current.y;
    start.current = null;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return; // 세로 스크롤 의도면 무시
    if (dx < 0 && hasNext) onNext();
    else if (dx > 0 && hasPrev) onPrev();
  };

  return (
    <div className="flex-1 overflow-hidden relative">
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: dir > 0 ? 50 : -50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: dir > 0 ? -50 : 50 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className="h-full overflow-y-auto max-w-md mx-auto w-full px-6 pb-8"
        >
          {/* 시화 — 정사각형, 시 맨 위 */}
          {item.artUrl ? (
            <div className="relative mb-7 mt-1">
              <button
                type="button"
                onClick={() => onZoom(item.artUrl!, `${item.title} — 시화`)}
                className="block w-full active:scale-[0.99] transition"
              >
                <div className="p-2.5 bg-white shadow-[1px_3px_14px_rgba(107,33,168,0.10)]">
                  <img
                    src={item.artUrl}
                    alt={`${item.title} 시화`}
                    className="w-full aspect-square object-cover bg-slate-50"
                  />
                </div>
              </button>
              <button
                type="button"
                onClick={onArtRemove}
                className="absolute -top-2.5 -right-2.5 h-7 w-7 rounded-full bg-white border border-purple-100 text-slate-400 flex items-center justify-center shadow-sm active:scale-90 active:text-rose-500"
                aria-label="시화 빼기"
              ><X size={13} /></button>
            </div>
          ) : (
            <label className={`mb-7 mt-1 flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/40 text-purple-400 text-[12px] font-black cursor-pointer active:scale-[0.99] transition ${artUploading ? 'opacity-60' : ''}`}>
              {artUploading
                ? <><Loader2 size={14} className="animate-spin" /> 시화 거는 중...</>
                : <><Palette size={14} /> 시화 넣기</>}
              <input type="file" accept="image/*" className="hidden" disabled={artUploading} onChange={onArtPick} />
            </label>
          )}

          {/* 손글씨 사진 (있으면) */}
          {item.photoUrl && (
            <button
              type="button"
              onClick={() => onZoom(item.photoUrl!, item.title)}
              className="block w-full mb-7 active:scale-[0.99] transition"
            >
              <div className="p-2.5 bg-white shadow-[1px_2px_8px_rgba(0,0,0,0.06)] rotate-1">
                <img src={item.photoUrl} alt={item.title} className="w-full max-h-[420px] object-contain bg-slate-50" />
              </div>
            </button>
          )}

          {/* 본문 */}
          <div className="pl-4 border-l-2 border-purple-200/60">
            <h2 className="font-handwriting text-[30px] text-purple-900 mb-3 leading-tight">
              {item.title}
            </h2>
            {item.body && (
              <p
                className="font-handwriting text-[23px] text-slate-700 break-keep whitespace-pre-wrap"
                style={{ lineHeight: 1.85, letterSpacing: '0.005em' }}
              >
                {item.body}
              </p>
            )}
          </div>

          <p className="mt-7 text-right text-[11px] text-slate-400">
            {item.by} 씀 · {fmtDate(item.createdAt)}
          </p>

          {(hasPrev || hasNext) && (
            <p className="mt-6 text-center text-[10px] font-bold text-purple-300">
              ← 옆으로 넘겨서 다음 시 →
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
