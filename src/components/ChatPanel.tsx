'use client';

import React, { useEffect, useLayoutEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, ImagePlus, Smile, Reply, Copy, Trash2, Pencil, Mic, Play, Pause, Bookmark, BookmarkCheck, Hourglass, Download, Loader2, Palette, Check } from 'lucide-react';
import { saveMedia } from '@/lib/saveMedia';
import { saveLink, deleteLink, subscribeLinks, firstUrl, youTubeId, type SavedLink } from '@/lib/links';
import {
  type ChatMessage, type ReplyRef,
  subscribeTyping, setTyping, markRead, subscribeRead, uploadChatImage, uploadChatAudio, uploadChatVideo,
  toggleReaction, deleteMessage, editMessage, toggleStar, fetchRecentMessages,
} from '@/lib/chat';
import { MOOD_OPTIONS } from '@/lib/moods';
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
  onSend: (text: string, imageUrl?: string, sticker?: string, replyTo?: ReplyRef, audio?: { url: string; dur: number }, video?: { url: string; dur?: number }) => void;
  partnerOnline: boolean;
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
const drawerThumb = (src: string) => src.includes('/emo/sai-anim/') ? src.replace(/\.webp$/, '-still.png') : src;
// (단어) 매칭 정규식(STICKER_ALT/RICH_RE/STICKER_RE)은 꼼이미니(SAIDAMI) 단어까지 합쳐야 해서
// SAIDAMI_STICKERS 정의 뒤(아래)에서 만든다.
// 스티커 포켓 그리드 — 텍스트 스티커들을 탭해서 큰 단독 스티커로 전송(투명 배경, 말풍선 없음).
const POCKET_STICKERS = Object.entries(TEXT_STICKERS).map(([word, image]) => ({ word, image }));
// Dang's 탭 — 단독 스티커(탭해서 크게 전송). 추가하려면 여기 { word, image } 한 줄.
// 꼼이(별) 탭 — 움직이는 이모티콘 모음(사이담 제작, 투명 배경 애니 webp). 서랍의 첫 탭.
// ⚠️ 서랍(피커)엔 정지컷(-still.png)만 띄우고, 보낼 때/채팅에선 webp가 재생된다.
//    6개 움짤을 서랍에서 동시에 디코딩하면 저사양 기기가 버벅여서(사이담 경고).
const ANIM_STICKERS: { word: string; image: string; still: string }[] = [
  { word: '안녕!',     image: '/emo/sai-anim/hi.webp',      still: '/emo/sai-anim/hi-still.png' },
  { word: '좋은 아침',  image: '/emo/sai-anim/sunrise.webp', still: '/emo/sai-anim/sunrise-still.png' },
  { word: '두근두근',   image: '/emo/sai-anim/doki.webp',    still: '/emo/sai-anim/doki-still.png' },
  { word: '사랑해',     image: '/emo/sai-anim/love.webp',    still: '/emo/sai-anim/love-still.png' },
  { word: '보고싶어',   image: '/emo/sai-anim/missyou.webp', still: '/emo/sai-anim/missyou-still.png' },
  { word: '고마워',     image: '/emo/sai-anim/thanks.webp',  still: '/emo/sai-anim/thanks-still.png' },
  { word: '삐짐',       image: '/emo/sai-anim/sulk.webp',    still: '/emo/sai-anim/sulk-still.png' },
  { word: '흥!',        image: '/emo/sai-anim/wave.webp?v=2',    still: '/emo/sai-anim/wave-still.png?v=2' },
  { word: '미안해',     image: '/emo/sai-anim/sorry.webp',   still: '/emo/sai-anim/sorry-still.png' },
  { word: '잘자',       image: '/emo/sai-anim/night.webp',   still: '/emo/sai-anim/night-still.png' },
  { word: '씻고 올게',  image: '/emo/sai-anim/bath.webp?v=2',    still: '/emo/sai-anim/bath-still.png?v=2' },
  { word: '아파',       image: '/emo/sai-anim/sick.webp',    still: '/emo/sai-anim/sick-still.png' },
  { word: '좋아!',      image: '/emo/sai-anim/yay.webp',     still: '/emo/sai-anim/yay-still.png' },
  { word: '으악',       image: '/emo/sai-anim/yell.webp',    still: '/emo/sai-anim/yell-still.png' },
  { word: '축하해!',    image: '/emo/sai-anim/party.webp',   still: '/emo/sai-anim/party-still.png' },
  { word: '선물',       image: '/emo/sai-anim/gift.webp',    still: '/emo/sai-anim/gift-still.png' },
];

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
];

