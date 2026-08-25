'use client';

// 홈 "오늘의 조각" — 상대가 오늘 남긴 새 콘텐츠를 놓치지 않게 '스캔'하는 2열 업데이트 보드.
// (GPT 디자인 스펙 통합, 수정0)
//   · 감정 나레이션·색 분류·포차코 없음 — 사실과 숫자만.
//   · 정보 위계: 콘텐츠(편지/칭찬/위시/추억)는 숫자까지 크게, 범프는 하단 얇은 한 줄로.
//   · 0개 항목은 숨긴다 (0은 정보가 아니라 잡음). 하나면 full-width 행.
//   · 빈 날 = "오늘 업데이트 없음" (재촉·감정 보완 문구 금지).
import { useEffect, useState } from 'react';
import { Mail, Star, Heart, Image as ImageIcon } from 'lucide-react';
import { subscribeTodayStats, type DailyStats } from '@/lib/dailyStats';

type Sender = '우댕' | '꼼이';

export default function TodayDigest({ me }: { me: Sender }) {
  const partner: Sender = me === '우댕' ? '꼼이' : '우댕';
  const [stats, setStats] = useState<DailyStats | null>(null);

  // 오늘 문서 실시간 구독 — 상대가 방금 남긴 것도 새로고침 없이 뜬다.
  useEffect(() => subscribeTodayStats(setStats), []);

  const s = stats;
  const loading = s === null;

  const updates = [
    { id: 'letter', label: '편지', unit: '통', Icon: Mail, count: s?.letters[partner] ?? 0 },
    { id: 'praise', label: '칭찬', unit: '개', Icon: Star, count: s?.praiseStickers[partner] ?? 0 },
    { id: 'wish', label: '위시리스트', unit: '개', Icon: Heart, count: s?.wishItems[partner] ?? 0 },
    { id: 'memory', label: '추억', unit: '장', Icon: ImageIcon, count: s?.memories[partner] ?? 0 },
  ].filter((u) => u.count > 0);

  const b = s?.bumps;
  const bumpTotal = b
    ? (b.miss[partner] + b.love[partner] + b.hug[partner] + b.kiss[partner] + b.whitening[partner])
    : 0;

  const hasUpdates = updates.length > 0;
  const isSingle = updates.length === 1;

  return (
    <section className="rounded-[20px] bg-[#FFF9F1] px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-[#544B45]">오늘의 조각</h2>
        <span className="text-[11px] font-medium text-[#A3988E]">오늘</span>
      </div>

      {!loading && (hasUpdates ? (
        <div className={isSingle ? 'grid grid-cols-1' : 'grid grid-cols-2 gap-2'}>
          {updates.map((u) => (
            <div
              key={u.id}
              className="flex min-h-[60px] items-center gap-2.5 rounded-[15px] border border-[#F2E9DE] bg-[#FFFCF7] px-3"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-[#F8EEE7] text-[#B79688]">
                <u.Icon size={15} strokeWidth={1.8} />
              </div>
              <div>
                <div className="text-[11px] font-medium text-[#8C8178]">{u.label}</div>
                <div className="mt-1 text-[18px] font-bold leading-none text-[#4F4741]">
                  {u.count}{u.unit}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-1 text-[13px] font-medium text-[#A29890]">
          {bumpTotal > 0 ? '오늘 업데이트된 콘텐츠 없음' : '오늘 업데이트 없음'}
        </div>
      ))}

      {!loading && bumpTotal > 0 && (
        <div className="mt-3 border-t border-[#EEE5DA] pt-2.5 text-[11px] font-medium text-[#A79C92]">
          <span className="mr-1.5">○</span>
          범프 <span className="font-semibold text-[#91867C]">{bumpTotal}번</span>
        </div>
      )}
    </section>
  );
}
