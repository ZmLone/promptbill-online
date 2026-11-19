import { AIModel } from '@/data/fallbackModels';

export interface WorkloadInput {
  dailyRequests: number;
  avgInputTokens: number;
  avgOutputTokens: number;
  cacheHitRate: number; // 0 to 0.95
  useBatchApi: boolean;
}

export interface CostBreakdown {
  model: AIModel;
  monthlyRequests: number;
  monthlyInputTokens: number;
  monthlyOutputTokens: number;
  costWithoutCache: number;
  finalMonthlyCost: number;
  monthlySavings: number;
  costPer1kRequests: number;
}

export function estimateTokensFromText(text: string): number {
  if (!text.trim()) return 0;
  return Math.ceil(text.length / 4);
}

export function calculateModelCost(
  model: AIModel,
  workload: WorkloadInput
): CostBreakdown {
  const monthlyRequests = workload.dailyRequests * 30;
  const monthlyInputTokens = monthlyRequests * workload.avgInputTokens;
  const monthlyOutputTokens = monthlyRequests * workload.avgOutputTokens;

  const batchMultiplier = workload.useBatchApi ? 1 - model.batchDiscount : 1;

  const rawInputCost =
    (monthlyInputTokens / 1_000_000) * model.inputPer1M * batchMultiplier;
  const outputCost =
    (monthlyOutputTokens / 1_000_000) * model.outputPer1M * batchMultiplier;
  const costWithoutCache = rawInputCost + outputCost;

  const cachedTokens = monthlyInputTokens * workload.cacheHitRate;
  const uncachedTokens = monthlyInputTokens * (1 - workload.cacheHitRate);

  const cachedInputCost =
    (cachedTokens / 1_000_000) * model.cachedInputPer1M * batchMultiplier +
    (uncachedTokens / 1_000_000) * model.inputPer1M * batchMultiplier;

  const finalMonthlyCost = cachedInputCost + outputCost;
  const monthlySavings = Math.max(0, costWithoutCache - finalMonthlyCost);
  const costPer1kRequests =
    monthlyRequests > 0 ? (finalMonthlyCost / monthlyRequests) * 1000 : 0;

  return {
    model,
    monthlyRequests,
    monthlyInputTokens,
    monthlyOutputTokens,
    costWithoutCache,
    finalMonthlyCost,
    monthlySavings,
    costPer1kRequests,
  };
}
