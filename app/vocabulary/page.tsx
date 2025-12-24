// src/app/vocabulary/page.tsx
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase'; // Đảm bảo bạn đã có file này

// --- Local Components ---

const VocabNavbar = () => (
  <header className="flex items-center justify-between border-b border-gray-200/80 dark:border-gray-700/80 px-4 sm:px-10 py-3">
    <div className="flex items-center gap-4 text-gray-900 dark:text-gray-100">
      <div className="size-6 text-primary">
        <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          <path d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fill="currentColor"></path>
        </svg>
      </div>
      <h2 className="text-lg font-bold">VocabLearn</h2>
    </div>
    <nav className="hidden md:flex gap-8 items-center">
      <Link href="/" className="text-sm font-medium text-gray-800 dark:text-gray-200">Home</Link>
      <Link href="/my-vocabulary" className="text-sm font-medium text-gray-800 dark:text-gray-200">My Vocabulary</Link>
      <Link href="/auth" className="bg-primary text-white px-4 py-2 rounded-full text-sm font-bold">Tài khoản</Link>
    </nav>
  </header>
);

// Thêm props onSave để xử lý lưu vào database
const VocabCard = ({ word, ipa, meaning, example, img, onSave, audioUrl }: any) => {
  const playAudio = () => {
    if (audioUrl) {
      new Audio(audioUrl).play();
    } else {
      alert("Không có âm thanh cho từ này");
    }
  };

  return (
    <div className="flex flex-col @xl:flex-row bg-white dark:bg-gray-800/50 p-6 rounded-lg gap-6 shadow-sm">
      <div className="w-full @xl:w-1/3 aspect-video rounded-lg bg-cover bg-center" style={{backgroundImage: `url(${img})`}}></div>
      <div className="flex-1 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold dark:text-white">{word}</span>
          <span className="text-gray-500">{ipa}</span>
          <button onClick={playAudio} className="text-primary hover:scale-110 transition-transform">
            <span className="material-symbols-outlined">volume_up</span>
          </button>
        </div>
        <p className="font-medium dark:text-gray-200">{meaning}</p>
        <p className="text-sm italic text-gray-500">Example: {example}</p>
        <div className="flex justify-end">
          <button 
            onClick={() => onSave({ word, ipa, meaning, example })}
            className="bg-primary text-white px-5 py-2 rounded-full text-sm flex items-center gap-2 hover:bg-opacity-90 transition-all"
          >
            <span className="material-symbols-outlined text-sm">bookmark_add</span> Lưu từ
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---
export default function VocabularyPage() {
  const [search, setSearch] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 1. Logic tra cứu API thực tế
  const handleSearch = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && search.trim()) {
      setLoading(true);
      try {
        const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${search}`);
        const data = await res.json();
        if (res.ok) {
          const entry = data[0];
          setResult({
            word: entry.word,
            ipa: entry.phonetic || entry.phonetics.find((p: any) => p.text)?.text || "",
            meaning: entry.meanings[0].definitions[0].definition,
            example: entry.meanings[0].definitions[0].example || "No example available.",
            audioUrl: entry.phonetics.find((p: any) => p.audio !== "")?.audio || "",
            img: `https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=500` // Ảnh minh họa mặc định
          });
        } else {
          alert("Không tìm thấy từ này!");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  // 2. Logic lưu vào Supabase Database
  const handleSaveToDb = async (vocabData: any) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert("Vui lòng đăng nhập để lưu từ vựng!");
      return;
    }

    const { error } = await supabase
      .from('vocabularies')
      .insert([
        { 
          user_id: user.id, 
          word: vocabData.word, 
          ipa: vocabData.ipa, 
          meaning: vocabData.meaning, 
          example: vocabData.example 
        }
      ]);

    if (error) {
      alert("Lỗi: " + error.message);
    } else {
      alert("Đã lưu thành công vào 'Từ của tôi'!");
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-4xl mx-auto px-4 py-5">
        <VocabNavbar />
        <main className="py-10 flex flex-col gap-8">
          <h1 className="text-4xl md:text-5xl font-black text-center dark:text-white">Tra cứu & Học từ vựng</h1>
          
          <div className="relative">
            <span className="absolute left-4 top-4 text-gray-400 material-symbols-outlined">search</span>
            <input 
              className="w-full pl-12 pr-4 py-4 rounded-lg border-none ring-1 ring-gray-200 dark:ring-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary outline-none"
              placeholder="Nhập từ và ấn Enter..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>

          <div className="flex flex-col gap-6 @container">
            {loading && <p className="text-center dark:text-white">Đang tìm kiếm...</p>}
            
            {/* Hiển thị kết quả thực từ API */}
            {result ? (
              <VocabCard 
                {...result}
                onSave={handleSaveToDb}
              />
            ) : (
              // Dữ liệu mặc định khi chưa tìm kiếm (giữ FE gốc)
              <>
                <VocabCard 
                  word="Minimalism" ipa="/ˈmɪnɪməlɪzəm/" meaning="Chủ nghĩa tối giản" 
                  example="Minimalism is a style in art and design." 
                  img="https://images.unsplash.com/photo-1505330622279-bf7d7fc918f4?q=80&w=500"
                  onSave={handleSaveToDb}
                />
                <VocabCard 
                  word="Aesthetic" ipa="/esˈθetɪk/" meaning="Có tính thẩm mỹ" 
                  example="The building has great aesthetic appeal." 
                  img="https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=500"
                  onSave={handleSaveToDb}
                />
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}