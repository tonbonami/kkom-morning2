// src/lib/novelApi.ts
'use client';

import type {
  Novel,
  CoverImage,
  NovelDataResponse,
  CreateNovelResponse,
  AddSentenceResponse,
  CompleteNovelResponse,
  LikeSentenceResponse,
} from '@/types';

// ─────────────────────────────────────────────
// 환경변수에서 API URL 가져오기 (api.ts와 동일 패턴)
// ─────────────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL;

// ─────────────────────────────────────────────
// 작성자 이름 매핑
// ─────────────────────────────────────────────
const AUTHOR_MAP_TEO = ['우댕', '테오', 'Teo', 'teo'];
const AUTHOR_MAP_KKOMI = ['꼼이', '꼼', '꼼2', '꼬미'];

/**
 * localStorage에 저장된 사용자 이름을 아뜰리에 작성자명으로 변환
 */
export function getAtelierAuthorName(): string {
  if (typeof window === 'undefined') return '꼬미';

  try {
    const stored = localStorage.getItem('kkom-user');
    if (!stored) return '꼬미';

    const user = JSON.parse(stored);
    const name = (user?.name || '').trim();

    if (AUTHOR_MAP_TEO.includes(name)) return '테오';
    if (AUTHOR_MAP_KKOMI.includes(name)) return '꼼이';

    return '꼬미';
  } catch {
    return '꼬미';
  }
}

/**
 * 소설의 마지막 문장 작성자를 기반으로 다음 차례 작성자를 반환
 */
export function getNextTurnAuthor(novel: Novel): string {
  if (!novel.sentences || novel.sentences.length === 0) return '테오';

  const lastSentence = novel.sentences[novel.sentences.length - 1];
  return lastSentence.author === '테오' ? '꼼이' : '테오';
}

/**
 * 현재 로그인한 사용자가 이 소설에 문장을 쓸 차례인지 확인
 */
export function isMyTurn(novel: Novel): boolean {
  const myName = getAtelierAuthorName();
  const nextAuthor = getNextTurnAuthor(novel);
  return myName === nextAuthor;
}

/**
 * 현재 사용자가 마지막 문장의 작성자인지 확인
 */
export function isLastSentenceMine(novel: Novel): boolean {
  if (!novel.sentences || novel.sentences.length === 0) return false;
  const lastSentence = novel.sentences[novel.sentences.length - 1];
  const myName = getAtelierAuthorName();
  return lastSentence.author === myName;
}

// ─────────────────────────────────────────────
// GAS 통신 헬퍼
// ─────────────────────────────────────────────

async function postToGAS<T>(body: Record<string, unknown>): Promise<T> {
  if (!API_URL) {
    throw new Error('[novelApi] NEXT_PUBLIC_APPS_SCRIPT_URL 환경변수가 설정되지 않았습니다.');
  }

  console.log('[novelApi] POST →', body.action, body);

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`[novelApi] POST 실패: ${res.status} ${res.statusText}`);
  }

  const text = await res.text();

  try {
    const data = JSON.parse(text) as T;
    console.log('[novelApi] POST 응답 ←', body.action, data);
    return data;
  } catch {
    console.error('[novelApi] JSON 파싱 실패:', text.slice(0, 200));
    throw new Error('[novelApi] 응답이 JSON 형식이 아닙니다.');
  }
}

// ─────────────────────────────────────────────
// API 함수들
// ─────────────────────────────────────────────

/**
 * 모든 소설 데이터 조회 (GET)
 */
export async function getNovelData(): Promise<NovelDataResponse> {
  if (!API_URL) {
    throw new Error('[novelApi] NEXT_PUBLIC_APPS_SCRIPT_URL 환경변수가 설정되지 않았습니다.');
  }

  const url = `${API_URL}?action=getNovelData`;
  console.log('[novelApi] GET →', url);

  const res = await fetch(url, { cache: 'no-store' });

  if (!res.ok) {
    throw new Error(`[novelApi] GET 실패: ${res.status} ${res.statusText}`);
  }

  const text = await res.text();

  try {
    const data = JSON.parse(text);
    console.log('[novelApi] GET 응답 ←', {
      activeNovels: data.activeNovels?.length ?? 0,
      completedNovels: data.completedNovels?.length ?? 0,
      coverLibrary: data.coverLibrary?.length ?? 0,
    });

    const result: NovelDataResponse = {
      activeNovels: data.activeNovels || [],
      completedNovels: data.completedNovels || [],
      coverLibrary: data.coverLibrary || [],
    };

    return result;
  } catch {
    console.error('[novelApi] JSON 파싱 실패:', text.slice(0, 200));
    throw new Error('[novelApi] 응답이 JSON 형식이 아닙니다.');
  }
}

/**
 * 새 소설 생성 (POST)
 */
export async function createNovel(
  title: string,
  coverColor?: string,
  fontStyle?: string
): Promise<CreateNovelResponse> {
  return postToGAS<CreateNovelResponse>({
    action: 'createNovel',
    title,
    coverColor: coverColor || '#FFF5E1',
    fontStyle: fontStyle || 'sans-serif',
  });
}

/**
 * 소설에 새 문장 추가 (POST)
 */
export async function addSentence(
  bookId: string,
  author: string,
  text: string,
  type: 'normal' | 'chapter' | 'paragraph' = 'normal'
): Promise<AddSentenceResponse> {
  return postToGAS<AddSentenceResponse>({
    action: 'addSentence',
    bookId,
    author,
    text,
    type,
  });
}

/**
 * 마지막 문장 수정 (POST)
 * - 본인이 작성한 마지막 문장만 수정 가능
 */
export async function editSentence(
  bookId: string,
  order: number,
  newText: string
): Promise<{ success: boolean; error?: string }> {
  return postToGAS<{ success: boolean; error?: string }>({
    action: 'editSentence',
    bookId,
    order,
    newText,
  });
}

/**
 * 마지막 문장 삭제 (POST)
 * - 본인이 작성한 마지막 문장만 삭제 가능
 */
export async function deleteSentence(
  bookId: string,
  order: number
): Promise<{ success: boolean; error?: string }> {
  return postToGAS<{ success: boolean; error?: string }>({
    action: 'deleteSentence',
    bookId,
    order,
  });
}

/**
 * 소설 완결 처리 (POST)
 */
export async function completeNovel(bookId: string): Promise<CompleteNovelResponse> {
  return postToGAS<CompleteNovelResponse>({
    action: 'completeNovel',
    bookId,
  });
}

/**
 * 문장 좋아요 (POST)
 */
export async function likeSentence(
  bookId: string,
  order: number
): Promise<LikeSentenceResponse> {
  return postToGAS<LikeSentenceResponse>({
    action: 'likeSentence',
    bookId,
    order,
  });
}
