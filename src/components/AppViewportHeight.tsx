'use client';

import { useEffect } from 'react';

// Capacitor(contentInset:"always")에서는 100dvh 가 '실제 보이는 높이'보다 안전영역만큼 크다.
// (시뮬레이터 실측: dvh 922 vs clientHeight 860 — 위 노치 62px 만큼 화면이 길어져 하단에 스크롤이 남고,
//  바닥에 붙인 요소가 홈 인디케이터 밑으로 밀린다.) documentElement.clientHeight 는 실제 뷰포트라
//  그 값을 --app-vh 에 넣으면 .min-h-app 이 정확히 맞는다. 브라우저·PWA 에선 clientHeight=뷰포트라 무해.
//
// ⚠️ resize 마다 갱신하면 키보드가 올라올 때 화면이 통째로 줄었다 늘었다 한다 → 방향전환에서만 재측정.
export default function AppViewportHeight() {
  useEffect(() => {
    const set = () => {
      const h = document.documentElement.clientHeight;
      if (h > 0) document.documentElement.style.setProperty('--app-vh', `${h}px`);
    };
    set();
    // 방향전환 직후엔 치수가 아직 안 바뀌어 있어 살짝 늦춰 잰다.
    const onOrient = () => setTimeout(set, 250);
    window.addEventListener('orientationchange', onOrient);
    // 웹뷰 초기 로드 직후 clientHeight 가 0/과도기값일 수 있어 한 번 더.
    const t = setTimeout(set, 300);
    return () => { window.removeEventListener('orientationchange', onOrient); clearTimeout(t); };
  }, []);
  return null;
}
