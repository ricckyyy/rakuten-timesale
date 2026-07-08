import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fetchRakutenProducts } from '@/lib/rakuten';
import SortableProductGrid from '@/components/SortableProductGrid';
import { getAllPosts } from '@/lib/blog';
import { CATEGORIES, CATEGORY_FAQ, SITE_INFO } from '@/lib/constants';
import type { Metadata } from 'next';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

// ISR設定: 1時間ごとに再生成
export const revalidate = 3600;

export function generateStaticParams() {
  return Object.keys(CATEGORIES).map((slug) => ({ slug }));
}

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

  const today = new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' });
  const displayName = category.seoName ?? category.name;
  const ogTitle = `【${today}更新】楽天 ${displayName} タイムセール・特価品`;

  // 実際の検索クエリ（Search Console計測値）に近い語順のtitleでCTRを狙う
  const titleBySlug: Record<string, string> = {
    beauty: `セール ビューティー特集｜楽天 ビューティー・コスメ タイムセール【${today}更新】`,
    electronics: `家電 セール特集｜楽天 家電 タイムセール【${today}更新】最安値情報`,
    food: `食品 セール特集｜楽天 グルメ・食品 タイムセール【${today}更新】お得情報`,
    fashion: `ファッション セール特集｜楽天 アパレル タイムセール【${today}更新】最新情報`,
    books: `本 セール特集｜楽天ブックス タイムセール【${today}更新】お得情報`,
    sports: `スポーツ用品 セール特集｜楽天 スポーツ・アウトドア タイムセール【${today}更新】`,
  };
  const titleStr = titleBySlug[slug] ?? `楽天 ${displayName} タイムセール【${today}更新】最安値・セール情報`;

  return {
    title: titleStr,
    description: category.description,
    keywords: category.keywords,
    alternates: {
      canonical: `${SITE_INFO.url}/category/${slug}`,
    },
    openGraph: {
      title: ogTitle,
      description: category.description,
      url: `${SITE_INFO.url}/category/${slug}`,
    },
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

  // このカテゴリに関連するブログ記事を取得
  const relatedPosts = getAllPosts().filter((p) => p.category === slug);

  const today = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const displayName = category.seoName ?? category.name;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${displayName}のタイムセール・特価品`,
    description: category.description,
    url: `${SITE_INFO.url}/category/${slug}`,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'ホーム', item: SITE_INFO.url },
        { '@type': 'ListItem', position: 2, name: category.name, item: `${SITE_INFO.url}/category/${slug}` },
      ],
    },
    ...(products.length > 0 && {
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: products.length,
        itemListElement: products.slice(0, 10).map((product, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: product.name,
          url: product.affiliateUrl,
        })),
      },
    }),
  };

  const faqJsonLd = CATEGORY_FAQ[slug]
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: CATEGORY_FAQ[slug].map(({ q, a }) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      }
    : null;

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      {/* カテゴリヘッダー */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 md:p-8 mb-8">
        <div className="flex items-center mb-3">
          <div className="text-4xl mr-3">
            {slug === 'electronics' && '⚡'}
            {slug === 'food' && '🍔'}
            {slug === 'fashion' && '👕'}
            {slug === 'beauty' && '💄'}
            {slug === 'books' && '📚'}
            {slug === 'sports' && '🏃'}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100">
            楽天 {displayName} タイムセール
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-1">
          {today} 更新
        </p>
        <p className="text-gray-600 dark:text-gray-400">
          {category.description || `${category.name}の最新セール情報`}
        </p>
      </section>

      {/* 商品一覧 */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          セール商品一覧
        </h2>
        <SortableProductGrid products={products} />
      </section>

      {/* カテゴリ説明 */}
      <section className="mt-12 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 md:p-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          楽天 {displayName} セールとは
        </h2>
        <div className="prose max-w-none text-gray-700 dark:text-gray-300 space-y-3">
          <p>{category.description}</p>
          {slug === 'beauty' && (
            <p>
              楽天市場の「セール ビューティー」「美容 セール」「コスメ セール」関連のセール商品をまとめて掲載しています。
              スキンケア・化粧品・美容液・ヘアケア・ボディケア・日焼け止め・メイクアップ・香水まで、ビューティーカテゴリの人気アイテムが
              タイムセール価格で見つかります。化粧品 セール 情報を毎日チェックしたい方や、楽天 ビューティー セールでお気に入りのコスメをお得に買いたい方に最適です。
            </p>
          )}
          <p>
            楽天市場の{category.name}セールは毎日開催されており、タイムセール・スーパーSALE・お買い物マラソンなどのイベントと組み合わせることで、さらにお得にお買い物できます。
            楽天ポイントが貯まる・使えるため、ポイント還元率が高いSPU達成時にまとめ買いするのがおすすめです。
          </p>
        </div>
      </section>

      {/* カテゴリ別FAQ */}
      {CATEGORY_FAQ[slug] && (
        <section className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 md:p-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
            {displayName}セールよくある質問
          </h2>
          <div className="space-y-5">
            {CATEGORY_FAQ[slug].map(({ q, a }) => (
              <div key={q} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                <p className="font-bold text-gray-800 dark:text-gray-100 mb-2">Q. {q}</p>
                <p className="text-gray-600 dark:text-gray-400">A. {a}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 関連ブログ記事 */}
      {relatedPosts.length > 0 && (
        <section className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            📝 {category.name}の買い物ガイド
          </h2>
          <div className="grid gap-4">
            {relatedPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="block border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-red-400 dark:hover:border-red-500 hover:shadow-md transition-all"
              >
                <p className="font-semibold text-gray-800 dark:text-gray-100 hover:text-red-600 dark:hover:text-red-400 mb-1">
                  {post.title}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{post.description}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
