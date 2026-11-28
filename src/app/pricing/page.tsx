import type { Metadata } from 'next';
import Link from 'next/link';
import { ALL_MODELS } from '../../lib/catalog';
import { SiteShell } from '../../components/SiteShell';
import { PricingHubClient } from '../../components/PricingHubClient';
import { CheckCircle2, ArrowUpRight, ShieldCheck } from 'lucide-react';

const BASE_URL = 'https://promptbill.online';

const PRICING_TITLE =
  'LLM API Token Pricing — Input, Cached, Output & Blended Rates per 1M | PromptBill';
const PRICING_DESCRIPTION =
  'Compare LLM API pricing per 1 million tokens across official APIs and inference hosts, filter by tier, provider, or prompt cache hit rate, and estimate 30-day spend.';

export const metadata: Metadata = {
  title: {
    absolute: PRICING_TITLE,
  },
  description: PRICING_DESCRIPTION,
  alternates: {
    canonical: `${BASE_URL}/pricing`,
  },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/pricing`,
    siteName: 'PromptBill',
    title: PRICING_TITLE,
    description: PRICING_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: PRICING_TITLE,
    description: PRICING_DESCRIPTION,
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
    (acc, m) => acc + (Array.isArray(m.hostingEndpoints) ? m.hostingEndpoints.length : 1),
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
        '@id': `${BASE_URL}/pricing#webpage`,
        url: `${BASE_URL}/pricing`,
        name: PRICING_TITLE,
        description: PRICING_DESCRIPTION,
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
            name: 'API Token Pricing',
            item: `${BASE_URL}/pricing`,
          },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'PromptBill LLM API Token Pricing Directory',
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
            name: 'How does blended cost per 1M tokens differ from input-only LLM pricing?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Blended cost per 1M tokens weights input tokens (adjusted for prompt cache hit share) and output tokens according to your workload ratio, preventing low input prices from masking expensive output or uncached token bills.',
            },
          },
          {
            '@type': 'Question',
            name: 'Why do some LLM pricing rows show N/A or Estimated on PromptBill?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'PromptBill labels rates as Verified when backed by a primary source check and Estimated when unverified, and displays N/A when a specific token rate or metric is unavailable rather than substituting zero.',
            },
          },
        ],
      },
    ],
  };

  return (
    <SiteShell hidePageHeader>
      <div className="space-y-8 pb-8">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Answer-First Editorial Hero & Telemetry Bar */}
        <header className="space-y-6 border-b border-slate-200 pb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-700/25 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-950">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-800" />
              <span>
                {ALL_MODELS.length} Models · {providerCount} Providers · {endpointCount} Endpoints
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
              <Link
                href="/#estimator"
                className="text-emerald-950 hover:underline underline-offset-4"
              >
                30-Day Spend Calculator →
              </Link>
              <Link
                href="/leaderboard"
                className="text-slate-800 hover:text-slate-950 hover:underline underline-offset-4"
              >
                Benchmark Leaderboard →
              </Link>
              <Link
                href="/compare"
                className="text-slate-800 hover:text-slate-950 hover:underline underline-offset-4"
              >
                Compare Models →
              </Link>
            </div>
          </div>

          <div className="max-w-4xl space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-slate-950 leading-[1.12]">
              LLM API Token Pricing &amp; Multi-Endpoint Rates
            </h1>
            <p className="text-sm sm:text-base font-medium text-slate-700 leading-relaxed">
              Compare normalized USD rates per 1,000,000 input, cached read, output, and blended tokens across official APIs and inference clouds. Adjust prompt cache hit share and output mix to rank models by real workload cost.
            </p>
          </div>

          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-200 pt-5 list-none m-0 p-0 text-xs">
            <li>
              <div className="font-semibold text-slate-700">Tracked Models</div>
              <div className="mt-1 font-mono text-xl sm:text-2xl font-extrabold text-slate-950">
                {ALL_MODELS.length}
              </div>
            </li>
            <li className="sm:border-l sm:border-slate-200 sm:pl-5">
              <div className="font-semibold text-slate-700">Verified Pricing</div>
              <div className="mt-1 font-mono text-xl sm:text-2xl font-extrabold text-emerald-900">
                {verifiedCount}
              </div>
            </li>
            <li className="sm:border-l sm:border-slate-200 sm:pl-5">
              <div className="font-semibold text-slate-700">Hosting Endpoints</div>
              <div className="mt-1 font-mono text-xl sm:text-2xl font-extrabold text-slate-950">
                {endpointCount}
              </div>
            </li>
            <li className="sm:border-l sm:border-slate-200 sm:pl-5">
              <div className="font-semibold text-slate-700">Unit Standard</div>
              <div className="mt-1 font-mono text-xl sm:text-2xl font-extrabold text-slate-950">
                USD / 1M
              </div>
            </li>
          </ul>

          {/* Provenance Notice */}
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs sm:text-sm text-amber-950 leading-relaxed">
            <strong>Provenance Notice:</strong> Values marked <strong>Estimated</strong> lack a verified primary source URL or check timestamp in the current catalog snapshot and must not be treated as verified official provider quotes. Missing values show <strong>N/A</strong>. See{' '}
            <Link href="/methodology" className="font-bold underline">
              Methodology
            </Link>
            .
          </div>
        </header>

        {/* Interactive Multi-View Pricing Hub & Table */}
        <PricingHubClient models={ALL_MODELS} />

        {/* GEO & Methodology Section */}
        <section
          aria-labelledby="pricing-geo-guide"
          className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4 shadow-2xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="pricing-geo-guide" className="text-base sm:text-lg font-extrabold text-slate-950">
              Pricing Comparison Guide &amp; Provenance Standards
            </h2>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-950">
              <CheckCircle2 className="h-4 w-4 text-emerald-800" />
              Strict N/A &amp; Provenance Rules
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-950">Why Blended Cost Matters</h3>
              <p>
                A low input price can look cheaper on paper while higher output rates or lower prompt-cache hit rates raise total spend on generation-heavy or multi-turn workflows.
              </p>
            </div>
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-950">Official vs. Inference Endpoints</h3>
              <p>
                Switch between <strong>Cheapest Endpoint</strong> and <strong>First-Party API</strong> or filter by host to compare third-party inference clouds against direct provider endpoints.
              </p>
            </div>
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-950">Model &amp; Calculator Workflows</h3>
              <p>
                Open any model&apos;s{' '}
                <Link href="/models" className="font-bold text-emerald-950 underline underline-offset-2">
                  specs page
                </Link>{' '}
                or click <strong>Calc</strong> to model daily request volume, batch discounts, and 30-day spend.
              </p>
              <Link
                href="/#estimator"
                className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-950 hover:underline pt-1"
              >
                <span>Open 30-Day Calculator</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
