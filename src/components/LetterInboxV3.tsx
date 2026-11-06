'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Pencil, Lock, MailOpen, Clock, X, Mail,
  Heart, MessageCircle, Trash2, Send, Mic, Smile
} from 'lucide-react';
import VoicePlayer from '@/components/VoicePlayer';
import DoodlePad, { type DoodleData } from '@/components/DoodlePad';
import { getEmoticonsByIds } from '@/lib/emoticons';
import { getAnimatedSticker } from '@/lib/animatedStickers';
import { kstParts, formatKstFull, formatKstMonthDay } from '@/lib/kst';
import { miniToPlain, splitMini, miniItemsFor, insertMiniToken } from '@/lib/miniEmoticons';   // 목록 미리보기는 글자만 — (사랑해) → 사랑해 · 읽기는 그림으로
import { LetterPaper } from '@/components/letter/LetterPaper';
import { LetterReadSheet } from '@/components/letter/LetterReadSheet';
import { LetterEnclosures } from '@/components/letter/LetterEnclosures';
import { LetterEditor } from '@/components/letter/LetterEditor';
import { MiniEmoticonSheet } from '@/components/letter/MiniEmoticonSheet';

export type Letter = {
  id: string;
  from: '우댕' | '꼼이';
  to: '우댕' | '꼼이';
  body: string;
  createdAt: Date;
  openAt?: Date | null;
  sealed?: boolean; // 예약편지 봉인(도착 전) — 본문 없음, 열 수 없음
  voice?: { src: string; mime?: string; duration?: number } | null;
  doodle?: DoodleData | null;
  emoticonIds?: string[];
  animatedSticker?: string | null;
  hearts?: number;
  commentCount?: number;
};

export interface Comment {
  id: string;
  by: '우댕' | '꼼이';
  text: string;
  createdAt: Date;
}

export interface Props {
  me: '우댕' | '꼼이';
  letters: Letter[];
  initialOpenLetterId?: string | null;
  hasMore: boolean;
  onLoadMore: () => void;
  loading: boolean;
  onWriteLetter: () => void;
  onBack?: () => void;
  onHeart: (letterId: string) => Promise<void>;
  onEdit?: (letterId: string, body: string) => Promise<void>; // 내가 보낸 편지 본문 수정
  subscribeComments: (letterId: string, cb: (comments: Comment[]) => void) => () => void;
  addComment: (letterId: string, text: string) => Promise<void>;
  deleteComment: (letterId: string, commentId: string) => Promise<void>;
}

type FilterType = 'all' | 'received' | 'sent' | 'voice' | 'scheduled';

// -----------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------
// Claude 참고: 시간 표시는 전부 KST 고정 (lib/kst.ts).
// 디바이스 타임존 의존(getHours 등)이면 폰 설정이 서울이 아닐 때 다 틀어짐 — 실제 버그였음.
const formatRelative = (d: Date) => {
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) {
    const diffHours = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60));
    if (diffHours === 0) return '방금 전';
    return `${diffHours}시간 전`;
  }
  if (diffDays === 1) return '어제';
  if (diffDays <= 3) return `${diffDays}일 전`;
  return formatKstMonthDay(d);
};

const formatFullDate = (d: Date) => formatKstFull(d);

const formatCount = (n?: number) => {
  const cnt = n || 0;
  if (cnt >= 1000) return (cnt / 1000).toFixed(1) + 'k+';
  return cnt.toString();
};

const avatarColor = (person: string) => person === '우댕' ? 'bg-[#10B981]' : 'bg-[#FCA5A5]';

function LetterEmoticonStrip({ ids, large = false }: { ids?: string[]; large?: boolean }) {
  const emoticons = getEmoticonsByIds(ids);
  if (emoticons.length === 0) return null;

  return (
    <div className={`flex items-center gap-2 ${large ? 'flex-wrap mb-6' : 'mb-3'}`}>
      {emoticons.map((item, index) => (
        <motion.div
          key={`${item.id}-${index}`}
          initial={{ opacity: 0, y: 10, rotate: -4 }}
          animate={{ opacity: 1, y: 0, rotate: index % 2 === 0 ? -3 : 3 }}
          transition={{ delay: Math.min(index * 0.05, 0.15) }}
          className={`${large ? 'w-32 h-32 rounded-[30px]' : 'w-14 h-14 rounded-2xl'} bg-emerald-50/80 border border-emerald-100 flex items-center justify-center shadow-sm overflow-hidden`}
          title={item.label}
        >
          <img
            src={item.imageUrl}
            alt={item.label}
            className={`${large ? 'w-[94%] h-[94%]' : 'w-[92%] h-[92%]'} object-contain drop-shadow-sm`}
            loading="lazy"
          />
        </motion.div>
      ))}
      {!large && (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-black text-emerald-600">
          <Smile size={11} /> 이모티콘 {emoticons.length}개
        </span>
      )}
    </div>
  );
}

