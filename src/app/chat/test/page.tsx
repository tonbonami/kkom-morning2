'use client';
/**
 * 꼼톡 시험 화면(개발용) — localhost 에서 `/chat/test?emu=1&practice=1&as=우댕`.
 * 에뮬레이터(가짜 메시지)를 읽고, 연습 모드라 보내기·입력 중·읽음이 진짜로 안 간다. 둘 중 하나라도 꺼져 있으면 열지 않는다.
 * 홈(page.tsx)에서 꼼톡을 열면 접속 표시·하트 같은 진짜 동작이 같이 움직여서, 지난 대화 스크롤 검수를 여기서 한다(11/18).
 */
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ChatPanel from '@/components/ChatPanel';
import { useChatMessages } from '@/lib/useChatMessages';
import { usingEmulator } from '@/lib/firebase';
import { isPractice } from '@/lib/practice';

function Inner() {
  const sp = useSearchParams();
  const me = sp.get('as') === '꼼이' ? '꼼이' : '우댕';
  const partner = me === '우댕' ? '꼼이' : '우댕';
  const { messages, hasMore, loadingMore, loadMore } = useChatMessages(me);
  if (typeof window !== 'undefined' && (window.location.hostname !== 'localhost' || !usingEmulator || !isPractice())) {
    return <p style={{ padding: 24 }}>localhost 에서 ?emu=1&amp;practice=1 로만 열 수 있어요.</p>;
  }
  return (
    <ChatPanel
      me={me} partner={partner} messages={messages} open onClose={() => {}}
      onSend={() => {}} partnerOnline={false}
      onLoadMore={loadMore} hasMore={hasMore} loadingMore={loadingMore}
      onSendCapsule={() => {}}
    />
  );
}

export default function ChatTestPage() {
  return <Suspense fallback={null}><Inner /></Suspense>;
}
