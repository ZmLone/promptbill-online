import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getAutoComparisonPairs } from '../../lib/catalog';
import { SiteShell } from '../../components/SiteShell';

export const metadata: Metadata = {
  title: 'LLM Head-to-Head Comparisons — API Pricing, Tok/s, Elo & Benchmarks',
  description: 'Auto-generated comparison pages across top models contrasting price per 1M tokens, Tok/s, Elo, and AG, CO, RE scores.',
  alternates: { canonical: 'https://promptbill.online/compare' },
};

export default function CompareIndexPage() {
  const pairs = getAutoComparisonPairs(20);
  return (
    <SiteShell title="Head-to-Head LLM Comparison Directory (Top 20 Models)" subtitle="promptbill.online/compare · 190 Auto-Generated Model Matchups">
      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {pairs.map((p) => (
            <Link key={p.slug} href={`/compare/${p.slug}`} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5 hover:border-emerald-400 hover:bg-white transition-colors">
              <div className="font-bold text-slate-900">{p.modelA.name} vs {p.modelB.name}</div>
              <div className="mt-1 font-mono text-[11px] text-slate-600">${p.modelA.inputPer1M}/${p.modelA.outputPer1M} ({p.modelA.tokPerSec} tok/s) vs ${p.modelB.inputPer1M}/${p.modelB.outputPer1M} ({p.modelB.tokPerSec} tok/s)</div>
            </Link>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
