'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { demoBadgeHidden, hideDemoBadge, installDemoRuntime, isDemo, leaveDemo } from '@/lib/demo';
import { demoReady } from '@/lib/firebase';

installDemoRuntime();

// ⚠️ 서버 렌더와 첫 클라이언트 렌더가 같아야 한다(하이드레이션) — 시연 여부는 화면이 뜬 뒤(useEffect)에만 판단한다.
//    데이터 바꿔치기는 firebase.ts 를 읽을 때 이미 끝나 있고(네트워크 끔 → 예시 쓰기 순서), 그동안은 덮개로 가린다.
export default function DemoProvider({ children }: { children: ReactNode }) {
  const [demo, setDemo] = useState(false);
  const [ready, setReady] = useState(false);
  const [badgeHidden, setBadgeHidden] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    if (!isDemo()) return;
    setDemo(true);
    setBadgeHidden(demoBadgeHidden());
    if (window.location.pathname === '/login') { window.location.replace('/'); return; }
    let live = true;
    demoReady.finally(() => { if (live) setReady(true); });
    return () => { live = false; };
  }, []);

  return (
    <>
      {children}
      {demo && !ready && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-[#fff8fa] text-[#a45172]">
          <div className="flex items-center gap-2 text-sm font-semibold" role="status">
            <span className="h-4 w-4 rounded-full border-2 border-[#f2a3bf] border-t-transparent animate-spin" />
            예시 데이터를 준비하고 있어요
          </div>
        </div>
      )}
      {demo && ready && !badgeHidden && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-[10000] flex flex-col items-center gap-1.5"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 5px)' }}
        >
          <button
            type="button"
            onClick={() => setMenu((m) => !m)}
            className="rounded-full border border-[#f6b4ca] bg-[#fff0f5]/95 px-3 py-1 text-[11px] font-bold text-[#b54f76] shadow-sm backdrop-blur"
            aria-expanded={menu}
            aria-label="시연 모드 메뉴"
          >
            시연 모드 · 예시 데이터
          </button>
          {menu && (
            <div className="flex gap-1.5 rounded-2xl border border-[#f6b4ca] bg-white/95 p-1.5 shadow-md backdrop-blur">
              <button
                type="button"
                onClick={() => { hideDemoBadge(); setBadgeHidden(true); setMenu(false); }}
                className="whitespace-nowrap rounded-xl bg-[#fff0f5] px-3 py-1.5 text-[12px] font-bold text-[#b54f76]"
              >
                표시 숨기기(촬영용)
              </button>
              <button
                type="button"
                onClick={leaveDemo}
                className="whitespace-nowrap rounded-xl bg-[#b54f76] px-3 py-1.5 text-[12px] font-bold text-white"
              >
                시연 끝내기
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
