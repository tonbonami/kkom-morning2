## 고칠 것: SkinChat.tsx — 우댕 폰(보기 전용)에서 꼼이 상담을 읽고 Claude 비용을 확인
우댕은 꼼이 상담 대화를 읽기만 하고(보내기 막힘), 꼼이가 Claude를 쓰는 비용이 궁금하다. 꼼이 폰에선 지금과 똑같아야 한다.
props 두 개를 더해 줘:
```ts
readOnly?: boolean;   // true = 우댕 폰(보기 전용)
usage?: {             // readOnly일 때만 옴. null이면 불러오는 중
  today: { count: number; won: number };
  month: { count: number; won: number };
  total: { count: number; won: number };
  limit: number;      // 하루 상한(60)
} | null;
```
1. **readOnly면 아래 입력 막대를 없애고**, 그 자리에 작게 「보기 전용이에요 — 상담은 꼼이만 해요」 한 줄(바닥 고정, 얇게). 대화 영역 아래 여백도 그에 맞게.
2. **readOnly면 119 띠 바로 아래에 「Claude 사용량」 카드**: 오늘 n번 · 약 ₩n / 이번 달 n번 · 약 ₩n / 지금까지 n번 · 약 ₩n. 세 칸을 가로로(숫자 크게, 이름 작게). 아래 아주 작게 「토큰 수로 어림한 값이에요 · 하루 상한 n번」. 접기 버튼으로 한 줄 요약(「이번 달 n번 · 약 ₩n」)으로 접을 수 있게(처음엔 펼침). usage가 null이면 숫자 자리 옅은 깜빡임.
3. 대화가 없을 때 readOnly면 「아직 꼼이가 상담한 내용이 없어요」(예시 칩은 안 보임 — 부모가 빈 배열을 넘김).
4. readOnly가 아니면(꼼이) 지금과 완전히 같게.

### ⚠️ 이건 「고치기」다
지금 코드를 한 줄씩 그대로 옮겨 적고, 위에 적힌 곳만 바꿔라. 문구·기능·props·맨 위 머리 주석을 빼거나 바꾸지 마라. 설명 글은 코드 블록 밖에 쓰지 말고, 답은 ```tsx 블록 하나만.

### 지금 코드 SkinChat.tsx
```tsx
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

```
