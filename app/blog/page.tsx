import Link from 'next/link';
import { getAllPosts } from '@/lib/blog';
import { SITE_INFO } from '@/lib/constants';
import type { Metadata } from 'next';

const blogUrl = `${SITE_INFO.url}/blog`;

export const metadata: Metadata = {
  title: 'ブログ・お買い物ガイド',
  description: '楽天市場でお得に買い物するためのガイド記事。食品保存・家電・美容など各カテゴリのおすすめ商品をレビューします。',
  alternates: { canonical: blogUrl },
  openGraph: {
    type: 'website',
    url: blogUrl,
    title: 'ブログ・お買い物ガイド',
    description: '楽天市場でお得に買い物するためのガイド記事。食品保存・家電・美容など各カテゴリのおすすめ商品をレビューします。',
    siteName: SITE_INFO.title,
    locale: 'ja_JP',
    images: [{ url: `${SITE_INFO.url}${SITE_INFO.ogImage}` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ブログ・お買い物ガイド',
    description: '楽天市場でお得に買い物するためのガイド記事。',
    images: [`${SITE_INFO.url}${SITE_INFO.ogImage}`],
  },
};

export default function BlogPage() {
  const posts = getAllPosts();

  const blogJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `${SITE_INFO.title} ブログ`,
    url: blogUrl,
    description: 'お買い物ガイド・セール攻略記事',
    publisher: {
      '@type': 'Organization',
      name: SITE_INFO.title,
      url: SITE_INFO.url,
    },
    blogPost: posts.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description,
      url: `${SITE_INFO.url}/blog/${post.slug}`,
      datePublished: post.date,
      dateModified: post.updated ?? post.date,
      keywords: post.tags.join(', '),
    })),
  };

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: posts.map((post, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `${SITE_INFO.url}/blog/${post.slug}`,
      name: post.title,
    })),
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 md:p-8 mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          ブログ・お買い物ガイド
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          楽天市場でお得に買い物するためのガイド記事をまとめています。
        </p>
      </section>

      <section className="grid gap-6">
        {posts.map((post) => (
          <article key={post.slug} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <Link href={`/blog/${post.slug}`}>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 hover:text-red-600 dark:hover:text-red-400 mb-2">
                {post.title}
              </h2>
            </Link>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{post.description}</p>
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <time dateTime={post.date}>{new Date(post.date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
              <div className="flex gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
