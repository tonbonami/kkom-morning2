'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import MemoryGalleryV2 from '@/components/MemoryGalleryV2';

export default function MemoriesPage() {
  const router = useRouter();
  return (
    <div className="relative">
      {/* 홈으로 돌아가는 작은 뒤로가기 — Gemini 컴포넌트 위에 떠 있게 배치 */}
      <button
        onClick={() => router.push('/')}
        aria-label="홈으로"
        className="fixed top-5 left-5 z-30 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.08)] text-slate-600 active:scale-90 transition-all"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <MemoryGalleryV2 />
    </div>
  );
}
