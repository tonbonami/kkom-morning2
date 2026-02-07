import { NextResponse } from 'next/server';

const API_URL = 'https://script.google.com/macros/s/AKfycbzRkRFH9xxCDWBxrc9SSM_YCUqwOoolM6-YqOK2haf7metCMDUr5Khw19uibXpYJLvp/exec';

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
      throw new Error(`Google Apps Script request failed with status ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    // GAS can return an HTML page for redirects or errors. We must only parse JSON.
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response from GAS:', text);
      throw new Error('Invalid response format from Google Apps Script. Expected JSON.');
    }

    const data = await response.json();

    if (data.result === 'success') {
      return NextResponse.json({ message: data.message });
    } else {
      throw new Error(data.message || 'Failed to get daily message from GAS');
    }

  } catch (error) {
    console.error('API route error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Error fetching daily message.', error: errorMessage }, { status: 500 });
  }
}
