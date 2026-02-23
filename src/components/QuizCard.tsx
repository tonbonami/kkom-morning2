'use client';

import { useState, useEffect, FormEvent, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, BrainCircuit, Check, X, Send, Lightbulb, Sparkles } from 'lucide-react';

interface QuizData {
  id: string;
  question: string;
  type: 'text';
}

interface QuizResult {
  isCorrect: boolean;
  explanation: string;
}

type Sparkle = {
  id: string;
  left: string;
  top: string;
  delay: number;
  scale: number;
  rotate: number;
};

function makeSparkles(count = 10): Sparkle[] {
  const items: Sparkle[] = [];
  for (let i = 0; i < count; i++) {
    const left = `${10 + Math.random() * 80}%`;
    const top = `${10 + Math.random() * 80}%`;
    const delay = i * 0.06; // 순차로 피어오르는 느낌
    const scale = 0.7 + Math.random() * 0.8;
    const rotate = -20 + Math.random() * 40;
    items.push({
      id: `${Date.now()}-${i}-${Math.random().toString(16).slice(2)}`,
      left,
      top,
      delay,
      scale,
      rotate,
    });
  }
  return items;
}

function SparklesBurst({ show }: { show: boolean }) {
  const sparkles = useMemo(() => makeSparkles(12), []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="pointer-events-none absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* 은은한 글로우(라이트 글래스 톤) */}
          <motion.div
            className="absolute inset-0 rounded-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              background:
                'radial-gradient(circle at 30% 20%, rgba(16,185,129,0.30) 0%, transparent 55%), ' +
                'radial-gradient(circle at 80% 70%, rgba(59,130,246,0.20) 0%, transparent 60%)',
            }}
          />

          {/* 반짝이들 */}
          {sparkles.map((s) => (
            <motion.div
              key={s.id}
              className="absolute"
              style={{ left: s.left, top: s.top }}
              initial={{ opacity: 0, scale: 0.6, y: 8, rotate: s.rotate }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.6, s.scale, 0.8],
                y: [8, -6, -14],
                rotate: [s.rotate, s.rotate + 12, s.rotate + 20],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.8, // ✅ 요청하신 0.8초
                delay: s.delay,
                ease: 'easeOut',
              }}
            >
              <Sparkles className="h-5 w-5 text-emerald-500 will-change-transform" />
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function KkomQuiz() {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<QuizResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch('/api/quiz');
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error((errorData as any).message || '퀴즈를 가져오는 데 실패했습니다.');
        }
        const data = await res.json();
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
    if (!quiz || !answer.trim()) return;

    setIsChecking(true);
    setError(null);

    try {
      const res = await fetch('/api/quiz/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: answer.trim() }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error((errorData as any).message || '답변 확인 중 오류가 발생했습니다.');
      }

      const data: QuizResult = await res.json();
      setResult(data);
      setIsFlipped(true);

      // ✅ 정답일 때만 0.8초 스파클
      if (data.isCorrect) {
        setShowSparkles(true);
        window.setTimeout(() => setShowSparkles(false), 850);
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

  if (isLoading) {
    return (
      <Card className="w-full bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <BrainCircuit className="animate-pulse" />
            <span>오늘의 꼼퀴즈 로딩 중...</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-6 bg-purple-200/70 rounded animate-pulse" />
            <div className="h-10 bg-purple-200/70 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !quiz) {
    return (
      <Card className="w-full border-yellow-200/70 bg-yellow-50/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <Lightbulb />
            <span>오늘의 퀴즈</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-yellow-800">
            {error || '오늘은 퀴즈가 없어요. 내일 다시 만나요!'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full perspective">
      <AnimatePresence mode="wait">
        {isFlipped && result ? (
          // 뒷면 (결과)
          <motion.div
            key="back"
            initial={{ rotateY: 180, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: -180, opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{ transformStyle: 'preserve-3d' }}
            className="relative"
          >
            <SparklesBurst show={showSparkles} />

            <Card
              className={[
                'relative w-full overflow-hidden',
                result.isCorrect
                  ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200/70'
                  : 'bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200/70',
              ].join(' ')}
            >
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
                <p className="text-base text-gray-700 whitespace-pre-line leading-relaxed">
                  {result.explanation}
                </p>
              </CardContent>

              <CardFooter className="flex justify-center">
                <Button
                  onClick={handleRetry}
                  className="bg-purple-600 hover:bg-purple-700 active:scale-[0.99] transition-transform"
                >
                  다시 풀기
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ) : (
          // 앞면 (퀴즈)
          <motion.div
            key="front"
            initial={{ rotateY: -180, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: 180, opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <Card className="w-full bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <BrainCircuit className="animate-bounce" />
                  <span>오늘의 꼼퀴즈!</span>
                </CardTitle>
              </CardHeader>

              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  <p className="text-base font-medium text-gray-800 bg-white/60 p-4 rounded-lg">
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
                    className="w-full bg-purple-600 hover:bg-purple-700 active:scale-[0.99] transition-transform"
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