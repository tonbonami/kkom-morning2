'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ShareListV1, { type ShareItem } from '@/components/ShareListV1';
import MediaPreviewModal from '@/components/MediaPreviewModal';
import CommentSheet from '@/components/CommentSheet';
import {
  subscribeShareList,
  addShare,
  markShareSeen,
  deleteShare,
  type ShareItemView,
} from '@/lib/share';
import { fetchLinkPreview, linkKindOf, linkTitle } from '@/lib/linkPreview';
import {
  incrementHeartsAt,
  subscribeCommentsAt,
  addCommentAt,
  deleteCommentAt,
  type ReactionComment,
} from '@/lib/reactions';
import { nameFromCode } from '@/lib/letters';

const COLLECTION = 'shareList';

export default function SharePage() {
  const router = useRouter();
  const [me, setMe] = useState<'우댕' | '꼼이' | ''>('');
  const [items, setItems] = useState<ShareItemView[]>([]);

  // Media 미리보기 모달
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const [previewTitle, setPreviewTitle] = useState<string | undefined>();

  // 댓글 시트
  const [commentItem, setCommentItem] = useState<ShareItemView | null>(null);
  const [comments, setComments] = useState<ReactionComment[]>([]);

  useEffect(() => {
    const userStr = localStorage.getItem('kkom-user');
    if (!userStr) { router.push('/login'); return; }
    setMe(nameFromCode(JSON.parse(userStr).로그인코드) as '우댕' | '꼼이');
    const unsub = subscribeShareList(setItems);
    return () => unsub();
  }, [router]);

  // 선택된 항목의 댓글 실시간 구독
  useEffect(() => {
    if (!commentItem) { setComments([]); return; }
    const unsub = subscribeCommentsAt(COLLECTION, commentItem.id, setComments);
    return () => unsub();
  }, [commentItem]);

  if (!me) return <div className="min-h-app bg-[#F7F9F9] max-w-md mx-auto" />;

  return (
    <>
      <ShareListV1
        me={me}
        items={items as unknown as ShareItem[]}
        onBack={() => router.push('/')}
        onAdd={async (draft) => { await addShare({ ...draft, by: me }); }}
        onOpen={(item) => {
          if (!item.seenBy.includes(me)) markShareSeen(item.id, me);
          // 유튜브·인스타는 앱 안에서 바로 틀고, 장소·블로그·사이트는 바로 연다(미리보기 창의 「외부에서 열기」를 한 번 더 누르지 않게).
          const k = linkKindOf(item.url, item.preview);
          if (k !== 'youtube' && k !== 'instagram') { window.open(item.url, '_blank', 'noopener'); return; }
          setPreviewUrl(item.url);
          setPreviewTitle(linkTitle(item.url, item.preview));
        }}
        onSeen={(item) => { if (!item.seenBy.includes(me)) markShareSeen(item.id, me); }}
        onDelete={deleteShare}
        fetchPreview={fetchLinkPreview}
        onHeart={(id) => incrementHeartsAt(COLLECTION, id)}
        onOpenComments={(item) => setCommentItem(item as unknown as ShareItemView)}
      />
      <MediaPreviewModal
        open={!!previewUrl}
        url={previewUrl}
        title={previewTitle}
        onClose={() => setPreviewUrl(undefined)}
      />
      <CommentSheet
        open={!!commentItem}
        me={me}
        title={commentItem ? linkTitle(commentItem.url, commentItem.preview) : undefined}
        comments={comments}
        onClose={() => setCommentItem(null)}
        onAdd={(text) => addCommentAt(COLLECTION, commentItem!.id, me, text)}
        onDelete={(commentId) => deleteCommentAt(COLLECTION, commentItem!.id, commentId)}
      />
    </>
  );
}
