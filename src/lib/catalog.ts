import leaderboardJson from '../data/leaderboard.json';

export type EvidenceType = 'Supported' | 'Estimated';
export type LicenseType = 'Closed' | 'Open' | 'Pending';

export interface PriceHistoryEntry {
  date: string;
  inputPer1M: number;
  outputPer1M: number;
  note: string;
}

export interface ModelEntry {
  rank: number;
  id: string;
  slug: string;
  providerSlug: string;
  name: string;
  provider: string;
  evidence: EvidenceType;
  score: number;
  interval: string;
  params: string;
  contextWindow: string;
  maxOutputTokens: string;
  rpmLimit: string;
  tpmLimit: string;
  tpdLimit: string;
  priceHistory: PriceHistoryEntry[];
  inputPer1M: number;
  outputPer1M: number;
  cachedInputPer1M: number;
  elo: number;
  license: LicenseType;
  ag: number;
  co: number;
  re: number;
  mm: number;
  kn: number;
  ml: number;
  if: number;
  ma: number;
  tokPerSec: number;
  latency: string;
  status: string;
  reasoning: boolean;
  categories: string[];
  bestFor: string;
}

export interface ComparisonPair {
  slug: string;
  modelA: ModelEntry;
  modelB: ModelEntry;
}

export const ALL_MODELS: ModelEntry[] = leaderboardJson as ModelEntry[];

export function getModelBySlug(slug: string): ModelEntry | undefined {
  return ALL_MODELS.find((m) => m.slug === slug);
}

export function getModelsByProviderSlug(providerSlug: string): ModelEntry[] {
  return ALL_MODELS.filter((m) => m.providerSlug === providerSlug);
}

export function getAllProviderSlugs(): { providerSlug: string; providerName: string }[] {
  const map = new Map<string, string>();
  for (const m of ALL_MODELS) {
    if (!map.has(m.providerSlug)) {
      map.set(m.providerSlug, m.provider);
    }
  }
  return Array.from(map.entries()).map(([providerSlug, providerName]) => ({
    providerSlug,
    providerName,
  }));
}

export function getAutoComparisonPairs(limitCount = 20): ComparisonPair[] {
  const pool = ALL_MODELS.slice(0, limitCount);
  const pairs: ComparisonPair[] = [];
  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      pairs.push({
        slug: `${pool[i].slug}-vs-${pool[j].slug}`,
        modelA: pool[i],
        modelB: pool[j],
      });
    }
  }
  return pairs;
}

export function parseComparisonSlug(slug: string): ComparisonPair | null {
  const parts = slug.split('-vs-');
  if (parts.length !== 2) return null;
  const modelA = getModelBySlug(parts[0]);
  const modelB = getModelBySlug(parts[1]);
  if (!modelA || !modelB || modelA.slug === modelB.slug) return null;
  return { slug: `${modelA.slug}-vs-${modelB.slug}`, modelA, modelB };
}
