'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AgainListV1, { type AgainItem } from '@/components/AgainListV1';
import MediaPreviewModal from '@/components/MediaPreviewModal';
import { subscribeAgain, deleteAgain, type AgainItemView } from '@/lib/again';
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
