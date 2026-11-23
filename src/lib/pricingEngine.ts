export interface HostingEndpoint {
  host: string;
  providerType: 'Official API' | 'Router' | 'Inference Cloud';
  inputPer1M: number;
  cachedInputPer1M: number;
  cacheWritePer1M: number;
  outputPer1M: number;
  batchDiscount: number;
  latencyMs?: number;
  notes?: string;
}

export interface LLMModel {
  id: string;
  name: string;
  provider: string;
  family: string;
  inputPer1M: number;
  cachedInputPer1M: number;
  cacheWritePer1M?: number;
  outputPer1M: number;
  batchDiscount: number;
  longContextMultiplierInput: number;
  longContextMultiplierOutput: number;
  longContextThresholdTokens: number;
  contextWindow: string;
  qualityScore: number;
  speedTokensPerSec: number;
  tier: string;
  notes: string;
  hostingEndpoints?: HostingEndpoint[];
}

export type InputUnitMode = 'tokens' | 'words' | 'characters';

export interface CostInputs {
  inputTokensPerCall: number;
  outputTokensPerCall: number;
  reasoningTokensPerCall: number;
  callsPerDay: number;
  cacheHitPercent: number;
  cacheWriteSharePercent?: number;
  batchPercent: number;
  retriesPercent: number;
}

export interface CostBreakdown {
  monthlyCalls: number;
  effectiveCallsWithRetries: number;
  effectiveInputRatePer1M: number;
  effectiveOutputRatePer1M: number;
  monthlyInputCost: number;
  monthlyOutputCost: number;
  monthlyReasoningCost: number;
  monthlyRetryOverheadCost: number;
  monthlyTotalCost: number;
  costPerRequest: number;
  costPer1KCalls: number;
  valueScore: number;
  exceedsContextWindow: boolean;
  triggersLongContextMultiplier: boolean;
  activeContextTierLabel: string;
  cacheWriteRatePer1M: number;
  cacheReadRatePer1M: number;
  batchDiscountRate: number;
}

export function unitValueToTokens(value: number, unit: InputUnitMode): number {
  const safe = Math.max(0, value);
  if (unit === 'words') return Math.round(safe * 1.3333);
  if (unit === 'characters') return Math.round(safe / 4);
  return Math.round(safe);
}

export function tokensToUnitValue(tokens: number, unit: InputUnitMode): number {
  const safe = Math.max(0, tokens);
  if (unit === 'words') return Math.round(safe * 0.75);
  if (unit === 'characters') return Math.round(safe * 4);
  return Math.round(safe);
}

export function estimatePromptTokensFromText(text: string, provider: string): number {
  if (!text) return 0;
  const charCount = text.length;
  const divisor = provider === 'Anthropic' ? 3.7 : provider === 'Google Gemini' ? 3.8 : 4.0;
  return Math.max(1, Math.ceil(charCount / divisor));
}

export function parseContextTokens(contextWindow: string): number {
  const cleaned = contextWindow.trim().toUpperCase();
  if (cleaned.endsWith('M')) {
    return parseFloat(cleaned.replace('M', '')) * 1_000_000;
  }
  if (cleaned.endsWith('K')) {
    return parseFloat(cleaned.replace('K', '')) * 1_000;
  }
  return parseFloat(cleaned) || 128_000;
}

export function formatTokenThreshold(tokens: number): string {
  if (tokens >= 1_000_000) {
    const m = tokens / 1_000_000;
    return `${Number.isInteger(m) ? m : m.toFixed(2)}M`;
  }
  const k = Math.round(tokens / 1_000);
  return `${k}K`;
}

