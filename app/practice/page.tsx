// src/app/practice/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import AuthGuard from '@/components/AuthGuard';

/** * LOCAL COMPONENT: NAV_ITEM
 */
const NavItem = ({ href, label, active = false }: { href: string; label: string; active?: boolean }) => (
  <Link
    href={href}
    className={`text-sm font-medium transition-colors ${active ? 'text-primary font-bold' : 'text-slate-600 dark:text-gray-400 hover:text-primary'}`}
  >
    {label}
  </Link>
);

/** * LOCAL COMPONENT: EXERCISE CARD
 * Giúp tái sử dụng code cho 3 loại bài tập
 */
const ExerciseCard = ({ href, icon, title, desc, colorClass, iconBg }: any) => (
  <Link href={href} className="w-full text-left relative group h-full">
    <div className={`h-full flex flex-col gap-4 p-6 rounded-3xl bg-white dark:bg-[#1A2C32] border-2 border-slate-100 dark:border-slate-800 hover:border-${colorClass}-500 hover:bg-${colorClass}-50/50 dark:hover:bg-${colorClass}-900/10 hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}>
      <div className="flex justify-between items-start">
        <div className={`p-3 ${iconBg} rounded-2xl`}>
          <span className="material-symbols-outlined text-3xl">{icon}</span>
        </div>
        <div className={`size-10 rounded-full bg-slate-50 dark:bg-slate-800 group-hover:bg-${colorClass}-500 group-hover:text-white text-slate-400 flex items-center justify-center transition-all duration-300`}>
          <span className="material-symbols-outlined text-[24px]">arrow_forward</span>
        </div>
      </div>
      <div>
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xl">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed">{desc}</p>
      </div>
    </div>
  </Link>
);

export default function PracticeMainPage() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

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

  // Check auth and fetch user profile
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background-light dark:bg-background-dark font-display">
        {/* Header / Navbar */}
        <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4 bg-white/50 dark:bg-black/20 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="size-6 text-primary">
              <svg fill="currentColor" viewBox="0 0 48 48"><path d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z"></path></svg>
            </div>
            <h2 className="text-xl font-bold dark:text-white">VocabLearn</h2>
          </div>
          <nav className="hidden md:flex gap-8">
            <NavItem href="/" label="Home" />
            <NavItem href="/vocabulary" label="Tra từ" />
            <NavItem href="/my-vocabulary" label="Từ của tôi" />
            <NavItem href="/practice" label="Luyện tập" active />
            <NavItem href="/leaderboard" label="Bảng xếp hạng" />
          </nav>
          <div className="flex items-center gap-4">
            {user && userProfile && (
              <div className="hidden md:flex items-center gap-4 mr-4">
                <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 rounded-full">
                  <span className="text-yellow-600 dark:text-yellow-400 text-sm">⭐</span>
                  <span className="text-yellow-800 dark:text-yellow-200 font-bold">
                    Level {userProfile.level}
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
            {user ? (
              <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                Đăng xuất
              </button>
            ) : (
              <Link href="/auth" className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90">
                Đăng nhập
              </Link>
            )}
          </div>
        </header>

        <div className="layout-container flex h-full grow flex-col">
          <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-20 flex flex-1 justify-center py-5">
            <div className="layout-content-container flex flex-col max-w-[800px] flex-1 w-full">

            <main className="flex flex-col gap-8 mb-20">
              <div>
                <h1 className="text-3xl font-black tracking-tight">Vocabulary Practice</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Select your source material and start a session</p>
              </div>

              {/* ACTIVE LIST BANNER */}
              <div className="relative w-full bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-500/20 overflow-hidden group">
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="size-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white">
                      <span className="material-symbols-outlined text-3xl">collections_bookmark</span>
                    </div>
                    <div>
                      <div className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                        <span className="size-1.5 rounded-full bg-green-400"></span> Active List
                      </div>
                      <h2 className="text-2xl font-black mb-2 tracking-tight">My Words</h2>
                      <div className="text-sm font-medium text-blue-50">
                        <span className="px-2 py-0.5 rounded bg-white/20 text-white text-xs font-bold mr-2">142</span>
                        words pending review
                      </div>
                    </div>
                  </div>
                  <Link href="/my-vocabulary" className="px-6 py-3 bg-white text-blue-600 hover:bg-blue-50 rounded-xl font-bold transition-all active:scale-95 flex items-center gap-2 ring-4 ring-white/20">
                    <span className="material-symbols-outlined text-[20px]">library_add</span>
                    Select from 'My Words'
                  </Link>
                </div>
              </div>

              {/* PROGRESS BAR */}
              <div className="bg-white dark:bg-[#1A2C32] p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm flex flex-col gap-2">
                <div className="flex justify-between text-xs font-bold uppercase text-slate-500">
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px] text-orange-500">local_fire_department</span> Daily Goal</span>
                  <span className="text-slate-700 dark:text-slate-300">5/20 words</span>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-500" style={{ width: "25%" }}></div>
                </div>
              </div>

              {/* GRID EXERCISES */}
              <div className="flex flex-col gap-1 mt-2">
                <h3 className="text-slate-800 dark:text-white text-xl font-bold">Choose Exercise Type</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <ExerciseCard 
                  href="/practice/meaning-quiz"
                  icon="quiz"
                  title="Meaning Quiz"
                  desc="Choose correct definitions"
                  colorClass="blue"
                  iconBg="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                />
                <ExerciseCard 
                  href="/practice/fill-blank"
                  icon="edit_note"
                  title="Fill in Blank"
                  desc="Complete the sentence"
                  colorClass="purple"
                  iconBg="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                />
                <ExerciseCard 
                  href="/practice/pronunciation"
                  icon="mic"
                  title="Pronunciation"
                  desc="Speak and get graded"
                  colorClass="teal"
                  iconBg="bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400"
                />
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}