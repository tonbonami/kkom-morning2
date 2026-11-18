// src/components/diary/DiaryPaper.tsx
'use client';

import React, { useRef, useState } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import { DiaryPageVM, DiaryChipVM, DiaryItemVM, DIARY_LIMITS, PHOTO_PAD, photoBoxRatio, photoShowsCaption } from '@/lib/diaryTypes';
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
  onClearQuestion?: () => void;   // 고른 질문 빼기(내 장일 때만)
  /** 빈 내 장 가운데 「사진 넣기」(GPT 회의 2026-11-18: 사진 단추가 10px 글씨라 만든 사람도 못 찾았다 → 빈 장의 첫 행동으로) */
  onEmptyPhoto?: () => void;
  /** 글 칸 — 아래 「글쓰기」 단추·빈 장 「글부터 쓰기」가 여기에 초점을 준다 */
  textRef?: React.RefObject<HTMLTextAreaElement | null>;
}

/** 사진 한 장 그리기 — 모양(frame)마다. 상자 크기는 바깥(물건 상자)이 photoBoxRatio 로 이미 맞춰 둔다. */
function PhotoBody({ item }: { item: DiaryItemVM }): React.JSX.Element | null {
  if (!item.src) return null;
  const f = item.frame ?? 'white';
  const img = (
    <img src={item.src} alt="photo" className="w-full h-full object-cover pointer-events-none" loading="lazy" decoding="async" draggable={false} />
  );
  if (f === 'circle') return <div className="w-full h-full rounded-full overflow-hidden shadow-[0_2px_8px_rgba(46,29,38,0.18)]">{img}</div>;
  if (f === 'none') return <div className="w-full h-full rounded-[3px] overflow-hidden shadow-[0_2px_8px_rgba(46,29,38,0.16)]">{img}</div>;
  const cap = photoShowsCaption(item);
  if (f === 'white' && !cap) {
    return <div className="w-full h-full p-1 bg-white shadow-sm border border-[var(--sd-line)] rounded-sm">{img}</div>;
  }
  // 둘레를 폭에 대한 %로 — CSS padding 의 % 는 위·아래도 부모 **폭** 기준이라 W 에 맞춰 커지고 작아진다.
  const pad = f === 'polaroid' ? PHOTO_PAD.polaroid : PHOTO_PAD.white;
  return (
    <div
      className={`w-full h-full flex flex-col bg-white border border-[color:color-mix(in_srgb,var(--sd-line)_70%,transparent)] ${
        f === 'polaroid' ? 'shadow-[0_3px_10px_rgba(46,29,38,0.16)]' : 'shadow-sm rounded-sm'
      }`}
      style={{ padding: `${pad.side * 100}% ${pad.side * 100}% 0`, containerType: 'inline-size' }}
    >
      <div className="w-full shrink-0 overflow-hidden bg-[#F1ECE8]" style={{ aspectRatio: `${1 / item.ratio}` }}>{img}</div>
      <div className="flex-1 min-h-0 flex items-center justify-center px-[2%] overflow-hidden">
        {cap && (
          <span
            className="font-['Dongle'] text-[#4A3A36] text-center break-keep line-clamp-2"
            style={{ fontSize: f === 'polaroid' ? '15cqw' : '12.5cqw', lineHeight: 0.9 }}
          >
            {item.caption}
          </span>
        )}
      </div>
    </div>
  );
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
  onClearQuestion,
  onSwipe,
  onEmptyPhoto,
  textRef,
}: DiaryPaperProps): React.JSX.Element {
  const paperRef = useRef<HTMLDivElement>(null);
  const [textFocused, setTextFocused] = useState(false);
  const blank = editable && page.items.length === 0 && !page.text.trim() && !page.question;
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
  // ⚠️ 글 칸 안에서 시작한 손짓·글 쓰는 중에는 날짜를 넘기지 않는다 — 꼼이 2026-11-17 아침, 일기를 쓰다 손가락이 옆으로
  //    밀려 다음 날(11/18) 장으로 넘어갔고, 거기에 같은 글이 들어가 「어제랑 오늘이 똑같은」 장이 생겼다(우댕 11/18 발견).
  //    글 칸이 종이 대부분을 덮으니 내 장에선 날짜 밀기가 거의 안 되고, 날짜 넘기기는 위쪽 ‹ › 로 한다.
  const handlePaperPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement;
    if (textFocused || t.closest('textarea, input, button')) { swipeStartRef.current = null; return; }
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

      {/* 일기 본문 영역 — 고른 질문은 글과 따로, 다른 색 한 줄로(줄 높이는 본문과 같게 맞춰 줄 노트 선에 얹힌다) */}
      <div className="relative flex-1 min-h-0 pl-4 z-10 flex flex-col">
        {page.question && (
          <div className="flex items-start gap-1 shrink-0 pr-1" style={{ lineHeight: '32px' }}>
            <span className="text-[16px] font-medium text-[var(--sd-rel)] break-keep">{page.question}</span>
            {editable && onClearQuestion && (
              <button
                type="button"
                aria-label="질문 빼기"
                onClick={onClearQuestion}
                className="w-8 h-8 shrink-0 flex items-center justify-center text-[var(--sd-faint)] active:opacity-60"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
        {editable ? (
          <textarea
            ref={textRef}
            value={page.text}
            onChange={(e) => onTextChange(e.target.value)}
            onFocus={() => setTextFocused(true)}
            onBlur={() => setTextFocused(false)}
            maxLength={1000}
            placeholder="오늘 하루는 어땠나요?"
            style={{ lineHeight: '32px' }}
            className="w-full flex-1 min-h-0 bg-transparent resize-none outline-none text-[16px] text-[var(--sd-ink)] placeholder-[var(--sd-faint)] font-sans"
          />
        ) : (
          <p
            style={{ lineHeight: '32px' }}
            className="w-full flex-1 min-h-0 whitespace-pre-wrap text-[16px] text-[var(--sd-ink)] font-sans"
          >
            {page.text || (page.question ? '' : '아직 적힌 일기가 없어요.')}
          </p>
        )}
      </div>

      {/* 빈 내 장 — 첫 행동 두 개. 글 칸에 초점이 가면(쓰기 시작) 바로 비켜 준다. 종이 내용이 아니라 저장되지 않는다. */}
      {blank && !textFocused && onEmptyPhoto && (
        <div className="absolute inset-x-0 top-[57%] -translate-y-1/2 z-30 flex flex-col items-center gap-2 pointer-events-none">
          <div className="w-10 h-10 rounded-full bg-[var(--sd-rel-soft)] text-[var(--sd-rel)] flex items-center justify-center">
            <ImageIcon className="w-[22px] h-[22px] stroke-[1.7]" />
          </div>
          <p className="text-[15px] font-medium text-[var(--sd-ink)] mb-1">오늘을 한 장 남겨 볼까요?</p>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onClick={onEmptyPhoto}
            className="pointer-events-auto w-[168px] h-12 rounded-full bg-[var(--sd-ink)] text-white text-[15px] font-medium flex items-center justify-center gap-1.5 shadow-sm active:opacity-85"
          >
            <ImageIcon className="w-[18px] h-[18px]" />
            사진 넣기
          </button>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onClick={() => textRef?.current?.focus()}
            className="pointer-events-auto w-[168px] h-11 rounded-full bg-[var(--sd-card-solid)] border border-[var(--sd-line)] text-[14px] font-medium text-[var(--sd-ink)] active:bg-[var(--sd-surface-2)]"
          >
            글부터 쓰기
          </button>
          <p className="text-[12px] text-[var(--sd-faint)] mt-0.5">사진은 한 장에 {DIARY_LIMITS.photos}장까지 넣을 수 있어요</p>
        </div>
      )}

      {/* 종이 위 물건 레이어 */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {page.items.map((item) => {
          const isSelected = selectedItemId === item.id;
          const isDragging = draggingId === item.id;
          const boxRatio = item.type === 'photo' ? photoBoxRatio(item) : item.ratio;

          return (
            <div
              key={item.id}
              onPointerDown={(e) => handleItemPointerDown(e, item)}
              style={{
                left: `${item.x * 100}%`,
                top: `${item.y * 100}%`,
                width: `${item.w * 100}%`,
                aspectRatio: `${1 / boxRatio}`,
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
              {item.type === 'photo' && <PhotoBody item={item} />}
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
