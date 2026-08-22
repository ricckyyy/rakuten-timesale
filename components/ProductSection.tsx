import { fetchOptionalRakutenProducts } from '@/lib/rakuten';
import ProductCard from './ProductCard';

interface ProductSectionProps {
  keyword: string;
  hits?: number;
}

export default async function ProductSection({ keyword, hits = 4 }: ProductSectionProps) {
  const products = await fetchOptionalRakutenProducts(undefined, keyword, hits);

  if (products.length === 0) return null;

  return (
    <div className="not-prose my-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">
        📦 楽天市場の「{keyword}」セール商品
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
