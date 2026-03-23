'use client';

import { useState } from 'react';
import { Product } from '@/lib/types';
import ProductCard from './ProductCard';

type SortKey = 'default' | 'price_asc' | 'price_desc' | 'review' | 'discount';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'default', label: 'おすすめ順' },
  { key: 'price_asc', label: '価格が安い順' },
  { key: 'price_desc', label: '価格が高い順' },
  { key: 'review', label: 'レビュー数順' },
  { key: 'discount', label: '割引率順' },
];

function sortProducts(products: Product[], key: SortKey): Product[] {
  const sorted = [...products];
  switch (key) {
    case 'price_asc':  return sorted.sort((a, b) => a.price - b.price);
    case 'price_desc': return sorted.sort((a, b) => b.price - a.price);
    case 'review':     return sorted.sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
    case 'discount':   return sorted.sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0));
    default:           return sorted;
  }
}

export default function SortableProductGrid({ products }: { products: Product[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('default');
  const sorted = sortProducts(products, sortKey);

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">現在セール商品がありません。</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {SORT_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSortKey(key)}
            className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
              sortKey === key
                ? 'bg-red-500 text-white border-red-500'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-red-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {sorted.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
