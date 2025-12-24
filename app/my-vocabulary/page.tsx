// src/app/my-vocabulary/page.tsx
"use client";

import React, { useState } from 'react';
import Link from 'next/link';

/** * 1. LOCAL COMPONENT: NAV_ITEM
 */
const NavItem = ({ href, label, active = false }: { href: string; label: string; active?: boolean }) => (
  <Link 
    href={href} 
    className={`text-sm font-medium transition-colors ${active ? 'text-primary font-bold' : 'text-slate-600 dark:text-gray-400 hover:text-primary'}`}
  >
    {label}
  </Link>
);

/** * MAIN PAGE: MY VOCABULARY MANAGEMENT
 */
export default function MyVocabularyPage() {
  // Giả lập danh sách từ vựng đã lưu
  const [vocabList, setVocabList] = useState([
    { id: 1, word: "Ephemeral", type: "adj", meaning: "Phù du, chóng tàn", date: "2024-03-20", status: "Learning" },
    { id: 2, word: "Minimalism", type: "n", meaning: "Chủ nghĩa tối giản", date: "2024-03-18", status: "Mastered" },
    { id: 3, word: "Aesthetic", type: "adj", meaning: "Thẩm mỹ", date: "2024-03-15", status: "Learning" },
  ]);

  return (
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
          <NavItem href="/my-vocabulary" label="Từ của tôi" active />
          <NavItem href="/practice" label="Luyện tập" />
        </nav>
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 text-primary p-2 rounded-full"><span className="material-symbols-outlined">person</span></div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 md:p-10">
        {/* Page Title & Stats */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black dark:text-white">Từ vựng của tôi</h1>
            <p className="text-slate-500 dark:text-gray-400">Bạn đã lưu {vocabList.length} từ vựng.</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-primary/20 hover:opacity-90">
              <span className="material-symbols-outlined">school</span> Học ngay
            </button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="md:col-span-2 relative">
            <span className="absolute left-3 top-3 text-slate-400 material-symbols-outlined">search</span>
            <input 
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Tìm kiếm từ trong danh sách..."
            />
          </div>
          <select className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 dark:text-white outline-none">
            <option>Tất cả trạng thái</option>
            <option>Đang học</option>
            <option>Đã thuộc</option>
          </select>
          <select className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 dark:text-white outline-none">
            <option>Mới nhất</option>
            <option>A - Z</option>
          </select>
        </div>

        {/* Vocabulary Table */}
        <div className="bg-white dark:bg-[#1a262b] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <th className="p-4 font-bold text-slate-700 dark:text-gray-200">Từ vựng</th>
                <th className="p-4 font-bold text-slate-700 dark:text-gray-200">Loại từ</th>
                <th className="p-4 font-bold text-slate-700 dark:text-gray-200">Nghĩa tiếng Việt</th>
                <th className="p-4 font-bold text-slate-700 dark:text-gray-200 text-center">Trạng thái</th>
                <th className="p-4 font-bold text-slate-700 dark:text-gray-200 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {vocabList.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-slate-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="p-4 font-bold text-primary">{item.word}</td>
                  <td className="p-4 text-slate-500 italic">({item.type})</td>
                  <td className="p-4 dark:text-gray-300">{item.meaning}</td>
                  <td className="p-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.status === 'Mastered' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                      {item.status === 'Mastered' ? 'Đã thuộc' : 'Đang học'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 text-slate-400 hover:text-primary transition-colors"><span className="material-symbols-outlined text-lg">edit</span></button>
                      <button className="p-2 text-slate-400 hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-lg">delete</span></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}