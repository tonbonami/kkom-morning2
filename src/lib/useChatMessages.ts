'use client';
/**
 * 꼼톡 메시지 — 실시간 구독은 최근 CHAT_LIVE 개로 **고정**, 그 앞쪽(지난 대화)은 fetchMessagesBefore 로 받아 이어 붙인다.
 *
 * 우댕 2026-11-18: 「오래전 대화 볼 때 불편해. 갑자기 위쪽 대화가 뚝 끊겨서 안 보여. 몇 번 새로 고침 해야 보이고.
 *   이전 대화가 쉽게 보이도록 … 물 흐르듯이 카톡처럼」
 *   예전(page.tsx)엔 「더 보기」마다 구독 개수(40→80…)를 늘려 **구독을 통째로 다시 걸었다** — 다시 걸 때 폰에 남은 일부만 먼저 와서
 *   목록이 줄었다 늘었고, 상대 타임캡슐을 숨겨 개수가 모자라면 「더 있음」이 꺼져 위로 더 못 올라갔다. 구독 오류 땐 목록을 통째로 비웠다.
 *   → 받은 메시지는 id 로 쌓아 두고(새 메시지에 밀려 구독 창 밖으로 나간 것도 그대로), 오류·빈 답이어도 비우지 않는다.
 * ⚠️ 구독 창 밖으로 나간 옛 메시지는 그 뒤의 반응·지우기가 실시간으로는 안 바뀐다(다시 열면 맞음). 지우기는 soft delete 라 문서가 남는다.
 * 타임캡슐: 도착 전(createdAt 미래)엔 상대 것은 숨김, 내 예약분만 보임.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchMessagesBefore, subscribeMessages, type ChatMessage } from './chat';

export const CHAT_LIVE = 50;
export const CHAT_PAGE = 60;

export function useChatMessages(userName: string | null | undefined): {
  messages: ChatMessage[];
  hasMore: boolean;
  loadingMore: boolean;
  loadMore: () => Promise<void>;
} {
  const [store, setStore] = useState<Map<string, ChatMessage>>(() => new Map());
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const busy = useRef(false);
  const storeRef = useRef(store);
  storeRef.current = store;

  useEffect(() => {
    setStore(new Map()); setDone(false);
    const unsub = subscribeMessages((msgs) => {
      if (msgs.length === 0) return;                       // 오류·빈 답(아직 못 받음) — 있던 대화는 그대로
      setStore((prev) => { const next = new Map(prev); msgs.forEach((m) => next.set(m.id, m)); return next; });
      if (msgs.length < CHAT_LIVE) setDone(true);            // 대화 전체가 구독 창 안에 다 들어온다
    }, CHAT_LIVE);
    return () => unsub();
  }, [userName]);

  const messages = useMemo(() => {
    const now = Date.now();
    return [...store.values()]
      .filter((m) => !m.capsule || m.from === userName || (m.createdAt != null && m.createdAt.getTime() <= now))
      .sort((a, b) => (a.createdAt?.getTime() ?? Number.MAX_SAFE_INTEGER) - (b.createdAt?.getTime() ?? Number.MAX_SAFE_INTEGER));
  }, [store, userName]);

  const loadMore = useCallback(async () => {
    if (busy.current || done) return;
    const oldest = [...storeRef.current.values()].reduce<ChatMessage | null>((o, m) => {
      if (!m.createdAt) return o;
      if (!o?.createdAt) return m;
      const dt = m.createdAt.getTime() - o.createdAt.getTime();
      return dt < 0 || (dt === 0 && m.id < o.id) ? m : o;
    }, null);
    if (!oldest) return;
    busy.current = true; setLoading(true);
    try {
      const { msgs, done: d } = await fetchMessagesBefore(oldest, CHAT_PAGE);
      setStore((prev) => { const next = new Map(prev); msgs.forEach((m) => { if (!next.has(m.id)) next.set(m.id, m); }); return next; });
      if (d) setDone(true);
    } catch { /* 못 받았으면 다음에 다시 위로 올리면 또 시도 */ }
    finally { busy.current = false; setLoading(false); }
  }, [done]);

  return { messages, hasMore: !done, loadingMore: loading, loadMore };
}
