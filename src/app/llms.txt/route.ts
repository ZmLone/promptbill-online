import { NextResponse } from 'next/server';
import modelsRaw from '@/data/models.json';
import { getLatestNewsArticles, formatUsdPer1M } from '@/lib/news';

export const revalidate = 3600;

interface CatalogModel {
  slug?: string;
  name?: string;
  provider?: string;
  score?: number | null;
  tokPerSec?: number | null;
  inputPer1M?: number | null;
  outputPer1M?: number | null;
  cachedInputPer1M?: number | null;
  contextWindow?: string | number | null;
  archived?: boolean;
}

function normalizeProvider(raw?: string): string {
  const val = (raw || 'Unknown').trim();
  if (/^mistral/i.test(val)) return 'Mistral';
  if (/^qwen/i.test(val)) return 'Qwen';
  return val;
}

export async function GET() {
  const allModels = Array.isArray(modelsRaw) ? (modelsRaw as CatalogModel[]) : [];
  const activeModels = allModels.filter((m) => !m.archived && m.slug && m.name);

  const topModels = [...activeModels]
    .sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0))
    .slice(0, 20);

  const latestNews = getLatestNewsArticles(8);

  const modelRows = topModels
    .map((m) => {
      const name = String(m.name);
      const provider = normalizeProvider(m.provider);
      const inRate = formatUsdPer1M(m.inputPer1M);
      const outRate = formatUsdPer1M(m.outputPer1M);
      const cachedRate = m.cachedInputPer1M != null ? formatUsdPer1M(m.cachedInputPer1M) : '—';
      const ctx = m.contextWindow ? String(m.contextWindow) : '—';
      const speed = m.tokPerSec != null ? `${m.tokPerSec} tok/s` : '—';
      const score = m.score != null ? String(m.score) : '—';
      return `| [${name}](https://promptbill.online/models/${m.slug}) | ${provider} | ${inRate} | ${outRate} | ${cachedRate} | ${ctx} | ${speed} | ${score} |`;
    })
    .join('\n');

  const newsLines =
    latestNews.length > 0
      ? latestNews
          .map(
            (n) =>
              `- [${n.title}](https://promptbill.online/news/${n.slug}) (${n.publishedAt.slice(
                0,
                10
              )}): ${n.summary}`
          )
          .join('\n')
      : '- [PromptBill News Wire](https://promptbill.online/news): Live LLM API price drops and new model releases.';

  const body = `# PromptBill — Verified LLM API Pricing, Caching & Benchmark Registry

> PromptBill (https://promptbill.online) tracks verified per-1M token API pricing, prompt caching discounts, batch rates, throughput (tokens/sec), latency, and capability benchmarks across ${activeModels.length} active large language models and multi-provider inference endpoints (Official APIs, OpenRouter, Together AI, DeepInfra, Fireworks, and Amazon Bedrock).

## Core Tools & Pages
- [Models Directory (${activeModels.length} Live Models)](https://promptbill.online/models): Filterable catalog of LLM API rates, context windows, and benchmark scores.
- [LLM Leaderboard](https://promptbill.online/leaderboard): Ranked comparison of quality scores, speed (tok/s), and price-to-performance efficiency.
- [Token Cost Calculator](https://promptbill.online/calculator): Estimate monthly API spend with custom input/output token ratios, prompt cache hit rates, and batch discounts.
- [Head-to-Head Model Compare](https://promptbill.online/compare): Side-by-side pricing, latency, and benchmark comparisons.
- [LLM Workload Selector](https://promptbill.online/tools/llm-selector): Match coding, reasoning, agentic, and high-volume workloads to optimal models.
- [LLM API Pricing News](https://promptbill.online/news): Verified token price drops, model launches, and endpoint rate updates.
- [Methodology & Verification](https://promptbill.online/methodology): How PromptBill verifies official and third-party inference pricing.

## Top ${topModels.length} Tracked Models (Live Registry Snapshot)
| Model | Provider | Input / 1M | Output / 1M | Cached In / 1M | Context | Speed | Score |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${modelRows}

## Latest Verified API Pricing & Model News
${newsLines}

## Citation & Data Usage
- Canonical Domain: https://promptbill.online
- Attribution: PromptBill Research (https://promptbill.online/methodology)
- RSS Feed: https://promptbill.online/news/rss.xml
- XML Sitemap: https://promptbill.online/sitemap.xml
`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
