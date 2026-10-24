'use client';
// 제미나이 12차(gemini-3-flash CLI, 우댕 2026-10-24): 가려움·붉어짐 0~10, 하루 점수 칩 n/10(7 이상 빨강), 메모 아침·점심·저녁·밤 + 칸별 사진 수. 값 그대로.
// 배선: memoBelow — 메모 네 칸을 카드 아래 따로 보여 줄 때(우댕 폰 기록 화면) 「안 적은 칸」에서 메모를 뺀다.

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Check, Clock, X, AlertCircle, Droplets, Moon, Zap, 
  Utensils, Thermometer, Wind, Camera, Edit3, MessageSquareQuote,
  Sunrise, Sun, Sunset
} from 'lucide-react';

export type MedStatus = 'taken' | 'missed' | 'late';

export interface ReportDay {
  date: string;                 // 'YYYY-MM-DD'
  logged: boolean;              
  itch10: number | null;
  redness: number | null;
  sev: number | null;
  meds: { name: string; dose?: string | null; time?: string | null; status: MedStatus | null }[];
  episodes: { start?: string | null; durMin?: number | null; areas: string[]; over24h?: boolean | null; bruiseLike?: boolean | null }[];
  angioedema: { present: boolean; areas: string[] } | null;
  trace: string | null;         
  triggers: string[];           
  foods: { t?: string | null; text: string }[];
  sleepH: number | null; wakeItch: boolean | null; waterMl: number | null; stress: number | null; 
  period: boolean | null; cycleDay: number | null;
  newProducts: string[];
  note: string;
  memos: Record<'morning' | 'noon' | 'evening' | 'night', string>;
  photoCount: number;
  photoCountBySlot: Record<'morning' | 'noon' | 'evening' | 'night' | 'etc', number>;
  env: { temp: number | null; humidity: number | null; pm10: number | null; pm25: number | null } | null;
}

interface Props {
  day: ReportDay;
  photos?: { id: string; url: string }[];
  onOpenPhotos?: (index: number) => void;
  onEdit?: () => void;
  showHeader?: boolean;
  memoBelow?: boolean;
}

