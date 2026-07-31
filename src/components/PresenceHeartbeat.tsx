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
      if (name) touchPresence(name, active);
    };
    beat(true);
    const hb = setInterval(() => {
      if (document.visibilityState === 'visible') beat(true);
    }, 60 * 1000);
    const onVis = () => beat(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVis);
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
