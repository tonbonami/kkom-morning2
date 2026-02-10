'use client';

import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, BrainCircuit, Check, X, Send } from 'lucide-react';
import type { QuizData, QuizResult } from '@/types';
import { Skeleton } from './ui/skeleton';

export default function KkomQuiz() {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<QuizResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch('/api/quiz');
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || '퀴즈를 가져오는 데 실패했습니다.');
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
    try {
      const res = await fetch('/api/quiz/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: quiz.id, answer }),
      });
      if (!res.ok) throw new Error('답변 확인 중 오류가 발생했습니다.');
      const data: QuizResult = await res.json();
      setResult(data);
      setIsFlipped(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsChecking(false);
    }
  };
  
  const handleRetry = () => {
    setAnswer('');
    setResult(null);
    setIsFlipped(false);
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="text-emerald-500" />
            <span>오늘의 꼼이 퀴즈!</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-24" />
        </CardFooter>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <X />
            <span>퀴즈 로딩 실패</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!quiz) {
    return null; // or a message saying no quiz today
  }

  return (
    <div className="w-full perspective">
      <AnimatePresence initial={false}>
        <motion.div
          key={isFlipped ? 'back' : 'front'}
          initial={{ rotateY: isFlipped ? -180 : 0 }}
          animate={{ rotateY: 0 }}
          exit={{ rotateY: 180 }}
          transition={{ duration: 0.6 }}
          className="w-full card-3d"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {isFlipped && result ? (
            // Back of the card (Result)
            <Card className="w-full h-full card-back bg-gradient-to-br from-emerald-50 to-teal-50">
              <CardHeader>
                 <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                    {result.isCorrect ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: 360 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}>
                           <Check className="w-12 h-12 text-green-500 bg-white rounded-full p-2" />
                        </motion.div>
                    ) : (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: [0, -10, 10, -10, 10, 0] }} transition={{ duration: 0.5 }}>
                           <X className="w-12 h-12 text-red-500 bg-white rounded-full p-2" />
                        </motion.div>
                    )}
                    <span className={result.isCorrect ? 'text-green-600' : 'text-red-600'}>
                        {result.isCorrect ? '정답입니다!' : '아쉬워요!'}
                    </span>
                 </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                 <p className="text-gray-700">{result.explanation}</p>
              </CardContent>
              <CardFooter className="flex justify-center">
                 <Button onClick={handleRetry}>다시 풀기</Button>
              </CardFooter>
            </Card>
          ) : (
            // Front of the card (Quiz)
            <Card className="w-full h-full card-front">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BrainCircuit className="text-emerald-500" />
                  <span>오늘의 꼼이 퀴즈!</span>
                </CardTitle>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  <p className="text-lg font-medium text-gray-800">{quiz.question}</p>
                  <Input
                    type="text"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="정답을 입력하세요..."
                    disabled={isChecking}
                  />
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isChecking || !answer.trim()}>
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
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
