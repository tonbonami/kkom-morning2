'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AgainListV1, { type AgainItem } from '@/components/AgainListV1';
import MediaPreviewModal from '@/components/MediaPreviewModal';
import { subscribeAgain, deleteAgain, type AgainItemView } from '@/lib/again';
import { addWish } from '@/lib/wishlist';
import { nameFromCode } from '@/lib/letters';

export default function AgainPage() {
  const router = useRouter();
  const [me, setMe] = useState<'우댕' | '꼼이' | ''>('');
  const [items, setItems] = useState<AgainItemView[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const [previewTitle, setPreviewTitle] = useState<string | undefined>();

  useEffect(() => {
    const userStr = localStorage.getItem('kkom-user');
    if (!userStr) { router.push('/login'); return; }
    setMe(nameFromCode(JSON.parse(userStr).로그인코드) as '우댕' | '꼼이');
    const unsub = subscribeAgain(setItems);
    return () => unsub();
  }, [router]);

  if (!me) return <div className="min-h-screen bg-[#F7F9F9] max-w-md mx-auto" />;

  return (
    <>
      <AgainListV1
        me={me}
        items={items as unknown as AgainItem[]}
        onBack={() => router.push('/')}
        onDelete={deleteAgain}
        onAddPhoto={() => router.push('/memories')}
        onOpen={(item) => {
          if (!item.url) return;
          setPreviewUrl(item.url);
          setPreviewTitle(item.preview?.title || item.title);
        }}
        onSendBack={async (item) => {
          // 또갈래 → 위시리스트 복귀: 위시리스트에 다시 추가 + 또갈래에서 삭제
          try {
            await addWish({
              category: item.category,
              title: item.title,
              url: item.url,
              location: item.location,
              memo: item.memo,
              by: item.by,
            });
            await deleteAgain(item.id);
          } catch (e) {
            console.error('위시리스트로 되돌리기 실패:', e);
            alert('되돌리기에 실패했어요. 다시 시도해주세요.');
          }
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
