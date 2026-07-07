'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Send, Mail, Clock, Mic, Square, Play, Pause, Trash2, Pencil, Smile, X, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { sendLetter, uploadVoice, nameFromCode, partnerOf, type Doodle } from '@/lib/letters';
import { feedback } from '@/lib/feedback';
import { EMOTICON_SETS, getEmoticonsByIds } from '@/lib/emoticons';
import { ANIMATED_STICKERS, getAnimatedSticker } from '@/lib/animatedStickers';
import DoodlePad, { type DoodleData } from '@/components/DoodlePad';

const MAX_REC_SEC = 30;
const MAX_EMOTICONS_PER_LETTER = 3;

export default function NewLetterPage() {
  const router = useRouter();
  const [me, setMe] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [scheduled, setScheduled] = useState(false);
  const [openAtStr, setOpenAtStr] = useState('');

  // 음성 편지 — Storage 업로드 흐름: Blob을 그대로 들고 있다가 보낼 때만 업로드
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [voiceMime, setVoiceMime] = useState<string>('audio/webm');
  const [voiceDuration, setVoiceDuration] = useState<number>(0);
  const [voicePreviewUrl, setVoicePreviewUrl] = useState<string>('');
  const [recording, setRecording] = useState(false);
  const [secLeft, setSecLeft] = useState(MAX_REC_SEC);
  const [playing, setPlaying] = useState(false);
  const mrRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const recStartRef = useRef<number>(0); // 녹음 시작 시각(ms) — duration 정확 계산용
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const voice = voiceBlob; // canSend 등에서 사용 (boolean처럼)

  // 손글씨 — DoodlePad compose 모드가 onChange로 데이터 보내옴
  const [doodle, setDoodle] = useState<DoodleData | null>(null);
  const [showDoodle, setShowDoodle] = useState(false);
  const [showEmoticonSheet, setShowEmoticonSheet] = useState(false);
  const [activeEmoticonSetId, setActiveEmoticonSetId] = useState(EMOTICON_SETS[0]?.id ?? '');
  const [selectedEmoticonIds, setSelectedEmoticonIds] = useState<string[]>([]);
  // 움직이는 포차코 스티커 — 선택된 id 하나 (없으면 null) + 선택 시트
  const [animatedSticker, setAnimatedSticker] = useState<string | null>(null);
  const [showAnimSheet, setShowAnimSheet] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('kkom-user');
    if (!userStr) { router.push('/login'); return; }
    setMe(nameFromCode(JSON.parse(userStr).로그인코드));
  }, [router]);

  // 정리
  useEffect(() => {
    return () => {
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      if (tickRef.current) clearInterval(tickRef.current);
      if (mrRef.current?.state === 'recording') mrRef.current.stop();
      if (voicePreviewUrl) URL.revokeObjectURL(voicePreviewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const partner = me ? partnerOf(me) : '';

  // 녹음 시작 — 30초 자동 중지
  const startRecording = async () => {
    setError('');
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      setError('이 브라우저는 녹음을 지원하지 않아요.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime =
        MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4'
        : '';
      const mr = mime ? new MediaRecorder(stream, { mimeType: mime, audioBitsPerSecond: 32000 })
                      : new MediaRecorder(stream, { audioBitsPerSecond: 32000 });
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const finalMime = mime || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: finalMime });
        // Claude 참고(코드리뷰 #12): 예전엔 MAX_REC_SEC - secLeft로 계산했는데
        // 이 클로저의 secLeft가 시작값(30) 고정이라 항상 duration=1이 됐음.
        // 실제 경과 시간(ms 차이)으로 정확하게.
        const elapsedSec = Math.round((Date.now() - recStartRef.current) / 1000);
        const duration = Math.min(MAX_REC_SEC, Math.max(1, elapsedSec));
        // 이전 미리듣기 URL 해제
        if (voicePreviewUrl) URL.revokeObjectURL(voicePreviewUrl);
        const url = URL.createObjectURL(blob);
        setVoiceBlob(blob);
        setVoiceMime(finalMime);
        setVoiceDuration(duration);
        setVoicePreviewUrl(url);
        setRecording(false);
        setSecLeft(MAX_REC_SEC);
        if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
        if (stopTimerRef.current) { clearTimeout(stopTimerRef.current); stopTimerRef.current = null; }
      };
      mr.start();
      mrRef.current = mr;
      recStartRef.current = Date.now();
      setRecording(true);
      setSecLeft(MAX_REC_SEC);
      tickRef.current = setInterval(() => setSecLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
      stopTimerRef.current = setTimeout(() => stopRecording(), MAX_REC_SEC * 1000 + 200);
    } catch (e) {
      console.error(e);
      setError('마이크 권한이 필요해요.');
    }
  };

  const stopRecording = () => {
    if (mrRef.current?.state === 'recording') mrRef.current.stop();
  };

  const resetAudio = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    if (voicePreviewUrl) URL.revokeObjectURL(voicePreviewUrl);
    setVoiceBlob(null);
    setVoicePreviewUrl('');
    setVoiceDuration(0);
    setPlaying(false);
  };

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play(); setPlaying(true); }
  };

  const selectedEmoticons = getEmoticonsByIds(selectedEmoticonIds);
  const activeEmoticonSet = EMOTICON_SETS.find((set) => set.id === activeEmoticonSetId) ?? EMOTICON_SETS[0];
  const activeEmoticons = activeEmoticonSet ? getEmoticonsByIds(activeEmoticonSet.emoticonIds) : [];

  const addEmoticon = (id: string) => {
    setError('');
    setSelectedEmoticonIds((prev) => {
      if (prev.length >= MAX_EMOTICONS_PER_LETTER) {
        feedback(`이모티콘은 ${MAX_EMOTICONS_PER_LETTER}개까지`, 'error');
        setError(`이모티콘은 한 편지에 ${MAX_EMOTICONS_PER_LETTER}개까지 보낼 수 있어요.`);
        return prev;
      }
      // 햅틱 — 톡 짧게
      import('@/lib/feedback').then(({ haptic }) => haptic(20)).catch(() => {});
      return [...prev, id];
    });
  };

  const removeSelectedEmoticon = (index: number) => {
    import('@/lib/feedback').then(({ haptic }) => haptic(15)).catch(() => {});
    setSelectedEmoticonIds((prev) => prev.filter((_, i) => i !== index));
  };

  const canSend = (body.trim().length > 0 || !!voice || !!doodle || selectedEmoticonIds.length > 0 || !!animatedSticker) && !sending && !recording && (!scheduled || !!openAtStr);

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    setError('');
    try {
      let voicePayload = null;
      if (voiceBlob) {
        // Storage 업로드 — Firestore에는 짧은 URL 1개만 저장 (예전: base64 50KB → 지금: URL 100B)
        const url = await uploadVoice(voiceBlob, me);
        voicePayload = { mime: voiceMime, data: url, duration: voiceDuration };
      }
      await sendLetter(
        me,
        body,
        scheduled && openAtStr ? new Date(openAtStr) : null,
        voicePayload,
        doodle as Doodle | null,
        selectedEmoticonIds,
        animatedSticker
      );
      const partner = partnerOf(me);
      feedback(scheduled ? `⏳ ${partner}한테 예약 편지 보냈어` : `📨 ${partner}한테 편지 보냈어`);
      router.push('/');
    } catch (e) {
      console.error('편지 전송 실패:', e);
      feedback('편지 전송 실패. 다시 해보자', 'error');
      setError('편지를 보내지 못했어요. 잠시 후 다시 시도해 주세요.');
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="w-full max-w-md mx-auto p-6 space-y-5">
        <header className="flex items-center gap-3 pt-2">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-white/60 border border-white/60 text-slate-500 active:scale-90 transition-all"
            aria-label="뒤로"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2 text-emerald-600">
            <Mail size={18} strokeWidth={2.5} />
            <h1 className="text-lg font-black tracking-tight text-slate-900">
              {partner ? `${partner}에게 편지 쓰기` : '편지 쓰기'}
            </h1>
          </div>
        </header>

        {/* 글 */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card variant="glass">
            <CardContent className="p-5 space-y-3">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={`${partner || '상대'}에게 전할 마음을 적어보세요…`}
                rows={6}
                autoFocus
                className="w-full resize-none bg-transparent outline-none text-slate-700 leading-relaxed text-sm placeholder:text-slate-400"
              />
              {selectedEmoticons.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar rounded-2xl bg-emerald-50/70 border border-emerald-100 px-3 py-2">
                  {selectedEmoticons.map((item, index) => (
                    <motion.button
                      key={`${item.id}-${index}`}
                      type="button"
                      initial={{ opacity: 0, y: 8, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      onClick={() => removeSelectedEmoticon(index)}
                      className="relative w-20 h-20 rounded-2xl bg-white shadow-sm border border-white flex items-center justify-center shrink-0 active:scale-95 transition-transform overflow-hidden"
                      aria-label={`${item.label} 이모티콘 빼기`}
                    >
                      <img src={item.imageUrl} alt={item.label} className="w-[92%] h-[92%] object-contain" />
                      <span className="absolute -right-1 -top-1 w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-sm">
                        <X size={12} />
                      </span>
                    </motion.button>
                  ))}
                </div>
              )}
              {/* 움직이는 포차코 스티커 선택 시 프리뷰 (탭하면 빼기) */}
              {animatedSticker && (() => {
                const st = getAnimatedSticker(animatedSticker);
                if (!st) return null;
                return (
                  <div className="flex items-center gap-3 rounded-2xl bg-purple-50/70 border border-purple-100 px-3 py-2.5">
                    <video
                      src={st.videoUrl}
                      poster={st.posterUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-20 h-20 rounded-2xl object-cover bg-white shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-black text-purple-700">🐶 움직이는 포차코</p>
                      <p className="text-[11px] text-purple-400 font-bold">{st.label} · 편지에 붙어서 재생돼요</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAnimatedSticker(null)}
                      className="w-7 h-7 rounded-full bg-white text-slate-400 flex items-center justify-center shadow-sm active:scale-90"
                      aria-label="움직이는 포차코 빼기"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })()}
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEmoticonSheet(true)}
                    className="inline-flex items-center gap-2 rounded-full bg-white border border-emerald-100 px-3 py-2 text-[13px] font-bold text-emerald-700 shadow-sm active:scale-95 transition-all"
                  >
                    <Smile size={15} /> 이모티콘
                  </button>
                  {/* 움직이는 포차코 — 2종 이상이라 선택 시트 열기 */}
                  <button
                    type="button"
                    onClick={() => {
                      import('@/lib/feedback').then(({ haptic }) => haptic(20)).catch(() => {});
                      setShowAnimSheet(true);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-[13px] font-bold shadow-sm active:scale-95 transition-all ${
                      animatedSticker
                        ? 'bg-purple-500 border-purple-500 text-white'
                        : 'bg-white border-purple-100 text-purple-700'
                    }`}
                  >
                    🐶 움직이는 포차코
                  </button>
                </div>
                <span className="text-[11px] font-bold text-slate-400 shrink-0">
                  {selectedEmoticonIds.length}/{MAX_EMOTICONS_PER_LETTER}
                </span>
              </div>
              {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
            </CardContent>
          </Card>
        </motion.div>

        {/* 보이스 편지 (30초) */}
        <div className="rounded-2xl bg-white/60 border border-white px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-600 flex items-center gap-2">
              <Mic size={15} /> 보이스 편지 <span className="text-[10px] text-slate-400 font-medium">(30초)</span>
            </span>
            {voiceBlob && (
              <span className="text-[11px] text-emerald-600 font-bold">
                녹음됨 · 약 {voiceDuration}초
              </span>
            )}
          </div>

          {!voiceBlob && !recording && (
            <button
              onClick={startRecording}
              className="w-full py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              <Mic size={15} /> 녹음 시작
            </button>
          )}

          {recording && (
            <button
              onClick={stopRecording}
              className="w-full py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              <Square size={14} fill="currentColor" />
              <span className="flex items-center gap-1.5">
                녹음 중 · <strong>{secLeft}초</strong> 남음
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              </span>
            </button>
          )}

          {voiceBlob && !recording && (
            <div className="flex items-center gap-2">
              <audio
                ref={audioRef}
                src={voicePreviewUrl}
                onEnded={() => setPlaying(false)}
                className="hidden"
              />
              <button
                onClick={togglePlay}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                {playing ? <Pause size={14} /> : <Play size={14} />}
                {playing ? '일시정지' : '들어보기'}
              </button>
              <button
                onClick={resetAudio}
                className="py-2.5 px-3 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-red-500 transition-colors"
                aria-label="다시 녹음"
              >
                <Trash2 size={15} />
              </button>
            </div>
          )}
        </div>

        {/* 손글씨 첨부 */}
        <div className="rounded-2xl bg-white/60 border border-white px-4 py-3 space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-bold text-slate-600 flex items-center gap-2">
              <Pencil size={15} /> 손글씨 첨부
              {doodle && <span className="text-[11px] text-emerald-600 font-bold ml-1">· 그림 있음</span>}
            </span>
            <input
              type="checkbox"
              checked={showDoodle}
              onChange={(e) => {
                setShowDoodle(e.target.checked);
                if (!e.target.checked) setDoodle(null);
              }}
              className="w-5 h-5 accent-emerald-500"
            />
          </label>
          {showDoodle && (
            <div className="pt-1">
              <DoodlePad
                mode="compose"
                onChange={(d) => setDoodle(d)}
              />
              <p className="text-[11px] text-slate-400 leading-tight mt-2 px-1">
                ✏️ 그린 순서·속도 그대로 {partner || '상대'}에게 재생돼요
              </p>
            </div>
          )}
        </div>

        {/* 예약 편지 */}
        <div className="rounded-2xl bg-white/50 border border-white px-4 py-3 space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-bold text-slate-600 flex items-center gap-2">
              <Clock size={15} /> 예약 편지로 보내기
            </span>
            <input
              type="checkbox"
              checked={scheduled}
              onChange={(e) => setScheduled(e.target.checked)}
              className="w-5 h-5 accent-emerald-500"
            />
          </label>
          {scheduled && (
            <input
              type="datetime-local"
              value={openAtStr}
              onChange={(e) => setOpenAtStr(e.target.value)}
              className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-emerald-300"
            />
          )}
          {scheduled && (
            <p className="text-[11px] text-slate-400 leading-tight">
              이 날짜·시각이 되면 {partner || '상대'}에게 도착해요. 그 전엔 잠겨 있어요 🔒
            </p>
          )}
        </div>

        <button
          onClick={handleSend}
          disabled={!canSend}
          className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-black text-sm shadow-lg shadow-emerald-200/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:active:scale-100"
        >
          <Send size={16} strokeWidth={2.5} />
          {sending ? '보내는 중…' : scheduled ? '예약 편지 보내기' : '편지 보내기'}
        </button>
      </div>

      {/* 움직이는 포차코 선택 시트 */}
      <AnimatePresence>
        {showAnimSheet && (
          <>
            <motion.button
              type="button"
              aria-label="닫기"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAnimSheet(false)}
              className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ y: 360, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 360, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-x-4 bottom-4 z-50 max-w-md mx-auto rounded-[32px] bg-[#F7F9F9] border border-white shadow-[0_24px_70px_rgba(15,23,42,0.22)] overflow-hidden"
            >
              <div className="px-5 pt-4 pb-3 bg-white/80 flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-black text-purple-500 flex items-center gap-1">
                    <Sparkles size={13} /> Moving Pochacco
                  </p>
                  <h2 className="text-lg font-black text-slate-900 mt-0.5">움직이는 포차코 붙이기</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAnimSheet(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center active:scale-95"
                  aria-label="닫기"
                ><X size={17} /></button>
              </div>
              <div className="px-5 pb-6 pt-3 grid grid-cols-2 gap-3">
                {ANIMATED_STICKERS.map((st) => {
                  const selected = animatedSticker === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        import('@/lib/feedback').then(({ haptic }) => haptic(20)).catch(() => {});
                        setAnimatedSticker(selected ? null : st.id);
                        setShowAnimSheet(false);
                      }}
                      className={`relative rounded-[22px] p-2 border-2 transition-all ${
                        selected ? 'border-purple-400 bg-purple-50 shadow-sm' : 'border-slate-100 bg-white'
                      }`}
                    >
                      <video
                        src={st.videoUrl}
                        poster={st.posterUrl}
                        autoPlay loop muted playsInline
                        className="w-full aspect-square rounded-2xl object-cover bg-white"
                      />
                      <p className="mt-1.5 text-[12px] font-black text-slate-700">{st.label}</p>
                      {selected && (
                        <span className="absolute top-1 right-1 w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-md">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="px-5 pb-5 -mt-2 text-center text-[11px] font-bold text-slate-400">
                편지에 붙으면 상대 화면에서 재생돼요
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEmoticonSheet && (
          <>
            <motion.button
              type="button"
              aria-label="이모티콘 닫기"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEmoticonSheet(false)}
              className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ y: 360, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 360, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-x-4 bottom-4 z-50 max-w-md mx-auto rounded-[32px] bg-[#F7F9F9] border border-white shadow-[0_24px_70px_rgba(15,23,42,0.22)] overflow-hidden"
            >
              <div className="px-5 pt-4 pb-3 bg-white/80">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[12px] font-black text-emerald-500 flex items-center gap-1">
                      <Sparkles size={13} /> Emoticon Letter
                    </p>
                    <h2 className="text-lg font-black text-slate-900 mt-0.5">마음 하나 톡 붙이기</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEmoticonSheet(false)}
                    className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center active:scale-95 transition-transform"
                    aria-label="이모티콘 닫기"
                  >
                    <X size={17} />
                  </button>
                </div>
              </div>

              {/* 선택된 이모티콘 미리보기 — 모달 안에서 항상 보이게 (사용자 신고: 가려져서 안 보였음) */}
              <div className="px-5 py-2.5 bg-emerald-50/40 border-y border-emerald-100/60">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-500">담은 이모티콘</span>
                  <span className={`text-[11px] font-black ${selectedEmoticonIds.length >= MAX_EMOTICONS_PER_LETTER ? 'text-rose-500' : 'text-emerald-600'}`}>
                    {selectedEmoticonIds.length} / {MAX_EMOTICONS_PER_LETTER}
                  </span>
                </div>
                {selectedEmoticonIds.length > 0 ? (
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    <AnimatePresence>
                      {selectedEmoticonIds.map((id, idx) => {
                        const it = getEmoticonsByIds([id])[0];
                        if (!it) return null;
                        return (
                          <motion.button
                            key={`${id}-${idx}`}
                            type="button"
                            initial={{ scale: 0.4, opacity: 0, rotate: -15 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            exit={{ scale: 0.4, opacity: 0 }}
                            transition={{ type: 'spring', damping: 18, stiffness: 320 }}
                            onClick={() => removeSelectedEmoticon(idx)}
                            className="relative shrink-0 w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center"
                            aria-label={`${it.label} 빼기`}
                          >
                            <img src={it.imageUrl} alt="" className="w-full h-full object-contain p-1" />
                            <span className="absolute -top-1 -right-1 bg-slate-800 text-white w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-black">×</span>
                          </motion.button>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 py-1">탭하면 여기 담겨요</p>
                )}
              </div>

              <div className="px-5 py-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
                {EMOTICON_SETS.map((set) => (
                  <button
                    key={set.id}
                    type="button"
                    onClick={() => setActiveEmoticonSetId(set.id)}
                    className={`flex items-center gap-2 shrink-0 rounded-full px-3 py-2 text-[12px] font-black border transition-all ${
                      activeEmoticonSetId === set.id
                        ? 'bg-white border-emerald-200 text-emerald-700 shadow-sm'
                        : 'bg-white/50 border-transparent text-slate-500'
                    }`}
                  >
                    <img src={set.thumbnailUrl} alt="" className="w-7 h-7 object-contain" />
                    {set.title}
                  </button>
                ))}
              </div>

              {(() => {
                const maxed = selectedEmoticonIds.length >= MAX_EMOTICONS_PER_LETTER;
                return (
                  <div className="px-5 pb-5">
                    <div className={`grid grid-cols-3 gap-2.5 ${maxed ? 'opacity-50 pointer-events-none' : ''}`}>
                      {activeEmoticons.map((item) => {
                        const usedCount = selectedEmoticonIds.filter((id) => id === item.id).length;
                        return (
                          <motion.button
                            key={item.id}
                            type="button"
                            whileTap={{ scale: 0.88, rotate: -3 }}
                            animate={usedCount > 0 ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                            transition={{ duration: 0.3 }}
                            onClick={() => addEmoticon(item.id)}
                            className="relative aspect-square rounded-[26px] bg-white border border-slate-100 shadow-[0_6px_18px_rgba(15,23,42,0.04)] flex items-center justify-center active:border-emerald-200 transition-colors overflow-hidden p-1.5"
                            aria-label={`${item.label} 이모티콘 선택`}
                          >
                            <img src={item.imageUrl} alt={item.label} className="w-full h-full object-contain drop-shadow-sm" />
                            {usedCount > 0 && (
                              <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[11px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-md ring-2 ring-white">
                                {usedCount}
                              </span>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                    <p className="mt-3 text-center text-[11px] font-bold text-slate-400">
                      {maxed ? '꽉 찼어요. 이모티콘을 빼면 더 담을 수 있어요.' : '글 없이 이모티콘만 보내도 알림에 마음이 같이 전해져요.'}
                    </p>
                  </div>
                );
              })()}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
