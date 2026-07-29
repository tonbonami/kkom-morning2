import type { CapacitorConfig } from '@capacitor/cli';

// 꼼모닝 네이티브 셸 — 웹(편지·시집·캘린더)은 Vercel 배포본을 그대로 로드하고,
// '우리 낙서장'만 네이티브 캔버스 플러그인으로 present.
const config: CapacitorConfig = {
  appId: 'com.kkommorning.app',
  appName: '꼼모닝',
  webDir: 'capacitor-shell', // server.url 사용 시 폴백용(거의 안 쓰임)
  server: {
    url: 'https://kkommorning-v2.vercel.app',
    cleartext: false,
  },
};

export default config;
