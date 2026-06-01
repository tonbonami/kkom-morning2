'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { nameFromCode } from '@/lib/letters';

export default function WishlistPage() {
  const router = useRouter();
  const [me, setMe] = useState<'우댕' | '꼼이' | ''>('');
  const [items, setItems] = useState<WishItemView[]>([]);

  // 인앱 미디어 미리보기 (YouTube / Instagram / 그 외)
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const [previewTitle, setPreviewTitle] = useState<string | undefined>();

  useEffect(() => {
    const userStr = localStorage.getItem('kkom-user');
    if (!userStr) { router.push('/login'); return; }
    setMe(nameFromCode(JSON.parse(userStr).로그인코드) as '우댕' | '꼼이');
    const unsub = subscribeWishlist(setItems);
    return () => unsub();
  }, [router]);

  if (!me) return <div className="min-h-screen bg-[#F7F9F9] max-w-md mx-auto" />;

  return (
    <>
      <WishlistV1
        me={me}
        items={items as unknown as WishItem[]}
        onBack={() => router.push('/')}
        onAdd={async (draft) => { await addWish({ ...draft, by: me }); }}
        onToggleDone={(id, done) => toggleWishDone(id, done, me)}
        onDelete={deleteWish}
        onAddPhoto={() => router.push('/memories')}
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
    </>
  );
}
