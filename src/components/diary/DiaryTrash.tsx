'use client';

// 꼼이어리 휴지통 — 지운 하루 장을 30일 동안 되살린다. 데이터는 lib/diary.ts 「휴지통(30일)」.
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Trash } from 'lucide-react';
import { DIARY_TRASH_DAYS, type DiaryTrashVM } from '@/lib/diary';

const ROSE_SOLID = '#B4546A';
const DAY = 86400000;
const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
const dateLabel = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return `${m}월 ${d}일 ${WEEK[new Date(y, m - 1, d).getDay()]}요일`;
};
const daysLeft = (deletedAt: number) => Math.max(1, Math.ceil(DIARY_TRASH_DAYS - (Date.now() - deletedAt) / DAY));
const useEscClose = (open: boolean, onClose: () => void) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
};

export type RestoreResult = 'ok' | 'occupied' | 'fail';

export function DiaryTrashPage({ items, loaded, failed, onBack, onRestore }: {
  items: DiaryTrashVM[];
  failed: boolean;
  loaded: boolean;
  onBack: () => void;
  onRestore: (id: string, date: string, swap: boolean) => Promise<RestoreResult>;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [ask, setAsk] = useState<DiaryTrashVM | null>(null);
  useEscClose(!ask, onBack);
  useEffect(() => { box.current?.scrollTo(0, 0); }, []);

  const restore = async (t: DiaryTrashVM, swap: boolean) => {
    if (busy) return;
    setBusy(t.id);
    const r = await onRestore(t.id, t.page.date, swap);
    setBusy(null);
    if (r === 'occupied') setAsk(t);
  };

  return (
    <div ref={box} role="dialog" aria-modal="true" aria-label="휴지통"
         className="fixed inset-0 z-[90] overflow-y-auto overscroll-contain bg-[#FCFAF7]"
         style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 32px)' }}>
      <div className="max-w-md mx-auto px-5">
        <header className="flex items-center gap-2 pt-2 pb-1 -mx-2">
          <button type="button" onClick={onBack} aria-label="뒤로"
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--sd-ink)] active:scale-95">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[20px] font-bold text-[var(--sd-ink)]">휴지통</h1>
        </header>
        <p className="py-3 text-[14px] leading-relaxed text-[var(--sd-muted)]">
          지운 장은 {DIARY_TRASH_DAYS}일 뒤 완전히 지워져요. 되살리면 ♥와 한마디도 다시 보여요.
        </p>

        {loaded && failed && (
          <p className="pt-20 text-center text-[14px] text-[var(--sd-muted)]">휴지통을 불러오지 못했어요. 잠시 뒤에 다시 열어 주세요.</p>
        )}
        {loaded && !failed && items.length === 0 && (
          <div className="flex flex-col items-center text-center pt-20">
            <Trash className="w-12 h-12 text-[var(--sd-faint)]" strokeWidth={1.5} />
            <p className="mt-4 text-[18px] font-bold text-[var(--sd-muted)]">휴지통이 비었어요</p>
            <p className="mt-1 text-[14px] text-[var(--sd-faint)]">지운 장은 여기에 {DIARY_TRASH_DAYS}일 동안 보관돼요.</p>
          </div>
        )}

        <ul className="flex flex-col gap-3 pt-1">
          {items.map((t) => (
            <li key={t.id} className="rounded-lg bg-[var(--sd-card-solid)] border border-[var(--sd-line)] p-4 flex gap-3 items-start">
              <div className="flex-1 min-w-0">
                <p className="text-[16px] font-bold text-[var(--sd-ink)]">{dateLabel(t.page.date)}</p>
                <p className={`mt-1 text-[14px] truncate ${t.excerpt ? 'text-[var(--sd-muted)]' : 'text-[var(--sd-faint)]'}`}>
                  {t.excerpt || '글 없음'}
                </p>
                <p className="mt-1 text-[12px] text-[var(--sd-faint)]">{daysLeft(t.deletedAt)}일 뒤 지워져요</p>
                <button type="button" disabled={!!busy} onClick={() => void restore(t, false)}
                        className="mt-3 min-h-[44px] px-4 rounded-xl text-[14px] font-semibold text-white active:scale-[0.98] disabled:opacity-60"
                        style={{ background: ROSE_SOLID }}>
                  {busy === t.id ? '되살리는 중…' : '되살리기'}
                </button>
              </div>
              {t.thumb
                ? <img src={t.thumb} alt="" draggable={false} className="w-12 h-12 rounded-lg object-cover border border-[var(--sd-line)] shrink-0" />
                : <div className="w-12 h-12 shrink-0" aria-hidden />}
            </li>
          ))}
        </ul>
      </div>

      {ask && <OccupiedDialog
        date={ask.page.date}
        onCancel={() => setAsk(null)}
        onConfirm={() => { const t = ask; setAsk(null); void restore(t, true); }}
      />}
    </div>
  );
}

function OccupiedDialog({ date, onCancel, onConfirm }: { date: string; onCancel: () => void; onConfirm: () => void }) {
  useEscClose(true, onCancel);
  return (
    <div className="fixed inset-0 z-[96] flex items-center justify-center px-6 bg-black/30" onClick={onCancel}>
      <div role="alertdialog" aria-modal="true" aria-label="장 되살리기"
           className="w-full max-w-xs rounded-2xl bg-[var(--sd-card-solid)] p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-[18px] font-bold text-[var(--sd-ink)]">장 되살리기</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-[var(--sd-ink)]">
          {dateLabel(date)}에 새로 쓴 장이 있어요. 지금 장은 휴지통으로 가고 지운 장이 돌아와요.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="min-h-[44px] px-4 text-[14px] text-[var(--sd-muted)] active:opacity-60">취소</button>
          <button type="button" onClick={onConfirm}
                  className="min-h-[44px] px-4 rounded-xl text-[14px] font-semibold text-white active:scale-[0.98]"
                  style={{ background: ROSE_SOLID }}>
            되살리기
          </button>
        </div>
      </div>
    </div>
  );
}
