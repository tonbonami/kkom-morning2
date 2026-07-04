import { useEffect, useState } from 'react';

// Claude 참고(코드리뷰 #6): URL.createObjectURL을 JSX 안에서 직접 부르면
// 리렌더(타이핑 키 하나)마다 새 blob URL이 생기고 해제가 안 돼 메모리 누수.
// 파일 바뀔 때만 1회 생성 + 언마운트/교체 시 revoke.

export function useObjectUrl(file: File | Blob | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) { setUrl(null); return; }
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return url;
}

// 여러 장 — files 배열 참조가 바뀔 때만 재생성 (add/remove 시). 언마운트 시 전부 revoke.
export function useObjectUrls(files: Array<File | Blob>): string[] {
  const [urls, setUrls] = useState<string[]>([]);
  useEffect(() => {
    const us = files.map((f) => URL.createObjectURL(f));
    setUrls(us);
    return () => us.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);
  return urls;
}
