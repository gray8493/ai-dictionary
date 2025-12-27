// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "YourBrand - Học Tiếng Anh Thông Minh",
  description: "Khám phá phương pháp học tập hiệu quả với AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="light">
      <head>
        {/* Import Material Symbols từ CDN (hoặc có thể dùng thư viện react-icons thay thế) */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" />
      </head>
      <body className="font-sans bg-background-light dark:bg-background-dark text-slate-900 dark:text-white antialiased">
        {children}
      </body>
    </html>
  );
}