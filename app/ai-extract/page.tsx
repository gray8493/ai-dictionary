"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import AuthGuard from '@/components/AuthGuard';

export default function AIExtractPage() {
  const [loading, setLoading] = useState(false);
  const [vocabGroups, setVocabGroups] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('Easy');
  const [user, setUser] = useState<any>(null);

  // Get user info
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch('/api/extract-vocab/file', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setVocabGroups(data);
    } catch (err) {
      alert("Lỗi khi xử lý file");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWord = async (word: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("Vui lòng đăng nhập để lưu từ");
        return;
      }
      const res = await fetch('/api/my-vocabulary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(word),
      });
      if (res.ok) {
        alert(`Đã lưu từ: ${word.word}`);
      } else {
        const errorData = await res.json();
        alert("Lỗi khi lưu từ: " + errorData.error);
      }
    } catch (err) {
      alert("Lỗi khi lưu từ");
    }
  };

  const handleSaveAll = async () => {
    if (!vocabGroups || !vocabGroups[activeTab]) return;

    const words = vocabGroups[activeTab];
    let successCount = 0;

    for (const word of words) {
      try {
        await handleSaveWord(word);
        successCount++;
      } catch (err) {
        // Continue with next word
      }
    }

    alert(`Đã lưu ${successCount}/${words.length} từ`);
  };

  return (
    <AuthGuard>
      <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden">
        <div className="layout-container flex h-full grow flex-col">
          <div className="px-4 sm:px-8 md:px-20 lg:px-40 flex flex-1 justify-center py-5">
            <div className="layout-content-container flex flex-col w-full max-w-[960px] flex-1">
              <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-[#e7f0f3] dark:border-gray-700/50 px-4 sm:px-6 lg:px-10 py-3">
                <div className="flex items-center gap-4 text-[#0d181b] dark:text-white">
                  <div className="size-6">
                    <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                      <path d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z"></path>
                    </svg>
                  </div>
                  <h2 className="text-[#0d181b] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">Trang AI</h2>
                </div>
                <div className="hidden md:flex flex-1 justify-end items-center gap-8">
                  <div className="flex items-center gap-9">
                    <Link href="/" className="text-[#0d181b] dark:text-gray-300 hover:text-primary dark:hover:text-primary text-sm font-medium leading-normal">Home</Link>
                    <Link href="/vocabulary" className="text-[#0d181b] dark:text-gray-300 hover:text-primary dark:hover:text-primary text-sm font-medium leading-normal">Vocabulary</Link>
                    <Link href="/ai-extract" className="text-primary dark:text-primary text-sm font-bold leading-normal">AI Extract</Link>
                    <Link href="/practice" className="text-[#0d181b] dark:text-gray-300 hover:text-primary dark:hover:text-primary text-sm font-medium leading-normal">Practice</Link>
                  </div>
                  <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:opacity-90">
                    <span className="truncate">Upgrade</span>
                  </button>
                  <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10" style={{backgroundImage: `url("https://ui-avatars.com/api/?name=${user?.email || 'User'}&background=3b82f6&color=fff")`}}></div>
                </div>
                <button className="md:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                  <span className="material-symbols-outlined text-[#0d181b] dark:text-white">menu</span>
                </button>
              </header>
              <main className="flex flex-col gap-10 py-10">
                <div className="flex flex-wrap justify-between gap-3 p-4">
                  <div className="flex w-full flex-col gap-3 text-center items-center">
                    <p className="text-[#0d181b] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">AI Vocabulary Extractor</p>
                    <p className="text-[#4c869a] dark:text-gray-400 text-base font-normal leading-normal max-w-lg">Upload your PDF or Word document to automatically get a vocabulary list.</p>
                  </div>
                </div>
                <div className="flex flex-col gap-6 p-4">
                  <div className="flex flex-col items-center gap-6 rounded-lg border-2 border-dashed border-[#cfe1e7] dark:border-gray-700 px-6 py-14 bg-white/50 dark:bg-background-dark/50">
                    <div className="flex max-w-[480px] flex-col items-center gap-2">
                      <p className="text-[#0d181b] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] max-w-[480px] text-center">Drag and drop your file here, or click to select a file</p>
                      <p className="text-[#4c869a] dark:text-gray-400 text-sm font-normal leading-normal max-w-[480px] text-center">Supported formats: .pdf, .doc, .docx</p>
                    </div>
                    <input
                      type="file"
                      accept=".txt,.pdf,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-6 bg-[#e7f0f3] dark:bg-gray-700 text-[#0d181b] dark:text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-gray-200 dark:hover:bg-gray-600">
                      <span className="truncate">{loading ? "Đang phân tích..." : "Choose File"}</span>
                    </label>
                  </div>
                </div>
                {vocabGroups && (
                  <div className="flex flex-col gap-6">
                    <div className="flex justify-between items-center px-4">
                      <h2 className="text-[#0d181b] dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em]">Extracted Vocabulary List</h2>
                      <button
                        onClick={handleSaveAll}
                        className="flex items-center gap-2 min-w-[84px] cursor-pointer justify-center overflow-hidden rounded-full h-12 px-6 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:opacity-90"
                      >
                        <span className="material-symbols-outlined">save</span>
                        <span className="truncate">Save All to Vocabulary</span>
                      </button>
                    </div>
                    <div className="flex space-x-4 mb-6 px-4">
                      {['Easy', 'Medium', 'Hard'].map(level => (
                        <button
                          key={level}
                          onClick={() => setActiveTab(level)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            activeTab === level
                              ? 'bg-primary text-white shadow-sm'
                              : 'bg-[#e7f0f3] dark:bg-gray-700 text-[#0d181b] dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
                      {vocabGroups[activeTab]?.map((item: any, index: number) => (
                        <div key={index} className="flex flex-col gap-4 p-6 bg-white dark:bg-gray-800/50 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start">
                            <h3 className="text-xl font-bold text-[#0d181b] dark:text-white">{item.word}</h3>
                            <button className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                              <span className="material-symbols-outlined text-[#4c869a] dark:text-gray-400 text-lg">volume_up</span>
                            </button>
                          </div>
                          <p className="text-sm font-medium text-[#4c869a] dark:text-gray-400">{item.ipa}</p>
                          <p className="text-base text-[#0d181b] dark:text-gray-300">{item.definition}</p>
                          <button
                            onClick={() => handleSaveWord(item)}
                            className="flex items-center justify-center gap-2 mt-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-full hover:opacity-90 transition-all"
                          >
                            <span className="material-symbols-outlined text-sm">add</span>
                            Save Word
                          </button>
                        </div>
                      ))}
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