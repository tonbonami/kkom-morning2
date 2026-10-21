// Claude에게 보내는 일지 한 줄(상담 맥락·상담 정리가 같이 씀, 서버 전용)
import { medOf } from './skinStats';
import type { SkinLog } from './skinTypes';

export function dayLine(l: SkinLog): string {
  const parts: string[] = [l.date];
  parts.push(l.uas != null ? `팽진${l.wheals} 가려움${l.itch} UAS${l.uas}` : '점수 기록 없음');
  const med = medOf(l);
  parts.push(`약 ${med === 'taken' ? '먹음' : med === 'late' ? '늦게 먹음' : med === 'missed' ? '거름' : '기록 없음'}${(l.meds ?? []).filter((m) => m.time).map((m) => ` ${m.name} ${m.time}`).join('')}`);
  for (const e of l.episodes ?? []) {
    parts.push(`증상 ${e.start ?? '시각?'}${e.durMin ? ` ${e.durMin}분` : ''} ${(e.areas ?? []).join('·')}${e.over24h ? ' (24시간 넘게)' : ''}${e.bruiseLike ? ' (멍처럼)' : ''}`);
  }
  if (l.angioedema?.present) parts.push(`붓기 ${(l.angioedema.areas ?? []).join('·')}`);
  if (l.trace) parts.push(`흔적 ${l.trace}`);
  if (l.triggers?.length) parts.push(`의심 ${l.triggers.join(', ')}`);
  if (l.foods?.length) parts.push(`먹은 것 ${l.foods.map((f) => `${f.t ? f.t + ' ' : ''}${f.text}`).join(' / ')}`);
  const life = [l.sleepH != null && `잠 ${l.sleepH}시간`, l.wakeItch != null && (l.wakeItch ? '가려워서 깸' : '안 깸'),
    l.waterMl != null && `물 ${l.waterMl}ml`, l.stress != null && `스트레스 ${l.stress}/10`].filter(Boolean);
  if (life.length) parts.push(life.join(', '));
  if (l.period != null) parts.push(l.period ? `생리 중${l.cycleDay ? ` ${l.cycleDay}일째` : ''}` : '생리 아님');
  if (l.newProducts?.length) parts.push(`새 제품 ${l.newProducts.join(', ')}`);
  if (l.env) parts.push(`날씨 ${l.env.temp ?? '?'}°C 습도${l.env.humidity ?? '?'}% PM10 ${l.env.pm10 ?? '?'} PM2.5 ${l.env.pm25 ?? '?'}`);
  if (l.note) parts.push(`메모: ${l.note.replace(/\s*\n\s*/g, ' / ')}`);
  return parts.join(' | ');
}
