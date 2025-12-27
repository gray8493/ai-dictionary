// src/app/profile/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AuthGuard from '@/components/AuthGuard';

export default function Profile() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        fetchUserProfile();
      } else {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const getLevelName = (level: number) => {
    if (level === 1) return "Newbie";
    if (level === 2) return "Learner";
    if (level === 3) return "Scholar";
    return "Master";
  };

  const getRankIcon = (level: number) => {
    if (level === 1) return "person";
    if (level === 2) return "school";
    if (level === 3) return "workspace_premium";
    return "military_tech";
  };

  const getNextLevelXP = (currentLevel: number) => {
    if (currentLevel === 1) return 501; // To reach Learner
    if (currentLevel === 2) return 1501; // To reach Scholar
    if (currentLevel === 3) return 5001; // To reach Master
    return 5001; // Max level
  };

  const getNextLevelName = (currentLevel: number) => {
    if (currentLevel <= 1) return "Learner";
    if (currentLevel <= 3) return "Scholar";
    if (currentLevel <= 6) return "Master";
    return "Legend";
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-slate-500">Đang tải thông tin cá nhân...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!user || !userProfile) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-slate-500">Không thể tải thông tin người dùng</p>
        </div>
      </AuthGuard>
    );
  }

  const nextLevelXP = getNextLevelXP(userProfile.level);
  const currentLevelMinXP = userProfile.level === 1 ? 0 : userProfile.level === 2 ? 501 : userProfile.level === 3 ? 1501 : 5001;
  const xpInCurrentLevel = userProfile.xp - currentLevelMinXP;
  const xpNeededForNextLevel = nextLevelXP - currentLevelMinXP;
  const progress = userProfile.level >= 4 ? 100 : (xpInCurrentLevel / xpNeededForNextLevel) * 100;

  return (
    <AuthGuard>
      <div className="min-h-screen p-8 bg-slate-50 dark:bg-slate-950 font-display">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Card thông tin chính */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-xl border border-slate-100 dark:border-slate-800 text-center">
            <div className="size-28 bg-primary/10 rounded-full mx-auto mb-6 flex items-center justify-center">
               <span className="material-symbols-outlined text-6xl text-primary">{getRankIcon(userProfile.level)}</span>
            </div>
            <h1 className="text-3xl font-black mb-1">{user.email?.split('@')[0] || 'User'}</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">{getLevelName(userProfile.level)}</p>

            {/* Thanh XP lớn */}
            <div className="mt-8 space-y-2">
              <div className="flex justify-between text-sm font-black">
                <span>{userProfile.xp} XP</span>
                <span className="text-slate-400">{nextLevelXP} XP</span>
              </div>
              <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div style={{ width: `${Math.min(progress, 100)}%` }} className="h-full bg-primary shadow-[0_0_15px_rgba(43,189,238,0.5)] transition-all duration-1000"></div>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {userProfile.level >= 4 ? 'Bạn đã đạt cấp cao nhất!' : `Bạn cần ${xpNeededForNextLevel - xpInCurrentLevel} XP nữa để lên cấp ${getNextLevelName(userProfile.level)}`}
              </p>
            </div>
          </div>

          {/* Card số liệu thống kê */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
              <p className="text-slate-400 text-xs font-bold uppercase">Số từ đã lưu</p>
              <p className="text-3xl font-black text-primary">{userProfile.total_vocabularies || 0}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
              <p className="text-slate-400 text-xs font-bold uppercase">Từ đã thuộc</p>
              <p className="text-3xl font-black text-green-500">{userProfile.mastered_vocabularies || 0}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
              <p className="text-slate-400 text-xs font-bold uppercase">XP tuần này</p>
              <p className="text-3xl font-black text-orange-500">{userProfile.weekly_xp || 0}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
              <p className="text-slate-400 text-xs font-bold uppercase">Từ thuộc tuần</p>
              <p className="text-3xl font-black text-purple-500">{userProfile.weekly_mastered || 0}</p>
            </div>
          </div>

          {/* Achievement Section */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-lg mb-4">🏆 Thành tựu gần đây</h3>
            <div className="space-y-3">
              {userProfile.xp >= 100 && (
                <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                  <span className="material-symbols-outlined text-yellow-600">workspace_premium</span>
                  <div>
                    <p className="font-bold text-yellow-800 dark:text-yellow-200">Đầu tiên 100 XP!</p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">Bạn đã bắt đầu hành trình học tập</p>
                  </div>
                </div>
              )}
              {userProfile.mastered_vocabularies >= 10 && (
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <span className="material-symbols-outlined text-green-600">check_circle</span>
                  <div>
                    <p className="font-bold text-green-800 dark:text-green-200">10 từ đã thuộc!</p>
                    <p className="text-xs text-green-600 dark:text-green-400">Tiếp tục phát huy</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}