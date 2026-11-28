import type { Metadata } from 'next';
import Link from 'next/link';
import { ALL_MODELS } from '../../../lib/catalog';
import {
  fetchOpenRouterLiveModels,
  mergeLiveWithStoredHistory,
  REDIS_HISTORY_KEY,
  toModelHistoryRecords,
  type ModelHistoryRecord,
  type StoredModelHistory,
} from '../../../lib/openrouterHistory';
import { SiteShell } from '../../../components/SiteShell';
import { PricingSectionNav } from '../../../components/PricingSectionNav';
import { PriceHistoryClient } from '../../../components/PriceHistoryClient';

export const revalidate = 3600;

const BASE_URL = 'https://promptbill.online';
const TITLE = 'LLM API Pricing History — Historical Input & Output Rate Changes Across Providers | PromptBill';
const DESCRIPTION =
  'Historical LLM API pricing changes per 1 million input and output tokens across OpenAI, Anthropic, Google, DeepSeek, Mistral, and OpenRouter models, updated daily.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `${BASE_URL}/pricing/price-history` },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/pricing/price-history`,
    siteName: 'PromptBill',
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary',
    title: TITLE,
    description: DESCRIPTION,
  },
};

function fmtRate(val: number): string {
  if (!Number.isFinite(val)) return 'N/A';
  if (val > 0 && val < 0.01) return `$${val.toFixed(4)}`;
  return `$${val.toFixed(2)}`;
}

interface ProviderGeoSummary {
  provider: 'OpenAI' | 'Anthropic' | 'Google';
  modelCount: number;
  avgInputChangePct: number;
  lowestInputModel: string;
  lowestInputRate: string;
  summaryText: string;
}

function buildProviderGeoSummaries(records: ModelHistoryRecord[]): ProviderGeoSummary[] {
  const targets: Array<'OpenAI' | 'Anthropic' | 'Google'> = ['OpenAI', 'Anthropic', 'Google'];

  return targets.map((provider) => {
    const group = records.filter((r) => r.provider === provider);
    const modelCount = group.length;
    const avgInputChangePct =
      modelCount > 0
        ? group.reduce((acc, r) => acc + r.pctChange, 0) / modelCount
        : 0;

    const cheapest = [...group]
      .filter((r) => r.currentPrice > 0)
      .sort((a, b) => a.currentPrice - b.currentPrice)[0];

    const lowestInputModel = cheapest?.name ?? `${provider} models`;
    const lowestInputRate = cheapest ? `${fmtRate(cheapest.currentPrice)} / 1M` : 'N/A';
    const changePhrase =
      avgInputChangePct < -0.05
        ? `an average input rate change of ${avgInputChangePct.toFixed(1)}%`
        : avgInputChangePct > 0.05
        ? `an average input rate change of +${avgInputChangePct.toFixed(1)}%`
        : 'steady baseline input pricing (0.0% average shift)';

    const summaryText =
      modelCount > 0
        ? `PromptBill tracks ${modelCount} ${provider} models with ${changePhrase} across recorded snapshots. Current tracked input pricing starts at ${lowestInputRate} (${lowestInputModel}).`
        : `PromptBill tracks ${provider} input and output token pricing per 1 million tokens with daily rate change detection.`;

    return {
      provider,
      modelCount,
      avgInputChangePct,
      lowestInputModel,
      lowestInputRate,
      summaryText,
    };
  });
}

async function getInitialHistoryRecords() {
  const todayIso = new Date().toISOString().slice(0, 10);
  let stored: Record<string, StoredModelHistory> = {};

  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN ||
    process.env.KV_REST_API_READ_ONLY_TOKEN;

  if (url && token) {
    try {
      const res = await fetch(`${url}/get/${encodeURIComponent(REDIS_HISTORY_KEY)}`, {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 3600 },
      });
      if (res.ok) {
        const data = (await res.json()) as { result?: string | null };
        if (data.result) {
          stored = JSON.parse(data.result) as Record<string, StoredModelHistory>;
        }
      }
    } catch {
      // Ignore Redis read error and fall back to live OpenRouter fetch
    }
  }

  try {
    const liveModels = await fetchOpenRouterLiveModels();
    const { updatedMap } = mergeLiveWithStoredHistory(stored, liveModels, todayIso);
    return toModelHistoryRecords(updatedMap, ALL_MODELS);
  } catch {
    return toModelHistoryRecords(stored, ALL_MODELS);
  }
}

