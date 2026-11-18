// src/components/diary/DiaryDayScreen.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Smile,
  Image as ImageIcon,
  Scroll,
  PenLine,
  Calendar,
  Sparkles,
  Type,
  X,
  Check,
} from 'lucide-react';
import {
  Person,
  DiaryPaperTheme,
  DiaryPageVM,
  DiaryChipVM,
  DiaryMaterialVM,
  DiaryItemAction,
  DiaryItemVM,
  DiaryPhotoFrame,
  DIARY_PHOTO_FRAMES,
  DIARY_LIMITS,
} from '@/lib/diaryTypes';
import { DiaryPaper } from './DiaryPaper';
import { DiaryObjectToolbar } from './DiaryObjectToolbar';
import { DiaryMaterialTray } from './DiaryMaterialTray';
import { DiaryNotes } from './DiaryNotes';
import { DiaryPhotoSheet } from './DiaryPhotoSheet';
import type { AppPhotoVM, DiaryNoteVM } from '@/lib/diary';

export interface DiaryDayScreenProps {
  me: Person;
  pageOwner: Person;
  page: DiaryPageVM;
  dateLabel: string;
  chips: DiaryChipVM[];
  materials: DiaryMaterialVM[];
  hasPage: Record<Person, boolean>;
  saveState: 'saved' | 'saving' | 'offline';
  isToday: boolean;
  selectedItemId: string | null;
  onBack: () => void;
  onPrevDate: () => void;
  onNextDate: () => void;
  onGoToday: () => void;
  onOpenMonth: () => void;
  onChangeOwner: (p: Person) => void;
  onSelectItem: (id: string | null) => void;
  onMoveItem: (id: string, x: number, y: number) => void;
  onItemAction: (a: DiaryItemAction) => void;
  onTextChange: (text: string) => void;
  onOpenAssets: () => void;
  onPickPhotos: (files: File[]) => void;
  onChangeTheme: (t: DiaryPaperTheme) => void;
  onAddMaterial: (m: DiaryMaterialVM) => void;
  onOpenSpecialDates: () => void;
  onClearQuestion?: () => void;
  /** 이 장의 ♥·한마디(DiaryNotes) */
  notes?: DiaryNoteVM[];
  pageExists?: boolean;
  onToggleHeart?: () => void;
  onSendNote?: (text: string) => Promise<boolean>;
  onDeleteNote?: (id: string) => void;
  /** 사진(GPT 회의 2026-11-18): 지금 몇 장인지 · 꼼톡·추억에서 고른 것 · 고른 사진의 모양·글귀 */
  photoCount: number;
  selectedItem?: DiaryItemVM | null;
  onPickAppPhotos: (photos: AppPhotoVM[]) => void;
  onPhotoFull: () => void;
  onPhotoFrame: (f: DiaryPhotoFrame) => void;
  onPhotoCaption: (text: string) => void;
  /** 아직 오지 않은 날 — 내 장이어도 쓰지 못한다(꼼이가 일기 쓰다 다음 날 장으로 밀려 같은 글이 생긴 일, 2026-11-17) */
  future?: boolean;
  /** ← 옆 글자 — 달력에서 왔으면 「달력」(누르면 달력으로) */
  backLabel?: string;
}

