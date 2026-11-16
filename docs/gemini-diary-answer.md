```tsx
// src/components/diary/DiaryDecor.tsx
'use client';

import React from 'react';

export const DECOR_ASSETS: { id: string; kind: 'tape' | 'stamp'; label: string; ratio: number }[] = [
  // 마스킹테이프 8종 (ratio ~0.22, 반투명 & 양끝 찢김)
  { id: 'tape-honey', kind: 'tape', label: '꿀빛', ratio: 0.22 },
  { id: 'tape-apricot', kind: 'tape', label: '살구', ratio: 0.22 },
  { id: 'tape-sage', kind: 'tape', label: '세이지', ratio: 0.22 },
  { id: 'tape-sky', kind: 'tape', label: '하늘', ratio: 0.22 },
  { id: 'tape-stripe', kind: 'tape', label: '줄무늬', ratio: 0.22 },
  { id: 'tape-grid', kind: 'tape', label: '모눈', ratio: 0.22 },
  { id: 'tape-dots', kind: 'tape', label: '도트', ratio: 0.22 },
  { id: 'tape-kraft', kind: 'tape', label: '크라프트', ratio: 0.22 },
  // 도장 8종 (우리말 도장)
  { id: 'stamp-cheer', kind: 'stamp', label: '오늘도 수고', ratio: 0.6 },
  { id: 'stamp-date', kind: 'stamp', label: '데이트', ratio: 0.6 },
  { id: 'stamp-yummy', kind: 'stamp', label: '맛있었다', ratio: 0.6 },
  { id: 'stamp-miss', kind: 'stamp', label: '보고싶어', ratio: 0.6 },
  { id: 'stamp-love', kind: 'stamp', label: '사랑해', ratio: 0.6 },
  { id: 'stamp-sleep', kind: 'stamp', label: '꿀잠', ratio: 0.6 },
  { id: 'stamp-whitening', kind: 'stamp', label: '화이트닝', ratio: 0.6 },
  { id: 'stamp-special', kind: 'stamp', label: '기념일', ratio: 0.6 },
];

const TAPE_CLIP = 'polygon(0% 4%, 2% 0%, 5% 6%, 8% 1%, 10% 5%, 90% 5%, 93% 0%, 96% 6%, 98% 1%, 100% 4%, 98% 96%, 96% 100%, 93% 94%, 90% 99%, 88% 95%, 10% 95%, 7% 100%, 4% 94%, 2% 98%, 0% 96%)';

export function DiaryDecor({ decorId, className = '' }: { decorId: string; className?: string }): JSX.Element {
  // 테이프
  if (decorId.startsWith('tape-')) {
    let bgStyle: React.CSSProperties = { clipPath: TAPE_CLIP, opacity: 0.88 };

    switch (decorId) {
      case 'tape-honey':
        bgStyle = { ...bgStyle, background: '#F8E2A7' };
        break;
      case 'tape-apricot':
        bgStyle = { ...bgStyle, background: '#FCD7C8' };
        break;
      case 'tape-sage':
        bgStyle = { ...bgStyle, background: '#DCE8D5' };
        break;
      case 'tape-sky':
        bgStyle = { ...bgStyle, background: '#DCE7EE' };
        break;
      case 'tape-stripe':
        bgStyle = {
          ...bgStyle,
          backgroundColor: '#F5ECE3',
          backgroundImage: 'repeating-linear-gradient(45deg, #E6D8CA 0, #E6D8CA 3px, transparent 3px, transparent 8px)',
        };
        break;
      case 'tape-grid':
        bgStyle = {
          ...bgStyle,
          backgroundColor: '#F6EFEA',
          backgroundImage: 'linear-gradient(#E8DCD4 1px, transparent 1px), linear-gradient(90deg, #E8DCD4 1px, transparent 1px)',
          backgroundSize: '10px 10px',
        };
        break;
      case 'tape-dots':
        bgStyle = {
          ...bgStyle,
          backgroundColor: '#F7EDE6',
          backgroundImage: 'radial-gradient(#E4D0C5 1.5px, transparent 1.5px)',
          backgroundSize: '8px 8px',
        };
        break;
      case 'tape-kraft':
      default:
        bgStyle = { ...bgStyle, background: '#E3CBB3' };
        break;
    }

    return (
      <div className={`w-full h-full relative ${className}`}>
        <div className="w-full h-full shadow-sm" style={bgStyle} />
      </div>
    );
  }

  // 도장
  const stampConfig: Record<string, { text: string; color: string; border: string; shape: 'rect' | 'circle' }> = {
    'stamp-cheer': { text: '오늘도 수고', color: '#964842', border: 'border-2 border-[#964842]', shape: 'rect' },
    'stamp-date': { text: '데이트', color: '#B25D4E', border: 'border-2 border-[#B25D4E]', shape: 'rect' },
    'stamp-yummy': { text: '맛있었다', color: '#88583B', border: 'border-2 border-[#88583B]', shape: 'rect' },
    'stamp-miss': { text: '보고싶어', color: '#566675', border: 'border-2 border-[#566675]', shape: 'rect' },
    'stamp-love': { text: '사랑해', color: '#C05451', border: 'border-2 border-[#C05451]', shape: 'circle' },
    'stamp-sleep': { text: '꿀잠', color: '#5F6956', border: 'border-2 border-[#5F6956]', shape: 'rect' },
    'stamp-whitening': { text: '화이트닝', color: '#7E6377', border: 'border-2 border-[#7E6377]', shape: 'rect' },
    'stamp-special': { text: '기념일', color: '#A85250', border: 'border-2 border-[#A85250]', shape: 'circle' },
  };

  const stamp = stampConfig[decorId] || { text: '참잘했어요', color: '#964842', border: 'border-2 border-[#964842]', shape: 'rect' };

  return (
    <div className={`w-full h-full flex items-center justify-center p-1 select-none pointer-events-none ${className}`}>
      <div
        className={`w-full h-full flex items-center justify-center border-dashed ${stamp.border} ${
          stamp.shape === 'circle' ? 'rounded-full aspect-square' : 'rounded-lg'
        }`}
        style={{ color: stamp.color, opacity: 0.88 }}
      >
        <div className="w-full h-full border border-current rounded-[inherit] m-0.5 flex items-center justify-center px-1">
          <span className="font-['Dongle'] text-2xl font-bold leading-none tracking-tight whitespace-nowrap">
            {stamp.text}
          </span>
        </div>
      </div>
    </div>
  );
}
```

