// 서버 전용 Firebase Admin — 규칙을 우회해 읽고 쓴다. 클라이언트 번들에 절대 import 하지 말 것.
// 지금 꼼모닝은 Firebase Auth가 없어 클라 SDK 데이터는 규칙상 누구나 읽을 수 있다(전부 `if true`).
// 그래서 꼼이 피부 기록처럼 민감한 데이터는 skin/** 에만 두고 규칙에서 클라 접근을 막은 뒤,
// /api/skin/* 서버 라우트가 이 Admin으로만 다룬다.
//
// env (Vercel, 서버 전용 — NEXT_PUBLIC_ 붙이지 말 것):
//   FIREBASE_SERVICE_ACCOUNT_B64 = 서비스 계정 키 JSON을 base64로 인코딩한 한 줄
import { getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const APP_NAME = 'kkom-admin';
let cached: App | null = null;

export function adminApp(): App | null {
  if (cached) return cached;
  const existing = getApps().find((a) => a.name === APP_NAME);
  if (existing) return (cached = existing);
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (!raw) return null;
  const sa = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
  cached = initializeApp(
    {
      credential: cert(sa),
      projectId: sa.project_id,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    },
    APP_NAME,
  );
  return cached;
}

export function adminDb(): Firestore | null {
  const app = adminApp();
  return app ? getFirestore(app) : null;
}

export function adminBucket() {
  const app = adminApp();
  return app ? getStorage(app).bucket() : null;
}
