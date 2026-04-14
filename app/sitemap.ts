import { MetadataRoute } from 'next';
import { CATEGORIES, SITE_INFO } from '@/lib/constants';
import { getAllPosts } from '@/lib/blog';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_INFO.url;

  // トップページ
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ];

  // カテゴリページ
  Object.keys(CATEGORIES).forEach((slug) => {
    routes.push({
      url: `${baseUrl}/category/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    });
  });

  // ブログ一覧ページ
  routes.push({
    url: `${baseUrl}/blog`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  });

  // ブログ記事ページ
  getAllPosts().forEach((post) => {
    routes.push({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  });

  return routes;
}
