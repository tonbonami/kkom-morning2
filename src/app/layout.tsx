import type { Metadata, Viewport } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { PwaRegister } from '@/components/pwa-register';
import PresenceHeartbeat from '@/components/PresenceHeartbeat';
import AppViewportHeight from '@/components/AppViewportHeight';
import './globals.css';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Kkom-Morning Companion',
  description: '꼬미의 아침을 여는 따뜻한 보살핌',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Kkom-Morning' },
};

export const viewport: Viewport = {
  themeColor: '#10b981',
};

// ⚠️ 배포가 폰에 바로 반영되게 — 정적 프리렌더/ISR 엣지 캐시를 끈다.
// 2인 앱이라 트래픽이 적어 ISR 재검증이 안 돌면 옛 HTML(=옛 JS 번들=옛 코드)이 계속 남는다.
// force-dynamic이면 매 요청 최신 렌더 + no-store라 엣지·WKWebView 둘 다 stale 안 남는다.
export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@700&family=PT+Sans:wght@400;700&family=Dongle:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("font-body antialiased")}>
        {children}
        <AppViewportHeight />
        <Toaster />
        <PwaRegister />
        <PresenceHeartbeat />
      </body>
    </html>
  );
}
