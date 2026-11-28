import type { Metadata } from 'next';
import Link from 'next/link';
import { ALL_MODELS } from '../../../lib/catalog';
import { SiteShell } from '../../../components/SiteShell';
import { PricingSectionNav } from '../../../components/PricingSectionNav';
import { PriceHistoryClient } from '../../../components/PriceHistoryClient';

const BASE_URL = 'https://promptbill.online';
const TITLE = 'LLM API Price History & Verification Ledger — Rate Changes & Audits | PromptBill';
const DESCRIPTION =
  'Track LLM API price history, launch rate snapshots, provider verification dates, and per-1M input, cached, and output token audits across 97 models on PromptBill.';

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
  const verifiedCount = ALL_MODELS.filter(
    (m) => m.pricingProvenance?.status === 'Verified'
  ).length;

  const providerCount = new Set(
    ALL_MODELS.map((m) => m.provider).filter((p): p is string => Boolean(p))
  ).size;

  const latestVerificationDate =
    ALL_MODELS.map((m) => m.pricingProvenance?.lastVerified?.slice(0, 10) ?? '')
      .filter(Boolean)
      .sort((a, b) => b.localeCompare(a))[0] ?? '2026-11-27';

  const sortedForSchema = [...ALL_MODELS].sort((a, b) => {
    const dA = a.pricingProvenance?.lastVerified ?? '';
    const dB = b.pricingProvenance?.lastVerified ?? '';
    return dB.localeCompare(dA);
  });

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
        name: 'PromptBill LLM API Price History & Verification Dataset',
        description:
          'Historical launch snapshots and verification audit log of LLM API token pricing normalized per 1 million tokens.',
        url: `${BASE_URL}/pricing/price-history`,
        dateModified: latestVerificationDate,
        creator: {
          '@type': 'Organization',
          name: 'PromptBill',
          url: BASE_URL,
        },
        variableMeasured: [
          'Input token price per 1M tokens (USD)',
          'Cached input token price per 1M tokens (USD)',
          'Output token price per 1M tokens (USD)',
          'Last verification date',
        ],
      },
      {
        '@type': 'ItemList',
        name: 'Verified LLM API Rate Snapshots',
        numberOfItems: sortedForSchema.length,
        itemListElement: sortedForSchema.map((m, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          url: `${BASE_URL}/models/${m.slug}`,
          name: `${m.name} (${m.provider}) — Verified ${
            m.pricingProvenance?.lastVerified?.slice(0, 10) ?? latestVerificationDate
          }: In ${fmtRate(m.inputPer1M)} / Out ${fmtRate(m.outputPer1M)} per 1M`,
        })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'How does PromptBill track LLM API price history and rate changes?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'PromptBill logs dated launch rate snapshots, verified price reductions, and full catalog verification audits normalized to USD per 1 million input, cached input, and output tokens.',
            },
          },
          {
            '@type': 'Question',
            name: 'Why do initial launch entries show Baseline instead of a percentage price change?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'When a newly released model is recorded at its initial official API pricing without a prior rate schedule, PromptBill marks the delta as Baseline rather than inventing a synthetic prior price.',
            },
          },
          {
            '@type': 'Question',
            name: 'How often are LLM API prices verified on PromptBill?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: `All ${ALL_MODELS.length} tracked models across ${providerCount} providers are audited against official provider pricing pages, with the latest catalog verification completed on ${latestVerificationDate}.`,
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

        <PricingSectionNav active="price-history" />

        {/* Centered Editorial Header */}
        <header className="text-center max-w-2xl mx-auto space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-600">
            PromptBill · Rate Change &amp; Verification Ledger
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-950">
            LLM API Price History
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Chronological launch rate snapshots, provider price audits, and verified per-1M token schedules across {ALL_MODELS.length} tracked models.
          </p>
          <div className="pt-1 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-800 tabular-nums">
            <span>{ALL_MODELS.length} Tracked Models</span>
            <span>{verifiedCount} Verified</span>
            <span>{providerCount} Providers</span>
            <span>Latest Audit: {latestVerificationDate}</span>
          </div>
        </header>

        {/* Interactive Timeline & Full Rate Audit Ledger */}
        <PriceHistoryClient models={ALL_MODELS} />

        {/* GEO Q&A & Provenance Footer */}
        <footer className="border-t border-slate-200 pt-8 max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-base font-semibold text-slate-950">
              How Price History &amp; Verification Audits Work
            </h2>
            <p className="text-xs text-slate-600">
              All rates are normalized to USD per 1,000,000 tokens. Initial releases are labeled Baseline until a subsequent price revision occurs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left text-xs leading-relaxed">
            <div className="space-y-1.5">
              <h3 className="font-semibold text-slate-950">Launch Snapshots</h3>
              <p className="text-slate-600">
                Captures the initial verified API rate schedule when a flagship, workhorse, or nano model enters the catalog.
              </p>
            </div>
            <div className="space-y-1.5">
              <h3 className="font-semibold text-slate-950">Price Revisions</h3>
              <p className="text-slate-600">
                Records before-and-after input and output rates alongside percentage deltas whenever a provider cuts or updates pricing.
              </p>
            </div>
            <div className="space-y-1.5">
              <h3 className="font-semibold text-slate-950">Verification Audits</h3>
              <p className="text-slate-600">
                Confirms active token rates, prompt cache discounts, and endpoint counts against official documentation. See{' '}
                <Link href="/methodology" className="underline underline-offset-2 text-slate-900 font-medium">
                  Methodology
                </Link>
                .
              </p>
            </div>
          </div>
        </footer>
      </div>
    </SiteShell>
  );
}
