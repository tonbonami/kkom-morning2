'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Send, Mail, Clock, Mic, Square, Play, Pause, Trash2, Pencil, Smile, X, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { sendLetter, uploadVoice, nameFromCode, partnerOf, type Doodle } from '@/lib/letters';
import { EMOTICON_SETS, getEmoticonsByIds } from '@/lib/emoticons';
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
        const duration = Math.max(1, MAX_REC_SEC - secLeft);
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
        setError(`이모티콘은 한 편지에 ${MAX_EMOTICONS_PER_LETTER}개까지 보낼 수 있어요.`);
        return prev;
      }
      return [...prev, id];
    });
  };

  const removeSelectedEmoticon = (index: number) => {
    setSelectedEmoticonIds((prev) => prev.filter((_, i) => i !== index));
  };

  const canSend = (body.trim().length > 0 || !!voice || !!doodle || selectedEmoticonIds.length > 0) && !sending && !recording && (!scheduled || !!openAtStr);

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
        selectedEmoticonIds
      );
      router.push('/');
    } catch (e) {
      console.error('편지 전송 실패:', e);
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
                      className="relative w-14 h-14 rounded-2xl bg-white shadow-sm border border-white flex items-center justify-center shrink-0 active:scale-95 transition-transform"
                      aria-label={`${item.label} 이모티콘 빼기`}
                    >
                      <img src={item.imageUrl} alt={item.label} className="w-11 h-11 object-contain" />
                      <span className="absolute -right-1 -top-1 w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-sm">
                        <X size={12} />
                      </span>
                    </motion.button>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowEmoticonSheet(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-white border border-emerald-100 px-3 py-2 text-[13px] font-bold text-emerald-700 shadow-sm active:scale-95 transition-all"
                >
                  <Smile size={15} /> 이모티콘
                </button>
                <span className="text-[11px] font-bold text-slate-400">
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

              <div className="px-5 pb-5">
                <div className="grid grid-cols-3 gap-3">
                  {activeEmoticons.map((item) => (
                    <motion.button
                      key={item.id}
                      type="button"
                      whileTap={{ scale: 0.9, rotate: -2 }}
                      onClick={() => addEmoticon(item.id)}
                      className="aspect-square rounded-[26px] bg-white border border-slate-100 shadow-[0_6px_18px_rgba(15,23,42,0.04)] flex flex-col items-center justify-center gap-1.5 active:border-emerald-200 transition-colors"
                    >
                      <img src={item.imageUrl} alt={item.label} className="w-14 h-14 object-contain drop-shadow-sm" />
                      <span className="text-[12px] font-black text-slate-600">{item.label}</span>
                    </motion.button>
                  ))}
                </div>
                <p className="mt-3 text-center text-[11px] font-bold text-slate-400">
                  글 없이 이모티콘만 보내도 알림에 마음이 같이 전해져요.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