// -----------------------------------------------------------------
// Floating Heart Button
// -----------------------------------------------------------------
function HeartButton({
  count, onHeart, isLarge = false
}: {
  count?: number; onHeart: () => void; isLarge?: boolean;
}) {
  const [bursts, setBursts] = useState<{ id: number; x: number }[]>([]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBursts(prev => [...prev, { id: Date.now() + Math.random(), x: (Math.random() - 0.5) * 40 }]);
    onHeart();
  };

  return (
    <button
      onClick={handleClick}
      className={`relative inline-flex items-center gap-1.5 transition-transform active:scale-95 ${
        isLarge ? 'bg-slate-50 px-4 py-2 rounded-full hover:bg-slate-100' : ''
      }`}
    >
      <Heart
        size={isLarge ? 20 : 14}
        className={`text-red-500 ${count ? 'fill-red-500' : (isLarge ? '' : 'fill-transparent')}`}
      />
      <span className={`font-bold ${isLarge ? 'text-[15px] text-slate-700' : 'text-[12px] text-slate-400'}`}>
        {formatCount(count)}
      </span>

      <AnimatePresence>
        {bursts.map(b => (
          <motion.div
            key={b.id}
            initial={{ opacity: 1, y: 0, x: 0, scale: 0.8 }}
            animate={{ opacity: 0, y: -60, x: b.x, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute text-red-500 pointer-events-none"
            style={{ left: isLarge ? '16px' : '0px', top: '0px' }}
          >
            ❤️
          </motion.div>
        ))}
      </AnimatePresence>
    </button>
  );
}

// -----------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------
export default function LetterInboxV3({
  me, letters, initialOpenLetterId, hasMore, onLoadMore, loading, onWriteLetter, onBack,
  onHeart, onEdit, subscribeComments, addComment, deleteComment
}: Props) {
  const [filter, setFilter] = useState<FilterType>('all');
  // Claude 참고: selectedLetter를 직접 state로 가지면 letters prop 갱신 시 stale snapshot이 되어
  // 모달 안 hearts/commentCount가 안 올라가 보임 (사용자 신고 — 11/24 하트 카운트 안 올라감 버그).
  // id만 저장하고 letters에서 항상 최신을 derive.
  const [selectedLetterId, setSelectedLetterId] = useState<string | null>(null);
  // /letters?open={id}로 진입하면 자동으로 해당 편지 모달 열기 (홈에서 편지 카드 클릭 진입용)
  useEffect(() => {
    if (initialOpenLetterId && letters.some((l) => l.id === initialOpenLetterId)) {
      setSelectedLetterId(initialOpenLetterId);
    }
  }, [initialOpenLetterId, letters]);
  const selectedLetter = useMemo(
    () => (selectedLetterId ? letters.find((l) => l.id === selectedLetterId) || null : null),
    [selectedLetterId, letters]
  );
  const setSelectedLetter = (l: Letter | null) => setSelectedLetterId(l?.id ?? null);
  const now = new Date();

  const filteredLetters = useMemo(() => {
    return letters.filter((l) => {
      const isReceived = l.to === me;
      const isSent = l.from === me;
      const isScheduled = l.openAt && l.openAt > now;

      if (filter === 'received') return isReceived && !isScheduled;
      if (filter === 'sent') return isSent && !isScheduled;
      if (filter === 'voice') return !!l.voice && (!isScheduled || isSent);
      if (filter === 'scheduled') return isScheduled;
      return true;
    });
  }, [letters, filter, me, now]);

  return (
    <div className="min-h-app bg-[#F7F9F9] max-w-md mx-auto relative font-sans text-slate-900 pb-32">
      {/* Sticky Header */}
      <header className="sticky top-0 z-20 bg-[#F7F9F9]/90 backdrop-blur-md pt-safe">
        <div className="flex items-center justify-between px-6 py-4">
          <motion.button whileTap={{ scale: 0.9 }} onClick={onBack} className="p-2 -ml-2 text-slate-800">
            <ArrowLeft size={24} />
          </motion.button>
          <div className="text-center">
            <h1 className="text-lg font-bold">우리의 편지</h1>
            <p className="text-xs font-medium text-slate-400 mt-0.5">
              총 {letters.length}통 · 우댕 ↔ 꼼이
            </p>
          </div>
          <div className="w-10" />
        </div>

        {/* Filters */}
        <div className="px-6 pb-4 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: '전체' },
            { id: 'received', label: '받은 편지' },
            { id: 'sent', label: '보낸 편지' },
            { id: 'voice', label: '🎙 보이스' },
            { id: 'scheduled', label: '예약 중' },
          ].map((f) => (
            <motion.button
              key={f.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => setFilter(f.id as FilterType)}
              className={`px-4 py-2 rounded-full text-[13px] font-bold whitespace-nowrap transition-colors ${
                filter === f.id
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-500 shadow-[0_2px_8px_rgba(0,0,0,0.03)]'
              }`}
            >
              {f.label}
            </motion.button>
          ))}
        </div>
      </header>

      {/* List */}
      <main className="px-5 mt-2 flex flex-col gap-4">
        <AnimatePresence mode="popLayout">
          {filteredLetters.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center pt-24 pb-12 text-center"
            >
              <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center text-[#99E6D9] mb-5">
                <MailOpen size={36} strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">아직 주고받은 편지가 없어요</h3>
              <p className="text-[14px] text-slate-500 mb-8">서로의 진심을 담은 첫 편지를 써볼까요?</p>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={onWriteLetter}
                className="px-8 py-3.5 bg-[#10B981] text-white font-bold rounded-full shadow-[0_4px_16px_rgba(16,185,129,0.25)] flex items-center gap-2"
              >
                <Pencil size={18} /> 편지 쓰기
              </motion.button>
            </motion.div>
          )}

          {filteredLetters.map((letter, i) => {
            const isMeReceiving = letter.to === me;
            // 예약편지 봉인 — 도착 전엔 본문이 letters 에 없다(letterVault). sealed 가 원천,
            // openAt 은 레거시 예약편지(인라인 본문) 보정. 받는 사람도 보낸 사람도 못 연다
            // (보낸 사람이 열어 수정하면 본문이 letters 로 다시 새어나가므로).
            const sealed = letter.sealed === true || !!(letter.openAt && letter.openAt > now);
            const hasEmoticons = (letter.emoticonIds?.length ?? 0) > 0;

            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
                key={letter.id}
                onClick={() => !sealed && setSelectedLetter(letter)}
                className={`relative bg-white rounded-[28px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden ${
                  sealed ? 'bg-white/60' : 'cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${avatarColor(letter.from)}`} />
                    <span className="text-[13px] font-bold text-slate-600">
                      {letter.from} → {letter.to === me ? '나' : letter.to}
                    </span>
                  </div>
                  <span className="text-[12px] font-medium text-slate-400">
                    {formatRelative(letter.createdAt)}
                  </span>
                </div>

                {sealed ? (
                  <div className="py-6 flex flex-col items-center justify-center text-slate-400 gap-3 bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed">
                    <Lock size={24} className="text-slate-300" />
                    <p className="text-[14px] font-bold text-slate-500">
                      {(() => { const p = kstParts(letter.openAt!); return `${p.month}월 ${p.day}일 ${p.hour}시에 도착해요`; })()}
                    </p>
                    {!isMeReceiving && (
                      <p className="text-[12px] font-medium text-slate-400">네가 예약한 편지예요 · 도착하면 열려요</p>
                    )}
                  </div>
                ) : (
                  <>
                    {letter.body ? (
                      <p className="text-[15px] leading-relaxed text-slate-700 line-clamp-2 mb-3">
                        {miniToPlain(letter.body)}
                      </p>
                    ) : hasEmoticons ? (
                      <p className="text-[15px] leading-relaxed text-slate-500 font-bold mb-3">
                        이모티콘 편지가 도착했어요
                      </p>
                    ) : null}
                    <LetterEmoticonStrip ids={letter.emoticonIds} />
                    {letter.voice && (
                      <div className="mb-3" onClick={(e) => e.stopPropagation()}>
                        <VoicePlayer src={letter.voice.src} mime={letter.voice.mime} durationHint={letter.voice.duration} compact accent="emerald" />
                      </div>
                    )}
                    {letter.doodle && (
                      <div className="mb-3 inline-flex items-center gap-1 text-[11px] font-bold text-[#10B981] bg-emerald-50 px-2 py-1 rounded-full">
                        <Pencil size={11} /> 손글씨
                      </div>
                    )}
                    {letter.animatedSticker && (
                      <div className="mb-3 inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                        🐶 움직이는 포차코
                      </div>
                    )}

                    {/* Heart & Comments Counters */}
                    <div className="flex items-center justify-end gap-3 mt-1">
                      <HeartButton count={letter.hearts} onHeart={() => onHeart(letter.id)} />
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <MessageCircle size={14} />
                        <span className="text-[12px] font-bold">{formatCount(letter.commentCount)}</span>
                      </div>
                    </div>
                  </>
                )}

                {sealed && !isMeReceiving && (
                  <div className="absolute top-4 right-4 bg-[#FCA5A5]/10 text-[#FCA5A5] px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1">
                    <Clock size={12} /> 예약됨
                  </div>
                )}
              </motion.div>
            );
          })}

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {[1, 2, 3].map((skeleton) => (
                <div key={skeleton} className="bg-white/60 h-32 rounded-[28px] animate-pulse" />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {hasMore && !loading && filteredLetters.length > 0 && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onLoadMore}
            className="w-full py-4 mt-2 mb-8 rounded-[24px] border-2 border-dashed border-slate-200 text-[14px] font-bold text-slate-400 hover:border-slate-300 hover:text-slate-500 transition-colors"
          >
            예전 편지 더 보기
          </motion.button>
        )}
      </main>

      {/* FAB */}
      <div className="fixed left-1/2 -translate-x-1/2 bottom-0 w-full max-w-md pointer-events-none z-30">
        <div className="relative w-full h-full">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onWriteLetter}
            className="absolute right-6 bottom-6 w-14 h-14 bg-[#10B981] rounded-full shadow-[0_8px_24px_rgba(16,185,129,0.35)] flex items-center justify-center text-white pointer-events-auto"
          >
            <Pencil size={24} fill="currentColor" strokeWidth={1} className="ml-0.5" />
          </motion.button>
        </div>
      </div>

      {/* Full Letter & Comments Modal */}
      <AnimatePresence>
        {selectedLetter && (
          <LetterModal
            me={me}
            letter={selectedLetter}
            onClose={() => setSelectedLetter(null)}
            onHeart={() => onHeart(selectedLetter.id)}
            onEdit={onEdit}
            subscribeComments={subscribeComments}
            addComment={addComment}
            deleteComment={deleteComment}
          />
        )}
      </AnimatePresence>
    </div>
  );
}


