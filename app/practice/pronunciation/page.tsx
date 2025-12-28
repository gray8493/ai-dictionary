// src/app/practice/pronunciation/page.tsx
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

interface PronunciationQuestion {
  word: any;
}

export default function PronunciationPage() {
  // --- STATES ---
  const [vocabularyList, setVocabularyList] = useState<any[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<PronunciationQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [recognizedText, setRecognizedText] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<number[]>([]);
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
    const questions: PronunciationQuestion[] = [];
    const shuffledVocab = [...vocabList].sort(() => Math.random() - 0.5);

    for (let i = 0; i < Math.min(totalQuestions, shuffledVocab.length); i++) {
      questions.push({
        word: shuffledVocab[i]
      });
    }

    setQuizQuestions(questions);
    setScores(new Array(questions.length).fill(0));
  };

  // --- LOGIC: XỬ LÝ CHỌN ĐÁP ÁN ---
  const handleNextQuestion = () => {
    const newScores = [...scores];
    newScores[currentQuestionIndex] = score || 0;
    setScores(newScores);

    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setScore(null);
      setRecognizedText("");
    } else {
      setShowResults(true);
    }
  };

  const handleStartQuiz = () => {
    setQuizStarted(true);
    setCurrentQuestionIndex(0);
    setScores(new Array(quizQuestions.length).fill(0));
    setShowResults(false);
    setScore(null);
    setRecognizedText("");
  };

  const handleRestartQuiz = () => {
    setQuizStarted(false);
    setShowResults(false);
    setCurrentQuestionIndex(0);
    setScores([]);
    setScore(null);
    setRecognizedText("");
    generateQuizQuestions(vocabularyList);
  };

  const calculateFinalScore = () => {
    const totalScore = scores.reduce((sum, score) => sum + score, 0);
    return Math.round(totalScore / scores.length);
  };

  // Award XP when finishing quiz
  const awardXP = async () => {
    const finalScore = calculateFinalScore();
    if (finalScore === 0) return; // Don't award XP if score is 0

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Award XP based on pronunciation score (max 100% per question, average across all questions)
      const baseXP = Math.round(finalScore * quizQuestions.length / 10); // 10 XP per 10% accuracy

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
          source: 'pronunciation'
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

  // --- LOGIC: PHÁT ÂM MẪU (TEXT-TO-SPEECH) ---
  const playSample = () => {
    const currentQuestion = quizQuestions[currentQuestionIndex];
    if (!currentQuestion) return;
    const utterance = new SpeechSynthesisUtterance(currentQuestion.word.word);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  // --- LOGIC: GHI ÂM & CHẤM ĐIỂM (SPEECH-TO-TEXT) ---
  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói. Hãy dùng Chrome hoặc Edge.");
      return;
    }

    const currentQuestion = quizQuestions[currentQuestionIndex];
    if (!currentQuestion) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      setRecognizedText(transcript);

      const target = currentQuestion.word.word.toLowerCase().trim();

      if (transcript === target) {
        setScore(100);
      } else if (transcript.includes(target) || target.includes(transcript)) {
        setScore(85);
      } else {
        setScore(Math.floor(Math.random() * 30) + 10);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Lỗi ghi âm:", event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
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
              <h2 className="text-xl font-bold dark:text-white">voca.ai</h2>
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
                    <span className="px-2.5 py-1 rounded-md bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 text-xs font-bold uppercase">Pronunciation</span>
                    <h1 className="text-3xl font-black">Luyện tập phát âm</h1>
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
                          <option value="medium">Trung bình (từ thông dụng)</option>
                          <option value="hard">Khó (từ phức tạp)</option>
                        </select>
                      </div>
                    </div>

                    <div className="text-center">
                      <button
                        onClick={handleStartQuiz}
                        disabled={vocabularyList.length === 0}
                        className="bg-primary text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {vocabularyList.length === 0 ? 'Không có từ vựng nào' : 'Bắt đầu luyện tập'}
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
    const finalScore = calculateFinalScore();

    return (
      <AuthGuard>
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-display">
          {/* Header / Navbar */}
          <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4 bg-white/50 dark:bg-black/20 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <div className="size-6 text-primary">
                <svg fill="currentColor" viewBox="0 0 48 48"><path d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z"></path></svg>
              </div>
              <h2 className="text-xl font-bold dark:text-white">voca.ai</h2>
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
                    <span className="px-2.5 py-1 rounded-md bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 text-xs font-bold uppercase">Kết quả</span>
                    <h1 className="text-3xl font-black">Hoàn thành bài tập phát âm</h1>
                  </div>

                  <div className="bg-white dark:bg-[#1A2C32] rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800/50 text-center">
                    <div className="mb-8">
                      <div className="text-6xl font-black text-primary mb-4">{finalScore}%</div>
                      <p className="text-xl text-slate-600 dark:text-slate-400">
                        Điểm trung bình của {quizQuestions.length} từ
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      <button
                        onClick={handleRestartQuiz}
                        className="bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:scale-105 transition-transform"
                      >
                        Luyện tập lại
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

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background-light dark:bg-background-dark font-display">
        {/* Header / Navbar */}
        <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4 bg-white/50 dark:bg-black/20 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="size-6 text-primary">
              <svg fill="currentColor" viewBox="0 0 48 48"><path d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z"></path></svg>
            </div>
            <h2 className="text-xl font-bold dark:text-white">voca.ai</h2>
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
                    <span className="px-2.5 py-1 rounded-md bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 text-xs font-bold uppercase">Pronunciation</span>
                  </div>
                  <h1 className="text-3xl font-black">Luyện tập phát âm</h1>
                </div>

                {/* CARD GHI ÂM CHÍNH */}
                <div className="bg-white dark:bg-[#1A2C32] rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden flex flex-col min-h-[500px] justify-center text-center">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <span className="material-symbols-outlined text-[240px]">graphic_eq</span>
                  </div>

                  <div className="relative z-10 flex flex-col items-center gap-8 py-4">
                    <div className="bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                      Phát âm từ dưới đây
                    </div>

                    <div className="flex flex-col items-center gap-4">
                      <h3 className="text-5xl sm:text-7xl font-black text-slate-900 dark:text-white tracking-tighter">
                        {currentQuestion?.word?.word || "Success"}
                      </h3>
                      <p className="text-lg text-slate-400 font-medium italic">{currentQuestion?.word?.ipa || "/səkˈses/"}</p>
                    </div>

                    {/* NÚT NGHE MẪU */}
                    <button
                      onClick={playSample}
                      className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-all active:scale-95 group"
                    >
                      <div className="size-8 flex items-center justify-center rounded-full bg-white dark:bg-slate-600 text-teal-500 shadow-sm">
                        <span className="material-symbols-outlined text-[20px]">volume_up</span>
                      </div>
                      <span className="font-bold text-slate-600 dark:text-slate-300 text-sm">Nghe phát âm mẫu</span>
                    </button>

                    <div className="flex flex-col items-center w-full max-w-md gap-8 mt-4">
                      {/* NÚT MIC VỚI HIỆU ỨNG WAVE */}
                      <div className="relative flex items-center justify-center">
                        {isRecording && (
                          <>
                            <div className="absolute size-32 rounded-full border border-teal-500/20 animate-ping"></div>
                            <div className="absolute size-40 rounded-full border border-teal-500/10 animate-ping" style={{animationDelay: '0.5s'}}></div>
                          </>
                        )}
                        <button
                          onClick={startRecording}
                          disabled={score !== null}
                          className={`relative z-10 size-24 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                            ${isRecording ? 'bg-red-500 shadow-red-500/30' : 'bg-gradient-to-br from-teal-400 to-teal-600 shadow-teal-500/30 hover:scale-110'}
                          `}
                        >
                          <span className="material-symbols-outlined text-[40px] text-white">
                            {isRecording ? 'stop' : 'mic'}
                          </span>
                        </button>
                      </div>

                      {/* HIỂN THỊ KẾT QUẢ CHẤM ĐIỂM */}
                      {score !== null && (
                        <div className={`w-full border rounded-2xl p-5 flex items-center gap-5 shadow-sm animate-in fade-in slide-in-from-bottom-4 transition-all
                          ${score >= 80 ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800/50' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/50'}`}
                        >
                          <div className={`size-14 rounded-full flex items-center justify-center shrink-0 ring-4 ring-white dark:ring-[#1A2C32]
                            ${score >= 80 ? 'bg-green-100 text-green-600 dark:text-green-400' : 'bg-red-100 text-red-600 dark:text-red-400'}`}
                          >
                            <span className="material-symbols-outlined text-[32px]">
                              {score >= 80 ? 'check_circle' : 'error'}
                            </span>
                          </div>
                          <div className="flex-1 text-left">
                            <p className={`font-bold text-lg ${score >= 80 ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
                              {score >= 80 ? 'Tuyệt vời!' : 'Hãy thử lại nhé!'}
                            </p>
                            <p className="text-sm font-medium opacity-80 italic">Máy nghe được: "{recognizedText}"</p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-baseline">
                              <span className={`text-4xl font-black ${score >= 80 ? 'text-green-600' : 'text-red-600'}`}>{score}</span>
                              <span className="text-lg font-bold opacity-60">%</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ĐIỀU HƯỚNG */}
                    <div className="flex flex-col sm:flex-row justify-center w-full mt-2 gap-4">
                      <button
                        onClick={() => {
                          setScore(null);
                          setRecognizedText("");
                        }}
                        className="text-slate-400 hover:text-slate-600 font-bold px-8 py-3 transition-colors flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[20px]">replay</span> Thử lại
                      </button>
                      <button
                        onClick={handleNextQuestion}
                        disabled={score === null}
                        className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-3 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {currentQuestionIndex < quizQuestions.length - 1 ? 'Từ tiếp theo' : 'Xem kết quả'}
                        <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                      </button>
                    </div>
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
