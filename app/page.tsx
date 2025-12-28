"use client";

// src/app/page.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const FeatureCard = ({ icon, title, desc }: { icon: string; title: string; desc: string }) => (
  <div className="flex flex-1 gap-4 rounded-lg border border-gray-200/80 dark:border-gray-700/50 bg-white/50 dark:bg-background-dark/50 p-6 flex-col">
    <div className="text-primary">
      <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>{icon}</span>
    </div>
    <div className="flex flex-col gap-1">
      <h3 className="text-slate-900 dark:text-white text-lg font-bold">{title}</h3>
      <p className="text-slate-600 dark:text-gray-400 text-sm font-normal">{desc}</p>
    </div>
  </div>
);

// --- Main Component ---
export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
          level: 'Learner',
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
            level: 'Learner',
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

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        fetchUserProfile();
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
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleStartLearning = () => {
    if (user) {
      // Đã đăng nhập, chuyển đến vocabulary
      router.push('/vocabulary');
    } else {
      // Chưa đăng nhập, chuyển đến auth
      router.push('/auth');
    }
  };

  if (loading) {
    return (
      <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden">
        <div className="layout-container flex h-full grow flex-col">
          <div className="px-4 md:px-10 lg:px-20 xl:px-40 flex flex-1 justify-center py-5">
            <div className="layout-content-container flex flex-col max-w-6xl w-full flex-1">
              <Navbar />
              <main className="flex-grow flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </main>
              <Footer />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden">
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-4 md:px-10 lg:px-20 xl:px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-6xl w-full flex-1">
            <Navbar />
            <main className="flex-grow">
              <div className="flex flex-col-reverse gap-10 px-4 py-16 text-center sm:px-6 md:py-24 lg:flex-row lg:text-left lg:items-center">
                <div className="flex flex-col gap-8 lg:w-1/2">
                  <h1 className="text-slate-900 dark:text-white text-4xl font-black leading-tight sm:text-5xl md:text-6xl">Học Tiếng Anh Thông Minh</h1>
                  <h2 className="text-slate-600 dark:text-gray-300 text-base font-normal sm:text-lg">Khám phá phương pháp học tập hiệu quả với AI.</h2>
                  <button onClick={handleStartLearning} className="self-center lg:self-start flex min-w-[84px] items-center justify-center rounded-full h-12 px-6 bg-primary text-white text-base font-bold hover:opacity-90">
                    Bắt đầu học
                  </button>
                </div>
                <div className="w-full lg:w-1/2">
                   <div className="w-full bg-slate-200 aspect-video rounded-lg bg-cover bg-center" style={{backgroundImage: 'url("https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=1000")'}}></div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
                <FeatureCard icon="search" title="Tra cứu tức thì" desc="Tìm từ vựng nhanh chóng." />
                <FeatureCard icon="checklist" title="Bài tập đa dạng" desc="Luyện tập cá nhân hóa." />
                <FeatureCard icon="auto_awesome" title="Lọc từ bằng AI" desc="Trích xuất từ bằng AI." />
              </div>
            </main>
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
}