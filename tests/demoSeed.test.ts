// @ts-ignore -- 이 worktree의 공유 node_modules에는 새 devDependency가 아직 설치되지 않았다.
import { describe, expect, it } from 'vitest';
import { demoAt, demoYmd } from '../src/lib/demoSeed';

describe('시연 시각 함수', () => {
  it('오늘과 지난날 시각을 현재보다 미래로 만들지 않는다', () => {
    expect(demoAt(0, 23).toMillis()).toBeLessThanOrEqual(Date.now());
    expect(demoAt(-1, 23).toMillis()).toBeLessThan(Date.now());
    expect(demoYmd(-1) <= demoYmd(0)).toBe(true);
  });
});
