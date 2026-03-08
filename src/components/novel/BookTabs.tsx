'use client';

import { cn } from '@/lib/utils';
import { BookOpen, Library } from 'lucide-react';

type TabType = 'active' | 'bookshelf';

interface BookTabsProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  activeCount: number;
  completedCount: number;
}

export default function BookTabs({
  currentTab,
  onTabChange,
  activeCount,
  completedCount,
}: BookTabsProps) {
  return (
    <div className="flex gap-2 p-1.5 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/40">
      <button
        onClick={() => onTabChange('active')}
        className={cn(
          'flex-1 py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2',
          currentTab === 'active'
            ? 'bg-white text-amber-600 shadow-lg'
            : 'text-slate-400 hover:text-slate-600'
        )}
      >
        <BookOpen size={14} />
        진행 중
        {activeCount > 0 && (
          <span className="ml-1 px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded-full text-[9px] font-black">
            {activeCount}
          </span>
        )}
      </button>
      <button
        onClick={() => onTabChange('bookshelf')}
        className={cn(
          'flex-1 py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2',
          currentTab === 'bookshelf'
            ? 'bg-white text-purple-600 shadow-lg'
            : 'text-slate-400 hover:text-slate-600'
        )}
      >
        <Library size={14} />
        서가
        {completedCount > 0 && (
          <span className="ml-1 px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded-full text-[9px] font-black">
            {completedCount}
          </span>
        )}
      </button>
    </div>
  );
}
