import { SeverityNumber } from '@opentelemetry/api-logs';
import { after, NextResponse } from 'next/server';
import { posthogLog, posthogLogProvider } from '../../../instrumentation';
import { ALL_MODELS } from '../../lib/catalog';
import { REGISTRY_SNAPSHOT, buildDynamicSeoCopy } from '../../lib/modelRegistry';
import { getLatestNewsArticles, formatNewsDate } from '../../lib/news';

export const dynamic = 'force-static';

function fmtScore(val: number | null): string {
  return typeof val === 'number' && Number.isFinite(val) ? val.toFixed(1) : 'N/A';
}

function fmtPrice(val: number | null): string {
  return typeof val === 'number' && Number.isFinite(val) ? `$${val.toFixed(2)}` : 'N/A';
}

export async function GET() {
  posthogLog.emit({
    body: 'llms.txt generation started',
    severityNumber: SeverityNumber.INFO,
    attributes: { route: '/llms.txt' },
  });

  const copy = buildDynamicSeoCopy(REGISTRY_SNAPSHOT.generatedMonthYear);
  const lines: string[] = [
    '# PromptBill',
    '',
    `> LLM API pricing reference, benchmark overview, token counter, and routing simulator at https://promptbill.online (${copy.monthYear}).`,
    '',
    '## Snapshot Summary',
    `- ${copy.codingLeaderLine}`,
    `- ${copy.valueLeaderLine}`,
    `- ${copy.speedLeaderLine}`,
    '',
    '## Core Pages & Tools',
    '- [PromptBill Home](https://promptbill.online/): Dedicated hub for rankings, comparisons, pricing, and tools.',
    '- [LLM Leaderboard](https://promptbill.online/leaderboard): Evidence-aware rankings showing scores, official API prices, and throughput where recorded.',
    '- [Head-to-Head Model Comparisons](https://promptbill.online/compare): Compare tracked models side-by-side.',
    '- [All Models Directory](https://promptbill.online/models): Full catalog of tracked models.',
    '- [LLM API Pricing News](https://promptbill.online/news): Price updates, model releases, and endpoint changes.',
    '- [API Pricing](https://promptbill.online/pricing): Token pricing across providers and endpoints.',
    '- [LLM Selector](https://promptbill.online/tools/llm-selector): Filter models by workload, price, score, and license.',
    '- [Token Counter](https://promptbill.online/tools/token-counter): Estimate prompt token counts and input costs.',
    '- [Routing Simulator](https://promptbill.online/tools/routing-simulator): Estimate cost differences from routing requests across models.',
    '',
    '## Pricing & Benchmark Methodology',
    '- Normalization: All token prices are normalized to USD per 1,000,000 (1M) input, cached-read, and output tokens.',
    '- Provenance Labels: Official prices reflect first-party provider rate cards; Router prices reflect third-party aggregators (e.g., OpenRouter); Estimated values are marked explicitly.',
    '- Full Machine Index: https://promptbill.online/llms.txt',
    '',
    '## Tracked Models',
  ];

  const latestNews = getLatestNewsArticles(10);
  if (latestNews.length > 0) {
    lines.push('', '## Latest Pricing & Model News');
    for (const item of latestNews) {
      lines.push(
        `- [${item.title}](https://promptbill.online/news/${item.slug}) (${formatNewsDate(item.publishedAt)}, ${item.category}): ${item.summary}`
      );
    }
  }

  lines.push('', '## Tracked Models');

  for (const m of ALL_MODELS) {
    const ctxLabel = m.contextWindow ?? 'N/A';
    const speedLabel = typeof m.tokPerSec === 'number' && Number.isFinite(m.tokPerSec) ? `${m.tokPerSec} tok/s` : 'N/A';
    const pricingStatus = m.pricingProvenance?.status ?? m.evidence ?? 'Estimated';
    const routerEp = Array.isArray(m.hostingEndpoints)
      ? m.hostingEndpoints.find((ep) => ep && (ep.providerType === 'Router' || /openrouter/i.test(String(ep.host || ''))))
      : undefined;
    const routerLabel =
      routerEp && typeof routerEp.inputPer1M === 'number' && typeof routerEp.outputPer1M === 'number'
        ? `, Router In/Out ${fmtPrice(routerEp.inputPer1M)}/${fmtPrice(routerEp.outputPer1M)} per 1M`
        : '';

    lines.push(
      `- [${m.name}](https://promptbill.online/models/${m.slug}): ${m.provider} — Score ${fmtScore(m.score)} (${m.benchmarkProvenance.status}), Official In/Out ${fmtPrice(m.inputPer1M)}/${fmtPrice(m.outputPer1M)} per 1M (${pricingStatus})${routerLabel}, Cached Read ${fmtPrice(m.cachedInputPer1M)}/1M, Context ${ctxLabel}, Speed ${speedLabel} (${m.speedProvenance.status}).`
    );
  }

  posthogLog.emit({
    body: 'llms.txt generation completed',
    severityNumber: SeverityNumber.INFO,
    attributes: {
      route: '/llms.txt',
      model_count: ALL_MODELS.length,
    },
  });

  after(() => posthogLogProvider.forceFlush().catch(() => {}));

  return new NextResponse(lines.join('\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
