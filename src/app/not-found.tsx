import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '../components/SiteShell';
import {
  Home,
  Table2,
  Trophy,
  Scale,
  FileText,
  GitBranch,
  Sparkles,
  ArrowUpRight,
  SearchX,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Page Not Found (404)',
  description:
    'The requested page on PromptBill could not be found. Jump back to LLM API token pricing, model benchmarks, comparisons, or cost calculators.',
  robots: {
    index: false,
    follow: true,
  },
};

const QUICK_DESTINATIONS = [
  {
    href: '/',
    title: 'PromptBill Home & Cost Calculator',
    description: 'Estimate 30-day LLM API spend with prompt caching and batch discounts.',
    icon: Home,
  },
  {
    href: '/pricing',
    title: 'API Token Pricing Table',
    description: 'Compare input, cached read, and output rates per 1M tokens.',
    icon: Table2,
  },
  {
    href: '/leaderboard',
    title: 'Benchmark Leaderboard',
    description: 'Rank models by coding, reasoning, throughput (tok/s), and value.',
    icon: Trophy,
  },
  {
    href: '/compare',
    title: 'Head-to-Head Model Compare',
    description: 'Compare two models side by side on pricing, context window, and scores.',
    icon: Scale,
  },
  {
    href: '/tools/token-counter',
    title: 'Live Prompt Tokenizer',
    description: 'Count tokens and check per-request costs on real prompts.',
    icon: FileText,
  },
  {
    href: '/tools/routing-simulator',
    title: 'Hybrid Routing Simulator',
    description: 'Model economy vs. flagship traffic splits and savings.',
    icon: GitBranch,
  },
];

export default function NotFound() {
  return (
    <SiteShell
      title="404 — Page Not Found"
      subtitle="promptbill.online · Route Unavailable"
    >
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-900">
                <SearchX className="w-3.5 h-3.5" />
                <span>Broken or Moved Link · PromptBill Is Online</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                This specific page isn&apos;t here—the rest of PromptBill is running normally.
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                The URL you requested may have been moved, mistyped, or retired after a route update. Use one of the direct tools below or report the broken link so we can fix it.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800"
            >
              <Home className="w-4 h-4" />
              <span>Go to Homepage</span>
            </Link>
            <Link
              href="/tools/llm-selector"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <span>Open LLM Selector</span>
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs sm:text-sm font-semibold text-emerald-900 hover:bg-emerald-100"
            >
              <span>Report Broken Link</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">
            Helpful Pages on PromptBill
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {QUICK_DESTINATIONS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-emerald-700/50 hover:bg-slate-50/70"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-800 group-hover:bg-emerald-800 group-hover:text-white transition-colors">
                      <Icon className="w-4 h-4" />
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-800" />
                  </div>
                  <div className="mt-3 font-semibold text-slate-900 group-hover:text-emerald-900">
                    {item.title}
                  </div>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
