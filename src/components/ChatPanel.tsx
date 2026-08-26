'use client';

import React, { useEffect, useLayoutEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, ImagePlus, Smile, Reply, Copy, Trash2, Mic, Play, Pause, Bookmark, BookmarkCheck, Hourglass, Download, Loader2 } from 'lucide-react';
import { saveMedia } from '@/lib/saveMedia';
import { saveLink, deleteLink, subscribeLinks, firstUrl, youTubeId, type SavedLink } from '@/lib/links';
import {
  type ChatMessage, type ReplyRef,
  subscribeTyping, setTyping, markRead, subscribeRead, uploadChatImage, uploadChatAudio, uploadChatVideo,
  toggleReaction, deleteMessage, toggleStar, fetchRecentMessages,
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
    <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl shadow-sm ${mine ? 'bg-[#FB7BA8] rounded-tr-sm' : 'bg-white rounded-tl-sm'}`}>
      <button onClick={toggle} aria-label="재생" className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${mine ? 'bg-white/25 text-white' : 'bg-[#FB7BA8] text-white'}`}>
        {playing ? <Pause size={15} /> : <Play size={15} />}
      </button>
      <div className="flex items-center gap-[2px] h-6">
        {Array.from({ length: bars }).map((_, i) => {
          const active = i / bars <= pos;
          const h = 6 + ((i * 7) % 14);
          return <span key={i} className={`w-[3px] rounded-full ${mine ? (active ? 'bg-white' : 'bg-white/40') : (active ? 'bg-[#FB7BA8]' : 'bg-slate-300')}`} style={{ height: h }} />;
        })}
      </div>
      <span className={`text-[11px] font-semibold ${mine ? 'text-white/90' : 'text-slate-500'}`}>{fmtDur(dur)}</span>
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
const REACTIONS = ['❤️', '😆', '👍', '😮', '😢', '🥹'];

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
const STICKER_ALT = Object.keys(TEXT_STICKERS).join('|');
// [[e:id]] 미니 이모티콘 OR (단어) 텍스트 스티커 둘 다 매칭
const RICH_RE = new RegExp(`\\[\\[e:([a-z]+)\\]\\]|\\((${STICKER_ALT})\\)`, 'g');
const STICKER_RE = new RegExp(`\\((${STICKER_ALT})\\)`, 'g');
// 스티커 포켓 그리드 — 텍스트 스티커들을 탭해서 큰 단독 스티커로 전송(투명 배경, 말풍선 없음).
const POCKET_STICKERS = Object.entries(TEXT_STICKERS).map(([word, image]) => ({ word, image }));
// Dang's 탭 — 단독 스티커(탭해서 크게 전송). 추가하려면 여기 { word, image } 한 줄.
const DANG_STICKERS: { word: string; image: string }[] = [
  { word: '귀엽꼬미', image: '/pochacco_dang/cutekkomi.png' },
  { word: '앙 귀여워', image: '/pochacco_dang/angcute.png' },
  { word: '치카치카', image: '/pochacco_dang/dangchicca.png' },
];
// kkom's 탭 — 꼼이(여자 포차코) 스티커
const KKOM_STICKERS: { word: string; image: string }[] = [
  { word: '달려가는 중', image: '/pochacco_kkom/kkomrun.png' },
  { word: '꾸미는 중', image: '/pochacco_kkom/kkommakeup.png' },
  { word: '치카치카', image: '/pochacco_kkom/kkomchicca.png' },
];

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

