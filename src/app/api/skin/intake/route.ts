// 초진 설문 답 — GET(읽기) → { answers } / PUT(꼼이만) { id, value | null } 문항 하나씩 저장(null = 지우기).
// 문항 id에 점이 있어서('4.1') FieldPath로 한 칸만 바꾼다.
import { NextRequest, NextResponse } from 'next/server';
import { FieldPath, FieldValue } from 'firebase-admin/firestore';
import { requireReader, requireWriter } from '@/lib/skinAuth';
import { adminDb } from '@/lib/firebaseAdmin';
import { SKIN_INTAKE_PATH } from '@/lib/skinTypes';
import { INTAKE_SECTIONS } from '@/lib/skinIntake';

export const dynamic = 'force-dynamic';

const QUESTIONS = new Map(INTAKE_SECTIONS.flatMap((s) => s.qs).map((q) => [q.id, q]));

export async function GET() {
  const who = await requireReader();
  if (who instanceof NextResponse) return who;
  const d = (await adminDb()!.doc(SKIN_INTAKE_PATH).get()).data() ?? {};
  return NextResponse.json({ answers: d.answers ?? {} });
}

export async function PUT(req: NextRequest) {
  const who = await requireWriter();
  if (who instanceof NextResponse) return who;
  const body = await req.json().catch(() => null);
  const id = String(body?.id ?? '');
  const q = QUESTIONS.get(id);
  if (!q) return NextResponse.json({ error: 'bad_id' }, { status: 400 });
  let value: string | string[] | null = body?.value ?? null;
  if (value !== null) {
    if (q.t === 'multi') {
      value = Array.isArray(value) ? value.map((v) => String(v).slice(0, 200)).slice(0, 30) : null;
      if (value && !value.length) value = null;
    } else {
      value = String(value).slice(0, q.t === 'long' ? 3000 : 300).trim() || null;
    }
  }
  const ref = adminDb()!.doc(SKIN_INTAKE_PATH);
  if (!(await ref.get()).exists) await ref.set({ answers: {} });
  await ref.update(new FieldPath('answers', id), value === null ? FieldValue.delete() : value,
    'updatedAt', new Date().toISOString());
  return NextResponse.json({ ok: true });
}
