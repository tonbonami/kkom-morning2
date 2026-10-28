# 꼼톡 이모티콘 서랍 「최근·자주」 탭 — 원문 코드 그대로 (사이담 요청, 2026-10-28)

> 꼼모닝 `main` @ `368a7ff` 의 파일에서 **sed 로 줄 범위를 그대로 잘라** 붙였다. 손으로 옮겨 적은 줄은 없다.
> 각 조각 제목의 `파일:시작-끝` 이 원본 줄 번호다. 원본을 직접 열어 봐도 된다: `/Users/mydang/Claude_Code/Kkom-Morning/src/components/ChatPanel.tsx`
> 맨 아래 「함정」만 내가 쓴 설명이고, 나머지는 전부 코드다.

## 질문별로 어디를 보면 되나
1. 첫 탭 JSX 전체 → **조각 G** (서랍 전체: 검색칸·탭 줄·탭 이름 줄·최근·자주·빈 상태·다른 탭 격자)
   - 순서: **★ 즐겨찾기**(4열 격자, gap 1.5, 칸 aspect-square) → **자주 쓰는**(가로 한 줄, 칸 `h-16 w-16`=64px, gap-2, 8개) → **🕒 최근 사용**(4열 격자, 24개). 섹션 사이 `gap-3.5`(14px). **구분선은 없다.**
   - 제목 문구: `★ 즐겨찾기`(분홍 #FB7BA8) · `자주 쓰는`(이모지 없음, --ct-label 색) · `🕒 최근 사용`. 셋 다 11px bold, 아래 여백 mb-1.5.
   - 제목 줄 위 「탭 이름 + 꾹 누르면 ★ 즐겨찾기」 줄이 따로 있다(12px).
   - 스크롤 칸 최대 높이: 키보드 떠 있으면 22vh, 아니면 40vh.
2. 저장·순위 → **조각 C**
   - localStorage 키: `kkom-emo-recent-${me}` · `kkom-emo-freq-${me}` · `kkom-emo-fav-${me}` (me = 「우댕」/「꼼이」, 사람별로 따로)
   - 최근: 새 것 맨 앞, 같은 것(`mode:key`)은 빼고 다시 앞으로, **24개**까지.
   - 자주: `{ [mode:key]: { mode, key, image, count } }` — **횟수만**, 최근 가중치 없음. 저장은 개수 제한 없이 다 쌓고, 보여 줄 때 횟수 순 **상위 8개**(`frequentList`, C 맨 끝 줄).
   - 동점: JS `sort` 는 안정 정렬이라 **객체에 먼저 들어간 것(=처음 쓴 날이 이른 것)이 앞**. `{...prev, [id]: …}` 는 이미 있는 키의 자리를 안 바꾼다.
   - 즐겨찾기: 새 것 맨 앞, **40개**까지. 꾹(0.45초)·우클릭으로 담기/빼기(조각 E `emoCell`), 미리보기 카드 ★로도(조각 G 맨 위 `StickerSendPreview` props).
   - 기록 시점: **고를 때**(`pickSticker` 첫 줄, 조각 F). 보낼 때가 아니다 — 아래 함정 1.
3. 빈 상태 → 조각 G 안, 세 줄 그대로:
   `아직 쓴 이모티콘이 없어요.` / `다른 탭에서 골라 써보면 여기 모여요 🐾` / `꾹 누르면 ★ 즐겨찾기로 맨 위에 둘 수 있어요` (12.5px, #94A3B8, py-8 가운데).
   조건: 최근·자주·즐겨찾기 **셋 다** 비었을 때.
4. 처음 쓰는 사람 → **조각 C 의 불러오기 useEffect** (`setStickerMode(OWN_MODES[me]?.[0] ?? 'basic')`). 셋 다 비었으면 내 캐릭터 첫 탭(우댕=꿀됑, 꼼이=움짤). JSON 이 깨져 있으면 `basic`. `OWN_MODES` 는 조각 B.
5. 탭 줄 → 조각 A(이름·기본 순서) + 조각 C `stickerTabs`(정렬: 최근·자주 맨 앞 → 내 캐릭터 → 나머지 원래 순서) + 조각 G(모양: 44px 정사각 `h-11 w-11 rounded-xl`, 그림 28px, 최근·자주만 🕒 20px 글자, 선택=배경 `--ct-tab-active`, 가로 스크롤, gap-1).
6. 함정 → 맨 아래.

## 즐겨찾기 저장 위치 차이
꼼모닝도 **기기에만**(localStorage) 둔다. 사이담 `emoFavorites.ts` 와 같은 방식이라 맞출 것 없다. 다만 키에 **사람 이름이 붙어** 있어서 한 기기에서 둘이 번갈아 써도 안 섞인다. 사이담이 사람 구분 없이 한 키라면 그게 차이다.

---
## 코드

### 조각 A — 탭 목록·EmoPick 모양

### `src/components/ChatPanel.tsx:621-641`
```tsx
// 이모티콘 서랍 탭 — 사이챗과 동일 구조(썸네일 + 이름). id/데이터는 꼼모닝 것.
// 카톡식 탭 — 최근·자주(🕒) + 세트별 탭. 아이콘은 '실제 스티커 대표 그림'(썸네일)이라
//   어떤 세트인지 한눈에 보인다(윈도우 이모지 X). 포차코는 한 탭에 몰지 않고 기본/우댕/꼼이/커플로 분리.
type StickerMode = 'recent' | 'gif' | 'kkul' | 'kkulgif' | 'uri' | 'maltipoo' | 'basic' | 'dang' | 'kkom' | 'couple' | 'mini';
const STICKER_TABS: { id: StickerMode; name: string; thumb?: string; icon?: string }[] = [
  { id: 'recent',   name: '최근·자주', icon: '🕒' },
  { id: 'gif',      name: '움짤',      thumb: '/emo/sai-anim/love-still.png' },
  { id: 'maltipoo', name: '말티푸',    thumb: '/emo/sai/kkk.webp' },
  { id: 'basic',    name: '기본',      thumb: '/pochacco/face_happy.png' },
  { id: 'dang',     name: '우댕',      thumb: '/pochacco_dang/cutekkomi.png' },
  { id: 'kkom',     name: '꼼이',      thumb: '/pochacco_kkom/kkomiyap.png' },
  { id: 'couple',   name: '커플',      thumb: '/pochacco_couple/love.png' },
  { id: 'mini',     name: '미니',      thumb: '/emo/saidami/love.webp' },
  { id: 'kkul',     name: '꿀됑',      thumb: '/emo/kkuldaeng/01-ggomsyun.webp' },   // 우댕 지시: 탭 맨 끝
  { id: 'kkulgif',  name: '꿀됑 움짤', thumb: '/emo/sai-anim/kkul-euak-still.png' },  // 우댕 지시: 움짤은 탭 따로
  { id: 'uri',      name: '우리',      thumb: '/emo/uri/03-love.webp' },               // 꿀됑+꼼이 커플 16종 — 맨 끝(2026-10-27)
];

// 최근·자주 쓴 이모티콘(기기별 localStorage). pick 할 때마다 기록.
type EmoPick = { mode: StickerMode; key: string; image: string };
const emoId = (p: { mode: StickerMode; key: string }) => `${p.mode}:${p.key}`;
```

### 조각 B — 내 캐릭터 탭(첫 사용 판정·탭 순서에 씀)

### `src/components/ChatPanel.tsx:411-411`
```tsx
const OWN_MODES: Record<string, StickerMode[]> = { '우댕': ['kkul', 'kkulgif', 'dang'], '꼼이': ['gif', 'kkom', 'mini'] };
```

### 조각 C — 상태·불러오기·첫 사용 판정·recordPick·toggleFav·탭 정렬·자주 상위 8

### `src/components/ChatPanel.tsx:1050-1104`
```tsx
  const reduceMotion = useReducedMotion();
  const [stickerMode, setStickerMode] = useState<StickerMode>('recent');
  // 최근·자주 쓴 이모티콘(기기별). 첫 탭이 이걸 보여주고, pick 할 때마다 기록된다.
  const [recentPicks, setRecentPicks] = useState<EmoPick[]>([]);
  const [freqPicks, setFreqPicks] = useState<Record<string, EmoPick & { count: number }>>({});
  // ★ 즐겨찾기(기기별) — 서랍에서 꾹(0.45초) 누르거나 우클릭하면 담기/빼기. 「최근·자주」 맨 위에 모인다. (라인 お気に入り 참고)
  const [favPicks, setFavPicks] = useState<EmoPick[]>([]);
  const favIds = useMemo(() => new Set(favPicks.map(emoId)), [favPicks]);
  // 서랍 검색어 — 서랍을 닫으면 비운다.
  const [emoQuery, setEmoQuery] = useState('');
  useEffect(() => { if (!stickerOpen) { setEmoQuery(''); setKwWord(null); } }, [stickerOpen]);
  useEffect(() => {
    if (!me) return;
    try {
      const r = JSON.parse(localStorage.getItem(`kkom-emo-recent-${me}`) || '[]');
      const f = JSON.parse(localStorage.getItem(`kkom-emo-freq-${me}`) || '{}');
      const v = JSON.parse(localStorage.getItem(`kkom-emo-fav-${me}`) || '[]');
      if (Array.isArray(r)) setRecentPicks(r);
      if (f && typeof f === 'object') setFreqPicks(f);
      if (Array.isArray(v)) setFavPicks(v);
      // 기록이 아예 없으면(첫 사용) 빈 '최근' 대신 내 캐릭터 첫 탭으로 시작한다.
      if ((!Array.isArray(r) || r.length === 0) && (!f || Object.keys(f).length === 0) && (!Array.isArray(v) || v.length === 0)) setStickerMode(OWN_MODES[me]?.[0] ?? 'basic');
    } catch { setStickerMode('basic'); }
  }, [me]);
  const recordPick = (p: EmoPick) => {
    if (isPractice()) return;   // 연습 모드(검수)로 누른 건 진짜 「최근·자주」에 안 남긴다(Aside 2026-10-22·10-28 지적)
    const id = emoId(p);
    setRecentPicks((prev) => {
      const next = [p, ...prev.filter((x) => emoId(x) !== id)].slice(0, 24);
      try { localStorage.setItem(`kkom-emo-recent-${me}`, JSON.stringify(next)); } catch {}
      return next;
    });
    setFreqPicks((prev) => {
      const next = { ...prev, [id]: { ...p, count: (prev[id]?.count ?? 0) + 1 } };
      try { localStorage.setItem(`kkom-emo-freq-${me}`, JSON.stringify(next)); } catch {}
      return next;
    });
  };
  const toggleFav = (p: EmoPick) => {
    const id = emoId(p);
    const had = favIds.has(id);
    setFavPicks((prev) => {
      const next = had ? prev.filter((x) => emoId(x) !== id) : [{ mode: p.mode, key: p.key, image: p.image }, ...prev].slice(0, 40);
      try { localStorage.setItem(`kkom-emo-fav-${me}`, JSON.stringify(next)); } catch {}
      return next;
    });
    flashToast(had ? '즐겨찾기에서 뺐어' : '★ 즐겨찾기에 담았어');
  };
  // 내 캐릭터 탭 먼저 — 우댕은 꿀됑·꿀됑 움짤·우댕, 꼼이는 움짤·꼼이·미니(OWN_MODES). 「최근·자주」는 늘 맨 앞, 나머지는 원래 순서.
  const stickerTabs = useMemo(() => {
    const own = OWN_MODES[me] ?? [];
    const rank = (id: StickerMode) => (id === 'recent' ? -1 : own.includes(id) ? own.indexOf(id) : 100 + STICKER_TABS.findIndex((t) => t.id === id));
    return [...STICKER_TABS].sort((a, b) => rank(a.id) - rank(b.id));
  }, [me]);
  const frequentList = Object.values(freqPicks).sort((a, b) => b.count - a.count).slice(0, 8);
```

### 조각 D — 도움 함수(움짤 정지컷·동영상 판정·이름·토스트)

### `src/components/ChatPanel.tsx:129-133`
```tsx
// 스티커 소스가 동영상(mp4/webm/mov)인지 → <video>로 진짜 재생. 아니면 정지 이미지.
const isVideoSrc = (src: string) => /\.(mp4|webm|mov)$/i.test(src);
const posterOf = (src: string) => src.replace(/\.(mp4|webm|mov)$/i, '-poster.webp');
// 서랍 썸네일 — 움짤(sai-anim webp)은 정지컷(-still.png)으로. 서랍에서 여러 개 동시 애니 디코딩 방지.
const drawerThumb = (src: string) => src.includes('/emo/sai-anim/') ? src.replace(/\.webp(\?.*)?$/, '-still.png$1') : src;
```

### `src/components/ChatPanel.tsx:945-945`
```tsx
const stickerName = (key: string) => MOOD_OPTIONS.find((o) => o.id === key)?.label ?? key;
```

### `src/components/ChatPanel.tsx:1513-1513`
```tsx
  const flashToast = (msg: string, ms = 2400) => { setToast(msg); setTimeout(() => setToast(''), ms); };
```

### 조각 E — 찾기 순위 고정 + 서랍 칸 하나(emoCell: 탭=고르기, 꾹·우클릭=★)

### `src/components/ChatPanel.tsx:1544-1590`
```tsx
  // 이모티콘 서랍 — 현재 탭의 섹션 목록. 대부분 섹션 하나(label 없음)지만, '포차코'는 여러 섹션(sticky header)으로.
  //   서랍엔 정지컷(thumb 있으면), 전송·채팅엔 image(움짤 webp 포함). label 있으면 소제목이 걸린다.
  type SItem = { key: string; image: string; video?: boolean; thumb?: string };
  // 찾기 순위에 쓰는 「자주·★」는 서랍을 열 때 한 번만 찍어 둔다 — 고르거나 ★를 누를 때마다 결과 순서가 바뀌어
  //   같은 자리를 다시 누르면 다른 그림이 나왔다(Aside 실사용 2026-10-28).
  const [rankSnap, setRankSnap] = useState<{ freq: Record<string, { count: number }>; fav: Set<string> }>({ freq: {}, fav: new Set() });
  useEffect(() => { if (stickerOpen) setRankSnap({ freq: freqPicks, fav: favIds }); }, [stickerOpen]); // eslint-disable-line react-hooks/exhaustive-deps
  const searchHits = useMemo(() => {
    if (!emoQuery.trim()) return [];
    // 글 속 미니(누르면 입력칸에 (단어)로 들어감)는 맨 뒤 따로 — 미리보기가 뜨는 보통 이모티콘과 섞여 헷갈렸다(Aside 2026-10-28).
    const hits = searchStickers(emoQuery, me, rankSnap.freq, rankSnap.fav);
    return [...hits.filter((h) => h.mode !== 'mini'), ...hits.filter((h) => h.mode === 'mini')];
  }, [emoQuery, me, rankSnap]);
  // 서랍 칸 하나 — 탭=전송, 꾹(0.45초)·우클릭=★ 담기/빼기. 꾹 누른 뒤 손 뗄 때 오는 click은 삼킨다.
  //   이미지 길게 누르기의 아이폰 저장 메뉴(callout)·끌기는 막는다.
  //   ⚠️ fired는 어느 버튼이든 누를 때마다 지운다 — 예전엔 오른쪽 버튼이면 지우기 전에 빠져나가, 우클릭 ★가 첫 번째만 되고
  //   그다음 우클릭은 전부 무시됐다(Aside 2026-10-16). 타이머가 늦게 도는 환경(가려진 창)도 있어 손 뗄 때 누른 시간으로 한 번 더 판정.
  const lpRef = useRef<{ t: ReturnType<typeof setTimeout> | null; fired: boolean; at: number }>({ t: null, fired: false, at: 0 });
  const clearLp = () => { if (lpRef.current.t) { clearTimeout(lpRef.current.t); lpRef.current.t = null; } };
  const emoCell = (p: EmoPick & { thumb?: string; video?: boolean }, sizeCls: string) => {
    const id = emoId(p);
    const fav = favIds.has(id);
    const video = p.video ?? isVideoSrc(p.image);
    return (
      <button key={id} type="button" aria-label={`${stickerName(p.key)}${fav ? ' (즐겨찾기)' : ''}`}
        onPointerDown={(e) => {
          lpRef.current.fired = false; clearLp();
          if (e.button !== 0) return;
          lpRef.current.at = Date.now();
          lpRef.current.t = setTimeout(() => { lpRef.current.fired = true; lpRef.current.t = null; toggleFav(p); }, 450);
        }}
        onPointerUp={() => {
          const pending = !!lpRef.current.t;
          clearLp();
          if (pending && !lpRef.current.fired && Date.now() - lpRef.current.at >= 450) { lpRef.current.fired = true; toggleFav(p); }
        }}
        onPointerLeave={clearLp} onPointerCancel={clearLp}
        onContextMenu={(e) => { e.preventDefault(); clearLp(); if (!lpRef.current.fired) toggleFav(p); lpRef.current.fired = true; }}
        onClick={() => { if (lpRef.current.fired) { lpRef.current.fired = false; return; } pickSticker(p.mode, p.key, p.image); }}
        className={`relative grid place-items-center rounded-2xl bg-[var(--ct-cell)] shadow-[var(--ct-cell-shadow)] active:scale-90 transition-transform select-none [-webkit-touch-callout:none] ${sizeCls}`}>
        {video
          ? <video src={p.image} poster={posterOf(p.image)} muted loop autoPlay playsInline className="pointer-events-none w-[88%] h-[88%] object-contain" />
          : /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.thumb ?? drawerThumb(p.image)} alt="" draggable={false} className="pointer-events-none w-[88%] h-[88%] object-contain" />}
        {fav && <span aria-hidden className="absolute right-1 top-0.5 text-[12px] leading-none text-[#FB7BA8]">★</span>}
      </button>
    );
  };
```

### 조각 F — pickSticker(여기서 recordPick)

### `src/components/ChatPanel.tsx:1655-1665`
```tsx
  const pickSticker = (mode: StickerMode, key: string, image: string) => {
    recordPick({ mode, key, image });                      // 최근·자주 기록(원래 mode로)
    if (mode === 'mini') {                                 // (단어) 인라인 미니 — 넣고 서랍 닫기
      if (activeKw()) {                                   // 단어로 찾았으면: 그 낱말뿐이면 (단어)로 바꾸고, 문장이면 끝에 붙인다
        setDraft(replacesDraft() ? `(${key})` : `${draft.replace(/\s+$/, '')} (${key})`); setKwWord(null);
        requestAnimationFrame(() => taRef.current?.focus());
      } else insertParen(key);
      setStickerOpen(false); return;
    }
    chooseSticker(image, key, undefined, { mode, key, image });   // 나머지: 미리보기(서랍은 열어 둔다 — 카톡처럼 한 번 더 누르면 전송)
  };
```

### 조각 G — 서랍 JSX 전체(미리보기 카드 자리 + 검색 + 탭 줄 + 최근·자주 + 빈 상태 + 다른 탭)

### `src/components/ChatPanel.tsx:2185-2304`
```tsx
          {/* 아래 묶음(서랍·수정·답장 바·입력줄) — 미리보기가 이 묶음 맨 위에 붙어 대화 위로 반투명하게 뜬다(서랍이 열려 있어도 서랍 위). */}
          <div className="relative">
          <StickerSendPreview item={pendingSticker} hasText={!!draft.trim()} reduceMotion={!!reduceMotion}
            replacedWord={kwUndo && !draft.trim() ? kwUndo.word : undefined}
            fav={!!pendingSticker?.pick && favIds.has(emoId(pendingSticker.pick))}
            onToggleFav={pendingSticker?.pick ? () => toggleFav(pendingSticker.pick!) : undefined}
            onCancel={cancelPendingSticker} onSendNow={() => { void sendPendingSticker(); }} />
          {/* 이모티콘 서랍 — 제미나이 2차: 아이콘만 탭 + 카톡식 '최근·자주' 첫 탭.
              + 검색칸(모든 탭을 이름·같은 뜻 말로) · 내 캐릭터 탭 먼저 · 꾹 눌러 ★ 즐겨찾기(벤치마킹 1·2번, 우댕 선택 2026-10-16) */}
          {stickerOpen && (
            <div className="mx-3 mb-2 rounded-[28px] p-3 backdrop-blur-md border" style={{ background: 'var(--ct-sheet)', borderColor: 'var(--ct-sheet-border)', boxShadow: 'var(--sd-shadow-card)' }}>
              {/* 검색 — 글씨 16px: 아이폰은 16px 미만 입력칸을 누르면 화면을 확대한다. */}
              <div className="mb-2 flex h-10 items-center gap-2 rounded-2xl px-3" style={{ background: 'var(--ct-cell)', boxShadow: 'var(--ct-cell-shadow)' }}>
                <Search size={16} className="shrink-0" style={{ color: 'var(--ct-label)' }} />
                <input value={emoQuery} onChange={(e) => setEmoQuery(e.target.value)} type="search" enterKeyHint="search"
                  placeholder="이모티콘 찾기 (ㅂ, 배고파, 잘자…)" aria-label="이모티콘 찾기"
                  className="min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-[color:var(--ct-label)] [&::-webkit-search-cancel-button]:hidden"
                  style={{ color: 'var(--ct-chip-text)' }} />
                {emoQuery && (
                  <button type="button" onClick={() => setEmoQuery('')} aria-label="찾기 지우기"
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full active:bg-black/5" style={{ color: 'var(--ct-label)' }}>
                    <X size={16} />
                  </button>
                )}
              </div>

              {emoQuery.trim() ? (
                // 키보드가 떠 있으면 결과 칸을 줄여 입력줄·대화가 화면 밖으로 안 밀리게.
                <div className="overflow-y-auto" style={{ maxHeight: kbInset ? '22vh' : '40vh' }}>
                  {searchHits.length === 0 ? (
                    <div className="py-6 text-center text-[12.5px] leading-relaxed" style={{ color: 'var(--ct-label)' }}>
                      「{emoQuery.trim()}」로 찾은 이모티콘이 없어요.<br />다른 말로 쳐 보세요 (배고파, ㅂㄱ, 잘자…)
                    </div>
                  ) : (
                    <>
                      <div className="mb-1.5 flex items-center justify-between gap-2 px-0.5 text-[12px] font-bold" style={{ color: 'var(--ct-label)' }}>
                        <span>찾은 이모티콘 {searchHits.filter((p) => p.mode !== 'mini').length}개</span>
                        {/* 입력칸 단추로 들어온 검색이면 — 고른 그림이 친 단어를 대신한다는 걸 알려 둔다 */}
                        {activeKw() && <span className="truncate font-semibold text-[#FB7BA8]">{replacesDraft() ? `고르면 입력한 「${activeKw()}」 대신 가요` : '고르면 입력한 글과 함께 가요'}</span>}
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">{searchHits.filter((p) => p.mode !== 'mini').map((p) => emoCell(p, 'aspect-square'))}</div>
                      {searchHits.some((p) => p.mode === 'mini') && (
                        <>
                          <div className="mb-1.5 mt-3 px-0.5 text-[12px] font-bold" style={{ color: 'var(--ct-label)' }}>글 속 미니 — 누르면 입력칸에 (단어)로 들어가요</div>
                          <div className="grid grid-cols-5 gap-1.5">{searchHits.filter((p) => p.mode === 'mini').map((p) => emoCell(p, 'aspect-square'))}</div>
                        </>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <>
                  {/* 탭 — 실제 스티커 대표 그림(썸네일) 정사각. 최근·자주만 🕒. 선택 시 로즈 배경. 내 캐릭터 탭이 앞(stickerTabs). */}
                  <div className="flex gap-1 mb-1.5 overflow-x-auto pb-0.5">
                    {stickerTabs.map((st) => {
                      const on = st.id === stickerMode;
                      return (
                        <button key={st.id} onClick={() => setStickerMode(st.id)} aria-pressed={on} aria-label={`${st.name} 이모티콘`}
                          className={`shrink-0 grid h-11 w-11 place-items-center rounded-xl transition-colors ${on ? '' : 'active:bg-black/5'}`}
                          style={on ? { background: 'var(--ct-tab-active)' } : undefined}>
                          {st.thumb
                            ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={st.thumb} alt="" className="h-7 w-7 object-contain" />
                            : <span className="text-[20px]">{st.icon}</span>}
                        </button>
                      );
                    })}
                  </div>
                  {/* 선택된 탭 이름(어느 탭인지 힌트) + 오른쪽에 ★ 방법 */}
                  <div className="mb-1.5 flex items-center justify-between gap-2 px-0.5 text-[12px] font-bold text-[color:var(--ct-label)]">
                    <span>{STICKER_TABS.find((t) => t.id === stickerMode)?.name}</span>
                    <span className="font-medium opacity-80">꾹 누르면 ★ 즐겨찾기</span>
                  </div>

                  <div className="overflow-y-auto" style={{ maxHeight: kbInset ? '22vh' : '40vh' }}>
                    {stickerMode === 'recent' ? (
                      (recentPicks.length === 0 && frequentList.length === 0 && favPicks.length === 0) ? (
                        <div className="py-8 text-center text-[12.5px] leading-relaxed text-[#94A3B8]">아직 쓴 이모티콘이 없어요.<br />다른 탭에서 골라 써보면 여기 모여요 🐾<br />꾹 누르면 ★ 즐겨찾기로 맨 위에 둘 수 있어요</div>
                      ) : (
                        <div className="flex flex-col gap-3.5">
                          {favPicks.length > 0 && (
                            <div>
                              <h3 className="mb-1.5 text-[11px] font-bold text-[#FB7BA8]">★ 즐겨찾기</h3>
                              <div className="grid grid-cols-4 gap-1.5">{favPicks.map((p) => emoCell(p, 'aspect-square'))}</div>
                            </div>
                          )}
                          {frequentList.length > 0 && (
                            <div>
                              <h3 className="mb-1.5 text-[11px] font-bold text-[color:var(--ct-label)]">자주 쓰는</h3>
                              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5">
                                {frequentList.map((p) => emoCell(p, 'h-16 w-16 shrink-0'))}
                              </div>
                            </div>
                          )}
                          {recentPicks.length > 0 && (
                            <div>
                              <h3 className="mb-1.5 text-[11px] font-bold text-[color:var(--ct-label)]">🕒 최근 사용</h3>
                              <div className="grid grid-cols-4 gap-1.5">{recentPicks.map((p) => emoCell(p, 'aspect-square'))}</div>
                            </div>
                          )}
                        </div>
                      )
                    ) : (
                      stickerSections(stickerMode).map((sec, si) => (
                        <div key={si} className={si > 0 ? 'mt-3' : ''}>
                          {sec.label && (
                            <div className="sticky top-0 z-10 mb-1.5 py-1 backdrop-blur-sm" style={{ background: 'var(--ct-sheet)' }}>
                              <span className="inline-block px-0.5 text-[12px] font-bold" style={{ color: 'var(--ct-label)' }}>{sec.label}</span>
                            </div>
                          )}
                          <div className="grid grid-cols-4 gap-1.5">
                            {sec.items.map((it) => emoCell({ mode: stickerMode, key: it.key, image: it.image, thumb: it.thumb, video: it.video }, 'aspect-square'))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}
```

### 조각 H — 짝 답장 줄에서 고를 때도 기록

### `src/components/ChatPanel.tsx:2335-2343`
```tsx
            <StickerSuggestTray
              items={trayItems}
              reduceMotion={!!reduceMotion}
              onPick={(t) => {
                const it = pairFrom?.items.find((x) => x.image === t.id); if (!it) return;
                recordPick(it); chooseSticker(it.image, it.key, drawerThumb(it.thumb), { mode: it.mode, key: it.key, image: it.image });
              }}
              onClose={() => setPairFrom(null)}
            />
```

### 조각 I — 서랍 색 변수(다크/라이트)

### `src/components/ChatPanel.tsx:1034-1049`
```tsx
  const chatThemeStyle = {
    background: tc.bg,
    '--ct-my-bg': tc.myBg, '--ct-my-text': tc.myText, '--ct-partner-bg': tc.partnerBg, '--ct-partner-text': tc.partnerText,
    '--ct-my-btn': hexA(tc.myText, 0.28), '--ct-my-bar-off': hexA(tc.myText, 0.58),   // 음성 재생버튼·파형 대비(흐림 해소)
    '--ct-header': dk ? hexA(surf, 0.82) : 'rgba(255,255,255,0.6)',
    '--ct-chip': dk ? 'rgba(255,255,255,0.08)' : '#ffffff',
    '--ct-chip-text': dk ? '#ECE6E2' : '#334155',
    '--ct-chip-icon': dk ? 'rgba(236,230,226,0.72)' : '#94a3b8',
    // 이모티콘 서랍(제미나이 다크 리디자인) — surface 기반 글래스 + 내 말풍선색 라이트박스 셀 + 로즈 필 + 웜 라벨
    '--ct-sheet': dk ? hexA(surf, 0.85) : 'rgba(251,248,242,0.95)',
    '--ct-sheet-border': dk ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
    '--ct-cell': dk ? hexA(tc.myBg, 0.15) : '#ffffff',   // 다크=그 테마 내 말풍선색 극저투명(라이트박스)
    '--ct-cell-shadow': dk ? '0 4px 12px rgba(0,0,0,0.2), inset 0 0 0 1px rgba(255,255,255,0.06)' : '0 2px 8px rgba(0,0,0,0.04)',
    '--ct-tab-active': dk ? 'rgba(251,123,168,0.18)' : 'rgba(251,123,168,0.15)',
    '--ct-label': dk ? '#A397A0' : '#8B7D88',
  } as React.CSSProperties;
```

### `src/app/globals.css:41-41`
```tsx
  --sd-shadow-card:0 1px 3px rgba(70,55,60,.07), 0 14px 28px -14px rgba(70,55,60,.30);
```

### `src/app/globals.css:69-69`
```tsx
    --sd-shadow-card:0 1px 2px rgba(0,0,0,.3), 0 18px 38px -16px rgba(0,0,0,.7);
```

### 조각 J — 연습 모드 판정(recordPick 이 씀)

### `src/lib/practice.ts:1-34` (파일 전체)
```tsx
// 연습 모드 — Aside 같은 검수자가 "진짜로 눌러 보며" 써 볼 수 있게, 상대에게 닿는 쓰기를 전부 막는다.
//   켜기: 주소 끝 ?practice=1 (이 탭이 닫힐 때까지 유지 — sessionStorage) · 끄기: ?practice=0
//   막는 것: 메시지·타임캡슐 전송, 입력 중 표시, 읽음, 반응·수정·삭제·별표, 사진/음성/영상 업로드, 접속(presence) 표시.
//   막힌 동작은 'kk-practice' 이벤트로 알려 ChatPanel이 "안 보냈어요" 토스트를 띄운다.
const KEY = 'kk-practice';

export function isPractice(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const sp = new URLSearchParams(window.location.search);
    const q = sp.get('practice');
    if (q === '1') sessionStorage.setItem(KEY, '1');
    if (q === '0') sessionStorage.removeItem(KEY);
    // 피부 일지 연습 모드에서 보기 전용(우댕 폰) 흉내: &view=1 / 끄기 &view=0
    const v = sp.get('view');
    if (v === '1') sessionStorage.setItem(KEY + '-view', '1');
    if (v === '0') sessionStorage.removeItem(KEY + '-view');
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

// 막았다고 알림 — what: "이모티콘 「배고파」" 처럼 사람이 읽을 말
export function practiceBlocked(what: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<string>(KEY, { detail: what }));
}

// 피부 일지 연습 모드에서 보기 전용으로 흉내 낼지(isPractice가 주소의 view=1을 기억해 둔다)
export function practiceAsViewer(): boolean {
  if (typeof window === 'undefined') return false;
  try { isPractice(); return sessionStorage.getItem(KEY + '-view') === '1'; } catch { return false; }
}
```

---
## 함정 — 코드만 봐선 안 보이는 것
1. **기록은 「고를 때」 남는다, 「보낼 때」가 아니다.** 미리보기에서 ✕로 빼도 최근·자주엔 이미 들어가 있다. 카톡식 미리보기(10/22)보다 서랍(9/08)이 먼저 생겨서 그렇다. 우댕이 불편하다고 한 적은 없지만, 똑같이 베끼면 이 버릇까지 같이 간다 — 사이담이 「보낼 때」로 바꾸고 싶으면 우댕님께 여쭤 볼 것.
2. **연습 모드에선 기록 안 함**(569393f, 조각 C 첫 줄). Aside 검수가 우댕의 진짜 「최근 사용」 순서를 바꿔 놨었다. 즐겨찾기(toggleFav)는 막지 않는다 → 검수 의뢰서엔 「★ 누르지 말 것」을 따로 적는다.
3. **localStorage 는 첫 렌더에 읽지 않는다 — useEffect 안에서.** Next.js 서버 렌더 때 \`localStorage\` 가 없어서 useState 초기값에서 읽으면 hydration 이 어긋난다. 대가: 첫 화면 한 박자는 빈 값이고 탭이 'recent' → (첫 사용이면) 내 캐릭터로 바뀐다. 서랍은 사용자가 눌러야 열리니 눈에 안 띈다.
4. **TDZ**: \`freqPicks\` 선언을 그걸 쓰는 추천 \`useMemo\` 보다 **위에** 둬야 한다. 아래 두면 렌더가 통째로 죽는다(조각 C 끝 주석).
5. **찾기 결과 순위는 서랍 열 때 한 번만 찍는다**(\`rankSnap\`, 조각 E). 고를 때마다 자주 횟수가 올라 결과 순서가 바뀌어, 같은 자리를 다시 누르면 다른 그림이 나왔다(Aside 10/28). 최근·자주 탭 자체는 고정 안 한다 — 고르는 즉시 최근 맨 앞으로 바뀐다(서랍은 미리보기 때문에 열린 채).
6. **꾹 누르기 ★ 버그 두 개**(Aside 10/16, 조각 E 주석): ① 우클릭 때 \`fired\` 를 안 지워서 두 번째 우클릭부터 다 무시됐다 → 어떤 버튼이든 누를 때마다 먼저 지운다. ② 가려진 창에선 setTimeout 이 늦게 돌아 꾹이 안 먹었다 → 손 뗄 때 누른 시간(≥450ms)으로 한 번 더 판정. 꾹 뒤에 오는 click 은 삼킨다. 아이폰 이미지 저장 메뉴는 \`[-webkit-touch-callout:none]\` + \`select-none\` + \`draggable={false}\`.
7. **저장할 땐 원래 \`mode\` 를 같이 둔다.** 최근 칸을 눌러도 원래 탭(움짤·미니 등) 규칙대로 동작해야 해서다 — 미니는 입력칸에 \`(단어)\`로 들어가고, 나머지는 미리보기. 움짤은 서랍에선 정지컷(\`drawerThumb\`)으로 그려 여러 개 동시 재생을 막는다.
8. **저장 실패는 조용히 넘긴다**(\`try { setItem } catch {}\`). 화면 상태는 이미 바뀌어 그 창에선 보이고, 다음에 열면 없을 뿐. 사생활 보호 모드·용량 초과 대비.
9. **그림 경로를 통째로 저장한다.** 나중에 파일 이름을 바꾸면 옛 기록이 깨진 그림이 된다. 꼼모닝은 아직 거른 적 없다(알려진 구멍).
10. **서랍을 닫아도 탭은 그대로다.** 다시 열면 마지막에 보던 탭. 매번 최근·자주로 되돌리는 코드는 없다.
11. **빈 상태 판정에 즐겨찾기도 넣는다.** 안 넣으면 ★만 있는 사람이 「아직 쓴 이모티콘이 없어요」를 본다.
12. 같은 그림이 ★·자주·최근에 동시에 있어도 \`key={id}\` 가 겹치지만 부모 div 가 달라 React 경고는 없다.
