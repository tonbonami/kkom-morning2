// Claude에게 보내는 일지 한 줄(상담 맥락·상담 정리가 같이 씀, 서버 전용)
import { medOf } from './skinStats';
import { MEMO_SLOTS, MEMO_SLOT_LABEL, sevOf, type SkinLog } from './skinTypes';

export function dayLine(l: SkinLog): string {
  const parts: string[] = [l.date];
  // 점수: 새 기록은 가려움·붉어짐 0~10(하루 점수 = 둘 중 높은 값), 예전 기록(2026-10-24 전)은 팽진·가려움 0~3
  if (l.itch10 != null || l.redness != null) {
    parts.push(`가려움 ${l.itch10 ?? '?'}/10 붉어짐 ${l.redness ?? '?'}/10 → 하루 점수 ${sevOf(l)}/10`);
  } else if (l.uas != null) {
    parts.push(`(예전 척도) 팽진${l.wheals}/3 가려움${l.itch}/3 → 하루 점수 ${sevOf(l)}/10로 환산`);
  } else parts.push('점수 기록 없음');
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
  for (const k of MEMO_SLOTS) {
    const t = l.memos?.[k]?.trim();
    const n = (l.photos ?? []).filter((p) => p.slot === k).length;
    if (t || n) parts.push(`${MEMO_SLOT_LABEL[k]} 메모: ${(t ?? '').replace(/\s*\n\s*/g, ' / ')}${n ? ` (사진 ${n}장)` : ''}`);
  }
  return parts.join(' | ');
}
