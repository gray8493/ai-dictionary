"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const navLinks = [
    { name: 'Trang chủ', href: '/', icon: 'home' },
    { name: 'Từ vựng', href: '/vocabulary', icon: 'translate' },
    { name: 'Từ của tôi', href: '/my-vocabulary', icon: 'style' },
    { name: 'Luyện tập', href: '/practice', icon: 'fitness_center' },
    { name: 'AI Extract', href: '/ai-extract', icon: 'auto_awesome' },
    { name: 'Bảng xếp hạng', href: '/leaderboard', icon: 'leaderboard' },
  ];

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) alert(error.message);
  };

  const fetchUserProfile = async () => {
    try {
      setProfileLoading(true);
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
        // Set default profile on API failure
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
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await fetchUserProfile();
      }
      setLoading(false);
    };

    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUserProfile();
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const getLevelName = (level: number) => {
    if (level === 1) return "Newbie";
    if (level === 2) return "Learner";
    if (level === 3) return "Scholar";
    return "Master";
  };

  const getNextLevelXP = (currentLevel: number) => {
    if (currentLevel === 1) return 501; // To reach Learner
    if (currentLevel === 2) return 1501; // To reach Scholar
    if (currentLevel === 3) return 5001; // To reach Master
    return 5001; // Max level
  };

  const progress = userProfile ? (userProfile.xp / getNextLevelXP(userProfile.level)) * 100 : 0;

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-gray-200/80 dark:border-gray-700/50 px-6 sm:px-10 py-4">
      <div className="flex items-center gap-4 text-slate-900 dark:text-white">
        <Link href="/" className="font-black text-xl text-primary flex items-center gap-2">
          <span className="material-symbols-outlined">menu_book</span>
          <span className="hidden md:block">VOCAB.AI</span>
        </Link>
      </div>

      <div className="hidden lg:flex flex-1 justify-center gap-8">
        <div className="flex items-center gap-9">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                pathname === link.href ? 'text-primary font-bold' : 'text-slate-600 dark:text-gray-400 hover:text-primary'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-4">
        {!loading && user ? (
          <div className="flex items-center gap-2">
            <Link href="/profile" className="text-sm font-medium text-slate-600 dark:text-gray-400 hover:text-primary">
              Hồ sơ
            </Link>
            <Link href="/leaderboard" className="text-sm font-medium text-slate-600 dark:text-gray-400 hover:text-primary">
              Bảng xếp hạng
            </Link>
            {!loading && user && userProfile && !profileLoading && (
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[10px] font-black text-slate-400 uppercase">LEVEL: {getLevelName(userProfile.level)}</span>
                <div className="h-1.5 w-20 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div style={{ width: `${Math.min(progress, 100)}%` }} className="h-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.5)]"></div>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="min-w-[84px] cursor-pointer items-center justify-center rounded-full h-10 px-4 bg-red-500 text-white text-sm font-bold leading-normal tracking-[0.015em] hidden sm:flex"
            >
              Đăng xuất
            </button>
          </div>
        ) : !loading ? (
          <button
            onClick={handleGoogleLogin}
            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em]"
          >
            <span className="truncate">Đăng nhập</span>
          </button>
        ) : null}
      </div>
    </header>
  );
}