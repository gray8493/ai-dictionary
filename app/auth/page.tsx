// src/app/auth/page.tsx
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase'; // Đảm bảo bạn đã tạo file này ở bước trước
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  // --- BACKEND LOGIC STATES ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // --- HANDLERS ---
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSupabaseConfigured()) {
      alert("Supabase chưa được cấu hình. Vui lòng kiểm tra file .env.local.");
      return;
    }

    setLoading(true);

    if (isLogin) {
      // Logic Đăng nhập
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        alert("Lỗi đăng nhập: " + error.message);
      } else {
        router.push('/'); // Thành công chuyển về trang chủ
      }
    } else {
      // Logic Đăng ký
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        alert("Lỗi đăng ký: " + error.message);
      } else {
        alert("Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.");
      }
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    if (!isSupabaseConfigured()) {
      alert("Supabase chưa được cấu hình. Vui lòng kiểm tra file .env.local.");
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) alert(error.message);
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-x-hidden font-display">
      <main className="flex min-h-screen w-full items-center">
        <div className="grid w-full grid-cols-1 md:grid-cols-2">
          
          {/* --- CỘT TRÁI: HÌNH ẢNH MINH HỌA (Giữ nguyên) --- */}
          <div className="relative hidden h-screen flex-col items-center justify-center bg-primary/10 dark:bg-primary/20 md:flex">
            <div 
              className="absolute inset-0 w-full h-full bg-center bg-no-repeat bg-cover opacity-20 transition-all duration-700" 
              style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1000")' }}
            ></div>
            <div className="relative z-10 p-12 text-center text-gray-800 dark:text-gray-200">
              <h2 className="text-4xl font-black leading-tight tracking-tighter">
                Unlock Your World <br /> with English.
              </h2>
              <p className="mt-4 text-lg font-normal text-gray-600 dark:text-gray-400">
                Start your journey with us today and connect with the world.
              </p>
            </div>
          </div>

          {/* --- CỘT PHẢI: FORM ĐĂNG NHẬP / ĐĂNG KÝ --- */}
          <div className="flex w-full items-center justify-center p-4 sm:p-8">
            <div className="flex w-full max-w-md flex-col gap-8 py-3">
              
              <div className="flex flex-col gap-3 text-center">
                <h1 className="text-slate-900 dark:text-white text-4xl font-black tracking-tight">
                  {isLogin ? "Chào mừng trở lại!" : "Tạo tài khoản mới"}
                </h1>
                <p className="text-slate-500 dark:text-gray-400 text-base">
                  {isLogin 
                    ? "Đăng nhập để tiếp tục hành trình học của bạn." 
                    : "Đăng ký để bắt đầu trải nghiệm học tiếng Anh thông minh."}
                </p>
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex h-12 flex-1 items-center justify-center rounded-lg bg-gray-200/50 dark:bg-gray-700/50 p-1">
                  <button 
                    onClick={() => setIsLogin(true)}
                    className={`flex h-full grow items-center justify-center rounded-lg px-2 text-sm font-medium transition-all ${isLogin ? 'bg-white dark:bg-gray-900 shadow-sm text-primary' : 'text-gray-500'}`}
                  >
                    Đăng nhập
                  </button>
                  <button 
                    onClick={() => setIsLogin(false)}
                    className={`flex h-full grow items-center justify-center rounded-lg px-2 text-sm font-medium transition-all ${!isLogin ? 'bg-white dark:bg-gray-900 shadow-sm text-primary' : 'text-gray-500'}`}
                  >
                    Đăng ký
                  </button>
                </div>

                {/* --- TÍCH HỢP FORM ACTION --- */}
                <form className="flex flex-col gap-4" onSubmit={handleAuth}>
                  <div className="flex flex-col gap-2">
                    <label className="text-slate-900 dark:text-white text-base font-medium">Email</label>
                    <input 
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 focus:ring-2 focus:ring-primary/50 outline-none transition-all dark:text-white"
                      placeholder="Nhập địa chỉ email của bạn"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-baseline">
                      <label className="text-slate-900 dark:text-white text-base font-medium">Mật khẩu</label>
                      {isLogin && (
                        <Link href="#" className="text-sm font-medium text-primary hover:underline">Quên mật khẩu?</Link>
                      )}
                    </div>
                    <div className="relative flex items-stretch">
                      <input 
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 pr-12 focus:ring-2 focus:ring-primary/50 outline-none transition-all dark:text-white"
                        placeholder="Nhập mật khẩu"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-4 text-gray-500"
                      >
                        <span className="material-symbols-outlined">
                          {showPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                  </div>

                  <button 
                    disabled={loading}
                    type="submit"
                    className="flex h-14 w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-base font-bold text-white shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {loading ? "Đang xử lý..." : (isLogin ? "Đăng nhập" : "Đăng ký tài khoản")}
                  </button>
                </form>

                <div className="flex items-center gap-4">
                  <hr className="w-full border-gray-200 dark:border-gray-700"/>
                  <span className="text-sm text-gray-500">hoặc</span>
                  <hr className="w-full border-gray-200 dark:border-gray-700"/>
                </div>

                <button 
                  onClick={handleGoogleLogin}
                  type="button"
                  className="flex h-14 w-full items-center justify-center gap-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-base font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                >
                  <svg className="h-6 w-6" viewBox="0 0 24 24">
                    <path d="M22.477 12.2729C22.477 11.4547 22.4056 10.6593 22.2691 9.89111H12.2045V14.4365H18.1413C17.8821 15.9354 17.0722 17.2183 15.8239 18.0678V20.9419H19.6973C21.5239 19.2246 22.477 16.9233 22.477 14.1274C22.477 13.5183 22.477 12.8865 22.477 12.2729Z" fill="#4285F4"></path>
                    <path d="M12.2045 23.0002C15.1481 23.0002 17.6191 22.0466 19.6973 20.9421L15.8239 18.068C14.8647 18.7088 13.6288 19.0963 12.2045 19.0963C9.36643 19.0963 6.94998 17.1363 6.00256 14.6818H2.02539V17.6502C3.96163 20.8878 7.82255 23.0002 12.2045 23.0002Z" fill="#34A853"></path>
                    <path d="M6.00258 14.6817C5.77296 14.032 5.63645 13.3363 5.63645 12.6181C5.63645 11.9001 5.77296 11.2044 6.00258 10.5549V7.58643H2.02541C1.23398 9.0939 0.772727 10.8038 0.772727 12.6181C0.772727 14.4325 1.23398 16.1423 2.02541 17.6498L6.00258 14.6817Z" fill="#FBBC05"></path>
                    <path d="M12.2045 6.13989C13.6743 6.13989 15.2533 6.67832 16.3867 7.75739L19.7849 4.35919C17.6105 2.38102 15.1481 1.23633 12.2045 1.23633C7.82255 1.23633 3.96163 3.3487 2.02539 6.58625L6.00256 9.55469C6.94998 7.09995 9.36643 5.13989 12.2045 5.13989Z" fill="#EA4335"></path>
                  </svg>
                  <span>{isLogin ? "Đăng nhập với Google" : "Đăng ký với Google"}</span>
                </button>

                <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                  {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
                  <button 
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="font-semibold text-primary hover:underline"
                  >
                    {isLogin ? "Đăng ký ngay" : "Đăng nhập ngay"}
                  </button>
                </p>
              </div>

              <div className="mt-4 text-center">
                <Link href="/" className="text-sm text-gray-400 hover:text-primary transition-colors flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-base">arrow_back</span>
                  Quay lại trang chủ
                </Link>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}