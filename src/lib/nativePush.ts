// 네이티브 앱(Capacitor)에서만 — 커스텀 PushBridge 플러그인으로 APNs 푸시 등록.
// 웹 브라우저에선 no-op. userKey = 'udaeng' | 'kkomi'.
export async function registerNativePush(userKey: 'udaeng' | 'kkomi'): Promise<void> {
  try {
    const { Capacitor, registerPlugin } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;
    const bridge = registerPlugin('PushBridge') as { register(o: { user: string }): Promise<void> };
    await bridge.register({ user: userKey });
  } catch (e) {
    console.warn('네이티브 푸시 등록 실패:', e);
  }
}
