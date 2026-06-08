'use client';

// 우리의 레시피 — 사진/설명/유튜브/제목 + 좋아요 + 댓글
// 디자인은 칭찬 다이어리/위시 톤과 일관성 (Dongle 손글씨 X, 깔끔한 카드)
// WishlistV1과 다르게 카테고리 없음, 유튜브 링크 추가.

import type { ChangeEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Camera, Youtube, Trash2, Loader2, MessageCircle, ExternalLink, X, ChefHat } from 'lucide-react';
import {
  subscribeRecipes,
  addRecipe,
  addRecipePhoto,
  deleteRecipe,
  type RecipeItemView,
} from '@/lib/recipes';
import {
  incrementHeartsAt,
  subscribeCommentsAt,
  addCommentAt,
  deleteCommentAt,
  type ReactionComment,
} from '@/lib/reactions';
import CommentSheet from '@/components/CommentSheet';
import MediaPreviewModal from '@/components/MediaPreviewModal';
import PhotoGalleryModal from '@/components/PhotoGalleryModal';
import HeartButton from '@/components/HeartButton';
import { nameFromCode } from '@/lib/letters';

const COLLECTION = 'recipes';

export default function RecipesPage() {
  const router = useRouter();
  const [me, setMe] = useState<'우댕' | '꼼이' | ''>('');
  const [items, setItems] = useState<RecipeItemView[]>([]);

  // 추가 시트
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDesc, setDraftDesc] = useState('');
  const [draftYoutube, setDraftYoutube] = useState('');
  const [draftPhotos, setDraftPhotos] = useState<File[]>([]);

  // 사진 추가 (기존 카드)
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [photoTarget, setPhotoTarget] = useState<RecipeItemView | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  // 사진 갤러리
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const [galleryStart, setGalleryStart] = useState(0);
  const [galleryTitle, setGalleryTitle] = useState<string | undefined>();

  // 유튜브 미리보기
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const [previewTitle, setPreviewTitle] = useState<string | undefined>();

  // 댓글
  const [commentItem, setCommentItem] = useState<RecipeItemView | null>(null);
  const [comments, setComments] = useState<ReactionComment[]>([]);

  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('kkom-user');
    if (!userStr) { router.push('/login'); return; }
    setMe(nameFromCode(JSON.parse(userStr).로그인코드) as '우댕' | '꼼이');
    const unsub = subscribeRecipes(setItems);
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!commentItem) { setComments([]); return; }
    const unsub = subscribeCommentsAt(COLLECTION, commentItem.id, setComments);
    return () => unsub();
  }, [commentItem]);

  if (!me) return <div className="min-h-screen bg-[#FFFCF5] max-w-md mx-auto" />;

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  const openSheet = () => {
    setDraftTitle('');
    setDraftDesc('');
    setDraftYoutube('');
    setDraftPhotos([]);
    setIsAdding(true);
  };

  const handleSubmit = async () => {
    if (!draftTitle.trim()) return;
    setIsSubmitting(true);
    try {
      const id = await addRecipe({
        title: draftTitle,
        description: draftDesc || undefined,
        youtubeUrl: draftYoutube || undefined,
        by: me,
      });
      // 첨부 사진 순차 업로드 (실패해도 doc은 살아있음)
      for (const file of draftPhotos) {
        try { await addRecipePhoto(id, file, me); } catch (e) { console.error('레시피 사진 업로드 실패:', e); }
      }
      setIsAdding(false);
    } catch (e) {
      console.error(e);
      showToast('추가에 실패했어요. 다시 해보자.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPhotoClick = (item: RecipeItemView) => {
    setPhotoTarget(item);
    photoInputRef.current?.click();
  };
  const handlePhotoSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !photoTarget || photoUploading) return;
    if (!file.type.startsWith('image/')) { showToast('이미지 파일만 추가할 수 있어요'); return; }
    setPhotoUploading(true);
    showToast('사진 올리는 중...');
    try {
      await addRecipePhoto(photoTarget.id, file, me);
      showToast('📷 사진을 추가했어요');
    } catch (err) {
      console.error(err);
      showToast('사진 추가 실패. 다시 시도해줘.');
    } finally {
      setPhotoUploading(false);
      setPhotoTarget(null);
    }
  };

  return (
    <>
      <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelected} />

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
              <p className="text-[11px] font-black tracking-[0.18em] uppercase text-orange-500">Our Recipes</p>
              <h1 className="text-xl font-black tracking-tight">우리의 레시피</h1>
            </div>
            <div className="h-10 w-10 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center">
              <ChefHat size={18} />
            </div>
          </header>

          <button
            onClick={openSheet}
            className="w-full mb-5 h-14 rounded-2xl bg-orange-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(249,115,22,0.25)] active:scale-[0.98] transition"
          >
            <Plus size={18} /> 새 레시피 추가
          </button>

          <section className="space-y-5">
            {items.length === 0 ? (
              <div className="rounded-2xl bg-white p-10 text-center text-sm font-bold text-slate-400 border border-slate-100 shadow-[2px_3px_0px_rgba(0,0,0,0.04)]">
                아직 레시피가 없어요 🍳<br/>같이 만들어본 거 첫 한 가지 적어볼까?
              </div>
            ) : (
              items.map((item, idx) => {
                const cover = item.photoUrls?.[0];
                const photoCount = item.photoUrls?.length || 0;
                const now = Date.now();
                const DAY_MS = 24*60*60*1000;
                const isNew = item.by !== me && (now - item.createdAt.getTime() < DAY_MS);
                const tilt = idx % 3 === 0 ? '-rotate-[0.5deg]' : idx % 3 === 1 ? 'rotate-[0.5deg]' : '';
                return (
                  <article key={item.id} className={`relative bg-white rounded-2xl p-4 shadow-[2px_3px_0px_rgba(0,0,0,0.06)] border border-slate-100 ${tilt}`}>
                    {/* NEW 배지 */}
                    {isNew && (
                      <span className="absolute -top-2 -right-1 bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md rotate-[8deg] shadow-md z-20 ring-2 ring-white">
                        ✨ NEW
                      </span>
                    )}

                    {/* 사진 그리드 */}
                    {cover && (
                      <button
                        type="button"
                        onClick={() => {
                          setGalleryPhotos(item.photoUrls!);
                          setGalleryStart(0);
                          setGalleryTitle(item.title);
                        }}
                        className="block w-full mb-3 relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 active:scale-[0.99] transition"
                      >
                        <img src={cover} alt="" className="w-full h-full object-cover" />
                        {photoCount > 1 && (
                          <span className="absolute bottom-2 right-2 rounded-full bg-black/70 text-white text-[11px] font-black px-2 py-0.5">
                            +{photoCount - 1}
                          </span>
                        )}
                      </button>
                    )}

                    {/* 제목 */}
                    <h3 className="text-[17px] font-black text-slate-800 mb-1">{item.title}</h3>

                    {/* 메타: 누가, 언제 */}
                    <p className="text-[11px] font-bold text-slate-400 mb-2">
                      {item.by} · {item.createdAt.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                    </p>

                    {/* 설명 */}
                    {item.description && (
                      <p className="text-[14px] text-slate-600 leading-relaxed whitespace-pre-wrap mb-3">{item.description}</p>
                    )}

                    {/* 유튜브 링크 */}
                    {item.youtubeUrl && (
                      <button
                        onClick={() => { setPreviewUrl(item.youtubeUrl); setPreviewTitle(item.title); }}
                        className="inline-flex items-center gap-1.5 text-[12px] font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-full mb-3 active:scale-95 transition"
                      >
                        <Youtube size={14} fill="currentColor" /> 영상 보기 <ExternalLink size={11} />
                      </button>
                    )}

                    {/* 액션 — 좋아요 / 댓글 / 사진 더하기 / 삭제 */}
                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <HeartButton count={item.hearts} onHeart={() => incrementHeartsAt(COLLECTION, item.id)} />
                        <button
                          onClick={() => setCommentItem(item)}
                          aria-label="댓글"
                          className="inline-flex items-center gap-1 text-slate-500 text-[12px] font-bold active:scale-90"
                        >
                          <MessageCircle size={14} /> {item.commentCount || 0}
                        </button>
                        <button
                          onClick={() => handleAddPhotoClick(item)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md active:scale-95"
                        >
                          <Camera size={11} /> {photoCount > 0 ? '+ 사진' : '사진'}
                        </button>
                      </div>
                      {item.by === me && (
                        <button
                          onClick={() => { if (confirm('이 레시피를 삭제할까요?')) deleteRecipe(item.id); }}
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
      </div>

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
                <h2 className="text-xl font-black">새 레시피</h2>
                <button onClick={() => setIsAdding(false)} className="text-slate-400 active:scale-90"><X size={20} /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-bold text-slate-500 mb-1.5 ml-1">제목 (필수)</label>
                  <input
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    placeholder="예: 꼼이표 김치찌개"
                    className="w-full bg-[#F7F9F9] rounded-[20px] px-5 py-4 text-[15px] font-medium outline-none focus:ring-2 focus:ring-orange-200"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-500 mb-1.5 ml-1">설명 (선택)</label>
                  <textarea
                    value={draftDesc}
                    onChange={(e) => setDraftDesc(e.target.value)}
                    placeholder="재료, 만드는 법, 우리만의 팁..."
                    className="w-full bg-[#F7F9F9] rounded-[20px] px-5 py-4 min-h-[120px] resize-none text-[15px] outline-none focus:ring-2 focus:ring-orange-200"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-500 mb-1.5 ml-1">유튜브 링크 (선택)</label>
                  <input
                    value={draftYoutube}
                    onChange={(e) => setDraftYoutube(e.target.value)}
                    placeholder="https://youtube.com/..."
                    inputMode="url"
                    className="w-full bg-[#F7F9F9] rounded-[20px] px-5 py-4 text-[14px] outline-none focus:ring-2 focus:ring-orange-200"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-500 mb-1.5 ml-1">사진 (선택)</label>
                  <div className="flex flex-wrap gap-2">
                    {draftPhotos.map((file, i) => {
                      const url = URL.createObjectURL(file);
                      return (
                        <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shadow-sm">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setDraftPhotos((prev) => prev.filter((_, j) => j !== i))}
                            className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-black/70 text-white text-xs flex items-center justify-center"
                          >×</button>
                        </div>
                      );
                    })}
                    <label className="w-20 h-20 rounded-xl bg-[#F7F9F9] border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 cursor-pointer active:scale-95">
                      <Camera size={20} />
                      <span className="text-[10px] font-bold mt-1">사진 추가</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
                          if (files.length > 0) setDraftPhotos((prev) => [...prev, ...files]);
                          e.currentTarget.value = '';
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!draftTitle.trim() || isSubmitting}
                className="w-full mt-7 h-14 rounded-2xl bg-orange-500 text-white font-black text-sm flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 transition"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : '추가하기'}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 사진 갤러리 */}
      <PhotoGalleryModal
        open={galleryPhotos.length > 0}
        photos={galleryPhotos}
        startIndex={galleryStart}
        title={galleryTitle}
        onClose={() => setGalleryPhotos([])}
      />

      {/* 유튜브 미리보기 */}
      <MediaPreviewModal
        open={!!previewUrl}
        url={previewUrl}
        title={previewTitle}
        onClose={() => setPreviewUrl(undefined)}
      />

      {/* 댓글 시트 */}
      <CommentSheet
        open={!!commentItem}
        me={me}
        title={commentItem?.title}
        comments={comments}
        onClose={() => setCommentItem(null)}
        onAdd={(text) => addCommentAt(COLLECTION, commentItem!.id, me, text)}
        onDelete={(commentId) => deleteCommentAt(COLLECTION, commentItem!.id, commentId)}
      />

      {/* 토스트 */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-5 py-3 rounded-full font-bold text-[13px] shadow-[0_10px_28px_rgba(15,23,42,0.25)] z-50 max-w-[calc(100%-2rem)]"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
