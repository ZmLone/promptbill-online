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
  const description = `Side-by-side comparison of ${modelA.name} ($${modelA.inputPer1M.toFixed(2)}/$${modelA.outputPer1M.toFixed(2)} per 1M, ${modelA.tokPerSec} tok/s, Elo ${modelA.elo}) vs ${modelB.name} ($${modelB.inputPer1M.toFixed(2)}/$${modelB.outputPer1M.toFixed(2)} per 1M, ${modelB.tokPerSec} tok/s, Elo ${modelB.elo}).`;
  return { title, description, alternates: { canonical: `https://promptbill.online/compare/${modelA.slug}-vs-${modelB.slug}` } };
}

export default async function ComparePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const parsed = parseComparisonSlug(slug) || { slug: `${ALL_MODELS[0].slug}-vs-${ALL_MODELS[1].slug}`, modelA: ALL_MODELS[0], modelB: ALL_MODELS[1] };
  const { modelA, modelB } = parsed;

  const rows: { label: string; aVal: string; bVal: string }[] = [
    { label: 'Composite Score', aVal: modelA.score.toFixed(1), bVal: modelB.score.toFixed(1) },
    { label: 'Elo Rating', aVal: modelA.elo.toFixed(1), bVal: modelB.elo.toFixed(1) },
    { label: 'Input Price / 1M Tokens', aVal: `$${modelA.inputPer1M.toFixed(2)}`, bVal: `$${modelB.inputPer1M.toFixed(2)}` },
    { label: 'Cached Input / 1M Tokens', aVal: `$${modelA.cachedInputPer1M.toFixed(2)}`, bVal: `$${modelB.cachedInputPer1M.toFixed(2)}` },
    { label: 'Output Price / 1M Tokens', aVal: `$${modelA.outputPer1M.toFixed(2)}`, bVal: `$${modelB.outputPer1M.toFixed(2)}` },
    { label: 'Speed (Tokens / Sec)', aVal: `${modelA.tokPerSec} tok/s`, bVal: `${modelB.tokPerSec} tok/s` },
    { label: 'Context Window', aVal: modelA.contextWindow, bVal: modelB.contextWindow },
    { label: 'Agentic (AG)', aVal: String(modelA.ag), bVal: String(modelB.ag) },
    { label: 'Coding (CO)', aVal: String(modelA.co), bVal: String(modelB.co) },
    { label: 'Reasoning (RE)', aVal: String(modelA.re), bVal: String(modelB.re) },
    { label: 'Multimodal (MM)', aVal: String(modelA.mm), bVal: String(modelB.mm) },
    { label: 'Knowledge (KN)', aVal: String(modelA.kn), bVal: String(modelB.kn) },
    { label: 'Multilingual (ML)', aVal: String(modelA.ml), bVal: String(modelB.ml) },
    { label: 'Instruction Following (IF)', aVal: String(modelA.if), bVal: String(modelB.if) },
    { label: 'Math (MA)', aVal: String(modelA.ma), bVal: String(modelB.ma) },
  ];

  return (
    <SiteShell title={`${modelA.name} vs ${modelB.name} — API Pricing, Tok/s, Elo & Benchmarks`} subtitle={`promptbill.online/compare/${modelA.slug}-vs-${modelB.slug}`}>
      <article className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 space-y-6">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs sm:text-sm text-slate-800 leading-relaxed">
          <strong>{modelA.name}</strong> ({modelA.provider}) scores <strong>{modelA.score.toFixed(1)}</strong> at <strong>${modelA.inputPer1M.toFixed(2)}/${modelA.outputPer1M.toFixed(2)}</strong> per 1M tokens and <strong>{modelA.tokPerSec} tok/s</strong>, compared to <strong>{modelB.name}</strong> ({modelB.provider}) scoring <strong>{modelB.score.toFixed(1)}</strong> at <strong>${modelB.inputPer1M.toFixed(2)}/${modelB.outputPer1M.toFixed(2)}</strong> per 1M tokens and <strong>{modelB.tokPerSec} tok/s</strong>.
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left border-collapse">
            <caption className="sr-only">
              Side-by-side comparison of {modelA.name} and {modelB.name} across composite score, Elo rating, API token prices, generation speed, context window, and benchmark categories.
            </caption>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/90 text-xs sm:text-sm font-semibold text-slate-800">
                <th scope="col" className="py-3 px-3.5">Metric</th>
                <th scope="col" className="py-3 px-3.5">
                  <Link href={`/models/${modelA.slug}`} className="font-bold text-slate-900 underline">
                    {modelA.name}
                  </Link>
                </th>
                <th scope="col" className="py-3 px-3.5">
                  <Link href={`/models/${modelB.slug}`} className="font-bold text-slate-900 underline">
                    {modelB.name}
                  </Link>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 text-xs sm:text-sm font-mono">
              {rows.map((r, idx) => (
                <tr key={r.label} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                  <th scope="row" className="py-3 px-3.5 font-sans font-medium text-slate-700 text-left">
                    {r.label}
                  </th>
                  <td className="py-3 px-3.5 text-slate-900">{r.aVal}</td>
                  <td className="py-3 px-3.5 text-slate-900">{r.bVal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </SiteShell>
  );
}
