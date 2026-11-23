import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ALL_MODELS, getAutoComparisonPairs } from '../../lib/catalog';
import { SiteShell } from '../../components/SiteShell';
import { CompareHubClient } from '../../components/CompareHubClient';

export const metadata: Metadata = {
  title: 'Head-to-Head LLM Comparisons (A vs B) — Benchmarks, Pricing & Speed',
  description:
    'Compare LLMs head-to-head across benchmark scores, Elo ratings, 3:1 blended API pricing, prompt caching, and tokens/sec on PromptBill.',
  alternates: {
    canonical: 'https://promptbill.online/compare',
  },
};

export default function CompareHubPage() {
  const allPairs = getAutoComparisonPairs(190);

  const faqItems = [
    {
      q: 'How does PromptBill calculate head-to-head API cost differences?',
      a: 'PromptBill evaluates blended token cost using a realistic 3:1 input-to-output token mix alongside raw per-1M input and output rates, cached input discounts, batch API pricing, and tokens-per-second throughput so engineers can compare total workload cost rather than headline sticker price alone.',
    },
    {
      q: 'Why do Model A vs. Model B and Model B vs. Model A share one canonical URL?',
      a: 'To prevent duplicate content and split ranking signals, every model pair resolves to a single canonical comparison slug ordered by higher benchmark rank first, while supporting instant model swapping inside the comparison tool.',
    },
    {
      q: 'Which LLMs lead flagship reasoning and budget coding in November 2026?',
      a: 'On PromptBill rankings, Claude Fable 5.2 leads composite intelligence (93.3), Gemini 4 Neon (91.3) and GPT-6.2 Astra compete at the frontier tier, while DeepSeek V4.1 Flash, Qwen 3.7 Flash, Claude Sonnet 5.5, and Gemini 4 Carbon anchor high-value coding and cost-efficient workloads.',
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
          'Directory of head-to-head LLM matchups comparing composite scores, category benchmarks, Elo ratings, blended API costs, and output speed.',
      },
      {
        '@type': 'ItemList',
        name: 'Top Curated Head-to-Head LLM Matchups',
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
      subtitle="promptbill.online/compare · Benchmarks, 3:1 Blended Pricing, Elo & Speed"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionAndFaqJsonLd) }}
      />

      <div className="space-y-6">
        {/* Server-rendered 150-200 word editorial methodology intro to prevent thin/link-farm signals */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            How PromptBill Evaluates Head-to-Head LLM Matchups
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Choosing between two frontier or open-weight models requires looking beyond a single benchmark headline. On PromptBill, every head-to-head comparison pairs composite benchmark scores and Elo ratings with granular category signals across agentic workflows (AG), coding (CO), reasoning (RE), multimodal tasks (MM), knowledge (KN), multilingual coverage (ML), instruction following (IF), and math (MA). Because real production prompts typically generate fewer output tokens than input tokens, our cost analysis highlights both raw per-1M input/output token rates and a 3:1 input-to-output blended pricing baseline alongside generation speed in tokens per second (tok/s). Comparing two models side by side helps engineering teams spot cases where a slightly lower-priced or faster model matches quality requirements at a fraction of monthly API spend, while reserving flagship reasoning models for high-complexity tasks. To keep search equity consolidated, each pair maps to one canonical matchup URL while letting you swap Model A and Model B immediately.
          </p>
        </section>

        {/* Interactive Picker, Curated Intent Cards & Full Crawlable Matchup Directory */}
        <CompareHubClient models={ALL_MODELS} pairs={allPairs} />

        {/* GEO: Key Comparison Takeaways + FAQ Section */}
        <section aria-labelledby="comparison-takeaways-heading" className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 space-y-5">
          <div className="space-y-2">
            <h2 id="comparison-takeaways-heading" className="text-lg font-bold text-slate-900">
              Key Comparison Takeaways (November 2026)
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-800 leading-relaxed">
              <li>
                <strong>Frontier Intelligence vs. Cost:</strong> Claude Fable 5.2 leads overall composite score (93.3) at $8.00/$40.00 per 1M tokens and 109 tok/s, while Gemini 4 Neon (91.3) and GPT-6.2 Astra compete closely at the top end.
              </li>
              <li>
                <strong>Budget Coding &amp; High-Volume Pipelines:</strong> DeepSeek V4.1 Flash and Qwen 3.7 Flash deliver dramatic token cost reductions for high-throughput tasks, whereas Claude Sonnet 5.5 and Gemini 4 Carbon balance strong coding/reasoning with moderate pricing.
              </li>
              <li>
                <strong>Latency &amp; Throughput Trade-Offs:</strong> High-speed models (150+ tok/s) cut streaming wait times in interactive agents and voice/UI pipelines, whereas higher output token prices multiply bills fast on verbose generations.
              </li>
              <li>
                <strong>Single Canonical Matchups:</strong> Every A-vs-B and B-vs-A pair resolves to one canonical comparison page so benchmarks, pricing tables, and calculator inputs stay unified.
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h3 className="text-base font-bold text-slate-900">
              Frequently Asked Questions About LLM Matchups
            </h3>
            <div className="space-y-2.5">
              {faqItems.map((item) => (
                <details key={item.q} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5 text-xs sm:text-sm">
                  <summary className="cursor-pointer font-semibold text-slate-900 min-h-[28px] flex items-center">
                    {item.q}
                  </summary>
                  <p className="mt-2 text-slate-700 leading-relaxed">{item.a}</p>
                </details>
              ))}
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-3 text-xs font-semibold">
            <Link href="/pricing" className="inline-flex min-h-[40px] items-center text-emerald-800 underline">
              Open Full API Cost Calculator -&gt;
            </Link>
            <Link href="/tools/routing-simulator" className="inline-flex min-h-[40px] items-center text-slate-800 underline">
              Simulate Hybrid Routing Savings -&gt;
            </Link>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
