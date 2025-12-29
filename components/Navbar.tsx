"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { checkIsPro } from '@/lib/checkPro';
import type { User } from '@supabase/supabase-js';

export default function Navbar() {
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const navLinks = [
    { name: 'Trang chủ', href: '/', icon: 'home' },
    { name: 'Tìm kiếm', href: '/vocabulary', icon: 'translate' },
    { name: 'Từ của tôi', href: '/my-vocabulary', icon: 'style' },
    { name: 'Luyện tập', href: '/practice', icon: 'fitness_center' },
    { name: 'AI Extract', href: '/ai-extract', icon: 'auto_awesome' },
    { name: 'Bảng xếp hạng', href: '/leaderboard', icon: 'leaderboard' },
  ];

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (data) {
        setUserProfile(data);
        setIsAdmin(data.role === 'admin');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  useEffect(() => {
    let mounted = true;
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted && session?.user) {
        setUser(session.user);
        await fetchUserProfile(session.user.id);
      }
      setLoading(false);
    };
    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (session?.user) fetchUserProfile(session.user.id);
      else { setUserProfile(null); setIsAdmin(false); }
    });

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-[100] w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-20 shadow-sm">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
        
        {/* NHÓM BÊN TRÁI: LOGO + NAV LINKS */}
        <div className="flex items-center gap-10">
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-[24px]">school</span>
            </div>
            <span className="font-black text-xl text-slate-900 dark:text-white hidden lg:block">VocaAI</span>
          </Link>

          {/* MENU CHÍNH (Sát cạnh Logo) */}
          <nav className="hidden lg:flex items-center gap-1 bg-gray-50/50 dark:bg-gray-800/40 p-1 rounded-2xl border border-gray-100 dark:border-gray-700/50">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className={`px-4 py-2 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${
                  pathname === link.href 
                  ? 'bg-white dark:bg-gray-900 text-primary shadow-sm' 
                  : 'text-slate-500 hover:text-primary dark:text-gray-400'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* NHÓM BÊN PHẢI: STATS + DROPDOWN */}
        <div className="flex items-center gap-3 shrink-0">
          {!loading && user ? (
            <>
              {/* Cụm Stats (XP & Level) - Luôn hiển thị */}
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-gray-800/40 p-1.5 rounded-2xl border border-slate-100 dark:border-gray-700">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-yellow-100">
                  <span className="text-sm">⭐</span>
                  <span className="text-sm font-black text-slate-700 dark:text-gray-200">Lv.{userProfile?.level || 1}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-blue-100">
                  <span className="text-sm text-blue-500 font-bold">⚡</span>
                  <span className="text-sm font-black text-slate-700 dark:text-gray-200">{userProfile?.xp || 0}</span>
                </div>
              </div>

              {/* Avatar & Dropdown Cá nhân */}
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center gap-1 p-1 rounded-full border-2 border-primary/20 hover:border-primary transition-all bg-white dark:bg-gray-900"
                >
                  <img 
                    src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.email}`} 
                    alt="avatar" 
                    className="size-9 rounded-full object-cover" 
                  />
                  <span className={`material-symbols-outlined text-slate-400 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>

                {/* Dropdown Menu (Chứa Hồ sơ & Đăng xuất) */}
                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-60 bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 py-4 z-[110] animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-6 py-3 border-b border-gray-50 dark:border-gray-800 mb-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tài khoản</p>
                      <p className="text-sm font-black text-slate-900 dark:text-white truncate">{user.email}</p>
                    </div>
                    
                    <Link href="/profile" onClick={() => setIsUserDropdownOpen(false)} className="flex items-center gap-3 px-6 py-3.5 hover:bg-primary/5 text-slate-700 dark:text-gray-300 font-bold text-sm">
                      <span className="material-symbols-outlined text-primary">person</span> Hồ sơ cá nhân
                    </Link>

                    {isAdmin && (
                      <Link href="/admin" onClick={() => setIsUserDropdownOpen(false)} className="flex items-center gap-3 px-6 py-3.5 hover:bg-rose-50 text-rose-500 font-bold text-sm">
                        <span className="material-symbols-outlined">admin_panel_settings</span> Quản trị viên
                      </Link>
                    )}

                    <div className="h-px bg-gray-50 dark:bg-gray-800 my-2 mx-4" />
                    
                    <button onClick={() => { supabase.auth.signOut(); window.location.href = '/'; }} className="w-full flex items-center gap-3 px-6 py-3.5 hover:bg-red-50 text-red-500 font-bold text-sm transition-colors">
                      <span className="material-symbols-outlined">logout</span> Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : !loading && (
            <Link href="/auth" className="px-8 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-all inline-block">
              Đăng nhập
            </Link>
          )}

          {/* Nút Mobile Menu */}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden size-11 flex items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
            <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {/* MOBILE MENU (Floating Card) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[120] flex flex-col items-center justify-start pt-24 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="relative w-[90%] max-w-sm bg-white dark:bg-gray-900 rounded-[3rem] p-6 shadow-2xl animate-in slide-in-from-top-10 duration-300" onClick={e => e.stopPropagation()}>
            <div className="space-y-1">
              {navLinks.map(link => (
                <Link key={link.href} href={link.href} onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${
                    pathname === link.href ? 'bg-primary text-white shadow-lg' : 'text-slate-600 dark:text-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="material-symbols-outlined">{link.icon}</span> {link.name}
                </Link>
              ))}
            </div>
            {user && (
              <button onClick={() => { supabase.auth.signOut(); window.location.href = '/'; }} className="w-full flex items-center gap-4 px-6 py-4 mt-4 rounded-2xl font-bold text-red-500 hover:bg-red-50">
                <span className="material-symbols-outlined">logout</span> Đăng xuất
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}