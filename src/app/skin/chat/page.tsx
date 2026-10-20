'use client';
// 꼼이 피부 일지 — Claude 상담. 겉모습은 SkinChat(제미나이 시안, 값 그대로), 여기선 대화 불러오기·보내기·흘려 받기만.
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import SkinChat from '@/components/skin/SkinChat';

type Msg = { id: string; role: 'user' | 'assistant'; text: string; at: string };

const SUGGESTIONS = [
  '요즘 기록 보면 뭐가 의심돼?',
  '약 거른 다음날 왜 더 심해질까?',
  '병원 갈 때 뭘 물어보면 좋을까?',
  '오늘 가려운데 뭘 조심하면 돼?',
];

const timeText = (iso: string) =>
  new Date(iso).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Seoul' });

export default function SkinChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const busy = useRef(false);

  useEffect(() => {
    fetch('/api/skin/chat', { cache: 'no-store' })
      .then((r) => {
        if (r.status === 401) { router.replace('/skin'); return null; }
        return r.ok ? r.json() : null;
      })
      .then((j) => { if (j?.messages) setMessages(j.messages); })
      .catch(() => {});
  }, [router]);

  const onSend = async (text: string) => {
    if (busy.current) return;
    busy.current = true;
    setSending(true);
    const mine: Msg = { id: `local-${Date.now()}`, role: 'user', text, at: new Date().toISOString() };
    setMessages((m) => [...m, mine]);
    setStreamingText('');
    let full = '';
    try {
      const r = await fetch('/api/skin/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }),
      });
      if (r.status === 401) { router.replace('/skin'); return; }
      if (r.status === 429) full = '오늘은 상담을 많이 해서 여기까지예요. 내일 다시 이야기해요.';
      else if (!r.ok || !r.body) full = '지금 Claude와 연결이 안 돼요. 잠시 뒤에 다시 보내 주세요.';
      else {
        const reader = r.body.getReader();
        const dec = new TextDecoder();
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          full += dec.decode(value, { stream: true });
          setStreamingText(full);
        }
      }
    } catch {
      full = full || '지금 Claude와 연결이 안 돼요. 잠시 뒤에 다시 보내 주세요.';
    } finally {
      setStreamingText(null);
      if (full) setMessages((m) => [...m, { id: `local-a-${Date.now()}`, role: 'assistant', text: full, at: new Date().toISOString() }]);
      setSending(false);
      busy.current = false;
    }
  };

  return (
    <SkinChat
      messages={messages.map((m) => ({ ...m, at: timeText(m.at) }))}
      streamingText={streamingText}
      onSend={onSend}
      sending={sending}
      onBack={() => router.push('/skin/insights')}
      suggestions={SUGGESTIONS}
    />
  );
}
