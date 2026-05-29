'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { setMyMood, subscribeTodayMoods, MOOD_OPTIONS, type MoodMap } from '@/lib/moods';
import { COUPLE } from '@/lib/letters';

export function MoodRow({ me }: { me: string }) {
  const [moods, setMoods] = useState<MoodMap>({});
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    const unsub = subscribeTodayMoods(setMoods);
    return () => unsub();
  }, []);

  const partner = COUPLE.find((u) => u !== me) || '';
  const people = [me, partner].filter(Boolean);

  const pick = async (emoji: string) => {
    setPicking(false);
    if (me) {
      try {
        await setMyMood(me, emoji);
      } catch (e) {
        console.error('기분 저장 실패:', e);
      }
    }
  };

  return (
    <Card variant="glass">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3 text-slate-400">
          <span className="text-[10px] font-black tracking-[0.2em] uppercase">오늘의 기분</span>
        </div>

        <div className="flex items-center justify-around">
          {people.map((person) => {
            const isMe = person === me;
            const emoji = moods[person]?.emoji;
            return (
              <div key={person} className="flex flex-col items-center gap-1.5">
                <button
                  onClick={() => isMe && setPicking((p) => !p)}
                  disabled={!isMe}
                  className={cn(
                    'w-16 h-16 rounded-2xl flex items-center justify-center text-4xl transition-all',
                    isMe
                      ? 'bg-emerald-50 border-2 border-emerald-200 active:scale-95 cursor-pointer'
                      : 'bg-white/60 border border-white'
                  )}
                  title={isMe ? '눌러서 기분 고르기' : ''}
                >
                  {emoji || (isMe ? '＋' : '…')}
                </button>
                <span className="text-[11px] font-black text-slate-500">
                  {person}
                  {isMe && <span className="text-emerald-400"> (나)</span>}
                </span>
              </div>
            );
          })}
        </div>

        {picking && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap justify-center gap-2">
            {MOOD_OPTIONS.map((e) => (
              <button
                key={e}
                onClick={() => pick(e)}
                className="w-10 h-10 rounded-xl bg-white/70 border border-white text-2xl flex items-center justify-center active:scale-90 hover:bg-emerald-50 transition-all"
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
