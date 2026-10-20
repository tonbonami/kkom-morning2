// 꼼이 피부 일지 — Claude 상담. PIN 쿠키 필요(읽기 requireReader · 쓰기는 꼼이만 requireWriter).
//   GET  → { messages }  (skin/kkomi/chat/main, 최근 200개)
//   POST { text } → 글자를 흘려보내는 text/plain 스트림. 끝나면 대화에 저장.
// 모델: Claude Opus 5.5(우댕 결정 2026-10-21) — env SKIN_CHAT_MODEL로 바꿀 수 있음.
// 하루 60번 상한(skin/kkomi/chatUsage/{날짜}), 토큰 사용량도 같이 적어 둔다.
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { FieldValue, type DocumentReference, type Firestore } from 'firebase-admin/firestore';
import { requireReader, requireWriter } from '@/lib/skinAuth';
import { adminDb } from '@/lib/firebaseAdmin';
import { SKIN_OWNER, type SkinLog } from '@/lib/skinTypes';
import { skinStats, medOf } from '@/lib/skinStats';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const MODEL = process.env.SKIN_CHAT_MODEL || 'claude-opus-5-5';
const DAILY_LIMIT = 60;
const HISTORY_TURNS = 30;   // 모델에 다시 보내는 최근 말 개수
const KEEP = 200;           // 저장해 두는 최근 말 개수
const THREAD = `skin/${SKIN_OWNER}/chat/main`;

type ChatMsg = { id: string; role: 'user' | 'assistant'; text: string; at: string };

