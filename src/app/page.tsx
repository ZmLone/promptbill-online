import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ALL_MODELS } from '../lib/catalog';
import { getRegistryFreshnessSummary } from '../lib/freshness';
import { formatCurrency } from '../lib/pricingEngine';

const HOME_TITLE = 'PromptBill — LLM API Pricing & Token Calculator';
const HOME_DESCRIPTION =
  'Compare LLM API token pricing per 1M tokens, estimate monthly API spend, inspect model benchmarks, and check provenance status across catalog models on PromptBill.';

export const metadata: Metadata = {
  title: {
    absolute: HOME_TITLE,
  },
  description: HOME_DESCRIPTION,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: 'https://promptbill.online',
    siteName: 'PromptBill',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
  },
};

function fmtRate(val: number | null): string {
  return typeof val === 'number' && Number.isFinite(val) ? formatCurrency(val) : 'N/A';
}

export default function HomePage() {
  const freshness = getRegistryFreshnessSummary();
  const featuredModels = ALL_MODELS.slice(0, 6);

  const webAppJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'PromptBill',
    url: 'https://promptbill.online',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    description: HOME_DESCRIPTION,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What does PromptBill help developers compare?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'PromptBill compares LLM API token rates per 1 million input, cached input, and output tokens alongside context windows, throughput metrics, and monthly cost estimates while separating verified records from estimated entries.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does PromptBill handle estimated or unverified pricing and benchmarks?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Records without verified primary citations or verification timestamps are labeled Estimated or Unavailable rather than presented as verified official quotes, and missing prices remain N/A instead of defaulting to zero.',
        },
      },
    ],
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8 space-y-7 sm:space-y-9 overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <section className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/70 to-emerald-50/30 p-5 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-800">
            promptbill.online · LLM API Cost &amp; Provenance Directory
          </span>
          <span className="font-mono text-[11px] sm:text-xs text-slate-600">
            {freshness.totalModels} models · {freshness.verifiedPricingCount} verified · {freshness.estimatedPricingCount} estimated
          </span>
        </div>

        <div className="space-y-3 max-w-3xl">
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
            LLM API Pricing, Cost Estimation &amp; Model Benchmarks
          </h1>
          <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
            PromptBill helps engineers compare per-1M-token input, cached, and output rates, context limits, benchmark scores, and monthly spend estimates across {freshness.totalModels} catalog models with explicit provenance labels so estimated numbers are never mistaken for verified quotes.
          </p>
        </div>

        <nav aria-label="Primary quick actions" className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 sm:gap-3 pt-1">
          <Link
            href="/pricing"
            className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 transition-colors text-center"
          >
            Pricing Table
          </Link>
          <Link
            href="/leaderboard"
            className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors text-center"
          >
            Leaderboard
          </Link>
          <Link
            href="/compare"
            className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors text-center"
          >
            Compare Models
          </Link>
          <Link
            href="/tools/token-counter"
            className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors text-center"
          >
            Token Counter
          </Link>
          <Link
            href="/tools/llm-selector"
            className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors text-center"
          >
            LLM Selector
          </Link>
          <Link
            href="/tools/routing-simulator"
            className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors text-center"
          >
            Routing Simulator
          </Link>
        </nav>
      </section>

      <section aria-labelledby="key-tools-heading" className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="key-tools-heading" className="text-lg sm:text-xl font-bold text-slate-900">
            Core Workflows &amp; Calculators
          </h2>
          <Link href="/methodology" className="text-xs sm:text-sm font-semibold text-slate-700 underline underline-offset-4">
            Provenance Methodology
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/pricing"
            className="group rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-400 hover:shadow-xs transition-all space-y-2"
          >
            <h3 className="text-base font-bold text-slate-900 group-hover:underline">
              Token Rate Comparison
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              Inspect input, cached read, and output rates per 1M tokens side by side with clear Verified, Estimated, and Unavailable status labels.
            </p>
          </Link>

          <Link
            href="/tools/llm-selector"
            className="group rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-400 hover:shadow-xs transition-all space-y-2"
          >
            <h3 className="text-base font-bold text-slate-900 group-hover:underline">
              Model Selector &amp; Routing
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              Match models to coding, reasoning, classification, or high-throughput workloads using context windows, token counters, and routing simulators.
            </p>
          </Link>

          <Link
            href="/best-llms-for-coding"
            className="group rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-400 hover:shadow-xs transition-all space-y-2"
          >
            <h3 className="text-base font-bold text-slate-900 group-hover:underline">
              Curated Shortlists &amp; Benchmarks
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              Explore focused views for coding, open-weight models, classification, and throughput while separating verified records from estimates.
            </p>
          </Link>
        </div>
      </section>

      <section aria-labelledby="catalog-preview-heading" className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="space-y-0.5">
            <h2 id="catalog-preview-heading" className="text-lg sm:text-xl font-bold text-slate-900">
              Catalog Snapshot ({ALL_MODELS.length} Models)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Open any model page to adjust call volume, cache hit rate, and batch settings in the 30-day cost calculator.
            </p>
          </div>
          <Link href="/models" className="text-xs sm:text-sm font-semibold text-slate-800 underline underline-offset-4">
            All {ALL_MODELS.length} models -&gt;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredModels.map((m) => (
            <Link
              key={m.id}
              href={`/models/${m.slug}`}
              className="group rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 hover:border-slate-400 hover:shadow-xs transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-xs text-slate-600">
                  <span className="truncate font-medium">{m.provider}</span>
                  <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-800">
                    {m.pricingProvenance.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:underline">
                  {m.name}
                </h3>
              </div>

              <dl className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-xs">
                <div>
                  <dt className="text-slate-500">Input / 1M</dt>
                  <dd className="font-mono font-semibold text-slate-900">{fmtRate(m.inputPer1M)}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Output / 1M</dt>
                  <dd className="font-mono font-semibold text-slate-900">{fmtRate(m.outputPer1M)}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Context</dt>
                  <dd className="font-mono font-semibold text-slate-900">{m.contextWindow ?? 'N/A'}</dd>
                </div>
              </dl>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="home-faq-heading" className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4">
        <h2 id="home-faq-heading" className="text-lg font-bold text-slate-900">
          Frequently Asked Questions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-700">
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-1.5">
            <h3 className="font-semibold text-slate-900">What is PromptBill?</h3>
            <p className="leading-relaxed">
              PromptBill is an LLM API token cost comparison and estimation directory showing per-million-token rates, context windows, model comparisons, and provenance status.
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-1.5">
            <h3 className="font-semibold text-slate-900">Why are some figures marked Estimated?</h3>
            <p className="leading-relaxed">
              When a model entry does not yet have a verified primary citation or verification date in the snapshot, PromptBill marks it Estimated or N/A rather than presenting it as a verified official quote.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
