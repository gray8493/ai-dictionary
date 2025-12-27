"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import AuthGuard from '@/components/AuthGuard';

/** * LOCAL COMPONENT: NAV_ITEM
 */
const NavItem = ({ href, label, active = false }: { href: string; label: string; active?: boolean }) => (
  <Link
    href={href}
    className={`text-sm font-medium transition-colors ${active ? 'text-primary font-bold' : 'text-slate-600 dark:text-gray-400 hover:text-primary'}`}
  >
    {label}
  </Link>
);

interface FillBlankQuestion {
  word?: any;
  sentence: string;
  correctAnswer: string;
  explanation?: string;
}

export default function FillInBlankPage() {
  // --- STATES ---
  const [vocabularyList, setVocabularyList] = useState<any[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<FillBlankQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showCongratulation, setShowCongratulation] = useState(false);
  const [congratulationData, setCongratulationData] = useState<{
    correctCount: number;
    totalQuestions: number;
    xpEarned: number;
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Quiz settings
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [quizStarted, setQuizStarted] = useState(false);

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) return;

      const response = await fetch('/api/user-profile', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setUserProfile(result.data);
      } else {
        // If API fails, set default profile
        setUserProfile({
          id: null,
          user_id: session.user.id,
          xp: 0,
          level: 1,
          total_vocabularies: 0,
          mastered_vocabularies: 0,
          weekly_xp: 0,
          weekly_mastered: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      // Set default profile on error
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUserProfile({
            id: null,
            user_id: session.user.id,
            xp: 0,
            level: 1,
            total_vocabularies: 0,
            mastered_vocabularies: 0,
            weekly_xp: 0,
            weekly_mastered: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      } catch (sessionErr) {
        console.error('Error getting session:', sessionErr);
      }
    }
  };

  // Check auth and fetch user profile
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        fetchUserProfile();
      }
    };
    checkAuth();
  }, []);

  // Generate congratulation message based on results
  const generateCongratulationMessage = (correctCount: number, totalQuestions: number, xpEarned: number) => {
    let title = "";
    let icon = "";
    let encouragement = "";
    let leaderboardHint = "";

    const percentage = (correctCount / totalQuestions) * 100;

    if (percentage === 100) {
      title = "Hoàn hảo! 🎉";
      icon = "🎊";
      encouragement = "Bạn đã làm tuyệt vời! Không có lỗi nào cả.";
    } else if (percentage >= 80) {
      title = "Xuất sắc! 🔥";
      icon = "🏆";
      encouragement = "Bạn đã làm rất tốt! Chỉ cần cố gắng thêm một chút nữa.";
    } else if (percentage >= 60) {
      title = "Tốt lắm! 💪";
      icon = "👍";
      encouragement = "Bạn đang tiến bộ! Hãy tiếp tục luyện tập.";
    } else {
      title = "Cố gắng thêm nhé! 📚";
      icon = "💪";
      encouragement = "Đừng nản lòng! Mỗi lần luyện tập đều giúp bạn tiến bộ.";
    }

    leaderboardHint = "Hãy xem thứ hạng của bạn trên bảng xếp hạng!";

    return {
      title,
      icon,
      encouragement,
      leaderboardHint,
      message: `${encouragement} ${leaderboardHint}`
    };
  };

  // Award XP when quiz is completed
  useEffect(() => {
    if (showResults && user) {
      awardXP();
    }
  }, [showResults, user]);

  // --- LOGIC: LẤY DỮ LIỆU TỪ DATABASE ---
  useEffect(() => {
    const loadVocabularyData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First check if user selected specific words from practice page
      const selectedWordsData = localStorage.getItem('selectedPracticeWords');
      if (selectedWordsData) {
        try {
          const selectedWords = JSON.parse(selectedWordsData);
          setVocabularyList(selectedWords);
          console.log('Using selected words for fill-blank practice:', selectedWords.length);
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

      if (vocabData && vocabData.length > 0) {
        setVocabularyList(vocabData);
        console.log('Using all vocabulary for fill-blank practice:', vocabData.length);
      }
      setLoading(false);
    };

    loadVocabularyData();
  }, []);

  // Generate AI quiz questions when vocabulary list changes or settings change
  useEffect(() => {
    const generateQuestions = async () => {
      if (vocabularyList.length === 0) return;

      try {
        const vocabWords = vocabularyList.map(word => word.word);
        const response = await fetch('/api/generate-quiz', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            questionCount: totalQuestions,
            difficulty: difficulty,
            vocabularyList: vocabWords
          }),
        });

        const result = await response.json();

        if (result.success && result.quiz.questions) {
          const questions: FillBlankQuestion[] = result.quiz.questions.map((q: any) => ({
            word: vocabularyList.find(w => w.word.toLowerCase() === q.word.toLowerCase()),
            sentence: q.sentence,
            correctAnswer: q.correct_answer,
            explanation: q.explanation
          }));

          setQuizQuestions(questions);
          setSelectedAnswers(new Array(questions.length).fill(""));
        } else {
          console.error('Quiz generation failed:', result.error);
          // Fallback to basic questions if AI fails
          generateFallbackQuestions();
        }
      } catch (error) {
        console.error('Error generating AI quiz:', error);
        // Fallback to basic questions
        generateFallbackQuestions();
      }
    };

    if (vocabularyList.length > 0) {
      generateQuestions();
    }
  }, [vocabularyList, totalQuestions, difficulty]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // --- LOGIC: TẠO CÂU HỎI QUIZ BẰNG AI ---
  const generateAIQuizQuestions = async () => {
    if (vocabularyList.length === 0) return;

    try {
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
          quizType: 'fill-blank'
        }),
      });

      const result = await response.json();

      if (result.success && result.quiz.questions) {
        const questions: FillBlankQuestion[] = result.quiz.questions.map((q: any) => ({
          word: vocabularyList.find(w => w.word.toLowerCase() === q.word.toLowerCase()),
          sentence: q.sentence,
          correctAnswer: q.correct_answer,
          explanation: q.explanation
        }));

        setQuizQuestions(questions);
        setSelectedAnswers(new Array(questions.length).fill(""));
      } else {
        console.error('Quiz generation failed:', result.error);
        // Fallback to basic questions if AI fails
        generateFallbackQuestions();
      }
    } catch (error) {
      console.error('Error generating AI quiz:', error);
      // Fallback to basic questions
      generateFallbackQuestions();
    }
  };

  // Fallback function for basic questions if AI fails
  const generateFallbackQuestions = () => {
    const questions: FillBlankQuestion[] = [];
    const shuffledVocab = [...vocabularyList].sort(() => Math.random() - 0.5);

    // Better fallback sentences based on actual vocabulary
    const fallbackTemplates = [
      "I need to ______ my appointment for tomorrow.",
      "The ______ of this book is very interesting.",
      "Please ______ your seatbelt before driving.",
      "She has a ______ personality that everyone likes.",
      "This ______ is really important for our project.",
      "Don't forget to ______ your phone when you leave.",
      "The ______ weather makes me feel great.",
      "I like to ______ my free time with friends.",
      "Please ______ your homework on time.",
      "The ______ of the mountain is breathtaking."
    ];

    for (let i = 0; i < Math.min(totalQuestions, shuffledVocab.length); i++) {
      const questionWord = shuffledVocab[i];
      const template = fallbackTemplates[i % fallbackTemplates.length];

      // Replace ______ with the word
      const sentence = template.replace('______', questionWord.word);

      questions.push({
        word: questionWord,
        sentence: sentence,
        correctAnswer: questionWord.word,
        explanation: `Điền từ "${questionWord.word}" có nghĩa là "${questionWord.meaning}"`
      });
    }

    setQuizQuestions(questions);
    setSelectedAnswers(new Array(questions.length).fill(""));
    console.log('✅ Generated fallback questions:', questions.length);
  };

  // --- LOGIC: XỬ LÝ CHỌN ĐÁP ÁN ---
  const handleCheckAnswer = () => {
    if (!quizQuestions[currentQuestionIndex]) return;

    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = userInput.trim();
    setSelectedAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserInput("");
    } else {
      setShowResults(true);
    }
  };

  const handleStartQuiz = () => {
    setQuizStarted(true);
    setCurrentQuestionIndex(0);
    setSelectedAnswers(new Array(quizQuestions.length).fill(""));
    setShowResults(false);
    setUserInput("");
  };

  const handleRestartQuiz = async () => {
    setQuizStarted(false);
    setShowResults(false);
    setShowCongratulation(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setUserInput("");

    // Regenerate questions
    if (vocabularyList.length > 0) {
      try {
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
            quizType: 'fill-blank'
          }),
        });

        const result = await response.json();

        if (result.success && result.quiz.questions) {
          const questions: FillBlankQuestion[] = result.quiz.questions.map((q: any) => ({
            word: vocabularyList.find(w => w.word.toLowerCase() === q.word.toLowerCase()),
            sentence: q.sentence,
            correctAnswer: q.correct_answer,
            explanation: q.explanation
          }));

          setQuizQuestions(questions);
          setSelectedAnswers(new Array(questions.length).fill(""));
        } else {
          generateFallbackQuestions();
        }
      } catch (error) {
        console.error('Error regenerating quiz:', error);
        generateFallbackQuestions();
      }
    }
  };

  const calculateScore = () => {
    return selectedAnswers.filter((answer, index) => {
      const question = quizQuestions[index];
      return answer && question?.correctAnswer && answer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
    }).length;
  };

  // Award XP when finishing quiz
  const awardXP = async () => {
    const correctAnswers = calculateScore();
    if (correctAnswers === 0) return; // Don't award XP if no correct answers

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Award 10 XP per correct answer with difficulty multiplier
      const baseXP = correctAnswers * 10;

      const response = await fetch('/api/user-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'practice_correct',
          xp: baseXP,
          difficulty: difficulty,
          source: 'fill_blank'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Refresh user profile to show updated XP
          fetchUserProfile();

          // Generate congratulation message
          const congratulation = generateCongratulationMessage(correctAnswers, quizQuestions.length, result.xpAwarded);

          setCongratulationData({
            correctCount: correctAnswers,
            totalQuestions: quizQuestions.length,
            xpEarned: result.xpAwarded,
            message: congratulation.message
          });
          setShowCongratulation(true);
        }
      }
    } catch (err) {
      console.error('Error awarding XP:', err);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark text-slate-500">
      Đang tải từ vựng...
    </div>
  );

  // Quiz Setup Screen
  if (!quizStarted) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-display">
          {/* Header / Navbar */}
          <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4 bg-white/50 dark:bg-black/20 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <div className="size-6 text-primary">
                <svg fill="currentColor" viewBox="0 0 48 48"><path d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z"></path></svg>
              </div>
              <h2 className="text-xl font-bold dark:text-white">VocabLearn</h2>
            </div>
            <nav className="hidden md:flex gap-8">
              <NavItem href="/" label="Home" />
              <NavItem href="/vocabulary" label="Tra từ" />
              <NavItem href="/my-vocabulary" label="Từ của tôi" />
              <NavItem href="/practice" label="Luyện tập" active />
              <NavItem href="/leaderboard" label="Bảng xếp hạng" />
            </nav>
            <div className="flex items-center gap-4">
              {user && userProfile && (
                <div className="hidden md:flex items-center gap-4 mr-4">
                  <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 rounded-full">
                    <span className="text-yellow-600 dark:text-yellow-400 text-sm">⭐</span>
                    <span className="text-yellow-800 dark:text-yellow-200 font-bold">
                      Level {userProfile.level}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                    <span className="text-blue-600 dark:text-blue-400 text-sm">⚡</span>
                    <span className="text-blue-800 dark:text-blue-200 font-bold">
                      {userProfile.xp} XP
                    </span>
                  </div>
                </div>
              )}
              {user ? (
                <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                  Đăng xuất
                </button>
              ) : (
                <Link href="/auth" className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90">
                  Đăng nhập
                </Link>
              )}
            </div>
          </header>

          <div className="layout-container flex h-full grow flex-col">
            <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-20 flex flex-1 justify-center py-5">
              <div className="layout-content-container flex flex-col max-w-[800px] flex-1 w-full">

                <main className="flex flex-col gap-8 mb-20">
                  <div className="flex flex-col gap-1">
                    <span className="px-2.5 py-1 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase">Fill in the Blank</span>
                    <h1 className="text-3xl font-black">Điền từ vào chỗ trống</h1>
                  </div>

                  <div className="bg-white dark:bg-[#1A2C32] rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800/50">
                    <h2 className="text-xl font-bold mb-6">Cài đặt bài tập</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div>
                        <label className="block text-sm font-medium mb-2">Số câu hỏi</label>
                        <select
                          value={totalQuestions}
                          onChange={(e) => setTotalQuestions(Number(e.target.value))}
                          className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                        >
                          <option value={5}>5 câu</option>
                          <option value={10}>10 câu</option>
                          <option value={15}>15 câu</option>
                          <option value={20}>20 câu</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Độ khó</label>
                        <select
                          value={difficulty}
                          onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                          className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                        >
                          <option value="easy">Dễ (câu đơn giản)</option>
                          <option value="medium">Trung bình (câu phức tạp hơn)</option>
                          <option value="hard">Khó (câu học thuật)</option>
                        </select>
                      </div>
                    </div>

                    <div className="text-center">
                      <button
                        onClick={handleStartQuiz}
                        disabled={vocabularyList.length === 0}
                        className="bg-primary text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {vocabularyList.length === 0 ? 'Không có từ vựng nào' : 'Bắt đầu làm bài'}
                      </button>
                    </div>
                  </div>
                </main>
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  // Results Screen
  if (showResults && !showCongratulation) {
    const score = calculateScore();
    const percentage = Math.round((score / quizQuestions.length) * 100);

    return (
      <AuthGuard>
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-display">
          {/* Header / Navbar */}
          <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4 bg-white/50 dark:bg-black/20 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <div className="size-6 text-primary">
                <svg fill="currentColor" viewBox="0 0 48 48"><path d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z"></path></svg>
              </div>
              <h2 className="text-xl font-bold dark:text-white">VocabLearn</h2>
            </div>
            <nav className="hidden md:flex gap-8">
              <NavItem href="/" label="Home" />
              <NavItem href="/vocabulary" label="Tra từ" />
              <NavItem href="/my-vocabulary" label="Từ của tôi" />
              <NavItem href="/practice" label="Luyện tập" active />
              <NavItem href="/leaderboard" label="Bảng xếp hạng" />
            </nav>
            <div className="flex items-center gap-4">
              {user && userProfile && (
                <div className="hidden md:flex items-center gap-4 mr-4">
                  <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 rounded-full">
                    <span className="text-yellow-600 dark:text-yellow-400 text-sm">⭐</span>
                    <span className="text-yellow-800 dark:text-yellow-200 font-bold">
                      Level {userProfile.level}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                    <span className="text-blue-600 dark:text-blue-400 text-sm">⚡</span>
                    <span className="text-blue-800 dark:text-blue-200 font-bold">
                      {userProfile.xp} XP
                    </span>
                  </div>
                </div>
              )}
              {user ? (
                <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                  Đăng xuất
                </button>
              ) : (
                <Link href="/auth" className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90">
                  Đăng nhập
                </Link>
              )}
            </div>
          </header>

          <div className="layout-container flex h-full grow flex-col">
            <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-20 flex flex-1 justify-center py-5">
              <div className="layout-content-container flex flex-col max-w-[800px] flex-1 w-full">

                <main className="flex flex-col gap-8 mb-20">
                  <div className="flex flex-col gap-1">
                    <span className="px-2.5 py-1 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase">Kết quả</span>
                    <h1 className="text-3xl font-black">Hoàn thành bài tập</h1>
                  </div>

                  <div className="bg-white dark:bg-[#1A2C32] rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800/50 text-center">
                    <div className="mb-8">
                      <div className="text-6xl font-black text-primary mb-4">{percentage}%</div>
                      <p className="text-xl text-slate-600 dark:text-slate-400">
                        {score} / {quizQuestions.length} câu đúng
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      <button
                        onClick={handleRestartQuiz}
                        className="bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:scale-105 transition-transform"
                      >
                        Làm lại bài tập
                      </button>
                      <Link
                        href="/practice"
                        className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-center"
                      >
                        Về trang bài tập
                      </Link>
                    </div>
                  </div>
                </main>
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  // Quiz Question Screen
  const currentQuestion = quizQuestions[currentQuestionIndex];
  const currentAnswer = selectedAnswers[currentQuestionIndex];
  const isAnswered = currentAnswer !== "";
  const isCorrect = isAnswered && currentQuestion?.correctAnswer && currentAnswer.toLowerCase().trim() === currentQuestion.correctAnswer.toLowerCase().trim();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background-light dark:bg-background-dark font-display">
        {/* Header / Navbar */}
        <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4 bg-white/50 dark:bg-black/20 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="size-6 text-primary">
              <svg fill="currentColor" viewBox="0 0 48 48"><path d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z"></path></svg>
            </div>
            <h2 className="text-xl font-bold dark:text-white">VocabLearn</h2>
          </div>
          <nav className="hidden md:flex gap-8">
            <NavItem href="/" label="Home" />
            <NavItem href="/vocabulary" label="Tra từ" />
            <NavItem href="/my-vocabulary" label="Từ của tôi" />
            <NavItem href="/practice" label="Luyện tập" active />
            <NavItem href="/leaderboard" label="Bảng xếp hạng" />
          </nav>
          <div className="flex items-center gap-4">
            {user && userProfile && (
              <div className="hidden md:flex items-center gap-4 mr-4">
                <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 rounded-full">
                  <span className="text-yellow-600 dark:text-yellow-400 text-sm">⭐</span>
                  <span className="text-yellow-800 dark:text-yellow-200 font-bold">
                    Level {userProfile.level}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                  <span className="text-blue-600 dark:text-blue-400 text-sm">⚡</span>
                  <span className="text-blue-800 dark:text-blue-200 font-bold">
                    {userProfile.xp} XP
                  </span>
                </div>
              </div>
            )}
            {user ? (
              <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                Đăng xuất
              </button>
            ) : (
              <Link href="/auth" className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90">
                Đăng nhập
              </Link>
            )}
          </div>
        </header>

        <div className="layout-container flex h-full grow flex-col">
          <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-20 flex flex-1 justify-center py-5">
            <div className="layout-content-container flex flex-col max-w-[800px] flex-1 w-full">

              {/* --- HEADER --- */}
              <header className="sticky top-20 z-50 flex items-center justify-between border border-solid border-slate-200 dark:border-slate-800 px-6 py-3 rounded-2xl bg-white/80 dark:bg-[#1A2C32]/80 backdrop-blur-md shadow-sm mb-8">
                <div className="flex items-center gap-4">
                  <Link href="/practice" className="size-8 text-primary">
                    <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                      <path clipRule="evenodd" d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fill="currentColor" fillRule="evenodd"></path>
                    </svg>
                  </Link>
                  <h2 className="text-slate-800 dark:text-slate-100 text-lg font-bold leading-tight">VocabMaster</h2>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-bold text-slate-400">
                    {currentQuestionIndex + 1}/{quizQuestions.length}
                  </span>
                </div>
              </header>

              <main className="flex flex-col gap-8 mb-20">
                {/* Tiêu đề bài tập */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase">Fill in the Blank</span>
                  </div>
                  <h1 className="text-3xl font-black">Điền từ vào chỗ trống</h1>
                </div>

                {/* CARD BÀI TẬP CHÍNH */}
                <div className="bg-white dark:bg-[#1A2C32] rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-100 dark:border-slate-800/50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <span className="material-symbols-outlined text-[220px] text-purple-900 dark:text-purple-100">edit_note</span>
                  </div>

                  <div className="relative z-10 flex flex-col gap-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="inline-flex items-center gap-2 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider self-start">
                        Câu hỏi {currentQuestionIndex + 1}/{quizQuestions.length}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 text-sm font-bold bg-slate-50 dark:bg-slate-800/50 px-3 py-1 rounded-lg self-start sm:self-auto">
                        <span className="material-symbols-outlined text-[18px]">school</span>
                        <span>{currentQuestion?.word?.meaning}</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-black/20 p-8 sm:p-12 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center sm:text-left group">
                      <p className="text-2xl sm:text-3xl leading-loose text-slate-700 dark:text-slate-300 font-serif">
                        {currentQuestion?.sentence.split('______')[0]}
                        <span className="relative inline-block mx-1 sm:mx-2">
                          <input
                            autoFocus
                            className={`w-[180px] sm:w-[220px] bg-white dark:bg-slate-800 border-b-4 text-center px-4 py-1 rounded-lg shadow-sm focus:outline-none transition-all
                              ${!isAnswered ? 'border-purple-300 text-purple-600' : ''}
                              ${isAnswered && isCorrect ? 'border-green-500 text-green-600 ring-4 ring-green-100' : ''}
                              ${isAnswered && !isCorrect ? 'border-red-500 text-red-600 ring-4 ring-red-100' : ''}
                            `}
                            placeholder="điền từ..."
                            type="text"
                            value={userInput}
                            onChange={(e) => {
                              setUserInput(e.target.value);
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && !isAnswered && handleCheckAnswer()}
                            disabled={isAnswered}
                          />
                        </span>
                        {currentQuestion?.sentence.split('______')[1]}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-slate-100 dark:border-slate-800/50 mt-2">
                      {!isAnswered ? (
                        <button
                          onClick={() => setUserInput(currentQuestion?.correctAnswer)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-sm font-bold uppercase tracking-wider px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-full sm:w-auto"
                        >
                          Hiện đáp án
                        </button>
                      ) : (
                        <div className="text-sm text-slate-500">
                          Đáp án đúng: <strong className="text-green-600">{currentQuestion?.correctAnswer}</strong>
                        </div>
                      )}

                      {!isAnswered ? (
                        <button
                          onClick={handleCheckAnswer}
                          disabled={!userInput.trim()}
                          className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-8 sm:px-12 py-3 sm:py-4 rounded-xl font-bold shadow-lg shadow-purple-600/25 transition-all active:scale-95 flex items-center justify-center gap-2 text-lg group disabled:cursor-not-allowed"
                        >
                          Kiểm tra đáp án
                          <span className="material-symbols-outlined text-[24px] group-hover:translate-x-1 transition-transform">check</span>
                        </button>
                      ) : (
                        <button
                          onClick={handleNextQuestion}
                          className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-8 sm:px-12 py-3 sm:py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 text-lg transition-all"
                        >
                          {currentQuestionIndex < quizQuestions.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả'}
                          <span className="material-symbols-outlined">arrow_forward</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>

      {/* Congratulation Popup */}
      {showCongratulation && congratulationData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-2xl border-4 border-primary text-center max-w-sm animate-bounce-in">
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
              {(() => {
                const percentage = (congratulationData.correctCount / congratulationData.totalQuestions) * 100;
                if (percentage === 100) return 'Tuyệt vời!';
                if (percentage >= 80) return 'Xuất sắc!';
                if (percentage >= 60) return 'Tốt lắm!';
                return 'Cố gắng thêm!';
              })()}
            </h2>

            <div className="bg-primary/10 py-4 rounded-2xl mb-6">
              <p className="text-sm font-bold text-primary uppercase tracking-widest">Bạn nhận được</p>
              <p className="text-5xl font-black text-primary">+{congratulationData.xpEarned} XP</p>
              <p className="text-xs text-slate-500 mt-1">
                {congratulationData.correctCount}/{congratulationData.totalQuestions} câu đúng
              </p>
            </div>

            <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">
              Điểm đã được cộng vào hồ sơ cá nhân và cập nhật trên Bảng xếp hạng!
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCongratulation(false);
                  setShowResults(true);
                }}
                className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-bold hover:scale-105 transition-transform"
              >
                Xem kết quả
              </button>
              <button
                onClick={() => window.location.href = '/leaderboard'}
                className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
              >
                Bảng xếp hạng
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}