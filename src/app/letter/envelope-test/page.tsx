'use client';

// 봉투 시험 화면 — 우댕 「버벅이게 하는 것은 절대 금지」(2026-11-07).
//   실제 편지에 켜기 전에 우댕 폰(사파리)에서 직접 열어 보고 길이·생각풍선 방식을 고르는 곳. 로그인·데이터 없음(본보기 글).
//   화면 부품은 Gemini(Antigravity Pro) 시안 그대로: EnvelopeReveal·ThoughtBubble·LetterCornerBubbles·UnopenedLetterCard·letterEnvelopes.
//   맨 아래 숫자 = 여는 동안 + 열린 뒤 1.5초 동안 한 장면 그리는 데 걸린 시간(34ms 넘으면 눈에 끊겨 보임).

import { useCallback, useEffect, useRef, useState } from 'react';
import { EnvelopeReveal, type OpeningPhase } from '@/components/letter/EnvelopeReveal';
import { LetterCornerBubbles } from '@/components/letter/LetterCornerBubbles';
import { UnopenedLetterCard } from '@/components/letter/UnopenedLetterCard';
import { LetterPaper } from '@/components/letter/LetterPaper';
import { LetterEnclosures } from '@/components/letter/LetterEnclosures';
import { envelopeFor } from '@/lib/letterEnvelopes';
import { LETTER_PAPERS, paperById } from '@/lib/letterPapers';
import { getEmoticonsByIds } from '@/lib/emoticons';
import { splitMini } from '@/lib/miniEmoticons';
import { signFor } from '@/lib/letterSign';

const KKUL = '/emo/kkuldaeng/mood/calm.png';
const KKOM = '/emo/saidami/calm.webp';
const SAMPLE = '오늘도 고마워 (하트) 퇴근하고 맛있는 거 먹자 (헤헤)\n항상 사랑해 (사랑해)';
// 제일 무거운 경우로 — 움짤 3개
const STICKERS = ['anim/love', 'kkulanim/kkul-tteok-chal', 'anim/hug'];

type Person = '우댕' | '꼼이';

function preload(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = src;
    const done = () => resolve();
    if (img.decode) img.decode().then(done, done); else { img.onload = done; img.onerror = done; }
  });
}

