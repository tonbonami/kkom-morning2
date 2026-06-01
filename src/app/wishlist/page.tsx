'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import WishlistV1, { type WishItem } from '@/components/WishlistV1';
import MediaPreviewModal from '@/components/MediaPreviewModal';
import {
  subscribeWishlist,
  addWish,
  toggleWishDone,
  deleteWish,
  fetchOgPreview,
  type WishItemView,
} from '@/lib/wishlist';
import { addAgain } from '@/lib/again';
import { nameFromCode } from '@/lib/letters';

export default function WishlistPage() {
  const router = useRouter();
  const [me, setMe] = useState<'우댕' | '꼼이' | ''>('');
  const [items, setItems] = useState<WishItemView[]>([]);
  const migratedOnce = useRef(false);

  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const [previewTitle, setPreviewTitle] = useState<string | undefined>();
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('kkom-user');
    if (!userStr) { router.push('/login'); return; }
    setMe(nameFromCode(JSON.parse(userStr).로그인코드) as '우댕' | '꼼이');
    const unsub = subscribeWishlist(setItems);
    return () => unsub();
  }, [router]);

  // 옛 done 항목들 1회 자동 마이그레이션 → 또 갈래
  useEffect(() => {
    if (!me || migratedOnce.current || items.length === 0) return;
    const done = items.filter((i) => i.done);
    if (done.length === 0) {
      migratedOnce.current = true;
      return;
    }
    migratedOnce.current = true;
    (async () => {
      for (const it of done) {
        try {
          await addAgain({
            category: it.category,
            title: it.title,
            url: it.url,
            preview: it.preview,
            location: it.location,
            memo: it.memo,
            by: it.by,
            sentBy: it.doneBy || me,
            wishlistCreatedAt: it.createdAt,
          });
          await deleteWish(it.id);
        } catch (e) {
          console.error('마이그레이션 실패:', it.id, e);
        }
      }
      setToast(`📌 다녀온 곳 ${done.length}개를 또 갈래로 옮겼어요`);
      setTimeout(() => setToast(null), 3000);
    })();
  }, [items, me]);

  if (!me) return <div className="min-h-screen bg-[#F7F9F9] max-w-md mx-auto" />;

  // ✓ 누르면 또 갈래로 이동 + 위시리스트에서 삭제 + 토스트
  const handleToggleDone = async (id: string, done: boolean) => {
    if (!done) {
      // 또 갈래에서 위시리스트로 되돌리기 — 일단 지원 안 함 (단순화)
      await toggleWishDone(id, false, me);
      return;
    }
    const item = items.find((i) => i.id === id);
    if (!item) return;
    try {
      await addAgain({
        category: item.category,
        title: item.title,
        url: item.url,
        preview: item.preview,
        location: item.location,
        memo: item.memo,
        by: item.by,
        sentBy: me,
        wishlistCreatedAt: item.createdAt,
      });
      await deleteWish(id);
      setToast('📌 또 갈래로 보냈어요');
      setTimeout(() => setToast(null), 2500);
    } catch (e) {
      console.error('또 갈래로 보내기 실패:', e);
      setToast('이동에 실패했어요. 다시 시도해줘.');
      setTimeout(() => setToast(null), 2500);
    }
  };

  return (
    <>
      <WishlistV1
        me={me}
        items={items.filter((i) => !i.done) as unknown as WishItem[]}
        onBack={() => router.push('/')}
        onAdd={async (draft) => { await addWish({ ...draft, by: me }); }}
        onToggleDone={handleToggleDone}
        onDelete={deleteWish}
        fetchPreview={fetchOgPreview}
        onOpenLink={(item) => {
          setPreviewUrl(item.url);
          setPreviewTitle(item.preview?.title || item.title);
        }}
      />
      <MediaPreviewModal
        open={!!previewUrl}
        url={previewUrl}
        title={previewTitle}
        onClose={() => setPreviewUrl(undefined)}
      />

      {/* 토스트 — 또 갈래 이동 등 액션 피드백 */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#10B981] text-white px-5 py-3 rounded-full font-bold text-[13px] shadow-[0_8px_24px_rgba(16,185,129,0.4)] z-50 flex items-center gap-2"
          >
            <CheckCircle2 size={16} strokeWidth={2.5} fill="white" className="text-[#10B981]" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
