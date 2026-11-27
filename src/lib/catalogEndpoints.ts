export type EndpointProviderType = 'Official API' | 'Router' | 'Inference Cloud';
export type EndpointEvidenceStatus = 'Verified' | 'Estimated' | 'Unavailable';

export interface HostingEndpoint {
  host: string;
  providerType: EndpointProviderType;
  inputPer1M: number | null;
  cachedInputPer1M: number | null;
  cacheWritePer1M: number | null;
  outputPer1M: number | null;
  batchDiscount: number | null;
  tokPerSec?: number | null;
  latencyMs?: number | null;
  notes?: string | null;
  currency?: string;
  pricingUnit?: string;
  sourceUrl?: string | null;
  lastVerified?: string | null;
  evidenceStatus?: EndpointEvidenceStatus;
}

export interface EditableEndpointFormRow {
  host: string;
  providerType: EndpointProviderType;
  inputPer1M: string;
  outputPer1M: string;
  cachedInputPer1M: string;
  cacheWritePer1M: string;
  batchDiscount: string;
  latencyMs: string;
  tokPerSec: string;
  notes: string;
  sourceUrl: string;
  evidenceStatus: EndpointEvidenceStatus;
}

export function normalizeEndpointForSave(
  row: EditableEndpointFormRow,
  nowIso: string,
  fallbackStatus: 'Verified' | 'Estimated' = 'Verified'
): HostingEndpoint | null {
  const host = row.host.trim();
  if (!host) return null;

  const parseNum = (raw: string): number | null => {
    const t = raw.trim();
    if (!t) return null;
    const n = Number(t.replace(/[$,]/g, ''));
    return Number.isFinite(n) && n >= 0 ? n : null;
  };

  const parseDiscount = (raw: string): number | null => {
    const n = parseNum(raw.replace(/%/g, ''));
    if (n === null) return null;
    return n > 1 ? Number((n / 100).toFixed(4)) : Number(n.toFixed(4));
  };

  const status: EndpointEvidenceStatus =
    row.evidenceStatus === 'Verified' ||
    row.evidenceStatus === 'Estimated' ||
    row.evidenceStatus === 'Unavailable'
      ? row.evidenceStatus
      : fallbackStatus;

  return {
    host,
    providerType: row.providerType || 'Inference Cloud',
    inputPer1M: parseNum(row.inputPer1M),
    outputPer1M: parseNum(row.outputPer1M),
    cachedInputPer1M: parseNum(row.cachedInputPer1M),
    cacheWritePer1M: parseNum(row.cacheWritePer1M),
    batchDiscount: parseDiscount(row.batchDiscount),
    latencyMs: parseNum(row.latencyMs),
    tokPerSec: parseNum(row.tokPerSec),
    notes: row.notes.trim() || null,
    currency: 'USD',
    pricingUnit: 'per 1M tokens',
    sourceUrl: row.sourceUrl.trim() || null,
    lastVerified: nowIso,
    evidenceStatus: status,
  };
}
