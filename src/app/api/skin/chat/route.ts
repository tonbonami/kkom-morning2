// 꼼이 피부 일지 — Claude 상담. PIN 쿠키 필요(읽기 requireReader · 쓰기는 꼼이만 requireWriter).
//   GET  → { messages }  (skin/kkomi/chat/main, 최근 200개)
//   POST { text, photos? } → 글자를 흘려보내는 text/plain 스트림. 끝나면 대화에 저장.
//     photos = [{ date, id }] 최대 3장 — 일지에 올린 사진(상담 화면에서 새로 찍은 것도 먼저 오늘 일지에 올린 뒤 보낸다).
//     우댕 2026-11-08 「ⓐ 상담 화면에 사진 올리기 — 보낸 사진만 상담사가 본다」. 그 전엔 상담 Claude가 사진을 못 봤다(글·장수만).
// 모델: Claude Opus 5.5(우댕 결정 2026-10-21) — env SKIN_CHAT_MODEL로 바꿀 수 있음.
// 하루 60번 상한(skin/kkomi/chatUsage/{날짜}), 토큰 사용량도 같이 적어 둔다.
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { FieldValue, type DocumentReference, type Firestore } from 'firebase-admin/firestore';
import { requireReader, requireWriter } from '@/lib/skinAuth';
import { adminBucket, adminDb } from '@/lib/firebaseAdmin';
import { DATE_RE, SKIN_OWNER, SKIN_START, sevOf, skinLogPath, type SkinLog } from '@/lib/skinTypes';
import { INTAKE_SECTIONS } from '@/lib/skinIntake';
import { skinStats, medOf } from '@/lib/skinStats';
import { dayLine } from '@/lib/skinContext';
import type { ChatSummary, MemoryItem } from '@/lib/skinChatSummary';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const MODEL = process.env.SKIN_CHAT_MODEL || 'claude-opus-5-5';
const DAILY_LIMIT = 60;
const HISTORY_TURNS = 60;   // 모델에 다시 보내는 최근 말 개수(더 옛 대화는 아래 「상담 기억」·「지난 상담 정리」로 이어진다)
const KEEP = 200;           // 저장해 두는 최근 말 개수
const THREAD = `skin/${SKIN_OWNER}/chat/main`;

// photos — 꼼이가 상담에 보낸 사진(일지 사진을 가리킨다). path 는 서버만 쓰고 화면엔 서명 주소(photoUrls)로 내보낸다.
type ChatPhoto = { date: string; id: string; path: string };
type ChatMsg = { id: string; role: 'user' | 'assistant'; text: string; at: string; photos?: ChatPhoto[] };
const MAX_PHOTOS = 3;
const PHOTO_TURNS = 6;   // 사진을 다시 보여 주는 최근 말 수 — 그보다 옛 사진은 「보냈었다」는 글만(같은 사진을 매번 다시 보내 비용이 쌓이지 않게)

