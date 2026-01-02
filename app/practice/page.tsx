// src/app/practice/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import AuthGuard from '@/components/AuthGuard';

/** * LOCAL COMPONENT: EXERCISE CARD
 * Giúp tái sử dụng code cho 3 loại bài tập
 */
const ExerciseCard = ({ href, onClick, icon, title, desc, colorClass, iconBg }: any) => {
  const CardContent = () => (
    <div className={`h-full flex flex-col gap-4 p-6 rounded-3xl bg-white dark:bg-[#1A2C32] border-2 border-slate-100 dark:border-slate-800 hover:border-${colorClass}-500 hover:bg-${colorClass}-50/50 dark:hover:bg-${colorClass}-900/10 hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}>
      <div className="flex justify-between items-start">
        <div className={`p-3 ${iconBg} rounded-2xl`}>
          <span className="material-symbols-outlined text-3xl">{icon}</span>
        </div>
        <div className={`size-10 rounded-full bg-slate-50 dark:bg-slate-800 group-hover:bg-${colorClass}-500 group-hover:text-white text-slate-400 flex items-center justify-center transition-all duration-300`}>
          <span className="material-symbols-outlined text-[24px]">arrow_forward</span>
        </div>
      </div>
      <div>
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xl">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed">{desc}</p>
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left relative group h-full">
        <CardContent />
      </button>
    );
  }

  return (
    <Link href={href} className="w-full text-left relative group h-full">
      <CardContent />
    </Link>
  );
};

export default function PracticeMainPage() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showWordSelector, setShowWordSelector] = useState(false);
  const [vocabularyList, setVocabularyList] = useState<any[]>([]);
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month'>('all');
  const [loading, setLoading] = useState(false);
  const [hasWordsSelected, setHasWordsSelected] = useState(false);
  const [selectedWordsCount, setSelectedWordsCount] = useState(0);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [dailyXP, setDailyXP] = useState(0);
  const [goalReached, setGoalReached] = useState(false);

  // Fetch user profile (used for stats in main content, Navbar has its own fetch)
  const fetchUserProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) return;

      const response = await fetch('/api/user-profile', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setUserProfile(result.data);
      } else {
        // If API fails, set default profile
        setUserProfile({
          id: null,
          user_id: session.user.id,
          xp: 0,
          level: 'Learner',
          total_vocabularies: 0,
          mastered_vocabularies: 0,
          weekly_xp: 0,
          weekly_mastered: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  // Fetch daily XP (using weekly_xp as approximation for now)
  const fetchDailyXP = async () => {
    if (userProfile) {
      setDailyXP(userProfile.weekly_xp || 0);
      setGoalReached(userProfile.weekly_xp >= 200);
    }
  };

  // Check auth and fetch user profile
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        fetchUserProfile();
      }
    };
    checkAuth();
  }, []);

  // Update daily XP when userProfile changes
  useEffect(() => {
    fetchDailyXP();
  }, [userProfile]);

  // Check for selected words on mount
  useEffect(() => {
    const selectedWordsData = localStorage.getItem('selectedPracticeWords');
    if (selectedWordsData) {
      const selectedWords = JSON.parse(selectedWordsData);
      setHasWordsSelected(selectedWords.length > 0);
      setSelectedWordsCount(selectedWords.length);
    }
  }, []);

  // (Removed handleLogout as Navbar component handles it)

  // Load vocabulary with time filter
  const loadVocabulary = async (filter: 'all' | 'today' | 'yesterday' | 'week' | 'month' = 'all') => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('vocabularies')
        .select('*')
        .eq('user_id', user.id);

      // Apply time filter
      const now = new Date();
      if (filter === 'today') {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        query = query.gte('created_at', today.toISOString());
      } else if (filter === 'yesterday') {
        const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        query = query.gte('created_at', yesterday.toISOString()).lt('created_at', today.toISOString());
      } else if (filter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        query = query.gte('created_at', weekAgo.toISOString());
      } else if (filter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        query = query.gte('created_at', monthAgo.toISOString());
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading vocabulary:', error);
        return;
      }

      setVocabularyList(data || []);
    } catch (error) {
      console.error('Error loading vocabulary:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle word selection
  const toggleWordSelection = (wordId: string) => {
    const newSelected = new Set(selectedWords);
    if (newSelected.has(wordId)) {
      newSelected.delete(wordId);
    } else {
      newSelected.add(wordId);
    }
    setSelectedWords(newSelected);
  };

  // Select/deselect all words
  const toggleSelectAll = () => {
    if (selectedWords.size === vocabularyList.length) {
      setSelectedWords(new Set());
    } else {
      setSelectedWords(new Set(vocabularyList.map(word => word.id)));
    }
  };

  // Open word selector modal
  const openWordSelector = async () => {
    setShowWordSelector(true);
    await loadVocabulary(timeFilter);
  };

  // Apply selected words and navigate to quiz
  const applySelectedWords = () => {
    const selectedWordsList = vocabularyList.filter(word => selectedWords.has(word.id));
    // Store selected words in localStorage
    localStorage.setItem('selectedPracticeWords', JSON.stringify(selectedWordsList));
    setHasWordsSelected(selectedWordsList.length > 0);
    setSelectedWordsCount(selectedWordsList.length);
    setShowWordSelector(false);
  };

  // Check if there are selected words
  const hasSelectedWords = () => {
    const selectedWordsData = localStorage.getItem('selectedPracticeWords');
    if (selectedWordsData) {
      const selectedWords = JSON.parse(selectedWordsData);
      return selectedWords.length > 0;
    }
    return false;
  };

  // Navigate to quiz with selected words
  const startQuizWithSelectedWords = (quizType: string) => {
    const selectedWordsData = localStorage.getItem('selectedPracticeWords');
    if (selectedWordsData) {
      const selectedWords = JSON.parse(selectedWordsData);
      if (selectedWords.length > 0) {
        // Navigate to the quiz with selected words
        window.location.href = `/practice/${quizType}`;
      } else {
        // No words selected, navigate normally
        window.location.href = `/practice/${quizType}`;
      }
    } else {
      // No words selected, navigate normally
      window.location.href = `/practice/${quizType}`;
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background-light dark:bg-background-dark font-display">
        {/* Header / Navbar */}
        <Navbar />

        <div className="layout-container flex h-full grow flex-col">
          <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-20 flex flex-1 justify-center py-5">
            <div className="layout-content-container flex flex-col max-w-[800px] flex-1 w-full">

              <main className="flex flex-col gap-8 mb-20">
                <div>
                  <h1 className="text-3xl font-black tracking-tight">Vocabulary Practice</h1>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Select your source material and start a session</p>
                </div>

                {/* ACTIVE LIST BANNER */}
                <div className="relative w-full bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-500/20 overflow-hidden group">
                  <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className="size-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white">
                        <span className="material-symbols-outlined text-3xl">collections_bookmark</span>
                      </div>
                      <div>
                        <div className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                          <span className="size-1.5 rounded-full bg-green-400"></span> Active List
                        </div>
                        <h2 className="text-2xl font-black mb-2 tracking-tight">My Words</h2>
                        <div className="text-sm font-medium text-blue-50">
                          <span className="px-2 py-0.5 rounded bg-white/20 text-white text-xs font-bold mr-2">{selectedWordsCount || 0}</span>
                          {selectedWordsCount > 0 ? 'words selected for practice' : 'words pending review'}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={openWordSelector}
                        className="px-6 py-3 bg-white text-blue-600 hover:bg-blue-50 rounded-xl font-bold transition-all active:scale-95 flex items-center gap-2 ring-4 ring-white/20"
                      >
                        <span className="material-symbols-outlined text-[20px]">library_add</span>
                        {hasWordsSelected ? `Selected ${selectedWordsCount} words - Click to modify` : "Select from 'My Words'"}
                      </button>

                    </div>
                  </div>
                </div>

                {/* PROGRESS BAR */}
                <div className="bg-white dark:bg-[#1A2C32] p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-bold uppercase text-slate-500">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px] text-orange-500">local_fire_department</span> Daily Goal</span>
                    <span className="text-slate-700 dark:text-slate-300">{dailyXP}/200 XP {goalReached ? '🎉 +100 XP bonus!' : ''}</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-500" style={{ width: `${Math.min((dailyXP / 200) * 100, 100)}%` }}></div>
                  </div>
                </div>

                {/* GRID EXERCISES */}
                <div className="flex flex-col gap-1 mt-2">
                  <h3 className="text-slate-800 dark:text-white text-xl font-bold">Choose Exercise Type</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <ExerciseCard
                    onClick={() => startQuizWithSelectedWords('meaning-quiz')}
                    icon="quiz"
                    title="Meaning Quiz"
                    desc="Choose correct definitions"
                    colorClass="blue"
                    iconBg="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  />
                  <ExerciseCard
                    onClick={() => startQuizWithSelectedWords('fill-blank')}
                    icon="edit_note"
                    title="Fill in Blank"
                    desc="Complete the sentence"
                    colorClass="purple"
                    iconBg="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                  />
                  <ExerciseCard
                    onClick={() => startQuizWithSelectedWords('pronunciation')}
                    icon="mic"
                    title="Pronunciation"
                    desc="Speak and get graded"
                    colorClass="teal"
                    iconBg="bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400"
                  />
                  <ExerciseCard
                    onClick={() => startQuizWithSelectedWords('flash-card')}
                    icon="layers"
                    title="Flash Cards"
                    desc="Quick review with cards"
                    colorClass="orange"
                    iconBg="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                  />
                </div>
              </main>
            </div>
          </div>
        </div>

        {/* Exercise Selector Modal */}
        {showExerciseSelector && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white">Chọn loại bài tập</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                    Chọn bài tập bạn muốn làm với {selectedWordsCount} từ đã chọn
                  </p>
                </div>
                <button
                  onClick={() => setShowExerciseSelector(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <ExerciseCard
                    onClick={() => { startQuizWithSelectedWords('meaning-quiz'); setShowExerciseSelector(false); }}
                    icon="quiz"
                    title="Meaning Quiz"
                    desc="Choose correct definitions"
                    colorClass="blue"
                    iconBg="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  />
                  <ExerciseCard
                    onClick={() => { startQuizWithSelectedWords('fill-blank'); setShowExerciseSelector(false); }}
                    icon="edit_note"
                    title="Fill in Blank"
                    desc="Complete the sentence"
                    colorClass="purple"
                    iconBg="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                  />
                  <ExerciseCard
                    onClick={() => { startQuizWithSelectedWords('pronunciation'); setShowExerciseSelector(false); }}
                    icon="mic"
                    title="Pronunciation"
                    desc="Speak and get graded"
                    colorClass="teal"
                    iconBg="bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400"
                  />
                  <ExerciseCard
                    onClick={() => { startQuizWithSelectedWords('flash-card'); setShowExerciseSelector(false); }}
                    icon="layers"
                    title="Flash Cards"
                    desc="Quick review with cards"
                    colorClass="orange"
                    iconBg="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Word Selector Modal */}
        {showWordSelector && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white">Select Words for Practice</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                    Choose specific words from your vocabulary to practice with
                  </p>
                </div>
                <button
                  onClick={() => setShowWordSelector(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Time Filter */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'all', label: 'All Time' },
                    { key: 'today', label: 'Today' },
                    { key: 'yesterday', label: 'Yesterday' },
                    { key: 'week', label: 'Last 7 Days' },
                    { key: 'month', label: 'Last 30 Days' }
                  ].map(filter => (
                    <button
                      key={filter.key}
                      onClick={() => {
                        setTimeFilter(filter.key as any);
                        loadVocabulary(filter.key as any);
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${timeFilter === filter.key
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-slate-500">Loading vocabulary...</span>
                  </div>
                ) : vocabularyList.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">library_books</span>
                    <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-400 mb-2">No words found</h3>
                    <p className="text-slate-500 dark:text-slate-500">
                      {timeFilter === 'all' ? 'You haven\'t added any words yet.' : `No words found for the selected time period.`}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Select All Button */}
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={toggleSelectAll}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">
                          {selectedWords.size === vocabularyList.length ? 'check_box' : selectedWords.size === 0 ? 'check_box_outline_blank' : 'indeterminate_check_box'}
                        </span>
                        {selectedWords.size === vocabularyList.length ? 'Deselect All' : 'Select All'}
                      </button>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {selectedWords.size} of {vocabularyList.length} selected
                        </span>
                        {selectedWords.size > 0 && (
                          <button
                            onClick={() => {
                              const selectedWordsList = vocabularyList.filter(word => selectedWords.has(word.id));
                              localStorage.setItem('selectedPracticeWords', JSON.stringify(selectedWordsList));
                              setHasWordsSelected(selectedWordsList.length > 0);
                              setSelectedWordsCount(selectedWordsList.length);
                              setShowWordSelector(false);
                              setShowExerciseSelector(true);
                            }}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-sm">play_arrow</span>
                            Start Practice
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Word List */}
                    <div className="max-h-96 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                      <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        {vocabularyList.map(word => (
                          <div
                            key={word.id}
                            onClick={() => toggleWordSelection(word.id)}
                            className={`flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${selectedWords.has(word.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                              }`}
                          >
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${selectedWords.has(word.id)
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-slate-300 dark:border-slate-600'
                              }`}>
                              {selectedWords.has(word.id) && (
                                <span className="material-symbols-outlined text-white text-sm">check</span>
                              )}
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <h3 className="font-semibold text-slate-800 dark:text-white">{word.word}</h3>
                                <span className="text-xs text-slate-500 dark:text-slate-400 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
                                  /{word.ipa}/
                                </span>
                              </div>
                              <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{word.meaning}</p>
                            </div>

                            <div className="text-xs text-slate-400 dark:text-slate-500">
                              {new Date(word.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {selectedWords.size > 0 && (
                    <>Selected {selectedWords.size} word{selectedWords.size > 1 ? 's' : ''} for practice</>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowWordSelector(false)}
                    className="px-6 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const selectedWordsList = vocabularyList.filter(word => selectedWords.has(word.id));
                      localStorage.setItem('selectedPracticeWords', JSON.stringify(selectedWordsList));
                      setHasWordsSelected(selectedWordsList.length > 0);
                      setSelectedWordsCount(selectedWordsList.length);
                      startQuizWithSelectedWords('meaning-quiz');
                    }}
                    disabled={selectedWords.size === 0}
                    className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">play_arrow</span>
                    Start Practice ({selectedWords.size})
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
