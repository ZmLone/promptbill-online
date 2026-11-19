import { MetadataRoute } from 'next';
import { FALLBACK_MODELS } from '@/data/fallbackModels';

export default function sitemap(): MetadataRoute.Sitemap {
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tokenledger-six.vercel.app';
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ];

  for (let i = 0; i < FALLBACK_MODELS.length; i++) {
    for (let j = i + 1; j < FALLBACK_MODELS.length; j++) {
      routes.push({
        url: `${baseUrl}/compare/${FALLBACK_MODELS[i].slug}-vs-${FALLBACK_MODELS[j].slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  }

  return routes;
}
