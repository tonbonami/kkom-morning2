'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { sendLetter, uploadVoice, nameFromCode, partnerOf, type Doodle } from '@/lib/letters';
import { feedback } from '@/lib/feedback';
import { emoticonSetsFor, getEmoticonsByIds } from '@/lib/emoticons';
import { signFor } from '@/lib/letterSign';
import { ANIMATED_STICKERS, getAnimatedSticker } from '@/lib/animatedStickers';
import DoodlePad, { type DoodleData } from '@/components/DoodlePad';
import { splitMini, miniItemsFor, insertMiniToken } from '@/lib/miniEmoticons';
import { formatKstLocale, kstParts } from '@/lib/kst';
import { LetterComposeScreen, type LetterTool } from '@/components/letter/LetterComposeScreen';
import { LetterEditor } from '@/components/letter/LetterEditor';
import { MiniEmoticonSheet } from '@/components/letter/MiniEmoticonSheet';
import { LetterVoicePanel } from '@/components/letter/LetterVoicePanel';
import { LetterSchedulePanel } from '@/components/letter/LetterSchedulePanel';
import { LetterStickerPanel } from '@/components/letter/LetterStickerPanel';
import { LetterPaper } from '@/components/letter/LetterPaper';
import { LetterEmoticonSheet } from '@/components/letter/LetterEmoticonSheet';
import { LetterAnimSheet } from '@/components/letter/LetterAnimSheet';
import { LetterEnclosures } from '@/components/letter/LetterEnclosures';

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
  const [showEmoticonSheet, setShowEmoticonSheet] = useState(false);
  const [activeEmoticonSetId, setActiveEmoticonSetId] = useState('');
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
  // 팩 탭 — 내 캐릭터 팩 먼저(emoticonSetsFor). 탭을 아직 안 눌렀으면 첫 팩.
  const sheetSets = useMemo(() => emoticonSetsFor(me).map((set) => ({
    id: set.id, title: set.title, thumbUrl: set.thumbnailUrl, animated: set.animated,
    items: getEmoticonsByIds(set.emoticonIds).map((e) => ({ id: e.id, label: e.label, thumbUrl: e.thumbUrl ?? e.imageUrl })),
  })), [me]);
  const activeSheetSetId = activeEmoticonSetId || sheetSets[0]?.id || '';
  const mySign = signFor(me);

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

  // ── 편지 새 단장 1차(2026-11-06, GPT 상의 docs/gpt-letter-upgrade-*.md · 제미나이 시안 src/components/letter/*) ──
  //   글 속 미니 이모티콘: 글자칸엔 `(사랑해)` 그대로, 보여 줄 때만 그림(src/lib/miniEmoticons.ts — 꼼톡과 같은 목록).
  //   미니 서랍을 열면 글자칸이 포커스를 잃으니, 넣을 자리(커서)를 미리 기억해 둔다(selRef).
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const selRef = useRef({ start: 0, end: 0 });
  const [miniOpen, setMiniOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<LetterTool | null>(null);
  const bodyParts = useMemo(() => splitMini(body, me), [body, me]);
  const miniItems = useMemo(() => miniItemsFor(me), [me]);
  const rememberSel = () => {
    const ta = taRef.current;
    if (ta) selRef.current = { start: ta.selectionStart ?? ta.value.length, end: ta.selectionEnd ?? ta.value.length };
  };
  // 글자칸의 커서가 움직일 때마다 기억 — 미리보기를 열면 글자칸이 사라졌다 다시 생기므로 previewOpen 에도 다시 건다.
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    const evs = ['select', 'keyup', 'click', 'input', 'blur'] as const;
    evs.forEach((e) => ta.addEventListener(e, rememberSel));
    return () => evs.forEach((e) => ta.removeEventListener(e, rememberSel));
  }, [previewOpen]);
  const openMini = () => { rememberSel(); taRef.current?.blur(); setMiniOpen(true); };
  const closeMini = () => {
    setMiniOpen(false);
    setPreviewOpen(false);
    requestAnimationFrame(() => {
      const ta = taRef.current;
      if (ta) { ta.focus(); ta.setSelectionRange(selRef.current.start, selRef.current.end); }
    });
  };
  const pickMini = (word: string) => {
    const { value, caret } = insertMiniToken(body, selRef.current.start, selRef.current.end, word);
    setBody(value);
    selRef.current = { start: caret, end: caret };
    import('@/lib/feedback').then(({ haptic }) => haptic(15)).catch(() => {});
  };

  const now = new Date();
  const dateText = formatKstLocale(now, { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  const stamp = (() => { const p = kstParts(now); return `${p.year}. ${p.month}. ${p.day}`; })();
  const animatedSt = animatedSticker ? getAnimatedSticker(animatedSticker) : undefined;
  const stickerCount = selectedEmoticonIds.length + (animatedSticker ? 1 : 0);
  const toolBadges: Partial<Record<LetterTool, string>> = {
    ...(recording ? { voice: '녹음 중' } : voiceBlob ? { voice: `${voiceDuration}초` } : {}),
    ...(doodle ? { doodle: '그림' } : {}),
    ...(stickerCount ? { sticker: `${stickerCount}` } : {}),
    ...(scheduled && openAtStr ? { schedule: (() => { const d = new Date(openAtStr); const p = kstParts(d); return `${p.month}/${p.day} ${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`; })() } : {}),
  };
  const toolPanel =
    activeTool === 'voice' ? (
      <LetterVoicePanel
        state={recording ? 'recording' : voiceBlob ? 'recorded' : 'idle'}
        secLeft={secLeft}
        duration={voiceDuration}
        playing={playing}
        onStart={startRecording}
        onStop={stopRecording}
        onTogglePlay={togglePlay}
        onDelete={resetAudio}
      />
    ) : activeTool === 'doodle' ? (
      <DoodlePad mode="compose" initialData={doodle ?? undefined} onChange={(d) => setDoodle(d)} onDone={() => setActiveTool(null)} />
    ) : activeTool === 'sticker' ? (
      <LetterStickerPanel
        emoticons={selectedEmoticons.map((e) => ({ id: e.id, label: e.label, imageUrl: e.imageUrl }))}
        max={MAX_EMOTICONS_PER_LETTER}
        onAddEmoticon={() => setShowEmoticonSheet(true)}
        onRemoveEmoticon={removeSelectedEmoticon}
        animated={animatedSt ? { label: animatedSt.label, posterUrl: animatedSt.posterUrl, videoUrl: animatedSt.videoUrl } : null}
        onPickAnimated={() => setShowAnimSheet(true)}
        onRemoveAnimated={() => setAnimatedSticker(null)}
        sign={mySign}
      />
    ) : activeTool === 'schedule' ? (
      <LetterSchedulePanel enabled={scheduled} onEnabledChange={setScheduled} value={openAtStr} onChange={setOpenAtStr} toName={partner} />
    ) : null;

  return (
    <>
      {/* 들어보기용 — 음성 칸을 접어도 재생이 끊기지 않게 화면 밖에 둔다 */}
      {voicePreviewUrl && <audio ref={audioRef} src={voicePreviewUrl} onEnded={() => setPlaying(false)} className="hidden" />}
      <LetterComposeScreen
        toName={partner}
        fromName={me}
        dateText={dateText}
        editor={
          <LetterEditor
            value={body}
            onChange={setBody}
            parts={bodyParts}
            textareaRef={taRef}
            placeholder={`${partner || '상대'}에게 전할 마음을 적어 보세요…`}
            autoFocus
            onFocus={() => { if (miniOpen) setMiniOpen(false); }}
          />
        }
        miniOpen={miniOpen}
        onToggleMini={() => (miniOpen ? closeMini() : openMini())}
        previewOpen={previewOpen}
        onTogglePreview={() => { rememberSel(); setPreviewOpen((v) => !v); }}
        preview={<LetterPaper toName={partner} fromName={me} dateText={stamp} parts={bodyParts} preview
          enclosures={selectedEmoticons.length > 0 || animatedSt ? (
            <LetterEnclosures
              emoticons={selectedEmoticons.map((e) => ({ id: e.id, label: e.label, imageUrl: e.imageUrl }))}
              animated={animatedSt ? { label: animatedSt.label, posterUrl: animatedSt.posterUrl, videoUrl: animatedSt.videoUrl } : null}
              voice={null}
              doodle={null}
              sign={mySign}
            />
          ) : undefined} />}
        activeTool={activeTool}
        onToolChange={setActiveTool}
        toolBadges={toolBadges}
        toolPanel={toolPanel}
        miniSheet={<MiniEmoticonSheet open={miniOpen} items={miniItems} onPick={pickMini} onClose={closeMini} />}
        error={error}
        canSend={canSend}
        sending={sending}
        scheduled={scheduled}
        onSend={handleSend}
        onBack={() => router.back()}
      />
      {/* 큰 이모티콘·움직이는 포차코 고르는 창 — Gemini 시안(src/components/letter, 2026-11-07). 예전 초록·보라 창을 바꿈 */}
      <LetterEmoticonSheet
        open={showEmoticonSheet}
        sets={sheetSets}
        activeSetId={activeSheetSetId}
        onSetChange={setActiveEmoticonSetId}
        selected={selectedEmoticons.map((e) => ({ id: e.id, label: e.label, thumbUrl: e.thumbUrl ?? e.imageUrl }))}
        max={MAX_EMOTICONS_PER_LETTER}
        onAdd={addEmoticon}
        onRemove={removeSelectedEmoticon}
        onClose={() => setShowEmoticonSheet(false)}
        sign={mySign}
      />
      <LetterAnimSheet
        open={showAnimSheet}
        items={ANIMATED_STICKERS}
        selectedId={animatedSticker}
        onPick={(id) => {
          import('@/lib/feedback').then(({ haptic }) => haptic(20)).catch(() => {});
          setAnimatedSticker(id);
          setShowAnimSheet(false);
        }}
        onClose={() => setShowAnimSheet(false)}
      />
    </>
  );
}
