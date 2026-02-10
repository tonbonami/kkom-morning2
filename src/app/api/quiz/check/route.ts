import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL;

export async function POST(request: Request) {
  if (!API_URL) {
    return NextResponse.json({ message: 'API URL이 설정되지 않았습니다.' }, { status: 500 });
  }

  try {
    const { id, answer } = await request.json();
    
    const response = await fetch(`${API_URL}?action=checkQuiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, answer }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Google Apps Script check request failed with status ${response.status}: ${errorText}`);
      return NextResponse.json(
        { message: 'Error checking quiz answer with Google Apps Script.', error: errorText },
        { status: 502 }
      );
    }

    const data = await response.json();

    if (data.result === 'success') {
      return NextResponse.json({ isCorrect: data.isCorrect, explanation: data.explanation });
    } else {
      return NextResponse.json(
        { message: 'Google Apps Script reported an error checking answer.', error: data.message },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('API route error (quiz check):', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
        { message: 'Failed to connect to the backend service for quiz check.', error: errorMessage }, 
        { status: 500 }
    );
  }
}