```tsx
// src/components/diary/DiaryPaper.tsx
'use client';

import React, { useRef, useState } from 'react';
import { DiaryPageVM, DiaryChipVM, DiaryItemVM } from '@/lib/diaryTypes';
import { DiaryDecor } from './DiaryDecor';

export interface DiaryPaperProps {
  page: DiaryPageVM;
  dateLabel: string;
  chips: DiaryChipVM[];
  editable: boolean;
  selectedItemId: string | null;
  onSelectItem: (id: string | null) => void;
  onMoveItem: (id: string, x: number, y: number) => void;
  onTextChange: (text: string) => void;
  onSwipe?: (dir: 'prev' | 'next') => void;
}

export function DiaryPaper({
  page,
  dateLabel,
  chips,
  editable,
  selectedItemId,
  onSelectItem,
  onMoveItem,
  onTextChange,
  onSwipe,
}: DiaryPaperProps): JSX.Element {
  const paperRef = useRef<HTMLDivElement>(null);
  const dragTargetRef = useRef<{
    id: string;
    el: HTMLElement;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    hasMoved: boolean;
  } | null>(null);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);

  // 물건 포인터 다운: 한 손 조작 드래그 시작
  const handleItemPointerDown = (e: React.PointerEvent<HTMLDivElement>, item: DiaryItemVM) => {
    if (!editable) return;
    e.stopPropagation();

    const targetEl = e.currentTarget;
    dragTargetRef.current = {
      id: item.id,
      el: targetEl,
      startX: e.clientX,
      startY: e.clientY,
      origX: item.x,
      origY: item.y,
      hasMoved: false,
    };

    const handlePointerMove = (moveEvt: PointerEvent) => {
      const state = dragTargetRef.current;
      if (!state || !paperRef.current) return;

      const dx = moveEvt.clientX - state.startX;
      const dy = moveEvt.clientY - state.startY;

      if (!state.hasMoved) {
        if (Math.hypot(dx, dy) > 8) {
          state.hasMoved = true;
          setDraggingId(state.id);
        } else {
          return;
        }
      }

      requestAnimationFrame(() => {
        if (!state.el) return;
        state.el.style.transform = `translate3d(calc(-50% + ${dx}px), calc(-50% + ${dy}px), 0) rotate(${item.rotation}deg)`;
      });
    };

    const handlePointerUp = (upEvt: PointerEvent) => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);

      const state = dragTargetRef.current;
      dragTargetRef.current = null;
      setDraggingId(null);

      if (!state || !paperRef.current) return;

      if (!state.hasMoved) {
        // 8px 미만 이동 = 톡(선택)
        onSelectItem(state.id);
        return;
      }

      const rect = paperRef.current.getBoundingClientRect();
      const dx = upEvt.clientX - state.startX;
      const dy = upEvt.clientY - state.startY;

      const newX = Math.min(1, Math.max(0, state.origX + dx / rect.width));
      const newY = Math.min(1, Math.max(0, state.origY + dy / rect.height));

      // 임시 transform 초기화 후 부모 콜백 1회
      state.el.style.transform = `translate(-50%, -50%) rotate(${item.rotation}deg)`;
      onSelectItem(state.id);
      onMoveItem(state.id, newX, newY);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  // 빈 배경 제스처(스와이프 및 선택 해제)
  const handlePaperPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    swipeStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePaperPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!swipeStartRef.current) return;
    const dx = e.clientX - swipeStartRef.current.x;
    const dy = e.clientY - swipeStartRef.current.y;
    swipeStartRef.current = null;

    if (Math.abs(dx) > 48 && Math.abs(dy) < 40) {
      if (dx > 0) onSwipe?.('prev');
      else onSwipe?.('next');
    } else if (Math.hypot(dx, dy) <= 8) {
      onSelectItem(null);
    }
  };

  // 종이 테마 스타일
  const getPaperBgStyle = (): React.CSSProperties => {
    switch (page.theme) {
      case 'cream':
        return { backgroundColor: '#FAF6EE' };
      case 'plain':
        return { backgroundColor: '#FFFFFF' };
      case 'lined':
        return {
          backgroundColor: '#FAF8F5',
          backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, var(--sd-line, #E4D2D2) 31px, var(--sd-line, #E4D2D2) 32px)',
        };
      case 'grid':
        return {
          backgroundColor: '#FAF8F5',
          backgroundImage: 'linear-gradient(var(--sd-line, #E4D2D2) 1px, transparent 1px), linear-gradient(90deg, var(--sd-line, #E4D2D2) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        };
      default:
        return { backgroundColor: '#FAF6EE' };
    }
  };

  return (
    <div
      ref={paperRef}
      onPointerDown={handlePaperPointerDown}
      onPointerUp={handlePaperPointerUp}
      style={{
        ...getPaperBgStyle(),
        touchAction: 'none',
        boxShadow: 'var(--sd-shadow-card, 0 4px 16px rgba(46,29,38,0.08))',
      }}
      className="relative aspect-[3/4] w-full rounded-2xl border border-[var(--sd-line)] overflow-hidden flex flex-col p-5 select-none"
    >
      {/* 바인더 스프링 디테일 (좌측 은은한 구멍 3개) */}
      <div className="absolute left-2.5 top-0 bottom-0 flex flex-col justify-around py-12 pointer-events-none">
        <div className="w-2.5 h-2.5 rounded-full bg-[#E5D7D3] shadow-inner opacity-70" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#E5D7D3] shadow-inner opacity-70" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#E5D7D3] shadow-inner opacity-70" />
      </div>

      {/* 상단 날짜 및 칩 영역 */}
      <div className="pl-4 pr-1 mb-2 z-10 pointer-events-none">
        <h2 className="font-['Dongle'] text-4xl leading-none text-[var(--sd-ink)] font-normal">
          {dateLabel}
        </h2>

        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {chips.map((chip) => (
              <span
                key={chip.id}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--sd-surface-2)] text-[var(--sd-muted)] border border-[var(--sd-line)]"
              >
                {chip.iconSrc && (
                  <img src={chip.iconSrc} alt="" className="w-3.5 h-3.5 object-contain" loading="lazy" decoding="async" />
                )}
                {chip.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 일기 본문 영역 */}
      <div className="relative flex-1 pl-4 z-10">
        {editable ? (
          <textarea
            value={page.text}
            onChange={(e) => onTextChange(e.target.value)}
            maxLength={1000}
            placeholder="오늘 하루는 어땠나요?"
            style={{ lineHeight: '32px' }}
            className="w-full h-full bg-transparent resize-none outline-none text-[16px] text-[var(--sd-ink)] placeholder-[var(--sd-faint)] font-sans"
          />
        ) : (
          <p
            style={{ lineHeight: '32px' }}
            className="w-full h-full whitespace-pre-wrap text-[16px] text-[var(--sd-ink)] font-sans"
          >
            {page.text || '아직 적힌 일기가 없어요.'}
          </p>
        )}
      </div>

      {/* 종이 위 물건 레이어 */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {page.items.map((item) => {
          const isSelected = selectedItemId === item.id;
          const isDragging = draggingId === item.id;

          return (
            <div
              key={item.id}
              onPointerDown={(e) => handleItemPointerDown(e, item)}
              style={{
                left: `${item.x * 100}%`,
                top: `${item.y * 100}%`,
                width: `${item.w * 100}%`,
                aspectRatio: `${1 / item.ratio}`,
                zIndex: item.z,
                transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`,
                willChange: isDragging ? 'transform' : 'auto',
                touchAction: 'none',
              }}
              className={`absolute pointer-events-auto cursor-grab active:cursor-grabbing ${
                isSelected ? 'outline outline-2 outline-dashed outline-[var(--sd-rel)] outline-offset-2' : ''
              }`}
            >
              {item.type === 'sticker' && item.src && (
                <img
                  src={item.src}
                  alt="sticker"
                  className="w-full h-full object-contain pointer-events-none"
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />
              )}
              {item.type === 'photo' && item.src && (
                <div className="w-full h-full p-1 bg-white shadow-sm border border-[var(--sd-line)] rounded-sm">
                  <img
                    src={item.src}
                    alt="photo"
                    className="w-full h-full object-cover pointer-events-none"
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                  />
                </div>
              )}
              {(item.type === 'tape' || item.type === 'stamp') && item.decorId && (
                <DiaryDecor decorId={item.decorId} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

```tsx
// src/components/diary/DiaryObjectToolbar.tsx
'use client';

import React from 'react';
import { ZoomOut, ZoomIn, RotateCcw, RotateCw, ArrowUpToLine, Copy, Trash2, Check } from 'lucide-react';
import { DiaryItemAction } from '@/lib/diaryTypes';

export interface DiaryObjectToolbarProps {
  onAction: (a: DiaryItemAction) => void;
  onDone: () => void;
}

export function DiaryObjectToolbar({ onAction, onDone }: DiaryObjectToolbarProps): JSX.Element {
  return (
    <div
      className="w-full bg-[var(--sd-card-solid)] border border-[var(--sd-line)] rounded-2xl shadow-lg px-2 py-1.5 flex items-center justify-between"
      style={{ touchAction: 'none' }}
    >
      <div className="flex items-center gap-1 overflow-x-auto py-0.5">
        <button
          type="button"
          onClick={() => onAction('smaller')}
          className="min-w-[44px] min-h-[44px] flex flex-col items-center justify-center rounded-xl active:bg-[var(--sd-surface-2)] text-[var(--sd-ink)]"
        >
          <ZoomOut className="w-4 h-4 stroke-[1.8]" />
          <span className="text-[10px] mt-0.5 font-medium">작게</span>
        </button>

        <button
          type="button"
          onClick={() => onAction('larger')}
          className="min-w-[44px] min-h-[44px] flex flex-col items-center justify-center rounded-xl active:bg-[var(--sd-surface-2)] text-[var(--sd-ink)]"
        >
          <ZoomIn className="w-4 h-4 stroke-[1.8]" />
          <span className="text-[10px] mt-0.5 font-medium">크게</span>
        </button>

        <button
          type="button"
          onClick={() => onAction('rotateLeft')}
          className="min-w-[44px] min-h-[44px] flex flex-col items-center justify-center rounded-xl active:bg-[var(--sd-surface-2)] text-[var(--sd-ink)]"
        >
          <RotateCcw className="w-4 h-4 stroke-[1.8]" />
          <span className="text-[10px] mt-0.5 font-medium">↺15°</span>
        </button>

        <button
          type="button"
          onClick={() => onAction('rotateRight')}
          className="min-w-[44px] min-h-[44px] flex flex-col items-center justify-center rounded-xl active:bg-[var(--sd-surface-2)] text-[var(--sd-ink)]"
        >
          <RotateCw className="w-4 h-4 stroke-[1.8]" />
          <span className="text-[10px] mt-0.5 font-medium">↻15°</span>
        </button>

        <button
          type="button"
          onClick={() => onAction('front')}
          className="min-w-[44px] min-h-[44px] flex flex-col items-center justify-center rounded-xl active:bg-[var(--sd-surface-2)] text-[var(--sd-ink)]"
        >
          <ArrowUpToLine className="w-4 h-4 stroke-[1.8]" />
          <span className="text-[10px] mt-0.5 font-medium">앞으로</span>
        </button>

        <button
          type="button"
          onClick={() => onAction('duplicate')}
          className="min-w-[44px] min-h-[44px] flex flex-col items-center justify-center rounded-xl active:bg-[var(--sd-surface-2)] text-[var(--sd-ink)]"
        >
          <Copy className="w-4 h-4 stroke-[1.8]" />
          <span className="text-[10px] mt-0.5 font-medium">복제</span>
        </button>

        <button
          type="button"
          onClick={() => onAction('delete')}
          className="min-w-[44px] min-h-[44px] flex flex-col items-center justify-center rounded-xl active:bg-[var(--sd-rel-soft)] text-[var(--sd-crit)]"
        >
          <Trash2 className="w-4 h-4 stroke-[1.8]" />
          <span className="text-[10px] mt-0.5 font-medium">지우기</span>
        </button>
      </div>

      <div className="h-7 w-[1px] bg-[var(--sd-line)] mx-1" />

      <button
        type="button"
        onClick={onDone}
        className="min-w-[48px] min-h-[44px] px-2 flex flex-col items-center justify-center rounded-xl bg-[var(--sd-rel-soft)] text-[var(--sd-rel)] font-medium active:scale-95"
      >
        <Check className="w-4 h-4 stroke-[2.5]" />
        <span className="text-[10px] mt-0.5">완료</span>
      </button>
    </div>
  );
}
```

```tsx
// src/components/diary/DiaryAssetDrawer.tsx
'use client';

import React, { useEffect } from 'react';
import { Star, X } from 'lucide-react';
import { DiaryAssetVM } from '@/lib/diaryTypes';
import { DiaryDecor } from './DiaryDecor';

export interface DiaryAssetDrawerProps {
  open: boolean;
  tabs: { id: string; label: string }[];
  tab: string;
  assets: DiaryAssetVM[];
  full?: boolean;
  onTabChange: (id: string) => void;
  onPick: (asset: DiaryAssetVM) => void;
  onToggleFavorite: (asset: DiaryAssetVM) => void;
  onClose: () => void;
}

export function DiaryAssetDrawer({
  open,
  tabs,
  tab,
  assets,
  full = false,
  onTabChange,
  onPick,
  onToggleFavorite,
  onClose,
}: DiaryAssetDrawerProps): JSX.Element | null {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 max-w-md mx-auto h-[48%] bg-[var(--sd-card-solid)] border-t border-[var(--sd-line)] rounded-t-3xl shadow-2xl flex flex-col overflow-hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* 서랍 헤더 */}
      <div className="flex items-center justify-between px-5 pt-3 pb-2 border-b border-[var(--sd-line)]">
        <span className="font-['Dongle'] text-2xl text-[var(--sd-ink)] font-normal">스티커와 꾸미기</span>
        <button
          type="button"
          onClick={onClose}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--sd-muted)] active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 탭 목록 */}
      <div className="flex gap-1.5 px-4 py-2 overflow-x-auto border-b border-[var(--sd-line)] bg-[var(--sd-surface-2)]">
        {tabs.map((t) => {
          const isActive = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onTabChange(t.id)}
              className={`min-h-[44px] px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap active:scale-95 ${
                isActive
                  ? 'bg-[var(--sd-card-solid)] text-[var(--sd-ink)] shadow-sm'
                  : 'text-[var(--sd-muted)]'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* 한도 알림 */}
      {full && (
        <div className="px-4 py-1.5 bg-[var(--sd-rel-soft)] text-[var(--sd-rel)] text-xs text-center font-medium">
          한 장에 30개까지 붙일 수 있어요
        </div>
      )}

      {/* 물건 4열 그리드 */}
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-4 gap-3">
        {assets.map((asset) => (
          <div
            key={asset.id}
            className="relative aspect-square rounded-xl bg-[var(--sd-surface-2)] p-2 flex items-center justify-center border border-[var(--sd-line)] active:scale-95 transition-transform"
          >
            <button
              type="button"
              disabled={full}
              onClick={() => onPick(asset)}
              className="w-full h-full flex items-center justify-center focus:outline-none"
            >
              {asset.kind === 'sticker' && asset.src && (
                <img
                  src={asset.src}
                  alt={asset.label || 'sticker'}
                  className="w-full h-full object-contain pointer-events-none"
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />
              )}
              {(asset.kind === 'tape' || asset.kind === 'stamp') && asset.decorId && (
                <div className="w-full h-full flex items-center justify-center">
                  <DiaryDecor decorId={asset.decorId} />
                </div>
              )}
            </button>

            {/* 즐겨찾기 별 */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(asset);
              }}
              className="absolute top-1 right-1 w-7 h-7 flex items-center justify-center rounded-full text-[var(--sd-muted)] active:scale-90"
            >
              <Star
                className={`w-3.5 h-3.5 ${
                  asset.favorite ? 'fill-[var(--sd-rel)] text-[var(--sd-rel)]' : 'text-[var(--sd-faint)]'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

```tsx
// src/components/diary/DiaryMaterialTray.tsx
'use client';

import React from 'react';
import { DiaryMaterialVM } from '@/lib/diaryTypes';
import { Sparkles, MessageCircleHeart } from 'lucide-react';

export interface DiaryMaterialTrayProps {
  materials: DiaryMaterialVM[];
  onAdd: (m: DiaryMaterialVM) => void;
}

export function DiaryMaterialTray({ materials, onAdd }: DiaryMaterialTrayProps): JSX.Element | null {
  if (!materials || materials.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto py-1 px-1">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-medium text-[var(--sd-faint)] whitespace-nowrap pl-1">
          오늘의 재료
        </span>
        {materials.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onAdd(m)}
            className="min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--sd-card-solid)] border border-[var(--sd-line)] shadow-sm text-xs text-[var(--sd-ink)] active:scale-95 whitespace-nowrap"
          >
            {m.thumbSrc ? (
              <img
                src={m.thumbSrc}
                alt=""
                className="w-5 h-5 rounded-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : m.kind === 'prompt' ? (
              <MessageCircleHeart className="w-3.5 h-3.5 text-[var(--sd-rel)]" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-[var(--sd-rel)]" />
            )}
            <span className="truncate max-w-[150px]">{m.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

```tsx
// src/components/diary/DiaryDayScreen.tsx
'use client';

import React, { useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Smile,
  Image as ImageIcon,
  Scroll,
  PenLine,
  Calendar,
  Sparkles,
} from 'lucide-react';
import {
  Person,
  DiaryPaperTheme,
  DiaryPageVM,
  DiaryChipVM,
  DiaryMaterialVM,
  DiaryItemAction,
} from '@/lib/diaryTypes';
import { DiaryPaper } from './DiaryPaper';
import { DiaryObjectToolbar } from './DiaryObjectToolbar';
import { DiaryMaterialTray } from './DiaryMaterialTray';

export interface DiaryDayScreenProps {
  me: Person;
  pageOwner: Person;
  page: DiaryPageVM;
  dateLabel: string;
  chips: DiaryChipVM[];
  materials: DiaryMaterialVM[];
  hasPage: Record<Person, boolean>;
  saveState: 'saved' | 'saving' | 'offline';
  isToday: boolean;
  selectedItemId: string | null;
  onBack: () => void;
  onPrevDate: () => void;
  onNextDate: () => void;
  onGoToday: () => void;
  onOpenMonth: () => void;
  onChangeOwner: (p: Person) => void;
  onSelectItem: (id: string | null) => void;
  onMoveItem: (id: string, x: number, y: number) => void;
  onItemAction: (a: DiaryItemAction) => void;
  onTextChange: (text: string) => void;
  onOpenAssets: () => void;
  onPickPhotos: (files: File[]) => void;
  onChangeTheme: (t: DiaryPaperTheme) => void;
  onAddMaterial: (m: DiaryMaterialVM) => void;
  onOpenSpecialDates: () => void;
}

export function DiaryDayScreen({
  me,
  pageOwner,
  page,
  dateLabel,
  chips,
  materials,
  hasPage,
  saveState,
  isToday,
  selectedItemId,
  onBack,
  onPrevDate,
  onNextDate,
  onGoToday,
  onOpenMonth,
  onChangeOwner,
  onSelectItem,
  onMoveItem,
  onItemAction,
  onTextChange,
  onOpenAssets,
  onPickPhotos,
  onChangeTheme,
  onAddMaterial,
  onOpenSpecialDates,
}: DiaryDayScreenProps): JSX.Element {
  const [showMenu, setShowMenu] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditable = me === pageOwner;

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onPickPhotos(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const themes: { id: DiaryPaperTheme; label: string }[] = [
    { id: 'cream', label: '크림' },
    { id: 'plain', label: '무지' },
    { id: 'lined', label: '줄' },
    { id: 'grid', label: '모눈' },
  ];

  return (
    <div
      className="relative w-full max-w-md mx-auto min-h-screen bg-[#FCFAF7] flex flex-col justify-between select-none"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* 상단 헤더 */}
      <header className="px-4 py-2 flex items-center justify-between border-b border-[var(--sd-line)] bg-[#FCFAF7] z-30">
        <button
          type="button"
          onClick={onBack}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--sd-ink)] active:scale-95"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* 날짜 및 월 선택 */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrevDate}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--sd-muted)] active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onOpenMonth}
            className="min-h-[44px] px-2 font-['Dongle'] text-3xl text-[var(--sd-ink)] font-normal active:opacity-70"
          >
            {dateLabel}
          </button>
          <button
            type="button"
            onClick={onNextDate}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--sd-muted)] active:scale-95"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* 저장 상태 및 메뉴 */}
        <div className="relative flex items-center gap-1">
          <span className="text-[10px] text-[var(--sd-faint)]">
            {saveState === 'saved' && '저장됨'}
            {saveState === 'saving' && '저장 중…'}
            {saveState === 'offline' && '폰에 보관 중'}
          </span>
          <button
            type="button"
            onClick={() => setShowMenu((prev) => !prev)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--sd-muted)] active:scale-95"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-11 w-32 bg-[var(--sd-card-solid)] border border-[var(--sd-line)] rounded-xl shadow-lg py-1 z-50">
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  onGoToday();
                }}
                className="w-full min-h-[44px] px-3 text-left text-xs text-[var(--sd-ink)] active:bg-[var(--sd-surface-2)] flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 text-[var(--sd-muted)]" />
                오늘로 가기
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  onOpenSpecialDates();
                }}
                className="w-full min-h-[44px] px-3 text-left text-xs text-[var(--sd-ink)] active:bg-[var(--sd-surface-2)] flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-[var(--sd-rel)]" />
                기념일 관리
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 우댕 | 꼼이 소유자 탭 */}
      <div className="px-4 pt-2 pb-1 flex flex-col items-center">
        <div className="inline-flex p-1 rounded-full bg-[var(--sd-surface-2)] border border-[var(--sd-line)]">
          {(['우댕', '꼼이'] as Person[]).map((person) => {
            const isOwner = pageOwner === person;
            return (
              <button
                key={person}
                type="button"
                onClick={() => onChangeOwner(person)}
                className={`min-h-[44px] px-6 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  isOwner
                    ? 'bg-[var(--sd-card-solid)] text-[var(--sd-ink)] shadow-sm'
                    : 'text-[var(--sd-muted)]'
                }`}
              >
                <span>{person}</span>
                {hasPage[person] && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--sd-rel)]" />
                )}
              </button>
            );
          })}
        </div>

        {!isEditable && (
          <p className="text-[11px] text-[var(--sd-faint)] mt-1">
            {pageOwner}의 장 — 보기만 할 수 있어요
          </p>
        )}
      </div>

      {/* 가운데 종이 영역 */}
      <main className="flex-1 px-4 py-2 flex items-center justify-center">
        <DiaryPaper
          page={page}
          dateLabel={dateLabel}
          chips={chips}
          editable={isEditable}
          selectedItemId={selectedItemId}
          onSelectItem={onSelectItem}
          onMoveItem={onMoveItem}
          onTextChange={onTextChange}
          onSwipe={(dir) => (dir === 'prev' ? onPrevDate() : onNextDate())}
        />
      </main>

      {/* 하단 제어부 (내 장일 때만 꾸미기 단추 노출) */}
      <footer className="px-4 pb-3 pt-1 space-y-2 z-30">
        {isEditable && isToday && (
          <DiaryMaterialTray materials={materials} onAdd={onAddMaterial} />
        )}

        {isEditable && (
          <>
            {selectedItemId ? (
              <DiaryObjectToolbar
                onAction={onItemAction}
                onDone={() => onSelectItem(null)}
              />
            ) : (
              <div className="relative">
                {showThemePicker && (
                  <div className="absolute bottom-16 inset-x-0 mx-auto w-fit p-1 bg-[var(--sd-card-solid)] border border-[var(--sd-line)] rounded-full shadow-lg flex gap-1 z-40">
                    {themes.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          onChangeTheme(t.id);
                          setShowThemePicker(false);
                        }}
                        className={`min-h-[44px] px-3.5 rounded-full text-xs font-medium ${
                          page.theme === t.id
                            ? 'bg-[var(--sd-surface-2)] text-[var(--sd-ink)]'
                            : 'text-[var(--sd-muted)]'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="bg-[var(--sd-card-solid)] border border-[var(--sd-line)] rounded-2xl shadow-sm px-4 py-1 flex items-center justify-around">
                  <button
                    type="button"
                    onClick={onOpenAssets}
                    className="min-w-[44px] min-h-[44px] flex flex-col items-center justify-center text-[var(--sd-ink)] active:scale-95"
                  >
                    <Smile className="w-5 h-5" />
                    <span className="text-[10px] mt-0.5">스티커</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="min-w-[44px] min-h-[44px] flex flex-col items-center justify-center text-[var(--sd-ink)] active:scale-95"
                  >
                    <ImageIcon className="w-5 h-5" />
                    <span className="text-[10px] mt-0.5">사진</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />

                  <button
                    type="button"
                    onClick={() => setShowThemePicker((p) => !p)}
                    className="min-w-[44px] min-h-[44px] flex flex-col items-center justify-center text-[var(--sd-ink)] active:scale-95"
                  >
                    <Scroll className="w-5 h-5" />
                    <span className="text-[10px] mt-0.5">종이</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectItem(null)}
                    className="min-w-[44px] min-h-[44px] flex flex-col items-center justify-center text-[var(--sd-ink)] active:scale-95"
                  >
                    <PenLine className="w-5 h-5" />
                    <span className="text-[10px] mt-0.5">글쓰기</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </footer>
    </div>
  );
}
```

```tsx
// src/components/diary/DiaryMonthSheet.tsx
'use client';

import React, { useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Cake, Heart, Sparkles } from 'lucide-react';
import { DiaryMonthDayVM } from '@/lib/diaryTypes';

export interface DiaryMonthSheetProps {
  open: boolean;
  monthLabel: string;
  days: DiaryMonthDayVM[];
  selectedDate: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onPickDate: (date: string) => void;
  onClose: () => void;
}

export function DiaryMonthSheet({
  open,
  monthLabel,
  days,
  selectedDate,
  onPrevMonth,
  onNextMonth,
  onPickDate,
  onClose,
}: DiaryMonthSheetProps): JSX.Element | null {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const currentSpecial = days.find((d) => d.date === selectedDate)?.special;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/25">
      <div
        className="w-full max-w-md bg-[var(--sd-card-solid)] border-t border-[var(--sd-line)] rounded-t-3xl shadow-2xl p-5 flex flex-col"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--sd-line)]">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onPrevMonth}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--sd-muted)] active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-['Dongle'] text-3xl text-[var(--sd-ink)] font-normal">
              {monthLabel}
            </span>
            <button
              type="button"
              onClick={onNextMonth}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--sd-muted)] active:scale-95"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--sd-muted)] active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 요일 줄 */}
        <div className="grid grid-cols-7 gap-1 py-2 text-center text-xs text-[var(--sd-faint)]">
          <span>일</span>
          <span>월</span>
          <span>화</span>
          <span>수</span>
          <span>목</span>
          <span>금</span>
          <span>토</span>
        </div>

        {/* 42칸 달력 그리드 */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((d) => {
            const isSelected = d.date === selectedDate;

            return (
              <button
                key={d.date}
                type="button"
                onClick={() => {
                  onPickDate(d.date);
                  onClose();
                }}
                className={`min-h-[44px] flex flex-col items-center justify-center rounded-xl p-1 relative active:scale-95 ${
                  isSelected
                    ? 'bg-[var(--sd-surface-2)] border border-[var(--sd-line)]'
                    : ''
                }`}
              >
                {/* 기념일 마크 */}
                {d.special && (
                  <span className="absolute top-1 text-[var(--sd-rel)]">
                    {d.special.includes('생일') ? (
                      <Cake className="w-2.5 h-2.5" />
                    ) : (
                      <Heart className="w-2.5 h-2.5 fill-current" />
                    )}
                  </span>
                )}

                {/* 날짜 숫자 */}
                <span
                  className={`text-xs ${
                    !d.inMonth
                      ? 'text-[var(--sd-faint)] opacity-40'
                      : d.holiday
                      ? 'text-[var(--sd-rel)] font-medium'
                      : d.isToday
                      ? 'text-[var(--sd-ink)] font-bold underline'
                      : 'text-[var(--sd-ink)]'
                  }`}
                >
                  {d.day}
                </span>

                {/* 작성 여부 점 (내 장: 진한 점 / 상대 장: 옅은 점) */}
                <div className="flex gap-0.5 mt-0.5 h-1">
                  {d.mine && <span className="w-1 h-1 rounded-full bg-[var(--sd-ink)]" />}
                  {d.partner && <span className="w-1 h-1 rounded-full bg-[var(--sd-line)]" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* 선택된 날의 기념일 정보 한 줄 */}
        {currentSpecial && (
          <div className="mt-3 py-2 px-3 rounded-xl bg-[var(--sd-rel-soft)] text-[var(--sd-rel)] text-xs flex items-center gap-1.5 justify-center">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{currentSpecial}</span>
          </div>
        )}
      </div>
    </div>
  );
}
```

```tsx
// src/components/diary/DiarySpecialDatesSheet.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CalendarHeart } from 'lucide-react';
import { Person, SpecialDateVM } from '@/lib/diaryTypes';

export interface DiarySpecialDatesSheetProps {
  open: boolean;
  items: SpecialDateVM[];
  busy?: boolean;
  onAdd: (v: Omit<SpecialDateVM, 'id'>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function DiarySpecialDatesSheet({
  open,
  items,
  busy = false,
  onAdd,
  onDelete,
  onClose,
}: DiarySpecialDatesSheetProps): JSX.Element | null {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 새 기념일 입력 상태
  const [label, setLabel] = useState('');
  const [kind, setKind] = useState<'birthday' | 'anniversary' | 'custom'>('anniversary');
  const [month, setMonth] = useState('01');
  const [day, setDay] = useState('01');
  const [startYear, setStartYear] = useState('');
  const [owner, setOwner] = useState<Person | 'together'>('together');

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    onAdd({
      label: label.trim(),
      kind,
      monthDay: `${month}-${day}`,
      startYear: startYear ? parseInt(startYear, 10) : undefined,
      owner,
    });

    setLabel('');
    setStartYear('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/25">
      <div
        className="w-full max-w-md max-h-[85vh] bg-[var(--sd-card-solid)] border-t border-[var(--sd-line)] rounded-t-3xl shadow-2xl flex flex-col"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[var(--sd-line)]">
          <div className="flex items-center gap-1.5">
            <CalendarHeart className="w-5 h-5 text-[var(--sd-rel)]" />
            <span className="font-['Dongle'] text-3xl text-[var(--sd-ink)] font-normal">
              생일과 기념일
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--sd-muted)] active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 스크롤 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* 기념일 목록 */}
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-[var(--sd-surface-2)] border border-[var(--sd-line)]"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-sm text-[var(--sd-ink)]">{item.label}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--sd-card-solid)] text-[var(--sd-muted)]">
                      {item.owner}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--sd-muted)] mt-0.5">
                    매년 {item.monthDay.replace('-', '월 ')}일
                    {item.startYear ? ` (${item.startYear}년부터)` : ''}
                  </p>
                </div>

                {deletingId === item.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onDelete(item.id)}
                      className="min-h-[44px] px-3 rounded-xl bg-[var(--sd-crit)] text-white text-xs font-medium"
                    >
                      지우기
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingId(null)}
                      className="min-h-[44px] px-2 rounded-xl bg-[var(--sd-card-solid)] text-[var(--sd-muted)] text-xs"
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeletingId(item.id)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--sd-faint)] active:text-[var(--sd-crit)]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* 추가 폼 */}
          <form onSubmit={handleSubmit} className="p-4 rounded-2xl border border-[var(--sd-line)] space-y-3">
            <span className="text-xs font-medium text-[var(--sd-ink)]">새 기념일 추가</span>

            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="기념일 이름 (예: 100일, 우댕 생일)"
              className="w-full min-h-[44px] px-3 rounded-xl bg-[var(--sd-surface-2)] border border-[var(--sd-line)] text-[16px] text-[var(--sd-ink)] outline-none"
            />

            <div className="flex gap-2">
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as any)}
                className="flex-1 min-h-[44px] px-2 rounded-xl bg-[var(--sd-surface-2)] border border-[var(--sd-line)] text-[16px] text-[var(--sd-ink)] outline-none"
              >
                <option value="anniversary">기념일</option>
                <option value="birthday">생일</option>
                <option value="custom">그 밖</option>
              </select>

              <select
                value={owner}
                onChange={(e) => setOwner(e.target.value as any)}
                className="flex-1 min-h-[44px] px-2 rounded-xl bg-[var(--sd-surface-2)] border border-[var(--sd-line)] text-[16px] text-[var(--sd-ink)] outline-none"
              >
                <option value="together">같이</option>
                <option value="우댕">우댕</option>
                <option value="꼼이">꼼이</option>
              </select>
            </div>

            <div className="flex gap-2 items-center">
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="flex-1 min-h-[44px] px-2 rounded-xl bg-[var(--sd-surface-2)] border border-[var(--sd-line)] text-[16px] text-[var(--sd-ink)] outline-none"
              >
                {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((m) => (
                  <option key={m} value={m}>{Number(m)}월</option>
                ))}
              </select>

              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="flex-1 min-h-[44px] px-2 rounded-xl bg-[var(--sd-surface-2)] border border-[var(--sd-line)] text-[16px] text-[var(--sd-ink)] outline-none"
              >
                {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map((d) => (
                  <option key={d} value={d}>{Number(d)}일</option>
                ))}
              </select>

              <input
                type="number"
                value={startYear}
                onChange={(e) => setStartYear(e.target.value)}
                placeholder="시작 연도"
                className="w-24 min-h-[44px] px-2 rounded-xl bg-[var(--sd-surface-2)] border border-[var(--sd-line)] text-[16px] text-[var(--sd-ink)] outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={busy || !label.trim()}
              className="w-full min-h-[44px] rounded-xl bg-[var(--sd-rel)] text-white text-sm font-medium flex items-center justify-center gap-1 active:opacity-90 disabled:opacity-40"
            >
              <Plus className="w-4 h-4" />
              추가하기
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
```

```tsx
// src/components/diary/DiaryHomeCard.tsx
'use client';

