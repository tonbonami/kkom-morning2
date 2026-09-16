'use client';

// 우연 감시 — 전역(레이아웃)에 한 번 마운트. 어느 화면에 있든 '동시 입장/오랜만' 을
// 감지해 기록하고, 홈에서만 아직 안 본 우연을 부드러운 카드로 띄운다.
// (같은 걸 동시에=하트 동시던짐은 liveHearts.ts 에서 감지해 같은 컬렉션에 기록됨)
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { subscribePresence, isTogetherNow, serverNow, type Presence } from '@/lib/presence';
import {
  subscribeSerendipity, recordSerendipity, markSerendipitySeen, serendipityLine, type Serendipity,
} from '@/lib/serendipity';
import { nameFromCode, partnerOf } from '@/lib/letters';

function currentUser(): string | null {
  try {
    const raw = localStorage.getItem('kkom-user');
    if (!raw) return null;
    return nameFromCode(JSON.parse(raw).로그인코드) || null;
  } catch { return null; }
}

const SIX_H = 6 * 3600_000;
const FRESH_MS = 30_000;   // '방금 접속' 판정 창

export default function SerendipityWatch() {
  const pathname = usePathname();
  const [me, setMe] = useState<string | null>(null);
  const [items, setItems] = useState<Serendipity[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const arrivalRef = useRef(0);
  const myAwayRef = useRef(0);

  // me 확정 + 내 도착시각 + 내 부재시간(로컬 저장 기준). 부재는 앱 나갈 때 갱신.
  useEffect(() => {
    const name = currentUser();
    if (!name) return;
    setMe(name);
    arrivalRef.current = serverNow();
    try {
      const last = Number(localStorage.getItem(`kkom-lastactive-${name}`) || 0);
      myAwayRef.current = last ? Math.max(0, Date.now() - last) : 0;
    } catch { /* noop */ }
    const mark = () => { try { localStorage.setItem(`kkom-lastactive-${name}`, String(Date.now())); } catch { /* noop */ } };
    mark();
    const iv = setInterval(mark, 30_000);
    const onHide = () => mark();
    const onVis = () => { if (document.visibilityState === 'hidden') mark(); };
    window.addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(iv);
      window.removeEventListener('pagehide', onHide);
      document.removeEventListener('visibilitychange', onVis);
      mark();
    };
  }, []);

  // 상대 프레즌스 감시 → 동시 입장 / 오랜만에 딱 맞춰
  useEffect(() => {
    if (!me) return;
    const partner = partnerOf(me);
    let firstSnap = true;
    let recorded = false;
    let partnerActiveAtArrival = false;
    let partnerPrevSeen = 0;   // 도착 시점 상대 last-seen(부재 추정용)

    const fire = (seen: number) => {
      recorded = true;
      const gapSec = Math.abs(seen - arrivalRef.current) / 1000;
      const partnerAway = partnerPrevSeen ? Math.max(0, arrivalRef.current - partnerPrevSeen) : 0;
      const awayMax = Math.max(myAwayRef.current, partnerAway);
      void recordSerendipity(awayMax >= SIX_H ? 'reunion' : 'sync-entry', { gapSec });
    };

    const unsub = subscribePresence(partner, (p: Presence) => {
      const seen = p.lastSeenAt?.getTime() ?? 0;
      const now = serverNow();

      if (firstSnap) {
        firstSnap = false;
        partnerPrevSeen = seen;
        partnerActiveAtArrival = isTogetherNow(p);
        // ⚠️ 도착 순간 상대가 이미 active면 아무것도 안 함 — 상대 last-seen이 최근이어도
        //    그건 하트비트지 '방금 도착'이 아니라 구분 불가. 내가 상대를 따라 들어간 경우라 오탐.
        //    진짜 동시라면 '먼저 들어온 쪽' 기기가 아래 케이스(상대 offline→online)로 잡고,
        //    버킷 id 로 양쪽이 같은 문서에 써져 중복 안 됨.
        return;
      }
      // 도착 땐 없던 상대가 곧(도착 후 창 안) 들어옴 → 동시 입장(둘 다 방금, 서로 모르고)
      if (!recorded && !partnerActiveAtArrival && isTogetherNow(p)
          && now - arrivalRef.current < FRESH_MS + 10_000
          && seen && now - seen < FRESH_MS) {
        fire(seen);
      }
    });
    return unsub;
  }, [me]);

  // 우연 목록 구독
  useEffect(() => {
    if (!me) return;
    return subscribeSerendipity(setItems);
  }, [me]);

  const dismiss = (s: Serendipity) => {
    setDismissed((prev) => new Set(prev).add(s.id));
    if (me) void markSerendipitySeen(s.id, me);
  };

  // 홈에서만, 아직 안 본(그리고 방금 닫지 않은) 최신 우연 하나.
  // ⚠️ 반드시 '최근(10분)'만 — 문구가 "방금"이라 옛 우연은 말이 안 되고,
  //    seen 저장이 어긋나도 시간이 지나면 스스로 사라져 '영구 박제'가 구조적으로 불가능해진다.
  const RECENT_MS = 10 * 60_000;
  const unseen = me && pathname === '/'
    ? items.find((s) => !s.seen?.[me] && !dismissed.has(s.id)
        && s.at != null && serverNow() - s.at.getTime() < RECENT_MS) ?? null
    : null;
  const line = unseen ? serendipityLine(unseen) : null;

  return (
    <AnimatePresence>
      {unseen && line && (
        <motion.div
          key={unseen.id}
          className="fixed left-1/2 top-0 z-50 w-[min(92vw,430px)] -translate-x-1/2"
          style={{ paddingTop: 'max(env(safe-area-inset-top), 10px)' }}
          initial={{ y: -70, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -70, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        >
          <div className="mx-3 flex items-center gap-3 rounded-[20px] border border-[#F3DFE8] bg-white/95 px-4 py-3 shadow-[0_12px_34px_-14px_rgba(180,90,120,0.45)] backdrop-blur-xl">
            <div className="shrink-0 text-[26px] leading-none">{line.icon}</div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold uppercase tracking-[2.5px] text-[#E65C90]">우연</div>
              <div className="mt-0.5 text-[14px] font-medium leading-snug text-[#3B2D30]">{line.text}</div>
            </div>
            <button onClick={() => dismiss(unseen)} aria-label="닫기"
              className="shrink-0 p-1 text-slate-300 transition-transform active:scale-90 hover:text-slate-500">✕</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