export default function SkinDayReport({ day, photos, onOpenPhotos, onEdit, showHeader = true, memoBelow = false }: Props) {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const weeks = ['일', '월', '화', '수', '목', '금', '토'];
    return `${d.getMonth() + 1}월 ${d.getDate()}일 (${weeks[d.getDay()]})`;
  };

  if (!day.logged) {
    return (
      <div className="flex items-center justify-between py-3 px-4 text-[13px] border-b border-[var(--sd-line)] text-[var(--sd-muted)]">
        <span>{formatDate(day.date)}</span>
        <span>기록 없음</span>
      </div>
    );
  }

  const sev = day.sev;
  const isHardDay = sev !== null && sev >= 7;
  
  const hasMemos = Object.values(day.memos).some(v => !!v) || 
    Object.entries(day.photoCountBySlot).some(([k, v]) => k !== 'etc' && v > 0);

  const unloggedFields = [
    !day.meds.length && '약',
    !day.episodes.length && '증상 발생',
    !day.angioedema && '붓기',
    !day.trace && '흔적',
    !day.triggers.length && '의심 요인',
    !day.foods.length && '먹은 것',
    day.sleepH === null && '수면',
    day.period === null && '생리',
    !day.newProducts.length && '새 제품',
    (!memoBelow && !hasMemos && !day.note) && '메모'
  ].filter(Boolean) as string[];

  const timeSlots = [
    { key: 'morning', label: '아침', Icon: Sunrise },
    { key: 'noon', label: '점심', Icon: Sun },
    { key: 'evening', label: '저녁', Icon: Sunset },
    { key: 'night', label: '밤', Icon: Moon },
  ] as const;

  return (
    <div className="sd-card overflow-hidden mb-4">
      {showHeader && (
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex flex-col">
            <span className="text-[15px] font-bold text-[var(--sd-ink)]">{formatDate(day.date)}</span>
            {onEdit && (
              <button onClick={onEdit} className="flex items-center gap-1 text-[11px] text-[var(--sd-rel)] mt-0.5 min-h-[24px]">
                <Edit3 size={12} />
                이날 고치기
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {day.meds.some(m => m.status) && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--sd-surface-2)]">
                {day.meds.every(m => m.status === 'taken') ? <Check size={12} className="text-[var(--sd-rel)]" /> : 
                 day.meds.some(m => m.status === 'missed') ? <X size={12} className="text-[var(--sd-crit)]" /> :
                 <Clock size={12} className="text-[var(--sd-muted)]" />}
              </div>
            )}
            <div className={`px-2.5 py-1 rounded-full text-[13px] font-bold ${
              isHardDay ? 'bg-[color-mix(in_srgb,var(--sd-crit)_12%,transparent)] text-[var(--sd-crit)]' : 
              sev === 0 ? 'bg-[var(--sd-surface-2)] text-[var(--sd-faint)]' : 'bg-[var(--sd-rel-soft)] text-[var(--sd-rel)]'
            }`}>
              {sev === 0 ? '없음' : (sev !== null ? `${sev} / 10` : '- / 10')}
            </div>
          </div>
        </div>
      )}

      <div className="px-4 pb-4 space-y-4 text-[14px]">
        {/* 증상 점수 상세 */}
        {(day.itch10 !== null || day.redness !== null) && (
          <div className="flex gap-4">
            {day.itch10 !== null && (
              <div className="flex items-center gap-1.5">
                <span className="text-[var(--sd-muted)]">가려움</span>
                <span className="font-medium text-[var(--sd-ink)]">{day.itch10}/10</span>
              </div>
            )}
            {day.redness !== null && (
              <div className="flex items-center gap-1.5">
                <span className="text-[var(--sd-muted)]">붉어짐</span>
                <span className="font-medium text-[var(--sd-ink)]">{day.redness}/10</span>
              </div>
            )}
          </div>
        )}

        {/* 약 기록 */}
        {day.meds.length > 0 && (
          <div className="space-y-1.5">
            {day.meds.map((m, i) => (
              <div key={i} className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1">
                  <span className="font-medium text-[var(--sd-ink)]">{m.name}</span>
                  {m.dose && <span className="text-[12px] text-[var(--sd-muted)]">{m.dose}</span>}
                  {m.time && <span className="text-[12px] text-[var(--sd-muted)]">· {m.time}</span>}
                </div>
                <span className={`text-[12px] shrink-0 ${m.status === 'taken' ? 'text-[var(--sd-rel)]' : m.status === 'missed' ? 'text-[var(--sd-crit)]' : 'text-[var(--sd-muted)]'}`}>
                  {m.status === 'taken' ? '복용' : m.status === 'missed' ? '거름' : m.status === 'late' ? '늦게 먹음' : ''}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 발생 에피소드 */}
        {day.episodes.length > 0 && (
          <div className="space-y-2">
            {day.episodes.map((ep, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-[var(--sd-surface-2)]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-[13px]">{ep.start || '기록 안 된 시각'}</span>
                  <div className="flex flex-wrap gap-1">
                    {ep.areas.map((a, j) => <span key={j} className="text-[12px] px-1.5 py-0.5 rounded bg-[var(--sd-card-solid)] border border-[var(--sd-line)]">{a}</span>)}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {ep.durMin && <span className="text-[12px] text-[var(--sd-muted)]">{ep.durMin}분 동안</span>}
                  {ep.over24h && <span className="flex items-center gap-0.5 text-[11px] text-[var(--sd-crit)]"><AlertCircle size={10}/>24시간 지속</span>}
                  {ep.bruiseLike && <span className="flex items-center gap-0.5 text-[11px] text-[var(--sd-crit)]"><AlertCircle size={10}/>멍처럼 남음</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 맥관부종 */}
        {day.angioedema?.present && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[color-mix(in_srgb,var(--sd-crit)_8%,transparent)]">
            <Zap size={14} className="text-[var(--sd-crit)] mt-0.5 shrink-0" />
            <div className="flex flex-col gap-1">
              <span className="text-[13px] font-bold text-[var(--sd-crit)]">붓기 발생</span>
              <div className="flex flex-wrap gap-1">
                {day.angioedema.areas.map((a, i) => {
                  const isDanger = a.includes('목') || a.includes('혀');
                  return (
                    <span key={i} className={`text-[12px] px-1.5 py-0.5 rounded border ${
                      isDanger ? 'bg-[var(--sd-crit)] text-white border-none' : 'bg-white/50 border-[var(--sd-crit)] text-[var(--sd-crit)]'
                    }`}>
                      {a}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 흔적 */}
        {day.trace && (
          <div className="flex items-center gap-2">
            <span className="text-[var(--sd-muted)]">흔적</span>
            <span className="text-[var(--sd-ink)]">{day.trace}</span>
          </div>
        )}

        {/* 의심 요인 */}
        {day.triggers.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[var(--sd-muted)] mr-1">의심 요인</span>
            {day.triggers.map((t, i) => (
              <span key={i} className="px-2 py-0.5 rounded bg-[var(--sd-surface-2)] text-[12px] text-[var(--sd-ink)]">
                {t}
              </span>
            ))}
          </div>
        )}

        {/* 식사 */}
        {day.foods.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[var(--sd-muted)]">
              <Utensils size={13} />
              <span className="text-[13px]">먹은 것</span>
            </div>
            {day.foods.map((f, i) => (
              <div key={i} className="pl-5 text-[13px]">
                {f.t && <span className="text-[var(--sd-faint)] mr-1.5">{f.t}</span>}
                <span className="text-[var(--sd-ink)]">{f.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* 생활 습관 */}
        {(day.sleepH !== null || day.waterMl !== null || day.stress !== null) && (
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 p-3 rounded-xl bg-[var(--sd-surface-2)] text-[13px]">
            {day.sleepH !== null && (
              <div className="flex items-center gap-2">
                <Moon size={13} className="text-[var(--sd-muted)]" />
                <span>잠 {day.sleepH}시간</span>
                {day.wakeItch && <span className="text-[11px] text-[var(--sd-crit)]">가려워 깸</span>}
              </div>
            )}
            {day.waterMl !== null && (
              <div className="flex items-center gap-2">
                <Droplets size={13} className="text-[var(--sd-muted)]" />
                <span>물 {day.waterMl}ml</span>
              </div>
            )}
            {day.stress !== null && (
              <div className="flex items-center gap-2 col-span-2">
                <Zap size={13} className="text-[var(--sd-muted)]" />
                <span>스트레스 {day.stress} / 10</span>
              </div>
            )}
          </div>
        )}

        {/* 생리/제품 */}
        {(day.period || day.newProducts.length > 0) && (
          <div className="flex flex-col gap-1.5 border-t border-[var(--sd-line)] pt-3">
            {day.period && (
              <div className="text-[13px]">
                <span className="text-[var(--sd-crit)] font-medium">생리 중</span>
                {day.cycleDay && <span className="text-[var(--sd-muted)] ml-1">· {day.cycleDay}일째</span>}
              </div>
            )}
            {day.newProducts.map((p, i) => (
              <div key={i} className="text-[13px]">
                <span className="text-[var(--sd-muted)]">새 제품: </span>
                <span className="text-[var(--sd-ink)]">{p}</span>
              </div>
            ))}
          </div>
        )}

        {/* 시간대별 메모 */}
        <div className="space-y-3">
          {timeSlots.map(({ key, label, Icon }) => {
            const content = day.memos[key];
            const pCount = day.photoCountBySlot[key];
            if (!content && !pCount) return null;

            return (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[var(--sd-muted)]">
                  <Icon size={14} />
                  <span className="text-[13px] font-medium">{label}</span>
                </div>
                <div className="pl-5 space-y-2">
                  {content && <p className="text-[14px] leading-relaxed text-[var(--sd-ink)] whitespace-pre-wrap">{content}</p>}
                  {pCount > 0 && (
                    <button 
                      onClick={() => onOpenPhotos?.(0)}
                      className="flex items-center gap-1.5 h-10 px-3 rounded-xl bg-[var(--sd-surface-2)] text-[12px] text-[var(--sd-ink)]"
                    >
                      <Camera size={14} />
                      사진 {pCount}장
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 예전 메모 */}
        {day.note && (
          <div className="relative p-4 rounded-xl bg-[var(--sd-surface-2)] italic text-[14px] leading-relaxed text-[var(--sd-ink)]">
            <MessageSquareQuote size={16} className="absolute top-2 left-2 text-[var(--sd-faint)] opacity-30" />
            <span className="block text-[11px] text-[var(--sd-faint)] mb-1 not-italic">예전 메모</span>
            <p className="whitespace-pre-wrap">{day.note}</p>
          </div>
        )}

        {/* 사진 (전체 혹은 기타) */}
        {(photos?.length || day.photoCount > 0) ? (
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {photos ? (
              photos.map((p, i) => (
                <button key={p.id} onClick={() => onOpenPhotos?.(i)} className="w-[72px] h-[72px] rounded-lg overflow-hidden shrink-0 border border-[var(--sd-line)]">
                  <img src={p.url} alt="기록 사진" className="w-full h-full object-cover" />
                </button>
              ))
            ) : (
              day.photoCountBySlot.etc > 0 && (
                <button 
                  onClick={() => onOpenPhotos?.(0)}
                  className="flex items-center justify-center gap-2 w-full h-[48px] rounded-xl bg-[var(--sd-surface-2)] text-[14px] text-[var(--sd-ink)]"
                >
                  <Camera size={16} />
                  기타 사진 {day.photoCountBySlot.etc}장 보기
                </button>
              )
            )}
          </div>
        ) : null}

        {/* 날씨 정보 */}
        {day.env && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--sd-faint)] border-t border-[var(--sd-line)] pt-2">
            {day.env.temp !== null && <span className="flex items-center gap-0.5"><Thermometer size={10}/>{day.env.temp}°</span>}
            {day.env.humidity !== null && <span className="flex items-center gap-0.5"><Droplets size={10}/>습도 {day.env.humidity}%</span>}
            {day.env.pm10 !== null && <span className="flex items-center gap-0.5"><Wind size={10}/>미세 {day.env.pm10}</span>}
            {day.env.pm25 !== null && <span className="flex items-center gap-0.5"><Wind size={10}/>초미세 {day.env.pm25}</span>}
          </div>
        )}

        {/* 미기록 필드 요약 */}
        {unloggedFields.length > 0 && (
          <div className="text-[11px] text-[var(--sd-faint)]">
            안 적은 칸: {unloggedFields.join(' · ')}
          </div>
        )}
      </div>
    </div>
  );
}
