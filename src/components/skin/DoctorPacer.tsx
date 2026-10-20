// 제미나이 시안(2026-10-21, 우댕 전달) — 값 그대로.
// DoctorPacer.tsx
import React from 'react';
import { motion } from 'framer-motion';

export default function DoctorPacer({
  src,
  thinking = false,
}: {
  src: string;
  thinking?: boolean;
}) {
  return (
    <div className="relative w-full h-[120px] overflow-hidden border-b border-[var(--sd-line)] bg-white/50">
      <motion.div
        className="absolute bottom-2"
        initial={{ x: 0 }}
        animate={
          thinking
            ? { x: "50%", scaleX: 1, y: 0 } // 고민 중일 때 가운데 정지
            : {
                x: ["0%", "calc(100vw - 96px)", "calc(100vw - 96px)", "0%", "0%"],
                scaleX: [1, 1, -1, -1, 1],
                y: [0, -4, 0, -4, 0] // 걷는 듯한 통통 애니메이션
              }
        }
        transition={
          thinking
            ? { duration: 0.5 }
            : {
                duration: 10,
                ease: "linear",
                repeat: Infinity,
                times: [0, 0.45, 0.5, 0.95, 1],
              }
        }
      >
        <div className="relative">
          <img src={src} alt="의사 꿀됑" className="w-[96px] h-auto object-contain drop-shadow-md" />
          {thinking && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -top-8 right-0 bg-white rounded-2xl rounded-br-none px-3 py-1.5 shadow-sm border border-[var(--sd-line)] text-[var(--sd-ink)] text-xs font-bold"
            >
              <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>.</motion.span>
              <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}>.</motion.span>
              <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}>.</motion.span>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
