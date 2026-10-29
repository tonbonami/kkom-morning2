'use client';

import React, { useEffect, useLayoutEffect, useRef, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Send, ImagePlus, Smile, CornerDownRight, Copy, Trash2, Pencil, Mic, Play, Pause, Bookmark, BookmarkCheck, Hourglass, Download, Loader2, Palette, Check, Sparkles, Plus, Keyboard, Search } from 'lucide-react';
import { saveMedia } from '@/lib/saveMedia';
import { firstUrl, youTubeId } from '@/lib/links';
import { igPost } from '@/lib/instagram';
import { addShare, deleteShare, subscribeShareList, type ShareItemView } from '@/lib/share';
import { addWish } from '@/lib/wishlist';
import { isPractice, practiceBlocked } from '@/lib/practice';
import { isNaverPlaceUrl, looksNaver, storeNameFromText } from '@/lib/naverPlace';
import {
  type ChatMessage, type ReplyRef,
  subscribeTyping, setTyping, markRead, subscribeRead, uploadChatImage, uploadChatAudio, uploadChatVideo,
  toggleReaction, deleteMessage, editMessage, toggleStar, fetchRecentMessages,
} from '@/lib/chat';
import { MOOD_OPTIONS } from '@/lib/moods';
import { normForMatch, toJamo, prepareAlias, matchTier, isConsonantsOnly, type PreparedAlias } from '@/lib/hangulMatch';
import StickerSuggestTray, { type SuggestItem } from './StickerSuggestTray';
import StickerSendPreview from './StickerSendPreview';
import StickerTextStack from './StickerTextStack';
import ChatEffectLayer, { type ChatEffect } from '@/components/ChatEffectLayer';

// 메시지 효과 키워드 → 이모지
function effectFor(text: string): string[] | null {
  if (!text) return null;
  if (/사랑해|사랑행|러브|❤️|💕|💗|💖|하트/.test(text)) return ['❤️', '💕', '💗', '💖', '😍'];
  if (/축하|생일|🎉|🎊|축하해|생축/.test(text)) return ['🎉', '🎊', '✨', '🥳', '🎈'];
  if (/ㅋㅋㅋ|ㅎㅎㅎ|😂|🤣/.test(text)) return ['😂', '🤣', '😆', '😹'];
  if (/눈 ?와|❄️|눈온다|첫눈|겨울|눈내|화이트/.test(text)) return ['❄️', '🌨️', '⛄', '✨'];
  if (/뽀뽀|💋|😘|쪽/.test(text)) return ['💋', '😘', '💕', '🥰'];
  return null;
}

function fmtDur(s: number): string {
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.max(0, s % 60)).padStart(2, '0')}`;
}

// 음성 메시지 말풍선 (재생/일시정지 + 의사 파형 + 길이)
function VoiceBubble({ url, dur, mine }: { url: string; dur: number; mine: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const toggle = () => {
    let a = audioRef.current;
    if (!a) {
      a = new Audio(url); audioRef.current = a;
      a.ontimeupdate = () => setPos(a && a.duration ? a.currentTime / a.duration : 0);
      a.onended = () => { setPlaying(false); setPos(0); };
    }
    if (playing) { a.pause(); setPlaying(false); } else { a.play().catch(() => {}); setPlaying(true); }
  };
  const bars = 22;
  return (
    <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl shadow-sm ${mine ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
      style={{ background: mine ? 'var(--ct-my-bg)' : 'var(--ct-partner-bg)' }}>
      <button onClick={toggle} aria-label="재생" className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: mine ? 'var(--ct-my-btn)' : 'var(--ct-my-bg)', color: 'var(--ct-my-text)' }}>
        {playing ? <Pause size={15} /> : <Play size={15} />}
      </button>
      <div className="flex items-center gap-[2px] h-6">
        {Array.from({ length: bars }).map((_, i) => {
          const active = i / bars <= pos;
          const h = 6 + ((i * 7) % 14);
          return <span key={i} className="w-[3px] rounded-full"
            style={{ height: h, background: mine ? (active ? 'var(--ct-my-text)' : 'var(--ct-my-bar-off)') : (active ? 'var(--ct-my-bg)' : '#cbd5e1') }} />;
        })}
      </div>
      <span className="text-[11px] font-semibold" style={{ color: mine ? 'var(--ct-my-text)' : 'var(--ct-partner-text)', opacity: 0.9 }}>{fmtDur(dur)}</span>
    </div>
  );
}

interface Props {
  me: string;
  partner: string;
  messages: ChatMessage[];
  open: boolean;
  onClose: () => void;
  onSend: (text: string, imageUrl?: string, sticker?: string, replyTo?: ReplyRef, audio?: { url: string; dur: number }, video?: { url: string; dur?: number }) => void | Promise<void>;
  partnerOnline: boolean;
  partnerOnWatch?: boolean;   // 폰은 꺼졌고 워치만 켜짐 — '워치로 보는 중'(길게 답장은 못 하는 상태)
  onLoadMore: () => void;
  hasMore: boolean;
  onSendCapsule: (text: string, deliverAt: Date) => void;
}

const keyOf = (name: string) => (name === '우댕' ? 'udaeng' : 'kkomi');
const avatarOf = (name: string) => (name === '우댕' ? '/avatars/woodang_avatar.png' : '/avatars/kkomi_avatar.png');
const REACTIONS = ['❤️', '😂', '🥺'];

function timeText(d: Date | null): string {
  if (!d) return '';
  const h = d.getHours(); const m = d.getMinutes();
  const ap = h < 12 ? '오전' : '오후';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${ap} ${hh}:${String(m).padStart(2, '0')}`;
}
function dayText(d: Date | null): string {
  if (!d) return '';
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return '오늘';
  const y = new Date(now.getTime() - 86400000);
  if (d.toDateString() === y.toDateString()) return '어제';
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}
// 미니 이모티콘 — 텍스트에 [[e:id]] 토큰으로 인라인 삽입. 렌더 시 작은 이미지로 치환.
const EMO_RE = /\[\[e:([a-z]+)\]\]/g;

// 카톡식 텍스트 스티커 — (야호) 같은 단어를 커스텀 포차코 스티커로 자동 치환.
// 단어 추가하려면 여기에 '단어': '/이미지경로' 만 넣으면 됨.
const TEXT_STICKERS: Record<string, string> = {
  '야호': '/pochacco/pochacco_yaho.png',
  '사랑해': '/pochacco_couple/love.png',
  '보고파': '/pochacco_couple/miss.png',
  '굿모닝': '/pochacco_couple/morning.png',
  '토닥토닥': '/pochacco_couple/pat.png',
  '뽀뽀': '/pochacco_couple/kiss.png',
  '헹가래': '/pochacco_couple/cheer.png',
  '날아가자': '/pochacco_couple/heli.webp',
  // 진짜 동영상 스티커 (편지처럼 MP4 재생) — 데모: 기존 편지 포차코 영상
  '하트': '/letter-stickers/pochacco-heart.mp4',
  '장미': '/letter-stickers/pochacco-rose.mp4',
};
// 배경 있는 풀씬 스티커 — 채팅에서 꽉 차게 크게 렌더한다.
const FULL_STICKERS = new Set(['/pochacco_couple/heli.webp']);
// 스티커 소스가 동영상(mp4/webm/mov)인지 → <video>로 진짜 재생. 아니면 정지 이미지.
const isVideoSrc = (src: string) => /\.(mp4|webm|mov)$/i.test(src);
const posterOf = (src: string) => src.replace(/\.(mp4|webm|mov)$/i, '-poster.webp');
// 서랍 썸네일 — 움짤(sai-anim webp)은 정지컷(-still.png)으로. 서랍에서 여러 개 동시 애니 디코딩 방지.
const drawerThumb = (src: string) => src.includes('/emo/sai-anim/') ? src.replace(/\.webp(\?.*)?$/, '-still.png$1') : src;
// (단어) 매칭 정규식(STICKER_ALT/RICH_RE/STICKER_RE)은 꼼이미니(SAIDAMI) 단어까지 합쳐야 해서
// SAIDAMI_STICKERS 정의 뒤(아래)에서 만든다.
// 스티커 포켓 그리드 — 텍스트 스티커들을 탭해서 큰 단독 스티커로 전송(투명 배경, 말풍선 없음).
const POCKET_STICKERS = Object.entries(TEXT_STICKERS).map(([word, image]) => ({ word, image }));
// Dang's 탭 — 단독 스티커(탭해서 크게 전송). 추가하려면 여기 { word, image } 한 줄.
// 꼼이(별) 탭 — 움직이는 이모티콘 모음(사이담 제작, 투명 배경 애니 webp). 서랍의 첫 탭.
// ⚠️ 서랍(피커)엔 정지컷(-still.png)만 띄우고, 보낼 때/채팅에선 webp가 재생된다.
//    6개 움짤을 서랍에서 동시에 디코딩하면 저사양 기기가 버벅여서(사이담 경고).
const ANIM_RAW: { word: string; image: string; still: string }[] = [
  { word: '안녕!',     image: '/emo/sai-anim/hi.webp',      still: '/emo/sai-anim/hi-still.png' },
  { word: '좋은 아침',  image: '/emo/sai-anim/sunrise.webp', still: '/emo/sai-anim/sunrise-still.png' },
  { word: '두근두근',   image: '/emo/sai-anim/doki.webp',    still: '/emo/sai-anim/doki-still.png' },
  { word: '사랑해',     image: '/emo/sai-anim/love.webp',    still: '/emo/sai-anim/love-still.png' },
  { word: '보고싶어',   image: '/emo/sai-anim/missyou.webp', still: '/emo/sai-anim/missyou-still.png' },
  { word: '고마워',     image: '/emo/sai-anim/thanks.webp',  still: '/emo/sai-anim/thanks-still.png' },
  { word: '삐짐',       image: '/emo/sai-anim/sulk.webp',    still: '/emo/sai-anim/sulk-still.png' },
  { word: '흥!',        image: '/emo/sai-anim/wave.webp',    still: '/emo/sai-anim/wave-still.png' },
  { word: '미안해',     image: '/emo/sai-anim/sorry.webp',   still: '/emo/sai-anim/sorry-still.png' },
  { word: '잘자',       image: '/emo/sai-anim/night.webp',   still: '/emo/sai-anim/night-still.png' },
  { word: '씻고 올게',  image: '/emo/sai-anim/bath.webp',    still: '/emo/sai-anim/bath-still.png' },
  { word: '아파',       image: '/emo/sai-anim/sick.webp',    still: '/emo/sai-anim/sick-still.png' },
  { word: '좋아!',      image: '/emo/sai-anim/yay.webp',     still: '/emo/sai-anim/yay-still.png' },
  { word: '으악',       image: '/emo/sai-anim/yell.webp',    still: '/emo/sai-anim/yell-still.png' },
  { word: '축하해!',    image: '/emo/sai-anim/party.webp',   still: '/emo/sai-anim/party-still.png' },
  { word: '선물',       image: '/emo/sai-anim/gift.webp',    still: '/emo/sai-anim/gift-still.png' },
  { word: '부끄',       image: '/emo/sai-anim/shy.webp',     still: '/emo/sai-anim/shy-still.png' },
  { word: '꼬옥',       image: '/emo/sai-anim/hug.webp',     still: '/emo/sai-anim/hug-still.png' },   // ⚠️ 새 커플 캐릭터(남↔여) — 기존 꼼이 한 마리와 다름
  { word: '빼꼼',       image: '/emo/sai-anim/peek.webp',    still: '/emo/sai-anim/peek-still.png' },  // ⚠️ 장면 스티커(배경 그려진 둥근 카드, 투명 컷아웃 아님)
  { word: '일어나기 싫어', image: '/emo/sai-anim/bed.webp',   still: '/emo/sai-anim/bed-still.png' },   // 장면 카드 — 이불 속
  { word: '비온다',     image: '/emo/sai-anim/rain.webp',    still: '/emo/sai-anim/rain-still.png' },  // 장면 카드 — 창밖 비
  // 꼼모닝이 Kling으로 만든 것(사이담 제작 아님) — 원본·키프레임은 art/kling/puff, art/kling/sleepy
  { word: '힘내!',      image: '/emo/sai-anim/himnae.webp',  still: '/emo/sai-anim/himnae-still.png' }, // 털 펑
  { word: '졸려',       image: '/emo/sai-anim/doze.webp',    still: '/emo/sai-anim/doze-still.png' },   // 콧방울 펑(반복 고리)
  { word: '뽀뽀',       image: '/emo/sai-anim/kiss.webp',    still: '/emo/sai-anim/kiss-still.png' },   // 귀로 하트(반복 고리) — art/kling/kiss
  { word: '퇴근!',      image: '/emo/sai-anim/offwork.webp', still: '/emo/sai-anim/offwork-still.png' }, // 6시 땡 → 귀 날개로 날아 퇴근(꼼이 퇴근 23번, 거의 18시) — art/kling/offwork
];
// ⚠️ sai-anim webp/still을 사이담이 같은 이름으로 재인코딩(알파 복구·재작업)할 때마다 EMO_V를 +1 → 기기 캐시 무효화(전역).
//   2026-09-11 알파 복구(라이트에서 눈 회색) 14종 반영으로 3. (사이담 EMO_V와 별개, 값만 맞춰 올리면 됨)
//   2026-09-13 크기 74% 통일(캐릭터키 기준) 15종 + still 재생성 → 4. 폭죽 59%→74% 등. 으악은 우리는 팩에 남김(사이담은 리타이어).
const EMO_V = 4;
const ANIM_STICKERS = ANIM_RAW.map((s) => ({ ...s, image: `${s.image}?v=${EMO_V}`, still: `${s.still}?v=${EMO_V}` }));

// ── 카톡식 이모티콘 추천 — 입력 텍스트의 키워드로 관련 스티커를 입력바 위에 띄운다(탭하면 전송) ──
type Suggestion = { key: string; image: string; thumb: string; mode: StickerMode };
const sugAnim = (w: string): Suggestion | undefined => {
  const a = ANIM_STICKERS.find((s) => s.word === w);
  return a ? { key: a.word, image: a.image, thumb: a.still, mode: 'gif' } : undefined;
};
const sugCouple = (w: string): Suggestion | undefined => {
  const img = TEXT_STICKERS[w];
  return img ? { key: w, image: img, thumb: img, mode: 'couple' } : undefined;
};
// 아래 세트 배열들(SAI/SAIDAMI/DANG/KKOM)은 이 파일 뒤에서 정의되지만, get()이 지연 호출이라 런타임엔 안전.
const sugSai = (w: string): Suggestion | undefined => {   // 말티푸 '사이' 팩(일상 단어)
  const s = SAI_STICKERS.find((x) => x.word === w);
  return s ? { key: s.word, image: s.image, thumb: drawerThumb(s.image), mode: 'maltipoo' } : undefined;
};
const sugMini = (w: string): Suggestion | undefined => {  // 사이담이 미니 표정
  const s = SAIDAMI_STICKERS.find((x) => x.word === w);
  return s ? { key: s.word, image: s.image, thumb: s.image, mode: 'mini' } : undefined;
};
const sugDang = (w: string): Suggestion | undefined => {
  const s = DANG_STICKERS.find((x) => x.word === w);
  return s ? { key: s.word, image: s.image, thumb: s.image, mode: 'dang' } : undefined;
};
const sugKkom = (w: string): Suggestion | undefined => {
  const s = KKOM_STICKERS.find((x) => x.word === w);
  return s ? { key: s.word, image: s.image, thumb: s.image, mode: 'kkom' } : undefined;
};
const sugKkul = (w: string): Suggestion | undefined => {  // 꿀댕이(꿀벌 조끼 아기돼지) 16종
  const s = KKUL_STICKERS.find((x) => x.word === w);
  return s ? { key: s.word, image: s.image, thumb: s.image, mode: 'kkul' } : undefined;
};
const sugKkulAnim = (w: string): Suggestion | undefined => {  // 꿀됑 움짤
  const s = KKUL_ANIM.find((x) => x.word === w);
  return s ? { key: s.word, image: s.image, thumb: drawerThumb(s.image), mode: 'kkulgif' } : undefined;
};
const sugUri = (w: string): Suggestion | undefined => {  // 우리(꿀됑+꼼이 커플) 16종
  const s = URI_STICKERS.find((x) => x.word === w);
  return s ? { key: s.word, image: s.image, thumb: s.image, mode: 'uri' } : undefined;
};

