import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ALL_MODELS,
  getAutoComparisonPairs,
  parseComparisonSlug,
  type CatalogModel,
} from '../../../lib/catalog';
import { SiteShell } from '../../../components/SiteShell';
import { formatCurrency } from '../../../lib/pricingEngine';

export function generateStaticParams() {
  return getAutoComparisonPairs(20).map((pair) => ({ slug: pair.slug }));
}

function resolvePair(slug: string): { slug: string; modelA: CatalogModel; modelB: CatalogModel } | null {
  const parsed = parseComparisonSlug(slug);
  if (parsed) return parsed;
  if (ALL_MODELS.length >= 2) {
    const a = ALL_MODELS[0];
    const b = ALL_MODELS[1];
    return { slug: `${a.slug}-vs-${b.slug}`, modelA: a, modelB: b };
  }
  return null;
}

function fmtScore(val: number | null): string {
  return typeof val === 'number' && Number.isFinite(val) ? val.toFixed(1) : 'N/A';
}

function fmtRate(val: number | null): string {
  return typeof val === 'number' && Number.isFinite(val) ? formatCurrency(val) : 'N/A';
}

function fmtSpeed(val: number | null): string {
  return typeof val === 'number' && Number.isFinite(val) ? `${val} tok/s` : 'N/A';
}

