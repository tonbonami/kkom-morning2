// 임시 — 상담 요청 모양(모델·effort·fallbacks·스트림)이 실제 서버에서 통하는지 한 번 확인용. 확인 뒤 삭제.
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key');
  if (!key || key !== process.env.CRON_SECRET) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const client = new Anthropic();
  const stream = client.beta.messages.stream({
    model: process.env.SKIN_CHAT_MODEL || 'claude-opus-5-5',
    max_tokens: 2000,
    output_config: { effort: 'medium' },
    betas: ['server-side-fallback-2026-06-01'],
    fallbacks: [{ model: 'claude-opus-4-8' }],
    system: [{ type: 'text', text: '너는 Anthropic이 만든 AI Claude다. 한 문장 존댓말로 답한다.' }],
    messages: [{ role: 'user', content: '너는 누구야?' }],
  });
  let text = '';
  for await (const ev of stream) if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta') text += ev.delta.text;
  const final = await stream.finalMessage();
  return NextResponse.json({ model: final.model, stop: final.stop_reason, text, usage: final.usage });
}
