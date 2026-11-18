// src/components/diary/DiaryAssetDrawer.tsx
'use client';

/**
 * 스티커 서랍 — 탭 줄 = 「최근·즐겨찾기」(늘 맨 앞) + 팩 탭(꾹 0.4초 눌러 좌우로 옮기기 — 꼼톡과 같은 DraggableTabs).
 * 머리의 「관리」를 누르면 같은 서랍 안에서 팩마다 「서랍에 표시」 스위치·「탭 순서 처음대로」.
 * 우댕 2026-11-18 「여기 스티커도 꼼톡처럼 … 탭(종류)을 아예 끄거나, 드래그로 이동할 수 있어야 해」 — 설정은 lib/diaryAssetPrefs.ts.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Star, X, SlidersHorizontal } from 'lucide-react';
import { DiaryAssetVM } from '@/lib/diaryTypes';
import { DiaryDecor } from './DiaryDecor';
import DraggableTabs from '../DraggableTabs';
import { Switch } from '../EmoticonManager';

/** 팩 하나 — 탭 이름과 관리 화면의 작은 그림(그림 주소 또는 CSS 꾸미기 id). */
export interface DiaryPackVM { id: string; label: string; thumbSrc?: string; thumbDecorId?: string }

export interface DiaryAssetDrawerProps {
  open: boolean;
  /** 늘 맨 앞에 있는 탭(최근·즐겨찾기) */
  fixedTabs: { id: string; label: string }[];
  /** 서랍에 보이는 팩, 사용자 순서대로 */
  packs: DiaryPackVM[];
  /** 관리 화면용 — 모든 팩과 보이는지 */
  allPacks: (DiaryPackVM & { shown: boolean })[];
  tab: string;
  assets: DiaryAssetVM[];
  full?: boolean;
  onTabChange: (id: string) => void;
  onReorder: (packIds: string[]) => void;
  onToggleShown: (packId: string, shown: boolean) => void;
  onResetOrder: () => void;
  onPick: (asset: DiaryAssetVM) => void;
  onToggleFavorite: (asset: DiaryAssetVM) => void;
  onClose: () => void;
}

function PackThumb({ p }: { p: DiaryPackVM }): React.JSX.Element {
  return (
    <span className="w-10 h-10 shrink-0 rounded-xl bg-[var(--sd-surface-2)] border border-[var(--sd-line)] flex items-center justify-center overflow-hidden p-1">
      {p.thumbSrc ? (
        <img src={p.thumbSrc} alt="" loading="lazy" decoding="async" draggable={false} className="w-full h-full object-contain" />
      ) : p.thumbDecorId ? (
        <DiaryDecor decorId={p.thumbDecorId} />
      ) : null}
    </span>
  );
}

