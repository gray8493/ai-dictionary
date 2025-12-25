// src/app/practice/meaning-quiz/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function MeaningQuizPage() {
  // --- STATES ---
  const [currentWord, setCurrentWord] = useState<any>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // --- LOGIC: LẤY DỮ LIỆU TỪ DATABASE ---
  useEffect(() => {
    const loadQuizData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Lấy 1 từ ngẫu nhiên của User để làm câu hỏi
      const { data: vocabData } = await supabase
        .from('vocabularies')
        .select('*')
        .eq('user_id', user.id);

      if (vocabData && vocabData.length > 0) {
        const randomIndex = Math.floor(Math.random() * vocabData.length);
        const questionWord = vocabData[randomIndex];
        setCurrentWord(questionWord);

        // 2. Tạo 3 phương án nhiễu (sai) từ các từ khác trong list
        const distractors = vocabData
          .filter((v: any) => v.id !== questionWord.id)
          .map((v: any) => v.meaning)
          .slice(0, 3);

        // Nếu không đủ 3 từ khác, thêm các nghĩa giả
        while (distractors.length < 3) {
          distractors.push("Nghĩa giả " + (distractors.length + 1));
        }

        // 3. Trộn đáp án đúng và đáp án sai
        const allOptions = [...distractors, questionWord.meaning].sort(() => Math.random() - 0.5);
        setOptions(allOptions);
      }
      setLoading(false);
    };

    loadQuizData();
  }, []);

  // --- LOGIC: KIỂM TRA ĐÁP ÁN ---
  const handleSelect = (option: string) => {
    if (selectedOption !== null) return; // Ngăn chọn lại sau khi đã có kết quả
    setSelectedOption(option);
    setIsCorrect(option === currentWord.meaning);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center dark:bg-background-dark dark:text-white">Đang chuẩn bị câu hỏi...</div>;

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-white antialiased font-display">
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-20 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[800px] flex-1 w-full">
            
            {/* --- HEADER --- */}
            <header className="sticky top-4 z-50 flex items-center justify-between border border-solid border-slate-200 dark:border-slate-800 px-6 py-3 rounded-2xl bg-white/80 dark:bg-[#1A2C32]/80 backdrop-blur-md shadow-sm mb-8">
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
                  <div className="h-full bg-primary w-1/3"></div>
                </div>
                <span className="text-xs font-bold text-slate-400">350 XP</span>
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
                  {currentWord?.word}
                </h2>
                <p className="text-slate-400 font-medium italic mb-8">{currentWord?.ipa}</p>

                {/* DANH SÁCH ĐÁP ÁN */}
                <div className="grid grid-cols-1 gap-3 text-left">
                  {options.map((option, index) => {
                    // Logic màu sắc khi chọn
                    let btnStyle = "border-slate-100 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50/50";
                    if (selectedOption === option) {
                      btnStyle = isCorrect ? "border-green-500 bg-green-50 dark:bg-green-900/20" : "border-red-500 bg-red-50 dark:bg-red-900/20";
                    } else if (selectedOption !== null && option === currentWord.meaning) {
                      btnStyle = "border-green-500 bg-green-50 dark:bg-green-900/20"; // Hiện đáp án đúng nếu lỡ chọn sai
                    }

                    return (
                      <button
                        key={index}
                        onClick={() => handleSelect(option)}
                        disabled={selectedOption !== null}
                        className={`w-full p-5 rounded-2xl border-2 font-bold text-lg transition-all flex justify-between items-center ${btnStyle}`}
                      >
                        <span>{option}</span>
                        {selectedOption === option && (
                          <span className={`material-symbols-outlined ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                            {isCorrect ? 'check_circle' : 'cancel'}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* NÚT TIẾP THEO */}
                {selectedOption !== null && (
                  <div className="mt-8 flex justify-center">
                    <button 
                      onClick={() => window.location.reload()} 
                      className="bg-primary text-white px-10 py-4 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:scale-105 transition-transform flex items-center gap-2"
                    >
                      Câu tiếp theo <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}