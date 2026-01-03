import Link from 'next/link';
import { CATEGORY_LIST } from '@/lib/constants';

export default function Header() {
  return (
    <header className="bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold hover:opacity-80 transition">
            🔥 楽天タイムセール速報
          </Link>
          <nav className="hidden md:flex space-x-4">
            <Link href="/" className="hover:underline">
              トップ
            </Link>
            {CATEGORY_LIST.map((category) => (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className="hover:underline"
              >
                {category.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
