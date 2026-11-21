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
  if (!model) return { title: 'Model Not Found — PromptBill' };
  const title = `${model.name} API Pricing, Benchmarks, Rate Limits & Cost Calculator (Nov 2026)`;
  const description = `${model.name} (${model.provider}) benchmark breakdown, ${model.contextWindow} context window, ${model.rpmLimit} limits, price history, and cost calculator.`;
  return { title, description, alternates: { canonical: `https://promptbill.online/models/${model.slug}` } };
}

export default async function ModelDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const model = getModelBySlug(slug);
  if (!model) notFound();

  return (
    <SiteShell title={`${model.name} — Benchmarks, Specs, Price History & Cost Calculator`} subtitle={`promptbill.online/models/${model.slug} · ${model.provider}`}>
      <article className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5"><div className="text-[11px] text-slate-500">Score</div><div className="mt-1 font-mono text-xl font-bold text-slate-900">{model.score.toFixed(1)}</div><div className="text-[11px] text-slate-500">90% CI {model.interval} · Elo {model.elo}</div></div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5"><div className="text-[11px] text-slate-500">Price (In / Out)</div><div className="mt-1 font-mono text-xl font-bold text-slate-900">${model.inputPer1M.toFixed(2)} / ${model.outputPer1M.toFixed(2)}</div><div className="text-[11px] text-slate-500">Cache ${model.cachedInputPer1M.toFixed(2)}/1M</div></div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5"><div className="text-[11px] text-slate-500">Context &amp; Speed</div><div className="mt-1 font-mono text-xl font-bold text-slate-900">{model.contextWindow}</div><div className="text-[11px] text-emerald-700 font-mono">{model.tokPerSec} tok/s</div></div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5"><div className="text-[11px] text-slate-500">Rate Limits</div><div className="mt-1 font-mono text-sm font-bold text-slate-900">{model.rpmLimit}</div><div className="text-[11px] text-slate-600 font-mono">{model.tpmLimit}</div></div>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 text-center font-mono text-xs">
          {[['AG', model.ag], ['CO', model.co], ['RE', model.re], ['MM', model.mm], ['KN', model.kn], ['ML', model.ml], ['IF', model.if], ['MA', model.ma]].map(([k, v]) => (
            <div key={String(k)} className="rounded-lg border border-slate-200 p-2.5 bg-white"><div className="text-[10px] text-slate-400">{k}</div><div className="text-sm font-bold text-slate-900">{v}</div></div>
          ))}
        </div>
        <ModelDetailCalculator model={model} />
        <div><Link href="/compare" className="text-xs font-semibold text-emerald-700 underline">Browse head-to-head model comparisons →</Link></div>
      </article>
    </SiteShell>
  );
}
