'use client';

// 전역 접속 표시 — 어느 화면(홈·낙서장·달력…)에 있든 앱이 켜져 있으면 active=true.
// 로그인 사용자는 heartbeat 때마다 localStorage에서 새로 읽음 → 로그인 후 마운트돼 있어도 동작.
import { useEffect } from 'react';
import { touchPresence } from '@/lib/presence';
import { nameFromCode } from '@/lib/letters';

function currentUser(): string | null {
  try {
    const raw = localStorage.getItem('kkom-user');
    if (!raw) return null;
    return nameFromCode(JSON.parse(raw).로그인코드) || null;
  } catch {
    return null;
  }
}

export default function PresenceHeartbeat() {
  useEffect(() => {
    const beat = (active: boolean) => {
      const name = currentUser();
      if (!name) return;
      // ⚠️ active=true(=지금 보고 있음)는 화면이 '실제로 보일 때'만 쓴다.
      //   iOS/Capacitor는 백그라운드에서 웹뷰를 웨이크·리로드한다(아침 푸시 수신·백그라운드 새로고침 등).
      //   그때 이 컴포넌트가 '안 보이는 채로' 마운트되는데, 예전엔 mount의 beat(true)를 무조건 실행해서
      //   앱을 안 켰는데도 presence active=true + 최신 lastSeenAt이 써졌다 → 상대 화면에 '지금 함께' 오탐
      //   (자다 깬 아침 7시대에 '같이 있다'고 뜨던 그것). 이미 hidden이라 visibilitychange도 안 떠 90초간 안 꺼짐.
      //   여기서 막으면 mount·interval·onVis 어느 경로든 active=true는 보일 때만 나간다.
      if (active && document.visibilityState !== 'visible') return;
      touchPresence(name, active);
    };
    beat(true);   // 위 가드로 '보일 때만' 실제 기록됨 — 백그라운드 마운트에선 아무것도 안 씀
    const hb = setInterval(() => {
      if (document.visibilityState === 'visible') beat(true);
    }, 60 * 1000);
    const onVis = () => beat(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVis);
    // 앱이 완전히 내려갈 때(탭 종료·언로드)만 '나감'으로. 화면잠금·백그라운드는 위 visibilitychange가 처리.
    // ⚠️ window 'blur'는 절대 쓰지 말 것 — iOS WKWebView에서 포커스가 잠깐 흔들려도(오버레이·애니메이션·
    //    시스템 UI) 수시로 터져 active=false를 난사한다 → '오프라인↔지금 함께' 5초 깜빡임 + 챗 자동 재오픈.
    const onHide = () => beat(false);
    window.addEventListener('pagehide', onHide);
    return () => {
      clearInterval(hb);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', onHide);
      beat(false);
    };
  }, []);
  return null;
}
