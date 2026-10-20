// 제미나이 시안(2026-10-21, 우댕 전달) — 값 그대로.
// Aside 검수 고침(2026-10-21): 119 띠 배경이 글자색과 같아 글자가 안 보였다(bg-opacity가 CSS 변수 색엔 안 먹음) → color-mix로 옅게, 글자 12px.
// SkinChat.tsx
import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Send } from 'lucide-react';

export default function SkinChat({
  messages,
  streamingText,
  onSend,
  sending,
  onBack,
  suggestions,
}: {
  messages: { id: string; role: 'user' | 'assistant'; text: string; at: string }[];
  streamingText: string | null;
  onSend: (text: string) => void;
  sending: boolean;
  onBack: () => void;
  suggestions: string[];
}) {
  const [input, setInput] = React.useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const handleSend = () => {
    if (!input.trim() || sending) return;
    onSend(input.trim());
    setInput('');
  };

  return (
    <div className="min-h-screen bg-[var(--sd-surface-2)] flex flex-col max-w-md mx-auto text-[var(--sd-ink)] relative">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-[var(--sd-line)] z-10 sticky top-0">
        <button onClick={onBack} className="p-2 -ml-2">
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

      {/* 대화 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        {messages.length === 0 && !streamingText && (
          <div className="flex flex-col items-center justify-center h-full space-y-3 mt-10">
            <p className="text-sm text-[var(--sd-muted)] mb-4">어떤 것이 궁금한가요?</p>
            {suggestions.map((sug, i) => (
              <motion.button
                key={i}
                whileTap={{ scale: 0.96 }}
                onClick={() => onSend(sug)}
                className="bg-white border border-[var(--sd-line)] px-4 py-2 rounded-full text-sm shadow-sm"
              >
                {sug}
              </motion.button>
            ))}
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              className={`max-w-[85%] p-4 rounded-2xl whitespace-pre-wrap text-[15px] leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[var(--sd-rel-soft)] text-[var(--sd-ink)] rounded-tr-sm'
                  : 'bg-white border border-[var(--sd-line)] rounded-tl-sm'
              }`}
            >
              {msg.text}
            </div>
            <span className="text-[10px] text-[var(--sd-muted)] mt-1 px-1">{msg.at}</span>
          </div>
        ))}

        {streamingText && (
          <div className="flex flex-col items-start">
            <div className="max-w-[85%] p-4 rounded-2xl bg-white border border-[var(--sd-line)] rounded-tl-sm whitespace-pre-wrap text-[15px] leading-relaxed">
              {streamingText}
              <span className="inline-block w-1.5 h-4 ml-1 bg-[var(--sd-muted)] animate-pulse align-middle" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* 입력 영역 */}
      <div className="p-3 bg-white border-t border-[var(--sd-line)] fixed bottom-0 left-0 right-0 max-w-md mx-auto">
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
            className={`p-2.5 rounded-full ml-2 flex-shrink-0 ${
              input.trim() && !sending ? 'bg-[var(--sd-rel)] text-white' : 'bg-[var(--sd-line)] text-[var(--sd-muted)]'
            }`}
          >
            <Send size={18} className="ml-0.5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
