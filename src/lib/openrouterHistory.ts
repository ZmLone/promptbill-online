import type { CatalogModel } from './catalog';

export type PriceMetricKey = 'input' | 'output';

export interface PricePoint {
  date: string; // YYYY-MM-DD
  inputPer1M: number;
  outputPer1M: number;
  source: 'openrouter-live' | 'catalog' | 'archive';
}

export interface StoredModelHistory {
  id: string;
  slug: string;
  name: string;
  provider: string;
  points: PricePoint[];
}

export interface ModelHistoryRecord {
  id: string;
  slug: string;
  name: string;
  provider: string;
  color: string;
  points: PricePoint[];
  startPrice: number;
  currentPrice: number;
  pctChange: number;
  lastUpdated: string;
  changeCount: number;
}

export interface OpenRouterRawModel {
  id: string;
  name?: string;
  created?: number;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
}

export const REDIS_HISTORY_KEY = 'promptbill:openrouter:history:v1';
export const REDIS_META_KEY = 'promptbill:openrouter:history:meta:v1';

const PALETTE = [
  '#e11d48',
  '#2563eb',
  '#059669',
  '#d97706',
  '#7c3aed',
  '#0891b2',
  '#db2777',
  '#4f46e5',
  '#0d9488',
  '#ea580c',
  '#65a30d',
  '#0284c7',
];

const PROVIDER_DISPLAY: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
  deepseek: 'DeepSeek',
  mistralai: 'Mistral',
  'meta-llama': 'Meta',
  qwen: 'Qwen',
  'x-ai': 'xAI',
  cohere: 'Cohere',
  perplexity: 'Perplexity',
  amazon: 'Amazon',
  nvidia: 'NVIDIA',
  'z-ai': 'Z.ai',
  moonshotai: 'Moonshot AI',
  minimax: 'MiniMax',
};

export function formatProviderName(rawPrefix: string): string {
  const key = rawPrefix.trim().toLowerCase();
  if (PROVIDER_DISPLAY[key]) return PROVIDER_DISPLAY[key];
  return key
    .split('-')
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : ''))
    .join(' ');
}

function roundRate(val: number): number {
  return Math.round(val * 10000) / 10000;
}

/**
 * Fetches live model pricing from OpenRouter's public catalog endpoint.
 * Excludes dynamic routers (-1 sentinel) and $0 :free variants.
 */
export async function fetchOpenRouterLiveModels(): Promise<
  Array<{
    id: string;
    slug: string;
    name: string;
    provider: string;
    createdDate: string;
    inputPer1M: number;
    outputPer1M: number;
  }>
> {
  const res = await fetch('https://openrouter.ai/api/v1/models', {
    headers: { Accept: 'application/json' },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`OpenRouter API returned HTTP ${res.status}`);
  }

  const payload = (await res.json()) as { data?: OpenRouterRawModel[] };
  const rawList = Array.isArray(payload.data) ? payload.data : [];
  const results: Array<{
    id: string;
    slug: string;
    name: string;
    provider: string;
    createdDate: string;
    inputPer1M: number;
    outputPer1M: number;
  }> = [];

  for (const item of rawList) {
    if (!item?.id || !item.pricing) continue;
    if (item.id.endsWith(':free')) continue;

    const promptPerTok = Number(item.pricing.prompt);
    const completionPerTok = Number(item.pricing.completion);

    if (
      !Number.isFinite(promptPerTok) ||
      !Number.isFinite(completionPerTok) ||
      promptPerTok <= 0 ||
      completionPerTok < 0
    ) {
      continue;
    }

    const slashIdx = item.id.indexOf('/');
    const rawPrefix = slashIdx > 0 ? item.id.slice(0, slashIdx) : 'other';
    const rawModelSlug = slashIdx > 0 ? item.id.slice(slashIdx + 1) : item.id;
    const provider = formatProviderName(rawPrefix);

    const cleanName = (item.name || rawModelSlug)
      .replace(/^[^:]+:\s*/, '')
      .trim();

    const createdDate =
      typeof item.created === 'number' && Number.isFinite(item.created) && item.created > 0
        ? new Date(item.created * 1000).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);

    results.push({
      id: item.id,
      slug: rawModelSlug.toLowerCase().replace(/[^a-z0-9.-]+/g, '-'),
      name: cleanName,
      provider,
      createdDate,
      inputPer1M: roundRate(promptPerTok * 1_000_000),
      outputPer1M: roundRate(completionPerTok * 1_000_000),
    });
  }

  return results;
}

/**
 * Merges live OpenRouter models with stored Redis change history.
 * Whenever a model's input or output price differs from its last recorded point,
 * a new dated snapshot is appended automatically.
 */
