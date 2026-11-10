// src/components/honeybrary/HoneybraryHomeCard.tsx
'use client';

import React from 'react';
import { Lock } from 'lucide-react';
import { PEOPLE, type BookVM } from '@/lib/honeybraryTypes';
import { HONEY } from '@/lib/honeybraryTheme';
import HoneybraryLogo from '@/components/honeybrary/HoneybraryLogo';
import { HoneyBookCover } from './HoneyBookCover';
import { ReaderProgressLine } from './ReaderProgressLine';

export interface HoneybraryHomeCardProps {
  book?: BookVM;
  onOpen: () => void;
}

export function HoneybraryHomeCard({ book, onOpen }: HoneybraryHomeCardProps) {
  const activeReaders = book
    ? PEOPLE.filter((p) => book.readers[p] !== undefined)
    : [];

  return (
    <button
      onClick={onOpen}
      className="sd-card w-full h-full px-4 py-4 flex flex-col justify-between relative text-left active:scale-[.98] transition-transform min-h-[140px]"
      style={{ background: '#FAF5EE' }}
    >
      <div>
        <HoneybraryLogo height={56} text={0.65} />
      </div>

      {book ? (
        <div className="flex items-center gap-3 mt-3 pt-1">
          <HoneyBookCover title={book.title} src={book.coverThumb} width={34} rounded={6} />
          <div className="min-w-0 flex-1 flex flex-col justify-center gap-1">
            <div className="flex items-center gap-1 truncate">
              {book.visibility === 'private' && (
                <Lock size={13} className="shrink-0" style={{ color: HONEY.faint }} />
              )}
              <p className="text-[13.5px] font-bold truncate" style={{ color: HONEY.ink }}>
                {book.title}
              </p>
            </div>
            {activeReaders.map((p) => {
              const r = book.readers[p];
              if (!r) return null;
              return <ReaderProgressLine key={p} name={p} reading={r} compact />;
            })}
          </div>
        </div>
      ) : (
        <div className="mt-3 pt-1">
          <p className="text-[13px] font-medium" style={{ color: HONEY.faint }}>
            둘이 읽는 책을 놓고, 한 줄씩 남겨요
          </p>
        </div>
      )}
    </button>
  );
}
