export interface TierHubConfig {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  headline: string;
  summary: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  predicate: (m: any) => boolean;
}

export const TIER_HUBS: TierHubConfig[] = [
  {
    slug: 'under-1-dollar-per-1m',
    title: 'LLMs Under $1 / 1M Output Tokens — Budget & High-Volume APIs',
    shortTitle: 'Under $1 / 1M Output',
    description:
      'Compare LLMs priced under $1.00 per 1M output tokens across benchmark scores, Score/$ efficiency, context windows, and tokens per second.',
    headline: 'Budget & High-Volume LLMs (Under $1.00 / 1M Output)',
    summary:
      'Models with output token pricing below $1.00 per 1M tokens are well suited for classification, routing, high-volume chat, and cost-sensitive batch pipelines where unit economics matter most.',
    predicate: (m) => typeof m.outputPer1M === 'number' && m.outputPer1M < 1.0,
  },
  {
    slug: 'flagship-reasoning',
    title: 'Flagship & High-Score LLMs — Frontier Benchmarks & Reasoning',
    shortTitle: 'Flagship & High-Score',
    description:
      'Explore top-scoring LLMs for complex reasoning, multi-step analysis, and architecture tasks with full API pricing and throughput comparisons.',
    headline: 'High-Benchmark & Flagship Reasoning LLMs',
    summary:
      'Higher-capability models generally carry higher per-1M-token rates and lower throughput than compact flash/nano tiers, making them strongest on complex reasoning, synthesis, and multi-step execution.',
    predicate: (m) => typeof m.score === 'number' && m.score >= 84,
  },
  {
    slug: 'high-throughput-speed',
    title: 'Fastest LLMs by Output Speed (tok/s) — Low-Latency APIs',
    shortTitle: 'Fastest Throughput (tok/s)',
    description:
      'Rank high-speed LLMs by recorded output tokens per second (tok/s) alongside per-1M-token pricing and context window capacity.',
    headline: 'High-Throughput LLMs Ranked by Output Speed (tok/s)',
    summary:
      'High tokens-per-second throughput helps reduce perceived latency in interactive assistants, streaming UIs, and real-time agent loops. Always validate latency under your actual prompt length.',
    predicate: (m) => typeof m.tokPerSec === 'number' && m.tokPerSec >= 150,
  },
];

export function slugifyProvider(provider: string): string {
  return String(provider || 'other')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getUniqueProviders(models: any[]): Array<{ slug: string; name: string; count: number }> {
  const map = new Map<string, { slug: string; name: string; count: number }>();
  for (const m of models) {
    if (m?.archived) continue;
    const name = String(m.provider || 'Other');
    const slug = slugifyProvider(name);
    const existing = map.get(slug);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(slug, { slug, name, count: 1 });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
