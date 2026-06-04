'use client';

import { useRouter } from 'next/navigation';
import DDayDetailV1 from '@/components/DDayDetailV1';

// 두 사람의 핵심 날짜 — 코드에 하드코딩 (둘만의 앱, 변할 일 거의 없음)
const FIRST_MET = new Date(2023, 8, 28);    // 2023-09-28 (월=0-indexed)
const MARRIED_AT = new Date(2025, 3, 1);    // 2025-04-01

export default function DDayPage() {
  const router = useRouter();
  return (
    <DDayDetailV1
      firstMet={FIRST_MET}
      marriedAt={MARRIED_AT}
      onBack={() => router.push('/')}
    />
  );
}
