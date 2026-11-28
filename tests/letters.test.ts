// @ts-ignore -- 이 worktree의 공유 node_modules에는 새 devDependency가 아직 설치되지 않았다.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { isLocked, type Letter } from '../src/lib/letters';

function letter(openAt?: Timestamp | null): Letter {
  return {
    id: 'letter-1',
    from: '우댕',
    to: '꼼이',
    body: '',
    createdAt: null,
    openAt,
  };
}

afterEach(() => vi.useRealTimers());

describe('isLocked', () => {
  it('예약 시각 전에는 잠기고 도달하면 열린다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-28T00:00:00.000Z'));
    const now = Date.now();

    expect(isLocked(letter(Timestamp.fromMillis(now + 1)))).toBe(true);
    expect(isLocked(letter(Timestamp.fromMillis(now)))).toBe(false);
    expect(isLocked(letter(null))).toBe(false);
  });
});
