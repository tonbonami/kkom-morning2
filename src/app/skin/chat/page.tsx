'use client';
// 꼼이 피부 일지 — Claude 상담. 겉모습은 SkinChat(제미나이 시안, 값 그대로), 여기선 대화 불러오기·보내기·흘려 받기만.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import SkinChat from '@/components/skin/SkinChat';
import SkinScreen from '@/components/skin/SkinScreen';
import { addDays, fetchChatSummary, fetchSkinPhotos, fetchSkinUsage, kstToday, skinSession, uploadSkinPhoto, type SkinUsage } from '@/lib/skinClient';
import { MEMO_SLOT_LABEL, type MemoSlot } from '@/lib/skinTypes';
import { isPractice } from '@/lib/practice';
import { demo } from '@/lib/skinDemo';

type Msg = { id: string; role: 'user' | 'assistant'; text: string; at: string; photoUrls?: string[] };
// 상담에 보낼 사진(우댕 2026-11-08 「ⓐ 상담 화면에 사진 올리기」) — 일지 사진을 가리킨다(date/id). 새로 찍은 건 먼저 오늘 일지에 올린다.
type Pending = { key: string; url: string; uploading?: boolean; date?: string; id?: string };
const MAX_PHOTOS = 3;
// 기록 화면과 같은 규칙: 5~11시 아침 · 11~16시 점심 · 16~21시 저녁 · 그 밖 밤
const nowSlot = (): MemoSlot => {
  const h = new Date(Date.now() + 9 * 3600_000).getUTCHours();
  return h >= 5 && h < 11 ? 'morning' : h >= 11 && h < 16 ? 'noon' : h >= 16 && h < 21 ? 'evening' : 'night';
};

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

  // ── 사진 보내기 ──
  const [pending, setPending] = useState<Pending[]>([]);
  const [recent, setRecent] = useState<{ key: string; url: string; label: string; date: string; id: string }[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const loadRecent = useCallback(async () => {
    setLoadingRecent(true);
    const today = kstToday();
    const dayWord = (d: string) => d === today ? '오늘' : d === addDays(today, -1) ? '어제' : `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}`;
    const days = Array.from({ length: 7 }, (_, i) => addDays(today, -i));   // 오늘 → 6일 전
    const lists = await Promise.all(days.map((d) => fetchSkinPhotos(d)
      .then((ps) => [...ps].reverse().map((p) => ({ key: `${d}/${p.id}`, url: p.url, date: d, id: p.id, label: `${dayWord(d)} ${p.slot ? MEMO_SLOT_LABEL[p.slot] : '예전'}` })))
      .catch(() => [])));
    setRecent(lists.flat());
    setLoadingRecent(false);
  }, []);
  const pickRecent = (key: string) => setPending((cur) => {
    if (cur.some((p) => p.key === key) || cur.length >= MAX_PHOTOS) return cur;
    const r = recent.find((x) => x.key === key);
    return r ? [...cur, { key, url: r.url, date: r.date, id: r.id }] : cur;
  });
  const addNew = (file: File) => {
    if (pending.length >= MAX_PHOTOS) return;
    const tmp = `new-${Date.now()}`;
    const today = kstToday();
    setPending((cur) => [...cur, { key: tmp, url: URL.createObjectURL(file), uploading: true }]);
    uploadSkinPhoto(today, file, nowSlot())
      .then((ph) => setPending((cur) => cur.map((p) => (p.key === tmp ? { key: `${today}/${ph.id}`, url: ph.url, date: today, id: ph.id } : p))))
      .catch(() => {
        setPending((cur) => cur.filter((p) => p.key !== tmp));
        window.alert('사진을 올리지 못했어요. 잠시 뒤에 다시 해 주세요.');
      });
  };
  const removePending = (key: string) => setPending((cur) => cur.filter((p) => p.key !== key));

  // 「상담 정리하기」 버튼 — 최근 7일 중 정리 안 한(또는 반영 전) 날을 **오래된 날부터** 하나씩(어제 → 오늘 순).
  // 그런 날이 없고 오늘 상담이 있으면 「오늘 정리 다시 보기」. 반영한 뒤 상담을 더 했으면 그날은 다시 「정리하기」.
  // (우댕 2026-10-22: 어제 28말 상담이 정리 없이 끝남 / 오늘 상담을 시작해도 어제 정리로 갈 길이 남아 있어야)
  const [sum, setSum] = useState<{ state: 'none' | 'draft' | 'applied'; date: string } | null>(null);
  const refreshSummary = useCallback(async () => {
    const today = kstToday();
    const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6)); // 6일 전 → 오늘
    const rows = await Promise.all(days.map((d) => fetchChatSummary(d).catch(() => null)));
    let todayRow: { state: 'none' | 'draft' | 'applied'; date: string } | null = null;
    for (let i = 0; i < days.length; i++) {
      const r = rows[i];
      if (!r || r.msgCount === 0) continue;
      const s = r.summary;
      const state = !s ? 'none' : s.status === 'applied' && r.msgCount > s.msgCount ? 'none' : s.status;
      if (state !== 'applied') { setSum({ state, date: days[i] }); return; }
      if (days[i] === today) todayRow = { state, date: today };
    }
    setSum(todayRow);
  }, []);
  useEffect(() => { void refreshSummary(); }, [refreshSummary]);

  const onSend = async (text: string) => {
    if (readOnly) { window.alert('보기 전용이에요 — 상담은 꼼이만 할 수 있어요'); return; }
    if (busy.current) return;
    busy.current = true;
    setSending(true);
    const photos = pending.filter((p) => !p.uploading && p.date && p.id);
    if (!text && !photos.length) { busy.current = false; setSending(false); return; }
    const mine: Msg = { id: `local-${Date.now()}`, role: 'user', text, at: new Date().toISOString(), ...(photos.length ? { photoUrls: photos.map((p) => p.url) } : {}) };
    setMessages((m) => [...m, mine]);
    setPending([]);
    setStreamingText('');
    let full = '';
    try {
      if (isPractice()) {
        // 연습 모드: 실제 Claude 대신 정해진 안내를 글자씩 흘려 보여 준다(서버·비용 0)
        for (const ch of demo.chatReply) { full += ch; setStreamingText(full); await new Promise((r) => setTimeout(r, 12)); }
        return;
      }
      const r = await fetch('/api/skin/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, photos: photos.map((p) => ({ date: p.date, id: p.id })) }),
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
      void refreshSummary(); // 답을 받으면 「오늘 상담 정리하기」 버튼이 나타나거나 다시 「정리하기」로
    }
  };

  return (
    <SkinScreen>
    <SkinChat
      messages={messages.map(({ photoUrls, ...m }) => ({ ...m, at: timeText(m.at), ...(photoUrls?.length ? { photos: photoUrls.map((url) => ({ url })) } : {}) }))}
      streamingText={streamingText}
      onSend={onSend}
      sending={sending}
      onBack={() => router.push('/skin')} // 늘 기록 화면으로(뒤로 가기로 하면 정리 화면과 서로 오가며 갇혔다 — Aside 3차)
      suggestions={readOnly ? [] : SUGGESTIONS}
      readOnly={readOnly}
      attach={readOnly ? null : {
        pending: pending.map(({ key, url, uploading }) => ({ key, url, uploading })),
        max: MAX_PHOTOS,
        recent: recent.map(({ key, url, label }) => ({ key, url, label })),
        loadingRecent,
        onOpen: () => { void loadRecent(); },
        onAddNew: addNew,
        onPickRecent: pickRecent,
        onRemove: removePending,
      }}
      usage={usage}
      summary={sum ? {
        state: sum.state,
        dayWord: sum.date === kstToday() ? '오늘' : sum.date === addDays(kstToday(), -1) ? '어제' : `${Number(sum.date.slice(5, 7))}/${Number(sum.date.slice(8, 10))}`,
        onOpen: () => router.push(`/skin/chat/summary?date=${sum.date}`),
      } : null}
    />
    </SkinScreen>
  );
}
