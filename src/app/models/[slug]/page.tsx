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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const model = getModelBySlug(slug);
  if (!model) return { title: 'Model Not Found — PromptBill' };
  const title = `${model.name} API Pricing, Benchmarks, Rate Limits & Cost Calculator (Nov 2026)`;
  const description = `${model.name} (${model.provider}) full benchmark breakdown (Score ${model.score}, Coding ${model.co}, Reasoning ${model.re}), ${model.contextWindow} context window, ${model.rpmLimit} / ${model.tpmLimit} rate limits, historical price drops, and 30-day API cost calculator.`;
  return {
    title,
    description,
    alternates: { canonical: `https://promptbill.online/models/${model.slug}` },
    openGraph: { title, description, url: `https://promptbill.online/models/${model.slug}`, siteName: 'PromptBill', type: 'article' },
  };
}

export default async function ModelDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const model = getModelBySlug(slug);
  if (!model) notFound();

  const peerModels = ALL_MODELS.filter((m) => m.slug !== model.slug).slice(0, 4);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: model.name,
        applicationCategory: 'Large Language Model API',
        operatingSystem: 'Cloud API',
        url: `https://promptbill.online/models/${model.slug}`,
        description: `${model.name} by ${model.provider}: ${model.bestFor}. Composite benchmark score ${model.score}, context window ${model.contextWindow}, speed ${model.tokPerSec} tokens/sec.`,
        brand: { '@type': 'Brand', name: model.provider },
        offers: {
          '@type': 'Offer',
          price: model.inputPer1M.toFixed(2),
          priceCurrency: 'USD',
          description: `$${model.inputPer1M.toFixed(2)} per 1M input tokens / $${model.outputPer1M.toFixed(2)} per 1M output tokens`,
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: `How much does ${model.name} API cost per 1M tokens?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `${model.name} costs $${model.inputPer1M.toFixed(2)} per 1M input tokens, $${model.cachedInputPer1M.toFixed(2)} per 1M cached input tokens, and $${model.outputPer1M.toFixed(2)} per 1M output tokens.`,
            },
          },
          {
            '@type': 'Question',
            name: `What is ${model.name}'s context window and rate limit?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `${model.name} supports a ${model.contextWindow} context window (up to ${model.maxOutputTokens} output tokens) with standard tier limits of ${model.rpmLimit} and ${model.tpmLimit}.`,
            },
          },
        ],
      },
    ],
  };

  return (
    <SiteShell
      title={`${model.name} — Benchmarks, Context Specs, Price History & Cost Calculator`}
      subtitle={`promptbill.online/models/${model.slug} · ${model.provider}`}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-6">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs sm:text-sm text-slate-800 leading-relaxed">
          <strong>{model.name}</strong> by <strong>{model.provider}</strong> ranks <strong>#{model.rank}</strong> on PromptBill with a calibrated score of <strong>{model.score.toFixed(1)}</strong> (90% CI {model.interval}), a <strong>{model.contextWindow}</strong> context window, <strong>{model.tokPerSec} tok/s</strong> throughput, and API pricing of <strong>${model.inputPer1M.toFixed(2)} / 1M input</strong> and <strong>${model.outputPer1M.toFixed(2)} / 1M output tokens</strong>.
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <div className="text-[11px] text-slate-500">Benchmark Score</div>
            <div className="mt-1 font-mono text-xl font-bold text-slate-900">{model.score.toFixed(1)}</div>
            <div className="text-[11px] text-slate-500">90% CI {model.interval} · Elo {model.elo}</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <div className="text-[11px] text-slate-500">API Price (In / Out)</div>
            <div className="mt-1 font-mono text-xl font-bold text-slate-900">${model.inputPer1M.toFixed(2)} / ${model.outputPer1M.toFixed(2)}</div>
            <div className="text-[11px] text-slate-500">Cached Input: ${model.cachedInputPer1M.toFixed(2)}/1M</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <div className="text-[11px] text-slate-500">Context Window Specs</div>
            <div className="mt-1 font-mono text-xl font-bold text-slate-900">{model.contextWindow}</div>
            <div className="text-[11px] text-slate-600 font-mono">Max Out: {model.maxOutputTokens} · {model.tokPerSec} tok/s</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <div className="text-[11px] text-slate-500">Standard Rate Limits</div>
            <div className="mt-1 font-mono text-sm font-bold text-slate-900">{model.rpmLimit}</div>
            <div className="text-[11px] text-slate-600 font-mono">{model.tpmLimit} · {model.tpdLimit}</div>
          </div>
        </div>

        <div className="space-y-2.5">
          <h2 className="text-base font-bold text-slate-900">Full Capability Benchmark Breakdown ({model.name})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center font-mono text-xs">
            {[['AG (Agentic)', model.ag], ['CO (Coding)', model.co], ['RE (Reasoning)', model.re], ['MM (Multimodal)', model.mm], ['KN (Knowledge)', model.kn], ['ML (Multilingual)', model.ml], ['IF (Instruction)', model.if], ['MA (Math)', model.ma]].map(([label, val]) => (
              <div key={String(label)} className="rounded-lg border border-slate-200 p-2.5 bg-white">
                <div className="text-[10px] font-sans text-slate-500">{label}</div>
                <div className="mt-0.5 text-base font-bold text-slate-900">{val}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2.5">
          <h2 className="text-base font-bold text-slate-900">Historical API Price Drops &amp; Rate Timeline</h2>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 uppercase text-slate-600">
                  <th className="py-2 px-3">Snapshot</th>
                  <th className="py-2 px-3">Input / 1M</th>
                  <th className="py-2 px-3">Output / 1M</th>
                  <th className="py-2 px-3">Pricing Change Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {model.priceHistory.map((h) => (
                  <tr key={h.date}>
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">{h.date}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-800">${h.inputPer1M.toFixed(2)}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-800">${h.outputPer1M.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-slate-600">{h.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <ModelDetailCalculator model={model} />

        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap gap-2">
            {peerModels.map((peer) => {
              const pairSlug = model.rank < peer.rank ? `${model.slug}-vs-${peer.slug}` : `${peer.slug}-vs-${model.slug}`;
              return (
                <Link key={peer.slug} href={`/compare/${pairSlug}`} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-medium text-slate-800 hover:bg-slate-100">
                  {model.name} vs {peer.name}
                </Link>
              );
            })}
          </div>
          <div className="flex gap-2">
            <Link href={`/providers/${model.providerSlug}`} className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-800 hover:bg-slate-50">
              All {model.provider} Models →
            </Link>
            <Link href="/compare" className="rounded-lg bg-slate-900 px-3 py-1.5 font-medium text-white hover:bg-slate-800">
              Compare Hub
            </Link>
          </div>
        </div>
      </article>
    </SiteShell>
  );
}
