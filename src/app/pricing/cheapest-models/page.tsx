import type { Metadata } from 'next';
import Link from 'next/link';
import { ALL_MODELS } from '../../../lib/catalog';
import { SiteShell } from '../../../components/SiteShell';
import { PricingSectionNav } from '../../../components/PricingSectionNav';
import { LlmPricingTableClient } from '../../../components/LlmPricingTableClient';

const BASE_URL = 'https://promptbill.online';
const TITLE = 'Cheapest LLM API Models — Lowest Cost per 1M Tokens | PromptBill';
const DESCRIPTION =
  'Compare the cheapest LLM API models ranked by blended, input, cached, and output cost per 1 million tokens across official APIs and inference hosts.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `${BASE_URL}/pricing/cheapest-models` },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/pricing/cheapest-models`,
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
  const economyModels = ALL_MODELS.filter(
    (m) => typeof m.inputPer1M === 'number' && Number.isFinite(m.inputPer1M) && m.inputPer1M < 0.5
  );

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        url: `${BASE_URL}/pricing/cheapest-models`,
        name: TITLE,
        description: DESCRIPTION,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'LLM Pricing', item: `${BASE_URL}/pricing` },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'Cheapest Models',
            item: `${BASE_URL}/pricing/cheapest-models`,
          },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'Lowest-Cost LLM API Models',
        numberOfItems: economyModels.length,
        itemListElement: economyModels.map((m, idx) => ({
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
            name: 'Which LLM APIs have the lowest cost per 1 million tokens?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Economy and lightweight models priced below $0.50 per 1M input tokens deliver the lowest blended cost for high-volume classification, extraction, routing, and summarization.',
            },
          },
        ],
      },
    ],
  };

  return (
    <SiteShell hidePageHeader>
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <PricingSectionNav active="cheapest-models" />

        <header className="text-center max-w-2xl mx-auto space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-600">
            PromptBill · Economy Tier (&lt;$0.50 / 1M Input)
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-950">
            Cheapest LLM API Models
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            High-efficiency API models under $0.50 per 1M input tokens ranked by blended cost, cached read rate, and output price.
          </p>
          <div className="pt-1 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-800 tabular-nums">
            <span>{economyModels.length} Economy Models</span>
            <span>Sorted by Blended / 1M</span>
            <span>USD / 1M Standard</span>
          </div>
        </header>

        <LlmPricingTableClient models={ALL_MODELS} defaultTier="economy" hideTierPills />

        <footer className="border-t border-slate-200 pt-6 text-center max-w-2xl mx-auto space-y-2 text-xs text-slate-600">
          <h2 className="text-sm font-semibold text-slate-950">
            Evaluating Low-Cost Models for Production
          </h2>
          <p className="leading-relaxed">
            Compare economy model costs against quality scores on the{' '}
            <Link href="/leaderboard" className="underline underline-offset-2 text-slate-900 font-medium">
              Leaderboard
            </Link>{' '}
            or review rate provenance in{' '}
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
