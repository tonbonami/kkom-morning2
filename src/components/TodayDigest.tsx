'use client';

// 홈 맨 위 "오늘의 조각" — 상대가 오늘 남긴 것 중 알아둘 만한 두 가지.
// 꼼모닝 옛 DailyPiecesHeader(칩 6개·색 4개·숫자 노출·개수 따라 글자 커짐·빈 날 재촉)를
// 사이담 TodayDigest 설계로 갈아끼움:
//   칩→문장 1개 · 색→왼쪽 연필선 1개 · 숫자 숨김(강도를 말로) · 빈도≠중요도(digestRules TIER)
//   · 빈 날 재촉 없음 · '그 밖에 N가지' · '오늘 ⌄' 7일 선택 · 실시간 구독.
// 읽기 비용: 오늘 문서 1건 구독. 지난 날은 눌렀을 때만 1건 더.
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { subscribeTodayStats, fetchStatsFor, recentDayKeys, todayKey, type DailyStats } from '@/lib/dailyStats';
import { buildDigest, composeSentence } from '@/lib/digestRules';

const DAYS_BACK = 7;
type Sender = '우댕' | '꼼이';

function dayLabel(key: string): string {
  const keys = recentDayKeys(2);
  if (key === keys[0]) return '오늘';
  if (key === keys[1]) return '어제';
  const [, m, d] = key.split('-');
  return `${Number(m)}월 ${Number(d)}일`;
}

export default function TodayDigest({ me }: { me: Sender }) {
  const partner: Sender = me === '우댕' ? '꼼이' : '우댕';
  const [today, setToday] = useState<DailyStats | null>(null);
  const [day, setDay] = useState<string>(() => todayKey());
  const [past, setPast] = useState<DailyStats | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const isToday = day === todayKey();

  // 오늘은 실시간 구독 — 상대가 방금 남긴 조각도 새로고침 없이 뜬다.
  useEffect(() => subscribeTodayStats(setToday), []);

  // 지난 날은 고를 때만 1회 읽는다.
  useEffect(() => {
    if (isToday) { setPast(null); return; }
    let alive = true;
    setPast(null);
    fetchStatsFor(day).then((s) => { if (alive) setPast(s); });
    return () => { alive = false; };
  }, [day, isToday]);

  const stats = isToday ? today : past;
  const items = useMemo(() => (stats ? buildDigest(stats, partner) : []), [stats, partner]);

  const loading = stats === null;
  const sentence = composeSentence(items);
  const overflow = Math.max(0, items.length - 2);

  return (
    <>
      <section>
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-[12px] font-extrabold tracking-[-0.02em] text-slate-500">오늘의 조각</span>

          {/* 날짜 고르기 — 자정에 데이터가 '사라지는' 게 아니라 '오늘'로 넘어갈 뿐임을 보여준다 */}
          <button
            onClick={() => setPickerOpen((v) => !v)}
            aria-label="날짜 고르기"
            aria-expanded={pickerOpen}
            className="flex items-center gap-0.5 text-[12px] font-bold px-2 py-1 -mr-2 rounded-full text-slate-400"
          >
            {dayLabel(day)}
            <ChevronDown className="w-3 h-3" style={{ transform: pickerOpen ? 'rotate(180deg)' : undefined, transition: 'transform .15s' }} />
          </button>
        </div>

        {pickerOpen && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {recentDayKeys(DAYS_BACK).map((k) => (
              <button
                key={k}
                onClick={() => { setDay(k); setPickerOpen(false); }}
                className={`text-[12px] font-bold px-2.5 py-1 rounded-full ${
                  k === day ? 'bg-[#FB7BA8] text-white' : 'bg-white text-slate-500 border border-slate-100'
                }`}
              >
                {dayLabel(k)}
              </button>
            ))}
          </div>
        )}

        {/* 카드로 감싸지 않는다 — 모듈 카드(포차코)보다 화려하면 요약이 아니라 또 하나의 카드가 된다.
            관계색은 왼쪽 연필선 딱 한 군데에만. */}
        <div className="pl-3 border-l-2 border-[#FB7BA8]">
          {loading ? (
            <p className="font-handwriting text-[20px] leading-relaxed text-slate-400">오늘 뭐가 있었는지 보는 중…</p>
          ) : items.length === 0 ? (
            // 재촉하지 않는다 — '아직'이라는 말조차 뭔가 해야 한다는 압박을 만든다.
            <p className="font-handwriting text-[20px] leading-relaxed break-keep text-slate-500">
              {isToday ? '오늘은 조용한 하루네.' : '이날은 조용했네.'}
            </p>
          ) : (
            <>
              <p className="font-handwriting text-[20px] leading-relaxed break-keep text-slate-700">{sentence}</p>
              {overflow > 0 && (
                <button
                  onClick={() => setSheetOpen(true)}
                  className="flex items-center gap-0.5 mt-1 text-[12.5px] font-bold text-slate-400"
                >
                  그 밖에 새 소식 {overflow}가지
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      </section>

      {/* 펼치기는 홈을 늘리지 않고 아래에서 올라온다 */}
      {sheetOpen && (
        <div className="fixed inset-0 z-[70] flex items-end bg-black/30" onClick={() => setSheetOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[440px] mx-auto rounded-t-3xl px-5 pt-4 bg-white"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-handwriting text-[24px] text-slate-700">{dayLabel(day)}의 조각</span>
              <button onClick={() => setSheetOpen(false)} aria-label="닫기" className="w-9 h-9 -mr-2 flex items-center justify-center rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* 여기서도 개수는 안 쓴다 — 펼쳤다고 셈이 되면 안 된다 */}
            <ul className="pb-1">
              {items.map((it) => {
                const row = (
                  <span className="flex items-center gap-2.5 py-2.5 text-[15px] text-slate-700">
                    <span className="text-[17px] w-6 text-center shrink-0">{it.emoji}</span>
                    {it.short}
                    {it.href && <ChevronRight className="w-4 h-4 ml-auto shrink-0 text-slate-400" />}
                  </span>
                );
                return (
                  <li key={it.kind} className="border-t border-black/5">
                    {it.href ? (
                      <Link href={it.href} onClick={() => setSheetOpen(false)} className="block">{row}</Link>
                    ) : row}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
