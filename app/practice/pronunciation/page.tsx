// src/app/practice/pronunciation/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function PronunciationPage() {
  // --- CÁC TRẠNG THÁI (STATES) ---
  const [currentWord, setCurrentWord] = useState<any>(null); // Từ vựng hiện tại
  const [isRecording, setIsRecording] = useState(false);     // Trạng thái đang ghi âm
  const [score, setScore] = useState<number | null>(null);   // Điểm số phát âm
  const [recognizedText, setRecognizedText] = useState("");   // Văn bản máy nghe được
  const [loading, setLoading] = useState(true);              // Trạng thái tải dữ liệu

  // --- 1. LOGIC: LẤY DỮ LIỆU TỪ SUPABASE ---
  const loadQuestion = async () => {
    setLoading(true);
    setScore(null);
    setRecognizedText("");
    
    // Lấy thông tin user hiện tại
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Lấy danh sách từ vựng của user đó
    const { data } = await supabase
      .from('vocabularies')
      .select('*')
      .eq('user_id', user.id);

    if (data && data.length > 0) {
      // Chọn ngẫu nhiên 1 từ để luyện tập
      const randomWord = data[Math.floor(Math.random() * data.length)];
      setCurrentWord(randomWord);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadQuestion();
  }, []);

  // --- 2. LOGIC: PHÁT ÂM MẪU (TEXT-TO-SPEECH) ---
  const playSample = () => {
    if (!currentWord) return;
    const utterance = new SpeechSynthesisUtterance(currentWord.word);
    utterance.lang = 'en-US'; // Thiết lập giọng đọc tiếng Anh
    window.speechSynthesis.speak(utterance);
  };

  // --- 3. LOGIC: GHI ÂM & CHẤM ĐIỂM (SPEECH-TO-TEXT) ---
  const startRecording = () => {
    // Kiểm tra trình duyệt có hỗ trợ API không
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói. Hãy dùng Chrome hoặc Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false; // Chỉ lấy kết quả cuối cùng
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      // Lấy văn bản máy nghe được
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      setRecognizedText(transcript);
      
      // Lấy từ gốc trong Database
      const target = currentWord.word.toLowerCase().trim();

      // Thuật toán chấm điểm cơ bản
      if (transcript === target) {
        setScore(100); // Khớp hoàn toàn
      } else if (transcript.includes(target) || target.includes(transcript)) {
        setScore(85);  // Gần đúng
      } else {
        // Sai hoặc phát âm không rõ: Random điểm thấp từ 10-40 để khích lệ
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

    // Bắt đầu lắng nghe
    recognition.start();
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark text-slate-500">
      Đang chuẩn bị micro...
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
                <h2 className="text-slate-800 dark:text-slate-100 text-lg font-bold">VocabMaster</h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-gray-300 rounded-full size-10 bg-cover" style={{backgroundImage: 'url("https://ui-avatars.com/api/?name=User")'}}></div>
              </div>
            </header>

            <main className="flex flex-col gap-6 mb-20">
              <div className="flex flex-col gap-6">
                <h1 className="text-3xl font-black">Luyện tập phát âm</h1>
                
                {/* PROGRESS BAR */}
                <div className="bg-white dark:bg-[#1A2C32] p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-bold uppercase text-slate-500">
                    <span>Mục tiêu ngày</span>
                    <span>3/20 từ</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500" style={{ width: "15%" }}></div>
                  </div>
                </div>
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
                      {currentWord?.word || "Success"}
                    </h3>
                    <p className="text-lg text-slate-400 font-medium italic">{currentWord?.ipa || "/səkˈses/"}</p>
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
                        className={`relative z-10 size-24 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-95
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
                    <button onClick={loadQuestion} className="text-slate-400 hover:text-slate-600 font-bold px-8 py-3 transition-colors flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[20px]">replay</span> Thử lại
                    </button>
                    <button onClick={loadQuestion} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-3 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
                      Từ tiếp theo <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                    </button>
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