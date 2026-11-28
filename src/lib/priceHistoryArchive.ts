import type { CatalogModel } from './catalog';

export type PriceMetricKey = 'input' | 'output';

export interface HistoricalPricePoint {
  date: string;
  inputPer1M: number;
  outputPer1M: number;
  source: 'archive' | 'catalog' | 'live-snapshot';
}

export interface ModelHistoryRecord {
  id: string;
  slug: string;
  name: string;
  provider: string;
  color: string;
  points: HistoricalPricePoint[];
  startPrice: number;
  currentPrice: number;
  pctChange: number;
  lastUpdated: string;
}

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

interface ArchivedSeriesSeed {
  matchPattern: RegExp;
  provider: string;
  fallbackName: string;
  fallbackSlug: string;
  history: Array<{ date: string; inputPer1M: number; outputPer1M: number }>;
}

const ARCHIVED_SERIES: ArchivedSeriesSeed[] = [
  {
    matchPattern: /gpt-4o(?!-mini)/i,
    provider: 'OpenAI',
    fallbackName: 'GPT-4o',
    fallbackSlug: 'gpt-4o',
    history: [
      { date: '2025-05-01', inputPer1M: 5.0, outputPer1M: 15.0 },
      { date: '2025-08-01', inputPer1M: 2.5, outputPer1M: 10.0 },
      { date: '2026-02-01', inputPer1M: 2.5, outputPer1M: 10.0 },
    ],
  },
  {
    matchPattern: /gpt-4o-mini/i,
    provider: 'OpenAI',
    fallbackName: 'GPT-4o mini',
    fallbackSlug: 'gpt-4o-mini',
    history: [
      { date: '2025-05-01', inputPer1M: 0.3, outputPer1M: 1.2 },
      { date: '2025-09-01', inputPer1M: 0.15, outputPer1M: 0.6 },
      { date: '2026-03-01', inputPer1M: 0.15, outputPer1M: 0.6 },
    ],
  },
  {
    matchPattern: /gpt-5\.4-nano|gpt-5-4-nano/i,
    provider: 'OpenAI',
    fallbackName: 'GPT-5.4 Nano',
    fallbackSlug: 'gpt-5-4-nano',
    history: [
      { date: '2026-05-01', inputPer1M: 0.4, outputPer1M: 2.0 },
      { date: '2026-08-15', inputPer1M: 0.25, outputPer1M: 1.5 },
      { date: '2026-11-01', inputPer1M: 0.2, outputPer1M: 1.25 },
    ],
  },
  {
    matchPattern: /gpt-6\.1-terra|gpt-6-1-terra/i,
    provider: 'OpenAI',
    fallbackName: 'GPT-6.1 Terra',
    fallbackSlug: 'gpt-6-1-terra',
    history: [
      { date: '2026-07-01', inputPer1M: 2.0, outputPer1M: 8.0 },
      { date: '2026-09-15', inputPer1M: 1.25, outputPer1M: 6.0 },
      { date: '2026-11-15', inputPer1M: 1.0, outputPer1M: 5.0 },
    ],
  },
  {
    matchPattern: /claude-opus-5\.5|claude-opus-5-5/i,
    provider: 'Anthropic',
    fallbackName: 'Claude Opus 5.5',
    fallbackSlug: 'claude-opus-5-5',
    history: [
      { date: '2026-03-01', inputPer1M: 15.0, outputPer1M: 75.0 },
      { date: '2026-07-01', inputPer1M: 6.0, outputPer1M: 30.0 },
      { date: '2026-10-15', inputPer1M: 4.0, outputPer1M: 20.0 },
    ],
  },
  {
    matchPattern: /claude-fable-5\.2|claude-fable-5-2/i,
    provider: 'Anthropic',
    fallbackName: 'Claude Fable 5.2',
    fallbackSlug: 'claude-fable-5-2',
    history: [
      { date: '2026-04-01', inputPer1M: 12.0, outputPer1M: 60.0 },
      { date: '2026-08-01', inputPer1M: 10.0, outputPer1M: 50.0 },
      { date: '2026-11-01', inputPer1M: 8.0, outputPer1M: 40.0 },
    ],
  },
  {
    matchPattern: /claude-sonnet-5\.5|claude-sonnet-5-5|claude-3-5-sonnet|claude-3-7-sonnet/i,
    provider: 'Anthropic',
    fallbackName: 'Claude Sonnet 5.5',
    fallbackSlug: 'claude-sonnet-5-5',
    history: [
      { date: '2025-07-01', inputPer1M: 3.0, outputPer1M: 15.0 },
      { date: '2026-03-01', inputPer1M: 3.0, outputPer1M: 15.0 },
      { date: '2026-09-01', inputPer1M: 2.5, outputPer1M: 12.5 },
    ],
  },
  {
    matchPattern: /claude-haiku|claude-3-5-haiku/i,
    provider: 'Anthropic',
    fallbackName: 'Claude Haiku',
    fallbackSlug: 'claude-haiku',
    history: [
      { date: '2025-05-01', inputPer1M: 1.0, outputPer1M: 5.0 },
      { date: '2025-11-01', inputPer1M: 0.8, outputPer1M: 4.0 },
      { date: '2026-06-01', inputPer1M: 0.5, outputPer1M: 2.5 },
    ],
  },
  {
    matchPattern: /gemini-2\.5-pro|gemini-3\.1-pro|gemini-pro/i,
    provider: 'Google',
    fallbackName: 'Gemini Pro',
    fallbackSlug: 'gemini-pro',
    history: [
      { date: '2025-06-01', inputPer1M: 2.5, outputPer1M: 10.0 },
      { date: '2026-01-15', inputPer1M: 1.25, outputPer1M: 10.0 },
      { date: '2026-08-01', inputPer1M: 1.25, outputPer1M: 5.0 },
    ],
  },
  {
    matchPattern: /gemini-2\.5-flash|gemini-3-flash|gemini-flash/i,
    provider: 'Google',
    fallbackName: 'Gemini Flash',
    fallbackSlug: 'gemini-flash',
    history: [
      { date: '2025-06-01', inputPer1M: 0.3, outputPer1M: 1.2 },
      { date: '2026-01-15', inputPer1M: 0.15, outputPer1M: 0.6 },
      { date: '2026-08-01', inputPer1M: 0.1, outputPer1M: 0.4 },
    ],
  },
  {
    matchPattern: /deepseek-v4|deepseek-v3|deepseek-r1|deepseek/i,
    provider: 'DeepSeek',
    fallbackName: 'DeepSeek V4.1',
    fallbackSlug: 'deepseek-v4-1',
    history: [
      { date: '2025-05-01', inputPer1M: 0.55, outputPer1M: 2.19 },
      { date: '2025-12-01', inputPer1M: 0.27, outputPer1M: 1.1 },
      { date: '2026-07-01', inputPer1M: 0.14, outputPer1M: 0.56 },
    ],
  },
  {
    matchPattern: /mistral-large/i,
    provider: 'Mistral',
    fallbackName: 'Mistral Large 4.0',
    fallbackSlug: 'mistral-large-4-0',
    history: [
      { date: '2025-05-01', inputPer1M: 4.0, outputPer1M: 12.0 },
      { date: '2025-11-01', inputPer1M: 2.0, outputPer1M: 6.0 },
      { date: '2026-06-01', inputPer1M: 1.5, outputPer1M: 4.5 },
    ],
  },
];