const kstToday = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
const addDays = (d: string, n: number) => new Date(Date.parse(d + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);
const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const RULES = `너는 Anthropic이 만든 AI인 Claude다. 꼼모닝(커플 앱)의 「꼼이 피부 일지」 안에서 꼼이와 대화한다. 꼼이는 2026년 5월부터 원인을 모르는 두드러기·가려움을 겪고 있고, 매일 일지를 쓴다. 꼼이는 다른 AI보다 Claude를 믿고 쓰고 있다.

정체
- 너는 의사가 아니라 Anthropic이 만든 AI Claude다. 대화의 첫 답에서 한 줄로 「Anthropic이 만든 AI Claude예요」라고 밝힌다. 누가 물어도 언제나 솔직하게 밝히고, 사람이나 다른 AI인 척하지 않는다.

하는 일
- 아래 「꼼이 기록」을 근거로 날짜를 짚어 가며 패턴을 같이 살핀다(예: 약을 거른 다음날, 특정 음식·더위·운동 뒤).
- 생활에서 해 볼 수 있는 것, 다음에 더 적어 두면 좋을 것, 병원에 가져갈 질문을 정리해 준다.
- 기록이 적거나 비어 있으면 그렇다고 말한다. 기록에 있는 사실과 너의 추측을 구분해서 말한다. 숫자는 기록에 있는 것만 쓴다.

하지 않는 일
- 진단을 내리지 않는다. 약을 새로 시작·중단·증량·감량하라고 하지 않는다 — 약은 의사·약사와 상의하라고 한다.
- 확실하지 않은 걸 확실한 척하지 않는다.

응급
- 입술·혀·목이 붓거나, 숨이 차거나 쌕쌕거리거나, 어지럽고 쓰러질 것 같거나, 온몸 두드러기와 구토·복통이 함께 오면 → 답의 맨 앞에 「지금 바로 119에 전화하거나 응급실로 가세요」라고 쓴다.

병원 안내
- 두드러기가 6주 넘게 이어지면 만성 두드러기 범주라 피부과나 알레르기내과 진료를 권한다.
- 한 자국이 24시간 넘게 가거나 멍처럼 남는 일이 있으면 꼭 의사에게 말하라고 한다.

말투와 형식
- 휴대폰 말풍선에 보인다. 보통 3~8줄로 짧게. 마크다운 제목·표·굵게 기호(#, |, **)는 쓰지 않는다. 목록이 필요하면 「- 」나 「1.」 정도만.
- 따뜻하지만 차분한 존댓말(~요).`;

function dayLine(l: SkinLog): string {
  const parts: string[] = [l.date];
  parts.push(l.uas != null ? `팽진${l.wheals} 가려움${l.itch} UAS${l.uas}` : '점수 기록 없음');
  const med = medOf(l);
  parts.push(`약 ${med === 'taken' ? '먹음' : med === 'late' ? '늦게 먹음' : med === 'missed' ? '거름' : '기록 없음'}${(l.meds ?? []).filter((m) => m.time).map((m) => ` ${m.name} ${m.time}`).join('')}`);
  for (const e of l.episodes ?? []) {
    parts.push(`증상 ${e.start ?? '시각?'}${e.durMin ? ` ${e.durMin}분` : ''} ${(e.areas ?? []).join('·')}${e.over24h ? ' (24시간 넘게)' : ''}${e.bruiseLike ? ' (멍처럼)' : ''}`);
  }
  if (l.angioedema?.present) parts.push(`붓기 ${(l.angioedema.areas ?? []).join('·')}`);
  if (l.trace) parts.push(`흔적 ${l.trace}`);
  if (l.triggers?.length) parts.push(`의심 ${l.triggers.join(', ')}`);
  if (l.foods?.length) parts.push(`먹은 것 ${l.foods.map((f) => `${f.t ? f.t + ' ' : ''}${f.text}`).join(' / ')}`);
  const life = [l.sleepH != null && `잠 ${l.sleepH}시간`, l.wakeItch != null && (l.wakeItch ? '가려워서 깸' : '안 깸'),
    l.waterMl != null && `물 ${l.waterMl}ml`, l.stress != null && `스트레스 ${l.stress}/10`].filter(Boolean);
  if (life.length) parts.push(life.join(', '));
  if (l.period != null) parts.push(l.period ? `생리 중${l.cycleDay ? ` ${l.cycleDay}일째` : ''}` : '생리 아님');
  if (l.newProducts?.length) parts.push(`새 제품 ${l.newProducts.join(', ')}`);
  if (l.env) parts.push(`날씨 ${l.env.temp ?? '?'}°C 습도${l.env.humidity ?? '?'}% PM10 ${l.env.pm10 ?? '?'} PM2.5 ${l.env.pm25 ?? '?'}`);
  if (l.note) parts.push(`메모: ${l.note.replace(/\s*\n\s*/g, ' / ')}`);
  return parts.join(' | ');
}

async function buildContext(db: FirebaseFirestore.Firestore, today: string): Promise<string> {
  const [qs, onset, supp, intake] = await Promise.all([
    db.collection(`skin/${SKIN_OWNER}/logs`).where('date', '>=', addDays(today, -36)).where('date', '<=', today).orderBy('date').get(),
    db.doc(`skin/${SKIN_OWNER}/history/onset`).get(),
    db.doc(`skin/${SKIN_OWNER}/history/supplements`).get(),
    db.doc(`skin/${SKIN_OWNER}/survey/intake`).get(),
  ]);
  const logs = qs.docs.map((d) => d.data() as SkinLog);
  const { summary, triggers } = skinStats(logs, today);
  const recent = logs.filter((l) => l.date >= addDays(today, -29));
  const strip = (o: Record<string, unknown> | undefined) => {
    if (!o) return '없음';
    const { updatedAt, importedAt, ...rest } = o as Record<string, unknown>;
    void updatedAt; void importedAt;
    return JSON.stringify(rest);
  };
  return [
    `# 꼼이 기록 (오늘 ${today}, 한국 시간)`,
    '',
    '## 요약 (최근 30일, 앱이 계산)',
    `- 점수 적은 날 ${summary.daysLogged}/30일, 약 거른 날 ${summary.medMissedDays}일`,
    `- 최근 7일 UAS7 ${summary.uas7 ?? '모름(4일 미만 기록)'}, 그 전 7일 ${summary.uas7Prev ?? '모름'}`,
    `- 약 거른 다음날 평균 UAS ${summary.afterMissedAvg?.toFixed(1) ?? '모름'}, 먹은 다음날 ${summary.afterTakenAvg?.toFixed(1) ?? '모름'}`,
    `- 자주 적은 의심 요인: ${triggers.map((t) => `${t.name}(${t.days}일, 그날 평균 UAS ${t.avgUas.toFixed(1)})`).join(', ') || '없음'}`,
    '',
    '## 날짜별 일지 (오래된 날 → 최근)',
    recent.length ? recent.map(dayLine).join('\n') : '아직 없음',
    '',
    '## 발병 경과',
    strip(onset.data()),
    '',
    '## 영양제',
    strip(supp.data()),
    '',
    '## 초진 설문 답 (문항 번호: 답 — 문항 문구는 아직 없음)',
    strip(intake.data()),
  ].join('\n');
}

export async function GET() {
  const who = await requireReader();
  if (who instanceof NextResponse) return who;
  const snap = await adminDb()!.doc(THREAD).get();
  return NextResponse.json({ messages: (snap.data()?.messages ?? []) as ChatMsg[] });
}

// 화면용 대화는 최근 KEEP말만 두고, 넘친 옛 말은 chatArchive/{YYYY-MM}에 옮겨 둔다(지우지 않음 — 백업 우선, 우댕 2026-10-21)
async function saveThread(db: Firestore, threadRef: DocumentReference, all: ChatMsg[], at: string) {
  const drop = all.slice(0, Math.max(0, all.length - KEEP));
  const batch = db.batch();
  for (const month of new Set(drop.map((m) => m.at.slice(0, 7)))) {
    const msgs = drop.filter((m) => m.at.startsWith(month));
    batch.set(db.doc(`skin/${SKIN_OWNER}/chatArchive/${month}`), { messages: FieldValue.arrayUnion(...msgs) }, { merge: true });
  }
  batch.set(threadRef, { messages: all.slice(-KEEP), updatedAt: at });
  await batch.commit();
}

export async function POST(req: NextRequest) {
  const who = await requireWriter();
  if (who instanceof NextResponse) return who;
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'no_api_key' }, { status: 503 });
  const body = await req.json().catch(() => null);
  const text = String(body?.text ?? '').trim().slice(0, 2000);
  if (!text) return NextResponse.json({ error: 'empty' }, { status: 400 });

  const db = adminDb()!;
  const today = kstToday();
  const usageRef = db.doc(`skin/${SKIN_OWNER}/chatUsage/${today}`);
  const used = ((await usageRef.get()).data()?.count as number) ?? 0;
  if (used >= DAILY_LIMIT) return NextResponse.json({ error: 'daily_limit' }, { status: 429 });

  const threadRef = db.doc(THREAD);
  const prev = ((await threadRef.get()).data()?.messages ?? []) as ChatMsg[];
  const userMsg: ChatMsg = { id: newId(), role: 'user', text, at: new Date().toISOString() };
  const history: Anthropic.Beta.BetaMessageParam[] = [...prev.slice(-HISTORY_TURNS), userMsg].map((m) => ({ role: m.role, content: m.text }));
  while (history.length && history[0].role !== 'user') history.shift();

  const context = await buildContext(db, today);
  const client = new Anthropic();
  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 8000,
    output_config: { effort: 'medium' },
    betas: ['server-side-fallback-2026-06-01'],
    fallbacks: [{ model: 'claude-opus-4-8' }],
    system: [
      { type: 'text', text: RULES },
      { type: 'text', text: context, cache_control: { type: 'ephemeral' } },
    ],
    messages: history,
  });

  const enc = new TextEncoder();
  const out = new ReadableStream<Uint8Array>({
    async start(controller) {
      let full = '';
      const push = (t: string) => { full += t; controller.enqueue(enc.encode(t)); };
      try {
        for await (const ev of stream) {
          if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta') push(ev.delta.text);
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === 'refusal') {
          full = '';
          push('이 질문에는 지금 답하기 어려워요. 다르게 물어봐 주시거나, 걱정되는 증상이면 병원에 꼭 물어봐 주세요.');
        } else if (final.stop_reason === 'max_tokens') {
          push('\n(답이 길어서 여기서 끊겼어요. 「이어서」라고 보내 주세요.)');
        }
        const reply: ChatMsg = { id: newId(), role: 'assistant', text: full, at: new Date().toISOString() };
        await saveThread(db, threadRef, [...prev, userMsg, reply], reply.at);
        const u = final.usage;
        await usageRef.set({
          count: FieldValue.increment(1),
          inTok: FieldValue.increment(u.input_tokens ?? 0),
          outTok: FieldValue.increment(u.output_tokens ?? 0),
          cacheRead: FieldValue.increment(u.cache_read_input_tokens ?? 0),
          cacheWrite: FieldValue.increment(u.cache_creation_input_tokens ?? 0),
          model: final.model,
        }, { merge: true });
      } catch (e) {
        console.error('skin chat', e);
        push(full ? '\n(답을 받다가 끊겼어요. 다시 보내 주세요.)' : '지금 Claude와 연결이 안 돼요. 잠시 뒤에 다시 보내 주세요.');
        await saveThread(db, threadRef, [...prev, userMsg], userMsg.at).catch(() => {});
      } finally {
        controller.close();
      }
    },
  });
  return new Response(out, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
}
