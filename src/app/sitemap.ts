import type { MetadataRoute } from 'next';
import { getAllNewsArticles } from '@/lib/news';
import { ALL_MODELS } from '@/lib/catalog';

const SITE_URL = 'https://promptbill.online';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const articles = getAllNewsArticles();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/models`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/calculator`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/compare`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/tools/llm-selector`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/news`,
      lastModified: articles[0]?.updatedAt || articles[0]?.publishedAt || now,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  const modelRoutes: MetadataRoute.Sitemap = (Array.isArray(ALL_MODELS) ? ALL_MODELS : []).map(
    (model: { slug?: string }) => ({
      url: `${SITE_URL}/models/${model.slug}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.75,
    })
  );

  const newsRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${SITE_URL}/news/${article.slug}`,
    lastModified: article.updatedAt || article.publishedAt || now,
    changeFrequency: 'weekly',
    priority: 0.75,
  }));

  return [...staticRoutes, ...modelRoutes, ...newsRoutes];
}
