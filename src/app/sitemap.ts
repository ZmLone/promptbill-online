import type { MetadataRoute } from 'next';
import { ALL_MODELS } from '../lib/catalog';
import { getUniqueProviders, TIER_HUBS } from '../lib/hubs';

const BASE_URL = 'https://promptbill.online';
const CATALOG_LAST_MODIFIED = '2026-11-27';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: CATALOG_LAST_MODIFIED },
    { url: `${BASE_URL}/models`, lastModified: CATALOG_LAST_MODIFIED },
    { url: `${BASE_URL}/leaderboard`, lastModified: CATALOG_LAST_MODIFIED },
    { url: `${BASE_URL}/compare`, lastModified: CATALOG_LAST_MODIFIED },
    { url: `${BASE_URL}/pricing`, lastModified: CATALOG_LAST_MODIFIED },
    { url: `${BASE_URL}/tools/llm-selector`, lastModified: CATALOG_LAST_MODIFIED },
    { url: `${BASE_URL}/tools/token-counter`, lastModified: CATALOG_LAST_MODIFIED },
    { url: `${BASE_URL}/tools/routing-simulator`, lastModified: CATALOG_LAST_MODIFIED },
    { url: `${BASE_URL}/best-llms-for-coding`, lastModified: CATALOG_LAST_MODIFIED },
    { url: `${BASE_URL}/best-open-weight-llms`, lastModified: CATALOG_LAST_MODIFIED },
    { url: `${BASE_URL}/cheapest-llms-for-classification`, lastModified: CATALOG_LAST_MODIFIED },
    { url: `${BASE_URL}/fastest-llms-tokens-per-second`, lastModified: CATALOG_LAST_MODIFIED },
    { url: `${BASE_URL}/methodology`, lastModified: CATALOG_LAST_MODIFIED },
    { url: `${BASE_URL}/about`, lastModified: CATALOG_LAST_MODIFIED },
    { url: `${BASE_URL}/contact`, lastModified: CATALOG_LAST_MODIFIED },
    { url: `${BASE_URL}/advertise`, lastModified: CATALOG_LAST_MODIFIED },
    { url: `${BASE_URL}/privacy-policy`, lastModified: CATALOG_LAST_MODIFIED },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const modelRoutes: MetadataRoute.Sitemap = (ALL_MODELS as any[])
    .filter((m) => !m.archived && m.slug)
    .map((m) => ({
      url: `${BASE_URL}/models/${m.slug}`,
      lastModified: CATALOG_LAST_MODIFIED,
    }));

  const providerRoutes: MetadataRoute.Sitemap = getUniqueProviders(ALL_MODELS).map((p) => ({
    url: `${BASE_URL}/providers/${p.slug}`,
    lastModified: CATALOG_LAST_MODIFIED,
  }));

  const tierRoutes: MetadataRoute.Sitemap = TIER_HUBS.map((t) => ({
    url: `${BASE_URL}/tiers/${t.slug}`,
    lastModified: CATALOG_LAST_MODIFIED,
  }));

  return [...staticRoutes, ...modelRoutes, ...providerRoutes, ...tierRoutes];
}
