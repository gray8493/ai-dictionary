// src/app/leaderboard/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  xp: number;
  level: number;
  weekly_xp: number;
  weekly_mastered: number;
  total_mastered: number;
  total_vocabularies: number;
  is_pro: boolean;
}

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

/** * MAIN PAGE: LEADERBOARD
 */
export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'weekly' | 'all_time'>('weekly');

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/leaderboard?type=${activeTab}&limit=50`);

        const result = await response.json();

        if (!response.ok) {
          setError("Lỗi khi tải bảng xếp hạng: " + (result.error || 'Unknown error'));
          return;
        }

        setLeaderboard(result.data || []);
      } catch (err) {
        setError("Lỗi không xác định");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [activeTab]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background-light dark:bg-background-dark font-display">
      {/* Header / Navbar */}
      <header className="grid grid-cols-3 items-center border-b border-gray-200 dark:border-gray-700 px-6 py-4 bg-white/50 dark:bg-black/20 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="size-6 text-primary">
            <svg fill="currentColor" viewBox="0 0 48 48"><path d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z"></path></svg>
          </div>
          <h2 className="text-xl font-bold dark:text-white">VocabLearn</h2>
        </div>
        <nav className="hidden lg:flex gap-8 justify-center">
          <NavItem href="/" label="Home" />
          <NavItem href="/vocabulary" label="Tra từ" />
          <NavItem href="/my-vocabulary" label="Từ của tôi" />
          <NavItem href="/practice" label="Luyện tập" />
          <NavItem href="/leaderboard" label="Bảng xếp hạng" active />
        </nav>
        <div></div> {/* Empty div for balance */}
      </header>

      <main className="max-w-6xl mx-auto p-6 md:p-10">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black dark:text-white mb-4">🏆 Bảng Xếp Hạng</h1>
          <p className="text-slate-600 dark:text-gray-400">
            Cạnh tranh với cộng đồng để trở thành người học tiếng Anh xuất sắc nhất!
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('weekly')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'weekly'
                  ? 'bg-primary text-white'
                  : 'text-slate-600 dark:text-gray-400 hover:text-primary'
              }`}
            >
              Tuần này
            </button>
            <button
              onClick={() => setActiveTab('all_time')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'all_time'
                  ? 'bg-primary text-white'
                  : 'text-slate-600 dark:text-gray-400 hover:text-primary'
              }`}
            >
              Tất cả thời gian
            </button>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-white dark:bg-[#1a262b] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <th className="p-4 font-bold text-slate-700 dark:text-gray-200 text-center">Hạng</th>
                <th className="p-4 font-bold text-slate-700 dark:text-gray-200">Người dùng</th>
                <th className="p-4 font-bold text-slate-700 dark:text-gray-200 text-center">Cấp</th>
                <th className="p-4 font-bold text-slate-700 dark:text-gray-200 text-center">
                  {activeTab === 'weekly' ? 'XP Tuần' : 'Tổng XP'}
                </th>
                <th className="p-4 font-bold text-slate-700 dark:text-gray-200 text-center">
                  {activeTab === 'weekly' ? 'Từ thuộc tuần' : 'Từ đã thuộc'}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 dark:text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      Đang tải bảng xếp hạng...
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-red-500 dark:text-red-400">
                    {error}
                  </td>
                </tr>
              ) : leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 dark:text-gray-400">
                    Chưa có dữ liệu xếp hạng
                  </td>
                </tr>
              ) : (
                leaderboard.map((entry) => (
                  <tr key={entry.user_id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-slate-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center">
                        <span className={`text-lg font-bold ${
                          entry.rank <= 3 ? 'text-yellow-600' : 'text-slate-500'
                        }`}>
                          {getRankIcon(entry.rank)}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary font-bold text-sm">
                            {entry.display_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium dark:text-gray-200">{entry.display_name}</span>
                          {entry.is_pro && (
                            <span className="px-1.5 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[8px] font-black rounded-full shadow-sm">
                              PRO
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-bold">
                        {entry.level}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-bold text-primary">
                        {activeTab === 'weekly' ? entry.weekly_xp : entry.xp}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-slate-600 dark:text-gray-400">
                        {activeTab === 'weekly' ? entry.weekly_mastered : entry.total_mastered}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Info Section */}
        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="font-bold text-blue-900 dark:text-blue-200 mb-2">💡 Cách tăng hạng</h3>
          <ul className="text-blue-800 dark:text-blue-300 space-y-1 text-sm">
            <li>• Hoàn thành bài tập để nhận XP</li>
            <li>• Thuộc nhiều từ vựng hơn để tăng điểm</li>
            <li>• Tham gia học tập đều đặn hàng tuần</li>
            <li>• Mời bạn bè cùng tham gia để cạnh tranh vui vẻ!</li>
          </ul>
        </div>
      </main>
    </div>
    </AuthGuard>
  );
}