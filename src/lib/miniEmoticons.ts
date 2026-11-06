// 글 속 미니 이모티콘 — 꼼톡과 편지가 **같은 목록**을 쓴다(2026-11-06 편지 새 단장 1차, GPT 상의 docs/gpt-letter-upgrade-*.md).
//   저장은 글자 그대로 `(사랑해)`, 보여 줄 때만 그림으로 바꾼다. 그래서 옛 편지·알림·검색은 그대로 글자로 남고,
//   그림을 바꿔도 지난 글이 새 그림으로 보인다.
//   ⚠️ 원래 ChatPanel.tsx 안에만 있었다 — 편지용 사본을 만들면 새 단어를 넣을 때 둘이 어긋난다(GPT 지적). 여기 한 곳만 고친다.
//   ⚠️ 모든 괄호를 그림으로 바꾸면 안 된다 — `(내일 보자)` 같은 문장까지 먹는다. **아는 단어만** 맞춘다.

// 사이담이 탭 — 사이담 말티푸 표정·몸짓 21종. 사이담 EMOTICONS(setId=BASIC) 정의 순서 그대로.
// 파일은 사이담 /mood + /praise/saidam 공유본을 꼼모닝 /emo/saidami/로 네임스페이스 복사(우리 /pochacco 무버 안 건드림).
export const SAIDAMI_STICKERS: { word: string; image: string }[] = [
  { word: '행복', image: '/emo/saidami/happy.webp' },
  { word: '사랑해', image: '/emo/saidami/love.webp' },
  { word: '신나', image: '/emo/saidami/excited.webp' },
  { word: '평온', image: '/emo/saidami/calm.webp' },
  { word: '졸려', image: '/emo/saidami/sleepy.webp' },
  { word: '속상해', image: '/emo/saidami/sad.webp' },
  { word: '화났어', image: '/emo/saidami/angry.webp' },
  { word: '보고파', image: '/emo/saidami/missing.webp' },
  { word: '아파', image: '/emo/saidami/sick.webp' },
  { word: '미안해', image: '/emo/saidami/sorry.webp' },
  { word: '고마워', image: '/emo/saidami/thanks.webp' },
  { word: '삐졌어', image: '/emo/saidami/sulky.webp' },
  { word: '반짝', image: '/emo/saidami/star.webp' },
  { word: '하트', image: '/emo/saidami/heart.webp' },
  { word: '짝짝짝', image: '/emo/saidami/clap.webp' },
  { word: '잘했어', image: '/emo/saidami/medal.webp' },
  { word: '꽃다발', image: '/emo/saidami/flower.webp' },
  { word: '칭찬해줘', image: '/emo/saidami/please.webp' },
  { word: '힘내', image: '/emo/saidami/jump.webp' },
  { word: '최고야', image: '/emo/saidami/crown.webp' },
  { word: '안아줘', image: '/emo/saidami/hug.webp' },
  { word: '헤헤', image: '/emo/saidami/hehe.webp' },   // 꼼이 말버릇(73번) — 글 속 (헤헤). 원본 art/kkom-hehe A안(우댕 OK 2026-10-19)
];

// 꼼이미니 = 카톡식 (단어) 인라인 미니(32px). 라벨→이미지 룩업.
// 겹치는 단어(사랑해·보고파·하트는 커플 스티커에도 있음)는 꼼이미니(말티푸)가 렌더 우선.
// 커플 스티커는 '커플' 탭 탭전송(단독 스티커)으로 그대로 살아있어 손실 없음.
export const MINI_BY_WORD: Record<string, string> = Object.fromEntries(SAIDAMI_STICKERS.map((s) => [s.word, s.image]));
// 보낸 사람 캐릭터로 바꿔 그리는 글 속 단어 — 꼼이미니·커플 스티커보다 먼저 본다.
//   (야호): 우댕이 치면 꿀됑 야호(우댕 문장 끝 인사, 340번), 꼼이가 친 (야호)는 원래 포차코 그대로.
//   (약속): 꼼이는 발바닥 도장, 우댕은 꿀됑 코 도장(원본 art/yaksok, GPT 상의 B+D안).
export const TEXT_STICKER_BY_SENDER: Record<string, Record<string, string>> = {
  '우댕': { '야호': '/emo/kkuldaeng/mini/yaho.webp', '약속': '/emo/kkuldaeng/mini/yaksok.webp' },
  '꼼이': { '약속': '/emo/kkom/mini/yaksok.webp' },
};
export const senderSticker = (w: string, from?: string) => (from ? TEXT_STICKER_BY_SENDER[from]?.[w] : undefined);

