// src/app/profile/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import AuthGuard from '@/components/AuthGuard';
import Navbar from '@/components/Navbar';

export default function Profile() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);

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

  const saveDisplayName = async () => {
    if (!newDisplayName.trim()) return;

    setSavingName(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/user-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'update_display_name',
          display_name: newDisplayName.trim()
        }),
      });

      if (response.ok) {
        setUserProfile((prev: any) => ({ ...prev, display_name: newDisplayName.trim() }));
        setEditingName(false);
      } else {
        alert('Không thể cập nhật tên hiển thị');
      }
    } catch (error) {
      alert('Lỗi khi cập nhật tên');
    } finally {
      setSavingName(false);
    }
  };

  const saveAvatar = async (avatarId: number) => {
    setSavingAvatar(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/user-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'update_avatar',
          avatar_id: avatarId
        }),
      });

      if (response.ok) {
        setUserProfile((prev: any) => ({ ...prev, avatar_id: avatarId }));
        setShowAvatarSelector(false);
      } else {
        alert('Không thể cập nhật avatar');
      }
    } catch (error) {
      alert('Lỗi khi cập nhật avatar');
    } finally {
      setSavingAvatar(false);
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
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <Navbar />
        <div className="p-8 bg-slate-50 dark:bg-slate-950 font-display">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Card thông tin chính */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-xl border border-slate-100 dark:border-slate-800 text-center">
            <div className="size-28 bg-primary/10 rounded-full mx-auto mb-6 flex items-center justify-center relative group">
               <img
                 src={`/avatar/avatar${userProfile.avatar_id || 1}.png`}
                 alt="Avatar"
                 className="size-24 rounded-full object-cover border-4 border-white dark:border-slate-800"
               />
               <button
                 onClick={() => setShowAvatarSelector(true)}
                 className="absolute -bottom-2 -right-2 bg-primary text-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
               >
                 <span className="material-symbols-outlined text-lg">edit</span>
               </button>
            </div>

            <div className="mb-2">
              {editingName ? (
                <div className="flex items-center gap-2 justify-center">
                  <input
                    type="text"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    className="text-3xl font-black text-center bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-1 border-2 border-primary/50 focus:outline-none"
                    placeholder="Nhập tên hiển thị"
                    maxLength={20}
                  />
                  <button
                    onClick={saveDisplayName}
                    disabled={savingName}
                    className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                  >
                    {savingName ? '...' : '✓'}
                  </button>
                  <button
                    onClick={() => setEditingName(false)}
                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <h1 className="text-3xl font-black">{userProfile.display_name || user.email?.split('@')[0] || 'User'}</h1>
                  <button
                    onClick={() => {
                      setEditingName(true);
                      setNewDisplayName(userProfile.display_name || user.email?.split('@')[0] || 'User');
                    }}
                    className="p-1 text-slate-400 hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">edit</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 mb-2">
              <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">{getLevelName(userProfile.level)}</p>
              {userProfile.is_pro && (
                <span className="px-2 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-black rounded-full shadow-sm">
                  PRO
                </span>
              )}
            </div>

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

          {/* Subscription Status */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-lg mb-4">💎 Gói dịch vụ</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${userProfile.is_pro ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">
                      {userProfile.is_pro ? 'Gói Pro' : 'Gói Free'}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {userProfile.is_pro ? 'Tất cả tính năng AI không giới hạn' : '3 lần dùng AI miễn phí mỗi tháng'}
                    </p>
                  </div>
                </div>
                {userProfile.is_pro && userProfile.subscription_expires_at && (
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Hết hạn</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {new Date(userProfile.subscription_expires_at).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                )}
              </div>

              {!userProfile.is_pro && (
                <div className="text-center pt-2">
                  <Link
                    href="/upgrade"
                    className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors"
                  >
                    <span className="material-symbols-outlined">upgrade</span>
                    Nâng cấp Pro
                  </Link>
                </div>
              )}
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

        {/* Avatar Selector Modal */}
        {showAvatarSelector && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full max-h-[90vh] overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Chọn Avatar</h2>
                  <button
                    onClick={() => setShowAvatarSelector(false)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((avatarId) => (
                    <button
                      key={avatarId}
                      onClick={() => saveAvatar(avatarId)}
                      disabled={savingAvatar}
                      className={`aspect-square rounded-xl border-2 transition-all ${
                        userProfile.avatar_id === avatarId
                          ? 'border-primary bg-primary/10'
                          : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'
                      } ${savingAvatar ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <img
                        src={`/avatar/avatar${avatarId}.png`}
                        alt={`Avatar ${avatarId}`}
                        className="w-full h-full rounded-lg object-cover"
                      />
                      {userProfile.avatar_id === avatarId && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-primary text-white rounded-full p-1">
                            <span className="material-symbols-outlined text-sm">check</span>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {savingAvatar && (
                  <div className="flex items-center justify-center mt-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2 text-sm text-slate-500">Đang lưu...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}