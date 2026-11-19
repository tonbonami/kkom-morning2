// src/components/diary/DiaryArchiveScreen.tsx
'use client';

/**
 * 「지난 일기」 — 날짜순(최근이 위) 목록. 같은 날 두 사람 장을 카드로 나란히.
 * 우댕 2026-11-18 「이걸 모아보기는 엄청 불편한거 아니야? Aside 한번 검수 받아보자. gpt랑도 논의하고」 → 「1단계 진행」.
 * 회의록 claude.ai/artifact/JgnnGz36UKeKsGGJVPhbzy — GPT 1단계(표지만 읽는 타임라인) + Aside 가 실제로 막힌 일(「꼼이 것만」「사진 있는 날만」)
 *   → 걸러 보기 칩 한 줄. 표지(diaryPages)는 한 달 쿼리 하나로 이미 받으니 걸러도 더 읽지 않는다.
 * 2단계도 표지만 쓴다 — 첫 줄 찾기는 전체 표지를 한 번만 받고, 사진 보기는 표지 photos(옛 장은 thumb)를 쓴다.
 *
 * ⚠️ 장부·감시 금지 — 빈 날은 아예 안 보이고, 장 수·♥ 수·「안 씀」·비교 숫자를 만들지 않는다. 쓰라고 재촉하는 문구도 없음.
 * ⚠️ 본문(content/main)은 읽지 않는다 — 카드는 표지의 첫 줄(excerpt)·대표 그림(thumb)만. 대표 그림은 「장 전체 미리보기」처럼
 *    크게 깔지 않는다(첫 사진·첫 스티커일 뿐).
 */
import React from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Image as ImageIcon, Loader2, Search, X } from 'lucide-react';
import type { Person } from '@/lib/diaryTypes';
import { fetchAllDiaryMeta, type DiaryMeta } from '@/lib/diary';

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
  query: string;
  shown: number;
  onWho: (w: ArchiveWho) => void;
  onPhotoOnly: (v: boolean) => void;
  onQuery: (v: string) => void;
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
const normalized = (s: string) => s.toLocaleLowerCase('ko-KR').replace(/\s/g, '');
const photosOf = (m: DiaryMeta) => m.photos?.length ? m.photos : m.hasPhoto && m.thumb ? [m.thumb] : [];

