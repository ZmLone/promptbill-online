import rawNews from '../data/news.json';

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

export interface NewsSection {
  heading: string;
  body: string;
}

export interface NewsSourceLink {
  label: string;
  url: string;
}

export interface NewsArticleItem {
  slug: string;
  title: string;
  summary: string;
  category: NewsCategory;
  publishedAt: string;
  updatedAt?: string;
  featured?: boolean;
  relatedModelSlugs: string[];
  priceDeltas?: NewsPriceDelta[];
  keyTakeaways: string[];
  sections: NewsSection[];
  sourceUrls: NewsSourceLink[];
}

export const NEWS_CATEGORIES: NewsCategory[] = [
  'Price Drop',
  'New Model',
  'Benchmark Shift',
  'Deprecation',
  'Endpoint Update',
];

const ALL_ARTICLES: NewsArticleItem[] = (rawNews as NewsArticleItem[])
  .slice()
  .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

export function getAllNewsArticles(): NewsArticleItem[] {
  return ALL_ARTICLES;
}

export function getNewsArticleBySlug(slug: string): NewsArticleItem | undefined {
  return ALL_ARTICLES.find((item) => item.slug === slug);
}

export function getLatestNewsArticles(limit = 10): NewsArticleItem[] {
  return ALL_ARTICLES.slice(0, Math.max(0, limit));
}

export function getNewsByCategory(category?: string): NewsArticleItem[] {
  if (!category || category === 'All') return ALL_ARTICLES;
  return ALL_ARTICLES.filter(
    (item) => item.category.toLowerCase() === category.toLowerCase()
  );
}

export function formatNewsDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '2026-11-28';
  return d.toISOString().slice(0, 10);
}

export function formatRateUsd(val: number | null | undefined): string {
  if (typeof val !== 'number' || !Number.isFinite(val)) return 'N/A';
  if (val > 0 && val < 0.01) return `$${val.toFixed(4)}`;
  return `$${val.toFixed(2)}`;
}
