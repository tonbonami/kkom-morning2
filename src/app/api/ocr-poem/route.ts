// 사진에 적힌 시(또는 손글씨)를 텍스트로 옮겨주는 OCR.
// Anthropic Claude Haiku 4.5 Vision API 사용 — 한국어 손글씨 정확도 좋음, 비용 매우 저렴 (~$0.002/장).
// 입력: { imageBase64: string, mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' }
// 출력: { text: string }  — OCR 결과. 실패/읽을 수 없으면 빈 문자열.

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 30; // Vercel serverless 타임아웃 — Vision 호출이 길어질 수 있어 여유

const PROMPT = `이 사진에 적힌 글(시, 손글씨, 메모 등)을 그대로 옮겨 적어줘.

규칙:
- 글자만 옮겨. 설명/해설/주석 X.
- 줄바꿈은 사진 그대로 유지.
- 글자를 못 읽거나 사진에 글이 없으면 빈 줄만 반환.
- 추측/보완 X. 분명히 보이는 글자만.
- 도입부 'OCR 결과:' 같은 것도 붙이지 마. 순수 본문만.`;

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY missing' }, { status: 500 });
  }

  let body: { imageBase64?: string; mimeType?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const { imageBase64, mimeType } = body;
  if (!imageBase64 || !mimeType) {
    return NextResponse.json({ error: 'imageBase64 and mimeType required' }, { status: 400 });
  }
  if (!ALLOWED_MIME.has(mimeType)) {
    return NextResponse.json({ error: `unsupported mime type: ${mimeType}` }, { status: 400 });
  }
  // 너무 큰 이미지 거부 (base64 length로 추정 — 1.33배 곱하면 원본 크기)
  if (imageBase64.length > 6 * 1024 * 1024) {
    return NextResponse.json({ error: 'image too large (max ~4.5MB)' }, { status: 413 });
  }

  const client = new Anthropic({ apiKey });
  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mimeType as any, data: imageBase64 },
          },
          { type: 'text', text: PROMPT },
        ],
      }],
    });
    const block = message.content.find((c) => c.type === 'text');
    const text = block && block.type === 'text' ? block.text.trim() : '';
    return NextResponse.json({ text });
  } catch (e: any) {
    console.error('OCR 실패:', e);
    return NextResponse.json({ error: 'OCR failed', detail: String(e?.message || e) }, { status: 500 });
  }
}
