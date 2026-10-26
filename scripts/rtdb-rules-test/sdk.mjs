const NM = '/Users/mydang/Claude_Code/Kkom-Morning/node_modules/';
const { initializeApp } = await import(NM + 'firebase/app/dist/index.mjs');
const db_ = await import(NM + 'firebase/database/dist/index.mjs');
const { getDatabase, connectDatabaseEmulator, ref, set, push, update, remove, get, onDisconnect, serverTimestamp, goOffline } = db_;
const app = initializeApp({ projectId: 'demo-kkom', databaseURL: 'http://127.0.0.1:9123?ns=demo-kkom-default-rtdb' });
const db = getDatabase(app);
connectDatabaseEmulator(db, '127.0.0.1', 9123);
let pass = 0, fail = 0;
const t = async (want, label, fn) => {
  try { await fn(); if (want === 'allow') { pass++; console.log('OK   allow', label); } else { fail++; console.log('FAIL deny ', label, '(허용됨)'); } }
  catch (e) { if (want === 'deny') { pass++; console.log('OK   deny ', label); } else { fail++; console.log('FAIL allow', label, e.message); } }
};
const page = 'p_sdk_test';
const pts = [{ x: 0.1, y: 0.1, p: 0.5 }, { x: 0.2, y: 0.2, p: 0.5 }];
await t('allow', '웹 새 페이지(update canvas/book)', () => update(ref(db, 'canvas/book'), { [`pages/${page}`]: { t: Date.now() }, currentPage: page }));
await t('allow', '웹 획 push + serverTimestamp', () => set(push(ref(db, `canvas/${page}/strokes/udaeng`)), { color: '#334155', size: 7, points: pts, by: '우댕', t: serverTimestamp() }));
await t('allow', '웹 생중계 set', () => set(ref(db, `canvas/${page}/live/udaeng`), { id: 'a', color: '#334155', size: 7, points: pts }));
await t('allow', '웹 생중계 onDisconnect.remove', () => onDisconnect(ref(db, `canvas/${page}/live/udaeng`)).remove());
await t('allow', '입력 중 onDisconnect.set(false)', () => onDisconnect(ref(db, 'chatTyping/udaeng')).set(false));
await t('allow', '입력 중 set(true)', () => set(ref(db, 'chatTyping/udaeng'), true));
await t('allow', '지문 update(meta)', () => update(ref(db, `canvas/${page}/meta`), { passageUrl: 'https://example.com/p.jpg' }));
await t('allow', '하트 set(true)', () => set(ref(db, `canvas/${page}/react/likes/udaeng`), true));
await t('allow', '하트 set(null)', () => set(ref(db, `canvas/${page}/react/likes/udaeng`), null));
await t('allow', '댓글 push', () => set(push(ref(db, `canvas/${page}/react/comments`)), { by: '우댕', text: '좋아 🐝', t: Date.now() }));
await t('allow', '획 읽기 get', () => get(ref(db, `canvas/${page}/strokes`)));
await t('allow', '웹 전체 지우기 remove(strokes)', () => remove(ref(db, `canvas/${page}/strokes`)));
await t('allow', '페이지 삭제 multi-path', () => update(ref(db), { [`canvas/book/pages/${page}`]: null, 'canvas/book/currentPage': 'main', [`canvas/${page}`]: null }));
await t('deny', '루트 get', () => get(ref(db)));
await t('deny', '알림주소 통째 get', () => get(ref(db, 'pushTokens')));
goOffline(db);
console.log(`\nSDK 통과 ${pass} / 실패 ${fail}`);
process.exit(fail ? 1 : 0);