// ── 편지(과 앞으로 다른 화면)가 쓰는 것 ─────────────────────────────────────────────
// 편지에서는 **작은 그림만** 글 속에 넣는다. 꼼톡의 큰 커플 스티커·영상((하트)→포차코 영상 등)은 편지 글 속엔 안 쓴다 —
//   편지는 글이 주인공이라(GPT: 「큰 스티커는 본문 아래 동봉」). 그래서 아는 단어 = 꼼이미니 + 보낸 사람별 미니뿐.
export type MiniPart = { kind: 'text'; text: string } | { kind: 'mini'; word: string; src: string };

const MINI_WORDS = [...new Set([
  ...SAIDAMI_STICKERS.map((s) => s.word),
  ...Object.values(TEXT_STICKER_BY_SENDER).flatMap((m) => Object.keys(m)),
])];
// 긴 단어부터 — 「칭찬해줘」가 「칭찬」 같은 짧은 단어에 먼저 먹히지 않게(지금은 겹침 없지만 단어가 늘 때 대비).
const esc = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const MINI_RE_SRC = `\\((${[...MINI_WORDS].sort((a, b) => b.length - a.length).map(esc).join('|')})\\)`;

/** 이 단어가 보낸 사람 기준으로 그림이 되나 — 보낸 사람별 그림이 먼저, 없으면 꼼이미니. */
export function miniSrc(word: string, from?: string): string | undefined {
  return senderSticker(word, from) ?? MINI_BY_WORD[word];
}

/** 글을 「글자 / 미니 그림」 조각으로 — 그리는 쪽(편지 화면)은 이 조각만 받는다. 모르는 (단어)는 글자 그대로. */
export function splitMini(text: string, from?: string): MiniPart[] {
  const out: MiniPart[] = [];
  const re = new RegExp(MINI_RE_SRC, 'g');
  let last = 0; let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const src = miniSrc(m[1], from);
    if (!src) continue;                                   // 이 사람에겐 그림이 없는 단어(예: 꼼이의 (야호)) → 글자로 남는다
    if (m.index > last) out.push({ kind: 'text', text: text.slice(last, m.index) });
    out.push({ kind: 'mini', word: m[1], src });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ kind: 'text', text: text.slice(last) });
  return out;
}

/** 글자만 필요한 곳(목록 미리보기·홈 카드·알림) — `(사랑해)` → `사랑해`. 아는 단어만 벗긴다. */
export function miniToPlain(text: string): string {
  return text.replace(new RegExp(MINI_RE_SRC, 'g'), '$1');
}

/** 고른 미니를 커서 자리에 넣는다 — 꼼톡 insertParen 과 같은 규칙(고른 범위는 바꾼다). 새 글과 커서 위치를 돌려준다. */
export function insertMiniToken(value: string, start: number, end: number, word: string): { value: string; caret: number } {
  const token = `(${word})`;
  const s = Math.max(0, Math.min(start, value.length));
  const e = Math.max(s, Math.min(end, value.length));
  return { value: value.slice(0, s) + token + value.slice(e), caret: s + token.length };
}

/** 편지 서랍에 늘어놓을 미니 — 보낸 사람 것(꿀됑·꼼이 도장 등)을 앞에, 그다음 꼼이미니. */
export function miniItemsFor(from?: string): { word: string; src: string }[] {
  const own = Object.entries((from && TEXT_STICKER_BY_SENDER[from]) || {}).map(([word, src]) => ({ word, src }));
  const ownWords = new Set(own.map((o) => o.word));
  return [...own, ...SAIDAMI_STICKERS.filter((s) => !ownWords.has(s.word)).map((s) => ({ word: s.word, src: s.image }))];
}