// ── 키워드(동의어) → 관련 스티커 규칙 ──
// ⚠️ 한 이모티콘 ≠ 한 단어. 여러 동의어·구어·오타·초성까지 걸어 '일상 단어'로 다 뜨게 한다.
//   ⚠️ SAI 일상팩(출근·배고파·헐·맛점·심심해…)과 미니·당·꼼이 예전엔 추천에서 통째로 빠져 있었음 → 여기서 다 포함.
//   각 규칙의 첫 스티커가 대표(밑줄 탭 시 이게 전송됨). 위에서부터 매칭.
const SUGGEST_RULES: { re: RegExp; get: () => (Suggestion | undefined)[] }[] = [
  // ── 꿀댕이 전용(둘만 쓰는 말) ──
  { re: /꼼슌|꼼슌아|꼼슌이|꼼슌띠/,                            get: () => [sugKkul('꼼슌아')] },
  { re: /꼼돌|꼼돌아|꼼돌이/,                                  get: () => [sugSai('꼼돌아')] },   // 꼼이가 우댕을 부르는 말 — 꿀됑 「꼼슌아」의 짝
  { re: /화이트닝/,                                            get: () => [sugKkul('화이트닝')] },
  { re: /^(응+|웅+|ㅇㅇ+|맞아|맞아맞아|알겠어|오케이?|ㅇㅋ)(?![가-힣])/, get: () => [sugKkul('응응')] },

  // ── 인사·아침·밤·잠 ──
  { re: /굿모닝|좋은\s?아침|모닝(?!콜)|잘\s?잤|일어났|기상(?!청|캐스)/, get: () => [sugAnim('좋은 아침'), sugSai('굿모닝'), sugCouple('굿모닝'), sugKkul('좋은아침')] },
  { re: /안녕|하이|방가|ㅎㅇ|하잉|헬로|하이염/,                  get: () => [sugAnim('안녕!')] },
  { re: /잘\s?자|굿\s?밤|굿나잇|자자|자야|잘게|취침|나이트|굿밤/, get: () => [sugAnim('잘자'), sugSai('굿밤')] },
  { re: /일어나|기상|깨워|깨어나|모닝\s?콜|늦잠|그만\s?자/,      get: () => [sugKkulAnim('일어나 붕붕'), sugKkul('좋은아침')] },
  { re: /졸려|졸립|하품|잠\s?와|잠온|눈\s?감|나른/,             get: () => [sugAnim('졸려'), sugSai('졸려'), sugMini('졸려')] },
  { re: /일어나기\s?싫|이불|늦잠|더\s?잘래|눕고|자고\s?싶/,      get: () => [sugAnim('일어나기 싫어')] },

  // ── 사랑·보고싶·설렘·스킨십 ──
  { re: /사랑|러브|❤|💕|💗|좋아해|조아해|사랑해|알러뷰/,        get: () => [sugAnim('사랑해'), sugMini('사랑해'), sugCouple('사랑해'), sugAnim('두근두근'), sugKkul('사랑해')] },
  { re: /보고\s?싶|보고파|그리워|보곺|생각나|보고시퍼/,          get: () => [sugAnim('보고싶어'), sugMini('보고파'), sugCouple('보고파'), sugKkul('보고싶어')] },
  { re: /두근|설레|떨려|콩닥|심쿵/,                            get: () => [sugAnim('두근두근')] },
  { re: /뽀뽀|쪽쪽|쪽!|😘|💋|키스|입맞/,                       get: () => [sugAnim('뽀뽀'), sugKkulAnim('기습 뽀뽀'), sugKkul('뽀뽀'), sugCouple('뽀뽀')] },
  { re: /안아(?!파|프)|포옹|꼬옥|폭\s?안|안겨|허그|안아줘|꼭\s?안/, get: () => [sugAnim('꼬옥'), sugMini('안아줘'), sugCouple('토닥토닥'), sugKkul('꼬옥'), sugKkulAnim('안아줘 꼬리하트')] },
  { re: /토닥|다독|위로|괜찮아|다\s?잘\s?될/,                   get: () => [sugCouple('토닥토닥'), sugMini('평온'), sugKkul('괜찮아?')] },

  // ── 긍정 감정 ──
  { re: /행복|기뻐|행복해|좋다(?![가-힣])|만족/,                get: () => [sugMini('행복'), sugAnim('좋아!')] },
  { re: /신나|들떠|룰루|기대돼|설렌|개신남/,                    get: () => [sugMini('신나'), sugCouple('야호')] },
  { re: /평온|편안|힐링|여유|느긋/,                            get: () => [sugMini('평온')] },
  { re: /반짝|빛나|예뻐|이뻐|반짝반짝|영롱/,                    get: () => [sugMini('반짝')] },
  { re: /하트|❤️|💛|💙|💜|하투/,                              get: () => [sugMini('하트'), sugCouple('하트')] },
  { re: /야호|이야|우와|와아|신난다/,                          get: () => [sugKkul('야호!'), sugCouple('야호'), sugMini('신나')] },

  // ── 부정 감정 ──
  { re: /삐졌|삐짐|삐질|흥칫|서운|토라|시무룩/,                  get: () => [sugMini('삐졌어'), sugAnim('삐짐'), sugAnim('흥!')] },
  { re: /화났|화나|빡쳐|짜증|열받|킹받|화남/,                   get: () => [sugMini('화났어')] },
  { re: /속상|서럽|눈물|슬퍼|슬프|우울|ㅠㅠ|ㅜㅜ|훌쩍/,          get: () => [sugMini('속상해')] },
  { re: /흥!|칫(?![가-힣])|삐룽/,                              get: () => [sugAnim('흥!')] },

  // ── 미안·고마·축하·칭찬·응원 ──
  { re: /미안|죄송|쏘리|sorry|ㅈㅅ|사과할|미얀/,                get: () => [sugAnim('미안해'), sugKkul('미안해'), sugSai('미안'), sugMini('미안해')] },
  { re: /고마|감사|땡큐|thanks|ㄱㅅ|고맙|감솨/,                 get: () => [sugAnim('고마워'), sugMini('고마워'), sugKkul('고마워')] },
  { re: /축하|생일|생축|축하해|🎉|🎊|추카/,                     get: () => [sugAnim('축하해!'), sugAnim('선물')] },
  { re: /선물|기프트|present|기프티콘/,                         get: () => [sugAnim('선물')] },
  { re: /칭찬|잘했|대견|기특|잘한다|기특해/,                    get: () => [sugMini('잘했어'), sugMini('칭찬해줘')] },
  { re: /짝짝|박수|굿잡|짝짝짝/,                               get: () => [sugMini('짝짝짝')] },
  { re: /힘내|화이팅|파이팅|아자|응원|힘들|지치/,               get: () => [sugAnim('힘내!'), sugMini('힘내'), sugCouple('헹가래')] },
  { re: /헹가래|헹\s?가래/,                                    get: () => [sugCouple('헹가래')] },
  { re: /꽃다발|꽃\s?줄|플라워|장미|꽃선물/,                    get: () => [sugMini('꽃다발'), sugCouple('장미'), sugKkulAnim('꽃 줄게')] },
  { re: /최고|짱(?![가-힣])|짱이|굿(?![가-힣])|좋았|대박|멋져|쩐다|리스펙|👍/, get: () => [sugAnim('좋아!'), sugMini('최고야')] },

  // ── 놀람·리액션·웃음 ──
  { re: /헐|헉|대박|깜짝|놀랐|놀람|뭐야|실화|미쳤|헐랭|헉스/,    get: () => [sugSai('헐'), sugAnim('으악'), sugKkul('진짜아?'), sugKkul('으악')] },
  { re: /진짜\?|진짜아|레알\?|정말\?|ㄹㅇ\?/,                     get: () => [sugKkul('진짜아?')] },
  { re: /으악|으아|꺄|악!|끼야/,                               get: () => [sugAnim('으악'), sugSai('헐'), sugKkulAnim('으악 펄쩍'), sugKkul('으악')] },
  { re: /ㅋㅋ|ㅎㅎ|웃겨|웃김|빵\s?터|풉|낄낄|개웃|ㅋ큐/,         get: () => [sugSai('ㅋㅋㅋ'), sugKkul('ㅋㅋㅋ')] },
  { re: /뭐해|모해|뭐하|머해|뭐함|뭐하니|모하/,                 get: () => [sugSai('뭐해?')] },
  { re: /ㄴㄴ|아니야|아니(?![가-힣])|노노|싫어|절대\s?안|안돼|노우/, get: () => [sugSai('ㄴㄴ')] },
  { re: /부끄|수줍|쑥스|민망|부끄러/,                          get: () => [sugAnim('부끄')] },
  { re: /빼꼼|까꿍|몰래\s?봄|살짝\s?봄/,                        get: () => [sugAnim('빼꼼')] },
  { re: /얍|얏|에잇|받아라|얍얍|펀치|공격/,                      get: () => [sugKkom('얍')] },

  // ── 일상: 밥·출퇴근·이동·상태 ──
  { re: /배고파|배고픔|허기|꼬르륵|밥\s?줘|밥\s?먹고|먹고\s?싶|배곺/, get: () => [sugSai('배고파'), sugKkul('배고파')] },
  { re: /맛점|점심|점심\s?뭐|밥\s?먹었|런치|점심시간/,           get: () => [sugSai('맛점')] },
  { re: /배불|배\s?터|과식|든든|잘\s?먹었|배불러/,              get: () => [sugSai('배불러')] },
  { re: /출근|회사\s?간|일하러|지각|출근중|일\s?간다|출근길/,     get: () => [sugSai('출근중')] },
  { re: /퇴근|집\s?간다|이제\s?집|퇴근각|칼퇴/,                 get: () => [sugAnim('퇴근!'), sugSai('가는중'), sugSai('도착!'), sugKkul('가는중')] },
  { re: /가는\s?중|가고\s?있|출발했|이동중|가는중|출발한다/,      get: () => [sugSai('가는중'), sugKkul('가는중')] },
  { re: /도착|왔어(?![가-힣])|집\s?왔|다\s?왔|도착함|도착!/,     get: () => [sugSai('도착!'), sugKkul('도착!')] },
  { re: /바빠|바쁨|정신없|바쁘|바빠서|바쁠/,                    get: () => [sugSai('바빠')] },
  { re: /심심|노잼|재미없|지루|할\s?거\s?없|심심해/,            get: () => [sugSai('심심해')] },
  { re: /씻고\s?올|샤워하고|씻으러|목욕/,                       get: () => [sugAnim('씻고 올게')] },
  { re: /양치|이\s?닦|치카|칫솔/,                              get: () => [sugDang('치카치카'), sugKkom('치카치카')] },
  { re: /꾸미는|화장|메이크업|단장|꾸안꾸/,                     get: () => [sugKkom('꾸미는 중')] },
  { re: /달려가|뛰어가|급하게\s?가|헐레벌떡/,                   get: () => [sugKkom('달려가는 중')] },
  { re: /인싸|파티\s?가|놀러\s?가/,                            get: () => [sugKkom('인싸강아지')] },
  { re: /날아|훨훨|날아가|떠나자|여행\s?가|어디론가|날아오/,      get: () => [sugCouple('날아가자')] },
  { re: /귀여|커여|기여|졸귀|귀엽|커엽/,                        get: () => [sugDang('귀엽꼬미'), sugDang('앙 귀여워'), sugKkul('앙귀여워')] },
  { re: /푸데데|푸데뎅|꿀잠|낮잠|쿨쿨|새근새근|곤히\s?자/,        get: () => [sugKkul('푸데데'), sugDang('푸데데'), sugKkom('푸데데')] },  // 둘만의 말 = 꿀잠

  // ── 아픔·날씨 ──
  { re: /아파|아프|열나|감기|몸살|아픔|몸\s?안\s?좋|골골/,       get: () => [sugAnim('아파'), sugMini('아파'), sugKkul('괜찮아?')] },
  { re: /비\s?와|비\s?온|비온다|장마|우중충|빗소리|비\s?내|비올/, get: () => [sugAnim('비온다')] },
];
// 입력 정규화 — 정규식 매칭 '전에' 변형을 흡수한다(사이담 아이디어의 안전판 버전).
//   · 반복 3+글자 → 2로: 「배고파아아아」→「배고파아」 (→ /배고파/ 걸림)
//   · 공백은 '제거'가 아니라 '한 칸으로 축약': 「가는  중」(두 칸)→「가는 중」 (→ /가는\s?중/ 걸림)
//   ⚠️ 공백을 아예 지우면 substring식 오탐(예: 「미안해」에 「안해」)이 생긴다 — 우린 regex라 이 선을 지킨다.
function normalizeInput(t: string): string {
  return t.replace(/\s+/g, ' ').replace(/(.)\1{2,}/gu, '$1$1');
}
// ── 카톡식 추천 2단계: '뜻 묶음'(intent) 표 — 지금 치고 있는 단어로 찾는다(2026-10-15, 우댕 요청 + GPT 상의).
//   우댕: "카톡은 ㄱ만 눌러도 가는중이 떠. ㅂ만 눌러도 배고파. 가는중이 출근중일 수도, 배고파가 꼬르륵일 수도 있잖아."
//   · aliases = 커플이 실제로 칠 법한 말(구어·줄임·오타·초성). 이름 자체도 넣는다.
//   · 마지막 단어의 '자모 앞부분'으로 맞추므로 조합 중(「살」「백」)에도 뜬다 — src/lib/hangulMatch.ts.
//   · 자음 한 글자(ㄱ·ㅂ…)는 너무 모호해서 KEY_SHORTCUTS 표에 적은 것만, 최대 6개.
//   · 아래 SUGGEST_RULES(문장 전체 정규식)는 '문맥 보조'로 낮은 점수만 준다(오래된 단어가 지금 치는 말을 밀어내지 않게).
// pop = 둘이 실제로 많이 쓰는 말 가산점(우댕이 보낸 메시지 2,049개 집계: 부르기 394·ㅋㅋ 185·사랑 155·보고싶 97·배고파 93…).
type Intent = { id: string; aliases: string[]; pop?: number; get: () => (Suggestion | undefined)[] };
const INTENTS: Intent[] = [
  { id: 'call',     pop: 6, aliases: ['꼼슌아', '꼼슌', '꼼슌이', '꼼슌띠', '꼼이', '꼼아', '자기야', '애기야', '여보', '내강아지', '강아지야', '겸둥아', '겸둥이', 'ㄲㅅ'], get: () => [sugKkul('꼼슌아')] },
  { id: 'callback', pop: 4, aliases: ['꼼돌아', '꼼돌', '꼼돌이', 'ㄲㄷ'], get: () => [sugSai('꼼돌아')] },
  { id: 'hello',    aliases: ['안녕', '안뇽', '안냥', '하이', '하잉', '헬로', '방가', '반가워', 'ㅎㅇ', 'hi', 'hello'], get: () => [sugAnim('안녕!')] },
  { id: 'morning',  pop: 3, aliases: ['좋은아침', '굿모닝', '모닝', '잘잤어', '잘잤니', '일어났어', '기상', '아침이야', '조은아침', '굿몽', 'ㄱㅁ'], get: () => [sugKkul('좋은아침'), sugUri('꼼모닝'), sugAnim('좋은 아침'), sugSai('굿모닝'), sugCouple('굿모닝')] },
  { id: 'doki',     aliases: ['두근두근', '두근', '설레', '설렌다', '떨려', '콩닥콩닥', '심쿵', '긴장돼', 'ㄷㄱㄷㄱ'], get: () => [sugAnim('두근두근')] },
  { id: 'love',     pop: 6, aliases: ['사랑해', '사랑', '사랑해요', '사랑한다', '좋아해', '조아해', '알러뷰', '러브', '러브유', '내사랑', '사룽해', 'ㅅㄹㅎ', 'ㅅㄹ', 'love', '❤', '❤️', '💕', '💗'], get: () => [sugKkul('사랑해'), sugUri('사랑해'), sugAnim('사랑해'), sugMini('사랑해'), sugCouple('사랑해'), sugMini('하트')] },
  { id: 'miss',     pop: 5, aliases: ['보고싶어', '보고싶다', '보고파', '그리워', '생각나', '생각나서', '보곺', '보고시퍼', '언제봐', '만나고싶어', 'ㅂㄱㅅㅇ', 'ㅂㄱㅍ'], get: () => [sugKkul('보고싶어'), sugAnim('보고싶어'), sugMini('보고파'), sugCouple('보고파')] },
  { id: 'thanks',   pop: 3, aliases: ['고마워', '고맙다', '고마웡', '고마워요', '고맙', '감사해', '감사', '땡큐', '감솨', 'ㄱㅅ', 'ㄳ', 'thanks', 'thx'], get: () => [sugKkul('고마워'), sugAnim('고마워'), sugMini('고마워')] },
  { id: 'sulk',     aliases: ['삐짐', '삐졌어', '삐질거야', '삐졌다', '서운해', '서운', '토라졌어', '시무룩', '흥칫뿡', 'ㅃㅈ'], get: () => [sugAnim('삐짐'), sugUri('삐짐'), sugMini('삐졌어'), sugAnim('흥!')] },
  { id: 'hmph',     aliases: ['흥', '흥칫', '칫', '몰라', '흥이다', '에잇'], get: () => [sugAnim('흥!'), sugAnim('삐짐')] },
  { id: 'sorry',    pop: 2, aliases: ['미안해', '미안', '미안해요', '미안하다', '죄송해', '죄송', '쏘리', '사과할게', '미얀', '먄', 'ㅈㅅ', 'sorry'], get: () => [sugAnim('미안해'), sugKkul('미안해'), sugSai('미안'), sugMini('미안해'), sugUri('화해')] },
  { id: 'wakeup',   pop: 3, aliases: ['일어나', '일어나라', '일어나자', '일어나세요', '일어날시간', '기상', '기상해', '기상기상', '깨워', '깨워줘', '깨어나', '모닝콜', '알람', '늦잠', '그만자', 'ㅇㅇㄴ'], get: () => [sugKkulAnim('일어나 붕붕'), sugKkul('좋은아침'), sugAnim('좋은 아침')] },
  { id: 'tteok1',   pop: 2, aliases: ['찰떡', '찰떡커플', '찰떡궁합', '우리는찰떡', '찰떡이야'], get: () => [sugKkulAnim('찰떡!'), sugKkulAnim('찰떡 쑥떡 콩떡 개떡')] },
  { id: 'tteok2',   pop: 2, aliases: ['쑥떡'], get: () => [sugKkulAnim('쑥떡!'), sugKkulAnim('찰떡 쑥떡 콩떡 개떡')] },
  { id: 'tteok3',   pop: 2, aliases: ['콩떡'], get: () => [sugKkulAnim('콩떡!'), sugKkulAnim('찰떡 쑥떡 콩떡 개떡')] },
  { id: 'tteok4',   pop: 2, aliases: ['개떡'], get: () => [sugKkulAnim('개떡!'), sugKkulAnim('멍!'), sugKkulAnim('찰떡 쑥떡 콩떡 개떡')] },
  { id: 'tteok5',   pop: 2, aliases: ['멍', '멍!', '멍멍', '멍때려', '멍때림'], get: () => [sugKkulAnim('멍!')] },   // 떡 말놀이 끝에 둘이 외치는 「멍!」(우댕 2026-10-27)
  { id: 'yaksok',   pop: 3, aliases: ['약속', '약속!', '약속해', '약속할게', '약속이야', '꼭이야', '손가락걸어', '새끼손가락', '도장', '도장꾹'], get: () => [sugKkul('약속!'), sugSai('약속!')] },   // 꼼이 발바닥 도장 · 꿀됑 코 도장(내 캐릭터가 앞)
  { id: 'hehe',     pop: 4, aliases: ['헤헤', '헤헤헤', '헤헷', '헿', '흐흐', '히히', '헤헤헤헤'], get: () => [sugSai('헤헤'), sugMini('헤헤')] },
  { id: 'offwork',  pop: 5, aliases: ['퇴근', '퇴근해', '퇴근했어', '퇴근한다', '퇴근이다', '퇴근중', '퇴근각', '칼퇴', '집간다', '집에간다', 'ㅌㄱ'], get: () => [sugAnim('퇴근!'), sugKkul('가는중'), sugSai('가는중')] },
  { id: 'night',    pop: 2, aliases: ['잘자', '잘자요', '자야겠다', '잘게', '굿밤', '굿나잇', '취침', '꿈꿔', '자러갈게', '자자', 'ㅈㅈ'], get: () => [sugAnim('잘자'), sugUri('잘자'), sugSai('굿밤')] },
  { id: 'bath',     aliases: ['씻고올게', '씻으러', '씻으러가', '샤워', '샤워할게', '샤워하고올게', '목욕', '씻는중', '세수', 'ㅆㄱㅇㄱ'], get: () => [sugAnim('씻고 올게')] },
  { id: 'sick',     pop: 3, aliases: ['아파', '아프다', '아파요', '아픔', '감기', '몸살', '열나', '골골', '몸안좋아', '컨디션', '병원', '두통', '배아파'], get: () => [sugAnim('아파'), sugMini('아파'), sugKkul('괜찮아?')] },
  { id: 'worried',  pop: 3, aliases: ['괜찮아', '괜찮니', '괜춘', '무슨일이야', '걱정돼', '걱정', '어디아파', '별일없지', 'ㄱㅊ'], get: () => [sugKkul('괜찮아?'), sugUri('괜찮아'), sugCouple('토닥토닥')] },
  { id: 'yay',      aliases: ['좋아', '좋다', '조아', '오예', '굿', '찬성', '좋았어', '마음에들어', 'ㅈㅇ'], get: () => [sugAnim('좋아!'), sugMini('최고야')] },
  { id: 'scream',   pop: 3, aliases: ['으악', '으아악', '으아', '악', '꺄', '깜짝이야', '깜짝', '놀랐어', '무서워', '펄쩍', '끼야'], get: () => [sugKkulAnim('으악 펄쩍'), sugKkul('으악'), sugAnim('으악'), sugSai('헐')] },
  { id: 'congrats', aliases: ['축하해', '축하', '축하한다', '추카', '추카해', '생일축하', '생축', '생일', '기념일', 'ㅊㅋ', '🎉', '🎊'], get: () => [sugAnim('축하해!'), sugUri('축하해'), sugAnim('선물'), sugCouple('헹가래')] },
  { id: 'gift',     aliases: ['선물', '선물이야', '선물줄게', '기프트', '기프티콘', '서프라이즈', '택배', '🎁'], get: () => [sugAnim('선물'), sugKkulAnim('꽃 줄게')] },
  { id: 'shy',      aliases: ['부끄러워', '부끄', '수줍어', '쑥스러워', '민망해', '창피해', '헤헤', 'ㅂㄲ'], get: () => [sugAnim('부끄')] },
  { id: 'hug',      pop: 3, aliases: ['안아줘', '안아줄게', '안고싶어', '꼬옥', '꼭안아', '포옹', '허그', '폭안겨', '안겨', 'ㅇㅇㅈ'], get: () => [sugKkulAnim('안아줘 꼬리하트'), sugKkul('꼬옥'), sugAnim('꼬옥'), sugMini('안아줘'), sugCouple('토닥토닥')] },
  { id: 'peek',     aliases: ['빼꼼', '까꿍', '슬쩍', '몰래봐', '살짝봐', '기웃기웃', 'ㅃㄲ'], get: () => [sugAnim('빼꼼')] },
  { id: 'bed',      aliases: ['일어나기싫어', '못일어나', '이불밖은위험해', '더잘래', '늦잠', '이불', '눕고싶어', '월요일싫어'], get: () => [sugAnim('일어나기 싫어')] },
  { id: 'rain',     aliases: ['비온다', '비와', '비오네', '비올듯', '장마', '우중충', '빗소리', '비내려', '우산', '☔'], get: () => [sugAnim('비온다')] },
  { id: 'cheer',    pop: 2, aliases: ['힘내', '힘내자', '화이팅', '파이팅', '아자', '아자아자', '응원', '응원할게', '잘할수있어', '기운내', '힘들어', '지쳤어', '고생했어', '고생해', 'ㅎㄴ'], get: () => [sugAnim('힘내!'), sugMini('힘내'), sugCouple('헹가래')] },
  { id: 'pudede',   aliases: ['푸데데', '푸데뎅', '꿀잠', '낮잠', '쿨쿨', '새근새근', 'ㅍㄷㄷ'], get: () => [sugKkul('푸데데'), sugUri('푸데데'), sugDang('푸데데'), sugKkom('푸데데')] },  // 둘만의 말 「푸데데」=꿀잠(삐짐 아님)
  { id: 'sleepy',   aliases: ['졸려', '졸립다', '졸림', '잠와', '잠온다', '하품', '나른해', '눈감겨', '꾸벅꾸벅', '피곤해', '피곤', 'ㅈㄹ'], get: () => [sugAnim('졸려'), sugSai('졸려'), sugMini('졸려')] },
  { id: 'kiss',     pop: 2, aliases: ['뽀뽀', '뽀뽀해줘', '쪽', '쪽쪽', '키스', '입맞춤', '음마', 'ㅃㅃ', '😘', '💋'], get: () => [sugAnim('뽀뽀'), sugKkulAnim('기습 뽀뽀'), sugKkul('뽀뽀'), sugCouple('뽀뽀')] },
  { id: 'cute',     pop: 4, aliases: ['귀여워', '귀엽다', '귀엽', '앙귀여워', '귀엽꼬미', '기여워', '커여워', '커엽다', '졸귀', '귀요미', '깨물고싶어', 'ㄱㅇㅇ'], get: () => [sugKkul('앙귀여워'), sugDang('귀엽꼬미'), sugDang('앙 귀여워')] },
  { id: 'lol',      pop: 6, aliases: ['ㅋㅋ', 'ㅋㅋㅋ', 'ㅎㅎ', '웃겨', '개웃겨', '빵터짐', '빵터져', '웃김', '풉', '낄낄', '웃기다', 'ㅋ큐', 'lol'], get: () => [sugKkulAnim('ㅋㅋㅋ 발라당'), sugKkul('ㅋㅋㅋ'), sugSai('ㅋㅋㅋ')] },
  { id: 'hungry',   pop: 5, aliases: ['배고파', '배고픔', '배곺', '꼬르륵', '출출해', '출출', '허기져', '허기', '밥줘', '뭐먹지', '먹고싶어', '야식', '간식', '굶었어', 'ㅂㄱㅍ'], get: () => [sugKkul('배고파'), sugSai('배고파'), sugSai('맛점')] },
  { id: 'going',    pop: 4, aliases: ['가는중', '가고있어', '출발', '출발했어', '출발한다', '이동중', '오는중', '퇴근', '퇴근중', '퇴근길', '집가는중', '집에가', '곧가', '금방가', '버스탔어', '지하철', '버스', '지금가', 'ㄱㄴㅈ'], get: () => [sugKkul('가는중'), sugSai('가는중'), sugKkom('달려가는 중'), sugSai('출근중')] },
  { id: 'commute',  aliases: ['출근', '출근중', '출근길', '회사가는중', '일하러가', '회사간다', '지각', '업무시작', 'ㅊㄱ'], get: () => [sugSai('출근중'), sugSai('가는중'), sugKkul('가는중'), sugSai('바빠')] },
  { id: 'arrive',   pop: 3, aliases: ['도착', '도착했어', '도착함', '왔어', '다왔어', '집왔어', '거의왔어', '도착완료', '내렸어', 'ㄷㅊ'], get: () => [sugKkul('도착!'), sugUri('왔어!'), sugSai('도착!')] },
  { id: 'really',   pop: 4, aliases: ['진짜', '진짜야', '진짜아', '정말', '레알', '실화', '실화냐', '진심', 'ㄹㅇ', 'ㅈㅉ'], get: () => [sugKkul('진짜아?'), sugSai('헐')] },
  { id: 'whitening', pop: 2, aliases: ['화이트닝', '화잇닝', '화트닝', 'ㅎㅇㅌㄴ'], get: () => [sugKkul('화이트닝'), sugUri('화이트닝')] },
  { id: 'yes',      pop: 4, aliases: ['응', '응응', '웅', '웅웅', '어엉', '맞아', '맞아맞아', '알겠어', '알았어', '오케이', '오키', '그래', 'ㅇㅇ', 'ㅇㅋ', 'ok'], get: () => [sugKkul('응응')] },
  { id: 'lunch',    aliases: ['맛점', '점심', '점심먹자', '밥먹자', '뭐먹을까', '식사', '런치', '점심시간', '밥먹었어', '밥', '맛있게먹어', 'ㅁㅈ'], get: () => [sugSai('맛점'), sugKkul('배고파')] },
  { id: 'what',     aliases: ['뭐해', '모해', '머해', '뭐하니', '뭐함', '뭐하는중', '지금뭐해', '모하냐', 'ㅁㅎ'], get: () => [sugSai('뭐해?')] },
  { id: 'full',     aliases: ['배불러', '배부르다', '배터져', '과식했어', '많이먹었어', '든든해', '잘먹었다', '잘먹었어', '배빵빵', 'ㅂㅂㄹ'], get: () => [sugSai('배불러')] },
  { id: 'bored',    aliases: ['심심해', '심심하다', '할거없어', '노잼', '지루해', '놀아줘', '무료해', '재미없어', 'ㅅㅅㅎ'], get: () => [sugSai('심심해')] },
  { id: 'omg',      pop: 3, aliases: ['헐', '헉', '대박', '뭐야', '충격', '미쳤다', '헐랭', '헉스', 'ㅎㄹ'], get: () => [sugSai('헐'), sugKkul('진짜아?'), sugAnim('으악')] },
  { id: 'no',       aliases: ['ㄴㄴ', '아니', '아니야', '노노', '싫어', '안돼', '절대안돼', '노우', '패스'], get: () => [sugSai('ㄴㄴ')] },
  { id: 'busy',     aliases: ['바빠', '바쁘다', '바쁨', '정신없어', '일하는중', '업무중', '회의중', '회의', '답장늦어', 'ㅂㅃ'], get: () => [sugSai('바빠')] },
  { id: 'happy',    aliases: ['행복', '행복해', '기분좋아', '너무좋아', '즐거워', '행복하다', '햄볶아', 'ㅎㅂ'], get: () => [sugMini('행복'), sugAnim('좋아!')] },
  { id: 'excited',  aliases: ['신나', '신난다', '들떴어', '룰루랄라', '개신남', '기대돼', '재밌겠다', '놀자', '야호', '우와', '와아', 'ㅅㄴ'], get: () => [sugMini('신나'), sugKkul('야호!'), sugCouple('야호')] },
  { id: 'calm',     aliases: ['평온', '편안해', '힐링', '여유', '느긋해', '고요해', '평화롭다'], get: () => [sugMini('평온')] },
  { id: 'sad',      aliases: ['속상해', '속상', '슬퍼', '슬프다', '우울해', '서러워', '눈물나', '울고싶어', '마음아파', '훌쩍', 'ㅠㅠ', 'ㅜㅜ'], get: () => [sugMini('속상해'), sugCouple('토닥토닥')] },
  { id: 'angry',    aliases: ['화났어', '화나', '화남', '짜증나', '짜증', '빡쳐', '열받아', '킹받아', '개빡침', '성질나'], get: () => [sugMini('화났어')] },
  { id: 'sparkle',  aliases: ['반짝', '반짝반짝', '빛나', '영롱해', '눈부셔', '예뻐', '이뻐', '샤방샤방', '✨'], get: () => [sugMini('반짝')] },
  { id: 'heart',    aliases: ['하트', '하투', '내마음', '마음', '심장'], get: () => [sugMini('하트'), sugCouple('하트')] },
  { id: 'clap',     aliases: ['짝짝짝', '짝짝', '박수', '박수쳐', '굿잡', '브라보', '👏'], get: () => [sugMini('짝짝짝')] },
  { id: 'welldone', aliases: ['잘했어', '잘했다', '대견해', '기특해', '수고했어', '장하다', 'ㅈㅎㅇ'], get: () => [sugUri('수고했어'), sugMini('잘했어'), sugMini('짝짝짝')] },
  { id: 'flower',   aliases: ['꽃다발', '꽃', '꽃선물', '플라워', '꽃줄게', '꽃 줄게', '장미', '프로포즈', '🌹', '💐'], get: () => [sugKkulAnim('꽃 줄게'), sugMini('꽃다발'), sugCouple('장미')] },
  { id: 'praiseme', aliases: ['칭찬해줘', '칭찬', '잘했지', '나잘했지', '인정해줘', '쓰담해줘'], get: () => [sugMini('칭찬해줘'), sugMini('잘했어')] },
  { id: 'best',     aliases: ['최고야', '최고', '짱', '짱이야', '멋져', '완벽해', '쩐다', '리스펙', '👍'], get: () => [sugMini('최고야'), sugAnim('좋아!')] },
  { id: 'brush',    aliases: ['치카치카', '치카', '양치', '이닦아', '이닦는중', '칫솔', '양치하고올게'], get: () => [sugDang('치카치카'), sugKkom('치카치카')] },
  { id: 'run',      aliases: ['달려가는중', '달려가', '뛰어가', '급하게가', '헐레벌떡', '후다닥', '곧도착'], get: () => [sugKkom('달려가는 중'), sugKkul('가는중')] },
  { id: 'makeup',   aliases: ['꾸미는중', '화장중', '화장', '메이크업', '단장중', '준비중', '옷입는중'], get: () => [sugKkom('꾸미는 중')] },
  { id: 'yap',      aliases: ['얍', '얏', '받아라', '공격', '펀치', '얍얍'], get: () => [sugKkom('얍')] },
  { id: 'party',    aliases: ['인싸', '파티', '놀러가', '모임', '약속', '친구만나', '핫플'], get: () => [sugKkom('인싸강아지')] },
  { id: 'pat',      aliases: ['토닥토닥', '토닥', '다독다독', '위로', '울지마', '쓰담쓰담', '옆에있을게', 'ㅌㄷㅌㄷ'], get: () => [sugCouple('토닥토닥'), sugMini('안아줘')] },
  { id: 'toss',     aliases: ['헹가래', '합격', '해냈다', '성공', '만세'], get: () => [sugCouple('헹가래'), sugAnim('축하해!')] },
  { id: 'fly',      aliases: ['날아가자', '날아가', '훨훨', '떠나자', '여행가자', '여행', '어디론가'], get: () => [sugCouple('날아가자')] },
  // ── 우리 탭(꿀됑+꼼이 커플 16종, 2026-10-27) — 다른 묶음에 없던 말 ──
  { id: 'mukbang',  pop: 2, aliases: ['냠냠', '냠냠냠', '먹방', '맛있다', '맛있어', '맛있겠다', '같이먹자', '먹자', '얌얌', '쩝쩝'], get: () => [sugUri('냠냠냠'), sugKkul('배고파')] },
  { id: 'photo',    pop: 2, aliases: ['찰칵', '사진', '사진찍자', '셀카', '셀카찍자', '인생샷', '찍어줘', '네컷', '📸'], get: () => [sugUri('찰칵')] },
  { id: 'takecare', pop: 3, aliases: ['조심히와', '조심히 와', '조심히가', '조심해', '조심히들어가', '잘다녀와', '다녀와', '다녀올게', '출근잘해', '안전운전'], get: () => [sugUri('조심히 와')] },
  { id: 'goodjob',  pop: 3, aliases: ['수고했어', '수고했다', '수고많았어', '고생했어', '고생많았어', '오늘도고생', '수고', '애썼어'], get: () => [sugUri('수고했어'), sugMini('잘했어')] },
  { id: 'reconcile', aliases: ['화해', '화해하자', '화해해', '풀자', '풀었어', '사과할게', '사과'], get: () => [sugUri('화해'), sugKkul('미안해')] },
  { id: 'dust',     pop: 2, aliases: ['미세먼지', '먼지', '초미세먼지', '공기', '공기안좋아', '마스크', '황사', '먼지저리가'], get: () => [sugUri('먼지 저리가')] },
  { id: 'date',     pop: 2, aliases: ['데이트', '데이트하자', '데이트가자', '놀러가자', '만나자', '카페', '카페가자', '주말에만나'], get: () => [sugUri('데이트')] },
];
// 자음 한 글자 단축키 — 둘이 자주 쓰는 순(우댕이 보낸 메시지 2,049개 집계)으로 앞의 몇 개만.
const KEY_SHORTCUTS: Record<string, string[]> = {
  'ㄱ': ['going', 'thanks', 'cute', 'morning'], 'ㄲ': ['call', 'hug'], 'ㄴ': ['no'],
  'ㄷ': ['arrive', 'doki'], 'ㅁ': ['sorry', 'lunch', 'what'], 'ㅂ': ['hungry', 'miss', 'full', 'busy'],
  'ㅃ': ['kiss', 'peek'], 'ㅅ': ['love', 'bored', 'excited'], 'ㅆ': ['bath'], 'ㅇ': ['yes', 'scream', 'hello', 'sick'],
  'ㅈ': ['night', 'sleepy', 'really', 'yay'], 'ㅊ': ['congrats', 'commute', 'best', 'brush'], 'ㅋ': ['lol'],
  'ㅌ': ['pat'], 'ㅍ': [], 'ㅎ': ['omg', 'cheer', 'happy', 'whitening'],
};
const INTENT_BY_ID = new Map(INTENTS.map((it) => [it.id, it]));
const PREPARED = INTENTS.map((it) => ({ it, aliases: it.aliases.map(prepareAlias) }));

