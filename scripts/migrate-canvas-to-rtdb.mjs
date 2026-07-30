// 일회성: 낙서장 데이터 Firestore → RTDB 이전 (웹·네이티브 통일).
// 실행: node scripts/migrate-canvas-to-rtdb.mjs
// .env.local의 NEXT_PUBLIC_FIREBASE_* 사용. RTDB 규칙 오픈이라 클라 SDK로 충분.
// 재실행 안전: 각 페이지 strokes 노드를 지우고 다시 씀(중복 없음).

import { readFileSync } from 'node:fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { getDatabase, ref, update, remove, set } from 'firebase/database';

// .env.local 수동 파싱
const env = {};
try {
  for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch (e) { console.error('.env.local 못 읽음:', e.message); process.exit(1); }

const cfg = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
    || 'https://kkom-morning-default-rtdb.asia-southeast1.firebasedatabase.app',
};
console.log('project:', cfg.projectId, '| db:', cfg.databaseURL ? 'set' : 'MISSING');

const app = initializeApp(cfg);
const fs = getFirestore(app);
const rtdb = getDatabase(app);

const userKey = (by) => (by === '우댕' ? 'udaeng' : 'kkomi');

async function main() {
  // 1) 책/페이지 목록
  const bookSnap = await getDoc(doc(fs, 'canvasBooks', 'main'));
  const currentPage = bookSnap.exists() ? (bookSnap.data().currentPage || 'main') : 'main';
  const pagesSnap = await getDocs(collection(fs, 'canvasBooks', 'main', 'pages'));
  const pages = pagesSnap.docs.map((d) => ({ id: d.id, t: d.data().t ?? 0 }));
  if (!pages.find((p) => p.id === 'main')) pages.push({ id: 'main', t: 0 }); // 안전
  pages.sort((a, b) => a.t - b.t);
  console.log(`페이지 ${pages.length}개:`, pages.map((p) => p.id).join(', '), '| currentPage:', currentPage);

  // 2) book 기록
  const bookUpdate = { currentPage };
  for (const p of pages) bookUpdate[`pages/${p.id}`] = { t: p.t };
  await update(ref(rtdb, 'canvas/book'), bookUpdate);

  // 3) 페이지별 획 + 지문 이전
  let totalStrokes = 0;
  for (const p of pages) {
    // 재실행 안전: 대상 strokes 초기화 (구 네이티브 획 포함 정리)
    await remove(ref(rtdb, `canvas/${p.id}/strokes`));

    const strokesSnap = await getDocs(collection(fs, 'canvasBoards', p.id, 'strokes'));
    let n = 0;
    for (const sd of strokesSnap.docs) {
      const s = sd.data();
      if (!Array.isArray(s.points) || s.points.length < 2) continue;
      const uk = userKey(s.by);
      await set(ref(rtdb, `canvas/${p.id}/strokes/${uk}/${sd.id}`), {
        color: s.color || '#334155',
        size: s.size || 6,
        points: s.points,
        by: s.by || (uk === 'udaeng' ? '우댕' : '꼼이'),
        t: s.t ?? 0,
      });
      n++;
    }

    // 지문(passageUrl)
    const metaSnap = await getDoc(doc(fs, 'canvasBoards', p.id));
    const passageUrl = metaSnap.exists() ? metaSnap.data().passageUrl : undefined;
    if (passageUrl) await set(ref(rtdb, `canvas/${p.id}/meta/passageUrl`), passageUrl);

    console.log(`  ${p.id}: 획 ${n}개${passageUrl ? ' + 지문' : ''}`);
    totalStrokes += n;
  }

  console.log(`\n✅ 이전 완료: 페이지 ${pages.length}, 획 ${totalStrokes}개 → RTDB`);
  process.exit(0);
}

main().catch((e) => { console.error('❌ 이전 실패:', e); process.exit(1); });
