// src/app/page.tsx
import React from 'react';
import Link from 'next/link'; // Import Link để chuyển trang không load lại
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
  <footer className="bg-white dark:bg-background-dark border-t border-gray-200/80 dark:border-gray-700/50 py-8 px-4 md:px-10 lg:px-20 xl:px-40">
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-4 mb-4">
            <div className="size-8 text-primary">
              <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z"></path>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">YourBrand</h2>
          </div>
          <p className="text-slate-600 dark:text-gray-400 text-sm">
            Khám phá phương pháp học tập hiệu quả với AI để nâng cao kỹ năng tiếng Anh của bạn.
          </p>
        </div>
        <div>
          <h3 className="text-slate-900 dark:text-white text-lg font-bold mb-4">Liên kết</h3>
          <ul className="space-y-2">
            <li><Link href="/" className="text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200 text-sm">Trang chủ</Link></li>
            <li><Link href="/vocabulary" className="text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200 text-sm">Tìm Kiếm</Link></li>
            <li><Link href="/practice" className="text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200 text-sm">Bài tập</Link></li>
            <li><Link href="/ai-extract" className="text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200 text-sm">AI Extract</Link></li>
            <li><Link href="/my-vocabulary" className="text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200 text-sm">Từ vựng</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-slate-900 dark:text-white text-lg font-bold mb-4">Hỗ trợ</h3>
          <ul className="space-y-2">
            <li><a href="#" className="text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200 text-sm">Liên hệ</a></li>
            <li><a href="#" className="text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200 text-sm">FAQ</a></li>
            <li><a href="/auth" className="text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200 text-sm">Đăng nhập</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-200/80 dark:border-gray-700/50 mt-8 pt-8 text-center">
        <p className="text-slate-600 dark:text-gray-400 text-sm">
          © {new Date().getFullYear()} YourBrand. Tất cả quyền được bảo lưu.
        </p>
      </div>
    </div>
  </footer>
);

// --- Main Component ---
export default function HomePage() {
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
                  <Link href="/vocabulary" className="self-center lg:self-start flex min-w-[84px] items-center justify-center rounded-full h-12 px-6 bg-primary text-white text-base font-bold">
                    Bắt đầu học
                  </Link>
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
          </div>
        </div>
      </div>
    </div>
  );
}