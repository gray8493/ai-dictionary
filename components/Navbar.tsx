"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { checkIsPro } from '@/lib/checkPro';
import type { User } from '@supabase/supabase-js';

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Trang chủ', href: '/', icon: 'home' },
    { name: 'Tìm kiếm', href: '/vocabulary', icon: 'translate' },
    { name: 'Từ của tôi', href: '/my-vocabulary', icon: 'style' },
    { name: 'Luyện tập', href: '/practice', icon: 'fitness_center' },
    { name: 'AI Extract', href: '/ai-extract', icon: 'auto_awesome' },
    { name: 'Bảng xếp hạng', href: '/leaderboard', icon: 'leaderboard' },
  ];

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        console.error('Login error:', error);
        alert('Đăng nhập thất bại: ' + error.message);
        setLoading(false);
      }
      // Don't set loading false here - page will redirect
    } catch (err) {
      console.error('Login failed:', err);
      alert('Đăng nhập thất bại');
      setLoading(false);
    }
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
    let mounted = true;

    const getUser = async () => {
      try {
        console.log('Navbar - checking auth...');
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error('Auth session error:', error);
          if (mounted) setLoading(false);
          return;
        }

        const currentUser = session?.user ?? null;
        console.log('Navbar - user:', currentUser?.email || 'null');
        if (mounted) setUser(currentUser);

        if (currentUser) {
          await fetchUserProfile();
          const proStatus = await checkIsPro(currentUser);
          if (mounted) setIsPro(proStatus);
        } else {
          if (mounted) setIsPro(false);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state changed:', event, !!session?.user);
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          fetchUserProfile();
          const proStatus = await checkIsPro(currentUser);
          if (mounted) setIsPro(proStatus);
        } else {
          setIsPro(false);
        }

        if (mounted) setLoading(false);
      }
    );

    return () => {
      mounted = false;
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
          <div className="flex items-center justify-center size-8 rounded-lg bg-primary text-white">
            <span className="material-symbols-outlined text-[20px]">school</span>
          </div>
          <span className="hidden md:block">VocaAI</span>
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
        {/* Mobile menu button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-2 text-slate-600 dark:text-gray-400 hover:text-primary"
        >
          <span className="material-symbols-outlined">
            {isMobileMenuOpen ? 'close' : 'menu'}
          </span>
        </button>

        {!loading && user ? (
          <div className="flex items-center gap-4">
            {userProfile && (
              <div className="hidden md:flex items-center gap-4">
                {user.user_metadata?.avatar_url && (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full border-2 border-primary"
                  />
                )}
                <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 rounded-full">
                  <span className="text-yellow-600 dark:text-yellow-400 text-sm">⭐</span>
                  <span className="text-yellow-800 dark:text-yellow-200 font-bold">
                    {userProfile.level}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                  <span className="text-blue-600 dark:text-blue-400 text-sm">⚡</span>
                  <span className="text-blue-800 dark:text-blue-200 font-bold">
                    {userProfile.xp} XP
                  </span>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Link href="/profile" className="text-sm font-medium text-slate-600 dark:text-gray-400 hover:text-primary">
                Hồ sơ
              </Link>
              <Link href="/leaderboard" className="text-sm font-medium text-slate-600 dark:text-gray-400 hover:text-primary">
                Bảng xếp hạng
              </Link>
              <button
                onClick={handleLogout}
                className="min-w-[84px] cursor-pointer items-center justify-center rounded-full h-10 px-4 bg-red-500 text-white text-sm font-bold leading-normal tracking-[0.015em]"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        ) : !loading ? (
          <Link
            href="/auth"
            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:opacity-90"
          >
            <span className="truncate">Đăng nhập</span>
          </Link>
        ) : null}
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 top-[73px] bg-black/50 z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="lg:hidden fixed inset-0 top-[73px] bg-white dark:bg-gray-900 z-50 border-t border-gray-200 dark:border-gray-700">
            <nav className="flex flex-col py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'text-primary bg-primary/5 border-r-2 border-primary'
                    : 'text-slate-600 dark:text-gray-400 hover:text-primary hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{link.icon}</span>
                {link.name}
              </Link>
            ))}
            {!loading && user && (
              <>
                <Link
                  href="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-6 py-3 text-sm font-medium text-slate-600 dark:text-gray-400 hover:text-primary hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <span className="material-symbols-outlined text-lg">person</span>
                  Hồ sơ
                </Link>
                <Link
                  href="/leaderboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-6 py-3 text-sm font-medium text-slate-600 dark:text-gray-400 hover:text-primary hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <span className="material-symbols-outlined text-lg">leaderboard</span>
                  Bảng xếp hạng
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-6 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <span className="material-symbols-outlined text-lg">logout</span>
                  Đăng xuất
                </button>
              </>
            )}
          </nav>
          </div>
        </>
      )}
    </header>
  );
}