import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, initializeFirestore, memoryLocalCache, disableNetwork, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getDatabase } from 'firebase/database';
import { installDemoRuntime, isDemo } from './demo';
import { seedDemo } from './demoSeed';

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

export const demoMode = isDemo();
if (demoMode) installDemoRuntime();

let app: FirebaseApp;
let firestore: Firestore;
if (demoMode) {
  // 기본 Firebase 앱/realDb를 만들지 않는다. 이름 붙인 별도 앱 + 메모리 캐시만 쓴다.
  app = getApps().find((a) => a.name === 'kk-demo') ?? initializeApp(firebaseConfig, 'kk-demo');
  try { firestore = initializeFirestore(app, { localCache: memoryLocalCache() }); }
  catch { firestore = getFirestore(app); } // Fast Refresh로 이미 만들어진 경우
} else {
  app = getApps().find((a) => a.name === '[DEFAULT]') ?? initializeApp(firebaseConfig);
  firestore = getFirestore(app);
}

export const db = firestore;
// demo에서도 ref 생성 타입을 맞추기 위해 같은 별도 앱 인스턴스를 쓰되, 업로드/RTDB 함수는 각 경계에서 차단한다.
export const storage = getStorage(app);
export const rtdb = getDatabase(app);

// ⚠️ 순서가 생명: 네트워크 끄기 → 예시 쓰기를 같은 틱에 줄 세운다(Firestore 작업 줄은 먼저 온 순서대로 돈다).
//    그래서 쓰기는 절대 서버로 안 나가고, 화면이 나중에 읽는 건 모두 예시 데이터가 들어간 뒤다.
export const demoReady: Promise<void> = demoMode
  ? Promise.all([disableNetwork(db), seedDemo(db)]).then(() => undefined)
  : Promise.resolve();

// 로컬 개발 전용 — 주소에 ?emu=1 을 붙이면 이 탭은 Firestore·Storage 에뮬레이터(127.0.0.1)에 붙는다(탭을 닫을 때까지 · 끄기 ?emu=0).
//   진짜 데이터에 쓰지 않고 저장을 끝까지 시험하려는 것(다이어리 저장 검수에 처음 씀). localhost 가 아니면 절대 안 켜진다.
//   켜는 법: firebase emulators:start --only firestore,storage (포트 8686 · 9196 으로 설정한 config)
export const usingEmulator: boolean = (() => {
  if (demoMode) return false;
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
