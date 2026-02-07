'use client';

import { useState, useRef, KeyboardEvent, ClipboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { loginUser } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle } from 'lucide-react';

export function PinInput() {
  const [pins, setPins] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (value && !/^\d$/.test(value)) return;

    const newPins = [...pins];
    newPins[index] = value;
    setPins(newPins);
    setError(false);

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newPins.every(pin => pin !== '')) {
      handleSubmit(newPins.join(''));
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pins[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, 4).split('');
    
    if (digits.length === 4) {
      setPins(digits);
      inputRefs.current[3]?.focus();
      handleSubmit(digits.join(''));
    }
  };

  const handleSubmit = async (code: string) => {
    setIsLoading(true);
    setError(false);

    try {
      const user = await loginUser(code);
      
      if (user) {
        toast({
          title: '환영해요! 💚',
          description: `${user.이름}님, 로그인 성공!`,
        });
        router.push('/');
      } else {
        setError(true);
        setPins(['', '', '', '']);
        inputRefs.current[0]?.focus();
        toast({
          title: '코드가 맞지 않아요',
          description: '다시 시도해주세요.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      setError(true);
      setPins(['', '', '', '']);
      inputRefs.current[0]?.focus();
      toast({
        title: '로그인 실패',
        description: '네트워크를 확인해주세요.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-center gap-3">
        {pins.map((pin, index) => (
          <input
            key={index}
            ref={el => inputRefs.current[index] = el}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={pin}
            onChange={e => handleChange(index, e.target.value)}
            onKeyDown={e => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={isLoading}
            className={cn(
              'w-16 h-20 text-3xl font-bold text-center',
              'rounded-xl border-2 transition-all',
              'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500',
              error
                ? 'border-red-500 bg-red-50 animate-shake'
                : 'border-emerald-300 bg-white hover:border-emerald-400',
              isLoading && 'opacity-50 cursor-not-allowed'
            )}
            autoFocus={index === 0}
          />
        ))}
      </div>

      <p className="text-center text-sm text-gray-600">
        우리만의 특별한 날짜를 입력해주세요 💚
      </p>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 text-emerald-600">
          <LoaderCircle className="w-5 h-5 animate-spin" />
          <span className="text-sm">확인 중...</span>
        </div>
      )}
    </div>
  );
}
