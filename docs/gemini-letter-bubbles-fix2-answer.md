꿀됑 풍선의 꼬리 방향을 편지지 위쪽 테두리를 향하는 `up-right`로 변경하고 걸침 비율을 꼼이와 같은 `0.32`로 맞춰, 꼬리 방울이 상단 24px 여백 안에서 잘리지 않으면서 「To. 우댕」 글자 영역과 완전히 분리되도록 수정했습니다.

```tsx
// src/components/letter/LetterCornerBubbles.tsx
'use client';

import React from 'react';
import { useReducedMotion } from 'framer-motion';
import { ThoughtBubble } from './ThoughtBubble';

export interface LetterCornerBubblesProps {
  kkulSrc: string;
  kkomSrc: string;
  fromName: '우댕' | '꼼이';
}

export function LetterCornerBubbles({
  kkulSrc,
  kkomSrc,
  fromName,
}: LetterCornerBubblesProps) {
  const shouldReduceMotion = useReducedMotion();
  const isKkulSender = fromName === '우댕';

  // 44~52px 범위 내에서 보낸 사람 쪽을 약 6px 더 크게 (44px vs 50px)
  const kkulSize = isKkulSender ? 50 : 44;
  const kkomSize = isKkulSender ? 44 : 50;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 select-none"
      aria-hidden="true"
    >
      {/* 꿀됑: 왼쪽 위 귀퉁이에 걸치되 꼬리를 위쪽 테두리 쪽(up-right)으로 향하게 해 'To. 우댕' 글자를 전혀 가리지 않고 24px 여백 내에서 잘리지 않음 */}
      <div
        className="absolute"
        style={{
          top: `-${Math.round(kkulSize * 0.32)}px`,
          left: `-${Math.round(kkulSize * 0.32)}px`,
        }}
      >
        <ThoughtBubble
          src={kkulSrc}
          size={kkulSize}
          tail="up-right"
          appear={!shouldReduceMotion}
        />
      </div>

      {/* 꼼이: 오른쪽 아래 귀퉁이에 걸치되 화면 우측 24px 여백 내에서 꼬리 방울 포함 잘리지 않음 */}
      <div
        className="absolute"
        style={{
          bottom: `-${Math.round(kkomSize * 0.32)}px`,
          right: `-${Math.round(kkomSize * 0.32)}px`,
        }}
      >
        <ThoughtBubble
          src={kkomSrc}
          size={kkomSize}
          tail="up-left"
          appear={!shouldReduceMotion}
        />
      </div>
    </div>
  );
}
```
