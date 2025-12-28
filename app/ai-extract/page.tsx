"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import AuthGuard from '@/components/AuthGuard';
import Navbar from '@/components/Navbar';
import { hasAIAccess } from '@/lib/checkPro';

export default function AIExtractPage() {
  const [loading, setLoading] = useState(false);
  const [vocabGroups, setVocabGroups] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('Easy');
  const [user, setUser] = useState<any>(null);
  const [isProUser, setIsProUser] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  // Get user info and check Pro status
  useEffect(() => {
    const getUserAndProStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const hasAccess = await hasAIAccess(user);
        setIsProUser(hasAccess);
      }
    };
    getUserAndProStatus();
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
      setMessage("Lỗi khi xử lý file");
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const saveWordWithoutAlert = async (word: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Vui lòng đăng nhập để lưu từ");
      }
      const res = await fetch('/api/my-vocabulary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(word),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error("Lỗi khi lưu từ: " + errorData.error);
      }
    } catch (err) {
      throw new Error("Lỗi khi lưu từ");
    }
  };

  const handleSaveWord = async (word: any) => {
    try {
      await saveWordWithoutAlert(word);
      setMessage(`Đã lưu từ: ${word.word}`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Lỗi khi lưu từ");
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleSaveAll = async () => {
    console.log('handleSaveAll called');
    console.log('vocabGroups:', vocabGroups);
    console.log('activeTab:', activeTab);

    if (!vocabGroups || !vocabGroups[activeTab]) {
      alert('Không có từ nào để lưu');
      setMessage('Không có từ nào để lưu');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const words = vocabGroups[activeTab];
    console.log('Words to save:', words.length);

    let successCount = 0;

    for (const word of words) {
      try {
        console.log('Saving word:', word);
        await saveWordWithoutAlert(word);
        successCount++;
      } catch (err) {
        console.error('Failed to save word:', word, err);
        // Continue with next word
      }
    }

    alert(`Đã lưu ${successCount}/${words.length} từ`);
    setMessage(`Đã lưu ${successCount}/${words.length} từ`);
    setTimeout(() => setMessage(''), 3000);
  };

  if (!isProUser) {
    return (
      <AuthGuard>
        <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 min-h-screen">
          <div className="size-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-4xl">auto_awesome</span>
          </div>
          <h2 className="text-2xl font-black mb-2">Tính năng này dành cho bản Pro</h2>
          <p className="text-slate-500 mb-8 max-w-sm">
            Hãy nâng cấp tài khoản để sử dụng AI trích xuất từ vựng và tạo bài tập thông minh không giới hạn.
          </p>
          <Link href="/upgrade" className="px-8 py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/30 hover:scale-105 transition-all">
            Nâng cấp ngay - $9.99/tháng
          </Link>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden">
        <Navbar />
        <div className="layout-container flex h-full grow flex-col">
          <div className="px-4 sm:px-8 md:px-20 lg:px-40 flex flex-1 justify-center py-5">
            <div className="layout-content-container flex flex-col w-full max-w-[960px] flex-1">
              <main className="flex flex-col gap-10 py-10">
                {message && (
                  <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
                    {message}
                  </div>
                )}
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
                      <p className="text-[#4c869a] dark:text-gray-400 text-sm font-normal leading-normal max-w-[480px] text-center">Supported formats: .txt, .docx</p>
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