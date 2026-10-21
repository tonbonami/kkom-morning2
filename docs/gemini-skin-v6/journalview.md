## 고칠 것: SkinJournalView.tsx — 기록 화면에서 Claude 상담으로 바로 가기
지금은 상담이 「분석」 화면 맨 아래에만 있어서 세 번 눌러야 간다. 머리 줄 오른쪽 「분석」 옆에 **「상담」** 버튼(말풍선 아이콘 + 글자, 「분석」과 같은 모양)을 더해 줘.
props `header`에 `onOpenChat: () => void` 추가. 가운데 제목 「꼼이 피부 일지」가 밀려 잘리지 않게(390px) — 버튼은 아이콘+짧은 글자, 간격 조정.

### ⚠️ 이건 「고치기」다
지금 코드를 한 줄씩 그대로 옮겨 적고, 위에 적힌 곳만 바꿔라. 문구·기능·props·맨 위 머리 주석을 빼거나 바꾸지 마라. 설명 글은 코드 블록 밖에 쓰지 말고, 답은 ```tsx 블록 하나만.

### 지금 코드 SkinJournalView.tsx
```tsx
// 제미나이 시안(2026-10-21, 우댕 전달) — 값 그대로.
// 배선 하나: 폼 위 제목을 바꿀 수 있게 formTitle(기본 「기록하기」) — 우댕 폰은 읽기 카드라 「꼼이가 적은 기록」.
// SkinJournalView.tsx
import React from 'react';
import { ArrowLeft, LineChart } from 'lucide-react';

export default function SkinJournalView({
  header,
  week,
  form,
  formTitle = '기록하기',
}: {
  header: { onBack: () => void; onOpenInsights: () => void };
  week: React.ReactNode;
  form: React.ReactNode;
  formTitle?: string;
}) {
  return (
    <div className="min-h-screen bg-[var(--sd-surface-2)] text-[var(--sd-ink)] max-w-md mx-auto relative flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 sticky top-0 bg-white/80 backdrop-blur-md z-20">
        <button onClick={header.onBack} className="p-2 -ml-2 text-[var(--sd-ink)]">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold">꼼이 피부 일지</h1>
        <button onClick={header.onOpenInsights} className="p-2 -mr-2 text-[var(--sd-rel)] flex items-center gap-1">
          <LineChart size={20} />
          <span className="text-sm font-bold">분석</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-2">
        {week}
        <div className="mt-6 mb-2">
          <h2 className="text-xl font-bold text-[var(--sd-ink)] px-1">{formTitle}</h2>
        </div>
        {form}
      </div>
    </div>
  );
}

```
