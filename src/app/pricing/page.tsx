import type { Metadata } from 'next';
import Link from 'next/link';
import { ALL_MODELS } from '../../lib/catalog';
import { SiteShell } from '../../components/SiteShell';
import { PricingAppleClient } from '../../components/PricingAppleClient';

const BASE_URL = 'https://promptbill.online';

const PAGE_TITLE = 'API Pricing — LLM Tokens, Cheapest Models, Image Models, Subscriptions & History | PromptBill';
const PAGE_DESCRIPTION =
  'Compare LLM API token rates, lowest-cost models, image model availability, AI subscriptions, and verification history on PromptBill.';

export const metadata: Metadata = {
  title: {
    absolute: PAGE_TITLE,
  },
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: `${BASE_URL}/pricing`,
  },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/pricing`,
    siteName: 'PromptBill',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
};

function fmtRate(val: number | null): string {
  return typeof val === 'number' && Number.isFinite(val) ? `$${val.toFixed(2)}` : 'N/A';
}

export default function Page() {
  const providerTotal = new Set(
    ALL_MODELS.map((m) => m.provider).filter((p): p is string => Boolean(p))
  ).size;

  const endpointTotal = ALL_MODELS.reduce(
    (sum, m) => sum + (Array.isArray(m.hostingEndpoints) ? m.hostingEndpoints.length : 1),
    0
  );

  const verifiedTotal = ALL_MODELS.filter(
    (m) => m.pricingProvenance?.status === 'Verified'
  ).length;

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${BASE_URL}/pricing#webpage`,
        url: `${BASE_URL}/pricing`,
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        isPartOf: {
          '@type': 'WebSite',
          name: 'PromptBill',
          url: BASE_URL,
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: `${BASE_URL}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Pricing',
            item: `${BASE_URL}/pricing`,
          },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'PromptBill Model Pricing Directory',
        numberOfItems: ALL_MODELS.length,
        itemListElement: ALL_MODELS.map((m, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          url: `${BASE_URL}/models/${m.slug}`,
          name: `${m.name} (${m.provider}) — Input ${fmtRate(m.inputPer1M)} / Output ${fmtRate(m.outputPer1M)} per 1M tokens`,
        })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'How are LLM API token prices compared on PromptBill?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Rates are normalized to USD per 1,000,000 tokens across input, cached input, output, and workload-blended token mixes, with options to evaluate either the cheapest available endpoint or first-party APIs.',
            },
          },
          {
            '@type': 'Question',
            name: 'When should developers choose token APIs versus monthly AI subscriptions?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Monthly subscriptions offer predictable flat pricing for interactive chat and browser sessions, whereas token APIs scale with programmatic traffic, prompt caching, and batch processing.',
            },
          },
        ],
      },
    ],
  };

  return (
    <SiteShell hidePageHeader>
      <div className="space-y-10 pb-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />

        {/* Editorial Header */}
        <header className="space-y-6 border-b border-slate-200 pb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
            <span className="font-mono uppercase tracking-wider text-slate-700">
              promptbill.online/pricing · USD per 1M Tokens
            </span>

            <div className="flex flex-wrap items-center gap-5 font-medium">
              <Link href="/#estimator" className="text-slate-900 hover:underline underline-offset-4">
                Spend Calculator
              </Link>
              <Link href="/leaderboard" className="text-slate-900 hover:underline underline-offset-4">
                Leaderboard
              </Link>
              <Link href="/compare" className="text-slate-900 hover:underline underline-offset-4">
                Compare
              </Link>
              <Link href="/methodology" className="text-slate-900 hover:underline underline-offset-4">
                Methodology
              </Link>
            </div>
          </div>

          <div className="max-w-3xl space-y-3">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-950 leading-[1.15]">
              Pricing across models, endpoints, and plans.
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Explore normalized token rates, lowest-cost models, vision-capable entries, flat AI subscriptions, and verification history in one structured view.
            </p>
          </div>

          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-2 list-none m-0 p-0">
            <li>
              <div className="text-xs font-medium text-slate-600">Tracked Models</div>
              <div className="mt-1 font-mono text-2xl font-semibold text-slate-950">
                {ALL_MODELS.length}
              </div>
            </li>
            <li className="sm:border-l sm:border-slate-200 sm:pl-6">
              <div className="text-xs font-medium text-slate-600">Verified Pricing</div>
              <div className="mt-1 font-mono text-2xl font-semibold text-emerald-800">
                {verifiedTotal}
              </div>
            </li>
            <li className="sm:border-l sm:border-slate-200 sm:pl-6">
              <div className="text-xs font-medium text-slate-600">Providers</div>
              <div className="mt-1 font-mono text-2xl font-semibold text-slate-950">
                {providerTotal}
              </div>
            </li>
            <li className="sm:border-l sm:border-slate-200 sm:pl-6">
              <div className="text-xs font-medium text-slate-600">Endpoints</div>
              <div className="mt-1 font-mono text-2xl font-semibold text-slate-950">
                {endpointTotal}
              </div>
            </li>
          </ul>

          <div className="rounded-xl border border-amber-200/90 bg-amber-50/60 px-4 py-3 text-xs sm:text-sm text-amber-950 leading-relaxed">
            <strong>Provenance Notice:</strong> Values marked <strong>Estimated</strong> lack a verified primary source URL or check timestamp in the current catalog snapshot and must not be treated as verified official provider quotes. Missing values show <strong>N/A</strong>. See{' '}
            <Link href="/methodology" className="font-semibold underline underline-offset-2">
              Methodology
            </Link>
            .
          </div>
        </header>

        {/* Interactive Pricing Suite */}
        <PricingAppleClient models={ALL_MODELS} />

        {/* Editorial SEO & GEO Reference Notes */}
        <section
          aria-labelledby="pricing-reference-notes"
          className="border-t border-slate-200 pt-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-xs sm:text-sm text-slate-600 leading-relaxed"
        >
          <div className="space-y-1.5">
            <h2 id="pricing-reference-notes" className="text-sm font-semibold text-slate-950">
              Blended Token Economics
            </h2>
            <p>
              Blended per-1M pricing weights input tokens (adjusted for cache hit rate) against output tokens so high-output or uncached workloads are evaluated realistically.
            </p>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-slate-950">
              Data Integrity &amp; N/A Policy
            </h3>
            <p>
              PromptBill distinguishes <strong>Verified</strong> from <strong>Estimated</strong> catalog rates and renders <strong>N/A</strong> when a rate, speed figure, or prior price delta is unavailable.
            </p>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-slate-950">
              Next Steps
            </h3>
            <p>
              Simulate daily request volume and batch discounts in the{' '}
              <Link href="/#estimator" className="font-medium text-slate-950 underline underline-offset-2">
                30-day calculator
              </Link>{' '}
              or inspect benchmark trade-offs on the{' '}
              <Link href="/leaderboard" className="font-medium text-slate-950 underline underline-offset-2">
                leaderboard
              </Link>
              .
            </p>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
