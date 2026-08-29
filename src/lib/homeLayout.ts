// 홈 카드 배치 — 사이담 spaces/{sid} 3필드 스키마를 꼼모닝 단일 공유문서(settings/home)로.
// 2인 앱이라 둘이 같은 배치를 본다. moduleOrder/moduleSizes/enabledModules.
import { db } from './firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

export type CardSize = '1x1' | '2x1' | '2x2';
export interface HomeLayout {
  moduleOrder?: string[];
  moduleSizes?: Record<string, CardSize>;
  enabledModules?: string[];
}

const REF = () => doc(db, 'settings', 'home');

// 실시간 구독. 문서 없으면 빈 객체(= 기본 배치 사용).
export function subscribeHomeLayout(cb: (layout: HomeLayout) => void): () => void {
  return onSnapshot(
    REF(),
    (snap) => cb((snap.data() as HomeLayout) ?? {}),
    () => cb({}),
  );
}

// 저장 — merge로 세 필드. (사이담은 updateDoc 3개 Promise.all이지만 문서 하나라 setDoc merge 한 번으로 충분)
export async function saveHomeLayout(patch: HomeLayout): Promise<void> {
  await setDoc(REF(), patch, { merge: true });
}
