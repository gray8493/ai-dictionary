"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

const Navbar = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kiểm tra trạng thái đăng nhập hiện tại
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    // Lắng nghe thay đổi trạng thái auth
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-gray-200/80 dark:border-gray-700/50 px-6 sm:px-10 py-4">
      <div className="flex items-center gap-4 text-slate-900 dark:text-white">
        <div className="size-6 text-primary">
          <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z"></path>
          </svg>
        </div>
        <h2 className="text-xl font-bold leading-tight tracking-tight">AI DICTIONARY</h2>
      </div>
      <div className="hidden lg:flex flex-1 justify-center gap-8">
        <div className="flex items-center gap-9">
          <Link href="/" className="text-slate-900 dark:text-gray-200 text-sm font-medium">Home</Link>
          <Link href="/vocabulary" className="text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200 text-sm font-medium">Tìm Kiếm</Link>
          <Link href="/practice" className="text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200 text-sm font-medium">Bài tập</Link>
          <Link href="/ai-extract" className="text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200 text-sm font-medium">AI Extract</Link>
          <Link href="/my-vocabulary" className="text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200 text-sm font-medium">Từ vựng</Link>
        </div>
      </div>
      <div className="flex items-center justify-end">
        {!loading && (
          <>
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-slate-900 dark:text-white text-sm">
                  Xin chào, {user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-full h-10 px-4 bg-red-500 text-white text-sm font-bold hover:bg-red-600"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <Link href="/auth">
                <button className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-full h-10 px-4 bg-primary text-white text-sm font-bold">
                  Login
                </button>
              </Link>
            )}
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;