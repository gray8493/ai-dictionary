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
    { name: 'Từ vựng', href: '/my-vocabulary', icon: 'style' },
    { name: 'AI Extract', href: '/ai-extract', icon: 'auto_awesome' },
    { name: 'Luyện tập', href: '/practice', icon: 'fitness_center' },
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
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="font-black text-xl text-primary flex items-center gap-2">
          <span className="material-symbols-outlined">menu_book</span>
          <span className="hidden md:block">VOCAB.AI</span>
        </Link>

        {/* Menu giữa - Gọn gàng hơn */}
        <nav className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                pathname === link.href ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{link.icon}</span>
              <span className="hidden lg:block">{link.name}</span>
            </Link>
          ))}
        </nav>

        {/* Thông tin XP và Profile bên phải */}
        <div className="flex items-center gap-4">
          {!loading && user && userProfile && !profileLoading && (
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase">LEVEL: {getLevelName(userProfile.level)}</span>
              <div className="h-1.5 w-20 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div style={{ width: `${Math.min(progress, 100)}%` }} className="h-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.5)]"></div>
              </div>
            </div>
          )}

          {!loading && user ? (
            <div className="flex items-center gap-2">
              <Link href="/profile" className="size-10 rounded-full border-2 border-primary/20 overflow-hidden hover:scale-105 transition-transform">
                <img src={`https://ui-avatars.com/api/?name=${user.email}&background=2bbdee&color=fff`} alt="Profile" />
              </Link>
              <button
                onClick={handleLogout}
                className="hidden sm:flex min-w-[84px] cursor-pointer items-center justify-center rounded-full h-8 px-3 bg-red-500 text-white text-xs font-bold hover:bg-red-600"
              >
                Đăng xuất
              </button>
            </div>
          ) : !loading ? (
            <button
              onClick={handleGoogleLogin}
              className="flex items-center gap-2 min-w-[84px] cursor-pointer justify-center rounded-full h-8 px-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-slate-900 dark:text-white text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              <svg className="h-3 w-3" viewBox="0 0 24 24">
                <path d="M22.477 12.2729C22.477 11.4547 22.4056 10.6593 22.2691 9.89111H12.2045V14.4365H18.1413C17.8821 15.9354 17.0722 17.2183 15.8239 18.0678V20.9419H19.6973C21.5239 19.2246 22.477 16.9233 22.477 14.1274C22.477 13.5183 22.477 12.8865 22.477 12.2729Z" fill="#4285F4"></path>
                <path d="M12.2045 23.0002C15.1481 23.0002 17.6191 22.0466 19.6973 20.9421L15.8239 18.068C14.8647 18.7088 13.6288 19.0963 12.2045 19.0963C9.36643 19.0963 6.94998 17.1363 6.00256 14.6818H2.02539V17.6502C3.96163 20.8878 7.82255 23.0002 12.2045 23.0002Z" fill="#34A853"></path>
                <path d="M6.00258 14.6817C5.77296 14.032 5.63645 13.3363 5.63645 12.6181C5.63645 11.9001 5.77296 11.2044 6.00258 10.5549V7.58643H2.02541C1.23398 9.0939 0.772727 10.8038 0.772727 12.6181C0.772727 14.4325 1.23398 16.1423 2.02541 17.6498L6.00258 14.6817Z" fill="#FBBC05"></path>
                <path d="M12.2045 6.13989C13.6743 6.13989 15.2533 6.67832 16.3867 7.75739L19.7849 4.35919C17.6105 2.38102 15.1481 1.23633 12.2045 1.23633C7.82255 1.23633 3.96163 3.3487 2.02539 6.58625L6.00256 9.55469C6.94998 7.09995 9.36643 5.13989 12.2045 5.13989Z" fill="#EA4335"></path>
              </svg>
              <span className="hidden sm:block">Google</span>
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}