import type { MetadataRoute } from 'next';
import {
  ALL_MODELS,
  getAllProviderSlugs,
  getAutoComparisonPairs,
  type CatalogModel,
} from '../lib/catalog';
import { getRegistryFreshnessSummary } from '../lib/freshness';

const BASE_URL = 'https://promptbill.online';

const DAILY_CORE_ROUTES = new Set([
  '',
  '/leaderboard',
  '/pricing',
  '/models',
  '/compare',
]);

function pickLatestDate(dates: Array<string | null | undefined>): string | undefined {
  let latest: string | undefined;
  for (const raw of dates) {
    if (typeof raw !== 'string') continue;
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const parsed = Date.parse(trimmed);
    if (Number.isNaN(parsed)) continue;
    if (!latest || parsed > Date.parse(latest)) {
      latest = trimmed;
    }
  }
  return latest;
}

function getModelLastModified(model: CatalogModel, fallback?: string): string | undefined {
  const historyDates = model.priceHistory.map((entry) => entry.date);
  return pickLatestDate([
    model.pricingProvenance?.lastVerified,
    model.benchmarkProvenance?.lastVerified,
    model.speedProvenance?.lastVerified,
    ...historyDates,
    fallback,
  ]);
}

export default function sitemap(): MetadataRoute.Sitemap {
  const { latestVerifiedDate } = getRegistryFreshnessSummary();
  const registryLastMod = pickLatestDate([latestVerifiedDate]);

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

  const entries: MetadataRoute.Sitemap = staticRoutes.map((route) => {
    const isDaily = DAILY_CORE_ROUTES.has(route);
    const priority =
      route === ''
        ? 1.0
        : route === '/leaderboard' || route === '/pricing'
        ? 0.9
        : route === '/models' || route === '/compare'
        ? 0.85
        : 0.7;

    return {
      url: `${BASE_URL}${route || '/'}`,
      ...(isDaily && registryLastMod ? { lastModified: registryLastMod } : {}),
      changeFrequency: isDaily ? 'daily' : 'weekly',
      priority,
    };
  });

  const modelLastModBySlug = new Map<string, string | undefined>();
  for (const m of ALL_MODELS) {
    const lastModified = getModelLastModified(m, registryLastMod);
    modelLastModBySlug.set(m.slug, lastModified);
    entries.push({
      url: `${BASE_URL}/models/${m.slug}`,
      ...(lastModified ? { lastModified } : {}),
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  }

  for (const p of getAllProviderSlugs()) {
    const providerDates = ALL_MODELS.filter((m) => m.providerSlug === p.providerSlug).map(
      (m) => modelLastModBySlug.get(m.slug)
    );
    const providerLastMod = pickLatestDate([...providerDates, registryLastMod]);

    entries.push({
      url: `${BASE_URL}/providers/${p.providerSlug}`,
      ...(providerLastMod ? { lastModified: providerLastMod } : {}),
      changeFrequency: 'weekly',
      priority: 0.75,
    });
  }

  for (const pair of getAutoComparisonPairs(160)) {
    const pairLastMod = pickLatestDate([
      modelLastModBySlug.get(pair.modelA.slug),
      modelLastModBySlug.get(pair.modelB.slug),
      registryLastMod,
    ]);

    entries.push({
      url: `${BASE_URL}/compare/${pair.slug}`,
      ...(pairLastMod ? { lastModified: pairLastMod } : {}),
      changeFrequency: 'weekly',
      priority: 0.65,
    });
  }

  return entries;
}
