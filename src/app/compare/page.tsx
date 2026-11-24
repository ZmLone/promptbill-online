import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ALL_MODELS, getAutoComparisonPairs } from '../../lib/catalog';
import { SiteShell } from '../../components/SiteShell';
import { CompareHubClient } from '../../components/CompareHubClient';

export const metadata: Metadata = {
  title: 'Head-to-Head LLM Comparisons (A vs B) — Pricing, Speed & Benchmarks',
  description:
    'Compare tracked LLMs side by side across benchmark scores, official API token pricing per 1M tokens, context windows, and tokens per second on PromptBill.',
  alternates: {
    canonical: 'https://promptbill.online/compare',
  },
};

export default function CompareHubPage() {
  const allPairs = getAutoComparisonPairs(190);

  const faqItems = [
    {
      q: 'How should I interpret head-to-head model comparisons on PromptBill?',
      a: 'Compare official input, cached input, and output token prices per 1M tokens alongside available benchmark scores, context windows, and throughput (tok/s) for your specific prompt mix. Missing or unverified fields are shown as N/A rather than guessed.',
    },
    {
      q: 'Why do Model A vs. Model B and Model B vs. Model A resolve to one canonical comparison URL?',
      a: 'Each model pair uses a single canonical comparison slug so search indexing and comparison links remain consistent while allowing visitors to inspect both models side by side.',
    },
    {
      q: 'Does a lower per-token price or higher benchmark score guarantee the best result for my app?',
      a: 'No. Actual cost and output quality depend on your prompt structure, token lengths, caching behavior, and task evaluation on your own test cases.',
    },
  ];

  const collectionAndFaqJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: 'PromptBill Head-to-Head LLM Comparison Hub',
        url: 'https://promptbill.online/compare',
        description:
          'Directory of head-to-head LLM matchups comparing benchmark scores, official API pricing, context windows, and throughput.',
      },
      {
        '@type': 'ItemList',
        name: 'Head-to-Head LLM Matchups',
        itemListElement: allPairs.slice(0, 12).map((pair, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: `${pair.modelA.name} vs ${pair.modelB.name}`,
          url: `https://promptbill.online/compare/${pair.slug}`,
        })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqItems.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.a,
          },
        })),
      },
    ],
  };

  return (
    <SiteShell
      title="Head-to-Head LLM Comparisons (A vs B)"
      subtitle="promptbill.online/compare · Official API Pricing, Benchmarks & Speed"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionAndFaqJsonLd) }}
      />

      <div className="space-y-4 sm:space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-6">
          <details className="group">
            <summary className="cursor-pointer min-h-[36px] flex items-center justify-between gap-2 text-sm sm:text-lg font-bold text-slate-900 list-none">
              <span>How PromptBill Structures Head-to-Head LLM Comparisons</span>
              <span className="text-xs font-semibold text-emerald-800 group-open:hidden">Read notes</span>
              <span className="hidden text-xs font-semibold text-slate-600 group-open:inline">Hide</span>
            </summary>
            <p className="mt-2.5 text-[13px] sm:text-sm text-slate-700 leading-relaxed">
              Every comparison page pairs two models from the PromptBill catalog across official input, cached input, and output token pricing per 1M tokens, context window, recorded throughput (tok/s), and benchmark metrics where available. Unverified or missing fields are displayed as N/A rather than filled in with synthetic defaults. See{' '}
              <Link href="/methodology" className="font-semibold text-emerald-800 underline">
                Methodology
              </Link>{' '}
              for provenance details and workload caveats.
            </p>
          </details>
        </section>

        <CompareHubClient models={ALL_MODELS} pairs={allPairs} />

        <section
          aria-labelledby="comparison-takeaways-heading"
          className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 space-y-4 sm:space-y-5"
        >
          <div className="space-y-2">
            <h2
              id="comparison-takeaways-heading"
              className="text-base sm:text-lg font-bold text-slate-900"
            >
              Comparison Notes &amp; Limitations
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-[13px] sm:text-sm text-slate-800 leading-relaxed">
              <li>
                <strong>Official vs. Router Rates:</strong> Head-to-head pages reference each model&apos;s official API pricing fields where recorded; third-party router or inference host rates can differ.
              </li>
              <li>
                <strong>Workload Sensitivity:</strong> Monthly spend depends on your input-to-output token ratio, prompt caching behavior, retries, and batch usage rather than list price alone.
              </li>
              <li>
                <strong>Speed &amp; Benchmark Caveats:</strong> Throughput (tok/s) and benchmark scores are workload-dependent and should be validated against your own prompts.
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Frequently Asked Questions About LLM Matchups
            </h3>
            <div className="space-y-2">
              {faqItems.map((item) => (
                <details
                  key={item.q}
                  className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-[13px] sm:text-sm"
                >
                  <summary className="cursor-pointer font-semibold text-slate-900 min-h-[28px] flex items-center">
                    {item.q}
                  </summary>
                  <p className="mt-2 text-slate-700 leading-relaxed">{item.a}</p>
                </details>
              ))}
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-3 text-xs font-semibold">
            <Link
              href="/pricing"
              className="inline-flex min-h-[40px] items-center text-emerald-800 underline"
            >
              View API Pricing -&gt;
            </Link>
            <Link
              href="/tools/routing-simulator"
              className="inline-flex min-h-[40px] items-center text-slate-800 underline"
            >
              Open Routing Simulator -&gt;
            </Link>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
