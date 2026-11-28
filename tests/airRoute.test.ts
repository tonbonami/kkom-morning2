import { afterEach, describe, expect, it, vi } from 'vitest';
import { kstDate, parseRegionGrade } from '../src/lib/airHelpers';

afterEach(() => vi.useRealTimers());

describe('대기질 날짜와 권역 파싱', () => {
  it('한국 시간 자정 경계에서 날짜가 바뀐다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-27T14:59:59.999Z'));
    expect(kstDate()).toBe('2026-11-27');

    vi.setSystemTime(new Date('2026-11-27T15:00:00.000Z'));
    expect(kstDate()).toBe('2026-11-28');
    expect(kstDate(1)).toBe('2026-11-29');
  });

  it('통보 문자열에서 요청한 권역 등급만 꺼낸다', () => {
    const grades = '서울 : 보통, 인천 : 보통, 경기북부 : 나쁨, 경기남부 : 좋음';

    expect(parseRegionGrade(grades, '경기북부')).toBe('나쁨');
    expect(parseRegionGrade(grades, '강원영서')).toBe('정보 없음');
    expect(parseRegionGrade(null, '경기북부')).toBe('정보 없음');
  });
});
