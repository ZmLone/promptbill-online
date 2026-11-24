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
  ShieldCheck,
} from 'lucide-react';
import { SiteShell } from '../components/SiteShell';
import { ALL_MODELS, getAllProviderSlugs } from '../lib/catalog';

export const metadata: Metadata = {
  title: 'PromptBill — LLM Leaderboard, API Pricing & AI Cost Tools',
  description:
    'Dedicated hub for LLM rankings, A vs B model comparisons, API token pricing, model selection, coding picks, token counting, and routing.',
  alternates: {
    canonical: '/',
  },
};

const ROUTE_CARDS = [
  {
    href: '/leaderboard',
    title: 'LLM Leaderboard',
    badge: 'Rankings',
    description: 'Compare composite benchmark scores, Elo ratings, output speed (tok/s), and value per dollar.',
    icon: ArrowUpDown,
  },
  {
    href: '/compare',
    title: 'Compare (A vs B)',
    badge: 'Matchups',
    description: 'Side-by-side head-to-head model breakdowns across pricing, context window, and capability scores.',
    icon: Scale,
  },
  {
    href: '/pricing',
    title: 'API Pricing',
    badge: 'Billing',
    description: 'Inspect input, cached read, cache write, and output rates per 1M tokens across providers.',
    icon: Calculator,
  },
  {
    href: '/tools/llm-selector',
    title: 'LLM Selector',
    badge: 'Tool',
    description: 'Filter models by workload category, monthly budget, benchmark score, and open/closed license.',
    icon: Sparkles,
  },
  {
    href: '/best-llms-for-coding',
    title: 'Best for Coding',
    badge: 'Coding',
    description: 'Top-ranked models for software engineering, code generation, debugging, and agentic workflows.',
    icon: Code2,
  },
  {
    href: '/tools/token-counter',
    title: 'Token Counter',
    badge: 'Tool',
    description: 'Estimate prompt token counts and input/cached token costs before sending production traffic.',
    icon: FileText,
  },
  {
    href: '/tools/routing-simulator',
    title: 'Routing Simulator',
    badge: 'Tool',
    description: 'Model cost savings when routing routine prompts to fast/cheap models and complex tasks to flagships.',
    icon: GitBranch,
  },
  {
    href: '/models',
    title: 'All Tracked Models',
    badge: 'Directory',
    description: 'Browse every model in the registry with full specs, rate limits, and historical price snapshots.',
    icon: Cpu,
  },
];

export default function HomePage() {
  const modelCount = ALL_MODELS.length;
  const providerCount = getAllProviderSlugs().length;

  return (
    <SiteShell
      title="Compare LLM Costs, Speed & Benchmarks in One Place"
      subtitle="promptbill.online · Dedicated Hub for Rankings, Pricing, Comparisons & AI Tools"
    >
      <div className="space-y-8">
        {/* Hero / Quick Action Banner */}
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
                Pick the right LLM by cost, speed, and task fit—without guessing your bill.
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Jump straight into live leaderboard rankings, A-vs-B model matchups, API token pricing,
                coding recommendations, token counting, or hybrid routing on{' '}
                <strong className="font-semibold text-slate-900">promptbill.online</strong>.
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
                  <span>Explore API Pricing</span>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:w-80 shrink-0 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">
              <div className="rounded-lg border border-slate-200/80 bg-white p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Models
                </div>
                <div className="mt-1 font-mono text-xl font-bold text-slate-900">{modelCount}</div>
                <div className="text-[11px] text-slate-600 mt-0.5">Live catalog</div>
              </div>
              <div className="rounded-lg border border-slate-200/80 bg-white p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Providers
                </div>
                <div className="mt-1 font-mono text-xl font-bold text-slate-900">{providerCount}</div>
                <div className="text-[11px] text-slate-600 mt-0.5">API &amp; hosts</div>
              </div>
              <div className="col-span-2 rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 flex items-center justify-between">
                <div className="text-xs font-medium text-emerald-950">
                  Mobile-first tools with instant navigation
                </div>
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              </div>
            </div>
          </div>
        </section>

        {/* Dedicated Route Directory Grid */}
        <section aria-label="PromptBill Sections and Tools" className="space-y-4">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Explore Dedicated Tools &amp; Rankings
            </h2>
            <span className="text-xs text-slate-500">Tap any card to open</span>
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

        {/* GEO / Concise Answer Block for Search & AI Engines */}
        <section
          aria-label="PromptBill Overview"
          className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-2 text-sm text-slate-700"
        >
          <h2 className="text-base font-bold text-slate-900">How PromptBill Works</h2>
          <p className="leading-relaxed">
            PromptBill (<code className="font-mono text-xs text-slate-900">promptbill.online</code>)
            organizes LLM evaluation and API cost analysis into focused pages: use{' '}
            <Link href="/leaderboard" className="font-semibold text-emerald-800 underline">
              /leaderboard
            </Link>{' '}
            for overall rankings,{' '}
            <Link href="/compare" className="font-semibold text-emerald-800 underline">
              /compare
            </Link>{' '}
            for side-by-side model matchups,{' '}
            <Link href="/pricing" className="font-semibold text-emerald-800 underline">
              /pricing
            </Link>{' '}
            for per-million-token rates,{' '}
            <Link href="/best-llms-for-coding" className="font-semibold text-emerald-800 underline">
              /best-llms-for-coding
            </Link>{' '}
            for coding benchmarks, and{' '}
            <Link href="/tools/llm-selector" className="font-semibold text-emerald-800 underline">
              /tools/llm-selector
            </Link>
            ,{' '}
            <Link href="/tools/token-counter" className="font-semibold text-emerald-800 underline">
              /tools/token-counter
            </Link>
            , and{' '}
            <Link href="/tools/routing-simulator" className="font-semibold text-emerald-800 underline">
              /tools/routing-simulator
            </Link>{' '}
            for interactive planning.
          </p>
        </section>
      </div>
    </SiteShell>
  );
}
