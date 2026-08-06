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