// 내 캐릭터 먼저 — 우댕은 꿀됑·우댕 포차코, 꼼이는 꼼이 움짤·꼼이 포차코·미니에 작은 가산점.
const OWN_MODES: Record<string, StickerMode[]> = { '우댕': ['kkul', 'kkulgif', 'dang'], '꼼이': ['gif', 'kkom', 'mini'] };

// 입력칸 글의 「뜻 있는 낱말」 — 꾸밈(~ ! ? . … ♥ ♡ 이모지, ㅋㅋ·ㅎㅎ·ㅠㅠ·ㅜㅜ 두 글자 이상)은 낱말 끝에서 떼고, 꾸밈만인 낱말은 뺀다.
//   「사랑해~~」 → [사랑해] · 「배고파 ㅠㅠ」 → [배고파] · 「ㅋㅋㅋ」 → [] · 「내사랑 꼼슌이 보고싶어」 → 3개.
//   ㅋ·ㅎ 한 글자는 꾸밈으로 안 본다(잘못 지우면 뜻이 사라진다 — GPT 상의 2026-10-28).
const DECOR_TAIL = /(?:[~!?.,…♥♡\u2764\uFE0F]|\p{Extended_Pictographic}|ㅋ{2,}|ㅎ{2,}|[ㅠㅜ]{2,})+$/u;
function meaningWords(t: string): string[] {
  return t.trim().split(/\s+/).map((w) => w.replace(DECOR_TAIL, '')).filter(Boolean);
}
function computeSuggestions(
  draft: string, me: string, freq: Record<string, { count: number }>, prevOrder: string[], fav?: Set<string>,
): Suggestion[] {
  if (!draft || draft.length > 80) return [];
  const endsWithSpace = /\s$/.test(draft);
  const parts = draft.split(/\s+/).filter(Boolean);
  const token = endsWithSpace ? '' : normForMatch(parts[parts.length - 1] ?? '');
  const tokenJamo = toJamo(token);
  const clause = draft.split(/[.!?\n]/).pop() ?? '';
  const scored = new Map<string, { s: Suggestion; score: number; order: number }>();
  let order = 0;
  const add = (items: (Suggestion | undefined)[], base: number) => {
    items.forEach((s, i) => {
      if (!s) return;
      const f = freq[emoId(s)]?.count ?? 0;
      const own = OWN_MODES[me]?.includes(s.mode) ? 3 : 0;
      const star = fav?.has(emoId(s)) ? 4 : 0;   // ★ 즐겨찾기 살짝 앞
      const score = base - i * 0.5 + Math.min(8, 2 * Math.log(1 + f)) + own + star;
      const prev = scored.get(s.image);
      if (!prev || prev.score < score) scored.set(s.image, { s, score, order: prev?.order ?? order++ });
    });
  };
  const single = [...token].length === 1 && isConsonantsOnly(token);
  if (single) {
    (KEY_SHORTCUTS[token] ?? []).forEach((id, k) => { const it = INTENT_BY_ID.get(id); if (it) add(it.get(), 50 - k * 4); });
  } else if (token) {
    // 어떤 뜻 묶음과 딱 맞으면(100) 앞부분만 걸친 다른 묶음은 뺀다 — 「잘자」가 '잘잤어'(아침)에,
    //   「헐」이 '헐레벌떡'(달려가는 중)에 걸려 좋은아침·가는중이 같이 뜨던 것(Aside 2026-10-16).
    const tiers = PREPARED.map(({ it, aliases }) => {
      let best = 0;
      for (const a of aliases) { const t = matchTier(token, tokenJamo, a); if (t > best) best = t; if (best === 100) break; }
      return { it, best };
    });
    const exact = tiers.some((x) => x.best === 100);
    for (const { it, best } of tiers) if (best && (!exact || best === 100)) add(it.get(), best + (it.pop ?? 0));
  }
  // 문맥 보조 — 문장 전체 정규식은 낮은 점수만(지금 치는 단어가 우선). 지금 절 30, 앞 절 12.
  const normClause = normalizeInput(clause.trim());
  const normAll = normalizeInput(draft.trim());
  for (const rule of SUGGEST_RULES) {
    if (normClause && rule.re.test(normClause)) add(rule.get(), 30);
    else if (normAll && rule.re.test(normAll)) add(rule.get(), 12);
  }
  const prevIdx = new Map(prevOrder.map((k, i) => [k, i]));
  const list = [...scored.values()].sort((a, b) =>
    (b.score - a.score) || ((prevIdx.get(a.s.image) ?? 999) - (prevIdx.get(b.s.image) ?? 999)) || (a.order - b.order));
  return list.slice(0, single ? 6 : 12).map((x) => x.s);
}

const DANG_STICKERS: { word: string; image: string }[] = [
  { word: '귀엽꼬미', image: '/pochacco_dang/cutekkomi.png' },
  { word: '앙 귀여워', image: '/pochacco_dang/angcute.png' },
  { word: '치카치카', image: '/pochacco_dang/dangchicca.png' },
  { word: '푸데데', image: '/pochacco_dang/dangpudede.png' },
];
// kkom's 탭 — 꼼이(여자 포차코) 스티커
const KKOM_STICKERS: { word: string; image: string }[] = [
  { word: '달려가는 중', image: '/pochacco_kkom/kkomrun.png' },
  { word: '꾸미는 중', image: '/pochacco_kkom/kkommakeup.png' },
  { word: '치카치카', image: '/pochacco_kkom/kkomchicca.png' },
  { word: '얍', image: '/pochacco_kkom/kkomiyap.png' },
  { word: '푸데데', image: '/pochacco_kkom/kkomipudede.png' },
  { word: '인싸강아지', image: '/pochacco_kkom/pochaccofly.png' },
];

// 꿀됑 탭(우댕 지정 이름) — 우댕 캐릭터 '꿀댕이'(꿀벌 조끼 아기돼지) 16종. 우댕이 꼼이에게 보낸 말 2,049개를 세어 고름(2026-10-15).
//   글자는 그림 안에(주아체 배지, 사이담 규칙). 원본·초록판·만든 스크립트 메모는 art/kkuldaeng/set16.
const KKUL_STICKERS: { word: string; image: string }[] = [
  { word: '꼼슌아',   image: '/emo/kkuldaeng/01-ggomsyun.webp' },
  { word: '사랑해',   image: '/emo/kkuldaeng/02-saranghae.webp' },
  { word: '보고싶어', image: '/emo/kkuldaeng/03-bogosipeo.webp' },
  { word: '앙귀여워', image: '/emo/kkuldaeng/04-anggwiyeowo.webp' },
  { word: 'ㅋㅋㅋ',   image: '/emo/kkuldaeng/05-kkk.webp' },
  { word: '배고파',   image: '/emo/kkuldaeng/06-baegopa.webp' },
  { word: '가는중',   image: '/emo/kkuldaeng/07-ganeunjung.webp' },
  { word: '도착!',    image: '/emo/kkuldaeng/08-dochak.webp' },
  { word: '으악',     image: '/emo/kkuldaeng/09-euak.webp' },
  { word: '꼬옥',     image: '/emo/kkuldaeng/10-kkoook.webp' },
  { word: '고마워',   image: '/emo/kkuldaeng/11-gomawo.webp' },
  { word: '진짜아?',  image: '/emo/kkuldaeng/12-jinjja.webp' },
  { word: '화이트닝', image: '/emo/kkuldaeng/13-whitening.webp' },
  { word: '응응',     image: '/emo/kkuldaeng/14-eungeung.webp' },
  { word: '괜찮아?',  image: '/emo/kkuldaeng/15-gwaenchanha.webp' },
  { word: '좋은아침', image: '/emo/kkuldaeng/16-joeunachim.webp' },
  { word: '야호!',    image: '/emo/kkuldaeng/17-yaho.webp' },   // 우댕 문장 끝 (야호) 340번 — 글 속은 TEXT_STICKER_BY_SENDER(우댕 OK 2026-10-19)
  { word: '푸데데',   image: '/emo/kkuldaeng/18-pudede.webp' }, // 둘만의 말 「푸데데」=꿀잠 — 꼼이 닮은 말티푸 인형 안고 (우댕 B안 OK 2026-10-20)
  { word: '뽀뽀',     image: '/emo/kkuldaeng/19-ppoppo.webp' },
  { word: '미안해',   image: '/emo/kkuldaeng/20-mianhae.webp' }, // 꿀단지 내밀며 울먹 — Aside 검수 "꿀됑에 미안해 없음" (우댕 A안 OK 2026-10-21) // 꼼이가 꿀됑 볼에 기습 뽀뽀, 꿀됑 더듬이가 하트로 (우댕 "1,2 둘다" 2026-10-20)
  { word: '약속!',    image: '/emo/kkuldaeng/21-yaksok.webp' },  // 하트 카드에 코 도장(콧구멍 두 개), 코끝에 잉크 — 글 속 (약속)과 같은 그림(art/yaksok)
];
// 꿀됑 움짤 탭(우댕 지시: 따로) — sai-anim 경로에 둬서 서랍은 정지컷(-still.png), 채팅은 흔들기 없이 재생(기존 움짤 규칙 그대로).
//   만든 법·원본은 art/kkuldaeng/{euak,…} (Codex 키프레임 → Kling → 편집 → make_anim.py).
const KKUL_ANIM: { word: string; image: string }[] = [
  { word: '으악 펄쩍', image: '/emo/sai-anim/kkul-euak.webp' },
  { word: 'ㅋㅋㅋ 발라당', image: '/emo/sai-anim/kkul-kkk.webp' },   // art/kkuldaeng/kkk
  { word: '꽃 줄게', image: '/emo/sai-anim/kkul-flower.webp' },   // art/kkuldaeng/flower
  { word: '안아줘 꼬리하트', image: '/emo/sai-anim/kkul-hug.webp' },   // art/kkuldaeng/hug
  { word: '일어나 붕붕', image: '/emo/sai-anim/kkul-wake.webp' },   // art/kkuldaeng/wake — 꼼이랑 둘이 나오는 첫 움짤(우댕 OK 2026-10-18)
  // 떡 말놀이(우댕 OK 2026-10-19) — 꼼이 「찰떡!」→ 우댕 「쑥떡!」→ 꼼이 「콩떡!」→ 우댕 「개떡!」. 짝 답장이 다음 떡을 먼저 띄운다(TTEOK_NEXT).
  //   art/kkuldaeng/tteok — 낱장은 앞뒤 반복, 합친 판은 장면마다 배지가 바뀐다(make_combo.py).
  { word: '찰떡!', image: '/emo/sai-anim/kkul-tteok-chal.webp' },
  { word: '쑥떡!', image: '/emo/sai-anim/kkul-tteok-ssuk.webp' },
  { word: '콩떡!', image: '/emo/sai-anim/kkul-tteok-kong.webp' },
  { word: '개떡!', image: '/emo/sai-anim/kkul-tteok-gae.webp' },
  { word: '찰떡 쑥떡 콩떡 개떡', image: '/emo/sai-anim/kkul-tteok-all.webp' },
  // 떡 말놀이 마무리 — 개떡 다음에 둘이 같이 「멍!」 → 멍때림 「멍...」 (art/kkuldaeng/meong, Kling 18 A·B 중 가운데 뺀 판, 우댕 「②로 하자」 2026-10-27)
  { word: '멍!', image: '/emo/sai-anim/kkul-meong.webp' },
  { word: '기습 뽀뽀', image: '/emo/sai-anim/kkul-kiss.webp' },   // art/kkuldaeng/kiss — 꼼이가 볼에 쪽 → 꿀됑 더듬이 하트·빨개져 붕 뜸 (Kling 17, 우댕 "그냥 클링으로" 2026-10-20)
];
// 우리 탭 — 꿀됑+꼼이가 같이 나오는 커플 16종(정지, 글씨 배지). GPT 회의(후보 20 → 16, 순서 = 자주 쓸 것 앞) + 우댕 OK(2026-10-27).
//   원본·회의 원문·지시문·만든 스크립트는 art/couple16 (make_couple.py: 투명 그림 → 배지 webp 320).
const URI_STICKERS: { word: string; image: string }[] = [
  { word: '꼼모닝',     image: '/emo/uri/01-morning.webp' },   // 한 이불에서 빼꼼, 더듬이가 아침 해
  { word: '잘자',       image: '/emo/uri/02-night.webp' },     // 등 맞대고 동그랗게, 날개 이불
  { word: '사랑해',     image: '/emo/uri/03-love.webp' },      // 하트 풍선 줄이 꿀됑 꼬리에
  { word: '냠냠냠',     image: '/emo/uri/04-mukbang.webp' },   // 한 그릇 먹방, 코에 면 한 가닥
  { word: '찰칵',       image: '/emo/uri/05-selfie.webp' },    // 셀카, 더듬이 끝이 하트
  { word: '조심히 와',  image: '/emo/uri/06-takecare.webp' },  // 목도리 배웅, 끝이 더듬이 방울 귀마개
  { word: '왔어!',      image: '/emo/uri/07-arrived.webp' },   // 급브레이크 데굴
  { word: '괜찮아',     image: '/emo/uri/08-itsok.webp' },     // 볼 기대기, 더듬이도 같이 축
  { word: '수고했어',   image: '/emo/uri/09-goodjob.webp' },   // 뻗은 꿀됑에게 꽃목걸이
  { word: '삐짐',       image: '/emo/uri/10-sulk.webp' },      // 등 돌렸는데 꼬리는 몰래 닿음
  { word: '화해',       image: '/emo/uri/11-makeup.webp' },    // 사과(=사과) 물고 꽃이랑 콩
  { word: '축하해',     image: '/emo/uri/12-congrats.webp' },  // 촛불은 멀쩡, 귀·더듬이만 휙
  { word: '푸데데',     image: '/emo/uri/13-nap.webp' },       // 꿀됑 배 베고 낮잠, 콧방울
  { word: '화이트닝',   image: '/emo/uri/14-whitening.webp' }, // 둘만의 구호 — 반짝 이빨 광선 교차
  { word: '먼지 저리가', image: '/emo/uri/15-dust.webp' },     // 날개 바람에 울상 먼지들 도망
  { word: '데이트',     image: '/emo/uri/16-date.webp' },      // 셰이크 하나에 빨대 둘
];

// 사이 탭 — 사이담 말티푸 '사이' 팩(하루에 제일 많이 하는 말). 글자가 그림 안에 들어있음.
// 순서는 사이담 EMOTICONS(setId=SAI) 정의 순서 그대로(우댕 지시 "순서도 그대로").
const SAI_STICKERS: { word: string; image: string }[] = [
  { word: '맛점', image: '/emo/sai/lunch.webp' },
  { word: 'ㅋㅋㅋ', image: '/emo/sai/kkk.webp' },
  { word: '뭐해?', image: '/emo/sai/what.webp' },
  { word: '굿모닝', image: '/emo/sai/goodmorning.webp' },
  { word: '출근중', image: '/emo/sai/towork.webp' },
  { word: '배고파', image: '/emo/sai/hungry.webp' },
  { word: '졸려', image: '/emo/sai/sleepy.webp' },
  { word: '도착!', image: '/emo/sai/arrival.webp' },
  { word: '미안', image: '/emo/sai/apple.webp' },
  { word: '배불러', image: '/emo/sai/full.webp?v=2' },
  { word: '심심해', image: '/emo/sai/simsim.webp' },
  { word: '헐', image: '/emo/sai/hul.webp' },
  { word: 'ㄴㄴ', image: '/emo/sai/nono.webp' },
  { word: '가는중', image: '/emo/sai/ontheway.webp' },
  { word: '굿밤', image: '/emo/sai/goodnight.webp' },
  { word: '바빠', image: '/emo/sai/busy.webp' },
  { word: '헤헤', image: '/emo/sai/hehe.webp' },   // 꼼이 말버릇 헤헤(73번, 전부 꼼이) — A안: 두 앞발로 입 가리고 눈웃음(우댕 OK 2026-10-19)
  { word: '약속!', image: '/emo/sai/yaksok.webp' }, // 하트 카드에 발바닥 도장 — 글 속 (약속)과 같은 그림(art/yaksok)
  { word: '꼼돌아', image: '/emo/sai/kkomdol.webp' }, // 꼼이가 우댕을 부름 — 꿀됑 「꼼슌아」를 좌우로 뒤집은 짝(art/kkom-call A안, 우댕 OK 2026-10-30)
];

