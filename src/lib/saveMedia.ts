// 원본 사진·동영상 저장 — 플랫폼별로 가장 자연스러운 경로를 고른다.
//   · iOS(WKWebView/Safari): 네이티브 공유 시트 → "이미지 저장" / "비디오 저장"
//   · 데스크톱 웹: 앵커 download 로 원본 파일 저장
//   · CORS·네트워크 실패: 원본을 새 탭에서 열어 길게 눌러 저장하도록 폴백
// Firebase Storage 다운로드 URL(alt=media)은 CORS(*)를 허용하므로 blob fetch가 된다.
export async function saveMedia(url: string, kind: 'image' | 'video'): Promise<void> {
  const ext = kind === 'video' ? 'mp4' : 'jpg';
  const name = `kkommorning_${Date.now()}.${ext}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('fetch failed');
    const blob = await res.blob();
    const type = blob.type || (kind === 'video' ? 'video/mp4' : 'image/jpeg');
    const file = new File([blob], name, { type });

    // iOS 등 파일 공유를 지원하면 네이티브 저장 시트로 — "이미지/비디오 저장"이 여기서 뜬다.
    const nav = navigator as Navigator & { canShare?: (d?: { files?: File[] }) => boolean };
    if (nav.canShare?.({ files: [file] }) && typeof navigator.share === 'function') {
      try {
        await navigator.share({ files: [file] });
        return;
      } catch (err) {
        // 사용자가 시트를 닫음(취소) → 조용히 종료. 그 외 에러는 앵커 download로 폴백.
        if (err instanceof DOMException && err.name === 'AbortError') return;
      }
    }

    // 데스크톱 웹 — 앵커 download
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objUrl;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objUrl), 5000);
  } catch {
    // CORS·네트워크 실패 — 원본을 새 탭에서 열어 길게 눌러 저장
    window.open(url, '_blank', 'noopener');
  }
}
