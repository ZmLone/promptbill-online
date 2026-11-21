import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ALL_MODELS, parseComparisonSlug } from '../../../lib/catalog';
import { SiteShell } from '../../../components/SiteShell';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const parsed = parseComparisonSlug(slug) || { modelA: ALL_MODELS[0], modelB: ALL_MODELS[1] };
  const { modelA, modelB } = parsed;
  const title = `${modelA.name} vs ${modelB.name} — API Pricing, Speed & Benchmarks`;
  const description = `Compare ${modelA.name} ($${modelA.inputPer1M}/$${modelA.outputPer1M} per 1M, ${modelA.tokPerSec} tok/s) vs ${modelB.name} ($${modelB.inputPer1M}/$${modelB.outputPer1M} per 1M, ${modelB.tokPerSec} tok/s).`;

  return {
    title,
    description,
    alternates: { canonical: `https://promptbill.online/compare/${modelA.slug}-vs-${modelB.slug}` },
  };
}

export default async function ComparePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const parsed = parseComparisonSlug(slug) || {
    modelA: ALL_MODELS[0],
    modelB: ALL_MODELS[1],
  };
  const { modelA, modelB } = parsed;

  const metrics: { label: string; aVal: string; bVal: string }[] = [
    { label: 'Benchmark Score', aVal: modelA.score.toFixed(1), bVal: modelB.score.toFixed(1) },
    { label: 'Elo Rating', aVal: modelA.elo.toFixed(1), bVal: modelB.elo.toFixed(1) },
    { label: 'Price / 1M (In / Out)', aVal: `$${modelA.inputPer1M.toFixed(2)} / $${modelA.outputPer1M.toFixed(2)}`, bVal: `$${modelB.inputPer1M.toFixed(2)} / $${modelB.outputPer1M.toFixed(2)}` },
    { label: 'Speed (Tok/s)', aVal: `${modelA.tokPerSec} tok/s`, bVal: `${modelB.tokPerSec} tok/s` },
    { label: 'Context Window', aVal: modelA.contextWindow, bVal: modelB.contextWindow },
    { label: 'Rate Limits', aVal: `${modelA.rpmLimit} · ${modelA.tpmLimit}`, bVal: `${modelB.rpmLimit} · ${modelB.tpmLimit}` },
    { label: 'Agentic (AG)', aVal: String(modelA.ag), bVal: String(modelB.ag) },
    { label: 'Coding (CO)', aVal: String(modelA.co), bVal: String(modelB.co) },
    { label: 'Reasoning (RE)', aVal: String(modelA.re), bVal: String(modelB.re) },
  ];

  return (
    <SiteShell
      title={`${modelA.name} vs ${modelB.name} — Pricing, Speed & Benchmarks`}
      subtitle={`promptbill.online/compare/${modelA.slug}-vs-${modelB.slug}`}
    >
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-600">
                <th className="py-2.5 px-3">Metric</th>
                <th className="py-2.5 px-3">
                  <Link href={`/models/${modelA.slug}`} className="font-bold text-slate-900 underline">
                    {modelA.name}
                  </Link>
                </th>
                <th className="py-2.5 px-3">
                  <Link href={`/models/${modelB.slug}`} className="font-bold text-slate-900 underline">
                    {modelB.name}
                  </Link>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-mono">
              {metrics.map((row) => (
                <tr key={row.label} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-sans font-medium text-slate-700">{row.label}</td>
                  <td className="py-3 px-3 text-slate-900">{row.aVal}</td>
                  <td className="py-3 px-3 text-slate-900">{row.bVal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </SiteShell>
  );
}
