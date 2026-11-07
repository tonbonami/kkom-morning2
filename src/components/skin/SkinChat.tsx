'use client';
// 배선: summary.dayWord(기본 「오늘」) — 오늘 상담이 없고 어제 정리 안 한 상담이 있으면 「어제 상담 정리하기」(우댕 2026-10-22).
// 제미나이 7차(gemini-3-flash CLI): 입력 막대 바로 위 「✨ 오늘 상담 정리하기」 알약 버튼(summary prop), 우댕 폰은 정리가 있을 때만 「오늘 상담 정리 보기」. 값 그대로.
// 제미나이 7차: 「오늘 상담 정리하기」 버튼 추가 (입력바 위 알약 모양, 상태별 문구 변화). 꼼이 입력 중일 땐 흐리게. 여백 조정.
// 사진 첨부: 일지 최근 사진 선택 + 새 사진 촬영/선택, 입력바 내 썸네일 및 동적 높이 대응, 대화창 썸네일 및 전체화면 보기 지원.

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Send,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Image as ImageIcon,
  Camera,
  X,
  Check,
} from 'lucide-react';

export default function SkinChat({
  messages,
  streamingText,
  onSend,
  sending,
  onBack,
  suggestions,
  readOnly = false,
  usage = null,
  summary = null,
  attach = null,
}: {
  messages: { id: string; role: 'user' | 'assistant'; text: string; at: string; photos?: { url: string }[] }[];
  streamingText: string | null;
  onSend: (text: string) => void;
  sending: boolean;
  onBack: () => void;
  suggestions: string[];
  readOnly?: boolean;
  usage?: {
    today: { count: number; won: number };
    month: { count: number; won: number };
    total: { count: number; won: number };
    limit: number;
  } | null;
  summary?: { state: 'none' | 'draft' | 'applied'; onOpen: () => void; dayWord?: string } | null;
  attach?: {
    pending: { key: string; url: string; uploading?: boolean }[];
    max: number;
    recent: { key: string; url: string; label: string }[];
    loadingRecent?: boolean;
    onOpen: () => void;
    onAddNew: (file: File) => void;
    onPickRecent: (key: string) => void;
    onRemove: (key: string) => void;
  } | null;
}) {
  const [input, setInput] = useState('');
  const [isUsageExpanded, setIsUsageExpanded] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [inputBarHeight, setInputBarHeight] = useState(readOnly ? 56 : 76);

  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  useEffect(() => {
    if (!inputBarRef.current) return;
    const el = inputBarRef.current;
    const updateHeight = () => {
      setInputBarHeight(el.offsetHeight);
    };
    updateHeight();
    const ro = new ResizeObserver(() => updateHeight());
    ro.observe(el);
    return () => ro.disconnect();
  }, [readOnly, attach?.pending?.length]);

  const isUploading = attach?.pending.some((p) => p.uploading) ?? false;
  const hasPhotos = (attach?.pending.length ?? 0) > 0;
  const canSend = (input.trim().length > 0 || hasPhotos) && !sending && !readOnly && !isUploading;
  const isMaxPending = (attach?.pending.length ?? 0) >= (attach?.max ?? 3);

  const handleSend = () => {
    if (!canSend) return;
    onSend(input.trim());
    setInput('');
  };

  const handleOpenSheet = () => {
    if (!attach) return;
    attach.onOpen();
    setIsSheetOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && attach) {
      attach.onAddNew(file);
    }
    if (e.target) e.target.value = '';
  };

  const LoadingPulse = () => (
    <span className="inline-block w-8 h-3 bg-[var(--sd-line)] animate-pulse rounded-sm align-middle" />
  );

  const renderSummaryButton = () => {
    if (!summary) return null;
    if (readOnly && summary.state === 'none') return null;

    const day = summary.dayWord ?? '오늘';
    let label = '';
    if (readOnly) {
      label = `${day} 상담 정리 보기`;
    } else {
      if (summary.state === 'none') label = `✨ ${day} 상담 정리하기`;
      else if (summary.state === 'draft') label = '정리 이어서 보기 · 아직 반영 전';
      else if (summary.state === 'applied') label = `${day} 정리 다시 보기 ✓`;
    }

    return (
      <div
        style={{ bottom: readOnly ? '68px' : `${inputBarHeight + 12}px` }}
        className={`fixed left-0 right-0 max-w-md mx-auto px-4 flex justify-center z-20 pointer-events-none transition-[bottom,opacity] duration-150 ${
          !readOnly && sending ? 'opacity-40' : 'opacity-100'
        }`}
      >
        <motion.button
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          whileTap={{ scale: 0.96 }}
          onClick={summary.onOpen}
          className="pointer-events-auto h-10 px-5 rounded-full bg-[var(--sd-card-solid)] border border-[var(--sd-rel)] text-[var(--sd-rel)] text-[13px] font-bold shadow-lg flex items-center gap-2"
        >
          {label}
        </motion.button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--sd-surface-2)] flex flex-col max-w-md mx-auto text-[var(--sd-ink)] relative">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 bg-[var(--sd-card-solid)] border-b border-[var(--sd-line)] z-10 sticky top-0">
        <button onClick={onBack} className="p-2 -ml-2" aria-label="뒤로 가기">
          <ArrowLeft size={24} />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="font-bold">Claude</h1>
          <span className="text-[10px] bg-[var(--sd-surface-2)] px-2 py-0.5 rounded-full mt-0.5 text-[var(--sd-muted)] font-medium">
            Anthropic의 AI
          </span>
        </div>
        <div className="w-10" />
      </div>

      {/* 경고 띠 */}
      <div className="bg-[color-mix(in_srgb,var(--sd-crit)_12%,transparent)] text-[var(--sd-crit)] text-[12px] py-2 px-4 text-center font-medium">
        진단이 아니라 기록을 같이 보는 대화예요 · 입술·혀·목이 붓거나 숨이 차면 119
      </div>

      {/* Claude 사용량 카드 (우댕 폰 / readOnly일 때만) */}
      {readOnly && (
        <div className="px-4 pt-3 pb-1">
          <div className="sd-card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-[var(--sd-muted)]">Claude 사용량</span>
              <button
                onClick={() => setIsUsageExpanded(!isUsageExpanded)}
                className="text-[10px] text-[var(--sd-rel)] flex items-center gap-0.5"
              >
                {isUsageExpanded ? (
                  <>접기 <ChevronUp size={12} /></>
                ) : (
                  <>자세히 <ChevronDown size={12} /></>
                )}
              </button>
            </div>

            <AnimatePresence initial={false}>
              {isUsageExpanded ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <div className="text-[16px] font-bold mb-0.5">
                        {usage ? `${usage.today.count}번` : <LoadingPulse />}
                      </div>
                      <div className="text-[10px] text-[var(--sd-muted)]">오늘</div>
                      <div className="text-[10px] text-[var(--sd-faint)]">
                        {usage ? `약 ₩${usage.today.won.toLocaleString('ko-KR')}` : <LoadingPulse />}
                      </div>
                    </div>
                    <div className="text-center border-x border-[var(--sd-line)]">
                      <div className="text-[16px] font-bold mb-0.5">
                        {usage ? `${usage.month.count}번` : <LoadingPulse />}
                      </div>
                      <div className="text-[10px] text-[var(--sd-muted)]">이번 달</div>
                      <div className="text-[10px] text-[var(--sd-faint)]">
                        {usage ? `약 ₩${usage.month.won.toLocaleString('ko-KR')}` : <LoadingPulse />}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-[16px] font-bold mb-0.5">
                        {usage ? `${usage.total.count}번` : <LoadingPulse />}
                      </div>
                      <div className="text-[10px] text-[var(--sd-muted)]">지금까지</div>
                      <div className="text-[10px] text-[var(--sd-faint)]">
                        {usage ? `약 ₩${usage.total.won.toLocaleString('ko-KR')}` : <LoadingPulse />}
                      </div>
                    </div>
                  </div>
                  <p className="text-[9px] text-[var(--sd-faint)] text-center mt-4">
                    토큰 수로 어림한 값이에요 · 하루 상한 {usage?.limit ?? 60}번
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-1"
                >
                  <p className="text-[13px] font-medium text-[var(--sd-ink)]">
                    이번 달 {usage ? `${usage.month.count}번` : '...'} · 약 {usage ? `₩${usage.month.won.toLocaleString('ko-KR')}` : '...'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* 대화 영역 */}
      <div
        style={{ paddingBottom: `${inputBarHeight + (summary ? 64 : 20)}px` }}
        className="flex-1 overflow-y-auto p-4 space-y-6"
      >
        {messages.length === 0 && !streamingText && (
          <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
            {readOnly ? (
              <p className="text-[14px] text-[var(--sd-muted)]">아직 꼼이가 상담한 내용이 없어요</p>
            ) : (
              <>
                <p className="text-sm text-[var(--sd-muted)] mb-2">어떤 것이 궁금한가요?</p>
                {suggestions.map((sug, i) => (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => onSend(sug)}
                    className="bg-[var(--sd-card-solid)] border border-[var(--sd-line)] px-5 py-2.5 rounded-full text-[14px] shadow-sm"
                  >
                    {sug}
                  </motion.button>
                ))}
              </>
            )}
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const msgPhotos = isUser && msg.photos && msg.photos.length > 0 ? msg.photos : null;
          const hasText = Boolean(msg.text && msg.text.trim().length > 0);

          return (
            <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                  isUser
                    ? 'bg-[var(--sd-rel-soft)] text-[var(--sd-ink)] rounded-tr-sm'
                    : 'bg-[var(--sd-card-solid)] border border-[var(--sd-line)] rounded-tl-sm'
                } ${msgPhotos && !hasText ? 'p-1.5' : 'p-4'}`}
              >
                {msgPhotos && (
                  <div
                    className={`grid gap-1.5 ${
                      msgPhotos.length === 1
                        ? 'grid-cols-1 max-w-[200px]'
                        : msgPhotos.length === 2
                        ? 'grid-cols-2'
                        : 'grid-cols-3'
                    } ${hasText ? 'mb-2.5' : ''}`}
                  >
                    {msgPhotos.map((photo, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => setPreviewPhoto(photo.url)}
                        className="relative aspect-square rounded-xl overflow-hidden bg-[var(--sd-surface-2)] border border-[var(--sd-line)] block focus:outline-none active:scale-[0.98] transition-transform"
                      >
                        <img
                          src={photo.url}
                          alt="보낸 사진"
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
                {hasText && <div className="whitespace-pre-wrap">{msg.text}</div>}
              </div>
              <span className="text-[10px] text-[var(--sd-muted)] mt-1.5 px-1">{msg.at}</span>
            </div>
          );
        })}

        {streamingText && (
          <div className="flex flex-col items-start">
            <div className="max-w-[85%] p-4 rounded-2xl bg-[var(--sd-card-solid)] border border-[var(--sd-line)] rounded-tl-sm shadow-sm whitespace-pre-wrap text-[15px] leading-relaxed">
              {streamingText}
              <span className="inline-block w-1.5 h-4 ml-1 bg-[var(--sd-muted)] animate-pulse align-middle" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* 오늘 상담 정리 버튼 */}
      {renderSummaryButton()}

      {/* 하단 입력바 또는 안내문 */}
      {readOnly ? (
        <div
          ref={inputBarRef}
          className="bg-[var(--sd-surface-2)] border-t border-[var(--sd-line)] fixed bottom-0 left-0 right-0 max-w-md mx-auto py-4 px-4 text-center z-10"
        >
          <p className="text-[12px] text-[var(--sd-faint)] font-medium">보기 전용이에요 — 상담은 꼼이만 해요</p>
        </div>
      ) : (
        <div
          ref={inputBarRef}
          className="p-3 bg-[var(--sd-card-solid)] border-t border-[var(--sd-line)] fixed bottom-0 left-0 right-0 max-w-md mx-auto z-10"
        >
          <div className="bg-[var(--sd-surface-2)] rounded-[24px] p-2 pl-2">
            {/* 보낼 사진 썸네일 줄 */}
            {attach && attach.pending.length > 0 && (
              <div className="flex items-center gap-2 px-1 pt-1 pb-2 overflow-x-auto">
                {attach.pending.map((p) => (
                  <div
                    key={p.key}
                    className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-[var(--sd-line)] bg-[var(--sd-card-solid)]"
                  >
                    <img
                      src={p.url}
                      alt="보낸 사진"
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                    {p.uploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => attach.onRemove(p.key)}
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center active:scale-90"
                      aria-label="삭제"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end">
              {attach && (
                <button
                  type="button"
                  onClick={handleOpenSheet}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--sd-muted)] hover:text-[var(--sd-ink)] active:scale-95 transition-transform flex-shrink-0"
                  aria-label="사진 첨부"
                >
                  <ImageIcon size={22} />
                </button>
              )}
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={hasPhotos ? '사진과 함께 보낼 말을 적어보세요' : '증상이나 궁금한 점을 물어보세요'}
                className="flex-1 bg-transparent border-none outline-none resize-none max-h-24 py-2.5 px-2 text-[15px]"
                rows={input.split('\n').length > 4 ? 4 : input.split('\n').length || 1}
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleSend}
                disabled={!canSend}
                className={`p-2.5 rounded-full ml-1 flex-shrink-0 transition-colors ${
                  canSend ? 'bg-[var(--sd-rel)] text-white' : 'bg-[var(--sd-line)] text-[var(--sd-muted)]'
                }`}
              >
                <Send size={18} className="ml-0.5" />
              </motion.button>
            </div>
          </div>
        </div>
      )}

      {/* 사진 선택 바텀 시트 */}
      <AnimatePresence>
        {isSheetOpen && attach && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSheetOpen(false)}
              className="fixed inset-0 bg-black/40 z-30 max-w-md mx-auto"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[var(--sd-card-solid)] rounded-t-3xl border-t border-[var(--sd-line)] z-40 p-4 pb-8 shadow-xl max-h-[82vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--sd-line)]">
                <div>
                  <h2 className="text-[15px] font-bold text-[var(--sd-ink)]">사진 올리기</h2>
                  <p className="text-[11px] text-[var(--sd-muted)] mt-0.5">
                    보낸 사진만 Claude가 봐요 · 진단은 못 해요
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSheetOpen(false)}
                  className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center text-[var(--sd-muted)]"
                  aria-label="닫기"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-3 space-y-4">
                {/* 새로 찍기 · 앨범 버튼 */}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isMaxPending}
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full py-3 px-4 rounded-xl border border-dashed border-[var(--sd-line)] bg-[var(--sd-surface-2)] flex items-center justify-center gap-2 text-[14px] font-medium text-[var(--sd-ink)] transition-opacity ${
                    isMaxPending ? 'opacity-40 cursor-not-allowed' : 'active:scale-[0.99]'
                  }`}
                >
                  <Camera size={18} className="text-[var(--sd-rel)]" />
                  <span>새로 찍기 · 앨범에서</span>
                </button>

                {isMaxPending && (
                  <p className="text-[11px] text-[var(--sd-crit)] text-center font-medium">
                    사진은 최대 {attach.max}장까지 보낼 수 있어요
                  </p>
                )}

                {/* 일지에 올린 최근 사진 목록 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-bold text-[var(--sd-muted)]">일지에 올린 최근 사진</span>
                    <span className="text-[11px] text-[var(--sd-faint)]">
                      {attach.pending.length}/{attach.max}장 선택
                    </span>
                  </div>

                  {attach.loadingRecent ? (
                    <div className="py-8 text-center text-[12px] text-[var(--sd-muted)]">
                      일지 사진을 불러오는 중이에요...
                    </div>
                  ) : attach.recent.length === 0 ? (
                    <p className="text-[12px] text-[var(--sd-faint)] py-8 text-center">
                      최근 7일간 일지에 올린 사진이 없어요
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-[42vh] pr-0.5">
                      {attach.recent.map((item) => {
                        const isSelected = attach.pending.some((p) => p.key === item.key);
                        const isMax = !isSelected && isMaxPending;

                        return (
                          <button
                            key={item.key}
                            type="button"
                            disabled={isMax}
                            onClick={() => {
                              if (isSelected) {
                                attach.onRemove(item.key);
                              } else if (!isMax) {
                                attach.onPickRecent(item.key);
                              }
                            }}
                            className={`relative flex flex-col rounded-xl overflow-hidden border text-left transition-all ${
                              isSelected
                                ? 'border-[var(--sd-rel)] ring-2 ring-[var(--sd-rel)]'
                                : 'border-[var(--sd-line)]'
                            } ${isMax ? 'opacity-35 cursor-not-allowed' : 'active:scale-95'}`}
                          >
                            <div className="w-full aspect-square relative bg-[var(--sd-surface-2)]">
                              <img
                                src={item.url}
                                alt="보낸 사진"
                                loading="lazy"
                                className="w-full h-full object-cover"
                              />
                              {isSelected && (
                                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[var(--sd-rel)] text-white flex items-center justify-center shadow">
                                  <Check size={12} strokeWidth={3} />
                                </div>
                              )}
                            </div>
                            <span className="w-full text-center text-[11px] py-1.5 px-1 truncate bg-[var(--sd-card-solid)] text-[var(--sd-muted)] font-medium">
                              {item.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--sd-line)]">
                <button
                  type="button"
                  onClick={() => setIsSheetOpen(false)}
                  className="w-full py-3 rounded-xl bg-[var(--sd-rel)] text-white text-[14px] font-bold active:scale-[0.98] transition-transform"
                >
                  선택 완료 {attach.pending.length > 0 ? `(${attach.pending.length}장)` : ''}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 대화 사진 전체화면 확대 모달 */}
      <AnimatePresence>
        {previewPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 max-w-md mx-auto"
            onClick={() => setPreviewPhoto(null)}
          >
            <button
              type="button"
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-4 right-4 min-w-[44px] min-h-[44px] flex items-center justify-center text-white/80 hover:text-white rounded-full bg-black/40"
              aria-label="닫기"
            >
              <X size={24} />
            </button>
            <div className="max-w-full max-h-[85vh] overflow-hidden rounded-2xl" onClick={(e) => e.stopPropagation()}>
              <img
                src={previewPhoto}
                alt="보낸 사진"
                className="w-full h-full max-h-[80vh] object-contain"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
