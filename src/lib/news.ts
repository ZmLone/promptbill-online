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
  authorName?: string;
  authorUrl?: string;
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

export function getRelatedNewsArticles(
  currentSlug: string,
  category: NewsCategory,
  limit = 3
): NewsArticleItem[] {
  const others = ALL_ARTICLES.filter((a) => a.slug !== currentSlug);
  const sameCategory = others.filter((a) => a.category === category);
  const remaining = others.filter((a) => a.category !== category);
  return [...sameCategory, ...remaining].slice(0, Math.max(0, limit));
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

export function formatRateCompact(val: number | null | undefined): string {
  if (typeof val !== 'number' || !Number.isFinite(val)) return 'N/A';
  if (val > 0 && val < 0.01) return `$${val.toFixed(4)}`;
  const roundedTwo = Math.round(val * 100) / 100;
  if (Math.abs(val - roundedTwo) < 1e-9) return `$${roundedTwo.toFixed(2)}`;
  return `$${Number(val.toFixed(4))}`;
}

export function computePctDelta(
  oldVal: number | null | undefined,
  newVal: number | null | undefined
): string | null {
  if (
    typeof oldVal !== 'number' ||
    !Number.isFinite(oldVal) ||
    oldVal <= 0 ||
    typeof newVal !== 'number' ||
    !Number.isFinite(newVal)
  ) {
    return null;
  }
  const pct = ((newVal - oldVal) / oldVal) * 100;
  if (Math.abs(pct) < 0.05) return '0.0%';
  return `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`;
}
