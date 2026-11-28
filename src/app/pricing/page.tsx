import type { Metadata } from 'next';
import Link from 'next/link';
import { ALL_MODELS } from '../../lib/catalog';
import { SiteShell } from '../../components/SiteShell';
import { PricingSectionNav } from '../../components/PricingSectionNav';
import { LlmPricingTableClient } from '../../components/LlmPricingTableClient';

const BASE_URL = 'https://promptbill.online';
const TITLE = 'LLM API Token Pricing — Input, Cached & Output Rates per 1M | PromptBill';
const DESCRIPTION =
  'Compare LLM API token pricing per 1 million input, cached input, output, and blended tokens across official APIs and inference endpoints on PromptBill.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `${BASE_URL}/pricing` },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/pricing`,
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
  const providerCount = new Set(
    ALL_MODELS.map((m) => m.provider).filter((p): p is string => Boolean(p))
  ).size;

  const endpointCount = ALL_MODELS.reduce(
    (sum, m) => sum + (Array.isArray(m.hostingEndpoints) ? m.hostingEndpoints.length : 1),
    0
  );

  const verifiedCount = ALL_MODELS.filter(
    (m) => m.pricingProvenance?.status === 'Verified'
  ).length;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        url: `${BASE_URL}/pricing`,
        name: TITLE,
        description: DESCRIPTION,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'LLM Pricing', item: `${BASE_URL}/pricing` },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'LLM API Token Pricing Directory',
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
            name: 'How are LLM API token prices normalized on PromptBill?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'All LLM API token prices are normalized to USD per 1,000,000 input, cached input, output, and workload-blended tokens across official APIs and third-party inference hosts.',
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

        <PricingSectionNav active="llm-pricing" />

        <header className="text-center max-w-2xl mx-auto space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-600">
            PromptBill · LLM API Token Rates
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-950">
            LLM API Token Pricing
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Normalized per-1M input, cached read, output, and blended token rates across official APIs and cloud inference endpoints.
          </p>
          <div className="pt-1 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-800 tabular-nums">
            <span>{ALL_MODELS.length} Models</span>
            <span>{verifiedCount} Verified</span>
            <span>{providerCount} Providers</span>
            <span>{endpointCount} Endpoints</span>
          </div>
        </header>

        <LlmPricingTableClient models={ALL_MODELS} defaultTier="all" />

        <footer className="border-t border-slate-200 pt-6 text-center max-w-2xl mx-auto space-y-2 text-xs text-slate-600">
          <h2 className="text-sm font-semibold text-slate-950">
            Blended LLM Token Pricing Methodology
          </h2>
          <p className="leading-relaxed">
            Blended cost per 1M tokens combines input tokens (adjusted by prompt cache hit share) with output tokens. Estimated values lack a verified primary timestamp; missing metrics show N/A.{' '}
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
