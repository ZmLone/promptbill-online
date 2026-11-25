import modelsJson from '../data/models.json';
import { applyLiveRegistryPricing, type LiveModelRecord, type FieldProvenance } from './liveRegistryBridge';

export type { FieldProvenance };

export interface PriceHistoryEntry {
  date: string;
  inputPer1M: number;
  outputPer1M: number;
  note: string;
  sourceUrl?: string | null;
}

export interface CatalogHostingEndpoint {
  host: string;
  providerType: 'Official API' | 'Router' | 'Inference Cloud';
  inputPer1M: number | null;
  cachedInputPer1M: number | null;
  cacheWritePer1M: number | null;
  outputPer1M: number | null;
  batchDiscount: number | null;
  latencyMs?: number | null;
  notes?: string | null;
  currency?: string;
  pricingUnit?: string;
  sourceUrl?: string | null;
  lastVerified?: string | null;
  evidenceStatus?: 'Verified' | 'Estimated' | 'Unavailable';
}

export interface CatalogModel {
  id: string;
  slug: string;
  rank: number | null;
  name: string;
  provider: string;
  providerSlug: string;
  family: string | null;
  license: 'Open' | 'Closed' | null;
  evidence: 'Verified' | 'Estimated' | 'Unavailable';
  score: number | null;
  qualityScore: number | null;
  interval: string | null;
  elo: number | null;
  inputPer1M: number | null;
  cachedInputPer1M: number | null;
  cacheWritePer1M: number | null;
  outputPer1M: number | null;
  longContextMultiplierInput: number | null;
  longContextMultiplierOutput: number | null;
  longContextThresholdTokens: number | null;
  contextWindow: string | null;
  maxOutputTokens: string | null;
  tokPerSec: number | null;
  speedTokensPerSec: number | null;
  ag: number | null;
  co: number | null;
  re: number | null;
  mm: number | null;
  kn: number | null;
  ml: number | null;
  if: number | null;
  ma: number | null;
  rpmLimit: string | null;
  tpmLimit: string | null;
  tpdLimit: string | null;
  batchDiscount: number | null;
  tier: string | null;
  bestFor: string | null;
  notes: string | null;
  pricingProvenance: FieldProvenance;
  benchmarkProvenance: FieldProvenance;
  speedProvenance: FieldProvenance;
  priceHistory: PriceHistoryEntry[];
  hostingEndpoints: CatalogHostingEndpoint[];
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

function finiteNonNegOrNull(val: unknown): number | null {
  if (typeof val !== 'number' || !Number.isFinite(val) || val < 0) return null;
  return val;
}

function nonEmptyStringOrNull(val: unknown): string | null {
  if (typeof val !== 'string') return null;
  const trimmed = val.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeRecord(rec: LiveModelRecord, index: number): CatalogModel {
  const slug = toSlug(rec.slug || rec.id || rec.name);
  const provider = nonEmptyStringOrNull(rec.provider) || 'Unknown Provider';
  const providerSlug = toSlug(rec.providerSlug || provider);

  const rawEndpoints = Array.isArray(rec.hostingEndpoints) ? rec.hostingEndpoints : [];
  const hostingEndpoints: CatalogHostingEndpoint[] = rawEndpoints
    .filter((ep) => ep && typeof ep.host === 'string' && ep.host.trim().length > 0)
    .map((ep) => ({
      host: ep.host.trim(),
      providerType:
        ep.providerType === 'Official API' ||
        ep.providerType === 'Router' ||
        ep.providerType === 'Inference Cloud'
          ? ep.providerType
          : 'Inference Cloud',
      inputPer1M: finiteNonNegOrNull(ep.inputPer1M),
      cachedInputPer1M: finiteNonNegOrNull(ep.cachedInputPer1M),
      cacheWritePer1M: finiteNonNegOrNull(ep.cacheWritePer1M),
      outputPer1M: finiteNonNegOrNull(ep.outputPer1M),
      batchDiscount: finiteNonNegOrNull(ep.batchDiscount),
      latencyMs: finiteNonNegOrNull(ep.latencyMs),
      notes: nonEmptyStringOrNull(ep.notes),
      currency: nonEmptyStringOrNull(ep.currency) || 'USD',
      pricingUnit: nonEmptyStringOrNull(ep.pricingUnit) || 'per 1M tokens',
      sourceUrl: nonEmptyStringOrNull(ep.sourceUrl),
      lastVerified: nonEmptyStringOrNull(ep.lastVerified),
      evidenceStatus:
        ep.evidenceStatus === 'Verified' ||
        ep.evidenceStatus === 'Estimated' ||
        ep.evidenceStatus === 'Unavailable'
          ? ep.evidenceStatus
          : 'Estimated',
    }));

  const officialEndpoint = hostingEndpoints.find((e) => e.providerType === 'Official API');
  const inputPer1M = officialEndpoint
    ? finiteNonNegOrNull(officialEndpoint.inputPer1M)
    : finiteNonNegOrNull(rec.inputPer1M);
  const outputPer1M = officialEndpoint
    ? finiteNonNegOrNull(officialEndpoint.outputPer1M)
    : finiteNonNegOrNull(rec.outputPer1M);
  const cachedInputPer1M = officialEndpoint
    ? finiteNonNegOrNull(officialEndpoint.cachedInputPer1M)
    : finiteNonNegOrNull(rec.cachedInputPer1M);
  const cacheWritePer1M = officialEndpoint
    ? finiteNonNegOrNull(officialEndpoint.cacheWritePer1M)
    : finiteNonNegOrNull(rec.cacheWritePer1M);
  const batchDiscount = officialEndpoint
    ? finiteNonNegOrNull(officialEndpoint.batchDiscount)
    : finiteNonNegOrNull(rec.batchDiscount);

  const score = finiteNonNegOrNull(rec.score) ?? finiteNonNegOrNull(rec.qualityScore);
  const tokPerSec = finiteNonNegOrNull(rec.tokPerSec) ?? finiteNonNegOrNull(rec.speedTokensPerSec);
  const elo = finiteNonNegOrNull(rec.elo);

  const pricingProvenance: FieldProvenance = rec.pricingProvenance ?? {
    status: inputPer1M !== null && outputPer1M !== null ? 'Estimated' : 'Unavailable',
    sourceUrl: officialEndpoint?.sourceUrl ?? null,
    lastVerified: officialEndpoint?.lastVerified ?? null,
    currency: 'USD',
    pricingUnit: 'per 1M tokens',
    notes: officialEndpoint
      ? `Primary official endpoint: ${officialEndpoint.host}`
      : 'No official endpoint verified; check source records.',
  };

  const benchmarkProvenance: FieldProvenance = rec.benchmarkProvenance ?? {
    status: score !== null ? 'Estimated' : 'Unavailable',
    sourceUrl: null,
    lastVerified: null,
    notes: score !== null ? 'Benchmark score without external citation URL.' : 'No benchmark score recorded.',
  };

  const speedProvenance: FieldProvenance = rec.speedProvenance ?? {
    status: tokPerSec !== null ? 'Estimated' : 'Unavailable',
    sourceUrl: null,
    lastVerified: null,
    hardwareOrProvider: officialEndpoint?.host ?? null,
    conditions: null,
    notes: tokPerSec !== null ? 'Speed value without measured test log.' : 'No speed measurement recorded.',
  };

  const evidenceStatus: 'Verified' | 'Estimated' | 'Unavailable' =
    rec.evidence === 'Verified' || rec.evidence === 'Estimated' || rec.evidence === 'Unavailable'
      ? rec.evidence
      : pricingProvenance.status === 'Verified' && benchmarkProvenance.status === 'Verified'
      ? 'Verified'
      : inputPer1M !== null || score !== null || tokPerSec !== null
      ? 'Estimated'
      : 'Unavailable';

  const baseModel: CatalogModel = {
    id: nonEmptyStringOrNull(rec.id) || slug || `model-${index + 1}`,
    slug,
    rank: finiteNonNegOrNull(rec.rank),
    name: nonEmptyStringOrNull(rec.name) || slug || `Model ${index + 1}`,
    provider,
    providerSlug,
    family: nonEmptyStringOrNull(rec.family),
    license: rec.license === 'Open' || rec.license === 'Closed' ? rec.license : null,
    evidence: evidenceStatus,
    score,
    qualityScore: score,
    interval: nonEmptyStringOrNull(rec.interval),
    elo,
    inputPer1M,
    cachedInputPer1M,
    cacheWritePer1M,
    outputPer1M,
    longContextMultiplierInput: finiteNonNegOrNull(rec.longContextMultiplierInput),
    longContextMultiplierOutput: finiteNonNegOrNull(rec.longContextMultiplierOutput),
    longContextThresholdTokens: finiteNonNegOrNull(rec.longContextThresholdTokens),
    contextWindow: nonEmptyStringOrNull(rec.contextWindow),
    maxOutputTokens: nonEmptyStringOrNull(rec.maxOutputTokens),
    tokPerSec,
    speedTokensPerSec: tokPerSec,
    ag: finiteNonNegOrNull(rec.ag),
    co: finiteNonNegOrNull(rec.co),
    re: finiteNonNegOrNull(rec.re),
    mm: finiteNonNegOrNull(rec.mm),
    kn: finiteNonNegOrNull(rec.kn),
    ml: finiteNonNegOrNull(rec.ml),
    if: finiteNonNegOrNull(rec.if),
    ma: finiteNonNegOrNull(rec.ma),
    rpmLimit: nonEmptyStringOrNull(rec.rpmLimit),
    tpmLimit: nonEmptyStringOrNull(rec.tpmLimit),
    tpdLimit: nonEmptyStringOrNull(rec.tpdLimit),
    batchDiscount,
    tier: nonEmptyStringOrNull(rec.tier),
    bestFor: nonEmptyStringOrNull(rec.bestFor),
    notes: nonEmptyStringOrNull(rec.notes),
    pricingProvenance,
    benchmarkProvenance,
    speedProvenance,
    priceHistory: Array.isArray(rec.priceHistory)
      ? rec.priceHistory
          .filter((h) => h && typeof h.date === 'string' && typeof h.inputPer1M === 'number' && typeof h.outputPer1M === 'number')
          .map((h) => ({
            date: h.date,
            inputPer1M: h.inputPer1M,
            outputPer1M: h.outputPer1M,
            note: nonEmptyStringOrNull(h.note) || 'Recorded price change',
            sourceUrl: nonEmptyStringOrNull(h.sourceUrl),
          }))
      : [],
    hostingEndpoints,
  };

  return applyLiveRegistryPricing(baseModel);
}

const rawRecords = Array.isArray(modelsJson) ? (modelsJson as LiveModelRecord[]) : [];

export const ALL_MODELS: CatalogModel[] = rawRecords
  .map(normalizeRecord)
  .sort((a, b) => {
    if (a.rank !== null && b.rank !== null) return a.rank - b.rank;
    if (a.rank !== null) return -1;
    if (b.rank !== null) return 1;
    return a.name.localeCompare(b.name);
  });

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
