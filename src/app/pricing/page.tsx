import type { Metadata } from 'next';
import Link from 'next/link';
import { ALL_MODELS } from '../../lib/catalog';
import { SiteShell } from '../../components/SiteShell';
import { PricingCleanClient } from '../../components/PricingCleanClient';

const BASE_URL = 'https://promptbill.online';

const TITLE = 'API Pricing — LLM Tokens, Cheapest Models, Image Models, Subscriptions & History | PromptBill';
const DESCRIPTION =
  'Compare LLM API token pricing per 1 million tokens, lowest-cost models, image models, AI subscriptions, and verification history on PromptBill.';

export const metadata: Metadata = {
  title: {
    absolute: TITLE,
  },
  description: DESCRIPTION,
  alternates: {
    canonical: `${BASE_URL}/pricing`,
  },
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
          { '@type': 'ListItem', position: 2, name: 'Pricing', item: `${BASE_URL}/pricing` },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'PromptBill API Pricing Directory',
        numberOfItems: ALL_MODELS.length,
        itemListElement: ALL_MODELS.map((m, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          url: `${BASE_URL}/models/${m.slug}`,
          name: `${m.name} (${m.provider}) — In ${fmtRate(m.inputPer1M)} / Out ${fmtRate(m.outputPer1M)} per 1M`,
        })),
      },
    ],
  };

  return (
    <SiteShell hidePageHeader>
      <div className="max-w-6xl mx-auto space-y-8 pb-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Centered Editorial Header */}
        <header className="text-center max-w-2xl mx-auto space-y-3 pt-2">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-600">
            PromptBill · Rates per 1M Tokens
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-950">
            API Pricing
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Normalized token rates, lowest-cost models, image models, AI subscriptions, and verification dates.
          </p>
          <div className="pt-1 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-800">
            <span>{ALL_MODELS.length} Models</span>
            <span>{verifiedCount} Verified</span>
            <span>{providerCount} Providers</span>
            <span>{endpointCount} Endpoints</span>
          </div>
        </header>

        {/* Provenance Notice */}
        <div className="border border-amber-300 bg-amber-50/70 px-4 py-3 text-xs sm:text-sm text-amber-950 text-center">
          <strong>Provenance Notice:</strong> Values marked <strong>Estimated</strong> lack a verified primary source URL or check timestamp in the current catalog snapshot. Missing values show <strong>N/A</strong>. See{' '}
          <Link href="/methodology" className="font-semibold underline underline-offset-2">
            Methodology
          </Link>
          .
        </div>

        {/* Uniform Pricing Client */}
        <PricingCleanClient models={ALL_MODELS} />
      </div>
    </SiteShell>
  );
}
