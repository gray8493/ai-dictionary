"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

  const checkUserStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('status')
        .eq('user_id', userId)
        .single();

      if (!error && data) {
        setStatus(data.status);
      }
    } catch (err) {
      console.error('Error checking user status:', err);
    }
  };

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await checkUserStatus(user.id);
      }
      setLoading(false);
    };

    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await checkUserStatus(currentUser.id);
        } else {
          setStatus(null);
        }
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return fallback || (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-[#0d181b] dark:text-white mb-4">
          Yêu cầu đăng nhập
        </h2>
        <p className="text-[#4c869a] dark:text-gray-400 mb-8 max-w-md">
          Bạn cần đăng nhập để sử dụng tính năng này. Đây là tính năng cao cấp chỉ dành cho thành viên.
        </p>
        <Link
          href="/auth"
          className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-6 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:opacity-90"
        >
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  if (status === 'locked') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-white dark:bg-slate-900 fixed inset-0 z-[999]">
        <div className="text-8xl mb-6 animate-bounce">🚫</div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4">
          Tài khoản đã bị khóa
        </h1>
        <div className="max-w-md bg-red-50 dark:bg-red-900/20 p-6 rounded-3xl border border-red-100 dark:border-red-900/30 mb-8">
          <p className="text-red-600 dark:text-red-400 font-medium">
            Truy cập của bạn đã bị tạm dừng do vi phạm điều khoản hoặc theo yêu cầu của quản trị viên.
          </p>
        </div>
        <p className="text-slate-500 dark:text-gray-400 mb-8">
          Vui lòng liên hệ với bộ phận hỗ trợ nếu bạn cho rằng đây là một sự nhầm lẫn.
        </p>
        <button
          onClick={() => supabase.auth.signOut()}
          className="flex min-w-[200px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-14 px-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-lg font-black transition-all hover:scale-105 active:scale-95 shadow-xl"
        >
          Đăng xuất
        </button>
      </div>
    );
  }

  return <>{children}</>;
}