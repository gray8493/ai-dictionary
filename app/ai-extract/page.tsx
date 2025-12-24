// src/app/ai-extract/page.tsx
"use client";

import React, { useState } from 'react';
import Link from 'next/link';

/**
 * 1. LOCAL COMPONENT: AI_EXTRACT_NAVBAR
 */
const AINavbar = () => (
  <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-[#e7f0f3] dark:border-gray-700/50 px-4 sm:px-6 lg:px-10 py-3">
    <div className="flex items-center gap-4 text-[#0d181b] dark:text-white">
      <div className="size-6 text-primary">
        <svg fill="currentColor" viewBox="0 0 48 48">
          <path d="M13.8261 17.4264C16.7203 18.1174 20.2244 18.5217 24 18.5217C27.7756 18.5217 31.2797 18.1174 34.1739 17.4264C36.9144 16.7722 39.9967 15.2331 41.3563 14.1648L24.8486 40.6391C24.4571 41.267 23.5429 41.267 23.1514 40.6391L6.64374 14.1648C8.00331 15.2331 11.0856 16.7722 13.8261 17.4264Z"></path>
          <path clipRule="evenodd" d="M39.998 12.236C39.9944 12.2537 39.9875 12.2845 39.9748 12.3294C39.9436 12.4399 39.8949 12.5741 39.8346 12.7175C39.8168 12.7597 39.7989 12.8007 39.7813 12.8398C38.5103 13.7113 35.9788 14.9393 33.7095 15.4811C30.9875 16.131 27.6413 16.5217 24 16.5217C20.3587 16.5217 17.0125 16.131 14.2905 15.4811C12.0012 14.9346 9.44505 13.6897 8.18538 12.8168C8.17384 12.7925 8.16216 12.767 8.15052 12.7408C8.09919 12.6249 8.05721 12.5114 8.02977 12.411C8.00356 12.3152 8.00039 12.2667 8.00004 12.2612C8.00004 12.261 8 12.2607 8.00004 12.2612C8.00004 12.2359 8.0104 11.9233 8.68485 11.3686C9.34546 10.8254 10.4222 10.2469 11.9291 9.72276C14.9242 8.68098 19.1919 8 24 8C28.8081 8 33.0758 8.68098 36.0709 9.72276C37.5778 10.2469 38.6545 10.8254 39.3151 11.3686C39.9006 11.8501 39.9857 12.1489 39.998 12.236ZM4.95178 15.2312L21.4543 41.6973C22.6288 43.5809 25.3712 43.5809 26.5457 41.6973L43.0534 15.223C43.0709 15.1948 43.0878 15.1662 43.104 15.1371L41.3563 14.1648L43.104 15.1371L43.1051 15.135L43.1065 15.1325L43.1101 15.1261L43.1199 15.1082C43.1276 15.094 43.1377 15.0754 43.1497 15.0527C43.1738 15.0075 43.2062 14.9455 43.244 14.8701C43.319 14.7208 43.4196 14.511 43.5217 14.2683C43.6901 13.8679 44 13.0689 44 12.2609C44 10.5573 43.003 9.22254 41.8558 8.2791C40.6947 7.32427 39.1354 6.55361 37.385 5.94477C33.8654 4.72057 29.133 4 24 4C18.867 4 14.1346 4.72057 10.615 5.94478C8.86463 6.55361 7.30529 7.32428 6.14419 8.27911C4.99695 9.22255 3.99999 10.5573 3.99999 12.2609C3.99999 13.1275 4.29264 13.9078 4.49321 14.3607C4.60375 14.6102 4.71348 14.8196 4.79687 14.9689C4.83898 15.0444 4.87547 15.1065 4.9035 15.1529C4.91754 15.1762 4.92954 15.1957 4.93916 15.2111L4.94662 15.223L4.95178 15.2312ZM35.9868 18.996L24 38.22L12.0131 18.996C12.4661 19.1391 12.9179 19.2658 13.3617 19.3718C16.4281 20.1039 20.0901 20.5217 24 20.5217C27.9099 20.5217 31.5719 20.1039 34.6383 19.3718C35.082 19.2658 35.5339 19.1391 35.9868 18.996Z" fillRule="evenodd"></path>
        </svg>
      </div>
      <h2 className="text-lg font-bold">VocabAI</h2>
    </div>
    
    <div className="hidden md:flex flex-1 justify-end items-center gap-8">
      <nav className="flex items-center gap-9">
        <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">Home</Link>
        <Link href="/vocabulary" className="text-sm font-medium hover:text-primary transition-colors">Vocabulary</Link>
        <Link href="/ai-extract" className="text-primary text-sm font-bold">AI Extract</Link>
        <Link href="/practice" className="text-sm font-medium hover:text-primary transition-colors">Practice</Link>
      </nav>
      <button className="bg-primary text-white px-4 py-2 rounded-full text-sm font-bold hover:opacity-90 transition-opacity">
        Upgrade
      </button>
      <div className="bg-slate-300 rounded-full size-10 bg-cover bg-center" style={{ backgroundImage: 'url("https://ui-avatars.com/api/?name=User")' }}></div>
    </div>
  </header>
);

/**
 * 2. LOCAL COMPONENT: VOCAB_ITEM_CARD
 */
interface VocabItemProps {
  word: string;
  ipa: string;
  definition: string;
}

const VocabItemCard = ({ word, ipa, definition }: VocabItemProps) => (
  <div className="flex flex-col gap-4 p-6 bg-white dark:bg-gray-800/50 rounded-lg shadow-sm hover:shadow-md transition-all">
    <div className="flex justify-between items-start">
      <h3 className="text-xl font-bold text-[#0d181b] dark:text-white">{word}</h3>
      <button className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
        <span className="material-symbols-outlined text-[#4c869a] dark:text-gray-400 text-lg">volume_up</span>
      </button>
    </div>
    <p className="text-sm font-medium text-[#4c869a] dark:text-gray-400">{ipa}</p>
    <p className="text-base text-[#0d181b] dark:text-gray-300">{definition}</p>
  </div>
);

/**
 * MAIN PAGE: AI VOCABULARY EXTRACTOR
 */
export default function AIExtractPage() {
  const extractedList = [
    { word: "Minimalist", ipa: "/ˈmɪnɪməlɪst/", definition: "Relating to or characteristic of minimalism in art or design." },
    { word: "Component", ipa: "/kəmˈpoʊnənt/", definition: "A part or element of a larger whole, especially a part of a machine or vehicle." },
    { word: "Extract", ipa: "/ɪkˈstrækt/", definition: "Remove or take out, especially by effort or force." },
    { word: "Vocabulary", ipa: "/voʊˈkæbjəˌlɛri/", definition: "The body of words used in a particular language." },
    { word: "Interface", ipa: "/ˈɪntərˌfeɪs/", definition: "A point where two systems, subjects, organizations, etc. meet and interact." },
    { word: "Design", ipa: "/dɪˈzaɪn/", definition: "A plan or drawing produced to show the workings of an object before it is made." },
  ];

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark">
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-4 sm:px-8 md:px-20 lg:px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col w-full max-w-[960px] flex-1">
            
            <AINavbar />

            <main className="flex flex-col gap-10 py-10">
              {/* Header Section */}
              <div className="flex flex-col gap-3 text-center items-center p-4">
                <h1 className="text-[#0d181b] dark:text-white text-4xl font-black tracking-tight">AI Vocabulary Extractor</h1>
                <p className="text-[#4c869a] dark:text-gray-400 text-base max-w-lg">
                  Upload your PDF or Word document to automatically get a vocabulary list.
                </p>
              </div>

              {/* Upload Section */}
              <div className="px-4">
                <div className="flex flex-col items-center gap-6 rounded-lg border-2 border-dashed border-[#cfe1e7] dark:border-gray-700 px-6 py-14 bg-white/50 dark:bg-background-dark/50 hover:bg-white transition-colors cursor-pointer">
                  <div className="flex max-w-[480px] flex-col items-center gap-2">
                    <p className="text-[#0d181b] dark:text-white text-lg font-bold text-center">
                      Drag and drop your file here, or click to select a file
                    </p>
                    <p className="text-[#4c869a] dark:text-gray-400 text-sm text-center">
                      Supported formats: .pdf, .doc, .docx
                    </p>
                  </div>
                  <button className="bg-[#e7f0f3] dark:bg-gray-700 text-[#0d181b] dark:text-white px-6 py-2 rounded-full font-bold text-sm">
                    Choose File
                  </button>
                </div>
              </div>

              {/* Results Section */}
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center px-4">
                  <h2 className="text-[#0d181b] dark:text-white text-[22px] font-bold">Extracted Vocabulary List</h2>
                  <button className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
                    <span className="material-symbols-outlined text-lg">save</span>
                    <span>Save All</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
                  {extractedList.map((item, index) => (
                    <VocabItemCard 
                      key={index}
                      word={item.word}
                      ipa={item.ipa}
                      definition={item.definition}
                    />
                  ))}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}