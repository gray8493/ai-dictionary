"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function FillInBlankPage() {
  // --- STATES ---
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [userInput, setUserInput] = useState("");
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [loading, setLoading] = useState(true);

  // --- LOGIC: LẤY CÂU HỎI TỪ DATABASE ---
  const loadQuestion = async () => {
    setLoading(true);
    setStatus('idle');
    setUserInput("");
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Lấy 1 từ vựng ngẫu nhiên từ Database
    const { data } = await supabase
      .from('vocabularies')
      .select('*')
      .eq('user_id', user.id);

    if (data && data.length > 0) {
      const randomWord = data[Math.floor(Math.random() * data.length)];
      setCurrentQuestion(randomWord);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadQuestion();
  }, []);

  // --- LOGIC: KIỂM TRA ĐÁP ÁN ---
  const handleCheckAnswer = () => {
    if (!currentQuestion) return;

    const isRight = userInput.toLowerCase().trim() === currentQuestion.word.toLowerCase().trim();
    setStatus(isRight ? 'correct' : 'wrong');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark text-slate-500">
      Đang chuẩn bị bài tập...
    </div>
  );

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-white antialiased font-display">
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-20 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[800px] flex-1 w-full">
            
            {/* HEADER */}
            <header className="sticky top-4 z-50 flex items-center justify-between border border-solid border-slate-200 dark:border-slate-800 px-6 py-3 rounded-2xl bg-white/80 dark:bg-[#1A2C32]/80 backdrop-blur-md shadow-sm mb-8">
              <div className="flex items-center gap-4">
                <Link href="/practice" className="size-8 text-primary">
                  <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fill="currentColor" fillRule="evenodd"></path>
                  </svg>
                </Link>
                <h2 className="text-slate-800 dark:text-slate-100 text-lg font-bold tracking-tight">VocabMaster</h2>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <div className="h-2 w-32 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-2/3 rounded-full"></div>
                </div>
                <span className="text-xs font-semibold text-slate-500">850 XP</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-gray-300 rounded-full size-10 bg-cover" style={{backgroundImage: 'url("https://ui-avatars.com/api/?name=User")'}}></div>
              </div>
            </header>

            <main className="flex flex-col gap-6 mb-20">
              <div className="flex flex-col sm:flex-row items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-1 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider">Exercise</span>
                    <span className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">• Personalized Review</span>
                  </div>
                  <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-tight">Fill in the Blank</h1>
                </div>
                <div className="w-full sm:w-1/3 flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <span>Lesson Progress</span>
                    <span>2/5</span>
                  </div>
                  <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 transition-all duration-500 ease-out" style={{ width: "40%" }}></div>
                  </div>
                </div>
              </div>

              {/* CARD BÀI TẬP CHÍNH */}
              <div className="bg-white dark:bg-[#1A2C32] rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-100 dark:border-slate-800/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <span className="material-symbols-outlined text-[220px] text-purple-900 dark:text-purple-100">edit_note</span>
                </div>

                <div className="relative z-10 flex flex-col gap-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="inline-flex items-center gap-2 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider self-start">
                      Question 3/5
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 text-sm font-bold bg-slate-50 dark:bg-slate-800/50 px-3 py-1 rounded-lg self-start sm:self-auto">
                      <span className="material-symbols-outlined text-[18px]">timer</span>
                      <span>00:45</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
                      Fill in the blank with the word that means: <strong className="text-slate-900 dark:text-white italic">"{currentQuestion?.meaning}"</strong>
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-black/20 p-8 sm:p-12 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center sm:text-left group">
                    <p className="text-2xl sm:text-3xl leading-loose text-slate-700 dark:text-slate-300 font-serif">
                      "This concept is highly
                      <span className="relative inline-block mx-1 sm:mx-2">
                        <input 
                          autoFocus
                          className={`w-[180px] sm:w-[220px] bg-white dark:bg-slate-800 border-b-4 text-center px-4 py-1 rounded-lg shadow-sm focus:outline-none transition-all
                            ${status === 'idle' ? 'border-purple-300 text-purple-600' : ''}
                            ${status === 'correct' ? 'border-green-500 text-green-600 ring-4 ring-green-100' : ''}
                            ${status === 'wrong' ? 'border-red-500 text-red-600 ring-4 ring-red-100' : ''}
                          `}
                          placeholder="type here..." 
                          type="text"
                          value={userInput}
                          onChange={(e) => {
                            setUserInput(e.target.value);
                            setStatus('idle');
                          }}
                          onKeyDown={(e) => e.key === 'Enter' && handleCheckAnswer()}
                        />
                      </span>
                      and hard to define."
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-slate-100 dark:border-slate-800/50 mt-2">
                    <button 
                      onClick={() => setUserInput(currentQuestion?.word)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-sm font-bold uppercase tracking-wider px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-full sm:w-auto"
                    >
                      Show Answer
                    </button>
                    
                    {status === 'correct' ? (
                      <button 
                        onClick={loadQuestion}
                        className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-8 sm:px-12 py-3 sm:py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 text-lg transition-all"
                      >
                        Next Word
                        <span className="material-symbols-outlined">arrow_forward</span>
                      </button>
                    ) : (
                      <button 
                        onClick={handleCheckAnswer}
                        className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-8 sm:px-12 py-3 sm:py-4 rounded-xl font-bold shadow-lg shadow-purple-600/25 transition-all active:scale-95 flex items-center justify-center gap-2 text-lg group"
                      >
                        Check Answer
                        <span className="material-symbols-outlined text-[24px] group-hover:translate-x-1 transition-transform">check</span>
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
  );
}