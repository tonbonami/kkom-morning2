'use client';

import { cn } from '@/lib/utils';
import { getAirQualityText } from '@/lib/weatherHelpers';

type Hourly = { time: string; pm10: number | null; pm25: number | null };
type AirQ = {
  hourly?: Hourly[];
  tomorrow?: { grade: string; summary: string } | null;
};

// PM10 값 → 막대 색 (한국 기준)
function barColor(pm10: number | null): string {
  if (pm10 == null) return 'bg-slate-200';
  if (pm10 <= 30) return 'bg-emerald-400';
  if (pm10 <= 80) return 'bg-sky-400';
  if (pm10 <= 150) return 'bg-orange-400';
  return 'bg-red-500';
}

export function AirExtra({ air }: { air: AirQ | null }) {
  const hourly = (air?.hourly || []).filter((h) => h.pm10 != null);
  const tomorrow = air?.tomorrow;
  if (!hourly.length && (!tomorrow || tomorrow.grade === '정보 없음')) return null;

  const max = Math.max(60, ...hourly.map((h) => h.pm10 || 0));

  return (
    <div className="mt-5 space-y-4">
      {tomorrow && tomorrow.grade !== '정보 없음' && (
        <div className="flex items-center justify-between rounded-2xl bg-white/60 border border-white px-4 py-3">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
            내일 미세먼지
          </span>
          <span className={cn('text-sm font-black', getAirQualityText(tomorrow.grade))}>
            {tomorrow.grade}
          </span>
        </div>
      )}

      {hourly.length > 0 && (
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            24시간 PM10 흐름
          </p>
          <div className="flex items-end gap-[2px] h-16">
            {hourly.map((h, i) => (
              <div
                key={i}
                className="flex-1 flex items-end"
                title={`${(h.time || '').slice(11)} · ${h.pm10}㎍/㎥`}
              >
                <div
                  className={cn('w-full rounded-t transition-all', barColor(h.pm10))}
                  style={{ height: `${Math.max(6, ((h.pm10 || 0) / max) * 100)}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
