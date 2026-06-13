'use client';

// 우리의 시집 — 시 한 편 = 사진(선택) + 텍스트(선택, 둘 중 최소 1개) + 제목 + 작성자
// 디자인은 임시 — 칭찬 다이어리/레시피 톤 따라감. Gemini 리뷰 후 다듬을 예정.

import type { ChangeEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Camera, Loader2, MessageCircle, X, BookText, Trash2 } from 'lucide-react';
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

const COLLECTION = 'poems';

export default function PoemsPage() {
  const router = useRouter();
  const [me, setMe] = useState<'우댕' | '꼼이' | ''>('');
  const [items, setItems] = useState<PoemItemView[]>([]);

  // 추가 시트
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [draftPhoto, setDraftPhoto] = useState<File | null>(null);

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
    setIsAdding(true);
  };

  const handleSubmit = async () => {
    if (!draftTitle.trim()) { feedback('제목은 적어줘', 'error'); return; }
    if (!draftBody.trim() && !draftPhoto) { feedback('사진이나 글 둘 중 하나는 있어야 해', 'error'); return; }
    setIsSubmitting(true);
    try {
      await addPoem({
        title: draftTitle,
        body: draftBody || undefined,
        photoFile: draftPhoto,
        by: me,
      });
      feedback('📜 시 한 편 올렸어');
      setIsAdding(false);
    } catch (e) {
      console.error(e);
      feedback('올리기 실패. 다시 해보자', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#FFFCF5] notebook-bg text-slate-800">
      <main className="max-w-md mx-auto px-5 pt-6 pb-32">
        <header className="flex items-center justify-between mb-5">
          <button
            onClick={() => router.push('/')}
            className="h-10 w-10 rounded-2xl bg-white shadow-sm border border-white/70 flex items-center justify-center text-slate-500 active:scale-95"
            aria-label="홈으로"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="text-center">
            <p className="text-[11px] font-black tracking-[0.18em] uppercase text-purple-500">Our Poems</p>
            <h1 className="text-xl font-black tracking-tight">우리의 시집</h1>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <BookText size={18} />
          </div>
        </header>

        <button
          onClick={openSheet}
          className="w-full mb-5 h-14 rounded-2xl bg-purple-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(168,85,247,0.22)] active:scale-[0.98] transition"
        >
          <Plus size={18} /> 새 시 올리기
        </button>

        <section className="space-y-5">
          {items.length === 0 ? (
            <div className="rounded-2xl bg-white p-10 text-center text-sm font-bold text-slate-400 border border-slate-100 shadow-[2px_3px_0px_rgba(0,0,0,0.04)]">
              아직 올린 시가 없어요 📜<br/>첫 시를 적어볼까?
            </div>
          ) : (
            items.map((item, idx) => {
              const now = Date.now();
              const DAY_MS = 24*60*60*1000;
              const isNew = item.by !== me && (now - item.createdAt.getTime() < DAY_MS);
              const tilt = idx % 3 === 0 ? '-rotate-[0.5deg]' : idx % 3 === 1 ? 'rotate-[0.5deg]' : '';
              return (
                <article key={item.id} className={`relative bg-white rounded-2xl p-5 shadow-[2px_3px_0px_rgba(0,0,0,0.06)] border border-slate-100 ${tilt}`}>
                  {isNew && (
                    <span className="absolute -top-2 -right-1 bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md rotate-[8deg] shadow-md z-20 ring-2 ring-white">
                      ✨ NEW
                    </span>
                  )}

                  {/* 사진 (있으면) */}
                  {item.photoUrl && (
                    <button
                      type="button"
                      onClick={() => { setGalleryPhoto(item.photoUrl!); setGalleryTitle(item.title); }}
                      className="block w-full mb-3 relative rounded-xl overflow-hidden bg-slate-100 active:scale-[0.99] transition"
                    >
                      <img src={item.photoUrl} alt={item.title} className="w-full max-h-[420px] object-contain bg-slate-50" />
                    </button>
                  )}

                  <h3 className="text-[18px] font-black text-slate-800 mb-1 leading-tight">{item.title}</h3>
                  <p className="text-[11px] font-bold text-slate-400 mb-3">
                    {item.by} · {item.createdAt.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                  </p>

                  {item.body && (
                    <p className="font-handwriting text-[19px] text-slate-700 leading-relaxed whitespace-pre-wrap mb-3">
                      {item.body}
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
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

      {/* 추가 시트 */}
      <AnimatePresence>
        {isAdding && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && setIsAdding(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 max-w-md mx-auto"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md bg-white rounded-t-[28px] p-6 pb-safe-bottom max-h-[90dvh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-black">새 시 올리기</h2>
                <button onClick={() => setIsAdding(false)} className="text-slate-400 active:scale-90"><X size={20} /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-bold text-slate-500 mb-1.5 ml-1">제목 (필수)</label>
                  <input
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    placeholder="예: 첫눈"
                    className="w-full bg-[#F7F9F9] rounded-[20px] px-5 py-4 outline-none focus:ring-2 focus:ring-purple-200"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-500 mb-1.5 ml-1">사진 (선택)</label>
                  {draftPhoto ? (
                    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-100 shadow-sm">
                      <img src={URL.createObjectURL(draftPhoto)} alt="" className="w-full max-h-[260px] object-contain bg-slate-50" />
                      <button
                        type="button"
                        onClick={() => setDraftPhoto(null)}
                        className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/70 text-white flex items-center justify-center"
                        aria-label="사진 빼기"
                      ><X size={14} /></button>
                    </div>
                  ) : (
                    <label className="w-full h-28 rounded-2xl bg-[#F7F9F9] border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-500 cursor-pointer active:scale-[0.99]">
                      <Camera size={22} />
                      <span className="text-[12px] font-bold mt-1">사진으로 시 찍어 올리기</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          const f = e.target.files?.[0];
                          if (f && f.type.startsWith('image/')) setDraftPhoto(f);
                          e.currentTarget.value = '';
                        }}
                      />
                    </label>
                  )}
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-500 mb-1.5 ml-1">시 본문 (선택, 타이핑)</label>
                  <textarea
                    value={draftBody}
                    onChange={(e) => setDraftBody(e.target.value)}
                    placeholder="사진만 올려도 되고, 타이핑한 시를 같이 적어도 돼"
                    className="font-handwriting w-full bg-[#F7F9F9] rounded-[20px] px-5 py-4 min-h-[180px] resize-none text-[19px] leading-relaxed outline-none focus:ring-2 focus:ring-purple-200"
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5 ml-1">
                    Tip: 사진 + 본문 둘 다 채우면 시 카드가 더 풍부해요
                  </p>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full mt-7 h-14 rounded-2xl bg-purple-500 text-white font-black text-sm flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 transition"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : '시 올리기'}
              </button>
            </motion.div>
          </>
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
