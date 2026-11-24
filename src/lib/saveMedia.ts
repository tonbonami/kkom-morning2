// 원본 사진·동영상 저장 — 플랫폼별로 가장 자연스러운 경로를 고른다.
//   · 꼼모닝 앱(빌드 70~, 네이티브 MediaSave 플러그인): 묻지 않고 바로 사진첩에 저장(카톡처럼). 여러 장도 한 번에.
//     우댕 2026-11-25 「사진 저장하면 바로 저장안되고 사파리창으로 넘어가서 저장돼. 한번에 저장하기도 안돼. 카톡처럼 해줘」
//   · 옛 앱 빌드·iOS Safari: 네이티브 공유 시트 → "이미지 저장"(여러 장이면 시트 한 번에)
//   · 데스크톱 웹: 앵커 download 로 원본 파일 저장
//   · CORS·네트워크 실패: 원본을 새 탭에서 열어 길게 눌러 저장하도록 폴백
// Firebase Storage 다운로드 URL(alt=media)은 CORS(*)를 허용하므로 blob fetch가 된다.

export type MediaKind = 'image' | 'video';
export interface MediaItem { url: string; kind: MediaKind }
/** 저장 결과 — 화면이 알림 문구를 고른다. native 면 사진첩에 실제로 들어간 수가 saved. */
export interface SaveResult {
  via: 'native' | 'share' | 'download' | 'tab' | 'cancel';
  saved: number;
  failed: number;
  /** 사진첩 접근을 허용하지 않음(설정에서 켜야 함) */
  denied?: boolean;
}

type MediaSavePlugin = { save(o: { items: MediaItem[] }): Promise<{ saved?: number; failed?: number; denied?: boolean }> };

// ⚠️ 플러그인 객체(registerPlugin 프록시)를 async 함수에서 **그대로 return 하지 말 것**.
//    프록시는 아무 이름이나 메서드로 만들어 주는데 'then' 도 예외가 아니라서, Promise 가 이걸 약속(thenable)으로 보고 proxy.then(resolve, reject) 를 부른다.
//    그 안에서 「MediaSave.then() is not implemented」 오류가 나지만 resolve/reject 는 끝내 불리지 않아 영원히 기다린다
//    — 빌드 70 첫날 「풍차만 계속 돈다」(11/25)의 원인(GPT 검수 확신 99%, 시뮬에서 웹→앱 직접 호출은 2/2 저장으로 정상).
//    그래서 플러그인을 꺼내는 곳과 부르는 곳을 한 함수 안에 둔다(꺼낸 객체는 밖으로 안 나감).
/** 네이티브로 저장. 플러그인이 없는 빌드(≤69)·웹이면 null. 어떤 경우에도 끝나게 시간 제한을 둔다. */
async function saveNative(items: MediaItem[]): Promise<SaveResult | null> {
  let plugin: MediaSavePlugin;
  try {
    const { Capacitor, registerPlugin } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable('MediaSave')) return null;
    plugin = registerPlugin<MediaSavePlugin>('MediaSave');
  } catch { return null; }
  // 한 장에 20초 + 권한 창 기다림 60초 — 넘으면 실패로 끝낸다(풍차가 영원히 돌지 않게).
  const limitMs = 60_000 + items.length * 20_000;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const r = await Promise.race([
      plugin.save({ items }),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('MediaSave timeout')), limitMs); }),
    ]);
    return { via: 'native', saved: r.saved ?? 0, failed: r.failed ?? 0, denied: !!r.denied };
  } catch (err) {
    console.error('[MediaSave] failed', err);
    return { via: 'native', saved: 0, failed: items.length };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** 여러 장(묶음 사진 「전체 저장」)·한 장 모두 이걸로. */
export async function saveMediaMany(items: MediaItem[]): Promise<SaveResult> {
  const list = items.filter((x) => !!x.url);
  if (!list.length) return { via: 'cancel', saved: 0, failed: 0 };

  // ① 앱 — 네이티브가 직접 받아 사진첩에 넣는다(사파리·공유 시트 없이).
  const native = await saveNative(list);
  if (native) return native;

  // ② 웹·옛 앱 — 받아서 공유 시트(여러 장이면 한 번에) 또는 다운로드
  let files: File[];
  try {
    files = await Promise.all(list.map(async (it, i) => {
      const res = await fetch(it.url);
      if (!res.ok) throw new Error('fetch failed');
      const blob = await res.blob();
      const ext = it.kind === 'video' ? 'mp4' : 'jpg';
      const type = blob.type || (it.kind === 'video' ? 'video/mp4' : 'image/jpeg');
      return new File([blob], `kkommorning_${Date.now()}_${i + 1}.${ext}`, { type });
    }));
  } catch {
    // CORS·네트워크 실패 — 원본을 새 탭에서 열어 길게 눌러 저장(첫 장만 — 여러 탭을 한꺼번에 열지 않는다)
    window.open(list[0].url, '_blank', 'noopener');
    return { via: 'tab', saved: 0, failed: list.length };
  }

  const nav = navigator as Navigator & { canShare?: (d?: { files?: File[] }) => boolean };
  if (nav.canShare?.({ files }) && typeof navigator.share === 'function') {
    try {
      await navigator.share({ files });
      return { via: 'share', saved: files.length, failed: 0 };
    } catch (err) {
      // 사용자가 시트를 닫음(취소) → 조용히 종료. 그 외 에러는 앵커 download로 폴백.
      if (err instanceof DOMException && err.name === 'AbortError') return { via: 'cancel', saved: 0, failed: 0 };
    }
  }

  // 데스크톱 웹 — 앵커 download(여러 장이면 차례로)
  for (const file of files) {
    const objUrl = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = objUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objUrl), 5000);
  }
  return { via: 'download', saved: files.length, failed: 0 };
}

export async function saveMedia(url: string, kind: MediaKind): Promise<SaveResult> {
  return saveMediaMany([{ url, kind }]);
}

/** 저장 결과를 짧은 알림 문구로. 아무 말 없이 끝낼 때(공유 시트·취소·새 탭)는 null. */
export function saveToastText(r: SaveResult, kind: MediaKind = 'image'): string | null {
  if (r.via !== 'native') return r.via === 'download' && r.saved > 1 ? `${r.saved}개 파일을 받았어요` : null;
  if (r.denied) return '사진 저장을 허용해 주세요 — 설정 › 꼼모닝 › 사진';
  if (r.saved === 0) return '저장하지 못했어요. 잠시 뒤에 다시 해 주세요';
  if (r.failed > 0) return `${r.saved}장 저장했어요 · ${r.failed}장은 못 했어요`;
  if (r.saved > 1) return `사진 ${r.saved}장을 사진첩에 저장했어요`;
  return kind === 'video' ? '동영상을 사진첩에 저장했어요' : '사진을 사진첩에 저장했어요';
}
