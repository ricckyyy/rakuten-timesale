import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAllPosts, getPostBySlug, getRelatedPosts } from '@/lib/blog';
import { fetchOptionalRakutenProducts } from '@/lib/rakuten';
import { CATEGORIES, SITE_INFO } from '@/lib/constants';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import ProductCard from '@/components/ProductCard';
import ProductSection from '@/components/ProductSection';
import type { Metadata } from 'next';

// 記事本文は毎回サーバー描画し、任意の商品データだけをAPIクライアント側でキャッシュする。
export const revalidate = 0;

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

function getPostImageUrl(image?: string): string {
  if (!image) return `${SITE_INFO.url}${SITE_INFO.ogImage}`;
  if (/^https?:\/\//.test(image)) return image;
  return `${SITE_INFO.url}${image.startsWith('/') ? image : `/${image}`}`;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: '記事が見つかりません' };

  const url = `${SITE_INFO.url}/blog/${slug}`;
  const imageUrl = getPostImageUrl(post.image);
  const modified = post.updated ?? post.date;

  return {
    title: post.title,
    description: post.description,
    keywords: post.tags,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title: post.title,
      description: post.description,
      siteName: SITE_INFO.title,
      locale: 'ja_JP',
      publishedTime: post.date,
      modifiedTime: modified,
      tags: post.tags,
      images: [{ url: imageUrl }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [imageUrl],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  // 記事のtagsをキーワードにして関連商品を取得
  const keyword = post.tags[0] ?? post.title;
  const relatedProducts = await fetchOptionalRakutenProducts(undefined, keyword, 4);
  const relatedPosts = getRelatedPosts(post, 3);

  const url = `${SITE_INFO.url}/blog/${slug}`;
  const imageUrl = getPostImageUrl(post.image);
  const modified = post.updated ?? post.date;
  const categoryLabel = CATEGORIES[post.category]?.name ?? post.category;

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    image: [imageUrl],
    datePublished: post.date,
    dateModified: modified,
    author: { '@type': 'Organization', name: SITE_INFO.title, url: SITE_INFO.url },
    publisher: {
      '@type': 'Organization',
      name: SITE_INFO.title,
      url: SITE_INFO.url,
      logo: { '@type': 'ImageObject', url: `${SITE_INFO.url}${SITE_INFO.ogImage}` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    keywords: post.tags.join(', '),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ホーム', item: SITE_INFO.url },
      { '@type': 'ListItem', position: 2, name: 'ブログ', item: `${SITE_INFO.url}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: url },
    ],
  };

  return (
    <div className="max-w-3xl mx-auto">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {/* パンくず */}
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link href="/" className="hover:underline">ホーム</Link>
        <span className="mx-2">/</span>
        <Link href="/blog" className="hover:underline">ブログ</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700 dark:text-gray-300">{post.title}</span>
      </nav>

      <article className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 md:p-10">
        <header className="mb-8">
          <div className="flex gap-2 mb-3">
            {post.tags.map((tag) => (
              <span key={tag} className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs px-2 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-3">
            {post.title}
          </h1>
          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            <time dateTime={post.date}>
              {new Date(post.date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
            </time>
            {post.updated && post.updated !== post.date && (
              <span>
                （更新: <time dateTime={post.updated}>
                  {new Date(post.updated).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
                </time>）
              </span>
            )}
          </div>
        </header>

        <div className="blog-content">
          <MDXRemote source={post.content} components={{ ProductSection }} options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }} />
        </div>
      </article>

      {/* 関連商品 */}
      {relatedProducts.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            📦 この記事に関連するセール商品
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {CATEGORIES[post.category] && (
            <div className="mt-4 text-center">
              <Link
                href={`/category/${post.category}`}
                className="inline-block text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                {categoryLabel}カテゴリのセールをもっと見る →
              </Link>
            </div>
          )}
        </section>
      )}

      {/* 関連記事 */}
      {relatedPosts.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            📚 関連記事
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {relatedPosts.map((p) => (
              <article key={p.slug} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow">
                <Link href={`/blog/${p.slug}`}>
                  <h3 className="font-bold text-gray-800 dark:text-gray-100 hover:text-red-600 dark:hover:text-red-400 mb-2 line-clamp-2">
                    {p.title}
                  </h3>
                </Link>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{p.description}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="mt-8 text-center">
        <Link href="/blog" className="text-red-600 dark:text-red-400 hover:underline text-sm">
          ← ブログ一覧に戻る
        </Link>
      </div>
    </div>
  );
}