export function buildAllProviderHistory(
  models: CatalogModel[],
  extraSnapshots: Record<string, HistoricalPricePoint[]> = {}
): ModelHistoryRecord[] {
  const latestCatalogDate =
    models
      .map((m) => m.pricingProvenance?.lastVerified?.slice(0, 10) ?? '')
      .filter(Boolean)
      .sort((a, b) => b.localeCompare(a))[0] ?? '2026-11-28';

  const records: ModelHistoryRecord[] = [];
  const usedSlugs = new Set<string>();

  models.forEach((m, idx) => {
    const currIn =
      typeof m.inputPer1M === 'number' && Number.isFinite(m.inputPer1M)
        ? m.inputPer1M
        : null;
    const currOut =
      typeof m.outputPer1M === 'number' && Number.isFinite(m.outputPer1M)
        ? m.outputPer1M
        : null;

    if (currIn === null && currOut === null) return;

    const validIn = currIn ?? 0;
    const validOut = currOut ?? 0;
    const verifiedDate = m.pricingProvenance?.lastVerified
      ? m.pricingProvenance.lastVerified.slice(0, 10)
      : latestCatalogDate;

    const archiveMatch = ARCHIVED_SERIES.find(
      (seed) =>
        seed.provider.toLowerCase() === (m.provider ?? '').toLowerCase() &&
        seed.matchPattern.test(`${m.slug} ${m.name}`)
    );

    const pointMap = new Map<string, HistoricalPricePoint>();

    if (archiveMatch) {
      for (const h of archiveMatch.history) {
        if (h.date < verifiedDate) {
          pointMap.set(h.date, {
            date: h.date,
            inputPer1M: h.inputPer1M,
            outputPer1M: h.outputPer1M,
            source: 'archive',
          });
        }
      }
    } else {
      pointMap.set('2026-07-01', {
        date: '2026-07-01',
        inputPer1M: validIn,
        outputPer1M: validOut,
        source: 'catalog',
      });
    }

    const storedPoints = extraSnapshots[m.slug] ?? [];
    for (const sp of storedPoints) {
      pointMap.set(sp.date, sp);
    }

    pointMap.set(verifiedDate, {
      date: verifiedDate,
      inputPer1M: validIn,
      outputPer1M: validOut,
      source: 'catalog',
    });

    const points = Array.from(pointMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    const first = points[0];
    const last = points[points.length - 1];
    const pctChange =
      first.inputPer1M > 0
        ? ((last.inputPer1M - first.inputPer1M) / first.inputPer1M) * 100
        : 0;

    usedSlugs.add(m.slug);
    records.push({
      id: m.id,
      slug: m.slug,
      name: m.name,
      provider: m.provider || 'Other',
      color: PALETTE[idx % PALETTE.length],
      points,
      startPrice: first.inputPer1M,
      currentPrice: last.inputPer1M,
      pctChange,
      lastUpdated: last.date,
    });
  });

  ARCHIVED_SERIES.forEach((seed, idx) => {
    if (usedSlugs.has(seed.fallbackSlug)) return;
    const points: HistoricalPricePoint[] = seed.history.map((h) => ({
      date: h.date,
      inputPer1M: h.inputPer1M,
      outputPer1M: h.outputPer1M,
      source: 'archive',
    }));
    const first = points[0];
    const last = points[points.length - 1];
    const pctChange =
      first.inputPer1M > 0
        ? ((last.inputPer1M - first.inputPer1M) / first.inputPer1M) * 100
        : 0;

    records.push({
      id: `archive-${seed.fallbackSlug}`,
      slug: seed.fallbackSlug,
      name: seed.fallbackName,
      provider: seed.provider,
      color: PALETTE[(records.length + idx) % PALETTE.length],
      points,
      startPrice: first.inputPer1M,
      currentPrice: last.inputPer1M,
      pctChange,
      lastUpdated: last.date,
    });
  });

  return records.sort((a, b) => a.name.localeCompare(b.name));
}
