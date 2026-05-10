import { fetchRakutenProducts } from '@/lib/rakuten';
import SortableProductGrid from '@/components/SortableProductGrid';
import { CATEGORY_LIST, SITE_INFO } from '@/lib/constants';
import { getAllPosts } from '@/lib/blog';
import Link from 'next/link';

// ISR設定: 1時間ごとに再生成
export const revalidate = 3600;

export default async function Home() {
  // 複数カテゴリから商品を取得（ミックス表示）
  const products = await fetchRakutenProducts(undefined, 'セール', 30);
  const recentPosts = getAllPosts().slice(0, 3);

  const today = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_INFO.title,
    description: SITE_INFO.description,
    url: SITE_INFO.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_INFO.url}/category/{search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '楽天タイムセールはいつ更新されますか？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '楽天タイムセール速報は毎日朝6時に最新情報へ自動更新されます。楽天市場のタイムセールは開催時間に合わせて随時掲載されます。',
        },
      },
      {
        '@type': 'Question',
        name: '楽天ポイントはタイムセールでも貯まりますか？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'はい、楽天市場のタイムセール対象商品を購入した場合も通常通り楽天ポイントが貯まります。楽天お買い物マラソンや楽天スーパーセールと組み合わせるとポイント還元率がさらに上がります。',
        },
      },
      {
        '@type': 'Question',
        name: 'どのカテゴリのセール情報が見られますか？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '家電、食品・グルメ、ファッション、美容・コスメ、本・CD・DVD、スポーツ・アウトドアの6カテゴリのセール情報を掲載しています。各カテゴリページで絞り込んで確認できます。',
        },
      },
      {
        '@type': 'Question',
        name: '楽天タイムセールで安く買うコツはありますか？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '楽天お買い物マラソンや楽天スーパーセールと組み合わせると、タイムセール価格からさらにポイント還元を受けられます。楽天カードで支払うと追加ポイントが付与されるためおすすめです。',
        },
      },
    ],
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {/* ヒーローセクション */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 md:p-8 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-3">
          🔥 楽天タイムセール 最新情報
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-1">
          {today} 更新
        </p>
        <p className="text-gray-600 dark:text-gray-400">
          楽天市場のタイムセール・特価品情報を毎日更新！美容・食品・家電など全カテゴリのお得商品をまとめてチェック。
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

      {/* ブログ・お買い物ガイド */}
      {recentPosts.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">お買い物ガイド</h2>
            <Link href="/blog" className="text-sm text-red-600 dark:text-red-400 hover:underline">
              すべて見る →
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {recentPosts.map((post) => (
              <article key={post.slug} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow flex flex-col">
                <Link href={`/blog/${post.slug}`}>
                  <h3 className="font-bold text-gray-800 dark:text-gray-100 hover:text-red-600 dark:hover:text-red-400 mb-2 line-clamp-2">
                    {post.title}
                  </h3>
                </Link>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{post.description}</p>
                <div className="mt-auto flex items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <time dateTime={post.date}>
                    {new Date(post.date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </time>
                  {post.tags[0] && (
                    <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-0.5 rounded">
                      {post.tags[0]}
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* SEO用テキスト */}
      <section className="mt-12 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 md:p-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          楽天タイムセール速報について
        </h2>
        <div className="prose max-w-none text-gray-700 dark:text-gray-300">
          <p className="mb-3">
            楽天タイムセール速報は、楽天市場で開催されている最新のタイムセール・期間限定セール情報を毎日更新してお届けするサイトです。
            家電・生活家電、食品・グルメ、ファッション、美容・コスメ、本・CD・DVD、スポーツ・アウトドアなど、
            全ジャンルのお得な商品を一覧表示しています。
          </p>
          <p className="mb-3">
            楽天市場のタイムセールは時間限定で終了するため見逃しがちです。本サイトでは毎日朝6時に情報を自動更新し、
            楽天お買い物マラソンや楽天スーパーセール期間中の目玉商品もいち早くご紹介します。
          </p>
          <p className="mb-3">
            楽天ポイントを賢く貯めながらお得に買い物しましょう。楽天カードとの併用でポイント還元率がさらにアップします。
            SPUを活用すれば最大16倍のポイント還元も可能です。
          </p>
          <p>
            気になる商品を見つけたら、すぐに楽天市場で購入できます。セール終了前にお早めにチェックしてください！
          </p>
        </div>
      </section>

      {/* FAQ セクション */}
      <section className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 md:p-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
          よくある質問
        </h2>
        <div className="space-y-5">
          {[
            { q: '楽天タイムセールはいつ更新されますか？', a: '毎日朝6時に最新情報へ自動更新されます。楽天市場のタイムセールは随時開催されるため、こまめなチェックがおすすめです。' },
            { q: '楽天ポイントはタイムセールでも貯まりますか？', a: 'はい、タイムセール商品でも通常通り楽天ポイントが貯まります。楽天お買い物マラソンや楽天スーパーセールと組み合わせるとポイント還元率がさらにアップします。' },
            { q: '楽天タイムセールで安く買うコツは？', a: '楽天カードで支払うと追加ポイントが付与されます。また楽天お買い物マラソン期間中はショップ買い回りでポイントが最大10倍になるためタイムセールとの併用がおすすめです。' },
          ].map(({ q, a }) => (
            <div key={q} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
              <p className="font-bold text-gray-800 dark:text-gray-100 mb-2">Q. {q}</p>
              <p className="text-gray-600 dark:text-gray-400">A. {a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
