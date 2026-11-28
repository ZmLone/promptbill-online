import { NextResponse } from 'next/server';
import { ALL_MODELS } from '../../lib/catalog';
import { REGISTRY_SNAPSHOT, buildDynamicSeoCopy } from '../../lib/modelRegistry';
import { getLatestNewsArticles, formatNewsDate } from '../../lib/news';

export const dynamic = 'force-static';

const SITE_URL = 'https://promptbill.online';

export async function GET() {
  const seoCopy = buildDynamicSeoCopy();
  const latestNews = getLatestNewsArticles(10);
  const modelCount = Array.isArray(ALL_MODELS) ? ALL_MODELS.length : 0;

  const lines: string[] = [
    '# PromptBill',
    '',
    `> ${seoCopy.metaDescription || 'LLM API token cost calculator, multi-provider inference endpoint comparator, and model benchmark ledger.'}`,
    '',
    '## Core Pages',
    `- [Home](${SITE_URL}/): Overview, pricing comparison, and cost estimator.`,
    `- [Model Catalog](${SITE_URL}/models): Searchable benchmark and pricing ledger (${modelCount} indexed models).`,
    `- [Token Cost Calculator](${SITE_URL}/calculator): Estimate input, output, and cached token spend across providers.`,
    `- [Head-to-Head Model Comparison](${SITE_URL}/compare): Compare model pricing, context windows, and benchmark scores.`,
    `- [LLM Selector Tool](${SITE_URL}/tools/llm-selector): Match workloads and budgets to recommended models.`,
    `- [Pricing & Endpoint News](${SITE_URL}/news): Latest verified LLM API price shifts, launches, and endpoint updates.`,
    '',
    '## Latest Pricing & Endpoint News',
  ];

  if (latestNews.length === 0) {
    lines.push(`- [Pricing & Endpoint News](${SITE_URL}/news)`);
  } else {
    for (const article of latestNews) {
      const dateStr = formatNewsDate(article.publishedAt);
      const categoryPrefix = article.category ? `[${article.category}] ` : '';
      lines.push(
        `- [${categoryPrefix}${article.title} (${dateStr})](${SITE_URL}/news/${article.slug}): ${article.summary}`
      );
    }
  }

  lines.push('');
  lines.push('## Indexed Models');

  if (Array.isArray(ALL_MODELS)) {
    for (const model of ALL_MODELS as Array<{
      name?: string;
      slug?: string;
      provider?: string;
    }>) {
      if (!model?.slug) continue;
      const label = model.name ? `${model.name}${model.provider ? ` (${model.provider})` : ''}` : model.slug;
      lines.push(`- [${label}](${SITE_URL}/models/${model.slug})`);
    }
  }

  if (REGISTRY_SNAPSHOT?.generatedAt) {
    lines.push('');
    lines.push(`Registry snapshot updated: ${REGISTRY_SNAPSHOT.generatedAt}`);
  }

  return new NextResponse(lines.join('\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
