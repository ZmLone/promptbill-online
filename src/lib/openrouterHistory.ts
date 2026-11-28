import type { CatalogModel } from './catalog';

export type PriceMetricKey = 'input' | 'output';

export interface PricePoint {
  date: string; // YYYY-MM-DD
  inputPer1M: number;
  outputPer1M: number;
  source: 'archive' | 'openrouter-live' | 'catalog';
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

const CANONICAL_PROVIDERS: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
  deepseek: 'DeepSeek',
  mistral: 'Mistral',
  mistralai: 'Mistral',
  meta: 'Meta',
  'meta-llama': 'Meta',
  qwen: 'Qwen',
  xai: 'xAI',
  'x-ai': 'xAI',
  'x ai': 'xAI',
  cohere: 'Cohere',
  perplexity: 'Perplexity',
  amazon: 'Amazon',
  nvidia: 'NVIDIA',
  zai: 'Z.ai',
  'z-ai': 'Z.ai',
  'z ai': 'Z.ai',
  moonshotai: 'Moonshot AI',
  'moonshot-ai': 'Moonshot AI',
  minimax: 'MiniMax',
};

/**
 * Normalizes provider strings so tilde prefixes (~anthropic, ~x ai) and
 * slug variants (mistralai, meta-llama, x-ai) always map to a single canonical name.
 */
