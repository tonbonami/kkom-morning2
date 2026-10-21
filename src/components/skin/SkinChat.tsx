'use client';
// 제미나이 7차(gemini-3-flash CLI): 입력 막대 바로 위 「✨ 오늘 상담 정리하기」 알약 버튼(summary prop), 우댕 폰은 정리가 있을 때만 「오늘 상담 정리 보기」. 값 그대로.
// 제미나이 7차: 「오늘 상담 정리하기」 버튼 추가 (입력바 위 알약 모양, 상태별 문구 변화). 꼼이 입력 중일 땐 흐리게. 여백 조정.

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

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
}: {
  messages: { id: string; role: 'user' | 'assistant'; text: string; at: string }[];
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
  summary?: { state: 'none' | 'draft' | 'applied'; onOpen: () => void } | null;
}) {
  const [input, setInput] = useState('');
  const [isUsageExpanded, setIsUsageExpanded] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const handleSend = () => {
    if (!input.trim() || sending || readOnly) return;
    onSend(input.trim());
    setInput('');
  };

  const LoadingPulse = () => (
    <span className="inline-block w-8 h-3 bg-[var(--sd-line)] animate-pulse rounded-sm align-middle" />
  );

  const renderSummaryButton = () => {
    if (!summary) return null;
    if (readOnly && summary.state === 'none') return null;

    let label = '';
    if (readOnly) {
      label = '오늘 상담 정리 보기';
    } else {
      if (summary.state === 'none') label = '✨ 오늘 상담 정리하기';
      else if (summary.state === 'draft') label = '정리 이어서 보기 · 아직 반영 전';
      else if (summary.state === 'applied') label = '오늘 정리 다시 보기 ✓';
    }

    return (
      <div 
        className={`fixed ${readOnly ? 'bottom-[68px]' : 'bottom-[88px]'} left-0 right-0 max-w-md mx-auto px-4 flex justify-center z-20 pointer-events-none transition-opacity duration-200 ${!readOnly && sending ? 'opacity-40' : 'opacity-100'}`}
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
      <div className={`flex-1 overflow-y-auto p-4 space-y-6 ${readOnly ? 'pb-32' : 'pb-40'}`}>
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

        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              className={`max-w-[85%] p-4 rounded-2xl whitespace-pre-wrap text-[15px] leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-[var(--sd-rel-soft)] text-[var(--sd-ink)] rounded-tr-sm'
                  : 'bg-[var(--sd-card-solid)] border border-[var(--sd-line)] rounded-tl-sm'
              }`}
            >
              {msg.text}
            </div>
            <span className="text-[10px] text-[var(--sd-muted)] mt-1.5 px-1">{msg.at}</span>
          </div>
        ))}

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
        <div className="bg-[var(--sd-surface-2)] border-t border-[var(--sd-line)] fixed bottom-0 left-0 right-0 max-w-md mx-auto py-4 px-4 text-center z-10">
          <p className="text-[12px] text-[var(--sd-faint)] font-medium">보기 전용이에요 — 상담은 꼼이만 해요</p>
        </div>
      ) : (
        <div className="p-3 bg-[var(--sd-card-solid)] border-t border-[var(--sd-line)] fixed bottom-0 left-0 right-0 max-w-md mx-auto z-10">
          <div className="flex items-end bg-[var(--sd-surface-2)] rounded-[24px] p-2 pl-4">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="증상이나 궁금한 점을 물어보세요"
              className="flex-1 bg-transparent border-none outline-none resize-none max-h-24 py-2 text-[15px]"
              rows={input.split('\n').length > 4 ? 4 : input.split('\n').length || 1}
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className={`p-2.5 rounded-full ml-2 flex-shrink-0 transition-colors ${
                input.trim() && !sending ? 'bg-[var(--sd-rel)] text-white' : 'bg-[var(--sd-line)] text-[var(--sd-muted)]'
              }`}
            >
              <Send size={18} className="ml-0.5" />
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}
