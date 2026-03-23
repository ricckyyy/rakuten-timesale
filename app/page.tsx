import { fetchRakutenProducts } from '@/lib/rakuten';
import SortableProductGrid from '@/components/SortableProductGrid';
import { CATEGORY_LIST } from '@/lib/constants';
import Link from 'next/link';

// ISR設定: 24時間ごとに再生成
export const revalidate = 86400;

export default async function Home() {
  // 複数カテゴリから商品を取得（ミックス表示）
  const products = await fetchRakutenProducts(undefined, 'セール', 30);

  const today = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div>
      {/* ヒーローセクション */}
      <section className="bg-white rounded-lg shadow-md p-6 md:p-8 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
          🔥 今日のタイムセール
        </h1>
        <p className="text-gray-600 mb-1">
          {today} 更新
        </p>
        <p className="text-gray-600">
          楽天市場の最新セール情報をお届けします！お得な商品を見逃さないでチェック！
        </p>
      </section>

      {/* カテゴリナビゲーション */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">カテゴリから探す</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {CATEGORY_LIST.map((category) => (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 text-center"
            >
              <div className="text-2xl mb-2">
                {category.slug === 'electronics' && '⚡'}
                {category.slug === 'food' && '🍔'}
                {category.slug === 'fashion' && '👕'}
                {category.slug === 'beauty' && '💄'}
                {category.slug === 'books' && '📚'}
                {category.slug === 'sports' && '🏃'}
              </div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100">{category.name}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* 商品一覧 */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          おすすめセール商品
        </h2>
        <SortableProductGrid products={products} />
      </section>

      {/* SEO用テキスト */}
      <section className="mt-12 bg-white rounded-lg shadow-md p-6 md:p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          楽天タイムセール速報について
        </h2>
        <div className="prose max-w-none text-gray-700">
          <p className="mb-3">
            楽天タイムセール速報は、楽天市場で開催されている最新のタイムセール情報を毎日更新してお届けするサイトです。
            家電、食品、ファッション、美容、本・CD・DVDなど、さまざまなカテゴリのお得な商品を見つけることができます。
          </p>
          <p className="mb-3">
            セール情報は毎日朝6時に自動更新されるため、常に最新のお得情報をチェックできます。
            気になる商品を見つけたら、すぐに楽天市場で購入できます。
          </p>
          <p>
            賢くお買い物して、楽天ポイントも貯めましょう！
          </p>
        </div>
      </section>
    </div>
  );
}
