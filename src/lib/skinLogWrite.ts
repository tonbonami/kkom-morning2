// 피부 일지 하루 기록 쓰기(서버 전용) — /api/skin/log PUT 과 상담 정리 「일지에 반영」이 같은 길로 저장한다.
// 합쳐 저장 · uas 다시 계산 · 오늘이면 날씨 한 번 · 생리 주기 · 힘든 날 알림 · 덮어쓰기 전 판은 versions 에.
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { sendApns } from '@/lib/apns';
import {
  emptyLog, sanitizeLogPatch, skinLogPath, uasOf, SKIN_CYCLE_PATH, SKIN_SETTINGS_PATH, daysBetween,
  type SkinEnv, type SkinLog,
} from '@/lib/skinTypes';

export const kstToday = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
const finite = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

// 기존 /api/weather(기상청, 기온·습도)·/api/air(에어코리아, PM)를 그대로 불러 쓴다.
async function envSnapshot(origin: string): Promise<SkinEnv | null> {
  const [w, a] = await Promise.all([
    fetch(`${origin}/api/weather`, { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
    fetch(`${origin}/api/air`, { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
  ]);
  const env: SkinEnv = {
    temp: finite(w?.current?.temp), humidity: finite(w?.current?.humidity),
    pm10: finite(a?.pm10), pm25: finite(a?.pm25), station: a?.location ?? null,
    at: new Date().toISOString(),
  };
  return env.temp == null && env.humidity == null && env.pm10 == null && env.pm25 == null ? null : env;
}

// patch: 바꿀 필드(객체) 또는 이전 기록을 보고 만드는 함수. 어느 쪽이든 sanitizeLogPatch 를 거친다.
export async function writeSkinLog(
  db: Firestore, date: string, patch: Record<string, unknown> | ((prev: SkinLog) => Record<string, unknown>), origin: string,
): Promise<SkinLog> {
  const ref = db.doc(skinLogPath(date));
  const now = new Date().toISOString();
  const prev = (await ref.get()).data() as SkinLog | undefined;
  const base = prev ?? emptyLog(date, now);
  const raw = typeof patch === 'function' ? patch(base) : patch;
  const log: SkinLog = { ...base, ...sanitizeLogPatch(raw), date, updatedAt: now };
  log.uas = uasOf(log.wheals, log.itch);
  if (date === kstToday() && !log.env) log.env = await envSnapshot(origin);

  // 생리 주기 자동(우댕 고름 2026-10-21): 「생리 중」으로 저장하면 n일째를 채우고, 새로 시작한 날이면 시작일로 남긴다.
  //   마지막 시작일에서 10일 안이면 같은 생리, 아니면 새 시작. 꼼이가 n일째를 직접 적으면 그 숫자로 시작일을 거꾸로 맞춘다.
  if (log.period === true) {
    const cycleRef = db.doc(SKIN_CYCLE_PATH);
    const starts = (((await cycleRef.get()).data()?.starts as string[]) ?? []).filter((s) => s <= date).sort();
    const last = starts[starts.length - 1];
    if (log.cycleDay == null && last && daysBetween(last, date) <= 10) {
      log.cycleDay = daysBetween(last, date) + 1;
    } else if (!last || daysBetween(last, date) > 10 || log.cycleDay != null) {
      const day = log.cycleDay ?? 1;
      const start = new Date(Date.parse(date + 'T00:00:00Z') - (day - 1) * 86400000).toISOString().slice(0, 10);
      log.cycleDay = day;
      await cycleRef.set({ starts: FieldValue.arrayUnion(start) }, { merge: true });
    }
  }

  // 힘든 날 우댕 알림(꼼이가 켰을 때만, 오늘 기록이 UAS 4 이상이 된 첫 저장에 한 번). 붓기·숨참 같은 응급은 화면의 119 안내가 먼저.
  if (date === kstToday() && (log.uas ?? 0) >= 4 && !log.alertedAt) {
    const settings = (await db.doc(SKIN_SETTINGS_PATH).get()).data();
    if (settings?.partnerAlert === true) {
      const ok = await sendApns('udaeng', '꿀닥터', '오늘 꼼이 피부가 힘든 날이에요. 한 번 꼭 안아 주세요.', { threadId: 'skin' }).catch(() => false);
      if (ok) log.alertedAt = now;
    }
  }
  // 사진 목록은 /api/skin/photo 만 바꾼다(겹쳐 저장돼도 사진이 지워지지 않게 photos는 빼고 merge)
  // 덮어쓰기 전 판은 logs/{날짜}/versions/{시각} 에 그대로 남긴다(실수로 지우고 저장해도 되돌릴 수 있게). 새 판과 한 번에 쓴다.
  const { photos, ...rest } = log;
  const batch = db.batch();
  if (prev) batch.set(ref.collection('versions').doc(now), { ...prev, replacedAt: now });
  batch.set(ref, rest, { merge: true });
  await batch.commit();
  return { ...rest, photos: photos ?? [] } as SkinLog;
}
