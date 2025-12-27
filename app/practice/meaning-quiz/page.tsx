// src/app/practice/meaning-quiz/page.tsx
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

interface QuizQuestion {
  word: any;
  options: string[];
  correctAnswer: string;
}

export default function MeaningQuizPage() {
  // --- STATES ---
  const [vocabularyList, setVocabularyList] = useState<any[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(string | null)[]>([]);
  const [showResults, setShowResults] = useState(false);
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

      // 1. Lấy tất cả từ vựng của user
      const { data: vocabData } = await supabase
        .from('vocabularies')
        .select('*')
        .eq('user_id', user.id);

      if (vocabData && vocabData.length > 0) {
        setVocabularyList(vocabData);
        // Generate quiz questions based on settings
        generateQuizQuestions(vocabData);
      }
      setLoading(false);
    };

    loadVocabularyData();
  }, [totalQuestions, difficulty]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // --- LOGIC: TẠO CÂU HỎI QUIZ ---
  const generateQuizQuestions = (vocabList: any[]) => {
    const questions: QuizQuestion[] = [];
    const shuffledVocab = [...vocabList].sort(() => Math.random() - 0.5);

    for (let i = 0; i < Math.min(totalQuestions, shuffledVocab.length); i++) {
      const questionWord = shuffledVocab[i];

      // Tạo phương án nhiễu dựa trên độ khó
      let distractorCount = 3;
      if (difficulty === 'easy') distractorCount = 2;
      if (difficulty === 'hard') distractorCount = 4;

      const distractors = vocabList
        .filter((v: any) => v.id !== questionWord.id)
        .map((v: any) => v.meaning)
        .slice(0, distractorCount);

      // Nếu không đủ từ khác, thêm nghĩa giả
      while (distractors.length < distractorCount) {
        distractors.push("Nghĩa giả " + (distractors.length + 1));
      }

      // Trộn đáp án
      const allOptions = [...distractors, questionWord.meaning].sort(() => Math.random() - 0.5);

      questions.push({
        word: questionWord,
        options: allOptions,
        correctAnswer: questionWord.meaning
      });
    }

    setQuizQuestions(questions);
    setSelectedAnswers(new Array(questions.length).fill(null));
  };

  // --- LOGIC: XỬ LÝ CHỌN ĐÁP ÁN ---
  const handleSelectAnswer = (questionIndex: number, option: string) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[questionIndex] = option;
    setSelectedAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShowResults(true);
    }
  };

  const handleStartQuiz = () => {
    setQuizStarted(true);
    setCurrentQuestionIndex(0);
    setSelectedAnswers(new Array(quizQuestions.length).fill(null));
    setShowResults(false);
  };

  const handleRestartQuiz = () => {
    setQuizStarted(false);
    setShowResults(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    generateQuizQuestions(vocabularyList);
  };

  const calculateScore = () => {
    return selectedAnswers.filter((answer, index) =>
      answer === quizQuestions[index]?.correctAnswer
    ).length;
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
          source: 'meaning_quiz'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Refresh user profile to show updated XP
          fetchUserProfile();
          console.log(`Chúc mừng! Bạn nhận được ${result.xpAwarded} XP!`);
        }
      }
    } catch (err) {
      console.error('Error awarding XP:', err);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center dark:bg-background-dark dark:text-white">Đang tải từ vựng...</div>;

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
                <header className="sticky top-4 z-50 flex items-center justify-between border border-solid border-slate-200 dark:border-slate-800 px-6 py-3 rounded-2xl bg-white/80 dark:bg-[#1A2C32]/80 backdrop-blur-md shadow-sm mb-8">
                  <div className="flex items-center gap-4">
                    <Link href="/practice" className="size-8 text-primary">
                      <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                        <path clipRule="evenodd" d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fill="currentColor" fillRule="evenodd"></path>
                      </svg>
                    </Link>
                    <h2 className="text-slate-800 dark:text-slate-100 text-lg font-bold leading-tight">VocabMaster</h2>
                  </div>
                </header>

                <main className="flex flex-col gap-8 mb-20">
                  <div className="flex flex-col gap-1">
                    <span className="px-2.5 py-1 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase">Meaning Quiz</span>
                    <h1 className="text-3xl font-black">Thi đoán nghĩa từ vựng</h1>
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
                          <option value="easy">Dễ (3 lựa chọn)</option>
                          <option value="medium">Trung bình (4 lựa chọn)</option>
                          <option value="hard">Khó (5 lựa chọn)</option>
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
  if (showResults) {
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
                    <span className="px-2.5 py-1 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase">Kết quả</span>
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
                    <span className="px-2.5 py-1 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase">Meaning Quiz</span>
                  </div>
                  <h1 className="text-3xl font-black">Chọn nghĩa đúng</h1>
                </div>

                {/* THẺ CÂU HỎI CHÍNH */}
                <div className="bg-white dark:bg-[#1A2C32] rounded-3xl p-10 shadow-sm border border-slate-100 dark:border-slate-800/50 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <span className="material-symbols-outlined text-[150px] text-blue-900">quiz</span>
                  </div>

                  <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-widest mb-4">Từ vựng này có nghĩa là gì?</p>
                  <h2 className="text-5xl font-black text-primary mb-2 tracking-tight uppercase">
                    {currentQuestion?.word?.word}
                  </h2>
                  <p className="text-slate-400 font-medium italic mb-8">{currentQuestion?.word?.ipa}</p>

                  {/* DANH SÁCH ĐÁP ÁN */}
                  <div className="grid grid-cols-1 gap-3 text-left">
                    {currentQuestion?.options.map((option, index) => {
                      let btnStyle = "border-slate-100 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50/50";
                      const isSelected = currentAnswer === option;
                      const isCorrect = option === currentQuestion.correctAnswer;

                      if (isSelected) {
                        btnStyle = isCorrect ? "border-green-500 bg-green-50 dark:bg-green-900/20" : "border-red-500 bg-red-50 dark:bg-red-900/20";
                      } else if (currentAnswer !== null && isCorrect) {
                        btnStyle = "border-green-500 bg-green-50 dark:bg-green-900/20";
                      }

                      return (
                        <button
                          key={index}
                          onClick={() => handleSelectAnswer(currentQuestionIndex, option)}
                          disabled={currentAnswer !== null}
                          className={`w-full p-5 rounded-2xl border-2 font-bold text-lg transition-all flex justify-between items-center ${btnStyle}`}
                        >
                          <span>{option}</span>
                          {isSelected && (
                            <span className={`material-symbols-outlined ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                              {isCorrect ? 'check_circle' : 'cancel'}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* NÚT TIẾP THEO */}
                  {currentAnswer !== null && (
                    <div className="mt-8 flex justify-center">
                      <button
                        onClick={handleNextQuestion}
                        className="bg-primary text-white px-10 py-4 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:scale-105 transition-transform flex items-center gap-2"
                      >
                        {currentQuestionIndex < quizQuestions.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả'}
                        <span className="material-symbols-outlined">arrow_forward</span>
                      </button>
                    </div>
                  )}
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}