export function DiaryAssetDrawer({
  open,
  fixedTabs,
  packs,
  allPacks,
  tab,
  assets,
  full = false,
  onTabChange,
  onReorder,
  onToggleShown,
  onResetOrder,
  onPick,
  onToggleFavorite,
  onClose,
}: DiaryAssetDrawerProps): React.JSX.Element | null {
  const [manage, setManage] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (!open) setManage(false); }, [open]);
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const tabClass = (active: boolean) =>
    `min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
      active ? 'bg-[var(--sd-card-solid)] text-[var(--sd-ink)] shadow-sm' : 'text-[var(--sd-muted)]'
    }`;
  const emptyText = packs.length === 0 && tab !== 'recent' && tab !== 'favorite'
    ? '표시 중인 스티커 팩이 없어요'
    : tab === 'recent' ? '아직 붙인 스티커가 없어요'
    : tab === 'favorite' ? '스티커의 ★를 누르면 여기에 모여요'
    : '이 팩에 스티커가 없어요';

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 max-w-md mx-auto h-[48%] bg-[var(--sd-card-solid)] border-t border-[var(--sd-line)] rounded-t-3xl shadow-2xl flex flex-col overflow-hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* 서랍 헤더 — 오른쪽 「관리」(관리 중이면 「완료」) */}
      <div className="flex items-center justify-between pl-5 pr-2 pt-3 pb-2 border-b border-[var(--sd-line)]">
        <span className="font-['Dongle'] text-2xl text-[var(--sd-ink)] font-normal">{manage ? '스티커 탭 관리' : '스티커와 꾸미기'}</span>
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setManage((m) => !m)}
            className={`min-h-[44px] px-3 rounded-full text-[13px] font-medium flex items-center gap-1 active:scale-95 ${
              manage ? 'text-[var(--sd-rel)]' : 'text-[var(--sd-muted)]'
            }`}
          >
            {manage ? '완료' : (<><SlidersHorizontal className="w-4 h-4" />관리</>)}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--sd-muted)] active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {manage ? (
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <p className="text-[12px] text-[var(--sd-muted)] mb-2">끈 팩은 서랍에서만 빠져요. 이미 붙인 스티커는 그대로 있어요. 탭은 꾹 눌러 좌우로 옮길 수 있어요.</p>
          <ul className="flex flex-col">
            {allPacks.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2 border-b border-[color:color-mix(in_srgb,var(--sd-line)_60%,transparent)]">
                <PackThumb p={p} />
                <span className={`flex-1 min-w-0 text-[14px] ${p.shown ? 'text-[var(--sd-ink)]' : 'text-[var(--sd-faint)]'}`}>{p.label}</span>
                <Switch on={p.shown} label={`${p.label} 서랍에 표시`} onChange={(v) => onToggleShown(p.id, v)} />
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onResetOrder}
            className="mt-3 w-full min-h-[44px] rounded-xl border border-[var(--sd-line)] text-xs font-medium text-[var(--sd-muted)] active:bg-[var(--sd-surface-2)]"
          >
            탭 순서 처음대로
          </button>
        </div>
      ) : (
        <>
          {/* 탭 줄 — 최근·즐겨찾기는 고정, 팩은 꾹 눌러 옮기기. ⚠️ DraggableTabs 는 이 줄이 position:relative 여야 자리를 맞게 잰다. */}
          <div
            ref={rowRef}
            className="relative flex gap-1.5 px-4 py-2 overflow-x-auto border-b border-[var(--sd-line)] bg-[var(--sd-surface-2)]"
          >
            {fixedTabs.map((t) => (
              <button key={t.id} type="button" onClick={() => onTabChange(t.id)} aria-pressed={t.id === tab} className={`shrink-0 active:scale-95 ${tabClass(t.id === tab)}`}>
                {t.label}
              </button>
            ))}
            {packs.length > 0 && <span className="shrink-0 w-px my-2 bg-[var(--sd-line)]" aria-hidden />}
            <DraggableTabs
              items={packs}
              scrollRef={rowRef}
              labelOf={(p) => p.label}
              pressedOf={(p) => p.id === tab}
              onPick={(p) => onTabChange(p.id)}
              onReorder={onReorder}
              renderTab={(p, { dragging }) => (
                <span className={`flex items-center ${tabClass(p.id === tab || dragging)}`}>{p.label}</span>
              )}
            />
          </div>

          {/* 한도 알림 */}
          {full && (
            <div className="px-4 py-1.5 bg-[var(--sd-rel-soft)] text-[var(--sd-rel)] text-xs text-center font-medium">
              한 장에 30개까지 붙일 수 있어요
            </div>
          )}

          {assets.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6 text-center">
              <p className="text-[13px] text-[var(--sd-muted)]">{emptyText}</p>
              {packs.length === 0 && (
                <button type="button" onClick={() => setManage(true)} className="min-h-[40px] px-4 rounded-full border border-[var(--sd-line)] text-xs font-medium text-[var(--sd-ink)] active:bg-[var(--sd-surface-2)]">
                  스티커 탭 관리 열기
                </button>
              )}
            </div>
          ) : (
            /* 물건 4열 그리드 */
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-4 gap-3 content-start">
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
                    aria-label={asset.favorite ? '즐겨찾기에서 빼기' : '즐겨찾기'}
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
          )}
        </>
      )}
    </div>
  );
}
