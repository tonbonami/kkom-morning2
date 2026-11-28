import { describe, expect, it } from 'vitest';
import { emptyStats, normalizeStats, todayKey } from '../src/lib/dailyStats';

describe('dailyStats', () => {
  it('한국 시간 자정에 날짜 키가 바뀐다', () => {
    expect(todayKey(new Date('2026-11-27T14:59:59.999Z'))).toBe('2026-11-27');
    expect(todayKey(new Date('2026-11-27T15:00:00.000Z'))).toBe('2026-11-28');
  });

  it('빈 통계에 쓰담과 선물 범프를 포함한다', () => {
    expect(emptyStats().bumps.pet).toEqual({ 우댕: 0, 꼼이: 0 });
    expect(emptyStats().bumps.gift).toEqual({ 우댕: 0, 꼼이: 0 });
  });

  it('일부만 저장된 통계를 채우면서 쓰담과 선물 수를 보존한다', () => {
    const stats = normalizeStats({
      letters: { 꼼이: 2 },
      bumps: {
        pet: { 우댕: 3 },
        gift: { 꼼이: 4 },
      },
    });

    expect(stats.letters).toEqual({ 우댕: 0, 꼼이: 2 });
    expect(stats.bumps.pet).toEqual({ 우댕: 3, 꼼이: 0 });
    expect(stats.bumps.gift).toEqual({ 우댕: 0, 꼼이: 4 });
    expect(stats.bumps.miss).toEqual({ 우댕: 0, 꼼이: 0 });
  });
});
