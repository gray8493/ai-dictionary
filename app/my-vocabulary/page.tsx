// src/app/my-vocabulary/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import AuthGuard from '@/components/AuthGuard';
import Navbar from '@/components/Navbar';

interface VocabularyItem {
  id: string;
  word: string;
  type: string;
  meaning: string;
  date: string;
  status: string;
}



/** * MAIN PAGE: MY VOCABULARY MANAGEMENT
 */
const typeMapping: { [key: string]: string } = {
  'noun': 'Danh từ',
  'verb': 'Động từ',
  'adjective': 'Tính từ',
  'adverb': 'Trạng từ',
  'pronoun': 'Đại từ',
  'preposition': 'Giới từ',
  'conjunction': 'Liên từ',
  'interjection': 'Thán từ',
  'word': 'Từ vựng',
  'phrase': 'Cụm từ'
};

export default function MyVocabularyPage() {
  const [vocabList, setVocabList] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isTypeColumnMissing, setIsTypeColumnMissing] = useState<boolean>(false);

  // Update vocabulary status
  const updateVocabularyStatus = async (id: string, newStatus: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError("Vui lòng đăng nhập để cập nhật");
        return;
      }

      const response = await fetch('/api/my-vocabulary', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (!response.ok) {
        const result = await response.json();
        setError("Lỗi khi cập nhật trạng thái: " + (result.error || 'Unknown error'));
        return;
      }

      // Award XP if marking as mastered
      if (newStatus === 'mastered') {
        const xpResponse = await fetch('/api/user-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: 'add_xp',
            xp: 10, // 10 XP per mastered word
            source: 'vocabulary_mastered'
          }),
        });

        if (xpResponse.ok) {
          const xpResult = await xpResponse.json();
          if (xpResult.success) {
            // Show XP notification
            console.log(`Chúc mừng! Bạn nhận được 10 XP!`);
            // Refresh user profile to show updated XP
            fetchUserProfile();
          }
        }
      }

      // Update local state
      setVocabList(prev =>
        prev.map(item =>
          item.id === id ? { ...item, status: newStatus } : item
        )
      );
    } catch (err) {
      setError("Lỗi không xác định khi cập nhật trạng thái");
    }
  };

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

  // Check auth
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

  // Fetch vocabularies từ API
  const fetchVocabularies = async (page = 1) => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError("Vui lòng đăng nhập để xem từ vựng của bạn");
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/my-vocabulary?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        setError("Lỗi khi tải dữ liệu: " + (result.error || 'Unknown error'));
        return;
      }

      // Chuyển đổi data để phù hợp với table
      let formattedData = result.data.map((item: any) => ({
        id: item.id,
        word: item.word,
        type: item.type || (item.word.trim().includes(' ') ? "phrase" : "word"),
        meaning: item.meaning,
        date: new Date(item.created_at).toLocaleDateString('vi-VN'),
        status: item.status || 'learning'
      }));

      // Filter client-side cho search query
      if (searchQuery.trim()) {
        formattedData = formattedData.filter((item: VocabularyItem) =>
          item.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.meaning.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setVocabList(formattedData);
      setTotalPages(result.pagination.totalPages);
      setTotalCount(result.pagination.total);
      setCurrentPage(page);
      setIsTypeColumnMissing(result.isTypeColumnMissing);
    } catch (err) {
      setError("Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    if (user) {
      fetchVocabularies(1);
    }
  }, [user, statusFilter]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user) {
        fetchVocabularies(1);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, user]);



  return (
    <AuthGuard>
      <div className="min-h-screen bg-background-light dark:bg-background-dark font-display">
        <Navbar />

        <main className="max-w-6xl mx-auto p-6 md:p-10">
          {/* Page Title & Stats */}
          {isTypeColumnMissing && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-4">
              <span className="material-symbols-outlined text-amber-500">warning</span>
              <div>
                <h3 className="font-bold text-amber-800 dark:text-amber-200">Database chưa được cập nhật</h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">
                  Để hiển thị loại từ (Danh từ, Động từ...), bạn cần cập nhật cấu trúc bảng dữ liệu.
                </p>
                <code className="block p-2 bg-white dark:bg-black/20 rounded text-xs mb-2">
                  ALTER TABLE vocabularies ADD COLUMN IF NOT EXISTS type TEXT;
                </code>
                <p className="text-xs text-amber-600 dark:text-amber-400 italic">
                  * Hãy chạy câu lệnh trên trong Supabase SQL Editor và tải lại trang.
                </p>
              </div>
            </div>
          )}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-black dark:text-white">Từ vựng của tôi</h1>
              {loading ? (
                <p className="text-slate-500 dark:text-gray-400">Đang tải...</p>
              ) : error ? (
                <p className="text-red-500 dark:text-red-400">{error}</p>
              ) : (
                <p className="text-slate-500 dark:text-gray-400">Bạn đã lưu {totalCount} từ vựng.</p>
              )}
            </div>
            <div className="flex gap-2">
            </div>
          </div>

          {/* Filters & Search */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="md:col-span-2 relative">
              <span className="absolute left-3 top-3 text-slate-400 material-symbols-outlined">search</span>
              <input
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Tìm kiếm từ trong danh sách..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 dark:text-white outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="learning">Đang học</option>
              <option value="mastered">Đã thuộc</option>
              <option value="review">Cần ôn tập</option>
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
                  <th className="p-4 font-bold text-slate-700 dark:text-gray-200 text-right">Cập nhật trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-500 dark:text-gray-400">
                      Đang tải từ vựng...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-red-500 dark:text-red-400">
                      {error}
                    </td>
                  </tr>
                ) : vocabList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-500 dark:text-gray-400">
                      Chưa có từ vựng nào. Hãy tra cứu và lưu từ vựng!
                    </td>
                  </tr>
                ) : (
                  vocabList.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-slate-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="p-4 font-bold text-primary">{item.word}</td>
                      <td className="p-4 text-slate-500 italic">
                        ({typeMapping[item.type.toLowerCase()] || item.type})
                      </td>
                      <td className="p-4 dark:text-gray-300">{item.meaning}</td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.status === 'mastered' ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' :
                          item.status === 'review' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300' :
                            'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300'
                          }`}>
                          {item.status === 'mastered' ? 'Đã thuộc' :
                            item.status === 'review' ? 'Cần ôn tập' :
                              'Đang học'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <select
                          className="text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 dark:text-white"
                          value={item.status}
                          onChange={(e) => updateVocabularyStatus(item.id, e.target.value)}
                        >
                          <option value="learning">Đang học</option>
                          <option value="review">Cần ôn tập</option>
                          <option value="mastered">Đã thuộc</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentPage === 1}
                onClick={() => fetchVocabularies(currentPage - 1)}
              >
                Trước
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    className={`px-3 py-2 text-sm rounded-lg ${pageNum === currentPage
                      ? 'bg-primary text-white'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    onClick={() => fetchVocabularies(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentPage === totalPages}
                onClick={() => fetchVocabularies(currentPage + 1)}
              >
                Tiếp
              </button>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}