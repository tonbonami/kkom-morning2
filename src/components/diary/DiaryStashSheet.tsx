'use client';

import { useEffect, useState } from 'react';
import { ArchiveRestore, Image as ImageIcon, Trash2, X } from 'lucide-react';
import type { DiaryConflictStash } from '@/lib/diaryConflictStash';

export interface DiaryStashSheetProps {
  open: boolean;
  stashes: DiaryConflictStash[];
  practice?: boolean;
  onRestore: (stash: DiaryConflictStash) => Promise<void>;
  onDelete: (stash: DiaryConflictStash) => void;
  onClose: () => void;
}

const firstLine = (stash: DiaryConflictStash) => stash.page.text.split('\n').map((line) => line.trim()).find(Boolean) || stash.page.question || '글 없이 꾸민 장이에요';
const timeLabel = (at: number) => {
  const d = new Date(at), now = new Date();
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const date = day === today ? '오늘' : day === today - 86400000 ? '어제' : d.getFullYear() === now.getFullYear() ? `${d.getMonth() + 1}월 ${d.getDate()}일` : `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  const hour = d.getHours(), ap = hour < 12 ? '오전' : '오후', h = hour % 12 || 12;
  return `${date} ${ap} ${h}:${String(d.getMinutes()).padStart(2, '0')}`;
};

function PaperPreview({ stash }: { stash: DiaryConflictStash }) {
  const picture = stash.page.items.find((item) => item.src && (item.type === 'photo' || item.type === 'ink' || item.type === 'sticker'));
  return (
    <div className="relative w-[74px] h-[98px] shrink-0 overflow-hidden rounded-lg border border-[var(--sd-line)] bg-[#FAF6EE] shadow-sm p-2">
      <div className="h-1 w-8 rounded-full bg-[var(--sd-line)] mb-1.5" />
      <div className="space-y-1 opacity-70">
        <div className="h-px bg-[var(--sd-line)]" /><div className="h-px bg-[var(--sd-line)]" /><div className="h-px w-4/5 bg-[var(--sd-line)]" />
      </div>
      {picture?.src ? <img src={picture.src} alt="" className="absolute right-1.5 bottom-1.5 w-10 h-10 object-contain rounded-sm" loading="lazy" decoding="async" /> : (
        <ImageIcon className="absolute right-2 bottom-2 w-6 h-6 text-[var(--sd-line)]" />
      )}
    </div>
  );
}

export function DiaryStashSheet({ open, stashes, practice = false, onRestore, onDelete, onClose }: DiaryStashSheetProps): React.JSX.Element | null {
  const [confirm, setConfirm] = useState<{ key: string; kind: 'restore' | 'delete' } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => { if (!open) { setConfirm(null); setBusy(null); } }, [open]);
  useEffect(() => { if (confirm && !stashes.some((s) => s.key === confirm.key)) setConfirm(null); }, [confirm, stashes]);
  useEffect(() => {
    if (!open) return;
    const keydown = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onClose(); };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [busy, onClose, open]);
  if (!open) return null;

  return (
    <div onClick={() => { if (!busy) onClose(); }} className="fixed inset-0 z-[75] flex items-end justify-center bg-black/25">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md max-h-[85dvh] bg-[var(--sd-card-solid)] border-t border-[var(--sd-line)] rounded-t-3xl shadow-2xl flex flex-col overflow-hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="pl-5 pr-2 py-3 border-b border-[var(--sd-line)] flex items-center justify-between">
          <div>
            <h2 className="font-['Dongle'] text-3xl leading-none text-[var(--sd-ink)]">따로 보관한 장</h2>
            <p className="text-[11px] text-[var(--sd-muted)] mt-1">이 기기에만 보관했어요</p>
          </div>
          <button type="button" disabled={!!busy} onClick={onClose} aria-label="닫기" className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--sd-muted)] disabled:opacity-40"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {stashes.length === 0 ? <p className="py-12 text-center text-xs text-[var(--sd-faint)]">남아 있는 보관본이 없어요</p> : stashes.map((stash) => {
            const asking = confirm?.key === stash.key ? confirm.kind : null;
            return (
              <div key={stash.key} className="rounded-2xl border border-[var(--sd-line)] bg-[var(--sd-bg)] p-3">
                <div className="flex gap-3 min-w-0">
                  <PaperPreview stash={stash} />
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-[11px] text-[var(--sd-muted)]">{timeLabel(stash.savedAt)}</p>
                    <p className="mt-1.5 text-[13px] leading-5 font-medium text-[var(--sd-ink)] line-clamp-2">{firstLine(stash)}</p>
                    {stash.page.items.length > 0 && <p className="mt-1 text-[10px] text-[var(--sd-faint)]">사진·스티커 {stash.page.items.length}개</p>}
                  </div>
                </div>
                {asking ? (
                  <div className="mt-3 pt-3 border-t border-[var(--sd-line)]">
                    <p className="text-xs text-[var(--sd-ink)]">{asking === 'restore' ? '지금 장이 이 보관본으로 바뀌어요' : '이 기기에서 이 보관본만 지울까요?'}</p>
                    <div className="mt-2 flex justify-end gap-2">
                      <button type="button" disabled={!!busy} onClick={() => setConfirm(null)} className="min-h-[40px] px-4 rounded-xl border border-[var(--sd-line)] text-xs text-[var(--sd-muted)]">취소</button>
                      <button
                        type="button" disabled={!!busy || (asking === 'restore' && practice)}
                        onClick={async () => {
                          if (asking === 'delete') { onDelete(stash); return; }
                          setBusy(stash.key);
                          try { await onRestore(stash); } finally { setBusy(null); }
                        }}
                        className={`min-h-[40px] px-4 rounded-xl text-xs font-medium text-white disabled:opacity-40 ${asking === 'delete' ? 'bg-[var(--sd-crit)]' : 'bg-[var(--sd-ink)]'}`}
                      >{busy === stash.key ? '바꾸는 중…' : asking === 'delete' ? '지우기' : practice ? '연습 모드에선 못 바꿔요' : '바꾸기'}</button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <button type="button" disabled={!!busy} onClick={() => setConfirm({ key: stash.key, kind: 'restore' })} className="min-h-[42px] flex-1 rounded-xl bg-[var(--sd-ink)] text-white text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-40"><ArchiveRestore className="w-4 h-4" />이걸로 바꾸기</button>
                    <button type="button" disabled={!!busy} onClick={() => setConfirm({ key: stash.key, kind: 'delete' })} className="min-h-[42px] px-4 rounded-xl border border-[var(--sd-line)] text-[var(--sd-muted)] text-xs flex items-center justify-center gap-1.5 disabled:opacity-40"><Trash2 className="w-4 h-4" />지우기</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
