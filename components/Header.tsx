'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CATEGORY_LIST } from '@/lib/constants';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold hover:opacity-80 transition">
            🔥 楽天タイムセール速報
          </Link>

          {/* デスクトップナビ */}
          <nav className="hidden md:flex space-x-4">
            <Link href="/" className="hover:underline">トップ</Link>
            {CATEGORY_LIST.map((category) => (
              <Link key={category.slug} href={`/category/${category.slug}`} className="hover:underline">
                {category.name}
              </Link>
            ))}
            <Link href="/blog" className="hover:underline">ブログ</Link>
          </nav>

          {/* ハンバーガーボタン（モバイルのみ） */}
          <button
            className="md:hidden p-2 rounded hover:bg-white/20 transition"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'メニューを閉じる' : 'メニューを開く'}
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* モバイルメニュー */}
        {menuOpen && (
          <nav className="md:hidden mt-3 pb-2 border-t border-white/30 pt-3 flex flex-col space-y-2">
            <Link href="/" className="hover:underline" onClick={() => setMenuOpen(false)}>
              トップ
            </Link>
            {CATEGORY_LIST.map((category) => (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className="hover:underline"
                onClick={() => setMenuOpen(false)}
              >
                {category.name}
              </Link>
            ))}
            <Link href="/blog" className="hover:underline" onClick={() => setMenuOpen(false)}>
              ブログ
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
