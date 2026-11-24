import modelsJson from '../data/models.json';

export type ProvenanceStatus = 'Verified' | 'Estimated' | 'Unavailable';

export interface FieldProvenance {
  status: ProvenanceStatus;
  sourceUrl: string | null;
  lastVerified: string | null;
  currency?: string | null;
  pricingUnit?: string | null;
  hardwareOrProvider?: string | null;
  conditions?: string | null;
  notes?: string | null;
}

export interface LivePriceHistoryEntry {
  date: string;
  inputPer1M: number;
  outputPer1M: number;
  note?: string;
  sourceUrl?: string | null;
}

export interface LiveHostingEndpoint {
  host: string;
  providerType?: 'Official API' | 'Router' | 'Inference Cloud' | string;
  inputPer1M: number;
  cachedInputPer1M?: number | null;
  cacheWritePer1M?: number | null;
  outputPer1M: number;
  batchDiscount?: number | null;
  latencyMs?: number | null;
  notes?: string | null;
  currency?: string;
  pricingUnit?: string;
  sourceUrl?: string | null;
  lastVerified?: string | null;
  evidenceStatus?: ProvenanceStatus | string;
}

export interface LiveModelRecord {
  id: string;
  slug?: string;
  rank?: number | null;
  name: string;
  provider?: string;
  providerSlug?: string;
  family?: string | null;
  license?: 'Open' | 'Closed' | string | null;
  evidence?: ProvenanceStatus | string | null;
  score?: number | null;
  qualityScore?: number | null;
  interval?: string | null;
  elo?: number | null;
  inputPer1M?: number | null;
  cachedInputPer1M?: number | null;
  cacheWritePer1M?: number | null;
  outputPer1M?: number | null;
  longContextMultiplierInput?: number | null;
  longContextMultiplierOutput?: number | null;
  longContextThresholdTokens?: number | null;
  contextWindow?: string | null;
  maxOutputTokens?: string | null;
  tokPerSec?: number | null;
  speedTokensPerSec?: number | null;
  ag?: number | null;
  co?: number | null;
  re?: number | null;
  mm?: number | null;
  kn?: number | null;
  ml?: number | null;
  if?: number | null;
  ma?: number | null;
  rpmLimit?: string | null;
  tpmLimit?: string | null;
  tpdLimit?: string | null;
  batchDiscount?: number | null;
  tier?: string | null;
  bestFor?: string | null;
  notes?: string | null;
  pricingProvenance?: FieldProvenance;
  benchmarkProvenance?: FieldProvenance;
  speedProvenance?: FieldProvenance;
  priceHistory?: LivePriceHistoryEntry[];
  hostingEndpoints?: LiveHostingEndpoint[];
}

export interface PriceableModelShape {
  id?: string;
  slug?: string;
  name?: string;
  inputPer1M: number | null;
  outputPer1M: number | null;
  cachedInputPer1M?: number | null;
  cacheWritePer1M?: number | null;
  batchDiscount?: number | null;
  rank?: number | null;
  score?: number | null;
  elo?: number | null;
  tokPerSec?: number | null;
  contextWindow?: string | null;
  evidence?: ProvenanceStatus | string | null;
  priceHistory?: Array<{
    date: string;
    inputPer1M: number;
    outputPer1M: number;
    note: string;
    sourceUrl?: string | null;
  }>;
}

const LIVE_RECORDS = Array.isArray(modelsJson) ? (modelsJson as LiveModelRecord[]) : [];