export function calculateModelCost(model: LLMModel, inputs: CostInputs): CostBreakdown {
  const monthlyCalls = Math.max(0, inputs.callsPerDay) * 30;
  const retryFactor = 1 + Math.max(0, inputs.retriesPercent) / 100;
  const effectiveCallsWithRetries = monthlyCalls * retryFactor;

  const cacheHitShare = Math.min(1, Math.max(0, inputs.cacheHitPercent / 100));
  const nonCacheShare = 1 - cacheHitShare;

  const rawWriteShare =
    inputs.cacheWriteSharePercent !== undefined
      ? Math.min(1, Math.max(0, inputs.cacheWriteSharePercent / 100))
      : cacheHitShare > 0
      ? 0.25
      : 0;
  const effectiveWriteShare = Math.min(nonCacheShare, nonCacheShare * rawWriteShare);
  const standardUncachedShare = Math.max(0, nonCacheShare - effectiveWriteShare);

  const defaultCacheWriteRate =
    model.cacheWritePer1M !== undefined
      ? model.cacheWritePer1M
      : Number((model.inputPer1M * 1.25).toFixed(4));

  const batchShare = Math.min(1, Math.max(0, inputs.batchPercent / 100));
  const batchMultiplier = 1 - batchShare * model.batchDiscount;

  const isLongContext = inputs.inputTokensPerCall > model.longContextThresholdTokens;
  const hasTieredPricing =
    model.longContextMultiplierInput > 1 || model.longContextMultiplierOutput > 1;
  const triggersLongContextMultiplier = isLongContext && hasTieredPricing;

  const inputContextMult = isLongContext ? model.longContextMultiplierInput : 1;
  const outputContextMult = isLongContext ? model.longContextMultiplierOutput : 1;

  const thresholdLabel = formatTokenThreshold(model.longContextThresholdTokens);
  const activeContextTierLabel = hasTieredPricing
    ? isLongContext
      ? `Long-Context Tier (>${thresholdLabel}: ${inputContextMult}x In / ${outputContextMult}x Out)`
      : `Standard Tier (<= ${thresholdLabel})`
    : `Flat Rate (${model.contextWindow} Window)`;

  const blendedInputRate =
    (standardUncachedShare * model.inputPer1M +
      effectiveWriteShare * defaultCacheWriteRate +
      cacheHitShare * model.cachedInputPer1M) *
    inputContextMult *
    batchMultiplier;

  const blendedOutputRate = model.outputPer1M * outputContextMult * batchMultiplier;

  const totalMonthlyInputTokens = effectiveCallsWithRetries * inputs.inputTokensPerCall;
  const totalMonthlyOutputTokens = effectiveCallsWithRetries * inputs.outputTokensPerCall;
  const totalMonthlyReasoningTokens = effectiveCallsWithRetries * inputs.reasoningTokensPerCall;

  const baseInputCost =
    (monthlyCalls *
      inputs.inputTokensPerCall *
      blendedInputRate) /
    1_000_000;

  const baseOutputCost =
    (monthlyCalls * inputs.outputTokensPerCall * blendedOutputRate) / 1_000_000;

  const baseReasoningCost =
    (monthlyCalls * inputs.reasoningTokensPerCall * blendedOutputRate) / 1_000_000;

  const monthlyInputCost = (totalMonthlyInputTokens * blendedInputRate) / 1_000_000;
  const monthlyOutputCost = (totalMonthlyOutputTokens * blendedOutputRate) / 1_000_000;
  const monthlyReasoningCost = (totalMonthlyReasoningTokens * blendedOutputRate) / 1_000_000;

  const baseTotal = baseInputCost + baseOutputCost + baseReasoningCost;
  const monthlyTotalCost = monthlyInputCost + monthlyOutputCost + monthlyReasoningCost;
  const monthlyRetryOverheadCost = Math.max(0, monthlyTotalCost - baseTotal);

  const costPerRequest = monthlyCalls > 0 ? monthlyTotalCost / monthlyCalls : 0;
  const costPer1KCalls = costPerRequest * 1000;

  const valueScore =
    model.outputPer1M > 0 ? Number((model.qualityScore / model.outputPer1M).toFixed(1)) : model.qualityScore;

  const maxTokens = parseContextTokens(model.contextWindow);
  const exceedsContextWindow = inputs.inputTokensPerCall + inputs.outputTokensPerCall > maxTokens;

  return {
    monthlyCalls,
    effectiveCallsWithRetries,
    effectiveInputRatePer1M: blendedInputRate,
    effectiveOutputRatePer1M: blendedOutputRate,
    monthlyInputCost: baseInputCost,
    monthlyOutputCost: baseOutputCost,
    monthlyReasoningCost: baseReasoningCost,
    monthlyRetryOverheadCost,
    monthlyTotalCost,
    costPerRequest,
    costPer1KCalls,
    valueScore,
    exceedsContextWindow,
    triggersLongContextMultiplier,
    activeContextTierLabel,
    cacheWriteRatePer1M: Number((defaultCacheWriteRate * inputContextMult * batchMultiplier).toFixed(4)),
    cacheReadRatePer1M: Number((model.cachedInputPer1M * inputContextMult * batchMultiplier).toFixed(4)),
    batchDiscountRate: model.batchDiscount,
  };
}

export function formatCurrency(amount: number): string {
  if (amount === 0) return '$0.00';
  if (amount < 0.01) return `$${amount.toFixed(4)}`;
  if (amount < 100) return `$${amount.toFixed(2)}`;
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
