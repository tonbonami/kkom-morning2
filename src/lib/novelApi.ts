import type {
    Novel,
    CoverImage,
    NovelDataResponse,
    CreateNovelResponse,
    AddSentenceResponse,
    CompleteNovelResponse,
    LikeSentenceResponse,
    NovelSentenceType,
  } from '@/types';
  
  const API_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL;
  
  // -------------------- GET 요청 --------------------
  
  /**
   * 아뜰리에 전용 데이터 조회 (날씨 API 호출 없이 소설 데이터만)
   * 실시간 데이터이므로 캐시하지 않음
   */
  export async function getNovelData(): Promise<NovelDataResponse> {
    if (!API_URL) {
      throw new Error('NEXT_PUBLIC_APPS_SCRIPT_URL이 설정되어 있지 않습니다.');
    }
  
    try {
      const response = await fetch(`${API_URL}?action=getNovelData`, {
        cache: 'no-store',
      });
  
      if (!response.ok) {
        throw new Error(`서버 응답 오류: ${response.status}`);
      }
  
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('API가 JSON 형식으로 응답하지 않았습니다');
      }
  
      const data = await response.json();
  
      return {
        activeNovels: data.activeNovels || [],
        completedNovels: data.completedNovels || [],
        coverLibrary: data.coverLibrary || [],
      };
    } catch (error) {
      console.error('getNovelData 오류:', error);
      return {
        activeNovels: [],
        completedNovels: [],
        coverLibrary: [],
      };
    }
  }
  
  // -------------------- POST 요청 --------------------
  
  /**
   * POST 요청 공통 헬퍼
   */
  async function postToGAS<T>(body: Record<string, unknown>): Promise<T> {
    if (!API_URL) {
      throw new Error('NEXT_PUBLIC_APPS_SCRIPT_URL이 설정되어 있지 않습니다.');
    }
  
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(body),
    });
  
    if (!response.ok) {
      throw new Error(`서버 응답 오류: ${response.status}`);
    }
  
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', text);
      throw new Error('API가 JSON 형식으로 응답하지 않았습니다');
    }
  
    return response.json();
  }
  
  /**
   * 새 소설 생성
   */
  export async function createNovel(
    title: string,
    coverColor?: string,
    fontStyle?: string
  ): Promise<CreateNovelResponse> {
    try {
      const result = await postToGAS<CreateNovelResponse>({
        action: 'createNovel',
        title,
        coverColor: coverColor || '#FFF5E1',
        fontStyle: fontStyle || 'serif',
      });
      return result;
    } catch (error) {
      console.error('createNovel 오류:', error);
      return { success: false, error: String(error) };
    }
  }
  
  /**
   * 문장 추가
   * author: 프론트에서 로그인 사용자 이름을 그대로 전달
   *         (Apps Script normalizeAuthor가 테오/꼼이로 표준화)
   */
  export async function addSentence(
    bookId: string,
    author: string,
    text: string,
    type?: NovelSentenceType
  ): Promise<AddSentenceResponse> {
    try {
      const result = await postToGAS<AddSentenceResponse>({
        action: 'addSentence',
        bookId,
        author,
        text,
        type: type || 'normal',
      });
      return result;
    } catch (error) {
      console.error('addSentence 오류:', error);
      return { success: false, error: String(error) };
    }
  }
  
  /**
   * 소설 완결 처리
   */
  export async function completeNovel(bookId: string): Promise<CompleteNovelResponse> {
    try {
      const result = await postToGAS<CompleteNovelResponse>({
        action: 'completeNovel',
        bookId,
      });
      return result;
    } catch (error) {
      console.error('completeNovel 오류:', error);
      return { success: false, error: String(error) };
    }
  }
  
  /**
   * 문장 좋아요
   */
  export async function likeSentence(
    bookId: string,
    order: number
  ): Promise<LikeSentenceResponse> {
    try {
      const result = await postToGAS<LikeSentenceResponse>({
        action: 'likeSentence',
        bookId,
        order,
      });
      return result;
    } catch (error) {
      console.error('likeSentence 오류:', error);
      return { success: false, error: String(error) };
    }
  }
  
  // -------------------- 유틸리티 --------------------
  
  /**
   * 현재 로그인 사용자의 아뜰리에 작성자 이름 반환
   * localStorage의 kkom-user 객체에서 이름을 읽어 매핑
   */
  export function getAtelierAuthorName(): string {
    if (typeof window === 'undefined') return '테오';
  
    try {
      const stored = localStorage.getItem('kkom-user');
      if (!stored) return '테오';
  
      const user = JSON.parse(stored);
      const name = String(user.이름 || '').trim();
  
      // 꼼 계열이면 꼼이, 그 외(우댕/테오 등)는 테오
      if (name === '꼼이' || name === '꼼' || name === '꼼2' || name === '꼬미') {
        return '꼼이';
      }
      return '테오';
    } catch {
      return '테오';
    }
  }
  
  /**
   * 소설의 다음 차례 작성자 판별
   * 마지막 문장 작성자의 반대편이 다음 차례
   */
  export function getNextTurnAuthor(novel: Novel): string {
    if (!novel.sentences || novel.sentences.length === 0) {
      return '테오'; // 첫 문장은 테오부터
    }
  
    const lastSentence = novel.sentences[novel.sentences.length - 1];
    return lastSentence.author === '테오' ? '꼼이' : '테오';
  }
  
  /**
   * 현재 사용자가 이 소설에 글을 쓸 차례인지 확인
   */
  export function isMyTurn(novel: Novel): boolean {
    const myName = getAtelierAuthorName();
    const nextTurn = getNextTurnAuthor(novel);
    return myName === nextTurn;
  }
  