const kstToday = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
const addDays = (d: string, n: number) => new Date(Date.parse(d + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);
const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const RULES = `너는 Anthropic이 만든 AI인 Claude다. 꼼모닝(커플 앱)의 「꿀닥터」(꼼이 피부 일지 — 의사 가운 입은 꿀벌 아기돼지 「꿀됑」이 마스코트) 안에서 꼼이와 대화한다. 꼼이는 2026년 5월부터 원인을 모르는 두드러기·가려움을 겪고 있고, 매일 일지를 쓴다. 꼼이는 다른 AI보다 Claude를 믿고 쓰고 있다.

정체
- 너는 의사가 아니라 Anthropic이 만든 AI Claude다. 대화의 첫 답에서 한 줄로 「Anthropic이 만든 AI Claude예요」라고 밝힌다. 누가 물어도 언제나 솔직하게 밝히고, 사람이나 다른 AI인 척하지 않는다.

하는 일
- 아래 「꼼이 기록」을 근거로 날짜를 짚어 가며 패턴을 같이 살핀다(예: 약을 거른 다음날, 특정 음식·더위·운동 뒤).
- 「꼼이 기록」에는 첫 기록부터 오늘까지 꼼이가 적은 일지가 전부 붙어 있다(달마다 요약 + 날짜별 전체). 「지금까지」「처음부터」를 물으면 전체 기간을, 따로 말이 없으면 최근을 중심으로 본다.
- 생활에서 해 볼 수 있는 것, 다음에 더 적어 두면 좋을 것, 병원에 가져갈 질문을 정리해 준다.
- 기록이 적거나 비어 있으면 그렇다고 말한다. 기록에 있는 사실과 너의 추측을 구분해서 말한다. 숫자는 기록에 있는 것만 쓴다.

이 앱에서 되는 것 — 꼭 알고 정확히 안내한다(우댕 2026-10-22: Claude가 「저장 안 된다·직접 옮겨 적으라」고 잘못 안내함)
- 이 대화는 앱에 저장된다. 너는 최근 대화 원문과 아래 「상담 기억」「지난 상담 정리」로 이전 상담을 이어서 기억한다. 「이 대화는 저장되지 않는다」「다음엔 기억 못 한다」고 말하지 않는다.
- 너는 대화하는 동안 일지를 직접 고치지는 않는다. 대신 상담 화면 아래, 입력칸 바로 위의 「✨ 오늘 상담 정리하기」 버튼을 누르면 네가 그날 상담을 정리하고, 일지에 넣을 사실(약·용량·시각, 증상, 의심 가는 것, 먹은 것, 잠, 생리 등)과 다음에도 기억할 것을 뽑아 보여 준다. 꼼이는 보고 고칠 것만 고친 뒤 「일지에 반영」만 누르면 된다.
- 그래서 꼼이가 일지에 적어 달라고 하거나 기록해 둘 만한 사실을 말하면, 내용을 다시 늘어놓지 말고 「대화 끝나고 아래 ✨ 오늘 상담 정리하기를 눌러 주세요. 제가 정리해서 일지에 넣을 걸 보여 드리면 확인만 하시면 돼요」처럼 짧게 안내한다.
- 꼼이에게 직접 옮겨 적거나 붙여 넣으라고 하지 않는다. 다른 사람(남자친구 포함)에게 기록을 부탁하라고 하지 않는다. 「고쳐 둘게요」「적어 둘게요」처럼 네가 지금 바로 저장하는 것처럼 말하지 않는다.
- 남자친구는 앱에서 「우댕」이라고 부르고, 일지를 보기만 한다.
- 사진(2026-11-08부터): 꼼이는 상담 화면 입력칸 왼쪽 사진 단추로 사진을 보낼 수 있다(일지에 올린 사진에서 고르거나 새로 찍기, 한 번에 3장까지). 너는 꼼이가 이 대화에 보낸 사진만 볼 수 있다. 일지에 적힌 「사진 n장」은 장수일 뿐이고 너에게 보이지 않는다 — 보이지 않는 사진을 본 것처럼 말하지 않는다. 사진을 보면 좋겠으면 「입력칸 왼쪽 사진 단추로 보내 주세요」라고 안내한다. 조금 전에 보낸 사진은 몇 마디 동안만 다시 보이고, 오래된 사진은 「이때 사진을 보냈다」는 표시만 남는다 — 그때는 다시 보내 달라고 한다.
- 사진을 볼 때: 눈에 보이는 것만 담담하게 말한다(위치, 붉은 정도, 부어오른 자국의 모양·크기, 긁힌 자국, 지난 사진과 달라 보이는 점). 사진만으로 병명을 붙이거나 진단하지 않는다. 사진이 흐리거나 어두우면 그렇다고 말하고 밝은 곳에서 같은 거리로 다시 찍어 달라고 한다. 병원에 보여 줄 만한 사진이면 그렇게 말해 준다. 사진에 응급 신호(입술·눈·혀가 붓는 등)가 보이면 아래 「응급」대로 119를 먼저 말한다.
- 점수(2026-10-24부터): 가려움·붉어짐을 각각 0~10으로 적는다(0 = 증상 없음). 하루 점수 = 둘 중 높은 값, 7 이상이면 힘든 날. 그 전 기록은 팽진·가려움 0~3이었고 가려움만 0~10으로 환산해 보여 준다. 메모는 아침·점심·저녁·밤 네 칸이고 칸마다 사진이 붙는다.

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

// 설문 답을 「섹션 / 문항: 답」으로(문항 id만 보내면 Claude가 무슨 질문인지 모름)
function intakeText(data: Record<string, unknown> | undefined): string {
  const answers = (data?.answers ?? {}) as Record<string, unknown>;
  const lines: string[] = [];
  for (const sec of INTAKE_SECTIONS) {
    for (const q of sec.qs) {
      const a = answers[q.id];
      if (a == null || a === '' || (Array.isArray(a) && !a.length)) continue;
      lines.push(`- [${sec.title}] ${q.q}: ${Array.isArray(a) ? a.join(', ') : String(a)}`);
    }
  }
  return lines.length ? lines.join('\n') : '아직 답 없음';
}

// 달마다 요약 — 몇 달 치를 한눈에(날짜별 전체는 아래에)
function monthLines(logs: SkinLog[]): string[] {
  const by = new Map<string, SkinLog[]>();
  for (const l of logs) by.set(l.date.slice(0, 7), [...(by.get(l.date.slice(0, 7)) ?? []), l]);
  return [...by.entries()].map(([m, ls]) => {
    const scored = ls.filter((l) => sevOf(l) != null);
    const avg = scored.length ? (scored.reduce((a, l) => a + (sevOf(l) ?? 0), 0) / scored.length).toFixed(1) : '모름';
    return `- ${m}: 적은 날 ${ls.length}일, 평균 하루 점수 ${avg}/10, 7점 이상 ${scored.filter((l) => (sevOf(l) ?? 0) >= 7).length}일, 약 거른 날 ${ls.filter((l) => medOf(l) === 'missed').length}일, 붓기 ${ls.filter((l) => l.angioedema?.present).length}일`;
  });
}

// 우댕 2026-10-21: "여태까지 피부 상태 입력한 걸 첨부해서" → 최근 30일이 아니라 첫 기록부터 전부(맥락 블록은 캐시라 다시 읽을 땐 싸다)
async function buildContext(db: FirebaseFirestore.Firestore, today: string): Promise<string> {
  const [qs, onset, supp, intake, mem, sums] = await Promise.all([
    db.collection(`skin/${SKIN_OWNER}/logs`).where('date', '>=', SKIN_START).where('date', '<=', today).orderBy('date').get(),
    db.doc(`skin/${SKIN_OWNER}/history/onset`).get(),
    db.doc(`skin/${SKIN_OWNER}/history/supplements`).get(),
    db.doc(`skin/${SKIN_OWNER}/survey/intake`).get(),
    db.doc(`skin/${SKIN_OWNER}/chat/memory`).get(),
    db.collection(`skin/${SKIN_OWNER}/chatSummaries`).orderBy('date').get(),
  ]);
  const logs = qs.docs.map((d) => d.data() as SkinLog);
  const { summary, triggers } = skinStats(logs, today);
  const memory = ((mem.data()?.items ?? []) as MemoryItem[]);
  const summaries = sums.docs.map((d) => d.data() as ChatSummary);
  const strip = (o: Record<string, unknown> | undefined) => {
    if (!o) return '없음';
    const { updatedAt, importedAt, ...rest } = o as Record<string, unknown>;
    void updatedAt; void importedAt;
    return JSON.stringify(rest);
  };
  return [
    `# 꼼이 기록 (오늘 ${today}, 한국 시간)`,
    '',
    '## 상담 기억 (꼼이가 「오늘 상담 정리」에서 확인해 남긴 것 — 오래된 대화도 이걸로 이어서 기억한다)',
    memory.length ? memory.map((m) => `- ${m.date} [${m.kind}] ${m.text}`).join('\n') : '아직 없음',
    '',
    '## 지난 상담 정리 (날짜별)',
    summaries.length
      ? summaries.map((c) => `- ${c.date}${c.status === 'applied' ? '' : ' (꼼이 확인 전)'}: ${[...c.key, ...c.plans.map((x) => `해 보기로: ${x}`), ...c.worries.map((x) => `걱정: ${x}`)].join(' / ')}`).join('\n')
      : '아직 없음',
    '',
    `## 전체 기간: ${logs[0]?.date ?? '없음'} ~ ${logs[logs.length - 1]?.date ?? '없음'}, 적은 날 ${logs.length}일`,
    '',
    '## 달마다 요약',
    logs.length ? monthLines(logs).join('\n') : '아직 없음',
    '',
    '## 최근 30일 요약 (앱이 계산)',
    `- 점수 적은 날 ${summary.daysLogged}/30일, 약 거른 날 ${summary.medMissedDays}일`,
    `- 최근 7일 하루 점수 평균 ${summary.avg7 ?? '모름(3일 미만 기록)'}${summary.avg7 != null ? `/10 (7일 중 ${summary.days7}일 기록)` : ''}, 그 전 7일 ${summary.avg7Prev ?? '모름'}`,
    `- 약 거른 다음날 평균 점수 ${summary.afterMissedAvg?.toFixed(1) ?? '모름'}(${summary.afterMissedN}번), 먹은 다음날 ${summary.afterTakenAvg?.toFixed(1) ?? '모름'}(${summary.afterTakenN}번)`,
    `- 자주 적은 의심 요인: ${triggers.map((t) => `${t.name}(${t.days}일, 그날 평균 ${t.avgUas.toFixed(1)}/10)`).join(', ') || '없음'}`,
    '',
    '## 날짜별 일지 전체 (처음 → 오늘)',
    logs.length ? logs.map(dayLine).join('\n') : '아직 없음',
    '',
    '## 발병 경과',
    strip(onset.data()),
    '',
    '## 영양제',
    strip(supp.data()),
    '',
    '## 초진 설문 답',
    intakeText(intake.data()),
  ].join('\n');
}

