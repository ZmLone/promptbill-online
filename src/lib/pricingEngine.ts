export interface HostingEndpoint {
  host: string;
  providerType?: 'Official API' | 'Router' | 'Inference Cloud' | string;
  inputPer1M: number | null;
  cachedInputPer1M?: number | null;
  cacheWritePer1M?: number | null;
  outputPer1M: number | null;
  batchDiscount?: number | null;
  latencyMs?: number | null;
  notes?: string | null;
  currency?: string | null;
  pricingUnit?: string | null;
  sourceUrl?: string | null;
  lastVerified?: string | null;
  evidenceStatus?: string | null;
}

export interface LLMModel {
  id: string;
  slug?: string;
  name: string;
  provider: string;
  family?: string | null;
  inputPer1M: number | null;
  cachedInputPer1M: number | null;
  cacheWritePer1M?: number | null;
  outputPer1M: number | null;
  batchDiscount?: number | null;
  longContextMultiplierInput?: number | null;
  longContextMultiplierOutput?: number | null;
  longContextThresholdTokens?: number | null;
  contextWindow?: string | null;
  qualityScore?: number | null;
  score?: number | null;
  speedTokensPerSec?: number | null;
  tokPerSec?: number | null;
  tier?: string | null;
  notes?: string | null;
  hostingEndpoints?: HostingEndpoint[];
}

export type InputUnitMode = 'tokens' | 'words' | 'characters';

export interface CostInputs {
  inputTokensPerCall: number;
  outputTokensPerCall: number;
  reasoningTokensPerCall?: number;
  callsPerDay: number;
  cacheHitPercent: number;
  cacheWriteSharePercent?: number;
  batchPercent: number;
  retriesPercent?: number;
}

export interface CostBreakdown {
  hasPricingData: boolean;
  batchSupported: boolean;
  cacheWriteSupported: boolean;
  monthlyCalls: number;
  effectiveCallsWithRetries: number;
  effectiveInputRatePer1M: number | null;
  effectiveOutputRatePer1M: number | null;
  monthlyInputCost: number | null;
  monthlyOutputCost: number | null;
  monthlyReasoningCost: number | null;
  monthlyRetryOverheadCost: number | null;
  monthlyTotalCost: number | null;
  costPerRequest: number | null;
  costPer1KCalls: number | null;
  valueScore: number | null;
  exceedsContextWindow: boolean | null;
  triggersLongContextMultiplier: boolean;
  activeContextTierLabel: string;
  cacheWriteRatePer1M: number | null;
  cacheReadRatePer1M: number | null;
  batchDiscountRate: number;
}

function sanitizeFiniteNonNeg(value: unknown, fallback = 0): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return fallback;
  }
  return value;
}

function nullableFiniteNonNeg(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return null;
  }
  return value;
}

function roundMoney(value: number): number {
  return Math.round(value * 10000) / 10000;
}

export function unitValueToTokens(value: number, unit: InputUnitMode): number {
  const safe = sanitizeFiniteNonNeg(value, 0);
  if (unit === 'words') return Math.round(safe * 1.3333);
  if (unit === 'characters') return Math.round(safe / 4);
  return Math.round(safe);
}

export function tokensToUnitValue(tokens: number, unit: InputUnitMode): number {
  const safe = sanitizeFiniteNonNeg(tokens, 0);
  if (unit === 'words') return Math.round(safe * 0.75);
  if (unit === 'characters') return Math.round(safe * 4);
  return Math.round(safe);
}

export function estimatePromptTokensFromText(text: string, provider: string): number {
  if (!text) return 0;
  const charCount = text.length;
  const divisor =
    provider === 'Anthropic' ? 3.7 : provider === 'Google Gemini' ? 3.8 : 4.0;
  return Math.max(1, Math.ceil(charCount / divisor));
}

