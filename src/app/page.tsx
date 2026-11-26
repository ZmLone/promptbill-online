import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ALL_MODELS } from '../lib/catalog';
import { getRegistryFreshnessSummary } from '../lib/freshness';
import { formatCurrency } from '../lib/pricingEngine';
import { SiteShell } from '../components/SiteShell';
import { HomeInteractiveWorkbench } from '../components/HomeInteractiveWorkbench';
import {
  Table2,
  Trophy,
  Scale,
  FileText,
  SlidersHorizontal,
  GitBranch,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';

const HOME_TITLE = 'PromptBill — LLM API Pricing & Token Calculator';
const HOME_DESCRIPTION =
  'Compare LLM API token pricing per 1M tokens, estimate 30-day API spend with caching and batch discounts, and inspect model benchmarks.';

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

const CORE_TOOLS = [
  {
    href: '/pricing',
    title: 'API Token Pricing Table',
    badge: 'Per 1M Tokens',
    description:
      'Compare input, cached read, and output rates across tracked models with clear Verified, Estimated, and Unavailable provenance labels.',
    icon: Table2,
  },
  {
    href: '/leaderboard',
    title: 'Benchmark Leaderboard',
    badge: 'Scores & Value',
    description:
      'Sort models by benchmark score, coding (CO), reasoning (RE), output speed (tok/s), and score-per-dollar efficiency.',
    icon: Trophy,
  },
  {
    href: '/compare',
    title: 'Head-to-Head Compare',
    badge: 'Side-by-Side',
    description:
      'Evaluate two or more LLMs side by side across token pricing, context window capacity, domain scores, and endpoint options.',
    icon: Scale,
  },
  {
    href: '/tools/token-counter',
    title: 'Live Prompt Tokenizer',
    badge: 'Token & Cost',
    description:
      'Paste real prompts or system instructions to estimate token counts and per-request spend across model families.',
    icon: FileText,
  },
  {
    href: '/tools/llm-selector',
    title: 'Interactive LLM Selector',
    badge: 'Task & Budget',
    description:
      'Filter models by workload type, monthly budget cap, minimum context window, and open-weight vs closed license.',
    icon: SlidersHorizontal,
  },
  {
    href: '/tools/routing-simulator',
    title: 'Hybrid Routing Simulator',
    badge: 'Cost Savings',
    description:
      'Simulate splitting routine requests to economy models while reserving flagship models for complex reasoning calls.',
    icon: GitBranch,
  },
];

const SHORTLIST_LINKS = [
  { href: '/best-llms-for-coding', label: 'Coding Model Rankings' },
  { href: '/best-open-weight-llms', label: 'Open-Weight Model Directory' },
  { href: '/cheapest-llms-for-classification', label: 'Low-Cost Classification Models' },
  { href: '/fastest-llms-tokens-per-second', label: 'High-Throughput Models (tok/s)' },
  { href: '/models', label: 'Models' },
  { href: '/methodology', label: 'Data Provenance Methodology' },
];

export default function HomePage() {
  const freshness = getRegistryFreshnessSummary();
  const featuredModels = ALL_MODELS.slice(0, 8);

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
        name: 'What does PromptBill offer developers and AI teams?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'PromptBill provides an LLM API token pricing table, 30-day API cost estimator with prompt caching and batch discounts, benchmark leaderboard, head-to-head model comparisons, prompt token counter, model selector, and hybrid routing simulator.',
        },
      },
      {
        '@type': 'Question',
        name: 'How are LLM API costs calculated on PromptBill?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'PromptBill calculates monthly spend from daily request volume, input tokens, cached input read share, output tokens, and model-specific batch discounts per 1 million tokens. When a price is unavailable, it displays N/A rather than zero.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does PromptBill separate verified pricing from estimates?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Every pricing and benchmark record carries an explicit provenance status: Verified when backed by a primary source citation and check date, Estimated when unverified, and Unavailable when data is missing.',
        },
      },
    ],
  };

  return (
    <SiteShell
      title="LLM API Pricing, Token Cost Calculator & Benchmarks"
      subtitle={`promptbill.online · ${freshness.totalModels} Models Tracked · Transparent Provenance`}
    >
      <div className="space-y-8">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />

        <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50/80 to-emerald-50/40 p-5 sm:p-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-semibold text-emerald-900">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
              Per-1M-Token Rates · Caching &amp; Batch Math · Benchmark Value
            </span>
            <span className="font-mono text-slate-600">
              Catalog: {freshness.totalModels} models · {freshness.verifiedPricingCount} verified ·{' '}
              {freshness.estimatedPricingCount} estimated
            </span>
          </div>

          <p className="max-w-3xl text-sm sm:text-base text-slate-700 leading-relaxed">
            <strong>PromptBill</strong> helps developers and AI engineering teams estimate monthly LLM API bills, compare input, cached, and output token rates, and evaluate model benchmarks side by side—with clear provenance badges so unverified estimates are never confused with verified provider quotes.
          </p>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2.5 pt-1">
            <Link
              href="/pricing"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-emerald-700 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-800 transition-colors"
            >
              Explore Token Rates
            </Link>
            <Link
              href="/leaderboard"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              View Model Rankings
            </Link>
            <Link
              href="/compare"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
            >
              Compare Two LLMs
            </Link>
            <Link
              href="/models"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
            >
              Models
            </Link>
          </div>
        </section>

        <HomeInteractiveWorkbench models={ALL_MODELS} />

        <section aria-labelledby="platform-tools-heading" className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 id="platform-tools-heading" className="text-lg sm:text-xl font-bold text-slate-900">
                What You Can Do on PromptBill
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Six focused tools for pricing transparency, token estimation, and model selection.
              </p>
            </div>
            <Link
              href="/methodology"
              className="text-xs sm:text-sm font-semibold text-emerald-800 underline underline-offset-4"
            >
              Provenance Rules
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CORE_TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <article
                  key={tool.href}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 hover:border-emerald-600/60 hover:shadow-xs transition-all flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-800 group-hover:bg-emerald-50 group-hover:text-emerald-800 transition-colors">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                        {tool.badge}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      <Link
                        href={tool.href}
                        className="inline-flex items-center justify-between gap-1.5 group-hover:text-emerald-900 hover:underline"
                      >
                        <span>{tool.title}</span>
                        <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-700 shrink-0" />
                      </Link>
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {tool.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section
          aria-labelledby="curated-views-heading"
          className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="curated-views-heading" className="text-base sm:text-lg font-bold text-slate-900">
              Curated Shortlists &amp; Directory Views
            </h2>
            <span className="text-xs text-slate-500">Direct task-based rankings</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SHORTLIST_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex min-h-[40px] items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-800 hover:border-emerald-600 hover:bg-emerald-50/60 hover:text-emerald-950 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="catalog-snapshot-heading" className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 id="catalog-snapshot-heading" className="text-lg sm:text-xl font-bold text-slate-900">
                Catalog Pricing &amp; Context Snapshot
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Select any model to open its dedicated calculator, endpoint table, and capability scores.
              </p>
            </div>
            <Link
              href="/pricing"
              className="text-xs sm:text-sm font-semibold text-emerald-800 underline underline-offset-4"
            >
              Full {ALL_MODELS.length}-Model Rate Table
            </Link>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <caption className="sr-only">
                Sample LLM API rates per 1 million tokens and context windows on PromptBill
              </caption>
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
                  <th scope="col" className="py-3 px-3.5 sm:px-4">Model</th>
                  <th scope="col" className="py-3 px-3 hidden sm:table-cell">Provenance</th>
                  <th scope="col" className="py-3 px-3">Input / 1M</th>
                  <th scope="col" className="py-3 px-3 hidden md:table-cell">Cached / 1M</th>
                  <th scope="col" className="py-3 px-3">Output / 1M</th>
                  <th scope="col" className="py-3 px-3.5 sm:px-4 text-right">Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {featuredModels.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <th scope="row" className="py-3 px-3.5 sm:px-4 text-left font-normal">
                      <Link
                        href={`/models/${m.slug}`}
                        className="font-semibold text-slate-900 hover:text-emerald-800 hover:underline"
                      >
                        {m.name}
                      </Link>
                      <span className="block text-[11px] sm:text-xs text-slate-500">
                        {m.provider}
                        <span className="sm:hidden"> · {m.pricingProvenance.status}</span>
                      </span>
                    </th>
                    <td className="py-3 px-3 hidden sm:table-cell">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          m.pricingProvenance.status === 'Verified'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-900 border border-amber-200'
                        }`}
                      >
                        {m.pricingProvenance.status === 'Verified'
                          ? 'Verified'
                          : 'Estimated (Unverified)'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-900">{fmtRate(m.inputPer1M)}</td>
                    <td className="py-3 px-3 font-mono text-emerald-800 hidden md:table-cell">
                      {fmtRate(m.cachedInputPer1M)}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-900">{fmtRate(m.outputPer1M)}</td>
                    <td className="py-3 px-3.5 sm:px-4 font-mono text-right text-slate-700">
                      {m.contextWindow ?? 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section
          aria-labelledby="home-faq-heading"
          className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4"
        >
          <h2 id="home-faq-heading" className="text-lg font-bold text-slate-900">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm text-slate-700">
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-1.5">
              <h3 className="font-semibold text-slate-900">What does PromptBill offer?</h3>
              <p className="leading-relaxed">
                PromptBill combines an API token pricing table, 30-day cost calculator, benchmark leaderboard, model comparison tool, prompt tokenizer, and routing simulator in one directory.
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-1.5">
              <h3 className="font-semibold text-slate-900">How are monthly costs estimated?</h3>
              <p className="leading-relaxed">
                Estimates multiply daily calls over 30 days using each model&apos;s per-1M-token input, cached read, and output rates plus batch discounts where available.
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-1.5">
              <h3 className="font-semibold text-slate-900">How are official provider rates verified?</h3>
              <p className="leading-relaxed">
                Verified entries cross-check primary provider rate cards such as{' '}
                <a
                  href="https://platform.openai.com/docs/pricing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-emerald-800 underline underline-offset-2"
                >
                  OpenAI API Pricing Docs
                </a>{' '}
                and{' '}
                <a
                  href="https://docs.anthropic.com/en/docs/about-claude/pricing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-emerald-800 underline underline-offset-2"
                >
                  Anthropic Claude Pricing Docs
                </a>
                ; unverified entries remain clearly labeled Estimated.
              </p>
            </div>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
