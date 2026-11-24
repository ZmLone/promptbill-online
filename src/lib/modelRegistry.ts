import modelsJson from '../data/models.json';
import { ALL_MODELS } from './catalog';
import { type LiveModelRecord } from './liveRegistryBridge';

export interface RegistrySnapshot {
  version: string;
  generatedMonthYear: string;
  lastModifiedIso: string | null;
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
  version: '2026.11-stage1',
  generatedMonthYear: 'November 2026',
  lastModifiedIso: null,
  changelog: [
    {
      date: 'November 2026',
      title: 'Separated official API pricing from third-party router rates and removed synthetic fallbacks',
      impact: 'Missing or unverified metrics are marked Estimated or Unavailable rather than guessed',
      modelSlug: 'deepseek-v4-1-flash',
    },
  ],
  legacyUpgrades: {
    'gpt-6-astra': {
      status: 'Archived / Legacy Model',
      successorSlug: 'gpt-6-2-astra',
      successorName: 'GPT-6.2 Astra',
      summary: 'Prior entry in catalog; verify current model availability with OpenAI.',
    },
    'claude-fable-5-1': {
      status: 'Archived / Legacy Model',
      successorSlug: 'claude-fable-5-2',
      successorName: 'Claude Fable 5.2',
      summary: 'Prior entry in catalog; verify current model availability with Anthropic.',
    },
  },
};

export function getPricingModels(): LiveModelRecord[] {
  return Array.isArray(modelsJson) ? (modelsJson as LiveModelRecord[]) : [];
}

export function computeDerivedMetrics(
  score: number | null,
  inputPer1M: number | null,
  outputPer1M: number | null,
  tokPerSec: number | null
) {
  const blendedPricePer1M =
    inputPer1M !== null && outputPer1M !== null
      ? Number(((inputPer1M + outputPer1M) / 2).toFixed(4))
      : null;
  const valueRatio =
    score !== null && outputPer1M !== null && outputPer1M > 0
      ? Number((score / outputPer1M).toFixed(2))
      : null;
  const speedValueRatio =
    tokPerSec !== null && outputPer1M !== null && outputPer1M > 0
      ? Number((tokPerSec / outputPer1M).toFixed(2))
      : null;
  return {
    blendedPricePer1M,
    valueRatio,
    speedValueRatio,
  };
}

export function buildDynamicSeoCopy(monthYear = REGISTRY_SNAPSHOT.generatedMonthYear) {
  const withScoreAndPrice = ALL_MODELS.filter(
    (m): m is typeof m & { score: number; outputPer1M: number; inputPer1M: number } =>
      typeof m.score === 'number' && typeof m.outputPer1M === 'number' && typeof m.inputPer1M === 'number'
  );
  const topScore = [...withScoreAndPrice].sort((a, b) => b.score - a.score)[0];
  const topValue = [...withScoreAndPrice]
    .filter((m) => m.outputPer1M > 0)
    .sort((a, b) => b.score / b.outputPer1M - a.score / a.outputPer1M)[0];
  const withSpeed = ALL_MODELS.filter(
    (m): m is typeof m & { tokPerSec: number; inputPer1M: number; outputPer1M: number } =>
      typeof m.tokPerSec === 'number' && typeof m.inputPer1M === 'number' && typeof m.outputPer1M === 'number'
  );
  const fastestModel = [...withSpeed].sort((a, b) => b.tokPerSec - a.tokPerSec)[0];

  return {
    monthYear,
    codingLeaderLine: topScore
      ? `Highest listed score (${monthYear}, Estimated): ${topScore.name} (Score ${topScore.score.toFixed(1)}) at $${topScore.inputPer1M.toFixed(2)}/$${topScore.outputPer1M.toFixed(2)} per 1M tokens.`
      : `Model benchmark scores for ${monthYear} are listed per model where available.`,
    valueLeaderLine: topValue
      ? `Highest listed Score/$ ratio (Estimated): ${topValue.name} (${(topValue.score / topValue.outputPer1M).toFixed(1)} Score/$) at $${topValue.inputPer1M.toFixed(2)}/$${topValue.outputPer1M.toFixed(2)} per 1M tokens.`
      : `Cost-per-score ratios are computed only where both score and output price are available.`,
    speedLeaderLine: fastestModel
      ? `Highest listed throughput (Estimated): ${fastestModel.name} at ${fastestModel.tokPerSec} tok/s ($${fastestModel.inputPer1M.toFixed(2)}/$${fastestModel.outputPer1M.toFixed(2)} per 1M tokens).`
      : `Output speed measurements are shown where available.`,
  };
}
