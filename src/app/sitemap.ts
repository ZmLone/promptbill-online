import type { MetadataRoute } from 'next';
import { ALL_MODELS, getAllProviderSlugs, getAutoComparisonPairs } from '../lib/catalog';

const BASE_URL = 'https://promptbill.online';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    '',
    '/leaderboard',
    '/models',
    '/pricing',
    '/compare',
    '/tools/llm-selector',
    '/tools/token-counter',
    '/tools/routing-simulator',
    '/best-llms-for-coding',
    '/best-open-weight-llms',
    '/cheapest-llms-for-classification',
    '/fastest-llms-tokens-per-second',
    '/about',
    '/methodology',
    '/contact',
    '/deals',
    '/advertise',
    '/privacy-policy',
  ];

  const entries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${BASE_URL}${route || '/'}`,
    changeFrequency: route === '' || route === '/leaderboard' || route === '/pricing' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : route === '/leaderboard' || route === '/pricing' ? 0.9 : 0.7,
  }));

  for (const m of ALL_MODELS) {
    entries.push({
      url: `${BASE_URL}/models/${m.slug}`,
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  }

  for (const p of getAllProviderSlugs()) {
    entries.push({
      url: `${BASE_URL}/providers/${p.providerSlug}`,
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  }

  for (const pair of getAutoComparisonPairs(48)) {
    entries.push({
      url: `${BASE_URL}/compare/${pair.slug}`,
      changeFrequency: 'weekly',
      priority: 0.6,
    });
  }

  return entries;
}
