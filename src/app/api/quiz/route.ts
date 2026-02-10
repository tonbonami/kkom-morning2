import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL;

// 실시간 데이터를 위해 캐시를 사용하지 않도록 설정합니다.
export const revalidate = 0;

export async function GET() {
  if (!API_URL) {
    return NextResponse.json({ message: 'API URL이 설정되지 않았습니다.' }, { status: 500 });
  }

  try {
    const response = await fetch(`${API_URL}?action=getQuiz`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Google Apps Script request failed with status ${response.status}: ${errorText}`);
      return NextResponse.json(
        { message: 'Error fetching quiz from Google Apps Script.', error: errorText },
        { status: 502 }
      );
    }
    
    const data = await response.json();

    if (data.result === 'success' && data.quiz) {
      return NextResponse.json(data.quiz);
    } else {
      console.error('Google Apps Script returned a failure result for quiz:', data.message);
      return NextResponse.json(
        { message: 'Google Apps Script reported an error for quiz.', error: data.message || 'Unknown script error' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('API route error (quiz):', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
        { message: 'Failed to connect to the backend service for quiz.', error: errorMessage }, 
        { status: 500 }
    );
  }
}
