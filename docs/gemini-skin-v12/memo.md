## 만들 것: SkinMemoSlots.tsx (새 파일) — 아침·점심·저녁·밤 메모 + 칸마다 사진
꼼이 피부 일지의 하루 메모를 네 칸으로 나눈다(우댕 2026-10-24). 칸마다 글과 사진을 붙인다. 하루 기록 폼 맨 아래(저장 막대 위)에 들어간다.
```ts
type Slot = 'morning' | 'noon' | 'evening' | 'night';
export default function SkinMemoSlots(props: {
  memos: Record<Slot, string>;
  onChange: (slot: Slot, text: string) => void;
  photos: Record<Slot, { id: string; url: string; t: string | null }[]>;
  onAddPhotos: (slot: Slot, files: FileList) => void;
  onDeletePhoto: (id: string) => void;
  uploadingSlot: Slot | null;          // 그 칸에서 올리는 중
  nowSlot: Slot;                        // 지금 시각에 맞는 칸(처음에 펼쳐 둠)
  readOnly: boolean;                    // 보기 전용(우댕 폰) — 입력·추가·지우기 숨김
  legacyNote?: string;                  // 예전 한 칸 메모(있으면 맨 위에 「예전 메모」로 읽기만)
  legacyPhotos?: { id: string; url: string; t: string | null }[];  // 시간대 없는 예전 사진(있으면 「예전 사진」 줄)
})
```
- 카드 하나(sd-card) 안에 제목 「메모」 + 네 칸. 칸 이름: 아침(해 뜨는 아이콘) · 점심(해) · 저녁(해 지는) · 밤(달) — lucide-react 아이콘.
- 매일 30초 기록이 목표: 처음엔 `nowSlot` 칸만 펼쳐 두고, 나머지는 한 줄(이름 + 글 앞부분 미리보기 + 「사진 n」)로 접혀 있다가 누르면 펼침. 글이 있거나 사진이 있는 칸도 처음에 펼침.
- 펼친 칸: 글 입력칸(자리표시 「아침에 있었던 일, 피부 상태…」처럼 칸마다 다르게) + 그 아래 사진 줄(72px 정사각 썸네일 가로 스크롤 + 맨 끝 카메라 추가 칸, 올리는 중이면 빙글). 사진 누르면 전체 화면(라이트박스: 좌우 넘기기, 몇 번째/몇 장, 찍은 시각, 「사진 지우기」 → 한 번 더 확인). 라이트박스는 document.body로 createPortal(z 9999).
- 파일 고르기: `<input type="file" accept="image/*" multiple hidden>` 칸마다.
- readOnly: 입력칸 대신 글만, 카메라 칸·지우기 없음, 빈 칸은 「안 적음」.
- legacyNote가 있으면 칸들 위에 옅은 상자 「예전 메모」 + 글(여러 줄 그대로). legacyPhotos가 있으면 「예전 사진」 썸네일 줄(라이트박스 같이).
- 색은 공통 규칙대로 CSS 변수만. 아래 참고 코드(지금 하루 사진 칸)의 라이트박스 모양·문구를 이어 써도 좋다.

