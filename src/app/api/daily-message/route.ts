import { NextResponse } from 'next/server';

const API_URL = 'https://script.google.com/macros/s/AKfycbyvrzsVrCjrzIKDTfI_KNnxolc09qhUdwQKYd9dj3qCmUwlj9GxOh1mLFmsRouQ-MDY/exec';

// 실시간 데이터를 위해 캐시를 사용하지 않도록 설정합니다.
export const revalidate = 0;

export async function GET() {
  try {
    const response = await fetch(`${API_URL}?action=getDailyMessage`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Google Apps Script request failed with status ${response.status}: ${errorText}`);
      return NextResponse.json(
        { message: 'Error fetching daily message from Google Apps Script.', error: errorText },
        { status: 502 } // Bad Gateway
      );
    }

    const contentType = response.headers.get('content-type');
    // GAS can return an HTML page for redirects or errors. We must only parse JSON.
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response from GAS:', text);
      return NextResponse.json(
        { message: 'Invalid response format from Google Apps Script. Expected JSON.', error: "Received non-JSON response, which might be an error page from Google." },
        { status: 502 }
      );
    }

    const data = await response.json();

    if (data.result === 'success') {
      return NextResponse.json({ message: data.message });
    } else {
      console.error('Google Apps Script returned a failure result:', data.message);
      return NextResponse.json(
        { message: 'Google Apps Script reported an error.', error: data.message || 'Unknown script error' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('API route error (network level):', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
        { message: 'Failed to connect to the backend service.', error: errorMessage }, 
        { status: 500 }
    );
  }
}
