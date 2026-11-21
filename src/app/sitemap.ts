import type { MetadataRoute } from 'next';
import { ALL_MODELS, getAllProviderSlugs } from '../lib/catalog';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://promptbill.online';
  const lastModified = new Date('2026-11-21');

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified, changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/models`, lastModified, changeFrequency: 'daily', priority: 0.95 },
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
    { url: `${baseUrl}/advertise`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
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

  const comparisonRoutes: MetadataRoute.Sitemap = [];
  for (let i = 0; i < ALL_MODELS.length; i++) {
    for (let j = i + 1; j < ALL_MODELS.length; j++) {
      comparisonRoutes.push({
        url: `${baseUrl}/compare/${ALL_MODELS[i].slug}-vs-${ALL_MODELS[j].slug}`,
        lastModified,
        changeFrequency: 'weekly',
        priority: 0.75,
      });
    }
  }

  return [...staticRoutes, ...modelRoutes, ...providerRoutes, ...comparisonRoutes];
}
