import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '../../components/SiteShell';
import { BreadcrumbSchema } from '../../components/BreadcrumbSchema';
import {
  Calculator,
  Database,
  ShieldCheck,
  ArrowUpRight,
  Compass,
  Scale,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'About PromptBill',
  description:
    'Learn how PromptBill compares LLM API token rates per 1M tokens, prompt caching and batch discounts, throughput, and model benchmarks for engineering teams.',
};

export default function AboutPage() {
  return (
    <SiteShell
      title="About PromptBill"
      subtitle="promptbill.online · LLM API Pricing & Token Cost Transparency"
    >
      <div className="space-y-6">
        <BreadcrumbSchema items={[{ name: 'About', href: '/about' }]} />

        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-8 shadow-xs space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-900">
            <Compass className="w-3.5 h-3.5" />
            <span>Built for Practical Token Cost Math</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Clear LLM API pricing, caching math, and benchmark trade-offs in one place.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            PromptBill (<strong>promptbill.online</strong>) helps developers, product builders, and technical teams compare large language model API rates per 1M tokens, model throughput, and workload cost scenarios without digging through scattered pricing pages.
          </p>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Instead of looking at sticker input and output prices alone, real production bills depend on prompt cache hits, batch processing discounts, output token volume, and latency/throughput requirements. PromptBill gives you calculators, side-by-side comparisons, and leaderboards to test those trade-offs before committing traffic.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-2">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-800">
              <Calculator className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-slate-900">Workload Cost Modeling</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Estimate monthly API spend across daily request volume, input/output token ratios, cached reads, and batch tiers.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-2">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-800">
              <Database className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-slate-900">Transparent Provenance</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Rates and benchmark figures are labeled clearly so verified quotes and estimated figures stay distinct and auditable.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-2">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-800">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-slate-900">Independent &amp; Direct</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Designed for fast evaluation across providers and model families, with direct links to methodology, privacy disclosures, and support.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <Scale className="w-3.5 h-3.5" />
              <span>Explore &amp; Connect</span>
            </div>
            <p className="text-sm text-slate-700">
              Check live token pricing, review how rates are handled, or send a note directly.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/pricing"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800"
            >
              <span>View API Pricing</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
            <Link
              href="/privacy-policy"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              <span>Privacy Policy</span>
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs sm:text-sm font-semibold text-emerald-900 hover:bg-emerald-100"
            >
              <span>Contact Us</span>
            </Link>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
