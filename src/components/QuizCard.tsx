'use client';

import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, BrainCircuit, Check, X, Send, Lightbulb } from 'lucide-react';

interface QuizData {
  id: string;
  question: string;
  type: 'text';
}

interface QuizResult {
  isCorrect: boolean;
  explanation: string;
}

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
    setError(null);
    
    try {
      const res = await fetch('/api/quiz/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: answer.trim() }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '답변 확인 중 오류가 발생했습니다.');
      }
      
      const data: QuizResult = await res.json();
      setResult(data);
      setIsFlipped(true);
      
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
  };

  if (isLoading) {
    return (
      <Card className="w-full bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-600">
            <BrainCircuit className="animate-pulse" />
            <span>오늘의 꼼퀴즈 로딩 중...</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-6 bg-purple-200 rounded animate-pulse" />
            <div className="h-10 bg-purple-200 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !quiz) {
    return (
      <Card className="w-full border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-700">
            <Lightbulb />
            <span>오늘의 퀴즈</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-yellow-700">
            {error || '오늘은 퀴즈가 없어요. 내일 다시 만나요! 💕'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full perspective-1000">
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
          >
            <Card className={`w-full ${result.isCorrect ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' : 'bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200'}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                  {result.isCorrect ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1, rotate: 360 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    >
                      <Check className="w-12 h-12 text-green-500 bg-white rounded-full p-2" />
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1, rotate: [0, -10, 10, -10, 10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <X className="w-12 h-12 text-orange-500 bg-white rounded-full p-2" />
                    </motion.div>
                  )}
                  <span className={result.isCorrect ? 'text-green-600' : 'text-orange-600'}>
                    {result.isCorrect ? '정답입니다! 🎉' : '아쉬워요 😢'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-lg text-gray-700 whitespace-pre-line">
                  {result.explanation}
                </p>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button onClick={handleRetry} className="bg-purple-500 hover:bg-purple-600">
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
            <Card className="w-full bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-600">
                  <BrainCircuit className="animate-bounce" />
                  <span>오늘의 꼼퀴즈! 💕</span>
                </CardTitle>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  <p className="text-lg font-medium text-gray-800 bg-white/50 p-4 rounded-lg">
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
                    className="w-full bg-purple-500 hover:bg-purple-600"
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