// 사진 파일 → Claude 그림 블록. 일지 사진만(경로가 skin/kkomi/ 밑) — 못 읽으면 건너뛴다.
async function imageBlocks(photos: ChatPhoto[]): Promise<Anthropic.Beta.BetaImageBlockParam[]> {
  const bucket = adminBucket();
  if (!bucket) return [];
  const out: Anthropic.Beta.BetaImageBlockParam[] = [];
  for (const p of photos) {
    if (!p.path.startsWith(`skin/${SKIN_OWNER}/`)) continue;
    try {
      const [buf] = await bucket.file(p.path).download();
      out.push({ type: 'image', source: { type: 'base64', media_type: p.path.endsWith('.png') ? 'image/png' : 'image/jpeg', data: buf.toString('base64') } });
    } catch { /* 지운 사진 등 — 건너뜀 */ }
  }
  return out;
}

// 보내려는 사진 [{date,id}] → 일지에서 경로를 찾아 확인(꼼이 일지에 실제로 있는 사진만)
async function resolvePhotos(db: Firestore, raw: unknown): Promise<ChatPhoto[]> {
  if (!Array.isArray(raw)) return [];
  const out: ChatPhoto[] = [];
  for (const r of raw.slice(0, MAX_PHOTOS)) {
    const date = String((r as { date?: unknown })?.date ?? '');
    const id = String((r as { id?: unknown })?.id ?? '');
    if (!DATE_RE.test(date) || !id) continue;
    const log = (await db.doc(skinLogPath(date)).get()).data() as SkinLog | undefined;
    const hit = log?.photos?.find((p) => p.id === id);
    if (hit && hit.path.startsWith(`skin/${SKIN_OWNER}/`) && !out.some((o) => o.id === id)) out.push({ date, id, path: hit.path });
  }
  return out;
}

