import { readFileSync } from 'node:fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const env = {};
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const app = initializeApp({
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});
const fs = getFirestore(app);
const now = Date.now();
console.log('node now:', new Date(now).toISOString());
for (const name of ['우댕', '꼼이']) {
  const snap = await getDoc(doc(fs, 'presence', name));
  if (!snap.exists()) { console.log(name, '→ 없음'); continue; }
  const d = snap.data();
  const t = d.lastSeenAt?.toDate?.();
  const diffSec = t ? Math.round((now - t.getTime()) / 1000) : null;
  console.log(`${name}: active=${d.active}  lastSeenAt=${t ? t.toISOString() : 'null'}  diff=${diffSec}s`);
}
process.exit(0);
