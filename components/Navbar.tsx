"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

const Navbar = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) alert(error.message);
  };

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
              <div className="flex items-center gap-2">
                <button
                  onClick={handleGoogleLogin}
                  className="flex items-center gap-2 min-w-[84px] cursor-pointer justify-center rounded-full h-10 px-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-slate-900 dark:text-white text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.477 12.2729C22.477 11.4547 22.4056 10.6593 22.2691 9.89111H12.2045V14.4365H18.1413C17.8821 15.9354 17.0722 17.2183 15.8239 18.0678V20.9419H19.6973C21.5239 19.2246 22.477 16.9233 22.477 14.1274C22.477 13.5183 22.477 12.8865 22.477 12.2729Z" fill="#4285F4"></path>
                    <path d="M12.2045 23.0002C15.1481 23.0002 17.6191 22.0466 19.6973 20.9421L15.8239 18.068C14.8647 18.7088 13.6288 19.0963 12.2045 19.0963C9.36643 19.0963 6.94998 17.1363 6.00256 14.6818H2.02539V17.6502C3.96163 20.8878 7.82255 23.0002 12.2045 23.0002Z" fill="#34A853"></path>
                    <path d="M6.00258 14.6817C5.77296 14.032 5.63645 13.3363 5.63645 12.6181C5.63645 11.9001 5.77296 11.2044 6.00258 10.5549V7.58643H2.02541C1.23398 9.0939 0.772727 10.8038 0.772727 12.6181C0.772727 14.4325 1.23398 16.1423 2.02541 17.6498L6.00258 14.6817Z" fill="#FBBC05"></path>
                    <path d="M12.2045 6.13989C13.6743 6.13989 15.2533 6.67832 16.3867 7.75739L19.7849 4.35919C17.6105 2.38102 15.1481 1.23633 12.2045 1.23633C7.82255 1.23633 3.96163 3.3487 2.02539 6.58625L6.00256 9.55469C6.94998 7.09995 9.36643 5.13989 12.2045 5.13989Z" fill="#EA4335"></path>
                  </svg>
                  Google
                </button>
                <Link href="/auth">
                  <button className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-full h-10 px-4 bg-primary text-white text-sm font-bold">
                    Login
                  </button>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;