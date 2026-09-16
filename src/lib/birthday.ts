// 생일 이벤트 — 9/20 꼼이 · 3/19 우댕. KST 기준으로 '오늘이 생일인 사람'을 판정하고,
//   미리 써두는 생일 편지(birthdayLetter/{year}_{받는이})를 저장·구독한다.
import { db } from './firebase';
import { doc, setDoc, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
import { serverNow } from './presence';

export const BIRTHDAYS: Record<string, { month: number; day: number }> = {
  '우댕': { month: 3, day: 19 },
  '꼼이': { month: 9, day: 20 },
};

function kstNow(): Date { return new Date(serverNow() + 9 * 3600_000); }
function kstYMD(d = kstNow()) { return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() }; }

// 미리보기/테스트용 — URL ?bday=꼼이 로 강제로 생일 모드. 없으면 실제 날짜로 판정.
function testOverride(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = new URLSearchParams(window.location.search).get('bday');
    return v && BIRTHDAYS[v] ? v : null;
  } catch { return null; }
}

// 오늘(KST) 생일인 사람 이름, 없으면 null.
export function birthdayPersonToday(): string | null {
  const o = testOverride(); if (o) return o;
  const { m, d } = kstYMD();
  for (const [name, b] of Object.entries(BIRTHDAYS)) if (b.month === m && b.day === d) return name;
  return null;
}

export function birthdayYear(): number { return kstYMD().y; }

// 함께 맞는 N번째 생일. 사귄 날 2023-09-28 → 첫 함께 생일은 2024(둘 다). 2026이면 3.
export function nthTogether(year = birthdayYear()): number { return Math.max(1, year - 2023); }

// name의 다음 생일까지 남은 일수(오늘이면 0). 우댕이 상대 생일 카운트다운 보는 용.
export function daysUntilBirthday(name: string): number {
  const b = BIRTHDAYS[name]; if (!b) return 9999;
  const now = kstNow();
  const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  let target = Date.UTC(now.getUTCFullYear(), b.month - 1, b.day);
  if (target < todayUTC) target = Date.UTC(now.getUTCFullYear() + 1, b.month - 1, b.day);
  return Math.round((target - todayUTC) / 86400000);
}

export interface BirthdayLetter { from: string; to: string; text: string; createdAt: Date | null; }

export function subscribeBirthdayLetter(to: string, year: number, cb: (l: BirthdayLetter | null) => void): () => void {
  if (!to) { cb(null); return () => {}; }
  return onSnapshot(
    doc(db, 'birthdayLetter', `${year}_${to}`),
    (snap) => {
      const x = snap.data() as { from?: string; to?: string; text?: string; createdAt?: Timestamp } | undefined;
      if (!x?.text) { cb(null); return; }
      cb({ from: x.from ?? '', to: x.to ?? to, text: x.text, createdAt: x.createdAt?.toDate?.() ?? null });
    },
    () => cb(null),
  );
}

export async function saveBirthdayLetter(from: string, to: string, year: number, text: string): Promise<void> {
  if (!from || !to || !text.trim()) return;
  try {
    await setDoc(
      doc(db, 'birthdayLetter', `${year}_${to}`),
      { from, to, text: text.trim(), createdAt: serverTimestamp() },
      { merge: true },
    );
  } catch (e) { console.warn('생일 편지 저장 실패:', e); }
}
