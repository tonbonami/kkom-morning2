// 상담 정리 → 「선택한 내용을 일지에 반영」(꼼이만). 꼼이가 켜고 고친 후보만 받아 날짜별로 일지에 합치고(덮어쓰기 전 판은 versions),
// 고른 기억은 skin/kkomi/chat/memory 에 더한다. 정리 문서는 applied 로.
//   POST { date, items: [{ proposal, mode: 'replace' | 'note' }], memory: [{ kind, text }] }
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { requireWriter } from '@/lib/skinAuth';
import { adminDb } from '@/lib/firebaseAdmin';
import { DATE_RE, SKIN_OWNER, type SkinLog } from '@/lib/skinTypes';
import { kstToday, writeSkinLog } from '@/lib/skinLogWrite';
import { APPLY_FIELDS, patchFromProposals, type ApplyItem, type MemoryCandidate, type MemoryItem } from '@/lib/skinChatSummary';

export const dynamic = 'force-dynamic';

const KINDS = ['med', 'doctor', 'worry', 'plan', 'todo', 'allergy', 'other'];
const newId = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36);

export async function POST(req: NextRequest) {
  const who = await requireWriter();
  if (who instanceof NextResponse) return who;
  const body = await req.json().catch(() => null);
  const date = body?.date;
  if (typeof date !== 'string' || !DATE_RE.test(date)) return NextResponse.json({ error: 'bad_date' }, { status: 400 });

  // 날짜가 있고 오늘 이후가 아닌 후보만(날짜 모르는 건 화면에서 꼼이가 골라야 옴)
  const items = (Array.isArray(body?.items) ? body.items : []).filter((it: ApplyItem) =>
    it && (it.mode === 'replace' || it.mode === 'note') && APPLY_FIELDS.includes(it.proposal?.field)
    && typeof it.proposal?.date === 'string' && DATE_RE.test(it.proposal.date) && it.proposal.date <= kstToday()) as ApplyItem[];
  const memory = (Array.isArray(body?.memory) ? body.memory : []).filter((m: MemoryCandidate) =>
    m && KINDS.includes(m.kind) && typeof m.text === 'string' && m.text.trim()).slice(0, 30) as MemoryCandidate[];

  const db = adminDb()!;
  const byDate = new Map<string, ApplyItem[]>();
  for (const it of items) byDate.set(it.proposal.date!, [...(byDate.get(it.proposal.date!) ?? []), it]);
  const logs: SkinLog[] = [];
  for (const [d, list] of byDate) {
    logs.push(await writeSkinLog(db, d, (prev) => patchFromProposals(prev, list), req.nextUrl.origin));
  }

  const now = new Date().toISOString();
  if (memory.length) {
    const add: MemoryItem[] = memory.map((m) => ({ id: newId(), kind: m.kind, text: m.text.trim().slice(0, 300), date, addedAt: now }));
    await db.doc(`skin/${SKIN_OWNER}/chat/memory`).set({ items: FieldValue.arrayUnion(...add), updatedAt: now }, { merge: true });
  }
  await db.doc(`skin/${SKIN_OWNER}/chatSummaries/${date}`).set({
    status: 'applied', appliedAt: now, appliedCount: items.length, appliedItems: items, appliedMemory: memory,
  }, { merge: true });
  return NextResponse.json({ ok: true, logs, applied: items.length, remembered: memory.length });
}
