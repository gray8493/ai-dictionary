"use client";

// src/app/page.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import Navbar from '@/components/Navbar';

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

const Footer = () => (
  <footer className="flex flex-col gap-8 px-5 py-16 mt-16 text-center border-t border-gray-200/80 dark:border-gray-700/50 @container">
    <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 @[480px]:flex-row @[480px]:justify-around">
      <a className="text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200 text-base font-normal leading-normal min-w-40" href="#">Về chúng tôi</a>
      <a className="text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200 text-base font-normal leading-normal min-w-40" href="#">Điều khoản dịch vụ</a>
      <a className="text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200 text-base font-normal leading-normal min-w-40" href="#">Chính sách bảo mật</a>
    </div>
    <div className="flex flex-wrap justify-center gap-6">
      <a href="#">
        <div className="text-slate-600 dark:text-gray-400 hover:text-primary">
          <svg aria-hidden="true" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
            <path clipRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" fillRule="evenodd"></path>
          </svg>
        </div>
      </a>
      <a href="#">
        <div className="text-slate-600 dark:text-gray-400 hover:text-primary">
          <svg aria-hidden="true" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.71v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
          </svg>
        </div>
      </a>
      <a href="#">
        <div className="text-slate-600 dark:text-gray-400 hover:text-primary">
          <svg aria-hidden="true" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
            <path clipRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.024.06 1.378.06 3.808s-.012 2.784-.06 3.808c-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.024.048-1.378.06-3.808.06s-2.784-.013-3.808-.06c-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.048-1.024-.06-1.378-.06-3.808s.012-2.784.06-3.808c.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 016.345 2.525c.636-.247 1.363-.416 2.427-.465C9.793 2.013 10.148 2 12.315 2zm-1.163 1.943c-1.042.045-1.698.21-2.227.427A3.396 3.396 0 006.166 6.166c-.217.529-.382 1.185-.427 2.227-.045 1.02-.057 1.347-.057 3.611s.012 2.59.057 3.611c.045 1.042.21 1.698.427 2.227a3.396 3.396 0 001.772 1.772c.529.217 1.185.382 2.227.427 1.02.045 1.347.057 3.611.057s2.59-.012 3.611-.057c1.042-.045 1.698-.21 2.227-.427a3.396 3.396 0 001.772-1.772c.217-.529.382-1.185.427-2.227.045-1.02.057-1.347.057-3.611s-.012-2.59-.057-3.611c-.045-1.042-.21-1.698-.427-2.227a3.396 3.396 0 00-1.772-1.772c-.529-.217-1.185-.382-2.227-.427C14.946 3.955 14.62 3.943 12.315 3.943h-1.163zM12 8.438a3.563 3.563 0 100 7.125 3.563 3.563 0 000-7.125zM12 14a2 2 0 110-4 2 2 0 010 4zm6.406-7.188a.938.938 0 100-1.875.938.938 0 000 1.875z" fillRule="evenodd"></path>
          </svg>
        </div>
      </a>
    </div>
    <p className="text-slate-600 dark:text-gray-400 text-sm font-normal leading-normal">© 2024 YourBrand. All rights reserved.</p>
  </footer>
);

// --- Main Component ---
export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
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