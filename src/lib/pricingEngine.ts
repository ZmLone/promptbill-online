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

export type InputUnitMode = 'tokens' | 'words' | 'characters';

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
  costPerRequest: number;
  costPer1KCalls: number;
  valueScore: number;
  exceedsContextWindow: boolean;
  triggersLongContextMultiplier: boolean;
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
  // Claude & Gemini average ~3.7-3.8 chars/token on mixed English/code; GPT/OpenAI averages ~4.0 chars/token
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

export function calculateModelCost(model: LLMModel, inputs: CostInputs): CostBreakdown {
  const monthlyCalls = Math.max(0, inputs.callsPerDay) * 30;
  const retryFactor = 1 + Math.max(0, inputs.retriesPercent) / 100;
  const effectiveCallsWithRetries = monthlyCalls * retryFactor;

  const cacheShare = Math.min(1, Math.max(0, inputs.cacheHitPercent / 100));
  const batchShare = Math.min(1, Math.max(0, inputs.batchPercent / 100));
  const batchMultiplier = 1 - batchShare * model.batchDiscount;

  const triggersLongContextMultiplier =
    inputs.inputTokensPerCall > model.longContextThresholdTokens &&
    (model.longContextMultiplierInput > 1 || model.longContextMultiplierOutput > 1);

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

  const costPerRequest = monthlyCalls > 0 ? monthlyTotalCost / monthlyCalls : 0;
  const costPer1KCalls = costPerRequest * 1000;

  // Score/$ ratio aligned with BenchLM / CostGoat methodology (quality score divided by output $/1M)
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
  };
}

export function formatCurrency(amount: number): string {
  if (amount === 0) return '$0.00';
  if (amount < 0.01) return `$${amount.toFixed(4)}`;
  if (amount < 100) return `$${amount.toFixed(2)}`;
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
