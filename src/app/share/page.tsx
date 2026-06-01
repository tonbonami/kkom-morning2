'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ShareListV1, { type ShareItem } from '@/components/ShareListV1';
import MediaPreviewModal from '@/components/MediaPreviewModal';
import {
  subscribeShareList,
  addShare,
  markShareSeen,
  deleteShare,
  type ShareItemView,
} from '@/lib/share';
import { fetchOgPreview } from '@/lib/wishlist';
import { nameFromCode } from '@/lib/letters';

export default function SharePage() {
  const router = useRouter();
  const [me, setMe] = useState<'우댕' | '꼼이' | ''>('');
  const [items, setItems] = useState<ShareItemView[]>([]);

  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const [previewTitle, setPreviewTitle] = useState<string | undefined>();

  useEffect(() => {
    const userStr = localStorage.getItem('kkom-user');
    if (!userStr) { router.push('/login'); return; }
    setMe(nameFromCode(JSON.parse(userStr).로그인코드) as '우댕' | '꼼이');
    const unsub = subscribeShareList(setItems);
    return () => unsub();
  }, [router]);

  if (!me) return <div className="min-h-screen bg-[#F7F9F9] max-w-md mx-auto" />;

  return (
    <>
      <ShareListV1
        me={me}
        items={items as unknown as ShareItem[]}
        onBack={() => router.push('/')}
        onAdd={async (draft) => { await addShare({ ...draft, by: me }); }}
        onOpen={(item) => {
          // 본 표시 + 미리보기 모달
          if (!item.seenBy.includes(me)) markShareSeen(item.id, me);
          setPreviewUrl(item.url);
          setPreviewTitle(item.preview?.title || item.url);
        }}
        onDelete={deleteShare}
        fetchPreview={fetchOgPreview}
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
