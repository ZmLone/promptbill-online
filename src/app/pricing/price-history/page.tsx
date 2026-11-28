import type { Metadata } from 'next';
import Link from 'next/link';
import { ALL_MODELS } from '../../../lib/catalog';
import { SiteShell } from '../../../components/SiteShell';
import { PricingSectionNav } from '../../../components/PricingSectionNav';
import { PriceHistoryClient } from '../../../components/PriceHistoryClient';

const BASE_URL = 'https://promptbill.online';
const TITLE = 'LLM API Pricing History — Historical Rate Changes Across All Providers | PromptBill';
const DESCRIPTION =
  'Track LLM API pricing history, input and output price drops, and multi-provider token rate changes over time across OpenAI, Anthropic, Google, DeepSeek, Mistral, and more.';

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

function fmtRate(val: number | null): string {
  return typeof val === 'number' && Number.isFinite(val) ? `$${val.toFixed(2)}` : 'N/A';
}

export default function Page() {
  const latestVerificationDate =
    ALL_MODELS.map((m) => m.pricingProvenance?.lastVerified?.slice(0, 10) ?? '')
      .filter(Boolean)
      .sort((a, b) => b.localeCompare(a))[0] ?? '2026-11-28';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        url: `${BASE_URL}/pricing/price-history`,
        name: TITLE,
        description: DESCRIPTION,
        dateModified: latestVerificationDate,
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
        name: 'PromptBill Multi-Provider LLM API Pricing History Dataset',
        description:
          'Historical input and output token rate changes per 1 million tokens across major LLM API providers.',
        url: `${BASE_URL}/pricing/price-history`,
        dateModified: latestVerificationDate,
        creator: {
          '@type': 'Organization',
          name: 'PromptBill',
          url: BASE_URL,
        },
        variableMeasured: [
          'Input token price per 1M tokens (USD)',
          'Output token price per 1M tokens (USD)',
          'Historical percentage price change (%)',
        ],
      },
      {
        '@type': 'ItemList',
        name: 'LLM API Pricing History Models',
        numberOfItems: ALL_MODELS.length,
        itemListElement: ALL_MODELS.map((m, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          url: `${BASE_URL}/models/${m.slug}`,
          name: `${m.name} (${m.provider}) — In ${fmtRate(m.inputPer1M)} / Out ${fmtRate(m.outputPer1M)} per 1M`,
        })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'How have LLM API token prices changed across major providers?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Across major providers including OpenAI, Anthropic, Google, DeepSeek, and Mistral, per-1M input and output token rates have declined significantly over successive model generations and tier revisions, which PromptBill plots as percentage changes over time.',
            },
          },
          {
            '@type': 'Question',
            name: 'How does PromptBill record new daily price snapshots?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'PromptBill combines archived multi-month provider pricing timelines with automated daily catalog snapshots stored via its pricing history API endpoint.',
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
          <h1 className="sr-only">LLM API Pricing History Across All Providers</h1>
          <div>
            <Link
              href="/pricing"
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline underline-offset-4"
            >
              Click here to see the current prices for the major LLM APIs
            </Link>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Last updated: {latestVerificationDate}
          </p>
        </header>

        <PriceHistoryClient models={ALL_MODELS} />

        <footer className="border-t border-slate-200 pt-6 text-center max-w-2xl mx-auto space-y-2 text-xs text-slate-600">
          <h2 className="text-sm font-semibold text-slate-950">
            Multi-Provider LLM Price History Methodology
          </h2>
          <p className="leading-relaxed">
            Charts display cumulative percentage price changes per 1M input or output tokens across tracked providers, combining archived provider rate revisions with daily catalog snapshots. See{' '}
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
