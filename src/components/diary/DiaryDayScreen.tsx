// src/components/diary/DiaryDayScreen.tsx
'use client';

import React, { useRef, useState } from 'react';
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
} from 'lucide-react';
import {
  Person,
  DiaryPaperTheme,
  DiaryPageVM,
  DiaryChipVM,
  DiaryMaterialVM,
  DiaryItemAction,
} from '@/lib/diaryTypes';
import { DiaryPaper } from './DiaryPaper';
import { DiaryObjectToolbar } from './DiaryObjectToolbar';
import { DiaryMaterialTray } from './DiaryMaterialTray';

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
}: DiaryDayScreenProps): React.JSX.Element {
  const [showMenu, setShowMenu] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditable = me === pageOwner;

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
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--sd-ink)] active:scale-95"
        >
          <ChevronLeft className="w-6 h-6" />
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
            {pageOwner}의 장 — 보기만 할 수 있어요
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
        />
      </main>

      {/* 하단 제어부 (내 장일 때만 꾸미기 단추 노출) */}
      <footer className="px-4 pb-3 pt-1 space-y-2 z-30">
        {isEditable && isToday && (
          <DiaryMaterialTray materials={materials} onAdd={onAddMaterial} />
        )}

        {isEditable && (
          <>
            {selectedItemId ? (
              <DiaryObjectToolbar
                onAction={onItemAction}
                onDone={() => onSelectItem(null)}
              />
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

                <div className="bg-[var(--sd-card-solid)] border border-[var(--sd-line)] rounded-2xl shadow-sm px-4 py-1 flex items-center justify-around">
                  <button
                    type="button"
                    onClick={onOpenAssets}
                    className="min-w-[44px] min-h-[44px] flex flex-col items-center justify-center text-[var(--sd-ink)] active:scale-95"
                  >
                    <Smile className="w-5 h-5" />
                    <span className="text-[10px] mt-0.5">스티커</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="min-w-[44px] min-h-[44px] flex flex-col items-center justify-center text-[var(--sd-ink)] active:scale-95"
                  >
                    <ImageIcon className="w-5 h-5" />
                    <span className="text-[10px] mt-0.5">사진</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />

                  <button
                    type="button"
                    onClick={() => setShowThemePicker((p) => !p)}
                    className="min-w-[44px] min-h-[44px] flex flex-col items-center justify-center text-[var(--sd-ink)] active:scale-95"
                  >
                    <Scroll className="w-5 h-5" />
                    <span className="text-[10px] mt-0.5">종이</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectItem(null)}
                    className="min-w-[44px] min-h-[44px] flex flex-col items-center justify-center text-[var(--sd-ink)] active:scale-95"
                  >
                    <PenLine className="w-5 h-5" />
                    <span className="text-[10px] mt-0.5">글쓰기</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </footer>
    </div>
  );
}
