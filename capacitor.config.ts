import type { CapacitorConfig } from '@capacitor/cli';

// 꼼모닝 네이티브 셸 — 웹(편지·시집·캘린더)은 Vercel 배포본을 그대로 로드하고,
// '우리 낙서장'만 네이티브 캔버스 플러그인으로 present.
const config: CapacitorConfig = {
  appId: 'com.tonbonami.kkommorning',
  appName: '꼼모닝',
  webDir: 'capacitor-shell', // server.url 사용 시 폴백용(거의 안 쓰임)
  server: {
    url: 'https://kkommorning-v2.vercel.app',
    cleartext: false,
  },
  ios: {
    // webview 콘텐츠를 상태바/다이나믹 아일랜드(safe-area) 아래로 내려 상단 잘림 방지.
    // (웹 CSS는 안 건드림 — 네이티브 껍데기에서만 처리)
    contentInset: 'always',
  },
};

export default config;
