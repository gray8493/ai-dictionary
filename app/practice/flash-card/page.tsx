"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import AuthGuard from '@/components/AuthGuard';

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

export default function FlashCardPage() {
    const [vocabularyList, setVocabularyList] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [userProfile, setUserProfile] = useState<any>(null);

    // Fetch user profile
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
            }
        } catch (err) {
            console.error('Error fetching user profile:', err);
        }
    };

    // Load vocabulary
    const loadVocabulary = async () => {
        const selectedWordsData = localStorage.getItem('selectedPracticeWords');
        if (selectedWordsData) {
            try {
                const selectedWords = JSON.parse(selectedWordsData);
                if (selectedWords.length > 0) {
                    setVocabularyList(selectedWords);
                    setLoading(false);
                    return;
                }
            } catch (error) {
                console.error('Error parsing selected words:', error);
            }
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: vocabData } = await supabase
            .from('vocabularies')
            .select('*')
            .eq('user_id', user.id);

        if (vocabData && vocabData.length > 0) {
            setVocabularyList(vocabData);
        }
        setLoading(false);
    };

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (user) {
                fetchUserProfile();
                loadVocabulary();
            }
        };
        checkAuth();
    }, []);

    const handleNext = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % vocabularyList.length);
        }, 150);
    };

    const handleBack = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev - 1 + vocabularyList.length) % vocabularyList.length);
        }, 150);
    };

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    const speak = (text: string) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            window.speechSynthesis.speak(utterance);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (vocabularyList.length === 0) {
        return (
            <AuthGuard>
                <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background-light dark:bg-background-dark text-center">
                    <div className="size-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-4xl text-slate-400">inventory_2</span>
                    </div>
                    <h2 className="text-2xl font-black mb-2">Chưa có từ vựng</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm">
                        Bạn cần chọn từ vựng hoặc lưu từ vựng mới để bắt đầu học Flash-card.
                    </p>
                    <Link href="/practice" className="px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/30 hover:scale-105 transition-all">
                        Quay lại Luyện tập
                    </Link>
                </div>
            </AuthGuard>
        );
    }

    const currentWord = vocabularyList[currentIndex];

    return (
        <AuthGuard>
            <div className="min-h-screen bg-background-light dark:bg-background-dark font-display flex flex-col">
                <Navbar />

                <div className="flex-1 flex flex-col items-center justify-center p-4 py-8 md:p-8">
                    <div className="w-full max-w-[500px] flex flex-col gap-8">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Link href="/practice" className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold text-sm mb-1 uppercase tracking-tight">
                                        <span className="material-symbols-outlined text-sm">arrow_back</span> Quay lại
                                    </Link>
                                    <h1 className="text-3xl font-black text-slate-900 dark:text-white">Flash Cards</h1>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-bold text-slate-400">{currentIndex + 1} / {vocabularyList.length}</span>
                                </div>
                            </div>
                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-primary"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${((currentIndex + 1) / vocabularyList.length) * 100}%` }}
                                />
                            </div>
                        </div>

                        <div className="relative h-[400px] w-full perspective-1000">
                            <motion.div
                                className="w-full h-full relative cursor-pointer preserve-3d"
                                animate={{ rotateY: isFlipped ? 180 : 0 }}
                                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                                onClick={handleFlip}
                            >
                                {/* Front side */}
                                <div className="absolute inset-0 backface-hidden w-full h-full bg-white dark:bg-[#1A2C32] rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center shadow-xl border-2 border-slate-50 dark:border-slate-800 group hover:border-primary/30 transition-colors">
                                    <div className="mb-6 flex flex-col items-center">
                                        <span className="material-symbols-outlined text-blue-500 text-5xl mb-4 group-hover:scale-110 transition-transform">school</span>
                                        <h2 className="text-5xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2">
                                            {currentWord.word}
                                        </h2>
                                        <div className="flex items-center gap-2 mb-2">
                                            <p className="text-xl text-slate-400 font-medium italic">/{currentWord.ipa}/</p>
                                            {currentWord.type && (
                                                <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-400 italic">
                                                    ({typeMapping[currentWord.type.toLowerCase()] || currentWord.type})
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); speak(currentWord.word); }}
                                        className="size-14 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-sm"
                                    >
                                        <span className="material-symbols-outlined text-3xl">volume_up</span>
                                    </button>
                                    <div className="mt-12 text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">touch_app</span> Nhấp để xem nghĩa
                                    </div>
                                </div>

                                {/* Back side */}
                                <div
                                    className="absolute inset-0 backface-hidden w-full h-full bg-gradient-to-br from-primary to-blue-600 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center shadow-xl rotate-y-180"
                                >
                                    <div className="text-white">
                                        <span className="material-symbols-outlined text-white/50 text-5xl mb-4">translate</span>
                                        <h3 className="text-4xl font-black mb-4 px-4">
                                            {currentWord.meaning}
                                        </h3>
                                        <p className="text-white/80 font-medium text-lg leading-relaxed max-w-[80%] mx-auto">
                                            {currentWord.word}
                                        </p>
                                    </div>
                                    <div className="mt-12 text-white/50 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">touch_app</span> Nhấp để quay lại
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <button
                                onClick={handleBack}
                                className="flex-1 py-4 bg-white dark:bg-slate-800 rounded-2xl font-bold text-slate-600 dark:text-slate-300 shadow-sm border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined">arrow_back</span> Trước
                            </button>
                            <button
                                onClick={handleNext}
                                className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/30 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                Tiếp tục <span className="material-symbols-outlined">arrow_forward</span>
                            </button>
                        </div>

                        <div className="text-center">
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Lật thẻ để xem nghĩa và cách phát âm của từ</p>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
        </AuthGuard>
    );
}
