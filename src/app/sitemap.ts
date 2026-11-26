import type { MetadataRoute } from 'next';
import { ALL_MODELS, getAllProviderSlugs, getAutoComparisonPairs } from '../lib/catalog';

const BASE_URL = 'https://promptbill.online';
const LAST_MODIFIED = '2026-11-26';

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
    '/advertise',
    '/privacy-policy',
  ];

  const entries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${BASE_URL}${route || '/'}`,
    lastModified: LAST_MODIFIED,
    changeFrequency:
      route === '' || route === '/leaderboard' || route === '/pricing' || route === '/models' || route === '/compare'
        ? 'daily'
        : 'weekly',
    priority:
      route === ''
        ? 1.0
        : route === '/leaderboard' || route === '/pricing'
        ? 0.9
        : route === '/models' || route === '/compare'
        ? 0.85
        : 0.7,
  }));

  for (const m of ALL_MODELS) {
    const modelLastMod =
      m.pricingProvenance?.lastVerified ||
      m.benchmarkProvenance?.lastVerified ||
      LAST_MODIFIED;
    entries.push({
      url: `${BASE_URL}/models/${m.slug}`,
      lastModified: modelLastMod,
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  }

  for (const p of getAllProviderSlugs()) {
    entries.push({
      url: `${BASE_URL}/providers/${p.providerSlug}`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.75,
    });
  }

  for (const pair of getAutoComparisonPairs(160)) {
    entries.push({
      url: `${BASE_URL}/compare/${pair.slug}`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.65,
    });
  }

  return entries;
}
