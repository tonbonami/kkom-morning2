import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL;

export const revalidate = 0;

function todayId() {
  return `quiz_${new Date().toISOString().split('T')[0]}`;
}

export async function GET() {
  if (!API_URL) {
    return NextResponse.json({ message: 'API URL이 설정되지 않았습니다.' }, { status: 500 });
  }

  try {
    // ✅ v10.1 기준: getInitialData 안에 todayQuiz가 들어오는 구조가 가장 안정적
    // (기존/구버전(getTodayQuiz)도 아래에서 호환 처리)
    const response = await fetch(`${API_URL}?action=getInitialData&location=home`, {
      cache: 'no-store',
      redirect: 'follow',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Apps Script 요청 실패 (${response.status}):`, errorText);
      return NextResponse.json(
        { message: 'Apps Script 연결 오류', error: errorText },
        { status: 502 }
      );
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response from GAS:', text);
      return NextResponse.json(
        { message: 'GAS가 JSON이 아닌 응답을 반환했습니다.', error: 'Non-JSON response' },
        { status: 502 }
      );
    }

    const data = await response.json();

    // =========================
    // ✅ v10.1 응답 형식
    // =========================
    // 예: { todayQuiz: { hasQuiz: false, question: "" }, ... }
    const todayQuiz = data?.todayQuiz;
    if (todayQuiz && typeof todayQuiz === 'object') {
      const hasQuiz = Boolean(todayQuiz.hasQuiz);
      const question = (todayQuiz.question || '').trim();

      if (hasQuiz && question) {
        return NextResponse.json({
          hasQuiz: true,
          id: todayId(),
          question,
          type: 'text' as const,
        });
      }

      // ✅ 퀴즈가 없는 날도 "정상(200)"으로 처리
      return NextResponse.json({
        hasQuiz: false,
        message: '오늘은 퀴즈가 없어요. 내일 다시 만나요! 🙂',
      });
    }

    // =========================
    // ✅ 구버전(getTodayQuiz) 응답 형식 호환
    // =========================
    // 예: { result: 'success', quiz: { question: '...' } }
    if (data?.result === 'success') {
      const q = (data?.quiz?.question || '').trim();
      if (q) {
        return NextResponse.json({
          hasQuiz: true,
          id: todayId(),
          question: q,
          type: 'text' as const,
        });
      }
      return NextResponse.json({
        hasQuiz: false,
        message: '오늘은 퀴즈가 없어요. 내일 다시 만나요! 🙂',
      });
    }

    // 그 외: 실패 케이스도 200으로 “퀴즈 없음” 처리 (UX 안정)
    return NextResponse.json({
      hasQuiz: false,
      message: data?.message || '오늘은 퀴즈가 없어요. 내일 다시 만나요! 🙂',
    });
  } catch (error) {
    console.error('API route 오류 (quiz):', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { message: '백엔드 연결 실패', error: errorMessage },
      { status: 500 }
    );
  }
}