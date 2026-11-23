import modelsJson from '../data/models.json';
import { applyLiveRegistryPricing, type LiveModelRecord } from './liveRegistryBridge';

export interface PriceHistoryEntry {
  date: string;
  inputPer1M: number;
  outputPer1M: number;
  note: string;
}

export interface CatalogModel {
  id: string;
  slug: string;
  rank: number;
  name: string;
  provider: string;
  providerSlug: string;
  family: string;
  license: 'Open' | 'Closed';
  evidence: 'Supported' | 'Estimated';
  score: number;
  interval: string;
  elo: number;
  inputPer1M: number;
  cachedInputPer1M: number;
  outputPer1M: number;
  contextWindow: string;
  maxOutputTokens: string;
  tokPerSec: number;
  ag: number;
  co: number;
  re: number;
  mm: number;
  kn: number;
  ml: number;
  if: number;
  ma: number;
  rpmLimit: string;
  tpmLimit: string;
  tpdLimit: string;
  batchDiscount: number;
  bestFor: string;
  notes: string;
  priceHistory: PriceHistoryEntry[];
}

export type ModelEntry = CatalogModel;

export interface ComparisonPair {
  slug: string;
  modelA: CatalogModel;
  modelB: CatalogModel;
}

export interface ProviderSummary {
  providerSlug: string;
  providerName: string;
  modelCount: number;
}

function toSlug(raw: string): string {
  return String(raw || '')
    .toLowerCase()
    .replace(/^[^/]+\//, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeRecord(rec: LiveModelRecord, index: number): CatalogModel {
  const slug = toSlug(rec.slug || rec.id || rec.name);
  const provider = rec.provider || 'Provider';
  const providerSlug = toSlug(rec.providerSlug || provider);
  const inputPer1M = typeof rec.inputPer1M === 'number' ? rec.inputPer1M : 0;
  const outputPer1M = typeof rec.outputPer1M === 'number' ? rec.outputPer1M : 0;
  const cachedInputPer1M =
    typeof rec.cachedInputPer1M === 'number'
      ? rec.cachedInputPer1M
      : Number((inputPer1M * 0.1).toFixed(4));

  const baseModel: CatalogModel = {
    id: rec.id || slug,
    slug,
    rank: typeof rec.rank === 'number' ? rec.rank : index + 1,
    name: rec.name,
    provider,
    providerSlug,
    family: rec.family || rec.name.split(' ')[0] || provider,
    license: rec.license === 'Open' ? 'Open' : 'Closed',
    evidence: rec.evidence === 'Estimated' ? 'Estimated' : 'Supported',
    score: typeof rec.score === 'number' ? rec.score : 80.0,
    interval: rec.interval || '±1.2',
    elo: typeof rec.elo === 'number' ? rec.elo : 1320.0,
    inputPer1M,
    cachedInputPer1M,
    outputPer1M,
    contextWindow: rec.contextWindow || '128K',
    maxOutputTokens: rec.maxOutputTokens || '32K',
    tokPerSec: typeof rec.tokPerSec === 'number' ? rec.tokPerSec : 100,
    ag: typeof rec.ag === 'number' ? rec.ag : 80,
    co: typeof rec.co === 'number' ? rec.co : 80,
    re: typeof rec.re === 'number' ? rec.re : 80,
    mm: typeof rec.mm === 'number' ? rec.mm : 78,
    kn: typeof rec.kn === 'number' ? rec.kn : 80,
    ml: typeof rec.ml === 'number' ? rec.ml : 80,
    if: typeof rec.if === 'number' ? rec.if : 80,
    ma: typeof rec.ma === 'number' ? rec.ma : 80,
    rpmLimit: rec.rpmLimit || '4,000 RPM',
    tpmLimit: rec.tpmLimit || '2,000,000 TPM',
    tpdLimit: rec.tpdLimit || '50,000,000 TPD',
    batchDiscount: typeof rec.batchDiscount === 'number' ? rec.batchDiscount : 0.5,
    bestFor: rec.bestFor || `${provider} API workloads and token cost benchmarking`,
    notes: rec.notes || 'Synced dynamically from src/data/models.json.',
    priceHistory:
      Array.isArray(rec.priceHistory) && rec.priceHistory.length > 0
        ? rec.priceHistory.map((h) => ({
            date: h.date,
            inputPer1M: h.inputPer1M,
            outputPer1M: h.outputPer1M,
            note: h.note || 'Registry snapshot',
          }))
        : [
            {
              date: '2026-11-23',
              inputPer1M,
              outputPer1M,
              note: 'Live registry price from src/data/models.json',
            },
          ],
  };

  return applyLiveRegistryPricing(baseModel);
}

const rawRecords = (modelsJson as LiveModelRecord[]) || [];

export const ALL_MODELS: CatalogModel[] = rawRecords
  .map(normalizeRecord)
  .sort((a, b) => a.rank - b.rank);

export function getAllCatalogModels(): CatalogModel[] {
  return ALL_MODELS;
}

export function getModelBySlug(slug: string): CatalogModel | undefined {
  const normalized = toSlug(slug);
  return ALL_MODELS.find(
    (m) => m.slug === slug || m.slug === normalized || m.id === slug || toSlug(m.id) === normalized
  );
}

export function getModelsByProvider(providerSlug: string): CatalogModel[] {
  const normalized = toSlug(providerSlug);
  return ALL_MODELS.filter(
    (m) => m.providerSlug === providerSlug || m.providerSlug === normalized || toSlug(m.provider) === normalized
  );
}

export function getModelsByProviderSlug(providerSlug: string): CatalogModel[] {
  return getModelsByProvider(providerSlug);
}

export function getAllProviderSlugs(): ProviderSummary[] {
  const map = new Map<string, ProviderSummary>();
  for (const m of ALL_MODELS) {
    if (!m.providerSlug) continue;
    const existing = map.get(m.providerSlug);
    if (existing) {
      existing.modelCount += 1;
    } else {
      map.set(m.providerSlug, {
        providerSlug: m.providerSlug,
        providerName: m.provider,
        modelCount: 1,
      });
    }
  }
  return Array.from(map.values());
}

export function getAutoComparisonPairs(limit = 48): ComparisonPair[] {
  const pairs: ComparisonPair[] = [];
  const slice = ALL_MODELS.slice(0, Math.min(ALL_MODELS.length, 16));
  for (let i = 0; i < slice.length; i++) {
    for (let j = i + 1; j < slice.length; j++) {
      const a = slice[i];
      const b = slice[j];
      pairs.push({
        slug: `${a.slug}-vs-${b.slug}`,
        modelA: a,
        modelB: b,
      });
      if (pairs.length >= limit) return pairs;
    }
  }
  return pairs;
}

export function parseComparisonSlug(
  pairSlug: string
): { modelA: CatalogModel; modelB: CatalogModel; slug: string } | null {
  if (!pairSlug) return null;
  const clean = pairSlug.toLowerCase();

  for (const a of ALL_MODELS) {
    const prefix = `${a.slug}-vs-`;
    if (clean.startsWith(prefix)) {
      const rest = clean.slice(prefix.length);
      const b = getModelBySlug(rest);
      if (b && b.slug !== a.slug) {
        return { modelA: a, modelB: b, slug: `${a.slug}-vs-${b.slug}` };
      }
    }
  }

  const parts = clean.split('-vs-');
  if (parts.length === 2) {
    const a = getModelBySlug(parts[0]);
    const b = getModelBySlug(parts[1]);
    if (a && b && a.slug !== b.slug) {
      return { modelA: a, modelB: b, slug: `${a.slug}-vs-${b.slug}` };
    }
  }

  return null;
}
