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
}: DiaryPaperProps): React.JSX.Element {
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
