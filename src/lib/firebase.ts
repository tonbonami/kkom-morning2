import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getDatabase } from 'firebase/database';

// databaseURL은 공개 값이라 fallback 리터럴을 둬도 안전 (클라 번들에 어차피 노출).
const DATABASE_URL =
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
  'https://kkom-morning-default-rtdb.asia-southeast1.firebasedatabase.app';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: DATABASE_URL,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const rtdb = getDatabase(app); // 낙서장 실시간 생중계용 (Realtime Database)

// 로컬 개발 전용 — 주소에 ?emu=1 을 붙이면 이 탭은 Firestore·Storage 에뮬레이터(127.0.0.1)에 붙는다(탭을 닫을 때까지 · 끄기 ?emu=0).
//   진짜 데이터에 쓰지 않고 저장을 끝까지 시험하려는 것(다이어리 저장 검수에 처음 씀). localhost 가 아니면 절대 안 켜진다.
//   켜는 법: firebase emulators:start --only firestore,storage (포트 8686 · 9196 으로 설정한 config)
export const usingEmulator: boolean = (() => {
  if (typeof window === 'undefined' || window.location.hostname !== 'localhost') return false;
  try {
    const q = new URLSearchParams(window.location.search).get('emu');
    if (q === '1') sessionStorage.setItem('kk-emu', '1');
    if (q === '0') sessionStorage.removeItem('kk-emu');
    return sessionStorage.getItem('kk-emu') === '1';
  } catch { return false; }
})();
if (usingEmulator) {
  try { connectFirestoreEmulator(db, '127.0.0.1', 8686); connectStorageEmulator(storage, '127.0.0.1', 9196); } catch { /* 이미 붙음(개발 중 다시 불러옴) */ }
}
