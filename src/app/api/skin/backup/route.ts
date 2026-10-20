// 피부 일지 매일 백업(Vercel Cron, KST 23:55) — 우댕 2026-10-21: "기록한 게 절대 날아가지 않도록 백업을 최우선으로".
//  1) skin/kkomi 전체를 JSON 한 파일로 Storage skin/_backup/kkomi/{날짜}.json 에 남긴다(날마다 하나, 지우지 않음. 규칙상 앱 밖에선 못 읽음).
//  2) 우댕 메일로 같은 파일을 붙여 보낸다 + 꼼이 Claude 상담 사용량(오늘·이번 달, 대략 비용).
//     지난 메일 뒤로 바뀐 기록이나 상담이 있는 날만 — 일요일엔 바뀐 게 없어도 보낸다(백업이 살아 있다는 신호).
//  ?force=1 이면 바뀐 게 없어도 메일까지. 호출은 CRON_SECRET 필요.
import { NextRequest, NextResponse } from 'next/server';
import { adminBucket, adminDb, adminProjectId } from '@/lib/firebaseAdmin';
import { mailConfigured, sendMail } from '@/lib/mail';
import { dayLine, md, snapshotSkin, sumUsage, usageCost, weekdayKo, type ChatUsageDay } from '@/lib/skinBackup';
import { SKIN_BACKUP_DIR, SKIN_BACKUP_META, type SkinLog } from '@/lib/skinTypes';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CRON_SECRET = process.env.CRON_SECRET || '';
const USD_KRW = Number(process.env.USD_KRW) || 1400;
const kstToday = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);

function authorized(req: NextRequest): boolean {
  if (!CRON_SECRET) return false;
  return req.headers.get('authorization') === `Bearer ${CRON_SECRET}` || req.nextUrl.searchParams.get('key') === CRON_SECRET;
}