// 사이담이 탭 — 사이담 말티푸 표정·몸짓 21종. 사이담 EMOTICONS(setId=BASIC) 정의 순서 그대로.
// 파일은 사이담 /mood + /praise/saidam 공유본을 꼼모닝 /emo/saidami/로 네임스페이스 복사(우리 /pochacco 무버 안 건드림).
const SAIDAMI_STICKERS: { word: string; image: string }[] = [
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
const MINI_BY_WORD: Record<string, string> = Object.fromEntries(SAIDAMI_STICKERS.map((s) => [s.word, s.image]));
// 보낸 사람 캐릭터로 바꿔 그리는 글 속 단어 — 꼼이미니·커플 스티커보다 먼저 본다.
//   (야호): 우댕이 치면 꿀됑 야호(우댕 문장 끝 인사, 340번), 꼼이가 친 (야호)는 원래 포차코 그대로.
//   (약속): 꼼이는 발바닥 도장, 우댕은 꿀됑 코 도장(원본 art/yaksok, GPT 상의 B+D안).
const TEXT_STICKER_BY_SENDER: Record<string, Record<string, string>> = {
  '우댕': { '야호': '/emo/kkuldaeng/mini/yaho.webp', '약속': '/emo/kkuldaeng/mini/yaksok.webp' },
  '꼼이': { '약속': '/emo/kkom/mini/yaksok.webp' },
};
const senderSticker = (w: string, from?: string) => (from ? TEXT_STICKER_BY_SENDER[from]?.[w] : undefined);
// (단어) 매칭 = 꼼이미니 단어 + 커플 텍스트스티커 + 보낸 사람별 단어(중복 제거). 손으로 쳐도 그림이 된다.
const STICKER_ALT = [...new Set([
  ...SAIDAMI_STICKERS.map((s) => s.word), ...Object.keys(TEXT_STICKERS),
  ...Object.values(TEXT_STICKER_BY_SENDER).flatMap((m) => Object.keys(m)),
])].join('|');
// [[e:id]] 포차코 미니 OR (단어) 스티커 둘 다 매칭
const RICH_RE = new RegExp(`\\[\\[e:([a-z]+)\\]\\]|\\((${STICKER_ALT})\\)`, 'g');
const STICKER_RE = new RegExp(`\\((${STICKER_ALT})\\)`, 'g');

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

// ── 서랍 검색 — 모든 탭의 이모티콘을 이름(단어)으로, 그리고 같은 뜻 말(추천 줄과 같은 엔진)으로 찾는다. (카톡 반응 키워드 검색 참고)
//   「ㅂ」 한 글자 → 단축키 + 'ㅂ'으로 시작하는 이름 · 「가는」 → 이름 가운데 일치(달려가는 중)까지. 내 캐릭터·자주 쓴 것·★가 앞.
type EmoHit = EmoPick & { thumb: string; video?: boolean };
let ALL_DRAWER_ITEMS: (EmoHit & { alias: PreparedAlias })[] | null = null;
function allDrawerItems() {
  if (ALL_DRAWER_ITEMS) return ALL_DRAWER_ITEMS;
  const out: (EmoHit & { alias: PreparedAlias })[] = [];
  const put = (mode: StickerMode, key: string, image: string, thumb: string, name = key) =>
    out.push({ mode, key, image, thumb, video: isVideoSrc(image), alias: prepareAlias(name) });
  ANIM_STICKERS.forEach((s) => put('gif', s.word, s.image, s.still));
  SAI_STICKERS.forEach((s) => put('maltipoo', s.word, s.image, s.image));
  MOOD_OPTIONS.forEach((o) => put('basic', o.id, o.image, o.image, o.label));
  DANG_STICKERS.forEach((s) => put('dang', s.word, s.image, s.image));
  KKOM_STICKERS.forEach((s) => put('kkom', s.word, s.image, s.image));
  POCKET_STICKERS.forEach((s) => put('couple', s.word, s.image, s.image));
  SAIDAMI_STICKERS.forEach((s) => put('mini', s.word, s.image, s.image));
  KKUL_STICKERS.forEach((s) => put('kkul', s.word, s.image, s.image));
  KKUL_ANIM.forEach((s) => put('kkulgif', s.word, s.image, drawerThumb(s.image)));
  URI_STICKERS.forEach((s) => put('uri', s.word, s.image, s.image));
  return (ALL_DRAWER_ITEMS = out);
}
// ── 짝 답장 — 받은 이모티콘과 같은 뜻의 '내 캐릭터' 이모티콘으로 답한다(카톡 '이모티콘 따라하기' + 우리 둘 짝 캐릭터).
//   같은 뜻 = 그 그림이 들어 있는 뜻 묶음(INTENTS) + 이름이 같은 그림. 순서: 내 캐릭터 → 같은 그림(나도) → 나머지. 최대 8개.
//   그림 주소 끝 ?v=… 는 배포마다 바뀌어서 떼고 비교한다(옛 메시지도 짝이 찾아지게).
const bareSrc = (src: string) => src.split('?')[0];
// 떡 말놀이 — 받은 떡의 '다음 떡'을 짝 답장 맨 앞에(찰떡→쑥떡→콩떡→개떡→멍!→다시 찰떡).
const TTEOK_NEXT: Record<string, string> = {
  '/emo/sai-anim/kkul-tteok-chal.webp': '쑥떡!', '/emo/sai-anim/kkul-tteok-ssuk.webp': '콩떡!',
  '/emo/sai-anim/kkul-tteok-kong.webp': '개떡!', '/emo/sai-anim/kkul-tteok-gae.webp': '멍!',
  '/emo/sai-anim/kkul-meong.webp': '찰떡!',
};
function pairCandidates(sticker: string, me: string): Suggestion[] {
  const target = bareSrc(sticker);
  const next = TTEOK_NEXT[target] ? sugKkulAnim(TTEOK_NEXT[target]) : undefined;
  if (next) return [next, ...pairCandidatesBase(sticker, me).filter((x) => x.image !== next.image)].slice(0, 8);
  return pairCandidatesBase(sticker, me);
}
function pairCandidatesBase(sticker: string, me: string): Suggestion[] {
  const target = bareSrc(sticker);
  const items = allDrawerItems();
  const self = items.find((x) => bareSrc(x.image) === target);
  const pool = new Map<string, Suggestion>();
  const put = (s?: Suggestion) => { if (s && !pool.has(bareSrc(s.image))) pool.set(bareSrc(s.image), s); };
  for (const it of INTENTS) {
    const got = it.get().filter((x): x is Suggestion => !!x);
    if (got.some((x) => bareSrc(x.image) === target)) got.forEach(put);
  }
  if (self) {
    for (const x of items) if (x.alias.norm === self.alias.norm) put({ key: x.key, image: x.image, thumb: x.thumb, mode: x.mode });
    put({ key: self.key, image: self.image, thumb: self.thumb, mode: self.mode });
  }
  const own = OWN_MODES[me] ?? [];
  const rank = (x: Suggestion) => (own.includes(x.mode) ? own.indexOf(x.mode) : bareSrc(x.image) === target ? 50 : 100);
  return [...pool.values()].sort((a, b) => rank(a) - rank(b)).slice(0, 8);
}
function searchStickers(q: string, me: string, freq: Record<string, { count: number }>, fav: Set<string>): EmoHit[] {
  const token = normForMatch(q);
  if (!token) return [];
  const tokenJamo = toJamo(token);
  const single = [...token].length === 1 && isConsonantsOnly(token);
  const own = OWN_MODES[me] ?? [];
  const best = new Map<string, { it: EmoHit; score: number }>();
  const add = (it: EmoHit, base: number) => {
    const id = emoId(it);
    const score = base + Math.min(8, 2 * Math.log(1 + (freq[id]?.count ?? 0))) + (own.includes(it.mode) ? 3 : 0) + (fav.has(id) ? 4 : 0);
    const prev = best.get(it.image);
    if (!prev || prev.score < score) best.set(it.image, { it, score });
  };
  for (const it of allDrawerItems()) {
    let t = matchTier(token, tokenJamo, it.alias);
    if (!t && single && it.alias.cho.startsWith(token)) t = 45;
    if (!t && !isConsonantsOnly(token) && [...token].length >= 2 && it.alias.norm.includes(token)) t = 50;
    if (t) { const { alias: _a, ...hit } = it; void _a; add(hit, t); }
  }
  computeSuggestions(q, me, freq, [], fav).forEach((s, i) =>
    add({ mode: s.mode, key: s.key, image: s.image, thumb: s.thumb, video: isVideoSrc(s.image) }, 80 - i));
  return [...best.values()].sort((a, b) => b.score - a.score).slice(0, 48).map((x) => x.it);
}

// 답장 미리보기/푸시용 — 미니는 🐶, 텍스트 스티커는 괄호만 벗겨 단어로.
function stripEmo(text: string): string {
  return text.replace(EMO_RE, '🐶').replace(STICKER_RE, '$1');
}
// 평문 구간의 http(s) 링크를 클릭 가능한 <a>로 (끝 문장부호는 링크에서 제외). "바로 연결".
const PLAIN_URL_RE = /(https?:\/\/[^\s<]+)/g;
function linkify(text: string, keyBase: number): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let last = 0; let li = 0; let m: RegExpExecArray | null;
  PLAIN_URL_RE.lastIndex = 0;
  while ((m = PLAIN_URL_RE.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const raw = m[0];
    const clean = raw.replace(/[),.\]]+$/, '');
    out.push(
      <a key={`lk${keyBase}-${li++}`} href={clean} target="_blank" rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="underline decoration-1 underline-offset-2 break-all">{clean}</a>,
    );
    if (raw.length > clean.length) out.push(raw.slice(clean.length));
    last = m.index + raw.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
function renderRich(text: string, from?: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let last = 0; let i = 0; let m: RegExpExecArray | null;
  RICH_RE.lastIndex = 0;
  while ((m = RICH_RE.exec(text)) !== null) {
    if (m.index > last) parts.push(...linkify(text.slice(last, m.index), m.index));
    if (m[1] !== undefined) {
      // [[e:id]] 미니 이모티콘
      const opt = MOOD_OPTIONS.find((o) => o.id === m![1]);
      if (opt) {
        // eslint-disable-next-line @next/next/no-img-element
        parts.push(<img key={i++} src={opt.image} alt={opt.label} className="inline-block w-6 h-6 align-middle object-contain" />);
      } else parts.push(m[0]);
    } else if (m[2] !== undefined) {
      // 꼼이미니(말티푸) 먼저 — 32px 인라인, 폭 자동, 말풍선 없음(사이담 스펙). 단 보낸 사람별 그림이 있으면 그게 우선.
      const bySender = senderSticker(m![2], from);
      const miniSrc = bySender ? undefined : MINI_BY_WORD[m![2]];
      if (miniSrc) {
        // eslint-disable-next-line @next/next/no-img-element
        parts.push(<img key={i++} src={miniSrc} alt={m![2]} className="inline-block h-9 w-auto align-text-bottom object-contain mx-[2px]" />);
        last = m.index + m[0].length;
        continue;
      }
      const src = bySender || TEXT_STICKERS[m![2]];
      if (isVideoSrc(src)) {
        // 진짜 동영상 스티커 (편지처럼 MP4 재생)
        parts.push(
          <video key={i++} src={src} poster={posterOf(src)} autoPlay loop muted playsInline
            className="inline-block h-20 rounded-2xl object-cover align-middle shadow-sm" />
        );
      } else {
        // 정지 스티커 → 통통 튀어나오고 주기적으로 살짝 흔들림
        parts.push(
          <motion.img
            key={i++} src={src} alt={m![2]}
            className="inline-block h-11 w-auto align-middle object-contain"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, rotate: [0, -6, 6, -4, 0] }}
            transition={{
              scale: { type: 'spring', stiffness: 480, damping: 13 },
              opacity: { duration: 0.15 },
              rotate: { duration: 1.6, repeat: Infinity, repeatDelay: 2.2, ease: 'easeInOut' },
            }}
          />
        );
      }
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(...linkify(text.slice(last), text.length));
  return parts;
}

// 미니/스티커 토큰만으로 이루어진 메시지인지 판별 — 그런 메시지는 말풍선 없이 크게 띄운다(카톡식).
function parseStickerTokens(text: string, from?: string): { srcs: string[]; onlyTokens: boolean } {
  const srcs: string[] = []; let rest = '';
  let last = 0; let m: RegExpExecArray | null; RICH_RE.lastIndex = 0;
  while ((m = RICH_RE.exec(text)) !== null) {
    rest += text.slice(last, m.index);
    if (m[1] !== undefined) { const opt = MOOD_OPTIONS.find((o) => o.id === m![1]); if (opt) srcs.push(opt.image); else rest += m[0]; }
    else if (m[2] !== undefined) { const s = senderSticker(m![2], from) ?? MINI_BY_WORD[m![2]] ?? TEXT_STICKERS[m![2]]; if (s) srcs.push(s); else rest += m[0]; }
    last = m.index + m[0].length;
  }
  rest += text.slice(last);
  return { srcs, onlyTokens: srcs.length > 0 && rest.trim() === '' };
}
// 미니만 있는 메시지 — 말풍선 없이. 일반 스티커(≈138)보다 작아 '미니'로 구분되되 인라인(36)보단 큼.
//   높이·폭 둘 다 상한(비율유지). 개수 적을수록 큼(1/2/3+).
function BigMinis({ srcs }: { srcs: string[] }) {
  const [mh, mw] = srcs.length === 1 ? [104, 118] : srcs.length === 2 ? [84, 96] : [68, 78];
  return (
    <div className="flex flex-wrap items-end gap-1">
      {srcs.map((src, i) => isVideoSrc(src)
        ? <video key={i} src={src} poster={posterOf(src)} autoPlay loop muted playsInline style={{ maxHeight: mh, maxWidth: mw }} className="rounded-2xl object-contain drop-shadow-sm" />
        // eslint-disable-next-line @next/next/no-img-element
        : <img key={i} src={src} alt="" style={{ maxHeight: mh, maxWidth: mw }} className="object-contain drop-shadow-sm" />)}
    </div>
  );
}

// 채팅 속 링크 인라인 미리보기 카드 — 유튜브·인스타 등. og-preview 결과를 모듈 캐시에 담아 재스크롤 시 재요청 X.
//   인스타는 세로 사진(게시물 4:5, 릴스 9:16)이라 16:9로 자르면 반 넘게 잘린다 → 4:5 틀.
//   인스타 썸네일은 서버가 미리보기 봇으로 받아와야 해서 1초쯤 걸린다 → 그동안 같은 크기 자리를 먼저 깔아 카드가 안 튄다.
const ogCache = new Map<string, { title?: string; image?: string; site?: string }>();
function LinkPreview({ url, mine }: { url: string; mine: boolean }) {
  const ytId = youTubeId(url);
  const ig = igPost(url);
  const host = (() => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; } })();
  const [meta, setMeta] = useState<{ title?: string; image?: string; site?: string }>(() =>
    ogCache.get(url) ?? (ytId ? { image: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`, site: 'YouTube' } : {}));
  const [loading, setLoading] = useState(() => !ogCache.has(url));
  useEffect(() => {
    if (ogCache.has(url)) { setMeta(ogCache.get(url)!); setLoading(false); return; }
    let alive = true;
    (async () => {
      try {
        const r = await fetch(`/api/og-preview?url=${encodeURIComponent(url)}`);
        if (!r.ok) return;
        const j = (await r.json()) as { title?: string; image?: string; siteName?: string; error?: string };
        if (j.error) return;
        const m = {
          title: j.title,
          image: j.image || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : undefined),
          site: j.siteName || host,
        };
        ogCache.set(url, m);
        if (alive) setMeta(m);
      } catch { /* 미리보기 실패 무시 */ }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [url, ytId, host]);

  const frame = ig ? 'aspect-[4/5]' : 'aspect-video';
  const playable = !!ytId || ig?.kind === 'reel' || ig?.kind === 'tv';
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
      className={`block ${ig ? 'w-[220px]' : 'w-[248px]'} max-w-full overflow-hidden rounded-2xl border shadow-sm active:scale-[0.99] transition ${mine ? 'border-black/5 bg-white' : 'border-black/5 bg-white dark:bg-[#332F2A] dark:border-white/10'}`}>
      {!meta.image && ig && loading && <div className={`${frame} w-full animate-pulse bg-black/[0.06]`} />}
      {meta.image && (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={meta.image} alt="" className={`${frame} w-full object-cover bg-black/5`}
            onError={() => setMeta((p) => ({ ...p, image: undefined }))} />
          {playable && (
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-black/55"><Play size={18} fill="white" className="ml-0.5 text-white" /></span>
            </span>
          )}
        </div>
      )}
      <div className="px-3 py-2">
        <div className="text-[13px] font-bold text-slate-800 dark:text-[#E8E2D8] break-keep"
          style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {meta.title || (ig ? 'Instagram 게시물' : url)}
        </div>
        <div className="mt-0.5 truncate text-[11px] text-slate-400">{meta.site || (ig ? 'Instagram' : host)}</div>
      </div>
    </a>
  );
}

export function preview(m: ChatMessage): string {
  if (m.sticker) return m.text?.trim() ? `이모티콘 ${m.text.trim().slice(0, 40)}` : '이모티콘';
  if (m.videoUrl) return '동영상';
  if (m.imageUrl) return '사진';
  if (m.audioUrl) return '음성 메시지';
  // 링크는 주소 그대로 노출하지 않고 종류 라벨로 — 홈 꼼톡 미리보기/답장 미리보기 공통.
  const url = firstUrl(m.text);
  if (url) {
    const tag = youTubeId(url) ? '▶️ 유튜브 영상' : igPost(url) ? '📷 인스타그램' : '🔗 링크';
    const rest = stripEmo(m.text.replace(/https?:\/\/[^\s<]+/gi, '').trim());
    return rest ? `${rest} ${tag}` : tag;
  }
  return stripEmo(m.text);
}

// ── 챗 테마(기기별) — 제미나이 팔레트. 라이트/다크 팔레트를 분리(다크는 톤·명도 다양 = Elevated Dark).
//   바탕/내풍선/상대풍선(+다크는 surface=서랍·헤더·입력바 표면색)을 CSS 변수로 깔아 전 요소가 따라온다.
export type ChatPalette = { id: string; name: string; bg: string; myBg: string; myText: string; partnerBg: string; partnerText: string; surface?: string };
// 라이트 5종 (제미나이 1차)
export const LIGHT_THEMES: ChatPalette[] = [
  { id: 'saidam',   name: '사이담',        bg: 'linear-gradient(168deg, #FCFAF7 0%, #F9F7F4 58%, #F7F6F7 100%)', myBg: '#382830', myText: '#FFFFFF', partnerBg: 'rgba(255,255,255,0.74)', partnerText: '#2E1D26' },
  { id: 'pink',     name: '오리지널 핑크', bg: '#FBF8F2', myBg: '#FB7BA8', myText: '#FFFFFF', partnerBg: 'rgba(255,255,255,0.85)', partnerText: '#334155' },
  { id: 'dawn',     name: '포근한 새벽',   bg: 'linear-gradient(168deg, #F0F7F9 0%, #E8F2F5 100%)', myBg: '#1E3A8A', myText: '#FFFFFF', partnerBg: 'rgba(255,255,255,0.75)', partnerText: '#1E293B' },
  { id: 'matcha',   name: '햇살 비친 녹차', bg: 'linear-gradient(168deg, #F4FBF7 0%, #EAF5ED 100%)', myBg: '#064E3B', myText: '#FFFFFF', partnerBg: 'rgba(255,255,255,0.80)', partnerText: '#064E3B' },
  { id: 'lavender', name: '라벤더의 밤',   bg: 'linear-gradient(168deg, #F9F5FA 0%, #F3EAF5 100%)', myBg: '#4A3B52', myText: '#FFFFFF', partnerBg: 'rgba(255,255,255,0.70)', partnerText: '#3B2F42' },
];
// 다크 7종 (제미나이 2차 — 명도 20~30 스펙트럼 + 톤 다양 + surface 표면색)
export const DARK_THEMES: ChatPalette[] = [
  { id: 'saidam-deep', name: '사이담 딥',      bg: 'linear-gradient(168deg, #241A20 0%, #1E1A26 100%)', surface: '#2E2229', myBg: '#F2E8EA', myText: '#2A2028', partnerBg: 'rgba(255,255,255,0.08)', partnerText: '#F2E8EA' },
  { id: 'greige',      name: '코지 그레이지',  bg: '#383330', surface: '#423C38', myBg: '#E8DED8', myText: '#2A2420', partnerBg: 'rgba(255,255,255,0.12)', partnerText: '#E8DED8' },
  { id: 'slate',       name: '쿨 슬레이트',    bg: 'linear-gradient(168deg, #2E3643 0%, #252B36 100%)', surface: '#3A4452', myBg: '#D1E0F2', myText: '#1A2333', partnerBg: 'rgba(255,255,255,0.12)', partnerText: '#D1E0F2' },
  { id: 'forest',      name: '포레스트 쉐도우', bg: 'linear-gradient(168deg, #29302B 0%, #202622 100%)', surface: '#353E38', myBg: '#CDE8D8', myText: '#17261D', partnerBg: 'rgba(255,255,255,0.10)', partnerText: '#D1EBE1' },
  { id: 'mauve',       name: '더스티 모브',    bg: 'linear-gradient(168deg, #362D38 0%, #2B232D 100%)', surface: '#443946', myBg: '#E6D6EB', myText: '#2C1E30', partnerBg: 'rgba(255,255,255,0.12)', partnerText: '#E6D6EB' },
  { id: 'mocha',       name: '소프트 모카',    bg: 'linear-gradient(168deg, #403531 0%, #362B28 100%)', surface: '#4D403B', myBg: '#F2D8CB', myText: '#331E15', partnerBg: 'rgba(255,255,255,0.15)', partnerText: '#E8D5CC' },
  { id: 'neutral',     name: '퓨어 뉴트럴',    bg: '#2D2D2D', surface: '#383838', myBg: '#E2E2E2', myText: '#1A1A1A', partnerBg: 'rgba(255,255,255,0.10)', partnerText: '#E2E2E2' },
];
// hex(#RRGGBB) → rgba — 다크 테마에서 내 풍선 글자(어두운색)로 파형·버튼 반투명 액센트 만들 때 씀.
function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

// clipboardData / dataTransfer 어디에 담겨도 첫 이미지 파일 하나를 집어낸다.
//   ⚠️ 브라우저마다 items/files 중 어디에 담기는지 달라 '둘 다' 본다(중복이면 하나만).
function pickImageFile(dt: DataTransfer | null): File | null {
  if (!dt) return null;
  for (const it of Array.from(dt.items || [])) {
    if (it.kind === 'file' && it.type.startsWith('image/')) { const f = it.getAsFile(); if (f) return f; }
  }
  for (const f of Array.from(dt.files || [])) {
    if (f.type.startsWith('image/')) return f;
  }
  return null;
}
// 스티커 버튼의 읽어 주는 이름 — 감정 스티커 키는 영어 id(happy·missing…)라 한국어 이름으로 바꿔 준다(Aside 1부).
const stickerName = (key: string) => MOOD_OPTIONS.find((o) => o.id === key)?.label ?? key;

// 키보드 측정 창 — 실기기(iOS 27)에서 키보드가 입력줄을 몇 px 가리는지 숫자로 본다(임시 진단).
//   Aside 2부: "고치기 전에 먼저 재라. 빌드 53·54를 같은 iOS에서 비교하면 막대 끄기가 원인인지 바로 갈린다."
//   시뮬레이터는 iOS 26.5까지라 우댕 폰(27.0.1)과 다를 수 있어 실기기용. 헤더 이름 5번 연속 탭으로 켜고 끈다.
//   가림 = 입력줄 아래끝 − 보이는 화면 아래끝(visualViewport.offsetTop + height). 둘 다 레이아웃 뷰포트 기준.
function KbReadout({ pillRef }: { pillRef: React.RefObject<HTMLDivElement | null> }) {
  const [txt, setTxt] = useState('');
  useEffect(() => {
    const read = () => {
      const vv = window.visualViewport;
      const pill = pillRef.current?.getBoundingClientRect();
      const visBottom = vv ? vv.offsetTop + vv.height : window.innerHeight;
      const cover = pill ? Math.max(0, Math.round(pill.bottom - visBottom)) : -1;
      const focused = document.activeElement?.tagName === 'TEXTAREA';
      setTxt([
        `입력칸 ${focused ? '포커스' : '-'} · 가림 ${cover}px`,
        `innerH ${window.innerHeight} · clientH ${document.documentElement.clientHeight}`,
        `vv.h ${vv ? Math.round(vv.height) : '-'} · vv.top ${vv ? Math.round(vv.offsetTop) : '-'} · scrollY ${Math.round(window.scrollY)}`,
        `입력줄 ${pill ? Math.round(pill.top) : '-'}~${pill ? Math.round(pill.bottom) : '-'} · 보이는 아래끝 ${Math.round(visBottom)}`,
      ].join('\n'));
    };
    read();
    const vv = window.visualViewport;
    vv?.addEventListener('resize', read);
    vv?.addEventListener('scroll', read);
    window.addEventListener('scroll', read);
    document.addEventListener('focusin', read);
    document.addEventListener('focusout', read);
    const t = setInterval(read, 250);
    return () => {
      vv?.removeEventListener('resize', read);
      vv?.removeEventListener('scroll', read);
      window.removeEventListener('scroll', read);
      document.removeEventListener('focusin', read);
      document.removeEventListener('focusout', read);
      clearInterval(t);
    };
  }, [pillRef]);
  return (
    <pre className="pointer-events-none absolute inset-x-2 z-[95] whitespace-pre-wrap rounded-lg bg-black/75 px-2.5 py-1.5 font-mono text-[11px] leading-snug text-white"
      style={{ top: 'calc(max(env(safe-area-inset-top), 0.5rem) + 3.25rem)' }}>
      {txt}
    </pre>
  );
}

// 메시지 메뉴의 동작 버튼 하나 — 아이콘 아래 글자. 6개가 폰 폭(390)에 한 줄로 들어가게 칸 44px.
function MenuAction({ onClick, label, icon, tone }: { onClick: () => void; label: string; icon: React.ReactNode; tone?: 'danger' | 'faint' }) {
  const color = tone === 'danger' ? 'text-rose-400' : tone === 'faint' ? 'text-slate-300' : 'text-slate-500';
  return (
    <button onClick={onClick} className={`flex w-11 flex-col items-center gap-0.5 rounded-xl py-1 active:scale-90 transition-transform ${color}`}>
      {icon}
      <span className="text-[10.5px] font-semibold leading-none text-slate-500">{label}</span>
    </button>
  );
}

// 드래그 중 데이터에 '파일'이 실려 있나(내용은 drop 전까지 못 읽으니 종류만 본다).
const dtHasFile = (dt: DataTransfer | null) => !!dt && Array.from(dt.types || []).includes('Files');

export default function ChatPanel({ me, partner, messages, open, onClose, onSend, partnerOnline, partnerOnWatch, onLoadMore, hasMore, onSendCapsule }: Props) {
  const [draft, setDraft] = useState('');
  const [stickerOpen, setStickerOpen] = useState(false);
  // 챗 테마(기기별) — 라이트/다크 팔레트를 따로 고른다(모드별 선택 기억). [[feedback-design-workflow]] 팔레트는 제미나이.
  const [lightThemeId, setLightThemeId] = useState('saidam');
  const [darkThemeId, setDarkThemeId] = useState('saidam-deep');
  const [chatMode, setChatMode] = useState<'light' | 'dark'>('light');
  const [themeOpen, setThemeOpen] = useState(false);
  useEffect(() => {
    if (!me) return;
    try {
      const md = localStorage.getItem(`kkom-chat-mode-${me}`); if (md === 'light' || md === 'dark') setChatMode(md);
      const lt = localStorage.getItem(`kkom-chat-light-${me}`) || localStorage.getItem(`kkom-chat-theme-${me}`);  // 구키 폴백
      if (lt && LIGHT_THEMES.some((x) => x.id === lt)) setLightThemeId(lt);
      const dt = localStorage.getItem(`kkom-chat-dark-${me}`); if (dt && DARK_THEMES.some((x) => x.id === dt)) setDarkThemeId(dt);
    } catch {}
  }, [me]);
  const applyChatMode = (md: 'light' | 'dark') => { setChatMode(md); try { localStorage.setItem(`kkom-chat-mode-${me}`, md); } catch {} };
  const dk = chatMode === 'dark';
  const themeSet = dk ? DARK_THEMES : LIGHT_THEMES;
  const activeThemeId = dk ? darkThemeId : lightThemeId;
  const applyChatTheme = (id: string) => {
    if (dk) { setDarkThemeId(id); try { localStorage.setItem(`kkom-chat-dark-${me}`, id); } catch {} }
    else { setLightThemeId(id); try { localStorage.setItem(`kkom-chat-light-${me}`, id); } catch {} }
  };
  const tc = themeSet.find((t) => t.id === activeThemeId) ?? themeSet[0];
  const surf = tc.surface ?? '#2E2229';   // 다크 표면색(서랍·헤더·입력바가 이걸 따라 밝기 맞춤)
  // 바탕/말풍선 + 보조 변수. 다크는 테마별 surface로 서랍·헤더가 함께 밝아짐(밝은 다크 지원).
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
  // 카톡식 추천 — 입력할 때마다 갱신(freqPicks 선언 뒤에 둬야 한다: 위에 두면 TDZ로 렌더가 죽는다).
  //   지금 치는 단어(자모 앞부분·초성·한 글자 단축키) + 문맥 + 내가 자주 쓴 것. 같은 점수면 직전 순서를 유지해 깜빡임을 줄인다.
  //   ⚠️ 2026-10-28 우댕 「추천이 불편해」(카톡 화면 비교): 글을 칠 때마다 입력바 위에 큰 추천 줄(112px)이 떠서 대화를 가렸고,
  //   고르면 친 단어(「사랑해」)가 글로 같이 나갔다. → 카톡처럼 바꿈:
  //   ① 마지막 단어에 맞는 이모티콘이 있으면 입력칸 오른쪽 이모티콘 단추가 그 그림(작게)으로 바뀐다
  //   ② 누르면 서랍이 그 단어로 찾은 결과로 열린다 ③ 고르면 친 단어는 입력칸에서 빠지고 미리보기가 대화 위에 반투명하게
  //   ④ 보내기(또는 그림 한 번 더)로 전송. 미리보기 ✕면 뺀 단어를 되돌린다.
  //   ⚠️ 지우는 건 입력칸이 그 낱말 하나(+꾸밈)뿐일 때만 — 문장이면 글은 그대로 + 이모티콘(replacesDraft, 우댕 2026-10-28).
  const lastWord = ((w) => (/[()]/.test(w) ? '' : w))(meaningWords(draft).pop() ?? draft.trim().split(/\s+/).pop() ?? '');
  const prevSugOrder = useRef<string[]>([]);
  const wordSugs = useMemo(() => {
    const out = lastWord ? computeSuggestions(lastWord, me, freqPicks, prevSugOrder.current, favIds) : [];
    prevSugOrder.current = out.map((x) => x.image);
    return out;
  }, [lastWord, me, freqPicks, favIds]);
  // 단어로 서랍을 연 동안(카톡 「검색」) — 고른 이모티콘이 그 단어를 대신하므로 입력칸에서 뺀다.
  //   검색칸이 그 단어 그대로일 때만(다른 탭·다른 검색어에서 고르면 글은 그대로 — GPT 상의 2026-10-28).
  const [kwWord, setKwWord] = useState<string | null>(null);
  const [kwUndo, setKwUndo] = useState<{ before: string; after: string; word: string } | null>(null);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [partnerLastRead, setPartnerLastRead] = useState<Date | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadKind, setUploadKind] = useState<'image' | 'video' | 'audio' | null>(null);
  const [uploadPct, setUploadPct] = useState(0); // 0~1 (동영상 업로드 진행률)
  const [actionMsg, setActionMsg] = useState<ChatMessage | null>(null);
  const [replyTo, setReplyTo] = useState<ReplyRef | null>(null);
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);  // 내 메시지 수정 중
  // 짝 답장 트레이(제미나이 C안) — 말풍선 메뉴 「짝 답장」을 눌렀을 때만 입력바 위에 짝 후보 줄을 띄운다.
  //   editing 선언 뒤여야 한다(TDZ). 글자를 치면 접는다. (치는 동안 뜨던 추천 줄은 2026-10-28 입력칸 단추로 옮김)
  const [pairFrom, setPairFrom] = useState<{ id: string; items: Suggestion[] } | null>(null);
  useEffect(() => { setPairFrom(null); }, [draft]);
  const trayItems = useMemo<SuggestItem[]>(
    () => (stickerOpen || editing || !pairFrom ? []
      : pairFrom.items.map((it) => ({ id: it.image, thumb: drawerThumb(it.thumb), label: `${it.key} 짝 답장` }))),
    [stickerOpen, editing, pairFrom],
  );
  const [flashId, setFlashId] = useState<string | null>(null);  // 인용 탭 → 원본 잠깐 강조

  // 인용 말풍선 탭 → 원본 메시지로 스크롤 + 잠깐 강조. (원본이 로드 범위 밖이면 조용히 무시.)
  const jumpToMessage = (id: string) => {
    const el = document.getElementById(`cmsg-${id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setFlashId(id);
    window.setTimeout(() => setFlashId((cur) => (cur === id ? null : cur)), 1400);
  };
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [savingUrl, setSavingUrl] = useState<string | null>(null); // 원본 저장 중인 미디어 URL
  const [recording, setRecording] = useState(false);
  const [recSec, setRecSec] = useState(0);
  const [effect, setEffect] = useState<ChatEffect | null>(null);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [memoryTab, setMemoryTab] = useState<'star' | 'photo' | 'link'>('star');
  // "이거봐봐" — 저장한 링크들. 링크 보내면 저장할지 묻는 프롬프트.
  const [links, setLinks] = useState<ShareItemView[] | null>(null);
  const [linkPrompt, setLinkPrompt] = useState<string | null>(null);
  // 네이버 가게 링크 → 위시리스트('같이 갈 곳') 담기 프롬프트. 자동저장 X, 묻는다.
  const [placePrompt, setPlacePrompt] = useState<{ url: string; name: string } | null>(null);
  const [placeCat, setPlaceCat] = useState<'food' | 'place'>('food');
  const [placeSaving, setPlaceSaving] = useState(false);
  // 입력창 ＋ 첨부 패널(사진·음성·타임캡슐 접기 — 카톡식). 이모티콘 서랍과 서로 닫힌다.
  const [attachOpen, setAttachOpen] = useState(false);
  // 사진 붙여넣기(⌘V)·드래그드롭 — PC에서 캡처·이미지파일 바로 반입. 보내기 전에 미리보기로 한 번 묻는다.
  const [pastePreview, setPastePreview] = useState<{ file: File; url: string } | null>(null);
  const [dragActive, setDragActive] = useState(false);   // 이미지 드래그가 창 위에 떠 있는 중
  const [linkSaving, setLinkSaving] = useState(false);
  const [memories, setMemories] = useState<ChatMessage[] | null>(null);
  const [capsuleOpen, setCapsuleOpen] = useState(false);
  const [capsuleDate, setCapsuleDate] = useState('');
  const [toast, setToast] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  // 자동 높이는 JS로 안 잰다 — 입력칸 아래 같은 글씨의 '그림자 글'(grid 겹치기)이 높이를 정한다(textarea 근처 주석).
  //   ⚠️ 예전엔 글자마다 height='auto'→scrollHeight 를 두 번(onInput 120·layoutEffect 132) 했다. 'auto' 순간 칸이 한 줄로
  //   접히며 속스크롤이 생겼다 풀리는데, 아이폰은 캐럿을 그 스크롤 위치에 남겨 '글 한 줄 위에 커서'가 떴다(우댕 사진, 추천 기능 무렵부터).
  const fileRef = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPrepending = useRef(false);
  const pendingAnchor = useRef<number | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const recStart = useRef<number>(0);
  const sendAfterStop = useRef(false);
  const seenLastId = useRef<string | null>(null);
  const effectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const meKey = keyOf(me);
  const partnerKey = keyOf(partner);

  useEffect(() => {
    const a = subscribeTyping(partnerKey, setPartnerTyping);
    const b = subscribeRead(partnerKey, setPartnerLastRead);
    return () => { a(); b(); };
  }, [partnerKey]);

  useEffect(() => { if (open) markRead(meKey); }, [open, messages, meKey]);
  useEffect(() => { if (!open) setTyping(meKey, false); }, [open, meKey]);

  // 무한스크롤 앵커 복원(위로 불러올 때 화면 튐 방지) — layout effect가 먼저 실행됨
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && pendingAnchor.current != null) {
      el.scrollTop = el.scrollHeight - pendingAnchor.current;
      pendingAnchor.current = null;
    }
  }, [messages]);

  // 새 메시지 시 맨 아래로 (단, 위로 불러오는 중이면 스킵)
  useEffect(() => {
    if (!open) return;
    if (isPrepending.current) { isPrepending.current = false; return; }
    const el = scrollRef.current;
    if (el) requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
  }, [messages, open, partnerTyping]);

  // 바닥 지키기 — 바닥에 붙어 있었으면, ☺서랍·＋칸·키보드로 목록 높이가 줄거나 사진·링크 썸네일이 늦게 떠
  //   내용이 길어져도 다시 바닥으로. 새 메시지 때만 내리던 탓에 서랍을 열면 마지막 말풍선이 가려졌다(Aside 1부·2부).
  //   ⚠️ 한 번만 내리면 늦게 커지는 내용에 반드시 재발한다 → 크기 변화마다 재고정(관제탑 교훈).
  const stickBottom = useRef(true);
  // 넓은 화면(768px↑ = Tailwind md) — 끌어서 닫기를 끄는 데 쓴다.
  const [isWide, setIsWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const on = () => setIsWide(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  const ignoreScroll = useRef(false);
  const offX = typeof window !== 'undefined' ? window.innerWidth : 1000;   // 채팅이 드나드는 거리(화면 폭 px)   // 바로 다음 scroll 이벤트가 내 바닥 붙이기에서 온 것

  // ── 키보드 대응: 입력줄 아래 여백만 키보드 높이만큼(Aside 2부 처방) ──
  //   실기기 측정(iOS 27.0.1, 빌드 54, 측정 창): 키보드가 떠도 WebKit이 화면을 안 밀어 입력줄이 281px 가려졌고
  //   (scrollY 0), 어떨 땐 문서를 통째로 밀어 헤더가 상태바 밑으로 갔다 — WebKit 자동 '입력칸 보이게'는 들쭉날쭉.
  //   빌드 53(막대 있음)도 문서를 밀어서 우연히 보였을 뿐. visualViewport 값은 정확했다(보이는 아래끝 511 = 키보드 윗선).
  //   ⚠️ 채팅 '전체' 높이는 안 바꾼다 — 앱 높이를 resize마다 바꾸면 화면이 출렁인 기록(AppViewportHeight 주석).
  //   inset = innerHeight − vv.height − vv.offsetTop. 80px 미만은 키보드가 아니라 툴바 변화로 보고 무시.
  const [kbInset, setKbInset] = useState(0);
  useEffect(() => {
    if (!open) return;
    const vv = window.visualViewport;
    if (!vv) return;
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const inset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
        // 채팅은 화면 전체를 덮는 고정 패널이라 문서 스크롤은 WebKit '입력칸 보이게'의 부작용뿐 → 되돌려 헤더를 지킨다.
        //   되돌리면 scroll 이벤트가 다시 와서 offsetTop 0 기준으로 다시 잰다.
        if (inset > 80 && (window.scrollY !== 0 || vv.offsetTop !== 0)) window.scrollTo(0, 0);
        setKbInset(inset > 80 ? inset : 0);
      });
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    // 문서 자체 스크롤도 듣는다 — WebKit이 문서를 통째로 밀면 vv.offsetTop은 그대로라 vv scroll 이벤트가 안 와서
    //   헤더가 상태바 위로 밀린 채 남았다(우댕 실기기 2번째 사진, 입력줄은 보였음).
    window.addEventListener('scroll', update);
    return () => {
      cancelAnimationFrame(raf);
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      window.removeEventListener('scroll', update);
      setKbInset(0);
    };
  }, [open]);
  // 키보드 측정 창(KbReadout) — 헤더 이름 5번 연속 탭(2초 안)으로 켜고 끔. 기억 안 함: 새로 열면 늘 꺼져 있다.
  // (예전엔 localStorage에 남아서 새로고침해도 안 꺼졌다 — 남은 값은 지운다.)
  const pillRef = useRef<HTMLDivElement | null>(null);
  const [kbDebug, setKbDebug] = useState(false);
  // 연습 모드(?practice=1) — 검수자가 마음껏 눌러 보게. 보내기·입력 중·읽음·접속이 전부 막히고, 막힐 때마다 토스트.
  const [practice, setPractice] = useState(false);
  useEffect(() => {
    setPractice(isPractice());
    const on = (e: Event) => { setToast(`🧪 연습 모드 — ${(e as CustomEvent<string>).detail} 안 보냈어요`); setTimeout(() => setToast(''), 2400); };
    window.addEventListener('kk-practice', on);
    return () => window.removeEventListener('kk-practice', on);
  }, []);
  useEffect(() => { try { localStorage.removeItem('kkom-kbdebug'); } catch { /* noop */ } }, []);
  const nameTaps = useRef<number[]>([]);
  const onNameTap = () => {
    const now = Date.now();
    nameTaps.current = [...nameTaps.current.filter((t) => now - t < 2000), now];
    if (nameTaps.current.length < 5) return;
    nameTaps.current = [];
    const next = !kbDebug;
    setKbDebug(next);
    flashToast(next ? '키보드 측정 켬 📏' : '키보드 측정 끔');
  };
  // 메시지 메뉴가 열리면 보이는 데까지만 살짝 스크롤 — 마지막 말풍선의 메뉴는 화면 아래로 열려 안 보였다.
  //   ⚠️ 나타나는 순간(ref 콜백)에 부르면 등장 애니메이션 첫 프레임이라 안 먹었다 → 열린 뒤 잠깐 있다가.
  //   ⚠️ 80ms에 재면 아직 커지는 중(scale 0.9)이라 다 커진 뒤 4px 잘렸다(Aside 3부) → 애니메이션 끝(260ms)에 재고 12px 여유.
  const menuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!actionMsg) return;
    const t = setTimeout(() => {
      const list = scrollRef.current, m = menuRef.current;
      if (!list || !m) return;
      const over = m.getBoundingClientRect().bottom - list.getBoundingClientRect().bottom + 12;
      if (over > 0) list.scrollBy({ top: over, behavior: 'smooth' });
    }, 320);
    return () => clearTimeout(t);
  }, [actionMsg]);
  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (!el) return;
    // ⚠️ 내가 바닥에 붙이며 만든 스크롤은 '사람이 위로 올렸다'로 세면 안 된다. 그 스크롤 이벤트가 늦게 와서
    //   그 사이 서랍이 한 번 더 커지면(이모티콘 그림이 처음 뜰 때) 바닥 간격이 크게 잡혀 바닥 지키기가 꺼졌다
    //   (Aside 3부: ☺ 열면 바닥과 324px 떨어진 채 멈춤 — 그림이 캐시된 브라우저에선 안 보임).
    const pin = () => {
      if (!stickBottom.current) return;
      const target = el.scrollHeight - el.clientHeight;
      if (Math.abs(el.scrollTop - target) > 1) { ignoreScroll.current = true; el.scrollTop = target; }
    };
    const ro = new ResizeObserver(pin);
    ro.observe(el);
    el.addEventListener('load', pin, true);   // img·video 로드는 버블링 안 해서 캡처로 받는다
    return () => { ro.disconnect(); el.removeEventListener('load', pin, true); };
  }, [open]);

  // Esc — 맨 위에 떠 있는 것부터 하나씩 닫는다(메뉴 → 테마 → 추억함 → 서랍·＋칸). 채팅 자체는 안 닫는다.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.isComposing) return;
      if (actionMsg) setActionMsg(null);
      else if (themeOpen) setThemeOpen(false);
      else if (memoryOpen) setMemoryOpen(false);
      else if (stickerOpen || attachOpen) { setStickerOpen(false); setAttachOpen(false); }
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, actionMsg, themeOpen, memoryOpen, stickerOpen, attachOpen]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (ignoreScroll.current) ignoreScroll.current = false;   // 내가 붙인 스크롤 — 판정에서 뺀다
    else if (el) stickBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (!el || !hasMore) return;
    if (el.scrollTop < 60 && pendingAnchor.current == null) {
      isPrepending.current = true;
      pendingAnchor.current = el.scrollHeight - el.scrollTop; // 하단까지 거리 유지
      onLoadMore();
    }
  };

  const stopTyping = () => { setTyping(meKey, false); if (typingTimer.current) clearTimeout(typingTimer.current); };
  const onInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(e.target.value);
    setTyping(meKey, true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setTyping(meKey, false), 2500);
  };

  const send = () => {
    if (pendingSticker && !editing) { void sendPendingSticker(); return; }   // 미리보기 이모티콘 + 글 한 묶음
    const t = draft.trim();
    if (!t) return;
    // 수정 중이면 새로 보내는 대신 원본을 고친다.
    if (editing) {
      editMessage(editing.id, t);
      setEditing(null); setDraft(''); stopTyping();
      return;
    }
    onSend(t, undefined, undefined, replyTo ?? undefined);
    setDraft(''); setReplyTo(null); stopTyping();
    taRef.current?.focus();  // 연속 전송 — 자판 유지
    // 링크가 들어있으면 저장 물어보기 — 네이버 가게면 위시리스트, 아니면 이거봐봐.
    const url = firstUrl(t);
    if (url) void detectLinkPrompt(url, t);
  };

  // 보낸 링크 판정 → 네이버 '장소'면 위시리스트 담기 띠(가게명은 보낸 말 첫 줄), 아니면 이거봐봐 띠.
  // ⚠️ naver.me 는 지도 전용이 아니라 finalUrl 로 풀어 판정. 판정 실패해도 이거봐봐로 떨어뜨린다
  //    — 아무 띠도 안 뜨는 게 제일 나쁘다(사이담 교훈).
  const detectLinkPrompt = async (url: string, text: string) => {
    if (looksNaver(url)) {
      let finalUrl = url;
      let ogName = '';
      try {
        const r = await fetch(`/api/og-preview?url=${encodeURIComponent(url)}`);
        const j = await r.json();
        if (j?.finalUrl) finalUrl = j.finalUrl as string;   // naver.me 단축 풀기
        if (typeof j?.title === 'string') ogName = j.title;  // 서버가 휴대폰 UA로 받아 온 장소 이름(" : 네이버" 뗀 것)
      } catch { /* 못 풀어도 원래 url로 판정 시도 */ }
      if (isNaverPlaceUrl(finalUrl)) {
        setPlaceCat('food');
        // 이름은 보낸 말 첫 줄 우선(사람이 붙인 이름), 링크만 보냈으면 장소 페이지 이름
        setPlacePrompt({ url: finalUrl, name: storeNameFromText(text) || ogName.slice(0, 40) });
        return;
      }
    }
    setLinkPrompt(url);   // 네이버 아님/장소 아님/못 풀음 → 이거봐봐(아무 띠도 안 뜨는 게 제일 나쁘다)
  };

  const savePlace = async () => {
    if (!placePrompt || placeSaving) return;
    const name = placePrompt.name.trim();
    if (!name) return;   // 이름 비면 담기 X — 「네이버지도」 같은 쓰레기 항목을 막는 마지막 문
    if (isPractice()) { practiceBlocked('위시리스트 담기'); setPlacePrompt(null); return; }
    setPlaceSaving(true);
    try {
      await addWish({ category: placeCat, title: name, url: placePrompt.url, by: me as '우댕' | '꼼이' });
      flashToast('위시리스트에 담았어 📍');
    } catch { flashToast('저장 실패 — 다시 시도해줘'); }
    setPlaceSaving(false); setPlacePrompt(null);
  };

  // ── 사진 반입(⌘V 붙여넣기 · 드래그드롭) — 카톡처럼 창에 던지면 첨부창으로 ──
  // 미리보기로 보내기 전에 한 번 묻는다. 이전 미리보기 url은 해제.
  const stageImage = useCallback((file: File) => {
    setPastePreview((prev) => {
      if (prev) { try { URL.revokeObjectURL(prev.url); } catch { /* noop */ } }
      return { file, url: URL.createObjectURL(file) };
    });
  }, []);
  // 붙여넣기(textarea 포커스 시) — ⚠️ preventDefault는 '이미지가 있을 때만'(아니면 글자 붙여넣기가 깨짐, 사이담 교훈).
  const onPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const file = pickImageFile(e.clipboardData);
    if (!file) return;     // 이미지 없음 → 글자 붙여넣기는 막지 않는다
    e.preventDefault();
    stageImage(file);
  };
  const closePaste = () => {
    setPastePreview((prev) => {
      if (prev) { try { URL.revokeObjectURL(prev.url); } catch { /* noop */ } }
      return null;
    });
  };

  // 드래그드롭 · 전역 붙여넣기 — 채팅창이 열려 있는 동안 문서 전체에서 이미지를 가로챈다.
  //   ⚠️ 핵심 버그: drop/dragover를 안 막으면 브라우저가 그 이미지를 '새 탭에서 열어버린다'(우댕 신고).
  //   그래서 파일 드래그면 무조건 preventDefault로 기본동작(탐색)을 죽이고, 이미지면 첨부창에 얹는다.
  useEffect(() => {
    if (!open) return;
    const onDragOver = (e: DragEvent) => {
      if (!dtHasFile(e.dataTransfer)) return;         // 파일 아닌 드래그(텍스트 선택 등)는 건드리지 않는다
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
      setDragActive(true);
    };
    const onDragLeave = (e: DragEvent) => {
      if (e.relatedTarget == null) setDragActive(false); // 창 밖으로 완전히 나갈 때만 해제
    };
    const onDrop = (e: DragEvent) => {
      if (!dtHasFile(e.dataTransfer)) return;
      e.preventDefault();                              // 이미지든 아니든 '새 탭 열기' 차단
      setDragActive(false);
      const file = pickImageFile(e.dataTransfer);
      if (file) stageImage(file);
      else { setToast('이미지 파일만 보낼 수 있어'); setTimeout(() => setToast(''), 2400); }
    };
    const onDocPaste = (e: ClipboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT')) return; // 입력칸 포커스 시엔 각자 onPaste가 담당
      const file = pickImageFile(e.clipboardData);
      if (!file) return;
      e.preventDefault();
      stageImage(file);
    };
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    window.addEventListener('paste', onDocPaste);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
      window.removeEventListener('paste', onDocPaste);
      setDragActive(false);
    };
  }, [open, stageImage]);
  const sendPasted = async () => {
    if (!pastePreview || uploading) return;
    const file = pastePreview.file;
    setUploadKind('image'); setUploading(true);
    try {
      const url = await uploadChatImage(file);
      onSend('', url, undefined, replyTo ?? undefined);
      setReplyTo(null);
    } catch { flashToast('사진 전송 실패 — 다시 시도해줘'); }
    setUploading(false); setUploadKind(null);
    closePaste();
  };

  // "이거봐봐" 링크 구독 — 탭 열자마자 바로 보이게 상시 구독(≤100건).
  useEffect(() => subscribeShareList(setLinks), []);
  const saveCurrentLink = async () => {
    if (!linkPrompt || linkSaving) return;
    if (isPractice()) { practiceBlocked('링크 저장'); setLinkPrompt(null); return; }
    setLinkSaving(true);
    try { await addShare({ url: linkPrompt, by: me as '우댕' | '꼼이' }); flashToast('공유 리스트에 저장했어 🔖'); }
    catch { flashToast('저장 실패 — 다시 시도해줘'); }
    setLinkSaving(false); setLinkPrompt(null);
  };

  // ── 타임캡슐 ──
  const toLocalInput = (d: Date) => {
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  };
  const flashToast = (msg: string, ms = 2400) => { setToast(msg); setTimeout(() => setToast(''), ms); };
  const openCapsule = () => {
    // 칩엔 '타임캡슐'뿐이라 뭔지 몰랐다(Aside 1부) → 글 없이 누르면 한 줄 설명. 칩 글자는 폰 폭에 꽉 차서 안 늘린다(2부).
    if (!draft.trim()) { flashToast('⏳ 타임캡슐: 지금 쓴 말이 정한 날짜에 도착해. 먼저 메시지를 써줘 ✍️', 4000); return; }
    const d = new Date(); d.setFullYear(d.getFullYear() + 1);
    setCapsuleDate(toLocalInput(d));
    setCapsuleOpen(true);
  };
  const setCapsulePreset = (days: number) => { const d = new Date(); d.setDate(d.getDate() + days); setCapsuleDate(toLocalInput(d)); };
  const sendCapsuleNow = () => {
    const when = new Date(capsuleDate);
    if (isNaN(when.getTime()) || when.getTime() <= Date.now()) { flashToast('미래 날짜를 골라줘 ⏳'); return; }
    onSendCapsule(draft.trim(), when);
    setDraft(''); setReplyTo(null); setCapsuleOpen(false); stopTyping();
    flashToast(`타임캡슐 예약됨 ⏳ ${when.getFullYear()}.${when.getMonth() + 1}.${when.getDate()} 도착`);
  };

  // 텍스트 미니 — 커서 위치에 카톡식 (단어) 삽입. 넣고 나면 pickSticker 가 서랍을 닫는다. 렌더 시 32px 그림.
  const insertParen = (word: string) => {
    const token = `(${word})`;
    const ta = taRef.current;
    const start = ta?.selectionStart ?? draft.length;
    const end = ta?.selectionEnd ?? start;
    const next = draft.slice(0, start) + token + draft.slice(end);
    setDraft(next);
    // 방금 넣은 「(행복)」로 큰 「행복」이 다시 추천되지 않게 — 괄호 낀 단어는 입력칸 추천 단추를 안 띄운다(lastWord).
    requestAnimationFrame(() => {
      if (ta) { ta.focus(); const pos = start + token.length; ta.setSelectionRange(pos, pos); }
    });
  };

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
  const stickerSections = (mode: StickerMode): { label?: string; items: SItem[] }[] => {
    switch (mode) {
      case 'gif': return [{ items: ANIM_STICKERS.map((s) => ({ key: s.word, image: s.image, thumb: s.still })) }];
      case 'kkul': return [{ items: KKUL_STICKERS.map((s) => ({ key: s.word, image: s.image })) }];
      case 'kkulgif': return [{ items: KKUL_ANIM.map((s) => ({ key: s.word, image: s.image, thumb: drawerThumb(s.image) })) }];
      case 'uri': return [{ items: URI_STICKERS.map((s) => ({ key: s.word, image: s.image })) }];
      case 'maltipoo': return [{ items: SAI_STICKERS.map((s) => ({ key: s.word, image: s.image })) }];
      case 'mini': return [{ items: SAIDAMI_STICKERS.map((s) => ({ key: s.word, image: s.image })) }];
      case 'basic': return [{ items: MOOD_OPTIONS.map((o) => ({ key: o.id, image: o.image })) }];
      case 'dang': return [{ items: DANG_STICKERS.map((s) => ({ key: s.word, image: s.image })) }];
      case 'kkom': return [{ items: KKOM_STICKERS.map((s) => ({ key: s.word, image: s.image })) }];
      case 'couple': return [{ items: POCKET_STICKERS.map((s) => ({ key: s.word, image: s.image, video: isVideoSrc(s.image) })) }];
      default: return [];
    }
  };
  // 카톡식 이모티콘 보내기(우댕 2026-10-22 「1번」 결정 · 제미나이 시안 StickerSendPreview·StickerTextStack):
  //   고르면 바로 보내지 않고 입력칸 위에 미리보기 → 같은 걸 한 번 더 누르거나(카톡) 보내기를 누르면
  //   이모티콘 + 친 글이 **메시지 하나**(sticker + text)로 가서 한 말풍선 묶음으로 그려진다. 글이 없으면 이모티콘만.
  //   (그 전엔 누르는 즉시 이모티콘만 가고 글이 입력칸에 남았다 → 잠깐 「두 개로 연달아」였다가 이걸로)
  //   2026-10-28: 미리보기는 대화 위 반투명 카드(★·✕). 입력칸 단추(단어 그림)로 연 서랍에서 고르면 그 단어는 입력칸에서 빠진다.
  const [pendingSticker, setPendingSticker] = useState<{ image: string; thumb: string; isVideo: boolean; label: string; pick?: EmoPick } | null>(null);
  const sendPendingSticker = async (image?: string) => {
    const img = image ?? pendingSticker?.image;
    if (!img) return;
    const t = draft.trim();
    const reply = replyTo ?? undefined;
    setPendingSticker(null); setReplyTo(null); setPairFrom(null); setKwUndo(null); setKwWord(null);
    setEmoQuery('');   // 보낸 뒤 서랍이 옛 검색 결과에 머물지 않게 — 평소 탭 화면으로(Aside 2026-10-28)
    if (t) { setDraft(''); stopTyping(); }
    await onSend(t, undefined, img, reply);
    if (t) { const url = firstUrl(t); if (url) void detectLinkPrompt(url, t); }
  };
  const activeKw = () => (kwWord && emoQuery.trim() === kwWord ? kwWord : null);
  // 이모티콘이 글을 「대신」하나 — 입력칸이 그 낱말 하나(+꾸밈)뿐일 때만. 문장이면 글은 하나도 안 지우고 같이 간다.
  //   우댕 2026-10-28: 「내사랑 꼼슌이 보고싶어」에서 보고싶어를 고르면 카톡은 메시지까지 다 가는데 꼼톡은 지워 버렸다 → GPT 상의.
  const replacesDraft = () => meaningWords(draft).length <= 1;
  const chooseSticker = (image: string, label: string, thumb?: string, pick?: EmoPick) => {
    // 메시지 고치는 중엔 미리보기 없이 예전처럼 이모티콘만 바로(고치던 글은 그대로)
    if (editing) { void onSend('', undefined, image, replyTo ?? undefined); setReplyTo(null); return; }
    if (pendingSticker?.image === image) { void sendPendingSticker(image); return; }   // 같은 걸 한 번 더 → 바로 전송(카톡)
    // 단어로 연 서랍에서, 입력칸이 그 낱말 하나뿐이면 이모티콘이 그 말을 대신한다 — 글을 비운다(한 번만). ✕로 빼면 되돌린다.
    const kw = activeKw();
    if (kw) {
      if (replacesDraft() && draft.trim()) { setKwUndo({ before: draft, after: '', word: kw }); setDraft(''); }
      setKwWord(null);
    }
    setPendingSticker({ image, thumb: thumb ?? image, isVideo: isVideoSrc(image), label, pick });
  };
  const cancelPendingSticker = () => {
    setPendingSticker(null);
    if (kwUndo && draft === kwUndo.after) {
      setDraft(kwUndo.before);
      if (stickerOpen) setKwWord(kwUndo.word);   // 서랍에서 다시 고르면 또 뺀다
    }
    setKwUndo(null);
  };
  // 입력칸 단추에 띄울 작은 그림 — 마지막 단어로 찾은 첫 이모티콘(움짤은 정지컷). 서랍이 열렸거나 고치는 중이면 없음.
  const kwThumb = !stickerOpen && !editing && wordSugs[0] ? drawerThumb(wordSugs[0].thumb) : null;
  // 입력칸 단추(단어 그림) → 그 단어로 찾은 서랍(카톡 「검색」 탭). 키보드는 내린다.
  const openKeywordSearch = () => {
    setKwWord(lastWord);
    setEmoQuery(lastWord); setStickerOpen(true); setAttachOpen(false); taRef.current?.blur();
  };

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

  // 받은 메시지의 이모티콘 그림(혼자일 때와 글과 묶일 때 같이 씀)
  const stickerArt = (src: string) => (
    isVideoSrc(src) ? (
      <video src={src} poster={posterOf(src)} autoPlay loop muted playsInline
        className="w-40 h-40 rounded-[26px] object-cover bg-white shadow-sm" />
    ) : FULL_STICKERS.has(src) ? (
      <motion.img src={src} alt="이모티콘" className="w-[76vw] max-w-[400px] h-auto rounded-2xl shadow-sm"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ scale: { type: 'spring', stiffness: 300, damping: 20 }, opacity: { duration: 0.2 } }} />
    ) : (
      // 크기 통일 — ⚠️ 높이·폭 '둘 다' 상한(max-h 138 / max-w 150, 비율유지 contain). 높이만 잡으면
      //   세로긴 프레임(사이 팩)은 잡히지만 가로넓은 것(심심해 319x252→187폭)·정사각(ㅋㅋㅋ 꽉참)이 커 보임.
      //   두 상한으로 캐릭터 '덩치'를 통일(우댕: 뭐해/도착/심심해/ㅋㅋㅋ 지적). 푸데데 가로형이 대략 상한.
      //   챗 이모티콘은 말풍선 없이 그림만. ⚠️ 움짤(sai-anim)은 스스로 움직여 통 흔들기(rotate) 제외, 정지만 흔든다.
      <motion.img src={src} alt="이모티콘"
        className="max-h-[138px] max-w-[150px] object-contain drop-shadow-sm"
        initial={{ scale: 0.4, opacity: 0 }}
        animate={src.startsWith('/emo/sai-anim/')
          ? { scale: 1, opacity: 1 }
          : { scale: 1, opacity: 1, rotate: [0, -5, 5, -3, 0] }}
        transition={src.startsWith('/emo/sai-anim/')
          ? { scale: { type: 'spring', stiffness: 420, damping: 14 }, opacity: { duration: 0.15 } }
          : { scale: { type: 'spring', stiffness: 420, damping: 14 }, opacity: { duration: 0.15 }, rotate: { duration: 1.8, repeat: Infinity, repeatDelay: 2.4, ease: 'easeInOut' } }} />
    )
  );

  // 원본 사진·동영상 저장 — 중복 탭 방지용 saving 상태만 관리, 실제 저장은 saveMedia가 플랫폼별로.
  const handleSave = async (url: string, kind: 'image' | 'video') => {
    if (savingUrl) return;
    setSavingUrl(url);
    try { await saveMedia(url, kind); } finally { setSavingUrl(null); }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    // 동영상 — 라이브러리에서 고른 파일. 상한: 30초 · 30MB.
    // 속도 우선(사용자 선택): 원본 화질 유지하되 파일을 가볍게 → 업로드·재생 빠르게.
    // (진짜 재인코딩 압축은 iOS/웹 코덱·컨테이너가 갈려 재생이 깨질 수 있어 안 함)
    if (file.type.startsWith('video/')) {
      if (file.size > 30 * 1024 * 1024) { alert('동영상이 너무 커요 — 30MB 이하(약 30초)로 보내줘 🎬'); return; }
      const dur = await new Promise<number>((resolve) => {
        const v = document.createElement('video');
        v.preload = 'metadata';
        v.onloadedmetadata = () => resolve(v.duration || 0);
        v.onerror = () => resolve(0);
        v.src = URL.createObjectURL(file);
      });
      if (dur > 31) { alert('동영상은 30초 이하만 보낼 수 있어 🎬'); return; }
      setUploadKind('video'); setUploadPct(0); setUploading(true);
      try {
        const url = await uploadChatVideo(file, setUploadPct);
        onSend('', undefined, undefined, replyTo ?? undefined, undefined, { url, dur: Math.round(dur) });
        setReplyTo(null);
      } catch { alert('동영상 전송에 실패했어. 다시 시도해줘.'); }
      setUploading(false); setUploadKind(null); setUploadPct(0);
      return;
    }

    // 사진
    setUploadKind('image'); setUploading(true);
    try { const url = await uploadChatImage(file); onSend('', url, undefined, replyTo ?? undefined); setReplyTo(null); }
    catch { /* 무시 */ }
    setUploading(false); setUploadKind(null);
  };

  // ── 음성 메시지 녹음 ──
  const startRec = async () => {
    if (recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/mp4')) ? 'audio/mp4' : '';
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.onstop = () => { void finishRec(); };
      recRef.current = rec;
      recStart.current = Date.now();
      rec.start();
      setRecording(true); setRecSec(0);
      recTimer.current = setInterval(() => setRecSec((s) => s + 1), 1000);
    } catch {
      alert('마이크 권한이 필요해요');
    }
  };
  const stopRec = (sendIt: boolean) => {
    sendAfterStop.current = sendIt;
    if (recTimer.current) clearInterval(recTimer.current);
    setRecording(false);
    try { recRef.current?.stop(); } catch { /* 무시 */ }
  };
  const finishRec = async () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    const dur = Math.round((Date.now() - recStart.current) / 1000);
    const blob = new Blob(chunksRef.current, { type: recRef.current?.mimeType || 'audio/webm' });
    if (!sendAfterStop.current || dur < 1 || blob.size < 1200) return; // 취소 or 너무 짧음
    setUploadKind('audio'); setUploading(true);
    try {
      const url = await uploadChatAudio(blob);
      onSend('', undefined, undefined, replyTo ?? undefined, { url, dur });
      setReplyTo(null);
    } catch { /* 무시 */ }
    setUploading(false); setUploadKind(null);
  };

  // 메시지 효과 — 새 메시지에 키워드 있으면 이모지 폭죽 (첫 로드/더보기는 스킵)
  useEffect(() => {
    if (!messages.length) return;
    const last = messages[messages.length - 1];
    if (seenLastId.current === null) { seenLastId.current = last.id; return; }
    if (last.id !== seenLastId.current) {
      seenLastId.current = last.id;
      const recent = last.createdAt == null || Date.now() - last.createdAt.getTime() < 15000;
      const emojis = effectFor(last.text);
      if (open && recent && emojis) {
        setEffect({ id: last.id, emojis });
        if (effectTimer.current) clearTimeout(effectTimer.current);
        effectTimer.current = setTimeout(() => setEffect(null), 2600);
      }
    }
  }, [messages, open]);

  const withDays = useMemo(() => {
    let lastDay = '';
    return messages.map((m, i) => {
      const d = dayText(m.createdAt);
      const showDay = d !== lastDay;
      lastDay = d;
      const prev = messages[i - 1];
      const showAvatar = m.from !== me && (showDay || !prev || prev.from !== m.from);
      return { m, showDay, day: d, showAvatar };
    });
  }, [messages, me]);

  const openMemory = async () => {
    setThemeOpen(false);   // 테마 시트 위에 추억함이 겹쳐 열리던 것(Aside 1부)
    setMemoryOpen(true);
    setMemories(null);
    try { setMemories(await fetchRecentMessages(300)); } catch { setMemories([]); }
  };
  const doStar = () => { if (actionMsg) toggleStar(actionMsg.id); setActionMsg(null); };

  // 말풍선 탭 — 한 번이면 0.26초 뒤 메뉴, 그 안에 한 번 더 누르면(두 번 톡) 바로 ❤️ 반응 + 하트 팝(인스타·아이메시지식).
  //   반응이 메뉴 안에만 있어 두 달 반 동안 10번밖에 안 쓰였다(우댕 선택 2026-10-19). 이미 ❤️면 그대로 둔다(두 번 톡으로 지워지지 않게).
  const tapRef = useRef<{ id: string; t: ReturnType<typeof setTimeout> } | null>(null);
  const [heartPop, setHeartPop] = useState<string | null>(null);
  const onBubbleTap = (m: ChatMessage) => {
    const prev = tapRef.current;
    if (prev && prev.id === m.id) {
      clearTimeout(prev.t); tapRef.current = null;
      setActionMsg(null);
      if (m.reactions?.[meKey] !== '❤️') toggleReaction(m.id, meKey, '❤️');
      setHeartPop(m.id); setTimeout(() => setHeartPop((h) => (h === m.id ? null : h)), 650);
      return;
    }
    if (prev) clearTimeout(prev.t);
    tapRef.current = { id: m.id, t: setTimeout(() => { tapRef.current = null; setActionMsg((cur) => (cur?.id === m.id ? null : m)); }, 260) };
  };
  const doReact = (emoji: string) => { if (actionMsg) toggleReaction(actionMsg.id, meKey, emoji); setActionMsg(null); };
  const doReply = () => { if (actionMsg) setReplyTo({ id: actionMsg.id, from: actionMsg.from, text: preview(actionMsg) }); setActionMsg(null); taRef.current?.focus(); };
  const doCopy = () => { if (actionMsg?.text) navigator.clipboard?.writeText(actionMsg.text).catch(() => {}); setActionMsg(null); };
  const doDelete = () => { if (actionMsg) deleteMessage(actionMsg.id); setActionMsg(null); };
  // 수정 — 내 텍스트 메시지만. 입력창에 본문을 넣고 '수정 중' 상태로. 전송하면 editMessage로 감.
  const doEdit = () => { if (actionMsg?.text) { setEditing({ id: actionMsg.id, text: actionMsg.text }); setReplyTo(null); setDraft(actionMsg.text); } setActionMsg(null); taRef.current?.focus(); };

  return (
    <AnimatePresence>
      {/* 넓은 화면(768px↑) — 채팅은 가운데 40rem(사이담 .sd-shell 과 같은 폭), 양옆은 살짝 어둡게.
          1440px에서 입력줄이 화면 끝까지 늘어나고 스티커가 한 줄 4개로 거대해지던 것(Aside 1부).
          양옆을 눌러 닫기는 뺐다(Aside 3부: 실수로 누르기 쉽고 왜 닫혔는지 모른다). 닫기는 ×·스와이프. 뒤 홈 클릭만 막는다. */}
      {open && (
        <motion.div key="chat-backdrop" className="fixed inset-0 z-[59] hidden bg-black/25 md:block"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      )}
      {open && (
        <motion.div
          key="chat"
          className="fixed inset-0 z-[60] flex flex-col md:left-[calc(50%-20rem)] md:right-[calc(50%-20rem)] md:shadow-2xl"
          style={chatThemeStyle}
          // 들어오고 나갈 때 '화면 폭'만큼 — '100%'(자기 폭 640px)면 넓은 화면에서 다 안 빠져나가 오른쪽에 걸려 남았다(Aside 3부).
          //   ⚠️ '100vw' 문자열은 motion이 0으로 못 움직여 열리지도 않았다 → 화면 폭을 px 숫자로.
          initial={{ x: offX }} animate={{ x: 0 }} exit={{ x: offX }}
          transition={{ type: 'spring', stiffness: 380, damping: 40 }}
          // 넓은 화면(768px↑)에선 끌어서 닫기를 끈다 — 손가락 기기가 아니고, 드래그 제한값이 닫힘 애니메이션과 부딪혀
          //   채팅이 화면 밖에 남고 어두운 배경도 안 걷혔다(Aside 3부 'B1 걸려 남음'의 실체).
          drag={(isWide || memoryOpen || viewerImage || actionMsg || capsuleOpen || stickerOpen) ? false : 'x'}
          dragDirectionLock
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={{ left: 0, right: 0.9 }}
          onDragEnd={(_e, info) => { if (info.offset.x > 110 || info.velocity.x > 550) onClose(); }}
        >
          {kbDebug && <KbReadout pillRef={pillRef} />}

          {/* 사진 드래그드롭 안내 — 이미지가 창 위에 떠 있을 때만. pointer-events-none이라 drop은 window가 받는다. */}
          <AnimatePresence>
            {dragActive && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="pointer-events-none absolute inset-0 z-[90] flex items-center justify-center bg-black/45 backdrop-blur-[2px]"
              >
                <div className="flex flex-col items-center gap-2.5 rounded-3xl border-2 border-dashed border-white/70 px-9 py-7 text-white">
                  <ImagePlus size={34} strokeWidth={2.2} />
                  <div className="text-[15px] font-extrabold">여기에 놓으면 사진 전송 💌</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 헤더 — 사이챗처럼 대화 바탕에 녹인다: 보더·섀도·블러 없이 바탕색(tc.bg) 그대로 + 컴팩트.
              선 하나가 '띠'를 만들어 위가 분리돼 보였다(우댕: 못생김). 패널은 tc.bg로 불투명이라 뒤 안 비쳐 안전.
              ⚠️ pt-safe(노치)는 유지 — 빼면 상태바 시계와 이름이 겹친다(사이담이 실기기서 겪음). 브라우저엔 노치 없어 안 보임. */}
          <div className="flex items-center gap-3 px-4 pb-2.5"
            style={{ paddingTop: 'max(env(safe-area-inset-top), 0.5rem)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarOf(partner)} alt={partner} className="w-9 h-9 rounded-full object-cover" />
            <div className="flex-1">
              <div className="text-base font-extrabold select-none" style={{ color: 'var(--ct-chip-text)' }} onClick={onNameTap}>{partner}</div>
              <div className={`text-xs font-bold ${partnerTyping ? 'text-[#FB7BA8]' : partnerOnline ? 'text-emerald-500' : partnerOnWatch ? 'text-amber-500' : 'text-slate-400'}`}>
                {partnerTyping ? '입력 중…' : partnerOnline ? '지금 함께 💚' : partnerOnWatch ? '⌚ 워치로 보는 중' : '오프라인'}
              </div>
            </div>
            {/* 아이콘 셋을 한 덩어리로 묶어 gap-0.5로 붙인다 — '셋'이 아니라 한 뭉치로 읽히게(사이담 팁) */}
            <div className="flex items-center gap-0.5 -mr-1">
              <button onClick={() => { setMemoryOpen(false); setThemeOpen(true); }} aria-label="챗 테마" title="챗 테마" className="p-1.5 text-[#FB7BA8] hover:opacity-80">
                <Palette size={20} />
              </button>
              <button onClick={openMemory} aria-label="추억 보관함" title="추억 보관함" className="p-1.5 text-[#FB7BA8] hover:opacity-80">
                <Bookmark size={20} />
              </button>
              <button onClick={onClose} aria-label="닫기" title="채팅 닫기" className="p-1.5 text-slate-400 hover:text-slate-600"><X size={22} /></button>
            </div>
          </div>
          {practice && (
            <div className="mx-4 mb-1.5 rounded-xl bg-amber-100 px-3 py-1.5 text-center text-xs font-bold text-amber-800">
              🧪 연습 모드 — 무엇을 눌러도 {partner}에게 안 가요
            </div>
          )}

          {/* 챗 테마 시트 — 제미나이 설계: 미니 챗 미리보기 카드 2단 그리드. 모드별 세트(라이트 5·다크 7), 기기별. */}
          <AnimatePresence>
            {themeOpen && (
              <>
                <motion.div className="absolute inset-0 z-[70] bg-black/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => setThemeOpen(false)} />
                <motion.div className="absolute inset-x-0 bottom-0 z-[71] rounded-t-3xl bg-white p-4 shadow-2xl"
                  style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
                  initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 380, damping: 38 }}>
                  <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-black/10" />
                  {/* 닫기 버튼 — 전엔 어두운 바깥을 눌러야만 닫혔다(Aside 1부) */}
                  <button onClick={() => setThemeOpen(false)} aria-label="챗 테마 닫기" title="닫기"
                    className="absolute right-2.5 top-2.5 grid h-10 w-10 place-items-center rounded-full text-slate-400 hover:bg-black/5 active:scale-90 transition">
                    <X size={20} />
                  </button>
                  <div className="mb-2.5 text-center text-[15px] font-extrabold text-slate-700">챗 테마 <span className="ml-1 text-[11px] font-semibold text-slate-400">이 기기에만 적용</span></div>
                  <div className="mb-3 flex rounded-full bg-black/[0.06] p-1 text-[13px] font-bold">
                    <button onClick={() => applyChatMode('light')} className={`flex-1 rounded-full py-1.5 transition ${!dk ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400'}`}>☀️ 라이트</button>
                    <button onClick={() => applyChatMode('dark')} className={`flex-1 rounded-full py-1.5 transition ${dk ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400'}`}>🌙 다크</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 max-h-[52vh] overflow-y-auto -mx-1 px-1">
                    {themeSet.map((t) => {
                      const c = t; const sel = t.id === activeThemeId;
                      return (
                        <button key={t.id} onClick={() => applyChatTheme(t.id)}
                          className={`rounded-2xl p-2.5 text-left ring-2 transition active:scale-[0.98] ${sel ? 'ring-[#FB7BA8]' : 'ring-black/[0.06]'}`}
                          style={{ background: c.bg }}>
                          <div className="flex flex-col gap-1">
                            <span className="max-w-[86%] self-start truncate rounded-2xl rounded-tl-sm px-2.5 py-1 text-[11px] font-medium" style={{ background: c.partnerBg, color: c.partnerText }}>안녕!</span>
                            <span className="max-w-[86%] self-end truncate rounded-2xl rounded-tr-sm px-2.5 py-1 text-[11px] font-medium" style={{ background: c.myBg, color: c.myText }}>사랑해 💗</span>
                          </div>
                          <div className="mt-2 flex items-center gap-1">
                            {sel && <Check size={13} className="text-[#FB7BA8]" strokeWidth={3} />}
                            <span className={`text-[12px] font-bold ${sel ? 'text-[#FB7BA8]' : 'text-slate-500'}`}>{t.name}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* 메시지 — 길게눌러 답장 시 iOS 기본 텍스트선택/콜아웃(Copy·Look Up) 뜨는 것 차단 */}
          <div ref={scrollRef} onScroll={onScroll}
            onClick={() => { if (stickerOpen) setStickerOpen(false); if (actionMsg) setActionMsg(null); }}
            // 메뉴가 열려 있으면 아래 여유를 더 준다 — 떠 있는 메뉴가 맨 아래 말풍선보다 아래로 나와 스크롤 여유가 모자랐다.
            style={actionMsg ? { paddingBottom: 112 } : undefined}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 select-none [-webkit-touch-callout:none] [-webkit-user-select:none]">
            {hasMore && (
              <div className="flex justify-center py-1">
                <button onClick={onLoadMore} className="text-[11px] font-bold text-slate-400 bg-black/5 rounded-full px-3 py-1">이전 대화 더보기</button>
              </div>
            )}
            {withDays.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 gap-2">
                <span className="text-4xl">💬</span>
                <p className="text-sm font-semibold">첫 메시지를 보내봐</p>
              </div>
            )}
            {withDays.map(({ m, showDay, day, showAvatar }) => {
              // 꼼모닝이 넣는 안내 카드(달력 하루 전 등) — 누구 말풍선도 아니라 가운데 작은 카드. 눌러도 메뉴 없음.
              if (m.kind === 'calendar') return (
                <div key={m.id} id={`cmsg-${m.id}`}>
                  {showDay && (
                    <div className="flex justify-center my-6">
                      <span className="rounded-full bg-black/5 dark:bg-white/10 px-4 py-1.5 text-xs font-bold text-[#64748B] dark:text-[#B4AA9A]">{day}</span>
                    </div>
                  )}
                  <div className="my-3 flex justify-center">
                    <div className="max-w-[86%] rounded-2xl px-4 py-2 text-center text-[13px] font-bold leading-snug shadow-sm ring-1 ring-black/[0.04] break-keep"
                      style={{ background: 'var(--ct-partner-bg)', color: 'var(--ct-chip-text)' }}>
                      {m.text}
                    </div>
                  </div>
                </div>
              );
              const mine = m.from === me;
              const pending = m.capsule === true && m.createdAt != null && m.createdAt.getTime() > Date.now();
              const unread = mine && !m.deleted && !pending && m.createdAt != null && (partnerLastRead == null || m.createdAt > partnerLastRead);
              const reactionEmojis = m.reactions ? Object.values(m.reactions) : [];
              return (
                <div key={m.id} id={`cmsg-${m.id}`}
                  className={`rounded-2xl transition-colors duration-500 ${flashId === m.id ? 'bg-[#FB7BA8]/12' : ''}`}>
                  {showDay && (
                    <div className="flex justify-center my-6">
                      <span className="rounded-full bg-black/5 dark:bg-white/10 px-4 py-1.5 text-xs font-bold text-[#64748B] dark:text-[#B4AA9A]">{day}</span>
                    </div>
                  )}
                  <div className={`flex items-end gap-1.5 ${mine ? 'justify-end' : 'justify-start'}`}>
                    {!mine && (showAvatar
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={avatarOf(partner)} alt={partner} className="w-8 h-8 rounded-full object-cover shrink-0 self-end shadow-sm" />
                      : <div className="w-8 shrink-0" />)}
                    {mine && (
                      <div className="flex flex-col items-end mb-0.5 leading-tight">
                        {unread && <span className="text-[10px] font-bold text-[#FB7BA8]">1</span>}
                        <span className="text-[10px] text-slate-400">{timeText(m.createdAt)}</span>
                      </div>
                    )}

                    <div
                      // 두 번 톡 확대(아이폰 더블탭 줌)를 막아야 ❤️가 된다
                      style={{ alignItems: mine ? 'flex-end' : 'flex-start', touchAction: 'manipulation' }}
                      // 메뉴가 열린 말풍선엔 분홍 테두리 — 떠 있는 메뉴가 아래 말풍선을 덮어 '어느 메시지 메뉴인지' 안 보였다(Aside 3부 재확인).
                      className={`relative flex flex-col select-none ${m.sticker && FULL_STICKERS.has(m.sticker) ? 'max-w-[88%]' : 'max-w-[78%]'} ${reactionEmojis.length > 0 ? 'mb-3' : ''} ${actionMsg?.id === m.id ? 'rounded-[22px] outline outline-2 outline-offset-4 outline-[#FB7BA8]/60' : ''}`}
                      // 사이담처럼 — 말풍선 한 번 탭하면 바로 반응/답장 줄 토글(꾹 누르기 아님). 삭제/예약은 제외.
                      onClick={(e) => { e.stopPropagation(); setStickerOpen(false); if (!m.deleted && !pending) onBubbleTap(m); }}
                      onContextMenu={(e) => { e.preventDefault(); if (!m.deleted) setActionMsg(m); }}
                    >
                      {/* 답장 인용 — 사이담 룩(왼쪽 세로줄 + 배경 없음, 한 줄 말줄임). 탭하면 원본으로 점프.
                          내 메시지=관계색(핑크) 세로줄, 상대=흐린 회색. 정렬은 부모 flex-col alignItems가 잡음. */}
                      {m.replyTo && !m.deleted && (
                        <button type="button"
                          onClick={(e) => { e.stopPropagation(); if (m.replyTo) jumpToMessage(m.replyTo.id); }}
                          aria-label="답장한 원본 메시지로 이동"
                          className="mb-1 block max-w-[70%] truncate border-l-2 pl-2 text-left text-[11px] text-slate-400 opacity-80 active:opacity-100 transition-opacity"
                          style={{ borderColor: mine ? '#FB7BA8' : 'rgba(148,163,184,0.55)' }}>
                          <span className="font-bold">{m.replyTo.from}</span> · {m.replyTo.text}
                        </button>
                      )}

                      {m.capsule && !pending && !m.deleted && (
                        <div className="mb-0.5 flex items-center gap-1 text-[10px] font-bold text-[#FB7BA8]">⏳ 타임캡슐</div>
                      )}
                      {pending ? (
                        <div className="max-w-full px-4 py-3 rounded-2xl rounded-tr-sm border-2 border-dashed border-[#FB7BA8]/50 bg-[#FB7BA8]/10">
                          <div className="text-[13px] font-bold text-[#c94c7a] flex items-center gap-1.5"><span className="text-base">⏳</span> 타임캡슐이 심어졌어요</div>
                          <div className="text-[15px] text-slate-600 mt-1.5 break-keep whitespace-pre-wrap">{m.text}</div>
                          <div className="text-[11px] font-semibold text-[#FB7BA8]/70 mt-1.5">{m.createdAt?.getFullYear()}.{(m.createdAt?.getMonth() ?? 0) + 1}.{m.createdAt?.getDate()} 도착 예정</div>
                        </div>
                      ) : m.deleted ? (
                        <div className="max-w-[75%] px-3.5 py-2 text-[14px] italic text-slate-400 bg-black/5 rounded-2xl">삭제된 메시지예요</div>
                      ) : m.sticker ? (
                        m.text?.trim() ? (
                          // 이모티콘 + 글 한 메시지 → 카톡처럼 이모티콘 위·글 말풍선 아래 한 묶음(제미나이 StickerTextStack)
                          <StickerTextStack mine={mine} sticker={stickerArt(m.sticker)}>
                            <div
                              className={`max-w-full px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap break-keep rounded-2xl ${mine ? 'rounded-tr-sm shadow-[0_2px_8px_rgba(0,0,0,0.12)]' : 'rounded-tl-sm shadow-[0_2px_12px_rgba(0,0,0,0.04)]'}`}
                              style={{ background: mine ? 'var(--ct-my-bg)' : 'var(--ct-partner-bg)', color: mine ? 'var(--ct-my-text)' : 'var(--ct-partner-text)' }}>
                              {renderRich(m.text, m.from)}
                            </div>
                          </StickerTextStack>
                        ) : stickerArt(m.sticker)
                      ) : m.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.imageUrl} alt="사진"
                          onClick={(e) => { e.stopPropagation(); setViewerImage(m.imageUrl!); }}
                          className="max-w-[68%] rounded-2xl shadow-sm object-cover cursor-pointer"
                          style={{ maxHeight: 280 }}
                        />
                      ) : m.videoUrl ? (
                        // 자동재생 X — 스크롤마다 재다운로드 방지(대역폭). 탭해서 재생.
                        <div className="relative inline-block max-w-[76%]" onClick={(e) => e.stopPropagation()}>
                          <video
                            // #t=0.1 → 재생 전에도 첫 프레임을 썸네일로 보여줌(iOS는 poster 없으면 검은 박스)
                            src={`${m.videoUrl}#t=0.1`} controls playsInline preload="metadata"
                            className="w-full rounded-2xl shadow-sm bg-black"
                            style={{ maxHeight: 320 }}
                          />
                          <button
                            onClick={() => handleSave(m.videoUrl!, 'video')}
                            aria-label="동영상 원본 저장"
                            className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-transform active:scale-90"
                          >
                            {savingUrl === m.videoUrl ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} strokeWidth={2.2} />}
                          </button>
                        </div>
                      ) : m.audioUrl ? (
                        <div onClick={(e) => e.stopPropagation()}><VoiceBubble url={m.audioUrl} dur={m.audioDur ?? 0} mine={mine} /></div>
                      ) : (() => {
                        const tok = parseStickerTokens(m.text, m.from);
                        if (tok.onlyTokens) return <BigMinis srcs={tok.srcs} />;   // 미니만 → 말풍선 없이 크게(카톡식)
                        const linkUrl = firstUrl(m.text);
                        const onlyUrl = !!linkUrl && m.text.trim() === linkUrl;
                        return (
                          <>
                            {/* 주소만 덜렁 보내면 텍스트 버블은 숨기고 카드만 (주소 노출 X) */}
                            {!onlyUrl && (
                              <div
                                className={`max-w-full px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap break-keep rounded-2xl ${mine ? 'rounded-tr-sm shadow-[0_2px_8px_rgba(0,0,0,0.12)]' : 'rounded-tl-sm shadow-[0_2px_12px_rgba(0,0,0,0.04)]'}`}
                                style={{ background: mine ? 'var(--ct-my-bg)' : 'var(--ct-partner-bg)', color: mine ? 'var(--ct-my-text)' : 'var(--ct-partner-text)' }}>
                                {renderRich(m.text, m.from)}
                              </div>
                            )}
                            {m.editedAt && !onlyUrl && <span className="mt-0.5 px-1 text-[9px] text-slate-400">수정됨</span>}
                            {linkUrl && (
                              <div className={onlyUrl ? '' : 'mt-1'}><LinkPreview url={linkUrl} mine={mine} /></div>
                            )}
                          </>
                        );
                      })()}

                      {/* 반응 칩 — 말풍선 하단에 살짝 걸치게 (제미나이 원안) */}
                      <AnimatePresence>
                        {heartPop === m.id && (
                          <motion.span key="pop" aria-hidden className="pointer-events-none absolute inset-0 z-10 grid place-items-center text-[44px] drop-shadow"
                            initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1.15, opacity: 1 }} exit={{ scale: 1.5, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 420, damping: 16 }}>❤️</motion.span>
                        )}
                      </AnimatePresence>
                      {reactionEmojis.length > 0 && (
                        <div className={`absolute -bottom-3 flex items-center gap-1 rounded-full border border-[#FBF8F2] dark:border-[#272522] bg-white dark:bg-[#332F2A] px-2 py-0.5 shadow-sm text-[12px] leading-none ${mine ? '-left-2' : '-right-2'}`}>
                          {reactionEmojis.join(' ')}
                        </div>
                      )}

                      {/* 사이담식 인라인 메뉴 — 말풍선 한 번 탭하면 바로 아래에 떠오름. 위 줄 반응, 아래 줄 동작.
                          아이콘만 있던 걸 글자 라벨로(Aside 1부: 답장·보관이 글자 없는 아이콘 7개 뒤에 숨어 있었다).
                          한 줄에 다 넣으면 폰 폭에서 넘쳐서 두 줄. 바깥 탭·Esc로 닫힌다. */}
                      <AnimatePresence>
                        {actionMsg?.id === m.id && !m.deleted && (
                          <motion.div onClick={(e) => e.stopPropagation()} ref={menuRef}
                            initial={{ opacity: 0, y: -6, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            // 말풍선 아래에 '떠서' 열린다(absolute) — 목록 안에서 자리를 차지하면 아래 말풍선·시간 표시가
                            //   밀렸다(Aside 3부). 떠 있어도 스크롤 길이엔 들어가서 아래로 보여 주기는 된다.
                            className={`absolute top-full z-20 mt-3 w-max max-w-[calc(100vw-2rem)] rounded-2xl bg-white px-1.5 py-1.5 shadow-[0_6px_20px_rgba(0,0,0,0.14)] ${mine ? 'right-0' : 'left-0'}`}>
                            <div className="flex items-center justify-center gap-1 border-b border-black/[0.06] pb-1.5">
                              {REACTIONS.map((emo) => (
                                <button key={emo} onClick={() => doReact(emo)} aria-label={`${emo} 반응`} className="px-1.5 text-[20px] leading-none active:scale-90 transition-transform">{emo}</button>
                              ))}
                            </div>
                            <div className="flex items-start pt-1">
                              {/* 짝 답장 — 상대 이모티콘에만. 누르면 입력줄 위에 같은 뜻의 내 캐릭터 이모티콘이 뜬다. */}
                              {!mine && m.sticker && (() => {
                                const pairs = pairCandidates(m.sticker, me);
                                return pairs.length > 0 ? (
                                  <MenuAction onClick={() => { setPairFrom({ id: m.id, items: pairs }); setActionMsg(null); setStickerOpen(false); }}
                                    label="짝 답장" icon={<Sparkles size={16} className="text-[#FB7BA8]" />} />
                                ) : null;
                              })()}
                              <MenuAction onClick={doReply} label="답장" icon={<CornerDownRight size={17} />} />
                              <MenuAction onClick={doStar} label={actionMsg.starred ? '보관됨' : '보관'}
                                icon={actionMsg.starred ? <BookmarkCheck size={17} className="text-[#FB7BA8]" /> : <Bookmark size={17} />} />
                              {m.text && !m.sticker && !m.imageUrl && (
                                <MenuAction onClick={doCopy} label="복사" icon={<Copy size={16} />} />
                              )}
                              {/* 수정 — 내 텍스트 메시지만(상대 글 고치면 안 한 말이 남으니까) */}
                              {m.from === me && m.text && !m.sticker && !m.imageUrl && !m.videoUrl && !m.audioUrl && (
                                <MenuAction onClick={doEdit} label="수정" icon={<Pencil size={15} />} />
                              )}
                              {/* 삭제 — 둘 다 서로 것도 지울 수 있음(Storage 파일도 함께 삭제) */}
                              <MenuAction onClick={doDelete} label="삭제" icon={<Trash2 size={16} />} tone="danger" />
                              <MenuAction onClick={() => setActionMsg(null)} label="닫기" icon={<X size={16} />} tone="faint" />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {!mine && <span className="text-[10px] text-slate-400 mb-0.5">{timeText(m.createdAt)}</span>}
                  </div>
                </div>
              );
            })}

            {partnerTyping && (
              <div className="flex justify-start">
                <div className="text-slate-400 rounded-2xl rounded-bl-md px-4 py-2.5 shadow-sm" style={{ background: 'var(--ct-partner-bg)' }}>
                  <span className="inline-flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}
          </div>


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

          {/* 수정 중 바 — 입력창에 원본이 들어가 있고, 전송하면 그 메시지를 고침 */}
          {editing && (
            <div className="mx-3 mb-1 flex items-center gap-2 rounded-xl bg-[#FB7BA8]/10 px-3 py-2">
              <Pencil size={14} className="shrink-0 text-[#FB7BA8]" />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold text-[#FB7BA8]">메시지 수정 중</div>
                <div className="text-[12px] text-slate-500 truncate">{editing.text}</div>
              </div>
              <button onClick={() => { setEditing(null); setDraft(''); }} aria-label="수정 취소" className="text-slate-400"><X size={16} /></button>
            </div>
          )}

          {/* 답장 인용 바 */}
          {replyTo && (
            <div className="mx-3 mb-1 flex items-center gap-2 rounded-xl bg-black/5 px-3 py-2">
              <div className="w-1 self-stretch rounded-full bg-[#FB7BA8]" />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold text-[#FB7BA8]">{replyTo.from}에게 답장</div>
                <div className="text-[12px] text-slate-500 truncate">{replyTo.text}</div>
              </div>
              <button onClick={() => setReplyTo(null)} aria-label="답장 취소" className="text-slate-400"><X size={16} /></button>
            </div>
          )}

          {/* 입력 */}
          <div className="relative px-3 pt-2 backdrop-blur-xl border-t border-black/[0.04]"
            // 키보드가 떠 있으면 키보드 높이 + 8px만(아래 안전영역 틈은 키보드가 덮으니 뺀다 — 카톡처럼 붙게)
            style={{ paddingBottom: kbInset ? `${kbInset + 8}px` : 'max(env(safe-area-inset-bottom), 1.25rem)', background: 'var(--ct-header)' }}>
            {/* 짝 답장 트레이 — 제미나이 C안 그대로(StickerSuggestTray). 입력바 바로 위에 떠 있다(absolute bottom-full). 탭=미리보기 */}
            <StickerSuggestTray
              items={trayItems}
              reduceMotion={!!reduceMotion}
              onPick={(t) => {
                const it = pairFrom?.items.find((x) => x.image === t.id); if (!it) return;
                recordPick(it); chooseSticker(it.image, it.key, drawerThumb(it.thumb), { mode: it.mode, key: it.key, image: it.image });
              }}
              onClose={() => setPairFrom(null)}
            />
            {/* 업로드 진행 — 동영상은 실제 % 바, 사진은 짧아서 간단한 진행 표시 */}
            <AnimatePresence>
              {uploading && (
                <motion.div
                  initial={{ opacity: 0, y: 8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: 8, height: 0 }}
                  className="mb-2 rounded-2xl bg-white ring-1 ring-black/[0.06] shadow-sm px-3.5 py-2.5 overflow-hidden"
                >
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[12.5px] font-semibold text-slate-600">
                      {uploadKind === 'video' ? '🎬 동영상 올리는 중…' : uploadKind === 'audio' ? '🎤 음성 올리는 중…' : '📷 사진 올리는 중…'}
                    </span>
                    {uploadKind === 'video' && (
                      <span className="text-[12px] font-bold tabular-nums text-[#FB7BA8]">{Math.round(uploadPct * 100)}%</span>
                    )}
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
                    <motion.div
                      className="h-full rounded-full bg-[#FB7BA8]"
                      animate={{ width: uploadKind === 'video' ? `${Math.max(3, uploadPct * 100)}%` : '100%' }}
                      transition={uploadKind === 'video' ? { ease: 'linear', duration: 0.2 } : { duration: 0.9, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {/* 사진 붙여넣기(⌘V) 확인 — 미리보기 + 보낼까요? */}
            <AnimatePresence>
              {pastePreview && (
                <motion.div
                  initial={{ opacity: 0, y: 8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: 8, height: 0 }}
                  className="mb-2 flex items-center gap-2.5 overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.06] shadow-sm px-3 py-2.5"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pastePreview.url} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover ring-1 ring-black/5" />
                  <span className="min-w-0 flex-1 text-[13px] font-semibold text-slate-600">이 사진을 보낼까요?</span>
                  <button onClick={closePaste} disabled={uploading} className="shrink-0 px-2 py-1 text-[13px] font-semibold text-slate-400 active:scale-95 disabled:opacity-50">취소</button>
                  <button onClick={sendPasted} disabled={uploading}
                    className="shrink-0 rounded-full bg-[#FB7BA8] px-3.5 py-1.5 text-[13px] font-bold text-white active:scale-95 disabled:opacity-50">
                    {uploading ? '보내는 중…' : '보내기'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 네이버 가게 링크 → 위시리스트('같이 갈 곳') 담기 — 자동저장 X, 이름은 보낸 말에서 미리 채움 */}
            <AnimatePresence>
              {placePrompt && (
                <motion.div
                  initial={{ opacity: 0, y: 8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: 8, height: 0 }}
                  className="mb-2 overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.06] shadow-sm px-3 py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[17px] leading-none">📍</span>
                    <input
                      value={placePrompt.name}
                      onChange={(e) => setPlacePrompt((p) => (p ? { ...p, name: e.target.value } : p))}
                      placeholder="가게 이름을 적어줘"
                      className="min-w-0 flex-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[13px] font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                    />
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex shrink-0 rounded-full bg-slate-100 p-0.5 text-[12px] font-bold">
                      <button onClick={() => setPlaceCat('food')}
                        className={`rounded-full px-2.5 py-1 transition ${placeCat === 'food' ? 'bg-white text-[#FB7BA8] shadow-sm' : 'text-slate-400'}`}>🍽️ 먹을곳</button>
                      <button onClick={() => setPlaceCat('place')}
                        className={`rounded-full px-2.5 py-1 transition ${placeCat === 'place' ? 'bg-white text-[#FB7BA8] shadow-sm' : 'text-slate-400'}`}>📍 갈곳</button>
                    </div>
                    <span className="min-w-0 flex-1" />
                    <button onClick={() => setPlacePrompt(null)} className="shrink-0 px-2 py-1 text-[13px] font-semibold text-slate-400 active:scale-95">닫기</button>
                    <button onClick={savePlace} disabled={placeSaving || !placePrompt.name.trim()}
                      className="shrink-0 rounded-full bg-[#FB7BA8] px-3.5 py-1.5 text-[13px] font-bold text-white active:scale-95 disabled:opacity-50">
                      {placeSaving ? '담는 중…' : '담기'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 링크 저장 프롬프트 — 링크 보내면 "이거봐봐에 저장할까요?" */}
            <AnimatePresence>
              {linkPrompt && (
                <motion.div
                  initial={{ opacity: 0, y: 8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: 8, height: 0 }}
                  className="mb-2 flex items-center gap-2 overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.06] shadow-sm px-3 py-2"
                >
                  <span className="text-[17px] leading-none">🔖</span>
                  <span className="flex-1 min-w-0 truncate text-[13px] font-semibold text-slate-600">공유 리스트에 저장할까요?</span>
                  <button onClick={() => setLinkPrompt(null)} className="shrink-0 px-2 py-1 text-[13px] font-semibold text-slate-400 active:scale-95">닫기</button>
                  <button onClick={saveCurrentLink} disabled={linkSaving}
                    className="shrink-0 rounded-full bg-[#FB7BA8] px-3.5 py-1.5 text-[13px] font-bold text-white active:scale-95 disabled:opacity-50">
                    {linkSaving ? '저장 중…' : '저장'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ＋ 첨부 패널 — 사진·음성·타임캡슐. ⚠️ 파일 input은 이 패널이 아니라 아래 입력줄(pill) 안에 둔다.
                패널 버튼이 닫힌 직후 .click() 하는데, input이 패널 안이면 화면에서 사라져 사진을 골라도
                change를 받을 자리가 없어 '조용히' 안 올라간다(사이담 교훈). */}
            <AnimatePresence>
              {attachOpen && !recording && (
                <motion.div
                  initial={{ opacity: 0, y: 8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: 8, height: 0 }}
                  className="mb-2 flex items-center gap-2 overflow-hidden"
                >
                  <button onClick={() => { setAttachOpen(false); fileRef.current?.click(); }} disabled={uploading}
                    className="flex items-center gap-1.5 rounded-full bg-white ring-1 ring-black/[0.06] shadow-sm px-3.5 py-2 text-[13px] font-bold text-slate-600 active:scale-95 disabled:opacity-40 transition">
                    <ImagePlus size={17} className="text-[#FB7BA8]" /> 사진·동영상
                  </button>
                  <button onClick={() => { setAttachOpen(false); startRec(); }} disabled={uploading}
                    className="flex items-center gap-1.5 rounded-full bg-white ring-1 ring-black/[0.06] shadow-sm px-3.5 py-2 text-[13px] font-bold text-slate-600 active:scale-95 disabled:opacity-40 transition">
                    <Mic size={16} className="text-[#FB7BA8]" /> 음성
                  </button>
                  <button onClick={() => { setAttachOpen(false); openCapsule(); }}
                    className="flex items-center gap-1.5 rounded-full bg-white ring-1 ring-black/[0.06] shadow-sm px-3.5 py-2 text-[13px] font-bold text-slate-600 active:scale-95 transition">
                    <Hourglass size={16} className="text-[#FB7BA8]" /> 타임캡슐
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {recording ? (
              <div className="flex items-center gap-3 h-11 px-2">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <span className="flex-1 text-[15px] font-semibold text-slate-600">{fmtDur(recSec)} · 녹음 중…</span>
                <button onClick={() => stopRec(false)} className="text-slate-400 font-semibold px-2 active:scale-95">취소</button>
                <button onClick={() => stopRec(true)} aria-label="음성 전송"
                  className="shrink-0 w-11 h-11 rounded-full bg-[#FB7BA8] text-white flex items-center justify-center shadow-[0_4px_14px_rgba(251,123,168,0.35)] active:scale-90 transition">
                  <Send size={18} />
                </button>
              </div>
            ) : (
              // 입력줄 = 하나의 둥근 알약(사이담 참고). 버튼은 알약 안에 얹혀 입력칸이 넓게 숨쉰다.
              <div ref={pillRef} className="flex items-end gap-1 rounded-[26px] p-1.5 ring-1 ring-black/[0.06] shadow-sm transition focus-within:ring-2 focus-within:ring-[#FB7BA8]/35"
                style={{ background: 'var(--ct-chip)' }}>
                <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={onFile} />
                {/* 왼쪽 ＋ — 사진·음성·타임캡슐 접기(카톡식). 이모티콘은 오른쪽으로 옮겨 입력칸을 넓혔다. */}
                <button onClick={() => { setAttachOpen((v) => !v); setStickerOpen(false); }} aria-label="첨부"
                  className="grid h-10 w-10 shrink-0 self-end place-items-center rounded-full active:scale-90 transition"
                  style={{ color: attachOpen ? '#FB7BA8' : 'var(--ct-chip-icon)' }}>
                  {/* 열리면 ×로 돌아 '다시 누르면 닫힌다'가 보이게(Aside 1부) */}
                  <Plus size={22} className={`transition-transform duration-200 ${attachOpen ? 'rotate-45' : ''}`} />
                </button>
                {/* ⚠️ 모바일(터치)에선 Enter = 줄바꿈. 폰 키보드엔 Shift+Enter가 없어 Enter를 전송에 쓰면
                    줄바꿈이 불가능하다 → 전송은 오른쪽 보내기 버튼으로. 데스크톱(정밀 포인터)만 Enter로 전송.
                    e.nativeEvent.isComposing — 한글 조합 중 Enter로 조합 확정할 때 오전송 방지. */}
                {/* onFocus — 입력칸을 누르면 이모티콘 서랍을 닫고 키보드로(카톡 방식). 전엔 서랍이 열린 채로 남아
                    메시지 영역이 반 넘게 가려졌다(Aside 1부: 703→336px). */}
                {/* 자동 높이 = grid 겹치기: 안 보이는 '그림자 글'(같은 글씨·여백)이 칸 높이를 정하고 textarea는 그 칸을 채운다.
                    JS가 높이를 건드리지 않아 칸이 접혔다 펴지는 일이 없다 → 아이폰 캐럿이 엉뚱한 줄에 남지 않는다. 최대 132px 넘으면 속스크롤. */}
                <div className="grid min-w-0 flex-1">
                <div aria-hidden className="invisible col-start-1 row-start-1 max-h-[132px] overflow-hidden whitespace-pre-wrap break-words px-1.5 py-2.5 text-[15px] leading-snug">{draft + ' '}</div>
                <textarea ref={taRef} value={draft} onChange={onInput} onBlur={stopTyping} onPaste={onPaste}
                  onFocus={() => setStickerOpen(false)}
                  onKeyDown={(e) => {
                    const coarse = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
                    if (e.key === 'Enter' && !e.shiftKey && !coarse && !e.nativeEvent.isComposing) { e.preventDefault(); send(); }
                  }}
                  rows={1} placeholder={uploading ? '올리는 중…' : `${partner}에게 할 말…`}
                  style={{ background: 'transparent', color: 'var(--ct-chip-text)' }}
                  className="col-start-1 row-start-1 h-full min-w-0 resize-none overflow-y-auto break-words px-1.5 py-2.5 text-[15px] leading-snug outline-none max-h-[132px]" />
                </div>
                {/* 오른쪽 — 이모티콘 + (글이 있으면) 보내기. 음성·타임캡슐은 ＋로 옮겼다. */}
                <div className="flex shrink-0 items-center gap-0.5 self-end">
                  {/* 서랍이 열리면 ⌨로 바뀐다 — 누르면 서랍 닫고 바로 입력칸으로(카톡 방식).
                      서랍을 열 땐 키보드를 내린다: 폰에서 키보드와 서랍이 같이 뜨면 메시지가 거의 안 보인다. */}
                  {/* 카톡식 — 마지막 단어에 맞는 이모티콘이 있으면 이 단추가 그 그림(작게)으로 바뀐다. 누르면 그 단어로 찾은 서랍. */}
                  <button onClick={() => {
                      if (stickerOpen) { setStickerOpen(false); taRef.current?.focus(); }
                      else if (kwThumb) openKeywordSearch();
                      else { setKwWord(null); setStickerOpen(true); setAttachOpen(false); taRef.current?.blur(); }
                    }}
                    aria-label={stickerOpen ? '키보드로' : kwThumb ? `「${lastWord}」 이모티콘 찾기` : '이모티콘'}
                    title={stickerOpen ? '키보드로' : kwThumb ? `「${lastWord}」 이모티콘` : '이모티콘'}
                    className="grid h-10 w-10 place-items-center rounded-full active:scale-90 transition"
                    style={{ color: stickerOpen ? '#FB7BA8' : 'var(--ct-chip-icon)' }}>
                    {stickerOpen ? <Keyboard size={21} />
                      : kwThumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <motion.img key={kwThumb} src={kwThumb} alt="" draggable={false} className="h-9 w-9 object-contain"
                          initial={reduceMotion ? false : { scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 520, damping: 22 }} />
                      ) : <Smile size={21} />}
                  </button>
                  {(draft.trim() || pendingSticker) && (
                    // onPointerDown preventDefault — 버튼이 입력창 포커스를 뺏지 않게(연속 전송 시 자판 유지)
                    <button onClick={send} onPointerDown={(e) => e.preventDefault()} aria-label="보내기"
                      className="grid h-10 w-10 place-items-center rounded-full bg-[#FB7BA8] text-white shadow-[0_4px_14px_rgba(251,123,168,0.35)] active:scale-90 transition">
                      <Send size={18} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          </div>{/* 아래 묶음 끝 */}

          {/* 타임캡슐 작성 */}
          <AnimatePresence>
            {capsuleOpen && (
              <motion.div className="absolute inset-0 z-[67] flex items-end justify-center bg-black/25"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCapsuleOpen(false)}>
                <motion.div className="w-full max-w-md rounded-t-3xl bg-white p-5 pb-8 shadow-xl"
                  initial={{ y: 280 }} animate={{ y: 0 }} exit={{ y: 280 }} transition={{ type: 'spring', stiffness: 340, damping: 32 }}
                  onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2 mb-1">
                    <Hourglass size={18} className="text-[#FB7BA8]" />
                    <span className="text-base font-extrabold text-slate-700">타임캡슐</span>
                  </div>
                  <p className="text-[13px] text-slate-500 mb-3">이 메시지가 <b>고른 날짜에 도착</b>해. 미래의 나한테서 오는 편지 ⏳</p>
                  <div className="rounded-xl bg-black/5 px-3 py-2 text-[14px] text-slate-600 mb-3 line-clamp-2 break-keep">{draft.trim()}</div>
                  <div className="flex gap-1.5 mb-3">
                    <button onClick={() => setCapsulePreset(7)} className="flex-1 py-1.5 rounded-full bg-black/5 text-[12px] font-bold text-slate-600 active:bg-black/10">1주일 뒤</button>
                    <button onClick={() => setCapsulePreset(100)} className="flex-1 py-1.5 rounded-full bg-black/5 text-[12px] font-bold text-slate-600 active:bg-black/10">100일 뒤</button>
                    <button onClick={() => setCapsulePreset(365)} className="flex-1 py-1.5 rounded-full bg-black/5 text-[12px] font-bold text-slate-600 active:bg-black/10">1년 뒤</button>
                  </div>
                  <input type="datetime-local" value={capsuleDate} onChange={(e) => setCapsuleDate(e.target.value)}
                    className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-[15px] text-slate-700 mb-4" />
                  <div className="flex gap-2">
                    <button onClick={() => setCapsuleOpen(false)} className="flex-1 py-3 rounded-2xl bg-black/5 font-bold text-slate-500 active:scale-95">취소</button>
                    <button onClick={sendCapsuleNow} className="flex-1 py-3 rounded-2xl bg-[#FB7BA8] font-bold text-white active:scale-95">예약하기 ⏳</button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 토스트 */}
          <AnimatePresence>
            {toast && (
              // 가운데 정렬은 inset-x-0+mx-auto(w-fit) — translate 클래스는 motion의 y 변형에 덮여 한쪽으로 쏠린다. 긴 안내는 줄바꿈.
              <motion.div className="absolute inset-x-0 mx-auto w-fit max-w-[calc(100%-2rem)] bottom-28 z-[75] px-4 py-2.5 rounded-2xl bg-slate-800 text-center text-white text-[13px] font-semibold leading-snug shadow-lg"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                {toast}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 메시지 효과 (사랑해/축하/ㅋㅋㅋ 등) */}
          <ChatEffectLayer effect={effect} />

          {/* (액션 시트 → 사이담식 인라인 줄로 교체됨: 말풍선 아래에 렌더) */}

          {/* 추억 보관함 */}
          <AnimatePresence>
            {memoryOpen && (
              <motion.div className="absolute inset-0 z-[66] flex flex-col bg-[#FBF8F2] dark:bg-[#272522] bg-[radial-gradient(#e5e7eb_1.5px,transparent_1.5px)] [background-size:20px_20px] dark:bg-[radial-gradient(#374151_1.5px,transparent_1.5px)]"
                initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
                transition={{ type: 'spring', stiffness: 320, damping: 32 }}>
                <div className="flex items-center gap-3 px-4 pb-3 bg-[#FBF8F2]/95 backdrop-blur-xl border-b border-black/[0.04] shadow-[0_4px_16px_rgba(0,0,0,0.04)]"
                  style={{ paddingTop: 'max(env(safe-area-inset-top), 2.75rem)' }}>
                  <button onClick={() => setMemoryOpen(false)} aria-label="추억함 닫기" title="닫기" className="grid h-10 w-10 -ml-2 place-items-center rounded-full text-slate-400 active:scale-90 transition"><X size={22} /></button>
                  <div className="flex-1 font-['Dongle'] text-3xl font-bold leading-none text-[#334155] dark:text-[#E8E2D8]">우리의 추억함</div>
                </div>
                <div className="flex gap-1.5 px-4 py-2">
                  <button onClick={() => setMemoryTab('star')} className={`px-3.5 py-1.5 rounded-full text-[13px] font-bold ${memoryTab === 'star' ? 'bg-[#FB7BA8] text-white' : 'bg-black/5 text-slate-500'}`}>⭐️ 별표</button>
                  <button onClick={() => setMemoryTab('photo')} className={`px-3.5 py-1.5 rounded-full text-[13px] font-bold ${memoryTab === 'photo' ? 'bg-[#FB7BA8] text-white' : 'bg-black/5 text-slate-500'}`}>📷 사진</button>
                  <button onClick={() => setMemoryTab('link')} className={`px-3.5 py-1.5 rounded-full text-[13px] font-bold ${memoryTab === 'link' ? 'bg-[#FB7BA8] text-white' : 'bg-black/5 text-slate-500'}`}>🔖 공유 리스트</button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 pb-8">
                  {memoryTab === 'link' ? (
                    (() => {
                      if (links === null) return <div className="h-40 flex items-center justify-center text-slate-400 text-sm">불러오는 중…</div>;
                      if (!links.length) return <div className="h-40 flex flex-col items-center justify-center text-slate-400 gap-2"><span className="text-3xl">🔖</span><p className="text-sm font-semibold">링크 보내고 &quot;공유 리스트&quot;에 저장</p></div>;
                      return (
                        <div className="space-y-2 pt-1">
                          {links.map((lk) => (
                            <a key={lk.id} href={lk.url} target="_blank" rel="noopener noreferrer"
                              className="flex gap-3 items-center p-2.5 rounded-2xl bg-white shadow-sm active:scale-[0.99] transition">
                              {lk.preview?.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={lk.preview.image} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover bg-black/5" />
                              ) : (
                                <div className="h-14 w-20 shrink-0 rounded-lg bg-[#FB7BA8]/10 flex items-center justify-center text-2xl">🔗</div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-[13.5px] font-bold text-slate-700 break-keep"
                                  style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                  {lk.preview?.title || lk.url}
                                </div>
                                <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                                  <span className="truncate">{lk.preview?.siteName || '링크'}</span>
                                  <span>·</span>
                                  <span className="shrink-0">{lk.by}</span>
                                </div>
                              </div>
                              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (isPractice()) { practiceBlocked('링크 삭제'); return; } deleteShare(lk.id); }}
                                aria-label="삭제" className="shrink-0 p-1.5 text-slate-300 active:text-slate-500"><Trash2 size={15} /></button>
                            </a>
                          ))}
                        </div>
                      );
                    })()
                  ) : memories === null ? (
                    <div className="h-40 flex items-center justify-center text-slate-400 text-sm">불러오는 중…</div>
                  ) : memoryTab === 'star' ? (
                    (() => {
                      const starred = memories.filter((m) => m.starred && !m.deleted);
                      if (!starred.length) return <div className="h-40 flex flex-col items-center justify-center text-slate-400 gap-2"><span className="text-3xl">⭐️</span><p className="text-sm font-semibold">메시지 길게 눌러 &quot;추억 보관&quot;</p></div>;
                      return (
                        <div className="space-y-2 pt-1">
                          {starred.map((m) => (
                            <div key={m.id} className="flex gap-2.5 items-start p-2.5 rounded-2xl bg-white shadow-sm">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={avatarOf(m.from)} alt={m.from} className="w-7 h-7 rounded-full object-cover shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-[11px] font-bold text-slate-400">{m.from} · {dayText(m.createdAt)}</div>
                                {m.sticker ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={m.sticker} alt="" className="w-16 h-16 object-contain mt-1" />
                                ) : m.imageUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={m.imageUrl} alt="" onClick={() => setViewerImage(m.imageUrl!)} className="max-w-[60%] rounded-xl mt-1 cursor-pointer" />
                                ) : m.audioUrl ? (
                                  <div className="text-[14px] text-slate-600 mt-0.5">🎤 음성 메시지</div>
                                ) : (
                                  <div className="text-[14px] text-slate-700 mt-0.5 break-keep">{renderRich(m.text, m.from)}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()
                  ) : (
                    (() => {
                      const photos = memories.filter((m) => m.imageUrl && !m.deleted);
                      if (!photos.length) return <div className="h-40 flex flex-col items-center justify-center text-slate-400 gap-2"><span className="text-3xl">📷</span><p className="text-sm font-semibold">주고받은 사진이 여기 모여</p></div>;
                      return (
                        <div className="grid grid-cols-3 gap-1 pt-1">
                          {photos.map((m) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={m.id} src={m.imageUrl} alt="" onClick={() => setViewerImage(m.imageUrl!)} className="aspect-square w-full object-cover rounded-lg cursor-pointer" />
                          ))}
                        </div>
                      );
                    })()
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 사진 풀스크린 뷰어 */}
          <AnimatePresence>
            {viewerImage && (
              <motion.div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/90"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewerImage(null)}>
                <button
                  onClick={(e) => { e.stopPropagation(); handleSave(viewerImage!, 'image'); }}
                  aria-label="사진 원본 저장"
                  className="absolute top-12 left-4 flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-2 text-[13px] font-semibold text-white backdrop-blur-sm transition-transform active:scale-95"
                >
                  {savingUrl === viewerImage ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} strokeWidth={2.2} />}
                  저장
                </button>
                <button onClick={() => setViewerImage(null)} aria-label="닫기" className="absolute top-12 right-4 text-white/80 p-2"><X size={26} /></button>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={viewerImage} alt="사진" className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
