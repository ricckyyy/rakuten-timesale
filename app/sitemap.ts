import { MetadataRoute } from 'next';
import { CATEGORIES, SITE_INFO } from '@/lib/constants';

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

  return routes;
}