export default function ChatPanel({ me, partner, messages, open, onClose, onSend, partnerOnline, onLoadMore, hasMore, onSendCapsule }: Props) {
  const [draft, setDraft] = useState('');
  const [stickerOpen, setStickerOpen] = useState(false);
  const [stickerMode, setStickerMode] = useState<'sticker' | 'mini' | 'couple' | 'dang' | 'kkom'>('sticker');
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [partnerLastRead, setPartnerLastRead] = useState<Date | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadKind, setUploadKind] = useState<'image' | 'video' | null>(null);
  const [uploadPct, setUploadPct] = useState(0); // 0~1 (동영상 업로드 진행률)
  const [actionMsg, setActionMsg] = useState<ChatMessage | null>(null);
  const [replyTo, setReplyTo] = useState<ReplyRef | null>(null);
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
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);
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
    onSend(t, undefined, undefined, replyTo ?? undefined);
    setDraft(''); setReplyTo(null); stopTyping();
    if (taRef.current) taRef.current.style.height = 'auto';
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

  // 미니 이모티콘 — 커서 위치에 [[e:id]] 토큰 삽입 (피커 열린 채 여러 개 가능)
  const insertMini = (id: string) => {
    const token = `[[e:${id}]]`;
    const ta = taRef.current;
    const start = ta?.selectionStart ?? draft.length;
    const end = ta?.selectionEnd ?? start;
    const next = draft.slice(0, start) + token + draft.slice(end);
    setDraft(next);
    requestAnimationFrame(() => {
      if (ta) { ta.focus(); const pos = start + token.length; ta.setSelectionRange(pos, pos); }
    });
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

    // 동영상 — 라이브러리에서 고른 파일. 상한: 30초 · 60MB (개인앱이라 Storage 부담 거의 없음).
    if (file.type.startsWith('video/')) {
      if (file.size > 60 * 1024 * 1024) { alert('동영상이 너무 커요 — 60MB 이하로 보내줘 🎬'); return; }
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

  // 길게 누르기 → 액션 시트
  const startPress = (m: ChatMessage) => {
    if (m.deleted) return;
    longPressed.current = false;
    pressTimer.current = setTimeout(() => { longPressed.current = true; setActionMsg(m); }, 430);
  };
  const cancelPress = () => { if (pressTimer.current) clearTimeout(pressTimer.current); };

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

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex flex-col bg-[#FBF8F2] dark:bg-[#272522] bg-[radial-gradient(#e5e7eb_1.5px,transparent_1.5px)] [background-size:20px_20px] dark:bg-[radial-gradient(#374151_1.5px,transparent_1.5px)]"
          initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 380, damping: 40 }}
          drag={(memoryOpen || viewerImage || actionMsg || capsuleOpen || stickerOpen) ? false : 'x'}
          dragDirectionLock
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={{ left: 0, right: 0.9 }}
          onDragEnd={(_e, info) => { if (info.offset.x > 110 || info.velocity.x > 550) onClose(); }}
        >
          {/* 헤더 — 불투명 + 상단 safe-area까지 덮어 뒤 배경 비침 방지 */}
          <div className="flex items-center gap-3 px-4 pb-3 bg-[#FBF8F2]/95 backdrop-blur-xl border-b border-black/[0.04] shadow-[0_4px_16px_rgba(0,0,0,0.04)]"
            style={{ paddingTop: 'max(env(safe-area-inset-top), 2.75rem)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarOf(partner)} alt={partner} className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-sm" />
            <div className="flex-1">
              <div className="text-base font-extrabold text-slate-700">{partner}</div>
              <div className={`text-xs font-bold ${partnerTyping ? 'text-[#FB7BA8]' : partnerOnline ? 'text-emerald-500' : 'text-slate-400'}`}>
                {partnerTyping ? '입력 중…' : partnerOnline ? '지금 함께 💚' : '오프라인'}
              </div>
            </div>
            <button onClick={openMemory} aria-label="추억 보관함" className="p-1.5 text-[#FB7BA8] hover:opacity-80">
              <Bookmark size={20} />
            </button>
            <button onClick={onClose} aria-label="닫기" className="p-1.5 -mr-1 text-slate-400 hover:text-slate-600"><X size={22} /></button>
          </div>

          {/* 메시지 — 길게눌러 답장 시 iOS 기본 텍스트선택/콜아웃(Copy·Look Up) 뜨는 것 차단 */}
          <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 select-none [-webkit-touch-callout:none] [-webkit-user-select:none]">
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
                <div key={m.id}>
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
                      onPointerDown={() => startPress(m)}
                      onPointerUp={cancelPress}
                      onPointerLeave={cancelPress}
                      onPointerMove={cancelPress}
                      onContextMenu={(e) => { e.preventDefault(); if (!m.deleted) setActionMsg(m); }}
                    >
                      {/* 답장 인용 */}
                      {m.replyTo && !m.deleted && (
                        <div className={`mb-0.5 max-w-[70%] rounded-lg px-2.5 py-1 text-[11px] ${mine ? 'bg-black/5 text-slate-500' : 'bg-black/5 text-slate-500'}`}>
                          <span className="font-bold">{m.replyTo.from}</span> · {m.replyTo.text}
                        </div>
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
                          <motion.img src={m.sticker} alt="이모티콘" className="w-28 h-28 object-contain drop-shadow-sm"
                            initial={{ scale: 0.4, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1, rotate: [0, -5, 5, -3, 0] }}
                            transition={{ scale: { type: 'spring', stiffness: 420, damping: 14 }, opacity: { duration: 0.15 }, rotate: { duration: 1.8, repeat: Infinity, repeatDelay: 2.4, ease: 'easeInOut' } }} />
                        )
                      ) : m.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.imageUrl} alt="사진"
                          onClick={() => { if (longPressed.current) { longPressed.current = false; return; } setViewerImage(m.imageUrl!); }}
                          className="max-w-[68%] rounded-2xl shadow-sm object-cover cursor-pointer"
                          style={{ maxHeight: 280 }}
                        />
                      ) : m.videoUrl ? (
                        // 자동재생 X — 스크롤마다 재다운로드 방지(대역폭). 탭해서 재생.
                        <div className="relative inline-block max-w-[76%]">
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
                        <VoiceBubble url={m.audioUrl} dur={m.audioDur ?? 0} mine={mine} />
                      ) : (() => {
                        const linkUrl = firstUrl(m.text);
                        const onlyUrl = !!linkUrl && m.text.trim() === linkUrl;
                        return (
                          <>
                            {/* 주소만 덜렁 보내면 텍스트 버블은 숨기고 카드만 (주소 노출 X) */}
                            {!onlyUrl && (
                              <div className={`max-w-full px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap break-keep ${
                                mine
                                  ? 'bg-[#FB7BA8] dark:bg-[#D94C7A] text-white rounded-2xl rounded-tr-sm shadow-[0_2px_8px_rgba(251,123,168,0.2)]'
                                  : 'bg-white dark:bg-[#332F2A] text-slate-700 dark:text-[#E8E2D8] rounded-2xl rounded-tl-sm shadow-[0_2px_12px_rgba(0,0,0,0.04)]'
                              }`}>
                                {renderRich(m.text)}
                              </div>
                            )}
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
                    </div>

                    {!mine && <span className="text-[10px] text-slate-400 mb-0.5">{timeText(m.createdAt)}</span>}
                  </div>
                </div>
              );
            })}

            {partnerTyping && (
              <div className="flex justify-start">
                <div className="bg-white text-slate-400 rounded-2xl rounded-bl-md px-4 py-2.5 shadow-sm">
                  <span className="inline-flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 이모티콘 피커 (스티커=크게 따로 / 미니=글자 사이 인라인) */}
          {stickerOpen && (
            <div className="px-3 pt-2 pb-1 bg-white/80 backdrop-blur-md border-t border-black/5">
              <div className="flex items-center gap-1 mb-2 overflow-x-auto">
                <button onClick={() => setStickerMode('sticker')} className={`shrink-0 whitespace-nowrap px-3 py-1 rounded-full text-[12px] font-bold transition ${stickerMode === 'sticker' ? 'bg-[#FB7BA8] text-white' : 'bg-black/5 text-slate-500'}`}>스티커</button>
                <button onClick={() => setStickerMode('mini')} className={`shrink-0 whitespace-nowrap px-3 py-1 rounded-full text-[12px] font-bold transition ${stickerMode === 'mini' ? 'bg-[#FB7BA8] text-white' : 'bg-black/5 text-slate-500'}`}>미니</button>
                <button onClick={() => setStickerMode('couple')} className={`shrink-0 whitespace-nowrap px-3 py-1 rounded-full text-[12px] font-bold transition ${stickerMode === 'couple' ? 'bg-[#FB7BA8] text-white' : 'bg-black/5 text-slate-500'}`}>커플</button>
                <button onClick={() => setStickerMode('dang')} className={`shrink-0 whitespace-nowrap px-3 py-1 rounded-full text-[12px] font-bold transition ${stickerMode === 'dang' ? 'bg-[#FB7BA8] text-white' : 'bg-black/5 text-slate-500'}`}>Dang&apos;s</button>
                <button onClick={() => setStickerMode('kkom')} className={`shrink-0 whitespace-nowrap px-3 py-1 rounded-full text-[12px] font-bold transition ${stickerMode === 'kkom' ? 'bg-[#FB7BA8] text-white' : 'bg-black/5 text-slate-500'}`}>kkom&apos;s</button>
                {stickerMode === 'mini' && <span className="ml-1 shrink-0 whitespace-nowrap text-[11px] text-slate-400">글자 사이에 콕콕 넣기</span>}
                {stickerMode === 'couple' && <span className="ml-1 shrink-0 whitespace-nowrap text-[11px] text-slate-400">움직이는 커플 · 톡엔 (단어)로도</span>}
              </div>
              {stickerMode === 'couple' ? (
                <div className="flex flex-wrap gap-2 justify-center content-start max-h-52 overflow-y-auto py-1">
                  {POCKET_STICKERS.map((s) => (
                    <button key={s.word}
                      onClick={() => { onSend('', undefined, s.image, replyTo ?? undefined); setReplyTo(null); setStickerOpen(false); }}
                      aria-label={s.word} className="h-[76px] p-1 rounded-2xl active:bg-black/5 transition flex items-center justify-center">
                      {isVideoSrc(s.image) ? (
                        <video src={s.image} poster={posterOf(s.image)} muted loop autoPlay playsInline className="h-full w-auto object-contain rounded-xl" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.image} alt={s.word} className="h-full w-auto object-contain" />
                      )}
                    </button>
                  ))}
                </div>
              ) : stickerMode === 'dang' ? (
                <div className="flex flex-wrap gap-2 justify-center content-start max-h-52 overflow-y-auto py-1">
                  {DANG_STICKERS.map((s) => (
                    <button key={s.word}
                      onClick={() => { onSend('', undefined, s.image, replyTo ?? undefined); setReplyTo(null); setStickerOpen(false); }}
                      aria-label={s.word} className="h-[76px] p-1 rounded-2xl active:bg-black/5 transition flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.image} alt={s.word} className="h-full w-auto object-contain" />
                    </button>
                  ))}
                </div>
              ) : stickerMode === 'kkom' ? (
                <div className="flex flex-wrap gap-2 justify-center content-start max-h-52 overflow-y-auto py-1">
                  {KKOM_STICKERS.map((s) => (
                    <button key={s.word}
                      onClick={() => { onSend('', undefined, s.image, replyTo ?? undefined); setReplyTo(null); setStickerOpen(false); }}
                      aria-label={s.word} className="h-[76px] p-1 rounded-2xl active:bg-black/5 transition flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.image} alt={s.word} className="h-full w-auto object-contain" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-1.5 max-h-52 overflow-y-auto">
                  {MOOD_OPTIONS.map((o) => (
                    <button key={o.id}
                      onClick={() => {
                        if (stickerMode === 'mini') { insertMini(o.id); }
                        else { onSend('', undefined, o.image, replyTo ?? undefined); setReplyTo(null); setStickerOpen(false); }
                      }}
                      aria-label={o.label} className="aspect-square p-1.5 rounded-2xl active:bg-black/5 transition">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={o.image} alt={o.label} className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              )}
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
          <div className="px-3 pt-2 bg-[#FBF8F2]/95 backdrop-blur-xl border-t border-black/[0.04]"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 1.25rem)' }}>
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
                  className={`shrink-0 w-11 h-11 rounded-full border border-black/5 flex items-center justify-center active:scale-95 transition ${stickerOpen ? 'bg-[#FB7BA8] text-white' : 'bg-white text-slate-400'}`}>
                  <Smile size={20} />
                </button>
                <button onClick={() => { setStickerOpen(false); fileRef.current?.click(); }} disabled={uploading} aria-label="사진·동영상"
                  className="shrink-0 w-11 h-11 rounded-full bg-white border border-black/5 text-slate-400 flex items-center justify-center disabled:opacity-40 active:scale-95 transition">
                  <ImagePlus size={20} />
                </button>
                <textarea ref={taRef} value={draft} onChange={onInput} onBlur={stopTyping}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                  rows={1} placeholder={uploading ? '올리는 중…' : '포차코에게 할 말…'}
                  className="flex-1 resize-none rounded-3xl bg-white ring-1 ring-black/[0.07] shadow-sm px-4 py-2.5 text-[15px] text-slate-700 outline-none focus:ring-[#FB7BA8]/40 max-h-[120px]" />
                {draft.trim() ? (
                  <>
                    <button onClick={openCapsule} aria-label="타임캡슐"
                      className="shrink-0 w-11 h-11 rounded-full bg-white border border-black/5 text-[#FB7BA8] flex items-center justify-center active:scale-95 transition">
                      <Hourglass size={18} />
                    </button>
                    <button onClick={send} aria-label="보내기"
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

          {/* 길게 누르기 액션 시트 */}
          <AnimatePresence>
            {actionMsg && (
              <motion.div className="absolute inset-0 z-[65] flex items-end justify-center bg-black/20"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActionMsg(null)}>
                <motion.div className="w-full max-w-md rounded-t-[32px] bg-white px-5 pt-3 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]"
                  style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 2rem)' }}
                  initial={{ y: 260 }} animate={{ y: 0 }} exit={{ y: 260 }} transition={{ type: 'spring', stiffness: 340, damping: 32 }}
                  onClick={(e) => e.stopPropagation()}>
                  <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-black/10" />
                  {/* 반응 이모지 랙 */}
                  <div className="flex justify-around rounded-2xl bg-[#FBF8F2] px-2 py-3 mb-2">
                    {REACTIONS.map((emo) => (
                      <button key={emo} onClick={() => doReact(emo)} className="text-2xl hover:scale-125 active:scale-95 transition">{emo}</button>
                    ))}
                  </div>
                  <button onClick={doReply} className="w-full flex items-center gap-3 px-2 py-3 text-slate-700 active:bg-black/5 rounded-xl">
                    <Reply size={18} /> <span className="font-semibold">답장</span>
                  </button>
                  <button onClick={doStar} className="w-full flex items-center gap-3 px-2 py-3 text-slate-700 active:bg-black/5 rounded-xl">
                    {actionMsg.starred ? <BookmarkCheck size={18} className="text-[#FB7BA8]" /> : <Bookmark size={18} />}
                    <span className="font-semibold">{actionMsg.starred ? '보관 취소' : '추억 보관'}</span>
                  </button>
                  {actionMsg.text && !actionMsg.sticker && !actionMsg.imageUrl && (
                    <button onClick={doCopy} className="w-full flex items-center gap-3 px-2 py-3 text-slate-700 active:bg-black/5 rounded-xl">
                      <Copy size={18} /> <span className="font-semibold">복사</span>
                    </button>
                  )}
                  {actionMsg.from === me && (
                    <button onClick={doDelete} className="w-full flex items-center gap-3 px-2 py-3 text-rose-500 active:bg-black/5 rounded-xl">
                      <Trash2 size={18} /> <span className="font-semibold">삭제</span>
                    </button>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

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
