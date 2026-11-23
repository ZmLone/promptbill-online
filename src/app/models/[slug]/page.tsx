import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ALL_MODELS, getModelBySlug } from '../../../lib/catalog';
import { SiteShell } from '../../../components/SiteShell';
import { ModelDetailCalculator } from '../../../components/ModelDetailCalculator';
import { REGISTRY_SNAPSHOT, computeDerivedMetrics } from '../../../lib/modelRegistry';

export function generateStaticParams() {
  return ALL_MODELS.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const model = getModelBySlug(slug);
  if (!model) return { title: 'Model Not Found - PromptBill' };
  const period = REGISTRY_SNAPSHOT.generatedMonthYear;
  const title = `${model.name} API Pricing, Prompt Caching, Batch & Cost Calculator (${period})`;
  const description = `${model.name} (${model.provider}) benchmarks, ${model.contextWindow} context window, cache read ($${model.cachedInputPer1M.toFixed(2)}/1M) & write rates, batch API discount, and cost calculator.`;
  return {
    title,
    description,
    alternates: { canonical: `https://promptbill.online/models/${model.slug}` },
  };
}

export default async function ModelDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const model = getModelBySlug(slug);
  if (!model) notFound();

  const period = REGISTRY_SNAPSHOT.generatedMonthYear;
  const derived = computeDerivedMetrics(model.score, model.inputPer1M, model.outputPer1M, model.tokPerSec);
  const estimatedCacheWritePer1M = model.inputPer1M * 1.25;
  const legacyUpgrade = REGISTRY_SNAPSHOT.legacyUpgrades[model.slug];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: model.name,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'API / Cloud',
    dateModified: REGISTRY_SNAPSHOT.lastModifiedIso,
    url: `https://promptbill.online/models/${model.slug}`,
    provider: {
      '@type': 'Organization',
      name: model.provider,
    },
    offers: {
      '@type': 'Offer',
      price: model.inputPer1M.toFixed(2),
      priceCurrency: 'USD',
      description: `Standard input $${model.inputPer1M.toFixed(2)}/1M, cached read $${model.cachedInputPer1M.toFixed(2)}/1M, output $${model.outputPer1M.toFixed(2)}/1M`,
    },
  };

  return (
    <SiteShell
      title={`${model.name} - Benchmarks, Specs, Price History & Cost Calculator (${period})`}
      subtitle={`promptbill.online/models/${model.slug} · ${model.provider} · Updated ${period}`}
    >
      <article className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 space-y-6">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {legacyUpgrade && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs sm:text-sm text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="inline-block rounded bg-amber-900 px-2 py-0.5 text-[11px] font-bold text-white">
                {legacyUpgrade.status}
              </span>
              <p className="font-medium leading-relaxed">
                <strong>Recommended Upgrade:</strong> {legacyUpgrade.summary}
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

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs sm:text-sm text-slate-800 leading-relaxed space-y-2">
          <p>
            <strong>{model.name}</strong> ({model.provider}) ranks <strong>#{model.rank}</strong> with a score of{' '}
            <strong>{model.score.toFixed(1)}</strong> (<strong>{derived.valueRatio} Score/$</strong> · blended{' '}
            <strong>${derived.blendedPricePer1M.toFixed(2)}/1M</strong>), <strong>{model.contextWindow}</strong> context window,{' '}
            <strong>{model.tokPerSec} tok/s</strong> speed, and API pricing of{' '}
            <strong>${model.inputPer1M.toFixed(2)} / 1M input</strong> and{' '}
            <strong>${model.outputPer1M.toFixed(2)} / 1M output</strong> ({model.evidence}).
          </p>
          <p className="text-xs text-slate-700">
            <strong>Caching, Batch &amp; Context Tier Summary:</strong> Cached input reads start at{' '}
            <span className="font-mono font-semibold text-slate-900">${model.cachedInputPer1M.toFixed(2)}/1M</span>{' '}
            (typical cache writes at <span className="font-mono font-semibold text-slate-900">${estimatedCacheWritePer1M.toFixed(2)}/1M</span>),
            asynchronous Batch API workloads typically receive up to <strong>50% discount</strong>, and prompts exceeding{' '}
            <strong>200K tokens</strong> on tiered long-context models may trigger higher long-context multipliers.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <div className="text-xs text-slate-700">Benchmark Score</div>
            <div className="mt-1 font-mono text-xl font-bold text-slate-900">{model.score.toFixed(1)}</div>
            <div className="text-xs text-slate-700">90% CI {model.interval} · Elo {model.elo}</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <div className="text-xs text-slate-700">API Price (In / Out)</div>
            <div className="mt-1 font-mono text-xl font-bold text-slate-900">${model.inputPer1M.toFixed(2)} / ${model.outputPer1M.toFixed(2)}</div>
            <div className="text-xs text-slate-700">Cached Input: ${model.cachedInputPer1M.toFixed(2)}/1M</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <div className="text-xs text-slate-700">Context &amp; Speed</div>
            <div className="mt-1 font-mono text-xl font-bold text-slate-900">{model.contextWindow}</div>
            <div className="text-xs text-emerald-800 font-mono">Max Out {model.maxOutputTokens} · {model.tokPerSec} tok/s</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <div className="text-xs text-slate-700">Rate Limits</div>
            <div className="mt-1 font-mono text-sm font-bold text-slate-900">{model.rpmLimit}</div>
            <div className="text-xs text-slate-700 font-mono">{model.tpmLimit} · {model.tpdLimit}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center font-mono text-xs">
          {[['AG (Agentic)', model.ag], ['CO (Coding)', model.co], ['RE (Reasoning)', model.re], ['MM (Multimodal)', model.mm], ['KN (Knowledge)', model.kn], ['ML (Multilingual)', model.ml], ['IF (Instruction)', model.if], ['MA (Math)', model.ma]].map(([k, v]) => (
            <div key={String(k)} className="rounded-lg border border-slate-200 p-2.5 bg-white">
              <div className="text-[11px] font-sans text-slate-700">{k}</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">{v}</div>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <caption className="sr-only">Historical API price timeline for {model.name}</caption>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/90 text-xs font-semibold text-slate-800">
                <th scope="col" className="py-2.5 px-3">Snapshot</th>
                <th scope="col" className="py-2.5 px-3">Input / 1M</th>
                <th scope="col" className="py-2.5 px-3">Output / 1M</th>
                <th scope="col" className="py-2.5 px-3">Pricing Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {model.priceHistory.map((h, i) => (
                <tr key={h.date} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                  <th scope="row" className="py-2.5 px-3 font-mono font-semibold text-slate-900 text-left">{h.date}</th>
                  <td className="py-2.5 px-3 font-mono text-slate-800">${h.inputPer1M.toFixed(2)}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-800">${h.outputPer1M.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-slate-700">{h.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ModelDetailCalculator model={model} />
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
          <Link href="/compare" className="inline-flex min-h-[36px] items-center text-emerald-800 underline">
            Browse head-to-head model comparisons -&gt;
          </Link>
          <Link href={`/providers/${model.providerSlug}`} className="inline-flex min-h-[36px] items-center text-slate-800 underline">
            More {model.provider} models -&gt;
          </Link>
        </div>
      </article>
    </SiteShell>
  );
}
