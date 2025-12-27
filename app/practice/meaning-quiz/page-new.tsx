// src/app/practice/meaning-quiz/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import AuthGuard from '@/components/AuthGuard';

interface QuizQuestion {
  word?: any;
  options: string[];
  correctAnswer: string;
  question: string;
  explanation?: string;
}

export default function MeaningQuizPage() {
  // --- STATES ---
  const [vocabularyList, setVocabularyList] = useState<any[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(string | null)[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showCongratulation, setShowCongratulation] = useState(false);
  const [congratulationData, setCongratulationData] = useState<{
    correctCount: number;
    totalQuestions: number;
    xpEarned: number;
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Quiz settings
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [quizStarted, setQuizStarted] = useState(false);

  // Load user's vocabulary (check for selected words first)
  useEffect(() => {
    const loadVocabulary = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First check if user selected specific words from practice page
      const selectedWordsData = localStorage.getItem('selectedPracticeWords');
      if (selectedWordsData) {
        try {
          const selectedWords = JSON.parse(selectedWordsData);
          setVocabularyList(selectedWords);
          console.log('Using selected words for practice:', selectedWords.length);
          setLoading(false);
          return;
        } catch (error) {
          console.error('Error parsing selected words:', error);
          // Fall back to all vocabulary
        }
      }

      // Load all vocabulary as fallback
      const { data: vocabData } = await supabase
        .from('vocabularies')
        .select('*')
        .eq('user_id', user.id);

      if (vocabData) {
        setVocabularyList(vocabData);
        console.log('Using all vocabulary for practice:', vocabData.length);
      }
      setLoading(false);
    };

    loadVocabulary();
  }, []);

  // Generate congratulation message based on results (following the user's prompt format)
  const generateCongratulationMessage = (correctCount: number, totalQuestions: number, xpEarned: number) => {
    const percentage = (correctCount / totalQuestions) * 100;

    let title = "";
    let encouragement = "";
    let leaderboardHint = "";

    if (percentage === 100) {
      title = "Hoàn hảo! 🎉";
      encouragement = "Bạn đã làm tuyệt vời! Không có lỗi nào cả.";
    } else if (percentage >= 80) {
      title = "Xuất sắc! 🔥";
      encouragement = "Bạn đã làm rất tốt! Chỉ cần cố gắng thêm một chút nữa.";
    } else if (percentage >= 60) {
      title = "Tốt lắm! 💪";
      encouragement = "Bạn đang tiến bộ! Hãy tiếp tục luyện tập.";
    } else {
      title = "Cố gắng thêm nhé! 📚";
      encouragement = "Đừng nản lòng! Mỗi lần luyện tập đều giúp bạn tiến bộ.";
    }

    leaderboardHint = "Bạn đang tiến gần hơn đến Top 10!";

    return {
      title,
      encouragement,
      leaderboardHint,
      message: `${encouragement} ${leaderboardHint}`
    };
  };

  // Generate AI-powered quiz questions
  const generateQuiz = async () => {
    if (vocabularyList.length === 0) {
      alert('Bạn cần có từ vựng trước khi làm bài tập!');
      return;
    }

    try {
      setLoading(true);

      const vocabWords = vocabularyList.map(word => word.word);
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionCount: totalQuestions,
          difficulty: difficulty,
          vocabularyList: vocabWords,
          quizType: 'meaning'
        }),
      });

      const result = await response.json();

      if (result.success && result.quiz.questions) {
        const questions: QuizQuestion[] = result.quiz.questions.map((q: any) => ({
          word: vocabularyList.find(w => w.word.toLowerCase() === q.word.toLowerCase()),
          options: q.options,
          correctAnswer: q.correct_answer,
          question: q.question,
          explanation: q.explanation
        }));

        setQuizQuestions(questions);
        setSelectedAnswers(new Array(questions.length).fill(null));
        setCurrentQuestionIndex(0);
        setQuizStarted(true);
        setShowResults(false);
        setShowCongratulation(false);
        setCongratulationData(null);

        // Show fallback notice if applicable
        if (result.fallback) {
          console.log('Using fallback quiz generation:', result.message);
        }
      } else {
        alert('Không thể tạo bài tập. Vui lòng thử lại!');
        console.error('Quiz generation failed:', result.error);
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      alert('Có lỗi xảy ra khi tạo bài tập!');
    } finally {
      setLoading(false);
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
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      finishQuiz();
    }
  };

  // Finish quiz and calculate results
  const finishQuiz = async () => {
    alert('🎯 Finishing quiz...'); // Debug alert
    console.log('🎯 Finishing quiz...');

    // Calculate correct answers
    let correctCount = 0;
    quizQuestions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correctCount++;
      }
    });

    console.log(`✅ Correct answers: ${correctCount}/${quizQuestions.length}`);

    const xpEarned = correctCount * (difficulty === 'easy' ? 10 : difficulty === 'medium' ? 15 : 20);
    console.log(`💰 XP earned: ${xpEarned}`);

    // Award XP
    if (xpEarned > 0) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('🚀 Awarding XP to user...');
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
          console.log('✅ XP awarded successfully');
        }
      } catch (error) {
        console.error('❌ Error awarding XP:', error);
      }
    }

    // Generate congratulation message
    const congratulation = generateCongratulationMessage(correctCount, quizQuestions.length, xpEarned);
    console.log('🎊 Congratulation data:', congratulation);

    const congratData = {
      correctCount,
      totalQuestions: quizQuestions.length,
      xpEarned,
      message: congratulation.message
    };

    console.log('📊 Setting congratulation data:', congratData);
    setCongratulationData(congratData);
    setShowCongratulation(true);
    console.log('🎉 Popup should now be visible!');
  };

  // Calculate progress percentage
  const progress = quizStarted ? ((currentQuestionIndex + 1) / quizQuestions.length) * 100 : 0;

  // Current question
  const currentQuestion = quizQuestions[currentQuestionIndex];

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
                  <h2 className="text-slate-800 dark:text-slate-100 text-lg font-bold leading-tight">Meaning Quiz</h2>
                </div>
                {quizStarted && !showResults && (
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500 shadow-[0_0_8px_rgba(43,189,238,0.5)]"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-bold text-slate-400">
                      {currentQuestionIndex + 1}/{quizQuestions.length}
                    </span>
                  </div>
                )}
              </header>

              <main className="flex flex-col gap-8 mb-20">
                {!quizStarted ? (
                  /* Quiz Setup */
                  <div className="space-y-8">
                    <div className="text-center">
                      <h1 className="text-3xl font-black mb-4">Vocabulary Meaning Quiz</h1>
                      <p className="text-slate-500 dark:text-slate-400">
                        Chọn nghĩa đúng cho từ vựng của bạn
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
                              {word.word}
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
                                onClick={() => setTotalQuestions(count)}
                                className={`px-4 py-2 rounded-lg border ${
                                  totalQuestions === count
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
                        disabled={vocabularyList.length === 0}
                        className="bg-primary text-white px-10 py-4 rounded-xl font-bold shadow-lg shadow-primary/30 hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {vocabularyList.length === 0 ? 'Cần có từ vựng để bắt đầu' : 'Bắt đầu bài tập'}
                      </button>
                    </div>
                  </div>
                ) : showResults && !showCongratulation && !showCongratulation ? (
                  /* Results Screen */
                  <div className="space-y-8">
                    <div className="text-center">
                      <h1 className="text-3xl font-black mb-4">Kết quả bài tập</h1>
                    </div>

                    <div className="bg-white dark:bg-[#1A2C32] rounded-3xl p-8 text-center border border-slate-100 dark:border-slate-800">
                      {(() => {
                        let correctCount = 0;
                        quizQuestions.forEach((question, index) => {
                          if (selectedAnswers[index] === question.correctAnswer) {
                            correctCount++;
                          }
                        });
                        const xpEarned = correctCount * (difficulty === 'easy' ? 10 : difficulty === 'medium' ? 15 : 20);

                        return (
                          <>
                            <div className="text-6xl mb-4">
                              {correctCount === quizQuestions.length ? '🎉' :
                               correctCount > quizQuestions.length * 0.7 ? '👍' : '💪'}
                            </div>
                            <h2 className="text-2xl font-black mb-2">
                              {correctCount}/{quizQuestions.length} câu đúng
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 mb-4">
                              Bạn nhận được <span className="text-primary font-bold">{xpEarned} XP</span>
                            </p>
                            <div className="flex justify-center gap-4">
                              <button
                                onClick={() => setQuizStarted(false)}
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
                            Câu {currentQuestionIndex + 1}/{quizQuestions.length}
                          </span>
                          <span className="text-sm text-slate-500">
                            {difficulty} • {(difficulty === 'easy' ? 10 : difficulty === 'medium' ? 15 : 20)} XP/câu đúng
                          </span>
                        </div>
                        <h2 className="text-xl font-bold leading-relaxed mb-4">
                          {currentQuestion?.question}
                        </h2>
                        {currentQuestion?.word && (
                          <div className="text-center mb-6">
                            <h3 className="text-4xl font-black text-primary mb-2 uppercase">
                              {currentQuestion.word.word}
                            </h3>
                            <p className="text-slate-400 italic">
                              {currentQuestion.word.ipa}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Answer Options */}
                      <div className="space-y-3">
                        {currentQuestion?.options.map((option, index) => {
                          const isSelected = selectedAnswers[currentQuestionIndex] === option;
                          const isCorrect = option === currentQuestion.correctAnswer;
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
                              className={`${buttonClass} text-left font-medium`}
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

                      {/* Next Button */}
                      {selectedAnswers[currentQuestionIndex] && (
                        <div className="mt-6 text-center">
                          <button
                            onClick={nextQuestion}
                            className="bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
                          >
                            {currentQuestionIndex < quizQuestions.length - 1 ? 'Câu tiếp theo' : 'Hoàn thành'}
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

      {/* Congratulation Popup */}
      {showCongratulation && congratulationData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-2xl border-4 border-primary text-center max-w-sm animate-bounce-in">
            {/* Debug info */}
            <div className="absolute top-2 right-2 text-xs bg-red-500 text-white px-2 py-1 rounded">
              DEBUG: Popup visible
            </div>
            <div className="text-6xl mb-4">
              {(() => {
                const percentage = (congratulationData.correctCount / congratulationData.totalQuestions) * 100;
                if (percentage === 100) return '🎊';
                if (percentage >= 80) return '🏆';
                if (percentage >= 60) return '👍';
                return '💪';
              })()}
            </div>
            <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2">
              {generateCongratulationMessage(congratulationData.correctCount, congratulationData.totalQuestions, congratulationData.xpEarned).title}
            </h2>

            <div className="bg-primary/10 py-4 rounded-2xl mb-6">
              <p className="text-sm font-bold text-primary uppercase tracking-widest">Bạn nhận được</p>
              <p className="text-5xl font-black text-primary">+{congratulationData.xpEarned} XP</p>
              <p className="text-xs text-slate-500 mt-1">
                {congratulationData.correctCount}/{congratulationData.totalQuestions} câu đúng
              </p>
            </div>

            <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">
              {generateCongratulationMessage(congratulationData.correctCount, congratulationData.totalQuestions, congratulationData.xpEarned).leaderboardHint}
            </p>

            <button
              onClick={() => {
                setShowCongratulation(false);
                setShowResults(true);
              }}
              className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
            >
              Xem thứ hạng của tôi
            </button>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}