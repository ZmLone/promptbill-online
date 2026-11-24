import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowUpDown,
  Scale,
  Calculator,
  Sparkles,
  Code2,
  FileText,
  GitBranch,
  Cpu,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { SiteShell } from '../components/SiteShell';
import { ALL_MODELS, getAllProviderSlugs } from '../lib/catalog';

export const metadata: Metadata = {
  title: 'PromptBill — LLM API Pricing, Token Cost Calculator & Benchmark Leaderboard',
  description:
    'Compare LLM API pricing per 1M tokens, benchmark scores, tokens per second, coding picks, token counts, and hybrid model routing on promptbill.online.',
  alternates: {
    canonical: '/',
  },
};

const ROUTE_CARDS = [
  {
    href: '/leaderboard',
    title: 'LLM Leaderboard',
    badge: 'Rankings',
    description: 'Rankings by composite benchmark score, Elo rating, value per dollar, and tokens per second.',
    icon: ArrowUpDown,
  },
  {
    href: '/compare',
    title: 'Compare (A vs B)',
    badge: 'Matchups',
    description: 'Side-by-side comparison of two models across token pricing, context window, and task scores.',
    icon: Scale,
  },
  {
    href: '/pricing',
    title: 'API Pricing',
    badge: 'Billing',
    description: 'Input, cached input, cache write, and output token rates per 1M tokens across providers.',
    icon: Calculator,
  },
  {
    href: '/tools/llm-selector',
    title: 'LLM Selector',
    badge: 'Tool',
    description: 'Filter models by task type, monthly budget, benchmark score, and license.',
    icon: Sparkles,
  },
  {
    href: '/best-llms-for-coding',
    title: 'Best for Coding',
    badge: 'Coding',
    description: 'Top-scoring models for software engineering, code generation, debugging, and tool use.',
    icon: Code2,
  },
  {
    href: '/tools/token-counter',
    title: 'Token Counter',
    badge: 'Tool',
    description: 'Estimate prompt token counts and input/cached token spend before deploying.',
    icon: FileText,
  },
  {
    href: '/tools/routing-simulator',
    title: 'Routing Simulator',
    badge: 'Tool',
    description: 'Calculate savings from routing simple requests to lower-cost models and complex prompts to flagships.',
    icon: GitBranch,
  },
  {
    href: '/models',
    title: 'All Tracked Models',
    badge: 'Directory',
    description: 'Complete model catalog with API rate limits, context windows, and price history.',
    icon: Cpu,
  },
];

export default function HomePage() {
  const modelCount = ALL_MODELS.length;
  const providerCount = getAllProviderSlugs().length;

  return (
    <SiteShell
      title="Compare LLM Costs, Speed & Benchmarks in One Place"
      subtitle="promptbill.online · LLM Rankings, API Pricing, Model Comparisons & Cost Tools"
    >
      <div className="space-y-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-8 shadow-2xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900">
                <Zap className="w-3.5 h-3.5 text-emerald-700" />
                <span>
                  {modelCount} Tracked Models · {providerCount} Providers
                </span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
                Compare model accuracy, token pricing, and throughput before you ship.
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                PromptBill (<strong className="font-semibold text-slate-900">promptbill.online</strong>)
                organizes LLM data into dedicated pages for benchmark rankings, A-vs-B model matchups,
                API token rates, coding picks, prompt token estimation, and multi-model routing.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/leaderboard"
                  prefetch={true}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                >
                  <span>Open Leaderboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/pricing"
                  prefetch={true}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <span>View API Pricing</span>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:w-72 shrink-0 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">
              <div className="rounded-lg border border-slate-200/80 bg-white p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Models
                </div>
                <div className="mt-1 font-mono text-xl font-bold text-slate-900">{modelCount}</div>
                <div className="text-[11px] text-slate-600 mt-0.5">Indexed catalog</div>
              </div>
              <div className="rounded-lg border border-slate-200/80 bg-white p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Providers
                </div>
                <div className="mt-1 font-mono text-xl font-bold text-slate-900">{providerCount}</div>
                <div className="text-[11px] text-slate-600 mt-0.5">API &amp; hosts</div>
              </div>
            </div>
          </div>
        </section>

        <section aria-label="PromptBill Sections and Tools" className="space-y-4">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Explore Rankings, Pricing &amp; Tools
            </h2>
            <span className="text-xs text-slate-500">Select a section</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ROUTE_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.href}
                  href={card.href}
                  prefetch={true}
                  className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 sm:p-5 transition-all hover:border-emerald-500/60 hover:shadow-sm"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-800 group-hover:bg-emerald-50 group-hover:text-emerald-800 transition-colors">
                        <Icon className="w-5 h-5" />
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                        {card.badge}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {card.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-800">
                    <span>Open {card.title}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section
          aria-label="PromptBill Reference Guide"
          className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-2 text-sm text-slate-700"
        >
          <h2 className="text-base font-bold text-slate-900">PromptBill Directory &amp; Use Cases</h2>
          <p className="leading-relaxed">
            Use <Link href="/leaderboard" className="font-semibold text-emerald-800 underline">/leaderboard</Link> to rank models by benchmark score, Elo, and speed;{' '}
            <Link href="/compare" className="font-semibold text-emerald-800 underline">/compare</Link> for direct model matchups;{' '}
            <Link href="/pricing" className="font-semibold text-emerald-800 underline">/pricing</Link> for per-million-token API costs;{' '}
            <Link href="/best-llms-for-coding" className="font-semibold text-emerald-800 underline">/best-llms-for-coding</Link> for coding rankings; and{' '}
            <Link href="/tools/llm-selector" className="font-semibold text-emerald-800 underline">/tools/llm-selector</Link>,{' '}
            <Link href="/tools/token-counter" className="font-semibold text-emerald-800 underline">/tools/token-counter</Link>, and{' '}
            <Link href="/tools/routing-simulator" className="font-semibold text-emerald-800 underline">/tools/routing-simulator</Link> for interactive estimation.
          </p>
        </section>
      </div>
    </SiteShell>
  );
}
