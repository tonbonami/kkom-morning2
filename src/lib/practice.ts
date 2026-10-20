// 연습 모드 — Aside 같은 검수자가 "진짜로 눌러 보며" 써 볼 수 있게, 상대에게 닿는 쓰기를 전부 막는다.
//   켜기: 주소 끝 ?practice=1 (이 탭이 닫힐 때까지 유지 — sessionStorage) · 끄기: ?practice=0
//   막는 것: 메시지·타임캡슐 전송, 입력 중 표시, 읽음, 반응·수정·삭제·별표, 사진/음성/영상 업로드, 접속(presence) 표시.
//   막힌 동작은 'kk-practice' 이벤트로 알려 ChatPanel이 "안 보냈어요" 토스트를 띄운다.
const KEY = 'kk-practice';

export function isPractice(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const sp = new URLSearchParams(window.location.search);
    const q = sp.get('practice');
    if (q === '1') sessionStorage.setItem(KEY, '1');
    if (q === '0') sessionStorage.removeItem(KEY);
    // 피부 일지 연습 모드에서 보기 전용(우댕 폰) 흉내: &view=1 / 끄기 &view=0
    const v = sp.get('view');
    if (v === '1') sessionStorage.setItem(KEY + '-view', '1');
    if (v === '0') sessionStorage.removeItem(KEY + '-view');
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

// 막았다고 알림 — what: "이모티콘 「배고파」" 처럼 사람이 읽을 말
export function practiceBlocked(what: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<string>(KEY, { detail: what }));
}

// 피부 일지 연습 모드에서 보기 전용으로 흉내 낼지(isPractice가 주소의 view=1을 기억해 둔다)
export function practiceAsViewer(): boolean {
  if (typeof window === 'undefined') return false;
  try { isPractice(); return sessionStorage.getItem(KEY + '-view') === '1'; } catch { return false; }
}
