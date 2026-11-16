'use client';

// 다꾸 다이어리 **시안 시험 화면** — Gemini 시안(docs/gemini-diary-*.md) 부품을 가짜 데이터로 직접 만져 본다.
//   아무것도 저장하지 않는다(새로 고치면 처음으로). 스티커는 진짜 꼼모닝 팩(꿀됑·말티푸·우리)을 쓴다.
//   /diary/test            내 오늘 장(꾸며 보기)   · ?v=empty 빈 장 · ?v=partner 상대 장 보기
//   ?v=drawer 스티커 서랍 · ?v=special 기념일 관리 · ?v=home 홈 카드
//   ?v=cal 월간 꾸미기 달력(같이|우댕|꼼이) · ?v=caldeco 꾸미기 모드로 시작 — 하루 장의 날짜를 눌러도 달력으로 간다
//   ?v=real&practice=1 진짜 화면(DiaryApp)을 로그인 없이 — 연습 모드(저장 안 함)나 에뮬레이터(&emu=1)일 때만 열린다 · &as=꼼이
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DiaryDayScreen } from '@/components/diary/DiaryDayScreen';
import { DiaryAssetDrawer } from '@/components/diary/DiaryAssetDrawer';
import { DiaryMonthScreen } from '@/components/diary/DiaryMonthScreen';
import { DiaryMonthMemoSheet } from '@/components/diary/DiaryMonthMemoSheet';
import { DiaryMonthSpanSheet } from '@/components/diary/DiaryMonthSpanSheet';
import { DiarySpecialDatesSheet } from '@/components/diary/DiarySpecialDatesSheet';
import { DiaryHomeCard } from '@/components/diary/DiaryHomeCard';
import { DiaryApp } from '@/components/diary/DiaryApp';
import { isPractice } from '@/lib/practice';
import { usingEmulator } from '@/lib/firebase';
import { DECOR_ASSETS } from '@/components/diary/DiaryDecor';
import { KKUL_STICKERS, SAI_STICKERS, URI_STICKERS } from '@/lib/stickerPacks';
import {
  DIARY_LIMITS, MONTH_LIMITS, type DiaryAssetVM, type DiaryItemAction, type DiaryItemVM, type DiaryMonthCellVM, type DiaryPageVM,
  type DiaryPaperTheme, type MonthOwner, type MonthSpanVM, type MonthStickerVM, type MonthTitleStyle, type MonthTool, type Person, type SpecialDateVM,
} from '@/lib/diaryTypes';

const ME: Person = '우댕';
const TODAY = '2026-11-17';
const WD = ['일', '월', '화', '수', '목', '금', '토'];
const labelOf = (d: string) => { const t = new Date(d + 'T00:00:00'); return `${t.getMonth() + 1}월 ${t.getDate()}일 ${WD[t.getDay()]}요일`; };
const shift = (d: string, n: number) => { const t = new Date(d + 'T00:00:00'); t.setDate(t.getDate() + n); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; };

const STICKER = (pack: string, list: { word: string; image: string }[]): DiaryAssetVM[] =>
  list.map((s, i) => ({ id: `${pack}-${i}`, kind: 'sticker', src: s.image, label: s.word }));
const ASSETS: Record<string, DiaryAssetVM[]> = {
  kkom: STICKER('kkom', SAI_STICKERS),
  kkul: STICKER('kkul', KKUL_STICKERS),
  uri: STICKER('uri', URI_STICKERS),
  tape: DECOR_ASSETS.filter((d) => d.kind === 'tape').map((d) => ({ id: d.id, kind: 'tape', decorId: d.id, label: d.label })),
  stamp: DECOR_ASSETS.filter((d) => d.kind === 'stamp').map((d) => ({ id: d.id, kind: 'stamp', decorId: d.id, label: d.label })),
};
const TABS = [
  { id: 'recent', label: '최근' }, { id: 'favorite', label: '즐겨찾기' }, { id: 'kkom', label: '꼼이' },
  { id: 'kkul', label: '꿀됑' }, { id: 'uri', label: '우리' }, { id: 'tape', label: '테이프' }, { id: 'stamp', label: '도장' },
];
const ratioOfDecor = (id?: string) => DECOR_ASSETS.find((d) => d.id === id)?.ratio ?? 1;