export function mergeLiveWithStoredHistory(
  storedMap: Record<string, StoredModelHistory>,
  liveModels: Array<{
    id: string;
    slug: string;
    name: string;
    provider: string;
    createdDate: string;
    inputPer1M: number;
    outputPer1M: number;
  }>,
  todayIso: string
): {
  updatedMap: Record<string, StoredModelHistory>;
  changesDetected: number;
  newModelsAdded: number;
} {
  const updatedMap: Record<string, StoredModelHistory> = { ...storedMap };
  let changesDetected = 0;
  let newModelsAdded = 0;

  for (const live of liveModels) {
    const existing = updatedMap[live.id];

    if (!existing || !Array.isArray(existing.points) || existing.points.length === 0) {
      const initialPoints: PricePoint[] = [];
      if (live.createdDate && live.createdDate < todayIso) {
        initialPoints.push({
          date: live.createdDate,
          inputPer1M: live.inputPer1M,
          outputPer1M: live.outputPer1M,
          source: 'openrouter-live',
        });
      }
      initialPoints.push({
        date: todayIso,
        inputPer1M: live.inputPer1M,
        outputPer1M: live.outputPer1M,
        source: 'openrouter-live',
      });

      updatedMap[live.id] = {
        id: live.id,
        slug: live.slug,
        name: live.name,
        provider: live.provider,
        points: initialPoints,
      };
      newModelsAdded += 1;
      continue;
    }

    const points = [...existing.points];
    const lastPt = points[points.length - 1];
    const priceChanged =
      Math.abs(lastPt.inputPer1M - live.inputPer1M) > 0.0001 ||
      Math.abs(lastPt.outputPer1M - live.outputPer1M) > 0.0001;

    if (priceChanged) {
      if (lastPt.date === todayIso) {
        points[points.length - 1] = {
          date: todayIso,
          inputPer1M: live.inputPer1M,
          outputPer1M: live.outputPer1M,
          source: 'openrouter-live',
        };
      } else {
        points.push({
          date: todayIso,
          inputPer1M: live.inputPer1M,
          outputPer1M: live.outputPer1M,
          source: 'openrouter-live',
        });
      }
      changesDetected += 1;
    }

    updatedMap[live.id] = {
      id: live.id,
      slug: live.slug,
      name: live.name,
      provider: live.provider,
      points: points.slice(-365),
    };
  }

  return { updatedMap, changesDetected, newModelsAdded };
}

export function toModelHistoryRecords(
  storedMap: Record<string, StoredModelHistory>,
  fallbackCatalog: CatalogModel[]
): ModelHistoryRecord[] {
  const entries = Object.values(storedMap);

  if (entries.length > 0) {
    return entries
      .filter((item) => Array.isArray(item.points) && item.points.length > 0)
      .map((item, idx): ModelHistoryRecord => {
        const sortedPts = [...item.points].sort((a, b) => a.date.localeCompare(b.date));
        const first = sortedPts[0];
        const last = sortedPts[sortedPts.length - 1];
        const pctChange =
          first.inputPer1M > 0
            ? ((last.inputPer1M - first.inputPer1M) / first.inputPer1M) * 100
            : 0;

        let revisions = 0;
        for (let i = 1; i < sortedPts.length; i++) {
          if (
            Math.abs(sortedPts[i].inputPer1M - sortedPts[i - 1].inputPer1M) > 0.0001 ||
            Math.abs(sortedPts[i].outputPer1M - sortedPts[i - 1].outputPer1M) > 0.0001
          ) {
            revisions += 1;
          }
        }

        return {
          id: item.id,
          slug: item.slug,
          name: item.name,
          provider: item.provider,
          color: PALETTE[idx % PALETTE.length],
          points: sortedPts,
          startPrice: first.inputPer1M,
          currentPrice: last.inputPer1M,
          pctChange,
          lastUpdated: last.date,
          changeCount: revisions,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  // Fallback to local catalog if OpenRouter & Redis are both unreachable
  return fallbackCatalog
    .filter(
      (m) =>
        typeof m.inputPer1M === 'number' &&
        Number.isFinite(m.inputPer1M) &&
        m.inputPer1M > 0
    )
    .map((m, idx): ModelHistoryRecord => {
      const verifiedDate = m.pricingProvenance?.lastVerified?.slice(0, 10) ?? '2026-11-28';
      const inRate = m.inputPer1M ?? 0;
      const outRate = m.outputPer1M ?? 0;
      const fallbackPoint: PricePoint = {
        date: verifiedDate,
        inputPer1M: inRate,
        outputPer1M: outRate,
        source: 'catalog',
      };
      return {
        id: m.id,
        slug: m.slug,
        name: m.name,
        provider: m.provider || 'Other',
        color: PALETTE[idx % PALETTE.length],
        points: [fallbackPoint],
        startPrice: inRate,
        currentPrice: inRate,
        pctChange: 0,
        lastUpdated: verifiedDate,
        changeCount: 0,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
