// 피부 일지 연습 모드(?practice=1) — Aside 같은 검수자가 PIN·실제 기록 없이 화면을 끝까지 눌러 볼 수 있게.
//   서버(/api/skin/*)에 아무것도 묻지도 쓰지도 않는다. 기록은 이 탭 메모리에만, 새로고침하면 처음으로.
//   보이는 숫자·메모·사진은 전부 지어낸 예시다(꼼이 실제 기록 아님).
import type { SkinLog } from './skinTypes';
import { practiceAsViewer } from './practice';

const kst = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
const add = (d: string, n: number) => new Date(Date.parse(d + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);

function demoLogs(): Record<string, SkinLog> {
  const today = kst();
  const out: Record<string, SkinLog> = {};
  for (let i = -24; i <= -1; i++) {
    const date = add(today, i);
    if (i % 6 === 0) continue;                          // 가끔 빈 날
    const missed = i % 7 === -3;
    const prevMissed = (i - 1) % 7 === -3;
    const period = i >= -12 && i <= -8;
    const wheals = prevMissed ? 3 : period ? 2 : i % 3 === 0 ? 1 : 0;
    const itch = prevMissed ? 3 : period ? 2 : i % 2 === 0 ? 1 : 0;
    const at = new Date(Date.parse(date + 'T12:30:00Z')).toISOString();
    out[date] = {
      date, wheals, itch, uas: wheals + itch,
      meds: [{ name: '항히스타민(예시)', dose: null, time: missed ? null : '22:00', status: missed ? 'missed' : 'taken' }],
      episodes: wheals >= 2 ? [{ start: '19:40', durMin: 90, areas: ['손·손바닥', '팔'], over24h: false, bruiseLike: false }] : [],
      angioedema: null, trace: wheals >= 2 ? '흔적 없음' : null,
      triggers: prevMissed ? ['약 거름', '더위·열감'] : i % 4 === 0 ? ['땀'] : [],
      foods: i % 5 === 0 ? [{ t: '12:30', text: '예시 점심 — 비빔국수' }] : [],
      sleepH: prevMissed ? 4.5 : 7, wakeItch: prevMissed ? true : false, waterMl: 1250, stress: prevMissed ? 6 : 3,
      cycleDay: period ? i + 13 : null, period: period ? true : null, newProducts: [], photos: [],
      note: i === -2 ? '예시 메모 — 연습 모드에서만 보이는 지어낸 기록이에요.' : '',
      env: null, source: 'app', createdAt: at, updatedAt: at,
    };
  }
  return out;
}

const store = { logs: demoLogs(), photos: {} as Record<string, { id: string; url: string; t: string | null }[]>, partnerAlert: false,
  intake: { '1.1': '30대', '2.4': '6' } as Record<string, string | string[]>, role: 'kkomi' as 'kkomi' | 'viewer' };

export const demo = {
  // ?practice=1&view=1 이면 보기 전용(우댕 폰)으로 흉내
  session() {
    store.role = practiceAsViewer() ? 'viewer' : 'kkomi';
    return { configured: true, authed: true, role: store.role };
  },
  logs(from: string, to: string): SkinLog[] {
    return Object.values(store.logs).filter((l) => l.date >= from && l.date <= to).sort((a, b) => a.date.localeCompare(b.date));
  },
  save(log: Partial<SkinLog> & { date: string }): SkinLog {
    const now = new Date().toISOString();
    const prev = store.logs[log.date];
    const next = { ...(prev ?? {}), ...log, updatedAt: now, createdAt: prev?.createdAt ?? now } as SkinLog;
    next.uas = next.wheals != null && next.itch != null ? next.wheals + next.itch : null;
    store.logs[log.date] = next;
    return next;
  },
  photos(date: string) { return store.photos[date] ?? []; },
  addPhoto(date: string, file: Blob) {
    const p = { id: 'demo-' + Date.now(), url: URL.createObjectURL(file), t: new Date().toISOString() };
    store.photos[date] = [...(store.photos[date] ?? []), p];
    return p;
  },
  deletePhoto(date: string, id: string) { store.photos[date] = (store.photos[date] ?? []).filter((p) => p.id !== id); },
  settings() { return { partnerAlert: store.partnerAlert }; },
  setSettings(v: boolean) { store.partnerAlert = v; },
  intake() { return { ...store.intake }; },
  setIntake(id: string, value: string | string[] | null) { if (value === null) delete store.intake[id]; else store.intake[id] = value; },
  chatReply: '연습 모드라 실제 Claude에게는 보내지 않았어요.\n\n실제로는 여기서 Anthropic이 만든 AI Claude가 꼼이 기록 30일치(점수·약·생리·의심 요인·메모)를 보고, 날짜를 짚어 가며 답해요. 진단이나 약 변경은 하지 않고, 입술·혀가 붓거나 숨이 차면 119부터 안내해요.',
};
