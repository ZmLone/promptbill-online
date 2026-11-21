import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ALL_MODELS, getModelBySlug } from '../../../lib/catalog';
import { SiteShell } from '../../../components/SiteShell';
import { ModelDetailCalculator } from '../../../components/ModelDetailCalculator';

export function generateStaticParams() {
  return ALL_MODELS.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const model = getModelBySlug(slug);
  if (!model) return { title: 'Model Not Found' };
  const shortTitle = `${model.name} Pricing, Benchmarks & Cost`;
  const description = `${model.name} (${model.provider}) benchmark score ${model.score}, ${model.contextWindow} context, ${model.rpmLimit} limits, price history, and 30-day calculator.`;
  return { title: shortTitle, description, alternates: { canonical: `https://promptbill.online/models/${model.slug}` } };
}

export default async function ModelDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const model = getModelBySlug(slug);
  if (!model) notFound();

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: model.name,
    applicationCategory: 'Large Language Model API',
    operatingSystem: 'Cloud API',
    url: `https://promptbill.online/models/${model.slug}`,
    offers: {
      '@type': 'Offer',
      price: model.inputPer1M.toFixed(2),
      priceCurrency: 'USD',
    },
  };

  return (
    <SiteShell title={`${model.name} — Benchmarks, Specs, Price History & Cost Calculator`} subtitle={`promptbill.online/models/${model.slug} · ${model.provider}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }} />
      <article className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 space-y-6">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs sm:text-sm text-slate-800 leading-relaxed">
          <strong>{model.name}</strong> ({model.provider}) ranks <strong>#{model.rank}</strong> with a score of <strong>{model.score.toFixed(1)}</strong>, <strong>{model.contextWindow}</strong> context window, <strong>{model.tokPerSec} tok/s</strong> speed, and API pricing of <strong>${model.inputPer1M.toFixed(2)} / 1M input</strong> and <strong>${model.outputPer1M.toFixed(2)} / 1M output</strong>.
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5"><div className="text-xs text-slate-500">Benchmark Score</div><div className="mt-1 font-mono text-xl font-bold text-slate-900">{model.score.toFixed(1)}</div><div className="text-xs text-slate-500">90% CI {model.interval} · Elo {model.elo}</div></div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5"><div className="text-xs text-slate-500">API Price (In / Out)</div><div className="mt-1 font-mono text-xl font-bold text-slate-900">${model.inputPer1M.toFixed(2)} / ${model.outputPer1M.toFixed(2)}</div><div className="text-xs text-slate-500">Cached Input: ${model.cachedInputPer1M.toFixed(2)}/1M</div></div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5"><div className="text-xs text-slate-500">Context &amp; Speed</div><div className="mt-1 font-mono text-xl font-bold text-slate-900">{model.contextWindow}</div><div className="text-xs text-emerald-700 font-mono">Max Out {model.maxOutputTokens} · {model.tokPerSec} tok/s</div></div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5"><div className="text-xs text-slate-500">Rate Limits</div><div className="mt-1 font-mono text-sm font-bold text-slate-900">{model.rpmLimit}</div><div className="text-xs text-slate-600 font-mono">{model.tpmLimit} · {model.tpdLimit}</div></div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center font-mono text-xs">
          {[['AG (Agentic)', model.ag], ['CO (Coding)', model.co], ['RE (Reasoning)', model.re], ['MM (Multimodal)', model.mm], ['KN (Knowledge)', model.kn], ['ML (Multilingual)', model.ml], ['IF (Instruction)', model.if], ['MA (Math)', model.ma]].map(([k, v]) => (
            <div key={String(k)} className="rounded-lg border border-slate-200 p-2.5 bg-white"><div className="text-[11px] font-sans text-slate-500">{k}</div><div className="text-base font-bold text-slate-900 mt-0.5">{v}</div></div>
          ))}
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <caption className="sr-only">Historical API price timeline for {model.name}</caption>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/90 text-xs font-semibold text-slate-700">
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
                  <td className="py-2.5 px-3 text-slate-600">{h.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ModelDetailCalculator model={model} />
        <div><Link href="/compare" className="text-xs font-semibold text-emerald-700 underline">Browse head-to-head model comparisons →</Link></div>
      </article>
    </SiteShell>
  );
}
