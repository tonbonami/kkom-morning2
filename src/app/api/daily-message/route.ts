import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL;

// 실시간 데이터를 위해 캐시를 사용하지 않도록 설정합니다.
export const revalidate = 0;

export async function GET(req: Request) {
  if (!API_URL) {
    return NextResponse.json({ message: 'API URL이 설정되지 않았습니다.' }, { status: 500 });
  }

  try {
    // location 쿼리(없으면 home)
    const { searchParams } = new URL(req.url);
    const location = (searchParams.get('location') as 'home' | 'work') || 'home';

    // ✅ v10.1: dailyMessage는 getInitialData 응답에 포함됨
    const response = await fetch(`${API_URL}?action=getInitialData&location=${location}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Google Apps Script request failed with status ${response.status}: ${errorText}`
      );
      return NextResponse.json(
        { message: 'Error fetching data from Google Apps Script.', error: errorText },
        { status: 502 }
      );
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response from GAS:', text);
      return NextResponse.json(
        {
          message: 'Invalid response format from Google Apps Script. Expected JSON.',
          error: 'Received non-JSON response, which might be an error page from Google.',
        },
        { status: 502 }
      );
    }

    const data = await response.json();

    // ✅ v10.1 응답에서 편지 꺼내기
    const msg =
      data?.dailyMessage?.message ||
      data?.dailyMessage?.text ||
      '';

    return NextResponse.json({
      message: msg || '오늘의 편지를 아직 못 받았어요. 💌',
    });
  } catch (error) {
    console.error('API route error (network level):', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { message: 'Failed to connect to the backend service.', error: errorMessage },
      { status: 500 }
    );
  }
}