export function parseContextTokens(contextWindow: string | null | undefined): number | null {
  if (!contextWindow || typeof contextWindow !== 'string') return null;
  const cleaned = contextWindow.trim().toUpperCase();
  if (!cleaned) return null;
  if (cleaned.endsWith('M')) {
    const parsed = parseFloat(cleaned.slice(0, -1));
    return Number.isFinite(parsed) && parsed > 0 ? parsed * 1_000_000 : null;
  }
  if (cleaned.endsWith('K')) {
    const parsed = parseFloat(cleaned.slice(0, -1));
    return Number.isFinite(parsed) && parsed > 0 ? parsed * 1_000 : null;
  }
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function formatTokenThreshold(tokens: number | null | undefined): string {
  const valid = nullableFiniteNonNeg(tokens);
  if (valid === null || valid <= 0) return 'Not available';
  if (valid >= 1_000_000) {
    const m = valid / 1_000_000;
    return `${Number.isInteger(m) ? m : m.toFixed(2)}M`;
  }
  const k = Math.round(valid / 1_000);
  return `${k}K`;
}

export function calculateModelCost(model: LLMModel, inputs: CostInputs): CostBreakdown {
  const safeInputTokens = sanitizeFiniteNonNeg(inputs.inputTokensPerCall, 0);
  const safeOutputTokens = sanitizeFiniteNonNeg(inputs.outputTokensPerCall, 0);
  const safeReasoningTokens = sanitizeFiniteNonNeg(inputs.reasoningTokensPerCall, 0);
  const safeCallsPerDay = sanitizeFiniteNonNeg(inputs.callsPerDay, 0);
  const safeCacheHitPct = Math.min(100, sanitizeFiniteNonNeg(inputs.cacheHitPercent, 0));
  const safeBatchPct = Math.min(100, sanitizeFiniteNonNeg(inputs.batchPercent, 0));
  const safeRetriesPct = Math.min(100, sanitizeFiniteNonNeg(inputs.retriesPercent, 0));

  const monthlyCalls = safeCallsPerDay * 30;
  const retryFactor = 1 + safeRetriesPct / 100;
  const effectiveCallsWithRetries = monthlyCalls * retryFactor;

  const baseInputRate = nullableFiniteNonNeg(model.inputPer1M);
  const baseOutputRate = nullableFiniteNonNeg(model.outputPer1M);
  const cachedReadRate = nullableFiniteNonNeg(model.cachedInputPer1M);
  const explicitCacheWriteRate = nullableFiniteNonNeg(model.cacheWritePer1M);

  const rawBatchDiscount = nullableFiniteNonNeg(model.batchDiscount);
  const batchDiscountRate =
    rawBatchDiscount !== null && rawBatchDiscount > 0 && rawBatchDiscount <= 1
      ? rawBatchDiscount
      : 0;
  const batchSupported = batchDiscountRate > 0;
  const batchShare = batchSupported ? safeBatchPct / 100 : 0;
  const batchMultiplier = 1 - batchShare * batchDiscountRate;

  const thresholdTokens = nullableFiniteNonNeg(model.longContextThresholdTokens);
  const rawCtxInMult = nullableFiniteNonNeg(model.longContextMultiplierInput);
  const rawCtxOutMult = nullableFiniteNonNeg(model.longContextMultiplierOutput);

  const hasLongContextConfig =
    thresholdTokens !== null &&
    thresholdTokens > 0 &&
    ((rawCtxInMult !== null && rawCtxInMult > 1) ||
      (rawCtxOutMult !== null && rawCtxOutMult > 1));

  const triggersLongContextMultiplier =
    hasLongContextConfig && safeInputTokens > thresholdTokens;

  const inputContextMult =
    triggersLongContextMultiplier && rawCtxInMult !== null && rawCtxInMult > 1
      ? rawCtxInMult
      : 1;
  const outputContextMult =
    triggersLongContextMultiplier && rawCtxOutMult !== null && rawCtxOutMult > 1
      ? rawCtxOutMult
      : 1;

  const activeContextTierLabel = hasLongContextConfig
    ? triggersLongContextMultiplier
      ? `Long-Context Tier (>${formatTokenThreshold(thresholdTokens)}: ${inputContextMult}x In / ${outputContextMult}x Out)`
      : `Standard Tier (<= ${formatTokenThreshold(thresholdTokens)})`
    : 'Single Rate Tier (no verified long-context multiplier)';

  const maxContextTokens = parseContextTokens(model.contextWindow);
  const exceedsContextWindow =
    maxContextTokens !== null
      ? safeInputTokens + safeOutputTokens > maxContextTokens
      : null;

  const cacheHitShare = cachedReadRate !== null ? Math.min(1, safeCacheHitPct / 100) : 0;
  const nonCacheShare = 1 - cacheHitShare;

  const cacheWriteSupported = explicitCacheWriteRate !== null;
  const rawWriteShare =
    inputs.cacheWriteSharePercent !== undefined
      ? Math.min(1, sanitizeFiniteNonNeg(inputs.cacheWriteSharePercent, 0) / 100)
      : 0;
  const effectiveWriteShare = cacheWriteSupported
    ? Math.min(nonCacheShare, nonCacheShare * rawWriteShare)
    : 0;
  const standardUncachedShare = Math.max(0, nonCacheShare - effectiveWriteShare);

  const scoreValue =
    nullableFiniteNonNeg(model.qualityScore) ?? nullableFiniteNonNeg(model.score);
  const valueScore =
    scoreValue !== null && baseOutputRate !== null && baseOutputRate > 0
      ? Number((scoreValue / baseOutputRate).toFixed(2))
      : null;

  if (baseInputRate === null || baseOutputRate === null) {
    return {
      hasPricingData: false,
      batchSupported,
      cacheWriteSupported,
      monthlyCalls,
      effectiveCallsWithRetries,
      effectiveInputRatePer1M: null,
      effectiveOutputRatePer1M: null,
      monthlyInputCost: null,
      monthlyOutputCost: null,
      monthlyReasoningCost: null,
      monthlyRetryOverheadCost: null,
      monthlyTotalCost: null,
      costPerRequest: null,
      costPer1KCalls: null,
      valueScore,
      exceedsContextWindow,
      triggersLongContextMultiplier,
      activeContextTierLabel,
      cacheWriteRatePer1M:
        cacheWriteSupported && explicitCacheWriteRate !== null
          ? roundMoney(explicitCacheWriteRate * inputContextMult * batchMultiplier)
          : null,
      cacheReadRatePer1M:
        cachedReadRate !== null
          ? roundMoney(cachedReadRate * inputContextMult * batchMultiplier)
          : null,
      batchDiscountRate,
    };
  }

  const effectiveInputRatePer1M =
    (standardUncachedShare * baseInputRate +
      effectiveWriteShare * (explicitCacheWriteRate ?? baseInputRate) +
      cacheHitShare * (cachedReadRate ?? baseInputRate)) *
    inputContextMult *
    batchMultiplier;

  const effectiveOutputRatePer1M = baseOutputRate * outputContextMult * batchMultiplier;

  const baseInputCost =
    (monthlyCalls * safeInputTokens * effectiveInputRatePer1M) / 1_000_000;
  const baseOutputCost =
    (monthlyCalls * safeOutputTokens * effectiveOutputRatePer1M) / 1_000_000;
  const baseReasoningCost =
    (monthlyCalls * safeReasoningTokens * effectiveOutputRatePer1M) / 1_000_000;

  const totalInputCost =
    (effectiveCallsWithRetries * safeInputTokens * effectiveInputRatePer1M) / 1_000_000;
  const totalOutputCost =
    (effectiveCallsWithRetries * safeOutputTokens * effectiveOutputRatePer1M) / 1_000_000;
  const totalReasoningCost =
    (effectiveCallsWithRetries * safeReasoningTokens * effectiveOutputRatePer1M) / 1_000_000;

  const baseTotal = baseInputCost + baseOutputCost + baseReasoningCost;
  const monthlyTotalCost = totalInputCost + totalOutputCost + totalReasoningCost;
  const monthlyRetryOverheadCost = Math.max(0, monthlyTotalCost - baseTotal);

  const costPerRequest = monthlyCalls > 0 ? monthlyTotalCost / monthlyCalls : 0;
  const costPer1KCalls = costPerRequest * 1000;

  return {
    hasPricingData: true,
    batchSupported,
    cacheWriteSupported,
    monthlyCalls,
    effectiveCallsWithRetries,
    effectiveInputRatePer1M: roundMoney(effectiveInputRatePer1M),
    effectiveOutputRatePer1M: roundMoney(effectiveOutputRatePer1M),
    monthlyInputCost: roundMoney(baseInputCost),
    monthlyOutputCost: roundMoney(baseOutputCost),
    monthlyReasoningCost: roundMoney(baseReasoningCost),
    monthlyRetryOverheadCost: roundMoney(monthlyRetryOverheadCost),
    monthlyTotalCost: roundMoney(monthlyTotalCost),
    costPerRequest: roundMoney(costPerRequest),
    costPer1KCalls: roundMoney(costPer1KCalls),
    valueScore,
    exceedsContextWindow,
    triggersLongContextMultiplier,
    activeContextTierLabel,
    cacheWriteRatePer1M:
      cacheWriteSupported && explicitCacheWriteRate !== null
        ? roundMoney(explicitCacheWriteRate * inputContextMult * batchMultiplier)
        : null,
    cacheReadRatePer1M:
      cachedReadRate !== null
        ? roundMoney(cachedReadRate * inputContextMult * batchMultiplier)
        : null,
    batchDiscountRate,
  };
}

export function formatCurrency(amount: number | null | undefined): string {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return 'N/A';
  if (amount === 0) return '$0.00';
  if (amount < 0.01) return `$${amount.toFixed(4)}`;
  if (amount < 100) return `$${amount.toFixed(2)}`;
  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
