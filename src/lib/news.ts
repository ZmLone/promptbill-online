import newsRaw from '@/data/news.json';

export type NewsCategory =
  | 'Price Drop'
  | 'New Model'
  | 'Benchmark Shift'
  | 'Deprecation'
  | 'Endpoint Update';

export interface NewsPriceDelta {
  modelSlug: string;
  modelName: string;
  provider: string;
  endpointHost?: string;
  oldInputPer1M?: number | null;
  newInputPer1M: number | null;
  oldOutputPer1M?: number | null;
  newOutputPer1M: number | null;
}

export interface NewsArticle {
  slug: string;
  title: string;
  summary: string;
  category: NewsCategory;
  publishedAt: string;
  updatedAt?: string;
  authorName?: string;
  authorUrl?: string;
  featured?: boolean;
  relatedModelSlugs: string[];
  priceDeltas: NewsPriceDelta[];
  keyTakeaways: string[];
  sections: { heading: string; body: string }[];
  sourceUrls: { label: string; url: string }[];
}

export function getAllNewsArticles(): NewsArticle[] {
  const list = Array.isArray(newsRaw) ? (newsRaw as NewsArticle[]) : [];
  return [...list].sort((a, b) => {
    const featuredDiff = Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    if (featuredDiff !== 0) return featuredDiff;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}

export function getNewsArticleBySlug(slug: string): NewsArticle | undefined {
  return getAllNewsArticles().find((article) => article.slug === slug);
}

export function formatNewsDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatUsdPer1M(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  if (value === 0) return '$0.00';
  if (value < 0.01) return `$${value.toFixed(4)}`;
  if (value < 1) return `$${value.toFixed(3)}`;
  return `$${value.toFixed(2)}`;
}
