export interface LLMModel {
  id: string;
  name: string;
  provider: string;
  family: string;
  inputPer1M: number;
  cachedInputPer1M: number;
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
}

export interface CostInputs {
  inputTokensPerCall: number;
  outputTokensPerCall: number;
  reasoningTokensPerCall: number;
  callsPerDay: number;
  cacheHitPercent: number;
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
  costPer1KCalls: number;
  valueScore: number;
  exceedsContextWindow: boolean;
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

export function calculateModelCost(model: LLMModel, inputs: CostInputs): CostBreakdown {
  const monthlyCalls = Math.max(0, inputs.callsPerDay) * 30;
  const retryFactor = 1 + Math.max(0, inputs.retriesPercent) / 100;
  const effectiveCallsWithRetries = monthlyCalls * retryFactor;

  const cacheShare = Math.min(1, Math.max(0, inputs.cacheHitPercent / 100));
  const batchShare = Math.min(1, Math.max(0, inputs.batchPercent / 100));
  const batchMultiplier = 1 - batchShare * model.batchDiscount;

  const isLongContext = inputs.inputTokensPerCall > model.longContextThresholdTokens;
  const inputContextMult = isLongContext ? model.longContextMultiplierInput : 1;
  const outputContextMult = isLongContext ? model.longContextMultiplierOutput : 1;

  const blendedInputRate =
    ((1 - cacheShare) * model.inputPer1M + cacheShare * model.cachedInputPer1M) *
    inputContextMult *
    batchMultiplier;

  const blendedOutputRate = model.outputPer1M * outputContextMult * batchMultiplier;

  const totalMonthlyInputTokens = effectiveCallsWithRetries * inputs.inputTokensPerCall;
  const totalMonthlyOutputTokens = effectiveCallsWithRetries * inputs.outputTokensPerCall;
  const totalMonthlyReasoningTokens = effectiveCallsWithRetries * inputs.reasoningTokensPerCall;

  const baseInputCost =
    (monthlyCalls *
      inputs.inputTokensPerCall *
      ((1 - cacheShare) * model.inputPer1M + cacheShare * model.cachedInputPer1M) *
      inputContextMult *
      batchMultiplier) /
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

  const costPer1KCalls = monthlyCalls > 0 ? (monthlyTotalCost / monthlyCalls) * 1000 : 0;
  const valueScore =
    monthlyTotalCost > 0
      ? Number((model.qualityScore / Math.max(monthlyTotalCost, 0.01)).toFixed(2))
      : model.qualityScore;

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
    costPer1KCalls,
    valueScore,
    exceedsContextWindow,
  };
}

export function formatCurrency(amount: number): string {
  if (amount === 0) return '$0.00';
  if (amount < 0.01) return `$${amount.toFixed(4)}`;
  if (amount < 100) return `$${amount.toFixed(2)}`;
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