export default function EnvelopeTestPage() {
  const [paperId, setPaperId] = useState('peach');
  const [duration, setDuration] = useState(700);
  const [bubbleMode, setBubbleMode] = useState<'opening' | 'stay'>('opening');
  const [from, setFrom] = useState<Person>('꼼이');
  const [phase, setPhase] = useState<OpeningPhase>('closed');
  const [run, setRun] = useState(0);
  const [stats, setStats] = useState<{ max: number; janky: number; frames: number } | null>(null);
  const [reduced, setReduced] = useState(false);
  // ?slow=5 — 여는 순서를 5배 느리게(중간 장면 확인용, 화면엔 안 보이는 옵션)
  const [slow, setSlow] = useState(1);
  const deltas = useRef<number[]>([]);
  const measuring = useRef(false);

  useEffect(() => {
    setReduced(typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
    const v = Number(new URLSearchParams(window.location.search).get('slow'));
    if (v > 1) setSlow(v);
  }, []);

  // 닫힌 봉투로 되돌리기(우댕 2026-11-08 「클릭하면 봉투 열리게」 — 봉투를 눌러야 열린다)
  const start = useCallback(async () => {
    setStats(null);
    setPhase('closed');
    setRun((n) => n + 1);
    await Promise.all([preload(KKUL), preload(KKOM)]);
  }, []);
  // 봉투를 누르면 열기 — 재는 것도 이때부터
  const openIt = useCallback(() => {
    deltas.current = [];
    measuring.current = true;
    let last = performance.now();
    const tick = (t: number) => {
      deltas.current.push(t - last);
      last = t;
      if (measuring.current) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    setPhase('opening');
  }, []);

  useEffect(() => { start(); }, [start]);

  const onComplete = useCallback(() => {
    setPhase('opened');
    // 열린 뒤 진짜 편지·움짤이 처음 그려지는 1.5초까지 같이 잰다
    setTimeout(() => {
      measuring.current = false;
      const d = deltas.current.slice(1);
      setStats({ max: Math.round(Math.max(0, ...d)), janky: d.filter((x) => x > 34).length, frames: d.length });
    }, 1500);
  }, []);

  const paper = paperById(paperId);
  const palette = envelopeFor(paperId);
  const to: Person = from === '우댕' ? '꼼이' : '우댕';
  const emoticons = getEmoticonsByIds(STICKERS);

  const chip = (on: boolean) =>
    `min-h-[40px] px-3 rounded-full text-[13px] border ${on ? 'border-[var(--sd-rel)] text-[var(--sd-rel)] bg-[var(--sd-rel-soft)]' : 'border-[var(--sd-line)] text-[var(--sd-muted)] bg-white'}`;

  return (
    <div className="sd-app min-h-app max-w-md mx-auto px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-[calc(env(safe-area-inset-bottom)+24px)] text-[var(--sd-ink)]">
      <h1 className="text-lg font-semibold mb-1">봉투 시험 화면</h1>
      <p className="text-[13px] text-[var(--sd-muted)] mb-3">실제 편지에는 아직 안 켰어요. 여기서 보고 정해 주세요.</p>

      <div className="flex flex-col gap-2 mb-4">
        <div className="flex flex-wrap gap-2">
          {[700, 1000, 1300].map((ms) => (
            <button key={ms} type="button" className={chip(duration === ms)} onClick={() => setDuration(ms)}>{(ms / 1000).toFixed(1)}초</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={chip(bubbleMode === 'opening')} onClick={() => setBubbleMode('opening')}>풍선: 열릴 때만</button>
          <button type="button" className={chip(bubbleMode === 'stay')} onClick={() => setBubbleMode('stay')}>풍선: 읽는 내내</button>
          <button type="button" className={chip(from === '꼼이')} onClick={() => setFrom('꼼이')}>꼼이가 보냄</button>
          <button type="button" className={chip(from === '우댕')} onClick={() => setFrom('우댕')}>우댕이 보냄</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {LETTER_PAPERS.map((p) => (
            <button key={p.id} type="button" className={chip(paperId === p.id)} onClick={() => setPaperId(p.id)}>{p.name}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={start} className="flex-1 min-h-[48px] rounded-full bg-[var(--sd-rel)] text-white font-semibold">닫힌 봉투로 되돌리기</button>
        </div>
      </div>

      <p className="text-[12px] text-[var(--sd-cardlabel)] mb-1">편지함 목록의 「안 연 편지」 칸</p>
      <div className="mb-4">
        <UnopenedLetterCard fromName={from} dateText="11월 7일 (토) 오후 3:12" palette={palette} onOpen={start} />
      </div>

      <div className="rounded-[28px] bg-white/60 border border-[var(--sd-line)] p-3 min-h-[420px]" key={run}>
        {phase !== 'opened' ? (
          <EnvelopeReveal
            phase={phase}
            fromName={from}
            toName={to}
            palette={palette}
            kkulSrc={KKUL}
            kkomSrc={KKOM}
            reducedMotion={reduced}
            durationMs={duration * slow}
            bubbles="opening"
            onOpen={openIt}
            onSkip={onComplete}
            onComplete={onComplete}
          />
        ) : (
          <div className="relative">
            <LetterPaper
              toName={to}
              fromName={from}
              dateText="2026. 11. 7"
              parts={splitMini(SAMPLE, from)}
              paper={paper}
              enclosures={
                <LetterEnclosures
                  emoticons={emoticons.map((e) => ({ id: e.id, label: e.label, imageUrl: e.imageUrl }))}
                  animated={null}
                  voice={null}
                  doodle={null}
                  sign={signFor(from)}
                />
              }
            />
            {bubbleMode === 'stay' && <LetterCornerBubbles kkulSrc={KKUL} kkomSrc={KKOM} fromName={from} />}
          </div>
        )}
      </div>

      <p className="mt-3 text-[13px] tabular-nums text-[var(--sd-muted)]">
        {stats
          ? `장면 ${stats.frames}개 · 가장 오래 걸린 장면 ${stats.max}ms · 끊긴 장면(34ms 넘음) ${stats.janky}개${reduced ? ' · 동작 줄이기 켜짐' : ''}`
          : phase === 'closed' ? '봉투를 누르면 열리고, 여는 동안 장면 시간을 재요' : '재는 중…'}
      </p>
    </div>
  );
}
