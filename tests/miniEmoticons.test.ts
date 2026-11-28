import { describe, expect, it } from 'vitest';
import { insertMiniToken, splitMini } from '../src/lib/miniEmoticons';

describe('미니 이모티콘', () => {
  it('아는 단어만 미니 조각으로 나누고 모르는 괄호는 글자로 둔다', () => {
    expect(splitMini('안녕 (사랑해) (내일 보자)')).toEqual([
      { kind: 'text', text: '안녕 ' },
      { kind: 'mini', word: '사랑해', src: '/emo/saidami/love.webp' },
      { kind: 'text', text: ' (내일 보자)' },
    ]);
  });

  it('선택 범위를 토큰으로 바꾸고 새 커서 위치를 돌려준다', () => {
    expect(insertMiniToken('오늘 정말 좋아', 3, 5, '행복')).toEqual({
      value: '오늘 (행복) 좋아',
      caret: 7,
    });
  });
});
