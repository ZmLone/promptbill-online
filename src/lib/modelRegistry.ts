import modelsJson from '../data/models.json';
import { ALL_MODELS } from './catalog';
import { LLMModel } from './pricingEngine';

export interface RegistrySnapshot {
  version: string;
  generatedMonthYear: string;
  lastModifiedIso: string;
  changelog: {
    date: string;
    title: string;
    impact: string;
    modelSlug?: string;
  }[];
  legacyUpgrades: Record<
    string,
    {
      status: 'Archived / Legacy Model';
      successorSlug: string;
      successorName: string;
      summary: string;
    }
  >;
}

export const REGISTRY_SNAPSHOT: RegistrySnapshot = {
  version: '2026.11.23',
  generatedMonthYear: 'November 2026',
  lastModifiedIso: '2026-11-23T00:00:00.000Z',
  changelog: [
    {
      date: 'Nov 23, 2026',
      title: 'Cache write vs. read & 50% Batch API modeling live on calculator',
      impact: 'Updates effective per-1M input/output rates and 30-day estimates dynamically',
      modelSlug: 'claude-sonnet-5-5',
    },
    {
      date: 'Nov 22, 2026',
      title: 'Multi-host & router pricing matrix expanded across open-weight models',
      impact: 'Compares official APIs against Fireworks, Together, Groq & AWS Bedrock',
      modelSlug: 'deepseek-v4-1-flash',
    },
    {
      date: 'Nov 21, 2026',
      title: 'Long-context tier thresholds (>200K / >272K) integrated into cost engine',
      impact: 'Flags long-context multipliers and max context-window limits automatically',
      modelSlug: 'gemini-4-neon',
    },
  ],
  legacyUpgrades: {
    'gpt-6-astra': {
      status: 'Archived / Legacy Model',
      successorSlug: 'gpt-6-2-astra',
      successorName: 'GPT-6.2 Astra',
      summary: 'Superseded by GPT-6.2 Astra with updated frontier reasoning and 272K+ long-context rules.',
    },
    'claude-fable-5-1': {
      status: 'Archived / Legacy Model',
      successorSlug: 'claude-fable-5-2',
      successorName: 'Claude Fable 5.2',
      summary: 'Superseded by Claude Fable 5.2 with flat 1M context pricing and prompt caching support.',
    },
  },
};

export function getPricingModels(): LLMModel[] {
  return modelsJson as LLMModel[];
}

export function computeDerivedMetrics(
  score: number,
  inputPer1M: number,
  outputPer1M: number,
  tokPerSec: number
) {
  const blendedPricePer1M = Number(((inputPer1M + outputPer1M) / 2).toFixed(2));
  const valueRatio = outputPer1M > 0 ? Number((score / outputPer1M).toFixed(1)) : score;
  const speedValueRatio = outputPer1M > 0 ? Number((tokPerSec / outputPer1M).toFixed(1)) : tokPerSec;
  return {
    blendedPricePer1M,
    valueRatio,
    speedValueRatio,
  };
}

export function buildDynamicSeoCopy(monthYear = REGISTRY_SNAPSHOT.generatedMonthYear) {
  const topCoding = [...ALL_MODELS].sort((a, b) => b.co - a.co || b.score - a.score)[0];
  const topValue = [...ALL_MODELS].sort(
    (a, b) =>
      (b.outputPer1M > 0 ? b.score / b.outputPer1M : b.score) -
      (a.outputPer1M > 0 ? a.score / a.outputPer1M : a.score)
  )[0];
  const fastestModel = [...ALL_MODELS].sort((a, b) => b.tokPerSec - a.tokPerSec)[0];

  return {
    monthYear,
    codingLeaderLine: `Leading in coding (${monthYear}) is ${topCoding.name} (CO ${topCoding.co}, Score ${topCoding.score.toFixed(1)}) at $${topCoding.inputPer1M.toFixed(2)}/$${topCoding.outputPer1M.toFixed(2)} per 1M tokens.`,
    valueLeaderLine: `Top Score/$ value is ${topValue.name} (${(topValue.score / Math.max(0.01, topValue.outputPer1M)).toFixed(1)} Score/$) at $${topValue.inputPer1M.toFixed(2)}/$${topValue.outputPer1M.toFixed(2)} per 1M tokens.`,
    speedLeaderLine: `Fastest output throughput is ${fastestModel.name} at ${fastestModel.tokPerSec} tok/s ($${fastestModel.inputPer1M.toFixed(2)}/$${fastestModel.outputPer1M.toFixed(2)} per 1M tokens).`,
  };
}