const won = (usd: number) => `₩${Math.round(usd * USD_KRW).toLocaleString('ko-KR')}`;
const dollar = (usd: number) => `$${usd.toFixed(usd < 1 ? 3 : 2)}`;
const num = (n: number) => n.toLocaleString('ko-KR');
const kb = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))}KB` : `${(bytes / 1024 / 1024).toFixed(1)}MB`);

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const db = adminDb(), bucket = adminBucket();
  if (!db || !bucket) return NextResponse.json({ error: 'admin_not_configured' }, { status: 503 });

  const today = kstToday();
  const project = adminProjectId();
  const force = req.nextUrl.searchParams.get('force') === '1';
  const metaRef = db.doc(SKIN_BACKUP_META);
  const meta = (await metaRef.get()).data() ?? {};

  // 1) 파일로 남기기
  const snap = await snapshotSkin(db);
  const json = JSON.stringify(snap, null, 1);
  const file = `${SKIN_BACKUP_DIR}/${today}.json`;
  // 파일 저장이 막혀도(권한 등) 메일 백업은 그대로 간다 — 실패는 메일·meta에 남김
  const saveError = await bucket.file(file).save(json, { contentType: 'application/json; charset=utf-8', resumable: false })
    .then(() => null).catch((e: Error) => { console.error('skin backup save', e); return String(e?.message ?? e).slice(0, 200); });

  // 2) 메일 내용
  const logs = (Object.values(snap.collections.logs ?? {}) as SkinLog[]).sort((a, b) => a.date.localeCompare(b.date));
  const since = (meta.mailedAt as string | undefined) ?? '';
  const changed = logs.filter((l) => (l.updatedAt ?? '') > since);
  const photoCount = logs.reduce((n, l) => n + (l.photos?.length ?? 0), 0);
  const trashCount = ((snap.collections.meta?.photoTrash as { items?: unknown[] } | undefined)?.items ?? []).length;

  const usage = (snap.collections.chatUsage ?? {}) as Record<string, ChatUsageDay>;
  const todayUse = usage[today];
  const month = today.slice(0, 7);
  const monthSum = sumUsage(Object.entries(usage).filter(([d]) => d.startsWith(month)).map(([, u]) => u));
  const allSum = sumUsage(Object.values(usage));
  const chatTotal = ((snap.collections.chat?.main as { messages?: unknown[] } | undefined)?.messages ?? []).length;

  const sunday = new Date(today + 'T00:00:00Z').getUTCDay() === 0;
  const shouldMail = force || changed.length > 0 || (todayUse?.count ?? 0) > 0 || sunday;

  let mailed = false;
  if (shouldMail && mailConfigured()) {
    const title = `${Number(today.slice(5, 7))}월 ${Number(today.slice(8, 10))}일(${weekdayKo(today)})`;
    const subjectBits = [
      changed.length ? `바뀐 기록 ${changed.length}일` : '바뀐 기록 없음',
      todayUse?.count ? `Claude 상담 ${todayUse.count}번 ${won(usageCost(todayUse))}` : '',
    ].filter(Boolean);
    const lines: (string | false)[] = [
      `꼼이 피부 일지 백업 · ${title}`,
      '',
      '■ 기록',
      changed.length ? `지난 메일 뒤로 바뀐 날 ${changed.length}일` : '지난 메일 뒤로 바뀐 기록은 없어요.',
      ...changed.slice(-14).map((l) => `  ${dayLine(l)}`),
      changed.length > 14 && `  …앞의 ${changed.length - 14}일은 붙임 파일에 있어요`,
      '',
      `모든 기록 ${logs.length}일${logs.length ? ` (${md(logs[0].date)} ~ ${md(logs[logs.length - 1].date)})` : ''} · 사진 ${photoCount}장${trashCount ? ` · 지운 사진 ${trashCount}장은 휴지통에 보관 중` : ''}`,
      `붙임 파일: skin-${today}.json (${kb(json.length)}) — 기록·병력·설문·상담 대화 전부. ${saveError ? '⚠️ 서버 저장소에 파일 남기기는 실패했어요(이 메일 붙임이 오늘 백업).' : '같은 파일이 서버 저장소에도 날짜별로 남아요.'}`,
      '',
      '■ 꼼이 Claude 상담',
      todayUse?.count
        ? `오늘 ${todayUse.count}번 · 약 ${dollar(usageCost(todayUse))} (${won(usageCost(todayUse))})`
        : '오늘은 상담이 없었어요.',
      `이번 달 ${monthSum.count}번 · 약 ${dollar(monthSum.cost)} (${won(monthSum.cost)}) · 하루 상한 60번`,
      `지금까지 ${allSum.count}번 · 약 ${dollar(allSum.cost)} (${won(allSum.cost)}) · 남아 있는 대화 ${chatTotal}말`,
      monthSum.count > 0 &&
        `이번 달 토큰: 입력 ${num(monthSum.inTok)} · 출력 ${num(monthSum.outTok)} · 캐시 읽기 ${num(monthSum.cacheRead)} · 캐시 쓰기 ${num(monthSum.cacheWrite)}`,
      `※ 비용은 토큰 수로 어림한 값(1달러 ${num(USD_KRW)}원)이에요. 정확한 청구는 console.anthropic.com 기준.`,
      '',
      project === process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
        ? `저장 위치: Firebase ${project}`
        : `⚠️ 저장 위치가 ${project}예요(꼼모닝은 ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}). 서버 키를 확인해 주세요.`,
    ].filter((s): s is string => s !== false);
    mailed = await sendMail({
      subject: `[꼼모닝] 피부 일지 백업 ${md(today)} · ${subjectBits.join(' · ')}`,
      text: lines.join('\n'),
      attachments: [{ filename: `skin-${today}.json`, content: json, contentType: 'application/json' }],
    });
  }

  const now = new Date().toISOString();
  await metaRef.set({
    lastAt: now, lastFile: saveError ? null : file, saveError, bytes: json.length, logs: logs.length, photos: photoCount,
    mailConfigured: mailConfigured(), lastMailTried: shouldMail, lastMailOk: shouldMail ? mailed : null,
    ...(mailed ? { mailedAt: snap.exportedAt } : {}),
  }, { merge: true });

  return NextResponse.json({ ok: !saveError || mailed, project, file, saveError, bytes: json.length, logs: logs.length, changed: changed.length, mailed, mailConfigured: mailConfigured() });
}
