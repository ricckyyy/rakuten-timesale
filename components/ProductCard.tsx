import Image from 'next/image';
import { Product } from '@/lib/types';
import { formatPrice } from '@/lib/rakuten';
import CountdownTimer from './CountdownTimer';

interface ProductCardProps {
  product: Product;
}

function truncateTitle(name: string, maxLength = 40): string {
  return name.length > maxLength ? name.slice(0, maxLength) + '…' : name;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <a
      href={product.affiliateUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden"
    >
      <div className="relative aspect-square bg-gray-100">
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
        <h3 className="text-sm font-medium text-gray-800 mb-2 min-h-[40px]">
          {truncateTitle(product.name)}
        </h3>
        <div className="flex items-baseline justify-between">
          <p className="text-2xl font-bold text-red-600">
            {formatPrice(product.price)}
          </p>
        </div>
        {product.rating && (
          <div className="mt-2 flex items-center text-sm text-gray-600">
            <span className="text-yellow-500">★</span>
            <span className="ml-1">{product.rating.toFixed(1)}</span>
            {product.reviewCount && (
              <span className="ml-1">({product.reviewCount}件)</span>
            )}
          </div>
        )}
        <CountdownTimer />
      </div>
    </a>
  );
}
