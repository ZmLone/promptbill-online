import type { MetadataRoute } from 'next';
import { ALL_MODELS } from '../lib/catalog';
import { getUniqueProviders, TIER_HUBS } from '../lib/hubs';
import { REGISTRY_SNAPSHOT } from '../lib/modelRegistry';
import { getAllNewsArticles, formatNewsDate } from '../lib/news';

const BASE_URL = 'https://promptbill.online';
const SNAPSHOT_UPDATED_AT = REGISTRY_SNAPSHOT.generatedMonthYear || '2026-11-27';

function toValidDate(input: unknown, fallback: string): string {
  if (typeof input === 'string' && input.trim()) {
    const parsed = new Date(input);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  }
  return fallback;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const catalogDate = toValidDate(SNAPSHOT_UPDATED_AT, '2026-11-27');

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: catalogDate },
    { url: `${BASE_URL}/models`, lastModified: catalogDate },
    { url: `${BASE_URL}/news`, lastModified: catalogDate },
    { url: `${BASE_URL}/leaderboard`, lastModified: catalogDate },
    { url: `${BASE_URL}/compare`, lastModified: catalogDate },
    { url: `${BASE_URL}/pricing`, lastModified: catalogDate },
    { url: `${BASE_URL}/tools/llm-selector`, lastModified: catalogDate },
    { url: `${BASE_URL}/tools/token-counter`, lastModified: catalogDate },
    { url: `${BASE_URL}/tools/routing-simulator`, lastModified: catalogDate },
    { url: `${BASE_URL}/best-llms-for-coding`, lastModified: catalogDate },
    { url: `${BASE_URL}/best-open-weight-llms`, lastModified: catalogDate },
    { url: `${BASE_URL}/cheapest-llms-for-classification`, lastModified: catalogDate },
    { url: `${BASE_URL}/fastest-llms-tokens-per-second`, lastModified: catalogDate },
    { url: `${BASE_URL}/methodology`, lastModified: catalogDate },
    { url: `${BASE_URL}/about`, lastModified: catalogDate },
    { url: `${BASE_URL}/contact`, lastModified: catalogDate },
    { url: `${BASE_URL}/advertise`, lastModified: catalogDate },
    { url: `${BASE_URL}/privacy-policy`, lastModified: catalogDate },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const modelRoutes: MetadataRoute.Sitemap = (ALL_MODELS as any[])
    .filter((m) => !m.archived && m.slug)
    .map((m) => {
      const modelDate = toValidDate(
        m.lastUpdated || m.updatedAt || m.pricingProvenance?.lastChecked || SNAPSHOT_UPDATED_AT,
        catalogDate,
      );
      return {
        url: `${BASE_URL}/models/${m.slug}`,
        lastModified: modelDate,
      };
    });

  const providerRoutes: MetadataRoute.Sitemap = getUniqueProviders(ALL_MODELS).map((p) => ({
    url: `${BASE_URL}/providers/${p.slug}`,
    lastModified: catalogDate,
  }));

  const tierRoutes: MetadataRoute.Sitemap = TIER_HUBS.map((t) => ({
    url: `${BASE_URL}/tiers/${t.slug}`,
    lastModified: catalogDate,
  }));

  const newsRoutes: MetadataRoute.Sitemap = getAllNewsArticles().map((article) => ({
    url: `${BASE_URL}/news/${article.slug}`,
    lastModified: formatNewsDate(article.updatedAt || article.publishedAt),
  }));

  return [...staticRoutes, ...newsRoutes, ...modelRoutes, ...providerRoutes, ...tierRoutes];
}
