// 피부 일지 설정 — GET(읽기) / PUT(꼼이만). 지금은 「힘든 날 우댕에게 알리기」 하나.
import { NextRequest, NextResponse } from 'next/server';
import { requireReader, requireWriter } from '@/lib/skinAuth';
import { adminDb } from '@/lib/firebaseAdmin';
import { SKIN_SETTINGS_PATH } from '@/lib/skinTypes';

export const dynamic = 'force-dynamic';

export async function GET() {
  const who = await requireReader();
  if (who instanceof NextResponse) return who;
  const d = (await adminDb()!.doc(SKIN_SETTINGS_PATH).get()).data() ?? {};
  return NextResponse.json({ partnerAlert: d.partnerAlert === true });
}

export async function PUT(req: NextRequest) {
  const who = await requireWriter();
  if (who instanceof NextResponse) return who;
  const body = await req.json().catch(() => ({}));
  const partnerAlert = body?.partnerAlert === true;
  await adminDb()!.doc(SKIN_SETTINGS_PATH).set({ partnerAlert, updatedAt: new Date().toISOString() }, { merge: true });
  return NextResponse.json({ partnerAlert });
}
