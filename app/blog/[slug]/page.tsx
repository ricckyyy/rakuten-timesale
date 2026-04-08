import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAllPosts, getPostBySlug } from '@/lib/blog';
import { fetchRakutenProducts } from '@/lib/rakuten';
import { MDXRemote } from 'next-mdx-remote/rsc';
import ProductCard from '@/components/ProductCard';
import type { Metadata } from 'next';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: '記事が見つかりません' };

  return {
    title: post.title,
    description: post.description,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  // 記事のtagsをキーワードにして関連商品を取得
  const keyword = post.tags[0] ?? post.title;
  const relatedProducts = await fetchRakutenProducts(undefined, keyword, 4);

  return (
    <div className="max-w-3xl mx-auto">
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
          <time className="text-sm text-gray-500 dark:text-gray-400" dateTime={post.date}>
            {new Date(post.date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
          </time>
        </header>

        <div className="
          prose prose-gray dark:prose-invert max-w-none
          prose-headings:font-bold
          prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-gray-200 dark:prose-h2:border-gray-700 prose-h2:pb-2
          prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3
          prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-4
          prose-a:text-red-600 dark:prose-a:text-red-400 prose-a:underline
          prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-4
          prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-li:mb-1
          prose-strong:text-gray-900 dark:prose-strong:text-gray-100
        ">
          <MDXRemote source={post.content} />
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
          <div className="mt-4 text-center">
            <Link
              href={`/category/${post.category}`}
              className="inline-block text-sm text-red-600 dark:text-red-400 hover:underline"
            >
              {post.category === 'food' ? '食品' : post.category}カテゴリのセールをもっと見る →
            </Link>
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
