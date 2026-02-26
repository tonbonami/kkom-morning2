import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const API_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL;

    if (!API_URL) {
      console.error('❌ API URL이 설정되지 않았습니다.');
      return NextResponse.json(
        { message: 'API URL이 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { answer } = body;

    console.log('📤 정답 확인 요청:', { answer });

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'checkQuizAnswer',
        userAnswer: answer?.trim() || '' // ✅ 이 줄만 수정
      }),
      cache: 'no-store'
    });

    console.log('📥 Apps Script 응답 상태:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Apps Script 연결 오류:', errorText);
      return NextResponse.json(
        { message: 'Apps Script 연결 오류', error: errorText },
        { status: 502 }
      );
    }

    const data = await response.json();
    console.log('✅ Apps Script 응답 데이터:', data);

    // ✅ data.success → data.correct 수정
    if (data.correct) {
      return NextResponse.json({
        isCorrect: true,
        explanation: data.message,
        memory: data.memory || '' // ✅ 이것도 안전하게
      });
    } else {
      return NextResponse.json({
        isCorrect: false,
        explanation: data.message || '다시 한 번 생각해보세요!'
      });
    }

  } catch (error: any) {
    console.error('❌ 정답 확인 오류:', error);
    return NextResponse.json(
      { message: '정답 확인 중 오류가 발생했습니다.', error: error.message },
      { status: 500 }
    );
  }
}