'use client';

// 우리의 시집 — Gemini 디자인 리뷰 적용 (한지 톤 + 인화지 프레임 + 인용선 + 풀스크린 시 엮기 모달)
// 시 한 편 = 사진(선택) + 텍스트(선택, 둘 중 최소 1개) + 제목 + 작성자

import type { ChangeEvent } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Camera, Loader2, MessageCircle, X, BookText, Trash2, Sparkles } from 'lucide-react';
import {
  subscribePoems,
  addPoem,
  deletePoem,
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

export default function PoemsPage() {
  const router = useRouter();
  const [me, setMe] = useState<'우댕' | '꼼이' | ''>('');
  const [items, setItems] = useState<PoemItemView[]>([]);

  // 작성 모달 (풀스크린)
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [draftPhoto, setDraftPhoto] = useState<File | null>(null);
  const draftPhotoUrl = useObjectUrl(draftPhoto);
  const [isOcr, setIsOcr] = useState(false);
  const [ocrUsed, setOcrUsed] = useState(false); // 같은 사진에 OCR 여러 번 안 부르도록

  // 갤러리 모달 (시 사진 확대)
  const [galleryPhoto, setGalleryPhoto] = useState<string | null>(null);
  const [galleryTitle, setGalleryTitle] = useState<string | undefined>();

  // 댓글
  const [commentItem, setCommentItem] = useState<PoemItemView | null>(null);
  const [comments, setComments] = useState<ReactionComment[]>([]);

  useEffect(() => {
    const userStr = localStorage.getItem('kkom-user');
    if (!userStr) { router.push('/login'); return; }
    setMe(nameFromCode(JSON.parse(userStr).로그인코드) as '우댕' | '꼼이');
    const unsub = subscribePoems(setItems);
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!commentItem) { setComments([]); return; }
    const unsub = subscribeCommentsAt(COLLECTION, commentItem.id, setComments);
    return () => unsub();
  }, [commentItem]);

  if (!me) return <div className="min-h-screen bg-[#FFFCF5] max-w-md mx-auto" />;

  const openSheet = () => {
    setDraftTitle('');
    setDraftBody('');
    setDraftPhoto(null);
    setOcrUsed(false);
    setIsAdding(true);
  };

  // 사진을 base64로 변환해서 /api/ocr-poem 호출. 결과를 본문에 채워줌(사용자가 편집 가능).
  const runOcr = async () => {
    if (!draftPhoto || isOcr) return;
    setIsOcr(true);
    try {
      const buf = await draftPhoto.arrayBuffer();
      // 큰 파일은 chunk로 변환 (스택 오버플로 회피)
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
      if (!text) {
        feedback('글자를 못 읽었어. 직접 적어줘', 'info');
        return;
      }
      // 본문이 비어있으면 그대로 채움, 이미 글이 있으면 줄바꿈 후 덧붙임
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
        by: me,
      });
      feedback('📜 시 한 편 엮었어');
      setIsAdding(false);
    } catch (e) {
      console.error(e);
      feedback('올리기 실패. 다시 해보자', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#FFFCF5] text-slate-800">
      {/* 책 표지 톤 헤더 (Gemini P1) — 상단 보라 라인 + Volume + 손글씨 타이틀 */}
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
            서로를 향해 적어내린 마음들
          </p>
        </div>
      </header>

      <main className="max-w-md mx-auto px-5 pt-8 pb-32">
        {/* 새 시 쓰기 — 더 차분한 보라 outline 톤 */}
        <button
          onClick={openSheet}
          className="w-full mb-10 h-14 rounded-2xl bg-purple-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(168,85,247,0.22)] active:scale-[0.98] transition"
        >
          <Plus size={18} /> 새 시 엮기
        </button>

        <section className="space-y-12">
          {items.length === 0 ? (
            // Gemini P2: 시적 빈 페이지
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
            items.map((item, idx) => {
              const now = Date.now();
              const DAY_MS = 24*60*60*1000;
              const isNew = item.by !== me && (now - item.createdAt.getTime() < DAY_MS);
              const photoTilt = idx % 2 === 0 ? 'rotate-1' : '-rotate-1';
              return (
                <article
                  key={item.id}
                  className="relative bg-[#FDFBF7] p-6 shadow-[0_4px_24px_rgba(107,33,168,0.04)] border border-purple-900/5"
                >
                  {/* 상단 핀 — 보라 톤 옆 노란 와시 테이프 보색 */}
                  <div className="tape absolute -top-2 left-1/2 -translate-x-1/2 w-16 -rotate-2 z-10 opacity-90" />

                  {/* NEW 배지 */}
                  {isNew && (
                    <span className="absolute -top-2 -right-1 bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md rotate-[8deg] shadow-md z-20 ring-2 ring-white">
                      ✨ NEW
                    </span>
                  )}

                  {/* 사진 (있으면) — 인화지 프레임 + 살짝 회전 */}
                  {item.photoUrl && (
                    <button
                      type="button"
                      onClick={() => { setGalleryPhoto(item.photoUrl!); setGalleryTitle(item.title); }}
                      className={`block w-full mb-7 active:scale-[0.99] transition`}
                    >
                      <div className={`p-2.5 bg-white shadow-[1px_2px_8px_rgba(0,0,0,0.06)] ${photoTilt}`}>
                        <img
                          src={item.photoUrl}
                          alt={item.title}
                          className="w-full max-h-[440px] object-contain bg-slate-50"
                        />
                      </div>
                    </button>
                  )}

                  {/* 본문 — 좌측 보라 인용선 + 여백 + 손글씨 + 넉넉한 줄간격 */}
                  <div className="pl-4 border-l-2 border-purple-200/60">
                    <h2 className="font-handwriting text-[26px] text-purple-900 mb-2 leading-tight">
                      {item.title}
                    </h2>
                    {item.body && (
                      <p
                        className="font-handwriting text-[22px] text-slate-700 break-keep whitespace-pre-wrap"
                        style={{ lineHeight: 1.8, letterSpacing: '0.005em' }}
                      >
                        {item.body}
                      </p>
                    )}
                  </div>

                  {/* 메타 — 우측 하단 작게 */}
                  <p className="mt-6 text-right text-[11px] text-slate-400">
                    {item.by} 씀 · {item.createdAt.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Seoul' })}
                  </p>

                  {/* 액션 */}
                  <div className="mt-4 pt-3 flex items-center justify-between gap-3 border-t border-purple-100/70">
                    <div className="flex items-center gap-3">
                      <HeartButton count={item.hearts} onHeart={() => incrementHeartsAt(COLLECTION, item.id)} />
                      <button
                        onClick={() => setCommentItem(item)}
                        aria-label="댓글"
                        className="inline-flex items-center gap-1 text-slate-500 text-[12px] font-bold active:scale-90"
                      >
                        <MessageCircle size={14} /> {item.commentCount || 0}
                      </button>
                    </div>
                    {item.by === me && (
                      <button
                        onClick={() => { if (confirm('이 시를 지울까요?')) deletePoem(item.id); }}
                        className="text-slate-300 active:text-rose-500 active:scale-90"
                        aria-label="삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </section>
      </main>

      {/* 풀스크린 시 엮기 모달 (Gemini P1: 의식적인 글쓰기) */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#FFFCF5] notebook-bg flex flex-col"
          >
            <div className="flex justify-between items-center px-4 py-3 pt-safe-bottom max-w-md mx-auto w-full" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
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
              {/* 사진 첨부 (선택) + OCR */}
              {draftPhoto ? (
                <div className="mb-6 flex flex-col items-center gap-3">
                  <div className="relative mx-auto max-w-[280px] p-2.5 bg-white shadow-md rotate-1">
                    {draftPhotoUrl && <img src={draftPhotoUrl} alt="" className="w-full object-contain" />}
                    <button
                      type="button"
                      onClick={() => { setDraftPhoto(null); setOcrUsed(false); }}
                      className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-lg"
                      aria-label="사진 빼기"
                    ><X size={15} /></button>
                  </div>
                  {/* OCR 버튼 — 사진에 적힌 시를 본문으로 옮김 (Claude Haiku Vision) */}
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
                <label className="mb-6 mx-auto w-28 h-28 rounded-full bg-purple-50/60 border-2 border-dashed border-purple-200 flex flex-col items-center justify-center text-purple-400 cursor-pointer active:scale-95 shadow-sm">
                  <Camera size={22} />
                  <span className="text-[10px] font-bold mt-1 leading-tight text-center px-2">사진 첨부<br/>(선택)</span>
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

              {/* 제목 — 가운데 정렬, 테두리 없음 */}
              <input
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="제목"
                className="bg-transparent border-none focus:outline-none focus:ring-0 text-center font-handwriting text-[32px] text-purple-900 placeholder:text-purple-200 mb-6 w-full"
              />

              {/* 본문 — 가운데 정렬, 넉넉한 줄간격 */}
              <textarea
                value={draftBody}
                onChange={(e) => setDraftBody(e.target.value)}
                placeholder="여기에 마음을 적어주세요..."
                className="bg-transparent border-none focus:outline-none focus:ring-0 text-center font-handwriting text-[22px] text-slate-700 placeholder:text-slate-300 flex-1 resize-none w-full"
                style={{ lineHeight: 1.9 }}
              />

              <p className="text-[11px] text-slate-400 text-center mt-4">
                사진만 있어도, 글만 있어도 시가 될 수 있어
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