export function DiaryDayScreen({
  me,
  pageOwner,
  page,
  dateLabel,
  chips,
  materials,
  hasPage,
  saveState,
  isToday,
  selectedItemId,
  onBack,
  onPrevDate,
  onNextDate,
  onGoToday,
  onOpenMonth,
  onChangeOwner,
  onSelectItem,
  onMoveItem,
  onItemAction,
  onTextChange,
  onOpenAssets,
  onPickPhotos,
  onChangeTheme,
  onAddMaterial,
  onOpenSpecialDates,
  onClearQuestion,
  notes,
  pageExists,
  onToggleHeart,
  onSendNote,
  onDeleteNote,
  photoCount,
  selectedItem,
  onPickAppPhotos,
  onPhotoFull,
  onPhotoFrame,
  onPhotoCaption,
  future = false,
  backLabel,
}: DiaryDayScreenProps): React.JSX.Element {
  const [showMenu, setShowMenu] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [photoSheet, setPhotoSheet] = useState(false);
  const [captionOpen, setCaptionOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const isEditable = me === pageOwner && !future;
  const photoRoom = Math.max(0, DIARY_LIMITS.photos - photoCount);
  const selectedPhoto = selectedItem && selectedItem.type === 'photo' ? selectedItem : null;
  // 사진 넣기: 다 찼으면 서랍 대신 안내(GPT: 단추는 감추지 않는다 — 기능이 사라진 것처럼 보이지 않게)
  const openPhotos = () => { setShowThemePicker(false); if (photoRoom <= 0) onPhotoFull(); else setPhotoSheet(true); };
  useEffect(() => { if (!selectedPhoto) setCaptionOpen(false); }, [selectedPhoto]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onPickPhotos(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const themes: { id: DiaryPaperTheme; label: string }[] = [
    { id: 'cream', label: '크림' },
    { id: 'plain', label: '무지' },
    { id: 'lined', label: '줄' },
    { id: 'grid', label: '모눈' },
  ];

  return (
    <div
      className="relative w-full max-w-md mx-auto min-h-screen bg-[#FCFAF7] flex flex-col justify-between select-none"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* 상단 헤더 */}
      <header className="px-4 py-2 flex items-center justify-between border-b border-[var(--sd-line)] bg-[#FCFAF7] z-30">
        <button
          type="button"
          onClick={onBack}
          aria-label={backLabel ? `${backLabel}로 돌아가기` : '다이어리 나가기'}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--sd-ink)] active:scale-95"
        >
          <ChevronLeft className="w-6 h-6" />
          {backLabel && <span className="text-[13px] font-medium -ml-0.5 pr-1">{backLabel}</span>}
        </button>

        {/* 날짜 및 월 선택 */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrevDate}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--sd-muted)] active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onOpenMonth}
            className="min-h-[44px] px-2 font-['Dongle'] text-3xl text-[var(--sd-ink)] font-normal active:opacity-70"
          >
            {dateLabel}
          </button>
          <button
            type="button"
            onClick={onNextDate}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--sd-muted)] active:scale-95"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* 저장 상태 및 메뉴 */}
        <div className="relative flex items-center gap-1">
          <span className="text-[10px] text-[var(--sd-faint)]">
            {saveState === 'saved' && '저장됨'}
            {saveState === 'saving' && '저장 중…'}
            {saveState === 'offline' && '폰에 보관 중'}
          </span>
          <button
            type="button"
            onClick={() => setShowMenu((prev) => !prev)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--sd-muted)] active:scale-95"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-11 w-32 bg-[var(--sd-card-solid)] border border-[var(--sd-line)] rounded-xl shadow-lg py-1 z-50">
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  onGoToday();
                }}
                className="w-full min-h-[44px] px-3 text-left text-xs text-[var(--sd-ink)] active:bg-[var(--sd-surface-2)] flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 text-[var(--sd-muted)]" />
                오늘로 가기
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  onOpenSpecialDates();
                }}
                className="w-full min-h-[44px] px-3 text-left text-xs text-[var(--sd-ink)] active:bg-[var(--sd-surface-2)] flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-[var(--sd-rel)]" />
                기념일 관리
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 우댕 | 꼼이 소유자 탭 */}
      <div className="px-4 pt-2 pb-1 flex flex-col items-center">
        <div className="inline-flex p-1 rounded-full bg-[var(--sd-surface-2)] border border-[var(--sd-line)]">
          {(['우댕', '꼼이'] as Person[]).map((person) => {
            const isOwner = pageOwner === person;
            return (
              <button
                key={person}
                type="button"
                onClick={() => onChangeOwner(person)}
                className={`min-h-[44px] px-6 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  isOwner
                    ? 'bg-[var(--sd-card-solid)] text-[var(--sd-ink)] shadow-sm'
                    : 'text-[var(--sd-muted)]'
                }`}
              >
                <span>{person}</span>
                {hasPage[person] && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--sd-rel)]" />
                )}
              </button>
            );
          })}
        </div>

        {!isEditable && (
          <p className="text-[11px] text-[var(--sd-faint)] mt-1">
            {me === pageOwner
              ? '아직 오지 않은 날이에요 — 그날이 되면 쓸 수 있어요'
              : pageExists ? `${pageOwner}의 장 — 아래에 마음·한마디를 남길 수 있어요` : `${pageOwner}의 장 — 보기만 할 수 있어요`}
          </p>
        )}
      </div>

      {/* 가운데 종이 영역 */}
      <main className="flex-1 px-4 py-2 flex items-center justify-center">
        <DiaryPaper
          page={page}
          dateLabel={dateLabel}
          chips={chips}
          editable={isEditable}
          selectedItemId={selectedItemId}
          onSelectItem={onSelectItem}
          onMoveItem={onMoveItem}
          onTextChange={onTextChange}
          onSwipe={(dir) => (dir === 'prev' ? onPrevDate() : onNextDate())}
          onClearQuestion={isEditable ? onClearQuestion : undefined}
          onEmptyPhoto={isEditable && isToday ? openPhotos : undefined}
          textRef={textRef}
        />
      </main>

      {/* 하단 제어부 (내 장일 때만 꾸미기 단추 노출) */}
      <footer className="px-4 pb-3 pt-1 space-y-2 z-30">
        {notes && onToggleHeart && onSendNote && onDeleteNote && !selectedItemId && (
          <DiaryNotes
            me={me} pageOwner={pageOwner} notes={notes} pageExists={!!pageExists}
            onToggleHeart={onToggleHeart} onSend={onSendNote} onDelete={onDeleteNote}
          />
        )}

        {isEditable && isToday && !selectedItemId && (
          <DiaryMaterialTray materials={materials} onAdd={onAddMaterial} />
        )}

        {isEditable && (
          <>
            {selectedItemId ? (
              <>
                {selectedPhoto && (
                  <PhotoStyleRow
                    item={selectedPhoto}
                    onFrame={onPhotoFrame}
                    onCaption={() => setCaptionOpen(true)}
                  />
                )}
                <DiaryObjectToolbar
                  onAction={onItemAction}
                  onDone={() => onSelectItem(null)}
                />
              </>
            ) : (
              <div className="relative">
                {showThemePicker && (
                  <div className="absolute bottom-16 inset-x-0 mx-auto w-fit p-1 bg-[var(--sd-card-solid)] border border-[var(--sd-line)] rounded-full shadow-lg flex gap-1 z-40">
                    {themes.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          onChangeTheme(t.id);
                          setShowThemePicker(false);
                        }}
                        className={`min-h-[44px] px-3.5 rounded-full text-xs font-medium ${
                          page.theme === t.id
                            ? 'bg-[var(--sd-surface-2)] text-[var(--sd-ink)]'
                            : 'text-[var(--sd-muted)]'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* 순서·이름(GPT 회의 2026-11-18): 사진이 맨 앞 · 「종이」→「배경」 · 글씨 10→12px · 높이 56 */}
                <div className="bg-[var(--sd-card-solid)] border border-[var(--sd-line)] rounded-2xl shadow-sm px-1 grid grid-cols-4">
                  <button
                    type="button"
                    onClick={openPhotos}
                    className="min-h-[56px] flex flex-col items-center justify-center gap-[3px] rounded-xl text-[var(--sd-ink)] active:bg-[var(--sd-surface-2)]"
                  >
                    <ImageIcon className="w-[21px] h-[21px] stroke-[1.8]" />
                    <span className="text-[12px] font-medium leading-none">{photoCount > 0 ? `사진 ${photoCount}/${DIARY_LIMITS.photos}` : '사진 넣기'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setShowThemePicker(false); onOpenAssets(); }}
                    className="min-h-[56px] flex flex-col items-center justify-center gap-[3px] rounded-xl text-[var(--sd-ink)] active:bg-[var(--sd-surface-2)]"
                  >
                    <Smile className="w-[21px] h-[21px] stroke-[1.8]" />
                    <span className="text-[12px] font-medium leading-none">스티커</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setShowThemePicker(false); onSelectItem(null); textRef.current?.focus(); }}
                    className="min-h-[56px] flex flex-col items-center justify-center gap-[3px] rounded-xl text-[var(--sd-ink)] active:bg-[var(--sd-surface-2)]"
                  >
                    <PenLine className="w-[21px] h-[21px] stroke-[1.8]" />
                    <span className="text-[12px] font-medium leading-none">글쓰기</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowThemePicker((p) => !p)}
                    className={`min-h-[56px] flex flex-col items-center justify-center gap-[3px] rounded-xl text-[var(--sd-ink)] active:bg-[var(--sd-surface-2)] ${showThemePicker ? 'bg-[var(--sd-surface-2)]' : ''}`}
                  >
                    <Scroll className="w-[21px] h-[21px] stroke-[1.8]" />
                    <span className="text-[12px] font-medium leading-none">배경</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </footer>

      {/* 사진 앱 고르기 — 단추 줄 밖에 둔다(사진 서랍의 첫 칸에서도 누른다) */}
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoSelect} />
      <DiaryPhotoSheet
        open={photoSheet && isEditable}
        room={photoRoom}
        limit={DIARY_LIMITS.photos}
        onPickLibrary={() => { setPhotoSheet(false); fileInputRef.current?.click(); }}
        onPickApp={(list) => { setPhotoSheet(false); onPickAppPhotos(list); }}
        onClose={() => setPhotoSheet(false)}
      />
      {captionOpen && selectedPhoto && (
        <PhotoCaptionSheet
          item={selectedPhoto}
          onSave={(t) => { onPhotoCaption(t); setCaptionOpen(false); }}
          onClose={() => setCaptionOpen(false)}
        />
      )}
    </div>
  );
}

/** 고른 사진의 모양 네 가지 + 글귀 — 작은 미리보기는 그 사진으로 그린다. */
function PhotoStyleRow({ item, onFrame, onCaption }: { item: DiaryItemVM; onFrame: (f: DiaryPhotoFrame) => void; onCaption: () => void }): React.JSX.Element {
  const cur = item.frame ?? 'white';
  const thumb = (f: DiaryPhotoFrame) => {
    const img = item.src ? <img src={item.src} alt="" draggable={false} className="w-full h-full object-cover" /> : null;
    if (f === 'circle') return <span className="block w-[26px] h-[26px] rounded-full overflow-hidden bg-[var(--sd-surface-2)]">{img}</span>;
    if (f === 'none') return <span className="block w-[26px] h-[26px] rounded-[3px] overflow-hidden bg-[var(--sd-surface-2)]">{img}</span>;
    if (f === 'polaroid') return <span className="block w-[24px] h-[29px] bg-white border border-[var(--sd-line)] p-[2px] pb-[7px] shadow-sm"><span className="block w-full h-full overflow-hidden bg-[var(--sd-surface-2)]">{img}</span></span>;
    return <span className="block w-[26px] h-[26px] bg-white border border-[var(--sd-line)] p-[2.5px] shadow-sm"><span className="block w-full h-full overflow-hidden bg-[var(--sd-surface-2)]">{img}</span></span>;
  };
  return (
    <div className="w-full bg-[var(--sd-card-solid)] border border-[var(--sd-line)] rounded-2xl shadow-sm px-1.5 py-1 grid grid-cols-5" style={{ touchAction: 'none' }}>
      {DIARY_PHOTO_FRAMES.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => onFrame(f.id)}
          aria-pressed={cur === f.id}
          className={`min-w-0 min-h-[56px] flex flex-col items-center justify-center gap-1 rounded-xl ${
            cur === f.id ? 'bg-[var(--sd-rel-soft)] text-[var(--sd-rel)]' : 'text-[var(--sd-ink)] active:bg-[var(--sd-surface-2)]'
          }`}
        >
          <span className="h-[30px] flex items-center justify-center">{thumb(f.id)}</span>
          <span className="text-[11px] font-medium leading-none whitespace-nowrap">{f.label}</span>
        </button>
      ))}
      <button
        type="button"
        onClick={onCaption}
        className="min-w-0 min-h-[56px] flex flex-col items-center justify-center gap-1 rounded-xl text-[var(--sd-ink)] active:bg-[var(--sd-surface-2)]"
      >
        <span className="h-[30px] flex items-center justify-center"><Type className="w-5 h-5 stroke-[1.8]" /></span>
        <span className="text-[11px] font-medium leading-none">{item.caption ? '글귀 고치기' : '글귀'}</span>
      </button>
    </div>
  );
}

/**
 * 사진 아래 글귀(40자) — 화면 **위쪽**에 띄운다(아래에 두면 폰 키보드가 덮는다).
 * 없음·동그라미 모양에 글귀를 넣으면 보이게 폴라로이드로 바꾼다(DiaryApp setPhotoCaption).
 */
function PhotoCaptionSheet({ item, onSave, onClose }: { item: DiaryItemVM; onSave: (t: string) => void; onClose: () => void }): React.JSX.Element {
  const [text, setText] = useState(item.caption ?? '');
  const max = DIARY_LIMITS.caption;
  return (
    <div onClick={onClose} className="fixed inset-0 z-[70] flex items-start justify-center bg-black/25 px-4" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => { e.preventDefault(); onSave(text.trim().slice(0, max)); }}
        className="w-full max-w-md bg-[var(--sd-card-solid)] border border-[var(--sd-line)] rounded-3xl shadow-2xl p-4 flex flex-col gap-3"
      >
        <div className="flex items-center justify-between">
          <span className="font-['Dongle'] text-2xl leading-none text-[var(--sd-ink)]">사진 아래 글귀</span>
          <button type="button" onClick={onClose} aria-label="닫기" className="min-w-[44px] min-h-[44px] -m-2 flex items-center justify-center text-[var(--sd-muted)]">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="relative">
          <input
            type="text"
            value={text}
            maxLength={max}
            onChange={(e) => setText(e.target.value)}
            placeholder="예: 첫눈 오던 날"
            autoFocus
            enterKeyHint="done"
            className="w-full min-h-[48px] px-3.5 pr-14 rounded-xl bg-[var(--sd-surface-2)] border border-[var(--sd-line)] text-[16px] text-[var(--sd-ink)] outline-none"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--sd-faint)]">{text.length}/{max}</span>
        </div>
        <p className="text-[12px] text-[var(--sd-muted)] -mt-1">기본·폴라로이드 모양에서 사진 아래에 보여요</p>
        <div className="flex gap-2">
          {item.caption && (
            <button type="button" onClick={() => onSave('')} className="min-h-[44px] px-4 rounded-xl border border-[var(--sd-line)] text-sm text-[var(--sd-muted)] active:bg-[var(--sd-surface-2)]">
              글귀 빼기
            </button>
          )}
          <button type="submit" className="flex-1 min-h-[44px] rounded-xl bg-[var(--sd-ink)] text-white text-sm font-medium flex items-center justify-center gap-1 active:opacity-90">
            <Check className="w-4 h-4" />
            넣기
          </button>
        </div>
      </form>
    </div>
  );
}
