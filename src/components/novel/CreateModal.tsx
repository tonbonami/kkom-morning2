'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { CoverImage } from '@/types';
import { createNovel } from '@/lib/novelApi';
import { cn } from '@/lib/utils';
import { X, Sparkles } from 'lucide-react';

interface CreateModalProps {
  coverLibrary: CoverImage[];
  onClose: () => void;
  onCreated: () => Promise<void>;
}

const DEFAULT_COLORS = [
  { color: '#FFF5E1', label: '크림' },
  { color: '#E3F2FD', label: '하늘' },
  { color: '#F3E5F5', label: '라벤더' },
  { color: '#E8F5E9', label: '민트' },
  { color: '#FFF3E0', label: '살구' },
  { color: '#FCE4EC', label: '로즈' },
  { color: '#F5F5F5', label: '실버' },
  { color: '#FFFDE7', label: '레몬' },
];

export default function CreateModal({ coverLibrary, onClose, onCreated }: CreateModalProps) {
  const [title, setTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState('#FFF5E1');
  const [fontStyle, setFontStyle] = useState<'serif' | 'sans-serif'>('serif');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  // coverLibrary에 novel 카테고리가 있으면 표시 (향후 확장용)
  const novelCovers = coverLibrary.filter(function(c) { return c.category === 'novel'; });

  const handleCreate = async () => {
    var trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('제목을 입력해주세요');
      return;
    }
    if (trimmedTitle.length > 30) {
      setError('제목은 30자 이내로 입력해주세요');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      var result = await createNovel(trimmedTitle, selectedColor, fontStyle);
      if (result.success) {
        await onCreated();
      } else {
        setError(result.error || '소설 생성에 실패했습니다');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다');
      console.error('소설 생성 오류:', err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative w-full max-w-md bg-white/90 backdrop-blur-xl rounded-t-3xl sm:rounded-3xl border border-white/60 shadow-2xl overflow-hidden"
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" />
            <h2 className="text-sm font-black text-slate-800">새 소설 시작하기</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          {/* 제목 */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase">
              소설 제목
            </label>
            <input
              type="text"
              value={title}
              onChange={function(e) { setTitle(e.target.value); }}
              placeholder="우리의 이야기..."
              maxLength={30}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder:text-slate-300 outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-100 transition-all"
              autoFocus
            />
            <div className="flex justify-between px-1">
              <span className={cn(
                'text-[9px] font-bold',
                title.length > 30 ? 'text-rose-400' : 'text-slate-300'
              )}>
                {title.length}/30
              </span>
            </div>
          </div>

          {/* 표지 색상 */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase">
              표지 색상
            </label>
            <div className="grid grid-cols-4 gap-3">
              {DEFAULT_COLORS.map(function(item) {
                return (
                  <button
                    key={item.color}
                    onClick={function() { setSelectedColor(item.color); }}
                    className={cn(
                      'aspect-square rounded-2xl border-2 transition-all relative overflow-hidden',
                      'hover:scale-105 active:scale-95',
                      selectedColor === item.color
                        ? 'border-amber-400 shadow-lg ring-2 ring-amber-200'
                        : 'border-white/60 shadow-sm'
                    )}
                    style={{ backgroundColor: item.color }}
                  >
                    {selectedColor === item.color && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-3 h-3 bg-amber-500 rounded-full" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* coverLibrary 표지가 있으면 추가 표시 (향후 이미지 업로드 시 활용) */}
          {novelCovers.length > 0 && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase">
                테마 표지
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {novelCovers.map(function(cover) {
                  return (
                    <div
                      key={cover.fileName}
                      className="flex-shrink-0 px-3 py-1.5 bg-white/50 border border-white/60 rounded-xl text-[10px] text-slate-500 font-bold"
                    >
                      {cover.displayName}
                    </div>
                  );
                })}
              </div>
              <p className="text-[9px] text-slate-300">표지 이미지는 추후 업데이트 예정</p>
            </div>
          )}

          {/* 폰트 */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase">
              글꼴 스타일
            </label>
            <div className="flex gap-3">
              <button
                onClick={function() { setFontStyle('serif'); }}
                className={cn(
                  'flex-1 py-3 rounded-2xl text-sm transition-all border',
                  fontStyle === 'serif'
                    ? 'bg-amber-50 border-amber-200 text-amber-700 font-serif font-bold shadow-sm'
                    : 'bg-white/50 border-white/60 text-slate-400 font-serif'
                )}
              >
                명조체 Aa
              </button>
              <button
                onClick={function() { setFontStyle('sans-serif'); }}
                className={cn(
                  'flex-1 py-3 rounded-2xl text-sm transition-all border',
                  fontStyle === 'sans-serif'
                    ? 'bg-amber-50 border-amber-200 text-amber-700 font-sans font-bold shadow-sm'
                    : 'bg-white/50 border-white/60 text-slate-400 font-sans'
                )}
              >
                고딕체 Aa
              </button>
            </div>
          </div>

          {/* 미리보기 */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase">
              미리보기
            </label>
            <div
              className="aspect-[3/2] rounded-2xl border border-white/60 shadow-inner flex flex-col items-center justify-center p-6 transition-colors"
              style={{ backgroundColor: selectedColor }}
            >
              <div className="text-2xl mb-2">📖</div>
              <p
                className={cn(
                  'text-sm font-bold text-slate-700 text-center',
                  fontStyle === 'serif' ? 'font-serif' : 'font-sans'
                )}
              >
                {title.trim() || '제목 미입력'}
              </p>
              <p className="text-[9px] text-slate-400 mt-1">꼼이 & 테오</p>
            </div>
          </div>

          {error && (
            <p className="text-xs text-rose-500 font-bold text-center">{error}</p>
          )}

          <button
            onClick={handleCreate}
            disabled={isCreating || !title.trim()}
            className={cn(
              'w-full py-4 rounded-2xl text-sm font-black tracking-wider uppercase transition-all',
              title.trim() && !isCreating
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-200/50 active:scale-[0.98]'
                : 'bg-slate-100 text-slate-300 cursor-not-allowed'
            )}
          >
            {isCreating ? '생성 중...' : '이야기 시작하기 ✨'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
