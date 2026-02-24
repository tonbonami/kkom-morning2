'use client';

import { useEffect, useMemo, useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, BrainCircuit, Check, X, Send, Lightbulb, Sparkles } from 'lucide-react';

type QuizPayload =
  | { hasQuiz: true; id: string; question: string; type: 'text' }
  | { hasQuiz: false; message: string };

interface QuizResult {
  isCorrect: boolean;
  explanation: string;
}

type SparkleType = {
  id: string;
  left: string;
  top: string;
  delay: number;
  size: number;
  rotate: number;
};

function makeSparkles(count = 10): SparkleType[] {
  const rand = (min: number, max: number) => Math.random() * (max - min) + min;

  return Array.from({ length: count }).map((_, i) => ({
    id: `sp-${Date.now()}-${i}`,
    left: `${rand(18, 82)}%`,
    top: `${rand(18, 82)}%`,
    delay: i * 0.06,
    size: Math.round(rand(14, 22)),
    rotate: Math.round(rand(-25, 25)),
  }));
}

function SparklesBurst({ show }: { show: boolean }) {
  const sparkles = useMemo(() => makeSparkles(11), []);

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          key="sparkles-burst"
          className="pointer-events-none absolute inset-0 z-[30] overflow-hidden rounded-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
        >
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            style={{
              background:
                'radial-gradient(circle at 32% 28%, rgba(16,185,129,0.42) 0%, transparent 58%),' +
                'radial-gradient(circle at 74% 72%, rgba(59,130,246,0.30) 0%, transparent 62%),' +
                'radial-gradient(circle at 55% 50%, rgba(255,255,255,0.35) 0%, transparent 55%)',
            }}
          />

          {sparkles.map((s) => (
            <motion.div
              key={s.id}
              className="absolute"
              style={{ left: s.left, top: s.top }}
              initial={{ opacity: 0, scale: 0.4, rotate: s.rotate }}
              animate={{ opacity: [0, 1, 0], scale: [0.4, 1.12, 0.85], y: [8, -6, -12] }}
              transition={{ duration: 0.8, delay: s.delay, ease: 'easeOut' }}
            >
              <Sparkles
                className="drop-shadow-sm"
                style={{
                  width: s.size,
                  height: s.size,
                  color: 'rgba(16,185,129,0.95)',
                  filter: 'drop-shadow(0 6px 14px rgba(16,185,129,0.25))',
                }}
              />
            </motion.div>
          ))}

          <motion.div
            className="absolute left-1/2 top-1/2 z-[31] -translate-x-1/2 -translate-y-1/2 text-3xl"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: [0, 1, 0], scale: [0.6, 1.05, 0.9] }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            ✨
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default function KkomQuiz() {
  const [quiz, setQuiz] = useState<QuizPayload | null>(null);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<QuizResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false); // ✅ 기본은 false

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch('/api/quiz');
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || '퀴즈를 가져오는 데 실패했습니다.');
        }

        const data: QuizPayload = await res.json();
        setQuiz(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuiz();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!quiz || quiz.hasQuiz === false) return;
    if (!answer.trim()) return;

    setIsChecking(true);
    setError(null);

    try {
      const res = await fetch('/api/quiz/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // ✅ id도 같이 보내서 check 라우트가 id 요구해도 안전
        body: JSON.stringify({ id: quiz.id, answer: answer.trim() }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || '답변 확인 중 오류가 발생했습니다.');
      }

      const data: QuizResult = await res.json();
      setResult(data);
      setIsFlipped(true);

      if (data.isCorrect) {
        setShowSparkles(true);
        window.setTimeout(() => setShowSparkles(false), 800);
      }
    } catch (e: any) {
      console.error('정답 제출 오류:', e);
      setError(e.message);
    } finally {
      setIsChecking(false);
    }
  };

  const handleRetry = () => {
    setAnswer('');
    setResult(null);
    setIsFlipped(false);
    setShowSparkles(false);
  };

  // 로딩
  if (isLoading) {
    return (
      <Card variant="glass" className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-700">
            <BrainCircuit className="animate-pulse" />
            <span>오늘의 꼼퀴즈 로딩 중...</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-6 bg-emerald-100/80 rounded animate-pulse" />
            <div className="h-10 bg-emerald-100/80 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // 진짜 에러
  if (error) {
    return (
      <Card variant="glass" className="w-full !border-yellow-300/70 !ring-yellow-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <Lightbulb />
            <span>오늘의 퀴즈</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-yellow-800">{error}</p>
        </CardContent>
      </Card>
    );
  }

  // 퀴즈 없음(✅ 이제 404가 아니라 200으로 내려오므로 여기로 안정적으로 떨어짐)
  if (!quiz || quiz.hasQuiz === false) {
    const msg = quiz?.message || '오늘은 퀴즈가 없어요. 내일 다시 만나요! 🙂';
    return (
      <Card variant="glass" className="w-full !border-yellow-300/70 !ring-yellow-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <Lightbulb />
            <span>오늘의 퀴즈</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-yellow-800">{msg}</p>
        </CardContent>
      </Card>
    );
  }

  // 퀴즈 있음
  return (
    <div className="relative w-full" style={{ perspective: '1000px' }}>
      <AnimatePresence mode="wait">
        {isFlipped && result ? (
          <motion.div
            key="back"
            initial={{ rotateY: 180, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: -180, opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <Card
              variant="accent"
              interactive
              className={`relative w-full ${
                result.isCorrect
                  ? 'bg-gradient-to-br from-emerald-50/80 to-teal-50/70'
                  : 'bg-gradient-to-br from-orange-50/80 to-yellow-50/70'
              }`}
            >
              <SparklesBurst show={showSparkles} />

              <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                  {result.isCorrect ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1, rotate: 360 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    >
                      <Check className="w-12 h-12 text-emerald-600 bg-white rounded-full p-2" />
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1, rotate: [0, -10, 10, -10, 10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <X className="w-12 h-12 text-orange-600 bg-white rounded-full p-2" />
                    </motion.div>
                  )}
                  <span className={result.isCorrect ? 'text-emerald-700' : 'text-orange-700'}>
                    {result.isCorrect ? '정답입니다!' : '아쉬워요'}
                  </span>
                </CardTitle>
              </CardHeader>

              <CardContent className="text-center space-y-4">
                <p className="text-lg text-gray-800 whitespace-pre-line">{result.explanation}</p>
              </CardContent>

              <CardFooter className="flex justify-center">
                <Button
                  onClick={handleRetry}
                  className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99]"
                >
                  다시 풀기
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="front"
            initial={{ rotateY: -180, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: 180, opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <Card variant="glass" interactive className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-700">
                  <BrainCircuit className="animate-bounce" />
                  <span>오늘의 꼼퀴즈</span>
                </CardTitle>
              </CardHeader>

              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  <p className="text-lg font-medium text-gray-900 bg-white/50 p-4 rounded-lg">
                    {quiz.question}
                  </p>

                  <Input
                    type="text"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="정답을 입력하세요..."
                    disabled={isChecking}
                    className="text-base"
                  />
                </CardContent>

                <CardFooter>
                  <Button
                    type="submit"
                    disabled={isChecking || !answer.trim()}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99]"
                  >
                    {isChecking ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        확인 중...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        정답 제출
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}