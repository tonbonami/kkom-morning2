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
}: DiaryAssetDrawerProps): React.JSX.Element | null {
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
