import { notFound } from 'next/navigation';
import { fetchRakutenProducts } from '@/lib/rakuten';
import SortableProductGrid from '@/components/SortableProductGrid';
import { CATEGORIES } from '@/lib/constants';
import type { Metadata } from 'next';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

// ISR設定: 24時間ごとに再生成
export const revalidate = 86400;

// メタデータ生成
export async function generateMetadata(
  { params }: CategoryPageProps
): Promise<Metadata> {
  const { slug } = await params;
  const category = CATEGORIES[slug];

  if (!category) {
    return {
      title: 'カテゴリが見つかりません',
    };
  }

  return {
    title: `${category.name}のセール情報`,
    description: category.description || `${category.name}のタイムセール情報をお届けします`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = CATEGORIES[slug];

  if (!category) {
    notFound();
  }

  // カテゴリIDで商品を取得
  const products = await fetchRakutenProducts(category.genreId);

  const today = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div>
      {/* カテゴリヘッダー */}
      <section className="bg-white rounded-lg shadow-md p-6 md:p-8 mb-8">
        <div className="flex items-center mb-3">
          <div className="text-4xl mr-3">
            {slug === 'electronics' && '⚡'}
            {slug === 'food' && '🍔'}
            {slug === 'fashion' && '👕'}
            {slug === 'beauty' && '💄'}
            {slug === 'books' && '📚'}
          {slug === 'sports' && '🏃'}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
            {category.name}のセール
          </h1>
        </div>
        <p className="text-gray-600 mb-1">
          {today} 更新
        </p>
        <p className="text-gray-600">
          {category.description || `${category.name}の最新セール情報`}
        </p>
      </section>

      {/* 商品一覧 */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          セール商品一覧
        </h2>
        <SortableProductGrid products={products} />
      </section>

      {/* カテゴリ説明 */}
      <section className="mt-12 bg-white rounded-lg shadow-md p-6 md:p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {category.name}カテゴリについて
        </h2>
        <div className="prose max-w-none text-gray-700">
          <p>
            {category.name}カテゴリでは、楽天市場で開催されている{category.name}関連のタイムセール商品を掲載しています。
            毎日更新される最新のセール情報をチェックして、お得な商品を見逃さないようにしましょう。
          </p>
        </div>
      </section>
    </div>
  );
}