// -----------------------------------------------------------------
// Letter Modal Sub-Component
// -----------------------------------------------------------------
function LetterModal({
  me, letter, onClose, onHeart, onEdit, subscribeComments, addComment, deleteComment
}: {
  me: '우댕' | '꼼이';
  letter: Letter;
  onClose: () => void;
  onHeart: () => void;
  onEdit?: Props['onEdit'];
  subscribeComments: Props['subscribeComments'];
  addComment: Props['addComment'];
  deleteComment: Props['deleteComment'];
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // 본문 수정 — 내가 보낸 편지만. 저장 후 즉시 반영 위해 로컬 오버라이드 사용.
  const isMine = letter.from === me;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(letter.body);
  const [savingEdit, setSavingEdit] = useState(false);
  const [bodyOverride, setBodyOverride] = useState<string | null>(null);
  const shownBody = bodyOverride ?? letter.body;
  const startEdit = () => { setDraft(shownBody); setEditing(true); };
  const saveEdit = async () => {
    if (savingEdit || !onEdit) return;
    const t = draft.trim();
    setSavingEdit(true);
    try { await onEdit(letter.id, t); setBodyOverride(t); setEditing(false); }
    catch { /* 실패 시 편집 상태 유지 */ }
    finally { setSavingEdit(false); }
  };

  // Subscribe to comments dynamically
  useEffect(() => {
    const unsubscribe = subscribeComments(letter.id, (newComments) => {
      setComments(newComments);
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    return () => unsubscribe();
  }, [letter.id, subscribeComments]);

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setIsSending(true);
    try {
      await addComment(letter.id, commentText);
      setCommentText('');
    } finally {
      setIsSending(false);
    }
  };

  // ── 편지 새 단장 1차(2026-11-06): 편지지(LetterPaper) + 읽기 판(LetterReadSheet) — 제미나이 시안 그대로, 여기는 연결만 ──
  const stampOf = (d: Date) => { const p = kstParts(d); return `${p.year}. ${p.month}. ${p.day}`; };
  const animated = letter.animatedSticker ? getAnimatedSticker(letter.animatedSticker) : undefined;
  const bigEmoticons = getEmoticonsByIds(letter.emoticonIds);
  const hasEnclosures = bigEmoticons.length > 0 || !!letter.voice || !!letter.doodle || !!animated;
  // 고치는 중에도 글 속에 미니를 넣게 — 쓰기 화면과 같은 규칙(서랍을 열면 글자칸이 포커스를 잃으니 커서를 기억).
  const editRef = useRef<HTMLTextAreaElement | null>(null);
  const editSel = useRef({ start: 0, end: 0 });
  const [editMiniOpen, setEditMiniOpen] = useState(false);
  const editParts = useMemo(() => splitMini(draft, me), [draft, me]);
  const editMiniItems = useMemo(() => miniItemsFor(me), [me]);
  const rememberEditSel = () => {
    const ta = editRef.current;
    if (ta) editSel.current = { start: ta.selectionStart ?? ta.value.length, end: ta.selectionEnd ?? ta.value.length };
  };
  useEffect(() => {
    const ta = editRef.current;
    if (!editing || !ta) return;
    const evs = ['select', 'keyup', 'click', 'input', 'blur'] as const;
    evs.forEach((e) => ta.addEventListener(e, rememberEditSel));
    return () => evs.forEach((e) => ta.removeEventListener(e, rememberEditSel));
  }, [editing]);
  const openEditMini = () => { rememberEditSel(); editRef.current?.blur(); setEditMiniOpen(true); };
  const closeEditMini = () => {
    setEditMiniOpen(false);
    requestAnimationFrame(() => {
      const ta = editRef.current;
      if (ta) { ta.focus(); ta.setSelectionRange(editSel.current.start, editSel.current.end); }
    });
  };
  const pickEditMini = (word: string) => {
    const { value, caret } = insertMiniToken(draft, editSel.current.start, editSel.current.end, word);
    setDraft(value);
    editSel.current = { start: caret, end: caret };
  };
  return (
    <LetterReadSheet
      fromName={letter.from}
      fullDateText={formatFullDate(letter.createdAt)}
      paper={
        <LetterPaper
          toName={letter.to}
          fromName={letter.from}
          dateText={stampOf(letter.createdAt)}
          parts={splitMini(shownBody, letter.from)}
          enclosures={hasEnclosures ? (
            <LetterEnclosures
              emoticons={bigEmoticons.map((e) => ({ id: e.id, label: e.label, imageUrl: e.imageUrl }))}
              animated={animated ? { label: animated.label, posterUrl: animated.posterUrl, videoUrl: animated.videoUrl } : null}
              voice={letter.voice ? <VoicePlayer src={letter.voice.src} mime={letter.voice.mime} durationHint={letter.voice.duration} /> : null}
              doodle={letter.doodle ? <DoodlePad mode="play" data={letter.doodle} autoPlay /> : null}
            />
          ) : undefined}
          canEdit={isMine && !!onEdit}
          editing={editing}
          editorSlot={
            <LetterEditor
              value={draft}
              onChange={setDraft}
              parts={editParts}
              textareaRef={editRef}
              placeholder="편지 내용을 고쳐 써 줘…"
              minRows={5}
              autoFocus
              onFocus={() => { if (editMiniOpen) setEditMiniOpen(false); }}
            />
          }
          onStartEdit={startEdit}
          onSaveEdit={() => { setEditMiniOpen(false); void saveEdit(); }}
          onCancelEdit={() => { setEditMiniOpen(false); setEditing(false); setDraft(shownBody); }}
          savingEdit={savingEdit}
          miniOpen={editMiniOpen}
          onToggleMini={() => (editMiniOpen ? closeEditMini() : openEditMini())}
        />
      }
      hearts={letter.hearts ?? 0}
      onHeart={onHeart}
      comments={comments.map((c) => ({ id: c.id, by: c.by, text: c.text, parts: splitMini(c.text, c.by), timeText: formatRelative(c.createdAt), mine: c.by === me }))}
      onDeleteComment={(id) => { if (confirm('댓글을 삭제할까요?')) deleteComment(letter.id, id); }}
      commentText={commentText}
      onCommentTextChange={setCommentText}
      onSubmitComment={() => { void handleSendComment({ preventDefault() {} } as React.FormEvent); }}
      commentSending={isSending}
      onClose={onClose}
      miniSheet={editing ? <MiniEmoticonSheet open={editMiniOpen} items={editMiniItems} onPick={pickEditMini} onClose={closeEditMini} /> : undefined}
    />
  );
}
