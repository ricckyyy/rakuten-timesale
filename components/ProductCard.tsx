'use client';

import Image from 'next/image';
import { Product } from '@/lib/types';
import { formatPrice } from '@/lib/rakuten';
import { buildAffiliateClickEvent, buildSelectItemEvent } from '@/lib/analytics';
import { getProductBadges } from '@/lib/product-display';
import CountdownTimer from './CountdownTimer';

interface ProductCardProps {
  product: Product;
  listName?: string;
  position?: number;
}

function truncateTitle(name: string, maxLength = 40): string {
  return name.length > maxLength ? name.slice(0, maxLength) + '…' : name;
}

export default function ProductCard({
  product,
  listName = 'products',
  position = 0,
}: ProductCardProps) {
  const badges = getProductBadges(product);

  const handleClick = () => {
    if (typeof window === 'undefined') return;
    const w = window as Window & {
      gtag?: (...args: unknown[]) => void;
      dataLayer?: Array<Record<string, unknown>>;
    };
    const affiliateEvent = buildAffiliateClickEvent(product, listName, position);
    const selectItemEvent = buildSelectItemEvent(product, listName, position);

    try {
      if (typeof w.gtag === 'function') {
        w.gtag('event', 'select_item', selectItemEvent);
        w.gtag('event', 'affiliate_click', affiliateEvent);
      } else {
        w.dataLayer ??= [];
        w.dataLayer.push({
          event: 'select_item',
          ...selectItemEvent,
        });
        w.dataLayer.push({ event: 'affiliate_click', ...affiliateEvent });
      }
    } catch {
      // fail silently
    }
  };

  return (
    <a
      href={product.affiliateUrl}
      target="_blank"
      rel="sponsored noopener noreferrer"
      onClick={handleClick}
      className="block bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden"
    >
      <div className="relative aspect-square bg-gray-100 dark:bg-gray-700">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-contain p-2"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            No Image
          </div>
        )}
        {/* 割引率バッジ（画像オーバーレイ） */}
        <div className="absolute top-2 left-2">
          {product.discount ? (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow">
              {product.discount}% OFF
            </span>
          ) : (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow">
              SALE
            </span>
          )}
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-2 min-h-[40px]">
          {truncateTitle(product.name)}
        </h3>
        <div className="flex items-baseline justify-between">
          <p className="text-2xl font-bold text-red-600">
            {formatPrice(product.price)}
          </p>
        </div>
        {badges.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {badges.map((badge) => (
              <span
                key={badge}
                className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300"
              >
                {badge}
              </span>
            ))}
          </div>
        )}
        {product.rating && (
          <div className="mt-2 flex items-center text-sm text-gray-600 dark:text-gray-400">
            <span className="text-yellow-500">★</span>
            <span className="ml-1">{product.rating.toFixed(1)}</span>
            {product.reviewCount && (
              <span className="ml-1">({product.reviewCount}件)</span>
            )}
          </div>
        )}
        <CountdownTimer />
        <span className="mt-3 block w-full rounded-md bg-red-600 px-3 py-2 text-center text-sm font-bold text-white">
          楽天市場で詳細を見る
        </span>
      </div>
    </a>
  );
}