export function DiaryArchiveScreen({
  me, ym, today, metas, who, photoOnly, query: searchText, shown, onWho, onPhotoOnly, onQuery, onMore, onYm, onOpen, onBack,
}: DiaryArchiveScreenProps): React.JSX.Element {
  const partner: Person = me === '우댕' ? '꼼이' : '우댕';
  const order: Person[] = [me, partner];
  const thisYm = today.slice(0, 7);
  const canNext = ym < thisYm;
  const canPrev = ym > DIARY_START_YM;
  const prevYm = shiftYm(ym, -1);
  const needle = normalized(searchText);
  const searching = needle.length > 0;
  const [allMetas, setAllMetas] = React.useState<DiaryMeta[] | null>(null);
  const [searchError, setSearchError] = React.useState(false);
  const [searchTry, setSearchTry] = React.useState(0);
  const [monthPicker, setMonthPicker] = React.useState(false);

  // 첫 검색 때만 전체 표지를 받고, 이후에는 메모리에서 첫 줄을 찾는다.
  React.useEffect(() => {
    if (!searching || allMetas) return;
    let alive = true;
    setSearchError(false);
    void fetchAllDiaryMeta().then((list) => { if (alive) setAllMetas(list); }).catch(() => { if (alive) setSearchError(true); });
    return () => { alive = false; };
  }, [searching, allMetas, searchTry]);

  const source = searching ? allMetas : metas;
  const filtered = React.useMemo(() => {
    if (!source) return [];
    return source.filter((m) => {
      if (!searching && !m.date.startsWith(ym)) return false;
      if (who !== 'both' && m.owner !== who) return false;
      if (photoOnly && !m.hasPhoto) return false;
      return !searching || normalized(m.excerpt).includes(needle);
    }).sort((a, b) => b.date.localeCompare(a.date) || order.indexOf(a.owner) - order.indexOf(b.owner));
  }, [source, searching, ym, who, photoOnly, needle, order]);

  // 날짜별 묶기(최근이 위). 거르기는 받은 표지 안에서만.
  const days = React.useMemo(() => {
    const by = new Map<string, Partial<Record<Person, DiaryMeta>>>();
    for (const m of filtered) {
      const g = by.get(m.date) ?? {};
      g[m.owner] = m;
      by.set(m.date, g);
    }
    return [...by.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [filtered]);
  const visible = days.slice(0, shown);
  const photoTiles = React.useMemo(() => filtered.flatMap((m) => photosOf(m).map((src, i) => ({ key: `${m.id}-${i}`, src, meta: m }))), [filtered]);
  const visiblePhotos = photoTiles.slice(0, shown);
  const loading = searching ? allMetas === null && !searchError : metas === null;
  const resultLength = photoOnly ? photoTiles.length : days.length;

  const monthGroups = React.useMemo(() => {
    const groups: { year: string; months: string[] }[] = [];
    for (let cur = thisYm; cur >= DIARY_START_YM; cur = shiftYm(cur, -1)) {
      const year = cur.slice(0, 4);
      const last = groups[groups.length - 1];
      if (!last || last.year !== year) groups.push({ year, months: [cur] });
      else last.months.push(cur);
    }
    return groups;
  }, [thisYm]);

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
          <button type="button" disabled={!canPrev || searching} onClick={() => onYm(prevYm)} aria-label="지난달" className="w-11 h-11 flex items-center justify-center text-[var(--sd-muted)] disabled:opacity-20 active:scale-95">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button type="button" onClick={() => setMonthPicker(true)} aria-haspopup="dialog" className="min-w-[128px] min-h-[44px] flex items-center justify-center gap-1 text-[15px] font-semibold text-[var(--sd-ink)] active:scale-95">
            {searching ? '모든 달' : ymLabel(ym)} <ChevronDown className="w-4 h-4 text-[var(--sd-muted)]" />
          </button>
          <button type="button" disabled={searching} onClick={() => onYm(shiftYm(ym, 1))} aria-label="다음 달" className={`w-11 h-11 flex items-center justify-center text-[var(--sd-muted)] disabled:opacity-20 active:scale-95 ${canNext ? '' : 'invisible'}`}>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="px-4 pb-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--sd-faint)] pointer-events-none" />
            <input
              type="text" inputMode="search" enterKeyHint="search"
              value={searchText}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="첫 줄로 찾아요"
              aria-label="첫 줄로 찾기"
              className="w-full h-10 pl-9 pr-9 appearance-none rounded-xl border border-[var(--sd-line)] bg-[var(--sd-card-solid)] text-[14px] text-[var(--sd-ink)] placeholder:text-[var(--sd-faint)] outline-none focus:border-[var(--sd-muted)]"
            />
            {searchText && (
              <button type="button" onClick={() => onQuery('')} aria-label="찾기 지우기" className="absolute right-0 top-0 w-10 h-10 flex items-center justify-center text-[var(--sd-muted)] active:scale-95">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
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
            사진
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 pt-4 pb-8">
        {loading ? (
          <div className="py-16 flex items-center justify-center gap-1.5 text-xs text-[var(--sd-muted)]">
            <Loader2 className="w-4 h-4 animate-spin" /> 불러오는 중이에요
          </div>
        ) : searchError ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <p className="text-[14px] text-[var(--sd-muted)]">찾아보지 못했어요.</p>
            <button type="button" onClick={() => setSearchTry((n) => n + 1)} className="min-h-[44px] px-5 rounded-full border border-[var(--sd-line)] text-[13px] font-medium text-[var(--sd-ink)] bg-[var(--sd-card-solid)] active:bg-[var(--sd-surface-2)]">다시 찾기</button>
          </div>
        ) : resultLength === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <p className="text-[14px] text-[var(--sd-muted)]">
              {searching ? '찾는 글이 없어요.' : who === 'both' && !photoOnly ? '이 달에 펼쳐볼 장이 아직 없어요.' : '이 달엔 고른 조건에 맞는 장이 없어요.'}
            </p>
            {!searching && canPrev ? (
              <button type="button" onClick={() => onYm(prevYm)} className="min-h-[44px] px-5 rounded-full border border-[var(--sd-line)] text-[13px] font-medium text-[var(--sd-ink)] bg-[var(--sd-card-solid)] active:bg-[var(--sd-surface-2)]">
                이전 달 보기
              </button>
            ) : !searching ? (
              <p className="text-[12px] text-[var(--sd-faint)]">다이어리는 2026년 11월에 시작했어요</p>
            ) : null}
          </div>
        ) : photoOnly ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-2">
              {visiblePhotos.map(({ key, src, meta }) => (
                <button key={key} type="button" onClick={() => onOpen(meta.date, meta.owner)} aria-label={`${dateHead(meta.date)} ${meta.owner}의 장 보기`} className="aspect-square rounded-xl overflow-hidden bg-[var(--sd-surface-2)] active:scale-[0.98] transition-transform">
                  <img src={src} alt="" loading="lazy" decoding="async" draggable={false} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            {photoTiles.length > shown ? (
              <button type="button" onClick={onMore} className="min-h-[44px] rounded-xl border border-[var(--sd-line)] text-[13px] font-medium text-[var(--sd-muted)] bg-[var(--sd-card-solid)] active:bg-[var(--sd-surface-2)]">더 보기</button>
            ) : !searching && canPrev ? (
              <button type="button" onClick={() => onYm(prevYm)} className="min-h-[44px] rounded-xl border border-[var(--sd-line)] text-[13px] font-medium text-[var(--sd-ink)] bg-[var(--sd-card-solid)] active:bg-[var(--sd-surface-2)]">{Number(prevYm.slice(5, 7))}월 기록 보기</button>
            ) : !searching ? (
              <p className="text-center text-[12px] text-[var(--sd-faint)]">다이어리는 2026년 11월에 시작했어요</p>
            ) : null}
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
            ) : !searching && canPrev ? (
              <button type="button" onClick={() => onYm(prevYm)} className="min-h-[44px] rounded-xl border border-[var(--sd-line)] text-[13px] font-medium text-[var(--sd-ink)] bg-[var(--sd-card-solid)] active:bg-[var(--sd-surface-2)]">
                {Number(prevYm.slice(5, 7))}월 기록 보기
              </button>
            ) : !searching ? (
              <p className="text-center text-[12px] text-[var(--sd-faint)]">다이어리는 2026년 11월에 시작했어요</p>
            ) : null}
          </div>
        )}
      </main>

      {monthPicker && (
        <div onClick={() => setMonthPicker(false)} className="fixed inset-0 z-[70] flex items-end justify-center bg-black/25">
          <section onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="연월 고르기" className="w-full max-w-md max-h-[72dvh] overflow-hidden rounded-t-3xl border-t border-[var(--sd-line)] bg-[var(--sd-card-solid)] shadow-2xl">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[var(--sd-line)]">
              <h2 className="text-[16px] font-semibold text-[var(--sd-ink)]">연·월 고르기</h2>
              <button type="button" onClick={() => setMonthPicker(false)} aria-label="닫기" className="w-10 h-10 flex items-center justify-center text-[var(--sd-muted)] active:scale-95"><X className="w-5 h-5" /></button>
            </div>
            <div className="overflow-y-auto px-5 pt-4 pb-[calc(env(safe-area-inset-bottom)+20px)]">
              {monthGroups.map((g) => (
                <div key={g.year} className="mb-5 last:mb-0">
                  <h3 className="mb-2 text-[13px] font-semibold text-[var(--sd-muted)]">{g.year}년</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {g.months.map((m) => (
                      <button key={m} type="button" aria-current={m === ym ? 'date' : undefined} onClick={() => { onQuery(''); onYm(m); setMonthPicker(false); }} className={`min-h-[44px] rounded-xl border text-[14px] font-medium active:scale-[0.98] ${m === ym ? 'bg-[var(--sd-ink)] text-white border-[var(--sd-ink)]' : 'bg-[var(--sd-card-solid)] text-[var(--sd-ink)] border-[var(--sd-line)]'}`}>
                        {Number(m.slice(5, 7))}월
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
