import type { LetterMood } from './letterMoods';
import { isDemo } from './demo';

// 네이티브 심장박동 햅틱 — 하트 받으면 폰이 두근두근(Core Haptics). PWA/웹은 no-op(false).
export async function heartbeatHaptic(): Promise<boolean> {
  try {
    const { Capacitor, registerPlugin } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return false;
    const b = registerPlugin('HapticBridge') as { heartbeat(): Promise<void> };
    await b.heartbeat();
    return true;
  } catch {
    return false;
  }
}

// 편지 봉투 분위기 햅틱 — iPhone 앱에서만 짧게 재생. 웹/PWA와 옛 네이티브 빌드는 조용히 건너뛴다.
export async function letterMoodHaptic(mood: LetterMood): Promise<boolean> {
  try {
    // 왜: 시연 모드는 네이티브 기능을 건드리지 않고, 이 연출은 iPhone 전용 Core Haptics다.
    if (isDemo()) return false;
    // 다른 곳처럼 @capacitor/core 는 쓸 때 불러온다(웹·서버 렌더에서 미리 안 싣게).
    const { Capacitor, registerPlugin } = await import('@capacitor/core');
    if (Capacitor.getPlatform() !== 'ios') return false;
    const bridge = registerPlugin('HapticBridge') as {
      letterMood(options: { mood: LetterMood }): Promise<void>;
    };
    await bridge.letterMood({ mood });
    return true;
  } catch {
    return false;
  }
}