const SAMPLE: DiaryItemVM[] = [
  { id: 's1', type: 'tape', decorId: 'tape-honey', x: 0.5, y: 0.2, w: 0.42, ratio: 0.22, rotation: -4, z: 1 },
  { id: 's2', type: 'sticker', src: '/emo/uri/04-mukbang.webp', x: 0.74, y: 0.66, w: 0.34, ratio: 1, rotation: 6, z: 2 },
  { id: 's3', type: 'stamp', decorId: 'stamp-yummy', x: 0.26, y: 0.8, w: 0.3, ratio: 0.6, rotation: -8, z: 3 },
  { id: 's4', type: 'sticker', src: '/emo/kkuldaeng/17-yaho.webp', x: 0.24, y: 0.56, w: 0.26, ratio: 1, rotation: -5, z: 4 },
];
const START: Record<string, DiaryPageVM> = {
  [`${TODAY}_우댕`]: { date: TODAY, owner: '우댕', theme: 'cream', text: '퇴근하고 꼼이랑 칼국수 먹은 날.\n국물이 진짜 진했다. 다음엔 만두도 시켜야지.', items: SAMPLE },
  [`${TODAY}_꼼이`]: { date: TODAY, owner: '꼼이', theme: 'lined', text: '우댕이 면을 코에 붙이고 웃었다.\n사진 찍어 둘걸.', items: [
    { id: 'k1', type: 'sticker', src: '/emo/sai/hehe.webp', x: 0.7, y: 0.7, w: 0.32, ratio: 1, rotation: 5, z: 1 },
    { id: 'k2', type: 'tape', decorId: 'tape-sage', x: 0.3, y: 0.22, w: 0.4, ratio: 0.22, rotation: 3, z: 2 },
  ] },
};

function Real() {
  const sp = useSearchParams();
  // 진짜 데이터에 쓰면 안 되니까 연습 모드나 에뮬레이터가 아니면 안 연다(서버 그림과 어긋나지 않게 붙은 뒤에 판단).
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => setOk(isPractice() || usingEmulator), []);
  if (ok === null) return null;
  if (!ok) return <div className="sd-app min-h-screen p-6 text-sm">주소에 <b>&practice=1</b>(저장 안 함) 또는 <b>&emu=1</b>(에뮬레이터)을 붙여야 열려요.</div>;
  return <DiaryApp me={sp.get('as') === '꼼이' ? '꼼이' : '우댕'} initialDate={sp.get('d') ?? undefined} onExit={() => {}} />;
}

