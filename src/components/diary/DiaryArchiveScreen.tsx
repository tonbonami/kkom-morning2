// src/components/diary/DiaryArchiveScreen.tsx
'use client';

/**
 * 「지난 일기」 — 날짜순(최근이 위) 목록. 같은 날 두 사람 장을 카드로 나란히.
 * 우댕 2026-11-18 「이걸 모아보기는 엄청 불편한거 아니야? Aside 한번 검수 받아보자. gpt랑도 논의하고」 → 「1단계 진행」.
 * 회의록 claude.ai/artifact/JgnnGz36UKeKsGGJVPhbzy — GPT 1단계(표지만 읽는 타임라인) + Aside 가 실제로 막힌 일(「꼼이 것만」「사진 있는 날만」)
 *   → 걸러 보기 칩 한 줄. 표지(diaryPages)는 한 달 쿼리 하나로 이미 받으니 걸러도 더 읽지 않는다.
 *
 * ⚠️ 장부·감시 금지 — 빈 날은 아예 안 보이고, 장 수·♥ 수·「안 씀」·비교 숫자를 만들지 않는다. 쓰라고 재촉하는 문구도 없음.
 * ⚠️ 본문(content/main)은 읽지 않는다 — 카드는 표지의 첫 줄(excerpt)·대표 그림(thumb)만. 대표 그림은 「장 전체 미리보기」처럼
 *    크게 깔지 않는다(첫 사진·첫 스티커일 뿐).
 */
import React from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon, Loader2 } from 'lucide-react';
import type { Person } from '@/lib/diaryTypes';
import type { DiaryMeta } from '@/lib/diary';

export type ArchiveWho = 'both' | Person;
/** 다이어리를 처음 쓴 달 — 이보다 앞으로는 안 간다(빈 달을 끝없이 넘기지 않게) */
export const DIARY_START_YM = '2026-11';
export const ARCHIVE_STEP = 12;

const WD = ['일', '월', '화', '수', '목', '금', '토'];

export interface DiaryArchiveScreenProps {
  me: Person;
  ym: string;
  today: string;
  /** 이 달 표지(다른 달 것이 섞여 와도 여기서 거른다) — null 이면 아직 받는 중 */
  metas: DiaryMeta[] | null;
  who: ArchiveWho;
  photoOnly: boolean;
  shown: number;
  onWho: (w: ArchiveWho) => void;
  onPhotoOnly: (v: boolean) => void;
  onMore: () => void;
  onYm: (ym: string) => void;
  onOpen: (date: string, owner: Person) => void;
  onBack: () => void;
}