// 꼼이미니 = 카톡식 (단어) 인라인 미니(32px). 라벨→이미지 룩업.
// 겹치는 단어(사랑해·보고파·하트는 커플 스티커에도 있음)는 꼼이미니(말티푸)가 렌더 우선.
// 커플 스티커는 '커플' 탭 탭전송(단독 스티커)으로 그대로 살아있어 손실 없음.
const MINI_BY_WORD: Record<string, string> = Object.fromEntries(SAIDAMI_STICKERS.map((s) => [s.word, s.image]));
// (단어) 매칭 = 꼼이미니 단어 + 커플 텍스트스티커(중복 제거). 손으로 쳐도 그림이 된다.
const STICKER_ALT = [...new Set([...SAIDAMI_STICKERS.map((s) => s.word), ...Object.keys(TEXT_STICKERS)])].join('|');
// [[e:id]] 포차코 미니 OR (단어) 스티커 둘 다 매칭
const RICH_RE = new RegExp(`\\[\\[e:([a-z]+)\\]\\]|\\((${STICKER_ALT})\\)`, 'g');
const STICKER_RE = new RegExp(`\\((${STICKER_ALT})\\)`, 'g');

// 이모티콘 서랍 탭 — 사이챗과 동일 구조(썸네일 + 이름). id/데이터는 꼼모닝 것.
// 카톡식 탭 — 최근·자주(🕒) + 세트별 탭. 아이콘은 '실제 스티커 대표 그림'(썸네일)이라
//   어떤 세트인지 한눈에 보인다(윈도우 이모지 X). 포차코는 한 탭에 몰지 않고 기본/우댕/꼼이/커플로 분리.
type StickerMode = 'recent' | 'gif' | 'maltipoo' | 'basic' | 'dang' | 'kkom' | 'couple' | 'mini';
const STICKER_TABS: { id: StickerMode; name: string; thumb?: string; icon?: string }[] = [
  { id: 'recent',   name: '최근·자주', icon: '🕒' },
  { id: 'gif',      name: '움짤',      thumb: '/emo/sai-anim/love-still.png' },
  { id: 'maltipoo', name: '말티푸',    thumb: '/emo/sai/kkk.webp' },
  { id: 'basic',    name: '기본',      thumb: '/pochacco/face_happy.png' },
  { id: 'dang',     name: '우댕',      thumb: '/pochacco_dang/cutekkomi.png' },
  { id: 'kkom',     name: '꼼이',      thumb: '/pochacco_kkom/kkomiyap.png' },
  { id: 'couple',   name: '커플',      thumb: '/pochacco_couple/love.png' },
  { id: 'mini',     name: '미니',      thumb: '/emo/saidami/love.webp' },
];

