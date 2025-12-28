// src/app/vocabulary/page.tsx
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase'; // Đảm bảo bạn đã có file này
import AuthGuard from '@/components/AuthGuard';
import Navbar from '@/components/Navbar';

// --- Local Components ---

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
  const [mode, setMode] = useState<'word' | 'translate'>('word');
  const [search, setSearch] = useState("");
  const [translateInput, setTranslateInput] = useState("");
  const [result, setResult] = useState<any>(null);
  const [translation, setTranslation] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");

  // 1. Logic tra cứu từ đơn
  const handleWordSearch = async (e: React.KeyboardEvent) => {
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
            img: `https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=500`
          });
          setTranslation("");
        } else {
          setMessage("Không tìm thấy từ này!");
          setTimeout(() => setMessage(''), 3000);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  // 2. Logic dịch văn bản
  const handleTranslate = async () => {
    if (!translateInput.trim()) {
      setMessage("Vui lòng nhập văn bản để dịch!");
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setLoading(true);
    try {
      // Use our API route for translation
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: translateInput }),
      });

      if (response.ok) {
        const data = await response.json();
        setTranslation(data.translation);
        setResult(null);
      } else {
        setMessage("Lỗi khi dịch văn bản!");
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      console.error("Translation error:", err);
      setMessage("Lỗi kết nối dịch vụ dịch!");
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  // 3. Logic lưu từ vựng
  const handleSaveToDb = async (vocabData: any) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Vui lòng đăng nhập để lưu từ vựng!");
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const { error } = await supabase
      .from('vocabularies')
      .insert([
        {
          user_id: user.id,
          word: vocabData.word,
          ipa: vocabData.ipa || '',
          meaning: vocabData.meaning || vocabData.definition,
        }
      ]);

    if (error) {
      setMessage("Lỗi: " + error.message);
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage("Đã lưu thành công!");
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // 4. Lưu từ vựng từ kết quả tra cứu
  const handleSaveWord = async (wordData: any) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Vui lòng đăng nhập để lưu từ vựng!");
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const { error } = await supabase
      .from('vocabularies')
      .insert([
        {
          user_id: user.id,
          word: wordData.word,
          ipa: wordData.ipa || '',
          meaning: wordData.meaning,
        }
      ]);

    if (error) {
      setMessage("Lỗi: " + error.message);
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage("Đã lưu thành công!");
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-5">
          {message && (
            <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
              {message}
            </div>
          )}
          <main className="py-10 flex flex-col gap-8">
            <h1 className="text-4xl md:text-5xl font-black text-center dark:text-white">Tra cứu & Học từ vựng</h1>

            {/* Mode Toggle */}
            <div className="flex justify-center">
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setMode('word')}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                    mode === 'word'
                      ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  Tra cứu từ vựng
                </button>
                <button
                  onClick={() => setMode('translate')}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                    mode === 'translate'
                      ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  Dịch văn bản
                </button>
              </div>
            </div>

            {/* Input Section */}
            {mode === 'word' ? (
              <div className="relative">
                <span className="absolute left-4 top-4 text-gray-400 material-symbols-outlined">search</span>
                <input
                  className="w-full pl-12 pr-4 py-4 rounded-lg border-none ring-1 ring-gray-200 dark:ring-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Nhập từ tiếng Anh và ấn Enter để tra cứu..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleWordSearch}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <textarea
                  className="w-full h-32 p-4 rounded-lg border-none ring-1 ring-gray-200 dark:ring-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary outline-none resize-none"
                  placeholder="Nhập văn bản hoặc đoạn văn tiếng Anh để dịch sang tiếng Việt..."
                  value={translateInput}
                  onChange={(e) => setTranslateInput(e.target.value)}
                />
                <div className="flex justify-center">
                  <button
                    onClick={handleTranslate}
                    disabled={loading || !translateInput.trim()}
                    className="bg-primary text-white px-8 py-3 rounded-lg font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Đang dịch...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">translate</span>
                        Dịch sang tiếng Việt
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Results Section */}
            <div className="flex flex-col gap-6 @container">
              {loading && <p className="text-center dark:text-white">Đang xử lý...</p>}

              {/* Word Search Results */}
              {mode === 'word' && result && (
                <VocabCard {...result} onSave={handleSaveWord} />
              )}

              {/* Translation Results */}
              {mode === 'translate' && translation && (
                <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary">translate</span>
                    <h2 className="text-xl font-bold dark:text-white">Kết quả dịch</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Tiếng Anh:</h3>
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{translateInput}</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Tiếng Việt:</h3>
                      <div className="p-4 bg-primary/5 dark:bg-primary/10 rounded-lg border-2 border-primary/20">
                        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-medium">{translation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Default examples when no results */}
              {mode === 'word' && !result && !loading && (
                <>
                  <VocabCard
                    word="Hello" ipa="/həˈloʊ/" meaning="Xin chào"
                    example="Hello, how are you today?"
                    img="https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=500"
                    onSave={handleSaveWord}
                  />
                  <VocabCard
                    word="Thank you" ipa="/ˈθæŋk ju/" meaning="Cảm ơn"
                    example="Thank you for your help."
                    img="https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=500"
                    onSave={handleSaveWord}
                  />
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}