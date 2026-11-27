import {
  KKOM_OFFICE_STICKERS,
  KKUL_GLASSES_STICKERS,
  KKUL_STICKERS,
  SAI_STICKERS,
  URI_STICKERS,
} from './stickerPacks';

/**
 * 꼼이어리 답장에 쓸 수 있는 캐릭터 팩만 모은다.
 * 왜 따로 두나: 포차코 팩이 섞이지 않게 고르는 화면과 저장값 검사를 같은 목록으로 맞춘다.
 */
export const DIARY_REPLY_STICKER_PACKS = {
  kkul: KKUL_STICKERS,
  kkulg: KKUL_GLASSES_STICKERS,
  maltipoo: SAI_STICKERS,
  office: KKOM_OFFICE_STICKERS,
  uri: URI_STICKERS,
} as const;

export type DiaryReplyStickerPackId = keyof typeof DIARY_REPLY_STICKER_PACKS;

export const isDiaryReplyStickerPackId = (id: string): id is DiaryReplyStickerPackId =>
  Object.prototype.hasOwnProperty.call(DIARY_REPLY_STICKER_PACKS, id);

/** Firestore에서 읽은 src도 실제 서랍에 있는 그림인지 확인한다. */
export const DIARY_REPLY_STICKER_SRCS = new Set(
  Object.values(DIARY_REPLY_STICKER_PACKS).flatMap((pack) => pack.map((sticker) => sticker.image)),
);