async function signedUrl(path: string): Promise<string | null> {
  try {
    const [url] = await adminBucket()!.file(path).getSignedUrl({ version: 'v4', action: 'read', expires: Date.now() + 15 * 60 * 1000 });
    return url;
  } catch { return null; }
}

export async function GET() {
  const who = await requireReader();
  if (who instanceof NextResponse) return who;
  const snap = await adminDb()!.doc(THREAD).get();
  const messages = await Promise.all(((snap.data()?.messages ?? []) as ChatMsg[]).map(async ({ photos, ...m }) => {
    if (!photos?.length) return m;
    const urls = (await Promise.all(photos.map((p) => signedUrl(p.path)))).filter((u): u is string => !!u);
    return { ...m, photoUrls: urls };
  }));
  return NextResponse.json({ messages });
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
  const db = adminDb()!;
  const photos = await resolvePhotos(db, body?.photos);
  if (!text && !photos.length) return NextResponse.json({ error: 'empty' }, { status: 400 });

  const today = kstToday();
  const usageRef = db.doc(`skin/${SKIN_OWNER}/chatUsage/${today}`);
  const used = ((await usageRef.get()).data()?.count as number) ?? 0;
  if (used >= DAILY_LIMIT) return NextResponse.json({ error: 'daily_limit' }, { status: 429 });

  const threadRef = db.doc(THREAD);
  const prev = ((await threadRef.get()).data()?.messages ?? []) as ChatMsg[];
  const userMsg: ChatMsg = { id: newId(), role: 'user', text, at: new Date().toISOString(), ...(photos.length ? { photos } : {}) };
  // 최근 PHOTO_TURNS 말 안의 사진은 그림으로 다시 보여 주고(「아까 사진에서…」), 그보다 옛 사진은 글로 표시만
  const recentMsgs = [...prev.slice(-HISTORY_TURNS), userMsg];
  const history: Anthropic.Beta.BetaMessageParam[] = await Promise.all(recentMsgs.map(async (m, i) => {
    const body = m.text || '(글 없이 사진만 보냄)';
    if (m.role !== 'user' || !m.photos?.length) return { role: m.role, content: m.text };
    if (i >= recentMsgs.length - PHOTO_TURNS) {
      const imgs = await imageBlocks(m.photos);
      if (imgs.length) return { role: 'user' as const, content: [...imgs, { type: 'text' as const, text: body }] };
    }
    return { role: 'user' as const, content: `${body}\n[이때 사진 ${m.photos.length}장을 보냈어요 — 지금은 그 사진이 안 보여요]` };
  }));
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
