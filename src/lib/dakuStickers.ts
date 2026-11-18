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
  {
    id: 'date', label: '데이트', shared: true,
    items: [
      { id: 'film-strip', label: '필름 띠', ratio: 0.555, w: 0.46 },
      { id: 'four-cut', label: '네컷 틀', ratio: 1.881, w: 0.3 },
      { id: 'cinema-ticket', label: '영화 티켓', ratio: 0.596, w: 0.4 },
      { id: 'cafe-receipt', label: '카페 영수증', ratio: 1.268, w: 0.3 },
      { id: 'postage-stamp', label: '하트 우표', ratio: 0.986, w: 0.26 },
      { id: 'star-rating', label: '별점 다섯 개', ratio: 0.379, w: 0.36 },
      { id: 'heart-gauge', label: '하트 온도계', ratio: 0.962, w: 0.26 },
      { id: 'heart-pin', label: '하트 핀', ratio: 1.164, w: 0.2 },
      { id: 'iced-americano', label: '아이스 아메리카노', ratio: 1.507, w: 0.22 },
      { id: 'strawberry-cake', label: '딸기 케이크', ratio: 0.899, w: 0.28 },
      { id: 'fork-spoon', label: '포크 숟가락', ratio: 1.293, w: 0.22 },
      { id: 'popcorn', label: '팝콘', ratio: 1.243, w: 0.26 },
      { id: 'film-camera', label: '필름 카메라', ratio: 0.727, w: 0.3 },
      { id: 'suitcase', label: '여행 가방', ratio: 0.931, w: 0.3 },
      { id: 'picnic-basket', label: '피크닉 바구니', ratio: 1.039, w: 0.3 },
      { id: 'bubble-tea', label: '버블티', ratio: 1.522, w: 0.22 },
      { id: 'ice-cream', label: '아이스크림', ratio: 1.605, w: 0.2 },
      { id: 'coffee-cheers', label: '커피 짠', ratio: 0.667, w: 0.3 },
      { id: 'opal-sparkles', label: '오팔 반짝이', ratio: 1.124, w: 0.28 },
      { id: 'confetti', label: '색종이 가루', ratio: 0.889, w: 0.34 },
    ],
  },
  {
    id: 'ribbon', label: '리본·꽃', shared: true,
    items: [
      { id: 'bow-satin', label: '새틴 리본', ratio: 0.973, w: 0.26 },
      { id: 'bow-string', label: '끈 리본', ratio: 0.87, w: 0.26 },
      { id: 'bow-gingham', label: '체크 리본', ratio: 0.771, w: 0.24 },
      { id: 'lace-band', label: '레이스 띠', ratio: 0.353, w: 0.46 },
      { id: 'tulip', label: '튤립', ratio: 1.31, w: 0.2 },
      { id: 'daisy-bouquet', label: '데이지 꽃다발', ratio: 1.207, w: 0.26 },
      { id: 'eucalyptus', label: '유칼립투스', ratio: 1.269, w: 0.26 },
      { id: 'clover', label: '네잎클로버', ratio: 1.196, w: 0.16 },
      { id: 'wreath', label: '꽃 화환', ratio: 0.934, w: 0.36 },
      { id: 'envelope', label: '편지 봉투', ratio: 0.716, w: 0.3 },
      { id: 'jewel-heart', label: '보석 하트', ratio: 0.887, w: 0.2 },
      { id: 'double-hearts', label: '겹친 하트', ratio: 0.823, w: 0.24 },
      { id: 'wash-peach', label: '살구 물감', ratio: 0.723, w: 0.5 },
      { id: 'wash-sky', label: '하늘 물감', ratio: 0.695, w: 0.5 },
      { id: 'star-dust', label: '별가루 띠', ratio: 0.335, w: 0.46 },
      { id: 'frill-band', label: '프릴 띠', ratio: 0.305, w: 0.46 },
    ],
  },
];
