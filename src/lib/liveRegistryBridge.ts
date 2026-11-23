import modelsJson from '../data/models.json';
import type { LLMModel } from './pricingEngine';

export interface LivePriceHistoryEntry {
  date: string;
  inputPer1M: number;
  outputPer1M: number;
  note?: string;
}

export interface LiveModelRecord {
  id: string;
  slug?: string;
  rank?: number;
  name: string;
  provider?: string;
  providerSlug?: string;
  family?: string;
  license?: 'Open' | 'Closed' | string;
  evidence?: 'Supported' | 'Estimated' | string;
  score?: number;
  interval?: string;
  elo?: number;
  inputPer1M: number;
  cachedInputPer1M?: number;
  outputPer1M: number;
  contextWindow?: string;
  maxOutputTokens?: string;
  tokPerSec?: number;
  ag?: number;
  co?: number;
  re?: number;
  mm?: number;
  kn?: number;
  ml?: number;
  if?: number;
  ma?: number;
  rpmLimit?: string;
  tpmLimit?: string;
  tpdLimit?: string;
  batchDiscount?: number;
  bestFor?: string;
  notes?: string;
  priceHistory?: LivePriceHistoryEntry[];
}

const LIVE_RECORDS = modelsJson as LiveModelRecord[];

function normalizeSlugLike(val: string | undefined): string {
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

export function applyLiveRegistryPricing<T extends LLMModel>(model: T): T {
  const live = findLiveRecord(model);
  if (!live) return model;

  const inputPer1M = typeof live.inputPer1M === 'number' ? live.inputPer1M : model.inputPer1M;
  const outputPer1M = typeof live.outputPer1M === 'number' ? live.outputPer1M : model.outputPer1M;
  const cachedInputPer1M =
    typeof live.cachedInputPer1M === 'number'
      ? live.cachedInputPer1M
      : Number((inputPer1M * 0.1).toFixed(4));

  return {
    ...model,
    inputPer1M,
    outputPer1M,
    cachedInputPer1M,
    ...(typeof live.rank === 'number' ? { rank: live.rank } : {}),
    ...(typeof live.score === 'number' ? { score: live.score } : {}),
    ...(typeof live.elo === 'number' ? { elo: live.elo } : {}),
    ...(typeof live.tokPerSec === 'number' ? { tokPerSec: live.tokPerSec } : {}),
    ...(live.contextWindow ? { contextWindow: live.contextWindow } : {}),
    ...(live.evidence === 'Supported' || live.evidence === 'Estimated' ? { evidence: live.evidence } : {}),
    ...(Array.isArray(live.priceHistory) && live.priceHistory.length > 0
      ? {
          priceHistory: live.priceHistory.map((h) => ({
            date: h.date,
            inputPer1M: h.inputPer1M,
            outputPer1M: h.outputPer1M,
            note: h.note || 'Synced from src/data/models.json',
          })),
        }
      : {}),
  };
}

export function getAllLiveRegistryRecords(): LiveModelRecord[] {
  return LIVE_RECORDS;
}
