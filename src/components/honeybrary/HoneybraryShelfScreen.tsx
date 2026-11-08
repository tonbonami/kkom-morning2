// src/components/honeybrary/HoneybraryShelfScreen.tsx
'use client';

import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { shelfOf, type BookVM } from '@/lib/honeybraryTypes';
import { HONEY } from '@/lib/honeybraryTheme';
import HoneybraryLogo from '@/components/honeybrary/HoneybraryLogo';
import { HoneyBookCard } from './HoneyBookCard';

export interface HoneybraryShelfScreenProps {
  books: BookVM[];
  loading: boolean;
  hasMore: boolean;
  loadingMore?: boolean;
  onLoadMore: () => void;
  firstHint: boolean;
  onCloseHint: () => void;
  onBack: () => void;
  onOpenBook: (bookId: string) => void;
  onAddBook: () => void;
}

export function HoneybraryShelfScreen({
  books,
  loading,
  hasMore,
  loadingMore = false,
  onLoadMore,
  firstHint,
  onCloseHint,
  onBack,
  onOpenBook,
  onAddBook,
}: HoneybraryShelfScreenProps) {
  const shouldReduceMotion = useReducedMotion();

  const shelves = useMemo(() => {
    const out = { now: [] as BookVM[], done: [] as BookVM[], shelved: [] as BookVM[] };
    for (const b of books) {
      out[shelfOf(b)].push(b);
    }
    return out;
  }, [books]);

  return (
    <div className="min-h-screen" style={{ background: HONEY.ground }}>
      <div className="relative max-w-md mx-auto pb-32">
        <header
          className="sticky top-0 z-20"
          style={{
            paddingTop: 'env(safe-area-inset-top)',
            background: HONEY.ground,
          }}
        >
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <motion.button
              whileTap={shouldReduceMotion ? undefined : { scale: 0.9 }}
              onClick={onBack}
              aria-label="홈으로"
              className="p-2 -ml-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
              style={{ color: HONEY.ink }}
            >
              <ArrowLeft size={24} />
            </motion.button>
            <div className="flex flex-col items-center">
              <HoneybraryLogo height={40} text={0.6} />
              <p className="text-[12px] font-medium mt-0.5" style={{ color: HONEY.faint }}>
                각자 읽고, 서로 한 줄씩
              </p>
            </div>
            <span className="w-10" />
          </div>
        </header>

        <main className="px-5 pt-3 flex flex-col gap-7">
          {firstHint && (
            <div
              className="flex items-start gap-2 rounded-2xl px-4 py-3.5 text-[12.5px] font-medium leading-relaxed"
              style={{ background: 'var(--sd-surface-2)', color: HONEY.muted }}
            >
              <div className="flex-1 break-keep flex flex-col gap-1">
                <p className="font-bold text-[13.5px]" style={{ color: HONEY.ink }}>
                  새로 생긴 허니브러리예요
                </p>
                <p>읽는 책을 놓고 생각이나 사진을 남기면, 상대가 그 아래 한 줄씩 이어 남길 수 있어요.</p>
                <p>다 읽으면 별점과 사진으로 감상도 남겨요. 둘만 봐요.</p>
                <p>진행은 각자 자기 것만 고칠 수 있고, 무엇을 해도 알림은 가지 않아요.</p>
              </div>
              <button
                onClick={onCloseHint}
                aria-label="안내 닫기"
                className="shrink-0 p-1.5 text-[14px] leading-none min-w-[32px] min-h-[32px] flex items-center justify-center"
                style={{ color: HONEY.faint }}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {loading ? (
            <p
              className="text-center py-20 text-[13.5px] font-medium"
              style={{ color: HONEY.faint }}
            >
              책장을 여는 중…
            </p>
          ) : books.length === 0 ? (
            <div className="flex flex-col items-center text-center py-16 px-4 gap-3">
              <HoneybraryLogo height={68} text={0.65} />
              <p className="text-[16px] font-bold mt-2" style={{ color: HONEY.ink }}>
                첫 책을 놓아 보세요
              </p>
              <p className="text-[13px] leading-relaxed break-keep" style={{ color: HONEY.faint }}>
                지금 읽는 책 하나면 돼요. 쪽수는 안 적어도 괜찮아요.
              </p>
            </div>
          ) : (
            <>
              <section>
                <h2 className="text-[15px] font-bold mb-3" style={{ color: HONEY.ink }}>
                  요즘 읽는 책
                </h2>
                {shelves.now.length === 0 ? (
                  <p className="text-[13px]" style={{ color: HONEY.faint }}>
                    지금 읽는 책이 없어요
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {shelves.now.map((b) => (
                      <HoneyBookCard
                        key={b.id}
                        book={b}
                        onClick={() => onOpenBook(b.id)}
                      />
                    ))}
                  </div>
                )}
              </section>

              {shelves.done.length > 0 && (
                <section>
                  <h2 className="text-[15px] font-bold mb-3" style={{ color: HONEY.ink }}>
                    다 읽은 책
                  </h2>
                  <div className="flex flex-col gap-3">
                    {shelves.done.map((b) => (
                      <HoneyBookCard
                        key={b.id}
                        book={b}
                        onClick={() => onOpenBook(b.id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {shelves.shelved.length > 0 && (
                <section>
                  <h2
                    className="text-[12px] font-bold tracking-wide mb-2 px-1"
                    style={{ color: HONEY.faint }}
                  >
                    책장에 둔 책
                  </h2>
                  <div className="flex flex-col gap-1.5">
                    {shelves.shelved.map((b) => (
                      <HoneyBookCard
                        key={b.id}
                        book={b}
                        compact
                        onClick={() => onOpenBook(b.id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {hasMore && (
                <div className="flex justify-center pt-2 pb-4">
                  <motion.button
                    whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
                    onClick={onLoadMore}
                    disabled={loadingMore}
                    className="px-5 py-2.5 rounded-full text-[13px] font-bold transition-opacity"
                    style={{ background: HONEY.accentSoft, color: HONEY.accentSoftInk }}
                  >
                    {loadingMore ? '불러오는 중…' : '더 보기'}
                  </motion.button>
                </div>
              )}
            </>
          )}
        </main>

        <div
          className="fixed bottom-0 inset-x-0 max-w-md mx-auto px-5 pointer-events-none z-30"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 14px)' }}
        >
          <motion.button
            whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
            onClick={onAddBook}
            className="pointer-events-auto w-full h-[52px] rounded-[18px] flex items-center justify-center gap-1.5 text-[15px] font-bold shadow-lg"
            style={{ background: HONEY.accent, color: HONEY.accentInk }}
          >
            <Plus size={18} strokeWidth={2.6} /> 책 놓기
          </motion.button>
        </div>
      </div>
    </div>
  );
}
