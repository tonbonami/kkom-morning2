// 액션 피드백 — 햅틱(Android는 vibrate, iOS는 미지원) + 글로벌 토스트.
// 사용자: '이모티콘 보냈을 때, 댓글 달았을 때, 편지 보냈을 때... 반응이 없어 제대로 됐는지 모르겠어.'
// haptic()만 호출하면 진동만, feedback(msg)는 진동 + 떠오르는 토스트.

export type FeedbackKind = 'success' | 'error' | 'info' | 'love';

/** Android는 작동, iOS Safari/PWA는 미지원(silent fail). */
export function haptic(pattern: number | number[] = 30): void {
  if (typeof navigator === 'undefined') return;
  try {
    if ('vibrate' in navigator) (navigator as any).vibrate(pattern);
  } catch {}
}

let toastEl: HTMLDivElement | null = null;
let timer: number | null = null;

function ensureEl(): HTMLDivElement | null {
  if (typeof document === 'undefined') return null;
  if (toastEl && document.body.contains(toastEl)) return toastEl;
  toastEl = document.createElement('div');
  toastEl.setAttribute('role', 'status');
  toastEl.setAttribute('aria-live', 'polite');
  toastEl.style.cssText = [
    'position: fixed',
    'top: max(28px, env(safe-area-inset-top))',
    'left: 50%',
    'transform: translate(-50%, -140%)',
    'background: #10B981',
    'color: #fff',
    'padding: 11px 20px',
    'border-radius: 999px',
    'font-weight: 800',
    'font-size: 14px',
    'line-height: 1.2',
    'box-shadow: 0 10px 28px rgba(16, 185, 129, 0.4)',
    'z-index: 99999',
    'pointer-events: none',
    'transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s',
    'opacity: 0',
    'max-width: calc(100% - 32px)',
    'white-space: nowrap',
    'overflow: hidden',
    'text-overflow: ellipsis',
  ].join(';');
  document.body.appendChild(toastEl);
  return toastEl;
}

/** 햅틱 + 떠오르는 토스트(1.8초). iOS 햅틱 미지원이라 시각 피드백이 핵심. */
export function feedback(message: string, kind: FeedbackKind = 'success'): void {
  if (typeof window === 'undefined') return;
  haptic(kind === 'error' ? [40, 30, 40] : kind === 'love' ? [15, 30, 15] : 30);

  const el = ensureEl();
  if (!el) return;

  const bg =
    kind === 'error' ? '#EF4444'
    : kind === 'info' ? '#3B82F6'
    : kind === 'love' ? '#EC4899'
    : '#10B981';
  el.style.background = bg;
  el.style.boxShadow = `0 10px 28px ${bg}66`;
  el.textContent = message;

  requestAnimationFrame(() => {
    if (!el) return;
    el.style.transform = 'translate(-50%, 0)';
    el.style.opacity = '1';
  });

  if (timer) window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    if (!el) return;
    el.style.transform = 'translate(-50%, -140%)';
    el.style.opacity = '0';
    timer = null;
  }, 1800);
}
