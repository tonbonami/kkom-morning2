'use client';
// 꼼이 피부 일지 — Claude 상담. 겉모습은 SkinChat(제미나이 시안, 값 그대로), 여기선 대화 불러오기·보내기·흘려 받기만.
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import SkinChat from '@/components/skin/SkinChat';
import SkinScreen from '@/components/skin/SkinScreen';
import { fetchSkinUsage, skinSession, type SkinUsage } from '@/lib/skinClient';
import { isPractice } from '@/lib/practice';
import { demo } from '@/lib/skinDemo';

type Msg = { id: string; role: 'user' | 'assistant'; text: string; at: string };

const SUGGESTIONS = [
  '지금까지 기록 전체를 보고 정리해 줘',
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
  const [readOnly, setReadOnly] = useState(true);
  // 우댕 폰(보기 전용)은 꼼이 상담을 읽기만 하고, 위에 Claude 사용량(비용) 카드
  const [usage, setUsage] = useState<SkinUsage | null>(null);
  useEffect(() => {
    skinSession().then((s) => {
      const ro = s.role !== 'kkomi';
      setReadOnly(ro);
      if (ro) fetchSkinUsage().then(setUsage).catch(() => {});
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (isPractice()) return; // 연습 모드: 저장된 대화 안 불러옴
    fetch('/api/skin/chat', { cache: 'no-store' })
      .then((r) => {
        if (r.status === 401) { router.replace('/skin'); return null; }
        return r.ok ? r.json() : null;
      })
      .then((j) => { if (j?.messages) setMessages(j.messages); })
      .catch(() => {});
  }, [router]);

  const onSend = async (text: string) => {
    if (readOnly) { window.alert('보기 전용이에요 — 상담은 꼼이만 할 수 있어요'); return; }
    if (busy.current) return;
    busy.current = true;
    setSending(true);
    const mine: Msg = { id: `local-${Date.now()}`, role: 'user', text, at: new Date().toISOString() };
    setMessages((m) => [...m, mine]);
    setStreamingText('');
    let full = '';
    try {
      if (isPractice()) {
        // 연습 모드: 실제 Claude 대신 정해진 안내를 글자씩 흘려 보여 준다(서버·비용 0)
        for (const ch of demo.chatReply) { full += ch; setStreamingText(full); await new Promise((r) => setTimeout(r, 12)); }
        return;
      }
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
    <SkinScreen>
    <SkinChat
      messages={messages.map((m) => ({ ...m, at: timeText(m.at) }))}
      streamingText={streamingText}
      onSend={onSend}
      sending={sending}
      onBack={() => (window.history.length > 1 ? router.back() : router.push('/skin'))} // 기록 화면·분석 어디서 왔든 돌아가기
      suggestions={readOnly ? [] : SUGGESTIONS}
      readOnly={readOnly}
      usage={usage}
    />
    </SkinScreen>
  );
}
