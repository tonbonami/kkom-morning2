/**
 * 다꾸 전용 스티커 팩 목록 — 그림은 public/stickers/daku/{팩}/{id}.webp(512px 안쪽, 투명, 씰·라벨류만 흰 칼선).
 *
 * 우댕 2026-11-18: 「지금 다꾸 스티커는 너무 허접해 … 전용 스티커 개발이 시급해」 → 조사(Antigravity)·화풍 시험(GPT) →
 *   「화풍 좋아」 → 「스티커 20개도 넣어」. 계획·그림: claude.ai/artifact/Bg7SJJFVUGxZpDLD3AGp6q, 원본·자르는 스크립트 art/daku/.
 *
 * ⭐ shared = 사이담에도 넘기는 팩(캐릭터 없음). 우댕: 「꿀됑, 꼼이 캐릭터는 여기에서 밖에 못써 … 사이담에서도 많이 쓸 수 있도록」
 *    → 공용 팩엔 꼼이·꿀됑·커플 이름·꼼모닝 글자를 넣지 않는다. 사이담엔 shared 팩 폴더와 이 목록의 그 팩만 넘긴다.
 * ⭐ ratio = 그림의 높이/폭(마테는 길쭉), w = 종이에 처음 붙일 때 폭(종이 폭 비율).
 * ⚠️ 그림을 바꿔도 파일 이름(id)은 바꾸지 말 것 — 이미 붙인 장은 그림 주소를 직접 들고 있다.
 */
export interface DakuSticker { id: string; label: string; ratio: number; w: number }
export interface DakuPack { id: string; label: string; shared: boolean; items: DakuSticker[] }

export const dakuSrc = (pack: string, id: string) => `/stickers/daku/${pack}/${id}.webp`;
export const isDakuSrc = (src?: string) => !!src && src.startsWith('/stickers/daku/');

export const DAKU_PACKS: DakuPack[] = [
  {
    id: 'paper', label: '종이·테이프', shared: true,
    items: [
      { id: 'memo-grid', label: '모눈 떡메', ratio: 1.018, w: 0.42 },
      { id: 'memo-lined', label: '줄 떡메', ratio: 1.013, w: 0.42 },
      { id: 'kraft-torn', label: '찢은 크라프트지', ratio: 0.811, w: 0.42 },
      { id: 'note-sage', label: '세이지 포스트잇', ratio: 1.034, w: 0.38 },
      { id: 'tape-gingham', label: '깅엄 마테', ratio: 0.446, w: 0.46 },
      { id: 'tape-dots', label: '도트 마테', ratio: 0.447, w: 0.46 },
      { id: 'tape-rose', label: '더스티 핑크 마테', ratio: 0.452, w: 0.46 },
      { id: 'tape-sky', label: '하늘 줄무늬 마테', ratio: 0.444, w: 0.46 },
      { id: 'label-box', label: '빈 라벨', ratio: 0.51, w: 0.38 },
      { id: 'label-ticket', label: '티켓 라벨', ratio: 0.569, w: 0.38 },
      { id: 'index-tabs', label: '인덱스 탭', ratio: 0.307, w: 0.36 },
      { id: 'mini-calendar', label: '미니 달력 틀', ratio: 0.756, w: 0.34 },
      { id: 'mark-circle', label: '동그라미 표시', ratio: 0.794, w: 0.3 },
      { id: 'mark-arrow', label: '손그림 화살표', ratio: 0.582, w: 0.3 },
      { id: 'mark-underline', label: '물결 밑줄', ratio: 0.28, w: 0.3 },
      { id: 'mark-sparkles', label: '반짝 별', ratio: 1.059, w: 0.3 },
      { id: 'photo-corner', label: '사진 모서리', ratio: 1.003, w: 0.24 },
      { id: 'wax-seal', label: '왁스 실링', ratio: 0.989, w: 0.24 },
      { id: 'dot-seals', label: '동그라미 씰', ratio: 0.392, w: 0.3 },
      { id: 'speech-bubble', label: '빈 말풍선', ratio: 0.806, w: 0.36 },
    ],
  },
];