function normalizeSlugLike(val: string | undefined | null): string {
  return String(val || '')
    .toLowerCase()
    .replace(/^[^/]+\//, '')
    .replace(/[._\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const LIVE_BY_KEY = new Map<string, LiveModelRecord>();
for (const rec of LIVE_RECORDS) {
  for (const key of [
    rec.id,
    rec.slug,
    rec.name,
    normalizeSlugLike(rec.id),
    normalizeSlugLike(rec.slug),
    normalizeSlugLike(rec.name),
  ]) {
    const k = String(key || '').toLowerCase().trim();
    if (k && !LIVE_BY_KEY.has(k)) {
      LIVE_BY_KEY.set(k, rec);
    }
  }
}

export function findLiveRecord(model: { id?: string; slug?: string; name?: string }): LiveModelRecord | undefined {
  const candidates = [
    model.id,
    model.slug,
    model.name,
    normalizeSlugLike(model.id),
    normalizeSlugLike(model.slug),
    normalizeSlugLike(model.name),
  ];
  for (const c of candidates) {
    const k = String(c || '').toLowerCase().trim();
    if (k && LIVE_BY_KEY.has(k)) {
      return LIVE_BY_KEY.get(k);
    }
  }
  return undefined;
}

function validNumberOrUndefined(val: unknown): number | null | undefined {
  if (val === undefined) return undefined;
  if (val === null) return null;
  if (typeof val === 'number' && Number.isFinite(val) && val >= 0) return val;
  return undefined;
}

export function applyLiveRegistryPricing<T extends PriceableModelShape>(model: T): T {
  const live = findLiveRecord(model);
  if (!live) return model;

  const officialEp = Array.isArray(live.hostingEndpoints)
    ? live.hostingEndpoints.find((ep) => ep && ep.providerType === 'Official API')
    : undefined;

  const resolvedIn =
    validNumberOrUndefined(officialEp?.inputPer1M) ??
    validNumberOrUndefined(live.inputPer1M) ??
    model.inputPer1M;
  const resolvedOut =
    validNumberOrUndefined(officialEp?.outputPer1M) ??
    validNumberOrUndefined(live.outputPer1M) ??
    model.outputPer1M;
  const resolvedCached =
    validNumberOrUndefined(officialEp?.cachedInputPer1M) ??
    validNumberOrUndefined(live.cachedInputPer1M) ??
    model.cachedInputPer1M ??
    null;
  const resolvedCacheWrite =
    validNumberOrUndefined(officialEp?.cacheWritePer1M) ??
    validNumberOrUndefined(live.cacheWritePer1M) ??
    model.cacheWritePer1M ??
    null;
  const resolvedBatch =
    validNumberOrUndefined(officialEp?.batchDiscount) ??
    validNumberOrUndefined(live.batchDiscount) ??
    model.batchDiscount ??
    null;

  const resolvedScore =
    validNumberOrUndefined(live.score) ??
    validNumberOrUndefined(live.qualityScore) ??
    model.score ??
    null;
  const resolvedSpeed =
    validNumberOrUndefined(live.tokPerSec) ??
    validNumberOrUndefined(live.speedTokensPerSec) ??
    model.tokPerSec ??
    null;

  return {
    ...model,
    inputPer1M: resolvedIn,
    outputPer1M: resolvedOut,
    cachedInputPer1M: resolvedCached,
    cacheWritePer1M: resolvedCacheWrite,
    batchDiscount: resolvedBatch,
    ...(live.rank !== undefined ? { rank: validNumberOrUndefined(live.rank) ?? null } : {}),
    score: resolvedScore,
    ...(live.elo !== undefined ? { elo: validNumberOrUndefined(live.elo) ?? null } : {}),
    tokPerSec: resolvedSpeed,
    ...(live.contextWindow !== undefined ? { contextWindow: live.contextWindow } : {}),
    ...(live.evidence ? { evidence: live.evidence } : {}),
    ...(Array.isArray(live.priceHistory)
      ? {
          priceHistory: live.priceHistory
            .filter((h) => h && typeof h.date === 'string' && typeof h.inputPer1M === 'number' && typeof h.outputPer1M === 'number')
            .map((h) => ({
              date: h.date,
              inputPer1M: h.inputPer1M,
              outputPer1M: h.outputPer1M,
              note: h.note || 'Recorded price entry',
              sourceUrl: h.sourceUrl ?? null,
            })),
        }
      : {}),
  };
}

export function getAllLiveRegistryRecords(): LiveModelRecord[] {
  return LIVE_RECORDS;
}