export default async function Page() {
  const initialRecords = await getInitialHistoryRecords();
  const latestDate =
    initialRecords[0]?.lastUpdated ?? new Date().toISOString().slice(0, 10);
  const providerSummaries = buildProviderGeoSummaries(initialRecords);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        url: `${BASE_URL}/pricing/price-history`,
        name: TITLE,
        description: DESCRIPTION,
        dateModified: latestDate,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'LLM Pricing', item: `${BASE_URL}/pricing` },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'Price History',
            item: `${BASE_URL}/pricing/price-history`,
          },
        ],
      },
      {
        '@type': 'Dataset',
        name: 'PromptBill LLM API Pricing History Dataset',
        description:
          'Historical input and output token pricing shifts per 1M tokens across OpenAI, Anthropic, Google, and OpenRouter models.',
        url: `${BASE_URL}/pricing/price-history`,
        dateModified: latestDate,
        creator: {
          '@type': 'Organization',
          name: 'PromptBill',
          url: BASE_URL,
        },
        variableMeasured: [
          'Input token price per 1M tokens (USD)',
          'Output token price per 1M tokens (USD)',
          'Cumulative percentage price change (%)',
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'How does PromptBill track LLM API price history over time?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'PromptBill combines historical rate milestones for major LLM families with automated daily snapshots from OpenRouter and your catalog to show cumulative percentage shifts in input and output token prices.',
            },
          },
          ...providerSummaries.map((item) => ({
            '@type': 'Question',
            name: `How have ${item.provider} API token prices changed on PromptBill?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.summaryText,
            },
          })),
        ],
      },
    ],
  };

  return (
    <SiteShell hidePageHeader>
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <PricingSectionNav active="price-history" />

        {/* Centered SEO & GEO-Optimized Page Intro Heading & Summary */}
        <header className="text-center max-w-3xl mx-auto space-y-2.5 pt-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
            LLM API Price History &amp; Token Rate Shifts
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Track how per-1M input and output token prices have changed over time across Anthropic, OpenAI, Google, DeepSeek, Mistral, and OpenRouter models—combining historical rate milestones with automated daily price snapshots.
          </p>
          <div className="pt-1 space-y-1">
            <div>
              <Link
                href="/pricing"
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline underline-offset-4"
              >
                Click here to see the current prices for the major LLM APIs
              </Link>
            </div>
            <p className="text-xs text-slate-500">
              Last updated: {latestDate} · Auto-synced daily with OpenRouter Models API
            </p>
          </div>
        </header>

        <PriceHistoryClient models={ALL_MODELS} initialRecords={initialRecords} />

        {/* Concise Provider-Specific SEO & GEO Summary Blocks */}
        <section
          aria-label="Provider Pricing History Overview"
          className="border-t border-slate-200 pt-8 space-y-4"
        >
          <div className="text-center max-w-2xl mx-auto space-y-1">
            <h2 className="text-base sm:text-lg font-semibold text-slate-950">
              Major Provider Rate Trends: OpenAI, Anthropic &amp; Google
            </h2>
            <p className="text-xs text-slate-500">
              Live summary computed from tracked per-1M input token snapshots as of {latestDate}.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {providerSummaries.map((item) => (
              <article
                key={item.provider}
                className="border-t-2 border-slate-900 pt-3 space-y-1.5"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-950">
                    {item.provider} API Price History
                  </h3>
                  <span className="text-xs font-mono text-slate-600">
                    {item.modelCount} models
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.summaryText}
                </p>
              </article>
            ))}
          </div>
        </section>

        <footer className="border-t border-slate-200 pt-6 text-center max-w-2xl mx-auto space-y-2 text-xs text-slate-600">
          <h2 className="text-sm font-semibold text-slate-950">
            LLM API Price History Methodology &amp; Data Sources
          </h2>
          <p className="leading-relaxed">
            All historical charts normalize per-1M input or output token rates to percentage shifts from each model&apos;s earliest recorded rate and append new snapshots automatically when prices change. See{' '}
            <Link href="/methodology" className="underline underline-offset-2 text-slate-900 font-medium">
              Methodology
            </Link>
            .
          </p>
        </footer>
      </div>
    </SiteShell>
  );
}
