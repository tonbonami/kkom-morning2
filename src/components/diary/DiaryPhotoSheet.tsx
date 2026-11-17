// src/components/diary/DiaryPhotoSheet.tsx
'use client';

/**
 * 「사진 넣기」 서랍 — 맨 앞 칸은 사진 앱(바로 사진 앱이 열림), 그 뒤로 꼼톡·추억에 있는 우리 사진.
 * 우댕 2026-11-18 「사진 먼저 하고, 다음 1까지 하자」 — 회의록(claude.ai/artifact/DoAvvyGtTgDhRHKghNqMhG)의
 *   지금 바로(사진이 보이게) + 다음 ①(꼼톡·추억에서 가져오기). 둘 사이 사진은 대부분 꼼톡에 있다.
 * GPT 는 「매번 어디서 가져올지 묻지 말 것」 — 그래서 묻는 단계 없이, 서랍을 열면 최근 꼼톡 사진이 바로 보이고
 *   사진 앱은 첫 칸 한 번 누르기(카톡 사진 고르기와 같은 짜임).
 * 고른 사진은 다이어리 자리에 복사해서 올린다(diary.ts appPhotoFile) — 원본 메시지를 지워도 장이 안 깨진다.
 */
import React, { useEffect, useState } from 'react';
import { X, Image as ImageIcon, Check, Loader2 } from 'lucide-react';
import { fetchChatPhotos, fetchMemoryPhotos, type AppPhotoVM } from '@/lib/diary';

export interface DiaryPhotoSheetProps {
  open: boolean;
  /** 이 장에 더 넣을 수 있는 사진 수 */
  room: number;
  limit: number;
  onPickLibrary: () => void;
  onPickApp: (photos: AppPhotoVM[]) => void;
  onClose: () => void;
}

type Tab = 'chat' | 'memories';

export function DiaryPhotoSheet({ open, room, limit, onPickLibrary, onPickApp, onClose }: DiaryPhotoSheetProps): React.JSX.Element | null {
  const [tab, setTab] = useState<Tab>('chat');
  const [chat, setChat] = useState<{ list: AppPhotoVM[]; done: boolean } | null>(null);
  const [mem, setMem] = useState<AppPhotoVM[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [picked, setPicked] = useState<AppPhotoVM[]>([]);

  useEffect(() => { if (open) { setPicked([]); setFailed(false); } }, [open]);

  useEffect(() => {
    if (!open) return;
    if (tab === 'chat' && !chat) {
      setLoading(true);
      fetchChatPhotos().then(setChat).catch(() => setFailed(true)).finally(() => setLoading(false));
    }
    if (tab === 'memories' && !mem) {
      setLoading(true);
      fetchMemoryPhotos().then(setMem).catch(() => setFailed(true)).finally(() => setLoading(false));
    }
  }, [open, tab, chat, mem]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const list = tab === 'chat' ? chat?.list : mem;
  const toggle = (p: AppPhotoVM) => setPicked((cur) => {
    if (cur.some((x) => x.id === p.id)) return cur.filter((x) => x.id !== p.id);
    if (cur.length >= room) return cur;
    return [...cur, p];
  });
  const more = () => {
    setLoading(true);
    fetchChatPhotos(true).then(setChat).catch(() => setFailed(true)).finally(() => setLoading(false));
  };
  const used = limit - room;

  return (
    <div onClick={onClose} className="fixed inset-0 z-[70] flex items-end justify-center bg-black/25">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[var(--sd-card-solid)] border-t border-[var(--sd-line)] rounded-t-3xl shadow-2xl flex flex-col max-h-[82dvh] overflow-hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="px-5 pt-4 pb-2 flex items-center justify-between">
          <div>
            <span className="font-['Dongle'] text-3xl leading-none text-[var(--sd-ink)]">사진 넣기</span>
            <span className="ml-2 text-xs text-[var(--sd-muted)]">{used}/{limit}장</span>
          </div>
          <button type="button" onClick={onClose} aria-label="닫기" className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--sd-muted)] active:scale-95">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 pb-2 flex gap-1.5">
          {([['chat', '꼼톡 사진'], ['memories', '추억']] as [Tab, string][]).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`min-h-[36px] px-3.5 rounded-full text-[13px] font-medium border ${
                tab === id ? 'bg-[var(--sd-ink)] text-white border-[var(--sd-ink)]' : 'bg-transparent text-[var(--sd-muted)] border-[var(--sd-line)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-3">
          <div className="grid grid-cols-3 gap-1.5">
            {/* 첫 칸 = 사진 앱 */}
            <button
              type="button"
              onClick={onPickLibrary}
              className="aspect-square rounded-xl bg-[var(--sd-surface-2)] border border-[var(--sd-line)] flex flex-col items-center justify-center gap-1 text-[var(--sd-ink)] active:opacity-80"
            >
              <ImageIcon className="w-6 h-6 stroke-[1.7]" />
              <span className="text-[12px] font-medium">사진 앱에서</span>
            </button>
            {(list ?? []).map((p) => {
              const n = picked.findIndex((x) => x.id === p.id);
              const on = n >= 0;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggle(p)}
                  className={`relative aspect-square rounded-xl overflow-hidden bg-[var(--sd-surface-2)] active:opacity-85 ${on ? 'ring-[3px] ring-[var(--sd-rel)] ring-inset' : ''}`}
                >
                  <img src={p.thumb} alt="" loading="lazy" decoding="async" draggable={false} className="w-full h-full object-cover" />
                  <span
                    className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full text-[12px] font-bold flex items-center justify-center border-2 ${
                      on ? 'bg-[var(--sd-rel)] border-white text-white' : 'bg-black/15 border-white/90 text-transparent'
                    }`}
                  >
                    {on ? n + 1 : ''}
                  </span>
                </button>
              );
            })}
          </div>

          {loading && (
            <div className="py-6 flex items-center justify-center gap-1.5 text-xs text-[var(--sd-muted)]">
              <Loader2 className="w-4 h-4 animate-spin" /> 사진을 불러오는 중이에요
            </div>
          )}
          {!loading && failed && (
            <p className="py-6 text-center text-xs text-[var(--sd-muted)]">사진을 불러오지 못했어요. 잠시 뒤 다시 열어 주세요</p>
          )}
          {!loading && !failed && list && list.length === 0 && (
            <p className="py-6 text-center text-xs text-[var(--sd-faint)]">{tab === 'chat' ? '꼼톡에서 주고받은 사진이 아직 없어요' : '추억에 올린 사진이 아직 없어요'}</p>
          )}
          {!loading && tab === 'chat' && chat && !chat.done && chat.list.length > 0 && (
            <button type="button" onClick={more} className="mt-3 w-full min-h-[44px] rounded-xl border border-[var(--sd-line)] text-xs font-medium text-[var(--sd-muted)] active:bg-[var(--sd-surface-2)]">
              더 지난 사진 보기
            </button>
          )}
        </div>

        <div className="px-4 pt-2 pb-3 border-t border-[var(--sd-line)]">
          <button
            type="button"
            disabled={picked.length === 0}
            onClick={() => { const list = picked; setPicked([]); onPickApp(list); }}
            className="w-full min-h-[48px] rounded-xl bg-[var(--sd-ink)] text-white text-[15px] font-medium flex items-center justify-center gap-1.5 disabled:opacity-35 active:opacity-90"
          >
            <Check className="w-4 h-4" />
            {picked.length > 0 ? `${picked.length}장 넣기` : room > 0 ? `${room}장까지 고를 수 있어요` : `사진은 한 장에 ${limit}장까지예요`}
          </button>
        </div>
      </div>
    </div>
  );
}