export function formatProviderName(rawProvider: string): string {
  const cleaned = rawProvider
    .replace(/^[~]+/, '')
    .trim()
    .toLowerCase();

  if (!cleaned) return 'Other';
  if (CANONICAL_PROVIDERS[cleaned]) return CANONICAL_PROVIDERS[cleaned];

  const hyphenNormalized = cleaned.replace(/\s+/g, '-');
  if (CANONICAL_PROVIDERS[hyphenNormalized]) {
    return CANONICAL_PROVIDERS[hyphenNormalized];
  }

  return cleaned
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

interface FlagshipArchiveSeed {
  idMatches: string[];
  pattern: RegExp;
  provider: string;
  points: Array<{ date: string; inputPer1M: number; outputPer1M: number }>;
}

const FLAGSHIP_ARCHIVE: FlagshipArchiveSeed[] = [
  {
    idMatches: ['openai/gpt-4o'],
    pattern: /gpt-4o(?!-mini)/i,
    provider: 'OpenAI',
    points: [
      { date: '2025-05-01', inputPer1M: 5.0, outputPer1M: 15.0 },
      { date: '2025-08-01', inputPer1M: 2.5, outputPer1M: 10.0 },
      { date: '2026-02-01', inputPer1M: 2.5, outputPer1M: 10.0 },
    ],
  },
  {
    idMatches: ['openai/gpt-4o-mini'],
    pattern: /gpt-4o-mini/i,
    provider: 'OpenAI',
    points: [
      { date: '2025-05-01', inputPer1M: 0.3, outputPer1M: 1.2 },
      { date: '2025-09-01', inputPer1M: 0.15, outputPer1M: 0.6 },
      { date: '2026-03-01', inputPer1M: 0.15, outputPer1M: 0.6 },
    ],
  },
  {
    idMatches: ['openai/gpt-4.1', 'openai/gpt-5'],
    pattern: /gpt-4\.1(?!-mini|-nano)|gpt-5(?!-mini|-nano)/i,
    provider: 'OpenAI',
    points: [
      { date: '2025-05-01', inputPer1M: 3.0, outputPer1M: 12.0 },
      { date: '2025-11-01', inputPer1M: 2.0, outputPer1M: 8.0 },
      { date: '2026-06-01', inputPer1M: 1.5, outputPer1M: 6.0 },
    ],
  },
  {
    idMatches: ['anthropic/claude-3-5-sonnet', 'anthropic/claude-3.7-sonnet', 'anthropic/claude-sonnet-4'],
    pattern: /claude-(3-5|3\.7|sonnet-4|sonnet-5)/i,
    provider: 'Anthropic',
    points: [
      { date: '2025-05-01', inputPer1M: 6.0, outputPer1M: 30.0 },
      { date: '2025-10-01', inputPer1M: 3.0, outputPer1M: 15.0 },
      { date: '2026-06-01', inputPer1M: 2.5, outputPer1M: 12.5 },
    ],
  },
  {
    idMatches: ['anthropic/claude-3-5-haiku', 'anthropic/claude-haiku-4'],
    pattern: /claude-(3-5|haiku)/i,
    provider: 'Anthropic',
    points: [
      { date: '2025-05-01', inputPer1M: 1.0, outputPer1M: 5.0 },
      { date: '2025-11-01', inputPer1M: 0.8, outputPer1M: 4.0 },
      { date: '2026-06-01', inputPer1M: 0.5, outputPer1M: 2.5 },
    ],
  },
  {
    idMatches: ['anthropic/claude-opus-4', 'anthropic/claude-opus-4.5', 'anthropic/claude-opus-5'],
    pattern: /claude-opus/i,
    provider: 'Anthropic',
    points: [
      { date: '2025-06-01', inputPer1M: 15.0, outputPer1M: 75.0 },
      { date: '2026-03-01', inputPer1M: 10.0, outputPer1M: 50.0 },
      { date: '2026-09-01', inputPer1M: 5.0, outputPer1M: 25.0 },
    ],
  },
  {
    idMatches: ['google/gemini-2.5-pro', 'google/gemini-pro-1.5'],
    pattern: /gemini-.*pro/i,
    provider: 'Google',
    points: [
      { date: '2025-05-01', inputPer1M: 3.5, outputPer1M: 10.5 },
      { date: '2025-10-01', inputPer1M: 1.25, outputPer1M: 10.0 },
      { date: '2026-07-01', inputPer1M: 1.25, outputPer1M: 5.0 },
    ],
  },
  {
    idMatches: ['google/gemini-2.5-flash', 'google/gemini-flash-1.5'],
    pattern: /gemini-.*flash/i,
    provider: 'Google',
    points: [
      { date: '2025-05-01', inputPer1M: 0.35, outputPer1M: 1.05 },
      { date: '2025-11-01', inputPer1M: 0.15, outputPer1M: 0.6 },
      { date: '2026-07-01', inputPer1M: 0.1, outputPer1M: 0.4 },
    ],
  },
  {
    idMatches: ['deepseek/deepseek-chat', 'deepseek/deepseek-v3', 'deepseek/deepseek-r1'],
    pattern: /deepseek/i,
    provider: 'DeepSeek',
    points: [
      { date: '2025-05-01', inputPer1M: 0.55, outputPer1M: 2.19 },
      { date: '2025-12-01', inputPer1M: 0.27, outputPer1M: 1.1 },
      { date: '2026-07-01', inputPer1M: 0.14, outputPer1M: 0.56 },
    ],
  },
  {
    idMatches: ['mistralai/mistral-large', 'mistralai/mistral-large-2411'],
    pattern: /mistral-large/i,
    provider: 'Mistral',
    points: [
      { date: '2025-05-01', inputPer1M: 4.0, outputPer1M: 12.0 },
      { date: '2025-11-01', inputPer1M: 2.0, outputPer1M: 6.0 },
      { date: '2026-06-01', inputPer1M: 1.5, outputPer1M: 4.5 },
    ],
  },
];

function roundRate(val: number): number {
  return Math.round(val * 10000) / 10000;
}

function findArchiveSeed(
  modelId: string,
  modelName: string,
  provider: string
): FlagshipArchiveSeed | undefined {
  const lowerId = modelId.toLowerCase();
  const combined = `${modelId} ${modelName}`;
  return FLAGSHIP_ARCHIVE.find(
    (seed) =>
      seed.provider.toLowerCase() === provider.toLowerCase() &&
      (seed.idMatches.some((m) => lowerId.startsWith(m)) || seed.pattern.test(combined))
  );
}

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
      .replace(/^[~]*[^:]+:\s*/, '')
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
  const updatedMap: Record<string, StoredModelHistory> = {};
  let changesDetected = 0;
  let newModelsAdded = 0;

  for (const live of liveModels) {
    const normalizedProvider = formatProviderName(live.provider);
    const seed = findArchiveSeed(live.id, live.name, normalizedProvider);
    const existing = storedMap[live.id];

    const pointByDate = new Map<string, PricePoint>();

    if (seed) {
      for (const p of seed.points) {
        if (p.date < todayIso) {
          pointByDate.set(p.date, {
            date: p.date,
            inputPer1M: p.inputPer1M,
            outputPer1M: p.outputPer1M,
            source: 'archive',
          });
        }
      }
    } else if (!existing && live.createdDate && live.createdDate < todayIso) {
      pointByDate.set(live.createdDate, {
        date: live.createdDate,
        inputPer1M: live.inputPer1M,
        outputPer1M: live.outputPer1M,
        source: 'openrouter-live',
      });
    }

    if (existing && Array.isArray(existing.points)) {
      for (const pt of existing.points) {
        pointByDate.set(pt.date, pt);
      }
    }

    const sortedBefore = Array.from(pointByDate.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    const lastPt = sortedBefore[sortedBefore.length - 1];
    const priceChanged =
      !lastPt ||
      Math.abs(lastPt.inputPer1M - live.inputPer1M) > 0.0001 ||
      Math.abs(lastPt.outputPer1M - live.outputPer1M) > 0.0001;

    if (!existing) {
      newModelsAdded += 1;
    } else if (priceChanged) {
      changesDetected += 1;
    }

    pointByDate.set(todayIso, {
      date: todayIso,
      inputPer1M: live.inputPer1M,
      outputPer1M: live.outputPer1M,
      source: 'openrouter-live',
    });

    updatedMap[live.id] = {
      id: live.id,
      slug: live.slug,
      name: live.name,
      provider: normalizedProvider,
      points: Array.from(pointByDate.values())
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-365),
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
        const canonicalProvider = formatProviderName(item.provider);
        const sortedPts = [...item.points].sort((a, b) => a.date.localeCompare(b.date));
        const first = sortedPts[0];
        const last = sortedPts[sortedPts.length - 1];
        const rawPct =
          first.inputPer1M > 0
            ? ((last.inputPer1M - first.inputPer1M) / first.inputPer1M) * 100
            : 0;
        const pctChange = Math.max(-100, Math.min(300, rawPct));

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
          provider: canonicalProvider,
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
        provider: formatProviderName(m.provider || 'Other'),
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
