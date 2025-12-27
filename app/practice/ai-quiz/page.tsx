// src/app/practice/ai-quiz/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import AuthGuard from '@/components/AuthGuard';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

interface QuizData {
  quiz_metadata: {
    total_questions: number;
    difficulty: string;
    xp_per_correct_answer: number;
  };
  questions: QuizQuestion[];
}

export default function AIQuizPage() {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [vocabularyList, setVocabularyList] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(string | null)[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Quiz settings
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');

  // Load user's vocabulary
  useEffect(() => {
    const loadVocabulary = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: vocabData } = await supabase
        .from('vocabularies')
        .select('word')
        .eq('user_id', user.id);

      if (vocabData) {
        setVocabularyList(vocabData.map(v => v.word));
      }
      setLoading(false);
    };

    loadVocabulary();
  }, []);

  // Generate quiz with AI
  const generateQuiz = async () => {
    if (vocabularyList.length === 0) {
      alert('Bạn cần có từ vựng trước khi làm bài tập!');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionCount,
          difficulty,
          vocabularyList
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setQuizData(result.quiz);
        setSelectedAnswers(new Array(result.quiz.questions.length).fill(null));
        setCurrentQuestionIndex(0);
        setShowResults(false);
      } else {
        alert('Không thể tạo bài tập: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      alert('Lỗi khi tạo bài tập!');
    } finally {
      setGenerating(false);
    }
  };

  // Handle answer selection
  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setSelectedAnswers(newAnswers);
  };

  // Move to next question
  const nextQuestion = () => {
    if (currentQuestionIndex < (quizData?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      finishQuiz();
    }
  };

  // Finish quiz and calculate results
  const finishQuiz = async () => {
    setShowResults(true);

    // Calculate correct answers
    let correctCount = 0;
    quizData?.questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correct_answer) {
        correctCount++;
      }
    });

    const xpEarned = correctCount * (quizData?.quiz_metadata.xp_per_correct_answer || 10);

    // Award XP
    if (xpEarned > 0) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await fetch('/api/user-profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              action: 'practice_correct',
              xp: xpEarned,
              difficulty
            }),
          });
        }
      } catch (error) {
        console.error('Error awarding XP:', error);
      }
    }
  };

  // Calculate progress percentage
  const progress = quizData ? ((currentQuestionIndex + 1) / quizData.questions.length) * 100 : 0;

  // Current question
  const currentQuestion = quizData?.questions[currentQuestionIndex];

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center dark:bg-background-dark dark:text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Đang tải từ vựng...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-white antialiased font-display">
        <div className="layout-container flex h-full grow flex-col">
          <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-20 flex flex-1 justify-center py-5">
            <div className="layout-content-container flex flex-col max-w-[800px] flex-1 w-full">

              {/* Header */}
              <header className="sticky top-4 z-50 flex items-center justify-between border border-solid border-slate-200 dark:border-slate-800 px-6 py-3 rounded-2xl bg-white/80 dark:bg-[#1A2C32]/80 backdrop-blur-md shadow-sm mb-8">
                <div className="flex items-center gap-4">
                  <Link href="/practice" className="size-8 text-primary">
                    <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                      <path clipRule="evenodd" d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fill="currentColor" fillRule="evenodd"></path>
                    </svg>
                  </Link>
                  <h2 className="text-slate-800 dark:text-slate-100 text-lg font-bold leading-tight">AI Quiz</h2>
                </div>
                {quizData && !showResults && (
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500 shadow-[0_0_8px_rgba(43,189,238,0.5)]"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-bold text-slate-400">
                      {currentQuestionIndex + 1}/{quizData.questions.length}
                    </span>
                  </div>
                )}
              </header>

              <main className="flex flex-col gap-8 mb-20">
                {!quizData ? (
                  /* Quiz Setup */
                  <div className="space-y-8">
                    <div className="text-center">
                      <h1 className="text-3xl font-black mb-4">AI Vocabulary Quiz</h1>
                      <p className="text-slate-500 dark:text-slate-400">
                        Bài tập được tạo bởi AI dựa trên từ vựng của bạn
                      </p>
                    </div>

                    {/* Vocabulary Stats */}
                    <div className="bg-white dark:bg-[#1A2C32] rounded-3xl p-6 border border-slate-100 dark:border-slate-800">
                      <div className="text-center mb-4">
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-bold">
                          {vocabularyList.length} từ vựng
                        </span>
                      </div>
                      {vocabularyList.length > 0 && (
                        <div className="flex flex-wrap gap-2 justify-center">
                          {vocabularyList.slice(0, 10).map((word, index) => (
                            <span key={index} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs">
                              {word}
                            </span>
                          ))}
                          {vocabularyList.length > 10 && (
                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs">
                              +{vocabularyList.length - 10} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Quiz Settings */}
                    <div className="bg-white dark:bg-[#1A2C32] rounded-3xl p-6 border border-slate-100 dark:border-slate-800">
                      <h3 className="font-bold mb-4">Cài đặt bài tập</h3>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Số câu hỏi</label>
                          <div className="flex gap-2">
                            {[5, 10, 15, 20].map(count => (
                              <button
                                key={count}
                                onClick={() => setQuestionCount(count)}
                                className={`px-4 py-2 rounded-lg border ${
                                  questionCount === count
                                    ? 'border-primary bg-primary text-white'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-primary'
                                }`}
                              >
                                {count}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Độ khó</label>
                          <div className="flex gap-2">
                            {[
                              { value: 'easy', label: 'Dễ', color: 'green' },
                              { value: 'medium', label: 'Trung bình', color: 'yellow' },
                              { value: 'hard', label: 'Khó', color: 'red' }
                            ].map(({ value, label, color }) => (
                              <button
                                key={value}
                                onClick={() => setDifficulty(value as any)}
                                className={`px-4 py-2 rounded-lg border ${
                                  difficulty === value
                                    ? `border-${color}-500 bg-${color}-500 text-white`
                                    : 'border-slate-200 dark:border-slate-700 hover:border-primary'
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Start Quiz Button */}
                    <div className="text-center">
                      <button
                        onClick={generateQuiz}
                        disabled={generating || vocabularyList.length === 0}
                        className="bg-primary text-white px-10 py-4 rounded-xl font-bold shadow-lg shadow-primary/30 hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {generating ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Đang tạo bài tập...
                          </div>
                        ) : vocabularyList.length === 0 ? (
                          'Cần có từ vựng để bắt đầu'
                        ) : (
                          'Bắt đầu bài tập AI'
                        )}
                      </button>
                    </div>
                  </div>
                ) : showResults ? (
                  /* Results Screen */
                  <div className="space-y-8">
                    <div className="text-center">
                      <h1 className="text-3xl font-black mb-4">Kết quả bài tập</h1>
                    </div>

                    <div className="bg-white dark:bg-[#1A2C32] rounded-3xl p-8 text-center border border-slate-100 dark:border-slate-800">
                      {(() => {
                        let correctCount = 0;
                        quizData.questions.forEach((question, index) => {
                          if (selectedAnswers[index] === question.correct_answer) {
                            correctCount++;
                          }
                        });
                        const xpEarned = correctCount * quizData.quiz_metadata.xp_per_correct_answer;

                        return (
                          <>
                            <div className="text-6xl mb-4">
                              {correctCount === quizData.questions.length ? '🎉' :
                               correctCount > quizData.questions.length * 0.7 ? '👍' : '💪'}
                            </div>
                            <h2 className="text-2xl font-black mb-2">
                              {correctCount}/{quizData.questions.length} câu đúng
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 mb-4">
                              Bạn nhận được <span className="text-primary font-bold">{xpEarned} XP</span>
                            </p>
                            <div className="flex justify-center gap-4">
                              <button
                                onClick={() => window.location.reload()}
                                className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform"
                              >
                                Làm lại
                              </button>
                              <Link
                                href="/practice"
                                className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform"
                              >
                                Quay lại
                              </Link>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                ) : (
                  /* Quiz Questions */
                  <div className="space-y-8">
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-500 shadow-[0_0_10px_rgba(43,189,238,0.5)]"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>

                    {/* Question Card */}
                    <div className="bg-white dark:bg-[#1A2C32] rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800">
                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-4">
                          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-bold">
                            Câu {currentQuestionIndex + 1}/{quizData.questions.length}
                          </span>
                          <span className="text-sm text-slate-500">
                            {quizData.quiz_metadata.difficulty} • {quizData.quiz_metadata.xp_per_correct_answer} XP
                          </span>
                        </div>
                        <h2 className="text-xl font-bold leading-relaxed">
                          {currentQuestion?.question}
                        </h2>
                      </div>

                      {/* Answer Options */}
                      <div className="space-y-3">
                        {currentQuestion?.options.map((option, index) => {
                          const isSelected = selectedAnswers[currentQuestionIndex] === option;
                          const isCorrect = option === currentQuestion.correct_answer;
                          const showCorrect = selectedAnswers[currentQuestionIndex] !== null;

                          let buttonClass = "w-full p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-primary hover:bg-primary/5 transition-all";

                          if (showCorrect) {
                            if (isCorrect) {
                              buttonClass = "w-full p-4 rounded-xl border-2 border-green-500 bg-green-50 dark:bg-green-900/20";
                            } else if (isSelected && !isCorrect) {
                              buttonClass = "w-full p-4 rounded-xl border-2 border-red-500 bg-red-50 dark:bg-red-900/20";
                            }
                          } else if (isSelected) {
                            buttonClass = "w-full p-4 rounded-xl border-2 border-primary bg-primary/10";
                          }

                          return (
                            <button
                              key={index}
                              onClick={() => handleAnswerSelect(option)}
                              disabled={selectedAnswers[currentQuestionIndex] !== null}
                              className={`${buttonClass} text-left font-medium disabled:cursor-not-allowed`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{option}</span>
                                {showCorrect && isCorrect && (
                                  <span className="material-symbols-outlined text-green-500">check_circle</span>
                                )}
                                {showCorrect && isSelected && !isCorrect && (
                                  <span className="material-symbols-outlined text-red-500">cancel</span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {selectedAnswers[currentQuestionIndex] && (
                        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                          <p className="text-blue-800 dark:text-blue-200 text-sm">
                            <strong>Giải thích:</strong> {currentQuestion?.explanation}
                          </p>
                        </div>
                      )}

                      {/* Next Button */}
                      {selectedAnswers[currentQuestionIndex] && (
                        <div className="mt-6 text-center">
                          <button
                            onClick={nextQuestion}
                            className="bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
                          >
                            {currentQuestionIndex < quizData.questions.length - 1 ? 'Câu tiếp theo' : 'Hoàn thành'}
                            <span className="material-symbols-outlined ml-2">arrow_forward</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </main>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}