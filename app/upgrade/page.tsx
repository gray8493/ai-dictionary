"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import { supabase } from '@/lib/supabase';

export default function UpgradePage() {
  const [upgrading, setUpgrading] = useState(false);

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      // Get session token for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Vui lòng đăng nhập lại');
        return;
      }

      const response = await fetch('/api/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        alert('🎉 Chúc mừng! Bạn đã nâng cấp thành công gói Pro!');
        window.location.reload(); // Reload để cập nhật UI
      } else {
        alert('Lỗi nâng cấp: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4">
              Nâng cấp tài khoản
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Mở khóa toàn bộ tiềm năng học tiếng Anh với các tính năng AI tiên tiến
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Free Plan */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Gói Free</h2>
                  <div className="text-4xl font-black text-slate-900 dark:text-white mb-4">
                    $0<span className="text-lg font-normal">/tháng</span>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-green-500">check_circle</span>
                    <span className="text-slate-700 dark:text-slate-300">Lưu 50 từ vựng</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-green-500">check_circle</span>
                    <span className="text-slate-700 dark:text-slate-300">Bảng xếp hạng</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-green-500">check_circle</span>
                    <span className="text-slate-700 dark:text-slate-300">Bài tập cơ bản</span>
                  </div>
                  <div className="flex items-center gap-3 opacity-50">
                    <span className="material-symbols-outlined text-slate-400">cancel</span>
                    <span className="text-slate-500 dark:text-slate-500">AI trích xuất từ vựng</span>
                  </div>
                  <div className="flex items-center gap-3 opacity-50">
                    <span className="material-symbols-outlined text-slate-400">cancel</span>
                    <span className="text-slate-500 dark:text-slate-500">AI tạo bài tập thông minh</span>
                  </div>
                  <div className="flex items-center gap-3 opacity-50">
                    <span className="material-symbols-outlined text-slate-400">cancel</span>
                    <span className="text-slate-500 dark:text-slate-500">Ưu tiên hỗ trợ</span>
                  </div>
                </div>

                <button
                  className="w-full bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white py-3 px-6 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  disabled
                >
                  Gói hiện tại
                </button>
              </div>

              {/* Pro Plan */}
              <div className="bg-gradient-to-br from-primary to-blue-600 rounded-3xl shadow-xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold">
                  PHỔ BIẾN
                </div>

                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2">Gói Pro</h2>
                  <div className="text-4xl font-black mb-4">
                    $9.99<span className="text-lg font-normal">/tháng</span>
                  </div>
                  <p className="text-blue-100">Hoặc $99/năm (tiết kiệm 17%)</p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined">check_circle</span>
                    <span>Lưu từ vựng vô hạn</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined">check_circle</span>
                    <span>Bảng xếp hạng</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined">check_circle</span>
                    <span>AI trích xuất từ PDF/Image</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined">check_circle</span>
                    <span>AI tạo bài tập thông minh</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined">check_circle</span>
                    <span>Ưu tiên hỗ trợ</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined">check_circle</span>
                    <span>Cập nhật tính năng mới trước</span>
                  </div>
                </div>

                <button
                  onClick={handleUpgrade}
                  disabled={upgrading}
                  className="w-full bg-white text-primary py-3 px-6 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {upgrading ? 'Đang nâng cấp...' : 'Nâng cấp ngay (Free for Dev)'}
                </button>
              </div>
            </div>

            <div className="text-center mt-12">
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Có câu hỏi? <Link href="/support" className="text-primary hover:underline">Liên hệ hỗ trợ</Link>
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined">arrow_back</span>
                Quay lại trang chủ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}