// 최근·자주 쓴 이모티콘(기기별 localStorage). pick 할 때마다 기록.
type EmoPick = { mode: StickerMode; key: string; image: string };
const emoId = (p: { mode: StickerMode; key: string }) => `${p.mode}:${p.key}`;

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
function renderRich(text: string): React.ReactNode {
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
      // 꼼이미니(말티푸) 먼저 — 32px 인라인, 폭 자동, 말풍선 없음(사이담 스펙)
      const miniSrc = MINI_BY_WORD[m![2]];
      if (miniSrc) {
        // eslint-disable-next-line @next/next/no-img-element
        parts.push(<img key={i++} src={miniSrc} alt={m![2]} className="inline-block h-9 w-auto align-text-bottom object-contain mx-[2px]" />);
        last = m.index + m[0].length;
        continue;
      }
      const src = TEXT_STICKERS[m![2]];
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

// 채팅 속 링크 인라인 미리보기 카드 — 유튜브 등. og-preview 결과를 모듈 캐시에 담아 재스크롤 시 재요청 X.
const ogCache = new Map<string, { title?: string; image?: string; site?: string }>();
function LinkPreview({ url, mine }: { url: string; mine: boolean }) {
  const ytId = youTubeId(url);
  const host = (() => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; } })();
  const [meta, setMeta] = useState<{ title?: string; image?: string; site?: string }>(() =>
    ogCache.get(url) ?? (ytId ? { image: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`, site: 'YouTube' } : {}));
  useEffect(() => {
    if (ogCache.has(url)) { setMeta(ogCache.get(url)!); return; }
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
    })();
    return () => { alive = false; };
  }, [url, ytId, host]);

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
      className={`block w-[248px] max-w-full overflow-hidden rounded-2xl border shadow-sm active:scale-[0.99] transition ${mine ? 'border-black/5 bg-white' : 'border-black/5 bg-white dark:bg-[#332F2A] dark:border-white/10'}`}>
      {meta.image && (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={meta.image} alt="" className="aspect-video w-full object-cover bg-black/5" />
          {ytId && (
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-black/55"><Play size={18} fill="white" className="ml-0.5 text-white" /></span>
            </span>
          )}
        </div>
      )}
      <div className="px-3 py-2">
        <div className="text-[13px] font-bold text-slate-800 dark:text-[#E8E2D8] break-keep"
          style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {meta.title || url}
        </div>
        <div className="mt-0.5 truncate text-[11px] text-slate-400">{meta.site || host}</div>
      </div>
    </a>
  );
}

export function preview(m: ChatMessage): string {
  if (m.sticker) return '이모티콘';
  if (m.videoUrl) return '동영상';
  if (m.imageUrl) return '사진';
  if (m.audioUrl) return '음성 메시지';
  // 링크는 주소 그대로 노출하지 않고 종류 라벨로 — 홈 꼼톡 미리보기/답장 미리보기 공통.
  const url = firstUrl(m.text);
  if (url) {
    const tag = youTubeId(url) ? '▶️ 유튜브 영상' : '🔗 링크';
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

export default function ChatPanel({ me, partner, messages, open, onClose, onSend, partnerOnline, onLoadMore, hasMore, onSendCapsule }: Props) {
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
    '--ct-my-btn': hexA(tc.myText, 0.16), '--ct-my-bar-off': hexA(tc.myText, 0.4),
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
  const [stickerMode, setStickerMode] = useState<StickerMode>('recent');
  // 최근·자주 쓴 이모티콘(기기별). 첫 탭이 이걸 보여주고, pick 할 때마다 기록된다.
  const [recentPicks, setRecentPicks] = useState<EmoPick[]>([]);
  const [freqPicks, setFreqPicks] = useState<Record<string, EmoPick & { count: number }>>({});
  useEffect(() => {
    if (!me) return;
    try {
      const r = JSON.parse(localStorage.getItem(`kkom-emo-recent-${me}`) || '[]');
      const f = JSON.parse(localStorage.getItem(`kkom-emo-freq-${me}`) || '{}');
      if (Array.isArray(r)) setRecentPicks(r);
      if (f && typeof f === 'object') setFreqPicks(f);
      // 기록이 아예 없으면(첫 사용) 빈 '최근' 대신 포차코 탭으로 시작한다.
      if ((!Array.isArray(r) || r.length === 0) && (!f || Object.keys(f).length === 0)) setStickerMode('basic');
    } catch { setStickerMode('basic'); }
  }, [me]);
  const recordPick = (p: EmoPick) => {
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
  const frequentList = Object.values(freqPicks).sort((a, b) => b.count - a.count).slice(0, 8);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [partnerLastRead, setPartnerLastRead] = useState<Date | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadKind, setUploadKind] = useState<'image' | 'video' | null>(null);
  const [uploadPct, setUploadPct] = useState(0); // 0~1 (동영상 업로드 진행률)
  const [actionMsg, setActionMsg] = useState<ChatMessage | null>(null);
  const [replyTo, setReplyTo] = useState<ReplyRef | null>(null);
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);  // 내 메시지 수정 중
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
  const [links, setLinks] = useState<SavedLink[] | null>(null);
  const [linkPrompt, setLinkPrompt] = useState<string | null>(null);
  const [linkSaving, setLinkSaving] = useState(false);
  const [memories, setMemories] = useState<ChatMessage[] | null>(null);
  const [capsuleOpen, setCapsuleOpen] = useState(false);
  const [capsuleDate, setCapsuleDate] = useState('');
  const [toast, setToast] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
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

  const onScroll = () => {
    const el = scrollRef.current;
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
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
    setTyping(meKey, true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setTyping(meKey, false), 2500);
  };

  const send = () => {
    const t = draft.trim();
    if (!t) return;
    // 수정 중이면 새로 보내는 대신 원본을 고친다.
    if (editing) {
      editMessage(editing.id, t);
      setEditing(null); setDraft(''); stopTyping();
      if (taRef.current) taRef.current.style.height = 'auto';
      return;
    }
    onSend(t, undefined, undefined, replyTo ?? undefined);
    setDraft(''); setReplyTo(null); stopTyping();
    if (taRef.current) { taRef.current.style.height = 'auto'; taRef.current.focus(); }  // 연속 전송 — 자판 유지
    // 링크가 들어있으면 "이거봐봐에 저장할까요?" 물어보기
    const url = firstUrl(t);
    if (url) setLinkPrompt(url);
  };

  // "이거봐봐" 링크 구독 — 탭 열자마자 바로 보이게 상시 구독(≤100건).
  useEffect(() => subscribeLinks(setLinks), []);
  const saveCurrentLink = async () => {
    if (!linkPrompt || linkSaving) return;
    setLinkSaving(true);
    try { await saveLink(linkPrompt, me); flashToast('이거봐봐에 저장했어 🔖'); }
    catch { flashToast('저장 실패 — 다시 시도해줘'); }
    setLinkSaving(false); setLinkPrompt(null);
  };

  // ── 타임캡슐 ──
  const toLocalInput = (d: Date) => {
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  };
  const flashToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2400); };
  const openCapsule = () => {
    if (!draft.trim()) { flashToast('먼저 메시지를 써줘 ✍️'); return; }
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
    if (taRef.current) taRef.current.style.height = 'auto';
    flashToast(`타임캡슐 예약됨 ⏳ ${when.getFullYear()}.${when.getMonth() + 1}.${when.getDate()} 도착`);
  };

  // 텍스트 미니 — 커서 위치에 카톡식 (단어) 삽입 (피커 열린 채 여러 개 가능). 렌더 시 32px 그림.
  const insertParen = (word: string) => {
    const token = `(${word})`;
    const ta = taRef.current;
    const start = ta?.selectionStart ?? draft.length;
    const end = ta?.selectionEnd ?? start;
    const next = draft.slice(0, start) + token + draft.slice(end);
    setDraft(next);
    requestAnimationFrame(() => {
      if (ta) { ta.focus(); const pos = start + token.length; ta.setSelectionRange(pos, pos); }
    });
  };

  // 이모티콘 서랍 — 현재 탭의 섹션 목록. 대부분 섹션 하나(label 없음)지만, '포차코'는 여러 섹션(sticky header)으로.
  //   서랍엔 정지컷(thumb 있으면), 전송·채팅엔 image(움짤 webp 포함). label 있으면 소제목이 걸린다.
  type SItem = { key: string; image: string; video?: boolean; thumb?: string };
  const stickerSections = (mode: StickerMode): { label?: string; items: SItem[] }[] => {
    switch (mode) {
      case 'gif': return [{ items: ANIM_STICKERS.map((s) => ({ key: s.word, image: s.image, thumb: s.still })) }];
      case 'maltipoo': return [{ items: SAI_STICKERS.map((s) => ({ key: s.word, image: s.image })) }];
      case 'mini': return [{ items: SAIDAMI_STICKERS.map((s) => ({ key: s.word, image: s.image })) }];
      case 'basic': return [{ items: MOOD_OPTIONS.map((o) => ({ key: o.id, image: o.image })) }];
      case 'dang': return [{ items: DANG_STICKERS.map((s) => ({ key: s.word, image: s.image })) }];
      case 'kkom': return [{ items: KKOM_STICKERS.map((s) => ({ key: s.word, image: s.image })) }];
      case 'couple': return [{ items: POCKET_STICKERS.map((s) => ({ key: s.word, image: s.image, video: isVideoSrc(s.image) })) }];
      default: return [];
    }
  };
  const pickSticker = (mode: StickerMode, key: string, image: string) => {
    recordPick({ mode, key, image });                      // 최근·자주 기록(원래 mode로)
    if (mode === 'mini') { insertParen(key); return; }     // (단어) 인라인 미니
    onSend('', undefined, image, replyTo ?? undefined);    // 나머지: 단독 스티커 전송
    setReplyTo(null); setStickerOpen(false);
  };

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
    setUploading(true);
    try {
      const url = await uploadChatAudio(blob);
      onSend('', undefined, undefined, replyTo ?? undefined, { url, dur });
      setReplyTo(null);
    } catch { /* 무시 */ }
    setUploading(false);
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
    setMemoryOpen(true);
    setMemories(null);
    try { setMemories(await fetchRecentMessages(300)); } catch { setMemories([]); }
  };
  const doStar = () => { if (actionMsg) toggleStar(actionMsg.id); setActionMsg(null); };

  const doReact = (emoji: string) => { if (actionMsg) toggleReaction(actionMsg.id, meKey, emoji); setActionMsg(null); };
  const doReply = () => { if (actionMsg) setReplyTo({ id: actionMsg.id, from: actionMsg.from, text: preview(actionMsg) }); setActionMsg(null); taRef.current?.focus(); };
  const doCopy = () => { if (actionMsg?.text) navigator.clipboard?.writeText(actionMsg.text).catch(() => {}); setActionMsg(null); };
  const doDelete = () => { if (actionMsg) deleteMessage(actionMsg.id); setActionMsg(null); };
  // 수정 — 내 텍스트 메시지만. 입력창에 본문을 넣고 '수정 중' 상태로. 전송하면 editMessage로 감.
  const doEdit = () => { if (actionMsg?.text) { setEditing({ id: actionMsg.id, text: actionMsg.text }); setReplyTo(null); setDraft(actionMsg.text); } setActionMsg(null); taRef.current?.focus(); };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex flex-col"
          style={chatThemeStyle}
          initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 380, damping: 40 }}
          drag={(memoryOpen || viewerImage || actionMsg || capsuleOpen || stickerOpen) ? false : 'x'}
          dragDirectionLock
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={{ left: 0, right: 0.9 }}
          onDragEnd={(_e, info) => { if (info.offset.x > 110 || info.velocity.x > 550) onClose(); }}
        >
          {/* 헤더 — 불투명 + 상단 safe-area까지 덮어 뒤 배경 비침 방지 */}
          <div className="flex items-center gap-3 px-4 pb-3 backdrop-blur-xl border-b border-black/[0.04] shadow-[0_4px_16px_rgba(0,0,0,0.04)]"
            style={{ paddingTop: 'max(env(safe-area-inset-top), 2.75rem)', background: 'var(--ct-header)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarOf(partner)} alt={partner} className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-sm" />
            <div className="flex-1">
              <div className="text-base font-extrabold" style={{ color: 'var(--ct-chip-text)' }}>{partner}</div>
              <div className={`text-xs font-bold ${partnerTyping ? 'text-[#FB7BA8]' : partnerOnline ? 'text-emerald-500' : 'text-slate-400'}`}>
                {partnerTyping ? '입력 중…' : partnerOnline ? '지금 함께 💚' : '오프라인'}
              </div>
            </div>
            <button onClick={() => setThemeOpen(true)} aria-label="챗 테마" className="p-1.5 text-[#FB7BA8] hover:opacity-80">
              <Palette size={20} />
            </button>
            <button onClick={openMemory} aria-label="추억 보관함" className="p-1.5 text-[#FB7BA8] hover:opacity-80">
              <Bookmark size={20} />
            </button>
            <button onClick={onClose} aria-label="닫기" className="p-1.5 -mr-1 text-slate-400 hover:text-slate-600"><X size={22} /></button>
          </div>

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
            onClick={() => { if (stickerOpen) setStickerOpen(false); }}
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
                      className={`relative flex flex-col select-none ${m.sticker && FULL_STICKERS.has(m.sticker) ? 'max-w-[88%]' : 'max-w-[78%]'} ${reactionEmojis.length > 0 ? 'mb-3' : ''}`}
                      style={{ alignItems: mine ? 'flex-end' : 'flex-start' }}
                      // 사이담처럼 — 말풍선 한 번 탭하면 바로 반응/답장 줄 토글(꾹 누르기 아님). 삭제/예약은 제외.
                      onClick={() => { if (!m.deleted && !pending) setActionMsg(actionMsg?.id === m.id ? null : m); }}
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
                        isVideoSrc(m.sticker) ? (
                          <video src={m.sticker} poster={posterOf(m.sticker)} autoPlay loop muted playsInline
                            className="w-40 h-40 rounded-[26px] object-cover bg-white shadow-sm" />
                        ) : FULL_STICKERS.has(m.sticker) ? (
                          <motion.img src={m.sticker} alt="이모티콘" className="w-[76vw] max-w-[400px] h-auto rounded-2xl shadow-sm"
                            initial={{ scale: 0.6, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ scale: { type: 'spring', stiffness: 300, damping: 20 }, opacity: { duration: 0.2 } }} />
                        ) : (
                          // 사이담 기준 통일 — 팩·움짤·정지 구분 없이 전부 160px(w-40), 폭 기준 h-auto(비율 유지, 안 찌그러짐).
                          //   챗 이모티콘은 말풍선 없이 그림만. ⚠️ 움짤(sai-anim)은 스스로 움직여 통 흔들기(rotate) 제외, 정지만 흔든다.
                          <motion.img src={m.sticker} alt="이모티콘"
                            className="w-40 h-auto object-contain drop-shadow-sm"
                            initial={{ scale: 0.4, opacity: 0 }}
                            animate={m.sticker.startsWith('/emo/sai-anim/')
                              ? { scale: 1, opacity: 1 }
                              : { scale: 1, opacity: 1, rotate: [0, -5, 5, -3, 0] }}
                            transition={m.sticker.startsWith('/emo/sai-anim/')
                              ? { scale: { type: 'spring', stiffness: 420, damping: 14 }, opacity: { duration: 0.15 } }
                              : { scale: { type: 'spring', stiffness: 420, damping: 14 }, opacity: { duration: 0.15 }, rotate: { duration: 1.8, repeat: Infinity, repeatDelay: 2.4, ease: 'easeInOut' } }} />
                        )
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
                        const linkUrl = firstUrl(m.text);
                        const onlyUrl = !!linkUrl && m.text.trim() === linkUrl;
                        return (
                          <>
                            {/* 주소만 덜렁 보내면 텍스트 버블은 숨기고 카드만 (주소 노출 X) */}
                            {!onlyUrl && (
                              <div
                                className={`max-w-full px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap break-keep rounded-2xl ${mine ? 'rounded-tr-sm shadow-[0_2px_8px_rgba(0,0,0,0.12)]' : 'rounded-tl-sm shadow-[0_2px_12px_rgba(0,0,0,0.04)]'}`}
                                style={{ background: mine ? 'var(--ct-my-bg)' : 'var(--ct-partner-bg)', color: mine ? 'var(--ct-my-text)' : 'var(--ct-partner-text)' }}>
                                {renderRich(m.text)}
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
                      {reactionEmojis.length > 0 && (
                        <div className={`absolute -bottom-3 flex items-center gap-1 rounded-full border border-[#FBF8F2] dark:border-[#272522] bg-white dark:bg-[#332F2A] px-2 py-0.5 shadow-sm text-[12px] leading-none ${mine ? '-left-2' : '-right-2'}`}>
                          {reactionEmojis.join(' ')}
                        </div>
                      )}

                      {/* 사이담식 인라인 액션 줄 — 말풍선 한 번 탭하면 바로 아래에 떠오름(반응+답장+보관+복사+삭제+닫기) */}
                      <AnimatePresence>
                        {actionMsg?.id === m.id && !m.deleted && (
                          <motion.div onClick={(e) => e.stopPropagation()}
                            initial={{ opacity: 0, y: -6, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className="mt-2 flex items-center gap-0.5 rounded-full bg-white px-2 py-1.5 shadow-[0_6px_20px_rgba(0,0,0,0.14)]">
                            {REACTIONS.map((emo) => (
                              <button key={emo} onClick={() => doReact(emo)} className="px-1 text-[20px] leading-none active:scale-90 transition-transform">{emo}</button>
                            ))}
                            <span className="mx-1 h-5 w-px bg-black/10" />
                            <button onClick={doReply} aria-label="답장" className="p-1.5 text-slate-500 active:scale-90 transition-transform"><Reply size={17} /></button>
                            <button onClick={doStar} aria-label="추억 보관" className="p-1.5 active:scale-90 transition-transform">{actionMsg.starred ? <BookmarkCheck size={17} className="text-[#FB7BA8]" /> : <Bookmark size={17} className="text-slate-500" />}</button>
                            {m.text && !m.sticker && !m.imageUrl && (
                              <button onClick={doCopy} aria-label="복사" className="p-1.5 text-slate-500 active:scale-90 transition-transform"><Copy size={16} /></button>
                            )}
                            {/* 수정 — 내 텍스트 메시지만(상대 글 고치면 안 한 말이 남으니까) */}
                            {m.from === me && m.text && !m.sticker && !m.imageUrl && !m.videoUrl && !m.audioUrl && (
                              <button onClick={doEdit} aria-label="수정" className="p-1.5 text-slate-500 active:scale-90 transition-transform"><Pencil size={15} /></button>
                            )}
                            {/* 삭제 — 둘 다 서로 것도 지울 수 있음(Storage 파일도 함께 삭제) */}
                            <button onClick={doDelete} aria-label="삭제" className="p-1.5 text-rose-400 active:scale-90 transition-transform"><Trash2 size={16} /></button>
                            <button onClick={() => setActionMsg(null)} aria-label="닫기" className="p-1.5 text-slate-300 active:scale-90 transition-transform"><X size={16} /></button>
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


          {/* 이모티콘 서랍 — 제미나이 2차: 아이콘만 탭 + 카톡식 '최근·자주' 첫 탭 */}
          {stickerOpen && (
            <div className="mx-3 mb-2 rounded-[28px] p-3 backdrop-blur-md border" style={{ background: 'var(--ct-sheet)', borderColor: 'var(--ct-sheet-border)', boxShadow: 'var(--sd-shadow-card)' }}>
              {/* 탭 — 실제 스티커 대표 그림(썸네일) 정사각. 최근·자주만 🕒. 선택 시 로즈 배경. */}
              <div className="flex gap-1 mb-1.5 overflow-x-auto pb-0.5">
                {STICKER_TABS.map((st) => {
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
              {/* 선택된 탭 이름만 작게(어느 탭인지 힌트) */}
              <div className="mb-1.5 px-0.5 text-[12px] font-bold text-[color:var(--ct-label)]">{STICKER_TABS.find((t) => t.id === stickerMode)?.name}</div>

              <div className="max-h-[40vh] overflow-y-auto">
                {stickerMode === 'recent' ? (
                  (recentPicks.length === 0 && frequentList.length === 0) ? (
                    <div className="py-8 text-center text-[12.5px] leading-relaxed text-[#94A3B8]">아직 쓴 이모티콘이 없어요.<br />다른 탭에서 골라 써보면 여기 모여요 🐾</div>
                  ) : (
                    <div className="flex flex-col gap-3.5">
                      {frequentList.length > 0 && (
                        <div>
                          <h3 className="mb-1.5 text-[11px] font-bold text-[#FB7BA8]">⭐ 자주 쓰는</h3>
                          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5">
                            {frequentList.map((p) => (
                              <button key={emoId(p)} onClick={() => pickSticker(p.mode, p.key, p.image)} aria-label={p.key}
                                className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[var(--ct-cell)] shadow-[var(--ct-cell-shadow)] active:scale-90 transition-transform">
                                {isVideoSrc(p.image)
                                  ? <video src={p.image} poster={posterOf(p.image)} muted loop autoPlay playsInline className="w-[88%] h-[88%] object-contain" />
                                  : /* eslint-disable-next-line @next/next/no-img-element */ <img src={drawerThumb(p.image)} alt="" className="w-[88%] h-[88%] object-contain" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {recentPicks.length > 0 && (
                        <div>
                          <h3 className="mb-1.5 text-[11px] font-bold text-[color:var(--ct-label)]">🕒 최근 사용</h3>
                          <div className="grid grid-cols-4 gap-1.5">
                            {recentPicks.map((p) => (
                              <button key={emoId(p)} onClick={() => pickSticker(p.mode, p.key, p.image)} aria-label={p.key}
                                className="grid aspect-square place-items-center rounded-2xl bg-[var(--ct-cell)] shadow-[var(--ct-cell-shadow)] active:scale-90 transition-transform">
                                {isVideoSrc(p.image)
                                  ? <video src={p.image} poster={posterOf(p.image)} muted loop autoPlay playsInline className="w-[88%] h-[88%] object-contain" />
                                  : /* eslint-disable-next-line @next/next/no-img-element */ <img src={drawerThumb(p.image)} alt="" className="w-[88%] h-[88%] object-contain" />}
                              </button>
                            ))}
                          </div>
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
                        {sec.items.map((it) => (
                          <button key={it.key} onClick={() => pickSticker(stickerMode, it.key, it.image)} aria-label={it.key}
                            className="grid aspect-square place-items-center rounded-2xl bg-[var(--ct-cell)] shadow-[var(--ct-cell-shadow)] active:scale-90 transition-transform">
                            {it.video ? (
                              <video src={it.image} poster={posterOf(it.image)} muted loop autoPlay playsInline className="w-[88%] h-[88%] object-contain" />
                            ) : (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={it.thumb ?? it.image} alt="" className="w-[88%] h-[88%] object-contain" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
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
          <div className="px-3 pt-2 backdrop-blur-xl border-t border-black/[0.04]"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 1.25rem)', background: 'var(--ct-header)' }}>
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
                      {uploadKind === 'video' ? '🎬 동영상 올리는 중…' : '📷 사진 올리는 중…'}
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
                  <span className="flex-1 min-w-0 truncate text-[13px] font-semibold text-slate-600">이거봐봐에 저장할까요?</span>
                  <button onClick={() => setLinkPrompt(null)} className="shrink-0 px-2 py-1 text-[13px] font-semibold text-slate-400 active:scale-95">닫기</button>
                  <button onClick={saveCurrentLink} disabled={linkSaving}
                    className="shrink-0 rounded-full bg-[#FB7BA8] px-3.5 py-1.5 text-[13px] font-bold text-white active:scale-95 disabled:opacity-50">
                    {linkSaving ? '저장 중…' : '저장'}
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
              <div className="flex items-end gap-2">
                <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={onFile} />
                <button onClick={() => setStickerOpen((v) => !v)} aria-label="이모티콘"
                  className="shrink-0 w-11 h-11 rounded-full border border-black/5 flex items-center justify-center active:scale-95 transition"
                  style={stickerOpen ? { background: '#FB7BA8', color: '#fff' } : { background: 'var(--ct-chip)', color: 'var(--ct-chip-icon)' }}>
                  <Smile size={20} />
                </button>
                <button onClick={() => { setStickerOpen(false); fileRef.current?.click(); }} disabled={uploading} aria-label="사진·동영상"
                  className="shrink-0 w-11 h-11 rounded-full border border-black/5 flex items-center justify-center disabled:opacity-40 active:scale-95 transition"
                  style={{ background: 'var(--ct-chip)', color: 'var(--ct-chip-icon)' }}>
                  <ImagePlus size={20} />
                </button>
                <textarea ref={taRef} value={draft} onChange={onInput} onBlur={stopTyping}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                  rows={1} placeholder={uploading ? '올리는 중…' : '포차코에게 할 말…'}
                  style={{ background: 'var(--ct-chip)', color: 'var(--ct-chip-text)' }}
                  className="flex-1 resize-none rounded-3xl ring-1 ring-black/[0.07] shadow-sm px-4 py-2.5 text-[15px] outline-none focus:ring-[#FB7BA8]/40 max-h-[120px]" />
                {draft.trim() ? (
                  <>
                    <button onClick={openCapsule} aria-label="타임캡슐"
                      className="shrink-0 w-11 h-11 rounded-full border border-black/5 text-[#FB7BA8] flex items-center justify-center active:scale-95 transition"
                      style={{ background: 'var(--ct-chip)' }}>
                      <Hourglass size={18} />
                    </button>
                    {/* onPointerDown preventDefault — 버튼이 입력창 포커스를 뺏지 않게(연속 전송 시 자판 유지) */}
                    <button onClick={send} onPointerDown={(e) => e.preventDefault()} aria-label="보내기"
                      className="shrink-0 w-11 h-11 rounded-full bg-[#FB7BA8] text-white flex items-center justify-center shadow-[0_4px_14px_rgba(251,123,168,0.35)] active:scale-90 transition">
                      <Send size={18} />
                    </button>
                  </>
                ) : (
                  <button onClick={startRec} disabled={uploading} aria-label="음성 메시지"
                    className="shrink-0 w-11 h-11 rounded-full bg-[#FB7BA8] text-white flex items-center justify-center shadow-[0_4px_14px_rgba(251,123,168,0.35)] disabled:opacity-40 active:scale-90 transition">
                    <Mic size={18} />
                  </button>
                )}
              </div>
            )}
          </div>

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
              <motion.div className="absolute left-1/2 -translate-x-1/2 bottom-28 z-[75] px-4 py-2.5 rounded-full bg-slate-800/90 text-white text-[13px] font-semibold shadow-lg whitespace-nowrap"
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
                  <button onClick={() => setMemoryOpen(false)} aria-label="닫기" className="p-1.5 -ml-1 text-slate-400"><X size={22} /></button>
                  <div className="flex-1 font-['Dongle'] text-3xl font-bold leading-none text-[#334155] dark:text-[#E8E2D8]">우리의 추억함</div>
                </div>
                <div className="flex gap-1.5 px-4 py-2">
                  <button onClick={() => setMemoryTab('star')} className={`px-3.5 py-1.5 rounded-full text-[13px] font-bold ${memoryTab === 'star' ? 'bg-[#FB7BA8] text-white' : 'bg-black/5 text-slate-500'}`}>⭐️ 별표</button>
                  <button onClick={() => setMemoryTab('photo')} className={`px-3.5 py-1.5 rounded-full text-[13px] font-bold ${memoryTab === 'photo' ? 'bg-[#FB7BA8] text-white' : 'bg-black/5 text-slate-500'}`}>📷 사진</button>
                  <button onClick={() => setMemoryTab('link')} className={`px-3.5 py-1.5 rounded-full text-[13px] font-bold ${memoryTab === 'link' ? 'bg-[#FB7BA8] text-white' : 'bg-black/5 text-slate-500'}`}>🔖 이거봐봐</button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 pb-8">
                  {memoryTab === 'link' ? (
                    (() => {
                      if (links === null) return <div className="h-40 flex items-center justify-center text-slate-400 text-sm">불러오는 중…</div>;
                      if (!links.length) return <div className="h-40 flex flex-col items-center justify-center text-slate-400 gap-2"><span className="text-3xl">🔖</span><p className="text-sm font-semibold">링크 보내고 &quot;이거봐봐&quot;에 저장</p></div>;
                      return (
                        <div className="space-y-2 pt-1">
                          {links.map((lk) => (
                            <a key={lk.id} href={lk.url} target="_blank" rel="noopener noreferrer"
                              className="flex gap-3 items-center p-2.5 rounded-2xl bg-white shadow-sm active:scale-[0.99] transition">
                              {lk.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={lk.image} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover bg-black/5" />
                              ) : (
                                <div className="h-14 w-20 shrink-0 rounded-lg bg-[#FB7BA8]/10 flex items-center justify-center text-2xl">🔗</div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-[13.5px] font-bold text-slate-700 break-keep"
                                  style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                  {lk.title || lk.url}
                                </div>
                                <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                                  <span className="truncate">{lk.site || '링크'}</span>
                                  <span>·</span>
                                  <span className="shrink-0">{lk.from}</span>
                                </div>
                              </div>
                              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteLink(lk.id); }}
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
                                  <div className="text-[14px] text-slate-700 mt-0.5 break-keep">{renderRich(m.text)}</div>
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
