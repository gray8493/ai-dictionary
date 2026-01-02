// src/app/vocabulary/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import AuthGuard from '@/components/AuthGuard';
import Navbar from '@/components/Navbar';

const typeMapping: { [key: string]: string } = {
  'noun': 'Danh từ',
  'verb': 'Động từ',
  'adjective': 'Tính từ',
  'adverb': 'Trạng từ',
  'pronoun': 'Đại từ',
  'preposition': 'Giới từ',
  'conjunction': 'Liên từ',
  'interjection': 'Thán từ',
  'word': 'Từ vựng',
  'phrase': 'Cụm từ'
};

const VocabCard = ({ word, ipa, meaning, example, img, onSave, audioUrl, type }: any) => {
  const playAudio = () => {
    if (audioUrl) {
      new Audio(audioUrl).play();
    } else {
      alert("Không có âm thanh cho từ này");
    }
  };

  return (
    <div className="flex flex-col @xl:flex-row bg-white dark:bg-gray-800/50 p-6 rounded-lg gap-6 shadow-sm">
      <div className="w-full @xl:w-1/3 aspect-video rounded-lg bg-cover bg-center" style={{ backgroundImage: `url(${img})` }}></div>
      <div className="flex-1 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold dark:text-white">{word}</span>
          {type && (
            <span className="text-sm px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-md text-slate-500 italic">
              ({type.split(', ').map((t: string) => typeMapping[t.toLowerCase()] || t).join(', ')})
            </span>
          )}
          <span className="text-gray-500">{ipa}</span>
          <button onClick={playAudio} className="text-primary hover:scale-110 transition-transform">
            <span className="material-symbols-outlined">volume_up</span>
          </button>
        </div>
        <p className="font-medium dark:text-gray-200">{meaning}</p>
        <p className="text-sm italic text-gray-500">Example: {example}</p>
        <div className="flex justify-end">
          <button
            onClick={() => onSave({ word, ipa, meaning, example, type })}
            className="bg-primary text-white px-5 py-2 rounded-full text-sm flex items-center gap-2 hover:bg-opacity-90 transition-all"
          >
            <span className="material-symbols-outlined text-sm">bookmark_add</span> Lưu từ
          </button>
        </div>
      </div>
    </div>
  );
};

export default function VocabularyPage() {
  const [mode, setMode] = useState<'word' | 'translate'>('word');
  const [search, setSearch] = useState("");
  const [translateInput, setTranslateInput] = useState("");
  const [result, setResult] = useState<any>(null);
  const [translation, setTranslation] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const history = localStorage.getItem('vocabulary_search_history');
    if (history) {
      setSearchHistory(JSON.parse(history));
    } else {
      // Initialize with some sample words for demo
      const sampleHistory = ['hello', 'world', 'computer', 'language', 'learning'];
      setSearchHistory(sampleHistory);
      saveSearchHistory(sampleHistory);
    }
  }, []);

  const saveSearchHistory = (history: string[]) => {
    localStorage.setItem('vocabulary_search_history', JSON.stringify(history));
    setSearchHistory(history);
  };

  const handleWordSearch = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && search.trim()) {
      setLoading(true);
      try {
        const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${search}`);
        const data = await res.json();
        if (res.ok) {
          const entry = data[0];
          // Lấy tất cả loại từ
          const allTypes = Array.from(new Set(entry.meanings.map((m: any) => m.partOfSpeech))).join(', ');

          // Ưu tiên lấy định nghĩa của verb nếu có, nếu không lấy cái đầu tiên
          const verbMeaning = entry.meanings.find((m: any) => m.partOfSpeech === 'verb');
          const primaryMeaning = verbMeaning || entry.meanings[0];
          const englishMeaning = primaryMeaning.definitions[0].definition;

          // Translate meaning to Vietnamese
          let vietnameseMeaning = englishMeaning;
          try {
            const translateResponse = await fetch('/api/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: englishMeaning }),
            });
            if (translateResponse.ok) {
              const translateData = await translateResponse.json();
              vietnameseMeaning = translateData.translation;
            }
          } catch (translateErr) {
            console.log('Translation failed, using English meaning');
          }

          // Add to search history
          const updatedHistory = [search.trim(), ...searchHistory.filter(w => w !== search.trim())].slice(0, 20);
          saveSearchHistory(updatedHistory);

          setResult({
            word: entry.word,
            ipa: entry.phonetic || entry.phonetics.find((p: any) => p.text)?.text || "",
            type: allTypes,
            meaning: vietnameseMeaning,
            englishMeaning: englishMeaning, // Keep original for reference
            example: primaryMeaning.definitions[0].example || "No example available.",
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

  const handleTranslate = async () => {
    if (!translateInput.trim()) {
      setMessage("Vui lòng nhập văn bản để dịch!");
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setLoading(true);
    try {
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

  const handleSaveWord = async (wordData: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setMessage("Vui lòng đăng nhập để lưu từ vựng!");
        setTimeout(() => setMessage(''), 3000);
        return;
      }

      const response = await fetch('/api/my-vocabulary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          word: wordData.word,
          ipa: wordData.ipa || '',
          meaning: wordData.meaning,
          type: wordData.type || 'word'
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Lỗi khi lưu từ");
      }

      setMessage("Đã lưu thành công!");
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage("Lỗi: " + err.message);
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

            <div className="flex justify-center">
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setMode('word')}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${mode === 'word'
                    ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                >
                  Tra cứu từ vựng
                </button>
                <button
                  onClick={() => setMode('translate')}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${mode === 'translate'
                    ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                >
                  Dịch văn bản
                </button>
              </div>
            </div>

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

            <div className="flex flex-col gap-6 @container">
              {loading && <p className="text-center dark:text-white">Đang xử lý...</p>}

              {mode === 'word' && result && (
                <VocabCard {...result} onSave={handleSaveWord} />
              )}

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

              {/* Search History */}
              {mode === 'word' && !result && !loading && searchHistory.length > 0 && (
                <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary">history</span>
                    <h2 className="text-xl font-bold dark:text-white">Lịch sử tìm kiếm</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {searchHistory.slice(0, 10).map((word, index) => (
                      <button
                        key={index}
                        onClick={() => setSearch(word)}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary hover:text-white transition-colors"
                      >
                        {word}
                      </button>
                    ))}
                  </div>
                  {searchHistory.length > 10 && (
                    <p className="text-sm text-gray-500 mt-2">
                      Và {searchHistory.length - 10} từ khác...
                    </p>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