function fmtMetric(val: number | null): string {
  return typeof val === 'number' && Number.isFinite(val) ? String(val) : 'N/A';
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pair = resolvePair(slug);
  if (!pair) {
    return {
      title: 'Model Comparison',
      description: 'Side-by-side LLM comparison on PromptBill.',
    };
  }
  const { modelA, modelB } = pair;
  const title = `${modelA.name} vs ${modelB.name} — Pricing, Speed & Benchmarks`;
  const description = `Compare ${modelA.name} (${fmtRate(modelA.inputPer1M)}/${fmtRate(modelA.outputPer1M)} per 1M, ${fmtSpeed(modelA.tokPerSec)}, score ${fmtScore(modelA.score)}) vs ${modelB.name} (${fmtRate(modelB.inputPer1M)}/${fmtRate(modelB.outputPer1M)} per 1M, ${fmtSpeed(modelB.tokPerSec)}, score ${fmtScore(modelB.score)}).`;
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
  const pair = resolvePair(slug);

  if (!pair) {
    return (
      <SiteShell title="Model Comparison" subtitle="promptbill.online/compare">
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-700">
          Model comparison data is currently unavailable. Visit{' '}
          <Link href="/compare" className="font-semibold text-emerald-800 underline">
            /compare
          </Link>{' '}
          to browse available matchups.
        </div>
      </SiteShell>
    );
  }

  const { modelA, modelB } = pair;

  const rows: { label: string; aVal: string; bVal: string }[] = [
    { label: 'Composite Score', aVal: fmtScore(modelA.score), bVal: fmtScore(modelB.score) },
    { label: 'Score Provenance', aVal: modelA.benchmarkProvenance.status, bVal: modelB.benchmarkProvenance.status },
    { label: 'Elo Rating', aVal: fmtScore(modelA.elo), bVal: fmtScore(modelB.elo) },
    { label: 'Official Input / 1M Tokens', aVal: fmtRate(modelA.inputPer1M), bVal: fmtRate(modelB.inputPer1M) },
    { label: 'Cached Input / 1M Tokens', aVal: fmtRate(modelA.cachedInputPer1M), bVal: fmtRate(modelB.cachedInputPer1M) },
    { label: 'Cache Write / 1M Tokens', aVal: fmtRate(modelA.cacheWritePer1M), bVal: fmtRate(modelB.cacheWritePer1M) },
    { label: 'Official Output / 1M Tokens', aVal: fmtRate(modelA.outputPer1M), bVal: fmtRate(modelB.outputPer1M) },
    { label: 'Speed (Tokens / Sec)', aVal: fmtSpeed(modelA.tokPerSec), bVal: fmtSpeed(modelB.tokPerSec) },
    { label: 'Speed Provenance', aVal: modelA.speedProvenance.status, bVal: modelB.speedProvenance.status },
    { label: 'Context Window', aVal: modelA.contextWindow ?? 'N/A', bVal: modelB.contextWindow ?? 'N/A' },
    { label: 'Agentic (AG)', aVal: fmtMetric(modelA.ag), bVal: fmtMetric(modelB.ag) },
    { label: 'Coding (CO)', aVal: fmtMetric(modelA.co), bVal: fmtMetric(modelB.co) },
    { label: 'Reasoning (RE)', aVal: fmtMetric(modelA.re), bVal: fmtMetric(modelB.re) },
    { label: 'Multimodal (MM)', aVal: fmtMetric(modelA.mm), bVal: fmtMetric(modelB.mm) },
    { label: 'Knowledge (KN)', aVal: fmtMetric(modelA.kn), bVal: fmtMetric(modelB.kn) },
    { label: 'Multilingual (ML)', aVal: fmtMetric(modelA.ml), bVal: fmtMetric(modelB.ml) },
    { label: 'Instruction Following (IF)', aVal: fmtMetric(modelA.if), bVal: fmtMetric(modelB.if) },
    { label: 'Math (MA)', aVal: fmtMetric(modelA.ma), bVal: fmtMetric(modelB.ma) },
  ];

  return (
    <SiteShell
      title={`${modelA.name} vs ${modelB.name} — Pricing, Speed & Benchmarks`}
      subtitle={`promptbill.online/compare/${modelA.slug}-vs-${modelB.slug}`}
    >
      <article className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 space-y-6">
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-xs sm:text-sm text-slate-900 leading-relaxed space-y-1.5">
          <p>
            <strong>{modelA.name}</strong> ({modelA.provider}) · Score:{' '}
            <strong>{fmtScore(modelA.score)}</strong> · Official In/Out:{' '}
            <strong>
              {fmtRate(modelA.inputPer1M)}/{fmtRate(modelA.outputPer1M)}
            </strong>{' '}
            per 1M · Speed: <strong>{fmtSpeed(modelA.tokPerSec)}</strong>, compared to{' '}
            <strong>{modelB.name}</strong> ({modelB.provider}) · Score:{' '}
            <strong>{fmtScore(modelB.score)}</strong> · Official In/Out:{' '}
            <strong>
              {fmtRate(modelB.inputPer1M)}/{fmtRate(modelB.outputPer1M)}
            </strong>{' '}
            per 1M · Speed: <strong>{fmtSpeed(modelB.tokPerSec)}</strong>.
          </p>
          <p className="text-xs text-slate-700">
            Missing or unverified fields display as <code className="font-mono">N/A</code>. Best choice depends on your workload, prompt length, and task accuracy requirements. See{' '}
            <Link href="/methodology" className="font-semibold text-emerald-800 underline">
              Methodology
            </Link>
            .
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left border-collapse">
            <caption className="sr-only">
              Side-by-side comparison of {modelA.name} and {modelB.name} across scores, official API token prices, speed, context window, and task metrics.
            </caption>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100 text-xs sm:text-sm font-semibold text-slate-900">
                <th scope="col" className="py-3 px-3.5">Metric</th>
                <th scope="col" className="py-3 px-3.5">
                  <Link
                    href={`/models/${modelA.slug}`}
                    className="inline-flex min-h-[36px] items-center font-bold text-slate-900 underline hover:text-emerald-800"
                  >
                    {modelA.name}
                  </Link>
                </th>
                <th scope="col" className="py-3 px-3.5">
                  <Link
                    href={`/models/${modelB.slug}`}
                    className="inline-flex min-h-[36px] items-center font-bold text-slate-900 underline hover:text-emerald-800"
                  >
                    {modelB.name}
                  </Link>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs sm:text-sm font-mono">
              {rows.map((r, idx) => (
                <tr key={r.label} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <th scope="row" className="py-3 px-3.5 font-sans font-medium text-slate-800 text-left">
                    {r.label}
                  </th>
                  <td className="py-3 px-3.5 text-slate-950">{r.aVal}</td>
                  <td className="py-3 px-3.5 text-slate-950">{r.bVal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </SiteShell>
  );
}
