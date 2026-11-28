import type { Metadata } from 'next';
import Link from 'next/link';
import { ALL_MODELS } from '../../../lib/catalog';
import {
  fetchOpenRouterLiveModels,
  mergeLiveWithStoredHistory,
  REDIS_HISTORY_KEY,
  toModelHistoryRecords,
  type StoredModelHistory,
} from '../../../lib/openrouterHistory';
import { SiteShell } from '../../../components/SiteShell';
import { PricingSectionNav } from '../../../components/PricingSectionNav';
import { PriceHistoryClient } from '../../../components/PriceHistoryClient';

export const revalidate = 3600;

const BASE_URL = 'https://promptbill.online';
const TITLE = 'LLM API Pricing History — Live OpenRouter & Multi-Provider Rate Tracker | PromptBill';
const DESCRIPTION =
  'Track live LLM API pricing history, automatic OpenRouter rate change detection, and multi-provider input and output price trends on PromptBill.';

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
        name: 'PromptBill OpenRouter & Multi-Provider LLM Pricing History Dataset',
        description:
          'Automated daily snapshots and historical rate revisions across OpenRouter and major LLM API providers.',
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
            name: 'How does PromptBill automatically update LLM price history?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'PromptBill polls OpenRouter’s public models pricing API daily, compares live per-1M input and output token rates against stored snapshots in Redis, and records a new timestamped data point whenever a provider changes a model’s price.',
            },
          },
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

        <header className="text-center space-y-2 pt-2">
          <h1 className="sr-only">LLM API Pricing History — OpenRouter &amp; Multi-Provider Tracker</h1>
          <div>
            <Link
              href="/pricing"
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline underline-offset-4"
            >
              Click here to see the current prices for the major LLM APIs
            </Link>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Last updated: {latestDate} · Auto-synced with OpenRouter Models API
          </p>
        </header>

        <PriceHistoryClient models={ALL_MODELS} initialRecords={initialRecords} />

        <footer className="border-t border-slate-200 pt-6 text-center max-w-2xl mx-auto space-y-2 text-xs text-slate-600">
          <h2 className="text-sm font-semibold text-slate-950">
            Automated OpenRouter Price Change Detection
          </h2>
          <p className="leading-relaxed">
            PromptBill polls OpenRouter&apos;s public pricing feed and appends a new snapshot whenever a model&apos;s per-1M input or output rate changes. See{' '}
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
