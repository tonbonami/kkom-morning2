import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL;

export const revalidate = 0;

export async function GET() {
  if (!API_URL) {
    return NextResponse.json(
      { message: 'API URL이 설정되지 않았습니다.' }, 
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${API_URL}?action=getTodayQuiz`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Apps Script 요청 실패 (${response.status}):`, errorText);
      return NextResponse.json(
        { message: 'Apps Script 연결 오류', error: errorText },
        { status: 502 }
      );
    }
    
    const data = await response.json();
    console.log('Apps Script 응답:', data);

    // ✅ result 필드 확인
    if (data.result === 'success') {
      if (data.quiz && data.quiz.question) {
        return NextResponse.json({
          id: `quiz_${new Date().toISOString().split('T')[0]}`,
          question: data.quiz.question,
          type: 'text' as const,
        });
      } else {
        return NextResponse.json(
          { message: '퀴즈 데이터 형식이 올바르지 않습니다.' },
          { status: 500 }
        );
      }
    } else {
      // result가 'fail'인 경우
      return NextResponse.json(
        { message: data.message || '오늘의 퀴즈가 없습니다.' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('API route 오류 (quiz):', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { message: '백엔드 연결 실패', error: errorMessage }, 
      { status: 500 }
    );
  }
}
