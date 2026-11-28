import { doc, setDoc, Timestamp, type Firestore } from 'firebase/firestore';

const DAY = 86_400_000;
// at(며칠 뒤, 몇 시) — 한국 날짜 기준 그날 그 시각. 오늘·지난날은 지금보다 미래가 되지 않게 자른다
//   (예전엔 「지금 + 시간」이라 미래 시각이 생겨 편지함에 「-1일 전」이 떴다). 미래(예약 편지 도착 등)는 그대로.
const KST_MIDNIGHT = (() => { const k = Date.now() + 9 * 3_600_000; return k - (k % DAY) - 9 * 3_600_000; })();
const at = (days = 0, hours = 12) => {
  const ms = KST_MIDNIGHT + days * DAY + hours * 3_600_000;
  return Timestamp.fromMillis(days <= 0 ? Math.min(ms, Date.now() - 120_000) : ms);
};
const ymd = (days = 0) => new Date(Date.now() + 9 * 3_600_000 + days * DAY).toISOString().slice(0, 10);
const ym = () => ymd().slice(0, 7);

type SeedDoc = { path: string[]; data: Record<string, unknown> };

/** 네트워크가 꺼진 메모리 Firestore에 예시 문서를 한꺼번에 얹는다. */
export async function seedDemo(db: Firestore): Promise<number> {
  const docs: SeedDoc[] = [];
  const add = (path: string[], data: Record<string, unknown>) => docs.push({ path, data });

  const chat = [
    ['꼼이', '좋은 아침! 오늘은 천천히 시작해도 돼 ☀️'],
    ['우댕', '응, 따뜻한 라떼부터 한 잔 할래'],
    ['꼼이', '창가 자리 찜해 둘게'],
    ['우댕', ''],   // 꿀됑 「사랑해」 이모티콘만(아래 i === 3) — 글 속 [[e:love]] 는 포차코 얼굴이라 시연에서 뺌
    ['꼼이', '점심엔 산책도 조금 하자'],
    ['우댕', '어제 본 노을 색 아직도 생각나'],
    ['꼼이', '사진 다시 봐도 예쁘다'],
    ['우댕', '이번 주말엔 꽃시장 가 볼까?'],
    ['꼼이', '좋아! 작은 화병도 같이 보자'],
    ['우댕', '저녁은 파스타 도전 🍝'],
    ['꼼이', '내가 샐러드 맡을게'],
    ['우댕', '퇴근하면 연락 줘'],
    ['꼼이', '응, 거의 끝났어'],
    ['우댕', '오늘도 고생했어'],
    ['꼼이', '우댕도. 집에서 포근하게 쉬자'],
    ['우댕', '다음 주 바다 가는 날만 기다리는 중'],
    ['꼼이', '돗자리랑 간식 목록 만들어 둘게'],
    ['우댕', '케이크는 내가 고를래 🎂'],
    ['꼼이', '그럼 초는 내가 챙길게'],
    ['우댕', '우리 오늘도 같은 편!'],
  ] as const;
  // 시각은 「어제 아침~밤」 하루 흐름 + 마지막 한 줄만 오늘(지금보다 미래는 안 되게). 새벽 시각이 찍히면 시연이 어색하다.
  const clock = (day: number, hh: number, mm: number) =>
    Timestamp.fromMillis(Math.min(KST_MIDNIGHT + day * DAY + (hh * 60 + mm) * 60_000, Date.now() - 120_000));
  const chatTimes: [number, number, number][] = [
    [-1, 8, 12], [-1, 8, 15], [-1, 8, 21], [-1, 8, 22], [-1, 11, 48], [-1, 12, 30], [-1, 12, 31],
    [-1, 13, 5], [-1, 13, 7], [-1, 16, 40], [-1, 16, 42], [-1, 17, 55], [-1, 18, 3], [-1, 19, 10],
    [-1, 19, 12], [-1, 21, 30], [-1, 21, 34], [-1, 21, 41], [-1, 21, 43], [0, 8, 0],
  ];
  chat.forEach(([from, text], i) => {
    const [d, hh, mm] = chatTimes[i];
    const data: Record<string, unknown> = { from, text, createdAt: clock(d, hh, mm) };
    if (i === 1) data.imageUrl = '/demo/demo-latte.jpg';
    if (i === 6) { data.imageUrl = '/demo/demo-sunset.jpg'; data.starred = true; data.reactions = { udaeng: '💛', kkomi: '🥰' }; }
    if (i === 9) data.imageUrl = '/demo/demo-pasta.jpg';
    if (i === 3) data.sticker = '/emo/kkuldaeng/02-saranghae.webp';
    add(['messages', `demo-message-${String(i + 1).padStart(2, '0')}`], data);
  });
  add(['chatReads', 'udaeng'], { at: Timestamp.now() });
  add(['chatReads', 'kkomi'], { at: Timestamp.now() });

  add(['letters', 'demo-letter-unread'], { from: '꼼이', to: '우댕', body: '오늘 네가 웃었던 순간이 오래 남았어. 내일도 다정한 하루 보내자.', paper: 'peach', mood: 'love', revealVersion: 1, hearts: 3, createdAt: at(-1, 21) });
  add(['letters', 'demo-letter-2'], { from: '우댕', to: '꼼이', body: '별일 없는 날도 같이 있으면 기억하고 싶은 날이 돼.', paper: 'sky', mood: 'thanks', revealVersion: 1, createdAt: at(-8, 20) });
  add(['letters', 'demo-letter-3'], { from: '꼼이', to: '우댕', body: '우리 다음 계절에도 자주 걷고 많이 웃자.', revealVersion: 1, createdAt: at(-20, 19) });
  add(['letters', 'demo-letter-scheduled'], { from: '우댕', to: '꼼이', body: '', sealed: true, openAt: at(7, 9), createdAt: at(0, 9) });
  add(['letterVault', 'demo-letter-scheduled'], { body: '다음 주의 꼼이에게 보내는 작은 응원이야.', revealVersion: 1 });
  add(['letterReads', '우댕'], { id: 'demo-letter-3', at: at(-10) });

  const memoryRows = [
    ['/demo/demo-sea.jpg', '파란 바다 앞에서', -50], ['/demo/demo-picnic.jpg', '느긋한 피크닉', -35],
    ['/demo/demo-snow.jpg', '첫눈 산책', -28], ['/demo/demo-flowers.jpg', '꽃이 가득한 오후', -15],
    ['/demo/demo-cake.jpg', '초 하나 더', -9], ['/demo/demo-pasta.jpg', '첫 파스타 성공', -5],
    ['/demo/demo-sunset.jpg', '노을을 기다린 날', -2], ['/demo/demo-latte.jpg', '창가의 라떼', -1],
  ] as const;
  memoryRows.forEach(([imageUrl, title, days], i) => add(['memories', `demo-memory-${i + 1}`], {
    imageUrl, title, date: ymd(days), description: i % 2 ? '천천히 오래 기억하고 싶은 하루' : '둘이 함께라 더 좋았던 순간',
    by: i % 2 ? '꼼이' : '우댕', hearts: i + 1, commentCount: i % 3, createdAt: at(days),
  }));

  add(['moods', `우댕_${ymd()}`], { name: '우댕', day: ymd(), emoji: 'calm', note: '오늘은 차분하게', updatedAt: at() });
  add(['moods', `꼼이_${ymd()}`], { name: '꼼이', day: ymd(), emoji: 'love', note: '같이 있어서 좋아', updatedAt: at() });
  add(['presence', '우댕'], { active: true, lastSeenAt: Timestamp.now(), clientAt: Date.now() });
  add(['presence', '꼼이'], { active: true, lastSeenAt: Timestamp.now(), clientAt: Date.now() });

  const events = [
    ['주말 브런치', 'together', 1, 1, false, '11:30'], ['우댕 쉬는 날', 'udaeng', 4, 4, true, ''],
    ['꽃시장 구경', 'together', 7, 7, true, ''], ['꼼이 약속', 'kkomi', 10, 10, false, '18:30'],
    ['바다 여행', 'together', 13, 15, true, ''], ['영화 보는 밤', 'together', 19, 19, false, '20:00'],
    ['건강검진', 'udaeng', 25, 25, false, '09:00'], ['다음 달 피크닉', 'together', 35, 35, true, ''],
    // 지난 일정 — 달력 앞쪽 칸이 텅 비지 않게
    ['전시회 데이트', 'together', -20, -20, false, '14:00'], ['꼼이 야근', 'kkomi', -16, -16, true, ''],
    ['우댕 출장', 'udaeng', -12, -11, true, ''], ['동네 빵집 투어', 'together', -8, -8, false, '10:30'],
    ['꼼이 친구 생일', 'kkomi', -5, -5, false, '19:00'], ['노을 산책', 'together', -2, -2, false, '17:30'],
  ] as const;
  events.forEach(([title, owner, start, end, allDay, startTime], i) => add(['calendarEvents', `demo-event-${i + 1}`], {
    title, owner, startDate: ymd(start), endDate: ymd(end), allDay, ...(startTime ? { startTime } : {}),
    createdBy: i % 2 ? '꼼이' : '우댕', remindDaysBefore: [1], createdAt: at(-i),
  }));

  const diaryPages = [
    { date: ymd(), owner: '꼼이', text: '아침 햇살이 좋아서 커튼을 오래 열어 두었다. 저녁엔 같이 산책하기로 했다.', photo: '/demo/demo-latte.jpg' },
    { date: ymd(), owner: '우댕', text: '퇴근길에 작은 꽃다발을 샀다. 내일 브런치 자리에 놓아야지.', photo: '/demo/demo-flowers.jpg' },
    { date: ymd(-1), owner: '우댕', text: '노을이 천천히 번지는 걸 함께 봤다. 짧은 산책이 좋은 마침표가 됐다.', photo: '/demo/demo-sunset.jpg' },
    { date: ymd(-4), owner: '꼼이', text: '꽃 한 다발로 방 안이 환해졌다.', photo: '/demo/demo-flowers.jpg' },
    { date: ymd(-9), owner: '우댕', text: '처음 만든 파스타가 생각보다 맛있었다.', photo: '/demo/demo-pasta.jpg' },
  ];
  diaryPages.forEach((p, i) => {
    const id = `${p.date}_${p.owner === '우댕' ? 'udaeng' : 'kkomi'}`;
    const item = { id: `photo-${i}`, type: 'photo', src: p.photo, frame: 'polaroid', x: .68, y: .43, w: .34, ratio: 1.25, rotation: i % 2 ? 3 : -2, z: 1 };
    add(['diaryPages', id], { date: p.date, ym: p.date.slice(0, 7), owner: p.owner, theme: 'cream', itemCount: 1, hasPhoto: true, excerpt: p.text.slice(0, 40), thumb: p.photo, photos: [p.photo], empty: false, schemaVersion: 1, revision: 1, createdAt: at(-i), updatedAt: at(-i) });
    add(['diaryPages', id, 'content', 'main'], { text: p.text, items: [item], theme: 'cream', empty: false, revision: 1, updatedAt: at(-i) });
  });
  add(['diaryMonths', `${ym()}_together`], { ym: ym(), owner: 'together', memos: { [ymd(2)]: '같이 장보기', [ymd(7)]: '꽃시장' }, stickers: { [ymd(1)]: [{ id: 'demo-heart', src: '/praise/classic/2.webp', by: '우댕' }] }, title: 'round', updatedAt: at() });

  const books = [
    ['demo-book-1', '느린 오후의 문장들', '우댕', { udaeng: { status: 'reading', current: 84, total: 240 }, kkomi: { status: 'reading', current: 61, total: 240 } }],
    ['demo-book-2', '별빛 아래 작은 식탁', '꼼이', { udaeng: { status: 'done' }, kkomi: { status: 'done' } }],
    ['demo-book-3', '마음의 온도', '우댕', { udaeng: { status: 'shelved' }, kkomi: { status: 'reading', current: 32, total: 198 } }],
  ] as const;
  books.forEach(([id, title, placedBy, readers], i) => add(['honeyBooks', id], { title, placedBy, readers, visibility: 'shared', visibleAt: { udaeng: at(-i), kkomi: at(-i) }, createdAt: at(-i) }));
  add(['honeyBooks', 'demo-book-1', 'notes', 'demo-note-1'], { by: '우댕', text: '같이 읽고 싶은 문장을 발견했어.', page: 72, createdAt: at(-2) });
  add(['honeyBooks', 'demo-book-2', 'reviews', 'kkomi'], { by: '꼼이', rating: 5, keywords: ['따뜻해요', '다시 읽고 싶어요'], headline: '조용히 오래 남는 이야기', body: '평범한 하루를 다정하게 바라보게 해 준 책.', photos: [], hasSpoiler: false, createdAt: at(-4) });

  const praises = [
    ['praise', '꼼이', '우댕', '바쁜데도 먼저 안부 물어봐 줘서 고마워', 4, '/praise/classic/2.webp'],
    ['praise', '우댕', '꼼이', '오늘도 웃는 얼굴로 힘을 줬어', 3, '/praise/classic/3.webp'],
    ['memo', '꼼이', '우댕', '주말엔 늦잠 자기', 0, ''],
    ['praise', '우댕', '꼼이', '맛있는 저녁을 함께 만들어서 좋았어', 5, '/praise/classic/5.webp'],
    ['request', '꼼이', '우댕', '산책 같이 가 준 것 칭찬해 줘', 0, ''],
  ] as const;
  praises.forEach(([kind, from, to, reason, stickerCount, stickerImage], i) => add(['praiseStickers', `demo-praise-${i + 1}`], { kind, from, to, reason, stickerCount, ...(stickerImage ? { stickerImage, stickerEmoji: '💚', stickerLabel: '칭찬' } : {}), createdAt: at(-i) }));

  [
    ['https://www.youtube.com/watch?v=demo-morning', '아침에 같이 들을 플레이리스트', 'YouTube'],
    ['https://example.com/picnic', '주말 피크닉 준비 목록', '예시 링크'],
    ['https://example.com/flowers', '작은 꽃다발 아이디어', '예시 링크'],
  ].forEach(([url, title, site], i) => add(['shareList', `demo-share-${i + 1}`], { url, preview: { title, siteName: site, image: i === 2 ? '/demo/demo-flowers.jpg' : '/demo/demo-picnic.jpg', version: 2 }, memo: i === 0 ? '저녁에 같이 듣자' : '나중에 같이 보기', by: i % 2 ? '우댕' : '꼼이', seenBy: ['우댕', '꼼이'], createdAt: at(-i), hearts: i + 1 }));
  [
    ['food', '동네의 작은 수플레 가게', '/demo/demo-cake.jpg'], ['place', '해 질 무렵 바닷길', '/demo/demo-sea.jpg'], ['watch', '포근한 주말 영화', '/demo/demo-snow.jpg'],
  ].forEach(([category, title, image], i) => add(['wishlist', `demo-wish-${i + 1}`], { category, title, preview: { title, image, siteName: '예시' }, memo: '둘이 시간 맞을 때 가기', by: i % 2 ? '꼼이' : '우댕', done: false, createdAt: at(-i) }));
  [
    ['place', '강변 자전거길', '우댕'], ['food', '골목의 작은 파스타집', '꼼이'],
  ].forEach(([category, title, sentBy], i) => add(['again', `demo-again-${i + 1}`], { category, title, location: '예시 동네', memo: '날씨 좋은 날 다시', by: sentBy, sentBy, sentAt: at(-6 - i), wishlistCreatedAt: at(-30 - i) }));

  add(['recipes', 'demo-recipe-1'], { title: '주말 토마토 파스타', description: '마늘을 천천히 볶고 토마토를 듬뿍 넣는 간단한 레시피', photoUrls: ['/demo/demo-pasta.jpg'], by: '우댕', hearts: 4, createdAt: at(-3) });
  add(['recipes', 'demo-recipe-2'], { title: '딸기 크림 케이크', description: '작은 시트에 생크림과 딸기를 포개요', photoUrls: ['/demo/demo-cake.jpg'], by: '꼼이', hearts: 2, createdAt: at(-12) });
  add(['poems', 'demo-poem-1'], { title: '저녁의 색', body: '해가 천천히 접히는 동안\n우리는 같은 쪽을 바라보았다', artUrl: '/demo/demo-sunset.jpg', by: '우댕', hearts: 5, createdAt: at(-4), postedAt: at(-4) });
  add(['poems', 'demo-poem-2'], { title: '작은 계절', body: '꽃 한 송이를 들인 날\n방 안에 봄이 먼저 왔다', artUrl: '/demo/demo-flowers.jpg', by: '꼼이', hearts: 3, createdAt: at(-14), postedAt: at(-3) });

  add(['gifts', '우댕'], { items: [{ from: '꼼이', item: 'coffee', at: at(-1), nonce: 'demo-gift-1' }, { from: '꼼이', item: 'flower', at: at(0), nonce: 'demo-gift-2' }] });
  add(['gifts', '꼼이'], { items: [{ from: '우댕', item: 'cake', at: at(0), nonce: 'demo-gift-3' }] });
  // 홈 카드 배치(settings/home)는 일부러 안 넣는다 — 없으면 홈이 기본 19장 배치를 쓴다.
  add(['settings', 'honeybrary'], { visibilityBackfilled: true });
  add(['settings', 'diary'], { specialSeeded: true });
  // 홈 「오늘의 조각」 — 오늘(한국 날짜) 숫자. 비어 있으면 「오늘 업데이트 없음」만 떠서 시연이 심심하다.
  const pair = (u: number, k: number) => ({ 우댕: u, 꼼이: k });
  add(['dailyStats', ymd(0)], {
    letters: pair(1, 1), praiseStickers: pair(2, 3), praiseRequests: pair(0, 1), memories: pair(1, 2), wishItems: pair(1, 1),
    bumps: { miss: pair(2, 3), love: pair(1, 2), hug: pair(0, 1), kiss: pair(1, 1), whitening: pair(0, 0), night: pair(0, 0) },
  });
  add(['specialDates', 'demo-first-day'], { label: '우리 처음 만난 날', kind: 'anniversary', monthDay: ymd(18).slice(5), startYear: new Date().getFullYear() - 1, owner: 'together', repeat: 'yearly', createdAt: at() });

  // 오프라인 Firestore의 write Promise는 서버 확인을 기다릴 수 있어 일부러 기다리지 않는다.
  // setDoc 호출 자체가 로컬 mutation queue에 즉시 들어가며 DemoProvider가 다음 task까지 기다린 뒤 화면을 연다.
  for (const item of docs) {
    const [collectionName, documentId, ...rest] = item.path;
    void setDoc(doc(db, collectionName, documentId, ...rest), item.data)
      .catch((e) => console.error('[demo seed]', item.path.join('/'), e));
  }
  await new Promise<void>((resolve) => setTimeout(resolve, 80));
  return docs.length;
}

