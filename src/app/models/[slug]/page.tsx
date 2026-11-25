import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ALL_MODELS, getModelBySlug } from '../../../lib/catalog';
import { SiteShell } from '../../../components/SiteShell';
import { ModelDetailCalculator } from '../../../components/ModelDetailCalculator';
import { REGISTRY_SNAPSHOT, computeDerivedMetrics } from '../../../lib/modelRegistry';
import { formatCurrency } from '../../../lib/pricingEngine';

export const revalidate = 60;

export function generateStaticParams() {
  return ALL_MODELS.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const model = getModelBySlug(slug);
  if (!model) return { title: 'Model Not Found' };
  const period = REGISTRY_SNAPSHOT.generatedMonthYear;
  const title = `${model.name} Pricing & Calculator (${period})`;
  const priceSummary =
    model.inputPer1M !== null && model.outputPer1M !== null
      ? `${formatCurrency(model.inputPer1M)}/${formatCurrency(model.outputPer1M)} per 1M tokens (${model.pricingProvenance.status})`
      : 'pricing details on PromptBill';
  const description = `${model.name} (${model.provider}) token rates (${priceSummary}), context window (${model.contextWindow ?? 'N/A'}), and cost calculator.`;
  return {
    title,
    description,
    alternates: { canonical: `https://promptbill.online/models/${model.slug}` },
  };
}

