import { NextResponse } from 'next/server';
import { ALL_MODELS } from '../../lib/catalog';
import { REGISTRY_SNAPSHOT, buildDynamicSeoCopy } from '../../lib/modelRegistry';

export const dynamic = 'force-static';

export async function GET() {
  const copy = buildDynamicSeoCopy(REGISTRY_SNAPSHOT.generatedMonthYear);
  const lines: string[] = [
    '# PromptBill',
    '',
    `> LLM API Cost Calculator, Semantic Leaderboard, Prompt Caching & Batch API Estimator, Context-Tiered Pricing Checker, and Multi-Host / Router Comparison at https://promptbill.online (${copy.monthYear}).`,
    '',
    '## Live Snapshot Highlights',
    `- ${copy.codingLeaderLine}`,
    `- ${copy.valueLeaderLine}`,
    `- ${copy.speedLeaderLine}`,
    '',
    '## Core Calculators & Tools',
    '- [LLM Cost & Leaderboard Workspace](https://promptbill.online/): Interactive cost calculator, 14-column benchmark grid, and Pareto frontier scatter plot.',
    '- [Head-to-Head Model Comparisons Hub](https://promptbill.online/compare): Compare flagship, coding, reasoning, and budget LLMs side-by-side.',
    '- [All Models Directory](https://promptbill.online/models): Full catalog of tracked models with input, cached read, cache write, output pricing, and throughput.',
    '- [API Pricing Reference](https://promptbill.online/pricing): Token pricing comparison across providers and tiers.',
    '- [LLM Selector](https://promptbill.online/tools/llm-selector): Filter models by task, monthly budget, score, and license.',
    '- [Token Counter](https://promptbill.online/tools/token-counter): Estimate prompt token counts and input/cached costs.',
    '- [Routing Simulator](https://promptbill.online/tools/routing-simulator): Estimate savings from hybrid economy-to-flagship model routing.',
    '',
    '## Tracked Models',
  ];

  for (const m of ALL_MODELS) {
    lines.push(
      `- [${m.name}](https://promptbill.online/models/${m.slug}): ${m.provider} — Score ${m.score.toFixed(1)}, $${m.inputPer1M.toFixed(2)}/$${m.outputPer1M.toFixed(2)} per 1M, cached read $${m.cachedInputPer1M.toFixed(2)}/1M, ${m.contextWindow} context, ${m.tokPerSec} tok/s (${m.evidence}).`
    );
  }

  return new NextResponse(lines.join('\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
