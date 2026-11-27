import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ALL_MODELS, getAllProviderSlugs } from '../lib/catalog';
import { getRegistryFreshnessSummary } from '../lib/freshness';
import { formatCurrency } from '../lib/pricingEngine';
import { getEffectiveModelRates } from '../lib/endpointPricing';
import { SiteShell } from '../components/SiteShell';
import { HomeInteractiveWorkbench } from '../components/HomeInteractiveWorkbench';
import { ProviderLogo } from '../components/ProviderLogo';
import {
  Table2,
  Trophy,
  Scale,
  FileText,
  SlidersHorizontal,
  GitBranch,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Sparkles,
  Layers,
  CheckCircle2,
  Clock,
} from 'lucide-react';

const HOME_TITLE = 'PromptBill — LLM API Pricing, Multi-Endpoint Rates & Token Calculator';
const HOME_DESCRIPTION =
  'Compare verified LLM API token prices per 1M tokens across official APIs and third-party inference clouds, estimate 30-day spend with caching and batch discounts, and track new model releases.';

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

function fmtRate(val: number | null | undefined): string {
  return typeof val === 'number' && Number.isFinite(val) ? formatCurrency(val) : 'N/A';
}

function formatReleaseDate(raw?: string): string {
  if (!raw) return '2026';
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw.slice(0, 10);
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const CORE_TOOLS = [
  {
    href: '/pricing',
    title: 'API Token Pricing Table',
    badge: 'Multi-Endpoint',
    description:
      'Compare input, cached read, cache write, and output rates across official APIs, routers, and cloud hosts.',
    icon: Table2,
  },
  {
    href: '/leaderboard',
    title: 'Benchmark Leaderboard',
    badge: 'Quality & Speed',
    description:
      'Rank LLMs by overall score, coding (CO), reasoning (RE), latency (<175ms), throughput (tok/s), and value.',
    icon: Trophy,
  },
  {
    href: '/compare',
    title: 'Head-to-Head Compare',
    badge: 'A vs B Matrix',
    description:
      'Evaluate two models side by side across token rates, context limits, domain scores, and hosting endpoints.',
    icon: Scale,
  },
  {
    href: '/tools/token-counter',
    title: 'Live Prompt Tokenizer',
    badge: 'Instant Count',
    description:
      'Paste real prompts or system instructions to estimate token counts and per-request spend across model families.',
    icon: FileText,
  },
  {
    href: '/tools/llm-selector',
    title: 'Interactive LLM Selector',
    badge: 'Workload Match',
    description:
      'Filter models by task domain, monthly budget cap, context window, latency tier, and open-weight license.',
    icon: SlidersHorizontal,
  },
  {
    href: '/tools/routing-simulator',
    title: 'Hybrid Routing Simulator',
    badge: 'Spend Optimization',
    description:
      'Model traffic splits between fast economy models and frontier reasoning models to cut monthly API bills.',
    icon: GitBranch,
  },
];

const CURATED_HUBS = [
  {
    href: '/best-llms-for-coding',
    title: 'Best LLMs for Coding',
    subtitle: 'Ranked by CO benchmark & repository agent efficiency',
  },
  {
    href: '/best-open-weight-llms',
    title: 'Open-Weight Directory',
    subtitle: 'MIT & Apache 2.0 weights across inference clouds',
  },
  {
    href: '/cheapest-llms-for-classification',
    title: 'Lowest-Cost Classification',
    subtitle: 'Sub-$0.20/M input models for high-volume pipelines',
  },
  {
    href: '/fastest-llms-tokens-per-second',
    title: 'Highest Throughput (tok/s)',
    subtitle: 'Low-latency & high-tok/s endpoints for real-time UX',
  },
];

export default function HomePage() {
  const freshness = getRegistryFreshnessSummary();
  const providers = getAllProviderSlugs();

  const totalEndpoints = ALL_MODELS.reduce(
    (sum, m) => sum + (Array.isArray(m.hostingEndpoints) ? m.hostingEndpoints.length : 1),
    0
  );

  // Newest models timeline ordered by pricingProvenance.lastVerified timestamp
  const newModelsTimeline = [...ALL_MODELS]
    .sort((a, b) => {
      const dateA = a.pricingProvenance?.lastVerified ?? '';
      const dateB = b.pricingProvenance?.lastVerified ?? '';
      return dateB.localeCompare(dateA);
    })
    .slice(0, 6);

  // Representative snapshot across flagship, balanced, and economy tiers
  const snapshotModels = (() => {
    const preferredSlugs = [
      'gpt-6-2-astra',
      'claude-fable-5-2',
      'gemini-4-argon',
      'claude-sonnet-5-5',
      'gpt-6-2-sol',
      'kimi-k3-1-pro',
      'deepseek-v4-1-flash',
      'mistral-large-4-0',
      'gemini-4-hydrogen',
      'qwen-3-7-flash',
    ];
    const picked: typeof ALL_MODELS = [];
    for (const slug of preferredSlugs) {
      const found = ALL_MODELS.find((m) => m.slug === slug);
      if (found) picked.push(found);
    }
    if (picked.length < 10) {
      for (const m of ALL_MODELS) {
        if (!picked.some((p) => p.slug === m.slug)) {
          picked.push(m);
        }
        if (picked.length >= 10) break;
      }
    }
    return picked;
  })();

  const topBenchmarkLeaders = [...ALL_MODELS]
    .filter((m) => typeof m.score === 'number')
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 3);

  const topValueLeaders = [...ALL_MODELS]
    .filter(
      (m) =>
        typeof m.score === 'number' &&
        typeof m.outputPer1M === 'number' &&
        m.outputPer1M > 0
    )
    .sort((a, b) => (b.score ?? 0) / (b.outputPer1M ?? 1) - (a.score ?? 0) / (a.outputPer1M ?? 1))
    .slice(0, 3);

  const topSpeedLeaders = [...ALL_MODELS]
    .map((m) => ({
      model: m,
      effective: getEffectiveModelRates(m, 'cheapest'),
    }))
    .filter((item) => typeof item.effective.tokPerSec === 'number')
    .sort((a, b) => (b.effective.tokPerSec ?? 0) - (a.effective.tokPerSec ?? 0))
    .slice(0, 3);

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
          text: 'PromptBill provides a multi-endpoint LLM API token pricing table, 30-day API cost estimator with prompt caching and batch discounts, benchmark leaderboard, head-to-head model comparisons, prompt token counter, model selector, and hybrid routing simulator.',
        },
      },
      {
        '@type': 'Question',
        name: 'How are LLM API costs calculated on PromptBill?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'PromptBill calculates monthly spend from daily request volume, input tokens, cached input read share, output tokens, and endpoint-specific batch discounts per 1 million tokens. When a rate is unavailable, it displays N/A rather than zero.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does PromptBill separate verified pricing from estimates?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Every pricing and benchmark record carries an explicit provenance status: Verified when backed by a primary source citation and verification timestamp, Estimated when unverified, and Unavailable when data is missing.',
        },
      },
    ],
  };

  return (
    <SiteShell hidePageHeader>
      <div className="space-y-16 sm:space-y-24">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />

        {/* Hero — Open Editorial Layout (No Boxiness) */}
        <section className="pt-2 sm:pt-6 space-y-10">
          <div className="max-w-4xl space-y-5">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>
                {freshness.totalModels} Models · {totalEndpoints} Endpoints · Verified vs. Estimated Provenance
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight text-slate-950 leading-[1.08]">
              LLM API pricing, multi-endpoint rates &amp; token cost math.
            </h1>

            <p className="max-w-2xl text-base sm:text-lg text-slate-600 leading-relaxed">
              Compare per-1M-token rates across official provider APIs, inference clouds, and routers. Simulate prompt caching, batch discounts, and latency before deploying to production.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/pricing"
                className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
              >
                <span>Explore Token Rates</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href="/leaderboard"
                className="inline-flex min-h-[46px] items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
              >
                Benchmark Leaderboard
              </Link>
              <Link
                href="/compare"
                className="inline-flex min-h-[46px] items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold text-slate-700 hover:text-slate-950 transition-colors"
              >
                Compare Models →
              </Link>
            </div>
          </div>

          {/* Open Architectural Telemetry Strip (Hairline Dividers, Zero Heavy Boxes) */}
          <dl className="grid grid-cols-2 lg:grid-cols-4 gap-y-6 gap-x-8 border-y border-slate-200/80 py-6">
            <div>
              <dt className="text-xs font-medium text-slate-500">Tracked Models</dt>
              <dd className="mt-1 font-mono text-2xl sm:text-3xl font-bold text-slate-950">
                {freshness.totalModels}
              </dd>
              <p className="mt-0.5 text-xs text-slate-500">Across {providers.length} providers</p>
            </div>

            <div className="lg:border-l lg:border-slate-200/80 lg:pl-8">
              <dt className="text-xs font-medium text-slate-500">Verified Rate Cards</dt>
              <dd className="mt-1 font-mono text-2xl sm:text-3xl font-bold text-emerald-800">
                {freshness.verifiedPricingCount}
              </dd>
              <p className="mt-0.5 text-xs text-slate-500">
                {freshness.estimatedPricingCount} estimated · {freshness.unavailablePricingCount} N/A
              </p>
            </div>

            <div className="lg:border-l lg:border-slate-200/80 lg:pl-8">
              <dt className="text-xs font-medium text-slate-500">Hosting Endpoints</dt>
              <dd className="mt-1 font-mono text-2xl sm:text-3xl font-bold text-slate-950">
                {totalEndpoints}
              </dd>
              <p className="mt-0.5 text-xs text-slate-500">Official APIs, Clouds &amp; Routers</p>
            </div>

            <div className="lg:border-l lg:border-slate-200/80 lg:pl-8">
              <dt className="text-xs font-medium text-slate-500">Last Catalog Sync</dt>
              <dd className="mt-1 font-mono text-xl sm:text-2xl font-bold text-slate-950">
                {freshness.latestVerifiedDate
                  ? freshness.latestVerifiedDate.slice(0, 10)
                  : '2026-11-27'}
              </dd>
              <p className="mt-0.5 text-xs text-slate-500">
                <Link href="/methodology" className="text-emerald-800 font-semibold hover:underline">
                  Provenance rules →
                </Link>
              </p>
            </div>
          </dl>
        </section>

        {/* Standout Interactive 30-Day Spend & Endpoint Calculator */}
        <HomeInteractiveWorkbench models={ALL_MODELS} />

        {/* Creative Horizontal Release Rail — New Model Timeline */}
        <section aria-labelledby="new-models-timeline-heading" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800">
                <Clock className="h-3.5 w-3.5" />
                <span>Release Stream</span>
              </p>
              <h2
                id="new-models-timeline-heading"
                className="mt-1 text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950"
              >
                New Model Timeline
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Latest model drops and verified rate card updates across tracked AI labs.
              </p>
            </div>
            <Link
              href="/models"
              className="text-xs sm:text-sm font-semibold text-emerald-800 hover:text-emerald-950 underline underline-offset-4"
            >
              View All {ALL_MODELS.length} Models →
            </Link>
          </div>

          {/* Horizontal Timeline Track (Desktop) / Vertical Connected Rail (Mobile) */}
          <div className="relative">
            {/* Desktop Horizontal Track Line */}
            <div
              aria-hidden="true"
              className="hidden lg:block absolute top-[21px] inset-x-0 h-px bg-gradient-to-r from-emerald-500/60 via-slate-300 to-slate-200/40"
            />

            <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 lg:gap-4">
              {newModelsTimeline.map((m, idx) => {
                const eff = getEffectiveModelRates(m, 'cheapest');
                const dateLabel = formatReleaseDate(m.pricingProvenance?.lastVerified);
                const isLatest = idx === 0;
                return (
                  <li
                    key={m.id}
                    className="group relative pl-6 lg:pl-0 border-l lg:border-l-0 border-slate-200 space-y-3"
                  >
                    {/* Timeline Node & Date */}
                    <div className="flex items-center gap-2.5 lg:flex-col lg:items-start lg:gap-2">
                      <span
                        aria-hidden="true"
                        className={`-left-[5px] lg:left-0 absolute lg:relative flex h-2.5 w-2.5 rounded-full ring-4 ring-[#fbfbfd] ${
                          isLatest
                            ? 'bg-emerald-600 shadow-[0_0_0_3px_rgba(16,185,129,0.2)]'
                            : 'bg-slate-400 group-hover:bg-slate-950 transition-colors'
                        }`}
                      />
                      <div className="flex items-center gap-1.5">
                        <time className="font-mono text-[11px] font-semibold text-slate-500">
                          {dateLabel}
                        </time>
                        {isLatest && (
                          <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            New
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Clean Typographic Node Content (No Heavy Box) */}
                    <div className="space-y-1.5 pt-0.5">
                      <div className="flex items-center gap-2">
                        <ProviderLogo provider={m.provider} size="sm" />
                        <span className="text-[11px] font-medium text-slate-500 truncate">
                          {m.provider}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-950 leading-snug">
                        <Link
                          href={`/models/${m.slug}`}
                          className="group-hover:text-emerald-800 transition-colors"
                        >
                          {m.name}
                        </Link>
                      </h3>

                      <div className="font-mono text-xs text-slate-700 tabular-nums">
                        {fmtRate(eff.inputPer1M)} / {fmtRate(eff.outputPer1M)}
                        <span className="text-slate-400"> · 1M</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                        <span>{m.contextWindow ?? 'N/A'} ctx</span>
                        {typeof m.score === 'number' && (
                          <>
                            <span>·</span>
                            <span className="font-mono font-semibold text-slate-700">
                              {m.score.toFixed(1)} pts
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* Live Catalog Snapshot — Clean Hairline Table */}
        <section aria-labelledby="catalog-snapshot-heading" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Multi-Endpoint Rate Snapshot
              </p>
              <h2
                id="catalog-snapshot-heading"
                className="mt-1 text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950"
              >
                Frontier, Balanced &amp; Economy API Rates
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Lowest available endpoint rate alongside official host coverage and output speed.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs sm:text-sm font-semibold">
              <Link
                href="/models"
                className="text-slate-700 hover:text-slate-950 transition-colors"
              >
                Models Directory →
              </Link>
              <Link
                href="/pricing"
                className="text-emerald-800 hover:text-emerald-950 underline underline-offset-4"
              >
                All {ALL_MODELS.length} Models →
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto border-y border-slate-200/90 bg-white/60">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <caption className="sr-only">
                Representative LLM API rates per 1 million tokens, endpoint hosts, and throughput on PromptBill
              </caption>
              <thead className="sticky top-0 z-10 bg-[#fbfbfd]/95 backdrop-blur border-b border-slate-200 text-xs font-semibold text-slate-600">
                <tr>
                  <th scope="col" className="py-3.5 px-3 sm:px-4">Model</th>
                  <th scope="col" className="py-3.5 px-3 hidden lg:table-cell">Best Endpoint</th>
                  <th scope="col" className="py-3.5 px-3">Input / 1M</th>
                  <th scope="col" className="py-3.5 px-3 hidden md:table-cell">Cached / 1M</th>
                  <th scope="col" className="py-3.5 px-3">Output / 1M</th>
                  <th scope="col" className="py-3.5 px-3 hidden sm:table-cell text-right">Speed</th>
                  <th scope="col" className="py-3.5 px-3 sm:px-4 text-right">Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                {snapshotModels.map((m) => {
                  const eff = getEffectiveModelRates(m, 'cheapest');
                  const extraHosts = Math.max(0, eff.endpointCount - 1);
                  return (
                    <tr key={m.id} className="pb-clean-row">
                      <th scope="row" className="py-3.5 px-3 sm:px-4 text-left font-normal">
                        <div className="flex items-center gap-2.5">
                          <ProviderLogo provider={m.provider} size="sm" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/models/${m.slug}`}
                                className="font-bold text-slate-950 hover:text-emerald-800 hover:underline truncate"
                              >
                                {m.name}
                              </Link>
                              {m.license === 'Open' && (
                                <span className="hidden sm:inline-flex rounded-md bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                                  Open
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                              <span>{m.provider}</span>
                              <span>·</span>
                              <span
                                className={
                                  m.pricingProvenance.status === 'Verified'
                                    ? 'text-emerald-800 font-semibold'
                                    : 'text-amber-800 font-semibold'
                                }
                              >
                                {m.pricingProvenance.status}
                              </span>
                              {extraHosts > 0 && (
                                <span className="lg:hidden text-slate-500">
                                  · +{extraHosts} {extraHosts === 1 ? 'host' : 'hosts'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </th>

                      <td className="py-3.5 px-3 hidden lg:table-cell">
                        <div className="text-xs font-semibold text-slate-900">{eff.host}</div>
                        <div className="text-[11px] text-slate-500">
                          {eff.endpointCount} {eff.endpointCount === 1 ? 'endpoint' : 'endpoints'}
                          {eff.savingsPercent > 0 ? (
                            <span className="ml-1.5 text-emerald-700 font-semibold">
                              (-{eff.savingsPercent}% vs official)
                            </span>
                          ) : null}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 font-mono font-medium text-slate-950">
                        {fmtRate(eff.inputPer1M)}
                      </td>

                      <td className="py-3.5 px-3 font-mono font-medium text-emerald-800 hidden md:table-cell">
                        {fmtRate(eff.cachedInputPer1M)}
                      </td>

                      <td className="py-3.5 px-3 font-mono font-medium text-slate-950">
                        {fmtRate(eff.outputPer1M)}
                      </td>

                      <td className="py-3.5 px-3 hidden sm:table-cell text-right font-mono text-xs text-slate-700">
                        {typeof eff.tokPerSec === 'number' ? `~${eff.tokPerSec} tok/s` : 'N/A'}
                      </td>

                      <td className="py-3.5 px-3 sm:px-4 font-mono text-right text-slate-700">
                        {m.contextWindow ?? 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Live Leaderboard Pulse — Open 3-Column Editorial Grid */}
        <section aria-labelledby="leaderboard-pulse-heading" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Catalog Intelligence
              </p>
              <h2
                id="leaderboard-pulse-heading"
                className="mt-1 text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950"
              >
                Current Leaders by Quality, Value &amp; Speed
              </h2>
            </div>
            <Link
              href="/leaderboard"
              className="text-xs sm:text-sm font-semibold text-emerald-800 hover:text-emerald-950 underline underline-offset-4"
            >
              Open Full Leaderboard →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 md:divide-x md:divide-slate-200/80 border-y border-slate-200/80 py-6">
            {/* Quality Leaders */}
            <div className="md:pr-8 space-y-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
                  Top Benchmark Score
                </span>
                <span className="text-[11px] font-mono text-slate-400">Overall</span>
              </div>
              <ul className="divide-y divide-slate-200/60">
                {topBenchmarkLeaders.map((m, i) => (
                  <li key={m.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ProviderLogo provider={m.provider} size="sm" />
                      <div className="min-w-0">
                        <Link
                          href={`/models/${m.slug}`}
                          className="text-sm font-bold text-slate-950 hover:text-emerald-800 truncate block"
                        >
                          {i + 1}. {m.name}
                        </Link>
                        <span className="text-[11px] text-slate-500">
                          {m.provider} · {fmtRate(m.inputPer1M)}/{fmtRate(m.outputPer1M)}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-sm font-bold text-slate-950 shrink-0">
                      {m.score?.toFixed(1)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Value Leaders */}
            <div className="md:px-8 space-y-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                  <Layers className="h-3.5 w-3.5 text-emerald-700" />
                  Best Score / Output $
                </span>
                <span className="text-[11px] font-mono text-slate-400">Efficiency</span>
              </div>
              <ul className="divide-y divide-slate-200/60">
                {topValueLeaders.map((m, i) => (
                  <li key={m.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ProviderLogo provider={m.provider} size="sm" />
                      <div className="min-w-0">
                        <Link
                          href={`/models/${m.slug}`}
                          className="text-sm font-bold text-slate-950 hover:text-emerald-800 truncate block"
                        >
                          {i + 1}. {m.name}
                        </Link>
                        <span className="text-[11px] text-slate-500">
                          Score {m.score?.toFixed(1)} · Out {fmtRate(m.outputPer1M)}/1M
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-500/12 rounded-md px-2 py-0.5 shrink-0">
                      {Math.round((m.score ?? 0) / (m.outputPer1M ?? 1))} pts/$
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Speed Leaders */}
            <div className="md:pl-8 space-y-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                  <Zap className="h-3.5 w-3.5 text-emerald-700" />
                  Fastest Throughput
                </span>
                <span className="text-[11px] font-mono text-slate-400">tok/s</span>
              </div>
              <ul className="divide-y divide-slate-200/60">
                {topSpeedLeaders.map(({ model: m, effective }, i) => (
                  <li key={m.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ProviderLogo provider={m.provider} size="sm" />
                      <div className="min-w-0">
                        <Link
                          href={`/models/${m.slug}`}
                          className="text-sm font-bold text-slate-950 hover:text-emerald-800 truncate block"
                        >
                          {i + 1}. {m.name}
                        </Link>
                        <span className="text-[11px] text-slate-500">
                          via {effective.host}
                          {typeof effective.latencyMs === 'number' ? ` · <${effective.latencyMs}ms` : ''}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-sm font-bold text-slate-950 shrink-0">
                      ~{effective.tokPerSec} tok/s
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Core Engineering Tools — Clean Open Grid */}
        <section aria-labelledby="platform-tools-heading" className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Developer Suite
              </p>
              <h2
                id="platform-tools-heading"
                className="mt-1 text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950"
              >
                Six Focused Tools for LLM Cost &amp; Routing
              </h2>
            </div>
            <Link
              href="/methodology"
              className="text-xs sm:text-sm font-semibold text-emerald-800 underline underline-offset-4"
            >
              Provenance Rules
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
            {CORE_TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <article
                  key={tool.href}
                  className="group flex flex-col justify-between gap-3 border-t border-slate-200/80 pt-5"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950/5 text-slate-900 group-hover:bg-slate-950 group-hover:text-white transition-colors">
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          {tool.badge}
                        </span>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-700 transition-colors" />
                    </div>
                    <h3 className="text-base font-bold text-slate-950">
                      <Link
                        href={tool.href}
                        className="group-hover:text-emerald-800 transition-colors"
                      >
                        {tool.title}
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

        {/* Curated Task Hubs — Borderless Pill/Row Strip */}
        <section aria-labelledby="curated-views-heading" className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Workload Shortlists
              </p>
              <h2
                id="curated-views-heading"
                className="mt-1 text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950"
              >
                Explore Models by Production Use Case
              </h2>
            </div>
            <Link
              href="/models"
              className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-950"
            >
              Browse Full Directory →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 border-y border-slate-200/80 py-6">
            {CURATED_HUBS.map((hub) => (
              <Link
                key={hub.href}
                href={hub.href}
                className="group space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-slate-950 group-hover:text-emerald-800 transition-colors">
                    {hub.title}
                  </h3>
                  <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-700 shrink-0" />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{hub.subtitle}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Data Provenance & FAQ — Clean Editorial Section */}
        <section aria-labelledby="home-faq-heading" className="space-y-6 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 id="home-faq-heading" className="text-lg sm:text-xl font-extrabold text-slate-950">
                Pricing Methodology &amp; FAQ
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                How PromptBill normalizes token math, multi-host quotes, and provenance labels.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
              Zero fabricated numbers
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs sm:text-sm text-slate-700">
            <div className="space-y-2">
              <h3 className="font-bold text-slate-950">What does PromptBill offer?</h3>
              <p className="leading-relaxed text-slate-600">
                PromptBill combines a multi-endpoint API token pricing table, 30-day spend calculator, benchmark leaderboard, model comparison matrix, prompt tokenizer, and hybrid routing simulator.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-slate-950">How are monthly costs estimated?</h3>
              <p className="leading-relaxed text-slate-600">
                Estimates multiply daily requests over 30 days using each endpoint&apos;s per-1M-token input, cached read, and output rates plus batch discounts and long-context multipliers where applicable.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-slate-950">How are official provider rates verified?</h3>
              <p className="leading-relaxed text-slate-600">
                Verified entries cross-check primary provider rate cards such as{' '}
                <a
                  href="https://platform.openai.com/docs/pricing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-emerald-800 underline underline-offset-2"
                >
                  OpenAI API Pricing Docs
                </a>{' '}
                and{' '}
                <a
                  href="https://docs.anthropic.com/en/docs/about-claude/pricing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-emerald-800 underline underline-offset-2"
                >
                  Anthropic Claude Pricing Docs
                </a>
                ; unverified quotes remain clearly labeled Estimated.
              </p>
            </div>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