export default async function ModelDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const model = getModelBySlug(slug);
  if (!model) notFound();

  const period = REGISTRY_SNAPSHOT.generatedMonthYear;
  const derived = computeDerivedMetrics(
    model.score,
    model.inputPer1M,
    model.outputPer1M,
    model.tokPerSec
  );
  const legacyUpgrade = REGISTRY_SNAPSHOT.legacyUpgrades[model.slug];
  const isVerifiedPricing = model.pricingProvenance.status === 'Verified';
  const pricingHeadingLabel = isVerifiedPricing
    ? 'Verified Provider Rate Snapshot'
    : 'Estimated Rate Snapshot (Unverified)';

  return (
    <SiteShell
      title={`${model.name} Pricing & Benchmarks (${period})`}
      subtitle={`promptbill.online/models/${model.slug} · ${model.provider}`}
    >
      <article className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 space-y-6">
        {legacyUpgrade && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs sm:text-sm text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="inline-block rounded bg-amber-900 px-2 py-0.5 text-[11px] font-bold text-white">
                {legacyUpgrade.status}
              </span>
              <p className="font-medium leading-relaxed">
                <strong>Note:</strong> {legacyUpgrade.summary}
              </p>
            </div>
            <Link
              href={`/models/${legacyUpgrade.successorSlug}`}
              className="inline-flex min-h-[40px] shrink-0 items-center justify-center rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              View {legacyUpgrade.successorName} -&gt;
            </Link>
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs sm:text-sm text-slate-800 leading-relaxed space-y-2">
          <p>
            <strong>{model.name}</strong> ({model.provider}) · Score:{' '}
            <strong>{model.score !== null ? model.score.toFixed(1) : 'N/A'}</strong> (
            {model.benchmarkProvenance.status}) · Value:{' '}
            <strong>
              {derived.valueRatio !== null ? `${derived.valueRatio} Score/$` : 'N/A'}
            </strong>{' '}
            · Blended:{' '}
            <strong>
              {derived.blendedPricePer1M !== null
                ? `${formatCurrency(derived.blendedPricePer1M)}/1M`
                : 'N/A'}
            </strong>{' '}
            · Context: <strong>{model.contextWindow ?? 'N/A'}</strong> · Speed:{' '}
            <strong>
              {model.tokPerSec !== null ? `${model.tokPerSec} tok/s` : 'N/A'}
            </strong>{' '}
            ({model.speedProvenance.status}).
          </p>
          <p className="text-xs text-slate-700">
            <strong>{pricingHeadingLabel}:</strong> Input{' '}
            <span className="font-mono font-semibold text-slate-900">
              {formatCurrency(model.inputPer1M)}/1M
            </span>
            , Output{' '}
            <span className="font-mono font-semibold text-slate-900">
              {formatCurrency(model.outputPer1M)}/1M
            </span>
            , Cached Read{' '}
            <span className="font-mono font-semibold text-slate-900">
              {formatCurrency(model.cachedInputPer1M)}/1M
            </span>
            , Cache Write{' '}
            <span className="font-mono font-semibold text-slate-900">
              {formatCurrency(model.cacheWritePer1M)}/1M
            </span>{' '}
            (Status: {model.pricingProvenance.status}; verified date:{' '}
            {model.pricingProvenance.lastVerified ?? 'Not recorded'}).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <div className="text-xs text-slate-700">Benchmark Score</div>
            <div className="mt-1 font-mono text-xl font-bold text-slate-900">
              {model.score !== null ? model.score.toFixed(1) : 'N/A'}
            </div>
            <div className="text-xs text-slate-700">
              Status: {model.benchmarkProvenance.status} · Elo: {model.elo ?? 'N/A'}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <div className="text-xs text-slate-700">
              {isVerifiedPricing ? 'Verified Price (In / Out)' : 'Estimated Price (In / Out)'}
            </div>
            <div className="mt-1 font-mono text-xl font-bold text-slate-900">
              {model.inputPer1M !== null && model.outputPer1M !== null
                ? `$${model.inputPer1M.toFixed(2)} / $${model.outputPer1M.toFixed(2)}`
                : 'N/A'}
            </div>
            <div className="text-xs text-slate-700">
              Cached Read: {formatCurrency(model.cachedInputPer1M)}/1M
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <div className="text-xs text-slate-700">Context &amp; Speed</div>
            <div className="mt-1 font-mono text-xl font-bold text-slate-900">
              {model.contextWindow ?? 'N/A'}
            </div>
            <div className="text-xs text-slate-800 font-mono">
              Max Out: {model.maxOutputTokens ?? 'N/A'} ·{' '}
              {model.tokPerSec !== null ? `${model.tokPerSec} tok/s` : 'N/A'}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <div className="text-xs text-slate-700">Rate Limits &amp; Batch</div>
            <div className="mt-1 font-mono text-sm font-bold text-slate-900">
              {model.rpmLimit ?? 'N/A'}
            </div>
            <div className="text-xs text-slate-700 font-mono">
              Batch:{' '}
              {model.batchDiscount !== null
                ? `${Math.round(model.batchDiscount * 100)}%`
                : 'N/A'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center font-mono text-xs">
          {[
            ['AG (Agentic)', model.ag],
            ['CO (Coding)', model.co],
            ['RE (Reasoning)', model.re],
            ['MM (Multimodal)', model.mm],
            ['KN (Knowledge)', model.kn],
            ['ML (Multilingual)', model.ml],
            ['IF (Instruction)', model.if],
            ['MA (Math)', model.ma],
          ].map(([k, v]) => (
            <div key={String(k)} className="rounded-lg border border-slate-200 p-2.5 bg-white">
              <div className="text-[11px] font-sans text-slate-700">{k}</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                {typeof v === 'number' ? v : 'N/A'}
              </div>
            </div>
          ))}
        </div>

        {model.hostingEndpoints.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <caption className="sr-only">
                Endpoints and pricing entries for {model.name}
              </caption>
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/90 text-xs font-semibold text-slate-800">
                  <th scope="col" className="py-2.5 px-3">Endpoint</th>
                  <th scope="col" className="py-2.5 px-3">Type</th>
                  <th scope="col" className="py-2.5 px-3">In / Out ($/1M)</th>
                  <th scope="col" className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {model.hostingEndpoints.map((ep, i) => (
                  <tr key={`${ep.host}-${i}`} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                    <th scope="row" className="py-2.5 px-3 font-semibold text-slate-900 text-left">
                      {ep.host}
                    </th>
                    <td className="py-2.5 px-3 text-slate-700">{ep.providerType ?? 'N/A'}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-800">
                      {ep.inputPer1M !== null && ep.outputPer1M !== null
                        ? `$${ep.inputPer1M.toFixed(2)} / $${ep.outputPer1M.toFixed(2)}`
                        : 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{ep.evidenceStatus ?? 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <ModelDetailCalculator model={model} />

        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
          <Link
            href="/compare"
            className="inline-flex min-h-[36px] items-center text-emerald-800 underline"
          >
            Compare models -&gt;
          </Link>
          <Link
            href={`/providers/${model.providerSlug}`}
            className="inline-flex min-h-[36px] items-center text-slate-800 underline"
          >
            More {model.provider} models -&gt;
          </Link>
        </div>
      </article>
    </SiteShell>
  );
}
