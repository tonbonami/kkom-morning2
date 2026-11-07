'use client';

// 봉투 시험 — 편지함 그대로(가짜 편지 두 통, 데이터 안 씀). 편지 3탄 연결 확인용.
//   ① 꼼이 → 우댕, 아직 안 연 새 편지(로즈 편지지) → 목록에 봉투 칸. 누르면 처음 열기 확인(가짜 id 라 '이미 열림'으로 판단돼 바로 편지).
//   ② 꼼이 → 우댕, 옛 편지 → 평소 칸. 열면 귀퉁이 생각풍선.
import LetterInboxV3, { type Letter } from '@/components/LetterInboxV3';

const now = Date.now();
const LETTERS: Letter[] = [
  {
    id: 'mock-envelope-new', from: '꼼이', to: '우댕',
    body: '오늘도 고마워 (하트) 퇴근하고 맛있는 거 먹자 (헤헤)\n항상 사랑해 (사랑해)',
    createdAt: new Date(now - 3 * 60 * 1000), paper: 'rose', revealVersion: 1, firstOpenedAt: null,
    emoticonIds: ['anim/love', 'kkul/02-saranghae'], hearts: 0, commentCount: 0,
  },
  {
    id: 'mock-envelope-old', from: '꼼이', to: '우댕',
    body: '예전에 보낸 편지 (사랑해)', createdAt: new Date(now - 26 * 60 * 60 * 1000),
    emoticonIds: ['anim/hug'], hearts: 2, commentCount: 0,
  },
];

export default function EnvelopeInboxTest() {
  return (
    <LetterInboxV3
      me="우댕"
      letters={LETTERS}
      hasMore={false}
      onLoadMore={() => {}}
      loading={false}
      onWriteLetter={() => {}}
      onHeart={async () => {}}
      subscribeComments={(_id, cb) => { cb([]); return () => {}; }}
      addComment={async () => {}}
      deleteComment={async () => {}}
    />
  );
}
