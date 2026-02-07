'use client';

import { useState } from 'react';
import { Mail, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface DailyLetterProps {
  message: string;
  isLoading: boolean;
}

export default function DailyLetter({ message, isLoading }: DailyLetterProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleCardClick = () => {
    if (!isLoading && message) {
      setIsFlipped(!isFlipped);
    }
  };

  if (isLoading) {
    return (
      <div className="px-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="px-4">
      <div className="perspective w-full h-32" onClick={handleCardClick}>
        <div
          className={cn('relative w-full h-full card-3d', isFlipped && 'is-flipped', (isLoading || !message) ? 'cursor-default' : 'cursor-pointer')}
        >
          {/* Front of the card */}
          <div className="card-front w-full h-full bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl shadow-lg border border-emerald-200 flex flex-col items-center justify-center p-4">
            <div className="relative">
              <Mail className="w-14 h-14 text-emerald-400" />
              <Heart className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-6 h-6 text-white" fill="white" />
              <Heart className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-5 h-5 text-red-400" fill="currentColor" />
            </div>
            <p className="mt-2 text-emerald-700 font-semibold text-sm">오늘의 편지가 도착했어요!</p>
          </div>

          {/* Back of the card */}
          <div className="card-back w-full h-full bg-white rounded-2xl shadow-lg border-2 border-emerald-300 flex items-center justify-center p-6 overflow-y-auto">
            <p className="text-center text-gray-700 whitespace-pre-wrap font-medium leading-relaxed text-sm">
              {message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