### 참고: 지금 SkinPhotoStrip.tsx(하루 사진 칸 — 이 칸은 없어지고 메모 칸으로 옮겨 간다)
```tsx
'use client';
// 제미나이 시안(2026-10-21, 우댕 전달) — 피부 일지 사진 칸. 값 그대로.
// Aside 검수 고침(2026-10-21): 빈 상태 안내가 nowrap이라 잘림 → 줄바꿈 허용.
// Aside 2차 고침(2026-10-21): 보기 전용(우댕 폰)인데 「추가」·카메라 칸·지우기가 살아 있어 파일 고르기 창이 열림 → readOnly면 숨김.
// 보기 전용 + 사진 0장이면 「이 날 올린 사진이 없어요」(빈 상자만 보이던 것).

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Plus, X, Trash2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface SkinPhotoStripProps {
  dateLabel: string;
  photos: { id: string; url: string; t: string | null }[];
  uploading: boolean;
  onAdd: (files: FileList) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
}

export default function SkinPhotoStrip(props: SkinPhotoStripProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 전체화면(라이트박스) 상태
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 스와이프를 위한 터치 상태
  const touchStartX = useRef<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      props.onAdd(e.target.files);
    }
    // 같은 파일 다시 선택 가능하도록 초기화
    e.target.value = '';
  };

  const formatTime = (iso: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
    setShowDeleteConfirm(false);
  };

  const goPrev = () => {
    if (lightboxIndex !== null && lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1);
      setShowDeleteConfirm(false);
    }
  };

  const goNext = () => {
    if (lightboxIndex !== null && lightboxIndex < props.photos.length - 1) {
      setLightboxIndex(lightboxIndex + 1);
      setShowDeleteConfirm(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (diff > 50) goNext(); // 왼쪽으로 스와이프 (다음 사진)
    else if (diff < -50) goPrev(); // 오른쪽으로 스와이프 (이전 사진)
  };

  // 라이트박스 렌더링 (포탈)
  const renderLightbox = () => {
    if (lightboxIndex === null || !mounted || typeof document === 'undefined') return null;
    const currentPhoto = props.photos[lightboxIndex];
    if (!currentPhoto) {
      closeLightbox();
      return null;
    }

    return createPortal(
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-black flex flex-col"
        >
          {/* 상단 헤더 */}
          <div className="absolute top-0 left-0 w-full flex items-start justify-between p-4 z-10 bg-gradient-to-b from-black/70 to-transparent">
            <div className="flex flex-col text-white">
              <span className="text-[16px] font-medium">
                {lightboxIndex + 1} / {props.photos.length}
              </span>
              {currentPhoto.t && (
                <span className="text-[14px] text-white/80 mt-1">
                  {formatTime(currentPhoto.t)}
                </span>
              )}
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={closeLightbox}
              className="p-2 text-white bg-black/30 rounded-full"
            >
              <X size={24} />
            </motion.button>
          </div>

          {/* 사진 영역 (스와이프 지원) */}
          <div
            className="flex-1 relative flex items-center justify-center w-full h-full"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {lightboxIndex > 0 && (
              <button onClick={goPrev} className="absolute left-4 p-3 text-white bg-black/40 rounded-full z-10 hidden sm:block">
                <ChevronLeft size={28} />
              </button>
            )}

            <img
              key={currentPhoto.id}
              src={currentPhoto.url}
              alt="피부 일지 기록"
              className="w-full h-full object-contain"
            />

            {lightboxIndex < props.photos.length - 1 && (
              <button onClick={goNext} className="absolute right-4 p-3 text-white bg-black/40 rounded-full z-10 hidden sm:block">
                <ChevronRight size={28} />
              </button>
            )}
          </div>

          {/* 하단 제어 영역 */}
          <div className="absolute bottom-0 left-0 w-full p-6 flex justify-center z-10 bg-gradient-to-t from-black/80 to-transparent pb-8">
            {props.readOnly ? null : showDeleteConfirm ? (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex flex-col items-center gap-4 bg-gray-900/90 px-6 py-4 rounded-2xl"
              >
                <span className="text-[16px] text-white font-medium">사진을 지울까요?</span>
                <div className="flex gap-3">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-5 py-2.5 rounded-xl bg-gray-700 text-white text-[14px]"
                  >
                    취소
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      props.onDelete(currentPhoto.id);
                      closeLightbox();
                    }}
                    className="px-5 py-2.5 rounded-xl text-white text-[14px] font-medium"
                    style={{ backgroundColor: 'var(--sd-crit)' }}
                  >
                    지우기
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gray-900/60 backdrop-blur-sm"
                style={{ color: 'var(--sd-crit)' }}
              >
                <Trash2 size={20} />
                <span className="text-[15px] font-medium">사진 지우기</span>
              </motion.button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>,
      document.body
    );
  };

  return (
    <div className="sd-card p-5 flex flex-col gap-4">
      {/* 숨겨진 파일 인풋 */}
      <input
        type="file"
        hidden
        accept="image/*"
        multiple
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      {/* 카드 상단 */}
      <div className="flex justify-between items-center">
        <div className="flex items-baseline gap-2">
          <h2 className="text-lg font-bold" style={{ color: 'var(--sd-ink)' }}>
            사진
          </h2>
          <span className="text-[14px]" style={{ color: 'var(--sd-muted)' }}>
            {props.dateLabel}
          </span>
        </div>
        {!props.readOnly && <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[14px] font-medium"
          style={{ backgroundColor: 'var(--sd-surface-2)', color: 'var(--sd-ink)' }}
        >
          <Plus size={16} /> 추가
        </motion.button>}
      </div>

      {/* 사진 가로 스크롤 영역 */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">

        {props.photos.map((p, idx) => (
          <motion.button
            key={p.id}
            whileTap={{ scale: 0.96 }}
            onClick={() => setLightboxIndex(idx)}
            className="shrink-0 w-[88px] h-[88px] rounded-xl overflow-hidden relative shadow-sm"
            style={{ border: '1px solid var(--sd-line)' }}
          >
            <img
              src={p.url}
              alt="피부 일지 썸네일"
              className="w-full h-full object-cover"
            />
          </motion.button>
        ))}

        {/* 추가/업로드 버튼 (맨 끝 고정) */}
        {!props.readOnly && <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => !props.uploading && fileInputRef.current?.click()}
          className="shrink-0 w-[88px] h-[88px] rounded-xl flex flex-col items-center justify-center gap-1"
          style={{
            backgroundColor: 'var(--sd-surface-2)',
            color: props.uploading ? 'var(--sd-faint)' : 'var(--sd-muted)',
            border: '1px solid var(--sd-line)'
          }}
          disabled={props.uploading}
        >
          {props.uploading ? (
            <Loader2 className="animate-spin" size={24} style={{ color: 'var(--sd-rel)' }} />
          ) : (
            <Camera size={24} />
          )}
        </motion.button>}

        {/* 사진이 1장도 없을 때 안내 문구 */}
        {/* 보기 전용인데 사진이 없으면 빈 상자만 보여 「안 올린 건지 안 보이는 건지」 헷갈렸다(우댕) → 한 줄 */}
        {props.photos.length === 0 && props.readOnly && (
          <span className="text-[14px] ml-1 leading-snug" style={{ color: 'var(--sd-faint)' }}>
            이 날 올린 사진이 없어요
          </span>
        )}
        {props.photos.length === 0 && !props.uploading && !props.readOnly && (
          <span
            className="text-[14px] ml-1 flex-1 min-w-[150px] leading-snug"
            style={{ color: 'var(--sd-faint)' }}
          >
            같은 자리를 같은 구도로 찍어 두면 비교하기 좋아요
          </span>
        )}
      </div>

      {/* 포탈로 띄워지는 라이트박스 */}
      {renderLightbox()}
    </div>
  );
}

```
