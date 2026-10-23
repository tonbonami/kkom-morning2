// 제미나이 시안(2026-10-21, 우댕 전달) — 값 그대로.
// 로고(2026-10-24, 우댕 「꿀닥터」 2번 OK): 제목 글자 → 꿀닥터 로고.
// SkinPinGate.tsx
import React, { useState } from 'react';
import KkulDoctorLogo from './KkulDoctorLogo';
import { motion } from 'framer-motion';
import { Lock, Delete } from 'lucide-react';

export default function SkinPinGate({
  status,
  onSubmit,
}: {
  status: 'idle' | 'checking' | 'bad' | 'locked';
  onSubmit: (pin: string) => void;
}) {
  const [pin, setPin] = useState('');

  const handlePad = (num: string) => {
    if (status === 'locked' || pin.length >= 8) return;
    setPin((p) => p + num);
  };

  const handleDelete = () => setPin((p) => p.slice(0, -1));

  const handleSubmit = () => {
    if (pin.length >= 4) onSubmit(pin);
  };

  return (
    <div className="flex flex-col h-full max-w-md mx-auto p-6 text-[var(--sd-ink)]">
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-[var(--sd-surface-2)] flex items-center justify-center mb-4">
          <Lock size={32} color="var(--sd-muted)" />
        </div>
        <h1 className="flex justify-center"><KkulDoctorLogo height={72} text={0.62} /></h1>
        <p className="text-[var(--sd-muted)] text-sm">꼼이만 볼 수 있게 잠겨 있어요</p>

        <motion.div
          animate={status === 'bad' ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="h-12 mt-8 flex items-center justify-center space-x-3"
        >
          {pin.length === 0 ? (
            <span className="text-[var(--sd-faint)] tracking-widest text-xl">PIN 입력</span>
          ) : (
            <span className="text-2xl tracking-[0.5em]">{'*'.repeat(pin.length)}</span>
          )}
        </motion.div>
        <div className="h-6">
          {status === 'bad' && <p className="text-[var(--sd-crit)] text-sm">PIN이 달라요</p>}
          {status === 'locked' && <p className="text-[var(--sd-crit)] text-sm">15분 뒤에 다시 해 주세요</p>}
        </div>
      </div>

      <div className="pb-8">
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <motion.button
              key={n}
              whileTap={{ scale: 0.9 }}
              onClick={() => handlePad(n.toString())}
              className="h-16 text-2xl font-medium rounded-2xl bg-[var(--sd-surface-2)] active:bg-[var(--sd-line)]"
            >
              {n}
            </motion.button>
          ))}
          <div />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handlePad('0')}
            className="h-16 text-2xl font-medium rounded-2xl bg-[var(--sd-surface-2)] active:bg-[var(--sd-line)]"
          >
            0
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleDelete}
            className="h-16 flex items-center justify-center rounded-2xl bg-[var(--sd-surface-2)] active:bg-[var(--sd-line)]"
          >
            <Delete size={24} color="var(--sd-ink)" />
          </motion.button>
        </div>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleSubmit}
          disabled={pin.length < 4 || status === 'locked'}
          className="w-full py-4 rounded-2xl bg-[var(--sd-rel)] text-white font-bold text-lg disabled:opacity-50"
        >
          확인
        </motion.button>
      </div>
    </div>
  );
}
