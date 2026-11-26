'use client';

import { enterDemo } from '@/lib/demo';

export default function DemoEntryButton({ className = '' }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => enterDemo('우댕')}
      className={`mx-auto mt-3 block rounded-full px-3 py-1.5 text-xs font-semibold text-[#b45b7b] hover:bg-[#fff0f5] active:scale-[0.98] ${className}`}
    >
      시연 모드로 둘러보기
    </button>
  );
}

