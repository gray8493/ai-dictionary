// src/app/practice/page.tsx
"use client";

import React, { useState } from 'react';
import Link from 'next/link';

/** * 1. LOCAL COMPONENT: NAVBAR BÀI TẬP
 */
const PracticeNavbar = () => (
  <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-primary/20 dark:border-primary/10 px-6 sm:px-10 py-4 rounded-lg bg-white/50 dark:bg-black/10 backdrop-blur-sm">
    <div className="flex items-center gap-4 text-slate-800 dark:text-slate-200">
      <div className="size-6 text-primary">
        <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          <path clipRule="evenodd" d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fill="currentColor" fillRule="evenodd"></path>
        </svg>
      </div>
      <h2 className="text-lg font-bold">VocabLearn</h2>
    </div>
    
    <div className="hidden md:flex flex-1 justify-end gap-8">
      <nav className="flex items-center gap-9">
        <Link href="/" className="text-slate-600 dark:text-slate-400 text-sm font-medium hover:text-primary transition-colors">Home</Link>
        <Link href="/vocabulary" className="text-slate-600 dark:text-slate-400 text-sm font-medium hover:text-primary transition-colors">Vocabulary</Link>
        <Link href="/practice" className="text-primary text-sm font-bold">Practice</Link>
        <Link href="#" className="text-slate-600 dark:text-slate-400 text-sm font-medium hover:text-primary transition-colors">Profile</Link>
      </nav>
      <div className="flex items-center gap-4">
        <button className="flex items-center justify-center rounded-full h-10 w-10 bg-primary/10 text-slate-700 dark:bg-primary/20 dark:text-slate-300 hover:bg-primary/20 transition-colors">
          <span className="material-symbols-outlined text-lg">notifications</span>
        </button>
        <div className="bg-slate-300 rounded-full size-10 bg-cover bg-center shadow-sm" style={{ backgroundImage: 'url("https://ui-avatars.com/api/?name=User")' }}></div>
      </div>
    </div>
  </header>
);

/** * 2. LOCAL COMPONENT: ANSWER OPTION
 * Component hiển thị từng đáp án (Hỗ trợ trạng thái Bình thường, Đúng, Sai)
 */
interface OptionProps {
  label: string;
  status?: 'default' | 'correct' | 'wrong';
  name: string;
}

const AnswerOption = ({ label, status = 'default', name }: OptionProps) => {
  const statusClasses = {
    default: "border-slate-200 dark:border-slate-800 hover:border-primary dark:hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-primary/10",
    correct: "border-green-500 bg-green-500/10",
    wrong: "border-red-500 bg-red-500/10",
  };

  return (
    <label className={`flex items-center gap-4 rounded-lg border-2 border-solid p-4 cursor-pointer transition-all ${statusClasses[status]}`}>
      <input 
        type="radio" 
        name={name}
        className="h-5 w-5 border-2 border-slate-300 dark:border-slate-700 bg-transparent text-transparent appearance-none rounded-full checked:border-primary checked:bg-[image:var(--radio-dot-svg)] focus:outline-none focus:ring-0"
        style={{ '--radio-dot-svg': "url('data:image/svg+xml,%3csvg viewBox=%270 0 16 16%27 fill=%27rgb(43,189,238)%27 xmlns=%27http://www.w3.org/2000/svg%27%3e%3ccircle cx=%278%27 cy=%278%27 r=%273%27/%3e%3c/svg%3e')" } as React.CSSProperties}
      />
      <div className="flex grow flex-col">
        <p className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-normal">{label}</p>
      </div>
      {status === 'correct' && <span className="material-symbols-outlined text-green-500">check_circle</span>}
      {status === 'wrong' && <span className="material-symbols-outlined text-red-500">cancel</span>}
    </label>
  );
};

/** * MAIN PAGE: TRANG BÀI TẬP
 */
export default function PracticePage() {
  const [progress] = useState(25); // Ví dụ: 25% hoàn thành

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark">
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-4 sm:px-8 md:px-16 lg:px-24 xl:px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            
            <PracticeNavbar />

            <main className="mt-8 sm:mt-12 flex flex-col gap-8">
              {/* Tiêu đề trang */}
              <div className="px-4">
                <h1 className="text-slate-900 dark:text-white text-4xl font-black tracking-tight">Vocabulary Practice</h1>
              </div>

              {/* Thanh tiến độ */}
              <div className="flex flex-col gap-3 p-4">
                <div className="flex justify-between">
                  <p className="text-slate-800 dark:text-slate-200 text-base font-medium">Progress</p>
                </div>
                <div className="rounded-full bg-primary/20 dark:bg-primary/10 h-2">
                  <div className="h-2 rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Question 5/20</p>
              </div>

              {/* Thẻ câu hỏi chính */}
              <div className="bg-white dark:bg-[#1a262b] rounded-lg p-6 sm:p-8 shadow-sm border border-black/5 dark:border-white/5">
                <div className="flex flex-col items-stretch justify-start">
                  <div className="flex flex-col gap-2 mb-8">
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Choose the correct meaning for the word below:</p>
                    <p className="text-slate-900 dark:text-white text-3xl font-bold tracking-tight">Ephemeral</p>
                  </div>

                  {/* Danh sách đáp án */}
                  <div className="flex flex-col gap-3">
                    <AnswerOption name="q1" label="Lasting for a very short time" status="default" />
                    <AnswerOption name="q1" label="Permanent and unchanging" status="wrong" />
                    <AnswerOption name="q1" label="Difficult to understand" status="correct" />
                    <AnswerOption name="q1" label="Related to ancient history" status="default" />
                  </div>
                </div>
              </div>

              {/* Các nút điều hướng */}
              <div className="flex items-center justify-between p-4 mt-4">
                <button className="flex items-center justify-center gap-2 rounded-full h-12 px-6 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-base font-bold hover:bg-slate-300 transition-colors">
                  <span>Skip</span>
                </button>
                <button className="flex items-center justify-center gap-2 rounded-full h-12 px-8 bg-primary text-white text-base font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/30">
                  <span>Next Question</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}