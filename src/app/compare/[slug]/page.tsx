import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ALL_MODELS, getAutoComparisonPairs, parseComparisonSlug } from '../../../lib/catalog';
import { SiteShell } from '../../../components/SiteShell';

export function generateStaticParams() {
  return getAutoComparisonPairs(20).map((pair) => ({ slug: pair.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const parsed = parseComparisonSlug(slug) || { slug: `${ALL_MODELS[0].slug}-vs-${ALL_MODELS[1].slug}`, modelA: ALL_MODELS[0], modelB: ALL_MODELS[1] };
  const { modelA, modelB } = parsed;
  const title = `${modelA.name} vs ${modelB.name}: API Pricing, Tok/s Speed, Elo & Benchmarks`;
  const description = `Compare ${modelA.name} ($${modelA.inputPer1M.toFixed(2)}/$${modelA.outputPer1M.toFixed(2)}, ${modelA.tokPerSec} tok/s, Elo ${modelA.elo}) vs ${modelB.name} ($${modelB.inputPer1M.toFixed(2)}/$${modelB.outputPer1M.toFixed(2)}, ${modelB.tokPerSec} tok/s, Elo ${modelB.elo}).`;
  return { title, description, alternates: { canonical: `https://promptbill.online/compare/${modelA.slug}-vs-${modelB.slug}` } };
}

export default async function ComparePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const parsed = parseComparisonSlug(slug) || { slug: `${ALL_MODELS[0].slug}-vs-${ALL_MODELS[1].slug}`, modelA: ALL_MODELS[0], modelB: ALL_MODELS[1] };
  const { modelA, modelB } = parsed;

  const rows: { label: string; aVal: string; bVal: string }[] = [
    { label: 'Composite Score', aVal: modelA.score.toFixed(1), bVal: modelB.score.toFixed(1) },
    { label: 'Elo Rating', aVal: modelA.elo.toFixed(1), bVal: modelB.elo.toFixed(1) },
    { label: 'Input Price / 1M', aVal: `$${modelA.inputPer1M.toFixed(2)}`, bVal: `$${modelB.inputPer1M.toFixed(2)}` },
    { label: 'Output Price / 1M', aVal: `$${modelA.outputPer1M.toFixed(2)}`, bVal: `$${modelB.outputPer1M.toFixed(2)}` },
    { label: 'Speed (Tok/s)', aVal: `${modelA.tokPerSec} tok/s`, bVal: `${modelB.tokPerSec} tok/s` },
    { label: 'Agentic (AG)', aVal: String(modelA.ag), bVal: String(modelB.ag) },
    { label: 'Coding (CO)', aVal: String(modelA.co), bVal: String(modelB.co) },
    { label: 'Reasoning (RE)', aVal: String(modelA.re), bVal: String(modelB.re) },
  ];

  return (
    <SiteShell title={`${modelA.name} vs ${modelB.name} — API Pricing, Tok/s, Elo & Benchmarks`} subtitle={`promptbill.online/compare/${modelA.slug}-vs-${modelB.slug}`}>
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[620px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-600">
                <th className="py-2.5 px-3">Metric</th>
                <th className="py-2.5 px-3"><Link href={`/models/${modelA.slug}`} className="font-bold text-slate-900 underline">{modelA.name}</Link></th>
                <th className="py-2.5 px-3"><Link href={`/models/${modelB.slug}`} className="font-bold text-slate-900 underline">{modelB.name}</Link></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-mono">
              {rows.map((r) => (
                <tr key={r.label} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-sans font-medium text-slate-700">{r.label}</td>
                  <td className="py-3 px-3 text-slate-900">{r.aVal}</td>
                  <td className="py-3 px-3 text-slate-900">{r.bVal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </SiteShell>
  );
}
