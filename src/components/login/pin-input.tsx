'use client';

import { useState, useRef, useEffect, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { authenticateUser } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle } from 'lucide-react';

const PIN_LENGTH = 4;

export default function PinInput() {
  const [pin, setPin] = useState<string[]>(Array(PIN_LENGTH).fill(''));
  const [isError, setIsError] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleSubmit = useCallback((fullPin: string) => {
    startTransition(async () => {
      setIsError(false);
      const user = await authenticateUser(fullPin);
      if (user) {
        localStorage.setItem('kkom-user', JSON.stringify(user));
        toast({
          title: `환영해요, ${user.name}님!`,
          description: "오늘도 좋은 하루 보내세요.",
        });
        router.push('/');
      } else {
        setPin(Array(PIN_LENGTH).fill(''));
        setIsError(true);
        toast({
          variant: "destructive",
          title: "인증 실패",
          description: "코드가 맞지 않아요. 다시 시도해주세요.",
        });
        setTimeout(() => setIsError(false), 500);
        inputRefs.current[0]?.focus();
      }
    });
  }, [router, toast]);

  useEffect(() => {
    const fullPin = pin.join('');
    if (fullPin.length === PIN_LENGTH) {
      handleSubmit(fullPin);
    }
  }, [pin, handleSubmit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const { value } = e.target;
    if (/[^0-9]/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    if (value && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className={cn("flex flex-col items-center", isError && "shake")}>
      <div className="flex space-x-3 sm:space-x-4">
        {pin.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            disabled={isPending}
            className={cn(
              "w-16 h-20 rounded-xl border-2 text-center text-3xl font-bold transition-all duration-300 bg-white/30 focus:bg-white/70 focus:ring-2 focus:ring-white/80 focus:outline-none",
              isError
                ? "border-red-500 text-red-500"
                : "border-emerald-500 focus:border-emerald-400 text-gray-800"
            )}
          />
        ))}
      </div>
      {isPending && (
         <div className="flex items-center text-white mt-6">
           <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
           <span>인증 중...</span>
         </div>
      )}
    </div>
  );
}