const shiftYm = (ym: string, n: number) => {
  const t = new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1 + n, 1);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}`;
};
const ymLabel = (ym: string) => `${ym.slice(0, 4)}년 ${Number(ym.slice(5, 7))}월`;

export function DiaryArchiveScreen({
  me, ym, today, metas, who, photoOnly, shown, onWho, onPhotoOnly, onMore, onYm, onOpen, onBack,
}: DiaryArchiveScreenProps): React.JSX.Element {
  const partner: Person = me === '우댕' ? '꼼이' : '우댕';
  const order: Person[] = [me, partner];
  const thisYm = today.slice(0, 7);
  const canNext = ym < thisYm;
  const canPrev = ym > DIARY_START_YM;
  const prevYm = shiftYm(ym, -1);

  // 날짜별 묶기(최근이 위). 거르기는 받은 표지 안에서만.
  const days = React.useMemo(() => {
    if (!metas) return [];
    const by = new Map<string, Partial<Record<Person, DiaryMeta>>>();
    for (const m of metas) {
      if (!m.date.startsWith(ym)) continue;
      if (who !== 'both' && m.owner !== who) continue;
      if (photoOnly && !m.hasPhoto) continue;
      const g = by.get(m.date) ?? {};
      g[m.owner] = m;
      by.set(m.date, g);
    }
    return [...by.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [metas, ym, who, photoOnly]);
  const visible = days.slice(0, shown);

  const dateHead = (d: string) => {
    const t = new Date(d + 'T00:00:00');
    const base = `${t.getMonth() + 1}월 ${t.getDate()}일 ${WD[t.getDay()]}요일`;
    return d.slice(0, 4) === today.slice(0, 4) ? base : `${d.slice(0, 4)}년 ${base}`;
  };

  const chip = (on: boolean) =>
    `shrink-0 min-h-[36px] px-3.5 rounded-full text-[13px] font-medium border transition-colors ${
      on ? 'bg-[var(--sd-ink)] text-white border-[var(--sd-ink)]' : 'bg-[var(--sd-card-solid)] text-[var(--sd-muted)] border-[var(--sd-line)]'
    }`;

  const card = (m: DiaryMeta, full: boolean) => (
    <button
      key={m.id}
      type="button"
      onClick={() => onOpen(m.date, m.owner)}
      className={`${full ? 'col-span-2' : ''} min-h-[96px] text-left rounded-2xl bg-[var(--sd-card-solid)] border border-[var(--sd-line)] shadow-sm overflow-hidden flex flex-col active:scale-[0.99] transition-transform`}
    >
      {m.thumb && (
        <div className={`w-full ${full ? 'aspect-[3/1.4]' : 'aspect-[3/2]'} bg-[var(--sd-surface-2)] overflow-hidden`}>
          <img
            src={m.thumb}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            className={`w-full h-full ${m.hasPhoto ? 'object-cover' : 'object-contain p-3'}`}
          />
        </div>
      )}
      <div className="flex-1 p-3 flex flex-col gap-1">
        <span className="text-[12px] font-semibold text-[var(--sd-muted)]">{m.owner}</span>
        <div className="flex items-end gap-1">
          <p className="flex-1 min-w-0 text-[14px] leading-snug text-[var(--sd-ink)] line-clamp-2 break-words">
            {m.excerpt || <span className="text-[var(--sd-muted)]">이날의 장 보기</span>}
          </p>
          <ChevronRight className="w-4 h-4 shrink-0 text-[var(--sd-faint)]" />
        </div>
      </div>
    </button>
  );

  return (
    <div className="relative w-full max-w-md mx-auto min-h-screen bg-[#FCFAF7] flex flex-col" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <header className="sticky top-0 z-30 bg-[#FCFAF7]/95 backdrop-blur border-b border-[var(--sd-line)]" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="grid grid-cols-[52px_1fr_52px] items-center px-2 py-1">
          <button type="button" onClick={onBack} aria-label="돌아가기" className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--sd-ink)] active:scale-95">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-center font-['Dongle'] text-3xl leading-none text-[var(--sd-ink)]">지난 일기</h1>
          <span />
        </div>
        <div className="flex items-center justify-center gap-1 pb-1">
          <button type="button" disabled={!canPrev} onClick={() => onYm(prevYm)} aria-label="지난달" className="w-11 h-11 flex items-center justify-center text-[var(--sd-muted)] disabled:opacity-20 active:scale-95">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="min-w-[112px] text-center text-[15px] font-semibold text-[var(--sd-ink)]">{ymLabel(ym)}</span>
          <button type="button" onClick={() => onYm(shiftYm(ym, 1))} aria-label="다음 달" className={`w-11 h-11 flex items-center justify-center text-[var(--sd-muted)] active:scale-95 ${canNext ? '' : 'invisible'}`}>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-1.5 px-4 pb-2.5 overflow-x-auto">
          {(['both', me, partner] as ArchiveWho[]).map((w) => (
            <button key={w} type="button" onClick={() => onWho(w)} aria-pressed={who === w} className={chip(who === w)}>
              {w === 'both' ? '둘 다' : w}
            </button>
          ))}
          <span className="shrink-0 w-px h-5 bg-[var(--sd-line)] mx-0.5" aria-hidden />
          <button type="button" onClick={() => onPhotoOnly(!photoOnly)} aria-pressed={photoOnly} className={`${chip(photoOnly)} flex items-center gap-1`}>
            <ImageIcon className="w-3.5 h-3.5" />
            사진 있는 날
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 pt-4 pb-8">
        {metas === null ? (
          <div className="py-16 flex items-center justify-center gap-1.5 text-xs text-[var(--sd-muted)]">
            <Loader2 className="w-4 h-4 animate-spin" /> 불러오는 중이에요
          </div>
        ) : days.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <p className="text-[14px] text-[var(--sd-muted)]">
              {who === 'both' && !photoOnly ? '이 달에 펼쳐볼 장이 아직 없어요.' : '이 달엔 고른 조건에 맞는 장이 없어요.'}
            </p>
            {canPrev ? (
              <button type="button" onClick={() => onYm(prevYm)} className="min-h-[44px] px-5 rounded-full border border-[var(--sd-line)] text-[13px] font-medium text-[var(--sd-ink)] bg-[var(--sd-card-solid)] active:bg-[var(--sd-surface-2)]">
                이전 달 보기
              </button>
            ) : (
              <p className="text-[12px] text-[var(--sd-faint)]">다이어리는 2026년 11월에 시작했어요</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {visible.map(([d, g]) => {
              const pages = order.map((p) => g[p]).filter((x): x is DiaryMeta => !!x);
              return (
                <section key={d}>
                  <h2 className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-[var(--sd-ink)]">
                    {dateHead(d)}
                    {d === today && <span className="px-1.5 py-px rounded-full text-[11px] font-medium bg-[var(--sd-rel-soft)] text-[var(--sd-rel)]">오늘</span>}
                  </h2>
                  <div className="grid grid-cols-2 gap-2 items-start">
                    {pages.map((m) => card(m, pages.length === 1))}
                  </div>
                </section>
              );
            })}

            {days.length > shown ? (
              <button type="button" onClick={onMore} className="min-h-[44px] rounded-xl border border-[var(--sd-line)] text-[13px] font-medium text-[var(--sd-muted)] bg-[var(--sd-card-solid)] active:bg-[var(--sd-surface-2)]">
                더 보기
              </button>
            ) : canPrev ? (
              <button type="button" onClick={() => onYm(prevYm)} className="min-h-[44px] rounded-xl border border-[var(--sd-line)] text-[13px] font-medium text-[var(--sd-ink)] bg-[var(--sd-card-solid)] active:bg-[var(--sd-surface-2)]">
                {Number(prevYm.slice(5, 7))}월 기록 보기
              </button>
            ) : (
              <p className="text-center text-[12px] text-[var(--sd-faint)]">다이어리는 2026년 11월에 시작했어요</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
