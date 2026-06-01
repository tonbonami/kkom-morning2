'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import MemoryGalleryV3, { type Memory as ViewMemory, type Comment as ViewComment } from '@/components/MemoryGalleryV3';
import {
  subscribeMemories,
  addMemory,
  updateMemory,
  deleteMemory,
  incrementHearts,
  subscribeMemoryComments,
  addMemoryComment,
  deleteMemoryComment,
  compressImage,
  type Memory,
} from '@/lib/memories';
import { nameFromCode } from '@/lib/letters';

export default function MemoriesPage() {
  const router = useRouter();
  const [me, setMe] = useState<'우댕' | '꼼이' | ''>('');
  const [memories, setMemories] = useState<Memory[]>([]);

  useEffect(() => {
    const userStr = localStorage.getItem('kkom-user');
    if (!userStr) { router.push('/login'); return; }
    setMe(nameFromCode(JSON.parse(userStr).로그인코드) as '우댕' | '꼼이');
    const unsub = subscribeMemories(setMemories);
    return () => unsub();
  }, [router]);

  if (!me) return <div className="min-h-screen bg-[#F7F9F9] max-w-md mx-auto" />;

  return (
    <div className="relative">
      {/* 뒤로 가기 — 갤러리 컴포넌트가 자체 헤더를 가지므로 오버레이로 둠 */}
      <button
        onClick={() => router.push('/')}
        aria-label="홈으로"
        className="fixed top-5 left-5 z-30 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.08)] text-slate-600 active:scale-90 transition-all"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <MemoryGalleryV3
        me={me}
        memories={memories as unknown as ViewMemory[]}
        onUpload={async (draft) => { await addMemory(draft); }}
        onUpdate={async (id, patch) => { await updateMemory(id, patch); }}
        onDelete={deleteMemory}
        onHeart={incrementHearts}
        subscribeComments={(memoryId, cb) =>
          subscribeMemoryComments(memoryId, (cs) => cb(cs as unknown as ViewComment[]))
        }
        addComment={(memoryId, text) => addMemoryComment(memoryId, me, text)}
        deleteComment={deleteMemoryComment}
        compressImage={compressImage}
      />
    </div>
  );
}
