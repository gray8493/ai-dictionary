// src/app/vocabulary/page.tsx
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase'; // Đảm bảo bạn đã có file này
import AuthGuard from '@/components/AuthGuard';

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
  const [mode, setMode] = useState<'word' | 'text'>('word');
  const [search, setSearch] = useState("");
  const [textInput, setTextInput] = useState("");
  const [result, setResult] = useState<any>(null);
  const [textResults, setTextResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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
          setTextResults(null);
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

  // 2. Logic phân tích văn bản với AI
  const handleTextAnalysis = async () => {
    if (!textInput.trim()) {
      alert("Vui lòng nhập văn bản để phân tích!");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/analyze-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: textInput }),
      });

      if (response.ok) {
        const data = await response.json();
        setTextResults(data);
        setResult(null);
      } else {
        alert("Lỗi khi phân tích văn bản!");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối!");
    } finally {
      setLoading(false);
    }
  };

  // 3. Logic lưu từ vựng
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
          ipa: vocabData.ipa || '',
          meaning: vocabData.meaning || vocabData.definition,
        }
      ]);

    if (error) {
      alert("Lỗi: " + error.message);
    } else {
      alert("Đã lưu thành công!");
    }
  };

  // 4. Lưu tất cả từ từ kết quả phân tích
  const handleSaveAllFromText = async () => {
    if (!textResults) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Vui lòng đăng nhập!");
      return;
    }

    const allWords = [
      ...(textResults.Easy || []),
      ...(textResults.Medium || []),
      ...(textResults.Hard || [])
    ];

    let successCount = 0;
    for (const word of allWords) {
      try {
        await supabase.from('vocabularies').insert([{
          user_id: user.id,
          word: word.word,
          ipa: word.ipa || '',
          meaning: word.definition || word.meaning,
        }]);
        successCount++;
      } catch (err) {
        // Continue with other words
      }
    }

    alert(`Đã lưu ${successCount}/${allWords.length} từ!`);
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <div className="max-w-6xl mx-auto px-4 py-5">
          <VocabNavbar />
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
                  Tra cứu từ đơn
                </button>
                <button
                  onClick={() => setMode('text')}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                    mode === 'text'
                      ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  Phân tích văn bản
                </button>
              </div>
            </div>

            {/* Input Section */}
            {mode === 'word' ? (
              <div className="relative">
                <span className="absolute left-4 top-4 text-gray-400 material-symbols-outlined">search</span>
                <input
                  className="w-full pl-12 pr-4 py-4 rounded-lg border-none ring-1 ring-gray-200 dark:ring-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Nhập từ và ấn Enter..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleWordSearch}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <textarea
                  className="w-full h-32 p-4 rounded-lg border-none ring-1 ring-gray-200 dark:ring-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary outline-none resize-none"
                  placeholder="Dán văn bản tiếng Anh vào đây để AI phân tích và trích xuất từ vựng..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                />
                <div className="flex justify-center">
                  <button
                    onClick={handleTextAnalysis}
                    disabled={loading}
                    className="bg-primary text-white px-8 py-3 rounded-lg font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Đang phân tích...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">psychology</span>
                        Phân tích với AI
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
                <VocabCard {...result} onSave={handleSaveToDb} />
              )}

              {/* Text Analysis Results */}
              {mode === 'text' && textResults && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold dark:text-white">Từ vựng được trích xuất</h2>
                    <button
                      onClick={handleSaveAllFromText}
                      className="bg-primary text-white px-6 py-3 rounded-lg font-bold hover:opacity-90 transition-all flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined">save</span>
                      Lưu tất cả
                    </button>
                  </div>

                  {['Easy', 'Medium', 'Hard'].map(level => (
                    textResults[level] && textResults[level].length > 0 && (
                      <div key={level} className="space-y-4">
                        <h3 className={`text-lg font-bold px-3 py-1 rounded-full inline-block ${
                          level === 'Easy' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                          level === 'Medium' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {level} ({textResults[level].length} từ)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {textResults[level].map((item: any, index: number) => (
                            <div key={index} className="flex flex-col gap-4 p-6 bg-white dark:bg-gray-800/50 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-start">
                                <h3 className="text-xl font-bold text-[#0d181b] dark:text-white">{item.word}</h3>
                                <button className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                  <span className="material-symbols-outlined text-[#4c869a] dark:text-gray-400 text-lg">volume_up</span>
                                </button>
                              </div>
                              <p className="text-sm font-medium text-[#4c869a] dark:text-gray-400">{item.ipa}</p>
                              <p className="text-base text-[#0d181b] dark:text-gray-300">{item.definition}</p>
                              <button
                                onClick={() => handleSaveToDb(item)}
                                className="flex items-center justify-center gap-2 mt-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-full hover:opacity-90 transition-all"
                              >
                                <span className="material-symbols-outlined text-sm">add</span>
                                Lưu từ
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              )}

              {/* Default examples when no results */}
              {mode === 'word' && !result && !loading && (
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
    </AuthGuard>
  );
}