import React from 'react';

export interface DiaryHomeCardProps {
  dateLabel: string;
  excerpt?: string;
  thumbSrc?: string;
  partnerWroteToday?: boolean;
  onOpen: () => void;
}

export function DiaryHomeCard({
  dateLabel,
  excerpt,
  thumbSrc,
  partnerWroteToday = false,
  onOpen,
}: DiaryHomeCardProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="sd-card w-full h-full px-4 py-4 flex flex-col justify-between relative text-left active:scale-[.98] transition-transform rounded-2xl border border-[var(--sd-line)]"
      style={{
        background: 'var(--sd-card-solid, #FFFFFF)',
        minHeight: '140px',
        boxShadow: 'var(--sd-shadow-card, 0 4px 16px rgba(46,29,38,0.06))',
      }}
    >
      {/* 상단: 다이어리 라벨과 날짜 */}
      <div>
        <div className="flex items-center justify-between">
          <span className="font-['Dongle'] text-3xl leading-none text-[var(--sd-ink)] font-normal">
            다이어리
          </span>
          <span className="text-xs text-[var(--sd-faint)]">{dateLabel}</span>
        </div>

        {/* 일기 미리보기 또는 작성 유도 문구 */}
        <p className="text-xs text-[var(--sd-muted)] mt-2 line-clamp-2 leading-relaxed">
          {excerpt ? excerpt : '오늘 한 장 꾸며 볼까요?'}
        </p>
      </div>

      {/* 하단: 상대방 작성 알림 & 썸네일 */}
      <div className="flex items-center justify-between mt-3">
        {partnerWroteToday ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-[var(--sd-rel-soft)] text-[var(--sd-rel)] font-medium">
            꼼이가 오늘 한 장 썼어요
          </span>
        ) : (
          <span />
        )}

        {thumbSrc && (
          <div className="w-9 h-9 rounded-lg overflow-hidden border border-[var(--sd-line)] bg-[var(--sd-surface-2)]">
            <img
              src={thumbSrc}
              alt="diary thumbnail"
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        )}
      </div>
    </button>
  );
}
```

요청하신 9개 컴포넌트의 완성 코드를 모두 작성했습니다.
드래그 중에는 `ref`와 `requestAnimationFrame`을 통해 상태 변경 없이 `transform: translate3d`만 변경되며 손을 뗄 때만 `onMoveItem`이 호출됩니다.
웹뷰 화면 확대 방지를 위해 모든 입력 필드는 16px 이상으로 설정되었으며 터치 영역 또한 44px 이상으로 최적화되었습니다.
