import type { MetadataRoute } from 'next';
import { ALL_MODELS, getAllProviderSlugs, getAutoComparisonPairs } from '../lib/catalog';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://promptbill.online';
  const lastModified = new Date('2026-11-23');

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified, changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/leaderboard`, lastModified, changeFrequency: 'daily', priority: 0.95 },
    { url: `${baseUrl}/models`, lastModified, changeFrequency: 'daily', priority: 0.95 },
    { url: `${baseUrl}/compare`, lastModified, changeFrequency: 'daily', priority: 0.95 },
    { url: `${baseUrl}/pricing`, lastModified, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/best-llms-for-coding`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/best-open-weight-llms`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/cheapest-llms-for-classification`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/fastest-llms-tokens-per-second`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/tools/llm-selector`, lastModified, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/tools/token-counter`, lastModified, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/tools/routing-simulator`, lastModified, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/deals`, lastModified, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/methodology`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/about`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/contact`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/privacy-policy`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/advertise`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
  ];

  const modelRoutes: MetadataRoute.Sitemap = ALL_MODELS.map((m) => ({
    url: `${baseUrl}/models/${m.slug}`,
    lastModified,
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  const providerRoutes: MetadataRoute.Sitemap = getAllProviderSlugs().map((p) => ({
    url: `${baseUrl}/providers/${p.providerSlug}`,
    lastModified,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const comparisonRoutes: MetadataRoute.Sitemap = getAutoComparisonPairs(20).map((pair) => ({
    url: `${baseUrl}/compare/${pair.slug}`,
    lastModified,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...modelRoutes, ...providerRoutes, ...comparisonRoutes];
}