function Test() {
  const v = useSearchParams().get('v') ?? '';
  const [date, setDate] = useState(TODAY);
  const [owner, setOwner] = useState<Person>(v === 'partner' ? '꼼이' : ME);
  const [pages, setPages] = useState<Record<string, DiaryPageVM>>(v === 'empty' ? {} : START);
  const [sel, setSel] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(v === 'drawer');
  const [tab, setTab] = useState('kkul');
  // ── 월간 꾸미기 달력(같이 | 우댕 | 꼼이) — 메모리에만 ──
  const [view, setView] = useState<'day' | 'month'>(v === 'cal' || v === 'caldeco' ? 'month' : 'day');
  const [mOwner, setMOwner] = useState<MonthOwner>('together');
  const [mMode, setMMode] = useState<'view' | 'decorate'>(v === 'caldeco' ? 'decorate' : 'view');
  const [tool, setTool] = useState<MonthTool | null>(v === 'caldeco' ? 'sticker' : null);
  const [picked, setPicked] = useState<DiaryAssetVM | null>(ASSETS.kkul[1]);
  const [spanStart, setSpanStart] = useState<string | null>(null);
  const [spanEdit, setSpanEdit] = useState<{ id?: string; start: string; end: string; label: string; decorId: string } | null>(null);
  const [memoDate, setMemoDate] = useState<string | null>(null);
  type MonthDeco = { stickers: Record<string, MonthStickerVM[]>; memos: Record<string, string>; spans: MonthSpanVM[]; hero: MonthStickerVM | null; margin: MonthStickerVM[]; title: MonthTitleStyle };
  const emptyDeco = (): MonthDeco => ({ stickers: {}, memos: {}, spans: [], hero: null, margin: [], title: 'plain' });
  const [decos, setDecos] = useState<Record<string, MonthDeco>>({
    together: {
      stickers: { '2026-11-08': [{ id: 'a1', src: '/emo/uri/04-mukbang.webp', by: '꼼이' }], '2026-11-14': [{ id: 'a2', src: '/emo/kkuldaeng/02-saranghae.webp', by: '우댕' }, { id: 'a3', src: '/emo/sai/hehe.webp', by: '꼼이' }], '2026-11-17': [{ id: 'a4', src: '/emo/kkuldaeng/17-yaho.webp', by: '우댕' }] },
      memos: { '2026-11-08': '칼국수', '2026-11-14': '영화 데이트', '2026-11-27': '월급날' },
      spans: [{ id: 'sp1', startDate: '2026-11-21', endDate: '2026-11-23', label: '제주 여행', decorId: 'tape-sky' }, { id: 'sp2', startDate: '2026-11-04', endDate: '2026-11-06', label: '시험', decorId: 'tape-apricot' }],
      hero: { id: 'h', src: '/emo/uri/01-morning.webp' }, margin: [{ id: 'm1', src: '/emo/kkuldaeng/11-gomawo.webp' }, { id: 'm2', decorId: 'stamp-love' }], title: 'brush',
    },
    '우댕': { ...emptyDeco(), memos: { '2026-11-19': '치과' }, title: 'round' },
    '꼼이': { ...emptyDeco(), stickers: { '2026-11-20': [{ id: 'k9', src: '/emo/sai/goodnight.webp', by: '꼼이' }] } },
  });
  const [undo, setUndo] = useState<{ text: string; prev: Record<string, MonthDeco> } | null>(null);
  const deco = decos[mOwner] ?? emptyDeco();
  const canEditMonth = mOwner === 'together' || mOwner === ME;
  const setDeco = (fn: (d: MonthDeco) => MonthDeco, undoText?: string) => setDecos((all) => {
    if (undoText) setUndo({ text: undoText, prev: all });
    return { ...all, [mOwner]: fn(all[mOwner] ?? emptyDeco()) };
  });
  const stickerOf = (a: DiaryAssetVM): MonthStickerVM => ({ id: `ms${Date.now()}`, src: a.src, decorId: a.decorId, by: ME });
  const [special, setSpecial] = useState(v === 'special');
  const [recent, setRecent] = useState<DiaryAssetVM[]>([]);
  const [fav, setFav] = useState<Set<string>>(new Set());
  const [specials, setSpecials] = useState<SpecialDateVM[]>([
    { id: 'a', label: '꼼이 생일', kind: 'birthday', monthDay: '09-28', owner: '꼼이', sticker: { id: 'sa', src: '/emo/sai/hehe.webp' } },
    { id: 'b', label: '우댕 생일', kind: 'birthday', monthDay: '03-19', owner: '우댕' },
    { id: 'c', label: '우리 처음 만난 날', kind: 'anniversary', monthDay: '09-28', startYear: 2023, owner: 'together' },
    { id: 'd', label: '김장하는 날', kind: 'custom', monthDay: '11-11', owner: 'together', sticker: { id: 'sd', src: '/emo/kkuldaeng/06-baegopa.webp' } },
    { id: 'e', label: '첫 여행 간 날', kind: 'anniversary', monthDay: '11-25', startYear: 2023, owner: 'together' },
  ]);

  const key = `${date}_${owner}`;
  const page: DiaryPageVM = pages[key] ?? { date, owner, theme: 'cream', text: '', items: [] };
  const mine = owner === ME;
  const put = (fn: (p: DiaryPageVM) => DiaryPageVM) => setPages((all) => ({ ...all, [key]: fn(all[key] ?? { date, owner, theme: 'cream', text: '', items: [] }) }));
  const topZ = Math.max(0, ...page.items.map((i) => i.z));

  const addItem = (it: Omit<DiaryItemVM, 'id' | 'z' | 'x' | 'y' | 'rotation'>) => {
    if (page.items.length >= DIARY_LIMITS.items) return;
    const id = `i${Date.now()}`;
    put((p) => ({ ...p, items: [...p.items, { ...it, id, x: 0.5, y: 0.5, rotation: 0, z: topZ + 1 }] }));
    setSel(id);
  };
  const act = (a: DiaryItemAction) => {
    if (!sel) return;
    put((p) => {
      const cur = p.items.find((i) => i.id === sel);
      if (!cur) return p;
      if (a === 'delete') return { ...p, items: p.items.filter((i) => i.id !== sel) };
      if (a === 'duplicate') {
        if (p.items.length >= DIARY_LIMITS.items) return p;
        return { ...p, items: [...p.items, { ...cur, id: `i${Date.now()}`, x: Math.min(0.95, cur.x + 0.06), y: Math.min(0.95, cur.y + 0.05), z: topZ + 1 }] };
      }
      const next = { ...cur };
      if (a === 'smaller') next.w = Math.max(0.1, cur.w * 0.87);
      if (a === 'larger') next.w = Math.min(0.95, cur.w * 1.15);
      if (a === 'rotateLeft') next.rotation = cur.rotation - 15;
      if (a === 'rotateRight') next.rotation = cur.rotation + 15;
      if (a === 'front') next.z = topZ + 1;
      return { ...p, items: p.items.map((i) => (i.id === sel ? next : i)) };
    });
    if (a === 'delete') setSel(null);
  };

  const assets = useMemo(() => {
    const base = tab === 'recent' ? recent : tab === 'favorite' ? Object.values(ASSETS).flat().filter((x) => fav.has(x.id)) : ASSETS[tab] ?? [];
    return base.map((x) => ({ ...x, favorite: fav.has(x.id) }));
  }, [tab, recent, fav]);

  const cells = useMemo<DiaryMonthCellVM[]>(() => {
    const first = new Date(date.slice(0, 7) + '-01T00:00:00');
    const start = shift(date.slice(0, 7) + '-01', -first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = shift(start, i);
      const md = d.slice(5);
      return {
        date: d, day: Number(d.slice(8)), inMonth: d.slice(0, 7) === date.slice(0, 7), isToday: d === TODAY, holiday: false,
        stickers: deco.stickers[d] ?? [], memo: deco.memos[d],
        specials: specials.filter((sp) => sp.monthDay === md).map((sp) => ({ id: sp.id, label: sp.label, kind: sp.kind, years: sp.startYear ? Number(d.slice(0, 4)) - sp.startYear : undefined, sticker: sp.sticker })),
        mine: !!pages[`${d}_${ME}`] || ['2026-11-03', '2026-11-08', '2026-11-12'].includes(d),
        partner: !!pages[`${d}_꼼이`] || ['2026-11-08', '2026-11-14'].includes(d),
      };
    });
  }, [date, deco, pages, specials]);
  const dayLabelShort = (d: string) => `${Number(d.slice(5, 7))}월 ${Number(d.slice(8))}일`;

  if (v === 'home') {
    return (
      <div className="sd-app min-h-screen p-4 grid grid-cols-2 gap-3 max-w-md mx-auto content-start">
        <div className="col-span-2 min-h-[140px]"><DiaryHomeCard dateLabel={labelOf(TODAY)} excerpt="퇴근하고 꼼이랑 칼국수 먹은 날." thumbSrc="/emo/uri/04-mukbang.webp" partnerWroteToday onOpen={() => {}} /></div>
        <div className="col-span-2 min-h-[140px]"><DiaryHomeCard dateLabel={labelOf(TODAY)} onOpen={() => {}} /></div>
      </div>
    );
  }

  if (view === 'month') {
    const ordered = (a: string, b: string) => (a <= b ? [a, b] : [b, a]);
    return (
      <>
        <DiaryMonthScreen
          me={ME} owner={mOwner} canEdit={canEditMonth}
          monthLabel={`${date.slice(0, 4)}년 ${Number(date.slice(5, 7))}월`} monthNumber={Number(date.slice(5, 7))}
          titleStyle={deco.title} hero={deco.hero} cells={cells} spans={deco.spans} margin={deco.margin}
          upcoming={date.slice(0, 7) === TODAY.slice(0, 7) ? { label: '첫 여행 간 날', daysLeft: 8 } : null}
          mode={canEditMonth ? mMode : 'view'} tool={tool} selectedAsset={picked} spanStart={spanStart}
          undoText={undo?.text ?? null} saveState="saved"
          onBack={() => setView('day')}
          onPrevMonth={() => setDate((d) => shift(d.slice(0, 7) + '-01', -1).slice(0, 7) + '-01')}
          onNextMonth={() => setDate((d) => shift(d.slice(0, 7) + '-28', 7).slice(0, 7) + '-01')}
          onGoThisMonth={() => setDate(TODAY)}
          onChangeOwner={(o) => { setMOwner(o); setSpanStart(null); setUndo(null); }}
          onToggleMode={() => { setMMode((m) => (m === 'view' ? 'decorate' : 'view')); setTool((t) => t ?? 'sticker'); setSpanStart(null); }}
          onPickTool={(t) => { setTool(t); setSpanStart(null); }}
          onOpenAssets={() => setDrawer(true)}
          onTapDay={(d) => {
            if (mMode === 'view' || !canEditMonth) { setDate(d); setView('day'); return; }
            if (tool === 'sticker' && picked) setDeco((x) => ((x.stickers[d]?.length ?? 0) >= MONTH_LIMITS.cellStickers ? x : { ...x, stickers: { ...x.stickers, [d]: [...(x.stickers[d] ?? []), stickerOf(picked)] } }));
            else if (tool === 'span') {
              if (!spanStart) setSpanStart(d);
              else { const [a, b] = ordered(spanStart, d); setSpanEdit({ start: a, end: b, label: '', decorId: 'tape-honey' }); setSpanStart(null); }
            } else if (tool === 'memo') setMemoDate(d);
          }}
          onRemoveSticker={(d, id) => setDeco((x) => ({ ...x, stickers: { ...x.stickers, [d]: (x.stickers[d] ?? []).filter((k) => k.id !== id) } }), '스티커를 지웠어요')}
          onRemoveMemo={(d) => setDeco((x) => { const m = { ...x.memos }; delete m[d]; return { ...x, memos: m }; }, '메모를 지웠어요')}
          onTapSpan={(id) => {
            const sp = deco.spans.find((k) => k.id === id); if (!sp) return;
            if (tool === 'erase') setDeco((x) => ({ ...x, spans: x.spans.filter((k) => k.id !== id) }), '기간 테이프를 뗐어요');
            else setSpanEdit({ id, start: sp.startDate, end: sp.endDate, label: sp.label, decorId: sp.decorId });
          }}
          onTapHero={() => (tool === 'erase' ? setDeco((x) => ({ ...x, hero: null }), '머리 그림을 뺐어요') : picked && setDeco((x) => ({ ...x, hero: stickerOf(picked) })))}
          onTapMargin={(i) => {
            if (tool === 'erase') setDeco((x) => ({ ...x, margin: x.margin.filter((_, k) => k !== i) }), '여백 스티커를 뗐어요');
            else if (picked) setDeco((x) => (i < x.margin.length ? { ...x, margin: x.margin.map((k, n) => (n === i ? stickerOf(picked) : k)) } : x.margin.length >= MONTH_LIMITS.margin ? x : { ...x, margin: [...x.margin, stickerOf(picked)] }));
          }}
          onCycleTitleStyle={() => setDeco((x) => ({ ...x, title: x.title === 'plain' ? 'brush' : x.title === 'brush' ? 'round' : 'plain' }))}
          onUndo={() => { if (undo) { setDecos(undo.prev); setUndo(null); } }}
          onOpenSpecialDates={() => setSpecial(true)}
        />
        <DiaryAssetDrawer
          open={drawer && canEditMonth} tabs={TABS} tab={tab} assets={assets}
          onTabChange={setTab}
          onPick={(a) => { setPicked(a); setTool('sticker'); setDrawer(false); }}
          onToggleFavorite={(a) => setFav((st) => { const n = new Set(st); if (n.has(a.id)) n.delete(a.id); else n.add(a.id); return n; })}
          onClose={() => setDrawer(false)}
        />
        <DiaryMonthMemoSheet
          open={!!memoDate} dateLabel={memoDate ? dayLabelShort(memoDate) : ''} value={memoDate ? deco.memos[memoDate] ?? '' : ''}
          onSave={(t) => { const d = memoDate!; setDeco((x) => { const m = { ...x.memos }; if (t.trim()) m[d] = t.trim().slice(0, MONTH_LIMITS.memo); else delete m[d]; return { ...x, memos: m }; }); setMemoDate(null); }}
          onClose={() => setMemoDate(null)}
        />
        <DiaryMonthSpanSheet
          open={!!spanEdit} rangeLabel={spanEdit ? `${dayLabelShort(spanEdit.start)} ~ ${Number(spanEdit.end.slice(8))}일` : ''}
          value={{ label: spanEdit?.label ?? '', decorId: spanEdit?.decorId ?? 'tape-honey' }}
          tapeIds={DECOR_ASSETS.filter((k) => k.kind === 'tape').map((k) => k.id)} canDelete={!!spanEdit?.id}
          onSave={(val) => {
            const e = spanEdit!;
            setDeco((x) => (e.id ? { ...x, spans: x.spans.map((k) => (k.id === e.id ? { ...k, ...val } : k)) }
              : x.spans.length >= MONTH_LIMITS.spans ? x : { ...x, spans: [...x.spans, { id: `sp${Date.now()}`, startDate: e.start, endDate: e.end, ...val }] }));
            setSpanEdit(null);
          }}
          onDelete={() => { const e = spanEdit!; setDeco((x) => ({ ...x, spans: x.spans.filter((k) => k.id !== e.id) }), '기간 테이프를 뗐어요'); setSpanEdit(null); }}
          onClose={() => setSpanEdit(null)}
        />
        <DiarySpecialDatesSheet
          open={special} items={specials} stickerAssets={[...ASSETS.uri.slice(0, 6), ...ASSETS.kkul.slice(0, 4), ...ASSETS.kkom.slice(0, 2)]}
          onAdd={(sd) => setSpecials((all) => [...all, { ...sd, id: `n${Date.now()}` }])}
          onDelete={(id) => setSpecials((all) => all.filter((k) => k.id !== id))}
          onClose={() => setSpecial(false)}
        />
      </>
    );
  }

  return (
    <>
      <DiaryDayScreen
        me={ME} pageOwner={owner} page={page} dateLabel={labelOf(date)}
        chips={date === TODAY ? [
          { id: 'm', kind: 'mood', label: '신나', iconSrc: '/emo/kkuldaeng/mood/calm.png' },
          { id: 'w', kind: 'weather', label: '맑음 12°' },
          { id: 'e', kind: 'event', label: '칼국수 데이트' },
        ] : []}
        materials={mine && date === TODAY ? [
          { id: 'mood', kind: 'mood', label: '오늘 기분 · 신나', thumbSrc: '/emo/kkuldaeng/mood/calm.png' },
          { id: 'photo1', kind: 'photo', label: '꼼톡 사진', thumbSrc: '/emo/uri/04-mukbang.webp' },
          { id: 'q', kind: 'prompt', label: '오늘 둘이 가장 웃었던 일은?' },
        ] : []}
        hasPage={{ '우댕': !!pages[`${date}_우댕`], '꼼이': !!pages[`${date}_꼼이`] }}
        saveState="saved" isToday={date === TODAY} selectedItemId={sel}
        onBack={() => {}} onPrevDate={() => { setSel(null); setDate((d) => shift(d, -1)); }} onNextDate={() => { setSel(null); setDate((d) => shift(d, 1)); }}
        onGoToday={() => setDate(TODAY)} onOpenMonth={() => setView('month')}
        onChangeOwner={(p) => { setSel(null); setOwner(p); }}
        onSelectItem={setSel}
        onMoveItem={(id, x, y) => put((p) => ({ ...p, items: p.items.map((i) => (i.id === id ? { ...i, x, y } : i)) }))}
        onItemAction={act}
        onTextChange={(text) => put((p) => ({ ...p, text: text.slice(0, DIARY_LIMITS.text) }))}
        onOpenAssets={() => setDrawer(true)}
        onPickPhotos={(files) => files.slice(0, DIARY_LIMITS.photos).forEach((f) => addItem({ type: 'photo', src: URL.createObjectURL(f), w: 0.42, ratio: 0.75 }))}
        onChangeTheme={(t: DiaryPaperTheme) => put((p) => ({ ...p, theme: t }))}
        onAddMaterial={(m) => {
          if (m.kind === 'prompt') put((p) => ({ ...p, text: (p.text ? p.text + '\n' : '') + m.label + ' ' }));
          else if (m.thumbSrc) addItem({ type: m.kind === 'photo' ? 'photo' : 'sticker', src: m.thumbSrc, w: 0.3, ratio: 1 });
        }}
        onOpenSpecialDates={() => setSpecial(true)}
      />
      <DiaryAssetDrawer
        open={drawer && mine} tabs={TABS} tab={tab} assets={assets} full={page.items.length >= DIARY_LIMITS.items}
        onTabChange={setTab}
        onPick={(a) => {
          addItem(a.kind === 'sticker' ? { type: 'sticker', src: a.src, w: 0.3, ratio: 1 } : { type: a.kind, decorId: a.decorId, w: a.kind === 'tape' ? 0.42 : 0.3, ratio: ratioOfDecor(a.decorId) });
          setRecent((r) => [a, ...r.filter((x) => x.id !== a.id)].slice(0, 12));
        }}
        onToggleFavorite={(a) => setFav((s) => { const n = new Set(s); if (n.has(a.id)) n.delete(a.id); else n.add(a.id); return n; })}
        onClose={() => setDrawer(false)}
      />
      <DiarySpecialDatesSheet
        open={special} items={specials} stickerAssets={[...ASSETS.uri.slice(0, 6), ...ASSETS.kkul.slice(0, 4), ...ASSETS.kkom.slice(0, 2)]}
        onAdd={(s) => setSpecials((all) => [...all, { ...s, id: `n${Date.now()}` }])}
        onDelete={(id) => setSpecials((all) => all.filter((s) => s.id !== id))}
        onClose={() => setSpecial(false)}
      />
    </>
  );
}

function Switch() {
  return useSearchParams().get('v') === 'real' ? <Real /> : <Test />;
}

export default function DiaryTestPage() {
  return <Suspense fallback={null}><Switch /></Suspense>;
}
